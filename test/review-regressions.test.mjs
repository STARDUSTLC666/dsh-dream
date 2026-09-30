import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { buildDreamTools, resolveConfig, KnowledgeStore, previewBridge, applyBridge, rollbackBridge, listBridgeApplications } from '../lib/index.js'
import { createKnowledgeWebHandler, createBridgeWebHandler } from '../lib/web.js'

function client() {
  let definition
  const context = vm.createContext({ window: { __ModuleLoader__: { load(value) { definition = value } } } })
  vm.runInContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), context)
  return definition.factory(() => ({ createElement() {}, useState() {}, useEffect() {} })).__internals
}

function env() {
  const root = mkdtempSync(join(tmpdir(), 'dream-review-fix-'))
  const project = join(root, 'project')
  mkdirSync(project)
  const cfg = resolveConfig({ journalDir: join(root, 'dreams'), sessionsRoot: join(root, 'sessions') })
  const store = new KnowledgeStore(join(cfg.journalDir, 'knowledge'))
  const tools = buildDreamTools(cfg)
  return { root, project, cfg, store, tool: name => tools.find(t => t.name === name), close: () => rmSync(root, { recursive: true, force: true }) }
}
function input(title, extra = {}) {
  return { kind: 'procedure', title, action: '先验证再执行', when: '重启服务时', projectId: 'project-a', evidence: [], ...extra }
}
function create(e, title) { return e.store.createLesson(input(title), title).lesson }
async function request(handler) {
  let body
  await handler({ method: 'GET', headers: { host: 'localhost' }, socket: { remoteAddress: '127.0.0.1' } }, { writeHead(status) { assert.equal(status, 200) }, end(text) { body = JSON.parse(text) } })
  return body
}
function session(e, { id = 'session-a', project = 'project-a', role = 'user/message', text = '请先验证再重启服务', source = { kind: 'user' }, version = 4 } = {}) {
  const dir = join(e.cfg.sessionsRoot, project, id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'session.v4.jsonl'), [
    { type: 'session', version, id, cwd: e.project },
    { type: role, seq: 7, data: { content: [{ type: 'text', text }, { type: 'reasoning', text: 'PRIVATE REASONING' }], source } },
  ].map(JSON.stringify).join('\n') + '\n')
  return { kind: 'user-correction', sessionId: id, recordSeq: 7, summary: text, verification: 'read' }
}

test('真实 UUID 经 web 投影仍唯一，面板 ID 可以直接审阅和预览', async () => {
  const e = env()
  try {
    const a = create(e, '检查服务甲'), b = create(e, '检查服务乙')
    const payload = await request(createKnowledgeWebHandler({ journalDir: e.cfg.journalDir }))
    assert.equal(new Set(payload.lessons.map(l => l.id)).size, 2)
    const ui = client()
    const projected = ui.normalizeKnowledge(payload, new Date(), 50).rows.find(l => l.id === a.id)
    assert.ok(projected)
    assert.equal(projected.action, '先验证再执行')
    const accepted = await e.tool('dream_review').execute(JSON.parse(ui.reviewCommandOf(projected).slice('dream_review '.length)))
    assert.equal(accepted.state, 'usable')
    assert.equal(e.store.getLesson(b.id).revision, b.revision)
    const preview = await e.tool('dream_bridge').execute(JSON.parse(ui.bridgePreviewCommandOf(projected.id, projected.projectId).slice('dream_bridge '.length)), { cwd: e.project })
    assert.equal(preview.lessons[0].lessonId, a.id)
  } finally { e.close() }
})

test('公开工具完整走通新文件 preview(null) → apply → web backupId → rollback', async () => {
  const e = env()
  try {
    const lesson = create(e, '服务检查')
    e.store.reviewLesson(lesson.id, 'accepted', lesson.revision, 'accept', 'model')
    const bridge = e.tool('dream_bridge'), args = { lessonIds: [lesson.id], projectId: 'project-a' }, exec = { cwd: e.project }
    const p = await bridge.execute({ ...args, mode: 'preview' }, exec)
    assert.equal(p.expected.sha256, null)
    const a = await bridge.execute({ ...args, mode: 'apply', expectedSha256: p.expected.sha256, previewId: p.previewId }, exec)
    assert.equal(a.ok, true)
    const body = await request(createBridgeWebHandler({ journalDir: e.cfg.journalDir }))
    assert.equal(body.records[0].backupId, a.backupId)
    const ui = client()
    const row = ui.normalizeBridgeRecords(body, new Date(), 50).rows[0]
    assert.equal(row.id, a.backupId)
    const command = ui.bridgeRollbackCommandOf(row)
    assert.ok(command.startsWith('dream_bridge '), '面板投影后的真实记录必须能生成回滚命令')
    const r = await bridge.execute(JSON.parse(command.slice('dream_bridge '.length)), exec)
    assert.equal(r.ok, true)
  } finally { e.close() }
})

