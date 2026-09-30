/**
 * M1-A 知识存储层测试：正例 + FREEZE §1/§2 要求的负例。
 *
 * 覆盖：幂等键重复不新增事件；revision 不符抛 KnowledgeError('revision') 且不写；
 * 坏行跳过不炸；同 sessionId+recordSeq / sourceHash 证据不增加独立支持；
 * claimed 不计独立支持但进 evidenceIds；锁过期接管与不无条件删锁；
 * 重建索引不删除原文件；「应开启」与「不应开启」指纹不同。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  KnowledgeError,
  canTransition,
  evidenceDedupKey,
  lessonFingerprint,
  mergeEvidenceSupport,
  normalizeLessonText,
  validateEvidence,
  validateLesson,
} from '../lib/knowledge.js'
import { KnowledgeStore, MAX_REPLAY_EVENTS } from '../lib/knowledge-store.js'

const ISO = '2026-09-29T00:00:00.000Z'

const testDir = dirname(fileURLToPath(import.meta.url))

/** 兼容 process.env 为空的沙箱：优先系统临时目录，否则退回 test/.tmp-knowledge-store。 */
function tempBase() {
  const fromEnv = process.env.TEMP || process.env.TMP
  return fromEnv && fromEnv.trim() !== '' ? fromEnv : join(testDir, '.tmp-knowledge-store')
}

function freshRoot() {
  const base = tempBase()
  mkdirSync(base, { recursive: true })
  return mkdtempSync(join(base, 'dsh-dream-kstore-'))
}

function cleanup(dir) {
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // 测试清理失败不掩盖断言
  }
  const base = tempBase()
  if (base === join(testDir, '.tmp-knowledge-store')) {
    try {
      rmSync(base, { recursive: true, force: true })
    } catch {
      // 兜底目录清理失败不影响断言
    }
  }
}

function eventsLines(dir) {
  const file = join(dir, 'events.jsonl')
  if (!existsSync(file)) return 0
  return readFileSync(file, 'utf8').split('\n').filter((line) => line.trim() !== '').length
}

function evidenceLines(dir) {
  const file = join(dir, 'evidence.jsonl')
  if (!existsSync(file)) return 0
  return readFileSync(file, 'utf8').split('\n').filter((line) => line.trim() !== '').length
}

function evidenceInput(over = {}) {
  return {
    kind: 'session',
    sessionId: 'sess-1',
    recordSeq: 1,
    observedAt: ISO,
    summary: '取消后连接仍保持，需等连接真正关闭',
    verification: 'read',
    ...over,
  }
}

function lessonInput(over = {}) {
  return {
    kind: 'pitfall',
    title: '取消投递不保证连接关闭',
    action: '等待连接真正关闭再确认取消',
    when: '处理 AbortSignal 时',
    exceptions: ['已交付正文时不算未发出'],
    global: true,
    evidence: [evidenceInput()],
    ...over,
  }
}

function isCode(code) {
  return (error) => error instanceof KnowledgeError && error.code === code
}

// ---------- 纯函数 ----------

test('normalizeLessonText：NFC + 折叠空白 + trim', () => {
  assert.equal(normalizeLessonText('  这是   一条\t结论\n '), '这是 一条 结论')
  assert.equal(normalizeLessonText('e\u0301'), 'é')
  assert.equal(normalizeLessonText(''), '')
})

test('lessonFingerprint：否定词/数值/路径/版本参与，大小写与空白归一', () => {
  const base = { kind: 'preference', scope: { global: true } }
  const on = lessonFingerprint({ ...base, title: '应开启兼容模式', action: '开启兼容模式', when: 'Windows 上' })
  const off = lessonFingerprint({ ...base, title: '不应开启兼容模式', action: '不应开启兼容模式', when: 'Windows 上' })
  assert.notEqual(on, off, '应开启 / 不应开启 指纹必须不同')
  assert.notEqual(
    lessonFingerprint({ ...base, title: 'x', action: '开启兼容模式', when: 'w' }),
    lessonFingerprint({ ...base, title: 'x', action: '不应开启兼容模式', when: 'w' }),
  )
  assert.notEqual(
    lessonFingerprint({ ...base, title: 'x', action: 'a', when: 'Node 20' }),
    lessonFingerprint({ ...base, title: 'x', action: 'a', when: 'Node 22' }),
  )
  assert.notEqual(
    lessonFingerprint({ ...base, title: 'x', action: 'a', when: 'C:\\proj\\a' }),
    lessonFingerprint({ ...base, title: 'x', action: 'a', when: 'C:\\proj\\b' }),
  )
  assert.equal(on.length, 16)
  assert.equal(
    lessonFingerprint({ ...base, title: 'A   B', action: 'X  Y', when: ' Z ' }),
    lessonFingerprint({ ...base, title: 'a b', action: 'x y', when: 'z' }),
  )
  assert.equal(
    lessonFingerprint({ ...base, title: 'e\u0301', action: 'a', when: 'w' }),
    lessonFingerprint({ ...base, title: 'é', action: 'a', when: 'w' }),
  )
})

