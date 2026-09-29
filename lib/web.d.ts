/**
 * dsh-dream 的网页端后端：给设置页里的梦境面板提供只读数据。
 *
 * 安全模型沿用 dsh-calendar / dsh-email 的设置路由：这个路由能读出用户的
 * 全部梦境日记（都是隐私文本），而宿主 webserver 有可能绑定在 0.0.0.0。
 * 三道门缺一不可 ——
 *   1. remoteAddress 若是明确的非回环地址则拒绝（局域网不可达）；
 *   2. Host 头必须是 localhost 名（挡 DNS rebinding：恶意域名解析到 127.0.0.1）；
 *   3. 只接受 GET：本路由没有任何写路径，所以不需要 CSRF 那一套。
 *
 * 这一层不做自己的状态：每次请求都从 journal.ts 现读现算，磁盘上的 JSONL
 * 就是唯一真相。
 *
 * @module dsh-dream/web
 */
import { type ResolvedDreamConfig } from './config.js';
import { type DreamEntry, type DreamStats } from './journal.js';
/** 面板与浏览器说话的同源路由。 */
export declare const DREAM_ROUTE = "/_dsh/dsh-dream/journal";
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
/** 安装参数；journalDir 缺省时从 config 解析。 */
export interface DreamWebOptions {
    /** 梦境日记目录（优先）。 */
    journalDir?: string;
    /** 插件配置，用来兜底 journalDir（resolveConfig 的入参）。 */
    config?: Record<string, unknown> | ResolvedDreamConfig | null;
}
/** ?limit 解析：缺省/非数字 → fallback；越界钳制到 [1, 500]。 */
export declare function limitFromQuery(raw: unknown, fallback?: number): number;
/** 组装路由处理器；journalDir 在这一刻定下来（与插件的配置生命周期一致）。 */
export declare function createDreamWebHandler(options?: DreamWebOptions): (req: any, res: any) => Promise<void>;
/**
 * 把梦境面板挂到宿主 webserver 上。
 * 与 dsh-calendar 相同：ctx.inject(['webServer']) + effect 注册，插件卸载即摘掉路由。
 */
export declare function installDreamWeb(ctx: any, options?: DreamWebOptions): void;