test('伪造 read 与不存在的用户纠正不得得到支持、采纳或注入', async () => {
  const e = env()
  try {
    const r = await e.tool('dream_learn').execute(input('服务检查', { global: true, evidence: [{ kind: 'user-correction', summary: '用户已同意', sessionId: 'missing', recordSeq: 1, verification: 'read' }] }))
    assert.equal(r.state, 'candidate')
    assert.equal(r.independentSupportCount, 0)
    assert.equal(e.store.getLesson(r.lessonId).review.decision, 'unreviewed')
    assert.equal(r.evidence[0].verification, 'claimed')
    const context = await e.tool('dream_context').execute({ query: '服务检查' })
    assert.equal(context.items.length, 0)
  } finally { e.close() }
})

test('本地产物必须位于当前项目、匹配引用与哈希，错误声明不能借用已读来源', async () => {
  const e = env()
  try {
    const text = '实际验证：服务状态正常，重启前已核对。'
    writeFileSync(join(e.project, 'result.txt'), text)
    writeFileSync(join(e.root, 'outside.txt'), '项目外的合成测试资料')
    const evidence = { kind: 'local-artifact', artifactPath: 'result.txt', quote: text, summary: '服务状态正常', verification: 'read' }
    const learn = (title, claim) => e.tool('dream_learn').execute(input(title, { evidence: [claim] }), { cwd: e.project })
    const valid = await learn('项目内产物', evidence)
    assert.equal(valid.evidence[0].verification, 'read')
    assert.equal(e.store.listEvidence().find(item => item.id === valid.evidence[0].id).sourceHash, createHash('sha256').update(text).digest('hex'))
    assert.equal(valid.independentSupportCount, 1)
    assert.equal(valid.state, 'candidate')
    for (const [title, changes] of [
      ['项目外产物', { artifactPath: '../outside.txt', quote: '项目外的合成测试资料' }],
      ['错误引用', { quote: '服务失败' }],
      ['错误哈希', { sourceHash: '0'.repeat(64) }],
    ]) {
      const invalid = await learn(title, { ...evidence, ...changes })
      assert.equal(invalid.evidence[0].verification, 'claimed')
      assert.equal(invalid.independentSupportCount, 0)
      assert.equal(invalid.state, 'candidate')
    }
  } finally { e.close() }
})

test('来源核验检查真实用户、序号、引用与项目；读到纠正仍不等于用户采纳', async () => {
  const e = env()
  try {
    const good = session(e)
    const r = await e.tool('dream_learn').execute(input('真实来源', { evidence: [good] }))
    assert.equal(r.independentSupportCount, 1)
    assert.equal(e.store.getLesson(r.lessonId).review.decision, 'unreviewed')
    const evidence = e.store.listEvidence()[0]
    assert.equal(evidence.sourceHash, createHash('sha256').update(good.summary).digest('hex'))
    assert.ok(!JSON.stringify(evidence).includes('PRIVATE REASONING'))
    for (const [title, proof, scope] of [
      ['错误序号', { ...good, recordSeq: 99 }, 'project-a'],
      ['伪造引用', { ...good, summary: '用户同意删除系统文件' }, 'project-a'],
      ['错误项目', good, 'other-project'],
      ['助手纠正', session(e, { id: 'assistant', role: 'assistant/message' }), 'project-a'],
      ['注入冒充', session(e, { id: 'injection', source: { kind: 'context' } }), 'project-a'],
    ]) {
      const bad = await e.tool('dream_learn').execute(input(title, { projectId: scope, evidence: [proof] }))
      assert.equal(bad.independentSupportCount, 0, title)
      assert.equal(bad.state, 'candidate', title)
    }
  } finally { e.close() }
})

