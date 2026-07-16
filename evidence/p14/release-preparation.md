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

## Public release result

- PR #48 passed required CI and was squash-merged as commit
  `8a753359b585e439172e44219710d2f57e44c5ef`.
- Main Audit run `29485559867` and Docs run `29485559848` passed, including real
  VS Code e2e and GitHub Pages deployment.
- npm Trusted Publishing run `29485715200` published
  `@design-ai/cli@5.1.0` at `2026-07-16T09:18:28.771Z`; npm `latest` resolves to
  the same version, the SLSA provenance predicate is
  `https://slsa.dev/provenance/v1`, and public registry smoke passed.
- GitHub Release run `29485715193` published `v5.1.0` at
  `2026-07-16T09:17:29Z`. Asset `design-ai-cli-5.1.0.tgz` is 2,589,235 bytes with
  digest `sha256:f05854b4bc81e626096cfe85151f7e8149e3ecbd518c1ff1598e7667b2f7c8fc`.
- The tag archive SHA-256 is
  `66bf42c34ad1bf65f7db0a644353094a5fba715720f108549f69b3f0580b22b1`.
  The v5.1.0 Homebrew formula passed Ruby syntax, `brew style`, temporary-tap
  source install, `brew test`, and installed CLI version parity.

## Claim boundary

Passing these gates establishes package and distribution integrity for v5.1.0.
It does not establish external adoption, production design quality, customer
outcomes, or fabricated pilot feedback.
