# `DialogTitle` — spec

> Synthesized from MUI `DialogTitle`. The header row of a `Dialog`. Provides the accessible name for the dialog via the `aria-labelledby` association.

## When to use

- Inside every `Dialog` (modal). The accessibility contract requires every modal to have a heading.
- For sheet / drawer headers, prefer the equivalent `<SheetTitle>` / `<DrawerHeader>` from those primitives — same role, different visual context.

## Anatomy

```
┌────────────────────────────────────────────┐
│ Title text                       [close ×] │
└────────────────────────────────────────────┘
```

The close button is typically rendered separately (often inside the title row via `position: absolute` or as a sibling); MUI's `DialogTitle` doesn't include one by default.

## API

```tsx
<Dialog open={open} onClose={handleClose} aria-labelledby="confirm-title">
  <DialogTitle id="confirm-title">정말 삭제할까요?</DialogTitle>
  <DialogContent>...</DialogContent>
  <DialogActions>...</DialogActions>
</Dialog>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | Required for `aria-labelledby` association on the parent `Dialog` |
| `children` | `ReactNode` | — | Title text; usually short (≤ 60 chars) |

`DialogTitle` extends `Typography` so all typography props (`variant`, `align`, `noWrap`, etc.) work.

## States

`DialogTitle` is non-interactive. Visual is constant.

## Tokens consumed

```
--color-fg-default
--font-size-xl       /* default; h2 equivalent */
--font-weight-semibold
--space-md           /* horizontal padding */
--space-md-y         /* vertical padding */
```

## Accessibility

- Semantic element: `<h2>` (default; via `Typography component="h2"`).
- The `id` MUST match the parent `Dialog`'s `aria-labelledby`.
- If the dialog also needs a description, use `<DialogContentText>` with `id` matching `aria-describedby`.
- For dialogs without a visible title (rare; e.g., image lightbox), provide an `aria-label` directly on the `Dialog` instead of `DialogTitle`.

## Edge cases

- **Long titles** — wrap to 2 lines max; truncating breaks comprehension. Prefer rephrasing.
- **Korean honorific level** — match the dialog's purpose. Confirmation: 합쇼체 ("정말 삭제하시겠습니까?"). Friendly action: 해요체 ("삭제할까요?"). Cite [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md).
- **No title with destructive action** — *don't*. Even simple confirms need a title for screen readers and reading order.

## Code example

```tsx
<Dialog
  open={open}
  onClose={handleClose}
  aria-labelledby="leave-title"
  aria-describedby="leave-desc"
>
  <DialogTitle id="leave-title">저장하지 않은 변경사항이 있어요</DialogTitle>
  <DialogContent>
    <DialogContentText id="leave-desc">
      페이지를 떠나면 변경사항이 사라져요. 계속할까요?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>머무르기</Button>
    <Button color="error" onClick={handleLeave} autoFocus>
      나가기
    </Button>
  </DialogActions>
</Dialog>
```

## Don't

- Don't omit `id` — without it, the dialog has no accessible name.
- Don't put a close button as `children` — render it as a sibling or via `position: absolute` so the heading text is the `<h2>` content.
- Don't write title as a question if the body answers — match cause & effect (title states the situation; body provides detail).

## References

- MUI: [`DialogTitle.d.ts`](../refs/mui/packages/mui-material/src/DialogTitle/DialogTitle.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-dialog.md`](component-dialog.md)
- [`component-dialog-content.md`](component-dialog-content.md)
- [`component-dialog-actions.md`](component-dialog-actions.md)
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md)
