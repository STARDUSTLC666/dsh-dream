/**
 * dsh-dream 的网页端后端：给设置页里的梦境面板提供只读数据。
 *
 * 安全模型沿用 dsh-calendar / dsh-email 的设置路由：这些路由能读出用户的
 * 全部梦境日记与经验（都是隐私文本），而宿主 webserver 有可能绑定在 0.0.0.0。
 * 三道门缺一不可 ——
 *   1. remoteAddress 若是明确的非回环地址则拒绝（局域网不可达）；
 *   2. Host 头必须是 localhost 名（挡 DNS rebinding：恶意域名解析到 127.0.0.1）；
 *   3. 只接受 GET：两条路由都没有任何写路径，所以不需要 CSRF 那一套。
 *
 * 零写盘纪律（M1）：知识路由只读 <journalDir>/knowledge/。目录不存在时直接返回
 * 空 lessons/evidence + 全零 stats，绝不为了读去 mkdir 或 rebuildIndex；重建索引
 * 只发生在写路径或显式维护操作里。
 *
 * @module dsh-dream/web
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveConfig, type ResolvedDreamConfig } from './config.js'
import { dreamStats, readDreams, searchDreams, type DreamEntry, type DreamStats } from './journal.js'
import type { Evidence, Lesson } from './knowledge.js'
import { KnowledgeStore } from './knowledge-store.js'
import { maskSecrets } from './mask.js'
import { buildEvidenceSummary, lessonScopeLabel } from './retrieval.js'

/** 面板与浏览器说话的同源路由。 */
export const DREAM_ROUTE = '/_dsh/dsh-dream/journal'

/** M1 经验面板的只读路由。 */
export const DREAM_KNOWLEDGE_ROUTE = '/_dsh/dsh-dream/knowledge'

/** ?limit 的默认值与上下界。 */
export const DREAM_LIMIT_DEFAULT = 50
export const DREAM_LIMIT_MIN = 1
export const DREAM_LIMIT_MAX = 500

/** 回环主机名白名单；带端口会被拆掉，IPv6 字面量保留方括号。 */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/** 回环来源地址白名单。 */
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

/** 知识的 5 个契约状态（统计归一化时保证键齐全）。 */
const LESSON_STATES = ['candidate', 'usable', 'disputed', 'stale', 'rejected'] as const

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

/** 知识路由的统计形状（与 FREEZE §2 的 stats() 对齐；v1.1 R8 透传 badLines）。 */
export interface KnowledgeWebStats {
  lessons: number
  evidence: number
  events: number
  byState: Record<string, number>
  /** 有界回放被截断时为 true（面板据此显示提示行）。 */
  truncated?: boolean
  /** 事件 / 证据流中被跳过的坏行数（面板据此显示提示行）。 */
  badLines: number
}

/** 知识路由的 JSON 形状：脱敏后的经验 / 证据 / 统计。 */
export interface KnowledgeWebPayload {
  /** 每条经验额外带 scopeLabel 与 evidenceSummary（与 dream_context 同源文案）。 */
  lessons: Array<Lesson & { scopeLabel: string; evidenceSummary: string }>
  /** 脱敏后的证据记录。 */
  evidence: Evidence[]
  /** 全量统计（不受条数影响）。 */
  stats: KnowledgeWebStats
}

/** 只读知识源的最小接口：方便测试注入假数据，生产默认用 KnowledgeStore。 */
export interface KnowledgeReader {
  listLessons(): Lesson[]
  listEvidence(): Evidence[]
  stats(): KnowledgeWebStats
}

