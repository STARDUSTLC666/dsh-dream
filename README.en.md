[简体中文](README.md)

![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream) ![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-dream) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-dream?style=social)

# dsh-dream

## 0.3.4 update (2026-09-28)

Fixes [#2](https://github.com/STARDUSTLC666/dsh-dream/issues/2): digests now render human excerpts, assistant responses and tool names, skip truly empty sessions, and mask metadata as well as the body. Supports Harness v4 session files while excluding reasoning blocks and injected context from human excerpts.

> **An agent that dreams**: session replay (dream material) → reflection (interpretation) → dream journal (memory consolidation).

Humans consolidate memories by replaying the day during sleep — dsh-dream gives DeepSeek Harness agents the same ability. It reads your historical sessions (the official multi-frame zstd session logs, parsed with zero dependencies), distills dream material, lets the agent reflect, and writes permanent dream journal entries that can be recalled later.

## Compatibility

Validation host: Harness `0.2.0-rc.1` built from official sources (commit `407e65c8`) with Node `24.16.0` on 2026-09-28. All 64 plugin tests pass in an isolated environment; all 18 plugins mount together in one host registering 1 skills and 6 tools, with tool schemas and health-check contracts passing. No live ports or external services were exercised in this round.

Reads v0/v1/v2/v3/v4 plaintext JSONL and multi-frame zstd, legacy packed chunks and embedded streams. Only the newest canonical file is selected per session. PTC child calls retain tool names without double counting; system prompts, reasoning, tool arguments and result bodies are excluded.

Default data directories follow `DSH_HOME`: `sessions` for session logs and `.dsh-dream` for the journal. Without `DSH_HOME`, the base is `~/.dsh`. Explicit `sessionsRoot` and `journalDir` settings take precedence.

## Install / Uninstall

```bash
dsh plugin --profile web add @stardustlc/dsh-dream
# or from source:
dsh plugin --profile web add github:STARDUSTLC666/dsh-dream
dsh plugin --profile web remove @stardustlc/dsh-dream
```

Restart the web service afterwards. The dream journal lives at `~/.dsh/.dsh-dream/dreams.jsonl` and survives uninstallation; remove that directory manually for a full cleanup. Part of [dsh-suite](https://github.com/STARDUSTLC666/dsh-suite) — one command installs all 18 STARDUSTLC plugins.

## Tools

| Tool | Purpose | Key params |
| :-- | :-- | :-- |
| `dream_digest` | Replay recent sessions (title/turns/user quotes/assistant conclusions/tool footprint); subagent sessions skipped; official packed-chunk rows decoded | `maxSessions`; `mode`: full/brief |
| `dream_save` | Write a reflection + 1-5 lessons + mood to the permanent journal | `reflection` required |
| `dream_journal` | List dreams, newest first | `limit` |
| `dream_recall` | Keyword search across the journal | `query` required |
| `dream_bridge` | Merge top lessons into AGENTS.md (idempotent marker block) — dreams become long-term memory | `path` required |
| `dream_health` | Self-check: sessions dir / dream count / config summary | — |

`dream_bridge` merges the most frequent dream lessons into a target `AGENTS.md` behind idempotent marker blocks; `dream_journal` also reports mood distribution and top lessons.

The bundled `dream-protocol` skill teaches the agent when and how to dream (and the journaling discipline: patterns only, never secrets).

## Privacy (on by default)

Dream material is masked before journaling: sk keys, GitHub/Groq/Slack tokens, AWS keys, JWTs, `password/token/api_key` assignments and long high-entropy strings become `[masked·type]`. Disable with `maskSecrets: false`.

## Permissions & data

Read-only access to the sessions directory; appends JSONL to the journal directory; no network calls. Session content may be sensitive — the protocol forbids secrets in dreams, but the journal is plaintext: review before sharing.

## Development

```bash
pnpm install
pnpm test   # build + offline tests (session generations, zstd, streams, masking, journal, bridge, registration)
```

## License

MIT (see [LICENSE](LICENSE))
