# Dogfood findings — 1차 검증

Self-critique of the design-ai system after running an end-to-end realistic scenario: bootstrap a Korean fintech mobile app design system.

**Output produced**: [examples/dogfood-korean-fintech-system.md](../examples/dogfood-korean-fintech-system.md)

This document captures what worked, what gaps emerged, and what to prioritize next.

## What worked well

### 1. Token cascade was clean

The path from `palettes-by-product-type.md` (curated reference) → palette generation → semantic aliases → contrast matrix → light/dark → Style Dictionary output was traceable and deterministic. Every value in the output had a citation back to a knowledge source.

### 2. Korean i18n knowledge was load-bearing

Without `knowledge/i18n/korean-typography.md`, the type scale would default to Latin numbers. Pretendard recommendation, line-height bump, weight-600-for-emphasis — all came directly from the knowledge file and shaped the actual deliverable. Writing this knowledge upfront was correct.

### 3. Motion + a11y citations made the doc credible

The contrast matrix, focus-ring color choice, and motion duration tokens all cite specific knowledge files. A skeptical engineer can audit each claim. This is the difference between "a document the AI wrote" and "a document grounded in reasoning".

### 4. The "don't" sections forced explicit tradeoffs

`Don't use --color-primary-default for amount text` — that rule emerged from thinking about money-color semantics. Without the spec template's "Don't" section pushing me to articulate it, the rule would be implicit and lost to future maintainers.

### 5. Reference shape from worked examples paid off

Having `examples/component-button.md`, `palette-saas-violet.md` set the bar for output quality. The dogfood deliverable would have been thinner without those reference shapes.

## What's missing

### 1. No agent or skill for "money-aware" components

Fintech needs `AmountInput`, `AmountDisplay`, `TransactionListItem` — patterns that don't exist in any of the upstream design systems (Ant, MUI, shadcn don't have a "money input"). I had to **invent** these in the dogfood doc with no scaffolding.

**Action**: add `knowledge/patterns/money-and-amount.md` covering:
- Currency display rules (separator, suffix, ₩ vs 원)
- Amount input ergonomics (auto-format, paste handling, zero-leading)
- Color semantics for positive/negative/neutral
- Tabular numerals + alignment
- Rounding (KRW always integer)
- Negative display (parentheses vs minus)

### 2. No skill for React Native / mobile-first variants

The dogfood scenario chose React Native + NativeWind. `component-spec-writer` and `color-palette` skills assume web. They produced the right tokens but the spec wording leaked web concepts (`@media (hover: hover)`, `cursor: pointer`) that don't apply.

**Action**:
- Add a `knowledge/platforms/react-native.md` file capturing RN-specific differences (StyleSheet, Pressable vs button, no hover, safe-area-inset translation, NativeWind quirks).
- Update skill playbooks to ask "platform: web | RN | both" upfront.

### 3. No bottom-tab-bar / mobile navigation pattern

The fintech app needs a bottom tab bar — Korean consumer convention. Cite-able pattern doesn't exist in `knowledge/`. I winged it.

**Action**: add `knowledge/patterns/mobile-navigation.md`:
- Bottom tab bar (rules, max tabs, icon+label)
- Top app bar (titles, actions, back behavior)
- Nested navigation (stack vs tab)
- Modal screen pattern (full-screen sheet)
- Search behavior on mobile

### 4. No skill for "translate brand brief to color seed"

The scenario said "trustworthy + approachable + youthful" and I had to manually translate that to teal-600. There's no documented decision rule for going from mood-words to a hex.

**Action**: extend `skills/color-palette/PLAYBOOK.md` with a "mood → hue mapping" section:
- Trustworthy: blue family (215–245°), teal family (170–195°)
- Approachable: warmer hues (5–60°), softer chroma
- Youthful: higher chroma, brighter lightness anchor
- Premium: muted, dark anchors, near-monochrome
- Energetic: complementary or split-complementary, high chroma
- Calm: analogous, muted
- ...

This is craft knowledge that should be encoded.

### 5. No template for "starter component list"

The dogfood doc has a starter component list. No template or playbook tells me what should go on it. I went by gut.

**Action**: add to `skills/design-system-builder/PLAYBOOK.md`:
- Default starter set by product category (consumer mobile, B2B SaaS, e-commerce, content, etc.)
- "Always-needed" core (Button, Input, Modal, Toast, Card)
- Category-specific extensions

### 6. Hand-off section was thin

The "what eng needs to do" section is 9 bullets. A real handoff document would specify package versions, exact file paths, CI integration, testing approach, design-review cadence.

**Action**: enrich `skills/handoff-spec/PLAYBOOK.md` with a "system bootstrap handoff" sub-template (different from "feature handoff").

