/**
 * DeepSeek Harness 0.2.2-rc.3 deep adaptation & SIM/CRSI integration test suite.
 *
 * Covers all 12 adaptation pillars plus in-process verification against the real
 * local DeepSeek Harness 0.2.2-rc.3 built modules when present.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'

import {
  AutomaticDream,
  KnowledgeStore,
  applyBridge,
  buildDreamCommands,
  buildDreamTools,
  buildVerificationGateMessage,
  digestSessionsWithFallback,
  extractInjectedDreamLessonIds,
  extractToolFilePath,
  extractToolFilePaths,
  getSessionQuery,
  installAutomaticDream,
  installDreamCommands,
  installSessionQueryBridge,
  needsObservationReview,
  previewBridge,
  rankInversionCount,
  recordLessonObservation,
  resolveConfig,
  retrieveLessons,
  selectBridgeLessons,
  selectVerificationGateLessons,
  setSessionQueryForTest,
  simDirectory,
  verifyEvidenceWithSessionQuery,
} from '../lib/index.js'
import { readAutomaticState } from '../lib/automatic-state.js'
import { createKnowledgeWebHandler, DREAM_KNOWLEDGE_ROUTE } from '../lib/web.js'
import { createDreamActionHandler, DREAM_ACTION_ROUTE } from '../lib/web-actions.js'
import { makeEvent, makeHeader, makeSessionFile } from './helpers.mjs'

const DSH_HARNESS_ROOT = process.env.DSH_HARNESS_ROOT || 'C:\\Users\\29022\\deepseek-harness'
const HAS_REAL_DSH = existsSync(join(DSH_HARNESS_ROOT, 'packages', 'core', 'system-prompt', 'lib', 'index.js'))
  && existsSync(join(DSH_HARNESS_ROOT, 'packages', 'interaction', 'commands', 'lib', 'index.js'))

function makeTempEnv(t, configOverrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-dream-adapt-'))
  const project = join(root, 'project')
  const journalDir = join(root, 'journal')
  const sessionsRoot = join(root, 'sessions')
  mkdirSync(project, { recursive: true })
  const cfg = resolveConfig({
    journalDir,
    sessionsRoot,
    autoCooldownMs: 1000,
    autoIdleMs: 0,
    ...configOverrides,
  })
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return {
    root,
    project,
    journalDir,
    sessionsRoot,
    cfg,
    store: () => new KnowledgeStore(join(journalDir, 'knowledge')),
  }
}

function makeAutomaticHarness(t, { output = { lessons: [] }, stream: customStream, ...config } = {}) {
  const env = makeTempEnv(t, config)
  let now = Date.parse('2026-11-22T02:00:00.000Z')
  const calls = []
  const listeners = new Map()
  const contexts = []

  const addListener = (event, fn) => {
    if (!listeners.has(event)) listeners.set(event, [])
    listeners.get(event).push(fn)
    return () => {
      const list = listeners.get(event)
      if (!list) return
      const idx = list.indexOf(fn)
      if (idx >= 0) list.splice(idx, 1)
    }
  }
  const emit = async (event, ...args) => {
    for (const fn of [...(listeners.get(event) ?? [])]) {
      await fn(...args)
    }
  }

  const host = {
    on: addListener,
    systemPrompt: {
      context(provider) {
        contexts.push(provider)
        return () => {
          const idx = contexts.indexOf(provider)
          if (idx >= 0) contexts.splice(idx, 1)
        }
      },
    },
    llm: {
      async *stream(options) {
        calls.push(options)
        if (customStream) {
          yield* customStream(options)
          return
        }
        yield { type: 'block-end', index: 0, block: { type: 'text', text: JSON.stringify(output) } }
        yield { type: 'finish', reason: { kind: 'stop' } }
      },
    },
  }

  const runtime = new AutomaticDream(env.cfg, () => now)
  const unregister = runtime.register()
  const detach = runtime.attach(host)
  t.after(() => {
    detach()
    unregister()
  })

  const sessionEvents = []
  const session = {
    id: 'sess-adapt-1',
    header: { version: 4, cwd: env.project, agentPreset: 'code-architect' },
    requestContext: () => ({ provider: 'deepseek', model: 'deepseek-reasoner' }),
    snapshotEvents: () => sessionEvents,
  }
  const steered = []
  const agent = {
    id: session.id,
    session,
    model: { current: () => ({ provider: 'deepseek', model: 'deepseek-reasoner' }) },
    steer(msg) { steered.push(msg) },
  }

  let seq = 10
  const send = (type, data) => {
    const ev = { type, seq: seq++, time: now, data }
    sessionEvents.push(ev)
    runtime.observe(session, ev)
    return ev
  }

  return {
    ...env,
    runtime,
    host,
    calls,
    contexts,
    listeners,
    emit,
    session,
    sessionEvents,
    agent,
    steered,
    send,
    advance(ms) { now += ms },
    now: () => now,
  }
}

function seedAcceptedLesson(store, overrides = {}) {
  const id = overrides.seedKey ?? ('seed-' + Math.random().toString(36).slice(2, 10))
  const created = store.createLesson({
    kind: 'procedure',
    title: '交付前运行单元测试',
    action: '修改代码后先运行 npm test 再汇报完成',
    when: '修改源码文件准备交付时',
    exceptions: [],
    global: false,
    evidence: [{
      kind: 'session',
      sessionId: 'sess-seed-' + id,
      recordSeq: 5,
      summary: '实测确认测试能拦截回归',
      verification: 'read',
      sourceHash: 'a'.repeat(64),
    }],
    ...overrides,
  }, 'create-' + id, { requireReview: true }).lesson
  return store.reviewLesson(created.id, 'accepted', created.revision, 'accept-' + id, 'human')
}

// ---------------------------------------------------------------------------
// 1. interpolate: false bug fix (unit mock + real DSH 0.2.2-rc.3 SystemPrompt)
// ---------------------------------------------------------------------------

test('1a. systemPrompt.context registers interpolate: false and preserves {{...}} literally', async (t) => {
  const h = makeAutomaticHarness(t)
  assert.equal(h.contexts.length, 1)
  assert.equal(h.contexts[0].name, 'dsh-dream-reviewed-memory')
  assert.equal(h.contexts[0].order, 4100)
  assert.equal(h.contexts[0].interpolate, false, 'MUST set interpolate: false to prevent DSH SystemPrompt crash')

  seedAcceptedLesson(h.store(), {
    title: 'GitHub Actions ${{ github.sha }} 与 {{user_var}} 模板写法',
    action: '在 workflow 中保留 ${{ secrets.TOKEN }} 以及未闭合 {{broken 示例',
    when: '编写包含 {{user_var}} 或 Jinja 模板的脚本时',
    workspaceRoot: h.project,
  })

  await h.emit('agent/inbox/claimed', {
    agent: h.agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: 'GitHub Actions 模板 {{user_var}}' }] },
  })
  const rendered = h.contexts[0].text({ scope: h.agent, agent: h.agent })
  assert.match(rendered, /\{\{user_var\}\}/)
  assert.match(rendered, /\$\{\{ github\.sha \}\}/)
  assert.match(rendered, /\{\{broken/)
})

test('1b. Real DSH 0.2.2-rc.3 SystemPrompt renders {{user_var}} / {{broken lessons cleanly with interpolate: false', { skip: !HAS_REAL_DSH }, async (t) => {
  const req = createRequire(join(DSH_HARNESS_ROOT, 'packages', 'core', 'system-prompt', 'package.json'))
  const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
  const spMod = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'core', 'system-prompt', 'lib', 'index.js')).href)
  const { SystemPrompt, renderContextSections, renderContextSnapshot } = spMod

  const env = makeTempEnv(t)
  seedAcceptedLesson(env.store(), {
    title: '保留 ${{ github.sha }} 和 {{user_var}} 占位符',
    action: '不要展开 {{user_var}} 或 {{broken}} 模板',
    when: '处理 workflow 模板文件时',
    workspaceRoot: env.project,
  })

  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  t.after(() => ctx.stop?.())

  const runtime = new AutomaticDream(env.cfg)
  const unreg = runtime.register()
  const listeners = new Map()
  const detach = runtime.attach({
    on(name, fn) { listeners.set(name, fn); return () => listeners.delete(name) },
    systemPrompt: ctx.systemPrompt,
    llm: { async *stream() {} },
  })
  t.after(() => { detach(); unreg() })

  const session = { id: 'real-sp-sess', header: { version: 4, cwd: env.project } }
  const agent = { id: session.id, session, model: { current: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) } }
  listeners.get('agent/inbox/claimed')({
    agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: 'workflow 模板 {{user_var}}' }] },
  })

  const assembly = await ctx.systemPrompt.assemble({ scope: agent, agent })
  const dreamCtx = assembly.contexts.find((c) => c.name === 'dsh-dream-reviewed-memory')
  assert.ok(dreamCtx, 'dsh-dream-reviewed-memory context must be assembled by real DSH SystemPrompt')
  assert.equal(dreamCtx.interpolate, false)

  // Real DSH renderContextSections MUST NOT throw on {{user_var}} / {{broken}}
  const sections = renderContextSections(assembly)
  const dreamSection = sections.find((s) => s.name === 'dsh-dream-reviewed-memory')
  assert.ok(dreamSection)
  assert.match(dreamSection.text, /\{\{user_var\}\}/)
  assert.match(dreamSection.text, /\{\{broken\}\}/)
  assert.match(renderContextSnapshot(assembly), /\{\{user_var\}\}/)

  // Control proof: without interpolate: false, real DSH renderContextSections throws on the exact same text
  assert.throws(
    () => renderContextSections({
      ...assembly,
      contexts: [{ name: 'dsh-dream-reviewed-memory', text: dreamCtx.text }],
    }),
    /unknown prompt variable|malformed prompt variable/i,
  )
})

// ---------------------------------------------------------------------------
// 2. Model provenance & cross-model mismatch flag
// ---------------------------------------------------------------------------

test('2. Model provenance persists in automatic extraction and flags cross-model mismatch on recall', async (t) => {
  const quote = '以后在这个仓库里遇到 Vitest 挂起先检查未清理的定时器。'
  const h = makeAutomaticHarness(t, {
    output: {
      lessons: [{
        kind: 'pitfall',
        title: 'Vitest 挂起先查未清理定时器',
        action: '排查 setInterval 或未 close 的句柄',
        when: 'Vitest 单测超时挂起时',
        rationale: '未 unref 的 timer 会阻止 worker 退出',
        prevents: '测试进程超时卡死',
        exceptions: [],
        sourceSeq: 11,
        quote,
      }],
    },
  })

  h.send('turn/start', { turn: 1 })
  h.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: quote }] })
  h.send('tool/call', { name: 'bash', arguments: '{}' })
  h.send('tool/call', { name: 'read', arguments: '{}' })
  h.send('assistant/message', { message: { id: 'msg-1', role: 'assistant', content: [{ type: 'text', text: '好的，已经定位并清理了未释放的定时器。' }] } })
  h.send('turn/end', { reason: { kind: 'completed' } })
  await h.runtime.whenIdle()

  const store = h.store()
  const [candidate] = store.listLessons()
  assert.ok(candidate)
  assert.deepEqual(candidate.origin, {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    agentPreset: 'code-architect',
  })
  assert.equal(candidate.rationale, '未 unref 的 timer 会阻止 worker 退出')
  assert.equal(candidate.prevents, '测试进程超时卡死')

  const [ev] = store.listEvidence()
  assert.equal(ev.provider, 'deepseek')
  assert.equal(ev.model, 'deepseek-reasoner')
  assert.equal(ev.agentPreset, 'code-architect')

  // Human accepts candidate
  const accepted = store.reviewLesson(candidate.id, 'accepted', candidate.revision, 'accept-prov', 'human')

  // Direct retrieveLessons(): same model -> no mismatch; different model -> modelMismatch: true
  const sameModel = retrieveLessons([accepted], store.listEvidence(), {
    query: 'Vitest 定时器挂起',
    workspaceRoot: h.project,
    currentModel: 'deepseek-reasoner',
  })
  assert.equal(sameModel.items.length, 1)
  assert.equal(sameModel.items[0].originModel, 'deepseek-reasoner')
  assert.equal(sameModel.items[0].modelMismatch, undefined)

  const diffModel = retrieveLessons([accepted], store.listEvidence(), {
    query: 'Vitest 定时器挂起',
    workspaceRoot: h.project,
    currentModel: 'deepseek-chat',
  })
  assert.equal(diffModel.items.length, 1)
  assert.equal(diffModel.items[0].originModel, 'deepseek-reasoner')
  assert.equal(diffModel.items[0].modelMismatch, true)

  // Automatic context(): AssembleContext.modelSelection mismatch injects originModel + modelShiftHint
  await h.emit('agent/inbox/claimed', {
    agent: h.agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: 'Vitest 定时器挂起' }] },
  })
  const ctxDiff = h.contexts[0].text({
    scope: h.agent,
    agent: h.agent,
    modelSelection: { provider: 'deepseek', model: 'deepseek-chat' },
  })
  const parsedDiff = JSON.parse(ctxDiff.slice(ctxDiff.indexOf('[')))
  assert.equal(parsedDiff[0].originModel, 'deepseek-reasoner')
  assert.match(parsedDiff[0].modelShiftHint, /deepseek-reasoner.*deepseek-chat/)
  assert.equal(parsedDiff[0].rationale, '未 unref 的 timer 会阻止 worker 退出')

  const ctxSame = h.contexts[0].text({
    scope: h.agent,
    agent: h.agent,
    modelSelection: { provider: 'deepseek', model: 'deepseek-reasoner' },
  })
  const parsedSame = JSON.parse(ctxSame.slice(ctxSame.indexOf('[')))
  assert.equal(parsedSame[0].modelShiftHint, undefined)
})

// ---------------------------------------------------------------------------
// 3. workingDirectory + workspaceRegistry resolution (cwd switching)
// ---------------------------------------------------------------------------

test('3. workingDirectory + workspaceRegistry tracks mid-session cwd switches and canonical workspaceId', async (t) => {
  const h = makeAutomaticHarness(t)
  const dirA = h.project
  const dirB = join(h.root, 'other-worktree')
  mkdirSync(dirB, { recursive: true })

  let activeCwd = dirA
  const detachWd = h.runtime.attachWorkingDirectory({ get: () => activeCwd })
  const detachReg = h.runtime.attachWorkspaceRegistry({
    async resolveByPath(p) {
      if (p.toLowerCase() === dirB.toLowerCase()) return { id: 'ws-canonical-beta' }
      return { id: 'ws-canonical-alpha' }
    },
  })
  t.after(() => { detachWd(); detachReg() })

  const store = h.store()
  seedAcceptedLesson(store, {
    seedKey: 'proj-a',
    title: 'Alpha 构建必须带 --strict',
    action: '在 Alpha 中开启 strict',
    when: '构建 Alpha 时',
    workspaceRoot: dirA,
    projectId: 'ws-canonical-alpha',
  })
  seedAcceptedLesson(store, {
    seedKey: 'proj-b',
    title: 'Beta 构建必须带 --frozen-lockfile',
    action: '在 Beta worktree 安装依赖时加 --frozen-lockfile',
    when: '构建 Beta 时',
    projectId: 'ws-canonical-beta', // matched via canonical workspaceId even without workspaceRoot match
  })

  // Switch working directory mid-session while session.header.cwd stays dirA
  activeCwd = dirB
  h.send('working-directory/change', { cwd: dirB })
  await new Promise((r) => setTimeout(r, 20)) // allow async resolveByPath cache to populate

  assert.equal(h.runtime.effectiveCwd(h.session), dirB)
  assert.equal(h.runtime.cachedWorkspaceId(dirB), 'ws-canonical-beta')

  await h.emit('agent/inbox/claimed', {
    agent: h.agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: '构建 Beta Alpha' }] },
  })
  const contextText = h.contexts[0].text({ scope: h.agent, agent: h.agent })
  assert.match(contextText, /Beta 构建必须带 --frozen-lockfile/)
  assert.doesNotMatch(contextText, /Alpha 构建必须带 --strict/)
})

// ---------------------------------------------------------------------------
// 4. DSH native feedback & signal attribution + human-review boundary
// ---------------------------------------------------------------------------

test('4. Native feedback (message-put, record, committed, repeat-tool) attributes observations without mutating lesson state', async (t) => {
  const h = makeAutomaticHarness(t, { autoIdleMs: 60000 })
  const store = h.store()
  const lsn = seedAcceptedLesson(store, {
    seedKey: 'fb-target',
    title: '使用 pnpm --filter 执行单包测试',
    action: '用 pnpm --filter 跑单测避免全量耗时',
    when: '运行 monorepo 单元测试时',
    workspaceRoot: h.project,
  })
  const beforeLesson = store.getLesson(lsn.id)

  // Verify extractInjectedDreamLessonIds parses persisted runtime-context snapshot before target assistant message
  const fakeEvents = [
    {
      type: 'user/message',
      seq: 1,
      data: {
        source: {
          kind: 'runtime-context',
          form: 'snapshot',
          sections: [
            { name: 'working-directory:current', text: 'Current working directory: "/x".' },
            { name: 'dsh-dream-reviewed-memory', text: 'Dream reviewed memory\n' + JSON.stringify([{ lessonId: lsn.id, title: lsn.title }]) },
          ],
        },
      },
    },
    { type: 'assistant/message', seq: 2, data: { message: { id: 'asst-1', source: { kind: 'model', model: 'deepseek-chat' } } } },
    {
      type: 'user/message',
      seq: 3,
      data: {
        source: {
          kind: 'runtime-context',
          form: 'snapshot',
          sections: [
            { name: 'dsh-dream-reviewed-memory', text: 'Dream reviewed memory\n' + JSON.stringify([{ lessonId: 'lsn_other' }]) },
          ],
        },
      },
    },
    { type: 'assistant/message', seq: 4, data: { message: { id: 'asst-2' } } },
  ]
  assert.deepEqual(extractInjectedDreamLessonIds(fakeEvents, 'asst-1'), [lsn.id])
  assert.deepEqual(extractInjectedDreamLessonIds(fakeEvents, 'asst-2'), ['lsn_other'])
  assert.deepEqual(extractInjectedDreamLessonIds(fakeEvents), ['lsn_other'])

  // Start a live turn where lsn is injected, repeat-tool-reminder fires, and user corrects
  h.send('turn/start', { turn: 1 })
  await h.emit('agent/inbox/claimed', {
    agent: h.agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: 'monorepo 单元测试 pnpm' }] },
  })
  assert.match(h.contexts[0].text({ scope: h.agent, agent: h.agent }), /pnpm --filter/)
  h.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: '不对，请记住不要在根目录跑全量测试。' }] })
  h.send('user/message', { source: { kind: 'repeat-tool-reminder' }, content: [{ type: 'text', text: 'repeated tool' }] })
  h.send('assistant/message', { message: { id: 'asst-live-1', role: 'assistant', content: [{ type: 'text', text: '已改为单包测试。' }] } })
  h.send('turn/end', { reason: { kind: 'completed' } })

  // Live feedback/message-put (positive + negative with secret note + duplicate version ignored)
  h.send('feedback/message-put', {
    sessionId: h.session.id,
    item: { messageId: 'asst-live-1', rating: 'positive', version: 'v-pos-1' },
  })
  h.send('feedback/message-put', {
    sessionId: h.session.id,
    item: {
      messageId: 'asst-live-1',
      rating: 'negative',
      category: 'instruction-following',
      note: '没有遵守范围限制 token=sk-secretvalue1234567890abcdef',
      version: 'v-neg-1',
    },
  })
  // Duplicate version should be ignored
  h.send('feedback/message-put', {
    sessionId: h.session.id,
    item: { messageId: 'asst-live-1', rating: 'negative', version: 'v-neg-1' },
  })
  // Live feedback/record
  h.send('feedback/record', { rating: 'negative', category: 'task-result', text: '测试命令仍然漏掉了 filter 参数' })

  // Cold feedback/committed via messageFeedback host attachment
  const detachFb = h.runtime.attachMessageFeedback({
    messageFeedback: {},
    on: h.host.on,
  })
  t.after(detachFb)
  await h.emit('feedback/committed', {
    meta: { id: 'cold-session' },
    events: [
      ...fakeEvents.slice(0, 2),
      {
        type: 'feedback/message-put',
        seq: 10,
        data: {
          sessionId: 'cold-session',
          item: { messageId: 'asst-1', rating: 'negative', category: 'task-result', note: '历史会话差评', version: 'v-cold-1' },
        },
      },
    ],
  })

  const autoState = readAutomaticState(h.cfg, h.now())
  const obs = autoState.observations?.[lsn.id]
  assert.ok(obs, 'observation must be recorded in automatic state')
  assert.equal(obs.positive, 1)
  assert.equal(obs.negative, 3, 'live neg + feedback/record + cold committed = 3 (deduplicating v-neg-1)')
  assert.equal(obs.corrections, 1)
  assert.equal(obs.repeatToolHits, 1)
  assert.doesNotMatch(JSON.stringify(autoState.observations), /sk-secretvalue1234567890abcdef/)

  // Negative feedback note enqueued a high-priority extraction with triggerKind: 'feedback'
  assert.ok(
    (autoState.pending ?? []).some((p) => p.triggerKind === 'feedback'),
    'negative feedback note must enqueue feedback-triggered extraction',
  )

  // Advisory review signal flags repeated negatives
  const signal = needsObservationReview(store.getLesson(lsn.id), obs)
  assert.equal(signal.flagged, true)
  assert.equal(signal.reason, 'native-negative-feedback')

  // HARD INVARIANT: lesson state & review NEVER auto-changed!
  const afterLesson = store.getLesson(lsn.id)
  assert.equal(afterLesson.state, 'usable')
  assert.equal(afterLesson.revision, beforeLesson.revision)
  assert.deepEqual(afterLesson.review, beforeLesson.review)
})

// ---------------------------------------------------------------------------
// 5. File-scoped recall (tools/result + workspaceChanges)
// ---------------------------------------------------------------------------

test('5. tools/result + workspaceChanges drive file-scoped recall and whyRelevant file match', async (t) => {
  const quote = '改完 bridge.ts 后请务必跑 bridge-acceptance 单测验证原子替换。'
  const h = makeAutomaticHarness(t, {
    output: {
      lessons: [{
        kind: 'procedure',
        title: '改 bridge 后跑 bridge-acceptance',
        action: '修改后执行 node --test test/bridge-acceptance.test.mjs',
        when: '修改桥接逻辑时',
        exceptions: [],
        sourceSeq: 11,
        quote,
      }],
    },
  })

  // Unit check extractToolFilePath / extractToolFilePaths including apply_patch & out-of-workspace rejection
  assert.equal(
    extractToolFilePath({ name: 'read', arguments: JSON.stringify({ file_path: join(h.project, 'src', 'bridge.ts') }) }, h.project),
    'src/bridge.ts',
  )
  assert.equal(
    extractToolFilePath({ name: 'read', arguments: JSON.stringify({ file_path: join(h.root, 'outside.txt') }) }, h.project),
    undefined,
  )
  assert.deepEqual(
    extractToolFilePaths({
      name: 'apply_patch',
      arguments: { patch: '*** Begin Patch\n*** Update File: src/automatic.ts\n*** Add File: src/commands.ts\n*** End Patch' },
    }, h.project),
    ['src/automatic.ts', 'src/commands.ts'],
  )

  const detachTools = h.runtime.attachTools({ tools: {}, on: h.host.on })
  const detachWc = h.runtime.attachWorkspaceChanges({
    summary(sessionId, seq) {
      if (sessionId === h.session.id && seq >= 10) {
        return { turn: 1, cwd: h.project, files: [{ path: 'src/bridge.ts', display: 'src/bridge.ts', added: 5, deleted: 1 }], total: 1, added: 5, deleted: 1 }
      }
      return undefined
    },
  })
  t.after(() => { detachTools(); detachWc() })

  // Seed two lessons: one file-scoped to src/bridge.ts, one unrelated
  const store = h.store()
  const bridgeLesson = seedAcceptedLesson(store, {
    seedKey: 'file-bridge',
    title: '保持管理块原子替换和 BOM 兼容',
    action: '写盘前先 fsync 再 rename 保留 BOM 与 CRLF',
    when: '修改桥接模块时',
    files: ['src/bridge.ts'],
    workspaceRoot: h.project,
  })
  seedAcceptedLesson(store, {
    seedKey: 'file-other',
    title: '通用提交说明规范',
    action: '提交时写清动机',
    when: '修改任何模块时',
    files: ['src/other.ts'],
    workspaceRoot: h.project,
  })

  // Emit tools/result for read on src/bridge.ts -> boosts bridgeLesson in activeFiles recall
  await h.emit('tools/result', {
    name: 'read',
    arguments: JSON.stringify({ file_path: join(h.project, 'src', 'bridge.ts') }),
    agent: h.agent,
  }, { isError: false })

  const direct = retrieveLessons([bridgeLesson], store.listEvidence(), {
    query: '检查当前任务',
    workspaceRoot: h.project,
    activeFiles: ['src/bridge.ts'],
  })
  assert.equal(direct.items.length, 1)
  assert.equal(direct.items[0].lessonId, bridgeLesson.id)
  assert.match(direct.items[0].whyRelevant, /关联文件「src\/bridge\.ts」/)

  await h.emit('agent/inbox/claimed', {
    agent: h.agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: '准备修改当前模块' }] },
  })
  const injected = h.contexts[0].text({ scope: h.agent, agent: h.agent })
  assert.match(injected, /保持管理块原子替换和 BOM 兼容/)

  // Also test workspace/changes populates touchedFiles -> extracted candidate automatically inherits files: ['src/bridge.ts']
  h.send('turn/start', { turn: 1 })
  h.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: quote }] })
  h.send('tool/call', { name: 'edit', arguments: '{}' })
  h.send('tool/call', { name: 'bash', arguments: '{}' })
  h.send('workspace/changes', { turn: 1 })
  h.send('assistant/message', { message: { id: 'asst-wc', role: 'assistant', content: [{ type: 'text', text: '已修改 bridge.ts 并完成验收测试。' }] } })
  h.send('turn/end', { reason: { kind: 'completed' } })
  await h.runtime.whenIdle()

  const extracted = store.listLessons().find((item) => item.title === '改 bridge 后跑 bridge-acceptance')
  assert.ok(extracted)
  assert.deepEqual(extracted.files, ['src/bridge.ts'])
})

// ---------------------------------------------------------------------------
// 6. SIM Optimizer Directory (simDirectory), tight-budget trimming, merge & supersedes
// ---------------------------------------------------------------------------

test('6. simDirectory supplies usable + rejected negative memory, trims gracefully, links supersedes, excludes session log', async (t) => {
  const quote = '以后整理经验时请务必同时保留根因说明，并替代旧的简陋规则。'
  let acceptedId = ''
  const h = makeAutomaticHarness(t, {
    stream: async function* (options) {
      // Verify purpose is NOT set (preserving automatic.test.mjs invariant)
      assert.equal(options.purpose, undefined)
      const payload = JSON.parse(options.messages[0].content[0].text)
      assert.ok(payload.existingMemory, 'existingMemory (simDirectory) must be supplied to extraction model')
      assert.ok(payload.existingMemory.usable.some((u) => u.id === acceptedId))
      assert.ok(payload.existingMemory.history.some((x) => x.state === 'rejected' && x.reason?.includes('太泛')))
      yield {
        type: 'block-end',
        index: 0,
        block: {
          type: 'text',
          text: JSON.stringify({
            lessons: [{
              kind: 'procedure',
              title: '整理经验时保留根因说明（修订版）',
              action: '写入经验时附上 rationale 根因字段',
              when: '整理和提交新经验时',
              rationale: '避免跨模型失去上下文',
              relatedLessonId: acceptedId,
              relation: 'supersede',
              exceptions: [],
              sourceSeq: 11,
              quote,
            }],
          }),
        },
      }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  })

  const store = h.store()
  const accepted = seedAcceptedLesson(store, {
    seedKey: 'sim-usable',
    title: '整理经验时写清动作',
    action: '简短写出动作',
    when: '整理经验时',
    problemKey: 'prob-doc-quality',
    workspaceRoot: h.project,
  })
  acceptedId = accepted.id
  const rejectedRaw = store.createLesson({
    kind: 'preference',
    title: '总是打印完整调试日志',
    action: '每次都输出全量日志',
    when: '调试时',
    workspaceRoot: h.project,
    global: false,
    evidence: [],
  }, 'sim-rej-seed', { requireReview: true }).lesson
  store.reviewLesson(rejectedRaw.id, 'rejected', rejectedRaw.revision, 'sim-rej-review', 'human', '太泛且噪声太大')

  // Verify sessionLogDeepSeek.registerExclusion excludes active aux calls
  let exclusionFn
  const detachLog = h.runtime.attachSessionLogDeepSeek({
    registerExclusion(fn) { exclusionFn = fn; return () => { exclusionFn = undefined } },
  })
  t.after(detachLog)
  assert.equal(typeof exclusionFn, 'function')
  assert.equal(exclusionFn({ sessionId: 'other', purpose: 'dsh-dream-aux' }), true)
  assert.equal(exclusionFn({ sessionId: h.session.id }), false)

  // Verify simDirectory output directly
  const dir = simDirectory(store.listLessons(), { workspaceRoot: h.project })
  assert.equal(dir.usable.length, 1)
  assert.equal(dir.history.length, 1)
  assert.equal(dir.history[0].state, 'rejected')
  assert.match(dir.history[0].reason, /太泛/)

  h.send('turn/start', { turn: 1 })
  h.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: quote }] })
  h.send('tool/call', { name: 'bash', arguments: '{}' })
  h.send('tool/call', { name: 'read', arguments: '{}' })
  h.send('assistant/message', { message: { id: 'asst-sim', role: 'assistant', content: [{ type: 'text', text: '明白，后续整理会附带根因说明。' }] } })
  h.send('turn/end', { reason: { kind: 'completed' } })
  await h.runtime.whenIdle()

  const revised = store.listLessons().find((item) => item.title.includes('修订版'))
  assert.ok(revised)
  assert.deepEqual(revised.supersedes, [acceptedId])
  assert.equal(revised.problemKey, 'prob-doc-quality', 'inherits problemKey from related lesson when omitted')

  // Same-fingerprint merge preserves/enriches SIM fields
  const merged = store.createLesson({
    kind: 'procedure',
    title: '整理经验时写清动作',
    action: '简短写出动作',
    when: '整理经验时',
    rationale: '补充新的根因说明',
    files: ['src/memory.ts'],
    workspaceRoot: h.project,
    global: false,
    evidence: [{ kind: 'session', sessionId: 'sess-merge', recordSeq: 2, summary: '补充来源', verification: 'read', sourceHash: 'b'.repeat(64) }],
  }, 'sim-merge-key', { requireReview: true })
  assert.equal(merged.created, false)
  assert.equal(merged.lesson.id, acceptedId)
  assert.equal(merged.lesson.rationale, '补充新的根因说明')
  assert.deepEqual(merged.lesson.files, ['src/memory.ts'])

  // Tight autoMaxInputChars: gracefully drops/trims existingMemory without dropping valid extraction
  // (SYSTEM prompt is ~941 chars; budget 1300 leaves ~359 chars — enough for sourceMessages, too small for 12-lesson existingMemory)
  const tight = makeAutomaticHarness(t, {
    autoMaxInputChars: 1300,
    output: { lessons: [] },
  })
  const tightStore = tight.store()
  for (let i = 0; i < 12; i++) {
    seedAcceptedLesson(tightStore, {
      seedKey: 'tight-' + i,
      title: `很长的既有规则标题第 ${i} 条 ${'详细说明'.repeat(12)}`,
      action: '执行检查',
      when: '构建项目时',
      workspaceRoot: tight.project,
    })
  }
  tight.send('turn/start', { turn: 1 })
  tight.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: '请记住短规则：提交前运行类型检查。' }] })
  tight.send('assistant/message', { message: { id: 'asst-tight', role: 'assistant', content: [{ type: 'text', text: '好的，会先运行类型检查。' }] } })
  tight.send('turn/end', { reason: { kind: 'completed' } })
  await tight.runtime.whenIdle()
  assert.equal(tight.calls.length, 1, 'tight budget must trim/drop existingMemory rather than failing with input-limit')
  assert.ok(tight.calls[0].messages[0].content[0].text.length <= 1300)
  assert.equal(JSON.parse(tight.calls[0].messages[0].content[0].text).existingMemory, undefined, 'existingMemory dropped when budget is tight')
})

// ---------------------------------------------------------------------------
// 7. Pure in-memory BM25/IDF retrieval & rankInversionCount === 0
// ---------------------------------------------------------------------------

test('7. BM25/IDF ranks rare technical terms above CJK/English boilerplate while keeping rankInversionCount === 0', () => {
  const base = {
    schemaVersion: 1,
    revision: 1,
    kind: 'procedure',
    exceptions: [],
    scope: { global: true },
    applicability: [],
    state: 'usable',
    evidenceIds: [],
    independentSupportCount: 1,
    review: { decision: 'accepted', actor: 'human' },
    createdAt: '2026-11-20T00:00:00.000Z',
    updatedAt: '2026-11-20T00:00:00.000Z',
    conflictIds: [],
  }

  // 8 boilerplate lessons containing common words "项目", "配置文件", "处理", "修复"
  const boilerplateLessons = Array.from({ length: 8 }, (_, i) => ({
    ...base,
    id: `lsn_boiler_${i}`,
    title: `项目配置文件处理与修复规范 ${i}`,
    when: '处理项目配置文件问题并修复时',
    action: '检查项目配置文件并修复常见配置问题',
  }))

  // 1 targeted lesson with rare technical token "ECONNRESET" & "keepalive"
  const rareLesson = {
    ...base,
    id: 'lsn_rare_econnreset',
    title: '排查 ECONNRESET 连接重置',
    when: '上游代理断开引发 ECONNRESET 时',
    action: '调整 keepalive 超时并重试幂等请求',
    rationale: '代理空闲回收导致 ECONNRESET',
  }

  const all = [...boilerplateLessons, rareLesson]
  const res = retrieveLessons(all, [], {
    query: '处理项目配置文件修复 ECONNRESET 连接问题',
    limit: 10,
    maxChars: 20000,
  })
  assert.equal(res.items[0].lessonId, 'lsn_rare_econnreset', 'rare technical term ECONNRESET must outrank boilerplate')

  // Verify rankInversionCount === 0 under tight budget stop
  const rankedIds = res.items.map((item) => item.lessonId)
  const constrained = retrieveLessons(all, [], {
    query: '处理项目配置文件修复 ECONNRESET 连接问题',
    limit: 10,
    maxChars: 120,
  })
  assert.equal(rankInversionCount(rankedIds, constrained), 0, 'rankInversionCount must remain strictly 0')
})

// ---------------------------------------------------------------------------
// 8. Bridge Source Retention + semanticDiff
// ---------------------------------------------------------------------------

test('8. Bridge retains previously applied rules and computes semanticDiff (retained / added / revised / evicted)', (t) => {
  const env = makeTempEnv(t)
  const store = env.store()

  const a = seedAcceptedLesson(store, {
    seedKey: 'br-a',
    title: '核心规范 A：保留人工段落',
    action: '只改管理块',
    when: '更新 AGENTS.md 时',
    rationale: '防止误删手工规则',
    workspaceRoot: env.project,
  })
  const b = seedAcceptedLesson(store, {
    seedKey: 'br-b',
    title: '核心规范 B：先跑单测',
    action: '先跑 npm test',
    when: '代码修改后',
    rationale: '避免低级回归',
    workspaceRoot: env.project,
  })
  const oldEvict = seedAcceptedLesson(store, {
    seedKey: 'br-evict',
    title: '临时规则 E：即将淘汰',
    action: '临时检查旧脚本',
    when: '过渡期构建时',
    rationale: '旧脚本已下线',
    workspaceRoot: env.project,
  })

  // Initial apply with [a, b, oldEvict]
  const p1 = previewBridge({
    projectRoot: env.project,
    journalDir: env.journalDir,
    lessons: store.listLessons(),
    workspaceRoot: env.project,
    maxLessons: 3,
  })
  assert.equal(p1.ok, true)
  assert.equal(p1.semanticDiff.added.length, 3)
  assert.equal(p1.semanticDiff.retained.length, 0)

  const app1 = applyBridge({
    projectRoot: env.project,
    journalDir: env.journalDir,
    lessons: store.listLessons(),
    workspaceRoot: env.project,
    maxLessons: 3,
    expectedSha256: p1.expected.sha256,
    previewId: p1.previewId,
  })
  assert.equal(app1.ok, true)

  // Now:
  // - Revise B (bump revision via recordFeedback or update)
  store.updateLesson(b.id, { action: '先跑 npm test 和 typecheck' }, b.revision, 'revise-b')
  // - Mark oldEvict stale so it gets evicted
  store.reviewLesson(oldEvict.id, 'rejected', oldEvict.revision, 'reject-evict', 'human', '已废弃')
  // - Add 3 brand-new higher-timestamp rules C, D, F with high support
  const c = seedAcceptedLesson(store, {
    seedKey: 'br-c',
    title: '新增规则 C：补齐 i18n',
    action: '新增文案同步 8 种语言',
    when: '修改界面文案时',
    rationale: '保证多语言一致',
    workspaceRoot: env.project,
  })
  seedAcceptedLesson(store, {
    seedKey: 'br-d',
    title: '新增规则 D：次要样式',
    action: '保持样式简洁',
    when: '调整样式时',
    workspaceRoot: env.project,
  })

  // Preview with maxLessons: 3 -> Source Retention keeps A & B anchored, adds 1 new rule, evicts oldEvict
  const p2 = previewBridge({
    projectRoot: env.project,
    journalDir: env.journalDir,
    lessons: store.listLessons(),
    workspaceRoot: env.project,
    maxLessons: 3,
  })
  assert.equal(p2.ok, true)
  assert.ok(p2.semanticDiff, 'semanticDiff must be present on preview')
  assert.equal(p2.semanticDiff.previousBackupId, app1.backupId)
  assert.deepEqual(p2.semanticDiff.retained.map((x) => x.lessonId), [a.id], 'previously applied rule A stays retained')
  assert.deepEqual(p2.semanticDiff.revised.map((x) => x.lessonId), [b.id], 'updated previously applied rule B shows as revised')
  assert.equal(p2.semanticDiff.revised[0].previousRevision, b.revision)
  assert.equal(p2.semanticDiff.added.length, 1, '1 open slot filled by a new rule')
  assert.deepEqual(p2.semanticDiff.evicted.map((x) => x.lessonId), [oldEvict.id])
  assert.equal(p2.semanticDiff.evicted[0].rationale, '旧脚本已下线')

  // Also test selectBridgeLessons retainedIds priority directly
  const sel = selectBridgeLessons([c, a], { workspaceRoot: env.project }, { maxLessons: 1, retainedIds: new Set([a.id]) })
  assert.deepEqual(sel.eligible.map((x) => x.id), [a.id])
})

// ---------------------------------------------------------------------------
// 9. Native DSH slash commands (mock + real DSH 0.2.2-rc.3 CommandRuntime)
// ---------------------------------------------------------------------------

test('9a. installDreamCommands registers /dream, /dream-learn, /dream-status, enforces human boundary and disposes cleanly', async (t) => {
  const env = makeTempEnv(t)
  const registered = new Map()
  let effectCleanup
  const ctx = {
    inject(services, cb) {
      assert.deepEqual(services, ['commands'])
      cb({
        commands: {
          register(def) {
            registered.set(def.name, def)
            return () => { registered.delete(def.name) }
          },
        },
        effect(fn) { effectCleanup = fn() },
      })
    },
  }
  installDreamCommands(ctx, env.cfg)
  assert.deepEqual([...registered.keys()].sort(), ['dream', 'dream-learn', 'dream-status'])

  const followups = []
  const fakeAgent = {
    session: { id: 'cmd-sess', header: { cwd: env.project, agentPreset: 'code' } },
    model: { current: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) },
    followup(msg) { followups.push(msg) },
  }

  // /dream-status on empty dir is strictly read-only (does NOT create knowledge directory!)
  const statusRes = await registered.get('dream-status').handler({ agent: fakeAgent, rawInput: '' })
  assert.equal(statusRes.kind, 'success')
  assert.match(statusRes.text, /Dream 状态摘要/)
  assert.match(statusRes.text, /关闭（默认）/)
  assert.equal(existsSync(join(env.journalDir, 'knowledge')), false, '/dream-status must be zero-write-on-read')

  // /dream queues a followup UserMessage
  const dreamRes = await registered.get('dream').handler({ agent: fakeAgent, rawInput: 'bridge 稳定性' })
  assert.equal(dreamRes.kind, 'success')
  assert.equal(followups.length, 1)
  assert.equal(followups[0].role, 'user')
  assert.equal(followups[0].source.kind, 'user')
  assert.match(followups[0].content[0].text, /bridge 稳定性/)

  // /dream-learn with text creates a CANDIDATE (never auto-promoted, secrets masked, origin preserved)
  const learnRes = await registered.get('dream-learn').handler({
    commandId: 'cmd-101',
    agent: fakeAgent,
    rawInput: '部署前先检查环境变量 token=sk-commandsecret9876543210abcd',
  })
  assert.equal(learnRes.kind, 'success')
  assert.match(learnRes.text, /candidate/)
  const [saved] = env.store().listLessons()
  assert.equal(saved.state, 'candidate')
  assert.equal(saved.review.decision, 'unreviewed')
  assert.deepEqual(saved.origin, { provider: 'deepseek', model: 'deepseek-chat', agentPreset: 'code' })
  assert.doesNotMatch(saved.action, /sk-commandsecret9876543210abcd/)
  assert.equal(existsSync(join(env.project, 'AGENTS.md')), false)

  // /dream-learn with empty input queues extraction followup
  const learnEmpty = await registered.get('dream-learn').handler({ agent: fakeAgent, rawInput: '   ' })
  assert.equal(learnEmpty.kind, 'success')
  assert.equal(followups.length, 2)

  // Dispose unregisters all 3 commands
  effectCleanup()
  assert.equal(registered.size, 0)
})

test('9b. Real DSH 0.2.2-rc.3 CommandRuntime validates and lists /dream, /dream-learn, /dream-status', { skip: !HAS_REAL_DSH }, async (t) => {
  const req = createRequire(join(DSH_HARNESS_ROOT, 'packages', 'interaction', 'commands', 'package.json'))
  const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
  const { default: SessionStore, SessionId } = await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-session')).href)
  const { CommandRuntime } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'interaction', 'commands', 'lib', 'index.js')).href)

  const env = makeTempEnv(t)
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(CommandRuntime)
  t.after(() => ctx.stop?.())

  const disposers = buildDreamCommands(env.cfg).map((def) => ctx.commands.register(def))
  const session = ctx.sessions.create(SessionId('real-cmd-sess'))
  const agent = { id: session.id, session }
  const listed = ctx.commands.list(agent).map((d) => d.name)
  assert.deepEqual(listed, ['dream', 'dream-learn', 'dream-status'])

  for (const off of disposers) off()
  assert.deepEqual(ctx.commands.list(agent), [])
})

// ---------------------------------------------------------------------------
// 10. sessionQuery bridge (live-preferred + model metadata + disk fallback)
// ---------------------------------------------------------------------------

test('10. sessionQuery bridge prefers live sessions, extracts model metadata on verify, and falls back to disk', async (t) => {
  const env = makeTempEnv(t)

  // Seed one disk session for fallback tests (<sessionsRoot>/<proj>/<sessionId>/session.jsonl.zstd)
  const diskSessDir = join(env.sessionsRoot, 'proj-disk', 'sess-disk')
  mkdirSync(diskSessDir, { recursive: true })
  const diskQuote = '磁盘会话里的唯一确认句子'
  writeFileSync(join(diskSessDir, 'session.jsonl.zstd'), makeSessionFile([
    makeHeader('sess-disk', { cwd: env.project, agentPreset: 'disk-preset' }),
    makeEvent('session/title', 0, '磁盘会话标题'),
    makeEvent('turn/start', 1, {}),
    makeEvent('user/message', 2, diskQuote),
    makeEvent('assistant/message', 3, '已在磁盘记录'),
    makeEvent('turn/end', 4, {}),
  ]))

  // Test installSessionQueryBridge lifecycle
  let bridgeDispose
  const mockQuery = {
    async listSessions() {
      return [
        { header: { type: 'session', id: 'sess-sub', origin: 'subagent', cwd: env.project } },
        { header: { type: 'session', id: 'sess-live', cwd: env.project, agentPreset: 'live-preset', createdAt: 1786646790597 } },
      ]
    },
    async readSession(sessionId) {
      if (sessionId !== 'sess-live') return undefined
      return {
        session: { type: 'session', version: 4, id: 'sess-live', cwd: env.project, agentPreset: 'live-preset', createdAt: 1786646790597 },
        events: [
          { type: 'session/title', seq: 0, time: 1000, data: '实时活跃会话' },
          { type: 'request/context', seq: 1, time: 1001, data: { provider: 'deepseek', model: 'deepseek-reasoner' } },
          { type: 'turn/start', seq: 2, time: 1002, data: { turn: 1 } },
          { type: 'user/message', seq: 3, time: 1003, data: { source: { kind: 'runtime-context' }, content: [{ type: 'text', text: '内部注入上下文' }] } },
          { type: 'user/message', seq: 4, time: 1004, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '实时未刷盘的用户纠正句子' }] } },
          { type: 'assistant/message', seq: 5, time: 1005, data: { content: [{ type: 'text', text: '明白，已按最新规则调整。' }] } },
          { type: 'turn/end', seq: 6, time: 1006, data: { reason: { kind: 'completed' } } },
        ],
      }
    },
  }
  installSessionQueryBridge({
    inject(services, cb) {
      assert.deepEqual(services, ['sessionQuery'])
      cb({ sessionQuery: mockQuery, effect(fn) { bridgeDispose = fn() } })
    },
  })
  assert.equal(getSessionQuery(), mockQuery)

  // Live-preferred digest skips subagent & skips runtime-context pseudo-user message
  const liveDigests = await digestSessionsWithFallback(env.cfg, 5)
  assert.equal(liveDigests.length, 1)
  assert.equal(liveDigests[0].id, 'sess-live')
  assert.equal(liveDigests[0].title, '实时活跃会话')
  assert.deepEqual(liveDigests[0].userMessages, ['实时未刷盘的用户纠正句子'])

  // Live verifyEvidenceWithSessionQuery extracts provider / model / agentPreset
  const verifiedLive = await verifyEvidenceWithSessionQuery(
    { kind: 'user-correction', sessionId: 'sess-live', recordSeq: 4, summary: '实时未刷盘的用户纠正句子', verification: 'read' },
    { sessionsRoot: env.sessionsRoot, workspaceRoot: env.project },
  )
  assert.equal(verifiedLive.verification, 'read')
  assert.equal(verifiedLive.provider, 'deepseek')
  assert.equal(verifiedLive.model, 'deepseek-reasoner')
  assert.equal(verifiedLive.agentPreset, 'live-preset')
  assert.equal(verifiedLive.verificationReason, 'source-verified')

  // Session absent in live sessionQuery falls back cleanly to disk verifyEvidence
  const verifiedDisk = await verifyEvidenceWithSessionQuery(
    { kind: 'session', sessionId: 'sess-disk', recordSeq: 2, summary: diskQuote, verification: 'read' },
    { sessionsRoot: env.sessionsRoot, workspaceRoot: env.project },
  )
  assert.equal(verifiedDisk.verification, 'read')

  // Erroring sessionQuery falls back seamlessly to disk digest
  const restoreErr = setSessionQueryForTest({
    async listSessions() { throw new Error('query backend down') },
    async readSession() { throw new Error('query backend down') },
  })
  try {
    const fallbackDigests = await digestSessionsWithFallback(env.cfg, 5)
    assert.equal(fallbackDigests.length, 1)
    assert.equal(fallbackDigests[0].id, 'sess-disk')
  } finally {
    restoreErr()
  }

  // Dispose clears bridge cleanly
  bridgeDispose()
  assert.equal(getSessionQuery(), undefined)
})

// ---------------------------------------------------------------------------
// 11. Opt-in agent/turn-stopping Verification Gate
// ---------------------------------------------------------------------------

test('11. Opt-in verification gate is OFF by default, skips read-only turns, and steers at most once per turn with valid DSH notice', async (t) => {
  const h = makeAutomaticHarness(t)
  assert.equal(h.cfg.enableVerificationGate, false)
  assert.equal(h.runtime.status().verificationGateEnabled, false)

  const store = h.store()
  const rule = seedAcceptedLesson(store, {
    seedKey: 'gate-rule',
    kind: 'pitfall',
    title: '修改 automatic.ts 前必须确认 interpolate: false',
    action: '核对 systemPrompt.context 注册与单测回归',
    when: '修改 automatic.ts 时',
    prevents: '模板插值崩溃',
    files: ['src/automatic.ts'],
    workspaceRoot: h.project,
  })
  // Unreviewed candidate must never enter verification gate
  store.createLesson({
    kind: 'pitfall',
    title: '未审阅候选不应触发门控',
    action: '不应出现',
    when: '任何时候',
    files: ['src/automatic.ts'],
    workspaceRoot: h.project,
    global: false,
    evidence: [],
  }, 'gate-unreviewed', { requireReview: true })

  const detachTools = h.runtime.attachTools({ tools: {}, on: h.host.on })
  t.after(detachTools)

  // (a) Default OFF: even with file change, turn-stopping does NOT steer
  h.send('turn/start', { turn: 1 })
  await h.emit('tools/result', { name: 'edit', arguments: JSON.stringify({ file_path: join(h.project, 'src/automatic.ts') }), agent: h.agent }, { isError: false })
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 1, signal: new AbortController().signal })
  assert.equal(h.steered.length, 0, 'verification gate MUST NOT fire when disabled (default)')
  h.send('turn/end', { reason: { kind: 'completed' } })

  // Enable verification gate via control()
  h.runtime.control({ verificationGateEnabled: true })
  assert.equal(h.runtime.status().verificationGateEnabled, true)

  // (b) ON, but pure Q&A / read-only turn (no mutating file changes) -> MUST NOT fire
  h.send('turn/start', { turn: 2 })
  await h.emit('tools/result', { name: 'read', arguments: JSON.stringify({ file_path: join(h.project, 'src/automatic.ts') }), agent: h.agent }, { isError: false })
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 2, signal: new AbortController().signal })
  assert.equal(h.steered.length, 0, 'verification gate MUST NOT fire on turns without file modifications')
  h.send('turn/end', { reason: { kind: 'completed' } })

  // (c) ON + file modification -> fires ONCE with valid DSH UserMessage notice (summary <= 120), NEVER twice in same turn
  h.send('turn/start', { turn: 3 })
  await h.emit('tools/result', { name: 'edit', arguments: JSON.stringify({ file_path: join(h.project, 'src/automatic.ts') }), agent: h.agent }, { isError: false })
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 3, signal: new AbortController().signal })
  assert.equal(h.steered.length, 1)
  const notice = h.steered[0]
  assert.equal(notice.role, 'user')
  assert.equal(typeof notice.id, 'string')
  assert.ok(notice.id.length > 0)
  assert.equal(notice.source.kind, 'dsh-dream-gate')
  assert.equal(notice.source.form, 'notice')
  assert.ok(notice.source.summary.length > 0 && notice.source.summary.length <= 120)
  assert.match(notice.content[0].text, new RegExp(rule.id))
  assert.doesNotMatch(notice.content[0].text, /未审阅候选不应触发门控/)

  // Second turn-stopping in SAME turn must be ignored (hard cap = 1 per turn)
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 3, signal: new AbortController().signal })
  assert.equal(h.steered.length, 1, 'verification gate MUST fire at most once per turn')
  h.send('turn/end', { reason: { kind: 'completed' } })

  // Direct unit check on buildVerificationGateMessage summary cap even with long filenames
  const longMsg = buildVerificationGateMessage([rule], Array.from({ length: 10 }, (_, i) => `very/long/path/segment_${i}/file.ts`))
  assert.ok(longMsg.source.summary.length <= 120)
  assert.equal(selectVerificationGateLessons(store.listLessons(), { workspaceRoot: h.project, activeFiles: ['src/automatic.ts'] }).length, 1)
})

test('11b. installAutomaticDream never reads uninjected Cordis proxy properties on core inject', (t) => {
  const env = makeTempEnv(t)
  const registeredContexts = []
  const strictProxy = (allowed, target) => new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === 'string' && !allowed.has(prop) && !['on', 'effect', 'dispose', 'then'].includes(prop)) {
        throw new Error(`cannot get property "${prop}" without inject`)
      }
      return Reflect.get(obj, prop, receiver)
    },
  })
  const services = {
    sessions: {},
    agents: {},
    llm: { async *stream() {} },
    systemPrompt: { context(p) { registeredContexts.push(p); return () => {} } },
    workingDirectory: { get: () => env.project },
    workspaceRegistry: { async resolveByPath() { return { id: 'ws-strict' } } },
    workspaceChanges: { summary: () => undefined },
    messageFeedback: {},
    sessionLogDeepSeek: { registerExclusion: () => () => {} },
    tools: {},
  }
  const disposers = []
  const ctx = {
    effect(fn) { disposers.push(fn()) },
    on() { return () => {} },
    inject(names, cb) {
      const allowed = new Set(names)
      const scoped = { on: () => () => {}, effect(fn) { disposers.push(fn()) } }
      for (const n of names) scoped[n] = services[n]
      cb(strictProxy(allowed, scoped))
    },
  }
  t.after(() => { for (const d of disposers) if (typeof d === 'function') d() })

  assert.doesNotThrow(() => installAutomaticDream(ctx, env.cfg))
  assert.equal(registeredContexts.length, 1)
  assert.equal(registeredContexts[0].name, 'dsh-dream-reviewed-memory')
  assert.equal(registeredContexts[0].interpolate, false)
})

// ---------------------------------------------------------------------------
// 12. Web API, Web Actions, built lib/client.js & 8-locale i18n integrity
// ---------------------------------------------------------------------------

test('12a. Web knowledge API projects SIM fields, observations, reviewSignal, evolution and masks secrets', async (t) => {
  const h = makeAutomaticHarness(t)
  const store = h.store()
  const base = seedAcceptedLesson(store, {
    seedKey: 'web-base',
    title: '旧版桥接规范',
    action: '直接检查 AGENTS.md',
    when: '桥接时',
    rationale: '根因说明 token=sk-websecret1234567890abcdef',
    problemKey: 'prob-bridge-web',
    files: ['src/bridge.ts'],
    prevents: '覆盖手工段落',
    origin: { provider: 'deepseek', model: 'deepseek-reasoner', agentPreset: 'code' },
    workspaceRoot: h.project,
  })
  const newer = seedAcceptedLesson(store, {
    seedKey: 'web-new',
    title: '新版桥接规范',
    action: '先 preview 再 apply',
    when: '桥接时',
    problemKey: 'prob-bridge-web',
    supersedes: [base.id],
    carriedFrom: { lessonId: base.id, model: 'deepseek-chat' },
    workspaceRoot: h.project,
  })

  // Record 2 negative observations -> triggers advisory reviewSignal
  recordLessonObservation(h.cfg, [base.id], { kind: 'negative', model: 'deepseek-chat', note: '第一次不适用' }, h.now())
  recordLessonObservation(h.cfg, [base.id], { kind: 'negative', model: 'deepseek-chat', note: '第二次不适用' }, h.now() + 1000)

  const handler = createKnowledgeWebHandler({ journalDir: h.journalDir, config: h.cfg })
  const res = { status: 0, headers: {}, body: '', writeHead(s, hd) { this.status = s; this.headers = hd }, end(b) { this.body = String(b) } }
  await handler({ method: 'GET', url: DREAM_KNOWLEDGE_ROUTE, headers: { host: '127.0.0.1:5173' }, socket: { remoteAddress: '127.0.0.1' } }, res)
  assert.equal(res.status, 200)
  const payload = JSON.parse(res.body)
  assert.doesNotMatch(res.body, /sk-websecret1234567890abcdef/)

  const baseView = payload.lessons.find((l) => l.id === base.id)
  const newView = payload.lessons.find((l) => l.id === newer.id)
  assert.ok(baseView && newView)
  assert.deepEqual(baseView.origin, { provider: 'deepseek', model: 'deepseek-reasoner', agentPreset: 'code' })
  assert.deepEqual(baseView.files, ['src/bridge.ts'])
  assert.equal(baseView.prevents, '覆盖手工段落')
  assert.equal(baseView.observations.negative, 2)
  assert.equal(baseView.reviewSignal.flagged, true)
  assert.equal(baseView.reviewSignal.reason, 'native-negative-feedback')
  assert.deepEqual(baseView.evolution.supersededBy, [newer.id])
  assert.deepEqual(baseView.evolution.relatedByProblemKey, [newer.id])
  assert.deepEqual(newView.evolution.supersedes, [base.id])
  assert.equal(newView.carriedFrom.lessonId, base.id)

  // Web action handler validates & persists verificationGateEnabled
  const actionHandler = createDreamActionHandler({ config: h.cfg })
  const post = (body) => actionHandler(new Request('http://127.0.0.1' + DREAM_ACTION_ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-dream-action': '1', origin: 'http://127.0.0.1' },
    body: JSON.stringify(body),
  }))
  assert.equal((await post({ operation: 'automatic', verificationGateEnabled: 'yes' })).status, 400)
  const okResp = await post({ operation: 'automatic', verificationGateEnabled: true })
  assert.equal(okResp.status, 200)
  const okBody = await okResp.json()
  assert.equal(okBody.automatic.verificationGateEnabled, true)
  assert.equal(typeof okBody.automatic.observationsCount, 'number')
  assert.equal(typeof okBody.automatic.dshFeatures, 'object')
  assert.equal(readAutomaticState(h.cfg, h.now()).verificationGateEnabled, true)
})

test('12b. templates/i18n.js has complete 7-language arrays for every key and built lib/client.js parses cleanly', () => {
  const i18nSrc = readFileSync(new URL('../templates/i18n.js', import.meta.url), 'utf8')
  const sandbox = { window: { localStorage: { getItem: () => null, setItem() {}, removeItem() {} } } }
  runInNewContext(i18nSrc + '\nthis.__EXPORT__ = { DREAM_MESSAGES, DREAM_TRANSLATION_ORDER };', sandbox)
  const { DREAM_MESSAGES, DREAM_TRANSLATION_ORDER } = sandbox.__EXPORT__

  assert.equal(DREAM_TRANSLATION_ORDER.length, 7)
  const keys = Object.keys(DREAM_MESSAGES)
  assert.ok(keys.length > 100)
  for (const key of keys) {
    const row = DREAM_MESSAGES[key]
    assert.ok(Array.isArray(row), `i18n key ${JSON.stringify(key)} must map to an array`)
    assert.equal(row.length, 7, `i18n key ${JSON.stringify(key)} must have exactly 7 translations`)
    for (let i = 0; i < 7; i++) {
      assert.equal(typeof row[i], 'string', `i18n key ${JSON.stringify(key)}[${i}] must be a string`)
      assert.ok(row[i].trim().length > 0, `i18n key ${JSON.stringify(key)}[${i}] must be non-empty`)
    }
  }

  // Verify every new SIM / DSH integration UI key is covered in DREAM_MESSAGES
  for (const requiredKey of [
    '语义变更摘要', '保留', '新增', '修订', '移除',
    '模型来源', '建议复核', '制定理由', '预期预防', '关联文件',
    '原生反馈观测', '演化与溯源', '完成前核验门控（实验）', 'DSH 原生集成',
  ]) {
    assert.ok(Object.hasOwn(DREAM_MESSAGES, requiredKey), `missing i18n key: ${requiredKey}`)
  }

  // Built lib/client.js parses with zero syntax errors and includes the new sections
  const clientBundle = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.doesNotThrow(() => new Function(clientBundle), 'lib/client.js must parse cleanly as valid JS')
  assert.match(clientBundle, /data-dream-dsh-features/)
  assert.match(clientBundle, /data-dream-slash-commands/)
  assert.match(clientBundle, /data-dream-observations/)
  assert.match(clientBundle, /verificationGateEnabled/)
})

test('12c. dream_learn / dream_context / dream_bridge tools preserve additive SIM fields and zero-write-on-read', async (t) => {
  const env = makeTempEnv(t)
  const tools = buildDreamTools(env.cfg)
  const tool = (name) => tools.find((item) => item.name === name)

  // dream_context on empty dir is strictly zero-write-on-read
  const emptyCtx = await tool('dream_context').execute({ query: '测试', activeFiles: ['src/tools.ts'], currentModel: 'deepseek-chat' })
  assert.deepEqual(emptyCtx.items, [])
  assert.equal(existsSync(join(env.journalDir, 'knowledge')), false)

  // dream_learn accepts SIM fields and keeps human-review boundary
  const learned = await tool('dream_learn').execute({
    kind: 'pitfall',
    title: '工具输出字段只增不减',
    action: '扩展工具返回值时保留既有顶层字段',
    when: '修改 src/tools.ts 返回值时',
    rationale: '保证 legacy-tool-keys 兼容测试不破',
    problemKey: 'prob-tool-compat',
    files: ['src/tools.ts'],
    prevents: '破坏旧版客户端解析',
    origin: { provider: 'deepseek', model: 'deepseek-reasoner', agentPreset: 'code' },
    workspaceRoot: env.project,
    projectId: 'proj-tools',
  })
  assert.equal(learned.state, 'candidate')
  const store = env.store()
  const row = store.getLesson(learned.lessonId)
  assert.equal(row.rationale, '保证 legacy-tool-keys 兼容测试不破')
  assert.deepEqual(row.files, ['src/tools.ts'])
  assert.equal(row.origin.model, 'deepseek-reasoner')

  // Accept as human and recall via dream_context with activeFiles + different currentModel
  store.reviewLesson(row.id, 'accepted', row.revision, 'accept-tool-test', 'human')
  const recalled = await tool('dream_context').execute({
    query: '检查兼容性',
    projectId: 'proj-tools',
    activeFiles: ['src/tools.ts'],
    currentModel: 'deepseek-chat',
  })
  assert.equal(recalled.items.length, 1)
  assert.equal(recalled.items[0].rationale, '保证 legacy-tool-keys 兼容测试不破')
  assert.equal(recalled.items[0].originModel, 'deepseek-reasoner')
  assert.equal(recalled.items[0].modelMismatch, true)
  assert.match(recalled.items[0].whyRelevant, /关联文件「src\/tools\.ts」/)

  const renderedText = tool('dream_context').output.render({}, recalled)[0].text
  assert.match(renderedText, /根因：/)
  assert.match(renderedText, /来源模型：deepseek-reasoner（与当前模型不同/)
})
