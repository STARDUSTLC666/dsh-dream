import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { digestSessionFile } from '../lib/index.js'
import { makeSessionFile, makeHeader, makeTextChunksRow, makeToolCallChunksRow } from './helpers.mjs'

const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-packed-'))

test('packed text-chunks 解码：无 assistant/message 时用流式还原兜底', () => {
  const file = join(dir, 'packed.jsonl.zstd')
  writeFileSync(file, makeSessionFile([
    makeHeader('session-packed'),
    makeTextChunksRow(10, ['Deep', 'Se', 'ek Har', 'ness 做梦了']),
  ]))
  const digest = digestSessionFile(file, 5)
  assert.equal(digest.streamTail, 'DeepSeek Harness 做梦了')
  assert.equal(digest.assistantTail.length, 0)
})

test('packed tool-call-chunks 解码：工具足迹还原', () => {
  const file = join(dir, 'packed-tools.jsonl.zstd')
  writeFileSync(file, makeSessionFile([
    makeHeader('session-pt'),
    makeToolCallChunksRow(20, 'run_code', ['{', '"code"', ':', '1}']),
  ]))
  const digest = digestSessionFile(file, 5)
  assert.deepEqual(digest.toolCalls, ['run_code'])
})

test('streamTail 超长时保留尾部 4000 字符', () => {
  const file = join(dir, 'packed-long.jsonl.zstd')
  const big = 'A'.repeat(3000) + 'B'.repeat(3000)
  writeFileSync(file, makeSessionFile([
    makeHeader('session-long'),
    makeTextChunksRow(30, [big]),
  ]))
  const digest = digestSessionFile(file, 5)
  assert.equal(digest.streamTail.length, 4000)
  assert.ok(digest.streamTail.endsWith('B'.repeat(1000)))
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
