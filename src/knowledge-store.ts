/**
 * dsh-dream 知识存储：events.jsonl 为权威追加日志，evidence.jsonl 追加证据，
 * index.json 为可丢弃重建的派生索引，.lock 为短期文件锁。
 *
 * 设计要点：
 * - 幂等：同 idempotencyKey 重复调用返回首次结果且不写新事件。
 * - revision 守卫：expectedRevision 不符抛 KnowledgeError('revision')，不写盘。
 * - 崩溃安全：单行追加 + 单行 JSON.parse 容错；坏行跳过并计数。
 * - 有界回放：events.jsonl 超过 maxReplayEvents 行时只回放最近 N 行，stats().truncated=true。
 * - index.json 是派生物：自动更新失败按降级处理（事件仍是权威）；rebuildIndex() 会明确重建。
 * - 只读方法（listLessons/listEvidence/getLesson/stats）绝不建目录、绝不写盘。
 * - 新写盘路径在 maskSecrets 开启（默认）时统一过 mask.ts。
 *
 * @module dsh-dream/knowledge-store
 */
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  appendFileSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import {
  KnowledgeError,
  canTransition,
  evidenceNaturalKey,
  evidenceSessionKey,
  lessonFingerprint,
  mergeEvidenceSupport,
  validateEvidence,
  validateLesson,
  type Evidence,
  type EvidenceInput,
  type KnowledgeEvent,
  type Lesson,
  type LessonInput,
  type LessonState,
  type ReviewDecision,
} from './knowledge.js'
import { maskSecrets } from './mask.js'

/** events.jsonl 默认最多回放的行数（有界读取）。 */
export const MAX_REPLAY_EVENTS = 200000

/** KnowledgeStore 构造选项（都可省略，保持 FREEZE 的 constructor(knowledgeDir) 可用）。 */
export interface KnowledgeStoreOptions {
  /** 写盘前是否按 mask.ts 脱敏；默认 true（与插件默认 maskSecrets=true 一致）。 */
  maskSecrets?: boolean
  /** 回放行数上限；默认 MAX_REPLAY_EVENTS，测试可调小。 */
  maxReplayEvents?: number
  /** 获取锁的最长等待毫秒数；默认 2000。 */
  lockTimeoutMs?: number
  /** 锁年龄超过该毫秒数且 pid 不存活才允许接管；默认 30000。 */
  lockStaleMs?: number
}

interface ReplayState {
  lessons: Map<string, Lesson>
  evidence: Map<string, Evidence>
  idempotency: Map<string, Lesson>
  events: number
  truncated: boolean
  badLines: number
}

interface LockOptions {
  timeoutMs: number
  staleMs: number
}

const LESSON_STATES: readonly LessonState[] = ['candidate', 'usable', 'disputed', 'stale', 'rejected']
const REVIEW_DECISIONS: readonly ReviewDecision[] = ['unreviewed', 'accepted', 'rejected']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/**
 * 判断锁是否过期可接管：
 * - 未超过 staleMs：一律视为占用（哪怕 pid 已退出）。
 * - 超过 staleMs：JSON 里的 pid 不存活（或内容不可验证所有者）→ 可接管；pid 存活 → 仍是占用。
 * 绝不无条件删锁。
 */
function lockIsStale(lockPath: string, staleMs: number): boolean {
  let mtimeMs: number
  try {
    mtimeMs = statSync(lockPath).mtimeMs
  } catch {
    return true
  }
  let at = mtimeMs
  let pid: number | undefined
  try {
    const parsed: unknown = JSON.parse(readFileSync(lockPath, 'utf8'))
    if (isRecord(parsed)) {
      const rawPid = parsed.pid
      if (typeof rawPid === 'number' && Number.isInteger(rawPid) && rawPid > 0) pid = rawPid
      const rawAt = parsed.at
      if (typeof rawAt === 'string') {
        const parsedAt = Date.parse(rawAt)
        if (!Number.isNaN(parsedAt)) at = parsedAt
      }
    }
  } catch {
    // 内容损坏：无法验证所有者，只能用文件 mtime 判断年龄
  }
  if (Date.now() - at <= staleMs) return false
  if (pid === undefined) return true
  return !isProcessAlive(pid)
}

