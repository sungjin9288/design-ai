<!-- hand-written -->
---
title: Korean B2B density conventions
applies_to: [web, mobile, all-ui, korean]
version: 1.0.0
last_updated: 2026-07
stability: stable
---

# Korean B2B density conventions

Korean enterprise software — ERP, HR, groupware, admin consoles, financial back-office — is visibly denser than its Western counterpart, and denser again than Korean *consumer* apps. A Western enterprise layout ported unchanged into a Korean B2B product reads as sparse, slow, and "not serious." This file is the density half of the Korean playbook; for consumer density and the broader Korean conventions, see [`knowledge/i18n/korean-product-conventions.md`](korean-product-conventions.md).

## Why Korean B2B is denser

- **Information-per-screen is a value, not a cost.** Power users (accountants, HR admins, operators) work the same screens all day and want everything in view — more rows, more columns, fewer clicks to the next field. Scrolling and pagination read as friction, not breathing room.
- **The reference points are dense.** 더존, 영림원, SAP-Korea deployments, government e-gov portals, and bank back-office tools set the expectation. Naver Works / Kakao Work admin, Toss Business, and 뱅크샐러드 business consoles are the modern-but-still-dense benchmark.
- **Hangul carries more meaning per character.** A Korean label is often shorter than its English equivalent for the same content, so the same row holds more without feeling cramped.

This is a deliberate register, not clutter. The craft is being dense **and** legible — not dense **and** broken.

## The density ladder

Pick a mode per surface and hold it. Do not mix comfortable and compact rows in one table.

| Mode | Row height (approx) | Use for |
| --- | --- | --- |
| **Comfortable** | 48–56px | Consumer-facing, onboarding, marketing-in-product, low-frequency admin |
| **Cozy** (default KR B2B) | 36–44px | Most enterprise tables, forms, lists — the Korean B2B baseline |
| **Compact** | 28–32px | Data grids for power users, financial ledgers, high-row-count monitoring |

Western enterprise defaults to Comfortable; **Korean B2B defaults to Cozy.** Porting in usually means dropping one rung: reduce vertical padding ~15–25% and expect 30–50% more rows per fold. Offer a density toggle (Comfortable / Cozy / Compact) on heavy data surfaces so individual operators can go denser; persist the choice per user.

## Tables are the center of gravity

Korean B2B UIs are table-first. Most screens are a filter bar plus a table.

- **Many columns are normal.** 8–15 columns is routine; horizontal scroll with a **frozen first column** (and often a frozen header row) beats hiding columns behind a menu.
- **Compact rows, aligned numerals.** Right-align numbers and currency, use tabular figures, and keep row height in the Cozy/Compact band. See [`knowledge/patterns/money-and-amount.md`](../patterns/money-and-amount.md) for amount formatting.
- **Inline row actions.** Put edit / delete / detail as compact icon buttons or a trailing action cell, not behind a per-row overflow menu that costs an extra click.
- **Sticky context.** Freeze the header and the key identity column (사번, 거래처, 전표번호) so the operator never loses the row's identity while scrolling wide.
- **Totals and subtotals in view.** A pinned footer row with sums/counts is expected on financial and inventory tables — operators reconcile against it constantly.
- **Zebra or hairline rules, not heavy borders.** At Cozy/Compact density, 1px hairline separators or subtle zebra striping keep rows scannable without adding visual weight.

## Forms at density

- **Label-left (horizontal) layout** is the Korean B2B default for data-entry forms — it packs more fields per vertical space than label-top and matches the ledger-like mental model. Label-top is for consumer/onboarding.
- **Multi-column forms.** Two or three field columns per row are normal for registration and master-data screens. Group by section with thin dividers, not big gaps.
- **Tight field spacing.** Reduce inter-field vertical rhythm versus consumer forms; keep it consistent so the grid reads cleanly. See [`knowledge/patterns/form-design.md`](../patterns/form-design.md).
- **Required/optional density.** Mark required with a compact indicator (asterisk or a small "필수" chip); don't spend a whole helper-text line per field unless the rule is non-obvious.
- **Keyboard-first.** Power users tab through fields fast. Preserve a logical tab order, support Enter-to-next where appropriate, and don't trap focus in date/select popovers.

