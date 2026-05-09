<!-- hand-written -->
---
title: Search UX patterns
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Search UX

Search is one of the most-used interactions in any product with content. Korean users in particular search heavily — local mobile apps treat search as a primary action, not a fallback.

## Three search archetypes

| Type | Use | Example |
| --- | --- | --- |
| **Site-wide search** | Find anything in the product | Google, Naver, in-app top search |
| **Scoped search** | Within one collection | Search this page, search this folder |
| **Filter-based** | Refine an existing list | Faceted search, table filtering |

Most products need 1 or 2 of these. Don't ship all three without strong reason.

## Site-wide search anatomy

```
┌──────────────────────────────────────────────────────┐
│ 🔍 [           type to search...                  ] │
└──────────────────────────────────────────────────────┘
        ↓ (on focus)
┌──────────────────────────────────────────────────────┐
│ 🔍 [type to search                              ✕  ] │
├──────────────────────────────────────────────────────┤
│ 최근 검색어                                            │
│ • previous query 1                              ✕    │
│ • previous query 2                              ✕    │
│ ─────                                                  │
│ 추천 검색어                                            │
│ • trending 1                                          │
│ • trending 2                                          │
└──────────────────────────────────────────────────────┘
        ↓ (on type)
┌──────────────────────────────────────────────────────┐
│ 🔍 [김민                                          ✕]  │
├──────────────────────────────────────────────────────┤
│ 추천 검색어                                            │
│ • 김민지                                               │
│ • 김민호                                               │
│ ─────                                                  │
│ 결과 (8)                                               │
│ → 김민지 — 마케팅 팀                                   │
│ → 김민호 — 엔지니어링                                  │
│ → ...                                                 │
└──────────────────────────────────────────────────────┘
```

| Slot | Notes |
| --- | --- |
| Search input | Full-width on mobile; ~320–480px on desktop |
| Search icon | Always visible (helps discovery + signals affordance) |
| Clear (✕) | Appears when input has value |
| Recent searches | Stored locally (or per-account if logged in) |
| Trending / Recommended | When applicable — Naver, Coupang style |
| Type-ahead suggestions | While typing, before hitting Enter |
| Results | After confirming search OR live as user types |

## Type-ahead vs submit-to-search

| Approach | Use |
| --- | --- |
| **Type-ahead (live)** | Smaller datasets, simple categories — autocompleting names, products, recent items |
| **Submit-to-search** | Large datasets, full-text — articles, documents, deep search |
| **Hybrid** | Type-ahead suggestions PLUS dedicated results page on submit |

Korean consumer apps lean toward **hybrid**: live suggestions in the dropdown + a "전체 검색 결과 보기" link to a full results page.

## Type-ahead (autocomplete)

### Debouncing

Don't fire a request on every keystroke. Wait 200–300ms after the last keystroke before fetching.

For very fast UIs (sub-50ms server response), 100ms is acceptable. For typical APIs, 250ms.

### Cancellation

If a user types fast, cancel in-flight requests. The result of the previous query is irrelevant once the query has changed.

```ts
useEffect(() => {
  const controller = new AbortController();
  fetch(`/search?q=${query}`, { signal: controller.signal })
    .then(...)
    .catch(err => { if (err.name !== 'AbortError') console.error(err); });
  return () => controller.abort();
}, [query]);
```

### Korean IME composition

Korean users typing Hangul go through composition states ("김" + "ㅁ" + "ㅣ" + "ㄴ" → "민"). **Don't fire searches during composition** — wait for `compositionend`:

```ts
const handleChange = (e) => setQuery(e.target.value);
const handleCompositionEnd = (e) => {
  // Now safe to search
  setQuery(e.target.value);
};
```

Otherwise: typing "김민지" results in 5+ separate searches for `김`, `김ㅁ`, `김미`, `김민`, `김민지` — wasteful and visually janky.

## Recent searches

