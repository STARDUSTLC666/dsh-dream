/**
 * DeepSeek Harness 0.2.2-rc.3 原生信号归因、文件路径提取与完成前软门控纯函数。
 *
 * 硬性约束：
 * - 零外部运行时依赖（绝不 import `@deepseek-ai/*`）；
 * - 观测统计只写入 `automatic/state.json`，绝不修改经验审阅状态或自动晋升候选；
 * - 所有持久化文本统一经过 `maskSecrets` 并做长度裁剪。
 *
 * @module dsh-dream/dsh-signals
 */
import { randomUUID } from 'node:crypto'
import { isAbsolute, posix, win32 } from 'node:path'
import type { ResolvedDreamConfig } from './config.js'
import { normalizeRelativeLessonFile, type Lesson } from './knowledge.js'
import { maskSecrets } from './mask.js'
import { isHumanAccepted, needsMemoryReview } from './memory.js'
import { updateAutomaticState, type LessonObservation } from './automatic-state.js'

/** `systemPrompt.context` 中由 dsh-dream 注入的运行时上下文段名。 */
export const DREAM_CONTEXT_SECTION_NAME = 'dsh-dream-reviewed-memory'

/** DSH `notice` 摘要长度硬上限（对齐 `@deepseek-ai/dsh-llm` `CONTEXT_SUMMARY_MAX_CHARS`）。 */
export const DREAM_GATE_SUMMARY_MAX_CHARS = 120

/** 单次经验回用后的观测信号。 */
export interface ObservationSignal {
  kind: 'positive' | 'negative' | 'correction' | 'repeat-tool'
  model?: string
  category?: string
  note?: string
}

/** 符合 DSH `UserMessage` 形状的完成前单次软门控提示消息。 */
export interface VerificationGateMessage {
  readonly id: string
  readonly role: 'user'
  readonly content: ReadonlyArray<{ readonly type: 'text'; readonly text: string }>
  readonly source: {
    readonly kind: 'dsh-dream-gate'
    readonly form: 'notice'
    readonly summary: string
  }
}

const FILE_TOOL_NAMES = new Set([
  'read',
  'read_image',
  'write',
  'edit',
  'apply_patch',
  'str_replace_editor',
  'delete',
  'multi_edit',
  'notebook_edit',
  'patch',
  'view',
  'create',
  'replace_file_content',
])

const MUTATING_FILE_TOOL_NAMES = new Set([
  'write',
  'edit',
  'apply_patch',
  'str_replace_editor',
  'delete',
  'multi_edit',
  'notebook_edit',
  'patch',
  'create',
  'replace_file_content',
])

const VERIFICATION_CUE = /\b(?:verif\w*|test\w*|check\w*|lint|build|typecheck|tsc|assert\w*|validat\w*|boundary|failure|prevent\w*|regression|before\s+(?:finish\w*|complet\w*|commit\w*|submit\w*|done)|must\s+not|never|avoid)\b|校验|验证|测试|检查|构建|编译|回归|边界|失败|避免|禁止|不要|提交前|完成前|交付前/i

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function normPath(value: string): string {
  const slash = value.trim().replace(/\\/g, '/').replace(/\/+$/, '')
  return /^[a-zA-Z]:/.test(slash) || value.includes('\\') ? slash.toLowerCase() : slash
}

function samePath(a: string, b: string): boolean {
  const ka = normPath(a)
  const kb = normPath(b)
  return ka !== '' && ka === kb
}

function clipMasked(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const masked = maskSecrets(trimmed).replace(/\s+/g, ' ').trim()
  if (masked === '') return undefined
  return masked.length > max ? masked.slice(0, max).trim() || undefined : masked
}

function parseTimestamp(now?: number | string): number {
  if (typeof now === 'number' && Number.isSafeInteger(now) && now >= 0) return now
  if (typeof now === 'number' && Number.isFinite(now) && now >= 0) return Math.floor(now)
  if (typeof now === 'string' && now.trim() !== '') {
    const parsed = Date.parse(now)
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed)
  }
  return Date.now()
}

