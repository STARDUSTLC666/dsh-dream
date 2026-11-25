/**
 * searchDreams 的全量检索回归测试（R3）：旧实现只看最近 1000 条，
 * 会出现「stats.total 1500、搜索却搜不到老梦」的假搜索。
 *
 * 只用合成临时 JSONL，绝不读真实 ~/.dsh。
 * 使用构建产物，与 npm test 的其余存储回归保持同一模块解析路径。
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dreamStats, readDreams, searchDreams } from '../lib/journal.js'

/** 日记条数：远大于旧实现的 1000 上限。 */
const TOTAL = 1200

const dirs = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

/** 造 TOTAL 条合成梦：下标 0 最旧，下标 TOTAL-1 最新；extras 覆盖指定下标的字段。 */
function makeJournal(extras = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-search-'))
  dirs.push(dir)
  const lines = []
  for (let index = 0; index < TOTAL; index++) {
    const extra = extras[index] ?? {}
    lines.push(JSON.stringify({
      id: 'dream-' + index,
      at: new Date(Date.UTC(2026, 0, 1) + index * 60000).toISOString(),
      reflection: extra.reflection ?? ('第 ' + index + ' 场梦'),
      lessons: extra.lessons ?? [],
      mood: extra.mood ?? '平静',
    }))
  }
  writeFileSync(join(dir, 'dreams.jsonl'), lines.join('\n') + '\n', 'utf8')
  return dir
}

test('超过 1000 条的旧梦也能被搜到（旧实现只扫最近 1000 条）', () => {
  const dir = makeJournal({ 0: { reflection: '最旧的一场梦：先用 远古密码 关掉弹窗', lessons: ['先看 远古密码 文档'] } })
  const hits = searchDreams(dir, '远古密码', 10)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].id, 'dream-0')
})

test('大小写不敏感：reflection 与 lessons 都命中', () => {
  const dir = makeJournal({ 5: { reflection: 'Restart The Daemon next time', lessons: ['Check LOGS first'] } })
  assert.equal(searchDreams(dir, 'restart the daemon', 10)[0]?.id, 'dream-5')
  assert.equal(searchDreams(dir, 'RESTART', 10)[0]?.id, 'dream-5')
  assert.equal(searchDreams(dir, 'check logs', 10)[0]?.id, 'dream-5')
})

test('空查询 = 不过滤：返回最新 limit 条（新梦在前）', () => {
  const dir = makeJournal()
  const hits = searchDreams(dir, '', 3)
  assert.equal(hits.length, 3)
  assert.deepEqual(hits.map((dream) => dream.id), ['dream-1199', 'dream-1198', 'dream-1197'])
})

test('无命中返回空数组，而不是回退成最近 1000 条', () => {
  const dir = makeJournal()
  assert.deepEqual(searchDreams(dir, '这个词不存在', 10), [])
})

test('全量命中时 limit 仍然生效', () => {
  const dir = makeJournal()
  const hits = searchDreams(dir, '场梦', 5)
  assert.equal(hits.length, 5)
  assert.deepEqual(hits.map((dream) => dream.id), ['dream-1199', 'dream-1198', 'dream-1197', 'dream-1196', 'dream-1195'])
})

test('统计逐条聚合且搜索只保留最新命中的 limit 条', () => {
  const dir = makeJournal({
    0: { reflection: 'rare old marker', lessons: ['First spelling'] },
    1199: { reflection: 'rare new marker', lessons: ['first SPELLING'] },
  })
  const stats = dreamStats(dir)
  assert.equal(stats.total, TOTAL)
  assert.equal(stats.topLessons[0].count, 2)
  assert.equal(stats.topLessons[0].lesson, 'first SPELLING')
  assert.equal(stats.topLessons[0].lastAt, new Date(Date.UTC(2026, 0, 1) + 1199 * 60000).toISOString())
  assert.deepEqual(searchDreams(dir, 'marker', 1).map(dream => dream.id), ['dream-1199'])
})

test('检索窗口与 readDreams 全量口径一致（最近 1000 条之外的 dream-199 可见）', () => {
  const dir = makeJournal({ 199: { reflection: '窗口外的梦：关键词 甲虫', lessons: [] } })
  assert.equal(readDreams(dir, 100000).length, TOTAL)
  const hits = searchDreams(dir, '甲虫', 10)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].id, 'dream-199')
  assert.ok(199 < TOTAL - 1000, 'dream-199 必须落在旧窗口（下标 200..1199）之外')
})

test('超过 100000 条时仍读取和统计最新窗口，最新保存记录可搜索', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-search-window-'))
  dirs.push(dir)
  const lines = Array.from({ length: 100001 }, (_, index) => JSON.stringify({
    id: String(index),
    reflection: index === 100000 ? 'newest-marker' : 'old record',
    lessons: index === 0 ? ['outside-window'] : [],
    mood: index === 0 ? 'oldest' : 'current',
  }))
  writeFileSync(join(dir, 'dreams.jsonl'), 'invalid-oldest-row\n' + lines.join('\n') + '\n', 'utf8')
  assert.deepEqual(readDreams(dir, 2).map(row => row.id), ['100000', '99999'])
  assert.deepEqual(searchDreams(dir, 'newest-marker', 1).map(row => row.id), ['100000'])
  const stats = dreamStats(dir)
  assert.equal(stats.total, 100000)
  assert.deepEqual(stats.moods, { current: 100000 })
  assert.equal(stats.topLessons.length, 0)
  assert.equal(stats.skippedLines, 1, '窗口之外的坏行也应继续计数')
})
