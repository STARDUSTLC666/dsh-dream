import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDreamActionHandler, installDreamActions, DREAM_ACTION_ROUTE } from '../lib/web-actions.js'
import { KnowledgeStore } from '../lib/knowledge-store.js'
import { buildDreamTools } from '../lib/tools.js'
import { resolveConfig } from '../lib/config.js'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'dream-human-actions-'))
  const journalDir = join(root, 'journal'), project = join(root, 'project')
  mkdirSync(project, { recursive: true })
  const config = resolveConfig({ journalDir })
  const store = new KnowledgeStore(join(journalDir, 'knowledge'))
  const lesson = store.createLesson({ kind: 'procedure', title: '校验再交付', action: '检查结果后再报告完成', when: '任务交付时', workspaceRoot: project, global: false, evidence: [] }, 'seed', { requireReview: true }).lesson
  const handler = createDreamActionHandler({ config })
  const call = async (body, headers = {}, options = {}) => {
    const request = new Request('http://127.0.0.1:8181' + DREAM_ACTION_ROUTE, { method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-dream-action': '1', ...headers }, body: JSON.stringify(body), ...options })
    const response = await handler(request)
    return { status: response.status, body: await response.json() }
  }
  return { root, project, journalDir, store, lesson, handler, call, config }
}

test('mutations are registered exclusively through the authenticated Connection carrier', () => {
  const names = [], routes = []
  installDreamActions({ inject(deps, callback) { names.push(deps); callback({ connection: { fetch: { register(route) { routes.push(route) } } } }) } }, { journalDir: join(tmpdir(), 'dream-uncreated-actions') })
  assert.deepEqual(names, [['connection']])
  assert.equal(routes[0].path, DREAM_ACTION_ROUTE)
  assert.deepEqual(routes[0].methods, ['POST'])
  assert.equal(routes[0].requestBody, 'buffered')
  assert.doesNotThrow(() => installDreamActions({ inject(deps, callback) { callback({}) } }))
})

test('human review and model review have distinct actors; stale versions cannot write', async () => {
  const env = fixture()
  const accepted = await env.call({ operation: 'review', action: 'accept', lessonId: env.lesson.id, expectedRevision: 1, actor: 'model' })
  assert.equal(accepted.status, 200)
  assert.equal(env.store.getLesson(env.lesson.id).review.actor, 'human')
  const bytes = readFileSync(join(env.journalDir, 'knowledge/events.jsonl'), 'utf8')
  const stale = await env.call({ operation: 'review', action: 'reject', lessonId: env.lesson.id, expectedRevision: 1 })
  assert.equal(stale.status, 409)
  assert.equal(readFileSync(join(env.journalDir, 'knowledge/events.jsonl'), 'utf8'), bytes)
  const review = buildDreamTools(env.config).find(tool => tool.name === 'dream_review')
  await review.execute({ action: 'reject', lessonId: env.lesson.id, expectedRevision: 2, actor: 'human' })
  assert.equal(env.store.getLesson(env.lesson.id).review.actor, 'model')
})

test('the official HTTP bridge internal URL is checked against the preserved Host', async () => {
  const env = fixture()
  const request = new Request('http://dsh.internal' + DREAM_ACTION_ROUTE, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-dream-action': '1', host: '127.0.0.1:8181', origin: 'http://127.0.0.1:8181', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify({ operation: 'review', action: 'accept', lessonId: env.lesson.id, expectedRevision: 1 }),
  })
  assert.equal((await env.handler(request)).status, 200)
})

test('feedback persists, does not accept or validate a lesson, and retries are idempotent', async () => {
  const env = fixture()
  const body = { operation: 'feedback', lessonId: env.lesson.id, expectedRevision: 1, vote: 'not-applicable', requestId: 'feedback_retry_test', note: '当前任务不适用' }
  assert.equal((await env.call(body)).status, 200)
  assert.equal((await env.call(body)).status, 200)
  const saved = new KnowledgeStore(join(env.journalDir, 'knowledge')).getLesson(env.lesson.id)
  assert.equal(saved.feedback.notApplicable, 1)
  assert.equal(saved.feedback.recent[0].note, body.note)
  assert.equal(saved.state, 'candidate')
  assert.deepEqual(saved.review, env.lesson.review)
  assert.deepEqual(saved.evidenceIds, env.lesson.evidenceIds)
  assert.equal(saved.lastValidatedAt, env.lesson.lastValidatedAt)
  assert.equal((await env.call({ ...body, vote: 'useful' })).status, 409)
  assert.equal((await env.call({ ...body, requestId: 'another_feedback_test' })).status, 409)
})

