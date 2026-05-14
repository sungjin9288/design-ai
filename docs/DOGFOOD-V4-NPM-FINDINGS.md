# Dogfood findings - npm fresh install (Phase 41, refreshed for v4.13)

End-to-end test of the npm distribution path. Pack the package, install into a clean temp project, run the full CLI lifecycle, and verify symlinks are created and removed against a fake `CLAUDE_HOME`.

**Scope**: real `npm pack` -> real `npm install <tarball>` -> real `design-ai` package bin -> real symlink farm against a temporary Claude Code home.

## Automated procedure

```bash
npm run package:smoke
```

`tools/audit/package-smoke.py` now performs the manual dogfood path:

- reuses `tools/audit/smoke_assertions.py` for doctor JSON parsing, ANSI detection, and required-check assertions
- installs the packed `.tgz` into a fresh temp npm project
- verifies `node_modules/.bin/design-ai` exists
- runs `version`, `help`, `list skills`, `install`, `doctor --json`, `doctor --strict`, `status`, and `uninstall`
- asserts every required `doctor --json` package/release/install check reports `PASS`
- uses a fake `CLAUDE_HOME` and `DESIGN_AI_PREFIX=smoke-design-`
- sets `NO_COLOR=1` and fails if wrapped commands emit ANSI escape sequences
- runs a local tarball `npm exec --package ... -- design-ai ...` path to simulate one-shot `npx`
- asserts the `doctor --json` required PASS set for both direct install and one-shot `npm exec` install

The local `npm run release:check` gate and the GitHub audit/publish/release workflows call `npm run release:self-test`, which runs the doctor, shared smoke, package smoke, and registry smoke assertion self-tests before package contents or tarball smoke checks. The same package smoke runs in publish/release workflows after `npm pack`.

## Current result

Latest local tarball smoke:

```text
@design-ai/cli@4.13.0
package size: 1.3 MB
unpacked size: 3.9 MB
total files: 490
Smoke assertions self-test passed
Package smoke passed
```

The installed-package doctor reported:

```text
Summary: 15 pass, 0 warning(s), 0 failure(s)
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

`list skills` reads the packed plugin manifest and enumerates 19 skills. `doctor --strict` confirms the installed package has all 39 expected symlink targets.

### 4. Install lifecycle works against fake `CLAUDE_HOME`

Package smoke installs into a temp Claude home, verifies all source/runtime checks are clean, then uninstalls the same symlink set. The symlinks point into the npm-installed package, so package upgrades refresh the installed design corpus without copying stale files.

### 5. `NO_COLOR` behavior is covered

The smoke path sets `NO_COLOR=1` and checks captured CLI output for ANSI escape sequences. This covers CI logs, package smoke logs, and non-interactive install usage.

### 6. Shared smoke assertions are independently covered

`npm run release:self-test` now includes `npm run smoke:assertions:self-test`, which exercises the common helper used by package and registry smoke tests. It proves that ANSI escape detection, malformed doctor JSON handling, and required doctor check failures fail closed before the helper is used inside tarball or registry smoke paths.

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
2. Run `design-ai version`, `help`, and `list skills`.
3. Run `design-ai install` against an empty Claude Code home.
4. Run `design-ai doctor --strict` and `design-ai status`.
5. Run `design-ai uninstall` and confirm the symlink farm is removed.
6. Run the same lifecycle through local tarball `npm exec --package ...` to cover the `npx`-style bin path, including the same `doctor --json` PASS assertions.

The path confirms package contents, bin shim creation, one-shot npm execution, version alignment, symlink creation, symlink cleanup, Korean character handling in catalog output, and no-color smoke logs.

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
