# 更新记录

## 0.19.2 (2026-11-23)

- 修复已连接 DSH 时经验、日记和规则写入记录仍返回 403 的问题。工作台通过宿主已鉴权的连接读取，沿用只读、访问范围和脱敏规则。
- Restore access to lessons, journal and rule-write history in a connected DSH workbench. Reads use the authenticated host connection and retain read-only access, host checks and redaction.

## 0.19.1 (2026-11-23)

- 加固认证操作路由守卫：对精确桌面来源 `Origin: dsh-app://app` 放行 `Sec-Fetch-Site` 校验，并拒绝 `Origin: null` 与非 `http(s):` 伪造来源。
- 同步更新 `package.json` 简介（13 套明亮风格 × 8 套双层字体、8 种语言与叠卡分拣工作台）及全套中英文文档：补充 `enableVerificationGate`、`/dream` `/dream-learn` `/dream-status` 原生斜杠命令、`dream_learn`/`dream_context` SIM 参数、全部 18 项配置键与 DSH `>=0.2.2-rc.3` 宿主基线。
- Harden the authenticated actions route guard to exempt exact `Origin: dsh-app://app` from `Sec-Fetch-Site` checks while rejecting opaque `null` and non-`http(s):` origins.
- Update `package.json` description (13 styles × 8 fonts, 8 locales, Tactile Triage Deck) and align bilingual README/USAGE/REFERENCE/WORKBENCH docs with `enableVerificationGate`, native slash commands (`/dream`, `/dream-learn`, `/dream-status`), SIM tool parameters, all 18 config keys, and the `>=0.2.2-rc.3` host baseline.

## 0.19.0 (2026-11-22)

- **全新「待审阅叠卡（Tactile Triage Deck）」默认工作台**：待审阅面板默认以实体卡片叠堆与顶部 Inbox Zero 进度带呈现候选经验，支持直接右拖采纳 / 左拖丢弃、`Space` 3D 翻面核查来源证据与 `rationale`/`files`/`prevents` 元信息、以及底部悬浮操作坞（`丢弃 (D)` / `翻面 (Space)` / `上一张 · 下一张` / `确认采纳 (A)` / `展开完整详情`）；顶栏提供 `叠卡 / 列表` 一键切换，可随时切回经典三栏列表视图；优化英文宽标签下顶栏选项卡自适应排版，避免窄面板重叠。
- **更新 5 步 `? 引导`（Coachmark Tour）与文档配图**：5 步聚光灯引导完整覆盖「叠卡/列表切换与待分拣进度带」「拖拽手势与 `Space` 3D 翻面查证据」「底部悬浮操作坞」「13 套浅色风格 × 8 套双层中英文字体（默认幼圆等宽）」「自动整理/已采纳/设置」并补齐 8 种界面语言；同步更新 `README`、`USAGE`、`WORKBENCH` 文档、中英工作流示意图与最新界面截图。
- **Bespoke Tactile Triage Deck (`叠卡`) Default Workbench**: The Awaiting Review workspace now opens in a tactile stacked card deck paired with an Inbox Zero triage ribbon—drag right to accept, drag left to discard, press `Space` (or click **Flip for evidence**) for a 3D flip showing source evidence and SIM provenance, or use the floating action dock (`Discard (D)` / `Flip (Space)` / `Prev · Next` / `Accept (A)` / `Full details`). Switch back to the classic 3-pane list view in one click via `Deck / List`. Also improves English header tab sizing and responsive wrapping so labels never overlap at compact widths.
- **Refreshed 5-Step `? Tour` & Docs**: Updated the 5-step spotlight tour anchors across all 8 UI locales for the Tactile Triage Deck workflow (`Deck / List` & Inbox Zero ribbon, drag & `Space` 3D evidence flip, Floating Action Dock, 13 light themes × 8 dual-layer font pairings defaulting to YouYuan Mono, and Auto-collect/Accepted/Settings), alongside updated bilingual docs, workflow diagrams, and UI screenshots.

## 0.18.0 (2026-11-22)

- **DeepSeek Harness `0.2.2-rc.3` 深度原生适配**：
  - 修复 `systemPrompt.context` 注册遗漏 `interpolate: false` 导致含 `{{...}}`（如 GitHub Actions `${{ ... }}`、Jinja、Handlebars）的已采纳经验在组装时崩溃的现网问题，并按 Cordis 4 严格注入规范独立挂载全部可选服务。
  - 接入 `workingDirectory` 与 `workspaceRegistry`（会话内 `cd` 动态追踪与规范 `workspaceId` 匹配）、`workspaceChanges` + `tools/result` 文件作用域召回与自动填充 `files`、以及 `sessionLogDeepSeek` 后台辅助请求排除钩子。
  - 接入原生反馈与运行时信号归因（`feedback/message-put`、`feedback/committed`、`feedback/record`、`repeat-tool-reminder`），观测计数持久化至 `automatic/state.json` 并提示建议复核，**严格保持人工审阅边界不变**（绝不自动采纳或修改 `AGENTS.md`）。
  - 接入实时优先 `sessionQuery` 桥接（无缝回退磁盘 zstd/JSONL 读取）、原生 `/` 斜杠命令（`/dream`、`/dream-learn`、`/dream-status`），以及默认关闭的 Opt-In 完成前单次软门控（`agent/turn-stopping` Verification Gate，仅在有文件修改的轮次最多提醒 1 次）。
