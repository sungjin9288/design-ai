# `CardHeader` — spec

> Synthesized from MUI `CardHeader`. The structured header region of a `Card` — avatar/icon + title + subheader + optional trailing action. Distinct from a plain `<Typography variant="h6">` inside `CardContent` because it handles the avatar/action layout.

## When to use

- Cards representing a person/entity (post by user, project by team).
- Cards with a top-level action (more menu, dismiss button).
- For text-only cards, use `<Typography>` inside `CardContent` instead.

## Anatomy

```
┌─────────────────────────────────────────┐
│ [avatar]  Title                  [⋮]    │
│           Subheader                     │
└─────────────────────────────────────────┘
```

## API

```tsx
<Card>
  <CardHeader
    avatar={<Avatar src={user.avatarUrl} />}
    title={user.name}
    subheader="2시간 전 게시"
    action={
      <IconButton aria-label="더보기">
        <MoreVertIcon />
      </IconButton>
    }
  />
  <CardMedia component="img" image={post.image} />
  <CardContent>...</CardContent>
</Card>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `avatar` | `ReactNode` | — | Leading element (Avatar / Icon) |
| `title` | `ReactNode` | — | Primary title (string or component) |
| `subheader` | `ReactNode` | — | Sub-title (smaller, muted) |
| `action` | `ReactNode` | — | Trailing right-aligned action (button/menu) |
| `disableTypography` | `boolean` | `false` | Skip default Typography wrapping |
| `titleTypographyProps` | `TypographyProps` | — | Override title typography |
| `subheaderTypographyProps` | `TypographyProps` | — | Override subheader typography |

## States

Header itself is non-interactive. The `action` slot owns its states.

## Tokens consumed

```
--font-size-heading-sm   /* title — 16px */
--font-size-caption      /* subheader — 12px */
--font-weight-semibold   /* title */
--space-md               /* horizontal padding */
--space-md-y             /* vertical padding */
--color-fg-default
--color-fg-muted         /* subheader */
```

## Accessibility

- Title renders as `<span>` by default — for semantic page hierarchy, use `<Typography component="h2" variant="h6">` as title prop instead of bare string.
- `action` button needs an accessible name (`aria-label="더보기"`).
- Avatar `alt` should be the person's name, not "avatar" or "user image".

## Edge cases

- **Long title** — wraps; if you need ellipsis, set `titleTypographyProps={{ noWrap: true }}` and ensure container width is bounded.
- **No avatar** — `action` still right-aligns; title/subheader fill the avatar's gap. Layout works fine.
- **Korean datetime in subheader** — relative format "2시간 전" rather than absolute "2026-05-09 14:23". Cite [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md).

## Code example

```tsx
function PostCard({ post, onMore, onLike }) {
  return (
    <Card>
      <CardHeader
        avatar={<Avatar src={post.author.avatarUrl}>{post.author.name[0]}</Avatar>}
        title={post.author.name}
        subheader={formatRelative(post.createdAt)}  // "2시간 전"
        action={
          <IconButton aria-label={`${post.author.name}의 게시물 더보기`} onClick={onMore}>
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardMedia component="img" image={post.imageUrl} alt="" />
      <CardContent>
        <Typography variant="body2">{post.body}</Typography>
      </CardContent>
      <CardActions>
        <IconButton aria-label="좋아요" onClick={onLike}>
          <FavoriteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
```

## Don't

- Don't put the entire card click handler on `CardHeader` — split into specific actions.
- Don't omit `aria-label` on the `action` IconButton.
- Don't use `CardHeader` for a card without avatar/action — `<Typography variant="h6">` inside `CardContent` is lighter.

## References

- MUI: [`CardHeader`](../refs/mui/packages/mui-material/src/CardHeader/)

## Cross-reference

- [`component-card.md`](component-card.md)
- [`component-card-content.md`](component-card-content.md)
- [`component-card-actions.md`](component-card-actions.md)
- [`component-card-media.md`](component-card-media.md)
