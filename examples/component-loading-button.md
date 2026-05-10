# `LoadingButton` (pattern) — spec

> **Pattern, not a separate component.** As of MUI v6, `LoadingButton` was merged into `Button` (`<Button loading>`); shadcn / Ant don't ship a separate "loading button" either. This spec documents the **loading-state pattern** that any `Button` should support — applied to `Button` props in your design system.

## When to use

- Any button that triggers an async operation (form submit, API call, file upload).
- Especially destructive actions (delete, leave, transfer) — without a loading state, users double-click and trigger duplicate operations.

## Anatomy

```
Default state              Loading state
┌─────────────────┐        ┌─────────────────┐
│ [icon]  Label   │   →    │ ⠋  Loading      │
└─────────────────┘        └─────────────────┘
```

The label may stay or change ("저장하기" → "저장 중..."). The leading icon is replaced with a spinner. The button stays the same width (loading shouldn't reflow the layout).

## API

Add these props to `Button`:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `loading` | `boolean` | `false` | Show spinner; disable click |
| `loadingPosition` | `'start' \| 'end' \| 'center'` | `'center'` | Spinner position; `start`/`end` keeps the label visible |
| `loadingIndicator` | `ReactNode` | `<CircularProgress size={16} />` | Custom indicator |
| `loadingText` | `string` | — | Optional label override during loading (e.g., "저장 중...") |

## States

| State | Visual | Interaction |
| --- | --- | --- |
| Default | Standard button | Clickable |
| Hover | bg-hover | Clickable |
| Loading | Spinner + label/loadingText; bg + fg muted slightly | **NOT clickable**; cursor remains pointer (signals "we got your click, working on it") |
| Disabled | reduced opacity | Not clickable |
| Loading + disabled | Same as loading | (functionally equivalent) |

## Tokens consumed

```
--button-bg-default
--button-bg-hover
--button-fg-default
--spinner-size-16    /* default loading indicator */
--space-sm           /* gap between spinner and label */
--button-min-width   /* width-locked during loading */
```

## Accessibility

- `aria-busy="true"` while loading. Screen readers announce "busy" status.
- `aria-disabled="true"` while loading (NOT the `disabled` HTML attribute — that removes the button from the tab order, breaks Esc/screen reader recovery).
- Focus stays on the button during loading. After completion, focus management depends on outcome:
  - Success: move focus to next logical step OR a success toast.
  - Error: announce the error via `aria-live="polite"` toast; keep focus on the button so user can retry.
- Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

## Edge cases

- **Long async operation (>10s)** — show progress percentage if known, or supplement with a toast "잠시만 기다려 주세요". 10s+ silent loading reads as broken.
- **Network failure** — exit loading, restore label, surface error inline or via toast. Don't leave the button in loading state on error.
- **Korean labels** — "저장하기" → "저장 중..." (3 dots, not "..." typography). The 중 character signals progress; pair with spinner for redundancy.
- **Optimistic UI** — for cheap operations (toggle a switch), prefer optimistic update over loading button.

## Code example

```tsx
import { Button, CircularProgress } from "@mui/material";

function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={handleClick}
        loading={loading}
        loadingPosition="start"
        startIcon={<SaveIcon />}
        aria-busy={loading}
      >
        {loading ? "저장 중..." : "저장하기"}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} role="alert">
          {error}
        </Alert>
      )}
    </>
  );
}
```

## Don't

- Don't disable the button without showing a loading indicator — users think it's broken.
- Don't move focus away during loading; users may want to cancel (Esc, navigate back).
- Don't reset the form on click before the async resolves — if it fails, you've lost the user's input.
- Don't show "Loading..." with no spinner. Spinner is the universal "we're working" signal.
- Don't allow double-click during loading. Set `loading={true}` synchronously before the async starts.

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- [`component-button.md`](component-button.md)
- [`knowledge/patterns/empty-states.md`](../knowledge/patterns/empty-states.md) — what to show during long loads
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
