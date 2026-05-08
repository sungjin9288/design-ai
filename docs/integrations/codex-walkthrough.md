# Codex CLI walkthrough

A concrete walkthrough of using design-ai with **OpenAI Codex CLI**. Picks up where [`docs/CODEX-INTEGRATION.md`](../CODEX-INTEGRATION.md) leaves off — that's setup; this is workflow.

## Prerequisites

```bash
# Install Codex CLI
npm install -g @openai/codex

# Get design-ai
git clone https://github.com/sungjin/design-ai.git ~/dev/design-ai
# OR
npm install -g @design-ai/cli
# (npm CLI symlinks for Claude Code; Codex reads files directly from the source dir)
```

## Setup (60 seconds)

```bash
cd ~/dev/design-ai      # Open the design-ai project root
codex                   # Launch Codex CLI
```

That's it. Codex auto-loads `AGENTS.md` at session start. The full corpus is reachable via path references.

## Walkthrough 1: Spec a component

**Goal**: get a developer-ready spec for a custom `Banner` component.

### Session

```
You ▸ Spec a Banner component for a Korean fintech app. Persistent
      in-page strip for system status announcements. Distinct from
      Alert (inline) and Toast (transient).

Codex ▸ I'll apply the component-spec-writer skill.

      Reading: skills/component-spec-writer/PLAYBOOK.md
      Reading: knowledge/components/INDEX.md
      Cross-referencing: examples/component-banner.md
      Reading: knowledge/i18n/korean-document-style.md (KR voice)

      [produces full spec following the established template]

      # Banner — spec
      ## Banner vs Alert vs Toast
      | | Banner | Alert | Toast |
      ...
      [continues]
```

### What's happening

- Codex read `AGENTS.md` (the universal entry) at session start.
- The user's prompt mentions a component task, so Codex looks up the matching skill.
- The skill (`component-spec-writer/PLAYBOOK.md`) directs Codex to read references first, choose canonical API, define anatomy, etc.
- Korean fintech context triggers reading `knowledge/i18n/korean-document-style.md` for honorific level guidance.
- Output follows the template in `skills/component-spec-writer/TEMPLATE.md`.

### Why this works in Codex

Codex's strength is reading whole files in context. design-ai's design — markdown-only, clear cross-references, self-contained playbooks — fits Codex's model perfectly. No special Codex-specific config.

## Walkthrough 2: Generate a design system from a brief

**Goal**: bootstrap a complete design system from a one-paragraph brief.

### Session

```
You ▸ Apply the design-system-builder skill. Brief: Korean fintech for
      freelancers. Invoice, expense tracking, tax estimation. Calm,
      trustworthy, mobile-first. Pretendard typography. Brand color:
      teal-blue (#0E7490).

Codex ▸ I'll bootstrap the system. Reading the playbook now.

      Reading: skills/design-system-builder/PLAYBOOK.md
      Reading: knowledge/PRINCIPLES.md
      Reading: knowledge/colors/color-theory.md
      Reading: knowledge/colors/palettes-by-product-type.md
      Reading: knowledge/typography/font-pairings.md
      Reading: knowledge/i18n/korean-typography.md

      Phase 1: Color palette
      [generates ramps, semantic aliases, dark mode, contrast matrix]

      Phase 2: Foundations
      [typography scale, spacing, radius, shadow tokens]

      Phase 3: Component baseline
      [Button, Input, Card, Modal API specs cross-referenced]

      Phase 4: Starter component set
      [5 components specced from the canonical synthesis]

      Phase 5: Handoff doc
      [token JSON + Tailwind config + Figma variables export]
```

### Output structure

Codex outputs the design system inline OR (preferred) writes files into your project's `design/` directory. Specify in the prompt:

```
You ▸ Apply design-system-builder. Brief: ... Write outputs to
      ./design/ in this repo, organized by phase (1-color, 2-foundations,
      3-baseline, 4-starter, 5-handoff).
```

Codex will use file write operations to materialize the system.

## Walkthrough 3: Iterate on a critique

**Goal**: take a screenshot critique and produce a revised design spec.

### Session

```
You ▸ I have a screenshot of our pricing page that the design-critique
      skill flagged. The top 3 critiques:
      1. CTA contrast 3.1:1 fails WCAG AA
      2. Tier comparison not scannable
      3. KR currency format inconsistent (₩50,000 vs 50,000원)

      Apply the iterate skill. Produce a revision spec.

Codex ▸ Reading: commands/iterate.md
      Reading: knowledge/a11y/contrast.md (for WCAG AA bump)
      Reading: knowledge/patterns/pricing-page-design.md
      Reading: knowledge/i18n/korean-typography.md (for currency)
      Reading: examples/component-pricing-cards.md

      Revision spec:

      ## Critical fixes (CRITICAL severity)

      1. CTA contrast → bump foreground to white on
         oklch(64% 0.18 30) (currently oklch(70% 0.16 30)). Verified 4.6:1.

      2. Tier comparison → restructure as table-style grid with
         feature-row alignment. Three columns equal width, anchor middle
         tier as "recommended" with brand-color border.

      3. Currency format → unify to "₩50,000". Apply the
         knowledge/patterns/money-and-amount.md rule consistently.

      ## Changelog (vs original)
      [diff-style annotations]
```

