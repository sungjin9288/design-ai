# `Cascader` — spec

> Citing Ant Design `Cascader`, MUI (no built-in — composition), shadcn-ui (no built-in)

## Purpose

Multi-level select. User picks a leaf value by drilling through hierarchical levels. Used for: address (state → city → district), category trees (electronics → phones → models), org structure.

## When Cascader vs alternatives

| Pattern | Use |
| --- | --- |
| **Cascader** | Hierarchical with 2–4 fixed levels; user picks ONE leaf |
| **Tree (with select)** | Variable depth, user might pick any node |
| **Cascader → drill-in screens** | Mobile, when each level needs more space |
| **Three Selects in a row** | When levels are independent (e.g., size, color, material — pick all three) |

## Anatomy

```
Trigger:                          Open (3-level cascade):
┌──────────────────────┐         ┌──────┬──────┬──────┐
│ 서울 / 강남구 / 역삼동  ▾│         │ 서울  │ 강남구│ 역삼동│
└──────────────────────┘         │ 부산  │ 서초구│ 청담동│
                                  │ 인천  │ 송파구│ 삼성동│
                                  └──────┴──────┴──────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Trigger | yes | Shows full path or placeholder |
| Per-level panel | yes | Each level renders its options |
| Hover/click expand | yes | Hovering a parent expands its children |
| Search input | optional | Searches across all levels |

## API

```tsx
<Cascader
  value={["seoul", "gangnam", "yeoksam"]}
  onValueChange={setValue}
  options={addressTree}
  separator=" / "
  searchable
/>

// where addressTree is:
type CascaderOption = {
  value: string;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
  isLeaf?: boolean;
};
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string[]` | — | Path to selected leaf (level values in order) |
| `onValueChange` | `(value: string[], path: CascaderOption[]) => void` | — | |
| `options` | `CascaderOption[]` | — | Hierarchical data |
| `separator` | `string` | `" / "` | Display separator in trigger |
| `placeholder` | `string` | — | When empty |
| `searchable` | `boolean` | `false` | Cross-level search |
| `expandTrigger` | `"click" \| "hover"` | `"click"` | How to expand levels |
| `changeOnSelect` | `boolean` | `false` | Allow selection at non-leaf levels |
| `showFullPath` | `boolean` | `true` | In trigger: full path vs leaf-only |
| `loadData` | `(option) => Promise<CascaderOption[]>` | — | Async lazy-load children |
| `disabled` | `boolean` | `false` | |
| `error` / `errorText` | — | — | |

## Behavior

- **Click a parent**: expands children to its right.
- **Click a leaf**: selects, closes popover.
- **`changeOnSelect`**: allows selecting at any level. Triggers `onValueChange` on every click.
- **Search mode**: input at top of popover; results show full paths matching query, flattened.

## States

| State | Visual |
| --- | --- |
| Default trigger | Placeholder or value path |
| Open | Popover with N panels visible |
| Hover row | Highlighted; if has children, panel to right opens |
| Selected leaf | Filled bg, checkmark |
| Loading (async) | Spinner in current panel |

## Accessibility

- Trigger: `role="combobox"`, `aria-expanded`, `aria-haspopup="tree"`, `aria-controls`.
- Each panel: `role="listbox"` (or "tree" for accessibility tools).
- Each option: `role="option"`, `aria-selected`, `aria-haspopup="listbox"` if has children.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach trigger |
| `Enter` / `Space` | Open popover |
| `↑` / `↓` | Move within current panel |
| `→` | Expand to next panel (if has children) |
| `←` | Back to previous panel |
| `Enter` (on leaf) | Select |
| `Esc` | Close |

## Mobile pattern

Cascader's horizontal panel UI breaks on mobile. Switch to a **drill-in screen pattern**:

```
[Tap trigger] → [Level 1 list screen] → [Level 2 list] → [Level 3 list] → [back to form]
```

Each level is a full-screen list with a back button. Visual breadcrumb at top: "서울 > 강남구 > ..."

For Korean address: combine with Daum Postcode (more user-friendly for actual addresses) — see [`component-address-input.md`](component-address-input.md).

## Don't

- Don't use Cascader for non-hierarchical multi-select. Use a Tree.
- Don't use for 5+ levels — too deep; user gets lost.
- Don't use for hierarchies that change frequently (categories that move). Tree handles dynamic shape better.
- Don't combine `changeOnSelect` with deep hierarchies — user accidentally selects at level 1.

## References

- Ant Design: [`refs/ant-design/components/cascader/`](../docs/reference/ant-design.md#cascader) — `Cascader` with full feature set. Most exhaustive.
- MUI / shadcn-ui: no built-in. Compose from Select-like primitives.

## Cross-reference

- [`examples/component-tree.md`](component-tree.md) — when hierarchy is variable depth
- [`examples/component-select.md`](component-select.md) — flat alternative
- [`examples/component-address-input.md`](component-address-input.md) — Korean address pattern using Daum Postcode
