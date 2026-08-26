/**
 * dsh-dream 配置解析：会话根目录、梦境日记目录与摘要上限。
 *
 * @module dsh-dream/config
 */
import { homedir } from 'node:os'
import { join } from 'node:path'

/** 已解析配置。 */
export interface ResolvedDreamConfig {
  /** 会话根目录（默认 ~/.dsh/sessions）。 */
  sessionsRoot: string
  /** 梦境日记目录（默认 ~/.dsh/.dsh-dream）。 */
  journalDir: string
  /** dream_digest 最多回放的会话数（1-50，默认 10）。 */
  maxSessions: number
  /** 每个会话摘要的最大字符数（500-50000，默认 6000）。 */
  maxCharsPerSession: number
  /** 每个会话最多保留的用户消息条数（1-20，默认 5）。 */
  maxUserMessages: number
  /** 梦原料入梦前是否做隐私脱敏（默认 true）。 */
  maskSecrets: boolean
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

function clamp(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** 解析并校验插件配置。 */
export function resolveConfig(raw?: Record<string, unknown> | null): ResolvedDreamConfig {
  const cfg = raw ?? {}
  const home = homedir()
  return {
    sessionsRoot: str(cfg.sessionsRoot, join(home, '.dsh', 'sessions')),
    journalDir: str(cfg.journalDir, join(home, '.dsh', '.dsh-dream')),
    maxSessions: clamp(cfg.maxSessions, 10, 1, 50),
    maxCharsPerSession: clamp(cfg.maxCharsPerSession, 6000, 500, 50000),
    maxUserMessages: clamp(cfg.maxUserMessages, 5, 1, 20),
    maskSecrets: cfg.maskSecrets !== false,
  }
}
