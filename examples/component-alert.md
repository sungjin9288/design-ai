# `Alert` (Banner) — spec

> Citing Ant Design `Alert`, MUI `Alert`, shadcn-ui `alert`. Different from Toast — Alert is **persistent and inline**, Toast is **transient and floating**.

## Purpose

A persistent in-page message: status info, warnings, errors that the user must see and may need to act on. Sticks until dismissed or until the underlying state changes.

## When Alert vs Toast vs Modal

| Use | Why |
| --- | --- |
| **Alert** | The state persists. The user sees it on every render. Inline in the page. |
| **Toast** | The state is momentary. Auto-dismisses. Floating. |
| **Modal** | The user must respond before continuing. Blocks interaction. |
| **InlineError** (form-level) | Single field validation — use form's ErrorText, not Alert. |

## Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ [icon]  Title                                          [✕]   │
│         Description (optional)                                │
│                                                              │
│         [primary action]  [secondary]                        │  ← actions row (optional)
└──────────────────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Intent icon | usually | Matches intent: ℹ ✓ ⚠ ✕ — provides redundant cue beyond color |
| Title | yes | The message; ≤ 80 chars |
| Description | optional | Detail or remediation hint |
| Actions | optional | 1–2 buttons (e.g., "Retry", "Learn more") |
| Close button | optional (always for `error`) | ✕ in top-right |

## API

```tsx
<Alert
  intent="warning"
  title="구독 만료가 임박했습니다"
  description="2026년 6월 1일까지 결제 정보를 업데이트해 주세요."
  actions={[
    { label: "결제 정보 업데이트", onClick: handleUpdate, intent: "primary" },
    { label: "나중에", onClick: dismiss, variant: "ghost" },
  ]}
  dismissible
  onDismiss={handleDismiss}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `intent` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Sets icon + color + ARIA role |
| `title` | `string \| ReactNode` | — | Required. The message. |
| `description` | `string \| ReactNode` | — | Detail line(s). |
| `actions` | `Action[]` | — | Up to 2 buttons. |
| `dismissible` | `boolean` | `false` | Show ✕ |
| `onDismiss` | `() => void` | — | Called on dismiss |
| `iconStart` | `ReactNode` | derived from intent | Override the intent icon |
| `variant` | `"subtle" \| "outlined" \| "solid"` | `"subtle"` | Visual emphasis |

## Variants — `variant`

| Variant | Background | Border | Use |
| --- | --- | --- | --- |
| `subtle` (default) | `--color-<intent>-subtle-bg` | none | In-page, low-emphasis |
| `outlined` | `--color-bg-default` | `1px --color-<intent>` | Light pages, when subtle bg blends |
| `solid` | `--color-<intent>` | none | High-emphasis, full-bleed banners |

`subtle` is the right default for 90% of cases. `solid` is for marketing announcements (top-of-page promo banner).

## Intent → token mapping

| Intent | Icon | Subtle bg | Border / solid bg | Title color (subtle) |
| --- | --- | --- | --- | --- |
| `info` | ℹ | `--color-info-subtle-bg` | `--color-info` | `--color-text-primary` |
| `success` | ✓ | `--color-success-subtle-bg` | `--color-success` | `--color-text-primary` |
| `warning` | ⚠ | `--color-warning-subtle-bg` | `--color-warning` | `--color-text-primary` |
| `error` | ✕ | `--color-error-subtle-bg` | `--color-error` | `--color-text-primary` |

For `solid` variant: title and body text become white (or near-black for warning's amber, where contrast inverts).

## States

| State | Visual |
| --- | --- |
| Default | resting |
| Action hovered | nested Button states |
| Dismissed | unmount with 150ms fade-out |

Alerts don't have hover/active themselves — only their nested actions do.

## Tokens consumed

```
--color-info, --color-info-subtle-bg
--color-success, --color-success-subtle-bg
--color-warning, --color-warning-subtle-bg
--color-error, --color-error-subtle-bg
--color-text-primary
--color-text-secondary
--color-bg-default
--space-md, --space-base
--radius-md
--font-size-sm, --font-size-base
--font-weight-medium
```

## Accessibility

- **Role**:
  - `role="alert"` for `error` intent — assertive, interrupts screen reader.
  - `role="status"` for `info` / `success` / `warning` — polite.
- **`aria-live`** matches role implicitly; explicit on the container is fine.
- **Live region timing**: if the alert is mounted on page load (not in response to action), wrap in a `<div aria-live="off">` initially, then update to live after first paint — otherwise screen readers announce immediately on mount which is jarring.
- **Dismiss button**: `aria-label="Dismiss alert"`. Focus returns to a logical neighbor (or the next focusable element after the alert) on dismiss.
- **Color is not the only signal**: every alert has the intent icon — color-blind users see the icon.
- **For interactive alerts** (with action buttons): they are NOT modals — page content remains tab-reachable around them.

## Code example

```tsx
// Simple info banner at top of page
<Alert intent="info" title="새 기능이 추가되었습니다" description="대시보드에서 새 차트를 확인하세요." dismissible />

