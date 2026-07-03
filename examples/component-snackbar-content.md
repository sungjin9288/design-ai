# `SnackbarContent` — spec

> Synthesized from MUI `SnackbarContent`. The default visual surface inside a `Snackbar` — message text + optional action button. Use for custom Snackbars beyond the simple message-string case.

## When to use

- Snackbars with rich content (icon + text + action button).
- Inline banners that look like Snackbars but live in-page (rare).
- For simple toasts, `Snackbar message="..."` auto-renders SnackbarContent — no direct use needed.

## API

```tsx
<Snackbar open={open} onClose={handleClose}>
  <SnackbarContent
    message="저장됐어요"
    action={
      <Button color="inherit" size="small" onClick={handleUndo}>
        실행 취소
      </Button>
    }
  />
</Snackbar>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `message` | `ReactNode` | — | The message |
| `action` | `ReactNode` | — | Action button (right-aligned) |
| `role` | `string` | `'alert'` | ARIA role |

## Tokens consumed

```
--snackbar-bg            /* dark surface (high-contrast for floating ephemeral UI) */
--snackbar-fg
--snackbar-padding
--snackbar-radius
--snackbar-shadow-md
```

## Accessibility

- Default `role="alert"` makes the message announce to screen readers immediately on appear.
- Use `role="status"` for less-urgent updates ("저장 중...").
- Action button's accessible name comes from its label — keep concise (1-2 words).

## Edge cases

- **Korean message brevity** — Snackbars auto-dismiss in ~5s; keep messages short ("저장됐어요" not "변경사항이 성공적으로 저장됐습니다").
- **Multiple actions** — limit to 1 action; if more needed, use a Dialog instead.
- **Long messages** — wrap to 2 lines max.

## Code example

```tsx
<Snackbar
  open={state.open}
  autoHideDuration={5000}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <SnackbarContent
    message={
      <Stack direction="row" alignItems="center" gap={1}>
        <CheckCircleIcon fontSize="small" aria-hidden />
        <span>저장됐어요</span>
      </Stack>
    }
    action={
      <Button color="inherit" size="small" onClick={handleUndo}>
        실행 취소
      </Button>
    }
  />
</Snackbar>
```

## Don't

- Don't use for errors that block flow — those are Dialogs.
- Don't pile multiple Snackbars on screen — at most one at a time.

## References

- MUI: [`SnackbarContent`](../docs/reference/mui.md#snackbar-content)

## Cross-reference

- [`component-snackbar.md`](component-snackbar.md)
- [`component-alert.md`](component-alert.md)
- [`component-toast.md`](component-toast.md)
