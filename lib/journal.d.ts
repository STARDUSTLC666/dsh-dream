/** 一条梦境。 */
export interface DreamEntry {
    id: string;
    at: string;
    reflection: string;
    lessons: string[];
    mood: string;
}
export declare function journalFile(journalDir: string): string;
/** 追加一条梦；返回落盘后的条目。 */
export declare function saveDream(journalDir: string, reflection: string, lessons: string[], mood: string): DreamEntry;
/** 倒序读取梦境（新梦在前）；损坏行跳过。 */
export declare function readDreams(journalDir: string, limit: number): DreamEntry[];
/** 教训榜的一行：次数与最近一次出现时间（lastAt 缺失时是空串，绝不为 null）。 */
export interface LessonStat {
    lesson: string;
    count: number;
    lastAt: string;
}
/** 梦境统计：总数、心境分布、教训榜。 */
export interface DreamStats {
    total: number;
    moods: Record<string, number>;
    topLessons: LessonStat[];
}
/**
 * 统计梦境（基于全量日记）。
 *
 * count 与 lastAt 来自同一遍倒序扫描：readDreams 已经新梦在前，所以某个
 * 教训第一次出现的那条梦，就是它最近一次出现；顺手在那次循环里记下原始
 * 大小写，不再二次 flatMap（否则同一条教训的三个数值会来自不同的扫描）。
 */
export declare function dreamStats(journalDir: string): DreamStats;
/** 关键词检索梦境（不区分大小写，命中 reflection/lessons；扫描全量，上限见 FULL_SCAN_LIMIT）。 */
export declare function searchDreams(journalDir: string, query: string, limit: number): DreamEntry[];
