import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maskSecrets, SECRET_PATTERNS } from '../lib/index.js'

test('maskSecrets：sk 密钥/GitHub 令牌/Groq/Slack/AWS/JWT 全部打码', () => {
  assert.match(maskSecrets('key is sk-abcdefghij1234567890 ok'), /\[已脱敏·疑似 sk 密钥\]/)
  assert.match(maskSecrets('ghp_ABCDEFGHIJ1234567890'), /\[已脱敏·疑似 GitHub 令牌\]/)
  assert.match(maskSecrets('gsk_ABCDEFGHIJ1234567890'), /\[已脱敏·疑似 Groq 密钥\]/)
  assert.match(maskSecrets('xoxb-123456-abcdef-ghijk'), /\[已脱敏·疑似 Slack 令牌\]/)
  assert.match(maskSecrets('AKIAIOSFODNN7EXAMPLE'), /\[已脱敏·疑似 AWS 访问密钥\]/)
  assert.match(maskSecrets('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0'), /\[已脱敏·疑似 JWT\]/)
})

test('maskSecrets：password/secret/token 赋值打码', () => {
  assert.match(maskSecrets('password: supersecret123'), /password: \[已脱敏·凭据\]/)
  assert.match(maskSecrets('api_key=abc123xyz789'), /api_key=\[已脱敏·凭据\]/)
})

test('maskSecrets：超长高熵串打码，正常文本不误伤', () => {
  assert.match(maskSecrets('token aB3dEfGh1jK2LmN4oP5qR6sT7uV8wX9yZ0abcDEFghi 结束'), /\[已脱敏·长令牌\]/)
  const normal = '用户让我修复输入法问题，并重启了 Qoder 应用。'
  assert.equal(maskSecrets(normal), normal)
})

test('SECRET_PATTERNS 至少覆盖 7 类已知密钥', () => {
  assert.ok(SECRET_PATTERNS.length >= 7)
})