- **Self-Improvement Memory（SIM / CRSI）记忆与治理引擎升级**：
  - 经验与证据新增可选结构化字段：`rationale`（根因理由）、`files`（工作区相对路径）、`prevents`（预期预防失败签名）、`problemKey`（问题聚类键）、`carriedFrom`（迁移溯源）与模型来源 `origin`（`provider` / `model` / `agentPreset`）；召回时自动检测跨模型偏移（`originModel` / `modelMismatch`）。
  - 自动整理新增优化器目录 `simDirectory`（含已采纳规则与近期驳回/过期负向记忆，预算紧时优雅裁剪），支持同指纹字段补全与 `supersedes` 演化链关联；检索升级为零依赖纯内存 BM25/IDF（稀缺技术词优先、文件命中加权，严格保持 `rankInversionCount === 0`）。
  - `AGENTS.md` 桥接引入源规则保活（Source Retention）与 `semanticDiff`（`retained` / `added` / `revised` / `evicted`）语义变更摘要；工作台面板、桥接预览弹窗与设置页同步升级并补齐全部 8 种界面语言。
- **Deep DeepSeek Harness `0.2.2-rc.3` Native Integration**:
  - Fix the live `systemPrompt.context` template interpolation crash by explicitly setting `interpolate: false` (preserving literal `{{...}}` / `${{ ... }}` lesson text), and isolate all optional service bindings for Cordis 4 strict-inject compatibility.
  - Integrate `workingDirectory` + `workspaceRegistry` (mid-session `cd` tracking & canonical `workspaceId`), `workspaceChanges` + `tools/result` file-scoped recall, `sessionLogDeepSeek` auxiliary log upload exclusion, native feedback & signal attribution (`feedback/message-put`, `feedback/committed`, `feedback/record`, `repeat-tool-reminder`) strictly preserving the human-review boundary, live-preferred `sessionQuery` bridge with seamless disk fallback, native slash commands (`/dream`, `/dream-learn`, `/dream-status`), and an opt-in `agent/turn-stopping` Verification Gate (off by default, max 1 notice per file-modifying turn).
- **Self-Improvement Memory (SIM / CRSI) Engine & Workbench Updates**:
  - Add optional forward-compatible SIM fields (`rationale`, `files`, `prevents`, `problemKey`, `carriedFrom`, model provenance `origin`) and cross-model mismatch hints (`originModel` / `modelMismatch`), optimizer `simDirectory` with negative memory and tight-budget trimming, zero-dependency in-memory BM25/IDF retrieval (`rankInversionCount === 0`), `AGENTS.md` Bridge Source Retention + `semanticDiff` previews, and full 8-locale Workbench UI updates.

## 0.17.6 (2026-11-20)

- 兼容官方宿主 session.header.cwd，使工作区内产物证据能正确核验与召回。

- 升级共享更新组件至 0.2.10，移除跨插件右下角浮动提醒，保留工作台及插件详情页更新控制。

- 检索和知识面板在单次请求内复用证据索引，避免每条记录重复重建完整 Map，保持原摘要 API 与结果语义。

## 0.17.5 (2026-11-20)

- 修复进程中断留下 JSONL 半行后，下一条已确认保存的经验更新、证据或日记被拼入坏行而在重放时丢失的问题；保留损坏原文与既有数据格式。
- Isolate interrupted JSONL tails before appending new knowledge events, evidence or journal entries so confirmed saves survive replay without rewriting existing bytes.
- 同步共享更新组件 0.2.9，修复取消窗口和失败响应清理，并确保运行中旧协调器在空闲后接管修复。

## 0.17.4 (2026-11-20)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.7`：对话页「有新版本」提醒浮卡支持无交互 15 秒自动收起（悬停、聚焦、查看记录或确认弹窗时自动暂停，安装成功提示 6 秒收起，安装中/失败/需要重启仍保持常驻不隐藏）。
- Upgrade `@stardustlc/dsh-updates` to `0.2.7`: auto-dismiss idle update reminder cards after 15s and silent complete cards after 6s while pausing on hover/focus/notes/dialogs and keeping active, failed, or restart-required cards pinned.

## 0.17.3 (2026-11-20)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.6`：端到端验收修复浮卡与日历按钮重叠、详情页/工作台挂载时瞬时让位及 `package-moved` / 包管理器报错诊断文案，继续保持过期检查自动刷新与 `bundle-in-use` 指导。
- Upgrade `@stardustlc/dsh-updates` to `0.2.6`: E2E-verified fixes for floating Calendar FAB clearance, immediate reminder yield on native detail/workbench mount, and clearer `package-moved` / package-manager error messages, alongside auto-refresh and `bundle-in-use` guidance.

## 0.17.2 (2026-11-20)

- 在备用弹窗中，子菜单优先处理 Escape，避免误关外层表单。
- Let nested controls consume Escape before closing a fallback dialog.
- 旧日记、知识和桥接路由先执行 DSH 鉴权。

## 0.17.1 (2026-11-19)

- 修复首次未找到宿主控件后永久使用 fallback 的缓存问题；支持同一加载器下宿主迟到、卸载、替换与重载。
- Refresh cached controls when the host becomes available, unloads or is replaced.

## 0.17.0 (2026-11-18)

