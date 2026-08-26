/**
 * DSH 会话日志读取：官方格式为“多帧 zstd 拼接的 JSONL”。
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

function textOf(data: unknown): string {
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    const rec = data as Record<string, unknown>
    for (const key of ['text', 'content', 'message', 'title']) {
      const value = rec[key]
      if (typeof value === 'string') return value
    }
  }
  return ''
}

/** 解析单个会话文件为摘要；文件不存在或损坏时返回 null。 */
export function digestSessionFile(filePath: string, maxUserMessages: number): SessionDigest | null {
  if (!existsSync(filePath)) return null
  let text: string
  try {
    text = decompressAll(readFileSync(filePath))
  } catch {
    return null
  }
  const lines = text.split('\n').filter((line) => line.trim() !== '')
  if (lines.length === 0) return null
  let header: SessionHeader | null = null
  try {
    const first = JSON.parse(lines[0]) as Record<string, unknown>
    if (first.type !== 'session') return null
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
  for (const line of lines.slice(1)) {
    let rec: Record<string, unknown>
    try {
      rec = JSON.parse(line) as Record<string, unknown>
    } catch {
      continue
    }
    const type = String(rec.type ?? '')
    const data = rec.data as unknown
    const time = typeof rec.time === 'number' ? rec.time : null
    if (time !== null && (digest.endedAt === null || time > digest.endedAt)) digest.endedAt = time
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
      const name = typeof data === 'object' && data !== null ? String((data as Record<string, unknown>).name ?? '') : ''
      if (name !== '' && digest.toolCalls.length < 200) digest.toolCalls.push(name)
    } else if (type === 'text-chunks') {
      // 官方打包行：{ data: { texts: string[], ... } }，还原流式正文
      const texts = typeof data === 'object' && data !== null ? (data as Record<string, unknown>).texts : undefined
      if (Array.isArray(texts)) {
        digest.streamTail += texts.filter((t): t is string => typeof t === 'string').join('')
        if (digest.streamTail.length > 4000) digest.streamTail = digest.streamTail.slice(-4000)
      }
    } else if (type === 'tool-call-chunks') {
      // 官方打包行：还原工具名足迹
      const name = typeof data === 'object' && data !== null ? String((data as Record<string, unknown>).name ?? '') : ''
      if (name !== '' && digest.toolCalls.length < 200) digest.toolCalls.push(name)
    }
  }
  digest.userMessages = digest.userMessages.slice(0, maxUserMessages)
  return digest
}

/** 列出指定根目录下最近修改的会话文件路径（跳过子代理会话目录由调用方按摘要 origin 过滤）。 */
export function listSessionFiles(sessionsRoot: string, limit: number): string[] {
  if (!existsSync(sessionsRoot)) return []
  const out: Array<{ file: string; mtime: number }> = []
  for (const project of readdirSync(sessionsRoot)) {
    const projectDir = join(sessionsRoot, project)
    try {
      if (!statSync(projectDir).isDirectory()) continue
    } catch {
      continue
    }
    for (const session of readdirSync(projectDir)) {
      const file = join(projectDir, session, 'session.jsonl.zstd')
      try {
        if (existsSync(file)) out.push({ file, mtime: statSync(file).mtimeMs })
      } catch { /* 并发删除等竞态，跳过 */ }
    }
  }
  out.sort((a, b) => b.mtime - a.mtime)
  return out.slice(0, limit).map((item) => item.file)
}
