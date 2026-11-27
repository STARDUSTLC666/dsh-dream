#!/usr/bin/env node
/**
 * dsh-dream 多维度记忆评测与竞品横向对比脚本（零外部依赖，100% 本地可复现）。
 *
 * 覆盖 4 套互补评测：
 *   1. bench6-100-zh-en  （100 题中英双查 × 137 LoCoMo turns，含 Lingshu / Vector RAG / Letta / Mem0 / Graphiti / GraphRAG 同口径对照）
 *   2. locomo-zh-500     （500 题中文检索 × 567 turns，五类题型细分 + 延迟对比）
 *   3. memory-bench-1000 （1000 条真实含噪记忆：250 signal + 400 noise + 350 unlabeled + 18 项密钥脱敏 / 8 项良性防误杀安全审计）
 *   4. dsh-agent-eval-40 （40 场景 DeepSeek Harness 工程记忆治理与条件召回评测：8 大维度）
 *
 * 用法：
 *   node scripts/benchmark-memory.mjs
 *   node scripts/benchmark-memory.mjs --label v0.19.3-baseline --json baseline.json
 *   node scripts/benchmark-memory.mjs --dsh-memory-dir ../dsh-memory
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const argv = process.argv.slice(2)
function readFlag(name, fallback) {
  const idx = argv.indexOf(name)
  if (idx < 0 || argv[idx + 1] === undefined) return fallback
  return argv[idx + 1]
}

const LABEL = readFlag('--label', 'current')
const JSON_OUT = readFlag('--json', '')
const DSH_MEMORY_DIR = resolve(readFlag('--dsh-memory-dir', join(REPO_ROOT, '..', 'dsh-memory')))

const dreamMod = await import(pathToFileURL(join(REPO_ROOT, 'lib', 'index.js')).href)
const {
  retrieveLessons,
  retrievedLessonChars,
  rankInversionCount,
  maskSecrets,
  isDreamReference,
  simDirectory,
} = dreamMod

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function readJsonl(filePath) {
  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

function firstEvidenceRank(ids, evidenceSet) {
  if (!evidenceSet || evidenceSet.size === 0) return 0
  for (let i = 0; i < ids.length; i += 1) {
    if (evidenceSet.has(ids[i])) return i + 1
  }
  return 0
}

function summarizeRanks(rows, k = 5) {
  const n = rows.length
  if (n === 0) return { n: 0, hit1: 0, hitk: 0, mrr: 0, byQtype: {} }
  let hit1 = 0
  let hitk = 0
  let mrrSum = 0
  const groups = new Map()
  for (const row of rows) {
    if (row.rank === 1) hit1 += 1
    if (row.rank > 0 && row.rank <= k) hitk += 1
    if (row.rank > 0) mrrSum += 1 / row.rank
    if (row.qtype) {
      if (!groups.has(row.qtype)) groups.set(row.qtype, [])
      groups.get(row.qtype).push(row)
    }
  }
  const byQtype = {}
  for (const [qt, list] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const gn = list.length
    let gh1 = 0, ghk = 0, gmrr = 0
    for (const r of list) {
      if (r.rank === 1) gh1 += 1
      if (r.rank > 0 && r.rank <= k) ghk += 1
      if (r.rank > 0) gmrr += 1 / r.rank
    }
    byQtype[qt] = { n: gn, hit1: gh1 / gn, hitk: ghk / gn, mrr: gmrr / gn }
  }
  return { n, hit1: hit1 / n, hitk: hitk / n, mrr: mrrSum / n, byQtype }
}

const pct = (v) => (v * 100).toFixed(1).padStart(5) + '%'
const num4 = (v) => v.toFixed(4)

// ---------------------------------------------------------------------------
// Reference baseline retrievers (pure Okapi BM25 & Char-2gram Cosine)
// ---------------------------------------------------------------------------

function simpleTokenize(text) {
  const lower = String(text ?? '').normalize('NFC').toLowerCase()
  const out = []
  for (const tok of lower.split(/[^\p{L}\p{N}_-]+/u)) {
    if (!tok) continue
    if (/^\p{Script=Han}+$/u.test(tok)) {
      if (tok.length === 1) out.push(tok)
      for (let i = 0; i + 1 < tok.length; i += 1) out.push(tok.slice(i, i + 2))
    } else if (tok.length >= 2) {
      out.push(tok)
    }
  }
  return out
}

class OkapiBM25Index {
  constructor(docs) {
    // docs: [{ id, text }]
    this.docs = docs.map((d) => {
      const tokens = simpleTokenize(d.text)
      const tf = new Map()
      for (const tok of tokens) tf.set(tok, (tf.get(tok) ?? 0) + 1)
      return { id: d.id, tf, len: tokens.length }
    })
    this.N = Math.max(1, this.docs.length)
    this.avgdl = this.docs.reduce((s, d) => s + d.len, 0) / this.N || 1
    this.df = new Map()
    for (const d of this.docs) {
      for (const tok of d.tf.keys()) this.df.set(tok, (this.df.get(tok) ?? 0) + 1)
    }
  }
  search(query, k = 5) {
    const qTokens = [...new Set(simpleTokenize(query))]
    const k1 = 1.5, b = 0.75
    const scored = []
    for (const doc of this.docs) {
      let score = 0
      for (const tok of qTokens) {
        const freq = doc.tf.get(tok) ?? 0
        if (freq === 0) continue
        const df = this.df.get(tok) ?? 0
        const idf = Math.log(1 + (this.N - df + 0.5) / (df + 0.5))
        score += idf * ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc.len / this.avgdl))))
      }
      if (score > 0) scored.push({ id: doc.id, score })
    }
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    return scored.slice(0, k).map((x) => x.id)
  }
}

class CharBigramCosineIndex {
  constructor(docs) {
    const toVec = (text) => {
      const s = String(text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
      const m = new Map()
      for (let i = 0; i + 1 < s.length; i += 1) {
        const g = s.slice(i, i + 2)
        m.set(g, (m.get(g) ?? 0) + 1)
      }
      let norm = 0
      for (const v of m.values()) norm += v * v
      return { m, norm: Math.sqrt(norm) || 1 }
    }
    this.toVec = toVec
    this.docs = docs.map((d) => ({ id: d.id, ...toVec(d.text) }))
  }
  search(query, k = 5) {
    const q = this.toVec(query)
    const scored = []
    for (const d of this.docs) {
      let dot = 0
      for (const [g, w] of q.m) {
        const dw = d.m.get(g)
        if (dw) dot += w * dw
      }
      if (dot > 0) scored.push({ id: d.id, score: dot / (q.norm * d.norm) })
    }
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    return scored.slice(0, k).map((x) => x.id)
  }
}

// ---------------------------------------------------------------------------
// dsh-dream Lesson builder helper for benchmark corpora
// ---------------------------------------------------------------------------

function makeBenchmarkLesson({ id, title, action, when, rationale, prevents, problemKey, files, exceptions = [], evidenceSummary, scope = { global: true }, applicability = [], state = 'usable', review = { decision: 'accepted', actor: 'human' }, independentSupportCount = 1, lastValidatedAt = '2026-11-20T00:00:00.000Z', reviewAfter }) {
  const evId = evidenceSummary ? `evd_${id}` : undefined
  const lesson = {
    schemaVersion: 1,
    id,
    revision: 1,
    kind: 'fact',
    title,
    action,
    when,
    exceptions,
    ...(rationale ? { rationale } : {}),
    ...(prevents ? { prevents } : {}),
    ...(problemKey ? { problemKey } : {}),
    ...(files ? { files } : {}),
    scope,
    applicability,
    state,
    evidenceIds: evId ? [evId] : [],
    independentSupportCount,
    review,
    createdAt: lastValidatedAt,
    updatedAt: lastValidatedAt,
    lastValidatedAt,
    ...(reviewAfter ? { reviewAfter } : {}),
    conflictIds: [],
  }
  const evidence = evId
    ? {
        schemaVersion: 1,
        id: evId,
        kind: 'session',
        sessionId: 'bench-sess',
        recordSeq: 1,
        observedAt: lastValidatedAt,
        summary: evidenceSummary,
        verification: 'read',
        sourceHash: 'a'.repeat(64),
      }
    : undefined
  return { lesson, evidence }
}

// ---------------------------------------------------------------------------
// Benchmark 1: bench6-100-zh-en (100 bilingual questions x 137 turns)
// ---------------------------------------------------------------------------

function runBench6() {
  const benchDir = join(DSH_MEMORY_DIR, 'data', 'benchmarks', 'bench6-100-zh-en')
  const locomoDir = join(DSH_MEMORY_DIR, 'data', 'benchmarks', 'locomo-zh-500')
  if (!existsSync(join(benchDir, 'questions.jsonl'))) {
    return { skipped: true, reason: `missing ${benchDir}` }
  }
  const questions = readJsonl(join(benchDir, 'questions.jsonl'))
  const pool = readJsonl(join(benchDir, 'pool.jsonl'))
  const resultsSnap = existsSync(join(benchDir, 'results_v1.0.json'))
    ? JSON.parse(readFileSync(join(benchDir, 'results_v1.0.json'), 'utf8'))
    : null

  // Optional bilingual corpus lookup (same structured-ingestion layer as Lingshu)
  const corpusById = new Map()
  if (existsSync(join(locomoDir, 'corpus567.jsonl'))) {
    for (const row of readJsonl(join(locomoDir, 'corpus567.jsonl'))) {
      corpusById.set(row.id, row)
    }
  }

  // Track A: Raw English pool.jsonl only
  const tIngestRaw0 = performance.now()
  const rawLessons = []
  const rawEvidence = []
  for (const rec of pool) {
    const built = makeBenchmarkLesson({
      id: rec.id,
      title: `${rec.speaker}: ${rec.text.slice(0, 120)}`,
      when: `${rec.speaker} on ${rec.date}`,
      action: rec.text,
      evidenceSummary: rec.ingest,
    })
    rawLessons.push(built.lesson)
    if (built.evidence) rawEvidence.push(built.evidence)
  }
  const ingestRawMs = performance.now() - tIngestRaw0

  const evalDream = (lessons, evidence, lang) => {
    const t0 = performance.now()
    const rows = []
    for (const q of questions) {
      const qText = q['question_' + lang]
      const res = retrieveLessons(lessons, evidence, {
        query: qText,
        limit: 5,
        maxChars: 20000,
        includeCandidates: false,
        includeNoEvidence: false,
      })
      const ids = res.items.map((item) => item.lessonId)
      rows.push({ qid: q.qid, qtype: q.qtype, rank: firstEvidenceRank(ids, new Set(q.evidence_turns)) })
    }
    return { ...summarizeRanks(rows, 5), ms: performance.now() - t0 }
  }

  const dreamRawEn = evalDream(rawLessons, rawEvidence, 'en')
  const dreamRawZh = evalDream(rawLessons, rawEvidence, 'zh')

  // Track B: Bilingual structured ingestion (same fields as Lingshu corpus567)
  let dreamBilingual = null
  let bm25Bilingual = null
  if (corpusById.size > 0) {
    const tIngestBi0 = performance.now()
    const biLessons = []
    const biEvidence = []
    const biDocs = []
    for (const rec of pool) {
      const c = corpusById.get(rec.id)
      const f = c?.zh_fields
      if (f) {
        const condText = Object.entries(f.condition ?? {}).map(([k, v]) => `${k}:${v}`).join(' ')
        const termsText = Array.isArray(f.terms) ? f.terms.join(' ') : ''
        const built = makeBenchmarkLesson({
          id: rec.id,
          title: `${f.identity}｜${f.summary}`,
          when: `${f.time}｜${condText}`,
          action: `${termsText}｜${rec.text}`,
          rationale: c.zh,
          evidenceSummary: rec.text,
        })
        biLessons.push(built.lesson)
        if (built.evidence) biEvidence.push(built.evidence)
        biDocs.push({ id: rec.id, text: `${f.identity} ${f.time} ${f.summary} ${termsText} ${condText} ${rec.text}` })
      } else {
        const built = makeBenchmarkLesson({
          id: rec.id,
          title: `${rec.speaker}: ${rec.text.slice(0, 120)}`,
          when: `${rec.speaker} on ${rec.date}`,
          action: rec.text,
          evidenceSummary: rec.ingest,
        })
        biLessons.push(built.lesson)
        if (built.evidence) biEvidence.push(built.evidence)
        biDocs.push({ id: rec.id, text: rec.ingest })
      }
    }
    const ingestBiMs = performance.now() - tIngestBi0
    dreamBilingual = {
      ingestMs: ingestBiMs,
      en: evalDream(biLessons, biEvidence, 'en'),
      zh: evalDream(biLessons, biEvidence, 'zh'),
    }
    const bm25Idx = new OkapiBM25Index(biDocs)
    const evalIdx = (idx, lang) => {
      const t0 = performance.now()
      const rows = questions.map((q) => ({
        qid: q.qid,
        qtype: q.qtype,
        rank: firstEvidenceRank(idx.search(q['question_' + lang], 5), new Set(q.evidence_turns)),
      }))
      return { ...summarizeRanks(rows, 5), ms: performance.now() - t0 }
    }
    bm25Bilingual = { en: evalIdx(bm25Idx, 'en'), zh: evalIdx(bm25Idx, 'zh') }
  }

  // Raw baselines (BM25 & Char2gram on raw English pool.jsonl)
  const rawDocs = pool.map((rec) => ({ id: rec.id, text: `${rec.speaker} ${rec.date} ${rec.text}` }))
  const bm25RawIdx = new OkapiBM25Index(rawDocs)
  const charRawIdx = new CharBigramCosineIndex(rawDocs)
  const evalIndex = (idx, lang) => {
    const t0 = performance.now()
    const rows = questions.map((q) => ({
      qid: q.qid,
      qtype: q.qtype,
      rank: firstEvidenceRank(idx.search(q['question_' + lang], 5), new Set(q.evidence_turns)),
    }))
    return { ...summarizeRanks(rows, 5), ms: performance.now() - t0 }
  }

  const publishedArms = {}
  if (resultsSnap?.arms) {
    for (const [arm, payload] of Object.entries(resultsSnap.arms)) {
      publishedArms[arm] = {
        zh: payload.langs?.zh?.summary,
        en: payload.langs?.en?.summary,
      }
    }
  }

  return {
    skipped: false,
    questions: questions.length,
    poolSize: pool.length,
    dreamRaw: { ingestMs: ingestRawMs, en: dreamRawEn, zh: dreamRawZh },
    bm25Raw: { en: evalIndex(bm25RawIdx, 'en'), zh: evalIndex(bm25RawIdx, 'zh') },
    char2gramRaw: { en: evalIndex(charRawIdx, 'en'), zh: evalIndex(charRawIdx, 'zh') },
    dreamBilingual,
    bm25Bilingual,
    publishedArms,
  }
}

// ---------------------------------------------------------------------------
// Benchmark 2: locomo-zh-500 (500 Chinese queries x 567 turns)
// ---------------------------------------------------------------------------

function runLocomoZh500() {
  const locomoDir = join(DSH_MEMORY_DIR, 'data', 'benchmarks', 'locomo-zh-500')
  if (!existsSync(join(locomoDir, 'corpus567.jsonl'))) {
    return { skipped: true, reason: `missing ${locomoDir}` }
  }
  const corpus = readJsonl(join(locomoDir, 'corpus567.jsonl'))
  const questions = readJsonl(join(locomoDir, 'questions500.jsonl'))

  const tIng0 = performance.now()
  const lessons = []
  const evidence = []
  const docs = []
  for (const c of corpus) {
    const f = c.zh_fields ?? {}
    const condText = Object.entries(f.condition ?? {}).map(([k, v]) => `${k}:${v}`).join(' ')
    const termsText = Array.isArray(f.terms) ? f.terms.join(' ') : ''
    const built = makeBenchmarkLesson({
      id: c.id,
      title: `${f.identity ?? c.speaker}｜${f.summary ?? ''}`,
      when: `${f.time ?? c.date}｜${condText}`,
      action: `${termsText}｜${c.text}`,
      rationale: c.zh,
      evidenceSummary: c.text,
    })
    lessons.push(built.lesson)
    if (built.evidence) evidence.push(built.evidence)
    docs.push({ id: c.id, text: `${f.identity ?? ''} ${f.time ?? ''} ${f.summary ?? ''} ${termsText} ${condText} ${c.text}` })
  }
  const ingestMs = performance.now() - tIng0

  const tDream0 = performance.now()
  const dreamRows = []
  for (const q of questions) {
    const res = retrieveLessons(lessons, evidence, {
      query: q.question,
      limit: 5,
      maxChars: 20000,
      includeCandidates: false,
      includeNoEvidence: false,
    })
    dreamRows.push({
      qid: q.qid,
      qtype: q.qtype,
      rank: firstEvidenceRank(res.items.map((x) => x.lessonId), new Set(q.evidence_turns)),
    })
  }
  const dreamMs = performance.now() - tDream0

  const tBmIng0 = performance.now()
  const bm25Idx = new OkapiBM25Index(docs)
  const bm25IngestMs = performance.now() - tBmIng0
  const tBm0 = performance.now()
  const bm25Rows = questions.map((q) => ({
    qid: q.qid,
    qtype: q.qtype,
    rank: firstEvidenceRank(bm25Idx.search(q.question, 5), new Set(q.evidence_turns)),
  }))
  const bm25Ms = performance.now() - tBm0

  const tChIng0 = performance.now()
  const charIdx = new CharBigramCosineIndex(docs)
  const charIngestMs = performance.now() - tChIng0
  const tCh0 = performance.now()
  const charRows = questions.map((q) => ({
    qid: q.qid,
    qtype: q.qtype,
    rank: firstEvidenceRank(charIdx.search(q.question, 5), new Set(q.evidence_turns)),
  }))
  const charMs = performance.now() - tCh0

  return {
    skipped: false,
    corpusSize: corpus.length,
    questions: questions.length,
    ingestMs,
    dream: { ...summarizeRanks(dreamRows, 5), ingestMs, ms: dreamMs },
    bm25: { ...summarizeRanks(bm25Rows, 5), ingestMs: bm25IngestMs, ms: bm25Ms },
    char2gram: { ...summarizeRanks(charRows, 5), ingestMs: charIngestMs, ms: charMs },
  }
}

// ---------------------------------------------------------------------------
// Benchmark 3: memory-bench-1000 (250 signal + 400 noise + 350 unlabeled)
// + 18-secret + 8-benign Secret Redaction Safety Audit
// ---------------------------------------------------------------------------

function runMemoryBench1000() {
  const filePath = join(DSH_MEMORY_DIR, 'data', 'memory-bench-1000.jsonl')
  if (!existsSync(filePath)) {
    return { skipped: true, reason: `missing ${filePath}` }
  }
  const rows = readJsonl(filePath)
  const labelById = new Map(rows.map((r) => [r.id, r.label]))
  const signals = rows.filter((r) => r.label === 'signal')

  const tDreamIng0 = performance.now()
  const lessons = []
  const evidence = []
  for (const r of rows) {
    const tags = Array.isArray(r.tags) ? r.tags.join(' ') : ''
    const built = makeBenchmarkLesson({
      id: r.id,
      title: r.text.slice(0, 120),
      when: `${r.category} ${tags}`.trim(),
      action: r.text,
      evidenceSummary: r.text.slice(0, 160),
      lastValidatedAt: new Date((r.observed_at || 1787183927) * 1000).toISOString(),
    })
    lessons.push(built.lesson)
    if (built.evidence) evidence.push(built.evidence)
  }
  const dreamIngestMs = performance.now() - tDreamIng0

  const docs = rows.map((r) => ({
    id: r.id,
    text: `${r.text} ${r.category} ${Array.isArray(r.tags) ? r.tags.join(' ') : ''}`,
  }))

  // Query each signal record with a realistic partial prompt (first 40 chars)
  const queryOf = (r) => r.text.replace(/\s+/g, ' ').trim().slice(0, 40)

  const evalPool = (searchFn) => {
    const t0 = performance.now()
    let hit1 = 0, hit5 = 0, mrr = 0
    let sigInTop5 = 0, noiseInTop5 = 0, totalReturned = 0
    for (const s of signals) {
      const ids = searchFn(queryOf(s))
      const rank = firstEvidenceRank(ids, new Set([s.id]))
      if (rank === 1) hit1 += 1
      if (rank > 0 && rank <= 5) hit5 += 1
      if (rank > 0) mrr += 1 / rank
      for (const id of ids.slice(0, 5)) {
        totalReturned += 1
        const lbl = labelById.get(id)
        if (lbl === 'signal') sigInTop5 += 1
        else if (lbl === 'noise') noiseInTop5 += 1
      }
    }
    const n = signals.length
    return {
      n,
      hit1: hit1 / n,
      hit5: hit5 / n,
      mrr: mrr / n,
      signalPrecision5: totalReturned > 0 ? sigInTop5 / totalReturned : 0,
      noiseRate5: totalReturned > 0 ? noiseInTop5 / totalReturned : 0,
      ms: performance.now() - t0,
    }
  }

  const maxObs = rows.reduce((m, r) => Math.max(m, r.observed_at || 0), 0)
  const benchNow = (maxObs > 0 ? maxObs + 86400 : Date.parse('2026-09-05T00:00:00.000Z') / 1000) * 1000

  const dreamRes = {
    ingestMs: dreamIngestMs,
    ...evalPool((q) => retrieveLessons(lessons, evidence, {
      query: q,
      limit: 5,
      maxChars: 20000,
      includeCandidates: false,
      includeNoEvidence: false,
      now: benchNow,
    }).items.map((x) => x.lessonId)),
  }

  const tBmIng0 = performance.now()
  const bm25Idx = new OkapiBM25Index(docs)
  const bm25IngestMs = performance.now() - tBmIng0
  const bm25Res = { ingestMs: bm25IngestMs, ...evalPool((q) => bm25Idx.search(q, 5)) }

  const tChIng0 = performance.now()
  const charIdx = new CharBigramCosineIndex(docs)
  const charIngestMs = performance.now() - tChIng0
  const charRes = { ingestMs: charIngestMs, ...evalPool((q) => charIdx.search(q, 5)) }

  // Secret redaction audit (18 secret patterns + 8 benign false-positive guards)
  const secretCases = [
    { name: 'OpenAI sk-', input: 'key=sk-proj-AbCdEfGhIjKlMnOpQrStUvWx1234', leak: 'AbCdEfGhIjKlMnOpQrStUvWx1234' },
    { name: 'Anthropic sk-ant-', input: 'ANTHROPIC_API_KEY=sk-ant-api03-ZxYwVuTsRqPoNmLkJiHgFeDc12', leak: 'ZxYwVuTsRqPoNmLkJiHgFeDc12' },
    { name: 'GitHub ghp_', input: 'token ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4', leak: 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4' },
    { name: 'AWS AKIA', input: 'AKIAIOSFODNN7EXAMPLE', leak: 'AKIAIOSFODNN7EXAMPLE' },
    { name: 'JWT', input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig', leak: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
    { name: 'Bearer header', input: 'Authorization: Bearer tok_live_9a8b7c6d5e4f3g2h1i0j', leak: 'tok_live_9a8b7c6d5e4f3g2h1i0j' },
    { name: 'Basic auth header', input: 'Authorization: Basic dXNlcjpzdXBlcnNlY3JldA==', leak: 'dXNlcjpzdXBlcnNlY3JldA==' },
    { name: 'PEM private key', input: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAtestkeydata\n-----END RSA PRIVATE KEY-----', leak: 'MIIEpAIBAAKCAQEAtestkeydata' },
    { name: 'Postgres URI', input: 'postgres://admin:S3cr3tP4ss!@db.internal:5432/prod', leak: 'S3cr3tP4ss!' },
    { name: 'Redis password-only URI', input: 'redis://:RedisOnlyPass99@127.0.0.1:6379/0', leak: 'RedisOnlyPass99' },
    { name: 'HTTPS basic-auth URI', input: 'https://deploy:GitTokenPass88!@git.example.com/org/repo.git', leak: 'GitTokenPass88!' },
    { name: 'KV password', input: 'password: MySuperSecretPassword99', leak: 'MySuperSecretPassword99' },
    { name: 'Quoted JSON password', input: '{"password": "JsonSecretPass99", "apiKey": "json_api_key_887766"}', leak: 'JsonSecretPass99' },
    { name: 'Prefixed env DB_PASSWORD', input: 'DB_PASSWORD=EnvSecretPass99 JWT_SECRET=JwtSignSecret88', leak: 'EnvSecretPass99' },
    { name: 'URL query token (keeps &page=2)', input: 'https://api.example.com/v1?token=UrlSecretToken99&page=2', leak: 'UrlSecretToken99', keep: '&page=2' },
    { name: 'Full-width sk-', input: '密钥 ｓｋ－ＡｂＣｄＥｆＧｈＩｊＫｌＭｎＯｐＱｒＳｔ', leak: 'ＡｂＣｄＥｆＧｈＩｊＫｌＭｎＯｐＱｒＳｔ' },
    { name: 'Full-width password', input: 'ｐａｓｓｗｏｒｄ：ｓｅｃｒｅｔ９９８８７７', leak: 'ｓｅｃｒｅｔ９９８８７７' },
    { name: 'HuggingFace hf_', input: 'hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234', leak: 'AbCdEfGhIjKlMnOpQrStUvWxYz1234' },
  ]
  const benignCases = [
    { name: 'Normal Chinese text', input: '修改 src/retrieval.ts 后运行 npm test 验证检索排序。' },
    { name: 'Dream lesson ID', input: 'lsn_12345678-1234-1234-1234-123456789abc', ref: true },
    { name: 'Code camelCase & TS types', input: 'interface Cfg { password: string; token: number; apiKey: undefined }' },
    { name: 'disk-space & task- prefixes', input: 'disk-space-checker-1234567890abcdef task-runner-worker-1234567890abcdef' },
    { name: 'GitHub & passwordless URI', input: 'https://github.com/STARDUSTLC666/dsh-dream postgres://localhost:5432/mydb' },
    { name: 'Long workspace file path', input: 'packages/Core/SessionQuery/SessionQuerySqlite/src/IndexFile.ts' },
    { name: 'Basic English prose', input: 'basic implementation details for auth module' },
    { name: 'Semver range', input: 'nodemailer ^9.0.5 >=9.0.0 <10.0.0' },
  ]

  let secretCaught = 0
  const secretDetails = []
  for (const c of secretCases) {
    const out = maskSecrets(c.input)
    const ok = !out.includes(c.leak) && (!c.keep || out.includes(c.keep))
    if (ok) secretCaught += 1
    secretDetails.push({ name: c.name, caught: ok })
  }
  let benignClean = 0
  const benignDetails = []
  for (const c of benignCases) {
    const out = maskSecrets(c.input, c.ref && isDreamReference(c.input) ? [c.input] : [])
    const ok = out === c.input
    if (ok) benignClean += 1
    benignDetails.push({ name: c.name, clean: ok })
  }

  return {
    skipped: false,
    totalRows: rows.length,
    signalRows: signals.length,
    dream: dreamRes,
    bm25: bm25Res,
    char2gram: charRes,
    safety: {
      secretCaught,
      secretTotal: secretCases.length,
      benignClean,
      benignTotal: benignCases.length,
      secretDetails,
      benignDetails,
    },
  }
}

// ---------------------------------------------------------------------------
// Benchmark 4: dsh-agent-eval-40 (40 Coding-Agent Governance & Conditional Recall Scenarios)
// ---------------------------------------------------------------------------

function runAgentGovernanceEval() {
  const NOW = Date.parse('2026-11-27T00:00:00.000Z')

  const cases = [
    // --- Axis 1: Technical Error / prevents / Identifier / Morphology Recall (8 cases) ---
    {
      axis: '1.technical-recall',
      id: 'T1',
      desc: 'Error signature stored only in prevents field',
      lessons: [
        makeBenchmarkLesson({ id: 'L_prev', title: '连接池优雅关闭策略', when: '关闭 HTTP 上游连接时', action: '先 drain 再关闭连接', prevents: 'ECONNRESET premature hang up' }),
        makeBenchmarkLesson({ id: 'L_noise', title: '通用 HTTP 日志配置', when: '记录 HTTP 请求时', action: '打印状态码和耗时' }),
      ],
      query: { query: 'ECONNRESET premature hang' },
      expectTop: 'L_prev',
    },
    {
      axis: '1.technical-recall',
      id: 'T2',
      desc: 'camelCase identifier split: query "session query" matches sessionQuery',
      lessons: [
        makeBenchmarkLesson({ id: 'L_camel', title: '优先使用 sessionQuery 读取实时会话', when: '回放活跃会话时', action: '通过 ctx.sessionQuery.readSession 获取事件' }),
        makeBenchmarkLesson({ id: 'L_noise', title: '读取普通配置文件', when: '初始化配置时', action: '解析 JSON 配置' }),
      ],
      query: { query: 'how to use session query for live sessions' },
      expectTop: 'L_camel',
    },
    {
      axis: '1.technical-recall',
      id: 'T3',
      desc: 'English inflection/stemming: retrying -> retry, connections -> connection',
      lessons: [
        makeBenchmarkLesson({ id: 'L_morph', title: 'Idempotent retry policy for dropped connection', when: 'handling dropped connection', action: 'retry with exponential backoff and verify closure' }),
        makeBenchmarkLesson({ id: 'L_noise', title: 'Format JSON output nicely', when: 'printing logs', action: 'use 2-space indent' }),
      ],
      query: { query: 'retrying dropped connections' },
      expectTop: 'L_morph',
    },
    {
      axis: '1.technical-recall',
      id: 'T4',
      desc: 'No English substring false positive: "port" must NOT match "important/export/report"',
      lessons: [
        makeBenchmarkLesson({ id: 'L_fp', title: 'Important export report formatting rule', when: 'generating important report', action: 'export report with support summary' }),
        makeBenchmarkLesson({ id: 'L_port', title: 'SMTP port 587 with STARTTLS', when: 'mail delivery setup', action: 'use 587 instead of 465' }),
      ],
      query: { query: 'port' },
      expectTop: 'L_port',
    },
    {
      axis: '1.technical-recall',
      id: 'T5',
      desc: 'Bilingual technical bridge: Chinese query "脱敏" recalls English "maskSecrets/redact"',
      lessons: [
        makeBenchmarkLesson({ id: 'L_bi', title: 'Always redact tokens via maskSecrets before persistence', when: 'writing journal or evidence to disk', action: 'call maskSecrets on all user-supplied strings' }),
        makeBenchmarkLesson({ id: 'L_noise', title: 'Sort array deterministically', when: 'rendering lists', action: 'sort by updatedAt then id' }),
      ],
      query: { query: '落盘前如何做敏感信息脱敏' },
      expectTop: 'L_bi',
    },
    {
      axis: '1.technical-recall',
      id: 'T6',
      desc: 'Bilingual technical bridge: Chinese query "回滚" recalls English "rollback"',
      lessons: [
        makeBenchmarkLesson({ id: 'L_rb', title: 'Verify managed block hash before rollback', when: 'reverting AGENTS.md bridge changes', action: 'check afterBlockSha256 before restoring backup' }),
        makeBenchmarkLesson({ id: 'L_noise', title: 'Render markdown headings', when: 'exporting docs', action: 'use H2 sections' }),
      ],
      query: { query: '桥接写入后如何安全回滚' },
      expectTop: 'L_rb',
    },
    {
      axis: '1.technical-recall',
      id: 'T7',
      desc: 'Verified evidence text aids recall of concrete library detail',
      lessons: [
        makeBenchmarkLesson({ id: 'L_ev', title: '修复流式解析卡死', when: '读取大日志文件时', action: '改用分块读取避免一次性加载', evidenceSummary: '实测 zstdDecompressSync 在 64KiB 边界切分可稳定还原多帧日志' }),
        makeBenchmarkLesson({ id: 'L_noise', title: '修复普通日志格式', when: '写日志时', action: '加时间戳前缀', evidenceSummary: '普通日志测试' }),
      ],
      query: { query: 'zstdDecompressSync 64KiB 多帧' },
      expectTop: 'L_ev',
    },
    {
      axis: '1.technical-recall',
      id: 'T8',
      desc: 'Document length normalization: crisp exact rule outranks bloated noisy doc',
      lessons: [
        makeBenchmarkLesson({ id: 'L_bloat', title: '项目常规排查手册汇总', when: '排查各种构建、网络、数据库、前端、样式、部署、缓存、并发问题时', action: ('检查配置文件、日志、环境变量、锁文件、构建产物与超时设置。'.repeat(12)) + ' 如遇到 pnpm 问题也看看。' }),
        makeBenchmarkLesson({ id: 'L_crisp', title: 'Monorepo 用 pnpm --filter 跑单包测试', when: '执行单包单元测试时', action: '使用 pnpm --filter <pkg> test 避免全量构建' }),
      ],
      query: { query: 'pnpm filter 单包测试' },
      expectTop: 'L_crisp',
    },

    // --- Axis 2: Cross-Project / Workspace Isolation (5 cases) ---
    {
      axis: '2.scope-isolation',
      id: 'S1',
      desc: 'Exact project isolation: Proj A rule must NOT leak into Proj B',
      lessons: [
        makeBenchmarkLesson({ id: 'L_a', title: '项目 A 必须用 yarn berry', when: '安装依赖时', action: '运行 yarn install', scope: { projectId: 'proj-a', global: false } }),
      ],
      query: { query: '安装依赖 yarn berry', projectId: 'proj-b' },
      expectEmpty: true,
    },
    {
      axis: '2.scope-isolation',
      id: 'S2',
      desc: 'Unknown project returns ONLY global rules, never project-scoped rules',
      lessons: [
        makeBenchmarkLesson({ id: 'L_p', title: 'Redis 集群使用哨兵模式', when: '连接 Redis', action: '配置 sentinel', scope: { projectId: 'proj-redis', global: false } }),
        makeBenchmarkLesson({ id: 'L_g', title: 'Redis 键名统一带命名空间前缀', when: '写入 Redis', action: '加 app: 前缀', scope: { global: true } }),
      ],
      query: { query: 'Redis 连接 命名空间' },
      expectExact: ['L_g'],
    },
    {
      axis: '2.scope-isolation',
      id: 'S3',
      desc: 'Windows workspaceRoot case-insensitive & slash-normalized match',
      lessons: [
        makeBenchmarkLesson({ id: 'L_win', title: 'Windows 路径统一转正斜杠比较', when: '比对工作区路径', action: 'normalize slash', scope: { workspaceRoot: 'E:\\Antigravity\\DSH-Dream\\', global: false } }),
      ],
      query: { query: 'Windows 路径 工作区', workspaceRoot: 'e:/antigravity/dsh-dream' },
      expectExact: ['L_win'],
    },
    {
      axis: '2.scope-isolation',
      id: 'S4',
      desc: 'Unscoped non-global lesson never leaks into any project',
      lessons: [
        makeBenchmarkLesson({ id: 'L_unscoped', title: '无范围规则不应注入', when: '测试时', action: '跳过', scope: { global: false } }),
      ],
      query: { query: '无范围规则 注入', projectId: 'proj-a' },
      expectEmpty: true,
    },
    {
      axis: '2.scope-isolation',
      id: 'S5',
      desc: 'Canonical workspaceId matches even after worktree path differs',
      lessons: [
        makeBenchmarkLesson({ id: 'L_wsid', title: 'Worktree 构建带 --frozen-lockfile', when: '安装依赖时', action: '加 --frozen-lockfile', scope: { projectId: 'ws-uuid-42', global: false } }),
      ],
      query: { query: 'Worktree 安装依赖', projectId: 'ws-uuid-42', workspaceRoot: 'E:/worktrees/branch-2' },
      expectExact: ['L_wsid'],
    },

    // --- Axis 3: Version & Platform Conditional Gating (5 cases) ---
    {
      axis: '3.conditional-gating',
      id: 'C1',
      desc: 'Semver mismatch: Nodemailer ^9.0.0 excluded on 10.0.0',
      lessons: [
        makeBenchmarkLesson({ id: 'L_v9', title: 'Nodemailer 9 池化关闭坑', when: '取消发送时', action: '手动 close', applicability: [{ package: 'nodemailer', versions: '^9.0.0' }] }),
      ],
      query: { query: 'nodemailer 取消发送', packageName: 'nodemailer', packageVersion: '10.0.0' },
      expectEmpty: true,
      expectSkipReason: { L_v9: 'version-mismatch' },
    },
    {
      axis: '3.conditional-gating',
      id: 'C2',
      desc: 'Semver match: Nodemailer ^9.0.0 admitted on 9.0.5',
      lessons: [
        makeBenchmarkLesson({ id: 'L_v9', title: 'Nodemailer 9 池化关闭坑', when: '取消发送时', action: '手动 close', applicability: [{ package: 'nodemailer', versions: '^9.0.0' }] }),
      ],
      query: { query: 'nodemailer 取消发送', packageName: 'nodemailer', packageVersion: '9.0.5' },
      expectExact: ['L_v9'],
    },
    {
      axis: '3.conditional-gating',
      id: 'C3',
      desc: 'Platform mismatch: macOS-only rule excluded on Windows',
      lessons: [
        makeBenchmarkLesson({ id: 'L_mac', title: 'macOS Xcode git stub 检查', when: '解析 git 可执行文件', action: '检查 xcode-select -p', applicability: [{ platform: 'macos' }] }),
      ],
      query: { query: 'git 可执行文件', platform: 'win32' },
      expectEmpty: true,
      expectSkipReason: { L_mac: 'platform-mismatch' },
    },
    {
      axis: '3.conditional-gating',
      id: 'C4',
      desc: 'Platform match: Windows rule admitted on win32',
      lessons: [
        makeBenchmarkLesson({ id: 'L_win', title: 'Windows 用 py -X utf8 启动 Python', when: '运行 Python 脚本', action: '优先调用 py -X utf8', applicability: [{ platform: 'windows' }] }),
      ],
      query: { query: '运行 Python 脚本', platform: 'win32' },
      expectExact: ['L_win'],
    },
    {
      axis: '3.conditional-gating',
      id: 'C5',
      desc: 'Multi-platform union: linux|macos admitted on darwin, excluded on win32',
      lessons: [
        makeBenchmarkLesson({ id: 'L_unix', title: 'POSIX chmod 0600 保护密钥文件', when: '写凭据文件', action: 'chmod 0600', applicability: [{ platform: 'linux|macos' }] }),
      ],
      query: { query: '凭据文件 chmod', platform: 'darwin' },
      expectExact: ['L_unix'],
    },

    // --- Axis 4: Evidence & Human-Review Firewall (5 cases) ---
    {
      axis: '4.evidence-firewall',
      id: 'E1',
      desc: 'Claimed-only candidate without independent support held out',
      lessons: [
        makeBenchmarkLesson({ id: 'L_claim', title: '猜测端口是 465', when: '配置邮箱', action: '用 465', state: 'candidate', review: { decision: 'unreviewed' }, independentSupportCount: 0 }),
      ],
      query: { query: '配置邮箱 端口', includeCandidates: false, includeNoEvidence: false },
      expectEmpty: true,
      expectSkipReason: { L_claim: 'no-evidence' },
    },
    {
      axis: '4.evidence-firewall',
      id: 'E2',
      desc: 'Unreviewed candidate (even with read support) held when includeCandidates=false',
      lessons: [
        makeBenchmarkLesson({ id: 'L_cand', title: '自动提炼待审阅候选', when: '构建项目', action: '检查 lockfile', state: 'candidate', review: { decision: 'unreviewed' }, independentSupportCount: 1 }),
      ],
      query: { query: '构建项目 lockfile', includeCandidates: false, includeNoEvidence: false },
      expectEmpty: true,
      expectSkipReason: { L_cand: 'candidate-hold' },
    },
    {
      axis: '4.evidence-firewall',
      id: 'E3',
      desc: 'Human-accepted verified lesson beats unverified candidate on identical topic',
      lessons: [
        makeBenchmarkLesson({ id: 'L_guess', title: 'Outlook 默认端口 465', when: '配置 Outlook', action: '用 465', state: 'candidate', review: { decision: 'unreviewed' }, independentSupportCount: 0 }),
        makeBenchmarkLesson({ id: 'L_human', title: 'Outlook 用 587 STARTTLS', when: '配置 Outlook', action: '用 587', state: 'usable', review: { decision: 'accepted', actor: 'human' }, independentSupportCount: 1 }),
      ],
      query: { query: 'Outlook 端口', includeCandidates: false, includeNoEvidence: false },
      expectExact: ['L_human'],
    },
    {
      axis: '4.evidence-firewall',
      id: 'E4',
      desc: 'Usable rule ranks strictly above candidate when candidates are explicitly inspected',
      lessons: [
        makeBenchmarkLesson({ id: 'L_cand', title: 'Cordis 插件热重载规范', when: '热重载时', action: '清理 timer', state: 'candidate', review: { decision: 'unreviewed' }, independentSupportCount: 1 }),
        makeBenchmarkLesson({ id: 'L_use', title: 'Cordis 插件热重载规范', when: '热重载时', action: '注册 ctx.effect 清理', state: 'usable', review: { decision: 'accepted', actor: 'human' }, independentSupportCount: 1 }),
      ],
      query: { query: 'Cordis 插件热重载规范', includeCandidates: true, includeNoEvidence: false },
      expectTop: 'L_use',
    },
    {
      axis: '4.evidence-firewall',
      id: 'E5',
      desc: 'Unrelated topic produces strict zero injection (no hallucinated recall)',
      lessons: [
        makeBenchmarkLesson({ id: 'L_ppt', title: 'PPT 导出思源黑体', when: '生成幻灯片', action: '嵌入思源黑体' }),
      ],
      query: { query: 'SQLite WAL checkpoint 锁冲突' },
      expectEmpty: true,
    },

    // --- Axis 5: Conflict / Stale / Expired Anti-Hallucination Guard (5 cases) ---
    {
      axis: '5.anti-hallucination',
      id: 'H1',
      desc: 'Disputed conflicting rules are strictly suppressed (0 injection)',
      lessons: [
        makeBenchmarkLesson({ id: 'L_d1', title: '超时后自动重试发送', when: '发信超时', action: '重试 3 次', state: 'disputed' }),
        makeBenchmarkLesson({ id: 'L_d2', title: '超时后不要重试发送', when: '发信超时', action: '停止发送', state: 'disputed' }),
      ],
      query: { query: '发信超时 重试' },
      expectEmpty: true,
      expectSkipReason: { L_d1: 'state:disputed', L_d2: 'state:disputed' },
    },
    {
      axis: '5.anti-hallucination',
      id: 'H2',
      desc: 'Rejected lesson never leaks back into context',
      lessons: [
        makeBenchmarkLesson({ id: 'L_rej', title: '打印全量调试堆栈', when: '任何请求', action: 'console.log 全部参数', state: 'rejected', review: { decision: 'rejected', actor: 'human' } }),
      ],
      query: { query: '调试堆栈 console.log' },
      expectEmpty: true,
      expectSkipReason: { L_rej: 'state:rejected' },
    },
    {
      axis: '5.anti-hallucination',
      id: 'H3',
      desc: 'Stale lesson excluded until re-validated',
      lessons: [
        makeBenchmarkLesson({ id: 'L_stale', title: '旧版 API 端点路径', when: '调用上传接口', action: 'POST /v1/legacy', state: 'stale' }),
      ],
      query: { query: '上传接口 API 端点' },
      expectEmpty: true,
      expectSkipReason: { L_stale: 'state:stale' },
    },
    {
      axis: '5.anti-hallucination',
      id: 'H4',
      desc: 'Explicit reviewAfter deadline expired -> skipped: review-due',
      lessons: [
        makeBenchmarkLesson({ id: 'L_due', title: '临时绕过代理开关', when: '访问内网镜像', action: '临时关闭代理', reviewAfter: '2026-11-01T00:00:00.000Z' }),
      ],
      query: { query: '代理 内网镜像', now: NOW },
      expectEmpty: true,
      expectSkipReason: { L_due: 'review-due' },
    },
    {
      axis: '5.anti-hallucination',
      id: 'H5',
      desc: 'Fact older than 30 days automatically expires for re-check (review-due)',
      lessons: [
        makeBenchmarkLesson({ id: 'L_oldfact', title: '测试环境端口是 8081', when: '连测试环境', action: '使用 8081', lastValidatedAt: '2026-09-01T00:00:00.000Z' }),
      ],
      query: { query: '测试环境 端口 8081', now: NOW },
      expectEmpty: true,
      expectSkipReason: { L_oldfact: 'review-due' },
    },

    // --- Axis 6: File-Scoped & Contextual Recall (5 cases) ---
    {
      axis: '6.file-scoped-recall',
      id: 'F1',
      desc: 'activeFiles recalls file-bound lesson even on vague prompt',
      lessons: [
        makeBenchmarkLesson({ id: 'L_br', title: '保留 BOM 与 CRLF 原子写入', when: '更新管理块时', action: '先 fsync 再 rename', files: ['src/bridge.ts'] }),
        makeBenchmarkLesson({ id: 'L_other', title: '保持代码简洁', when: '重构时', action: '拆小函数', files: ['src/other.ts'] }),
      ],
      query: { query: '继续修改当前文件', activeFiles: ['src/bridge.ts'] },
      expectExact: ['L_br'],
    },
    {
      axis: '6.file-scoped-recall',
      id: 'F2',
      desc: 'File path mentioned in query text recalls file-bound lesson without explicit activeFiles',
      lessons: [
        makeBenchmarkLesson({ id: 'L_auto', title: '必须设 interpolate: false 防止模板崩溃', when: '注册上下文段时', action: '显式关闭插值', files: ['src/automatic.ts'] }),
        makeBenchmarkLesson({ id: 'L_other', title: '测试辅助函数', when: '写单测时', action: '用临时目录', files: ['test/helpers.mjs'] }),
      ],
      query: { query: '检查 src/automatic.ts 的改动' },
      expectTop: 'L_auto',
    },
    {
      axis: '6.file-scoped-recall',
      id: 'F3',
      desc: 'activeFiles suffix match works for nested workspace relative path',
      lessons: [
        makeBenchmarkLesson({ id: 'L_sub', title: 'schema 校验必须显式 additionalProperties', when: '定义工具参数时', action: '补齐 additionalProperties', files: ['tools.ts'] }),
      ],
      query: { query: '重构模块', activeFiles: ['packages/dream/src/tools.ts'] },
      expectExact: ['L_sub'],
    },
    {
      axis: '6.file-scoped-recall',
      id: 'F4',
      desc: 'Multiple activeFiles prioritize lesson matching more touched files',
      lessons: [
        makeBenchmarkLesson({ id: 'L_one', title: '工具层日志脱敏', when: '写日志时', action: '调用 maskSecrets', files: ['src/tools.ts'] }),
        makeBenchmarkLesson({ id: 'L_two', title: '桥接与工具参数一致性', when: '联动改动时', action: '同步更新 tools 与 bridge 契约', files: ['src/tools.ts', 'src/bridge.ts'] }),
      ],
      query: { query: '检查改动', activeFiles: ['src/tools.ts', 'src/bridge.ts'] },
      expectTop: 'L_two',
    },
    {
      axis: '6.file-scoped-recall',
      id: 'F5',
      desc: 'Non-matching activeFiles does not falsely inject unrelated file lesson',
      lessons: [
        makeBenchmarkLesson({ id: 'L_css', title: '暗色主题变量检查', when: '改样式时', action: '核对对比度', files: ['templates/workbench.module.css'] }),
      ],
      query: { query: '修数据库锁', activeFiles: ['src/knowledge-store.ts'] },
      expectEmpty: true,
    },

    // --- Axis 7: Budget Discipline & Zero Rank Inversion (4 cases) ---
    {
      axis: '7.budget-discipline',
      id: 'B1',
      desc: 'rankInversionCount === 0: stops on first oversized top-ranked item',
      lessons: [
        makeBenchmarkLesson({ id: 'L_big', title: 'B1 核心大规则', when: '预算检查时', action: 'x'.repeat(2000) }),
        makeBenchmarkLesson({ id: 'L_small', title: 'B1 次要小规则', when: '预算检查时', action: '短动作' }),
      ],
      query: { query: 'B1 规则 预算检查', maxChars: 500 },
      expectEmpty: true,
      checkRankInversion: true,
    },
    {
      axis: '7.budget-discipline',
      id: 'B2',
      desc: 'Essential when + exceptions are NEVER truncated when metadata is trimmed',
      lessons: [
        makeBenchmarkLesson({ id: 'L_ess', title: '关键安全约束', when: '修改生产数据库脚本时', action: '先做只读 dry-run 备份', exceptions: ['本地 sqlite 内存测试库例外'], evidenceSummary: '很长的来源证据摘要：' + '详细记录'.repeat(60) }),
      ],
      query: { query: '生产数据库 脚本 备份', maxChars: 95 },
      checkEssentialIntact: { id: 'L_ess', when: '修改生产数据库脚本时', exception: '本地 sqlite 内存测试库例外' },
    },
    {
      axis: '7.budget-discipline',
      id: 'B3',
      desc: 'Hard limit respected & exact budget never exceeded',
      lessons: Array.from({ length: 12 }, (_, i) => makeBenchmarkLesson({ id: `L_lim_${i}`, title: `缓存策略规范第 ${i} 条`, when: '处理缓存时', action: `执行步骤 ${i}` })),
      query: { query: '缓存策略规范', limit: 3, maxChars: 2000 },
      checkLimit: 3,
      checkRankInversion: true,
    },
    {
      axis: '7.budget-discipline',
      id: 'B4',
      desc: 'simDirectory retains negative memory (rejected/stale) within strict budget',
      customCheck: () => {
        const usable = makeBenchmarkLesson({ id: 'L_u', title: '保留根因字段', when: '写经验时', action: '填 rationale' }).lesson
        const rej = makeBenchmarkLesson({ id: 'L_r', title: '不要记全量日志', when: '调试时', action: '不记', state: 'rejected', review: { decision: 'rejected', actor: 'human', note: '噪声过大' } }).lesson
        const dir = simDirectory([usable, rej], { maxChars: 1200, now: NOW })
        return dir.usable.some((u) => u.id === 'L_u') && dir.history.some((h) => h.id === 'L_r' && h.reason === '噪声过大')
      },
    },

    // --- Axis 8: DSH Native Signals, Feedback & Verbatim Provenance (3 cases) ---
    {
      axis: '8.dsh-governance',
      id: 'D1',
      desc: 'DSH native positive/negative feedback gently breaks tie without mutating state',
      lessons: [
        makeBenchmarkLesson({ id: 'L_bad', title: '缓存键生成规范 A', when: '生成缓存键', action: '按路径拼接' }),
        makeBenchmarkLesson({ id: 'L_good', title: '缓存键生成规范 B', when: '生成缓存键', action: '按内容哈希' }),
      ],
      query: {
        query: '缓存键生成规范',
        observations: {
          L_bad: { positive: 0, negative: 3, corrections: 1, repeatToolHits: 0 },
          L_good: { positive: 3, negative: 0, corrections: 0, repeatToolHits: 0 },
        },
      },
      expectTop: 'L_good',
    },
    {
      axis: '8.dsh-governance',
      id: 'D2',
      desc: 'Cross-model mismatch flagged when origin.model != currentModel',
      lessons: [
        (() => {
          const b = makeBenchmarkLesson({ id: 'L_mod', title: 'Reasoner 专属提示策略', when: '规划复杂重构', action: '分步输出计划' })
          b.lesson.origin = { provider: 'deepseek', model: 'deepseek-reasoner' }
          return b
        })(),
      ],
      query: { query: '规划复杂重构', currentModel: 'deepseek-chat' },
      checkModelMismatch: 'L_mod',
    },
    {
      axis: '8.dsh-governance',
      id: 'D3',
      desc: 'Verbatim evidenceSummary & source traceability preserved 100%',
      lessons: [
        makeBenchmarkLesson({ id: 'L_prov', title: '原子重命名防断电损坏', when: '落盘 state.json', action: '先写临时文件再 rename', evidenceSummary: '复现断电测试：writeFileSync 直接覆盖曾截断 state.json' }),
      ],
      query: { query: 'state.json 断电 损坏' },
      checkEvidenceContains: 'writeFileSync 直接覆盖曾截断 state.json',
    },
  ]

  // Evaluate dsh-dream AND two ungated reference baselines (BM25 / Char2gram)
  const axes = {}
  const initAxis = (ax) => {
    if (!axes[ax]) axes[ax] = { total: 0, dream: 0, bm25: 0, char2gram: 0 }
    return axes[ax]
  }

  let dreamPass = 0, bm25Pass = 0, charPass = 0
  const failures = []

  for (const tc of cases) {
    const ax = initAxis(tc.axis)
    ax.total += 1
    if (tc.customCheck) {
      const ok = Boolean(tc.customCheck())
      if (ok) { dreamPass += 1; ax.dream += 1 }
      else failures.push({ id: tc.id, desc: tc.desc })
      // Ungated baselines have no simDirectory / governance
      continue
    }

    const lessons = tc.lessons.map((x) => x.lesson)
    const evidence = tc.lessons.map((x) => x.evidence).filter(Boolean)
    const q = { now: NOW, ...tc.query }
    const res = retrieveLessons(lessons, evidence, q)
    const ids = res.items.map((x) => x.lessonId)

    let ok = true
    if (tc.expectTop && ids[0] !== tc.expectTop) ok = false
    if (tc.expectEmpty && ids.length !== 0) ok = false
    if (tc.expectExact && JSON.stringify(ids) !== JSON.stringify(tc.expectExact)) ok = false
    if (tc.expectSkipReason) {
      for (const [lid, reason] of Object.entries(tc.expectSkipReason)) {
        if (!res.skipped.some((s) => s.lessonId === lid && s.reason === reason)) ok = false
      }
    }
    if (tc.checkRankInversion) {
      const full = retrieveLessons(lessons, evidence, { ...q, limit: 20, maxChars: 20000 })
      if (rankInversionCount(full.items.map((x) => x.lessonId), res) !== 0) ok = false
      const used = res.items.reduce((s, it) => s + retrievedLessonChars(it), 0)
      if (used > (q.maxChars ?? 3000)) ok = false
    }
    if (tc.checkEssentialIntact) {
      const item = res.items.find((x) => x.lessonId === tc.checkEssentialIntact.id)
      if (!item || item.when !== tc.checkEssentialIntact.when || !item.exceptions.includes(tc.checkEssentialIntact.exception)) ok = false
    }
    if (tc.checkLimit !== undefined && ids.length !== tc.checkLimit) ok = false
    if (tc.checkModelMismatch) {
      const item = res.items.find((x) => x.lessonId === tc.checkModelMismatch)
      if (!item || item.modelMismatch !== true) ok = false
    }
    if (tc.checkEvidenceContains) {
      if (!res.items[0]?.evidenceSummary?.includes(tc.checkEvidenceContains)) ok = false
    }

    if (ok) { dreamPass += 1; ax.dream += 1 }
    else failures.push({ id: tc.id, desc: tc.desc, got: ids, skipped: res.skipped })

    // Run ungated baselines on the same lessons (pure text search, no scope/version/review/conflict/budget engine)
    const docs = tc.lessons.map(({ lesson, evidence: ev }) => ({
      id: lesson.id,
      text: [lesson.title, lesson.when, lesson.action, lesson.rationale ?? '', lesson.prevents ?? '', (lesson.files ?? []).join(' '), ev?.summary ?? ''].join(' '),
    }))
    const bmIds = new OkapiBM25Index(docs).search(q.query, q.limit ?? 5)
    const chIds = new CharBigramCosineIndex(docs).search(q.query, q.limit ?? 5)
    const checkBaseline = (bIds) => {
      if (tc.expectSkipReason || tc.checkRankInversion || tc.checkEssentialIntact || tc.checkModelMismatch || tc.checkEvidenceContains) return false
      if (tc.expectTop) return bIds[0] === tc.expectTop
      if (tc.expectEmpty) return bIds.length === 0
      if (tc.expectExact) return JSON.stringify(bIds) === JSON.stringify(tc.expectExact)
      return false
    }
    if (checkBaseline(bmIds)) { bm25Pass += 1; ax.bm25 += 1 }
    if (checkBaseline(chIds)) { charPass += 1; ax.char2gram += 1 }
  }

  return {
    total: cases.length,
    dreamPass,
    bm25Pass,
    charPass,
    axes,
    failures,
  }
}

// ---------------------------------------------------------------------------
// Execute all 4 benchmarks and print report
// ---------------------------------------------------------------------------

const report = {
  label: LABEL,
  timestamp: new Date().toISOString(),
  bench6: runBench6(),
  locomoZh500: runLocomoZh500(),
  memoryBench1000: runMemoryBench1000(),
  agentGov40: runAgentGovernanceEval(),
}

console.log('================================================================================')
console.log(`dsh-dream Memory Benchmark Suite  [${LABEL}]`)
console.log('================================================================================\n')

if (!report.bench6.skipped) {
  const b = report.bench6
  console.log(`[1] bench6-100-zh-en (100 bilingual questions / 137 LoCoMo turns, k=5)`)
  console.log(`    System                        | zh hit@1 | zh hit@5 |  zh MRR | en hit@1 | en hit@5 |  en MRR`)
  console.log(`    ------------------------------|----------|----------|---------|----------|----------|--------`)
  const row = (name, zh, en) =>
    console.log(`    ${name.padEnd(29)} |  ${pct(zh.hit1)}  |  ${pct(zh.hitk)}  |  ${num4(zh.mrr)} |  ${pct(en.hit1)}  |  ${pct(en.hitk)}  |  ${num4(en.mrr)}`)
  if (b.dreamBilingual) {
    row(`dsh-dream (${LABEL}, bi)`, b.dreamBilingual.zh, b.dreamBilingual.en)
    row(`Okapi BM25 (bi baseline)`, b.bm25Bilingual.zh, b.bm25Bilingual.en)
  }
  row(`dsh-dream (${LABEL}, raw-en)`, b.dreamRaw.zh, b.dreamRaw.en)
  row(`Okapi BM25 (raw-en)`, b.bm25Raw.zh, b.bm25Raw.en)
  row(`Char-2gram (raw-en)`, b.char2gramRaw.zh, b.char2gramRaw.en)
  for (const arm of ['lingshu_lex', 'lingshu_lex_meta', 'lingshu_rrf4', 'vector_rag', 'letta_archival', 'mem0', 'graphiti', 'graphrag', 'letta_agent']) {
    const a = b.publishedArms[arm]
    if (!a?.zh || !a?.en) continue
    row(`${arm} (published)`, { hit1: a.zh['hit@1'], hitk: a.zh['hit@5'], mrr: a.zh.mrr }, { hit1: a.en['hit@1'], hitk: a.en['hit@5'], mrr: a.en.mrr })
  }
  console.log('')
}

if (!report.locomoZh500.skipped) {
  const l = report.locomoZh500
  console.log(`[2] locomo-zh-500 (500 Chinese queries / 567 turns, k=5)`)
  console.log(`    dsh-dream (${LABEL}): hit@1=${pct(l.dream.hit1)} hit@5=${pct(l.dream.hitk)} MRR=${num4(l.dream.mrr)} (ingest=${l.ingestMs.toFixed(1)}ms, 500q=${l.dream.ms.toFixed(1)}ms)`)
  for (const [qt, g] of Object.entries(l.dream.byQtype)) {
    console.log(`      |- ${qt.padEnd(20)} n=${String(g.n).padStart(3)} hit@1=${pct(g.hit1)} hit@5=${pct(g.hitk)} MRR=${num4(g.mrr)}`)
  }
  console.log(`    Okapi BM25         : hit@1=${pct(l.bm25.hit1)} hit@5=${pct(l.bm25.hitk)} MRR=${num4(l.bm25.mrr)} (ingest=${l.bm25.ingestMs.toFixed(1)}ms, 500q=${l.bm25.ms.toFixed(1)}ms)`)
  console.log(`    Char-2gram Cosine  : hit@1=${pct(l.char2gram.hit1)} hit@5=${pct(l.char2gram.hitk)} MRR=${num4(l.char2gram.mrr)} (ingest=${l.char2gram.ingestMs.toFixed(1)}ms, 500q=${l.char2gram.ms.toFixed(1)}ms)`)
  console.log('')
}

if (!report.memoryBench1000.skipped) {
  const m = report.memoryBench1000
  console.log(`[3] memory-bench-1000 (1000 noisy real records: 250 signal / 400 noise / 350 unlabeled)`)
  const mRow = (name, r) => console.log(`    ${name.padEnd(22)} | hit@1=${pct(r.hit1)} hit@5=${pct(r.hit5)} MRR=${num4(r.mrr)} | SigP@5=${pct(r.signalPrecision5)} Noise@5=${pct(r.noiseRate5)} | ingest=${r.ingestMs.toFixed(1)}ms, 250q=${r.ms.toFixed(1)}ms`)
  mRow(`dsh-dream (${LABEL})`, m.dream)
  mRow('Okapi BM25', m.bm25)
  mRow('Char-2gram Cosine', m.char2gram)
  console.log(`    Secret Redaction Audit: ${m.safety.secretCaught}/${m.safety.secretTotal} secrets caught, ${m.safety.benignClean}/${m.safety.benignTotal} benign preserved`)
  const missed = m.safety.secretDetails.filter((x) => !x.caught).map((x) => x.name)
  if (missed.length) console.log(`      Missed secret types: ${missed.join(', ')}`)
  const falsePos = m.safety.benignDetails.filter((x) => !x.clean).map((x) => x.name)
  if (falsePos.length) console.log(`      Benign false positives: ${falsePos.join(', ')}`)
  console.log('')
}

const g = report.agentGov40
console.log(`[4] dsh-agent-eval-40 (Coding-Agent Memory Governance & Conditional Recall, ${g.total} scenarios)`)
console.log(`    dsh-dream (${LABEL}): ${g.dreamPass}/${g.total} (${pct(g.dreamPass / g.total)}) | Ungated BM25: ${g.bm25Pass}/${g.total} | Ungated Char2gram: ${g.charPass}/${g.total}`)
for (const [ax, s] of Object.entries(g.axes)) {
  console.log(`      |- ${ax.padEnd(24)} dream=${s.dream}/${s.total}  bm25=${s.bm25}/${s.total}  char2gram=${s.char2gram}/${s.total}`)
}
if (g.failures.length > 0) {
  console.log(`    Failed scenarios in ${LABEL}:`)
  for (const f of g.failures) console.log(`      - [${f.id}] ${f.desc} (got=${JSON.stringify(f.got)})`)
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify(report, null, 2) + '\n', 'utf8')
  console.log(`\nSaved JSON report to ${JSON_OUT}`)
}
