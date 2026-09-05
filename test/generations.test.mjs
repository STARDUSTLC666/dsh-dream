import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildDreamTools, digestSessionFile, listSessionFiles, resolveConfig } from '../lib/index.js'
import { makeEvent, makeHeader, makeSessionFile } from './helpers.mjs'

function temporary(t) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-generations-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test('migration keeps only the newest canonical generation per session', (t) => {
  const root = temporary(t)
  const dir = join(root, 'project', 'session')
  mkdirSync(dir, { recursive: true })
  for (const name of ['session.jsonl.zstd', 'session.v1.jsonl.zstd', 'session.v2.jsonl.zstd', 'session.v02.jsonl.zstd', 'session.v3.jsonl.zstd.tmp']) {
    writeFileSync(join(dir, name), makeSessionFile([makeHeader('session', { version: 2, isSeeded: false })]))
  }
  const future = new Date(Date.now() + 100000)
  utimesSync(join(dir, 'session.jsonl.zstd'), future, future)
  assert.deepEqual(listSessionFiles(root, 10), [join(dir, 'session.v2.jsonl.zstd')])
  assert.deepEqual(listSessionFiles(root, -1), [])
})

test('v2 embedded attempts preserve text and tool traces while omitting reasoning', (t) => {
  const root = temporary(t)
  const file = join(root, 'session.v2.jsonl.zstd')
  writeFileSync(file, makeSessionFile([
    makeHeader('attempt', { version: 2, isSeeded: false }),
    makeEvent('turn/start', 0, { turn: 1 }),
    makeEvent('user/message', 1, { message: { content: [{ type: 'text', text: 'continue the investigation' }] } }),
    makeEvent('assistant/attempt', 2, { turn: 1, step: 1, stream: [
      { type: 'reasoning-chunks', time0: 1, index: 0, dt: [], texts: ['private reasoning'] },
      { type: 'text-chunks', time0: 2, index: 1, dt: [0], texts: ['partial ', 'answer'] },
      { type: 'tool-call-chunks', time0: 3, index: 2, id: 'call_1', dt: [], name: 'bash', args: ['{}'] },
      { type: 'chunk', time: 4, chunk: { type: 'text-delta', index: 1, text: ' tail' } },
    ] }),
  ]))
  const digest = digestSessionFile(file, 5)
  assert.equal(digest.streamTail, 'partial answer tail')
  assert.deepEqual(digest.toolCalls, ['bash'])
  assert.deepEqual(digest.userMessages, ['continue the investigation'])
  assert.equal(JSON.stringify(digest).includes('private reasoning'), false)
})

test('dream_digest discovers plaintext v2 sessions and reads nested final messages', async (t) => {
  const root = temporary(t)
  const dir = join(root, 'project', 'plain')
  mkdirSync(dir, { recursive: true })
  const lines = [
    makeHeader('plain', { version: 2, isSeeded: false }),
    makeEvent('session/title', 0, 'new session'),
    makeEvent('turn/start', 1, { turn: 1 }),
    makeEvent('assistant/message', 2, {
      message: { content: [{ type: 'text', text: 'final response' }] },
      stream: [{ type: 'text-chunks', time0: 1, index: 0, dt: [], texts: ['stream response'] }],
    }),
  ]
  writeFileSync(join(dir, 'session.v2.jsonl'), lines.join('\n') + '\n')
  const cfg = resolveConfig({ sessionsRoot: root, journalDir: join(root, 'journal') })
  const tool = buildDreamTools(cfg).find((entry) => entry.name === 'dream_digest')
  const value = await tool.execute({})
  assert.equal(value.count, 1)
  assert.equal(value.sessions[0].id, 'plain')
  assert.deepEqual(value.sessions[0].assistantTail, ['final response'])
  assert.match(value.sessions[0].digestText, /final response/)
})

test('v1 assistant/chunk remains readable and damaged rows are skipped', (t) => {
  const root = temporary(t)
  const file = join(root, 'session.v1.jsonl')
  writeFileSync(file, [
    makeHeader('v1', { version: 1, isSeeded: false }),
    'null',
    '{broken json',
    makeEvent('assistant/chunk', 0, { chunk: { type: 'text-delta', index: 0, text: 'old stream' } }),
  ].join('\n'))
  assert.equal(digestSessionFile(file, 5).streamTail, 'old stream')
})

test('default data directories follow DSH_HOME and explicit paths still win', () => {
  const dshHome = join(tmpdir(), 'isolated-dsh')
  assert.equal(resolveConfig({}, { DSH_HOME: dshHome }).sessionsRoot, join(dshHome, 'sessions'))
  assert.equal(resolveConfig({}, { DSH_HOME: dshHome }).journalDir, join(dshHome, '.dsh-dream'))
  assert.equal(resolveConfig({ sessionsRoot: 'custom-sessions' }, { DSH_HOME: dshHome }).sessionsRoot, 'custom-sessions')
})