- **工作台 UI v3：13 套明亮风格 × 8 套双层中英文字体搭配（默认 `幼圆等宽 / YouYuan Mono`）**：
  - 扩展至 **13 套明亮工作台预设**（含 `晴昼琉璃 / Glass`、`护眼墨水屏 / E-Ink`、`工程晒图 / Blueprint`、`波普孔版 / Riso Zine`、`千禧复古 / Retro 98`、`宋韵朱砂 / Song Xuan`、`晴空水晶 / Aqua Gloss`、`铅字晨报 / Gazette`），统一 48px 单行顶栏、可拖拽三栏/双栏分隔条（`DshSplitResizer`）、滑动 Tab 指示器、骨架屏加载、行悬停快捷操作（快速采纳/复制/查看）与安全转义的引导聚光灯选择器。
  - 新增独立 `FontSwitcher`（`字` / `Aa`）与命令面板字体切换指令，支持 8 套双层中英文排版（默认 `arcade` 幼圆等宽 + `auto` 跟随风格专属字 / `songkai` / `fangsong` / `poster` / `retro98` / `serif` / `modern`）并跨插件与弹窗同步。
- **Workbench UI v3: 13 Bright Presets × 8 Dual-Layer Chinese/Latin Font Pairings (default `arcade` YouYuan Mono)**:
  - Expand the theme system to **13 bright daylight presets** (including `glass`, `eink`, `blueprint`, `risograph`, `win98`, `songhui`, `frutiger`, and `gazette`) with a unified 48px single-row header, resizable split pane (`DshSplitResizer`), sliding tab indicator, shimmer skeletons, row hover quick actions, and colon-safe `React.useId()` tour target querying.
  - Add standalone `FontSwitcher` (`字` / `Aa`) and Command Palette font actions supporting 8 Windows-verified Chinese/Latin font pairings (`arcade` YouYuan Mono default, `auto` match-style, `songkai`, `fangsong`, `poster`, `retro98`, `serif`, `modern`), synced across workbenches and portaled overlays.

## 0.16.7 (2026-11-18)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.5`：独立安装插件详情页底栏去重（保留组合包组件委派与对话页热更新卡片），补齐 `bundle-in-use` 组合包占用提示说明，并在检查结果过期或远端版本变更时自动刷新元数据，彻底消除 `check-first` 卡顿。
- Upgrade `@stardustlc/dsh-updates` to `0.2.5`: deduplicate standalone native plugin detail footers while keeping Suite delegation and in-chat reminder cards, surface clear `bundle-in-use` guidance, and automatically refresh expired update checks without `check-first` stalls.

## 0.16.6 (2026-11-18)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.4`：对话页新增一键热更新提醒卡片，自动检查周期缩短至 6 小时，手动热更新后可顺手开启包含兼容功能小版本的空闲自动更新。
- Upgrade `@stardustlc/dsh-updates` to `0.2.4`: add an actionable in-chat hot-update reminder card, 6-hour background update checks, compatible minor+patch idle auto-updates, and a post-update opt-in prompt.

## 0.16.5 (2026-11-18)

- **交互式聚光灯 + 自动转向箭头分步引导（Coachmark Tour）**：顶栏新增 `? 引导` 按钮，首次进入工作台温和引导一次（跳过或完成后写入 `localStorage` 永久不再打扰），支持真实按钮聚光灯高亮、视口边缘自动翻转小箭头、键盘 `←`/`→`/`Esc` 导航与气泡内一键复制对话指令；移除占高度的静态折叠流程说明框。
- **Interactive Spotlight + Directional Arrow Coachmark Tour**: add a header **? Tour** trigger with one-time non-intrusive first-visit onboarding (`localStorage` persisted), live target spotlighting, auto-flipping directional arrows, keyboard `←`/`→`/`Esc` navigation, and inline 1-click prompt copy, replacing the static collapsible workflow box.

## 0.16.4 (2026-11-18)

- 同步 `@stardustlc/dsh-updates` 0.2.3：侧边栏工作台平时默认隐藏底部更新栏（零高度占用），仅在检测到兼容新版本或执行更新时浮现单行精简提示条；完整更新设置与检查入口统一保留在 DSH「插件」详情页底部。
- Sync `@stardustlc/dsh-updates` 0.2.3: keep the sidebar workbench update footer hidden by default when up-to-date, surfacing a single-line compact strip only for actionable updates or active jobs while retaining full controls in native Plugin Details.

## 0.16.3 (2026-11-18)

- 优化「待审阅」与「梦境日记」空状态交互：补齐通俗经验提炼说明、跳转「设置 / 已采纳」快捷按钮与一键复制「做个梦 / 复盘提炼经验」指令按钮，并新增覆盖 8 种界面语言的可折叠三步记忆工作流指引。
- Upgrade Review and Dream Journal empty states with clear onboarding context, quick jumps to Settings and Accepted memories, interactive 1-click prompt copy buttons, and an 8-locale collapsible 3-step workflow guide.

## 0.16.2 (2026-11-18)

- 更新区底部新增克制、无打扰的 GitHub 点赞与问题反馈快捷链接，并完善中英文检索关键词。
- Add subtle, non-intrusive GitHub Star and issue feedback links in the update footer, and expand search keywords.

## 0.16.1 (2026-11-18)

- 同步 `@stardustlc/dsh-updates` 0.2.1：恢复 Suite 整包统一更新（移除独立拆包迁移），保留整包与独立插件的原地热更新与失败自动回滚。
- Sync `@stardustlc/dsh-updates` 0.2.1: restore unified Suite bundle updates (removing standalone conversion) while retaining in-place hot reload and automatic rollback.

## 0.16.0 (2026-11-18)

