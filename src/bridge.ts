/**
 * 记忆桥接（M2）：preview / apply / rollback 三模式 + 应用记录与并发守卫。
 *
 * 兼容：文件底部的 legacy 直写 API（bridgeDreams / BRIDGE_START / BRIDGE_END）
 * 保持 0.5.x 行为不变，供旧调用与既有测试使用；新流程一律走 preview → apply → rollback。
 *
 * 硬性策略（FREEZE-M2 §M2-1）：
 * - preview 零写入；apply 必须带 expectedSha256，当前文件不符 → conflict 零写入；
 * - 只替换 <!-- dsh-dream:start --> … <!-- dsh-dream:end --> 管理块，块外文字 / BOM /
 *   换行风格原样保留；同目录 temp + rename；应用记录写 <journalDir>/bridge/records.jsonl；
 * - 两进程并行 apply 用 <journalDir>/bridge/.lock + expectedSha256 CAS 保证只有一个成功；
 * - junction / 符号链接统一“跟随链接改真实文件、链接本身不变”（见 README）；
 * - 标记缺损/重复/嵌套/错位拒绝并给行号定位；UTF-16 / 二进制明确拒绝；
 * - 经验资格：usable 且 scope 匹配当前项目，或显式 global 且已被用户采纳；频次不作准入。
 *
 * @module dsh-dream/bridge
 */
import {
  accessSync,
  appendFileSync,
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { basename, dirname, isAbsolute, join, normalize, relative, resolve } from 'node:path'
import { dreamStats } from './journal.js'
import { maskSecrets } from './mask.js'
import type { Lesson } from './knowledge.js'

// ---------- 新管理块标记（新流程） ----------

/** 新管理块起始标记（整行）。 */
export const DREAM_BLOCK_START = '<!-- dsh-dream:start -->'
/** 新管理块结束标记（整行）。 */
export const DREAM_BLOCK_END = '<!-- dsh-dream:end -->'

/** 默认最多桥接条数。 */
export const BRIDGE_DEFAULT_MAX_LESSONS = 5
/** 硬上限。 */
export const BRIDGE_HARD_MAX_LESSONS = 20

const BRIDGE_LOCK_STALE_MS = 30000
const BRIDGE_LOCK_TIMEOUT_MS = 2000
const BRIDGE_BOOT_ID = randomUUID()

// ---------- 类型 ----------

export interface BridgeScope {
  projectId?: string
  workspaceRoot?: string
}

export interface BridgeLessonView {
  lessonId: string
  revision: number
  title: string
  when: string
  action: string
  exceptions: string[]
  scopeLabel: string
}

export interface BridgeSkipped {
  lessonId: string
  reason: string
}

export interface BridgeFileState {
  exists: boolean
  /** 文件不存在时为 null；存在时是文件字节 sha256。 */
  sha256: string | null
  size: number
}

export type BridgeAction = 'create' | 'replace' | 'append' | 'unchanged'

export interface BridgeTargetOptions {
  /** 当前项目根目录（必须存在）。 */
  projectRoot: string
  /** 目标文件；缺省 = <projectRoot>/AGENTS.md。 */
  path?: string
}

export interface BridgeOptions extends BridgeTargetOptions {
  /** 应用记录目录 <journalDir>/bridge/。 */
  journalDir: string
  /** 候选经验（由 tools 层从 KnowledgeStore 提供）。 */
  lessons: Lesson[]
  /** 当前项目标识；两者都没有时只允许显式 global 且已采纳的经验。 */
  projectId?: string
  workspaceRoot?: string
  /** 只桥接这些经验（可选）。 */
  lessonIds?: string[]
  /** 条数上限，默认 5，硬上限 20。 */
  maxLessons?: number
  /** 写盘前是否过 mask.ts；默认 true。 */
  maskSecrets?: boolean
}

export interface BridgeApplyOptions extends BridgeOptions {
  /** apply 必须提供：当前目标文件的 sha256；文件不存在时用 null（preview.expected.sha256 原样回传即可）。 */
  expectedSha256: string | null
  /** 可选：apply 必须是同一份预览。 */
  previewId?: string
}

export interface BridgeRollbackOptions {
  projectRoot: string
  path?: string
  journalDir: string
  backupId: string
}

export type BridgeErrorCode =
  | 'invalid'
  | 'conflict'
  | 'read-only'
  | 'io'
  | 'marker'
  | 'preview-mismatch'
  | 'not-found'
  | 'unsupported-encoding'
  | 'path-outside-project'
  | 'target-is-directory'
  | 'not-rollbackable'

export interface BridgeError {
  code: BridgeErrorCode
  message: string
  line?: number
  hint?: string
}

export interface BridgeFailure {
  ok: false
  error: BridgeError
  /** 可选的形状兜底：preview 即使失败也尽量给出 action/expected/resolvedPath，避免调用方读字段崩。 */
  action?: BridgeAction
  expected?: BridgeFileState
  resolvedPath?: string
}

export interface BridgePreviewSuccess {
  ok: true
  action: BridgeAction
  expected: BridgeFileState
  resolvedPath: string
  diff: string
  lessons: BridgeLessonView[]
  skipped: BridgeSkipped[]
  previewId: string
  blockPreview: string
}

export interface BridgeApplySuccess {
  ok: true
  action: BridgeAction
  unchanged: boolean
  backupId?: string
  file: BridgeFileState
  path: string
  resolvedPath: string
  lessons: BridgeLessonView[]
  skipped: BridgeSkipped[]
  previewId?: string
  /** 目标已应用且可按 backupId 恢复，但最终审计确认未能追加。 */
  warning?: string
}

export interface BridgeRollbackSuccess {
  ok: true
  backupId: string
  file: BridgeFileState
  path: string
  resolvedPath: string
}

export type BridgePreviewResult = BridgePreviewSuccess | BridgeFailure
export type BridgeApplyResult = BridgeApplySuccess | BridgeFailure
export type BridgeRollbackResult = BridgeRollbackSuccess | BridgeFailure

export interface BridgeRecord {
  schemaVersion: 1
  backupId: string
  at: string
  target: string
  projectRoot: string
  action: 'create' | 'replace' | 'append'
  before: BridgeFileState
  beforeBlock: string | null
  separator: string
  afterBlockSha256: string
  afterFileSha256: string
  lessons: Array<{ lessonId: string; revision: number }>
  previewId: string
  /** 缺省为旧版已完成记录；pending 是先于目标写入持久化的恢复记录。 */
  phase?: 'pending' | 'applied' | 'aborted'
}

interface TargetState {
  exists: boolean
  sha256: string | null
  size: number
  text: string
  hadBom: boolean
  eol: '\n' | '\r\n'
  mode?: number
}

interface ResolvedTarget {
  /** 跟随链接后的真实写入路径。 */
  path: string
  projectRoot: string
  lexical: string
}

type BlockLocation =
  | { status: 'none' }
  | { status: 'ok'; start: number; end: number; text: string; startLine: number; endLine: number }
  | { status: 'broken'; message: string; line?: number }

interface BridgeWritePlan {
  action: 'create' | 'replace' | 'append'
  nextText: string
  unchanged: boolean
  separator: string
  previousBlock: string | null
}

// ---------- 小工具 ----------

function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex')
}

