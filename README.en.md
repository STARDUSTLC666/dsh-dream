[简体中文](README.md)

# dsh-dream

> **An agent that dreams**: session replay (dream material) → reflection (interpretation) → dream journal (memory consolidation).

Humans consolidate memories by replaying the day during sleep — dsh-dream gives DeepSeek Harness agents the same ability. It reads your historical sessions (the official multi-frame zstd session logs, parsed with zero dependencies), distills dream material, lets the agent reflect, and writes permanent dream journal entries that can be recalled later.

## Compatibility

Verified against `@deepseek-ai/dsh@0.1.1-rc.2` (2026-08-26). Follows the cordis patch-bundle model (`cordis.patch.yml` + `dsh.bundle.patch`); no runtime imports of `@deepseek-ai/*` internals. Session reading is layout-blind with respect to the official JSONL-zstd multi-frame format and packed-chunk rows.

## Install / Uninstall

```bash
dsh plugin --profile web add dsh-dream
dsh plugin --profile web remove dsh-dream
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
pnpm test   # build + 48 tests (multi-frame zstd fixtures, packed-chunk decoding, privacy masking, journal round-trip, bridge idempotency, stats, six tools, registration lifecycle)
```

## License

MIT (see [LICENSE](LICENSE))