test('validateLesson / validateEvidence：坏数据抛 KnowledgeError(invalid)', () => {
  const lesson = {
    schemaVersion: 1,
    id: 'lsn_x',
    revision: 1,
    kind: 'fact',
    title: '结论',
    action: '动作',
    when: '条件',
    exceptions: [],
    scope: { global: true },
    applicability: [],
    state: 'candidate',
    evidenceIds: [],
    independentSupportCount: 0,
    review: { decision: 'unreviewed' },
    createdAt: ISO,
    updatedAt: ISO,
    conflictIds: [],
  }
  assert.equal(validateLesson(lesson).id, 'lsn_x')
  assert.throws(() => validateLesson({ ...lesson, title: '   ' }), isCode('invalid'))
  assert.throws(() => validateLesson({ ...lesson, state: 'bogus' }), isCode('invalid'))
  assert.throws(() => validateLesson({ ...lesson, revision: 0 }), isCode('invalid'))
  assert.throws(() => validateLesson({ ...lesson, scope: { global: 'yes' } }), isCode('invalid'))
  assert.throws(() => validateLesson(null), isCode('invalid'))

  const evidence = { schemaVersion: 1, id: 'evd_x', kind: 'session', observedAt: ISO, summary: '一句话', verification: 'read' }
  assert.equal(validateEvidence(evidence).id, 'evd_x')
  assert.throws(() => validateEvidence({ ...evidence, verification: 'trust-me' }), isCode('invalid'))
  assert.throws(() => validateEvidence({ ...evidence, recordSeq: {} }), isCode('invalid'))
  assert.throws(() => validateEvidence({ ...evidence, observedAt: 'not-a-date' }), isCode('invalid'))
})

test('canTransition：关键迁移路径', () => {
  assert.equal(canTransition('candidate', 'usable'), true)
  assert.equal(canTransition('candidate', 'rejected'), true)
  assert.equal(canTransition('usable', 'disputed'), true)
  assert.equal(canTransition('disputed', 'usable'), true)
  assert.equal(canTransition('stale', 'usable'), true)
  assert.equal(canTransition('rejected', 'candidate'), true)
  assert.equal(canTransition('rejected', 'usable'), false)
  assert.equal(canTransition('usable', 'candidate'), false)
  assert.equal(canTransition('usable', 'usable'), false)
})

test('mergeEvidenceSupport：同 sessionId+recordSeq / sourceHash 去重，claimed 不计', () => {
  const make = (id, over = {}) => ({ schemaVersion: 1, id, kind: 'session', observedAt: ISO, summary: '观察', verification: 'read', ...over })
  const count = mergeEvidenceSupport({ evidenceIds: ['e1', 'e2', 'e3', 'e4', 'e5'] }, [
    make('e1', { sessionId: 's', recordSeq: 1 }),
    make('e2', { sessionId: 's', recordSeq: 1 }),
    make('e3', { sourceHash: 'h1' }),
    make('e4', { sourceHash: 'h1' }),
    make('e5', { sessionId: 'other', recordSeq: 2 }),
  ])
  assert.equal(count, 3)
  assert.equal(
    mergeEvidenceSupport({ evidenceIds: ['c1'] }, [make('c1', { sessionId: 's', recordSeq: 9, verification: 'claimed' })]),
    0,
  )
  assert.equal(
    mergeEvidenceSupport({ evidenceIds: ['c2'] }, [make('c2', { sessionId: 's', recordSeq: 9, verification: 'read' })]),
    1,
  )
  assert.equal(evidenceDedupKey(make('e9', { sessionId: 's', recordSeq: 3 })), 'session:s#3')
  assert.equal(evidenceDedupKey(make('e9', { sourceHash: 'abc' })), 'hash:abc')
})

// ---------- 存储 ----------

test('存储：无文件只读安全，首次写入自建目录与文件', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    assert.deepEqual(store.listLessons(), [])
    assert.deepEqual(store.listEvidence(), [])
    assert.equal(store.getLesson('missing'), undefined)
    const before = store.stats()
    assert.equal(before.lessons, 0)
    assert.equal(before.evidence, 0)
    assert.equal(before.events, 0)
    assert.equal(before.truncated, false)
    assert.equal(existsSync(dir), false, '只读方法不得建目录')

    const created = store.createLesson(lessonInput({ evidence: [] }), 'k-first')
    assert.equal(created.created, true)
    assert.equal(created.lesson.state, 'candidate')
    assert.equal(created.lesson.independentSupportCount, 0)
    assert.ok(existsSync(join(dir, 'events.jsonl')))
    assert.equal(eventsLines(dir), 1)
  } finally {
    cleanup(root)
  }
})

test('存储：创建 / 列举 / 取回 / 统计', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const created = store.createLesson(lessonInput(), 'k-create-1')
    assert.equal(created.created, true)
    assert.equal(created.lesson.revision, 1)
    assert.equal(created.lesson.scope.global, true)
    assert.equal(created.lesson.evidenceIds.length, 1)
    assert.equal(created.lesson.independentSupportCount, 1)
    assert.equal(created.lesson.review.decision, 'unreviewed')

    assert.equal(store.listLessons().length, 1)
    assert.equal(store.getLesson(created.lesson.id).title, created.lesson.title)
    const all = store.listEvidence()
    assert.equal(all.length, 1)
    assert.equal(all[0].id, created.lesson.evidenceIds[0])
    const stats = store.stats()
    assert.equal(created.lesson.state, 'usable', 'R2′：read 证据初始即 usable')
    assert.deepEqual(stats.byState, { candidate: 0, usable: 1, disputed: 0, stale: 0, rejected: 0 })
    assert.equal(stats.badLines, 0)
    assert.equal(stats.truncated, false)
  } finally {
    cleanup(root)
  }
})

test('负例：同 idempotencyKey 重复调用不新增事件', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const first = store.createLesson(lessonInput(), 'k-same')
    const before = eventsLines(dir)
    const second = store.createLesson(lessonInput(), 'k-same')
    assert.equal(second.created, false)
    assert.equal(second.lesson.id, first.lesson.id)
    assert.equal(eventsLines(dir), before, '幂等重放不得写新事件')
  } finally {
    cleanup(root)
  }
})

