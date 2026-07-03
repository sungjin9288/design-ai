# `AlertDialog` — spec

> Synthesized from shadcn-ui `alert-dialog` (Radix). Modal confirmation dialog for actions that require explicit user acknowledgment. Distinct from `Modal` (general-purpose) and `Toast` (transient).

## When to use

- **Destructive actions** that can't be undone: "Delete account?", "Discard unsaved changes?"
- **Significant state changes**: "Cancel subscription?", "Sign out everywhere?"
- **Critical confirmations** in payment / financial flows.

When NOT to use:
- Routine confirmations (use Toast with undo instead).
- Form submissions (let the form's submit button speak for itself).
- Loading / progress (use Modal or Toast).

## AlertDialog vs Modal vs Toast

| | AlertDialog | Modal | Toast |
| --- | --- | --- | --- |
| Cancellable via Esc / outside-click | **Yes for cancel; no destructive default** | Yes | n/a |
| Default focus | Cancel button | First focusable | n/a |
| Use | Destructive confirmation | Forms, settings, content | Transient feedback |
| Backdrop click | Closes (= cancel) | Closes (= dismiss) | n/a |

The key behavioral difference: AlertDialog defaults focus to **Cancel** so accidental Enter doesn't fire a destructive action.

## Anatomy

```
┌──────────────────────────────────┐
│                                  │
│  ⚠  Delete this project?          │   ← title with icon
│                                  │
│  This will permanently delete    │   ← description
│  the project and all its data.   │
│  This action cannot be undone.   │
│                                  │
│       [Cancel] [Delete]          │   ← Cancel default focus
│        ↑                         │
│   default focus                  │
└──────────────────────────────────┘
```

## API

```tsx
<AlertDialog>
  <AlertDialog.Trigger asChild>
    <Button variant="destructive">Delete project</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete this project?</AlertDialog.Title>
      <AlertDialog.Description>
        This will permanently delete the project and all its data.
        This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onClick={handleDelete}>
        Delete
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>
```

## Composition

| Part | Purpose |
| --- | --- |
| `Trigger` | Element that opens the dialog |
| `Content` | The modal panel |
| `Header` | Title + description region |
| `Title` | Heading; identifies the question |
| `Description` | Explanation of consequences |
| `Footer` | Action row |
| `Cancel` | Safe / dismissive action (default focus) |
| `Action` | Confirming / destructive action |

## States

| State | Visual |
| --- | --- |
| Closed | Hidden |
| Opening | Backdrop fade + content scale (200ms) |
| Open | Visible, focus on Cancel, body scroll locked |
| Action loading | Action button shows spinner; both buttons disabled |
| Closing | Reverse |

## Tokens consumed

```
--color-bg-overlay-scrim           (backdrop)
--color-bg-default                 (dialog bg)
--color-fg-default
--color-error-default              (destructive variant title icon + Action)
--color-warning-default            (warning variant)
--shadow-overlay
--radius-lg
--space-md, --space-lg
--motion-medium
--ease-out
--z-overlay
```

## Accessibility

- `Content`: `role="alertdialog"` (NOT `dialog`) — interrupts screen readers.
- `aria-labelledby` references `Title`.
- `aria-describedby` references `Description`.
- **Focus trap on open**; focus defaults to `Cancel` (the safe option).
- `Esc` triggers `Cancel` (not `Action`).
- Backdrop click triggers `Cancel`.
- `Enter` on focused button activates that button (default = Cancel = safe).
- Touch target ≥ 44pt for both buttons.

## Korean conventions

```
삭제하시겠습니까?

이 프로젝트와 관련된 모든 데이터가 영구적으로 삭제되며,
복구할 수 없습니다.

[취소]  [삭제]
```

- 합쇼체 typical for destructive confirmations ("...하시겠습니까?")
- 해요체 OK for casual brand voice ("...할까요?")
- "취소" for Cancel; "삭제" / "확인" / "동의" for Action
- Avoid "OK" / "예" alone — use a verb that names the action

## Code example

```tsx
function DeleteProjectButton({ project }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteProject(project.id);
      toast.success("프로젝트가 삭제되었습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive">
          <TrashIcon /> 프로젝트 삭제
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>이 프로젝트를 삭제하시겠습니까?</AlertDialog.Title>
          <AlertDialog.Description>
            <strong>{project.name}</strong> 및 관련된 모든 데이터가
            영구적으로 삭제되며, 복구할 수 없습니다.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel disabled={loading}>취소</AlertDialog.Cancel>
          <AlertDialog.Action
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive"
          >
            {loading ? "삭제 중..." : "삭제"}
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
```

## Edge cases

- **Async action with error**: keep dialog open after error; show inline error message; let user retry or cancel.
- **Action requires more context**: pre-fill Description with consequence detail (file count, last edit date, undoable for X days).
- **Multi-step destructive flow**: chain AlertDialogs OR convert to a wizard with summary at end.
- **Type-to-confirm pattern** (delete repo on GitHub): replace simple Cancel/Action with a text input requiring exact name match.
- **Stacking**: avoid AlertDialog inside AlertDialog. Sequence them or rethink flow.
- **RTL**: button order reverses (Action left, Cancel right) per RTL convention.
- **Reduced motion**: skip scale animation; instant.

## Don't

- Don't use AlertDialog for routine confirmations — use Toast with Undo for delete-with-undo flows.
- Don't make Action the default-focused button. Cancel is safer.
- Don't omit the Description for destructive actions. Users need consequence info.
- Don't use vague labels like "OK / Cancel". Name the action ("Delete project").
- Don't auto-close after Action without showing success feedback (Toast / inline).
- Don't disable Esc — accessibility requires it.

## References

- shadcn-ui: [`alert-dialog`](../docs/reference/shadcn-ui.md#alert-dialog) (Radix)
- WAI-ARIA: [`alertdialog`](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)

## Cross-reference

- [`examples/component-modal.md`](component-modal.md) — general-purpose modal
- [`examples/component-toast.md`](component-toast.md) — transient feedback (with Undo)
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
