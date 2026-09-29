/**
 * dsh-dream 网页端（src/web.ts）的宿主侧契约测试。
 *
 * 假 ctx + 假 webServer 捕获 handler，直接验证 HTTP 语义与 JSON 契约：
 * 空日记 / 新梦在前 / 正文与教训不丢 / q 真过滤 / limit 边界 /
 * 非 GET 405 / 非本机 Host 403 / 可 JSON 序列化。
 *
 * src/web.ts 内部按 NodeNext 规范用 './journal.js' 指向同目录源文件；
 * 直接 node --test 时没有 tsc，所以这里注册一个同步 resolve 钩子，
 * 把 src 下不存在的 .js 说明符补成 .ts，从而不需要先构建 lib/。
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

/** 挂载并取出 handler。 */
function handlerFor(options) {
  const mounted = mount(options)
  assert.equal(mounted.injected.length, 1)
  assert.equal(mounted.routes.length, 1)
  return { ...mounted, handler: mounted.routes[0].route.handler }
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

test('DREAM_ROUTE 与安装方式：ctx.inject(["webServer"]) + effect 注册 exact 路由', () => {
  assert.equal(DREAM_ROUTE, '/_dsh/dsh-dream/journal')
  const mounted = mount({ journalDir: makeJournal([]) })
  assert.deepEqual(mounted.injected, [['webServer']])
  assert.equal(mounted.effects.length, 1)
  assert.equal(mounted.effects[0].label, 'dsh-dream: web routes')
  const { route, description } = mounted.routes[0]
  assert.equal(route.kind, 'exact')
  assert.equal(route.path, DREAM_ROUTE)
  assert.equal(typeof route.handler, 'function')
  assert.equal(description, 'dsh-dream: dream journal route')
})

test('effect 的 disposer 触发后路由被摘掉', () => {
  const mounted = mount({ journalDir: makeJournal([]) })
  assert.equal(mounted.routes.length, 1)
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
  assert.deepEqual(body.stats, { total: 0, moods: {}, topLessons: [] })
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
  assert.deepEqual(injected, [['webServer']])
  assert.equal(routes.length, 1)
  assert.equal(routes[0].kind, 'exact')
  assert.equal(routes[0].path, DREAM_ROUTE)
  const body = jsonOf(await call(routes[0].handler))
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
