# @stardustlc/dsh-dream 工作台 / Workbench

Dream 记忆主工作台，待审阅、已采纳、日记和规则记录分区；保留人工采纳与全局范围确认。

Dream memory workbench with review, accepted lessons, journal and rule history; preserves human acceptance and global-scope confirmation.

## 使用 / Use

更新插件并重启 DSH，在原生左侧栏打开工作台；没有固定时可在“更多”中找到。原有“设置”入口继续可用。侧栏排序和固定由 DSH 管理。

Update the plugin, restart DSH and open its native sidebar panel (or More if it is not pinned). The existing Settings entry remains available. DSH owns sidebar order and pinning.

界面继承宿主主题。顶栏可切换 DSH 原生、Arc 浮岛、Raycast 聚光和 Bento 卡片，选择保存在 Dream 内。设置中可以跟随宿主语言，或选择 Dream 的简体中文、英文、日文、韩文、德文、法文、西班牙文和俄文。部分既有诊断使用英文兜底，经验与证据保留原文。

在待审阅页拖动分隔线调列宽。聚焦分隔线后可用左右方向键调整。窄窗口点开候选，再用「返回列表」切回。在工作台中按 J/K 切换候选，A 确认采纳，D 丢弃，⌘K 或 Ctrl+K 打开命令面板。采纳全局经验需要勾选范围确认。点击已脱敏槽位可以查看掩码。

工作台从已读取的版本生成修订对比。尚无前一版时，可以预览采纳或丢弃带来的审阅状态变化。项目规则预览会显示实际的 AGENTS.md Diff。

The workbench inherits the host theme and offers four Dream-only styles. Settings lets you follow the host language or choose Simplified Chinese, English, Japanese, Korean, German, French, Spanish or Russian. Some existing diagnostics fall back to English. Lessons and evidence keep their original wording.

Drag the divider or focus it and press the arrow keys to resize the candidate list. On narrow screens, use Back to list. Press J/K to move between candidates, A to confirm acceptance, D to discard, and ⌘K or Ctrl+K to open the command palette. Global acceptance requires confirming its scope. Click a redaction marker to see the mask.

Revision comparisons use versions the workbench has already loaded. A candidate without a previous snapshot can show a preview of the review status change. Rule previews show the actual AGENTS.md diff.

## 源码 / Source

编辑 `templates/` 下的界面、语言和 CSS Module 源码，然后运行 `pnpm run build`。将生成的 `lib/client.js` 随源码提交。控件通过 Harness 客户端加载器解析，样式和 `clsx` 随 Dream 客户端构建。

Edit the UI, language and CSS Module sources under `templates/` and run `pnpm run build`. Commit the generated `lib/client.js` with the sources. The client loads controls through Harness and bundles its own styles and `clsx`.

## 验收范围 / Validation boundary

2026-10-25：Windows、官方 DSH 0.2.1-rc.3 Web，后台 Chrome/Playwright 实际点击和输入；覆盖中英文、浅深色、1536px 与 390px、状态读回与控制台。Browser plugin 不可用，因此使用本地 Playwright。

邮件使用受控 AgentMail HTTP 服务，日历使用受控 CalDAV 协议传输；插件处理器、存储、校验和原生宿主均实际运行。未使用真实邮箱、真实日历账号或付费模型。RSS 访问 Node.js 官方公开来源。PPT 实际生成并渲染 PPTX、下载 ZIP；两个视频插件实际运行官方引擎并播放 MP4。

这些是 Web 共用界面的验收结果，不代表已验收 Electron 专属菜单、系统权限、真实账号、全部外部来源或所有可选模型/引擎。Docker、Slack、钉钉继续按用户约定搁置。
