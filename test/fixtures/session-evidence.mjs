import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** 旧用例原来只传 read 声明；现在明确建立对应的官方 v4 可见会话记录。 */
export function seedSessionEvidence(cfg, evidence, scope = {}) {
  for (const item of evidence ?? []) {
    if (item.verification !== 'read' || item.kind === 'local-artifact' || !item.sessionId || item.recordSeq === undefined) continue
    const dir = join(cfg.sessionsRoot, scope.projectId ?? 'fixture-project', item.sessionId)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'session.v4.jsonl'), [
      { type: 'session', version: 4, id: item.sessionId, cwd: scope.workspaceRoot ?? cfg.sessionsRoot },
      { type: 'user/message', seq: item.recordSeq, data: { source: { kind: 'user' }, content: [{ type: 'text', text: item.quote ?? item.summary }] } },
    ].map(JSON.stringify).join('\n') + '\n')
  }
}
