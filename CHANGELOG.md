# Changelog

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
