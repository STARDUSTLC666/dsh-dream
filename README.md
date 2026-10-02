[English](README.en.md)

# dsh-dream

## 0.7.0 更新（2026-10-02）

- 设置页直接采纳、驳回、标记待复核和处理冲突；关联来源可展开查看。页面审阅记录为人工操作，模型调用仍记录为模型。
- 带项目目录的经验可预览实际规则差异后应用，并在写入记录确认回滚。旧预览不能覆盖已变化的经验或文件；块外手工内容保留。
- 独立记录“这次有用 / 这次不适用”和场景备注，不自动改变审阅状态。失败时保留输入，重复反馈请求不会重复计数。
- 窄窗口使用顶部横向设置导航；写操作通过官方 DSH 0.2.0-rc.2 认证通道。验收范围见 [0.7.0 记录](docs/validation/0.7.0.md)。

## 0.6.0 更新（2026-09-30）

- **来源核验与独立审阅**：插件实际读取会话记录或项目内产物核对来源；无法核对时降为 claimed 并说明原因。新经验先进入候选，用户纠正原文也需要单独审阅。
- **可靠写入**：AGENTS.md 支持预览、应用、回滚；先持久化恢复记录再写目标文件，中断后仍能恢复。修复新文件 null 哈希、路径链接、CRLF 回滚和并发修改保护。
- **完整审阅**：补充证据、双向冲突、prefer/drop/merge 原子处理、驳回后重新送审；公开编号在面板与命令间保持一致，敏感正文仍脱敏。
- **更易操作**：日记 / 经验 / 写入记录分开；卡片直接显示“怎么做”，冲突表单要求选择经验和处理依据，写入记录可复制回滚命令；支持窄窗与筛选 Escape。
- 验证记录见 [0.6.0 验收](docs/validation/0.6.0.md)，历史变更见 [CHANGELOG](CHANGELOG.md)。

## 0.4.1 更新（2026-09-29）

- **修复 Desktop 启动失败**：前端模块注册 ID 现与 scoped 包名一致（此前注册成 `dsh-dream`，宿主会重试加载并抛 `duplicate factory registration`，导致 `1 entry did not activate`）。日记数据与配置不变，无迁移。

## 0.5.1 更新（2026-09-29）

- **修复**：日记 BOM 导致读空、心境键（`__proto__`/`constructor`）污染计数；**检索纪律**：候选与无证据经验默认不注入、版本判定需要包名上下文、预算按排名整条装入；**历史证据策略**：当时 read 可直接成为 usable；0.6.0 已改为实际核验来源并独立审阅。
- 全量 **204 项 / 203 通过 / 1 默认跳过**；L1 七场景断言 9/9。已知限制：知识库很大时读/写仍随历史线性增长，本版不承诺大库性能。

## 0.5.0 更新（2026-09-29）

- **新增三个工具**：`dream_learn`（提交带证据的候选经验）、`dream_context`（任务前按项目 / 版本取回少量适用经验，只读，默认最多 5 条、3000 字符）、`dream_review`（采纳 / 驳回 / 标记过期或冲突 / 补充证据，强制携带 revision）。
- **新数据目录 `<journalDir>/knowledge/`**：`events.jsonl` 是权威追加日志，`evidence.jsonl` 追加证据，`index.json` 是可丢弃重建的派生索引。旧日记 `dreams.jsonl` 仍只读兼容、永不重写。
- **脱敏与范围承诺**：所有新写盘路径在 `maskSecrets` 开启时先过 `mask.ts`；证据只保存已脱敏摘要和定位信息，不保存隐藏推理、系统提示、工具参数 / 结果正文。经验按项目或全局范围保存，未知当前项目时 `dream_context` 只返回全局经验，绝不跨项目扫描。
- **兼容性**：旧日记与六个既有工具（dream_digest / dream_save / dream_journal / dream_recall / dream_bridge / dream_health）行为不变、输出字段只增不减；升级不需要迁移，也不会改写旧数据。
- **只读面板新增「经验」区块**：展示状态（候选 / 可用 / 有冲突 / 待复核 / 已驳回）、适用条件、范围、适用（package / versions / platform）与例外、证据摘要与最近核验时间；候选与有冲突有明确视觉区分，没有经验时是独立空态；知识日志被截断或有坏行时显示「events.jsonl 未改动」提示。面板仍然没有任何写操作。
- **面板新增两个只读区块（M2）**：「待核实」（candidate / disputed / stale + 被扣下的原因，来自检索层 skipped reason 的中文映射）与「写入记录」（<journalDir>/bridge/ 的应用记录：目标、时间、lessonId@revision、前后哈希、可否回滚及原因）；每条经验给「复制审阅命令」，可桥接（usable）经验给「复制预览命令」，剪贴板不可用时回退为可选中文本。面板仍无写方法。

