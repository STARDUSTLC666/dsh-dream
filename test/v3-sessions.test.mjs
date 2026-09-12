import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildDreamTools, digestSessionFile, listSessionFiles, resolveConfig } from '../lib/index.js'
import { makeEvent, makeHeader, makeSessionFile } from './helpers.mjs'

function temporary(t) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-dream-v3-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

test('dream_digest reads the committed v3 successor instead of a newer-mtime v2 predecessor', async (t) => {
  const root = temporary(t)
  const directory = join(root, 'project', 'migrated')
  mkdirSync(directory, { recursive: true })
  const oldFile = join(directory, 'session.v2.jsonl')
  const currentFile = join(directory, 'session.v3.jsonl.zstd')
  writeFileSync(oldFile, [makeHeader('migrated', { version: 2, isSeeded: false }), makeEvent('user/message', 0, { content: [{ type: 'text', text: 'old request' }] })].join('\n'))
  writeFileSync(currentFile, makeSessionFile([
    makeHeader('migrated', { version: 3, isSeeded: false, agentPreset: 'ptc' }),
    makeEvent('turn/start', 0, { turn: 1 }),
    makeEvent('user/message', 1, { content: [{ type: 'text', text: 'current request' }] }),
    makeEvent('assistant/message', 2, { message: { content: [{ type: 'text', text: 'current answer' }] } }),
  ]))
  const future = new Date(Date.now() + 100000)
  utimesSync(oldFile, future, future)
  assert.deepEqual(listSessionFiles(root, 10), [currentFile])
  const config = resolveConfig({ sessionsRoot: root, journalDir: join(root, 'journal') })
  const result = await buildDreamTools(config).find(tool => tool.name === 'dream_digest').execute({})
  assert.equal(result.count, 1)
  assert.deepEqual(result.sessions[0].userMessages, ['current request'])
  assert.deepEqual(result.sessions[0].assistantTail, ['current answer'])
})

for (const [version, namespace] of [[2, 'code'], [3, 'ptc']]) {
  for (const compressed of [false, true]) {
    test(`v${version} ${compressed ? 'zstd' : 'plaintext'} retains PTC tool names once and omits system and reasoning content`, (t) => {
      const root = temporary(t)
      const file = join(root, `session.v${version}.jsonl${compressed ? '.zstd' : ''}`)
      const lines = [
        makeHeader('ptc-traces', { version, isSeeded: false, agentPreset: 'ptc-minimal' }),
        makeEvent('turn/start', 0, { turn: 1 }),
        makeEvent('system/message', 1, { content: [{ type: 'text', text: 'private system policy' }] }),
        makeEvent('assistant/attempt', 2, { turn: 1, step: 1, stream: [
          { type: 'reasoning-chunks', time0: 1, index: 0, dt: [], texts: ['private reasoning'] },
          { type: 'text-chunks', time0: 2, index: 1, dt: [0], texts: ['partial ', 'answer'] },
        ] }),
        makeEvent('tool/call', 3, { name: 'run_code' }),
        makeEvent(`tool/${namespace}-dispatch-start`, 4, { parentCallId: 'parent', subCallId: `parent:${namespace}:0`, name: 'rss_list', arguments: {} }),
        makeEvent(`tool/${namespace}-dispatch`, 5, { parentCallId: 'parent', subCallId: `parent:${namespace}:0`, name: 'rss_list', arguments: {}, isError: false, content: [{ type: 'text', text: 'private tool payload' }] }),
      ]
      writeFileSync(file, compressed ? makeSessionFile(lines) : lines.join('\n') + '\n')
      const digest = digestSessionFile(file, 5)
      assert.ok(digest)
      assert.equal(digest.streamTail, 'partial answer')
      assert.deepEqual(digest.toolCalls, ['run_code', 'rss_list'])
      assert.doesNotMatch(JSON.stringify(digest), /private system policy|private reasoning|private tool payload/)
    })
  }
}

test('a future session version is left unread instead of interpreted as v3', (t) => {
  const root = temporary(t)
  const file = join(root, 'session.v4.jsonl')
  writeFileSync(file, makeHeader('future', { version: 4, isSeeded: false }))
  assert.equal(digestSessionFile(file, 5), null)
})
