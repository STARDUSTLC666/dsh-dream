/**
 * DeepSeek Harness 0.2.2-rc.3 deep native adaptation, hardened redaction,
 * and hybrid BM25F retrieval verification suite.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  AutomaticDream,
  KnowledgeStore,
  buildDigestText,
  buildDreamCommands,
  buildDreamTools,
  digestSessionFile,
  digestSessionFromEvents,
  digestSessionsWithFallback,
  extractDreamReferences,
  extractToolFilePaths,
  getSessionQuery,
  hasSessionQuerySearch,
  installDreamCommands,
  installSessionQueryBridge,
  isMutatingFileTool,
  journalFile,
  maskSecrets,
  rankInversionCount,
  resolveConfig,
  retrieveLessons,
  saveDream,
  searchDreams,
  setSessionQueryForTest,
  verifyEvidenceWithSessionQuery,
} from '../lib/index.js'
import { verifyEvidence } from '../lib/evidence.js'
import { readAutomaticState } from '../lib/automatic-state.js'
import { makeEvent, makeHeader, makeSessionFile } from './helpers.mjs'

const DSH_HARNESS_ROOT = process.env.DSH_HARNESS_ROOT || 'C:\\Users\\29022\\deepseek-harness'
const HAS_REAL_DSH_TOOLS = existsSync(join(DSH_HARNESS_ROOT, 'packages', 'core', 'tools', 'lib', 'index.js'))
  && existsSync(join(DSH_HARNESS_ROOT, 'packages', 'core', 'tools', 'lib', 'pipeline.js'))
  && existsSync(join(DSH_HARNESS_ROOT, 'packages', 'core', 'system-prompt', 'lib', 'index.js'))
const HAS_REAL_DSH_SQLITE = existsSync(join(DSH_HARNESS_ROOT, 'packages', 'session-query', 'session-query-sqlite', 'lib', 'index.js'))
const HAS_REAL_DSH_COMMANDS = existsSync(join(DSH_HARNESS_ROOT, 'packages', 'interaction', 'commands', 'lib', 'index.js'))
const HAS_REAL_DSH_SESSION_LOG = existsSync(join(DSH_HARNESS_ROOT, 'packages', 'session', 'session-log-deepseek', 'lib', 'index.js'))
  && existsSync(join(DSH_HARNESS_ROOT, 'packages', 'llm', 'deepseek-llm-api-extensions', 'lib', 'index.js'))
const HAS_REAL_DSH_STR_REPLACE = HAS_REAL_DSH_TOOLS
  && existsSync(join(DSH_HARNESS_ROOT, 'packages', 'fs', 'fs-local', 'lib', 'index.js'))
  && existsSync(join(DSH_HARNESS_ROOT, 'packages', 'fs', 'tool-str-replace-editor', 'lib', 'index.js'))

function makeTempEnv(t, overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-dream-v2-'))
  const project = join(root, 'project')
  const subdir = join(project, 'packages', 'sub')
  const journalDir = join(root, 'journal')
  const sessionsRoot = join(root, 'sessions')
  mkdirSync(subdir, { recursive: true })
  const cfg = resolveConfig({
    journalDir,
    sessionsRoot,
    autoCooldownMs: 1000,
    autoIdleMs: 0,
    ...overrides,
  })
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return {
    root,
    project,
    subdir,
    journalDir,
    sessionsRoot,
    cfg,
    store: () => new KnowledgeStore(join(journalDir, 'knowledge')),
  }
}

let seedSeq = 1
function seedAcceptedLesson(store, fields) {
  const seq = fields.recordSeq ?? seedSeq++
  const created = store.createLesson({
    kind: fields.kind ?? 'procedure',
    title: fields.title,
    action: fields.action,
    when: fields.when,
    exceptions: fields.exceptions ?? [],
    ...(fields.rationale ? { rationale: fields.rationale } : {}),
    ...(fields.problemKey ? { problemKey: fields.problemKey } : {}),
    ...(fields.files ? { files: fields.files } : {}),
    ...(fields.prevents ? { prevents: fields.prevents } : {}),
    ...(fields.workspaceRoot ? { workspaceRoot: fields.workspaceRoot } : {}),
    ...(fields.projectId ? { projectId: fields.projectId } : {}),
    global: fields.global === true,
    evidence: fields.evidence ?? [{
      kind: 'session',
      sessionId: 'seed-sess-' + seq,
      recordSeq: seq,
      summary: fields.evidenceSummary ?? fields.title,
      verification: 'read',
      sourceHash: String(seq).padStart(64, 'a'),
    }],
  }, fields.seedKey ?? 'seed-' + Math.random().toString(36).slice(2), { requireReview: true }).lesson
  return store.reviewLesson(created.id, 'accepted', created.revision, 'accept-' + created.id, 'human')
}

function makeAutomaticHarness(t, { output = { lessons: [] }, ...config } = {}) {
  const env = makeTempEnv(t, config)
  let now = Date.parse('2026-11-27T04:00:00.000Z')
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
        yield { type: 'block-end', index: 0, block: { type: 'text', text: JSON.stringify(output) } }
        yield { type: 'finish', reason: { kind: 'stop' } }
      },
    },
  }

  let seq = 10
  const sessionEvents = []
  const session = {
    id: 'sess-main-v2',
    header: { type: 'session', version: 4, id: 'sess-main-v2', cwd: env.project, agentPreset: 'code' },
    requestContext: () => ({ provider: 'deepseek', model: 'deepseek-chat' }),
    snapshotEvents: () => [...sessionEvents],
  }
  const agent = {
    id: session.id,
    session,
    model: { current: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) },
  }

  const runtime = new AutomaticDream(env.cfg, () => now)
  const unregister = runtime.register()
  const detach = runtime.attach(host, { probeOptional: false })
  t.after(() => { detach(); unregister() })

  const send = (type, data, targetSession = session) => {
    const ev = { type, seq: seq++, time: now, data }
    if (targetSession === session) sessionEvents.push(ev)
    runtime.observe(targetSession, ev)
    return ev
  }

  return {
    ...env,
    host,
    runtime,
    session,
    agent,
    calls,
    contexts,
    sessionEvents,
    emit,
    send,
    now: () => now,
    advance: (ms) => { now += ms },
  }
}

// ---------------------------------------------------------------------------
// 1. Real DeepSeek Harness 0.2.2-rc.3 ToolsService + ToolExecutionPipeline
// ---------------------------------------------------------------------------

test('1. Real DSH 0.2.2-rc.3 ToolsService & ToolExecutionPipeline validate all 9 Dream tools (schema, parallel/exclusive mode, presentationMeta, presentCall, presentResult)', { skip: !HAS_REAL_DSH_TOOLS }, async (t) => {
  const req = createRequire(join(DSH_HARNESS_ROOT, 'packages', 'core', 'tools', 'package.json'))
  const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
  const { default: SystemPromptService } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'core', 'system-prompt', 'lib', 'index.js')).href)
  const { ToolsService } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'core', 'tools', 'lib', 'index.js')).href)
  const { ToolExecutionPipeline } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'core', 'tools', 'lib', 'pipeline.js')).href)

  const env = makeTempEnv(t)
  const ctx = new Context()
  await ctx.plugin(SystemPromptService)
  await ctx.plugin(ToolsService)
  t.after(async () => { await ctx.fiber.dispose() })

  const tools = buildDreamTools(env.cfg)
  assert.equal(tools.length, 9)
  const disposers = tools.map((def) => ctx.tools.register(def))
  t.after(() => { for (const off of disposers) off() })

  const pipeline = new ToolExecutionPipeline(ctx)
  const signal = new AbortController().signal

  // Verify parallel vs exclusive scheduling classification via real DSH ToolExecutionPipeline
  const parallelCases = [
    ['dream_context', { query: 'test' }],
    ['dream_recall', { query: 'test' }],
    ['dream_journal', { limit: 5 }],
    ['dream_digest', { maxSessions: 2 }],
    ['dream_health', {}],
    ['dream_bridge', {}],
    ['dream_bridge', { mode: 'preview' }],
  ]
  for (const [name, args] of parallelCases) {
    assert.deepEqual(
      pipeline.executionMode({ callId: 'c-' + name, name, arguments: args, signal }),
      { kind: 'parallel' },
      `${name}(${JSON.stringify(args)}) must be classified as parallel by DSH pipeline`,
    )
  }

  const exclusiveCases = [
    ['dream_save', { reflection: 'hello' }],
    ['dream_learn', { kind: 'fact', title: 't', action: 'a', when: 'w' }],
    ['dream_review', { action: 'accept', lessonId: 'lsn_1', expectedRevision: 1 }],
    ['dream_bridge', { mode: 'apply', expectedSha256: null }],
    ['dream_bridge', { mode: 'rollback', backupId: 'b1' }],
    ['dream_bridge', { mode: 123 }],
  ]
  for (const [name, args] of exclusiveCases) {
    assert.deepEqual(
      pipeline.executionMode({ callId: 'c-' + name, name, arguments: args, signal }),
      { kind: 'exclusive' },
      `${name}(${JSON.stringify(args)}) must be classified as exclusive by DSH pipeline`,
    )
  }

  // Verify presentCall masks secrets (including in locations!) and returns valid card: 'generic' views for all 9 tools
  for (const def of tools) {
    const sampleArgs = def.name === 'dream_context' ? { query: '检查 token sk-secretvalue1234567890abcdef', activeFiles: ['sk-secretvalue1234567890abcdef/mask.ts'] }
      : def.name === 'dream_recall' ? { query: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123def456' }
        : def.name === 'dream_learn' ? { kind: 'pitfall', title: '禁止泄露 sk-secretvalue1234567890abcdef', files: ['sk-secretvalue1234567890abcdef/mask.ts'] }
          : def.name === 'dream_bridge' ? { mode: 'preview', path: 'sk-secretvalue1234567890abcdef/AGENTS.md' }
            : {}
    const callView = def.presentCall(sampleArgs)
    assert.equal(callView?.card, 'generic', `${def.name}.presentCall must return generic card`)
    assert.equal(typeof callView?.title, 'string')
    assert.ok(callView.title.length > 0)
    assert.doesNotMatch(JSON.stringify(callView), /sk-secretvalue1234567890abcdef|eyJhbGciOiJIUzI1NiJ9/)
  }

  // Execute ALL 9 tools through real DSH pipeline (verifies lossless JSON output.schema + output.presentationMeta!)
  const runRealTool = async (name, args) => {
    const prep = await pipeline.prepare({ callId: 'run-' + name + '-' + Math.random(), name, arguments: args, signal })
    assert.equal(prep.kind, 'dispatch')
    const dispatched = await pipeline.dispatch(prep.exec)
    const completed = await pipeline.complete(prep.exec, dispatched)
    return completed
  }

  const seeded = seedAcceptedLesson(env.store(), {
    seedKey: 'pipeline-seed',
    title: '发版前执行完整测试',
    action: '运行 npm test',
    when: '准备发版时',
    workspaceRoot: env.project,
  })

  const healthRes = await runRealTool('dream_health', {})
  assert.equal(healthRes.isError, false)
  assert.equal(typeof healthRes.meta?.checkCount, 'number')
  assert.match(ctx.tools.get('dream_health').presentResult({}, healthRes)?.title ?? '', /Dream 自检/)

  const digestRes = await runRealTool('dream_digest', { maxSessions: 2 })
  assert.equal(digestRes.isError, false)
  assert.equal(digestRes.meta?.count, 0)
  assert.match(ctx.tools.get('dream_digest').presentResult({}, digestRes)?.title ?? '', /入梦：读取 0 个会话/)

  const saveRes = await runRealTool('dream_save', { reflection: '适配 DSH 工具展示卡片与并发安全', lessons: ['读工具声明并发安全'], mood: '清醒' })
  assert.equal(saveRes.isError, false)
  assert.equal(saveRes.meta?.ok, true)
  assert.match(ctx.tools.get('dream_save').presentResult({}, saveRes)?.title ?? '', /记梦已保存/)

  const journalRes = await runRealTool('dream_journal', { limit: 5 })
  assert.equal(journalRes.isError, false)
  assert.equal(journalRes.meta?.count, 1)
  assert.match(ctx.tools.get('dream_journal').presentResult({}, journalRes)?.title ?? '', /翻梦：读取 1 条/)

  const recallRes = await runRealTool('dream_recall', { query: '并发安全' })
  assert.equal(recallRes.isError, false)
  assert.equal(recallRes.meta?.count, 1)
  assert.match(ctx.tools.get('dream_recall').presentResult({ query: '并发安全' }, recallRes)?.title ?? '', /命中 1 条/)

  const learnRes = await runRealTool('dream_learn', { kind: 'fact', title: '流水线测试候选', action: '验证 JSON 输出', when: '工具自测时', workspaceRoot: env.project })
  assert.equal(learnRes.isError, false)
  assert.equal(learnRes.meta?.ok, true)
  assert.match(ctx.tools.get('dream_learn').presentResult({}, learnRes)?.title ?? '', /新候选已入库/)

  const ctxRes = await runRealTool('dream_context', { query: '发版 测试', workspaceRoot: env.project })
  assert.equal(ctxRes.isError, false)
  assert.equal(ctxRes.meta?.count, 1)
  assert.match(ctx.tools.get('dream_context').presentResult({}, ctxRes)?.title ?? '', /命中 1 条/)

  const revRes = await runRealTool('dream_review', { action: 'accept', lessonId: seeded.id, expectedRevision: seeded.revision })
  assert.equal(revRes.isError, false)
  assert.equal(revRes.meta?.requiresHumanReview, true)
  assert.match(ctx.tools.get('dream_review').presentResult({}, revRes)?.title ?? '', /已建议人工审阅/)

  const bridgePath = join(env.project, 'AGENTS.md')
  const previewRes = await runRealTool('dream_bridge', { mode: 'preview', path: bridgePath })
  assert.equal(previewRes.isError, false)
  assert.equal(previewRes.meta?.lessonsCount, 1)
  assert.match(ctx.tools.get('dream_bridge').presentResult({}, previewRes)?.title ?? '', /渡梦预览：1 条经验/)

  const applyRes = await runRealTool('dream_bridge', { mode: 'apply', path: bridgePath, expectedSha256: null })
  assert.equal(applyRes.isError, false)
  assert.equal(typeof applyRes.meta?.backupId, 'string')
  assert.match(ctx.tools.get('dream_bridge').presentResult({}, applyRes)?.title ?? '', /渡梦已应用/)

  const rollbackRes = await runRealTool('dream_bridge', { mode: 'rollback', path: bridgePath, backupId: applyRes.meta.backupId })
  assert.equal(rollbackRes.isError, false)
  assert.match(ctx.tools.get('dream_bridge').presentResult({}, rollbackRes)?.title ?? '', /渡梦已回滚/)

  // Error result -> presentResult returns undefined so DSH shows error state cleanly
  assert.equal(ctx.tools.get('dream_recall').presentResult({}, { content: [], isError: true }), undefined)
})

test('1b. Real DSH 0.2.2-rc.3 SQLite FTS5 sessionQuery executes dream_digest({ query, workspaceOnly }) end-to-end', { skip: !HAS_REAL_DSH_SQLITE }, async (t) => {
  const req = createRequire(join(DSH_HARNESS_ROOT, 'packages', 'session-query', 'session-query-sqlite', 'package.json'))
  const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
  const { default: SessionStore, SessionId } = await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-session')).href)
  const { default: SqliteSessionQuery } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'session-query', 'session-query-sqlite', 'lib', 'index.js')).href)

  const env = makeTempEnv(t)
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(SqliteSessionQuery, { path: ':memory:' })
  t.after(async () => { await ctx.fiber.dispose() })

  installSessionQueryBridge(ctx)
  // Cordis 4 delivers ctx.inject callbacks asynchronously after service readiness
  for (let i = 0; i < 20 && !getSessionQuery(); i += 1) {
    await new Promise((r) => setTimeout(r, 15))
  }
  assert.ok(getSessionQuery(), 'installSessionQueryBridge must bind real DSH SQLite sessionQuery')
  assert.equal(hasSessionQuerySearch(), true)

  const s1 = ctx.sessions.create(SessionId('real-fts-hit'), { meta: { cwd: env.project } })
  s1.append('turn/start', { turn: 1 })
  s1.append('user/message', {
    id: 'u1',
    role: 'user',
    source: { kind: 'user' },
    content: [{ type: 'text', text: 'Investigate quantumLockRecovery deadlock inside bridge lock' }],
  }, { surfaceOp: 'append' })
  s1.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

  const s2 = ctx.sessions.create(SessionId('real-fts-other'), { meta: { cwd: env.subdir } })
  s2.append('turn/start', { turn: 1 })
  s2.append('user/message', {
    id: 'u2',
    role: 'user',
    source: { kind: 'user' },
    content: [{ type: 'text', text: 'Investigate quantumLockRecovery inside another workspace' }],
  }, { surfaceOp: 'append' })
  s2.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

  const digestTool = buildDreamTools(env.cfg).find((item) => item.name === 'dream_digest')
  const allMatches = await digestTool.execute({ query: 'quantumLockRecovery', maxSessions: 10 }, { signal: new AbortController().signal })
  assert.equal(allMatches.count, 2)

  const scopedMatches = await digestTool.execute(
    { query: 'quantumLockRecovery', workspaceOnly: true, maxSessions: 10 },
    { session: { header: { cwd: env.project } }, signal: new AbortController().signal },
  )
  assert.equal(scopedMatches.count, 1)
  assert.equal(scopedMatches.sessions[0].id, 'real-fts-hit')

  // Windows case-insensitive cwd & non-adjacent multi-word query against real DSH SQLite FTS5
  const diffCaseCwd = process.platform === 'win32' ? env.project.toLowerCase() : env.project
  const caseScoped = await digestTool.execute(
    { query: 'quantumLockRecovery', workspaceOnly: true, maxSessions: 10 },
    { session: { header: { cwd: diffCaseCwd } }, signal: new AbortController().signal },
  )
  assert.equal(caseScoped.count, 1)
  assert.equal(caseScoped.sessions[0].id, 'real-fts-hit')

  const caseNoQuery = await digestTool.execute(
    { workspaceOnly: true, maxSessions: 10 },
    { session: { header: { cwd: diffCaseCwd } }, signal: new AbortController().signal },
  )
  assert.equal(caseNoQuery.count, 1)
  assert.equal(caseNoQuery.sessions[0].id, 'real-fts-hit')

  const multiWord = await digestTool.execute(
    { query: 'quantumLockRecovery bridge', maxSessions: 10 },
    { signal: new AbortController().signal },
  )
  assert.equal(multiWord.count, 1)
  assert.equal(multiWord.sessions[0].id, 'real-fts-hit')

  // Fail closed when workspaceOnly: true cannot resolve cwd
  await assert.rejects(
    () => digestTool.execute({ workspaceOnly: true }, { signal: new AbortController().signal }),
    /workspaceOnly/,
  )

  const noMatches = await digestTool.execute({ query: 'totallyNonexistentSentinelToken999' }, { signal: new AbortController().signal })
  assert.equal(noMatches.count, 0)

  // Disposing host context clears module-level activeSessionQuery cleanly
  await ctx.fiber.dispose()
  assert.equal(getSessionQuery(), undefined)
})

test('1c. Real DSH 0.2.2-rc.3 CommandRuntime executes installDreamCommands(ctx, cfg) end-to-end (normalize, register, execute, validate result, dispose)', { skip: !HAS_REAL_DSH_COMMANDS }, async (t) => {
  const req = createRequire(join(DSH_HARNESS_ROOT, 'packages', 'interaction', 'commands', 'package.json'))
  const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
  const { default: SessionStore, SessionId } = await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-session')).href)
  const { CommandRuntime } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'interaction', 'commands', 'lib', 'index.js')).href)

  const env = makeTempEnv(t)
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(CommandRuntime)
  t.after(async () => { await ctx.fiber.dispose() })

  const pluginFiber = ctx.plugin({
    name: 'dream-commands-real-test',
    apply(childCtx) {
      installDreamCommands(childCtx, env.cfg)
    },
  })
  await pluginFiber

  const session = ctx.sessions.create(SessionId('real-cmd-e2e'), { meta: { cwd: env.project } })
  const followups = []
  const agent = {
    id: session.id,
    session,
    model: { current: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) },
    followup(msg) { followups.push(msg) },
  }

  for (let i = 0; i < 20 && ctx.commands.list(agent).length < 3; i += 1) {
    await new Promise((r) => setTimeout(r, 15))
  }

  const descriptors = ctx.commands.list(agent)
  assert.deepEqual(descriptors.map((d) => d.name), ['dream', 'dream-learn', 'dream-status'])
  assert.deepEqual(
    descriptors.map((d) => d.definitionId),
    ['@stardustlc/dsh-dream:dream', '@stardustlc/dsh-dream:dream-learn', '@stardustlc/dsh-dream:dream-status'],
  )
  assert.equal(descriptors.find((d) => d.name === 'dream')?.input?.hint, '[focus]')
  assert.equal(descriptors.find((d) => d.name === 'dream-learn')?.input?.hint, '[lesson text]')
  assert.equal(descriptors.find((d) => d.name === 'dream-status')?.input, undefined)

  const signal = new AbortController().signal

  // (1) /dream-status executes via real CommandRuntime with zero-write-on-read and logs command/run + command/done
  const statusExec = await ctx.commands.execute(agent, '/dream-status', [], signal)
  assert.ok(statusExec)
  assert.equal(statusExec.result.kind, 'success')
  assert.match(statusExec.result.text, /Dream 状态摘要/)
  assert.equal(existsSync(join(env.journalDir, 'knowledge')), false, '/dream-status must remain zero-write-on-read')

  // (2) /dream executes via real CommandRuntime and enqueues valid followup UserMessage
  const dreamExec = await ctx.commands.execute(agent, '/dream 核对桥接稳定性', [], signal)
  assert.ok(dreamExec)
  assert.equal(dreamExec.result.kind, 'success')
  assert.equal(followups.length, 1)
  assert.equal(followups[0].role, 'user')
  assert.equal(followups[0].source.kind, 'user')
  assert.match(followups[0].content[0].text, /核对桥接稳定性/)

  // (3) /dream-learn creates unreviewed candidate with secrets masked and keeps AGENTS.md untouched
  const learnExec = await ctx.commands.execute(
    agent,
    '/dream-learn 发布前先校验环境变量 token=sk-realcmdsecret1234567890abcd',
    [],
    signal,
  )
  assert.ok(learnExec)
  assert.equal(learnExec.result.kind, 'success')
  assert.match(learnExec.result.text, /candidate/)
  const [saved] = env.store().listLessons()
  assert.ok(saved)
  assert.equal(saved.state, 'candidate')
  assert.equal(saved.review.decision, 'unreviewed')
  assert.doesNotMatch(saved.action, /sk-realcmdsecret1234567890abcd/)
  assert.equal(existsSync(join(env.project, 'AGENTS.md')), false)

  // (4) Disallowed attachments are rejected cleanly by real CommandRuntime validation
  const attachExec = await ctx.commands.execute(
    agent,
    '/dream-status',
    [{ type: 'file', receiptId: 'rcpt-1' }],
    signal,
  )
  assert.ok(attachExec)
  assert.equal(attachExec.result.kind, 'error')
  assert.match(attachExec.result.text, /does not accept attachments/)

  // Verify real DSH session lifecycle events were logged for executed commands
  const events = session.snapshotEvents()
  assert.equal(events.filter((e) => e.type === 'command/run').length, 4)
  assert.equal(events.filter((e) => e.type === 'command/done').length, 4)

  // (5) Disposing plugin fiber unregisters all 3 commands from real CommandRuntime
  await pluginFiber.dispose()
  assert.deepEqual(ctx.commands.list(agent), [])
})

test('1d. Real DSH 0.2.2-rc.3 SessionLogDeepSeekService.registerExclusion excludes Dream auxiliary uploads via attachSessionLogDeepSeek', { skip: !HAS_REAL_DSH_SESSION_LOG }, async (t) => {
  const req = createRequire(join(DSH_HARNESS_ROOT, 'packages', 'session', 'session-log-deepseek', 'package.json'))
  const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
  const { default: SessionStore, SessionId } = await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-session')).href)
  const { default: DeepSeekLlmApiExtensionRegistry } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'llm', 'deepseek-llm-api-extensions', 'lib', 'index.js')).href)
  const SessionLogDeepSeek = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'session', 'session-log-deepseek', 'lib', 'index.js')).href)

  const env = makeTempEnv(t)
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(DeepSeekLlmApiExtensionRegistry)
  await ctx.plugin(SessionLogDeepSeek, { enabled: true })
  t.after(async () => { await ctx.fiber.dispose() })

  const session = ctx.sessions.create(SessionId('real-slog-sess'), { meta: { cwd: env.project } })
  session.append('turn/start', { turn: 1 })
  session.append('user/message', {
    id: 'u1',
    role: 'user',
    source: { kind: 'user' },
    content: [{ type: 'text', text: '以后提交前必须运行完整回归测试。' }],
  }, { surfaceOp: 'append' })

  let releaseStream
  const streamEntered = new Promise((resolve) => {
    releaseStream = resolve
  })
  let finishStream
  const streamHold = new Promise((resolve) => {
    finishStream = resolve
  })

  const runtime = new AutomaticDream(env.cfg)
  const unreg = runtime.register()
  const detachHost = runtime.attach({
    on: () => () => {},
    systemPrompt: { context: () => () => {} },
    llm: {
      async *stream() {
        releaseStream()
        await streamHold
        yield { type: 'block-end', index: 0, block: { type: 'text', text: JSON.stringify({ lessons: [] }) } }
        yield { type: 'finish', reason: { kind: 'stop' } }
      },
    },
  }, { probeOptional: false })
  const detachLog = runtime.attachSessionLogDeepSeek(ctx.sessionLogDeepSeek)
  t.after(() => {
    finishStream?.()
    detachLog()
    detachHost()
    unreg()
  })

  const signal = new AbortController().signal
  const body = { messages: [{ role: 'user', content: 'ping' }] }

  // (1) Normal main-session request IS included in dsh_session_log
  const normalPrep = await ctx.deepseekLlmApiExtensions.prepare({ body, signal, sessionId: session.id })
  assert.ok(normalPrep.fields.dsh_session_log, 'normal main-session upload must include dsh_session_log')
  assert.equal(normalPrep.fields.dsh_session_log.events.length, 2)

  // (2) Request with purpose: 'dsh-dream-*' IS excluded by real SessionLogDeepSeekService.registerExclusion
  const dreamPurposePrep = await ctx.deepseekLlmApiExtensions.prepare({
    body,
    signal,
    sessionId: session.id,
    purpose: 'dsh-dream-automatic',
  })
  assert.equal(dreamPurposePrep.fields.dsh_session_log, undefined, 'dsh-dream purpose must be excluded from session-log upload')

  // (3) In-flight Dream background extraction on session.id (even without purpose) IS excluded via activeAuxSessionIds
  const obsSession = {
    id: String(session.id),
    header: { type: 'session', version: 4, id: String(session.id), cwd: env.project },
    requestContext: () => ({ provider: 'deepseek', model: 'deepseek-chat' }),
  }
  runtime.observe(obsSession, { type: 'turn/start', seq: 10, time: Date.now(), data: { turn: 1 } })
  runtime.observe(obsSession, { type: 'user/message', seq: 11, time: Date.now(), data: { source: { kind: 'user' }, content: [{ type: 'text', text: '以后提交前必须运行完整回归测试。' }] } })
  runtime.observe(obsSession, { type: 'assistant/message', seq: 12, time: Date.now(), data: { message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: '收到，提交前一定运行完整回归测试。' }] } } })
  runtime.observe(obsSession, { type: 'turn/end', seq: 13, time: Date.now(), data: { reason: { kind: 'completed' } } })

  await streamEntered
  const duringAuxPrep = await ctx.deepseekLlmApiExtensions.prepare({ body, signal, sessionId: session.id })
  assert.equal(duringAuxPrep.fields.dsh_session_log, undefined, 'active Dream aux extraction on same sessionId must be excluded')

  // Once aux stream finishes, normal uploads for session.id resume cleanly
  finishStream()
  await runtime.whenIdle()
  const afterAuxPrep = await ctx.deepseekLlmApiExtensions.prepare({ body, signal, sessionId: session.id })
  assert.ok(afterAuxPrep.fields.dsh_session_log, 'session-log upload must resume once Dream aux extraction completes')

  // (4) Disposing attachSessionLogDeepSeek unregisters the exclusion in real SessionLogDeepSeekService
  detachLog()
  await new Promise((r) => setTimeout(r, 15))
  const afterDisposePrep = await ctx.deepseekLlmApiExtensions.prepare({
    body,
    signal,
    sessionId: session.id,
    purpose: 'dsh-dream-automatic',
  })
  assert.ok(afterDisposePrep.fields.dsh_session_log, 'disposing exclusion must restore default session-log preparation')
})

test('1e. Real DSH 0.2.2-rc.3 tool-str-replace-editor + fs-local + ToolExecutionPipeline + AutomaticDream end-to-end (view read-only vs mutating & failed edits)', { skip: !HAS_REAL_DSH_STR_REPLACE }, async (t) => {
  const req = createRequire(join(DSH_HARNESS_ROOT, 'packages', 'fs', 'tool-str-replace-editor', 'package.json'))
  const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
  const { default: SystemPromptService } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'core', 'system-prompt', 'lib', 'index.js')).href)
  const { ToolsService } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'core', 'tools', 'lib', 'index.js')).href)
  const { ToolExecutionPipeline } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'core', 'tools', 'lib', 'pipeline.js')).href)
  const { LocalFileSystem } = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'fs', 'fs-local', 'lib', 'index.js')).href)
  const ToolStrReplaceEditor = await import(pathToFileURL(join(DSH_HARNESS_ROOT, 'packages', 'fs', 'tool-str-replace-editor', 'lib', 'index.js')).href)

  const env = makeTempEnv(t)
  const targetDir = join(env.project, 'src')
  const targetFile = join(targetDir, 'automatic.ts')
  const createdFile = join(targetDir, 'created.ts')
  mkdirSync(targetDir, { recursive: true })
  writeFileSync(targetFile, 'export const version = 1\n', 'utf8')

  const ctx = new Context()
  await ctx.plugin(SystemPromptService)
  await ctx.plugin(ToolsService)
  await ctx.plugin(LocalFileSystem, { cwd: env.project })
  await ctx.plugin(ToolStrReplaceEditor)
  t.after(async () => { await ctx.fiber.dispose() })

  const runtime = new AutomaticDream(env.cfg)
  const unreg = runtime.register()
  const contexts = []
  const listeners = new Map()
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
    for (const fn of [...(listeners.get(event) ?? [])]) await fn(...args)
  }
  const detachHost = runtime.attach({
    on: addListener,
    systemPrompt: { context: (p) => { contexts.push(p); return () => {} } },
    llm: { async *stream() {} },
  }, { probeOptional: false })
  // Attach directly to REAL DSH Context carrying REAL ToolsService!
  const detachTools = runtime.attachTools(ctx)
  t.after(() => { detachTools(); detachHost(); unreg() })

  const rule = seedAcceptedLesson(env.store(), {
    seedKey: 'real-sre-gate-rule',
    kind: 'pitfall',
    title: '修改 automatic.ts 前必须运行回归测试',
    action: '运行 npm test 并核对门控行为',
    when: '修改 src/automatic.ts 时',
    prevents: '错误触发门控',
    files: ['src/automatic.ts'],
    workspaceRoot: env.project,
  })
  runtime.control({ verificationGateEnabled: true })

  const steered = []
  const session = {
    id: 'sess-real-sre',
    header: { type: 'session', version: 4, id: 'sess-real-sre', cwd: env.project, agentPreset: 'code' },
    requestContext: () => ({ provider: 'deepseek', model: 'deepseek-chat' }),
  }
  const agent = {
    id: session.id,
    session,
    model: { current: () => ({ provider: 'deepseek', model: 'deepseek-chat' }) },
    steer: (msg) => { steered.push(msg) },
  }

  const pipeline = new ToolExecutionPipeline(ctx)
  const signal = new AbortController().signal
  const runSre = async (args) => {
    const prep = await pipeline.prepare({
      callId: 'sre-' + Math.random().toString(36).slice(2),
      name: 'str_replace_editor',
      arguments: args,
      agent,
      signal,
    })
    assert.equal(prep.kind, 'dispatch')
    const dispatched = await pipeline.dispatch(prep.exec)
    return pipeline.complete(prep.exec, dispatched)
  }

  let seq = 1
  const send = (type, data) => runtime.observe(session, { type, seq: seq++, time: Date.now(), data })

  // Turn 1: real str_replace_editor({ command: 'view', path: targetFile }) -> activeFiles recalls rule, gate MUST NOT fire
  send('turn/start', { turn: 1 })
  await emit('agent/inbox/claimed', {
    agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: '查看当前文件结构' }] },
  })
  const viewRes = await runSre({ command: 'view', path: targetFile })
  assert.equal(viewRes.isError, false)
  assert.match(contexts[0].text({ scope: agent, agent }), new RegExp(rule.id), 'real str_replace_editor(view) must populate activeFiles for contextual recall')
  const viewDirRes = await runSre({ command: 'view', path: targetDir })
  assert.equal(viewDirRes.isError, false)
  await emit('agent/turn-stopping', { agent, turn: 1, signal })
  assert.equal(steered.length, 0, 'real str_replace_editor(view) on file/dir must NOT fire Verification Gate')
  send('turn/end', { turn: 1, reason: { kind: 'completed' } })

  // Turn 2: failed str_replace (old_str missing -> isError: true) -> gate MUST NOT fire
  send('turn/start', { turn: 2 })
  const failedRes = await runSre({ command: 'str_replace', path: targetFile, old_str: 'NOT_PRESENT', new_str: 'x' })
  assert.equal(failedRes.isError, true)
  await emit('agent/turn-stopping', { agent, turn: 2, signal })
  assert.equal(steered.length, 0, 'failed str_replace_editor call must NOT fire Verification Gate')
  send('turn/end', { turn: 2, reason: { kind: 'completed' } })

  // Turn 3: real mutating str_replace -> modifies file on disk & fires Verification Gate once
  send('turn/start', { turn: 3 })
  const editRes = await runSre({ command: 'str_replace', path: targetFile, old_str: 'version = 1', new_str: 'version = 2' })
  assert.equal(editRes.isError, false)
  assert.match(readFileSync(targetFile, 'utf8'), /version = 2/)
  await emit('agent/turn-stopping', { agent, turn: 3, signal })
  assert.equal(steered.length, 1, 'real mutating str_replace_editor(str_replace) must fire Verification Gate')
  assert.match(steered[0].content[0].text, new RegExp(rule.id))
  send('turn/end', { turn: 3, reason: { kind: 'completed' } })

  // Turn 4: real mutating insert -> fires Verification Gate
  send('turn/start', { turn: 4 })
  const insertRes = await runSre({ command: 'insert', path: targetFile, insert_line: 1, new_str: '// inserted' })
  assert.equal(insertRes.isError, false)
  await emit('agent/turn-stopping', { agent, turn: 4, signal })
  assert.equal(steered.length, 2, 'real mutating str_replace_editor(insert) must fire Verification Gate')
  send('turn/end', { turn: 4, reason: { kind: 'completed' } })

  // Turn 5: real mutating create -> creates file on disk & fires Verification Gate
  send('turn/start', { turn: 5 })
  const createRes = await runSre({ command: 'create', path: createdFile, file_text: 'export const ok = true\n' })
  assert.equal(createRes.isError, false)
  assert.equal(existsSync(createdFile), true)
  await emit('agent/turn-stopping', { agent, turn: 5, signal })
  assert.equal(steered.length, 3, 'real mutating str_replace_editor(create) must fire Verification Gate')
  send('turn/end', { turn: 5, reason: { kind: 'completed' } })
})

// ---------------------------------------------------------------------------
// 2. Mid-session `cd` (workingDirectory) in dream_bridge, dream_learn, dream_digest
// ---------------------------------------------------------------------------

test('2. Tools honor live DSH workingDirectory after mid-session cd (dream_bridge, dream_learn local-artifact, dream_digest workspaceOnly)', async (t) => {
  const h = makeAutomaticHarness(t)
  let currentDir = h.project
  const detachWd = h.runtime.attachWorkingDirectory({ get: () => currentDir })
  t.after(detachWd)

  // Write a local artifact ONLY inside h.subdir (after cd)
  writeFileSync(join(h.subdir, 'notes.md'), 'Always run typecheck inside subpackage after cd.\n', 'utf8')

  // Seed one accepted lesson scoped to h.subdir
  seedAcceptedLesson(h.store(), {
    seedKey: 'sub-rule',
    title: '子包目录内独立构建',
    action: '在子包执行局部编译检查',
    when: '切换到 packages/sub 后',
    workspaceRoot: h.subdir,
  })

  // Seed two disk sessions: one for project, one for subdir
  mkdirSync(join(h.sessionsRoot, 'p1', 's-root'), { recursive: true })
  writeFileSync(join(h.sessionsRoot, 'p1', 's-root', 'session.jsonl.zstd'), makeSessionFile([
    makeHeader('s-root', { cwd: h.project }),
    makeEvent('turn/start', 1, {}),
    makeEvent('user/message', 2, '根目录工作任务'),
    makeEvent('turn/end', 3, {}),
  ]))
  mkdirSync(join(h.sessionsRoot, 'p2', 's-sub'), { recursive: true })
  writeFileSync(join(h.sessionsRoot, 'p2', 's-sub', 'session.jsonl.zstd'), makeSessionFile([
    makeHeader('s-sub', { cwd: h.subdir }),
    makeEvent('turn/start', 1, {}),
    makeEvent('user/message', 2, '子包工作任务'),
    makeEvent('turn/end', 3, {}),
  ]))

  // Simulate mid-session `cd packages/sub` (session.header.cwd is STILL h.project!)
  currentDir = h.subdir
  const tools = buildDreamTools(h.cfg)
  const tool = (name) => tools.find((item) => item.name === name)
  const exec = { agent: h.agent, signal: new AbortController().signal }

  // dream_bridge defaults to h.subdir/AGENTS.md, NOT h.project/AGENTS.md
  const preview = await tool('dream_bridge').execute({ mode: 'preview' }, exec)
  assert.equal(preview.ok, true)
  assert.equal(preview.lessons.length, 1)
  assert.ok(preview.resolvedPath.toLowerCase().includes('sub'), 'dream_bridge must follow live workingDirectory after cd')

  // dream_learn local-artifact resolves notes.md inside h.subdir
  const learned = await tool('dream_learn').execute({
    kind: 'procedure',
    title: '子包变更后运行 typecheck',
    action: '执行子包类型检查',
    when: '修改子包源码时',
    workspaceRoot: h.subdir,
    evidence: [{
      kind: 'local-artifact',
      artifactPath: 'notes.md',
      summary: 'Always run typecheck inside subpackage after cd.',
      verification: 'read',
    }],
  }, exec)
  assert.equal(learned.independentSupportCount, 1, 'local-artifact must verify against live workingDirectory')
  assert.equal(learned.evidence[0].verification, 'read')

  // dream_digest with workspaceOnly: true filters by live workingDirectory (h.subdir)
  const digested = await tool('dream_digest').execute({ workspaceOnly: true }, exec)
  assert.equal(digested.count, 1)
  assert.equal(digested.sessions[0].id, 's-sub')
})

// ---------------------------------------------------------------------------
// 3. sessionQuery FTS5 searchSessions / filterSessions / AbortSignal / compaction summary
// ---------------------------------------------------------------------------

test('3. dream_digest uses DSH sessionQuery.searchSessions (FTS5), supports fallback, AbortSignal, compaction/summary & excludes relays', async (t) => {
  const env = makeTempEnv(t)
  const ftsCalls = []
  const mockQuery = {
    async listSessions() {
      return [{ header: { type: 'session', id: 'sess-compact', cwd: env.project } }]
    },
    async searchSessions(req, exec) {
      ftsCalls.push({ req, hasSignal: Boolean(exec?.signal) })
      if (req.query === 'zero-hits') return { items: [] }
      if (req.query === 'fts-broken') throw new Error('sqlite busy')
      return { items: [{ header: { type: 'session', id: 'sess-compact', cwd: env.project } }] }
    },
    async readSession(id) {
      if (id !== 'sess-compact') return undefined
      return {
        session: { type: 'session', version: 4, id: 'sess-compact', cwd: env.project, agentPreset: 'code' },
        events: [
          { type: 'session/title', seq: 0, time: 1000, data: '长会话压缩测试' },
          { type: 'turn/start', seq: 1, time: 1001, data: { turn: 1 } },
          { type: 'user/message', seq: 2, time: 1002, data: { source: { kind: 'user', form: 'relay' }, content: [{ type: 'text', text: '子代理中继消息不应被当成人类原话' }] } },
          { type: 'user/message', seq: 3, time: 1003, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '排查 SQLite FTS5 索引损坏问题' }] } },
          { type: 'compaction/summary', seq: 4, time: 1004, data: { summary: [{ type: 'text', text: '已定位 WAL 锁竞争并在清理后重建 FTS5 索引。' }] } },
          { type: 'user/message', seq: 5, time: 1005, data: { source: { kind: 'compact-checkpoint' }, content: [{ type: 'text', text: 'checkpoint text' }] } },
          { type: 'turn/end', seq: 6, time: 1006, data: { reason: { kind: 'completed' } } },
        ],
      }
    },
  }

  const restore = setSessionQueryForTest(mockQuery)
  t.after(restore)
  assert.equal(hasSessionQuerySearch(), true)

  const tools = buildDreamTools(env.cfg)
  const digestTool = tools.find((item) => item.name === 'dream_digest')
  const ac = new AbortController()

  // FTS5 query path + compaction summary + relay exclusion
  const res = await digestTool.execute({ query: 'FTS5', maxSessions: 5 }, { signal: ac.signal })
  assert.equal(ftsCalls.length, 1)
  assert.equal(ftsCalls[0].req.query, 'FTS5')
  assert.equal(ftsCalls[0].hasSignal, true)
  assert.equal(res.count, 1)
  assert.deepEqual(res.sessions[0].userMessages, ['排查 SQLite FTS5 索引损坏问题'])
  assert.match(res.sessions[0].digestText, /压缩摘要：/)
  assert.match(res.sessions[0].digestText, /WAL 锁竞争/)

  // Authoritative 0-hit FTS5 result does not return unrelated sessions
  const zeroRes = await digestTool.execute({ query: 'zero-hits' }, { signal: ac.signal })
  assert.equal(zeroRes.count, 0)

  // Throwing searchSessions gracefully falls back to listSessions + local text match
  const fallbackRes = await digestSessionsWithFallback(env.cfg, 5, mockQuery, { query: 'WAL' })
  assert.equal(fallbackRes.length, 1)
  assert.equal(fallbackRes[0].compactionSummary, '已定位 WAL 锁竞争并在清理后重建 FTS5 索引。')

  // Aborted signal cancels cleanly
  const aborted = new AbortController()
  aborted.abort()
  await assert.rejects(
    () => digestTool.execute({ query: 'FTS5' }, { signal: aborted.signal }),
    (err) => err?.name === 'AbortError',
  )

  // Disk session parser also captures compaction/summary and skips relay
  const diskFile = join(env.sessionsRoot, 'p', 's-disk-compact', 'session.jsonl.zstd')
  mkdirSync(join(env.sessionsRoot, 'p', 's-disk-compact'), { recursive: true })
  writeFileSync(diskFile, makeSessionFile([
    makeHeader('s-disk-compact', { version: 4, cwd: env.project }),
    makeEvent('user/message', 1, { source: { kind: 'user', form: 'relay' }, content: [{ type: 'text', text: 'relay-only' }] }),
    makeEvent('compaction/summary', 2, { summary: [{ type: 'text', text: '磁盘压缩摘要内容' }] }),
  ]))
  const diskDigest = digestSessionFile(diskFile, 5)
  assert.deepEqual(diskDigest.userMessages, [])
  assert.equal(diskDigest.compactionSummary, '磁盘压缩摘要内容')
  assert.match(buildDigestText(diskDigest), /压缩摘要：/)
  assert.equal(digestSessionFromEvents({ id: 's-only-compact', cwd: env.project }, [
    { type: 'compaction/summary', seq: 1, data: { summary: [{ type: 'text', text: '仅含压缩摘要' }] } },
  ], 5).compactionSummary, '仅含压缩摘要')
})

// ---------------------------------------------------------------------------
// 4. AutomaticDream: turnExposedIds stability, agent/created resume, compaction, relay & archive
// ---------------------------------------------------------------------------

test('4a. AutomaticDream avoids duplicate exposure counts & disk rewrites when activeFiles updates mid-turn with unchanged lesson IDs', async (t) => {
  const h = makeAutomaticHarness(t)
  const detachTools = h.runtime.attachTools({ tools: {}, on: h.host.on })
  t.after(detachTools)

  const l1 = seedAcceptedLesson(h.store(), {
    seedKey: 'exp-1',
    title: '修改网络重试逻辑必须设置退避上限',
    action: '指数退避并设置最大等待 30s',
    when: '处理网络请求重试时',
    workspaceRoot: h.project,
  })
  const l2 = seedAcceptedLesson(h.store(), {
    seedKey: 'exp-2',
    title: '修改 bridge.ts 时必须保留 UTF-8 BOM',
    action: '按原文件头保留 BOM 字节',
    when: '编辑 bridge.ts 时',
    files: ['src/bridge.ts'],
    workspaceRoot: h.project,
  })

  await h.emit('agent/inbox/claimed', {
    agent: h.agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: '排查网络重试逻辑' }] },
  })
  const first = h.contexts[0].text({ scope: h.agent, agent: h.agent })
  assert.match(first, new RegExp(l1.id))
  const stateFile = join(h.journalDir, 'automatic', 'state.json')
  assert.equal(readAutomaticState(h.cfg, h.now()).retrieved[l1.id].count, 1)
  const mtimeBefore = statSync(stateFile).mtimeMs

  // Read an unrelated file -> activeFiles changes, cacheKey changes, but injected IDs stay [l1.id]
  await h.emit('tools/result', {
    name: 'read',
    arguments: JSON.stringify({ file_path: join(h.project, 'src', 'unrelated.ts') }),
    agent: h.agent,
  }, { isError: false })
  h.advance(500)
  const second = h.contexts[0].text({ scope: h.agent, agent: h.agent })
  assert.match(second, new RegExp(l1.id))
  assert.equal(readAutomaticState(h.cfg, h.now()).retrieved[l1.id].count, 1, 'same lesson must NOT be double-counted when activeFiles changes')
  assert.equal(statSync(stateFile).mtimeMs, mtimeBefore, 'unchanged injected lesson IDs must NOT rewrite state.json')

  // Now read src/bridge.ts -> l2 newly enters injected set; l1 stays 1, l2 becomes 1!
  await h.emit('tools/result', {
    name: 'read',
    arguments: JSON.stringify({ file_path: join(h.project, 'src', 'bridge.ts') }),
    agent: h.agent,
  }, { isError: false })
  const third = h.contexts[0].text({ scope: h.agent, agent: h.agent })
  assert.match(third, new RegExp(l2.id))
  const retrieved = readAutomaticState(h.cfg, h.now()).retrieved
  assert.equal(retrieved[l1.id].count, 1)
  assert.equal(retrieved[l2.id].count, 1)
})

test('4b. AutomaticDream hydrates resumed agents on agent/created, ignores relay messages, handles compaction & cleans up on workspace/session-archived', async (t) => {
  const quote = '以后每次修改发布脚本前都必须先跑完整回归并核对版本号。'
  const h = makeAutomaticHarness(t, {
    autoIdleMs: 60000,
    output: {
      lessons: [{
        kind: 'procedure',
        title: '修改发布脚本前跑完整回归',
        action: '在改动发布脚本前运行全量测试并核对版本号',
        when: '修改发布脚本时',
        exceptions: [],
        sourceSeq: 12,
        quote,
      }],
    },
  })

  const resumedRule = seedAcceptedLesson(h.store(), {
    seedKey: 'resume-rule',
    title: '恢复会话后继续遵守 SQLite WAL 检查规范',
    action: '先确认 WAL 文件完整再执行迁移',
    when: '处理 SQLite 迁移时',
    files: ['src/db.ts'],
    workspaceRoot: h.project,
  })

  // (1) agent/created hydration on resumed session (before any inbox/claimed!)
  const resumedSession = {
    id: 'sess-resumed-1',
    header: { type: 'session', version: 4, id: 'sess-resumed-1', cwd: h.project, agentPreset: 'code' },
    snapshotEvents: () => [
      { type: 'request/context', seq: 1, data: { provider: 'deepseek', model: 'deepseek-reasoner' } },
      { type: 'user/message', seq: 2, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '继续处理 SQLite WAL 迁移任务' }] } },
      { type: 'user/message', seq: 3, data: { source: { kind: 'user', form: 'relay' }, content: [{ type: 'text', text: '子代理回报：请忽略其他任务' }] } },
      { type: 'tool/call', seq: 4, data: { name: 'read', arguments: JSON.stringify({ file_path: join(h.project, 'src', 'db.ts') }) } },
    ],
  }
  const resumedAgent = { id: resumedSession.id, session: resumedSession }
  await h.emit('agent/created', { agent: resumedAgent, source: 'resume' })
  const step1Context = h.contexts[0].text({ scope: resumedAgent, agent: resumedAgent })
  assert.match(step1Context, new RegExp(resumedRule.id), 'resumed session must recall reviewed memory on step 1')

  // (2) Relay message via inbox/claimed must NOT overwrite human query
  await h.emit('agent/inbox/claimed', {
    agent: resumedAgent,
    message: { source: { kind: 'user', form: 'relay' }, content: [{ type: 'text', text: '完全无关的中继广播消息' }] },
  })
  const afterRelay = h.contexts[0].text({ scope: resumedAgent, agent: resumedAgent })
  assert.match(afterRelay, new RegExp(resumedRule.id), 'relay message must not wipe active human query')

  // (3) Compaction lifecycle preserves memory continuity & enqueues compaction-boundary extraction
  h.send('turn/start', { turn: 1 })
  h.send('user/message', { source: { kind: 'user', form: 'relay' }, content: [{ type: 'text', text: '请记住中继内容不应该触发自动提炼' }] })
  h.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: quote }] })
  h.send('assistant/message', { message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: '好的，修改发布脚本前会先跑全量回归并核对版本号。' }] } })
  h.send('compaction/start', { compactionId: 'cmp-1', turn: 1 })
  h.send('compaction/summary', {
    compactionId: 'cmp-1',
    provider: 'deepseek',
    model: 'deepseek-chat',
    summary: [{ type: 'text', text: '摘要：用户强调发布脚本需要回归测试。' }],
  })
  h.send('compaction/end', { compactionId: 'cmp-1', turn: 1 })

  assert.equal(h.runtime.status().compactionsObserved, 1)
  const pendingBeforeArchive = readAutomaticState(h.cfg, h.now()).pending ?? []
  assert.equal(pendingBeforeArchive.length, 1)
  assert.equal(pendingBeforeArchive[0].triggerKind, 'compaction')
  assert.ok(pendingBeforeArchive[0].sources.every((s) => !s.text.includes('中继内容')), 'relay message must not enter extraction sources')

  // /dream-status reflects compactionsObserved
  const statusCmd = buildDreamCommands(h.cfg).find((c) => c.name === 'dream-status')
  const statusRes = await statusCmd.handler({ agent: h.agent, rawInput: '' })
  assert.equal(statusRes.kind, 'success')
  assert.match(statusRes.text, /已观测压缩 1 次/)

  // (4) workspace/session-archived prunes un-leased pending entries for that session
  await h.emit('workspace/session-archived', { sessionId: h.session.id })
  const pendingAfterArchive = readAutomaticState(h.cfg, h.now()).pending ?? []
  assert.equal(pendingAfterArchive.filter((p) => p.sessionId === h.session.id).length, 0)
})

// ---------------------------------------------------------------------------
// 5. Hardened maskSecrets & Hybrid BM25F retrieveLessons / searchDreams edge cases
// ---------------------------------------------------------------------------

test('5a. maskSecrets catches Bearer, PEM, DB URI, hf_, npm_, AIza, full-width evasions without benign false positives', () => {
  const secrets = [
    ['Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYifQ.sig1234567890', /eyJhbGci/],
    ['-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890abcdef\n-----END RSA PRIVATE KEY-----', /MIIEpAIBAA/],
    ['DATABASE_URL=postgres://admin:SuperSecretPass99@db.internal:5432/prod', /SuperSecretPass99/],
    ['redis://default:RedisPassWord2026@127.0.0.1:6379/0', /RedisPassWord2026/],
    ['HF_TOKEN=hf_AbCdEfGhIjKlMnOpQrStUvWxYz12345678', /hf_AbCdEf/],
    ['NPM_TOKEN=npm_1234567890abcdefghijklmnopqrstuvwxyz', /npm_123456/],
    ['GOOGLE_KEY=AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe', /AIzaSyDa/],
    ['密钥：ｓｋ－aBcDeFgHiJkLmNoPqRsTuVwXyZ123456', /aBcDeFgHiJkLmNoP/],
    ['ｐａｓｓｗｏｒｄ＝MyFullWidthSecret88', /MyFullWidthSecret88/],
  ]
  for (const [sample, leakPattern] of secrets) {
    const masked = maskSecrets(sample)
    assert.doesNotMatch(masked, leakPattern, `secret leaked in: ${masked}`)
    assert.match(masked, /\[已脱敏/)
  }

  const benign = [
    'disk-space-checker-1234567890abcdef',
    'task-runner-worker-1234567890abcdef',
    'https://github.com/STARDUSTLC666/dsh-dream',
    'postgres://localhost:5432/mydb',
  ]
  for (const sample of benign) {
    assert.equal(maskSecrets(sample), sample, `benign text should not be altered: ${sample}`)
  }
})

test('5b. Hybrid BM25F retrieval handles stemming, word boundaries, camelCase, bilingual aliases, prevents, read-only evidence, cache invalidation & zero rank inversion', (t) => {
  const env = makeTempEnv(t)
  const store = env.store()

  const lPort = seedAcceptedLesson(store, {
    seedKey: 'bm25-port',
    title: 'Bind local server to explicit port 5173',
    action: 'Configure strictPort true and bind port 5173',
    when: 'Starting local dev server',
    workspaceRoot: env.project,
  })
  const lImportant = seedAcceptedLesson(store, {
    seedKey: 'bm25-imp',
    title: 'Export important quarterly report archive',
    action: 'Support export of important reports',
    when: 'Generating report exports',
    workspaceRoot: env.project,
  })
  const lPrevents = seedAcceptedLesson(store, {
    seedKey: 'bm25-prev',
    title: '保持流式回调有序关闭',
    action: '在 finally 中显式释放流句柄',
    when: '中止后台任务时',
    prevents: 'ECONNRESET 断连与句柄泄漏',
    workspaceRoot: env.project,
  })
  const lMask = seedAcceptedLesson(store, {
    seedKey: 'bm25-mask',
    title: 'Run maskSecrets before persisting payloads',
    action: 'Invoke maskSecrets on all persisted strings',
    when: 'Writing journal or knowledge files',
    workspaceRoot: env.project,
  })
  const lEvidence = seedAcceptedLesson(store, {
    seedKey: 'bm25-ev',
    title: '遵循历史迁移步骤',
    action: '按顺序执行兼容检查',
    when: '升级旧版日志时',
    evidence: [
      { kind: 'session', sessionId: 's1', recordSeq: 1, summary: '实测通过 zstdFrameMagic 校验修复截断帧', verification: 'read', sourceHash: 'b'.repeat(64) },
      { kind: 'session', sessionId: 's2', recordSeq: 2, summary: '未经核验的 claimedOnlyMarker 不应被索引', verification: 'claimed' },
    ],
    workspaceRoot: env.project,
  })

  const lessons = store.listLessons()
  const evidence = store.listEvidence()

  // Word boundary: "port" hits lPort, NOT lImportant ("export/important/report")
  const portRes = retrieveLessons(lessons, evidence, { query: 'port', workspaceRoot: env.project })
  assert.equal(portRes.items.length, 1)
  assert.equal(portRes.items[0].lessonId, lPort.id)

  // English stemming: "exporting" / "reports" matches lImportant
  const stemRes = retrieveLessons(lessons, evidence, { query: 'exporting reports', workspaceRoot: env.project })
  assert.equal(stemRes.items[0]?.lessonId, lImportant.id)

  // prevents field recall
  const prevRes = retrieveLessons(lessons, evidence, { query: 'ECONNRESET', workspaceRoot: env.project })
  assert.equal(prevRes.items[0]?.lessonId, lPrevents.id)

  // Bilingual alias bridge + camelCase split: "脱敏" matches "maskSecrets"
  const aliasRes = retrieveLessons(lessons, evidence, { query: '如何做脱敏处理', workspaceRoot: env.project })
  assert.equal(aliasRes.items[0]?.lessonId, lMask.id)

  // Verified 'read' evidence is indexed, while unverified 'claimed' evidence is NOT indexed
  const readEvRes = retrieveLessons(lessons, evidence, { query: 'zstdFrameMagic', workspaceRoot: env.project })
  assert.equal(readEvRes.items[0]?.lessonId, lEvidence.id)
  const claimedEvRes = retrieveLessons(lessons, evidence, { query: 'claimedOnlyMarker', workspaceRoot: env.project })
  assert.equal(claimedEvRes.items.length, 0)

  // WeakMap cache invalidates cleanly when a Lesson object is mutated in place
  const mutable = { ...lMask, evidenceIds: [] }
  assert.equal(retrieveLessons([mutable], [], { query: 'maskSecrets', workspaceRoot: env.project }).items.length, 1)
  mutable.title = 'Completely renamed rule about zeppelin'
  mutable.action = 'Fly zeppelin safely'
  mutable.when = 'In sky'
  assert.equal(retrieveLessons([mutable], [], { query: 'zeppelin', workspaceRoot: env.project }).items.length, 1)
  assert.equal(retrieveLessons([mutable], [], { query: 'maskSecrets', workspaceRoot: env.project }).items.length, 0)

  // rankInversionCount === 0 under tight maxChars budget
  const fullOrder = retrieveLessons(lessons, evidence, { query: 'port export maskSecrets', workspaceRoot: env.project, maxChars: 20000 })
  const tight = retrieveLessons(lessons, evidence, { query: 'port export maskSecrets', workspaceRoot: env.project, maxChars: 220 })
  assert.equal(rankInversionCount(fullOrder.items.map((x) => x.lessonId), tight), 0)

  // searchDreams multi-term AND fallback
  saveDream(env.journalDir, '排查 SQLite WAL 锁问题时发现了隐藏竞争', ['写盘前校验锁归属'], '清醒')
  const multiHit = searchDreams(env.journalDir, 'SQLite 锁归属', 5)
  assert.equal(multiHit.length, 1)
  assert.equal(searchDreams(env.journalDir, 'SQLite 不存在的词', 5).length, 0)
})

test('6. Hardened regressions: compaction/turn-end dedup, ordinary-chat guard, working-directory/change, relay evidence firewall, quoted/prefixed secrets & 3-char/embedded-CJK IR', async (t) => {
  const h = makeAutomaticHarness(t, { autoIdleMs: 60000 })

  // (a) Mid-turn compaction followed by turn/end must produce exactly 1 pending record (no double enqueue)
  h.send('turn/start', { turn: 1 })
  h.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: '以后每次修改发布脚本前都必须先跑完整回归。' }] })
  h.send('assistant/message', { message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: '好的，修改发布脚本前一定先跑完整回归。' }] } })
  h.send('compaction/summary', { compactionId: 'c1', provider: 'deepseek', model: 'deepseek-chat', summary: [{ type: 'text', text: '摘要' }] })
  h.send('turn/end', { turn: 1, reason: { kind: 'completed' } })
  await h.runtime.whenIdle()
  assert.equal((readAutomaticState(h.cfg, h.now()).pending ?? []).filter((p) => p.sessionId === h.session.id).length, 1)

  // (b) Ordinary chat (no correction, 0 tools) + compaction must NOT bypass autoMinToolCalls
  const ordSession = {
    id: 'sess-ordinary-compact',
    header: { type: 'session', version: 4, id: 'sess-ordinary-compact', cwd: h.project, agentPreset: 'code' },
    requestContext: () => ({ provider: 'deepseek', model: 'deepseek-chat' }),
  }
  h.send('turn/start', { turn: 1 }, ordSession)
  h.send('user/message', { source: { kind: 'user' }, content: [{ type: 'text', text: '你好呀，今天天气真不错，随便聊聊。' }] }, ordSession)
  h.send('assistant/message', { message: { id: 'a2', role: 'assistant', content: [{ type: 'text', text: '你好！有什么我可以帮你的吗？' }] } }, ordSession)
  h.send('compaction/summary', { compactionId: 'c2', provider: 'deepseek', model: 'deepseek-chat', summary: [{ type: 'text', text: '闲聊摘要' }] }, ordSession)
  assert.equal((readAutomaticState(h.cfg, h.now()).pending ?? []).filter((p) => p.sessionId === ordSession.id).length, 0)

  // (c) working-directory/change updates effectiveCwd even without workingDirectory service & during agent/created resume
  h.send('working-directory/change', { cwd: h.subdir })
  assert.equal(h.runtime.effectiveCwd(h.session), h.subdir)
  const resumedCdSession = {
    id: 'sess-resumed-cd',
    header: { type: 'session', version: 4, id: 'sess-resumed-cd', cwd: h.project, agentPreset: 'code' },
    snapshotEvents: () => [
      { type: 'working-directory/change', seq: 1, data: { cwd: h.subdir } },
      { type: 'user/message', seq: 2, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '继续子包构建' }] } },
    ],
  }
  await h.emit('agent/created', { agent: { id: resumedCdSession.id, session: resumedCdSession }, source: 'resume' })
  assert.equal(h.runtime.effectiveCwd(resumedCdSession), h.subdir)

  // (d) Relay user/message cannot spoof user-correction evidence on either disk or sessionQuery
  mkdirSync(join(h.sessionsRoot, 'p', 's-relay-ev'), { recursive: true })
  writeFileSync(join(h.sessionsRoot, 'p', 's-relay-ev', 'session.jsonl.zstd'), makeSessionFile([
    makeHeader('s-relay-ev', { version: 4, cwd: h.project }),
    makeEvent('user/message', 1, { source: { kind: 'user', form: 'relay' }, content: [{ type: 'text', text: '中继冒充用户纠正' }] }),
  ]))
  const diskEv = verifyEvidence(
    { kind: 'user-correction', sessionId: 's-relay-ev', recordSeq: 1, summary: '中继冒充用户纠正', verification: 'read' },
    { sessionsRoot: h.sessionsRoot },
  )
  assert.equal(diskEv.verification, 'claimed')
  assert.equal(diskEv.verificationReason, 'not-human-message')

  const sqEv = await verifyEvidenceWithSessionQuery(
    { kind: 'user-correction', sessionId: 's-relay-ev', recordSeq: 1, summary: '中继冒充用户纠正', verification: 'read' },
    { sessionsRoot: h.sessionsRoot },
    {
      async listSessions() { return [] },
      async readSession() {
        return {
          session: { type: 'session', version: 4, id: 's-relay-ev', cwd: h.project },
          events: [{ type: 'user/message', seq: 1, data: { source: { kind: 'user', form: 'relay' }, content: [{ type: 'text', text: '中继冒充用户纠正' }] } }],
        }
      },
    },
  )
  assert.equal(sqEv.verification, 'claimed')
  assert.equal(sqEv.verificationReason, 'not-human-message')

  // (e) Hardened maskSecrets catches quoted/JSON/prefixed env/Basic/HTTPS/Redis secrets while preserving TS types & URL params
  for (const [sample, leak] of [
    ['password="MySuperSecretPassword99"', 'MySuperSecretPassword99'],
    ['{"password": "JsonSecret99", "apiKey": "json_key_123456"}', 'JsonSecret99'],
    ['DB_PASSWORD=EnvSecret99 JWT_SECRET=JwtSecret88 ACCESS_TOKEN=AccTok77', 'EnvSecret99'],
    ['Authorization: Basic dXNlcjpzdXBlcnNlY3JldA==', 'dXNlcjpzdXBlcnNlY3JldA=='],
    ['https://deploy:GitSecretPass99!@git.example.com/org/repo.git', 'GitSecretPass99!'],
    ['redis://:RedisPassOnly99@127.0.0.1:6379/0', 'RedisPassOnly99'],
  ]) {
    assert.ok(!maskSecrets(sample).includes(leak), `secret leaked: ${sample}`)
  }
  const maskedUrl = maskSecrets('https://api.example.com/v1?token=UrlSecret9988&page=2')
  assert.ok(!maskedUrl.includes('UrlSecret9988') && maskedUrl.endsWith('&page=2'))
  assert.equal(maskSecrets('interface Cfg { password: string; token: number; apiKey: undefined }'), 'interface Cfg { password: string; token: number; apiKey: undefined }')
  assert.equal(maskSecrets('packages/Core/SessionQuery/SessionQuerySqlite/src/IndexFile.ts'), 'packages/Core/SessionQuery/SessionQuerySqlite/src/IndexFile.ts')

  // (f) 3-char English root stemming symmetry without Tim/time collision + embedded CJK tech term + mutated files[0] cache invalidation
  const store = h.store()
  const lFix = seedAcceptedLesson(store, { seedKey: 'r3-fix', title: 'Always fix lock before exit', action: 'run log flush on bug', when: 'handling lock bug', workspaceRoot: h.project })
  const lTime = seedAcceptedLesson(store, { seedKey: 'r3-time', title: 'Format time using ISO UTC', action: 'record time stamps', when: 'logging time', workspaceRoot: h.project })
  assert.equal(retrieveLessons([lFix], [], { query: 'fixing bugs', workspaceRoot: h.project }).items[0]?.lessonId, lFix.id)
  assert.equal(retrieveLessons([lTime], [], { query: 'Tim', workspaceRoot: h.project }).items.length, 0)

  const lMask = seedAcceptedLesson(store, { seedKey: 'cjk-mask', title: 'Call maskSecrets before save', action: 'redact secrets via maskSecrets', when: '修改数据时', workspaceRoot: h.project })
  const lOther = seedAcceptedLesson(store, { seedKey: 'cjk-other', title: '修改数据前检查格式', action: '修改数据要保持格式', when: '修改数据时', workspaceRoot: h.project })
  assert.equal(retrieveLessons([lMask, lOther], [], { query: '修改数据前如何做脱敏', workspaceRoot: h.project }).items[0]?.lessonId, lMask.id)

  const lMut = { ...lFix, files: ['src/alpha-one.ts'] }
  assert.equal(retrieveLessons([lMut], [], { query: 'alpha', workspaceRoot: h.project }).items.length, 1)
  lMut.files[0] = 'src/omega-two.ts'
  assert.equal(retrieveLessons([lMut], [], { query: 'omega', workspaceRoot: h.project }).items.length, 1)
  assert.equal(retrieveLessons([lMut], [], { query: 'alpha', workspaceRoot: h.project }).items.length, 0)
})

// ---------------------------------------------------------------------------
// 7. Regressions: str_replace_editor read-only `view` & dream_save secret masking
// ---------------------------------------------------------------------------

test('7a. str_replace_editor command: view is read-only (does not mark touchedFiles or trigger Verification Gate) while mutating commands do', async (t) => {
  // Unit checks (including backward compatibility when args are omitted)
  assert.equal(isMutatingFileTool('str_replace_editor'), true)
  assert.equal(isMutatingFileTool('str_replace_editor', {}), true)
  assert.equal(isMutatingFileTool('str_replace_editor', 'not-valid-json'), true)
  assert.equal(isMutatingFileTool('str_replace_editor', { command: 'view', path: '/repo/src/a.ts' }), false)
  assert.equal(isMutatingFileTool('str_replace_editor', JSON.stringify({ command: 'view', path: '/repo/src/a.ts' })), false)
  assert.equal(isMutatingFileTool('str_replace_editor', { command: ' VIEW ', path: '/repo/src/a.ts' }), false)
  assert.equal(isMutatingFileTool('str_replace_editor', { command: 'str_replace', path: '/repo/src/a.ts', old_str: 'x', new_str: 'y' }), true)
  assert.equal(isMutatingFileTool('str_replace_editor', { command: 'create', path: '/repo/src/a.ts', file_text: 'x' }), true)
  assert.equal(isMutatingFileTool('str_replace_editor', { command: 'insert', path: '/repo/src/a.ts', insert_line: 0, new_str: 'x' }), true)
  assert.equal(isMutatingFileTool('read', { path: '/repo/src/a.ts' }), false)
  assert.equal(isMutatingFileTool('edit', { path: '/repo/src/a.ts' }), true)

  // Integration with AutomaticDream Verification Gate + activeFiles recall
  const h = makeAutomaticHarness(t)
  const steered = []
  h.agent.steer = (msg) => { steered.push(msg) }
  const detachTools = h.runtime.attachTools({ tools: {}, on: h.host.on })
  t.after(detachTools)

  const rule = seedAcceptedLesson(h.store(), {
    seedKey: 'sre-gate-rule',
    kind: 'pitfall',
    title: '修改 automatic.ts 前必须运行回归测试',
    action: '运行 npm test 并核对门控行为',
    when: '修改 src/automatic.ts 时',
    prevents: '错误触发门控',
    files: ['src/automatic.ts'],
    workspaceRoot: h.project,
  })
  h.runtime.control({ verificationGateEnabled: true })

  // Turn 1: read-only str_replace_editor({ command: 'view' }) (object args) -> activeFiles recall works, gate MUST NOT fire
  h.send('turn/start', { turn: 1 })
  await h.emit('agent/inbox/claimed', {
    agent: h.agent,
    message: { source: { kind: 'user' }, content: [{ type: 'text', text: '帮我看看这个文件' }] },
  })
  await h.emit('tools/result', {
    name: 'str_replace_editor',
    arguments: { command: 'view', path: join(h.project, 'src', 'automatic.ts') },
    agent: h.agent,
  }, { isError: false })
  const recalledAfterView = h.contexts[0].text({ scope: h.agent, agent: h.agent })
  assert.match(recalledAfterView, new RegExp(rule.id), 'read-only view should still populate activeFiles for contextual recall')
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 1, signal: new AbortController().signal })
  assert.equal(steered.length, 0, 'str_replace_editor(command: view) must NOT trigger Verification Gate')
  h.send('turn/end', { turn: 1, reason: { kind: 'completed' } })

  // Turn 2: read-only str_replace_editor({ command: 'view' }) (JSON string args) -> gate MUST NOT fire
  h.send('turn/start', { turn: 2 })
  await h.emit('tools/result', {
    name: 'str_replace_editor',
    arguments: JSON.stringify({ command: 'view', path: join(h.project, 'src', 'automatic.ts') }),
    agent: h.agent,
  }, { isError: false })
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 2, signal: new AbortController().signal })
  assert.equal(steered.length, 0, 'JSON-encoded str_replace_editor(command: view) must NOT trigger Verification Gate')
  h.send('turn/end', { turn: 2, reason: { kind: 'completed' } })

  // Turn 3: mutating str_replace_editor({ command: 'str_replace' }) -> gate MUST fire once
  h.send('turn/start', { turn: 3 })
  await h.emit('tools/result', {
    name: 'str_replace_editor',
    arguments: { command: 'str_replace', path: join(h.project, 'src', 'automatic.ts'), old_str: 'a', new_str: 'b' },
    agent: h.agent,
  }, { isError: false })
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 3, signal: new AbortController().signal })
  assert.equal(steered.length, 1, 'str_replace_editor(command: str_replace) must trigger Verification Gate')
  assert.match(steered[0].content[0].text, new RegExp(rule.id))
  h.send('turn/end', { turn: 3, reason: { kind: 'completed' } })

  // Turn 4: mutating str_replace_editor({ command: 'insert' }) -> gate MUST fire once
  h.send('turn/start', { turn: 4 })
  await h.emit('tools/result', {
    name: 'str_replace_editor',
    arguments: JSON.stringify({ command: 'insert', path: join(h.project, 'src', 'automatic.ts'), insert_line: 1, new_str: '// note' }),
    agent: h.agent,
  }, { isError: false })
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 4, signal: new AbortController().signal })
  assert.equal(steered.length, 2, 'str_replace_editor(command: insert) must trigger Verification Gate')
  h.send('turn/end', { turn: 4, reason: { kind: 'completed' } })
})

test('7b. dream_save masks secrets when cfg.maskSecrets is true, honors maskSecrets: false, and leaves direct saveDream untouched', async (t) => {
  const secretSk = 'sk-proj-DreamSaveSecret1234567890abcd'
  const secretDb = 'postgres://admin:SaveDbSecret99!@db.internal:5432/prod'
  const secretMood = 'Bearer tok_live_moodsecret1234567890'

  // (1) Default cfg.maskSecrets === true: reflection, lessons, and mood are all masked before persistence
  const maskedEnv = makeTempEnv(t)
  assert.equal(maskedEnv.cfg.maskSecrets, true)
  const maskedSave = buildDreamTools(maskedEnv.cfg).find((item) => item.name === 'dream_save')
  const maskedJournal = buildDreamTools(maskedEnv.cfg).find((item) => item.name === 'dream_journal')

  const saved = await maskedSave.execute({
    reflection: `排查接口时发现泄露了 ${secretSk}`,
    lessons: [`不要把 ${secretDb} 写进日志`, '提交前运行脱敏检查'],
    mood: `警惕 ${secretMood}`,
  })
  assert.equal(saved.ok, true)
  assert.doesNotMatch(saved.reflection, /DreamSaveSecret1234567890abcd/)
  assert.match(saved.reflection, /\[已脱敏/)
  assert.doesNotMatch(saved.lessons.join('\n'), /SaveDbSecret99!/)
  assert.match(saved.lessons[0], /\[已脱敏/)
  assert.equal(saved.lessons[1], '提交前运行脱敏检查')
  assert.doesNotMatch(saved.mood, /tok_live_moodsecret1234567890/)
  assert.match(saved.mood, /\[已脱敏/)

  // Verify raw dreams.jsonl on disk and dream_journal output contain zero raw secrets
  const diskText = readFileSync(journalFile(maskedEnv.journalDir), 'utf8')
  assert.doesNotMatch(diskText, /DreamSaveSecret1234567890abcd|SaveDbSecret99!|tok_live_moodsecret1234567890/)
  const journalOut = await maskedJournal.execute({ limit: 5 })
  assert.equal(journalOut.count, 1)
  assert.doesNotMatch(JSON.stringify(journalOut), /DreamSaveSecret1234567890abcd|SaveDbSecret99!|tok_live_moodsecret1234567890/)

  // (2) Explicit cfg.maskSecrets === false: raw text preserved
  const rawEnv = makeTempEnv(t, { maskSecrets: false })
  const rawSave = buildDreamTools(rawEnv.cfg).find((item) => item.name === 'dream_save')
  const rawSaved = await rawSave.execute({
    reflection: `显式关闭脱敏 ${secretSk}`,
    lessons: [`保留 ${secretDb}`],
    mood: `原样 ${secretMood}`,
  })
  assert.ok(rawSaved.reflection.includes(secretSk))
  assert.ok(rawSaved.lessons[0].includes('SaveDbSecret99!'))
  assert.ok(rawSaved.mood.includes('tok_live_moodsecret1234567890'))

  // (3) Direct saveDream() API preserves raw input for legacy migration / bridge tests
  const directEnv = makeTempEnv(t)
  const direct = saveDream(directEnv.journalDir, `直接写入 ${secretSk}`, [`旧教训 ${secretDb}`], '平静')
  assert.ok(direct.reflection.includes(secretSk))
  assert.ok(direct.lessons[0].includes('SaveDbSecret99!'))

  // (4) dream_save preserves embedded valid Dream reference IDs (lsn_<uuid>, evd_<uuid>) in prose
  // while still masking secrets and credential assignments whose value happens to look like a Dream ID
  const lsnRef = 'lsn_12345678-1234-1234-1234-123456789abc'
  const evdRef = 'evd_abcdef01-2345-6789-abcd-ef0123456789'
  const refSaved = await maskedSave.execute({
    reflection: `复盘参考 ${lsnRef} 与 ${evdRef}，切勿泄露 ${secretSk} 或 password="my secret pass 2026"`,
    lessons: [`核对 ${lsnRef} 条件`, `不要把 password=${lsnRef} 落盘`],
    mood: '清醒',
  })
  assert.ok(refSaved.reflection.includes(lsnRef), 'embedded lsn_<uuid> reference in reflection must be preserved')
  assert.ok(refSaved.reflection.includes(evdRef), 'embedded evd_<uuid> reference in reflection must be preserved')
  assert.doesNotMatch(refSaved.reflection, /DreamSaveSecret1234567890abcd|my secret pass 2026/)
  assert.ok(refSaved.lessons[0].includes(lsnRef), 'embedded lsn_<uuid> reference in lessons must be preserved')
  assert.doesNotMatch(refSaved.lessons[1], new RegExp(lsnRef), 'password=lsn_<uuid> assignment must still be masked')
})

test('7c. Hardened maskSecrets (path-prefix bypass, non-src long paths, quoted spaced secrets) & apply_patch Move to extraction', async (t) => {
  // (1) Non-src long workspace file paths & UUID-containing directory paths are preserved
  const longNonSrcPath = 'apps/Frontend/Components/Navigation/SidebarHeader.tsx'
  assert.equal(maskSecrets(longNonSrcPath), longNonSrcPath)
  assert.equal(
    maskSecrets('packages/Core/SessionQuery/SessionQuerySqlite/src/IndexFile.ts'),
    'packages/Core/SessionQuery/SessionQuerySqlite/src/IndexFile.ts',
  )
  const uuidWorkspacePath = 'C:/Users/29022/.gemini/antigravity/brain/cffb9432-e6e5-4067-952c-ac826680fd00/scratch/dsh-live-accept/workspace'
  assert.equal(maskSecrets(uuidWorkspacePath), uuidWorkspacePath)
  // Base64-like multi-slash secret must still be masked
  const slashSecret = 'AbCdEf12/GhIjKl34/MnOpQr56/StUvWx78/Yz0123456'
  assert.equal(maskSecrets(slashSecret), '[已脱敏·长令牌]')

  // (1b) dream_digest preserves embedded lsn_<uuid> references while masking secrets, and renders filtered query header
  const digestEnv = makeTempEnv(t)
  const lsnInSession = 'lsn_12345678-1234-1234-1234-123456789abc'
  mkdirSync(join(digestEnv.sessionsRoot, 'p', 's-ref'), { recursive: true })
  writeFileSync(join(digestEnv.sessionsRoot, 'p', 's-ref', 'session.jsonl.zstd'), makeSessionFile([
    makeHeader('s-ref', { version: 4, cwd: digestEnv.project }),
    makeEvent('turn/start', 1, { turn: 1 }),
    makeEvent('user/message', 2, { source: { kind: 'user' }, content: [{ type: 'text', text: `参考 ${lsnInSession} 核对 sk-proj-DigestSecret1234567890abcd` }] }),
    makeEvent('turn/end', 3, { turn: 1, reason: { kind: 'completed' } }),
  ]))
  const digestTool = buildDreamTools(digestEnv.cfg).find((item) => item.name === 'dream_digest')
  const digestOut = await digestTool.execute({ query: 'lsn_12345678', workspaceOnly: true }, { session: { header: { cwd: digestEnv.project } } })
  assert.equal(digestOut.count, 1)
  assert.ok(digestOut.sessions[0].userMessages[0].includes(lsnInSession), 'dream_digest must preserve valid Dream reference IDs')
  assert.doesNotMatch(digestOut.sessions[0].userMessages[0], /DigestSecret1234567890abcd/)
  const renderedDigest = digestTool.output.render({}, digestOut)[0].text
  assert.match(renderedDigest, /检索「lsn_12345678」命中 1 个会话（仅当前工作区）/)

  // (2) High-entropy 40+ char tokens hidden under src/ or lib/ MUST be masked (no path bypass!)
  const hiddenUnderSrc = 'src/aB3dEfGh1jK2LmN4oP5qR6sT7uV8wX9yZ0abcDEFghi'
  const maskedSrcTok = maskSecrets(hiddenUnderSrc)
  assert.doesNotMatch(maskedSrcTok, /aB3dEfGh1jK2LmN4oP5qR6sT7uV8wX9yZ0abcDEFghi/)
  assert.match(maskedSrcTok, /\[已脱敏·长令牌\]/)

  const hiddenUnderLib = 'https://api.example.com/lib/aB3dEfGh1jK2LmN4oP5qR6sT7uV8wX9yZ0abcDEFghi'
  assert.doesNotMatch(maskSecrets(hiddenUnderLib), /aB3dEfGh1jK2LmN4oP5qR6sT7uV8wX9yZ0abcDEFghi/)

  // (3) Quoted secrets / passphrases containing spaces are masked without crossing field boundaries
  for (const [sample, leak] of [
    ['password="my secret pass 2026"', 'my secret pass 2026'],
    ['{"password": "my secret pass 2026", "user": "alice"}', 'my secret pass 2026'],
    ["secret: 'correct horse battery staple'", 'correct horse battery staple'],
    ['token="sk-proj-AbCdEfGhIjKlMnOpQrStUvWx1234 extraSecret99"', 'extraSecret99'],
  ]) {
    const out = maskSecrets(sample)
    assert.ok(!out.includes(leak), `quoted spaced secret leaked in: ${out}`)
    assert.match(out, /\[已脱敏/)
  }
  // Ensure short quoted field does not span across sibling JSON keys
  const shortSibling = '{"password": "abc", "user": "alice_normal"}'
  assert.equal(maskSecrets(shortSibling), shortSibling)
  assert.deepEqual(
    extractDreamReferences('a lsn_12345678-1234-1234-1234-123456789abc and pvw_0123456789abcdef01234567'),
    ['lsn_12345678-1234-1234-1234-123456789abc', 'pvw_0123456789abcdef01234567'],
  )

  // (4) apply_patch `*** Move to: <path>` (DSH fs-patch syntax) extracts both source and destination
  const patchText = [
    '*** Begin Patch',
    '*** Update File: src/old-name.ts',
    '*** Move to: src/new-name.ts',
    '@@',
    '-export const x = 1',
    '+export const x = 2',
    '*** End Patch',
  ].join('\n')
  const paths = extractToolFilePaths({ name: 'apply_patch', arguments: { input: patchText } }, '/repo')
  assert.deepEqual(paths, ['src/old-name.ts', 'src/new-name.ts'])

  // End-to-end with AutomaticDream Verification Gate on moved destination file
  const h = makeAutomaticHarness(t)
  const steered = []
  h.agent.steer = (msg) => { steered.push(msg) }
  const detachTools = h.runtime.attachTools({ tools: {}, on: h.host.on })
  t.after(detachTools)

  const moveRule = seedAcceptedLesson(h.store(), {
    seedKey: 'move-dest-rule',
    kind: 'pitfall',
    title: '移动文件到 src/new-name.ts 后必须更新导出索引',
    action: '同步检查 src/index.ts 导出路径',
    when: '修改 src/new-name.ts 时',
    prevents: '断链导入',
    files: ['src/new-name.ts'],
    workspaceRoot: h.project,
  })
  h.runtime.control({ verificationGateEnabled: true })
  h.send('turn/start', { turn: 1 })
  await h.emit('tools/result', {
    name: 'apply_patch',
    arguments: { input: patchText },
    agent: h.agent,
  }, { isError: false })
  await h.emit('agent/turn-stopping', { agent: h.agent, turn: 1, signal: new AbortController().signal })
  assert.equal(steered.length, 1, 'apply_patch Move to destination must trigger Verification Gate')
  assert.match(steered[0].content[0].text, new RegExp(moveRule.id))
})
