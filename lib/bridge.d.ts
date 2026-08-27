export declare const BRIDGE_START = "<!-- dsh-dream:lessons:start\uFF08\u81EA\u52A8\u751F\u6210\uFF0C\u8BF7\u52FF\u624B\u5DE5\u7F16\u8F91\u5757\u5185\u5185\u5BB9\uFF09 -->";
export declare const BRIDGE_END = "<!-- dsh-dream:lessons:end -->";
/** 生成教训块文本。 */
export declare function buildLessonsBlock(lessons: Array<{
    lesson: string;
    count: number;
}>): string;
/**
 * 把梦境教训合并进目标文件：无文件则创建，有标记块则替换，无标记块则追加。
 * @returns 动作类型与写入的教训数。
 */
export declare function bridgeDreams(journalDir: string, targetPath: string, maxLessons: number): {
    action: 'created' | 'replaced' | 'appended';
    lessonsCount: number;
};
