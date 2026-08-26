/**
 * dsh-dream —— 做梦插件：会话回放（梦原料）→ 反思 → 梦境日记（记忆巩固）。
 *
 * @module dsh-dream
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { resolveConfig, type ResolvedDreamConfig } from './config.js'
import { buildDreamTools, type DreamToolDefinition } from './tools.js'

/** cordis 服务注入：要用 ctx.tools 与 ctx.skills。 */
export const name = 'dream'
export const inject = ['tools', 'skills']

/** 插件所需的最小 ctx 面。 */
export interface DreamPluginContext {
  tools: { register(definition: DreamToolDefinition): () => void }
  skills?: { register(definition: { name: string; description: string; content: string; resourceBase: { kind: 'directory'; path: string }; source?: string }): () => void }
  on?(event: string, listener: () => void): () => void
}

/** 随包技能目录。 */
export function bundledSkillsDir(): string {
  return fileURLToPath(new URL('../skills/', import.meta.url))
}

/** 插件入口。 */
export function apply(ctx: DreamPluginContext, config?: Record<string, unknown> | null): void {
  let cfg: ResolvedDreamConfig
  try {
    cfg = resolveConfig(config)
  } catch (error) {
    console.warn('[dsh-dream] ' + (error instanceof Error ? error.message : String(error)))
    cfg = resolveConfig(null)
  }

  const disposers: Array<() => void> = []
  for (const definition of buildDreamTools(cfg)) {
    disposers.push(ctx.tools.register(definition))
  }
  // 注册做梦协议技能（文件缺失只告警，不阻断）
  if (typeof ctx.skills?.register === 'function') {
    try {
      const dir = join(bundledSkillsDir(), 'dream-protocol')
      const text = readFileSync(join(dir, 'SKILL.md'), 'utf8')
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
      let description = '做梦协议：会话回放、反思与梦境日记。'
      if (match !== null) {
        const descMatch = /description:\s*(.+)/.exec(match[1])
        if (descMatch !== null) description = descMatch[1].trim()
      }
      disposers.push(ctx.skills.register({
        name: 'dream-protocol',
        description,
        content: match !== null ? text.slice(match[0].length).trimStart() : text,
        resourceBase: { kind: 'directory', path: dir },
        source: 'runtime',
      }))
    } catch (error) {
      console.warn('[dsh-dream] 做梦协议技能加载失败：' + (error instanceof Error ? error.message : String(error)))
    }
  }
  if (typeof ctx.on === 'function') {
    ctx.on('dispose', () => {
      for (const dispose of disposers) dispose()
    })
  }
}

export * from './config.js'
export * from './sessions.js'
export * from './journal.js'
export * from './tools.js'