test('负例：同指纹候选确定性合并，同一证据只算一次独立支持', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const first = store.createLesson(lessonInput({ evidence: [evidenceInput({ sessionId: 's1', recordSeq: 1 })] }), 'k-fp-1')
    const second = store.createLesson(lessonInput({ evidence: [evidenceInput({ sessionId: 's2', recordSeq: 2 })] }), 'k-fp-2')
    assert.equal(second.created, false)
    assert.equal(second.lesson.id, first.lesson.id)
    assert.equal(second.lesson.independentSupportCount, 2)
    assert.equal(store.listLessons().length, 1)

    const third = store.createLesson(lessonInput({ evidence: [evidenceInput({ sessionId: 's2', recordSeq: 2 })] }), 'k-fp-3')
    assert.equal(third.lesson.independentSupportCount, 2, '复述同一证据不增加独立支持')
    assert.equal(store.listEvidence().length, 2)
  } finally {
    cleanup(root)
  }
})

test('负例：revision 不符抛 KnowledgeError(revision) 且不写盘', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const created = store.createLesson(lessonInput(), 'k-rev-0')
    const id = created.lesson.id
    const before = eventsLines(dir)
    assert.throws(() => store.updateLesson(id, { title: '越权更新' }, 99, 'k-rev-1'), isCode('revision'))
    assert.throws(() => store.reviewLesson(id, 'accepted', 99, 'k-rev-2'), isCode('revision'))
    assert.throws(() => store.applyTransition(id, 'usable', 99, 'k-rev-3'), isCode('revision'))
    assert.equal(eventsLines(dir), before, 'revision 不符不得写事件')
    assert.equal(store.getLesson(id).title, created.lesson.title)
    assert.equal(store.getLesson(id).revision, 1)
    // 正确 revision 才能写
    const updated = store.updateLesson(id, { title: '合法更新' }, 1, 'k-rev-4')
    assert.equal(updated.revision, 2)
    assert.equal(updated.title, '合法更新')
  } finally {
    cleanup(root)
  }
})

test('负例：坏行跳过不炸并计数', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    store.createLesson(lessonInput(), 'k-bad-0')
    writeFileSync(
      join(dir, 'events.jsonl'),
      '这不是 JSON\n{"schemaVersion":1,"kind":"lesson.update"}\n[]\n',
      { flag: 'a' },
    )
    assert.equal(store.listLessons().length, 1, '坏行不得让整体读取失败')
    const stats = store.stats()
    assert.ok(stats.badLines >= 3, '坏行必须计数，实际 badLines=' + stats.badLines)
    writeFileSync(join(dir, 'evidence.jsonl'), 'garbage line\n', { flag: 'a' })
    assert.equal(store.listEvidence().length, 1)
    assert.ok(store.stats().badLines >= 4)
  } finally {
    cleanup(root)
  }
})

test('负例：同 sessionId+recordSeq 或 sourceHash 的证据只写一次', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const first = store.appendEvidence(evidenceInput({ sessionId: 'dup-s', recordSeq: 7 }))
    const second = store.appendEvidence(evidenceInput({ sessionId: 'dup-s', recordSeq: 7, summary: '复述' }))
    assert.equal(first.created, true)
    assert.equal(second.created, false)
    assert.equal(second.evidence.id, first.evidence.id)
    assert.equal(evidenceLines(dir), 1)
    assert.equal(eventsLines(dir), 1, '重复证据不得写新事件')

    const h1 = store.appendEvidence({ kind: 'local-artifact', sourceHash: 'hash-abc', observedAt: ISO, summary: '产物 A', verification: 'read' })
    const h2 = store.appendEvidence({ kind: 'local-artifact', sourceHash: 'hash-abc', observedAt: ISO, summary: '产物 B', verification: 'read' })
    assert.equal(h2.created, false)
    assert.equal(h2.evidence.id, h1.evidence.id)
    assert.equal(evidenceLines(dir), 2)
  } finally {
    cleanup(root)
  }
})

test('负例：claimed 证据进 evidenceIds 但不计独立支持', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const input = lessonInput({
      evidence: [
        { kind: 'session', sessionId: 'read-s', recordSeq: 1, observedAt: ISO, summary: '插件读到原记录', verification: 'read' },
        { kind: 'user-correction', sessionId: 'claim-s', recordSeq: 2, observedAt: ISO, summary: '仅模型声称', verification: 'claimed' },
      ],
    })
    const created = store.createLesson(input, 'k-claimed-1')
    assert.equal(created.lesson.evidenceIds.length, 2)
    assert.equal(created.lesson.independentSupportCount, 1)
    const again = store.createLesson(input, 'k-claimed-2')
    assert.equal(again.lesson.independentSupportCount, 1)
  } finally {
    cleanup(root)
  }
})

