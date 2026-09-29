/**
 * dsh-dream 知识层：经验（Lesson）、证据（Evidence）与知识事件的类型定义、
 * schema 校验与确定性纯函数。
 *
 * 本模块只做纯计算，不落盘；落盘见 knowledge-store.ts。
 *
 * @module dsh-dream/knowledge
 */
import { createHash } from 'node:crypto';
/** 知识层错误码：invalid=数据不合法；revision=乐观锁不符；duplicate=重复；io=读写/锁失败。 */
export class KnowledgeError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'KnowledgeError';
        this.code = code;
    }
}
const LESSON_KINDS = ['preference', 'procedure', 'pitfall', 'fact'];
const LESSON_STATES = ['candidate', 'usable', 'disputed', 'stale', 'rejected'];
const REVIEW_DECISIONS = ['unreviewed', 'accepted', 'rejected'];
const EVIDENCE_KINDS = ['session', 'user-correction', 'local-artifact'];
const EVIDENCE_VERIFICATIONS = ['read', 'claimed'];
/** 允许的状态迁移。rejected 只能显式回到 candidate 重新审阅，不能直接变 usable。 */
const TRANSITIONS = {
    candidate: ['usable', 'rejected', 'disputed', 'stale'],
    usable: ['disputed', 'stale', 'rejected'],
    disputed: ['usable', 'rejected', 'stale'],
    stale: ['usable', 'rejected', 'disputed'],
    rejected: ['candidate'],
};
function fail(field, detail) {
    throw new KnowledgeError('invalid', '知识数据无效（' + field + '）：' + detail);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isEnum(value, allowed) {
    return typeof value === 'string' && allowed.includes(value);
}
function readString(value, field, opts = {}) {
    if (value === undefined || value === null) {
        if (opts.required === true)
            fail(field, '缺失');
        return undefined;
    }
    if (typeof value !== 'string')
        fail(field, '必须是字符串');
    if (opts.nonEmpty === true && value.trim() === '')
        fail(field, '不能为空');
    return value;
}
function readStringArray(value, field) {
    if (value === undefined || value === null)
        return undefined;
    if (!Array.isArray(value))
        fail(field, '必须是字符串数组');
    const out = [];
    for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item !== 'string')
            fail(field + '[' + i + ']', '必须是字符串');
        if (item.trim() === '')
            fail(field + '[' + i + ']', '不能为空');
        if (!out.includes(item))
            out.push(item);
    }
    return out;
}
function readIsoDate(value, field, required = false) {
    const text = readString(value, field, { required, nonEmpty: true });
    if (text === undefined)
        return undefined;
    if (Number.isNaN(Date.parse(text)))
        fail(field, '必须是可解析的 ISO 时间');
    return text;
}
function readScope(value) {
    if (!isRecord(value))
        fail('scope', '必须是对象');
    const global = value.global;
    if (typeof global !== 'boolean')
        fail('scope.global', '必须是布尔值');
    const projectId = readString(value.projectId, 'scope.projectId', { nonEmpty: true });
    const workspaceRoot = readString(value.workspaceRoot, 'scope.workspaceRoot', { nonEmpty: true });
    const scope = { global };
    if (projectId !== undefined)
        scope.projectId = projectId;
    if (workspaceRoot !== undefined)
        scope.workspaceRoot = workspaceRoot;
    return scope;
}
function readApplicability(value) {
    if (value === undefined || value === null)
        return [];
    if (!Array.isArray(value))
        fail('applicability', '必须是对象数组');
    const out = [];
    for (let i = 0; i < value.length; i++) {
        const entry = value[i];
        if (!isRecord(entry))
            fail('applicability[' + i + ']', '必须是对象');
        const item = {};
        const pkg = readString(entry.package, 'applicability[' + i + '].package', { nonEmpty: true });
        const versions = readString(entry.versions, 'applicability[' + i + '].versions', { nonEmpty: true });
        const platform = readString(entry.platform, 'applicability[' + i + '].platform', { nonEmpty: true });
        if (pkg !== undefined)
            item.package = pkg;
        if (versions !== undefined)
            item.versions = versions;
        if (platform !== undefined)
            item.platform = platform;
        out.push(item);
    }
    return out;
}
function readReview(value) {
    if (value === undefined || value === null)
        return { decision: 'unreviewed' };
    if (!isRecord(value))
        fail('review', '必须是对象');
    const decision = value.decision;
    if (!isEnum(decision, REVIEW_DECISIONS))
        fail('review.decision', '取值不合法');
    const review = { decision };
    const actor = readString(value.actor, 'review.actor', { nonEmpty: true });
    const at = readIsoDate(value.at, 'review.at');
    if (actor !== undefined)
        review.actor = actor;
    if (at !== undefined)
        review.at = at;
    return review;
}
/** 校验并归一化一条经验；失败抛 KnowledgeError('invalid')。未知字段会被丢弃。 */
export function validateLesson(value) {
    if (!isRecord(value))
        fail('lesson', '必须是对象');
    if (value.schemaVersion !== 1)
        fail('schemaVersion', '只支持 1');
    const id = readString(value.id, 'id', { required: true, nonEmpty: true });
    const revision = value.revision;
    if (typeof revision !== 'number' || !Number.isInteger(revision) || revision < 1)
        fail('revision', '必须是 >= 1 的整数');
    const kind = value.kind;
    if (!isEnum(kind, LESSON_KINDS))
        fail('kind', '取值不合法');
    const title = readString(value.title, 'title', { required: true, nonEmpty: true });
    const action = readString(value.action, 'action', { required: true, nonEmpty: true });
    const when = readString(value.when, 'when', { required: true, nonEmpty: true });
    const exceptions = readStringArray(value.exceptions, 'exceptions') ?? [];
    const scope = readScope(value.scope);
    const applicability = readApplicability(value.applicability);
    const state = value.state;
    if (!isEnum(state, LESSON_STATES))
        fail('state', '取值不合法');
    const evidenceIds = readStringArray(value.evidenceIds, 'evidenceIds') ?? [];
    const independentSupportCount = value.independentSupportCount;
    if (typeof independentSupportCount !== 'number' || !Number.isInteger(independentSupportCount) || independentSupportCount < 0) {
        fail('independentSupportCount', '必须是 >= 0 的整数');
    }
    const review = readReview(value.review);
    const createdAt = readIsoDate(value.createdAt, 'createdAt', true);
    const updatedAt = readIsoDate(value.updatedAt, 'updatedAt', true);
    const lastValidatedAt = readIsoDate(value.lastValidatedAt, 'lastValidatedAt');
    const reviewAfter = readIsoDate(value.reviewAfter, 'reviewAfter');
    const supersedes = readStringArray(value.supersedes, 'supersedes');
    const conflictIds = readStringArray(value.conflictIds, 'conflictIds') ?? [];
    const lesson = {
        schemaVersion: 1,
        id,
        revision,
        kind,
        title,
        action,
        when,
        exceptions,
        scope,
        applicability,
        state,
        evidenceIds,
        independentSupportCount,
        review,
        createdAt,
        updatedAt,
        conflictIds,
    };
    if (lastValidatedAt !== undefined)
        lesson.lastValidatedAt = lastValidatedAt;
    if (reviewAfter !== undefined)
        lesson.reviewAfter = reviewAfter;
    if (supersedes !== undefined)
        lesson.supersedes = supersedes;
    return lesson;
}
/** 校验并归一化一条证据；失败抛 KnowledgeError('invalid')。未知字段会被丢弃。 */
export function validateEvidence(value) {
    if (!isRecord(value))
        fail('evidence', '必须是对象');
    if (value.schemaVersion !== 1)
        fail('evidence.schemaVersion', '只支持 1');
    const id = readString(value.id, 'evidence.id', { required: true, nonEmpty: true });
    const kind = value.kind;
    if (!isEnum(kind, EVIDENCE_KINDS))
        fail('evidence.kind', '取值不合法');
    const verification = value.verification;
    if (!isEnum(verification, EVIDENCE_VERIFICATIONS))
        fail('evidence.verification', '取值不合法');
    const observedAt = readIsoDate(value.observedAt, 'evidence.observedAt', true);
    const summary = readString(value.summary, 'evidence.summary', { required: true, nonEmpty: true });
    const sessionId = readString(value.sessionId, 'evidence.sessionId', { nonEmpty: true });
    const projectId = readString(value.projectId, 'evidence.projectId', { nonEmpty: true });
    const sourceHash = readString(value.sourceHash, 'evidence.sourceHash', { nonEmpty: true });
    const recordSeqRaw = value.recordSeq;
    let recordSeq;
    if (recordSeqRaw !== undefined && recordSeqRaw !== null) {
        if (typeof recordSeqRaw === 'number') {
            if (!Number.isInteger(recordSeqRaw) || recordSeqRaw < 0)
                fail('evidence.recordSeq', '数字必须是 >= 0 的整数');
            recordSeq = recordSeqRaw;
        }
        else if (typeof recordSeqRaw === 'string') {
            if (recordSeqRaw.trim() === '')
                fail('evidence.recordSeq', '字符串不能为空');
            recordSeq = recordSeqRaw;
        }
        else {
            fail('evidence.recordSeq', '必须是数字或字符串');
        }
    }
    const evidence = { schemaVersion: 1, id, kind, observedAt, summary, verification };
    if (sessionId !== undefined)
        evidence.sessionId = sessionId;
    if (recordSeq !== undefined)
        evidence.recordSeq = recordSeq;
    if (projectId !== undefined)
        evidence.projectId = projectId;
    if (sourceHash !== undefined)
        evidence.sourceHash = sourceHash;
    return evidence;
}
/**
 * 规范化用于比较的文本：Unicode NFC + 折叠连续空白 + trim。
 * 展示仍用原样；指纹比较时再统一 lowercase。
 */
