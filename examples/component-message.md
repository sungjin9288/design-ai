# `Message` — spec

> Synthesized from Ant Design `Message`. A top-of-page transient notification — a thin strip / pill that appears at the top center for 1.5-3 seconds, then auto-dismisses. Distinct from `Toast` (corner-anchored) and `Notification` (richer, persistent corner).

## Message vs Toast vs Notification

| | Message | Toast | Notification |
| --- | --- | --- | --- |
| Position | Top center | Bottom-right (or corner) | Top-right (corner) |
| Size | Thin pill | Card-sized | Larger card |
| Duration | 1.5-3s | 3-5s | 4.5s default; can be persistent |
| Use | Result of action ("저장됨") | Action result + optional Undo | Notification with title + description |
| Title? | No (just one line) | Optional | Yes |

For **brief action confirmation** (저장됨, 복사됨): Message.
For **action confirmation with Undo**: Toast.
For **rich notifications with detail**: Notification.

## Anatomy

```
                ✓ 저장되었어요
              ↑ pill, top center, brief
```

## API

Imperative API (Ant-style):

```tsx
import { message } from "antd";

message.success("저장되었어요");
message.error("저장에 실패했어요");
message.info("새 버전이 있어요");
message.warning("연결이 불안정해요");
message.loading("처리 중...");

// With config
message.success({ content: "복사됨", duration: 1.5 });

// Custom dismiss
const hide = message.loading("Saving...", 0);  // 0 = persistent
// later
hide();
```

| API | Description |
| --- | --- |
| `message.success(content, duration?)` | Green check |
| `message.error(content, duration?)` | Red X |
| `message.info(content, duration?)` | Blue info |
| `message.warning(content, duration?)` | Amber triangle |
| `message.loading(content, duration?)` | Spinner |
| `message.open(config)` | Full config object |
| `message.destroy()` | Clear all messages |

| Config field | Description |
| --- | --- |
| `content` | Text or ReactNode |
| `duration` | Seconds (default 3); 0 = persistent |
| `key` | Unique key (replace existing message with same key) |
| `onClose` | Callback when dismissed |
| `icon` | Custom icon override |

## States

| State | Visual |
| --- | --- |
| success | Green check icon + content |
| error | Red X icon + content |
| info | Blue info icon |
| warning | Amber triangle |
| loading | Spinner + content |

## Animation

```
Enter: slide down + fade in (200ms)
Hold: full opacity for `duration` seconds
Exit: slide up + fade out (200ms)
```

Reduced motion: skip slide; just fade.

## Tokens consumed

```
--message-bg                       (white / dark surface)
--message-fg
--message-success-icon             (green)
--message-error-icon               (red)
--message-warning-icon             (amber)
--message-info-icon                (blue)
--message-shadow
--radius-md
--space-sm, --space-md
--font-size-sm
--motion-medium                    (slide animation)
--ease-out
--z-message                        (above modals)
```

## Accessibility

- Container: `role="status"` (info / success) or `role="alert"` (error / warning).
- `aria-live="polite"` for status; `assertive` for error.
- Don't use for accessibility-critical info that user must read at length — use a Modal or persistent Banner.
- For loading: pair with `aria-busy="true"` on the affected region.

## Korean conventions

| Action | Message |
| --- | --- |
| Save success | "저장되었어요" / "저장됐어요" |
| Copy | "복사되었어요" |
| Delete | "삭제됐어요" (often with Toast + Undo instead) |
| Error | "오류가 발생했어요" |
| Loading | "처리 중이에요..." |
| Network error | "네트워크가 불안정해요" |

해요체 default for casual brand voice.

## Code example

```tsx
async function handleSave() {
  const hide = message.loading("저장 중...");
  try {
    await api.save(data);
    hide();
    message.success("저장되었어요");
  } catch (err) {
    hide();
    message.error("저장에 실패했어요. 다시 시도해 주세요.");
  }
}

async function handleCopy() {
  await navigator.clipboard.writeText(text);
  message.success({ content: "복사됨", duration: 1.5 });
}
```

## Don't

- Don't use Message for actions with Undo. Use Toast (anchor in corner; allow Undo button).
- Don't show 5 concurrent messages — they stack and confuse. Cap at 1-2 visible.
- Don't use Message for critical errors that block the user. Use Modal / AlertDialog.
- Don't make Message disappear in 500ms. Min 1.5s for users to read.
- Don't translate Message content from English word-for-word — adapt to Korean phrasing.

## References

- Ant: [`Message`](../docs/reference/ant-design.md#message)
- Patterns: same family as iOS HUD, Material Snackbar (variant)

## Cross-reference

- [`examples/component-toast.md`](component-toast.md) — corner alternative with Undo
- [`examples/component-notification.md`](component-notification.md) — richer card variant
- [`examples/component-banner.md`](component-banner.md) — persistent strip variant
