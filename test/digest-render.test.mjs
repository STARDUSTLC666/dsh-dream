import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { makeHeader, makeEvent, makeSessionFile } from './helpers.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-digest-render-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const write = (id, lines, timestamp) => {
    const dir = join(root, 'sessions', 'project', id)
    mkdirSync(dir, { recursive: true })
    const file = join(dir, 'session.jsonl.zstd')
    writeFileSync(file, makeSessionFile(lines))
    if (timestamp) utimesSync(file, timestamp, timestamp)
  }
  const tool = buildDreamTools(resolveConfig({ sessionsRoot: join(root, 'sessions'), journalDir: join(root, 'journal'), maxCharsPerSession: 2000 })).find(t => t.name === 'dream_digest')
  return { write, tool }
}

test('dream_digest renders usable user, assistant and tool content after masking and clipping', async (t) => {
  const { write, tool } = fixture(t)
  write('substance', [makeHeader('substance'), makeEvent('session/title', 0, '回归会话 password: titleFixtureSecret'), makeEvent('turn/start', 1, {}),
    makeEvent('user/message', 2, '请保留中文表头，密码 password: hunter2secret。' + '测试材料。'.repeat(120)),
    makeEvent('tool/call', 3, { name: 'sql_query' }), makeEvent('assistant/message', 4, '表头已保留，合计为35。' + '已逐项核对。'.repeat(80)),
    makeEvent('user/message', 5, '还需要保留排序。' + '这是第二条用户原话。'.repeat(50))])
  const full = await tool.execute({ mode: 'full' })
  const fullText = tool.output.render({}, full).map(block => block.text).join('\n')
  assert.match(fullText, /请保留中文表头/)
  assert.match(fullText, /表头已保留，合计为35/)
  assert.match(fullText, /工具足迹.*sql_query/)
  assert.match(fullText, /已脱敏/)
  assert.equal(fullText.includes('hunter2secret'), false)
  assert.equal(fullText.includes('titleFixtureSecret'), false, 'the visible heading must also be masked')
  assert.equal(JSON.stringify(full).includes('titleFixtureSecret'), false, 'structured output must not reveal the unmasked heading')
  const brief = await tool.execute({ mode: 'brief' })
  const briefText = tool.output.render({}, brief).map(block => block.text).join('\n')
  assert.ok(briefText.length < fullText.length, 'the visible brief output must actually be shorter')
  assert.equal(briefText.includes('hunter2secret'), false)
})

test('dream_digest skips empty shells before counting maxSessions and retains assistant-only content', async (t) => {
  const { write, tool } = fixture(t)
  write('content', [makeHeader('content'), makeEvent('assistant/message', 0, '真实结论')], new Date(2000))
  write('empty', [makeHeader('empty')], new Date(3000))
  const value = await tool.execute({ maxSessions: 1 })
  assert.equal(value.count, 1)
  assert.equal(value.sessions[0].id, 'content')
  assert.match(tool.output.render({}, value)[0].text, /真实结论/)
})
