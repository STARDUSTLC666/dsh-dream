import type { ResolvedDreamConfig } from './config.js';
import { type PendingMemory } from './automatic-state.js';
/** One event-driven timer, persistent bounded inputs, cross-process call leases. */
export declare class MemoryQueue {
    private timer?;
    private work;
    private running;
    private closed;
    private quietUntil;
    private controller?;
    private cfg;
    private now;
    private canRun;
    private generate;
    private onProblem;
    constructor(cfg: ResolvedDreamConfig, now: () => number, canRun: () => boolean, generate: (rows: PendingMemory[], signal: AbortSignal) => Promise<{
        reason: string;
        saved: number;
    }>, onProblem?: (reason: string) => void);
    touch(): void;
    cancel(): void;
    stop(): void;
    whenIdle(): Promise<void>;
    enqueue(row: PendingMemory): void;
    flush(): void;
    kick(): void;
    private enabled;
    private drain;
}
