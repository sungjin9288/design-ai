# Cursor integration

How to use design-ai with **Cursor IDE** (AI-native editor with Claude/GPT models).

## Quickstart

Two paths:

### A. Project-level rules (recommended)

Create `.cursorrules` in your **consuming project's** root (not in design-ai itself):

```
You are a senior product designer with 20+ years of experience.

For any design task:
1. Read the rules at /path/to/design-ai/AGENTS.md
2. Prime yourself with /path/to/design-ai/knowledge/PRINCIPLES.md
3. For specific tasks:
   - Color palette: /path/to/design-ai/skills/color-palette/PLAYBOOK.md
   - Component spec: /path/to/design-ai/skills/component-spec-writer/PLAYBOOK.md
   - UX audit: /path/to/design-ai/skills/ux-audit/PLAYBOOK.md
   - Design system: /path/to/design-ai/skills/design-system-builder/PLAYBOOK.md
   - QA audit: /path/to/design-ai/skills/design-system-qa/PLAYBOOK.md
4. Cite knowledge files for every claim. Mark unsourced claims as "(judgment, not sourced)."
5. For colors, always include a contrast matrix.
6. For Korean content, apply rules in /path/to/design-ai/knowledge/i18n/.
```

Cursor auto-loads `.cursorrules` at chat start.

### B. Workspace context

Add design-ai as a workspace folder:

```
File → Add Folder to Workspace → /path/to/design-ai
```

Then reference design-ai files via `@` in Cursor:
- `@AGENTS.md`
- `@skills/color-palette/PLAYBOOK.md`
- `@knowledge/i18n/korean-typography.md`

Cursor's `@`-mention loads the file inline as context.

## Cursor-specific patterns

### Use `@docs` to feed knowledge

In Cursor, `@docs` lets you index external documentation. For design-ai:

```
Settings → Features → Docs → Add new doc
URL: https://github.com/your-org/design-ai
```

After indexing, `@design-ai` in chat searches across the entire knowledge base. Useful for finding "how do I handle Korean IME composition?" without knowing which file.

### Composer for multi-step tasks

Cursor's Composer is similar to Claude Code's Plan mode. For complex tasks:

```
Cmd+I → "Apply skills/design-system-builder/PLAYBOOK.md to a Korean fintech mobile app brief: [paragraph]"
```

Composer breaks it into steps and applies them sequentially.

### Inline edits with knowledge

When editing code (e.g., a component file), include design-ai knowledge:

```
Cmd+K → "Refactor this component per examples/component-button.md spec"
```

Cursor reads the spec and applies it to the open file.

## Configuration

### `.cursorrules` template

```text
# Design-AI integration for [Project Name]

## Role

You are a senior product designer (20+ years) helping with this project's
UI/UX. The design-ai knowledge base at /path/to/design-ai is your
authoritative reference.

## Rules

1. **Always cite**: every design claim must reference a file in design-ai's
   `knowledge/` directory. Mark unsourced claims as "(judgment, not sourced)."

2. **Prime first**: at the start of any design task, read
   /path/to/design-ai/knowledge/PRINCIPLES.md.

3. **Skill-first**: before producing artifacts, open the relevant
   /path/to/design-ai/skills/<skill>/PLAYBOOK.md and follow it.

4. **Color outputs require a contrast matrix.** Body text 4.5:1, UI 3:1.
   Cite knowledge/a11y/contrast.md.

5. **Korean content**: apply knowledge/i18n/korean-typography.md (line-height
   +10%, weight 600 for emphasis), korean-product-conventions.md (form
   patterns), and korean-payments.md (if fintech).

6. **Component specs**: cite all 3 references (Ant/MUI/shadcn-ui from
   refs/) and explain API choices in an "API choices made" section.

7. **Verification phase**: at the end of each artifact, run the verification
   checklist from the relevant skill PLAYBOOK.

## Project context

- Stack: <your stack>
- Design system: <pointer to your tokens / Storybook>
- Locale: <ko / en / etc.>
- Density: <comfortable / compact>
```

### Per-task `.cursor/` overrides

For task-specific rules, create files in `.cursor/`:

```
.cursor/
├── rules-color-tasks.md       # rules specific to palette work
├── rules-component-specs.md   # rules for component spec authoring
└── rules-korean-only.md        # Korean-specific rules
```

Reference in chat: "Apply rules from `.cursor/rules-korean-only.md` to this task."

(Cursor's per-task rule loading is evolving; check the current version's docs.)

## Cursor vs Claude Code vs Codex CLI

| Scenario | Best tool |
| --- | --- |
| Quick edits to existing code with design context | Cursor (inline `Cmd+K`) |
| Long-running design system bootstrap | Claude Code (TodoWrite tracking) |
| Headless CI integration | Codex CLI |
| Working in an editor while iterating on design tokens | Cursor (composer + `@docs`) |
| Multi-agent parallel reviews | Claude Code (sub-agent spawning) |
| Reviewing a Figma file via MCP | Either Cursor or Claude Code (MCP support varies) |

For this project: **Cursor is excellent for "I'm coding the components"** workflow. Claude Code/Codex are better for "I'm authoring the design system docs."

## Token budget management

Cursor's chat context is limited per turn. Don't dump all of design-ai. Per task:

| Task | Files to `@` |
| --- | --- |
| Generate palette | `@AGENTS.md` `@knowledge/PRINCIPLES.md` `@skills/color-palette/PLAYBOOK.md` `@knowledge/colors/color-theory.md` |
| Spec a Button | `@AGENTS.md` `@skills/component-spec-writer/PLAYBOOK.md` `@knowledge/components/INDEX.md` `@examples/component-button.md` (as quality reference) |
| Audit a screen | `@AGENTS.md` `@skills/ux-audit/PLAYBOOK.md` `@knowledge/patterns/ux-guidelines.md` `@knowledge/a11y/contrast.md` |

Cursor's `@`-mention is more granular than Claude Code's auto-loading — use it.

## Cursor's MCP support

Cursor supports MCP servers as of mid-2025. Same configuration as Codex:

```jsonc
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/path/to/figma-mcp-server"],
      "env": {
        "FIGMA_API_KEY": "your-key"
      }
    }
  }
}
```

After setup, Cursor can read Figma files via the MCP tools (`figma.get_metadata`, `figma.get_variables`, etc.). See [`docs/FIGMA-INTEGRATION.md`](FIGMA-INTEGRATION.md).

## Common Cursor pitfalls

| Pitfall | Fix |
| --- | --- |
| Cursor invents component APIs without checking refs/ | Add to `.cursorrules`: "Never invent APIs; always check refs/ant-design, refs/mui, refs/shadcn-ui." |
| Cursor's chat doesn't preserve PRINCIPLES across turns | Re-prime with `@knowledge/PRINCIPLES.md` per significant task. |
| Cursor outputs colors without contrast verification | Add explicit rule: "All color outputs include WCAG contrast values for text/UI pairs." |
| Cursor ignores Korean locale unless prompted | Specify in `.cursorrules`: "Default locale is Korean unless user states otherwise." |

## Worked example

**User in Cursor**:
```
@AGENTS.md @knowledge/PRINCIPLES.md @skills/color-palette/PLAYBOOK.md
Generate a teal-primary palette for a Korean B2C 가계부 app. Light + dark.
Output for Tailwind v4 + shadcn-ui CSS vars.
```

**Cursor**:
1. Reads the three referenced files.
2. Applies color-palette playbook.
3. Generates ramp from teal seed (per mood→hue mapping).
4. Validates contrast.
5. Outputs in requested formats.
6. Self-verifies via the playbook's verification phase.

## Cross-reference

- [`docs/USING.md`](USING.md) — multi-agent setup overview
- [`docs/CODEX-INTEGRATION.md`](CODEX-INTEGRATION.md) — Codex CLI deep-dive (similar patterns)
- [`docs/AIDER-INTEGRATION.md`](AIDER-INTEGRATION.md) — Aider configuration
- [`docs/FIGMA-INTEGRATION.md`](FIGMA-INTEGRATION.md) — Figma MCP setup
- [`AGENTS.md`](../AGENTS.md) — universal agent instructions
