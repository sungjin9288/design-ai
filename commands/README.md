# Commands

Slash commands. In Claude Code, drop these into `~/.claude/commands/` (or symlink) to invoke as `/<name>`. In Codex CLI or generic agents, use the body as a prompt template.

| Command | What it does |
| --- | --- |
| [/design-from-brief](design-from-brief.md) | Generate a complete design system (palette + foundations + component baseline + starter set + handoff) from a one-paragraph product brief. **The most ambitious endpoint.** |
| [/iterate](iterate.md) | Apply a critique to an existing artifact, produce a revision + changelog. |
| [/design-review](design-review.md) | Run UX audit + a11y review + design critique in parallel and combine. |
| [/palette-from-brand](palette-from-brand.md) | Generate a full palette from a brand input (hex, category, or mood). |
| [/component-spec](component-spec.md) | Spec a single component using the component-spec-writer skill. |
| [/extract-tokens](extract-tokens.md) | Run the token extractor pipeline. |

Each file has YAML frontmatter (`description`) and a body. The body is the prompt the command expands to.
