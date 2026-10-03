import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { AutomaticDream, automaticVisibleText } from '../lib/automatic.js'
import { readAutomaticState, updateAutomaticState } from '../lib/automatic-state.js'
import { resolveConfig } from '../lib/config.js'
import { KnowledgeStore } from '../lib/knowledge-store.js'
import { createDreamActionHandler, installDreamActions } from '../lib/web-actions.js'

const quote = '工作区放在 E 盘，不要删除系统文件。'
function lesson(sourceSeq = 11) { return { kind: 'preference', title: '在 E 盘工作并保留系统文件', action: '把项目和临时工作放在 E 盘，保留系统文件', when: '处理此项目的文件时', exceptions: [], sourceSeq, quote } }
function setup(t, { output = { lessons: [lesson()] }, stream: custom, ...config } = {}) {
  const root = mkdtempSync(join(process.cwd(), '.auto-test-'))
  const cfg = resolveConfig({ journalDir: join(root, 'journal'), sessionsRoot: join(root, 'sessions'), autoCooldownMs: 1000, ...config })
  let now = Date.now(), calls = []
  const listeners = new Map(), contexts = []
  const host = {
    on(name, callback) { listeners.set(name, callback); return () => listeners.delete(name) },
    systemPrompt: { context(provider) { contexts.push(provider); return () => contexts.splice(contexts.indexOf(provider), 1) } },
    llm: { async *stream(options) {
      calls.push(options)
      if (custom) { yield* custom(options); return }
      yield { type: 'block-end', index: 0, block: { type: 'text', text: JSON.stringify(output) } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    } },
  }
  const runtime = new AutomaticDream(cfg, () => now)
  const unregister = runtime.register(), detach = runtime.attach(host)
  t.after(() => { detach(); unregister(); rmSync(root, { recursive: true, force: true }) })
  const session = { id: 'session-test', header: { version: 4, cwd: root }, requestContext: () => ({ provider: 'fixture', model: 'model-a' }) }
  const agent = { id: session.id, session }
  let seq = 10
  const send = (type, data) => runtime.observe(session, { type, seq: seq++, data })
  async function turn({ text = quote, tools = 2, source = 'user', reason = 'completed', finish = true } = {}) {
    send('turn/start', { turn: 1 })
    send('user/message', { source: { kind: source }, content: [{ type: 'text', text }] })
    for (let i = 0; i < tools; i++) send('tool/call', { name: 'bash', arguments: 'do-not-copy-secret' })
    send('assistant/message', { turn: 1, step: 1, message: { role: 'assistant', content: [{ type: 'text', text: '已完成文件检查，项目目录仍然保留。' }] }, stream: [] })
    if (finish) { send('turn/end', { turn: 1, reason: { kind: reason } }); await runtime.whenIdle() }
  }
  const store = new KnowledgeStore(join(cfg.journalDir, 'knowledge'))
  return { root, cfg, runtime, session, agent, calls, contexts, listeners, turn, send, store, advance: ms => { now += ms } }
}

test('normal work creates a sourced candidate without a dream trigger phrase', async t => {
  const e = setup(t)
  await e.turn()
  assert.equal(e.calls.length, 1)
  assert.equal(e.calls[0].provider, 'fixture')
  assert.equal(e.calls[0].model, 'model-a')
  assert.deepEqual(e.calls[0].tools, [])
  const [candidate] = e.store.listLessons()
  assert.equal(candidate.state, 'candidate')
  assert.equal(candidate.review.decision, 'unreviewed')
  assert.equal(candidate.scope.workspaceRoot, e.root)
  assert.equal(candidate.scope.global, false)
  assert.equal(e.store.listEvidence()[0].recordSeq, 11)
  assert.equal(e.store.listEvidence()[0].verification, 'read')
  assert.equal(existsSync(join(e.root, 'AGENTS.md')), false)
  assert.equal(existsSync(join(e.cfg.journalDir, 'dreams.jsonl')), false)
})

test('ordinary chat, internal messages and unsuccessful turns spend no model budget', async t => {
  for (const options of [{ tools: 0 }, { source: 'runtime-context' }, { reason: 'aborted' }, { reason: 'error' }, { reason: 'max-tokens' }]) {
    const e = setup(t)
    await e.turn(options)
    assert.equal(e.calls.length, 0)
  }
})

test('explicit preference can qualify without tools', async t => {
  const text = '我更喜欢：' + quote
  const e = setup(t, { output: { lessons: [{ ...lesson(), quote: text }] } })
  await e.turn({ text, tools: 0 })
  assert.equal(e.calls.length, 1)
})

test('subagents, fork seeds and Dream-only tool traffic are excluded', async t => {
  const e = setup(t)
  e.session.header.parentSession = 'parent'
  await e.turn()
  delete e.session.header.parentSession
  e.session.header.isSeeded = true
  await e.turn()
  delete e.session.header.isSeeded
  e.send('turn/start', { turn: 1 })
  e.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: quote }] })
  e.send('tool/call', { name: 'dream_collect' })
  e.send('tool/call', { name: 'dream_learn' })
  e.send('assistant/message', { message: { content: [{ type: 'text', text: '已保存这轮复盘的结果和条件。' }] } })
  e.send('turn/end', { reason: { kind: 'completed' } })
  await e.runtime.whenIdle()
  assert.equal(e.calls.length, 0)
})

