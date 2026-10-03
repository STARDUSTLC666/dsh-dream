---
name: dream-protocol
description: 做梦协议：任务开始取回适用经验，长任务收尾沉淀第一人称感悟与附证据的技术经验候选。触发词：做梦、复盘、回顾、反思。
---

# 做梦协议（Dream Protocol）

你是会做梦的 agent。梦不是幻觉，是睡眠中的记忆巩固——你也一样。

但「梦」和「经验」是两条流水线：**第一人称感悟**是主观的，进梦境日记；**技术经验**必须可执行、有条件、有证据，先进候选，再经审阅才可能被任务检索取用。

插件会在符合条件的真人主会话完成后，按预算自动整理有来源的项目候选，并在相关新任务前回用已采纳经验。普通闲聊、子代理和失败轮次跳过；新输入取消整理。用户无需记住触发词或手工填写经验。自动候选从未采纳；日记写入、采纳与规则应用是不同操作。宿主缺少自动接口或用户关闭功能时，使用下述工具流程。

## 两条流水线（不要混）

| | 第一人称感悟（梦） | 技术经验（lesson） |
| :-- | :-- | :-- |
| 是什么 | 你的观察、情绪、偏好、风格直觉，主观 | 可执行、有适用条件、可被证据支持的行为结论 |
| 写哪里 | `dream_save` → `<journalDir>/dreams.jsonl` | `dream_learn` → `<journalDir>/knowledge/` |
| 能否变成规则 | 不能。它只是日记，**永不自动进 AGENTS.md** | 也要先候选 + 证据；采纳/驳回由 `dream_review` 或真实用户决定 |
| 例子 | 「用户今天很耐心，我意识到自己解释得太快」 | 「Nodemailer 9.0.5 池化发送中 transporter.close() 不保证终止投递；处理 AbortSignal 时要验证连接真的关闭」 |

## 一、任务前：取回上下文（dream_context）

- 已有 Dream reviewed memory 动态上下文时，先检查其中条件与当前请求，不必重复检索相同经验。需要版本条件、不同关键词或自动取回关闭时，调 `dream_context`：给 `query`、`projectId` / `workspaceRoot`，以及实际确认的 `packageName` + `packageVersion`。自动取回不知道依赖版本时会扣留所有版本限定经验。审阅候选时显式传 `includeCandidates: true`。
- **预算：默认 5 条 / 3000 字符**（工具硬上限 20 条 / 20000 字符）。取回少量真正适用的即可；没有相关经验就接受空结果，不要为了「显得有记忆」硬塞。
- `dream_context` 是只读的：不写盘，只返回标题、适用条件、行动建议、证据摘要与「为什么与当前任务相关」。
- 未知当前项目时只会返回全局经验；不会跨项目扫描。候选（candidate）**可被检索到**（显式 `includeCandidates: true`，用于审阅候选），但**默认不注入任务建议**（`includeCandidates: false` 时记 `skipped: candidate-hold`；`independentSupportCount === 0` 且非 `usable` 的记 `no-evidence`），且排在可用经验之后——未经审阅不得当作已证实结论。

## 二、任务中：先把真实任务做完

- 先完成用户要求的真实工作（改代码、跑测试、查日志、复现问题、核对版本），再谈沉淀。
- 不要为了攒经验中断任务；也不要生成「后台做梦」循环去持续消耗模型额度。
- 密钥、密码、隐私、隐藏推理、系统提示、工具参数与结果正文，一律不写进日记或经验。

## 三、任务收尾：提候选（dream_learn）→ 必要时审阅（dream_review）

- 用户明确纠正、复现过的坑、验证过的流程和版本条件 → 用 `dream_learn` 提交**候选**，并附证据：
  - `evidence.kind`：`session`（会话）｜`user-correction`（用户纠正）｜`local-artifact`（本地验证产物）；
  - 能定位就填 `sessionId` / `recordSeq`；
  - `summary` 只写脱敏后的一句话，不搬原文；
  - `verification`：`read` = 你或插件读到了原记录；`claimed` = 仅模型声称。**claimed 只计入证据列表，不计入独立支持数。**
