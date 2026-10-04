/**
 * dsh-dream 的网页端后端：给设置页里的梦境面板提供只读数据。
 *
 * 安全模型沿用 dsh-calendar / dsh-email 的设置路由：这些路由能读出用户的
 * 全部梦境日记与经验（都是隐私文本），而宿主 webserver 有可能绑定在 0.0.0.0。
 * 三道门缺一不可 ——
 *   1. remoteAddress 若是明确的非回环地址则拒绝（局域网不可达）；
 *   2. Host 头必须是 localhost 名（挡 DNS rebinding：恶意域名解析到 127.0.0.1）；
 *   3. 只接受 GET：三条路由都没有任何写路径，所以不需要 CSRF 那一套。
 *
 * 零写盘纪律（M1/M2）：知识路由只读 <journalDir>/knowledge/，写入记录路由只读
 * <journalDir>/bridge/。目录不存在时直接返回空结果，绝不为了读去 mkdir 或 rebuildIndex；
 * 重建索引只发生在写路径或显式维护操作里。
 *
 * @module dsh-dream/web
 */
import { existsSync } from 'node:fs';
import { isAbsolute, join, win32 } from 'node:path';
import * as bridgeModule from './bridge.js';
import { resolveConfig } from './config.js';
import { dreamStats, readDreams, searchDreams } from './journal.js';
import { KnowledgeStore } from './knowledge-store.js';
import { isDreamReference, maskSecrets } from './mask.js';
import { buildEvidenceSummary, lessonScopeLabel } from './retrieval.js';
import { memoryDirectory, needsMemoryReview, reviewDeadline } from './memory.js';
import { readAutomaticState } from './automatic-state.js';
/** 面板与浏览器说话的同源路由。 */
export const DREAM_ROUTE = '/_dsh/dsh-dream/journal';
/** M1 经验面板的只读路由。 */
export const DREAM_KNOWLEDGE_ROUTE = '/_dsh/dsh-dream/knowledge';
/** M2 写入记录面板的只读路由。 */
export const DREAM_BRIDGE_ROUTE = '/_dsh/dsh-dream/bridge';
/** ?limit 的默认值与上下界。 */
export const DREAM_LIMIT_DEFAULT = 50;
export const DREAM_LIMIT_MIN = 1;
export const DREAM_LIMIT_MAX = 500;
/** 回环主机名白名单；带端口会被拆掉，IPv6 字面量保留方括号。 */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
/** 回环来源地址白名单。 */
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
/** 知识的 5 个契约状态（统计归一化时保证键齐全）。 */
const LESSON_STATES = ['candidate', 'usable', 'disputed', 'stale', 'rejected'];
/** Host 头裁决：undefined = 放行，否则给出拒绝原因。 */
export function hostVerdict(host) {
    if (typeof host !== 'string' || host.trim() === '')
        return undefined;
    const text = host.trim().toLowerCase();
    const name = text.startsWith('[') ? text.slice(0, text.indexOf(']') + 1) : text.split(':')[0];
    return LOCAL_HOSTNAMES.has(text) || LOCAL_HOSTNAMES.has(name) ? undefined : `host "${host}" is not a localhost name`;
}
/** 来源地址裁决：undefined = 放行（请求里缺失也放行），否则给出拒绝原因。 */
export function remoteVerdict(remote) {
    if (typeof remote !== 'string' || remote.trim() === '')
        return undefined;
    const text = remote.trim().toLowerCase();
    return LOOPBACK_ADDRESSES.has(text) ? undefined : `remote address "${remote}" is not a loopback address`;
}
/** ?limit 解析：缺省/非数字 → fallback；越界钳制到 [1, 500]。 */
export function limitFromQuery(raw, fallback = DREAM_LIMIT_DEFAULT) {
    if (typeof raw !== 'string' || raw.trim() === '')
        return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value))
        return fallback;
    return Math.min(DREAM_LIMIT_MAX, Math.max(DREAM_LIMIT_MIN, Math.trunc(value)));
}
/** 解析后的 journalDir：显式路径优先，否则回退到 resolveConfig(config)。 */
function journalDirOf(options) {
    if (typeof options.journalDir === 'string' && options.journalDir.trim() !== '')
        return options.journalDir;
    return resolveConfig((options.config ?? null)).journalDir;
}
/** 解析后的 knowledgeDir：显式路径优先，否则 = <journalDir>/knowledge。 */
export function knowledgeDirOf(options, journalDir = journalDirOf(options)) {
    if (typeof options.knowledgeDir === 'string' && options.knowledgeDir.trim() !== '')
        return options.knowledgeDir;
    return join(journalDir, 'knowledge');
}
/** 解析后的 bridgeDir：显式路径优先，否则 = <journalDir>/bridge。 */
export function bridgeDirOf(options, journalDir = journalDirOf(options)) {
    if (typeof options.bridgeDir === 'string' && options.bridgeDir.trim() !== '')
        return options.bridgeDir;
    return join(journalDir, 'bridge');
}
/** 解析请求 URL；非法或缺失时退回路由本身（等价于没有查询参数）。 */
function requestUrl(raw, fallback = DREAM_ROUTE) {
    const text = typeof raw === 'string' && raw !== '' ? raw : fallback;
    try {
        return new URL(text, 'http://localhost');
    }
    catch {
        return new URL(fallback, 'http://localhost');
    }
}
/** 统一回 JSON；403/405/500 都用同一套 { ok:false, error:{ code, message } }。 */
function responseJson(res, status, payload, headers = {}) {
    const text = JSON.stringify(payload);
    if (typeof res?.writeHead === 'function') {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
    }
    if (typeof res?.end === 'function')
        res.end(text);
}
function forbidden(res, message) {
    responseJson(res, 403, { ok: false, error: { code: 'forbidden', message } });
}
function internalError(res, error) {
    responseJson(res, 500, {
        ok: false,
        error: { code: 'internal', message: error instanceof Error ? error.message : String(error) },
    });
}
/**
 * 三道门：回环来源 → 本机 Host → 只读 GET。
 * 返回 true 表示已经拒绝并写完响应，调用方应立即返回。
 */
