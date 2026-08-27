/**
 * dsh-dream 配置解析：会话根目录、梦境日记目录与摘要上限。
 *
 * @module dsh-dream/config
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
function str(value, fallback) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}
function clamp(value, fallback, min, max) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
}
/** 解析并校验插件配置。 */
export function resolveConfig(raw) {
    const cfg = raw ?? {};
    const home = homedir();
    return {
        sessionsRoot: str(cfg.sessionsRoot, join(home, '.dsh', 'sessions')),
        journalDir: str(cfg.journalDir, join(home, '.dsh', '.dsh-dream')),
        maxSessions: clamp(cfg.maxSessions, 10, 1, 50),
        maxCharsPerSession: clamp(cfg.maxCharsPerSession, 6000, 500, 50000),
        maxUserMessages: clamp(cfg.maxUserMessages, 5, 1, 20),
        maskSecrets: cfg.maskSecrets !== false,
    };
}
