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
import { resolveConfig, type ResolvedDreamConfig } from './config.js'
import { dreamStats, readDreams, searchDreams, type DreamEntry, type DreamStats } from './journal.js'

/** 面板与浏览器说话的同源路由。 */
export const DREAM_ROUTE = '/_dsh/dsh-dream/journal'

/** ?limit 的默认值与上下界。 */
export const DREAM_LIMIT_DEFAULT = 50
export const DREAM_LIMIT_MIN = 1
export const DREAM_LIMIT_MAX = 500

/** 回环主机名白名单；带端口会被拆掉，IPv6 字面量保留方括号。 */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/** 回环来源地址白名单。 */
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

/** Host 头裁决：undefined = 放行，否则给出拒绝原因。 */
export function hostVerdict(host: unknown): string | undefined {
  if (typeof host !== 'string' || host.trim() === '') return undefined
  const text = host.trim().toLowerCase()
  const name = text.startsWith('[') ? text.slice(0, text.indexOf(']') + 1) : text.split(':')[0]!
  return LOCAL_HOSTNAMES.has(text) || LOCAL_HOSTNAMES.has(name) ? undefined : `host "${host}" is not a localhost name`
}

/** 来源地址裁决：undefined = 放行（请求里缺失也放行），否则给出拒绝原因。 */
export function remoteVerdict(remote: unknown): string | undefined {
  if (typeof remote !== 'string' || remote.trim() === '') return undefined
  const text = remote.trim().toLowerCase()
  return LOOPBACK_ADDRESSES.has(text) ? undefined : `remote address "${remote}" is not a loopback address`
}

/** GET 返回的 JSON 形状（T2 面板按这份契约渲染）。 */
export interface DreamWebPayload {
  /** 倒序的梦境（新梦在前），受 ?q 与 ?limit 影响。 */
  dreams: DreamEntry[]
  /** 全量日记的统计，不受 ?q 影响。 */
  stats: DreamStats
  /** 本次生效的检索词（已去首尾空白；空串 = 不检索）。 */
  query: string
  /** 本次生效的条数上限。 */
  limit: number
}

/** 安装参数；journalDir 缺省时从 config 解析。 */
export interface DreamWebOptions {
  /** 梦境日记目录（优先）。 */
  journalDir?: string
  /** 插件配置，用来兜底 journalDir（resolveConfig 的入参）。 */
  config?: Record<string, unknown> | ResolvedDreamConfig | null
}

/** ?limit 解析：缺省/非数字 → fallback；越界钳制到 [1, 500]。 */
export function limitFromQuery(raw: unknown, fallback: number = DREAM_LIMIT_DEFAULT): number {
  if (typeof raw !== 'string' || raw.trim() === '') return fallback
  const value = Number(raw)
  if (!Number.isFinite(value)) return fallback
  return Math.min(DREAM_LIMIT_MAX, Math.max(DREAM_LIMIT_MIN, Math.trunc(value)))
}

/** 解析后的 journalDir：显式路径优先，否则回退到 resolveConfig(config)。 */
function journalDirOf(options: DreamWebOptions): string {
  if (typeof options.journalDir === 'string' && options.journalDir.trim() !== '') return options.journalDir
  return resolveConfig((options.config ?? null) as Record<string, unknown> | null).journalDir
}

/** 解析请求 URL；非法或缺失时退回路由本身（等价于没有查询参数）。 */
function requestUrl(raw: unknown): URL {
  const text = typeof raw === 'string' && raw !== '' ? raw : DREAM_ROUTE
  try {
    return new URL(text, 'http://localhost')
  } catch {
    return new URL(DREAM_ROUTE, 'http://localhost')
  }
}

/** 统一回 JSON；403/405/500 都用同一套 { ok:false, error:{ code, message } }。 */
function responseJson(res: any, status: number, payload: unknown, headers: Record<string, string> = {}): void {
  const text = JSON.stringify(payload)
  if (typeof res?.writeHead === 'function') {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers })
  }
  if (typeof res?.end === 'function') res.end(text)
}

function forbidden(res: any, message: string): void {
  responseJson(res, 403, { ok: false, error: { code: 'forbidden', message } })
}

/** 组装路由处理器；journalDir 在这一刻定下来（与插件的配置生命周期一致）。 */
export function createDreamWebHandler(options: DreamWebOptions = {}): (req: any, res: any) => Promise<void> {
  const journalDir = journalDirOf(options)
  return async (req: any, res: any): Promise<void> => {
    const remote = remoteVerdict(req?.socket?.remoteAddress)
    if (remote !== undefined) {
      forbidden(res, remote)
      return
    }
    const headers = (req?.headers ?? {}) as Record<string, unknown>
    const host = hostVerdict(headers.host)
    if (host !== undefined) {
      forbidden(res, host)
      return
    }
    // 缺失 method 的请求在宿主内部调用里出现过，按只读的 GET 处理。
    if (String(req?.method ?? 'GET').toUpperCase() !== 'GET') {
      responseJson(res, 405, {
        ok: false,
        error: { code: 'method-not-allowed', message: 'dsh-dream journal route is read-only; use GET' },
      }, { allow: 'GET' })
      return
    }
    const url = requestUrl(req?.url)
    const query = (url.searchParams.get('q') ?? '').trim()
    const limit = limitFromQuery(url.searchParams.get('limit'))
    try {
      const dreams = query === '' ? readDreams(journalDir, limit) : searchDreams(journalDir, query, limit)
      const stats = dreamStats(journalDir)
      responseJson(res, 200, { dreams, stats, query, limit } satisfies DreamWebPayload)
    } catch (error) {
      responseJson(res, 500, {
        ok: false,
        error: { code: 'internal', message: error instanceof Error ? error.message : String(error) },
      })
    }
  }
}

/**
 * 把梦境面板挂到宿主 webserver 上。
 * 与 dsh-calendar 相同：ctx.inject(['webServer']) + effect 注册，插件卸载即摘掉路由。
 */
export function installDreamWeb(ctx: any, options: DreamWebOptions = {}): void {
  if (ctx === null || ctx === undefined || typeof ctx.inject !== 'function') {
    throw new Error('dsh-dream: installDreamWeb 需要带 ctx.inject 的宿主上下文（宿主应提供 webServer 服务）')
  }
  const handler = createDreamWebHandler(options)
  ctx.inject(['webServer'], (webCtx: any) => {
    webCtx.effect(() => {
      return webCtx.webServer.register({
        kind: 'exact',
        path: DREAM_ROUTE,
        handler: (req: any, res: any) => handler(req, res),
      }, 'dsh-dream: dream journal route')
    }, 'dsh-dream: web routes')
  })
}
