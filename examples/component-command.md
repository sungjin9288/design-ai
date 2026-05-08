# `CommandPalette` — spec

> Synthesized from shadcn-ui `command` (cmdk under the hood). Searchable command/action palette — the canonical "press Cmd+K" pattern popularized by VS Code, Linear, GitHub.

## When to use

- **Power-user shortcuts** for any action in the app.
- **Search across multiple entity types** (users, files, settings, actions).
- **Replace a sprawling main menu** for keyboard-driven UIs.
- **AI command surface** — "ask AI", "generate X" entry points.

When NOT to use:
- Simple apps with < 20 actions — overkill.
- Mobile-primary apps — keyboard shortcuts don't translate (long-press + on-screen invocation needed).

## Anatomy

```
        [Cmd+K]
            ↓
┌──────────────────────────────────────┐
│  ⌕  Type a command or search...      │
│ ───────────────────────────────────── │
│                                      │
│  Suggestions                          │
│  ─────────                            │
│   ▶  Open file...           ⌘P       │
│      Run command...         ⌘⇧P      │
│      Toggle theme           ⌘L       │
│                                      │
│  Recent                              │
│  ─────                                │
│      design-system.md                │
│      Profile settings                │
│                                      │
│  Search results — "compo"             │
│  ────────────────────                 │
│      Component spec                  │
│      Compose new doc                 │
│                                      │
└──────────────────────────────────────┘
```

## API

```tsx
<CommandPalette open={open} onOpenChange={setOpen}>
  <CommandPalette.Input placeholder="Type a command or search..." />
  <CommandPalette.List>
    <CommandPalette.Empty>No results found.</CommandPalette.Empty>

    <CommandPalette.Group heading="Suggestions">
      <CommandPalette.Item onSelect={openFile}>
        <FileIcon /> Open file...
        <CommandPalette.Shortcut>⌘P</CommandPalette.Shortcut>
      </CommandPalette.Item>
      <CommandPalette.Item onSelect={runCommand}>
        <TerminalIcon /> Run command...
        <CommandPalette.Shortcut>⌘⇧P</CommandPalette.Shortcut>
      </CommandPalette.Item>
    </CommandPalette.Group>

    <CommandPalette.Separator />

    <CommandPalette.Group heading="Recent">
      {recentItems.map(item => (
        <CommandPalette.Item key={item.id} onSelect={() => open(item)}>
          {item.name}
        </CommandPalette.Item>
      ))}
    </CommandPalette.Group>
  </CommandPalette.List>
</CommandPalette>
```

## Composition

| Part | Purpose |
| --- | --- |
| `CommandPalette` | Wrapper; manages state + keyboard |
| `Input` | Search field (auto-focuses on open) |
| `List` | Results container (virtualized for long lists) |
| `Empty` | Shown when no items match query |
| `Group` | Section with heading |
| `Item` | Single command / result |
| `Shortcut` | Keyboard hint (visual; doesn't bind keys) |
| `Separator` | Visual divider |
| `Loading` | Shown while async results load |

## Keyboard contract

| Key | Action |
| --- | --- |
| `Cmd+K` / `Ctrl+K` | Open globally |
| Type | Filter items (substring + fuzzy) |
| `↓` / `↑` | Navigate items |
| `Enter` | Activate selected item |
| `Esc` | Close (or clear input first if non-empty) |
| `Tab` | Close (no internal tabbing) |
| `Cmd+Enter` | Open in new tab / new window (if applicable) |

Global hotkey activation requires app-level keyboard listener (separate from CommandPalette internals). Standard pattern:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(o => !o);
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, []);
```

## Search modes

### Fuzzy / substring (default)

Type "comp" → matches "Component spec", "Compose new doc", "Compress files".

cmdk uses substring + fuzzy by default with per-item scoring.

### Pages / sub-commands

Multi-step flows (think VS Code "Go to..." then "File / Symbol / Line"):

```tsx
{!page && (
  <CommandPalette.Group heading="Navigate">
    <CommandPalette.Item onSelect={() => setPage("files")}>Files</CommandPalette.Item>
    <CommandPalette.Item onSelect={() => setPage("symbols")}>Symbols</CommandPalette.Item>
  </CommandPalette.Group>
)}

{page === "files" && (
  <CommandPalette.Group heading="Files">
    {files.map(f => <CommandPalette.Item key={f.path}>{f.name}</CommandPalette.Item>)}
  </CommandPalette.Group>
)}
```

`Backspace` on empty input pops back to root page.

### Async / remote search

For server-fetched results (e.g., GitHub user search):

```tsx
const [query, setQuery] = useState("");
const { data, isLoading } = useDebouncedQuery(query, 200);

<CommandPalette.Input value={query} onValueChange={setQuery} />
<CommandPalette.List>
  {isLoading && <CommandPalette.Loading>Searching...</CommandPalette.Loading>}
  {!isLoading && data?.length === 0 && <CommandPalette.Empty>No matches.</CommandPalette.Empty>}
  {data?.map(item => <CommandPalette.Item key={item.id}>{item.name}</CommandPalette.Item>)}
