<!-- hand-written -->
---
title: List and feed patterns
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# List and feed patterns

Lists are everywhere — transaction history, search results, settings, chat threads, product feeds. The pattern looks simple; getting it right is harder than it appears.

## When list vs grid vs table

| Pattern | Use when |
| --- | --- |
| **List** (vertical, single column) | Items have variable text length; primary scan is "what's at the top"; mobile-first |
| **Grid** (2+ columns) | Items have visual primary (photos); items are equal; product browsing |
| **Table** (multi-column with headers) | Multi-attribute comparison; data analysis; desktop-first; `<table>` semantics |
| **Card list** (vertical with cards) | Each item is a self-contained unit (article, project, listing); medium info density |

This file covers **lists** and **feeds** (a list with infinite scroll or refresh).

## List item anatomy

A list item is a small composition:

```
┌──────────────────────────────────────────────────────────┐
│ [icon/avatar]  Primary text             [meta]    [→]    │
│                Secondary text                              │
└──────────────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Leading visual | optional | Icon, avatar, color swatch, status dot |
| Primary text | yes | The thing |
| Secondary text | optional | Metadata, subtitle |
| Trailing meta | optional | Timestamp, count, amount, status badge |
| Trailing affordance | optional | Chevron `>` (drill in), checkbox, switch |

### Heights

| Density | Single-line | Two-line | Three-line |
| --- | --- | --- | --- |
| Compact | 40px | 56px | 72px |
| Comfortable (default) | 48px | 64px | 80px |
| Spacious | 56px | 72px | 88px |

For Korean consumer apps: lean toward **compact-to-comfortable**. Western apps default spacious.

## Common list patterns

### Settings list

```
┌──────────────────────────────────────────────────┐
│  알림                                       >    │
│ ─────────────────────────────────────────────── │
│  결제 수단                                  >    │
│ ─────────────────────────────────────────────── │
│  보안                                  ●    >    │  ← red dot = needs attention
│ ─────────────────────────────────────────────── │
│  버전                              v1.4.2        │
│ ─────────────────────────────────────────────── │
│  로그아웃                                        │  ← destructive, red
└──────────────────────────────────────────────────┘
```

Conventions:
- Section headers (group settings into 2–4 sections).
- Chevron `>` for items that drill in.
- Trailing value for items that show the current setting (`v1.4.2`, `한국어`).
- Switch on the right for booleans (Wi-Fi, notifications).
- Destructive actions (logout, delete) at the bottom, in `--color-error`, no chevron.

### Conversation / chat list

```
┌──────────────────────────────────────────────────┐
│ ●  김민지 (3)              어제 오후 11:23  [3]   │
│    "내일 점심 같이 먹을래?"                       │
├──────────────────────────────────────────────────┤
│    이서준                  오전 10:42            │
│    이미지를 보냈습니다                            │
├──────────────────────────────────────────────────┤
│    가족 단톡방              화                    │
│    엄마: "오늘 저녁 6시"                          │
└──────────────────────────────────────────────────┘
```

- Avatar/group icon on left.
- Primary line: name (+ unread count).
- Secondary line: latest message preview, single-line truncated.
- Timestamp far right (relative — "어제 오후 11:23", "방금 전", "화", "10/05").
- Unread indicator: dot on left or count badge on right.
- Bold weight for unread items (entire row).

### Transaction list (fintech)

See [knowledge/patterns/money-and-amount.md](money-and-amount.md). Tabular numerals, right-aligned amounts.

```
┌────────────────────────────────────────────────────┐
│ 5월 7일                                             │   ← date header (sticky)
├────────────────────────────────────────────────────┤
│ 🍽 스타벅스 강남점               -₩5,500           │
│    카페 · 12:34                                     │
├────────────────────────────────────────────────────┤
│ 💼 급여                            +₩2,500,000     │
│    회사 · 09:00                                     │
└────────────────────────────────────────────────────┘
```

- Sticky date headers between sections.
- Income / expense color via `--color-money-positive` / `--color-money-negative`.

### Search results

```
┌──────────────────────────────────────────────────┐
│ "결과 142건"                          [필터]      │
├──────────────────────────────────────────────────┤
│ Result item 1                                    │
├──────────────────────────────────────────────────┤
│ Result item 2 (highlighted match)                │
├──────────────────────────────────────────────────┤
│ ...                                              │
└──────────────────────────────────────────────────┘
```

- Result count.
- Filter / sort affordance.
- Highlighted matches (bold or `<mark>` background).
- "더 보기" or pagination at bottom (or infinite scroll).

## Pull-to-refresh

Mobile-native gesture. Required for any feed that updates from a server.

### Behavior

1. User pulls down at top of list. List moves with finger.
2. Past threshold (~64–80px), refresh indicator appears (spinner).
3. Release: list bounces back, indicator stays for ~1s while fetch happens.
4. Indicator disappears, new content (if any) is at top.

### Implementation cues

- iOS: native via `UIRefreshControl`. RN: `RefreshControl` component on FlatList/ScrollView.
- Android: native via `SwipeRefreshLayout`. Material default.
- Web: not native; use a library (no clean cross-browser implementation).

### Don't

- Don't pull-to-refresh on lists where the user controls when data appears (e.g., a static settings list).
- Don't pull-to-refresh AND have a refresh button in the header — pick one.
- Don't show "no new items" toast after every refresh — silent if nothing new.

## Infinite scroll

Auto-loads next page when user scrolls near the bottom.

### Implementation

1. Reserve a "load more" trigger at the bottom (last 3 items in viewport).
2. When trigger enters viewport, fetch next page.
3. Append to list.
4. If error, show inline error with "다시 시도" button.

### Versus explicit "Load more" button

| Use infinite scroll | Use Load More button |
| --- | --- |
| Feed-style content (social, news, transactions) | Search results, e-commerce results |
| Mobile primarily | Desktop primarily |
| Engagement is a goal | User needs to know "where am I?" |

Infinite scroll has tradeoffs:
- Footer becomes unreachable (avoid on sites with critical footer).
- Browser back doesn't restore scroll position by default.
- Accessibility: screen reader users get lost. Add `aria-live` updates: "20 more results loaded".

### Hybrid: chunked infinite scroll

After every 3 pages, pause and show an explicit "Load more" or "View all 142 results". Lets the user catch breath, restores reachability of footer.

## Empty state

Required for any list that can be empty.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│                    ┌────────┐                    │
│                    │  📭    │                    │
│                    └────────┘                    │
│                                                  │
│             아직 거래 내역이 없어요                │
│             첫 거래를 추가해보세요                  │
│                                                  │
│              [거래 추가하기]                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

| Element | Notes |
| --- | --- |
| Illustration / icon | Friendly, related to content type. Don't use generic "empty box". |
| Title | What's empty, in user terms ("아직 거래 내역이 없어요"). |
| Description | Why and what to do next (1 sentence). |
| Primary CTA | The action that fills the list (if applicable). |

### Don't

- Don't show "No data" alone. That's hostile.
- Don't auto-redirect to onboarding.
- Don't show empty state with a "Refresh" button as the only action — refresh won't change the state; an "add" action will.

## Loading states

### First load (initial render)

Show **skeleton placeholders** matching the shape of the eventual list. Cite [knowledge/patterns/ux-guidelines.md](ux-guidelines.md).

```
┌──────────────────────────────────────────────────┐
│  ▢▢▢       ▔▔▔▔▔▔▔▔▔                            │   ← shimmer animation
│              ▔▔▔▔▔▔                              │
├──────────────────────────────────────────────────┤
│  ▢▢▢       ▔▔▔▔▔▔▔▔▔▔                           │
│              ▔▔▔▔▔                               │
└──────────────────────────────────────────────────┘
```

- 3–5 skeleton items.
- Shimmer animation: 1500ms loop, linear easing.
- Match the actual layout's heights — no jumping when real data arrives.
- Stop shimmer immediately when data arrives.

### Pagination load (load-more)

Inline spinner at the bottom:

```
┌──────────────────────────────────────────────────┐
│ ... existing items ...                          │
├──────────────────────────────────────────────────┤
│             ⏳ 더 불러오는 중...                  │
└──────────────────────────────────────────────────┘
```

### Refresh (already-loaded list)

Use the platform's native refresh indicator (RefreshControl). Don't replace existing items with skeletons during refresh.

## Error states

```
┌──────────────────────────────────────────────────┐
│                                                  │
│             ⚠ 불러오기에 실패했어요               │
│             네트워크 연결을 확인하고                 │
│             다시 시도해주세요.                      │
│                                                  │
│              [다시 시도]                           │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Specific message ("네트워크 연결을 확인" not "오류 발생").
- Retry action.
- For pagination errors: inline at the bottom, not full-screen.

