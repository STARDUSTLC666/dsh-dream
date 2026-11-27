/**
 * 梦境日记：JSONL 追加式存储（每行一条梦），倒序读取与关键词检索。
 *
 * @module dsh-dream/journal
 */
import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readSync } from 'node:fs';
import { join } from 'node:path';
import { appendJsonLine } from './jsonl.js';
export function journalFile(journalDir) {
    return join(journalDir, 'dreams.jsonl');
}
const MAX_RECORD_BYTES = 1024 * 1024;
/** 追加一条梦；返回落盘后的条目。 */
export function saveDream(journalDir, reflection, lessons, mood) {
    const trimmed = reflection.trim();
    if (trimmed === '')
        throw new Error('梦境不能为空：请在 reflection 里写下你的反思。');
    const entry = {
        id: 'dream-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
        at: new Date().toISOString(),
        reflection: trimmed,
        lessons: lessons.map((lesson) => lesson.trim()).filter((lesson) => lesson !== ''),
        mood: mood.trim() || '平静',
    };
    if (Buffer.byteLength(JSON.stringify(entry)) > MAX_RECORD_BYTES)
        throw new Error('单条梦境记录不能超过 1 MiB。');
    mkdirSync(journalDir, { recursive: true });
    appendJsonLine(journalFile(journalDir), entry);
    return entry;
}
/** Full-scan consumers retain at most this many valid records. */
const FULL_SCAN_LIMIT = 100000;
function scanDreams(journalDir, visit) {
    const file = journalFile(journalDir);
    if (!existsSync(file))
        return 0;
    const descriptor = openSync(file, 'r');
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let skippedLines = 0;
    let pending = Buffer.alloc(0);
    let skippingLongLine = false;
    let recordsSeen = 0;
    const consume = (bytes, firstLine = false) => {
        let line = bytes.toString('utf8');
        if (firstLine)
            line = line.replace(/^\uFEFF/, '');
        if (line.trim() === '')
            return;
        if (Buffer.byteLength(line) > MAX_RECORD_BYTES) {
            skippedLines += 1;
            return;
        }
        try {
            const rec = JSON.parse(line);
            if (typeof rec.reflection !== 'string') {
                skippedLines += 1;
                return;
            }
            const dream = {
                id: String(rec.id ?? ''),
                at: String(rec.at ?? ''),
                reflection: rec.reflection,
                lessons: Array.isArray(rec.lessons) ? rec.lessons.filter((l) => typeof l === 'string') : [],
                mood: typeof rec.mood === 'string' ? rec.mood : '',
            };
            if (recordsSeen < FULL_SCAN_LIMIT)
                visit(dream);
            recordsSeen += 1;
        }
        catch {
            skippedLines += 1;
        }
    };
    // Scan newest first so the 100,000-record window never hides newly appended dreams.
    // Split on newline bytes before decoding: UTF-8 characters can span read chunks.
    const consumeChunk = (chunk) => {
        let end = chunk.length;
        for (let index = chunk.length - 1; index >= 0; index -= 1) {
            if (chunk[index] !== 10)
                continue;
            if (skippingLongLine) {
                skippedLines += 1;
                skippingLongLine = false;
            }
            else {
                consume(Buffer.concat([chunk.subarray(index + 1, end), pending]));
            }
            pending = Buffer.alloc(0);
            end = index;
        }
        if (skippingLongLine)
            return;
        if (end + pending.length > MAX_RECORD_BYTES) {
            pending = Buffer.alloc(0);
            skippingLongLine = true;
        }
        else {
            pending = Buffer.concat([chunk.subarray(0, end), pending]);
        }
    };
    try {
        let position = fstatSync(descriptor).size;
        while (position > 0) {
            const length = Math.min(buffer.length, position);
            position -= length;
            const count = readSync(descriptor, buffer, 0, length, position);
            if (count === 0)
                break;
            consumeChunk(buffer.subarray(0, count));
        }
        if (skippingLongLine)
            skippedLines += 1;
        else if (pending.length > 0)
            consume(pending, true);
    }
    finally {
        closeSync(descriptor);
    }
    return skippedLines;
}
/**
 * 倒序读取梦境并**报告**跳过了多少行。
 * BOM is ignored, malformed rows are counted, and only the requested newest rows are retained.
 */
export function readDreamsDetailed(journalDir, limit) {
    const keepLimit = Math.min(FULL_SCAN_LIMIT, Math.max(0, Math.floor(limit)));
    const dreams = [];
    const skippedLines = scanDreams(journalDir, (dream) => {
        if (dreams.length < keepLimit)
            dreams.push(dream);
    });
    return { dreams, skippedLines };
}
/** 倒序读取梦境（新梦在前）；损坏行跳过。 */
export function readDreams(journalDir, limit) {
    return readDreamsDetailed(journalDir, limit).dreams;
}
/**
 * 统计梦境（基于全量日记）。
 *
 * count 与 lastAt 来自同一遍倒序扫描：readDreams 已经新梦在前，所以某个
 * 教训第一次出现的那条梦，就是它最近一次出现；顺手在那次循环里记下原始
 * 大小写，不再二次 flatMap（否则同一条教训的三个数值会来自不同的扫描）。
 */
export function dreamStats(journalDir) {
    // 无原型对象：心境是用户可控文本，'__proto__' / 'constructor' 这类键
    // 在普通对象上会被原型吞掉或把计数变成字符串（评审实测）。
    const moods = Object.create(null);
    const lessons = new Map();
    let total = 0;
    const skippedLines = scanDreams(journalDir, (dream) => {
        total += 1;
        const mood = dream.mood !== '' ? dream.mood : '平静';
        moods[mood] = (moods[mood] ?? 0) + 1;
        for (const lesson of dream.lessons) {
            const key = lesson.toLowerCase();
            const known = lessons.get(key);
            if (known === undefined) {
                lessons.set(key, { lesson, count: 1, lastAt: dream.at });
            }
            else {
                known.count += 1;
            }
        }
    });
    const topLessons = [...lessons.values()]
        .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt))
        .slice(0, 10);
    // 对外给普通对象副本：内部用无原型对象防键污染，但消费方（deepStrictEqual / 原型判断）
    // 期望的是普通对象。展开赋值走 CreateDataProperty，不会触发 __proto__ setter。
    return { total, moods: { ...moods }, topLessons, skippedLines };
}
/** 关键词检索梦境（不区分大小写，命中 reflection/lessons；优先精确子串，多词无连续命中时回落全词 AND；扫描全量，上限见 FULL_SCAN_LIMIT）。 */
export function searchDreams(journalDir, query, limit) {
    const needle = query.toLowerCase();
    const keepLimit = Math.min(FULL_SCAN_LIMIT, Math.max(0, Math.floor(limit)));
    const terms = needle.trim().split(/\s+/).filter((term) => term !== '');
    const exactHits = [];
    const andHits = [];
    scanDreams(journalDir, (entry) => {
        const haystack = (entry.reflection + ' ' + entry.lessons.join(' ')).toLowerCase();
        if (haystack.includes(needle)) {
            if (exactHits.length < keepLimit)
                exactHits.push(entry);
        }
        else if (terms.length > 1 && andHits.length < keepLimit && terms.every((term) => haystack.includes(term))) {
            andHits.push(entry);
        }
    });
    return exactHits.length > 0 ? exactHits : andHits;
}
