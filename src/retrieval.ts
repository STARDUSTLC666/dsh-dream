/**
 * 任务相关经验检索（FREEZE v1 + v1.1 增补 R1/R3/R4）。
 *
 * 顺序：范围过滤 → 排除 rejected/stale/disputed → 候选/无证据策略过滤 → 版本包名上下文 →
 * 确定性排序 → 按排名整条装入的字符预算（遇第一条放不下即停，rankInversionCount===0）。
 * essential（title/when/action/exceptions，含 scopeLabel）永不截断；metadata（whyRelevant/
 * evidenceSummary）放不下时可截断并置 truncated:true。
 *
 * @module dsh-dream/retrieval
 */
import type { Evidence, Lesson, LessonState } from './knowledge.js'
import { normalizeLessonText, normalizeRelativeLessonFile } from './knowledge.js'
import { needsMemoryReview } from './memory.js'
import type { LessonObservation } from './automatic-state.js'

/** 检索入参；limit/maxChars 在内部按硬上限裁剪。 */
export interface RetrievalQuery {
  query: string
  projectId?: string
  workspaceRoot?: string
  /** 默认 5，硬上限 20。 */
  limit?: number
  /** 默认 3000，硬上限 20000。 */
  maxChars?: number
  /** 当前任务相关依赖的版本，用于匹配 applicability.versions（R3：必须先识别包名）。 */
  packageVersion?: string
  /** 显式包名上下文；与 query 文本一起用于识别 applicability[].package（R3）。 */
  packageName?: string
  /** 任务目标平台；宿主工具缺省使用当前系统，跨平台任务可显式指定。 */
  platform?: string
  /** 当前任务正在读写的工作区相对路径（用于匹配 lesson.files）。 */
  activeFiles?: string[]
  /** 当前执行步进的模型 ID（用于对比 lesson.origin.model，识别跨模型偏移）。 */
  currentModel?: string
  /** DSH 原生反馈与回用观测映射（仅用于同级温和破平，不改写资格过滤）。 */
  observations?: Record<string, Pick<LessonObservation, 'positive' | 'negative' | 'corrections' | 'repeatToolHits'>>
  /** 是否返回 candidate；默认 true（面板/审计需要）。dream_context 默认传 false（R1）。 */
  includeCandidates?: boolean
  /** 是否保留 independentSupportCount===0 且非 usable 的条目；默认 true。dream_context 传 false（R1）。 */
  includeNoEvidence?: boolean
  now?: number
}

/** 检索结果中的单条经验（when/exceptions 永不截断）。 */
export interface RetrievedLesson {
  lessonId: string
  revision: number
  title: string
  when: string
  action: string
  exceptions: string[]
  rationale?: string
  problemKey?: string
  files?: string[]
  originModel?: string
  modelMismatch?: boolean
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
  /** 包名已识别但所有版本条件都不满足（R3）。 */
  versionMismatch: boolean
  platformMismatch: boolean
}

