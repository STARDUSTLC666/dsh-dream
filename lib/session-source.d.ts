import type { ResolvedDreamConfig } from './config.js';
import { type EvidenceClaim, type EvidenceContext } from './evidence.js';
import type { EvidenceInput } from './knowledge.js';
import { type SessionDigest } from './sessions.js';
/** 宿主 sessionQuery.listSessions() 返回条目的最小鸭子类型。 */
export interface SessionQueryRecordLike {
    header: any;
    live?: boolean;
    persisted?: boolean;
}
/** 宿主 sessionQuery.readSession() 返回快照的最小鸭子类型。 */
export interface SessionQuerySnapshotLike {
    session: any;
    events: any[];
}
/** 宿主 ctx.sessionQuery 的最小鸭子类型（兼容 DSH 0.2.2-rc.3 SessionQueryEngine）。 */
export interface SessionQueryLike {
    listSessions(): Promise<SessionQueryRecordLike[]>;
    readSession(sessionId: string): Promise<SessionQuerySnapshotLike | undefined>;
    searchSessions?(request: {
        query: string;
        sessionFilters?: readonly Record<string, unknown>[];
        eventFilters?: readonly Record<string, unknown>[];
        limit?: number;
    }, exec?: {
        signal?: AbortSignal;
    }): Promise<{
        items: readonly SessionQueryRecordLike[];
    }>;
    filterSessions?(filters: readonly Record<string, unknown>[]): Promise<SessionQueryRecordLike[]>;
}
/** digestSessionsWithFallback 的可选检索与过滤参数。 */
export interface DigestSessionsOptions {
    /** 可选全文检索词：挂载 DSH SQLite FTS5 时走 searchSessions，否则无缝退回本地摘要过滤。 */
    query?: string;
    /** 可选工作区路径：仅回放该工作区下的主会话。 */
    cwd?: string;
    /** 协作式取消信号（来自 DSH ToolRunContext.signal）。 */
    signal?: AbortSignal;
}
/** 获取当前已绑定的宿主 sessionQuery 服务（未挂载时返回 undefined）。 */
export declare function getSessionQuery(): SessionQueryLike | undefined;
/** 当前是否已绑定支持全文检索（FTS5）的宿主 sessionQuery 服务。 */
export declare function hasSessionQuerySearch(): boolean;
/** 测试/显式注入用：设置当前 sessionQuery 并返回恢复函数。 */
export declare function setSessionQueryForTest(query: SessionQueryLike | undefined): () => void;
/** 可选挂载宿主 ctx.sessionQuery，并在插件或服务卸载时清理绑定。 */
export declare function installSessionQueryBridge(ctx: any): void;
/** 把内存中的 SessionHeader + SessionEvent[] 转换为与 digestSessionFile 等价的 SessionDigest。 */
export declare function digestSessionFromEvents(rawHeader: unknown, events: readonly unknown[], maxUserMessages: number): SessionDigest | null;
/**
 * 回放最近主会话摘要：优先通过 live-preferred sessionQuery 读取（支持未刷盘活跃会话、
 * SQLite FTS5 `searchSessions` 全文检索与 `filterSessions` 工作区过滤），
 * 当 sessionQuery 不可用、无可用会话或发生错误时无缝回退到磁盘 sessionsRoot。
 */
export declare function digestSessionsWithFallback(cfg: ResolvedDreamConfig, max?: number, queryOverride?: SessionQueryLike, options?: DigestSessionsOptions): Promise<SessionDigest[]>;
/**
 * 核验证据：会话类证据优先使用宿主 sessionQuery.readSession（可核验未刷盘实时事件，
 * 并提取匹配轮次的 provider / model / agentPreset 元数据）；
 * 未挂载 sessionQuery、目标会话未命中或 local-artifact 时无缝退回同步 verifyEvidence()。
 */
export declare function verifyEvidenceWithSessionQuery(claim: EvidenceClaim, context: EvidenceContext, queryOverride?: SessionQueryLike): Promise<EvidenceInput>;
