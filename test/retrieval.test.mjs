import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_RETRIEVAL_LIMIT,
  MAX_RETRIEVAL_MAX_CHARS,
  resolveRetrievalBudget,
  retrieveLessons,
  retrievedLessonChars,
} from '../lib/retrieval.js'

function makeLesson(overrides = {}) {
  const now = '2026-09-29T12:00:00.000Z'
  return {
    schemaVersion: 1,
    id: 'lsn_default',
    revision: 1,
    kind: 'procedure',
    title: '默认经验',
    action: '执行默认动作',
    when: '任何时候',
    exceptions: [],
    scope: { global: true },
    applicability: [],
    state: 'usable',
    evidenceIds: [],
    independentSupportCount: 0,
    review: { decision: 'unreviewed' },
    createdAt: now,
    updatedAt: now,
    conflictIds: [],
    ...overrides,
  }
}

function makeEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    id: 'evd_default',
    kind: 'session',
    observedAt: '2026-09-29T12:00:00.000Z',
    summary: '默认证据',
    verification: 'read',
    ...overrides,
  }
}

test('范围过滤：未知项目只返回 global，绝不跨项目泄漏', () => {
  const lessons = [
    makeLesson({ id: 'lsn_global', title: 'Nodemailer 全局取消投递', when: '取消发送时' }),
    makeLesson({ id: 'lsn_proj_a', title: 'Nodemailer A 项目经验', when: 'A 项目取消发送时', scope: { projectId: 'proj-a', global: false } }),
    makeLesson({ id: 'lsn_proj_b', title: 'Nodemailer B 项目经验', when: 'B 项目取消发送时', scope: { projectId: 'proj-b', global: false } }),
  ]

  const unknown = retrieveLessons(lessons, [], { query: 'nodemailer' })
  assert.deepEqual(unknown.items.map((item) => item.lessonId), ['lsn_global'])
  assert.equal(unknown.skipped.some((entry) => entry.lessonId === 'lsn_proj_a' || entry.lessonId === 'lsn_proj_b'), false, 'skipped 不得泄漏他项目 ID')

  const projectA = retrieveLessons(lessons, [], { query: 'nodemailer', projectId: 'proj-a' })
  assert.deepEqual(projectA.items.map((item) => item.lessonId), ['lsn_global', 'lsn_proj_a'])
  assert.equal(projectA.items.some((item) => item.lessonId === 'lsn_proj_b'), false)

  const projectC = retrieveLessons(lessons, [], { query: 'nodemailer', projectId: 'proj-c' })
  assert.deepEqual(projectC.items.map((item) => item.lessonId), ['lsn_global'])
})

test('范围过滤：workspaceRoot 精确匹配（容忍 Windows 路径大小写与尾斜杠）', () => {
  const lesson = makeLesson({
    id: 'lsn_ws',
    title: 'Nodemailer 工作区经验',
    when: '工作区取消发送时',
    scope: { workspaceRoot: 'E:\\work\\proj-a', global: false },
  })
  const hit = retrieveLessons([lesson], [], { query: 'nodemailer', workspaceRoot: 'e:/work/proj-a/' })
  assert.deepEqual(hit.items.map((item) => item.lessonId), ['lsn_ws'])
  const miss = retrieveLessons([lesson], [], { query: 'nodemailer', workspaceRoot: 'E:\\work\\proj-b' })
  assert.equal(miss.items.length, 0)
  const unknown = retrieveLessons([lesson], [], { query: 'nodemailer' })
  assert.equal(unknown.items.length, 0, '未给项目/工作区时不得返回非 global 经验')
})

test('排除 rejected / stale / disputed 并给出 skipped 原因，candidate 保留', () => {
  const lessons = [
    makeLesson({ id: 'lsn_usable', title: 'Xylophone 可用', state: 'usable' }),
    makeLesson({ id: 'lsn_candidate', title: 'Xylophone 候选', state: 'candidate' }),
    makeLesson({ id: 'lsn_rejected', title: 'Xylophone 拒绝', state: 'rejected' }),
    makeLesson({ id: 'lsn_stale', title: 'Xylophone 过期', state: 'stale' }),
    makeLesson({ id: 'lsn_disputed', title: 'Xylophone 冲突', state: 'disputed' }),
  ]
  const result = retrieveLessons(lessons, [], { query: 'xylophone' })
  assert.deepEqual(result.items.map((item) => item.lessonId), ['lsn_usable', 'lsn_candidate'])
  assert.deepEqual(
    result.skipped.map((entry) => [entry.lessonId, entry.reason]).sort(),
    [
      ['lsn_disputed', 'state:disputed'],
      ['lsn_rejected', 'state:rejected'],
      ['lsn_stale', 'state:stale'],
    ].sort(),
  )
})

