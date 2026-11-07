/**
 * 反向代理白名单（trustedRemoteAddresses / trustedHosts）的契约测试。
 *
 * 三道门里前两道原先只认回环：来源必须是 127.0.0.1/::1，Host 必须是 localhost。
 * 部署在反向代理后面时这两条都会命中，面板只能 403。本测试固定三件事：
 *   1. 两项都默认空 → 行为与旧版逐字一致（不配就是关着）；
 *   2. 配了以后只放行精确匹配（端口/大小写不敏感，IPv4-mapped 归一）；
 *   3. 两项是「且」关系：只配来源、Host 不是本机名时仍然 403。
 *
 * 与 web.test.mjs 一样用 registerHooks 把 src 下的 .js 说明符补成 .ts，免构建。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    const fromTs = typeof context.parentURL === 'string' && context.parentURL.endsWith('.ts')
    if (fromTs && specifier.startsWith('.') && specifier.endsWith('.js')) {
      try {
        return nextResolve(specifier, context)
      } catch {
        return nextResolve(specifier.slice(0, -3) + '.ts', context)
      }
    }
    return nextResolve(specifier, context)
  },
})

const { LOOPBACK_ONLY, createDreamWebHandler, gatePolicyOf, hostVerdict, remoteVerdict } = await import('../src/web.ts')
const { resolveConfig } = await import('../src/config.ts')

const PROXY = '192.0.2.1'
const PUBLIC_HOST = 'dsh.example.com:6443'
const OPEN = { trustedRemoteAddresses: [PROXY], trustedHosts: ['dsh.example.com'] }

/** 假 req/res：只需要门禁读的那几个字段。 */
function exchange(remoteAddress, host, method = 'GET') {
  const req = { socket: { remoteAddress }, headers: { host }, method, url: '/' }
  const out = { status: 0, body: '' }
  const res = {
    writeHead(status) { out.status = status },
    end(text) { out.body = text || '' },
  }
  return { req, res, out }
}

test('默认配置不放松任何一道门', () => {
  const cfg = resolveConfig({})
  assert.deepEqual(cfg.trustedRemoteAddresses, [])
  assert.deepEqual(cfg.trustedHosts, [])
  assert.deepEqual(gatePolicyOf({ config: cfg }), LOOPBACK_ONLY)
  assert.match(remoteVerdict(PROXY) ?? '', /not a loopback address/)
  assert.match(hostVerdict(PUBLIC_HOST) ?? '', /not a localhost name/)
  assert.equal(remoteVerdict('127.0.0.1'), undefined)
  assert.equal(hostVerdict('localhost:3080'), undefined)
})

test('环境变量可兜底，逗号分隔且去空白', () => {
  const cfg = resolveConfig(null, {
    DSH_HOME: '/nonexistent',
    DSH_DREAM_TRUSTED_REMOTE_ADDRESSES: ' 10.0.0.9 , 10.0.0.10 ',
    DSH_DREAM_TRUSTED_HOSTS: 'Dsh.Example.com',
  })
  assert.deepEqual(cfg.trustedRemoteAddresses, ['10.0.0.9', '10.0.0.10'])
  assert.deepEqual(cfg.trustedHosts, ['dsh.example.com'])
})

test('显式配置优先于环境变量，空数组与空字符串关闭旧白名单', () => {
  const env = {
    DSH_DREAM_TRUSTED_REMOTE_ADDRESSES: '192.0.2.10',
    DSH_DREAM_TRUSTED_HOSTS: 'old.example.com',
  }
  for (const empty of [[], '', '  ', null]) {
    const cfg = resolveConfig({ trustedRemoteAddresses: empty, trustedHosts: empty }, env)
    assert.deepEqual(cfg.trustedRemoteAddresses, [])
    assert.deepEqual(cfg.trustedHosts, [])
  }
  const cfg = resolveConfig({ trustedRemoteAddresses: ['192.0.2.20'], trustedHosts: ['new.example.com'] }, env)
  assert.deepEqual(cfg.trustedRemoteAddresses, ['192.0.2.20'])
  assert.deepEqual(cfg.trustedHosts, ['new.example.com'])
})

test('白名单只做精确匹配：端口与大小写不敏感，IPv4-mapped 归一', () => {
  assert.equal(remoteVerdict(PROXY, OPEN), undefined)
  assert.equal(remoteVerdict('::ffff:' + PROXY, OPEN), undefined)
  assert.match(remoteVerdict('192.0.2.2', OPEN) ?? '', /not a loopback address/)
  assert.equal(hostVerdict(PUBLIC_HOST.toUpperCase(), OPEN), undefined)
  assert.equal(hostVerdict('dsh.example.com:8080', OPEN), undefined)
  assert.match(hostVerdict('evil.example.com', OPEN) ?? '', /not a localhost name/)
})

test('两项是「且」关系：只放行来源时 Host 门仍然拒绝', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-dream-peer-'))
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'dreams.jsonl'), JSON.stringify({
      id: 'dream-0', at: '2026-01-01T00:00:00.000Z', reflection: '白名单测试', lessons: [], mood: '平静',
    }) + '\n', 'utf8')

    const onlyRemote = createDreamWebHandler({ journalDir: dir, config: { trustedRemoteAddresses: [PROXY] } })
    const a = exchange(PROXY, PUBLIC_HOST)
    await onlyRemote(a.req, a.res)
    assert.equal(a.out.status, 403)
    assert.match(a.out.body, /not a localhost name/)

    // 反代把 Host 改写成本机名时，只配来源就够了（旧部署的常见做法）。
    const b = exchange(PROXY, '127.0.0.1:3080')
    await onlyRemote(b.req, b.res)
    assert.equal(b.out.status, 200)

    const both = createDreamWebHandler({ journalDir: dir, config: OPEN })
    const c = exchange(PROXY, PUBLIC_HOST)
    await both(c.req, c.res)
    assert.equal(c.out.status, 200)
    assert.equal(JSON.parse(c.out.body).dreams.length, 1)

    const stranger = exchange('192.0.2.9', PUBLIC_HOST)
    await both(stranger.req, stranger.res)
    assert.equal(stranger.out.status, 403)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
