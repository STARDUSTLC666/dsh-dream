// NOTE（维护者请看这里）：这个文件就是插件网页端的**源码**，不经过 tsc ——
// 仓库里没有 src/client.ts，pnpm run build 也不会重写它。改面板请直接改这里，
// 改完用 node --check lib/client.js 自检（CI 里也会跑这一步）。
//
// 日记、来源、审阅、反馈与规则变更共用同一份数据，界面语言跟随 DSH locale。
// 读取走同源只读路由，写操作走认证 Connection 通道；规则必须预览后应用。
// 日记、来源原文和人工输入保留原文；「隐私模式」仅模糊显示，DOM 仍是明文。
window.__ModuleLoader__.load({ id: "@stardustlc/dsh-dream", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";

const React = require("react");
const { useState, useEffect } = React;
const h = React.createElement;

// Interface language follows DSH; user content and stored records keep their original text.
let localeService;
const EN = Object.freeze({
  "请求失败（HTTP ": "Request failed (HTTP ",
  "服务器返回的不是 JSON（HTTP ": "The server did not return JSON (HTTP ",
  "登录状态已失效，请重新打开 DSH 页面后重试。": "Your session has expired. Reopen DSH and try again.",
  "当前宿主尚未提供此操作，请升级 DSH，或使用下方对话命令。": "This host does not support this action. Update DSH or use the chat command below.",
  "候选（未采纳）": "Candidate (not accepted)",
  "可用": "Usable",
  "有冲突": "Disputed",
  "待复核": "Needs review",
  "已驳回": "Rejected",
  "未知状态": "Unknown state",
  "平台 ": "Platform ",
  "；等 ": "; and ",
  " 条适用范围": " more conditions",
  "范围未标注": "Scope not specified",
  "暂无可展示的证据摘要": "No evidence summary available",
  "尚未核验": "Not verified yet",
  "没有 lastValidatedAt（从未核验）": "No lastValidatedAt (never verified)",
  "未加载的经验（": "Lesson not loaded (",
  "共 ": "Total: ",
  " 条": " records",
  "还没有经验": "No lessons yet",
  "日志过大，仅回放最近一段事件": "The log is large; only recent events were replayed",
  "有 ": "",
  " 行损坏已跳过": " damaged lines were skipped",
  "；events.jsonl 未改动。": "; events.jsonl was preserved.",
  "还没有经验记录": "No lesson records yet",
  "经验是带证据、有适用条件的技术结论：收尾时用 dream_learn 提交候选，证据足够、范围明确的会出现在这里。": "Lessons are technical conclusions with evidence and conditions. Submit a candidate with dream_learn; records with sufficient evidence and a clear scope appear here.",
  "旧日记里的教训不会自动升级为经验；采纳、驳回或标记冲突请用 dream_review。": "Journal observations do not become lessons automatically. Use dream_review to accept, reject or flag conflicts.",
  "已驳回：不参与默认检索与注入": "Rejected: excluded from default retrieval and injection",
  "待复核：条件或依赖可能已过期，默认不注入": "Needs review: conditions or dependencies may be outdated; not injected by default",
  "冲突未解决：默认不注入，先 resolve-conflict": "Unresolved conflict: not injected by default; use resolve-conflict first",
  "候选：可被检索到，但默认不作为任务建议注入": "Candidate: retrievable, but not injected as task advice by default",
  "证据不足：没有独立证据，默认不注入": "Insufficient independent evidence: not injected by default",
  "版本不匹配：当前依赖版本不满足适用范围": "Version mismatch: the dependency version is outside the applicable range",
  "超出条数预算，本次未取回": "Not retrieved: record limit reached",
  "超出字符预算：按排名整条装入，遇到第一条放不下即停": "Character limit reached: complete records are added by rank until the next one cannot fit",
  "超出字符预算，本次未取回": "Not retrieved: character limit reached",
  "新建": "Created",
  "替换管理块": "Replaced managed block",
  "追加管理块": "Appended managed block",
  "未改动": "Unchanged",
  "回滚": "Rolled back",
  "未知动作": "Unknown action",
  "时间未知": "Unknown time",
  "没有记录时间": "No timestamp recorded",
  "目标未记录": "Target not recorded",
  "没有经验引用": "No lesson references",
  "可回滚": "Rollback available",
  "不可回滚": "Rollback unavailable",
  "还没有写入记录": "No rule changes yet",
  "写入记录来自 dream_bridge 的 preview → apply；面板只读展示目标、时间、经验 revision 与前后哈希，不会写文件。": "Changes are recorded by dream_bridge preview → apply. This log shows the target, time, lesson revisions and before/after hashes.",
  "在可桥接经验行点「复制预览命令」，回到对话里执行；写操作只在工具中完成。": "Preview an eligible project lesson, review the changes and apply them. Chat commands are also available.",
  "没有待核实的经验 —— 候选、有冲突、待复核的经验会出现在这里，并写明被扣下的原因。": "Candidates, disputed lessons and lessons needing review appear here, with an explanation of why they are held.",
  "刚刚": "Just now",
  " 分钟前": " min ago",
  " 小时前": " h ago",
  " 天前": " days ago",
  "今天": "Today",
  "昨天": "Yesterday",
  "筛选后 ": "Filtered: ",
  " 场": " dreams",
  "」命中 ": "” matches ",
  " 场梦": " dreams",
  "筛选当前已加载的 ": "Filtering the ",
  " 场 · 命中 ": " loaded dreams · Matches: ",
  "新梦在前": "Newest first",
  "（已达路由上限）": " (route limit reached)",
  "最近 ": "Recent: ",
  " 场 / 共 ": " dreams / Total: ",
  "新梦在前 · 最多显示 ": "Newest first · Up to ",
  "搜索结果 · 最多显示 ": "Search results · Up to ",
  "本页内最近 ": "Most recent on this page: ",
  "（统计未给 lastAt，按本页已加载的 ": "(lastAt is missing; calculated from the ",
  " 场现算）": " dreams loaded on this page)",
  "同一天": "Same day",
  "约 ": "About ",
  " 天": " days",
  "第 1 场梦 · ": "First dream · ",
  " · 心境「": " · Mood: “",
  " 场梦 · 本页最近 ": " dreams · Loaded: ",
  "最近：": "Latest: ",
  "心境": "Mood",
  "1 场梦，先不谈分布 —— 再做梦会累积。": "One dream so far. More dreams will build a mood history.",
  "左 → 右：从早到晚": "Left → right: oldest to newest",
  "教训榜": "Recurring observations",
  "还没有教训 —— 记梦时带上 lessons，出现次数会在这里累积。": "No observations yet. Include lessons when recording dreams to track recurring observations.",
  "常见教训": "Recurring observation",
  "次数仅表示日记里的出现频率；出现 ≥3 次标为「常见教训」。写入项目规则前仍需核验来源并审阅经验。最近时间取自 stats.lastAt；统计缺失时按本页已加载的梦现算。": "Counts show journal frequency only; ≥3 occurrences marks a recurring observation. Verify sources and review lessons before writing project rules. Recency uses stats.lastAt, or the dreams loaded on this page when missing.",
  "复制命令": "Copy command",
  "已复制": "Copied",
  "剪贴板不可用：请手动选中上面的命令复制。": "Clipboard unavailable. Select and copy the command above manually.",
  "重新送审": "Reopen for review",
  "处理冲突": "Resolve conflict",
  "驳回这条": "Reject this lesson",
  "标记待复核": "Mark for review",
  "驳回": "Reject",
  "采纳": "Accept",
  "管理块内容已一致，无需写入。": "The managed block already matches; no write was needed.",
  "请求超时，请先刷新确认结果后再重试。": "Request timed out. Refresh to check the result before retrying.",
  "已更新「": "Updated the review state of “",
  "」的审阅状态。": "”.",
  "已记录使用反馈；「": "Feedback recorded; the review state of “",
  "」的审阅状态保持原样。": "” is unchanged.",
  "的操作": " — actions",
  "收起审阅": "Hide review",
  "审阅详情": "Review details",
  "预览规则变更": "Preview rule changes",
  "复制项目预览命令": "Copy project preview command",
  "正在处理…": "Working…",
  "已刷新经验列表。": "Lesson list refreshed.",
  "刷新列表": "Refresh list",
  "审阅动作": "Review action",
  "冲突经验": "Conflicting lesson",
  "处理方式": "Resolution",
  "采用这条，驳回对方": "Accept this lesson and reject the other",
  "放弃这条，保留对方": "Reject this lesson and keep the other",
  "合并到这条，对方留作历史": "Merge into this lesson and retain the other as history",
  "处理依据": "Reason for resolution",
  "说明哪个来源支持这次决定…": "Explain which source supports this decision…",
  "确认审阅": "Confirm review",
  "在对话里处理": "Handle in chat",
  "选择冲突经验并填写处理依据后即可处理。": "Select the conflicting lesson and provide a reason first.",
  "复制审阅命令": "Copy review command",
  "规则变更预览": "Rule change preview",
  "目标：": "Target: ",
  "管理块内容已经一致，无需更改。": "The managed block already matches; no changes are needed.",
  "将按此预览重建 Dream 管理块，请核对新增和删除内容。块外内容保留，写入前创建回滚备份。": "Check the additions and deletions before rebuilding the Dream managed block. Content outside the block is preserved; a rollback backup is created before writing.",
  "规则已应用，可在「写入记录」中回滚。": "Rules applied. You can roll back from the Rule changes tab.",
  "应用此变更": "Apply these changes",
  "取消预览": "Cancel preview",
  "使用反馈 · 有用 ": "Usage feedback · Useful: ",
  " · 不适用 ": " · Not applicable: ",
  "场景备注（可选）": "Context note (optional)",
  "反馈场景备注": "Feedback context note",
  "这次在哪个场景使用…": "Where did you use this lesson…",
  "这次有用": "Useful this time",
  "这次不适用": "Not applicable this time",
  "记录使用情况，供之后复核；采纳与驳回由审阅决定。": "Feedback records usage for future review. Acceptance and rejection remain review decisions.",
  "有用": "Useful",
  "不适用": "Not applicable",
  "已恢复上一次的 Dream 管理块，块外内容保留。": "The previous Dream managed block was restored; content outside the block was preserved.",
  "取消回滚": "Cancel rollback",
  "回滚这次变更": "Roll back this change",
  "将恢复「": "Restore the previous Dream managed block in “",
  "」的前一个 Dream 管理块。块外内容保留；管理块已被修改时会拒绝回滚。": "”. Content outside the block is preserved. Rollback is refused if the managed block has changed.",
  "正在回滚…": "Rolling back…",
  "确认回滚管理块": "Confirm block rollback",
  "隐私模式：点击此条临时查看": "Privacy mode: click to reveal temporarily",
  "最近核验：": "Last verified: ",
  "何时用：": "When to use: ",
  "未标注适用条件": "No conditions specified",
  "怎么做：": "What to do: ",
  "未标注具体动作": "No action specified",
  "适用范围与证据": "Scope and evidence",
  "范围：": "Scope: ",
  "适用：": "Applies to: ",
  "例外：": "Exceptions: ",
  "证据：": "Evidence: ",
  "没有关联来源记录，采纳前请核对依据。": "No linked sources. Check the evidence before accepting.",
  "来源记录 · ": "Source record · ",
  "已读到来源": "Source read",
  "待核验": "Unverified",
  "会话": "Session",
  "用户纠正": "User correction",
  "本地资料": "Local artifact",
  "未提供摘要": "No summary provided",
  "会话：": "Session: ",
  " · 记录 ": " · Record ",
  "记录时间：": "Recorded: ",
  "核验说明：": "Verification: ",
  "来源校验值：": "Source hash: ",
  "为什么被扣下：": "Why held: ",
  "已审阅经验": "Reviewed lessons",
  "重试": "Retry",
  "读取经验失败：": "Could not load lessons: ",
  "旧日记不受影响；修好后点「重试」。": "Your journal is preserved. Retry after resolving the error.",
  "经验": "Lessons",
  "加载中…": "Loading…",
  "查看 ": "Show ",
  "经验状态": "Lesson state",
  "可用经验": "Usable lessons",
  "已驳回历史": "Rejected history",
  "暂无可用经验；待核实的记录在下方。": "No usable lessons yet. Records needing review are below.",
  "没有已驳回记录。": "No rejected records.",
  "显示更多经验": "Show more lessons",
  "只显示最近 ": "Showing the most recent ",
  " 条经验。": " lessons.",
  "采纳记录仍需满足当前任务的平台、版本与项目条件；来源已读不代表结论永远适用。": "Accepted lessons must still match the platform, version and project of the current task. A source being read does not mean its conclusions always apply.",
  "待核实": "Needs verification",
  " 条待核实": " need verification",
  "没有待核实的经验": "No lessons awaiting verification",
  "显示更多待核实经验": "Show more pending lessons",
  "这些经验默认不会作为任务建议注入。先核对来源与适用范围，再决定采纳、驳回或继续复核。": "These lessons are not injected as task advice by default. Check sources and scope before accepting, rejecting or reviewing further.",
  "写入记录": "Rule changes",
  "读取写入记录失败：": "Could not load rule changes: ",
  " 次写入 · ": " changes · ",
  " 次可回滚": " can be rolled back",
  "经验：": "Lessons: ",
  "前哈希：": "Before hash: ",
  "后哈希：": "After hash: ",
  "备份标识与回滚命令": "Backup ID and rollback command",
  " 条记录。": " records.",
  "回滚恢复对应备份的 Dream 管理块；块外内容保留，外部修改的管理块会停止回滚。": "Rollback restores the backed-up Dream managed block and preserves content outside it. External changes to the block prevent rollback.",
  "隐私模式：点击卡片临时查看": "Privacy mode: click the card to reveal temporarily",
  "心境：": "Mood: ",
  "收起": "Collapse",
  "展开全文": "Read more",
  "没有找到「": "No dreams matching “",
  "」相关的梦": "”",
  "换个关键词试试，或者清空搜索看全部梦境。": "Try another keyword, or clear the search to see all dreams.",
  "清空搜索": "Clear search",
  "还没有梦境日记": "No dreams yet",
  "对 agent 说「做个梦」，它会回放最近的会话、反思之后把第一场梦写进这里。": "Ask your agent to “have a dream”. It will replay recent sessions, reflect and record its first dream here.",
  "对 agent 说「做个梦」": "Ask your agent to “have a dream”",
  "搜索反思与教训…": "Search reflections and observations…",
  "搜索梦境": "Search dreams",
  "筛选作用于已加载窗口，不影响全量统计": "Filters apply to loaded dreams; overall statistics are unchanged",
  "筛选": "Filter",
  "筛选梦境": "Filter dreams",
  " 场，不影响全量统计": " loaded dreams; overall statistics are unchanged",
  "只看有教训的梦": "Only dreams with observations",
  "清空筛选": "Clear filters",
  "完成": "Done",
  "显示层模糊；DOM 仍为明文，不改文件、不加密": "Display blur only; the DOM remains readable. Files are unchanged and not encrypted",
  "隐私模式：开": "Privacy mode: on",
  "隐私模式": "Privacy mode",
  "重新读取梦境日记": "Reload the dream journal",
  "刷新": "Refresh",
  "读取梦境日记失败：": "Could not load the dream journal: ",
  "暂时读不到梦境日记": "The dream journal is unavailable",
  "等宿主路由就绪后点上面的「重试」；如果一直失败，看一眼 DSH 日志里有没有 [dsh-dream] 告警。": "Retry after the host is ready. If the problem persists, check DSH logs for [dsh-dream] warnings.",
  "梦境总数": "Total dreams",
  "本页显示最近 ": "Most recent loaded: ",
  "全部梦境日记": "All dreams",
  "时间跨度": "Time span",
  "最近一场": "Latest dream",
  " 种": " moods",
  "最常见：": "Most common: ",
  "梦境时间线": "Dream timeline",
  "筛选结果": "Filtered results",
  "搜索结果": "Search results",
  "没有符合筛选的梦（筛选作用于已加载的 ": "No matching dreams (filters apply to the ",
  " 场）。": " loaded dreams).",
  "梦境面板视图": "Dream views",
  "日记": "Journal",
  "隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。": "Privacy mode blurs the display only. The DOM remains readable; files are unchanged and not encrypted. Click a card to reveal it temporarily.",
  "显示更早的梦": "Show older dreams",
  "数据来自梦境日记（dreams.jsonl）": "Data from the dream journal (dreams.jsonl)",
  "梦境日记": "Dream journal",
  "会话回放 → 反思 → 记忆巩固。这里按时间倒序陈列 agent 做过的梦，附心境方块与教训榜。": "Session replay → reflection → memory consolidation. Browse your agent’s dreams, mood history and recurring observations, newest first."
});
function languageOf(locale = localeService) {
  try { return String(locale?.getSnapshot?.().active || '').startsWith('en') ? 'en' : 'zh'; } catch { return 'zh'; }
}
function t(zh) { return languageOf() === 'en' ? (EN[zh] ?? zh) : zh; }
function displayError(error) {
  const message = error?.message || String(error || '');
  if (languageOf() !== 'en') return message;
  if (EN[message]) return EN[message];
  if (!/[\u3400-\u9fff]/.test(message)) return message;
  const hints = {
    revision: 'This lesson or project changed. Refresh and review again; your input is preserved.',
    conflict: 'The target changed. Preview the current rules again before applying.',
    'preview-mismatch': 'The preview no longer matches. Create a new preview.',
    'preview-expired': 'The preview expired. Create a new preview.',
    'not-rollbackable': 'Rollback is unavailable because the managed block changed or its backup is missing.',
    'ineligible': 'This lesson is not eligible for rule writing. Check its scope and review state.',
    'read-only': 'The target is read-only. Check its permissions before retrying.',
    'marker': 'The managed block markers are invalid. Check the file before retrying.',
    'path-outside-project': 'The target must stay inside the project directory.',
    'unsupported-encoding': 'The target file encoding is unsupported. Use UTF-8.',
    'target-is-directory': 'The selected target is a directory; select a file.',
    'not-found': 'The lesson, target or backup was not found. Refresh and check the project.',
    forbidden: 'This operation must be performed from the authenticated Dream panel.',
    'too-large': 'The request is too large. Shorten the input and try again.',
    cancelled: 'The operation was cancelled. Refresh to check the result before retrying.',
    io: 'The operation could not access its files. Check the project location and file permissions, then refresh before retrying.',
    internal: 'Could not load the records. Check the DSH logs and retry.',
    invalid: 'The input or selected record is no longer valid. Check the fields and refresh the list.',
  };
  return (hints[error?.code] || 'The operation failed. Check the DSH logs, then refresh before retrying.')
    + (error?.status ? ' (HTTP ' + error.status + (error.code ? ', ' + error.code : '') + ')' : '');
}
function rollbackReasonText(reason) {
  if (languageOf() !== 'en') return reason;
  return ({ '目标文件不可读': 'Target file is unreadable', '文件不存在': 'File does not exist',
    '管理块标记异常': 'Invalid managed block markers', '管理块已被移除': 'Managed block was removed',
    '管理块已被外部修改': 'Managed block changed externally' })[reason]
    || (/[\u3400-\u9fff]/.test(reason) ? 'Check the target file and backup' : reason);
}
function scopeText(label) {
  if (languageOf() !== 'en') return label;
  return label.replace(/^全局$/, 'Global').replace(/^工作区 /, 'Workspace ').replace(/^项目 /, 'Project ');
}
function evidenceText(summary) {
  if (languageOf() !== 'en') return summary;
  return summary.replace(/^独立证据 (\d+) 条（已读 (\d+) \/ 仅声明 (\d+)）：/, 'Independent sources: $1 (read: $2 / claimed: $3): ');
}
function useLanguage(locale) {
  const [, rerender] = useState(0);
  useEffect(() => { const update = () => rerender(n => n + 1); update(); return locale?.subscribe?.(update); }, [locale]);
}


// 相对路径按 document.baseURI 解析：反代挂在 /tools/dsh/ 这类前缀下也不会打偏。
const ROUTE = "_dsh/dsh-dream/journal";
const ACTION_ROUTE = "api/dsh-dream/actions";
const KNOWLEDGE_ROUTE = "_dsh/dsh-dream/knowledge";
const BRIDGE_ROUTE = "_dsh/dsh-dream/bridge";
const KNOWLEDGE_LIMIT = 50;
const BRIDGE_LIMIT = 50;
const KNOWLEDGE_STATES = ["candidate", "usable", "disputed", "stale", "rejected"];
const HELD_STATES = ["candidate", "disputed", "stale"];
const DEFAULT_LIMIT = 50;
const MORE_LIMIT = 500;
const FETCH_TIMEOUT_MS = 15000;
const SEARCH_DEBOUNCE_MS = 300;
const MOOD_SLOTS = 4;
const PRIVACY_KEY = "dsh-dream:privacy";

// ───────────────────────── 纯工具（不依赖 DOM，测试可直接调） ─────────────────────────

function pad2(value) {
  return value < 10 ? "0" + String(value) : String(value);
}

function timestampOf(iso) {
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : 0;
}

/** 路由 URL：按 document.baseURI 解析，兼容反代前缀；环境不齐时退回相对路径。 */
function routeUrlFor(route, query) {
  const suffix = query === "" || query === undefined || query === null ? "" : "?" + query;
  const relative = route + suffix;
  try {
    let base = null;
    if (typeof document !== "undefined" && document !== null && typeof document.baseURI === "string" && document.baseURI !== "") {
      base = document.baseURI;
    } else if (typeof location !== "undefined" && location !== null && typeof location.href === "string" && location.href !== "") {
      base = location.href;
    }
    if (base === null) return relative;
    return new URL(relative, base).toString();
  } catch (error) {
    return relative;
  }
}

/** 梦境日记路由的快捷方式（保持既有调用语义）。 */
function routeUrl(query) {
  return routeUrlFor(ROUTE, query);
}

function errorMessageOf(body, status) {
  if (body !== null && typeof body === "object") {
    if (body.error !== null && typeof body.error === "object" && typeof body.error.message === "string" && body.error.message !== "") return body.error.message;
    if (typeof body.message === "string" && body.message !== "") return body.message;
  }
  return t("请求失败（HTTP ") + String(status) + "）";
}

/** GET /_dsh/dsh-dream/journal：契约体 { dreams, stats, query, limit }。 */
async function fetchJournal(query, limit) {
  const params = ["limit=" + String(limit)];
  if (query !== "") params.unshift("q=" + encodeURIComponent(query));
  const init = { credentials: "same-origin" };
  // 请求必须有上限：挂起的 Promise 会让面板一直转圈，表现成「日记打不开」。
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const res = await fetch(routeUrl(params.join("&")), init);
  let body = null;
  try { body = await res.json(); } catch (error) { body = null; }
  if (body === null || typeof body !== "object") throw new Error(t("服务器返回的不是 JSON（HTTP ") + String(res.status) + "）");
  if (res.ok !== true || body.ok === false) {
    const failure = new Error(errorMessageOf(body, res.status));
    failure.status = res.status;
    failure.code = body.error !== null && typeof body.error === "object" ? body.error.code : undefined;
    throw failure;
  }
  // 契约体就是 { dreams, stats, query, limit }；万一被包进 { ok, value } 信封也认。
  const data = Array.isArray(body.dreams) ? body : (body.value !== null && typeof body.value === "object" ? body.value : body);
  return {
    dreams: data.dreams,
    stats: data.stats,
    query: typeof data.query === "string" ? data.query : query,
    limit: typeof data.limit === "number" ? data.limit : limit,
  };
}

/** GET /_dsh/dsh-dream/knowledge：只读契约体 { lessons, evidence, stats }，无查询参数。 */
async function fetchKnowledge() {
  const init = { credentials: "same-origin" };
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const res = await fetch(routeUrlFor(KNOWLEDGE_ROUTE, ""), init);
  let body = null;
  try { body = await res.json(); } catch (error) { body = null; }
  if (body === null || typeof body !== "object") throw new Error(t("服务器返回的不是 JSON（HTTP ") + String(res.status) + "）");
  if (res.ok !== true || body.ok === false) {
    const failure = new Error(errorMessageOf(body, res.status));
    failure.status = res.status;
    failure.code = body.error !== null && typeof body.error === "object" ? body.error.code : undefined;
    throw failure;
  }
  // 契约体就是 { lessons, evidence, stats }；万一被包进 { ok, value } 信封也认。
  const data = body.value !== null && typeof body.value === "object" ? body.value : body;
  return {
    lessons: Array.isArray(data.lessons) ? data.lessons : [],
    evidence: Array.isArray(data.evidence) ? data.evidence : [],
    stats: data.stats !== null && typeof data.stats === "object" ? data.stats : null,
  };
}

/** GET /_dsh/dsh-dream/bridge：只读契约体 { records, stats }，无查询参数。 */
async function fetchBridgeRecords() {
  const init = { credentials: "same-origin" };
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const res = await fetch(routeUrlFor(BRIDGE_ROUTE, ""), init);
  let body = null;
  try { body = await res.json(); } catch (error) { body = null; }
  if (body === null || typeof body !== "object") throw new Error(t("服务器返回的不是 JSON（HTTP ") + String(res.status) + "）");
  if (res.ok !== true || body.ok === false) {
    const failure = new Error(errorMessageOf(body, res.status));
    failure.status = res.status;
    failure.code = body.error !== null && typeof body.error === "object" ? body.error.code : undefined;
    throw failure;
  }
  const data = body.value !== null && typeof body.value === "object" ? body.value : body;
  return {
    records: Array.isArray(data.records) ? data.records : [],
    stats: data.stats !== null && typeof data.stats === "object" ? data.stats : null,
  };
}

async function postAction(body) {
  const init = { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json", "x-dsh-dream-action": "1" }, body: JSON.stringify(body) };
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") init.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const res = await fetch(routeUrlFor(ACTION_ROUTE, ""), init);
  let value = null;
  try { value = await res.json(); } catch (error) { /* Preserve HTTP status for useful recovery hints. */ }
  if (res.ok !== true || value === null || value.ok === false) {
    const hint = res.status === 401 ? t("登录状态已失效，请重新打开 DSH 页面后重试。")
      : res.status === 404 ? t("当前宿主尚未提供此操作，请升级 DSH，或使用下方对话命令。")
      : errorMessageOf(value, res.status);
    const failure = new Error(hint);
    failure.code = value && value.error ? value.error.code : undefined;
    failure.status = res.status;
    throw failure;
  }
  return value;
}

/** 复制命令到剪贴板；没有 clipboard / 被拒绝时返回 false，调用方回退为可选中文本。 */
async function copyText(text) {
  const value = String(text);
  if (value === "") return false;
  try {
    if (typeof navigator !== "undefined" && navigator !== null && navigator.clipboard !== undefined && navigator.clipboard !== null && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (error) { /* 权限被拒 / 非安全上下文：回退展示可选中文本 */ }
  return false;
}

function normalizeDreams(value, limit) {
  if (!Array.isArray(value) || limit <= 0) return [];
  const out = [];
  for (const raw of value) {
    if (raw === null || typeof raw !== "object") continue;
    const reflection = typeof raw.reflection === "string" ? raw.reflection : "";
    if (reflection === "") continue;
    out.push({
      id: typeof raw.id === "string" ? raw.id : "",
      at: typeof raw.at === "string" ? raw.at : "",
      reflection: reflection,
      lessons: Array.isArray(raw.lessons) ? raw.lessons.filter((lesson) => typeof lesson === "string" && lesson.trim() !== "") : [],
      mood: typeof raw.mood === "string" && raw.mood.trim() !== "" ? raw.mood.trim() : "平静",
    });
  }
  // 服务端已倒序；这里再兜一次（坏时间排到最后），保证「新梦在前」不被实现细节破坏。
  out.sort((a, b) => timestampOf(b.at) - timestampOf(a.at));
  return out.slice(0, limit);
}

function normalizeStats(value, dreams) {
  const source = value !== null && typeof value === "object" ? value : {};
  const moodCounts = new Map();
  if (source.moods !== null && typeof source.moods === "object") {
    for (const key of Object.keys(source.moods)) {
      const count = source.moods[key];
      if (typeof count === "number" && count > 0) moodCounts.set(key === "" ? "平静" : key, count);
    }
  }
  if (moodCounts.size === 0) for (const dream of dreams) moodCounts.set(dream.mood, (moodCounts.get(dream.mood) || 0) + 1);
  const moods = Array.from(moodCounts.entries())
    .map(([mood, count]) => ({ mood: mood, count: count }))
    .sort((a, b) => b.count - a.count || String(a.mood).localeCompare(String(b.mood), "zh"));
  const total = typeof source.total === "number" && source.total >= 0 ? source.total : dreams.length;
  const topLessons = [];
  if (Array.isArray(source.topLessons)) {
    for (const raw of source.topLessons) {
      if (raw === null || typeof raw !== "object") continue;
      if (typeof raw.lesson !== "string" || raw.lesson.trim() === "") continue;
      topLessons.push({
        lesson: raw.lesson,
        count: typeof raw.count === "number" && raw.count > 0 ? raw.count : 1,
        lastAt: typeof raw.lastAt === "string" ? raw.lastAt : "",
      });
    }
  }
  if (topLessons.length === 0) {
    // 后端没给统计（或还没接上）时按当前页现算一份，面板不至于空着。
    const counts = new Map();
    for (const dream of dreams) for (const lesson of dream.lessons) {
      const key = lesson.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const entry of sorted) {
      let original = "";
      let lastAt = "";
      for (const dream of dreams) {
        for (const lesson of dream.lessons) {
          if (lesson.toLowerCase() !== entry[0]) continue;
          if (original === "") original = lesson;
          if (timestampOf(dream.at) > timestampOf(lastAt)) lastAt = dream.at;
        }
      }
      topLessons.push({ lesson: original || entry[0], count: entry[1], lastAt: lastAt });
    }
  }
  return { total: total, moods: moods, topLessons: topLessons };
}

/** 只认契约里的 5 个状态；未知状态不冒充候选。 */
function normalizeLessonState(value) {
  return KNOWLEDGE_STATES.indexOf(value) !== -1 ? value : "unknown";
}

/** 状态 → 中文标签（面板文案集中在这里）。 */
function lessonStateLabel(state) {
  switch (state) {
    case "candidate": return t("候选（未采纳）");
    case "usable": return t("可用");
    case "disputed": return t("有冲突");
    case "stale": return t("待复核");
    case "rejected": return t("已驳回");
    default: return t("未知状态");
  }
}

/** 状态 → 视觉类名：candidate 与 disputed 必须不同色，其余状态各自可辨。 */
function lessonStateClass(state) {
  switch (state) {
    case "candidate": return "dshd-kstate-candidate";
    case "usable": return "dshd-kstate-usable";
    case "disputed": return "dshd-kstate-disputed";
    case "stale": return "dshd-kstate-stale";
    case "rejected": return "dshd-kstate-rejected";
    default: return "dshd-kstate-unknown";
  }
}

/** 只取字符串字段并去首尾空白；坏形状降级为 ""，不让面板崩。 */
function trimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** applicability 数组 → 紧凑适用串（package + versions / platform）；坏形状跳过，空数组给 ""。 */
function applicabilityTextOf(value) {
  if (!Array.isArray(value)) return "";
  const parts = [];
  for (const raw of value) {
    if (raw === null || typeof raw !== "object") continue;
    const pkg = trimmedText(raw.package);
    const versions = trimmedText(raw.versions);
    const platform = trimmedText(raw.platform);
    const main = pkg !== "" ? (versions !== "" ? pkg + " " + versions : pkg) : versions;
    const bits = [];
    if (main !== "") bits.push(main);
    if (platform !== "") bits.push(t("平台 ") + platform);
    if (bits.length > 0) parts.push(bits.join(" · "));
  }
  if (parts.length === 0) return "";
  if (parts.length > 4) return parts.slice(0, 4).join("；") + t("；等 ") + String(parts.length) + t(" 条适用范围");
  return parts.join("；");
}

/**
 * 经验视图模型：只投影展示所需字段（title / when / applicability / exceptions /
 * state / scopeLabel / evidenceSummary / lastValidatedAt），并派生 revision / 扣留原因 /
 * 可桥接标记与复制命令所需的稳定字段；不碰权重、向量、原始 JSON。
 * limit 只截断渲染行数，byState 仍按全量统计；truncated / badLines 原样带给提示行。
 */
function normalizeKnowledge(value, now, limit) {
  const source = value !== null && typeof value === "object" ? value : {};
  const cap = typeof limit === "number" && limit > 0 ? limit : KNOWLEDGE_LIMIT;
  const rawLessons = Array.isArray(source.lessons) ? source.lessons : [];
  const lessonTitles = new Map();
  for (const raw of rawLessons) {
    if (raw !== null && typeof raw === "object" && trimmedText(raw.id) !== "") {
      lessonTitles.set(trimmedText(raw.id), trimmedText(raw.title) || trimmedText(raw.action));
    }
  }
  const statsSource = source.stats !== null && typeof source.stats === "object" ? source.stats : {};
  const byState = {};
  const rows = [];
  for (const raw of rawLessons) {
    if (raw === null || typeof raw !== "object") continue;
    const title = trimmedText(raw.title);
    const action = trimmedText(raw.action);
    if (title === "" && action === "") continue;
    const state = normalizeLessonState(raw.state);
    byState[state] = (byState[state] || 0) + 1;
    if (rows.length >= cap) continue;
    const lastValidatedAt = trimmedText(raw.lastValidatedAt);
    rows.push({
      id: trimmedText(raw.id),
      title: title !== "" ? title : action,
      action: action,
      when: trimmedText(raw.when),
      applicability: applicabilityTextOf(raw.applicability),
      exceptions: Array.isArray(raw.exceptions)
        ? raw.exceptions.filter((item) => typeof item === "string" && item.trim() !== "").map((item) => item.trim()).slice(0, 10)
        : [],
      state: state,
      stateLabel: lessonStateLabel(state),
      stateClass: lessonStateClass(state),
      scopeLabel: scopeText(trimmedText(raw.scopeLabel)) || t("范围未标注"),
      evidenceSummary: evidenceText(trimmedText(raw.evidenceSummary)) || t("暂无可展示的证据摘要"),
      evidence: Array.isArray(source.evidence) && Array.isArray(raw.evidenceIds)
        ? source.evidence.filter(function (item) { return item && raw.evidenceIds.indexOf(item.id) !== -1; }).slice(0, 20) : [],
      feedback: raw.feedback && typeof raw.feedback === "object" ? raw.feedback : { useful: 0, notApplicable: 0, recent: [] },
      lastValidatedAt: lastValidatedAt,
      lastText: lastValidatedAt === "" ? t("尚未核验") : relativeTime(lastValidatedAt, now),
      lastTitle: lastValidatedAt === "" ? t("没有 lastValidatedAt（从未核验）") : formatDate(lastValidatedAt) + (formatTime(lastValidatedAt) === "" ? "" : " " + formatTime(lastValidatedAt)),
      revision: typeof raw.revision === "number" && Number.isFinite(raw.revision) && raw.revision >= 0 ? Math.floor(raw.revision) : 0,
      independentSupportCount: typeof raw.independentSupportCount === "number" && raw.independentSupportCount > 0 ? Math.floor(raw.independentSupportCount) : 0,
      projectId: typeof raw.scope === "object" && raw.scope !== null ? trimmedText(raw.scope.projectId) : "",
      workspaceRoot: typeof raw.scope === "object" && raw.scope !== null ? trimmedText(raw.scope.workspaceRoot) : "",
      conflictIds: Array.isArray(raw.conflictIds) ? raw.conflictIds.filter(function (id) { return typeof id === "string" && id.trim() !== ""; }) : [],
      conflicts: Array.isArray(raw.conflictIds) ? raw.conflictIds.filter(function (id) { return typeof id === "string" && id.trim() !== ""; }).map(function (id) { return { id: id, title: lessonTitles.get(id) || t("未加载的经验（") + id + "）" }; }) : [],
      holdReason: trimmedText(raw.holdReason) !== "" ? trimmedText(raw.holdReason) : holdReasonOf(raw),
      holdReasonLabel: trimmedText(raw.holdReasonLabel) !== "" ? t(trimmedText(raw.holdReasonLabel)) : skippedReasonLabel(holdReasonOf(raw)),
      bridgeable: bridgeableOf(raw.state) && trimmedText(raw.id) !== "",
      candidate: state === "candidate",
      disputed: state === "disputed",
    });
  }
  const total = typeof statsSource.lessons === "number" && statsSource.lessons >= 0 ? statsSource.lessons : rawLessons.length;
  const evidenceTotal = typeof statsSource.evidence === "number" && statsSource.evidence >= 0 ? statsSource.evidence : 0;
  const badLinesRaw = statsSource.badLines;
  const badLines = typeof badLinesRaw === "number" && Number.isFinite(badLinesRaw) && badLinesRaw > 0 ? Math.floor(badLinesRaw) : 0;
  return {
    rows: rows,
    total: total,
    shown: rows.length,
    stats: { lessons: total, evidence: evidenceTotal, byState: byState, truncated: statsSource.truncated === true, badLines: badLines },
  };
}

/** 经验区块的统计文案：按状态计数，不包装成可靠度。 */
function knowledgeCountText(stats) {
  const source = stats !== null && typeof stats === "object" ? stats : {};
  const byState = source.byState !== null && typeof source.byState === "object" ? source.byState : {};
  const parts = [];
  for (const state of KNOWLEDGE_STATES) {
    const count = typeof byState[state] === "number" && byState[state] > 0 ? byState[state] : 0;
    if (count > 0) parts.push(lessonStateLabel(state) + " " + String(count));
  }
  if (parts.length === 0) {
    const total = typeof source.lessons === "number" && source.lessons > 0 ? source.lessons : 0;
    return total > 0 ? t("共 ") + String(total) + t(" 条") : t("还没有经验");
  }
  return parts.join(" · ");
}

/** 截断 / 坏行提示：无问题时给 ""；确保面板不静默展示不完整的经验集。 */
function knowledgeNoticeText(stats) {
  const source = stats !== null && typeof stats === "object" ? stats : {};
  const truncated = source.truncated === true;
  const badLines = typeof source.badLines === "number" && Number.isFinite(source.badLines) && source.badLines > 0 ? Math.floor(source.badLines) : 0;
  if (truncated !== true && badLines === 0) return "";
  const parts = [];
  if (truncated === true) parts.push(t("日志过大，仅回放最近一段事件"));
  if (badLines > 0) parts.push(t("有 ") + String(badLines) + t(" 行损坏已跳过"));
  return parts.join("；") + t("；events.jsonl 未改动。");
}

/** 经验区块的独立空态：与「还没有梦境日记」分开，说明经验从哪来。 */
function knowledgeEmptyState() {
  return {
    title: t("还没有经验记录"),
    body: t("经验是带证据、有适用条件的技术结论：收尾时用 dream_learn 提交候选，证据足够、范围明确的会出现在这里。"),
    hint: t("旧日记里的教训不会自动升级为经验；采纳、驳回或标记冲突请用 dream_review。"),
  };
}

/** 检索层 skipped reason 的中文映射（面板扣留原因文案；与 retrieval.ts 的 reason 常量同名）。 */
function skippedReasonLabel(reason) {
  switch (trimmedText(reason)) {
    case "state:rejected": return t("已驳回：不参与默认检索与注入");
    case "state:stale": return t("待复核：条件或依赖可能已过期，默认不注入");
    case "state:disputed": return t("冲突未解决：默认不注入，先 resolve-conflict");
    case "candidate-hold": return t("候选：可被检索到，但默认不作为任务建议注入");
    case "no-evidence": return t("证据不足：没有独立证据，默认不注入");
    case "version-mismatch": return t("版本不匹配：当前依赖版本不满足适用范围");
    case "limit": return t("超出条数预算，本次未取回");
    case "budget-stop": return t("超出字符预算：按排名整条装入，遇到第一条放不下即停");
    case "budget": return t("超出字符预算，本次未取回");
    default: return "";
  }
}

/** 浏览态的确定性扣留原因；version-mismatch 需要 query / 包名上下文，不在此列。 */
function holdReasonOf(lesson) {
  const source = lesson !== null && typeof lesson === "object" ? lesson : {};
  const state = normalizeLessonState(source.state);
  if (state === "disputed") return "state:disputed";
  if (state === "stale") return "state:stale";
  if (state === "rejected") return "state:rejected";
  if (state === "candidate") {
    const support = typeof source.independentSupportCount === "number" && source.independentSupportCount > 0 ? source.independentSupportCount : 0;
    return support === 0 ? "no-evidence" : "candidate-hold";
  }
  return "";
}

/** 面板上的「可桥接」只按契约状态判断：usable；scope / 用户采纳等资格由 dream_bridge 执行时校验。 */
function bridgeableOf(state) {
  return normalizeLessonState(state) === "usable";
}

/** 复制命令里的默认 action：按状态给最常用的一步，用户可在对话里再改。 */
function reviewActionFor(state) {
  switch (normalizeLessonState(state)) {
    case "candidate": return "accept";
    case "disputed": return "resolve-conflict";
    case "stale": return "accept";
    case "usable": return "mark-stale";
    case "rejected": return "reopen";
    default: return "";
  }
}

/** 派生 dream_review 复制命令；缺 id 时给 ""（面板不展示不可执行命令）。 */
function reviewCommandOf(lesson, options) {
  const source = lesson !== null && typeof lesson === "object" ? lesson : {};
  const id = trimmedText(source.id);
  if (id === "" || !Number.isInteger(source.revision) || source.revision < 1) return "";
  const opts = options || {};
  const action = opts.action || reviewActionFor(source.state);
  if (action === "") return "";
  const args = { action: action, lessonId: id, expectedRevision: source.revision };
  if (action === "resolve-conflict") {
    if (!["prefer", "drop", "merge"].includes(opts.resolution) || trimmedText(opts.note) === "" || !Array.isArray(opts.affectedIds) || opts.affectedIds.length === 0) return "";
    args.resolution = opts.resolution;
    args.note = opts.note.trim();
    args.affectedIds = opts.affectedIds;
  }
  return "dream_review " + JSON.stringify(args);
}

/** 派生 dream_bridge preview 复制命令（单条经验）；projectId 来自 payload，scopeLabel 只展示。 */
function bridgePreviewCommandOf(lessonId, projectId, workspaceRoot) {
  const id = trimmedText(lessonId);
  if (id === "") return "";
  const project = trimmedText(projectId);
  const args = { mode: "preview", lessonIds: [id] };
  if (project !== "") args.projectId = project;
  const root = trimmedText(workspaceRoot);
  if (root !== "") args.path = root.replace(/[\\/]+$/, "") + "/AGENTS.md";
  return "dream_bridge " + JSON.stringify(args);
}

function bridgeRollbackCommandOf(row) {
  if (!row || row.rollbackable !== true || trimmedText(row.target) === "") return "";
  const backupId = trimmedText(row.id) || trimmedText(row.backupId);
  if (backupId === "") return "";
  return "dream_bridge " + JSON.stringify({ mode: "rollback", backupId: backupId, path: row.target });
}

/** 哈希只展示前 12 位；空值给 ""。 */
function shortHash(value) {
  const text = trimmedText(value);
  if (text === "") return "";
  return text.length > 12 ? text.slice(0, 12) + "…" : text;
}

function bridgeActionLabel(action) {
  switch (trimmedText(action)) {
    case "create": return t("新建");
    case "replace": return t("替换管理块");
    case "append": return t("追加管理块");
    case "unchanged": return t("未改动");
    case "rollback": return t("回滚");
    default: return trimmedText(action) || t("未知动作");
  }
}

/** 写入记录视图模型：只投影展示字段，不展示原始 JSON / 管理块正文。 */
function normalizeBridgeRecords(value, now, limit) {
  const source = value !== null && typeof value === "object" ? value : {};
  const cap = typeof limit === "number" && limit > 0 ? limit : BRIDGE_LIMIT;
  const rawRecords = Array.isArray(source.records) ? source.records : [];
  const statsSource = source.stats !== null && typeof source.stats === "object" ? source.stats : {};
  const rows = [];
  let rollbackableCount = 0;
  for (const raw of rawRecords) {
    if (raw === null || typeof raw !== "object") continue;
    const id = trimmedText(raw.backupId);
    const target = trimmedText(raw.target);
    if (id === "" && target === "") continue;
    const rollbackable = raw.rollbackable === true;
    if (rollbackable) rollbackableCount += 1;
    if (rows.length >= cap) continue;
    const at = trimmedText(raw.at);
    const lessonRefs = [];
    if (Array.isArray(raw.lessons)) {
      for (const item of raw.lessons) {
        if (item !== null && typeof item === "object") {
          const lessonId = trimmedText(item.lessonId);
          if (lessonId === "") continue;
          const revision = typeof item.revision === "number" && Number.isFinite(item.revision) && item.revision >= 0 ? Math.floor(item.revision) : 0;
          lessonRefs.push(lessonId + "@" + String(revision));
        } else if (typeof item === "string" && item.trim() !== "") {
          lessonRefs.push(item.trim());
        }
      }
    }
    const rollbackReason = trimmedText(raw.rollbackReason);
    rows.push({
      id: id,
      at: at,
      atText: at === "" ? t("时间未知") : relativeTime(at, now),
      atTitle: at === "" ? t("没有记录时间") : formatDate(at) + (formatTime(at) === "" ? "" : " " + formatTime(at)),
      target: target || t("目标未记录"),
      action: trimmedText(raw.action),
      actionLabel: bridgeActionLabel(raw.action),
      lessons: lessonRefs,
      lessonsText: lessonRefs.length === 0 ? t("没有经验引用") : lessonRefs.join("、"),
      beforeShort: shortHash(raw.beforeSha256),
      afterShort: shortHash(raw.afterSha256),
      rollbackable: rollbackable,
      rollbackText: rollbackable ? t("可回滚") : (t("不可回滚") + (rollbackReason !== "" ? (languageOf() === 'en' ? ': ' : '：') + rollbackReasonText(rollbackReason) : "")),
      rollbackReason: rollbackReason,
    });
  }
  const total = typeof statsSource.total === "number" && statsSource.total >= 0 ? statsSource.total : rawRecords.length;
  const statsRollback = typeof statsSource.rollbackable === "number" && statsSource.rollbackable >= 0 ? statsSource.rollbackable : rollbackableCount;
  return {
    rows: rows,
    total: total,
    shown: rows.length,
    rollbackable: statsRollback,
  };
}

/** 「写入记录」的独立空态。 */
function bridgeEmptyState() {
  return {
    title: t("还没有写入记录"),
    body: t("写入记录来自 dream_bridge 的 preview → apply；面板只读展示目标、时间、经验 revision 与前后哈希，不会写文件。"),
    hint: t("在可桥接经验行点「复制预览命令」，回到对话里执行；写操作只在工具中完成。"),
  };
}

/** 「待核实」的独立空态。 */
function reviewQueueEmptyState() {
  return t("没有待核实的经验 —— 候选、有冲突、待复核的经验会出现在这里，并写明被扣下的原因。");
}

function spanOf(dreams) {
  let min = null;
  let max = null;
  for (const dream of dreams) {
    const ts = timestampOf(dream.at);
    if (ts === 0) continue;
    if (min === null || ts < min) min = ts;
    if (max === null || ts > max) max = ts;
  }
  if (min === null) return null;
  return { from: min, to: max, days: Math.floor((max - min) / 86400000) };
}

function formatDate(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso === "" ? t("时间未知") : iso;
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

function formatTime(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
}

function shortDate(ms) {
  const date = new Date(ms);
  return pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

/** 跨度的紧凑写法：同年用 MM-DD → MM-DD，跨年才带年份 —— 窄卡片里也不截断。 */
function spanTextOf(span) {
  const from = new Date(span.from);
  const to = new Date(span.to);
  if (formatDate(from.toISOString()) === formatDate(to.toISOString())) return formatDate(from.toISOString());
  if (from.getFullYear() === to.getFullYear()) return shortDate(span.from) + " → " + shortDate(span.to);
  return formatDate(from.toISOString()) + " → " + formatDate(to.toISOString());
}

function relativeTime(iso, now) {
  const ts = timestampOf(iso);
  if (ts === 0) return "";
  const diff = now.getTime() - ts;
  const minute = 60000;
  const hour = 3600000;
  const day = 86400000;
  if (diff < minute) return t("刚刚");
  if (diff < hour) return Math.floor(diff / minute) + t(" 分钟前");
  if (diff < day) return Math.floor(diff / hour) + t(" 小时前");
  if (diff < day * 30) return Math.floor(diff / day) + t(" 天前");
  return formatDate(iso);
}

/** 「最近一次出现」用的短文案：今天/昨天/N 天前/日期。 */
function recentText(iso, now) {
  const ts = timestampOf(iso);
  if (ts === 0) return "";
  const date = new Date(ts);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (days <= 0) return t("今天");
  if (days === 1) return t("昨天");
  if (days < 30) return String(days) + t(" 天前");
  return formatDate(iso);
}

/** 卡片头部的相对时间：与日期重复（≥30 天）时返回空串，别重复贴一个日期。 */
function dreamAgo(dream, now) {
  const text = recentText(dream.at, now);
  return text === formatDate(dream.at) ? "" : text;
}

/** lastAt 缺失时的降级：在已加载的梦里找这条教训最近一次出现。 */
function localLastAtFor(dreams, lesson) {
  const needle = String(lesson).toLowerCase();
  let best = "";
  for (const dream of dreams) {
    if (timestampOf(dream.at) <= timestampOf(best)) continue;
    for (const item of dream.lessons) {
      if (item.toLowerCase() === needle) { best = dream.at; break; }
    }
  }
  return best;
}

/** 极简行内标记：只认 **加粗**；其余原样，绝不用 dangerouslySetInnerHTML。 */
const BOLD_RE = /\*\*([^*\n]+)\*\*/g;
function inlineNodes(text, keyPrefix) {
  const nodes = [];
  let last = 0;
  let index = 0;
  let match;
  BOLD_RE.lastIndex = 0;
  while ((match = BOLD_RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(h("strong", { key: keyPrefix + "-b" + String(index) }, match[1]));
    last = match.index + match[0].length;
    index += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function moodSlot(mood) {
  const text = String(mood);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) % 997;
  return hash % MOOD_SLOTS;
}

/** 心境 → 颜色槽；0 用 business 默认色，1/2/3 分别是 success/warn/error。 */
function toneClass(slot) {
  return slot === 0 ? "" : "dshd-tone-" + String(slot % MOOD_SLOTS);
}

function isCollapsible(text) {
  return String(text).split(/\r?\n/).length > 4 || String(text).length > 220;
}

/** 筛选条件归一：坏形状一律降级，不因为外部数据崩面板。 */
function cleanupFilters(filters) {
  const source = filters !== null && typeof filters === "object" ? filters : {};
  const moods = Array.isArray(source.moods) ? source.moods.filter(function (mood) { return typeof mood === "string" && mood !== ""; }) : [];
  // 契约字段是 withLessons；onlyWithLessons 只是旧写法别名，两个都认。
  return { moods: moods, withLessons: source.withLessons === true || source.onlyWithLessons === true };
}

/** 生效中的筛选项数（用于按钮上的计数）：心境每选一个算 1，只看有教训算 1。 */
function filterCountOf(filters) {
  const clean = cleanupFilters(filters);
  return clean.moods.length + (clean.withLessons === true ? 1 : 0);
}

/** 筛选只作用于「已加载窗口」，不冒充全量；无筛选时原样返回。 */
function applyFilters(dreams, filters) {
  const list = Array.isArray(dreams) ? dreams : [];
  const clean = cleanupFilters(filters);
  if (filterCountOf(clean) === 0) return list;
  return list.filter(function (dream) {
    if (clean.moods.length > 0 && clean.moods.indexOf(dream.mood) === -1) return false;
    if (clean.withLessons === true && dream.lessons.length === 0) return false;
    return true;
  });
}

/** ≥8 场才值得摆筛选入口；0 场连搜索框都不渲染，同思路。 */
function shouldShowFilters(loaded) {
  return typeof loaded === "number" && loaded >= 8;
}

/** 已加载的比总数少、且还没到路由上限 500，才需要「显示更早的梦」。 */
function needsOlderDreams(loaded, total) {
  return typeof loaded === "number" && typeof total === "number" && loaded < total && loaded < MORE_LIMIT;
}

function countTextOf(query, total, count, filterCount, visibleCount) {
  if (filterCount > 0) return t("筛选后 ") + String(visibleCount) + " / " + String(count) + t(" 场");
  if (query !== "") return (languageOf() === "en" ? "“" : "「") + query + t("」命中 ") + String(count) + t(" 场");
  return t("共 ") + String(total) + t(" 场梦");
}

function listHintOf(query, count, filterCount, visibleCount) {
  if (filterCount > 0) return t("筛选当前已加载的 ") + String(count) + t(" 场 · 命中 ") + String(visibleCount) + t(" 场");
  if (query !== "") return (languageOf() === "en" ? "“" : "「") + query + t("」命中 ") + String(count) + t(" 场");
  return t("新梦在前");
}

function footerTextOf(query, limit, total, count) {
  if (limit > DEFAULT_LIMIT) {
    const capped = limit >= MORE_LIMIT && count < total ? t("（已达路由上限）") : "";
    return t("最近 ") + String(limit) + t(" 场 / 共 ") + String(total) + t(" 场") + capped;
  }
  return query === "" ? t("新梦在前 · 最多显示 ") + String(DEFAULT_LIMIT) + t(" 场") : t("搜索结果 · 最多显示 ") + String(DEFAULT_LIMIT) + t(" 场");
}

/** 面板的视图模型：所有文案/数字集中在这里算，组件只负责画。 */
function viewModelOf(dreams, stats, now) {
  const list = Array.isArray(dreams) ? dreams : [];
  const total = stats !== null && typeof stats === "object" && typeof stats.total === "number" ? stats.total : list.length;
  const moodRows = stats !== null && typeof stats === "object" && Array.isArray(stats.moods) ? stats.moods : [];
  const rawLessons = stats !== null && typeof stats === "object" && Array.isArray(stats.topLessons) ? stats.topLessons : [];
  const lessonTotal = rawLessons.reduce((sum, row) => sum + (typeof row.count === "number" ? row.count : 0), 0);
  // 排序规则（lead 定案）：出现次数降序，同次数按 lastAt 降序，再按文本；并列不加奖牌色。
  const sortedLessons = rawLessons.slice().sort((a, b) => (b.count - a.count)
    || (timestampOf(b.lastAt) - timestampOf(a.lastAt))
    || String(a.lesson).localeCompare(String(b.lesson), "zh"));
  const lessonRows = sortedLessons.map((row, index) => {
    const fromStats = timestampOf(row.lastAt) > 0;
    const knownAt = fromStats ? row.lastAt : localLastAtFor(list, row.lesson);
    return {
      rank: index + 1,
      lesson: row.lesson,
      count: row.count,
      share: Math.max(6, Math.round(row.count / Math.max(lessonTotal, 1) * 100)),
      showBar: row.count >= 2,
      candidate: row.count >= 3,
      lastText: knownAt === "" ? "" : (fromStats ? t("最近 ") : t("本页内最近 ")) + recentText(knownAt, now),
      lastTitle: knownAt === "" ? "" : formatDate(knownAt) + (formatTime(knownAt) === "" ? "" : " " + formatTime(knownAt))
        + (fromStats ? "" : t("（统计未给 lastAt，按本页已加载的 ") + String(list.length) + t(" 场现算）")),
    };
  });
  const span = spanOf(list);
  const spanText = span === null ? "" : spanTextOf(span);
  const spanFull = span === null ? "" : formatDate(new Date(span.from).toISOString()) + " → " + formatDate(new Date(span.to).toISOString());
  const spanHint = span === null ? "" : (span.days === 0 ? t("同一天") : t("约 ") + String(span.days) + t(" 天"));
  const blocks = list.slice().reverse().map((dream, index) => ({
    key: "block-" + (dream.id !== "" ? dream.id : "no-id") + "-" + String(index),
    tone: toneClass(moodSlot(dream.mood)),
    title: formatDate(dream.at) + (formatTime(dream.at) === "" ? "" : " " + formatTime(dream.at)) + " · " + dream.mood,
  }));
  const headline = headlineOf(list, total, span, now);
  return {
    total: total,
    count: list.length,
    showTiles: list.length >= 2,
    moodRows: moodRows,
    lessonRows: lessonRows,
    lessonTotal: lessonTotal,
    blocks: blocks,
    span: span,
    spanText: spanText,
    spanFull: spanFull,
    spanHint: spanHint,
    latestText: list.length === 0 ? "" : relativeTime(list[0].at, now),
    latestDate: list.length === 0 ? "" : formatDate(list[0].at),
    headline: headline,
    moodCount: moodRows.length,
  };
}

/** 标题行：1 场梦有专用文案（不出现「跨度 0 天」）；0 场不渲染。 */
function headlineOf(dreams, total, span, now) {
  if (dreams.length === 0) return "";
  if (dreams.length === 1 && total <= 1) {
    const dream = dreams[0];
    return t("第 1 场梦 · ") + formatDate(dream.at) + t(" · 心境「") + dream.mood + (languageOf() === "en" ? "”" : "」");
  }
  const parts = [];
  parts.push(total > dreams.length ? t("共 ") + String(total) + t(" 场梦 · 本页最近 ") + String(dreams.length) + t(" 场") : String(dreams.length) + t(" 场梦"));
  if (span !== null) parts.push(span.from === span.to ? formatDate(new Date(span.from).toISOString()) : formatDate(new Date(span.from).toISOString()) + " → " + formatDate(new Date(span.to).toISOString()));
  parts.push(t("最近：") + relativeTime(dreams[0].at, now));
  return parts.join(" · ");
}

function loadPrivacy() {
  try {
    if (typeof window === "undefined" || window === null || window.localStorage === undefined) return false;
    return window.localStorage.getItem(PRIVACY_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function savePrivacy(value) {
  try {
    if (typeof window === "undefined" || window === null || window.localStorage === undefined) return;
    window.localStorage.setItem(PRIVACY_KEY, value === true ? "1" : "0");
  } catch (error) { /* 隐私模式/配额满写不进去就算了，状态只活在内存里 */ }
}

// ───────────────────────── 小组件 ─────────────────────────

function Btn(props) {
  return h("button", {
    type: "button",
    className: "dshd-btn" + (props.variant === "primary" ? " primary" : "") + (props.on === true ? " on" : ""),
    onClick: props.onClick,
    disabled: props.disabled === true,
    title: props.title,
    "aria-expanded": props["aria-expanded"],
    "aria-pressed": props.pressed === undefined ? undefined : props.pressed,
  }, props.children);
}

function StatTile(props) {
  return h("div", { className: "dshd-tile" }, [
    h("div", { className: "dshd-tile-label", key: "l" }, props.label),
    h("div", { className: "dshd-tile-value", key: "v", title: props.title === undefined ? props.value : props.title }, props.value),
    props.hint === "" || props.hint === undefined ? null : h("div", { className: "dshd-tile-hint", key: "h", title: props.hint }, props.hint),
  ]);
}

function MoodCard(props) {
  const vm = props.vm;
  return h("section", { className: "dshd-card" }, [
    h("h4", { key: "t" }, t("心境")),
    h("div", { className: "dshd-mblocks", key: "blocks" }, vm.blocks.map((block) => h("span", {
      key: block.key,
      className: "dshd-mblock " + block.tone,
      title: block.title,
    }))),
    vm.count === 1
      ? h("div", { className: "dshd-hint", key: "one" }, t("1 场梦，先不谈分布 —— 再做梦会累积。"))
      : h("div", { key: "legend" }, [
          h("div", { className: "dshd-note", key: "cap" }, t("左 → 右：从早到晚")),
          h("div", { className: "dshd-legend", key: "rows" }, vm.moodRows.map((row, index) => h("div", { className: "dshd-legend-row", key: "mood-" + String(index) + "-" + row.mood }, [
            h("span", { className: "dshd-mblock " + toneClass(moodSlot(row.mood)), key: "d" }),
            h("span", { className: "dshd-legend-name", key: "n", title: row.mood }, row.mood),
            h("span", { className: "dshd-legend-count", key: "c" }, String(row.count) + t(" 场")),
          ]))),
        ]),
  ]);
}

function LessonCard(props) {
  const vm = props.vm;
  return h("section", { className: "dshd-card" }, [
    h("h4", { key: "t" }, t("教训榜")),
    vm.lessonRows.length === 0
      ? h("div", { className: "dshd-hint", key: "e" }, t("还没有教训 —— 记梦时带上 lessons，出现次数会在这里累积。"))
      : h("div", { key: "rows" }, vm.lessonRows.map((row, index) => h("div", { className: "dshd-lesson", key: "lesson-" + String(index) + "-" + row.lesson }, [
          h("span", { className: "dshd-rank", key: "r" }, String(row.rank)),
          h("span", { className: "dshd-lesson-body", key: "b" }, [
            h("span", { className: "dshd-lesson-text", key: "t" }, row.lesson),
            row.showBar ? h("span", { className: "dshd-track", key: "bar" }, h("span", { className: "dshd-fill", key: "fill", style: { width: String(row.share) + "%" } })) : null,
          ]),
          h("span", { className: "dshd-lesson-meta", key: "m" }, [
            h("span", { className: "dshd-times", key: "c" }, "×", h("b", { key: "n" }, String(row.count))),
            row.lastText === "" ? null : h("span", { className: "dshd-last", key: "l", title: row.lastTitle }, row.lastText),
            row.candidate ? h("span", { className: "dshd-badge", key: "badge" }, t("常见教训")) : null,
          ]),
        ]))),
    h("div", { className: "dshd-note", key: "note" }, t("次数仅表示日记里的出现频率；出现 ≥3 次标为「常见教训」。写入项目规则前仍需核验来源并审阅经验。最近时间取自 stats.lastAt；统计缺失时按本页已加载的梦现算。")),
  ]);
}

/** 复制命令按钮：成功给「已复制」，剪贴板不可用时回退为可选中文本。 */
function CopyCommand(props) {
  const command = typeof props.command === "string" ? props.command : "";
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  if (command === "") return null;
  const onCopy = function () {
    copyText(command).then(function (ok) {
      setCopied(ok === true);
      setFailed(ok !== true);
    });
  };
  const label = props.label === undefined ? t("复制命令") : props.label;
  return h("span", { className: "dshd-copywrap" }, [
    h(Btn, { key: "b", onClick: onCopy, disabled: props.disabled === true, title: props.title === undefined ? command : props.title }, copied === true ? t("已复制") : label),
    failed === true ? h("code", { key: "cmd", className: "dshd-cmd", tabIndex: 0 }, command) : null,
    failed === true ? h("span", { key: "hint", className: "dshd-note" }, t("剪贴板不可用：请手动选中上面的命令复制。")) : null,
  ]);
}

/** 面板保持只读：先让人看清决策，再生成可直接粘贴进对话的完整命令。 */
function ReviewControls(props) {
  const row = props.row;
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(reviewActionFor(row.state));
  const [resolution, setResolution] = useState("prefer");
  const [note, setNote] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackRetry, setFeedbackRetry] = useState(null);
  const [affected, setAffected] = useState(function () { return row.conflictIds[0] || ""; });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const commands = row.state === "rejected" ? [["reopen", t("重新送审")]]
    : row.state === "disputed" ? [["resolve-conflict", t("处理冲突")], ["reject", t("驳回这条")]]
    : row.state === "usable" ? [["mark-stale", t("标记待复核")], ["reject", t("驳回")]]
    : [["accept", t("采纳")], ["reject", t("驳回")], ["mark-stale", t("标记待复核")]];
  const effectiveAction = commands.some(function (item) { return item[0] === action; }) ? action : commands[0][0];
  const command = reviewCommandOf(row, { action: effectiveAction, resolution: resolution, note: note, affectedIds: affected === "" ? [] : [affected] });
  const submit = async function (body, message, isPreview) {
    if (pending) return;
    setPending(true); setError("");
    try {
      const result = await postAction(body);
      if (isPreview) setPreview(result);
      else { setPreview(null); if (props.onChanged) props.onChanged(result.unchanged === true ? t("管理块内容已一致，无需写入。") : message); }
    } catch (failure) {
      setError(failure.name === "TimeoutError" ? t("请求超时，请先刷新确认结果后再重试。") : displayError(failure));
      if (body.operation === "apply") setPreview(null);
    } finally { setPending(false); }
  };
  const review = function (chosen) {
    return submit({ operation: "review", action: chosen, lessonId: row.id, expectedRevision: row.revision, resolution: resolution, note: note, affectedIds: affected === "" ? [] : [affected] }, t("已更新「") + row.title + t("」的审阅状态。"));
  };
  const feedback = function (vote) {
    const signature = row.id + "@" + row.revision + ":" + vote + ":" + feedbackNote;
    const requestId = feedbackRetry && feedbackRetry.signature === signature ? feedbackRetry.id
      : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "feedback_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    setFeedbackRetry({ signature: signature, id: requestId });
    return submit({ operation: "feedback", lessonId: row.id, expectedRevision: row.revision, vote: vote, requestId: requestId, ...(feedbackNote.trim() === "" ? {} : { note: feedbackNote.trim() }) }, t("已记录使用反馈；「") + row.title + t("」的审阅状态保持原样。"));
  };
  return h("div", { className: "dshd-review", role: "group", "aria-label": row.title + t("的操作"), onClick: function (event) { event.stopPropagation(); } }, [
    h("div", { className: "dshd-kcmd", key: "buttons" }, [
      ...commands.filter(function (item) { return item[0] !== "resolve-conflict"; }).map(function (item) {
        return h(Btn, { key: item[0], disabled: pending || row.revision < 1, onClick: function () { review(item[0]); } }, item[1]);
      }),
      h(Btn, { key: "review", disabled: pending, onClick: function () { setOpen(!open); }, "aria-expanded": open }, open ? t("收起审阅") : row.state === "disputed" ? t("处理冲突") : t("审阅详情")),
      row.bridgeable === true && row.workspaceRoot !== "" ? h(Btn, { key: "preview", disabled: pending, onClick: function () { submit({ operation: "preview", lessonId: row.id, expectedRevision: row.revision }, "", true); } }, t("预览规则变更")) : null,
      row.bridgeable === true && row.workspaceRoot === "" ? h(CopyCommand, { key: "preview-command", command: bridgePreviewCommandOf(row.id, row.projectId, row.workspaceRoot), label: t("复制项目预览命令") }) : null,
    ]),
    pending ? h("div", { key: "pending", role: "status", className: "dshd-note" }, t("正在处理…")) : null,
    error !== "" ? h("div", { key: "error", role: "alert", className: "dshd-hint" }, [error, h(Btn, { key: "refresh", disabled: pending, onClick: function () { if (props.onChanged) props.onChanged(t("已刷新经验列表。")); } }, t("刷新列表"))]) : null,
    open ? h("div", { className: "dshd-reviewform", key: "form", onKeyDown: function (event) {
      if (event.key === "Escape" && !pending) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    } }, [
      h("label", { key: "action" }, [t("审阅动作"), h("select", { "aria-label": t("审阅动作"), disabled: pending, value: effectiveAction, onChange: function (event) { setAction(event.target.value); } }, commands.map(function (item) { return h("option", { value: item[0], key: item[0] }, item[1]); }))]),
      effectiveAction === "resolve-conflict" ? h("div", { key: "conflict" }, [
        h("label", { key: "against" }, [t("冲突经验"), h("select", { "aria-label": t("冲突经验"), disabled: pending, value: affected, onChange: function (event) { setAffected(event.target.value); } }, row.conflicts.map(function (item) { return h("option", { key: item.id, value: item.id, title: item.title }, item.title); }))]),
        h("label", { key: "resolution" }, [t("处理方式"), h("select", { "aria-label": t("处理方式"), disabled: pending, value: resolution, onChange: function (event) { setResolution(event.target.value); } }, [
          h("option", { key: "prefer", value: "prefer" }, t("采用这条，驳回对方")),
          h("option", { key: "drop", value: "drop" }, t("放弃这条，保留对方")),
          h("option", { key: "merge", value: "merge" }, t("合并到这条，对方留作历史")),
        ])]),
        h("label", { key: "note" }, [t("处理依据"), h("textarea", { "aria-label": t("处理依据"), disabled: pending, rows: 2, maxLength: 500, value: note, placeholder: t("说明哪个来源支持这次决定…"), onChange: function (event) { setNote(event.target.value); } })]),
      ]) : null,
      h(Btn, { key: "confirm", disabled: pending || command === "", onClick: function () { review(effectiveAction); }, variant: "primary" }, t("确认审阅")),
      h("details", { key: "fallback" }, [h("summary", { key: "summary" }, t("在对话里处理")), command === "" ? h("div", { key: "hint", className: "dshd-note" }, t("选择冲突经验并填写处理依据后即可处理。")) : h(CopyCommand, { key: "copy", command: command, label: t("复制审阅命令") })]),
    ]) : null,
    preview ? h("section", { key: "preview", className: "dshd-reviewform", "aria-label": t("规则变更预览") }, [
      h("strong", { key: "heading" }, t("规则变更预览")),
      h("div", { key: "target", className: "dshd-note" }, t("目标：") + preview.resolvedPath),
      h("pre", { key: "diff", className: "dshd-diff", tabIndex: 0 }, preview.diff || t("管理块内容已经一致，无需更改。")),
      h("div", { key: "help", className: "dshd-note" }, t("将按此预览重建 Dream 管理块，请核对新增和删除内容。块外内容保留，写入前创建回滚备份。")),
      h(Btn, { key: "apply", disabled: pending, variant: "primary", onClick: function () { submit({ operation: "apply", token: preview.token }, t("规则已应用，可在「写入记录」中回滚。")); } }, t("应用此变更")),
      h(Btn, { key: "cancel", disabled: pending, onClick: function () { setPreview(null); } }, t("取消预览")),
    ]) : null,
    h("details", { key: "feedback", className: "dshd-feedback" }, [
      h("summary", { key: "summary" }, t("使用反馈 · 有用 ") + (row.feedback.useful || 0) + t(" · 不适用 ") + (row.feedback.notApplicable || 0)),
      h("label", { key: "note" }, [t("场景备注（可选）"), h("textarea", { "aria-label": t("反馈场景备注"), rows: 2, disabled: pending, maxLength: 500, value: feedbackNote, placeholder: t("这次在哪个场景使用…"), onChange: function (event) { setFeedbackNote(event.target.value); } })]),
      h(Btn, { key: "useful", disabled: pending, onClick: function () { feedback("useful"); } }, t("这次有用")),
      h(Btn, { key: "not", disabled: pending, onClick: function () { feedback("not-applicable"); } }, t("这次不适用")),
      h("div", { key: "help", className: "dshd-note" }, t("记录使用情况，供之后复核；采纳与驳回由审阅决定。")),
      ...(Array.isArray(row.feedback.recent) ? row.feedback.recent.slice(-3).reverse().map(function (item, index) {
        return h("div", { key: "recent-" + index, className: "dshd-note" }, formatDate(item.at) + " · " + (item.vote === "useful" ? t("有用") : t("不适用")) + (item.note ? " · " + item.note : ""));
      }) : []),
    ]),
  ]);
}

function RollbackControl(props) {
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const rollback = async function () {
    if (pending) return;
    setPending(true); setError("");
    try {
      await postAction({ operation: "rollback", backupId: props.row.id });
      setConfirm(false);
      if (props.onChanged) props.onChanged(t("已恢复上一次的 Dream 管理块，块外内容保留。"));
    } catch (failure) { setError(displayError(failure)); }
    finally { setPending(false); }
  };
  return h("div", { className: "dshd-reviewform" }, [
    h(Btn, { key: "start", disabled: pending, onClick: function () { setConfirm(!confirm); } }, confirm ? t("取消回滚") : t("回滚这次变更")),
    confirm ? h("div", { key: "confirm" }, [
      h("p", { key: "target", className: "dshd-note" }, t("将恢复「") + props.row.target + t("」的前一个 Dream 管理块。块外内容保留；管理块已被修改时会拒绝回滚。")),
      h(Btn, { key: "apply", variant: "primary", disabled: pending, onClick: rollback }, pending ? t("正在回滚…") : t("确认回滚管理块")),
    ]) : null,
    error ? h("div", { key: "error", role: "alert", className: "dshd-hint" }, error) : null,
  ]);
}

function KnowledgeRow(props) {
  const row = props.row;
  const privacy = props.privacy === true;
  const [peek, setPeek] = useState(false);
  const reveal = privacy === true ? function () { setPeek(peek !== true); } : undefined;
  return h("div", {
    className: "dshd-knowledge " + row.stateClass + (privacy === true && peek === true ? " dshd-peek" : ""),
    onClick: reveal,
    title: privacy === true ? t("隐私模式：点击此条临时查看") : undefined,
  }, [
    h("div", { className: "dshd-khead", key: "h" }, [
      h("span", { className: "dshd-kbadge", key: "b" }, row.stateLabel),
      h("span", { className: "dshd-ktitle", key: "t", title: row.title }, row.title),
    ]),
    h("div", { className: "dshd-kmeta", key: "m" }, [
      h("span", { className: "dshd-klast", key: "l", title: row.lastTitle }, t("最近核验：") + row.lastText),
    ]),
    h("div", { className: "dshd-kbody", key: "body" }, [
      h("div", { key: "when" }, t("何时用：") + (row.when !== "" ? row.when : t("未标注适用条件"))),
      h("div", { key: "action", className: "dshd-action" }, t("怎么做：") + (row.action || t("未标注具体动作"))),
      h("details", { key: "details", onClick: function (event) { event.stopPropagation(); } }, [
        h("summary", { key: "summary" }, t("适用范围与证据")),
        h("div", { key: "scope" }, t("范围：") + row.scopeLabel),
        row.applicability !== "" ? h("div", { key: "applicability" }, t("适用：") + row.applicability) : null,
        row.exceptions.length > 0 ? h("div", { key: "exceptions" }, t("例外：") + row.exceptions.join("；")) : null,
        h("div", { key: "evidence" }, t("证据：") + row.evidenceSummary),
        row.evidence.length === 0 ? h("div", { key: "sources-empty", className: "dshd-note" }, t("没有关联来源记录，采纳前请核对依据。")) : h("div", { key: "sources", className: "dshd-sources" }, row.evidence.map(function (item) {
          return h("details", { key: item.id }, [
            h("summary", { key: "summary" }, t("来源记录 · ") + (item.verification === "read" ? t("已读到来源") : t("待核验")) + " · " + (item.kind === "session" ? t("会话") : item.kind === "user-correction" ? t("用户纠正") : t("本地资料"))),
            h("div", { key: "summary-text" }, item.summary || t("未提供摘要")),
            item.sessionId ? h("div", { key: "session", className: "dshd-note" }, t("会话：") + item.sessionId + (Number.isInteger(item.recordSeq) ? t(" · 记录 ") + item.recordSeq : "")) : null,
            h("div", { key: "date", className: "dshd-note" }, t("记录时间：") + formatDate(item.observedAt)),
            item.verificationReason ? h("div", { key: "reason", className: "dshd-note" }, t("核验说明：") + item.verificationReason) : null,
            item.sourceHash ? h("code", { key: "hash", className: "dshd-cmd", title: item.sourceHash }, t("来源校验值：") + item.sourceHash) : null,
          ]);
        })),
      ]),
      props.showHoldReason === true && row.holdReasonLabel !== "" ? h("div", { key: "hold", className: "dshd-holdreason" }, t("为什么被扣下：") + row.holdReasonLabel) : null,
    ]),
    h(ReviewControls, { row: row, key: row.id + "@" + row.revision, onChanged: props.onChanged }),
  ]);
}

function KnowledgeCard(props) {
  const vm = props.vm;
  const [stateFilter, setStateFilter] = useState("usable");
  const [pageSize, setPageSize] = useState(5);
  const reviewed = vm.rows.filter(function (row) { return row.state === stateFilter; });
  const notice = knowledgeNoticeText(vm === null || vm === undefined ? null : vm.stats);
  const noticeNode = notice === "" ? null : h("div", { className: "dshd-knotice", key: "notice", role: "status" }, notice);
  const head = function (extra) {
    return h("div", { className: "dshd-khead", key: "head" }, [
      h("h4", { key: "t" }, t("已审阅经验")),
      h("span", { className: "dshd-spacer", key: "s" }),
      extra,
    ]);
  };
  if (props.error !== null && props.error !== undefined) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, t("重试"))),
      h("div", { className: "dshd-hint", key: "e", role: "alert" }, t("读取经验失败：") + displayError(props.error)),
      h("div", { className: "dshd-note", key: "n" }, t("旧日记不受影响；修好后点「重试」。")),
    ]);
  }
  if (props.empty === true) {
    const empty = knowledgeEmptyState();
    return h("section", { className: "dshd-card dshd-kcard" }, [
      h("h4", { key: "t" }, t("经验")),
      noticeNode,
      h("div", { className: "dshd-kempty", key: "e" }, [
        h("div", { className: "dshd-kempty-title", key: "t2" }, empty.title),
        h("p", { className: "dshd-kempty-body", key: "b" }, empty.body),
        h("p", { className: "dshd-note", key: "h" }, empty.hint),
      ]),
    ]);
  }
  return h("section", { className: "dshd-card dshd-kcard" }, [
    head(props.loading === true
      ? h("span", { className: "dshd-hint", key: "loading" }, t("加载中…"))
      : h("span", { className: "dshd-hint", key: "count" }, knowledgeCountText(vm.stats))),
    noticeNode,
    h("label", { className: "dshd-note", key: "filter" }, [t("查看 "), h("select", { "aria-label": t("经验状态"), value: stateFilter, onChange: function (event) { setStateFilter(event.target.value); setPageSize(5); } }, [
      h("option", { key: "usable", value: "usable" }, t("可用经验")), h("option", { key: "rejected", value: "rejected" }, t("已驳回历史")),
    ])]),
    reviewed.length === 0 ? h("div", { className: "dshd-hint", key: "none" }, stateFilter === "usable" ? t("暂无可用经验；待核实的记录在下方。") : t("没有已驳回记录。")) : null,
    h("div", { className: "dshd-krows", key: "rows" }, reviewed.slice(0, pageSize).map(function (row, index) {
      return h(KnowledgeRow, { key: row.id !== "" ? row.id : "k" + String(index), row: row, onChanged: props.onChanged, privacy: props.privacy === true });
    })),
    reviewed.length > pageSize ? h(Btn, { key: "next", onClick: function () { setPageSize(pageSize + 5); } }, t("显示更多经验")) : null,
    vm.shown < vm.total
      ? h("div", { className: "dshd-note", key: "more" }, t("只显示最近 ") + String(vm.shown) + " / " + String(vm.total) + t(" 条经验。"))
      : null,
    h("div", { className: "dshd-note", key: "note" }, t("采纳记录仍需满足当前任务的平台、版本与项目条件；来源已读不代表结论永远适用。")),
  ]);
}

/** 「待核实」只读区块：candidate / disputed / stale + 被扣下的原因（复用 KnowledgeRow）。 */
function ReviewQueueCard(props) {
  const vm = props.vm;
  const [pageSize, setPageSize] = useState(5);
  const rows = vm !== null && vm !== undefined && Array.isArray(vm.rows)
    ? vm.rows.filter(function (row) { return HELD_STATES.indexOf(row.state) !== -1; })
    : [];
  const head = function (extra) {
    return h("div", { className: "dshd-khead", key: "head" }, [
      h("h4", { key: "t" }, t("待核实")),
      h("span", { className: "dshd-spacer", key: "s" }),
      extra,
    ]);
  };
  if (props.error !== null && props.error !== undefined) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, t("重试"))),
      h("div", { className: "dshd-hint", key: "e", role: "alert" }, t("读取经验失败：") + displayError(props.error)),
    ]);
  }
  if (props.loading === true && rows.length === 0) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h("span", { className: "dshd-hint", key: "l" }, t("加载中…"))),
    ]);
  }
  return h("section", { className: "dshd-card dshd-kcard" }, [
    head(rows.length === 0 ? null : h("span", { className: "dshd-hint", key: "c" }, String(rows.length) + t(" 条待核实"))),
    rows.length === 0
      ? h("div", { className: "dshd-kempty", key: "empty" }, [
          h("div", { className: "dshd-kempty-title", key: "t" }, t("没有待核实的经验")),
          h("p", { className: "dshd-kempty-body", key: "b" }, reviewQueueEmptyState()),
        ])
      : h("div", { className: "dshd-krows", key: "rows" }, rows.slice(0, pageSize).map(function (row, index) {
          return h(KnowledgeRow, { key: row.id !== "" ? row.id : "held-" + String(index), row: row, onChanged: props.onChanged, privacy: props.privacy === true, showHoldReason: true });
        })),
    rows.length > pageSize ? h(Btn, { key: "more", onClick: function () { setPageSize(pageSize + 5); } }, t("显示更多待核实经验")) : null,
    h("div", { className: "dshd-note", key: "note" }, t("这些经验默认不会作为任务建议注入。先核对来源与适用范围，再决定采纳、驳回或继续复核。")),
  ]);
}

