import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { saveDream, readDreams, searchDreams } from '../lib/index.js'

const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-journal-'))

test('saveDream 落盘并返回完整条目', () => {
  const entry = saveDream(dir, '用户很在意输入法问题，下次先问重启了没', ['先确认是否重启过应用'], '存疑')
  assert.ok(entry.id.startsWith('dream-'))
  assert.equal(entry.mood, '存疑')
  assert.deepEqual(entry.lessons, ['先确认是否重启过应用'])
})

test('saveDream 空反思抛中文错误', () => {
  assert.throws(() => saveDream(dir, '   ', [], ''), /梦境不能为空/)
})

test('readDreams 倒序读取（新梦在前）', () => {
  saveDream(dir, '第二个梦：用户喜欢组合拳方案', ['优先复用现有资产'], '平静')
  const dreams = readDreams(dir, 10)
  assert.equal(dreams.length, 2)
  assert.match(dreams[0].reflection, /第二个梦/)
})

test('searchDreams 不区分大小写命中 lessons', () => {
  const hits = searchDreams(dir, '重启', 5)
  assert.equal(hits.length, 1)
  assert.match(hits[0].lessons[0], /重启/)
})

test('readDreams limit 钳制且损坏行跳过', () => {
  const limited = readDreams(dir, 1)
  assert.equal(limited.length, 1)
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
