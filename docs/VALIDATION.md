# dsh-dream 验证记录

本页整理原 README 的历史验证说明，保留当时的版本、日期与范围。自动测试、启动检查、浏览器操作和真实服务验收分别记录，不能相互替代。更详细的版本验收文件仍保留在仓库中。

## 最近的版本验收

- [0.7.0](validation/0.7.0.md)：直接审阅、来源检查、规则预览、应用、回滚与独立反馈。
- [0.6.0](validation/0.6.0.md)：来源核验与恢复流程。
- [0.5.2](validation/0.5.2.md)、[0.5.1](validation/0.5.1.md)：此前的界面与记忆纪律验收。

以下保留原 README 的历史描述；当前版本的测试数量和操作范围以对应版本记录为准。

## 原中文记录

验证宿主：官方源码构建的 Harness 0.2.0-rc.1（commit 407e65c8，含本地宿主修补）+ Node 24.16.0。0.6.0 在隔离 profile 的实际 Web 宿主中验收；Web 验收不等同于原生 Desktop 安装器验收，具体范围见验收记录。保持完整 scoped 前端模块身份，兼容 Desktop 的模块加载契约。本插件注册 9 个工具与 dream-protocol 技能；零运行时依赖。

支持 v0/v1/v2/v3/v4 的普通 JSONL 与多帧 zstd、旧 packed-chunk 行及内嵌 stream；升级留下多代文件时只读取每个会话的最新规范文件。PTC 子工具调用保留工具名且不重复计数，不提取系统提示、推理、工具参数或结果正文。

默认从 `DSH_HOME/sessions` 读取会话、在 `DSH_HOME/.dsh-dream` 保存日记；未设置 `DSH_HOME` 时使用 `~/.dsh`。配置中的 `sessionsRoot`、`journalDir` 始终优先。

## Original English record

Validation host: Harness 0.2.0-rc.1 built from official sources (commit 407e65c8, with local host fixes), Node 24.16.0. Version 0.6.0 is exercised in a real Web host with an isolated profile. Web validation does not certify the native Desktop installer; see the validation record for exact scope. The full scoped client identity remains compatible with the Desktop module loader. Registers 9 tools and dream-protocol with zero runtime dependencies.

Reads v0/v1/v2/v3/v4 plaintext JSONL and multi-frame zstd, legacy packed chunks and embedded streams. Only the newest canonical file is selected per session. PTC child calls retain tool names without double counting; system prompts, reasoning, tool arguments and result bodies are excluded.

Default data directories follow `DSH_HOME`: `sessions` for session logs and `.dsh-dream` for the journal. Without `DSH_HOME`, the base is `~/.dsh`. Explicit `sessionsRoot` and `journalDir` settings take precedence.
