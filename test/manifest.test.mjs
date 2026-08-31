import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('package.json 元数据：入口/许可证/关键词', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.name, '@stardustlc/dsh-dream')
  assert.equal(pkg.main, 'lib/index.js')
  assert.equal(pkg.license, 'MIT')
  assert.ok(pkg.keywords.includes('dsh-plugin'))
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
})

test('cordis.patch.yml 存在且插入行名为 @stardustlc/dsh-dream', () => {
  const text = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
  assert.match(text, /name: '@stardustlc\/dsh-dream'/)
})

test('做梦协议技能随包分发', () => {
  assert.ok(existsSync(join(root, 'skills', 'dream-protocol', 'SKILL.md')))
})
