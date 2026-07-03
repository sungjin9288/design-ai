# `AutoComplete` — spec

> Citing Ant Design `AutoComplete`, MUI `Autocomplete`, shadcn-ui (composition with `command`)
>
> Distinct from `Select` (covered combined in [`component-select.md`](component-select.md)) — AutoComplete allows **free-form text input** with suggestions, while Select requires choosing from the list.

## Purpose

A text input with type-ahead suggestions. User can:
- Pick a suggestion (like Select).
- Type free text (unlike Select).

Used for: search bars with suggestions, address auto-fill, email input with recent contacts, tag creation, command palettes.

## When AutoComplete vs Select vs Combobox

| Pattern | Behavior |
| --- | --- |
| **Select** | User picks from list. Free text not allowed. |
| **AutoComplete** | User can pick OR type free text. |
| **Combobox** (the WAI-ARIA pattern) | Umbrella term; both Select and AutoComplete are flavors. |

If your input requires the value be from a list: Select.
If your input allows custom values: AutoComplete (or Select with `creatable`).

## Anatomy

```
Closed:                         Typing (open):
┌─────────────────────────┐    ┌─────────────────────────┐
│ Search recipes...      🔍│    │ chocolate              ✕ │
└─────────────────────────┘    ├─────────────────────────┤
                                │ ▶ chocolate cake         │
                                │   chocolate chip cookies │
                                │   chocolate fondue       │
                                │ ───                      │
                                │ Recent searches:         │
                                │   chocolate truffles     │
                                └─────────────────────────┘
```

## API

```tsx
<AutoComplete
  value={query}
  onValueChange={setQuery}
  options={suggestions}
  onSelect={(value) => navigate(`/recipes?q=${value}`)}
  placeholder="레시피 검색"
  loading={isLoading}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Input value (controlled) |
| `onValueChange` | `(value: string) => void` | — | Fires per keystroke |
| `onSelect` | `(value: string, option: Option) => void` | — | Fires when user picks a suggestion (vs typing then submitting) |
| `options` | `Option[]` or `(query: string) => Promise<Option[]>` | — | Suggestions; can be async |
| `loading` | `boolean` | `false` | Shows spinner in dropdown |
| `placeholder` | `string` | — | |
| `disabled` | `boolean` | `false` | |
| `error` / `errorText` | — | — | |
| `freeText` | `boolean` | `true` | Allow committing values not in suggestions |
| `clearable` | `boolean` | `true` | ✕ to clear |
| `iconStart` | `ReactNode` | — | E.g., search icon |
| `noResultsMessage` | `ReactNode` | "결과 없음" | When suggestions empty |

```ts
type Option = {
  value: string;
  label?: ReactNode;          // Custom display
  description?: string;
  group?: string;
  data?: unknown;
};
```

## Behavior

- Typing fires `onValueChange` (per keystroke, debounced for async).
- Suggestions filter (client) or fetch (async).
- User picks a suggestion: `onSelect` fires with the picked value.
- User types and presses Enter without picking: input commits free text.
- Search suggestions vs typing: matched substring highlighted.

## States

| State | Visual |
| --- | --- |
| Empty | Placeholder, no dropdown |
| Typing | Dropdown opens with filtered suggestions |
| Loading | Spinner in dropdown |
| Has suggestions | List visible |
| No results | "결과 없음" empty state |
| Selected | Input shows picked value, dropdown closes |
| Disabled | Standard |

## Korean IME composition

Critical for Korean apps. Don't fire suggestions during IME composition (mid-syllable):

```tsx
const [isComposing, setIsComposing] = useState(false);

<input
  onCompositionStart={() => setIsComposing(true)}
  onCompositionEnd={(e) => {
    setIsComposing(false);
    setQuery(e.target.value); // Now fire suggestions
  }}
  onChange={(e) => {
    if (!isComposing) setQuery(e.target.value);
  }}
/>
```

Cite [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) for IME details.

## Accessibility — WAI-ARIA Combobox pattern

- Input: `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded={isOpen}`, `aria-controls={listboxId}`.
- Listbox: `role="listbox"`, `id={listboxId}`.
- Each option: `role="option"`, `aria-selected={isHighlighted}`.
- Highlighted option: `aria-activedescendant={optionId}` on the input.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach input |
| `↓` (closed) | Open dropdown |
| `↓` / `↑` (open) | Move highlight |
| `Enter` | Select highlighted (if any) OR commit typed value |
| `Esc` | Close dropdown (first press), clear input (second press) |

## Common patterns

### Search bar

User types a query; dropdown shows matching items + recent searches:

```tsx
<AutoComplete
  options={searchResults}
  onSelect={navigate}
  iconStart={<SearchIcon />}
  placeholder="검색"
/>
```

See [`knowledge/patterns/search-ux.md`](../knowledge/patterns/search-ux.md).

### Email input with contacts

```tsx
<AutoComplete
  options={contacts.map(c => ({ value: c.email, label: c.name, description: c.email }))}
  freeText
  iconStart={<EnvelopeIcon />}
/>
```

### Address auto-fill

For Korean addresses: don't use AutoComplete. Use Daum Postcode lookup. See [`component-address-input.md`](component-address-input.md).

### Tag creation

```tsx
<AutoComplete
  options={existingTags}
  freeText
  onSelect={(value, option) => addTag(value, !option ? "new" : "existing")}
/>
```

When user selects an option: existing tag. When user types and commits: new tag.

## Don't

- Don't use AutoComplete when the value MUST be from a list. Use Select.
- Don't fire suggestions on every keystroke during IME composition.
- Don't ship without keyboard navigation.
- Don't show 100+ suggestions. Cap at 10–20; let the user refine the query.
- Don't force user to pick a suggestion. Allow free text commit.

## References

- Ant Design: [`refs/ant-design/components/auto-complete/`](../docs/reference/ant-design.md#auto-complete) — `AutoComplete`. Built on top of Select with free-text mode.
- MUI: [`refs/mui/packages/mui-material/src/Autocomplete/`](../docs/reference/mui.md#autocomplete) — `Autocomplete` with `freeSolo` prop. Most comprehensive.
- shadcn-ui: compose `command` (cmdk) + Popover for autocomplete-like behavior.

## Cross-reference

- [`examples/component-select.md`](component-select.md) — for picking from a list (no free text)
- [`knowledge/patterns/search-ux.md`](../knowledge/patterns/search-ux.md) — when AutoComplete is a search bar
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — IME composition handling
