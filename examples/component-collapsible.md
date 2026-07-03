# `Collapsible` — spec

> Synthesized from shadcn-ui `collapsible` (Radix). The base primitive for any expand/collapse interaction. `Accordion` is a multi-instance manager built on top; `Collapsible` is the standalone single-instance version.

## When to use

- **Single expandable section** — e.g., "Show more details" toggle.
- **Optional content** that's hidden by default to reduce density.
- **As a primitive** for building Accordion, Disclosure, FAQ widgets.

When NOT to use:
- **Multi-section accordion** → use `Accordion`.
- **Modal / drawer / sheet content** — those are different patterns.
- **Persistent navigation** — keep nav always visible.

## Anatomy

```
[Trigger ▶ Show more]      (closed)

[Trigger ▼ Show less]      (open)
   Content panel revealed
   Multiple lines of content here.
```

## API

```tsx
<Collapsible defaultOpen={false} onOpenChange={track}>
  <Collapsible.Trigger asChild>
    <button className="trigger">
      <ChevronIcon className="data-[state=open]:rotate-90 transition-transform" />
      Show {open ? "less" : "more"}
    </button>
  </Collapsible.Trigger>
  <Collapsible.Content>
    <div className="content">
      {/* content here */}
    </div>
  </Collapsible.Content>
</Collapsible>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | controlled | Controlled state |
| `defaultOpen` | `boolean` | `false` | Uncontrolled initial state |
| `onOpenChange` | `(open: boolean) => void` | — | Callback |
| `disabled` | `boolean` | `false` | Disable trigger |

## Composition

| Part | Purpose |
| --- | --- |
| `Collapsible` | Wrapper / state holder |
| `Trigger` | The clickable element that toggles |
| `Content` | The collapsible panel |

## States

| State | Visual |
| --- | --- |
| Closed | Content hidden; Trigger shows "expand" affordance |
| Opening | Content height animates from 0 to natural |
| Open | Content visible; Trigger shows "collapse" affordance |
| Closing | Reverse animation |
| Disabled | Trigger unclickable, no events |

## Animation

The classic CSS challenge — `height: auto` doesn't animate. Modern approaches:

### CSS Grid trick (works in 2024+)

```css
.collapsible-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms var(--ease-out);
}
.collapsible-content[data-state="open"] {
  grid-template-rows: 1fr;
}
.collapsible-content > div {
  overflow: hidden;
}
```

`1fr` works as auto-height in grid. Animatable.

### CSS variable + JS measurement

```js
// On open: measure content; set CSS var; transition height to it
const height = content.scrollHeight;
content.style.setProperty('--height', `${height}px`);
content.dataset.state = 'open';

// On close: instant re-measure; transition to 0
```

```css
.collapsible-content {
  height: 0;
  overflow: hidden;
  transition: height 200ms var(--ease-out);
}
.collapsible-content[data-state="open"] {
  height: var(--height);
}
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .collapsible-content { transition: none; }
}
```

## Tokens consumed

```
--space-sm, --space-md       (content padding)
--motion-medium              (200ms transition)
--ease-out
```

Collapsible is structural; visual styling is on the children (Trigger + Content).

## Accessibility

- Use the **WAI-ARIA Disclosure pattern**:
  - Trigger: `<button aria-expanded="true|false" aria-controls="content-id">`.
  - Content: `<div id="content-id">` (no special role; just a region).
- `Enter` / `Space` toggles.
- Tab moves into Content's focusable items when open; skips when closed.
- Don't use `aria-hidden` on Content when closed — `display: none` (or grid 0fr) removes it from a11y tree natively.

## Code example — FAQ item

```tsx
function FAQItem({ question, answer }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="faq-item">
      <Collapsible.Trigger asChild>
        <button className="faq-trigger">
          <span>{question}</span>
          <ChevronIcon
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="faq-content">{answer}</div>
      </Collapsible.Content>
    </Collapsible>
  );
}
```

## Code example — "Show more" details

```tsx
function ProductDetails({ product }: Props) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div>
      <p>{product.shortDescription}</p>
      <Collapsible open={showMore} onOpenChange={setShowMore}>
        <Collapsible.Trigger asChild>
          <button className="link-button">
            {showMore ? "간단히 보기" : "자세히 보기"}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="details">
            <p>{product.longDescription}</p>
            <SpecsTable specs={product.specs} />
          </div>
        </Collapsible.Content>
      </Collapsible>
    </div>
  );
}
```

## Edge cases

- **Initial state on SSR**: pass `defaultOpen` matching server render to avoid hydration mismatch.
- **Content with focus on open**: don't auto-focus (Disclosure pattern doesn't trap focus); user tabs in naturally.
- **Animating content with images**: images may load AFTER initial measurement, causing height jumps. Use `content-visibility` or pre-load.
- **Nested Collapsible**: works; just style independently.
- **Long content**: scroll inside Content if exceeds reasonable height (cap with max-height).
- **Disabled while open**: keep open (or close, depending on UX); disable Trigger so user can't close.
- **Korean toggle labels**: "자세히 보기 / 간단히 보기", "더 보기 / 접기", or "펼치기 / 접기".

## Don't

- Don't use Collapsible for navigation menus — different a11y pattern (Menu).
- Don't omit visual rotate / chevron change — affords state.
- Don't put critical info inside (closed-by-default) without a visible summary.
- Don't animate longer than 300ms — feels slow for repeated toggles.
- Don't forget reduced motion.
- Don't use Collapsible for multi-instance accordion — that needs `Accordion`.

## References

- shadcn-ui: [`collapsible`](../docs/reference/shadcn-ui.md#collapsible) (Radix)
- WAI-ARIA: [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)

## Cross-reference

- [`examples/component-accordion.md`](component-accordion.md) — multi-section variant
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — height animation
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
