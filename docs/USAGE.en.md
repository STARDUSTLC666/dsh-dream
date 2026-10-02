# dsh-dream usage guide

[Overview](../README.en.md) · [Changelog](../CHANGELOG.md) · [Validation](VALIDATION.md)

## Install / Uninstall

```bash
dsh plugin --profile web add @stardustlc/dsh-dream
# or from source:
dsh plugin --profile web add github:STARDUSTLC666/dsh-dream
dsh plugin --profile web remove @stardustlc/dsh-dream
```

Restart the web service afterwards. The dream journal lives at `~/.dsh/.dsh-dream/dreams.jsonl` and survives uninstallation; remove that directory manually for a full cleanup. Part of [dsh-suite](https://github.com/STARDUSTLC666/dsh-suite) — one command installs all 18 STARDUSTLC plugins.

## Dream journal panel (0.4.0+)

Once installed, DSH's **Settings →「梦境日记」(Dream journal)** provides Journal, Lessons and Write log views. From 0.7.0, reviews and feedback run through the authenticated Connection carrier in Harness 0.2.0-rc.2. Headless hosts keep the tools and skill without a settings page.

- **What it shows**: totals, a mood-square strip (never empty for a single dream, wraps when there are many) and the lessons board at the top; below that, a card timeline, newest first, with timestamp, mood, reflection body and lessons. Reflections are expanded by default and collapse to 4 lines with a show-more control beyond 4 lines or 220 characters.
- **Lessons board**: ranked by journal occurrences and recency; 3 or more occurrences are labelled common lessons. Frequency does not establish correctness, importance or bridge eligibility. Technical lessons need their own sources, review and a write preview.
- **Search**: filters by keyword across reflections and lessons, case-insensitively. Mood distribution and the lessons board are computed over the full journal; the timeline is paged by search and limit (latest 50 by default).
- **Filtering and older dreams**: from 8 dreams on, a Filter menu appears (by mood, or only dreams with lessons; it applies to the loaded window and says so). When 50 dreams are loaded and more exist, the footer offers "show older dreams", which fetches up to the 500-dream route cap in one go.
- **Journal reads**: GET /_dsh/dsh-dream/journal is loopback-only; non-GET → 405, non-local Host → 403. Saving, listing and recalling dreams still happen in chat via dream_save / dream_journal / dream_recall. Panel reviews update knowledge events; previews do not write files.
- **Data file**: the panel renders the journal itself — ~/.dsh/.dsh-dream/dreams.jsonl by default ($DSH_HOME/.dsh-dream/dreams.jsonl; an explicit journalDir wins). The storage format is unchanged: one JSON object per line, safe to remove or read with dream_journal.
- **Privacy**: read-only routes mask text again while preserving validated lesson, evidence and backup references for commands. The UI reads local same-origin routes and does not upload to third-party services. Privacy blur is a display effect; DOM text and local logs remain plaintext.
- **Before the first dream**: the panel shows an empty state pointing you to ask the agent to「做个梦」; a single dream renders as one card, with neither the mood strip nor the lessons board left empty and no misleading charts.
- **Lessons view**: usable lessons and the review queue appear separately; rejected history is optional. Review buttons save directly with revision checks. Conflict resolution requires a reason. Source records can be expanded; useful / not-applicable feedback is recorded independently of review and validation. Command fallbacks remain available.
- **Write log and rollback**: `dream_bridge apply` appends an application record with the target, time, lesson revisions, hashes and original managed block. The panel provides a confirmed rollback action while the current block still matches. Text outside the managed block remains intact; externally changed blocks are not overwritten.

## Tools

| Tool | Purpose | Key params |
| :-- | :-- | :-- |
| `dream_digest` | Replay recent sessions (title/turns/user quotes/assistant conclusions/tool footprint); subagent sessions skipped; official packed-chunk rows decoded | `maxSessions`; `mode`: full/brief |
| `dream_save` | Write a reflection + 1-5 lessons + mood to the permanent journal | `reflection` required |
| `dream_journal` | List dreams, newest first | `limit` |
| `dream_recall` | Keyword search across the journal | `query` required |
| `dream_bridge` | Bridge accepted, scope-matched lessons into AGENTS.md (`preview` / `apply` / `rollback`; omitting `mode` keeps the legacy direct write with a deprecation notice) | `mode` optional; `path` / `lessonIds` / `maxLessons` / `expectedSha256` / `previewId` / `projectId` |
| `dream_health` | Self-check: sessions dir / dream count / config summary | — |
| `dream_learn` | Submit a candidate technical lesson with evidence (validate / mask / dedupe / scope; evidence-free input stays a candidate) | `kind`, `title`, `action`, `when` required; `evidence` optional (defaults to `[]`) |
| `dream_context` | Retrieve a few applicable lessons before a task (read-only; candidates are held out by default) | `query` required; `projectId` / `workspaceRoot` / `limit` / `maxChars` / `packageName` / `packageVersion` / `platform` / `includeCandidates` optional |
| `dream_review` | Review and transition state: accept / reject / mark stale / mark disputed / resolve conflicts / attach evidence / reopen | `action`, `lessonId`, `expectedRevision` required |

Conflict review requires resolution (prefer / drop / merge), affectedIds and note. All parties are validated and updated in one event; invalid groups write nothing. attach-evidence verifies sources without promoting the lesson, and reopen returns a rejected lesson to candidate.

`dream_bridge` now has three explicit modes:

- `preview` (read-only): returns the real diff, selected lessons and skipped reasons — zero writes;
- `apply`: requires the preview’s `expectedSha256` (null for a missing file); also pass `previewId` to bind the preview; a concurrent edit returns `conflict` with zero writes. It only replaces the Dream managed block (`<!-- dsh-dream:start/end -->`), preserving text outside the block, BOM and line endings, first fsyncs a pending recovery record, then atomically replaces the target and records applied;
- `rollback`: locates the record by backupId and rolls back only while the current managed block still equals that apply result, preserving later manual additions outside it.

Omitting `mode` keeps the 0.5.x direct write and returns a deprecation notice; new flows should use `preview → apply`. Only `usable`, scope-matched (or explicit global with review.decision accepted) lessons can be bridged — frequency is no longer an admission criterion — and everything written is masked via `mask.ts`. The panel's "Write log" shows these records and whether they are rollbackable.

The bundled `dream-protocol` skill teaches the agent when and how to dream (and the journaling discipline: patterns only, never secrets).

## Lesson memory

The dream journal holds subjective reflections; technical lessons that should be reused go to `<journalDir>/knowledge/`:

- **Candidate → verified source → review**: dream_learn creates candidates. Session evidence needs sessionId, recordSeq and a matching quote (summary is used if omitted); the plugin checks project, role, record and text, then computes sourceHash. User corrections must come from actual user messages. Local artifacts require artifactPath with a real path inside the execution working directory. Failed verification becomes claimed with verificationReason and contributes no independent support. Reading a source is not user acceptance; tool reviews record actor:model. attach-evidence preserves state, and every review checks expectedRevision.
- **Budgeted retrieval**: `dream_context` returns at most 5 items / 3000 characters by default (hard caps 20 items / 20000 characters). Items are packed whole by rank and packing stops at the first item that does not fit (`skipped: budget-stop`); `title / when / action / exceptions` are never truncated, and no half item is ever returned. Candidates and evidence-free non-usable items are held out of task advice by default (`includeCandidates: false`, reported as `candidate-hold` / `no-evidence`); pass `includeCandidates: true` only when explicitly reviewing candidates, and note that candidates rank after usable lessons and must not be treated as verified. Rejected, stale and unresolved disputed lessons are not injected. An explicit platform wins, otherwise unambiguous task text or the host platform is used; mismatches report platform-mismatch; `applicability.versions` only counts when the package is identified (explicit `packageName` or a package name in the query).
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

MIT (see [LICENSE](../LICENSE))