test('invented source quotes/seqs cannot create evidence', async t => {
  const e = setup(t, { output: { lessons: [{ ...lesson(), quote: '原消息里没有这个句子。' }, { ...lesson(), sourceSeq: 900 }] } })
  await e.turn()
  assert.equal(e.store.listLessons().length, 0)
  assert.equal(e.runtime.status().last.reason, 'nothing-useful')
})

test('only visible masked text enters the model request', async t => {
  const e = setup(t, { output: { lessons: [] } })
  e.send('turn/start', { turn: 1 })
  e.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: quote + ' token=abcdefghijklmno' }] })
  e.send('tool/call', { name: 'bash', arguments: 'TOOL_ARGS_PRIVATE' })
  e.send('tool/call', { name: 'read', arguments: 'TOOL_FILE_PRIVATE' })
  e.send('tool/result', { content: [{ type: 'text', text: 'RESULT_PRIVATE' }] })
  e.send('assistant/message', { content: [{ type: 'reasoning', text: 'HIDDEN_PRIVATE' }, { type: 'text', text: '完成检查并保留原项目资料。' }] })
  e.send('turn/end', { reason: { kind: 'completed' } })
  await e.runtime.whenIdle()
  const prompt = JSON.stringify(e.calls[0].messages)
  assert.doesNotMatch(prompt, /abcdefghijklmno|TOOL_ARGS_PRIVATE|TOOL_FILE_PRIVATE|RESULT_PRIVATE|HIDDEN_PRIVATE/)
  assert.match(prompt, /脱敏/)
  assert.equal(automaticVisibleText([{ type: 'reasoning', text: 'hidden' }, { type: 'text', text: 'visible' }]), 'visible')
})

test('daily budgets survive another runtime', async t => {
  const e = setup(t, { autoMaxCallsPerDay: 1 })
  await e.turn()
  await e.turn()
  assert.equal(e.calls.length, 1)
  assert.equal(e.runtime.status().last.reason, 'daily-budget')
  const second = new AutomaticDream(e.cfg)
  assert.equal(second.status().callsToday, 1)
  assert.equal(readAutomaticState(e.cfg).calls, 1)
})

test('cooldown is conservative across attempts and resumes after the interval', async t => {
  const e = setup(t, { output: { lessons: [] } })
  await e.turn(); await e.turn()
  assert.equal(e.calls.length, 1)
  assert.equal(e.runtime.status().last.reason, 'cooldown')
  e.advance(1001); await e.turn()
  assert.equal(e.calls.length, 2)
})

