# `Affix` (sticky positioning) — spec

> Citing Ant Design `Affix`, MUI (no dedicated — use CSS `position: sticky`), shadcn-ui (CSS only)
>
> Mostly **a CSS pattern** in modern browsers. The Affix component wraps that pattern with React-friendly props (target scroll container, offset, callbacks).

## Purpose

Makes an element stick to a position (top of viewport, scroll container) as the user scrolls past it. Used for: sticky table headers, sticky CTAs, side panels that lock to top, sub-navigation bars.

## When Affix vs CSS `position: sticky`

| Scenario | Use |
| --- | --- |
| Element follows viewport on scroll | CSS `position: sticky` (native, no JS) |
| Element follows viewport with **callback** when sticky toggles | Affix component (or write custom IntersectionObserver) |
| Element sticks within a **specific container** (not page) | Affix or scoped sticky |
| Sticky inside a Modal that has its own scroll | Affix with `target` prop |

For 80% of cases, native CSS is the right answer:

```css
.sticky-header {
  position: sticky;
  top: 0;
  background: var(--color-bg-default);
  z-index: 10;
}
```

This works in all modern browsers, no JavaScript, no perf cost. **Reach for the Affix component only when** you need:
- Container-scoped sticky (not page-scroll)
- Callbacks on stick / unstick
- Programmatic offset adjustment

## Anatomy

The Affix wraps a child element. It positions normally until the user scrolls past a threshold, then it sticks to the configured position.

```
[normal scroll position]
  ┌───────────────────────┐
  │ Affixed element       │  ← scrolls naturally with page
  └───────────────────────┘
  [content below]

[user scrolls down]
  ┌───────────────────────┐
  │ Affixed element       │  ← stays at top of viewport (or container)
  └───────────────────────┘
  [content scrolls behind]
```

## API

```tsx
<Affix offsetTop={0} onChange={(affixed) => setIsSticky(affixed)}>
  <SubNavBar />
</Affix>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The element to affix |
| `offsetTop` | `number` | `0` | Px from top when sticky |
| `offsetBottom` | `number` | — | Alternative: stick to bottom |
| `target` | `() => HTMLElement` | window | Scroll container (for inner scroll cases) |
| `onChange` | `(affixed: boolean) => void` | — | Fires on stick/unstick |

## Behavior

- Element renders in flow normally.
- As user scrolls, Affix watches the scroll position.
- When the element's natural top reaches `offsetTop`, it switches to `position: fixed` (or `sticky`) at that offset.
- When user scrolls back up past the threshold, it returns to flow.

In practice: Ant's Affix uses `position: sticky` under the hood for modern browsers, falling back to `position: fixed` + scroll listener for older.

## Use cases

### 1. Sticky sub-navigation

```tsx
<Affix offsetTop={64}>  {/* Below a 64px main nav */}
  <SubNav />
</Affix>
```

The sub-nav scrolls with the page until it hits the main nav, then sticks below.

### 2. Sticky table header

For long tables, the header should stay visible:

```tsx
<table className="sticky-header">
  <thead>...</thead>
  <tbody>...</tbody>
</table>

/* Or in CSS: */
table thead { position: sticky; top: 0; z-index: 1; }
```

CSS-only is preferred here.

### 3. Sticky form CTA on mobile

```tsx
<Affix offsetBottom={0}>
  <div className="footer-cta">
    <Button fullWidth>저장</Button>
  </div>
</Affix>
```

The CTA sticks to the bottom of viewport. On mobile, this is the canonical pattern for primary form actions.

### 4. Sticky filter sidebar in scrollable container

```tsx
<div ref={containerRef} className="overflow-auto h-screen">
  <Affix target={() => containerRef.current!}>
    <FilterPanel />
  </Affix>
  <Results />
</div>
```

The filter sticks within the container (not viewport).

## Sizes / states

Affix doesn't have its own visual states — it transparently relays the wrapped element. Visual decisions (shadow, background, border) belong to the wrapped element when it becomes sticky.

A common pattern: add a subtle border/shadow only when sticky:

```tsx
<Affix onChange={setIsSticky}>
  <div className={isSticky ? "sticky-with-shadow" : ""}>
    <SubNav />
  </div>
</Affix>
```

```css
.sticky-with-shadow {
  box-shadow: 0 1px 0 var(--color-border-default), 0 4px 12px rgba(0,0,0,0.04);
}
```

This hints "I've moved; you scrolled" without screaming.

## Tokens consumed

Affix itself doesn't consume tokens. The wrapped element does. For sticky-specific styling:

```
--color-bg-default          (sticky element bg, often opaque to hide content behind)
--color-border-default      (subtle separator when sticky)
--shadow-card                (subtle shadow when sticky)
--z-sticky                   (z-index above page content)
```

## Accessibility

Affix is purely visual — no a11y implications beyond what the wrapped element provides. Keyboard navigation continues normally.

If the affixed element is interactive (buttons in a sticky CTA bar): standard focus rules apply.

For sticky **alerts / banners**: respect `prefers-reduced-motion` and don't animate the stick transition. The position change itself (relative to the viewport) doesn't violate motion preferences, but added animations should be optional.

## Don't

- Don't reach for Affix when CSS `position: sticky` works. Native is faster, lighter, and supported everywhere modern.
- Don't stick large blocks (>50% viewport height). They eat scroll space.
- Don't stack 3+ sticky elements (header + sub-nav + filter bar). The visible viewport shrinks.
- Don't forget background color on sticky elements — content scrolls behind, transparency = visual chaos.
- Don't auto-show sticky alerts that don't have a dismiss action — user is stuck with them.

## References

- Ant Design: [`refs/ant-design/components/affix/`](../docs/reference/ant-design.md#affix) — `Affix`. Wraps native sticky with React-friendly callbacks.
- MUI / shadcn-ui: no dedicated component. Use CSS `position: sticky`.

## Cross-reference

- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md) — broader layout patterns
- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md) — sticky bottom-tab-bar (similar pattern)
- [`examples/component-table.md`](component-table.md) — sticky table headers