test('排序：关键词命中优先于仅适用条件命中', () => {
  const keyword = makeLesson({ id: 'lsn_kw', title: 'Xylophone 缓存清理', when: '涉及 xylophone 时', action: '清理缓存' })
  const applicabilityOnly = makeLesson({
    id: 'lsn_app',
    title: '缓存清理动作',
    when: '涉及缓存时',
    action: '清理缓存',
    applicability: [{ package: 'xylophone' }],
  })
  const result = retrieveLessons([applicabilityOnly, keyword], [], { query: 'xylophone' })
  assert.deepEqual(result.items.map((item) => item.lessonId), ['lsn_kw', 'lsn_app'])
  assert.match(result.items[1].whyRelevant, /适用包「xylophone」/)
})

test('排序：usable > candidate；lastValidatedAt 近者优先；id 稳定序', () => {
  const usable = makeLesson({ id: 'lsn_usable', title: 'Xylophone 甲', state: 'usable', lastValidatedAt: '2026-01-01T00:00:00.000Z' })
  const candidate = makeLesson({ id: 'lsn_candidate', title: 'Xylophone 乙', state: 'candidate', lastValidatedAt: '2026-09-29T00:00:00.000Z' })
  const stateSorted = retrieveLessons([candidate, usable], [], { query: 'xylophone' })
  assert.deepEqual(stateSorted.items.map((item) => item.lessonId), ['lsn_usable', 'lsn_candidate'])

  const older = makeLesson({ id: 'lsn_old', title: 'Xylophone 旧', lastValidatedAt: '2026-01-01T00:00:00.000Z' })
  const newer = makeLesson({ id: 'lsn_new', title: 'Xylophone 新', lastValidatedAt: '2026-09-01T00:00:00.000Z' })
  const timeSorted = retrieveLessons([older, newer], [], { query: 'xylophone' })
  assert.deepEqual(timeSorted.items.map((item) => item.lessonId), ['lsn_new', 'lsn_old'])

  const b = makeLesson({ id: 'lsn_b', title: 'Xylophone B' })
  const a = makeLesson({ id: 'lsn_a', title: 'Xylophone A' })
  const idSorted = retrieveLessons([b, a], [], { query: 'xylophone' })
  assert.deepEqual(idSorted.items.map((item) => item.lessonId), ['lsn_a', 'lsn_b'])
})

test('whyRelevant 具体化：命中关键词 / 适用包 / 版本条件 / 项目', () => {
  const lesson = makeLesson({
    id: 'lsn_why',
    title: 'Nodemailer 池化发送取消',
    action: '验证连接实际关闭',
    when: '在 Nodemailer 9 上取消投递时',
    scope: { projectId: 'proj-a', global: false },
    applicability: [{ package: 'nodemailer', versions: '^9.0.0' }],
  })
  const result = retrieveLessons([lesson], [], {
    query: 'nodemailer 发送 取消',
    projectId: 'proj-a',
    packageVersion: '9.0.5',
  })
  assert.equal(result.items.length, 1)
  const item = result.items[0]
  assert.match(item.whyRelevant, /命中关键词/)
  assert.match(item.whyRelevant, /适用包「nodemailer」/)
  assert.match(item.whyRelevant, /适用版本「\^9\.0\.0」（当前 9\.0\.5）/)
  assert.match(item.whyRelevant, /项目匹配（proj-a）/)
  assert.equal(item.scopeLabel, '项目 proj-a')
  assert.equal(item.truncated, false)
})

