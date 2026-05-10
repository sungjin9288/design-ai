# Dogfood findings — npm fresh install (Phase 41)

End-to-end test of the npm distribution path. Pack the package, install into a clean temp dir, run the full CLI lifecycle, verify symlinks created/removed correctly.

**Scope**: real `npm pack` → real `npm install <tarball>` → real `node cli/bin/design-ai.mjs ...` → real `design-ai` PATH bin → real symlink farm against a fake `CLAUDE_HOME`.

## Procedure

```bash
# 1. Pack the published shape
npm pack
# → design-ai-cli-4.7.0.tgz (1.1MB, 436 files)

# 2. Install in a fresh temp dir
FRESH=$(mktemp -d)
cp design-ai-cli-4.7.0.tgz "$FRESH/"
cd "$FRESH" && npm init -y && npm install ./design-ai-cli-4.7.0.tgz

# 3. Run lifecycle commands
node node_modules/@design-ai/cli/cli/bin/design-ai.mjs version
node node_modules/@design-ai/cli/cli/bin/design-ai.mjs help
node node_modules/@design-ai/cli/cli/bin/design-ai.mjs list skills
node node_modules/@design-ai/cli/cli/bin/design-ai.mjs list commands

# 4. Test install + status + uninstall against a fake CLAUDE_HOME
CLAUDE_HOME=/tmp/fake-claude-home node ... install
CLAUDE_HOME=/tmp/fake-claude-home node ... status
CLAUDE_HOME=/tmp/fake-claude-home node ... uninstall

# 5. Verify bin shim works on PATH
PATH="$FRESH/node_modules/.bin:$PATH" design-ai version
```

## What worked

### 1. `npm pack` allowlist correct

```
package size:    1.1 MB
unpacked size:   3.3 MB
total files:     436
```

Shipped: `cli/`, `install.sh`, `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`, `LICENSE`, `README.md`, `.claude-plugin/`, `knowledge/`, `examples/`, `skills/`, `agents/`, `commands/`, `docs/`, `tools/audit/`, `tools/preview/`.

NOT shipped (verified absent):
- `refs/` (gitignored, large upstream sources)
- `tools/extractors/` (dev-only)
- `tools/migrations/` (dev-only — flagged as a possible omission, see below)
- `vscode-extension/` (separate package)
- `node_modules/`, `.git/`, `*.tgz`

### 2. `version` command resolves correctly

```
ℹ  design-ai CLI:    4.7.0
ℹ  Plugin / corpus:  4.7.0
ℹ  Source:           /private/var/folders/.../node_modules/@design-ai/cli
```

CLI version + plugin manifest version both at 4.7.0 — alignment audit step 2 of RELEASE-CHECKLIST holds end-to-end.

### 3. `list skills` / `list commands` enumerate correctly

19 skills + 16 commands enumerated from the plugin manifest. Names + descriptions render. No truncation issues with Korean character descriptions.

### 4. Install lifecycle works against fake `CLAUDE_HOME`

```
CLAUDE_HOME=/tmp/fake-claude-home design-ai install
✓  Installed 19 skills (prefix: design-)
✓  Installed 4 agents (prefix: design-)
[16 commands also installed]
```

Verified symlinks:
```bash
$ readlink /tmp/fake-claude-home/skills/design-color-palette
/private/var/folders/.../node_modules/@design-ai/cli/skills/color-palette/
```

Symlinks point INTO the npm-installed package — adopters who upgrade via `npm install -g @design-ai/cli@latest` get fresh content automatically.

### 5. Uninstall removes all symlinks

```
✓  Removed 39 design-ai symlinks
```

19 + 4 + 16 = 39 ✓. Post-uninstall, `~/.claude/{skills,agents,commands}/` are clean — no orphan symlinks.

### 6. `design-ai` PATH shim works

After `npm install`, the package's `bin` field creates a `node_modules/.bin/design-ai` shim. Adding that to PATH lets adopters run `design-ai` directly.

## Issues surfaced

### 1. `tools/migrations/` not in npm package

**Severity**: MEDIUM (adopter-blocker for `/stability-review`).

The `package.json` `files` allowlist includes `tools/audit/` but NOT `tools/migrations/`. The `/stability-review` slash command (added in v4.6) tells users to run:

