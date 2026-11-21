/**
 * DSH sessionQuery 桥接层：优先通过宿主 ctx.sessionQuery 读取实时/已持久化会话，
 * 并在缺失、空结果或读取失败时无缝回退到本地磁盘 sessions.ts / evidence.ts。
 *
 * 零外部运行时依赖：不 import @deepseek-ai/*，仅通过可选 ctx.inject(['sessionQuery']) 接入。
 *
 * @module dsh-dream/session-source
 */
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyEvidence } from './evidence.js';
import { digestSessionFile, listSessionFiles } from './sessions.js';
let activeSessionQuery;
function isSessionQueryLike(value) {
    if (value === null || typeof value !== 'object')
        return false;
    const candidate = value;
    return typeof candidate.listSessions === 'function' && typeof candidate.readSession === 'function';
}
/** 获取当前已绑定的宿主 sessionQuery 服务（未挂载时返回 undefined）。 */
export function getSessionQuery() {
    return activeSessionQuery;
}
/** 测试/显式注入用：设置当前 sessionQuery 并返回恢复函数。 */
export function setSessionQueryForTest(query) {
    const previous = activeSessionQuery;
    activeSessionQuery = query;
    return () => {
        if (activeSessionQuery === query)
            activeSessionQuery = previous;
    };
}
/** 可选挂载宿主 ctx.sessionQuery，并在插件或服务卸载时清理绑定。 */
export function installSessionQueryBridge(ctx) {
    if (ctx === null || typeof ctx !== 'object' || typeof ctx.inject !== 'function')
        return;
    ctx.inject(['sessionQuery'], (host) => {
        const service = host?.sessionQuery;
        if (!isSessionQueryLike(service))
            return;
        activeSessionQuery = service;
        let cleared = false;
        const clear = () => {
            if (cleared)
                return;
            cleared = true;
            if (activeSessionQuery === service)
                activeSessionQuery = undefined;
        };
        if (typeof host.effect === 'function') {
            host.effect(() => clear, 'dsh-dream: session-query-bridge');
        }
        else if (typeof host.on === 'function') {
            host.on('dispose', clear);
        }
        else if (typeof ctx.effect === 'function') {
            ctx.effect(() => clear, 'dsh-dream: session-query-bridge');
        }
        else if (typeof ctx.on === 'function') {
            ctx.on('dispose', clear);
        }
    });
}
function asObj(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function nonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}
function blockText(value) {
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value)) {
        return value
            .map(blockText)
            .filter((text) => text !== '')
            .join('');
    }
    if (typeof value === 'object' && value !== null) {
        const rec = value;
        if (typeof rec.type === 'string' && rec.type !== 'text')
            return '';
        for (const key of ['text', 'content']) {
            const inner = blockText(rec[key]);
            if (inner !== '')
                return inner;
        }
    }
    return '';
}
function textOf(data) {
    if (typeof data === 'string')
        return data;
    if (typeof data === 'object' && data !== null) {
        const rec = data;
        for (const key of ['text', 'content', 'message', 'title']) {
            const value = blockText(rec[key]);
            if (value !== '')
                return value;
        }
    }
    return '';
}
function visibleText(value) {
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value))
        return value.map(visibleText).join('');
    const item = asObj(value);
    if (item.type !== undefined && item.type !== 'text')
        return '';
    return visibleText(item.text ?? item.content ?? '');
}
function normalized(text) {
    return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}
function samePath(a, b) {
    const canonical = (p) => {
        try {
            return realpathSync(p);
        }
        catch {
            return resolve(p);
        }
    };
    const left = canonical(a);
    const right = canonical(b);
    return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}