## 0.4.0 更新（2026-09-29）

新增只读梦境日记可视化面板：打开「设置 → 梦境日记」即可查看梦境总数、心境分布、教训榜与卡片式时间线，并可按关键词搜索；正文超长自动折叠，可一键开启隐私模糊。面板只读，存储格式不变、无需迁移。

> **会做梦的 agent**：会话回放（梦原料）→ 反思（解梦）→ 梦境日记（记忆巩固）。

![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream) ![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-dream) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-dream?style=social)

人睡觉时大脑回放白天的经历、巩固记忆——dsh-dream 让 DeepSeek Harness 的 agent 也拥有这个能力：读取你的历史会话（官方多帧 zstd 会话日志，零依赖解析），提炼梦原料，反思后写入永久梦境日记，下次醒来可以忆梦。

## 兼容性

验证宿主：官方源码构建的 Harness 0.2.0-rc.1（commit 407e65c8，含本地宿主修补）+ Node 24.16.0。0.6.0 在隔离 profile 的实际 Web 宿主中验收；Web 验收不等同于原生 Desktop 安装器验收，具体范围见验收记录。保持完整 scoped 前端模块身份，兼容 Desktop 的模块加载契约。本插件注册 9 个工具与 dream-protocol 技能；零运行时依赖。

支持 v0/v1/v2/v3/v4 的普通 JSONL 与多帧 zstd、旧 packed-chunk 行及内嵌 stream；升级留下多代文件时只读取每个会话的最新规范文件。PTC 子工具调用保留工具名且不重复计数，不提取系统提示、推理、工具参数或结果正文。

默认从 `DSH_HOME/sessions` 读取会话、在 `DSH_HOME/.dsh-dream` 保存日记；未设置 `DSH_HOME` 时使用 `~/.dsh`。配置中的 `sessionsRoot`、`journalDir` 始终优先。

## 安装

```bash
dsh plugin --profile web add @stardustlc/dsh-dream
# 或从源码：
dsh plugin --profile web add github:STARDUSTLC666/dsh-dream
```

