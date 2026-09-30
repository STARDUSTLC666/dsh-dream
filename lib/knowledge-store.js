/**
 * dsh-dream 知识存储：events.jsonl 为权威追加日志，evidence.jsonl 追加证据，
 * index.json 为可丢弃重建的派生索引（含 checkpoint），.lock 为短期文件锁。
 *
 * 设计要点：
 * - 幂等：同 idempotencyKey + 同 requestHash 重复调用返回首次结果且不写新事件；
 *   同 key 异 payload → KnowledgeError('duplicate')。
 * - revision 守卫：expectedRevision 不符抛 KnowledgeError('revision')（details 带 currentRevision），不写盘。
 * - 崩溃安全：单行追加 + 单行 JSON.parse 容错；坏行/孤儿事件/未知 schemaVersion 分开计数。
 * - 有界回放：events.jsonl 超过 maxReplayEvents 行时 truncated=true；
 *   index.json 的 checkpoint（lastEventOffset/lastEventBytes/lastEventId/前缀哈希）让读路径
 *   "快照 + 尾部增量"，截断不再丢实体；checkpoint 失效回退全量回放；rebuildIndex() 权威重建。
 * - 写路径在状态不完整/截断时自动做一次完整回放，避免"看不到旧实体就无法更新"。
 * - 只读方法（listLessons/listEvidence/getLesson/stats/diagnose）绝不建目录、绝不写盘。
 * - 新写盘路径在 maskSecrets 开启（默认）时统一过 mask.ts。
 *
 * @module dsh-dream/knowledge-store
 */
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync, writeSync, } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { KnowledgeError, canTransition, evidenceNaturalKey, evidenceSessionKey, lessonFingerprint, mergeEvidenceSupport, validateEvidence, validateLesson, } from './knowledge.js';
import { maskSecrets } from './mask.js';
/** events.jsonl 默认最多回放的行数（有界读取）。 */
export const MAX_REPLAY_EVENTS = 200000;
const PREFIX_HASH_BYTES = 64 * 1024;
const LAST_LINE_WINDOW_BYTES = 64 * 1024;
const TOUCH_EVERY_LINES = 4096;
/** 本进程 boot 标识，用于锁的 PID 复用判别。 */
const BOOT_ID = randomUUID();
const LESSON_STATES = ['candidate', 'usable', 'disputed', 'stale', 'rejected'];
const REVIEW_DECISIONS = ['unreviewed', 'accepted', 'rejected'];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isEnum(value, allowed) {
    return typeof value === 'string' && allowed.includes(value);
}
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function sleepSync(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function isProcessAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (error) {
        return error.code === 'EPERM';
    }
}
function stableStringify(value) {
    if (value === null || typeof value !== 'object') {
        const text = JSON.stringify(value);
        return text === undefined ? 'null' : text;
    }
    if (Array.isArray(value))
        return '[' + value.map((item) => stableStringify(item)).join(',') + ']';
    const record = value;
    return '{' + Object.keys(record).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(record[key])).join(',') + '}';
}
/** 读取锁信息；绝不修改文件。 */
function readLockInfo(lockPath, staleMs) {
    let raw;
    try {
        raw = readFileSync(lockPath, 'utf8');
    }
    catch {
        return { present: false, stale: false };
    }
    let at = Date.now();
    try {
        at = statSync(lockPath).mtimeMs;
    }
    catch {
        // 用文件 mtime 判断年龄失败时退回 now
    }
    let pid;
    let bootId;
    let token;
    try {
        const parsed = JSON.parse(raw);
        if (isRecord(parsed)) {
            const rawPid = parsed.pid;
            if (typeof rawPid === 'number' && Number.isInteger(rawPid) && rawPid > 0)
                pid = rawPid;
            if (typeof parsed.bootId === 'string')
                bootId = parsed.bootId;
            if (typeof parsed.token === 'string')
                token = parsed.token;
            const rawAt = parsed.at;
            if (typeof rawAt === 'string') {
                const parsedAt = Date.parse(rawAt);
                if (!Number.isNaN(parsedAt))
                    at = parsedAt;
            }
        }
    }
    catch {
        // 内容损坏：无法验证所有者，只能用文件 mtime 判断年龄
    }
    const ageMs = Date.now() - at;
    const alive = pid === undefined ? undefined : isProcessAlive(pid);
    const stale = ageMs > staleMs && (pid === undefined || alive === false);
    return { present: true, ageMs, pid, alive, bootId, token, stale, raw };
}
function refreshLock(lockPath, token) {
    try {
        const parsed = JSON.parse(readFileSync(lockPath, 'utf8'));
        if (!isRecord(parsed) || parsed.token !== token)
            return;
        writeFileSync(lockPath, JSON.stringify({ pid: process.pid, at: new Date().toISOString(), token, bootId: BOOT_ID }));
    }
    catch {
        // 锁已被接管/删除：心跳失败不覆盖他人锁
    }
}
/** 释放自己持有的锁：token 不匹配或内容不可读时不删，避免误删他人锁。 */
function releaseLock(lockPath, token) {
    try {
        const parsed = JSON.parse(readFileSync(lockPath, 'utf8'));
        if (!isRecord(parsed) || parsed.token !== token)
            return;
    }
    catch {
        return;
    }
    try {
        unlinkSync(lockPath);
    }
    catch {
        // 已被他人清理或无权删除：保持现状
    }
}
function holderDetails(info) {
    const details = {};
    if (info.pid !== undefined)
        details.holderPid = info.pid;
    if (info.ageMs !== undefined)
        details.ageMs = Math.round(info.ageMs);
    if (info.bootId !== undefined)
        details.holderBootId = info.bootId;
    return details;
}
/** 获取短期文件锁；失败抛 KnowledgeError('io')。超硬上限且心跳停滞时不静默抢占。 */
function acquireLock(lockPath, options) {
    const token = randomUUID();
    const deadline = Date.now() + options.timeoutMs;
    for (;;) {
        let acquired = false;
        try {
            const fd = openSync(lockPath, 'wx');
            try {
                writeSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString(), token, bootId: BOOT_ID }));
            }
            finally {
                closeSync(fd);
            }
            acquired = true;
        }
        catch (error) {
            const code = error.code;
            if (code !== 'EEXIST')
                throw new KnowledgeError('io', '获取知识库锁失败：' + errorMessage(error));
        }
        if (acquired) {
            const heartbeat = setInterval(() => refreshLock(lockPath, token), options.heartbeatMs);
            if (typeof heartbeat.unref === 'function')
                heartbeat.unref();
            return {
                release: () => {
                    clearInterval(heartbeat);
                    releaseLock(lockPath, token);
                },
                touch: () => refreshLock(lockPath, token),
            };
        }
        const info = readLockInfo(lockPath, options.staleMs);
        if (info.stale) {
            // TOCTOU：删除前再确认内容没有变化（他人刚接管/刷新则重新判断）。
            const recheck = readLockInfo(lockPath, options.staleMs);
            if (recheck.raw === info.raw) {
                try {
                    unlinkSync(lockPath);
                    continue;
                }
                catch (error) {
                    const code = error.code;
                    if (code === 'ENOENT')
                        continue;
                    if (Date.now() >= deadline) {
                        throw new KnowledgeError('io', '检测到过期知识库锁但无法接管：' + errorMessage(error), holderDetails(info));
                    }
                }
            }
            sleepSync(25);
            continue;
        }
        if (info.present && info.pid !== undefined && info.alive === true && (info.ageMs ?? 0) > options.hardLimitMs) {
            throw new KnowledgeError('io', '知识库锁被进程 ' + info.pid + ' 持有 ' + Math.round(info.ageMs ?? 0) + 'ms（超过硬上限 ' + options.hardLimitMs + 'ms 且心跳停滞）；请结束该进程后重试，或确认无人写入后手动删除 ' + lockPath, holderDetails(info));
        }
        if (Date.now() >= deadline) {
            if (info.present) {
                throw new KnowledgeError('io', '知识库被其他进程占用（pid=' + (info.pid === undefined ? '未知' : String(info.pid)) + '，age=' + Math.round(info.ageMs ?? 0) + 'ms），请稍后重试', holderDetails(info));
            }
            throw new KnowledgeError('io', '获取知识库锁超时，请稍后重试');
        }
        sleepSync(25);
    }
}
const KNOWN_EVENT_KINDS = new Set(['lesson.create', 'lesson.update', 'lesson.review', 'lesson.batch', 'evidence.add']);
/** 事件行形状检查（字段值再做 schema 校验）。 */
function isEventShape(value) {
    if (!isRecord(value) || value.schemaVersion !== 1)
        return false;
    if (typeof value.id !== 'string' || value.id === '')
        return false;
    if (typeof value.at !== 'string' || value.at === '')
        return false;
    if (typeof value.idempotencyKey !== 'string' || value.idempotencyKey === '')
        return false;
    switch (value.kind) {
        case 'lesson.create':
            return typeof value.lessonId === 'string' && value.lessonId !== '' && value.payload !== undefined;
        case 'lesson.update':
        case 'lesson.review':
            return (typeof value.lessonId === 'string' &&
                value.lessonId !== '' &&
                typeof value.revision === 'number' &&
                Number.isInteger(value.revision) &&
                value.payload !== undefined);
        case 'lesson.batch': {
            if (!isRecord(value.payload) || !Array.isArray(value.payload.updates))
                return false;
            return value.payload.updates.every((item) => isRecord(item) &&
                typeof item.lessonId === 'string' &&
                item.lessonId !== '' &&
                typeof item.revision === 'number' &&
                Number.isInteger(item.revision) &&
                isRecord(item.patch));
        }
        case 'evidence.add':
            return value.payload !== undefined;
        default:
            return false;
    }
}
/** 事件 / 证据行是否携带非当前 schemaVersion（R7：独立计 unsupportedVersions）。 */
function hasUnsupportedSchema(value) {
    if (!isRecord(value))
        return false;
    const version = value.schemaVersion;
    if (typeof version === 'number' && version !== 1)
        return true;
    const payload = value.payload;
    if (isRecord(payload)) {
        const payloadVersion = payload.schemaVersion;
        if (typeof payloadVersion === 'number' && payloadVersion !== 1)
            return true;
    }
    return false;
}
function emptyStateCounts() {
    return { candidate: 0, usable: 0, disputed: 0, stale: 0, rejected: 0 };
}
function createEmptyReplayState() {
    return {
        lessons: new Map(),
        evidence: new Map(),
        idempotency: new Map(),
        events: 0,
        replayedEvents: 0,
        badLines: 0,
        orphanEvents: 0,
        unsupportedVersions: 0,
        skippedEvents: 0,
        replayMode: 'full',
        idempotencyComplete: true,
        entitiesFromSnapshot: false,
        snapshotEvidenceCount: 0,
    };
}
/**
 * 经验知识存储。无文件时所有读取方法安全返回空，写入方法在首次写入时自建目录。
 */
