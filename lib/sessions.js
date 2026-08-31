/**
 * DSH 会话日志读取：官方格式为“多帧 zstd 拼接的 JSONL”。
 * 首个逻辑行是会话头（{ type: 'session', ... }），其后每行一条存储记录（{ type, seq, time, data }）。
 * 本模块只读不写；损坏帧/行一律容错跳过。
 *
 * @module dsh-dream/sessions
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { zstdDecompressSync } from 'node:zlib';
/** zstd 帧魔数。 */
export const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd];
/** 扫描 zstd 帧边界（按魔数；误命中由解压失败兜底）。 */
export function frameRanges(buf) {
    const starts = [];
    for (let i = 0; i + 3 < buf.length; i++) {
        if (buf[i] === ZSTD_MAGIC[0] && buf[i + 1] === ZSTD_MAGIC[1] && buf[i + 2] === ZSTD_MAGIC[2] && buf[i + 3] === ZSTD_MAGIC[3]) {
            starts.push(i);
        }
    }
    return starts.map((start, i) => ({ start, end: i + 1 < starts.length ? starts[i + 1] : buf.length }));
}
/** 多帧解压为文本（损坏帧跳过）。 */
export function decompressAll(buf) {
    const parts = [];
    for (const { start, end } of frameRanges(buf)) {
        try {
            parts.push(zstdDecompressSync(buf.subarray(start, end)));
        }
        catch { /* 误命中魔数的噪声区段，跳过 */ }
    }
    return Buffer.concat(parts).toString('utf8');
}
/** 提取任意载荷的纯文本：兼容字符串与官方 ContentBlock 数组（{type:'text', text}）。 */
function blockText(value) {
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value)) {
        return value
            .map((item) => {
            if (typeof item === 'string')
                return item;
            if (typeof item === 'object' && item !== null) {
                const rec = item;
                return typeof rec.text === 'string' ? rec.text : '';
            }
            return '';
        })
            .filter((text) => text !== '')
            .join('');
    }
    if (typeof value === 'object' && value !== null) {
        const rec = value;
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
/** 解析单个会话文件为摘要；文件不存在或损坏时返回 null。 */
export function digestSessionFile(filePath, maxUserMessages) {
    if (!existsSync(filePath))
        return null;
    let text;
    try {
        text = decompressAll(readFileSync(filePath));
    }
    catch {
        return null;
    }
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    if (lines.length === 0)
        return null;
    let header = null;
    try {
        const first = JSON.parse(lines[0]);
        if (first.type !== 'session')
            return null;
        header = {
            id: String(first.id ?? ''),
            createdAt: typeof first.createdAt === 'number' ? first.createdAt : 0,
            cwd: String(first.cwd ?? ''),
            origin: String(first.origin ?? ''),
            delegationDepth: typeof first.delegationDepth === 'number' ? first.delegationDepth : 0,
            agentPreset: String(first.agentPreset ?? ''),
        };
    }
    catch {
        return null;
    }
    const digest = {
        ...header,
        title: '',
        turns: 0,
        userMessages: [],
        assistantTail: [],
        toolCalls: [],
        streamTail: '',
        endedAt: null,
    };
    for (const line of lines.slice(1)) {
        let rec;
        try {
            rec = JSON.parse(line);
        }
        catch {
            continue;
        }
        const type = String(rec.type ?? '');
        const data = rec.data;
        const time = typeof rec.time === 'number' ? rec.time : null;
        if (time !== null && (digest.endedAt === null || time > digest.endedAt))
            digest.endedAt = time;
        if (type === 'session/title') {
            digest.title = textOf(data);
        }
        else if (type === 'turn/start') {
            digest.turns++;
        }
        else if (type === 'user/message') {
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
        else if (type === 'tool/call') {
            const name = typeof data === 'object' && data !== null ? String(data.name ?? '') : '';
            if (name !== '' && digest.toolCalls.length < 200)
                digest.toolCalls.push(name);
        }
        else if (type === 'text-chunks') {
            // 官方打包行：{ data: { texts: string[], ... } }，还原流式正文
            const texts = typeof data === 'object' && data !== null ? data.texts : undefined;
            if (Array.isArray(texts)) {
                digest.streamTail += texts.filter((t) => typeof t === 'string').join('');
                if (digest.streamTail.length > 4000)
                    digest.streamTail = digest.streamTail.slice(-4000);
            }
        }
        else if (type === 'tool-call-chunks') {
            // 官方打包行：还原工具名足迹
            const name = typeof data === 'object' && data !== null ? String(data.name ?? '') : '';
            if (name !== '' && digest.toolCalls.length < 200)
                digest.toolCalls.push(name);
        }
    }
    digest.userMessages = digest.userMessages.slice(0, maxUserMessages);
    return digest;
}
/** 列出指定根目录下最近修改的会话文件路径（跳过子代理会话目录由调用方按摘要 origin 过滤）。 */
export function listSessionFiles(sessionsRoot, limit) {
    if (!existsSync(sessionsRoot))
        return [];
    const out = [];
    for (const project of readdirSync(sessionsRoot)) {
        const projectDir = join(sessionsRoot, project);
        try {
            if (!statSync(projectDir).isDirectory())
                continue;
        }
        catch {
            continue;
        }
        for (const session of readdirSync(projectDir)) {
            const file = join(projectDir, session, 'session.jsonl.zstd');
            try {
                if (existsSync(file))
                    out.push({ file, mtime: statSync(file).mtimeMs });
            }
            catch { /* 并发删除等竞态，跳过 */ }
        }
    }
    out.sort((a, b) => b.mtime - a.mtime);
    return out.slice(0, limit).map((item) => item.file);
}
