/**
 * 旧行为不变基线（FREEZE 前提 2/3）：旧日记只读兼容 + 既有六工具输出字段只增不减。
 *
 * 基线 golden（0.5.0 / git HEAD 生成）：test/fixtures/legacy-tool-keys.json。
 * 规则：golden 里的每个键路径必须仍存在（只增不减）；journal/recall/bridge 的稳定值
 * 必须逐字节一致；只读工具不得写盘；dream_save 只能在原文件后追加恰好一行。
 *
 * BOM 丢数据与 moods 键污染（__proto__/constructor）属 lead 已修项，纳入回归断言：
 * BOM 文件必须读全；moods 的每个值都必须是 number。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { KnowledgeStore } from '../lib/knowledge-store.js'
import { dreamStats, readDreamsDetailed, saveDream } from '../lib/journal.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const GOLDEN = JSON.parse(readFileSync(join(root, 'test', 'fixtures', 'legacy-tool-keys.json'), 'utf8'))

const EOL = '\n'
const dreamLine = (id, day, reflection, lessons, mood, extra = {}) => JSON.stringify({
  id, at: '2026-01-' + String(day).padStart(2, '0') + 'T00:00:00.000Z', reflection, lessons, ...(mood === undefined ? {} : { mood }), ...extra,
})

/** 旧日记夹具：坏行 + CRLF + 超长 + 无尾换行 + 未知字段 + 缺 mood。 */
function writeLegacyJournal(dir) {
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'dreams.jsonl')
  const text = [
    dreamLine('d1', 1, '旧梦一：重启应用', ['先重启'], '平静') + EOL,
    dreamLine('d2', 2, '旧梦二：查看日志', ['看日志'], '清醒', { schemaVersion: 9, futureField: { x: 1 } }) + '\r' + EOL,
    dreamLine('d3', 3, '超长梦 ' + 'x'.repeat(50000), [], undefined) + EOL,
    '{"id":"d4","at":"2026-01-04T00:00:00.000Z","reflection":"坏行半截' + EOL,
    dreamLine('d5', 5, '旧梦五：没有尾换行', ['无尾'], '存疑'),
  ].join('')
  writeFileSync(file, text, 'utf8')
  return file
}

function snapshot(dir) {
  const rows = []
  if (!existsSync(dir)) return rows
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name)
      if (entry.isDirectory()) walk(full)
      else rows.push([relative(dir, full).replace(/\\/g, '/'), readFileSync(full, 'utf8'), statSync(full).mtimeMs])
    }
  }
  walk(dir)
  return rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
}

function keyPaths(value, prefix = '') {
  if (Array.isArray(value)) {
    const out = [prefix + '[]']
    for (const item of value) out.push(...keyPaths(item, prefix + '[]'))
    return out
  }
  if (value !== null && typeof value === 'object') {
    const out = [prefix + ':object']
    for (const key of Object.keys(value).sort()) out.push(...keyPaths(value[key], prefix + '.' + key))
    return out
  }
  return [prefix + ':' + typeof value]
}

const scrub = (value, dir) => JSON.parse(JSON.stringify(value).split(dir.replace(/\\/g, '\\\\')).join('<TMP>').split(dir).join('<TMP>'))

/** 只增不减判定：golden 的每个键/值都必须在 current 里原样存在（允许 current 多字段）。 */
function assertSuperset(goldenValue, currentValue, path) {
  if (Array.isArray(goldenValue)) {
    assert.ok(Array.isArray(currentValue) && currentValue.length >= goldenValue.length, path + ' 数组长度缩水')
    goldenValue.forEach((item, index) => assertSuperset(item, currentValue[index], path + '[' + index + ']'))
    return
  }
  if (goldenValue !== null && typeof goldenValue === 'object') {
    assert.ok(currentValue !== null && typeof currentValue === 'object' && !Array.isArray(currentValue), path + ' 类型变化')
    for (const key of Object.keys(goldenValue)) {
      assert.ok(Object.hasOwn(currentValue, key), path + '.' + key + ' 丢失')
      assertSuperset(goldenValue[key], currentValue[key], path + '.' + key)
    }
    return
  }
  assert.deepEqual(currentValue, goldenValue, path + ' 稳定值变化')
}

function makeEnv() {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-legacy-'))
  const journalDir = join(dir, 'journal')
  const sessionsRoot = join(dir, 'sessions')
  mkdirSync(sessionsRoot, { recursive: true })
  writeLegacyJournal(journalDir)
  const cfg = resolveConfig({ sessionsRoot, journalDir })
  return { dir, journalDir, cfg, tools: buildDreamTools(cfg) }
}
const exec = async (tools, name, args) => await tools.find((tool) => tool.name === name).execute(args)

