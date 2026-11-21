import type { ResolvedDreamConfig } from './config.js';
/** 与 DSH `@deepseek-ai/dsh-commands` 对齐的最小鸭子类型返回值。 */
export type DreamCommandResult = {
    readonly kind: 'success';
    readonly text?: string;
} | {
    readonly kind: 'error';
    readonly text: string;
};
/** 与 DSH `CommandDefinition` 对齐的最小鸭子类型定义。 */
export interface DreamCommandDefinition {
    readonly definitionId?: string;
    readonly name: string;
    readonly description: string;
    readonly input?: {
        readonly hint: string;
        readonly attachments?: boolean;
    };
    readonly recordInput?: boolean;
    readonly handler: (invocation: any) => DreamCommandResult | Promise<DreamCommandResult>;
}
/** 构造 `/dream`、`/dream-learn`、`/dream-status` 三个原生斜杠命令定义。 */
export declare function buildDreamCommands(cfg: ResolvedDreamConfig): DreamCommandDefinition[];
/**
 * 通过可选 `ctx.inject(['commands'], ...)` 注册 `/dream`、`/dream-learn`、`/dream-status`。
 * 宿主无 `commands` 服务时静默跳过；卸载时自动反注册全部命令。
 */
export declare function installDreamCommands(ctx: any, cfg: ResolvedDreamConfig): void;
