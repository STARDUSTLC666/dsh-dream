[简体中文](README.md) · **English**

# Dream

**DeepSeek Harness native task-memory plugin: turn completed DSH tasks into verified lessons for the next one.**

Built for DeepSeek Harness `>=0.2.2-rc.3`, with five switchable light/warm workbench styles (Harness Native, Cream Paper, Claude Warm, 8-Bit Pixel, Mint Air) synced across plugins, command palette quick switching, eight UI locales, and a soft-slate dark mode.

[![npm](https://img.shields.io/npm/v/@stardustlc/dsh-dream)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-dream-total-downloads.svg)](https://www.npmjs.com/package/@stardustlc/dsh-dream)

**[Install](#install) · [Workflow](#start-using-it) · [Full guide](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-dream/master/docs/assets/intro/workflow-en-light.svg" alt="Turn completed DSH tasks into lessons for the next one. · workflow illustration" width="100%">
</picture>

## Features

- Collect candidates after real tasks, within your settings and limits.
- Inspect sources, scope, conditions, and exceptions before accepting or writing to `AGENTS.md`.
- Reuse accepted lessons in relevant tasks with masked source context and bridge audit logs.
- Switch between five workbench styles (Harness Native, Cream Paper, Claude Warm, 8-Bit Pixel, Mint Air) with subtle micro-interactions, portaled overlay sync, and DSH `>=0.2.2-rc.3` host primitives and frame clearances.

## Review before reuse

[![Inspect candidate sources, scope, and evidence, switch workbench styles, and confirm acceptance in Dream](docs/assets/intro/screen-en.webp)](docs/assets/intro/screen-en.webp)

*Captured with `Dream 0.16.1` running in Harness Web `0.2.2-rc.3` (Cream Paper style). Open a candidate, check its source and scope, accept it, and find it in **Accepted**.*

## Install

Open **Plugins** in the DSH desktop app and install `@stardustlc/dsh-dream`. If the CLI is available:

```bash
dsh plugin --profile desktop add @stardustlc/dsh-dream
```

For the web profile, replace `desktop` with `web`. Restart that DSH profile after installation. The package’s DSH requirement is `>=0.2.2-rc.3`.

## Start using it

Dream works best as a lightweight **Accumulate → Reflect & distill → Review & adopt → Auto-recall** loop:

1. **Accumulate naturally**: Open **Dream memory** from the sidebar and choose your **Auto collect** and **Auto recall** switches. Complete real debugging or coding tasks as usual — idle turns automatically queue qualifying candidates into **Awaiting review**.
2. **Reflect & distill on demand**: Anytime you want a retrospective or a journal entry, use the 1-click copy prompt buttons right inside **Awaiting review** or **Journal** and paste into chat so the assistant replays recent sessions and distills source-backed candidates.
3. **Review & adopt**: Inspect session evidence, scope, conditions, and exceptions in **Awaiting review** (`J`/`K` to navigate, `A` to accept, `D` to discard). Candidates never take effect until you explicitly accept them.
4. **Recall & codify**: Matching accepted lessons are recalled automatically in future tasks; durable project conventions can be previewed as a diff before writing to `AGENTS.md`, with 1-click rollback in **Rule history**.

Handy chat prompts (1-click copyable in the workbench):

- `Have a dream` — replay recent sessions and record a reflection entry in **Journal**.
- `Review our recent conversation and distill reusable project lessons` — extract source-linked candidates into **Awaiting review**.

## Before you start

Candidates are never automatically accepted. Collection uses the current chat’s model and quota; collection and recall have separate switches.

Configuration, detailed tools and troubleshooting: [full reference](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.en.md).

## Behind a reverse proxy

The panel routes accept loopback peers and localhost Hosts only, so a browser reaching DSH through a reverse proxy gets 403. Both allow-lists are empty by default and match exactly:

```yaml
# this plugin's config in cordis.patch.yml
trustedRemoteAddresses: ['192.0.2.10']         # example; replace with the proxy's own source address
trustedHosts: ['dsh.example.com']             # needed when the proxy preserves the public Host
```

`DSH_DREAM_TRUSTED_REMOTE_ADDRESSES` / `DSH_DREAM_TRUSTED_HOSTS` (comma separated) work too; config wins. The two gates are ANDed: an address-only entry still fails when the Host is a public name, and the 403 message names the missing piece. A listed peer is no longer held to loopback, so list only the proxy itself and keep an authentication layer in front of it.

## Plugin updates

Check updates at the bottom of the workbench or native plugin details. Automatic checks are on by default; **automatic installation is off**. You choose whether to install and when to restart. Suite-managed components update with their bundle. [Update behavior](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.en.md).

## Documentation

- [Full usage, configuration and limits](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/REFERENCE.en.md)
- [Release notes](https://github.com/STARDUSTLC666/dsh-dream/blob/master/CHANGELOG.md)
- [Validation scope and history](https://github.com/STARDUSTLC666/dsh-dream/blob/master/docs/VALIDATION.md)

## Feedback and contributions

If the plugin helps, a Star makes it easier for others to discover. Report problems or suggest improvements in [Issues](https://github.com/STARDUSTLC666/dsh-dream/issues); code and documentation [PRs](https://github.com/STARDUSTLC666/dsh-dream/pulls) are welcome. Include versions and reproduction steps, and remove credentials from reports.

## License

[MIT](https://github.com/STARDUSTLC666/dsh-dream/blob/master/LICENSE)

<a id="what-it-does"></a>
<a id="requirements-and-configuration"></a>
