/**
 * dsh-dream 网页端（src/web.ts）的宿主侧契约测试。
 *
 * 假 ctx + 假 webServer 捕获 handler，直接验证 HTTP 语义与 JSON 契约：
 * 空日记 / 新梦在前 / 正文与教训不丢 / q 真过滤 / limit 边界 /
 * 非 GET 405 / 非本机 Host 403 / 可 JSON 序列化；M1 只读知识路由
 * （空目录零写盘 / 投影字段 / 脱敏 / 405+403 / 500 信封 / 真实 store 集成）。
 *
 * src/web.ts 内部按 NodeNext 规范用 './journal.js' 指向同目录源文件；
 * 直接 node --test 时没有 tsc，所以这里注册一个同步 resolve 钩子，
 * 把 src 下不存在的 .js 说明符补成 .ts，从而不需要先构建 lib/。
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    const fromTs = typeof context.parentURL === 'string' && context.parentURL.endsWith('.ts')
    if (fromTs && specifier.startsWith('.') && specifier.endsWith('.js')) {
      try {
        return nextResolve(specifier, context)
      } catch {
        return nextResolve(specifier.slice(0, -3) + '.ts', context)
      }
    }
    return nextResolve(specifier, context)
  },
})

const {
  DREAM_BRIDGE_ROUTE,
  DREAM_KNOWLEDGE_ROUTE,
  DREAM_LIMIT_DEFAULT,
  DREAM_LIMIT_MAX,
  DREAM_ROUTE,
  installDreamWeb,
  limitFromQuery,
} = await import('../src/web.ts')
const { apply } = await import('../src/index.ts')

const root = mkdtempSync(join(tmpdir(), 'dsh-dream-web-'))
after(() => rmSync(root, { recursive: true, force: true }))

let journalSeq = 0

/** 造一个日记目录：按文件顺序（旧 → 新）写 JSONL；entries 为空时连文件都不建。 */
function makeJournal(entries) {
  const dir = join(root, 'journal-' + (++journalSeq))
  mkdirSync(dir, { recursive: true })
  if (entries.length > 0) {
    const lines = entries.map((entry, index) => JSON.stringify({
      id: entry.id ?? 'dream-' + index,
      at: entry.at ?? new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
      reflection: entry.reflection,
      lessons: entry.lessons ?? [],
      mood: entry.mood ?? '平静',
    }))
    writeFileSync(join(dir, 'dreams.jsonl'), lines.join('\n') + '\n', 'utf8')
  }
  return dir
}

/** 假 ctx / 假 webServer：捕获 inject 的服务名、注册的路由与 effect 的 disposer。 */
function mount(options) {
  const injected = []
  const routes = []
  const effects = []
  const webCtx = {
    webServer: {
      register(route, description) {
        routes.push({ route, description })
        return () => {
          const index = routes.findIndex((item) => item.route === route)
          if (index >= 0) routes.splice(index, 1)
        }
      },
    },
    effect(factory, label) {
      const disposer = factory()
      effects.push({ factory, label, disposer })
      return disposer
    },
  }
  const ctx = {
    inject(names, callback) {
      injected.push(names)
      callback(webCtx)
    },
  }
  installDreamWeb(ctx, options)
  return { injected, routes, effects }
}

/** 挂载并取出梦境路由 handler。 */
function handlerFor(options) {
  const mounted = mount(options)
  assert.equal(mounted.injected.length, 1)
  const route = mounted.routes.find((item) => item.route.path === DREAM_ROUTE)
  assert.ok(route, '梦境日记路由应已注册')
  return { ...mounted, handler: route.route.handler }
}

/** 挂载并取出知识路由 handler。 */
function knowledgeHandlerFor(options) {
  const mounted = mount(options)
  assert.equal(mounted.injected.length, 1)
  const route = mounted.routes.find((item) => item.route.path === DREAM_KNOWLEDGE_ROUTE)
  assert.ok(route, '知识路由应已注册')
  return { ...mounted, handler: route.route.handler }
}

/** 挂载并取出写入记录路由 handler。 */
function bridgeHandlerFor(options) {
  const mounted = mount(options)
  assert.equal(mounted.injected.length, 1)
  const route = mounted.routes.find((item) => item.route.path === DREAM_BRIDGE_ROUTE)
  assert.ok(route, '写入记录路由应已注册')
  return { ...mounted, handler: route.route.handler }
}

/** 递归快照目录里的所有文件内容，用于验证只读路由不写盘。 */
function snapshotDir(dir) {
  const out = {}
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    const stat = statSync(full)
    out[name] = stat.isDirectory() ? snapshotDir(full) : readFileSync(full, 'utf8')
  }
  return out
}

function makeRes() {
  const res = { status: 0, headers: {}, body: '' }
  res.writeHead = (status, headers) => {
    res.status = status
    res.headers = headers ?? {}
  }
  res.end = (text) => {
    res.body = String(text ?? '')
  }
  return res
}

/** 发一次请求：默认是本机浏览器发来的 GET。 */
function call(handler, overrides = {}) {
  const req = {
    method: 'GET',
    url: DREAM_ROUTE,
    headers: { host: 'localhost:5173' },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  }
  const res = makeRes()
  return Promise.resolve(handler(req, res)).then(() => res)
}

const jsonOf = (res) => JSON.parse(res.body)

