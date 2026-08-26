/**
 * 梦境日记：JSONL 追加式存储（每行一条梦），倒序读取与关键词检索。
 *
 * @module dsh-dream/journal
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** 一条梦境。 */
export interface DreamEntry {
  id: string
  at: string
  reflection: string
  lessons: string[]
  mood: string
}

export function journalFile(journalDir: string): string {
  return join(journalDir, 'dreams.jsonl')
}

/** 追加一条梦；返回落盘后的条目。 */
export function saveDream(journalDir: string, reflection: string, lessons: string[], mood: string): DreamEntry {
  const trimmed = reflection.trim()
  if (trimmed === '') throw new Error('梦境不能为空：请在 reflection 里写下你的反思。')
  const entry: DreamEntry = {
    id: 'dream-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    at: new Date().toISOString(),
    reflection: trimmed,
    lessons: lessons.map((lesson) => lesson.trim()).filter((lesson) => lesson !== ''),
    mood: mood.trim() || '平静',
  }
  mkdirSync(journalDir, { recursive: true })
  appendFileSync(journalFile(journalDir), JSON.stringify(entry) + '\n', 'utf8')
  return entry
}

/** 倒序读取梦境（新梦在前）；损坏行跳过。 */
export function readDreams(journalDir: string, limit: number): DreamEntry[] {
  const file = journalFile(journalDir)
  if (!existsSync(file)) return []
  const lines = readFileSync(file, 'utf8').split('\n').filter((line) => line.trim() !== '')
  const out: DreamEntry[] = []
  for (const line of lines) {
    try {
      const rec = JSON.parse(line) as Record<string, unknown>
      if (typeof rec.reflection === 'string') {
        out.push({
          id: String(rec.id ?? ''),
          at: String(rec.at ?? ''),
          reflection: rec.reflection,
          lessons: Array.isArray(rec.lessons) ? rec.lessons.filter((l): l is string => typeof l === 'string') : [],
          mood: typeof rec.mood === 'string' ? rec.mood : '',
        })
      }
    } catch { /* 损坏行跳过 */ }
  }
  return out.reverse().slice(0, limit)
}

/** 关键词检索梦境（不区分大小写，命中 reflection/lessons）。 */
export function searchDreams(journalDir: string, query: string, limit: number): DreamEntry[] {
  const needle = query.toLowerCase()
  return readDreams(journalDir, 1000).filter((entry) => {
    const haystack = (entry.reflection + ' ' + entry.lessons.join(' ')).toLowerCase()
    return haystack.includes(needle)
  }).slice(0, limit)
}
