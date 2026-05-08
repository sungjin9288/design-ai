# `FeatureGrid` (3-up / 4-up feature display) — spec

> Marketing-page primitive. Renders 3–6 feature cells in a grid below the hero. Each cell: icon + headline + 1-line description.

## Purpose

Communicate **3–6 things the product does** in a scannable layout. Used after the hero on most landing pages.

## Anatomy

```
┌──────────────────────────────────────────────────────┐
│ Section title (optional)                              │
│ Section sub-headline (optional)                       │
├──────────────────────────────────────────────────────┤
│ ┌────────┐  ┌────────┐  ┌────────┐                   │
│ │ [icon] │  │ [icon] │  │ [icon] │                   │
│ │        │  │        │  │        │                   │
│ │ Title  │  │ Title  │  │ Title  │                   │
│ │        │  │        │  │        │                   │
│ │ Desc   │  │ Desc   │  │ Desc   │                   │
│ │        │  │        │  │        │                   │
│ └────────┘  └────────┘  └────────┘                   │
└──────────────────────────────────────────────────────┘
```

## API

```tsx
<FeatureGrid
  title="왜 우리 가계부인가요?"
  features={[
    {
      icon: <BankIcon />,
      title: "30개 은행 자동 연동",
      description: "한 번 연결하면 자동으로 거래내역이 들어옵니다.",
    },
    {
      icon: <CategoryIcon />,
      title: "AI 자동 분류",
      description: "거래마다 카테고리가 자동으로 정리됩니다.",
    },
    {
      icon: <ShieldIcon />,
      title: "은행급 보안",
      description: "AES-256 암호화 + 본인인증으로 안전합니다.",
    },
  ]}
  columns={{ default: 1, md: 3 }}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string \| ReactNode` | — | Section heading |
| `subtitle` | `string \| ReactNode` | — | Section sub-headline |
| `features` | `Feature[]` | — | 3–6 features |
| `columns` | `number \| { default, md, lg, ... }` | `{ default: 1, md: 3 }` | Column count per breakpoint |
| `cardStyle` | `"plain" \| "outlined" \| "elevated"` | `"plain"` | Visual treatment |
| `iconStyle` | `"colored-bg" \| "plain" \| "outline"` | `"colored-bg"` | Icon container |
| `align` | `"left" \| "center"` | `"left"` | Per-cell content alignment |

```ts
type Feature = {
  icon?: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};
```

## Layout variants

### 3-up grid (default)

Most landing pages. Each cell has equal weight. Mobile: stacks vertically.

### 2-up grid

When you have 4 features. Visually distinct from 3-up (less "feature catalog" feel).

### 4-up grid

Tighter cells. Use when you have exactly 4 strong features. More than 4 → split into multiple sections.

### Alternating "zig-zag"

Each feature alternates: left-image right-text, then right-image left-text. Used for richer feature explanations (1 cell ≈ 1 row, image takes ~50%).

```
┌──────────────────────────────────────┐
│ [image]            Title             │
│                    Description       │
├──────────────────────────────────────┤
│ Title              [image]           │
│ Description                          │
├──────────────────────────────────────┤
│ [image]            Title             │
│                    Description       │
└──────────────────────────────────────┘
```

For richer features: zig-zag works. For a tight 3-up: standard grid.

## Cell anatomy

| Slot | Required | Notes |
| --- | --- | --- |
| Icon | usually | 32–48px, brand-colored bg or plain |
| Title | yes | 1 line ideal, weight 600 |
| Description | yes | 1–2 lines, body color |
| Optional CTA | optional | "Learn more" link |

For Korean: title 6-12자 typical. Description 한 문장 (~25 자).

## Tokens consumed

```
--color-bg-default
--color-bg-elevated          (cardStyle elevated)
--color-bg-subtle             (icon bg when colored-bg)
--color-primary-default       (icon color when plain/outline)
--color-primary-subtle-bg     (icon container bg)
--color-text-primary          (title)
--color-text-secondary        (description)
--space-md, --space-lg, --space-xl
--radius-md, --radius-lg
--shadow-card                  (elevated)
--font-size-base, --font-size-lg, --font-size-xl
--font-weight-semibold
```

## Sizes

| Element | Mobile | Desktop |
| --- | --- | --- |
| Cell padding | 24px | 32px |
| Icon size | 32px | 40–48px |
| Title font | 16px | 18–20px |
| Description font | 14px | 14–16px |
| Cell min-height | auto | ~280px (so cells equalize) |

## Accessibility

- Wrap in `<section>` with `<h2>` for section title.
- Each feature cell: `<article>` with `<h3>` for title.
- Icons: `aria-hidden="true"` (title carries meaning).
- For interactive cells (with CTAs): the CTA button gets focus, not the whole cell.

## Korean conventions

- Section title: question or declarative. "왜 우리 가계부인가요?" / "이런 기능들이 있어요"
- Feature title: 짧은 명사구 ("자동 연동", "AI 분류").
- Description: 한 문장. 문장형 끝맺음 ("정리됩니다", "안전합니다") matches ~합니다 voice.

## Code example

```tsx
<FeatureGrid
  title="왜 우리 가계부인가요?"
  subtitle="번거로운 가계부 입력은 이제 그만"
  features={[
    {
      icon: <BankIcon />,
      title: "30개 은행 자동 연동",
      description: "한 번 연결하면 자동으로 거래내역이 들어옵니다.",
    },
    {
      icon: <CategoryIcon />,
      title: "AI 자동 분류",
      description: "거래마다 카테고리가 자동으로 정리됩니다.",
    },
    {
      icon: <ShieldIcon />,
      title: "은행급 보안",
      description: "AES-256 암호화 + 본인인증으로 안전합니다.",
    },
  ]}
  columns={{ default: 1, md: 3 }}
  iconStyle="colored-bg"
/>
```

## Don't

- Don't show 7+ features in one grid — overwhelming.
- Don't use generic stock icons that don't match the feature.
- Don't make each cell a different visual weight — equal-by-design.
- Don't put long descriptions (3+ lines). Trim or move to a dedicated explainer page.
- Don't omit icons for visual rhythm — but don't force icons that aren't meaningful.

## References

No upstream component matches exactly. Each marketing-page builder (Webflow, Framer) has variants. The 3-up grid is the universal pattern.

## Cross-reference

- [`examples/component-hero-block.md`](component-hero-block.md) — hero comes before
- [`examples/component-testimonial-carousel.md`](component-testimonial-carousel.md) — social proof comes after
- [`knowledge/patterns/landing-page-patterns.md`](../knowledge/patterns/landing-page-patterns.md) — full landing structure
