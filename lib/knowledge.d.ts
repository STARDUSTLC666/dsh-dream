/** 经验类别：偏好 / 流程 / 坑 / 事实。 */
export type LessonKind = 'preference' | 'procedure' | 'pitfall' | 'fact';
/** 经验状态。candidate=候选；usable=可用；disputed=有冲突；stale=待复核；rejected=已拒绝。 */
export type LessonState = 'candidate' | 'usable' | 'disputed' | 'stale' | 'rejected';
/** 审阅结论。 */
export type ReviewDecision = 'unreviewed' | 'accepted' | 'rejected';
/** 一条可复用经验。 */
export interface Lesson {
    schemaVersion: 1;
    id: string;
    revision: number;
    kind: LessonKind;
    /** 一句话结论（不含条件时不得单独使用）。 */
    title: string;
    /** 可执行动作。 */
    action: string;
    /** 适用条件（何时该用）。 */
    when: string;
    /** 例外，检索时不得被截断。 */
    exceptions: string[];
    scope: {
        projectId?: string;
        workspaceRoot?: string;
        global: boolean;
    };
    applicability: {
        package?: string;
        versions?: string;
        platform?: string;
    }[];
    state: LessonState;
    evidenceIds: string[];
    /** 独立证据数（同证据复述不增加）。 */
    independentSupportCount: number;
    review: {
        decision: ReviewDecision;
        actor?: string;
        at?: string;
    };
    createdAt: string;
    updatedAt: string;
    lastValidatedAt?: string;
    reviewAfter?: string;
    supersedes?: string[];
    conflictIds: string[];
}
/** 一条证据：只存脱敏摘要 + 定位信息。 */
export interface Evidence {
    schemaVersion: 1;
    id: string;
    kind: 'session' | 'user-correction' | 'local-artifact';
    sessionId?: string;
    recordSeq?: number | string;
    projectId?: string;
    observedAt: string;
    /** 已脱敏的一句话。 */
    summary: string;
    /** read=插件读到原记录；claimed=仅模型声称。 */
    verification: 'read' | 'claimed';
    sourceHash?: string;
}
/** dream_learn / 迁移的输入。 */
export interface LessonInput {
    kind: LessonKind;
    title: string;
    action: string;
    when: string;
    exceptions?: string[];
    projectId?: string;
    workspaceRoot?: string;
    global?: boolean;
    applicability?: Lesson['applicability'];
    evidence: EvidenceInput[];
    conflictIds?: string[];
}
/** 证据输入：id / schemaVersion / observedAt 由存储层补齐。 */
export interface EvidenceInput extends Omit<Evidence, 'schemaVersion' | 'id' | 'observedAt'> {
    observedAt?: string;
}
/** 知识事件（events.jsonl 的每一行）。 */
export type KnowledgeEvent = {
    schemaVersion: 1;
    id: string;
    at: string;
    kind: 'lesson.create';
    lessonId: string;
    idempotencyKey: string;
    requestHash?: string;
    payload: Lesson;
} | {
    schemaVersion: 1;
    id: string;
    at: string;
    kind: 'lesson.update';
    lessonId: string;
    revision: number;
    idempotencyKey: string;
    requestHash?: string;
    payload: Partial<Lesson>;
} | {
    schemaVersion: 1;
    id: string;
    at: string;
    kind: 'lesson.review';
    lessonId: string;
    revision: number;
    idempotencyKey: string;
    requestHash?: string;
    payload: {
        decision: ReviewDecision;
        actor?: string;
        state: LessonState;
    };
} | {
    schemaVersion: 1;
    id: string;
    at: string;
    kind: 'evidence.add';
    idempotencyKey: string;
    requestHash?: string;
    payload: Evidence;
};
/** 知识层错误码：invalid=数据不合法；revision=乐观锁不符；duplicate=重复；io=读写/锁失败。 */
export declare class KnowledgeError extends Error {
    code: 'invalid' | 'revision' | 'duplicate' | 'io';
    /** 可选结构化上下文（脱敏后给工具/面板用；字段不承诺长期稳定）。 */
    details?: Record<string, unknown>;
    constructor(code: 'invalid' | 'revision' | 'duplicate' | 'io', message: string, details?: Record<string, unknown>);
}
/** 当前内存模型 / 写盘的 lesson schemaVersion。 */
export declare const LESSON_SCHEMA_VERSION = 1;
/** 迁移函数：把 from 版本的原始记录纯函数地转换成 to 版本的原始记录；必须幂等、不得写盘。 */
export type LessonSchemaMigration = (from: number, raw: unknown, to: number) => unknown;
/** 已知迁移链占位：v2 落地时在此登记；存储层默认只识别不自动迁移。 */
export declare const LESSON_MIGRATIONS: Record<number, LessonSchemaMigration>;
/** validateLesson 的可选前向兼容参数；旧调用签名（单参）保持不变。 */
export interface ValidateLessonOptions {
    /** 允许直接按当前形状读取的 schemaVersion 列表；默认 [1]。 */
    accept?: number[];
    /** 显式迁移函数：对非当前版本优先生效，返回值必须能通过 v1 校验。 */
    migrate?: LessonSchemaMigration;
}
/**
 * 校验并归一化一条经验；失败抛 KnowledgeError('invalid')。未知字段会被丢弃。
 * 前向兼容：schemaVersion 非当前版本时，先尝试 options.migrate / LESSON_MIGRATIONS；
 * 否则仅当版本在 options.accept 内才按当前形状读取，返回内存模型 v1。
 */