function fail(
  code: BridgeErrorCode,
  message: string,
  extra: { line?: number; hint?: string; action?: BridgeAction; expected?: BridgeFileState; resolvedPath?: string } = {},
): BridgeFailure {
  const error: BridgeError = { code, message }
  if (extra.line !== undefined) error.line = extra.line
  if (extra.hint !== undefined) error.hint = extra.hint
  const failure: BridgeFailure = { ok: false, error }
  if (extra.action !== undefined) failure.action = extra.action
  if (extra.expected !== undefined) failure.expected = extra.expected
  if (extra.resolvedPath !== undefined) failure.resolvedPath = extra.resolvedPath
  return failure
}

function expectedOf(state: TargetState): BridgeFileState {
  return { exists: state.exists, sha256: state.exists ? state.sha256 : null, size: state.size }
}

function missingExpected(): BridgeFileState {
  return { exists: false, sha256: null, size: 0 }
}

function withPreviewShape(failure: BridgeFailure, resolvedPath?: string, expected?: BridgeFileState, action?: BridgeAction): BridgeFailure {
  if (failure.action === undefined) failure.action = action === undefined ? 'create' : action
  if (failure.expected === undefined) failure.expected = expected === undefined ? missingExpected() : expected
  if (failure.resolvedPath === undefined && resolvedPath !== undefined) failure.resolvedPath = resolvedPath
  return failure
}

function stateMatchesExpected(state: TargetState, expected: string | null): boolean {
  if (expected === null) return state.exists === false
  return state.exists && state.sha256 === expected
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function ioCodeOf(error: unknown): string {
  return (error as NodeJS.ErrnoException).code === undefined ? '' : String((error as NodeJS.ErrnoException).code)
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

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const text = JSON.stringify(value)
    return text === undefined ? 'null' : text
  }
  if (Array.isArray(value)) return '[' + value.map((item) => stableJson(item)).join(',') + ']'
  const record = value as Record<string, unknown>
  return '{' + Object.keys(record).sort().map((key) => JSON.stringify(key) + ':' + stableJson(record[key])).join(',') + '}'
}

function containsDotDot(path: string): boolean {
  return path.split(/[\\/]+/).some((part) => part === '..')
}

function isInside(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

/** 路径等价（尽量 realpath；Windows 大小写不敏感）。 */
function samePath(a: string, b: string): boolean {
  const real = (value: string): string => {
    try {
      return realpathSync(value)
    } catch {
      return resolve(value)
    }
  }
  const left = real(a)
  const right = real(b)
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right
}

function sanitizeBlockText(text: string, mask: boolean): string {
  const masked = mask ? maskSecrets(text) : text
  return masked
    .split(DREAM_BLOCK_START).join('[标记已移除]')
    .split(DREAM_BLOCK_END).join('[标记已移除]')
    .replace(/<!--/g, '(<!--')
    .replace(/\s+/g, ' ')
    .trim()
}

function scopeLabelOf(lesson: Lesson): string {
  if (lesson.scope.global === true) return '全局'
  if (typeof lesson.scope.projectId === 'string' && lesson.scope.projectId !== '') return '项目 ' + lesson.scope.projectId
  if (typeof lesson.scope.workspaceRoot === 'string' && lesson.scope.workspaceRoot !== '') return '工作区 ' + lesson.scope.workspaceRoot
  return '未限定'
}

function toView(lesson: Lesson, mask: boolean): BridgeLessonView {
  return {
    lessonId: lesson.id,
    revision: lesson.revision,
    title: sanitizeBlockText(lesson.title, mask),
    when: sanitizeBlockText(lesson.when, mask),
    action: sanitizeBlockText(lesson.action, mask),
    exceptions: lesson.exceptions.map((item) => sanitizeBlockText(item, mask)).filter((item) => item !== ''),
    scopeLabel: scopeLabelOf(lesson),
  }
}

// ---------- 资格筛选 ----------

/**
 * 经验资格：state=usable；scope 匹配当前项目；或显式 global 且 review.decision=accepted。
 * 解释为空或不满足一律进 skipped，绝不因频次入选或落选。
 */
export function selectBridgeLessons(
  lessons: Lesson[],
  scope: BridgeScope,
  options: { lessonIds?: string[]; maxLessons?: number } = {},
): { eligible: Lesson[]; skipped: BridgeSkipped[] } {
  const rawMax = options.maxLessons
  const maxLessons = typeof rawMax === 'number' && Number.isFinite(rawMax)
    ? Math.min(BRIDGE_HARD_MAX_LESSONS, Math.max(1, Math.floor(rawMax)))
    : BRIDGE_DEFAULT_MAX_LESSONS
  const skipped: BridgeSkipped[] = []
  const eligible: Lesson[] = []

  const reasonFor = (lesson: Lesson): string | undefined => {
    if (lesson.state !== 'usable') return 'not-usable'
    if (lesson.scope.global === true) {
      return lesson.review.decision === 'accepted' ? undefined : 'not-accepted-global'
    }
    const projectMatch = typeof scope.projectId === 'string' && scope.projectId !== '' && lesson.scope.projectId === scope.projectId
    const workspaceMatch = typeof scope.workspaceRoot === 'string' && scope.workspaceRoot !== '' &&
      typeof lesson.scope.workspaceRoot === 'string' && samePath(scope.workspaceRoot, lesson.scope.workspaceRoot)
    if (!projectMatch && !workspaceMatch) return 'scope-mismatch'
    return undefined
  }

  if (options.lessonIds !== undefined && options.lessonIds.length > 0) {
    const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]))
    for (const id of options.lessonIds) {
      const lesson = byId.get(id)
      if (lesson === undefined) {
        skipped.push({ lessonId: id, reason: 'unknown-lesson' })
        continue
      }
      const reason = reasonFor(lesson)
      if (reason !== undefined) {
        skipped.push({ lessonId: id, reason })
        continue
      }
      if (eligible.length >= maxLessons) {
        skipped.push({ lessonId: id, reason: 'limit' })
        continue
      }
      eligible.push(lesson)
    }
    return { eligible, skipped }
  }

  const sorted = lessons.slice().sort((a, b) => (a.updatedAt === b.updatedAt ? a.id.localeCompare(b.id) : b.updatedAt.localeCompare(a.updatedAt)))
  for (const lesson of sorted) {
    const reason = reasonFor(lesson)
    if (reason !== undefined) {
      skipped.push({ lessonId: lesson.id, reason })
      continue
    }
    if (eligible.length >= maxLessons) {
      skipped.push({ lessonId: lesson.id, reason: 'limit' })
      continue
    }
    eligible.push(lesson)
  }
  return { eligible, skipped }
}

