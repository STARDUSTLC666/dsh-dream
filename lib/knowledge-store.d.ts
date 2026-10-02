import { type Evidence, type EvidenceInput, type Lesson, type LessonInput, type LessonReviewResolution, type LessonState, type ReviewDecision } from './knowledge.js';
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
    /** 锁硬上限：超过且心跳停滞时给可操作错误、不静默抢占；默认 600000（10 分钟）。 */
    lockHardLimitMs?: number;
    /** 心跳刷新间隔毫秒；默认 5000。长回放/压缩也会按行数主动 touch。 */
    lockHeartbeatMs?: number;
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
    private readonly lockHardLimitMs;
    private readonly lockHeartbeatMs;
    private lastIndexError?;
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
     * 创建候选经验。同 idempotencyKey + 同 requestHash 幂等；同指纹（文本 + 范围相同）确定性合并，
     * 只把新证据并入已有经验，不新增经验。
     * 经调用方核验的 read 来源可用于项目经验；来源读取不代表用户采纳，review 始终 unreviewed。
     */
    createLesson(input: LessonInput, idempotencyKey: string, options?: {
        requireReview?: boolean;
    }): {
        lesson: Lesson;
        created: boolean;
    };
    /** 追加证据与更新引用共用一把锁；先检查 revision 与全部输入，不改变审阅状态。 */
    attachEvidence(id: string, inputs: EvidenceInput[], expectedRevision: number, idempotencyKey: string): Lesson;
    /** 按 patch 更新经验；revision 不符抛 KnowledgeError('revision')（details 带 currentRevision）且不写。 */
    updateLesson(id: string, patch: Partial<Lesson>, expectedRevision: number, idempotencyKey: string): Lesson;
    /** 记录一次使用反馈，不改变审阅、状态、证据和最后核验时间。 */
    recordFeedback(id: string, vote: 'useful' | 'not-applicable', note: string | undefined, expectedRevision: number, idempotencyKey: string): Lesson;
    /** 审阅经验：accepted → usable，rejected → rejected，unreviewed → candidate。 */
    reviewLesson(id: string, decision: ReviewDecision, expectedRevision: number, idempotencyKey: string, actor?: string, note?: string, resolution?: LessonReviewResolution): Lesson;
    /**
     * 批量原子更新（M2-②）：一个事件承载全部变更；先统一校验，
     * 任一条不通过 → 零写入并抛 KnowledgeError（details.failedId）。
     */
    updateLessonsBatch(updates: Array<{
        id: string;
        patch: Partial<Lesson>;
        expectedRevision: number;
    }>, idempotencyKey: string): Lesson[];
    /** 状态迁移；不允许的迁移抛 KnowledgeError('invalid') 且不写。 */
    applyTransition(id: string, to: LessonState, expectedRevision: number, idempotencyKey: string): Lesson;
    /** 从事件完整重建派生索引与 checkpoint；不删除、不改写 events.jsonl / evidence.jsonl。 */
    rebuildIndex(): void;
    /** 统计。truncated=true 表示事件总量超过有界回放上限（不静默）；快照模式下实体已折叠进 checkpoint。 */
    stats(): {
        lessons: number;
        evidence: number;
        events: number;
        byState: Record<LessonState, number>;
        truncated: boolean;
        badLines: number;
        orphanEvents: number;
        unsupportedVersions: number;
        skippedEvents: number;
        firstReplayedEventId?: string;
        replayMode: 'full' | 'snapshot+tail';
        replayedEvents: number;
        unreplayedEvents: number;
    };
    /** 只读诊断：锁、文件、计数与最近一次派生索引写失败；绝不获取锁、绝不写盘。 */
    diagnose(): {
        writable: boolean;
        lock: {
            present: boolean;
            ageMs?: number;
            pid?: number;
            alive?: boolean;
            bootId?: string;
            stale: boolean;
        };
        files: {
            dir: string;
            events: {
                path: string;
                exists: boolean;
                bytes: number;
            };
            evidence: {
                path: string;
                exists: boolean;
                bytes: number;
            };
            index: {
                path: string;
                exists: boolean;
                bytes: number;
                generatedAt?: string;
            };
        };
        counts: {
            lessons: number;
            evidence: number;
            events: number;
            badLines: number;
            orphanEvents: number;
            unsupportedVersions: number;
            skippedEvents: number;
            truncated: boolean;
            byState: Record<LessonState, number>;
        };
        lastIndexError?: {
            message: string;
            at: string;
        };
    };
    private ensureDir;
    private withLock;
    private fileInfo;
    private hashRequest;
    private hashablePatch;
    private cleanPatch;
    private assertSameRequest;
    /**
     * 恢复"首次结果"：
     * - 尾部回放产生的 entry 自带快照，直接返回；
     * - checkpoint 里的 entry 只有 lessonId/requestHash，则做一次有针对性的完整扫描，
     *   在命中该幂等键的那一刻取快照；失败再退回当前实体（best effort）。
     */
    private resolveIdempotentLesson;
    private resolveIdempotentBatch;
    private replayUntilIdempotencyKey;
    /** 顺序读取 JSONL 的非空行；每 TOUCH_EVERY_LINES 行调用一次 touch（长回放锁心跳）。 */
    private forEachLine;
    /** 有界读取：只保留最后 maxReplayEvents 条非空行，并报告总行数与是否截断。 */
    private readBoundedLines;
    /** 快照 + 尾部增量（checkpoint 有效时）；否则有界全量回放。 */
    private loadEvents;
    private loadEventsBounded;
    /** 无界完整回放（显式压缩 / 写路径发现截断或状态不完整时使用）。 */
    private loadAllUnbounded;
    /** 事件流 + evidence.jsonl（两条路径都留痕，按 id 合并去重）。 */
    private loadAll;
    /** 写路径：状态不完整、证据疑似缺失或截断未折叠时，自动做一次完整回放。 */
    private loadCompleteState;
    private hasMissingEvidenceRefs;
    private mergeEvidenceFile;
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
    private hashPrefix;
    private readLastLineId;
    private tryLoadCheckpoint;
    private buildCheckpoint;
    private buildIndexPayload;
    /** 自动更新派生索引：失败降级（权威事件已落盘），记录 lastIndexError 供 diagnose()。 */
    private writeIndex;
    private writeIndexStrict;
}
