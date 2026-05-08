<!-- hand-written -->
# `EmptyState` (custom — no-data + filtered-empty + first-run shell) — spec

> One component for every "nothing here" surface in the product. Pairs with [`knowledge/illustration/spot-illustrations.md`](../knowledge/illustration/spot-illustrations.md).

## Purpose

Most apps have 5-15 empty surfaces (no projects yet, no search results, no notifications, filter shows nothing, error reduced to empty). Without a single component, each team hand-rolls one and they drift.

`EmptyState` enforces:
1. **One layout** — illustration + headline + description + CTA stack.
2. **One illustration source** — pulls from the system's spot-illustration set.
3. **Voice consistency** — encouraging, not pitying.
4. **Accessibility** — illustration is decorative; meaning lives in text.

## Anatomy

```
┌────────────────────────────────────────┐
│                                        │
│           [illustration]               │  ← optional; 120-200px
│                                        │
│      찾으시는 결과가 없어요              │  ← headline
│  다른 키워드로 검색해 보세요              │  ← description
│                                        │
│         [Primary CTA]                  │  ← optional
│         [Secondary link]               │  ← optional
└────────────────────────────────────────┘
```

## API

```tsx
<EmptyState
  illustration="search-empty"
  title="찾으시는 결과가 없어요"
  description="다른 키워드로 검색해 보세요."
  primaryAction={{ label: "검색 초기화", onClick: clearFilters }}
  secondaryAction={{ label: "도움말 보기", href: "/help" }}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `illustration` | `string \| ReactNode` | `undefined` | Name from illustration registry (e.g., `"search-empty"`) OR custom node. Omit for compact variant. |
| `title` | `string` | — | Headline. Required. |
| `description` | `string \| ReactNode` | — | One-sentence explanation. Optional. |
| `primaryAction` | `{ label: string; onClick?: () => void; href?: string; loading?: boolean }` | — | Main CTA. Optional. |
| `secondaryAction` | `{ label: string; onClick?: () => void; href?: string }` | — | Secondary link / button. Optional. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Visual scale; affects illustration + spacing |
| `align` | `"center" \| "start"` | `"center"` | Center for full-page; start for inline-in-card |
| `variant` | `"default" \| "subtle" \| "card"` | `"default"` | Visual treatment |

## Variants

### `default`

Full vertical stack with illustration. Used for primary empty surfaces.

### `subtle` (no illustration)

Compact — title + description + actions only. For inline empty (within a panel, drawer, or small card).

### `card`

Wrapped in a bordered card. Used when the empty state sits next to populated cards (visual consistency).

## Sizes

| size | Illustration | Title | Padding |
| --- | --- | --- | --- |
| `sm` | 80px (or none) | 16px / 600 | `--space-md` |
| `md` (default) | 120-160px | 20px / 600 | `--space-lg` |
| `lg` | 200-240px | 24px / 600 | `--space-xl` |

Choose by surface size, not importance:
- Inline within a small card: `sm`
- Standard empty page: `md`
- Onboarding / splash / first-run: `lg`

## States

| State | Visual |
| --- | --- |
| Default | Illustration + title + description + actions |
| Loading (CTA loading) | Primary CTA shows spinner; rest unchanged |
| Compact (inline) | `subtle` variant; no illustration |
| Truly empty (no actions, no description) | Title only — rare; means user can't act anyway |

## Illustration registry

`EmptyState` doesn't render arbitrary SVG. It pulls from a registry keyed by name:

```ts
// illustrations/empty-state-registry.ts
export const emptyStateIllustrations = {
  "search-empty": SearchEmptyIllustration,
  "filter-empty": FilterEmptyIllustration,
  "no-projects": NoProjectsIllustration,
  "no-notifications": NoNotificationsIllustration,
  "no-transactions": NoTransactionsIllustration,
  "no-bookmarks": NoBookmarksIllustration,
} as const;

