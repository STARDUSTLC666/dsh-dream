**简体中文** · [English](README.en.md)

# Dream

**让 DSH 把做过的任务，变成下次用得上的经验。**

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-total-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

**[安装使用](#安装) · [使用流程](#开始使用) · [完整说明](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.zh.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-zh-light.svg" alt="让 DSH 把做过的任务，变成下次用得上的经验。 · 流程示意" width="100%">
</picture>

## 功能

- 实际任务结束后，按开关与额度整理候选经验。
- 核对原文、适用范围、条件与例外，再决定采纳。
- 在相关任务中回用已确认经验，并保留来源。

## 看看怎么用

![Dream review steps](https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/review-steps.gif)

使用验证环境真实截图制作的步骤轮播：核对待审阅候选，再查看已采纳列表。演示人工审阅流程，不是连续录屏或效果基准。

## 安装

在 DSH 桌面版「插件」面板安装 `@stardustlc/dsh-dream`。已配置命令行时也可使用：

```bash
dsh plugin --profile desktop add @stardustlc/dsh-dream
```

网页版把 `desktop` 改为 `web`；安装后重启对应的 DSH。宿主要求以包声明 `>=0.2.1-rc.3` 为准。

## 开始使用

1. 从左侧栏打开“Dream 记忆”，按需要选择自动整理与自动取回。
2. 正常完成实际任务；符合整理条件后查看“待审阅”，也可明确让助手复盘这次任务。
3. 展开候选，核对来源、适用范围、条件和例外，再由你决定采纳或保留待审阅。
4. 后续相关任务取回已确认经验作为参考；需要时在“已采纳”中修改、撤回或安排复核。

可以这样说：

> 复盘刚才的任务，整理可复用经验并保留来源，先放到待审阅。

## 开始前要知道

候选不会自动采纳。自动整理会使用当前会话模型和额度，两个自动开关可分别控制。

配置、完整工具与排错见[详细使用说明](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.zh.md)。

## 插件更新

在工作台或原生插件详情页底部检查更新。默认自动检查，**默认不自动安装**；是否安装、何时重启由你决定。Suite 管理的组件随整包更新。[查看更新规则](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.zh.md)。

## 文档

- [详细使用、配置与边界](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.zh.md)
- [更新记录](https://github.com/STARDUSTLC666/dsh-dream/blob/master/CHANGELOG.md)
- [验证范围与历史](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/VALIDATION.md)

## 反馈与贡献

如果插件帮到了你，欢迎 Star，让更多人发现它。问题和建议请提交 [Issues](https://github.com/STARDUSTLC666/dsh-dream/issues)，也欢迎代码与文档 [PR](https://github.com/STARDUSTLC666/dsh-dream/pulls)。反馈时附上版本与复现步骤，并移除凭据。

## License

[MIT](https://github.com/STARDUSTLC666/dsh-dream/blob/master/LICENSE)

<a id="依赖与配置"></a>
