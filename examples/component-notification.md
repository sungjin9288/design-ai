# `Notification` — spec

> Synthesized from Ant Design `Notification`. Richer card-style notification — title + description + optional actions, anchored to a screen corner. Distinct from `Toast` (smaller, action-focused), `Message` (top thin pill), and `Banner` (persistent in-page).

## When to use

- **System-level events** that need title + body description.
- **Multi-action notifications** ("New message from John" with Reply / Mark read buttons).
- **Push-notification surface** for in-app-only events.

When NOT to use:
- Brief result confirmation (use Message or Toast).
- Critical actions blocking workflow (use Modal / AlertDialog).
- In-page persistent strip (use Banner).

## Anatomy

```
                          ┌───────────────────────────┐
                          │ ⓘ  새 알림                  │
                          │    @sungjin이 댓글을        │
                          │    남겼어요.                │
                          │                            │
                          │    [답장] [읽음 처리] [×]   │
                          └───────────────────────────┘
                              ↑ top-right corner
```

## API

```tsx
import { notification } from "antd";

notification.open({
  message: "새 알림",
  description: "@sungjin이 댓글을 남겼어요.",
  placement: "topRight",
  duration: 4.5,
  btn: <Button onClick={reply}>답장</Button>,
  onClose: handleClose,
});

notification.success({ message: "성공", description: "저장됐어요." });
notification.error({ message: "실패", description: "저장에 실패했어요." });
notification.info({ message: "알림", description: "..." });
notification.warning({ message: "경고", description: "..." });
```

| Config field | Description |
| --- | --- |
| `message` | Title (bold) |
| `description` | Body (multiple lines OK) |
| `placement` | `"top" \| "topLeft" \| "topRight" \| "bottom" \| "bottomLeft" \| "bottomRight"` |
| `duration` | Seconds; 0 = persistent until dismissed |
| `key` | Unique key (replace existing) |
| `btn` | Custom action button(s) |
| `onClose` | Dismiss callback |
| `onClick` | Click on notification (optional) |
| `icon` | Custom icon override |
| `closable` | Show × dismiss button |

## States

| Severity | Visual |
| --- | --- |
| `open` (neutral) | Generic info icon |
| `success` | Green check |
| `error` | Red X |
| `info` | Blue info |
| `warning` | Amber triangle |

## Animation

```
Enter: slide-in from corner (250ms)
Hold: full opacity for `duration` seconds
Exit: fade + slide-out (200ms)
```

Reduced motion: fade only.

## Stacking

Multiple Notifications stack vertically in their corner. Newest on top (or bottom — configurable).

Cap visible: 3-5. Beyond that, oldest collapse to "+ N more" indicator.

## Tokens consumed

```
--notification-bg
--notification-fg
--notification-fg-muted            (description)
--notification-success-icon
--notification-error-icon
--notification-warning-icon
--notification-info-icon
--notification-shadow
--radius-md
--space-md, --space-lg
--font-size-sm                     (description)
--font-weight-medium               (title)
--motion-medium
--z-notification                   (above modals OR below; pick consciously)
```

## Accessibility

- `role="alert"` for time-sensitive (errors, warnings).
- `role="status"` for non-urgent.
- `aria-live="polite"` (status) or `assertive` (alert) — be sparing with assertive.
- Focus management: Notification doesn't steal focus by default. For action-required: persistent + focus the first button.
- Touch target ≥ 44pt for action buttons.

## Korean conventions

```
새 메시지
@sungjin이 메시지를 보냈어요.
[답장] [확인]
```

- 해요체 for casual brands; 합쇼체 for formal / banking.
- Title: 20자 이내; Body: 50자 이내.
- For 카카오톡 / KakaoTalk-style notifications: avatar + title + preview.

## Code example

```tsx
function NewMessageNotification({ message }: Props) {
  return (
    notification.info({
      message: `새 메시지 — ${message.from}`,
      description: message.preview,
      placement: "topRight",
      duration: 4.5,
      icon: <Avatar src={message.fromAvatar} size="sm" />,
      btn: (
        <Button size="sm" onClick={() => navigate(`/messages/${message.id}`)}>
          확인
        </Button>
      ),
    })
  );
}
```

## Don't

- Don't use Notification for fleeting confirmation. Use Message or Toast.
- Don't show 6+ Notifications stacked. Cap visible.
- Don't auto-show on page load — feels like spam. Triggered by user action only.
- Don't put long body text. Description ≤ 2 lines; longer = open a Modal or page.
- Don't omit dismiss button on persistent notifications.

## References

- Ant: [`Notification`](../docs/reference/ant-design.md#notification)
- Native browser Notification API (different — uses OS-level notifications)
- iOS / Android notification card patterns

## Cross-reference

- [`examples/component-toast.md`](component-toast.md) — smaller corner variant with Undo
- [`examples/component-message.md`](component-message.md) — top thin pill
- [`examples/component-banner.md`](component-banner.md) — persistent in-page strip