## Swipe actions (mobile)

iOS-native pattern. Swipe left on a list item reveals trailing actions:

```
[item content                     ]   ← drag right-to-left
                  → [Archive] [Delete]
```

| Action position | Use |
| --- | --- |
| Trailing (right) — destructive | Delete, Remove, Archive |
| Trailing (right) — non-destructive | Mark read, Pin, Mute |
| Leading (left) | Quick positive action (Mark unread, Star) |

### Rules

- Swipe-to-delete must show a confirmation. Don't delete on first swipe — that's destructive without explicit confirm.
- Provide visible action button as a fallback (long-press menu, kebab `⋮`). Never gate destructive actions behind ONLY swipe — discoverability fails for new users and accessibility.
- Swipe affordance hint: on first list view, briefly reveal the action color on the rightmost ~10% of an item, then settle. Once per session.

### Implementation

- iOS: `UITableView` swipe actions are native.
- Android: not a native pattern — Material 3 deprecated swipe-to-dismiss. Use long-press → contextual action bar.
- RN: libraries like `react-native-gesture-handler` Swipeable.

## Section headers

For grouped lists (chat by date, transactions by date, contacts by initial):

```
─── 어제 ─────────────────────────────────────────
[item]
[item]

─── 5월 5일 ──────────────────────────────────────
[item]
```

