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
design-ai version     CLI + plugin versions
design-ai help        Show help
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
5. GitHub Actions runs the publish workflow.

The workflow:
- Verifies tag matches `package.json` version.
- Verifies `package.json` and `plugin.json` versions match.
- Runs all 4 audits (frontmatter / link / Korean copy / coverage).
- Runs `npm pack --dry-run` to confirm the tarball is well-formed.
- Publishes with `--provenance` (npm provenance attestation).

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
├── commands/            # 15 slash command files
├── docs/                # Architecture + integration guides
└── tools/
    ├── audit/           # 5 audit scripts (Python)
    └── preview/         # HTML preview generator (Python)
```

Excluded (in `.npmignore` + not in `files`):
- `refs/` — large gitignored upstream sources, regenerated on demand
- `.git/`, `.github/` — VCS metadata
- `node_modules/` — local dependencies
- `tools/extractors/` — only needed for refreshing knowledge from refs/

Tarball target: < 15MB. Run `npm pack --dry-run` to verify.

## Publishing checklist (maintainers)

Before tagging a release:

- [ ] All audits pass: `python3 tools/audit/{frontmatter,link,korean-copy,check-coverage}.py`
- [ ] `package.json` and `.claude-plugin/plugin.json` versions match
- [ ] `CHANGELOG.md` has an entry for the new version
- [ ] CLI smoke-tested: `node cli/bin/design-ai.mjs help`, `version`, `list skills`
- [ ] `npm pack --dry-run` shows expected files
- [ ] Tarball size reasonable (< 15MB)
- [ ] README + relevant docs reference current version

Tag and push:

```bash
git tag v3.1.0
git push origin v3.1.0
```

GitHub Actions takes over from there.

## Alternative: GitHub Release artifacts

For users who don't want npm, provide the tarball as a GitHub Release asset:

```bash
# After publishing
TARBALL=$(npm pack 2>/dev/null | tail -1)
gh release create v3.1.0 "$TARBALL" --title "v3.1.0" --notes-from-tag
```

Adopters can `wget` the tarball, extract, and run `./install.sh` directly.

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
