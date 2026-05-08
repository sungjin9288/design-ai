# `Separator` — spec

> Synthesized from shadcn-ui `separator` (Radix) and the HTML5 `<hr>` element. A thin visual divider — horizontal or vertical — separating content. Distinct from `Divider` (an alias in some libraries) and from layout gaps (which use spacing tokens).

## Separator vs spacing

| | Separator | Spacing gap |
| --- | --- | --- |
| Visible | Yes (line) | No (whitespace) |
| Use | Strong section break | Visual breathing room |
| Semantics | "Topic boundary" | "Layout pad" |

For mild visual rhythm: use spacing. For explicit topic / section change: use Separator.

## Anatomy

```
Top section content

────────────────────────       ← horizontal Separator

Bottom section content
```

```
[ left ]  │  [ right ]         ← vertical Separator
```

## API

```tsx
<Separator />                              {/* horizontal default */}
<Separator orientation="horizontal" />     {/* explicit */}
<Separator orientation="vertical" />       {/* vertical */}

<Separator decorative={false} />           {/* semantic — actual <hr> equivalent */}
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Direction |
| `decorative` | `boolean` | `true` | If true: pure visual (`role="none"`); if false: semantic (`role="separator"`) |
| `as` | `keyof JSX.IntrinsicElements` | `"div"` | Element type |
| `className` | `string` | — | Style override |

## Decorative vs semantic

- **`decorative={true}` (default)**: line is purely visual. Doesn't show up in the accessibility tree.
- **`decorative={false}`**: line is meaningful structurally — represents a content boundary. Announced to screen readers.

Most separators are decorative. Use `decorative={false}` only for genuine content breaks (between articles, between menu groups conceptually).

For semantic horizontal separators: prefer the native `<hr>`.

## Variants

### Solid (default)

```css
.separator {
  background: var(--color-border-default);
  shrink: 0;
}
.separator[data-orientation="horizontal"] {
  height: 1px;
  width: 100%;
}
.separator[data-orientation="vertical"] {
  width: 1px;
  height: 100%;
}
```

### Dashed / dotted (variant via class)

```css
.separator[data-variant="dashed"] {
  background: none;
  border-top: 1px dashed var(--color-border-default);
  height: 0;
}
```

### With label (centered text)

```
─────  Section title  ─────
```

```tsx
<div className="separator-with-label">
  <Separator />
  <span>Section title</span>
  <Separator />
</div>
```

## States

Stateless. Separator is presentational.

## Tokens consumed

```
--color-border-default             (line color)
--color-border-strong              (high-contrast variant)
--space-xxs                        (1px standard)
```

For Korean print contexts (receipt-style dotted dividers): `border-style: dotted` with brand color is a Toss / banking visual convention.

## Accessibility

- Default decorative: `role="none"`. Screen reader skips.
- Semantic: `role="separator"` (with `aria-orientation` if vertical).
- Native `<hr>` is the simplest semantic separator (defaults to horizontal).
- For visual-only "decorations" between elements: keep decorative.

## Code examples

### List sections

```tsx
<List>
  <ListSection>...</ListSection>
  <Separator />
  <ListSection>...</ListSection>
</List>
```

### Vertical between flexbox items

```tsx
<div className="flex items-center gap-4">
  <Avatar />
  <Separator orientation="vertical" className="h-8" />
  <UserName />
  <Separator orientation="vertical" className="h-8" />
  <Status />
</div>
```

### With centered label

```tsx
<div className="flex items-center gap-4">
  <Separator className="flex-1" />
  <span className="text-muted">또는</span>
  <Separator className="flex-1" />
</div>
```

## Edge cases

- **Vertical inside flex without explicit height**: collapses to 0px. Always set height for vertical.
- **Inside grid**: behaves as a child cell; may need `grid-column: 1 / -1` for full-width horizontal.
- **Dark mode**: tokens cascade; ensure visible against dark bg.
- **Print**: native `<hr>` prints; CSS `background` may not. Use `border-top` for print fidelity.
- **RTL**: orientation unaffected; horizontal separators flip nothing.

## Don't

- Don't use Separator where a heading + spacing would be clearer.
- Don't pile up 5 separators in close proximity — visual noise.
- Don't make separator too dark / heavy. Subtle (~20% opacity grayscale) is the convention.
- Don't use Separator for rough layout work — use Grid / Flex with gap.

## References

- HTML5 `<hr>` element
- shadcn-ui: [`separator`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/separator.tsx) (Radix)
- Ant Design `Divider` is the equivalent name there

## Cross-reference

- [`examples/component-divider.md`](component-divider.md) — Ant-style alias
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
