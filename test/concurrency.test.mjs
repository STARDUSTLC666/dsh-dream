/**
 * 并发写压力测试（默认跳过，不进常规 CI）。
 *
 * 运行：DSH_DREAM_STRESS=1 node --test test/concurrency.test.mjs
 *
 * 覆盖 M1 提案 1：8 进程 × 8 次 dream_learn + dream_save，
 * 断言知识库零丢失、dreams.jsonl 零丢行、无 .lock 残留、无 io 报错。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ENABLED = process.env.DSH_DREAM_STRESS === '1'
const WORKERS = 8
const PER_WORKER = 8
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const storeUrl = pathToFileURL(join(root, 'lib', 'knowledge-store.js')).href
const journalUrl = pathToFileURL(join(root, 'lib', 'journal.js')).href

function runWorker(dir, workerId) {
  const script = [
    'const { KnowledgeStore } = await import(' + JSON.stringify(storeUrl) + ')',
    'const { saveDream } = await import(' + JSON.stringify(journalUrl) + ')',
    'const store = new KnowledgeStore(' + JSON.stringify(join(dir, 'knowledge')) + ')',
    'for (let i = 0; i < ' + PER_WORKER + '; i++) {',
    '  store.createLesson({ kind: "fact", title: "并发经验 w" + ' + workerId + ' + "-" + i, action: "a", when: "w", evidence: [{ kind: "session", sessionId: "s' + workerId + '-" + i, recordSeq: i, summary: "ev", verification: "read" }] }, "stress-' + workerId + '-" + i)',
    '  saveDream(' + JSON.stringify(dir) + ', "并发梦 w' + workerId + '-" + i, ["l"], "平静")',
    '}',
  ].join('\n')
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (chunk) => { stderr += String(chunk) })
    child.on('close', (code) => resolve({ workerId, code, stderr }))
  })
}

test('并发写：8 进程 × 8 次不丢（默认跳过，DSH_DREAM_STRESS=1 运行）', { skip: ENABLED ? false : '设置 DSH_DREAM_STRESS=1 运行', timeout: 180000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-stress-'))
  try {
    const results = await Promise.all(Array.from({ length: WORKERS }, (_, index) => runWorker(dir, index)))
    const failed = results.filter((item) => item.code !== 0)
    assert.deepEqual(failed.map((item) => '#w' + item.workerId + ' ' + item.stderr.slice(0, 200)), [], 'worker 不得报错')

    const { KnowledgeStore } = await import('../lib/knowledge-store.js')
    const stats = new KnowledgeStore(join(dir, 'knowledge')).stats()
    assert.equal(stats.lessons, WORKERS * PER_WORKER, '知识条数丢失')
    // 每条经验 = 1 个 lesson.create 事件 + 1 条 evidence（1 个 evidence.add 事件）
    assert.equal(stats.evidence, WORKERS * PER_WORKER, '证据条数丢失')
    assert.equal(stats.events, WORKERS * PER_WORKER * 2, '事件条数丢失')
    assert.equal(existsSync(join(dir, 'knowledge', '.lock')), false, '不得残留 .lock')

    const lines = readFileSync(join(dir, 'dreams.jsonl'), 'utf8').split('\n').filter((line) => line.trim() !== '')
    assert.equal(lines.length, WORKERS * PER_WORKER, 'dreams.jsonl 丢行')
    for (const line of lines) assert.doesNotThrow(() => JSON.parse(line), '存在半截/交错行')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
