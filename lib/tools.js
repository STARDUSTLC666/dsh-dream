/**
 * 面向模型的做梦工具：dream_digest / dream_save / dream_journal / dream_recall / dream_bridge / dream_health
 * 与 M1 新增的 dream_learn / dream_context / dream_review。
 *
 * @module dsh-dream/tools
 */
import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { maskSecrets } from './mask.js';
import { dreamStats, readDreams, saveDream, searchDreams } from './journal.js';
import { applyBridge, bridgeDreams, previewBridge, rollbackBridge, selectBridgeLessons, } from './bridge.js';
import { digestSessionFile, listSessionFiles } from './sessions.js';
import { KnowledgeError, lessonFingerprint, } from './knowledge.js';
import { KnowledgeStore } from './knowledge-store.js';
import { verifyEvidence } from './evidence.js';
import { queryScopeLabel, resolveRetrievalBudget, retrieveLessons, retrievedLessonChars, taskPlatform, } from './retrieval.js';
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
function execCwdOf(exec) {
    const root = asRecord(exec);
    const candidates = [asRecord(asRecord(root.agent).session), asRecord(root.session), root];
    for (const candidate of candidates) {
        const cwd = candidate.cwd;
        if (typeof cwd === 'string' && cwd.trim() !== '')
            return cwd.trim();
    }
    return undefined;
}
/** 软链/junction 场景：跟随链接后的真实写入路径（与 bridge resolveBridgeTarget 同口径）。 */
function resolvedBridgePath(projectRoot, explicitPath) {
    try {
        const lexical = explicitPath !== undefined ? resolve(projectRoot, explicitPath) : join(projectRoot, 'AGENTS.md');
        if (existsSync(lexical))
            return realpathSync(lexical);
        return join(realpathSync(dirname(lexical)), basename(lexical));
    }
    catch {
        return undefined;
    }
}
/** 合并 bridge 自身 skipped 与工具层前置校验 skipped（按 lessonId 去重，bridge 结果优先）。 */
function mergeSkipped(primary, extra) {
    const out = [...primary];
    const seen = new Set(primary.map((entry) => entry.lessonId));
    for (const entry of extra) {
        if (seen.has(entry.lessonId))
            continue;
        seen.add(entry.lessonId);
        out.push(entry);
    }
    return out;
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
        for (const key of ['quote', 'sourceHash', 'artifactPath']) {
            const value = optionalString(item, key);
            if (value !== undefined)
                entry[key] = value;
        }
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
            quote: { type: 'string', description: '来源可见正文中的原文片段；摘要为转述时必填。引用原文只用于核验，不持久化。' },
            sourceHash: { type: 'string', description: '可选的来源 SHA-256；插件自行计算并核对，不能只凭此值证明来源。' },
            artifactPath: { type: 'string', description: 'local-artifact 的文本路径；只能读取宿主当前工作区内文件。' },
            verification: { type: 'string', enum: ['read', 'claimed'], description: 'read=请求插件核验引用；找不到或不匹配自动降为 claimed。读取不代表用户采纳。' },
        },
        required: ['kind', 'summary', 'verification'],
    };
}
/** 冲突组校验：primary + conflictWith 全部存在、无自身/重复；任何写前完成。 */
function requireConflictGroup(store, lessonId, primary, conflictWith) {
    const group = [lessonId];
    for (const id of conflictWith) {
        if (id === lessonId)
            throw new KnowledgeError('invalid', 'conflictWith 不得包含 lessonId 自身：' + id);
        if (group.includes(id))
            throw new KnowledgeError('invalid', 'conflictWith 存在重复 id：' + id);
        group.push(id);
    }
    return group.map((id) => {
        const lesson = id === lessonId ? primary : store.getLesson(id);
        if (lesson === undefined)
            throw new KnowledgeError('invalid', '冲突对象不存在：' + id);
        return { id, lesson };
    });
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
        description: '渡梦（M2）：把已采纳且适用的经验桥接进项目 AGENTS.md 的 Dream 管理块（<!-- dsh-dream:start -->…<!-- dsh-dream:end -->），块外内容原样保留。mode:"preview" 只读看 diff；复核后 mode:"apply" 必须带 preview.expected.sha256（文件变了会 conflict 零写入）；mode:"rollback" 带 backupId 恢复。缺省 mode 为 legacy 直写（已弃用，响应含 deprecation 提示）。资格：经验 state=usable，且 scope 与当前项目匹配（目标目录 realpath / 显式 projectId / global 且已采纳），频次不作准入。',
        parameters: compileParameters({
            mode: { type: 'string', enum: ['preview', 'apply', 'rollback'], description: 'preview=只读预览；apply=带 expectedSha256 落盘；rollback=按 backupId 恢复。缺省=legacy 直写（弃用）。' },
            path: { type: 'string', description: '目标文件（可选；缺省为执行上下文 cwd 下的 AGENTS.md，取不到 cwd 会报错不猜）。' },
            lessonIds: { type: 'array', items: { type: 'string' }, description: '参与桥接的经验 id（必须 usable 且 scope 匹配；缺省=按 store 顺序自动选取资格通过者）。' },
            maxLessons: { type: 'integer', description: '经验上限：M2 模式默认 5、硬上限 20；legacy 模式默认 10、上限 30。' },
            expectedSha256: { oneOf: [{ type: 'string' }, { type: 'null' }], description: 'apply 必填：preview.expected.sha256 原样回传；新文件用 null；不符则 conflict 零写入。' },
            previewId: { type: 'string', description: 'apply 可带：preview.previewId，用于校验是同一份预览；块内容不一致 → preview-mismatch，需重新 preview。' },
            backupId: { type: 'string', description: 'rollback 必填：apply 成功返回的 backupId。' },
            projectId: { type: 'string', description: '当前项目 id（可选；用于匹配只带 projectId 的经验，纯增量）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const mode = rec.mode;
                if (rec.ok === false) {
                    const failure = asRecord(rec.error);
                    return [{ type: 'text', text: '桥接失败（' + (typeof mode === 'string' ? mode : 'legacy') + '）：' + failure.code + ' ' + failure.message }];
                }
                if (mode === 'preview') {
                    const lessons = Array.isArray(rec.lessons) ? rec.lessons : [];
                    const skipped = Array.isArray(rec.skipped) ? rec.skipped : [];
                    const expected = asRecord(rec.expected);
                    const lines = ['桥接预览（' + rec.action + '）：' + lessons.length + ' 条经验，当前 sha256=' + expected.sha256 + '，previewId=' + rec.previewId];
                    for (const item of lessons) {
                        const lesson = asRecord(item);
                        lines.push('- [' + lesson.lessonId + '@' + lesson.revision + '] ' + lesson.title);
                    }
                    for (const item of skipped) {
                        const entry = asRecord(item);
                        lines.push('· 跳过 ' + entry.lessonId + '：' + entry.reason);
                    }
                    const diff = typeof rec.diff === 'string' ? rec.diff : '';
                    if (diff !== '')
                        lines.push('', clip(diff, 2000));
                    return [{ type: 'text', text: lines.join('\n') }];
                }
                if (mode === 'apply') {
                    if (rec.unchanged === true)
                        return [{ type: 'text', text: '桥接未变更：管理块内容已一致，字节未写。' }];
                    return [{ type: 'text', text: '桥接已应用：' + rec.path + '，backupId=' + rec.backupId + '。' + (typeof rec.warning === 'string' ? '\n' + rec.warning : '') }];
                }
                if (mode === 'rollback') {
                    return [{ type: 'text', text: '桥接已回滚：' + rec.path + '，backupId=' + rec.backupId + '。' }];
                }
                const actionText = rec.action === 'created' ? '新建了' : rec.action === 'replaced' ? '更新了' : '追加到了';
                const deprecation = asRecord(rec.deprecation);
                const deprecationText = typeof deprecation.message === 'string' && deprecation.message !== '' ? '（' + deprecation.message + '）' : '';
                return [{ type: 'text', text: '已把 ' + rec.lessonsCount + ' 条梦境教训桥接：' + actionText + ' ' + rec.path + '。' + deprecationText }];
            },
        },
        async execute(rawArgs, exec) {
            const args = asRecord(rawArgs);
            const mode = optionalString(args, 'mode');
            if (mode !== undefined && mode !== 'preview' && mode !== 'apply' && mode !== 'rollback') {
                throw new Error('mode 必须是 preview / apply / rollback（缺省为 legacy 直写）。');
            }
            const explicitPath = optionalString(args, 'path');
            const cwd = execCwdOf(exec);
            let projectRoot;
            if (explicitPath !== undefined) {
                projectRoot = cwd ?? dirname(resolve(explicitPath));
            }
            else {
                if (cwd === undefined) {
                    throw new Error('未提供 path 且无法从执行上下文取得 cwd：无法定位项目内 AGENTS.md，请显式传 path。');
                }
                projectRoot = cwd;
            }
            const resolvedPath = resolvedBridgePath(projectRoot, explicitPath);
            const maxRaw = args.maxLessons;
            const legacyMax = typeof maxRaw === 'number' && Number.isInteger(maxRaw) ? Math.min(30, Math.max(1, maxRaw)) : 10;
            if (mode === undefined) {
                const legacyTarget = explicitPath !== undefined ? resolve(explicitPath) : join(projectRoot, 'AGENTS.md');
                const legacyResult = bridgeDreams(cfg.journalDir, legacyTarget, legacyMax);
                return {
                    ok: true,
                    path: legacyTarget,
                    ...(resolvedPath !== undefined ? { resolvedPath } : {}),
                    ...legacyResult,
                    deprecation: {
                        code: 'legacy-write',
                        message: '缺省 mode 为 legacy 直写（已弃用）；建议改用 mode:"preview" → 复核 diff → mode:"apply" + expectedSha256（并带同一 previewId）。',
                    },
                };
            }
            const maxLessons = typeof maxRaw === 'number' && Number.isInteger(maxRaw) ? maxRaw : undefined;
            const lessonIds = stringArray(args, 'lessonIds');
            const projectId = optionalString(args, 'projectId');
            const store = knowledgeStoreOf(cfg);
            const lessons = store.listLessons();
            if (mode === 'rollback') {
                const backupId = requiredString(args, 'backupId', 'backupId');
                const result = rollbackBridge({
                    journalDir: cfg.journalDir,
                    projectRoot,
                    ...(explicitPath !== undefined ? { path: explicitPath } : {}),
                    backupId,
                });
                if (result.ok === true)
                    return { mode, ...result, resolvedPath: result.path };
                return { mode, ...result, ...(resolvedPath !== undefined ? { resolvedPath } : {}) };
            }
            // 工具层前置资格校验 + 合并 skipped（bridge 层会再兜一次）。
            const preSelection = selectBridgeLessons(lessons, { projectId, workspaceRoot: projectRoot }, {
                ...(lessonIds.length > 0 ? { lessonIds } : {}),
                ...(maxLessons !== undefined ? { maxLessons } : {}),
            });
            const bridgeOptions = {
                journalDir: cfg.journalDir,
                projectRoot,
                ...(explicitPath !== undefined ? { path: explicitPath } : {}),
                lessons,
                ...(projectId !== undefined ? { projectId } : {}),
                workspaceRoot: projectRoot,
                ...(lessonIds.length > 0 ? { lessonIds } : {}),
                ...(maxLessons !== undefined ? { maxLessons } : {}),
                maskSecrets: cfg.maskSecrets,
            };
            if (mode === 'preview') {
                const result = previewBridge(bridgeOptions);
                return {
                    mode,
                    ...result,
                    ...(resolvedPath !== undefined ? { resolvedPath } : {}),
                    skipped: mergeSkipped(result.ok === true ? result.skipped : [], preSelection.skipped),
                };
            }
            if (!Object.hasOwn(args, 'expectedSha256') || (args.expectedSha256 !== null && (typeof args.expectedSha256 !== 'string' || args.expectedSha256.trim() === ''))) {
                throw new Error('apply 必须提供 expectedSha256：原样回传 preview.expected.sha256（文件不存在时为 null）。');
            }
            const expectedSha256 = args.expectedSha256;
            const previewId = optionalString(args, 'previewId');
            const result = applyBridge({
                ...bridgeOptions,
                expectedSha256,
                ...(previewId !== undefined ? { previewId } : {}),
            });
            if (result.ok === true) {
                return {
                    mode,
                    ...result,
                    resolvedPath: result.path,
                    skipped: mergeSkipped(result.skipped, preSelection.skipped),
                };
            }
            return {
                mode,
                ...result,
                ...(resolvedPath !== undefined ? { resolvedPath } : {}),
                skipped: mergeSkipped([], preSelection.skipped),
            };
        },
        timeoutMs: 30000,
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
        description: '学梦：把一条可复用经验连同证据提交为候选。写清 title（一句话结论）、action（可执行动作）、when（适用条件）与 exceptions（例外）；会话证据需 sessionId+recordSeq 和可匹配的 quote（省略时用 summary），本地产物需当前工作目录内的 artifactPath。verification=read 必须通过插件实际核验；失败降为 claimed 并说明原因，不计独立支持。新经验均先留在 candidate，读到来源不代表用户采纳。',
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
            evidence: { type: 'array', items: evidenceItemsSpec(), description: '证据数组（可选，缺省为空数组；无证据时只能保存为 candidate）。' },
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
        async execute(rawArgs, exec) {
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
                .map((entry) => verifyEvidence(entry, { sessionsRoot: cfg.sessionsRoot, projectId, workspaceRoot, cwd: execCwdOf(exec) }))
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
                    sourceHash: entry.sourceHash ?? null,
                })),
            }));
            const store = knowledgeStoreOf(cfg);
            const { lesson, created } = store.createLesson(lessonInput, idempotencyKey, { requireReview: true });
            const byId = new Map(store.listEvidence().map((item) => [item.id, item]));
            const evidence = lesson.evidenceIds
                .map((id) => byId.get(id))
                .filter((item) => item !== undefined)
                .map((item) => ({ id: item.id, verification: item.verification, ...(item.verificationReason ? { verificationReason: item.verificationReason } : {}) }));
            const notes = [];
            if (evidenceInputs.length === 0) {
                notes.push('无证据：仅保存为 candidate，不会作为已证实结论注入任务建议。');
            }
            else {
                const readCount = evidence.filter((item) => item.verification === 'read').length;
                const claimedCount = evidence.filter((item) => item.verification === 'claimed').length;
                notes.push('证据：' + readCount + ' 条已读（计入独立支持），' + claimedCount + ' 条仅声明（不计入独立支持）。');
            }
            if (evidenceInputs.some((item) => item.verification === 'claimed' && item.verificationReason !== 'model-claimed'))
                notes.push('部分来源未能核验，已保留为仅声明；请补充真实 sessionId/recordSeq、原文 quote 或当前工作区内 artifactPath。');
            if (created)
                notes.push('来源读取不等于结论成立或用户采纳；新经验仍需审阅。');
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
        description: '取梦：按当前任务返回少量真正适用的经验（只读，默认最多 5 条 / 3000 字符）。只返回 global 或与 projectId/workspaceRoot 精确匹配的经验；未知项目只返回 global，绝不跨项目扫描。rejected/stale/disputed 默认排除；候选默认不注入（candidate-hold），无独立证据且非 usable 不注入（no-evidence），版本条件与包名不符不注入（version-mismatch），skipped 均给原因。未审阅候选不得当作已证实结论；只有明确审阅候选时才传 includeCandidates=true。when/exceptions 完整保留，元数据可按预算截断，预算放不下即停。',
        parameters: compileParameters({
            query: { type: 'string', required: true, description: '当前任务描述或检索关键词。' },
            projectId: { type: 'string', description: '当前项目 ID（可选；未知时只返回 global）。' },
            workspaceRoot: { type: 'string', description: '当前工作区根目录（可选）。' },
            limit: { type: 'integer', description: '条数上限 1-20（默认 5）。' },
            maxChars: { type: 'integer', description: '字符预算 1-20000（默认 3000）。' },
            packageVersion: { type: 'string', description: '当前相关依赖版本（可选；需配合包名被识别才参与版本判定）。' },
            packageName: { type: 'string', description: '当前相关依赖包名（可选；与 query 文本一起识别 applicability.package）。' },
            platform: { type: 'string', description: '任务目标平台（windows / linux / macos 等）；缺省从任务文本识别，否则使用宿主系统。平台不符的经验不注入。' },
            includeCandidates: { type: 'boolean', description: '是否把候选经验纳入任务建议（默认 false；仅明确审阅候选时传 true，无证据候选仍不注入）。' },
        }),
        output: {
            schema: baseSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const items = Array.isArray(rec.items) ? rec.items : [];
                const budget = asRecord(rec.budget);
                if (items.length === 0) {
                    const skipped = Array.isArray(rec.skipped) ? rec.skipped : [];
                    const countReason = (reason) => skipped.filter((entry) => asRecord(entry).reason === reason).length;
                    const hints = [];
                    const held = countReason('candidate-hold');
                    const noEvidence = countReason('no-evidence');
                    const mismatched = countReason('version-mismatch');
                    if (held > 0)
                        hints.push(held + ' 条候选待审阅（要审阅候选时显式传 includeCandidates=true）');
                    if (noEvidence > 0)
                        hints.push(noEvidence + ' 条无独立证据不注入');
                    if (mismatched > 0)
                        hints.push(mismatched + ' 条版本条件不匹配不注入');
                    const suffix = hints.length > 0 ? '；' + hints.join('；') : '';
                    return [{ type: 'text', text: '没有可注入的适用经验（范围：' + rec.scopeLabel + suffix + '）。' }];
                }
                const lines = ['适用经验 ' + items.length + ' 条（范围：' + rec.scopeLabel + '，字符 ' + budget.usedChars + '/' + budget.maxChars + '）：'];
                for (const item of items) {
                    const lesson = asRecord(item);
                    const truncation = lesson.truncated === true ? '｜元数据截断' : '';
                    lines.push('- [' + lesson.state + '｜' + lesson.scopeLabel + '｜rev ' + lesson.revision + truncation + '] ' + lesson.title);
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
            const packageName = optionalString(args, 'packageName');
            const { limit, maxChars } = resolveRetrievalBudget({
                limit: typeof args.limit === 'number' ? args.limit : undefined,
                maxChars: typeof args.maxChars === 'number' ? args.maxChars : undefined,
            });
            const retrievalQuery = {
                query,
                platform: taskPlatform(query, optionalString(args, 'platform'), process.platform),
                limit,
                maxChars,
                // R1：默认不注入候选；claimed-only / 无证据且非 usable 的条目也不注入（R1 附带规则）。
                includeCandidates: args.includeCandidates === true,
                includeNoEvidence: false,
                ...(projectId !== undefined ? { projectId } : {}),
                ...(workspaceRoot !== undefined ? { workspaceRoot } : {}),
                ...(packageVersion !== undefined ? { packageVersion } : {}),
                ...(packageName !== undefined ? { packageName } : {}),
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
    const dreamReview = {
        name: 'dream_review',
        description: '审梦：采纳/驳回/标记冲突或过期/追加验证证据，必须带 expectedRevision（revision 不符会拒绝且不写入）。模型调用 actor 一律记为 model，不得冒充用户采纳；attach-evidence 只追加证据，不自动改变 state。',
        parameters: compileParameters({
            action: { type: 'string', required: true, enum: [...REVIEW_ACTIONS], description: '审阅动作。' },
            lessonId: { type: 'string', description: '经验 ID（accept/reject/mark-*/attach-evidence 必填；resolve-conflict 可用 targetId 替代）。' },
            targetId: { type: 'string', description: 'resolve-conflict：目标经验 ID（优先于 lessonId）。' },
            affectedIds: { type: 'array', items: { type: 'string' }, description: 'resolve-conflict：受影响/对方经验 ID（缺省则用 conflictWith）。' },
            expectedRevision: { type: 'integer', required: true, description: '期望 revision（乐观锁，必须与当前一致）。' },
            evidence: { type: 'array', items: evidenceItemsSpec(), description: 'attach-evidence 时使用的证据数组。' },
            conflictWith: { type: 'array', items: { type: 'string' }, description: 'mark-disputed：冲突对方 id 列表（双方互相登记且全部置 disputed）；resolve-conflict：要一起解析的对方 id（必须与之互为 conflictIds）。' },
            resolution: { type: 'string', enum: ['prefer', 'drop', 'merge'], description: 'resolve-conflict 必填：prefer=以 lessonId 为准；drop=放弃 lessonId；merge=并入 lessonId（对方 stale）。' },
            note: { type: 'string', description: 'resolve-conflict 必填的解析依据；mark-disputed 可选。' },
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
        async execute(rawArgs, exec) {
            return executeDreamReview(cfg, rawArgs, exec, 'model');
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
const REVIEW_ACTIONS = ['accept', 'reject', 'reopen', 'mark-stale', 'mark-disputed', 'resolve-conflict', 'attach-evidence'];
/** actor comes from the trusted caller, never from tool or browser arguments. */
export async function executeDreamReview(cfg, rawArgs, exec, actor = 'model') {
    const args = asRecord(rawArgs);
    const action = optionalString(args, 'action');
    if (action === undefined || !REVIEW_ACTIONS.includes(action)) {
        throw new Error('action 必须是 ' + REVIEW_ACTIONS.join(' / ') + '。');
    }
    const targetId = optionalString(args, 'targetId');
    const lessonIdArg = optionalString(args, 'lessonId');
    const lessonId = targetId ?? lessonIdArg;
    if (lessonId === undefined) {
        throw new KnowledgeError('invalid', '缺少 lessonId（resolve-conflict 可用 targetId）。');
    }
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
        const error = new KnowledgeError('revision', '经验 ' + lessonId + ' 期望 revision ' + expectedRevision + '，实际 ' + before.revision);
        error.currentRevision = before.revision;
        error.details = { currentRevision: before.revision };
        throw error;
    }
    const affectedIdsArg = stringArray(args, 'affectedIds');
    const conflictWith = affectedIdsArg.length > 0 ? affectedIdsArg : stringArray(args, 'conflictWith');
    const note = optionalString(args, 'note');
    const maskedNote = note === undefined ? undefined : maskIfNeeded(cfg, note);
    const resolutionArg = optionalString(args, 'resolution');
    const evidenceInputs = action === 'attach-evidence'
        ? parseEvidenceArgs(args, 'evidence', before.scope.projectId).map(entry => verifyEvidence(entry, {
            sessionsRoot: cfg.sessionsRoot, projectId: before.scope.projectId, workspaceRoot: before.scope.workspaceRoot, cwd: execCwdOf(exec),
        })).map(entry => ({ ...entry, summary: maskIfNeeded(cfg, entry.summary) }))
        : [];
    const idempotencyKey = 'dream_review:' + sha256Short(JSON.stringify({
        actor, action, lessonId, expectedRevision, conflictWith, resolution: resolutionArg ?? null, note: maskedNote ?? null,
        evidence: evidenceInputs,
    }));
    let lesson;
    switch (action) {
        case 'accept':
            lesson = store.reviewLesson(lessonId, 'accepted', expectedRevision, idempotencyKey, actor);
            break;
        case 'reject':
            lesson = store.reviewLesson(lessonId, 'rejected', expectedRevision, idempotencyKey, actor);
            break;
        case 'reopen':
            if (before.state !== 'rejected')
                throw new KnowledgeError('invalid', 'reopen 只用于把已驳回经验重新送审。');
            lesson = store.reviewLesson(lessonId, 'unreviewed', expectedRevision, idempotencyKey, actor);
            break;
        case 'mark-stale':
            lesson = actor === 'human'
                ? store.updateLesson(lessonId, { state: 'stale', review: { ...before.review, actor, at: new Date().toISOString(), ...(maskedNote === undefined ? {} : { note: maskedNote }) } }, expectedRevision, idempotencyKey)
                : store.applyTransition(lessonId, 'stale', expectedRevision, idempotencyKey);
            break;
        case 'attach-evidence':
            lesson = store.attachEvidence(lessonId, evidenceInputs, expectedRevision, idempotencyKey);
            break;
        case 'mark-disputed': {
            // M2：primary 与所有 conflictWith 一律置 disputed，双方 conflictIds 互相登记（去重、可多对多）。
            const members = requireConflictGroup(store, lessonId, before, conflictWith);
            const group = members.map((member) => member.id);
            const updates = [];
            for (const member of members) {
                const others = group.filter((id) => id !== member.id);
                const conflictIds = [...member.lesson.conflictIds];
                for (const id of others) {
                    if (!conflictIds.includes(id))
                        conflictIds.push(id);
                }
                const noteSatisfied = maskedNote === undefined || member.lesson.review.note === maskedNote;
                const alreadyDisputed = member.lesson.state === 'disputed'
                    && conflictIds.length === member.lesson.conflictIds.length
                    && conflictIds.every((id) => member.lesson.conflictIds.includes(id))
                    && noteSatisfied;
                if (alreadyDisputed)
                    continue;
                const patch = { state: 'disputed', conflictIds };
                if (maskedNote !== undefined)
                    patch.review = { ...member.lesson.review, note: maskedNote };
                updates.push({ id: member.id, patch, expectedRevision: member.lesson.revision });
            }
            lesson = updates.length === 0 ? before : store.updateLessonsBatch(updates, idempotencyKey).find(item => item.id === lessonId) ?? before;
            break;
        }
        case 'resolve-conflict': {
            const resolution = optionalString(args, 'resolution');
            if (resolution !== 'prefer' && resolution !== 'drop' && resolution !== 'merge') {
                throw new KnowledgeError('invalid', 'resolution 必须是 prefer / drop / merge。');
            }
            if (maskedNote === undefined) {
                throw new KnowledgeError('invalid', 'resolve-conflict 必须带 note（解析依据），以便事件可回溯。');
            }
            if (conflictWith.length === 0) {
                throw new KnowledgeError('invalid', 'resolve-conflict 必须带至少一个 affectedIds/conflictWith 目标 id。');
            }
            const members = requireConflictGroup(store, lessonId, before, conflictWith);
            const group = members.map((member) => member.id);
            // 校验：所有当事方必须 disputed，且互相登记 conflictIds；否则零写入。
            for (const member of members) {
                if (member.lesson.state !== 'disputed') {
                    throw new KnowledgeError('invalid', '冲突解析要求 ' + member.id + ' 处于 disputed（实际 ' + member.lesson.state + '）');
                }
                for (const other of group) {
                    if (other !== member.id && !member.lesson.conflictIds.includes(other)) {
                        throw new KnowledgeError('invalid', '冲突未双向登记：' + member.id + ' 的 conflictIds 缺少 ' + other);
                    }
                }
            }
            const now = new Date().toISOString();
            const affectedIds = group.filter((id) => id !== lessonId);
            const resolutionPayload = { kind: resolution, targetId: lessonId, affectedIds };
            const remainingOf = (member) => member.lesson.conflictIds.filter((id) => !group.includes(id));
            const planned = [];
            if (resolution === 'prefer' || resolution === 'drop') {
                for (const member of members) {
                    const isPrimary = member.id === lessonId;
                    const patch = { conflictIds: remainingOf(member) };
                    if (resolution === 'prefer') {
                        if (isPrimary) {
                            if (remainingOf(member).length === 0)
                                patch.state = 'usable';
                            patch.review = { ...member.lesson.review, ...(actor === 'human' ? { actor, decision: 'accepted' } : {}), at: now, note: maskedNote, resolution: resolutionPayload };
                        }
                        else {
                            patch.state = 'rejected';
                            patch.review = { decision: 'rejected', actor, at: now, note: '冲突解析：败给 ' + lessonId, resolution: resolutionPayload };
                        }
                    }
                    else if (isPrimary) {
                        patch.state = 'rejected';
                        patch.review = { decision: 'rejected', actor, at: now, note: '冲突解析：放弃本条目', resolution: resolutionPayload };
                    }
                    else {
                        if (remainingOf(member).length === 0)
                            patch.state = 'usable';
                        patch.review = { ...member.lesson.review, ...(actor === 'human' ? { actor, decision: 'accepted' } : {}), at: now, note: maskedNote, resolution: resolutionPayload };
                    }
                    planned.push({ id: member.id, isPrimary, patch });
                }
            }
            else {
                const primaryMember = members.find((member) => member.id === lessonId);
                const mergedEvidence = [...(primaryMember?.lesson.evidenceIds ?? [])];
                for (const member of members) {
                    if (member.id === lessonId)
                        continue;
                    for (const id of member.lesson.evidenceIds) {
                        if (!mergedEvidence.includes(id))
                            mergedEvidence.push(id);
                    }
                }
                for (const member of members) {
                    const isPrimary = member.id === lessonId;
                    const patch = { conflictIds: remainingOf(member) };
                    if (isPrimary) {
                        const supersedes = [...(member.lesson.supersedes ?? [])];
                        for (const id of group) {
                            if (id !== member.id && !supersedes.includes(id))
                                supersedes.push(id);
                        }
                        if (remainingOf(member).length === 0)
                            patch.state = 'usable';
                        patch.supersedes = supersedes;
                        patch.evidenceIds = mergedEvidence;
                        patch.review = { ...member.lesson.review, ...(actor === 'human' ? { actor, decision: 'accepted' } : {}), at: now, note: '冲突解析：并入 ' + affectedIds.join('、'), resolution: resolutionPayload };
                    }
                    else {
                        patch.state = 'stale';
                        patch.review = { ...member.lesson.review, ...(actor === 'human' ? { actor } : {}), at: now, note: maskedNote, resolution: resolutionPayload };
                    }
                    planned.push({ id: member.id, isPrimary, patch });
                }
            }
            const updates = [];
            for (const item of planned) {
                const member = members.find((entry) => entry.id === item.id);
                if (member === undefined)
                    continue;
                const current = member.lesson;
                const desiredConflictIds = item.patch.conflictIds ?? [];
                const reviewPatch = item.patch.review;
                const evidencePatch = item.patch.evidenceIds;
                const desiredState = item.patch.state;
                const noOp = desiredState === current.state
                    && desiredConflictIds.length === current.conflictIds.length
                    && desiredConflictIds.every((id) => current.conflictIds.includes(id))
                    && (reviewPatch === undefined || (current.review.decision === reviewPatch.decision && current.review.note === reviewPatch.note))
                    && (evidencePatch === undefined
                        || (evidencePatch.length === current.evidenceIds.length && evidencePatch.every((id) => current.evidenceIds.includes(id))));
                if (noOp)
                    continue;
                updates.push({ id: item.id, patch: item.patch, expectedRevision: current.revision });
            }
            lesson = updates.length === 0 ? before : store.updateLessonsBatch(updates, idempotencyKey).find(item => item.id === lessonId) ?? before;
            break;
        }
        default:
            throw new Error('不支持的动作：' + action);
    }
    return { ok: true, lesson, previousState: before.state, state: lesson.state, revision: lesson.revision };
}