- 升级 Dream 工作台界面与动效并深度适配 DeepSeek Harness `>=0.2.2-rc.3`：统一 5 套可切换界面风格（原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷，覆盖顶栏、命令面板、设置与 8 种界面语言）并支持跨插件同步，深色模式采用柔和透气岩板色。
- 接入宿主原生控件（延迟按需解析与弹窗/菜单样式同步）、主工作台顶栏与侧栏安全留白、按钮按压与 SVG 小图标微交互动效，以及 Cordis 4 `ctx.effect` 热重载卸载清理。
- Upgrade the Dream workbench UI and motion with deep DeepSeek Harness `>=0.2.2-rc.3` integration: unify five switchable visual themes (`harness`, `cream`, `claude`, `pixel8bit`, `mint`) across the header, command palette, settings, and all eight UI languages, with cross-plugin sync and a soft breathable slate dark mode.
- Wire lazy native host UI primitives with portaled modal/menu style sync, main-view frame clearances, tactile button and SVG icon micro-animations, reduced-motion support, and Cordis 4 `ctx.effect` unload cleanup.

## 0.15.2 (2026-11-17)

- 在工作台单独检查和安装兼容版本。自动安装默认关闭，可为该插件开启空闲时的稳定补丁更新。
- Check and install compatible versions separately from the workbench. Automatic installation is off by default. Enable it for this plugin to apply stable patches while idle.

## 0.15.1 (2026-11-16)

- 将原版 HTML 的顶栏、三栏审阅、四套皮肤和动效直接移植到 Dream 工作台。范围筛选、审阅按钮与核查卡片接入现有数据和宿主控件。
- Port the original HTML workbench layout, four styles and motion into Dream. Scope filters, review actions and verification cards use existing Dream data and native Harness controls.

## 0.15.0 (2026-11-15)

- Dream 工作台改用 DeepSeek Harness 原生控件，提供独立皮肤、三栏审阅、键盘命令面板、脱敏槽位预览和修订对比。
- 新增 Dream 独立的 8 种界面语言选项。规则变更预览使用宿主弹窗，继续走现有的预览、应用与回滚流程。
- Rebuild the Dream workbench with native DeepSeek Harness controls, Dream-only styles, a three-pane review layout, keyboard commands, masked evidence previews and revision comparisons.
- Offer eight Dream interface languages. Show rule diffs in the native modal using the existing preview, apply and rollback workflow.

## 0.14.1 (2026-11-14)

- 适配 DSH 0.2.2-rc.3：最低 Harness 版本声明提升至 0.2.2-rc.3，运行时代码未变。
- Support DSH 0.2.2-rc.3: raise the minimum Harness declaration to 0.2.2-rc.3; runtime code is unchanged.

## 0.14.0 (2026-11-08)

- 反向代理部署：新增 `trustedRemoteAddresses` / `trustedHosts` 两项白名单，默认空、精确匹配（大小写、端口与 IPv4-mapped 前缀归一），可用 `DSH_DREAM_TRUSTED_REMOTE_ADDRESSES` / `DSH_DREAM_TRUSTED_HOSTS` 兜底。默认仍不扩大访问范围，仍只认回环来源与本机 Host。
- Behind a reverse proxy: new `trustedRemoteAddresses` / `trustedHosts` allow-lists — empty by default, exact match, with case/port/IPv4-mapped normalisation and matching env fallbacks. Default access remains local; malformed Host and IP values are rejected.

## 0.13.9 (2026-11-04)

- 同步共享界面：嵌入设置时继承宿主底色，输入框跟随主题，空状态保持可读宽度；新版 DSH 可显示插件设置图标。
- Align embedded surfaces, themed inputs, readable empty states and optional native settings icons.


## 0.13.8 (2026-11-03)

- dream_health 不再假绿：只读检查日记目录可写性，失败项带 hint 与建议；首次使用不误报。
- dream_health no longer reports a false green: it checks journal writability read-only, adds hints and next steps, and does not flag first use.
- 同步共享 workbench-ui v1.1：Page 外的 Empty / Dialog / Status 自带样式与 `.dshw` 主题作用域，Status 新增 warn 色调。
- Sync workbench-ui v1.1: Empty / Dialog / Status now carry their own styles and `.dshw` theme scope outside Page, and Status gains a warn tone.

## 0.13.7 (2026-10-30)

- 重整中英文首页：用途、三步流程图、安装入口与操作示例；详细配置与边界集中到完整说明。
- 保留下载统计、独立更新选择、问题反馈和贡献入口；原封面与运行功能保留。
- Refresh bilingual landing pages, workflow artwork, quick starts and reference navigation.


## 0.13.6 (2026-10-30)

- 原生插件列表与详情新增专门生成的鲸鱼娘图标：大头像、独立功能符号、透明留白，适合 30 / 36 px 显示；原封面保留。
- Add purpose-made whale-girl artwork with a distinct function emblem, transparent padding and small-size readability; preserve the original cover.


[返回简介](README.md) · [使用说明](docs/USAGE.md) · [验证记录](docs/VALIDATION.md)

[历史英文记录](docs/CHANGELOG.en.md)

## 0.13.5 (2026-10-29)

- 补齐中英文使用流程：准备、入口、具体操作与结果核对；新增累计 npm 下载徽章并保留月统计。
- Add practical getting-started workflows and lifetime npm download badges alongside monthly counts.

## 0.13.4 (2026-10-29)

- 同步仓库与 npm 的简明介绍、中英文 README 和反馈入口；本次为文档与包元数据更新。
- Sync npm descriptions and both README guides with the repository, including issue and pull-request links.

## 0.13.3 (2026-10-27)

- 修复分批更新时的新旧更新控件混用：保留原页面、草稿与安装保护，空闲后接管旧控制器，兼容旧入口。

