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
/** 字符串列表：缺失时回落；显式空值保持空，避免重新启用环境变量中的旧白名单。 */
function list(value, fallback) {
    const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null;
    if (raw === null)
        return value === undefined ? fallback : [];
    const out = [];
    for (const item of raw) {
        if (typeof item !== 'string')
            continue;
        const text = item.trim().toLowerCase();
        if (text !== '' && !out.includes(text))
            out.push(text);
    }
    return out;
}
function clamp(value, fallback, min, max) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
}
/** 解析并校验插件配置。 */
export function resolveConfig(raw, env = process.env) {
    const cfg = raw ?? {};
    const dshHome = str(env.DSH_HOME, join(homedir(), '.dsh'));
    return {
        sessionsRoot: str(cfg.sessionsRoot, join(dshHome, 'sessions')),
        journalDir: str(cfg.journalDir, join(dshHome, '.dsh-dream')),
        maxSessions: clamp(cfg.maxSessions, 10, 1, 50),
        maxCharsPerSession: clamp(cfg.maxCharsPerSession, 6000, 500, 50000),
        maxUserMessages: clamp(cfg.maxUserMessages, 5, 1, 20),
        maskSecrets: cfg.maskSecrets !== false,
        autoCollect: cfg.autoCollect !== false,
        autoRetrieve: cfg.autoRetrieve !== false,
        autoMaxCallsPerDay: clamp(cfg.autoMaxCallsPerDay, 4, 1, 20),
        autoCooldownMs: clamp(cfg.autoCooldownMs, 600000, 1000, 3600000),
        autoMinToolCalls: clamp(cfg.autoMinToolCalls, 2, 1, 50),
        autoMaxInputChars: clamp(cfg.autoMaxInputChars, 12000, 1000, 20000),
        autoMaxOutputTokens: clamp(cfg.autoMaxOutputTokens, 1200, 200, 2000),
        autoTimeoutMs: clamp(cfg.autoTimeoutMs, 30000, 1000, 60000),
        autoIdleMs: clamp(cfg.autoIdleMs, 60000, 0, 3600000),
        trustedRemoteAddresses: list(cfg.trustedRemoteAddresses, list(env.DSH_DREAM_TRUSTED_REMOTE_ADDRESSES, [])),
        trustedHosts: list(cfg.trustedHosts, list(env.DSH_DREAM_TRUSTED_HOSTS, [])),
    };
}
