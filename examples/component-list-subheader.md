# `ListSubheader` — spec

> Synthesized from MUI `ListSubheader`. A section header inside a `List`. Use for grouping related rows under a label ("최근", "즐겨찾기", "전체").

## When to use

- Grouped lists (categories of settings, sections of nav).
- Date-grouped feeds ("오늘", "어제", "이번 주").
- Avoid for short lists (<5 rows) — header overhead isn't worth it.

## API

```tsx
<List subheader={<ListSubheader>최근 검색</ListSubheader>}>
  <ListItemButton>...</ListItemButton>
  <ListItemButton>...</ListItemButton>
</List>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Header text |
| `disableSticky` | `boolean` | `false` | Skip sticky-on-scroll behavior |
| `inset` | `boolean` | `false` | Indent to align with icon-led rows |
| `disableGutters` | `boolean` | `false` | Remove horizontal padding |

## Tokens consumed

```
--font-size-caption       /* 12px */
--font-weight-semibold
--color-fg-muted          /* default */
--space-md                /* horizontal padding */
--list-subheader-height   /* 32px */
```

## Accessibility

- Renders as `<li>` by default. For semantic headers, override `component="h3"` or wrap content with appropriate heading.
- Don't use as the *only* visual cue for grouping — pair with `Divider` or distinct background for low-vision users.

## Edge cases

- **Sticky on scroll** — default behavior keeps the subheader visible while its rows scroll past. Disable for short lists.
- **Korean labels** — short and noun-form ("최근", "즐겨찾기"). Avoid sentence-form labels here.

## Code example

```tsx
<List>
  <ListSubheader>최근</ListSubheader>
  {recent.map((it) => <ListItemButton key={it.id}>{it.title}</ListItemButton>)}
  <ListSubheader>즐겨찾기</ListSubheader>
  {favs.map((it) => <ListItemButton key={it.id}>{it.title}</ListItemButton>)}
</List>
```

## Don't

- Don't nest subheaders.
- Don't use for sublabels under a single row — that's `ListItemText.secondary`.

## References

- MUI: [`ListSubheader`](../docs/reference/mui.md#list-subheader)

## Cross-reference

- [`component-list-item.md`](component-list-item.md)
- [`component-list-item-button.md`](component-list-item-button.md)
