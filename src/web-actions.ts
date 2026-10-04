/** Mutations are mounted exclusively on Connection's authenticated Fetch carrier. */
import { randomUUID } from 'node:crypto'
import { realpathSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { resolveConfig, type ResolvedDreamConfig } from './config.js'
import { KnowledgeError, type Lesson } from './knowledge.js'
import { KnowledgeStore } from './knowledge-store.js'
import { maskSecrets } from './mask.js'
import { buildDreamTools, executeDreamReview } from './tools.js'
import { rollbackBridge } from './bridge.js'
import { maskDeep } from './web.js'
import { automaticRuntime } from './automatic.js'

export const DREAM_ACTION_ROUTE = '/api/dsh-dream/actions'
export const DREAM_AUTOMATIC_ROUTE = '/api/dsh-dream/automatic'
const BODY_LIMIT = 64 * 1024
const PREVIEW_LIFETIME = 10 * 60 * 1000
const MAX_PREVIEWS = 100

type Preview = { expires: number; root: string; lessonId: string; revision: number; projectId?: string; sha: string | null; previewId: string }
type Options = { journalDir?: string; config?: Record<string, unknown> | ResolvedDreamConfig | null }

function json(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}

function fail(status: number, code: string, message: string): Response {
  return json(status, { ok: false, error: { code, message: maskSecrets(message) } })
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || value.trim() === '' || value.length > 2000) throw new KnowledgeError('invalid', key + ' 必须是非空文本，最多 2000 字符')
  return value.trim()
}

function checkRevision(store: KnowledgeStore, body: Record<string, unknown>): Lesson {
  const id = text(body, 'lessonId')
  const lesson = store.getLesson(id)
  if (lesson === undefined) throw new KnowledgeError('invalid', '经验不存在，请刷新列表')
  if (typeof body.expectedRevision !== 'number' || !Number.isInteger(body.expectedRevision) || body.expectedRevision < 1) throw new KnowledgeError('invalid', '缺少有效的经验版本')
  if (lesson.revision !== body.expectedRevision) throw new KnowledgeError('revision', '经验已更新，请刷新后重新操作')
  return lesson
}