interface Candidate {
  lesson: Lesson
  keywordHits: string[]
  fileHits: string[]
  applicability: ApplicabilityMatch
  bm25Score: number
  feedbackFactor: number
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

/** 在预算内截断（含省略号占用）；conditions/exceptions 不走这里。 */
function clipTo(text: string, max: number): string {
  if (max <= 0) return ''
  if (text.length <= max) return text
  if (max === 1) return '…'
  return text.slice(0, max - 1) + '…'
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
  if (scope.global === true) return '全局'
  const project = trimmed(scope.projectId)
  const workspace = trimmed(scope.workspaceRoot)
  if (project !== undefined && workspace !== undefined) return '项目 ' + project + '（工作区 ' + workspace + '）'
  if (project !== undefined) return '项目 ' + project
  if (workspace !== undefined) return '工作区 ' + workspace
  return '未限定范围'
}

/** 证据摘要（面板与 dream_context 共用）：独立支持数 + 已读/仅声明 + 脱敏摘要片段。 */
export function buildEvidenceSummary(lesson: Lesson, evidence: Evidence[]): string {
  return createEvidenceSummarizer(evidence)(lesson)
}

/** 一次查询共用证据索引；保持重复 ID 后者覆盖与引用顺序的摘要规则。 */
export function createEvidenceSummarizer(evidence: Evidence[]): (lesson: Lesson) => string {
  const byId = new Map<string, Evidence>()
  for (const item of evidence) {
    if (item !== null && typeof item === 'object' && typeof item.id === 'string') byId.set(item.id, item)
  }
  return (lesson) => summarizeEvidence(lesson, byId)
}

function summarizeEvidence(lesson: Lesson, byId: ReadonlyMap<string, Evidence>): string {
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

/** essential 成本：title/when/action/exceptions/scopeLabel，永不截断（R4）。 */
export function essentialLessonChars(item: Pick<RetrievedLesson, 'title' | 'when' | 'action' | 'exceptions' | 'scopeLabel'>): number {
  let total = item.title.length + item.when.length + item.action.length + item.scopeLabel.length
  for (const exception of item.exceptions) total += exception.length
  return total
}

/** metadata 成本：whyRelevant/evidenceSummary，预算紧时可截断（R4）。 */
export function metadataLessonChars(item: Pick<RetrievedLesson, 'whyRelevant' | 'evidenceSummary'>): number {
  return item.whyRelevant.length + item.evidenceSummary.length
}

/** 单条结果的完整字符成本（与 dream_context.budget.usedChars 同口径）。 */
export function retrievedLessonChars(item: RetrievedLesson): number {
  return essentialLessonChars(item) + metadataLessonChars(item)
}

/**
 * rank inversion 指标（R4）：被 budget-stop 跳过、且排在某个已返回条目之前的条目数。
 * 按排名整条装入的预算策略必须让它恒为 0。
 */
export function rankInversionCount(
  rankedLessonIds: string[],
  result: { items: Array<Pick<RetrievedLesson, 'lessonId'>>; skipped: Array<{ lessonId: string; reason: string }> },
): number {
  const rank = new Map<string, number>()
  rankedLessonIds.forEach((id, index) => { if (!rank.has(id)) rank.set(id, index) })
  const returnedRanks: number[] = []
  for (const item of result.items) {
    const index = rank.get(item.lessonId)
    if (index !== undefined) returnedRanks.push(index)
  }
  if (returnedRanks.length === 0) return 0
  const lastReturned = Math.max(...returnedRanks)
  let inversions = 0
  for (const entry of result.skipped) {
    if (entry.reason !== 'budget-stop' && entry.reason !== 'budget') continue
    const index = rank.get(entry.lessonId)
    if (index !== undefined && index < lastReturned) inversions += 1
  }
  return inversions
}

const SKIPPED_REASON_LABELS: Record<string, string> = {
  'state:rejected': '已驳回',
  'state:stale': '已过期（待复核）',
  'state:disputed': '冲突未解决',
  'candidate-hold': '候选未审阅（默认不注入）',
  'no-evidence': '无独立证据',
  'version-mismatch': '版本条件不匹配',
  'platform-mismatch': '平台条件不匹配',
  'review-due': '已到复核时间',
  limit: '超出条数上限',
  'budget-stop': '预算放不下',
  budget: '预算放不下（旧值）',
}

/** skipped.reason 的中文标签（面板与工具共用；未知 reason 原样返回）。 */
export function skippedReasonLabel(reason: string): string {
  return SKIPPED_REASON_LABELS[reason] ?? reason
}

/**
 * 浏览态（无 query 上下文）下一条经验的确定性扣留原因；usable 返回 undefined。
 * 与 retrieveLessons 的优先级一致：no-evidence 先于 candidate-hold；version-mismatch 需 query/包名，不适用。
 */
export function deterministicHoldReason(lesson: Pick<Lesson, 'state' | 'independentSupportCount'>): string | undefined {
  if (lesson.state === 'rejected') return 'state:rejected'
  if (lesson.state === 'stale') return 'state:stale'
  if (lesson.state === 'disputed') return 'state:disputed'
  if (lesson.state !== 'usable') return lesson.independentSupportCount === 0 ? 'no-evidence' : 'candidate-hold'
  return undefined
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

/** R3：只有显式 packageName 一致，或 query 文本出现该包名，才认为包名被识别。 */
function packageIdentified(pkg: string, q: RetrievalQuery, queryText: string): boolean {
  const normalizedPkg = normalizeText(pkg)
  if (normalizedPkg === '') return false
  const explicit = trimmed(q.packageName)
  if (explicit !== undefined && normalizeText(explicit) === normalizedPkg) return true
  return queryText.includes(normalizedPkg)
}

export function normalizePlatform(value: string): string {
  const key = value.trim().toLowerCase()
  if (['win32', 'win64', 'windows', 'win', '微软windows'].includes(key)) return 'windows'
  if (['darwin', 'macos', 'mac', 'osx', 'os x'].includes(key)) return 'macos'
  if (['linux', 'gnu/linux'].includes(key)) return 'linux'
  return key
}

/** 显式任务平台优先，其次无歧义的任务文本，最后宿主平台。 */
export function taskPlatform(query: string, explicit?: string, fallback?: string): string | undefined {
  if (trimmed(explicit)) return normalizePlatform(explicit!)
  const platforms: string[] = []
  if (/\b(?:windows|win32|win64)\b/i.test(query)) platforms.push('windows')
  if (/\b(?:linux|ubuntu|debian|fedora)\b/i.test(query)) platforms.push('linux')
  if (/\b(?:macos|darwin|osx)\b/i.test(query)) platforms.push('macos')
  return platforms.length === 1 ? platforms[0] : fallback ? normalizePlatform(fallback) : undefined
}

function matchApplicability(lesson: Lesson, q: RetrievalQuery, queryText: string): ApplicabilityMatch {
  const out: ApplicabilityMatch = { packages: [], versions: [], platforms: [], versionMismatch: false, platformMismatch: false }
  const packageVersion = trimmed(q.packageVersion)
  const currentPlatform = taskPlatform(q.query, q.platform)
  const platformChecks: boolean[] = []
  const identifiedVersionChecks: boolean[] = []
  for (const entry of lesson.applicability) {
    const pkg = trimmed(entry.package)
    const identified = pkg !== undefined && packageIdentified(pkg, q, queryText)
    if (identified && pkg !== undefined && !out.packages.includes(pkg)) out.packages.push(pkg)
    const versions = trimmed(entry.versions)
    if (identified && versions !== undefined && packageVersion !== undefined) {
      const ok = versionSatisfies(packageVersion, versions)
      identifiedVersionChecks.push(ok)
      if (ok && !out.versions.includes(versions)) out.versions.push(versions)
    }
    const platform = trimmed(entry.platform)
    if (currentPlatform !== undefined) {
      const ok = platform === undefined || ['*', 'any', 'all'].includes(normalizePlatform(platform))
        || platform.split(/[,|/]/).some(item => normalizePlatform(item) === currentPlatform)
      platformChecks.push(ok)
      if (ok && platform !== undefined && !out.platforms.includes(platform)) out.platforms.push(platform)
    }
  }
  out.versionMismatch = identifiedVersionChecks.length > 0 && identifiedVersionChecks.every((ok) => !ok)
  out.platformMismatch = platformChecks.length > 0 && platformChecks.every((ok) => !ok)
  return out
}

const QUERY_BOILERPLATE = new Set([
  '请帮我', '帮我', '请问', '一下', '这个', '那个', '这些', '那些', '可以', '能否', '需要', '想要', '怎么', '如何', '为什么', '什么', '处理', '看看', '检查',
  'please', 'help', 'with', 'this', 'that', 'these', 'those', 'the', 'for', 'and', 'from', 'into', 'about', 'just', 'could', 'would', 'should', 'can', 'you', 'how', 'why', 'what',
])

function queryTerms(query: string): string[] {
  const normalized = normalizeText(query)
  const rawSet = new Set<string>()
  const rawTokens = normalized.split(/[^\p{L}\p{N}+#._-]+/u)
  for (const token of rawTokens) {
    if (token === '') continue
    if (token.length >= 2) rawSet.add(token)
    const cjkRuns = token.match(/\p{Script=Han}+/gu)
    if (cjkRuns === null) continue
    for (const run of cjkRuns) {
      if (run.length === 1) rawSet.add(run)
      for (let i = 0; i + 1 < run.length; i += 1) rawSet.add(run.slice(i, i + 2))
      for (let i = 0; i + 2 < run.length; i += 1) rawSet.add(run.slice(i, i + 3))
    }
  }
  const filtered = [...rawSet].filter((term) => !QUERY_BOILERPLATE.has(term))
  return filtered.length > 0 ? filtered : [...rawSet]
}

interface LessonFieldTexts {
  title: string
  action: string
  when: string
  rationale: string
  problemKey: string
  all: string[]
}

function lessonFieldTexts(lesson: Lesson): LessonFieldTexts {
  const title = normalizeText(lesson.title)
  const action = normalizeText(lesson.action)
  const when = normalizeText(lesson.when)
  const rationale = lesson.rationale ? normalizeText(lesson.rationale) : ''
  const problemKey = lesson.problemKey ? normalizeText(lesson.problemKey) : ''
  const all = [title, action, when, ...(rationale ? [rationale] : []), ...(problemKey ? [problemKey] : [])]
  return { title, action, when, rationale, problemKey, all }
}

function keywordHits(fields: LessonFieldTexts, terms: string[]): string[] {
  if (terms.length === 0) return []
  const hits: string[] = []
  for (const term of terms) {
    if (fields.all.some((field) => field.includes(term))) hits.push(term)
  }
  return hits
}

function countOccurrences(haystack: string, needle: string): number {
  if (!haystack || !needle) return 0
  let count = 0
  let pos = 0
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count += 1
    pos += needle.length
    if (count >= 6) break
  }
  return count
}

function normalizeActiveFiles(files: string[] | undefined): string[] {
  if (!Array.isArray(files) || files.length === 0) return []
  const out: string[] = []
  for (const file of files) {
    const normalized = normalizeRelativeLessonFile(file)
    if (normalized !== undefined) {
      const lowered = normalized.toLowerCase()
      if (!out.includes(lowered)) out.push(lowered)
    }
  }
  return out
}

function matchLessonFiles(lesson: Lesson, activeFiles: string[]): string[] {
  if (activeFiles.length === 0 || !Array.isArray(lesson.files) || lesson.files.length === 0) return []
  const hits: string[] = []
  for (const raw of lesson.files) {
    const file = raw.toLowerCase()
    const matched = activeFiles.some((active) => active === file || active.endsWith('/' + file) || file.endsWith('/' + active))
    if (matched && !hits.includes(raw)) hits.push(raw)
  }
  return hits
}

function feedbackFactorOf(lesson: Lesson, q: RetrievalQuery): number {
  const fbPos = lesson.feedback?.useful ?? 0
  const fbNeg = lesson.feedback?.notApplicable ?? 0
  const obs = q.observations?.[lesson.id]
  const obsPos = obs?.positive ?? 0
  const obsNeg = obs?.negative ?? 0
  const obsCorr = obs?.corrections ?? 0
  const net = (fbPos - fbNeg) + (obsPos - obsNeg) - obsCorr * 0.5
  if (net === 0) return 1
  return Math.round((1 + Math.max(-0.25, Math.min(0.25, net * 0.06))) * 10000) / 10000
}

function normalizeModelId(model: string | undefined): string | undefined {
  if (typeof model !== 'string') return undefined
  const value = model.trim().toLowerCase()
  return value === '' ? undefined : value
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
  if (entry.fileHits.length > 0) {
    const shown = entry.fileHits.slice(0, 2).map((file) => '「' + file + '」').join('、')
    parts.push('关联文件' + shown + (entry.fileHits.length > 2 ? ' 等' : ''))
  }
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

function toRetrievedLesson(entry: Candidate, summarizeEvidence: (lesson: Lesson) => string, q: RetrievalQuery): RetrievedLesson {
  const lesson = entry.lesson
  const originModel = trimmed(lesson.origin?.model)
  const currentModel = normalizeModelId(q.currentModel)
  const modelMismatch = originModel !== undefined && currentModel !== undefined
    ? normalizeModelId(originModel) !== currentModel
    : undefined
  const item: RetrievedLesson = {
    lessonId: lesson.id,
    revision: lesson.revision,
    title: lesson.title,
    when: lesson.when,
    action: lesson.action,
    exceptions: [...lesson.exceptions],
    ...(lesson.rationale !== undefined ? { rationale: lesson.rationale } : {}),
    ...(lesson.problemKey !== undefined ? { problemKey: lesson.problemKey } : {}),
    ...(lesson.files !== undefined && lesson.files.length > 0 ? { files: [...lesson.files] } : {}),
    ...(originModel !== undefined ? { originModel } : {}),
    ...(modelMismatch === true ? { modelMismatch: true } : {}),
    state: lesson.state,
    scopeLabel: lessonScopeLabel(lesson.scope),
    whyRelevant: buildWhyRelevant(entry, q),
    evidenceSummary: summarizeEvidence(lesson),
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
 *
 * R1：includeCandidates=false 时 candidate 记 skipped:candidate-hold；includeNoEvidence=false 时
 * independentSupportCount===0 且非 usable 记 skipped:no-evidence（优先于 candidate-hold）。
 * R3：applicability.versions 仅在包名被识别时参与；包名识别但版本不满足 → skipped:version-mismatch。
 * R4：预算按排名整条装入，第一条 essential 放不下即停（budget-stop）；metadata 可截断。
 */
export function retrieveLessons(
  lessons: Lesson[],
  evidence: Evidence[],
  q: RetrievalQuery,
): { items: RetrievedLesson[]; skipped: { lessonId: string; reason: string }[] } {
  const { limit, maxChars } = resolveRetrievalBudget(q)
  const terms = queryTerms(q.query ?? '')
  const queryText = normalizeText(q.query ?? '')
  const activeFiles = normalizeActiveFiles(q.activeFiles)
  const includeCandidates = q.includeCandidates !== false
  const includeNoEvidence = q.includeNoEvidence !== false
  const skipped: Array<{ lessonId: string; reason: string }> = []
  const eligiblePool: Array<{
    lesson: Lesson
    fields: LessonFieldTexts
    applicability: ApplicabilityMatch
    hits: string[]
    fileHits: string[]
  }> = []

  for (const lesson of lessons) {
    if (!scopeMatches(lesson, q)) continue
    if (needsMemoryReview(lesson, q.now ?? Date.now())) {
      skipped.push({ lessonId: lesson.id, reason: 'review-due' })
      continue
    }
    const excludedReason = EXCLUDED_STATE_REASONS[lesson.state]
    if (excludedReason !== undefined) {
      skipped.push({ lessonId: lesson.id, reason: excludedReason })
      continue
    }
    // R3 优先于 R1 的候选扣留：包名已识别但版本不满足时，reason 必须是 version-mismatch。
    const applicability = matchApplicability(lesson, q, queryText)
    if (applicability.platformMismatch) {
      skipped.push({ lessonId: lesson.id, reason: 'platform-mismatch' })
      continue
    }
    if (applicability.versionMismatch) {
      skipped.push({ lessonId: lesson.id, reason: 'version-mismatch' })
      continue
    }
    if (!includeNoEvidence && lesson.state !== 'usable' && lesson.independentSupportCount === 0) {
      skipped.push({ lessonId: lesson.id, reason: 'no-evidence' })
      continue
    }
    if (!includeCandidates && lesson.state === 'candidate') {
      skipped.push({ lessonId: lesson.id, reason: 'candidate-hold' })
      continue
    }
    const fields = lessonFieldTexts(lesson)
    const hits = keywordHits(fields, terms)
    const fileHits = matchLessonFiles(lesson, activeFiles)
    eligiblePool.push({ lesson, fields, applicability, hits, fileHits })
  }

  // 零依赖内存 IDF / BM25 词频饱和打分：稀缺技术词权重高于高频泛词，避免中文 2-gram 噪声淹没精准词。
  const corpusSize = Math.max(1, eligiblePool.length)
  const df = new Map<string, number>()
  for (const term of terms) {
    let count = 0
    for (const row of eligiblePool) {
      if (row.fields.all.some((field) => field.includes(term))) count += 1
    }
    df.set(term, count)
  }

  const candidates: Candidate[] = []
  for (const row of eligiblePool) {
    const applicabilityCount = row.applicability.packages.length + row.applicability.versions.length + row.applicability.platforms.length
    if (row.hits.length === 0 && row.fileHits.length === 0 && applicabilityCount === 0) continue
    let bm25 = 0
    for (const term of row.hits) {
      const freq = df.get(term) ?? 1
      const idf = Math.log(1 + (corpusSize - freq + 0.5) / (freq + 0.5))
      const weightedTf = countOccurrences(row.fields.title, term) * 1.5
        + countOccurrences(row.fields.when, term)
        + countOccurrences(row.fields.action, term)
        + countOccurrences(row.fields.rationale, term) * 0.8
        + countOccurrences(row.fields.problemKey, term) * 0.8
      const saturated = weightedTf > 0 ? (weightedTf * 2.2) / (weightedTf + 1.2) : 0
      bm25 += idf * saturated
    }
    if (row.fileHits.length > 0) bm25 += row.fileHits.length * 3.5
    const feedbackFactor = feedbackFactorOf(row.lesson, q)
    const bm25Score = Math.round(bm25 * feedbackFactor * 10000) / 10000
    candidates.push({
      lesson: row.lesson,
      keywordHits: row.hits,
      fileHits: row.fileHits,
      applicability: row.applicability,
      bm25Score,
      feedbackFactor,
    })
  }

  candidates.sort((a, b) => {
    const aDirect = (a.keywordHits.length > 0 || a.fileHits.length > 0) ? 1 : 0
    const bDirect = (b.keywordHits.length > 0 || b.fileHits.length > 0) ? 1 : 0
    if (aDirect !== bDirect) return bDirect - aDirect
    if (a.bm25Score !== b.bm25Score) return b.bm25Score - a.bm25Score
    const aApp = a.applicability.packages.length + a.applicability.versions.length + a.applicability.platforms.length
    const bApp = b.applicability.packages.length + b.applicability.versions.length + b.applicability.platforms.length
    if (aApp !== bApp) return bApp - aApp
    const aRank = stateRank(a.lesson.state)
    const bRank = stateRank(b.lesson.state)
    if (aRank !== bRank) return bRank - aRank
    if (a.feedbackFactor !== b.feedbackFactor) return b.feedbackFactor - a.feedbackFactor
    const aTime = validatedAtValue(a.lesson)
    const bTime = validatedAtValue(b.lesson)
    if (aTime !== bTime) return bTime - aTime
    if (a.lesson.id === b.lesson.id) return 0
    return a.lesson.id < b.lesson.id ? -1 : 1
  })

  const items: RetrievedLesson[] = []
  if (candidates.length === 0) return { items, skipped }
  const summarizeEvidence = createEvidenceSummarizer(evidence)
  let usedChars = 0
  for (let index = 0; index < candidates.length; index += 1) {
    if (items.length >= limit) {
      for (let rest = index; rest < candidates.length; rest += 1) {
        skipped.push({ lessonId: candidates[rest].lesson.id, reason: 'limit' })
      }
      break
    }
    const candidate = candidates[index]
    const item = toRetrievedLesson(candidate, summarizeEvidence, q)
    const remaining = maxChars - usedChars
    const essential = essentialLessonChars(item)
    if (essential > remaining) {
      for (let rest = index; rest < candidates.length; rest += 1) {
        skipped.push({ lessonId: candidates[rest].lesson.id, reason: 'budget-stop' })
      }
      break
    }
    const fullCost = retrievedLessonChars(item)
    if (fullCost <= remaining) {
      items.push(item)
      usedChars += fullCost
      continue
    }
    const trimmed = truncateMetadata(item, remaining - essential)
    const trimmedCost = retrievedLessonChars(trimmed)
    if (trimmedCost > remaining) {
      for (let rest = index; rest < candidates.length; rest += 1) {
        skipped.push({ lessonId: candidates[rest].lesson.id, reason: 'budget-stop' })
      }
      break
    }
    items.push(trimmed)
    usedChars += trimmedCost
  }
  return { items, skipped }
}

/** metadata（whyRelevant/evidenceSummary）按预算截断，essential 保持不变。 */
function truncateMetadata(item: RetrievedLesson, metadataBudget: number): RetrievedLesson {
  const budget = Math.max(0, metadataBudget)
  const whyBudget = Math.min(item.whyRelevant.length, Math.ceil(budget / 2))
  const whyRelevant = clipTo(item.whyRelevant, whyBudget)
  const evidenceSummary = clipTo(item.evidenceSummary, Math.max(0, budget - whyRelevant.length))
  if (whyRelevant === item.whyRelevant && evidenceSummary === item.evidenceSummary) return item
  return { ...item, whyRelevant, evidenceSummary, truncated: true }
}
