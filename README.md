# dsh-dream

[English](README.en.md)

回顾会话、保存反思，并把经过核验和审阅的经验用于后续任务。

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

## 功能

- 浏览梦境日记、检索经验并查看关联来源。
- 直接审阅、处理冲突，记录独立的使用反馈。
- 预览规则差异后写入 AGENTS.md，并支持回滚。

## 安装

桌面版可在「插件」面板按包名 `@stardustlc/dsh-dream` 安装。已配置 dsh 命令时也可使用：

```bash
dsh plugin --profile desktop add @stardustlc/dsh-dream
```

网页版把命令中的 `desktop` 改为 `web`。安装后重启 DSH。

## 开始使用

可说：“回顾最近的任务，记录值得保留的经验。”在「设置 → 梦境日记」查看来源、审阅经验；规则写入先预览再应用。

## 依赖与配置

默认使用本机 DSH 会话与日记目录，支持隐私脱敏。操作面板使用 DSH 0.2.0-rc.2 的认证通道；工具与技能也可用于 headless。

详细配置、工具参数与排错见[使用说明](docs/USAGE.md)。从源码独立开发时，Node 要求以 [package.json](package.json) 为准。

## 文档

- [使用与排错](docs/USAGE.md)
- [更新记录](CHANGELOG.md)
- [验证范围与历史记录](docs/VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-dream/issues)

## License

[MIT](LICENSE)
