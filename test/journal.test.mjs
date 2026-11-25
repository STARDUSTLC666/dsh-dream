import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { saveDream, readDreams, readDreamsDetailed, searchDreams } from '../lib/index.js'

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

test('readDreams streams JSONL and keeps only the newest requested records', t => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-dream-journal-stream-'))
  const file = join(root, 'dreams.jsonl')
  writeFileSync(file, Array.from({ length: 5000 }, (_, index) => JSON.stringify({ id: String(index), reflection: 'entry ' + index })).join('\n') + '\n')
  const original = fs.readFileSync
  t.mock.method(fs, 'readFileSync', function (path, ...args) {
    if (String(path) === file) throw new Error('journal must be scanned in chunks')
    return original.call(this, path, ...args)
  })
  syncBuiltinESMExports()
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); rmSync(root, { recursive: true, force: true }) })
  const result = readDreamsDetailed(root, 3)
  assert.deepEqual(result.dreams.map(row => row.id), ['4999', '4998', '4997'])
  assert.equal(result.skippedLines, 0)
})

test('oversized journal rows are reported and saveDream rejects records the reader cannot retain', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-dream-journal-size-'))
  try {
    writeFileSync(join(root, 'dreams.jsonl'), JSON.stringify({ id: 'old', reflection: 'x'.repeat(1024 * 1024 + 1) }) + '\n' + JSON.stringify({ id: 'new', reflection: 'readable' }) + '\n')
    const result = readDreamsDetailed(root, 10)
    assert.deepEqual(result.dreams.map(row => row.id), ['new'])
    assert.equal(result.skippedLines, 1)
    assert.throws(() => saveDream(root, 'x'.repeat(1024 * 1024), [], ''), /不能超过 1 MiB/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('reverse chunk scanning preserves UTF-8, BOM, CRLF and an unfinished final line', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-dream-journal-utf8-'))
  try {
    const rows = [
      { id: 'old', reflection: '旧梦：鲸鱼', lessons: ['星光'] },
      { id: 'new', reflection: '新梦：' + '海'.repeat(30000) },
    ]
    writeFileSync(join(root, 'dreams.jsonl'), '\uFEFF' + rows.map(row => JSON.stringify(row)).join('\r\n'))
    const result = readDreamsDetailed(root, 2)
    assert.deepEqual(result.dreams.map(row => row.id), ['new', 'old'])
    assert.equal(result.dreams[0].reflection, rows[1].reflection)
    assert.equal(result.dreams[1].reflection, rows[0].reflection)
    assert.equal(result.skippedLines, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
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

test('saving after a truncated journal record preserves the newly confirmed dream', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-dream-journal-partial-'))
  try {
    const before = saveDream(root, 'Before interruption', [], '')
    writeFileSync(join(root, 'dreams.jsonl'), '{"reflection":"unfinished', { flag: 'a' })
    const saved = saveDream(root, 'After interruption', ['Keep this lesson'], '')
    assert.deepEqual(readDreams(root, 10).map(row => row.id), [saved.id, before.id])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
