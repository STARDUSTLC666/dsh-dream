# dsh-dream

[中文](README.md)

![dsh-dream whale girl plugin cover](https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/assets/cover-whale-girl.png)

Collect candidate lessons from completed tasks, then let users review and accept them for relevant future work. Supports automatic collection, contextual recall, source checks, scope and manual reflection; candidates do not become accepted memories automatically.

Only lessons you accept in the panel are reused automatically. A model's `dream_review accept` recommends review and leaves the lesson unchanged. Earlier model approvals need human review again. Global acceptance requires an explicit confirmation that the lesson applies to all projects. `dream_bridge` now defaults to a read-only preview.

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-total-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

[Download statistics](https://github.com/STARDUSTLC666/dsh-suite/blob/npm-downloads/README.md)

Feedback and contributions are welcome: report [issues](https://github.com/STARDUSTLC666/dsh-dream/issues) or submit [pull requests](https://github.com/STARDUSTLC666/dsh-dream/pulls).

Open the workbench from the native DSH sidebar. See the [workbench guide](docs/WORKBENCH.md) for configuration and operating boundaries.

## What it does

- Browse journals, retrieve lessons and inspect their sources.
- Collect candidates after tasks and retrieve accepted memories for relevant tasks, with separate switches.
- Consolidate after quiet time, retain turns during cooldown or quota limits, and control use and contribution per chat.
- Review lessons, resolve conflicts and record separate usage feedback.
- Review candidates by project/topic; pause expired facts until they are reviewed again.
- Preview AGENTS.md changes before applying them, with rollback support.

## Install

In DSH Desktop, install `@stardustlc/dsh-dream` from the Plugins panel. If the bundled dsh command is available:

```bash
dsh plugin --profile desktop add @stardustlc/dsh-dream
```

For the web version, replace `desktop` with `web`. Restart DSH after installation.

## Start using it

1. Open Dream memory in the sidebar and choose whether to use automatic organization and recall.
2. Complete real work and check Pending review after an eligible task, or explicitly ask for a retrospective.
3. Expand a candidate, inspect sources, scope, conditions and exceptions, then decide whether to accept it.
4. Recall accepted experience in relevant tasks; edit, revoke or review it in Accepted when needed.

Automatic collection uses the current session's model and quota. By default, it waits for 60 quiet seconds, merges up to four turns in the same project, and allows four calls per day at least ten minutes apart, with 1200 output tokens per call. Cooldown and quota limits defer turns; new input stops auxiliary work and retains unfinished excerpts. The bounded queue keeps up to 32 turns for 24 hours and survives restart. Ordinary chat is skipped.

New memories await review: inspect the source quote, conditions and exceptions before accepting them. Facts require review after 30 days by default; stable preferences have no default expiry. Retrieval is reference exposure, not renewed verification. Acceptance and project-rule changes remain separate actions. UI language follows DSH; journal and lesson content stays original.

## Requirements and configuration

Uses local DSH sessions and journals with secret masking. Automatic features use official session events and dynamic prompt context; interactive actions use the authenticated Connection channel. Verified with 0.2.0-rc.2 and 0.2.1-alpha.1. Hosts without the automatic interfaces retain tools and skills.

Detailed configuration, tool arguments and troubleshooting are in the [usage guide](docs/USAGE.en.md). For standalone development, follow the Node requirement in [package.json](package.json).

## Documentation

- [Usage and troubleshooting](docs/USAGE.en.md)
- [Changelog](CHANGELOG.md)
- [Validation scope and history](docs/VALIDATION.md)
- [Report a problem or suggest a feature](https://github.com/STARDUSTLC666/dsh-dream/issues)

## Plugin updates

Requires DSH 0.2.1-rc.3 or newer. Update controls sit at the bottom of the existing workbench, or native plugin details for plugins without a workbench. Checks, release notes and preferences expand in place, with no separate update page or settings menu. Automatic checks are on by default; **automatic installation is off by default**. Only explicit opt-in permits compatible stable patches while idle with no unsaved changes. Preferences are independent, with per-plugin disable, deferral and ignore controls. No forced DSH restart or upgrade, and local-source installations stay unchanged. Suite components explain and operate on the whole Suite in the same footer.

Older releases need one manual update in native plugin management to acquire these controls. Publishing to npm does not replace an existing user installation.

## License

[MIT](LICENSE)
