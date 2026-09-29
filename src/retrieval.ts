/**
 * 任务相关经验检索（FREEZE §3）。
 *
 * 顺序：范围过滤 → 排除 rejected/stale/disputed → 确定性排序 → 字符预算。
 * 条件（when）与例外（exceptions）不可截断：整条放不下时跳过并记 skipped.budget，
 * 绝不返回半条经验。
 *
 * @module dsh-dream/retrieval
 */
import type { Evidence, Lesson, LessonState } from './knowledge.js'
import { normalizeLessonText } from './knowledge.js'

/** 检索入参；limit/maxChars 在内部按硬上限裁剪。 */
export interface RetrievalQuery {
  query: string
  projectId?: string
  workspaceRoot?: string
  /** 默认 5，硬上限 20。 */
  limit?: number
  /** 默认 3000，硬上限 20000。 */
  maxChars?: number
  /** 当前任务相关依赖的版本，用于匹配 applicability.versions。 */
  packageVersion?: string
}

/** 检索结果中的单条经验（已完整保留 when/exceptions）。 */
export interface RetrievedLesson {
  lessonId: string
  title: string
  when: string
  action: string
  exceptions: string[]
  state: LessonState
  scopeLabel: string
  whyRelevant: string
  evidenceSummary: string
  lastValidatedAt?: string
  truncated: boolean
}

/** 默认条数。 */
export const DEFAULT_RETRIEVAL_LIMIT = 5
/** 条数硬上限。 */
export const MAX_RETRIEVAL_LIMIT = 20
/** 默认字符预算。 */
export const DEFAULT_RETRIEVAL_MAX_CHARS = 3000
/** 字符预算硬上限。 */
export const MAX_RETRIEVAL_MAX_CHARS = 20000

const EXCLUDED_STATE_REASONS: Record<string, string> = {
  rejected: 'state:rejected',
  stale: 'state:stale',
  disputed: 'state:disputed',
}

interface ApplicabilityMatch {
  packages: string[]
  versions: string[]
  platforms: string[]
}

interface Candidate {
  lesson: Lesson
  keywordHits: string[]
  applicability: ApplicabilityMatch
}

function trimmed(value: string | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function normalizeText(value: string): string {
  return normalizeLessonText(value).toLowerCase()
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) + '…' : value
}

function pathKey(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/\/+$/, '')
}

function samePath(a: string, b: string): boolean {
  const ka = pathKey(a)
  const kb = pathKey(b)
  if (ka === '' || kb === '') return false
  const windowsLike = /^[a-zA-Z]:/.test(ka) || /^[a-zA-Z]:/.test(kb) || a.includes('\\') || b.includes('\\')
  return windowsLike ? ka.toLowerCase() === kb.toLowerCase() : ka === kb
}

/** 查询侧范围文案（面板与 dream_context 共用）。 */
export function queryScopeLabel(q: Pick<RetrievalQuery, 'projectId' | 'workspaceRoot'>): string {
  const project = trimmed(q.projectId)
  const workspace = trimmed(q.workspaceRoot)
  if (project !== undefined && workspace !== undefined) return '项目 ' + project + '（工作区 ' + workspace + '）'
  if (project !== undefined) return '项目 ' + project
  if (workspace !== undefined) return '工作区 ' + workspace
  return '全局'
}

/** 经验范围文案（面板与 dream_context 共用）。 */
export function lessonScopeLabel(scope: Lesson['scope']): string {
  const project = trimmed(scope.projectId)
  const workspace = trimmed(scope.workspaceRoot)
  if (project !== undefined && workspace !== undefined) return '项目 ' + project + '（工作区 ' + workspace + '）'
  if (project !== undefined) return '项目 ' + project
  if (workspace !== undefined) return '工作区 ' + workspace
  if (scope.global === true) return '全局'
  return '未限定范围'
}

/** 证据摘要（面板与 dream_context 共用）：独立支持数 + 已读/仅声明 + 脱敏摘要片段。 */
export function buildEvidenceSummary(lesson: Lesson, evidence: Evidence[]): string {
  const byId = new Map<string, Evidence>()
  for (const item of evidence) {
    if (item !== null && typeof item === 'object' && typeof item.id === 'string') byId.set(item.id, item)
  }
  const linked: Evidence[] = []
  for (const id of lesson.evidenceIds) {
    const found = byId.get(id)
    if (found !== undefined) linked.push(found)
  }
  if (linked.length === 0) {
    if (lesson.evidenceIds.length > 0) return '证据暂不可核对（' + lesson.evidenceIds.length + ' 条引用缺失）'
    return '无证据（仅候选，不可作为已证实结论）'
  }
  const read = linked.filter((e) => e.verification === 'read').length
  const claimed = linked.filter((e) => e.verification === 'claimed').length
  const head = '独立证据 ' + lesson.independentSupportCount + ' 条（已读 ' + read + ' / 仅声明 ' + claimed + '）'
  const snippets = linked
    .slice(0, 2)
    .map((e) => clip(oneLine(String(e.summary ?? '')), 80))
    .filter((s) => s !== '')
  if (snippets.length === 0) return head
  return head + '：' + snippets.join('；') + (linked.length > 2 ? ' 等' : '')
}

