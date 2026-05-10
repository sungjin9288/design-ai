# `Dialog` — spec

> Synthesized from Ant Design `Modal` + MUI `Dialog`. The flagship modal primitive — focus-trapped, esc-closeable, scroll-locked overlay containing structured content (title, body, actions). Used for confirmations, focused tasks, and content too important to dismiss inline.

## When to use

- Confirmations with destructive consequences ("Delete?", "Leave without saving?").
- Focused short tasks that pull the user out of context (invite, schedule, single-step config).
- Critical disclosures the user must acknowledge.

## When NOT to use

- Long forms (5+ fields) → use a dedicated page.
- Optional info → use a Tooltip / Popover / Sheet.
- Errors that don't block flow → use Toast / Snackbar.

## Anatomy

```
┌─[scrim]─────────────────────────────────────┐
│                                             │
│   ┌──────────────────────────────────┐      │
│   │ DialogTitle              [✕]     │      │
│   ├──────────────────────────────────┤      │
│   │ DialogContent                    │      │
│   │   DialogContentText (optional)   │      │
│   │   form fields / list / image     │      │
│   ├──────────────────────────────────┤      │
│   │           [Cancel] [Primary]     │      │
│   └──────────────────────────────────┘      │
│                                             │
└─────────────────────────────────────────────┘
```

## API

```tsx
<Dialog
  open={open}
  onClose={handleClose}
  fullWidth
  maxWidth="sm"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <DialogTitle id="dialog-title">팀원 초대</DialogTitle>
  <DialogContent>
    <DialogContentText id="dialog-desc">
      이메일로 초대 링크를 보내요.
    </DialogContentText>
    <TextField autoFocus fullWidth label="이메일" />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>취소</Button>
    <Button onClick={handleSend} variant="contained">보내기</Button>
  </DialogActions>
</Dialog>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | required | Controlled open state |
| `onClose` | `(e, reason) => void` | — | Called on backdrop click / Esc / close button |
| `fullWidth` | `boolean` | `false` | Stretch to `maxWidth` |
| `maxWidth` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| false` | `'sm'` | Width cap |
| `fullScreen` | `boolean` | `false` | Full viewport (mobile) |
| `scroll` | `'paper' \| 'body'` | `'paper'` | `paper`: content scrolls inside; `body`: page scrolls |
| `disableEscapeKeyDown` | `boolean` | `false` | Block Esc — use sparingly |
| `aria-labelledby` | `string` | — | Required; matches DialogTitle's `id` |
| `aria-describedby` | `string` | — | Required when there's body description; matches DialogContentText's `id` |
| `TransitionComponent` | `Component` | `Fade` | Custom enter/exit transition |
| `keepMounted` | `boolean` | `false` | Keep DOM after close (state preservation) |

## States

| State | Visual |
| --- | --- |
| Closed | Not in DOM (or `display: none` if `keepMounted`) |
| Opening | Scrim fades in (200ms); dialog scales/fades from 90% to 100% |
| Open | Focus trapped inside; scroll locked on body; backdrop receives Esc |
| Closing | Reverse of opening; restore focus to opener |

## Tokens consumed

```
--scrim-bg              /* black/40 light, black/60 dark */
--dialog-bg             /* surface elevated */
--dialog-radius
--dialog-shadow         /* elevation-md */
--dialog-max-width-sm   /* 444 */
--dialog-max-width-md   /* 600 */
--dialog-max-width-lg   /* 900 */
--space-md              /* internal padding */
--motion-duration-200
--motion-easing-out
```

## Accessibility

- Focus trap: Tab cycles within dialog only. First focus goes to first interactive element (or `autoFocus` button).
- Escape closes (unless `disableEscapeKeyDown`).
- Scroll lock: body scroll disabled while dialog open.
- `role="dialog"` + `aria-modal="true"` (MUI sets these).
- `aria-labelledby` + `aria-describedby` MUST be set; otherwise screen readers announce just "dialog".
- On close: focus returns to the element that opened the dialog.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Backdrop click ambiguity** — `onClose` fires with `reason='backdropClick'`. For destructive flows (unsaved changes), confirm before actually closing.
- **Nested dialogs** — possible but discouraged. If unavoidable: focus trap moves to the inner one, restores correctly on close.
- **Mobile fullscreen** — set `fullScreen={isMobile}` (e.g., `useMediaQuery('(max-width:600px)')`) so dialogs fill the small viewport instead of cramping.
- **Korean honorific** — title 합쇼체 for confirmations ("삭제하시겠습니까?"); 해요체 for friendly modals ("초대 보내볼까요?"). Cite [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md).
- **Long content** — set `scroll="paper"` (default) and pair `dividers` on `DialogContent` to signal scrollability.

## Code example

```tsx
function DeleteConfirmDialog({ open, onClose, onConfirm, isPending }) {
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' && isPending) return; // block during pending
        onClose();
      }}
      aria-labelledby="del-title"
      aria-describedby="del-desc"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="del-title">정말 삭제할까요?</DialogTitle>
      <DialogContent>
        <DialogContentText id="del-desc">
          이 작업은 되돌릴 수 없어요.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <LoadingButton
          onClick={onConfirm}
          loading={isPending}
          color="error"
          variant="contained"
        >
          삭제
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
```

## Don't

- Don't disable Esc unless the flow truly requires explicit confirmation.
- Don't put 4+ buttons in DialogActions — overflow into a menu or split into steps.
- Don't open a dialog from a dialog (nested) without strong reason.
- Don't make the dialog dismissable during a destructive operation that's actually running.
- Don't omit `aria-labelledby` — the dialog has no accessible name without it.

## References

- Ant Design: [`Modal`](../refs/ant-design/components/modal/) — class API, mask
- MUI: [`Dialog`](../refs/mui/packages/mui-material/src/Dialog/) — flagship reference

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-dialog-title.md`](component-dialog-title.md)
- [`component-dialog-content.md`](component-dialog-content.md)
- [`component-dialog-actions.md`](component-dialog-actions.md)
- [`component-dialog-content-text.md`](component-dialog-content-text.md)
- [`component-modal.md`](component-modal.md) — Ant-flavor modal
- [`knowledge/patterns/empty-states.md`](../knowledge/patterns/empty-states.md) — confirmation patterns
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
