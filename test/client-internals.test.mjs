/**
 * lib/client.js 的纯逻辑验收（不依赖浏览器、不依赖 React 运行时）。
 *
 * 面板源码是手写 JS（不经 tsc），但它的排序 / 折叠阈值 / 路径解析 / 数据归一
 * 都是纯函数，已通过 exports.__internals 暴露。这里用 node:vm + 假 React 加载
 * lib/client.js，直接消费这些导出，不再抄第二份算法。
 *
 * 会红的情形：改动 ROUTE（含加回前导斜杠）、折叠阈值（4 行 / 220 字）、
 * 教训榜排序（count → lastAt → 文本）、__internals 的键或形状、
 * loadPrivacy/savePrivacy 的存储键或语义，都会让本文件出现失败断言。
 *
 * 隐私开关：loadPrivacy/savePrivacy 目前不在 __internals 里；T2 在
 * lib/client.js 的 exports.__internals 里补上这两个名字后，本文件最后一条
 * 测试会自动从 skip 变为执行（见文末注释）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

/** 面板源码（lib/ 是发布产物，client.js 手写、不经 tsc）。 */
const CLIENT_FILE = new URL('../lib/client.js', import.meta.url)

function loadClient(globals = {}) {
  const source = readFileSync(CLIENT_FILE, 'utf8')
  let definition = null
  const windowObject = globals.window ?? {}
  windowObject.__ModuleLoader__ = { load(value) { definition = value } }
  const sandbox = { URL, ...globals, window: windowObject }
  const context = vm.createContext(sandbox)
  vm.runInContext(source, context, { filename: 'lib/client.js' })
  assert.ok(definition !== null, 'lib/client.js 顶部必须调用 window.__ModuleLoader__.load')
  const fakeReact = {
    useState(value) { return [typeof value === 'function' ? value() : value, () => {}] },
    useEffect() {},
    createElement() { return null },
  }
  const moduleExports = definition.factory((name) => {
    if (name === 'react') return fakeReact
    throw new Error('意外的 require：' + name)
  })
  return { internals: moduleExports.__internals, exports: moduleExports, sandbox, context }
}

function localIso(year, month, day, hour = 12) {
  return new Date(year, month - 1, day, hour).toISOString()
}

function fakeStorage() {
  const map = new Map()
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null },
    setItem(key, value) { map.set(key, String(value)) },
    removeItem(key) { map.delete(key) },
    clear() { map.clear() },
  }
}

function toHost(value) {
  return JSON.parse(JSON.stringify(value))
}

test('routeUrl()：按 document.baseURI 解析，反代前缀保留、入口不带前导斜杠', () => {
  const { internals } = loadClient({ document: { baseURI: 'http://127.0.0.1:5141/dsh/ui/' } })
  assert.equal(internals.routeUrl(''), 'http://127.0.0.1:5141/dsh/ui/_dsh/dsh-dream/journal')
  assert.equal(
    internals.routeUrl('q=%E6%87%92&limit=5'),
    'http://127.0.0.1:5141/dsh/ui/_dsh/dsh-dream/journal?q=%E6%87%92&limit=5',
  )
  const url = new URL(internals.routeUrl(''))
  assert.equal(url.pathname, '/dsh/ui/_dsh/dsh-dream/journal', '前缀 /dsh/ui/ 不能被吃掉')
  assert.ok(!url.pathname.includes('//'), '相对入口不能以 / 开头（否则反代前缀会被丢掉）')
})

test('routeUrl()：没有 document 时退回相对路径；只有 location 时也能解析', () => {
  const bare = loadClient().internals
  assert.equal(bare.routeUrl('limit=50'), '_dsh/dsh-dream/journal?limit=50')
  assert.ok(!bare.routeUrl('').startsWith('/'), '契约：无前导斜杠')
  const viaLocation = loadClient({ location: { href: 'http://localhost:3000/proxy/' } }).internals
  assert.equal(viaLocation.routeUrl(''), 'http://localhost:3000/proxy/_dsh/dsh-dream/journal')
})