test('feedback detail remains bounded and notes are masked on disk', () => {
  const env = fixture()
  let revision = 1
  for (let i = 0; i < 24; i++) revision = env.store.recordFeedback(env.lesson.id, 'useful', 'token=sk-abcdefghijklmnopqrstuvwxyz1234567890', revision, 'feedback-' + i).revision
  const saved = env.store.getLesson(env.lesson.id)
  assert.equal(saved.feedback.useful, 24)
  assert.equal(saved.feedback.recent.length, 20)
  assert.ok(!readFileSync(join(env.journalDir, 'knowledge/events.jsonl'), 'utf8').includes('sk-abcdefghijklmnopqrstuvwxyz1234567890'))
})

test('simple, cross-origin, malformed, oversized and cancelled requests do not write', async () => {
  const env = fixture()
  const body = { operation: 'review', action: 'accept', lessonId: env.lesson.id, expectedRevision: 1 }
  const before = readFileSync(join(env.journalDir, 'knowledge/events.jsonl'), 'utf8')
  assert.equal((await env.call(body, { 'content-type': 'text/plain' })).status, 415)
  assert.equal((await env.call(body, { 'x-dsh-dream-action': '' })).status, 403)
  assert.equal((await env.call(body, { origin: 'http://127.0.0.1:9999' })).status, 403)
  assert.equal((await env.call(body, { 'sec-fetch-site': 'cross-site' })).status, 403)
  assert.equal((await env.call(body, {}, { body: '{' })).status, 400)
  assert.equal((await env.call(body, {}, { body: 'x'.repeat(70000) })).status, 413)
  const controller = new AbortController(); controller.abort()
  assert.equal((await env.call(body, {}, { signal: controller.signal })).status, 409)
  assert.equal(readFileSync(join(env.journalDir, 'knowledge/events.jsonl'), 'utf8'), before)
})

test('apply binds the approved preview, guards file/lesson changes and preserves manual text through rollback', async () => {
  const env = fixture()
  const file = join(env.project, 'AGENTS.md')
  writeFileSync(file, '# 人工规则\n保留这段\n')
  const accepted = await env.call({ operation: 'review', action: 'accept', lessonId: env.lesson.id, expectedRevision: 1 })
  assert.equal(accepted.status, 200)
  const preview = await env.call({ operation: 'preview', lessonId: env.lesson.id, expectedRevision: 2, path: 'C:/Windows/AGENTS.md' })
  assert.equal(preview.status, 200, JSON.stringify(preview.body))
  assert.equal(preview.body.resolvedPath, file)
  assert.equal(readFileSync(file, 'utf8'), '# 人工规则\n保留这段\n')
  writeFileSync(file, '# 人工规则\n保留这段\n新的人工内容\n')
  const changed = await env.call({ operation: 'apply', token: preview.body.token })
  assert.equal(changed.status, 409)
  assert.equal(changed.body.error.code, 'conflict')
  assert.equal((await env.call({ operation: 'apply', token: preview.body.token })).status, 409)
  const fresh = await env.call({ operation: 'preview', lessonId: env.lesson.id, expectedRevision: 2 })
  const applied = await env.call({ operation: 'apply', token: fresh.body.token, expectedSha256: null, path: 'C:/Windows/AGENTS.md' })
  assert.equal(applied.status, 200, JSON.stringify(applied.body))
  assert.match(readFileSync(file, 'utf8'), /检查结果后再报告完成/)
  assert.equal((await env.call({ operation: 'rollback', backupId: applied.body.backupId })).status, 200)
  assert.equal(readFileSync(file, 'utf8').trim(), '# 人工规则\n保留这段\n新的人工内容')
  const next = await env.call({ operation: 'preview', lessonId: env.lesson.id, expectedRevision: 2 })
  await env.call({ operation: 'feedback', lessonId: env.lesson.id, expectedRevision: 2, vote: 'useful', requestId: 'preview_changed_lesson' })
  assert.equal((await env.call({ operation: 'apply', token: next.body.token })).status, 409)
})

test('read-only UI queries and handler registration do not create a knowledge directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'dream-actions-uncreated-'))
  createDreamActionHandler({ journalDir: join(root, 'journal') })
  assert.equal(existsSync(join(root, 'journal')), false)
})