test('存储：审阅 / 状态流转 / 非法迁移不写 / evidenceIds 重算独立支持', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const created = store.createLesson(lessonInput(), 'k-flow-1')
    const id = created.lesson.id

    const reviewed = store.reviewLesson(id, 'accepted', 1, 'k-flow-2', 'user')
    assert.equal(reviewed.state, 'usable')
    assert.equal(reviewed.review.decision, 'accepted')
    assert.equal(reviewed.review.actor, 'user')
    assert.equal(reviewed.revision, 2)

    const disputed = store.applyTransition(id, 'disputed', 2, 'k-flow-3')
    assert.equal(disputed.state, 'disputed')
    const resolved = store.applyTransition(id, 'usable', 3, 'k-flow-4')
    assert.equal(resolved.state, 'usable')

    const before = eventsLines(dir)
    assert.throws(() => store.applyTransition(id, 'candidate', 4, 'k-flow-5'), isCode('invalid'))
    assert.equal(eventsLines(dir), before, '非法迁移不得写事件')
    assert.equal(store.getLesson(id).revision, 4)

    const replay = store.applyTransition(id, 'disputed', 4, 'k-flow-3')
    assert.equal(replay.state, 'disputed', '同幂等键返回首次结果')
    assert.equal(eventsLines(dir), before)

    const extra = store.appendEvidence({ kind: 'session', sessionId: 'extra', recordSeq: 9, observedAt: ISO, summary: '第二条独立证据', verification: 'read' })
    const withEvidence = store.updateLesson(id, { evidenceIds: [created.lesson.evidenceIds[0], extra.evidence.id] }, 4, 'k-flow-6')
    assert.equal(withEvidence.independentSupportCount, 2)
    assert.equal(withEvidence.revision, 5)

    const rejected = store.reviewLesson(id, 'rejected', 5, 'k-flow-7', 'user')
    assert.equal(rejected.state, 'rejected')
    assert.throws(() => store.reviewLesson(id, 'accepted', 6, 'k-flow-8', 'user'), isCode('invalid'))
  } finally {
    cleanup(root)
  }
})

test('负例：锁过期且 pid 不存活可接管；新鲜锁不得被无条件删除', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    mkdirSync(dir, { recursive: true })
    const store = new KnowledgeStore(dir, { lockTimeoutMs: 150 })
    const lockPath = join(dir, '.lock')

    // 新鲜锁（当前进程持有）→ 必须拒绝且不删
    writeFileSync(lockPath, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }))
    assert.throws(() => store.createLesson(lessonInput(), 'k-lock-busy'), isCode('io'))
    assert.ok(existsSync(lockPath), '新鲜锁不得被无条件删除')
    rmSync(lockPath)

    // 内容损坏且新鲜 → 不能验证所有者，同样不删
    writeFileSync(lockPath, 'not-json')
    assert.throws(() => store.createLesson(lessonInput(), 'k-lock-busy-2'), isCode('io'))
    assert.ok(existsSync(lockPath), '不可验证的新鲜锁不得被删除')
    rmSync(lockPath)

    // 超过 30s 且 pid 不存活 → 可接管
    writeFileSync(lockPath, JSON.stringify({ pid: 999999999, at: new Date(Date.now() - 60000).toISOString() }))
    const taken = store.createLesson(lessonInput(), 'k-lock-stale')
    assert.equal(taken.created, true)
    assert.ok(!existsSync(lockPath), '持有者完成后应释放自己的锁')
  } finally {
    cleanup(root)
  }
})

test('存储：rebuildIndex 不删除原文件，索引可重建', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const created = store.createLesson(lessonInput(), 'k-index-1')
    const eventsBefore = readFileSync(join(dir, 'events.jsonl'), 'utf8')
    const evidenceBefore = readFileSync(join(dir, 'evidence.jsonl'), 'utf8')

    store.rebuildIndex()
    assert.equal(readFileSync(join(dir, 'events.jsonl'), 'utf8'), eventsBefore, '重建索引不得改 events.jsonl')
    assert.equal(readFileSync(join(dir, 'evidence.jsonl'), 'utf8'), evidenceBefore, '重建索引不得改 evidence.jsonl')
    const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    assert.equal(Object.keys(index.lessons).length, 1)
    assert.equal(index.lessons[created.lesson.id].id, created.lesson.id)
    assert.equal(index.stateCounts.usable, 1, 'R2′：read 证据初始 usable')

    rmSync(join(dir, 'index.json'))
    store.rebuildIndex()
    assert.ok(existsSync(join(dir, 'index.json')))
    const rebuilt = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    assert.equal(rebuilt.lessons[created.lesson.id].revision, 1)
  } finally {
    cleanup(root)
  }
})

test('存储：空目录 rebuildIndex 可自建，不伪造 events/evidence', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    new KnowledgeStore(dir).rebuildIndex()
    assert.ok(existsSync(join(dir, 'index.json')))
    assert.ok(!existsSync(join(dir, 'events.jsonl')))
    assert.ok(!existsSync(join(dir, 'evidence.jsonl')))
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')).stateCounts, {
      candidate: 0, usable: 0, disputed: 0, stale: 0, rejected: 0,
    })
  } finally {
    cleanup(root)
  }
})

test('存储：写盘统一过 mask.ts（默认开启，可显式关闭）', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const secret = 'sk-abcdefghijklmnop123456'
    const token = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWX'
    const created = store.createLesson(
      lessonInput({
        title: '使用 ' + secret + ' 调用服务',
        evidence: [{ kind: 'session', sessionId: 'mask-s', recordSeq: 1, observedAt: ISO, summary: '日志出现 ' + token, verification: 'read' }],
      }),
      'k-mask-1',
    )
    assert.ok(!created.lesson.title.includes(secret))
    assert.ok(created.lesson.title.includes('已脱敏'))
    const rawEvents = readFileSync(join(dir, 'events.jsonl'), 'utf8')
    const rawEvidence = readFileSync(join(dir, 'evidence.jsonl'), 'utf8')
    assert.ok(!rawEvents.includes(secret))
    assert.ok(!rawEvents.includes(token))
    assert.ok(!rawEvidence.includes(token))
    assert.ok(rawEvidence.includes('已脱敏'))

    const rawStore = new KnowledgeStore(join(root, 'knowledge-raw'), { maskSecrets: false })
    const unmasked = rawStore.createLesson(lessonInput({ title: '使用 ' + secret }), 'k-mask-2')
    assert.ok(unmasked.lesson.title.includes(secret), '显式关闭后不再脱敏')
  } finally {
    cleanup(root)
  }
})