function parseLessonIdsFromText(text: string): string[] {
  if (typeof text !== 'string' || text.trim() === '') return []
  const ids: string[] = []
  const pushId = (raw: unknown): void => {
    if (typeof raw !== 'string') return
    const value = raw.trim()
    if (value.length > 0 && value.length <= 200 && !ids.includes(value)) ids.push(value)
  }
  const collect = (parsed: unknown): boolean => {
    if (Array.isArray(parsed)) {
      let found = false
      for (const entry of parsed) {
        const rec = asRecord(entry)
        const id = rec.lessonId ?? rec.id
        if (typeof id === 'string' && id.trim() !== '') {
          pushId(id)
          found = true
        }
      }
      return found
    }
    const rec = asRecord(parsed)
    if (Array.isArray(rec.lessons)) return collect(rec.lessons)
    return false
  }

  const trimmed = text.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      if (collect(JSON.parse(trimmed))) return ids
    } catch {
      // Fall through to substring scanning below.
    }
  }

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch !== '[' && ch !== '{') continue
    const tail = text.slice(i).trim()
    try {
      if (collect(JSON.parse(tail))) return ids
    } catch {
      const close = ch === '[' ? ']' : '}'
      const lastClose = tail.lastIndexOf(close)
      if (lastClose > 0) {
        try {
          if (collect(JSON.parse(tail.slice(0, lastClose + 1)))) return ids
        } catch {
          // Keep scanning.
        }
      }
    }
  }

  const re = /"(?:lessonId|id)"\s*:\s*"([^"]+)"/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    pushId(match[1])
  }
  return ids
}

function contentTextOf(data: Record<string, unknown>): string {
  const content = data.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        const rec = asRecord(block)
        return rec.type === 'text' && typeof rec.text === 'string' ? rec.text : ''
      })
      .join('\n')
  }
  return typeof data.text === 'string' ? data.text : ''
}

function extractFromRuntimeContextData(data: Record<string, unknown>): string[] {
  const source = asRecord(data.source)
  if (Array.isArray(source.sections)) {
    const section = source.sections.find((entry) => asRecord(entry).name === DREAM_CONTEXT_SECTION_NAME)
    if (section === undefined) return []
    const text = asRecord(section).text
    return typeof text === 'string' ? parseLessonIdsFromText(text) : []
  }
  const text = contentTextOf(data)
  if (!text.includes('Dream reviewed memory') && !text.includes(DREAM_CONTEXT_SECTION_NAME)) return []
  return parseLessonIdsFromText(text)
}

/**
 * 从会话事件流中提取 `runtime-context` 快照里实际注入的 Dream 经验 ID 列表。
 *
 * 若提供 `targetAssistantMsgId`，返回该助手消息之前最近一次 `runtime-context` 快照中的
 * `dsh-dream-reviewed-memory` 经验 ID（目标消息不存在时返回空数组）；未提供时返回全流最新快照。
 */
export function extractInjectedDreamLessonIds(
  events: readonly unknown[],
  targetAssistantMsgId?: string,
): string[] {
  if (!Array.isArray(events) || events.length === 0) return []
  const target = typeof targetAssistantMsgId === 'string' && targetAssistantMsgId.trim() !== ''
    ? targetAssistantMsgId.trim()
    : undefined
  let latestIds: string[] = []
  for (const rawEvent of events) {
    const event = asRecord(rawEvent)
    const type = event.type
    const data = asRecord(event.data)
    if (type === 'user/message') {
      const source = asRecord(data.source)
      if (source.kind === 'runtime-context') {
        latestIds = extractFromRuntimeContextData(data)
      }
      continue
    }
    if (target !== undefined && type === 'assistant/message') {
      const msg = asRecord(data.message)
      const msgId = typeof msg.id === 'string' ? msg.id : typeof data.id === 'string' ? data.id : undefined
      if (msgId === target) return [...latestIds]
    }
  }
  return target === undefined ? [...latestIds] : []
}

