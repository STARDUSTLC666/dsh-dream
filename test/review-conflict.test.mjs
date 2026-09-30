/**
 * M2-2 冲突与采纳独立验收（lead 合并裁定最终版）。
 *
 * mark-disputed(A,[B])：A/B 双向登记 conflictIds，双方都不得再被 dream_context 注入，note 可回溯。
 * resolve-conflict（targetId + affectedIds + resolution + note，note 必填）：
 *   prefer：target → usable；affected → rejected（review.note 含「败给 targetId」）；conflictIds 互清。
 *   drop  ：target → rejected（note「冲突解析：放弃本条目」）；affected 若 disputed 且 conflictIds 已空 → usable。
 *   merge ：target → usable，supersedes 并入 affected，evidenceIds 取并集；affected → stale；conflictIds 互清。
 * 校验：target/affected 必须存在、互为 conflictIds、都处于 disputed；任一不满足 → KnowledgeError("invalid") 零写入。
 * 事件必须含 resolution{kind,targetId,affectedIds} 与 note，replay 可恢复。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { KnowledgeStore } from '../lib/knowledge-store.js'
import { seedSessionEvidence } from './fixtures/session-evidence.mjs'

function makeEnv() {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-conflict-'))
  const journalDir = join(dir, 'journal')
  const cfg = resolveConfig({ sessionsRoot: join(dir, 'sessions'), journalDir })
  const tools = buildDreamTools(cfg)
  return {
    dir, journalDir, cfg,
    scope: { projectId: 'proj-conflict' },
    learn: tools.find((tool) => tool.name === 'dream_learn'),
    review: tools.find((tool) => tool.name === 'dream_review'),
    context: tools.find((tool) => tool.name === 'dream_context'),
    store: () => new KnowledgeStore(join(journalDir, 'knowledge')),
    eventsFile: join(journalDir, 'knowledge', 'events.jsonl'),
    cleanup() { rmSync(dir, { recursive: true, force: true }) },
  }
}

async function learn(env, title) {
  const evidence = [{ kind: 'session', sessionId: 'sess-' + title, recordSeq: 1, summary: '实测确认 ' + title, verification: 'read' }]
  seedSessionEvidence(env.cfg, evidence, env.scope)
  const result = await env.learn.execute({
    kind: 'procedure', title, action: '执行 ' + title, when: '冲突验收', ...env.scope,
    evidence,
  })
  assert.equal(result.state, 'candidate')
  const accepted = await env.review.execute({ action: 'accept', lessonId: result.lessonId, expectedRevision: 1 })
  assert.equal(accepted.state, 'usable')
  return result.lessonId
}

async function review(env, args) {
  try {
    const value = await env.review.execute(args)
    return { ok: value === null || typeof value !== 'object' ? true : value.ok !== false, value }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function refusalText(result) {
  if (result.ok) return null
  const value = result.value !== undefined && result.value !== null && typeof result.value === 'object' ? result.value : {}
  const code = value.error !== undefined && value.error !== null ? String(value.error.code ?? '') : ''
  const message = result.error ?? (value.error !== undefined && value.error !== null ? String(value.error.message ?? '') : '')
  return (String(message) + ' ' + code).trim()
}

function eventsOf(env) {
  return readFileSync(env.eventsFile, 'utf8').split('\n').filter((line) => line.trim() !== '').map((line) => JSON.parse(line))
}

async function contextIds(env, query) {
  const result = await env.context.execute({ query, ...env.scope })
  return result.items.map((item) => item.lessonId)
}

/** 建立一对互相 disputed 的经验，返回 { a, b, rev }（rev = target 当前 revision）。 */
async function disputedPair(env) {
  const a = await learn(env, '重试发送：失败后立刻重试')
  const b = await learn(env, '超时不重试：结果不明先查状态')
  const marked = await review(env, { action: 'mark-disputed', lessonId: a, expectedRevision: env.store().getLesson(a).revision, conflictWith: [b], note: '两条互斥-验收' })
  assert.equal(marked.ok, true, 'mark-disputed 应成功：' + JSON.stringify(marked).slice(0, 300))
  return { a, b, rev: env.store().getLesson(a).revision }
}