test('三条只读路由：ctx.inject(["webServer"]) + 一个 effect 注册 journal / knowledge / bridge', () => {
  assert.equal(DREAM_ROUTE, '/_dsh/dsh-dream/journal')
  assert.equal(DREAM_KNOWLEDGE_ROUTE, '/_dsh/dsh-dream/knowledge')
  assert.equal(DREAM_BRIDGE_ROUTE, '/_dsh/dsh-dream/bridge')
  const mounted = mount({ journalDir: makeJournal([]) })
  assert.deepEqual(mounted.injected, [['webServer']])
  assert.equal(mounted.effects.length, 1)
  assert.equal(mounted.effects[0].label, 'dsh-dream: web routes')
  assert.deepEqual(
    mounted.routes.map((item) => item.route.path).sort(),
    [DREAM_BRIDGE_ROUTE, DREAM_KNOWLEDGE_ROUTE, DREAM_ROUTE].sort(),
  )
  for (const item of mounted.routes) {
    assert.equal(item.route.kind, 'exact')
    assert.equal(typeof item.route.handler, 'function')
  }
  const journal = mounted.routes.find((item) => item.route.path === DREAM_ROUTE)
  const knowledge = mounted.routes.find((item) => item.route.path === DREAM_KNOWLEDGE_ROUTE)
  const bridge = mounted.routes.find((item) => item.route.path === DREAM_BRIDGE_ROUTE)
  assert.equal(journal.description, 'dsh-dream: dream journal route')
  assert.equal(knowledge.description, 'dsh-dream: knowledge route')
  assert.equal(bridge.description, 'dsh-dream: bridge log route')
})

test('effect 的 disposer 触发后三条路由一起被摘掉', () => {
  const mounted = mount({ journalDir: makeJournal([]) })
  assert.equal(mounted.routes.length, 3)
  mounted.effects[0].disposer()
  assert.equal(mounted.routes.length, 0)
})

test('空日记 → 200 + 空数组 + 零统计 + 默认 limit=50', async () => {
  const { handler } = handlerFor({ journalDir: makeJournal([]) })
  const res = await call(handler)
  assert.equal(res.status, 200)
  assert.match(String(res.headers['content-type']), /^application\/json/)
  const body = jsonOf(res)
  assert.deepEqual(body.dreams, [])
  assert.deepEqual(body.stats, { total: 0, moods: {}, topLessons: [], skippedLines: 0 })
  assert.equal(body.query, '')
  assert.equal(body.limit, DREAM_LIMIT_DEFAULT)
})

test('新梦在前（倒序读取）', async () => {
  const dir = makeJournal([
    { id: 'dream-old', reflection: '第一梦：旧', lessons: ['a'], mood: '平静' },
    { id: 'dream-mid', reflection: '第二梦：中', lessons: ['b'], mood: '好奇' },
    { id: 'dream-new', reflection: '第三梦：新', lessons: ['c'], mood: '振奋' },
  ])
  const { handler } = handlerFor({ journalDir: dir })
  const body = jsonOf(await call(handler))
  assert.deepEqual(body.dreams.map((dream) => dream.id), ['dream-new', 'dream-mid', 'dream-old'])
})

test('正文与教训原样返回、字段不为 null/undefined（#4 数据不丢）', async () => {
  const longReflection = [
    '第一行：用户在深色主题下看不清文字。',
    '第二行：根因是引用了不存在的主题变量，必须用真实 --dsw-* token 且带 fallback。',
    '第三行：' + '长正文不截断 '.repeat(30),
  ].join('\n')
  const dir = makeJournal([
    { id: 'dream-1', at: '2026-03-01T08:00:00.000Z', reflection: longReflection, lessons: ['只写真实存在的 --dsw-* 变量', '每个 token 都给 fallback'], mood: '存疑' },
  ])
  const { handler } = handlerFor({ journalDir: dir })
  const body = jsonOf(await call(handler))
  const dream = body.dreams[0]
  assert.equal(dream.reflection, longReflection)
  assert.deepEqual(dream.lessons, ['只写真实存在的 --dsw-* 变量', '每个 token 都给 fallback'])
  assert.equal(dream.mood, '存疑')
  assert.equal(dream.at, '2026-03-01T08:00:00.000Z')
  assert.equal(dream.id, 'dream-1')
  for (const key of ['id', 'at', 'reflection', 'mood']) {
    assert.equal(typeof dream[key], 'string', key + ' 必须是字符串')
    assert.notEqual(dream[key], undefined)
  }
  assert.ok(Array.isArray(dream.lessons))
})

test('stats 统计全量：总数、心境分布与教训榜', async () => {
  const dir = makeJournal([
    { reflection: '一', lessons: ['先重启', '看日志'], mood: '平静' },
    { reflection: '二', lessons: ['先重启'], mood: '平静' },
    { reflection: '三', lessons: ['看日志'], mood: '存疑' },
  ])
  const { handler } = handlerFor({ journalDir: dir })
  const { stats } = jsonOf(await call(handler))
  assert.equal(stats.total, 3)
  assert.deepEqual(stats.moods, { 平静: 2, 存疑: 1 })
  // 同次数时的榜单顺序不属于契约，按 {教训: {count, lastAt}} 比较。
  assert.deepEqual(
    Object.fromEntries(stats.topLessons.map((item) => [item.lesson, { count: item.count, lastAt: item.lastAt }])),
    {
      先重启: { count: 2, lastAt: '2026-01-01T00:00:01.000Z' },
      看日志: { count: 2, lastAt: '2026-01-01T00:00:02.000Z' },
    },
  )
  for (const item of stats.topLessons) {
    assert.deepEqual(Object.keys(item).sort(), ['count', 'lastAt', 'lesson'], 'topLessons 三项齐全')
    assert.equal(typeof item.lastAt, 'string')
    assert.notEqual(item.lastAt, undefined)
  }
})