/** 释放自己持有的锁：token 不匹配或内容不可读时不删，避免误删他人锁。 */
function releaseLock(lockPath: string, token: string): void {
  try {
    const parsed: unknown = JSON.parse(readFileSync(lockPath, 'utf8'))
    if (!isRecord(parsed) || parsed.token !== token) return
  } catch {
    return
  }
  try {
    unlinkSync(lockPath)
  } catch {
    // 已被他人清理或无权删除：保持现状
  }
}

/** 获取短期文件锁；失败抛 KnowledgeError('io')。 */
function acquireLock(lockPath: string, options: LockOptions): () => void {
  const token = randomUUID()
  const deadline = Date.now() + options.timeoutMs
  for (;;) {
    let acquired = false
    try {
      const fd = openSync(lockPath, 'wx')
      try {
        writeSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString(), token }))
      } finally {
        closeSync(fd)
      }
      acquired = true
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== 'EEXIST') throw new KnowledgeError('io', '获取知识库锁失败：' + errorMessage(error))
    }
    if (acquired) return () => releaseLock(lockPath, token)

    if (lockIsStale(lockPath, options.staleMs)) {
      try {
        unlinkSync(lockPath)
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        if (code !== 'ENOENT') {
          if (Date.now() >= deadline) {
            throw new KnowledgeError('io', '知识库锁已过期但无法接管：' + errorMessage(error))
          }
          sleepSync(25)
        }
      }
      continue
    }
    if (Date.now() >= deadline) throw new KnowledgeError('io', '知识库被其他进程占用，请稍后重试')
    sleepSync(25)
  }
}

/** 事件行形状检查（字段值再做 schema 校验）。 */
function isEventShape(value: unknown): value is KnowledgeEvent {
  if (!isRecord(value) || value.schemaVersion !== 1) return false
  if (typeof value.id !== 'string' || value.id === '') return false
  if (typeof value.at !== 'string' || value.at === '') return false
  if (typeof value.idempotencyKey !== 'string' || value.idempotencyKey === '') return false
  switch (value.kind) {
    case 'lesson.create':
      return typeof value.lessonId === 'string' && value.lessonId !== '' && value.payload !== undefined
    case 'lesson.update':
    case 'lesson.review':
      return (
        typeof value.lessonId === 'string' &&
        value.lessonId !== '' &&
        typeof value.revision === 'number' &&
        Number.isInteger(value.revision) &&
        value.payload !== undefined
      )
    case 'evidence.add':
      return value.payload !== undefined
    default:
      return false
  }
}

function emptyStateCounts(): Record<LessonState, number> {
  return { candidate: 0, usable: 0, disputed: 0, stale: 0, rejected: 0 }
}

/**
 * 经验知识存储。无文件时所有读取方法安全返回空，写入方法在首次写入时自建目录。
 */
export class KnowledgeStore {
  private readonly dir: string
  private readonly eventsPath: string
  private readonly evidencePath: string
  private readonly indexPath: string
  private readonly lockPath: string
  private readonly mask: boolean
  private readonly maxReplayEvents: number
  private readonly lockTimeoutMs: number
  private readonly lockStaleMs: number

  constructor(knowledgeDir: string, options: KnowledgeStoreOptions = {}) {
    if (typeof knowledgeDir !== 'string' || knowledgeDir.trim() === '') {
      throw new KnowledgeError('invalid', 'knowledgeDir 必须是非空字符串')
    }
    const maxReplay = typeof options.maxReplayEvents === 'number' && Number.isFinite(options.maxReplayEvents)
      ? Math.max(1, Math.floor(options.maxReplayEvents))
      : MAX_REPLAY_EVENTS
    this.dir = knowledgeDir
    this.eventsPath = join(knowledgeDir, 'events.jsonl')
    this.evidencePath = join(knowledgeDir, 'evidence.jsonl')
    this.indexPath = join(knowledgeDir, 'index.json')
    this.lockPath = join(knowledgeDir, '.lock')
    this.mask = options.maskSecrets !== false
    this.maxReplayEvents = maxReplay
    this.lockTimeoutMs = typeof options.lockTimeoutMs === 'number' && options.lockTimeoutMs >= 0 ? options.lockTimeoutMs : 2000
    this.lockStaleMs = typeof options.lockStaleMs === 'number' && options.lockStaleMs >= 0 ? options.lockStaleMs : 30000
  }

