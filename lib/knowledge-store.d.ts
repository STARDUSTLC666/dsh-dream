import { type Evidence, type EvidenceInput, type Lesson, type LessonInput, type LessonState, type ReviewDecision } from './knowledge.js';
/** events.jsonl 默认最多回放的行数（有界读取）。 */
export declare const MAX_REPLAY_EVENTS = 200000;
/** KnowledgeStore 构造选项（都可省略，保持 FREEZE 的 constructor(knowledgeDir) 可用）。 */
export interface KnowledgeStoreOptions {
    /** 写盘前是否按 mask.ts 脱敏；默认 true（与插件默认 maskSecrets=true 一致）。 */
    maskSecrets?: boolean;
    /** 回放行数上限；默认 MAX_REPLAY_EVENTS，测试可调小。 */
    maxReplayEvents?: number;
    /** 获取锁的最长等待毫秒数；默认 2000。 */
    lockTimeoutMs?: number;
    /** 锁年龄超过该毫秒数且 pid 不存活才允许接管；默认 30000。 */
    lockStaleMs?: number;
}
/**
 * 经验知识存储。无文件时所有读取方法安全返回空，写入方法在首次写入时自建目录。
 */
export declare class KnowledgeStore {
    private readonly dir;
    private readonly eventsPath;
    private readonly evidencePath;
    private readonly indexPath;
    private readonly lockPath;
    private readonly mask;
    private readonly maxReplayEvents;
    private readonly lockTimeoutMs;
    private readonly lockStaleMs;
    constructor(knowledgeDir: string, options?: KnowledgeStoreOptions);
    /** 全部经验，按 updatedAt 降序（同刻按 id 稳定排序）。 */
    listLessons(): Lesson[];
    /** 全部证据，按 observedAt 升序（同刻按 id 稳定排序）。 */
    listEvidence(): Evidence[];
    /** 按 id 取经验；不存在返回 undefined。 */
    getLesson(id: string): Lesson | undefined;
    /** 追加证据；同 sessionId+recordSeq 或同 sourceHash 视为重复，返回已有记录且不写。 */
    appendEvidence(input: EvidenceInput): {
        evidence: Evidence;
        created: boolean;
    };
    /**
     * 创建候选经验。同 idempotencyKey 幂等；同指纹（文本 + 范围相同）确定性合并，
     * 只把新证据并入已有经验，不新增经验。
     */
    createLesson(input: LessonInput, idempotencyKey: string): {
        lesson: Lesson;
        created: boolean;
    };
    /** 按 patch 更新经验；revision 不符抛 KnowledgeError('revision') 且不写。 */
    updateLesson(id: string, patch: Partial<Lesson>, expectedRevision: number, idempotencyKey: string): Lesson;
    /** 审阅经验：accepted → usable，rejected → rejected，unreviewed → candidate。 */
    reviewLesson(id: string, decision: ReviewDecision, expectedRevision: number, idempotencyKey: string, actor?: string): Lesson;
    /** 状态迁移；不允许的迁移抛 KnowledgeError('invalid') 且不写。 */
    applyTransition(id: string, to: LessonState, expectedRevision: number, idempotencyKey: string): Lesson;
    /** 从事件重建派生索引；不删除、不改写 events.jsonl / evidence.jsonl。 */
    rebuildIndex(): void;
    /** 统计。truncated=true 表示回放被 MAX_REPLAY_EVENTS 截断（不静默）。 */
    stats(): {
        lessons: number;
        evidence: number;
        events: number;
        byState: Record<LessonState, number>;
        truncated: boolean;
        badLines: number;
    };
    private ensureDir;
    private withLock;
    /** 有界读取 JSONL：只保留最后 maxReplayEvents 条非空行，并报告总行数与截断。 */
    private readBoundedLines;
    /** 只回放事件流。 */
    private loadEvents;
    /** 事件流 + evidence.jsonl（两条路径都留痕，按 id 合并去重）。 */
    private loadAll;
    private applyEventLine;
    private appendEvent;
    private appendLine;
    private findEvidenceByNaturalKey;
    /** 在锁内追加/复用一条证据；同天然身份键返回已有记录且不写。 */
    private persistEvidenceLocked;
    /** 在锁内追加 lesson.update 并同步内存与索引。 */
    private appendLessonUpdate;
    private maskLesson;
    private maskEvidence;
    private buildIndexPayload;
    /** 自动更新派生索引：失败降级（权威事件已落盘），不推翻调用结果。 */
    private writeIndex;
    private writeIndexStrict;
}
