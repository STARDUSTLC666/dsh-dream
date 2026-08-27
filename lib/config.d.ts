/** 已解析配置。 */
export interface ResolvedDreamConfig {
    /** 会话根目录（默认 ~/.dsh/sessions）。 */
    sessionsRoot: string;
    /** 梦境日记目录（默认 ~/.dsh/.dsh-dream）。 */
    journalDir: string;
    /** dream_digest 最多回放的会话数（1-50，默认 10）。 */
    maxSessions: number;
    /** 每个会话摘要的最大字符数（500-50000，默认 6000）。 */
    maxCharsPerSession: number;
    /** 每个会话最多保留的用户消息条数（1-20，默认 5）。 */
    maxUserMessages: number;
    /** 梦原料入梦前是否做隐私脱敏（默认 true）。 */
    maskSecrets: boolean;
}
/** 解析并校验插件配置。 */
export declare function resolveConfig(raw?: Record<string, unknown> | null): ResolvedDreamConfig;
