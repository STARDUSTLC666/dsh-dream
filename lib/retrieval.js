import { normalizeLessonText, normalizeRelativeLessonFile } from './knowledge.js';
import { reviewDeadline } from './memory.js';
/** 默认条数。 */
export const DEFAULT_RETRIEVAL_LIMIT = 5;
/** 条数硬上限。 */
export const MAX_RETRIEVAL_LIMIT = 20;
/** 默认字符预算。 */
export const DEFAULT_RETRIEVAL_MAX_CHARS = 3000;
/** 字符预算硬上限。 */
export const MAX_RETRIEVAL_MAX_CHARS = 20000;
const EXCLUDED_STATE_REASONS = {
    rejected: 'state:rejected',
    stale: 'state:stale',
    disputed: 'state:disputed',
};
const EMPTY_FIELD = {
    exactTf: new Map(),
    stemTf: new Map(),
    cjkTf: new Map(),
    length: 0,
    flat: '',
};
const lessonTokenCache = new WeakMap();
const evidenceTokenCache = new WeakMap();
function trimmed(value) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}
function normalizeText(value) {
    return normalizeLessonText(value).toLowerCase();
}
function oneLine(value) {
    return value.replace(/\s+/g, ' ').trim();
}
function clip(value, max) {
    return value.length > max ? value.slice(0, max) + '…' : value;
}
/** 在预算内截断（含省略号占用）；conditions/exceptions 不走这里。 */
function clipTo(text, max) {
    if (max <= 0)
        return '';
    if (text.length <= max)
        return text;
    if (max === 1)
        return '…';
    return text.slice(0, max - 1) + '…';
}
function pathKey(value) {
    return value.trim().replace(/\\/g, '/').replace(/\/+$/, '');
}
function samePath(a, b) {
    const ka = pathKey(a);
    const kb = pathKey(b);
    if (ka === '' || kb === '')
        return false;
    const windowsLike = /^[a-zA-Z]:/.test(ka) || /^[a-zA-Z]:/.test(kb) || a.includes('\\') || b.includes('\\');
    return windowsLike ? ka.toLowerCase() === kb.toLowerCase() : ka === kb;
}
/** 查询侧范围文案（面板与 dream_context 共用）。 */
export function queryScopeLabel(q) {
    const project = trimmed(q.projectId);
    const workspace = trimmed(q.workspaceRoot);
    if (project !== undefined && workspace !== undefined)
        return '项目 ' + project + '（工作区 ' + workspace + '）';
    if (project !== undefined)
        return '项目 ' + project;
    if (workspace !== undefined)
        return '工作区 ' + workspace;
    return '全局';
}
/** 经验范围文案（面板与 dream_context 共用）。 */
export function lessonScopeLabel(scope) {
    if (scope.global === true)
        return '全局';
    const project = trimmed(scope.projectId);
    const workspace = trimmed(scope.workspaceRoot);
    if (project !== undefined && workspace !== undefined)
        return '项目 ' + project + '（工作区 ' + workspace + '）';
    if (project !== undefined)
        return '项目 ' + project;
    if (workspace !== undefined)
        return '工作区 ' + workspace;
    return '未限定范围';
}
/** 证据摘要（面板与 dream_context 共用）：独立支持数 + 已读/仅声明 + 脱敏摘要片段。 */
export function buildEvidenceSummary(lesson, evidence) {
    return createEvidenceSummarizer(evidence)(lesson);
}
/** 一次查询共用证据索引；保持重复 ID 后者覆盖与引用顺序的摘要规则。 */
export function createEvidenceSummarizer(evidence) {
    const byId = indexEvidenceById(evidence);
    return (lesson) => summarizeEvidence(lesson, byId);
}
function indexEvidenceById(evidence) {
    const byId = new Map();
    for (const item of evidence) {
        if (item !== null && typeof item === 'object' && typeof item.id === 'string')
            byId.set(item.id, item);
    }
    return byId;
}
function summarizeEvidence(lesson, byId) {
    const linked = [];
    for (const id of lesson.evidenceIds) {
        const found = byId.get(id);
        if (found !== undefined)
            linked.push(found);
    }
    if (linked.length === 0) {
        if (lesson.evidenceIds.length > 0)
            return '证据暂不可核对（' + lesson.evidenceIds.length + ' 条引用缺失）';
        return '无证据（仅候选，不可作为已证实结论）';
    }
    const read = linked.filter((e) => e.verification === 'read').length;
    const claimed = linked.filter((e) => e.verification === 'claimed').length;
    const head = '独立证据 ' + lesson.independentSupportCount + ' 条（已读 ' + read + ' / 仅声明 ' + claimed + '）';
    const snippets = linked
        .slice(0, 2)
        .map((e) => clip(oneLine(String(e.summary ?? '')), 80))
        .filter((s) => s !== '');
    if (snippets.length === 0)
        return head;
    return head + '：' + snippets.join('；') + (linked.length > 2 ? ' 等' : '');
}
/** essential 成本：title/when/action/exceptions/scopeLabel，永不截断（R4）。 */
export function essentialLessonChars(item) {
    let total = item.title.length + item.when.length + item.action.length + item.scopeLabel.length;
    for (const exception of item.exceptions)
        total += exception.length;
    return total;
}
/** metadata 成本：whyRelevant/evidenceSummary，预算紧时可截断（R4）。 */
export function metadataLessonChars(item) {
    return item.whyRelevant.length + item.evidenceSummary.length;
}
/** 单条结果的完整字符成本（与 dream_context.budget.usedChars 同口径）。 */
export function retrievedLessonChars(item) {
    return essentialLessonChars(item) + metadataLessonChars(item);
}
/**
 * rank inversion 指标（R4）：被 budget-stop 跳过、且排在某个已返回条目之前的条目数。
 * 按排名整条装入的预算策略必须让它恒为 0。
 */
export function rankInversionCount(rankedLessonIds, result) {
    const rank = new Map();
    rankedLessonIds.forEach((id, index) => { if (!rank.has(id))
        rank.set(id, index); });
    const returnedRanks = [];
    for (const item of result.items) {
        const index = rank.get(item.lessonId);
        if (index !== undefined)
            returnedRanks.push(index);
    }
    if (returnedRanks.length === 0)
        return 0;
    const lastReturned = Math.max(...returnedRanks);
    let inversions = 0;
    for (const entry of result.skipped) {
        if (entry.reason !== 'budget-stop' && entry.reason !== 'budget')
            continue;
        const index = rank.get(entry.lessonId);
        if (index !== undefined && index < lastReturned)
            inversions += 1;
    }
    return inversions;
}
const SKIPPED_REASON_LABELS = {
    'state:rejected': '已驳回',
    'state:stale': '已过期（待复核）',
    'state:disputed': '冲突未解决',
    'candidate-hold': '候选未审阅（默认不注入）',
    'no-evidence': '无独立证据',
    'version-mismatch': '版本条件不匹配',
    'platform-mismatch': '平台条件不匹配',
    'review-due': '已到复核时间',
    limit: '超出条数上限',
    'budget-stop': '预算放不下',
    budget: '预算放不下（旧值）',
};
/** skipped.reason 的中文标签（面板与工具共用；未知 reason 原样返回）。 */
export function skippedReasonLabel(reason) {
    return SKIPPED_REASON_LABELS[reason] ?? reason;
}
/**
 * 浏览态（无 query 上下文）下一条经验的确定性扣留原因；usable 返回 undefined。
 * 与 retrieveLessons 的优先级一致：no-evidence 先于 candidate-hold；version-mismatch 需 query/包名，不适用。
 */
export function deterministicHoldReason(lesson) {
    if (lesson.state === 'rejected')
        return 'state:rejected';
    if (lesson.state === 'stale')
        return 'state:stale';
    if (lesson.state === 'disputed')
        return 'state:disputed';
    if (lesson.state !== 'usable')
        return lesson.independentSupportCount === 0 ? 'no-evidence' : 'candidate-hold';
    return undefined;
}
/** 解析 limit/maxChars，套用默认值与硬上限。 */
export function resolveRetrievalBudget(q) {
    const rawLimit = q.limit;
    const rawMax = q.maxChars;
    const limit = typeof rawLimit === 'number' && Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(MAX_RETRIEVAL_LIMIT, rawLimit)
        : DEFAULT_RETRIEVAL_LIMIT;
    const maxChars = typeof rawMax === 'number' && Number.isInteger(rawMax) && rawMax > 0
        ? Math.min(MAX_RETRIEVAL_MAX_CHARS, rawMax)
        : DEFAULT_RETRIEVAL_MAX_CHARS;
    return { limit, maxChars };
}
function parseVersion(text) {
    const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(text.trim());
    if (match === null)
        return null;
    return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}
