/**
 * M2-A 桥接三模式测试：preview / apply / rollback 与并发、编码、链接、只读、定位、脱敏、资格。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  appendFileSync,
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyBridge,
  buildLessonsBlock,
  DREAM_BLOCK_END,
  DREAM_BLOCK_START,
  listBridgeApplications,
  previewBridge,
  rollbackBridge,
  selectBridgeLessons,
  validateLesson,
} from '../lib/index.js'

const ISO = '2026-09-29T00:00:00.000Z'
const testDir = dirname(fileURLToPath(import.meta.url))

/** 兼容 process.env 为空的沙箱：优先系统临时目录，否则退回 test/.tmp-bridge-io。 */
function tempBase() {
  const fromEnv = process.env.TEMP || process.env.TMP
  return fromEnv && fromEnv.trim() !== '' ? fromEnv : join(testDir, '.tmp-bridge-io')
}

function freshRoot() {
  const base = tempBase()
  mkdirSync(base, { recursive: true })
  return mkdtempSync(join(base, 'dsh-dream-bridge-'))
}

function cleanup(dir) {
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // 清理失败不影响断言
  }
  const base = tempBase()
  if (base === join(testDir, '.tmp-bridge-io')) {
    try {
      rmSync(base, { recursive: true, force: true })
    } catch {
      // 兜底目录清理失败不影响断言
    }
  }
}

function setup() {
  const root = freshRoot()
  const project = join(root, 'proj')
  const journalDir = join(root, 'journal')
  mkdirSync(project, { recursive: true })
  return { root, project, journalDir, target: join(project, 'AGENTS.md') }
}