test('auxiliary timeout settles even when an adapter ignores abort', async t => {
  const e = setup(t, { autoTimeoutMs: 1000, stream: async function* () { await new Promise(() => {}) } })
  // Keep the event loop alive while the production timeout itself is unref'ed.
  const keepAlive = setInterval(() => {}, 500)
  try { await e.turn() } finally { clearInterval(keepAlive) }
  assert.equal(e.runtime.status().last.reason, 'timeout')
  assert.equal(e.store.listLessons().length, 0)
})

test('tool output, incomplete model output and oversized output cannot create lessons', async t => {
  for (const chunks of [
    [{ type: 'block-end', index: 0, block: { type: 'tool-call', name: 'bash', arguments: '{}' } }],
    [{ type: 'block-end', index: 0, block: { type: 'text', text: JSON.stringify({ lessons: [lesson()] }) } }, { type: 'finish', reason: { kind: 'max-tokens' } }],
    [{ type: 'text-delta', index: 0, text: 'x'.repeat(12001) }],
  ]) {
    const e = setup(t, { stream: async function* () { yield* chunks } })
    await e.turn()
    assert.equal(e.runtime.status().last.reason, 'model-error')
    assert.equal(e.store.listLessons().length, 0)
    assert.equal(e.runtime.status().callsToday, 1)
  }
})

test('cross-process claims cannot exceed one shared call budget', async t => {
  const e = setup(t)
  const moduleUrl = new URL('../lib/automatic-state.js', import.meta.url).href
  const code = `import { updateAutomaticState } from ${JSON.stringify(moduleUrl)}; const cfg = JSON.parse(process.argv[1]); let claimed = false; try { claimed = updateAutomaticState(cfg, state => { if (state.calls >= 1) return false; state.calls++; return true }); } catch (error) { if (error.message !== 'automatic-storage-busy') throw error; } console.log(JSON.stringify({claimed}));`
  const worker = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', code, JSON.stringify(e.cfg)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = '', errors = ''
    child.stdout.on('data', data => { output += data }); child.stderr.on('data', data => { errors += data })
    child.on('error', reject); child.on('exit', exit => exit === 0 ? resolve(JSON.parse(output)) : reject(new Error(errors)))
  })
  const results = await Promise.all(Array.from({ length: 4 }, worker))
  assert.equal(results.filter(result => result.claimed).length, 1)
  assert.equal(readAutomaticState(e.cfg).calls, 1)
})

test('live state locks are never reclaimed or waited on', async t => {
  const e = setup(t)
  updateAutomaticState(e.cfg, state => { state.calls = 0 })
  const lock = join(e.cfg.journalDir, 'automatic', '.lock')
  writeFileSync(lock, JSON.stringify({ pid: process.pid }))
  assert.throws(() => e.runtime.control({ enabled: false }), /automatic-storage-busy/)
  assert.equal(JSON.parse(readFileSync(lock, 'utf8')).pid, process.pid)
})

test('version-bound accepted lessons stay out of automatic context when versions are unknown', async t => {
  const e = setup(t)
  const made = e.store.createLesson({ ...lesson(), workspaceRoot: e.root, applicability: [{ package: 'example', versions: '<2.0.0' }], evidence: [{ kind: 'session', sessionId: 'other', recordSeq: 9, summary: quote, verification: 'read', sourceHash: 'f'.repeat(64) }] }, 'version-fixture')
  const row = e.store.listLessons().find(item => item.id === made.lesson.id)
  e.store.reviewLesson(row.id, 'accepted', row.revision, 'version-review', 'user')
  e.listeners.get('agent/inbox/claimed')({ agent: e.agent, message: { source: { kind: 'user' }, content: [{ type: 'text', text: 'example 工作区 E 盘' }] } })
  assert.equal(e.contexts[0].text({ scope: e.agent }), '')
})

