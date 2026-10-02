# dsh-dream

[中文](README.md)

Review past sessions, keep reflections and reuse verified, reviewed lessons.

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://img.shields.io/npm/dm/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

## What it does

- Browse journals, retrieve lessons and inspect their sources.
- Review lessons, resolve conflicts and record separate usage feedback.
- Preview AGENTS.md changes before applying them, with rollback support.

## Install

In DSH Desktop, install `@stardustlc/dsh-dream` from the Plugins panel. If the bundled dsh command is available:

```bash
dsh plugin --profile desktop add @stardustlc/dsh-dream
```

For the web version, replace `desktop` with `web`. Restart DSH after installation.

## Start using it

Ask to review recent tasks and keep useful lessons. Open Settings → Dream Journal to inspect sources and review lessons; preview rule changes before applying them.

## Requirements and configuration

Uses local DSH sessions and journals with secret masking. Interactive actions use the DSH 0.2.0-rc.2 authenticated channel; tools and skills also work in headless mode.

Detailed configuration, tool arguments and troubleshooting are in the [usage guide](docs/USAGE.en.md). For standalone development, follow the Node requirement in [package.json](package.json).

## Documentation

- [Usage and troubleshooting](docs/USAGE.en.md)
- [Changelog](CHANGELOG.md)
- [Validation scope and history](docs/VALIDATION.md)
- [Report a problem or suggest a feature](https://github.com/STARDUSTLC666/dsh-dream/issues)

## License

[MIT](LICENSE)
