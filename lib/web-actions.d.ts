import { type ResolvedDreamConfig } from './config.js';
export declare const DREAM_ACTION_ROUTE = "/api/dsh-dream/actions";
type Options = {
    journalDir?: string;
    config?: Record<string, unknown> | ResolvedDreamConfig | null;
};
/** Connection has authenticated the operator before this handler is called. */
export declare function createDreamActionHandler(options?: Options): (request: Request) => Promise<Response>;
/** No unauthenticated webServer fallback: old hosts keep their read-only panel. */
export declare function installDreamActions(ctx: any, options?: Options): void;
export {};
