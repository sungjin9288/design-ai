# `DialogActions` — spec

> Synthesized from MUI `DialogActions`. The action row at the bottom of a `Dialog`. Right-aligns buttons by default; primary action goes last (right-most) so it gets the user's reading-direction emphasis.

## When to use

- Inside every interactive `Dialog` — confirmation, form submission, choice prompts.
- For non-blocking inline confirmations, prefer `Popconfirm` instead of opening a Dialog.

## Anatomy

```
┌────────────────────────────────────────────┐
│            [ Cancel ]   [ Primary ]        │
└────────────────────────────────────────────┘
```

Korean / Western convention: cancel on the left, primary on the right. macOS / iOS native convention is reversed (primary on the right is consistent across both, but cancel position varies). Match your platform target.

## API

```tsx
<DialogActions>
  <Button onClick={handleClose}>취소</Button>
  <Button onClick={handleConfirm} variant="contained" autoFocus>
    삭제
  </Button>
</DialogActions>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Action buttons |
| `disableSpacing` | `boolean` | `false` | Remove default 8px gap between buttons |

## States

Non-interactive itself. Buttons own their states.

## Button order convention

| Convention | Order (left → right) |
| --- | --- |
| Web / Material / Korean apps | Cancel · Primary |
| iOS native (sheet style) | Cancel · Primary (primary highlighted) |
| Windows native | Primary · Cancel |
| Linux GNOME native | Cancel · Primary |

For Korean B2C / B2B apps, use **Cancel · Primary** (matches Toss / KakaoBank / NaverPay convention).

For destructive primary actions (e.g., 삭제), use `color="error"` on the primary button + place it in the same right-most position. Don't move it to the left to "discourage" — users learn one position; consistency matters more than friction.

## Tokens consumed

```
--space-sm        /* gap between buttons */
--space-md        /* container padding */
```

## Accessibility

- The primary action should have `autoFocus` (so Enter activates it without keyboard nav).
- For destructive primary actions, consider NOT auto-focusing — require explicit click. Cite [`knowledge/patterns/empty-states.md`](../knowledge/patterns/empty-states.md) (the same pattern applies to confirmation flows).
- Tab order: cancel → primary (matches visual order).
- Esc must trigger cancel (handled at the `Dialog` level, not here).

## Edge cases

- **3-button choice** — left: tertiary action ("나중에"); middle: cancel; right: primary. Avoid 4+ buttons — split into a multi-step flow.
- **Loading primary** — disable both cancel and primary while pending; show spinner on primary. Don't allow cancel during destructive operations that can't actually be undone.
- **Mobile narrow widths** — buttons can wrap to two rows. Test at 320px width.

## Code example

```tsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle id="delete-title">정말 삭제할까요?</DialogTitle>
  <DialogContent>
    <DialogContentText>이 작업은 취소할 수 없어요.</DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>취소</Button>
    <LoadingButton
      onClick={handleDelete}
      loading={isPending}
      variant="contained"
      color="error"
    >
      삭제
    </LoadingButton>
  </DialogActions>
</Dialog>
```

## Don't

- Don't put 4+ buttons — confusing.
- Don't reverse the order to discourage destructive actions — users learn one order; consistency matters more.
- Don't omit a clear cancel — every dialog needs a way out (Esc + at least one button).

## References

- MUI: [`DialogActions.d.ts`](../refs/mui/packages/mui-material/src/DialogActions/DialogActions.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-dialog.md`](component-dialog.md)
- [`component-dialog-title.md`](component-dialog-title.md)
- [`component-dialog-content.md`](component-dialog-content.md)
- [`component-button.md`](component-button.md)