test('isCollapsible()：4 行 / 220 字阈值边界，CRLF 也按行数计', () => {
  const { isCollapsible } = loadClient().internals
  assert.equal(isCollapsible('a\nb\nc\nd'), false, '正好 4 行不折叠')
  assert.equal(isCollapsible('a\nb\nc\nd\ne'), true, '5 行要折叠')
  assert.equal(isCollapsible('a\r\nb\r\nc\r\nd\r\ne'), true, 'CRLF 仍算 5 行')
  assert.equal(isCollapsible('x'.repeat(220)), false, '正好 220 字不折叠')
  assert.equal(isCollapsible('x'.repeat(221)), true, '221 字要折叠')
  assert.equal(isCollapsible(''), false)
  assert.equal(isCollapsible('x'.repeat(221) + '\ny'), true, '任一条件超限即折叠')
})

test('normalizeDreams()：丢弃空反思、空心境回退平静、按时间倒序并尊重 limit', () => {
  const { normalizeDreams } = loadClient().internals
  const out = normalizeDreams([
    { id: 'old', at: localIso(2026, 1, 1), reflection: '老梦', lessons: ['a'], mood: '' },
    { id: 'new', at: localIso(2026, 9, 1), reflection: '新梦', lessons: [], mood: '清醒' },
    { id: 'bad', at: localIso(2026, 9, 2), reflection: '' },
  ], 10)
  assert.deepEqual(Array.from(out, (dream) => dream.id), ['new', 'old'])
  assert.equal(out[1].mood, '平静')
  assert.equal(normalizeDreams(out, 1).length, 1)
  assert.deepEqual(toHost(normalizeDreams(null, 10)), [])
})

test('教训榜排序：count 降序 → lastAt 降序 → 文本；lastAt 缺失才降级按本页现算', () => {
  const { normalizeStats, viewModelOf } = loadClient().internals
  const dreams = [
    { id: 'd3', at: localIso(2026, 9, 28), reflection: 'r3', lessons: ['重启'], mood: '平静' },
    { id: 'd2', at: localIso(2026, 9, 27), reflection: 'r2', lessons: ['重启'], mood: '平静' },
    { id: 'd1', at: localIso(2026, 9, 1), reflection: 'r1', lessons: ['看日志'], mood: '清醒' },
  ]
  const rawStats = {
    total: 3,
    moods: { 平静: 2, 清醒: 1 },
    topLessons: [
      { lesson: '重启', count: 2, lastAt: localIso(2026, 9, 28) },
      { lesson: '看日志', count: 2, lastAt: '' },
      { lesson: '归档', count: 3, lastAt: localIso(2026, 9, 1) },
      { lesson: '只出现一次', count: 1, lastAt: '' },
    ],
  }
  const model = viewModelOf(dreams, normalizeStats(rawStats, dreams), new Date(2026, 8, 29, 12))
  assert.deepEqual(
    Array.from(model.lessonRows, (row) => row.lesson),
    ['归档', '重启', '看日志', '只出现一次'],
    'count 3 第一；两个 count 2 里 lastAt 新的在前；lastAt 缺失排在同次数末尾',
  )
  assert.equal(model.lessonRows[1].lastText, '最近 昨天', 'lastAt 正常时按服务端时间显示')
  assert.ok(model.lessonRows[2].lastText.startsWith('本页内最近 '), 'lastAt 缺失时明确标注是页内现算')
  assert.equal(model.lessonRows[3].lastText, '', '没有 lastAt 且本页无该教训时不给假时间')
})

