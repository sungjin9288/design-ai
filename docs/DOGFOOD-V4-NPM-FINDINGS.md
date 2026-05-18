# Dogfood findings - npm fresh install (Phase 41, refreshed for v4.13)

End-to-end test of the npm distribution path. Pack the package, install into a clean temp project, run the full CLI lifecycle, and verify symlinks are created and removed against a fake `CLAUDE_HOME`.

**Scope**: real `npm pack` -> real `npm install <tarball>` -> real `design-ai` package bin -> real symlink farm against a temporary Claude Code home.

## Automated procedure

```bash
npm run package:smoke
```

`tools/audit/package-smoke.py` now performs the manual dogfood path:

- reuses `tools/audit/smoke_assertions.py` for doctor JSON parsing, `doctor --strict` human diagnostics, ANSI detection, and required-check assertions
- installs the packed `.tgz` into a fresh temp npm project
- verifies `node_modules/.bin/design-ai` exists
- runs `version`, top-level `help`, `help --json`, every expected public `design-ai help <command>` topic with usage assertions, every documented help alias, every documented command alias with output assertions, functional aliases (`find`, `cat`, `recommend`, `example`, `ex`, `ls`, `lint`), `list skills`, `list commands`, `list agents`, human and JSON `search` / `show` / `examples` output, explicit `show --lines` ranges and `route --explain` output, unknown route-id/option/value suggestion and numeric range failures, `install`, `doctor --json`, `doctor --strict`, `status`, and `uninstall` with lifecycle output assertions
- verifies prompt/pack `--out --force` file writes by seeding an existing file, then checking both the generated artifact content and the `Wrote <path>` confirmation output
- asserts every required `doctor --json` package/release/install check reports `PASS` and `doctor --strict` prints the complete clean diagnostics summary
- uses a fake `CLAUDE_HOME` and `DESIGN_AI_PREFIX=smoke-design-`
- sets `NO_COLOR=1` and fails if wrapped commands emit ANSI escape sequences
- runs a local tarball `npm exec --package ... -- design-ai ...` path to simulate one-shot `npx`, including its own version/top-level help checks, `help --json` catalog read, help topic usage, help alias, command alias, functional alias output, list catalog, corpus discovery smoke, explicit `show --lines` ranges and `route --explain` output, unknown route-id/option/value suggestion and numeric range failures, prompt/pack forced file-write confirmation smoke, and install/`doctor --strict`/status/uninstall lifecycle output assertions
- asserts the `doctor --json` required PASS set for both direct install and one-shot `npm exec` install

The local `npm run release:check` gate and the GitHub audit/publish/release workflows call `npm run release:self-test`, which runs the audit runner, coverage timestamp preservation, doctor, shared smoke, package smoke, registry smoke, and release metadata assertion self-tests before package contents or tarball smoke checks. The same package smoke runs in publish/release workflows after `npm pack`.

## Current result

Latest local tarball smoke:

```text
@design-ai/cli@4.13.0
package size: 1.3 MB
unpacked size: 4.3 MB
total files: 495
Smoke assertions self-test passed
Release metadata self-test passed
Package smoke passed
```

The installed-package doctor reported:

```text
Summary: 16 pass, 0 warning(s), 0 failure(s)
Audit scripts: 8 repository audit script(s) found
Doctor assertions helper: tools/audit/doctor_assertions.py found
Smoke assertions helper: tools/audit/smoke_assertions.py found
Package contents check: tools/audit/package-contents.py found
Package smoke check: tools/audit/package-smoke.py found
Registry smoke check: tools/audit/registry-smoke.py found
Installed skills: 19/19 installed
Installed agents: 4/4 installed
Installed slash commands: 16/16 installed
```

Uninstall removed 39 symlinks: 19 skills + 4 agents + 16 slash commands.

## What worked

### 1. `npm pack` allowlist is release-safe

Shipped: `cli/`, `install.sh`, `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`, `LICENSE`, `README.md`, `.claude-plugin/`, `knowledge/`, `examples/`, `skills/`, `agents/`, `commands/`, `docs/`, `tools/audit/`, `tools/migrations/`, and `tools/preview/`.

Not shipped:

- `refs/` (large upstream source material)
- `tools/extractors/` (dev-only extraction tooling)
- `vscode-extension/` (separate package surface)
- `node_modules/`, `.git/`, packed `*.tgz` outputs
- `cli/**/*.test.mjs` and other test/spec files

### 2. Version alignment resolves end-to-end

`design-ai version` reports both CLI and plugin/corpus version as `4.13.0`. The installer banner also reads the package plugin manifest through the JS wrapper, so the user-facing install path no longer shows a stale legacy version.

### 3. Catalog commands enumerate the shipped corpus

`list skills`, `list commands`, and `list agents` read the packed plugin manifest and enumerate 19 skills, 16 commands, and 4 agents. The smoke assertions verify the section count and expected item names for each domain. `doctor --strict` confirms the installed package has all 39 expected symlink targets.

### 4. Install lifecycle works against fake `CLAUDE_HOME`

Package smoke installs into a temp Claude home, verifies all source/runtime checks are clean, then uninstalls the same symlink set. The symlinks point into the npm-installed package, so package upgrades refresh the installed design corpus without copying stale files.

### 5. `NO_COLOR` behavior is covered

