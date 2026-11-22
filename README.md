**简体中文** · [English](README.en.md)

# Dream

**DeepSeek Harness 原生任务经验记忆插件：让 DSH 把做过的任务，变成下次用得上的经验。**

适配 DeepSeek Harness `>=0.2.2-rc.3`，提供全新的**「叠卡」触感分拣工作台（Tactile Triage Deck）**、一键切换经典「列表」视图、**13 套明亮/柔和工作台风格**、**8 套中英双层字体（默认「幼圆等宽」，跨插件自动同步）**、命令面板快速切换、8 种界面语言及柔和岩板深色模式。

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
- **「叠卡」触感分拣工作台**：默认以 3 层实体叠卡逐张审阅候选经验——右拖采纳 / 左拖丢弃（带实时印章与回弹）、`Space` 3D 翻面核对原文证据与密钥脱敏槽位、悬浮操作坞（`D`/`Space`/`K·J`/`A`/`展开完整详情`）与 Inbox Zero 进度条，并支持 1 键切回经典「列表」分栏与批量审阅。
- 核对原文、适用范围、条件与例外，再决定采纳或写入 `AGENTS.md`，在相关任务中自动回用并保留来源记录与写入审计。
- 内置 **13 套明亮/柔和工作台风格**（原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 掌机 / 晴空薄荷 / 晴昼琉璃 / 护眼墨水屏 / 工程晒图 / 波普孔版 / 千禧复古 / 宋韵朱砂 / 晴空水晶 / 铅字晨报）与 **8 套中英双层字体（默认「幼圆等宽」）**，适配 DSH `>=0.2.2-rc.3` 宿主控件、弹层样式同步与窗口留白。

## 看看怎么用

[![在 Dream 叠卡工作台拖拽分拣、3D 翻面核对原文证据、切换风格与字体并确认采纳](docs/assets/intro/screen-zh.webp)](docs/assets/intro/screen-zh.webp)

*截图来自 Harness Web `0.2.2-rc.3` 中运行的 `Dream 0.19.0`（「叠卡」触感分拣工作台 + 默认「幼圆等宽」字体）。拖动卡片或用底部悬浮操作坞分拣，按 `Space` 3D 翻面核对证据，右上角点 `? 引导` 可交互式走完新手流程。*

## 安装

在 DSH 桌面版「插件」面板安装 `@stardustlc/dsh-dream`。已配置命令行时也可使用：

```bash
dsh plugin --profile desktop add @stardustlc/dsh-dream
```

网页版把 `desktop` 改为 `web`；安装后重启对应的 DSH。宿主要求以包声明 `>=0.2.2-rc.3` 为准。

## 开始使用

推荐按 **「积累 → 做梦提炼 → 叠卡分拣入库 → 自动召回」** 的顺手节奏使用（首次打开可点顶栏 **`? 引导`** 跟随聚光灯交互上手）：

1. **日常积累**：从左侧栏打开「Dream 记忆」，在「待审阅」顶部条按需开启「自动整理」与「自动取回」。平时照常在 DSH 排障、改代码、跑测试，空闲时会自动把符合条件的经验线索收进「待审阅」，顶部实时展示 **Inbox Zero 分拣进度**。
2. **做梦提炼**：想主动复盘时，点顶栏「立即整理」处理待整理轮次，或点空态 / `? 引导` 里的一键复制按钮，把指令粘贴到对话发送，让助手回放最近会话、写下反思日记并提炼带来源的候选经验。
3. **叠卡分拣入库（默认「叠卡」，1 键切回「列表」）**：
   - **拖拽手势**：按住最上方候选卡片向右拖采纳、向左拖丢弃（未达阈值松手自动回弹）。
   - **3D 翻面查证据**：按 `Space` 或点「↻ 翻面看证据」3D 翻到背面，核对会话原文出处、适用范围、例外与密钥脱敏预览，并可打开「审阅变更预览 / 修订对比」。
   - **悬浮操作坞**：使用底部胶囊坞点击或快捷键操作（`D` 丢弃、`Space` 翻面、`K`/`J` 上下切卡、`A` 确认采纳），遇到冲突或全局经验可点「展开完整详情」处理；顶部「叠卡 / 列表」分段开关随时 1 键切回经典双栏列表与批量审阅。
4. **召回、沉淀与个性化外观**：后续相关任务会自动取回「已采纳」中的匹配经验作为参考；对长期稳定的项目规范，可先预览差异再写入 `AGENTS.md`，并随时在「规则记录」中一键回滚。顶栏支持实时切换 **13 套明亮风格**与 **8 套中英双层字体（`字`，默认「幼圆等宽」）**，跨所有插件自动同步；也可在「设置」调整预算与 8 种界面语言。

常用对话指令（面板内支持一键复制）：

- `做个梦` —— 回放最近会话，生成一篇独立的梦境反思日记。
- `复盘最近的对话并提炼可复用的项目经验` —— 提取带证据与适用范围的经验候选，送入「待审阅」队列。

## 开始前要知道

候选不会自动采纳。自动整理会使用当前会话模型和额度，两个自动开关可分别控制。

配置、完整工具与排错见[详细使用说明](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.zh.md)。

## 反向代理部署

面板路由默认只认回环来源与本机 Host，所以浏览器经反向代理访问时会得到 403。两项白名单默认空，配置后才放行，且只做精确匹配：

```yaml
# cordis.patch.yml 中本插件的 config
trustedRemoteAddresses: ['192.0.2.10']         # 示例地址，替换为反代自己的来源地址
trustedHosts: ['dsh.example.com']               # 浏览器地址栏里的域名（反代没改写 Host 时才需要）
```

也可用环境变量 `DSH_DREAM_TRUSTED_REMOTE_ADDRESSES` / `DSH_DREAM_TRUSTED_HOSTS`（逗号分隔），配置项优先。两项是「且」关系：只配来源、而反代又不改写 Host 时，仍会因 Host 不是本机名被拒——按 403 的提示补上第二项即可。被列入来源白名单的地址不再受回环限制，因此只该填反代自己的地址，并确保前面还有一层身份验证。

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
