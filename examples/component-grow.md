# `Grow` — spec

> Synthesized from MUI `Grow`. Scale + fade transition — element grows from a transform origin point. Used for menus, popovers, tooltips that should appear "from" their anchor.

## When to use

- Menus / popovers anchored to a button.
- Tooltips with a discoverable origin.
- Cards that emerge from a "+" floating action button.

## API

```tsx
<Grow in={open} style={{ transformOrigin: '0 0 0' }} timeout={200}>
  <Paper>Menu items</Paper>
</Grow>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `in` | `boolean` | required | Trigger enter/exit |
| `timeout` | `number \| 'auto' \| { enter, exit }` | `'auto'` | `'auto'` computes from element size |
| `easing` | `string \| { enter, exit }` | theme default | CSS easing |
| `mountOnEnter` | `boolean` | `false` | |
| `unmountOnExit` | `boolean` | `false` | |
| `style` | `CSSProperties` | — | Set `transformOrigin` to control where it grows from |

## Tokens consumed

```
--motion-duration-auto
--motion-easing-out
```

## Accessibility

- Same as `Fade`: respects `prefers-reduced-motion`.
- For menus, ensure focus moves into the menu after enter (auto via `MenuList autoFocusItem`).

## Edge cases

- **transformOrigin missing** — defaults to center. For menus anchored top-left, set `transformOrigin: '0 0 0'`. For floating-action menus, `'100% 100%'`.
- **`timeout='auto'`** — MUI computes duration from element height (longer for taller). Good default; override only for tight UI.

## Code example

```tsx
<Popper open={open} anchorEl={anchorEl} transition placement="bottom-start">
  {({ TransitionProps }) => (
    <Grow {...TransitionProps} style={{ transformOrigin: '0 0 0' }}>
      <Paper>
        <ClickAwayListener onClickAway={handleClose}>
          <MenuList autoFocusItem>
            <MenuItem>편집</MenuItem>
            <MenuItem>삭제</MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Paper>
    </Grow>
  )}
</Popper>
```

## Don't

- Don't grow from `center` for menus — feels detached from the anchor.
- Don't combine with `Slide` on the same element — pick one direction of motion.

## References

- MUI: [`Grow`](../refs/mui/packages/mui-material/src/Grow/)

## Cross-reference

- [`component-fade.md`](component-fade.md)
- [`component-slide.md`](component-slide.md)
- [`component-zoom.md`](component-zoom.md)
- [`component-popper.md`](component-popper.md)
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md)
