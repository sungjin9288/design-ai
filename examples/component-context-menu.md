# `ContextMenu` — spec

> Synthesized from shadcn-ui `context-menu` (Radix). Right-click / long-press triggered menu. Same WAI-ARIA Menu pattern as DropdownMenu but invoked by gesture rather than button.

## When to use

- Item-level actions in lists (rename, duplicate, delete a file).
- Editor right-click (copy / paste / format).
- Power-user shortcuts that don't deserve a visible button.

When NOT to use:
- Mobile-primary apps where right-click doesn't exist (long-press is non-obvious; many users miss).
- Critical actions — visible buttons must remain available; ContextMenu is supplemental.
- Surfaces where right-click should fall through to browser default (text input, links).

## Anatomy

```
[user right-clicks an item]
       ↓
       ┌────────────────────┐
       │  Open                  │
       │  Open in new tab       │
       │  ─────                  │
       │  Rename               │
       │  Duplicate             │
       │  ─────                  │
       │  Delete       (red)    │
       └────────────────────┘
```

## API

```tsx
<ContextMenu>
  <ContextMenu.Trigger asChild>
    <FileRow file={file} />
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item onSelect={() => open(file)}>Open</ContextMenu.Item>
    <ContextMenu.Item onSelect={() => openInNewTab(file)}>Open in new tab</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item onSelect={() => rename(file)}>
      Rename
      <ContextMenu.Shortcut>F2</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Item onSelect={() => duplicate(file)}>
      Duplicate
      <ContextMenu.Shortcut>⌘D</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item destructive onSelect={() => del(file)}>
      Delete
      <ContextMenu.Shortcut>Del</ContextMenu.Shortcut>
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>
```

## Composition

Same parts as `DropdownMenu`:

| Part | Purpose |
| --- | --- |
| `Trigger` | Element where right-click / long-press opens the menu |
| `Content` | Menu surface; positioned at cursor |
| `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem` | Same as DropdownMenu |
| `Sub`, `SubTrigger`, `SubContent` | Nested submenu |
| `Label`, `Separator`, `Group`, `Shortcut` | Same |

The semantic difference is only **how the menu opens** — content + behavior identical.

## Trigger gestures

| Platform | Gesture |
| --- | --- |
| Desktop | Right-click (mouse), Ctrl+Click (Mac), 2-finger tap (trackpad) |
| Mobile | Long-press (~500ms) |
| Keyboard | Shift+F10 OR Menu/Application key |

The Trigger element should NOT visually change on hover (no obvious affordance — that's part of the contract). Power users discover via convention.

## Long-press on mobile

For mobile, ContextMenu must be invoked by long-press:
- Default 500ms hold.
- Visual feedback during hold (subtle bg highlight at 250ms).
- Haptic feedback on activation.
- Cancel if finger moves > 10px during press.

```tsx
<ContextMenu.Trigger asChild longPressDelay={500} hapticFeedback>
  <FileRow />
</ContextMenu.Trigger>
```

## Positioning

- **Default**: cursor position (click point).
- **Auto-flip**: if cursor is near viewport edge, flip menu to fit.
- **Touch invocation**: position at touch point (or above if too low).

For long lists where every row has a context menu: ensure menu doesn't open under another row's content visually.

## States

Same as DropdownMenu:
- Closed → opening (200ms fade+scale) → open → closing (150ms).
- Item hover, focus, disabled, destructive states.

## Keyboard contract

Same as DropdownMenu:
- `Shift+F10` or `Menu` key opens (alternative to right-click).
- Arrow keys navigate.
- `Enter` activates.
- `Esc` closes.

## Tokens consumed

```
--color-bg-overlay
--color-fg-on-overlay
--color-bg-overlay-hover
--color-error-default       (destructive item)
--color-border-overlay
--radius-md
--shadow-overlay
--space-xs, --space-sm
--font-size-sm
--motion-fast
--z-overlay
```

## Accessibility

- Trigger: native right-click works; for keyboard users, `Shift+F10` and `Menu` key open.
- For visible discovery: pair with a visible "More" `<DropdownMenu>` trigger. ContextMenu = supplemental shortcut.
- Content: `role="menu"`, items `role="menuitem"` (same as DropdownMenu).
- Don't suppress browser default context menu unless your replacement is functionally complete.
- Touch targets ≥ 44pt on mobile (long-press menu items).

## Korean conventions

Same as DropdownMenu — Korean text legible, Pretendard / NanumSquare body. 합쇼체 ("삭제하시겠습니까?") for destructive confirmations OR 해요체 ("삭제할까요?") for casual brands.

## Edge cases

- **Right-click on text selection**: ContextMenu may compete with browser's "Copy / Paste" menu. Decision:
  - Inside an input: let browser default win.
  - Inside a custom-rendered text element: replace with custom menu including copy / paste.
- **Long-press near edge of element**: ensure cursor / touch point stays within Trigger's bounding box.
- **Multiple items selected**: ContextMenu acts on the right-clicked item OR all selected — make explicit ("Delete 5 items").
- **Click outside while open**: close menu (any click outside Content closes).
- **Menu key / Shift+F10 with no element focused**: do nothing (or open a default menu if app has one).
- **Touch + mouse hybrid (iPad with trackpad)**: respect both gestures.
- **Browser context menu coexistence**: Some platforms (Linux, dev tools): `event.preventDefault()` on Trigger's `oncontextmenu` blocks browser menu.

## Don't

- Don't make ContextMenu the only path to an action. Always provide an obvious button OR keyboard shortcut.
- Don't open ContextMenu on regular click — it must be triggered by right-click / long-press.
- Don't change Trigger's appearance on hover to suggest a click target.
- Don't replace browser default context menu in plain text inputs (users expect spell-check, paste).
- Don't use ContextMenu for primary navigation.
- Don't ship without keyboard alternative (Shift+F10 / Menu key).

## References

- shadcn-ui: [`context-menu`](../docs/reference/shadcn-ui.md#context-menu) (Radix)
- WAI-ARIA: same Menu pattern as DropdownMenu
- Native: HTML5 `oncontextmenu` event

## Cross-reference

- [`examples/component-dropdown.md`](component-dropdown.md) — visible-trigger variant
- [`examples/component-popover.md`](component-popover.md) — for non-menu floating content
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