test('冲突双向性：mark-disputed(A,[B]) 后双方都不被 dream_context 注入、conflictIds 互登、note 可回溯', async () => {
  const env = makeEnv()
  try {
    const { a, b } = await disputedPair(env)
    const la = env.store().getLesson(a)
    const lb = env.store().getLesson(b)
    assert.ok(la.conflictIds.includes(b), 'A 必须登记 B，实际 ' + JSON.stringify(la.conflictIds))
    assert.ok(lb.conflictIds.includes(a), 'B 必须反向登记 A（只标记一方 = 不过），实际 ' + JSON.stringify(lb.conflictIds))

    const ids = await contextIds(env, '发送 重试 超时')
    assert.equal(ids.includes(a), false, 'A 不得再注入')
    assert.equal(ids.includes(b), false, 'B 不得再注入（只标记 A 也要让 B 停下）')
    assert.ok(eventsOf(env).some((event) => JSON.stringify(event).includes('两条互斥-验收')), 'note 必须写进事件')
  } finally { env.cleanup() }
})

test('resolve-conflict · prefer：target→usable、affected→rejected（败给 target）、conflictIds 互清、事件可回放', async () => {
  const env = makeEnv()
  try {
    const { a, b, rev } = await disputedPair(env)
    const resolved = await review(env, { action: 'resolve-conflict', targetId: a, affectedIds: [b], expectedRevision: rev, resolution: 'prefer', note: 'prefer 验收' })
    assert.equal(resolved.ok, true, 'prefer 应成功：' + JSON.stringify(resolved).slice(0, 300))

    const la = env.store().getLesson(a)
    const lb = env.store().getLesson(b)
    assert.equal(la.state, 'usable')
    assert.equal(lb.state, 'rejected')
    assert.match(String(lb.review.note ?? ''), new RegExp(a), 'affected 的 review.note 应含「败给 ' + a + '」')
    assert.deepEqual(la.conflictIds, [])
    assert.deepEqual(lb.conflictIds, [])

    const ids = await contextIds(env, '发送 重试 超时')
    assert.ok(ids.includes(a), 'target 应恢复注入')
    assert.equal(ids.includes(b), false, 'affected 不得注入')

    const trace = eventsOf(env).map((event) => JSON.stringify(event)).join('\n')
    assert.ok(trace.includes('prefer') && trace.includes('prefer 验收') && trace.includes(a) && trace.includes(b), '事件必须含 resolution{kind,targetId,affectedIds} 与 note')
    const replayed = new KnowledgeStore(join(env.journalDir, 'knowledge'))
    assert.equal(replayed.getLesson(a).state, 'usable')
    assert.equal(replayed.getLesson(b).state, 'rejected')
  } finally { env.cleanup() }
})

test('resolve-conflict · drop：target→rejected、对端 disputed 且 conflictIds 空→usable、事件可回放', async () => {
  const env = makeEnv()
  try {
    const { a, b, rev } = await disputedPair(env)
    const resolved = await review(env, { action: 'resolve-conflict', targetId: a, affectedIds: [b], expectedRevision: rev, resolution: 'drop', note: 'drop 验收' })
    assert.equal(resolved.ok, true, 'drop 应成功：' + JSON.stringify(resolved).slice(0, 300))

    const la = env.store().getLesson(a)
    const lb = env.store().getLesson(b)
    assert.equal(la.state, 'rejected')
    assert.match(String(la.review.note ?? ''), /放弃/)
    assert.equal(lb.state, 'usable', '对端应回到 usable')
    assert.deepEqual(la.conflictIds, [])
    assert.deepEqual(lb.conflictIds, [])

    const ids = await contextIds(env, '发送 重试 超时')
    assert.equal(ids.includes(a), false, 'target 不得注入')
    assert.ok(ids.includes(b), '对端应恢复注入')
    const replayed = new KnowledgeStore(join(env.journalDir, 'knowledge'))
    assert.equal(replayed.getLesson(a).state, 'rejected')
    assert.equal(replayed.getLesson(b).state, 'usable')
  } finally { env.cleanup() }
})

