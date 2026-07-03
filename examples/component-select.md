# `Select` / `Combobox` — spec

> Citing Ant Design `Select`, MUI `Autocomplete`, shadcn-ui `select` + `combobox`

## Purpose

Lets the user pick one (or multiple) from a list of options. Two distinct patterns:

| Pattern | When |
| --- | --- |
| **Select** (`<select>`-style) | Closed list of ≤ 20 options, no typing needed. Country, currency, status. |
| **Combobox** (typeahead / autocomplete) | Long lists (50+), async loading, allow free-text + suggestions. User search. |

This spec covers both as variants of one component, since modern systems (Radix, Headless UI) treat them as the same primitive with `searchable: true|false`.

## Anatomy

```
Trigger:                          Popover (when open):
┌──────────────────────┐         ┌──────────────────────┐
│ Selected value    ▾  │         │ ▣ Type to search...  │  ← optional search input
└──────────────────────┘         ├──────────────────────┤
                                  │ ✓ Option 1           │  ← active
                                  │   Option 2           │
                                  │   Option 3 (group)   │
                                  │   ───────────        │
                                  │   Option 4           │
                                  │ + Create "new tag"   │  ← optional creatable
                                  └──────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Trigger | yes | Looks like an Input with chevron |
| Search input | combobox only | Inside popover for long lists |
| Option list | yes | Scrollable if > ~10 visible |
| Option item | yes | Can have icon, description, badge |
| Group header | optional | `<optgroup>`-style grouping |
| Create option | optional (creatable mode) | Adds new value not in list |
| Empty state | yes | "검색 결과가 없습니다" |
| Footer | optional | "Apply" button for multi-select, links to elsewhere |

## API

```tsx
<Select
  value={country}
  onValueChange={setCountry}
  options={[
    { value: "kr", label: "대한민국", flag: "🇰🇷" },
    { value: "jp", label: "日本",      flag: "🇯🇵" },
    { value: "us", label: "United States", flag: "🇺🇸" },
  ]}
  placeholder="국가를 선택하세요"
  searchable
  clearable
/>

<MultiSelect
  values={tags}
  onValuesChange={setTags}
  options={tagOptions}
  creatable
  placeholder="태그 선택"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `values` | `T \| T[]` | — | Controlled |
| `defaultValue` | same | — | Uncontrolled |
| `onValueChange` | `(value) => void` | — | |
| `options` | `Option[]` or `(query) => Promise<Option[]>` | `[]` | Static list or async loader |
| `multiple` | `boolean` | `false` | Multi-select mode |
| `searchable` | `boolean` | `false` (Select) / `true` (Combobox) | Show search input in popover |
| `creatable` | `boolean` | `false` | Allow creating values not in list |
| `clearable` | `boolean` | `false` | Show ✕ to clear |
| `placeholder` | `string` | — | |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `error` / `errorText` | — | — | Validation state |
| `loading` | `boolean` | `false` | Show spinner inside popover |
| `maxDisplayedTags` | `number` | `3` (multi) | Tags shown before "+N more" |
| `groupBy` | `(option) => string` | — | Render group headers |
| `optionRender` | `(option) => ReactNode` | default | Custom option rendering |
| `noResultsMessage` | `ReactNode` | "검색 결과가 없습니다" | |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |

### Option type

```ts
type Option<T = string> = {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  group?: string;
  disabled?: boolean;
  // free-form metadata for custom rendering
  [key: string]: unknown;
};
```

## States

| State | Visual |
| --- | --- |
| Empty | Placeholder, chevron `▾` |
| Filled | Selected label, optional icon |
| Hover | Border emphasis |
| Focus-visible | 2px ring |
| Open | Border emphasis, chevron flips to `▴` |
| Disabled | 50% opacity, no events |
| Loading (async) | Spinner replaces chevron |
| Error | Border `--color-error` |

For multi-select with values: each value renders as a `Tag` chip inside the trigger. Overflow shows `+N`:

```
┌──────────────────────────────────────────────┐
│ [태그1 ✕] [태그2 ✕] [태그3 ✕] +5            ▾ │
└──────────────────────────────────────────────┘
```

## Variants

### Single select

Default. Closes on selection.

### Multi-select

- Stays open after each selection.
- Selected items show checkmarks in the popover.
- Selected items render as tags in the trigger.
- "Apply" footer button for "confirm and close" UX (optional — most close on outside click).

### Searchable / combobox

- Search input appears at the top of the popover (or replaces the trigger value).
- Filter applies as user types (client-side or async).
- Highlight matched substring in option labels.

### Async loading (combobox)

- `options` is a function `(query: string) => Promise<Option[]>`.
- Debounce: 250–300ms before each request.
- Loading spinner during fetch.
- Error state with retry.
- Cache results per query for the session (cancel on new query).

### Creatable (tag input)

- Allow committing values not in the option list.
- Visual: a "Create '<input>'" item at the bottom of the dropdown.
- Confirmation: pressing Enter on this item adds the new value.
- Use cases: tag inputs, free-form labels, email-list inputs.

