# Aider integration

How to use design-ai with **Aider** (terminal-based AI pair programmer, supports Claude/GPT models).

## Quickstart

Aider's `--read` flag adds files as read-only context. Pass design-ai entry docs at startup:

```bash
cd /path/to/your/project

aider \
  --read /path/to/design-ai/AGENTS.md \
  --read /path/to/design-ai/knowledge/PRINCIPLES.md \
  --message "Generate a fintech color palette for a Korean B2C app"
```

Aider primes itself with the design-ai context, then handles the task in your project.

## Configuration via `.aider.conf.yml`

For repeated use, configure at the project level:

```yaml
# .aider.conf.yml — in your consuming project's root

read:
  - /path/to/design-ai/AGENTS.md
  - /path/to/design-ai/knowledge/PRINCIPLES.md
  - /path/to/design-ai/knowledge/a11y/contrast.md
  - /path/to/design-ai/knowledge/a11y/keyboard-and-focus.md
  - /path/to/design-ai/knowledge/i18n/korean-typography.md       # if Korean
  - /path/to/design-ai/knowledge/i18n/korean-product-conventions.md

# Read-only references — Aider won't try to edit them
auto-commits: false              # safer for design-ai docs
edit-format: diff                # cleaner for design system files

# Map to your model preference
model: claude-3-5-sonnet
```

Now `aider` in this project auto-loads design-ai context.

## Per-task context loading

For specific tasks, pair the entry docs with the relevant skill playbook:

```bash
# Color palette
aider \
  --read /path/to/design-ai/AGENTS.md \
  --read /path/to/design-ai/knowledge/PRINCIPLES.md \
  --read /path/to/design-ai/skills/color-palette/PLAYBOOK.md \
  --read /path/to/design-ai/knowledge/colors/color-theory.md \
  --read /path/to/design-ai/knowledge/colors/palettes-by-product-type.md \
  --message "Apply color-palette skill to: B2C fintech, Korean, teal seed"

# Component spec
aider \
  --read /path/to/design-ai/AGENTS.md \
  --read /path/to/design-ai/skills/component-spec-writer/PLAYBOOK.md \
  --read /path/to/design-ai/knowledge/components/INDEX.md \
  --read /path/to/design-ai/examples/component-button.md \
  --message "Spec a custom RadioCard component"

# UX audit
aider \
  --read /path/to/design-ai/AGENTS.md \
  --read /path/to/design-ai/skills/ux-audit/PLAYBOOK.md \
  --read /path/to/design-ai/knowledge/patterns/ux-guidelines.md \
  --message "Audit src/screens/Checkout.tsx"
```

Aider opens with full context, then operates on your project files.

## Per-skill scripts

Save shell aliases for common tasks:

```bash
# In ~/.bashrc or ~/.zshrc

DESIGN_AI=/path/to/design-ai

# Palette generation
alias design-palette='aider \
  --read $DESIGN_AI/AGENTS.md \
  --read $DESIGN_AI/knowledge/PRINCIPLES.md \
  --read $DESIGN_AI/skills/color-palette/PLAYBOOK.md \
  --read $DESIGN_AI/knowledge/colors/color-theory.md'

# Component spec
alias design-spec='aider \
  --read $DESIGN_AI/AGENTS.md \
  --read $DESIGN_AI/skills/component-spec-writer/PLAYBOOK.md \
  --read $DESIGN_AI/knowledge/components/INDEX.md'

# UX audit
alias design-audit='aider \
  --read $DESIGN_AI/AGENTS.md \
  --read $DESIGN_AI/skills/ux-audit/PLAYBOOK.md \
  --read $DESIGN_AI/knowledge/patterns/ux-guidelines.md \
  --read $DESIGN_AI/knowledge/a11y/contrast.md'

# QA audit
alias design-qa='aider \
  --read $DESIGN_AI/AGENTS.md \
  --read $DESIGN_AI/skills/design-system-qa/PLAYBOOK.md \
  --read $DESIGN_AI/knowledge/patterns/design-system-qa.md'
```

Then:

```bash
cd my-project
design-palette "fintech B2C, teal seed, Korean"
```

## Aider-specific features

### `/read` and `/drop` mid-conversation

Aider lets you add/remove read-only files mid-conversation:

```
> /read /path/to/design-ai/knowledge/i18n/korean-payments.md

OK, now I'll consider Korean payment patterns in suggestions.

> Apply that to checkout flow

[Aider produces output citing the Korean payment file]

> /drop /path/to/design-ai/knowledge/i18n/korean-payments.md
```

This keeps the context lean — only load what you need for the current step.

### Repo map

Aider auto-builds a repo map of your project. To include design-ai in the map, either symlink it as a folder OR keep it separate and use `--read` for explicit loading.

For most workflows: keep design-ai separate; load specific files via `--read` per task.

### Model routing

Aider supports multiple models per task:

```bash
aider --model claude-3-5-sonnet     # heavy design tasks
aider --model haiku                  # quick edits
```

For design-ai tasks: prefer Sonnet/Opus. Haiku may miss the citation discipline.

## Aider workflow patterns

### Pattern A: Apply skill + edit code

```bash
cd my-project

aider \
  --read /path/to/design-ai/AGENTS.md \
  --read /path/to/design-ai/skills/component-spec-writer/PLAYBOOK.md \
  --read /path/to/design-ai/examples/component-button.md \
  src/components/Button/Button.tsx

# Now in Aider:
> "Refactor src/components/Button/Button.tsx to match the spec.
>  Include all variants and states from the spec."
```

Aider edits Button.tsx per the spec, with design-ai's discipline.

### Pattern B: Generate spec, then implement

```bash
# Step 1: Generate the spec
aider \
  --read /path/to/design-ai/AGENTS.md \
  --read /path/to/design-ai/skills/component-spec-writer/PLAYBOOK.md \
  --message "Spec a Toast component for our React + Tailwind project. Save to docs/component-toast.md."

# Step 2: Implement against the spec
aider \
  --read docs/component-toast.md \
  --message "Implement Toast in src/components/Toast/Toast.tsx per the spec."
```

Two passes; spec is the contract between them.

### Pattern C: Apply iterate command

```bash
aider \
  --read /path/to/design-ai/commands/iterate.md \
  --read examples/palette-saas-violet.md \
  --message "Apply iterate to palette-saas-violet with critique:
  Primary feels too saturated. Add a tertiary text color. Increase
  focus-ring contrast on light bg."
```

Aider applies the change + outputs a changelog.

## Common pitfalls

| Pitfall | Fix |
| --- | --- |
| Aider tries to edit design-ai files | Load with `--read` (read-only). Aider won't suggest edits to read-only files. |
| Aider's repo map crowds context | Disable repo map for design-tasks: `--map-tokens 0`. |
| Aider invents APIs without checking refs/ | Pass relevant `examples/component-*.md` and `refs/` paths explicitly. |
| Aider's diff output is hard to read for design specs | Use `--edit-format whole` for design-ai output (full file replacement is clearer for spec docs). |

## Cross-reference

- [`docs/USING.md`](USING.md) — multi-agent setup overview
- [`docs/CODEX-INTEGRATION.md`](CODEX-INTEGRATION.md) — Codex CLI deep-dive
- [`docs/CURSOR-INTEGRATION.md`](CURSOR-INTEGRATION.md) — Cursor IDE setup
- [`AGENTS.md`](../AGENTS.md) — universal agent instructions
- [`knowledge/PRINCIPLES.md`](../knowledge/PRINCIPLES.md) — agent priming
