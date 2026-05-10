# `TabScrollButton` — spec (DRAFT — scaffolded 2026-05-11 via TS-AST)

> **Draft scaffold** generated from upstream sources via the TypeScript
> Compiler API. The **API table below is parsed directly from the source's
> typed declarations** — props / types / defaults / `@deprecated` markers
> are accurate and trustworthy.
>
> The **narrative sections** (when to use, anatomy, tokens, accessibility,
> edge cases, code example) are placeholders. A maintainer should fill
> them in based on actual usage and remove this banner before declaring
> the spec polished.
>
> Sources analyzed:
> - **mui**: `refs/mui/packages/mui-material/src/TabScrollButton/TabScrollButton.d.ts` (4 interface(s), 1 component(s))

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
<TabScrollButton>
  {children}
</TabScrollButton>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `direction` | `'left' \| 'right'` | — | ✓ | mui | The direction the button should indicate. |
| `orientation` | `'horizontal' \| 'vertical'` | — | ✓ | mui | The component orientation (layout flow direction). |
| `children` | `React.ReactNode` | — | — | mui | The content of the component. |
| `classes` | `Partial<TabScrollButtonClasses> \| undefined` | — | — | mui | Override or extend the styles applied to the component. |
| `disabled` | `boolean \| undefined` | `false` | — | mui | If `true`, the component is disabled. |
| `slotProps` | `\| { startScrollButtonIcon?: \| SlotComponentProps< ` | `{}` | — | mui | The extra props for the slot components.
You can override the existing props or add new ones. |
| `slots` | `\| { StartScrollButtonIcon?: React.ElementType \| un` | `{}` | — | mui | The components used for each slot inside. |
| `sx` | `SxProps<Theme> \| undefined` | — | — | mui | The system prop that allows defining system overrides as well as additional CSS styles. |

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

- Mui: [`TabScrollButton.d.ts`](../refs/mui/packages/mui-material/src/TabScrollButton/TabScrollButton.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
