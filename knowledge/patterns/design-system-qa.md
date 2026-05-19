<!-- hand-written -->
---
title: Design system QA — visual regression, token drift, a11y regression
applies_to: [design-system, ci, testing]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Design system QA

A design system without QA decays. Tokens drift from spec, components deviate from their docs, accessibility regresses silently. This is the test pyramid for a design system.

## What can break

| What | How it breaks | Detection |
| --- | --- | --- |
| **Token values** | Engineer hard-codes a hex instead of using a token | Token drift lint |
| **Component visual** | Padding off by 4px after refactor | Visual regression test |
| **Component API** | Prop signature changes silently | TypeScript + breaking-change detection |
| **A11y** | New change introduces contrast under 4.5:1 | A11y regression (axe / lighthouse) |
| **Token-to-Figma sync** | Code says brand-600 = #7C3AED; Figma still has #8B5CF6 | Sync diff CI job |
| **Cross-component consistency** | Button radius is 8px, Input radius is 10px | Token-usage lint |

## Test pyramid

```
                   ┌───────────────────────┐
                   │  Visual regression    │  ← slow, expensive (Chromatic / Percy)
                   │  (per release)         │
                   └───────────────────────┘
              ┌────────────────────────────────┐
              │  A11y regression (axe-core)    │  ← per PR, fast
              │  Token-usage lint              │
              │  Component contract tests       │
              └────────────────────────────────┘
       ┌────────────────────────────────────────────┐
       │  Unit: utility functions (color, format)   │  ← per commit, instant
       │  Type: TypeScript on tokens + props        │
       └────────────────────────────────────────────┘
```

## Layer 1 — token drift detection

### Rule: no raw hex values in component code

Engineers should **only reference tokens** — never inline `#7C3AED`. Lint catches violations:

```js
// .eslintrc — design-tokens-only rule
{
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
        message: "Use a design token, not a raw hex value.",
      },
    ],
  },
}
```

Or via Stylelint for CSS:

```js
// .stylelintrc
{
  rules: {
    "color-no-hex": [true, { severity: "error" }],
  },
}
```

Allow exceptions in:
- The token source file itself (`tokens/source.json`).
- Generated outputs (`tokens.css`).

### Rule: tokens must reference, not duplicate

Semantic tokens reference primitive tokens; they don't duplicate hex:

```yaml
# Correct
color.semantic.primary:
  $value: "{color.brand.primary.600}"

# Wrong (duplicates the value)
color.semantic.primary:
  $value: "#7C3AED"
```

Style Dictionary and similar tools resolve `{path}` references; CI lints for direct values in semantic layers.

### Token sync diff (Figma ↔ code)

If both code and Figma host tokens, drift is inevitable. CI job:

```bash
#!/bin/bash
# Pull Figma tokens via REST API
curl -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FIGMA_FILE/variables/local" \
  | jq '...transform...' > /tmp/figma-tokens.json

# Diff against committed tokens
diff tokens/source.json /tmp/figma-tokens.json && echo "in sync" || {
  echo "DRIFT DETECTED"
  exit 1
}
```

Run nightly OR on PR open. Fail PR if Figma tokens have drifted from `source.json`.

Decide a direction-of-truth:
- **Code is source**: drift means Figma needs update. Notify designer.
- **Figma is source**: drift means code needs regeneration. Auto-PR if possible.

See [`docs/TOKEN-SYNC.md`](../../docs/TOKEN-SYNC.md) for the broader sync strategy.

## Layer 2 — visual regression

Renders every component (or screen) and pixel-compares against a baseline image. Fails if pixels diverge beyond a threshold.

### Tools

| Tool | Cost | Use |
| --- | --- | --- |
| **Chromatic** | Paid (Storybook integration) | Best DX. Cloud-based. Diffs per PR. |
| **Percy** (BrowserStack) | Paid | Similar to Chromatic. Less Storybook-tight. |
| **Loki** | Free | OSS, pairs with Storybook. Limited features. |
| **Playwright + image-snapshot** | Free | Roll-your-own with Playwright tests + screenshot diff. |
| **happo** | Paid | Cross-browser visual regression. |

### What to capture

A test catalog (Storybook stories + critical screen flows):

```js
// Storybook story per component variant
export const PrimarySolid = () => <Button intent="primary" variant="solid">Save</Button>;
export const PrimaryDisabled = () => <Button intent="primary" disabled>Save</Button>;
export const PrimaryLoading = () => <Button intent="primary" loading>Save</Button>;
// ... for each variant × size × state combination
```

For a Button with 4 intents × 4 variants × 3 sizes × 6 states ≈ 288 visual tests. Catch any unintended pixel change.

### Threshold tuning

Set per-test threshold (typically 0.1–0.2% pixel diff):

- **Too tight**: anti-aliasing changes flag every test.
- **Too loose**: real regressions pass through.
- Calibrate against your CI runner's font rendering (varies between OSes).

### Approve workflow

When a real change happens:
1. PR introduces visual change.
2. CI flags diffs.
3. Reviewer inspects (Chromatic shows side-by-side).
4. Reviewer approves diffs as new baseline.
5. Merge.

Don't mass-approve without inspection — defeats the purpose.

### What to skip

- **Chart rendering** with random data — flaky.
- **Animations mid-frame** — capture at known states (start, settled, end).
- **Localized text** — separate per-locale snapshot or use a locale-agnostic placeholder.

