# Migration to v4.0.0

v4.0 is a **graduation release**, not a breaking-change release. Everything that worked at v3.12 keeps working at v4.0 — the major bump signals that the corpus is now stable, audited, and release-checklisted.

## TL;DR

- **No code changes required.** v3.x adopters can `npm install -g @design-ai/cli@4` and everything continues to work.
- **No knowledge file paths changed.** Imports, references, and link-check all stable.
- **No skill / command / agent renames.**
- **CLI surface unchanged.** `design-ai install`, `design-ai status`, `design-ai list ...` all identical.
- **Plugin manifest schema unchanged.** Existing plugin consumers see only the version bump.

## What v4.0 means

| Surface | Promise |
|---|---|
| **Knowledge files (91)** | Frozen at `version: 1.0.0`, `stability: stable`. Future content edits bump per-file `last_updated`; structural changes bump per-file `version`. |
| **Skills (19)** | API-stable. New skills can be added in 4.x minor releases; removals require a deprecation cycle (deprecate in 4.x, remove in 5.0). |
| **Slash commands (15)** | API-stable. Same deprecation policy. |
| **Review agents (4)** | API-stable. |
| **CLI (`@design-ai/cli`)** | Argv contract stable. Adopters can pin to `^4.0.0`. |
| **Plugin manifest (`.claude-plugin/plugin.json`)** | Schema stable. Field additions are non-breaking; field removals require a major bump. |
| **VS Code extension** | Configuration keys stable (`design-ai.path`, `design-ai.language`). |
| **Doc site URL structure** | `/skills/`, `/knowledge/<domain>/`, `/examples/`, `/integrations/`, `/ko/...` paths frozen. |

## What v4.0 does NOT promise

- **Knowledge content stability.** Individual knowledge files can be edited freely (typo fixes, example additions, Korean polish, factual corrections). Edits bump `last_updated`. Structural rewrites of a single file bump that file's `version`.
- **Component coverage stability.** New component specs can be added in 4.x minors; the canonical-coverage percentage will continue rising.
- **Korean translation completeness.** More `*.ko.md` files will arrive in 4.x; not breaking when they do.

## Stability levels (recap)

All v3.12 knowledge files were at `stability: stable` already; v4.0 retains that.

| Level | Meaning | v4.0 policy |
|---|---|---|
| `stable` | Reviewed; canonical | Removed only with deprecation cycle |
| `beta` | Substantively complete; pending polish | Can be promoted to `stable` mid-4.x |
| `experimental` | Active iteration | May change significantly within 4.x |
| `deprecated` | Superseded | Removed in 5.0 |

No file currently sits at `experimental` or `deprecated` — those will appear during 4.x evolution.

## Deprecation policy (effective from v4.0)

Anything publicly documented (skills, commands, CLI flags, plugin fields, knowledge file IDs) follows:

1. **Deprecate in 4.x:** Add `deprecated: true` (or stability `deprecated` for knowledge), update docs, log a deprecation warning.
2. **Maintain in 4.x:** All deprecated surfaces keep working through the 4.x line.
3. **Remove in 5.0:** Only at the next major bump.

Adopters get at least one full minor cycle of warnings before anything disappears.

## How to upgrade

### NPM CLI

```bash
npm install -g @design-ai/cli@4
design-ai version  # should print 4.0.0
design-ai status
```

### Plugin (manual / git clone)

```bash
cd ~/.claude/plugins/design-ai  # or wherever you installed
git pull
git checkout v4.0.0
```

### Homebrew

```bash
brew update
brew upgrade design-ai
```

(Note: the Homebrew formula update happens after the v4.0 GitHub release tarball is published — see `docs/RELEASE-CHECKLIST.md` "For Homebrew formula updates".)

### VS Code extension

The extension is not yet on the marketplace as of v4.0.0 tag. Install from `.vsix`:

```bash
cd vscode-extension
npm install
npx @vscode/vsce package
code --install-extension design-ai-*.vsix
```

## Verification after upgrade

```bash
design-ai version             # 4.0.0
design-ai list skills         # 19 skills
design-ai list commands       # 15 commands
design-ai list knowledge      # 91 files
```

If any count is lower, the install is incomplete — re-run `design-ai install`.

## Why v4.0 (and not v3.13)?

The v3.x line accumulated:
- A whole-corpus invariant (all knowledge files versioned, all stable).
- A pre-release ritual (RELEASE-CHECKLIST.md).
- Six audits gating CI.
- Four distribution channels.
- Two languages.
- A documented session log.

That's a different *kind* of project than v3.0 was. The major bump signals the maturity transition to adopters considering whether to adopt — they're now adopting a release-engineered tool, not an evolving prototype.

## Cross-reference

- [`CHANGELOG.md`](../CHANGELOG.md) — full v4.0.0 release notes
- [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) — pre-release ritual
- [`docs/SESSION-LOG.md`](SESSION-LOG.md) — narrative v2.0 → v4.0
- [`docs/ROADMAP.md`](ROADMAP.md) — per-phase detail