test('R6：checkpoint 让 maxReplayEvents=3 不再丢实体；index 丢失时全量回放可解释', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir, { maxReplayEvents: 3 })
    for (let i = 0; i < 5; i++) {
      const created = store.createLesson(
        lessonInput({ title: '结论 ' + i, action: '动作 ' + i, when: '条件 ' + i, evidence: [] }),
        'k-trunc-' + i,
      )
      assert.equal(created.created, true)
    }
    const fast = store.stats()
    assert.equal(fast.events, 5)
    assert.equal(fast.truncated, true, '事件量超过有界上限仍要显式标记')
    assert.equal(fast.replayMode, 'snapshot+tail')
    assert.equal(fast.lessons, 5, 'checkpoint 折叠的实体不得丢失')
    assert.equal(fast.unreplayedEvents, 5)
    assert.equal(fast.orphanEvents, 0)
    assert.equal(fast.unsupportedVersions, 0)
    assert.equal(store.listLessons().length, 5)
    assert.equal(MAX_REPLAY_EVENTS, 200000, 'FREEZE 规定的事件回放上限')

    rmSync(join(dir, 'index.json'))
    const bounded = new KnowledgeStore(dir, { maxReplayEvents: 3 })
    const slow = bounded.stats()
    assert.equal(slow.replayMode, 'full')
    assert.equal(slow.truncated, true)
    assert.equal(slow.events, 5)
    assert.equal(slow.replayedEvents, 3)
    assert.equal(slow.unreplayedEvents, 2)
    assert.equal(slow.lessons, 3)
    const eventLines = readFileSync(join(dir, 'events.jsonl'), 'utf8').split('\n').filter((line) => line.trim() !== '')
    assert.equal(slow.firstReplayedEventId, JSON.parse(eventLines[2]).id, 'firstReplayedEventId 指向第一条真正回放的事件')
  } finally {
    cleanup(root)
  }
})

test('负例：session 键与 sourceHash 交叉命中的仍是同一证据', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const a = store.appendEvidence({ kind: 'session', sessionId: 'x1', recordSeq: 1, sourceHash: 'hash-cross', observedAt: ISO, summary: 'A', verification: 'read' })
    const b = store.appendEvidence({ kind: 'local-artifact', sourceHash: 'hash-cross', observedAt: ISO, summary: 'B', verification: 'read' })
    assert.equal(b.created, false)
    assert.equal(b.evidence.id, a.evidence.id, '同 sourceHash 不得因 session 键不同而重复')
    const c = store.appendEvidence({ kind: 'session', sessionId: 'x1', recordSeq: 1, sourceHash: 'hash-other', observedAt: ISO, summary: 'C', verification: 'read' })
    assert.equal(c.created, false)
    assert.equal(c.evidence.id, a.evidence.id, '同 sessionId+recordSeq 不得因 sourceHash 不同而重复')
    assert.equal(evidenceLines(dir), 1)

    const e1 = { schemaVersion: 1, id: 'm1', kind: 'session', sessionId: 'p', recordSeq: 5, sourceHash: 'h1', observedAt: ISO, summary: 'x', verification: 'read' }
    const e2 = { schemaVersion: 1, id: 'm2', kind: 'session', sessionId: 'q', recordSeq: 6, sourceHash: 'h1', observedAt: ISO, summary: 'x', verification: 'read' }
    const e3 = { schemaVersion: 1, id: 'm3', kind: 'session', sessionId: 'p', recordSeq: 5, sourceHash: 'h2', observedAt: ISO, summary: 'x', verification: 'read' }
    assert.equal(mergeEvidenceSupport({ evidenceIds: ['m1', 'm2', 'm3'] }, [e1, e2, e3]), 1, '同 session 或同 hash 的传递闭包算一条证据')
  } finally {
    cleanup(root)
  }
})


test('R2′：read 证据初始 usable，claimed/无证据保持 candidate，合并可提升', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const sessionRead = store.createLesson(lessonInput({
      title: '普通 read 经验',
      evidence: [evidenceInput({ sessionId: 'r1', recordSeq: 1 })],
    }), 'r2-1')
    assert.equal(sessionRead.lesson.state, 'usable')
    assert.equal(sessionRead.lesson.review.decision, 'unreviewed')
    assert.equal(sessionRead.lesson.independentSupportCount, 1)

    const uc = store.createLesson(lessonInput({
      title: '用户纠正经验',
      evidence: [{ kind: 'user-correction', sessionId: 'r2', recordSeq: 2, observedAt: ISO, summary: '用户明确纠正', verification: 'read' }],
    }), 'r2-2')
    assert.equal(uc.lesson.state, 'usable')
    assert.equal(uc.lesson.review.decision, 'unreviewed', '已读用户纠正不是用户采纳事件')
    assert.equal(uc.lesson.review.actor, undefined)

    const claimed = store.createLesson(lessonInput({
      title: '仅声明经验',
      evidence: [evidenceInput({ sessionId: 'r3', recordSeq: 3, verification: 'claimed' })],
    }), 'r2-3')
    assert.equal(claimed.lesson.state, 'candidate')
    assert.equal(claimed.lesson.independentSupportCount, 0)

    const none = store.createLesson(lessonInput({ title: '无证据经验', evidence: [] }), 'r2-4')
    assert.equal(none.lesson.state, 'candidate')
    assert.equal(none.lesson.review.decision, 'unreviewed')

    const promoted = store.createLesson(lessonInput({
      title: '仅声明经验',
      evidence: [evidenceInput({ sessionId: 'r5', recordSeq: 5 })],
    }), 'r2-5')
    assert.equal(promoted.created, false)
    assert.equal(promoted.lesson.id, claimed.lesson.id)
    assert.equal(promoted.lesson.state, 'usable', '候选遇到 read 证据应提升')
    assert.equal(promoted.lesson.independentSupportCount, 1)
    assert.ok(promoted.lesson.revision >= 2)
  } finally {
    cleanup(root)
  }
})