/** 把内存中的 SessionHeader + SessionEvent[] 转换为与 digestSessionFile 等价的 SessionDigest。 */
export function digestSessionFromEvents(rawHeader, events, maxUserMessages) {
    const header = asObj(rawHeader);
    if (header.type !== undefined && header.type !== 'session')
        return null;
    const id = typeof header.id === 'string' ? header.id : '';
    if (id === '')
        return null;
    const digest = {
        id,
        createdAt: typeof header.createdAt === 'number' ? header.createdAt : 0,
        cwd: typeof header.cwd === 'string' ? header.cwd : '',
        agentPreset: typeof header.agentPreset === 'string' ? header.agentPreset : '',
        origin: typeof header.origin === 'string' ? header.origin : '',
        title: '',
        turns: 0,
        userMessages: [],
        assistantTail: [],
        toolCalls: [],
        streamTail: '',
        endedAt: null,
    };
    const appendStreamText = (text) => {
        digest.streamTail = (digest.streamTail + text).slice(-4000);
    };
    const appendToolName = (name) => {
        if (typeof name === 'string' && name !== '' && digest.toolCalls.length < 200)
            digest.toolCalls.push(name);
    };
    const readStreamRecord = (value) => {
        if (typeof value !== 'object' || value === null)
            return;
        const record = value;
        if (record.type === 'text-chunks' && Array.isArray(record.texts)) {
            appendStreamText(record.texts.filter((part) => typeof part === 'string').join(''));
        }
        else if (record.type === 'tool-call-chunks') {
            appendToolName(record.name);
        }
        else if (record.type === 'chunk' && typeof record.chunk === 'object' && record.chunk !== null) {
            const chunk = record.chunk;
            if (chunk.type === 'text-delta' && typeof chunk.text === 'string')
                appendStreamText(chunk.text);
            if (chunk.type === 'tool-call-start')
                appendToolName(chunk.name);
        }
    };
    for (const rawEvent of events) {
        if (typeof rawEvent !== 'object' || rawEvent === null || Array.isArray(rawEvent))
            continue;
        const rec = rawEvent;
        const type = String(rec.type ?? '');
        const data = rec.data;
        const time = typeof rec.time === 'number' ? rec.time : typeof rec.time0 === 'number' ? rec.time0 : null;
        if (time !== null && (digest.endedAt === null || time > digest.endedAt))
            digest.endedAt = time;
        if ((type === 'assistant/message' || type === 'assistant/attempt') && typeof data === 'object' && data !== null) {
            const stream = data.stream;
            if (Array.isArray(stream))
                for (const item of stream)
                    readStreamRecord(item);
        }
        if (type === 'session/title') {
            digest.title = textOf(data);
        }
        else if (type === 'turn/start') {
            digest.turns++;
        }
        else if (type === 'user/message') {
            if (typeof data === 'object' && data !== null) {
                const source = data.source;
                // User-role injections (runtime-context, notices, etc.) are not the human's original words.
                if (typeof source === 'object' && source !== null && source.kind !== 'user')
                    continue;
            }
            const msg = textOf(data);
            if (msg !== '' && digest.userMessages.length < maxUserMessages * 2)
                digest.userMessages.push(msg);
        }
        else if (type === 'assistant/message') {
            const msg = textOf(data);
            if (msg !== '') {
                digest.assistantTail.push(msg);
                if (digest.assistantTail.length > 3)
                    digest.assistantTail.shift();
            }
        }
        else if (type === 'tool/call' || type === 'tool/code-dispatch-start' || type === 'tool/ptc-dispatch-start') {
            if (typeof data === 'object' && data !== null)
                appendToolName(data.name);
        }
        else if (type === 'text-chunks' || type === 'tool-call-chunks') {
            if (typeof data === 'object' && data !== null)
                readStreamRecord({ ...data, type });
        }
        else if (type === 'assistant/chunk' && typeof data === 'object' && data !== null) {
            readStreamRecord({ type: 'chunk', chunk: data.chunk });
        }
    }
    digest.userMessages = digest.userMessages.slice(0, maxUserMessages);
    return digest;
}
function isUsableDigest(digest) {
    if (digest === null)
        return false;
    if (digest.origin === 'subagent')
        return false;
    if (digest.turns === 0
        && digest.userMessages.length === 0
        && digest.assistantTail.length === 0
        && digest.toolCalls.length === 0
        && digest.streamTail.trim() === '') {
        return false;
    }
    return true;
}
function digestSessionsFromDisk(cfg, limit) {
    const files = listSessionFiles(cfg.sessionsRoot, limit * 3);
    const digests = [];
    for (const file of files) {
        if (digests.length >= limit)
            break;
        const digest = digestSessionFile(file, cfg.maxUserMessages);
        if (!isUsableDigest(digest))
            continue;
        digests.push(digest);
    }
    return digests;
}
/**
 * 回放最近主会话摘要：优先通过 live-preferred sessionQuery 读取（支持未刷盘活跃会话），
 * 当 sessionQuery 不可用、无可用会话或发生错误时无缝回退到磁盘 sessionsRoot。
 */
