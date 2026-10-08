# dsh-dream

[English](README.en.md)

![dsh-dream 鲸鱼娘插件封面](https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/assets/cover-whale-girl.png)

自动整理任务中的候选经验，审阅后在相关任务中回用；也可手动复盘并保存梦境日记。

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

欢迎使用，遇到问题或有改进建议，请提交 [issues](https://github.com/STARDUSTLC666/dsh-dream/issues) 和 [PR](https://github.com/STARDUSTLC666/dsh-dream/pulls)。

## 功能

- 浏览梦境日记、检索经验并查看关联来源。
- 完成任务后自动提取候选，相关新任务自动取回已采纳经验；两个开关独立控制。
- 安静后合并整理，冷却和额度不足时保留待处理轮次；可分别控制每个聊天的使用与贡献。
- 直接审阅、处理冲突，记录独立的使用反馈。
- 按项目和主题批量审阅，事实到期暂停回用，复核后恢复。
- 预览规则差异后写入 AGENTS.md，并支持回滚。

## 安装

桌面版可在「插件」面板按包名 `@stardustlc/dsh-dream` 安装。已配置 dsh 命令时也可使用：

```bash
dsh plugin --profile desktop add @stardustlc/dsh-dream
```

网页版把命令中的 `desktop` 改为 `web`。安装后重启 DSH。

## 开始使用

正常使用 DSH 即可：完成的一轮任务出现明确偏好、纠正，或至少两次非 Dream 工具调用时，会在预算内整理候选。在「设置 → 梦境日记」查看待审阅提示，核对来源后采纳；后续相关任务自动回用。也可说：“回顾最近的任务，记录值得保留的经验。”单独生成日记。

自动整理使用当前会话的模型和额度，默认安静 60 秒后开始，同项目最多合并 4 轮，每天最多 4 次、间隔 10 分钟，单次最多 1200 输出 token。冷却和额度不足时轮次进入等待队列；新输入会暂停整理并保留未完成片段。队列最多保留 32 轮、24 小时，重启后可继续。普通闲聊跳过。

新经验始终先待审阅：展开核对原话、条件与例外，再采纳。事实默认 30 天后待复核；稳定偏好没有默认到期时间。取回只表示提供参考，不会冒充重新核验。它不自动采纳，也不写项目规则；规则写入仍需预览和应用。中英文界面跟随 DSH 语言，日记与经验正文保留原文。

## 依赖与配置

默认使用本机 DSH 会话与日记目录，支持隐私脱敏。自动功能通过官方会话事件和动态上下文接口接入；操作面板使用认证 Connection 通道。已验证 0.2.0-rc.2 与 0.2.1-alpha.1；缺少自动接口的宿主保留工具与技能入口。

详细配置、工具参数与排错见[使用说明](docs/USAGE.md)。从源码独立开发时，Node 要求以 [package.json](package.json) 为准。

## 文档

- [使用与排错](docs/USAGE.md)
- [更新记录](CHANGELOG.md)
- [验证范围与历史记录](docs/VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-dream/issues)

## License

[MIT](LICENSE)
