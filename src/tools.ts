/**
 * 五个面向模型的做梦工具：dream_digest / dream_save / dream_journal / dream_recall / dream_health。
 *
 * @module dsh-dream/tools
 */
import { existsSync } from 'node:fs'
import { type ResolvedDreamConfig } from './config.js'
import { readDreams, saveDream, searchDreams } from './journal.js'
import { digestSessionFile, listSessionFiles, type SessionDigest } from './sessions.js'

/** 模型可见的内容块。 */
export interface ContentBlock {
  type: 'text'
  text: string
}

/** 注册给 ctx.tools.register 的原始工具定义。 */
export interface DreamToolDefinition {
  name: string
  description: string
  parameters: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
  output: {
    schema: Record<string, unknown>
    render(args: unknown, value: unknown): ContentBlock[]
  }
  execute(args: unknown, exec: unknown): Promise<unknown>
  timeoutMs?: number
}

function compileParameters(spec: Record<string, any>): { type: 'object'; properties: Record<string, unknown>; required?: string[] } {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  for (const [key, prop] of Object.entries(spec)) {
    if (prop?.required === true) required.push(key)
    const node: Record<string, unknown> = {}
    if (typeof prop?.type === 'string') node.type = prop.type
    if (typeof prop?.description === 'string') node.description = prop.description
    if (prop?.type === 'array' && typeof prop.items === 'object') node.items = { type: 'string' }
    properties[key] = node
  }
  return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function requiredString(args: Record<string, unknown>, key: string, label: string): string {
  const value = optionalString(args, key)
  if (value === undefined) throw new Error(label + '（参数 ' + key + '）为必填，请提供非空字符串。')
  return value
}

function stringArray(args: Record<string, unknown>, key: string): string[] {
  const value = args[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map((item) => item.trim())
}

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…（已截断）' : text
}

const baseSchema = { type: 'object', additionalProperties: true } as const

/** 构建五个做梦工具。 */
export function buildDreamTools(config: ResolvedDreamConfig): DreamToolDefinition[] {
  const cfg = config

  const dreamDigest: DreamToolDefinition = {
    name: 'dream_digest',
    description: '入梦：回放最近会话的梦原料。读取 DSH 会话日志（多帧 zstd），返回最近 N 个会话的标题、轮数、用户原话摘录、助手结论尾段与工具足迹；自动跳过子代理会话。拿到摘要后请反思并用 dream_save 记梦。',
    parameters: compileParameters({
      maxSessions: { type: 'integer', description: '回放会话数（可选，默认配置值，上限 50）。' },
    }),
    output: {
      schema: baseSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const sessions = Array.isArray(rec.sessions) ? rec.sessions : []
        const lines = ['梦原料：最近 ' + sessions.length + ' 个会话']
        for (const item of sessions) {
          const s = asRecord(item)
          lines.push('- ' + (s.title !== '' ? s.title : '(无标题)') + '：' + s.turns + ' 轮，目录 ' + s.cwd)
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown) {
      const args = asRecord(rawArgs)
      const maxRaw = args.maxSessions
      const max = typeof maxRaw === 'number' && Number.isInteger(maxRaw) ? Math.min(50, Math.max(1, maxRaw)) : cfg.maxSessions
      const files = listSessionFiles(cfg.sessionsRoot, max * 3)
      const sessions: Array<Record<string, unknown>> = []
      for (const file of files) {
        if (sessions.length >= max) break
        const digest = digestSessionFile(file, cfg.maxUserMessages)
        if (digest === null) continue
        if (digest.origin === 'subagent') continue
        sessions.push({
          id: digest.id,
          title: digest.title,
          createdAt: digest.createdAt,
          endedAt: digest.endedAt,
          cwd: digest.cwd,
          turns: digest.turns,
          agentPreset: digest.agentPreset,
          userMessages: digest.userMessages.map((msg) => clip(msg, 400)),
          assistantTail: digest.assistantTail.map((msg) => clip(msg, 600)),
          toolCalls: [...new Set(digest.toolCalls)],
          digestText: clip(buildDigestText(digest), cfg.maxCharsPerSession),
        })
      }
      return { count: sessions.length, sessions }
    },
    timeoutMs: 120000,
  }

  const dreamSave: DreamToolDefinition = {
    name: 'dream_save',
    description: '记梦：把反思写入梦境日记（永久保存）。reflection 用第一人称写感悟；lessons 列 1-5 条以动词开头的可执行教训；mood 是本次梦的心境（如 平静/兴奋/存疑）。严禁写入密钥与隐私。',
    parameters: compileParameters({
      reflection: { type: 'string', required: true, description: '梦的反思正文（必填，第一人称）。' },
      lessons: { type: 'array', items: { type: 'string' }, description: '1-5 条教训（可选，每条以动词开头）。' },
      mood: { type: 'string', description: '心境（可选，默认 平静）。' },
    }),
    output: {
      schema: baseSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        return [{ type: 'text', text: '梦已记下（' + rec.id + '，' + rec.at + '），愿醒来时更聪明。' }]
      },
    },
    async execute(rawArgs: unknown) {
      const args = asRecord(rawArgs)
      const reflection = requiredString(args, 'reflection', '梦境反思')
      const lessons = stringArray(args, 'lessons').slice(0, 5)
      const mood = optionalString(args, 'mood') ?? ''
      const entry = saveDream(cfg.journalDir, reflection, lessons, mood)
      return { ok: true, ...entry }
    },
    timeoutMs: 15000,
  }

  const dreamJournal: DreamToolDefinition = {
    name: 'dream_journal',
    description: '翻梦：倒序列出历史梦境日记（新梦在前）。做梦前先翻翻，避免重复做同一个梦。',
    parameters: compileParameters({
      limit: { type: 'integer', description: '条数上限 1-50（默认 10）。' },
    }),
    output: {
      schema: baseSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const dreams = Array.isArray(rec.dreams) ? rec.dreams : []
        const lines = ['梦境日记共 ' + dreams.length + ' 条：']
        for (const item of dreams) {
          const d = asRecord(item)
          lines.push('- [' + d.at + ']（' + d.mood + '）' + String(d.reflection ?? '').slice(0, 80))
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown) {
      const args = asRecord(rawArgs)
      const limitRaw = args.limit
      const limit = typeof limitRaw === 'number' && Number.isInteger(limitRaw) ? Math.min(50, Math.max(1, limitRaw)) : 10
      const dreams = readDreams(cfg.journalDir, limit)
      return { count: dreams.length, dreams }
    },
    timeoutMs: 15000,
  }

  const dreamRecall: DreamToolDefinition = {
    name: 'dream_recall',
    description: '忆梦：按关键词检索梦境日记（不区分大小写）。用户问起过往经验时先忆梦再回答。',
    parameters: compileParameters({
      query: { type: 'string', required: true, description: '关键词（必填）。' },
      limit: { type: 'integer', description: '命中上限 1-20（默认 5）。' },
    }),
    output: {
      schema: baseSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const dreams = Array.isArray(rec.dreams) ? rec.dreams : []
        if (dreams.length === 0) return [{ type: 'text', text: '没有梦到与「' + rec.query + '」相关的记忆。' }]
        const lines = ['忆起 ' + dreams.length + ' 个相关的梦：']
        for (const item of dreams) {
          const d = asRecord(item)
          lines.push('- [' + d.at + '] ' + String(d.reflection ?? '').slice(0, 120))
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown) {
      const args = asRecord(rawArgs)
      const query = requiredString(args, 'query', '搜索关键词')
      const limitRaw = args.limit
      const limit = typeof limitRaw === 'number' && Number.isInteger(limitRaw) ? Math.min(20, Math.max(1, limitRaw)) : 5
      const dreams = searchDreams(cfg.journalDir, query, limit)
      return { query, count: dreams.length, dreams }
    },
    timeoutMs: 15000,
  }

  const dreamHealth: DreamToolDefinition = {
    name: 'dream_health',
    description: 'dsh-dream 自检：检查会话目录是否可读、梦境日记目录是否可用、梦境条数。遇到问题时先运行本工具定位。',
    parameters: compileParameters({}),
    output: {
      schema: baseSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const checks = Array.isArray(rec.checks) ? rec.checks : []
        const lines = ['dsh-dream 自检' + (rec.ok === true ? '：正常。' : '：发现问题。')]
        for (const item of checks) {
          const c = asRecord(item)
          lines.push('- ' + c.name + '：' + (c.ok === true ? '✅ ' + String(c.detail ?? '') : '❌ ' + String(c.detail ?? '')))
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute() {
      const checks: Array<Record<string, unknown>> = []
      let ok = true
      const sessionsOk = existsSync(cfg.sessionsRoot)
      checks.push({ name: '会话目录', ok: sessionsOk, detail: sessionsOk ? cfg.sessionsRoot : cfg.sessionsRoot + ' 不存在（DSH 尚未产生会话？）' })
      if (!sessionsOk) ok = false
      const dreams = readDreams(cfg.journalDir, 1000)
      checks.push({ name: '梦境日记', ok: true, detail: '已做 ' + dreams.length + ' 个梦（' + cfg.journalDir + '）' })
      checks.push({ name: '摘要配置', ok: true, detail: 'maxSessions=' + cfg.maxSessions + '，maxCharsPerSession=' + cfg.maxCharsPerSession })
      return { ok, plugin: 'dsh-dream', checks }
    },
    timeoutMs: 15000,
  }

  return [dreamDigest, dreamSave, dreamJournal, dreamRecall, dreamHealth]
}

/** 把会话摘要拼成一段可读文本（供模型一次性阅读）。 */
export function buildDigestText(digest: SessionDigest): string {
  const lines: string[] = []
  lines.push('会话：' + (digest.title !== '' ? digest.title : '(无标题)') + '（' + digest.turns + ' 轮，' + digest.cwd + '）')
  if (digest.userMessages.length > 0) {
    lines.push('用户说：')
    for (const msg of digest.userMessages) lines.push('  > ' + msg.replace(/\n/g, ' ').slice(0, 200))
  }
  if (digest.assistantTail.length > 0) {
    lines.push('最终回应：')
    for (const msg of digest.assistantTail) lines.push('  < ' + msg.replace(/\n/g, ' ').slice(0, 300))
  }
  if (digest.toolCalls.length > 0) {
    lines.push('工具足迹：' + [...new Set(digest.toolCalls)].slice(0, 30).join(', '))
  }
  return lines.join('\n')
}