test('R6：孤儿 update 与 JSON 坏行分开计数；rebuildIndex 完整折叠后可恢复旧实体', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const full = new KnowledgeStore(dir)
    const ids = []
    for (let i = 0; i < 6; i++) {
      ids.push(full.createLesson(
        lessonInput({ title: '经验 ' + i, action: '动作 ' + i, when: '条件 ' + i, evidence: [] }),
        'r6-' + i,
      ).lesson.id)
    }
    full.updateLesson(ids[0], { title: '经验 0 已更新' }, 1, 'r6-update')
    rmSync(join(dir, 'index.json'))

    const bounded = new KnowledgeStore(dir, { maxReplayEvents: 3 })
    const stats = bounded.stats()
    assert.equal(stats.lessons, 2)
    assert.equal(stats.orphanEvents, 1, '找不到 previous 的 update 计 orphanEvents')
    assert.equal(stats.badLines, 0, '孤儿事件不得混进 badLines')
    assert.equal(stats.unsupportedVersions, 0)
    const eventLines = readFileSync(join(dir, 'events.jsonl'), 'utf8').split('\n').filter((line) => line.trim() !== '')
    assert.equal(stats.firstReplayedEventId, JSON.parse(eventLines[4]).id)
    assert.equal(bounded.getLesson(ids[0]), undefined, '有界回放看不到旧实体（修复前行为）')
    assert.deepEqual(bounded.listLessons().map((lesson) => lesson.id).sort(), [ids[4], ids[5]].sort())

    bounded.rebuildIndex()
    assert.equal(bounded.getLesson(ids[0]).title, '经验 0 已更新', '完整折叠后旧实体必须回来')
    const healed = bounded.stats()
    assert.equal(healed.lessons, 6)
    assert.equal(healed.orphanEvents, 0)
    assert.equal(healed.replayMode, 'snapshot+tail')
    assert.equal(healed.truncated, true, '日志规模仍超上限，但不丢实体且可解释')
    assert.equal(healed.unreplayedEvents, 7)
    assert.equal(healed.replayedEvents, 0)
  } finally {
    cleanup(root)
  }
})

test('R7：schemaVersion=2 独立计 unsupportedVersions，不混进 badLines；validateLesson 可选迁移', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    store.createLesson(lessonInput({ evidence: [] }), 'v2-base')
    const badBefore = store.stats().badLines
    const v2Event = JSON.stringify({ schemaVersion: 2, id: 'evt_v2', at: ISO, kind: 'lesson.create', lessonId: 'lsn_v2', idempotencyKey: 'v2', payload: { schemaVersion: 2, id: 'lsn_v2' } })
    const shellV2Payload = JSON.stringify({ schemaVersion: 1, id: 'evt_v2b', at: ISO, kind: 'lesson.create', lessonId: 'lsn_v2b', idempotencyKey: 'v2b', payload: { schemaVersion: 2, id: 'lsn_v2b' } })
    writeFileSync(join(dir, 'events.jsonl'), v2Event + '\n' + shellV2Payload + '\n', { flag: 'a' })
    const v2Evidence = JSON.stringify({ schemaVersion: 2, id: 'evd_v2', kind: 'session', observedAt: ISO, summary: 'v2 证据', verification: 'read' })
    writeFileSync(join(dir, 'evidence.jsonl'), v2Evidence + '\n', { flag: 'a' })

    const stats = store.stats()
    assert.equal(stats.unsupportedVersions, 3, '两条事件 + 一条证据都独立计数')
    assert.equal(stats.badLines, badBefore, 'unsupported 不得混进 badLines')
    assert.equal(stats.orphanEvents, 0)
    assert.equal(store.listLessons().length, 1, '跳过 v2 不影响 v1 经验')

    const fixture = {
      schemaVersion: 1, id: 'lsn_x', revision: 1, kind: 'fact', title: '结论', action: '动作', when: '条件',
      exceptions: [], scope: { global: true }, applicability: [], state: 'candidate',
      evidenceIds: [], independentSupportCount: 0, review: { decision: 'unreviewed' },
      createdAt: ISO, updatedAt: ISO, conflictIds: [],
    }
    const v2 = { ...fixture, schemaVersion: 2, extra: 'x' }
    assert.throws(() => validateLesson(v2), isCode('invalid'))
    const accepted = validateLesson(v2, { accept: [1, 2] })
    assert.equal(accepted.schemaVersion, 1)
    assert.equal(accepted.title, '结论')
    const migrate = (from, raw) => ({ ...raw, schemaVersion: 1, title: '从 v2 迁移' })
    const migrated = validateLesson(v2, { accept: [1, 2], migrate })
    assert.equal(migrated.title, '从 v2 迁移')
    assert.deepEqual(migrated, validateLesson(v2, { accept: [1, 2], migrate }), '迁移必须幂等')
    assert.throws(() => validateLesson(v2, { accept: [2], migrate: () => ({ nope: 1 }) }), isCode('invalid'), '迁移结果必须能过 v1 校验')
  } finally {
    cleanup(root)
  }
})

