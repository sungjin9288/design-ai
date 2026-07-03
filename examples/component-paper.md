# `Paper` — spec

> Synthesized from MUI `Paper`. The most primitive surface in Material Design — a backgrounded, shadowed container that other components extend (Card, Modal, Drawer all use Paper underneath in MUI). Provides consistent elevation + theming.

## When to use

- **As a base surface** for custom components (build a Card, a Toolbar, a panel from Paper).
- **Standalone surfaces** that need elevation but don't fit Card / Modal patterns (e.g., a sticky toolbar, a tooltip-like floating panel).

When NOT to use:
- Use `Card` for content cards — Card adds composition slots.
- Use `Modal` for overlay dialogs.
- Use `Sheet` for side-anchored panels.
- Use plain `<div>` for non-elevated containers.

## Anatomy

Paper is just a surface — a styled `<div>` with elevation:

```
┌─ Paper ─────────────┐
│                     │
│   (children)        │
│                     │
└─────────────────────┘
   ↑ shadow lifts off the page
```

## API

```tsx
<Paper elevation={2}>
  <h2>Card title</h2>
  <p>Card content...</p>
</Paper>

<Paper variant="outlined">
  Bordered surface (no shadow)
</Paper>

<Paper elevation={4} square>
  No corner radius
</Paper>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `elevation` | `0 \| 1 \| 2 \| 3 \| 4 \| 6 \| 8 \| 12 \| 16 \| 24` | `1` | Material shadow depth |
| `variant` | `"elevation" \| "outlined"` | `"elevation"` | Shadow vs border |
| `square` | `boolean` | `false` | Disable border-radius |
| `as` | Component | `"div"` | Render as different element |

## Variants

### `elevation` (default)

Box-shadow conveys depth. Higher elevation = larger / softer shadow.

| Elevation | Use |
| --- | --- |
| `0` | No shadow (visually = plain div) |
| `1` (default) | Resting card |
| `2-3` | Subtle hover lift |
| `4-6` | Floating elements (tooltips, snackbars) |
| `8-12` | Drawers, navigation rails |
| `16-24` | Modals, dialogs |

Material 3 reduces this to a 6-level scale (0 / 1 / 2 / 3 / 4 / 5). For new design systems: prefer 4-5 levels max.

### `outlined`

Border instead of shadow. Used in flat designs / dark themes where shadows feel out of place.

```css
[data-variant="outlined"] {
  background: var(--color-bg-default);
  border: 1px solid var(--color-border-default);
  box-shadow: none;
}
```

## States

Stateless. Paper is purely visual surface.

For interactive elevation (lift on hover): apply via CSS, not via the `elevation` prop alone:

```css
.interactive-paper {
  transition: box-shadow var(--motion-fast) var(--ease-out);
}
.interactive-paper:hover {
  box-shadow: var(--shadow-elevation-3);
}
```

## Tokens consumed

```
--paper-bg                         (surface background)
--paper-border                     (outlined variant)
--shadow-elevation-0               (no shadow)
--shadow-elevation-1               (resting)
--shadow-elevation-2
--shadow-elevation-3
--shadow-elevation-4
--shadow-elevation-6
--shadow-elevation-8
--shadow-elevation-12
--shadow-elevation-16
--shadow-elevation-24
--radius-md                        (default corner)
--motion-fast                      (transition for interactive)
```

For dark mode: shadows on dark are subtle. Compensate with subtle background lightening at higher elevation (Material 3 approach).

```css
[data-theme="dark"] [data-elevation="1"] { background: var(--paper-bg-1); }
[data-theme="dark"] [data-elevation="2"] { background: var(--paper-bg-2); }
[data-theme="dark"] [data-elevation="3"] { background: var(--paper-bg-3); }
```

Each higher elevation = slightly lighter bg (+5% lightness per level).

## Accessibility

- Paper is presentational. No role.
- For surfaces holding interactive content: ensure children have proper roles.
- Don't put `tabindex` on Paper itself unless it's specifically a focusable surface (rare).

## Code example

### Custom Card built on Paper

```tsx
function StatCard({ label, value, change }: Props) {
  return (
    <Paper elevation={1} className="stat-card">
      <p className="label">{label}</p>
      <p className="value">{value}</p>
      <p className={cn("change", change > 0 ? "positive" : "negative")}>
        {change > 0 ? "+" : ""}{change}%
      </p>
    </Paper>
  );
}
```

### Sticky toolbar

```tsx
function EditorToolbar() {
  return (
    <Paper elevation={4} className="sticky top-0">
      <ToolbarActions />
    </Paper>
  );
}
```

### Outlined panel for low-key surfaces

```tsx
<Paper variant="outlined">
  <h3>Tips</h3>
  <ul>
    <li>Tip 1</li>
    <li>Tip 2</li>
  </ul>
</Paper>
```

## Edge cases

- **Paper inside Paper**: avoid; nested elevation gets confusing. Use composition (header + content) within a single Paper.
- **Paper on patterned background**: shadows may not show; switch to outlined variant.
- **Print**: shadows don't print; elevation invisible. Outlined variant prints correctly.
- **Reduced motion**: skip elevation transition on hover.
- **RTL**: no impact (shadows are symmetric).

## Don't

- Don't use Paper for everything — overuse dilutes the elevation system.
- Don't combine elevation + outlined; pick one.
- Don't ship custom shadows that don't match the elevation scale.
- Don't put interactive content directly inside Paper without proper button / link semantics.
- Don't rely on Paper for layout (use Grid / Flex). Paper is a surface, not a layout primitive.

## References

- MUI: [`Paper`](../docs/reference/mui.md#paper)
- Material Design: [Elevation](https://m3.material.io/styles/elevation/overview)

## Cross-reference

- [`examples/component-card.md`](component-card.md) — Paper + composition slots
- [`examples/component-modal.md`](component-modal.md) — modal surface (uses Paper at elevation 24)
- [`knowledge/design-tokens/material-3.md`](../knowledge/design-tokens/material-3.md) — elevation scale
