# `DialogContentText` — spec

> Synthesized from MUI `DialogContentText`. The descriptive paragraph inside `DialogContent`. Provides the accessible *description* for the dialog via `aria-describedby` association.

## When to use

- Inside every Dialog whose body has explanatory text.
- Pair with `aria-describedby` on the parent Dialog.

## API

```tsx
<Dialog aria-labelledby="t" aria-describedby="d">
  <DialogTitle id="t">정말 삭제할까요?</DialogTitle>
  <DialogContent>
    <DialogContentText id="d">
      이 작업은 되돌릴 수 없어요.
    </DialogContentText>
  </DialogContent>
  <DialogActions>...</DialogActions>
</Dialog>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | Required for `aria-describedby` association on parent Dialog |
| `children` | `ReactNode` | — | Description text |

Extends `Typography` — all typography props work.

## Tokens consumed

```
--font-size-body
--color-fg-muted          /* slightly less prominent than primary content */
--line-height-body
```

## Accessibility

- Without matching `aria-describedby` on the parent Dialog, the description is just visual — screen readers won't connect it.
- For dialogs with multiple paragraphs, only one needs the `id` (the most informative). Or wrap multiple paragraphs in a `<div id="d">` and put `id` on that.

## Edge cases

- **Long description** — wraps. For multi-paragraph, use multiple `<Typography>` children with one outer container holding the `id`.
- **Markdown links inside** — inline links work; ensure they're keyboard-accessible (focus moves to them inside the trapped dialog).
- **Korean honorific** — match the title's register. Confirmation: 합쇼체 ("되돌릴 수 없습니다"). Friendly: 해요체 ("되돌릴 수 없어요").

## Code example

```tsx
<DialogContent>
  <DialogContentText id="leave-desc">
    저장하지 않은 변경사항이 있어요.{' '}
    <Link href="/help/auto-save" target="_blank" onClick={(e) => e.stopPropagation()}>
      자동 저장이 켜져 있나요?
    </Link>
  </DialogContentText>
</DialogContent>
```

## Don't

- Don't omit `id` — defeats `aria-describedby`.
- Don't use as a generic paragraph — for non-described body text, use `<Typography>`.

## References

- MUI: [`DialogContentText`](../refs/mui/packages/mui-material/src/DialogContentText/)

## Cross-reference

- [`component-dialog.md`](component-dialog.md)
- [`component-dialog-title.md`](component-dialog-title.md)
- [`component-dialog-content.md`](component-dialog-content.md)