test('?q= 真过滤：大小写不敏感，reflection 与 lessons 都命中，不同词结果不同', async () => {
  const dir = makeJournal([
    { id: 'dream-1', reflection: '修输入法', lessons: ['先重启应用'], mood: '平静' },
    { id: 'dream-2', reflection: 'Restart the daemon next time', lessons: ['check logs'], mood: '平静' },
    { id: 'dream-3', reflection: '和用户确认时间', lessons: ['先问清楚'], mood: '平静' },
  ])
  const { handler } = handlerFor({ journalDir: dir })
  const hit1 = jsonOf(await call(handler, { url: DREAM_ROUTE + '?q=' + encodeURIComponent('重启') }))
  assert.equal(hit1.query, '重启')
  assert.deepEqual(hit1.dreams.map((dream) => dream.id), ['dream-1'])
  const hit2 = jsonOf(await call(handler, { url: DREAM_ROUTE + '?q=restart' }))
  assert.deepEqual(hit2.dreams.map((dream) => dream.id), ['dream-2'])
  const hit3 = jsonOf(await call(handler, { url: DREAM_ROUTE + '?q=LOGS' }))
  assert.deepEqual(hit3.dreams.map((dream) => dream.id), ['dream-2'])
  const hit4 = jsonOf(await call(handler, { url: DREAM_ROUTE + '?q=' + encodeURIComponent('确认') }))
  assert.deepEqual(hit4.dreams.map((dream) => dream.id), ['dream-3'])
  assert.notDeepEqual(hit1.dreams, hit4.dreams, '不同关键词必须返回不同结果')
})

test('?q= 无命中 → 空数组，但 stats 仍是全量', async () => {
  const dir = makeJournal([
    { reflection: '一', lessons: [], mood: '平静' },
    { reflection: '二', lessons: [], mood: '平静' },
  ])
  const { handler } = handlerFor({ journalDir: dir })
  const body = jsonOf(await call(handler, { url: DREAM_ROUTE + '?q=' + encodeURIComponent('不存在的词') }))
  assert.deepEqual(body.dreams, [])
  assert.equal(body.stats.total, 2)
})

test('?q= 空串等价于不检索', async () => {
  const dir = makeJournal([{ reflection: '一' }, { reflection: '二' }])
  const { handler } = handlerFor({ journalDir: dir })
  const body = jsonOf(await call(handler, { url: DREAM_ROUTE + '?q=' }))
  assert.equal(body.query, '')
  assert.equal(body.dreams.length, 2)
})

test('limit 缺省 50：写 60 条只回 50 条', async () => {
  const dir = makeJournal(Array.from({ length: 60 }, (_, index) => ({ id: 'dream-' + index, reflection: '第 ' + index + ' 场梦' })))
  const { handler } = handlerFor({ journalDir: dir })
  const body = jsonOf(await call(handler))
  assert.equal(body.limit, DREAM_LIMIT_DEFAULT)
  assert.equal(body.dreams.length, 50)
  assert.equal(body.stats.total, 60)
})

test('limit 边界：1 与 500 按字面生效', async () => {
  const dir = makeJournal(Array.from({ length: 600 }, (_, index) => ({ id: 'dream-' + index, reflection: '第 ' + index + ' 场梦' })))
  const { handler } = handlerFor({ journalDir: dir })
  const one = jsonOf(await call(handler, { url: DREAM_ROUTE + '?limit=1' }))
  assert.equal(one.limit, 1)
  assert.deepEqual(one.dreams.map((dream) => dream.id), ['dream-599'])
  const max = jsonOf(await call(handler, { url: DREAM_ROUTE + '?limit=500' }))
  assert.equal(max.limit, 500)
  assert.equal(max.dreams.length, 500)
})

test('limit 越界钳制到 [1, 500]：9999→500，0 与负数→1', async () => {
  const dir = makeJournal(Array.from({ length: 12 }, (_, index) => ({ id: 'dream-' + index, reflection: 'r' + index })))
  const { handler } = handlerFor({ journalDir: dir })
  const tooBig = jsonOf(await call(handler, { url: DREAM_ROUTE + '?limit=9999' }))
  assert.equal(tooBig.limit, DREAM_LIMIT_MAX)
  assert.equal(tooBig.dreams.length, 12)
  const zero = jsonOf(await call(handler, { url: DREAM_ROUTE + '?limit=0' }))
  assert.equal(zero.limit, 1)
  assert.equal(zero.dreams.length, 1)
  const negative = jsonOf(await call(handler, { url: DREAM_ROUTE + '?limit=-7' }))
  assert.equal(negative.limit, 1)
})

test('limit 非法值回退默认 50，小数截断', async () => {
  const dir = makeJournal(Array.from({ length: 12 }, (_, index) => ({ id: 'dream-' + index, reflection: 'r' + index })))
  const { handler } = handlerFor({ journalDir: dir })
  const bogus = jsonOf(await call(handler, { url: DREAM_ROUTE + '?limit=abc' }))
  assert.equal(bogus.limit, DREAM_LIMIT_DEFAULT)
  const fractional = jsonOf(await call(handler, { url: DREAM_ROUTE + '?limit=2.9' }))
  assert.equal(fractional.limit, 2)
  assert.equal(fractional.dreams.length, 2)
})

test('limitFromQuery 是导出的小工具（面板可直接复用同一套钳制）', () => {
  assert.equal(limitFromQuery(undefined), DREAM_LIMIT_DEFAULT)
  assert.equal(limitFromQuery(''), DREAM_LIMIT_DEFAULT)
  assert.equal(limitFromQuery('3'), 3)
  assert.equal(limitFromQuery('0'), 1)
  assert.equal(limitFromQuery('501'), DREAM_LIMIT_MAX)
  assert.equal(limitFromQuery('x'), DREAM_LIMIT_DEFAULT)
})

test('非 GET → 405，且带 Allow: GET', async () => {
  const { handler } = handlerFor({ journalDir: makeJournal([{ reflection: '一' }]) })
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']) {
    const res = await call(handler, { method })
    assert.equal(res.status, 405, method + ' 应被拒绝')
    assert.equal(res.headers.allow, 'GET')
    const body = jsonOf(res)
    assert.equal(body.ok, false)
    assert.equal(body.error.code, 'method-not-allowed')
  }
})