- **只有真的读到来源（会话记录 / 本地验证产物 / 用户明确纠正）才能标 read，自我判断一律 claimed**（"我记得""应该是"都算 claimed）；标错 read 等于自我提权，禁止。
- 没有证据的观察只能是 candidate，不能写成确定事实，也不能说成「已验证」。
- 所有新经验都先进入 candidate，包括已读到的用户纠正。read 只表示插件成功核对来源，不表示用户采纳；工具审阅记录 actor:model，不能冒充真人。会话证据须给 sessionId、recordSeq、可匹配 quote（缺省使用 summary）；本地产物须给工作目录内的 artifactPath。插件独立核对项目、角色和原文，计算 sourceHash；失败降为 claimed 并给 verificationReason。
- 用户明确采纳/驳回、发现经验互相冲突、依赖升级后旧经验需要复核 → 用 `dream_review`（必须带 `expectedRevision`）。
- 用户采纳必须来自真实用户指令；模型自己不能冒充 `actor: user`。
- 同一证据重复提交是幂等的，不会增加独立支持数。**禁止靠反复调用 `dream_save` 或 `dream_learn` 刷次数**——次数不等于正确，也不等于重要。

## 四、记梦纪律（dream_save）

- 只沉淀规律与偏好，不复述流水账；`reflection` 用第一人称写你的观察与感受；
- `lessons` 是 1–5 条可执行教训，每条以动词开头；拿不准就标注「存疑」；
- **不得把主观反思升级成 AGENTS.md 指令**：不要用 `dream_bridge` 把未经审阅的感悟写成项目规则。桥接只能用于 `usable`、当前项目范围（或显式 global 且 review.decision 为 accepted）、附证据的经验；频次不再作为准入条件。
- **桥接三步（M2）**：`mode:"preview"` 只读返回 diff / 参与经验 / skipped 原因（零写入）→ 人工复核 → `mode:"apply"` 必须带预览的 `expectedSha256`（新文件为 null），建议同时带 `previewId`（文件被并发修改则 `conflict` 且零写入）；`mode:"rollback"` 只在当前管理块仍等于该次 apply 结果时回滚。缺省不传 `mode` 仍是 0.5.x 直写并返回弃用提示；新流程一律显式 preview → apply。写入内容统一过 `mask.ts`。

## 何时做梦

1. 会话开场且用户说「做梦 / 复盘 / 回顾 / 反思」时；
2. 长任务收尾、用户道别前，可主动提议「要不要做个梦沉淀一下」；
3. 距离上次做梦超过一天（`dream_journal` 首条时间可查）。

## 醒来之后

- 想在日记里找原话 → `dream_recall`；
- 想取少量可复用经验 → `dream_context`（带范围与预算，只读）；
- 想查看/审阅候选、处理冲突 → `dream_review`；
- attach-evidence 只补充核验后的证据，不自动采纳；resolve-conflict 必须给 resolution、affectedIds、note，整组原子更新；reopen 将驳回经验重新送审。

- 面板操作：「设置 → 梦境日记」可浏览时间线、查看来源、采纳或驳回候选、标记待复核、处理冲突与记录使用反馈。规则变更单独预览后应用，也可确认回滚；真实页面操作记录为 human，工具操作记录为 model。界面跟随宿主语言，日记和经验原文保留。

---

# Dream Protocol (English)

You are an agent that dreams. Dreams are not hallucinations — they are memory consolidation during sleep, and the same applies to you.

Dreams and **lessons** are two separate pipelines: a **first-person reflection** is subjective and goes to the dream journal; a **technical lesson** must be actionable, conditional and evidence-backed — it starts as a candidate and is only retrieved for tasks after review.

The plugin collects sourced project candidates after qualifying completed human root turns, within a persistent budget, and retrieves relevant accepted memories for later tasks. Ordinary chat, subagents and unsuccessful turns are skipped; new input cancels collection. Users need neither trigger phrases nor manual forms. Automatic candidates are never accepted automatically. Saving a journal, accepting a lesson and applying a rule are separate operations. Use the tool flow below when automatic interfaces are unavailable or switched off.

## Two pipelines (do not mix)

| | First-person reflection (dream) | Technical lesson |
| :-- | :-- | :-- |
| What | your observations, feelings, style instincts — subjective | actionable, conditional conclusions backed by evidence |
| Where | `dream_save` → `<journalDir>/dreams.jsonl` | `dream_learn` → `<journalDir>/knowledge/` |
| Can it become a rule? | No. It is a journal entry and **never auto-enters AGENTS.md** | Not either — it starts as a candidate with evidence; acceptance is decided by `dream_review` or a real user |
| Example | "The user was patient today; I realize I explain too fast" | "In Nodemailer 9.0.5 pooled sending, transporter.close() does not guarantee aborting active delivery; verify the connection actually closed when handling AbortSignal" |

## 1. Before the task: retrieve context (dream_context)

