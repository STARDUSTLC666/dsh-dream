// NOTE（维护者请看这里）：这个文件就是插件网页端的**源码**，不经过 tsc ——
// 仓库里没有 src/client.ts，pnpm run build 也不会重写它。改面板请直接改这里，
// 改完用 node --check lib/client.js 自检（CI 里也会跑这一步）。
//
// 面板做四件事：把梦境日记（dreams.jsonl）画成人能看懂的样子 —— 概览、心境方块、
// 教训榜、按时间倒序的梦卡片；只读展示技术经验（<journalDir>/knowledge/）；
// 只读展示「待核实」（candidate/disputed/stale + 被扣下的原因）与「写入记录」
//（<journalDir>/bridge/ 的桥接应用记录）。
// 数据来自插件自己的同源只读路由 GET /_dsh/dsh-dream/journal、/_dsh/dsh-dream/knowledge
// 与 /_dsh/dsh-dream/bridge（由 src/index.ts 挂载）；前端不缓存业务数据，刷新即见。
// 经验区块只展示状态 / 条件 / 范围 / 适用与例外 / 证据摘要 / 最近核验；日志截断或坏行会明确提示，
// 不展示权重、向量或原始 JSON。经验行只提供「复制审阅 / 预览命令」，写操作仍在对话工具里执行。
// 隐私纪律：面板只读，不写文件、不上传；「隐私模式」只做显示层模糊，DOM 仍是明文。
window.__ModuleLoader__.load({ id: "@stardustlc/dsh-dream", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";

const React = require("react");
const { useState, useEffect } = React;
const h = React.createElement;

// 相对路径按 document.baseURI 解析：反代挂在 /tools/dsh/ 这类前缀下也不会打偏。
const ROUTE = "_dsh/dsh-dream/journal";
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
  return "请求失败（HTTP " + String(status) + "）";
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
  if (body === null || typeof body !== "object") throw new Error("服务器返回的不是 JSON（HTTP " + String(res.status) + "）");
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
  if (body === null || typeof body !== "object") throw new Error("服务器返回的不是 JSON（HTTP " + String(res.status) + "）");
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
  if (body === null || typeof body !== "object") throw new Error("服务器返回的不是 JSON（HTTP " + String(res.status) + "）");
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
    case "candidate": return "候选（未采纳）";
    case "usable": return "可用";
    case "disputed": return "有冲突";
    case "stale": return "待复核";
    case "rejected": return "已驳回";
    default: return "未知状态";
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
    if (platform !== "") bits.push("平台 " + platform);
    if (bits.length > 0) parts.push(bits.join(" · "));
  }
  if (parts.length === 0) return "";
  if (parts.length > 4) return parts.slice(0, 4).join("；") + "；等 " + String(parts.length) + " 条适用范围";
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
      scopeLabel: trimmedText(raw.scopeLabel) || "范围未标注",
      evidenceSummary: trimmedText(raw.evidenceSummary) || "暂无可展示的证据摘要",
      lastValidatedAt: lastValidatedAt,
      lastText: lastValidatedAt === "" ? "尚未核验" : relativeTime(lastValidatedAt, now),
      lastTitle: lastValidatedAt === "" ? "没有 lastValidatedAt（从未核验）" : formatDate(lastValidatedAt) + (formatTime(lastValidatedAt) === "" ? "" : " " + formatTime(lastValidatedAt)),
      revision: typeof raw.revision === "number" && Number.isFinite(raw.revision) && raw.revision >= 0 ? Math.floor(raw.revision) : 0,
      independentSupportCount: typeof raw.independentSupportCount === "number" && raw.independentSupportCount > 0 ? Math.floor(raw.independentSupportCount) : 0,
      projectId: typeof raw.scope === "object" && raw.scope !== null ? trimmedText(raw.scope.projectId) : "",
      workspaceRoot: typeof raw.scope === "object" && raw.scope !== null ? trimmedText(raw.scope.workspaceRoot) : "",
      conflictIds: Array.isArray(raw.conflictIds) ? raw.conflictIds.filter(function (id) { return typeof id === "string" && id.trim() !== ""; }) : [],
      conflicts: Array.isArray(raw.conflictIds) ? raw.conflictIds.filter(function (id) { return typeof id === "string" && id.trim() !== ""; }).map(function (id) { return { id: id, title: lessonTitles.get(id) || "未加载的经验（" + id + "）" }; }) : [],
      holdReason: trimmedText(raw.holdReason) !== "" ? trimmedText(raw.holdReason) : holdReasonOf(raw),
      holdReasonLabel: trimmedText(raw.holdReasonLabel) !== "" ? trimmedText(raw.holdReasonLabel) : skippedReasonLabel(holdReasonOf(raw)),
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
    return total > 0 ? "共 " + String(total) + " 条" : "还没有经验";
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
  if (truncated === true) parts.push("日志过大，仅回放最近一段事件");
  if (badLines > 0) parts.push("有 " + String(badLines) + " 行损坏已跳过");
  return parts.join("；") + "；events.jsonl 未改动。";
}

