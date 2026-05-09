# `ImageList` — spec

> Synthesized from MUI `ImageList`. Grid of images with consistent rules — distinct from `Masonry` (varied heights) and `Grid` (general).

## When to use

- Photo galleries where uniform proportions OK.
- Product image grids.
- Avatars / icons in a grid.

When NOT to use:
- Pinterest-style varied heights → `Masonry`.
- Reading-order content → semantic `<ul>`/`<ol>`.

## Anatomy

```
┌──┬──┬──┬──┐
│  │  │  │  │
├──┼──┼──┼──┤
│  │  │  │  │
├──┼──┼──┼──┤
│  │  │  │  │
└──┴──┴──┴──┘
   uniform tiles
```

## API

```tsx
<ImageList cols={4} gap={8}>
  {photos.map(p => (
    <ImageList.Item key={p.id}>
      <img src={p.thumb} alt={p.alt} loading="lazy" />
      <ImageList.ItemBar
        title={p.title}
        subtitle={p.author}
        actionIcon={<IconButton><InfoIcon /></IconButton>}
      />
    </ImageList.Item>
  ))}
</ImageList>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `cols` | `number` | `2` | Column count |
| `gap` | `number` | `4` | Gap between tiles (px) |
| `rowHeight` | `number \| "auto"` | `"auto"` | Fixed row height; "auto" sizes by content |
| `variant` | `"standard" \| "quilted" \| "masonry" \| "woven"` | `"standard"` | Layout style |

## Variants

- **standard**: uniform grid.
- **quilted**: different tile sizes (some span 2 cols/rows) for visual rhythm.
- **masonry**: varying heights (use `Masonry` instead — clearer name).
- **woven**: alternating row heights.

## States

Stateless. Tiles can be interactive (click → open / navigate); each tile follows Item semantics.

## Tokens consumed

```
--image-list-gap
--image-list-bar-bg              (caption bar bg)
--image-list-bar-fg
--radius-sm                      (tile rounding)
```

## Accessibility

- Each `<img alt="...">` required.
- For interactive grids: wrap each Item in `<a>` or `<button>`.
- Keyboard: Tab through items; arrow keys can navigate (configurable).

## Code example

```tsx
<ImageList cols={3} gap={12} rowHeight={200}>
  {products.map(p => (
    <ImageList.Item key={p.id}>
      <a href={`/products/${p.id}`}>
        <img src={p.image} alt={p.name} loading="lazy" />
      </a>
      <ImageList.ItemBar title={p.name} subtitle={`₩${p.price.toLocaleString()}`} />
    </ImageList.Item>
  ))}
</ImageList>
```

## Don't

- Don't omit `alt` on images.
- Don't use ImageList for non-image grids — use Grid.
- Don't lazy-load above-the-fold — they should appear immediately.

## References

- MUI: [`ImageList`](../refs/mui/packages/mui-material/src/ImageList)

## Cross-reference

- [`examples/component-masonry.md`](component-masonry.md) — varied heights
- [`examples/component-grid.md`](component-grid.md) — generic 2D
- [`examples/component-aspect-ratio.md`](component-aspect-ratio.md) — single tile
