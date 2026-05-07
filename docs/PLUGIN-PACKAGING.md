# Plugin packaging

Packaging design-ai as a Claude Code plugin so others can install it via `/plugin install`. Future-state — Claude Code's plugin format is evolving; this guide reflects the current symlink approach + likely future direction.

## Current state — symlink approach (works today)

Claude Code reads skills/agents/commands from `~/.claude/`. To "install" design-ai globally:

```bash
# From the design-ai project root
cd /path/to/design-ai

mkdir -p ~/.claude/skills ~/.claude/agents ~/.claude/commands

# Skills
for d in skills/*/; do
  name=$(basename "$d")
  ln -sf "$(pwd)/$d" "$HOME/.claude/skills/design-$name"
done

# Agents
for f in agents/*.md; do
  base=$(basename "$f")
  [ "$base" = "README.md" ] && continue
  ln -sf "$(pwd)/$f" "$HOME/.claude/agents/$base"
done

# Slash commands
for f in commands/*.md; do
  base=$(basename "$f")
  [ "$base" = "README.md" ] && continue
  ln -sf "$(pwd)/$f" "$HOME/.claude/commands/design-${base}"
done
```

After symlink:
- `/design-design-from-brief`, `/design-palette-from-brand`, etc. available globally
- `design-color-palette`, `design-component-spec-writer`, etc. available as skills
- `design-critic`, `design-system-qa`, etc. available as agents

Pulling latest design-ai updates them automatically (symlinks point to the working copy).

## Trade-offs of symlinks

| Pro | Con |
| --- | --- |
| Auto-updates as you `git pull` design-ai | User must manually run the symlink script |
| No packaging overhead | Doesn't survive `~/.claude/` reset |
| Knowledge files (`knowledge/`) aren't installed (referenced by skill files) | Skill files reference paths relative to `design-ai/` — works only when the symlink target is intact |

For solo / team use, this works fine. For wider distribution, a real plugin is needed.

## Future state — Claude Code plugin format

Claude Code's plugin format is evolving (as of mid-2025). Likely components:

```
design-ai-plugin/
├── plugin.json              # manifest
├── README.md
├── LICENSE
├── skills/                  # auto-loaded skills
├── agents/                  # auto-loaded agents
├── commands/                # auto-loaded slash commands
├── knowledge/               # bundled knowledge files
└── examples/                # bundled examples
```

A `plugin.json` manifest something like:

```json
{
  "name": "design-ai",
  "version": "1.5.0",
  "description": "Senior product designer for any LLM agent — knowledge base + skills for design system, palette, components, UX audits.",
  "author": "your-name",
  "license": "MIT",
  "homepage": "https://github.com/your-org/design-ai",
  "exposes": {
    "skills": ["color-palette", "design-system-builder", "component-spec-writer", "ux-audit", "design-critique", "handoff-spec", "design-system-qa"],
    "agents": ["design-critic", "a11y-reviewer", "token-extractor", "component-architect"],
    "commands": ["design-from-brief", "iterate", "design-review", "palette-from-brand", "component-spec", "extract-tokens"]
  },
  "knowledge_bases": ["knowledge"],
  "claude_code": {
    "minVersion": "0.x.x"
  }
}
```

(Exact schema TBD — check Claude Code's plugin SDK when published.)

### Installation by users

Once packaged:

```bash
# In Claude Code:
/plugin install design-ai
```

Or:

```bash
/plugin install https://github.com/your-org/design-ai
```

Plugin manager handles fetch, version pinning, and integration.

## Distribution channels

| Channel | Use |
| --- | --- |
| **Claude Code marketplace** (when available) | Public, discoverable, version-managed |
| **Public GitHub** (current) | Direct install from URL; manual symlink |
| **Internal GitHub** | Same as public but private |
| **npm-style package** (when available) | Versioned distribution via package manager |

For this project (currently): GitHub + symlink approach is the right level.

## Versioning strategy

Semantic versioning with explicit breaking-change policy:

| Bump | Triggers |
| --- | --- |
| Patch (1.5.0 → 1.5.1) | Bug fixes, knowledge file updates, extractor improvements |
| Minor (1.5.0 → 1.6.0) | New skills, new agents, new knowledge files, new extractors |
| Major (1.5.0 → 2.0.0) | Breaking changes to skill APIs, knowledge file schema changes, removal of skills |

Tag releases:

```bash
git tag -a v1.5.0 -m "v1.5.0 — Phase 6: token references + design-system-qa skill + Codex/plugin docs"
git push origin v1.5.0
```

## CI for releases

A simple release pipeline:

```yaml
# .github/workflows/release.yml
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Run audit to verify state
      - run: python3 tools/audit/check-coverage.py
      - run: bash tools/extractors/run-all.sh

      # Verify knowledge/COVERAGE.md is in sync
      - run: git diff --exit-code knowledge/COVERAGE.md

      # Lint frontmatter on knowledge files
      - run: python3 tools/lint/frontmatter-check.py

      # Optional: build a tarball / zip for plugin distribution
      - run: tar czf design-ai-$(git describe --tags).tar.gz \
          AGENTS.md CLAUDE.md README.md \
          knowledge/ skills/ agents/ commands/ examples/ docs/

      # Optional: upload to release
      - uses: softprops/action-gh-release@v1
        with:
          files: design-ai-*.tar.gz
```

The lint and audit gates ensure no PR ships a half-built knowledge file.

## CHANGELOG

For users tracking updates: maintain a top-level `CHANGELOG.md`:

```markdown
# Changelog

## [1.5.0] — 2026-XX-XX

### Added
- Tailwind v4, Material 3, Polaris+Carbon token references
- design-system-qa skill (5-layer test pyramid)
- Codex CLI integration guide (docs/CODEX-INTEGRATION.md)
- Plugin packaging guide (docs/PLUGIN-PACKAGING.md)

### Changed
- AGENTS.md lookup table extended with new entries
- knowledge/PRINCIPLES.md updated

### Fixed
- (none)

## [1.4.0] — 2026-05-XX
...
```

Generated by `git log` filtered to user-impacting commits — the existing commit messages already follow this discipline.

## License + attribution

Currently no LICENSE file. For public distribution, add MIT or similar permissive license (matches the upstream design system source materials' general permissiveness).

For attribution: the knowledge base draws from Ant Design (MIT), MUI (MIT), shadcn-ui (MIT), Material Design (Apache 2.0), Polaris (MIT), Carbon (Apache 2.0), and others. Include an `ACKNOWLEDGEMENTS.md` listing source projects and their licenses.

## Migration when plugin format is finalized

When Claude Code publishes the plugin SDK:

1. Add `plugin.json` per the schema.
2. Create a `release/` branch with bundled `knowledge/` + symlink rules.
3. Submit to marketplace.

The current repo structure already maps cleanly to the likely plugin layout — minimal restructuring expected.

## For now: what to actually do

If you're a single user / small team:

1. Use the symlink approach above.
2. Treat the repo as your "plugin" — pull updates via `git pull`.
3. Don't worry about `plugin.json` until the format is real.

If you want to share with others:

1. Push to public GitHub.
2. Document the symlink steps in the README.
3. Tag releases (`git tag v1.x`).
4. When plugin format ships, repackage.

## Cross-reference

- [`docs/USING.md`](USING.md) — multi-agent setup (includes symlink instructions)
- [`docs/CODEX-INTEGRATION.md`](CODEX-INTEGRATION.md) — Codex-specific integration
- [`README.md`](../README.md) — project overview
