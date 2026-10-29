# dsh-dream

[English](README.en.md)

![dsh-dream 鲸鱼娘插件封面](https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/assets/cover-whale-girl.png)

把完成任务中的经历整理成候选经验，供用户审阅、采纳后在相关任务中回用。支持自动整理、按需召回、来源核查、适用范围与手动复盘；候选内容不会自动变成已采纳记忆。

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-total-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

[下载统计说明](https://github.com/STARDUSTLC666/dsh-suite/blob/npm-downloads/README.md)

欢迎使用，遇到问题或有改进建议，请提交 [issues](https://github.com/STARDUSTLC666/dsh-dream/issues) 和 [PR](https://github.com/STARDUSTLC666/dsh-dream/pulls)。

从 DSH 原生侧栏打开工作台；配置与操作边界见[工作台说明](docs/WORKBENCH.md)。

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

1. 从左侧栏打开“Dream 记忆”，按需要选择自动整理与自动取回。
2. 正常完成实际任务；符合整理条件后查看“待审阅”，也可明确让助手复盘这次任务。
3. 展开候选，核对来源、适用范围、条件和例外，再由你决定采纳或保留待审阅。
4. 后续相关任务取回已确认经验作为参考；需要时在“已采纳”中修改、撤回或安排复核。

自动整理使用当前会话的模型和额度，默认安静 60 秒后开始，同项目最多合并 4 轮，每天最多 4 次、间隔 10 分钟，单次最多 1200 输出 token。冷却和额度不足时轮次进入等待队列；新输入会暂停整理并保留未完成片段。队列最多保留 32 轮、24 小时，重启后可继续。普通闲聊跳过。

新经验始终先待审阅：展开核对原话、条件与例外，再采纳。事实默认 30 天后待复核；稳定偏好没有默认到期时间。取回只表示提供参考，不会冒充重新核验。它不自动采纳，也不写项目规则；规则写入仍需预览和应用。中英文界面跟随 DSH 语言，日记与经验正文保留原文。

只有你在面板确认采纳的经验才会自动复用。模型调用 `dream_review accept` 仅表示建议采纳，状态保持待审阅；旧的模型采纳记录需要你重新确认。全局经验会用于所有项目，单条或批量采纳前需勾选范围确认。`dream_bridge` 默认只读预览，不再把旧日记直接写成项目规则。

## 依赖与配置

默认使用本机 DSH 会话与日记目录，支持隐私脱敏。自动功能通过官方会话事件和动态上下文接口接入；操作面板使用认证 Connection 通道。已验证 0.2.0-rc.2 与 0.2.1-alpha.1；缺少自动接口的宿主保留工具与技能入口。

详细配置、工具参数与排错见[使用说明](docs/USAGE.md)。从源码独立开发时，Node 要求以 [package.json](package.json) 为准。

## 文档

- [使用与排错](docs/USAGE.md)
- [更新记录](CHANGELOG.md)
- [验证范围与历史记录](docs/VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-dream/issues)

## 插件更新

需要 DSH 0.2.1-rc.3 或更新版本。更新控件直接位于原有工作台内容末尾；没有工作台的插件，位于原生插件详情页底部。检查、更新记录和偏好在原地展开，不增加独立更新页面或设置菜单。自动检查默认开启；**自动安装默认关闭**，明确授权后才会在空闲且没有未保存修改时安装兼容的稳定补丁。开关按插件独立保存，可关闭、推迟或忽略提醒；不会强制重启 DSH、升级 DSH 本体或替换本地源码安装。Suite 组件在当前页面底部明确说明并操作 Suite 整包更新。

旧版用户先在官方插件管理中手动更新一次，之后才会获得此入口。发布到 npm 不会直接替换用户已经安装的版本。

## License

[MIT](LICENSE)