/** 经验区块的独立空态：与「还没有梦境日记」分开，说明经验从哪来。 */
function knowledgeEmptyState() {
  return {
    title: "还没有经验记录",
    body: "经验是带证据、有适用条件的技术结论：收尾时用 dream_learn 提交候选，证据足够、范围明确的会出现在这里。",
    hint: "旧日记里的教训不会自动升级为经验；采纳、驳回或标记冲突请用 dream_review。",
  };
}

/** 检索层 skipped reason 的中文映射（面板扣留原因文案；与 retrieval.ts 的 reason 常量同名）。 */
function skippedReasonLabel(reason) {
  switch (trimmedText(reason)) {
    case "state:rejected": return "已驳回：不参与默认检索与注入";
    case "state:stale": return "待复核：条件或依赖可能已过期，默认不注入";
    case "state:disputed": return "冲突未解决：默认不注入，先 resolve-conflict";
    case "candidate-hold": return "候选：可被检索到，但默认不作为任务建议注入";
    case "no-evidence": return "证据不足：没有独立证据，默认不注入";
    case "version-mismatch": return "版本不匹配：当前依赖版本不满足适用范围";
    case "limit": return "超出条数预算，本次未取回";
    case "budget-stop": return "超出字符预算：按排名整条装入，遇到第一条放不下即停";
    case "budget": return "超出字符预算，本次未取回";
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
    case "create": return "新建";
    case "replace": return "替换管理块";
    case "append": return "追加管理块";
    case "unchanged": return "未改动";
    case "rollback": return "回滚";
    default: return trimmedText(action) || "未知动作";
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
      atText: at === "" ? "时间未知" : relativeTime(at, now),
      atTitle: at === "" ? "没有记录时间" : formatDate(at) + (formatTime(at) === "" ? "" : " " + formatTime(at)),
      target: target || "目标未记录",
      action: trimmedText(raw.action),
      actionLabel: bridgeActionLabel(raw.action),
      lessons: lessonRefs,
      lessonsText: lessonRefs.length === 0 ? "没有经验引用" : lessonRefs.join("、"),
      beforeShort: shortHash(raw.beforeSha256),
      afterShort: shortHash(raw.afterSha256),
      rollbackable: rollbackable,
      rollbackText: rollbackable ? "可回滚" : ("不可回滚" + (rollbackReason !== "" ? "：" + rollbackReason : "")),
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
    title: "还没有写入记录",
    body: "写入记录来自 dream_bridge 的 preview → apply；面板只读展示目标、时间、经验 revision 与前后哈希，不会写文件。",
    hint: "在可桥接经验行点「复制预览命令」，回到对话里执行；写操作只在工具中完成。",
  };
}

/** 「待核实」的独立空态。 */
function reviewQueueEmptyState() {
  return "没有待核实的经验 —— 候选、有冲突、待复核的经验会出现在这里，并写明被扣下的原因。";
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
  if (!Number.isFinite(date.getTime())) return iso === "" ? "时间未知" : iso;
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
  if (diff < minute) return "刚刚";
  if (diff < hour) return Math.floor(diff / minute) + " 分钟前";
  if (diff < day) return Math.floor(diff / hour) + " 小时前";
  if (diff < day * 30) return Math.floor(diff / day) + " 天前";
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
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return String(days) + " 天前";
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
  if (filterCount > 0) return "筛选后 " + String(visibleCount) + " / " + String(count) + " 场";
  if (query !== "") return "「" + query + "」命中 " + String(count) + " 场";
  return "共 " + String(total) + " 场梦";
}

function listHintOf(query, count, filterCount, visibleCount) {
  if (filterCount > 0) return "筛选当前已加载的 " + String(count) + " 场 · 命中 " + String(visibleCount) + " 场";
  if (query !== "") return "「" + query + "」命中 " + String(count) + " 场";
  return "新梦在前";
}