  /** 全部经验，按 updatedAt 降序（同刻按 id 稳定排序）。 */
  listLessons(): Lesson[] {
    const state = this.loadEvents()
    return Array.from(state.lessons.values())
      .map((lesson) => clone(lesson))
      .sort((a, b) => (a.updatedAt === b.updatedAt ? a.id.localeCompare(b.id) : b.updatedAt.localeCompare(a.updatedAt)))
  }

  /** 全部证据，按 observedAt 升序（同刻按 id 稳定排序）。 */
  listEvidence(): Evidence[] {
    const state = this.loadAll()
    return Array.from(state.evidence.values())
      .map((item) => clone(item))
      .sort((a, b) => (a.observedAt === b.observedAt ? a.id.localeCompare(b.id) : a.observedAt.localeCompare(b.observedAt)))
  }

  /** 按 id 取经验；不存在返回 undefined。 */
  getLesson(id: string): Lesson | undefined {
    const state = this.loadEvents()
    const lesson = state.lessons.get(id)
    return lesson === undefined ? undefined : clone(lesson)
  }

  /** 追加证据；同 sessionId+recordSeq 或同 sourceHash 视为重复，返回已有记录且不写。 */
  appendEvidence(input: EvidenceInput): { evidence: Evidence; created: boolean } {
    if (!isRecord(input)) throw new KnowledgeError('invalid', '证据输入必须是对象')
    return this.withLock(() => {
      const state = this.loadAll()
      const existing = this.findEvidenceByNaturalKey(state, input)
      if (existing !== undefined) return { evidence: clone(existing), created: false }
      const created = this.persistEvidenceLocked(input, state)
      return { evidence: clone(created), created: true }
    })
  }