function makeLesson(over = {}) {
  return validateLesson({
    schemaVersion: 1,
    id: over.id === undefined ? 'lsn_' + Math.random().toString(16).slice(2, 10) : over.id,
    revision: over.revision === undefined ? 1 : over.revision,
    kind: 'procedure',
    title: over.title === undefined ? '默认经验标题' : over.title,
    action: over.action === undefined ? '执行动作' : over.action,
    when: over.when === undefined ? '条件满足时' : over.when,
    exceptions: over.exceptions === undefined ? [] : over.exceptions,
    scope: over.scope === undefined ? { global: true } : over.scope,
    applicability: [],
    state: over.state === undefined ? 'usable' : over.state,
    evidenceIds: [],
    independentSupportCount: 1,
    review: over.review === undefined ? { decision: 'accepted', actor: 'user' } : over.review,
    createdAt: ISO,
    updatedAt: over.updatedAt === undefined ? ISO : over.updatedAt,
    conflictIds: [],
  })
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

function optionsOf(env, over = {}) {
  return {
    journalDir: env.journalDir,
    projectRoot: env.project,
    path: 'AGENTS.md',
    lessons: [makeLesson()],
    projectId: 'proj-a',
    ...over,
  }
}

test('preview：零写入；create 时 expected.sha256=null 且带 resolvedPath', () => {
  const env = setup()
  try {
    const p = previewBridge(optionsOf(env))
    assert.equal(p.ok, true)
    assert.equal(p.action, 'create')
    assert.deepEqual(p.expected, { exists: false, sha256: null, size: 0 })
    assert.equal(p.resolvedPath, env.target)
    assert.ok(p.blockPreview.startsWith(DREAM_BLOCK_START))
    assert.ok(p.blockPreview.endsWith(DREAM_BLOCK_END))
    assert.match(p.previewId, /^pvw_[0-9a-f]{24}$/)
    assert.ok(p.diff.includes('+' + DREAM_BLOCK_START))
    assert.equal(existsSync(env.target), false)
    assert.equal(existsSync(join(env.journalDir, 'bridge')), false, 'preview 不得建记录目录')
    assert.deepEqual(readdirSync(env.project), [])
  } finally {
    cleanup(env.root)
  }
})

test('apply：preview→人工 append→conflict 零写入；重新 preview 后成功且人工内容与块都在', () => {
  const env = setup()
  try {
    writeFileSync(env.target, '# 人工标题\n', 'utf8')
    const p1 = previewBridge(optionsOf(env))
    assert.equal(p1.ok, true)
    assert.equal(p1.action, 'append')
    appendFileSync(env.target, '\n人工追加\n', 'utf8')
    const afterManual = readFileSync(env.target)

    const conflict = applyBridge({ ...optionsOf(env), expectedSha256: p1.expected.sha256, previewId: p1.previewId })
    assert.equal(conflict.ok, false)
    assert.equal(conflict.error.code, 'conflict')
    assert.deepEqual(readFileSync(env.target), afterManual, 'conflict 必须零写入')

    const p2 = previewBridge(optionsOf(env))
    const applied = applyBridge({ ...optionsOf(env), expectedSha256: p2.expected.sha256, previewId: p2.previewId })
    assert.equal(applied.ok, true)
    assert.equal(applied.action, 'append')
    assert.ok(applied.backupId.startsWith('brg_'))
    const text = readFileSync(env.target, 'utf8')
    assert.ok(text.includes('# 人工标题'))
    assert.ok(text.includes('人工追加'))
    assert.ok(text.includes(DREAM_BLOCK_START))
  } finally {
    cleanup(env.root)
  }
})

test('apply：同内容二次 apply → unchanged 成功且字节不变（与 conflict 区分）', () => {
  const env = setup()
  try {
    const p1 = previewBridge(optionsOf(env))
    const a1 = applyBridge({ ...optionsOf(env), expectedSha256: p1.expected.sha256, previewId: p1.previewId })
    assert.equal(a1.ok, true)
    assert.equal(a1.action, 'create')
    const bytes = readFileSync(env.target)

    const p2 = previewBridge(optionsOf(env))
    assert.equal(p2.action, 'unchanged')
    const a2 = applyBridge({ ...optionsOf(env), expectedSha256: p2.expected.sha256, previewId: p2.previewId })
    assert.equal(a2.ok, true)
    assert.equal(a2.action, 'unchanged')
    assert.equal(a2.unchanged, true)
    assert.equal(a2.backupId, undefined)
    assert.deepEqual(readFileSync(env.target), bytes)

    const a3 = applyBridge({ ...optionsOf(env), expectedSha256: 'stale-sha', previewId: 'pvw_stale' })
    assert.equal(a3.ok, true, '块已相等时幂等重试必须成功')
    assert.equal(a3.action, 'unchanged')
    assert.deepEqual(readFileSync(env.target), bytes)
  } finally {
    cleanup(env.root)
  }
})

test('编码：UTF-8 BOM 保留、CRLF 块外保持、无尾换行不强行加', () => {
  const env = setup()
  try {
    const bom = Buffer.from([0xef, 0xbb, 0xbf])
    writeFileSync(env.target, Buffer.concat([bom, Buffer.from('# 标题\r\n\r\n人工行\r\n', 'utf8')]))
    const p = previewBridge(optionsOf(env))
    const a = applyBridge({ ...optionsOf(env), expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(a.ok, true)
    const buf = readFileSync(env.target)
    assert.deepEqual(Array.from(buf.subarray(0, 3)), [0xef, 0xbb, 0xbf], 'BOM 必须保留')
    const text = buf.subarray(3).toString('utf8')
    assert.ok(text.includes('人工行\r\n'), '块外 CRLF 原样')
    assert.equal(text.replace(/\r\n/g, '').includes('\n'), false, '不得混入裸 LF')
    assert.ok(text.includes(DREAM_BLOCK_START + '\r\n'), '块内换行跟随 CRLF')

    const noEol = join(env.project, 'no-eol.md')
    writeFileSync(noEol, '没有尾换行的内容', 'utf8')
    const p2 = previewBridge(optionsOf(env, { path: 'no-eol.md' }))
    const a2 = applyBridge({ ...optionsOf(env, { path: 'no-eol.md' }), expectedSha256: p2.expected.sha256, previewId: p2.previewId })
    assert.equal(a2.ok, true)
    const out = readFileSync(noEol, 'utf8')
    assert.ok(out.startsWith('没有尾换行的内容\n\n'), '追加前补齐分隔')
    assert.ok(out.endsWith(DREAM_BLOCK_END), '不在块后强行加尾换行')
  } finally {
    cleanup(env.root)
  }
})

test('编码：UTF-16 与二进制明确拒绝', () => {
  const env = setup()
  try {
    const u16 = join(env.project, 'u16.md')
    writeFileSync(u16, Buffer.from('\uFEFF# title', 'utf16le'))
    const p1 = previewBridge(optionsOf(env, { path: 'u16.md' }))
    assert.equal(p1.ok, false)
    assert.equal(p1.error.code, 'unsupported-encoding')
    assert.match(p1.error.message, /UTF-16/)

    const bin = join(env.project, 'bin.dat')
    writeFileSync(bin, Buffer.from([0x41, 0x00, 0x42, 0x01]))
    const p2 = previewBridge(optionsOf(env, { path: 'bin.dat' }))
    assert.equal(p2.ok, false)
    assert.equal(p2.error.code, 'unsupported-encoding')
  } finally {
    cleanup(env.root)
  }
})

test('标记：缺损/重复/错位/非独立行 → 拒绝、给行号、失败仍有 preview 形状', () => {
  const env = setup()
  try {
    const cases = [
      ['<!-- dsh-dream:start -->\nbody\n', /结束标记/],
      ['body\n<!-- dsh-dream:end -->\n', /起始标记/],
      ['<!-- dsh-dream:start -->\na\n<!-- dsh-dream:start -->\nb\n<!-- dsh-dream:end -->\n', /重复/],
      ['<!-- dsh-dream:start -->\na\n<!-- dsh-dream:end -->\nb\n<!-- dsh-dream:end -->\n', /重复/],
      ['<!-- dsh-dream:end -->\na\n<!-- dsh-dream:start -->\n', /之前|错位/],
      ['x <!-- dsh-dream:start --> y\n<!-- dsh-dream:end -->\n', /独立成行/],
    ]
    for (let i = 0; i < cases.length; i++) {
      const file = join(env.project, 'm' + i + '.md')
      writeFileSync(file, cases[i][0], 'utf8')
      const bytes = readFileSync(file)
      const r = previewBridge(optionsOf(env, { path: 'm' + i + '.md' }))
      assert.equal(r.ok, false, 'case ' + i + ' 必须拒绝')
      assert.equal(r.error.code, 'marker', 'case ' + i + ' code')
      assert.equal(typeof r.error.line, 'number', 'case ' + i + ' 必须给行号')
      assert.match(r.error.message, cases[i][1], 'case ' + i + ' message')
      assert.equal(r.action, 'create', 'case ' + i + ' 失败也带 action 形状')
      assert.deepEqual(r.expected, { exists: true, sha256: sha256(bytes), size: bytes.length }, 'case ' + i + ' 失败也带 expected 形状')
    }
  } finally {
    cleanup(env.root)
  }
})

test('路径：.. / 项目外 / 目录目标 → 拒绝且零写入', () => {
  const env = setup()
  try {
    const dotdot = previewBridge(optionsOf(env, { path: '../outside.md' }))
    assert.equal(dotdot.ok, false)
    assert.equal(dotdot.error.code, 'path-outside-project')
    assert.equal(dotdot.action, 'create')
    assert.deepEqual(dotdot.expected, { exists: false, sha256: null, size: 0 })
    assert.equal(typeof dotdot.resolvedPath, 'string')

    const outside = previewBridge(optionsOf(env, { path: join(env.root, 'outside.md') }))
    assert.equal(outside.ok, false)
    assert.equal(outside.error.code, 'path-outside-project')

    mkdirSync(join(env.project, 'subdir'))
    const dir = previewBridge(optionsOf(env, { path: 'subdir' }))
    assert.equal(dir.ok, false)
    assert.equal(dir.error.code, 'target-is-directory')
    assert.equal(dir.expected.exists, true)
    assert.equal(dir.expected.sha256, null)
    assert.equal(existsSync(join(env.root, 'outside.md')), false)
  } finally {
    cleanup(env.root)
  }
})

test('链接：跟随 junction 改真实文件、链接不变；断链可创建时同样跟随', (t) => {
  const env = setup()
  try {
    const realDir = join(env.project, 'real-agents')
    mkdirSync(realDir, { recursive: true })
    writeFileSync(join(realDir, 'AGENTS.md'), '# 真实文件\n', 'utf8')
    const linkDir = join(env.project, 'linked')
    try {
      symlinkSync(realDir, linkDir, 'junction')
    } catch (error) {
      t.skip('当前环境无法创建 junction：' + error.message)
      return
    }
    const linkPath = join('linked', 'AGENTS.md')
    const p = previewBridge(optionsOf(env, { path: linkPath }))
    assert.equal(p.ok, true)
    assert.equal(p.resolvedPath, join(realpathSync(realDir), 'AGENTS.md'))
    const a = applyBridge({ ...optionsOf(env, { path: linkPath }), expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(a.ok, true)
    assert.ok(readFileSync(join(realDir, 'AGENTS.md'), 'utf8').includes(DREAM_BLOCK_START), '真实文件被写入')
    assert.equal(lstatSync(linkDir).isSymbolicLink(), true, '链接本身不变')

    const brokenLink = join(env.project, 'broken.md')
    try {
      symlinkSync(join(env.project, 'not-yet.md'), brokenLink, 'file')
    } catch {
      return
    }
    const p2 = previewBridge(optionsOf(env, { path: 'broken.md' }))
    assert.equal(p2.ok, true)
    assert.equal(p2.action, 'create')
    assert.equal(p2.expected.exists, false)
    assert.equal(p2.expected.sha256, null)
    const a2 = applyBridge({ ...optionsOf(env, { path: 'broken.md' }), expectedSha256: p2.expected.sha256, previewId: p2.previewId })
    assert.equal(a2.ok, true)
    assert.ok(readFileSync(join(env.project, 'not-yet.md'), 'utf8').includes(DREAM_BLOCK_START), '跟随断链写到真实目标')
    assert.equal(lstatSync(brokenLink).isSymbolicLink(), true)
  } finally {
    cleanup(env.root)
  }
})

test('只读：可操作错误、无 .tmp 残留、修复后 apply 与 rollback 正常', () => {
  const env = setup()
  try {
    writeFileSync(env.target, '# 人工\n', 'utf8')
    chmodSync(env.target, 0o444)
    const p = previewBridge(optionsOf(env))
    const before = readFileSync(env.target)
    const r = applyBridge({ ...optionsOf(env), expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(r.ok, false, '只读文件必须失败')
    assert.equal(r.error.code, 'read-only')
    assert.ok(typeof r.error.hint === 'string' && r.error.hint.length > 0, '要有可操作提示')
    assert.deepEqual(readFileSync(env.target), before)
    assert.deepEqual(
      readdirSync(env.project).filter((name) => name.endsWith('.tmp') || name.includes('.dsh-dream-')),
      [],
      '不得留 .tmp 残留',
    )

    chmodSync(env.target, 0o644)
    const p2 = previewBridge(optionsOf(env))
    const a = applyBridge({ ...optionsOf(env), expectedSha256: p2.expected.sha256, previewId: p2.previewId })
    assert.equal(a.ok, true)
    const rb = rollbackBridge({ projectRoot: env.project, path: 'AGENTS.md', journalDir: env.journalDir, backupId: a.backupId })
    assert.equal(rb.ok, true, 'rollback 不受只读失败影响')
    assert.equal(readFileSync(env.target, 'utf8').includes(DREAM_BLOCK_START), false)
  } finally {
    try {
      chmodSync(env.target, 0o644)
    } catch {
      // 已恢复
    }
    cleanup(env.root)
  }
})

test('rollback：块外人工修改保留；块内被外部修改则 conflict 拒绝且零写入', () => {
  const env = setup()
  try {
    writeFileSync(env.target, '# 人工\n', 'utf8')
    const p = previewBridge(optionsOf(env))
    const a = applyBridge({ ...optionsOf(env), expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(a.ok, true)
    appendFileSync(env.target, '\n块外新增\n', 'utf8')
    const rb = rollbackBridge({ projectRoot: env.project, path: 'AGENTS.md', journalDir: env.journalDir, backupId: a.backupId })
    assert.equal(rb.ok, true)
    const text = readFileSync(env.target, 'utf8')
    assert.ok(text.includes('块外新增'), '块外人工内容必须保留')
    assert.equal(text.includes(DREAM_BLOCK_START), false)

    const p2 = previewBridge(optionsOf(env))
    const a2 = applyBridge({ ...optionsOf(env), expectedSha256: p2.expected.sha256, previewId: p2.previewId })
    assert.equal(a2.ok, true)
    const tampered = readFileSync(env.target, 'utf8').replace('默认经验标题', '被外部改过')
    writeFileSync(env.target, tampered, 'utf8')
    const rb2 = rollbackBridge({ projectRoot: env.project, path: 'AGENTS.md', journalDir: env.journalDir, backupId: a2.backupId })
    assert.equal(rb2.ok, false)
    assert.equal(rb2.error.code, 'conflict')
    assert.equal(readFileSync(env.target, 'utf8'), tampered, '拒绝回滚必须零写入')
  } finally {
    cleanup(env.root)
  }
})

test('资格：usable + 项目/工作区匹配或 global+accepted；其余给 skipped 原因', () => {
  const env = setup()
  try {
    const ws = realpathSync(env.project)
    const lessons = [
      makeLesson({ id: 'lsn-1', title: '项目匹配', scope: { global: false, projectId: 'proj-a' }, review: { decision: 'unreviewed' } }),
      makeLesson({ id: 'lsn-2', title: '工作区匹配', scope: { global: false, workspaceRoot: env.project }, review: { decision: 'unreviewed' } }),
      makeLesson({ id: 'lsn-3', title: '全局已采纳', scope: { global: true }, review: { decision: 'accepted', actor: 'user' } }),
      makeLesson({ id: 'lsn-4', title: '全局未采纳', scope: { global: true }, review: { decision: 'unreviewed' } }),
      makeLesson({ id: 'lsn-5', title: '候选', state: 'candidate', scope: { global: false, projectId: 'proj-a' } }),
      makeLesson({ id: 'lsn-6', title: '别的项目', scope: { global: false, projectId: 'proj-b' } }),
    ]
    const p = previewBridge(optionsOf(env, { lessons, projectId: 'proj-a', workspaceRoot: env.project }))
    assert.equal(p.ok, true)
    assert.deepEqual(p.lessons.map((item) => item.lessonId).sort(), ['lsn-1', 'lsn-2', 'lsn-3'])
    const reasons = Object.fromEntries(p.skipped.map((item) => [item.lessonId, item.reason]))
    assert.equal(reasons['lsn-4'], 'not-accepted-global')
    assert.equal(reasons['lsn-5'], 'not-usable')
    assert.equal(reasons['lsn-6'], 'scope-mismatch')

    const selected = selectBridgeLessons(lessons, { projectId: 'proj-a', workspaceRoot: ws }, { lessonIds: ['lsn-1', 'missing'], maxLessons: 1 })
    assert.deepEqual(selected.eligible.map((lesson) => lesson.id), ['lsn-1'])
    assert.deepEqual(selected.skipped, [{ lessonId: 'missing', reason: 'unknown-lesson' }])
    const limited = selectBridgeLessons(lessons, { projectId: 'proj-a', workspaceRoot: ws }, { maxLessons: 2 })
    assert.equal(limited.eligible.length, 2)
    assert.ok(limited.skipped.some((item) => item.reason === 'limit'))
  } finally {
    cleanup(env.root)
  }
})

test('脱敏：经验与旧教训里的 sk- 不得原样进 blockPreview/diff/AGENTS.md', () => {
  const env = setup()
  try {
    const secret = 'sk-abcdefghijklmnop123456'
    const lesson = makeLesson({
      title: '使用 ' + secret + ' 调用',
      action: '不要回显 ' + secret,
      when: '当配置含 ' + secret + ' 时',
      exceptions: ['日志里出现 ' + secret],
    })
    const p = previewBridge(optionsOf(env, { lessons: [lesson] }))
    assert.equal(p.ok, true)
    assert.equal(p.blockPreview.includes(secret), false, 'blockPreview 必须脱敏')
    assert.equal(p.diff.includes(secret), false, 'diff 必须脱敏')
    assert.ok(p.blockPreview.includes('已脱敏'))

    const a = applyBridge({ ...optionsOf(env, { lessons: [lesson] }), expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(a.ok, true)
    assert.equal(readFileSync(env.target, 'utf8').includes(secret), false, 'AGENTS.md 不得含原始密钥')

    const legacy = buildLessonsBlock([{ lesson: '旧日记教训 ' + secret, count: 2 }])
    assert.equal(legacy.includes(secret), false, 'legacy 块也要脱敏')
    assert.ok(legacy.includes('已脱敏'))
  } finally {
    cleanup(env.root)
  }
})

test('M2-C：listBridgeApplications 只读视图（rollbackable 重算），目录缺失返回空', () => {
  const env = setup()
  try {
    assert.deepEqual(listBridgeApplications(env.journalDir), [])
    const p = previewBridge(optionsOf(env))
    const a = applyBridge({ ...optionsOf(env), expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(a.ok, true)
    const recordsFile = join(env.journalDir, 'bridge', 'records.jsonl')
    const recordsBytes = readFileSync(recordsFile)
    const list = listBridgeApplications(env.journalDir)
    assert.equal(list.length, 1)
    assert.equal(list[0].backupId, a.backupId)
    assert.equal(list[0].action, 'create')
    assert.equal(list[0].rollbackable, true)
    assert.equal(list[0].afterSha256, a.file.sha256)
    assert.ok(Array.isArray(list[0].lessons) && list[0].lessons.length >= 1)
    assert.deepEqual(readFileSync(recordsFile), recordsBytes, 'list 必须只读')

    writeFileSync(env.target, readFileSync(env.target, 'utf8').replace('默认经验标题', '外部改'))
    const list2 = listBridgeApplications(env.journalDir)
    assert.equal(list2[0].rollbackable, false)
    assert.match(String(list2[0].rollbackReason), /修改/)
  } finally {
    cleanup(env.root)
  }
})

test('并发：两个进程并行 apply 只允许一个成功，人工内容不丢', async () => {
  const env = setup()
  try {
    writeFileSync(env.target, '# 人工内容\n', 'utf8')
    const p = previewBridge(optionsOf(env))
    const expected = p.expected.sha256
    const libUrl = new URL('../lib/index.js', import.meta.url).href
    const worker = join(env.root, 'worker.mjs')
    const workerSource = [
      "import { applyBridge } from '" + libUrl + "'",
      "const [projectRoot, targetPath, journalDir, expectedSha, title] = process.argv.slice(2)",
      "const lesson = { id: 'lsn_worker', revision: 1, kind: 'procedure', title, action: '动作', when: '条件', exceptions: [], scope: { global: true }, applicability: [], state: 'usable', evidenceIds: [], independentSupportCount: 1, review: { decision: 'accepted', actor: 'user' }, createdAt: '2026-09-29T00:00:00.000Z', updatedAt: '2026-09-29T00:00:00.000Z', conflictIds: [] }",
      "const result = applyBridge({ journalDir, projectRoot, path: targetPath, lessons: [lesson], maskSecrets: true, expectedSha256: expectedSha })",
      "process.stdout.write(JSON.stringify({ ok: result.ok, action: result.ok ? result.action : null, code: result.ok ? null : result.error.code, title }))",
    ].join('\n')
    writeFileSync(worker, workerSource, 'utf8')
    const runWorker = (title) => new Promise((resolve) => {
      const child = spawn(process.execPath, [worker, env.project, env.target, env.journalDir, expected, title], { stdio: ['ignore', 'pipe', 'pipe'] })
      let out = ''
      child.stdout.on('data', (chunk) => {
        out += chunk
      })
      child.on('close', () => resolve(out))
      child.on('error', () => resolve(''))
    })
    const outputs = await Promise.all([runWorker('并行甲'), runWorker('并行乙')])
    const results = outputs.map((out) => JSON.parse(out))
    const successes = results.filter((item) => item.ok)
    assert.equal(successes.length, 1, '只能一个成功：' + JSON.stringify(results))
    assert.equal(results.filter((item) => !item.ok && item.code === 'conflict').length, 1)
    const text = readFileSync(env.target, 'utf8')
    assert.ok(text.includes('# 人工内容'), '人工内容不得丢')
    assert.ok(text.includes(successes[0].title), '赢家内容必须在')
    const loser = successes[0].title === '并行甲' ? '并行乙' : '并行甲'
    assert.equal(text.includes(loser), false, '输家不得留下半套内容')
  } finally {
    cleanup(env.root)
  }
})
