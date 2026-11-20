import { appendFileSync, closeSync, fstatSync, openSync, readSync } from 'node:fs';
/** Preserve an interrupted tail while giving the next record its own JSONL line. */
export function appendJsonLine(file, value) {
    const line = JSON.stringify(value) + '\n';
    const fd = openSync(file, 'a+', 0o600);
    try {
        const size = fstatSync(fd).size;
        const last = Buffer.allocUnsafe(1);
        const separator = size > 0 && readSync(fd, last, 0, 1, size - 1) === 1 && last[0] !== 10 ? '\n' : '';
        // Keep the separator and record in one append; do not rewrite earlier bytes.
        appendFileSync(fd, separator + line, 'utf8');
    }
    finally {
        closeSync(fd);
    }
}