test('resolve-conflict · merge：target→usable + supersedes 并入 + evidenceIds 并集、affected→stale、事件可回放', async () => {
  const env = makeEnv()
  try {
    const { a, b, rev } = await disputedPair(env)
    const beforeA = env.store().getLesson(a)
    const beforeB = env.store().getLesson(b)
    const resolved = await review(env, { action: 'resolve-conflict', targetId: a, affectedIds: [b], expectedRevision: rev, resolution: 'merge', note: 'merge 验收' })
    assert.equal(resolved.ok, true, 'merge 应成功：' + JSON.stringify(resolved).slice(0, 300))

    const la = env.store().getLesson(a)
    const lb = env.store().getLesson(b)
    assert.equal(la.state, 'usable')
    assert.ok(Array.isArray(la.supersedes) && la.supersedes.includes(b), 'supersedes 必须并入 affectedIds')
    for (const id of beforeA.evidenceIds.concat(beforeB.evidenceIds)) {
      assert.ok(la.evidenceIds.includes(id), 'evidenceIds 必须取并集，缺 ' + id)
    }
    assert.equal(lb.state, 'stale')
    assert.deepEqual(la.conflictIds, [])
    assert.deepEqual(lb.conflictIds, [])

    const ids = await contextIds(env, '发送 重试 超时')
    assert.ok(ids.includes(a), 'merged target 应注入')
    assert.equal(ids.includes(b), false, 'stale affected 不得注入')
    const trace = eventsOf(env).map((event) => JSON.stringify(event)).join('\n')
    assert.ok(trace.includes('merge') && trace.includes('merge 验收'), '事件必须含 merge 与 note')
    const replayed = new KnowledgeStore(join(env.journalDir, 'knowledge'))
    assert.equal(replayed.getLesson(a).state, 'usable')
    assert.equal(replayed.getLesson(b).state, 'stale')
  } finally { env.cleanup() }
})

test('resolve-conflict 校验：note 缺失 / affected 未登记冲突 → invalid 零写入', async () => {
  const env = makeEnv()
  try {
    const { a, b, rev } = await disputedPair(env)
    const beforeLines = eventsOf(env).length
    const missingNote = await review(env, { action: 'resolve-conflict', targetId: a, affectedIds: [b], expectedRevision: rev, resolution: 'prefer' })
    const missingNoteText = refusalText(missingNote)
    assert.ok(missingNoteText !== null && missingNoteText.length > 0, 'note 缺失必须拒绝')
    assert.equal(env.store().getLesson(a).state, 'disputed', '拒绝后状态不得变')
    assert.equal(env.store().getLesson(b).state, 'disputed')
    assert.equal(eventsOf(env).length, beforeLines, '拒绝必须零写入')

    const fresh = makeEnv()
    try {
      const x = await learn(fresh, '无冲突甲')
      const y = await learn(fresh, '无冲突乙')
      const beforeFresh = eventsOf(fresh).length
      const notConflicting = await review(fresh, { action: 'resolve-conflict', targetId: x, affectedIds: [y], expectedRevision: fresh.store().getLesson(x).revision, resolution: 'prefer', note: '不该成功' })
      const text = refusalText(notConflicting)
      assert.ok(text !== null && text.length > 0, '未互为冲突必须拒绝')
      assert.equal(fresh.store().getLesson(x).state, 'usable')
      assert.equal(fresh.store().getLesson(y).state, 'usable')
      assert.equal(eventsOf(fresh).length, beforeFresh, '拒绝必须零写入')
    } finally { fresh.cleanup() }
  } finally { env.cleanup() }
})