/** 「写入记录」只读区块：<journalDir>/bridge/ 的桥接应用记录。 */
function BridgeLogCard(props) {
  const vm = props.vm;
  const head = function (extra) {
    return h("div", { className: "dshd-khead", key: "head" }, [
      h("h4", { key: "t" }, t("写入记录")),
      h("span", { className: "dshd-spacer", key: "s" }),
      extra,
    ]);
  };
  if (props.error !== null && props.error !== undefined) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, t("重试"))),
      h("div", { className: "dshd-hint", key: "e", role: "alert" }, t("读取写入记录失败：") + displayError(props.error)),
    ]);
  }
  if (props.loading === true) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h("span", { className: "dshd-hint", key: "l" }, t("加载中…"))),
    ]);
  }
  if (vm.rows.length === 0) {
    const empty = bridgeEmptyState();
    return h("section", { className: "dshd-card dshd-kcard" }, [
      h("h4", { key: "t" }, t("写入记录")),
      h("div", { className: "dshd-kempty", key: "empty" }, [
        h("div", { className: "dshd-kempty-title", key: "t2" }, empty.title),
        h("p", { className: "dshd-kempty-body", key: "b" }, empty.body),
        h("p", { className: "dshd-note", key: "h" }, empty.hint),
      ]),
    ]);
  }
  return h("section", { className: "dshd-card dshd-kcard" }, [
    head(h("span", { className: "dshd-hint", key: "c" }, String(vm.total) + t(" 次写入 · ") + String(vm.rollbackable) + t(" 次可回滚"))),
    h("div", { className: "dshd-krows", key: "rows" }, vm.rows.map(function (row, index) {
      return h("div", { className: "dshd-bridge", key: row.id !== "" ? row.id : "bridge-" + String(index) }, [
        h("div", { className: "dshd-bridge-head", key: "h" }, [
          h("span", { className: "dshd-kbadge", key: "a" }, row.actionLabel),
          h("span", { className: "dshd-bridge-target", key: "t", title: row.target }, row.target),
          h("span", { className: "dshd-spacer", key: "s" }),
          h("span", { className: "dshd-klast", key: "at", title: row.atTitle }, row.atText),
        ]),
        h("div", { className: "dshd-bridge-meta", key: "m" }, [
          h("span", { key: "lessons", title: row.lessonsText }, t("经验：") + row.lessonsText),
          row.beforeShort === "" ? null : h("span", { key: "before" }, t("前哈希：") + row.beforeShort),
          row.afterShort === "" ? null : h("span", { key: "after" }, t("后哈希：") + row.afterShort),
          h("span", { key: "rb", className: row.rollbackable === true ? "dshd-rollback-ok" : "dshd-rollback-no" }, row.rollbackText),
        ]),
        h("details", { key: "backup" }, [
          h("summary", { key: "summary" }, t("备份标识与回滚命令")),
          h("code", { key: "id", className: "dshd-cmd" }, row.id),
          row.rollbackable === true ? h("code", { key: "command", className: "dshd-cmd", tabIndex: 0 }, bridgeRollbackCommandOf(row)) : null,
        ]),
        row.rollbackable === true ? h(RollbackControl, { key: "rollback", row: row, onChanged: props.onChanged }) : null,
      ]);
    })),
    vm.shown < vm.total ? h("div", { className: "dshd-note", key: "more" }, t("只显示最近 ") + String(vm.shown) + " / " + String(vm.total) + t(" 条记录。")) : null,
    h("div", { className: "dshd-note", key: "note" }, t("回滚恢复对应备份的 Dream 管理块；块外内容保留，外部修改的管理块会停止回滚。")),
  ]);
}

