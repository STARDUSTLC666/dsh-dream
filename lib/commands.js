/**
 * DeepSeek Harness 0.2.2-rc.3 原生 `/` 斜杠命令接入：`/dream`、`/dream-learn`、`/dream-status`。
 *
 * 硬性约束：
 * - 零外部运行时依赖（通过可选 `ctx.inject(['commands'], ...)` 动态挂载，无此服务时优雅跳过）；
 * - 严格遵守人工审阅红线：`/dream-learn` 始终 `requireReview: true`，绝不自动晋升 `usable` 或改写 `AGENTS.md`；
 * - `/dream-status` 严格只读零写盘、不消耗模型 token；
 * - 所有用户输入统一经过 `maskSecrets`。
 *
 * @module dsh-dream/commands
 */
import { randomUUID } from 'node:crypto';
import { isAbsolute, join, win32 } from 'node:path';
import { KnowledgeStore } from './knowledge-store.js';
import { maskSecrets } from './mask.js';
import { isHumanAccepted, needsObservationReview } from './memory.js';
import { readAutomaticState } from './automatic-state.js';
import { automaticRuntime } from './automatic.js';
function asRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}
function nonEmpty(value, max = 200) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, max) : undefined;
}
function isAbsPath(value) {
    return typeof value === 'string' && (isAbsolute(value) || win32.isAbsolute(value));
}
function resolveInvocationModel(invocation) {
    const agent = asRecord(invocation?.agent);
    const session = asRecord(agent.session);
    const current = asRecord(agent.model?.current?.());
    const reqCtx = asRecord(session.requestContext?.());
    const reqCfg = asRecord(asRecord(session.requestHeader?.()).config);
    const provider = nonEmpty(current.provider) ?? nonEmpty(reqCtx.provider) ?? nonEmpty(reqCfg.provider);
    const model = nonEmpty(current.model) ?? nonEmpty(reqCtx.model) ?? nonEmpty(reqCfg.model);
    const agentPreset = nonEmpty(asRecord(session.header).agentPreset);
    return { provider, model, agentPreset };
}
function resolveInvocationCwd(invocation, cfg) {
    const session = invocation?.agent?.session;
    const runtime = automaticRuntime(cfg);
    const fromRuntime = runtime?.effectiveCwd(session);
    if (isAbsPath(fromRuntime))
        return fromRuntime;
    const headerCwd = session?.header?.cwd;
    return isAbsPath(headerCwd) ? headerCwd : undefined;
}
function createFollowupUserMessage(text) {
    return {
        id: randomUUID(),
        role: 'user',
        content: [{ type: 'text', text }],
        source: { kind: 'user' },
    };
}
function deriveLessonTitle(text) {
    const firstLine = text.split(/\r?\n/, 1)[0].trim();
    const sentence = firstLine.split(/[。！？.!?;；]/, 1)[0].trim();
    const base = sentence.length >= 6 ? sentence : firstLine;
    return base.length > 100 ? base.slice(0, 99) + '…' : base;
}
/** 构造 `/dream`、`/dream-learn`、`/dream-status` 三个原生斜杠命令定义。 */
export function buildDreamCommands(cfg) {
    const handleDream = (invocation) => {
        const rawFocus = typeof invocation?.rawInput === 'string' ? invocation.rawInput.trim() : '';
        const focus = rawFocus ? maskSecrets(rawFocus).slice(0, 500).trim() : '';
        const runtime = automaticRuntime(cfg);
        const status = runtime ? asRecord(runtime.status()) : undefined;
        const pendingTurns = typeof status?.pendingTurns === 'number' ? status.pendingTurns : 0;
        const candidates = typeof status?.candidates === 'number' ? status.candidates : 0;
        const agent = invocation?.agent;
        if (typeof agent?.followup === 'function') {
            const prompt = [
                '请按 dream-protocol 执行一次做梦复盘（使用 dream_digest / dream_context / dream_learn 等工具）：',
                focus ? `重点关注方向：${focus}` : '回顾最近会话中的关键结论、避坑经验与工作流规范。',
                '注意：新提炼的经验只能以待审阅候选（candidate）入库，绝不自动采纳或直接修改 AGENTS.md。',
            ].join('\n');
            try {
                agent.followup(createFollowupUserMessage(prompt));
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { kind: 'error', text: '无法排队发起做梦复盘：' + maskSecrets(msg) };
            }
            return {
                kind: 'success',
                text: `已排队发起 Dream 复盘对话${focus ? `（聚焦：${focus}）` : ''}。当前待整理轮次：${pendingTurns}，待审阅候选：${candidates}。`,
            };
        }
        return {
            kind: 'success',
            text: `Dream 队列摘要：自动整理${status?.available ? '已就绪' : '未就绪'}，待整理轮次 ${pendingTurns}，待审阅候选 ${candidates}。`,
        };
    };
    const handleDreamLearn = (invocation) => {
        const raw = typeof invocation?.rawInput === 'string' ? invocation.rawInput.trim() : '';
        const agent = invocation?.agent;
        if (raw.length === 0) {
            if (typeof agent?.followup !== 'function') {
                return { kind: 'error', text: '无法发起提炼对话，请提供经验内容。用法：/dream-learn <经验描述>' };
            }
            const prompt = [
                '请从当前会话中提炼可复用的项目经验，并通过 dream_learn 工具记录为待审阅候选（candidate）。',
                '每条候选需明确触发条件（when）、可执行动作（action）、原因（rationale）与涉及文件（files，如有），并附上可核验来源。',
                '严格遵守人工审阅边界：不要自动批准经验，也不要改写 AGENTS.md。',
            ].join('\n');
            try {
                agent.followup(createFollowupUserMessage(prompt));
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { kind: 'error', text: '无法排队发起候选经验提炼：' + maskSecrets(msg) };
            }
            return {
                kind: 'success',
                text: '已排队发起当前会话的候选经验提炼（结果将进入待审阅队列，不会自动采纳）。',
            };
        }
        const safeText = maskSecrets(raw).slice(0, 800).trim();
        if (safeText.length === 0) {
            return { kind: 'error', text: '经验内容不能为空。用法：/dream-learn <经验描述>' };
        }
        try {
            const runtime = automaticRuntime(cfg);
            const session = asRecord(agent?.session);
            const sessionId = nonEmpty(session.id);
            const cwd = resolveInvocationCwd(invocation, cfg);
            const workspaceId = cwd ? runtime?.cachedWorkspaceId(cwd) : undefined;
            const { provider, model, agentPreset } = resolveInvocationModel(invocation);
            const maskedProvider = provider ? maskSecrets(provider).slice(0, 200) : undefined;
            const maskedModel = model ? maskSecrets(model).slice(0, 200) : undefined;
            const maskedPreset = agentPreset ? maskSecrets(agentPreset).slice(0, 200) : undefined;
            const origin = maskedProvider || maskedModel || maskedPreset
                ? {
                    ...(maskedProvider ? { provider: maskedProvider } : {}),
                    ...(maskedModel ? { model: maskedModel } : {}),
                    ...(maskedPreset ? { agentPreset: maskedPreset } : {}),
                }
                : undefined;
            const evidence = {
                kind: 'user-correction',
                ...(sessionId ? { sessionId } : {}),
                ...(workspaceId ? { projectId: workspaceId } : {}),
                ...(maskedProvider ? { provider: maskedProvider } : {}),
                ...(maskedModel ? { model: maskedModel } : {}),
                ...(maskedPreset ? { agentPreset: maskedPreset } : {}),
                summary: safeText,
                verification: 'claimed',
                verificationReason: 'slash-command-input',
            };
            const input = {
                kind: 'procedure',
                title: deriveLessonTitle(safeText),
                action: safeText,
                when: cwd ? '在当前项目处理相关任务时' : '处理相关任务时',
                exceptions: [],
                ...(origin ? { origin } : {}),
                ...(workspaceId ? { projectId: workspaceId } : {}),
                ...(cwd ? { workspaceRoot: cwd } : {}),
                global: !cwd && !workspaceId,
                evidence: [evidence],
            };
            const store = new KnowledgeStore(join(cfg.journalDir, 'knowledge'), { maskSecrets: cfg.maskSecrets });
            const cmdId = nonEmpty(invocation?.commandId, 120) ?? randomUUID();
            const { lesson, created } = store.createLesson(input, 'cmd-dream-learn:' + cmdId, { requireReview: true });
            const verb = created ? '已记录待审阅候选经验' : '已合并到已有候选经验';
            return {
                kind: 'success',
                text: `${verb} [${lesson.id}]（状态：${lesson.state}，待人工审阅确认后才会启用）。\n标题：${lesson.title}`,
            };
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return { kind: 'error', text: '记录候选经验失败：' + maskSecrets(msg) };
        }
    };
    const handleDreamStatus = (invocation) => {
        try {
            const runtime = automaticRuntime(cfg);
            const status = runtime ? asRecord(runtime.status()) : undefined;
            const store = new KnowledgeStore(join(cfg.journalDir, 'knowledge'));
            const lessons = store.listLessons();
            const usableLessons = lessons.filter((item) => isHumanAccepted(item));
            const candidateCount = lessons.filter((item) => item.state === 'candidate' || (item.state === 'usable' && !isHumanAccepted(item))).length;
            let autoState;
            try {
                autoState = readAutomaticState(cfg);
            }
            catch { }
            const observations = autoState?.observations ?? {};
            const obsEntries = Object.values(observations);
            let totalPos = 0, totalNeg = 0, totalCorr = 0, totalRepeat = 0;
            for (const obs of obsEntries) {
                totalPos += obs.positive;
                totalNeg += obs.negative;
                totalCorr += obs.corrections;
                totalRepeat += obs.repeatToolHits;
            }
            const flaggedForReview = usableLessons.filter((item) => needsObservationReview(item, observations[item.id]).flagged).length;
            const gateEnabled = typeof status?.verificationGateEnabled === 'boolean'
                ? status.verificationGateEnabled
                : (autoState?.verificationGateEnabled ?? cfg.enableVerificationGate);
            const pendingTurns = typeof status?.pendingTurns === 'number'
                ? status.pendingTurns
                : (autoState?.pending?.length ?? 0);
            const autoAvailable = status?.available === true;
            const autoEnabled = typeof status?.enabled === 'boolean' ? status.enabled : (autoState?.enabled ?? cfg.autoCollect);
            const retrievalEnabled = typeof status?.retrievalEnabled === 'boolean'
                ? status.retrievalEnabled
                : (autoState?.retrievalEnabled ?? cfg.autoRetrieve);
            const callsToday = typeof status?.callsToday === 'number' ? status.callsToday : 0;
            const maxCallsPerDay = typeof status?.maxCallsPerDay === 'number' ? status.maxCallsPerDay : cfg.autoMaxCallsPerDay;
            const session = asRecord(invocation?.agent?.session);
            const sessionId = nonEmpty(session.id);
            const injectedIds = sessionId && runtime ? runtime.sessionInjectedLessonIds(sessionId) : [];
            const { model: currentModel } = resolveInvocationModel(invocation);
            const features = status?.dshFeatures;
            const activeFeatures = features
                ? Object.entries(features).filter(([, on]) => on).map(([name]) => name)
                : [];
            const compactionsObserved = typeof status?.compactionsObserved === 'number' ? status.compactionsObserved : 0;
            const lines = [
                'Dream 状态摘要（只读）：',
                `- 自动运行时：${autoAvailable ? '已就绪' : '未就绪'}（自动整理：${autoEnabled ? '开' : '关'}，自动召回：${retrievalEnabled ? '开' : '关'}，今日调用：${callsToday}/${maxCallsPerDay}）`,
                `- 经验库：已采纳 ${usableLessons.length} 条，待审阅候选 ${candidateCount} 条，总计 ${lessons.length} 条`,
                `- 待整理队列：${pendingTurns} 轮${compactionsObserved > 0 ? `（已观测压缩 ${compactionsObserved} 次）` : ''}`,
                `- 完成前软门控（Verification Gate）：${gateEnabled ? '已开启' : '关闭（默认）'}`,
                `- 原生观测：已观测 ${obsEntries.length} 条经验（+${totalPos} / -${totalNeg}，纠正 ${totalCorr}，重复工具 ${totalRepeat}${flaggedForReview > 0 ? `，建议复核 ${flaggedForReview} 条` : ''}）`,
                `- 已接入 DSH 服务：${activeFeatures.length > 0 ? activeFeatures.join(', ') : '基础模式（无扩展服务）'}`,
            ];
            if (currentModel || injectedIds.length > 0) {
                lines.push(`- 当前会话：模型 ${currentModel ?? '未知'}，已注入经验 ${injectedIds.length} 条${injectedIds.length > 0 ? `（${injectedIds.slice(0, 5).join(', ')}）` : ''}`);
            }
            return { kind: 'success', text: lines.join('\n') };
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return { kind: 'error', text: '读取 Dream 状态失败：' + maskSecrets(msg) };
        }
    };
    return [
        {
            definitionId: '@stardustlc/dsh-dream:dream',
            name: 'dream',
            description: '触发当前会话做梦复盘，或查看待整理队列摘要',
            input: { hint: '[focus]' },
            handler: handleDream,
        },
        {
            definitionId: '@stardustlc/dsh-dream:dream-learn',
            name: 'dream-learn',
            description: '记录一条待审阅候选经验，或引导从当前会话提炼候选经验',
            input: { hint: '[lesson text]' },
            handler: handleDreamLearn,
        },
        {
            definitionId: '@stardustlc/dsh-dream:dream-status',
            name: 'dream-status',
            description: '查看 Dream 记忆状态、待整理队列、观测计数与 DSH 能力接入情况',
            handler: handleDreamStatus,
        },
    ];
}
/**
 * 通过可选 `ctx.inject(['commands'], ...)` 注册 `/dream`、`/dream-learn`、`/dream-status`。
 * 宿主无 `commands` 服务时静默跳过；卸载时自动反注册全部命令。
 */
export function installDreamCommands(ctx, cfg) {
    if (typeof ctx?.inject !== 'function')
        return;
    ctx.inject(['commands'], (host) => {
        if (typeof host?.commands?.register !== 'function')
            return;
        const disposers = [];
        for (const definition of buildDreamCommands(cfg)) {
            try {
                const off = host.commands.register(definition);
                if (typeof off === 'function')
                    disposers.push(off);
            }
            catch {
                // Skip conflicting or unsupported registrations gracefully.
            }
        }
        let disposed = false;
        const release = () => {
            if (disposed)
                return;
            disposed = true;
            for (const off of disposers.splice(0).reverse()) {
                try {
                    off();
                }
                catch { }
            }
        };
        if (typeof host.effect === 'function')
            host.effect(() => release, 'dsh-dream: commands');
        else
            host.on?.('dispose', release);
    });
}
