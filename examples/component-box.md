# `Box` — spec

> Synthesized from MUI `Box`. The most generic layout primitive — a styled `<div>` with theme-prop access. Lower-level than `Card`, `Paper`, or `Stack`.

## When to use

- As a generic styled container with token access.
- For one-off custom layouts that don't fit other primitives.
- As a system-prop sandbox (padding, margin, color, display) when you don't want to author CSS.

When NOT to use:
- For semantic containers (use `<section>`, `<article>`, `<aside>`).
- For interactive surfaces (use `Button`, `Card`).
- When a more specific primitive exists (`Stack`, `Grid`, `Paper`).

## API

```tsx
<Box p={4} bg="surface" rounded="md">
  Content
</Box>

<Box as="section" display="flex" gap={2}>
  <Box>A</Box>
  <Box>B</Box>
</Box>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `keyof JSX.IntrinsicElements` | `"div"` | Render element |
| `p` / `px` / `py` / `pt` / `pr` / `pb` / `pl` | spacing-token | — | Padding shorthand |
| `m` / `mx` / `my` / `mt` / `mr` / `mb` / `ml` | spacing-token | — | Margin shorthand |
| `bg` | color-token | — | Background color |
| `color` | color-token | — | Text color |
| `display` | CSS display | — | Display mode |
| `gap` | spacing-token | — | Gap (when display=flex/grid) |
| `rounded` | radius-token | — | Border radius |
| `border` | `boolean \| number` | — | Border |
| `shadow` | shadow-token | — | Box shadow |
| `width` / `height` / `minWidth` / `maxWidth` | CSS length | — | Sizing |

## States

Stateless. Box is a layout primitive.

## Tokens consumed

```
--space-{0..n}                     (p, m, gap)
--color-{semantic}                 (bg, color)
--radius-{sm,md,lg}                (rounded)
--shadow-{sm,md,lg}                (shadow)
--border-default                   (border)
```

## Variants vs other primitives

```
Box       → most generic; just a styled <div>
Stack     → flex wrapper with auto direction + gap
Grid      → grid wrapper
Flex      → flex wrapper
Paper     → elevated surface
Card      → composition slots (Header / Body / Footer)
```

Use Box when none of the above fit. If you find yourself using Box with `display="flex" direction="column" gap={2}`, you actually want `Stack`.

## Accessibility

- Box is presentational by default. Use `as` to render semantic elements when appropriate.
- For accessible regions: `as="section" aria-label="..."`.
- For decorative dividers: prefer `Separator` over Box with `borderTop`.

## Code example

```tsx
{/* Decorative brand-color callout */}
<Box bg="brand-50" p={4} rounded="md" border>
  <Text fontWeight={600}>이벤트 진행 중</Text>
  <Text>가입 시 30% 할인.</Text>
</Box>

{/* Custom flex layout */}
<Box display="flex" gap={2} alignItems="center">
  <Avatar />
  <Box flex={1}>
    <Text>이름</Text>
    <Text fontSize="sm" color="muted">설명</Text>
  </Box>
</Box>
```

## Don't

- Don't use Box where a semantic element is appropriate. Use `as` or pick a different primitive.
- Don't use Box for interactive surfaces. Use Button / Link.
- Don't recreate layouts that other primitives handle. `<Box display="flex" direction="column">` = `<Stack>`.
- Don't use raw hex / px values via the system props. Use tokens.

## References

- MUI: [`Box`](../refs/mui/packages/mui-material/src/Box) — system-prop pioneer
- Chakra UI Box (very similar API)
- shadcn-ui: doesn't ship Box; uses Tailwind classes directly

## Cross-reference

- [`examples/component-card.md`](component-card.md) — when Box gets too generic
- [`examples/component-paper.md`](component-paper.md) — elevated surface variant
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
