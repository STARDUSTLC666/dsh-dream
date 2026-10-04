import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, utimesSync, statSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { KnowledgeStore } from '../lib/knowledge-store.js'
import { needsMemoryReview, reviewDeadline, memoryDirectory } from '../lib/memory.js'
import { retrieveLessons } from '../lib/retrieval.js'
function setup(t) {
  const root=mkdtempSync(join(process.cwd(),'.memory-test-')),store=new KnowledgeStore(root)
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  const make=(kind='preference',title='项目文档默认使用中文')=>store.createLesson({kind,title,action:title,when:'遇到与「'+title+'」对应的任务时',workspaceRoot:root,evidence:[{kind:'session',sessionId:title,recordSeq:11,summary:title,verification:'read',sourceHash:'f'.repeat(64)}]},'fixture-'+kind+'-'+title,{requireReview:true}).lesson
  return {root,store,make}
}
test('facts pause after the review deadline; retrieval and feedback never renew validation',t=>{
  const e=setup(t),created=e.make('fact'),accepted=e.store.reviewLesson(created.id,'accepted',created.revision,'accept-fact','human')
  const deadline=reviewDeadline(accepted)
  assert.equal(needsMemoryReview(accepted,deadline-1),false);assert.equal(needsMemoryReview(accepted,deadline),true)
  const result=retrieveLessons([accepted],e.store.listEvidence(),{query:'中文 文档',workspaceRoot:e.root,now:deadline})
  assert.equal(result.items.length,0);assert.equal(result.skipped[0].reason,'review-due')
  const feedback=e.store.recordFeedback(accepted.id,'useful','参考过一次',accepted.revision,'feedback-fact')
  assert.equal(reviewDeadline(feedback),deadline);assert.equal(feedback.lastValidatedAt,accepted.lastValidatedAt)
  const preference=e.make();const p=e.store.reviewLesson(preference.id,'accepted',preference.revision,'accept-preference','human')
  assert.equal(needsMemoryReview(p,deadline+86400000),false)
})
test('an explicit deadline requires re-review and a real review renews it',()=>{
  const row={state:'usable',kind:'fact',createdAt:'2026-01-01T00:00:00Z',reviewAfter:'2026-02-01T00:00:00Z',review:{decision:'accepted',at:'2026-01-01T00:00:00Z'}}
  assert.equal(needsMemoryReview(row,Date.parse('2026-02-02')),true)
  assert.equal(reviewDeadline({...row,review:{decision:'accepted',at:'2026-02-02T00:00:00Z'}}),Date.parse('2026-03-04T00:00:00Z'))
  assert.equal(reviewDeadline({...row,kind:'preference',review:{decision:'accepted',at:'2026-02-02T00:00:00Z'}}),undefined)
})
test('derived memory directory holds pointers and can be rebuilt without changing authorities',t=>{
  const e=setup(t),created=e.make(),row=e.store.reviewLesson(created.id,'accepted',created.revision,'accept-directory','human')
  const before=readFileSync(join(e.root,'events.jsonl'),'utf8')
  const directory=memoryDirectory([row],e.store.listEvidence())
  assert.equal(directory.summary[0].lessonId,row.id);assert.equal(directory.entries[0].sources[0].recordSeq,11)
  assert.equal(directory.entries[0].revision,row.revision);assert.equal(readFileSync(join(e.root,'events.jsonl'),'utf8'),before)
  assert.deepEqual(JSON.parse(readFileSync(join(e.root,'index.json'),'utf8')).memory,directory)
})
test('immutable snapshots invalidate on feedback, review, corruption and atomic replacement',t=>{
  const e=setup(t),row=e.make(),first=e.store.readSnapshot()
  assert.equal(e.store.readSnapshot(),first);assert.throws(()=>first.lessons.push(row),TypeError)
  e.store.reviewLesson(row.id,'accepted',row.revision,'snapshot-accept','human')
  const accepted=e.store.readSnapshot();assert.notEqual(accepted.sourceKey,first.sourceKey)
  e.store.recordFeedback(row.id,'useful','已用于参考',accepted.lessons[0].revision,'snapshot-feedback')
  assert.notEqual(e.store.readSnapshot().sourceKey,accepted.sourceKey)
  const path=join(e.root,'events.jsonl'),text=readFileSync(path,'utf8'),time=statSync(path)
  writeFileSync(path,text.replaceAll('项目文档默认使用中文','项目文档默认使用英文'));utimesSync(path,time.atime,time.mtime)
  assert.equal(e.store.readSnapshot().lessons[0].title,'项目文档默认使用英文')
  writeFileSync(path+'.tmp','{broken\n');renameSync(path+'.tmp',path)
  assert.ok(e.store.readSnapshot().badLines>0);assert.equal(e.store.readSnapshot().lessons.length,0)
})
test('batch human review is atomic, idempotent, bounded by candidate scope and revision',t=>{
  const e=setup(t),a=e.make('preference','项目文档使用中文'),b=e.make('preference','项目说明写清条件')
  const before=readFileSync(join(e.root,'events.jsonl'),'utf8')
  assert.throws(()=>e.store.updateLessonsBatch([{id:a.id,patch:{},expectedRevision:a.revision},{id:b.id,patch:{},expectedRevision:b.revision+1}],'bad-batch','accepted'),/revision|期望/)
  assert.equal(readFileSync(join(e.root,'events.jsonl'),'utf8'),before)
  const updates=[a,b].map(row=>({id:row.id,patch:{},expectedRevision:row.revision}))
  const result=e.store.updateLessonsBatch(updates,'human-batch','accepted')
  assert.equal(result.length,2);assert.ok(result.every(row=>row.state==='usable'&&row.review.actor==='human'))
  assert.deepEqual(e.store.updateLessonsBatch(updates,'human-batch','accepted'),result)
  const c=e.make('procedure','项目操作流程'),d=e.make('preference','另一个偏好')
  assert.throws(()=>e.store.updateLessonsBatch([c,d].map(row=>({id:row.id,patch:{},expectedRevision:row.revision})),'mixed-batch','accepted'),/主题/)
  assert.equal(e.store.getLesson(c.id).state,'candidate')
})
test('unchanged size and timestamps cannot hide a middle-file edit behind an old index',t=>{
  const e=setup(t);e.make()
  const path=join(e.root,'events.jsonl')
  writeFileSync(path,'\n'.repeat(70000)+readFileSync(path,'utf8')+'\n'.repeat(70000))
  const before=e.store.readSnapshot(),time=statSync(path),bytes=readFileSync(path,'utf8')
  writeFileSync(path,bytes.replaceAll('项目文档默认使用中文','项目文档默认使用英文'))
  utimesSync(path,time.atime,time.mtime)
  const next=new KnowledgeStore(e.root).readSnapshot()
  assert.equal(statSync(path).size,Buffer.byteLength(bytes));assert.notEqual(next.sourceKey,before.sourceKey)
  assert.equal(next.lessons[0].title,'项目文档默认使用英文');assert.equal(next.complete,true)
})
