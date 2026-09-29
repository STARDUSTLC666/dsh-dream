/**
 * dsh-dream 知识层：经验（Lesson）、证据（Evidence）与知识事件的类型定义、
 * schema 校验与确定性纯函数。
 *
 * 本模块只做纯计算，不落盘；落盘见 knowledge-store.ts。
 *
 * @module dsh-dream/knowledge
 */
import { createHash } from 'node:crypto'

/** 经验类别：偏好 / 流程 / 坑 / 事实。 */
export type LessonKind = 'preference' | 'procedure' | 'pitfall' | 'fact'

/** 经验状态。candidate=候选；usable=可用；disputed=有冲突；stale=待复核；rejected=已拒绝。 */
export type LessonState = 'candidate' | 'usable' | 'disputed' | 'stale' | 'rejected'

/** 审阅结论。 */
export type ReviewDecision = 'unreviewed' | 'accepted' | 'rejected'

/** 一条可复用经验。 */
export interface Lesson {
  schemaVersion: 1
  id: string
  revision: number
  kind: LessonKind
  /** 一句话结论（不含条件时不得单独使用）。 */
  title: string
  /** 可执行动作。 */
  action: string
  /** 适用条件（何时该用）。 */
  when: string
  /** 例外，检索时不得被截断。 */
  exceptions: string[]
  scope: { projectId?: string; workspaceRoot?: string; global: boolean }
  applicability: { package?: string; versions?: string; platform?: string }[]
  state: LessonState
  evidenceIds: string[]
  /** 独立证据数（同证据复述不增加）。 */
  independentSupportCount: number
  review: { decision: ReviewDecision; actor?: string; at?: string }
  createdAt: string
  updatedAt: string
  lastValidatedAt?: string
  reviewAfter?: string
  supersedes?: string[]
  conflictIds: string[]
}

/** 一条证据：只存脱敏摘要 + 定位信息。 */
export interface Evidence {
  schemaVersion: 1
  id: string
  kind: 'session' | 'user-correction' | 'local-artifact'
  sessionId?: string
  recordSeq?: number | string
  projectId?: string
  observedAt: string
  /** 已脱敏的一句话。 */
  summary: string
  /** read=插件读到原记录；claimed=仅模型声称。 */
  verification: 'read' | 'claimed'
  sourceHash?: string
}

/** dream_learn / 迁移的输入。 */
export interface LessonInput {
  kind: LessonKind
  title: string
  action: string
  when: string
  exceptions?: string[]
  projectId?: string
  workspaceRoot?: string
  global?: boolean
  applicability?: Lesson['applicability']
  evidence: EvidenceInput[]
  conflictIds?: string[]
}

/** 证据输入：id / schemaVersion / observedAt 由存储层补齐。 */
export interface EvidenceInput extends Omit<Evidence, 'schemaVersion' | 'id' | 'observedAt'> {
  observedAt?: string
}

/** 知识事件（events.jsonl 的每一行）。 */
export type KnowledgeEvent =
  | { schemaVersion: 1; id: string; at: string; kind: 'lesson.create'; lessonId: string; idempotencyKey: string; payload: Lesson }
  | { schemaVersion: 1; id: string; at: string; kind: 'lesson.update'; lessonId: string; revision: number; idempotencyKey: string; payload: Partial<Lesson> }
  | { schemaVersion: 1; id: string; at: string; kind: 'lesson.review'; lessonId: string; revision: number; idempotencyKey: string; payload: { decision: ReviewDecision; actor?: string; state: LessonState } }
  | { schemaVersion: 1; id: string; at: string; kind: 'evidence.add'; idempotencyKey: string; payload: Evidence }

/** 知识层错误码：invalid=数据不合法；revision=乐观锁不符；duplicate=重复；io=读写/锁失败。 */
export class KnowledgeError extends Error {
  code: 'invalid' | 'revision' | 'duplicate' | 'io'

  constructor(code: 'invalid' | 'revision' | 'duplicate' | 'io', message: string) {
    super(message)
    this.name = 'KnowledgeError'
    this.code = code
  }
}

const LESSON_KINDS: readonly LessonKind[] = ['preference', 'procedure', 'pitfall', 'fact']
const LESSON_STATES: readonly LessonState[] = ['candidate', 'usable', 'disputed', 'stale', 'rejected']
const REVIEW_DECISIONS: readonly ReviewDecision[] = ['unreviewed', 'accepted', 'rejected']
const EVIDENCE_KINDS: readonly Evidence['kind'][] = ['session', 'user-correction', 'local-artifact']
const EVIDENCE_VERIFICATIONS: readonly Evidence['verification'][] = ['read', 'claimed']