export declare function validateLesson(value: unknown, options?: ValidateLessonOptions): Lesson;
/** 校验并归一化一条证据；失败抛 KnowledgeError('invalid')。未知字段会被丢弃。 */
export declare function validateEvidence(value: unknown): Evidence;
/**
 * 规范化用于比较的文本：Unicode NFC + 折叠连续空白 + trim。
 * 展示仍用原样；指纹比较时再统一 lowercase。
 */
export declare function normalizeLessonText(text: string): string;
/** lessonFingerprint 的最小输入；title 可选，但建议传入，让“应开启/不应开启”这类结论差异参与指纹。 */
export type LessonFingerprintInput = Pick<Lesson, 'kind' | 'action' | 'when' | 'scope'> & {
    title?: string;
};
/**
 * 经验指纹：kind + title + action + when + scope 的规范化小写序列表，
 * sha256 取前 16 位十六进制。否定词、数值、路径、版本条件原样参与。
 */
export declare function lessonFingerprint(input: LessonFingerprintInput): string;
/** 状态机：from → to 是否允许。同状态与未知状态一律不允许。 */
export declare function canTransition(from: LessonState, to: LessonState): boolean;
/** sessionId + recordSeq 组成的会话定位键；两者缺一不可。 */
export declare function evidenceSessionKey(evidence: Pick<Evidence, 'sessionId' | 'recordSeq'>): string | undefined;
/** sourceHash 键；空串视为缺失。 */
export declare function evidenceHashKey(evidence: Pick<Evidence, 'sourceHash'>): string | undefined;
/** 证据的天然身份键：同 sessionId + recordSeq 优先，其次同 sourceHash。 */
export declare function evidenceNaturalKey(evidence: Pick<Evidence, 'sessionId' | 'recordSeq' | 'sourceHash'>): string | undefined;
/** 去重键：优先天然身份键，否则退回证据 id。 */
export declare function evidenceDedupKey(evidence: Pick<Evidence, 'id' | 'sessionId' | 'recordSeq' | 'sourceHash'>): string;
/**
 * 去重后的独立证据数：只看 lesson.evidenceIds 引用到的证据，
 * 同 sessionId+recordSeq 或同 sourceHash 只算一次；verification=claimed 不计入。
 */
export declare function mergeEvidenceSupport(lesson: Pick<Lesson, 'evidenceIds'>, evidence: Evidence[]): number;