## Walkthrough 4: Audit a Figma file

**Goal**: run a UX audit + a11y review on a Figma design.

### Session

```
You ▸ I exported screens from Figma to ./screens/. Audit them with
      ux-audit and a11y-reviewer skills.

Codex ▸ Reading: skills/ux-audit/PLAYBOOK.md
      Reading: agents/a11y-reviewer.md
      Reading: knowledge/a11y/contrast.md
      Reading: knowledge/a11y/keyboard-and-focus.md

      [analyzes each screen]
      [returns severity-aggregated findings: CRITICAL, HIGH, MEDIUM, LOW]
```

For real Figma integration (read live designs vs static exports): see [Figma MCP integration](../FIGMA-INTEGRATION.md). Codex CLI supports MCP servers; configure in `~/.codex/config.toml`.

## Common workflow patterns

### Pattern 1: Read-explore-produce

Most design tasks fit this loop:

```
1. User states intent.
2. Codex identifies relevant skill.
3. Codex reads the playbook + cited knowledge files.
4. Codex produces output following the template.
5. User iterates with follow-up prompts.
```

### Pattern 2: Cite-everything mode

For high-stakes deliverables, prompt:

```
You ▸ Apply the X skill. Cite every knowledge file you reference, in
      footnotes. Mark any unsupported claims as "(judgment, not sourced)".
```

This forces Codex to be explicit about its sources.

### Pattern 3: Explicit skill chain

For complex tasks that span multiple skills:

```
You ▸ Apply skills in this order:
      1. color-palette (brief: teal-blue, calm fintech)
      2. component-spec-writer for: Button, Input, Card, Modal, Toast
      3. handoff-spec to consolidate

Codex ▸ [executes all three sequentially]
```

## Codex-specific tips

### File paths in prompts

Codex resolves `~` and relative paths. Both work:

```
Read ~/dev/design-ai/skills/color-palette/PLAYBOOK.md
Read ./skills/color-palette/PLAYBOOK.md
```

### MCP integration

Codex supports MCP servers via `~/.codex/config.toml`:

```toml
[mcp_servers.figma]
command = "npx"
args = ["-y", "figma-mcp"]
env = { FIGMA_TOKEN = "..." }
```

After this, design-ai's Figma-aware skills (`figma-token-sync`, `design-pr-review`) work with live Figma data.

### No slash commands

Codex doesn't have a slash-command system. The slash commands in `commands/*.md` are still useful — Codex reads them as prompt recipes:

```
You ▸ Run the /design-from-brief command. Brief: [paragraph here].

Codex ▸ Reading: commands/design-from-brief.md
      [executes the recipe]
```

### Custom user instructions

Add design-ai to Codex's per-user instructions for system-wide availability:

```bash
mkdir -p ~/.codex/AGENTS.md.d/
ln -s ~/dev/design-ai/AGENTS.md ~/.codex/AGENTS.md.d/design-ai.md
```

(Codex 0.x+ supports composable AGENTS.md fragments.)

## Troubleshooting

### Codex can't find a knowledge file

Verify paths from the project root:
```bash
ls knowledge/colors/color-theory.md
```

If running Codex from outside the project: `cd` into design-ai first OR pass `--cd ~/dev/design-ai`.

### Output ignores Korean conventions

Prompt explicitly:

```
You ▸ Audience is Korean B2C. Apply 해요체 voice. Use 명함 90×50mm
      not international 85×55. Read knowledge/i18n/ before producing.
```

Or set in your environment / project AGENTS.md overlay.

### Output is vague / generic

The corpus knows specifics; ensure Codex actually reads them. Prompt:

```
You ▸ Before answering, read knowledge/components/INDEX.md and the three
      reference implementations cited there. Cite which library's API
      you're using.
```

## Next

- [`docs/CODEX-INTEGRATION.md`](../CODEX-INTEGRATION.md) — full setup reference
- [`docs/integrations/cursor-walkthrough.md`](cursor-walkthrough.md) — Cursor variant
- [`docs/integrations/aider-walkthrough.md`](aider-walkthrough.md) — Aider variant
- [`docs/integrations/sdk-walkthrough.md`](sdk-walkthrough.md) — Anthropic / OpenAI SDK
- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — Figma / Notion / GitHub / Slack / Linear MCPs