function footerTextOf(query, limit, total, count) {
  if (limit > DEFAULT_LIMIT) {
    const capped = limit >= MORE_LIMIT && count < total ? "（已达路由上限）" : "";
    return "最近 " + String(limit) + " 场 / 共 " + String(total) + " 场" + capped;
  }
  return query === "" ? "新梦在前 · 最多显示 " + String(DEFAULT_LIMIT) + " 场" : "搜索结果 · 最多显示 " + String(DEFAULT_LIMIT) + " 场";
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
      lastText: knownAt === "" ? "" : (fromStats ? "最近 " : "本页内最近 ") + recentText(knownAt, now),
      lastTitle: knownAt === "" ? "" : formatDate(knownAt) + (formatTime(knownAt) === "" ? "" : " " + formatTime(knownAt))
        + (fromStats ? "" : "（统计未给 lastAt，按本页已加载的 " + String(list.length) + " 场现算）"),
    };
  });
  const span = spanOf(list);
  const spanText = span === null ? "" : spanTextOf(span);
  const spanFull = span === null ? "" : formatDate(new Date(span.from).toISOString()) + " → " + formatDate(new Date(span.to).toISOString());
  const spanHint = span === null ? "" : (span.days === 0 ? "同一天" : "约 " + String(span.days) + " 天");
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
    return "第 1 场梦 · " + formatDate(dream.at) + " · 心境「" + dream.mood + "」";
  }
  const parts = [];
  parts.push(total > dreams.length ? "共 " + String(total) + " 场梦 · 本页最近 " + String(dreams.length) + " 场" : String(dreams.length) + " 场梦");
  if (span !== null) parts.push(span.from === span.to ? formatDate(new Date(span.from).toISOString()) : formatDate(new Date(span.from).toISOString()) + " → " + formatDate(new Date(span.to).toISOString()));
  parts.push("最近：" + relativeTime(dreams[0].at, now));
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
    h("h4", { key: "t" }, "心境"),
    h("div", { className: "dshd-mblocks", key: "blocks" }, vm.blocks.map((block) => h("span", {
      key: block.key,
      className: "dshd-mblock " + block.tone,
      title: block.title,
    }))),
    vm.count === 1
      ? h("div", { className: "dshd-hint", key: "one" }, "1 场梦，先不谈分布 —— 再做梦会累积。")
      : h("div", { key: "legend" }, [
          h("div", { className: "dshd-note", key: "cap" }, "左 → 右：从早到晚"),
          h("div", { className: "dshd-legend", key: "rows" }, vm.moodRows.map((row, index) => h("div", { className: "dshd-legend-row", key: "mood-" + String(index) + "-" + row.mood }, [
            h("span", { className: "dshd-mblock " + toneClass(moodSlot(row.mood)), key: "d" }),
            h("span", { className: "dshd-legend-name", key: "n", title: row.mood }, row.mood),
            h("span", { className: "dshd-legend-count", key: "c" }, String(row.count) + " 场"),
          ]))),
        ]),
  ]);
}