  /**
   * 创建候选经验。同 idempotencyKey 幂等；同指纹（文本 + 范围相同）确定性合并，
   * 只把新证据并入已有经验，不新增经验。
   */
  createLesson(input: LessonInput, idempotencyKey: string): { lesson: Lesson; created: boolean } {
    assertIdempotencyKey(idempotencyKey)
    if (!isRecord(input)) throw new KnowledgeError('invalid', '经验输入必须是对象')
    if (!Array.isArray(input.evidence)) throw new KnowledgeError('invalid', 'evidence 必须是数组')
    return this.withLock(() => {
      const state = this.loadAll()
      const cached = state.idempotency.get(idempotencyKey)
      if (cached !== undefined) return { lesson: clone(cached), created: false }

      const scope: Lesson['scope'] = {
        global: input.global === true,
      }
      if (typeof input.projectId === 'string' && input.projectId.trim() !== '') scope.projectId = input.projectId
      if (typeof input.workspaceRoot === 'string' && input.workspaceRoot.trim() !== '') scope.workspaceRoot = input.workspaceRoot

      const now = new Date().toISOString()
      validateLesson({
        schemaVersion: 1,
        id: 'lsn_probe',
        revision: 1,
        kind: input.kind,
        title: input.title,
        action: input.action,
        when: input.when,
        exceptions: input.exceptions === undefined ? [] : input.exceptions,
        scope,
        applicability: input.applicability === undefined ? [] : input.applicability,
        state: 'candidate',
        evidenceIds: [],
        independentSupportCount: 0,
        review: { decision: 'unreviewed' },
        createdAt: now,
        updatedAt: now,
        conflictIds: input.conflictIds === undefined ? [] : input.conflictIds,
      })

      const fingerprint = lessonFingerprint({
        kind: input.kind as Lesson['kind'],
        title: typeof input.title === 'string' ? input.title : undefined,
        action: typeof input.action === 'string' ? input.action : '',
        when: typeof input.when === 'string' ? input.when : '',
        scope,
      })
      const existing = Array.from(state.lessons.values()).find((lesson) => lessonFingerprint(lesson) === fingerprint)

      const appended: Evidence[] = []
      for (const raw of input.evidence) appended.push(this.persistEvidenceLocked(raw, state))

      if (existing !== undefined) {
        const newIds = appended.map((item) => item.id).filter((id) => !existing.evidenceIds.includes(id))
        let merged = existing
        if (newIds.length > 0) {
          const mergedIds = existing.evidenceIds.concat(newIds)
          merged = this.appendLessonUpdate(
            state,
            existing,
            {
              evidenceIds: mergedIds,
              independentSupportCount: mergeEvidenceSupport({ evidenceIds: mergedIds }, Array.from(state.evidence.values())),
            },
            idempotencyKey,
          )
        }
        return { lesson: clone(merged), created: false }
      }

      const evidenceIds = appended.map((item) => item.id)
      const lesson = validateLesson({
        schemaVersion: 1,
        id: 'lsn_' + randomUUID(),
        revision: 1,
        kind: input.kind,
        title: input.title,
        action: input.action,
        when: input.when,
        exceptions: input.exceptions === undefined ? [] : input.exceptions,
        scope,
        applicability: input.applicability === undefined ? [] : input.applicability,
        state: 'candidate',
        evidenceIds,
        independentSupportCount: mergeEvidenceSupport({ evidenceIds }, Array.from(state.evidence.values())),
        review: { decision: 'unreviewed' },
        createdAt: now,
        updatedAt: now,
        conflictIds: input.conflictIds === undefined ? [] : input.conflictIds,
      })
      const stored = this.maskLesson(lesson)
      this.appendEvent({
        schemaVersion: 1,
        id: 'evt_' + randomUUID(),
        at: now,
        kind: 'lesson.create',
        lessonId: stored.id,
        idempotencyKey,
        payload: stored,
      })
      state.lessons.set(stored.id, stored)
      if (!state.idempotency.has(idempotencyKey)) state.idempotency.set(idempotencyKey, stored)
      this.writeIndex(state)
      return { lesson: clone(stored), created: true }
    })
  }

  /** 按 patch 更新经验；revision 不符抛 KnowledgeError('revision') 且不写。 */
  updateLesson(id: string, patch: Partial<Lesson>, expectedRevision: number, idempotencyKey: string): Lesson {
    assertIdempotencyKey(idempotencyKey)
    if (!isRecord(patch)) throw new KnowledgeError('invalid', 'patch 必须是对象')
    return this.withLock(() => {
      const state = this.loadAll()
      const cached = state.idempotency.get(idempotencyKey)
      if (cached !== undefined) return clone(cached)
      const lesson = state.lessons.get(id)
      if (lesson === undefined) throw new KnowledgeError('invalid', '经验不存在：' + id)
      if (lesson.revision !== expectedRevision) {
        throw new KnowledgeError('revision', '经验 ' + id + ' 期望 revision ' + expectedRevision + '，实际 ' + lesson.revision)
      }
      const clean: Partial<Lesson> = {}
      for (const key of Object.keys(patch)) {
        if (key === 'id' || key === 'schemaVersion' || key === 'revision' || key === 'createdAt' || key === 'updatedAt') continue
        const value = (patch as Record<string, unknown>)[key]
        if (value === undefined) continue
        ;(clean as Record<string, unknown>)[key] = value
      }
      if (clean.state !== undefined && clean.state !== lesson.state && !canTransition(lesson.state, clean.state)) {
        throw new KnowledgeError('invalid', '不允许的状态迁移：' + lesson.state + ' → ' + clean.state)
      }
      if (clean.evidenceIds !== undefined) {
        if (!Array.isArray(clean.evidenceIds)) throw new KnowledgeError('invalid', 'evidenceIds 必须是数组')
        clean.independentSupportCount = mergeEvidenceSupport(
          { evidenceIds: clean.evidenceIds },
          Array.from(state.evidence.values()),
        )
      }
      return clone(this.appendLessonUpdate(state, lesson, clean, idempotencyKey))
    })
  }

