/** Small, fail-closed persistent budget and cursor, shared across host processes. */
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { ResolvedDreamConfig } from './config.js'

export interface PendingMemory {
  key: string; sessionId: string; cwd: string; endSeq: number; createdAt: number; readyAt: number
  provider: string; model: string
  sources: Array<{ seq: number; role: 'user' | 'assistant'; text: string; hash: string }>
  lease?: { job: string; pid: number; until: number }
}
export interface ChatMemoryPolicy { sessionId: string; cwd?: string; use?: boolean; contribute?: boolean }

export interface AutomaticState {
  version: 1
  day: string
  calls: number
  enabled?: boolean
  retrievalEnabled?: boolean
  lastAttemptAt?: number
  cursors: Record<string, number>
  pending?: PendingMemory[]
  policies?: Record<string, ChatMemoryPolicy>
  expired?: number
  overflow?: number
  retrieved?: Record<string, { at: number; count: number }>
  last?: { at: number; reason: string; saved: number; job?: string }
}

export function budgetDay(now: number): string {
  const date = new Date(now)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function readAutomaticState(cfg: ResolvedDreamConfig, now = Date.now()): AutomaticState {
  const file = join(cfg.journalDir, 'automatic', 'state.json')
  if (!existsSync(file)) return { version: 1, day: budgetDay(now), calls: 0, cursors: {} }
  if (statSync(file).size > 2 * 1024 * 1024) throw new Error('automatic-state-invalid')
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  if (raw?.version !== 1 || typeof raw.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.day)
    || !Number.isSafeInteger(raw.calls) || raw.calls < 0 || raw.calls > 100000
    || raw.cursors === null || typeof raw.cursors !== 'object' || Array.isArray(raw.cursors)
    || Object.keys(raw.cursors).length > 128
    || Object.entries(raw.cursors).some(([key, value]) => !/^[a-f0-9]{24}$/.test(key) || !Number.isSafeInteger(value) || Number(value) < 0)
    || (raw.enabled !== undefined && typeof raw.enabled !== 'boolean')
    || (raw.retrievalEnabled !== undefined && typeof raw.retrievalEnabled !== 'boolean')
    || (raw.lastAttemptAt !== undefined && (!Number.isSafeInteger(raw.lastAttemptAt) || raw.lastAttemptAt < 0))
    || (raw.last !== undefined && (!Number.isSafeInteger(raw.last.at) || typeof raw.last.reason !== 'string' || raw.last.reason.length > 80 || !Number.isSafeInteger(raw.last.saved) || raw.last.saved < 0 || (raw.last.job !== undefined && typeof raw.last.job !== 'string')))) {
    throw new Error('automatic-state-invalid')
  }
  const text = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max
  const integer = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0
  if ((raw.pending !== undefined && (!Array.isArray(raw.pending) || raw.pending.length > 32 || raw.pending.some((p: any) =>
    !p || !text(p.key, 64) || !text(p.sessionId, 200) || !text(p.cwd, 2000) || !integer(p.endSeq)
    || !integer(p.createdAt) || !integer(p.readyAt) || !text(p.provider, 200) || !text(p.model, 200)
    || !Array.isArray(p.sources) || p.sources.length < 1 || p.sources.length > 6 || p.sources.some((s: any) =>
      !s || !integer(s.seq) || !['user', 'assistant'].includes(s.role) || !text(s.text, 1800) || !/^[a-f0-9]{64}$/.test(s.hash))
    || (p.lease !== undefined && (!text(p.lease.job, 64) || !integer(p.lease.pid) || p.lease.pid < 1 || !integer(p.lease.until))))))
    || (raw.policies !== undefined && (!raw.policies || Array.isArray(raw.policies) || typeof raw.policies !== 'object'
      || Object.keys(raw.policies).length > 128 || Object.entries(raw.policies).some(([key, p]: [string, any]) =>
        !/^[a-f0-9]{24}$/.test(key) || !p || !text(p.sessionId, 200) || (p.cwd !== undefined && !text(p.cwd, 2000))
        || ['use', 'contribute'].some(k => p[k] !== undefined && typeof p[k] !== 'boolean'))))
    || ['expired', 'overflow'].some(k => raw[k] !== undefined && !integer(raw[k]))
    || (raw.retrieved !== undefined && (!raw.retrieved || Array.isArray(raw.retrieved) || typeof raw.retrieved !== 'object'
      || Object.keys(raw.retrieved).length > 2000 || Object.entries(raw.retrieved).some(([key, v]: [string, any]) =>
        !text(key, 200) || !v || !integer(v.at) || !integer(v.count))))) throw new Error('automatic-state-invalid')
  return raw as AutomaticState
}

/** No waiting on a live lock: observing a turn must never stall its owner. */
export function updateAutomaticState<T>(cfg: ResolvedDreamConfig, update: (state: AutomaticState) => T, now = Date.now()): T {
  const dir = join(cfg.journalDir, 'automatic')
  mkdirSync(dir, { recursive: true })
  const lock = join(dir, '.lock')
  let descriptor: number
  try { descriptor = openSync(lock, 'wx') } catch (error: any) {
    if (error.code !== 'EEXIST') throw error
    // Reclaim only a demonstrably dead owner, never by age alone.
    try {
      const owner = JSON.parse(readFileSync(lock, 'utf8'))
      if (!Number.isSafeInteger(owner.pid) || owner.pid < 1 || now - statSync(lock).mtimeMs < 30000) throw new Error('automatic-storage-busy')
      try { process.kill(owner.pid, 0); throw new Error('automatic-storage-busy') } catch (failure: any) {
        if (failure.code !== 'ESRCH') throw new Error('automatic-storage-busy')
      }
      unlinkSync(lock)
      descriptor = openSync(lock, 'wx')
    } catch { throw new Error('automatic-storage-busy') }
  }
  const temporary = join(dir, 'state-' + randomUUID() + '.tmp')
  try {
    writeFileSync(descriptor, JSON.stringify({ pid: process.pid }))
    const state = readAutomaticState(cfg, now)
    const result = update(state)
    writeFileSync(temporary, JSON.stringify(state) + '\n', { flag: 'wx' })
    renameSync(temporary, join(dir, 'state.json'))
    return result
  } finally {
    closeSync(descriptor)
    unlinkSync(lock)
    if (existsSync(temporary)) unlinkSync(temporary)
  }
}
