[English](README.en.md)

# dsh-dream

> **会做梦的 agent**：会话回放（梦原料）→ 反思（解梦）→ 梦境日记（记忆巩固）。

![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream) ![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-dream) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-dream?style=social)

人睡觉时大脑回放白天的经历、巩固记忆——dsh-dream 让 DeepSeek Harness 的 agent 也拥有这个能力：读取你的历史会话（官方多帧 zstd 会话日志，零依赖解析），提炼梦原料，反思后写入永久梦境日记，下次醒来可以忆梦。

## 兼容性

在 `@deepseek-ai/dsh@0.1.2-alpha.2` 上验证（2026-08-31）。遵循 cordis 组合包补丁模型（`cordis.patch.yml` + `dsh.bundle.patch`），运行时不 import 任何 `@deepseek-ai/*` 内部模块。会话读取兼容官方 JSONL-zstd 多帧格式与 packed-chunk 行（只取所需事件类型，布局无关）。

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
pnpm test       # 构建 + 48 个测试（多帧 zstd 夹具、打包行解码、隐私脱敏、梦境日记往返、记忆桥接幂等、统计、六工具、注册生命周期）
```

## License

MIT（见 [LICENSE](LICENSE)）
