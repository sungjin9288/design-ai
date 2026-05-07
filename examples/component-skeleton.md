# `Skeleton` — spec

> Citing Ant Design `Skeleton`, MUI `Skeleton`, shadcn-ui `skeleton`

## Purpose

A placeholder rendered while content loads. Shows the **shape** of what's coming — title bar, paragraph lines, image, etc. Reduces perceived load time and prevents layout shift when the real content arrives.

## When Skeleton vs Spinner

| Use Skeleton | Use Spinner |
| --- | --- |
| First load of a screen (we know the shape) | Async action with no shape (form submit, API call) |
| List of items where each item has a known structure | Indeterminate "thinking" state |
| Component with predictable layout | Inline loading on a button |

For pagination or refresh of an existing list: **don't replace items with skeletons**. Show a small inline spinner. Keep the loaded data.

## Anatomy — primitives

A Skeleton is composed from three primitive shapes:

```
Text line:    ▔▔▔▔▔▔▔▔▔▔▔▔▔
Block:        ▢▢▢▢
Circle:       ◯
```

```tsx
<Skeleton variant="text" width="80%" />
<Skeleton variant="rect" width={120} height={120} />
<Skeleton variant="circle" size={48} />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"text" \| "rect" \| "circle"` | `"text"` | Shape |
| `width` | `string \| number` | `"100%"` (text) | Pixels or CSS unit |
| `height` | `string \| number` | scaled to text size | |
| `size` | `number` | — | Convenience for circle (W=H) |
| `lines` | `number` | `1` | For variant="text" — render N lines |
| `animation` | `"shimmer" \| "pulse" \| "none"` | `"shimmer"` | |

## Composition for higher-level shapes

Build screen-specific skeletons by composing primitives:

```tsx
// Card skeleton
<Card>
  <Skeleton variant="rect" height={160} />   {/* hero image */}
  <Card.Body>
    <Skeleton variant="text" width="60%" />   {/* title */}
    <Skeleton variant="text" width="100%" />  {/* desc line 1 */}
    <Skeleton variant="text" width="80%" />   {/* desc line 2 */}
  </Card.Body>
</Card>

// List item skeleton
<div className="flex gap-3 py-3">
  <Skeleton variant="circle" size={40} />     {/* avatar */}
  <div className="flex-1">
    <Skeleton variant="text" width="40%" />   {/* name */}
    <Skeleton variant="text" width="80%" />   {/* preview */}
  </div>
</div>
```

For frequent shapes, expose a higher-level skeleton: `<Skeleton.Card />`, `<Skeleton.ListItem />`.

## Animation

| Animation | Look | Use |
| --- | --- | --- |
| `shimmer` (default) | Diagonal gradient sweeps left → right, 1500ms loop linear | Universal — most polished |
| `pulse` | Opacity 0.5 → 1 fade-pulse | Calmer, less attention-grabbing |
| `none` | Static | Reduced-motion mode, or when many skeletons are on screen |

Implement shimmer as:
```css
.skeleton {
  background: linear-gradient(90deg, var(--color-bg-subtle), var(--color-bg-elevated), var(--color-bg-subtle));
  background-size: 200% 100%;
  animation: shimmer 1500ms linear infinite;
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## States

The Skeleton itself doesn't have states — it's a placeholder. The transition is from skeleton → real content.

### Transition rules

- Show skeleton immediately on mount when waiting for data.
- If data arrives in < 200ms: never show skeleton. (Avoid flicker.)
- If data arrives in 200–600ms: showing skeleton helps perceived speed.
- If data arrives in > 600ms: skeleton is **essential**.
- On data arrive: skeleton unmounts, real content appears. Match heights to prevent layout shift.

```tsx
{isLoading ? <Skeleton.Card /> : <ProductCard data={data} />}
```

## Tokens consumed

```
--color-bg-subtle              (skeleton base)
--color-bg-elevated            (shimmer highlight)
--radius-sm                     (text shape)
--radius-md                     (rect shape)
--radius-full                   (circle shape)
```

## Accessibility

- Wrap a group of skeletons in `aria-busy="true"` with `aria-label="Loading"`.
- The skeletons themselves can be `aria-hidden="true"` — they don't add information for screen readers.
- **Don't** announce "loading loading loading" for each skeleton. One container-level announcement.
- When data loads, remove `aria-busy` and announce result if helpful (`role="status"` with `"5 results loaded"`).

```tsx
<div aria-busy={isLoading} aria-live="polite" aria-label={isLoading ? "Loading transactions" : undefined}>
  {isLoading ? (
    <>
      <Skeleton.ListItem />
      <Skeleton.ListItem />
      <Skeleton.ListItem />
    </>
  ) : (
    <TransactionList items={data} />
  )}
</div>
```

## Reduced motion

Honor `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
```

The skeleton still renders (showing layout); just no animation.

## Edge cases

- **Skeleton matched to wrong content shape**: real content arrives, layout shifts. Bug. Always preview the skeleton vs the real component.
- **Skeleton everywhere**: a page entirely of skeletons feels slow even at fast TTI. Try to render at least the page chrome (header, nav) immediately and skeleton only the data area.
- **Skeleton inside a Skeleton**: don't nest. Compose at the outer level.
- **Skeleton on a dark mode card**: token `--color-bg-subtle` is darker than `--color-bg-default` in dark mode — confirm visibility.
- **Variable-width text**: skeleton width should approximate the average. 60% / 80% / 100% mix reads natural.

## Don't

- Don't show a skeleton for < 200ms. The flicker is worse than briefly-empty.
- Don't show a skeleton on user actions (button clicks). Use a button loading state.
- Don't replace existing data with skeletons during refresh — keep stale data + show subtle progress.
- Don't ship without `prefers-reduced-motion` handling.
- Don't use skeletons as decorative loading bars. They're for content shape.

## References

- Ant Design: [`refs/ant-design/components/skeleton/`](../refs/ant-design/components/skeleton/) — most exhaustive: `Skeleton.Avatar`, `Skeleton.Button`, `Skeleton.Image`, `Skeleton.Input`, `Skeleton.Node`. Pre-composed shapes for common components.
- MUI: [`refs/mui/packages/mui-material/src/Skeleton/`](../refs/mui/packages/mui-material/src/Skeleton/) — primitive only. Composition is up to the consumer.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/skeleton.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/skeleton.tsx) — minimal Tailwind-based primitive.

## Cross-reference

- [knowledge/patterns/list-and-feed.md](../knowledge/patterns/list-and-feed.md) — list-loading patterns
- [knowledge/patterns/ux-guidelines.md](../knowledge/patterns/ux-guidelines.md) — broader loading-state rules
