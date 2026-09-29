/**
 * searchDreams 的全量检索回归测试（R3）：旧实现只看最近 1000 条，
 * 会出现「stats.total 1500、搜索却搜不到老梦」的假搜索。
 *
 * 只用合成临时 JSONL，绝不读真实 ~/.dsh。
 * journal.ts 没有相对导入，node --test 可直接加载源文件，无需先构建 lib/。
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readDreams, searchDreams } from '../src/journal.ts'

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

test('检索窗口与 readDreams 全量口径一致（最近 1000 条之外的 dream-199 可见）', () => {
  const dir = makeJournal({ 199: { reflection: '窗口外的梦：关键词 甲虫', lessons: [] } })
  assert.equal(readDreams(dir, 100000).length, TOTAL)
  const hits = searchDreams(dir, '甲虫', 10)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].id, 'dream-199')
  assert.ok(199 < TOTAL - 1000, 'dream-199 必须落在旧窗口（下标 200..1199）之外')
})
