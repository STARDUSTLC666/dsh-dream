import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDreamTools, resolveConfig } from '../lib/index.js'
import { makeSessionFile, makeMainSessionLines, makeEvent } from './helpers.mjs'

const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-v2-'))
const sessionsRoot = join(dir, 'sessions')
const journalDir = join(dir, 'dreams')

// 会话里故意带密钥，验证端到端脱敏
const leakyLines = makeMainSessionLines('session-leaky')
leakyLines.splice(3, 0, makeEvent('user/message', 99, '我的密码是 password: hunter2secret，密钥 sk-abcdefghij1234567890'))
mkdirSync(join(sessionsRoot, '--demo--', 'session-leaky'), { recursive: true })
writeFileSync(join(sessionsRoot, '--demo--', 'session-leaky', 'session.jsonl.zstd'), makeSessionFile(leakyLines))

const cfg = resolveConfig({ sessionsRoot, journalDir })
const tools = buildDreamTools(cfg)
const digest = tools.find((t) => t.name === 'dream_digest')

test('dream_digest：端到端脱敏（密钥不入梦）', async () => {
  const value = await digest.execute({})
  const text = value.sessions[0].digestText + ' ' + value.sessions[0].userMessages.join(' ')
  assert.ok(!text.includes('hunter2secret'), '密码明文泄漏')
  assert.ok(!text.includes('sk-abcdefghij1234567890'), 'sk 密钥明文泄漏')
  assert.match(text, /已脱敏/)
})

test('dream_digest：brief 模式 digestText 收紧到 400 字符', async () => {
  const brief = await digest.execute({ mode: 'brief' })
  const full = await digest.execute({})
  assert.equal(brief.mode, 'brief')
  assert.ok(brief.sessions[0].digestText.length <= 400 + 10)
  assert.ok(full.sessions[0].digestText.length >= brief.sessions[0].digestText.length)
})

test('dream_digest：maskSecrets=false 时不脱敏（显式配置场景）', async () => {
  const raw = buildDreamTools(resolveConfig({ sessionsRoot, journalDir, maskSecrets: false }))
  const value = await raw.find((t) => t.name === 'dream_digest').execute({})
  assert.ok(value.sessions[0].userMessages.join(' ').includes('hunter2secret'))
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
