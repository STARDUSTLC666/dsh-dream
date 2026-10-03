import type { ResolvedDreamConfig } from './config.js';
export interface AutomaticState {
    version: 1;
    day: string;
    calls: number;
    enabled?: boolean;
    retrievalEnabled?: boolean;
    lastAttemptAt?: number;
    cursors: Record<string, number>;
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
