# `BackTop` — spec

> Synthesized from Ant Design `BackTop`. Floating "scroll to top" button that appears after the user scrolls past a threshold. Pairs with long-content pages.

## When to use

- Long content pages (articles, feeds, dashboards) where users scroll far.
- Mobile particularly (more painful to scroll back).

When NOT to use:
- Short pages (< 1.5 viewport heights).
- Scroll-snap pages where each snap is a "section" (different nav pattern).

## Anatomy

```
[content]
[content]
[content]
[content]
[content]
                       [↑]   ← appears after scroll past threshold
[content]
```

## API

```tsx
<BackTop
  visibilityHeight={400}
  duration={500}
  onClick={() => track("back-to-top")}
>
  <button className="back-top-button">↑</button>
</BackTop>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `visibilityHeight` | `number` | `400` | Px scrolled before button appears |
| `duration` | `number` | `450` | Ms for smooth-scroll-up animation |
| `target` | `() => HTMLElement` | window | Scrollable container |
| `onClick` | `() => void` | — | Custom callback |

## States

| State | Visual |
| --- | --- |
| Hidden (scroll < threshold) | Not rendered / fade-out |
| Visible | Floating button bottom-right; subtle shadow |
| Hover | Subtle bg shift |
| Pressed | Scrolling animation in progress |

## Position + tokens

Bottom-right anchor; safe-area-aware for iOS.

```
--back-top-bg
--back-top-fg
--back-top-shadow
--back-top-size                  (40-48px)
--space-md                       (offset from edges)
--motion-medium                  (fade + scroll)
--ease-out
--z-fab
```

## Accessibility

- `<button aria-label="페이지 맨 위로 이동">`.
- Smooth scroll respects `prefers-reduced-motion` (instant scroll if reduced).
- Focus visible.
- Keyboard: Home key also scrolls to top in many browsers; BackTop is a visual affordance, not a replacement.

## Code example

```tsx
<BackTop visibilityHeight={600}>
  <button
    className="back-top-button"
    aria-label="맨 위로"
  >
    <ArrowUpIcon />
  </button>
</BackTop>
```

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Replace smooth scroll with instant jump */
}
```

JS:
```js
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
```

## Korean conventions

- 맨 위로 / 위로 / 처음으로 — typical labels (해요체 OK).
- For Korean B2C: chevron arrow icon usual; some apps use full-text "맨 위로" in narrow strip.

## Don't

- Don't show BackTop on short pages — visual noise.
- Don't omit `aria-label`.
- Don't override scroll behavior without reduced-motion check.
- Don't auto-fire scroll without user click.

## References

- Ant: [`BackTop`](../refs/ant-design/components/back-top)
- Native: `window.scrollTo({ behavior: "smooth" })`

## Cross-reference

- [`examples/component-float-button.md`](component-float-button.md)
- [`examples/component-affix.md`](component-affix.md) — sticky positioning sibling
