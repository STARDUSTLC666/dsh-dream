/**
 * DSH 会话日志读取：兼容 v0/v1/v2 的 JSONL 与多帧 zstd。
 * 首个逻辑行是会话头（{ type: 'session', ... }），其后每行一条存储记录（{ type, seq, time, data }）。
 * 本模块只读不写；损坏帧/行一律容错跳过。
 *
 * @module dsh-dream/sessions
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

/** zstd 帧魔数。 */
export const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd] as const

/** 会话头。 */
export interface SessionHeader {
  id: string
  createdAt: number
  cwd: string
  origin: string
  delegationDepth: number
  agentPreset: string
}

/** 会话摘要（梦的原料）。 */
export interface SessionDigest {
  id: string
  createdAt: number
  cwd: string
  agentPreset: string
  origin: string
  title: string
  turns: number
  userMessages: string[]
  assistantTail: string[]
  toolCalls: string[]
  /** 流式文本还原尾部（来自 text-chunks 打包行，assistant/message 缺失时的兜底梦原料）。 */
  streamTail: string
  endedAt: number | null
}

/** 扫描 zstd 帧边界（按魔数；误命中由解压失败兜底）。 */
export function frameRanges(buf: Uint8Array): Array<{ start: number; end: number }> {
  const starts: number[] = []
  for (let i = 0; i + 3 < buf.length; i++) {
    if (buf[i] === ZSTD_MAGIC[0] && buf[i + 1] === ZSTD_MAGIC[1] && buf[i + 2] === ZSTD_MAGIC[2] && buf[i + 3] === ZSTD_MAGIC[3]) {
      starts.push(i)
    }
  }
  return starts.map((start, i) => ({ start, end: i + 1 < starts.length ? starts[i + 1] : buf.length }))
}

/** 多帧解压为文本（损坏帧跳过）。 */
export function decompressAll(buf: Uint8Array): string {
  const parts: Buffer[] = []
  for (const { start, end } of frameRanges(buf)) {
    try {
      parts.push(zstdDecompressSync(buf.subarray(start, end)))
    } catch { /* 误命中魔数的噪声区段，跳过 */ }
  }
  return Buffer.concat(parts).toString('utf8')
}

/** 提取任意载荷的纯文本：兼容字符串与官方 ContentBlock 数组（{type:'text', text}）。 */
function blockText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) {
          const rec = item as Record<string, unknown>
          return typeof rec.text === 'string' ? rec.text : ''
        }
        return ''
      })
      .filter((text) => text !== '')
      .join('')
  }
  if (typeof value === 'object' && value !== null) {
    const rec = value as Record<string, unknown>
    for (const key of ['text', 'content']) {
      const inner = blockText(rec[key])
      if (inner !== '') return inner
    }
  }
  return ''
}

function textOf(data: unknown): string {
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    const rec = data as Record<string, unknown>
    for (const key of ['text', 'content', 'message', 'title']) {
      const value = blockText(rec[key])
      if (value !== '') return value
    }
  }
  return ''
}

