# `Popover` — spec

> Citing Ant Design `Popover`, MUI `Popper`/`Popover`, shadcn-ui `popover`

## Purpose

A non-modal overlay anchored to a trigger element. Used for: filter detail, contextual settings, "more info" content, color picker, quick actions menu.

Different from related primitives:

| Primitive | Use |
| --- | --- |
| **Tooltip** | Short hover hint. No interaction. |
| **Popover** | Interactive content anchored to a trigger. Close on outside click. |
| **Modal/Dialog** | Centered, blocks page interaction. |
| **Dropdown menu** | List of actions (`Cmd+click`-style). Use Popover with menu styling. |

## Anatomy

```
[trigger button]
       │
       ▼ (click)
┌──────────────────────┐
│ ▶ Popover header     │
│ ─────────────────    │
│   Body content       │
│   Form / list / etc  │
│                      │
│   [action]   [close] │
└──────────────────────┘
       ▲ (arrow optional)
```

| Slot | Required | Notes |
| --- | --- | --- |
| Trigger | yes | The element popover anchors to |
| Body | yes | Interactive content |
| Arrow | optional | Pointer at trigger; usually small triangle |
| Close button | optional | Explicit close affordance |

## API

```tsx
<Popover>
  <Popover.Trigger asChild>
    <Button>Filter</Button>
  </Popover.Trigger>
  <Popover.Content side="bottom" align="start">
    <FilterForm />
  </Popover.Content>
</Popover>
```

| Prop (root) | Type | Default | Description |
| --- | --- | --- | --- |
| `open` / `defaultOpen` | `boolean` | — | Controlled/uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | — | |
| `modal` | `boolean` | `false` | If true, also traps focus + scroll lock (rare for popover) |

| Prop (Content) | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Preferred position |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alignment along the side |
| `sideOffset` | `number` | `4` | Gap between trigger and popover |
| `collisionPadding` | `number` | `8` | Distance from viewport edge before flipping |
| `arrow` | `boolean` | `false` | Show arrow pointing at trigger |

## Behavior

| Trigger | Action |
| --- | --- |
| Click trigger | Open |
| Click trigger (when open) | Close |
| Click outside content | Close |
| Press Escape | Close |
| Tab away (focus leaves) | Close (if `modal={false}`) |
| Window resize | Reposition |
| Scroll | Reposition (or close if dramatic) |

For `modal={true}`: closes only via Escape or explicit close button. Use rarely — popover that needs modal behavior is usually a Dialog.

## Positioning

The popover positions relative to the trigger with collision detection:

```
Preferred: side="bottom" align="start"

Trigger:    [...]
            ▼
            ┌──────────┐
            │ content  │
            └──────────┘
```

If the popover would overflow the viewport, it auto-flips to the opposite side. Use Floating UI or Radix's collision detection — don't reinvent.

## Sizes

Popover doesn't have fixed sizes — content determines size. Set min-width based on the trigger's width, or use `width="trigger"` to match exactly.

| Width strategy | Use |
| --- | --- |
| Auto (content-driven) | Default |
| Match trigger width | Date picker, select-like popovers |
| Fixed (e.g., 320px) | Filter panels, detail cards |
| Max-content | Tooltips with rich content |

## States

| State | Visual |
| --- | --- |
| Closed | not in DOM (or `display: none`) |
| Opening | 100ms fade + slight scale 0.95 → 1 + slide |
| Open | settled, content visible |
| Closing | 75ms fade |

## Tokens consumed

```
--color-bg-elevated         (popover surface)
--color-border-default
--color-text-primary
--space-md, --space-sm
--radius-md
--shadow-popover
--motion-fast, --easing-out
--z-popover                 (above page content, below modal)
```

## Accessibility

- Trigger: `aria-haspopup="true"`, `aria-expanded={open}`, `aria-controls={contentId}`.
- Content: `role="dialog"` if interactive, OR plain region if just informational.
- For menu-flavored popovers (list of actions): use [`<DropdownMenu>`] instead of Popover — it's a different ARIA pattern.

### Focus

