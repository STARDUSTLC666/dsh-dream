/** Small, fail-closed persistent budget and cursor, shared across host processes. */
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
export function budgetDay(now) {
    const date = new Date(now);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function readAutomaticState(cfg, now = Date.now()) {
    const file = join(cfg.journalDir, 'automatic', 'state.json');
    if (!existsSync(file))
        return { version: 1, day: budgetDay(now), calls: 0, cursors: {} };
    if (statSync(file).size > 128 * 1024)
        throw new Error('automatic-state-invalid');
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    if (raw?.version !== 1 || typeof raw.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.day)
        || !Number.isSafeInteger(raw.calls) || raw.calls < 0 || raw.calls > 100000
        || raw.cursors === null || typeof raw.cursors !== 'object' || Array.isArray(raw.cursors)
        || Object.keys(raw.cursors).length > 128
        || Object.entries(raw.cursors).some(([key, value]) => !/^[a-f0-9]{24}$/.test(key) || !Number.isSafeInteger(value) || Number(value) < 0)
        || (raw.enabled !== undefined && typeof raw.enabled !== 'boolean')
        || (raw.retrievalEnabled !== undefined && typeof raw.retrievalEnabled !== 'boolean')
        || (raw.lastAttemptAt !== undefined && (!Number.isSafeInteger(raw.lastAttemptAt) || raw.lastAttemptAt < 0))
        || (raw.last !== undefined && (!Number.isSafeInteger(raw.last.at) || typeof raw.last.reason !== 'string' || raw.last.reason.length > 80 || !Number.isSafeInteger(raw.last.saved) || raw.last.saved < 0 || (raw.last.job !== undefined && typeof raw.last.job !== 'string')))) {
        throw new Error('automatic-state-invalid');
    }
    return raw;
}
/** No waiting on a live lock: observing a turn must never stall its owner. */
export function updateAutomaticState(cfg, update, now = Date.now()) {
    const dir = join(cfg.journalDir, 'automatic');
    mkdirSync(dir, { recursive: true });
    const lock = join(dir, '.lock');
    let descriptor;
    try {
        descriptor = openSync(lock, 'wx');
    }
    catch (error) {
        if (error.code !== 'EEXIST')
            throw error;
        // Reclaim only a demonstrably dead owner, never by age alone.
        try {
            const owner = JSON.parse(readFileSync(lock, 'utf8'));
            if (!Number.isSafeInteger(owner.pid) || owner.pid < 1 || now - statSync(lock).mtimeMs < 30000)
                throw new Error('automatic-storage-busy');
            try {
                process.kill(owner.pid, 0);
                throw new Error('automatic-storage-busy');
            }
            catch (failure) {
                if (failure.code !== 'ESRCH')
                    throw new Error('automatic-storage-busy');
            }
            unlinkSync(lock);
            descriptor = openSync(lock, 'wx');
        }
        catch {
            throw new Error('automatic-storage-busy');
        }
    }
    const temporary = join(dir, 'state-' + randomUUID() + '.tmp');
    try {
        writeFileSync(descriptor, JSON.stringify({ pid: process.pid }));
        const state = readAutomaticState(cfg, now);
        const result = update(state);
        writeFileSync(temporary, JSON.stringify(state) + '\n', { flag: 'wx' });
        renameSync(temporary, join(dir, 'state.json'));
        return result;
    }
    finally {
        closeSync(descriptor);
        unlinkSync(lock);
        if (existsSync(temporary))
            unlinkSync(temporary);
    }
}
