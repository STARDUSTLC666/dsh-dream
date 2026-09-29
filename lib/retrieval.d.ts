/**
 * 任务相关经验检索（FREEZE §3）。
 *
 * 顺序：范围过滤 → 排除 rejected/stale/disputed → 确定性排序 → 字符预算。
 * 条件（when）与例外（exceptions）不可截断：整条放不下时跳过并记 skipped.budget，
 * 绝不返回半条经验。
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
    /** 当前任务相关依赖的版本，用于匹配 applicability.versions。 */
    packageVersion?: string;
}
/** 检索结果中的单条经验（已完整保留 when/exceptions）。 */
export interface RetrievedLesson {
    lessonId: string;
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
/** 单条结果的字符成本（与 dream_context.budget.usedChars 同口径）。 */
export declare function retrievedLessonChars(item: RetrievedLesson): number;
/** 解析 limit/maxChars，套用默认值与硬上限。 */
export declare function resolveRetrievalBudget(q: Pick<RetrievalQuery, 'limit' | 'maxChars'>): {
    limit: number;
    maxChars: number;
};
/** 简单 semver 条件匹配：支持 = / > / >= / < / <= / ^ / ~、逗号或空格 AND、|| OR、x/* 通配。 */
export declare function versionSatisfies(versionText: string, rangeText: string): boolean;
/**
 * 任务相关经验检索。只返回 global 或与查询项目/工作区精确匹配的记录；
 * 未知项目（未给 projectId/workspaceRoot）时只返回 global，绝不跨项目扫描。
 */
export declare function retrieveLessons(lessons: Lesson[], evidence: Evidence[], q: RetrievalQuery): {
    items: RetrievedLesson[];
    skipped: {
        lessonId: string;
        reason: string;
    }[];
};
