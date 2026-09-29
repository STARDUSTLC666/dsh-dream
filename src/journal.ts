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

/** 需要读全量日记时的上限：检索与统计共用，避免两处上限漂移。 */
const FULL_SCAN_LIMIT = 100000

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

/** 教训榜的一行：次数与最近一次出现时间（lastAt 缺失时是空串，绝不为 null）。 */
export interface LessonStat {
  lesson: string
  count: number
  lastAt: string
}

/** 梦境统计：总数、心境分布、教训榜。 */
export interface DreamStats {
  total: number
  moods: Record<string, number>
  topLessons: LessonStat[]
}

/**
 * 统计梦境（基于全量日记）。
 *
 * count 与 lastAt 来自同一遍倒序扫描：readDreams 已经新梦在前，所以某个
 * 教训第一次出现的那条梦，就是它最近一次出现；顺手在那次循环里记下原始
 * 大小写，不再二次 flatMap（否则同一条教训的三个数值会来自不同的扫描）。
 */
export function dreamStats(journalDir: string): DreamStats {
  const dreams = readDreams(journalDir, FULL_SCAN_LIMIT)
  const moods: Record<string, number> = {}
  const lessons = new Map<string, LessonStat>()
  for (const dream of dreams) {
    const mood = dream.mood !== '' ? dream.mood : '平静'
    moods[mood] = (moods[mood] ?? 0) + 1
    for (const lesson of dream.lessons) {
      const key = lesson.toLowerCase()
      const known = lessons.get(key)
      if (known === undefined) {
        lessons.set(key, { lesson, count: 1, lastAt: dream.at })
      } else {
        known.count += 1
      }
    }
  }
  const topLessons = [...lessons.values()]
    .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt))
    .slice(0, 10)
  return { total: dreams.length, moods, topLessons }
}

/** 关键词检索梦境（不区分大小写，命中 reflection/lessons；扫描全量，上限见 FULL_SCAN_LIMIT）。 */
export function searchDreams(journalDir: string, query: string, limit: number): DreamEntry[] {
  const needle = query.toLowerCase()
  return readDreams(journalDir, FULL_SCAN_LIMIT).filter((entry) => {
    const haystack = (entry.reflection + ' ' + entry.lessons.join(' ')).toLowerCase()
    return haystack.includes(needle)
  }).slice(0, limit)
}