function LessonCard(props) {
  const vm = props.vm;
  return h("section", { className: "dshd-card" }, [
    h("h4", { key: "t" }, "教训榜"),
    vm.lessonRows.length === 0
      ? h("div", { className: "dshd-hint", key: "e" }, "还没有教训 —— 记梦时带上 lessons，出现次数会在这里累积。")
      : h("div", { key: "rows" }, vm.lessonRows.map((row, index) => h("div", { className: "dshd-lesson", key: "lesson-" + String(index) + "-" + row.lesson }, [
          h("span", { className: "dshd-rank", key: "r" }, String(row.rank)),
          h("span", { className: "dshd-lesson-body", key: "b" }, [
            h("span", { className: "dshd-lesson-text", key: "t" }, row.lesson),
            row.showBar ? h("span", { className: "dshd-track", key: "bar" }, h("span", { className: "dshd-fill", key: "fill", style: { width: String(row.share) + "%" } })) : null,
          ]),
          h("span", { className: "dshd-lesson-meta", key: "m" }, [
            h("span", { className: "dshd-times", key: "c" }, "×", h("b", { key: "n" }, String(row.count))),
            row.lastText === "" ? null : h("span", { className: "dshd-last", key: "l", title: row.lastTitle }, row.lastText),
            row.candidate ? h("span", { className: "dshd-badge", key: "badge" }, "常见教训") : null,
          ]),
        ]))),
    h("div", { className: "dshd-note", key: "note" }, "次数仅表示日记里的出现频率；出现 ≥3 次标为「常见教训」。写入项目规则前仍需核验来源并审阅经验。最近时间取自 stats.lastAt；统计缺失时按本页已加载的梦现算。"),
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
  const label = props.label === undefined ? "复制命令" : props.label;
  return h("span", { className: "dshd-copywrap" }, [
    h(Btn, { key: "b", onClick: onCopy, disabled: props.disabled === true, title: props.title === undefined ? command : props.title }, copied === true ? "已复制" : label),
    failed === true ? h("code", { key: "cmd", className: "dshd-cmd", tabIndex: 0 }, command) : null,
    failed === true ? h("span", { key: "hint", className: "dshd-note" }, "剪贴板不可用：请手动选中上面的命令复制。") : null,
  ]);
}

/** 面板保持只读：先让人看清决策，再生成可直接粘贴进对话的完整命令。 */
function ReviewControls(props) {
  const row = props.row;
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(function () { return reviewActionFor(row.state); });
  const [resolution, setResolution] = useState("prefer");
  const [note, setNote] = useState("");
  const [affected, setAffected] = useState(function () { return row.conflictIds[0] || ""; });
  const commands = row.state === "rejected" ? [["reopen", "重新送审"]]
    : row.state === "disputed" ? [["resolve-conflict", "处理冲突"], ["reject", "驳回这条"]]
    : [["accept", "采纳"], ["reject", "驳回"], ["mark-stale", "标记待复核"]];
  const command = reviewCommandOf(row, { action: action, resolution: resolution, note: note, affectedIds: affected === "" ? [] : [affected] });
  return h("div", { className: "dshd-review", onClick: function (event) { event.stopPropagation(); } }, [
    h("div", { className: "dshd-kcmd", key: "buttons" }, [
      h(Btn, { key: "review", onClick: function () { setOpen(!open); }, "aria-expanded": open }, open ? "收起审阅" : "审阅"),
      row.bridgeable === true ? h(CopyCommand, { key: "preview", command: bridgePreviewCommandOf(row.id, row.projectId, row.workspaceRoot), label: "复制预览命令", title: "粘贴到对应项目对话，先查看写入差异" }) : null,
    ]),
    open ? h("div", { className: "dshd-reviewform", key: "form", onKeyDown: function (event) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    } }, [
      h("label", { key: "action" }, ["审阅动作", h("select", { "aria-label": "审阅动作", value: action, onChange: function (event) { setAction(event.target.value); } }, commands.map(function (item) { return h("option", { value: item[0], key: item[0] }, item[1]); }))]),
      action === "resolve-conflict" ? h("div", { key: "conflict" }, [
        h("label", { key: "against" }, ["冲突经验", h("select", { "aria-label": "冲突经验", value: affected, onChange: function (event) { setAffected(event.target.value); } }, row.conflicts.map(function (item) { return h("option", { key: item.id, value: item.id, title: item.title }, item.title); }))]),
        h("label", { key: "resolution" }, ["处理方式", h("select", { "aria-label": "处理方式", value: resolution, onChange: function (event) { setResolution(event.target.value); } }, [
          h("option", { key: "prefer", value: "prefer" }, "采用这条，驳回对方"),
          h("option", { key: "drop", value: "drop" }, "放弃这条，保留对方"),
          h("option", { key: "merge", value: "merge" }, "合并到这条，对方留作历史"),
        ])]),
        h("label", { key: "note" }, ["处理依据", h("textarea", { "aria-label": "处理依据", rows: 2, value: note, placeholder: "说明哪个来源支持这次决定…", onChange: function (event) { setNote(event.target.value); } })]),
      ]) : null,
      command === "" ? h("div", { className: "dshd-note", key: "incomplete" }, row.revision < 1 ? "记录缺少版本，请刷新后重试。" : "选择冲突经验并填写处理依据后，才能生成命令。") : h("div", { key: "command" }, [
        h("code", { className: "dshd-cmd", tabIndex: 0, key: "text" }, command),
        h(CopyCommand, { key: "copy", command: command, label: "复制审阅命令" }),
      ]),
      h("div", { className: "dshd-note", key: "help" }, "复制后粘贴到 DSH 对话，请助手执行；完成后刷新。命令带版本校验，记录变化时会拒绝旧命令。"),
    ]) : null,
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
    title: privacy === true ? "隐私模式：点击此条临时查看" : undefined,
  }, [
    h("div", { className: "dshd-khead", key: "h" }, [
      h("span", { className: "dshd-kbadge", key: "b" }, row.stateLabel),
      h("span", { className: "dshd-ktitle", key: "t", title: row.title }, row.title),
    ]),
    h("div", { className: "dshd-kmeta", key: "m" }, [
      h("span", { className: "dshd-klast", key: "l", title: row.lastTitle }, "最近核验：" + row.lastText),
    ]),
    h("div", { className: "dshd-kbody", key: "body" }, [
      h("div", { key: "when" }, "何时用：" + (row.when !== "" ? row.when : "未标注适用条件")),
      h("div", { key: "action", className: "dshd-action" }, "怎么做：" + (row.action || "未标注具体动作")),
      h("details", { key: "details", onClick: function (event) { event.stopPropagation(); } }, [
        h("summary", { key: "summary" }, "适用范围与证据"),
        h("div", { key: "scope" }, "范围：" + row.scopeLabel),
        row.applicability !== "" ? h("div", { key: "applicability" }, "适用：" + row.applicability) : null,
        row.exceptions.length > 0 ? h("div", { key: "exceptions" }, "例外：" + row.exceptions.join("；")) : null,
        h("div", { key: "evidence" }, "证据：" + row.evidenceSummary),
      ]),
      props.showHoldReason === true && row.holdReasonLabel !== "" ? h("div", { key: "hold", className: "dshd-holdreason" }, "为什么被扣下：" + row.holdReasonLabel) : null,
    ]),
    h(ReviewControls, { row: row, key: row.id + "@" + row.revision }),
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
      h("h4", { key: "t" }, "已审阅经验"),
      h("span", { className: "dshd-spacer", key: "s" }),
      extra,
    ]);
  };
  if (props.error !== null && props.error !== undefined) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, "重试")),
      h("div", { className: "dshd-hint", key: "e", role: "alert" }, "读取经验失败：" + (props.error.message === "" ? String(props.error) : props.error.message)),
      h("div", { className: "dshd-note", key: "n" }, "旧日记不受影响；修好后点「重试」。"),
    ]);
  }
  if (props.empty === true) {
    const empty = knowledgeEmptyState();
    return h("section", { className: "dshd-card dshd-kcard" }, [
      h("h4", { key: "t" }, "经验"),
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
      ? h("span", { className: "dshd-hint", key: "loading" }, "加载中…")
      : h("span", { className: "dshd-hint", key: "count" }, knowledgeCountText(vm.stats))),
    noticeNode,
    h("label", { className: "dshd-note", key: "filter" }, ["查看 ", h("select", { "aria-label": "经验状态", value: stateFilter, onChange: function (event) { setStateFilter(event.target.value); setPageSize(5); } }, [
      h("option", { key: "usable", value: "usable" }, "可用经验"), h("option", { key: "rejected", value: "rejected" }, "已驳回历史"),
    ])]),
    reviewed.length === 0 ? h("div", { className: "dshd-hint", key: "none" }, stateFilter === "usable" ? "暂无可用经验；待核实的记录在下方。" : "没有已驳回记录。") : null,
    h("div", { className: "dshd-krows", key: "rows" }, reviewed.slice(0, pageSize).map(function (row, index) {
      return h(KnowledgeRow, { key: row.id !== "" ? row.id : "k" + String(index), row: row, privacy: props.privacy === true });
    })),
    reviewed.length > pageSize ? h(Btn, { key: "next", onClick: function () { setPageSize(pageSize + 5); } }, "显示更多经验") : null,
    vm.shown < vm.total
      ? h("div", { className: "dshd-note", key: "more" }, "只显示最近 " + String(vm.shown) + " / " + String(vm.total) + " 条经验。")
      : null,
    h("div", { className: "dshd-note", key: "note" }, "采纳记录仍需满足当前任务的平台、版本与项目条件；来源已读不代表结论永远适用。"),
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
      h("h4", { key: "t" }, "待核实"),
      h("span", { className: "dshd-spacer", key: "s" }),
      extra,
    ]);
  };
  if (props.error !== null && props.error !== undefined) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, "重试")),
      h("div", { className: "dshd-hint", key: "e", role: "alert" }, "读取经验失败：" + (props.error.message === "" ? String(props.error) : props.error.message)),
    ]);
  }
  if (props.loading === true) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h("span", { className: "dshd-hint", key: "l" }, "加载中…")),
    ]);
  }
  return h("section", { className: "dshd-card dshd-kcard" }, [
    head(rows.length === 0 ? null : h("span", { className: "dshd-hint", key: "c" }, String(rows.length) + " 条待核实")),
    rows.length === 0
      ? h("div", { className: "dshd-kempty", key: "empty" }, [
          h("div", { className: "dshd-kempty-title", key: "t" }, "没有待核实的经验"),
          h("p", { className: "dshd-kempty-body", key: "b" }, reviewQueueEmptyState()),
        ])
      : h("div", { className: "dshd-krows", key: "rows" }, rows.slice(0, pageSize).map(function (row, index) {
          return h(KnowledgeRow, { key: row.id !== "" ? row.id : "held-" + String(index), row: row, privacy: props.privacy === true, showHoldReason: true });
        })),
    rows.length > pageSize ? h(Btn, { key: "more", onClick: function () { setPageSize(pageSize + 5); } }, "显示更多待核实经验") : null,
    h("div", { className: "dshd-note", key: "note" }, "这些经验默认不会作为任务建议注入；扣留原因来自检索层的 skipped reason。复制审阅命令后到对话里执行，面板不会写文件。"),
  ]);
}

