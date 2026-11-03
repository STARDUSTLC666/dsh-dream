import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { makeSessionFile, makeMainSessionLines, makeHeader } from './helpers.mjs'

const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-tools-'))
const sessionsRoot = join(dir, 'sessions')
const journalDir = join(dir, 'dreams')

// 造会话：1 个主会话 + 1 个子代理会话（应被跳过）
mkdirSync(join(sessionsRoot, '--demo--', 'session-main'), { recursive: true })
writeFileSync(join(sessionsRoot, '--demo--', 'session-main', 'session.jsonl.zstd'), makeSessionFile(makeMainSessionLines('session-main')))
mkdirSync(join(sessionsRoot, '--demo--', 'sub-1'), { recursive: true })
writeFileSync(join(sessionsRoot, '--demo--', 'sub-1', 'session.jsonl.zstd'), makeSessionFile([makeHeader('sub-1', { origin: 'subagent' })]))

const cfg = resolveConfig({ sessionsRoot, journalDir })
const tools = buildDreamTools(cfg)
const digest = tools.find((t) => t.name === 'dream_digest')
const save = tools.find((t) => t.name === 'dream_save')
const journal = tools.find((t) => t.name === 'dream_journal')
const recall = tools.find((t) => t.name === 'dream_recall')
const health = tools.find((t) => t.name === 'dream_health')

test('构建 9 个工具且名单正确', () => {
  assert.deepEqual(tools.map((t) => t.name).sort(), ['dream_bridge', 'dream_context', 'dream_digest', 'dream_health', 'dream_journal', 'dream_learn', 'dream_recall', 'dream_review', 'dream_save'])
})

test('dream_digest：回放主会话并跳过子代理', async () => {
  const value = await digest.execute({})
  assert.equal(value.count, 1)
  assert.equal(value.sessions[0].title, '帮我修输入法的会话')
  assert.deepEqual(value.sessions[0].userMessages, ['打不出中文了', '还是不行'])
  assert.match(value.sessions[0].digestText, /工具足迹/)
})

test('dream_save：写入后可被 dream_journal 翻到', async () => {
  const saved = await save.execute({ reflection: '输入法问题反复出现，用户偏好先自查再重启', lessons: ['先问是否重启过'], mood: '平静' })
  assert.equal(saved.ok, true)
  const value = await journal.execute({})
  assert.equal(value.count, 1)
  assert.match(value.dreams[0].reflection, /输入法问题/)
  const blocks = journal.output.render({}, value)
  assert.match(blocks[0].text, /梦境日记共 1 条/)
  assert.match(blocks[0].text, /心境分布/)
})

test('dream_save：空反思抛中文错误', async () => {
  await assert.rejects(() => save.execute({ reflection: '  ' }), /为必填|梦境不能为空/)
})

test('dream_recall：关键词命中与未命中', async () => {
  const hit = await recall.execute({ query: '输入法' })
  assert.equal(hit.count, 1)
  const miss = await recall.execute({ query: '不存在的词' })
  assert.equal(miss.count, 0)
  const blocks = recall.output.render({}, miss)
  assert.match(blocks[0].text, /没有梦到/)
})

test('dream_health：会话目录可读 + 梦境计数', async () => {
  const value = await health.execute({})
  assert.equal(value.ok, true)
  assert.match(String(value.checks[1].detail), /已做 1 个梦/)
})

test('dream_health：会话目录缺失时 ok=false', async () => {
  const bad = buildDreamTools(resolveConfig({ sessionsRoot: join(dir, 'no-such'), journalDir }))
  const value = await bad.find((t) => t.name === 'dream_health').execute({})
  assert.equal(value.ok, false)
})

test('dream_health：失败项带可执行建议，渲染里出现「建议」而不是只说有问题', async () => {
  const bad = buildDreamTools(resolveConfig({ sessionsRoot: join(dir, 'no-such'), journalDir }))
  const tool = bad.find((t) => t.name === 'dream_health')
  const value = await tool.execute({})
  const failed = value.checks.find((c) => c.ok === false)
  assert.ok(failed, '会话目录缺失必须落到具体的失败检查项')
  assert.match(String(failed.hint), /sessionsRoot|先跑一次/, '失败项必须给出下一步，而不是只报现象')
  assert.ok(Array.isArray(value.hints) && value.hints.length > 0, '顶层 hints 供渲染与模型直接消费')
  const text = tool.output.render({}, value)[0].text
  assert.match(text, /建议：/, '渲染必须显式给出建议段')
  assert.match(text, /会话目录不可用/)
})

test('dream_health：日记目录尚未创建不算故障，也不写盘', async () => {
  const freshJournal = join(dir, 'journal-not-created-yet')
  const tool = buildDreamTools(resolveConfig({ sessionsRoot, journalDir: freshJournal })).find((t) => t.name === 'dream_health')
  const value = await tool.execute({})
  assert.equal(value.ok, true, '首次使用还没做过梦是正常状态')
  assert.match(String(value.checks[1].detail), /尚不存在/)
  assert.equal(existsSync(freshJournal), false, 'dream_health 是只读自检，不得顺手创建日记目录')
  assert.equal(value.hints, undefined, '正常状态不必输出建议噪音')
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
