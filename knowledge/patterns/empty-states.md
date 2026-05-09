<!-- hand-written -->
---
title: Empty states
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Empty states

An empty state is what users see when there's no data — first visit, all items deleted, no search results. It's a high-leverage screen: get it right and you guide the user forward; get it wrong and they bounce.

## The four types of empty

Different causes need different responses. Don't show one generic empty state for all four.

| Type | When | Tone | Primary CTA |
| --- | --- | --- | --- |
| **First-time / never had data** | New user, never created anything | Welcoming, instructional | "Add first <thing>" or "Get started" |
| **Cleared / all deleted** | User removed everything intentionally | Neutral, optionally celebratory | Restore option, or "Add new" |
| **Filtered to nothing** | User's search/filter excluded all data | Helpful | "Clear filters" + "Adjust criteria" |
| **No data after action** | User completed something, list now empty | Confirmation | "Add another" or navigate elsewhere |

The most-skipped distinction is **first-time** vs **filtered**. They look the same (empty list) but the response differs:
- First-time: "Welcome! Let's add your first project."
- Filtered: "No projects match 'archived'. Clear filters?"

## Anatomy

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              [illustration / icon]               │
│                                                  │
│           Title — what's empty                   │
│                                                  │
│       Description — why and what to do           │
│                                                  │
│           [Primary CTA]                          │
│                                                  │
│     (optional: secondary action or link)         │
│                                                  │
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Illustration / icon | recommended | Soft, friendly. Not a stock empty box. |
| Title | yes | What's empty (in user terms, ≤ 60 chars) |
| Description | yes | Why + what to do (1 sentence) |
| Primary CTA | usually | The action that fills the void |
| Secondary action | optional | "Learn more", "Watch tutorial", "Import data" |

## Copy guidelines

### Tone

| Context | Tone |
| --- | --- |
| Consumer mobile / casual | Friendly, slight enthusiasm |
| B2B / enterprise | Direct, helpful, no exclamation marks |
| Korean apps | Polite (존댓말), avoid casual slang |
| Fintech | Reassuring, professional |

### Title formulas

```
✓ "아직 거래 내역이 없어요"      [casual KR — friendly product]
✓ "거래 내역이 없습니다"          [polite KR — fintech/B2B]
✓ "No transactions yet"           [casual EN]
✓ "No transactions found"         [neutral EN]

✗ "Empty"                         [hostile, no context]
✗ "Oops!"                         [twee, content-free]
✗ "404"                           [technical jargon for empty]
```

### Description formulas

For first-time:
- "<Action> to start." — "Add your first project to get started."
- "<Outcome> when you <action>." — "Your transactions will appear here when you connect a bank account."

For filtered:
- "Try <alternative>" — "Try a different search term or clear filters."

For after-action:
- "<Confirmation>. <Next step>?" — "All caught up. Want to schedule the next sync?"

### Korean copy patterns

Per [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md):

| Type | Title | Description | CTA |
| --- | --- | --- | --- |
| First-time | "아직 등록된 항목이 없어요" | "첫 항목을 추가해 보세요." | "추가하기" |
| Filtered | "검색 결과가 없습니다" | "다른 검색어를 시도해 보세요." | "필터 초기화" |
| After-action | "모두 처리되었어요" | — | "새로 추가하기" |
| Network / can't load | "불러올 수 없어요" | "잠시 후 다시 시도해 주세요." | "다시 시도" (note: this is error, not empty — see error-states.md) |

## Illustration vs icon

| Use | When |
| --- | --- |
| Custom illustration | Brand-leading product, marketing-adjacent screens, flagship features |
| Stock icon (single, large) | Functional product, dense UIs, internal tools |
| Skeleton-like neutral shapes | Lightweight; avoids "decorative" feel |
| Nothing | Dense list views (just title + CTA centered) |

Custom illustrations should be:
- Single-line, single-color (matches brand)
- Soft / approachable (no harsh angles for empty states)
- ~80–120px in the empty area
- Same illustration style across the product (consistency)

Don't:
- Don't use sad / disappointed faces. Empty isn't a failure.
- Don't use generic stock illustrations from a vendor (Drag-along figures, paper-plane stuff). They date fast.
- Don't make the illustration so large it pushes the CTA below the fold.

## Layout

### Centered (most common)

```
[empty space above]
[illustration centered]
[title centered]
[description centered, max-width ~480px]
[CTA centered]
[empty space below]
```

Vertical centering in the parent container. Allow ~30% of viewport height above for visual breathing room.

### Inline / compact (small areas)