function DreamCard(props) {
  const dream = props.dream;
  const privacy = props.privacy === true;
  const collapsible = isCollapsible(dream.reflection);
  const [expanded, setExpanded] = useState(false);
  const [peek, setPeek] = useState(false);
  const timeText = formatDate(dream.at) + (formatTime(dream.at) === "" ? "" : " " + formatTime(dream.at));
  const clickCard = privacy ? function () { setPeek(peek !== true); } : undefined;
  return h("article", {
    className: "dshd-dream dshd-mood-" + String(moodSlot(dream.mood)) + (privacy && peek === true ? " dshd-peek" : ""),
    onClick: clickCard,
    title: privacy ? t("隐私模式：点击卡片临时查看") : undefined,
  }, [
    h("header", { className: "dshd-dream-head", key: "h" }, [
      h("time", { className: "dshd-time", key: "t", dateTime: dream.at === "" ? undefined : dream.at, title: dream.at === "" ? timeText : timeText + " · " + dream.at }, timeText),
      dreamAgo(dream, props.now) === "" ? null : h("span", { className: "dshd-ago", key: "a" }, dreamAgo(dream, props.now)),
      h("span", { className: "dshd-mood", key: "m", title: t("心境：") + dream.mood }, [
        h("i", { className: "dshd-mooddot " + toneClass(moodSlot(dream.mood)), key: "d" }),
        dream.mood,
      ]),
      h("span", { className: "dshd-spacer", key: "s" }),
      collapsible ? h("button", {
        type: "button",
        className: "dshd-linkbtn",
        key: "btn",
        onClick: function (event) { if (event !== undefined && event.stopPropagation !== undefined) event.stopPropagation(); setExpanded(expanded !== true); },
      }, expanded === true ? t("收起") : t("展开全文")) : null,
    ]),
    h("div", { className: "dshd-reflection" + (collapsible && expanded !== true ? " dshd-clamp" : ""), key: "r" }, inlineNodes(dream.reflection, "reflection-" + String(props.index))),
    dream.lessons.length === 0 ? null : h("ol", { className: "dshd-lessons", key: "l" }, dream.lessons.map((lesson, index) => h("li", { key: "li-" + String(index) + "-" + lesson }, [
      h("span", { className: "dshd-num", key: "n" }, String(index + 1)),
      h("span", { className: "dshd-lesson-li", key: "t" }, inlineNodes(lesson, "lesson-" + String(props.index) + "-" + String(index))),
    ]))),
  ]);
}

