import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { decompressAll, frameRanges, digestSessionFile, listSessionFiles } from '../lib/index.js'
import { makeSessionFile, makeMainSessionLines, makeHeader, makeEvent } from './helpers.mjs'

const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-test-'))

test('frameRanges + decompressAll：多帧拼接完整还原', () => {
  const buf = makeSessionFile(['{"a":1}', '{"b":2}', '{"c":3}'])
  assert.equal(frameRanges(buf).length, 3)
  assert.equal(decompressAll(buf), '{"a":1}\n{"b":2}\n{"c":3}\n')
})

test('digestSessionFile：标题/轮数/用户消息/助手尾段/工具足迹', () => {
  const file = join(dir, 'main.jsonl.zstd')
  writeFileSync(file, makeSessionFile(makeMainSessionLines('session-main')))
  const digest = digestSessionFile(file, 5)
  assert.equal(digest.title, '帮我修输入法的会话')
  assert.equal(digest.turns, 2)
  assert.deepEqual(digest.userMessages, ['打不出中文了', '还是不行'])
  assert.equal(digest.assistantTail.length, 2)
  assert.deepEqual(digest.toolCalls, ['bash'])
  assert.equal(digest.origin, '')
})

test('digestSessionFile：子代理会话可通过 origin 识别', () => {
  const file = join(dir, 'sub.jsonl.zstd')
  writeFileSync(file, makeSessionFile([makeHeader('sub-1', { origin: 'subagent', delegationDepth: 1 })]))
  const digest = digestSessionFile(file, 5)
  assert.equal(digest.origin, 'subagent')
})

test('digestSessionFile：损坏/缺失文件返回 null 不抛错', () => {
  assert.equal(digestSessionFile(join(dir, 'nope.jsonl.zstd'), 5), null)
  const bad = join(dir, 'bad.jsonl.zstd')
  writeFileSync(bad, Buffer.from([1, 2, 3, 4, 5]))
  assert.equal(digestSessionFile(bad, 5), null)
})

test('digestSessionFile：0.1.2 ContentBlock 数组载荷仍能提取文本', () => {
  const file = join(dir, 'blocks.jsonl.zstd')
  writeFileSync(file, makeSessionFile([
    makeHeader('session-blocks'),
    makeEvent('turn/start', 1, {}),
    makeEvent('user/message', 2, { content: [{ type: 'text', text: '帮我看看这个报错' }, { type: 'image', source: 'x' }] }),
    makeEvent('assistant/message', 3, { message: { content: [{ type: 'text', text: '这是空指针' }] } }),
    makeEvent('turn/end', 4, {}),
  ]))
  const digest = digestSessionFile(file, 5)
  assert.deepEqual(digest.userMessages, ['帮我看看这个报错'])
  assert.deepEqual(digest.assistantTail, ['这是空指针'])
})

test('listSessionFiles：按修改时间倒序 + limit 钳制', () => {
  const root = join(dir, 'sessions', '--demo--')
  for (const id of ['s1', 's2', 's3']) {
    mkdirSync(join(root, id), { recursive: true })
    writeFileSync(join(root, id, 'session.jsonl.zstd'), makeSessionFile([makeHeader(id)]))
  }
  const files = listSessionFiles(join(dir, 'sessions'), 2)
  assert.equal(files.length, 2)
  assert.ok(files.every((f) => f.endsWith('session.jsonl.zstd')))
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
