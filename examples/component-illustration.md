<!-- hand-written -->
# `Illustration` (custom — themeable SVG illustration display) — spec

> Generic wrapper for displaying a system illustration with theming, sizing, accessibility, and reduced-motion support. Used directly when `EmptyState` / `Result` / `OnboardingStep` aren't the right fit. Pairs with [`knowledge/illustration/svg-optimization.md`](../knowledge/illustration/svg-optimization.md).

## Purpose

When you want to drop a system illustration into a screen — feature explainer, onboarding card, marketing surface — without the empty-state layout. `Illustration` provides:

1. **Registry-backed name** — typesafe lookup from the system's illustration set.
2. **Theming via `currentColor` + CSS variables**.
3. **Responsive sizing** — width or height; the other auto-scales via aspect ratio.
4. **Accessibility** — decorative by default; meaningful on opt-in.
5. **Lottie escape hatch** — if the illustration is animated, delegate to `LottiePlayer`.

## Anatomy

```
┌──────────────────┐
│                  │
│   [SVG render]   │  ← from registry
│                  │
└──────────────────┘
        OR
┌──────────────────┐
│                  │
│  [Lottie render] │  ← when name maps to a Lottie source
│                  │
└──────────────────┘
```

## API

```tsx
<Illustration name="onboarding-welcome" size="lg" />

<Illustration
  name="payment-success"
  size={200}
  label="결제가 완료되었습니다"   // makes meaningful (not decorative)
/>

<Illustration name="hero-money-flow" size={{ desktop: 480, mobile: 240 }} />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `IllustrationName` | — | Registry key. Required. Typesafe via TS union. |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| number \| { desktop: number; mobile: number }` | `"md"` | Display size in px. Object form for responsive. |
| `label` | `string` | `undefined` | If set, illustration is meaningful (`role="img"` + `aria-label`). Default: decorative (`aria-hidden`). |
| `tone` | `"brand" \| "neutral" \| "success" \| "warning" \| "danger"` | `"brand"` | Color theme via CSS variable cascade |
| `as` | `"div" \| "span" \| "figure"` | `"div"` | Wrapper element |
| `className` | `string` | — | Additional classes |

## Sizes

| token | px |
| --- | --- |
| `sm` | 80 |
| `md` (default) | 120 |
| `lg` | 200 |
| `xl` | 320 |

For responsive: pass `{ desktop, mobile }` object. The component renders both via CSS `clamp()`:

```css
.illustration[data-size-responsive] {
  width: clamp(var(--mobile-size), 30vw, var(--desktop-size));
}
```

## Tones

`tone` maps to a CSS variable setting the illustration's `currentColor`:

```css
.illustration[data-tone="brand"]   { color: var(--color-brand-default); }
.illustration[data-tone="neutral"] { color: var(--color-fg-muted); }
.illustration[data-tone="success"] { color: var(--color-success-default); }
.illustration[data-tone="warning"] { color: var(--color-warning-default); }
.illustration[data-tone="danger"]  { color: var(--color-error-default); }
```

The illustration's SVG must use `currentColor` for the themable element. Multi-color illustrations also use CSS variables (`var(--color-bg-illo)`).

## Registry

```ts
// illustrations/registry.ts
import { OnboardingWelcome } from "./svg/OnboardingWelcome";
import { PaymentSuccess } from "./svg/PaymentSuccess";
import { HeroMoneyFlow } from "./svg/HeroMoneyFlow";

export const illustrationRegistry = {
  // Spot illustrations
  "onboarding-welcome": { type: "svg", component: OnboardingWelcome },
  "payment-success": { type: "svg", component: PaymentSuccess },
  "filter-empty": { type: "svg", component: FilterEmpty },

  // Hero illustrations
  "hero-money-flow": { type: "svg", component: HeroMoneyFlow },
  "hero-onboarding": { type: "svg", component: HeroOnboarding },

  // Animated (Lottie)
  "celebration": { type: "lottie", src: "/illustrations/celebration.json", poster: "/illustrations/celebration.png" },
} as const;

export type IllustrationName = keyof typeof illustrationRegistry;
```

The registry is the **only** place new illustrations get added. Engineers can't ship an illustration not in the registry — enforces governance.

## States

| State | Visual |
| --- | --- |
| Default (decorative) | Renders illustration with brand tone |
| Meaningful (label set) | Same render; adds `role="img"` and `aria-label` |
| Reduced motion + animated illustration | Static frame from poster |
| Loading (Lottie source) | Poster while JSON streams; cross-fade when ready |
| Error (illustration name not in registry) | Dev: throw. Prod: fallback to `generic` illustration. |

## Tokens consumed

```
--color-brand-default
--color-fg-muted
--color-success-default
--color-warning-default
--color-error-default
--color-bg-illo                  (multi-color illustrations)
--motion-fast                    (poster → animation cross-fade)
```