function requestGate(req, res, readOnlyMessage) {
    const remote = remoteVerdict(req?.socket?.remoteAddress);
    if (remote !== undefined) {
        forbidden(res, remote);
        return true;
    }
    const headers = (req?.headers ?? {});
    const host = hostVerdict(headers.host);
    if (host !== undefined) {
        forbidden(res, host);
        return true;
    }
    // 缺失 method 的请求在宿主内部调用里出现过，按只读的 GET 处理。
    if (String(req?.method ?? 'GET').toUpperCase() !== 'GET') {
        responseJson(res, 405, {
            ok: false,
            error: { code: 'method-not-allowed', message: readOnlyMessage },
        }, { allow: 'GET' });
        return true;
    }
    return false;
}
/** 哈希字段不做二次脱敏：它们是校验值，不是密钥（面板要展示前 12 位）。 */
const HASH_KEY_RE = /^(?:sourceHash|beforeSha256|afterSha256|afterBlockSha256|afterFileSha256|sha256)$/;
const REFERENCE_KEYS = new Set(['id', 'lessonId', 'lessonIds', 'evidenceIds', 'conflictIds', 'supersedes', 'targetId', 'affectedIds', 'backupId', 'previewId']);
const PATH_KEYS = new Set(['target', 'path', 'resolvedPath', 'workspaceRoot']);
/** 递归脱敏；结构化绝对路径按目录分段，避免 Unix 分隔符把正常路径连成长令牌。 */
export function maskDeep(value, key) {
    if (typeof value === 'string') {
        if (key !== undefined && HASH_KEY_RE.test(key) && /^[0-9a-f]{64}$/i.test(value))
            return value;
        if (key !== undefined && REFERENCE_KEYS.has(key) && isDreamReference(value))
            return value;
        if (key !== undefined && PATH_KEYS.has(key) && (isAbsolute(value) || win32.isAbsolute(value)) && !/[\x00-\x1f]/.test(value)) {
            return value.split(/([\\/]+)/).map((part) => maskSecrets(part)).join('');
        }
        return maskSecrets(value);
    }
    if (Array.isArray(value))
        return value.map((item) => maskDeep(item, key));
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [entryKey, item] of Object.entries(value))
            out[entryKey] = maskDeep(item, entryKey);
        return out;
    }
    return value;
}
/** 统计归一化：数字字段兜底为 0，byState 五个键齐全，truncated 只在为 true 时保留，badLines 始终透传。 */
function normalizeKnowledgeStats(value) {
    const source = value !== null && typeof value === 'object' ? value : {};
    const rawByState = source.byState !== null && typeof source.byState === 'object'
        ? source.byState
        : {};
    const byState = {};
    for (const state of LESSON_STATES) {
        const count = rawByState[state];
        byState[state] = typeof count === 'number' && Number.isFinite(count) && count >= 0 ? count : 0;
    }
    const numberAt = (key) => {
        const raw = source[key];
        return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : 0;
    };
    const stats = {
        lessons: numberAt('lessons'),
        evidence: numberAt('evidence'),
        events: numberAt('events'),
        byState,
        badLines: Math.floor(numberAt('badLines')),
    };
    if (source.truncated === true)
        stats.truncated = true;
    return stats;
}
/** 知识目录不存在（或尚未建立）时的空载荷：不写盘、不报 404。 */
export function emptyKnowledgePayload() {
    return {
        lessons: [],
        evidence: [],
        stats: normalizeKnowledgeStats(null),
    };
}
function asDisplayString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function asDisplayRevision(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}
/**
 * 归一化桥接应用记录：只保留展示需要的字段，坏形状跳过。
 * 数据源由 src/bridge.ts 负责（本层不做 IO、不重算可否回滚）。
 */