function EmptyState(props) {
  const moon = h("svg", { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", key: "i" }, [
    h("path", { key: "p", d: "M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" }),
  ]);
  if (props.query !== undefined && props.query !== "") {
    return h("div", { className: "dshd-empty" }, [
      moon,
      h("h3", { key: "t" }, t("没有找到「") + props.query + t("」相关的梦")),
      h("p", { key: "p" }, t("换个关键词试试，或者清空搜索看全部梦境。")),
      props.onClear ? h("div", { key: "a" }, h(Btn, { onClick: props.onClear }, t("清空搜索"))) : null,
    ]);
  }
  return h("div", { className: "dshd-empty" }, [
    moon,
    h("h3", { key: "t" }, t("还没有梦境日记")),
    h("p", { key: "p" }, t("对 agent 说「做个梦」，它会回放最近的会话、反思之后把第一场梦写进这里。")),
    h("div", { className: "dshd-chips", key: "c" }, [
      h("span", { className: "dshd-chip", key: "s1" }, t("对 agent 说「做个梦」")),
      h("span", { className: "dshd-chip", key: "s2" }, "dream_digest → dream_save"),
    ]),
  ]);
}

function Skeleton() {
  return h("div", null, [0, 1, 2].map((index) => h("div", { className: "dshd-skel", key: String(index) })));
}