export type EmptyStateIllustration = keyof typeof emptyStateIllustrations;
```

This forces the team to add an illustration intentionally (TypeScript catches typos) and keeps the registry as a single source of truth.

For one-off custom illustrations, pass a node directly:

```tsx
<EmptyState illustration={<MyCustomSVG />} title="..." />
```

But prefer extending the registry over passing custom nodes ad-hoc.

## Voice rules

| Tone | ✓ | ✗ |
| --- | --- | --- |
| Encouraging | "첫 거래를 시작해 보세요" | "거래 내역이 없습니다" |
| Specific | "다른 키워드로 검색해 보세요" | "결과가 없습니다" |
| Honest about state | "아직 알림이 없어요" | "받은 알림이 없습니다 (0개)" |
| Action-oriented | CTA: "프로젝트 만들기" | CTA: "확인" |

For Korean fintech: 해요체 (~해요) is friendlier, 합쇼체 (~합니다) is formal. Toss leans 해요체; KakaoBank mixes; banks lean 합쇼체. Default to 해요체 for empty / encouraging moments.

## Tokens consumed

```
--color-text-primary         (title)
--color-text-secondary       (description)
--color-fg-muted             (illustration accent — via currentColor)
--color-bg-default           (default variant bg)
--color-bg-subtle            (subtle / card variant bg)
--space-md, --space-lg, --space-xl
--radius-md                  (card variant)
--font-size-base, --font-size-lg, --font-size-xl
--font-weight-semibold       (title)
--max-width-prose            (description max-width for readability)
```

## Accessibility

- Illustration is **decorative** by default: rendered with `aria-hidden="true"`. The title + description carry meaning.
- If illustration is the only conveyance (rare; only when no text accompanies): pass `illustrationLabel` prop to set `role="img" aria-label="..."`.
- Title is `<h2>` by default; configurable via `as="h3"` for nested contexts.
- Empty state should NOT use `role="alert"` or `aria-live` — it's not an alert, just a layout.
- Primary action gets focus on initial render in modal contexts (matches focus management of the parent modal).
- Touch targets ≥ 44pt for action buttons.

## Code example

```tsx
function ProjectsScreen() {
  const { data: projects, isLoading, isError, error } = useProjects();
  const [filters, setFilters] = useFilters();

  if (isLoading) return <ProjectsSkeleton />;
  if (isError) return <ErrorState error={error} />;

  if (projects.length === 0 && filters.isEmpty) {
    // First-run empty
    return (
      <EmptyState
        size="lg"
        illustration="no-projects"
        title="첫 프로젝트를 시작해 보세요"
        description="프로젝트를 만들면 팀과 함께 작업할 수 있어요."
        primaryAction={{ label: "프로젝트 만들기", onClick: openCreateProject }}
        secondaryAction={{ label: "예제 살펴보기", href: "/examples" }}
      />
    );
  }

  if (projects.length === 0) {
    // Filter-induced empty
    return (
      <EmptyState
        illustration="filter-empty"
        title="필터에 맞는 프로젝트가 없어요"
        description="필터 조건을 바꾸거나 초기화해 보세요."
        primaryAction={{ label: "필터 초기화", onClick: () => setFilters({}) }}
      />
    );
  }

  return <ProjectsList projects={projects} />;
}
```

## Layout (CSS)

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-lg);
  gap: var(--space-md);
}

.empty-state[data-align="start"] {
  align-items: flex-start;
  text-align: left;
}

.empty-state[data-variant="card"] {
  background: var(--color-bg-default);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
}

.empty-state[data-variant="subtle"] {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
}

.empty-state__illustration { color: var(--color-brand-default); }
.empty-state__title { font-size: var(--font-size-lg); font-weight: 600; }
.empty-state__description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  max-width: var(--max-width-prose);
}
.empty-state__actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}
```

## Edge cases

- **Description longer than 2 lines**: truncate or break into 2 sentences. EmptyState is not a long-form explanation. If you need that, link to docs / help.
- **Both primary + secondary actions**: layout horizontally on desktop, stacked on mobile.
- **No illustration registered**: fall back to a generic neutral illustration (`generic-empty`). Don't render the wrapper at illustration size 0.
- **Loading state inside CTA**: pass `loading: true` to action; button shows spinner; rest of EmptyState is unchanged.
- **RTL**: layout mirrors automatically via `text-align: start`. Illustrations should be flippable or center-symmetric.
- **Dark mode**: illustrations theme via `currentColor` + CSS variables. Test all illustrations in dark.
- **Reduced motion**: if illustration is animated (Lottie), show static frame. See [`examples/component-lottie-player.md`](component-lottie-player.md).

## Don't

- Don't use `EmptyState` for errors. That's `ErrorState`. Different voice, different illustration.
- Don't put 3+ CTAs. Primary + secondary max. More choices = paralysis.
- Don't write descriptions longer than one sentence.
- Don't omit the title. "Empty" is unhelpful; "First time? Try X" is helpful.
- Don't put a mascot doing the same pose in every empty state. Vary the illustration.
- Don't over-celebrate. "Welcome! No projects yet 🎉" is wrong. The user has nothing yet — guide them.

## References

Patterns drawn from:
- shadcn/ui — no built-in EmptyState, but recipe in docs
- Mantine `Center + Stack + Text + Button` pattern
- Ant Design `Empty` component (close upstream match)
- Toss / KakaoBank empty-state patterns

## Cross-reference

- [`knowledge/illustration/spot-illustrations.md`](../knowledge/illustration/spot-illustrations.md) — illustration rules
- [`knowledge/illustration/illustration-systems.md`](../knowledge/illustration/illustration-systems.md) — system foundation
- [`examples/component-illustration.md`](component-illustration.md) — generic illustration display
- [`examples/component-result.md`](component-result.md) — success / error variants (different concern)
- [`examples/component-lottie-player.md`](component-lottie-player.md) — animated empty illustrations
- [`knowledge/i18n/korean-document-style.md`](../knowledge/i18n/korean-document-style.md) — 해요체 vs 합쇼체
