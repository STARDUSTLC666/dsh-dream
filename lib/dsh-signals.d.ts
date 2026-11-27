import type { ResolvedDreamConfig } from './config.js';
import { type Lesson } from './knowledge.js';
/** `systemPrompt.context` 中由 dsh-dream 注入的运行时上下文段名。 */
export declare const DREAM_CONTEXT_SECTION_NAME = "dsh-dream-reviewed-memory";
/** DSH `notice` 摘要长度硬上限（对齐 `@deepseek-ai/dsh-llm` `CONTEXT_SUMMARY_MAX_CHARS`）。 */
export declare const DREAM_GATE_SUMMARY_MAX_CHARS = 120;
/** 单次经验回用后的观测信号。 */
export interface ObservationSignal {
    kind: 'positive' | 'negative' | 'correction' | 'repeat-tool';
    model?: string;
    category?: string;
    note?: string;
}
/** 符合 DSH `UserMessage` 形状的完成前单次软门控提示消息。 */
export interface VerificationGateMessage {
    readonly id: string;
    readonly role: 'user';
    readonly content: ReadonlyArray<{
        readonly type: 'text';
        readonly text: string;
    }>;
    readonly source: {
        readonly kind: 'dsh-dream-gate';
        readonly form: 'notice';
        readonly summary: string;
    };
}
/**
 * 从会话事件流中提取 `runtime-context` 快照里实际注入的 Dream 经验 ID 列表。
 *
 * 若提供 `targetAssistantMsgId`，返回该助手消息之前最近一次 `runtime-context` 快照中的
 * `dsh-dream-reviewed-memory` 经验 ID（目标消息不存在时返回空数组）；未提供时返回全流最新快照。
 */
export declare function extractInjectedDreamLessonIds(events: readonly unknown[], targetAssistantMsgId?: string): string[];
/** 从会话事件流提取目标助手消息（或最近请求）对应的模型 ID。 */
export declare function extractAssistantMessageModel(events: readonly unknown[], targetAssistantMsgId?: string): string | undefined;
/**
 * 将 DSH 原生反馈/纠正/重复工具观测写入 `automatic/state.json`。
 * 绝不抛错，绝不修改 `KnowledgeStore` 或任何经验的人工审阅状态。
 */
export declare function recordLessonObservation(cfg: ResolvedDreamConfig, lessonIds: readonly string[], signal: ObservationSignal, now?: number | string): void;
/** 将相对或绝对路径归一化为工作区内相对路径（脱敏且拒绝越界路径）。 */
export declare function normalizePathToWorkspace(rawPath: string, cwd?: string): string | undefined;
/**
 * 判断工具调用是否属于文件修改类操作（用于区分只读问答轮与真实改文件轮）。
 * 对 `str_replace_editor` 这类读写复合工具，传入 `rawArgs` 时将 `command: 'view'` 识别为只读；
 * 未传 `rawArgs` 时保持向后兼容，按默认修改类工具处理。
 */
export declare function isMutatingFileTool(toolName: unknown, rawArgs?: unknown): boolean;
/** 从一次工具执行对象提取全部工作区内相对文件路径（仅路径，不含正文）。 */
export declare function extractToolFilePaths(exec: unknown, cwd?: string): string[];
/** 从文件类工具执行对象提取单个工作区内相对文件路径。 */
export declare function extractToolFilePath(exec: unknown, cwd?: string): string | undefined;
/**
 * 为完成前单次软门控筛选高价值已采纳经验（仅限 `review.actor === 'human'` 的 `usable` 规则）。
 * 优先匹配本轮改动文件、`prevents` 签名以及校验/边界/避坑类规则。
 */
export declare function selectVerificationGateLessons(lessons: readonly Lesson[], opts: {
    workspaceId?: string;
    workspaceRoot?: string;
    projectId?: string;
    activeFiles: readonly string[];
    limit?: number;
    now?: number;
}): Lesson[];
/**
 * 构造符合 DSH `UserMessage`（`source.form = 'notice'`、`summary <= 120` 字符）的完成前自检提示。
 */
export declare function buildVerificationGateMessage(lessons: readonly Lesson[], changedFiles: readonly string[]): VerificationGateMessage;