test('cursor deduplication survives restart and settings survive reload', async t => {
  const e = setup(t)
  await e.turn()
  e.runtime.dispose()
  const second = new AutomaticDream(e.cfg)
  const release = second.attach({ on: e.listeners.get ? () => () => {} : null, systemPrompt: { context: () => () => {} }, llm: { stream: () => { throw new Error('duplicate request') } } })
  second.observe(e.session, { type: 'turn/start', seq: 10, data: { turn: 1 } })
  second.observe(e.session, { type: 'turn/end', seq: 15, data: { reason: { kind: 'completed' } } })
  await second.whenIdle()
  assert.equal(second.status().callsToday, 1)
  second.control({ enabled: false, retrievalEnabled: false })
  assert.equal(new AutomaticDream(e.cfg).status().enabled, false)
  assert.equal(new AutomaticDream(e.cfg).status().retrievalEnabled, false)
  release(); second.dispose()
})

test('new input cancels a hanging auxiliary call without saving late output', async t => {
  let entered
  const started = new Promise(resolve => { entered = resolve })
  const e = setup(t, { stream: async function* () { entered(); await new Promise(() => {}) } })
  await e.turn({ finish: false })
  e.send('turn/end', { reason: { kind: 'completed' } })
  await started
  e.send('turn/start', { turn: 2 })
  await e.runtime.whenIdle()
  assert.equal(e.runtime.status().last.reason, 'cancelled')
  assert.equal(e.store.listLessons().length, 0)
})

test('corrupt state fails closed without replacing the file', async t => {
  const e = setup(t)
  await e.turn()
  const file = join(e.cfg.journalDir, 'automatic', 'state.json')
  writeFileSync(file, '{broken')
  e.advance(2000)
  await e.turn()
  assert.equal(e.calls.length, 1)
  assert.equal(e.runtime.status().enabled, false)
  assert.equal(readFileSync(file, 'utf8'), '{broken')
})

test('automatic retrieval requires accepted state, matches the current scope and respects budget', async t => {
  const e = setup(t)
  await e.turn()
  e.listeners.get('agent/inbox/claimed')({ agent: e.agent, message: { source: { kind: 'user' }, content: [{ type: 'text', text: '工作区 E 盘 文件' }] } })
  assert.equal(e.contexts[0].text({ scope: e.agent }), '')
  const [lesson] = e.store.listLessons()
  e.store.reviewLesson(lesson.id, 'accepted', lesson.revision, 'review-fixture', 'user')
  const context = e.contexts[0].text({ scope: e.agent })
  assert.match(context, /在 E 盘工作/)
  assert.ok(context.length <= 3000)
  const elsewhere = { session: { ...e.session, header: { cwd: join(e.root, 'other') } } }
  e.listeners.get('agent/inbox/claimed')({ agent: elsewhere, message: { source: { kind: 'user' }, content: [{ type: 'text', text: '工作区 E 盘 文件' }] } })
  assert.equal(e.contexts[0].text({ scope: elsewhere }), '')
  e.runtime.control({ retrievalEnabled: false })
  assert.equal(e.contexts[0].text({ scope: e.agent }), '')
})

test('automatic settings use the authenticated mutation handler and reject cross-origin writes', async t => {
  const e = setup(t)
  const handle = createDreamActionHandler({ config: e.cfg })
  const request = (origin, enabled = false) => new Request('http://127.0.0.1/api/dsh-dream/actions', { method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-dream-action': '1', origin }, body: JSON.stringify({ operation: 'automatic', enabled }) })
  assert.equal((await handle(request('https://evil.example'))).status, 403)
  assert.equal((await handle(request('http://127.0.0.1', 'false'))).status, 400)
  assert.equal((await handle(request('http://127.0.0.1'))).status, 200)
  assert.equal(e.runtime.status().enabled, false)
})

test('both authenticated Fetch routes declare the official request-body mode', async t => {
  const e = setup(t), routes = []
  installDreamActions({ inject(_services, callback) { callback({ connection: { fetch: { register(route) { routes.push(route) } } } }) } }, { config: e.cfg })
  assert.equal(routes.length, 2)
  for (const route of routes) assert.equal(route.requestBody, 'buffered')
  const status = await routes.find(route => route.methods.includes('GET')).fetch(new Request('http://dsh.internal/api/dsh-dream/automatic'))
  assert.equal(status.status, 200)
  assert.equal((await status.json()).automatic.available, true)
})