When popover opens via click:
- **Modal popover** (`modal={true}`): trap focus inside, return focus to trigger on close.
- **Non-modal popover** (default): focus moves into popover automatically (first focusable element). Tab cycles within and **eventually exits**, closing the popover when focus leaves.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` (on trigger) | Reaches trigger |
| `Enter` / `Space` | Open popover |
| `Tab` (inside) | Cycle through interactive content |
| `Esc` | Close, return focus to trigger |
| Click outside | Close (no focus transfer) |

## Tooltip vs Popover

A common confusion. Use Tooltip for:
- Short hint, hover-triggered
- No interactive content
- No persistent need to interact

Use Popover for:
- Click-triggered (or focus-triggered for keyboard)
- Has buttons, inputs, links inside
- User needs time to read or interact

Don't put interactive content in a tooltip. Tooltips disappear on mouse-out.

## Code example

```tsx
// Filter popover
<Popover>
  <Popover.Trigger asChild>
    <Button variant="outline" iconStart={<FilterIcon />}>
      필터 {activeCount > 0 && `(${activeCount})`}
    </Button>
  </Popover.Trigger>
  <Popover.Content side="bottom" align="end" style={{ width: 320 }}>
    <FilterForm />
    <div className="flex justify-between p-3 border-t">
      <Button variant="ghost" onClick={resetFilters}>초기화</Button>
      <Button onClick={applyFilters}>적용</Button>
    </div>
  </Popover.Content>
</Popover>

// User menu popover
<Popover>
  <Popover.Trigger asChild>
    <Avatar src={user.photoUrl} alt={user.name} />
  </Popover.Trigger>
  <Popover.Content side="bottom" align="end">
    <div className="p-3 border-b">
      <p className="font-medium">{user.name}</p>
      <p className="text-sm text-text-secondary">{user.email}</p>
    </div>
    <ul role="menu">
      <li><a href="/profile">프로필</a></li>
      <li><a href="/settings">설정</a></li>
      <li><button onClick={signOut}>로그아웃</button></li>
    </ul>
  </Popover.Content>
</Popover>
```

(Note: a list of actions like the user menu is more strictly a `DropdownMenu` — use that primitive for proper menu a11y. Popover here is illustrative.)

## Edge cases

- **Popover near viewport edge**: auto-flip handled by Floating UI / Radix.
- **Popover wider than viewport**: not allowed — cap at `100vw - 16px`.
- **Trigger inside a scrollable container**: popover repositions on scroll.
- **Multiple popovers stacked**: avoid. Refactor — usually means navigation should change.
- **Popover with form inside**: typing must not close popover. Make sure outside-click handler ignores trigger and content.
- **iOS Safari**: virtual keyboard pushes content; popover may need to reposition.
- **Click on trigger that's inside another clickable** (e.g., card with popover button): event must `stopPropagation` so card doesn't also fire.

## Don't

- Don't use Popover when a Tooltip suffices (no interaction needed).
- Don't use Popover when a Modal/Dialog suffices (decision/blocking interaction).
- Don't put critical CTAs inside a popover that's not also reachable elsewhere.
- Don't ship a popover without `aria-expanded` on the trigger — keyboard users need to know state.
- Don't make the popover "sticky" — it should close on outside click. (Exception: `modal={true}` for special cases.)
- Don't open popovers on hover unless they truly contain a tooltip (then use Tooltip).

## References

- Ant Design: [`refs/ant-design/components/popover/`](../refs/ant-design/components/popover/) — `Popover` with rich placement, `trigger="hover" | "click" | "focus"`. Hover trigger is generally avoided in modern UIs.
- MUI: [`refs/mui/packages/mui-material/src/Popper/`](../refs/mui/packages/mui-material/src/Popper/) — low-level positioning primitive. `Popover` adds backdrop + focus management.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/popover.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/popover.tsx) — Radix Popover primitive. **Default for new projects.**

## Cross-reference

- [`examples/component-tooltip.md`](component-tooltip.md) — for hover-only hints
- [`examples/component-modal.md`](component-modal.md) — for blocking/decision interactions
- [`examples/component-select.md`](component-select.md) — uses popover-pattern for combobox
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
- [WAI-ARIA Dialog Pattern (modal popover)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