## Accessibility — WAI-ARIA Combobox / Listbox pattern

This is one of the more complex a11y components. Use a battle-tested primitive (Radix, Headless UI) and don't roll from scratch.

### Pattern depending on variant

| Variant | Pattern |
| --- | --- |
| Single, not searchable | `role="listbox"` (button-triggered) — Radix Select |
| Single, searchable | `role="combobox"` |
| Multi-select with search | `role="combobox" aria-multiselectable="true"` |

### ARIA structure

- Trigger: `role="combobox"` (searchable) or `role="button"` (non-searchable), `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`.
- Popover listbox: `role="listbox"`, `aria-multiselectable="true|false"`.
- Each option: `role="option"`, `aria-selected="true|false"`.
- Active option (currently highlighted by keyboard): `aria-activedescendant` on the combobox.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reaches trigger. From open popover, tab moves out. |
| `↓` / `Enter` (closed) | Opens popover, focus first option (or selected) |
| `↓` / `↑` (open) | Move highlight |
| `Home` / `End` | First / last option |
| `Enter` / `Space` (open) | Select highlighted option, close (or stay open if multi) |
| `Esc` | Close popover, return focus to trigger |
| Type-ahead (non-searchable) | Jump to first option starting with typed char |
| Type-ahead (searchable) | Filters list |
| `Backspace` (multi-select with values) | Remove last tag |

## Tokens consumed

```
--color-bg-default          (popover bg, trigger bg)
--color-bg-subtle           (option hover)
--color-bg-elevated         (active option)
--color-text-primary
--color-text-secondary      (description text)
--color-primary-default     (selected indicator)
--color-primary-subtle-bg   (selected option highlight)
--color-border-default
--color-border-strong       (hover border on trigger)
--color-focus-ring
--color-error
--space-sm, --space-md
--radius-md
--shadow-popover
--motion-fast, --easing-out
```

## Sizes

| Size | Trigger height | Option height | Font |
| --- | --- | --- | --- |
| `sm` | 32px | 28px | 13px |
| `md` (default) | 40px | 36px | 14px |
| `lg` | 48px | 44px | 16px |

## Edge cases

- **Long option labels**: truncate with `…`, full text in `title`. For comboboxes where users search by full text, allow wrapping if option count is small.
- **Many options (1000+)**: virtualize the option list. `react-virtual` or `tanstack-virtual`. Don't render 1000 DOM nodes.
- **Async load with no results**: show `noResultsMessage`. Provide creatable path if applicable.
- **Mobile**: prefer **bottom sheet** over popover for searchable selects on mobile. The keyboard takes most of the screen otherwise.
- **Korean IME**: don't filter on every composition keystroke. Wait for `compositionend`. Otherwise `김`+`민` filters out everything between.
- **Tag input with paste**: pasting "tag1, tag2, tag3" should split on `,` and add as 3 tags.
- **RTL**: chevron flips, padding swaps. Tag chips wrap RTL.
- **Pre-selected value not in current options list** (rare async case): show the value in the trigger but resolve label via a separate lookup if possible.
- **Disabled options**: visually muted, skipped by keyboard nav, not selectable.

## Don't

- Don't use a `<select>` for 50+ options. Native dropdowns become unusable. Use a searchable combobox.
- Don't use a Select for binary choices (yes/no, on/off). Use a Switch or radio buttons.
- Don't auto-select the first option. Show placeholder until user picks.
- Don't lose typed text on accidental blur — on blur with no selection, either close cleanly or show "press Enter to confirm".
- Don't force "Apply" button on multi-select that closes on outside click anyway. Pick one model.
- Don't combine creatable + restrictive validation (e.g., "must be from list"). Pick one.

## References

- Ant Design: [`refs/ant-design/components/select/`](../docs/reference/ant-design.md#select) — `Select`, supports `mode="multiple"`, `mode="tags"` (creatable). Has `Cascader` for hierarchical select.
- MUI: `<Select>` (basic, like native) and `<Autocomplete>` (combobox). Autocomplete is the canonical reference for the searchable variant.
- shadcn-ui:
  - [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/select.tsx`](../docs/reference/shadcn-ui.md#select) — Radix Select. No search.
  - [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/command.tsx`](../docs/reference/shadcn-ui.md#command) — cmdk-based searchable. Combine with Popover for combobox pattern.

API choices made:
- **`Select` and `MultiSelect` as separate top-level exports** for type safety on `value` (single value vs array). Internally same primitive with `multiple={true|false}`.
- **`searchable` and `creatable` as boolean props** rather than separate components — fewer concepts, same WAI-ARIA pattern.
- **`options` accepting either array or async function**: covers both static and remote-load cases without a separate component.
- **Tag chips inside the trigger for multi**: matches Ant + Autocomplete; clearer than checkbox-list-only.

## Cross-reference

- [knowledge/patterns/form-design.md](../knowledge/patterns/form-design.md) — Select in forms
- [WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [knowledge/a11y/keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) — keyboard contract
