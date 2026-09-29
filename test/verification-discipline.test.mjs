/**
 * 证据纪律验收（R2′ + lead 追加约束）。
 *
 * 1) read 证据 → 初始 usable；claimed/无证据 → candidate（受 R1 扣留）。
 * 2) user-correction + read → usable，且 review 记 actor=user / decision=accepted。
 * 3) 防自我提权：claimed 证据经 dream_learn 走完整链路后仍是 candidate，绝不能变 usable。
 * 4) 文案：skills/dream-protocol/SKILL.md 必须写明
 *    「只有真的读到来源才能标 read，自我判断一律 claimed」。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDreamTools, resolveConfig } from '../lib/index.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')

function makeEnv() {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-discipline-'))
  const cfg = resolveConfig({ sessionsRoot: join(dir, 'sessions'), journalDir: join(dir, 'dreams') })
  const tools = buildDreamTools(cfg)
  return { dir, tools, learn: tools.find((tool) => tool.name === 'dream_learn') }
}

const baseInput = {
  kind: 'fact',
  title: '纪律验收经验',
  action: '按证据标注规则执行',
  when: '提交技术经验时',
  projectId: 'proj-discipline',
}

test('R2′：read 证据（session）→ 初始 usable', async () => {
  const env = makeEnv()
  try {
    const result = await env.learn.execute({
      ...baseInput,
      evidence: [{ kind: 'session', sessionId: 's-read', recordSeq: 1, summary: '实测确认', verification: 'read' }],
    })
    assert.equal(result.state, 'usable')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('R2′：user-correction + read → usable 且 review 记 actor=user / accepted', async () => {
  const env = makeEnv()
  try {
    const result = await env.learn.execute({
      ...baseInput,
      evidence: [{ kind: 'user-correction', sessionId: 's-user', recordSeq: 2, summary: '用户明确纠正', verification: 'read' }],
    })
    assert.equal(result.state, 'usable')
    const tool = env.tools.find((item) => item.name === 'dream_learn')
    assert.ok(tool !== undefined)
    // 通过 store 读回 review 内容
    const { KnowledgeStore } = await import('../lib/knowledge-store.js')
    const lesson = new KnowledgeStore(join(env.dir, 'dreams', 'knowledge')).getLesson(result.lessonId)
    assert.equal(lesson.state, 'usable')
    assert.equal(lesson.review.decision, 'accepted')
    assert.equal(lesson.review.actor, 'user')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('防自我提权：claimed 证据经 dream_learn 仍是 candidate', async () => {
  const env = makeEnv()
  try {
    const result = await env.learn.execute({
      ...baseInput,
      evidence: [{ kind: 'session', sessionId: 's-claimed', recordSeq: 3, summary: '只是模型声称', verification: 'claimed' }],
    })
    assert.equal(result.state, 'candidate')
    assert.equal(result.independentSupportCount, 0)
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('无证据：dream_learn 缺省 evidence 仍是 candidate（R5 的 evidence 可选）', async () => {
  const env = makeEnv()
  try {
    const result = await env.learn.execute({ ...baseInput })
    assert.equal(result.state, 'candidate')
    assert.equal(result.independentSupportCount, 0)
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('文案：SKILL.md 写明 read 的来源要求与「自我判断一律 claimed」', () => {
  const text = readFileSync(join(root, 'skills', 'dream-protocol', 'SKILL.md'), 'utf8').replace(/\s+/g, ' ')
  assert.match(text, /才能标\s*read/, '必须写明什么情况才能标 read')
  assert.match(text, /自我判断[^。]{0,20}claimed/, '必须写明自我判断一律 claimed')
})