// ---------- 管理块定位与生成 ----------

interface LineSpan {
  text: string
  start: number
  end: number
}

function splitLines(text: string): LineSpan[] {
  const out: LineSpan[] = []
  let index = 0
  while (index < text.length) {
    const newline = text.indexOf('\n', index)
    if (newline < 0) {
      out.push({ text: text.slice(index).replace(/\r$/, ''), start: index, end: text.length })
      break
    }
    let end = newline
    if (end > index && text[end - 1] === '\r') end -= 1
    out.push({ text: text.slice(index, end), start: index, end })
    index = newline + 1
  }
  return out
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1
}

/** 定位管理块；缺损/重复/嵌套/错位给出位置。 */
export function locateDreamBlock(text: string): BlockLocation {
  const startCount = countOccurrences(text, DREAM_BLOCK_START)
  const endCount = countOccurrences(text, DREAM_BLOCK_END)
  if (startCount === 0 && endCount === 0) return { status: 'none' }
  if (startCount === 0) return { status: 'broken', message: '发现结束标记但没有起始标记（' + DREAM_BLOCK_START + '）', line: lineOfFirst(text, DREAM_BLOCK_END) }
  if (endCount === 0) return { status: 'broken', message: '发现起始标记但没有结束标记（' + DREAM_BLOCK_END + '）', line: lineOfFirst(text, DREAM_BLOCK_START) }

  const lines = splitLines(text)
  const startLines: number[] = []
  const endLines: number[] = []
  lines.forEach((line, i) => {
    if (line.text.includes(DREAM_BLOCK_START)) startLines.push(i)
    if (line.text.includes(DREAM_BLOCK_END)) endLines.push(i)
  })
  const lineNumber = (i: number): number => i + 1
  if (startLines.length > 1) {
    return { status: 'broken', message: '起始标记重复出现（第 ' + startLines.map(lineNumber).join('、') + ' 行）', line: lineNumber(startLines[0]) }
  }
  if (endLines.length > 1) {
    return { status: 'broken', message: '结束标记重复出现（第 ' + endLines.map(lineNumber).join('、') + ' 行）', line: lineNumber(endLines[0]) }
  }
  if (startCount > 1 || endCount > 1) {
    return { status: 'broken', message: '标记出现次数异常（start=' + startCount + '，end=' + endCount + '），可能是嵌套或书写在同一行', line: lineNumber(startLines[0] ?? endLines[0] ?? 0) }
  }
  if (startLines.length === 0 || endLines.length === 0) {
    return { status: 'broken', message: '管理块标记不完整（start=' + startCount + '，end=' + endCount + '）' }
  }
  const startLine = startLines[0]
  const endLine = endLines[0]
  if (lines[startLine].text.trim() !== DREAM_BLOCK_START) {
    return { status: 'broken', message: '起始标记必须独立成行', line: lineNumber(startLine) }
  }
  if (lines[endLine].text.trim() !== DREAM_BLOCK_END) {
    return { status: 'broken', message: '结束标记必须独立成行', line: lineNumber(endLine) }
  }
  if (endLine < startLine) {
    return { status: 'broken', message: '结束标记出现在起始标记之前（第 ' + lineNumber(endLine) + ' 行 < 第 ' + lineNumber(startLine) + ' 行）', line: lineNumber(endLine) }
  }
  if (endLine === startLine) {
    return { status: 'broken', message: '起始/结束标记写在同一行', line: lineNumber(startLine) }
  }
  const start = lines[startLine].start
  const end = lines[endLine].end
  return { status: 'ok', start, end, text: text.slice(start, end), startLine: lineNumber(startLine), endLine: lineNumber(endLine) }
}

function lineOfFirst(text: string, needle: string): number | undefined {
  const index = text.indexOf(needle)
  if (index < 0) return undefined
  return text.slice(0, index).split('\n').length
}

/** 生成管理块（内部使用 \n；落盘前按目标换行风格转换）。 */
export function buildDreamBlock(lessons: BridgeLessonView[]): string {
  const lines = [DREAM_BLOCK_START, '', '## 梦境经验（dsh-dream 自动生成，请勿手工编辑块内内容）', '']
  for (const lesson of lessons) {
    // 最后一道保险：无论调用方是否已脱敏，管理块内文本都必须过 mask.ts（R10）。
    lines.push('- ' + maskSecrets(lesson.title) + '（' + lesson.scopeLabel + '）')
    lines.push('  - 适用：' + maskSecrets(lesson.when))
    lines.push('  - 动作：' + maskSecrets(lesson.action))
    for (const exception of lesson.exceptions) lines.push('  - 例外：' + maskSecrets(exception))
  }
  lines.push('', DREAM_BLOCK_END)
  return lines.join('\n')
}

function withEol(block: string, eol: '\n' | '\r\n'): string {
  return block.split('\n').join(eol)
}

// ---------- 路径解析（跟随链接） ----------

