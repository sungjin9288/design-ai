# `Popconfirm` — spec

> Synthesized from Ant Design `Popconfirm`. An inline confirmation popover triggered by a button — lightweight alternative to `AlertDialog` for in-place destructive actions.

## Popconfirm vs AlertDialog

| | Popconfirm | AlertDialog |
| --- | --- | --- |
| Surface | Popover anchored to trigger | Centered modal |
| Use | Quick confirm of inline action | Full-stop destructive action |
| Visual weight | Light | Heavy |
| Backdrop | None | Yes |
| Focus trap | No | Yes |

For "are you sure?" on a small inline button: Popconfirm.
For account deletion / unrecoverable destructive: AlertDialog.

## Anatomy

```
[Delete]
   ↓ click
   ┌─────────────────────┐
   │ ⚠  정말 삭제할까요? │
   │ [취소] [삭제]        │
   └─────────────────────┘
```

## API

```tsx
<Popconfirm
  title="이 항목을 삭제할까요?"
  description="삭제한 항목은 복구할 수 없어요."
  onConfirm={handleDelete}
  okText="삭제"
  cancelText="취소"
  okButtonProps={{ variant: "destructive" }}
>
  <Button>삭제</Button>
</Popconfirm>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | required | Confirmation question |
| `description` | `string` | — | Optional consequence detail |
| `onConfirm` | `() => void \| Promise<void>` | — | Confirm callback |
| `onCancel` | `() => void` | — | Cancel callback |
| `okText` | `string` | "OK" / "확인" | Confirm button label |
| `cancelText` | `string` | "Cancel" / "취소" | Cancel button label |
| `okButtonProps` | Button props | — | Style confirm button (e.g., variant="destructive") |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` (with -start / -end) | `"top"` | Popover position |
| `icon` | `ReactNode` | warning icon | Custom icon |

## States

| State | Visual |
| --- | --- |
| Closed | Trigger button only |
| Open | Popover with title + description + buttons |
| Loading (async confirm) | OK button shows spinner; both disabled |
| Closing | Fade-out 150ms |

## Async confirm

```tsx
<Popconfirm
  title="삭제할까요?"
  onConfirm={async () => {
    await api.delete(id);  // popconfirm shows loading on OK button
    toast.success("삭제됐어요");
  }}
>
  <Button>삭제</Button>
</Popconfirm>
```

## Tokens consumed

Inherits from Popover:
```
--popover-bg
--popover-fg
--popover-border
--popover-shadow
--popover-icon-warning
--radius-md
--space-sm, --space-md
--motion-fast
--z-overlay
```

## Accessibility

- `role="dialog"` (or `alertdialog`) on the Popover content.
- `aria-labelledby` references title; `aria-describedby` references description.
- Focus moves to OK button on open.
- Esc closes (cancels).
- Click outside cancels.
- For destructive actions: prefer `AlertDialog` — focus trap + backdrop give the user a more deliberate moment.

## Code example — list item delete with Popconfirm

```tsx
function ItemRow({ item }: Props) {
  return (
    <Item>
      <ItemContent>{item.name}</ItemContent>
      <ItemActions>
        <Popconfirm
          title="삭제할까요?"
          description={`"${item.name}"을(를) 영구적으로 삭제해요.`}
          onConfirm={() => api.delete(item.id)}
          okText="삭제"
          cancelText="취소"
          okButtonProps={{ variant: "destructive" }}
        >
          <IconButton aria-label="삭제">
            <TrashIcon />
          </IconButton>
        </Popconfirm>
      </ItemActions>
    </Item>
  );
}
```

## Don't

- Don't use Popconfirm for high-stakes destructive (account deletion). Use AlertDialog.
- Don't omit description for non-obvious consequences.
- Don't auto-confirm without explicit click. Popconfirm IS the confirmation.
- Don't pile up confirmations (one Popconfirm at a time per surface).

## References

- Ant: [`Popconfirm`](../docs/reference/ant-design.md#popconfirm)

## Cross-reference

- [`examples/component-alert-dialog.md`](component-alert-dialog.md) — heavier modal alternative
- [`examples/component-popover.md`](component-popover.md) — base primitive
- [`examples/component-toast.md`](component-toast.md) — for "deleted, with Undo" pattern (alternative)