export function normalizeBridgeApplications(value) {
    if (!Array.isArray(value))
        return [];
    const records = [];
    for (const raw of value) {
        if (raw === null || typeof raw !== 'object')
            continue;
        const item = raw;
        const backupId = asDisplayString(item.backupId);
        const target = asDisplayString(item.target);
        if (backupId === '' && target === '')
            continue;
        const lessons = [];
        if (Array.isArray(item.lessons)) {
            for (const entry of item.lessons) {
                if (entry !== null && typeof entry === 'object') {
                    const ref = entry;
                    const lessonId = asDisplayString(ref.lessonId);
                    if (lessonId === '')
                        continue;
                    lessons.push({ lessonId, revision: asDisplayRevision(ref.revision) });
                }
                else {
                    const text = asDisplayString(entry);
                    if (text === '')
                        continue;
                    const match = /^(.*)@(\d+)$/.exec(text);
                    if (match !== null)
                        lessons.push({ lessonId: match[1], revision: Number(match[2]) });
                    else
                        lessons.push({ lessonId: text, revision: 0 });
                }
            }
        }
        const record = {
            backupId,
            at: asDisplayString(item.at),
            target,
            action: asDisplayString(item.action),
            lessons,
            beforeSha256: asDisplayString(item.beforeSha256),
            afterSha256: asDisplayString(item.afterSha256),
            rollbackable: item.rollbackable === true,
        };
        const reason = asDisplayString(item.rollbackReason);
        if (reason !== '')
            record.rollbackReason = reason;
        records.push(record);
    }
    return records;
}
/** 写入记录目录不存在时的空载荷。 */
export function emptyBridgePayload() {
    return {
        records: [],
        stats: { total: 0, rollbackable: 0 },
    };
}
/**
 * 从桥接存储层取原始记录（按 at 降序，只读零写盘）。
 * 契约来源：M2-A，`listBridgeApplications(journalDir): BridgeApplicationView[]`；
 * 未落地 / 未导出时安全返回空，路由不受影响。
 */
