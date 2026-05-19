# design-system-qa — playbook

Audit a design system for drift, regression, and inconsistency. Output is a prioritized findings list with concrete CI/lint integration recommendations.

## When to use

- "Audit our design system QA"
- "We have visual bugs slipping into prod — set up testing"
- "Tokens are drifting — how do we lock this down?"
- Pre-release: "Is the design system ready to ship?"

## Inputs (ask if missing)

1. **Current QA state**: existing tests? CI pipeline? Visual regression? A11y testing?
2. **Stack**: React + Storybook + Tailwind? React Native + Detox? Vue + Vitest?
3. **Scale**: number of components, number of consuming products, team size.
4. **Pain points**: what's been breaking? Tokens? Visual? A11y? API?
5. **Budget**: free tools only or willing to pay (Chromatic, Percy)?

## Steps

### 1. Inventory current QA coverage

For each layer, document what exists:

| Layer | Tools currently in use? |
| --- | --- |
| TypeScript / type safety | tsc, strict mode? |
| Token drift | lint rule? Stylelint? |
| Component contract tests | Jest/Vitest + Testing Library? |
| A11y | axe-core, storybook-addon-a11y? |
| Visual regression | Chromatic, Percy, Playwright snapshots? |
| Figma sync diff | Manual? Tokens Studio? Custom script? |

Cite [`knowledge/patterns/design-system-qa.md`](../../knowledge/patterns/design-system-qa.md) for the canonical layer model.

### 2. Identify gaps

For each missing layer, document:
- What it would catch
- Estimated setup effort (S/M/L)
- Recurring cost (free / paid)
- Recommended tool

### 3. Audit existing tests for quality

Existing tests aren't necessarily good tests. Run:

- **Coverage report**: which components have any tests?
- **Story inventory**: how many stories per component? Cover all variants × states?
- **A11y violations**: run axe on all stories. Count current violations.
- **Visual snapshot age**: how recent are baselines? Many old snapshots might mask real bugs.

### 4. Priority-order the gaps

Use this severity:

| Severity | Gap |
| --- | --- |
| 🔴 Critical | No a11y testing, raw hex in component code, no TypeScript |
| 🟠 High | No contract tests, no Storybook stories, manual visual review only |
| 🟡 Medium | Visual regression incomplete, Figma sync not automated |
| 🟢 Low | Edge case stories missing, dark mode not snapshot-tested |

### 5. Recommend a tactical setup

Based on stack + budget, propose:

```
Stack: React + Tailwind + Storybook
Budget: free tier OK

Recommended Phase 1:
1. Add storybook-addon-a11y (free) — catches ~80% of a11y issues at story level
2. Set up axe-playwright for page-level a11y (free)
3. Configure Stylelint with no-color-literal rule (free)
4. Set up TypeScript strict mode if not already (free)
5. Write contract tests for top 5 components (Button, Input, Modal, etc.)

Phase 2 (later):
6. Chromatic for visual regression (paid: $149/mo for Pro tier)
   OR: Playwright + image-snapshot if free is required
7. Token drift Figma sync diff
8. Per-component QA checklist enforcement
```

### 6. Write the report

Use the structure:

```markdown
# Design System QA Audit

> Reviewed: <date>
> System: <name>
> Reviewer: design-system-qa skill

## Summary
- Critical gaps: <n>
- High: <n>
- Medium: <n>
- Low: <n>
- Recommended tools to adopt: <n>

## Layer 1: TypeScript / type safety
- Status: ✓ in place / ⚠ partial / ✗ missing
- Findings: ...

## Layer 2: Token drift detection
- Status: ...
- Recommendation: Add Stylelint `color-no-hex` rule (free, 30min setup)
  - Example config: ...

## Layer 3: Component contract tests
...

## Layer 4: A11y regression
...

## Layer 5: Visual regression
...

## Layer 6: Figma sync diff
...

## CI pipeline integration
- Recommended GitHub Actions workflow: ...

## Phased rollout
- Phase 1 (this sprint): ...
- Phase 2 (next quarter): ...

## Cited sources
- knowledge/patterns/design-system-qa.md
```

## Verification phase (run before declaring done)

- [ ] Did I cite `knowledge/patterns/design-system-qa.md` for the layer model?
- [ ] Does every gap have a specific recommended tool with cost + setup effort?
- [ ] Is each Critical issue actionable within one sprint?
- [ ] Did I propose a CI pipeline (or extend an existing one)?
- [ ] Did I include a phased rollout (not "do everything at once")?
- [ ] Did I distinguish between layers a tool catches and what still needs human review?
- [ ] Did I tailor recommendations to the user's stack and budget (not generic)?

## Source files this skill reads

- [`knowledge/patterns/design-system-qa.md`](../../knowledge/patterns/design-system-qa.md) — full layer model
- [`docs/TOKEN-SYNC.md`](../../docs/TOKEN-SYNC.md) — token sync workflows
- [`docs/FIGMA-INTEGRATION.md`](../../docs/FIGMA-INTEGRATION.md) — Figma side
- [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md) — what a11y tests catch
- [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md) — what keyboard tests catch
- The component specs in [`examples/README.md`](../../examples/README.md) — what contract tests should verify per component

## Done when

- One audit report file.
- Every gap rated by severity.
- Every recommendation has tool + cost + setup effort.
- Phased rollout (Phase 1 = this sprint, Phase 2 = next quarter).
- CI pipeline recommendation with specific GitHub Actions / GitLab CI config.
- Verification checklist passes.
