import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { saveDream, dreamStats, bridgeDreams, buildLessonsBlock, BRIDGE_START, BRIDGE_END } from '../lib/index.js'

const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-bridge-'))
const journalDir = join(dir, 'dreams')

function seedDreams() {
  saveDream(journalDir, '输入法问题反复出现', ['先问是否重启过应用', '开启兼容模式'], '存疑')
  saveDream(journalDir, '代理挂掉导致推送失败', ['先问是否重启过应用'], '平静')
  saveDream(journalDir, '用户喜欢组合拳方案', ['优先复用现有资产'], '兴奋')
}

test('dreamStats：心境分布与总数', () => {
  seedDreams()
  const stats = dreamStats(journalDir)
  assert.equal(stats.total, 3)
  assert.equal(stats.moods['存疑'], 1)
  assert.equal(stats.moods['平静'], 1)
  assert.equal(stats.moods['兴奋'], 1)
})

test('dreamStats：高频教训排最前', () => {
  const stats = dreamStats(journalDir)
  assert.equal(stats.topLessons[0].lesson, '先问是否重启过应用')
  assert.equal(stats.topLessons[0].count, 2)
})

test('bridgeDreams：无文件时新建并写入教训块', () => {
  const target = join(dir, 'agents', 'AGENTS.md')
  const result = bridgeDreams(journalDir, target, 10)
  assert.equal(result.action, 'created')
  const text = readFileSync(target, 'utf8')
  assert.match(text, /## 梦境沉淀/)
  assert.match(text, /先问是否重启过应用（反复梦到 2 次）/)
})

test('bridgeDreams：重复执行幂等，始终一个标记块', () => {
  const target = join(dir, 'agents', 'AGENTS.md')
  bridgeDreams(journalDir, target, 10)
  bridgeDreams(journalDir, target, 10)
  const text = readFileSync(target, 'utf8')
  assert.equal(text.split(BRIDGE_START).length - 1, 1)
  assert.equal(text.split(BRIDGE_END).length - 1, 1)
})

test('bridgeDreams：无标记块的既有文件走追加', () => {
  const target = join(dir, 'existing.md')
  writeFileSync(target, '# 项目说明\n\n这里已有内容。\n', 'utf8')
  const result = bridgeDreams(journalDir, target, 10)
  assert.equal(result.action, 'appended')
  const text = readFileSync(target, 'utf8')
  assert.match(text, /# 项目说明/)
  assert.match(text, /## 梦境沉淀/)
})

test('bridgeDreams：没做过梦时拒绝', () => {
  const emptyDir = join(dir, 'empty-dreams')
  assert.throws(() => bridgeDreams(emptyDir, join(dir, 'x.md'), 10), /还没有做过梦/)
})

test('buildLessonsBlock：标记块格式正确', () => {
  const block = buildLessonsBlock([{ lesson: '教训甲', count: 3 }])
  assert.ok(block.startsWith(BRIDGE_START))
  assert.ok(block.endsWith(BRIDGE_END))
  assert.match(block, /教训甲（反复梦到 3 次）/)
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
