import { type DreamToolDefinition } from './tools.js';
/** cordis 服务注入：要用 ctx.tools 与 ctx.skills。 */
export declare const name = "dream";
export declare const inject: string[];
/** 插件所需的最小 ctx 面。 */
export interface DreamPluginContext {
    tools: {
        register(definition: DreamToolDefinition): () => void;
    };
    skills?: {
        register(definition: {
            name: string;
            description: string;
            content: string;
            resourceBase: {
                kind: 'directory';
                path: string;
            };
            source?: string;
        }): () => void;
    };
    on?(event: string, listener: () => void): () => void;
}
/** 随包技能目录。 */
export declare function bundledSkillsDir(): string;
/** 插件入口。 */
export declare function apply(ctx: DreamPluginContext, config?: Record<string, unknown> | null): void;
export * from './config.js';
export * from './sessions.js';
export * from './journal.js';
export * from './tools.js';
export * from './mask.js';
export * from './bridge.js';