/** 单条结果的字符成本（与 dream_context.budget.usedChars 同口径）。 */
export function retrievedLessonChars(item: RetrievedLesson): number {
  let total = item.title.length + item.when.length + item.action.length
    + item.scopeLabel.length + item.whyRelevant.length + item.evidenceSummary.length
  for (const exception of item.exceptions) total += exception.length
  return total
}

/** 解析 limit/maxChars，套用默认值与硬上限。 */
export function resolveRetrievalBudget(q: Pick<RetrievalQuery, 'limit' | 'maxChars'>): { limit: number; maxChars: number } {
  const rawLimit = q.limit
  const rawMax = q.maxChars
  const limit = typeof rawLimit === 'number' && Number.isInteger(rawLimit) && rawLimit > 0
    ? Math.min(MAX_RETRIEVAL_LIMIT, rawLimit)
    : DEFAULT_RETRIEVAL_LIMIT
  const maxChars = typeof rawMax === 'number' && Number.isInteger(rawMax) && rawMax > 0
    ? Math.min(MAX_RETRIEVAL_MAX_CHARS, rawMax)
    : DEFAULT_RETRIEVAL_MAX_CHARS
  return { limit, maxChars }
}

function parseVersion(text: string): readonly [number, number, number] | null {
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(text.trim())
  if (match === null) return null
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)] as const
}

function compareVersion(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1
  }
  return 0
}

interface StarBase {
  base: readonly [number, number, number]
  wildcard: 1 | 2 | 3
}