test('旧日记：坏行跳过，未知字段/CRLF/超长/无尾换行按原格式读取', () => {
  const env = makeEnv()
  try {
    const { dreams, skippedLines } = readDreamsDetailed(env.journalDir, 10)
    assert.equal(dreams.length, 4)
    assert.equal(skippedLines, 1, '坏行必须被计数而不是静默吞掉')
    assert.deepEqual(dreams.map((item) => item.id), ['d5', 'd3', 'd2', 'd1'])
    for (const item of dreams) {
      assert.deepEqual(Object.keys(item).sort(), ['at', 'id', 'lessons', 'mood', 'reflection'], '旧 DreamEntry 字段不得增减')
    }
    assert.equal(dreams.find((item) => item.id === 'd5').mood, '存疑')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('已修项：BOM 文件必须读全；moods 每个值都必须是 number', () => {
  const env = makeEnv()
  try {
    const bomDir = join(env.dir, 'bom')
    mkdirSync(bomDir, { recursive: true })
    writeFileSync(join(bomDir, 'dreams.jsonl'), '\uFEFF' + dreamLine('b1', 1, 'BOM 梦一', ['a'], '平静') + EOL + dreamLine('b2', 2, 'BOM 梦二', ['b'], '清醒') + EOL, 'utf8')
    assert.deepEqual(readDreamsDetailed(bomDir, 10).dreams.map((item) => item.id).sort(), ['b1', 'b2'], 'BOM 不得再吃掉第一行')

    const moodsDir = join(env.dir, 'moods')
    saveDream(moodsDir, '梦一', ['a'], '__proto__')
    saveDream(moodsDir, '梦二', ['b'], 'constructor')
    saveDream(moodsDir, '梦三', ['c'], '平静')
    const { moods } = dreamStats(moodsDir)
    assert.deepEqual(Object.keys(moods).sort(), ['__proto__', 'constructor', '平静'])
    for (const [key, value] of Object.entries(moods)) assert.equal(typeof value, 'number', key + ' 的计数必须是 number')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('六工具只增不减：读工具零写入，dream_save 只追加一行，字段与稳定值不丢', async () => {
  const env = makeEnv()
  try {
    const before = snapshot(env.journalDir)
    const journal = await exec(env.tools, 'dream_journal', { limit: 10 })
    const recall = await exec(env.tools, 'dream_recall', { query: '日志' })
    const health = await exec(env.tools, 'dream_health', {})
    const digest = await exec(env.tools, 'dream_digest', { maxSessions: 1, mode: 'brief' })
    const context = await exec(env.tools, 'dream_context', { query: 'SQLite' })
    assert.deepEqual(snapshot(env.journalDir), before, '只读工具不得写盘')
    assert.equal(existsSync(join(env.journalDir, 'knowledge')), false, 'dream_context 不得创建知识目录')

    assert.equal(journal.count, 4)
    assert.deepEqual(recall.dreams.map((item) => item.id), ['d2'])
    assert.equal(health.ok, true)
    assert.equal(typeof digest.count, 'number')
    assert.deepEqual(context.items, [])

    const original = readFileSync(join(env.journalDir, 'dreams.jsonl'))
    const saved = await exec(env.tools, 'dream_save', { reflection: '新梦一条', lessons: ['新教训'], mood: '清醒' })
    const after = readFileSync(join(env.journalDir, 'dreams.jsonl'))
    const appended = after.subarray(original.length).toString('utf8')
    assert.equal(Buffer.compare(after.subarray(0, original.length), original), 0, 'dream_save 不得重写旧字节')
    assert.equal(appended.split('\n').filter((line) => line !== '').length, 1, 'dream_save 只能追加一行')
    assert.deepEqual(Object.keys(JSON.parse(appended.trim())).sort(), ['at', 'id', 'lessons', 'mood', 'reflection'])

    const agents = join(env.dir, 'AGENTS.md')
    const bridge = await exec(env.tools, 'dream_bridge', { path: agents, maxLessons: 10 })
    const agentsText = readFileSync(agents, 'utf8')
    assert.equal(bridge.action, 'created')
    assert.match(agentsText, /<!-- dsh-dream:lessons:start/)
    assert.match(agentsText, /<!-- dsh-dream:lessons:end -->/)

    const current = {
      journal: scrub(journal, env.dir),
      recall: scrub(recall, env.dir),
      health: scrub(health, env.dir),
      digest: scrub(digest, env.dir),
      dreamSaveKeys: Object.keys(saved).sort(),
      bridge: { action: bridge.action, lessonsCount: bridge.lessonsCount, file: agentsText },
      context: { items: context.items, budget: context.budget },
    }
    const currentPaths = new Set(keyPaths(current))
    const missing = keyPaths(GOLDEN.stable).filter((path) => !currentPaths.has(path))
    assert.deepEqual(missing, [], '旧输出键路径只增不减，缺失：' + missing.join(', '))
    assertSuperset(GOLDEN.stable.journal, current.journal, 'journal')
    assertSuperset(GOLDEN.stable.recall, current.recall, 'recall')
    assert.deepEqual(current.bridge, GOLDEN.stable.bridge, 'dream_bridge 稳定值不得变')
    for (const key of GOLDEN.stable.dreamSaveKeys) assert.ok(current.dreamSaveKeys.includes(key), 'dream_save 输出字段减少：' + key)
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('R6：未知 schema 单列 unsupportedVersions，孤儿 update 单列 orphanEvents，坏行仍归 badLines', () => {
  const env = makeEnv()
  try {
    const knowledgeDir = join(env.dir, 'knowledge-r6')
    mkdirSync(knowledgeDir, { recursive: true })
    writeFileSync(join(knowledgeDir, 'events.jsonl'), [
      JSON.stringify({ schemaVersion: 2, id: 'evt_future', at: '2026-01-01T00:00:00.000Z', kind: 'lesson.create', lessonId: 'l1', idempotencyKey: 'k1', payload: {} }),
      JSON.stringify({ schemaVersion: 1, id: 'evt_orphan', at: '2026-01-01T00:00:01.000Z', kind: 'lesson.update', lessonId: 'missing', revision: 2, idempotencyKey: 'k2', payload: { title: 'x' } }),
      'not json at all',
    ].join('\n') + '\n', 'utf8')
    const stats = new KnowledgeStore(knowledgeDir).stats()
    assert.equal(stats.unsupportedVersions, 1, 'schemaVersion 非 1 必须单列计数')
    assert.equal(stats.orphanEvents, 1, '找不到 previous 的 update 必须单列计数')
    assert.equal(stats.badLines, 1, '真正坏行仍归 badLines')
    assert.equal(typeof stats.firstReplayedEventId, 'string', '必须有首个回放事件 id 以便解释截断')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})