### 7. No guidance on choosing between Toss/KakaoPay/etc.

The dogfood says "wire up Toss Payments / KakaoPay" but doesn't say **how to choose** between them, or document the integration patterns. Korean payment selection is a real decision with real tradeoffs.

**Action**: add `knowledge/i18n/korean-payments.md` (split from `korean-product-conventions.md` which is getting long):
- When to use which (cards/wallets/account transfer/carrier billing)
- Vendor comparison (Toss Payments vs INICIS vs NHN KCP)
- Integration patterns + UX expectations
- Cost structure (transaction fees by payment type)
- Compliance overlap (PG license, ESCROW for high-value)

### 8. No pattern for "data table" or "list with row actions"

A 가계부 needs a transaction list. Component-level (`TransactionListItem`) is fine, but the **list pattern** — pull-to-refresh, infinite scroll, swipe actions, empty state, sort/filter — is its own beast and isn't in `knowledge/patterns/`.

**Action**: add `knowledge/patterns/list-and-feed.md`:
- Pull-to-refresh, infinite scroll
- Swipe actions (iOS-native, Android variant)
- Empty / loading / error states
- Section headers (sticky, grouping rules)
- Skeleton vs spinner choice

### 9. Extractor pipeline doesn't catch new content

When upstream Ant Design adds a new token or shadcn adds a new component, the extractor catches it on next run. But if I add a new knowledge file (like the proposals above), there's no automation — it's all manual.

**Action**: a `tools/audit/check-coverage.py` that:
- Lists every component in `knowledge/components/INDEX.md`.
- Cross-references against `examples/` to see which have written specs.
- Flags coverage gaps in the README (`12 / 199 components have worked specs`).

### 10. The skill files don't enforce the AGENTS.md lookup-first rule

The agent SHOULD read `knowledge/colors/color-theory.md` before generating a palette. The playbook says so. But there's no programmatic enforcement — an LLM could skip it and fabricate values. For high-stakes use, want a verification step.

**Action**: add a "verification phase" to each skill — a self-check the agent does at end:
- "Did I cite at least one knowledge file per claim category?"
- "Did I include a contrast matrix for any color-related output?"
- "Did I reference at least 2 of the 3 upstream libraries for component spec?"

## What I'd ship for v1

If I had to declare design-ai "v1.0" right now, the system covers:

✓ Color palettes with WCAG-validated outputs
✓ Component specs for the 5 most-used components
✓ Foundation knowledge (a11y, typography, spacing, motion)
✓ Korean market specifics
✓ Worked examples as quality bar
✓ Multi-agent compatibility (Codex / Claude / Cursor / Aider)
✓ Figma + token sync workflows

Gaps acceptable for v1 (track in roadmap):
- React Native / mobile-first skill variants
- Money-aware patterns (fintech-specific)
- Mobile navigation patterns
- More component specs (Form, Table, Tabs, DatePicker, etc.)
- Verification phase per skill
- Coverage audit tooling

The system is **usable today** for the scenario it was designed for. The dogfood produced a deliverable that a real engineer could implement against. The gaps are real but they're additive — they don't break the existing flows.

## Roadmap delta

Move these from "future" to "Phase 2" in [docs/ROADMAP.md](ROADMAP.md):

1. **`knowledge/patterns/money-and-amount.md`** — fintech-essential
2. **`knowledge/patterns/mobile-navigation.md`** — consumer-mobile-essential
3. **`knowledge/patterns/list-and-feed.md`** — covers a missing UI pattern
4. **`knowledge/platforms/react-native.md`** — closes a platform gap
5. **`knowledge/i18n/korean-payments.md`** — splits the over-long conventions doc
6. **More component specs**: Form (full pattern), Table, Tabs (incl. bottom-tab-bar), DatePicker, Select, Pagination
7. **Skill: mood → hex mapping** as section in `color-palette` playbook
8. **`tools/audit/check-coverage.py`** — automated coverage report

Move to Phase 3:
- Verification phase per skill
- HTML preview generator (render token sets visually)
- Optional embedding index

## Closing assessment

**1차 완성: 합격.** The system does what it set out to do — turn a single LLM agent into a senior product designer for a session, producing artifacts grounded in real upstream design system knowledge. Codex and Claude both can pick up the repo and produce expert work.

The gaps surfaced here are **proof that the system is honest** — when I tried to use it for real, it was clear what was load-bearing (Korean i18n, contrast matrix, ramp construction rules) and what was missing (mobile patterns, fintech specifics). A system that produced no gaps would mean the dogfood scenario was too easy.

Phase 2 work is well-defined. Ship v1.0 (this commit), then iterate.
