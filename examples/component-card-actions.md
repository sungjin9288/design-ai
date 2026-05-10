# `CardActions` — spec

> Synthesized from MUI `CardActions`. The action row at the bottom of a `Card`. Left-aligns by default (unlike `DialogActions` which is right-aligned).

## When to use

- Inside `Card` for inline actions ("자세히", "공유", "저장").
- For destructive or modal-triggering actions, use a Dialog instead.

## Anatomy

```
┌────────────────────────────┐
│ [CardContent]              │
├────────────────────────────┤
│ [Action] [Action]          │
└────────────────────────────┘
```

Left-aligned by default. The convention differs from `DialogActions` (right-aligned) because cards are scanning surfaces — the eye reads left-to-right, sees the headline, then the action without backtracking.

## API

```tsx
<Card>
  <CardContent>...</CardContent>
  <CardActions>
    <Button size="small">자세히</Button>
    <Button size="small">공유</Button>
  </CardActions>
</Card>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Action buttons (typically `size="small"`) |
| `disableSpacing` | `boolean` | `false` | Remove default 8px gap between buttons |

## Button conventions

- Use `size="small"` (matches Card's compact reading rhythm).
- Use `variant="text"` or `variant="outlined"` — `contained` is too heavy for a card action.
- Maximum 2-3 actions per card. More = the card is doing too much.

## Tokens consumed

```
--space-sm     /* gap */
--space-md     /* horizontal padding */
--space-sm-y   /* vertical padding (lighter than DialogActions) */
```

## Accessibility

- Each button needs an accessible name — for icon-only buttons inside `CardActions`, provide `aria-label`.
- Tab order: matches visual order (left → right).
- For "expandable card" patterns where a `CardActions` button reveals more content, use `aria-expanded` on that button.

## Edge cases

- **Mobile narrow widths** — `CardActions` can right-align by setting `sx={{ justifyContent: 'flex-end' }}` if your Card design calls for it.
- **Long button labels in Korean** — Hangul labels run wider; consider icon-only buttons with `aria-label` for compact card grids.
- **Single primary action** — still wrap in `CardActions` for consistent padding.

## Code example

```tsx
<Card>
  <CardMedia component="img" image="/post.jpg" alt="" />
  <CardContent>
    <Typography variant="h6">{post.title}</Typography>
    <Typography variant="body2">{post.excerpt}</Typography>
  </CardContent>
  <CardActions>
    <Button size="small" startIcon={<ReadIcon />}>읽기</Button>
    <Button size="small" startIcon={<ShareIcon />}>공유</Button>
    <Box sx={{ ml: 'auto' }}>
      <IconButton aria-label="좋아요">
        <FavoriteIcon />
      </IconButton>
    </Box>
  </CardActions>
</Card>
```

## Don't

- Don't put 4+ actions — overflow into a menu.
- Don't use `variant="contained"` — too heavy for a card.
- Don't right-align without a reason — left-aligned is the cross-product expected pattern.

## References

- MUI: [`CardActions.d.ts`](../refs/mui/packages/mui-material/src/CardActions/CardActions.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-card.md`](component-card.md)
- [`component-card-content.md`](component-card-content.md)
- [`component-button.md`](component-button.md)