安装后重启 Web 服务即可。本插件收录于 [dsh-suite](https://github.com/STARDUSTLC666/dsh-suite) 全家桶——一条命令可装入 STARDUSTLC 全部 18 个插件。

## 卸载

```bash
dsh plugin --profile web remove @stardustlc/dsh-dream
```

卸载后重启 Web 服务。梦境日记默认保存在 `~/.dsh/.dsh-dream/dreams.jsonl`，卸载不会删除；如需彻底清理请手动删除该目录。

## 梦境日记面板（0.4.0+）

装好后，DSH 的「设置 → 梦境日记」提供日记、经验与写入记录。0.7.0 起可以直接审阅和反馈；写操作使用 DSH 0.2.0-rc.2 的认证 Connection 通道。headless 宿主没有设置页，工具与技能照常可用。

- **看什么**：顶部是梦境总数、心境方块序列（单条时不空，多条时自动换行）与教训榜；下面是卡片式时间线，按时间倒序，逐条显示时间、心境、反思正文与教训列表。反思正文默认展开，超过 4 行或 220 字时折叠为 4 行并给出「展开全文」。
- **教训榜**：按日记出现次数与最近时间排序，≥3 次标为“常见教训”；频率不代表正确性、重要度或桥接资格。技术经验必须另行提交来源、审阅，再预览写入规则。
- **搜索**：按关键词过滤，命中反思与教训，不区分大小写。心境分布与教训榜基于**全量日记**，时间线按搜索与条数上限（默认最近 50 场）展示。
- **筛选与更早的梦**：≥8 场时出现「筛选 ▾」（按心境、只看有教训的梦，作用于已加载窗口并在弹层注明）；加载满 50 场且总梦数更多时，页脚提供「显示更早的梦」，点击后一次拉满到 500 场（路由上限）。
- **日记读取**：GET /_dsh/dsh-dream/journal 仅回环地址可达；非 GET → 405，非本机 Host → 403。记梦、翻梦、忆梦仍通过 dream_save / dream_journal / dream_recall 完成。面板审阅只更新经验事件，预览本身不写文件。
- **数据文件**：面板读的就是梦境日记本身，默认 ~/.dsh/.dsh-dream/dreams.jsonl（$DSH_HOME/.dsh-dream/dreams.jsonl；配置了 journalDir 时以配置为准）。存储格式不变，仍是每行一条 JSON 的 JSONL，可直接删除或用 dream_journal 读取。
- **隐私**：只读路由会再次脱敏正文；已校验的内部经验、证据与备份编号保留以供操作。界面只访问本机同源路由，不上传第三方服务。“隐私模式”仅模糊显示，DOM 仍有文本；日志本身是明文。
- **还没有梦时**：面板显示空态，提示对 agent 说「做个梦」——它会回放最近的会话、反思之后把第一条梦写进这里；只有一场梦时按单条卡片展示，心境方块与教训榜都不留空、不画失真图表。
- **经验视图**：可用经验与待核实队列分开，已驳回历史按需查看。来源记录可展开查看核验信息；采纳、驳回、重新送审和标记待复核可以直接点击。处理冲突须选择对方经验和填写依据。每次操作检查版本，冲突时保留输入并提供刷新；对话命令入口仍可使用。
- **使用反馈**：展开“使用反馈”记录这次有用或不适用，并可填写场景。反馈不会自动改变审阅状态、证据或最后核验时间；最近 20 条明细可恢复，事件流保留历史。
- **规则变更与回滚**：带项目目录的可用经验提供“预览规则变更”，展示实际目标与新增/删除差异后才可应用。此预览按所选经验重建 Dream 管理块，保留块外内容；经验版本或文件哈希变化时拒绝应用。没有项目目录的经验须在对应项目对话中使用预览命令。写入记录展示备份与“回滚这次变更”；当前管理块仍匹配该次 apply 时才允许回滚。

## 工具一览

| 工具 | 作用 | 关键参数 |
| :-- | :-- | :-- |
| `dream_digest` | 入梦：回放最近会话（标题/轮数/用户原话/助手结论/工具足迹），自动跳过子代理，还原官方打包行流式文本 | `maxSessions` 可选；`mode`: full/brief |
| `dream_save` | 记梦：反思 + 1-5 条教训 + 心境，永久保存 | `reflection` 必填；`lessons`/`mood` 可选 |
| `dream_journal` | 翻梦：倒序列出历史梦境 | `limit` 可选 |
| `dream_recall` | 忆梦：关键词检索梦境 | `query` 必填 |
| `dream_bridge` | 渡梦：把已采纳、范围匹配的经验写入 AGENTS.md（`preview` 预览 / `apply` 应用 / `rollback` 回滚；缺省保留旧直写并给弃用提示） | `mode` 可选；`path` / `lessonIds` / `maxLessons` / `expectedSha256` / `previewId` / `projectId` |
| `dream_health` | 自检：会话目录/梦境计数/配置汇总 | 无 |
| `dream_learn` | 提交候选技术经验及证据（校验 / 脱敏 / 去重 / 按范围保存；无证据只能留在候选） | `kind`、`title`、`action`、`when` 必填；`evidence` 可选（缺省 `[]`） |
| `dream_context` | 任务前取回少量适用经验（只读；候选默认不注入） | `query` 必填；`projectId` / `workspaceRoot` / `limit` / `maxChars` / `packageName` / `packageVersion` / `platform` / `includeCandidates` 可选 |
| `dream_review` | 审阅与状态流转：采纳 / 驳回 / 标记过期 / 标记冲突 / 处理冲突 / 补充证据 / 重新送审 | `action`、`lessonId`、`expectedRevision` 必填 |

处理冲突时必须填写 resolution（prefer / drop / merge）、affectedIds 与 note；所有当事方一并校验并在同一事件中保存，校验失败不改任何经验。attach-evidence 核验并附加来源，reopen 把驳回经验重新置为候选。

### 示例

```text
dream_digest { maxSessions: 5, mode: 'brief' }
dream_save { reflection: "用户反复遇到输入法问题，偏好先自查再重启", lessons: ["先问是否重启过应用"], mood: "平静" }
dream_recall { query: "输入法" }
dream_bridge { mode: "preview", path: "AGENTS.md", maxLessons: 10 }
dream_context { query: "SMTP 取消投递", projectId: "mailer", packageName: "nodemailer", packageVersion: "9.0.5", platform: "windows" }
dream_learn { kind: "pitfall", title: "池化发送中 close() 不保证终止投递", action: "取消后验证当前连接确实关闭", when: "使用 Nodemailer 9.0.5 池化发送并处理 AbortSignal 时", evidence: [{ kind: "local-artifact", artifactPath: "test-results/smtp.txt", summary: "本机 SMTP 复现：取消后服务器仍收到正文", verification: "read" }] }
dream_review { action: "accept", lessonId: "lesson-…", expectedRevision: 1 }
```

## 渡梦：让梦变成长期记忆（M2）

`dream_bridge` 现在有显式三模式：

- `preview`（只读）：返回真实 diff、参与经验与 skipped 原因，零写入；
- `apply`：必须带预览的 `expectedSha256`（新文件为 null），建议同时带 `previewId`，文件被并发修改时返回 `conflict` 且零写入；只替换 Dream 管理块（`<!-- dsh-dream:start/end -->`），保留块外文字、BOM 与换行风格，先持久化 pending 恢复记录再原子替换文件，最后记录 applied；
- `rollback`：用 backupId 定位记录，只在当前管理块仍等于该次 apply 结果时回滚，保留块外后来追加的人工内容。

缺省不传 `mode` 保持 0.5.x 直写并返回弃用提示；建议新流程一律显式 `preview → apply`。只有 `usable`、scope 匹配当前项目（或显式 global 且 review.decision 为 accepted）的经验可桥接，频次不再准入；写入内容统一过 `mask.ts`。面板的「写入记录」展示备份与可否回滚，0.7.0 起提供确认回滚按钮。

## 做梦协议（随包技能）

插件附带 `dream-protocol` 技能，教 agent 何时做梦（开场/收尾/距上次做梦超一天）、做梦三步（入梦→解梦→记梦）与记梦纪律（只沉淀规律不复述流水账、密钥隐私不入梦、存疑要标注）。

## 经验记忆（M1）

梦境日记是主观感悟；真正要复用的技术经验走 `<journalDir>/knowledge/`：

- **候选 → 来源核验 → 审阅**：dream_learn 创建 candidate。会话来源需要 sessionId、recordSeq 与可匹配的 quote（省略时用 summary 匹配）；插件核对项目、角色、记录和文本并计算 sourceHash。user-correction 必须来自真实用户消息；local-artifact 需要 artifactPath，真实路径必须位于调用工作目录内。核验失败记 claimed 与 verificationReason，不计独立支持数。读到来源不等于用户采纳，工具审阅记录 actor:model。补充证据不会自动改变状态；所有审阅携带 expectedRevision，旧版本会拒绝。
- **取回有预算**：`dream_context` 默认最多返回 5 条、3000 字符（硬上限 20 条 / 20000 字符）；按排名整条装入，遇到第一条放不下就停止（`skipped: budget-stop`），`title / when / action / exceptions` 永不截断，绝不返回半条。候选与无独立证据的非 usable 条目默认不注入（`includeCandidates: false`，记 `candidate-hold` / `no-evidence`）；显式 `includeCandidates: true` 可在审阅候选时看到，且候选排在可用经验之后——未经审阅不得当作已证实结论。已驳回、已过期和冲突未解决的不注入；platform 可显式指定，未指定时从明确任务文字识别，否则采用宿主平台，平台不符记 platform-mismatch；`applicability.versions` 只在包名被识别（显式 `packageName` 或 query 中出现包名）时参与判定。
- **频率不是可靠性**：同一条证据重复提交是幂等的；不要在同一个会话里反复 `dream_save` / `dream_learn` 刷次数。同一个会话中重复出现的教训只算一次独立来源。
- **存储可恢复**：`events.jsonl` 是权威事件日志（追加写），`evidence.jsonl` 追加证据，`index.json` 是可丢弃重建的派生索引；重建索引不删除任何原文件。目录不存在时读取接口返回空结果，不会为了读而创建目录。
- **删除新数据**：直接删除 `<journalDir>/knowledge/` 即清空经验记忆；这不会影响 `dreams.jsonl` 里的旧日记，旧版本插件也仍能读取旧日记。

## 配置

在你自己的 profile 的 `cordis.patch.yml` 里覆盖本插件行（缺省时用默认值也能加载）：

```yaml
- id: dream
  name: '@stardustlc/dsh-dream'
  config:
    # sessionsRoot: ''        # 会话根目录（默认 ~/.dsh/sessions）
    # journalDir: ''          # 梦境日记目录（默认 ~/.dsh/.dsh-dream）
    maxSessions: 10           # dream_digest 最多回放会话数（1-50）
    maxCharsPerSession: 6000  # 每会话摘要字符上限（500-50000）
    # maxUserMessages: 5      # 每会话保留用户消息条数（1-20）
    # maskSecrets: true       # 梦原料隐私脱敏开关（默认开）
```

## 隐私保护（默认开启）

梦原料入梦前自动脱敏：sk 密钥、GitHub/Groq/Slack 令牌、AWS 密钥、JWT、`password/token/api_key` 赋值、超长高熵串都会被打成 `[已脱敏·类型]`。M1 的经验 / 证据 / 错误 / 桥接写盘路径在 `maskSecrets` 开启时同样先过 `mask.ts`，面板只读路由返回的文本也会再做一次脱敏。不需要时可在配置里设 `maskSecrets: false`。

## 权限与数据

- 只读访问会话目录（`~/.dsh/sessions`），不修改任何会话文件；
- 梦境日记以 JSONL 追加写入 `journalDir`；经验与证据追加写入 `journalDir/knowledge/`（events.jsonl / evidence.jsonl，index.json 可重建）；
- 不发起任何网络请求；
- 会话内容可能包含敏感信息——做梦协议明确禁止把密钥/隐私写入梦境，但梦境日记本身是明文存储，请自行评估。

## 排错

- `dream_digest` 返回 0 个会话：先运行 `dream_health` 检查会话目录是否存在；确认 DSH 已产生过会话；
- 梦境写不进去：检查 `journalDir` 可写权限；
- 加载失败：查看 DSH 启动日志中带 `[dsh-dream]` 前缀的告警。

## 开发

```bash
pnpm install
pnpm test       # 构建 + 离线测试（会话代际、多帧 zstd、流式记录、隐私脱敏、日记、桥接与注册生命周期）
```

## License

MIT（见 [LICENSE](LICENSE)）
