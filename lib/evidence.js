/** 工具参数只是来源声明；只有本模块读到匹配的可见记录后才产生 read。 */
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { decompressAll, listSessionFiles } from './sessions.js';
function record(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function visibleText(value) {
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value))
        return value.map(visibleText).join('');
    const item = record(value);
    if (item.type !== undefined && item.type !== 'text')
        return '';
    return visibleText(item.text ?? item.content ?? '');
}
function normalized(text) { return text.normalize('NFC').replace(/\s+/g, ' ').trim(); }
function inside(root, file) {
    const rel = relative(root, file);
    return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}
function samePath(a, b) {
    const canonical = (p) => { try {
        return realpathSync(p);
    }
    catch {
        return resolve(p);
    } };
    const left = canonical(a), right = canonical(b);
    return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}
function readBounded(file, maxBytes) {
    const stat = statSync(file);
    if (!stat.isFile() || stat.size > maxBytes)
        throw new Error('source-unreadable');
    const bytes = readFileSync(file);
    if (bytes.length > maxBytes)
        throw new Error('source-unreadable');
    return bytes;
}
/** 核验失败保留 claimed 和原因；永远不以模型提供的 hash、verification 或用户角色为准。 */
export function verifyEvidence(claim, context) {
    const base = {
        kind: claim.kind, summary: claim.summary, verification: 'claimed',
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
    try {
        let text;
        if (claim.kind === 'local-artifact') {
            if (!context.cwd || !claim.artifactPath)
                return held('artifact-context-missing');
            const root = realpathSync(context.cwd);
            if (context.workspaceRoot && !samePath(root, context.workspaceRoot))
                return held('workspace-mismatch');
            const file = realpathSync(resolve(root, claim.artifactPath));
            if (!inside(root, file))
                return held('artifact-outside-workspace');
            const bytes = readBounded(file, 1024 * 1024);
            text = bytes.toString('utf8');
            if (bytes.includes(0) || !Buffer.from(text, 'utf8').equals(bytes))
                return held('artifact-not-text');
        }
        else {
            if (!claim.sessionId || claim.recordSeq === undefined)
                return held('session-reference-missing');
            const root = realpathSync(context.sessionsRoot);
            const candidates = listSessionFiles(root, 10000).filter(file => basename(dirname(file)) === claim.sessionId);
            if (candidates.length !== 1)
                return held('session-not-found-or-ambiguous');
            const file = realpathSync(candidates[0]);
            if (!inside(root, file))
                return held('session-outside-root');
            if (context.projectId && basename(dirname(dirname(file))) !== context.projectId)
                return held('project-mismatch');
            const bytes = readBounded(file, 64 * 1024 * 1024);
            const content = file.endsWith('.zstd') ? decompressAll(bytes) : bytes.toString('utf8');
            if (Buffer.byteLength(content) > 64 * 1024 * 1024)
                return held('source-unreadable');
            const lines = content.split('\n').filter(line => line.trim() !== '');
            const header = record(JSON.parse(lines[0] ?? 'null'));
            if (header.type !== 'session' || header.id !== claim.sessionId || (header.version !== undefined && ![0, 1, 2, 3, 4].includes(header.version)))
                return held('session-header-mismatch');
            if (context.workspaceRoot && (typeof header.cwd !== 'string' || !samePath(header.cwd, context.workspaceRoot)))
                return held('workspace-mismatch');
            const found = [];
            for (const line of lines.slice(1)) {
                try {
                    const item = record(JSON.parse(line));
                    if (item.seq !== undefined && String(item.seq) === String(claim.recordSeq))
                        found.push(item);
                }
                catch { /* 坏行不是证据 */ }
            }
            if (found.length !== 1)
                return held('record-not-found-or-ambiguous');
            const entry = found[0], data = record(entry.data);
            if (claim.kind === 'user-correction' && (entry.type !== 'user/message' || (header.version >= 4 && record(data.source).kind !== 'user')))
                return held('not-human-message');
            if (entry.type !== 'user/message' && entry.type !== 'assistant/message' && entry.type !== 'tool/result')
                return held('record-not-visible');
            text = visibleText(data.content ?? data.text ?? data.message ?? entry.data);
        }
        if (!normalized(text).includes(quote))
            return held('quote-mismatch');
        const hash = createHash('sha256').update(text, 'utf8').digest('hex');
        if (claim.sourceHash !== undefined && claim.sourceHash !== hash)
            return held('source-hash-mismatch');
        return { ...base, verification: 'read', sourceHash: hash, verificationReason: 'source-verified' };
    }
    catch {
        return held('source-unreadable');
    }
}
