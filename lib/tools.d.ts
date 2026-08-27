import { type ResolvedDreamConfig } from './config.js';
import { type SessionDigest } from './sessions.js';
/** 模型可见的内容块。 */
export interface ContentBlock {
    type: 'text';
    text: string;
}
/** 注册给 ctx.tools.register 的原始工具定义。 */
export interface DreamToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    output: {
        schema: Record<string, unknown>;
        render(args: unknown, value: unknown): ContentBlock[];
    };
    execute(args: unknown, exec: unknown): Promise<unknown>;
    timeoutMs?: number;
}
/** 构建六个做梦工具。 */
export declare function buildDreamTools(config: ResolvedDreamConfig): DreamToolDefinition[];
/** 把会话摘要拼成一段可读文本（供模型一次性阅读）。 */
export declare function buildDigestText(digest: SessionDigest): string;
