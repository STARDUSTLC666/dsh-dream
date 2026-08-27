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
/** 梦境统计：总数、心境分布、高频教训。 */
export interface DreamStats {
    total: number;
    moods: Record<string, number>;
    topLessons: Array<{
        lesson: string;
        count: number;
    }>;
}
/** 统计梦境（基于全量日记）。 */
export declare function dreamStats(journalDir: string): DreamStats;
/** 关键词检索梦境（不区分大小写，命中 reflection/lessons）。 */
export declare function searchDreams(journalDir: string, query: string, limit: number): DreamEntry[];