## 0.13.2 (2026-10-27)

- 更新控件移至原有工作台或原生插件详情页底部；更新记录与选项原地展开，移除独立更新菜单与页面。
- 保留原页面操作与草稿，自动安装默认关闭；安装前确认，遇到未保存修改或运行任务时暂停。

## 0.13.1 (2026-10-27)

- Keep this component's own update entry visible when installed transitively through Suite. Confirm whole-Suite update scope before opening its controls.
- Keep automatic installation off by default and preserve independent installation behavior.

## 0.13.0 (2026-10-26)

- Add this plugin’s own update controls and independent preferences. Automatic installation stays off until explicitly enabled.
- Confirm manual installs, preserve local sources and disabled state, pause for tasks or unsaved changes, and use native DSH recovery without forced restarts.
- Require the public DSH 0.2.1-rc.3 update APIs; Suite components remain managed through Suite.

## 0.12.0（2026-10-25）

- Dream 记忆主工作台，待审阅、已采纳、日记和规则记录分区；保留人工采纳与全局范围确认。
- 提供 DSH 原生侧栏入口，保留设置页；统一中英、深浅色、窄屏、键盘焦点与真实空/失败状态。
- 浏览器源码移至 templates/client.js、templates/panels/ 与共享组件，独立构建为 lib/client.js；移除重复的首次引导。
- 官方 DSH 0.2.1-rc.3 Web 逐项实际操作验收，账户模拟和未验收范围见 [工作台说明](docs/WORKBENCH.md)。

## 0.11.0（2026-10-25）

- 修复 #3：模型的采纳与冲突解析只返回待人工确认的建议，不修改经验或伪造用户采纳。自动整理继续保存候选，用户在面板确认后才回用。
- 自动上下文、默认经验检索、短摘要与规则桥接排除旧的模型采纳、未知审阅者和未人工采纳记录；旧数据保留，并在面板重新进入待审阅队列。
- 全局经验在单条、批量采纳及冲突解析时明确确认对所有项目生效，界面提供中英文范围确认。
- 工具结果只保留为出现过的来源，不作为独立支持。`dream_bridge` 省略模式时改为只读预览；移除模型可调用的旧日记直接写入入口。

## 0.10.0（2026-10-17）

- 设置面板顶部新增「首次使用」分步引导：一次只讲一步，支持上一步/下一步/跳过，看完记在本机不再出现。
- 引导内容与该插件的实际用法一致；可在开发者工具里清掉 `dsh-first-run:dsh-dream:v1` 重新查看。
## 0.9.1（2026-10-17）

- **优化：派生索引改为紧凑序列化**。`index.json` 是机器读取的派生数据，去掉缩进后 1000 条经验从 1359KB 降到 926KB（−32%），每次写入少序列化/落盘约三分之一的数据（1000 条实测单次写入 18.2ms → 16.6ms）。
- 读路径不变：checkpoint 的 `snapshot+tail` 校验仍通过（1000 条读回 `replayMode=snapshot+tail`、无截断、无坏行）；`rebuildIndex()` 仍可从事件完整重建。
- **已知限制（未变）**：知识库写入仍是 O(历史)——每次写入都会重写整份派生索引。本版只是降低常数，不改变量级；增量 checkpoint 留待后续版本。
## 0.9.0 (2026-10-05)

- 安静 60 秒后整理，同项目/模型最多合并 4 轮；冷却与每日预算延后轮次，32 轮/24 小时的持久化队列支持重启恢复、取消保留和跨进程租约。
- 每个聊天独立设置「使用记忆」与「贡献记忆」，可跟随全局或单独开启/关闭；关闭贡献清理该聊天待处理片段，保留已有经验。
- 按项目和主题分组、勾选同范围无冲突候选，一次原子审阅最多 20 条。自动来源保留核对过的脱敏原话，方便审阅条件和例外。
- 事实默认 30 天待复核，支持明确到期时间；取回、使用反馈不续期。过期经验在界面显示待复核，自动上下文与规则预览暂时扣下。
- 不可变记忆快照与查询缓存按完整内容失效；同长度/同时间戳的文件中段变更、拒绝、到期及原子替换均不会继续使用旧结果。短摘要与来源目录可由事件重建。
- 简化中英面板，详细设置默认折叠，审阅页直接展示经验。Windows、官方宿主、浏览器与真实模型的验证范围见 [0.9.0 验收](docs/validation/0.9.0.md)。

## 0.8.1 (2026-10-04)

- 修复真实 DeepSeek 辅助整理因深度推理耗尽 1200 token、JSON 被截断而无法保存候选的问题。通过官方模型元数据，仅对明确支持 `off` 的模型关闭这条辅助调用的推理；保留当前主任务设置及其他提供商的默认行为。
- 模型元数据查询也受辅助整理的超时与取消约束；旧宿主或元数据不可用时保留原有调用方式。真实模型复测与限制见 [0.8.1 验收](docs/validation/0.8.1.md)。

## 0.8.0 (2026-10-04)

- 对照官方 0.2.1-alpha.1 源码接入会话事件、Agent Inbox 与动态上下文：符合条件的任务收尾自动整理候选，后续相关任务自动回用已采纳、有独立来源的经验，无需记住触发词。候选始终待审阅，日记和项目规则仍是独立操作。
- 默认每日最多 4 次辅助调用、间隔 10 分钟，沿用当前模型与额度；限定输入、输出和超时，新输入或关闭整理时取消。持久化预算与游标、跨进程短锁，失败不重试，不读取隐藏推理、系统提示或工具正文。
- 新增中英独立开关、调用次数、跳过原因和待审阅入口。修复官方认证 Fetch 通道缺少请求体模式导致状态读取失败的问题。自动取回保留项目、平台、审阅状态与完整条件，未知依赖版本时扣留版本限定经验。
- 详细验证与边界见 [0.8.0 验收](docs/validation/0.8.0.md)。

