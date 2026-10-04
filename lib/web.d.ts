import { type ResolvedDreamConfig } from './config.js';
import { type DreamEntry, type DreamStats } from './journal.js';
import type { Evidence, Lesson } from './knowledge.js';
import { memoryDirectory } from './memory.js';
/** 面板与浏览器说话的同源路由。 */
export declare const DREAM_ROUTE = "/_dsh/dsh-dream/journal";
/** M1 经验面板的只读路由。 */
export declare const DREAM_KNOWLEDGE_ROUTE = "/_dsh/dsh-dream/knowledge";
/** M2 写入记录面板的只读路由。 */
export declare const DREAM_BRIDGE_ROUTE = "/_dsh/dsh-dream/bridge";
/** ?limit 的默认值与上下界。 */
export declare const DREAM_LIMIT_DEFAULT = 50;
export declare const DREAM_LIMIT_MIN = 1;
export declare const DREAM_LIMIT_MAX = 500;
/** Host 头裁决：undefined = 放行，否则给出拒绝原因。 */
export declare function hostVerdict(host: unknown): string | undefined;
/** 来源地址裁决：undefined = 放行（请求里缺失也放行），否则给出拒绝原因。 */
export declare function remoteVerdict(remote: unknown): string | undefined;
/** GET 返回的 JSON 形状（T2 面板按这份契约渲染）。 */
export interface DreamWebPayload {
    /** 倒序的梦境（新梦在前），受 ?q 与 ?limit 影响。 */
    dreams: DreamEntry[];
    /** 全量日记的统计，不受 ?q 影响。 */
    stats: DreamStats;
    /** 本次生效的检索词（已去首尾空白；空串 = 不检索）。 */
    query: string;
    /** 本次生效的条数上限。 */
    limit: number;
}
/** 知识路由的统计形状（与 FREEZE §2 的 stats() 对齐；v1.1 R8 透传 badLines）。 */
export interface KnowledgeWebStats {
    lessons: number;
    evidence: number;
    events: number;
    byState: Record<string, number>;
    /** 有界回放被截断时为 true（面板据此显示提示行）。 */
    truncated?: boolean;
    /** 事件 / 证据流中被跳过的坏行数（面板据此显示提示行）。 */
    badLines: number;
}
/** 知识路由的 JSON 形状：脱敏后的经验 / 证据 / 统计。 */
export interface KnowledgeWebPayload {
    /** 每条经验额外带 scopeLabel 与 evidenceSummary（与 dream_context 同源文案）。 */
    lessons: Array<Lesson & {
        scopeLabel: string;
        evidenceSummary: string;
        reviewDue?: boolean;
        nextReviewAt?: string;
        lastRetrievedAt?: string;
    }>;
    memory?: ReturnType<typeof memoryDirectory>;
    /** 脱敏后的证据记录。 */
    evidence: Evidence[];
    /** 全量统计（不受条数影响）。 */
    stats: KnowledgeWebStats;
}
/** 只读知识源的最小接口：方便测试注入假数据，生产默认用 KnowledgeStore。 */
export interface KnowledgeReader {
    listLessons(): Lesson[];
    listEvidence(): Evidence[];
    stats(): KnowledgeWebStats;
}
/** 写入记录的单条视图（展示用；字段缺失时按空字符串 / false 归一化）。 */
export interface BridgeWebLessonRef {
    lessonId: string;
    revision: number;
}
export interface BridgeWebRecord {
    backupId: string;
    at: string;
    target: string;
    action: string;
    lessons: BridgeWebLessonRef[];
    beforeSha256: string;
    afterSha256: string;
    rollbackable: boolean;
    rollbackReason?: string;
}
/** 写入记录路由的 JSON 形状：脱敏后的应用记录 + 汇总。 */
export interface BridgeWebPayload {
    records: BridgeWebRecord[];
    stats: {
        total: number;
        rollbackable: number;
    };
}
/** 桥接存储层返回的原始记录形状（字段由 src/bridge.ts 负责）。 */
export type BridgeApplicationView = Record<string, unknown>;
/** 只读桥接记录源的最小接口：方便测试注入假数据。 */
export interface BridgeReader {
    listApplications(): BridgeApplicationView[];
}
/** 安装参数；journalDir 缺省时从 config 解析。 */
export interface DreamWebOptions {
    /** 梦境日记目录（优先）。 */
    journalDir?: string;
    /** 知识目录（优先；缺省 = <journalDir>/knowledge）。 */
    knowledgeDir?: string;
    /** 桥接记录目录（优先；缺省 = <journalDir>/bridge）。 */
    bridgeDir?: string;
    /** 插件配置，用来兜底 journalDir（resolveConfig 的入参）。 */
    config?: Record<string, unknown> | ResolvedDreamConfig | null;
    /** 测试注入：返回只读知识源；提供时不做目录存在性检查。 */
    knowledgeStoreFactory?: (knowledgeDir: string) => KnowledgeReader;
    /** 测试注入：返回只读桥接记录源；提供时不做目录存在性检查。 */
    bridgeStoreFactory?: (bridgeDir: string) => BridgeReader;
}
/** ?limit 解析：缺省/非数字 → fallback；越界钳制到 [1, 500]。 */
export declare function limitFromQuery(raw: unknown, fallback?: number): number;
/** 解析后的 knowledgeDir：显式路径优先，否则 = <journalDir>/knowledge。 */
export declare function knowledgeDirOf(options: DreamWebOptions, journalDir?: string): string;
/** 解析后的 bridgeDir：显式路径优先，否则 = <journalDir>/bridge。 */
export declare function bridgeDirOf(options: DreamWebOptions, journalDir?: string): string;
/** 递归脱敏；结构化绝对路径按目录分段，避免 Unix 分隔符把正常路径连成长令牌。 */
export declare function maskDeep<T>(value: T, key?: string): T;
/** 知识目录不存在（或尚未建立）时的空载荷：不写盘、不报 404。 */
export declare function emptyKnowledgePayload(): KnowledgeWebPayload;
/**
 * 归一化桥接应用记录：只保留展示需要的字段，坏形状跳过。
 * 数据源由 src/bridge.ts 负责（本层不做 IO、不重算可否回滚）。
 */
export declare function normalizeBridgeApplications(value: unknown): BridgeWebRecord[];
/** 写入记录目录不存在时的空载荷。 */
export declare function emptyBridgePayload(): BridgeWebPayload;
/** 组装梦境日记路由处理器；journalDir 在这一刻定下来（与插件的配置生命周期一致）。 */
export declare function createDreamWebHandler(options?: DreamWebOptions): (req: any, res: any) => Promise<void>;
/** 组装只读写入记录路由处理器；零写盘：目录不存在就直接返回空结果。 */
export declare function createBridgeWebHandler(options?: DreamWebOptions): (req: any, res: any) => Promise<void>;
/** 组装只读经验路由处理器；零写盘：目录不存在就直接返回空结果。 */
export declare function createKnowledgeWebHandler(options?: DreamWebOptions): (req: any, res: any) => Promise<void>;
/**
 * 把只读路由挂到宿主 webserver 上。
 * 与 dsh-calendar 相同：ctx.inject(['webServer']) + effect 注册，插件卸载即摘掉路由；
 * 同一个 effect 里注册日记 / 知识 / 写入记录三条 exact 路由，卸载时一起释放。
 */
export declare function installDreamWeb(ctx: any, options?: DreamWebOptions): void;
