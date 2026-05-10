# `InputNumber` — spec (DRAFT — scaffolded 2026-05-10 via TS-AST)

> **Draft scaffold** generated from upstream sources via TypeScript AST.
> A maintainer should review the narrative sections (when to use, anatomy,
> edge cases), verify the API table (especially defaults and event
> handlers), fill in tokens consumed, and remove this banner before
> shipping.
>
> Sources analyzed:
> - **ant-design**: `refs/ant-design/components/input-number/index.tsx` (7 interface(s), 2 component(s))

## When to use

(Fill in: what user need does this serve? What's the canonical use case?
When to use vs sibling components?)

## Anatomy

(Fill in: ASCII diagram of the component's parts.)

```
[diagram here]
```

## API

```tsx
<InputNumber>
  {children}
</InputNumber>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `addonAfter` | `React.ReactNode` | — | — | ant-design | **[deprecated]** (fill in) |
| `addonBefore` | `React.ReactNode` | — | — | ant-design | **[deprecated]** (fill in) |
| `bordered` | `boolean` | — | — | ant-design | **[deprecated]** (fill in) |
| `classNames` | `InputNumberClassNamesType` | — | — | ant-design | (fill in) |
| `controls` | `\| boolean \| { upIcon?: React.ReactNode; downIcon?:` | — | — | ant-design | (fill in) |
| `disabled` | `boolean` | — | — | ant-design | (fill in) |
| `prefix` | `React.ReactNode` | — | — | ant-design | (fill in) |
| `prefixCls` | `string` | — | — | ant-design | (fill in) |
| `rootClassName` | `string` | — | — | ant-design | (fill in) |
| `size` | `SizeType` | — | — | ant-design | (fill in) |
| `status` | `InputStatus` | — | — | ant-design | (fill in) |
| `styles` | `InputNumberStylesType` | — | — | ant-design | (fill in) |
| `suffix` | `React.ReactNode` | — | — | ant-design | (fill in) |
| `variant` | `Variant` | `"outlined"` | — | ant-design | (fill in) |

### Deprecated props

- `addonAfter` (ant-design) — review: rename, drop, or keep with a different surface?
- `addonBefore` (ant-design) — review: rename, drop, or keep with a different surface?
- `bordered` (ant-design) — review: rename, drop, or keep with a different surface?

## Variants

(Fill in: visual variants — size / color / shape / etc.)

## States

| State | Visual |
| --- | --- |
| Default | (fill in) |
| Hover | (fill in) |
| Focus-visible | 2px focus ring; cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) |
| Active | (fill in) |
| Disabled | reduced opacity; `aria-disabled="true"` |

## Tokens consumed

(Fill in. List every token this component reads. Flag missing tokens.)

```
--color-bg-default
--color-fg-default
--space-md
--radius-md
```

## Accessibility

- Semantic element: (fill in)
- ARIA: (fill in)
- Keyboard: (fill in — cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md))
- Touch target: ≥ 44pt for primary mobile / ≥ 24px for desktop AA

## Edge cases

(Fill in 3+ edge cases.)

## Code example

```tsx
// Fill in a concrete usage example
```

## Don't

- (Fill in 2-3 specific misuses.)

## References

- Ant-Design: [`index.tsx`](../refs/ant-design/components/input-number/index.tsx)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
