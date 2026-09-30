import type { Lesson } from './knowledge.js';
/** 新管理块起始标记（整行）。 */
export declare const DREAM_BLOCK_START = "<!-- dsh-dream:start -->";
/** 新管理块结束标记（整行）。 */
export declare const DREAM_BLOCK_END = "<!-- dsh-dream:end -->";
/** 默认最多桥接条数。 */
export declare const BRIDGE_DEFAULT_MAX_LESSONS = 5;
/** 硬上限。 */
export declare const BRIDGE_HARD_MAX_LESSONS = 20;
export interface BridgeScope {
    projectId?: string;
    workspaceRoot?: string;
}
export interface BridgeLessonView {
    lessonId: string;
    revision: number;
    title: string;
    when: string;
    action: string;
    exceptions: string[];
    scopeLabel: string;
}
export interface BridgeSkipped {
    lessonId: string;
    reason: string;
}
export interface BridgeFileState {
    exists: boolean;
    /** 文件不存在时为 null；存在时是文件字节 sha256。 */
    sha256: string | null;
    size: number;
}
export type BridgeAction = 'create' | 'replace' | 'append' | 'unchanged';
export interface BridgeTargetOptions {
    /** 当前项目根目录（必须存在）。 */
    projectRoot: string;
    /** 目标文件；缺省 = <projectRoot>/AGENTS.md。 */
    path?: string;
}
export interface BridgeOptions extends BridgeTargetOptions {
    /** 应用记录目录 <journalDir>/bridge/。 */
    journalDir: string;
    /** 候选经验（由 tools 层从 KnowledgeStore 提供）。 */
    lessons: Lesson[];
    /** 当前项目标识；两者都没有时只允许显式 global 且已采纳的经验。 */
    projectId?: string;
    workspaceRoot?: string;
    /** 只桥接这些经验（可选）。 */
    lessonIds?: string[];
    /** 条数上限，默认 5，硬上限 20。 */
    maxLessons?: number;
    /** 写盘前是否过 mask.ts；默认 true。 */
    maskSecrets?: boolean;
}
export interface BridgeApplyOptions extends BridgeOptions {
    /** apply 必须提供：当前目标文件的 sha256；文件不存在时用 null（preview.expected.sha256 原样回传即可）。 */
    expectedSha256: string | null;
    /** 可选：apply 必须是同一份预览。 */
    previewId?: string;
}
export interface BridgeRollbackOptions {
    projectRoot: string;
    path?: string;
    journalDir: string;
    backupId: string;
}
export type BridgeErrorCode = 'invalid' | 'conflict' | 'read-only' | 'io' | 'marker' | 'preview-mismatch' | 'not-found' | 'unsupported-encoding' | 'path-outside-project' | 'target-is-directory' | 'not-rollbackable';
export interface BridgeError {
    code: BridgeErrorCode;
    message: string;
    line?: number;
    hint?: string;
}
export interface BridgeFailure {
    ok: false;
    error: BridgeError;
    /** 可选的形状兜底：preview 即使失败也尽量给出 action/expected/resolvedPath，避免调用方读字段崩。 */
    action?: BridgeAction;
    expected?: BridgeFileState;
    resolvedPath?: string;
}
export interface BridgePreviewSuccess {
    ok: true;
    action: BridgeAction;
    expected: BridgeFileState;
    resolvedPath: string;
    diff: string;
    lessons: BridgeLessonView[];
    skipped: BridgeSkipped[];
    previewId: string;
    blockPreview: string;
}
export interface BridgeApplySuccess {
    ok: true;
    action: BridgeAction;
    unchanged: boolean;
    backupId?: string;
    file: BridgeFileState;
    path: string;
    resolvedPath: string;
    lessons: BridgeLessonView[];
    skipped: BridgeSkipped[];
    previewId?: string;
    /** 目标已应用且可按 backupId 恢复，但最终审计确认未能追加。 */
    warning?: string;
}
export interface BridgeRollbackSuccess {
    ok: true;
    backupId: string;
    file: BridgeFileState;
    path: string;
    resolvedPath: string;
}
export type BridgePreviewResult = BridgePreviewSuccess | BridgeFailure;
export type BridgeApplyResult = BridgeApplySuccess | BridgeFailure;
export type BridgeRollbackResult = BridgeRollbackSuccess | BridgeFailure;
export interface BridgeRecord {
    schemaVersion: 1;
    backupId: string;
    at: string;
    target: string;
    projectRoot: string;
    action: 'create' | 'replace' | 'append';
    before: BridgeFileState;
    beforeBlock: string | null;
    separator: string;
    afterBlockSha256: string;
    afterFileSha256: string;
    lessons: Array<{
        lessonId: string;
        revision: number;
    }>;
    previewId: string;
    /** 缺省为旧版已完成记录；pending 是先于目标写入持久化的恢复记录。 */
    phase?: 'pending' | 'applied' | 'aborted';
}
interface ResolvedTarget {
    /** 跟随链接后的真实写入路径。 */
    path: string;
    projectRoot: string;
    lexical: string;
}
type BlockLocation = {
    status: 'none';
} | {
    status: 'ok';
    start: number;
    end: number;
    text: string;
    startLine: number;
    endLine: number;
} | {
    status: 'broken';
    message: string;
    line?: number;
};
/**
 * 经验资格：state=usable；scope 匹配当前项目；或显式 global 且 review.decision=accepted。
 * 解释为空或不满足一律进 skipped，绝不因频次入选或落选。
 */