function compareVersion(a, b) {
    for (let i = 0; i < 3; i += 1) {
        if (a[i] !== b[i])
            return a[i] < b[i] ? -1 : 1;
    }
    return 0;
}
function parseStarBase(text) {
    const match = /^v?(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?$/.exec(text.trim());
    if (match === null)
        return null;
    const parts = [match[1], match[2], match[3]];
    const numbers = [];
    let wildcard = 3;
    for (let i = 0; i < 3; i += 1) {
        const part = parts[i];
        if (part === undefined || part === 'x' || part === 'X' || part === '*') {
            if (wildcard === 3)
                wildcard = i === 0 ? 1 : i;
            numbers.push(0);
            continue;
        }
        if (wildcard !== 3)
            return null;
        numbers.push(Number(part));
    }
    return { base: [numbers[0], numbers[1], numbers[2]], wildcard };
}
function satisfiesClause(version, clauseText) {
    const clause = clauseText.trim();
    if (clause === '')
        return false;
    const lowered = clause.toLowerCase();
    if (lowered === '*' || lowered === 'x' || lowered === 'any' || lowered === 'latest')
        return true;
    const operatorMatch = /^(>=|<=|>|<|=|\^|~)/.exec(clause);
    const operator = operatorMatch === null ? '=' : operatorMatch[1];
    const rest = operatorMatch === null ? clause : clause.slice(operatorMatch[1].length).trim();
    if (rest === '')
        return false;
    const star = parseStarBase(rest);
    const base = star === null ? parseVersion(rest) : star.base;
    if (base === null)
        return false;
    const wildcard = star === null ? 3 : star.wildcard;
    const cmp = compareVersion(version, base);
    switch (operator) {
        case '>=': return cmp >= 0;
        case '<=': return cmp <= 0;
        case '>': return cmp > 0;
        case '<': return cmp < 0;
        case '^': {
            if (cmp < 0)
                return false;
            const upper = base[0] > 0
                ? [base[0] + 1, 0, 0]
                : base[1] > 0 ? [0, base[1] + 1, 0] : [0, 0, base[2] + 1];
            return compareVersion(version, upper) < 0;
        }
        case '~': {
            if (cmp < 0)
                return false;
            return compareVersion(version, [base[0], base[1] + 1, 0]) < 0;
        }
        default: {
            if (wildcard >= 3)
                return cmp === 0;
            if (wildcard === 2)
                return version[0] === base[0] && version[1] === base[1];
            return version[0] === base[0];
        }
    }
}
/** 简单 semver 条件匹配：支持 = / > / >= / < / <= / ^ / ~、逗号或空格 AND、|| OR、x/* 通配。 */
export function versionSatisfies(versionText, rangeText) {
    const version = parseVersion(versionText);
    if (version === null)
        return false;
    if (rangeText.trim() === '')
        return false;
    return rangeText.split('||').some((part) => {
        const clauses = part.split(/[\s,]+/).filter((c) => c !== '');
        if (clauses.length === 0)
            return false;
        return clauses.every((clause) => satisfiesClause(version, clause));
    });
}
/** R3：只有显式 packageName 一致，或 query 文本出现该包名，才认为包名被识别。 */
function packageIdentified(pkg, q, queryText) {
    const normalizedPkg = normalizeText(pkg);
    if (normalizedPkg === '')
        return false;
    const explicit = trimmed(q.packageName);
    if (explicit !== undefined && normalizeText(explicit) === normalizedPkg)
        return true;
    return queryText.includes(normalizedPkg);
}
export function normalizePlatform(value) {
    const key = value.trim().toLowerCase();
    if (['win32', 'win64', 'windows', 'win', '微软windows'].includes(key))
        return 'windows';
    if (['darwin', 'macos', 'mac', 'osx', 'os x'].includes(key))
        return 'macos';
    if (['linux', 'gnu/linux'].includes(key))
        return 'linux';
    return key;
}
/** 显式任务平台优先，其次无歧义的任务文本，最后宿主平台。 */
export function taskPlatform(query, explicit, fallback) {
    if (trimmed(explicit))
        return normalizePlatform(explicit);
    const platforms = [];
    if (/\b(?:windows|win32|win64)\b/i.test(query))
        platforms.push('windows');
    if (/\b(?:linux|ubuntu|debian|fedora)\b/i.test(query))
        platforms.push('linux');
    if (/\b(?:macos|darwin|osx)\b/i.test(query))
        platforms.push('macos');
    return platforms.length === 1 ? platforms[0] : fallback ? normalizePlatform(fallback) : undefined;
}
function matchApplicability(lesson, q, queryText) {
    const out = { packages: [], versions: [], platforms: [], versionMismatch: false, platformMismatch: false };
    const packageVersion = trimmed(q.packageVersion);
    const currentPlatform = taskPlatform(q.query, q.platform);
    const platformChecks = [];
    const identifiedVersionChecks = [];
    for (const entry of lesson.applicability) {
        const pkg = trimmed(entry.package);
        const identified = pkg !== undefined && packageIdentified(pkg, q, queryText);
        if (identified && pkg !== undefined && !out.packages.includes(pkg))
            out.packages.push(pkg);
        const versions = trimmed(entry.versions);
        if (identified && versions !== undefined && packageVersion !== undefined) {
            const ok = versionSatisfies(packageVersion, versions);
            identifiedVersionChecks.push(ok);
            if (ok && !out.versions.includes(versions))
                out.versions.push(versions);
        }
        const platform = trimmed(entry.platform);
        if (currentPlatform !== undefined) {
            const ok = platform === undefined || ['*', 'any', 'all'].includes(normalizePlatform(platform))
                || platform.split(/[,|/]/).some(item => normalizePlatform(item) === currentPlatform);
            platformChecks.push(ok);
            if (ok && platform !== undefined && !out.platforms.includes(platform))
                out.platforms.push(platform);
        }
    }
    out.versionMismatch = identifiedVersionChecks.length > 0 && identifiedVersionChecks.every((ok) => !ok);
    out.platformMismatch = platformChecks.length > 0 && platformChecks.every((ok) => !ok);
    return out;
}
// ---------------------------------------------------------------------------
// Zero-dependency bilingual tokenizer, stemmer, technical alias bridge & BM25F
// ---------------------------------------------------------------------------
const QUERY_STOPWORDS = new Set([
    // Chinese boilerplate & pure grammatical filler bigrams (never temporal markers)
    '请帮我', '帮我', '请问', '一下', '这个', '那个', '这些', '那些', '可以', '能否', '需要', '想要', '怎么', '如何', '为什么', '什么', '处理', '看看', '检查',
    '关于', '以及', '或者', '但是', '因为', '所以', '如果', '已经', '正在', '我们', '你们', '他们', '进行', '使用', '通过', '是否', '时候', '当前',
    '为什', '好的', '的是', '一个', '没有', '不是', '就是', '还是', '这样', '那样', '哪里', '知道',
    // English function words & interrogatives
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'onto', 'to', 'up', 'out', 'off', 'over', 'under', 'about', 'after', 'before', 'between', 'through', 'during', 'without', 'within', 'with',
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'done', 'doing', 'have', 'has', 'had', 'having',
    'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must',
    'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose',
    'not', 'no', 'yes', 'just', 'very', 'too', 'also', 'only', 'own', 'same', 'such', 'some', 'any', 'all', 'both', 'each', 'more', 'most', 'other', 'another', 'many', 'much', 'few',
    'please', 'help', 'take', 'took', 'taken', 'away', 'get', 'got', 'gotten', 'make', 'made', 'give', 'gave', 'given', 'went', 'go', 'going', 'say', 'said', 'tell', 'told', 'ask', 'asked', 'know', 'knew', 'think', 'thought', 'want', 'wanted', 'like', 'liked', 'really', 'actually',
]);
/** 零依赖轻量双语技术同义桥接（仅软权重召回，不覆盖直接词面命中）。 */
const TECH_ALIAS_GROUPS = [
    ['单测', '单元测试', 'unittest', 'vitest', 'jest', 'pytest'],
    ['脱敏', '打码', 'redact', 'mask', 'masksecrets', 'sanitize'],
    ['回滚', '撤销', 'rollback', 'revert'],
    ['缓存', 'cache'],
    ['重试', 'retry'],
    ['超时', 'timeout'],
    ['并发', '并行', 'concurrency', 'concurrent', 'parallel'],
    ['压缩', 'compaction', 'compact'],
    ['权限', '鉴权', 'permission', 'auth', 'authorization'],
    ['代理', 'proxy'],
    ['日志', 'log', 'journal'],
    ['冲突', 'conflict', 'disputed'],
    ['配置', 'config', 'settings'],
    ['路径', '目录', 'path', 'cwd', 'directory'],
    ['端口', 'port'],
    ['依赖', 'dependency', 'package'],
    ['迁移', 'migration', 'migrate'],
    ['备份', 'backup'],
    ['工作区', 'workspace'],
    ['会话', 'session'],
    ['上下文', 'context'],
    ['插件', 'plugin'],
    ['构建', 'build'],
    ['编译', 'compile', 'typecheck', 'tsc'],
    ['测试', 'test'],
    ['定时器', 'timer', 'interval'],
    ['内存', 'memory'],
    ['泄漏', 'leak'],
    ['编码', 'encoding', 'utf8', 'bom'],
    ['换行', 'crlf', 'eol'],
    ['软链', 'symlink', 'junction'],
    ['截断', 'truncate'],
    ['验证', '校验', 'verify', 'verification', 'validate'],
    ['审阅', '审批', 'review', 'approve'],
    ['桥接', 'bridge'],
    ['反馈', 'feedback'],
    ['模型', 'model'],
    ['密钥', '凭据', 'secret', 'token', 'credential', 'apikey'],
    ['原子', 'atomic', 'rename', 'fsync'],
];
const TECH_ALIAS_MAP = new Map();
const TECH_CJK_KEYS = [];
for (const group of TECH_ALIAS_GROUPS) {
    const stems = group.map((w) => (/^[a-z]+$/.test(w) ? stemEnglish(w) : w));
    const unique = [...new Set([...group, ...stems])];
    for (const term of unique) {
        const existing = TECH_ALIAS_MAP.get(term);
        TECH_ALIAS_MAP.set(term, existing ? [...new Set([...existing, ...unique])] : unique);
    }
    for (const term of group) {
        if (/^\p{Script=Han}{2,}$/u.test(term) && !TECH_CJK_KEYS.includes(term)) {
            TECH_CJK_KEYS.push(term);
        }
    }
}
/**
 * 确定性轻量英文词形归一化（仅处理 >=4 字符纯 ASCII 英文词，避免短词误碰撞）。
 * 例：retrying/retries/retried/retry -> retry；connections/connected/connect -> connect；
 * caches/cached/caching/cache -> cach；paintings/painted/painting/paint -> paint。
 */
function stemEnglish(word) {
    if (word.length < 4 || !/^[a-z]+$/.test(word))
        return word;
    let s = word;
    if (s.length > 4 && s.endsWith('ies')) {
        return s.slice(0, -3) + 'y';
    }
    if (s.length > 4 && s.endsWith('ied')) {
        return s.slice(0, -3) + 'y';
    }
    if (s.length > 5 && s.endsWith('ying')) {
        return s.slice(0, -3);
    }
    if (s.length > 5 && s.endsWith('sses')) {
        s = s.slice(0, -2);
    }
    else if (s.length > 4 && /(?:ch|sh|x|z)es$/.test(s)) {
        s = s.slice(0, -2);
    }
    else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss') && !s.endsWith('us') && !s.endsWith('is')) {
        s = s.slice(0, -1);
    }
    if (s.length > 6 && (s.endsWith('ation') || s.endsWith('ition'))) {
        s = s.slice(0, -5);
    }
    else if (s.length > 5 && s.endsWith('ion') && (s[s.length - 4] === 't' || s[s.length - 4] === 's')) {
        s = s.slice(0, -3);
    }
    else if (s.length > 5 && s.endsWith('ing')) {
        s = s.slice(0, -3);
        if (s.length >= 3 && s[s.length - 1] === s[s.length - 2] && /[bcdfgklmnprstvz]/.test(s[s.length - 1])) {
            s = s.slice(0, -1);
        }
    }
    else if (s.length > 4 && s.endsWith('ed') && !s.endsWith('eed')) {
        s = s.slice(0, -2);
        if (s.length >= 3 && s[s.length - 1] === s[s.length - 2] && /[bcdfgklmnprstvz]/.test(s[s.length - 1])) {
            s = s.slice(0, -1);
        }
    }
    else if (s.length > 5 && s.endsWith('ment')) {
        s = s.slice(0, -4);
    }
    else if (s.length > 5 && s.endsWith('ness')) {
        s = s.slice(0, -4);
    }
    else if (s.length > 5 && s.endsWith('ally')) {
        s = s.slice(0, -4);
    }
    else if (s.length > 5 && s.endsWith('ly')) {
        s = s.slice(0, -2);
    }
    if (s.length >= 4 && s.endsWith('e') && !s.endsWith('ee')) {
        s = s.slice(0, -1);
    }
    return s.length >= 3 ? s : word;
}
const ROOT3_SKIP = new Set(['news', 'this', 'thus', 'plus', 'uses', 'does', 'goes', 'ones']);
/**
 * 仅对确有 3 字母词根的屈折形式返回 `'3:' + root`（如 fixing/fixed/fixes -> 3:fix、
 * logging/logged/logs -> 3:log、running/runs -> 3:run、bugs -> 3:bug），
 * 与 4 字母去尾 e 词干（time -> tim、care -> car）物理隔离，避免 Tim/time、car/care 误碰撞。
 */