/** 「写入记录」只读区块：<journalDir>/bridge/ 的桥接应用记录。 */
function BridgeLogCard(props) {
  const vm = props.vm;
  const head = function (extra) {
    return h("div", { className: "dshd-khead", key: "head" }, [
      h("h4", { key: "t" }, "写入记录"),
      h("span", { className: "dshd-spacer", key: "s" }),
      extra,
    ]);
  };
  if (props.error !== null && props.error !== undefined) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h(Btn, { key: "retry", onClick: props.onRetry, disabled: props.loading === true }, "重试")),
      h("div", { className: "dshd-hint", key: "e", role: "alert" }, "读取写入记录失败：" + (props.error.message === "" ? String(props.error) : props.error.message)),
    ]);
  }
  if (props.loading === true) {
    return h("section", { className: "dshd-card dshd-kcard" }, [
      head(h("span", { className: "dshd-hint", key: "l" }, "加载中…")),
    ]);
  }
  if (vm.rows.length === 0) {
    const empty = bridgeEmptyState();
    return h("section", { className: "dshd-card dshd-kcard" }, [
      h("h4", { key: "t" }, "写入记录"),
      h("div", { className: "dshd-kempty", key: "empty" }, [
        h("div", { className: "dshd-kempty-title", key: "t2" }, empty.title),
        h("p", { className: "dshd-kempty-body", key: "b" }, empty.body),
        h("p", { className: "dshd-note", key: "h" }, empty.hint),
      ]),
    ]);
  }
  return h("section", { className: "dshd-card dshd-kcard" }, [
    head(h("span", { className: "dshd-hint", key: "c" }, String(vm.total) + " 次写入 · " + String(vm.rollbackable) + " 次可回滚")),
    h("div", { className: "dshd-krows", key: "rows" }, vm.rows.map(function (row, index) {
      return h("div", { className: "dshd-bridge", key: row.id !== "" ? row.id : "bridge-" + String(index) }, [
        h("div", { className: "dshd-bridge-head", key: "h" }, [
          h("span", { className: "dshd-kbadge", key: "a" }, row.actionLabel),
          h("span", { className: "dshd-bridge-target", key: "t", title: row.target }, row.target),
          h("span", { className: "dshd-spacer", key: "s" }),
          h("span", { className: "dshd-klast", key: "at", title: row.atTitle }, row.atText),
        ]),
        h("div", { className: "dshd-bridge-meta", key: "m" }, [
          h("span", { key: "lessons", title: row.lessonsText }, "经验：" + row.lessonsText),
          row.beforeShort === "" ? null : h("span", { key: "before" }, "前哈希：" + row.beforeShort),
          row.afterShort === "" ? null : h("span", { key: "after" }, "后哈希：" + row.afterShort),
          h("span", { key: "rb", className: row.rollbackable === true ? "dshd-rollback-ok" : "dshd-rollback-no" }, row.rollbackText),
        ]),
        h("details", { key: "backup" }, [
          h("summary", { key: "summary" }, "备份标识与回滚命令"),
          h("code", { key: "id", className: "dshd-cmd" }, row.id),
          row.rollbackable === true ? h("code", { key: "command", className: "dshd-cmd", tabIndex: 0 }, bridgeRollbackCommandOf(row)) : null,
        ]),
        row.rollbackable === true ? h(CopyCommand, { key: "rollback", label: "复制回滚命令", command: bridgeRollbackCommandOf(row), title: "粘贴到对应项目对话执行；只恢复管理块，保留块外人工内容" }) : null,
      ]);
    })),
    vm.shown < vm.total ? h("div", { className: "dshd-note", key: "more" }, "只显示最近 " + String(vm.shown) + " / " + String(vm.total) + " 条记录。") : null,
    h("div", { className: "dshd-note", key: "note" }, "只读展示：记录来自 dream_bridge 的 apply；回滚请按 dream_bridge 返回的备份标识在对话里执行，面板不会写文件。"),
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
    title: privacy ? "隐私模式：点击卡片临时查看" : undefined,
  }, [
    h("header", { className: "dshd-dream-head", key: "h" }, [
      h("time", { className: "dshd-time", key: "t", dateTime: dream.at === "" ? undefined : dream.at, title: dream.at === "" ? timeText : timeText + " · " + dream.at }, timeText),
      dreamAgo(dream, props.now) === "" ? null : h("span", { className: "dshd-ago", key: "a" }, dreamAgo(dream, props.now)),
      h("span", { className: "dshd-mood", key: "m", title: "心境：" + dream.mood }, [
        h("i", { className: "dshd-mooddot " + toneClass(moodSlot(dream.mood)), key: "d" }),
        dream.mood,
      ]),
      h("span", { className: "dshd-spacer", key: "s" }),
      collapsible ? h("button", {
        type: "button",
        className: "dshd-linkbtn",
        key: "btn",
        onClick: function (event) { if (event !== undefined && event.stopPropagation !== undefined) event.stopPropagation(); setExpanded(expanded !== true); },
      }, expanded === true ? "收起" : "展开全文") : null,
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
      h("h3", { key: "t" }, "没有找到「" + props.query + "」相关的梦"),
      h("p", { key: "p" }, "换个关键词试试，或者清空搜索看全部梦境。"),
      props.onClear ? h("div", { key: "a" }, h(Btn, { onClick: props.onClear }, "清空搜索")) : null,
    ]);
  }
  return h("div", { className: "dshd-empty" }, [
    moon,
    h("h3", { key: "t" }, "还没有梦境日记"),
    h("p", { key: "p" }, "对 agent 说「做个梦」，它会回放最近的会话、反思之后把第一场梦写进这里。"),
    h("div", { className: "dshd-chips", key: "c" }, [
      h("span", { className: "dshd-chip", key: "s1" }, "对 agent 说「做个梦」"),
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
      setKnowledge(normalizeKnowledge(payload, new Date()));
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
      setBridge(normalizeBridgeRecords(payload, new Date()));
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
  const knowledgeVm = knowledge === null ? { rows: [], total: 0, shown: 0, stats: null } : knowledge;
  const bridgeVm = bridge === null ? { rows: [], total: 0, shown: 0, rollbackable: 0 } : bridge;
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
  const showKnowledge = function () { if (knowledgeLoading !== true) setReloadToken(function (value) { return value + 1; }); };
  const knowledgeCard = h(KnowledgeCard, {
    key: "knowledge",
    vm: knowledgeVm,
    loading: knowledgeLoading === true,
    error: knowledgeError,
    empty: knowledgeError === null && knowledgeLoading !== true && knowledgeVm.rows.length === 0,
    privacy: privacy === true,
    onRetry: showKnowledge,
  });
  const reviewQueueCard = h(ReviewQueueCard, {
    key: "review-queue",
    vm: knowledgeVm,
    loading: knowledgeLoading === true,
    error: knowledgeError,
    privacy: privacy === true,
    onRetry: showKnowledge,
  });
  const showBridge = function () { if (bridgeLoading !== true) setReloadToken(function (value) { return value + 1; }); };
  const bridgeLogCard = h(BridgeLogCard, {
    key: "bridge-log",
    vm: bridgeVm,
    loading: bridgeLoading === true,
    error: bridgeError,
    onRetry: showBridge,
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
        placeholder: "搜索反思与教训…",
        "aria-label": "搜索梦境",
        onChange: function (event) { setQueryInput(event.target.value); },
        onKeyDown: function (event) { if (event.key === "Enter") setQuery(event.target.value.trim()); },
      }),
      queryInput === "" ? null : h("button", {
        key: "clear-search",
        type: "button",
        className: "dshd-clear",
        "aria-label": "清空搜索",
        onClick: clearSearch,
      }, "×"),
    ]),
    h("span", { className: "dshd-spacer", key: "spacer" }),
    pristine || activeTab !== "journal" ? null : h("span", { className: "dshd-hint", key: "count" }, loading === true
      ? "加载中…"
      : countTextOf(query, vm.total, vm.count, filterCount, visibleDreams.length)),
    showFilterButton === true && activeTab === "journal" ? h("div", { className: "dshd-filter", key: "filter" }, [
      h(Btn, {
        key: "btn",
        on: filterCount > 0,
        pressed: filterCount > 0,
        onClick: function () { setFilterOpen(filterOpen !== true); },
        title: "筛选作用于已加载窗口，不影响全量统计",
      }, "筛选" + (filterCount > 0 ? " · " + String(filterCount) : "") + " ▾"),
      filterOpen === true ? h("div", { className: "dshd-filterpop", key: "pop", role: "group", "aria-label": "筛选梦境" }, [
        h("div", { className: "dshd-filtertitle", key: "title" }, "筛选当前已加载的 " + String(vm.count) + " 场，不影响全量统计"),
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
        }, "只看有教训的梦")),
        h("div", { className: "dshd-filterfoot", key: "foot" }, [
          h("button", { key: "clearbtn", type: "button", className: "dshd-linkbtn", onClick: clearFilters, disabled: filterCount === 0 }, "清空筛选"),
          h(Btn, { key: "done", onClick: function () { setFilterOpen(false); } }, "完成"),
        ]),
      ]) : null,
    ]) : null,
    pristine ? null : h(Btn, {
      key: "privacy",
      onClick: togglePrivacy,
      on: privacy === true,
      pressed: privacy === true,
      title: "显示层模糊；DOM 仍为明文，不改文件、不加密",
    }, privacy === true ? "隐私模式：开" : "隐私模式"),
    h(Btn, { key: "refresh", onClick: reload, disabled: loading === true, title: "重新读取梦境日记" }, "刷新"),
  ]);

  const errorBox = error === null ? null : h("div", { className: "dshd-alert error", role: "alert", key: "error" }, [
    h("span", { key: "m" }, "读取梦境日记失败：" + (error.message === "" ? String(error) : error.message)),
    h("span", { className: "dshd-spacer", key: "s" }),
    h(Btn, { key: "retry", onClick: reload, variant: "primary" }, "重试"),
  ]);

  const body = function () {
    if (activeTab === "knowledge") return h("div", { key: "knowledge-tab" }, [knowledgeCard, reviewQueueCard]);
    if (activeTab === "bridge") return bridgeLogCard;
    if (loading === true && vm.count === 0) return h(Skeleton, { key: "skeleton" });
    if (vm.count === 0) {
      if (error !== null) return h("div", { key: "failed-wrap" }, [
        h("div", { className: "dshd-empty", key: "failed" }, [
          h("h3", { key: "t" }, "暂时读不到梦境日记"),
          h("p", { key: "p" }, "等宿主路由就绪后点上面的「重试」；如果一直失败，看一眼 DSH 日志里有没有 [dsh-dream] 告警。"),
        ]),
      ]);
      return h(EmptyState, { key: "empty", query: query, onClear: query === "" ? null : clearSearch });
    }
    return h("div", { key: "content" }, [
      vm.showTiles
        ? h("div", { className: "dshd-tiles", key: "tiles" }, [
            h(StatTile, { key: "total", label: "梦境总数", value: String(vm.total) + " 场", hint: vm.total > vm.count ? "本页显示最近 " + String(vm.count) + " 场" : "全部梦境日记" }),
            h(StatTile, { key: "span", label: "时间跨度", value: vm.spanText, hint: vm.spanHint, title: vm.spanFull }),
            h(StatTile, { key: "latest", label: "最近一场", value: vm.latestText, hint: vm.latestDate }),
            h(StatTile, { key: "mood", label: "心境", value: String(vm.moodCount) + " 种", hint: vm.moodCount === 0 ? "" : "最常见：" + vm.moodRows[0].mood }),
          ])
        : h("div", { className: "dshd-headline", key: "headline" }, vm.headline),
      h("div", { className: "dshd-two", key: "two" }, [
        h(MoodCard, { key: "mood", vm: vm }),
        h(LessonCard, { key: "lessons", vm: vm }),
      ]),
      h("div", { className: "dshd-listhead", key: "listhead" }, [
        h("h4", { key: "t" }, query === "" && filterCount === 0 ? "梦境时间线" : (query === "" ? "筛选结果" : "搜索结果")),
        h("span", { className: "dshd-hint", key: "n" }, listHintOf(query, vm.count, filterCount, visibleDreams.length)),
      ]),
      visibleDreams.length === 0 && filterCount > 0
        ? h("div", { className: "dshd-filterempty", key: "filtered" }, [
            h("span", { key: "t" }, "没有符合筛选的梦（筛选作用于已加载的 " + String(vm.count) + " 场）。"),
            h("span", { className: "dshd-spacer", key: "s" }),
            h(Btn, { key: "clearbtn", onClick: clearFilters }, "清空筛选"),
          ])
        : h("div", { className: "dshd-timeline", key: "timeline" }, visibleDreams.map(function (dream, index) {
            return h(DreamCard, { key: (dream.id !== "" ? dream.id : "dream") + "#" + String(index), dream: dream, now: now, privacy: privacy, index: index });
          })),
    ]);
  };

  return h("div", { className: "dshd-root" + (privacy === true ? " dshd-privacy" : ""), key: "root" }, [
    h("div", { className: "dshd-shell", key: "shell" }, [
      errorBox,
      h("nav", { className: "dshd-tabs", key: "tabs", "aria-label": "梦境面板视图" }, [["journal", "日记"], ["knowledge", "经验"], ["bridge", "写入记录"]].map(function (item) {
        return h("button", { key: item[0], type: "button", className: "dshd-chipbtn" + (activeTab === item[0] ? " on" : ""), "aria-pressed": activeTab === item[0], onClick: function () { setFilterOpen(false); setActiveTab(item[0]); } }, item[1]);
      })),
      toolbar,
      privacy === true ? h("div", { className: "dshd-note", key: "privacynote", role: "status" }, "隐私模式：显示层模糊；DOM 仍为明文，不改文件、不加密。点击卡片可临时查看。") : null,
      body(),
      activeTab !== "journal" ? null : h("div", { className: "dshd-footer", key: "footer" }, [
        h("span", { key: "l" }, footerTextOf(query, limit, vm.total, vm.count)),
        h("span", { className: "dshd-spacer", key: "sp" }),
        canLoadMore === true ? h(Btn, { key: "more", onClick: showMore, disabled: loading === true }, loading === true ? "加载中…" : "显示更早的梦") : null,
        h("span", { key: "r" }, "数据来自梦境日记（dreams.jsonl）"),
      ]),
    ]),
  ]);
}

