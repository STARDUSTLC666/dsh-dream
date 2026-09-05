# Changelog

## Unreleased

- 适配 Harness 0.1.3 的 `session.v2.jsonl` / `.zstd` 代际文件；迁移保留旧文件时每个会话只读取最新规范文件。
- 解析 v2 的内嵌 `assistant/message` / `assistant/attempt` 流，继续兼容 v0 打包行与 v1 片段。
- 默认会话与日记目录遵循 `DSH_HOME`；显式配置仍优先。

## 0.3.0（2026-08-26）

- `dream_bridge` 渡梦：把高频教训幂等合并进 `AGENTS.md` 标记块，梦变成长期记忆；
- `dream_journal` 增加心境分布与最常梦到教训的统计；
- 48 个测试全过。

## 0.2.0（2026-08-26）

- 官方打包行（text-chunks 协议）流式文本还原；
- 梦原料默认隐私脱敏（密钥/令牌/JWT/高熵串 → `[已脱敏·类型]`）；
- 入梦 `brief` 模式（`mode: 'brief'`）；
- 40 个测试全过。

## 0.1.0（2026-08-26）

- 首版：会话回放（`dream_digest`）、梦境日记（`dream_save`/`dream_journal`/`dream_recall`）与做梦协议技能；
- 官方多帧 zstd 会话日志零依赖解析；
- 28 个测试全过。