## Lists, trees, and navigation

- **Dense list rows** with secondary metadata inline (status chip, date, owner on one line) rather than stacked. See [`knowledge/patterns/list-and-feed.md`](../patterns/list-and-feed.md).
- **Tree navigation** (조직도, 계정과목, 메뉴 권한) is common and should stay compact — small row height, clear expand affordances, many levels visible at once.
- **Persistent side navigation** with dense, possibly two-level menus is expected over hamburger-hidden nav; enterprise users want the whole map visible. This is the opposite of the consumer preference noted in [`korean-product-conventions.md`](korean-product-conventions.md).

## Typography at density

- **Base size can drop, but not below legibility.** 13–14px body is common in KR B2B tables (vs 16px consumer). Do not go below ~12px for Hangul primary content — Hangul syllable blocks lose legibility faster than Latin at small sizes.
- **Line-height stays generous relative to size.** Even dense Korean text needs ~1.4–1.5 line-height for the syllable blocks to breathe; do not crush leading to save space. See [`knowledge/i18n/korean-typography.md`](korean-typography.md).
- **Numerals: tabular, aligned.** Financial density depends on figures lining up.
- **Truncate with intent.** Ellipsize long values with a tooltip/title for the full string rather than wrapping and breaking row rhythm.

## Density must not break accessibility

Density is the constraint; accessibility is the floor. When they conflict, accessibility wins.

- **Touch targets.** On touch/hybrid B2B (tablets on the floor, POS, hospital carts), keep interactive targets ≥ 44×44px *hit area* even when the visual row is compact — expand the clickable area beyond the visible cell rather than shrinking the target.
- **Contrast holds at every density.** Hairline separators and secondary text must still meet WCAG contrast; dense does not mean low-contrast gray-on-gray. See [`knowledge/a11y/contrast.md`](../a11y/contrast.md).
- **Focus visibility.** A visible focus ring is non-negotiable for keyboard-driven data entry; ensure it is not clipped by tight row borders. See [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md).
- **Density toggle as an a11y affordance.** Offering Comfortable mode is itself an accessibility accommodation for users who need larger targets and text.

## Tokens consumed

```
--space-2xs, --space-xs      (dense row padding, inter-field gaps)
--space-sm                   (section spacing at density)
--row-height-compact         (or --space-based row sizing)
--font-size-sm               (13–14px dense body)
--line-height-normal         (~1.4–1.5 for Hangul)
--color-border-subtle        (hairline separators)
--color-bg-subtle            (zebra striping)
--color-text-secondary       (inline metadata)
--color-text-tabular         (aligned numerals)
```

Define a **density scale** as tokens (comfortable / cozy / compact row heights + padding) so the toggle flips a token set, not ad-hoc per-component values.

## Don't

- Don't ship Western enterprise comfortable-density defaults unchanged into a Korean B2B product — it reads as sparse and unserious.
- Don't hide columns behind menus to avoid width — Korean power users prefer horizontal scroll with frozen columns.
- Don't mix row-height modes within one table.
- Don't crush Hangul below ~12px or crush line-height to gain rows — legibility breaks before the space saved is worth it.
- Don't let density erode contrast, focus rings, or touch-target hit areas.
- Don't bury per-row actions behind an overflow menu on high-frequency screens — inline them.
- Don't apply consumer nav patterns (hamburger, hidden tabs) to enterprise — surface the full dense menu.

## Cross-reference

- [`knowledge/i18n/korean-product-conventions.md`](korean-product-conventions.md) — consumer density and the broader Korean conventions this file specializes from
- [`knowledge/i18n/korean-typography.md`](korean-typography.md) — Hangul sizing and line-height at density
- [`knowledge/patterns/form-design.md`](../patterns/form-design.md) — label-left, multi-column, dense forms
- [`knowledge/patterns/list-and-feed.md`](../patterns/list-and-feed.md) — dense list rows and data grids
- [`knowledge/patterns/money-and-amount.md`](../patterns/money-and-amount.md) — tabular numerals and aligned amounts
- [`knowledge/a11y/contrast.md`](../a11y/contrast.md), [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — the accessibility floor density must respect
