# `Combobox` — spec

> Synthesized from shadcn-ui `combobox` (cmdk + Popover) and the WAI-ARIA Combobox pattern. A typeable search field combined with a list of options. Distinct from `Select` (no typing) and `Autocomplete` (more freeform).

## Combobox vs Select vs Autocomplete

| | Combobox | Select | Autocomplete |
| --- | --- | --- | --- |
| Typing | **Yes** (filters list) | No | Yes |
| Free input | No (must pick from list) | n/a | Yes (often) |
| Use | Pick from a long list (50+ options) | Pick from a short list (< 20) | Suggest while typing free text |
| Examples | Country picker, user mention | Sort by, status filter | Address auto-suggest, search bar |

The combobox is "Select with search" — typing narrows the list.

## Anatomy

```
┌─────────────────────────────────┐
│ ▼ Search framework...           │   ← trigger field (looks like input)
└─────────────────────────────────┘
       ↓ click / focus
┌─────────────────────────────────┐
│ ⌕ Type to search...             │   ← search input
│ ───────────────────             │
│ ▶  React                        │
│    Vue                          │   ← filtered list
│    Svelte                       │
│    Solid                        │
│ ───────────────────             │
│ No results found                │   ← empty state
└─────────────────────────────────┘
```

## API

```tsx
const [value, setValue] = useState("");
const [open, setOpen] = useState(false);

<Combobox open={open} onOpenChange={setOpen}>
  <Combobox.Trigger asChild>
    <Button variant="outline" role="combobox" aria-expanded={open}>
      {value ? frameworks.find(f => f.value === value)?.label : "Select framework..."}
      <ChevronIcon />
    </Button>
  </Combobox.Trigger>
  <Combobox.Content>
    <Combobox.Input placeholder="Search framework..." />
    <Combobox.List>
      <Combobox.Empty>No framework found.</Combobox.Empty>
      <Combobox.Group>
        {frameworks.map(f => (
          <Combobox.Item
            key={f.value}
            value={f.value}
            onSelect={(v) => { setValue(v); setOpen(false); }}
          >
            <CheckIcon className={value === f.value ? "" : "invisible"} />
            {f.label}
          </Combobox.Item>
        ))}
      </Combobox.Group>
    </Combobox.List>
  </Combobox.Content>
</Combobox>
```

## Composition

| Part | Purpose |
| --- | --- |
| `Combobox` | Wrapper / state holder |
| `Trigger` | Element that opens (typically a button styled as input) |
| `Content` | Floating panel with input + list |
| `Input` | Search/filter input (auto-focused when open) |
| `List` | Container for options (virtualizable) |
| `Empty` | Shown when no items match query |
| `Item` | Selectable option |
| `Group` | Grouped section with optional heading |
| `Separator` | Visual divider |

## Variants

### Single-select (default)

One value at a time. Selecting closes the combobox.

### Multi-select

```tsx
const [selected, setSelected] = useState<string[]>([]);

<Combobox multiple value={selected} onValueChange={setSelected}>
  <Combobox.Trigger asChild>
    <Button>
      {selected.length > 0
        ? `${selected.length} 개 선택됨`
        : "선택"}
    </Button>
  </Combobox.Trigger>
  ...
</Combobox>
```

Items show check on selected; combobox stays open while user picks multiple.

### With creation (creatable)

```tsx
<Combobox.Item createable onSelect={() => createNew(query)}>
  + Create "{query}"
</Combobox.Item>
```

When user types and no exact match exists, show a "Create" item at the top.

## States

| State | Visual |
| --- | --- |
| Closed | Trigger only |
| Open | Panel visible; input focused; first item highlighted |
| Typing | List filters; first match highlighted |
| Empty results | `Empty` component shown |
| Selected (single) | Trigger shows selected label |
| Selected (multi) | Trigger shows count or chips; checks visible in list |
| Loading (async) | Skeleton or "Searching..." in list |
| Disabled | Trigger grayed; no events |

## Keyboard contract (WAI-ARIA Combobox pattern)

| Key | Action |
| --- | --- |
| `Enter` / `Space` (on trigger) | Open |
| Type in input | Filter list |
| `↓` / `↑` | Navigate items |
| `Home` / `End` | Jump to first / last |
| `Enter` (on item) | Select; close (single) or stay open (multi) |
| `Esc` | Close; return focus to trigger |
| `Tab` | Close; move to next focusable in document |
| Click outside | Close |

