import type { ResolvedDreamConfig } from './config.js';
export interface PendingMemory {
    key: string;
    sessionId: string;
    cwd: string;
    endSeq: number;
    createdAt: number;
    readyAt: number;
    provider: string;
    model: string;
    sources: Array<{
        seq: number;
        role: 'user' | 'assistant';
        text: string;
        hash: string;
    }>;
    lease?: {
        job: string;
        pid: number;
        until: number;
    };
}
export interface ChatMemoryPolicy {
    sessionId: string;
    cwd?: string;
    use?: boolean;
    contribute?: boolean;
}
export interface AutomaticState {
    version: 1;
    day: string;
    calls: number;
    enabled?: boolean;
    retrievalEnabled?: boolean;
    lastAttemptAt?: number;
    cursors: Record<string, number>;
    pending?: PendingMemory[];
    policies?: Record<string, ChatMemoryPolicy>;
    expired?: number;
    overflow?: number;
    retrieved?: Record<string, {
        at: number;
        count: number;
    }>;
    last?: {
        at: number;
        reason: string;
        saved: number;
        job?: string;
    };
}
export declare function budgetDay(now: number): string;
export declare function readAutomaticState(cfg: ResolvedDreamConfig, now?: number): AutomaticState;
/** No waiting on a live lock: observing a turn must never stall its owner. */
export declare function updateAutomaticState<T>(cfg: ResolvedDreamConfig, update: (state: AutomaticState) => T, now?: number): T;
