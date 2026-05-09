# `Grid` — spec

> Synthesized from Ant Design `Grid` (Row + Col) and MUI `Grid` (v2). Two-dimensional layout primitive — rows + columns with gap. Use for responsive multi-column layouts.

## When to use

- Multi-column layouts (3-up feature grids, 2-col forms, dashboards).
- Responsive layouts that change column count by breakpoint.
- Anywhere CSS Grid is the right tool and you want a system primitive.

When NOT to use:
- Single direction (row OR column with consistent gap) — use `Flex` / `Stack`.
- Pinterest-style varying heights — use `Masonry`.
- Tabular data — use `Table`.

## API — Ant style (Row + Col)

```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={8}>
    <Card>Item 1</Card>
  </Col>
  <Col xs={24} sm={12} lg={8}>
    <Card>Item 2</Card>
  </Col>
  <Col xs={24} sm={12} lg={8}>
    <Card>Item 3</Card>
  </Col>
</Row>
```

24-column grid (Ant's default). Each `<Col>` specifies span per breakpoint.

## API — MUI v2 style

```tsx
<Grid container spacing={2}>
  <Grid xs={12} sm={6} lg={4}>
    <Card>Item 1</Card>
  </Grid>
  <Grid xs={12} sm={6} lg={4}>
    <Card>Item 2</Card>
  </Grid>
  <Grid xs={12} sm={6} lg={4}>
    <Card>Item 3</Card>
  </Grid>
</Grid>
```

12-column grid. Same idea.

## API — modern CSS Grid wrapper

```tsx
<Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

Simpler if your design system doesn't need fractional column spans (most don't).

## States

Stateless.

## Tokens consumed

```
--breakpoint-mobile / -tablet / -desktop / -wide
--space-{0..n}                     (gap)
--grid-columns                     (system grid count: 12 or 24)
```

## Common layouts

### 3-up cards, responsive

```tsx
<Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={6}>
  {features.map(f => <FeatureCard key={f.id} {...f} />)}
</Grid>
```

### Sidebar + content (asymmetric)

```tsx
<Grid columns="240px 1fr" gap={4}>
  <aside>Sidebar</aside>
  <main>Content</main>
</Grid>
```

(Pass through to CSS `grid-template-columns` for non-system-grid cases.)

### Form (2-column)

```tsx
<Grid columns={{ mobile: 1, tablet: 2 }} gap={4}>
  <Field>
    <Label>First name</Label>
    <Input />
  </Field>
  <Field>
    <Label>Last name</Label>
    <Input />
  </Field>
  <Field span={2}>  {/* full-width on tablet+ */}
    <Label>Address</Label>
    <Input />
  </Field>
</Grid>
```

## Accessibility

- Grid is presentational. Source order = reading order; ensure DOM matches the intended reading order.
- Don't use CSS Grid `grid-row` / `grid-column` to visually re-order if it breaks reading. Screen readers read DOM.
- For responsive collapses: ensure mobile single-column doesn't break content priority.

## Don't

- Don't use Grid for single-row toolbars. Use Flex.
- Don't reorder content via `order` / `grid-area` such that DOM != reading order.
- Don't nest Grids 4+ levels — refactor to a single grid or use components.
- Don't hard-code pixel widths in Grid spans. Use the column system OR fractions.

## References

- Ant: [`Grid`](../refs/ant-design/components/grid) (Row + Col, 24-col)
- MUI: [`Grid`](../refs/mui/packages/mui-material/src/Grid) (12-col)
- CSS Grid Level 1 / 2

## Cross-reference

- [`examples/component-flex.md`](component-flex.md) — single-direction
- [`examples/component-masonry.md`](component-masonry.md) — varied-height
- [`examples/component-feature-grid.md`](component-feature-grid.md) — opinionated 3-up wrapper
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
