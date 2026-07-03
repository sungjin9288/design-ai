# `IconButton` — spec

> Synthesized from MUI `IconButton` and Material 3 icon button patterns. A button that contains only an icon. Distinct from `Button` (text+icon) and `Toggle` (persistent state).

## When to use

- Toolbar actions where space is tight (search, settings, more).
- Card / item trailing actions.
- Mobile primary action affordances.

When NOT to use:
- The icon's meaning isn't universally recognized — use text Button.
- The action is the primary CTA — use Button with text.

## Anatomy

```
[ ⚙ ]    [ × ]    [ ⋮ ]
 settings close   more
```

A circular or rounded-square button with one icon centered. ≥ 44pt touch target on mobile (44x44 min); ≥ 32x32 desktop.

## API

```tsx
<IconButton aria-label="설정" onClick={openSettings}>
  <SettingsIcon />
</IconButton>

<IconButton variant="outline" size="sm" aria-label="닫기">
  <CloseIcon />
</IconButton>

<IconButton variant="filled" color="destructive" aria-label="삭제">
  <TrashIcon />
</IconButton>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | `string` | required | Accessible label (icon-only buttons MUST have this) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Touch target size |
| `variant` | `"ghost" \| "outline" \| "filled" \| "tonal"` | `"ghost"` | Visual treatment |
| `color` | `"default" \| "brand" \| "destructive"` | `"default"` | Color token |
| `disabled` | `boolean` | `false` | — |
| `loading` | `boolean` | `false` | Replaces icon with spinner |

## Variants

| Variant | Look |
| --- | --- |
| `ghost` (default) | No bg until hover; subtle |
| `outline` | Border, no fill |
| `filled` | Solid bg (brand or destructive) |
| `tonal` | Soft tinted bg (Material 3 style) |

## Sizes

| Size | Touch target | Icon size |
| --- | --- | --- |
| `sm` | 32x32 | 16-18px |
| `md` (default) | 40x40 | 20-24px |
| `lg` | 48x48 | 24-28px |

For mobile primary: ≥ 44pt minimum. Desktop secondary: 32px ok.

## States

| State | Visual |
| --- | --- |
| Default | Per variant |
| Hover | Subtle bg shift (ghost) or darker fill (filled) |
| Focus-visible | Visible 2px ring around the button |
| Active (press) | Deeper bg |
| Disabled | Reduced opacity, no events, `aria-disabled` |
| Loading | Spinner replaces icon; `aria-busy="true"` |

## Tokens consumed

```
--icon-button-size-sm / -md / -lg
--icon-button-bg-default
--icon-button-bg-hover
--icon-button-bg-pressed
--icon-button-bg-filled              (filled variant)
--icon-button-bg-destructive
--icon-button-fg-default
--icon-button-fg-on-filled
--icon-button-border                 (outline variant)
--radius-md                          (rounded-square) or --radius-full (circular)
--motion-fast
--ease-out
```

## Accessibility

- **`aria-label` mandatory**. Icon-only buttons without label fail accessibility.
- Focus-visible ring required.
- Touch target ≥ 44pt mobile primary.
- For Korean: `aria-label` in Korean ("설정", "닫기", "삭제") for KR audiences.

## Code example

```tsx
function ToolbarActions() {
  return (
    <div className="toolbar">
      <IconButton aria-label="이전">
        <ChevronLeftIcon />
      </IconButton>
      <IconButton aria-label="다음">
        <ChevronRightIcon />
      </IconButton>
      <IconButton aria-label="새로고침" loading={refreshing}>
        <RefreshIcon />
      </IconButton>
      <IconButton aria-label="더보기">
        <MoreIcon />
      </IconButton>
    </div>
  );
}
```

## Don't

- Don't omit `aria-label`.
- Don't make IconButton smaller than 32x32 on desktop, 44pt on mobile.
- Don't use IconButton for primary CTAs. Use text Button.
- Don't pair IconButton with Tooltip text on mobile (no hover) — `aria-label` is the spoken label.

## References

- MUI: [`IconButton`](../docs/reference/mui.md#icon-button)
- Material 3: Icon button variants

## Cross-reference

- [`examples/component-button.md`](component-button.md) — text+icon variant
- [`examples/component-icon.md`](component-icon.md)
- [`examples/component-tooltip.md`](component-tooltip.md) — pairs with IconButton on desktop
