#!/usr/bin/env node
/**
 * 知识库规模脚本（不进常规 CI；M1 提案 3）。
 *
 * 用法：
 *   node scripts/scale-knowledge.mjs
 *   node scripts/scale-knowledge.mjs --events 200000 --budget-ms 500
 *
 * 合成 events.jsonl 后测量 panel 打开一次的 3 次只读调用
 * （listLessons + listEvidence + stats，src/web.ts 知识路由同款路径）。
 * 任一调用或合计超过 --budget-ms 即退出码 1（用于推动“索引命中/一次快照”改造）。
 */
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const readArg = (name, fallback) => {
  const at = args.indexOf(name)
  if (at < 0 || args[at + 1] === undefined) return fallback
  const value = Number(args[at + 1])
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}
const EVENTS = readArg('--events', 50000)
const BUDGET_MS = readArg('--budget-ms', 150)

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const { KnowledgeStore } = await import(pathToFileURL(join(repoRoot, 'lib', 'knowledge-store.js')).href)

const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-scale-'))
try {
  const lines = []
  for (let i = 0; i < EVENTS; i += 1) {
    lines.push(JSON.stringify({ schemaVersion: 1, id: 'e' + i, at: '2026-01-01T00:00:00.000Z', kind: 'lesson.create', idempotencyKey: 'k' + i, lessonId: 'l' + i, payload: {} }))
  }
  writeFileSync(join(dir, 'events.jsonl'), lines.join('\n') + '\n', 'utf8')
  const sizeMb = statSync(join(dir, 'events.jsonl')).size / 1048576
  const store = new KnowledgeStore(dir)

  const t0 = Date.now(); store.listLessons(); const t1 = Date.now()
  store.listEvidence(); const t2 = Date.now()
  store.stats(); const t3 = Date.now()

  const rows = [
    ['events', EVENTS + ' 条 / ' + sizeMb.toFixed(1) + ' MB'],
    ['listLessons', (t1 - t0) + ' ms'],
    ['listEvidence', (t2 - t1) + ' ms'],
    ['stats', (t3 - t2) + ' ms'],
    ['panel 打开合计', (t3 - t0) + ' ms'],
    ['预算', BUDGET_MS + ' ms/次'],
  ]
  for (const [name, value] of rows) console.log(name.padEnd(16) + value)

  const over = [t1 - t0, t2 - t1, t3 - t2].filter((ms) => ms > BUDGET_MS)
  if (over.length > 0) {
    console.error('规模超预算：' + over.join(' ms / ') + ' ms（阈值 ' + BUDGET_MS + ' ms）；考虑读取 index.json 命中或一次快照。')
    process.exitCode = 1
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
