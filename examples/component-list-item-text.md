# `ListItemText` — spec

> Synthesized from MUI `ListItemText`. The text block inside a `ListItem` — primary line plus optional secondary line. Handles typography, ellipsis, and screen-reader semantics so consumers don't reimplement.

## When to use

- Inside every `ListItem` that has text content (almost all of them).
- For text-only rows (no icon, no secondary action), `ListItemText` is the entire body.

## Anatomy

```
[Primary text — 14px medium / fg-default]
[Secondary text — 12px regular / fg-muted]
```

## API

```tsx
<ListItemText
  primary="홍길동"
  secondary="개발팀 · 2026-05-01 입사"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `primary` | `ReactNode` | — | Primary line (label) |
| `secondary` | `ReactNode` | — | Secondary line (sub-label) |
| `inset` | `boolean` | `false` | Indent left to align with rows that have a leading icon |
| `disableTypography` | `boolean` | `false` | Skip wrapping in `<Typography>`; renders raw children |
| `primaryTypographyProps` | `TypographyProps` | — | Override primary line typography |
| `secondaryTypographyProps` | `TypographyProps` | — | Override secondary line typography |

## States

`ListItemText` is structural — no interactive states. Inherits color from parent (`ListItemButton`'s selected/disabled states cascade).

## Tokens consumed

```
--font-size-body         /* primary */
--font-size-caption      /* secondary */
--font-weight-medium     /* primary */
--font-weight-regular    /* secondary */
--color-fg-default       /* primary */
--color-fg-muted         /* secondary */
--line-height-body       /* KR-bumped 1.65 */
--space-xs               /* gap between primary and secondary */
```

## Accessibility

- Semantic: primary renders as `<span>` (or override). Secondary renders as `<p>`.
- For screen readers, both lines are announced together as "primary, secondary".
- For LONG primary text that wraps, ensure `aria-label` provides a short summary if needed.
- `inset={true}` keeps text alignment consistent with sibling rows that have icons — don't drop it.

## Edge cases

- **Long primary text** — wraps; if multi-line wrap is undesired, set `primaryTypographyProps={{ noWrap: true }}` for ellipsis.
- **Empty secondary** — omit the prop; don't pass empty string (creates extra spacing).
- **React node as primary** — primary can be a `<Stack>` for inline badges next to the label. `disableTypography` lets you control the wrapper.
- **Korean text density** — Hangul reads slightly taller; default line-height (1.65 KR-bumped) should not be reduced.

## Code example

```tsx
// Settings row with switch
<ListItem
  secondaryAction={<Switch onChange={toggle} checked={pushEnabled} />}
>
  <ListItemText
    primary="푸시 알림"
    secondary="새 메시지가 오면 알림을 받아요"
  />
</ListItem>

// Inset variant — aligns with rows that have icons
<ListItemText inset primary="섹션 헤더 없음" secondary="아이콘 자리만큼 들여 써요" />
```

## Don't

- Don't pass JSX trees as `secondary` that reimplement Typography — use `secondaryTypographyProps` overrides.
- Don't omit `inset` selectively — once any sibling row uses `ListItemIcon`, all icon-less siblings should `inset` for visual rhythm.
- Don't rely on `secondary` for critical info screen reader users need quickly — they hear it as continuation of primary.

## References

- MUI: [`ListItemText`](../docs/reference/mui.md#list-item-text)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-list-item.md`](component-list-item.md)
- [`component-list-item-button.md`](component-list-item-button.md)
- [`knowledge/typography/type-scale-fundamentals.md`](../knowledge/typography/type-scale-fundamentals.md)