/** 允许的状态迁移。rejected 只能显式回到 candidate 重新审阅，不能直接变 usable。 */
const TRANSITIONS: Record<LessonState, readonly LessonState[]> = {
  candidate: ['usable', 'rejected', 'disputed', 'stale'],
  usable: ['disputed', 'stale', 'rejected'],
  disputed: ['usable', 'rejected', 'stale'],
  stale: ['usable', 'rejected', 'disputed'],
  rejected: ['candidate'],
}

function fail(field: string, detail: string): never {
  throw new KnowledgeError('invalid', '知识数据无效（' + field + '）：' + detail)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

function readString(value: unknown, field: string, opts: { required?: boolean; nonEmpty?: boolean } = {}): string | undefined {
  if (value === undefined || value === null) {
    if (opts.required === true) fail(field, '缺失')
    return undefined
  }
  if (typeof value !== 'string') fail(field, '必须是字符串')
  if (opts.nonEmpty === true && value.trim() === '') fail(field, '不能为空')
  return value
}

function readStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) fail(field, '必须是字符串数组')
  const out: string[] = []
  for (let i = 0; i < value.length; i++) {
    const item = value[i]
    if (typeof item !== 'string') fail(field + '[' + i + ']', '必须是字符串')
    if (item.trim() === '') fail(field + '[' + i + ']', '不能为空')
    if (!out.includes(item)) out.push(item)
  }
  return out
}

function readIsoDate(value: unknown, field: string, required = false): string | undefined {
  const text = readString(value, field, { required, nonEmpty: true })
  if (text === undefined) return undefined
  if (Number.isNaN(Date.parse(text))) fail(field, '必须是可解析的 ISO 时间')
  return text
}

function readScope(value: unknown): Lesson['scope'] {
  if (!isRecord(value)) fail('scope', '必须是对象')
  const global = value.global
  if (typeof global !== 'boolean') fail('scope.global', '必须是布尔值')
  const projectId = readString(value.projectId, 'scope.projectId', { nonEmpty: true })
  const workspaceRoot = readString(value.workspaceRoot, 'scope.workspaceRoot', { nonEmpty: true })
  const scope: Lesson['scope'] = { global }
  if (projectId !== undefined) scope.projectId = projectId
  if (workspaceRoot !== undefined) scope.workspaceRoot = workspaceRoot
  return scope
}

function readApplicability(value: unknown): Lesson['applicability'] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) fail('applicability', '必须是对象数组')
  const out: Lesson['applicability'] = []
  for (let i = 0; i < value.length; i++) {
    const entry = value[i]
    if (!isRecord(entry)) fail('applicability[' + i + ']', '必须是对象')
    const item: Lesson['applicability'][number] = {}
    const pkg = readString(entry.package, 'applicability[' + i + '].package', { nonEmpty: true })
    const versions = readString(entry.versions, 'applicability[' + i + '].versions', { nonEmpty: true })
    const platform = readString(entry.platform, 'applicability[' + i + '].platform', { nonEmpty: true })
    if (pkg !== undefined) item.package = pkg
    if (versions !== undefined) item.versions = versions
    if (platform !== undefined) item.platform = platform
    out.push(item)
  }
  return out
}

function readReview(value: unknown): Lesson['review'] {
  if (value === undefined || value === null) return { decision: 'unreviewed' }
  if (!isRecord(value)) fail('review', '必须是对象')
  const decision = value.decision
  if (!isEnum(decision, REVIEW_DECISIONS)) fail('review.decision', '取值不合法')
  const review: Lesson['review'] = { decision }
  const actor = readString(value.actor, 'review.actor', { nonEmpty: true })
  const at = readIsoDate(value.at, 'review.at')
  if (actor !== undefined) review.actor = actor
  if (at !== undefined) review.at = at
  return review
}

