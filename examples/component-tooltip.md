# `Tooltip` — spec

> Citing Ant Design `Tooltip`, MUI `Tooltip`, shadcn-ui `tooltip`

## Purpose

A short hover/focus hint about an interactive element. **Help text, not content.** If users would miss the content without it, the content needs to be visible — not in a tooltip.

## When NOT to use a tooltip

- For critical instructions (use inline help text or labels).
- For long content (use Popover).
- On non-interactive elements that aren't focusable (keyboard users can't reach).
- For toolbar icon-only buttons that NEED tooltips → consider visible labels instead, or accept that hover is the only path.

## Anatomy

```
              ┌─────────────────────┐
              │  Hint text          │
              └────────┬────────────┘
                       ▼ (arrow)
              [trigger element]
```

Or other side: trigger above, tooltip below; etc. — depending on space.

## API

```tsx
<Tooltip content="이 아이콘을 클릭하면 설정으로 이동합니다">
  <IconButton aria-label="Settings"><SettingsIcon /></IconButton>
</Tooltip>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string \| ReactNode` | — | Required. The hint text. |
| `children` | `ReactElement` | — | The trigger. **Single element only**, must support `ref`. |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"top"` | Preferred position |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alignment along the side |
| `delayMs` | `number` | `300` | Open delay (avoid flicker on quick mouse pass) |
| `closeDelayMs` | `number` | `100` | Close delay |
| `disabled` | `boolean` | `false` | Suppress tooltip without disabling trigger |
| `open` | `boolean` | — | Controlled open (overrides hover/focus) |
| `onOpenChange` | `(open: boolean) => void` | — | |
| `arrow` | `boolean` | `true` | Show arrow pointing at trigger |

## Behavior

| Trigger | Action |
| --- | --- |
| Mouse over trigger | Open after `delayMs` |
| Mouse leave | Close after `closeDelayMs` |
| Keyboard focus on trigger | Open immediately (no delay) |
| Keyboard blur | Close immediately |
| Click trigger | Tooltip closes (don't override the click) |
| Touch on trigger | **Don't show tooltip on touch** — interferes with tap. Use long-press to show OR don't show on touch at all (most common). |

## Sizes

| Size | Padding | Font | Max width |
| --- | --- | --- | --- |
| `sm` (default for icon button hints) | 4px 8px | 12px | 200px |
| `md` (default for buttons with labels) | 6px 10px | 13px | 280px |
| `lg` (descriptive, multi-line) | 8px 12px | 14px | 360px |

> Most tooltips should be `sm`. If you need `lg`, you probably want a Popover.

## States

| State | Visual |
| --- | --- |
| Closed | not in DOM (or `display: none`) |
| Opening | 100ms fade + slight scale 0.95 → 1 |
| Open | settled, dark bg + light text (or inverse, see token) |
| Closing | 75ms fade |

## Tokens consumed

```
--color-bg-tooltip          (typically inverse of bg-default — dark in light mode, light in dark mode)
--color-text-on-tooltip     (inverse of text-primary)
--space-xs, --space-sm
--radius-sm
--font-size-xs, --font-size-sm
--shadow-popover
--motion-fast, --easing-out
```

## Accessibility — critical

The native `title` attribute does NOT meet a11y requirements:
- Doesn't show on keyboard focus on most platforms.
- Mobile browsers ignore it.
- Inconsistent across screen readers.

**Use a real tooltip primitive** (Radix Tooltip / shadcn / Floating UI). Don't use `title`.

### ARIA wiring

- Trigger: `aria-describedby={tooltipId}` when tooltip is open; remove or empty when closed.
- Tooltip: `role="tooltip"`, `id={tooltipId}`.
- Trigger should also have its own accessible name (`aria-label` if icon-only) — the tooltip is supplementary, not the primary name.

```html
<!-- Bad: tooltip is the only accessible name -->
<button><CloseIcon /></button>
<Tooltip>Close</Tooltip>

<!-- Good: button has aria-label, tooltip is descriptive -->
<button aria-label="Close"><CloseIcon /></button>
<Tooltip>Closes the dialog and discards changes</Tooltip>

<!-- Best for icon button: hide tooltip when redundant with aria-label -->
<button aria-label="Close"><CloseIcon /></button>
<!-- (no tooltip — aria-label is the name and the visual icon is the affordance) -->
```

### Touch / mobile

- `hover` doesn't exist on touch.
- Long-press to show tooltip is iOS/Android convention but rarely implemented.
- **Best practice**: tooltips are a desktop affordance. On mobile, surface critical info inline or as a help drawer (`?` icon → bottom sheet).

## Code example

```tsx
// Standard icon button with tooltip
<Tooltip content="새 항목 추가">
  <IconButton aria-label="Add item" onClick={handleAdd}>
    <PlusIcon />
  </IconButton>
</Tooltip>

// Disabled tooltip on disabled button (workaround — disabled buttons don't fire hover events)
<Tooltip content="권한이 없습니다">
  <span> {/* wrapper enables hover */}
    <Button disabled>Edit</Button>
  </span>
</Tooltip>

// Keyboard-shortcut hint
<Tooltip content="Save (Cmd+S)">
  <Button onClick={handleSave}>Save</Button>
</Tooltip>
```

## Edge cases

- **Tooltip on disabled button**: native `disabled` doesn't fire mouse events. Wrap in a `<span>` so the wrapper handles hover.
- **Tooltip on a link that wraps to new line**: the tooltip might appear far from the cursor. Better to make the tooltip follow the trigger's bounding box, or use `align="start"`.
- **Long content that wraps**: cap at max-width and wrap. If consistently long, you want a Popover.
- **Rapid mouse pass**: tooltip opens on hover delay (300ms), so quick mouse-bys don't trigger. Don't reduce the delay below 200ms.
- **Tooltip near viewport edge**: should auto-flip to opposite side. Use Floating UI or Radix's collision detection.
- **Reduced motion**: disable fade animation, just show/hide.
- **In a scrollable container**: tooltip should reposition or hide on scroll.
- **Korean tooltips**: short hangul fits comfortably; if your tooltip is > 1 line, reconsider — should probably be inline help.

## Don't

- Don't put critical content in tooltips. Keyboard-only users on mobile cannot access them.
- Don't use a tooltip on a non-interactive element (e.g., a static icon). Either make it interactive (focusable button) or use inline help text.
- Don't show a tooltip on an `aria-label` that says the same thing — redundant and noisy.
- Don't use HTML `title` attribute. Build a real tooltip.
- Don't put interactive elements inside the tooltip. It's hover-triggered and disappears on mouse-out.
- Don't show on click (that's a Popover).

## References

- Ant Design: [`refs/ant-design/components/tooltip/`](../docs/reference/ant-design.md#tooltip) — `Tooltip` with rich placement options (12 directions). `mouseEnterDelay` / `mouseLeaveDelay` props.
- MUI: [`refs/mui/packages/mui-material/src/Tooltip/`](../docs/reference/mui.md#tooltip) — `Tooltip` with `placement`, `enterDelay`, `leaveDelay`, `arrow`. Solid implementation.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/tooltip.tsx`](../docs/reference/shadcn-ui.md#tooltip) — Radix Tooltip primitive. **Default — best a11y of the three.**

## Cross-reference

- [knowledge/a11y/keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) — focus-driven tooltips
- [WAI-ARIA Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