function resolveFollowingLinks(path: string, visited: Set<string> = new Set()): string {
  let current = path
  const rest: string[] = []
  for (;;) {
    if (visited.has(current)) return join(current, ...rest.slice().reverse())
    visited.add(current)
    if (existsSync(current)) {
      try {
        return join(realpathSync(current), ...rest.slice().reverse())
      } catch {
        return join(current, ...rest.slice().reverse())
      }
    }
    let linkTarget: string | undefined
    try {
      if (lstatSync(current).isSymbolicLink()) linkTarget = readlinkSync(current)
    } catch {
      linkTarget = undefined
    }
    if (linkTarget !== undefined) {
      const absolute = isAbsolute(linkTarget) ? linkTarget : resolve(dirname(current), linkTarget)
      return resolveFollowingLinks(join(absolute, ...rest.slice().reverse()), visited)
    }
    const parent = dirname(current)
    if (parent === current) return join(current, ...rest.slice().reverse())
    rest.push(basename(current))
    current = parent
  }
}

export function resolveBridgeTarget(projectRoot: string, rawPath?: string): { ok: true; target: ResolvedTarget } | BridgeFailure {
  if (typeof projectRoot !== 'string' || projectRoot.trim() === '') {
    return fail('invalid', 'projectRoot 必须是非空路径', { action: 'create', expected: missingExpected() })
  }
  if (!existsSync(projectRoot)) {
    return fail('invalid', '项目目录不存在：' + projectRoot, { action: 'create', expected: missingExpected() })
  }
  let realRoot: string
  try {
    realRoot = realpathSync(projectRoot)
  } catch (error) {
    return fail('invalid', '无法解析项目目录：' + messageOf(error), { action: 'create', expected: missingExpected() })
  }
  const relativeOrAbsolute = typeof rawPath === 'string' && rawPath.trim() !== '' ? rawPath.trim() : 'AGENTS.md'
  if (containsDotDot(relativeOrAbsolute)) {
    return fail('path-outside-project', '路径不得包含 ..：' + relativeOrAbsolute, { action: 'create', expected: missingExpected(), resolvedPath: relativeOrAbsolute })
  }
  const originalRoot = resolve(projectRoot)
  const originalPath = isAbsolute(relativeOrAbsolute) ? normalize(relativeOrAbsolute) : resolve(originalRoot, relativeOrAbsolute)
  // 绝对路径可能使用项目 junction 的字面路径；映射到真实根后再做边界校验。
  const lexical = isInside(originalRoot, originalPath) ? join(realRoot, relative(originalRoot, originalPath)) : originalPath
  if (!isInside(realRoot, lexical)) {
    return fail('path-outside-project', '解析后的路径不在当前项目内：' + lexical, { action: 'create', expected: missingExpected(), resolvedPath: lexical })
  }
  const followed = resolveFollowingLinks(lexical)
  if (!isInside(realRoot, followed)) {
    return fail('path-outside-project', '路径经链接解析后不在当前项目内（拒绝越界）：' + followed, { action: 'create', expected: missingExpected(), resolvedPath: followed })
  }
  return { ok: true, target: { path: followed, projectRoot: realRoot, lexical } }
}

// ---------- 读写与编码 ----------

function decodeTargetBuffer(buf: Buffer): { ok: true; text: string; hadBom: boolean; eol: '\n' | '\r\n' } | BridgeFailure {
  if (buf.length >= 2 && ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff))) {
    return fail('unsupported-encoding', '目标文件是 UTF-16（含 BOM），本工具只支持 UTF-8；请先转换为 UTF-8。')
  }
  if (buf.includes(0)) {
    return fail('unsupported-encoding', '目标文件包含 NUL 字节，看起来是二进制或 UTF-16；拒绝改写。')
  }
  let hadBom = false
  let body = buf
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    hadBom = true
    body = buf.subarray(3)
  }
  const text = body.toString('utf8')
  if (!Buffer.from(text, 'utf8').equals(body)) {
    return fail('unsupported-encoding', '目标文件不是合法 UTF-8；拒绝改写。')
  }
  return { ok: true, text, hadBom, eol: text.includes('\r\n') ? '\r\n' : '\n' }
}

function readTargetState(target: ResolvedTarget): { ok: true; state: TargetState } | BridgeFailure {
  const path = target.path
  let stat
  try {
    stat = statSync(path)
  } catch (error) {
    const code = ioCodeOf(error)
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      return { ok: true, state: { exists: false, sha256: null, size: 0, text: '', hadBom: false, eol: '\n' } }
    }
    return failFromIo(error, path)
  }
  if (stat.isDirectory()) return fail('target-is-directory', '目标是目录，不能写入：' + path, { action: 'create', expected: { exists: true, sha256: null, size: 0 }, resolvedPath: path })
  if (!stat.isFile()) return fail('invalid', '目标不是普通文件：' + path)
  let buf: Buffer
  try {
    buf = readFileSync(path)
  } catch (error) {
    const code = ioCodeOf(error)
    if (code === 'ENOENT') return { ok: true, state: { exists: false, sha256: null, size: 0, text: '', hadBom: false, eol: '\n' } }
    return failFromIo(error, path)
  }
  const decoded = decodeTargetBuffer(buf)
  if (!('ok' in decoded) || decoded.ok !== true) return decoded
  return {
    ok: true,
    state: {
      exists: true,
      sha256: sha256(buf),
      size: buf.length,
      text: decoded.text,
      hadBom: decoded.hadBom,
      eol: decoded.eol,
      mode: stat.mode & 0o7777,
    },
  }
}

function failFromIo(error: unknown, path: string): BridgeFailure {
  const code = ioCodeOf(error)
  if (code === 'EACCES' || code === 'EPERM') {
    return fail('read-only', '没有权限写入目标文件：' + path + '（' + messageOf(error) + '）', {
      hint: '取消只读属性后重试（Windows: attrib -R "' + path + '"；Unix: chmod u+w "' + path + '"）。',
      action: 'create',
      expected: missingExpected(),
      resolvedPath: path,
    })
  }
  return fail('io', '读写目标文件失败：' + messageOf(error), { action: 'create', expected: missingExpected(), resolvedPath: path })
}

function isReadOnlyTarget(targetPath: string): boolean {
  let mode = 0
  try {
    const stat = statSync(targetPath)
    mode = stat.mode
    if (!stat.isFile()) return false
  } catch {
    return false
  }
  if ((mode & 0o200) === 0) return true
  try {
    accessSync(targetPath, 4 /* W_OK */)
    return false
  } catch (error) {
    const code = ioCodeOf(error)
    return code === 'EACCES' || code === 'EPERM'
  }
}

function encodeTarget(text: string, hadBom: boolean): Buffer {
  const body = Buffer.from(text, 'utf8')
  if (!hadBom) return body
  return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), body])
}

