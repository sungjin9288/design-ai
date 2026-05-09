# `Space` — spec

> Synthesized from Ant Design `Space`. A tiny utility that adds consistent gap between children. Sibling to `Stack` (MUI) and `Flex` (Ant) — `Space` is the simplest of the three.

## Space vs Flex vs Stack

| | Space | Flex | Stack |
| --- | --- | --- | --- |
| Default direction | horizontal | horizontal | vertical |
| Gap by default | yes | no (must specify) | yes |
| Wrap | optional | optional | rare |
| Use | Inline gap between elements | Full flex layout | Vertical stack |

For "I just want a gap between these inline things": `Space`.
For "I'm doing real flex layout": `Flex`.
For "vertical stack with consistent gap": `Stack`.

## API

```tsx
<Space>
  <Button>Save</Button>
  <Button>Cancel</Button>
</Space>

<Space size="large">
  <Tag>React</Tag>
  <Tag>TypeScript</Tag>
  <Tag>Vite</Tag>
</Space>

<Space direction="vertical" size="middle">
  <Heading>Title</Heading>
  <Text>Body</Text>
</Space>

<Space wrap>
  {tags.map(t => <Tag key={t}>{t}</Tag>)}
</Space>

<Space split={<Divider type="vertical" />}>
  <Link>Edit</Link>
  <Link>Duplicate</Link>
  <Link>Delete</Link>
</Space>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout direction |
| `size` | `"small" \| "middle" \| "large" \| number` | `"small"` | Gap |
| `align` | `"start" \| "end" \| "center" \| "baseline"` | depends | align-items |
| `wrap` | `boolean` | `false` | Allow wrapping |
| `split` | `ReactNode` | — | Element rendered between children (e.g., divider, dot) |

## Common patterns

### Inline action group

```tsx
<Space>
  <Button>Save</Button>
  <Button variant="ghost">Cancel</Button>
</Space>
```

### Tag list (wrapping)

```tsx
<Space wrap size="small">
  {tags.map(t => <Tag key={t}>{t}</Tag>)}
</Space>
```

### Toolbar with dividers

```tsx
<Space split={<span>·</span>} size="small">
  <Link>Edit</Link>
  <Link>Duplicate</Link>
  <Link>Delete</Link>
</Space>
```

### Vertical stack (alternative to Stack)

```tsx
<Space direction="vertical" size="large">
  <Heading>...</Heading>
  <Text>...</Text>
  <Button>...</Button>
</Space>
```

## Tokens consumed

```
--space-xs                         (small)
--space-sm                         (middle)
--space-md                         (large)
```

## Implementation note

Modern CSS makes Space largely unnecessary — `display: flex; gap: var(--space-sm)` handles it. But Space is convenient when:
- You don't want to author flex CSS for one-offs.
- You want the `split` element-between-children behavior (CSS doesn't have this natively without complex rules).
- Your team standardizes on Space as the inline-gap primitive.

## Don't

- Don't use Space when CSS `gap` alone suffices.
- Don't nest Space deeply — that's a Flex / Grid / Stack situation.
- Don't use Space for full-width layouts. It's for inline element grouping.

## References

- Ant: [`Space`](../refs/ant-design/components/space)
- CSS Flex / Grid `gap` property

## Cross-reference

- [`examples/component-flex.md`](component-flex.md) — full flex layout
- [`examples/component-grid.md`](component-grid.md) — 2D layout
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