/** 从会话事件流提取目标助手消息（或最近请求）对应的模型 ID。 */
export function extractAssistantMessageModel(
  events: readonly unknown[],
  targetAssistantMsgId?: string,
): string | undefined {
  if (!Array.isArray(events) || events.length === 0) return undefined
  const target = typeof targetAssistantMsgId === 'string' && targetAssistantMsgId.trim() !== ''
    ? targetAssistantMsgId.trim()
    : undefined
  let latestModel: string | undefined
  for (const rawEvent of events) {
    const event = asRecord(rawEvent)
    const type = event.type
    const data = asRecord(event.data)
    if (type === 'request/context' || type === 'model/selection') {
      if (typeof data.model === 'string' && data.model.trim() !== '') latestModel = data.model.trim()
    } else if (type === 'request/header') {
      const config = asRecord(asRecord(data.header).config)
      if (typeof config.model === 'string' && config.model.trim() !== '') latestModel = config.model.trim()
    } else if (type === 'assistant/message') {
      const msg = asRecord(data.message)
      const source = asRecord(msg.source)
      const model = typeof source.model === 'string' && source.model.trim() !== ''
        ? source.model.trim()
        : latestModel
      if (model !== undefined) latestModel = model
      if (target !== undefined) {
        const msgId = typeof msg.id === 'string' ? msg.id : typeof data.id === 'string' ? data.id : undefined
        if (msgId === target) return model
      }
    }
  }
  return target === undefined ? latestModel : undefined
}

/**
 * 将 DSH 原生反馈/纠正/重复工具观测写入 `automatic/state.json`。
 * 绝不抛错，绝不修改 `KnowledgeStore` 或任何经验的人工审阅状态。
 */
export function recordLessonObservation(
  cfg: ResolvedDreamConfig,
  lessonIds: readonly string[],
  signal: ObservationSignal,
  now?: number | string,
): void {
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) return
  if (!['positive', 'negative', 'correction', 'repeat-tool'].includes(signal?.kind)) return
  const uniqueIds: string[] = []
  for (const raw of lessonIds) {
    if (typeof raw !== 'string') continue
    const id = raw.trim()
    if (id.length > 0 && id.length <= 200 && !uniqueIds.includes(id)) uniqueIds.push(id)
  }
  if (uniqueIds.length === 0) return

  const ts = parseTimestamp(now)
  const model = clipMasked(signal.model, 200)
  const category = clipMasked(signal.category, 80)
  const note = clipMasked(signal.note, 500)

  try {
    updateAutomaticState(cfg, (state) => {
      state.observations ??= {}
      for (const id of uniqueIds) {
        let entry: LessonObservation | undefined = state.observations[id]
        if (entry === undefined) {
          const keys = Object.keys(state.observations)
          if (keys.length >= 2000) delete state.observations[keys[0]]
          entry = {
            positive: 0,
            negative: 0,
            corrections: 0,
            repeatToolHits: 0,
            lastAt: ts,
          }
          state.observations[id] = entry
        }
        switch (signal.kind) {
          case 'positive':
            entry.positive += 1
            break
          case 'negative':
            entry.negative += 1
            break
          case 'correction':
            entry.corrections += 1
            break
          case 'repeat-tool':
            entry.repeatToolHits += 1
            break
        }
        entry.lastAt = ts
        if (model !== undefined) entry.lastModel = model
        if (category !== undefined) entry.lastCategory = category
        if (note !== undefined) entry.lastNote = note
      }
    }, ts)
  } catch {
    // Fail-closed: observing runtime signals must never throw or block host turns.
  }
}