test('method 小写 get 也认；缺失 method 按 GET 处理', async () => {
  const { handler } = handlerFor({ journalDir: makeJournal([{ reflection: '一' }]) })
  assert.equal((await call(handler, { method: 'get' })).status, 200)
  const res = makeRes()
  await handler({ url: DREAM_ROUTE, headers: { host: 'localhost' }, socket: { remoteAddress: '127.0.0.1' } }, res)
  assert.equal(res.status, 200)
})

test('非本机 Host → 403（DNS rebinding / 局域网域名都挡）', async () => {
  const { handler } = handlerFor({ journalDir: makeJournal([{ reflection: '一' }]) })
  for (const host of ['evil.example', 'evil.example:4455', '192.168.1.9', '10.0.0.2:3000', '[::2]:8080']) {
    const res = await call(handler, { headers: { host } })
    assert.equal(res.status, 403, host + ' 应被拒绝')
    const body = jsonOf(res)
    assert.equal(body.ok, false)
    assert.equal(body.error.code, 'forbidden')
  }
})

test('本机 Host 放行：localhost / 127.0.0.1 / [::1]，带端口、大小写、无 Host 都行', async () => {
  const { handler } = handlerFor({ journalDir: makeJournal([{ reflection: '一' }]) })
  for (const host of ['localhost', 'LOCALHOST:5173', '127.0.0.1', '127.0.0.1:8080', '[::1]:80', '::1']) {
    assert.equal((await call(handler, { headers: { host } })).status, 200, host + ' 应当放行')
  }
  assert.equal((await call(handler, { headers: {} })).status, 200)
})

test('非回环 remoteAddress → 403；缺失 socket 不受影响', async () => {
  const { handler } = handlerFor({ journalDir: makeJournal([{ reflection: '一' }]) })
  assert.equal((await call(handler, { socket: { remoteAddress: '192.168.1.20' } })).status, 403)
  assert.equal((await call(handler, { socket: {} })).status, 200)
  assert.equal((await call(handler, { socket: { remoteAddress: '::ffff:127.0.0.1' } })).status, 200)
  assert.equal((await call(handler, { socket: { remoteAddress: '::1' } })).status, 200)
})

test('损坏行跳过，合法行走正常倒序', async () => {
  const dir = join(root, 'journal-broken')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'dreams.jsonl'), [
    JSON.stringify({ id: 'dream-1', at: '2026-01-01T00:00:00.000Z', reflection: '好梦', lessons: [], mood: '平静' }),
    '{ 这不是 JSON',
    JSON.stringify({ id: 'dream-2', at: '2026-01-02T00:00:00.000Z', reflection: '另一个好梦', lessons: [], mood: '平静' }),
  ].join('\n') + '\n', 'utf8')
  const { handler } = handlerFor({ journalDir: dir })
  const body = jsonOf(await call(handler))
  assert.equal(body.stats.total, 2)
  assert.deepEqual(body.dreams.map((dream) => dream.reflection), ['另一个好梦', '好梦'])
})

test('响应可 JSON 序列化，顶层字段恰好是 dreams/stats/query/limit', async () => {
  const dir = makeJournal([{ id: 'dream-1', reflection: '一', lessons: ['先重启'], mood: '平静' }])
  const { handler } = handlerFor({ journalDir: dir })
  const res = await call(handler, { url: DREAM_ROUTE + '?limit=5&q=' + encodeURIComponent('重启') })
  assert.doesNotThrow(() => JSON.parse(res.body))
  const body = JSON.parse(res.body)
  assert.deepEqual(Object.keys(body).sort(), ['dreams', 'limit', 'query', 'stats'])
  assert.equal(body.limit, 5)
  assert.equal(body.query, '重启')
  assert.equal(body.stats.total, 1)
})

test('journalDir 缺省时从 config 解析（面板按 config 挂载即可）', async () => {
  const dir = makeJournal([{ id: 'dream-1', reflection: '来自 config 的梦' }])
  const mounted = mount({ config: { journalDir: dir } })
  const res = await call(mounted.routes[0].route.handler)
  assert.equal(res.status, 200)
  assert.equal(jsonOf(res).dreams[0].reflection, '来自 config 的梦')
})

test('journalDir 与 config 都缺省 → 回退 DSH_HOME/.dsh-dream（空目录也 200）', async () => {
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = join(root, 'home-fallback')
  try {
    const { handler } = handlerFor({})
    const res = await call(handler)
    assert.equal(res.status, 200)
    assert.deepEqual(jsonOf(res).dreams, [])
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
  }
})

test('缺少 ctx.inject 的宿主直接抛错，避免静默不挂路由', () => {
  assert.throws(() => installDreamWeb({}, {}), /installDreamWeb/)
})

test('apply() 会通过 ctx.inject(["webServer"]) 挂上只读路由（index.ts 集成）', async () => {
  const dir = makeJournal([{ id: 'dream-1', reflection: '集成梦' }])
  const injected = []
  const routes = []
  const webCtx = {
    webServer: { register(route) { routes.push(route); return () => {} } },
    effect(factory) { return factory() },
  }
  const ctx = {
    tools: { register() { return () => {} } },
    on() { return () => {} },
    inject(names, callback) { injected.push(names); callback(webCtx) },
  }
  apply(ctx, { journalDir: dir })
  assert.deepEqual(injected, [['webServer'], ['connection']])
  assert.equal(routes.length, 3)
  const journalRoute = routes.find((route) => route.path === DREAM_ROUTE)
  const knowledgeRoute = routes.find((route) => route.path === DREAM_KNOWLEDGE_ROUTE)
  const bridgeRoute = routes.find((route) => route.path === DREAM_BRIDGE_ROUTE)
  assert.ok(journalRoute, 'journal 路由应已注册')
  assert.ok(knowledgeRoute, 'knowledge 路由应已注册')
  assert.ok(bridgeRoute, 'bridge 路由应已注册')
  assert.equal(journalRoute.kind, 'exact')
  const body = jsonOf(await call(journalRoute.handler))
  assert.equal(body.dreams[0].reflection, '集成梦')
})

