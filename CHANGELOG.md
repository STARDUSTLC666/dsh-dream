# Changelog

## 0.5.0（2026-09-29）

- **从「反思」升级为「有来源的经验」**：新增 `dream_learn`（提交候选经验 + 证据，校验 / 脱敏 / 去重 / 按项目或全局范围保存）、`dream_context`（任务前取回少量适用经验，只读，默认 5 条 / 3000 字符，硬上限 20 条 / 20000 字符）、`dream_review`（采纳 / 驳回 / 标记过期 / 标记冲突 / 补充证据，强制 `expectedRevision`）。六个既有工具行为不变，输出字段只增不减。
- **新数据目录 `<journalDir>/knowledge/`**：`events.jsonl` 权威追加日志、`evidence.jsonl` 追加证据、`index.json` 可丢弃重建的派生索引；写入使用短期文件锁与幂等键。`dreams.jsonl` 永不重写，旧日记继续按原格式读取。
- **证据纪律**：证据只保存脱敏摘要与定位信息；`verification: read` 与 `claimed` 分开，claimed 不计入独立支持数；同一证据重复提交幂等，不增加独立来源。所有新写盘路径在 `maskSecrets` 开启时先过 `mask.ts`。
- **范围与预算**：经验按 `projectId` / `workspaceRoot` / `global` 过滤，未知当前项目时 `dream_context` 只返回全局经验；条件与例外不被截断，预算放不下就整条不返回；已驳回、已过期、冲突未解决的默认不注入任务。
- **只读面板新增「经验」区块**：展示 title / when / state / scopeLabel / evidenceSummary / lastValidatedAt；候选与有冲突的视觉区分明确，空态独立；只读路由新增 GET /_dsh/dsh-dream/knowledge（返回脱敏后的 `{ lessons, evidence, stats }`，沿用回环 Host / 405 / 403 / 错误信封），面板仍无任何写操作。
- **技能与文档**：`dream-protocol` 技能区分「第一人称感悟」与「技术经验」，流程改为取回上下文 → 执行真实任务 → 收尾提候选（附证据）→ 必要时 dream_review，并写清预算、禁止靠反复 `dream_save` 刷次数、禁止把主观反思升级成 AGENTS.md 指令；README 中英文新增 M1 章节。
- **测试**：112 → 169 项全部通过（新增知识存储 / 检索 / 三个新工具的宿主 schema 契约 / 只读知识路由零写盘与脱敏 / 面板经验区块纯函数用例）；`tsc`、`node --check lib/client.js` 与官方加载器回归（冷加载 / 缓存 / invalidate 重载）均通过。真实桌面 / Web 目视验收仍待 M1 发布前完成。
- 本版为 M1 首个发布版本。真实桌面 / Web 目视验收（经验区块配色与空态、窄窗、125%/150% 缩放、深浅色）与 18 插件同载冷启动复验**尚未完成**，完成后单独记录结论。

## 0.4.1（2026-09-29）

- **修复 Desktop 启动失败**：前端 bundle 的模块注册 ID 与 scoped 包名不一致（注册成 `dsh-dream`，而包名是 `@stardustlc/dsh-dream`），宿主会重试加载并抛 `client-modules: duplicate factory registration for "dsh-dream"`，导致 `web boot: 1 entry did not activate`。现统一为完整包身份。
- **回归测试**：`test/client-internals.test.mjs` 新增断言——注册 ID 必须等于 `package.json` 的 `name`；并用官方 `ClientModuleSystem` 验证「冷加载 / 缓存命中 / invalidate 后重载」三条路径，改回旧 ID 能稳定复现该错误。
- 说明：0.4.0 的面板功能本身不受影响（Web 下可用），本版只是让 Desktop（`dsh-app://`）能正常激活该入口；日记数据与配置不变，无迁移。
## 0.4.0（2026-09-29）