// ───────────────────────── 主面板 ─────────────────────────

function DreamPanel() {
  const [activeTab, setActiveTab] = useState("journal");
  const [dreams, setDreams] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [actionNotice, setActionNotice] = useState("");
  const [now, setNow] = useState(function () { return new Date(); });
  const [privacy, setPrivacy] = useState(loadPrivacy);
  const [filters, setFilters] = useState({ moods: [], withLessons: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [knowledge, setKnowledge] = useState(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);
  const [knowledgeError, setKnowledgeError] = useState(null);
  const [bridge, setBridge] = useState(null);
  const [bridgeLoading, setBridgeLoading] = useState(true);
  const [bridgeError, setBridgeError] = useState(null);

  // 搜索防抖：连续打字只发一次请求；回车立即生效。
  useEffect(function () {
    const timer = setTimeout(function () { setQuery(queryInput.trim()); }, SEARCH_DEBOUNCE_MS);
    return function () { clearTimeout(timer); };
  }, [queryInput]);

  useEffect(function () {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchJournal(query, limit).then(function (payload) {
      if (alive !== true) return;
      const list = normalizeDreams(payload.dreams, limit);
      setDreams(list);
      setStats(normalizeStats(payload.stats, list));
      setNow(new Date());
      setLoading(false);
    }).catch(function (failure) {
      if (alive !== true) return;
      setError(failure instanceof Error ? failure : new Error(String(failure)));
      setLoading(false);
    });
    return function () { alive = false; };
  }, [query, reloadToken]);

  // 经验区块独立取数：知识路由挂了但日记读不出来时，经验仍能显示（反之亦然）。
  useEffect(function () {
    let alive = true;
    setKnowledgeLoading(true);
    setKnowledgeError(null);
    fetchKnowledge().then(function (payload) {
      if (alive !== true) return;
      setKnowledge(payload);
      setKnowledgeLoading(false);
    }).catch(function (failure) {
      if (alive !== true) return;
      setKnowledgeError(failure instanceof Error ? failure : new Error(String(failure)));
      setKnowledgeLoading(false);
      setKnowledge(null);
    });
    return function () { alive = false; };
  }, [reloadToken]);

  // 写入记录独立取数：桥接目录不存在时返回空，不影响其余区块。
  useEffect(function () {
    let alive = true;
    setBridgeLoading(true);
    setBridgeError(null);
    fetchBridgeRecords().then(function (payload) {
      if (alive !== true) return;
      setBridge(payload);
      setBridgeLoading(false);
    }).catch(function (failure) {
      if (alive !== true) return;
      setBridgeError(failure instanceof Error ? failure : new Error(String(failure)));
      setBridgeLoading(false);
      setBridge(null);
    });
    return function () { alive = false; };
  }, [reloadToken]);

  const vm = viewModelOf(dreams, stats, now);
  const knowledgeVm = knowledge === null ? { rows: [], total: 0, shown: 0, stats: null } : normalizeKnowledge(knowledge, now);
  const bridgeVm = bridge === null ? { rows: [], total: 0, shown: 0, rollbackable: 0 } : normalizeBridgeRecords(bridge, now);
  const pristine = vm.count === 0 && query === "";
  const filterCount = filterCountOf(filters);
  const visibleDreams = applyFilters(dreams, filters);
  const showFilterButton = shouldShowFilters(vm.count) || filterCount > 0;
  const canLoadMore = needsOlderDreams(vm.count, vm.total) && limit < MORE_LIMIT;

  const reload = function () { setReloadToken(function (value) { return value + 1; }); };
  const clearSearch = function () { setQueryInput(""); setQuery(""); };
  const togglePrivacy = function () {
    const next = privacy !== true;
    setPrivacy(next);
    savePrivacy(next);
  };
  const toggleMoodFilter = function (mood) {
    setFilters(function (prev) {
      const has = prev.moods.indexOf(mood) !== -1;
      return { moods: has === true ? prev.moods.filter(function (item) { return item !== mood; }) : prev.moods.concat([mood]), withLessons: prev.withLessons === true };
    });
  };
  const toggleOnlyLessons = function () {
    setFilters(function (prev) { return { moods: prev.moods, withLessons: prev.withLessons !== true }; });
  };
  const clearFilters = function () { setFilters({ moods: [], withLessons: false }); };
  const showMore = function () { if (limit < MORE_LIMIT) setLimit(MORE_LIMIT); };
  const onChanged = function (message) { setActionNotice(message); setReloadToken(function (value) { return value + 1; }); };
  const showKnowledge = function () { if (knowledgeLoading !== true) setReloadToken(function (value) { return value + 1; }); };
  const knowledgeCard = h(KnowledgeCard, {
    key: "knowledge",
    vm: knowledgeVm,
    loading: knowledgeLoading === true,
    error: knowledgeError,
    empty: knowledgeError === null && knowledgeLoading !== true && knowledgeVm.rows.length === 0,
    privacy: privacy === true,
    onRetry: showKnowledge,
    onChanged: onChanged,
  });
  const reviewQueueCard = h(ReviewQueueCard, {
    key: "review-queue",
    vm: knowledgeVm,
    loading: knowledgeLoading === true,
    error: knowledgeError,
    privacy: privacy === true,
    onRetry: showKnowledge,
    onChanged: onChanged,
  });
  const showBridge = function () { if (bridgeLoading !== true) setReloadToken(function (value) { return value + 1; }); };
  const bridgeLogCard = h(BridgeLogCard, {
    key: "bridge-log",
    vm: bridgeVm,
    loading: bridgeLoading === true,
    error: bridgeError,
    onRetry: showBridge,
    onChanged: onChanged,
  });

  // 筛选 popover：点面板外任意处收起；纯 node 冒烟没有事件系统就跳过。
  useEffect(function () {
    if (filterOpen !== true) return function () {};
    if (typeof document === "undefined" || document === null || typeof document.addEventListener !== "function") return function () {};
    const onDown = function (event) {
      const pop = document.querySelector(".dshd-filterpop");
      if (pop !== null && typeof pop.contains === "function" && pop.contains(event.target) === true) return;
      setFilterOpen(false);
    };
    const onKey = function (event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setFilterOpen(false);
      const trigger = document.querySelector(".dshd-filter button");
      if (trigger && typeof trigger.focus === "function") trigger.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return function () { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true); };
  }, [filterOpen]);

  const searchIcon = h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", key: "i" }, [
    h("circle", { key: "c", cx: 11, cy: 11, r: 7 }),
    h("path", { key: "l", d: "M20 20l-3.2-3.2" }),
  ]);

  const toolbar = h("div", { className: "dshd-toolbar", key: "toolbar" }, [
    pristine || activeTab !== "journal" ? null : h("div", { className: "dshd-search", key: "search" }, [
      searchIcon,
      h("input", {
        key: "search-input",
        className: "dshd-input",
        type: "text",
        value: queryInput,
        placeholder: t("搜索反思与教训…"),
        "aria-label": t("搜索梦境"),
        onChange: function (event) { setQueryInput(event.target.value); },
        onKeyDown: function (event) { if (event.key === "Enter") setQuery(event.target.value.trim()); },
      }),
      queryInput === "" ? null : h("button", {
        key: "clear-search",
        type: "button",
        className: "dshd-clear",
        "aria-label": t("清空搜索"),
        onClick: clearSearch,
      }, "×"),
    ]),
    h("span", { className: "dshd-spacer", key: "spacer" }),
    pristine || activeTab !== "journal" ? null : h("span", { className: "dshd-hint", key: "count" }, loading === true
      ? t("加载中…")
      : countTextOf(query, vm.total, vm.count, filterCount, visibleDreams.length)),
    showFilterButton === true && activeTab === "journal" ? h("div", { className: "dshd-filter", key: "filter" }, [
      h(Btn, {
        key: "btn",
        on: filterCount > 0,
        pressed: filterCount > 0,
        onClick: function () { setFilterOpen(filterOpen !== true); },
        title: t("筛选作用于已加载窗口，不影响全量统计"),
      }, t("筛选") + (filterCount > 0 ? " · " + String(filterCount) : "") + " ▾"),
      filterOpen === true ? h("div", { className: "dshd-filterpop", key: "pop", role: "group", "aria-label": t("筛选梦境") }, [
        h("div", { className: "dshd-filtertitle", key: "title" }, t("筛选当前已加载的 ") + String(vm.count) + t(" 场，不影响全量统计")),
        h("div", { key: "moods" }, vm.moodRows.map(function (row) {
          const on = filters.moods.indexOf(row.mood) !== -1;
          return h("button", {
            key: "mood-" + row.mood,
            type: "button",
            className: "dshd-chipbtn" + (on === true ? " on" : ""),
            "aria-pressed": on === true ? "true" : "false",
            onClick: function () { toggleMoodFilter(row.mood); },
          }, row.mood);
        })),
        h("div", { key: "only" }, h("button", {
          type: "button",
          className: "dshd-chipbtn" + (filters.withLessons === true ? " on" : ""),
          "aria-pressed": filters.withLessons === true ? "true" : "false",
          onClick: toggleOnlyLessons,
        }, t("只看有教训的梦"))),
        h("div", { className: "dshd-filterfoot", key: "foot" }, [
          h("button", { key: "clearbtn", type: "button", className: "dshd-linkbtn", onClick: clearFilters, disabled: filterCount === 0 }, t("清空筛选")),
          h(Btn, { key: "done", onClick: function () { setFilterOpen(false); } }, t("完成")),
        ]),
      ]) : null,
    ]) : null,
    pristine ? null : h(Btn, {
      key: "privacy",
      onClick: togglePrivacy,
      on: privacy === true,
      pressed: privacy === true,
      title: t("显示层模糊；DOM 仍为明文，不改文件、不加密"),
    }, privacy === true ? t("隐私模式：开") : t("隐私模式")),
    h(Btn, { key: "refresh", onClick: reload, disabled: loading === true, title: t("重新读取梦境日记") }, t("刷新")),
  ]);

  const errorBox = error === null ? null : h("div", { className: "dshd-alert error", role: "alert", key: "error" }, [
    h("span", { key: "m" }, t("读取梦境日记失败：") + displayError(error)),
    h("span", { className: "dshd-spacer", key: "s" }),
    h(Btn, { key: "retry", onClick: reload, variant: "primary" }, t("重试")),
  ]);

  const body = function () {
    if (activeTab === "knowledge") return h("div", { key: "knowledge-tab" }, [actionNotice ? h("div", { key: "notice", className: "dshd-knotice", role: "status" }, actionNotice) : null, knowledgeCard, reviewQueueCard]);
    if (activeTab === "bridge") return h("div", { key: "bridge-tab" }, [actionNotice ? h("div", { key: "notice", className: "dshd-knotice", role: "status" }, actionNotice) : null, bridgeLogCard]);
    if (loading === true && vm.count === 0) return h(Skeleton, { key: "skeleton" });
    if (vm.count === 0) {
      if (error !== null) return h("div", { key: "failed-wrap" }, [
        h("div", { className: "dshd-empty", key: "failed" }, [
          h("h3", { key: "t" }, t("暂时读不到梦境日记")),
          h("p", { key: "p" }, t("等宿主路由就绪后点上面的「重试」；如果一直失败，看一眼 DSH 日志里有没有 [dsh-dream] 告警。")),
        ]),
      ]);
      return h(EmptyState, { key: "empty", query: query, onClear: query === "" ? null : clearSearch });
    }
    return h("div", { key: "content" }, [
      vm.showTiles
        ? h("div", { className: "dshd-tiles", key: "tiles" }, [
            h(StatTile, { key: "total", label: t("梦境总数"), value: String(vm.total) + t(" 场"), hint: vm.total > vm.count ? t("本页显示最近 ") + String(vm.count) + t(" 场") : t("全部梦境日记") }),
            h(StatTile, { key: "span", label: t("时间跨度"), value: vm.spanText, hint: vm.spanHint, title: vm.spanFull }),
            h(StatTile, { key: "latest", label: t("最近一场"), value: vm.latestText, hint: vm.latestDate }),
            h(StatTile, { key: "mood", label: t("心境"), value: String(vm.moodCount) + t(" 种"), hint: vm.moodCount === 0 ? "" : t("最常见：") + vm.moodRows[0].mood }),
          ])
        : h("div", { className: "dshd-headline", key: "headline" }, vm.headline),
      h("div", { className: "dshd-two", key: "two" }, [
        h(MoodCard, { key: "mood", vm: vm }),
        h(LessonCard, { key: "lessons", vm: vm }),
      ]),
      h("div", { className: "dshd-listhead", key: "listhead" }, [
        h("h4", { key: "t" }, query === "" && filterCount === 0 ? t("梦境时间线") : (query === "" ? t("筛选结果") : t("搜索结果"))),
        h("span", { className: "dshd-hint", key: "n" }, listHintOf(query, vm.count, filterCount, visibleDreams.length)),
      ]),
      visibleDreams.length === 0 && filterCount > 0
        ? h("div", { className: "dshd-filterempty", key: "filtered" }, [
            h("span", { key: "t" }, t("没有符合筛选的梦（筛选作用于已加载的 ") + String(vm.count) + t(" 场）。")),
            h("span", { className: "dshd-spacer", key: "s" }),
            h(Btn, { key: "clearbtn", onClick: clearFilters }, t("清空筛选")),
          ])
        : h("div", { className: "dshd-timeline", key: "timeline" }, visibleDreams.map(function (dream, index) {
            return h(DreamCard, { key: (dream.id !== "" ? dream.id : "dream") + "#" + String(index), dream: dream, now: now, privacy: privacy, index: index });
          })),
    ]);
  };

  return h("div", { className: "dshd-root" + (privacy === true ? " dshd-privacy" : ""), key: "root" }, [
    h("div", { className: "dshd-shell", key: "shell" }, [
      errorBox,
      h("nav", { className: "dshd-tabs", key: "tabs", "aria-label": t("梦境面板视图") }, [["journal", t("日记")], ["knowledge", t("经验")], ["bridge", t("写入记录")]].map(function (item) {
        return h("button", { key: item[0], type: "button", className: "dshd-chipbtn" + (activeTab === item[0] ? " on" : ""), "aria-pressed": activeTab === item[0], onClick: function () { setFilterOpen(false); setActiveTab(item[0]); } }, item[1]);
      })),
      toolbar,
      privacy === true ? h("div", { className: "dshd-note", key: "privacynote", role: "status" }, t("隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。")) : null,
      body(),
      activeTab !== "journal" ? null : h("div", { className: "dshd-footer", key: "footer" }, [
        h("span", { key: "l" }, footerTextOf(query, limit, vm.total, vm.count)),
        h("span", { className: "dshd-spacer", key: "sp" }),
        canLoadMore === true ? h(Btn, { key: "more", onClick: showMore, disabled: loading === true }, loading === true ? t("加载中…") : t("显示更早的梦")) : null,
        h("span", { key: "r" }, t("数据来自梦境日记（dreams.jsonl）")),
      ]),
    ]),
  ]);
}