test('R7：同幂等键异 payload 抛 duplicate；同 payload 仍幂等且不写', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const first = store.createLesson(lessonInput({ title: '原结论', evidence: [] }), 'dup-key')
    const again = store.createLesson(lessonInput({ title: '原结论', evidence: [] }), 'dup-key')
    assert.equal(again.created, false)
    assert.equal(again.lesson.id, first.lesson.id)
    const before = eventsLines(dir)
    assert.throws(
      () => store.createLesson(lessonInput({ title: '不同结论', evidence: [] }), 'dup-key'),
      (error) => error instanceof KnowledgeError && error.code === 'duplicate'
        && error.details !== undefined && typeof error.details.requestHash === 'string'
        && error.details.existingRequestHash !== error.details.requestHash,
    )
    assert.equal(eventsLines(dir), before, 'duplicate 不得写事件')
    assert.equal(store.stats().lessons, 1)
  } finally {
    cleanup(root)
  }
})

test('R7：diagnose() 只读，给出锁/文件/计数；新鲜锁下 writable=false', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    mkdirSync(dir, { recursive: true })
    const store = new KnowledgeStore(dir)
    store.createLesson(lessonInput({ evidence: [] }), 'diag-1')
    const eventsBefore = readFileSync(join(dir, 'events.jsonl'), 'utf8')
    const d = store.diagnose()
    assert.equal(typeof d.writable, 'boolean')
    assert.equal(d.lock.present, false)
    assert.equal(d.files.events.exists, true)
    assert.ok(d.files.events.bytes > 0)
    assert.equal(d.counts.lessons, 1)
    assert.equal(d.counts.orphanEvents, 0)
    assert.equal(d.counts.unsupportedVersions, 0)
    assert.equal(readFileSync(join(dir, 'events.jsonl'), 'utf8'), eventsBefore, 'diagnose 不得写盘')

    writeFileSync(join(dir, '.lock'), JSON.stringify({ pid: process.pid, at: new Date().toISOString(), token: 'probe', bootId: 'probe-boot' }))
    const d2 = store.diagnose()
    assert.equal(d2.writable, false)
    assert.equal(d2.lock.present, true)
    assert.equal(d2.lock.pid, process.pid)
    assert.equal(d2.lock.alive, true)
    rmSync(join(dir, '.lock'))
    assert.equal(store.diagnose().writable, true)
  } finally {
    cleanup(root)
  }
})

test('R7：锁超硬上限且心跳停滞 → 可操作 io 错误且不静默抢占', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    mkdirSync(dir, { recursive: true })
    const store = new KnowledgeStore(dir, { lockTimeoutMs: 100, lockStaleMs: 10, lockHardLimitMs: 50 })
    const lockPath = join(dir, '.lock')
    writeFileSync(lockPath, JSON.stringify({ pid: process.pid, at: new Date(Date.now() - 60000).toISOString(), token: 'hung', bootId: 'hung-boot' }))
    assert.throws(
      () => store.createLesson(lessonInput({ evidence: [] }), 'k-hung'),
      (error) => {
        assert.ok(error instanceof KnowledgeError && error.code === 'io')
        assert.ok(error.message.includes(String(process.pid)), '错误信息要带 holder pid')
        assert.ok(error.details !== undefined && error.details.holderPid === process.pid)
        assert.equal(typeof error.details.ageMs, 'number')
        return true
      },
    )
    assert.ok(existsSync(lockPath), '不得静默抢占/删除存活持有者的锁')
  } finally {
    cleanup(root)
  }
})

test('R6：checkpoint 被篡改/前缀哈希不符时回退全量回放，不信任派生索引', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const created = store.createLesson(lessonInput({ evidence: [] }), 'fallback-1')
    const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    index.checkpoint.offset = index.checkpoint.offset + 10
    writeFileSync(join(dir, 'index.json'), JSON.stringify(index))
    const fallback = new KnowledgeStore(dir)
    assert.equal(fallback.getLesson(created.lesson.id).id, created.lesson.id)
    assert.equal(fallback.stats().replayMode, 'full', 'offset 不可信必须回退全量回放')

    const index2 = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    index2.checkpoint.offset = index2.checkpoint.offset - 10
    index2.checkpoint.prefixHash = 'deadbeef'
    writeFileSync(join(dir, 'index.json'), JSON.stringify(index2))
    const fallback2 = new KnowledgeStore(dir)
    assert.equal(fallback2.listLessons().length, 1)
    assert.equal(fallback2.getLesson(created.lesson.id).state, 'candidate')
    assert.equal(fallback2.stats().replayMode, 'full', '前缀哈希不符必须回退全量回放')
  } finally {
    cleanup(root)
  }
})


