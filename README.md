[English](README.en.md)

# dsh-dream

## 0.4.1 更新（2026-09-29）

- **修复 Desktop 启动失败**：前端模块注册 ID 现与 scoped 包名一致（此前注册成 `dsh-dream`，宿主会重试加载并抛 `duplicate factory registration`，导致 `1 entry did not activate`）。日记数据与配置不变，无迁移。

## 0.4.0 更新（2026-09-29）

新增只读梦境日记可视化面板：打开「设置 → 梦境日记」即可查看梦境总数、心境分布、教训榜与卡片式时间线，并可按关键词搜索；正文超长自动折叠，可一键开启隐私模糊。面板只读，存储格式不变、无需迁移。

> **会做梦的 agent**：会话回放（梦原料）→ 反思（解梦）→ 梦境日记（记忆巩固）。

![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream) ![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-dream) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-dream?style=social)

人睡觉时大脑回放白天的经历、巩固记忆——dsh-dream 让 DeepSeek Harness 的 agent 也拥有这个能力：读取你的历史会话（官方多帧 zstd 会话日志，零依赖解析），提炼梦原料，反思后写入永久梦境日记，下次醒来可以忆梦。

## 兼容性

验证宿主：官方源码构建的 Harness `0.2.0-rc.1`（commit `407e65c8`）+ Node `24.16.0`（2026-09-29）。112 项插件测试在隔离环境全部通过；同一个宿主里 18 个插件共同加载，本插件注册 6 个工具与 `dream-protocol` 技能，工具 schema 与健康检查契约通过。本轮未启用真实端口与外部服务；面板仅在本机回环地址下可达。

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

装好后，DSH 的「设置 → 梦境日记」里会多出一节**只读**面板（Web profile 专用；headless 宿主没有设置页，工具与技能照常可用）。

- **看什么**：顶部是梦境总数、心境方块序列（单条时不空，多条时自动换行）与教训榜；下面是卡片式时间线，按时间倒序，逐条显示时间、心境、反思正文与教训列表。反思正文默认展开，超过 4 行或 220 字时折叠为 4 行并给出「展开全文」。
- **教训榜**：按出现次数排序，同次数按最近出现时间排序，并在每条上显示最近一次出现（今天 / 昨天 / N 天前；统计缺失时按当前页现算并注明「本页内最近」）；并列名次不加奖牌色；次数不代表重要度。出现 ≥3 次的教训标「桥接候选」，旁边一行说明「是否写入 AGENTS.md 由 dream_bridge 决定」；次数为 1 的教训不显示进度或 KPI。统计前会去掉每条教训的首尾空白并按全小写合并（原样保留最早出现的写法）；同一场梦里把同一条教训写两遍会算两次；措辞不同（含标点、全角半角差异）的教训不会自动合并。账本最多显示前 10 条，这也是 dream_bridge 默认写入 AGENTS.md 的条数。
- **搜索**：按关键词过滤，命中反思与教训，不区分大小写。心境分布与教训榜基于**全量日记**，时间线按搜索与条数上限（默认最近 50 场）展示。
- **筛选与更早的梦**：≥8 场时出现「筛选 ▾」（按心境、只看有教训的梦，作用于已加载窗口并在弹层注明）；加载满 50 场且总梦数更多时，页脚提供「显示更早的梦」，点击后一次拉满到 500 场（路由上限）。
- **只读**：面板只从插件自己的 GET /_dsh/dsh-dream/journal 读取数据（仅回环地址可达；非 GET → 405，非本机 Host → 403），没有任何写操作。记梦、翻梦、忆梦仍在对话里通过 dream_save / dream_journal / dream_recall 完成，面板不会修改你的日记文件。
- **数据文件**：面板读的就是梦境日记本身，默认 ~/.dsh/.dsh-dream/dreams.jsonl（$DSH_HOME/.dsh-dream/dreams.jsonl；配置了 journalDir 时以配置为准）。存储格式不变，仍是每行一条 JSON 的 JSONL，可直接删除或用 dream_journal 读取。
- **隐私**：面板不做二次脱敏——脱敏只发生在入梦写盘时（maskSecrets），面板原样显示文件里已有的内容。它不上传、不导出、不发起任何网络请求；顶部「隐私模式」可一键模糊正文与教训，但它只是浏览器里的显示效果（DOM 中仍是明文），不是加密。共享屏幕或转发 dreams.jsonl 前请自行确认内容。
- **还没有梦时**：面板显示空态，提示对 agent 说「做个梦」——它会回放最近的会话、反思之后把第一条梦写进这里；只有一场梦时按单条卡片展示，心境方块与教训榜都不留空、不画失真图表。
- **后续计划**：用 sidecar 记录桥接状态（哪些教训、何时写进了哪个 AGENTS.md）。本轮不做——v1 不读取 AGENTS.md，也不新增任何状态文件。

## 工具一览

| 工具 | 作用 | 关键参数 |
| :-- | :-- | :-- |
| `dream_digest` | 入梦：回放最近会话（标题/轮数/用户原话/助手结论/工具足迹），自动跳过子代理，还原官方打包行流式文本 | `maxSessions` 可选；`mode`: full/brief |
| `dream_save` | 记梦：反思 + 1-5 条教训 + 心境，永久保存 | `reflection` 必填；`lessons`/`mood` 可选 |
| `dream_journal` | 翻梦：倒序列出历史梦境 | `limit` 可选 |
| `dream_recall` | 忆梦：关键词检索梦境 | `query` 必填 |
| `dream_bridge` | 渡梦：把高频教训幂等合并进 AGENTS.md，梦变成长期记忆 | `path` 必填；`maxLessons` 可选 |
| `dream_health` | 自检：会话目录/梦境计数/配置汇总 | 无 |

### 示例

```text
dream_digest { maxSessions: 5, mode: 'brief' }
dream_save { reflection: "用户反复遇到输入法问题，偏好先自查再重启", lessons: ["先问是否重启过应用"], mood: "平静" }
dream_recall { query: "输入法" }
dream_bridge { path: "AGENTS.md", maxLessons: 10 }
```

## 渡梦：让梦变成长期记忆

`dream_bridge` 把梦境日记里出现频次最高的教训合并进目标 `AGENTS.md`：带 `<!-- dsh-dream:lessons:start/end -->` 标记块，重复执行只刷新块内内容（幂等），反复梦到的教训会标注次数。`dream_journal` 同时给出心境分布与最常梦到的教训统计。

## 做梦协议（随包技能）

插件附带 `dream-protocol` 技能，教 agent 何时做梦（开场/收尾/距上次做梦超一天）、做梦三步（入梦→解梦→记梦）与记梦纪律（只沉淀规律不复述流水账、密钥隐私不入梦、存疑要标注）。

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

梦原料入梦前自动脱敏：sk 密钥、GitHub/Groq/Slack 令牌、AWS 密钥、JWT、`password/token/api_key` 赋值、超长高熵串都会被打成 `[已脱敏·类型]`。不需要时可在配置里设 `maskSecrets: false`。

## 权限与数据

- 只读访问会话目录（`~/.dsh/sessions`），不修改任何会话文件；
- 梦境日记以 JSONL 追加写入 `journalDir`；
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