test('apply() 在没有 ctx.inject 的 headless 夹具上不抛（web 路由跳过）', () => {
  const ctx = {
    tools: { register() { return () => {} } },
    on() { return () => {} },
  }
  assert.doesNotThrow(() => apply(ctx, { journalDir: makeJournal([]) }))
})

test('topLessons.lastAt = 最近一次出现的 at；该条 at 缺失给 ""，绝不为 null', async () => {
  const dir = makeJournal([
    { id: 'dream-1', at: '2025-01-01T00:00:00.000Z', reflection: '一', lessons: ['先重启'], mood: '平静' },
    { id: 'dream-2', at: '', reflection: '二（手改过、没有 at）', lessons: ['先重启'], mood: '平静' },
    { id: 'dream-3', at: '2025-12-01T00:00:00.000Z', reflection: '三', lessons: ['看日志'], mood: '平静' },
  ])
  const { handler } = handlerFor({ journalDir: dir })
  const { stats } = jsonOf(await call(handler))
  const byLesson = Object.fromEntries(stats.topLessons.map((item) => [item.lesson, item]))
  assert.equal(byLesson['先重启'].count, 2)
  assert.equal(byLesson['先重启'].lastAt, '')
  assert.equal(byLesson['看日志'].count, 1)
  assert.equal(byLesson['看日志'].lastAt, '2025-12-01T00:00:00.000Z')
  for (const item of stats.topLessons) {
    assert.equal(typeof item.lastAt, 'string')
    assert.notEqual(item.lastAt, null)
  }
})

test('同次数按 lastAt 降序（count 相同也比时间，不比文件顺序）', async () => {
  const dir = makeJournal([
    { id: 'dream-1', at: '2025-12-01T00:00:00.000Z', reflection: '文件里更早、时间戳更晚', lessons: ['教训 A'], mood: '平静' },
    { id: 'dream-2', at: '2025-01-01T00:00:00.000Z', reflection: '文件里更晚、时间戳更早', lessons: ['教训 B'], mood: '平静' },
  ])
  const { handler } = handlerFor({ journalDir: dir })
  const { stats } = jsonOf(await call(handler))
  assert.deepEqual(stats.topLessons.map((item) => item.lesson), ['教训 A', '教训 B'])
  assert.deepEqual(stats.topLessons.map((item) => item.lastAt), ['2025-12-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'])
})

test('dream_journal 工具输出纯增量：老字段照旧，topLessons 多一个 lastAt', async () => {
  const dir = makeJournal([{ id: 'dream-1', at: '2026-05-05T00:00:00.000Z', reflection: '接口梦', lessons: ['先重启'], mood: '平静' }])
  const registered = []
  const ctx = {
    tools: { register(definition) { registered.push(definition); return () => {} } },
    on() { return () => {} },
  }
  apply(ctx, { journalDir: dir })
  const journalTool = registered.find((definition) => definition.name === 'dream_journal')
  assert.ok(journalTool, 'dream_journal 应已注册')
  const value = await journalTool.execute({ limit: 1 })
  assert.equal(value.count, 1)
  assert.equal(value.dreams[0].reflection, '接口梦')
  assert.equal(value.stats.total, 1)
  assert.deepEqual(Object.keys(value.stats.topLessons[0]).sort(), ['count', 'lastAt', 'lesson'])
  assert.equal(value.stats.topLessons[0].lastAt, '2026-05-05T00:00:00.000Z')
  assert.match(journalTool.output.render({}, value)[0].text, /接口梦/)
})


// ───────────────────────── M1 只读知识路由 ─────────────────────────

/** 假知识源：只实现 FREEZE §2 的只读三方法。 */
function fakeKnowledgeStore(data) {
  return {
    listLessons: () => data.lessons ?? [],
    listEvidence: () => data.evidence ?? [],
    stats: () => data.stats ?? { lessons: 0, evidence: 0, events: 0, byState: {} },
  }
}

function makeLesson(overrides = {}) {
  return {
    schemaVersion: 1,
    id: 'lesson-1',
    revision: 1,
    kind: 'pitfall',
    title: '取消后要验证连接关闭',
    action: '检查当前连接状态',
    when: '使用 Nodemailer 9.0.5 池化发送时',
    exceptions: ['流式发送例外'],
    scope: { projectId: 'mailer', global: false },
    applicability: [{ package: 'nodemailer', versions: '9.0.5' }],
    state: 'candidate',
    evidenceIds: [],
    independentSupportCount: 0,
    review: { decision: 'unreviewed' },
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    lastValidatedAt: '2026-09-28T00:00:00.000Z',
    conflictIds: [],
    ...overrides,
  }
}

test('知识路由：空知识目录 → 200 + 空数组 + 全零 stats，且 GET 不创建目录（零写盘）', async () => {
  const dir = makeJournal([])
  const knowledgeDir = join(dir, 'knowledge')
  assert.equal(existsSync(knowledgeDir), false, '前置：目录不存在')
  const { handler } = knowledgeHandlerFor({ journalDir: dir })
  const res = await call(handler, { url: DREAM_KNOWLEDGE_ROUTE })
  assert.equal(res.status, 200)
  assert.match(String(res.headers['content-type']), /^application\/json/)
  const body = jsonOf(res)
  assert.deepEqual(Object.keys(body).sort(), ['evidence', 'lessons', 'stats'])
  assert.deepEqual(body.lessons, [])
  assert.deepEqual(body.evidence, [])
  assert.deepEqual(body.stats, {
    lessons: 0,
    evidence: 0,
    events: 0,
    byState: { candidate: 0, usable: 0, disputed: 0, stale: 0, rejected: 0 },
    badLines: 0,
  })
  assert.equal(existsSync(knowledgeDir), false, '只读路由绝不能在读的时候 mkdir')
})