/** 校验并归一化一条经验；失败抛 KnowledgeError('invalid')。未知字段会被丢弃。 */
export function validateLesson(value: unknown): Lesson {
  if (!isRecord(value)) fail('lesson', '必须是对象')
  if (value.schemaVersion !== 1) fail('schemaVersion', '只支持 1')
  const id = readString(value.id, 'id', { required: true, nonEmpty: true }) as string
  const revision = value.revision
  if (typeof revision !== 'number' || !Number.isInteger(revision) || revision < 1) fail('revision', '必须是 >= 1 的整数')
  const kind = value.kind
  if (!isEnum(kind, LESSON_KINDS)) fail('kind', '取值不合法')
  const title = readString(value.title, 'title', { required: true, nonEmpty: true }) as string
  const action = readString(value.action, 'action', { required: true, nonEmpty: true }) as string
  const when = readString(value.when, 'when', { required: true, nonEmpty: true }) as string
  const exceptions = readStringArray(value.exceptions, 'exceptions') ?? []
  const scope = readScope(value.scope)
  const applicability = readApplicability(value.applicability)
  const state = value.state
  if (!isEnum(state, LESSON_STATES)) fail('state', '取值不合法')
  const evidenceIds = readStringArray(value.evidenceIds, 'evidenceIds') ?? []
  const independentSupportCount = value.independentSupportCount
  if (typeof independentSupportCount !== 'number' || !Number.isInteger(independentSupportCount) || independentSupportCount < 0) {
    fail('independentSupportCount', '必须是 >= 0 的整数')
  }
  const review = readReview(value.review)
  const createdAt = readIsoDate(value.createdAt, 'createdAt', true) as string
  const updatedAt = readIsoDate(value.updatedAt, 'updatedAt', true) as string
  const lastValidatedAt = readIsoDate(value.lastValidatedAt, 'lastValidatedAt')
  const reviewAfter = readIsoDate(value.reviewAfter, 'reviewAfter')
  const supersedes = readStringArray(value.supersedes, 'supersedes')
  const conflictIds = readStringArray(value.conflictIds, 'conflictIds') ?? []

  const lesson: Lesson = {
    schemaVersion: 1,
    id,
    revision,
    kind,
    title,
    action,
    when,
    exceptions,
    scope,
    applicability,
    state,
    evidenceIds,
    independentSupportCount,
    review,
    createdAt,
    updatedAt,
    conflictIds,
  }
  if (lastValidatedAt !== undefined) lesson.lastValidatedAt = lastValidatedAt
  if (reviewAfter !== undefined) lesson.reviewAfter = reviewAfter
  if (supersedes !== undefined) lesson.supersedes = supersedes
  return lesson
}

/** 校验并归一化一条证据；失败抛 KnowledgeError('invalid')。未知字段会被丢弃。 */
export function validateEvidence(value: unknown): Evidence {
  if (!isRecord(value)) fail('evidence', '必须是对象')
  if (value.schemaVersion !== 1) fail('evidence.schemaVersion', '只支持 1')
  const id = readString(value.id, 'evidence.id', { required: true, nonEmpty: true }) as string
  const kind = value.kind
  if (!isEnum(kind, EVIDENCE_KINDS)) fail('evidence.kind', '取值不合法')
  const verification = value.verification
  if (!isEnum(verification, EVIDENCE_VERIFICATIONS)) fail('evidence.verification', '取值不合法')
  const observedAt = readIsoDate(value.observedAt, 'evidence.observedAt', true) as string
  const summary = readString(value.summary, 'evidence.summary', { required: true, nonEmpty: true }) as string
  const sessionId = readString(value.sessionId, 'evidence.sessionId', { nonEmpty: true })
  const projectId = readString(value.projectId, 'evidence.projectId', { nonEmpty: true })
  const sourceHash = readString(value.sourceHash, 'evidence.sourceHash', { nonEmpty: true })
  const recordSeqRaw = value.recordSeq
  let recordSeq: number | string | undefined
  if (recordSeqRaw !== undefined && recordSeqRaw !== null) {
    if (typeof recordSeqRaw === 'number') {
      if (!Number.isInteger(recordSeqRaw) || recordSeqRaw < 0) fail('evidence.recordSeq', '数字必须是 >= 0 的整数')
      recordSeq = recordSeqRaw
    } else if (typeof recordSeqRaw === 'string') {
      if (recordSeqRaw.trim() === '') fail('evidence.recordSeq', '字符串不能为空')
      recordSeq = recordSeqRaw
    } else {
      fail('evidence.recordSeq', '必须是数字或字符串')
    }
  }
  const evidence: Evidence = { schemaVersion: 1, id, kind, observedAt, summary, verification }
  if (sessionId !== undefined) evidence.sessionId = sessionId
  if (recordSeq !== undefined) evidence.recordSeq = recordSeq
  if (projectId !== undefined) evidence.projectId = projectId
  if (sourceHash !== undefined) evidence.sourceHash = sourceHash
  return evidence
}

/**
 * 规范化用于比较的文本：Unicode NFC + 折叠连续空白 + trim。
 * 展示仍用原样；指纹比较时再统一 lowercase。
 */
