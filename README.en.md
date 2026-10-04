# dsh-dream

[中文](README.md)

![dsh-dream whale girl plugin cover](https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/assets/cover-whale-girl.png)

Collect candidate lessons from completed tasks, review them and reuse relevant memories. Manual reflections remain available.

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

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

Use DSH normally. A completed turn qualifies when it contains an explicit preference/correction or at least two non-Dream tool calls. Within the configured budget, Dream creates candidates. Open Settings → Dream Journal to inspect their sources and accept them; relevant later tasks retrieve accepted memories automatically. You can still ask for a separate reflection and journal entry.

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

## License

[MIT](LICENSE)
