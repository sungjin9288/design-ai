# P14A v5.1.0 release preparation

Date: 2026-07-16

## Scope

This batch publishes the additive P6-P13 review-to-verified-iteration workflow.
It changes release identity and release-facing truth only. It does not add a new
runtime capability, dependency, migration, external data write, or VS Code
extension release.

Changed release identity:

- `package.json`: 5.0.0 to 5.1.0
- `.claude-plugin/plugin.json`: 5.0.0 to 5.1.0
- `vscode-extension/package.json`: unchanged at 0.4.1

## SemVer decision

The release is minor because P6-P13 add commands, SDK exports, MCP tools, Website
Console imports, and contracts without removing or changing the published v5.0.0
public identities. The three opt-in learning-profile write tools and their write
boundary remain unchanged.

## Public truth before tag

- npm `latest`: 5.0.0
- GitHub Release: v5.0.0
- Homebrew formula: v5.0.0
- GitHub Pages: available
- v5.1.0: release candidate only

## Required gates

- `npm run release:metadata`
- `npm run package:check`
- `npm run release:check`
- Pull-request required checks
- Main-branch audit and documentation deployment
- Tag-triggered npm Trusted Publishing and GitHub Release
- Public `npm run registry:smoke`
- Homebrew formula checksum, style, install, and test

## Local release result

`npm run release:check` passed against the v5.1.0 package candidate on
2026-07-16.

- Unit tests: 832 passed, 0 failed
- Strict repository audits: all 8 passed
- Package inventory: 774 files
- Packed size: 2.5 MB
- Unpacked size: 10.9 MB
- Release metadata: v5.1.0, 8 audits, 2026-07 changelog
- Documentation warning policy: 0 warnings
- Installed-bin package smoke: passed
- One-shot `npm exec --package <tarball>` smoke: passed
- Installer lifecycle: 21 skills, 4 agents, 16 slash commands; 41 links removed
  cleanly by the uninstall smoke

The exact-tree gate passed after this evidence record was added. Pull-request,
tag, public registry, GitHub Release, and Homebrew results remain pending until
those external steps actually complete.

## Claim boundary

Passing these gates establishes package and distribution integrity for v5.1.0.
It does not establish external adoption, production design quality, customer
outcomes, or fabricated pilot feedback.
