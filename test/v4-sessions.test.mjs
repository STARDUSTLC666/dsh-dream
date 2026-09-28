import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildDreamTools, digestSessionFile, listSessionFiles, resolveConfig } from '../lib/index.js'
import { makeEvent, makeHeader, makeSessionFile } from './helpers.mjs'

// Official rc.2 SessionEventMap and MessageBase: v4 adds message identity/source
// and surface metadata, while human content and assistant message remain distinct.
const event = (type, seq, data) => JSON.stringify({
  ...JSON.parse(makeEvent(type, seq, data)),
  ...(/^(user|assistant|system|developer)\/message$/.test(type) ? { surfaceOp: 'append' } : {}),
})
for (const compressed of [false, true]) {
  test('v4 ' + (compressed ? 'zstd' : 'plaintext') + ' renders human text and final answers without reasoning or injected instructions', async (t) => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-dream-v4-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const dir = join(root, 'workspace', 'session-current')
    mkdirSync(dir, { recursive: true })
    const file = join(dir, 'session.v4.jsonl' + (compressed ? '.zstd' : ''))
    const lines = [
      makeHeader('session-current', { version: 4, isSeeded: false, agentPreset: 'standard' }),
      event('session/title', 0, { title: '本轮插件验收' }),
      event('turn/start', 1, { turn: 1 }),
      event('system/message', 2, { message: { id: 'sys', role: 'system', source: { kind: 'system-prompt' }, content: [{ type: 'text', text: 'private system' }] } }),
      event('user/message', 3, { id: 'u', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '请统计库存' }] }),
      event('user/message', 4, { id: 'notice', role: 'user', source: { kind: 'agent-context' }, content: [{ type: 'text', text: 'private injected instructions' }] }),
      event('assistant/message', 5, { turn: 1, step: 1, message: { id: 'a', role: 'assistant', source: { kind: 'model' }, content: [
        { type: 'reasoning', text: 'private reasoning block' },
        { type: 'text', text: '库存合计为 35。' },
      ] }, stream: [
        { type: 'reasoning-chunks', texts: ['private reasoning stream'] },
        { type: 'text-chunks', texts: ['库存合计为 35。'] },
      ] }),
      event('tool/call', 6, { name: 'run_code', arguments: '{"private":"tool argument"}' }),
      event('tool/ptc-dispatch-start', 7, { name: 'sql_query' }),
      event('tool/ptc-dispatch', 8, { name: 'sql_query', content: [{ type: 'text', text: 'private tool payload' }] }),
    ]
    writeFileSync(file, compressed ? makeSessionFile(lines) : lines.join('\n') + '\n')
    const older = join(dir, 'session.v3.jsonl')
    writeFileSync(older, makeHeader('stale', { version: 3 }))
    const future = new Date(Date.now() + 100000)
    utimesSync(older, future, future)
    assert.deepEqual(listSessionFiles(root, 10), [file], 'committed v4 wins over an older generation')
    const digest = digestSessionFile(file, 5)
    assert.ok(digest, 'the current official v4 format must be supported')
    assert.deepEqual(digest.userMessages, ['请统计库存'])
    assert.deepEqual(digest.assistantTail, ['库存合计为 35。'])
    assert.deepEqual([...new Set(digest.toolCalls)], ['run_code', 'sql_query'])
    assert.doesNotMatch(JSON.stringify(digest), /private/)
    const tool = buildDreamTools(resolveConfig({ sessionsRoot: root, journalDir: join(root, 'journal') })).find(t => t.name === 'dream_digest')
    const args = { mode: 'full' }
    const result = await tool.execute(args)
    const text = tool.output.render(args, result).map(block => block.text).join('\n')
    assert.match(text, /用户说：\s*> 请统计库存/)
    assert.match(text, /最终回应：\s*< 库存合计为 35/)
    assert.match(text, /工具足迹：[^\n]*sql_query/)
    assert.doesNotMatch(text, /private/)
  })
}
