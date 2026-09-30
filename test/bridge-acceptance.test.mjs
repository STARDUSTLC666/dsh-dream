/**
 * M2 桥接独立验收（FREEZE-M2 M2-1 硬性要求 1–10 + R9 资格）。
 *
 * 只走公开工具契约（buildDreamTools 的 dream_bridge），不依赖 src/bridge.ts 内部函数名：
 *   preview → apply(expectedSha256) → rollback；缺省 mode 仍是 0.5.x legacy 直写。
 *
 * 依赖当前项目 scope 的用例（R7 路径越界 / R9 资格）按“接受 projectId/workspaceRoot 入参”
 * 的假设编写；若实现改为从 exec 推断，会在 bridge-io 落地后对齐（见 docs/validation/0.6.0.md）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { KnowledgeStore } from '../lib/knowledge-store.js'
import { seedSessionEvidence } from './fixtures/session-evidence.mjs'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const START = '<!-- dsh-dream:start -->'
const END = '<!-- dsh-dream:end -->'
const SECRET = 'sk-abcdefghijklmnopqrstuvwxyz0123456789'

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const read = (file) => readFileSync(file)
const markerCount = (text, marker) => text.split(marker).length - 1
const tmpResidue = (dir) => readdirSync(dir).filter((name) => name.includes('.tmp'))

function makeEnv() {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-bridge-'))
  const journalDir = join(dir, 'journal')
  const projectRoot = join(dir, 'project')
  mkdirSync(journalDir, { recursive: true })
  mkdirSync(projectRoot, { recursive: true })
  const cfg = resolveConfig({ sessionsRoot: join(dir, 'sessions'), journalDir })
  const tools = buildDreamTools(cfg)
  return {
    dir, journalDir, projectRoot, cfg, tools,
    bridge: tools.find((tool) => tool.name === 'dream_bridge'),
    learn: tools.find((tool) => tool.name === 'dream_learn'),
    agentPath: join(projectRoot, 'AGENTS.md'),
    scope: { projectId: 'proj-a', workspaceRoot: projectRoot },
  }
}

async function learn(env, title, extra = {}) {
  const input = {
    kind: 'procedure',
    title,
    action: '执行 ' + title,
    when: '验收场景',
    evidence: [{ kind: 'session', sessionId: 'sess-' + title + '-' + Date.now(), recordSeq: 1, summary: '实测确认', verification: 'read' }],
    ...env.scope,
    ...extra,
  }
  seedSessionEvidence(env.cfg, input.evidence, input)
  const result = await env.learn.execute(input)
  const review = env.tools.find(tool => tool.name === 'dream_review')
  const accepted = await review.execute({ action: 'accept', lessonId: result.lessonId, expectedRevision: 1 })
  return { ...result, state: accepted.state }
}

async function callBridge(env, args, options = {}) {
  try {
    const base = { path: env.agentPath, ...(options.omitScope === true ? {} : env.scope) }
    const value = await env.bridge.execute({ ...base, ...args }, { cwd: env.projectRoot })
    return { ok: value === null || typeof value !== 'object' ? true : value.ok !== false, value }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), thrown: true }
  }
}

function refusalMessage(outcome) {
  if (outcome.ok) return null
  const value = outcome.value !== undefined && outcome.value !== null && typeof outcome.value === 'object' ? outcome.value : {}
  const code = value.error !== undefined && value.error !== null ? String(value.error.code ?? '') : ''
  const message = outcome.error ?? (value.error !== undefined && value.error !== null ? String(value.error.message ?? '') : '') ?? ''
  return (String(message) + ' ' + code).trim()
}

function expectRefusal(outcome, what) {
  assert.equal(outcome.ok, false, what + '：应被拒绝，实际成功 ' + JSON.stringify(outcome.value).slice(0, 200))
  const message = refusalMessage(outcome)
  assert.ok(message !== null && message.length > 0, what + '：拒绝必须给可读原因')
  return message
}

function previewOf(value) {
  return value.preview !== undefined && value.preview !== null ? value.preview : value
}

test('1) preview 只读且返回契约字段；apply 前文件零变化', async () => {
  const env = makeEnv()
  try {
    await learn(env, '池化 SMTP 取消后先 close')
    writeFileSync(env.agentPath, '# 项目规则\n\n手工内容\n', 'utf8')
    const before = read(env.agentPath)
    const filesBefore = readdirSync(env.projectRoot).sort()
    const result = await callBridge(env, { mode: 'preview' })
    assert.equal(result.ok, true, 'preview 应成功：' + refusalMessage(result))
    const preview = previewOf(result.value)
    assert.ok(preview.expected !== undefined && preview.expected !== null, 'preview 必须给出 expected')
    assert.equal(preview.expected.exists, true)
    assert.equal(preview.expected.sha256, sha256(before), 'expected.sha256 必须是当前文件哈希')
    assert.equal(preview.expected.size, before.length)
    assert.ok(['create', 'replace', 'append'].includes(preview.action), 'action 必须是 create/replace/append')
    assert.equal(typeof preview.previewId, 'string')
    assert.ok(preview.previewId.length > 0)
    assert.ok(String(preview.blockPreview ?? '').includes(START) && String(preview.blockPreview ?? '').includes(END), 'blockPreview 必须含新标记')
    assert.ok(Array.isArray(preview.lessons) && Array.isArray(preview.skipped))
    assert.equal(Buffer.compare(read(env.agentPath), before), 0, 'preview 不得改文件')
    assert.deepEqual(readdirSync(env.projectRoot).sort(), filesBefore, 'preview 不得新增文件')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('2) preview → 外部人工 append → apply conflict 零写入；重 preview 后人工内容与块都在', async () => {
  const env = makeEnv()
  try {
    await learn(env, '并发改文件守卫')
    writeFileSync(env.agentPath, '# 规则\n', 'utf8')
    const preview = previewOf((await callBridge(env, { mode: 'preview' })).value)
    writeFileSync(env.agentPath, read(env.agentPath).toString('utf8') + '\n人工追加内容\n', 'utf8')
    const afterManual = read(env.agentPath)
    const conflict = await callBridge(env, { mode: 'apply', expectedSha256: preview.expected.sha256, previewId: preview.previewId })
    const message = expectRefusal(conflict, 'hash 不符必须 conflict')
    assert.match(message, /conflict|冲突|preview-mismatch/i, 'conflict/preview-mismatch 原因应可辨认：' + message)
    assert.equal(Buffer.compare(read(env.agentPath), afterManual), 0, 'conflict 必须零写入')

    const repreview = previewOf((await callBridge(env, { mode: 'preview' })).value)
    const applied = await callBridge(env, { mode: 'apply', expectedSha256: repreview.expected.sha256, previewId: repreview.previewId })
    assert.equal(applied.ok, true, '重新预览后应可 apply：' + refusalMessage(applied))
    const text = read(env.agentPath).toString('utf8')
    assert.ok(text.includes('人工追加内容'), '人工内容不得丢')
    assert.equal(markerCount(text, START), 1)
    assert.equal(markerCount(text, END), 1)
    assert.ok(text.includes('并发改文件守卫'), '块内应包含经验')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('3) apply 保留 BOM / 块外 CRLF / 无尾换行', async () => {
  const env = makeEnv()
  try {
    await learn(env, 'BOM 与换行保留')
    const bom = '\uFEFF'
    const before = bom + 'line1\r\nline2\r\n' + START + '\r\nold\r\n' + END + '\r\nmanuallast'
    writeFileSync(env.agentPath, before, 'utf8')
    const preview = previewOf((await callBridge(env, { mode: 'preview' })).value)
    const applied = await callBridge(env, { mode: 'apply', expectedSha256: preview.expected.sha256, previewId: preview.previewId })
    assert.equal(applied.ok, true, 'apply 应成功：' + refusalMessage(applied))
    const bytes = read(env.agentPath)
    const text = bytes.toString('utf8')
    assert.equal(text.charCodeAt(0), 0xFEFF, 'BOM 必须保留')
    assert.equal(text.slice(1).startsWith('line1\r\nline2\r\n'), true, '块外 CRLF 前缀必须原样保留')
    assert.equal(text.endsWith('manuallast'), true, '无尾换行不得被强加')
    assert.equal(text.slice(-3).includes('\r\n'), false, '结尾不得新增 CRLF')
    assert.ok(text.includes('BOM 与换行保留'), '块内应写入经验')
    assert.equal(markerCount(text, START), 1)
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('4) 两进程并行 apply：一个成功或都幂等，人工内容不丢、无 .tmp 残留', async () => {
  const env = makeEnv()
  try {
    const lesson = await learn(env, '并行 apply 守卫')
    writeFileSync(env.agentPath, '# 规则\n\n并行人工内容\n', 'utf8')
    const preview = previewOf((await callBridge(env, { mode: 'preview' })).value)
    const bridgeUrl = pathToFileURL(join(root, 'lib', 'index.js')).href
    const script = [
      'const { buildDreamTools, resolveConfig } = await import(' + JSON.stringify(bridgeUrl) + ')',
      'const tools = buildDreamTools(resolveConfig({ sessionsRoot: ' + JSON.stringify(join(env.dir, 'sessions')) + ', journalDir: ' + JSON.stringify(env.journalDir) + ' }))',
      'const bridge = tools.find((tool) => tool.name === "dream_bridge")',
      'let out',
      'try { out = await bridge.execute({ mode: "apply", path: ' + JSON.stringify(env.agentPath) + ', projectId: ' + JSON.stringify(env.scope.projectId) + ', workspaceRoot: ' + JSON.stringify(env.projectRoot) + ', lessonIds: [' + JSON.stringify(lesson.lessonId) + '], expectedSha256: ' + JSON.stringify(preview.expected.sha256) + ', previewId: ' + JSON.stringify(preview.previewId) + ' }) } catch (error) { out = { ok: false, error: { message: error.message } } }',
      'console.log(JSON.stringify(out))',
    ].join('\n')
    const runWorker = () => new Promise((resolve) => {
      const child = spawn(process.execPath, ['--input-type=module', '-e', script], { cwd: env.projectRoot, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (chunk) => { stdout += String(chunk) })
      child.stderr.on('data', (chunk) => { stderr += String(chunk) })
      child.on('close', (code) => resolve({ code, stdout, stderr }))
    })
    const results = await Promise.all([runWorker(), runWorker()])
    const parsed = results.map((item) => {
      try { return JSON.parse(item.stdout.trim()) } catch { return { ok: false, error: { message: item.stderr.slice(0, 200) } } }
    })
    const successes = parsed.filter((item) => item.ok !== false)
    assert.ok(successes.length >= 1, '至少一个 apply 应成功：' + JSON.stringify(parsed).slice(0, 400))
    const text = read(env.agentPath).toString('utf8')
    assert.ok(text.includes('并行人工内容'), '并行后人工内容不得丢')
    assert.equal(markerCount(text, START), 1, '不得出现重复管理块')
    assert.equal(markerCount(text, END), 1)
    assert.deepEqual(tmpResidue(env.projectRoot), [], '不得残留 .tmp 文件')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('5) 链接策略：经 junction/符号链接写真实文件，链接本身不变；断链明确处理', async () => {
  const env = makeEnv()
  try {
    await learn(env, '链接策略')
    const realDir = join(env.projectRoot, 'real')
    const linkDir = join(env.projectRoot, 'link')
    mkdirSync(realDir, { recursive: true })
    writeFileSync(join(realDir, 'AGENTS.md'), '# 真实文件\n', 'utf8')
    let linkSupported = true
    try { symlinkSync(realDir, linkDir, 'junction') } catch { linkSupported = false }
    if (!linkSupported) {
      console.log('SKIP 链接策略：当前环境不允许创建 junction')
      return
    }
    const linkPath = join(linkDir, 'AGENTS.md')
    const linkPreview = await callBridge(env, { mode: 'preview', path: linkPath })
    assert.equal(linkPreview.ok, true, '经 junction preview 应成功（跟随链接）：' + refusalMessage(linkPreview))
    const preview = previewOf(linkPreview.value)
    const applied = await callBridge(env, { mode: 'apply', path: linkPath, expectedSha256: preview.expected.sha256, previewId: preview.previewId })
    assert.equal(applied.ok, true, '经链接 apply 应成功：' + refusalMessage(applied))
    assert.equal(lstatSync(linkDir).isSymbolicLink(), true, '链接本身必须仍是链接')
    assert.ok(read(join(realDir, 'AGENTS.md')).toString('utf8').includes('链接策略'), '必须改到真实文件')

    const broken = join(env.projectRoot, 'broken-file')
    try {
      symlinkSync(join(env.projectRoot, 'missing-target.md'), broken, 'file')
      const brokenOutcome = await callBridge(env, { mode: 'preview', path: broken })
      assert.equal(brokenOutcome.ok, true, '断链 preview 应返回形状而不是崩：' + refusalMessage(brokenOutcome))
      const brokenPreview = previewOf(brokenOutcome.value)
      assert.equal(brokenPreview.action, 'create', '断链目标不存在 → action=create')
      assert.equal(brokenPreview.expected.exists, false)
      assert.equal(brokenPreview.expected.sha256, null, '不存在时 sha256 必须是 null')
      assert.equal(typeof brokenPreview.expected.size, 'number')
      assert.ok(typeof brokenPreview.resolvedPath === 'string' && brokenPreview.resolvedPath.length > 0, '断链必须给 resolvedPath')
      assert.deepEqual(tmpResidue(env.dir), [])

      // 策略观察（FREEZE 未明确：req5「跟随链接」 vs req7「解析后须在项目内」）：
      // 链接在项目内、真实文件在项目外。这里只记录实际策略，不作断言，交 lead 裁定后写死。
      const outReal = join(env.dir, 'out-real')
      const outLink = join(env.projectRoot, 'out-link')
      mkdirSync(outReal, { recursive: true })
      writeFileSync(join(outReal, 'AGENTS.md'), '# 外部真实文件\n', 'utf8')
      try {
        symlinkSync(outReal, outLink, 'junction')
        const outward = await callBridge(env, { mode: 'preview', path: join(outLink, 'AGENTS.md') })
        assert.equal(outward.ok, false, '链接解析后越界必须拒绝')
        assert.match(refusalMessage(outward), /项目内|越界/)
      } catch (error) {
        console.log('OBS 外向链接策略：junction 创建失败（' + error.code + '）')
      }
    } catch (error) {
      if (error !== null && typeof error === 'object' && (error.code === 'EPERM' || error.code === 'EACCES')) {
        console.log('SKIP 断链用例：当前环境不允许创建文件符号链接（' + error.code + '）')
      } else {
        throw error
      }
    }
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('6) 只读文件：可读错误、无 .tmp 残留、rollback 不受影响', async () => {
  const env = makeEnv()
  try {
    await learn(env, '只读文件守卫')
    writeFileSync(env.agentPath, '# 只读目标\n', 'utf8')
    const preview = previewOf((await callBridge(env, { mode: 'preview' })).value)
    chmodSync(env.agentPath, 0o444)
    const before = read(env.agentPath)
    const outcome = await callBridge(env, { mode: 'apply', expectedSha256: preview.expected.sha256, previewId: preview.previewId })
    const message = expectRefusal(outcome, '只读文件 apply 必须失败')
    assert.match(message, /EACCES|EPERM|只读|read-only|permission/i, '错误必须可操作：' + message)
    assert.equal(Buffer.compare(read(env.agentPath), before), 0)
    assert.deepEqual(tmpResidue(env.projectRoot), [], '失败后不得残留 .tmp')

    chmodSync(env.agentPath, 0o666)
    const preview2 = previewOf((await callBridge(env, { mode: 'preview' })).value)
    const applied = await callBridge(env, { mode: 'apply', expectedSha256: preview2.expected.sha256, previewId: preview2.previewId })
    assert.equal(applied.ok, true, '恢复可写后 apply 应成功：' + refusalMessage(applied))
    chmodSync(env.agentPath, 0o444)
    const rollback = await callBridge(env, { mode: 'rollback', previewId: preview2.previewId, backupId: applied.value !== undefined && applied.value !== null ? applied.value.backupId : undefined })
    const rollbackMessage = refusalMessage(rollback)
    assert.ok(rollbackMessage !== null && /EACCES|EPERM|只读|read-only|permission/i.test(rollbackMessage), 'rollback 也必须给权限错误：' + rollbackMessage)
    assert.deepEqual(tmpResidue(env.projectRoot), [], 'rollback 失败后不得残留 .tmp')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('7) 标记缺损/重复/嵌套/错位 → 拒绝并给定位，零写入', async () => {
  const env = makeEnv()
  try {
    await learn(env, '标记异常守卫')
    const cases = {
      '缺损（有 start 无 end）': '# 头\n' + START + '\n旧内容\n',
      '重复（两组 start/end）': START + '\na\n' + END + '\n' + START + '\nb\n' + END + '\n',
      '嵌套（start 内再 start）': START + '\n' + START + '\nx\n' + END + '\n',
      '错位（end 在 start 前）': END + '\n中间\n' + START + '\n',
    }
    for (const [name, text] of Object.entries(cases)) {
      writeFileSync(env.agentPath, text, 'utf8')
      const hash = sha256(read(env.agentPath))
      const preview = await callBridge(env, { mode: 'preview' })
      const previewMessage = expectRefusal(preview, name + ' preview 必须拒绝')
      const apply = await callBridge(env, { mode: 'apply', expectedSha256: hash })
      const applyMessage = expectRefusal(apply, name + ' apply 必须拒绝')
      assert.ok(/\d|dsh-dream|行|片段|marker/.test(previewMessage + ' ' + applyMessage), name + ' 必须给定位（行号/片段）：' + previewMessage)
      assert.equal(sha256(read(env.agentPath)), hash, name + ' 必须零写入')
      assert.deepEqual(tmpResidue(env.projectRoot), [], name + ' 不得残留 .tmp')
    }
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('8) 目标不存在 → create；目标是目录 → 拒绝；路径越界 → 拒绝', async () => {
  const env = makeEnv()
  try {
    await learn(env, '目标形态守卫')
    const nested = join(env.projectRoot, 'docs')
    mkdirSync(nested, { recursive: true })
    const missing = join(nested, 'AGENTS.md')
    const missingResult = await callBridge(env, { mode: 'preview', path: missing })
    assert.equal(missingResult.ok, true, '缺失目标 preview 应成功：' + refusalMessage(missingResult))
    const preview = previewOf(missingResult.value)
    assert.equal(preview.action, 'create', '缺失目标 action 必须是 create：' + JSON.stringify(preview).slice(0, 200))
    assert.equal(preview.expected.exists, false, '不存在时必须 exists:false')
    assert.equal(preview.expected.sha256, null, '不存在时 sha256 必须是 null')
    assert.equal(typeof preview.expected.size, 'number')
    const applied = await callBridge(env, { mode: 'apply', path: missing, expectedSha256: preview.expected.sha256, previewId: preview.previewId })
    assert.equal(applied.ok, true, 'create 应成功：' + refusalMessage(applied))
    assert.ok(read(missing).toString('utf8').includes(START))

    const asDir = join(env.projectRoot, 'a-directory')
    mkdirSync(asDir, { recursive: true })
    expectRefusal(await callBridge(env, { mode: 'preview', path: asDir }), '目标是目录必须拒绝')

    const outside = join(env.projectRoot, '..', 'outside.md')
    const traversal = await callBridge(env, { mode: 'preview', path: outside })
    expectRefusal(traversal, '路径越界必须拒绝')
    assert.equal(existsSync(outside), false, '越界路径不得被创建')

    // 未规定项（策略观察）：父目录不存在时，要么 create 自建父目录、要么可读拒绝；两种都必须零写入。
    const deep = join(env.projectRoot, 'nope', 'AGENTS.md')
    const deepResult = await callBridge(env, { mode: 'preview', path: deep })
    if (deepResult.ok) {
      assert.equal(previewOf(deepResult.value).action, 'create', '缺父目录若放行必须是 create')
    } else {
      assert.ok(String(refusalMessage(deepResult)).length > 0, '缺父目录若拒绝必须给原因')
    }
    assert.equal(existsSync(join(env.projectRoot, 'nope')), false, 'preview 阶段不得创建父目录')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('9) 二次 apply 相同内容 → unchanged 且字节不变', async () => {
  const env = makeEnv()
  try {
    await learn(env, '二次 apply 幂等')
    writeFileSync(env.agentPath, '# 规则\n', 'utf8')
    const p1 = previewOf((await callBridge(env, { mode: 'preview' })).value)
    const a1 = await callBridge(env, { mode: 'apply', expectedSha256: p1.expected.sha256, previewId: p1.previewId })
    assert.equal(a1.ok, true)
    const afterFirst = read(env.agentPath)
    const currentHash = sha256(afterFirst)
    const a2 = await callBridge(env, { mode: 'apply', expectedSha256: currentHash, previewId: p1.previewId })
    assert.equal(a2.ok, true, '二次 apply 应成功（幂等）：' + refusalMessage(a2))
    const value = a2.value !== null && typeof a2.value === 'object' ? a2.value : {}
    assert.ok(value.action === 'unchanged' || value.unchanged === true, '必须显式返回 unchanged：' + JSON.stringify(value).slice(0, 200))
    assert.equal(Buffer.compare(read(env.agentPath), afterFirst), 0, '字节必须不变')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('10) rollback 守卫：恢复原状；块被外部改动后拒绝', async () => {
  const env = makeEnv()
  try {
    await learn(env, 'rollback 守卫')
    const original = '# 规则\n\n' + START + '\n- 旧经验\n' + END + '\n尾部文字\n'
    writeFileSync(env.agentPath, original, 'utf8')
    const preview = previewOf((await callBridge(env, { mode: 'preview' })).value)
    const applied = await callBridge(env, { mode: 'apply', expectedSha256: preview.expected.sha256, previewId: preview.previewId })
    assert.equal(applied.ok, true, 'apply 应成功：' + refusalMessage(applied))
    assert.notEqual(read(env.agentPath).toString('utf8'), original)

    const rollback = await callBridge(env, { mode: 'rollback', previewId: preview.previewId, backupId: applied.value !== undefined && applied.value !== null ? applied.value.backupId : undefined })
    assert.equal(rollback.ok, true, 'rollback 应成功：' + refusalMessage(rollback))
    assert.equal(read(env.agentPath).toString('utf8'), original, 'rollback 必须恢复原管理块与块外文字')

    const preview2 = previewOf((await callBridge(env, { mode: 'preview' })).value)
    const applied2 = await callBridge(env, { mode: 'apply', expectedSha256: preview2.expected.sha256, previewId: preview2.previewId })
    assert.equal(applied2.ok, true)
    writeFileSync(env.agentPath, read(env.agentPath).toString('utf8').replace(END, '外部改动\n' + END), 'utf8')
    const beforeGuard = read(env.agentPath)
    const guarded = await callBridge(env, { mode: 'rollback', previewId: preview2.previewId, backupId: applied2.value !== undefined && applied2.value !== null ? applied2.value.backupId : undefined })
    const message = expectRefusal(guarded, '块被改动后 rollback 必须拒绝')
    assert.ok(message.length > 0)
    assert.equal(Buffer.compare(read(env.agentPath), beforeGuard), 0, '拒绝后不得写入')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('R9a scope：workspaceRoot 命中 / 显式 projectId 命中；纯 projectId 不传 projectId 必须 scope-mismatch', async () => {
  const env = makeEnv()
  try {
    // 只有 projectId、没有 workspaceRoot 的经验：a/b 都不满足，只剩 c（显式 projectId）
    const byProject = await learn(env, '仅 projectId 的经验', { workspaceRoot: undefined })
    const withProject = previewOf((await callBridge(env, { mode: 'preview', lessonIds: [byProject.lessonId], projectId: env.scope.projectId }, { omitScope: true })).value)
    assert.ok(withProject.lessons.some((item) => (item.lessonId ?? item.id) === byProject.lessonId), '条件 c：显式 projectId 必须放行')

    const withoutProject = previewOf((await callBridge(env, { mode: 'preview', lessonIds: [byProject.lessonId] }, { omitScope: true })).value)
    const skipped = new Map(withoutProject.skipped.map((item) => [item.lessonId, item.reason]))
    assert.equal(withoutProject.lessons.length, 0, '不传 projectId 时纯 projectId 经验不得放行')
    assert.equal(skipped.get(byProject.lessonId), 'scope-mismatch', '桥接枚举只认 scope-mismatch：' + JSON.stringify(withoutProject.skipped))

    // 只有 workspaceRoot、没有 projectId 的经验：条件 a（== 目标文件所在目录 realpath）
    const byWorkspace = await learn(env, '仅 workspaceRoot 的经验', { projectId: undefined })
    const wsPreview = previewOf((await callBridge(env, { mode: 'preview', lessonIds: [byWorkspace.lessonId] }, { omitScope: true })).value)
    assert.ok(wsPreview.lessons.some((item) => (item.lessonId ?? item.id) === byWorkspace.lessonId), '条件 a：workspaceRoot 命中目标目录必须放行')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('R9b not-usable：候选/无证据经验不得桥接（桥接枚举只有 not-usable）', async () => {
  const env = makeEnv()
  try {
    const candidate = await env.learn.execute({
      kind: 'procedure', title: '本项目候选经验', action: 'a', when: 'w', ...env.scope,
      evidence: [{ kind: 'session', sessionId: 's-claim', recordSeq: 1, summary: '仅声称', verification: 'claimed' }],
    })
    assert.equal(candidate.state, 'candidate')
    const preview = previewOf((await callBridge(env, { mode: 'preview', lessonIds: [candidate.lessonId] })).value)
    const skipped = new Map(preview.skipped.map((item) => [item.lessonId, item.reason]))
    assert.equal(preview.lessons.length, 0, '候选不得入选')
    assert.equal(skipped.get(candidate.lessonId), 'not-usable', '桥接枚举只认 not-usable，实际 ' + JSON.stringify(preview.skipped))
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('R9c not-accepted-global：global 未经 accepted 不得桥接；已采纳 global 可桥接', async () => {
  const env = makeEnv()
  try {
    const unaccepted = await env.learn.execute({
      kind: 'procedure', title: '全局未采纳经验', action: 'a', when: 'w', global: true, ...env.scope,
      evidence: [{ kind: 'session', sessionId: 's-global', recordSeq: 1, summary: '实测', verification: 'read' }],
    })
    const store = new KnowledgeStore(join(env.journalDir, 'knowledge'))
    store.applyTransition(unaccepted.lessonId, 'usable', 1, 'trusted-unreviewed-fixture')
    assert.notEqual(unaccepted.review === undefined ? undefined : unaccepted.review.decision, 'accepted')
    const accepted = await env.learn.execute({
      kind: 'procedure', title: '全局已采纳经验', action: 'a', when: 'w', global: true, ...env.scope,
      evidence: [{ kind: 'user-correction', sessionId: 's-global-user', recordSeq: 2, summary: '用户明确要求', verification: 'read' }],
    })
    await env.tools.find(tool => tool.name === 'dream_review').execute({ action: 'accept', lessonId: accepted.lessonId, expectedRevision: 1 })
    const preview = previewOf((await callBridge(env, { mode: 'preview', lessonIds: [unaccepted.lessonId, accepted.lessonId] })).value)
    const ids = preview.lessons.map((item) => item.lessonId ?? item.id)
    assert.equal(ids.includes(unaccepted.lessonId), false, '未 accepted 的 global 不得入选')
    assert.ok(ids.includes(accepted.lessonId), '用户已 accepted 的 global 应入选')
    const skipped = new Map(preview.skipped.map((item) => [item.lessonId, item.reason]))
    assert.equal(skipped.get(unaccepted.lessonId), 'not-accepted-global', '桥接枚举只认 not-accepted-global，实际 ' + JSON.stringify(preview.skipped))
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})

test('R10 脱敏：含 sk- 的旧日记教训不得原样写入 AGENTS.md', async () => {
  const env = makeEnv()
  try {
    const { saveDream } = await import('../lib/journal.js')
    saveDream(env.journalDir, '旧日记', ['注意 ' + SECRET + ' 不要泄漏'], '平静')
    const legacy = await callBridge(env, { path: env.agentPath, maxLessons: 5 })
    assert.equal(legacy.ok, true, 'legacy 直写应成功：' + refusalMessage(legacy))
    const text = read(env.agentPath).toString('utf8')
    assert.equal(text.includes(SECRET), false, '明文密钥不得进 AGENTS.md')
    assert.match(text, /已脱敏/)

    const learned = await learn(env, '把密钥 ' + SECRET + ' 写进标题')
    const preview = previewOf((await callBridge(env, { mode: 'preview', lessonIds: [learned.lessonId] })).value)
    const applied = await callBridge(env, { mode: 'apply', expectedSha256: preview.expected.sha256, previewId: preview.previewId })
    assert.equal(applied.ok, true, 'apply 应成功：' + refusalMessage(applied))
    assert.equal(read(env.agentPath).toString('utf8').includes(SECRET), false, '知识路径也不得写入明文密钥')
  } finally { rmSync(env.dir, { recursive: true, force: true }) }
})
