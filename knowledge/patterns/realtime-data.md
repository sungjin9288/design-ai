<!-- hand-written -->
---
title: Real-time data UX
applies_to: [dashboard, fintech, chat, monitoring, all-live-data-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Real-time data UX

Live updating data — stock prices, transactions, chat messages, monitoring metrics, multiplayer state. Requires intentional UX design or it's distracting (or worse, missed).

## What "real-time" means here

Three latency tiers, very different UX requirements:

| Latency | Examples |
| --- | --- |
| **Sub-second** (< 1s) | Trading apps, live polls, multiplayer cursors, chat |
| **Polling / 5–60s** | Dashboards, monitoring, stock charts |
| **Periodic / hourly+** | Reports, daily dashboards, weather |

Each tier needs different patterns. A 100ms-update price chart and a 1-hour-refresh dashboard are completely different design problems.

## The three problems

Real-time UX has three universal challenges:

1. **Show that data is live**: user shouldn't wonder "is this stale?"
2. **Don't blast the user with motion**: every update doesn't need to flash, shake, or animate.
3. **Handle stale / disconnected gracefully**: when the connection drops, fail visibly.

## "Live" indicators

Tell the user the data is fresh. Subtle cues:

| Indicator | Latency tier |
| --- | --- |
| **Pulsing dot** ("● Live") | Sub-second |
| **"Last updated: 방금"** timestamp | All tiers |
| **Subtle background "ping"** on changed values | Sub-second / polling |
| **"Auto-refresh in 30s" countdown** | Polling |
| **Connection status** (online/offline) | Always |

```
┌──────────────────────────────────────┐
│ ● 실시간                              │
│ 거래량 1,247건                        │
│ 5분 전 업데이트                       │
└──────────────────────────────────────┘
```

For long-running screens (kiosks, monitors): always show timestamp. The user might walk away and come back.

## Updating values — animation tiers

When a value changes, you have options:

| Tier | Use |
| --- | --- |
| **Instant change** | Default. New value replaces old. |
| **Number tick animation** | Stock prices, counters. ~150–300ms count-up animation. |
| **Highlight pulse** | Quick yellow → fade flash to draw attention to changed cell. ~500ms. |
| **Color shift** (red flash for drop) | Stock UIs only. Pair with desaturation after. |
| **Slide-in** (new chart point) | Charts that show last N points. New point slides in from right; oldest slides out left. |

### Don't blast

If 50 cells update simultaneously:
- **Don't flash all 50**. Only flash the most-significant changes.
- **Don't animate all simultaneously**. Stagger or skip.
- **Cap motion**: a dashboard that's constantly flashing reads as broken.

`prefers-reduced-motion`: replace animations with instant changes. Cite [`motion/principles.md`](../motion/principles.md).

## Patterns by latency

### Sub-second (chat, multiplayer, trading)

- WebSocket or Server-Sent Events.
- Optimistic UI: show user's own action immediately; reconcile from server.
- Mobile network drops are common — surface clearly.
- Reconnect logic with exponential backoff.

### Polling (dashboards)

- Refetch on a schedule (every 30s for ops, every 5min for analytics).
- Pause polling when tab is hidden (Page Visibility API).
- Resume on focus.
- Don't show skeleton on each refetch — keep stale data visible, refresh in place.

### Periodic (hourly+)

- "Last updated: 14:00. Next update: 15:00."
- No auto-refetch (too long-tail to bother).
- Manual refresh button.

## Stale data indicators

When data is older than expected:

```
이번 달 매출
₩2,847,500
⚠ 5분 전 업데이트 (마지막 시도 실패)
```

- Show timestamp prominently.
- If significantly stale (> 2× expected refresh interval): tint with warning color.
- Provide retry button.

## Disconnection states

When the connection drops:

```
┌──────────────────────────────────────────────────┐
│ ⚠ 연결이 끊겼습니다                                │
│   재연결 시도 중... (3/5)                          │
└──────────────────────────────────────────────────┘
```

- Banner at top of screen.
- Don't blank out the data — keep the last-known state.
- Auto-reconnect with backoff (1s, 2s, 4s, 8s, 16s, then stop).
- Stop after 5 attempts and surface manual retry.

When reconnected:
- Refetch state (don't trust accumulated optimistic updates).
- Show brief "● 다시 연결됨" toast.

## Optimistic UI

For sub-second interactions (sending a message, liking a post):
- Render the user's action **immediately** as if successful.
- Send to server in background.
- On success: confirm (subtle).
- On failure: roll back + show error inline.

```
[user types message and hits send]
  ↓
[message appears in chat with subtle "sending..." indicator]
  ↓ (server confirms)
[indicator removed; message is "sent"]

OR (failure):
  ↓ (server rejects)
[message highlighted in error color; "다시 시도" button]
```

The user keeps typing without waiting for the server.

### Rules

- Optimistic only for user-initiated actions (not pushed from server).
- Always reconcile: server is source of truth.
- Visual cue while pending (subtle, not alarming).
- Error rollback must be obvious — don't silently lose work.

## Pushed updates from others

When data changes because **someone else** did something:

| Pattern | Use |
| --- | --- |
| **Inline appearance** | New row slides in at top of list. Most common for feeds, chat. |
| **"N new items"** banner | "5 new transactions. [Show]" — user opts to load. Avoids interruption. |
| **Background highlight** | Row appears with brief tint, fades. |
| **Toast notification** | "김민지 sent you a message" — only when user is elsewhere. |

Don't auto-scroll to show new content. The user might be reading. Provide opt-in ("새 메시지 보기").

## Throttling and batching

When updates arrive faster than humans can read:

- **Throttle visual updates** to ~10/second max for any element. More than that is jitter, not data.
- **Batch high-frequency updates**: collect 100ms of changes, render once.
- **Smooth animations**: even if the value changes 60 times per second, animate smoothly to the latest value, don't snap to each one.

For trading apps where 100ms updates matter:
- Update price displays with `requestAnimationFrame` for buttery smoothness.
- Limit to displays the user is actually looking at (off-screen widgets can update less frequently).

## Performance

Real-time UI is render-heavy. Watch for:

- **DOM updates per second**: keep under 60. Use virtualization for long lists.
- **Re-render scope**: don't re-render the whole dashboard per update. Memoize widgets that didn't change.
- **WebSocket fan-out**: server sends only the changed bits, not full state.
- **Large payloads**: paginate / sparse-update; don't ship full state per tick.

## Korean considerations

Per [`korean-product-conventions.md`](../i18n/korean-product-conventions.md):

- "실시간" indicator label.
- "방금 업데이트" / "1분 전" / "5분 전" relative timestamps.
- For Korean stock apps: red/blue inverted convention (red = up).
- Stock app "체결" notifications are highly culturally specific — almost always pushed via toast or bottom-sheet.
- KakaoTalk-style chat: pushes happen via WebSocket; new message appears at the bottom; subtle bg pulse for unread.

## Accessibility

- Live regions: `aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for critical (errors, alerts).
- **Don't assertive-announce every price tick**. Polite + announce on milestones.
- For continuous data: provide a "pause updates" affordance for users who need to read carefully.
- Animations: respect `prefers-reduced-motion` always.
- Transcribe audio cues if used (chat sound, alert beep).

## Code example — polling dashboard

```tsx
function MetricsDashboard() {
  const { data, isLoading, error, lastUpdated, isStale } = useDashboardData({
    refreshInterval: 30 * 1000,        // 30s
    pauseWhenHidden: true,
    staleThreshold: 90 * 1000,         // mark stale after 90s of failures
  });

  return (
    <div>
      <Header>
        <h1>운영 현황</h1>
        <LiveIndicator>
          {isStale ? "⚠" : "●"} {formatRelative(lastUpdated)}
        </LiveIndicator>
      </Header>
      <KpiGrid data={data} />
      {error && <ConnectionBanner onRetry={retry} />}
    </div>
  );
}
```

## Code example — WebSocket chat

```tsx
function ChatRoom() {
  const { messages, sendMessage, status } = useChatRoom(roomId);

  const handleSend = (text: string) => {
    // Optimistic
    const tempMsg = { id: tempId(), text, status: "sending", from: me };
    setLocalMessages([...localMessages, tempMsg]);
    sendMessage(text);
  };

  return (
    <div>
      {status === "disconnected" && <Banner>연결이 끊겼습니다. 재연결 중...</Banner>}
      <MessageList messages={[...messages, ...localMessages]} />
      <MessageInput onSend={handleSend} disabled={status === "disconnected"} />
    </div>
  );
}
```

## Don't

- Don't auto-refresh data the user is actively interacting with (e.g., a sortable table mid-sort).
- Don't hide stale-data indicators — users assume data is fresh by default.
- Don't blast a hundred updates per second to the screen. Throttle.
- Don't lose the user's input when reconnecting (preserve form state, draft, etc.).
- Don't auto-scroll on new messages without consent — user might be reading old.
- Don't silently drop server updates. If state diverges, reconcile and surface.
- Don't use loud notifications (sound, full-screen modal) for routine updates.
- Don't show "Live" without an actual live connection. Misleading.

## Cross-reference

- [`knowledge/patterns/dashboard-composition.md`](dashboard-composition.md) — dashboard structure
- [`knowledge/patterns/chart-color-encoding.md`](chart-color-encoding.md) — animations for chart updates
- [`knowledge/motion/principles.md`](../motion/principles.md) — reduced motion
- [`knowledge/patterns/error-states.md`](error-states.md) — disconnection error patterns
- [`knowledge/patterns/list-and-feed.md`](list-and-feed.md) — chat / feed patterns
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean live-app conventions
