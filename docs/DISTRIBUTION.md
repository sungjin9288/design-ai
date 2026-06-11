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
design-ai learn      Manage local learning preferences; use --init for preview-first starter profile bootstrap, --query with list/export for matching profile inspection, --backup --json for a full portable profile backup, --redact --json / --redact --from-file / --redact --stdin for redacted shareable backups, --verify / --diff before moving portable profiles, --restore for preview-first full-profile replacement with automatic rollback backup and optional --backup-file path, --restore-backups for read-only rollback backup inventory, --restore-backups --prune --keep N for preview-first older rollback backup cleanup, --curate for archive-first duplicate/sensitive entry maintenance, --propose-skills for preview-only skill delta proposals from repeated check captures with adjustable --min-evidence proposal thresholds, optional --strict proposal readiness gating, `--report --out skill-proposals.md` Markdown review artifacts, and `--patch --out skill-proposals.patch` unified diff handoffs, --out file plus --force for safe artifact writes, and --import for confirmed profile merges
design-ai check file  Check generated Markdown artifact quality; add --examples, --route id, --all-routes, --issues-only, --stdin, --strict, --learn, --yes, --learning-file path, or --json
design-ai workspace   Show a read-only local dogfood readiness snapshot for git, repository metadata, learning, optional learning usage sidecars, learning eval checkpoints, and release scripts; add --root path, --learning-file path, --learning-usage path, --learning-eval path, --strict, or --json
design-ai site file   Validate Website Improvement Console JSON exports and generate handoff artifacts; add --stdin, --sample, --strict, --json, --mcp-check, --probes, --mcp-plan, --next-actions, --graph, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --yes, --report, --prompts, --prompt id, --task id, --out file, or --force
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
- Runs `npm run release:metadata` to verify release metadata checks with release metadata JSON `product_readiness_checked: true` Product Readiness guard coverage before release self-tests.
- Runs `npm run release:self-test` to validate release assertion fixtures before package smoke.
- Runs `npm run package:smoke` as the packed-tarball smoke gate for installed-bin and one-shot npm exec coverage.
- Packed-tarball smoke also verifies route eval, prompt eval, and pack eval checkpoint output for installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke also verifies `design-ai learn --signals` learning signal registry output, `design-ai learn --signals --strict --json` strict gate output, `design-ai learn --propose-skills` skill proposal output in human, JSON, Markdown `--report --out`, unified diff `--patch --out`, JSON `--out`, and `design-ai learn --propose-skills --min-evidence 3 --json` threshold-skipping modes, and `design-ai learn --propose-skills --strict --json` expected-failure gate output for installed-bin and one-shot `npm exec --package <tarball>` paths.
- In that packed-tarball smoke gate, workspace readiness coverage includes `design-ai workspace --json`, strict failure/success readiness checks for `design-ai workspace --strict --json`, `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries with freshness metadata plus auto-detected learning usage sidecar summaries and `design-ai workspace` workspace learning restore-backups readiness with restore rollback backup inventory in both installed-bin and one-shot npm exec paths, and `design-ai site --stdin --json` Website Console export validation, `design-ai site --stdin --next-actions --json --out file --force` Website Console next-action operator checklist output-file persistence, `design-ai site --stdin --next-actions --out file --force` Website Console next-action human checklist output-file persistence, `design-ai site --sample` Website Console sample workspace coverage, `design-ai site --prompt-list --json` Website Console prompt template listing, `design-ai site --stdin --mcp-check --json` Website Console MCP readiness check, `design-ai site --stdin --mcp-check --probes --json` Website Console MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, `design-ai site --stdin --mcp-plan` Website Console MCP action plan, `design-ai site --stdin --mcp-plan --probes` Website Console MCP probe action plan, `design-ai site --stdin --mcp-plan --probes --json` Website Console MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, `design-ai site --stdin --graph --json` Website Console workflow graph export, `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle, non-empty Website Console evidence counts through evidence bundle check/compare/handoff JSON, `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification, bundle digest/fingerprint verification, and generated bundle contract verification, `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison plus packed-tarball and public-registry smoke for warning-state Website Console bundle-compare strict failures where identical warning bundles keep `sameBundle: true` while exiting non-zero under `--strict`, `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest, `design-ai site <bundle-dir> --bundle-repair --yes --json` Website Console bundle repair preview/apply drift recovery with repair report `--out file` output-file persistence, shared repair guidance smoke helpers, and shared repair report assertion helpers, `design-ai site --stdin --tasks` Website Console refactor task generation, and `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation.
- Runs `npm run ci:local` before Real-CI when preparing a push, including the MkDocs warning policy that allows only intentional `refs/` source-link warnings and caps them at the accepted baseline.
- Installs the packed tarball into a temporary project, smoke-tests the packed-tarball installed-bin path, then repeats the same public CLI surface through one-shot `npm exec --package <tarball>`, validates human `design-ai version` plus machine-readable version metadata from `design-ai version --json` and `design-ai help` top-level help output, reads the `design-ai help --json` topic catalog with probe-capable Website Console site help usage, verifies the expected public topic and alias set, validates every `design-ai help <command>` topic-specific usage output plus shared Website Console site help topic example smoke assertions including the `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown help example, smoke-tests documented help and command aliases with output assertions, verifies functional aliases such as `find`, `cat`, `recommend`, `example`, `ex`, `ls`, and `lint`, human and JSON `list skills`, `list commands`, and `list agents`, human and JSON `search` / `show` / `examples` output, verifies route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, verifies unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, verifies prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, verifies prompt/pack forced `--out` overwrites plus prompt/pack `Wrote <path>` file-write confirmations, verifies check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, verifies human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, verifies JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage, JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation plus learn restore rollback backup verification plus learn restore `--backup-file` path coverage plus design-ai learn --restore-backups restore rollback backup inventory coverage plus design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --signals` learning signal registry plus `design-ai learn --signals --strict --json` strict gate plus learn signals `--out` file-write confirmation, human / JSON `design-ai learn --propose-skills` preview-only skill proposal report plus Markdown `--report --out skill-proposals.md` review artifact plus unified diff `--patch --out skill-proposals.patch` handoff plus learn skill proposals JSON `--out` file-write confirmation plus `design-ai learn --propose-skills --min-evidence 3 --json` threshold skipping plus `design-ai learn --propose-skills --strict --json` expected-failure gate, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation, and human / JSON `design-ai learn --curate` archive-first curation output plus usage-aware curation JSON review, verifies human `design-ai update --dry-run` output and `design-ai update --dry-run --json` machine-readable update plan, and verifies human `design-ai install` output, machine-readable install lifecycle output from `design-ai install --json`, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, human `design-ai status` output, JSON status, `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output against a fake `CLAUDE_HOME`.
- Publishes with `--provenance` (npm provenance attestation).
- After publish, smoke-tests the public registry package with `npm exec --package @design-ai/cli@<version>`, including human version output and machine-readable version metadata from `design-ai version --json` plus `design-ai help` top-level help output, the expected `design-ai help --json` catalog with probe-capable Website Console site help usage, discovered help topic usage output plus shared Website Console site help topic example smoke assertions including the `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown help example, documented help and command aliases, functional aliases such as `find`, `cat`, `recommend`, `example`, `ex`, `ls`, and `lint`, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced output-file coverage and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, public registry JSON `design-ai learn --verify` output plus public registry learn verify `--out` file-write confirmation, public registry JSON `design-ai learn --backup` output plus public registry learn backup `--out` file-write confirmation, public registry human / JSON `design-ai learn --stats` profile summary output plus public registry learn stats `--out` file-write confirmation, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, and human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output.
- Public registry workspace readiness coverage includes public registry `design-ai workspace --strict --json` workspace strict failure/success readiness checks from the published package path.
- Public registry workspace learning-eval coverage includes public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries with freshness metadata plus auto-detected learning usage sidecar summaries from the published package path.
- Public registry workspace restore-backups coverage includes public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory from the published package path.
- Public registry Website Console coverage includes public registry `design-ai site` Website Console export validation, including public registry `design-ai site --stdin --next-actions --json` next-action operator checklist contract with `mcpProbeCounts` probe count telemetry plus shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts plus public registry `design-ai site --stdin --next-actions --json --out file --force` next-action operator checklist output-file persistence plus public registry `design-ai site --stdin --next-actions --out file --force` next-action human checklist output-file persistence, sample workspace coverage, prompt template listing, MCP readiness, MCP readiness probes, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle, bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation, bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry plus package smoke self-test coverage for Website Console bundle MCP probe counts plus bundled Website Console `mcp-probes.json` saved probe evidence payload assertion instead of the full `site --mcp-check --probes --json` response, bundle-repair, refactor task generation, and task-selected prompt generation from the published package path.
- Public registry learning eval-template coverage includes public registry `design-ai learn --eval-template` checkpoint generation plus public registry generated checkpoint strict validation from the published package path.
- Public registry learning bootstrap coverage includes public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation, public registry `design-ai learn --feedback --from-file`, public registry `design-ai learn --feedback --stdin`, public registry JSON `design-ai learn --init` preview/apply output, and public registry learn init duplicate-skip output.
- Public registry learning restore coverage includes public registry JSON `design-ai learn --restore` preview/apply output plus public registry learn restore `--out` file-write confirmation, public registry learn restore rollback backup verification, public registry learn restore `--backup-file` path coverage, public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage, and public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage.
- Public registry portable learning coverage includes public registry JSON `design-ai learn --import` dry-run/apply output plus public registry learn import `--out` file-write confirmation plus public registry JSON `design-ai learn --redact` output, public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, and public registry learn redact `--out` file-write confirmation.
- Public registry learning cleanup coverage includes public registry human / JSON `design-ai learn --audit` cleanup suggestion output plus public registry learn audit `--out` file-write confirmation and public registry `design-ai learn --audit --fix --dry-run` cleanup preview and confirmed apply output.
- Public registry learning relevance coverage includes public registry query-filtered learn list explanation/export JSON output plus public registry brief-relevant prompt/pack learning selection and prompt/pack learning usage sidecar recording with public registry prompt/pack --with-learning.

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
- [ ] Website Console bundle `mcp-probes.json` saved-payload guard phases remain covered by `npm run release:check`, package contents, release self-tests, and packed-tarball smoke
- [ ] Website Console bundle boundary metadata guard phases remain covered by `npm run release:check`, bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording, unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke
- [ ] Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence remains covered by `npm run release:check`, unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke
- [ ] Product Readiness release policy full gate evidence guard remains covered by `npm run release:check`, unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke
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