## Tokens consumed

```
--color-bg-default                 (trigger field bg)
--color-bg-overlay                 (panel bg)
--color-fg-default
--color-fg-muted                   (placeholder, group headings)
--color-bg-overlay-hover           (item hover)
--color-bg-overlay-selected        (current focused/highlighted item)
--color-brand-default              (selected check icon)
--color-border-default
--shadow-overlay
--radius-md
--space-xs, --space-sm
--font-size-base                   (input)
--font-size-sm                     (group headings)
--motion-fast                      (item hover)
--ease-out
--z-overlay
```

## Accessibility

- Trigger: `<button role="combobox" aria-expanded aria-haspopup="listbox" aria-controls="combo-list">`.
- Input: separate from trigger when popup open; `role="combobox"` on input itself.
- List: `role="listbox"` + `aria-label`.
- Item: `role="option"` + `aria-selected`.
- Use `aria-activedescendant` to indicate which item is highlighted (don't move focus to options; keep focus on input so typing works).
- `aria-live="polite"` on List for screen reader to announce filter changes.
- Touch target ≥ 36px per item.

## Korean IME considerations

Korean input uses IME (Input Method Editor) for Hangul composition. Three rules:

1. **Don't trigger filter on every `keydown`** during composition — wait for `compositionend`.
2. **Filter logic should match initial / 초성** — typing "ㄱ" might match "강원도", "기타" (initial-letter search common in Korean).
3. **Cancel on Esc during composition** — Esc cancels IME composition first, then closes combobox on second press.

```tsx
const [query, setQuery] = useState("");
const [composing, setComposing] = useState(false);

<Combobox.Input
  value={query}
  onChange={(e) => !composing && setQuery(e.target.value)}
  onCompositionStart={() => setComposing(true)}
  onCompositionEnd={(e) => {
    setComposing(false);
    setQuery(e.currentTarget.value);
  }}
/>
```

## Code example — country picker

```tsx
function CountryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const country = COUNTRIES.find(c => c.code === value);

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <Combobox.Trigger asChild>
        <Button variant="outline" role="combobox">
          {country ? `${country.flag} ${country.name}` : "국가 선택"}
          <ChevronDownIcon />
        </Button>
      </Combobox.Trigger>
      <Combobox.Content className="w-[280px] p-0">
        <Combobox.Input placeholder="국가 검색..." />
        <Combobox.List>
          <Combobox.Empty>일치하는 국가가 없어요.</Combobox.Empty>
          {COUNTRIES.map(c => (
            <Combobox.Item
              key={c.code}
              value={c.name + " " + c.code}  // search token
              onSelect={() => { onChange(c.code); setOpen(false); }}
            >
              <span className="mr-2">{c.flag}</span>
              {c.name}
              <CheckIcon
                className={cn("ml-auto", value === c.code ? "" : "invisible")}
              />
            </Combobox.Item>
          ))}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}
```

## Edge cases

- **Very long list (10,000+ items)**: virtualize. Use `react-virtual` inside Combobox.List.
- **Async fetch as user types**: debounce input; show loading state in list.
- **No exact match + creatable**: show "Create new" as last item.
- **Selected value not in list** (stale data): Trigger shows ID or last-known label; refresh on next open.
- **Disabled items**: render but skip on `Enter`.
- **Mobile**: open as a Sheet (full-height) instead of a Popover for better thumb reach.
- **Korean 초성 search** ("ㄱㅇㄷ" → matches "강원도"): requires custom search function with hangul-jaso library.

## Don't

- Don't use Combobox when a simple Select would do (< 20 items).
- Don't trigger network search on every keystroke. Debounce 200-300ms.
- Don't move focus to the option list — keep focus on input (use `aria-activedescendant`).
- Don't hide the search input when there are < 5 items. Confusing — degrade gracefully to non-search list.
- Don't show "0 results" without offering a creatable fallback OR a clear-filter shortcut.
- Don't ignore Korean IME — Hangul composition events matter.

## References

- shadcn-ui: [`combobox`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/combobox.tsx)
- WAI-ARIA: [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- cmdk library

## Cross-reference

- [`examples/component-select.md`](component-select.md) — non-search variant
- [`examples/component-autocomplete.md`](component-autocomplete.md) — freeform variant
- [`examples/component-command.md`](component-command.md) — command palette (similar primitive)
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — IME handling