- Show on focus, before user types.
- Store last 5–10 queries.
- Each item has a clear (✕) affordance.
- "Clear all" link below the list.
- Persist locally for guests; per-account for logged-in users.
- Privacy: don't sync recent searches to server unless explicitly opted in.

```
최근 검색어                       [모두 지우기]
• 김민지                                     ✕
• 마케팅 팀                                  ✕
• 5월 결제 내역                              ✕
```

## Result rendering

### Highlight matches

Bold the matched substring in result labels:

```
김**민**지     ← "민" is the search term
마케팅 **팀**  ← "팀" is the search term
```

CSS / mark element:
```html
<span>김<mark>민</mark>지</span>
```

For multi-word searches, highlight each word separately.

### Result types in a unified list

If results span types (people, projects, files), group with section headers:

```
사람 (3)
• 김민지
• 김민호

프로젝트 (1)
• Aurora 김민지 워크스트림

파일 (4)
• minji-design.fig
• ...
```

Each section header is sticky if list is long.

### "No results"

```
┌──────────────────────────────────────────────────┐
│         "김민" 검색 결과가 없습니다                │
│                                                  │
│         다른 검색어를 시도해 보세요.                │
│                                                  │
│         또는                                      │
│         [전체 디렉토리에서 찾기]                    │
└──────────────────────────────────────────────────┘
```

- Echo the query so user sees what was tried.
- Suggest alternatives or broader search.
- Don't say "Error" — empty search results aren't errors.

## Filter-based search (faceted)

For e-commerce, search results, file managers:

```
[search input]
─────────────────────────────────────
  ┌─────┐                     142 results
  │     │
  │ 카테고리 ▾                  Result 1
  │ ☐ 의류                     Result 2
  │ ☐ 신발                     ...
  │                            
  │ 가격                        
  │ ☐ ~₩50,000                 
  │ ☐ ₩50,000 ~₩200,000        
  │                            
  │ [필터 초기화]               
  └─────┘
```

### Filter rules

