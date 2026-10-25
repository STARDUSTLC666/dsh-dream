import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildDreamTools, KnowledgeStore, resolveConfig, saveDream, selectBridgeLessons, lessonScopeLabel } from '../lib/index.js'
import { createDreamActionHandler, DREAM_ACTION_ROUTE } from '../lib/web-actions.js'
import { memoryDirectory } from '../lib/memory.js'

function setup(t, role = 'user/message') {
  const root = mkdtempSync(join(import.meta.dirname, '.human-boundary-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const project = join(root, 'project'), sessionsRoot = join(root, 'sessions')
  mkdirSync(project)
  const session = join(sessionsRoot, 'project-a', 'session-a')
  mkdirSync(session, { recursive: true })
  const text = '交付前先检查文件是否完整。'
  writeFileSync(join(session, 'session.v4.jsonl'), [
    { type: 'session', version: 4, id: 'session-a', cwd: project },
    { type: role, seq: 7, data: { source: { kind: 'user' }, content: [{ type: 'text', text }] } },
  ].map(JSON.stringify).join('\n') + '\n')
  const cfg = resolveConfig({ journalDir: join(root, 'journal'), sessionsRoot })
  const store = new KnowledgeStore(join(cfg.journalDir, 'knowledge'))
  const tools = buildDreamTools(cfg), tool = name => tools.find(tool => tool.name === name)
  const input = { kind: 'procedure', title: '交付前检查', action: text, when: '交付文件时', workspaceRoot: project, projectId: 'project-a', evidence: [{ kind: 'session', sessionId: 'session-a', recordSeq: 7, summary: text, verification: 'read' }] }
  const handler = createDreamActionHandler({ config: cfg })
  const call = async body => {
    const response = await handler(new Request('http://127.0.0.1' + DREAM_ACTION_ROUTE, { method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-dream-action': '1' }, body: JSON.stringify(body) }))
    return { status: response.status, body: await response.json() }
  }
  return { root, project, cfg, store, tool, input, call }
}

test('model accept is a recommendation, cannot forge a human actor and writes no events', async t => {
  const e = setup(t), created = await e.tool('dream_learn').execute(e.input)
  const events = join(e.cfg.journalDir, 'knowledge', 'events.jsonl'), bytes = readFileSync(events)
  const review = e.tool('dream_review'), result = await review.execute({ action: 'accept', lessonId: created.lessonId, expectedRevision: 1, actor: 'human', confirmGlobal: true })
  assert.equal(result.requiresHumanReview, true)
  assert.equal(result.state, 'candidate')
  assert.equal(result.revision, 1)
  assert.equal(e.store.getLesson(created.lessonId).review.decision, 'unreviewed')
  assert.deepEqual(readFileSync(events), bytes)
  assert.match(review.output.render({}, result)[0].text, /状态未改变/)
  const accepted = await e.call({ operation: 'review', action: 'accept', lessonId: created.lessonId, expectedRevision: 1, actor: 'model' })
  assert.equal(accepted.status, 200)
  assert.equal(e.store.getLesson(created.lessonId).review.actor, 'human')
})

test('existing model/user/actor-less acceptances cannot enter automatic summary, default context or rule bridge', async t => {
  const e = setup(t), created = await e.tool('dream_learn').execute({ ...e.input, global: true })
  let current = e.store.getLesson(created.lessonId)
  for (const actor of ['model', 'user', undefined]) {
    current = e.store.reviewLesson(current.id, 'accepted', current.revision, 'old-actor-' + String(actor), actor)
    assert.deepEqual(selectBridgeLessons([current], {}).eligible, [])
    assert.equal(selectBridgeLessons([current], {}).skipped[0].reason, 'human-review-required')
    assert.deepEqual(memoryDirectory([current], e.store.listEvidence()).summary, [])
    assert.deepEqual((await e.tool('dream_context').execute({ query: '交付前检查' })).items, [])
  }
})

test('tool output is retained as an observed reference without independent support', async t => {
  const e = setup(t, 'tool/result'), created = await e.tool('dream_learn').execute({ ...e.input, global: true })
  assert.equal(created.independentSupportCount, 0)
  const [evidence] = e.store.listEvidence()
  assert.equal(evidence.verification, 'claimed')
  assert.equal(evidence.verificationReason, 'tool-output-observed')
  assert.equal(evidence.sourceHash.length, 64)
  await e.tool('dream_review').execute({ action: 'accept', lessonId: created.lessonId, expectedRevision: 1 })
  assert.equal(e.store.getLesson(created.lessonId).state, 'candidate')
  const preview = await e.tool('dream_bridge').execute({ lessonIds: [created.lessonId] }, { cwd: e.project })
  assert.equal(preview.mode, 'preview')
  assert.equal(existsSync(join(e.project, 'AGENTS.md')), false)
  assert.ok(preview.ok === false || preview.lessons.length === 0)
})

test('human global acceptance requires an explicit scope confirmation, for single and batch actions', async t => {
  const e = setup(t), created = await e.tool('dream_learn').execute({ ...e.input, global: true })
  const args = { action: 'accept', lessonId: created.lessonId, expectedRevision: 1 }
  assert.equal((await e.call({ ...args, operation: 'review' })).status, 400)
  const batch = { operation: 'review-batch', action: 'accept', items: [{ lessonId: created.lessonId, expectedRevision: 1 }], requestId: 'global_accept_batch' }
  assert.equal((await e.call(batch)).status, 400)
  assert.equal(e.store.getLesson(created.lessonId).revision, 1)
  assert.equal((await e.call({ ...batch, confirmGlobal: true })).status, 200)
  const accepted = e.store.getLesson(created.lessonId)
  assert.equal(accepted.review.actor, 'human')
  assert.equal(accepted.scope.global, true)
  assert.equal(lessonScopeLabel(accepted.scope), '全局', 'global scope must not be mislabeled as its source workspace')
  assert.equal(selectBridgeLessons([accepted], {}).eligible.length, 1)
  const other = await e.tool('dream_learn').execute({ ...e.input, title: '全局交付第二条', global: true })
  assert.equal((await e.call({ operation: 'review', action: 'accept', lessonId: other.lessonId, expectedRevision: 1, confirmGlobal: true })).status, 200)
})

test('omitting bridge mode previews reviewed knowledge and never writes legacy journal instructions', async t => {
  const e = setup(t)
  saveDream(e.cfg.journalDir, 'Unreviewed journal', ['不要将日记观察直接写入规则'], '平静')
  const result = await e.tool('dream_bridge').execute({}, { cwd: e.project })
  assert.equal(result.mode, 'preview')
  assert.equal(existsSync(join(e.project, 'AGENTS.md')), false)
})

test('model conflict resolution is also a read-only recommendation', async t => {
  const e = setup(t), created = await e.tool('dream_learn').execute(e.input)
  const other = await e.tool('dream_learn').execute({ ...e.input, title: '交付前检查冲突', action: '另一项检查动作' })
  await e.tool('dream_review').execute({ action: 'mark-disputed', lessonId: created.lessonId, expectedRevision: 1, conflictWith: [other.lessonId] })
  const before = e.store.getLesson(created.lessonId)
  const result = await e.tool('dream_review').execute({ action: 'resolve-conflict', lessonId: created.lessonId, expectedRevision: before.revision, resolution: 'prefer', note: 'model recommendation', affectedIds: [other.lessonId] })
  assert.equal(result.requiresHumanReview, true)
  assert.deepEqual(e.store.getLesson(created.lessonId), before)
})