function writeAtomicPreserveMode(targetPath: string, buf: Buffer, mode: number | undefined, beforeRename?: () => void): void {
  const dir = dirname(targetPath)
  mkdirSync(dir, { recursive: true })
  const tmp = join(dir, '.dsh-dream-' + process.pid + '-' + randomUUID() + '.tmp')
  try {
    const fd = openSync(tmp, 'wx')
    try {
      writeFileSync(fd, buf)
      if (mode !== undefined) chmodSync(tmp, mode)
      fsyncSync(fd)
    } finally { closeSync(fd) }
    beforeRename?.()
    renameSync(tmp, targetPath)
  } catch (error) {
    try {
      rmSync(tmp, { force: true })
    } catch {
      // 清理失败不覆盖原始错误
    }
    throw error
  }
}

// ---------- 计划与 diff ----------

function planBridgeWrite(state: TargetState, block: string): { ok: true; plan: BridgeWritePlan } | BridgeFailure {
  if (!state.exists) {
    return { ok: true, plan: { action: 'create', nextText: block, unchanged: false, separator: '', previousBlock: null } }
  }
  const located = locateDreamBlock(state.text)
  if (located.status === 'broken') {
    return fail('marker', '管理块标记异常，拒绝写入：' + located.message, { line: located.line })
  }
  if (located.status === 'none') {
    let separator = ''
    if (state.text !== '') {
      separator = state.text.endsWith('\n') ? state.eol : state.eol + state.eol
    }
    return { ok: true, plan: { action: 'append', nextText: state.text + separator + block, unchanged: false, separator, previousBlock: null } }
  }
  const nextText = state.text.slice(0, located.start) + block + state.text.slice(located.end)
  return {
    ok: true,
    plan: { action: 'replace', nextText, unchanged: nextText === state.text, separator: '', previousBlock: located.text },
  }
}

function unifiedDiff(before: string, after: string, label: string): string {
  if (before === after) return ''
  const a = before.split(/\r?\n/)
  const b = after.split(/\r?\n/)
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  const context = 3
  const from = Math.max(0, start - context)
  const toA = Math.min(a.length, endA + context)
  const toB = Math.min(b.length, endB + context)
  const lines = ['--- a/' + label, '+++ b/' + label, '@@ -' + (from + 1) + ',' + (toA - from) + ' +' + (from + 1) + ',' + (toB - from) + ' @@']
  for (let i = from; i < start; i++) lines.push(' ' + a[i])
  for (let i = start; i < endA; i++) lines.push('-' + a[i])
  for (let i = start; i < endB; i++) lines.push('+' + b[i])
  for (let i = endA; i < toA; i++) lines.push(' ' + a[i])
  return lines.join('\n')
}

function previewIdOf(targetPath: string, action: string, expectedSha256: string | null, block: string): string {
  return 'pvw_' + sha256(stableJson({ targetPath, action, expectedSha256: expectedSha256 === null ? '' : expectedSha256, block })).slice(0, 24)
}

// ---------- 应用记录 ----------

function recordsPathOf(journalDir: string): string {
  return join(journalDir, 'bridge', 'records.jsonl')
}

function appendBridgeRecord(journalDir: string, record: BridgeRecord): void {
  const file = recordsPathOf(journalDir)
  mkdirSync(dirname(file), { recursive: true })
  const fd = openSync(file, 'a')
  try {
    // 上次进程可能留下半行；不能把本次有效记录接到半行后面。
    const stat = statSync(file)
    if (stat.size > 0) {
      const bytes = readFileSync(file)
      if (bytes[bytes.length - 1] !== 10) writeSync(fd, '\n')
    }
    writeFileSync(fd, JSON.stringify(record) + '\n', 'utf8')
    fsyncSync(fd)
  } finally { closeSync(fd) }
}

function readBridgeRecords(journalDir: string): BridgeRecord[] {
  const file = recordsPathOf(journalDir)
  let text: string
  try { text = readFileSync(file, 'utf8') } catch { return [] }
  const found = new Map<string, BridgeRecord>()
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue
    try {
      const parsed: unknown = JSON.parse(line)
      if (parsed === null || typeof parsed !== 'object') continue
      const r = parsed as Record<string, unknown>
      if (r.schemaVersion !== 1 || typeof r.backupId !== 'string' || typeof r.at !== 'string' || typeof r.target !== 'string' || typeof r.projectRoot !== 'string') continue
      if (r.action !== 'create' && r.action !== 'replace' && r.action !== 'append') continue
      if (r.phase !== undefined && r.phase !== 'pending' && r.phase !== 'applied' && r.phase !== 'aborted') continue
      if ((r.beforeBlock !== null && typeof r.beforeBlock !== 'string') || typeof r.separator !== 'string' || typeof r.afterBlockSha256 !== 'string' || typeof r.afterFileSha256 !== 'string' || !Array.isArray(r.lessons)) continue
      found.set(r.backupId, parsed as BridgeRecord)
    } catch {
      // 坏行跳过，不阻断历史记录读取
    }
  }
  return [...found.values()]
}

function loadBridgeRecord(journalDir: string, backupId: string): BridgeRecord | undefined {
  return readBridgeRecords(journalDir).find(record => record.backupId === backupId)
}

// ---------- 桥接锁（多进程 apply 守卫） ----------

interface BridgeLockInfo {
  raw: string
  pid?: number
  ageMs: number
  alive?: boolean
}

function readBridgeLock(lockPath: string): BridgeLockInfo | undefined {
  let raw: string
  try {
    raw = readFileSync(lockPath, 'utf8')
  } catch {
    return undefined
  }
  let at = Date.now()
  try {
    at = statSync(lockPath).mtimeMs
  } catch {
    // 用 mtime 失败时退回 now
  }
  let pid: number | undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      if (typeof record.pid === 'number' && Number.isInteger(record.pid) && record.pid > 0) pid = record.pid
      if (typeof record.at === 'string') {
        const parsedAt = Date.parse(record.at)
        if (!Number.isNaN(parsedAt)) at = parsedAt
      }
    }
  } catch {
    // 内容损坏：只能按 mtime 判断
  }
  const alive = pid === undefined ? undefined : isProcessAlive(pid)
  return { raw, pid, ageMs: Date.now() - at, alive }
}