```bash
python3 tools/migrations/promote-stability.py ...
python3 tools/migrations/bump-last-updated.py ...
```

Adopters who installed via npm don't have these scripts. Two options:
- Add `tools/migrations/` to the npm allowlist (small ship — these are <300 LOC each, useful for adopters running their own quarterly review).
- Update the slash command to fetch the scripts from GitHub raw URLs (heavier, online-only).

**Recommendation**: ship `tools/migrations/` in npm. They're small, useful, and stability review IS a documented adopter ritual.

**Action shipped**: added to allowlist.

### 2. `install.sh` declares `v3.1` in its header banner

**Severity**: LOW (cosmetic).

The legacy `install.sh` shell script — which the npm `install` command invokes via the JS wrapper — has a hardcoded `v3.1` in its header. The actual install logic uses live values from the manifest, so functionally it's fine, but the banner reading "design-ai installer / v3.1" is misleading.

**Recommendation**: read version from `.claude-plugin/plugin.json` at install-banner time.

**Deferred**: shell-script edit; minor; will land in next CLI polish pass.

### 3. `tools/audit/` ships but `run-all.py` references files NOT in the npm package

**Severity**: LOW.

`tools/audit/run-all.py` is shipped via the `tools/audit/` allowlist. It internally calls scripts including `check-coverage.py` which itself reads `knowledge/components/index.json`. That file IS shipped (it's under `knowledge/`). Good.

But the integration check expects `docs/integrations/` (shipped ✓), the stale check expects `knowledge/` (shipped ✓), the link check expects everything (shipped ✓). All paths resolve.

Verified: an adopter who installs via npm CAN run `npm run audit` from inside their own project IF they invoke it against the package directory. They can't run it against their own files (which is fine — audits are repo-scoped). 

### 4. No `npm test` runnable in installed package

**Severity**: INFO.

Adopters can't run `npm test` because `cli/lib/*.test.mjs` IS shipped (in `cli/`) but `package.json`'s `scripts.test` is the design-ai repo's CI runner, not a meaningful adopter command.

**Recommendation**: drop `scripts.test` in published-shape OR add a `cli:smoke` script that runs `version + help + status + list` as adopter health-check.

**Deferred**: low priority; adopters unlikely to `npm test` an installed CLI.

## Verified — fresh-machine path

This dogfood is approximately what a clean adopter sees:

1. Run `npx @design-ai/cli install` (or `npm install -g`).
2. Get the full corpus + CLI in one command.
3. Run `design-ai status` — see what's installed.
4. Skills + commands + agents available globally in `~/.claude/`.
5. Uninstall is reversible.

The only gap from a true fresh-machine test: I had Node 18+ already available. A truly cold environment should also test the Node version check (CLI uses ESM modules, requires Node 18+).

## Performance numbers

| Step | Time |
| --- | --- |
| `npm pack` | ~3 s |
| `npm install ./tarball.tgz` (cold cache) | ~0.5 s |
| `design-ai version` | ~80 ms |
| `design-ai install` (39 symlinks) | ~150 ms |
| `design-ai uninstall` | ~50 ms |

Sub-second install + uninstall — adopter trial loop is friction-free.

## What this validates

- npm `files` allowlist correct (no leakage of dev sources).
- CLI version resolution end-to-end.
- Install / status / uninstall lifecycle.
- Symlink creation + cleanup.
- Korean character handling in `list` output.
- `design-ai` PATH bin works.

## What this does NOT validate

- Windows install (POSIX symlinks behave differently; `install.sh` may need cmd-shim equivalent).
- Sandboxed environments (corporate firewalls, npm proxy).
- Concurrent installs (multiple `design-ai install` running in parallel).
- npm publish flow (would push to actual npm — deferred to launch).
- `npx @design-ai/cli install` (one-shot path; tested install path uses 2 steps).

## Cross-reference

- [`docs/DOGFOOD-V4-FINDINGS.md`](DOGFOOD-V4-FINDINGS.md) — Phase 39 (corpus content)
- [`docs/DOGFOOD-V4-VSCODE-FINDINGS.md`](DOGFOOD-V4-VSCODE-FINDINGS.md) — Phase 40 (VS Code extension)
- [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) "NPM package preview" — pre-release `npm pack --dry-run` step
