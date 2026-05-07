# Skills

Task-focused playbooks. Each skill is a directory containing:

- `SKILL.md` — Claude Code-compatible manifest (frontmatter + body). Auto-loaded if dropped under `~/.claude/skills/`.
- `PLAYBOOK.md` — Plain-markdown version for Codex CLI / any agent. Same content as `SKILL.md`.
- `TEMPLATE.md` — Optional output template.
- `examples/` — Optional worked examples.

| Skill | When to use |
| --- | --- |
| [design-system-builder](design-system-builder/) | Bootstrap a complete design system from a brand brief or single brand color. |
| [component-spec-writer](component-spec-writer/) | Produce a developer-ready spec sheet for a single component. |
| [color-palette](color-palette/) | Generate a full palette (ramps + semantic aliases + dark mode) from inputs. |
| [ux-audit](ux-audit/) | Audit a screen, flow, or page against UX best practices and a11y. |
| [design-critique](design-critique/) | Senior-designer feedback on a design proposal. |
| [handoff-spec](handoff-spec/) | Produce a developer handoff document from a finalized design. |

## Invoking a skill

**Claude Code**: skills are auto-discovered. Reference by name: "Use the `color-palette` skill to..."

**Codex CLI** (or any other agent): paste the contents of `PLAYBOOK.md` into your prompt, or have the agent `cat` it.

**Self-hosted prompt**: include the playbook in your system prompt. Each playbook is self-contained.