  /** 审阅经验：accepted → usable，rejected → rejected，unreviewed → candidate。 */
  reviewLesson(
    id: string,
    decision: ReviewDecision,
    expectedRevision: number,
    idempotencyKey: string,
    actor?: string,
  ): Lesson {
    assertIdempotencyKey(idempotencyKey)
    if (!isEnum(decision, REVIEW_DECISIONS)) throw new KnowledgeError('invalid', 'review decision 取值不合法')
    const maskedActor = actor === undefined ? undefined : this.mask ? maskSecrets(actor) : actor
    return this.withLock(() => {
      const state = this.loadEvents()
      const cached = state.idempotency.get(idempotencyKey)
      if (cached !== undefined) return clone(cached)
      const lesson = state.lessons.get(id)
      if (lesson === undefined) throw new KnowledgeError('invalid', '经验不存在：' + id)
      if (lesson.revision !== expectedRevision) {
        throw new KnowledgeError('revision', '经验 ' + id + ' 期望 revision ' + expectedRevision + '，实际 ' + lesson.revision)
      }
      const nextState: LessonState = decision === 'accepted' ? 'usable' : decision === 'rejected' ? 'rejected' : 'candidate'
      if (nextState !== lesson.state && !canTransition(lesson.state, nextState)) {
        throw new KnowledgeError('invalid', '不允许的审阅迁移：' + lesson.state + ' → ' + nextState)
      }
      const now = new Date().toISOString()
      const merged = validateLesson({
        ...lesson,
        state: nextState,
        review: maskedActor === undefined
          ? { decision, at: now }
          : { decision, actor: maskedActor, at: now },
        revision: lesson.revision + 1,
        updatedAt: now,
      })
      const payload: { decision: ReviewDecision; actor?: string; state: LessonState } = { decision, state: nextState }
      if (maskedActor !== undefined) payload.actor = maskedActor
      this.appendEvent({
        schemaVersion: 1,
        id: 'evt_' + randomUUID(),
        at: now,
        kind: 'lesson.review',
        lessonId: lesson.id,
        revision: merged.revision,
        idempotencyKey,
        payload,
      })
      state.lessons.set(merged.id, merged)
      if (!state.idempotency.has(idempotencyKey)) state.idempotency.set(idempotencyKey, merged)
      this.writeIndex(state)
      return clone(merged)
    })
  }

  /** 状态迁移；不允许的迁移抛 KnowledgeError('invalid') 且不写。 */
  applyTransition(id: string, to: LessonState, expectedRevision: number, idempotencyKey: string): Lesson {
    assertIdempotencyKey(idempotencyKey)
    if (!isEnum(to, LESSON_STATES)) throw new KnowledgeError('invalid', '目标状态取值不合法')
    return this.withLock(() => {
      const state = this.loadEvents()
      const cached = state.idempotency.get(idempotencyKey)
      if (cached !== undefined) return clone(cached)
      const lesson = state.lessons.get(id)
      if (lesson === undefined) throw new KnowledgeError('invalid', '经验不存在：' + id)
      if (lesson.revision !== expectedRevision) {
        throw new KnowledgeError('revision', '经验 ' + id + ' 期望 revision ' + expectedRevision + '，实际 ' + lesson.revision)
      }
      if (!canTransition(lesson.state, to)) {
        throw new KnowledgeError('invalid', '不允许的状态迁移：' + lesson.state + ' → ' + to)
      }
      return clone(this.appendLessonUpdate(state, lesson, { state: to }, idempotencyKey))
    })
  }

  /** 从事件重建派生索引；不删除、不改写 events.jsonl / evidence.jsonl。 */
  rebuildIndex(): void {
    this.withLock(() => {
      const state = this.loadAll()
      this.writeIndexStrict(state)
    })
  }