function acquireBridgeLock(lockPath: string): () => void {
  const token = randomUUID()
  const deadline = Date.now() + BRIDGE_LOCK_TIMEOUT_MS
  mkdirSync(dirname(lockPath), { recursive: true })
  for (;;) {
    let acquired = false
    try {
      const fd = openSync(lockPath, 'wx')
      try {
        writeSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString(), token, bootId: BRIDGE_BOOT_ID }))
      } finally {
        closeSync(fd)
      }
      acquired = true
    } catch (error) {
      if (ioCodeOf(error) !== 'EEXIST') throw error
    }
    if (acquired) {
      return () => {
        try {
          const parsed: unknown = JSON.parse(readFileSync(lockPath, 'utf8'))
          if (parsed === null || typeof parsed !== 'object' || (parsed as Record<string, unknown>).token !== token) return
        } catch {
          return
        }
        try {
          unlinkSync(lockPath)
        } catch {
          // 已被接管则保持现状
        }
      }
    }
    const info = readBridgeLock(lockPath)
    if (info !== undefined) {
      const stale = info.alive === false || (info.pid === undefined && info.ageMs > BRIDGE_LOCK_STALE_MS)
      if (stale) {
        const recheck = readBridgeLock(lockPath)
        if (recheck !== undefined && recheck.raw === info.raw) {
          try {
            unlinkSync(lockPath)
            continue
          } catch {
            // 抢占失败：走重试/超时
          }
        }
      }
    }
    if (Date.now() >= deadline) throw new Error('另一个桥接操作正在进行（锁：' + lockPath + '），请稍后重试。')
    sleepSync(25)
  }
}

// ---------- 三个模式 ----------

function normalizeScope(options: BridgeOptions): BridgeScope {
  const scope: BridgeScope = {}
  if (typeof options.projectId === 'string' && options.projectId.trim() !== '') scope.projectId = options.projectId
  if (typeof options.workspaceRoot === 'string' && options.workspaceRoot.trim() !== '') scope.workspaceRoot = options.workspaceRoot
  return scope
}

/** preview：只读计算 diff / expected / 管理块；绝不写盘。 */
export function previewBridge(options: BridgeOptions): BridgePreviewResult {
  if (options === null || typeof options !== 'object') {
    return fail('invalid', 'preview 需要 options 对象', { action: 'create', expected: missingExpected() })
  }
  const target = resolveBridgeTarget(options.projectRoot, options.path)
  if (!('ok' in target) || target.ok !== true) return target
  const read = readTargetState(target.target)
  if (!('ok' in read) || read.ok !== true) return withPreviewShape(read, target.target.path)
  const state = read.state
  const selection = selectBridgeLessons(Array.isArray(options.lessons) ? options.lessons : [], normalizeScope(options), {
    lessonIds: options.lessonIds,
    maxLessons: options.maxLessons,
  })
  const views = selection.eligible.map((lesson) => toView(lesson, options.maskSecrets !== false))
  const block = withEol(buildDreamBlock(views), state.eol)
  const planned = planBridgeWrite(state, block)
  if (!('ok' in planned) || planned.ok !== true) return withPreviewShape(planned, target.target.path, expectedOf(state))
  const expected = expectedOf(state)
  const action: BridgeAction = planned.plan.unchanged ? 'unchanged' : planned.plan.action
  return {
    ok: true,
    action,
    expected,
    resolvedPath: target.target.path,
    diff: unifiedDiff(state.text, planned.plan.nextText, basename(target.target.path)),
    lessons: views,
    skipped: selection.skipped,
    previewId: previewIdOf(target.target.path, planned.plan.action, expected.sha256, block),
    blockPreview: block,
  }
}