/** 解析单个会话文件为摘要；文件不存在或损坏时返回 null。 */
export function digestSessionFile(filePath: string, maxUserMessages: number): SessionDigest | null {
  if (!existsSync(filePath)) return null
  let text: string
  try {
    const bytes = readFileSync(filePath)
    text = filePath.endsWith('.zstd') ? decompressAll(bytes) : bytes.toString('utf8')
  } catch {
    return null
  }
  const lines = text.split('\n').filter((line) => line.trim() !== '')
  if (lines.length === 0) return null
  let header: SessionHeader | null = null
  try {
    const first = JSON.parse(lines[0]) as Record<string, unknown>
    if (first.type !== 'session') return null
    if (first.version !== undefined && ![0, 1, 2].includes(first.version as number)) return null
    header = {
      id: String(first.id ?? ''),
      createdAt: typeof first.createdAt === 'number' ? first.createdAt : 0,
      cwd: String(first.cwd ?? ''),
      origin: String(first.origin ?? ''),
      delegationDepth: typeof first.delegationDepth === 'number' ? first.delegationDepth : 0,
      agentPreset: String(first.agentPreset ?? ''),
    }
  } catch {
    return null
  }

  const digest: SessionDigest = {
    ...header,
    title: '',
    turns: 0,
    userMessages: [],
    assistantTail: [],
    toolCalls: [],
    streamTail: '',
    endedAt: null,
  }
  const appendStreamText = (text: string): void => {
    digest.streamTail = (digest.streamTail + text).slice(-4000)
  }
  const appendToolName = (name: unknown): void => {
    if (typeof name === 'string' && name !== '' && digest.toolCalls.length < 200) digest.toolCalls.push(name)
  }
  const readStreamRecord = (value: unknown): void => {
    if (typeof value !== 'object' || value === null) return
    const record = value as Record<string, unknown>
    if (record.type === 'text-chunks' && Array.isArray(record.texts)) {
      appendStreamText(record.texts.filter((part): part is string => typeof part === 'string').join(''))
    } else if (record.type === 'tool-call-chunks') {
      appendToolName(record.name)
    } else if (record.type === 'chunk' && typeof record.chunk === 'object' && record.chunk !== null) {
      const chunk = record.chunk as Record<string, unknown>
      if (chunk.type === 'text-delta' && typeof chunk.text === 'string') appendStreamText(chunk.text)
      if (chunk.type === 'tool-call-start') appendToolName(chunk.name)
    }
  }
  for (const line of lines.slice(1)) {
    let rec: Record<string, unknown>
    try {
      rec = JSON.parse(line) as Record<string, unknown>
    } catch {
      continue
    }
    if (typeof rec !== 'object' || rec === null || Array.isArray(rec)) continue
    const type = String(rec.type ?? '')
    const data = rec.data as unknown
    const time = typeof rec.time === 'number' ? rec.time : typeof rec.time0 === 'number' ? rec.time0 : null
    if (time !== null && (digest.endedAt === null || time > digest.endedAt)) digest.endedAt = time
    // v2 把流式片段内嵌进 message/attempt；v0 的独立打包行继续兼容。
    if ((type === 'assistant/message' || type === 'assistant/attempt') && typeof data === 'object' && data !== null) {
      const stream = (data as Record<string, unknown>).stream
      if (Array.isArray(stream)) for (const record of stream) readStreamRecord(record)
    }
    if (type === 'session/title') {
      digest.title = textOf(data)
    } else if (type === 'turn/start') {
      digest.turns++
    } else if (type === 'user/message') {
      const msg = textOf(data)
      if (msg !== '' && digest.userMessages.length < maxUserMessages * 2) digest.userMessages.push(msg)
    } else if (type === 'assistant/message') {
      const msg = textOf(data)
      if (msg !== '') {
        digest.assistantTail.push(msg)
        if (digest.assistantTail.length > 3) digest.assistantTail.shift()
      }
    } else if (type === 'tool/call') {
      if (typeof data === 'object' && data !== null) appendToolName((data as Record<string, unknown>).name)
    } else if (type === 'text-chunks' || type === 'tool-call-chunks') {
      if (typeof data === 'object' && data !== null) readStreamRecord({ ...data, type })
    } else if (type === 'assistant/chunk' && typeof data === 'object' && data !== null) {
      readStreamRecord({ type: 'chunk', chunk: (data as Record<string, unknown>).chunk })
    }
  }
  digest.userMessages = digest.userMessages.slice(0, maxUserMessages)
  return digest
}

/** 列出指定根目录下最近修改的会话文件路径（跳过子代理会话目录由调用方按摘要 origin 过滤）。 */
export function listSessionFiles(sessionsRoot: string, limit: number): string[] {
  if (!existsSync(sessionsRoot)) return []
  const out: Array<{ file: string; mtime: number }> = []
  const listDirectory = (path: string): string[] => {
    try { return readdirSync(path) } catch { return [] }
  }
  for (const project of listDirectory(sessionsRoot)) {
    const projectDir = join(sessionsRoot, project)
    try {
      if (!statSync(projectDir).isDirectory()) continue
    } catch {
      continue
    }
    for (const session of listDirectory(projectDir)) {
      const sessionDir = join(projectDir, session)
      // 迁移会保留旧代文件；每个会话只读最新已提交的规范文件，避免重复或读旧副本。
      const candidates = listDirectory(sessionDir).flatMap((name) => {
        const match = /^session(?:\.v([1-9][0-9]*))?\.jsonl(?:\.zstd)?$/.exec(name)
        if (match === null) return []
        const version = match[1] === undefined ? 0 : Number(match[1])
        if (!Number.isSafeInteger(version)) return []
        const file = join(sessionDir, name)
        try {
          const stat = statSync(file)
          return stat.isFile() ? [{ file, version, mtime: stat.mtimeMs }] : []
        } catch { return [] }
      }).sort((a, b) => b.version - a.version || Number(b.file.endsWith('.zstd')) - Number(a.file.endsWith('.zstd')))
      if (candidates[0] !== undefined) out.push(candidates[0])
    }
  }
  out.sort((a, b) => b.mtime - a.mtime)
  const capped = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0
  return out.slice(0, capped).map((item) => item.file)
}
