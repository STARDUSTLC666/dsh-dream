import test from 'node:test'
import assert from 'node:assert/strict'
import { installDreamWeb, DREAM_ROUTE, DREAM_KNOWLEDGE_ROUTE, DREAM_BRIDGE_ROUTE } from '../lib/web.js'

function fixture(connection) {
  const routes = []
  const ctx = { inject(_names, callback) { callback({ connection, webServer: { register(route) { routes.push(route); return () => {} } }, effect(factory) { factory() } }) } }
  installDreamWeb(ctx, { journalDir: process.cwd() })
  return routes
}
function request() { return { method: 'GET', url: '/_dsh/dsh-dream/journal', headers: { host: 'localhost:5173' }, socket: { remoteAddress: '127.0.0.1' } } }
function response() { return { status: 0, writeHead(status) { this.status = status }, end() {} } }

test('every Dream webServer route rejects before backend on 401', async () => {
  const routes = fixture({ requestRejection() { return 401 } })
  assert.deepEqual(routes.map(r => r.path).sort(), [DREAM_BRIDGE_ROUTE, DREAM_KNOWLEDGE_ROUTE, DREAM_ROUTE].sort())
  for (const route of routes) { const res = response(); await route.handler(request(), res); assert.equal(res.status, 401) }
})

test('missing or throwing Connection fails closed with 403', async () => {
  const routes = fixture({ requestRejection() { throw new Error('contract failure') } })
  for (const route of routes) { const res = response(); await route.handler(request(), res); assert.equal(res.status, 403) }
})

test('Dream registers protected Fetch reads independently of the legacy HTTP server', async () => {
  const routes = new Map()
  const dispose = []
  const carrier = {
    register(route) {
      routes.set(route.path, route)
      return () => routes.delete(route.path)
    },
  }
  const ctx = {
    inject(names, callback) {
      if (names.length === 1 && names[0] === 'connection') callback({
        connection: { fetch: carrier },
        effect(factory) { dispose.push(factory()) },
      })
    },
  }
  installDreamWeb(ctx, { journalDir: process.cwd() })
  assert.deepEqual([...routes.keys()], [
    '/api/dsh-dream/journal', '/api/dsh-dream/knowledge', '/api/dsh-dream/bridge',
  ])
  for (const route of routes.values()) assert.deepEqual(route.methods, ['GET'])

  const journal = routes.get('/api/dsh-dream/journal')
  const url = 'http://localhost/api/dsh-dream/journal?limit=3'
  const fromPanel = await journal.fetch(new Request(url, { headers: { 'sec-fetch-site': 'same-origin' } }))
  assert.equal(fromPanel.status, 200)
  assert.equal(fromPanel.headers.get('cache-control'), 'no-store')
  assert.equal((await fromPanel.json()).limit, 3)
  const crossSite = await journal.fetch(new Request(url, { headers: { 'sec-fetch-site': 'cross-site' } }))
  assert.equal(crossSite.status, 403)
  const post = await journal.fetch(new Request(url, { method: 'POST' }))
  assert.equal(post.status, 405)
  dispose.forEach(release => release())
  assert.equal(routes.size, 0)
})
