import { registerUpdates } from '@stardustlc/dsh-updates'
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
import { installDreamWeb } from './web.js'
import { installDreamActions } from './web-actions.js'
import { installAutomaticDream } from './automatic.js'
import { installSessionQueryBridge } from './session-source.js'
import { installDreamCommands } from './commands.js'

/** cordis 服务注入：要用 ctx.tools 与 ctx.skills。 */
export const name = 'dream'
export const inject = ['tools', 'skills']

/** 插件所需的最小 ctx 面。 */
export interface DreamPluginContext {
  tools: { register(definition: DreamToolDefinition): () => void }
  skills?: { register(definition: { name: string; description: string; content: string; resourceBase: { kind: 'directory'; path: string }; source?: string }): () => void }
  effect?(fn: () => (() => void) | void, label?: string): void
  logger?: { warn?(message: string): void }
  on?(event: string, listener: () => void): () => void
  /** cordis 的依赖注入（宿主必给；headless 测试夹具可能没有）。 */
  inject?(services: string[], callback: (scopedCtx: unknown) => void): void
}

/** 随包技能目录。 */
export function bundledSkillsDir(): string {
  return fileURLToPath(new URL('../skills/', import.meta.url))
}

/** 插件入口。 */
export function apply(ctx: DreamPluginContext, config?: Record<string, unknown> | null): void {
  registerUpdates(ctx, { name: "@stardustlc/dsh-dream" })

  let cfg: ResolvedDreamConfig
  try {
    cfg = resolveConfig(config)
  } catch (error) {
    const msg = '[dsh-dream] ' + (error instanceof Error ? error.message : String(error))
    if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(msg)
    else console.warn(msg)
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
      const msg = '[dsh-dream] 做梦协议技能加载失败：' + (error instanceof Error ? error.message : String(error))
      if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(msg)
      else console.warn(msg)
    }
  }
  // 面板同源路由与 DSH 原生桥接：宿主有 inject 才挂载；headless 夹具没有 inject 就跳过。
  if (typeof ctx.inject === 'function') {
    installDreamWeb(ctx, { journalDir: cfg.journalDir, config: cfg })
    installDreamActions(ctx, { config: cfg })
    installSessionQueryBridge(ctx)
    installDreamCommands(ctx, cfg)
  }
  installAutomaticDream(ctx, cfg)
  let disposed = false
  const disposeAll = () => {
    if (disposed) return
    disposed = true
    for (const dispose of disposers.splice(0).reverse()) dispose?.()
  }
  if (typeof ctx.effect === 'function') {
    ctx.effect(() => disposeAll, 'dsh-dream: lifecycle')
  }
  if (typeof ctx.on === 'function') {
    ctx.on('dispose', disposeAll)
  }
}

export * from './config.js'
export * from './sessions.js'
export * from './session-source.js'
export * from './journal.js'
export * from './tools.js'
export * from './mask.js'
export * from './bridge.js'
export * from './knowledge.js'
export * from './knowledge-store.js'
export * from './retrieval.js'
export * from './automatic.js'
export * from './commands.js'
export * from './dsh-signals.js'
export {
  isHumanAccepted,
  reviewDeadline,
  needsMemoryReview,
  needsObservationReview,
  simDirectory,
  memoryDirectory,
  type ObservationReviewSignal,
  type SimDirectoryUsableItem,
  type SimDirectoryHistoryItem,
  type SimDirectory,
} from './memory.js'