The smoke path sets `NO_COLOR=1` and checks captured CLI output for ANSI escape sequences. This covers CI logs, package smoke logs, and non-interactive install usage.

### 6. Shared smoke assertions are independently covered

`npm run release:self-test` now includes `npm run smoke:assertions:self-test`, which exercises the common helper used by package and registry smoke tests. It proves that ANSI escape detection, malformed doctor JSON handling, and required doctor check failures fail closed before the helper is used inside tarball or registry smoke paths.

### 7. Coverage timestamp preservation is covered

`npm run release:self-test` now includes `npm run coverage:self-test`, which exercises `check-coverage.py` without touching `knowledge/COVERAGE.md`. It proves unchanged reports preserve the existing `generated_at` value while real report content changes refresh the date.

### 8. Audit runner exit-code behavior is covered

`npm run release:self-test` now includes `npm run audit:runner:self-test`, which exercises `run-all.py` without invoking the repository audits. It proves strict mode exits non-zero on failures, warn-only mode keeps exit code 0 while naming failed audits, and the eight-audit release gate count stays explicit.

### 9. Release metadata drift is covered

`npm run release:metadata` now verifies package/plugin version alignment, the top CHANGELOG entry, the current ROADMAP phase, required release sections, and the documented eight-audit count. This prevents a release from passing when the implementation version and release narrative drift apart.

## Issues surfaced

### 1. `tools/migrations/` missing from npm package - resolved

**Original severity**: MEDIUM.

The v4.7 package omitted `tools/migrations/`, which blocked the documented `/stability-review` workflow for npm adopters. The package allowlist now includes `tools/migrations/`, and the v4.13 dry-run tarball includes those scripts.

### 2. Legacy `install.sh` banner version - resolved

**Original severity**: LOW.

The old install path showed a hardcoded `v3.1` banner. The JS install command now reads `.claude-plugin/plugin.json` and prints `v4.13.0`; the package smoke verifies the shipped install path.

### 3. ANSI color leaked into package smoke logs - resolved

**Original severity**: LOW.

The shell installer previously emitted color escapes in non-interactive smoke output. `install.sh` now disables color when `NO_COLOR` is set or stdout is not a TTY, and `package-smoke.py` fails if wrapped commands emit ANSI escapes.

### 4. `npm test` remains repo-only in installed package - accepted

**Severity**: INFO.

The package intentionally excludes test files. Adopter health is covered by `tools/audit/package-smoke.py` and `design-ai doctor --strict`, while repository correctness remains covered by `npm test` before packing.

## Verified fresh-install path

This dogfood approximates what a clean adopter sees:

1. Install the packed CLI package.
2. Run `design-ai version`, top-level `help`, `help --json`, every expected command-specific help topic from the catalog with usage assertions, every documented help alias, every documented command alias with output assertions, functional aliases (`find`, `cat`, `recommend`, `example`, `ex`, `ls`, `lint`), all three `list` catalog domains, human / JSON `search`, `show`, and `examples`, explicit `show --lines` ranges and `route --explain` output, unknown route-id/option/value suggestion and numeric range failures, and prompt/pack forced file-output flows.
3. Run `design-ai install` against an empty Claude Code home and assert the installer reports 19 skills, 4 agents, and 16 slash commands.
4. Run `design-ai doctor --strict` and `design-ai status`, asserting doctor reports 16 pass / 0 warnings / 0 failures and status reports the same installed counts.
5. Run `design-ai uninstall` and assert the symlink farm removal reports 39 removed links.
6. Run the same lifecycle through local tarball `npm exec --package ...` to cover the `npx`-style bin path, including independent version/top-level help checks, `help --json` catalog read, documented help topic usage and alias smoke, command alias smoke, functional alias smoke, list catalog smoke, corpus discovery smoke, explicit `show --lines` ranges and `route --explain` output, unknown route-id/option/value suggestion and numeric range failures, prompt/pack forced file-write confirmation smoke, lifecycle output smoke, `doctor --strict` human diagnostics assertions, and the same `doctor --json` PASS assertions.

The path confirms package contents, bin shim creation, one-shot npm execution, version alignment, machine-readable help-topic discoverability, manifest catalog enumeration, human-readable corpus discovery, explicit line-range display, route explanation details, route-id, option, search-directory value typo recovery, and numeric range validation, prompt/pack forced file-write UX, symlink creation, symlink cleanup, Korean character handling in catalog output, and no-color smoke logs.

## What this does not validate

- Windows install behavior; POSIX symlinks may need a separate implementation.
- Corporate npm proxy, sandboxed shell, or restricted filesystem environments.
- Concurrent `design-ai install` executions.
- Actual `npm publish`, which would push to the public registry.
- Public-registry `npx @design-ai/cli install`; package smoke covers the equivalent local tarball `npm exec --package` path before publish.

## Cross-reference

- [`docs/DOGFOOD-V4-FINDINGS.md`](DOGFOOD-V4-FINDINGS.md) - Phase 39 corpus content dogfood
- [`docs/DOGFOOD-V4-VSCODE-FINDINGS.md`](DOGFOOD-V4-VSCODE-FINDINGS.md) - Phase 40 VS Code extension dogfood
- [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) - pre-release verification checklist
- [`tools/audit/package-smoke.py`](../tools/audit/package-smoke.py) - automated npm tarball smoke
