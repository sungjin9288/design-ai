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
| [design-system-qa](design-system-qa/) | Audit a design system across 5 testing layers (types / tokens / contract / a11y / visual) and recommend CI integration. |
| [design-pr-review](design-pr-review/) | Review a GitHub PR for design system compliance. Uses GitHub MCP when connected. |
| [figma-token-sync](figma-token-sync/) | Sync tokens between Figma and code. Uses Figma MCP. |
| [design-broadcast](design-broadcast/) | Post artifacts to Slack / Notion. Uses Slack + Notion MCPs. |
| [document-author](document-author/) | Write technical / product documentation. Picks the right Diátaxis type, applies template, follows technical-writing voice rules. Korean-aware. |
| [slide-deck-author](slide-deck-author/) | Outline a slide deck (talk / pitch / reading). Message-led titles, brand-applied, Korean-aware. |
| [motion-designer](motion-designer/) | Spec motion for a screen / component / page. Picks tool (CSS / Framer Motion / GSAP / Lottie / Rive), durations, easings, choreography. Reduced-motion-safe by default. |
| [illustration-designer](illustration-designer/) | Design or spec an illustration system (or single illustration). Style, voice, color, format (SVG / Lottie / PNG), accessibility, SVG optimization. Korean-market-aware. |

## Invoking a skill

**Claude Code**: skills are auto-discovered. Reference by name: "Use the `color-palette` skill to..."

**Codex CLI** (or any other agent): paste the contents of `PLAYBOOK.md` into your prompt, or have the agent `cat` it.

**Self-hosted prompt**: include the playbook in your system prompt. Each playbook is self-contained.
