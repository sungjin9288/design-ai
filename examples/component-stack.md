# `Stack` — spec

> Synthesized from MUI `Stack`. The flexbox-based linear layout primitive — children laid out in a row or column with consistent spacing. Most-used layout container after `Box`. The shadcn equivalent uses Tailwind utilities directly (`flex flex-col gap-4`) — Stack abstracts that for design-system enforcement.

## When to use

- Any group of elements that need consistent spacing (button rows, form rows, card stacks).
- Replacing `<div style={{ display: 'flex', gap: 16 }}>` boilerplate.
- For grid-style 2D layouts, use `Grid` instead.

## Anatomy

```
Direction = "row":
┌──────┬──[gap]──┬──────┬──[gap]──┬──────┐
│ <1/> │         │ <2/> │         │ <3/> │
└──────┴─────────┴──────┴─────────┴──────┘

Direction = "column":
┌──────┐
│ <1/> │
├─[gap]┤
│ <2/> │
├─[gap]┤
│ <3/> │
└──────┘
```

## API

```tsx
<Stack direction="row" gap={2} alignItems="center" justifyContent="flex-end">
  <Button onClick={onCancel}>취소</Button>
  <Button onClick={onSave} variant="contained">저장</Button>
</Stack>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'` | `'column'` | Flex axis |
| `spacing` / `gap` | `number \| string` | `0` | Gap between children (theme spacing units; `gap={2}` = 16px on 8-base) |
| `alignItems` | `'flex-start' \| 'center' \| 'flex-end' \| 'stretch' \| 'baseline'` | — | Cross-axis alignment |
| `justifyContent` | `'flex-start' \| 'center' \| 'flex-end' \| 'space-between' \| 'space-around'` | — | Main-axis alignment |
| `divider` | `ReactNode` | — | Element rendered between children (e.g., `<Divider />`) |
| `useFlexGap` | `boolean` | `true` (MUI v6+) | Use CSS `gap` instead of margins; safer with `divider` |
| `flexWrap` | `'nowrap' \| 'wrap'` | `'nowrap'` | Wrap children to next line |
| `sx` | `SxProps` | — | Style override (responsive values, custom CSS) |

### Responsive

```tsx
<Stack
  direction={{ xs: 'column', md: 'row' }}
  gap={{ xs: 1, md: 2 }}
>
  ...
</Stack>
```

## States

Layout primitive — no interactive states.

## Tokens consumed

```
--space-xs   /* gap={0.5} */
--space-sm   /* gap={1} */
--space-md   /* gap={2} */
--space-lg   /* gap={3} */
--space-xl   /* gap={4} */
```

## Accessibility

- `Stack` is a `<div>` (default). For semantic groupings, override via `component`:
  - List of nav items: `component="nav"` + ARIA label.
  - Toolbar: `component="div" role="toolbar"`.
- For RTL languages, `direction="row"` automatically reverses if the document is `dir="rtl"`. For Korean (LTR), no special handling needed.

## Edge cases

- **Mixed-width children with `space-between`** — Stack distributes remaining space; long children may shrink. Use `flex={1}` on the spreading child if needed.
- **Korean text in row direction** — Korean labels run wider than Latin equivalents; test row layouts at 320px viewport. Switch to `direction={{ xs: 'column', md: 'row' }}` if cramped.
- **Nested Stacks** — common and fine. `Stack` doesn't add semantic meaning, just layout.
- **`divider` with `useFlexGap=false`** — older MUI versions used margin-based spacing which collides with dividers. Set `useFlexGap` explicitly.

## Code example

```tsx
// Card footer with cancel + primary
<Card>
  <CardContent>...</CardContent>
  <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ p: 2 }}>
    <Button onClick={onCancel}>취소</Button>
    <Button onClick={onSave} variant="contained">저장</Button>
  </Stack>
</Card>

// Form row that stacks on mobile
<Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
  <TextField label="이름" />
  <TextField label="사번" />
  <TextField label="부서" />
</Stack>

// Vertical list of cards with dividers
<Stack gap={2} divider={<Divider flexItem />}>
  {items.map((it) => <Card key={it.id}>{it.title}</Card>)}
</Stack>
```

## Don't

- Don't reach for `Stack` for 2D grids — use `Grid`.
- Don't nest 4+ Stacks deep — extract to a custom layout component.
- Don't use `Stack direction="row"` for content that should wrap to multiple lines without explicit `flexWrap`.
- Don't apply `Stack` to a single child — pure overhead.

## References

- MUI: [`Stack`](../refs/mui/packages/mui-material/src/Stack/)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-box.md`](component-box.md)
- [`component-grid.md`](component-grid.md)
- [`component-flex.md`](component-flex.md) — alternate flex primitive
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
