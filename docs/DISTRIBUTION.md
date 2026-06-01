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
git clone https://github.com/sungjin9288/design-ai.git
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
design-ai learn      Manage local learning preferences; use --init for preview-first starter profile bootstrap, --query with list/export for matching profile inspection, --backup --json for a full portable profile backup, --redact --json / --redact --from-file / --redact --stdin for redacted shareable backups, --curate for archive-first duplicate/sensitive entry maintenance, --out file plus --force for safe artifact writes, and --import for confirmed profile merges
design-ai check file  Check generated Markdown artifact quality; add --examples, --route id, --all-routes, --issues-only, --stdin, --strict, --learn, --yes, --learning-file path, or --json
design-ai workspace   Show a read-only local dogfood readiness snapshot for git, repository metadata, learning, and release scripts; add --root path, --learning-file path, --strict, or --json
design-ai site file   Validate Website Improvement Console JSON exports and generate handoff artifacts; add --stdin, --sample, --strict, --json, --mcp-check, --mcp-plan, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --report, --prompts, --prompt id, --task id, --out file, or --force
design-ai examples q Find worked examples; add --route id, --limit N, or --json
design-ai search q    Search local corpus markdown; add --dir kind, --limit N, or --json
design-ai show file   Print a corpus file or line range; add --lines N:M, --context N, or --json
design-ai audit       Run all eight repository audits; use `design-ai audit --strict --quiet --json` for machine-readable repository-audit output
design-ai doctor      Diagnose install and runtime health; use `design-ai doctor --strict` for human diagnostics output, `design-ai doctor --json` for machine-readable diagnostics output, or add --fix
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
- In that packed-tarball smoke gate, workspace readiness coverage includes `design-ai workspace --json`, strict failure/success readiness checks for `design-ai workspace --strict --json`, and `design-ai site --stdin --json` Website Console export validation, `design-ai site --sample` Website Console sample workspace coverage, `design-ai site --prompt-list --json` Website Console prompt template listing, `design-ai site --stdin --mcp-check --json` Website Console MCP readiness check, `design-ai site --stdin --mcp-plan` Website Console MCP action plan, `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle, `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification and bundle digest/fingerprint verification, `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison, `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest, `design-ai site --stdin --tasks` Website Console refactor task generation, and `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation in both installed-bin and one-shot npm exec paths.
- Runs `npm run ci:local` before Real-CI when preparing a push, including the MkDocs warning policy that allows only intentional `refs/` source-link warnings and caps them at the accepted baseline.
- Installs the packed tarball into a temporary project, smoke-tests the packed-tarball installed-bin path, then repeats the same public CLI surface through one-shot `npm exec --package <tarball>`, validates human `design-ai version` plus machine-readable version metadata from `design-ai version --json` and `design-ai help` top-level help output, reads the `design-ai help --json` topic catalog, verifies the expected public topic and alias set, validates every `design-ai help <command>` topic-specific usage output, smoke-tests documented help and command aliases with output assertions, verifies functional aliases such as `find`, `cat`, `recommend`, `example`, `ex`, `ls`, and `lint`, human and JSON `list skills`, `list commands`, and `list agents`, human and JSON `search` / `show` / `examples` output, verifies route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, verifies unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, verifies prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, verifies prompt/pack forced `--out` overwrites plus prompt/pack `Wrote <path>` file-write confirmations, verifies check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, verifies human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, verifies JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage, JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation, JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation, and human / JSON `design-ai learn --curate` archive-first curation output, verifies human `design-ai update --dry-run` output and `design-ai update --dry-run --json` machine-readable update plan, and verifies human `design-ai install` output, machine-readable install lifecycle output from `design-ai install --json`, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, human `design-ai status` output, JSON status, `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output against a fake `CLAUDE_HOME`.
- Publishes with `--provenance` (npm provenance attestation).
- After publish, smoke-tests the public registry package with `npm exec --package @design-ai/cli@<version>`, including human version output and machine-readable version metadata from `design-ai version --json` plus `design-ai help` top-level help output, the expected `design-ai help --json` catalog, discovered help topic usage output, documented help and command aliases, functional aliases such as `find`, `cat`, `recommend`, `example`, `ex`, `ls`, and `lint`, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced output-file coverage and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, public registry JSON `design-ai learn --verify` output plus public registry learn verify `--out` file-write confirmation, public registry JSON `design-ai learn --backup` output plus public registry learn backup `--out` file-write confirmation, public registry human / JSON `design-ai learn --stats` profile summary output plus public registry learn stats `--out` file-write confirmation, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, and human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output.
- Public registry workspace readiness coverage includes public registry `design-ai workspace --strict --json` workspace strict failure/success readiness checks from the published package path.
- Public registry learning bootstrap coverage includes public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation, public registry `design-ai learn --feedback --from-file`, public registry `design-ai learn --feedback --stdin`, public registry JSON `design-ai learn --init` preview/apply output, and public registry learn init duplicate-skip output.
- Public registry portable learning coverage includes public registry JSON `design-ai learn --import` dry-run/apply output plus public registry learn import `--out` file-write confirmation plus public registry JSON `design-ai learn --redact` output, public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, and public registry learn redact `--out` file-write confirmation.
- Public registry learning cleanup coverage includes public registry human / JSON `design-ai learn --audit` cleanup suggestion output plus public registry learn audit `--out` file-write confirmation and public registry `design-ai learn --audit --fix --dry-run` cleanup preview and confirmed apply output.
- Public registry learning relevance coverage includes public registry query-filtered learn list explanation/export JSON output plus public registry brief-relevant prompt/pack learning selection with public registry prompt/pack --with-learning.

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
curl -LO https://github.com/sungjin9288/design-ai/releases/download/vX.Y.Z/design-ai-cli-X.Y.Z.tgz
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
