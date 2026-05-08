# `AspectRatio` — spec

> Synthesized from shadcn-ui `aspect-ratio` (Radix). A wrapper that locks its child to a specific aspect ratio. The single-purpose primitive for hero images, video embeds, card thumbnails, and any case where you need predictable proportions before content loads.

## Why this exists

The CSS `aspect-ratio` property handles 90% of cases natively. AspectRatio component is useful when:
- You need a consistent React API across the codebase.
- Browser support for `aspect-ratio` is insufficient (rare in 2024+; Safari < 15).
- You want to compose with other behavior (loading skeleton, fade-in).

For new projects targeting modern browsers: just use `aspect-ratio: 16/9` in CSS. AspectRatio component is for cross-browser / design-system consistency.

## API

```tsx
<AspectRatio ratio={16 / 9}>
  <img src="/hero.jpg" alt="" className="w-full h-full object-cover" />
</AspectRatio>

<AspectRatio ratio={1}>
  <Avatar src={url} />
</AspectRatio>

<AspectRatio ratio={4 / 5}>
  <ProductImage src={product.image} />
</AspectRatio>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `ratio` | `number` | `1` | Width / height ratio (16/9 = 1.77, 4/3 = 1.33, 1/1 = 1) |
| `children` | `ReactNode` | — | Single child; positioned absolute to fill |
| `className` | `string` | — | Pass-through |
| `as` | `keyof JSX.IntrinsicElements` | `"div"` | Wrapper element |

## Common ratios

| Ratio | Use |
| --- | --- |
| `16/9` (1.77) | Video, hero images, widescreen |
| `4/3` (1.33) | Photography, classic TV |
| `1/1` (1.0) | Avatars, product thumbnails (Instagram-style) |
| `4/5` (0.8) | Mobile portrait product |
| `9/16` (0.56) | Vertical video (Reels / Shorts / TikTok) |
| `3/2` (1.5) | DSLR photos |
| `21/9` (2.33) | Ultrawide cinema |
| `1/2` (0.5) | Tall hero / banner |

## Implementation

CSS:
```css
.aspect-ratio {
  position: relative;
  width: 100%;
  aspect-ratio: var(--ratio);  /* modern browsers */
}

/* Fallback for browsers without aspect-ratio support */
@supports not (aspect-ratio: 1) {
  .aspect-ratio::before {
    content: "";
    display: block;
    padding-bottom: calc(100% / var(--ratio));
  }
  .aspect-ratio > * {
    position: absolute;
    inset: 0;
  }
}
```

React:
```tsx
function AspectRatio({ ratio = 1, children, className, as: Tag = "div" }: Props) {
  return (
    <Tag
      className={cn("aspect-ratio", className)}
      style={{ "--ratio": ratio } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
```

## Tokens consumed

```
--radius-md          (when used in cards; outer corners rounded)
```

That's it. AspectRatio is layout-only; no theming.

## States

Stateless. The wrapper holds proportions; children control their own visuals.

## Accessibility

- AspectRatio is layout-only — no role, no semantics.
- Make sure the children have appropriate alt text / aria labels.
- `<img>` inside should always have `alt=""` (decorative) or descriptive `alt`.
- For `<video>` inside: same captions / accessibility as standalone video.

## Edge cases

- **Multiple children**: only first child is positioned absolute. Wrap in a single container if multiple needed.
- **Content overflows ratio**: hidden by default. To allow overflow, set `overflow: visible` on the wrapper.
- **Loading state**: pair with skeleton — skeleton itself can be the AspectRatio child during load.
- **Object-fit**: image / video child needs `object-fit: cover` (default for filling) or `contain` (letterbox).
- **No children**: empty wrapper still maintains ratio.
- **Print**: `aspect-ratio` works in print; ratio preserved.

## Code example

```tsx
function ProductCard({ product }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <article className="product-card">
      <AspectRatio ratio={4 / 5} className="rounded-md overflow-hidden">
        {!imageLoaded && <Skeleton className="absolute inset-0" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className="w-full h-full object-cover"
        />
      </AspectRatio>
      <h3>{product.name}</h3>
      <p className="price">{product.price.toLocaleString()}원</p>
    </article>
  );
}
```

## Don't

- Don't use AspectRatio when CSS `aspect-ratio` alone suffices.
- Don't put complex layouts inside — it's a single-child wrapper.
- Don't apply `aspect-ratio` AND fixed height to the same element. Pick one.
- Don't forget `object-fit` on images inside.

## References

- shadcn-ui: [`aspect-ratio`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/aspect-ratio.tsx) (Radix)
- CSS: `aspect-ratio` property (Baseline 2021)

## Cross-reference

- [`examples/component-image.md`](component-image.md) — image with built-in fallback
- [`examples/component-video-hero.md`](component-video-hero.md) — uses aspect-ratio for video
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
