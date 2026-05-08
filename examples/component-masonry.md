# `Masonry` — spec

> Synthesized from MUI `Masonry`. A Pinterest-style staggered grid where items pack vertically into columns, varying heights aligned cleanly. Distinct from Grid (uniform cells) and Flex (single-direction layout).

## When to use

- **Image gallery** with varied aspect ratios (Pinterest, Unsplash, gallery wall).
- **Card grid** where cards have varied content lengths.
- **Quote / testimonial wall** with naturally varying lengths.

When NOT to use:
- Uniform-height cards (use Grid).
- Reading flow / accessible content sequence (Masonry's visual order ≠ DOM order — bad for screen readers).
- Tables / data — use Table.

## Anatomy

```
Column 1   Column 2   Column 3
┌──────┐   ┌──────┐   ┌──────┐
│      │   │      │   │      │
│      │   ├──────┤   │      │
├──────┤   │      │   │      │
│      │   │      │   ├──────┤
│      │   ├──────┤   │      │
│      │   │      │   │      │
├──────┤   │      │   │      │
│      │   │      │   ├──────┤
└──────┘   └──────┘   │      │
                      └──────┘
```

Items flow vertically into columns; each item lands at the bottom of the shortest column.

## API

```tsx
<Masonry columns={3} spacing={2}>
  {photos.map(photo => (
    <PhotoCard key={photo.id} photo={photo} />
  ))}
</Masonry>

<Masonry columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }} spacing={2}>
  {items}
</Masonry>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `number \| { mobile, tablet, desktop, wide }` | `3` | Column count (responsive object also accepted) |
| `spacing` | `number` | `2` | Gap between items (typically token-multiplier) |
| `defaultColumns` | `number` | `3` | SSR fallback before client measures |
| `sequential` | `boolean` | `false` | If true, items fill columns left-to-right (DOM order = visual order) |
| `children` | `ReactNode[]` | — | Items |

## Implementation approaches

### CSS Multicolumn (modern, simplest)

```css
.masonry {
  column-count: 3;
  column-gap: var(--space-md);
}
.masonry > * {
  break-inside: avoid;
  margin-bottom: var(--space-md);
}
```

**Pros**: pure CSS, no JS measurement, SSR-friendly.
**Cons**: items flow top-to-bottom in column 1 first (column 1 fills, then column 2). DOM order ≠ visual reading order.

### JS column-measurement (Pinterest-style)

```ts
// Measure each item's height after render
// Place each new item in the currently-shortest column
// Update on resize / item changes
```

**Pros**: items appear in DOM order (column 1 row 1, column 2 row 1, etc.) so reading order matches.
**Cons**: requires JS measurement, layout flicker on first render, more complex.

MUI `Masonry` uses the JS approach with React refs.

### CSS Grid masonry (future)

```css
.masonry {
  display: grid;
  grid-template-rows: masonry;  /* CSS Grid Level 3 */
  grid-template-columns: repeat(3, 1fr);
}
```

`grid-template-rows: masonry` is a draft spec (Firefox-only as of 2024). Wait for Chromium / Safari before adopting.

## Variants

### Responsive columns

```tsx
<Masonry columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }} />
```

Different column counts per breakpoint.

### Sequential mode

`sequential={true}` makes items fill left-to-right per row (like Grid but with varied heights). Loses the Pinterest "shortest column wins" advantage but preserves DOM order strictly.

## States

Stateless — Masonry is layout only.

## Tokens consumed

```
--space-sm, --space-md             (gap)
--motion-medium                    (item enter animation, optional)
```

## Accessibility

- **Reading order matters**. Masonry's visual columns may not match DOM order. Screen readers read DOM order.
- For accessible Masonry: ensure DOM order = priority order (most important first), even if columns shuffle visually.
- Each item is independently accessible (semantic markup inside).
- Keyboard: Tab moves through items in DOM order (which may zigzag visually — acceptable for galleries; not for reading).
- Avoid Masonry for primary content / reading flow. Reserve for media-grid surfaces.

## Performance

- For 1000+ items: virtualize using `react-virtuoso` or similar Masonry-aware virtualizer.
- For images: lazy-load (`loading="lazy"`) so off-screen items don't block initial paint.
- Measure-once on resize (debounce 150ms) — measuring per-frame kills performance.
- For aspect-ratio-known items (image with width / height): provide ratio so layout settles before image loads.

## Code example

```tsx
function PhotoGallery({ photos }: Props) {
  return (
    <Masonry columns={{ mobile: 1, tablet: 2, desktop: 3 }} spacing={2}>
      {photos.map(photo => (
        <figure key={photo.id} className="photo-card">
          <img
            src={photo.url}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            loading="lazy"
            style={{ aspectRatio: `${photo.width}/${photo.height}` }}
          />
          <figcaption>{photo.caption}</figcaption>
        </figure>
      ))}
    </Masonry>
  );
}
```

## Edge cases

- **All items same height**: result looks like Grid. Use Grid instead.
- **One very tall item**: it dominates one column; others may look empty. Cap maximum height OR balance manually.
- **Lazy-loaded items popping in**: layout reflows. With `aspect-ratio` set, reflow is minimal.
- **Server-render with unknown heights**: SSR shows items in their column-fill order; client re-measures and adjusts. Brief flicker possible — accept or use CSS-multicolumn as SSR-stable fallback.
- **RTL**: column order reverses (rightmost = column 1). Verify your layout.
- **Print**: CSS multicolumn handles print well; JS-based Masonry may not — provide a print stylesheet that disables Masonry (`column-count: 1`).

## Don't

- Don't use Masonry for forms or data tables. Wrong tool.
- Don't use Masonry for content that requires linear reading. Confusing.
- Don't put items with vastly different sizes (5x height differences) — looks broken.
- Don't omit `aspect-ratio` on images. Without it, layout shifts as images load.
- Don't run measurement per scroll-event. Measure once on resize / item change.

## References

- MUI: [`Masonry`](../refs/mui/packages/mui-material/src/Masonry)
- CSS Multicolumn Layout (MDN)
- Pinterest engineering blog on Masonry layout

## Cross-reference

- [`examples/component-image.md`](component-image.md) — common Masonry child
- [`examples/component-card.md`](component-card.md) — alternative for uniform cards
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
