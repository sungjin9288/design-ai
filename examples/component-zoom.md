# `Zoom` — spec

> Synthesized from MUI `Zoom`. Transition primitive — wraps a child to fade-and-zoom in / out on mount / unmount. Sibling to `Fade`, `Grow`, `Slide`, `Collapse`.

## When to use

- Floating action button entrance / exit.
- Modal / Popover entrance.
- Notification card entrance.
- Anywhere "zoom + fade" feels right (vs "slide" or "fade").

When NOT to use:
- Page transitions (use `Slide` or fade).
- Scroll-into-view animations (use `ScrollReveal`).

## API

```tsx
<Zoom in={open} timeout={250}>
  <div className="floating-content">
    Content here
  </div>
</Zoom>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `in` | `boolean` | required | Show / hide trigger |
| `timeout` | `number \| { enter, exit }` | `225` | Ms |
| `easing` | `string \| { enter, exit }` | per Material | CSS easing |
| `appear` | `boolean` | `false` | Animate on first mount |
| `mountOnEnter` | `boolean` | `false` | Don't render until first true |
| `unmountOnExit` | `boolean` | `false` | Remove from DOM after exit |

## CSS

```css
.zoom-enter { transform: scale(0); opacity: 0; }
.zoom-enter-active {
  transform: scale(1); opacity: 1;
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
              opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.zoom-exit { transform: scale(1); opacity: 1; }
.zoom-exit-active {
  transform: scale(0); opacity: 0;
  transition: transform 195ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .zoom-enter-active, .zoom-exit-active {
    transition: none;
  }
}
```

## Tokens consumed

```
--motion-medium                   (default duration)
--ease-out
```

## Code example — FAB entrance

```tsx
<Zoom in={!loading} appear>
  <SpeedDial ariaLabel="새로 만들기" icon={<PlusIcon />}>
    <SpeedDial.Action ... />
  </SpeedDial>
</Zoom>
```

## Don't

- Don't zoom large content (jarring). Use Fade for big surfaces.
- Don't zoom from `scale(0.01)` to `scale(1)` — exits feel wrong. Stay near full scale (0.7-1).
- Don't ignore reduced motion.

## References

- MUI: [`Zoom`](../docs/reference/mui.md#zoom)
- Material Design: motion easing

## Cross-reference

- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md)
- [`examples/component-spinner.md`](component-spinner.md)
