import type { ResolvedDreamConfig } from './config.js';
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
    private contextCache;
    private retrievalStamp;
    private closed;
    private ready;
    private host;
    private problem?;
    private checks;
    private injected;
    readonly cfg: ResolvedDreamConfig;
    private readonly now;
    constructor(cfg: ResolvedDreamConfig, now?: () => number);
    register(): () => void;
    attach(host: any): () => void;
    dispose(): void;
    whenIdle(): Promise<void>;
    status(): Record<string, unknown>;
    control(changes: {
        enabled?: boolean;
        retrievalEnabled?: boolean;
    }): void;
    controlSession(id: string, changes: {
        use?: boolean | null;
        contribute?: boolean | null;
    }): void;
    flush(): void;
    observe(session: any, event: any): void;
    private process;
    private generateBatch;
    private generate;
    private parse;
    context(agent: any): string;
}
export declare function installAutomaticDream(ctx: any, cfg: ResolvedDreamConfig): void;