function DreamSection() {
  return h("div", null, [
    h("h2", { key: "t" }, "梦境日记"),
    h("p", { className: "dshd-sub", key: "p" }, "会话回放 → 反思 → 记忆巩固。这里按时间倒序陈列 agent 做过的梦，附心境方块与教训榜。"),
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
  "@container (max-width:620px){.dshd-two{grid-template-columns:1fr}.dshd-toolbar .dshd-hint{display:none}}"
].join("");
/* @ui-css-end */

// ───────────────────────── 挂载 ─────────────────────────

const inject = ["slots"];

function apply(ctx) {
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
        label: function () { return "梦境日记"; },
        inject: function () { return {}; },
      }, DreamSection);
    });
  } catch (error) { /* 没有 slots 服务：仍是合法插件，只是没有设置页 */ }
}

exports.apply = apply;
exports.inject = inject;
// 纯函数内部件：验证脚本可直接取来测，不必另抄一份算法。
exports.__internals = {
  routeUrl: routeUrl,
  routeUrlFor: routeUrlFor,
  KNOWLEDGE_ROUTE: KNOWLEDGE_ROUTE,
  KNOWLEDGE_LIMIT: KNOWLEDGE_LIMIT,
  fetchKnowledge: fetchKnowledge,
  fetchBridgeRecords: fetchBridgeRecords,
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
