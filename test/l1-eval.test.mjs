/**
 * L1 七场景断言版（FREEZE v1.1 验收线 + R2′）。
 *
 * 与探测版（.skill-audit/dream-m1/l1-eval.mjs）的区别：本文件是断言版，
 * 每个场景写明 expectVisible / expectHidden / expectSkippedReasons，
 * 并断言 rankInversionCount === 0 与 budget.usedChars <= maxChars。
 *
 * 验收线（FREEZE v1.1 末尾）：
 *   S1 命中；S5 命中用户纠正且排除 claimed 推测；S2/S3/S4/S6/S7 零注入；
 *   rankInversionCount === 0；budget.usedChars <= maxChars。
 * R2′（lead 裁定）：read 证据 → 初始 usable（user-correction 记 actor=user/accepted，
 * 其余 read 记 unreviewed）；claimed/无证据 → candidate，受 R1 扣留。
 *
 * 只读发布物 lib/；每个场景一个临时 journalDir，用例结束即清理。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { KnowledgeStore } from '../lib/knowledge-store.js'
import { retrieveLessons, retrievedLessonChars } from '../lib/retrieval.js'

/** 场景定义：expectVisible/expectHidden 用的是 lesson.key。 */
const SCENARIOS = [
  {
    id: 'S1',
    title: '同项目 + read 证据：必须命中',
    lessons: [
      { key: 'smtp', title: '池化 SMTP 取消后仍投递', when: 'Nodemailer 9.x 池化发送 + AbortSignal', action: '先 close() 再断言未发出', projectId: 'proj-mail', evidence: [{ kind: 'session', verification: 'read', summary: '复现确认：取消后连接仍在投递' }] },
    ],
    query: { query: 'SMTP 取消 发送', projectId: 'proj-mail' },
    expectVisible: ['smtp'],
    expectHidden: [],
  },
  {
    id: 'S2',
    title: '无关主题：零注入',
    lessons: [{ key: 'ppt', title: 'PPT 用思源黑体', when: '做中文演示', projectId: 'proj-ppt', evidence: [{ kind: 'session', verification: 'read' }] }],
    query: { query: 'SQL 只读 拒绝', projectId: 'proj-sql' },
    expectVisible: [],
    expectHidden: ['ppt'],
    expectEmpty: true,
  },
  {
    id: 'S3',
    title: '跨项目同名任务：零注入',
    lessons: [{ key: 'pnpm', title: 'A 项目用 pnpm 安装依赖', when: '安装依赖', projectId: 'proj-a', evidence: [{ kind: 'session', verification: 'read' }] }],
    query: { query: '安装依赖 pnpm', projectId: 'proj-b' },
    expectVisible: [],
    expectHidden: ['pnpm'],
    expectEmpty: true,
  },
  {
    id: 'S4',
    title: '版本失效：1.x 经验不得用于 2.0',
    lessons: [{ key: 'ver', title: 'X 1.x 需要手动 close()', when: '使用 X', projectId: 'proj-x', applicability: [{ package: 'x', versions: '1.x' }], evidence: [{ kind: 'session', verification: 'read' }] }],
    query: { query: 'X close 手动', projectId: 'proj-x', packageVersion: '2.0' },
    expectVisible: [],
    expectHidden: ['ver'],
    expectEmpty: true,
    expectSkippedReasons: { ver: 'version-mismatch' },
  },
  {
    id: 'S5',
    title: '用户纠正优先于模型推测',
    lessons: [
      { key: 'guess', title: '推测：Outlook 默认端口 465', when: '配置 Outlook', projectId: 'proj-mail', evidence: [{ kind: 'session', verification: 'claimed', summary: '模型声称 465' }] },
      { key: 'user', title: '用户要求：Outlook 用 587 且 STARTTLS', when: '配置 Outlook', projectId: 'proj-mail', evidence: [{ kind: 'user-correction', verification: 'read', summary: '用户纠正：587 + STARTTLS' }] },
    ],
    query: { query: 'Outlook 端口 发信', projectId: 'proj-mail' },
    expectVisible: ['user'],
    expectHidden: ['guess'],
    expectSkippedReasons: { guess: 'no-evidence' },
  },
  {
    id: 'S6',
    title: '冲突未解决：零注入',
    lessons: [
      { key: 'retry', title: '始终重试发送', when: '发送失败', projectId: 'proj-mail', state: 'disputed', evidence: [{ kind: 'session', verification: 'read' }] },
      { key: 'noretry', title: '结果不明时不要重试', when: '发送失败', projectId: 'proj-mail', state: 'disputed', evidence: [{ kind: 'session', verification: 'read' }] },
    ],
    query: { query: '发送 超时 重试', projectId: 'proj-mail' },
    expectVisible: [],
    expectHidden: ['retry', 'noretry'],
    expectEmpty: true,
    expectSkippedReasons: { retry: 'state:disputed', noretry: 'state:disputed' },
  },
  {
    id: 'S7',
    title: '证据不足候选：零注入',
    lessons: [{ key: 'claim', title: '据说 Y 会崩溃', when: '使用 Y', projectId: 'proj-y', evidence: [{ kind: 'session', verification: 'claimed', summary: '仅模型声称' }] }],
    query: { query: 'Y 崩溃', projectId: 'proj-y' },
    expectVisible: [],
    expectHidden: ['claim'],
    expectEmpty: true,
    expectSkippedReasons: { claim: 'no-evidence' },
  },
  {
    id: 'B1',
    title: 'R4 预算前缀专项：第一条放不下即停，不得跳去装更小条目',
    lessons: [
      { key: 'big', title: 'B1 命中 大条目', when: '预算测试', action: 'b'.repeat(4000), projectId: 'proj-b1', evidence: [{ kind: 'session', verification: 'read' }] },
      { key: 'small', title: '命中 小条目', when: '预算测试', action: 'b', projectId: 'proj-b1', evidence: [{ kind: 'session', verification: 'read' }] },
    ],
    query: { query: 'B1 命中', projectId: 'proj-b1' },
    budget: { maxChars: 1000, limit: 20 },
    expectVisible: [],
    expectHidden: ['big', 'small'],
    expectEmpty: true,
    expectSkippedReasons: { big: 'budget-stop' },
  },
]