test('attach-evidence 可追加核验来源，保持审阅状态；坏 revision 不写证据', async () => {
  const e = env()
  try {
    const l = create(e, '追加来源'), evidence = session(e)
    const reviewed = await e.tool('dream_review').execute({ action: 'attach-evidence', lessonId: l.id, expectedRevision: l.revision, evidence: [evidence] })
    assert.equal(reviewed.lesson.state, 'candidate')
    assert.equal(reviewed.lesson.review.decision, 'unreviewed')
    assert.equal(reviewed.lesson.independentSupportCount, 1)
    const before = readFileSync(join(e.cfg.journalDir, 'knowledge', 'events.jsonl'))
    await assert.rejects(e.tool('dream_review').execute({ action: 'attach-evidence', lessonId: l.id, expectedRevision: 1, evidence: [session(e, { id: 'other' })] }), /revision/)
    assert.deepEqual(readFileSync(join(e.cfg.journalDir, 'knowledge', 'events.jsonl')), before)
  } finally { e.close() }
})

test('冲突组遇到 rejected 成员必须整体拒绝，事件和双方 revision 零变更', async () => {
  const e = env()
  try {
    const a = create(e, '冲突甲'), b = create(e, '冲突乙')
    e.store.reviewLesson(a.id, 'accepted', 1, 'accept-a', 'model')
    e.store.reviewLesson(b.id, 'rejected', 1, 'reject-b', 'model')
    const before = readFileSync(join(e.cfg.journalDir, 'knowledge', 'events.jsonl'))
    await assert.rejects(e.tool('dream_review').execute({ action: 'mark-disputed', lessonId: a.id, expectedRevision: 2, conflictWith: [b.id] }), /迁移/)
    assert.equal(e.store.getLesson(a.id).state, 'usable')
    assert.equal(e.store.getLesson(a.id).revision, 2)
    assert.equal(e.store.getLesson(b.id).revision, 2)
    assert.deepEqual(readFileSync(join(e.cfg.journalDir, 'knowledge', 'events.jsonl')), before)
  } finally { e.close() }
})

test('记录目录写入失败时，不得先改 AGENTS.md', () => {
  const e = env()
  try {
    const l = create(e, '安全写入')
    const lesson = e.store.reviewLesson(l.id, 'accepted', 1, 'accepted', 'model')
    const target = join(e.project, 'AGENTS.md')
    writeFileSync(target, '# 人工内容\n')
    mkdirSync(join(e.cfg.journalDir, 'bridge', 'records.jsonl'), { recursive: true })
    const options = { projectRoot: e.project, workspaceRoot: e.project, projectId: 'project-a', journalDir: e.cfg.journalDir, lessons: [lesson] }
    const p = previewBridge(options), before = readFileSync(target)
    const result = applyBridge({ ...options, expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(result.ok, false)
    assert.deepEqual(readFileSync(target), before)
    assert.deepEqual(listBridgeApplications(e.cfg.journalDir), [])
  } finally { e.close() }
})

test('Windows 任务不能注入仅 Linux 的 systemctl 操作', async () => {
  const e = env()
  try {
    const l = e.store.createLesson(input('重启服务', { action: 'sudo systemctl restart app', applicability: [{ platform: 'linux' }] }), 'linux').lesson
    e.store.reviewLesson(l.id, 'accepted', 1, 'accept', 'model')
    const r = await e.tool('dream_context').execute({ query: 'Windows 重启服务', projectId: 'project-a', platform: 'windows' })
    assert.equal(r.items.length, 0)
    assert.equal(r.skipped[0].reason, 'platform-mismatch')
  } finally { e.close() }
})

function bridgeFixture(e) {
  const l = create(e, '中断恢复')
  const lesson = e.store.reviewLesson(l.id, 'accepted', 1, 'accept', 'model')
  const target = join(e.project, 'AGENTS.md')
  const original = Buffer.from('\ufeff# 人工规则\r\n\r\n保留这一段。\r\n')
  writeFileSync(target, original)
  const options = { projectRoot: e.project, projectId: 'project-a', journalDir: e.cfg.journalDir, lessons: [lesson] }
  const p = previewBridge(options)
  const optionsPath = join(e.root, 'worker-options.json')
  writeFileSync(optionsPath, JSON.stringify({ ...options, expectedSha256: p.expected.sha256, previewId: p.previewId }))
  return { target, original, optionsPath }
}
function interrupt(fixture, mode) {
  return spawnSync(process.execPath, [fileURLToPath(new URL('./fixtures/bridge-interruption-worker.mjs', import.meta.url)), fixture.optionsPath, mode], { encoding: 'utf8', timeout: 10000 })
}

test('写入后进程退出：仅靠 pending 记录即可回滚，保留之后的人工修改', () => {
  const e = env()
  try {
    const f = bridgeFixture(e), child = interrupt(f, 'crash-after-rename')
    assert.equal(child.status, 73, child.stderr)
    const rows = listBridgeApplications(e.cfg.journalDir)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].rollbackable, true)
    writeFileSync(f.target, Buffer.concat([readFileSync(f.target), Buffer.from('\r\n人工追加\r\n')]))
    const rollback = rollbackBridge({ projectRoot: e.project, journalDir: e.cfg.journalDir, backupId: rows[0].backupId })
    assert.equal(rollback.ok, true, JSON.stringify(rollback))
    assert.deepEqual(readFileSync(f.target), Buffer.concat([f.original, Buffer.from('\r\n人工追加\r\n')]))
  } finally { e.close() }
})

