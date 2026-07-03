# `Fade` — spec

> Synthesized from MUI `Fade`. Opacity-only enter/exit transition. The lightest motion primitive — for elements that should appear/disappear without movement (Dialogs' default scrim, Tooltip enter, conditional content).

## When to use

- Mounting/unmounting content where motion would distract.
- Default transition for Modal / Dialog backdrops.
- Conditional hide/show of inline content (e.g., loading spinner appearing while data fetches).

## When NOT to use

- Page transitions → use `Slide` (directional context).
- Stack-of-cards scenarios → use `Grow` (origin-aware scale).
- Anything where reduced-motion users would still feel jolted (very-small fades are fine; full-screen white-flash fades are not).

## API

```tsx
<Fade in={open} timeout={200}>
  <Box>Mounted only when in=true (or with mountOnEnter/unmountOnExit)</Box>
</Fade>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `in` | `boolean` | required | Trigger enter/exit |
| `timeout` | `number \| { enter, exit }` | `{ enter: 225, exit: 195 }` | Duration in ms |
| `easing` | `string \| { enter, exit }` | theme default | CSS easing |
| `addEndListener` | `(node, done) => void` | — | Custom transition-end logic |
| `appear` | `boolean` | `true` | Animate on initial mount |
| `mountOnEnter` | `boolean` | `false` | Don't render until first `in=true` |
| `unmountOnExit` | `boolean` | `false` | Remove from DOM after exit |

## Tokens consumed

```
--motion-duration-200         /* default ~225ms ≈ 200 token */
--motion-easing-out
--motion-easing-in
```

## Accessibility

- Respect `prefers-reduced-motion`. MUI's transitions auto-disable when the user has the system preference set (returns immediately to final state).
- For decorative fades, no aria; for content that becomes meaningful (e.g., error message), pair with `aria-live="polite"` on the destination so the screen reader reads it.
- Keep timeout under 250ms to avoid feeling sluggish.

## Edge cases

- **Long timeouts** — > 400ms feels slow. For elaborate enters, prefer `Grow` or stage with a stagger.
- **Reduced-motion users** — verified-correct: MUI snaps to final state. Don't override unless intentional.
- **Mount + immediate `in=true`** — without `appear=true` (the default), the first render skips animation. Set `appear={false}` to disable.

## Code example

```tsx
<Fade in={!isLoading} unmountOnExit>
  <List>...</List>
</Fade>

// Loading + content swap
<Box position="relative">
  <Fade in={isLoading} unmountOnExit>
    <CircularProgress sx={{ position: 'absolute', inset: 0, m: 'auto' }} />
  </Fade>
  <Fade in={!isLoading}>
    <DataTable rows={rows} />
  </Fade>
</Box>
```

## Don't

- Don't use for fully reusable elements that frequently mount/unmount — adds runtime cost.
- Don't fade-in critical alerts — they should appear immediately.

## References

- MUI: [`Fade`](../docs/reference/mui.md#fade)

## Cross-reference

- [`component-grow.md`](component-grow.md)
- [`component-slide.md`](component-slide.md)
- [`component-zoom.md`](component-zoom.md)
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md)
