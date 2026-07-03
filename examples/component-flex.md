# `Flex` — spec

> Synthesized from Ant Design `Flex`. A `<div>` with `display: flex` and shorthand props for direction / gap / align / justify. Sibling to `Stack` (MUI) and `HStack`/`VStack` patterns.

## When to use

- Horizontal or vertical row of items with consistent gap.
- Header layouts (logo + nav + actions).
- Toolbar / button groups.

When NOT to use:
- Multi-row wrapping with column constraints — use `Grid`.
- Single-row with text wrapping — use raw CSS.

## API

```tsx
<Flex gap={2}>
  <Avatar />
  <Text>Name</Text>
</Flex>

<Flex direction="column" gap={4} align="start">
  <Heading>Title</Heading>
  <Text>Body</Text>
</Flex>

<Flex justify="space-between" align="center">
  <Logo />
  <Nav />
  <Actions />
</Flex>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `"row"` | Flex direction |
| `gap` | spacing-token | `0` | Gap between children |
| `align` | `"start" \| "center" \| "end" \| "stretch" \| "baseline"` | `"stretch"` | align-items |
| `justify` | `"start" \| "center" \| "end" \| "space-between" \| "space-around" \| "space-evenly"` | `"start"` | justify-content |
| `wrap` | `boolean` | `false` | Allow wrapping |
| `inline` | `boolean` | `false` | inline-flex instead of flex |
| `as` | element | `"div"` | Render element |

## Common patterns

### Toolbar (justify-between)

```tsx
<Flex justify="space-between" align="center">
  <Heading>Title</Heading>
  <Flex gap={2}>
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </Flex>
</Flex>
```

### Stack (column with gap)

```tsx
<Flex direction="column" gap={4}>
  <Card>...</Card>
  <Card>...</Card>
</Flex>
```

### Centered

```tsx
<Flex justify="center" align="center" minHeight="100vh">
  <Card>Centered</Card>
</Flex>
```

### Wrapping tag list

```tsx
<Flex wrap gap={1}>
  {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
</Flex>
```

## States

Stateless.

## Tokens consumed

```
--space-{0..n}                     (gap)
```

## Accessibility

- Flex is presentational. Use `as` for semantic elements (`as="nav"` for nav).
- For toolbars: wrap with `<div role="toolbar">` if interactive controls.
- Source order = reading order. Flex visual order can differ via `order` prop, but DOM order is what screen readers read. Avoid `order` for content layout.

## Don't

- Don't use Flex where Stack (MUI) or VStack/HStack (Chakra) is the team convention. Pick one primitive name and stick with it.
- Don't nest Flex 5+ levels deep. If layout is that complex, use Grid.
- Don't use Flex with `direction="column"` AND `gap={N}` for content reading flow when a semantic element exists. Use `<article>`, `<section>`, etc.

## References

- Ant: [`Flex`](../docs/reference/ant-design.md#flex)
- MUI: `Stack` (sibling primitive)
- Chakra UI: `HStack`, `VStack`, `Flex`

## Cross-reference

- [`examples/component-stack.md`](component-stack.md) — N/A (Stack rendered via similar primitive in some libs)
- [`examples/component-grid.md`](component-grid.md) — for 2D layout
- [`examples/component-box.md`](component-box.md) — generic styled wrapper
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