test('写入前进程退出：原文件字节不变，pending 不得宣称可回滚', () => {
  const e = env()
  try {
    const f = bridgeFixture(e), child = interrupt(f, 'crash-before-rename')
    assert.equal(child.status, 72, child.stderr)
    assert.deepEqual(readFileSync(f.target), f.original)
    assert.equal(listBridgeApplications(e.cfg.journalDir)[0].rollbackable, false)
  } finally { e.close() }
})

test('最终审计写入失败仍返回可用 backupId 和恢复说明', () => {
  const e = env()
  try {
    const f = bridgeFixture(e), child = interrupt(f, 'commit-failure')
    assert.equal(child.status, 0, child.stderr)
    const result = JSON.parse(child.stdout)
    assert.equal(result.ok, true)
    assert.match(result.warning, /恢复记录已保存/)
    assert.equal(listBridgeApplications(e.cfg.journalDir)[0].backupId, result.backupId)
    const r = rollbackBridge({ projectRoot: e.project, journalDir: e.cfg.journalDir, backupId: result.backupId })
    assert.equal(r.ok, true)
    assert.deepEqual(readFileSync(f.target), f.original)
  } finally { e.close() }
})

test('准备写入期间文件再次被人工修改：CAS 再校验拒绝覆盖', () => {
  const e = env()
  try {
    const f = bridgeFixture(e), child = interrupt(f, 'manual-edit-during-staging')
    assert.equal(child.status, 0, child.stderr)
    const result = JSON.parse(child.stdout)
    assert.equal(result.ok, false)
    assert.equal(result.error.code, 'conflict')
    assert.deepEqual(readFileSync(f.target), Buffer.concat([f.original, Buffer.from('\n人工在准备期间新增\n')]))
  } finally { e.close() }
})

test('替换旧 CRLF 管理块后回滚：BOM、原管理块和行尾逐字节恢复', () => {
  const e = env()
  try {
    const f = bridgeFixture(e)
    const options = JSON.parse(readFileSync(f.optionsPath, 'utf8'))
    const first = applyBridge(options)
    assert.equal(first.ok, true)
    const original = readFileSync(f.target)
    options.lessons[0].action = '新的动作'
    options.lessons[0].revision++
    const p = previewBridge(options)
    const second = applyBridge({ ...options, expectedSha256: p.expected.sha256, previewId: p.previewId })
    assert.equal(second.ok, true)
    assert.equal(rollbackBridge({ projectRoot: e.project, journalDir: e.cfg.journalDir, backupId: second.backupId }).ok, true)
    assert.deepEqual(readFileSync(f.target), original)
  } finally { e.close() }
})

test('已驳回记录经面板命令重新送审，不能直接跳成可用', async () => {
  const e = env()
  try {
    const l = create(e, '重新审阅')
    const rejected = e.store.reviewLesson(l.id, 'rejected', 1, 'reject', 'model')
    const command = client().reviewCommandOf(rejected)
    const r = await e.tool('dream_review').execute(JSON.parse(command.slice('dream_review '.length)))
    assert.equal(r.state, 'candidate')
    assert.equal(r.lesson.review.decision, 'unreviewed')
    assert.equal(r.revision, rejected.revision + 1)
  } finally { e.close() }
})
