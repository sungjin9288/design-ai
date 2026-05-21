# Distribution

How design-ai gets from this repo into adopters' Claude Code installations.

## Three install paths (pick one)

### A. NPM (recommended for most adopters)

```bash
# One-shot via npx (no global install)
npx @design-ai/cli install

# Or install the CLI globally
npm install -g @design-ai/cli
design-ai install
```

The npm package bundles the corpus (`knowledge/`, `examples/`, `skills/`, `agents/`, `commands/`, `.claude-plugin/`) — adopters don't need to clone anything.

After install, the CLI symlinks the bundled corpus into `~/.claude/skills/`, `~/.claude/agents/`, `~/.claude/commands/` with the `design-` prefix.

### B. Git clone (for contributors)

```bash
git clone https://github.com/sungjin/design-ai.git
cd design-ai
./install.sh
```

Same end state as NPM, but the source is your working clone. Pull updates with `git pull && ./install.sh`.

Use this path if you want to:
- Contribute back upstream.
- Modify knowledge / skills locally.
- Track latest `main` rather than published releases.

### C. Manual symlinks (no install script)

For environments where neither npm nor bash works the way you expect. See [PLUGIN-PACKAGING.md](PLUGIN-PACKAGING.md) for the manual symlink loop.

## CLI commands

```
design-ai install     Symlink design-ai into ~/.claude; use `design-ai install --json` for machine-readable install lifecycle output
design-ai update      Pull latest source + reinstall; use `design-ai update --dry-run` for human preview or `design-ai update --dry-run --json` for a machine-readable update plan
design-ai uninstall   Remove symlinks (keeps source); use `design-ai uninstall --json` for machine-readable uninstall lifecycle output
design-ai status      Show what's installed; use `design-ai status --json` for machine-readable install-state output
design-ai list [kind] List catalog (skills | commands | agents); add --json for machine-readable manifest entries
design-ai route brief Recommend commands, skills, and knowledge files; supports --from-file/--stdin/--list/--limit N/--explain/--json
design-ai routes      List available route ids for prompt/pack --route
design-ai prompt brief Generate a ready-to-use agent prompt; add --out file, --from-file, --stdin, --json, or --route id
design-ai pack brief Generate a prompt plus bounded context files with summary/warnings; add --out file, --from-file, --stdin, --max-bytes N, --json, or --route id
design-ai check file  Check generated Markdown artifact quality; add --examples, --route id, --all-routes, --issues-only, --stdin, --strict, or --json
design-ai examples q Find worked examples; add --route id, --limit N, or --json
design-ai search q    Search local corpus markdown; add --dir kind, --limit N, or --json
design-ai show file   Print a corpus file or line range; add --lines N:M, --context N, or --json
design-ai audit       Run all eight repository audits; use `design-ai audit --strict --quiet --json` for machine-readable repository-audit output
design-ai doctor      Diagnose install and runtime health; use `design-ai doctor --strict` for human diagnostics, or add --json/--fix
design-ai version     CLI + plugin versions; use `design-ai version --json` for machine-readable version metadata
design-ai help [cmd|--json] Show top-level or command-specific help; --json emits a topic catalog
```

Environment overrides:

| Variable | Default | Purpose |
|---|---|---|
| `DESIGN_AI_PREFIX` | `design-` | Symlink name prefix |
| `CLAUDE_HOME` | `~/.claude` | Claude Code home |
| `DESIGN_AI_HOME` | npm package dir or repo root | Source of corpus |
| `VERBOSE` | (off) | Verbose status output |
| `DEBUG` | (off) | Stack traces on error |

## Versioning

Two versions to track:

| Version | What |
|---|---|
| **CLI** (`package.json`) | The npm CLI tool |
| **Plugin / corpus** (`.claude-plugin/plugin.json`) | The knowledge + skills corpus |

For releases, both must match. The publish workflow enforces this:

1. Bump `package.json` version.
2. Bump `.claude-plugin/plugin.json` version to match.
3. Update `CHANGELOG.md`.
4. Commit + tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. GitHub Actions runs the publish and release workflows.

The workflow:
- Verifies tag matches `package.json` version.
- Verifies `package.json` and `plugin.json` versions match.
- Runs `npm run audit:strict` for all 8 audits (frontmatter / link / Korean copy / raw hex / integration / stale / coverage / example QA).
- Runs `npm test` CLI unit tests before publishing or attaching release assets.
- Runs whitespace checks with `git diff --check` before packaging.
- Runs `npm run package:check` to confirm the tarball has required runtime files and excludes test/cache/source-only files.
- Runs `npm run release:metadata` to verify release metadata checks before release self-tests.
- Runs `npm run release:self-test` to validate release assertion fixtures before package smoke.
- Runs `npm run package:smoke` as the packed-tarball smoke gate for installed-bin and one-shot npm exec coverage.
- Runs `npm run ci:local` before Real-CI when preparing a push, including the MkDocs warning policy that allows only intentional `refs/` source-link warnings and caps them at the accepted baseline.
- Installs the packed tarball into a temporary project, smoke-tests the packed-tarball installed-bin path, then repeats the same public CLI surface through one-shot `npm exec --package <tarball>`, validates human `design-ai version` plus machine-readable version metadata from `design-ai version --json` and `design-ai help` top-level help output, reads the `design-ai help --json` topic catalog, verifies the expected public topic and alias set, validates every `design-ai help <command>` topic-specific usage output, smoke-tests documented help and command aliases with output assertions, verifies functional aliases such as `find`, `cat`, `recommend`, `example`, `ex`, `ls`, and `lint`, human and JSON `list skills`, `list commands`, and `list agents`, human and JSON `search` / `show` / `examples` output, verifies route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, verifies unknown command/help/list/search-dir failures, unknown route-id/option/value suggestion, and numeric range failures, verifies prompt/pack JSON/markdown/from-file/stdin output, verifies prompt/pack forced `--out` overwrites plus their `Wrote <path>` confirmations, verifies check examples/artifact/stdin/all-routes output, verifies human and JSON `audit --strict --quiet` including `design-ai audit --strict --quiet --json` machine-readable repository-audit output, verifies human `design-ai update --dry-run` output and `design-ai update --dry-run --json` machine-readable update plan, and verifies human `design-ai install`, machine-readable install lifecycle output from `design-ai install --json`, `design-ai doctor --strict` human diagnostics, human/JSON `status`, `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` plus `design-ai uninstall --json` machine-readable uninstall lifecycle output against a fake `CLAUDE_HOME`.
- Publishes with `--provenance` (npm provenance attestation).
- After publish, smoke-tests the public registry package with `npm exec --package @design-ai/cli@<version>`, including human version output and machine-readable version metadata from `design-ai version --json` plus `design-ai help` top-level help output, the expected `design-ai help --json` catalog, discovered help topic usage output, documented help and command aliases, functional aliases such as `find`, `cat`, `recommend`, `example`, `ex`, `ls`, and `lint`, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command/help/list/search-dir failures, unknown route-id/option/value suggestion, and numeric range failures, prompt/pack JSON/markdown/from-file/stdin output, prompt/pack forced output-file confirmations, check examples/artifact/stdin/all-routes output, human/JSON `audit --strict --quiet` including `design-ai audit --strict --quiet --json` machine-readable repository-audit output, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, and human `design-ai install` plus `design-ai install --json` machine-readable install lifecycle output, `design-ai doctor --strict` human diagnostics, human+JSON status including `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` plus `design-ai uninstall --json` machine-readable uninstall lifecycle output.

## NPM package contents

The `files` field in `package.json` is the allowlist (preferred over `.npmignore`). What ships:

```
@design-ai/cli/
├── cli/                 # CLI source (Node ESM)
├── install.sh           # Bash installer (used by CLI under the hood)
├── AGENTS.md            # Universal agent entry point
├── CLAUDE.md            # Claude Code overlay
├── CHANGELOG.md
├── LICENSE
├── README.md
├── .claude-plugin/      # Plugin manifest
├── knowledge/           # 91 knowledge files (~5MB)
├── examples/            # 99 worked examples (~3MB)
├── skills/              # 19 skill PLAYBOOKs + SKILL.md manifests
├── agents/              # 4 sub-agent definitions
├── commands/            # 16 slash command files
├── docs/                # Architecture + integration guides
└── tools/
    ├── audit/           # audit, release, and smoke scripts (Python)
    └── preview/         # HTML preview generator (Python)
```

Excluded (in `.npmignore` + not in `files`):
- `refs/` — large gitignored upstream sources, regenerated on demand
- `.git/`, `.github/` — VCS metadata
- `node_modules/` — local dependencies
- `tools/extractors/` — only needed for refreshing knowledge from refs/

Tarball target: < 15MB. Run `npm run package:check` to verify package contents.

## Publishing checklist (maintainers)

Before tagging a release:

- [ ] Local CI parity gate passes, including the MkDocs warning policy and refs-only baseline cap: `npm run ci:local`
- [ ] Core automated gate passes: `npm run release:check`
- [ ] Release assertion self-tests pass: `npm run release:self-test`
- [ ] All audits pass: `design-ai audit --strict`
- [ ] `package.json` and `.claude-plugin/plugin.json` versions match
- [ ] `CHANGELOG.md` has an entry for the new version
- [ ] CLI smoke-tested: `node cli/bin/design-ai.mjs help`, `version`, `version --json`, `design-ai status --json`, `list skills`, `list commands`, `list agents`
- [ ] Package contents check passes: `npm run package:check`
- [ ] Tarball size reasonable (< 15MB)
- [ ] README + relevant docs reference current version

Tag and push:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

GitHub Actions takes over from there.

After the npm publish workflow completes, verify the public install path:

```bash
npm run registry:smoke
```

## Alternative: GitHub Release artifacts

For users who don't want npm, the tag workflow attaches the same npm-packed tarball to the GitHub Release. This keeps the release asset aligned with the `package.json` `files` allowlist instead of maintaining a separate hand-written tar command.

```bash
# After a v* tag release
curl -LO https://github.com/sungjin/design-ai/releases/download/vX.Y.Z/design-ai-cli-X.Y.Z.tgz
tar xzf design-ai-cli-X.Y.Z.tgz
cd package
./install.sh
```

Adopters can download the tarball, extract it, and run `./install.sh` directly.

## Future distribution channels

Possibilities (not yet implemented):

- **Homebrew tap** — `brew install design-ai`
- **Claude Code plugin marketplace** — once that ecosystem matures, list there
- **VS Code extension** — wrapper that installs design-ai + provides UI
- **Docker image** — for CI / sandboxed environments
- **Public doc site** (mkdocs / docusaurus) — for browsing knowledge without install

## Troubleshooting

### `design-ai install` succeeded but Claude Code doesn't see the skills

Restart Claude Code (or open a new session). Skills are read at session start.

### Symlinks point to a stale path after `npm update`

Run `design-ai install` again. Idempotent.

### Conflict with another plugin using `design-` prefix

Override the prefix:

```bash
DESIGN_AI_PREFIX=myteam-design- design-ai install
```

### Permission denied on `~/.claude/`

Ensure your Claude Code dir is owned by the current user:

```bash
chown -R $USER ~/.claude
```

### Tarball too big for npm

Audit `files` in `package.json`. Likely cause: `refs/` was added back accidentally (it's gitignored but `npm pack` reads `files`, not `.gitignore`).

## Cross-reference

- [`PLUGIN-PACKAGING.md`](PLUGIN-PACKAGING.md) — manual symlink approach + Claude Code's evolving plugin format
- [`QUICKSTART.md`](QUICKSTART.md) — adopter quickstart
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — for contributors
- [`CHANGELOG.md`](../CHANGELOG.md) — version history