export function normalizeLessonText(text: string): string {
  if (typeof text !== 'string') throw new KnowledgeError('invalid', 'normalizeLessonText 需要字符串')
  return text.normalize('NFC').replace(/\s+/g, ' ').trim()
}

/** lessonFingerprint 的最小输入；title 可选，但建议传入，让“应开启/不应开启”这类结论差异参与指纹。 */
export type LessonFingerprintInput = Pick<Lesson, 'kind' | 'action' | 'when' | 'scope'> & { title?: string }

/**
 * 经验指纹：kind + title + action + when + scope 的规范化小写序列表，
 * sha256 取前 16 位十六进制。否定词、数值、路径、版本条件原样参与。
 */
export function lessonFingerprint(input: LessonFingerprintInput): string {
  const part = (text: string | undefined): string => normalizeLessonText(text === undefined ? '' : text).toLowerCase()
  const scope = input.scope
  const canonical = JSON.stringify([
    input.kind,
    part(input.title),
    part(input.action),
    part(input.when),
    {
      global: scope !== undefined && scope.global === true,
      projectId: part(scope === undefined ? undefined : scope.projectId) || null,
      workspaceRoot: part(scope === undefined ? undefined : scope.workspaceRoot) || null,
    },
  ])
  return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16)
}

/** 状态机：from → to 是否允许。同状态与未知状态一律不允许。 */
export function canTransition(from: LessonState, to: LessonState): boolean {
  if (!isEnum(from, LESSON_STATES) || !isEnum(to, LESSON_STATES)) return false
  return TRANSITIONS[from].includes(to)
}

/** sessionId + recordSeq 组成的会话定位键；两者缺一不可。 */
export function evidenceSessionKey(
  evidence: Pick<Evidence, 'sessionId' | 'recordSeq'>,
): string | undefined {
  if (
    typeof evidence.sessionId === 'string' &&
    evidence.sessionId !== '' &&
    evidence.recordSeq !== undefined &&
    evidence.recordSeq !== null
  ) {
    return 'session:' + evidence.sessionId + '#' + String(evidence.recordSeq)
  }
  return undefined
}

/** sourceHash 键；空串视为缺失。 */
export function evidenceHashKey(
  evidence: Pick<Evidence, 'sourceHash'>,
): string | undefined {
  if (typeof evidence.sourceHash === 'string' && evidence.sourceHash !== '') {
    return 'hash:' + evidence.sourceHash
  }
  return undefined
}

/** 证据的天然身份键：同 sessionId + recordSeq 优先，其次同 sourceHash。 */
export function evidenceNaturalKey(
  evidence: Pick<Evidence, 'sessionId' | 'recordSeq' | 'sourceHash'>,
): string | undefined {
  return evidenceSessionKey(evidence) ?? evidenceHashKey(evidence)
}

/** 去重键：优先天然身份键，否则退回证据 id。 */
export function evidenceDedupKey(evidence: Pick<Evidence, 'id' | 'sessionId' | 'recordSeq' | 'sourceHash'>): string {
  return evidenceNaturalKey(evidence) ?? 'id:' + String(evidence.id)
}

/**
 * 去重后的独立证据数：只看 lesson.evidenceIds 引用到的证据，
 * 同 sessionId+recordSeq 或同 sourceHash 只算一次；verification=claimed 不计入。
 */
export function mergeEvidenceSupport(lesson: Pick<Lesson, 'evidenceIds'>, evidence: Evidence[]): number {
  const wanted = new Set(lesson.evidenceIds)
  const items = evidence.filter((item) => wanted.has(item.id) && item.verification === 'read')
  const parent = items.map((_, index) => index)
  const find = (index: number): number => {
    let current = index
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]]
      current = parent[current]
    }
    return current
  }
  const union = (a: number, b: number): void => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent[rootB] = rootA
  }
  const bySession = new Map<string, number>()
  const byHash = new Map<string, number>()
  for (let i = 0; i < items.length; i++) {
    const sessionKey = evidenceSessionKey(items[i])
    if (sessionKey !== undefined) {
      const seen = bySession.get(sessionKey)
      if (seen === undefined) bySession.set(sessionKey, i)
      else union(i, seen)
    }
    const hashKey = evidenceHashKey(items[i])
    if (hashKey !== undefined) {
      const seen = byHash.get(hashKey)
      if (seen === undefined) byHash.set(hashKey, i)
      else union(i, seen)
    }
  }
  const roots = new Set<number>()
  for (let i = 0; i < items.length; i++) roots.add(find(i))
  return roots.size
}
