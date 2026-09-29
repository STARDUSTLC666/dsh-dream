[简体中文](README.md)

![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream) ![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-dream) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-dream?style=social)

# dsh-dream

## 0.4.1 update (2026-09-29)

- **Fixes a Desktop boot failure**: the front-end module id now matches the scoped package name (it used to register as `dsh-dream`, so the host retried the bundle and threw `duplicate factory registration`, ending in `1 entry did not activate`). No journal or config migration.

## 0.5.1 update (2026-09-29)

- **Fixes**: a leading UTF-8 BOM used to hide the whole journal; mood keys such as `__proto__`/`constructor` corrupted counts. **Retrieval discipline**: candidates and evidence-free lessons are not injected by default, version checks need package context, and the budget packs by rank. **Evidence discipline**: lessons backed by read evidence start usable; model-claimed only stays candidate.
- 204 tests (203 passing, 1 opt-in concurrency stress test skipped); L1 acceptance 9/9. Known limit: reads/writes still grow with history on very large libraries.

## 0.5.0 update (2026-09-29)

- **Three new tools**: `dream_learn` (submit an evidence-backed candidate lesson), `dream_context` (retrieve a few applicable lessons before a task; read-only; 5 items / 3000 characters by default) and `dream_review` (accept / reject / mark stale or disputed / attach evidence; every mutation requires a revision).
- **New data directory `<journalDir>/knowledge/`**: `events.jsonl` is the authoritative append-only log, `evidence.jsonl` appends evidence, and `index.json` is a disposable derived index. The old `dreams.jsonl` stays read-compatible and is never rewritten.
- **Masking and scope guarantees**: every new write path runs through `mask.ts` when `maskSecrets` is on; evidence stores only masked one-line summaries plus locators — never hidden reasoning, system prompts, tool arguments or result bodies. Lessons are scoped to a project or global; with an unknown project `dream_context` returns global lessons only and never scans across projects.
- **Compatibility**: the old journal and the six existing tools (dream_digest / dream_save / dream_journal / dream_recall / dream_bridge / dream_health) keep their behaviour and output fields only grow. No migration is required and no old data is rewritten.
- **New read-only "Lessons" block** in the panel: state (candidate / usable / disputed / stale / rejected), applicability, scope, applicability details (package / versions / platform) and exceptions (only when non-empty), evidence summary and last-validated time. Candidates and disputed lessons are visually distinct, and an empty knowledge store has its own empty state. When the event log is truncated or has bad lines the block shows a notice and says events.jsonl was left untouched. The panel still has no write actions.

## 0.4.0 update (2026-09-29)

Adds a read-only dream-journal panel: open **Settings →「梦境日记」(Dream journal)** to see totals, mood distribution, the lessons board and a card timeline, with keyword search. Long reflections fold automatically and a one-click privacy blur is available. The panel is read-only and the storage format is unchanged — no migration needed.

> **An agent that dreams**: session replay (dream material) → reflection (interpretation) → dream journal (memory consolidation).

Humans consolidate memories by replaying the day during sleep — dsh-dream gives DeepSeek Harness agents the same ability. It reads your historical sessions (the official multi-frame zstd session logs, parsed with zero dependencies), distills dream material, lets the agent reflect, and writes permanent dream journal entries that can be recalled later.

## Compatibility