- **Show selected count** ("3 filters applied").
- **Always have a "clear all" / "초기화"** affordance.
- **Apply on selection** (don't make user click "Apply" — slow), unless filters are expensive (then debounce or batch).
- **Update count** as filters change ("142 → 35 results").
- **Mobile**: filters in a bottom sheet or slide-in panel; "Apply" button at bottom.
- **URL sync**: filters in query params so refresh + share preserves state.

### Faceted vs free-text

Don't replace one with the other:
- Free-text: "검색해 보세요" — open-ended.
- Filters: "이런 옵션들 중에서 골라보세요" — guided.

Combine: the user types a query AND applies filters. Both narrow the result set.

## Search input — the control itself

### Placeholder

```
✓ "이름, 이메일, 프로젝트로 검색"      [tells user what's searchable]
✓ "프로젝트 검색"                      [scoped]
✓ "검색"                              [universal, when context is clear]

✗ "여기 입력하세요"                    [content-free]
✗ "🔍"                                [no instruction]
```

### Keyboard shortcut

For desktop apps with heavy search use: bind `Cmd+K` (Mac) / `Ctrl+K` (Win/Linux) to focus the search input.

Show the shortcut in the placeholder or as a key hint:

```
🔍 [Search...                            Cmd K  ]
```

This is the Linear / GitHub / Notion / Slack convention. Users with > 3-day exposure to any of these expect it.

### Mobile placement

| Pattern | Use |
| --- | --- |
| **Persistent at top** | Search-heavy apps (Naver, Coupang) |
| **Tab in bottom-tab-bar** | Multi-purpose apps (Instagram) |
| **Icon in top-app-bar → opens overlay** | Apps where search is secondary (gmail, banking) |

For Korean consumer apps: persistent or icon-in-app-bar. The hamburger-buried search is an anti-pattern.

## States

| State | Visual |
| --- | --- |
| Empty | Placeholder |
| Focused (no query) | Recent + trending dropdown |
| Typing | Live suggestions / results |
| Loading | Spinner inside or beside the input |
| Loaded with results | Results in dropdown or page |
| Loaded with no results | "no results" empty state |
| Error | Inline error in dropdown — "Failed to search. Try again." |

## Tokens consumed

```
--color-bg-default            (input bg)
--color-bg-elevated           (dropdown bg)
--color-bg-subtle             (hover row)
--color-text-primary
--color-text-secondary        (placeholder)
--color-text-tertiary          (recent / trending labels)
--color-primary-default        (highlight match, focus ring)
--color-border-default
--color-focus-ring
--space-md, --space-base
--radius-md
--shadow-popover
--motion-fast, --easing-out
```

## Accessibility — WAI-ARIA Combobox pattern

The search input is technically a combobox:

- Input: `role="combobox"`, `aria-expanded`, `aria-controls={listboxId}`, `aria-autocomplete="list"`.
- Result list: `role="listbox"`, `id={listboxId}`.
- Each result: `role="option"`, `aria-selected`.
- Active highlight: `aria-activedescendant={activeId}` on the input.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reaches input. Tab again leaves; Tab inside listbox is not standard (use arrow keys). |
| `↓` / `↑` | Move highlight in results |
| `Enter` | Activate highlighted result OR submit search if no highlight |
| `Esc` | Clear input (first press), close dropdown (second press) |
| `Cmd+K` / `Ctrl+K` | (custom binding) focus input from anywhere |

### Screen reader

- Announce result count when results load: "8 results."
- Announce "no results" when applicable.
- Don't announce on every keystroke — too chatty.

## Korean considerations

Per [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md):

- **Search is primary**, not secondary. Korean users search before browsing.
- **자동완성** (auto-complete) is expected.
- **검색어 추천** (recommended searches) common — trending, popular, seasonal.
- **방금 검색한 검색어** (recent searches) shown by default.
- **검색 결과 N건** (N results) — always show count.
- **No-results message**: polite, suggest alternatives — "검색 결과가 없습니다. 다른 검색어를 시도해 보세요."
- **Search by Korean substring**: Hangul searches should match partial syllables (`김민` matches `김민지`, `김민호`). Server-side concern, but UX expects it.

## Common search anti-patterns

- **Hidden search** (only behind a hamburger menu).
- **Auto-submit on every keystroke** (no debounce, hammers server, flickers UI).
- **No clear button** — user has to backspace to empty.
- **Generic "Try again" on no-results** — no actual help.
- **Loading every result on first focus** — eager fetching of "popular searches" before user has even typed.
- **Results that don't show the matched query** — user has no idea why this matched.
- **Submit-only with no live suggestions** — when type-ahead would help.
- **Type-ahead only with no submit page** — when result list overflows the dropdown.

## Code example

```tsx
function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 250);
  const [isComposing, setIsComposing] = useState(false);
  const { data: results, isLoading } = useSearch(debouncedQuery, { skip: isComposing });
  const recentSearches = useRecentSearches();

  return (
    <div className="search">
      <Input
        placeholder="이름, 이메일, 프로젝트로 검색"
        iconStart={<SearchIcon />}
        clearable
        value={query}
        onChange={setQuery}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => { setIsComposing(false); setQuery(e.target.value); }}
        // a11y combobox attrs auto-applied via Combobox primitive
      />
      <SearchDropdown
        query={query}
        recentSearches={recentSearches}
        results={results}
        isLoading={isLoading}
      />
    </div>
  );
}
```

## Cross-reference

- [`knowledge/patterns/list-and-feed.md`](list-and-feed.md) — search results as a list
- [`knowledge/patterns/form-design.md`](form-design.md) — search input as a form field
- [`knowledge/patterns/mobile-navigation.md`](mobile-navigation.md) — search placement on mobile
- [`knowledge/i18n/korean-typography.md`](../i18n/korean-typography.md) — IME composition handling
- [`examples/component-select.md`](../../examples/component-select.md) — combobox pattern (search input is a special case)