/** Connection has authenticated the operator before this handler is called. */
export function createDreamActionHandler(options: Options = {}): (request: Request) => Promise<Response> {
  const cfg: ResolvedDreamConfig = { ...resolveConfig(options.config as Record<string, unknown> | null | undefined), ...(options.journalDir === undefined ? {} : { journalDir: options.journalDir }) }
  const store = new KnowledgeStore(join(cfg.journalDir, 'knowledge'), { maskSecrets: cfg.maskSecrets })
  const bridge = buildDreamTools(cfg).find(tool => tool.name === 'dream_bridge')!
  const previews = new Map<string, Preview>()

  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return fail(405, 'method', '请使用 POST')
    if (request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') return fail(415, 'content-type', '需要 application/json')
    // A web form or cross-origin simple request cannot supply this header.
    if (request.headers.get('x-dsh-dream-action') !== '1') return fail(403, 'forbidden', '请从 Dream 面板操作')
    const site = request.headers.get('sec-fetch-site')
    if (site !== null && site !== 'same-origin' && site !== 'none') return fail(403, 'forbidden', '拒绝跨站操作')
    const origin = request.headers.get('origin')
    if (origin !== null && /^https?:/i.test(origin)) {
      try {
        // The official node:http bridge intentionally uses http://dsh.internal
        // as its Fetch URL base; the preserved Host is the original authority.
        const host = request.headers.get('host')
        const authority = host === null ? new URL(request.url).host : new URL('http://' + host).host
        if (new URL(origin).host !== authority) return fail(403, 'forbidden', '拒绝跨源操作')
      } catch { return fail(403, 'forbidden', '无效来源') }
    }
    try {
      const reader = request.body?.getReader()
      if (reader === undefined) return fail(400, 'invalid', '缺少请求内容')
      const chunks: Uint8Array[] = []
      let size = 0
      try {
        for (;;) {
          const part = await reader.read()
          if (part.done) break
          size += part.value.byteLength
          if (size > BODY_LIMIT) { await reader.cancel(); return fail(413, 'too-large', '请求内容超过 64 KB') }
          chunks.push(part.value)
        }
      } finally { reader.releaseLock() }
      let raw: unknown
      try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return fail(400, 'invalid', '请求不是有效 JSON') }
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return fail(400, 'invalid', '请求必须是对象')
      const body = raw as Record<string, unknown>
      if (request.signal.aborted) return fail(409, 'cancelled', '操作已取消')
      const operation = text(body, 'operation')
      if (operation === 'automatic-chat' || operation === 'automatic-flush') {
        const runtime = automaticRuntime(cfg)
        if (!runtime) return fail(503, 'unavailable', '自动功能尚未就绪')
        if (operation === 'automatic-flush') runtime.flush()
        else {
          if (['use', 'contribute'].some(key => body[key] !== undefined && body[key] !== null && typeof body[key] !== 'boolean')
            || (body.use === undefined && body.contribute === undefined)) throw new KnowledgeError('invalid', '聊天记忆开关需要布尔值或跟随全局')
          runtime.controlSession(text(body, 'sessionId'), { use: body.use as boolean | null, contribute: body.contribute as boolean | null })
        }
        return json(200, { ok: true, automatic: runtime.status() })
      }
      if (operation === 'review-batch') {
        if (!['accept', 'reject'].includes(String(body.action)) || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) throw new KnowledgeError('invalid', '批量审阅每次选择 1 到 20 条候选')
        const key = text(body, 'requestId')
        if (!/^[a-zA-Z0-9_-]{8,100}$/.test(key)) throw new KnowledgeError('invalid', '审阅请求标识无效')
        const seen = new Set<string>()
        const updates = body.items.map(item => {
          if (!item || typeof item.lessonId !== 'string' || seen.has(item.lessonId) || !Number.isSafeInteger(item.expectedRevision) || item.expectedRevision < 1) throw new KnowledgeError('invalid', '候选及版本无效或重复')
          seen.add(item.lessonId)
          return { id: item.lessonId, expectedRevision: item.expectedRevision, patch: {} }
        })
        const lessons = store.updateLessonsBatch(updates, 'web-review-batch:' + key, body.action === 'accept' ? 'accepted' : 'rejected')
        return json(200, maskDeep({ ok: true, lessons, message: '已完成所选候选的审阅' }))
      }
      if (operation === 'automatic') {
        if ((body.enabled !== undefined && typeof body.enabled !== 'boolean') || (body.retrievalEnabled !== undefined && typeof body.retrievalEnabled !== 'boolean') || (body.enabled === undefined && body.retrievalEnabled === undefined)) throw new KnowledgeError('invalid', '自动功能开关必须是布尔值')
        const runtime = automaticRuntime(cfg)
        if (!runtime) return fail(503, 'unavailable', '自动功能尚未就绪，请刷新或重新启用插件')
        runtime.control({ enabled: body.enabled, retrievalEnabled: body.retrievalEnabled })
        return json(200, { ok: true, automatic: runtime.status() })
      }
      if (operation === 'review') {
        if (!['accept', 'reject', 'reopen', 'mark-stale', 'resolve-conflict'].includes(String(body.action))) throw new KnowledgeError('invalid', '不支持此页面审阅动作')
        checkRevision(store, body)
        const result = await executeDreamReview(cfg, body, undefined, 'human')
        return json(200, maskDeep(result))
      }
      if (operation === 'feedback') {
        // The store checks revision inside its lock and keeps retry keys idempotent.
        const id = text(body, 'lessonId')
        const key = text(body, 'requestId')
        if (!/^[a-zA-Z0-9_-]{8,100}$/.test(key)) throw new KnowledgeError('invalid', '反馈请求标识无效')
        const note = body.note === undefined ? undefined : text(body, 'note')
        const lesson = store.recordFeedback(id, body.vote as 'useful' | 'not-applicable', note, body.expectedRevision as number, 'web-feedback:' + key)
        return json(200, maskDeep({ ok: true, lesson, message: '已记录使用反馈，审阅状态保持原样' }))
      }
      for (const [key, value] of previews) if (value.expires < Date.now()) previews.delete(key)
      if (operation === 'preview') {
        const lesson = checkRevision(store, body)
        const root = lesson.scope.workspaceRoot
        if (root === undefined || !isAbsolute(root)) throw new KnowledgeError('invalid', '这条经验没有项目目录，请在对应项目的对话中预览规则')
        const canonicalRoot = realpathSync(root)
        const result = await bridge.execute({ mode: 'preview', lessonIds: [lesson.id], path: 'AGENTS.md', projectId: lesson.scope.projectId }, { cwd: canonicalRoot }) as Record<string, any>
        if (result.ok !== true) return json(409, maskDeep(result))
        if (result.lessons.length === 0) return fail(409, 'ineligible', '当前经验不满足写入资格，请先查看适用范围与审阅状态')
        while (previews.size >= MAX_PREVIEWS) previews.delete(previews.keys().next().value!)
        const token = randomUUID()
        previews.set(token, { expires: Date.now() + PREVIEW_LIFETIME, root: canonicalRoot, lessonId: lesson.id, revision: lesson.revision, projectId: lesson.scope.projectId, sha: result.expected.sha256, previewId: result.previewId })
        return json(200, { ...maskDeep(result), token })
      }
      if (operation === 'apply') {
        const token = text(body, 'token')
        const preview = previews.get(token)
        if (preview === undefined) return fail(409, 'preview-expired', '预览已过期，请重新预览')
        const lesson = checkRevision(store, { lessonId: preview.lessonId, expectedRevision: preview.revision })
        if (realpathSync(lesson.scope.workspaceRoot!) !== preview.root) return fail(409, 'revision', '项目目录已变化，请重新预览')
        const result = await bridge.execute({ mode: 'apply', lessonIds: [preview.lessonId], path: 'AGENTS.md', projectId: preview.projectId, expectedSha256: preview.sha, previewId: preview.previewId }, { cwd: preview.root }) as Record<string, any>
        previews.delete(token)
        return json(result.ok === true ? 200 : 409, maskDeep(result))
      }
      if (operation === 'rollback') {
        const result = rollbackBridge({ journalDir: cfg.journalDir, projectRoot: '', backupId: text(body, 'backupId') })
        return json(result.ok === true ? 200 : 409, maskDeep(result))
      }
      throw new KnowledgeError('invalid', '不支持此操作')
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('automatic-')) return fail(409, 'invalid', error.message === 'automatic-main-task-active' ? '主任务进行中，请等待完成后整理' : '聊天状态已变化或正在写入，请刷新后重试')
      if (error instanceof KnowledgeError) return fail(error.code === 'revision' || error.code === 'duplicate' ? 409 : error.code === 'io' ? 500 : 400, error.code, error.message)
      return fail(500, 'io', '操作失败：' + (error instanceof Error ? error.message : String(error)))
    }
  }
}

/** No unauthenticated webServer fallback: old hosts keep their read-only panel. */
export function installDreamActions(ctx: any, options: Options = {}): void {
  const fetch = createDreamActionHandler(options)
  ctx.inject(['connection'], (host: any) => {
    if (typeof host.connection?.fetch?.register !== 'function') return
    host.connection.fetch.register({ path: DREAM_ACTION_ROUTE, methods: ['POST'], requestBody: 'buffered', fetch })
    const cfg = { ...resolveConfig(options.config as Record<string, unknown>), ...(options.journalDir === undefined ? {} : { journalDir: options.journalDir }) }
    host.connection.fetch.register({ path: DREAM_AUTOMATIC_ROUTE, methods: ['GET'], requestBody: 'buffered', fetch: async () => json(200, {
      ok: true, automatic: automaticRuntime(cfg)?.status() ?? { available: false, enabled: false, retrievalEnabled: false, problem: 'unavailable' },
    }) })
  })
}