Validation host: Harness `0.2.0-rc.1` built from official sources (commit `407e65c8`) with Node `24.16.0` on 2026-09-29. The 18-plugin joint load was re-run before the 0.5.0 release: contracts `ok`, **99 tools / 35 skills**, no failing plugins (`suite-0.2.6-compat.json`), with this plugin passing 204/169 tests in that run (the 0.4.1 baseline of 112 also passed). The plugin registers 9 tools (the 6 original tools plus M1's dream_learn / dream_context / dream_review) and the `dream-protocol` skill, with tool schemas and health-check contracts passing. No live ports or external services were exercised in this round; the panel is reachable on loopback only.

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
- **Filtering and older dreams**: from 8 dreams on, a Filter menu appears (by mood, or only dreams with lessons; it applies to the loaded window and says so). When 50 dreams are loaded and more exist, the footer offers "show older dreams", which fetches up to the 500-dream route cap in one go.
- **Read-only**: the panel only reads from the plugin's own GET /_dsh/dsh-dream/journal (loopback-only; non-GET → 405, non-local Host → 403). There is no write action; saving, listing and recalling dreams still happen in chat via dream_save / dream_journal / dream_recall, and the panel never modifies the journal file.
- **Data file**: the panel renders the journal itself — ~/.dsh/.dsh-dream/dreams.jsonl by default ($DSH_HOME/.dsh-dream/dreams.jsonl; an explicit journalDir wins). The storage format is unchanged: one JSON object per line, safe to remove or read with dream_journal.
- **Privacy**: the panel performs no second-pass masking — masking only happens when a dream is written (maskSecrets), and the panel shows exactly what is already in the file. It does not upload, export or make any network request. The privacy mode at the top blurs reflections and lessons in one click, but it is a display-layer effect only (the DOM still holds plaintext), not encryption. Review the journal before sharing your screen or the JSONL.
- **Before the first dream**: the panel shows an empty state pointing you to ask the agent to「做个梦」; a single dream renders as one card, with neither the mood strip nor the lessons board left empty and no misleading charts.
- **Lessons block (M1)**: a read-only "Lessons" block shows each technical lesson's state (candidate / usable / disputed / stale / rejected), applicability, scope, applicability details and exceptions (exceptions render only when non-empty), evidence summary and last-validated time. Candidates and disputed lessons get distinct colours and borders, and the empty state is separate from the dream empty state. When the event log is truncated or has bad lines, a notice appears saying events.jsonl was left untouched. Data comes from the read-only GET /_dsh/dsh-dream/knowledge route (loopback only; non-GET → 405, non-local Host → 403). There are no accept / edit / delete buttons — use `dream_review` to review.
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
| `dream_learn` | Submit a candidate technical lesson with evidence (validate / mask / dedupe / scope; evidence-free input stays a candidate) | `kind`, `title`, `action`, `when` required; `evidence` optional (defaults to `[]`) |
| `dream_context` | Retrieve a few applicable lessons before a task (read-only; candidates are held out by default) | `query` required; `projectId` / `workspaceRoot` / `limit` / `maxChars` / `packageName` / `packageVersion` / `includeCandidates` optional |
| `dream_review` | Review and transition state: accept / reject / mark stale / mark disputed / attach evidence | `action`, `lessonId`, `expectedRevision` required |

`dream_bridge` merges the most frequent dream lessons into a target `AGENTS.md` behind idempotent marker blocks; `dream_journal` also reports mood distribution and top lessons.

The bundled `dream-protocol` skill teaches the agent when and how to dream (and the journaling discipline: patterns only, never secrets).

## Lesson memory (M1)

The dream journal holds subjective reflections; technical lessons that should be reused go to `<journalDir>/knowledge/`:

- **Candidate → evidence → review**: `dream_learn` stores "when / action / exceptions / scope" together with evidence as a candidate. `verification: read` means the original record was actually read; `claimed` only means the model asserts it (it does not count toward independent support). Use `dream_review` to accept, reject, mark stale or disputed, or attach new evidence — every mutation carries `expectedRevision` and stale writes are rejected. When the evidence is `kind: "user-correction"` with `verification: "read"`, the lesson starts as `usable` and `review` records `actor: "user"` / `decision: "accepted"` — a user decision outranks model inference; all other evidence starts as `candidate`, and claimed evidence neither counts toward independent support nor overrides a user correction.
- **Budgeted retrieval**: `dream_context` returns at most 5 items / 3000 characters by default (hard caps 20 items / 20000 characters). Items are packed whole by rank and packing stops at the first item that does not fit (`skipped: budget-stop`); `title / when / action / exceptions` are never truncated, and no half item is ever returned. Candidates and evidence-free non-usable items are held out of task advice by default (`includeCandidates: false`, reported as `candidate-hold` / `no-evidence`); pass `includeCandidates: true` only when explicitly reviewing candidates, and note that candidates rank after usable lessons and must not be treated as verified. Rejected, stale and unresolved disputed lessons are not injected; `applicability.versions` only counts when the package is identified (explicit `packageName` or a package name in the query).
- **Frequency is not reliability**: resubmitting the same evidence is idempotent; never grind counts by calling `dream_save` / `dream_learn` repeatedly. Repeated occurrences within one session count as a single independent source.
- **Recoverable storage**: `events.jsonl` is the authoritative append-only event log, `evidence.jsonl` appends evidence and `index.json` is a disposable derived index. Rebuilding the index deletes no source files. When the directory does not exist, the read route returns an empty result and never creates anything.
- **Removing it**: delete `<journalDir>/knowledge/` to clear lesson memory. The old `dreams.jsonl` journal is unaffected, and older plugin versions can still read it.

## Privacy (on by default)

Dream material is masked before journaling: sk keys, GitHub/Groq/Slack tokens, AWS keys, JWTs, `password/token/api_key` assignments and long high-entropy strings become `[masked·type]`. In M1 the lesson / evidence / error / bridge write paths also run through `mask.ts` when `maskSecrets` is on, and text returned by the read-only panel route is masked again. Disable with `maskSecrets: false`.

## Permissions & data

Read-only access to the sessions directory; appends JSONL to the journal directory plus lessons/evidence under `journalDir/knowledge/`; no network calls. Session content may be sensitive — the protocol forbids secrets in dreams, but the journal is plaintext: review before sharing.

## Development

```bash
pnpm install
pnpm test   # build + offline tests (session generations, zstd, streams, masking, journal, bridge, registration)
```

## License

MIT (see [LICENSE](LICENSE))
