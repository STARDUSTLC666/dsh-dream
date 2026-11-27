/**
 * 隐私脱敏：梦原料与经验入库前对密钥/令牌/凭据打码。
 * 覆盖常见半角与全角绕过写法、Bearer 头、PEM 私钥块与连接串凭据，
 * 宁可保守避免误伤正常文本与 Dream 引用 ID。
 *
 * @module dsh-dream/mask
 */
const FW_WORD_CHARS = 'A-Za-z0-9Ａ-Ｚａ-ｚ０-９';
const FW_CRED_VAL = '[^\\s"\'&},，。;；\\])]{6,}';
/** 已知密钥/令牌模式。 */
export const SECRET_PATTERNS = [
    { re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g, label: '疑似私钥' },
    { re: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{16,}/g, label: '疑似 sk 密钥' },
    { re: /(?<![A-Za-z0-9Ａ-Ｚａ-ｚ０-９])[sｓ][kｋ][-－][A-Za-z0-9Ａ-Ｚａ-ｚ０-９_＿\-－]{16,}/gi, label: '疑似 sk 密钥' },
    { re: /(?<![A-Za-z0-9])(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{16,}/g, label: '疑似 GitHub 令牌' },
    { re: /(?<![A-Za-z0-9])github_pat_[A-Za-z0-9_]{16,}/g, label: '疑似 GitHub 细粒度令牌' },
    { re: /(?<![A-Za-z0-9])gsk_[A-Za-z0-9]{16,}/g, label: '疑似 Groq 密钥' },
    { re: /(?<![A-Za-z0-9])hf_[A-Za-z0-9]{20,}/g, label: '疑似 HuggingFace 令牌' },
    { re: /(?<![A-Za-z0-9])npm_[A-Za-z0-9]{20,}/g, label: '疑似 npm 令牌' },
    { re: /(?<![A-Za-z0-9])AIza[0-9A-Za-z_-]{30,}/g, label: '疑似 Google API 密钥' },
    { re: /(?<![A-Za-z0-9])xox[baprs]-[A-Za-z0-9-]{10,}/g, label: '疑似 Slack 令牌' },
    { re: /(?<![A-Za-z0-9])AKIA[0-9A-Z]{16}/g, label: '疑似 AWS 访问密钥' },
    { re: /(?<![A-Za-z0-9])eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{8,})?/g, label: '疑似 JWT' },
];
/** Bearer 鉴权头：保留前缀，仅对令牌本体打码。 */
const BEARER_TOKEN = /\b(Bearer\s+)([A-Za-z0-9._~+/=-]{16,})/gi;
/** Basic 鉴权头：仅在 Authorization 上下文中对 Base64 凭据打码，避免误伤普通英文 "basic ..."。 */
const BASIC_AUTH_TOKEN = /\b(Authorization\s*:\s*Basic\s+)([A-Za-z0-9+/=]{8,})/gi;
/** 连接串内嵌凭据：http(s)/ftp(s)/postgres/mysql/mongodb/redis/amqp://[user]:pass@host。 */
const URI_CRED = /((?:https?|ftps?|postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqp|amqps):\/\/[^:\s/@]*:)([^@\s/]{4,})(@)/gi;
/** 凭据赋值模式：支持未加引号与引号包裹（含带空格的口令/JSON/YAML/.env）、前缀环境变量（DB_PASSWORD/JWT_SECRET/ACCESS_TOKEN）与全角绕过写法。 */
const CRED_ASSIGN = new RegExp(`(?<![${FW_WORD_CHARS}])((?:[A-Za-z0-9_Ａ-Ｚａ-ｚ０-９＿\\-－]{0,24}[_＿\\-－])?(?:[pｐ][aａ][sｓ][sｓ][wｗ][oｏ][rｒ][dｄ]|[pｐ][aａ][sｓ][sｓ][wｗ][dｄ]|[sｓ][eｅ][cｃ][rｒ][eｅ][tｔ]|[tｔ][oｏ][kｋ][eｅ][nｎ]|[aａ][pｐ][iｉ][_＿\\-－]?[kｋ][eｅ][yｙ]))(["']?\\s*[:=：＝]\\s*)(?:"([^"\\r\\n]{6,160})"|'([^'\\r\\n]{6,160})'|(${FW_CRED_VAL}))`, 'gi');
const UNQUOTED_CODE_TYPES = new Set([
    'string', 'number', 'boolean', 'undefined', 'unknown', 'never', 'object', 'record', 'promise', 'symbol', 'bigint', 'readonly', 'optional', 'required',
]);
/** 超长高熵串：40+ 位字母数字混合（含大小写或数字）。 */
const LONG_TOKEN = /(?<![A-Za-z0-9])[A-Za-z0-9_\-+/=]{40,}(?![A-Za-z0-9])/g;
const PATH_EXT_TAIL = /^\.(?:[cm]?[jt]sx?|json|jsonl|md|yml|yaml|py|rs|go|css|html|txt|zstd|lock|sh|ps1)(?![A-Za-z0-9_])/i;
const UUID_SEGMENT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const READABLE_PATH_SEGMENT_RE = /^[a-z][a-z0-9_-]{1,30}$/;
const DREAM_REFERENCE_RE = /\b(?:(?:lsn|evd|evt|brg)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|pvw_[0-9a-f]{24})\b/gi;
function looksHighEntropy(text) {
    return /[a-z]/.test(text) && (/[A-Z]/.test(text) || /[0-9]/.test(text));
}
function looksLikePath(text, leading, trailing) {
    if (!text.includes('/') || /[+=]/.test(text))
        return false;
    const segments = text.split('/').filter((seg) => seg !== '');
    if (segments.some((seg) => !UUID_SEGMENT_RE.test(seg) && seg.length >= 32 && looksHighEntropy(seg)))
        return false;
    const slashCount = (text.match(/\//g) ?? []).length;
    if (slashCount >= 3 && PATH_EXT_TAIL.test(trailing))
        return true;
    if (slashCount >= 2 && /(?:^|\/)(?:packages|node_modules|src|lib|test|tests|docs|scripts|Users)\//i.test(text))
        return true;
    if (slashCount >= 3 && /(?:\/|\\|\.|[a-zA-Z]:\/)$/.test(leading)) {
        const readableCount = segments.filter((seg) => READABLE_PATH_SEGMENT_RE.test(seg)).length;
        if (readableCount >= 2)
            return true;
    }
    return false;
}
function alreadyMaskedValue(value) {
    return value.startsWith('[已脱敏');
}
function alreadyMaskedQuoted(value) {
    return /^\[已脱敏[^\]]*\]$/.test(value.trim());
}
/** 对文本做脱敏；无命中时原样返回。 */
export function maskSecrets(text, publicReferences = []) {
    let out = text;
    for (const { re, label } of SECRET_PATTERNS) {
        out = out.replace(re, '[已脱敏·' + label + ']');
    }
    out = out.replace(URI_CRED, (_m, prefix, secret, at) => (alreadyMaskedValue(secret) ? _m : prefix + '[已脱敏·连接凭据]' + at));
    out = out.replace(BEARER_TOKEN, (_m, prefix, token) => (alreadyMaskedValue(token) ? _m : prefix + '[已脱敏·Bearer 令牌]'));
    out = out.replace(BASIC_AUTH_TOKEN, (_m, prefix, token) => (alreadyMaskedValue(token) ? _m : prefix + '[已脱敏·Basic 凭据]'));
    out = out.replace(CRED_ASSIGN, (full, key, sep, dqVal, sqVal, bareVal) => {
        const quote = dqVal !== undefined ? '"' : sqVal !== undefined ? "'" : undefined;
        const val = dqVal ?? sqVal ?? bareVal;
        if (typeof val !== 'string' || val.trim() === '')
            return full;
        if (quote !== undefined ? alreadyMaskedQuoted(val) : alreadyMaskedValue(val))
            return full;
        if (quote === undefined && UNQUOTED_CODE_TYPES.has(val.toLowerCase()))
            return full;
        return quote !== undefined ? key + sep + quote + '[已脱敏·凭据]' + quote : key + sep + '[已脱敏·凭据]';
    });
    const references = new Set(publicReferences.filter(isDreamReference));
    out = out.replace(LONG_TOKEN, (m, offset, source) => {
        if (references.has(m) || !looksHighEntropy(m))
            return m;
        const leading = source.slice(Math.max(0, offset - 4), offset);
        const trailing = source.slice(offset + m.length);
        return looksLikePath(m, leading, trailing) ? m : '[已脱敏·长令牌]';
    });
    return out;
}
/** 供测试或审计检查的两宽词字符集导出（内部辅助）。 */
export const MASK_WORD_CHARS = FW_WORD_CHARS;
/** 只认可插件生成的引用形状；不得把任意 *Id / *Hash 字段当作脱敏豁免。 */
export function isDreamReference(value) {
    return /^(?:lsn|evd|evt|brg)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
        || /^pvw_[0-9a-f]{24}$/i.test(value);
}
/** 提取文本中的合法 Dream 公共引用 ID，供显式调用方传入 `maskSecrets(text, refs)` 避免误伤。 */
export function extractDreamReferences(text) {
    const matches = text.match(DREAM_REFERENCE_RE);
    return matches === null ? [] : [...new Set(matches)];
}
