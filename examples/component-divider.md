# `Divider` (Separator) — spec

> Citing Ant Design `Divider`, MUI `Divider`, shadcn-ui `separator`

## Purpose

A visual line that separates content. Smaller than headings or whitespace gaps; lighter weight than borders.

Use sparingly. **Whitespace is usually a better separator than a line.** A divider says "these are related but distinct"; whitespace says "these are unrelated, period."

## When to use

- Inside a card or list to separate items of similar visual weight.
- Between sections in a settings page (with section heading above).
- Between toolbar items.
- Inside menus to group related actions.

## When NOT to use

- Between paragraphs in body content (use whitespace + paragraph spacing).
- Around a card or section that already has a border or background contrast.
- As decoration. Dividers should mean something.

## Anatomy

```
Horizontal:                            Vertical:
─────────────────────────              │
                                       │
With label:                            With margin in toolbar:
──── Section title ────                Item 1  │  Item 2  │  Item 3
```

## API

```tsx
<Divider />                              {/* default: horizontal hairline */}
<Divider orientation="vertical" />
<Divider>Section</Divider>               {/* with label */}
<Divider variant="dashed" />
<Divider spacing="lg" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | |
| `variant` | `"solid" \| "dashed" \| "dotted"` | `"solid"` | Line style |
| `children` | `ReactNode` | — | Optional label inline (horizontal only) |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Position of label along the line |
| `spacing` | `"sm" \| "md" \| "lg"` | `"md"` | Vertical/horizontal margin around the divider |
| `inset` | `number \| string` | `0` | Indent from the start (e.g., to skip an icon column in a list) |
| `decorative` | `boolean` | `true` | If true, `aria-hidden`. If false, `role="separator"`. |

## Spacing guidance

| Spacing | Margin |
| --- | --- |
| `sm` | 8px above + below |
| `md` (default) | 16px above + below |
| `lg` | 24px above + below |

For dividers between items in a tight list (transactions, chats): use a 1px bottom border on each row instead of a separate divider element. It's the same visual but cleaner DOM.

## Inset

For a list with leading icons / avatars:

```
[icon]  Name 1
─────── (inset 48px to skip the 40px icon + 8px gap)
[icon]  Name 2
```

The inset divider doesn't extend over the icon column — visually unifies the icons.

## States

A divider doesn't have states. Static.

## Tokens consumed

```
--color-divider             (preferred — usually lighter than border)
OR
--color-border-default      (when divider should match other borders)
```

For dark mode: same token; the value is recomputed in dark.

The divider color is typically:
- 1 step lighter than `--color-border-default`
- Often `rgba(0, 0, 0, 0.06)` or `rgba(255, 255, 255, 0.08)` depending on mode

## Sizes / thickness

| Thickness | Use |
| --- | --- |
| 1px (default) | Universal |
| 2px | Heavier section breaks |
| 0.5px (Retina-only) | Very subtle (Apple-style); pairs with `.5px` `transform: scaleY(0.5)` hack on non-Retina |

For most product UIs: 1px. Going thicker without intent reads as a heavy mistake.

## Accessibility

- **Decorative dividers** (the default): `aria-hidden="true"` so screen readers skip.
- **Semantic dividers** (rare — when the line genuinely separates regions of meaning): `role="separator"` with `aria-orientation`. Use `<hr>` for full-width semantic horizontal dividers.

```html
<!-- Decorative (default) -->
<div className="divider" aria-hidden="true"></div>

<!-- Semantic -->
<hr role="separator" aria-orientation="horizontal" />
<div role="separator" aria-orientation="vertical"></div>
```

Most dividers in product UIs should be `aria-hidden`. The structure is conveyed by surrounding semantic elements (headings, regions).

## Code examples

```tsx
// Between sections in a settings page
<SettingsSection title="알림">
  ...
</SettingsSection>
<Divider spacing="lg" />
<SettingsSection title="결제">
  ...
</SettingsSection>

// With label
<Divider>또는</Divider>      {/* "Or" between social login and email login */}
<Button>이메일로 가입</Button>

// Vertical in a toolbar
<Toolbar>
  <Button>저장</Button>
  <Divider orientation="vertical" />
  <Button>되돌리기</Button>
  <Divider orientation="vertical" />
  <Button>다음 단계</Button>
</Toolbar>

// Inset in a list with avatars
<List>
  {users.map(u => (
    <ListItem key={u.id}>
      <Avatar src={u.photoUrl} />
      <span>{u.name}</span>
    </ListItem>
  ))}
</List>
{/* Each ListItem has its own bottom border with inset 48px — preferred over <Divider /> elements */}
```

## Edge cases

- **Divider at the end of a list**: don't render. The last item's bottom is the natural end.
- **Divider immediately after a heading**: redundant. The heading's bottom margin is the divider.
- **Vertical divider that needs to match the parent's height**: stretch with `align-self: stretch` in flex parent.
- **Dashed/dotted on small spans**: doesn't render cleanly under 8px; use solid for short dividers.

## Don't

- Don't put a divider inside another divider (e.g., divider above and below the same divider).
- Don't use heavy dividers (4px+) — they read as accidental.
- Don't color a divider the same as text. Subtle is the point.
- Don't use a divider where a heading would be clearer.
- Don't use vertical dividers for vertical lists. Use horizontal.
- Don't combine inset divider with full-width divider in the same list — pick one.

## References

- Ant Design: [`refs/ant-design/components/divider/`](../refs/ant-design/components/divider/) — `Divider` with `type="horizontal" | "vertical"`, `dashed`, optional inline text. Mature.
- MUI: [`refs/mui/packages/mui-material/src/Divider/`](../refs/mui/packages/mui-material/src/Divider/) — `Divider` with `orientation`, `variant="fullWidth" | "inset" | "middle"`, `textAlign`. Most variants.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/separator.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/separator.tsx) — Radix Separator. Minimal primitive. `decorative` prop drives `aria-hidden` vs `role="separator"`.

## Cross-reference

- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md) — when whitespace is the better separator
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md) — list-row dividers via per-item border
