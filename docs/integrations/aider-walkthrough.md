# Aider walkthrough

A concrete walkthrough of using design-ai with **Aider**, the terminal-based AI pair programmer. Picks up where [`docs/AIDER-INTEGRATION.md`](../AIDER-INTEGRATION.md) leaves off.

## Prerequisites

```bash
pip install aider-chat
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai
```

Aider needs a model API key (Anthropic, OpenAI, etc.):

```bash
export ANTHROPIC_API_KEY=...
# OR
export OPENAI_API_KEY=...
```

## Setup (60 seconds)

```bash
cd ~/projects/my-app
aider --read ~/dev/design-ai/AGENTS.md \
      --read ~/dev/design-ai/knowledge/PRINCIPLES.md \
      --model claude-sonnet-4-6
```

`--read` adds files as read-only context (Aider won't modify them). For a permanent setup, add to `.aider.conf.yml`:

```yaml
# ~/projects/my-app/.aider.conf.yml
read:
  - /Users/sungjin/dev/design-ai/AGENTS.md
  - /Users/sungjin/dev/design-ai/knowledge/PRINCIPLES.md
model: claude-sonnet-4-6
```

## Walkthrough 1: Generate a component implementation from a spec

**Goal**: Aider reads the design-ai Banner spec, produces a working React implementation in your project.

### Session

```
$ aider src/components/Banner.tsx \
        --read ~/dev/design-ai/examples/component-banner.md \
        --read ~/dev/design-ai/knowledge/i18n/korean-document-style.md

Aider v0.x — using claude-sonnet-4-6
Read: examples/component-banner.md
Read: knowledge/i18n/korean-document-style.md
Editing: src/components/Banner.tsx (new file)

> Implement Banner per the spec. Variants info / success / warning /
  error / promo. Dismissible. Use our token system (var(--color-...)).
  Korean-aware copy in defaults.

[Aider produces the implementation]

[Aider proposes a diff and asks to apply]

> y

Applied: src/components/Banner.tsx
```

The `--read` flags tell Aider to use design-ai files as context but never modify them. Your edits land only in the working files (`src/components/Banner.tsx`).

## Walkthrough 2: Refactor existing component to spec

**Goal**: bring an old `Alert.tsx` up to the design-ai spec.

### Session

```
$ aider src/components/Alert.tsx \
        --read ~/dev/design-ai/examples/component-alert.md \
        --read ~/dev/design-ai/knowledge/a11y/contrast.md

> Read both files. List concrete diffs needed to make Alert.tsx match
  the spec. Then apply them.

[Aider reads, lists 5 diffs, asks to apply each]

> Apply 1, 3, 5 only. Skip 2 and 4 (those need product approval).

[Aider applies subset]
```

Aider's diff-by-diff application is great for spec compliance — you can accept critical fixes and defer subjective changes.

## Walkthrough 3: Generate a complete design system

**Goal**: bootstrap design tokens from a brief, materialized as files.

### Session

```
$ aider \
    --read ~/dev/design-ai/skills/design-system-builder/PLAYBOOK.md \
    --read ~/dev/design-ai/skills/color-palette/PLAYBOOK.md \
    --read ~/dev/design-ai/knowledge/colors/color-theory.md \
    --read ~/dev/design-ai/knowledge/i18n/korean-typography.md \
    src/tokens/colors.css \
    src/tokens/typography.css \
    src/tokens/spacing.css \
    tailwind.config.ts

> Apply design-system-builder. Brief: Korean fintech for freelancers.
  Brand: trustworthy, calm, modern. Seed color: oklch(56% 0.16 244).
  Pretendard typography. Output across the four open files. Include
  contrast matrix as comment block at top of colors.css.

[Aider produces all four files in one apply pass]
```

For multi-file deliverables, Aider's "open multiple files at once + apply atomic diff" pattern is more efficient than sequential single-file generation.

## Walkthrough 4: Audit + fix in one session

**Goal**: audit a screen for a11y, generate fixes, apply them.

### Session

```
$ aider \
    --read ~/dev/design-ai/agents/a11y-reviewer.md \
    --read ~/dev/design-ai/knowledge/a11y/contrast.md \
    --read ~/dev/design-ai/knowledge/a11y/keyboard-and-focus.md \
    src/screens/PricingScreen.tsx \
    src/screens/PricingScreen.css

> Audit PricingScreen for a11y. Report findings as
  CRITICAL / HIGH / MEDIUM / LOW. Then fix CRITICAL and HIGH automatically.

[Aider audits, lists 7 findings]
[Auto-fixes 4 CRITICAL/HIGH]
[Asks about 3 lower-severity]

> Skip those for now.

[Aider commits the fixes with a clear message]
```

## Aider-specific patterns

### Read-only vs editable files

```
aider [editable files] --read [read-only context files]
```

design-ai files should ALWAYS be `--read` (never modified by Aider). Your project files are editable.

For a typical session, expect:
- 1-3 editable target files (the component, its CSS, its test)
- 5-15 read-only design-ai files (skill playbook + relevant knowledge)

### `/add` and `/drop` for dynamic context

During a session:

```
> /add src/components/Button.tsx     # add to editable
> /read ~/dev/design-ai/examples/component-button.md   # add to read-only
> /drop src/components/Button.tsx    # remove from session
```

Useful when scope shifts mid-session.

### Architect mode for complex specs

Aider's `--architect` mode uses a stronger model for planning, then a faster one for editing:

```bash
aider --architect \
      --architect-model claude-opus-4 \
      --editor-model claude-sonnet-4-6 \
      --read ~/dev/design-ai/skills/design-system-builder/PLAYBOOK.md \
      [files...]
```

Architect mode plans the spec; editor model applies. Good for large refactors.

### Auto-commit per change

Aider auto-commits each apply by default. For design-ai workflows, that means:
- Commit 1: "Add Banner component matching design-ai spec"
- Commit 2: "Add semantic color tokens from brief"
- Commit 3: "Fix CTA contrast to WCAG AA per a11y review"

Each commit is tightly scoped. Easy to review / revert / cherry-pick.

To disable: `--no-auto-commits`.

### Test mode

```bash
aider --test-cmd "pnpm test" --auto-test
```

Aider runs your test command after each change. Useful when implementing components — tests catch regressions during the implementation pass.

## Tips

### Use design-ai PRINCIPLES as a system reminder

```bash
aider --read ~/dev/design-ai/knowledge/PRINCIPLES.md ...
```

That file is a single page summarizing the 30 load-bearing rules. Always-loaded; cheap.

### Skill-specific aliases

Add bash aliases for common workflows:

```bash
# ~/.bashrc
alias aider-design='aider --read ~/dev/design-ai/AGENTS.md --read ~/dev/design-ai/knowledge/PRINCIPLES.md --model claude-sonnet-4-6'
alias aider-spec='aider-design --read ~/dev/design-ai/skills/component-spec-writer/PLAYBOOK.md'
alias aider-palette='aider-design --read ~/dev/design-ai/skills/color-palette/PLAYBOOK.md'
```

Then:
```bash
aider-spec src/components/NewComponent.tsx
```

### Korean defaults

```bash
aider --read ~/dev/design-ai/AGENTS.md \
      --read ~/dev/design-ai/knowledge/i18n/korean-typography.md \
      --read ~/dev/design-ai/knowledge/i18n/korean-document-style.md \
      --read ~/dev/design-ai/knowledge/i18n/korean-product-conventions.md \
      [files...]
```

For Korean B2C teams, bake those reads into `.aider.conf.yml`.

## Troubleshooting

### Aider hits context limit on large skills

Aider sends `--read` files into context per-turn. For very large playbooks + many knowledge files:
- Only `--read` what's relevant per task.
- Use `/drop` to free context.
- For very large sessions, use a model with bigger context (Claude Sonnet 4.6 ≥ 200K tokens, GPT-4o ~ 128K).

### Output ignores design-ai conventions

Aider may need an explicit reminder mid-session:

```
> Following the design-ai conventions in the read-only files I gave you:
  apply the destructive variant.
```

Or ensure `AGENTS.md` is loaded as `--read`.

### Korean text gets mangled

Korean works in Aider with all major models. If Hangul renders as `?` or boxes:
- Check terminal supports UTF-8 (most do, but not always default in Windows cmd).
- Force UTF-8: `export PYTHONIOENCODING=utf-8`.

## Next

- [`docs/AIDER-INTEGRATION.md`](../AIDER-INTEGRATION.md) — full setup reference
- [`docs/integrations/codex-walkthrough.md`](codex-walkthrough.md) — Codex CLI variant
- [`docs/integrations/cursor-walkthrough.md`](cursor-walkthrough.md) — Cursor variant
- [`docs/integrations/sdk-walkthrough.md`](sdk-walkthrough.md) — Anthropic / OpenAI SDK
