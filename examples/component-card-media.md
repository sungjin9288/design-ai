# `CardMedia` — spec

> Synthesized from MUI `CardMedia`. The image/video region of a `Card`. Handles aspect ratio + responsive sizing + lazy loading defaults.

## When to use

- Top hero image of a Card.
- Inline video/audio inside a Card.
- For decorative background, prefer `Box` + `sx={{ backgroundImage }}`.

## API

```tsx
<Card>
  <CardMedia
    component="img"
    image={post.imageUrl}
    alt={post.imageAlt ?? ''}
    height={200}
  />
  <CardContent>...</CardContent>
</Card>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `component` | `'img' \| 'video' \| 'audio' \| 'div'` | `'div'` | Underlying element |
| `image` | `string` | — | Image URL (required for `div`/`img`) |
| `src` | `string` | — | Source URL (for `video` / `audio` — `image` prop is also accepted) |
| `alt` | `string` | — | Alt text (`img` only) |
| `height` | `number \| string` | — | Fixed height (image will object-fit cover) |

## Accessibility

- For decorative images: `alt=""` (not omitted).
- For meaningful images: descriptive `alt`. Don't repeat the title.
- Korean alt: avoid "이미지" — that's redundant; describe the content ("팀 회식 사진" not "이미지").
- For video: provide captions track or transcript. Cite [`knowledge/video/in-product-video.md`](../knowledge/video/in-product-video.md).

## Edge cases

- **Image fails to load** — show fallback. CardMedia doesn't have built-in fallback; wrap with custom error handling if critical.
- **Aspect ratio control** — `height` is fixed; for ratio-based, use `sx={{ aspectRatio: '16 / 9' }}`.
- **Lazy loading** — set `loading="lazy"` via `<CardMedia component="img" loading="lazy" />`.
- **Korean image content** — avoid text in images (untranslatable, accessibility issues). Render text via HTML overlay instead.

## Code example

```tsx
<Card>
  <CardMedia
    component="img"
    image={recipe.imageUrl}
    alt={`${recipe.title} 완성 사진`}
    sx={{ aspectRatio: '4 / 3', objectFit: 'cover' }}
    loading="lazy"
  />
  <CardContent>
    <Typography variant="h6">{recipe.title}</Typography>
  </CardContent>
</Card>
```

## Don't

- Don't omit `alt` for `img` — even decorative needs `alt=""` explicitly.
- Don't use `CardMedia` for icons — wrong sizing model.
- Don't apply `objectFit: 'contain'` for hero images — they leave letterbox bars; use `cover`.

## References

- MUI: [`CardMedia`](../docs/reference/mui.md#card-media)

## Cross-reference

- [`component-card.md`](component-card.md)
- [`component-card-header.md`](component-card-header.md)
- [`component-card-content.md`](component-card-content.md)
- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) — for any text-overlay
