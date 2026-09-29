/**
 * 面向模型的做梦工具：dream_digest / dream_save / dream_journal / dream_recall / dream_bridge / dream_health
 * 与 M1 新增的 dream_learn / dream_context / dream_review。
 *
 * @module dsh-dream/tools
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { maskSecrets } from './mask.js';
import { dreamStats, readDreams, saveDream, searchDreams } from './journal.js';
import { bridgeDreams } from './bridge.js';
import { digestSessionFile, listSessionFiles } from './sessions.js';
import { KnowledgeError, lessonFingerprint, } from './knowledge.js';
import { KnowledgeStore } from './knowledge-store.js';
import { queryScopeLabel, resolveRetrievalBudget, retrieveLessons, retrievedLessonChars, } from './retrieval.js';
/** 编译一个值 schema 节点；支持 enum、对象数组 items 与嵌套对象（宿主 schema 子集要求对象显式 additionalProperties）。 */
function compileValueNode(prop) {
    const node = {};
    if (typeof prop.description === 'string')
        node.description = prop.description;
    if (Array.isArray(prop.oneOf) && prop.oneOf.length >= 2) {
        node.oneOf = prop.oneOf.map((branch) => compileValueNode(branch));
        return node;
    }
    if (typeof prop.type === 'string')
        node.type = prop.type;
    if (Array.isArray(prop.enum) && prop.enum.length > 0)
        node.enum = prop.enum.slice();
    if (prop.type === 'array') {
        node.items = typeof prop.items === 'object' && prop.items !== null ? compileItemsNode(prop.items) : { type: 'string' };
    }
    else if (prop.type === 'object') {
        const nested = compilePropertyMap(typeof prop.properties === 'object' && prop.properties !== null ? prop.properties : {});
        node.properties = nested.properties;
        node.additionalProperties = prop.additionalProperties === false ? false : true;
        const required = mergeRequired(nested.properties, nested.required, prop.required);
        if (required !== undefined)
            node.required = required;
    }
    return node;
}
/** 编译数组 items；对象元素展开为 properties/required/additionalProperties。 */
function compileItemsNode(items) {
    if (items.type === 'object') {
        const nested = compilePropertyMap(typeof items.properties === 'object' && items.properties !== null ? items.properties : {});
        const required = mergeRequired(nested.properties, nested.required, items.required);
        return {
            type: 'object',
            properties: nested.properties,
            additionalProperties: items.additionalProperties === false ? false : true,
            ...(required !== undefined ? { required } : {}),
        };
    }
    const node = { type: typeof items.type === 'string' ? items.type : 'string' };
    if (typeof items.description === 'string')
        node.description = items.description;
    if (Array.isArray(items.enum) && items.enum.length > 0)
        node.enum = items.enum.slice();
    return node;
}
/** 合并嵌套对象 required：既接受 properties 里的 required: true，也接受节点上的 required: string[]。 */
function mergeRequired(properties, fromProperties, explicit) {
    const required = fromProperties === undefined ? [] : [...fromProperties];
    if (Array.isArray(explicit)) {
        for (const key of explicit) {
            if (typeof key === 'string' && Object.hasOwn(properties, key) && !required.includes(key))
                required.push(key);
        }
    }
    return required.length > 0 ? required : undefined;
}
/** 编译属性表；支持 per-property required: true 与顶层 required: string[] 两种写法。 */
function compilePropertyMap(spec) {
    const properties = {};
    const required = [];
    const structural = new Set(['type', 'properties', 'additionalProperties', 'required', 'items', 'enum', 'description', 'oneOf']);
    const explicitRequired = Array.isArray(spec.required)
        ? spec.required.filter((key) => typeof key === 'string')
        : [];
    for (const [key, prop] of Object.entries(spec)) {
        if (structural.has(key))
            continue;
        if (typeof prop !== 'object' || prop === null)
            continue;
        if (prop.required === true && !required.includes(key))
            required.push(key);
        properties[key] = compileValueNode(prop);
    }
    for (const key of explicitRequired) {
        if (key in properties && !required.includes(key))
            required.push(key);
    }
    return required.length > 0 ? { properties, required } : { properties };
}
/** 编译工具 parameters；根类型固定为对象。 */
function compileParameters(spec) {
    const compiled = compilePropertyMap(spec);
    return { type: 'object', properties: compiled.properties, ...(compiled.required !== undefined ? { required: compiled.required } : {}) };
}
function asRecord(value) {
    return typeof value === 'object' && value !== null ? value : {};
}
function optionalString(args, key) {
    const value = args[key];
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}
function requiredString(args, key, label) {
    const value = optionalString(args, key);
    if (value === undefined)
        throw new Error(label + '（参数 ' + key + '）为必填，请提供非空字符串。');
    return value;
}
function stringArray(args, key) {
    const value = args[key];
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === 'string' && item.trim() !== '').map((item) => item.trim());
}
function clip(text, max) {
    return text.length > max ? text.slice(0, max) + '…（已截断）' : text;
}
function maskIfNeeded(cfg, text) {
    return cfg.maskSecrets ? maskSecrets(text) : text;
}
function knowledgeDirOf(cfg) {
    return join(cfg.journalDir, 'knowledge');
}
function knowledgeStoreOf(cfg) {
    return new KnowledgeStore(knowledgeDirOf(cfg), { maskSecrets: cfg.maskSecrets });
}
function sha256Short(value) {
    return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 32);
}
const LESSON_KINDS = ['preference', 'procedure', 'pitfall', 'fact'];
function parseLessonKind(args) {
    const value = optionalString(args, 'kind');
    if (value === undefined || !LESSON_KINDS.includes(value)) {
        throw new Error('kind 必须是 ' + LESSON_KINDS.join(' / ') + '。');
    }
    return value;
}
/** 解析模型传入的证据数组；projectId 由经验范围补齐，便于以后按项目核对。 */
function parseEvidenceArgs(args, key, projectId) {
    const raw = args[key];
    if (raw === undefined || raw === null)
        return [];
    if (!Array.isArray(raw))
        throw new Error('参数 ' + key + ' 必须是对象数组。');
    const out = [];
    raw.forEach((value, index) => {
        const item = asRecord(value);
        const kind = optionalString(item, 'kind');
        if (kind !== 'session' && kind !== 'user-correction' && kind !== 'local-artifact') {
            throw new Error(key + '[' + index + '].kind 必须是 session / user-correction / local-artifact。');
        }
        const summary = requiredString(item, 'summary', key + '[' + index + '].summary');
        const verification = optionalString(item, 'verification');
        if (verification !== 'read' && verification !== 'claimed') {
            throw new Error(key + '[' + index + '].verification 必须是 read / claimed。');
        }
        const sessionId = optionalString(item, 'sessionId');
        const recordSeqRaw = item.recordSeq;
        let recordSeq;
        if (typeof recordSeqRaw === 'number' && Number.isInteger(recordSeqRaw) && recordSeqRaw >= 0)
            recordSeq = recordSeqRaw;
        else if (typeof recordSeqRaw === 'string' && recordSeqRaw.trim() !== '')
            recordSeq = recordSeqRaw.trim();
        const entry = { kind, summary, verification };
        if (sessionId !== undefined)
            entry.sessionId = sessionId;
        if (recordSeq !== undefined)
            entry.recordSeq = recordSeq;
        if (projectId !== undefined)
            entry.projectId = projectId;
        out.push(entry);
    });
    return out;
}
function parseApplicability(args, key) {
    const raw = args[key];
    if (raw === undefined || raw === null)
        return undefined;
    if (!Array.isArray(raw))
        throw new Error('参数 ' + key + ' 必须是对象数组。');
    const out = [];
    raw.forEach((value) => {
        const item = asRecord(value);
        const entry = {};
        const pkg = optionalString(item, 'package');
        const versions = optionalString(item, 'versions');
        const platform = optionalString(item, 'platform');
        if (pkg !== undefined)
            entry.package = pkg;
        if (versions !== undefined)
            entry.versions = versions;
        if (platform !== undefined)
            entry.platform = platform;
        if (Object.keys(entry).length > 0)
            out.push(entry);
    });
    return out;
}
/** 证据对象数组的 schema 片段（dream_learn / dream_review 共用形状，各自新建避免引用共享）。 */
function evidenceItemsSpec() {
    return {
        type: 'object',
        properties: {
            kind: { type: 'string', enum: ['session', 'user-correction', 'local-artifact'], description: '证据来源类型。' },
            sessionId: { type: 'string', description: '会话 ID（session 证据建议提供）。' },
            recordSeq: { oneOf: [{ type: 'string' }, { type: 'integer' }], description: '记录序号（数字或字符串）。' },
            summary: { type: 'string', description: '已脱敏的一句话摘要。' },
            verification: { type: 'string', enum: ['read', 'claimed'], description: 'read=插件读到原记录；claimed=仅模型声称。' },
        },
        required: ['kind', 'summary', 'verification'],
    };
}
const baseSchema = { type: 'object', additionalProperties: true };
/** 构建六个做梦工具。 */
export function buildDreamTools(config) {
    const cfg = config;
    const dreamDigest = {
        name: 'dream_digest',
        description: '入梦：回放最近会话的梦原料。读取 DSH 会话日志（多帧 zstd），返回最近 N 个会话的标题、轮数、用户原话摘录、助手结论尾段与工具足迹；自动跳过子代理会话。拿到摘要后请反思并用 dream_save 记梦。',
        parameters: compileParameters({
            maxSessions: { type: 'integer', description: '回放会话数（可选，默认配置值，上限 50）。' },
            mode: { type: 'string', description: '摘要模式：full（默认，全量原料）/ brief（仅意图与结论，省 token）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const sessions = Array.isArray(rec.sessions) ? rec.sessions : [];
                const lines = ['梦原料：最近 ' + sessions.length + ' 个会话'];
                for (const item of sessions) {
                    const s = asRecord(item);
                    lines.push('- ' + (s.title !== '' ? s.title : '(无标题)') + '：' + s.turns + ' 轮，目录 ' + s.cwd);
                    // execute already masks secrets and applies the full/brief character budget.
                    if (typeof s.digestText === 'string' && s.digestText !== '')
                        lines.push(s.digestText);
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const maxRaw = args.maxSessions;
            const max = typeof maxRaw === 'number' && Number.isInteger(maxRaw) ? Math.min(50, Math.max(1, maxRaw)) : cfg.maxSessions;
            const mode = optionalString(args, 'mode') === 'brief' ? 'brief' : 'full';
            const mask = (text) => cfg.maskSecrets ? maskSecrets(text) : text;
            const files = listSessionFiles(cfg.sessionsRoot, max * 3);
            const sessions = [];
            for (const file of files) {
                if (sessions.length >= max)
                    break;
                const digest = digestSessionFile(file, cfg.maxUserMessages);
                if (digest === null)
                    continue;
                if (digest.origin === 'subagent')
                    continue;
                if (digest.turns === 0 && digest.userMessages.length === 0 && digest.assistantTail.length === 0
                    && digest.toolCalls.length === 0 && digest.streamTail.trim() === '')
                    continue;
                sessions.push({
                    id: digest.id,
                    title: mask(digest.title),
                    createdAt: digest.createdAt,
                    endedAt: digest.endedAt,
                    cwd: mask(digest.cwd),
                    turns: digest.turns,
                    agentPreset: mask(digest.agentPreset),
                    userMessages: digest.userMessages.map((msg) => clip(mask(msg), 400)),
                    assistantTail: digest.assistantTail.map((msg) => clip(mask(msg), 600)),
                    toolCalls: [...new Set(digest.toolCalls)].map(mask),
                    digestText: clip(mask(buildDigestText(digest)), mode === 'brief' ? 400 : cfg.maxCharsPerSession),
                });
            }
            return { count: sessions.length, sessions, mode };
        },
        timeoutMs: 120000,
    };
    const dreamSave = {
        name: 'dream_save',
        description: '记梦：把反思写入梦境日记（永久保存）。reflection 用第一人称写感悟；lessons 列 1-5 条以动词开头的可执行教训；mood 是本次梦的心境（如 平静/兴奋/存疑）。严禁写入密钥与隐私。',
        parameters: compileParameters({
            reflection: { type: 'string', required: true, description: '梦的反思正文（必填，第一人称）。' },
            lessons: { type: 'array', items: { type: 'string' }, description: '1-5 条教训（可选，每条以动词开头）。' },
            mood: { type: 'string', description: '心境（可选，默认 平静）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                return [{ type: 'text', text: '梦已记下（' + rec.id + '，' + rec.at + '），愿醒来时更聪明。' }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const reflection = requiredString(args, 'reflection', '梦境反思');
            const lessons = stringArray(args, 'lessons').slice(0, 5);
            const mood = optionalString(args, 'mood') ?? '';
            const entry = saveDream(cfg.journalDir, reflection, lessons, mood);
            return { ok: true, ...entry };
        },
        timeoutMs: 15000,
    };
    const dreamJournal = {
        name: 'dream_journal',
        description: '翻梦：倒序列出历史梦境日记（新梦在前）。做梦前先翻翻，避免重复做同一个梦。',
        parameters: compileParameters({
            limit: { type: 'integer', description: '条数上限 1-50（默认 10）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const dreams = Array.isArray(rec.dreams) ? rec.dreams : [];
                const lines = ['梦境日记共 ' + dreams.length + ' 条：'];
                for (const item of dreams) {
                    const d = asRecord(item);
                    lines.push('- [' + d.at + ']（' + d.mood + '）' + String(d.reflection ?? '').slice(0, 80));
                }
                const stats = asRecord(rec.stats);
                if (typeof stats.total === 'number' && stats.total > 0) {
                    const moods = stats.moods;
                    if (moods !== undefined) {
                        lines.push('· 心境分布：' + Object.entries(moods).map(([mood, n]) => mood + '×' + n).join('，'));
                    }
                    const top = Array.isArray(stats.topLessons) ? stats.topLessons : [];
                    if (top.length > 0) {
                        const first = asRecord(top[0]);
                        lines.push('· 最常梦到的教训：' + first.lesson + '（' + first.count + ' 次）');
                    }
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const limitRaw = args.limit;
            const limit = typeof limitRaw === 'number' && Number.isInteger(limitRaw) ? Math.min(50, Math.max(1, limitRaw)) : 10;
            const dreams = readDreams(cfg.journalDir, limit);
            return { count: dreams.length, dreams, stats: dreamStats(cfg.journalDir) };
        },
        timeoutMs: 15000,
    };
    const dreamRecall = {
        name: 'dream_recall',
        description: '忆梦：按关键词检索梦境日记（不区分大小写）。用户问起过往经验时先忆梦再回答。',
        parameters: compileParameters({
            query: { type: 'string', required: true, description: '关键词（必填）。' },
            limit: { type: 'integer', description: '命中上限 1-20（默认 5）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const dreams = Array.isArray(rec.dreams) ? rec.dreams : [];
                if (dreams.length === 0)
                    return [{ type: 'text', text: '没有梦到与「' + rec.query + '」相关的记忆。' }];
                const lines = ['忆起 ' + dreams.length + ' 个相关的梦：'];
                for (const item of dreams) {
                    const d = asRecord(item);
                    lines.push('- [' + d.at + '] ' + String(d.reflection ?? '').slice(0, 120));
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const query = requiredString(args, 'query', '搜索关键词');
            const limitRaw = args.limit;
            const limit = typeof limitRaw === 'number' && Number.isInteger(limitRaw) ? Math.min(20, Math.max(1, limitRaw)) : 5;
            const dreams = searchDreams(cfg.journalDir, query, limit);
            return { query, count: dreams.length, dreams };
        },
        timeoutMs: 15000,
    };
    const dreamBridge = {
        name: 'dream_bridge',
        description: '渡梦：把梦境日记里的高频教训合并进目标 AGENTS.md（幂等，带标记块，重复执行只更新块内内容）。让梦真正变成长期记忆。没有梦时会拒绝并提示先做梦。',
        parameters: compileParameters({
            path: { type: 'string', required: true, description: '目标文件路径（必填，通常是项目根 AGENTS.md）。' },
            maxLessons: { type: 'integer', description: '最多桥接教训条数 1-30（默认 10）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const actionText = rec.action === 'created' ? '新建了' : rec.action === 'replaced' ? '更新了' : '追加到了';
                return [{ type: 'text', text: '已把 ' + rec.lessonsCount + ' 条梦境教训桥接：' + actionText + ' ' + rec.path + '。梦醒之后，教训长存。' }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const targetPath = requiredString(args, 'path', '目标文件路径');
            const maxRaw = args.maxLessons;
            const maxLessons = typeof maxRaw === 'number' && Number.isInteger(maxRaw) ? Math.min(30, Math.max(1, maxRaw)) : 10;
            const result = bridgeDreams(cfg.journalDir, targetPath, maxLessons);
            return { ok: true, path: targetPath, ...result };
        },
        timeoutMs: 15000,
    };
    const dreamHealth = {
        name: 'dream_health',
        description: 'dsh-dream 自检：检查会话目录是否可读、梦境日记目录是否可用、梦境条数。遇到问题时先运行本工具定位。',
        parameters: compileParameters({}),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const checks = Array.isArray(rec.checks) ? rec.checks : [];
                const lines = ['dsh-dream 自检' + (rec.ok === true ? '：正常。' : '：发现问题。')];
                for (const item of checks) {
                    const c = asRecord(item);
                    lines.push('- ' + c.name + '：' + (c.ok === true ? '✅ ' + String(c.detail ?? '') : '❌ ' + String(c.detail ?? '')));
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute() {
            const checks = [];
            let ok = true;
            const sessionsOk = existsSync(cfg.sessionsRoot);
            checks.push({ name: '会话目录', ok: sessionsOk, detail: sessionsOk ? cfg.sessionsRoot : cfg.sessionsRoot + ' 不存在（DSH 尚未产生会话？）' });
            if (!sessionsOk)
                ok = false;
            const dreams = readDreams(cfg.journalDir, 1000);
            checks.push({ name: '梦境日记', ok: true, detail: '已做 ' + dreams.length + ' 个梦（' + cfg.journalDir + '）' });
            checks.push({ name: '摘要配置', ok: true, detail: 'maxSessions=' + cfg.maxSessions + '，maxCharsPerSession=' + cfg.maxCharsPerSession });
            return { ok, plugin: 'dsh-dream', checks };
        },
        timeoutMs: 15000,
    };
    const dreamLearn = {
        name: 'dream_learn',
        description: '学梦：把一条可复用经验连同证据提交为候选。必须写清 title（一句话结论）、action（可执行动作）、when（适用条件）与 exceptions（例外）；evidence 用 sessionId+recordSeq 或 sourceHash 定位来源，verification=read 表示插件读到原记录、claimed 表示仅模型声称（不计入独立支持）。无证据的经验只以 candidate 保存，不会当作已证实结论注入。模型不得伪造用户采纳。',
        parameters: compileParameters({
            kind: { type: 'string', required: true, enum: ['preference', 'procedure', 'pitfall', 'fact'], description: '经验类别。' },
            title: { type: 'string', required: true, description: '一句话结论；脱离 when 不得单独使用。' },
            action: { type: 'string', required: true, description: '可执行动作（动词开头）。' },
            when: { type: 'string', required: true, description: '适用条件（何时该用）；检索时不可截断。' },
            exceptions: { type: 'array', items: { type: 'string' }, description: '例外情形（可选）。' },
            projectId: { type: 'string', description: '项目 ID（可选）。' },
            workspaceRoot: { type: 'string', description: '项目工作区根目录（可选）。' },
            global: { type: 'boolean', description: '是否为显式全局经验（可选，默认 false）。' },
            applicability: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        package: { type: 'string', description: '依赖 / 工具名。' },
                        versions: { type: 'string', description: '适用版本范围（如 ^9.0.5）。' },
                        platform: { type: 'string', description: '平台。' },
                    },
                },
                description: '适用范围（可选）。',
            },
            evidence: { type: 'array', required: true, items: evidenceItemsSpec(), description: '证据数组，必填；可为空数组（此时只能保存为 candidate）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const lines = ['经验已提交：' + rec.lessonId + '（' + rec.state + '）'];
                lines.push(rec.created === true ? '· 新候选经验已保存。' : '· 已合并到既有经验，未新增记录。');
                lines.push('· 独立支持数：' + rec.independentSupportCount);
                const notes = Array.isArray(rec.notes) ? rec.notes : [];
                for (const note of notes)
                    lines.push('· ' + note);
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const kind = parseLessonKind(args);
            const title = maskIfNeeded(cfg, requiredString(args, 'title', '经验结论'));
            const action = maskIfNeeded(cfg, requiredString(args, 'action', '可执行动作'));
            const when = maskIfNeeded(cfg, requiredString(args, 'when', '适用条件'));
            const exceptions = stringArray(args, 'exceptions').map((item) => maskIfNeeded(cfg, item));
            const projectId = optionalString(args, 'projectId');
            const workspaceRoot = optionalString(args, 'workspaceRoot');
            const isGlobal = args.global === true;
            const applicability = parseApplicability(args, 'applicability');
            const maskedApplicability = applicability?.map((entry) => ({
                ...(entry.package !== undefined ? { package: maskIfNeeded(cfg, entry.package) } : {}),
                ...(entry.versions !== undefined ? { versions: maskIfNeeded(cfg, entry.versions) } : {}),
                ...(entry.platform !== undefined ? { platform: maskIfNeeded(cfg, entry.platform) } : {}),
            }));
            const evidenceInputs = parseEvidenceArgs(args, 'evidence', projectId)
                .map((entry) => ({ ...entry, summary: maskIfNeeded(cfg, entry.summary) }));
            const scope = {
                global: isGlobal,
                ...(projectId !== undefined ? { projectId } : {}),
                ...(workspaceRoot !== undefined ? { workspaceRoot } : {}),
            };
            const lessonInput = {
                kind,
                title,
                action,
                when,
                ...(exceptions.length > 0 ? { exceptions } : {}),
                ...(projectId !== undefined ? { projectId } : {}),
                ...(workspaceRoot !== undefined ? { workspaceRoot } : {}),
                global: isGlobal,
                ...(maskedApplicability !== undefined ? { applicability: maskedApplicability } : {}),
                evidence: evidenceInputs,
            };
            const idempotencyKey = 'dream_learn:' + sha256Short(JSON.stringify({
                kind, title, action, when, exceptions,
                projectId: projectId ?? null,
                workspaceRoot: workspaceRoot ?? null,
                global: isGlobal,
                applicability: maskedApplicability ?? null,
                evidence: evidenceInputs.map((entry) => ({
                    kind: entry.kind,
                    sessionId: entry.sessionId ?? null,
                    recordSeq: entry.recordSeq ?? null,
                    summary: entry.summary,
                    verification: entry.verification,
                })),
            }));
            const store = knowledgeStoreOf(cfg);
            const { lesson, created } = store.createLesson(lessonInput, idempotencyKey);
            const byId = new Map(store.listEvidence().map((item) => [item.id, item]));
            const evidence = lesson.evidenceIds
                .map((id) => byId.get(id))
                .filter((item) => item !== undefined)
                .map((item) => ({ id: item.id, verification: item.verification }));
            const notes = [];
            if (evidenceInputs.length === 0) {
                notes.push('无证据：仅保存为 candidate，不会作为已证实结论注入任务建议。');
            }
            else {
                const readCount = evidence.filter((item) => item.verification === 'read').length;
                const claimedCount = evidence.filter((item) => item.verification === 'claimed').length;
                notes.push('证据：' + readCount + ' 条已读（计入独立支持），' + claimedCount + ' 条仅声明（不计入独立支持）。');
            }
            if (!created)
                notes.push('已存在同指纹经验（' + lesson.id + '）：复用既有记录并合并新证据，未新增经验。');
            if (!isGlobal && projectId === undefined && workspaceRoot === undefined) {
                notes.push('未提供 projectId/workspaceRoot 且未声明 global：该经验不会自动注入任何项目。');
            }
            if (cfg.maskSecrets)
                notes.push('写入前已按 maskSecrets 脱敏。');
            const fingerprint = lessonFingerprint({ kind, title, action, when, scope });
            return {
                ok: true,
                lessonId: lesson.id,
                state: lesson.state,
                created,
                independentSupportCount: lesson.independentSupportCount,
                evidence,
                dedup: { ...(created ? {} : { merged: lesson.id }), fingerprint },
                notes,
            };
        },
        timeoutMs: 15000,
    };
    const dreamContext = {
        name: 'dream_context',
        description: '取梦：按当前任务返回少量真正适用的经验（只读，默认最多 5 条 / 3000 字符）。只返回 global 或与 projectId/workspaceRoot 精确匹配的经验；未知项目只返回 global，绝不跨项目扫描。rejected/stale/disputed 默认排除并在 skipped 说明原因；条件与例外完整返回，放不下整条跳过；没有相关经验时返回空数组。',
        parameters: compileParameters({
            query: { type: 'string', required: true, description: '当前任务描述或检索关键词。' },
            projectId: { type: 'string', description: '当前项目 ID（可选；未知时只返回 global）。' },
            workspaceRoot: { type: 'string', description: '当前工作区根目录（可选）。' },
            limit: { type: 'integer', description: '条数上限 1-20（默认 5）。' },
            maxChars: { type: 'integer', description: '字符预算 1-20000（默认 3000）。' },
            packageVersion: { type: 'string', description: '当前相关依赖版本（可选）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const items = Array.isArray(rec.items) ? rec.items : [];
                const budget = asRecord(rec.budget);
                if (items.length === 0) {
                    return [{ type: 'text', text: '没有与当前任务相关的经验（范围：' + rec.scopeLabel + '）。' }];
                }
                const lines = ['适用经验 ' + items.length + ' 条（范围：' + rec.scopeLabel + '，字符 ' + budget.usedChars + '/' + budget.maxChars + '）：'];
                for (const item of items) {
                    const lesson = asRecord(item);
                    lines.push('- [' + lesson.state + '｜' + lesson.scopeLabel + '] ' + lesson.title);
                    lines.push('  何时：' + lesson.when);
                    lines.push('  行动：' + lesson.action);
                    const exceptions = Array.isArray(lesson.exceptions) ? lesson.exceptions : [];
                    if (exceptions.length > 0)
                        lines.push('  例外：' + exceptions.join('；'));
                    lines.push('  为何相关：' + lesson.whyRelevant);
                    lines.push('  证据：' + lesson.evidenceSummary);
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const query = requiredString(args, 'query', '检索关键词');
            const projectId = optionalString(args, 'projectId');
            const workspaceRoot = optionalString(args, 'workspaceRoot');
            const packageVersion = optionalString(args, 'packageVersion');
            const { limit, maxChars } = resolveRetrievalBudget({
                limit: typeof args.limit === 'number' ? args.limit : undefined,
                maxChars: typeof args.maxChars === 'number' ? args.maxChars : undefined,
            });
            const retrievalQuery = {
                query,
                limit,
                maxChars,
                ...(projectId !== undefined ? { projectId } : {}),
                ...(workspaceRoot !== undefined ? { workspaceRoot } : {}),
                ...(packageVersion !== undefined ? { packageVersion } : {}),
            };
            const scopeLabel = queryScopeLabel(retrievalQuery);
            const dir = knowledgeDirOf(cfg);
            if (!existsSync(dir)) {
                return { items: [], skipped: [], scopeLabel, budget: { limit, maxChars, usedChars: 0 } };
            }
            const store = knowledgeStoreOf(cfg);
            const result = retrieveLessons(store.listLessons(), store.listEvidence(), retrievalQuery);
            const usedChars = result.items.reduce((total, item) => total + retrievedLessonChars(item), 0);
            return { items: result.items, skipped: result.skipped, scopeLabel, budget: { limit, maxChars, usedChars } };
        },
        timeoutMs: 15000,
    };
    const REVIEW_ACTIONS = ['accept', 'reject', 'mark-stale', 'mark-disputed', 'resolve-conflict', 'attach-evidence'];
    const dreamReview = {
        name: 'dream_review',
        description: '审梦：采纳/驳回/标记冲突或过期/追加验证证据，必须带 expectedRevision（revision 不符会拒绝且不写入）。模型调用 actor 一律记为 model，不得冒充用户采纳；attach-evidence 只追加证据，不自动改变 state。',
        parameters: compileParameters({
            action: { type: 'string', required: true, enum: [...REVIEW_ACTIONS], description: '审阅动作。' },
            lessonId: { type: 'string', required: true, description: '经验 ID。' },
            expectedRevision: { type: 'integer', required: true, description: '期望 revision（乐观锁，必须与当前一致）。' },
            evidence: { type: 'array', items: evidenceItemsSpec(), description: 'attach-evidence 时使用的证据数组。' },
            conflictWith: { type: 'array', items: { type: 'string' }, description: 'mark-disputed 记录冲突对象；resolve-conflict 时解除这些冲突 ID。' },
            note: { type: 'string', description: '备注（仅用于幂等键，不落盘为正文）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                return [{
                        type: 'text',
                        text: '经验 ' + asRecord(rec.lesson).id + '：' + rec.previousState + ' → ' + rec.state + '（revision ' + rec.revision + '）。',
                    }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const action = optionalString(args, 'action');
            if (action === undefined || !REVIEW_ACTIONS.includes(action)) {
                throw new Error('action 必须是 ' + REVIEW_ACTIONS.join(' / ') + '。');
            }
            const lessonId = requiredString(args, 'lessonId', '经验 ID');
            const revisionRaw = args.expectedRevision;
            if (typeof revisionRaw !== 'number' || !Number.isInteger(revisionRaw) || revisionRaw < 1) {
                throw new Error('expectedRevision 必须是 >= 1 的整数。');
            }
            const expectedRevision = revisionRaw;
            const store = knowledgeStoreOf(cfg);
            const before = store.getLesson(lessonId);
            if (before === undefined)
                throw new KnowledgeError('invalid', '经验不存在：' + lessonId);
            if (before.revision !== expectedRevision) {
                throw new KnowledgeError('revision', '经验 ' + lessonId + ' 期望 revision ' + expectedRevision + '，实际 ' + before.revision);
            }
            const conflictWith = stringArray(args, 'conflictWith');
            const note = optionalString(args, 'note');
            const idempotencyKey = 'dream_review:' + sha256Short(JSON.stringify({
                action, lessonId, expectedRevision, conflictWith, note: note ?? null,
            }));
            // 模型调用永远记为 model；入参里的 actor 一律忽略（用户采纳只能来自宿主授权的真实用户指令）。
            const actor = 'model';
            let lesson;
            switch (action) {
                case 'accept':
                    lesson = store.reviewLesson(lessonId, 'accepted', expectedRevision, idempotencyKey, actor);
                    break;
                case 'reject':
                    lesson = store.reviewLesson(lessonId, 'rejected', expectedRevision, idempotencyKey, actor);
                    break;
                case 'mark-stale':
                    lesson = store.applyTransition(lessonId, 'stale', expectedRevision, idempotencyKey);
                    break;
                case 'mark-disputed': {
                    if (conflictWith.length === 0) {
                        lesson = store.applyTransition(lessonId, 'disputed', expectedRevision, idempotencyKey);
                    }
                    else {
                        const conflictIds = [...before.conflictIds];
                        for (const id of conflictWith) {
                            if (!conflictIds.includes(id))
                                conflictIds.push(id);
                        }
                        lesson = store.updateLesson(lessonId, { state: 'disputed', conflictIds }, expectedRevision, idempotencyKey);
                    }
                    break;
                }
                case 'resolve-conflict': {
                    if (conflictWith.length === 0) {
                        lesson = store.applyTransition(lessonId, 'usable', expectedRevision, idempotencyKey);
                    }
                    else {
                        const conflictIds = before.conflictIds.filter((id) => !conflictWith.includes(id));
                        lesson = store.updateLesson(lessonId, { state: 'usable', conflictIds }, expectedRevision, idempotencyKey);
                    }
                    break;
                }
                case 'attach-evidence': {
                    const inputs = parseEvidenceArgs(args, 'evidence', before.scope.projectId);
                    if (inputs.length === 0)
                        throw new Error('attach-evidence 需要至少一条 evidence。');
                    const masked = inputs.map((entry) => ({ ...entry, summary: maskIfNeeded(cfg, entry.summary) }));
                    const appended = masked.map((entry) => store.appendEvidence(entry));
                    const evidenceIds = [...before.evidenceIds];
                    for (const item of appended) {
                        if (!evidenceIds.includes(item.evidence.id))
                            evidenceIds.push(item.evidence.id);
                    }
                    if (evidenceIds.length === before.evidenceIds.length) {
                        lesson = before;
                    }
                    else {
                        lesson = store.updateLesson(lessonId, { evidenceIds }, expectedRevision, idempotencyKey);
                    }
                    break;
                }
                default:
                    throw new Error('不支持的动作：' + action);
            }
            return { ok: true, lesson, previousState: before.state, state: lesson.state, revision: lesson.revision };
        },
        timeoutMs: 15000,
    };
    return [dreamDigest, dreamSave, dreamJournal, dreamRecall, dreamBridge, dreamHealth, dreamLearn, dreamContext, dreamReview];
}
/** 把会话摘要拼成一段可读文本（供模型一次性阅读）。 */
export function buildDigestText(digest) {
    const lines = [];
    lines.push('会话：' + (digest.title !== '' ? digest.title : '(无标题)') + '（' + digest.turns + ' 轮，' + digest.cwd + '）');
    if (digest.userMessages.length > 0) {
        lines.push('用户说：');
        for (const msg of digest.userMessages)
            lines.push('  > ' + msg.replace(/\n/g, ' ').slice(0, 200));
    }
    if (digest.assistantTail.length > 0) {
        lines.push('最终回应：');
        for (const msg of digest.assistantTail)
            lines.push('  < ' + msg.replace(/\n/g, ' ').slice(0, 300));
    }
    else if (digest.streamTail !== '') {
        lines.push('最终回应（流式还原）：');
        lines.push('  < ' + digest.streamTail.slice(-600).replace(/\n/g, ' '));
    }
    if (digest.toolCalls.length > 0) {
        lines.push('工具足迹：' + [...new Set(digest.toolCalls)].slice(0, 30).join(', '));
    }
    return lines.join('\n');
}