test('知识路由：透传 truncated 与 badLines（R8 提示行数据），数字兜底不产生 NaN', async () => {
  const { handler } = knowledgeHandlerFor({
    journalDir: makeJournal([]),
    knowledgeStoreFactory: () => fakeKnowledgeStore({
      stats: {
        lessons: 0,
        evidence: 0,
        events: 250001,
        byState: {},
        truncated: true,
        badLines: 3,
      },
    }),
  })
  const body = jsonOf(await call(handler, { url: DREAM_KNOWLEDGE_ROUTE }))
  assert.equal(body.stats.truncated, true, '有界回放被截断必须透传，面板才能提示')
  assert.equal(body.stats.badLines, 3, 'badLines 必须透传，面板才能提示损坏行')
  assert.equal(body.stats.events, 250001)
  // 坏形状兜底：不出现 NaN / undefined
  const { handler: bogus } = knowledgeHandlerFor({
    journalDir: makeJournal([]),
    knowledgeStoreFactory: () => fakeKnowledgeStore({
      stats: { lessons: 'x', evidence: null, events: NaN, byState: { candidate: -1 }, truncated: 'yes', badLines: 2.9 },
    }),
  })
  const bogusBody = jsonOf(await call(bogus, { url: DREAM_KNOWLEDGE_ROUTE }))
  assert.equal(bogusBody.stats.lessons, 0)
  assert.equal(bogusBody.stats.evidence, 0)
  assert.equal(bogusBody.stats.events, 0)
  assert.equal(bogusBody.stats.byState.candidate, 0)
  assert.equal(bogusBody.stats.truncated, undefined)
  assert.equal(bogusBody.stats.badLines, 2, 'badLines 取正数下限，不产生小数')
})

test('知识路由：候选 / 有冲突都返回，scopeLabel 与 evidenceSummary 来自检索层，原始密钥被脱敏', async () => {
  const secret = 'sk-abcdefghijklmnopqrstuvwxyz012345'
  const evidence = [{
    schemaVersion: 1,
    id: 'ev-1',
    kind: 'local-artifact',
    observedAt: '2026-09-28T00:00:00.000Z',
    summary: '本机 SMTP 复现：取消后服务器仍收到正文 ' + secret,
    verification: 'read',
  }]
  const candidate = makeLesson({ id: 'lesson-candidate', title: '取消后要验证连接关闭 ' + secret, evidenceIds: ['ev-1'], independentSupportCount: 1 })
  const disputed = makeLesson({ id: 'lesson-disputed', title: '两条建议互相冲突', state: 'disputed', scope: { global: true } })
  const { handler } = knowledgeHandlerFor({
    journalDir: makeJournal([]),
    knowledgeStoreFactory: () => fakeKnowledgeStore({
      lessons: [candidate, disputed],
      evidence,
      stats: { lessons: 2, evidence: 1, events: 3, byState: { candidate: 1, usable: 0, disputed: 1, stale: 0, rejected: 0 }, badLines: 0 },
    }),
  })
  const res = await call(handler, { url: DREAM_KNOWLEDGE_ROUTE })
  assert.equal(res.status, 200)
  const body = jsonOf(res)
  assert.equal(res.body.includes(secret), false, '原始密钥绝不能出现在响应里')
  assert.ok(res.body.includes('[已脱敏'), '应出现脱敏标记')
  assert.deepEqual(body.lessons.map((lesson) => lesson.id), ['lesson-candidate', 'lesson-disputed'])
  assert.equal(body.lessons[0].scopeLabel, '项目 mailer')
  assert.equal(body.lessons[1].scopeLabel, '全局')
  assert.match(body.lessons[0].evidenceSummary, /^独立证据 1 条（已读 1 \/ 仅声明 0）：/)
  assert.equal(body.lessons[0].state, 'candidate')
  assert.equal(body.lessons[1].state, 'disputed')
  assert.deepEqual(body.stats, {
    lessons: 2,
    evidence: 1,
    events: 3,
    byState: { candidate: 1, usable: 0, disputed: 1, stale: 0, rejected: 0 },
    badLines: 0,
  })
  assert.equal(body.evidence.length, 1)
  assert.equal(body.evidence[0].id, 'ev-1')
  assert.equal(body.evidence[0].summary.includes(secret), false, '证据摘要同样必须脱敏')
})

test('知识路由：非 GET → 405 + Allow: GET；非本机 Host / 非回环 → 403，语义与日记路由一致', async () => {
  const { handler } = knowledgeHandlerFor({ journalDir: makeJournal([]), knowledgeStoreFactory: () => fakeKnowledgeStore({}) })
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']) {
    const res = await call(handler, { url: DREAM_KNOWLEDGE_ROUTE, method })
    assert.equal(res.status, 405, method + ' 应被拒绝')
    assert.equal(res.headers.allow, 'GET')
    assert.equal(jsonOf(res).error.code, 'method-not-allowed')
  }
  for (const host of ['evil.example', 'evil.example:4455', '192.168.1.9']) {
    const res = await call(handler, { url: DREAM_KNOWLEDGE_ROUTE, headers: { host } })
    assert.equal(res.status, 403, host + ' 应被拒绝')
    assert.equal(jsonOf(res).error.code, 'forbidden')
  }
  assert.equal((await call(handler, { url: DREAM_KNOWLEDGE_ROUTE, socket: { remoteAddress: '10.0.0.8' } })).status, 403)
})