export class KnowledgeStore {
    dir;
    eventsPath;
    evidencePath;
    indexPath;
    lockPath;
    mask;
    maxReplayEvents;
    lockTimeoutMs;
    lockStaleMs;
    lockHardLimitMs;
    lockHeartbeatMs;
    lastIndexError;
    constructor(knowledgeDir, options = {}) {
        if (typeof knowledgeDir !== 'string' || knowledgeDir.trim() === '') {
            throw new KnowledgeError('invalid', 'knowledgeDir 必须是非空字符串');
        }
        const maxReplay = typeof options.maxReplayEvents === 'number' && Number.isFinite(options.maxReplayEvents)
            ? Math.max(1, Math.floor(options.maxReplayEvents))
            : MAX_REPLAY_EVENTS;
        const numberOption = (value, fallback) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
        this.dir = knowledgeDir;
        this.eventsPath = join(knowledgeDir, 'events.jsonl');
        this.evidencePath = join(knowledgeDir, 'evidence.jsonl');
        this.indexPath = join(knowledgeDir, 'index.json');
        this.lockPath = join(knowledgeDir, '.lock');
        this.mask = options.maskSecrets !== false;
        this.maxReplayEvents = maxReplay;
        this.lockTimeoutMs = numberOption(options.lockTimeoutMs, 2000);
        this.lockStaleMs = numberOption(options.lockStaleMs, 30000);
        this.lockHardLimitMs = numberOption(options.lockHardLimitMs, 600000);
        this.lockHeartbeatMs = Math.max(10, numberOption(options.lockHeartbeatMs, 5000));
    }
    /** 全部经验，按 updatedAt 降序（同刻按 id 稳定排序）。 */
    listLessons() {
        const state = this.loadEvents();
        return Array.from(state.lessons.values())
            .map((lesson) => clone(lesson))
            .sort((a, b) => (a.updatedAt === b.updatedAt ? a.id.localeCompare(b.id) : b.updatedAt.localeCompare(a.updatedAt)));
    }
    /** 全部证据，按 observedAt 升序（同刻按 id 稳定排序）。 */
    listEvidence() {
        const state = this.loadAll();
        return Array.from(state.evidence.values())
            .map((item) => clone(item))
            .sort((a, b) => (a.observedAt === b.observedAt ? a.id.localeCompare(b.id) : a.observedAt.localeCompare(b.observedAt)));
    }
    /** 按 id 取经验；不存在返回 undefined。 */
    getLesson(id) {
        const state = this.loadEvents();
        const lesson = state.lessons.get(id);
        return lesson === undefined ? undefined : clone(lesson);
    }
    /** 追加证据；同 sessionId+recordSeq 或同 sourceHash 视为重复，返回已有记录且不写。 */
    appendEvidence(input) {
        if (!isRecord(input))
            throw new KnowledgeError('invalid', '证据输入必须是对象');
        return this.withLock((touch) => {
            const state = this.loadCompleteState(touch);
            const existing = this.findEvidenceByNaturalKey(state, input);
            if (existing !== undefined)
                return { evidence: clone(existing), created: false };
            const created = this.persistEvidenceLocked(input, state);
            return { evidence: clone(created), created: true };
        });
    }
    /**
     * 创建候选经验。同 idempotencyKey + 同 requestHash 幂等；同指纹（文本 + 范围相同）确定性合并，
     * 只把新证据并入已有经验，不新增经验。
     * 经调用方核验的 read 来源可用于项目经验；来源读取不代表用户采纳，review 始终 unreviewed。
     */
    createLesson(input, idempotencyKey, options = {}) {
        assertIdempotencyKey(idempotencyKey);
        if (!isRecord(input))
            throw new KnowledgeError('invalid', '经验输入必须是对象');
        if (input.evidence !== undefined && !Array.isArray(input.evidence)) {
            throw new KnowledgeError('invalid', 'evidence 必须是数组');
        }
        const evidenceInputs = input.evidence === undefined ? [] : input.evidence;
        const requestHash = this.hashRequest({
            operation: 'lesson.create',
            ...(options.requireReview === true ? { requireReview: true } : {}),
            kind: input.kind === undefined ? null : input.kind,
            title: input.title === undefined ? null : input.title,
            action: input.action === undefined ? null : input.action,
            when: input.when === undefined ? null : input.when,
            exceptions: input.exceptions === undefined ? null : input.exceptions,
            projectId: input.projectId === undefined ? null : input.projectId,
            workspaceRoot: input.workspaceRoot === undefined ? null : input.workspaceRoot,
            global: input.global === true,
            applicability: input.applicability === undefined ? null : input.applicability,
            evidence: evidenceInputs,
            conflictIds: input.conflictIds === undefined ? null : input.conflictIds,
        });
        return this.withLock((touch) => {
            const state = this.loadCompleteState(touch);
            const cached = state.idempotency.get(idempotencyKey);
            if (cached !== undefined) {
                this.assertSameRequest(cached, requestHash, idempotencyKey);
                const lesson = this.resolveIdempotentLesson(state, idempotencyKey);
                if (lesson === undefined) {
                    throw new KnowledgeError('io', '无法恢复幂等键的历史结果（events.jsonl 可能被删改）：' + idempotencyKey, { idempotencyKey });
                }
                return { lesson, created: false };
            }
            const scope = { global: input.global === true };
            if (typeof input.projectId === 'string' && input.projectId.trim() !== '')
                scope.projectId = input.projectId;
            if (typeof input.workspaceRoot === 'string' && input.workspaceRoot.trim() !== '')
                scope.workspaceRoot = input.workspaceRoot;
            const now = new Date().toISOString();
            validateLesson({
                schemaVersion: 1,
                id: 'lsn_probe',
                revision: 1,
                kind: input.kind,
                title: input.title,
                action: input.action,
                when: input.when,
                exceptions: input.exceptions === undefined ? [] : input.exceptions,
                scope,
                applicability: input.applicability === undefined ? [] : input.applicability,
                state: 'candidate',
                evidenceIds: [],
                independentSupportCount: 0,
                review: { decision: 'unreviewed' },
                createdAt: now,
                updatedAt: now,
                conflictIds: input.conflictIds === undefined ? [] : input.conflictIds,
            });
            const fingerprint = lessonFingerprint({
                kind: input.kind,
                title: typeof input.title === 'string' ? input.title : undefined,
                action: typeof input.action === 'string' ? input.action : '',
                when: typeof input.when === 'string' ? input.when : '',
                scope,
            });
            const existing = Array.from(state.lessons.values()).find((lesson) => lessonFingerprint(lesson) === fingerprint);
            const appended = [];
            for (const raw of evidenceInputs)
                appended.push(this.persistEvidenceLocked(raw, state));
            if (existing !== undefined) {
                const newIds = appended.map((item) => item.id).filter((id) => !existing.evidenceIds.includes(id));
                const mergedIds = existing.evidenceIds.concat(newIds);
                const mergedEvidence = mergedIds
                    .map((id) => state.evidence.get(id))
                    .filter((item) => item !== undefined);
                const hasRead = mergedEvidence.some((item) => item.verification === 'read');
                const patch = {};
                if (newIds.length > 0) {
                    patch.evidenceIds = mergedIds;
                }
                const supportCount = mergeEvidenceSupport({ evidenceIds: mergedIds }, Array.from(state.evidence.values()));
                if (supportCount !== existing.independentSupportCount)
                    patch.independentSupportCount = supportCount;
                // R2′：候选经验遇到 read 证据可升为 usable；disputed/stale/rejected 状态保持不变。
                if (existing.state === 'candidate' && hasRead && !options.requireReview) {
                    patch.state = 'usable';
                    if (existing.review.decision !== 'unreviewed') {
                        patch.review = { decision: 'unreviewed' };
                    }
                }
                if (Object.keys(patch).length === 0)
                    return { lesson: clone(existing), created: false };
                const merged = this.appendLessonUpdate(state, existing, patch, idempotencyKey, requestHash, touch);
                return { lesson: clone(merged), created: false };
            }
            const evidenceIds = appended.map((item) => item.id);
            const allEvidence = evidenceIds
                .map((id) => state.evidence.get(id))
                .filter((item) => item !== undefined);
            const hasRead = allEvidence.some((item) => item.verification === 'read');
            const initialState = hasRead && !options.requireReview ? 'usable' : 'candidate';
            const initialReview = { decision: 'unreviewed' };
            const lesson = validateLesson({
                schemaVersion: 1,
                id: 'lsn_' + randomUUID(),
                revision: 1,
                kind: input.kind,
                title: input.title,
                action: input.action,
                when: input.when,
                exceptions: input.exceptions === undefined ? [] : input.exceptions,
                scope,
                applicability: input.applicability === undefined ? [] : input.applicability,
                state: initialState,
                evidenceIds,
                independentSupportCount: mergeEvidenceSupport({ evidenceIds }, Array.from(state.evidence.values())),
                review: initialReview,
                createdAt: now,
                updatedAt: now,
                conflictIds: input.conflictIds === undefined ? [] : input.conflictIds,
            });
            const stored = this.maskLesson(lesson);
            const event = {
                schemaVersion: 1,
                id: 'evt_' + randomUUID(),
                at: now,
                kind: 'lesson.create',
                lessonId: stored.id,
                idempotencyKey,
                requestHash,
                payload: stored,
            };
            this.appendEvent(state, event);
            state.lessons.set(stored.id, stored);
            if (!state.idempotency.has(idempotencyKey)) {
                state.idempotency.set(idempotencyKey, { lessonId: stored.id, requestHash, lesson: stored });
            }
            this.writeIndex(state, touch);
            return { lesson: clone(stored), created: true };
        });
    }
    /** 追加证据与更新引用共用一把锁；先检查 revision 与全部输入，不改变审阅状态。 */
    attachEvidence(id, inputs, expectedRevision, idempotencyKey) {
        assertIdempotencyKey(idempotencyKey);
        if (!Array.isArray(inputs) || inputs.length === 0)
            throw new KnowledgeError('invalid', 'attach-evidence 需要非空 evidence 数组');
        const requestHash = this.hashRequest({ operation: 'lesson.attach-evidence', id, inputs });
        return this.withLock((touch) => {
            const state = this.loadCompleteState(touch);
            const cached = state.idempotency.get(idempotencyKey);
            if (cached) {
                this.assertSameRequest(cached, requestHash, idempotencyKey);
                const lesson = this.resolveIdempotentLesson(state, idempotencyKey);
                if (!lesson)
                    throw new KnowledgeError('io', '无法恢复追加证据结果');
                return lesson;
            }
            const previous = state.lessons.get(id);
            if (!previous)
                throw new KnowledgeError('invalid', '经验不存在：' + id);
            if (previous.revision !== expectedRevision)
                throw new KnowledgeError('revision', '经验 revision 已变化', { currentRevision: previous.revision });
            for (const item of inputs)
                validateEvidence({ ...item, id: 'evd_probe', schemaVersion: 1, observedAt: item.observedAt ?? new Date().toISOString() });
            const ids = [...previous.evidenceIds];
            for (const item of inputs) {
                const evidence = this.persistEvidenceLocked(item, state);
                if (!ids.includes(evidence.id))
                    ids.push(evidence.id);
            }
            const count = mergeEvidenceSupport({ evidenceIds: ids }, [...state.evidence.values()]);
            if (ids.length === previous.evidenceIds.length && count === previous.independentSupportCount)
                return clone(previous);
            return clone(this.appendLessonUpdate(state, previous, { evidenceIds: ids, independentSupportCount: count }, idempotencyKey, requestHash, touch));
        });
    }
    /** 按 patch 更新经验；revision 不符抛 KnowledgeError('revision')（details 带 currentRevision）且不写。 */
    updateLesson(id, patch, expectedRevision, idempotencyKey) {
        assertIdempotencyKey(idempotencyKey);
        if (!isRecord(patch))
            throw new KnowledgeError('invalid', 'patch 必须是对象');
        const requestHash = this.hashRequest({ operation: 'lesson.update', lessonId: id, patch: this.hashablePatch(patch) });
        return this.withLock((touch) => {
            const state = this.loadCompleteState(touch);
            const cached = state.idempotency.get(idempotencyKey);
            if (cached !== undefined) {
                this.assertSameRequest(cached, requestHash, idempotencyKey);
                const lesson = this.resolveIdempotentLesson(state, idempotencyKey);
                if (lesson === undefined)
                    throw new KnowledgeError('io', '无法恢复幂等键的历史结果：' + idempotencyKey, { idempotencyKey });
                return lesson;
            }
            const lesson = state.lessons.get(id);
            if (lesson === undefined)
                throw new KnowledgeError('invalid', '经验不存在：' + id, { lessonId: id });
            if (lesson.revision !== expectedRevision) {
                throw new KnowledgeError('revision', '经验 ' + id + ' 期望 revision ' + expectedRevision + '，实际 ' + lesson.revision, {
                    lessonId: id,
                    expectedRevision,
                    currentRevision: lesson.revision,
                });
            }
            const clean = this.cleanPatch(patch);
            if (clean.state !== undefined && clean.state !== lesson.state && !canTransition(lesson.state, clean.state)) {
                throw new KnowledgeError('invalid', '不允许的状态迁移：' + lesson.state + ' → ' + clean.state, { lessonId: id });
            }
            if (clean.evidenceIds !== undefined) {
                clean.independentSupportCount = mergeEvidenceSupport({ evidenceIds: clean.evidenceIds }, Array.from(state.evidence.values()));
            }
            return clone(this.appendLessonUpdate(state, lesson, clean, idempotencyKey, requestHash, touch));
        });
    }
    /** 审阅经验：accepted → usable，rejected → rejected，unreviewed → candidate。 */
    reviewLesson(id, decision, expectedRevision, idempotencyKey, actor, note, resolution) {
        assertIdempotencyKey(idempotencyKey);
        if (!isEnum(decision, REVIEW_DECISIONS))
            throw new KnowledgeError('invalid', 'review decision 取值不合法');
        const maskedActor = actor === undefined ? undefined : this.mask ? maskSecrets(actor) : actor;
        const maskedNote = note === undefined ? undefined : this.mask ? maskSecrets(note) : note;
        const requestHash = this.hashRequest({
            operation: 'lesson.review',
            lessonId: id,
            decision,
            actor: maskedActor === undefined ? null : maskedActor,
            note: maskedNote === undefined ? null : maskedNote,
            resolution: resolution === undefined ? null : resolution,
        });
        return this.withLock((touch) => {
            const state = this.loadCompleteState(touch);
            const cached = state.idempotency.get(idempotencyKey);
            if (cached !== undefined) {
                this.assertSameRequest(cached, requestHash, idempotencyKey);
                const lesson = this.resolveIdempotentLesson(state, idempotencyKey);
                if (lesson === undefined)
                    throw new KnowledgeError('io', '无法恢复幂等键的历史结果：' + idempotencyKey, { idempotencyKey });
                return lesson;
            }
            const lesson = state.lessons.get(id);
            if (lesson === undefined)
                throw new KnowledgeError('invalid', '经验不存在：' + id, { lessonId: id });
            if (lesson.revision !== expectedRevision) {
                throw new KnowledgeError('revision', '经验 ' + id + ' 期望 revision ' + expectedRevision + '，实际 ' + lesson.revision, {
                    lessonId: id,
                    expectedRevision,
                    currentRevision: lesson.revision,
                });
            }
            const nextState = decision === 'accepted' ? 'usable' : decision === 'rejected' ? 'rejected' : 'candidate';
            if (nextState !== lesson.state && !canTransition(lesson.state, nextState)) {
                throw new KnowledgeError('invalid', '不允许的审阅迁移：' + lesson.state + ' → ' + nextState, { lessonId: id });
            }
            const now = new Date().toISOString();
            const nextReview = { decision, at: now };
            if (maskedActor !== undefined)
                nextReview.actor = maskedActor;
            if (maskedNote !== undefined)
                nextReview.note = maskedNote;
            if (resolution !== undefined)
                nextReview.resolution = resolution;
            const merged = validateLesson({
                ...lesson,
                state: nextState,
                review: nextReview,
                revision: lesson.revision + 1,
                updatedAt: now,
            });
            const payload = { decision, state: nextState };
            if (maskedActor !== undefined)
                payload.actor = maskedActor;
            if (maskedNote !== undefined)
                payload.note = maskedNote;
            if (resolution !== undefined)
                payload.resolution = resolution;
            const event = {
                schemaVersion: 1,
                id: 'evt_' + randomUUID(),
                at: now,
                kind: 'lesson.review',
                lessonId: lesson.id,
                revision: merged.revision,
                idempotencyKey,
                requestHash,
                payload,
            };
            this.appendEvent(state, event);
            state.lessons.set(merged.id, merged);
            if (!state.idempotency.has(idempotencyKey)) {
                state.idempotency.set(idempotencyKey, { lessonId: merged.id, requestHash, lesson: merged });
            }
            this.writeIndex(state, touch);
            return clone(merged);
        });
    }
    /**
     * 批量原子更新（M2-②）：一个事件承载全部变更；先统一校验，
     * 任一条不通过 → 零写入并抛 KnowledgeError（details.failedId）。
     */
    updateLessonsBatch(updates, idempotencyKey) {
        assertIdempotencyKey(idempotencyKey);
        if (!Array.isArray(updates) || updates.length === 0)
            throw new KnowledgeError('invalid', 'updates 必须是非空数组');
        for (const update of updates) {
            if (!isRecord(update) || typeof update.id !== 'string' || update.id.trim() === '' || !isRecord(update.patch)) {
                throw new KnowledgeError('invalid', 'updates 每项必须包含 id/patch/expectedRevision');
            }
            if (typeof update.expectedRevision !== 'number' || !Number.isInteger(update.expectedRevision)) {
                throw new KnowledgeError('invalid', 'expectedRevision 必须是整数', { failedId: update.id });
            }
        }
        const requestHash = this.hashRequest({
            operation: 'lesson.batch',
            updates: updates.map((update) => ({ id: update.id, expectedRevision: update.expectedRevision, patch: this.hashablePatch(update.patch) })),
        });
        return this.withLock((touch) => {
            const state = this.loadCompleteState(touch);
            const cached = state.idempotency.get(idempotencyKey);
            if (cached !== undefined) {
                this.assertSameRequest(cached, requestHash, idempotencyKey);
                const batch = this.resolveIdempotentBatch(state, idempotencyKey);
                if (batch === undefined)
                    throw new KnowledgeError('io', '无法恢复批量幂等键的历史结果：' + idempotencyKey, { idempotencyKey });
                return batch;
            }
            const now = new Date().toISOString();
            const planned = [];
            for (const update of updates) {
                const previous = state.lessons.get(update.id);
                if (previous === undefined)
                    throw new KnowledgeError('invalid', '经验不存在：' + update.id, { failedId: update.id });
                if (previous.revision !== update.expectedRevision) {
                    throw new KnowledgeError('revision', '经验 ' + update.id + ' 期望 revision ' + update.expectedRevision + '，实际 ' + previous.revision, {
                        failedId: update.id,
                        expectedRevision: update.expectedRevision,
                        currentRevision: previous.revision,
                    });
                }
                const clean = this.cleanPatch(update.patch);
                if (clean.state !== undefined && clean.state !== previous.state && !canTransition(previous.state, clean.state)) {
                    throw new KnowledgeError('invalid', '不允许的状态迁移：' + previous.state + ' → ' + clean.state, { failedId: update.id });
                }
                if (clean.evidenceIds !== undefined) {
                    clean.independentSupportCount = mergeEvidenceSupport({ evidenceIds: clean.evidenceIds }, Array.from(state.evidence.values()));
                }
                const merged = this.maskLesson(validateLesson({
                    ...previous,
                    ...clean,
                    id: previous.id,
                    schemaVersion: 1,
                    revision: previous.revision + 1,
                    updatedAt: now,
                }));
                planned.push({ previous, merged, patch: clean });
            }
            const event = {
                schemaVersion: 1,
                id: 'evt_' + randomUUID(),
                at: now,
                kind: 'lesson.batch',
                idempotencyKey,
                requestHash,
                payload: {
                    updates: planned.map(({ previous, merged, patch: clean }) => {
                        const patch = {};
                        for (const key of Object.keys(clean)) {
                            ;
                            patch[key] = merged[key];
                        }
                        return { lessonId: previous.id, revision: merged.revision, patch };
                    }),
                },
            };
            this.appendEvent(state, event);
            const applied = [];
            for (const { merged } of planned) {
                state.lessons.set(merged.id, merged);
                applied.push(merged);
            }
            if (!state.idempotency.has(idempotencyKey)) {
                state.idempotency.set(idempotencyKey, { lessonId: applied[0].id, requestHash, batch: applied, lessonIds: applied.map((lesson) => lesson.id) });
            }
            this.writeIndex(state, touch);
            return clone(applied);
        });
    }
    /** 状态迁移；不允许的迁移抛 KnowledgeError('invalid') 且不写。 */
    applyTransition(id, to, expectedRevision, idempotencyKey) {
        assertIdempotencyKey(idempotencyKey);
        if (!isEnum(to, LESSON_STATES))
            throw new KnowledgeError('invalid', '目标状态取值不合法');
        const requestHash = this.hashRequest({ operation: 'lesson.transition', lessonId: id, to });
        return this.withLock((touch) => {
            const state = this.loadCompleteState(touch);
            const cached = state.idempotency.get(idempotencyKey);
            if (cached !== undefined) {
                this.assertSameRequest(cached, requestHash, idempotencyKey);
                const lesson = this.resolveIdempotentLesson(state, idempotencyKey);
                if (lesson === undefined)
                    throw new KnowledgeError('io', '无法恢复幂等键的历史结果：' + idempotencyKey, { idempotencyKey });
                return lesson;
            }
            const lesson = state.lessons.get(id);
            if (lesson === undefined)
                throw new KnowledgeError('invalid', '经验不存在：' + id, { lessonId: id });
            if (lesson.revision !== expectedRevision) {
                throw new KnowledgeError('revision', '经验 ' + id + ' 期望 revision ' + expectedRevision + '，实际 ' + lesson.revision, {
                    lessonId: id,
                    expectedRevision,
                    currentRevision: lesson.revision,
                });
            }
            if (!canTransition(lesson.state, to)) {
                throw new KnowledgeError('invalid', '不允许的状态迁移：' + lesson.state + ' → ' + to, { lessonId: id });
            }
            return clone(this.appendLessonUpdate(state, lesson, { state: to }, idempotencyKey, requestHash, touch));
        });
    }
    /** 从事件完整重建派生索引与 checkpoint；不删除、不改写 events.jsonl / evidence.jsonl。 */
    rebuildIndex() {
        this.withLock((touch) => {
            const state = this.loadAllUnbounded(touch);
            this.writeIndexStrict(state, touch);
        });
    }
    /** 统计。truncated=true 表示事件总量超过有界回放上限（不静默）；快照模式下实体已折叠进 checkpoint。 */
    stats() {
        const state = this.loadAll();
        const byState = emptyStateCounts();
        for (const lesson of state.lessons.values())
            byState[lesson.state]++;
        return {
            lessons: state.lessons.size,
            evidence: state.evidence.size,
            events: state.events,
            byState,
            truncated: state.events > this.maxReplayEvents,
            badLines: state.badLines,
            orphanEvents: state.orphanEvents,
            unsupportedVersions: state.unsupportedVersions,
            skippedEvents: state.skippedEvents,
            firstReplayedEventId: state.firstReplayedEventId,
            replayMode: state.replayMode,
            replayedEvents: state.replayedEvents,
            unreplayedEvents: Math.max(0, state.events - state.replayedEvents),
        };
    }
    /** 只读诊断：锁、文件、计数与最近一次派生索引写失败；绝不获取锁、绝不写盘。 */
    diagnose() {
        const info = readLockInfo(this.lockPath, this.lockStaleMs);
        const state = this.loadAll();
        const byState = emptyStateCounts();
        for (const lesson of state.lessons.values())
            byState[lesson.state]++;
        const lock = {
            present: info.present,
            stale: info.stale,
        };
        if (info.ageMs !== undefined)
            lock.ageMs = Math.round(info.ageMs);
        if (info.pid !== undefined)
            lock.pid = info.pid;
        if (info.alive !== undefined)
            lock.alive = info.alive;
        if (info.bootId !== undefined)
            lock.bootId = info.bootId;
        let generatedAt;
        try {
            const raw = existsSync(this.indexPath) ? JSON.parse(readFileSync(this.indexPath, 'utf8')) : undefined;
            if (isRecord(raw) && typeof raw.generatedAt === 'string')
                generatedAt = raw.generatedAt;
        }
        catch {
            // 派生索引损坏不影响 diagnose
        }
        const result = {
            writable: !info.present || info.stale,
            lock,
            files: {
                dir: this.dir,
                events: this.fileInfo(this.eventsPath),
                evidence: this.fileInfo(this.evidencePath),
                index: generatedAt === undefined ? this.fileInfo(this.indexPath) : { ...this.fileInfo(this.indexPath), generatedAt },
            },
            counts: {
                lessons: state.lessons.size,
                evidence: state.evidence.size,
                events: state.events,
                badLines: state.badLines,
                orphanEvents: state.orphanEvents,
                unsupportedVersions: state.unsupportedVersions,
                skippedEvents: state.skippedEvents,
                truncated: state.events > this.maxReplayEvents,
                byState,
            },
        };
        if (this.lastIndexError !== undefined)
            result.lastIndexError = this.lastIndexError;
        return result;
    }
    // ---------- 内部实现 ----------
    ensureDir() {
        if (!existsSync(this.dir))
            mkdirSync(this.dir, { recursive: true });
    }
    withLock(operation) {
        this.ensureDir();
        const handle = acquireLock(this.lockPath, {
            timeoutMs: this.lockTimeoutMs,
            staleMs: this.lockStaleMs,
            hardLimitMs: this.lockHardLimitMs,
            heartbeatMs: this.lockHeartbeatMs,
        });
        try {
            return operation(handle.touch);
        }
        finally {
            handle.release();
        }
    }
    fileInfo(path) {
        let bytes = 0;
        let exists = false;
        try {
            const stat = statSync(path);
            exists = true;
            bytes = stat.size;
        }
        catch {
            exists = false;
        }
        return { path, exists, bytes };
    }
    hashRequest(value) {
        return createHash('sha256').update(stableStringify(value), 'utf8').digest('hex');
    }
    hashablePatch(patch) {
        const out = {};
        for (const key of Object.keys(patch)) {
            if (key === 'id' || key === 'schemaVersion' || key === 'revision' || key === 'createdAt' || key === 'updatedAt')
                continue;
            const value = patch[key];
            if (value !== undefined)
                out[key] = value;
        }
        return out;
    }
    cleanPatch(patch) {
        const clean = {};
        const hashable = this.hashablePatch(patch);
        for (const key of Object.keys(hashable)) {
            ;
            clean[key] = hashable[key];
        }
        return clean;
    }
    assertSameRequest(entry, requestHash, idempotencyKey) {
        if (entry.requestHash !== undefined && entry.requestHash !== requestHash) {
            throw new KnowledgeError('duplicate', '幂等键已用于不同的请求 payload：' + idempotencyKey, {
                idempotencyKey,
                existingRequestHash: entry.requestHash,
                requestHash,
            });
        }
    }
    /**
     * 恢复"首次结果"：
     * - 尾部回放产生的 entry 自带快照，直接返回；
     * - checkpoint 里的 entry 只有 lessonId/requestHash，则做一次有针对性的完整扫描，
     *   在命中该幂等键的那一刻取快照；失败再退回当前实体（best effort）。
     */
    resolveIdempotentLesson(state, idempotencyKey) {
        const entry = state.idempotency.get(idempotencyKey);
        if (entry === undefined)
            return undefined;
        if (entry.lesson !== undefined)
            return clone(entry.lesson);
        const exact = this.replayUntilIdempotencyKey(idempotencyKey);
        if (exact !== undefined && exact.lesson !== undefined)
            return clone(exact.lesson);
        const current = state.lessons.get(entry.lessonId);
        return current === undefined ? undefined : clone(current);
    }
    resolveIdempotentBatch(state, idempotencyKey) {
        const entry = state.idempotency.get(idempotencyKey);
        if (entry === undefined)
            return undefined;
        if (entry.batch !== undefined)
            return clone(entry.batch);
        const exact = this.replayUntilIdempotencyKey(idempotencyKey);
        if (exact !== undefined && exact.batch !== undefined)
            return clone(exact.batch);
        const ids = entry.lessonIds !== undefined ? entry.lessonIds : [entry.lessonId];
        const out = [];
        for (const id of ids) {
            const lesson = state.lessons.get(id);
            if (lesson !== undefined)
                out.push(clone(lesson));
        }
        return out.length === 0 ? undefined : out;
    }
    replayUntilIdempotencyKey(idempotencyKey) {
        const state = createEmptyReplayState();
        let found;
        try {
            this.forEachLine(this.eventsPath, 0, (line) => {
                state.events++;
                this.applyEventLine(state, line);
                const hit = state.idempotency.get(idempotencyKey);
                if (hit !== undefined && (hit.lesson !== undefined || hit.batch !== undefined)) {
                    found = hit;
                    return false;
                }
                return true;
            });
        }
        catch {
            return undefined;
        }
        return found;
    }
    /** 顺序读取 JSONL 的非空行；每 TOUCH_EVERY_LINES 行调用一次 touch（长回放锁心跳）。 */
    forEachLine(file, fromOffset, onLine, touch) {
        if (!existsSync(file))
            return;
        const fd = openSync(file, 'r');
        try {
            const decoder = new StringDecoder('utf8');
            const buffer = Buffer.allocUnsafe(64 * 1024);
            let carry = '';
            let position = fromOffset;
            let count = 0;
            for (;;) {
                const read = readSync(fd, buffer, 0, buffer.length, position);
                if (read <= 0)
                    break;
                position += read;
                carry += decoder.write(buffer.subarray(0, read));
                let index = carry.indexOf('\n');
                while (index >= 0) {
                    let line = carry.slice(0, index);
                    carry = carry.slice(index + 1);
                    if (line.endsWith('\r'))
                        line = line.slice(0, -1);
                    if (line.trim() !== '') {
                        count++;
                        if (count % TOUCH_EVERY_LINES === 0)
                            touch?.();
                        if (onLine(line) === false)
                            return;
                    }
                    index = carry.indexOf('\n');
                }
            }
            carry += decoder.end();
            if (carry.trim() !== '')
                onLine(carry.endsWith('\r') ? carry.slice(0, -1) : carry);
        }
        finally {
            closeSync(fd);
        }
    }
    /** 有界读取：只保留最后 maxReplayEvents 条非空行，并报告总行数与是否截断。 */
    readBoundedLines(file, fromOffset, touch) {
        const max = this.maxReplayEvents;
        const ring = [];
        let ringStart = 0;
        let total = 0;
        this.forEachLine(file, fromOffset, (line) => {
            total++;
            if (ring.length < max) {
                ring.push(line);
            }
            else {
                ring[ringStart] = line;
                ringStart = (ringStart + 1) % max;
            }
        }, touch);
        const lines = ringStart === 0 ? ring : ring.slice(ringStart).concat(ring.slice(0, ringStart));
        return { lines, total, truncated: total > max };
    }
    /** 快照 + 尾部增量（checkpoint 有效时）；否则有界全量回放。 */
    loadEvents(touch) {
        const snapshot = this.tryLoadCheckpoint();
        if (snapshot !== undefined) {
            const state = createEmptyReplayState();
            state.replayMode = 'snapshot+tail';
            state.entitiesFromSnapshot = true;
            state.lessons = snapshot.lessons;
            state.idempotency = snapshot.idempotency;
            state.events = snapshot.checkpoint.eventsTotal;
            state.badLines = snapshot.checkpoint.counters.badLines;
            state.orphanEvents = snapshot.checkpoint.counters.orphanEvents;
            state.unsupportedVersions = snapshot.checkpoint.counters.unsupportedVersions;
            state.skippedEvents = snapshot.checkpoint.counters.skippedEvents;
            state.snapshotEvidenceCount = snapshot.checkpoint.counters.evidenceCount;
            state.idempotencyComplete = snapshot.checkpoint.idempotencyComplete === true;
            state.lastEventId = snapshot.checkpoint.lastEventId;
            const tail = this.readBoundedLines(this.eventsPath, snapshot.checkpoint.offset, touch);
            if (tail.truncated)
                return this.loadEventsBounded(0, touch);
            state.events += tail.total;
            state.replayedEvents = tail.total;
            for (const line of tail.lines)
                this.applyEventLine(state, line);
            return state;
        }
        return this.loadEventsBounded(0, touch);
    }
    loadEventsBounded(fromOffset, touch) {
        const state = createEmptyReplayState();
        state.replayMode = 'full';
        const bounded = this.readBoundedLines(this.eventsPath, fromOffset, touch);
        state.events = bounded.total;
        state.replayedEvents = bounded.lines.length;
        state.idempotencyComplete = !bounded.truncated;
        for (const line of bounded.lines)
            this.applyEventLine(state, line);
        return state;
    }
    /** 无界完整回放（显式压缩 / 写路径发现截断或状态不完整时使用）。 */
    loadAllUnbounded(touch) {
        const state = createEmptyReplayState();
        state.replayMode = 'full';
        state.idempotencyComplete = true;
        this.forEachLine(this.eventsPath, 0, (line) => {
            state.events++;
            this.applyEventLine(state, line);
        }, touch);
        state.replayedEvents = state.events;
        this.mergeEvidenceFile(state, touch);
        return state;
    }
    /** 事件流 + evidence.jsonl（两条路径都留痕，按 id 合并去重）。 */
    loadAll(touch) {
        let state = this.mergeEvidenceFile(this.loadEvents(touch), touch);
        if (state.entitiesFromSnapshot && this.hasMissingEvidenceRefs(state)) {
            state = this.mergeEvidenceFile(this.loadEventsBounded(0, touch), touch);
        }
        return state;
    }
    /** 写路径：状态不完整、证据疑似缺失或截断未折叠时，自动做一次完整回放。 */
    loadCompleteState(touch) {
        let state = this.loadAll(touch);
        const evidenceDeficit = state.entitiesFromSnapshot && state.evidence.size < state.snapshotEvidenceCount;
        const incompleteIdempotency = state.replayMode === 'snapshot+tail' && !state.idempotencyComplete;
        const skippedWithoutSnapshot = !state.entitiesFromSnapshot && state.events - state.replayedEvents > 0;
        if (evidenceDeficit || incompleteIdempotency || skippedWithoutSnapshot) {
            state = this.loadAllUnbounded(touch);
        }
        return state;
    }
    hasMissingEvidenceRefs(state) {
        for (const lesson of state.lessons.values()) {
            for (const id of lesson.evidenceIds) {
                if (!state.evidence.has(id))
                    return true;
            }
        }
        return false;
    }
    mergeEvidenceFile(state, touch) {
        this.forEachLine(this.evidencePath, 0, (line) => {
            let raw;
            try {
                raw = JSON.parse(line);
            }
            catch {
                state.badLines++;
                return;
            }
            if (hasUnsupportedSchema(raw)) {
                state.unsupportedVersions++;
                return;
            }
            try {
                const evidence = validateEvidence(raw);
                if (!state.evidence.has(evidence.id))
                    state.evidence.set(evidence.id, evidence);
            }
            catch {
                state.badLines++;
            }
        }, touch);
        return state;
    }
    applyEventLine(state, line) {
        let raw;
        try {
            raw = JSON.parse(line);
        }
        catch {
            state.badLines++;
            return;
        }
        if (!isRecord(raw)) {
            state.badLines++;
            return;
        }
        if (hasUnsupportedSchema(raw)) {
            state.unsupportedVersions++;
            return;
        }
        const kind = raw.kind;
        if (typeof kind !== 'string' || !KNOWN_EVENT_KINDS.has(kind)) {
            state.skippedEvents++;
            return;
        }
        if (!isEventShape(raw)) {
            state.badLines++;
            return;
        }
        const event = raw;
        if (state.firstReplayedEventId === undefined)
            state.firstReplayedEventId = event.id;
        state.lastEventId = event.id;
        try {
            switch (event.kind) {
                case 'lesson.create': {
                    const lesson = validateLesson(event.payload);
                    const stored = { ...lesson, id: event.lessonId };
                    state.lessons.set(stored.id, stored);
                    if (!state.idempotency.has(event.idempotencyKey)) {
                        const record = { lessonId: stored.id, lesson: stored };
                        if (event.requestHash !== undefined)
                            record.requestHash = event.requestHash;
                        state.idempotency.set(event.idempotencyKey, record);
                    }
                    return;
                }
                case 'lesson.update': {
                    const previous = state.lessons.get(event.lessonId);
                    if (previous === undefined || event.revision <= previous.revision) {
                        state.orphanEvents++;
                        return;
                    }
                    const merged = validateLesson({
                        ...previous,
                        ...event.payload,
                        id: previous.id,
                        revision: event.revision,
                        updatedAt: event.at,
                    });
                    if (merged.state !== previous.state && !canTransition(previous.state, merged.state)) {
                        state.orphanEvents++;
                        return;
                    }
                    state.lessons.set(merged.id, merged);
                    if (!state.idempotency.has(event.idempotencyKey)) {
                        const record = { lessonId: merged.id, lesson: merged };
                        if (event.requestHash !== undefined)
                            record.requestHash = event.requestHash;
                        state.idempotency.set(event.idempotencyKey, record);
                    }
                    return;
                }
                case 'lesson.review': {
                    const previous = state.lessons.get(event.lessonId);
                    if (previous === undefined || event.revision <= previous.revision) {
                        state.orphanEvents++;
                        return;
                    }
                    const review = { decision: event.payload.decision, at: event.at };
                    if (event.payload.actor !== undefined)
                        review.actor = event.payload.actor;
                    if (event.payload.note !== undefined)
                        review.note = event.payload.note;
                    if (event.payload.resolution !== undefined)
                        review.resolution = event.payload.resolution;
                    const merged = validateLesson({
                        ...previous,
                        review,
                        state: event.payload.state,
                        id: previous.id,
                        revision: event.revision,
                        updatedAt: event.at,
                    });
                    if (merged.state !== previous.state && !canTransition(previous.state, merged.state)) {
                        state.orphanEvents++;
                        return;
                    }
                    state.lessons.set(merged.id, merged);
                    if (!state.idempotency.has(event.idempotencyKey)) {
                        const record = { lessonId: merged.id, lesson: merged };
                        if (event.requestHash !== undefined)
                            record.requestHash = event.requestHash;
                        state.idempotency.set(event.idempotencyKey, record);
                    }
                    return;
                }
                case 'lesson.batch': {
                    const applied = [];
                    const payload = event.payload;
                    for (const item of payload.updates) {
                        const previous = state.lessons.get(item.lessonId);
                        if (previous === undefined || item.revision <= previous.revision) {
                            state.orphanEvents++;
                            continue;
                        }
                        const merged = validateLesson({
                            ...previous,
                            ...item.patch,
                            id: previous.id,
                            revision: item.revision,
                            updatedAt: event.at,
                        });
                        if (merged.state !== previous.state && !canTransition(previous.state, merged.state)) {
                            state.orphanEvents++;
                            continue;
                        }
                        state.lessons.set(merged.id, merged);
                        applied.push(merged);
                    }
                    if (!state.idempotency.has(event.idempotencyKey)) {
                        const first = applied[0];
                        const record = first === undefined
                            ? { lessonId: payload.updates[0] === undefined ? '' : payload.updates[0].lessonId }
                            : { lessonId: first.id, batch: applied, lessonIds: applied.map((lesson) => lesson.id) };
                        if (event.requestHash !== undefined)
                            record.requestHash = event.requestHash;
                        state.idempotency.set(event.idempotencyKey, record);
                    }
                    return;
                }
                case 'evidence.add': {
                    const evidence = validateEvidence(event.payload);
                    state.evidence.set(evidence.id, evidence);
                    return;
                }
                default:
                    state.badLines++;
            }
        }
        catch {
            state.badLines++;
        }
    }
    appendEvent(state, event) {
        this.appendLine(this.eventsPath, event);
        state.events++;
        state.lastEventId = event.id;
    }
    appendLine(file, value) {
        this.ensureDir();
        try {
            appendFileSync(file, JSON.stringify(value) + '\n', 'utf8');
        }
        catch (error) {
            throw new KnowledgeError('io', '写入 ' + file + ' 失败：' + errorMessage(error));
        }
    }
    findEvidenceByNaturalKey(state, input) {
        const sessionKey = evidenceSessionKey(input);
        const hash = typeof input.sourceHash === 'string' && input.sourceHash !== '' ? input.sourceHash : undefined;
        if (sessionKey === undefined && hash === undefined)
            return undefined;
        for (const item of state.evidence.values()) {
            if (input.verification === 'claimed' && item.verification === 'read')
                continue;
            if (sessionKey !== undefined && evidenceSessionKey(item) === sessionKey)
                return item;
            if (hash !== undefined && item.sourceHash === hash)
                return item;
        }
        return undefined;
    }
    /** 在锁内追加/复用一条证据；同天然身份键返回已有记录且不写。 */
    persistEvidenceLocked(input, state) {
        if (!isRecord(input))
            throw new KnowledgeError('invalid', '证据输入必须是对象');
        const existing = this.findEvidenceByNaturalKey(state, input);
        if (existing !== undefined && !(existing.verification === 'claimed' && input.verification === 'read'))
            return existing;
        const now = new Date().toISOString();
        const raw = {
            schemaVersion: 1,
            id: existing?.id ?? 'evd_' + randomUUID(),
            kind: input.kind,
            observedAt: typeof input.observedAt === 'string' ? input.observedAt : now,
            summary: input.summary,
            verification: input.verification,
        };
        if (input.sessionId !== undefined)
            raw.sessionId = input.sessionId;
        if (input.recordSeq !== undefined)
            raw.recordSeq = input.recordSeq;
        if (input.projectId !== undefined)
            raw.projectId = input.projectId;
        if (input.sourceHash !== undefined)
            raw.sourceHash = input.sourceHash;
        if (input.verificationReason !== undefined)
            raw.verificationReason = input.verificationReason;
        const evidence = this.maskEvidence(validateEvidence(raw));
        const natural = evidenceNaturalKey(evidence);
        const event = {
            schemaVersion: 1,
            id: 'evt_' + randomUUID(),
            at: now,
            kind: 'evidence.add',
            idempotencyKey: 'evidence:' + (natural === undefined ? evidence.id : natural),
            payload: evidence,
        };
        this.appendLine(this.evidencePath, evidence);
        this.appendEvent(state, event);
        state.evidence.set(evidence.id, evidence);
        return evidence;
    }
    /** 在锁内追加 lesson.update 并同步内存与索引。 */
    appendLessonUpdate(state, previous, patch, idempotencyKey, requestHash, touch) {
        if (patch.state !== undefined && patch.state !== previous.state && !canTransition(previous.state, patch.state)) {
            throw new KnowledgeError('invalid', '不允许的状态迁移：' + previous.state + ' → ' + patch.state, { lessonId: previous.id });
        }
        const now = new Date().toISOString();
        const merged = this.maskLesson(validateLesson({
            ...previous,
            ...patch,
            id: previous.id,
            schemaVersion: 1,
            revision: previous.revision + 1,
            updatedAt: now,
        }));
        const payload = {};
        for (const key of Object.keys(patch)) {
            if (key === 'id' || key === 'schemaVersion' || key === 'revision' || key === 'createdAt' || key === 'updatedAt')
                continue;
            payload[key] = merged[key];
        }
        const event = {
            schemaVersion: 1,
            id: 'evt_' + randomUUID(),
            at: now,
            kind: 'lesson.update',
            lessonId: merged.id,
            revision: merged.revision,
            idempotencyKey,
            requestHash,
            payload,
        };
        this.appendEvent(state, event);
        state.lessons.set(merged.id, merged);
        if (!state.idempotency.has(idempotencyKey)) {
            state.idempotency.set(idempotencyKey, { lessonId: merged.id, requestHash, lesson: merged });
        }
        this.writeIndex(state, touch);
        return merged;
    }
    maskLesson(lesson) {
        if (!this.mask)
            return lesson;
        const masked = {
            ...lesson,
            title: maskSecrets(lesson.title),
            action: maskSecrets(lesson.action),
            when: maskSecrets(lesson.when),
            exceptions: lesson.exceptions.map((item) => maskSecrets(item)),
        };
        if (lesson.review.note !== undefined) {
            const refs = [lesson.id, ...(lesson.review.resolution?.affectedIds ?? []), ...(lesson.review.resolution?.targetId ? [lesson.review.resolution.targetId] : [])];
            masked.review = { ...lesson.review, note: maskSecrets(lesson.review.note, refs) };
        }
        return masked;
    }
    maskEvidence(evidence) {
        if (!this.mask)
            return evidence;
        return { ...evidence, summary: maskSecrets(evidence.summary) };
    }
    // ---------- checkpoint / index ----------
    hashPrefix(file, bytes) {
        if (bytes <= 0)
            return createHash('sha256').digest('hex');
        const fd = openSync(file, 'r');
        try {
            const buffer = Buffer.allocUnsafe(bytes);
            let offset = 0;
            while (offset < bytes) {
                const read = readSync(fd, buffer, offset, bytes - offset, offset);
                if (read <= 0)
                    break;
                offset += read;
            }
            return createHash('sha256').update(buffer.subarray(0, offset)).digest('hex');
        }
        finally {
            closeSync(fd);
        }
    }
    readLastLineId(file, offset) {
        if (offset <= 0)
            return undefined;
        const start = Math.max(0, offset - LAST_LINE_WINDOW_BYTES);
        const fd = openSync(file, 'r');
        try {
            const buffer = Buffer.allocUnsafe(offset - start);
            let read = 0;
            while (read < buffer.length) {
                const chunk = readSync(fd, buffer, read, buffer.length - read, start + read);
                if (chunk <= 0)
                    break;
                read += chunk;
            }
            const text = buffer.subarray(0, read).toString('utf8').replace(/\r?\n+$/, '');
            const index = Math.max(text.lastIndexOf('\n'), text.lastIndexOf('\r'));
            const line = index >= 0 ? text.slice(index + 1) : text;
            try {
                const parsed = JSON.parse(line);
                return isRecord(parsed) && typeof parsed.id === 'string' ? parsed.id : undefined;
            }
            catch {
                return undefined;
            }
        }
        finally {
            closeSync(fd);
        }
    }
    tryLoadCheckpoint() {
        if (!existsSync(this.indexPath))
            return undefined;
        let raw;
        try {
            raw = JSON.parse(readFileSync(this.indexPath, 'utf8'));
        }
        catch {
            return undefined;
        }
        if (!isRecord(raw) || raw.schemaVersion !== 1)
            return undefined;
        const cpRaw = raw.checkpoint;
        if (!isRecord(cpRaw))
            return undefined;
        const offset = cpRaw.offset;
        const bytes = cpRaw.bytes;
        const lastEventId = cpRaw.lastEventId;
        const prefixHash = cpRaw.prefixHash;
        const prefixBytes = cpRaw.prefixBytes;
        const eventsTotal = cpRaw.eventsTotal;
        const countersRaw = cpRaw.counters;
        if (typeof offset !== 'number' || !Number.isInteger(offset) || offset < 0 ||
            typeof bytes !== 'number' || bytes !== offset ||
            typeof lastEventId !== 'string' ||
            typeof prefixHash !== 'string' ||
            typeof prefixBytes !== 'number' || !Number.isInteger(prefixBytes) || prefixBytes < 0 ||
            typeof eventsTotal !== 'number' || !Number.isInteger(eventsTotal) || eventsTotal < 0 ||
            !isRecord(countersRaw)) {
            return undefined;
        }
        const counterNumber = (key) => {
            const value = countersRaw[key];
            return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
        };
        const counters = {
            badLines: counterNumber('badLines'),
            orphanEvents: counterNumber('orphanEvents'),
            unsupportedVersions: counterNumber('unsupportedVersions'),
            skippedEvents: counterNumber('skippedEvents'),
            evidenceCount: counterNumber('evidenceCount'),
        };
        const lessonsRaw = raw.lessons;
        if (!isRecord(lessonsRaw))
            return undefined;
        const lessons = new Map();
        for (const [id, value] of Object.entries(lessonsRaw)) {
            let lesson;
            try {
                lesson = validateLesson(value);
            }
            catch {
                return undefined;
            }
            if (lesson.id !== id)
                return undefined;
            lessons.set(id, lesson);
        }
        if (offset === 0 && lessons.size > 0)
            return undefined;
        if (existsSync(this.eventsPath)) {
            const size = statSync(this.eventsPath).size;
            if (size < offset)
                return undefined;
            if (offset > 0) {
                if (prefixBytes !== Math.min(offset, PREFIX_HASH_BYTES))
                    return undefined;
                if (this.hashPrefix(this.eventsPath, prefixBytes) !== prefixHash)
                    return undefined;
                if (this.readLastLineId(this.eventsPath, offset) !== lastEventId)
                    return undefined;
            }
        }
        else if (offset !== 0) {
            return undefined;
        }
        const idempotency = new Map();
        const idemRaw = raw.checkpoint !== undefined && isRecord(cpRaw.idempotency) ? cpRaw.idempotency : undefined;
        if (idemRaw !== undefined) {
            for (const [key, value] of Object.entries(idemRaw)) {
                if (!isRecord(value) || typeof value.lessonId !== 'string' || value.lessonId === '')
                    return undefined;
                const record = { lessonId: value.lessonId };
                if (typeof value.requestHash === 'string')
                    record.requestHash = value.requestHash;
                if (Array.isArray(value.lessonIds)) {
                    record.lessonIds = value.lessonIds.filter((id) => typeof id === 'string');
                }
                idempotency.set(key, record);
            }
        }
        const serialized = {};
        for (const [key, entry] of idempotency) {
            const record = { lessonId: entry.lessonId };
            if (entry.requestHash !== undefined)
                record.requestHash = entry.requestHash;
            if (entry.lessonIds !== undefined)
                record.lessonIds = entry.lessonIds;
            serialized[key] = record;
        }
        return {
            lessons,
            idempotency,
            checkpoint: {
                offset,
                bytes,
                lastEventId,
                prefixHash,
                prefixBytes,
                eventsTotal,
                counters,
                idempotency: serialized,
                idempotencyComplete: cpRaw.idempotencyComplete === true,
            },
        };
    }
    buildCheckpoint(state) {
        if (!existsSync(this.eventsPath))
            return undefined;
        const size = statSync(this.eventsPath).size;
        if (size > 0 && (state.lastEventId === undefined || state.lastEventId === ''))
            return undefined;
        const prefixBytes = Math.min(size, PREFIX_HASH_BYTES);
        const idempotency = {};
        for (const [key, entry] of state.idempotency) {
            const record = { lessonId: entry.lessonId };
            if (entry.requestHash !== undefined)
                record.requestHash = entry.requestHash;
            if (entry.lessonIds !== undefined)
                record.lessonIds = entry.lessonIds;
            idempotency[key] = record;
        }
        return {
            offset: size,
            bytes: size,
            lastEventId: state.lastEventId === undefined ? '' : state.lastEventId,
            prefixHash: this.hashPrefix(this.eventsPath, prefixBytes),
            prefixBytes,
            eventsTotal: state.events,
            counters: {
                badLines: state.badLines,
                orphanEvents: state.orphanEvents,
                unsupportedVersions: state.unsupportedVersions,
                skippedEvents: state.skippedEvents,
                evidenceCount: state.evidence.size,
            },
            idempotency,
            idempotencyComplete: state.idempotencyComplete,
        };
    }
    buildIndexPayload(state) {
        const lessons = {};
        const stateCounts = emptyStateCounts();
        for (const lesson of state.lessons.values()) {
            lessons[lesson.id] = lesson;
            stateCounts[lesson.state]++;
        }
        const payload = {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            lessons,
            stateCounts,
            byState: stateCounts,
        };
        const checkpoint = this.buildCheckpoint(state);
        if (checkpoint !== undefined)
            payload.checkpoint = checkpoint;
        return payload;
    }
    /** 自动更新派生索引：失败降级（权威事件已落盘），记录 lastIndexError 供 diagnose()。 */
    writeIndex(state, touch) {
        try {
            this.writeIndexStrict(state, touch);
            this.lastIndexError = undefined;
        }
        catch (error) {
            this.lastIndexError = { message: maskSecrets(errorMessage(error)), at: new Date().toISOString() };
        }
    }
    writeIndexStrict(state, touch) {
        this.ensureDir();
        touch?.();
        const payload = this.buildIndexPayload(state);
        touch?.();
        const target = this.indexPath;
        const tmp = target + '.tmp-' + process.pid + '-' + randomUUID();
        try {
            writeFileSync(tmp, JSON.stringify(payload, null, 2) + '\n', 'utf8');
            renameSync(tmp, target);
        }
        catch (error) {
            try {
                rmSync(tmp, { force: true });
            }
            catch {
                // 清理临时文件失败不覆盖原始 io 错误
            }
            throw new KnowledgeError('io', '写入 index.json 失败：' + errorMessage(error));
        }
    }
}
function assertIdempotencyKey(idempotencyKey) {
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
        throw new KnowledgeError('invalid', 'idempotencyKey 必须是非空字符串');
    }
}