</CommandPalette.List>
```

Debounce input; show loading state; render empty state on no results.

## States

| State | Visual |
| --- | --- |
| Closed | Hidden |
| Opening | Modal fade + scale (200ms) |
| Open, no input | Show suggestions / recent |
| Typing | Filter / fuzzy match in real-time |
| Loading (async) | Shimmer or "Searching..." in List |
| No results | `Empty` rendered |
| Closing | Reverse |

## Visual

CommandPalette is a centered Modal (top-positioned more common):

```
[centered horizontally]
[at ~20% from top of viewport (not center; users scan top-down)]
```

Width: 600-720px on desktop; near-full-width on mobile.

Backdrop: scrim (semi-opaque dark). Click outside closes.

## Tokens consumed

```
--color-bg-overlay-scrim       (backdrop)
--color-bg-default             (palette bg)
--color-fg-default
--color-fg-muted               (groups, shortcut hints)
--color-bg-secondary           (item hover bg)
--color-brand-default          (selected item indicator)
--color-border-default
--shadow-overlay
--radius-lg                    (palette container)
--radius-md                    (items)
--space-xs, --space-sm, --space-md
--font-size-base               (input)
--font-size-sm                 (group headings, shortcuts)
--motion-fast                  (item hover)
--motion-medium                (open/close)
--ease-out
--z-overlay
```

## Accessibility

- Wrapper: `role="dialog" aria-modal="true" aria-label="Command palette"`.
- Input: `role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant="<item-id>"`.
- List: `role="listbox"`.
- Item: `role="option" aria-selected="true|false"`.
- Group: `role="group" aria-label="<heading>"`.
- Empty: `role="status"` for "No results" announcement.
- Focus trapped in palette; first item auto-selected after typing.
- Touch target ≥ 36px per item.
- Korean: Pretendard / NanumSquare body, Pretendard for input. Group headings 합쇼체 ("최근 항목") or English mixed.

## Code example

```tsx
function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useGlobalHotkey("cmd+k", () => setOpen(true));

  return (
    <CommandPalette open={open} onOpenChange={setOpen}>
      <CommandPalette.Input
        value={query}
        onValueChange={setQuery}
        placeholder="명령어 또는 파일을 검색하세요..."
      />
      <CommandPalette.List>
        <CommandPalette.Empty>일치하는 결과가 없어요.</CommandPalette.Empty>

        <CommandPalette.Group heading="명령어">
          <CommandPalette.Item onSelect={() => navigate("/new")}>
            <PlusIcon /> 새 문서 만들기
            <CommandPalette.Shortcut>⌘N</CommandPalette.Shortcut>
          </CommandPalette.Item>
          <CommandPalette.Item onSelect={() => toggleTheme()}>
            <SunIcon /> 테마 전환
            <CommandPalette.Shortcut>⌘⇧L</CommandPalette.Shortcut>
          </CommandPalette.Item>
        </CommandPalette.Group>

        <CommandPalette.Group heading="최근 항목">
          {recents.map(item => (
            <CommandPalette.Item key={item.id} onSelect={() => navigate(item.path)}>
              {item.name}
            </CommandPalette.Item>
          ))}
        </CommandPalette.Group>
      </CommandPalette.List>
    </CommandPalette>
  );
}
```

## Edge cases

- **Long lists (10,000+ items)**: virtualize the List (react-virtual / cmdk built-in).
- **Disabled items**: render but skip on Enter; visually muted.
- **Item with multiple actions** (open / open in new tab): show as separate items OR add an "actions" submenu (`Cmd+Enter` for secondary).
- **Closing while async query in flight**: cancel request OR ignore late response.
- **Korean IME composition**: don't treat composing characters as final input — debounce / wait for `compositionend`.
- **Reduced motion**: skip the open/close animation; instant.
- **Mobile**: full-width palette; on-screen keyboard handling — palette shrinks above keyboard.

## Don't

- Don't put critical actions ONLY in the palette. They need visible buttons too.
- Don't forget Esc to close — accessibility foundation.
- Don't over-pack one palette with 50+ groups; users get lost.
- Don't put the search input below results — input always at top.
- Don't lock keyboard shortcuts to one OS (`Cmd` only); use `Cmd` on Mac, `Ctrl` on Win/Linux.
- Don't use CommandPalette as your only input method — must have alternatives.
- Don't fail to debounce async queries — server load.

## References

- shadcn-ui: [`command`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/command.tsx) (cmdk-based)
- cmdk library by pacocoursey
- Patterns: VS Code Command Palette, Linear, GitHub global search, Slack `Cmd+K`
- WAI-ARIA: combobox + listbox pattern

## Cross-reference

- [`examples/component-dropdown.md`](component-dropdown.md) — for non-search menus
- [`examples/component-modal.md`](component-modal.md) — focus trap pattern
- [`examples/component-autocomplete.md`](component-autocomplete.md) — single-field search
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
