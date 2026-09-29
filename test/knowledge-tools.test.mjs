import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { KnowledgeStore } from '../lib/knowledge-store.js'

function makeEnv() {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-knowledge-'))
  const cfg = resolveConfig({ sessionsRoot: join(dir, 'sessions'), journalDir: join(dir, 'dreams') })
  return {
    dir,
    cfg,
    tools: buildDreamTools(cfg),
    cleanup() { rmSync(dir, { recursive: true, force: true }) },
  }
}

function toolOf(env, name) {
  const tool = env.tools.find((item) => item.name === name)
  assert.ok(tool, '缺少工具 ' + name)
  return tool
}

function storeOf(env) {
  return new KnowledgeStore(join(env.cfg.journalDir, 'knowledge'))
}

/** 递归快照目录内容（相对路径 + 字节 + mtimeMs），用于证明只读调用零写入。 */
function snapshot(root) {
  const rows = []
  if (!existsSync(root)) return rows
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else rows.push([relative(root, full).replace(/\\/g, '/'), readFileSync(full, 'utf8'), statSync(full).mtimeMs])
    }
  }
  walk(root)
  return rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
}

/** 按宿主 enforced schema 子集走一遍注册出的 parameters（类型单串、enum 非空、对象 openness 显式、required 有声明）。 */
function assertHostSubset(node, path, options = {}) {
  assert.ok(node !== null && typeof node === 'object' && !Array.isArray(node), path + ' 必须是 schema 对象')
  if (Array.isArray(node.oneOf)) {
    assert.ok(node.oneOf.length >= 2, path + '.oneOf 至少 2 个分支')
    node.oneOf.forEach((branch, index) => assertHostSubset(branch, path + '.oneOf[' + index + ']'))
    return
  }
  assert.equal(typeof node.type, 'string', path + '.type 必须是单个字符串')
  assert.ok(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'].includes(node.type), path + '.type 不受支持')
  if (node.description !== undefined) assert.equal(typeof node.description, 'string', path + '.description 必须是字符串')
  if (node.enum !== undefined) {
    assert.ok(Array.isArray(node.enum) && node.enum.length > 0, path + '.enum 必须非空')
  }
  if (node.type === 'object') {
    if (node.additionalProperties !== undefined) assert.equal(typeof node.additionalProperties, 'boolean', path + '.additionalProperties 必须是布尔')
    const properties = node.properties ?? {}
    assert.ok(properties !== null && typeof properties === 'object' && !Array.isArray(properties), path + '.properties 必须是对象')
    for (const key of node.required ?? []) assert.ok(Object.hasOwn(properties, key), path + '.required 引用了未声明的 ' + key)
    for (const [key, child] of Object.entries(properties)) assertHostSubset(child, path + '.properties.' + key)
    return
  }
  if (node.type === 'array' && node.items !== undefined) assertHostSubset(node.items, path + '.items')
  if (!options.root) assert.equal(node.required, undefined, path + '.required 只能出现在对象上')
}

const EVIDENCE_READ = {
  kind: 'session',
  sessionId: 'sess-1',
  recordSeq: 7,
  summary: '复现确认：取消后连接仍在投递',
  verification: 'read',
}

test('注册 9 个工具且既有 6 个顺序不变；对象数组与 enum schema 形状正确', () => {
  const env = makeEnv()
  try {
    assert.deepEqual(env.tools.map((tool) => tool.name), [
      'dream_digest', 'dream_save', 'dream_journal', 'dream_recall', 'dream_bridge', 'dream_health',
      'dream_learn', 'dream_context', 'dream_review',
    ])

    const learn = toolOf(env, 'dream_learn')
    const evidence = learn.parameters.properties.evidence
    assert.equal(evidence.type, 'array')
    assert.equal(evidence.items.type, 'object', 'evidence 必须是对象数组而不是字符串数组')
    assert.equal(evidence.items.properties.summary.type, 'string')
    assert.deepEqual([...evidence.items.required].sort(), ['kind', 'summary', 'verification'].sort())
    assert.ok(Array.isArray(evidence.items.properties.verification.enum))
    assert.deepEqual([...evidence.items.properties.verification.enum].sort(), ['claimed', 'read'])
    const recordSeq = evidence.items.properties.recordSeq
    assert.deepEqual(recordSeq.oneOf.map((branch) => branch.type).sort(), ['integer', 'string'], 'recordSeq 接受数字或字符串')
    assert.ok(Array.isArray(learn.parameters.properties.kind.enum))
    assert.deepEqual([...learn.parameters.properties.kind.enum].sort(), ['fact', 'pitfall', 'preference', 'procedure'])
    assert.deepEqual([...learn.parameters.required].sort(), ['action', 'evidence', 'kind', 'title', 'when'].sort())

    const applicability = learn.parameters.properties.applicability
    assert.equal(applicability.items.type, 'object')
    assert.equal(applicability.items.properties.versions.type, 'string')

    const review = toolOf(env, 'dream_review')
    assert.equal(review.parameters.properties.evidence.items.type, 'object', 'review.evidence 也必须是对象数组')
    assert.ok(Array.isArray(review.parameters.properties.action.enum))
    assert.deepEqual([...review.parameters.properties.action.enum].sort(), [
      'accept', 'attach-evidence', 'mark-disputed', 'mark-stale', 'reject', 'resolve-conflict',
    ].sort())
    assert.ok(review.parameters.required.includes('expectedRevision'))

    const context = toolOf(env, 'dream_context')
    assert.deepEqual([...context.parameters.required], ['query'])

    const save = toolOf(env, 'dream_save')
    assert.deepEqual(save.parameters.properties.lessons.items, { type: 'string' }, '既有字符串数组形状不变')
    assert.equal(learn.parameters.properties.exceptions.items.type, 'string')

    for (const tool of env.tools) assertHostSubset(tool.parameters, tool.name + '.parameters')
  } finally { env.cleanup() }
})

test('dream_learn：无证据只能 candidate，字段与指纹齐备', async () => {
  const env = makeEnv()
  try {
    const result = await toolOf(env, 'dream_learn').execute({
      kind: 'procedure',
      title: '输入法兼容模式需要重启进程',
      action: '重启输入法进程后再验证',
      when: '用户报告输入法打不出中文时',
    })
    assert.equal(result.ok, true)
    assert.equal(result.state, 'candidate')
    assert.deepEqual(result.evidence, [])
    assert.equal(result.independentSupportCount, 0)
    assert.equal(result.created, true)
    assert.match(result.dedup.fingerprint, /^[0-9a-f]{16}$/)
    assert.match(result.notes.join('\n'), /无证据/)
    const stored = storeOf(env).getLesson(result.lessonId)
    assert.equal(stored.state, 'candidate')
    assert.equal(stored.review.decision, 'unreviewed')
  } finally { env.cleanup() }
})

test('dream_learn：read 计入独立支持，claimed 只留证据', async () => {
  const env = makeEnv()
  try {
    const result = await toolOf(env, 'dream_learn').execute({
      kind: 'pitfall',
      title: 'Nodemailer 池化发送取消后连接仍在投递',
      action: '验证当前连接实际关闭并确认服务器不再收正文',
      when: '在 Nodemailer ^9 中处理 AbortSignal 取消时',
      projectId: 'proj-a',
      applicability: [{ package: 'nodemailer', versions: '^9.0.0' }],
      evidence: [
        EVIDENCE_READ,
        { kind: 'session', sessionId: 'sess-2', recordSeq: 3, summary: '模型声称另一个版本也如此', verification: 'claimed' },
      ],
    })
    assert.equal(result.state, 'candidate')
    assert.equal(result.independentSupportCount, 1)
    assert.deepEqual(result.evidence.map((item) => item.verification).sort(), ['claimed', 'read'])
    const stored = storeOf(env).getLesson(result.lessonId)
    assert.equal(stored.evidenceIds.length, 2)
    assert.equal(stored.independentSupportCount, 1)
    assert.match(result.notes.join('\n'), /仅声明/)
  } finally { env.cleanup() }
})

test('dream_learn：同参重放幂等，同证据不重复落盘', async () => {
  const env = makeEnv()
  try {
    const learn = toolOf(env, 'dream_learn')
    const args = {
      kind: 'procedure',
      title: 'SQLite 读写并发时开启 WAL',
      action: '连接后执行 PRAGMA journal_mode=WAL',
      when: '同一 SQLite 库存在读写并发时',
      projectId: 'proj-a',
      evidence: [EVIDENCE_READ],
    }
    const first = await learn.execute(args)
    const second = await learn.execute(args)
    assert.equal(first.created, true)
    assert.equal(second.created, false)
    assert.equal(second.lessonId, first.lessonId)
    assert.equal(second.independentSupportCount, 1)
    assert.equal(second.dedup.merged, first.lessonId)
    const store = storeOf(env)
    assert.equal(store.listLessons().length, 1)
    assert.equal(store.listEvidence().filter((item) => item.sessionId === 'sess-1' && item.recordSeq === 7).length, 1)
  } finally { env.cleanup() }
})

test('dream_learn：maskSecrets 开启时证据摘要写入前脱敏', async () => {
  const env = makeEnv()
  try {
    const secret = 'sk-abcdefghijklmnopqrstuvwxyz0123456789'
    const result = await toolOf(env, 'dream_learn').execute({
      kind: 'fact',
      title: '脱敏经验',
      action: '验证脱敏',
      when: '写入证据时',
      evidence: [{ kind: 'local-artifact', summary: '日志里出现 ' + secret, verification: 'read' }],
    })
    const stored = storeOf(env).listEvidence().find((item) => item.id === result.evidence[0].id)
    assert.ok(stored.summary.includes('已脱敏'))
    assert.equal(stored.summary.includes(secret), false, '原始密钥不得落盘')
  } finally { env.cleanup() }
})

test('dream_context：只读，不建目录、不改文件', async () => {
  const fresh = makeEnv()
  try {
    const result = await toolOf(fresh, 'dream_context').execute({ query: 'SQLite' })
    assert.deepEqual(result.items, [])
    assert.deepEqual(result.skipped, [])
    assert.equal(result.scopeLabel, '全局')
    assert.deepEqual(result.budget, { limit: 5, maxChars: 3000, usedChars: 0 })
    assert.equal(existsSync(join(fresh.cfg.journalDir, 'knowledge')), false, '只读调用不得创建知识目录')
  } finally { fresh.cleanup() }

  const env = makeEnv()
  try {
    const learned = await toolOf(env, 'dream_learn').execute({
      kind: 'procedure',
      title: 'SQLite 读写并发时开启 WAL',
      action: '执行 PRAGMA journal_mode=WAL',
      when: '读写并发时',
      projectId: 'proj-a',
      evidence: [EVIDENCE_READ],
    })
    const before = snapshot(env.cfg.journalDir)
    const result = await toolOf(env, 'dream_context').execute({ query: 'SQLite', projectId: 'proj-a' })
    assert.deepEqual(result.items.map((item) => item.lessonId), [learned.lessonId])
    assert.match(result.items[0].whyRelevant, /命中关键词/)
    assert.ok(result.budget.usedChars > 0 && result.budget.usedChars <= result.budget.maxChars)
    assert.deepEqual(snapshot(env.cfg.journalDir), before, 'dream_context 必须零写入')
  } finally { env.cleanup() }
})

test('dream_context：未知项目与其他项目都不返回非 global 经验', async () => {
  const env = makeEnv()
  try {
    const learn = toolOf(env, 'dream_learn')
    const context = toolOf(env, 'dream_context')
    const project = await learn.execute({
      kind: 'procedure', title: 'SQLite A 项目经验', action: '执行 A 流程', when: 'A 项目读写并发时', projectId: 'proj-a', evidence: [EVIDENCE_READ],
    })
    const global = await learn.execute({
      kind: 'preference', title: 'SQLite 全局偏好', action: '先备份再迁移', when: '任何 SQLite 迁移前', global: true, evidence: [EVIDENCE_READ],
    })

    const unknown = await context.execute({ query: 'SQLite' })
    assert.deepEqual(unknown.items.map((item) => item.lessonId), [global.lessonId])

    const other = await context.execute({ query: 'SQLite', projectId: 'proj-b' })
    assert.deepEqual(other.items.map((item) => item.lessonId), [global.lessonId])
    assert.equal(other.items.some((item) => item.lessonId === project.lessonId), false)

    const own = await context.execute({ query: 'SQLite', projectId: 'proj-a' })
    assert.deepEqual([...own.items.map((item) => item.lessonId)].sort(), [global.lessonId, project.lessonId].sort())
  } finally { env.cleanup() }
})

test('dream_context：预算放不下时整条跳过，usedChars 不超上限', async () => {
  const env = makeEnv()
  try {
    const learned = await toolOf(env, 'dream_learn').execute({
      kind: 'procedure',
      title: 'Xylophone 长条件预算经验',
      action: '执行动作',
      when: '当 ' + 'x'.repeat(300) + ' 时',
      projectId: 'proj-a',
      evidence: [EVIDENCE_READ],
    })
    const result = await toolOf(env, 'dream_context').execute({ query: 'Xylophone', projectId: 'proj-a', maxChars: 10 })
    assert.deepEqual(result.items, [])
    assert.deepEqual(result.skipped, [{ lessonId: learned.lessonId, reason: 'budget' }])
    assert.deepEqual(result.budget, { limit: 5, maxChars: 10, usedChars: 0 })
  } finally { env.cleanup() }
})

test('dream_review：actor=user 被忽略并记为 model；accept 后 usable', async () => {
  const env = makeEnv()
  try {
    const learned = await toolOf(env, 'dream_learn').execute({
      kind: 'preference',
      title: '改动前先确认用户意图',
      action: '先复述需求并询问',
      when: '用户提出需求时',
      projectId: 'proj-a',
      evidence: [{ kind: 'user-correction', sessionId: 'sess-9', recordSeq: 1, summary: '用户明确纠正了推测', verification: 'read' }],
    })
    const store = storeOf(env)
    const current = store.getLesson(learned.lessonId)
    const reviewed = await toolOf(env, 'dream_review').execute({
      action: 'accept',
      lessonId: learned.lessonId,
      expectedRevision: current.revision,
      actor: 'user',
    })
    assert.equal(reviewed.ok, true)
    assert.equal(reviewed.previousState, 'candidate')
    assert.equal(reviewed.state, 'usable')
    assert.equal(reviewed.revision, current.revision + 1)
    assert.equal(reviewed.lesson.review.decision, 'accepted')
    assert.equal(reviewed.lesson.review.actor, 'model')
    assert.notEqual(reviewed.lesson.review.actor, 'user')
    assert.equal(store.getLesson(learned.lessonId).review.actor, 'model')
  } finally { env.cleanup() }
})

test('dream_review：revision 不符抛 revision 且零写入', async () => {
  const env = makeEnv()
  try {
    const learned = await toolOf(env, 'dream_learn').execute({
      kind: 'procedure', title: 'Revision 守卫经验', action: '执行', when: '任何条件', projectId: 'proj-a',
    })
    const store = storeOf(env)
    const current = store.getLesson(learned.lessonId)
    const before = snapshot(env.cfg.journalDir)
    await assert.rejects(
      () => toolOf(env, 'dream_review').execute({
        action: 'accept',
        lessonId: learned.lessonId,
        expectedRevision: current.revision + 5,
        actor: 'user',
      }),
      (error) => {
        assert.equal(error.code, 'revision')
        assert.match(error.message, /revision/)
        return true
      },
    )
    assert.deepEqual(snapshot(env.cfg.journalDir), before, 'revision 不符不得写入任何文件')
    const after = store.getLesson(learned.lessonId)
    assert.equal(after.state, 'candidate')
    assert.equal(after.revision, current.revision)
    assert.equal(after.review.actor, undefined)
  } finally { env.cleanup() }
})

test('dream_review：mark-stale 后 dream_context 排除并给 skipped 原因', async () => {
  const env = makeEnv()
  try {
    const learned = await toolOf(env, 'dream_learn').execute({
      kind: 'procedure', title: 'Xylophone 待复核经验', action: '执行动作', when: '版本更新时', projectId: 'proj-a',
      evidence: [EVIDENCE_READ],
    })
    const review = toolOf(env, 'dream_review')
    const accepted = await review.execute({ action: 'accept', lessonId: learned.lessonId, expectedRevision: 1 })
    const staled = await review.execute({ action: 'mark-stale', lessonId: learned.lessonId, expectedRevision: accepted.revision })
    assert.equal(staled.previousState, 'usable')
    assert.equal(staled.state, 'stale')

    const context = await toolOf(env, 'dream_context').execute({ query: 'Xylophone', projectId: 'proj-a' })
    assert.deepEqual(context.items, [])
    assert.deepEqual(context.skipped, [{ lessonId: learned.lessonId, reason: 'state:stale' }])
  } finally { env.cleanup() }
})

test('dream_review：attach-evidence 追加独立支持且不自动采纳', async () => {
  const env = makeEnv()
  try {
    const learned = await toolOf(env, 'dream_learn').execute({
      kind: 'pitfall', title: 'Xylophone 追加证据经验', action: '执行动作', when: '任何条件', projectId: 'proj-a',
      evidence: [EVIDENCE_READ],
    })
    const attached = await toolOf(env, 'dream_review').execute({
      action: 'attach-evidence',
      lessonId: learned.lessonId,
      expectedRevision: 1,
      evidence: [{ kind: 'session', sessionId: 'sess-extra', recordSeq: 1, summary: '第二次独立复现', verification: 'read' }],
    })
    assert.equal(attached.state, 'candidate', 'attach-evidence 不得自动采纳')
    assert.equal(attached.revision, 2)
    assert.equal(attached.lesson.independentSupportCount, 2)
    assert.equal(attached.lesson.evidenceIds.length, 2)
  } finally { env.cleanup() }
})

test('dream_review：resolve-conflict 解除冲突并回到 usable', async () => {
  const env = makeEnv()
  try {
    const learned = await toolOf(env, 'dream_learn').execute({
      kind: 'procedure', title: 'Xylophone 冲突经验', action: '执行动作', when: '冲突场景', projectId: 'proj-a', evidence: [EVIDENCE_READ],
    })
    const review = toolOf(env, 'dream_review')
    const accepted = await review.execute({ action: 'accept', lessonId: learned.lessonId, expectedRevision: 1 })
    const disputed = await review.execute({
      action: 'mark-disputed',
      lessonId: learned.lessonId,
      expectedRevision: accepted.revision,
      conflictWith: ['lsn_rival'],
    })
    assert.equal(disputed.state, 'disputed')
    assert.deepEqual(disputed.lesson.conflictIds, ['lsn_rival'], 'mark-disputed 记录冲突对象')
    const resolved = await review.execute({
      action: 'resolve-conflict',
      lessonId: learned.lessonId,
      expectedRevision: disputed.revision,
      conflictWith: ['lsn_rival'],
    })
    assert.equal(resolved.previousState, 'disputed')
    assert.equal(resolved.state, 'usable')
    assert.deepEqual(resolved.lesson.conflictIds, [], 'resolve-conflict 原子解除冲突')
    assert.equal(resolved.revision, disputed.revision + 1, '单次写入完成状态与冲突列表更新')
  } finally { env.cleanup() }
})

test('compileParameters 负例：对象数组不是字符串数组，enum 不被丢弃', () => {
  const env = makeEnv()
  try {
    for (const name of ['dream_learn', 'dream_review']) {
      const tool = toolOf(env, name)
      const evidence = tool.parameters.properties.evidence
      assert.equal(evidence.items.type, 'object')
      assert.notEqual(evidence.items.type, 'string')
      assert.equal(typeof evidence.items.properties.kind.enum, 'object')
      assert.equal(evidence.items.properties.kind.type, 'string')
      assert.equal(evidence.items.additionalProperties, true)
    }
  } finally { env.cleanup() }
})