test('教训行装饰：count≥2 才画进度条、count≥3 才是桥接候选、count=1 无 KPI', () => {
  const { normalizeStats, viewModelOf } = loadClient().internals
  const dreams = [{ id: 'd1', at: localIso(2026, 9, 1), reflection: 'r1', lessons: ['a', 'b', 'c'], mood: '平静' }]
  const stats = normalizeStats({
    total: 1,
    moods: { 平静: 1 },
    topLessons: [
      { lesson: '出现三次', count: 3, lastAt: localIso(2026, 9, 1) },
      { lesson: '出现两次', count: 2, lastAt: localIso(2026, 9, 1) },
      { lesson: '出现一次', count: 1, lastAt: localIso(2026, 9, 1) },
    ],
  }, dreams)
  const rows = viewModelOf(dreams, stats, new Date(2026, 8, 29, 12)).lessonRows
  assert.equal(rows[0].candidate, true)
  assert.equal(rows[1].candidate, false)
  assert.equal(rows[2].candidate, false)
  assert.equal(rows[0].showBar, true)
  assert.equal(rows[1].showBar, true)
  assert.equal(rows[2].showBar, false, 'count=1 不画进度条（避免假精度）')
})

test('心境聚合：Record 归一为数组、按场数排序；统计缺失时按当前页现算', () => {
  const { normalizeStats } = loadClient().internals
  const dreams = [
    { id: 'd2', at: localIso(2026, 9, 28), reflection: 'r2', lessons: [], mood: '平静' },
    { id: 'd1', at: localIso(2026, 9, 27), reflection: 'r1', lessons: [], mood: '清醒' },
  ]
  const normalized = normalizeStats({ total: 2, moods: { 平静: 1, 清醒: 1, '': 1 }, topLessons: [] }, dreams)
  assert.deepEqual(toHost(normalized.moods), [{ mood: '平静', count: 1 }, { mood: '清醒', count: 1 }])
  const fallback = normalizeStats(null, dreams)
  assert.deepEqual(toHost(fallback.moods), [{ mood: '平静', count: 1 }, { mood: '清醒', count: 1 }])
})

test('N=1 是正式态：专用标题、不渲染概览磁贴、方块序列不为空', () => {
  const { normalizeStats, viewModelOf } = loadClient().internals
  const single = [{ id: 'd1', at: localIso(2026, 9, 28), reflection: '第一场梦', lessons: ['一条教训'], mood: '平静' }]
  const model = viewModelOf(single, normalizeStats({ total: 1, moods: { 平静: 1 }, topLessons: [] }, single), new Date(2026, 8, 29, 12))
  assert.equal(model.showTiles, false, '单条不摆一排 0 值磁贴')
  assert.equal(model.blocks.length, 1, '心境方块单条也要有一个')
  assert.equal(model.headline, '第 1 场梦 · 2026-09-28 · 心境「平静」', '不出现“跨度 0 天”')
})

test('moodSlot()/toneClass()：槽位稳定、只在 0..3，tone 0 用默认色', () => {
  const { moodSlot, toneClass } = loadClient().internals
  for (const mood of ['平静', '清醒', '存疑', '']) {
    const slot = moodSlot(mood)
    assert.ok(Number.isInteger(slot) && slot >= 0 && slot < 4, mood + ' -> ' + slot)
  }
  assert.equal(moodSlot('平静'), moodSlot('平静'))
  assert.equal(toneClass(0), '')
  assert.equal(toneClass(1), 'dshd-tone-1')
  assert.equal(toneClass(2), 'dshd-tone-2')
  assert.equal(toneClass(3), 'dshd-tone-3')
})

const privacyClient = loadClient({ window: { localStorage: fakeStorage() } })
const privacyStorage = privacyClient.sandbox.window.localStorage

test('隐私开关：loadPrivacy()/savePrivacy() 往返，且存储键仍是 dsh-dream:privacy', {
  skip: privacyClient.internals.loadPrivacy === undefined
    ? '需要 T2 在 __internals 导出 loadPrivacy/savePrivacy'
    : false,
}, () => {
  const { loadPrivacy, savePrivacy } = privacyClient.internals
  assert.equal(loadPrivacy(), false, '没存过就是关')
  savePrivacy(true)
  assert.equal(privacyStorage.getItem('dsh-dream:privacy'), '1')
  assert.equal(loadPrivacy(), true)
  savePrivacy(false)
  assert.equal(privacyStorage.getItem('dsh-dream:privacy'), '0')
  assert.equal(loadPrivacy(), false)
})
