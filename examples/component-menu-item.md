# `MenuItem` — spec

> Synthesized from MUI `MenuItem`. A single row inside a `Menu` (popover) or `Select` dropdown. Behaves like an interactive `ListItemButton` but with menu-specific keyboard semantics (auto-focus on hover, Enter to select, type-ahead).

## When to use

- One option inside `<Menu>`, `<Select>`, or `<Autocomplete>`.
- Context menus, dropdown menus, command palettes (with custom item rendering).
- For non-menu interactive rows in plain lists, use `ListItemButton` instead — `MenuItem` carries menu-specific `role` and keyboard expectations.

## Anatomy

```
┌──────────────────────────────────────────┐
│ [icon]  Label              [shortcut/✓]  │
└──────────────────────────────────────────┘
```

## API

```tsx
<Menu open={open} anchorEl={anchorEl}>
  <MenuItem onClick={...}>편집</MenuItem>
  <MenuItem onClick={...} selected>복사</MenuItem>
  <MenuItem disabled>삭제</MenuItem>
</Menu>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Label + optional icon/shortcut |
| `selected` | `boolean` | `false` | Highlighted (current value) |
| `disabled` | `boolean` | `false` | Non-selectable; greyed |
| `dense` | `boolean` | `false` | Reduce vertical padding |
| `divider` | `boolean` | `false` | Bottom divider |
| `onClick` | `(e) => void` | — | Selection handler |
| `value` | `any` | — | When inside `Select`; matched against `Select.value` |

## States

| State | Visual |
| --- | --- |
| Default | transparent bg, fg-default |
| Hover / focus | bg-subtle (mouse hover and keyboard focus share the same visual) |
| Selected | check icon (or filled bg) + bg-selected |
| Active | bg-pressed |
| Disabled | reduced opacity, no hover effect |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle           /* hover/focus */
--color-bg-selected
--color-fg-default
--color-fg-on-selected
--menu-item-min-height-32   /* dense */
--menu-item-min-height-36   /* default */
--space-sm
--space-md
```

## Accessibility

- Semantic element: `<li role="menuitem">` (or `option` inside `Select`).
- Keyboard: ↑/↓ navigates between items; Enter / Space activates; type-ahead jumps to matching item.
- The currently-focused item must visually match the keyboard cursor — don't separate "hover" and "focus" visuals.
- `aria-disabled="true"` for disabled items (don't use `disabled` attribute alone).
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Long item text** — single-line truncation with ellipsis. If you need multiline, use a custom command-palette pattern.
- **Submenu / nested menu** — MUI doesn't ship native submenus; use a separate Menu with `anchorEl` set to the parent item.
- **Korean text density** — pad horizontal slightly more for Korean labels (`space-md` instead of `space-sm`) to avoid cramped feel.

## Code example

```tsx
<Select value={role} onChange={(e) => setRole(e.target.value)}>
  <MenuItem value="admin">관리자</MenuItem>
  <MenuItem value="member">일반 사용자</MenuItem>
  <MenuItem value="guest" disabled>초대 대기</MenuItem>
</Select>
```

## Don't

- Don't render `MenuItem` outside a `Menu` / `Select` parent — keyboard navigation breaks.
- Don't use `selected` for hover state — `selected` means "current value", a persistent state.
- Don't put more than one primary action per item; use a separate trailing action button if you need both select + delete.

## References

- MUI: [`MenuItem.d.ts`](../refs/mui/packages/mui-material/src/MenuItem/MenuItem.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-menu-list.md`](component-menu-list.md)
- [`component-select.md`](component-select.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