export declare function selectBridgeLessons(lessons: Lesson[], scope: BridgeScope, options?: {
    lessonIds?: string[];
    maxLessons?: number;
}): {
    eligible: Lesson[];
    skipped: BridgeSkipped[];
};
/** 定位管理块；缺损/重复/嵌套/错位给出位置。 */
export declare function locateDreamBlock(text: string): BlockLocation;
/** 生成管理块（内部使用 \n；落盘前按目标换行风格转换）。 */
export declare function buildDreamBlock(lessons: BridgeLessonView[]): string;
export declare function resolveBridgeTarget(projectRoot: string, rawPath?: string): {
    ok: true;
    target: ResolvedTarget;
} | BridgeFailure;
/** preview：只读计算 diff / expected / 管理块；绝不写盘。 */
export declare function previewBridge(options: BridgeOptions): BridgePreviewResult;
/** apply：必须带 expectedSha256；CAS 冲突 → conflict 零写入；只替换管理块。 */
export declare function applyBridge(options: BridgeApplyOptions): BridgeApplyResult;
/** rollback：仅当当前管理块仍等于该次 apply 的结果时恢复原管理块。 */
export declare function rollbackBridge(options: BridgeRollbackOptions): BridgeRollbackResult;
export interface BridgeApplicationView {
    backupId: string;
    at: string;
    target: string;
    action: 'create' | 'replace' | 'append';
    lessons: Array<{
        lessonId: string;
        revision: number;
    }>;
    beforeSha256: string | null;
    afterSha256: string;
    rollbackable: boolean;
    rollbackReason?: string;
}
/**
 * 只读列出应用记录（按 at 降序）。目录/文件缺失返回 []，绝不写盘。
 * rollbackable 在桥接层按当前文件的管理块重算，供面板直接展示。
 */
export declare function listBridgeApplications(journalDir: string): BridgeApplicationView[];
/** 旧版标记块起始行（历史文件用；新流程不碰它）。 */
export declare const BRIDGE_START = "<!-- dsh-dream:lessons:start\uFF08\u81EA\u52A8\u751F\u6210\uFF0C\u8BF7\u52FF\u624B\u5DE5\u7F16\u8F91\u5757\u5185\u5185\u5BB9\uFF09 -->";
/** 旧版标记块结束行。 */
export declare const BRIDGE_END = "<!-- dsh-dream:lessons:end -->";
/** 生成教训块文本（legacy）。 */
export declare function buildLessonsBlock(lessons: Array<{
    lesson: string;
    count: number;
}>): string;
/**
 * legacy：把梦境教训合并进目标文件（0.5.x 行为，直接写；新代码请用 preview/apply）。
 * @returns 动作类型与写入的教训数。
 */
export declare function bridgeDreams(journalDir: string, targetPath: string, maxLessons: number): {
    action: 'created' | 'replaced' | 'appended';
    lessonsCount: number;
};
export {};
