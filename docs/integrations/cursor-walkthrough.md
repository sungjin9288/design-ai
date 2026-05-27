# Cursor walkthrough

A concrete walkthrough of using design-ai with **Cursor IDE**. Picks up where [`docs/CURSOR-INTEGRATION.md`](../CURSOR-INTEGRATION.md) leaves off — that's setup; this is workflow.

## Prerequisites

```bash
# Install Cursor (cursor.sh)
# Get design-ai
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai
```

## Setup (90 seconds)

### Option A: `.cursorrules` in your consuming project

The most common pattern. Create `.cursorrules` in the project where you want design-ai's expertise:

```bash
cd ~/projects/my-app
cat > .cursorrules <<'EOF'
You are a senior product designer with 20+ years of experience in UI/UX,
design systems, accessibility (WCAG 2.1 AA), and Korean market design.

For any design task, follow this protocol:
1. Read /Users/sungjin/dev/design-ai/AGENTS.md (universal entry point).
2. Read /Users/sungjin/dev/design-ai/knowledge/PRINCIPLES.md (30 load-bearing rules).
3. Find the matching skill in /Users/sungjin/dev/design-ai/skills/<skill-name>/PLAYBOOK.md.
4. Apply it. Cite knowledge files for every claim.
5. For Korean content, default to Pretendard + 해요체 (consumer) or 합쇼체 (formal).
6. Mark unsourced claims as "(judgment, not sourced)".

Skills available:
- color-palette, component-spec-writer, ux-audit, design-critique
- design-system-builder, handoff-spec, design-system-qa, design-pr-review
- figma-token-sync, design-broadcast, document-author, slide-deck-author
- motion-designer, illustration-designer, print-designer, video-designer
- game-ui-designer, conversational-ui-designer, spatial-designer

Skills are at /Users/sungjin/dev/design-ai/skills/<name>/PLAYBOOK.md.
EOF
```

Cursor auto-loads `.cursorrules` at chat start.

### Option B: Add design-ai as workspace folder

```
File → Add Folder to Workspace → ~/dev/design-ai
```

Then reference files via `@` in chat:

```
@design-ai/skills/color-palette/PLAYBOOK.md apply this for a teal-blue
fintech app.
```

The `@` autocomplete searches your whole workspace; design-ai's structured tree shows up clearly.

## Walkthrough 1: Spec a component inline

**Goal**: working in your app's codebase, ask Cursor to spec a Banner component, then implement it.

### Session

```
You ▸ (in src/components/Banner.tsx, file open)
      @design-ai/skills/component-spec-writer/PLAYBOOK.md
      @design-ai/examples/component-banner.md

      Spec a Banner component for our system. Persistent in-page strip
      for system status. Variants: info / success / warning / error /
      promo. Dismissible. Korean copy.

Cursor ▸ I'll apply the component-spec-writer skill using the existing
       Banner spec as reference, adapted to your codebase.

       [generates a spec inline in chat]
       [includes a tabular API, anatomy, states, tokens]

You ▸  Now implement the spec as a React component in this file. Use
       our existing token system (`var(--color-banner-bg-info)` etc).
       Follow our patterns from src/components/Alert.tsx for the
       dismiss button.

Cursor ▸ [generates Banner.tsx implementation]
```

The two-step workflow — **spec first, then implement** — is the key Cursor pattern. Specs are knowledge artifacts; implementation is code.

## Walkthrough 2: Audit existing component

**Goal**: cursor reviews your current Button component against design-ai's spec.

### Session

```
You ▸ Open src/components/Button.tsx side-by-side with
      @design-ai/examples/component-button.md.

      Audit my Button against the spec. Flag missing variants, missing
      states, a11y gaps, and Korean considerations.

Cursor ▸ Comparing your Button.tsx against component-button.md.

       Findings:

       [HIGH] Missing `loading` state. Spec section "States" requires
       a loading variant with spinner + disabled events. Your
       component has no loading prop.

       [HIGH] Missing `asChild` support. Spec section "Composition
       patterns" → asChild lets the Button render as a Link or other
       slot. Your version is button-only.

       [MEDIUM] Touch target. Spec requires ≥ 44pt for primary mobile;
       your `size="sm"` is 32px tall. Acceptable for desktop secondary;
       fail for mobile primary.

       [LOW] Korean: no IME consideration. For inputs that lead to a
       Button submit, IME composition can swallow Enter. Recommend
       wrapping in Form's submit handler that respects compositionend.

       [recommendations with file diffs]
```

This is `design-system-qa` skill applied per-component. Powerful for raising existing codebase quality to spec.

## Walkthrough 3: Iterate on a Figma screenshot