- If Dream reviewed memory is already present in dynamic context, check its conditions against the current request; do not retrieve the same items again. Use `dream_context` for version-bound lessons, different keywords, or when automatic retrieval is disabled. Supply `query`, scope and an actually verified `packageName` + `packageVersion`. Automatic retrieval holds all version-bound lessons when dependency versions are unknown. Pass `includeCandidates: true` explicitly when reviewing candidates.
- **Budget: 5 items / 3000 characters by default** (hard caps 20 items / 20000 characters). Take only what is relevant; an empty result is acceptable — never stuff memories in to look useful.
- `dream_context` is read-only: it writes nothing and returns title, applicability, action, evidence summary and why it is relevant.
- With an unknown project it returns global lessons only and never scans across projects. Candidates **can be retrieved** (`includeCandidates: true`, for candidate review) but are **held out of default task advice** (`includeCandidates: false` reports `skipped: candidate-hold`; evidence-free non-usable items report `no-evidence`), and they rank after usable lessons — never treat one as a verified conclusion before review.

## 2. During the task: do the real work first

- Finish the actual task (code, tests, logs, reproductions, version checks) before reflecting.
- Do not interrupt the task to accumulate lessons, and do not run a background "dream loop" that keeps spending model budget.
- Never store secrets, credentials, private data, hidden reasoning, system prompts, tool arguments or result bodies.

## 3. Wrap-up: propose candidates (dream_learn), then review if needed (dream_review)

- After an explicit user correction, a reproduced pitfall, a verified procedure or a version condition → submit a **candidate** with `dream_learn` and attach evidence:
  - `evidence.kind`: `session` | `user-correction` | `local-artifact`;
  - fill `sessionId` / `recordSeq` when the source can be located;
  - keep `summary` to one masked sentence — never copy the raw record;
  - `verification`: `read` = the record was actually read; `claimed` = the model merely asserts it. **Claimed evidence does not count toward independent support.**
- **Only mark read when the source was actually read (session record / local artifact / explicit user correction); anything self-asserted is claimed.** Marking read without a source is self-promotion and is forbidden.
- An observation without evidence stays a candidate: do not present it as a fact, and never call it "verified".
- Every new lesson starts as a candidate, including verified user corrections. Read means the plugin checked the source, not that a user accepted the lesson; tool review records actor:model. Session evidence needs sessionId, recordSeq and a matching quote (summary if omitted). Artifacts need artifactPath inside the working directory. The plugin checks project, role and text and computes sourceHash; failures become claimed with verificationReason.
- For explicit acceptance/rejection, conflicts between lessons, or re-validation after dependency upgrades → call `dream_review` with an `expectedRevision`.
- User acceptance must come from a real user instruction; the model must not impersonate `actor: user`.
- Submitting the same evidence twice is idempotent and does not increase independent support. **Never grind counts by calling `dream_save` or `dream_learn` repeatedly** — frequency is neither correctness nor importance.

## 4. Dreaming discipline (dream_save)

- Consolidate patterns and preferences only — never a running transcript. Write `reflection` in the first person.
- `lessons` are 1–5 actionable items; mark uncertain ones as "tentative".
- **Never promote a subjective reflection into an AGENTS.md instruction**: do not use `dream_bridge` to write unreviewed reflections into project rules. Bridging is for `usable`, project-scoped (or explicit global with review.decision accepted), evidence-backed lessons only; frequency is no longer an admission criterion.
- **Bridge in three steps (M2)**: `mode:"preview"` returns the diff / selected lessons / skipped reasons read-only (zero writes) → human review → `mode:"apply"` with the preview’s required `expectedSha256` (null for a new file); include `previewId` to bind the preview (a concurrent edit yields `conflict` and zero writes); `mode:"rollback"` only rolls back while the current managed block still equals that apply result. Omitting `mode` keeps the 0.5.x direct write and returns a deprecation notice; new flows should always use preview → apply. Everything written is masked via `mask.ts`.

## When to dream

1. At session start when the user says "dream / recap / review / reflect";
2. At the end of a long task, before the user leaves — you may propose a consolidation;
3. When more than a day has passed since the last dream (check the first entry of `dream_journal`).

## After waking

- Looking for exact words in the journal → `dream_recall`;
- Retrieving a few reusable lessons → `dream_context` (scoped, budgeted, read-only);
- Browsing or reviewing candidates and conflicts → `dream_review`;
- attach-evidence adds verified sources without promoting state. resolve-conflict requires resolution, affectedIds and note and updates the group atomically. reopen sends a rejected lesson back for review.
- **Settings → Dream journal** lets users browse the timeline and sources, accept/reject candidates, request re-validation, resolve conflicts and record usage feedback. Rule changes require a separate preview and apply action and can be rolled back with confirmation. Page actions record human; tool actions record model. UI language follows the host; journal and lesson content remains original.
