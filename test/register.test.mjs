import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, inject } from '../lib/index.js'

function makeFakeCtx() {
  const tools = []
  const skills = []
  const listeners = {}
  return {
    ctx: {
      tools: { register(definition) { tools.push(definition); return () => { const i = tools.indexOf(definition); if (i >= 0) tools.splice(i, 1) } } },
      skills: { register(definition) { skills.push(definition); return () => { const i = skills.indexOf(definition); if (i >= 0) skills.splice(i, 1) } } },
      on(event, listener) { listeners[event] = listener; return () => {} },
    },
    tools,
    skills,
    listeners,
  }
}

test('inject 声明 tools 与 skills', () => {
  assert.deepEqual(inject, ['tools', 'skills'])
})

test('apply 注册 5 个工具 + 做梦协议技能', () => {
  const { ctx, tools, skills } = makeFakeCtx()
  apply(ctx, {})
  assert.equal(tools.length, 6)
  assert.equal(skills.length, 1)
  assert.equal(skills[0].name, 'dream-protocol')
  assert.match(skills[0].description, /做梦协议/)
  assert.ok(skills[0].content.length > 0)
})

test('apply 配置非法时不抛，退回默认配置', () => {
  const { ctx, tools } = makeFakeCtx()
  assert.doesNotThrow(() => apply(ctx, { maxSessions: -5 }))
  assert.equal(tools.length, 6)
})

test('ctx 无 skills 服务时只注册工具不崩', () => {
  const tools = []
  const ctx = {
    tools: { register(d) { tools.push(d); return () => {} } },
    on() { return () => {} },
  }
  assert.doesNotThrow(() => apply(ctx, {}))
  assert.equal(tools.length, 6)
})

test('dispose 触发时卸载全部工具与技能', () => {
  const { ctx, tools, skills, listeners } = makeFakeCtx()
  apply(ctx, {})
  assert.equal(tools.length, 6)
  assert.equal(skills.length, 1)
  listeners.dispose()
  assert.equal(tools.length, 0)
  assert.equal(skills.length, 0)
})
