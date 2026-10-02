# Historical release notes

[Current changelog](../CHANGELOG.md) · [Overview](../README.en.md)

These English notes preserve the earlier translations. The main changelog contains the consolidated version history.

## 0.7.0 (2026-10-02)

- Direct review buttons, conflict resolution with a required reason, and expandable source records. UI decisions record `human`; model tools still record `model`. Revision conflicts preserve entered text.
- Project lessons can preview the exact AGENTS.md changes, apply the approved preview, and roll back the managed block while preserving manual content outside it. Previews expire after ten minutes and check both lesson revision and file hash. Lessons without a project directory keep the project-chat preview command.
- Separate useful / not-applicable feedback with optional context, idempotent retries, and the latest twenty details. Feedback does not automatically accept, reject, validate, or add evidence to a lesson.
- Mutations use Harness 0.2.0-rc.2's authenticated Connection Fetch carrier. Read-only endpoints and command fallbacks remain. A Dream-scoped narrow-window layout prevents the settings navigation from squeezing the content into single-character columns.
- See [0.7.0 validation](validation/0.7.0.md) for browser, automatic-test and native Desktop boundaries.

## 0.6.0 (2026-09-30)

- **Source verification and review**: reads actual session records or bounded project artifacts. Unverifiable claims stay claimed with a reason. New lessons start as candidates, including user corrections.
- **Recoverable bridging**: preview / apply / rollback with durable recovery records written before the target. Handles missing-file null hashes, linked paths, CRLF rollback and concurrent edits.
- **Complete review**: verified evidence attachment, atomic conflict resolution (prefer/drop/merge), reopening rejected lessons, and stable public references.
- **Usable panel**: separate Journal / Lessons / Write log views, prominent action text, a conflict form with named lessons and a required reason, and copyable rollback commands.
- See [0.6.0 validation](validation/0.6.0.md) and [CHANGELOG](../CHANGELOG.md).

## 0.5.1 (2026-09-29)

- **Fixes**: a leading UTF-8 BOM used to hide the whole journal; mood keys such as `__proto__`/`constructor` corrupted counts. **Retrieval discipline**: candidates and evidence-free lessons are not injected by default, version checks need package context, and the budget packs by rank. **Historical evidence policy**: read evidence used to promote lessons directly; 0.6.0 replaces this with independent source verification and review.
- 204 tests (203 passing, 1 opt-in concurrency stress test skipped); L1 acceptance 9/9. Known limit: reads/writes still grow with history on very large libraries.

## 0.5.0 (2026-09-29)

- **Three new tools**: `dream_learn` (submit an evidence-backed candidate lesson), `dream_context` (retrieve a few applicable lessons before a task; read-only; 5 items / 3000 characters by default) and `dream_review` (accept / reject / mark stale or disputed / attach evidence; every mutation requires a revision).
- **New data directory `<journalDir>/knowledge/`**: `events.jsonl` is the authoritative append-only log, `evidence.jsonl` appends evidence, and `index.json` is a disposable derived index. The old `dreams.jsonl` stays read-compatible and is never rewritten.
- **Masking and scope guarantees**: every new write path runs through `mask.ts` when `maskSecrets` is on; evidence stores only masked one-line summaries plus locators — never hidden reasoning, system prompts, tool arguments or result bodies. Lessons are scoped to a project or global; with an unknown project `dream_context` returns global lessons only and never scans across projects.
- **Compatibility**: the old journal and the six existing tools (dream_digest / dream_save / dream_journal / dream_recall / dream_bridge / dream_health) keep their behaviour and output fields only grow. No migration is required and no old data is rewritten.
- **New read-only "Lessons" block** in the panel: state (candidate / usable / disputed / stale / rejected), applicability, scope, applicability details (package / versions / platform) and exceptions (only when non-empty), evidence summary and last-validated time. Candidates and disputed lessons are visually distinct, and an empty knowledge store has its own empty state. When the event log is truncated or has bad lines the block shows a notice and says events.jsonl was left untouched. The panel still has no write actions.
- **Two more read-only blocks (M2)**: "To review" (candidate / disputed / stale lessons plus why each is held back, using the retrieval layer's Chinese skipped-reason labels) and "Write log" (bridge application records from <journalDir>/bridge/: target, time, lessonId@revision, before/after hashes, rollbackable and why). Every lesson gets a "copy review command"; bridgeable (usable) lessons get a "copy preview command"; if the clipboard fails it falls back to selectable text. The panel still has no write methods.

## 0.4.1 (2026-09-29)

- **Fixes a Desktop boot failure**: the front-end module id now matches the scoped package name (it used to register as `dsh-dream`, so the host retried the bundle and threw `duplicate factory registration`, ending in `1 entry did not activate`). No journal or config migration.

## 0.4.0 (2026-09-29)

Adds a read-only dream-journal panel: open **Settings →「梦境日记」(Dream journal)** to see totals, mood distribution, the lessons board and a card timeline, with keyword search. Long reflections fold automatically and a one-click privacy blur is available. The panel is read-only and the storage format is unchanged — no migration needed.
