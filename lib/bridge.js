/**
 * 记忆桥接：把梦境里的高频教训合并进 AGENTS.md（幂等，带标记块）。
 *
 * @module dsh-dream/bridge
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { dreamStats } from './journal.js';
export const BRIDGE_START = '<!-- dsh-dream:lessons:start（自动生成，请勿手工编辑块内内容） -->';
export const BRIDGE_END = '<!-- dsh-dream:lessons:end -->';
/** 生成教训块文本。 */
export function buildLessonsBlock(lessons) {
    const lines = [BRIDGE_START, '', '## 梦境沉淀（dsh-dream 自动生成）', ''];
    for (const item of lessons) {
        lines.push('- ' + item.lesson + (item.count > 1 ? '（反复梦到 ' + item.count + ' 次）' : ''));
    }
    lines.push('', BRIDGE_END);
    return lines.join('\n');
}
/**
 * 把梦境教训合并进目标文件：无文件则创建，有标记块则替换，无标记块则追加。
 * @returns 动作类型与写入的教训数。
 */
export function bridgeDreams(journalDir, targetPath, maxLessons) {
    const stats = dreamStats(journalDir);
    if (stats.total === 0) {
        throw new Error('还没有做过梦：请先用 dream_digest + dream_save 做梦，再来桥接记忆。');
    }
    const lessons = stats.topLessons.slice(0, maxLessons);
    const block = buildLessonsBlock(lessons);
    if (!existsSync(targetPath)) {
        mkdirSync(dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, block + '\n', 'utf8');
        return { action: 'created', lessonsCount: lessons.length };
    }
    const current = readFileSync(targetPath, 'utf8');
    const startIdx = current.indexOf(BRIDGE_START);
    const endIdx = current.indexOf(BRIDGE_END);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const next = current.slice(0, startIdx) + block + current.slice(endIdx + BRIDGE_END.length);
        writeFileSync(targetPath, next, 'utf8');
        return { action: 'replaced', lessonsCount: lessons.length };
    }
    writeFileSync(targetPath, current.replace(/\s*$/, '') + '\n\n' + block + '\n', 'utf8');
    return { action: 'appended', lessonsCount: lessons.length };
}