test('evidenceSummary 区分已读 / 仅声明并附脱敏摘要', () => {
  const lesson = makeLesson({
    id: 'lsn_ev',
    title: 'Xylophone 证据摘要',
    evidenceIds: ['evd_read', 'evd_claimed'],
    independentSupportCount: 1,
  })
  const evidence = [
    makeEvidence({ id: 'evd_read', summary: '复现确认取消后连接仍在投递', verification: 'read' }),
    makeEvidence({ id: 'evd_claimed', summary: '模型声称另一个版本也如此', verification: 'claimed' }),
  ]
  const result = retrieveLessons([lesson], evidence, { query: 'xylophone' })
  assert.match(result.items[0].evidenceSummary, /独立证据 1 条（已读 1 \/ 仅声明 1）/)
  assert.match(result.items[0].evidenceSummary, /复现确认取消后连接仍在投递/)
})

test('无相关返回空数组，不返回占位话', () => {
  const lessons = [makeLesson({ id: 'lsn_irrelevant', title: '输入法兼容模式', when: '输入法打不出中文时' })]
  const result = retrieveLessons(lessons, [], { query: '完全无关的量子纠缠主题' })
  assert.deepEqual(result.items, [])
  assert.deepEqual(result.skipped, [])
})

test('字符预算：条件与例外不可截断，放不下整条跳过（负例）', () => {
  const longWhen = '当运行 Xylophone ' + 'x'.repeat(200) + ' 且用户要求取消投递时'
  const longException = '例外：仅在内网 SMTP 上，且 ' + 'y'.repeat(120)
  const lesson = makeLesson({
    id: 'lsn_big',
    title: 'Xylophone 长条件经验',
    action: '检查连接并记录回执',
    when: longWhen,
    exceptions: [longException],
  })

  const full = retrieveLessons([lesson], [], { query: 'xylophone', maxChars: 20000 })
  assert.equal(full.items.length, 1)
  assert.equal(full.items[0].when, longWhen)
  assert.deepEqual(full.items[0].exceptions, [longException])
  const cost = retrievedLessonChars(full.items[0])

  const exact = retrieveLessons([lesson], [], { query: 'xylophone', maxChars: cost })
  assert.equal(exact.items.length, 1)
  assert.equal(exact.items[0].when, longWhen, '代价恰好等于预算时仍完整返回')
  assert.deepEqual(exact.items[0].exceptions, [longException])

  const tooSmall = retrieveLessons([lesson], [], { query: 'xylophone', maxChars: cost - 1 })
  assert.deepEqual(tooSmall.items, [], '放不下时必须整条跳过，绝不返回半条')
  assert.deepEqual(tooSmall.skipped, [{ lessonId: 'lsn_big', reason: 'budget' }])
})

test('预算与条数：默认 5 条 / 3000 字符，硬上限 20 / 20000', () => {
  assert.deepEqual(resolveRetrievalBudget({}), { limit: 5, maxChars: 3000 })
  assert.deepEqual(resolveRetrievalBudget({ limit: 999, maxChars: 999999 }), { limit: MAX_RETRIEVAL_LIMIT, maxChars: MAX_RETRIEVAL_MAX_CHARS })

  const many = []
  for (let i = 0; i < 30; i += 1) {
    many.push(makeLesson({ id: 'lsn_' + String(i).padStart(2, '0'), title: 'Xylophone 第 ' + i + ' 条' }))
  }
  const result = retrieveLessons(many, [], { query: 'xylophone' })
  assert.equal(result.items.length, 5)
  assert.equal(result.skipped.filter((entry) => entry.reason === 'limit').length, 25)
})

test('预算跳过一条后继续尝试后续更小条目', () => {
  const big = makeLesson({
    id: 'lsn_big_1',
    title: 'Xylophone 大条目',
    when: '当 ' + 'z'.repeat(400) + ' 时',
  })
  const small = makeLesson({ id: 'lsn_small_1', title: 'Xylophone 小条目', when: '短条件' })
  const fullSmall = retrieveLessons([small], [], { query: 'xylophone', maxChars: 20000 })
  const smallCost = retrievedLessonChars(fullSmall.items[0])
  const result = retrieveLessons([big, small], [], { query: 'xylophone', maxChars: smallCost })
  assert.deepEqual(result.items.map((item) => item.lessonId), ['lsn_small_1'])
  assert.deepEqual(result.skipped, [{ lessonId: 'lsn_big_1', reason: 'budget' }])
})