## 0.7.1 (2026-10-03)

- 完整本地化日记、经验审阅、反馈、来源与规则变更面板；切换语言保留正文。澄清技能通过工具记录经验，修正旧的只读面板说明。
- 验收范围见 [中英文界面检查](docs/validation-language-2026-10-03.md)。

## 0.7.0 (2026-10-02)

- 设置页可直接采纳、驳回、重新送审、标记待复核和处理冲突；页面操作记录为 human，模型工具继续记录为 model。保留 revision 校验，失败时保留填写内容。
- 展开关联来源可查看核验状态、摘要、记录时间、会话序号和来源校验值；读到来源不等同于证明结论正确。
- 项目经验可在面板查看 AGENTS.md 差异后应用，预览绑定经验版本与文件哈希，10 分钟失效。写入记录提供确认回滚，管理块外的人工内容保留。
- 新增独立使用反馈（有用 / 不适用及场景备注），不自动采纳、变更状态或提高证据数量；并发校验、重复请求幂等，明细保留最近 20 次，历史在事件流中。
- 写操作使用 DSH 0.2.0-rc.2 的认证 Connection 通道，并检查 JSON、来源和请求大小；旧宿主保留对话命令入口。修复真实宿主内部请求地址引起的正常操作拒绝。
- 窄窗口打开 Dream 时把宿主设置导航改为顶部横向导航，避免面板被压成单字列。详见 [验收范围](docs/validation/0.7.0.md)。

## 0.6.0 (2026-09-30)

- **经验来源核验**：工具读取实际会话记录或工作目录内的本地产物，核对项目、角色、记录序号、引用和哈希；伪造 read 或无法定位的来源降为 claimed，并给出原因。新经验先进入候选；读到用户纠正不再自动冒充用户采纳。
- **完整审阅**：补充证据保持状态并检查 revision；双向冲突与 prefer/drop/merge 在同一事件中原子保存，校验失败零写入；支持已驳回经验重新送审。平台条件参与检索，Windows 任务不会取到 Linux 专用经验。
- **桥接预览 / 应用 / 回滚**：预览返回差异和文件状态，新文件允许 null 哈希；应用先持久化恢复记录再原子替换目标，中断或最终审计失败后仍有可用 backupId。处理目标链接、并发修改、BOM、CRLF 与回滚后保留人工追加内容。
- **面板操作**：日记 / 经验 / 写入记录分开，行动建议直接可见、证据与例外按需展开；冲突选择显示经验标题并要求处理依据。公开编号经过脱敏仍可唯一定位；回滚编号、完整命令和复制按钮能使用。保留正常 Unix 目标路径，路径中的密钥继续脱敏。修复筛选 Escape 误关宿主设置；窄窗单列显示，日记频次标为“常见教训”。
- **验证范围**：全量回归、8 进程并发、官方前端加载器和 18 插件同载契约检查；实际 Web 宿主使用隔离的合成资料进行操作验收。详细结果与限制见 [0.6.0 验收记录](docs/validation/0.6.0.md)。零新增运行时依赖，旧日志不重写。

## 0.5.2 (2026-09-29)

- **修复窄窗不折叠**：经验区块的两栏布局在容器 ≤620px 时本应折叠为单列，但折叠规则排在基础规则之前、同特异性被覆盖，导致 620px 窄窗下仍挤成两列（长条件文字被压成多行）。现把该断点块移到样式表末尾。
- 断点按**容器宽度**（≤620px）触发，不是视口宽度：因此 125% 缩放在 1024px 视口下仍是两列，150% 缩放（容器折算 617px）折叠为单列——这是预期行为，与窄窗一致。
- 实测（离线夹具渲染，620 / 125% / 150% / 1280px 四档）：单列 554px / 两列无溢出 / 单列 617px / 两列无溢出，均无横向滚动；`node --check`、官方加载器回归与全量 204 项（203 通过 + 1 默认跳过）通过。

## 0.5.1 (2026-09-29)