export async function digestSessionsWithFallback(cfg, max, queryOverride) {
    const limit = typeof max === 'number' && Number.isInteger(max)
        ? Math.min(50, Math.max(1, max))
        : cfg.maxSessions;
    const query = queryOverride ?? activeSessionQuery;
    if (query !== undefined && typeof query.listSessions === 'function' && typeof query.readSession === 'function') {
        try {
            const listed = await query.listSessions();
            if (Array.isArray(listed) && listed.length > 0) {
                const digests = [];
                let inspected = 0;
                const maxInspect = limit * 3;
                for (const item of listed) {
                    if (digests.length >= limit || inspected >= maxInspect)
                        break;
                    const header = asObj(item?.header);
                    const sessionId = typeof header.id === 'string' ? header.id : '';
                    if (sessionId === '' || header.origin === 'subagent')
                        continue;
                    inspected++;
                    let snapshot;
                    try {
                        snapshot = await query.readSession(sessionId);
                    }
                    catch {
                        continue;
                    }
                    if (!snapshot || !Array.isArray(snapshot.events))
                        continue;
                    const digest = digestSessionFromEvents(snapshot.session ?? header, snapshot.events, cfg.maxUserMessages);
                    if (!isUsableDigest(digest))
                        continue;
                    digests.push(digest);
                }
                if (digests.length > 0)
                    return digests;
            }
        }
        catch {
            // sessionQuery 不可用或出错时无缝回退到磁盘读取
        }
    }
    return digestSessionsFromDisk(cfg, limit);
}
function numericSeq(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && /^\d+$/.test(value.trim()))
        return Number(value.trim());
    return undefined;
}
function routeFromEvent(event) {
    const data = asObj(event.data);
    if (event.type === 'request/context') {
        const provider = nonEmptyString(data.provider);
        const model = nonEmptyString(data.model);
        if (provider !== undefined || model !== undefined)
            return { provider, model };
        return undefined;
    }
    if (event.type === 'request/header') {
        const headerConfig = asObj(asObj(data.header).config);
        const directConfig = asObj(data.config);
        const provider = nonEmptyString(headerConfig.provider) ?? nonEmptyString(directConfig.provider) ?? nonEmptyString(data.provider);
        const model = nonEmptyString(headerConfig.model) ?? nonEmptyString(directConfig.model) ?? nonEmptyString(data.model);
        if (provider !== undefined || model !== undefined)
            return { provider, model };
        return undefined;
    }
    return undefined;
}
function extractSessionProvenance(header, events, targetSeqRaw) {
    const targetSeq = numericSeq(targetSeqRaw);
    let beforeProvider;
    let beforeModel;
    let afterProvider;
    let afterModel;
    let seenTarget = false;
    for (const rawEvent of events) {
        const event = asObj(rawEvent);
        const evSeq = numericSeq(event.seq);
        const isTarget = event.seq !== undefined && String(event.seq) === String(targetSeqRaw);
        const route = routeFromEvent(event);
        if (route !== undefined) {
            const isBeforeOrAt = targetSeq !== undefined && evSeq !== undefined
                ? evSeq <= targetSeq
                : !seenTarget;
            if (isBeforeOrAt) {
                if (route.provider !== undefined)
                    beforeProvider = route.provider;
                if (route.model !== undefined)
                    beforeModel = route.model;
            }
            else {
                if (afterProvider === undefined && route.provider !== undefined)
                    afterProvider = route.provider;
                if (afterModel === undefined && route.model !== undefined)
                    afterModel = route.model;
            }
        }
        if (isTarget)
            seenTarget = true;
    }
    const provider = beforeProvider ?? afterProvider;
    const model = beforeModel ?? afterModel;
    const agentPreset = nonEmptyString(header.agentPreset);
    return {
        ...(provider !== undefined ? { provider } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(agentPreset !== undefined ? { agentPreset } : {}),
    };
}
/**
 * 核验证据：会话类证据优先使用宿主 sessionQuery.readSession（可核验未刷盘实时事件，
 * 并提取匹配轮次的 provider / model / agentPreset 元数据）；
 * 未挂载 sessionQuery、目标会话未命中或 local-artifact 时无缝退回同步 verifyEvidence()。
 */
export async function verifyEvidenceWithSessionQuery(claim, context, queryOverride) {
    if (claim.kind === 'local-artifact') {
        return verifyEvidence(claim, context);
    }
    const base = {
        kind: claim.kind,
        summary: claim.summary,
        verification: 'claimed',
        ...(claim.sessionId !== undefined ? { sessionId: claim.sessionId } : {}),
        ...(claim.recordSeq !== undefined ? { recordSeq: claim.recordSeq } : {}),
        ...(context.projectId !== undefined ? { projectId: context.projectId } : {}),
    };
    const held = (reason) => ({ ...base, verificationReason: reason });
    if (claim.verification !== 'read')
        return held('model-claimed');
    const quote = normalized(claim.quote ?? claim.summary);
    if (quote === '')
        return held('quote-missing');
    if (!claim.sessionId || claim.recordSeq === undefined)
        return held('session-reference-missing');
    const query = queryOverride ?? activeSessionQuery;
    if (query === undefined || typeof query.readSession !== 'function') {
        return verifyEvidence(claim, context);
    }
    let snapshot;
    try {
        snapshot = await query.readSession(claim.sessionId);
    }
    catch {
        return verifyEvidence(claim, context);
    }
    if (!snapshot || !Array.isArray(snapshot.events)) {
        return verifyEvidence(claim, context);
    }
    try {
        const header = asObj(snapshot.session);
        if (header.id !== claim.sessionId)
            return held('session-header-mismatch');
        if (context.workspaceRoot && (typeof header.cwd !== 'string' || !samePath(header.cwd, context.workspaceRoot))) {
            return held('workspace-mismatch');
        }
        if (context.projectId && typeof header.projectId === 'string' && header.projectId !== '' && header.projectId !== context.projectId) {
            return held('project-mismatch');
        }
        const found = [];
        for (const rawEvent of snapshot.events) {
            const item = asObj(rawEvent);
            if (item.seq !== undefined && String(item.seq) === String(claim.recordSeq))
                found.push(item);
        }
        if (found.length !== 1)
            return held('record-not-found-or-ambiguous');
        const entry = found[0];
        const data = asObj(entry.data);
        if (claim.kind === 'user-correction') {
            const enforceV4Source = typeof header.version === 'number' ? header.version >= 4 : data.source !== undefined;
            if (entry.type !== 'user/message' || (enforceV4Source && asObj(data.source).kind !== 'user')) {
                return held('not-human-message');
            }
        }
        if (entry.type !== 'user/message' && entry.type !== 'assistant/message' && entry.type !== 'tool/result') {
            return held('record-not-visible');
        }
        const toolOutput = entry.type === 'tool/result';
        const text = visibleText(data.content ?? data.text ?? data.message ?? entry.data);
        if (!normalized(text).includes(quote))
            return held('quote-mismatch');
        const hash = createHash('sha256').update(text, 'utf8').digest('hex');
        if (claim.sourceHash !== undefined && claim.sourceHash !== hash)
            return held('source-hash-mismatch');
        const provenance = extractSessionProvenance(header, snapshot.events, entry.seq);
        if (toolOutput) {
            return { ...base, ...provenance, sourceHash: hash, verificationReason: 'tool-output-observed' };
        }
        return { ...base, ...provenance, verification: 'read', sourceHash: hash, verificationReason: 'source-verified' };
    }
    catch {
        return verifyEvidence(claim, context);
    }
}