## Layer 3 — a11y regression

Axe-core or Lighthouse catches common a11y violations programmatically.

### Tools

- **axe-core**: industry standard. Integrates with Storybook (`storybook-addon-a11y`), Playwright, Cypress.
- **Lighthouse**: broader audit (a11y, perf, SEO). Run in CI.
- **pa11y-ci**: CLI a11y testing.

### Per-component (Storybook + axe)

```ts
// Storybook addon-a11y runs axe on every story
// Failures block CI
```

Catches:
- Missing `<label>` for inputs
- Missing `alt` on images
- Insufficient contrast (computed from CSS)
- Missing `aria-label` on icon-only buttons
- Invalid ARIA combos
- Heading hierarchy issues

Doesn't catch:
- Custom keyboard interactions (must hand-test)
- Focus management on dynamic content (must hand-test)
- Screen reader announcement quality (must hand-test)

### Per-page (Playwright + axe)

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard a11y", async ({ page }) => {
  await page.goto("/dashboard");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

Run on every PR. Fail if new violations appear.

## Layer 4 — component contract tests

Tests that verify the component's API contract:

```ts
// Component spec contract test
test("Button: aria-disabled when disabled", () => {
  render(<Button disabled>Click</Button>);
  expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
});

test("Button: type defaults to button (not submit)", () => {
  render(<Button>Click</Button>);
  expect(screen.getByRole("button")).toHaveAttribute("type", "button");
});

test("Button: calls onClick on Enter key", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);
  screen.getByRole("button").focus();
  await userEvent.keyboard("{Enter}");
  expect(onClick).toHaveBeenCalled();
});
```

These run fast and catch:
- API contract violations
- Keyboard handler regressions
- ARIA attribute regressions

Pair these with the spec — every "Don't" or "States" entry in a component spec should have a contract test.

## Layer 5 — TypeScript

The strongest, cheapest layer:

```ts
// Tokens typed as a const tree
export const tokens = {
  color: {
    primary: {
      50: "#F5F3FF",
      // ...
      950: "#2E1065",
    },
  },
  // ...
} as const;

// Component prop validation
type ButtonProps = {
  intent: "primary" | "secondary" | "danger";
  size: "sm" | "md" | "lg";
  // ...
};
```

Catches API breakage at compile time. Pair with `--strict` and ESLint's `@typescript-eslint/strict-boolean-expressions` etc.

## CI pipeline — putting it together

```yaml
# .github/workflows/design-qa.yml
on: pull_request

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Layer 5: TypeScript
      - run: pnpm tsc --noEmit

      # Layer 1: Token drift / lint
      - run: pnpm lint
      - run: pnpm test:tokens-validate

      # Layer 4: Component contract tests
      - run: pnpm test:unit

      # Layer 3: A11y on Storybook
      - run: pnpm storybook:build
      - run: pnpm test:a11y

      # Layer 2: Visual regression
      - run: pnpm chromatic --auto-accept-changes=false

      # Optional: Figma sync diff
      - run: pnpm test:figma-sync
```

PR fails if any step fails. Visual regression is run-of-day (slow); the rest run on every push.

## Per-component QA checklist

When shipping a new component (or revising one), verify all five layers:

- [ ] **Tokens used** — no raw hex/values inline
- [ ] **TypeScript** — props typed, no `any`
- [ ] **Storybook stories** — all variants × sizes × states present
- [ ] **Contract tests** — required ARIA, keyboard handlers
- [ ] **A11y** — axe passes; manual keyboard test; manual screen reader spot-check
- [ ] **Visual regression** — baselines captured
- [ ] **Spec doc updated** — `examples/component-X.md` reflects API

## Korean considerations

- Visual regression for IME composition states — Hangul mid-composition can render differently. Capture states.
- Brand-color contrast (KakaoPay yellow, Toss blue, etc.) — verify focus rings clear 3:1 on these specific backgrounds.
- Korean date formatting in components — test that `2026.05.07` renders correctly across locales.

## Maintenance cadence

| Cadence | Task |
| --- | --- |
| Per PR | TypeScript + tests + a11y + visual regression |
| Nightly | Figma sync diff |
| Weekly | Lighthouse score on key pages |
| Monthly | Manual audit: spec docs vs implementation |
| Quarterly | Token drift scan: which tokens are unused? Which were added without doc updates? |

## Don't

- Don't run visual regression in headless mode without controlling for OS font rendering — false positives.
- Don't skip a11y tests because they're "annoying". They're catching real problems.
- Don't write tests after merging — write the test, then the implementation (TDD reveals API issues).
- Don't approve every diff. Approve diffs that match the intent.
- Don't gate every PR on a 5-minute Chromatic run if your team can't afford the latency. Run nightly + on release branches.
- Don't ship without contrast verification on real backgrounds. Tokens-only computation misses real-world overlays.

## Cross-reference

- [`docs/TOKEN-SYNC.md`](../../docs/TOKEN-SYNC.md) — token drift detection and Figma sync
- [`docs/FIGMA-INTEGRATION.md`](../../docs/FIGMA-INTEGRATION.md) — Figma side of QA
- [`knowledge/a11y/contrast.md`](../a11y/contrast.md) — what a11y regression catches
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — keyboard contract tests
- [`skills/design-system-qa/PLAYBOOK.md`](../../skills/design-system-qa/PLAYBOOK.md) — the skill that applies this