**Goal**: paste a Figma screenshot and get a critique with concrete fixes.

### Session

```
You ▸ [pastes screenshot.png into chat]
      @design-ai/agents/design-critic.md
      @design-ai/agents/a11y-reviewer.md

      Critique this hero section. KR fintech audience.

Cursor ▸ Running design-critic + a11y-reviewer in parallel.

       Top recommendation:
       The headline carries 70% of the message but uses 24px Inter
       Light. Korean target users won't get the warmth that the
       Light weight implies in Latin. Bump to Pretendard 600
       Semibold at 32px on mobile, 48px on desktop.

       [CRITICAL]
       - CTA contrast 3.4:1 (white text on
         oklch(70% 0.16 240)) fails WCAG AA. Bump bg to
         oklch(58% 0.18 240) to clear 4.5:1.

       [HIGH]
       - Sub-headline uses `당신의 ...` — too formal-distant.
         Rewrite using `~해요`: "여러분의 송금을 더 쉽게 만들어요".
       - Sale-30% badge near CTA competes for attention. Move
         to upper-right corner of card or remove.

       [Suggested rewrites]
```

## Walkthrough 4: Generate tokens from brand brief

**Goal**: bootstrap a design token file from a brand brief, exported as both CSS and Tailwind config.

### Session

```
You ▸ @design-ai/skills/color-palette/PLAYBOOK.md

      Generate a full palette for a Korean fintech for freelancers.
      Brand: trustworthy, calm, modern. Seed: oklch(56% 0.16 244).
      Output: src/tokens/colors.css (CSS vars) + tailwind.config.ts
      (extending colors). Include dark mode.

Cursor ▸ [reads the playbook]
       [generates both files in your project]

You ▸  Now add semantic aliases (--color-primary-default, etc) per the
       spec. And add a contrast matrix as a comment block at the top
       of colors.css.

Cursor ▸ [updates files]
```

## Walkthrough 5: Use Cursor's `Cmd+K` for in-place edits

For tight iteration loops, Cursor's `Cmd+K` (inline edit) works with design-ai context if you set the rules globally.

```
[select a problematic JSX block]
[press Cmd+K]
"Make this match design-ai's component-button.md spec for the
 'destructive' variant. Use our color tokens."
```

Cursor reads the spec via the workspace context and rewrites in place.

## Cursor-specific tips

### MCP servers

Cursor 0.40+ supports MCP. Add design-aware MCPs:

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-mcp"],
      "env": { "FIGMA_TOKEN": "..." }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "..." }
    }
  }
}
```

Then design-ai's Figma + GitHub-aware skills (`figma-token-sync`, `design-pr-review`) work with live data.

### Composer mode

For multi-file changes (e.g., refactoring 5 components to match a new spec), use Cursor Composer:

```
[Composer mode]
"Apply the destructive variant from
@design-ai/examples/component-button.md to all uses of
DangerButton in src/. Update the component, the storybook,
and any usage. Match our token system."
```

Composer reads the spec once, applies across files.

### Per-project AGENTS.md fork

For large projects, fork the design-ai AGENTS.md into your project:

```bash
cp ~/dev/design-ai/AGENTS.md ./AGENTS.md
# Edit to add project-specific overrides + the design-ai paths.
```

Cursor reads project `AGENTS.md` (when present) AND `.cursorrules`.

## Troubleshooting

### Cursor doesn't pick up `.cursorrules`

Restart Cursor. Or `Cmd+Shift+P → Developer: Reload Window`.

### `@` doesn't autocomplete design-ai files

Add the design-ai folder to your workspace (not just `.cursorrules`). Cursor's `@` indexes workspace folders only.

### Korean conventions are inconsistent across the session

Add an explicit reminder to `.cursorrules`:

```
For Korean content, ALWAYS:
- Pretendard for typography
- 해요체 (consumer) or 합쇼체 (formal) — never mix in one component
- 명함 90×50mm not international 85×55
```

### Cursor uses GPT-4 instead of Claude

design-ai is model-agnostic. Both work. For best output on long-form synthesis tasks, Claude Sonnet 4.6+ is slightly stronger; for code generation, GPT-4o + Claude both work. Switch via Cursor's model picker (Cmd+/ → Model).

## Next

- [`docs/CURSOR-INTEGRATION.md`](../CURSOR-INTEGRATION.md) — full setup reference
- [`docs/integrations/codex-walkthrough.md`](codex-walkthrough.md) — Codex CLI variant
- [`docs/integrations/aider-walkthrough.md`](aider-walkthrough.md) — Aider variant
- [`docs/integrations/sdk-walkthrough.md`](sdk-walkthrough.md) — Anthropic / OpenAI SDK
- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — MCP servers