/** apply：必须带 expectedSha256；CAS 冲突 → conflict 零写入；只替换管理块。 */
export function applyBridge(options: BridgeApplyOptions): BridgeApplyResult {
  if (options === null || typeof options !== 'object') return fail('invalid', 'apply 需要 options 对象')
  if (typeof options.expectedSha256 !== 'string' && options.expectedSha256 !== null) {
    return fail('invalid', 'apply 必须提供 expectedSha256（preview.expected.sha256 原样回传即可；文件不存在时为 null）。', {
      action: 'create',
      expected: missingExpected(),
    })
  }
  let release: (() => void) | undefined
  try {
    if (typeof options.journalDir !== 'string' || options.journalDir.trim() === '') return fail('invalid', 'journalDir 必须是非空路径')
    release = acquireBridgeLock(join(options.journalDir, 'bridge', '.lock'))
    const target = resolveBridgeTarget(options.projectRoot, options.path)
    if (!('ok' in target) || target.ok !== true) return target
    const read = readTargetState(target.target)
    if (!('ok' in read) || read.ok !== true) return read
    const state = read.state

    const selection = selectBridgeLessons(Array.isArray(options.lessons) ? options.lessons : [], normalizeScope(options), {
      lessonIds: options.lessonIds,
      maxLessons: options.maxLessons,
    })
    const views = selection.eligible.map((lesson) => toView(lesson, options.maskSecrets !== false))
    const block = withEol(buildDreamBlock(views), state.eol)
    const planned = planBridgeWrite(state, block)
    if (!('ok' in planned) || planned.ok !== true) return planned
    const plan = planned.plan
    const expected = expectedOf(state)

    // ⑨ 幂等重试：当前管理块已经等于本次要写入的块 → 成功且 unchanged，字节不变。
    // 这不与并发冲突矛盾：只有"要么写不进去、要么没机会写"的情况才拒绝。
    if (plan.unchanged) {
      return {
        ok: true,
        action: 'unchanged',
        unchanged: true,
        file: expected,
        path: target.target.path,
        resolvedPath: target.target.path,
        lessons: views,
        skipped: selection.skipped,
      }
    }

    if (!stateMatchesExpected(state, options.expectedSha256)) {
      return fail('conflict', '目标文件已变化（expectedSha256 不符），已零写入；请重新 preview 后再 apply。', {
        action: plan.action,
        expected,
        resolvedPath: target.target.path,
        hint: '当前 sha256=' + (state.exists ? (state.sha256 ?? '').slice(0, 12) + '…' : '(文件不存在)'),
      })
    }
    const previewId = previewIdOf(target.target.path, plan.action, state.sha256, block)
    if (options.previewId !== undefined && options.previewId !== previewId) {
      return fail('preview-mismatch', 'previewId 与本次要写入的内容不匹配，拒绝 apply。', {
        action: plan.action,
        expected,
        resolvedPath: target.target.path,
        hint: '请重新 preview。',
      })
    }
    if (state.exists && isReadOnlyTarget(target.target.path)) {
      return fail('read-only', '目标文件是只读的，拒绝写入：' + target.target.path, {
        action: plan.action,
        expected,
        resolvedPath: target.target.path,
        hint: '取消只读属性后重试（Windows: attrib -R；Unix: chmod u+w）。',
      })
    }

    const buf = encodeTarget(plan.nextText, state.hadBom)
    const backupId = 'brg_' + randomUUID()
    const lessonsMeta = views.map((view) => ({ lessonId: view.lessonId, revision: view.revision }))
    const record: BridgeRecord = {
      schemaVersion: 1,
      backupId,
      at: new Date().toISOString(),
      target: target.target.path,
      projectRoot: target.target.projectRoot,
      action: plan.action,
      before: expected,
      beforeBlock: plan.previousBlock,
      separator: plan.separator,
      afterBlockSha256: sha256(block),
      afterFileSha256: sha256(buf),
      lessons: lessonsMeta,
      previewId,
      phase: 'pending',
    }

    // Write-ahead：恢复信息先 fsync；失败则目标字节仍完全不变。
    appendBridgeRecord(options.journalDir, record)
    try {
      writeAtomicPreserveMode(target.target.path, buf, state.mode, () => {
        const currentTarget = resolveBridgeTarget(options.projectRoot, options.path)
        const current = currentTarget.ok ? readTargetState(currentTarget.target) : currentTarget
        if (!currentTarget.ok || currentTarget.target.path !== target.target.path || !current.ok || !stateMatchesExpected(current.state, state.sha256)) {
          throw Object.assign(new Error('目标文件在写入准备期间发生变化，请重新预览。'), { code: 'DREAM_CONFLICT' })
        }
      })
    } catch (error) {
      try { appendBridgeRecord(options.journalDir, { ...record, phase: 'aborted' }) } catch { /* pending 可由当前文件状态识别为未完成 */ }
      if (ioCodeOf(error) === 'DREAM_CONFLICT') return fail('conflict', messageOf(error))
      return failFromIo(error, target.target.path)
    }
    let warning: string | undefined
    try {
      appendBridgeRecord(options.journalDir, { ...record, phase: 'applied' })
    } catch (error) {
      warning = '目标已应用，最终审计确认未能追加：' + messageOf(error) + '。恢复记录已保存，可用 backupId=' + backupId + ' 回滚。'
    }
    return {
      ok: true,
      action: plan.action,
      unchanged: false,
      backupId,
      file: { exists: true, sha256: sha256(buf), size: buf.length },
      path: target.target.path,
      resolvedPath: target.target.path,
      lessons: views,
      skipped: selection.skipped,
      previewId,
      ...(warning !== undefined ? { warning } : {}),
    }
  } catch (error) {
    return fail('io', messageOf(error), { action: 'create', expected: missingExpected() })
  } finally {
    if (release !== undefined) release()
  }
}

/** rollback：仅当当前管理块仍等于该次 apply 的结果时恢复原管理块。 */
export function rollbackBridge(options: BridgeRollbackOptions): BridgeRollbackResult {
  if (options === null || typeof options !== 'object' || typeof options.backupId !== 'string' || options.backupId.trim() === '') {
    return fail('invalid', 'rollback 需要非空 backupId')
  }
  let release: (() => void) | undefined
  try {
    if (typeof options.journalDir !== 'string' || options.journalDir.trim() === '') return fail('invalid', 'journalDir 必须是非空路径')
    release = acquireBridgeLock(join(options.journalDir, 'bridge', '.lock'))
    const record = loadBridgeRecord(options.journalDir, options.backupId)
    if (record === undefined) return fail('not-found', '找不到应用记录：' + options.backupId)
    if (record.phase === 'aborted') return fail('not-rollbackable', '这次应用未完成，目标没有写入。')

    const rootCheck = resolveBridgeTarget(record.projectRoot, 'AGENTS.md')
    if (!('ok' in rootCheck) || rootCheck.ok !== true) {
      return fail('not-rollbackable', '记录里的项目目录已不可用：' + record.projectRoot)
    }
    const targetRoot = rootCheck.target.projectRoot
    if (!isInside(targetRoot, record.target)) {
      return fail('not-rollbackable', '记录目标不在项目内，拒绝回滚：' + record.target)
    }
    const currentTarget = resolveBridgeTarget(targetRoot, record.target)
    if (!currentTarget.ok || currentTarget.target.path !== record.target) return fail('not-rollbackable', '目标路径已被重新链接，拒绝回滚。')
    if (options.projectRoot !== undefined && options.projectRoot.trim() !== '') {
      let requestedRoot: string
      try {
        requestedRoot = realpathSync(options.projectRoot)
      } catch (error) {
        return fail('invalid', '无法解析 projectRoot：' + messageOf(error))
      }
      if (requestedRoot !== targetRoot) return fail('not-rollbackable', 'projectRoot 与该应用记录不一致，拒绝回滚。')
    }
    if (typeof options.path === 'string' && options.path.trim() !== '') {
      const requested = resolveBridgeTarget(targetRoot, options.path)
      if (!('ok' in requested) || requested.ok !== true) return requested
      if (requested.target.path !== record.target) return fail('not-rollbackable', '目标路径与该应用记录不一致，拒绝回滚。')
    }

    const read = readTargetState({ path: record.target, projectRoot: targetRoot, lexical: record.target })
    if (!('ok' in read) || read.ok !== true) return read
    const state = read.state
    if (!state.exists) return fail('conflict', '目标文件已不存在，拒绝回滚。', { hint: '该 apply 曾被外部删除或移动。' })
    const located = locateDreamBlock(state.text)
    if (located.status === 'broken') return fail('marker', '当前文件管理块标记异常，拒绝回滚：' + located.message, { line: located.line })
    if (located.status === 'none') return fail('conflict', '当前文件已没有 Dream 管理块，拒绝回滚（可能已被人工移除）。')

    const currentBlockSha = sha256(Buffer.from(located.text, 'utf8'))
    if (currentBlockSha !== record.afterBlockSha256) {
      return fail('conflict', '当前管理块已被外部修改，拒绝回滚（不会覆盖人工改动）。', {
        hint: '如确需恢复，请重新 preview/apply，而不是强制 rollback。',
      })
    }
    if (isReadOnlyTarget(record.target)) {
      return fail('read-only', '目标文件是只读的，拒绝回滚：' + record.target, { hint: '取消只读属性后重试。' })
    }

    let nextText: string
    if (record.beforeBlock === null) {
      let start = located.start
      if (record.separator !== '' && state.text.slice(0, start).endsWith(record.separator)) {
        start -= record.separator.length
      }
      nextText = state.text.slice(0, start) + state.text.slice(located.end)
    } else {
      nextText = state.text.slice(0, located.start) + record.beforeBlock + state.text.slice(located.end)
    }

    if (record.action === 'create' && record.beforeBlock === null && nextText === '') {
      try {
        unlinkSync(record.target)
      } catch (error) {
        return failFromIo(error, record.target)
      }
      return { ok: true, backupId: record.backupId, file: { exists: false, sha256: null, size: 0 }, path: record.target, resolvedPath: record.target }
    }

    const buf = encodeTarget(nextText, state.hadBom)
    try {
      writeAtomicPreserveMode(record.target, buf, state.mode)
    } catch (error) {
      return failFromIo(error, record.target)
    }
    return { ok: true, backupId: record.backupId, file: { exists: true, sha256: sha256(buf), size: buf.length }, path: record.target, resolvedPath: record.target }
  } catch (error) {
    return fail('io', messageOf(error))
  } finally {
    if (release !== undefined) release()
  }
}