- **新增：只读梦境日记可视化面板**。Web profile 设置页新增「梦境日记」一节：梦境总数、心境方块序列、教训榜（按出现次数排序、同次数按最近出现时间排序，行尾 ×N 与最近一次出现时间，≥3 次标「桥接候选」并注明由 dream_bridge 决定是否写入 AGENTS.md）与卡片式时间线（时间 / 心境 / 反思 / 教训），支持关键词搜索。反思正文默认展开，超 4 行或 220 字折叠为 4 行可展开；顶部「隐私模式」可一键模糊正文与教训（仅浏览器显示层，不改变文件）。空日记与单条日记有专门呈现，不画失真图表、不显示假精度 KPI。
- 面板数据来自新增的只读同源路由 GET /_dsh/dsh-dream/journal：仅回环地址可达，非 GET 返回 405、非本机 Host 返回 403；?limit=（1–500，默认 50）与 ?q=（走 searchDreams）可选；响应契约仍为 { dreams, stats, query, limit }，其中 stats.topLessons 新增 lastAt（最近一次出现时间，纯增量），不含桥接字段。面板不提供任何写操作，记梦/翻梦/忆梦仍走 dream_save / dream_journal / dream_recall。
- **存储格式不变**：dreams.jsonl 仍是每行一条 DreamEntry JSON（id / at / reflection / lessons / mood），无迁移；升级后直接沿用现有日记。
- 修复：searchDreams（dream_recall 与面板搜索共用）此前只检索最近 1000 条日记，现在覆盖全量日记，并补充回归测试。
- 新增手写 lib/client.js（不经 tsc，随包发布）；package.json 声明 dsh.client（inject @deepseek-ai/dsh-client-ui-settings，platform: "web"）并导出 ./client；未新增任何依赖。
- 面板另含：≥8 场时的「筛选 ▾」（按心境 / 只看有教训，作用于已加载窗口）与满 50 场后的「显示更早的梦」（一次拉满 500 场上限）。
- 测试：64 → 109 项（19 个测试文件）全过；新增网页只读路由、lastAt 统计、全量检索回归与面板纯逻辑 vm 测试。
- **后续计划**：用 sidecar 记录桥接状态（哪些教训、何时写进哪个 AGENTS.md）。v1 不读取 AGENTS.md、不新增状态文件。
## 0.3.5（2026-09-28）

- 兼容验证更新到 Harness 0.2.0-rc.1：64 项测试与 18 插件共同加载检查通过（`dream_digest` 按 v4 会话格式读取，继续过滤推理块）。
- 运行时代码未变；同步中英文兼容性声明。

## 0.3.4（2026-09-28）

- 修复 [#2](https://github.com/STARDUSTLC666/dsh-dream/issues/2)：`dream_digest` 摘要现在实际输出用户原话、助手回应与工具足迹（此前只列出标题/轮数/目录）；
- 支持官方 Harness 0.1.7-rc.2 的 v4 会话文件：按消息 `source.kind` 只保留真人输入，过滤推理块与自动注入的上下文，避免当成用户原话；
- 跳过真正空会话；标题、工作目录、预设与工具名一并脱敏（此前只脱敏消息正文）；
- 测试扩至 64 项全过（新增 v4 明文/zstd 与摘要渲染回归）。

## 0.3.3（2026-09-11）

- 适配并验证官方 Harness 0.1.5-rc.1：整套同载、工具/技能契约与 Web 鉴权检查通过。
- Node 要求与宿主统一为 `^22.19.0 || >=24.0.0`；更新中英文兼容性说明。
- 修复 v3 会话被跳过的问题，兼容 v2/v3 PTC 子调用工具足迹，避免重复计数与提取私密正文；新增 6 项回归测试，60 项测试通过。

## 0.3.2（2026-09-05）

- 适配 Harness 0.1.3 的 `session.v2.jsonl` / `.zstd` 代际文件；迁移保留旧文件时每个会话只读取最新规范文件。
- 解析 v2 的内嵌 `assistant/message` / `assistant/attempt` 流，继续兼容 v0 打包行与 v1 片段。
- 默认会话与日记目录遵循 `DSH_HOME`；显式配置仍优先。

## 0.3.1（2026-08-31）

- 支持 0.1.2 ContentBlock 数组载荷的文本提取；
- npm 包名改为 `@stardustlc/dsh-dream`（`dsh-dream` 已被他人占用）。

## 0.3.0（2026-08-26）

- `dream_bridge` 渡梦：把高频教训幂等合并进 `AGENTS.md` 标记块，梦变成长期记忆；
- `dream_journal` 增加心境分布与最常梦到教训的统计；
- 48 个测试全过。

## 0.2.0（2026-08-26）

- 官方打包行（text-chunks 协议）流式文本还原；
- 梦原料默认隐私脱敏（密钥/令牌/JWT/高熵串 → `[已脱敏·类型]`）；
- 入梦 `brief` 模式（`mode: 'brief'`）；
- 40 个测试全过。

## 0.1.0（2026-08-26）

- 首版：会话回放（`dream_digest`）、梦境日记（`dream_save`/`dream_journal`/`dream_recall`）与做梦协议技能；
- 官方多帧 zstd 会话日志零依赖解析；
- 28 个测试全过。
