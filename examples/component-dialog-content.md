# `DialogContent` — spec

> Synthesized from MUI `DialogContent`. The body region of a `Dialog`. Holds the descriptive text + any form controls between the title and the action row.

## When to use

- Inside every `Dialog` that has body content beyond a single title.
- For long forms inside a dialog — but reconsider: long forms usually belong on a page, not a modal.

## Anatomy

```
┌────────────────────────────────────────────┐
│ Title (DialogTitle)                        │
├────────────────────────────────────────────┤
│ Content (DialogContent)                    │
│   - DialogContentText (optional)           │
│   - form controls / list / image           │
├────────────────────────────────────────────┤
│ Actions (DialogActions)                    │
└────────────────────────────────────────────┘
```

## API

```tsx
<DialogContent dividers>
  <DialogContentText>안내 본문</DialogContentText>
  <TextField label="이메일" fullWidth />
</DialogContent>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Body content |
| `dividers` | `boolean` | `false` | Top + bottom divider lines (use when content scrolls) |

## States

Non-interactive itself. Children own their states.

## Scrolling

When content overflows: `DialogContent` becomes the scrollable region (not the whole dialog). Set `dividers` to add visual cues that more content exists above/below the fold.

For a long-content dialog: `Dialog` with `scroll="paper"` (default) and `dividers` on `DialogContent`.

## Tokens consumed

```
--color-fg-default
--color-divider
--space-md
```

## Accessibility

- The first descendant text node should provide context — pair with `DialogContentText` whose `id` matches `aria-describedby` on the parent `Dialog`.
- Focus management: when the dialog opens, focus should move to the first interactive control inside `DialogContent` (or to the cancel button if there's no input). Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Form submission via Enter** — wrap content in `<form>`; `Enter` should trigger the primary action button. Don't auto-submit forms with destructive primary actions.
- **Korean text density** — leave 24-32px horizontal padding (`space-md`) so Hangul doesn't feel cramped. 16px is too tight for Korean.
- **Image-only content** — provide alt text or describe via `aria-describedby`.

## Code example

```tsx
<Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
  <DialogTitle id="invite-title">팀원 초대</DialogTitle>
  <DialogContent dividers>
    <DialogContentText id="invite-desc">
      이메일 주소를 입력하면 초대 링크가 발송돼요.
    </DialogContentText>
    <TextField
      autoFocus
      margin="dense"
      label="이메일"
      type="email"
      fullWidth
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>취소</Button>
    <Button onClick={handleSend} variant="contained">초대 보내기</Button>
  </DialogActions>
</Dialog>
```

## Don't

- Don't pack the dialog with 5+ form fields — split into a multi-step pattern or move to a page.
- Don't put the primary action *inside* `DialogContent` — it belongs in `DialogActions` for keyboard-traversal predictability.

## References

- MUI: [`DialogContent.d.ts`](../docs/reference/mui.md#dialog-content)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-dialog.md`](component-dialog.md)
- [`component-dialog-title.md`](component-dialog-title.md)
- [`component-dialog-actions.md`](component-dialog-actions.md)