function DreamSection({ locale } = {}) {
  useLanguage(locale);
  return h("div", null, [
    h("h2", { key: "t" }, t("梦境日记")),
    h("p", { className: "dshd-sub", key: "p" }, t("会话回放 → 反思 → 记忆巩固。这里按时间倒序陈列 agent 做过的梦，附心境方块与教训榜。")),
    h(DreamPanel, { key: "panel" }),
  ]);
}

/* @ui-css-start */
const CSS = [
  ".dshd-root{color:var(--dsw-alias-label-primary,#111);font-size:13px;line-height:1.6}",
  ".dshd-shell{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:14px;padding:14px 16px;container-type:inline-size}",
  ".dshd-sub{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px;margin:4px 0 12px}",
  ".dshd-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}",
  ".dshd-search{position:relative;display:flex;align-items:center;flex:1;min-width:180px}",
  ".dshd-search svg{position:absolute;left:9px;color:var(--dsw-alias-label-tertiary,#6b7280);pointer-events:none}",
  ".dshd-input{width:100%;box-sizing:border-box;background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03)));border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:9px;padding:6px 28px 6px 30px;font:inherit;color:inherit}",
  ".dshd-input:focus{outline:2px solid var(--dsw-alias-state-business-primary,#2563eb);outline-offset:-1px}",
  ".dshd-clear{position:absolute;right:5px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary,#6b7280);font-size:16px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px}",
  ".dshd-clear:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 8%,transparent);color:var(--dsw-alias-label-primary,#111)}",
  ".dshd-spacer{flex:1}",
  ".dshd-btn{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#111);border-radius:9px;padding:5px 11px;font-size:12px;cursor:pointer;transition:background .12s,border-color .12s}",
  ".dshd-btn:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 6%,transparent)}",
  ".dshd-btn:disabled{opacity:.5;cursor:not-allowed}",
  ".dshd-btn.primary{background:var(--dsw-alias-button-primary-fill,#2563eb);border-color:transparent;color:#fff}",
  ".dshd-btn.primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#1d4ed8)}",
  ".dshd-btn.on{border-color:var(--dsw-alias-state-warn-primary,#f59e0b);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 18%,transparent)}",
  ".dshd-filter{position:relative}",
  ".dshd-filterpop{position:absolute;right:0;top:calc(100% + 6px);z-index:6;width:min(280px,86vw);background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:12px;padding:10px 11px;box-shadow:var(--dsw-elevation-prominent,0 10px 28px rgba(0,0,0,.18))}",
  ".dshd-filtertitle{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-bottom:7px}",
  ".dshd-chipbtn{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:transparent;color:var(--dsw-alias-label-primary,#111);border-radius:999px;padding:2px 9px;font-size:12px;cursor:pointer;margin:0 6px 6px 0}",
  ".dshd-chipbtn.on{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#2563eb) 14%,transparent);border-color:var(--dsw-alias-state-business-primary,#2563eb)}",
  ".dshd-filterfoot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}",
  ".dshd-filterempty{display:flex;align-items:center;gap:8px;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:10px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));color:var(--dsw-alias-label-tertiary,#6b7280)}",
  ".dshd-hint{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px}",
  ".dshd-note{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-top:8px}",
  ".dshd-headline{font-size:13px;font-weight:600;margin:0 0 10px}",
  ".dshd-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:12px}",
  ".dshd-tile{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border-radius:11px;padding:9px 11px;min-width:0}",
  ".dshd-tile-label{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280)}",
  ".dshd-tile-value{font-size:17px;font-weight:600;margin-top:1px;overflow-wrap:anywhere;line-height:1.35}",
  ".dshd-tile-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshd-two{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:10px;margin-bottom:16px}",
  ".dshd-card{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border-radius:12px;padding:11px 12px;min-width:0}",
  ".dshd-card h4{margin:0 0 8px;font-size:13px;font-weight:600}",
  ".dshd-mblocks{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px}",
  ".dshd-mblock{display:inline-block;width:12px;height:12px;border-radius:3px;flex:0 0 auto;background:var(--dsw-alias-state-business-primary,#2563eb)}",
  ".dshd-tone-1{background:var(--dsw-alias-state-success-primary,#16a34a)}",
  ".dshd-tone-2{background:var(--dsw-alias-state-warn-primary,#f59e0b)}",
  ".dshd-tone-3{background:var(--dsw-alias-state-error-primary,#dc2626)}",
  ".dshd-legend{display:flex;flex-direction:column;gap:4px}",
  ".dshd-legend-row{display:flex;align-items:center;gap:7px;font-size:12px}",
  ".dshd-legend-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshd-legend-count{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;font-variant-numeric:tabular-nums}",
  ".dshd-lesson{display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.08));flex-wrap:wrap}",
  ".dshd-lesson:last-child{border-bottom:0;padding-bottom:0}",
  ".dshd-rank{flex:0 0 auto;width:18px;height:18px;border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}",
  ".dshd-lesson-body{flex:1;min-width:140px;display:flex;flex-direction:column;gap:4px}",
  ".dshd-lesson-meta{flex:0 0 auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap}",
  ".dshd-last{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);white-space:nowrap}",
  ".dshd-lesson-text{font-size:12px;word-break:break-word}",
  ".dshd-track{display:block;height:6px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 8%,transparent);overflow:hidden}",
  ".dshd-fill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-business-primary,#2563eb);min-width:6px}",
  ".dshd-times{flex:0 0 auto;font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);font-variant-numeric:tabular-nums}",
  ".dshd-times b{color:var(--dsw-alias-label-primary,#111)}",
  ".dshd-badge{flex:0 0 auto;font-size:11px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 18%,transparent);color:var(--dsw-alias-label-primary,#111);white-space:nowrap}",
  ".dshd-listhead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:2px 0 8px}",
  ".dshd-listhead h4{margin:0;font-size:13px;font-weight:600}",
  ".dshd-timeline{display:flex;flex-direction:column;gap:8px}",
  ".dshd-dream{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border-radius:12px;padding:10px 12px;border-left:3px solid var(--dsw-alias-state-business-primary,#2563eb);min-width:0}",
  ".dshd-dream.dshd-mood-1{border-left-color:var(--dsw-alias-state-success-primary,#16a34a)}",
  ".dshd-dream.dshd-mood-2{border-left-color:var(--dsw-alias-state-warn-primary,#f59e0b)}",
  ".dshd-dream.dshd-mood-3{border-left-color:var(--dsw-alias-state-error-primary,#dc2626)}",
  ".dshd-dream-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}",
  ".dshd-time{font-size:12px;color:var(--dsw-alias-label-tertiary,#6b7280);font-variant-numeric:tabular-nums}",
  ".dshd-ago{font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280)}",
  ".dshd-mood{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:1px 8px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 6%,transparent);color:var(--dsw-alias-label-primary,#111);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshd-mooddot{width:6px;height:6px;border-radius:999px;flex:0 0 auto;background:var(--dsw-alias-state-business-primary,#2563eb)}",
  ".dshd-linkbtn{border:0;background:transparent;color:var(--dsw-alias-state-business-primary,#2563eb);font-size:12px;cursor:pointer;padding:1px 4px;border-radius:6px}",
  ".dshd-linkbtn:hover{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#2563eb) 10%,transparent)}",
  ".dshd-reflection{white-space:pre-wrap;word-break:break-word}",
  ".dshd-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden;max-height:6.4em}",
  ".dshd-lessons{margin:8px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}",
  ".dshd-lessons li{display:flex;gap:7px;align-items:flex-start;font-size:12px}",
  ".dshd-num{flex:0 0 auto;min-width:17px;height:17px;border-radius:5px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#2563eb) 14%,transparent);color:var(--dsw-alias-state-business-primary,#2563eb);font-size:11px;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}",
  ".dshd-lesson-li{flex:1;min-width:0;word-break:break-word}",
  ".dshd-privacy .dshd-reflection,.dshd-privacy .dshd-lessons{filter:blur(4px)}",
  ".dshd-privacy .dshd-dream.dshd-peek .dshd-reflection,.dshd-privacy .dshd-dream.dshd-peek .dshd-lessons{filter:none}",
  ".dshd-alert{display:flex;gap:8px;align-items:center;border-radius:10px;padding:8px 10px;font-size:12px;margin-bottom:10px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 5%,transparent)}",
  ".dshd-alert.error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 12%,transparent);color:var(--dsw-alias-state-error-primary,#dc2626)}",
  ".dshd-empty{padding:28px 18px;text-align:center;color:var(--dsw-alias-label-tertiary,#6b7280)}",
  ".dshd-empty svg{color:var(--dsw-alias-label-tertiary,#6b7280);opacity:.75}",
  ".dshd-empty h3{color:var(--dsw-alias-label-primary,#111);margin:8px 0 6px;font-size:15px}",
  ".dshd-empty p{margin:0 auto 10px;max-width:430px;font-size:12px}",
  ".dshd-chips{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}",
  ".dshd-chip{font-family:ui-monospace,Consolas,monospace;font-size:11px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));border-radius:999px;padding:2px 9px;color:var(--dsw-alias-label-tertiary,#6b7280)}",
  ".dshd-skel{height:58px;border-radius:12px;margin-bottom:8px;background:linear-gradient(90deg,var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04)) 25%,color-mix(in srgb,var(--dsw-alias-label-primary,#111) 10%,transparent) 37%,var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04)) 63%);background-size:400% 100%;animation:dshd-shimmer 1.4s ease infinite}",
  "@keyframes dshd-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}",
  ".dshd-footer{margin-top:12px;display:flex;align-items:center;gap:8px;justify-content:space-between;color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;flex-wrap:wrap}",
  ".dshd-kcard{margin:2px 0 14px}",
  ".dshd-khead{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}",
  ".dshd-khead h4{margin:0;font-size:13px;font-weight:600}",
  ".dshd-krows{display:flex;flex-direction:column;gap:7px}",
  ".dshd-knowledge{border-left:3px solid var(--dsw-alias-label-tertiary,#6b7280);background:var(--dsw-alias-bg-layer-1,#fff);border-radius:9px;padding:8px 10px;min-width:0}",
  ".dshd-knowledge.dshd-kstate-candidate{border-left-color:var(--dsw-alias-state-warn-primary,#f59e0b)}",
  ".dshd-knowledge.dshd-kstate-disputed{border-left-color:var(--dsw-alias-state-error-primary,#dc2626);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 6%,var(--dsw-alias-bg-layer-1,#fff))}",
  ".dshd-knowledge.dshd-kstate-usable{border-left-color:var(--dsw-alias-state-success-primary,#16a34a)}",
  ".dshd-knowledge.dshd-kstate-stale,.dshd-knowledge.dshd-kstate-rejected,.dshd-knowledge.dshd-kstate-unknown{border-left-color:var(--dsw-alias-label-tertiary,#6b7280);opacity:.86}",
  ".dshd-kbadge{flex:0 0 auto;font-size:11px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#111) 8%,transparent);white-space:nowrap}",
  ".dshd-kstate-candidate .dshd-kbadge{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 22%,transparent)}",
  ".dshd-kstate-disputed .dshd-kbadge{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 20%,transparent);color:var(--dsw-alias-state-error-primary,#dc2626)}",
  ".dshd-kstate-usable .dshd-kbadge{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#16a34a) 18%,transparent)}",
  ".dshd-ktitle{font-size:12px;font-weight:600;word-break:break-word}",
  ".dshd-kmeta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-top:2px}",
  ".dshd-kbody{margin-top:5px;display:flex;flex-direction:column;gap:3px;font-size:12px;word-break:break-word}",
  ".dshd-kempty{padding:14px 10px;text-align:center;color:var(--dsw-alias-label-tertiary,#6b7280)}",
  ".dshd-kempty-title{color:var(--dsw-alias-label-primary,#111);font-weight:600;font-size:13px;margin-bottom:4px}",
  ".dshd-kempty-body{margin:0 auto 5px;max-width:460px;font-size:12px}",
  ".dshd-knotice{font-size:11px;color:var(--dsw-alias-label-primary,#111);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 14%,transparent);border-radius:8px;padding:5px 8px;margin-bottom:7px}",
  ".dshd-privacy .dshd-kbody{filter:blur(4px)}",
  ".dshd-privacy .dshd-knowledge.dshd-peek .dshd-kbody{filter:none}",
  ".dshd-kcmd{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}",
  ".dshd-tabs{display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap}",
  ".dshd-action{font-weight:500;white-space:pre-wrap}",
  ".dshd-kbody details summary,.dshd-bridge-row details summary{cursor:pointer;color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px}",
  ".dshd-reviewform{margin-top:8px;padding:9px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:8px}",
  ".dshd-reviewform label{display:flex;flex-direction:column;gap:3px;margin-bottom:6px;font-size:12px}",
  ".dshd-reviewform .dshd-btn,.dshd-feedback .dshd-btn{margin:4px 5px 0 0}",
  ".dshd-diff{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;padding:10px;border-radius:6px;font:11px/1.65 ui-monospace,Consolas,monospace;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));color:inherit}",
  ".dshd-feedback{margin-top:8px;font-size:12px}.dshd-feedback summary{cursor:pointer}.dshd-feedback label{display:flex;flex-direction:column;gap:4px;margin-top:8px}.dshd-feedback textarea{font:inherit;color:inherit;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;padding:6px;max-width:100%;box-sizing:border-box}",
  ".dshd-sources{padding:6px 0}.dshd-sources details{margin-top:6px}.dshd-reviewform{min-width:0}",
  ".dshd-privacy .dshd-feedback,.dshd-privacy .dshd-diff{filter:blur(4px)}.dshd-privacy .dshd-knowledge.dshd-peek .dshd-feedback,.dshd-privacy .dshd-knowledge.dshd-peek .dshd-diff{filter:none}",
  ".dshd-reviewform select,.dshd-reviewform textarea,.dshd-kcard select{background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;max-width:100%;padding:4px;font:inherit;box-sizing:border-box}",
  ".dshd-copywrap{display:inline-flex;flex-direction:column;gap:3px;max-width:100%;align-items:flex-start}",
  ".dshd-cmd{display:block;font-family:ui-monospace,Consolas,monospace;font-size:11px;white-space:pre-wrap;word-break:break-all;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));border-radius:6px;padding:4px 7px;user-select:text;cursor:text;color:inherit;max-width:100%}",
  ".dshd-holdreason{font-size:11px;color:var(--dsw-alias-state-warn-primary,#f59e0b);margin-top:4px}",
  ".dshd-bridge{background:var(--dsw-alias-bg-layer-1,#fff);border-radius:9px;padding:8px 10px;border-left:3px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));min-width:0}",
  ".dshd-bridge-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}",
  ".dshd-bridge-target{font-size:12px;font-weight:600;word-break:break-all;min-width:0}",
  ".dshd-bridge-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);margin-top:3px}",
  ".dshd-rollback-ok{color:var(--dsw-alias-state-success-primary,#16a34a)}",
  ".dshd-rollback-no{color:var(--dsw-alias-label-tertiary,#6b7280)}",
  "@container (max-width:620px){.dshd-two{grid-template-columns:1fr}.dshd-toolbar .dshd-hint{display:none}}",
  "@media(max-width:640px){[role=dialog]:has(.dshd-root){display:flex;flex-direction:column}[role=dialog]:has(.dshd-root)>nav{display:flex;flex-direction:row;align-items:center;flex-shrink:0;gap:6px;width:auto;max-width:100%;height:auto;padding:10px;overflow-x:auto;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12))}[role=dialog]:has(.dshd-root)>nav>*{flex-shrink:0}[role=dialog]:has(.dshd-root)>nav>div:has(>button){display:flex;flex-direction:row;gap:6px}[role=dialog]:has(.dshd-root)>nav button{width:auto;flex-shrink:0}[role=dialog]:has(.dshd-root)>div{min-width:0;min-height:0;flex:1}.dshd-reviewform,.dshd-feedback{max-width:100%}}"
].join("");
/* @ui-css-end */

