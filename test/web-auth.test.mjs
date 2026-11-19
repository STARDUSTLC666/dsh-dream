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
