# Change Log — design-ai for VS Code

All notable changes to the VS Code extension. Aligned with the design-ai corpus version (`x.y.z`) where possible; the extension may release independently for VS Code-specific fixes.

## 0.4.0 — Marketplace-ready package (2026-06)

Prepares the VS Code wrapper for public Marketplace distribution.

### Added
- Language-aware README and walkthrough opening for Korean and English corpus docs.
- Corpus search command for knowledge, examples, skills, and docs.
- Real VS Code integration test coverage for activation, command registration, status, refresh, and settings flows.
- Marketplace publish handoff through the manual `Publish VS Code extension` GitHub Actions workflow.

### Changed
- README listing copy now reflects the current corpus: 20 skills, 223 worked examples, 92 knowledge files, and 5 integration walkthroughs.
- Package metadata and repository links point at `sungjin9288/design-ai`.

### Verified
- `npm run compile`
- `npm test`
- `npx --yes @vscode/vsce@latest package`
- GitHub Actions dry-run package workflow with VSIX artifact upload

## 0.1.0 — Initial release (2026-05)

First public release. Surfaces the design-ai corpus inside VS Code.

### Added
- Activity bar entry with 4 sidebar trees: Skills, Knowledge, Component specs, Integration walkthroughs.
- 8 commands: `Install`, `Show status`, `Open knowledge file`, `Open component spec`, `Open skill PLAYBOOK`, `Open integration walkthrough`, `Refresh tree`, `Open settings`.
- Path auto-probing — finds design-ai at `~/dev/design-ai`, `~/.local/lib/design-ai`, `/opt/design-ai`, npm-global node_modules, Homebrew lib.
- `design-ai.path` setting for non-standard install locations.
- `design-ai.language` setting (`en` / `ko`) for opening Korean translations.
- Settings reactivity — tree refreshes when `design-ai.path` changes.

### Requirements
- VS Code 1.85.0+
- design-ai source installed via npm / Homebrew / git clone