/** 安装参数；journalDir 缺省时从 config 解析。 */
export interface DreamWebOptions {
  /** 梦境日记目录（优先）。 */
  journalDir?: string
  /** 知识目录（优先；缺省 = <journalDir>/knowledge）。 */
  knowledgeDir?: string
  /** 插件配置，用来兜底 journalDir（resolveConfig 的入参）。 */
  config?: Record<string, unknown> | ResolvedDreamConfig | null
  /** 测试注入：返回只读知识源；提供时不做目录存在性检查。 */
  knowledgeStoreFactory?: (knowledgeDir: string) => KnowledgeReader
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

/** 解析后的 knowledgeDir：显式路径优先，否则 = <journalDir>/knowledge。 */
export function knowledgeDirOf(options: DreamWebOptions, journalDir: string = journalDirOf(options)): string {
  if (typeof options.knowledgeDir === 'string' && options.knowledgeDir.trim() !== '') return options.knowledgeDir
  return join(journalDir, 'knowledge')
}

/** 解析请求 URL；非法或缺失时退回路由本身（等价于没有查询参数）。 */
function requestUrl(raw: unknown, fallback: string = DREAM_ROUTE): URL {
  const text = typeof raw === 'string' && raw !== '' ? raw : fallback
  try {
    return new URL(text, 'http://localhost')
  } catch {
    return new URL(fallback, 'http://localhost')
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

function internalError(res: any, error: unknown): void {
  responseJson(res, 500, {
    ok: false,
    error: { code: 'internal', message: error instanceof Error ? error.message : String(error) },
  })
}

/**
 * 三道门：回环来源 → 本机 Host → 只读 GET。
 * 返回 true 表示已经拒绝并写完响应，调用方应立即返回。
 */
function requestGate(req: any, res: any, readOnlyMessage: string): boolean {
  const remote = remoteVerdict(req?.socket?.remoteAddress)
  if (remote !== undefined) {
    forbidden(res, remote)
    return true
  }
  const headers = (req?.headers ?? {}) as Record<string, unknown>
  const host = hostVerdict(headers.host)
  if (host !== undefined) {
    forbidden(res, host)
    return true
  }
  // 缺失 method 的请求在宿主内部调用里出现过，按只读的 GET 处理。
  if (String(req?.method ?? 'GET').toUpperCase() !== 'GET') {
    responseJson(res, 405, {
      ok: false,
      error: { code: 'method-not-allowed', message: readOnlyMessage },
    }, { allow: 'GET' })
    return true
  }
  return false
}

/** 递归脱敏所有字符串叶子；数字 / 布尔 / null 原样保留。 */
function maskDeep<T>(value: T): T {
  if (typeof value === 'string') return maskSecrets(value) as unknown as T
  if (Array.isArray(value)) return value.map((item) => maskDeep(item)) as unknown as T
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = maskDeep(item)
    return out as unknown as T
  }
  return value
}

/** 统计归一化：数字字段兜底为 0，byState 五个键齐全，truncated 只在为 true 时保留，badLines 始终透传。 */
function normalizeKnowledgeStats(value: unknown): KnowledgeWebStats {
  const source = value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
  const rawByState = source.byState !== null && typeof source.byState === 'object'
    ? source.byState as Record<string, unknown>
    : {}
  const byState: Record<string, number> = {}
  for (const state of LESSON_STATES) {
    const count = rawByState[state]
    byState[state] = typeof count === 'number' && Number.isFinite(count) && count >= 0 ? count : 0
  }
  const numberAt = (key: string): number => {
    const raw = source[key]
    return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : 0
  }
  const stats: KnowledgeWebStats = {
    lessons: numberAt('lessons'),
    evidence: numberAt('evidence'),
    events: numberAt('events'),
    byState,
    badLines: Math.floor(numberAt('badLines')),
  }
  if (source.truncated === true) stats.truncated = true
  return stats
}

/** 知识目录不存在（或尚未建立）时的空载荷：不写盘、不报 404。 */
export function emptyKnowledgePayload(): KnowledgeWebPayload {
  return {
    lessons: [],
    evidence: [],
    stats: normalizeKnowledgeStats(null),
  }
}

/** 组装梦境日记路由处理器；journalDir 在这一刻定下来（与插件的配置生命周期一致）。 */
export function createDreamWebHandler(options: DreamWebOptions = {}): (req: any, res: any) => Promise<void> {
  const journalDir = journalDirOf(options)
  return async (req: any, res: any): Promise<void> => {
    if (requestGate(req, res, 'dsh-dream journal route is read-only; use GET')) return
    const url = requestUrl(req?.url)
    const query = (url.searchParams.get('q') ?? '').trim()
    const limit = limitFromQuery(url.searchParams.get('limit'))
    try {
      const dreams = query === '' ? readDreams(journalDir, limit) : searchDreams(journalDir, query, limit)
      const stats = dreamStats(journalDir)
      responseJson(res, 200, { dreams, stats, query, limit } satisfies DreamWebPayload)
    } catch (error) {
      internalError(res, error)
    }
  }
}

/** 组装只读经验路由处理器；零写盘：目录不存在就直接返回空结果。 */
export function createKnowledgeWebHandler(options: DreamWebOptions = {}): (req: any, res: any) => Promise<void> {
  const knowledgeDir = knowledgeDirOf(options)
  return async (req: any, res: any): Promise<void> => {
    if (requestGate(req, res, 'dsh-dream knowledge route is read-only; use GET')) return
    try {
      const reader = options.knowledgeStoreFactory !== undefined
        ? options.knowledgeStoreFactory(knowledgeDir)
        : (existsSync(knowledgeDir) ? new KnowledgeStore(knowledgeDir) : null)
      if (reader === null) {
        responseJson(res, 200, emptyKnowledgePayload())
        return
      }
      const lessons = reader.listLessons()
      const evidence = reader.listEvidence()
      const stats = normalizeKnowledgeStats(reader.stats())
      const payload: KnowledgeWebPayload = {
        lessons: lessons.map((lesson) => maskDeep({
          ...lesson,
          scopeLabel: lessonScopeLabel(lesson.scope),
          evidenceSummary: buildEvidenceSummary(lesson, evidence),
        })),
        evidence: evidence.map((item) => maskDeep(item)),
        stats,
      }
      responseJson(res, 200, payload)
    } catch (error) {
      internalError(res, error)
    }
  }
}

/**
 * 把只读路由挂到宿主 webserver 上。
 * 与 dsh-calendar 相同：ctx.inject(['webServer']) + effect 注册，插件卸载即摘掉路由；
 * 同一个 effect 里注册日记与知识两条 exact 路由，卸载时一起释放。
 */
export function installDreamWeb(ctx: any, options: DreamWebOptions = {}): void {
  if (ctx === null || ctx === undefined || typeof ctx.inject !== 'function') {
    throw new Error('dsh-dream: installDreamWeb 需要带 ctx.inject 的宿主上下文（宿主应提供 webServer 服务）')
  }
  const journalHandler = createDreamWebHandler(options)
  const knowledgeHandler = createKnowledgeWebHandler(options)
  ctx.inject(['webServer'], (webCtx: any) => {
    webCtx.effect(() => {
      const disposers: Array<() => void> = [
        webCtx.webServer.register({
          kind: 'exact',
          path: DREAM_ROUTE,
          handler: (req: any, res: any) => journalHandler(req, res),
        }, 'dsh-dream: dream journal route'),
        webCtx.webServer.register({
          kind: 'exact',
          path: DREAM_KNOWLEDGE_ROUTE,
          handler: (req: any, res: any) => knowledgeHandler(req, res),
        }, 'dsh-dream: knowledge route'),
      ]
      return () => {
        for (const dispose of disposers) {
          if (typeof dispose === 'function') dispose()
        }
      }
    }, 'dsh-dream: web routes')
  })
}