function parseStarBase(text: string): StarBase | null {
  const match = /^v?(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?$/.exec(text.trim())
  if (match === null) return null
  const parts = [match[1], match[2], match[3]]
  const numbers: number[] = []
  let wildcard: 1 | 2 | 3 = 3
  for (let i = 0; i < 3; i += 1) {
    const part = parts[i]
    if (part === undefined || part === 'x' || part === 'X' || part === '*') {
      if (wildcard === 3) wildcard = i === 0 ? 1 : (i as 2)
      numbers.push(0)
      continue
    }
    if (wildcard !== 3) return null
    numbers.push(Number(part))
  }
  return { base: [numbers[0], numbers[1], numbers[2]] as const, wildcard }
}

function satisfiesClause(version: readonly [number, number, number], clauseText: string): boolean {
  const clause = clauseText.trim()
  if (clause === '') return false
  const lowered = clause.toLowerCase()
  if (lowered === '*' || lowered === 'x' || lowered === 'any' || lowered === 'latest') return true
  const operatorMatch = /^(>=|<=|>|<|=|\^|~)/.exec(clause)
  const operator = operatorMatch === null ? '=' : operatorMatch[1]
  const rest = operatorMatch === null ? clause : clause.slice(operatorMatch[1].length).trim()
  if (rest === '') return false
  const star = parseStarBase(rest)
  const base = star === null ? parseVersion(rest) : star.base
  if (base === null) return false
  const wildcard = star === null ? 3 : star.wildcard
  const cmp = compareVersion(version, base)
  switch (operator) {
    case '>=': return cmp >= 0
    case '<=': return cmp <= 0
    case '>': return cmp > 0
    case '<': return cmp < 0
    case '^': {
      if (cmp < 0) return false
      const upper: readonly [number, number, number] = base[0] > 0
        ? [base[0] + 1, 0, 0]
        : base[1] > 0 ? [0, base[1] + 1, 0] : [0, 0, base[2] + 1]
      return compareVersion(version, upper) < 0
    }
    case '~': {
      if (cmp < 0) return false
      return compareVersion(version, [base[0], base[1] + 1, 0]) < 0
    }
    default: {
      if (wildcard >= 3) return cmp === 0
      if (wildcard === 2) return version[0] === base[0] && version[1] === base[1]
      return version[0] === base[0]
    }
  }
}

/** 简单 semver 条件匹配：支持 = / > / >= / < / <= / ^ / ~、逗号或空格 AND、|| OR、x/* 通配。 */
export function versionSatisfies(versionText: string, rangeText: string): boolean {
  const version = parseVersion(versionText)
  if (version === null) return false
  if (rangeText.trim() === '') return false
  return rangeText.split('||').some((part) => {
    const clauses = part.split(/[\s,]+/).filter((c) => c !== '')
    if (clauses.length === 0) return false
    return clauses.every((clause) => satisfiesClause(version, clause))
  })
}

function matchApplicability(lesson: Lesson, q: RetrievalQuery, queryText: string): ApplicabilityMatch {
  const out: ApplicabilityMatch = { packages: [], versions: [], platforms: [] }
  const packageVersion = trimmed(q.packageVersion)
  for (const entry of lesson.applicability) {
    const pkg = trimmed(entry.package)
    if (pkg !== undefined && queryText.includes(normalizeText(pkg)) && !out.packages.includes(pkg)) out.packages.push(pkg)
    const versions = trimmed(entry.versions)
    if (packageVersion !== undefined && versions !== undefined && versionSatisfies(packageVersion, versions) && !out.versions.includes(versions)) {
      out.versions.push(versions)
    }
    const platform = trimmed(entry.platform)
    if (platform !== undefined && queryText.includes(normalizeText(platform)) && !out.platforms.includes(platform)) out.platforms.push(platform)
  }
  return out
}

function queryTerms(query: string): string[] {
  const normalized = normalizeText(query)
  const terms = new Set<string>()
  const rawTokens = normalized.split(/[^\p{L}\p{N}+#._-]+/u)
  for (const token of rawTokens) {
    if (token === '') continue
    if (token.length >= 2) terms.add(token)
    const cjkRuns = token.match(/\p{Script=Han}+/gu)
    if (cjkRuns === null) continue
    for (const run of cjkRuns) {
      if (run.length === 1) terms.add(run)
      for (let i = 0; i + 1 < run.length; i += 1) terms.add(run.slice(i, i + 2))
      for (let i = 0; i + 2 < run.length; i += 1) terms.add(run.slice(i, i + 3))
    }
  }
  return [...terms]
}

function keywordHits(lesson: Lesson, terms: string[]): string[] {
  if (terms.length === 0) return []
  const fields = [normalizeText(lesson.title), normalizeText(lesson.action), normalizeText(lesson.when)]
  const hits: string[] = []
  for (const term of terms) {
    if (fields.some((field) => field.includes(term))) hits.push(term)
  }
  return hits
}

function scopeMatches(lesson: Lesson, q: RetrievalQuery): boolean {
  if (lesson.scope.global === true) return true
  const queryProject = trimmed(q.projectId)
  const queryWorkspace = trimmed(q.workspaceRoot)
  const lessonProject = trimmed(lesson.scope.projectId)
  const lessonWorkspace = trimmed(lesson.scope.workspaceRoot)
  if (queryProject !== undefined && lessonProject === queryProject) return true
  if (queryWorkspace !== undefined && lessonWorkspace !== undefined && samePath(lessonWorkspace, queryWorkspace)) return true
  return false
}

function buildWhyRelevant(entry: Candidate, q: RetrievalQuery): string {
  const lesson = entry.lesson
  const parts: string[] = []
  if (entry.keywordHits.length > 0) {
    const shown = entry.keywordHits.slice(0, 3).map((term) => '「' + term + '」').join('、')
    parts.push('命中关键词' + shown + (entry.keywordHits.length > 3 ? ' 等' : ''))
  }
  if (entry.applicability.packages.length > 0) {
    parts.push('适用包「' + entry.applicability.packages.slice(0, 2).join('、') + '」')
  }
  if (entry.applicability.versions.length > 0) {
    const current = trimmed(q.packageVersion)
    parts.push('适用版本「' + entry.applicability.versions.slice(0, 2).join('、') + '」' + (current !== undefined ? '（当前 ' + current + '）' : ''))
  }
  if (entry.applicability.platforms.length > 0) {
    parts.push('适用平台「' + entry.applicability.platforms.slice(0, 2).join('、') + '」')
  }
  const queryProject = trimmed(q.projectId)
  const queryWorkspace = trimmed(q.workspaceRoot)
  const lessonProject = trimmed(lesson.scope.projectId)
  const lessonWorkspace = trimmed(lesson.scope.workspaceRoot)
  if (lesson.scope.global === true && lessonProject === undefined && lessonWorkspace === undefined) {
    parts.push('全局经验')
  } else if (queryProject !== undefined && lessonProject === queryProject) {
    parts.push('项目匹配（' + lessonProject + '）')
  } else if (queryWorkspace !== undefined && lessonWorkspace !== undefined && samePath(lessonWorkspace, queryWorkspace)) {
    parts.push('工作区匹配（' + lessonWorkspace + '）')
  } else if (lesson.scope.global === true) {
    parts.push('全局经验')
  }
  if (parts.length === 0) parts.push('范围匹配（' + lessonScopeLabel(lesson.scope) + '）')
  return parts.join('；')
}

function toRetrievedLesson(entry: Candidate, evidence: Evidence[], q: RetrievalQuery): RetrievedLesson {
  const lesson = entry.lesson
  const item: RetrievedLesson = {
    lessonId: lesson.id,
    title: lesson.title,
    when: lesson.when,
    action: lesson.action,
    exceptions: [...lesson.exceptions],
    state: lesson.state,
    scopeLabel: lessonScopeLabel(lesson.scope),
    whyRelevant: buildWhyRelevant(entry, q),
    evidenceSummary: buildEvidenceSummary(lesson, evidence),
    truncated: false,
  }
  if (lesson.lastValidatedAt !== undefined) item.lastValidatedAt = lesson.lastValidatedAt
  return item
}

function validatedAtValue(lesson: Lesson): number {
  if (lesson.lastValidatedAt === undefined) return 0
  const parsed = Date.parse(lesson.lastValidatedAt)
  return Number.isFinite(parsed) ? parsed : 0
}

function stateRank(state: LessonState): number {
  if (state === 'usable') return 2
  if (state === 'candidate') return 1
  return 0
}

/**
 * 任务相关经验检索。只返回 global 或与查询项目/工作区精确匹配的记录；
 * 未知项目（未给 projectId/workspaceRoot）时只返回 global，绝不跨项目扫描。
 */
export function retrieveLessons(
  lessons: Lesson[],
  evidence: Evidence[],
  q: RetrievalQuery,
): { items: RetrievedLesson[]; skipped: { lessonId: string; reason: string }[] } {
  const { limit, maxChars } = resolveRetrievalBudget(q)
  const terms = queryTerms(q.query ?? '')
  const queryText = normalizeText(q.query ?? '')
  const skipped: Array<{ lessonId: string; reason: string }> = []
  const candidates: Candidate[] = []

  for (const lesson of lessons) {
    if (!scopeMatches(lesson, q)) continue
    const excludedReason = EXCLUDED_STATE_REASONS[lesson.state]
    if (excludedReason !== undefined) {
      skipped.push({ lessonId: lesson.id, reason: excludedReason })
      continue
    }
    const hits = keywordHits(lesson, terms)
    const applicability = matchApplicability(lesson, q, queryText)
    const applicabilityCount = applicability.packages.length + applicability.versions.length + applicability.platforms.length
    if (hits.length === 0 && applicabilityCount === 0) continue
    candidates.push({ lesson, keywordHits: hits, applicability })
  }

  candidates.sort((a, b) => {
    const aKeyword = a.keywordHits.length > 0 ? 1 : 0
    const bKeyword = b.keywordHits.length > 0 ? 1 : 0
    if (aKeyword !== bKeyword) return bKeyword - aKeyword
    if (a.keywordHits.length !== b.keywordHits.length) return b.keywordHits.length - a.keywordHits.length
    const aApp = a.applicability.packages.length + a.applicability.versions.length + a.applicability.platforms.length
    const bApp = b.applicability.packages.length + b.applicability.versions.length + b.applicability.platforms.length
    if (aApp !== bApp) return bApp - aApp
    const aRank = stateRank(a.lesson.state)
    const bRank = stateRank(b.lesson.state)
    if (aRank !== bRank) return bRank - aRank
    const aTime = validatedAtValue(a.lesson)
    const bTime = validatedAtValue(b.lesson)
    if (aTime !== bTime) return bTime - aTime
    if (a.lesson.id === b.lesson.id) return 0
    return a.lesson.id < b.lesson.id ? -1 : 1
  })

  const items: RetrievedLesson[] = []
  let usedChars = 0
  for (const candidate of candidates) {
    if (items.length >= limit) {
      skipped.push({ lessonId: candidate.lesson.id, reason: 'limit' })
      continue
    }
    const item = toRetrievedLesson(candidate, evidence, q)
    const cost = retrievedLessonChars(item)
    if (usedChars + cost > maxChars) {
      skipped.push({ lessonId: candidate.lesson.id, reason: 'budget' })
      continue
    }
    items.push(item)
    usedChars += cost
  }
  return { items, skipped }
}
