import type { ResolvedDreamConfig } from './config.js';
export interface DshFeaturesStatus {
    workingDirectory: boolean;
    workspaceRegistry: boolean;
    workspaceChanges: boolean;
    messageFeedback: boolean;
    sessionLogExclude: boolean;
    tools: boolean;
}
/** Deliberately excludes reasoning blocks, tool calls/results and image payloads. */
export declare function automaticVisibleText(value: any): string;
export declare function automaticRuntime(cfg: ResolvedDreamConfig): AutomaticDream | undefined;
export declare class AutomaticDream {
    private frames;
    private generations;
    private queries;
    private queue;
    private pending;
    private scheduler?;
    private active;
    private sessions;
    private sessionModels;
    private sessionActiveFiles;
    private lastTurnInjected;
    private lastTurnContext;
    private workspaceIds;
    private workspaceLookups;
    private seenFeedbackVersions;
    private activeAuxSessionIds;
    private contextCache;
    private retrievalStamp;
    private closed;
    private ready;
    private host;
    private workingDirectory?;
    private workspaceRegistry?;
    private workspaceChanges?;
    private messageFeedbackHost?;
    private sessionLogService?;
    private toolsHost?;
    private problem?;
    private checks;
    private injected;
    readonly cfg: ResolvedDreamConfig;
    private readonly now;
    constructor(cfg: ResolvedDreamConfig, now?: () => number);
    register(): () => void;
    attachWorkingDirectory(service: any): () => void;
    attachWorkspaceRegistry(service: any): () => void;
    attachWorkspaceChanges(service: any): () => void;
    attachMessageFeedback(host: any): () => void;
    attachSessionLogDeepSeek(service: any): () => void;
    attachTools(host: any): () => void;
    attach(host: any, options?: {
        probeOptional?: boolean;
    }): () => void;
    dispose(): void;
    whenIdle(): Promise<void>;
    /** 只读辅助：返回会话当前有效工作目录（优先 DSH `workingDirectory`，回落 `session.header.cwd`）。 */
    effectiveCwd(session: any): string | undefined;
    /** 只读辅助：返回已缓存的规范 `workspaceId`（不阻塞）。 */
    cachedWorkspaceId(cwd: string): string | undefined;
    /** 只读辅助：返回指定会话当前轮（或上一轮）实际注入的经验 ID 列表。 */
    sessionInjectedLessonIds(sessionId: string): string[];
    private dshFeaturesSnapshot;
    status(): Record<string, unknown>;
    control(changes: {
        enabled?: boolean;
        retrievalEnabled?: boolean;
        verificationGateEnabled?: boolean;
        autoPause?: boolean;
        workspaceId?: string;
    }): void;
    controlSession(id: string, changes: {
        use?: boolean | null;
        contribute?: boolean | null;
    }): void;
    flush(): void;
    private resolveCwd;
    private isMainSession;
    private resolveWorkspaceIdSync;
    private resolveWorkspaceIdAsync;
    private resolveRoute;
    private resolveCurrentModel;
    private recordSessionModel;
    private recordActiveFile;
    private handleToolResult;
    private applyWorkspaceChangesSummary;
    private rememberFeedbackVersion;
    private handleFeedbackCommitted;
    private enqueueFeedbackExtraction;
    private handleTurnStopping;
    observe(session: any, event: any): void;
    private process;
    private generateBatch;
    private generate;
    private parse;
    context(agent: any, assembleContext?: any): string;
}
export declare function installAutomaticDream(ctx: any, cfg: ResolvedDreamConfig): void;
