# `<Component>` — spec

> Status: <draft / accepted / shipped> · Owner: <name> · Last updated: <date>

## Purpose

<2 sentences. The user need this serves and the canonical context.>

## Anatomy

```
<Component>
├── <Part1>
├── <Part2>
└── <Part3>
```

| Part | Purpose | Required | Default if omitted |
| --- | --- | --- | --- |
| `<Part1>` | ... | yes | — |

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled value. |
| `onChange` | `(value: string) => void` | — | Fires on change. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `disabled` | `boolean` | `false` | |

## States

| State | Trigger | Visual |
| --- | --- | --- |
| Default | resting | base |
| Hover | mouse-over | bg lighten 4% |
| Focus-visible | keyboard tab | 2px ring `--color-focus-ring`, offset 2px |
| Active | press | bg darken 6% |
| Disabled | `disabled` | opacity 0.5, no pointer-events |
| Loading | `loading` | content swapped for spinner |

## Variants

### Size
| Size | Height | Font | Padding |
| --- | --- | --- | --- |
| `sm` | 28px | 13px | 8px 12px |
| `md` | 32px | 14px | 8px 16px |
| `lg` | 40px | 16px | 12px 20px |

### Color (or "intent")
| Value | Use | Background | Text |
| --- | --- | --- | --- |
| `primary` | primary CTA | `--color-primary-default` | `--color-on-primary` |
| `secondary` | non-primary action | `--color-bg-elevated` | `--color-text-primary` |
| `ghost` | low-emphasis action | transparent | `--color-text-primary` |
| `danger` | destructive | `--color-error` | `white` |

## Tokens consumed

```
--color-primary-default
--color-primary-hover
--color-on-primary
--space-md
--radius-md
--transition-default
--color-focus-ring
```

## Accessibility

- **Semantic element**: `<button type="button">`. Never `<div onClick>`.
- **ARIA**:
  - `aria-label` if no visible text.
  - `aria-disabled="true"` when `disabled` (in addition to native `disabled`).
  - `aria-busy="true"` when `loading`.
- **Keyboard**: `Enter` and `Space` activate. `Tab` reaches.
- **Touch**: minimum 44×44 hit area on mobile (use padding to extend if visual size is smaller).
- **Focus**: 2px ring with 3:1 contrast against both element and adjacent background.

## Code example

```tsx
<Button
  size="md"
  intent="primary"
  onClick={handleSubmit}
  disabled={isPending}
  loading={isPending}
>
  Save changes
</Button>
```

## Edge cases

- **Long text**: truncates with `…` if exceeds container; full text in `title` attribute.
- **Empty state**: `<Component>` with no children renders nothing (does not crash, does not reserve space).
- **RTL**: icon swap, padding mirror.
- **Reduced motion**: omit fade transitions, keep instant state changes.
- **Print**: hidden by default (`@media print { display: none; }`) unless explicitly requested.

## Don't

- Don't pass icons as `children` AND as `icon` prop.
- Don't use `intent="primary"` for more than one button per surface.
- Don't use `loading` and `disabled` simultaneously — pick one.

## References

- Ant Design: <link to refs/ant-design/components/...>
- MUI: <link to refs/mui/...>
- shadcn-ui: <link to refs/shadcn-ui/...>
- Knowledge: [a11y/keyboard-and-focus.md](../../knowledge/a11y/keyboard-and-focus.md), [components/INDEX.md](../../knowledge/components/INDEX.md)
