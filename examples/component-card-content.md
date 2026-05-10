# `CardContent` — spec

> Synthesized from MUI `CardContent`. The body region of a `Card`. Provides the default padding so card body content aligns with the card's grid.

## When to use

- Inside every `Card` that has body content beyond a hero image.
- For media-only cards (`CardMedia` only), skip `CardContent`.

## Anatomy

```
┌────────────────────────────┐
│ [CardMedia / image]        │
├────────────────────────────┤
│ CardContent                │
│   - Title                  │
│   - Body text              │
│   - Tags / metadata        │
├────────────────────────────┤
│ CardActions                │
└────────────────────────────┘
```

## API

```tsx
<Card>
  <CardContent>
    <Typography variant="h5">제목</Typography>
    <Typography variant="body2">본문 텍스트</Typography>
  </CardContent>
</Card>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Body content |

## Tokens consumed

```
--card-content-padding   /* default 16px / dense 8px */
--space-md
--space-sm
```

## Accessibility

`CardContent` is structural (a `<div>`); it doesn't add semantics. The Card's role is determined by its surrounding context — wrap interactive cards in `<a>` or `<button>` higher in the tree, not at `CardContent` level.

## Edge cases

- **Card with no media** — `CardContent` becomes the only child; ensure padding still feels right (default 16px works).
- **Korean text density** — Hangul reads ~10% wider; consider 20-24px padding for body-heavy cards.
- **Bottom padding** — when `CardActions` follows, MUI removes the bottom padding of `CardContent` so the action row hugs the bottom. Don't override this without reason.

## Code example

```tsx
<Card sx={{ maxWidth: 360 }}>
  <CardMedia component="img" image="/cover.jpg" alt="" />
  <CardContent>
    <Typography variant="h6">제목</Typography>
    <Typography variant="body2" color="text.secondary">
      본문 요약 텍스트.
    </Typography>
  </CardContent>
  <CardActions>
    <Button size="small">자세히</Button>
  </CardActions>
</Card>
```

## Don't

- Don't override the bottom padding when followed by `CardActions` — MUI handles this.
- Don't put `Card`-level interactive surfaces (link, click handler) on `CardContent` — they belong on the Card or on `CardActionArea`.

## References

- MUI: [`CardContent.d.ts`](../refs/mui/packages/mui-material/src/CardContent/CardContent.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-card.md`](component-card.md)
- [`component-card-actions.md`](component-card-actions.md)
- [`component-card-media.md`](component-card-media.md)
- [`component-card-header.md`](component-card-header.md)