- **修复两个已发布缺陷**（0.5.0 起）：① 日记文件开头有 UTF-8 BOM 时整份日记被读空；② 心境聚合用普通对象做映射，`__proto__` 键被吞、`constructor` 等键会把计数变成字符串（`"function Object()…1"`）。现在 BOM 会被剥离，聚合用无原型对象后返回普通副本，并新增 `skippedLines` 让坏行可诊断。
- **检索策略修正（R1/R3/R4/R5）**：`dream_context` 默认不注入候选（`candidate-hold`）与无证据条目（`no-evidence`）；`applicability.versions` 只在包名被识别时参与判定，版本不满足记 `version-mismatch`；预算改为按排名整条装入、遇第一条放不下即停（`budget-stop`，`rankInversionCount` 恒 0），条件与例外永不截断；`RetrievedLesson` 增加 `revision`（`dream_review` 的 `expectedRevision` 因此可达），`dream_learn.evidence` 改为可选。
- **证据纪律（R2′）**：任何 `verification:"read"` 的证据让经验初始即为 `usable`；其中用户明确纠正记 `review{decision:accepted, actor:user}`，其余 read 记 `unreviewed`；只有 `claimed` 证据或无证据才停在 `candidate`。SKILL.md 同时写明「只有真的读到来源才能标 read，自我判断一律 claimed」，防止模型自称 read 自我提权。
- **存储可诊断与前向兼容（R6/R7）**：`stats()` 拆分 `orphanEvents` / `firstReplayedEventId` / `unsupportedVersions`（与 `badLines` 分开）并给出 `replayMode`；`index.json` 增加 checkpoint（偏移 + 前缀哈希 + 末事件 id，校验不符回退全量回放），截断不再静默丢实体；`validateLesson(value, options?)` 支持 `accept`/`migrate` 与 `LESSON_MIGRATIONS` 占位；事件增加 `requestHash`（同幂等键不同内容 → `duplicate` 错误而非静默返回旧快照）；新增只读 `diagnose()`；文件锁增加 `bootId` 与心跳，超限给可操作错误而不静默抢占。
- **面板**：经验卡显示适用条件与例外；`truncated` 或存在坏行时显示提示行并注明 `events.jsonl` 未被改动。
- **验收**：L1 七场景断言（S1/S5 命中、S2/S3/S4/S6/S7 零注入、`rankInversionCount=0`）**9/9**；证据纪律 5/5；旧行为基线 4/4（旧日记与既有六工具输出只增不减、只读零写入）；全量 **204 项 / 203 通过 / 1 默认跳过**（并发压测需 `DSH_DREAM_STRESS=1`，8 进程 × 8 次实测不丢）；`tsc`、`node --check lib/client.js`、官方加载器回归通过。
- **已知限制（未达标，下一批修）**：读/写路径在知识库增长时仍是 O(历史)——50k 条证据时单次读操作数百毫秒、逐条追加呈二次增长。checkpoint 已能避免"截断丢实体"，但尚未把读路径变成增量。本版**不承诺大知识库下的性能**；下一批计划 `evidenceKeys` 常数时间去重与索引增量更新。

## 0.5.0 (2026-09-29)

- **从「反思」升级为「有来源的经验」**：新增 `dream_learn`（提交候选经验 + 证据，校验 / 脱敏 / 去重 / 按项目或全局范围保存）、`dream_context`（任务前取回少量适用经验，只读，默认 5 条 / 3000 字符，硬上限 20 条 / 20000 字符）、`dream_review`（采纳 / 驳回 / 标记过期 / 标记冲突 / 补充证据，强制 `expectedRevision`）。六个既有工具行为不变，输出字段只增不减。
- **新数据目录 `<journalDir>/knowledge/`**：`events.jsonl` 权威追加日志、`evidence.jsonl` 追加证据、`index.json` 可丢弃重建的派生索引；写入使用短期文件锁与幂等键。`dreams.jsonl` 永不重写，旧日记继续按原格式读取。
- **证据纪律**：证据只保存脱敏摘要与定位信息；`verification: read` 与 `claimed` 分开，claimed 不计入独立支持数；同一证据重复提交幂等，不增加独立来源。所有新写盘路径在 `maskSecrets` 开启时先过 `mask.ts`。
- **范围与预算**：经验按 `projectId` / `workspaceRoot` / `global` 过滤，未知当前项目时 `dream_context` 只返回全局经验；条件与例外不被截断，预算放不下就整条不返回；已驳回、已过期、冲突未解决的默认不注入任务。
- **只读面板新增「经验」区块**：展示 title / when / state / scopeLabel / evidenceSummary / lastValidatedAt；候选与有冲突的视觉区分明确，空态独立；只读路由新增 GET /_dsh/dsh-dream/knowledge（返回脱敏后的 `{ lessons, evidence, stats }`，沿用回环 Host / 405 / 403 / 错误信封），面板仍无任何写操作。
- **技能与文档**：`dream-protocol` 技能区分「第一人称感悟」与「技术经验」，流程改为取回上下文 → 执行真实任务 → 收尾提候选（附证据）→ 必要时 dream_review，并写清预算、禁止靠反复 `dream_save` 刷次数、禁止把主观反思升级成 AGENTS.md 指令；README 中英文新增 M1 章节。
- **测试**：112 → 169 项全部通过（新增知识存储 / 检索 / 三个新工具的宿主 schema 契约 / 只读知识路由零写盘与脱敏 / 面板经验区块纯函数用例）；`tsc`、`node --check lib/client.js` 与官方加载器回归（冷加载 / 缓存 / invalidate 重载）均通过。真实桌面 / Web 目视验收仍待 M1 发布前完成。
- 本版为 M1 首个发布版本。真实桌面 / Web 目视验收（经验区块配色与空态、窄窗、125%/150% 缩放、深浅色）与 18 插件同载冷启动复验**尚未完成**，完成后单独记录结论。

## 0.4.1 (2026-09-29)

- **修复 Desktop 启动失败**：前端 bundle 的模块注册 ID 与 scoped 包名不一致（注册成 `dsh-dream`，而包名是 `@stardustlc/dsh-dream`），宿主会重试加载并抛 `client-modules: duplicate factory registration for "dsh-dream"`，导致 `web boot: 1 entry did not activate`。现统一为完整包身份。
- **回归测试**：`test/client-internals.test.mjs` 新增断言——注册 ID 必须等于 `package.json` 的 `name`；并用官方 `ClientModuleSystem` 验证「冷加载 / 缓存命中 / invalidate 后重载」三条路径，改回旧 ID 能稳定复现该错误。
- 说明：0.4.0 的面板功能本身不受影响（Web 下可用），本版只是让 Desktop（`dsh-app://`）能正常激活该入口；日记数据与配置不变，无迁移。