/** 将相对或绝对路径归一化为工作区内相对路径（脱敏且拒绝越界路径）。 */
export function normalizePathToWorkspace(rawPath: string, cwd?: string): string | undefined {
  if (typeof rawPath !== 'string') return undefined
  const trimmed = rawPath.trim()
  if (trimmed === '' || trimmed.length > 1024 || /[\x00-\x1f]/.test(trimmed)) return undefined

  let candidate = trimmed
  const windowsLike = /^[a-zA-Z]:/.test(trimmed) || trimmed.includes('\\')
    || (typeof cwd === 'string' && (/^[a-zA-Z]:/.test(cwd) || cwd.includes('\\')))

  if (isAbsolute(trimmed) || win32.isAbsolute(trimmed)) {
    if (typeof cwd !== 'string' || cwd.trim() === '' || (!isAbsolute(cwd) && !win32.isAbsolute(cwd))) {
      return undefined
    }
    if (windowsLike) {
      const normalizedCwd = cwd.replace(/\//g, '\\')
      const normalizedTarget = trimmed.replace(/\//g, '\\')
      // Match drive letters case-insensitively on Windows before computing relative path.
      const cwdDrive = /^[a-zA-Z]:/.exec(normalizedCwd)?.[0]
      const targetDrive = /^[a-zA-Z]:/.exec(normalizedTarget)?.[0]
      const alignedTarget = cwdDrive && targetDrive && cwdDrive.toLowerCase() === targetDrive.toLowerCase()
        ? cwdDrive + normalizedTarget.slice(2)
        : normalizedTarget
      candidate = win32.relative(normalizedCwd, alignedTarget)
    } else {
      candidate = posix.relative(cwd, trimmed)
    }
    if (candidate === '' || candidate === '.') return undefined
  } else if (typeof cwd === 'string' && cwd.trim() !== '' && candidate.startsWith('./')) {
    candidate = candidate.slice(2)
  } else if (typeof cwd === 'string' && cwd.trim() !== '' && candidate.startsWith('.\\')) {
    candidate = candidate.slice(2)
  }

  const normalized = normalizeRelativeLessonFile(candidate)
  if (normalized === undefined) return undefined
  const masked = maskSecrets(normalized)
  return normalizeRelativeLessonFile(masked)
}

function parsePatchFilePaths(patchText: string): string[] {
  const paths: string[] = []
  const add = (value: string) => {
    const trimmed = value.trim().replace(/^["']|["']$/g, '')
    if (trimmed !== '' && trimmed !== '/dev/null' && !paths.includes(trimmed)) paths.push(trimmed)
  }
  for (const line of patchText.split(/\r?\n/)) {
    const applyMatch = /^\*\*\*\s+(?:(?:Update|Add|Delete)\s+File|Move\s+to(?:\s+File)?):\s+(.+)$/i.exec(line)
    if (applyMatch !== null) {
      add(applyMatch[1])
      continue
    }
    const diffMatch = /^(?:\+\+\+|---)\s+(?:[ab]\/)?(.+)$/.exec(line)
    if (diffMatch !== null && !diffMatch[1].startsWith('/dev/null')) {
      add(diffMatch[1].split('\t', 1)[0])
    }
  }
  return paths
}

function parseToolArgs(rawArgs: unknown): Record<string, unknown> {
  if (typeof rawArgs === 'string') {
    const trimmed = rawArgs.trim()
    if (trimmed.startsWith('{')) {
      try {
        return asRecord(JSON.parse(trimmed))
      } catch {
        return {}
      }
    }
    return {}
  }
  return asRecord(rawArgs)
}

/**
 * 判断工具调用是否属于文件修改类操作（用于区分只读问答轮与真实改文件轮）。
 * 对 `str_replace_editor` 这类读写复合工具，传入 `rawArgs` 时将 `command: 'view'` 识别为只读；
 * 未传 `rawArgs` 时保持向后兼容，按默认修改类工具处理。
 */
export function isMutatingFileTool(toolName: unknown, rawArgs?: unknown): boolean {
  if (typeof toolName !== 'string') return false
  const name = toolName.trim().toLowerCase()
  if (!MUTATING_FILE_TOOL_NAMES.has(name)) return false
  if (name === 'str_replace_editor' && rawArgs !== undefined) {
    const args = parseToolArgs(rawArgs)
    const cmd = typeof args.command === 'string' ? args.command.trim().toLowerCase() : ''
    if (cmd === 'view') return false
  }
  return true
}

/** 从一次工具执行对象提取全部工作区内相对文件路径（仅路径，不含正文）。 */
export function extractToolFilePaths(exec: unknown, cwd?: string): string[] {
  const rec = asRecord(exec)
  const name = typeof rec.name === 'string' ? rec.name.trim().toLowerCase() : ''
  if (!FILE_TOOL_NAMES.has(name)) return []
  const args = parseToolArgs(rec.arguments)
  const rawPaths: string[] = []

  for (const key of ['file_path', 'filePath', 'path', 'target_file', 'targetPath', 'file', 'notebook_path']) {
    if (typeof args[key] === 'string' && args[key].trim() !== '') rawPaths.push(args[key])
  }
  if (Array.isArray(args.files)) {
    for (const item of args.files) {
      if (typeof item === 'string' && item.trim() !== '') rawPaths.push(item)
      else {
        const entry = asRecord(item)
        const nested = entry.file_path ?? entry.path ?? entry.filePath
        if (typeof nested === 'string' && nested.trim() !== '') rawPaths.push(nested)
      }
    }
  }
  if (name === 'apply_patch' || name === 'patch') {
    for (const key of ['patch', 'input', 'diff', 'patchText']) {
      if (typeof args[key] === 'string' && args[key].trim() !== '') {
        rawPaths.push(...parsePatchFilePaths(args[key]))
      }
    }
  }

  const out: string[] = []
  for (const raw of rawPaths) {
    const rel = normalizePathToWorkspace(raw, cwd)
    if (rel !== undefined && !out.includes(rel)) out.push(rel)
    if (out.length >= 20) break
  }
  return out
}

/** 从文件类工具执行对象提取单个工作区内相对文件路径。 */
export function extractToolFilePath(exec: unknown, cwd?: string): string | undefined {
  return extractToolFilePaths(exec, cwd)[0]
}

function normalizeActiveFileSet(files: readonly string[]): string[] {
  const out: string[] = []
  for (const raw of files) {
    if (typeof raw !== 'string') continue
    const normalized = normalizeRelativeLessonFile(raw)
    if (normalized !== undefined) {
      const lowered = normalized.toLowerCase()
      if (!out.includes(lowered)) out.push(lowered)
    }
  }
  return out
}

function countFileHits(lesson: Lesson, activeFiles: readonly string[]): number {
  if (activeFiles.length === 0 || !Array.isArray(lesson.files) || lesson.files.length === 0) return 0
  let hits = 0
  for (const raw of lesson.files) {
    const file = raw.toLowerCase()
    if (activeFiles.some((active) => active === file || active.endsWith('/' + file) || file.endsWith('/' + active))) {
      hits += 1
    }
  }
  return hits
}

function lessonMatchesWorkspace(
  lesson: Lesson,
  opts: { workspaceId?: string; workspaceRoot?: string; projectId?: string },
): boolean {
  if (lesson.scope.global === true) return true
  const wsId = typeof opts.workspaceId === 'string' && opts.workspaceId.trim() !== '' ? opts.workspaceId.trim() : undefined
  const projId = typeof opts.projectId === 'string' && opts.projectId.trim() !== '' ? opts.projectId.trim() : undefined
  const wsRoot = typeof opts.workspaceRoot === 'string' && opts.workspaceRoot.trim() !== '' ? opts.workspaceRoot.trim() : undefined
  if (wsId !== undefined) {
    if (lesson.scope.projectId === wsId) return true
    if (lesson.scope.workspaceRoot !== undefined && samePath(lesson.scope.workspaceRoot, wsId)) return true
  }
  if (projId !== undefined && lesson.scope.projectId === projId) return true
  if (wsRoot !== undefined && lesson.scope.workspaceRoot !== undefined && samePath(lesson.scope.workspaceRoot, wsRoot)) {
    return true
  }
  return false
}

/**
 * 为完成前单次软门控筛选高价值已采纳经验（仅限 `review.actor === 'human'` 的 `usable` 规则）。
 * 优先匹配本轮改动文件、`prevents` 签名以及校验/边界/避坑类规则。
 */
export function selectVerificationGateLessons(
  lessons: readonly Lesson[],
  opts: {
    workspaceId?: string
    workspaceRoot?: string
    projectId?: string
    activeFiles: readonly string[]
    limit?: number
    now?: number
  },
): Lesson[] {
  const limit = typeof opts.limit === 'number' && Number.isInteger(opts.limit) && opts.limit > 0
    ? Math.min(10, opts.limit)
    : 4
  const now = opts.now ?? Date.now()
  const activeFiles = normalizeActiveFileSet(opts.activeFiles ?? [])

  const scored: Array<{ lesson: Lesson; score: number }> = []
  for (const lesson of lessons) {
    if (!isHumanAccepted(lesson) || needsMemoryReview(lesson, now)) continue
    if (!lessonMatchesWorkspace(lesson, opts)) continue

    const fileHits = countFileHits(lesson, activeFiles)
    const hasPrevents = typeof lesson.prevents === 'string' && lesson.prevents.trim() !== ''
    const kindStr = String(lesson.kind)
    const isHighRiskKind = kindStr === 'pitfall'
      || kindStr === 'verification-rule'
      || kindStr === 'boundary'
      || kindStr === 'failure-pattern'
    const isProcedure = kindStr === 'procedure'
    const textForCue = [lesson.title, lesson.action, lesson.when, lesson.prevents ?? '', lesson.problemKey ?? ''].join(' ')
    const hasVerificationCue = VERIFICATION_CUE.test(textForCue)

    // Exclude generic preferences/facts unless directly bound to a changed file or carrying a prevents/verification rule.
    if (fileHits === 0 && !hasPrevents && !isHighRiskKind && !(isProcedure && hasVerificationCue)) {
      continue
    }

    let score = 0
    if (fileHits > 0) score += 50 + Math.min(20, fileHits * 10)
    if (hasPrevents) score += 25
    if (isHighRiskKind) score += 20
    else if (isProcedure) score += 15
    if (hasVerificationCue) score += 15
    if (!lesson.scope.global) score += 5
    scored.push({ lesson, score })
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    if (a.lesson.independentSupportCount !== b.lesson.independentSupportCount) {
      return b.lesson.independentSupportCount - a.lesson.independentSupportCount
    }
    if (a.lesson.updatedAt !== b.lesson.updatedAt) {
      return b.lesson.updatedAt.localeCompare(a.lesson.updatedAt)
    }
    return a.lesson.id.localeCompare(b.lesson.id)
  })

  return scored.slice(0, limit).map((entry) => entry.lesson)
}

function boundNoticeSummary(raw: string): string {
  const clean = maskSecrets(raw).replace(/\s+/g, ' ').trim()
  if (clean.length <= DREAM_GATE_SUMMARY_MAX_CHARS) return clean
  return clean.slice(0, DREAM_GATE_SUMMARY_MAX_CHARS - 1) + '…'
}

/**
 * 构造符合 DSH `UserMessage`（`source.form = 'notice'`、`summary <= 120` 字符）的完成前自检提示。
 */
export function buildVerificationGateMessage(
  lessons: readonly Lesson[],
  changedFiles: readonly string[],
): VerificationGateMessage {
  const safeFiles = changedFiles
    .map((file) => normalizeRelativeLessonFile(maskSecrets(file)) ?? maskSecrets(file).trim())
    .filter((file) => file.length > 0)
    .slice(0, 8)
  const fileLine = safeFiles.length > 0
    ? `Changed files (${changedFiles.length}): ${safeFiles.join(', ')}${changedFiles.length > safeFiles.length ? ' …' : ''}`
    : 'Files were modified in this turn.'

  const rulesText = lessons.map((lesson, index) => {
    const parts = [
      `${index + 1}. [${lesson.id}] ${maskSecrets(lesson.title)}`,
      `   - When: ${maskSecrets(lesson.when)}`,
      `   - Check: ${maskSecrets(lesson.action)}`,
    ]
    if (lesson.prevents) parts.push(`   - Prevents: ${maskSecrets(lesson.prevents)}`)
    if (lesson.exceptions.length > 0) {
      parts.push(`   - Exceptions: ${lesson.exceptions.map((ex) => maskSecrets(ex)).join('; ')}`)
    }
    return parts.join('\n')
  }).join('\n')

  const text = [
    'Dream verification gate (one-time pre-completion check against human-reviewed project rules).',
    fileLine,
    'Before concluding this turn, verify whether the following accepted rules apply to your changes; if already satisfied or inapplicable, state so briefly and finish:',
    rulesText,
  ].join('\n')

  const summary = boundNoticeSummary(
    `Dream gate: check ${lessons.length} reviewed rule(s) for ${changedFiles.length} changed file(s)`,
  )

  return {
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text }],
    source: {
      kind: 'dsh-dream-gate',
      form: 'notice',
      summary,
    },
  }
}