function readBridgeApplicationsFromStore(journalDir) {
    const candidate = bridgeModule.listBridgeApplications;
    if (typeof candidate !== 'function')
        return [];
    const result = candidate(journalDir);
    return Array.isArray(result) ? result : [];
}
/** 组装梦境日记路由处理器；journalDir 在这一刻定下来（与插件的配置生命周期一致）。 */
export function createDreamWebHandler(options = {}) {
    const journalDir = journalDirOf(options);
    return async (req, res) => {
        if (requestGate(req, res, 'dsh-dream journal route is read-only; use GET'))
            return;
        const url = requestUrl(req?.url);
        const query = (url.searchParams.get('q') ?? '').trim();
        const limit = limitFromQuery(url.searchParams.get('limit'));
        try {
            const dreams = query === '' ? readDreams(journalDir, limit) : searchDreams(journalDir, query, limit);
            const stats = dreamStats(journalDir);
            responseJson(res, 200, { dreams, stats, query, limit });
        }
        catch (error) {
            internalError(res, error);
        }
    };
}
/** 组装只读写入记录路由处理器；零写盘：目录不存在就直接返回空结果。 */
export function createBridgeWebHandler(options = {}) {
    const journalDir = journalDirOf(options);
    const bridgeDir = bridgeDirOf(options, journalDir);
    return async (req, res) => {
        if (requestGate(req, res, 'dsh-dream bridge route is read-only; use GET'))
            return;
        try {
            let raw;
            if (options.bridgeStoreFactory !== undefined) {
                raw = options.bridgeStoreFactory(bridgeDir).listApplications();
            }
            else if (existsSync(bridgeDir)) {
                raw = readBridgeApplicationsFromStore(journalDir);
            }
            else {
                raw = [];
            }
            const records = normalizeBridgeApplications(raw).map((record) => maskDeep(record));
            const payload = {
                records,
                stats: {
                    total: records.length,
                    rollbackable: records.filter((record) => record.rollbackable).length,
                },
            };
            responseJson(res, 200, payload);
        }
        catch (error) {
            internalError(res, error);
        }
    };
}
/** 组装只读经验路由处理器；零写盘：目录不存在就直接返回空结果。 */
export function createKnowledgeWebHandler(options = {}) {
    const knowledgeDir = knowledgeDirOf(options);
    return async (req, res) => {
        if (requestGate(req, res, 'dsh-dream knowledge route is read-only; use GET'))
            return;
        try {
            const reader = options.knowledgeStoreFactory !== undefined
                ? options.knowledgeStoreFactory(knowledgeDir)
                : (existsSync(knowledgeDir) ? new KnowledgeStore(knowledgeDir) : null);
            if (reader === null) {
                responseJson(res, 200, emptyKnowledgePayload());
                return;
            }
            const lessons = reader.listLessons();
            const evidence = reader.listEvidence();
            const stats = normalizeKnowledgeStats(reader.stats());
            let retrieved = {};
            try {
                retrieved = readAutomaticState({ ...resolveConfig(options.config), journalDir: journalDirOf(options) }).retrieved ?? {};
            }
            catch { /* read-only panel still reports knowledge */ }
            const payload = {
                lessons: lessons.map((lesson) => maskDeep({
                    ...lesson,
                    scopeLabel: lessonScopeLabel(lesson.scope),
                    evidenceSummary: buildEvidenceSummary(lesson, evidence),
                    reviewDue: needsMemoryReview(lesson),
                    ...(reviewDeadline(lesson) === undefined ? {} : { nextReviewAt: new Date(reviewDeadline(lesson)).toISOString() }),
                    ...(retrieved[lesson.id] ? { lastRetrievedAt: new Date(retrieved[lesson.id].at).toISOString() } : {}),
                })),
                evidence: evidence.map((item) => maskDeep(item)),
                stats,
                memory: maskDeep(memoryDirectory(lessons, evidence)),
            };
            responseJson(res, 200, payload);
        }
        catch (error) {
            internalError(res, error);
        }
    };
}
/**
 * 把只读路由挂到宿主 webserver 上。
 * 与 dsh-calendar 相同：ctx.inject(['webServer']) + effect 注册，插件卸载即摘掉路由；
 * 同一个 effect 里注册日记 / 知识 / 写入记录三条 exact 路由，卸载时一起释放。
 */
export function installDreamWeb(ctx, options = {}) {
    if (ctx === null || ctx === undefined || typeof ctx.inject !== 'function') {
        throw new Error('dsh-dream: installDreamWeb 需要带 ctx.inject 的宿主上下文（宿主应提供 webServer 服务）');
    }
    const journalHandler = createDreamWebHandler(options);
    const knowledgeHandler = createKnowledgeWebHandler(options);
    const bridgeHandler = createBridgeWebHandler(options);
    ctx.inject(['webServer'], (webCtx) => {
        webCtx.effect(() => {
            const disposers = [
                webCtx.webServer.register({
                    kind: 'exact',
                    path: DREAM_ROUTE,
                    handler: (req, res) => journalHandler(req, res),
                }, 'dsh-dream: dream journal route'),
                webCtx.webServer.register({
                    kind: 'exact',
                    path: DREAM_KNOWLEDGE_ROUTE,
                    handler: (req, res) => knowledgeHandler(req, res),
                }, 'dsh-dream: knowledge route'),
                webCtx.webServer.register({
                    kind: 'exact',
                    path: DREAM_BRIDGE_ROUTE,
                    handler: (req, res) => bridgeHandler(req, res),
                }, 'dsh-dream: bridge log route'),
            ];
            return () => {
                for (const dispose of disposers) {
                    if (typeof dispose === 'function')
                        dispose();
                }
            };
        }, 'dsh-dream: web routes');
    });
}
