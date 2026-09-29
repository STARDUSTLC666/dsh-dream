[简体中文](README.md)

![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream) ![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-dream) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-dream?style=social)

# dsh-dream

## 0.4.0 update (2026-09-29)

Adds a read-only dream-journal panel: open **Settings →「梦境日记」(Dream journal)** to see totals, mood distribution, the lessons board and a card timeline, with keyword search. Long reflections fold automatically and a one-click privacy blur is available. The panel is read-only and the storage format is unchanged — no migration needed.

> **An agent that dreams**: session replay (dream material) → reflection (interpretation) → dream journal (memory consolidation).

Humans consolidate memories by replaying the day during sleep — dsh-dream gives DeepSeek Harness agents the same ability. It reads your historical sessions (the official multi-frame zstd session logs, parsed with zero dependencies), distills dream material, lets the agent reflect, and writes permanent dream journal entries that can be recalled later.

## Compatibility

Validation host: Harness `0.2.0-rc.1` built from official sources (commit `407e65c8`) with Node `24.16.0` on 2026-09-29. All 99 plugin tests pass in an isolated environment; the plugin registers 6 tools and the `dream-protocol` skill inside a host where all 18 plugins mount together, with tool schemas and health-check contracts passing. No live ports or external services were exercised in this round; the panel is reachable on loopback only.

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

## Dream journal panel (0.4.0+)

Once installed, DSH's **Settings →「梦境日记」(Dream journal)** grows a read-only panel (Web profile only; headless hosts keep the tools and the skill without a settings page).

- **What it shows**: totals, a mood-square strip (never empty for a single dream, wraps when there are many) and the lessons board at the top; below that, a card timeline, newest first, with timestamp, mood, reflection body and lessons. Reflections are expanded by default and collapse to 4 lines with a show-more control beyond 4 lines or 220 characters.
- **Lessons board**: ranked by occurrences, ties broken by most recent occurrence, and each row shows when it was last seen (today / yesterday / N days ago; if the stats omit it, the panel falls back to the loaded page and says so); tied ranks get no medal colors, and counts do not imply importance. Lessons seen 3 or more times are marked as bridge candidates, with one line noting that whether they are written into AGENTS.md is decided by dream_bridge; lessons with count 1 carry no progress or KPI decoration. Lessons are trimmed and merged case-insensitively (the earliest spelling is kept); the same lesson written twice in one dream counts twice; near-duplicates with different wording, punctuation or full/half-width forms are not merged. The ledger shows the top 10 — the same default set dream_bridge writes into AGENTS.md.
- **Search**: filters by keyword across reflections and lessons, case-insensitively. Mood distribution and the lessons board are computed over the full journal; the timeline is paged by search and limit (latest 50 by default).
- **Read-only**: the panel only reads from the plugin's own GET /_dsh/dsh-dream/journal (loopback-only; non-GET → 405, non-local Host → 403). There is no write action; saving, listing and recalling dreams still happen in chat via dream_save / dream_journal / dream_recall, and the panel never modifies the journal file.
- **Data file**: the panel renders the journal itself — ~/.dsh/.dsh-dream/dreams.jsonl by default ($DSH_HOME/.dsh-dream/dreams.jsonl; an explicit journalDir wins). The storage format is unchanged: one JSON object per line, safe to remove or read with dream_journal.
- **Privacy**: the panel performs no second-pass masking — masking only happens when a dream is written (maskSecrets), and the panel shows exactly what is already in the file. It does not upload, export or make any network request. The privacy mode at the top blurs reflections and lessons in one click, but it is a display-layer effect only (the DOM still holds plaintext), not encryption. Review the journal before sharing your screen or the JSONL.
- **Before the first dream**: the panel shows an empty state pointing you to ask the agent to「做个梦」; a single dream renders as one card, with neither the mood strip nor the lessons board left empty and no misleading charts.
- **Roadmap**: record bridge status via a sidecar (which lessons were written into which AGENTS.md, and when). Not in this release — v1 reads no AGENTS.md and adds no state file.

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
