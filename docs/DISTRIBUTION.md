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
design-ai install     Symlink design-ai into ~/.claude
design-ai update      Pull latest source + reinstall
design-ai uninstall   Remove symlinks (keeps source)
design-ai status      Show what's installed
design-ai list [kind] List catalog (skills | commands | agents)
design-ai route brief Recommend commands, skills, and knowledge files; supports --from-file/--stdin/--list/--limit N/--explain/--json
design-ai routes      List available route ids for prompt/pack --route
design-ai prompt brief Generate a ready-to-use agent prompt; add --out file, --from-file, --stdin, --json, or --route id
design-ai pack brief Generate a prompt plus bounded context files with summary/warnings; add --out file, --from-file, --stdin, --max-bytes N, --json, or --route id
design-ai check file  Check generated Markdown artifact quality; add --examples, --route id, --all-routes, --issues-only, --stdin, --strict, or --json
design-ai examples q Find worked examples; add --route id, --limit N, or --json
design-ai search q    Search local corpus markdown; add --dir kind, --limit N, or --json
design-ai show file   Print a corpus file or line range; add --lines N:M, --context N, or --json
design-ai audit       Run all seven repository audits; add --strict or --quiet
design-ai doctor      Diagnose install and runtime health; add --strict, --json, or --fix
design-ai version     CLI + plugin versions
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
4. Commit + tag: `git tag v3.1.0 && git push --tags`.
5. GitHub Actions runs the publish and release workflows.

The workflow:
- Verifies tag matches `package.json` version.
- Verifies `package.json` and `plugin.json` versions match.
- Runs all 7 audits (frontmatter / link / Korean copy / integration / stale / coverage / example QA).
- Runs CLI unit tests before publishing or attaching release assets.
- Runs `npm run package:check` to confirm the tarball has required runtime files and excludes test/cache/source-only files.
- Installs the packed tarball into a temporary project, validates `design-ai version` and top-level help output, reads the `design-ai help --json` topic catalog, verifies the expected public topic and alias set, validates every `design-ai help <command>` topic-specific usage output, smoke-tests documented help and command aliases with output assertions, `list skills`, `list commands`, `list agents`, human and JSON `search` / `show` / `examples` output, verifies unknown route-id suggestion failures, verifies prompt/pack forced `--out` overwrites plus their `Wrote <path>` confirmations, and verifies `design-ai install`, `doctor --strict`, `status`, and `uninstall` lifecycle output against a fake `CLAUDE_HOME`.
- Publishes with `--provenance` (npm provenance attestation).
- After publish, smoke-tests the public registry package with `npm exec --package @design-ai/cli@<version>`, including version and top-level help output, the expected `design-ai help --json` catalog, discovered help topic usage output, documented help and command aliases, all three `list` catalog domains, human / JSON corpus discovery output, unknown route-id suggestion failures, prompt/pack forced output-file confirmations, and install/`doctor --strict`/status/uninstall lifecycle output.

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

- [ ] Core automated gate passes: `npm run release:check`
- [ ] Release assertion self-tests pass: `npm run release:self-test`
- [ ] All audits pass: `design-ai audit --strict`
- [ ] `package.json` and `.claude-plugin/plugin.json` versions match
- [ ] `CHANGELOG.md` has an entry for the new version
- [ ] CLI smoke-tested: `node cli/bin/design-ai.mjs help`, `version`, `list skills`, `list commands`, `list agents`
- [ ] Package contents check passes: `npm run package:check`
- [ ] Tarball size reasonable (< 15MB)
- [ ] README + relevant docs reference current version

Tag and push:

```bash
git tag v3.1.0
git push origin v3.1.0
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
curl -LO https://github.com/sungjin/design-ai/releases/download/v3.1.0/design-ai-cli-3.1.0.tgz
tar xzf design-ai-cli-3.1.0.tgz
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