For empty states inside a card, sidebar, or small panel:

```
[icon + small title in one row]
[description below]
[link CTA]
```

Don't show an 80px illustration in a 200px-wide sidebar.

### Full-screen

For first-time onboarding contexts where the whole screen is "empty":
- Move CTA to the bottom (sticky on mobile).
- Add secondary actions (Skip, Learn more).
- Consider a Stepper if there's a multi-step path.

See [`knowledge/patterns/onboarding.md`](onboarding.md) for first-run patterns.

## States

| State | Shows when |
| --- | --- |
| Empty (first-time) | `data.length === 0 && !hasEverHadData` |
| Empty (filtered) | `data.length === 0 && filters.active` |
| Empty (cleared) | `data.length === 0 && hasEverHadData && !filters.active` |
| Loading | `isLoading && data.length === 0` — skeleton, not empty state |
| Error | `error` — separate file, see [`error-states.md`](error-states.md) |

**Don't conflate empty with loading.** During load, show skeleton. After load with no data, show the right empty type.

## CTA targeting

The CTA in an empty state should be the **single most likely next action** for that user in that context.

For first-time empty:
- "Add your first transaction" (primary action — populates the list)
- secondary: "Connect a bank account" (alternative path)

For filtered empty:
- "Clear filters" (primary — most likely intent)
- secondary: "Adjust search" (focuses the search input)

For after-action:
- "Add another" (continues the flow)
- secondary: "Done" or "Back to dashboard"

Avoid:
- Multiple primary CTAs (decision paralysis)
- Generic "Refresh" as the only CTA on first-time (doesn't load any new data)
- "Contact support" as primary on common empties

## Tokens consumed

```
--color-text-primary           (title)
--color-text-secondary         (description)
--color-bg-default
--color-primary-default        (CTA)
--space-xl, --space-2xl         (vertical breathing)
--font-size-xl                  (title)
--font-size-base                (description)
```

## Accessibility

- Title is a heading (`<h2>` or appropriate level for the page hierarchy).
- Empty state container: `role="status"` if dynamic (e.g., loaded async), so screen readers announce it on render.
- Illustrations: `aria-hidden="true"` (decorative) — title carries the meaning.
- CTA: standard button accessibility.

## Code example

```tsx
function TransactionList() {
  const { data, isLoading, error, filters } = useTransactions();

  if (isLoading && data.length === 0) return <SkeletonList />;
  if (error) return <ErrorState error={error} />;
  if (data.length === 0) {
    return (
      <EmptyState
        type={filters.active ? "filtered" : "first-time"}
        title={filters.active ? "검색 결과가 없습니다" : "아직 거래 내역이 없어요"}
        description={
          filters.active
            ? "다른 검색어를 시도해 보세요."
            : "첫 거래를 추가해 보세요."
        }
        action={
          filters.active
            ? { label: "필터 초기화", onClick: clearFilters }
            : { label: "거래 추가", onClick: openAddTransaction }
        }
      />
    );
  }

  return <List items={data} />;
}
```

## Edge cases

- **Empty after destructive action** (user just deleted last item): show a transient toast first ("3 items deleted"), then settle into the cleared empty state. Don't jump from "list" to "first-time empty" silently.
- **Empty during sync** (data is being fetched but takes time): show skeleton, not empty. Empty implies "we know there's nothing"; don't lie.
- **Permission-blocked empty** (user doesn't have access): different from regular empty — explain what would be there + how to request access. See [`error-states.md`](error-states.md) for permission errors.
- **Mobile**: less padding, less large illustration. Center on the visible area, not the full document.
- **Inside a paginated list**: empty state is page 1's empty. Don't show on page 5 of a paginated list — that's just "no more results", handle differently.

## Don't

- Don't ship a generic "No data" alone. Always include description + CTA.
- Don't use empty states for error states. Different message, different action.
- Don't use empty states with no CTA. Even "Refresh" is something. Stuck-in-empty is hostile.
- Don't use the same illustration for first-time and filtered — the meaning differs.
- Don't use marketing copy in empty states ("Welcome to the future of finance!"). Functional + warm.
- Don't auto-show onboarding modal on top of empty state. Pick one — overlay or inline.

## Cross-reference

- [`knowledge/patterns/error-states.md`](error-states.md) — when there's an error, not just empty
- [`knowledge/patterns/onboarding.md`](onboarding.md) — full first-run onboarding flow
- [`knowledge/patterns/list-and-feed.md`](list-and-feed.md) — list-level empty rendering
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean tone