// ---------- 应用记录只读视图（面板用） ----------

export interface BridgeApplicationView {
  backupId: string
  at: string
  target: string
  action: 'create' | 'replace' | 'append'
  lessons: Array<{ lessonId: string; revision: number }>
  beforeSha256: string | null
  afterSha256: string
  rollbackable: boolean
  rollbackReason?: string
}

/**
 * 只读列出应用记录（按 at 降序）。目录/文件缺失返回 []，绝不写盘。
 * rollbackable 在桥接层按当前文件的管理块重算，供面板直接展示。
 */
export function listBridgeApplications(journalDir: string): BridgeApplicationView[] {
  if (typeof journalDir !== 'string' || journalDir.trim() === '') return []
  const records = readBridgeRecords(journalDir)
  records.sort((a, b) => (a.at === b.at ? b.backupId.localeCompare(a.backupId) : b.at.localeCompare(a.at)))
  return records.map((record) => {
    let rollbackable = false
    let rollbackReason: string | undefined
    try {
      const resolved = resolveBridgeTarget(record.projectRoot, record.target)
      if (record.phase === 'aborted') throw new Error('应用未完成')
      if (!resolved.ok || resolved.target.path !== record.target) throw new Error('目标路径已被重新链接')
      const read = readTargetState({ path: record.target, projectRoot: record.projectRoot, lexical: record.target })
      if (!('ok' in read) || read.ok !== true) {
        rollbackReason = '目标文件不可读'
      } else if (!read.state.exists) {
        rollbackReason = '文件不存在'
      } else {
        const located = locateDreamBlock(read.state.text)
        if (located.status === 'broken') rollbackReason = '管理块标记异常'
        else if (located.status === 'none') rollbackReason = '管理块已被移除'
        else if (sha256(Buffer.from(located.text, 'utf8')) !== record.afterBlockSha256) rollbackReason = '管理块已被外部修改'
        else rollbackable = true
      }
    } catch (error) {
      rollbackReason = messageOf(error)
    }
    const view: BridgeApplicationView = {
      backupId: record.backupId,
      at: record.at,
      target: record.target,
      action: record.action,
      lessons: Array.isArray(record.lessons) ? record.lessons.map((item) => ({ lessonId: String(item.lessonId), revision: Number(item.revision) })) : [],
      beforeSha256: typeof record.before === 'object' && record.before !== null && typeof (record.before as unknown as Record<string, unknown>).sha256 === 'string'
        ? String((record.before as unknown as Record<string, unknown>).sha256)
        : null,
      afterSha256: record.afterFileSha256,
      rollbackable,
    }
    if (rollbackReason !== undefined) view.rollbackReason = rollbackReason
    return view
  })
}

// ---------- legacy（0.5.x 直写；保留一期） ----------

/** 旧版标记块起始行（历史文件用；新流程不碰它）。 */
export const BRIDGE_START = '<!-- dsh-dream:lessons:start（自动生成，请勿手工编辑块内内容） -->'
/** 旧版标记块结束行。 */
export const BRIDGE_END = '<!-- dsh-dream:lessons:end -->'

/** 生成教训块文本（legacy）。 */
export function buildLessonsBlock(lessons: Array<{ lesson: string; count: number }>): string {
  const lines = [BRIDGE_START, '', '## 梦境沉淀（dsh-dream 自动生成）', '']
  for (const item of lessons) {
    lines.push('- ' + maskSecrets(item.lesson) + (item.count > 1 ? '（反复梦到 ' + item.count + ' 次）' : ''))
  }
  lines.push('', BRIDGE_END)
  return lines.join('\n')
}

/**
 * legacy：把梦境教训合并进目标文件（0.5.x 行为，直接写；新代码请用 preview/apply）。
 * @returns 动作类型与写入的教训数。
 */
export function bridgeDreams(journalDir: string, targetPath: string, maxLessons: number): { action: 'created' | 'replaced' | 'appended'; lessonsCount: number } {
  const stats = dreamStats(journalDir)
  if (stats.total === 0) {
    throw new Error('还没有做过梦：请先用 dream_digest + dream_save 做梦，再来桥接记忆。')
  }
  const lessons = stats.topLessons.slice(0, maxLessons)
  const block = buildLessonsBlock(lessons)
  if (!existsSync(targetPath)) {
    mkdirSync(dirname(targetPath), { recursive: true })
    writeFileSync(targetPath, block + '\n', 'utf8')
    return { action: 'created', lessonsCount: lessons.length }
  }
  const current = readFileSync(targetPath, 'utf8')
  const startIdx = current.indexOf(BRIDGE_START)
  const endIdx = current.indexOf(BRIDGE_END)
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const next = current.slice(0, startIdx) + block + current.slice(endIdx + BRIDGE_END.length)
    writeFileSync(targetPath, next, 'utf8')
    return { action: 'replaced', lessonsCount: lessons.length }
  }
  writeFileSync(targetPath, current.replace(/\s*$/, '') + '\n\n' + block + '\n', 'utf8')
  return { action: 'appended', lessonsCount: lessons.length }
}