export function normalizeLessonText(text) {
    if (typeof text !== 'string')
        throw new KnowledgeError('invalid', 'normalizeLessonText 需要字符串');
    return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}
/**
 * 经验指纹：kind + title + action + when + scope 的规范化小写序列表，
 * sha256 取前 16 位十六进制。否定词、数值、路径、版本条件原样参与。
 */
export function lessonFingerprint(input) {
    const part = (text) => normalizeLessonText(text === undefined ? '' : text).toLowerCase();
    const scope = input.scope;
    const canonical = JSON.stringify([
        input.kind,
        part(input.title),
        part(input.action),
        part(input.when),
        {
            global: scope !== undefined && scope.global === true,
            projectId: part(scope === undefined ? undefined : scope.projectId) || null,
            workspaceRoot: part(scope === undefined ? undefined : scope.workspaceRoot) || null,
        },
    ]);
    return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
}
/** 状态机：from → to 是否允许。同状态与未知状态一律不允许。 */
export function canTransition(from, to) {
    if (!isEnum(from, LESSON_STATES) || !isEnum(to, LESSON_STATES))
        return false;
    return TRANSITIONS[from].includes(to);
}
/** sessionId + recordSeq 组成的会话定位键；两者缺一不可。 */
export function evidenceSessionKey(evidence) {
    if (typeof evidence.sessionId === 'string' &&
        evidence.sessionId !== '' &&
        evidence.recordSeq !== undefined &&
        evidence.recordSeq !== null) {
        return 'session:' + evidence.sessionId + '#' + String(evidence.recordSeq);
    }
    return undefined;
}
/** sourceHash 键；空串视为缺失。 */
export function evidenceHashKey(evidence) {
    if (typeof evidence.sourceHash === 'string' && evidence.sourceHash !== '') {
        return 'hash:' + evidence.sourceHash;
    }
    return undefined;
}
/** 证据的天然身份键：同 sessionId + recordSeq 优先，其次同 sourceHash。 */
export function evidenceNaturalKey(evidence) {
    return evidenceSessionKey(evidence) ?? evidenceHashKey(evidence);
}
/** 去重键：优先天然身份键，否则退回证据 id。 */
export function evidenceDedupKey(evidence) {
    return evidenceNaturalKey(evidence) ?? 'id:' + String(evidence.id);
}
/**
 * 去重后的独立证据数：只看 lesson.evidenceIds 引用到的证据，
 * 同 sessionId+recordSeq 或同 sourceHash 只算一次；verification=claimed 不计入。
 */
