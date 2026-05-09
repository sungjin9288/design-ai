# Change Log — design-ai for VS Code

All notable changes to the VS Code extension. Aligned with the design-ai corpus version (`x.y.z`) where possible; the extension may release independently for VS Code-specific fixes.

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
