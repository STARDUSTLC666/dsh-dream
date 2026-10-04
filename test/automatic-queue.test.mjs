import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { MemoryQueue } from '../lib/automatic-queue.js'
import { readAutomaticState, updateAutomaticState } from '../lib/automatic-state.js'
import { resolveConfig } from '../lib/config.js'
function setup(t, extra = {}) {
  const root = mkdtempSync(join(process.cwd(), '.queue-test-'))
  const cfg = resolveConfig({ journalDir:root, autoIdleMs:60000, autoCooldownMs:1000, ...extra })
  let now = Date.now(), canRun = true, calls = [], result = async () => ({reason:'saved',saved:1})
  const make = () => new MemoryQueue(cfg,()=>now,()=>canRun,async (rows,signal)=>{calls.push(rows);return result(rows,signal)})
  let queue = make()
  const row = (id, cwd = 'E:/workspace/project') => ({key:'key-'+id,sessionId:'session-'+id,cwd,endSeq:20,createdAt:now,readyAt:now+cfg.autoIdleMs,provider:'fixture',model:'fixture',sources:[{seq:11,role:'user',text:'记住，我更喜欢有条件和例外的可核对经验。',hash:'f'.repeat(64)},{seq:12,role:'assistant',text:'已保留明确条件，等待之后的人工审阅。',hash:'a'.repeat(64)}]})
  t.after(()=>{queue.stop();rmSync(root,{recursive:true,force:true})})
  return {cfg,row,get queue(){return queue},calls,advance:ms=>{now+=ms},busy:value=>{canRun=value},setResult:fn=>{result=fn},restart:()=>{queue.stop();queue=make()},state:()=>readAutomaticState(cfg,now)}
}
test('quiet completed turns merge once, keep original source pointers and never merge projects', async t=>{
  const e=setup(t)
  e.queue.enqueue(e.row('one'));e.queue.enqueue(e.row('two'));e.queue.enqueue(e.row('three','E:/workspace/other'))
  await e.queue.whenIdle();assert.equal(e.calls.length,0)
  e.advance(60001);e.queue.kick();await e.queue.whenIdle()
  assert.equal(e.calls.length,1);assert.equal(e.calls[0].length,2)
  assert.equal(e.calls[0][0].sources[0].seq,11)
  assert.equal(e.state().pending.length,1)
  e.advance(1001);e.queue.kick();await e.queue.whenIdle()
  assert.equal(e.calls.length,2);assert.equal(e.calls[1][0].cwd,'E:/workspace/other')
})
test('cooldown and daily limits defer instead of forgetting; restart retains pending and deduplicates', async t=>{
  const e=setup(t,{autoMaxCallsPerDay:1})
  e.queue.enqueue(e.row('one'));e.advance(60001);e.queue.kick();await e.queue.whenIdle()
  const next=e.row('two');e.queue.enqueue(next);e.queue.enqueue(next)
  e.restart();e.advance(60001);e.queue.kick();await e.queue.whenIdle()
  assert.equal(e.calls.length,1);assert.equal(e.state().calls,1);assert.equal(e.state().pending.length,1)
  updateAutomaticState(e.cfg,s=>{s.day='2000-01-01'})
  e.queue.kick();await e.queue.whenIdle()
  assert.equal(e.calls.length,2);assert.equal(e.state().pending.length,0)
})
test('main-task priority prevents flush and cancelled extraction retains unfinished inputs', async t=>{
  const e=setup(t)
  e.queue.enqueue(e.row('one'));e.busy(false);e.queue.flush();await e.queue.whenIdle()
  assert.equal(e.calls.length,0)
  let entered
  const started=new Promise(resolve=>{entered=resolve})
  e.setResult(async (rows,signal)=>{entered();await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('cancelled')),{once:true}));return {reason:'saved',saved:1}})
  e.busy(true);e.advance(60001);e.queue.kick();await started
  e.busy(false);e.queue.touch();await e.queue.whenIdle()
  assert.equal(e.state().pending.length,1);assert.equal(e.state().pending[0].lease,undefined)
  assert.equal(e.state().calls,1);assert.equal(e.state().last.reason,'cancelled')
})
test('capacity preserves leased work and expired excerpts are cleared even with no budget', async t=>{
  const e=setup(t,{autoCollect:false})
  for(let i=0;i<32;i++)e.queue.enqueue(e.row(String(i)))
  updateAutomaticState(e.cfg,s=>{s.pending[0].lease={job:'active',pid:process.pid,until:Date.now()+60000};s.calls=4})
  e.queue.enqueue(e.row('new'))
  assert.equal(e.state().pending.length,32);assert.equal(e.state().pending[0].sessionId,'session-0');assert.equal(e.state().overflow,1)
  e.advance(86400001);e.queue.kick();assert.equal(e.state().pending.length,0);assert.equal(e.state().expired,32)
})
test('dead worker leases recover under the original shared budget',async t=>{
  const e=setup(t)
  e.queue.enqueue(e.row('one'))
  updateAutomaticState(e.cfg,s=>{s.pending[0].lease={job:'dead-owner',pid:2147483647,until:Date.now()+999999}})
  e.advance(60001);e.queue.kick();await e.queue.whenIdle()
  assert.equal(e.calls.length,1);assert.equal(e.state().pending.length,0);assert.equal(e.state().calls,1)
})
