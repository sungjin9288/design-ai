# `Badge` — spec

> Synthesized from Ant Design `Badge`, MUI `Badge`, shadcn-ui `badge`. A small status / count indicator anchored to another element OR used standalone as a label.

## Two modes

| Mode | Use |
| --- | --- |
| **Standalone label** (shadcn-style) | Status pill rendered inline as text content ("New", "Beta", "Sale 30%") |
| **Indicator** (Ant + MUI style) | Small dot or count anchored to a parent — typically an avatar or icon (notification count, online status) |

These are conceptually different and often shipped as different components in larger systems. shadcn ships only the standalone form; Ant + MUI ship both. Pick one mental model per system.

## Standalone Badge — anatomy

```
[● New]    [Beta]    [Sale 30%]    [PRO]
```

A pill with optional icon + text, brand-colored.

## Indicator Badge — anatomy

```
┌────────┐
│ Inbox  │● 3       ← positioned top-right of the parent
└────────┘
```

A wrapper around a child element, with a count or dot floating at a corner.

## API — Standalone

```tsx
<Badge variant="default">New</Badge>
<Badge variant="secondary">Beta</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="outline">Draft</Badge>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "secondary" \| "destructive" \| "outline" \| "success" \| "warning"` | `"default"` | Visual style |
| `size` | `"sm" \| "md"` | `"md"` | Dense vs default |
| `asChild` | `boolean` | `false` | Render as child element (Slot pattern) |
| `children` | `ReactNode` | — | Content (text, optional icon) |

## API — Indicator

```tsx
<IndicatorBadge count={3} max={99}>
  <BellIcon />
</IndicatorBadge>

<IndicatorBadge variant="dot" status="online">
  <Avatar src={url} />
</IndicatorBadge>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number \| undefined` | — | Number to display; `undefined` = no count |
| `max` | `number` | `99` | Cap; `count > max` displays as `max+` |
| `variant` | `"count" \| "dot"` | `"count"` | Number vs solid dot |
| `status` | `"online" \| "offline" \| "away" \| "busy" \| "default"` | `"default"` | Color preset |
| `placement` | `"top-right" \| "top-left" \| "bottom-right" \| "bottom-left"` | `"top-right"` | Anchor corner |
| `offset` | `[x, y]` | `[0, 0]` | Pixel offset from corner |
| `showZero` | `boolean` | `false` | Show count when `count === 0` |
| `children` | `ReactNode` | — | Element being decorated |

## Variants

| Variant | Visual | Use |
| --- | --- | --- |
| `default` | Brand-color filled | Primary badges (New, Featured) |
| `secondary` | Muted bg | Neutral status (Beta, Draft) |
| `destructive` | Red filled | Error, blocked |
| `outline` | Bordered transparent | Subtle (Optional, Coming soon) |
| `success` | Green | Success markers |
| `warning` | Amber | Caution markers |

## Status colors (Indicator)

```
online  → green
offline → gray
away    → yellow
busy    → red
default → brand
```

## States

| State | Visual |
| --- | --- |
| Default | Resting |
| Hover (if interactive) | Slight bg darken |
| Active / pressed | Deeper bg |
| Disabled | Reduced opacity, no events |

Most badges are non-interactive. If clickable: render as `<button>` or wrap in `<Link>`; styles add hover + focus ring.

## Tokens consumed

```
--color-bg-default                 (outline / secondary)
--color-bg-secondary               (secondary fill)
--color-brand-default              (default variant)
--color-on-brand                   (text on default)
--color-error-default              (destructive)
--color-success-default            (success)
--color-warning-default            (warning)
--color-border-default             (outline)
--radius-full                      (pill shape)
--space-xs, --space-sm
--font-size-xs                     (typically 11-12px)
--font-weight-medium               (500)
--motion-fast                      (hover transition if interactive)
```

## Accessibility

- **Standalone**: `<span>` with brand styling; text reads as part of context. No special role.
- **Indicator**:
  - **Dot variant**: visual only; meaning conveyed via parent (`aria-label="3 unread notifications"` on the parent button).
  - **Count variant**: include the number in `aria-label` of the wrapper; or place a hidden `<span class="sr-only">{count} new</span>` adjacent.
- Don't rely on color alone for status (online vs busy = green vs red). Add `aria-label` describing state.
- Touch targets: badges with click handlers need ≥ 24×24 (small badges hard to tap; consider expanding hit area).

## Edge cases

- **Count 0 + showZero false**: hide badge; render only children.
- **Count > max**: render `99+` (or `${max}+`).
- **Very long text** (Standalone): truncate with ellipsis at max-width; don't wrap to two lines.
- **Indicator on small parent** (24px icon): badge may overflow; place outside parent's bounding box (positioning offset).
- **RTL**: flip `top-right` / `top-left` mappings.
- **Dark mode**: tokens cascade; verify outline variant has visible border.

## Code example

```tsx
function NotificationBell({ count }: { count: number }) {
  return (
    <IndicatorBadge count={count} max={99}>
      <button aria-label={`${count} unread notifications`} className="icon-button">
        <BellIcon />
      </button>
    </IndicatorBadge>
  );
}

function ProductCard({ name, isNew, isOnSale }: Props) {
  return (
    <article>
      <h3>{name}</h3>
      {isNew && <Badge variant="default">New</Badge>}
      {isOnSale && <Badge variant="destructive">Sale</Badge>}
    </article>
  );
}
```

## Don't

- Don't use Badge as a primary CTA. It looks like a button but isn't.
- Don't pile up 5+ badges next to a single item — visual noise.
- Don't make badges so small the text is unreadable (< 10px).
- Don't use color-only status (online/busy as just green/red without label).
- Don't animate badge appearance (count 1 → 2 with spring) on every render — distracting; use only for meaningful state changes.

## References

- Ant: [`Badge`](../docs/reference/ant-design.md#badge)
- MUI: [`Badge`](../docs/reference/mui.md#badge)
- shadcn-ui: [`badge`](../docs/reference/shadcn-ui.md#badge)

## Cross-reference

- [`examples/component-avatar.md`](component-avatar.md) — common Indicator parent
- [`examples/component-tag-badge.md`](component-tag-badge.md) — closely related (filterable tags)
- [`examples/component-alert.md`](component-alert.md) — for full alerts vs small badges
