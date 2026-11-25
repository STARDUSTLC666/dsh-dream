# @stardustlc/dsh-dream 工作台 / Workbench

Dream 记忆主工作台，待审阅（默认「叠卡」触感分拣工作台，支持 1 键切回经典「列表」）、已采纳、日记、规则记录和设置分区；保留人工采纳与全局范围确认。

Dream memory workbench with Awaiting review (default Tactile Triage Deck with 1-click toggle back to classic List), Accepted lessons, Journal, Rule history and Settings; preserves human acceptance and global-scope confirmation.

## 使用 / Use

更新插件并重启 DSH，在原生左侧栏打开工作台；没有固定时可在“更多”中找到。原有“设置”入口继续可用。侧栏排序和固定由 DSH 管理。

Update the plugin, restart DSH and open its native sidebar panel (or More if it is not pinned). The existing Settings entry remains available. DSH owns sidebar order and pinning.

界面继承宿主浅深色并内置柔和岩板深色模式。顶栏支持实时切换 **13 套明亮/柔和风格**（原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 掌机 / 晴空薄荷 / 晴昼琉璃 / 护眼墨水屏 / 工程晒图 / 波普孔版 / 云母流光 / 宋韵朱砂 / 晴空水晶 / 铅字晨报）与 **8 套中英双层字体（`字`，默认「跟随风格专属字」）**，跨所有插件自动同步；也可点顶栏 `? 引导` 逐步熟悉叠卡操作。设置中可以跟随宿主语言，或选择 Dream 的简体中文、英文、日文、韩文、德文、法文、西班牙文和俄文。部分既有诊断使用英文兜底，经验与证据保留原文。

待审阅页默认进入**「叠卡」触感分拣工作台**：顶部集成「叠卡 / 列表」切换、Inbox Zero 分拣进度条、搜索、项目/主题筛选胶囊及「自动整理 / 自动取回」开关；中间为 3 层堆叠候选卡片，按住向右拖采纳、向左拖丢弃（未达阈值松手回弹），按 `Space` 或点「↻ 翻面看证据」3D 翻转核对原文出处、适用范围与脱敏掩码；底部悬浮操作坞支持 `D` 丢弃、`Space` 翻面、`K`/`J` 切卡、`A` 确认采纳及「展开完整详情」（处理冲突或查看完整信息）。点击顶部「列表」可 1 键切回经典双栏分栏与批量审阅，拖动分隔线调列宽（聚焦分隔线可用左右方向键调整），按 `⌘K` 或 `Ctrl+K` 打开命令面板。采纳全局经验需要勾选范围确认。点击已脱敏槽位可以查看掩码。

工作台从已读取的版本生成修订对比。尚无前一版时，可以预览采纳或丢弃带来的审阅状态变化。项目规则预览会显示实际的 AGENTS.md Diff。

The workbench follows the host light/dark mode (with a soft-slate dark mode) and offers **13 bright/soft styles** plus **8 dual-layer font pairings (default: style-matched font)** synced across plugins, along with an interactive `? Tour` walkthrough in the header. Settings lets you follow the host language or choose Simplified Chinese, English, Japanese, Korean, German, French, Spanish or Russian. Some existing diagnostics fall back to English. Lessons and evidence keep their original wording.

**Awaiting review** defaults to the **Tactile Triage Deck (`Deck`)**: the top ribbon houses the `Deck / List` toggle, Inbox Zero progress bar, search, project/topic filter pills, and Auto collect/recall switches. Drag the active card right to accept or left to discard (releases short of threshold spring back), press `Space` (or click **Flip for evidence**) to 3D-flip for session quotes, scope and secret redaction masks, and use the Floating Action Dock (`D` discard, `Space` flip, `K`/`J` prev/next, `A` accept, **Full details** for conflicts). Toggle **List** anytime for the classic split view with draggable divider (`←`/`→` when focused) and batch review; press `⌘K` or `Ctrl+K` for the command palette. Global acceptance requires confirming its scope. Click a redaction marker to see the mask.

Revision comparisons use versions the workbench has already loaded. A candidate without a previous snapshot can show a preview of the review status change. Rule previews show the actual AGENTS.md diff.

## 源码 / Source

编辑 `templates/` 下的界面、语言和 CSS Module 源码，然后运行 `pnpm run build`。将生成的 `lib/client.js` 随源码提交。控件通过 Harness 客户端加载器解析，样式和 `clsx` 随 Dream 客户端构建。

Edit the UI, language and CSS Module sources under `templates/` and run `pnpm run build`. Commit the generated `lib/client.js` with the sources. The client loads controls through Harness and bundles its own styles and `clsx`.

## 验收范围 / Validation boundary

当前版本要求宿主 DSH `>=0.2.2-rc.3`。历史回归基线（2026-10-25）：Windows、官方 DSH 0.2.1-rc.3 Web，后台 Chrome/Playwright 实际点击和输入；覆盖中英文、浅深色、1536px 与 390px、状态读回与控制台。Browser plugin 不可用，因此使用本地 Playwright。

邮件使用受控 AgentMail HTTP 服务，日历使用受控 CalDAV 协议传输；插件处理器、存储、校验和原生宿主均实际运行。未使用真实邮箱、真实日历账号或付费模型。RSS 访问 Node.js 官方公开来源。PPT 实际生成并渲染 PPTX、下载 ZIP；两个视频插件实际运行官方引擎并播放 MP4。

这些是 Web 共用界面的验收结果，不代表已验收 Electron 专属菜单、系统权限、真实账号、全部外部来源或所有可选模型/引擎。Docker、Slack、钉钉继续按用户约定搁置。
