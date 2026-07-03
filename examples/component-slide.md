# `Slide` — spec

> Synthesized from MUI `Slide`. Transition primitive that slides a child in / out from a specified direction. Sibling to `Fade`, `Zoom`, `Grow`, `Collapse`.

## When to use

- Drawer / Sheet entrance (slides from edge).
- Toast / Snackbar entrance (slides up from bottom).
- Sequential reveals on scroll-into-view.

## API

```tsx
<Slide direction="up" in={open} mountOnEnter unmountOnExit>
  <div className="card">
    Content
  </div>
</Slide>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `in` | `boolean` | required | Show / hide |
| `direction` | `"up" \| "down" \| "left" \| "right"` | `"down"` | Slide-from direction |
| `timeout` | `number \| { enter, exit }` | `225` | Ms |
| `easing` | `string \| { enter, exit }` | per Material | CSS easing |
| `appear` | `boolean` | `false` | Animate on first mount |
| `mountOnEnter` / `unmountOnExit` | `boolean` | `false` | DOM mount control |

## CSS

```css
.slide-up-enter {
  transform: translateY(100%);
}
.slide-up-enter-active {
  transform: translateY(0);
  transition: transform 250ms var(--ease-out);
}
.slide-up-exit-active {
  transform: translateY(100%);
  transition: transform 195ms var(--ease-out);
}
```

Direction variants flip the translate axis.

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .slide-* { transition: none; }
}
```

## Tokens consumed

```
--motion-medium
--ease-out
```

## Code example — bottom sheet entrance

```tsx
<Slide in={open} direction="up" mountOnEnter unmountOnExit>
  <div className="bottom-sheet">
    <SheetContent />
  </div>
</Slide>
```

## Don't

- Don't slide horizontally large amounts on narrow viewports — content invisible mid-transition.
- Don't ignore reduced motion.
- Don't combine Slide with Fade and Zoom together — pick one motion idiom.

## References

- MUI: [`Slide`](../docs/reference/mui.md#slide)
- Material Design motion

## Cross-reference

- [`examples/component-zoom.md`](component-zoom.md)
- [`examples/component-sheet.md`](component-sheet.md) — uses slide internally
- [`examples/component-drawer.md`](component-drawer.md) — uses slide internally
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md)