test('知识路由：知识源抛错 → 500 + { ok:false, error.code:"internal" } 信封', async () => {
  const { handler } = knowledgeHandlerFor({
    journalDir: makeJournal([]),
    knowledgeStoreFactory: () => ({
      listLessons() { throw new Error('disk exploded') },
      listEvidence: () => [],
      stats: () => ({ lessons: 0, evidence: 0, events: 0, byState: {} }),
    }),
  })
  const res = await call(handler, { url: DREAM_KNOWLEDGE_ROUTE })
  assert.equal(res.status, 500)
  const body = jsonOf(res)
  assert.equal(body.ok, false)
  assert.equal(body.error.code, 'internal')
  assert.match(body.error.message, /disk exploded/)
})

test('知识路由：真实 KnowledgeStore 集成 —— 落盘数据可读出，GET 不改动任何文件', async () => {
  const { KnowledgeStore } = await import('../src/knowledge-store.ts')
  const journalDir = makeJournal([])
  const knowledgeDir = join(journalDir, 'knowledge')
  const store = new KnowledgeStore(knowledgeDir)
  store.createLesson({
    kind: 'pitfall',
    title: '池化发送中 close() 不保证终止投递',
    action: '取消后验证连接确实关闭',
    when: '使用 Nodemailer 9.0.5 池化发送并处理 AbortSignal 时',
    exceptions: ['流式发送不受影响'],
    global: true,
    evidence: [{ kind: 'local-artifact', summary: '本机 SMTP 复现：取消后服务器仍收到正文', verification: 'read' }],
  }, 'web-knowledge-integration')
  const beforeSnapshot = snapshotDir(knowledgeDir)
  assert.ok(Object.keys(beforeSnapshot).length > 0, '前置：store 应已落盘')
  const { handler } = knowledgeHandlerFor({ journalDir })
  const res = await call(handler, { url: DREAM_KNOWLEDGE_ROUTE })
  assert.equal(res.status, 200)
  const body = jsonOf(res)
  assert.equal(body.lessons.length, 1)
  assert.ok(['candidate', 'usable'].includes(body.lessons[0].state), 'state 应是合法状态')
  assert.equal(body.lessons[0].scopeLabel, '全局')
  assert.equal(body.lessons[0].title, '池化发送中 close() 不保证终止投递')
  assert.equal(body.lessons[0].when, '使用 Nodemailer 9.0.5 池化发送并处理 AbortSignal 时')
  assert.match(body.lessons[0].evidenceSummary, /独立证据 1 条/)
  assert.equal(body.stats.lessons, 1)
  assert.equal(body.stats.byState[body.lessons[0].state], 1)
  assert.equal(body.stats.badLines, 0, '健康 store 的坏行数为 0')
  assert.deepEqual(snapshotDir(knowledgeDir), beforeSnapshot, 'GET /knowledge 必须零写盘')
})


// ───────────────────────── M2 只读写入记录路由 ─────────────────────────

/** 假写入记录源：只实现 FREEZE-M2 的只读接口。 */
function fakeBridgeReader(records) {
  return { listApplications: () => records ?? [] }
}

test('写入记录路由：bridge 目录不存在 → 200 空记录 + 全零 stats，且 GET 不创建目录（零写盘）', async () => {
  const dir = makeJournal([])
  const bridgeDir = join(dir, 'bridge')
  assert.equal(existsSync(bridgeDir), false, '前置：bridge 目录不存在')
  const { handler } = bridgeHandlerFor({ journalDir: dir })
  const res = await call(handler, { url: DREAM_BRIDGE_ROUTE })
  assert.equal(res.status, 200)
  assert.match(String(res.headers['content-type']), /^application\/json/)
  const body = jsonOf(res)
  assert.deepEqual(Object.keys(body).sort(), ['records', 'stats'])
  assert.deepEqual(body.records, [])
  assert.deepEqual(body.stats, { total: 0, rollbackable: 0 })
  assert.equal(existsSync(bridgeDir), false, '只读路由绝不能在读的时候 mkdir')
})

test('写入记录路由：投影目标 / 时间 / lessonId@revision / 前后哈希 / 可否回滚，敏感串脱敏', async () => {
  const secret = 'sk-abcdefghijklmnopqrstuvwxyz012345'
  const records = [
    {
      backupId: 'brg_1',
      at: '2026-09-29T10:00:00.000Z',
      target: 'E:/proj/AGENTS.md ' + secret,
      action: 'replace',
      lessons: [{ lessonId: 'l1', revision: 3 }, { lessonId: 'l2', revision: 0 }],
      beforeSha256: 'a'.repeat(64),
      afterSha256: 'b'.repeat(64),
      rollbackable: true,
    },
    {
      backupId: 'brg_2',
      at: '2026-09-28T10:00:00.000Z',
      target: 'E:/proj/docs/AGENTS.md',
      action: 'create',
      lessons: [],
      beforeSha256: '',
      afterSha256: 'c'.repeat(64),
      rollbackable: false,
      rollbackReason: '管理块已被外部修改',
    },
  ]
  const { handler } = bridgeHandlerFor({ journalDir: makeJournal([]), bridgeStoreFactory: () => fakeBridgeReader(records) })
  const res = await call(handler, { url: DREAM_BRIDGE_ROUTE })
  assert.equal(res.status, 200)
  assert.equal(res.body.includes(secret), false, '原始密钥不得出现在响应里')
  assert.ok(res.body.includes('[已脱敏'), '应出现脱敏标记')
  const body = jsonOf(res)
  assert.deepEqual(body.records.map((record) => record.backupId), ['brg_1', 'brg_2'])
  assert.equal(body.records[0].action, 'replace')
  assert.deepEqual(body.records[0].lessons, [{ lessonId: 'l1', revision: 3 }, { lessonId: 'l2', revision: 0 }])
  assert.equal(body.records[0].beforeSha256, 'a'.repeat(64))
  assert.equal(body.records[0].afterSha256, 'b'.repeat(64))
  assert.equal(body.records[0].rollbackable, true)
  assert.equal(body.records[0].rollbackReason, undefined)
  assert.equal(body.records[1].rollbackable, false)
  assert.equal(body.records[1].rollbackReason, '管理块已被外部修改')
  assert.deepEqual(body.stats, { total: 2, rollbackable: 1 })
})

