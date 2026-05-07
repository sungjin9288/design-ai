# Agents

Single-purpose persona definitions. Spawn in parallel when reviews are independent.

| Agent | Purpose |
| --- | --- |
| [design-critic](design-critic.md) | Senior-designer feedback on a proposal. |
| [a11y-reviewer](a11y-reviewer.md) | Accessibility-only review (WCAG, keyboard, focus, contrast). |
| [token-extractor](token-extractor.md) | Pull tokens from a new `refs/` source into `knowledge/design-tokens/`. |
| [component-architect](component-architect.md) | Design API + anatomy for a new component. |

Each agent's body contains a self-contained brief. The harness can spawn it with that file as the system-prompt overlay.

Claude Code reads the YAML frontmatter (`name`, `description`, `tools`). Codex CLI / generic agents read the body text and apply it as a role.