// ───────────────────────── 挂载 ─────────────────────────

const inject = ["slots", "locale"];

function apply(ctx) {
  try { localeService = ctx.get?.("locale") || ctx.locale; } catch { localeService = ctx.locale; }
  try {
    ctx.effect(function () {
      const id = "dsh-dream/client";
      if (document.querySelector("style[data-plugin-css='" + id + "']") !== null) return function () {};
      const style = document.createElement("style");
      style.dataset.plugin = "dsh-dream";
      style.dataset.pluginCss = id;
      style.textContent = CSS;
      document.head.appendChild(style);
      return function () { style.remove(); };
    }, "dsh-dream: styles");
  } catch (error) { /* 无 DOM 环境（纯 node 侧冒烟）时跳过 */ }

  try {
    ctx.slots.inject("settings.section", function () {
      return ctx.slots.register({
        name: "settings.section",
        id: "dsh-dream",
        order: 55,
        label: function () { return t("梦境日记"); },
        inject: function () { return { locale: localeService }; },
      }, DreamSection);
    });
  } catch (error) { /* 没有 slots 服务：仍是合法插件，只是没有设置页 */ }
}

exports.apply = apply;
exports.inject = inject;
// 纯函数内部件：验证脚本可直接取来测，不必另抄一份算法。
exports.__internals = {
  displayError: displayError,
  routeUrl: routeUrl,
  routeUrlFor: routeUrlFor,
  KNOWLEDGE_ROUTE: KNOWLEDGE_ROUTE,
  KNOWLEDGE_LIMIT: KNOWLEDGE_LIMIT,
  fetchKnowledge: fetchKnowledge,
  fetchBridgeRecords: fetchBridgeRecords,
  postAction: postAction,
  copyText: copyText,
  normalizeBridgeRecords: normalizeBridgeRecords,
  skippedReasonLabel: skippedReasonLabel,
  holdReasonOf: holdReasonOf,
  bridgeableOf: bridgeableOf,
  reviewActionFor: reviewActionFor,
  reviewCommandOf: reviewCommandOf,
  bridgePreviewCommandOf: bridgePreviewCommandOf,
  bridgeRollbackCommandOf: bridgeRollbackCommandOf,
  shortHash: shortHash,
  bridgeActionLabel: bridgeActionLabel,
  bridgeEmptyState: bridgeEmptyState,
  reviewQueueEmptyState: reviewQueueEmptyState,
  BRIDGE_ROUTE: BRIDGE_ROUTE,
  BRIDGE_LIMIT: BRIDGE_LIMIT,
  normalizeKnowledge: normalizeKnowledge,
  normalizeLessonState: normalizeLessonState,
  applicabilityTextOf: applicabilityTextOf,
  knowledgeNoticeText: knowledgeNoticeText,
  lessonStateLabel: lessonStateLabel,
  lessonStateClass: lessonStateClass,
  knowledgeCountText: knowledgeCountText,
  knowledgeEmptyState: knowledgeEmptyState,
  fetchJournal: fetchJournal,
  normalizeDreams: normalizeDreams,
  normalizeStats: normalizeStats,
  spanOf: spanOf,
  formatDate: formatDate,
  formatTime: formatTime,
  relativeTime: relativeTime,
  inlineNodes: inlineNodes,
  moodSlot: moodSlot,
  toneClass: toneClass,
  isCollapsible: isCollapsible,
  cleanupFilters: cleanupFilters,
  filterCountOf: filterCountOf,
  applyFilters: applyFilters,
  shouldShowFilters: shouldShowFilters,
  needsOlderDreams: needsOlderDreams,
  countTextOf: countTextOf,
  listHintOf: listHintOf,
  footerTextOf: footerTextOf,
  MORE_LIMIT: MORE_LIMIT,
  recentText: recentText,
  dreamAgo: dreamAgo,
  loadPrivacy: loadPrivacy,
  savePrivacy: savePrivacy,
  spanTextOf: spanTextOf,
  localLastAtFor: localLastAtFor,
  viewModelOf: viewModelOf,
  DEFAULT_LIMIT: DEFAULT_LIMIT,
};

return module.exports;
}});