| Spec | Notes |
| --- | --- |
| Sticky | Header stays at top of viewport while scrolling within its section |
| Style | Smaller text (12–13px), uppercase or bold, color `--color-text-tertiary` |
| Background | Often subtle bg `--color-bg-subtle` to differentiate from items |
| Spacing | More space above (16–24px) than between items |

## Dividers

| Style | Use |
| --- | --- |
| Hairline (1px `--color-divider`) | Default between similar items |
| Inset (skip leading visual) | When items have leading icons/avatars — divider starts after icon column |
| Heavy (4–8px gap, no line) | Between major sections |
| None | When items already have card backgrounds (cards in a list) |

## Long press

Long-press (500ms+) opens a contextual action menu. Common in:
- Chat (message → react, copy, reply, forward, delete)
- Photo grid (tap to select, long-press to enter selection mode)
- Item in a list with multiple actions

### Don't

- Don't make long-press the only path to a destructive action — too easy to trigger accidentally.
- Don't use long-press for primary action (it has a 500ms delay; users feel the lag).

## Accessibility

- Lists are `<ul>`/`<ol>` (web). RN lists are read by screen readers as collections.
- Items are `<li>` (web). RN: each item should have `accessibilityRole="button"` if interactive.
- Long lists: announce count and position. "Item 5 of 142."
- Empty state: announce on render (`aria-live="polite"`).
- Loading: announce ("Loading"). On data arrive: announce result count.
- Pull-to-refresh: announce when refresh starts and when complete.
- Skeleton loaders: don't announce as "loading loading loading" — set `aria-hidden="true"` on skeletons; announce loading state once at container level.

## Performance

For lists > 50 items on mobile, virtualization is mandatory:
- RN: `FlatList` (not `ScrollView`).
- Web: `react-window` or `@tanstack/react-virtual`.
- Native iOS/Android: `UITableView` / `RecyclerView` are virtualized natively.

Don't render 1,000 items in a `ScrollView`. Frame drops, memory issues, scroll lag.

## Cross-reference

- [knowledge/patterns/money-and-amount.md](money-and-amount.md) — transaction list specifics
- [knowledge/patterns/mobile-navigation.md](mobile-navigation.md) — search lists
- [knowledge/patterns/ux-guidelines.md](ux-guidelines.md) — skeleton loading conventions
- [knowledge/platforms/react-native.md](../platforms/react-native.md) — FlatList performance, RefreshControl
- [knowledge/a11y/keyboard-and-focus.md](../a11y/keyboard-and-focus.md) — list keyboard navigation
