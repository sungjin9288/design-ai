# CLAUDE.md

Claude Code-specific overlay on top of [AGENTS.md](AGENTS.md). Read AGENTS.md first — that contains the universal instructions. This file adds Claude Code conventions only.

## Tools you have access to that Codex doesn't

- **Skills system**: `skills/` directories with a `SKILL.md` are auto-loaded as named skills you can invoke. See [skills/README.md](skills/README.md).
- **Subagents**: `agents/*.md` define personas you can spawn for parallel work. Use them for independent reviews (a11y, token consistency, naming).
- **Slash commands**: `commands/*.md` map to `/<name>` invocations. Define them with frontmatter `description:` and they appear in the picker.

## When to spawn a subagent

| Situation | Agent |
|---|---|
| User shares a design and asks for feedback | `agents/design-critic.md` |
| Need to extract tokens from a new `refs/` source | `agents/token-extractor.md` |
| Building a new component, want anatomy review | `agents/component-architect.md` |
| Pre-ship a11y check | `agents/a11y-reviewer.md` |

Run them in parallel when work is independent (e.g., a11y review + visual critique on the same screen).

## Token-aware file reading

`refs/` directories are large. Always:
1. Use `Glob` or `Grep` first to locate the right file.
2. Read with `offset`/`limit` for large files.
3. Never `cat` an entire MUI or Ant Design source file — use targeted reads.

## Memory

User-specific preferences (favorite color systems, brand voice, naming conventions) go in your memory system, not in this repo. The repo stays generic so any user can adopt it.

## Refreshing the knowledge base

```bash
./tools/extractors/run-all.sh
```

Run this before any major design task if `refs/` has been updated since the last extraction. The script is idempotent.