test('写入记录路由：legacy 字符串 lesson 引用安全归一，坏行 / 空记录跳过', async () => {
  const records = [
    { backupId: 'brg_legacy', at: '', target: 'AGENTS.md', action: 'append', lessons: ['l1@2', 'l2'], beforeSha256: '', afterSha256: 'd'.repeat(64), rollbackable: false },
    null,
    42,
    { backupId: '', target: '' },
  ]
  const { handler } = bridgeHandlerFor({ journalDir: makeJournal([]), bridgeStoreFactory: () => fakeBridgeReader(records) })
  const body = jsonOf(await call(handler, { url: DREAM_BRIDGE_ROUTE }))
  assert.equal(body.records.length, 1)
  assert.deepEqual(body.records[0].lessons, [{ lessonId: 'l1', revision: 2 }, { lessonId: 'l2', revision: 0 }])
  assert.equal(body.records[0].at, '')
  assert.equal(body.records[0].action, 'append')
  assert.deepEqual(body.stats, { total: 1, rollbackable: 0 })
})

test('写入记录路由：非 GET → 405 + Allow；非本机 Host / 非回环 → 403；reader 抛错 → 500 信封', async () => {
  const { handler } = bridgeHandlerFor({ journalDir: makeJournal([]), bridgeStoreFactory: () => fakeBridgeReader([]) })
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']) {
    const res = await call(handler, { url: DREAM_BRIDGE_ROUTE, method })
    assert.equal(res.status, 405, method + ' 应被拒绝')
    assert.equal(res.headers.allow, 'GET')
    assert.equal(jsonOf(res).error.code, 'method-not-allowed')
  }
  assert.equal((await call(handler, { url: DREAM_BRIDGE_ROUTE, headers: { host: 'evil.example' } })).status, 403)
  assert.equal((await call(handler, { url: DREAM_BRIDGE_ROUTE, socket: { remoteAddress: '10.0.0.9' } })).status, 403)
  const { handler: broken } = bridgeHandlerFor({
    journalDir: makeJournal([]),
    bridgeStoreFactory: () => ({ listApplications() { throw new Error('records exploded') } }),
  })
  const res = await call(broken, { url: DREAM_BRIDGE_ROUTE })
  assert.equal(res.status, 500)
  const body = jsonOf(res)
  assert.equal(body.ok, false)
  assert.equal(body.error.code, 'internal')
  assert.match(body.error.message, /records exploded/)
})


test('写入记录路由：真实 listBridgeApplications 集成 —— records.jsonl + AGENTS.md 管理块可读，GET 零写盘', async () => {
  const journalDir = makeJournal([])
  const bridgeDir = join(journalDir, 'bridge')
  mkdirSync(bridgeDir, { recursive: true })
  const blockText = '<!-- dsh-dream:start -->\n\n## 梦境沉淀（dsh-dream 自动生成）\n\n- l1@0 的经验（0.6.0）\n\n<!-- dsh-dream:end -->'
  const target = join(journalDir, 'AGENTS.md')
  const fileText = '# 项目约定\n\n人工内容保留\n\n' + blockText + '\n'
  writeFileSync(target, fileText, 'utf8')
  const sha = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex')
  const record = {
    schemaVersion: 1,
    backupId: 'brg_test_1',
    at: '2026-09-29T12:00:00.000Z',
    target,
    projectRoot: journalDir,
    action: 'replace',
    before: { exists: true, sha256: sha('old'), size: 3 },
    beforeBlock: '<!-- dsh-dream:start -->旧块<!-- dsh-dream:end -->',
    separator: '\n',
    afterBlockSha256: sha(blockText),
    afterFileSha256: sha(fileText),
    lessons: [{ lessonId: 'l1', revision: 0 }],
    previewId: 'pv_test_1',
  }
  writeFileSync(join(bridgeDir, 'records.jsonl'), JSON.stringify(record) + '\n', 'utf8')
  const beforeSnapshot = snapshotDir(bridgeDir)
  const { handler } = bridgeHandlerFor({ journalDir })
  const res = await call(handler, { url: DREAM_BRIDGE_ROUTE })
  assert.equal(res.status, 200)
  const body = jsonOf(res)
  assert.equal(body.records.length, 1)
  assert.equal(body.records[0].backupId, 'brg_test_1')
  assert.equal(body.records[0].action, 'replace')
  assert.equal(body.records[0].target, target)
  assert.deepEqual(body.records[0].lessons, [{ lessonId: 'l1', revision: 0 }])
  assert.equal(body.records[0].rollbackable, true, '管理块与 afterBlockSha256 一致 → 可回滚')
  assert.equal(body.records[0].afterSha256, sha(fileText))
  assert.deepEqual(body.stats, { total: 1, rollbackable: 1 })
  assert.deepEqual(snapshotDir(bridgeDir), beforeSnapshot, 'GET /bridge 必须零写盘')

  // 外部改动管理块 → 同一记录变为不可回滚且给原因
  writeFileSync(target, fileText.replace('l1@0 的经验（0.6.0）', '被人工改过的经验'), 'utf8')
  const changed = jsonOf(await call(handler, { url: DREAM_BRIDGE_ROUTE }))
  assert.equal(changed.records[0].rollbackable, false)
  assert.equal(changed.records[0].rollbackReason, '管理块已被外部修改')
  assert.deepEqual(changed.stats, { total: 1, rollbackable: 0 })
})