## 0.4.0 (2026-09-29)

- **新增：只读梦境日记可视化面板**。Web profile 设置页新增「梦境日记」一节：梦境总数、心境方块序列、教训榜（按出现次数排序、同次数按最近出现时间排序，行尾 ×N 与最近一次出现时间，≥3 次标「桥接候选」并注明由 dream_bridge 决定是否写入 AGENTS.md）与卡片式时间线（时间 / 心境 / 反思 / 教训），支持关键词搜索。反思正文默认展开，超 4 行或 220 字折叠为 4 行可展开；顶部「隐私模式」可一键模糊正文与教训（仅浏览器显示层，不改变文件）。空日记与单条日记有专门呈现，不画失真图表、不显示假精度 KPI。
- 面板数据来自新增的只读同源路由 GET /_dsh/dsh-dream/journal：仅回环地址可达，非 GET 返回 405、非本机 Host 返回 403；?limit=（1–500，默认 50）与 ?q=（走 searchDreams）可选；响应契约仍为 { dreams, stats, query, limit }，其中 stats.topLessons 新增 lastAt（最近一次出现时间，纯增量），不含桥接字段。面板不提供任何写操作，记梦/翻梦/忆梦仍走 dream_save / dream_journal / dream_recall。
- **存储格式不变**：dreams.jsonl 仍是每行一条 DreamEntry JSON（id / at / reflection / lessons / mood），无迁移；升级后直接沿用现有日记。
- 修复：searchDreams（dream_recall 与面板搜索共用）此前只检索最近 1000 条日记，现在覆盖全量日记，并补充回归测试。
- 新增手写 lib/client.js（不经 tsc，随包发布）；package.json 声明 dsh.client（inject @deepseek-ai/dsh-client-ui-settings，platform: "web"）并导出 ./client；未新增任何依赖。
- 面板另含：≥8 场时的「筛选 ▾」（按心境 / 只看有教训，作用于已加载窗口）与满 50 场后的「显示更早的梦」（一次拉满 500 场上限）。
- 测试：64 → 109 项（19 个测试文件）全过；新增网页只读路由、lastAt 统计、全量检索回归与面板纯逻辑 vm 测试。
- **后续计划**：用 sidecar 记录桥接状态（哪些教训、何时写进哪个 AGENTS.md）。v1 不读取 AGENTS.md、不新增状态文件。

## 0.3.5 (2026-09-28)

- 兼容验证更新到 Harness 0.2.0-rc.1：64 项测试与 18 插件共同加载检查通过（`dream_digest` 按 v4 会话格式读取，继续过滤推理块）。
- 运行时代码未变；同步中英文兼容性声明。

## 0.3.4 (2026-09-28)

- 修复 [#2](https://github.com/STARDUSTLC666/dsh-dream/issues/2)：`dream_digest` 摘要现在实际输出用户原话、助手回应与工具足迹（此前只列出标题/轮数/目录）；
- 支持官方 Harness 0.1.7-rc.2 的 v4 会话文件：按消息 `source.kind` 只保留真人输入，过滤推理块与自动注入的上下文，避免当成用户原话；
- 跳过真正空会话；标题、工作目录、预设与工具名一并脱敏（此前只脱敏消息正文）；
- 测试扩至 64 项全过（新增 v4 明文/zstd 与摘要渲染回归）。

## 0.3.3 (2026-09-12)

- 适配并验证官方 Harness 0.1.5-rc.1：整套同载、工具/技能契约与 Web 鉴权检查通过。
- Node 要求与宿主统一为 `^22.19.0 || >=24.0.0`；更新中英文兼容性说明。
- 修复 v3 会话被跳过的问题，兼容 v2/v3 PTC 子调用工具足迹，避免重复计数与提取私密正文；新增 6 项回归测试，60 项测试通过。

## 0.3.2 (2026-09-02)

- 适配 Harness 0.1.3 的 `session.v2.jsonl` / `.zstd` 代际文件；迁移保留旧文件时每个会话只读取最新规范文件。
- 解析 v2 的内嵌 `assistant/message` / `assistant/attempt` 流，继续兼容 v0 打包行与 v1 片段。
- 默认会话与日记目录遵循 `DSH_HOME`；显式配置仍优先。

## 0.3.1 (2026-08-31)

- 支持 0.1.2 ContentBlock 数组载荷的文本提取；
- npm 包名改为 `@stardustlc/dsh-dream`（`dsh-dream` 已被他人占用）。

## 0.3.0 (2026-08-26)

- `dream_bridge` 渡梦：把高频教训幂等合并进 `AGENTS.md` 标记块，梦变成长期记忆；
- `dream_journal` 增加心境分布与最常梦到教训的统计；
- 48 个测试全过。

## 0.2.0 (2026-08-26)

- 官方打包行（text-chunks 协议）流式文本还原；
- 梦原料默认隐私脱敏（密钥/令牌/JWT/高熵串 → `[已脱敏·类型]`）；
- 入梦 `brief` 模式（`mode: 'brief'`）；
- 40 个测试全过。

## 0.1.0 (2026-08-26)

- 首版：会话回放（`dream_digest`）、梦境日记（`dream_save`/`dream_journal`/`dream_recall`）与做梦协议技能；
- 官方多帧 zstd 会话日志零依赖解析；
- 28 个测试全过。

## 更早的改动

完整历史可查阅 [GitHub 提交记录](https://github.com/STARDUSTLC666/dsh-dream/commits/master)。
