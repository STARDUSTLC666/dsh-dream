import { createHash, randomUUID } from 'node:crypto'
import type { ResolvedDreamConfig } from './config.js'
import { budgetDay, readAutomaticState, updateAutomaticState, type PendingMemory } from './automatic-state.js'

const TTL = 86400000
function alive(pid: number): boolean { try { process.kill(pid, 0); return true } catch (e: any) { return e.code !== 'ESRCH' } }

/** One event-driven timer, persistent bounded inputs, cross-process call leases. */
export class MemoryQueue {
  private timer?: ReturnType<typeof setTimeout>
  private work: Promise<void> = Promise.resolve()
  private running = false
  private closed = false
  private quietUntil: number
  private controller?: AbortController
  private cfg: ResolvedDreamConfig
  private now: () => number
  private canRun: () => boolean
  private generate: (rows: PendingMemory[], signal: AbortSignal) => Promise<{ reason: string; saved: number }>
  private onProblem: (reason: string) => void
  constructor(cfg: ResolvedDreamConfig, now: () => number, canRun: () => boolean,
    generate: (rows: PendingMemory[], signal: AbortSignal) => Promise<{ reason: string; saved: number }>,
    onProblem: (reason: string) => void = () => {}) {
    this.cfg = cfg; this.now = now; this.canRun = canRun; this.generate = generate; this.onProblem = onProblem
    this.quietUntil = now() + cfg.autoIdleMs
  }
  touch(): void { this.quietUntil = this.now() + this.cfg.autoIdleMs; this.controller?.abort(); this.kick() }
  cancel(): void { this.controller?.abort(); this.kick() }
  stop(): void { this.closed = true; clearTimeout(this.timer); this.controller?.abort() }
  async whenIdle(): Promise<void> { await this.work }
  enqueue(row: PendingMemory): void {
    updateAutomaticState(this.cfg, state => {
      const cursor = createHash('sha256').update(row.sessionId).digest('hex').slice(0, 24)
      if ((state.cursors[cursor] ?? -1) >= row.endSeq) return
      if (Object.keys(state.cursors).length >= 128 && state.cursors[cursor] === undefined) delete state.cursors[Object.keys(state.cursors)[0]]
      state.cursors[cursor] = row.endSeq
      state.pending ??= []
      if (state.pending.some(p => p.key === row.key)) return
      if (state.pending.length >= 32) {
        const replace = state.pending.findIndex(p => !p.lease)
        state.overflow = (state.overflow ?? 0) + 1
        if (replace < 0) return
        state.pending.splice(replace, 1)
      }
      state.pending.push(row)
      const reason = state.day === budgetDay(this.now()) && state.calls >= this.cfg.autoMaxCallsPerDay ? 'daily-budget'
        : state.lastAttemptAt !== undefined && this.now() < state.lastAttemptAt + this.cfg.autoCooldownMs ? 'cooldown' : 'queued'
      if (state.last?.reason !== 'recording') state.last = { at: this.now(), reason, saved: 0 }
    }, this.now())
    this.kick()
  }
  flush(): void {
    this.quietUntil = 0
    updateAutomaticState(this.cfg, s => { for (const p of s.pending ?? []) p.readyAt = this.now() }, this.now())
    this.kick()
  }
  kick(): void {
    clearTimeout(this.timer)
    if (this.closed || this.running) return
    try {
      let state = readAutomaticState(this.cfg, this.now())
      const now = this.now()
      if (state.pending?.some(p => now - p.createdAt >= TTL)) {
        updateAutomaticState(this.cfg, s => {
          const expired = (s.pending ?? []).filter(p => now - p.createdAt >= TTL)
          s.expired = (s.expired ?? 0) + expired.length
          s.pending = (s.pending ?? []).filter(p => now - p.createdAt < TTL)
        }, now)
        state = readAutomaticState(this.cfg, now)
      }
      if (!state.pending?.length) return
      const expiresAt = Math.min(...state.pending.map(p => p.createdAt + TTL))
      const eligible = state.pending.filter(p => this.enabled(p, state))
      const paused = !eligible.length || !this.canRun()
      let at = paused ? expiresAt : Math.min(...eligible.map(p => Math.max(p.readyAt, p.lease && alive(p.lease.pid) ? p.lease.until : 0)))
      at = Math.max(at, this.quietUntil, (state.lastAttemptAt ?? 0) + this.cfg.autoCooldownMs)
      if (state.day === budgetDay(now) && state.calls >= this.cfg.autoMaxCallsPerDay) {
        const next = new Date(now); next.setHours(24, 0, 0, 0); at = Math.max(at, next.getTime())
      }
      if (!paused && at <= now) {
        this.running = true
        this.work = this.work.then(() => this.drain()).catch(e => this.onProblem(e.message === 'automatic-storage-busy' ? e.message : 'automatic-storage-error')).finally(() => { this.running = false; this.kick() })
      } else {
        this.timer = setTimeout(() => { this.kick() }, Math.max(1, Math.min(at - now, expiresAt - now, 2147483647)))
        this.timer.unref?.()
      }
    } catch (error: any) {
      this.onProblem(error.message === 'automatic-storage-busy' ? error.message : 'automatic-state-invalid')
      if (error.message === 'automatic-storage-busy') { this.timer = setTimeout(() => this.kick(), 1000); this.timer.unref?.() }
    }
  }
  private enabled(row: PendingMemory, state: ReturnType<typeof readAutomaticState>): boolean {
    const key = createHash('sha256').update(row.sessionId).digest('hex').slice(0, 24)
    return state.policies?.[key]?.contribute ?? state.enabled ?? this.cfg.autoCollect
  }
  private async drain(): Promise<void> {
    if (this.closed || !this.canRun()) return
    const now = this.now(), job = randomUUID()
    const rows = updateAutomaticState(this.cfg, state => {
      const all = state.pending ?? []
      state.expired = (state.expired ?? 0) + all.filter(p => now - p.createdAt >= TTL).length
      state.pending = all.filter(p => now - p.createdAt < TTL)
      if (state.day !== budgetDay(now)) { state.day = budgetDay(now); state.calls = 0 }
      if (state.calls >= this.cfg.autoMaxCallsPerDay || now < (state.lastAttemptAt ?? 0) + this.cfg.autoCooldownMs || now < this.quietUntil) return []
      const due = state.pending.filter(p => this.enabled(p, state) && p.readyAt <= now && (!p.lease || p.lease.until <= now || !alive(p.lease.pid)))
      const first = due[0]
      if (!first) return []
      const selected: PendingMemory[] = []
      let chars = 0
      for (const p of due.filter(p => p.cwd === first.cwd && p.provider === first.provider && p.model === first.model)) {
        const size = JSON.stringify(p.sources.map(({ seq, role, text }) => ({ seq, role, text }))).length
        if (selected.length && chars + size > this.cfg.autoMaxInputChars - 1000) continue
        selected.push(p); chars += size
        if (selected.length === 4) break
      }
      for (const p of selected) p.lease = { job, pid: process.pid, until: now + this.cfg.autoTimeoutMs + 5000 }
      state.calls++; state.lastAttemptAt = now
      state.last = { at: now, reason: 'recording', saved: 0, job }
      return selected
    }, now)
    if (!rows.length) return
    const controller = new AbortController(); this.controller = controller
    const timer = setTimeout(() => controller.abort(new Error('automatic-timeout')), this.cfg.autoTimeoutMs)
    timer.unref?.()
    let result = { reason: 'model-error', saved: 0 }
    try { result = await this.generate(rows, controller.signal) }
    catch { result.reason = controller.signal.aborted ? (controller.signal.reason?.message === 'automatic-timeout' ? 'timeout' : 'cancelled') : 'model-error' }
    finally {
      clearTimeout(timer); this.controller = undefined
      updateAutomaticState(this.cfg, state => {
        state.pending = (state.pending ?? []).filter(p => {
          if (p.lease?.job !== job) return true
          if (result.reason === 'cancelled') { delete p.lease; p.readyAt = this.now() + this.cfg.autoIdleMs; return true }
          return false
        })
        if (state.last?.job === job) state.last = { at: this.now(), ...result, job }
      }, this.now())
    }
  }
}
