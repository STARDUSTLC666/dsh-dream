/**
 * 任务相关经验检索（FREEZE v1 + v1.1 增补 R1/R3/R4）。
 *
 * 顺序：范围过滤 → 排除 rejected/stale/disputed → 候选/无证据策略过滤 → 版本包名上下文 →
 * 确定性排序 → 按排名整条装入的字符预算（遇第一条放不下即停，rankInversionCount===0）。
 * essential（title/when/action/exceptions，含 scopeLabel）永不截断；metadata（whyRelevant/
 * evidenceSummary）放不下时可截断并置 truncated:true。
 *
 * @module dsh-dream/retrieval
 */
import type { Evidence, Lesson, LessonState } from './knowledge.js';
/** 检索入参；limit/maxChars 在内部按硬上限裁剪。 */
export interface RetrievalQuery {
    query: string;
    projectId?: string;
    workspaceRoot?: string;
    /** 默认 5，硬上限 20。 */
    limit?: number;
    /** 默认 3000，硬上限 20000。 */
    maxChars?: number;
    /** 当前任务相关依赖的版本，用于匹配 applicability.versions（R3：必须先识别包名）。 */
    packageVersion?: string;
    /** 显式包名上下文；与 query 文本一起用于识别 applicability[].package（R3）。 */
    packageName?: string;
    /** 任务目标平台；宿主工具缺省使用当前系统，跨平台任务可显式指定。 */
    platform?: string;
    /** 是否返回 candidate；默认 true（面板/审计需要）。dream_context 默认传 false（R1）。 */
    includeCandidates?: boolean;
    /** 是否保留 independentSupportCount===0 且非 usable 的条目；默认 true。dream_context 传 false（R1）。 */
    includeNoEvidence?: boolean;
    now?: number;
}
/** 检索结果中的单条经验（when/exceptions 永不截断）。 */
export interface RetrievedLesson {
    lessonId: string;
    revision: number;
    title: string;
    when: string;
    action: string;
    exceptions: string[];
    state: LessonState;
    scopeLabel: string;
    whyRelevant: string;
    evidenceSummary: string;
    lastValidatedAt?: string;
    truncated: boolean;
}
/** 默认条数。 */
export declare const DEFAULT_RETRIEVAL_LIMIT = 5;
/** 条数硬上限。 */
export declare const MAX_RETRIEVAL_LIMIT = 20;
/** 默认字符预算。 */
export declare const DEFAULT_RETRIEVAL_MAX_CHARS = 3000;
/** 字符预算硬上限。 */
export declare const MAX_RETRIEVAL_MAX_CHARS = 20000;
/** 查询侧范围文案（面板与 dream_context 共用）。 */
export declare function queryScopeLabel(q: Pick<RetrievalQuery, 'projectId' | 'workspaceRoot'>): string;
/** 经验范围文案（面板与 dream_context 共用）。 */
export declare function lessonScopeLabel(scope: Lesson['scope']): string;
/** 证据摘要（面板与 dream_context 共用）：独立支持数 + 已读/仅声明 + 脱敏摘要片段。 */
export declare function buildEvidenceSummary(lesson: Lesson, evidence: Evidence[]): string;
/** essential 成本：title/when/action/exceptions/scopeLabel，永不截断（R4）。 */
export declare function essentialLessonChars(item: Pick<RetrievedLesson, 'title' | 'when' | 'action' | 'exceptions' | 'scopeLabel'>): number;
/** metadata 成本：whyRelevant/evidenceSummary，预算紧时可截断（R4）。 */
export declare function metadataLessonChars(item: Pick<RetrievedLesson, 'whyRelevant' | 'evidenceSummary'>): number;
/** 单条结果的完整字符成本（与 dream_context.budget.usedChars 同口径）。 */
export declare function retrievedLessonChars(item: RetrievedLesson): number;
/**
 * rank inversion 指标（R4）：被 budget-stop 跳过、且排在某个已返回条目之前的条目数。
 * 按排名整条装入的预算策略必须让它恒为 0。
 */
export declare function rankInversionCount(rankedLessonIds: string[], result: {
    items: Array<Pick<RetrievedLesson, 'lessonId'>>;
    skipped: Array<{
        lessonId: string;
        reason: string;
    }>;
}): number;
/** skipped.reason 的中文标签（面板与工具共用；未知 reason 原样返回）。 */
export declare function skippedReasonLabel(reason: string): string;
/**
 * 浏览态（无 query 上下文）下一条经验的确定性扣留原因；usable 返回 undefined。
 * 与 retrieveLessons 的优先级一致：no-evidence 先于 candidate-hold；version-mismatch 需 query/包名，不适用。
 */
export declare function deterministicHoldReason(lesson: Pick<Lesson, 'state' | 'independentSupportCount'>): string | undefined;
/** 解析 limit/maxChars，套用默认值与硬上限。 */
export declare function resolveRetrievalBudget(q: Pick<RetrievalQuery, 'limit' | 'maxChars'>): {
    limit: number;
    maxChars: number;
};
/** 简单 semver 条件匹配：支持 = / > / >= / < / <= / ^ / ~、逗号或空格 AND、|| OR、x/* 通配。 */
export declare function versionSatisfies(versionText: string, rangeText: string): boolean;
export declare function normalizePlatform(value: string): string;
/** 显式任务平台优先，其次无歧义的任务文本，最后宿主平台。 */
export declare function taskPlatform(query: string, explicit?: string, fallback?: string): string | undefined;
/**
 * 任务相关经验检索。只返回 global 或与查询项目/工作区精确匹配的记录；
 * 未知项目（未给 projectId/workspaceRoot）时只返回 global，绝不跨项目扫描。
 *
 * R1：includeCandidates=false 时 candidate 记 skipped:candidate-hold；includeNoEvidence=false 时
 * independentSupportCount===0 且非 usable 记 skipped:no-evidence（优先于 candidate-hold）。
 * R3：applicability.versions 仅在包名被识别时参与；包名识别但版本不满足 → skipped:version-mismatch。
 * R4：预算按排名整条装入，第一条 essential 放不下即停（budget-stop）；metadata 可截断。
 */
export declare function retrieveLessons(lessons: Lesson[], evidence: Evidence[], q: RetrievalQuery): {
    items: RetrievedLesson[];
    skipped: {
        lessonId: string;
        reason: string;
    }[];
};
