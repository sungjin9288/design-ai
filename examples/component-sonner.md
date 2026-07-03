# `Sonner` — spec

> Synthesized from shadcn-ui `sonner` (the Sonner library, by emilkowalski). The modern toast-of-choice in shadcn-based projects. Stacks beautifully, supports rich actions, promise wrappers.

## Sonner vs Toast vs Snackbar

Sonner is shadcn's recommended toast library, distinct from older toast / snackbar patterns:
- **Stacking**: cards stack with depth, expand on hover.
- **Promise wrapper**: `toast.promise(promise, { loading, success, error })`.
- **Rich content**: titles, descriptions, action + cancel buttons.
- **Sound** (optional): subtle confirmation chime.

For shadcn-based projects: use Sonner instead of writing custom Toast.

## Anatomy

```
                       ┌────────────────────────────┐
                       │ ✓ Saved successfully       │
                       │   Your changes are live.   │
                       │           [Undo] [Dismiss] │
                       └────────────────────────────┘
                       ┌────────────────────────────┐
                       │ Earlier toast (background)  │
                       └────────────────────────────┘
                          ↑ stack expands on hover
```

## API

```tsx
import { Toaster, toast } from "sonner";

// Once at app root:
<Toaster position="bottom-right" richColors />

// Anywhere:
toast.success("저장됐어요", {
  description: "변경 사항이 적용됐어요.",
  action: { label: "실행 취소", onClick: undo },
});

toast.error("저장 실패");
toast.info("새 알림");
toast.warning("연결 불안정");
toast.loading("처리 중...");
toast.promise(savePromise, {
  loading: "저장 중...",
  success: "저장됐어요",
  error: "저장 실패",
});

// Dismiss
const id = toast("Custom");
toast.dismiss(id);
toast.dismiss();  // all
```

## Toaster props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| "bottom-center" \| "bottom-right"` | `"bottom-right"` | Anchor |
| `richColors` | `boolean` | `false` | Use semantic colors (green success, red error) |
| `closeButton` | `boolean` | `false` | Show × on each toast |
| `expand` | `boolean` | `false` | Expand stack by default (instead of on hover) |
| `duration` | `number` | `4000` | Ms |
| `visibleToasts` | `number` | `3` | Max visible at once |
| `theme` | `"light" \| "dark" \| "system"` | `"system"` | Theme |
| `toastOptions` | `object` | — | Default options for all toasts |

## Per-toast options

| Field | Description |
| --- | --- |
| `description` | Subtitle text |
| `action` | `{ label, onClick }` — primary action |
| `cancel` | `{ label, onClick }` — secondary cancel |
| `duration` | Override default |
| `id` | For deduping / programmatic dismiss |
| `important` | Don't auto-dismiss |
| `icon` | Custom icon |

## Promise wrapper

```tsx
toast.promise(api.save(data), {
  loading: "저장 중...",
  success: (result) => `${result.title} 저장됨`,
  error: (err) => `저장 실패: ${err.message}`,
});
```

Single API replaces the manual `try { setLoading(true); ... } catch { ... }` flow. Sonner handles state transitions.

## States

| State | Visual |
| --- | --- |
| Pending (promise loading) | Spinner + loading text |
| Success | Green check + title + description |
| Error | Red X + title + description |
| Persistent (important) | No auto-dismiss |
| Stacked (idle) | Compressed visually |
| Stacked (hovered) | Expand to show all |

## Tokens consumed

```
--toast-bg                       (per severity)
--toast-fg
--toast-success / -error / -info / -warning  (richColors)
--toast-action-fg                (button)
--toast-shadow
--radius-md
--motion-medium                  (slide / expand)
--ease-out
--z-toast
```

## Accessibility

- Each toast: `role="status"` (success/info) or `role="alert"` (error).
- `aria-live` follows role.
- Keyboard: Tab can focus toast actions; Esc dismisses.
- Touch: swipe left/right to dismiss (mobile gesture).

## Code example — Korean fintech save flow

```tsx
async function handleSave() {
  toast.promise(
    api.saveTransaction(data),
    {
      loading: "결제 처리 중...",
      success: (result) => ({
        title: "결제가 완료되었어요",
        description: `${formatKRW(result.amount)} 결제 완료`,
        action: {
          label: "영수증 보기",
          onClick: () => navigate(`/receipts/${result.id}`),
        },
      }),
      error: (err) => `결제 실패: ${err.message}`,
    }
  );
}
```

## Don't

- Don't use Sonner for in-app errors that block user. Use AlertDialog.
- Don't queue 5+ toasts. Cap visible at 3.
- Don't autoHide < 3s for messages with actions. Users need time to act.
- Don't mix Sonner with another Toast library — pick one.

## References

- shadcn-ui: [`sonner`](../docs/reference/shadcn-ui.md#sonner)
- Sonner library by emilkowalski

## Cross-reference

- [`examples/component-toast.md`](component-toast.md)
- [`examples/component-snackbar.md`](component-snackbar.md)
