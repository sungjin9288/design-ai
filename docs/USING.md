# Using design-ai with your AI agent

How to plug this knowledge base into different AI coding tools.

## Codex CLI

Codex automatically reads `AGENTS.md` from the project root.

```bash
cd /path/to/design-ai
codex "Generate a color palette for a Korean fintech app"
```

Codex will consume `AGENTS.md`, navigate `knowledge/`, and apply the relevant skill playbook. No setup required.

## Claude Code

Claude Code reads `CLAUDE.md` automatically. To get **slash commands** and **skill auto-loading**, optionally symlink:

```bash
# From the project root:
mkdir -p ~/.claude/commands ~/.claude/skills ~/.claude/agents

# Slash commands
for f in commands/*.md; do
  ln -sf "$(pwd)/$f" "$HOME/.claude/commands/design-$(basename "$f")"
done

# Skills
for d in skills/*/; do
  name=$(basename "$d")
  ln -sf "$(pwd)/$d" "$HOME/.claude/skills/design-$name"
done

# Agents
for f in agents/*.md; do
  [ "$(basename "$f")" = "README.md" ] && continue
  ln -sf "$(pwd)/$f" "$HOME/.claude/agents/$(basename "$f")"
done
```

This makes:
- `/design-design-review`, `/design-palette-from-brand`, etc. available globally.
- The skills auto-loadable by Claude Code's skill system.
- Agents spawnable by name.

If you don't symlink, you can still reference everything by path in conversation:
- "Apply the playbook at `skills/color-palette/PLAYBOOK.md` to a fintech app."
- "Spawn the agent at `agents/design-critic.md` to review this Figma link."

## Cursor

Drop these contents into your project's `.cursorrules`:

```
You are a senior product designer with 20+ years of experience.

When the user asks for design work, follow the playbook in /path/to/design-ai/AGENTS.md.

For UX audits: /path/to/design-ai/skills/ux-audit/PLAYBOOK.md
For palettes: /path/to/design-ai/skills/color-palette/PLAYBOOK.md
For component specs: /path/to/design-ai/skills/component-spec-writer/PLAYBOOK.md
...
```

Adjust paths.

## Aider

```bash
aider --read AGENTS.md --read knowledge/colors/color-theory.md \
      --read skills/color-palette/PLAYBOOK.md
```

Or use `.aider.conf.yml`:

```yaml
read:
  - AGENTS.md
  - knowledge/a11y/contrast.md
  - knowledge/a11y/keyboard-and-focus.md
  - knowledge/colors/color-theory.md
  - knowledge/typography/type-scale-fundamentals.md
```

## Plain prompt (any model)

Concatenate the relevant knowledge + skill into the system prompt:

```bash
cat AGENTS.md \
    skills/color-palette/PLAYBOOK.md \
    knowledge/colors/color-theory.md \
    knowledge/a11y/contrast.md \
    > /tmp/system-prompt.md
```

Pass `/tmp/system-prompt.md` as the system prompt to whatever LLM you're using.

## Token budget

Including everything is overkill. Per-task minimal context:

| Task | Files to load |
| --- | --- |
| Color palette generation | `AGENTS.md`, `skills/color-palette/PLAYBOOK.md`, `knowledge/colors/color-theory.md`, `knowledge/colors/palettes-by-product-type.md`, `knowledge/a11y/contrast.md` |
| Component spec | `AGENTS.md`, `skills/component-spec-writer/PLAYBOOK.md`, `knowledge/components/INDEX.md`, `knowledge/a11y/keyboard-and-focus.md` |
| UX audit | `AGENTS.md`, `skills/ux-audit/PLAYBOOK.md`, `knowledge/patterns/ux-guidelines.md`, `knowledge/a11y/contrast.md`, `knowledge/a11y/keyboard-and-focus.md` |
| Design system bootstrap | `AGENTS.md`, `skills/design-system-builder/PLAYBOOK.md`, `knowledge/colors/color-theory.md`, `knowledge/typography/type-scale-fundamentals.md`, `knowledge/layout/spacing-and-grid.md` |
| Website improvement control tower | `AGENTS.md`, `skills/website-improvement/PLAYBOOK.md`, `docs/WEBSITE-IMPROVEMENT.md`, `knowledge/patterns/dashboard-composition.md`, `knowledge/patterns/report-design.md`, `knowledge/patterns/ux-guidelines.md`, `knowledge/a11y/keyboard-and-focus.md` |

This stays under 30K tokens for any single task — well within most model context windows even before caching.

## Refresh cycle

When new versions of upstream design systems are released, refresh:

```bash
bash tools/clone-refs.sh        # Pull/clone refs/
bash tools/extractors/run-all.sh # Regenerate knowledge/
```

Generated knowledge files include `extracted_at` in their frontmatter. Hand-written files (`<!-- hand-written -->` at top) are preserved.