## Accessibility

### Default — decorative

```html
<div class="illustration" aria-hidden="true">
  <svg ...>...</svg>
</div>
```

Screen readers skip. Used when surrounding text already explains.

### Meaningful — label set

```html
<div class="illustration" role="img" aria-label="결제가 완료되었습니다">
  <svg aria-hidden="true">...</svg>
</div>
```

The wrapper carries the label. Inner SVG stays `aria-hidden` to avoid double-announcement.

### Animated illustrations

If `name` maps to a Lottie source, delegates to `LottiePlayer` which handles `prefers-reduced-motion`. See [`examples/component-lottie-player.md`](component-lottie-player.md).

## Implementation

```tsx
import { illustrationRegistry, type IllustrationName } from "./registry";
import { LottiePlayer } from "./LottiePlayer";

interface Props {
  name: IllustrationName;
  size?: "sm" | "md" | "lg" | "xl" | number | { desktop: number; mobile: number };
  label?: string;
  tone?: "brand" | "neutral" | "success" | "warning" | "danger";
  as?: "div" | "span" | "figure";
  className?: string;
}

const SIZE_MAP = { sm: 80, md: 120, lg: 200, xl: 320 };

export function Illustration({
  name,
  size = "md",
  label,
  tone = "brand",
  as: Tag = "div",
  className,
}: Props) {
  const entry = illustrationRegistry[name];

  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Illustration "${name}" not in registry`);
    }
    return null; // or fallback
  }

  const dims = typeof size === "number"
    ? { width: size, height: size }
    : typeof size === "string"
    ? { width: SIZE_MAP[size], height: SIZE_MAP[size] }
    : { responsive: size };

  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": "true" };

  return (
    <Tag
      className={cn("illustration", className)}
      data-tone={tone}
      data-size-responsive={dims.responsive ? "" : undefined}
      style={
        dims.responsive
          ? {
              "--desktop-size": `${dims.responsive.desktop}px`,
              "--mobile-size": `${dims.responsive.mobile}px`,
            }
          : { width: dims.width, height: dims.height }
      }
      {...a11y}
    >
      {entry.type === "svg" ? (
        <entry.component aria-hidden="true" />
      ) : (
        <LottiePlayer src={entry.src} poster={entry.poster} ariaLabel={label ?? ""} />
      )}
    </Tag>
  );
}
```

## Performance

- SVG illustrations: inlined as React components via SVGR / vite-plugin-svgr; treeshaken automatically.
- Lottie illustrations: lazy-loaded via `LottiePlayer`'s built-in lazy strategy.
- For 50+ illustrations in registry: import on-demand to avoid shipping all in main bundle:

```ts
"hero-money-flow": {
  type: "svg",
  component: lazy(() => import("./svg/HeroMoneyFlow")),
},
```

Wrap consumers in `<Suspense fallback={<div style={{ width, height }} />}>`.

## Edge cases

- **Name not in registry (typo)**: TS catches at compile time. Runtime: throw in dev, fallback in prod.
- **Responsive size on SSR**: server renders both sizes; CSS `clamp()` resolves on client paint. No layout shift if dimensions are reserved.
- **Dark mode**: registry's SVGs use `currentColor` + CSS variables. Tone variable cascades through dark theme. No per-illustration dark variant needed if SVG is built right.
- **RTL languages**: most illustrations are visually symmetric; if not, mark in registry with `flippable: true` and apply `transform: scaleX(-1)` in RTL contexts.
- **Print**: illustrations using `currentColor` print in current text color. For colored print, use named colors in registry's CSS layer.

## Don't

- Don't pass arbitrary SVG nodes — extend the registry.
- Don't bake tone color in the SVG file. Use `currentColor`.
- Don't size illustrations with raw px from the consumer's css. Use the `size` prop.
- Don't render an `<img src=".svg">` — that's the wrong escape. Use the registry; SVG is inlined for theming.
- Don't auto-loop animated illustrations on every screen. Battery + a11y.
- Don't omit `label` if the illustration carries the only meaning on the screen. Defaults are decorative.

## References

No upstream component matches. Most libraries either ship icon systems (different concern) or expect raw `<img>` / `<svg>` for illustrations. This component formalizes the registry + theming pattern.

## Cross-reference

- [`knowledge/illustration/illustration-systems.md`](../knowledge/illustration/illustration-systems.md) — system foundation
- [`knowledge/illustration/svg-optimization.md`](../knowledge/illustration/svg-optimization.md) — SVG production
- [`knowledge/illustration/spot-illustrations.md`](../knowledge/illustration/spot-illustrations.md) — illustration types
- [`examples/component-empty-state.md`](component-empty-state.md) — common consumer
- [`examples/component-lottie-player.md`](component-lottie-player.md) — animated branch
- [`examples/component-hero-block.md`](component-hero-block.md) — hero illustration consumer
