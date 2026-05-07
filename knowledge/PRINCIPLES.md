<!-- hand-written -->
---
title: Design-AI principles — agent priming cheat sheet
applies_to: [all]
purpose: Single-page reference. Read at the start of every design task. Every rule cites a deeper knowledge file.
---

# Design-AI principles

The 30 load-bearing rules across this knowledge base. Read this first; it primes you for any design task. Every line links to the deeper file with reasoning + edge cases.

## Color

1. **Contrast: 4.5:1 body, 3:1 UI/large text.** Cite [`a11y/contrast.md`](a11y/contrast.md). Always state the ratio explicitly when introducing a color pair.
2. **Tokens by role, not by hex.** `--color-primary-default` not `--blue-600`. Cite [`colors/color-theory.md`](colors/color-theory.md).
3. **Dark mode is recomputed, not inverted.** Increase chroma 10–20% for low-light; reset semantic anchors. Cite [`colors/color-theory.md`](colors/color-theory.md).
4. **Money colors are a separate axis** from primary/error. `--color-money-positive` / `--color-money-negative` / `--color-money-neutral`. Cite [`patterns/money-and-amount.md`](patterns/money-and-amount.md).
5. **Korean stock convention is INVERTED**: red=up, blue=down. Cite [`patterns/money-and-amount.md`](patterns/money-and-amount.md).
6. **Color + icon redundancy.** Never encode meaning by color alone — pair with icon, label, or pattern. Cite [`a11y/contrast.md`](a11y/contrast.md).

## Typography

7. **Korean +10% line-height** vs Latin defaults. Body 1.5 → 1.6. Cite [`i18n/korean-typography.md`](i18n/korean-typography.md).
8. **Korean body emphasis = weight 600** (not 500). Hangul reads thinner at the same numeric weight. Cite [`i18n/korean-typography.md`](i18n/korean-typography.md).
9. **Tabular numerals for amounts.** `font-feature-settings: 'tnum' 1`. Cite [`patterns/money-and-amount.md`](patterns/money-and-amount.md).
10. **Pretendard for Korean primary.** Pairs Hangul + Latin in matched proportions. Cite [`i18n/korean-typography.md`](i18n/korean-typography.md).
11. **Type scale: base 14 product UI / 18+ marketing.** Ratio 1.25 (major third) is the safe default. Cite [`typography/type-scale-fundamentals.md`](typography/type-scale-fundamentals.md).

## Spacing & layout

12. **4-base spacing scale.** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. No arbitrary values. Cite [`layout/spacing-and-grid.md`](layout/spacing-and-grid.md).
13. **12-col grid, 24px gutter.** Standard for product UIs. Container queries for component-internal layout. Cite [`layout/spacing-and-grid.md`](layout/spacing-and-grid.md).
14. **Korean consumer mobile is denser** than Western defaults. Reduce padding ~15–25% from MUI/Material defaults. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).

## Motion

15. **Three duration tiers**: 150ms (micro) / 250ms (component) / 400ms (hero only). Cite [`motion/principles.md`](motion/principles.md).
16. **`ease-out` for entrances, `ease-in` for exits, `ease-in-out` for position changes.** Cite [`motion/principles.md`](motion/principles.md).
17. **Respect `prefers-reduced-motion`.** Drop fade/scale/parallax; keep state changes. Cite [`motion/principles.md`](motion/principles.md).

## Accessibility

18. **Every interactive element keyboard-reachable** with visible focus indicator (≥ 2px, 3:1 contrast). Cite [`a11y/keyboard-and-focus.md`](a11y/keyboard-and-focus.md).
19. **Touch targets ≥ 44×44 mobile / ≥ 24×24 web AA.** Use `hitSlop` to extend without growing visual. Cite [`a11y/keyboard-and-focus.md`](a11y/keyboard-and-focus.md).
20. **Modal: focus trap on open, restore focus on close, Escape closes.** Cite WAI-ARIA Dialog Pattern + [`examples/component-modal.md`](../examples/component-modal.md).
21. **Form errors via `aria-invalid` + `aria-describedby`** pointing at the error text. Cite [`patterns/form-design.md`](patterns/form-design.md).
22. **Disabled state requires `aria-disabled`** in addition to native `disabled`. Cite [`a11y/keyboard-and-focus.md`](a11y/keyboard-and-focus.md).

## Forms

23. **Single column, labels above, validate on blur.** Cite [`patterns/form-design.md`](patterns/form-design.md).
24. **Mark optional with `(optional)`, not required with `*`.** Required is the default; mark exceptions. Cite [`patterns/form-design.md`](patterns/form-design.md).
25. **Korean: separate marketing-consent checkbox** from required-terms. Pre-checked is illegal. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).
26. **Phone-first auth + KakaoTalk login** for Korean consumer apps. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).
27. **Daum Postcode API for any Korean address field.** Never free-form. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).

## Lists & navigation

28. **Virtualize lists > 50 items** (FlatList on RN, react-virtual on web). Skeleton on first load only. Cite [`patterns/list-and-feed.md`](patterns/list-and-feed.md).
29. **Bottom-tab-bar for Korean consumer mobile** (3–5 tabs, always with Korean labels). Cite [`patterns/mobile-navigation.md`](patterns/mobile-navigation.md).

## Components

30. **When specing a component, cite all 3 references** (Ant Design, MUI, shadcn-ui) and explain API choices ("API choices made" section). Don't invent — adapt. Cite [`skills/component-spec-writer/PLAYBOOK.md`](../skills/component-spec-writer/PLAYBOOK.md).

## Data visualization

31. **Pick palette type by data shape**: sequential (low→high), diverging (positive↔negative), categorical (distinct). Cite [`patterns/chart-color-encoding.md`](patterns/chart-color-encoding.md).
32. **≤ 8 categorical colors.** More than 8 = user can't track. Cite [`patterns/chart-color-encoding.md`](patterns/chart-color-encoding.md).
33. **Dashboard order: KPI row → primary chart → secondary 2-up → detail table.** Cite [`patterns/dashboard-composition.md`](patterns/dashboard-composition.md).
34. **"Last updated" indicator on every live dashboard.** Cite [`patterns/realtime-data.md`](patterns/realtime-data.md).
35. **Don't blast updates** — throttle to ≤10/sec per element, batch high-frequency. Respect `prefers-reduced-motion`. Cite [`patterns/realtime-data.md`](patterns/realtime-data.md).

## Output discipline

When producing any design artifact:

- **Cite knowledge files** for every claim category. No silent assertions.
- **Contrast matrix** for any color-related output.
- **Tokens by name in semantic layer**, hex only in primitive layer.
- **Light + dark** when both requested. Recomputed.
- **Don't section** with at least 2 specific misuses.
- **Korean considerations** if `language` includes `ko`.

## When in doubt

- Default to **boring, defensible, cited** over **clever, novel, justified-by-vibe**.
- If the upstream design systems all do X, do X unless you have a specific reason.
- If you're unsure, ask one clarifying question. Don't guess.
- Open the relevant `knowledge/<category>/<file>.md` rather than reasoning from training data.

## How this file is used

- **Loaded at session start** by the agent (alongside `AGENTS.md` / `CLAUDE.md`).
- **Re-read before declaring an artifact complete** — verification phase reference.
- **Cited in artifacts** as `PRINCIPLES.md` for the broad rules; specific files for details.