export function mergeEvidenceSupport(lesson, evidence) {
    const wanted = new Set(lesson.evidenceIds);
    const items = evidence.filter((item) => wanted.has(item.id) && item.verification === 'read');
    const parent = items.map((_, index) => index);
    const find = (index) => {
        let current = index;
        while (parent[current] !== current) {
            parent[current] = parent[parent[current]];
            current = parent[current];
        }
        return current;
    };
    const union = (a, b) => {
        const rootA = find(a);
        const rootB = find(b);
        if (rootA !== rootB)
            parent[rootB] = rootA;
    };
    const bySession = new Map();
    const byHash = new Map();
    for (let i = 0; i < items.length; i++) {
        const sessionKey = evidenceSessionKey(items[i]);
        if (sessionKey !== undefined) {
            const seen = bySession.get(sessionKey);
            if (seen === undefined)
                bySession.set(sessionKey, i);
            else
                union(i, seen);
        }
        const hashKey = evidenceHashKey(items[i]);
        if (hashKey !== undefined) {
            const seen = byHash.get(hashKey);
            if (seen === undefined)
                byHash.set(hashKey, i);
            else
                union(i, seen);
        }
    }
    const roots = new Set();
    for (let i = 0; i < items.length; i++)
        roots.add(find(i));
    return roots.size;
}