test('M2·A：review.note/resolution 过脱敏、可 replay 恢复；旧事件缺字段正常', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const a = store.createLesson(lessonInput({ title: '备注甲', action: '动作', when: '条件', evidence: [] }), 'note-1').lesson.id
    const b = store.createLesson(lessonInput({ title: '备注乙', action: '动作', when: '条件', evidence: [] }), 'note-2').lesson.id
    const secret = 'sk-abcdefghijklmnop123456'
    const withNote = store.reviewLesson(
      a, 'accepted', 1, 'note-3', 'user',
      '用户明确要求优先复用现有资产 ' + secret,
      { kind: 'prefer', targetId: b, affectedIds: [b] },
    )
    assert.equal(withNote.review.decision, 'accepted')
    assert.ok(!withNote.review.note.includes(secret), 'note 写盘前必须过 mask.ts')
    assert.ok(withNote.review.note.includes('已脱敏'))
    assert.equal(withNote.review.resolution.kind, 'prefer')
    assert.deepEqual(withNote.review.resolution.affectedIds, [b])

    rmSync(join(dir, 'index.json'))
    const replayed = new KnowledgeStore(dir).getLesson(a)
    assert.equal(replayed.review.note, withNote.review.note, 'replay 后 note 必须仍在')
    assert.equal(replayed.review.resolution.targetId, b, 'replay 后 resolution 必须仍在')

    const plain = store.reviewLesson(b, 'rejected', 1, 'note-4', 'model')
    assert.equal(plain.review.note, undefined)
    assert.equal(new KnowledgeStore(dir).getLesson(b).review.note, undefined, '旧/无 note 记录不报错')

    const c = store.createLesson(lessonInput({ title: '备注丙', action: '动作', when: '条件', evidence: [] }), 'note-5').lesson.id
    const emptyNote = store.reviewLesson(c, 'accepted', 1, 'note-6', 'user', '   ')
    assert.equal(emptyNote.review.note, undefined, '空串归一为 undefined')

    const d = store.createLesson(lessonInput({ title: '备注丁', action: '动作', when: '条件', evidence: [] }), 'note-7').lesson.id
    const longNote = store.reviewLesson(d, 'accepted', 1, 'note-8', 'user', '备注'.repeat(300))
    assert.equal(longNote.review.note.length, 500, '超长 note 截断到 500 而不是报错')
  } finally {
    cleanup(root)
  }
})

test('M2·B：updateLessonsBatch 原子、可 replay、幂等、可与单条交错', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    const a = store.createLesson(lessonInput({ title: '批量甲', action: '动作', when: '条件', evidence: [] }), 'batch-1').lesson.id
    const b = store.createLesson(lessonInput({ title: '批量乙', action: '动作', when: '条件', evidence: [] }), 'batch-2').lesson.id
    const c = store.createLesson(lessonInput({ title: '批量丙', action: '动作', when: '条件', evidence: [] }), 'batch-3').lesson.id

    const beforeLines = eventsLines(dir)
    assert.throws(
      () => store.updateLessonsBatch([
        { id: a, patch: { title: '批量甲改' }, expectedRevision: 1 },
        { id: b, patch: { title: '批量乙改' }, expectedRevision: 99 },
      ], 'batch-bad'),
      (error) => error instanceof KnowledgeError && error.code === 'revision'
        && error.details !== undefined && error.details.failedId === b,
    )
    assert.equal(eventsLines(dir), beforeLines, '任一条 revision 不符 → 全部未生效')
    assert.equal(store.getLesson(a).title, '批量甲')
    assert.equal(store.getLesson(a).revision, 1)

    const applied = store.updateLessonsBatch([
      { id: a, patch: { title: '批量甲改', state: 'disputed' }, expectedRevision: 1 },
      { id: b, patch: { title: '批量乙改', state: 'disputed' }, expectedRevision: 1 },
    ], 'batch-good')
    assert.equal(applied.length, 2)
    assert.equal(applied[0].title, '批量甲改')
    assert.equal(applied[0].state, 'disputed')
    assert.equal(applied[1].state, 'disputed')
    assert.equal(eventsLines(dir), beforeLines + 1, '整批只追加一个事件')

    rmSync(join(dir, 'index.json'))
    const replayed = new KnowledgeStore(dir)
    assert.equal(replayed.getLesson(a).title, '批量甲改')
    assert.equal(replayed.getLesson(b).state, 'disputed')

    const afterApply = eventsLines(dir)
    const repeated = store.updateLessonsBatch([
      { id: a, patch: { title: '批量甲改', state: 'disputed' }, expectedRevision: 1 },
      { id: b, patch: { title: '批量乙改', state: 'disputed' }, expectedRevision: 1 },
    ], 'batch-good')
    assert.equal(repeated.length, 2)
    assert.equal(repeated[0].revision, applied[0].revision, '同 key 重放返回首次结果')
    assert.equal(eventsLines(dir), afterApply, '同 key 重放不得追加事件')

    const cUpdated = store.updateLesson(c, { title: '批量丙单改' }, 1, 'batch-4')
    assert.equal(cUpdated.revision, 2)
    const aAgain = store.applyTransition(a, 'usable', applied[0].revision, 'batch-5')
    assert.equal(aAgain.state, 'usable')
    assert.equal(aAgain.revision, applied[0].revision + 1)

    rmSync(join(dir, 'index.json'))
    const finalStore = new KnowledgeStore(dir)
    assert.equal(finalStore.getLesson(a).state, 'usable')
    assert.equal(finalStore.getLesson(b).state, 'disputed')
    assert.equal(finalStore.getLesson(c).title, '批量丙单改')
  } finally {
    cleanup(root)
  }
})

test('M2·B：未知事件 kind 计 skippedEvents，不混进 badLines、不炸整体', () => {
  const root = freshRoot()
  const dir = join(root, 'knowledge')
  try {
    const store = new KnowledgeStore(dir)
    store.createLesson(lessonInput({ evidence: [] }), 'unknown-1')
    const badBefore = store.stats().badLines
    const futureLine = JSON.stringify({ schemaVersion: 1, id: 'evt_future', at: ISO, kind: 'lesson.future', idempotencyKey: 'future-1', payload: { x: 1 } })
    writeFileSync(join(dir, 'events.jsonl'), futureLine + '\n', { flag: 'a' })
    const stats = store.stats()
    assert.equal(stats.skippedEvents, 1, '未知 kind 独立计 skippedEvents')
    assert.equal(stats.badLines, badBefore, '未知 kind 不得混进 badLines')
    assert.equal(stats.orphanEvents, 0)
    assert.equal(stats.lessons, 1)
  } finally {
    cleanup(root)
  }
})