  /** 统计。truncated=true 表示回放被 MAX_REPLAY_EVENTS 截断（不静默）。 */
  stats(): {
    lessons: number
    evidence: number
    events: number
    byState: Record<LessonState, number>
    truncated: boolean
    badLines: number
  } {
    const state = this.loadAll()
    const byState = emptyStateCounts()
    for (const lesson of state.lessons.values()) byState[lesson.state]++
    return {
      lessons: state.lessons.size,
      evidence: state.evidence.size,
      events: state.events,
      byState,
      truncated: state.truncated,
      badLines: state.badLines,
    }
  }

  // ---------- 内部实现 ----------

  private ensureDir(): void {
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true })
  }

  private withLock<T>(operation: () => T): T {
    this.ensureDir()
    const release = acquireLock(this.lockPath, { timeoutMs: this.lockTimeoutMs, staleMs: this.lockStaleMs })
    try {
      return operation()
    } finally {
      release()
    }
  }

  /** 有界读取 JSONL：只保留最后 maxReplayEvents 条非空行，并报告总行数与截断。 */
  private readBoundedLines(file: string): { lines: string[]; total: number; truncated: boolean } {
    if (!existsSync(file)) return { lines: [], total: 0, truncated: false }
    const max = this.maxReplayEvents
    const fd = openSync(file, 'r')
    try {
      const decoder = new StringDecoder('utf8')
      const buffer = Buffer.allocUnsafe(64 * 1024)
      const ring: string[] = []
      let ringStart = 0
      let total = 0
      let carry = ''
      const push = (line: string): void => {
        total++
        if (ring.length < max) {
          ring.push(line)
        } else {
          ring[ringStart] = line
          ringStart = (ringStart + 1) % max
        }
      }
      for (;;) {
        const read = readSync(fd, buffer, 0, buffer.length, null)
        if (read <= 0) break
        carry += decoder.write(buffer.subarray(0, read))
        let index = carry.indexOf('\n')
        while (index >= 0) {
          let line = carry.slice(0, index)
          carry = carry.slice(index + 1)
          if (line.endsWith('\r')) line = line.slice(0, -1)
          if (line.trim() !== '') push(line)
          index = carry.indexOf('\n')
        }
      }
      carry += decoder.end()
      if (carry.trim() !== '') push(carry.endsWith('\r') ? carry.slice(0, -1) : carry)
      const lines = ringStart === 0 ? ring : ring.slice(ringStart).concat(ring.slice(0, ringStart))
      return { lines, total, truncated: total > max }
    } finally {
      closeSync(fd)
    }
  }

  /** 只回放事件流。 */
  private loadEvents(): ReplayState {
    const bounded = this.readBoundedLines(this.eventsPath)
    const state: ReplayState = {
      lessons: new Map(),
      evidence: new Map(),
      idempotency: new Map(),
      events: bounded.total,
      truncated: bounded.truncated,
      badLines: 0,
    }
    for (const line of bounded.lines) this.applyEventLine(state, line)
    return state
  }

  /** 事件流 + evidence.jsonl（两条路径都留痕，按 id 合并去重）。 */
  private loadAll(): ReplayState {
    const state = this.loadEvents()
    const bounded = this.readBoundedLines(this.evidencePath)
    state.truncated = state.truncated || bounded.truncated
    for (const line of bounded.lines) {
      let raw: unknown
      try {
        raw = JSON.parse(line)
      } catch {
        state.badLines++
        continue
      }
      try {
        const evidence = validateEvidence(raw)
        if (!state.evidence.has(evidence.id)) state.evidence.set(evidence.id, evidence)
      } catch {
        state.badLines++
      }
    }
    return state
  }

  private applyEventLine(state: ReplayState, line: string): void {
    let raw: unknown
    try {
      raw = JSON.parse(line)
    } catch {
      state.badLines++
      return
    }
    if (!isEventShape(raw)) {
      state.badLines++
      return
    }
    const event = raw
    try {
      switch (event.kind) {
        case 'lesson.create': {
          const lesson = validateLesson(event.payload)
          const stored = { ...lesson, id: event.lessonId }
          state.lessons.set(stored.id, stored)
          if (!state.idempotency.has(event.idempotencyKey)) state.idempotency.set(event.idempotencyKey, stored)
          return
        }
        case 'lesson.update': {
          const previous = state.lessons.get(event.lessonId)
          if (previous === undefined || event.revision <= previous.revision) {
            state.badLines++
            return
          }
          const merged = validateLesson({
            ...previous,
            ...event.payload,
            id: previous.id,
            revision: event.revision,
            updatedAt: event.at,
          })
          if (merged.state !== previous.state && !canTransition(previous.state, merged.state)) {
            state.badLines++
            return
          }
          state.lessons.set(merged.id, merged)
          if (!state.idempotency.has(event.idempotencyKey)) state.idempotency.set(event.idempotencyKey, merged)
          return
        }
        case 'lesson.review': {
          const previous = state.lessons.get(event.lessonId)
          if (previous === undefined || event.revision <= previous.revision) {
            state.badLines++
            return
          }
          const review = event.payload.actor === undefined
            ? { decision: event.payload.decision, at: event.at }
            : { decision: event.payload.decision, actor: event.payload.actor, at: event.at }
          const merged = validateLesson({
            ...previous,
            review,
            state: event.payload.state,
            id: previous.id,
            revision: event.revision,
            updatedAt: event.at,
          })
          if (merged.state !== previous.state && !canTransition(previous.state, merged.state)) {
            state.badLines++
            return
          }
          state.lessons.set(merged.id, merged)
          if (!state.idempotency.has(event.idempotencyKey)) state.idempotency.set(event.idempotencyKey, merged)
          return
        }
        case 'evidence.add': {
          const evidence = validateEvidence(event.payload)
          state.evidence.set(evidence.id, evidence)
          return
        }
        default:
          state.badLines++
      }
    } catch {
      state.badLines++
    }
  }

  private appendEvent(event: KnowledgeEvent): void {
    this.appendLine(this.eventsPath, event)
  }

  private appendLine(file: string, value: unknown): void {
    this.ensureDir()
    try {
      appendFileSync(file, JSON.stringify(value) + '\n', 'utf8')
    } catch (error) {
      throw new KnowledgeError('io', '写入 ' + file + ' 失败：' + errorMessage(error))
    }
  }

  private findEvidenceByNaturalKey(state: ReplayState, input: EvidenceInput): Evidence | undefined {
    const sessionKey = evidenceSessionKey(input)
    const hash = typeof input.sourceHash === 'string' && input.sourceHash !== '' ? input.sourceHash : undefined
    if (sessionKey === undefined && hash === undefined) return undefined
    for (const item of state.evidence.values()) {
      if (sessionKey !== undefined && evidenceSessionKey(item) === sessionKey) return item
      if (hash !== undefined && item.sourceHash === hash) return item
    }
    return undefined
  }

  /** 在锁内追加/复用一条证据；同天然身份键返回已有记录且不写。 */
  private persistEvidenceLocked(input: EvidenceInput, state: ReplayState): Evidence {
    if (!isRecord(input)) throw new KnowledgeError('invalid', '证据输入必须是对象')
    const existing = this.findEvidenceByNaturalKey(state, input)
    if (existing !== undefined) return existing
    const now = new Date().toISOString()
    const raw: Evidence = {
      schemaVersion: 1,
      id: 'evd_' + randomUUID(),
      kind: input.kind,
      observedAt: typeof input.observedAt === 'string' ? input.observedAt : now,
      summary: input.summary,
      verification: input.verification,
    }
    if (input.sessionId !== undefined) raw.sessionId = input.sessionId
    if (input.recordSeq !== undefined) raw.recordSeq = input.recordSeq
    if (input.projectId !== undefined) raw.projectId = input.projectId
    if (input.sourceHash !== undefined) raw.sourceHash = input.sourceHash
    const evidence = this.maskEvidence(validateEvidence(raw))
    const natural = evidenceNaturalKey(evidence)
    this.appendLine(this.evidencePath, evidence)
    this.appendEvent({
      schemaVersion: 1,
      id: 'evt_' + randomUUID(),
      at: now,
      kind: 'evidence.add',
      idempotencyKey: 'evidence:' + (natural === undefined ? evidence.id : natural),
      payload: evidence,
    })
    state.evidence.set(evidence.id, evidence)
    return evidence
  }

  /** 在锁内追加 lesson.update 并同步内存与索引。 */
  private appendLessonUpdate(
    state: ReplayState,
    previous: Lesson,
    patch: Partial<Lesson>,
    idempotencyKey: string,
  ): Lesson {
    if (patch.state !== undefined && patch.state !== previous.state && !canTransition(previous.state, patch.state)) {
      throw new KnowledgeError('invalid', '不允许的状态迁移：' + previous.state + ' → ' + patch.state)
    }
    const now = new Date().toISOString()
    const merged = this.maskLesson(validateLesson({
      ...previous,
      ...patch,
      id: previous.id,
      schemaVersion: 1,
      revision: previous.revision + 1,
      updatedAt: now,
    }))
    const payload: Partial<Lesson> = {}
    for (const key of Object.keys(patch)) {
      if (key === 'id' || key === 'schemaVersion' || key === 'revision' || key === 'createdAt' || key === 'updatedAt') continue
      ;(payload as Record<string, unknown>)[key] = (merged as unknown as Record<string, unknown>)[key]
    }
    this.appendEvent({
      schemaVersion: 1,
      id: 'evt_' + randomUUID(),
      at: now,
      kind: 'lesson.update',
      lessonId: merged.id,
      revision: merged.revision,
      idempotencyKey,
      payload,
    })
    state.lessons.set(merged.id, merged)
    if (!state.idempotency.has(idempotencyKey)) state.idempotency.set(idempotencyKey, merged)
    this.writeIndex(state)
    return merged
  }

  private maskLesson(lesson: Lesson): Lesson {
    if (!this.mask) return lesson
    return {
      ...lesson,
      title: maskSecrets(lesson.title),
      action: maskSecrets(lesson.action),
      when: maskSecrets(lesson.when),
      exceptions: lesson.exceptions.map((item) => maskSecrets(item)),
    }
  }

  private maskEvidence(evidence: Evidence): Evidence {
    if (!this.mask) return evidence
    return { ...evidence, summary: maskSecrets(evidence.summary) }
  }

  private buildIndexPayload(state: ReplayState): Record<string, unknown> {
    const lessons: Record<string, Lesson> = {}
    const stateCounts = emptyStateCounts()
    for (const lesson of state.lessons.values()) {
      lessons[lesson.id] = lesson
      stateCounts[lesson.state]++
    }
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      lessons,
      stateCounts,
      byState: stateCounts,
    }
  }

  /** 自动更新派生索引：失败降级（权威事件已落盘），不推翻调用结果。 */
  private writeIndex(state: ReplayState): void {
    try {
      this.writeIndexStrict(state)
    } catch {
      // index.json 只是派生加速层，丢失可 rebuildIndex() 重建。
    }
  }

  private writeIndexStrict(state: ReplayState): void {
    this.ensureDir()
    const target = this.indexPath
    const tmp = target + '.tmp-' + process.pid + '-' + randomUUID()
    try {
      writeFileSync(tmp, JSON.stringify(this.buildIndexPayload(state), null, 2) + '\n', 'utf8')
      renameSync(tmp, target)
    } catch (error) {
      try {
        rmSync(tmp, { force: true })
      } catch {
        // 清理临时文件失败不覆盖原始 io 错误
      }
      throw new KnowledgeError('io', '写入 index.json 失败：' + errorMessage(error))
    }
  }
}

function assertIdempotencyKey(idempotencyKey: string): void {
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
    throw new KnowledgeError('invalid', 'idempotencyKey 必须是非空字符串')
  }
}
