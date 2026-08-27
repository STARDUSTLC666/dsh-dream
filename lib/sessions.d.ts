/** zstd 帧魔数。 */
export declare const ZSTD_MAGIC: readonly [40, 181, 47, 253];
/** 会话头。 */
export interface SessionHeader {
    id: string;
    createdAt: number;
    cwd: string;
    origin: string;
    delegationDepth: number;
    agentPreset: string;
}
/** 会话摘要（梦的原料）。 */
export interface SessionDigest {
    id: string;
    createdAt: number;
    cwd: string;
    agentPreset: string;
    origin: string;
    title: string;
    turns: number;
    userMessages: string[];
    assistantTail: string[];
    toolCalls: string[];
    /** 流式文本还原尾部（来自 text-chunks 打包行，assistant/message 缺失时的兜底梦原料）。 */
    streamTail: string;
    endedAt: number | null;
}
/** 扫描 zstd 帧边界（按魔数；误命中由解压失败兜底）。 */
export declare function frameRanges(buf: Uint8Array): Array<{
    start: number;
    end: number;
}>;
/** 多帧解压为文本（损坏帧跳过）。 */
export declare function decompressAll(buf: Uint8Array): string;
/** 解析单个会话文件为摘要；文件不存在或损坏时返回 null。 */
export declare function digestSessionFile(filePath: string, maxUserMessages: number): SessionDigest | null;
/** 列出指定根目录下最近修改的会话文件路径（跳过子代理会话目录由调用方按摘要 origin 过滤）。 */
export declare function listSessionFiles(sessionsRoot: string, limit: number): string[];