function stemRoot3(word) {
    if (!/^[a-z]{3,}$/.test(word))
        return undefined;
    if (word.length === 3)
        return '3:' + word;
    if (ROOT3_SKIP.has(word))
        return undefined;
    if (word.length === 4 && word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is') && !word.endsWith('es')) {
        return '3:' + word.slice(0, 3);
    }
    if (word.length === 5 && /(?:ch|sh|x|z)es$/.test(word)) {
        return '3:' + word.slice(0, 3);
    }
    if (word.length === 5 && (word.endsWith('ies') || word.endsWith('ied'))) {
        return '3:' + word.slice(0, 2) + 'y';
    }
    if (word.length === 6 && word.endsWith('ying')) {
        return '3:' + word.slice(0, 3);
    }
    if (word.length === 7 && word.endsWith('ing') && word[2] === word[3] && /[bcdfgklmnprstvz]/.test(word[2])) {
        return '3:' + word.slice(0, 3);
    }
    if (word.length === 6 && word.endsWith('ed') && word[2] === word[3] && /[bcdfgklmnprstvz]/.test(word[2])) {
        return '3:' + word.slice(0, 3);
    }
    if (word.length === 6 && word.endsWith('ing') && /[xw]/.test(word[2])) {
        return '3:' + word.slice(0, 3);
    }
    if (word.length === 5 && word.endsWith('ed') && /[xw]/.test(word[2])) {
        return '3:' + word.slice(0, 3);
    }
    return undefined;
}
function splitCamelAndSeparators(rawToken) {
    // Split camelCase / PascalCase before lowercasing, then split on . _ / \ -
    const withSpaces = rawToken
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[._/\\-]+/g, ' ');
    const parts = [];
    for (const part of withSpaces.split(/\s+/)) {
        const lower = part.toLowerCase();
        if (lower.length >= 2 && !parts.includes(lower))
            parts.push(lower);
    }
    return parts;
}
function addTf(map, key, delta = 1) {
    const prev = map.get(key);
    map.set(key, Math.min(8, (prev ?? 0) + delta));
}
function tokenizeField(raw) {
    if (typeof raw !== 'string' || raw.trim() === '')
        return EMPTY_FIELD;
    const nfc = normalizeLessonText(raw);
    const flat = nfc.toLowerCase();
    const exactTf = new Map();
    const stemTf = new Map();
    const cjkTf = new Map();
    let length = 0;
    const rawTokens = nfc.split(/[^\p{L}\p{N}+#._/\\-]+/u);
    for (const rawTok of rawTokens) {
        if (rawTok === '')
            continue;
        // Extract CJK runs
        const cjkRuns = rawTok.match(/\p{Script=Han}+/gu);
        if (cjkRuns !== null) {
            for (const run of cjkRuns) {
                length += Math.max(1, Math.ceil(run.length / 2));
                if (run.length === 1) {
                    addTf(cjkTf, run);
                    addTf(exactTf, run);
                }
                else {
                    if (run.length <= 6)
                        addTf(exactTf, run);
                    for (let i = 0; i + 1 < run.length; i += 1) {
                        addTf(cjkTf, run.slice(i, i + 2));
                    }
                    // Extract known CJK technical terms embedded inside longer CJK runs
                    if (run.length > 2) {
                        for (const tech of TECH_CJK_KEYS) {
                            if (run.includes(tech) && tech !== run)
                                addTf(exactTf, tech);
                        }
                    }
                }
            }
        }
        // Extract Latin / numeric / code tokens (strip CJK so mixed tokens like "Nodemailer的" separate cleanly)
        const nonCjk = rawTok.replace(/\p{Script=Han}+/gu, ' ').trim();
        if (nonCjk === '')
            continue;
        for (const seg of nonCjk.split(/\s+/)) {
            if (seg === '')
                continue;
            const lower = seg.toLowerCase();
            if (lower.length >= 2) {
                length += 1;
                addTf(exactTf, lower);
                if (/^[a-z]{4,}$/.test(lower)) {
                    addTf(stemTf, stemEnglish(lower));
                }
                const r3 = stemRoot3(lower);
                if (r3 !== undefined)
                    addTf(stemTf, r3);
            }
            // Split path / snake_case / kebab-case / camelCase into constituent identifiers
            const parts = splitCamelAndSeparators(seg);
            for (const part of parts) {
                if (part === lower)
                    continue;
                addTf(exactTf, part);
                if (/^[a-z]{4,}$/.test(part)) {
                    addTf(stemTf, stemEnglish(part));
                }
                const r3 = stemRoot3(part);
                if (r3 !== undefined)
                    addTf(stemTf, r3);
            }
            // For relative file paths like src/bridge.ts, also keep basename "bridge.ts"
            if (lower.includes('/') || lower.includes('\\')) {
                const normSlash = lower.replace(/\\/g, '/');
                const base = normSlash.slice(normSlash.lastIndexOf('/') + 1);
                if (base.length >= 2 && base !== lower)
                    addTf(exactTf, base);
            }
        }
    }
    return { exactTf, stemTf, cjkTf, length, flat };
}
function mergeIntoPacked(target, source, fieldIdx) {
    const shifted = fieldIdx << 4;
    for (const [term, tf] of source) {
        const packed = shifted | tf;
        const existing = target.get(term);
        if (existing === undefined) {
            target.set(term, packed);
        }
        else if (typeof existing === 'number') {
            target.set(term, [existing, packed]);
        }
        else {
            existing.push(packed);
        }
    }
}
function prepareLessonFields(lesson) {
    const filesLen = Array.isArray(lesson.files) ? lesson.files.length : 0;
    const filesKey = filesLen > 0 ? lesson.files.join('\0') : '';
    const cached = lessonTokenCache.get(lesson);
    if (cached !== undefined
        && cached.revision === lesson.revision
        && cached.updatedAt === lesson.updatedAt
        && cached.kind === lesson.kind
        && cached.title === lesson.title
        && cached.when === lesson.when
        && cached.action === lesson.action
        && cached.prevents === lesson.prevents
        && cached.rationale === lesson.rationale
        && cached.problemKey === lesson.problemKey
        && cached.filesKey === filesKey
        && cached.reviewAfter === lesson.reviewAfter
        && cached.reviewAt === lesson.review.at
        && cached.lastValidatedAt === lesson.lastValidatedAt
        && cached.createdAt === lesson.createdAt) {
        return cached.fields;
    }
    const f0 = tokenizeField(lesson.title);
    const f1 = tokenizeField(lesson.when);
    const f2 = tokenizeField(lesson.action);
    const f3 = tokenizeField(lesson.prevents);
    const f4 = tokenizeField(lesson.problemKey);
    const f5 = tokenizeField(lesson.rationale);
    const f6 = tokenizeField(filesLen > 0 ? lesson.files.join(' ') : undefined);
    const exact = new Map();
    const stem = new Map();
    const cjk = new Map();
    const list = [f0, f1, f2, f3, f4, f5, f6];
    for (let i = 0; i < 7; i += 1) {
        const f = list[i];
        if (f.length === 0)
            continue;
        mergeIntoPacked(exact, f.exactTf, i);
        mergeIntoPacked(stem, f.stemTf, i);
        mergeIntoPacked(cjk, f.cjkTf, i);
    }
    const flatParts = [];
    for (let i = 0; i < 7; i += 1) {
        if (list[i].flat !== '')
            flatParts.push(list[i].flat);
    }
    const parsedValidated = lesson.lastValidatedAt !== undefined ? Date.parse(lesson.lastValidatedAt) : NaN;
    const fields = {
        exact,
        stem,
        cjk,
        fieldLens: [f0.length, f1.length, f2.length, f3.length, f4.length, f5.length, f6.length],
        allFlat: flatParts.join('\n'),
        reviewDeadlineMs: reviewDeadline(lesson),
        validatedAtMs: Number.isFinite(parsedValidated) ? parsedValidated : 0,
    };
    lessonTokenCache.set(lesson, {
        revision: lesson.revision,
        updatedAt: lesson.updatedAt,
        kind: lesson.kind,
        title: lesson.title,
        when: lesson.when,
        action: lesson.action,
        prevents: lesson.prevents,
        rationale: lesson.rationale,
        problemKey: lesson.problemKey,
        filesKey,
        reviewAfter: lesson.reviewAfter,
        reviewAt: lesson.review.at,
        lastValidatedAt: lesson.lastValidatedAt,
        createdAt: lesson.createdAt,
        fields,
    });
    return fields;
}
function prepareEvidenceField(item) {
    const cached = evidenceTokenCache.get(item);
    if (cached !== undefined && cached.verification === item.verification && cached.summary === item.summary) {
        return cached.field;
    }
    const field = tokenizeField(item.summary);
    evidenceTokenCache.set(item, { verification: item.verification, summary: item.summary, field });
    return field;
}
function buildAliasesFor(terms) {
    const latinExact = [];
    const latinStems = [];
    const cjkExact = [];
    const cjkBigrams = [];
    const seen = new Set(terms);
    const addAlias = (alias) => {
        if (seen.has(alias))
            return;
        seen.add(alias);
        if (/^\p{Script=Han}+$/u.test(alias)) {
            cjkExact.push(alias);
            if (alias.length === 1)
                cjkBigrams.push(alias);
            for (let i = 0; i + 1 < alias.length; i += 1) {
                const bg = alias.slice(i, i + 2);
                if (!cjkBigrams.includes(bg))
                    cjkBigrams.push(bg);
            }
        }
        else if (alias.length >= 2) {
            latinExact.push(alias);
            if (/^[a-z]{4,}$/.test(alias)) {
                const st = stemEnglish(alias);
                if (!latinStems.includes(st))
                    latinStems.push(st);
            }
            const r3 = stemRoot3(alias);
            if (r3 !== undefined && !latinStems.includes(r3))
                latinStems.push(r3);
        }
    };
    for (const term of terms) {
        const group = TECH_ALIAS_MAP.get(term);
        if (group) {
            for (const alias of group)
                addAlias(alias);
        }
    }
    return { latinExact, latinStems, cjkExact, cjkBigrams };
}
function analyzeQuery(rawQuery) {
    const nfc = normalizeLessonText(rawQuery ?? '');
    if (nfc === '')
        return { concepts: [], phrases: [] };
    const rawConcepts = [];
    const keptOrderWords = [];
    const seenKeys = new Set();
    const rawTokens = nfc.split(/[^\p{L}\p{N}+#._/\\-]+/u);
    for (const rawTok of rawTokens) {
        if (rawTok === '')
            continue;
        // CJK runs inside this token
        const cjkRuns = rawTok.match(/\p{Script=Han}+/gu);
        if (cjkRuns !== null) {
            for (const run of cjkRuns) {
                if (QUERY_STOPWORDS.has(run))
                    continue;
                const bigrams = [];
                if (run.length === 1)
                    bigrams.push(run);
                for (let i = 0; i + 1 < run.length; i += 1) {
                    const bg = run.slice(i, i + 2);
                    if (!QUERY_STOPWORDS.has(bg) && !bigrams.includes(bg))
                        bigrams.push(bg);
                }
                // Fallback if all bigrams were stopwords
                if (bigrams.length === 0) {
                    for (let i = 0; i + 1 < run.length; i += 1)
                        bigrams.push(run.slice(i, i + 2));
                }
                const embeddedTech = [];
                for (const tech of TECH_CJK_KEYS) {
                    if (run.includes(tech))
                        embeddedTech.push(tech);
                }
                const subTechs = embeddedTech.filter((t) => t !== run);
                const subTechBigrams = new Set();
                for (const tech of subTechs) {
                    for (let i = 0; i + 1 < tech.length; i += 1)
                        subTechBigrams.add(tech.slice(i, i + 2));
                }
                const outerBigrams = subTechs.length > 0
                    ? bigrams.filter((bg) => !subTechBigrams.has(bg))
                    : bigrams;
                const key = 'cjk:' + run;
                if (!seenKeys.has(key) && (outerBigrams.length > 0 || subTechs.length === 0)) {
                    seenKeys.add(key);
                    rawConcepts.push({
                        display: subTechs.length === 0 ? (embeddedTech[0] ?? run) : run,
                        kind: 'cjk',
                        exact: run.length <= 6 ? [run] : [],
                        cjkBigrams: outerBigrams.length > 0 ? outerBigrams : bigrams,
                        cjkFullRuns: run.length <= 6 ? [run] : [],
                        aliases: subTechs.length === 0 ? buildAliasesFor([run, ...embeddedTech]) : { latinExact: [], latinStems: [], cjkExact: [], cjkBigrams: [] },
                    });
                    keptOrderWords.push(run);
                }
                // Emit embedded CJK technical terms as independent concepts so common prose hits never suppress bilingual aliases
                for (const tech of subTechs) {
                    const tKey = 'cjk:' + tech;
                    if (seenKeys.has(tKey))
                        continue;
                    seenKeys.add(tKey);
                    const techBigrams = [];
                    for (let i = 0; i + 1 < tech.length; i += 1) {
                        const bg = tech.slice(i, i + 2);
                        if (!techBigrams.includes(bg))
                            techBigrams.push(bg);
                    }
                    rawConcepts.push({
                        display: tech,
                        kind: 'cjk',
                        exact: [tech],
                        cjkBigrams: techBigrams,
                        cjkFullRuns: [tech],
                        aliases: buildAliasesFor([tech]),
                    });
                }
            }
        }
        // Latin / numeric / code tokens
        const nonCjk = rawTok.replace(/\p{Script=Han}+/gu, ' ').trim();
        if (nonCjk === '')
            continue;
        for (const seg of nonCjk.split(/\s+/)) {
            if (seg === '')
                continue;
            const lower = seg.toLowerCase();
            const parts = splitCamelAndSeparators(seg);
            const isCompound = parts.length > 1 || lower.includes('/') || lower.includes('\\');
            if (lower.length < 2)
                continue;
            if (!isCompound) {
                if (QUERY_STOPWORDS.has(lower))
                    continue;
                const stem = /^[a-z]{4,}$/.test(lower) ? stemEnglish(lower) : undefined;
                const root3 = stemRoot3(lower);
                const key = 'lat:' + (root3 ?? stem ?? lower);
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    const seedTerms = stem ? [lower, stem] : [lower];
                    rawConcepts.push({
                        display: lower,
                        kind: 'latin',
                        exact: [lower],
                        stem,
                        root3,
                        cjkBigrams: [],
                        cjkFullRuns: [],
                        aliases: buildAliasesFor(seedTerms),
                    });
                }
                keptOrderWords.push(lower);
            }
            else {
                // Compound code identifier or file path (e.g. src/automatic.ts, sessionQuery, api_key)
                const base = (lower.includes('/') || lower.includes('\\'))
                    ? lower.replace(/\\/g, '/').slice(lower.replace(/\\/g, '/').lastIndexOf('/') + 1)
                    : undefined;
                const exacts = [lower];
                if (base && base.length >= 2 && !exacts.includes(base))
                    exacts.push(base);
                const key = 'lat:' + lower;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    rawConcepts.push({
                        display: lower,
                        kind: 'latin',
                        exact: exacts,
                        stem: undefined,
                        cjkBigrams: [],
                        cjkFullRuns: [],
                        aliases: buildAliasesFor([lower, ...parts]),
                    });
                }
                keptOrderWords.push(lower);
                // Also emit meaningful constituent parts as individual concepts
                for (const part of parts) {
                    if (part.length < 2 || QUERY_STOPWORDS.has(part))
                        continue;
                    const stem = /^[a-z]{4,}$/.test(part) ? stemEnglish(part) : undefined;
                    const root3 = stemRoot3(part);
                    const pKey = 'lat:' + (root3 ?? stem ?? part);
                    if (!seenKeys.has(pKey)) {
                        seenKeys.add(pKey);
                        rawConcepts.push({
                            display: part,
                            kind: 'latin',
                            exact: [part],
                            stem,
                            root3,
                            cjkBigrams: [],
                            cjkFullRuns: [],
                            aliases: buildAliasesFor(stem ? [part, stem] : [part]),
                        });
                    }
                }
            }
        }
    }
    // Fallback when all tokens were stopwords (e.g., query is just "what is this")
    if (rawConcepts.length === 0) {
        for (const rawTok of rawTokens) {
            const lower = rawTok.toLowerCase();
            if (lower.length < 2)
                continue;
            const key = 'fb:' + lower;
            if (seenKeys.has(key))
                continue;
            seenKeys.add(key);
            const isCjk = /^\p{Script=Han}+$/u.test(lower);
            rawConcepts.push({
                display: lower,
                kind: isCjk ? 'cjk' : 'latin',
                exact: [lower],
                stem: !isCjk && /^[a-z]{4,}$/.test(lower) ? stemEnglish(lower) : undefined,
                root3: !isCjk ? stemRoot3(lower) : undefined,
                cjkBigrams: isCjk ? (lower.length === 1 ? [lower] : Array.from({ length: lower.length - 1 }, (_, i) => lower.slice(i, i + 2))) : [],
                cjkFullRuns: isCjk ? [lower] : [],
                aliases: { latinExact: [], latinStems: [], cjkExact: [], cjkBigrams: [] },
            });
        }
    }
    // Adjacent non-stopword Latin/mixed bigrams for exact phrase proximity boost
    const phrases = [];
    for (let i = 0; i + 1 < keptOrderWords.length; i += 1) {
        const a = keptOrderWords[i];
        const b = keptOrderWords[i + 1];
        if (/^[a-z0-9]/.test(a) && /^[a-z0-9]/.test(b)) {
            const phrase = a + ' ' + b;
            if (phrase.length >= 5 && !phrases.includes(phrase))
                phrases.push(phrase);
        }
    }
    return { concepts: rawConcepts, phrases };
}
// Field order: 0=title, 1=when, 2=action, 3=prevents, 4=problemKey, 5=rationale, 6=files, 7=evidence
const FIELD_W = [2.2, 1.5, 1.3, 1.6, 1.4, 0.95, 1.35, 0.65];
const FIELD_B = [0.55, 0.50, 0.60, 0.45, 0.40, 0.65, 0.40, 0.65];
const BM25_K1 = 1.2;
const MIN_FIELD_LEN_FLOOR = 8;
function bm25FieldTf(tf, fieldLen, avgLen, b) {
    const effLen = fieldLen > MIN_FIELD_LEN_FLOOR ? fieldLen : MIN_FIELD_LEN_FLOOR;
    const norm = 1 - b + b * (effLen / avgLen);
    return (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * norm);
}
function scorePacked(packed, fieldLens, avgLens) {
    if (packed === undefined)
        return 0;
    if (typeof packed === 'number') {
        const idx = packed >>> 4;
        const tf = packed & 0xf;
        return FIELD_W[idx] * bm25FieldTf(tf, fieldLens[idx], avgLens[idx], FIELD_B[idx]);
    }
    let sum = 0;
    for (let i = 0; i < packed.length; i += 1) {
        const p = packed[i];
        const idx = p >>> 4;
        const tf = p & 0xf;
        sum += FIELD_W[idx] * bm25FieldTf(tf, fieldLens[idx], avgLens[idx], FIELD_B[idx]);
    }
    return sum;
}
function normalizeActiveFiles(files) {
    if (!Array.isArray(files) || files.length === 0)
        return [];
    const out = [];
    for (const file of files) {
        const normalized = normalizeRelativeLessonFile(file);
        if (normalized !== undefined) {
            const lowered = normalized.toLowerCase();
            if (!out.includes(lowered))
                out.push(lowered);
        }
    }
    return out;
}
function matchLessonFiles(lesson, activeFiles) {
    if (activeFiles.length === 0 || !Array.isArray(lesson.files) || lesson.files.length === 0)
        return [];
    const hits = [];
    for (const raw of lesson.files) {
        const file = raw.toLowerCase();
        const matched = activeFiles.some((active) => active === file || active.endsWith('/' + file) || file.endsWith('/' + active));
        if (matched && !hits.includes(raw))
            hits.push(raw);
    }
    return hits;
}
function feedbackFactorOf(lesson, q) {
    const fbPos = lesson.feedback?.useful ?? 0;
    const fbNeg = lesson.feedback?.notApplicable ?? 0;
    const obs = q.observations?.[lesson.id];
    const obsPos = obs?.positive ?? 0;
    const obsNeg = obs?.negative ?? 0;
    const obsCorr = obs?.corrections ?? 0;
    const net = (fbPos - fbNeg) + (obsPos - obsNeg) - obsCorr * 0.5;
    if (net === 0)
        return 1;
    return Math.round((1 + Math.max(-0.25, Math.min(0.25, net * 0.06))) * 10000) / 10000;
}
function normalizeModelId(model) {
    if (typeof model !== 'string')
        return undefined;
    const value = model.trim().toLowerCase();
    return value === '' ? undefined : value;
}
function scopeMatches(lesson, q) {
    if (lesson.scope.global === true)
        return true;
    const queryProject = trimmed(q.projectId);
    const queryWorkspace = trimmed(q.workspaceRoot);
    const lessonProject = trimmed(lesson.scope.projectId);
    const lessonWorkspace = trimmed(lesson.scope.workspaceRoot);
    if (queryProject !== undefined && lessonProject === queryProject)
        return true;
    if (queryWorkspace !== undefined && lessonWorkspace !== undefined && samePath(lessonWorkspace, queryWorkspace))
        return true;
    return false;
}
function buildWhyRelevant(entry, q) {
    const lesson = entry.lesson;
    const parts = [];
    if (entry.fileHits.length > 0) {
        const shown = entry.fileHits.slice(0, 2).map((file) => '「' + file + '」').join('、');
        parts.push('关联文件' + shown + (entry.fileHits.length > 2 ? ' 等' : ''));
    }
    if (entry.keywordHits.length > 0) {
        const shown = entry.keywordHits.slice(0, 3).map((term) => '「' + term + '」').join('、');
        parts.push('命中关键词' + shown + (entry.keywordHits.length > 3 ? ' 等' : ''));
    }
    if (entry.applicability.packages.length > 0) {
        parts.push('适用包「' + entry.applicability.packages.slice(0, 2).join('、') + '」');
    }
    if (entry.applicability.versions.length > 0) {
        const current = trimmed(q.packageVersion);
        parts.push('适用版本「' + entry.applicability.versions.slice(0, 2).join('、') + '」' + (current !== undefined ? '（当前 ' + current + '）' : ''));
    }
    if (entry.applicability.platforms.length > 0) {
        parts.push('适用平台「' + entry.applicability.platforms.slice(0, 2).join('、') + '」');
    }
    const queryProject = trimmed(q.projectId);
    const queryWorkspace = trimmed(q.workspaceRoot);
    const lessonProject = trimmed(lesson.scope.projectId);
    const lessonWorkspace = trimmed(lesson.scope.workspaceRoot);
    if (lesson.scope.global === true && lessonProject === undefined && lessonWorkspace === undefined) {
        parts.push('全局经验');
    }
    else if (queryProject !== undefined && lessonProject === queryProject) {
        parts.push('项目匹配（' + lessonProject + '）');
    }
    else if (queryWorkspace !== undefined && lessonWorkspace !== undefined && samePath(lessonWorkspace, queryWorkspace)) {
        parts.push('工作区匹配（' + lessonWorkspace + '）');
    }
    else if (lesson.scope.global === true) {
        parts.push('全局经验');
    }
    if (parts.length === 0)
        parts.push('范围匹配（' + lessonScopeLabel(lesson.scope) + '）');
    return parts.join('；');
}
function toRetrievedLesson(entry, summarizeEvidence, q) {
    const lesson = entry.lesson;
    const originModel = trimmed(lesson.origin?.model);
    const currentModel = normalizeModelId(q.currentModel);
    const modelMismatch = originModel !== undefined && currentModel !== undefined
        ? normalizeModelId(originModel) !== currentModel
        : undefined;
    const item = {
        lessonId: lesson.id,
        revision: lesson.revision,
        title: lesson.title,
        when: lesson.when,
        action: lesson.action,
        exceptions: [...lesson.exceptions],
        ...(lesson.rationale !== undefined ? { rationale: lesson.rationale } : {}),
        ...(lesson.problemKey !== undefined ? { problemKey: lesson.problemKey } : {}),
        ...(lesson.files !== undefined && lesson.files.length > 0 ? { files: [...lesson.files] } : {}),
        ...(originModel !== undefined ? { originModel } : {}),
        ...(modelMismatch === true ? { modelMismatch: true } : {}),
        state: lesson.state,
        scopeLabel: lessonScopeLabel(lesson.scope),
        whyRelevant: buildWhyRelevant(entry, q),
        evidenceSummary: summarizeEvidence(lesson),
        truncated: false,
    };
    if (lesson.lastValidatedAt !== undefined)
        item.lastValidatedAt = lesson.lastValidatedAt;
    return item;
}
function stateRank(state) {
    if (state === 'usable')
        return 2;
    if (state === 'candidate')
        return 1;
    return 0;
}
function mergeEvidenceFields(lesson, evidenceById) {
    if (!Array.isArray(lesson.evidenceIds) || lesson.evidenceIds.length === 0)
        return EMPTY_FIELD;
    let single;
    let merged;
    for (const id of lesson.evidenceIds) {
        const ev = evidenceById.get(id);
        if (ev === undefined || ev.verification !== 'read')
            continue;
        const f = prepareEvidenceField(ev);
        if (f.length === 0)
            continue;
        if (single === undefined) {
            single = f;
            continue;
        }
        if (merged === undefined) {
            merged = {
                exactTf: new Map(single.exactTf),
                stemTf: new Map(single.stemTf),
                cjkTf: new Map(single.cjkTf),
                length: single.length,
                flat: single.flat,
            };
        }
        for (const [k, v] of f.exactTf)
            addTf(merged.exactTf, k, v);
        for (const [k, v] of f.stemTf)
            addTf(merged.stemTf, k, v);
        for (const [k, v] of f.cjkTf)
            addTf(merged.cjkTf, k, v);
        merged.length += f.length;
        merged.flat += '\n' + f.flat;
    }
    return merged ?? single ?? EMPTY_FIELD;
}
/**
 * 任务相关经验检索。只返回 global 或与查询项目/工作区精确匹配的记录；
 * 未知项目（未给 projectId/workspaceRoot）时只返回 global，绝不跨项目扫描。
 *
 * R1：includeCandidates=false 时 candidate 记 skipped:candidate-hold；includeNoEvidence=false 时
 * independentSupportCount===0 且非 usable 记 skipped:no-evidence（优先于 candidate-hold）。
 * R3：applicability.versions 仅在包名被识别时参与；包名识别但版本不满足 → skipped:version-mismatch。
 * R4：预算按排名整条装入，第一条 essential 放不下即停（budget-stop）；metadata 可截断。
 */
export function retrieveLessons(lessons, evidence, q) {
    const { limit, maxChars } = resolveRetrievalBudget(q);
    const analyzed = analyzeQuery(q.query ?? '');
    const queryText = normalizeText(q.query ?? '');
    const activeFiles = normalizeActiveFiles(q.activeFiles);
    const includeCandidates = q.includeCandidates !== false;
    const includeNoEvidence = q.includeNoEvidence !== false;
    const now = q.now ?? Date.now();
    const skipped = [];
    const evidenceById = indexEvidenceById(evidence);
    const pool = [];
    const fieldLenSums = [0, 0, 0, 0, 0, 0, 0, 0];
    const fieldNonEmptyCounts = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const lesson of lessons) {
        if (!scopeMatches(lesson, q))
            continue;
        const prepared = prepareLessonFields(lesson);
        if (lesson.state === 'usable' && prepared.reviewDeadlineMs !== undefined && prepared.reviewDeadlineMs <= now) {
            skipped.push({ lessonId: lesson.id, reason: 'review-due' });
            continue;
        }
        const excludedReason = EXCLUDED_STATE_REASONS[lesson.state];
        if (excludedReason !== undefined) {
            skipped.push({ lessonId: lesson.id, reason: excludedReason });
            continue;
        }
        // R3 优先于 R1 的候选扣留：包名已识别但版本不满足时，reason 必须是 version-mismatch。
        const applicability = matchApplicability(lesson, q, queryText);
        if (applicability.platformMismatch) {
            skipped.push({ lessonId: lesson.id, reason: 'platform-mismatch' });
            continue;
        }
        if (applicability.versionMismatch) {
            skipped.push({ lessonId: lesson.id, reason: 'version-mismatch' });
            continue;
        }
        if (!includeNoEvidence && lesson.state !== 'usable' && lesson.independentSupportCount === 0) {
            skipped.push({ lessonId: lesson.id, reason: 'no-evidence' });
            continue;
        }
        if (!includeCandidates && lesson.state === 'candidate') {
            skipped.push({ lessonId: lesson.id, reason: 'candidate-hold' });
            continue;
        }
        const evField = mergeEvidenceFields(lesson, evidenceById);
        const lens = prepared.fieldLens;
        for (let i = 0; i < 7; i += 1) {
            if (lens[i] > 0) {
                fieldLenSums[i] += lens[i];
                fieldNonEmptyCounts[i] += 1;
            }
        }
        if (evField.length > 0) {
            fieldLenSums[7] += evField.length;
            fieldNonEmptyCounts[7] += 1;
        }
        const fileHits = matchLessonFiles(lesson, activeFiles);
        const applicabilityCount = applicability.packages.length + applicability.versions.length + applicability.platforms.length;
        pool.push({ lesson, prepared, evField, applicability, applicabilityCount, fileHits });
    }
    if (pool.length === 0)
        return { items: [], skipped };
    const corpusSize = pool.length;
    const avgLens = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 8; i += 1) {
        const avg = fieldNonEmptyCounts[i] > 0 ? fieldLenSums[i] / fieldNonEmptyCounts[i] : MIN_FIELD_LEN_FLOOR;
        avgLens[i] = avg > MIN_FIELD_LEN_FLOOR ? avg : MIN_FIELD_LEN_FLOOR;
    }
    // Deduplicate all lookup keys required by this query and compute exact DF in one pass over unified maps
    const exactKeySet = new Set();
    const stemKeySet = new Set();
    const cjkKeySet = new Set();
    for (const concept of analyzed.concepts) {
        for (const ex of concept.exact)
            exactKeySet.add(ex);
        if (concept.stem !== undefined)
            stemKeySet.add(concept.stem);
        if (concept.root3 !== undefined)
            stemKeySet.add(concept.root3);
        for (const bg of concept.cjkBigrams)
            cjkKeySet.add(bg);
        for (const ex of concept.aliases.latinExact)
            exactKeySet.add(ex);
        for (const st of concept.aliases.latinStems)
            stemKeySet.add(st);
        for (const ex of concept.aliases.cjkExact)
            exactKeySet.add(ex);
        for (const bg of concept.aliases.cjkBigrams)
            cjkKeySet.add(bg);
    }
    const exactKeys = [...exactKeySet];
    const stemKeys = [...stemKeySet];
    const cjkKeys = [...cjkKeySet];
    const exactCounts = new Int32Array(exactKeys.length);
    const stemCounts = new Int32Array(stemKeys.length);
    const cjkCounts = new Int32Array(cjkKeys.length);
    const docTouched = new Uint8Array(corpusSize);
    for (let d = 0; d < corpusSize; d += 1) {
        const doc = pool[d];
        const prep = doc.prepared;
        const ev = doc.evField;
        const hasEv = ev.length > 0;
        let touched = doc.fileHits.length > 0 || doc.applicabilityCount > 0;
        for (let k = 0; k < exactKeys.length; k += 1) {
            const key = exactKeys[k];
            if (prep.exact.has(key) || (hasEv && ev.exactTf.has(key))) {
                exactCounts[k] += 1;
                touched = true;
            }
        }
        for (let k = 0; k < stemKeys.length; k += 1) {
            const key = stemKeys[k];
            if (prep.stem.has(key) || (hasEv && ev.stemTf.has(key))) {
                stemCounts[k] += 1;
                touched = true;
            }
        }
        for (let k = 0; k < cjkKeys.length; k += 1) {
            const key = cjkKeys[k];
            if (prep.cjk.has(key) || (hasEv && ev.cjkTf.has(key))) {
                cjkCounts[k] += 1;
                touched = true;
            }
        }
        if (touched)
            docTouched[d] = 1;
    }
    const idfOf = (df) => Math.log(1 + (corpusSize - df + 0.5) / (df + 0.5));
    const exactIdf = new Map();
    for (let k = 0; k < exactKeys.length; k += 1)
        exactIdf.set(exactKeys[k], idfOf(exactCounts[k]));
    const stemIdf = new Map();
    for (let k = 0; k < stemKeys.length; k += 1)
        stemIdf.set(stemKeys[k], idfOf(stemCounts[k]));
    const cjkIdf = new Map();
    for (let k = 0; k < cjkKeys.length; k += 1)
        cjkIdf.set(cjkKeys[k], idfOf(cjkCounts[k]));
    const scoreTerm = (doc, key, kind) => {
        const prep = doc.prepared;
        const ev = doc.evField;
        let sum;
        if (kind === 0) {
            sum = scorePacked(prep.exact.get(key), prep.fieldLens, avgLens);
            if (ev.length > 0) {
                const tf = ev.exactTf.get(key);
                if (tf !== undefined)
                    sum += FIELD_W[7] * bm25FieldTf(tf, ev.length, avgLens[7], FIELD_B[7]);
            }
        }
        else if (kind === 1) {
            sum = scorePacked(prep.stem.get(key), prep.fieldLens, avgLens);
            if (ev.length > 0) {
                const tf = ev.stemTf.get(key);
                if (tf !== undefined)
                    sum += FIELD_W[7] * bm25FieldTf(tf, ev.length, avgLens[7], FIELD_B[7]);
            }
        }
        else {
            sum = scorePacked(prep.cjk.get(key), prep.fieldLens, avgLens);
            if (ev.length > 0) {
                const tf = ev.cjkTf.get(key);
                if (tf !== undefined)
                    sum += FIELD_W[7] * bm25FieldTf(tf, ev.length, avgLens[7], FIELD_B[7]);
            }
        }
        return sum;
    };
    const candidates = [];
    const totalConcepts = Math.max(1, analyzed.concepts.length);
    for (let d = 0; d < corpusSize; d += 1) {
        if (docTouched[d] === 0)
            continue;
        const doc = pool[d];
        const keywordHits = [];
        let rawBm25 = 0;
        let matchedConcepts = 0;
        let matchedDirectConcepts = 0;
        for (const concept of analyzed.concepts) {
            let conceptScore = 0;
            let directHit = false;
            if (concept.kind === 'latin') {
                let bestExact = 0;
                for (const ex of concept.exact) {
                    const s = scoreTerm(doc, ex, 0);
                    if (s > 0) {
                        const weighted = (exactIdf.get(ex) ?? 0) * s;
                        if (weighted > bestExact)
                            bestExact = weighted;
                    }
                }
                let bestStem = 0;
                if (concept.stem !== undefined) {
                    const s = scoreTerm(doc, concept.stem, 1);
                    if (s > 0) {
                        bestStem = (stemIdf.get(concept.stem) ?? 0) * s * 0.85;
                    }
                }
                if (concept.root3 !== undefined) {
                    const s = scoreTerm(doc, concept.root3, 1);
                    if (s > 0) {
                        const w3 = (stemIdf.get(concept.root3) ?? 0) * s * 0.85;
                        if (w3 > bestStem)
                            bestStem = w3;
                    }
                }
                if (bestExact > 0 || bestStem > 0) {
                    conceptScore = bestExact > bestStem ? bestExact : bestStem;
                    directHit = true;
                }
            }
            else {
                // CJK concept: exact full-run match + CJK 2-gram BM25F
                let fullScore = 0;
                for (const run of concept.cjkFullRuns) {
                    const s = scoreTerm(doc, run, 0);
                    if (s > 0) {
                        const weighted = (exactIdf.get(run) ?? 0) * s * 0.9;
                        if (weighted > fullScore)
                            fullScore = weighted;
                    }
                }
                let bgScore = 0;
                let bgHits = 0;
                for (const bg of concept.cjkBigrams) {
                    const s = scoreTerm(doc, bg, 2);
                    if (s > 0) {
                        bgHits += 1;
                        bgScore += (cjkIdf.get(bg) ?? 0) * s;
                    }
                }
                if (bgHits > 0) {
                    // Dampen long multi-bigram CJK runs so a single long Chinese run does not drown rare technical tokens
                    const damp = bgHits > 2 ? (2 + Math.log2(bgHits - 1)) / bgHits : 1;
                    bgScore = bgScore * damp * 0.72;
                }
                const combined = fullScore > 0 ? fullScore + bgScore * 0.55 : bgScore;
                if (combined > 0) {
                    conceptScore = combined;
                    directHit = true;
                }
            }
            // Soft bilingual technical alias bridge (only fires if no direct hit on this concept)
            if (!directHit) {
                let aliasBest = 0;
                for (const ex of concept.aliases.latinExact) {
                    const s = scoreTerm(doc, ex, 0);
                    if (s > 0) {
                        const w = (exactIdf.get(ex) ?? 0) * s * 0.78;
                        if (w > aliasBest)
                            aliasBest = w;
                    }
                }
                for (const st of concept.aliases.latinStems) {
                    const s = scoreTerm(doc, st, 1);
                    if (s > 0) {
                        const w = (stemIdf.get(st) ?? 0) * s * 0.68;
                        if (w > aliasBest)
                            aliasBest = w;
                    }
                }
                for (const ex of concept.aliases.cjkExact) {
                    const s = scoreTerm(doc, ex, 0);
                    if (s > 0) {
                        const w = (exactIdf.get(ex) ?? 0) * s * 0.78;
                        if (w > aliasBest)
                            aliasBest = w;
                    }
                }
                if (aliasBest === 0 && concept.aliases.cjkBigrams.length > 0) {
                    let bgSum = 0;
                    let bgCount = 0;
                    for (const bg of concept.aliases.cjkBigrams) {
                        const s = scoreTerm(doc, bg, 2);
                        if (s > 0) {
                            bgCount += 1;
                            bgSum += (cjkIdf.get(bg) ?? 0) * s;
                        }
                    }
                    if (bgCount > 0)
                        aliasBest = (bgSum / bgCount) * 0.42;
                }
                if (aliasBest > 0) {
                    conceptScore = aliasBest;
                }
            }
            if (conceptScore > 0) {
                rawBm25 += conceptScore;
                matchedConcepts += 1;
                if (directHit)
                    matchedDirectConcepts += 1;
                if (!keywordHits.includes(concept.display))
                    keywordHits.push(concept.display);
            }
        }
        if (keywordHits.length === 0 && doc.fileHits.length === 0 && doc.applicabilityCount === 0)
            continue;
        // Coverage bonus rewards documents covering multiple distinct query concepts
        if (rawBm25 > 0 && totalConcepts > 1) {
            const coverage = matchedConcepts / totalConcepts;
            rawBm25 *= 1 + 0.32 * coverage;
        }
        // Adjacent phrase proximity bonus for multi-word queries
        if (matchedDirectConcepts >= 2 && analyzed.phrases.length > 0) {
            let phraseHits = 0;
            const lessonFlat = doc.prepared.allFlat;
            const evFlat = doc.evField.flat;
            for (const phrase of analyzed.phrases) {
                if (lessonFlat.includes(phrase) || (evFlat !== '' && evFlat.includes(phrase)))
                    phraseHits += 1;
            }
            if (phraseHits > 0) {
                rawBm25 += Math.min(3, phraseHits) * 1.15;
            }
        }
        // Active-file match boost
        if (doc.fileHits.length > 0) {
            rawBm25 += doc.fileHits.length * 4.5;
        }
        const feedbackFactor = feedbackFactorOf(doc.lesson, q);
        const bm25Score = Math.round(rawBm25 * feedbackFactor * 10000) / 10000;
        candidates.push({
            lesson: doc.lesson,
            keywordHits,
            fileHits: doc.fileHits,
            applicability: doc.applicability,
            bm25Score,
            matchedConcepts,
            feedbackFactor,
            validatedAtMs: doc.prepared.validatedAtMs,
        });
    }
    candidates.sort((a, b) => {
        const aDirect = (a.keywordHits.length > 0 || a.fileHits.length > 0) ? 1 : 0;
        const bDirect = (b.keywordHits.length > 0 || b.fileHits.length > 0) ? 1 : 0;
        if (aDirect !== bDirect)
            return bDirect - aDirect;
        if (a.bm25Score !== b.bm25Score)
            return b.bm25Score - a.bm25Score;
        const aApp = a.applicability.packages.length + a.applicability.versions.length + a.applicability.platforms.length;
        const bApp = b.applicability.packages.length + b.applicability.versions.length + b.applicability.platforms.length;
        if (aApp !== bApp)
            return bApp - aApp;
        const aRank = stateRank(a.lesson.state);
        const bRank = stateRank(b.lesson.state);
        if (aRank !== bRank)
            return bRank - aRank;
        if (a.feedbackFactor !== b.feedbackFactor)
            return b.feedbackFactor - a.feedbackFactor;
        if (a.validatedAtMs !== b.validatedAtMs)
            return b.validatedAtMs - a.validatedAtMs;
        if (a.lesson.id === b.lesson.id)
            return 0;
        return a.lesson.id < b.lesson.id ? -1 : 1;
    });
    // Suppress weak tail noise on rich multi-concept queries when the top match is strong,
    // without dropping top hits, file-matched lessons, applicability-matched lessons, or strong secondary evidence.
    let ranked = candidates;
    if (candidates.length > 1 && analyzed.concepts.length >= 3 && candidates[0].bm25Score >= 18) {
        const minTailScore = candidates[0].bm25Score * 0.18;
        ranked = [candidates[0]];
        for (let i = 1; i < candidates.length; i += 1) {
            const c = candidates[i];
            const hasContextSignal = c.fileHits.length > 0
                || c.applicability.packages.length > 0
                || c.applicability.versions.length > 0
                || c.applicability.platforms.length > 0;
            if (hasContextSignal || c.bm25Score >= minTailScore) {
                ranked.push(c);
            }
        }
    }
    const items = [];
    if (ranked.length === 0)
        return { items, skipped };
    const summarize = (lesson) => summarizeEvidence(lesson, evidenceById);
    let usedChars = 0;
    for (let index = 0; index < ranked.length; index += 1) {
        if (items.length >= limit) {
            for (let rest = index; rest < ranked.length; rest += 1) {
                skipped.push({ lessonId: ranked[rest].lesson.id, reason: 'limit' });
            }
            break;
        }
        const candidate = ranked[index];
        const item = toRetrievedLesson(candidate, summarize, q);
        const remaining = maxChars - usedChars;
        const essential = essentialLessonChars(item);
        if (essential > remaining) {
            for (let rest = index; rest < ranked.length; rest += 1) {
                skipped.push({ lessonId: ranked[rest].lesson.id, reason: 'budget-stop' });
            }
            break;
        }
        const fullCost = retrievedLessonChars(item);
        if (fullCost <= remaining) {
            items.push(item);
            usedChars += fullCost;
            continue;
        }
        const trimmedItem = truncateMetadata(item, remaining - essential);
        const trimmedCost = retrievedLessonChars(trimmedItem);
        if (trimmedCost > remaining) {
            for (let rest = index; rest < ranked.length; rest += 1) {
                skipped.push({ lessonId: ranked[rest].lesson.id, reason: 'budget-stop' });
            }
            break;
        }
        items.push(trimmedItem);
        usedChars += trimmedCost;
    }
    return { items, skipped };
}
/** metadata（whyRelevant/evidenceSummary）按预算截断，essential 保持不变。 */
function truncateMetadata(item, metadataBudget) {
    const budget = Math.max(0, metadataBudget);
    const whyBudget = Math.min(item.whyRelevant.length, Math.ceil(budget / 2));
    const whyRelevant = clipTo(item.whyRelevant, whyBudget);
    const evidenceSummary = clipTo(item.evidenceSummary, Math.max(0, budget - whyRelevant.length));
    if (whyRelevant === item.whyRelevant && evidenceSummary === item.evidenceSummary)
        return item;
    return { ...item, whyRelevant, evidenceSummary, truncated: true };
}