// Error with retry
<Alert
  intent="error"
  title="저장에 실패했습니다"
  description="네트워크 연결을 확인하고 다시 시도해 주세요."
  actions={[
    { label: "다시 시도", onClick: retry, intent: "primary" },
  ]}
/>

// Warning with dismiss
<Alert
  intent="warning"
  title="계정 보안 경고"
  description="새로운 기기에서 로그인이 감지되었습니다."
  actions={[
    { label: "확인하기", onClick: review },
  ]}
  dismissible
/>

// Solid promotional banner (top of page, full-width)
<Alert
  intent="info"
  variant="solid"
  title="🎉 신규 가입 시 50% 할인"
  description="6월 30일까지 한정"
  actions={[{ label: "자세히 보기", onClick: nav }]}
/>
```

## Edge cases

- **Multiple alerts stacked**: order by severity (error → warning → info → success). Don't show 5+ alerts simultaneously — collapse to a summary.
- **Alert with no dismiss + no actions**: legitimate but rare. Make sure the underlying state changes will eventually remove the alert.
- **Alert that's also a link**: avoid making the entire alert clickable. If it has navigation, use an explicit action button.
- **Long description that wraps**: title-then-description layout still works; align icon + dismiss to the top, not center.
- **Inside a modal**: the modal already has assertive-context; Alert inside should use `role="status"` (not `alert`) to avoid double-announcing.
- **RTL**: dismiss flips to left, actions flow RTL, padding swaps via logical CSS.

## Don't

- Don't use Alert for transient feedback ("Saved!"). Use a Toast — Alert sticks around until dismissed.
- Don't use Alert for form-field errors. Forms have their own ErrorText.
- Don't auto-dismiss errors after a timeout. They're persistent on purpose.
- Don't put more than 2 actions in an Alert. If there are 3+ paths, the choice is a Modal.
- Don't use solid variant inside a card or section — too punchy. Reserve solid for full-bleed banners.
- Don't ship Alert with no icon AND color-only intent — fails for color-blind users. Always include the icon.

## References

- Ant Design: [`refs/ant-design/components/alert/`](../docs/reference/ant-design.md#alert) — `Alert`, `Alert.ErrorBoundary`. Supports `closable`, `banner` variant, `showIcon`, `action`. Has a "banner" mode for full-width top banners.
- MUI: [`refs/mui/packages/mui-material/src/Alert/`](../docs/reference/mui.md#alert) — `Alert` + `AlertTitle`. Variants: `standard` (subtle), `filled` (solid), `outlined`. Closest to this spec.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/alert.tsx`](../docs/reference/shadcn-ui.md#alert) — primitive (`Alert`, `AlertTitle`, `AlertDescription`). Composition; intent via className variant.

API choices made:
- **`actions` array prop** rather than children-only: 80% of alerts with actions need exactly 1–2 buttons; the prop is faster than composing.
- **`variant` (subtle / outlined / solid)** matches MUI's three-tier model. Most universal.
- **`role` derived from `intent`**: explicit only when overriding (rare).

## Cross-reference

- [examples/component-toast.md](component-toast.md) — transient version
- [examples/component-modal.md](component-modal.md) — blocking version
- [knowledge/a11y/keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) — focus management on dismiss