function queryOf(query) {
  const args = { query: query.query }
  if (query.projectId !== undefined) args.projectId = query.projectId
  if (query.workspaceRoot !== undefined) args.workspaceRoot = query.workspaceRoot
  if (query.packageVersion !== undefined) args.packageVersion = query.packageVersion
  return args
}

function buildStore(dir, prefix, lessons) {
  const store = new KnowledgeStore(join(dir, 'knowledge'))
  const ids = new Map()
  for (const spec of lessons) {
    const evidence = (spec.evidence ?? []).map((item, index) => ({
      kind: item.kind ?? 'session',
      sessionId: spec.key + '-sess-' + index,
      recordSeq: index,
      summary: item.summary ?? 'ev' + index,
      verification: item.verification ?? 'read',
    }))
    const created = store.createLesson({
      kind: spec.kind ?? 'procedure',
      title: spec.title,
      action: spec.action ?? 'a',
      when: spec.when ?? 'w',
      exceptions: spec.exceptions ?? [],
      projectId: spec.projectId,
      workspaceRoot: spec.workspaceRoot,
      global: spec.global === true,
      applicability: spec.applicability ?? [],
      evidence,
    }, prefix + '-k-' + spec.key)
    ids.set(spec.key, created.lesson.id)
    if (typeof spec.state === 'string' && spec.state !== '' && spec.state !== created.lesson.state) {
      store.applyTransition(created.lesson.id, spec.state, created.lesson.revision, prefix + '-t-' + spec.key)
    }
  }
  return { store, ids }
}

/** R4 指标：被 budget-stop 跳过、且排在某个已返回条目之前的条目数；0 = 返回集是排名前缀。 */
export function rankInversionCount(fullIds, realIds) {
  const position = new Map(fullIds.map((id, index) => [id, index]))
  let maxSeen = -1
  let inversions = 0
  for (const id of realIds) {
    const at = position.has(id) ? position.get(id) : -1
    if (at < 0) { inversions += 1; continue }
    if (at < maxSeen) inversions += 1
    if (at > maxSeen) maxSeen = at
  }
  const prefix = fullIds.slice(0, realIds.length)
  const prefixOk = prefix.length === realIds.length && prefix.every((id, index) => id === realIds[index])
  return prefixOk ? 0 : inversions + 1
}

async function runScenario(def) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-l1-'))
  try {
    const { store, ids } = buildStore(dir, 'l1-' + def.id.toLowerCase(), def.lessons)
    const tools = buildDreamTools(resolveConfig({ sessionsRoot: join(dir, 'sessions'), journalDir: dir }))
    const context = tools.find((tool) => tool.name === 'dream_context')
    const result = await context.execute(queryOf(def.query))

    const visible = new Set(result.items.map((item) => item.lessonId))
    for (const key of def.expectVisible) assert.ok(visible.has(ids.get(key)), def.id + ' 应命中 ' + key + '，实际 items=' + JSON.stringify(result.items.map((item) => item.title)))
    for (const key of def.expectHidden) assert.equal(visible.has(ids.get(key)), false, def.id + ' 不得注入 ' + key)
    if (def.expectEmpty === true) assert.equal(result.items.length, 0, def.id + ' 应零注入，实际 ' + result.items.length + ' 条')
    for (const [key, reason] of Object.entries(def.expectSkippedReasons ?? {})) {
      assert.ok(result.skipped.some((entry) => entry.lessonId === ids.get(key) && entry.reason === reason), def.id + ' 的 ' + key + ' 应以 ' + reason + ' 跳过，实际 skipped=' + JSON.stringify(result.skipped))
    }

    const maxChars = (def.budget ?? {}).maxChars ?? 3000
    assert.ok(result.budget.usedChars <= result.budget.maxChars, def.id + ' 预算超限')
    assert.ok(result.budget.usedChars <= maxChars)

    const lessons = store.listLessons()
    const allEvidence = store.listEvidence()
    const base = { ...queryOf(def.query), limit: 20, maxChars: 20000 }
    const full = retrieveLessons(lessons, allEvidence, base)
    const real = retrieveLessons(lessons, allEvidence, { ...queryOf(def.query), ...(def.budget ?? {}) })
    const inversions = rankInversionCount(full.items.map((item) => item.lessonId), real.items.map((item) => item.lessonId))
    assert.equal(inversions, 0, def.id + ' rankInversionCount=' + inversions + '（返回集必须是全量排名的前缀）')
    const realUsed = real.items.reduce((sum, item) => sum + retrievedLessonChars(item), 0)
    assert.ok(realUsed <= ((def.budget ?? {}).maxChars ?? 3000), def.id + ' retrieveLessons 预算超限 ' + realUsed)
    return result
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

for (const def of SCENARIOS) {
  test('L1 · ' + def.id + '：' + def.title, async () => {
    await runScenario(def)
  })
}

test('R4 · rankInversionCount 工具本身：能识别前缀违例', () => {
  assert.equal(rankInversionCount(['a', 'b', 'c'], ['a', 'b']), 0)
  assert.equal(rankInversionCount(['a', 'b', 'c'], ['a', 'c']), 1)
  assert.notEqual(rankInversionCount(['a', 'b', 'c'], ['b']), 0)
})
