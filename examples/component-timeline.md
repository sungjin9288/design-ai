# `Timeline` — spec

> Citing Ant Design `Timeline`, MUI (no built-in), shadcn-ui (composition)

## Purpose

A vertical (or horizontal) sequence of events. Used for: activity feeds, order tracking, history logs, project milestones, audit trails.

## Anatomy

```
Vertical (default):
●─── 2026.05.07 14:30 ────
│    주문이 접수되었습니다
│    주문번호 #1234
│
●─── 2026.05.07 15:00 ────
│    결제가 완료되었습니다
│    KakaoPay
│
○─── 2026.05.07 (예정) ────
│    배송 준비 중
│
○─── 2026.05.10 (예정) ────
     배송 완료 예정
```

| Slot | Required | Notes |
| --- | --- | --- |
| Indicator (per event) | yes | Dot, icon, or filled vs outline |
| Connector line | yes | Vertical line connecting events |
| Event title | yes | The event name |
| Timestamp | yes | When |
| Description | optional | Detail |
| Custom content | optional | Image, link, button |

## API

```tsx
<Timeline>
  <Timeline.Item status="completed" timestamp="2026.05.07 14:30">
    <h4>주문이 접수되었습니다</h4>
    <p>주문번호 #1234</p>
  </Timeline.Item>
  <Timeline.Item status="completed" timestamp="2026.05.07 15:00">
    <h4>결제가 완료되었습니다</h4>
    <p>KakaoPay</p>
  </Timeline.Item>
  <Timeline.Item status="pending" timestamp="2026.05.07 (예정)">
    <h4>배송 준비 중</h4>
  </Timeline.Item>
  <Timeline.Item status="pending" timestamp="2026.05.10 (예정)">
    <h4>배송 완료 예정</h4>
  </Timeline.Item>
</Timeline>
```

| Prop (root) | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `"left" \| "right" \| "alternate"` | `"left"` | Indicator placement |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | |
| `compact` | `boolean` | `false` | Tighter spacing |

| Prop (Item) | Type | Description |
| --- | --- | --- |
| `status` | `"pending" \| "completed" \| "active" \| "error"` | Drives indicator color |
| `timestamp` | `string \| ReactNode` | When this happened |
| `icon` | `ReactNode` | Custom indicator (overrides dot) |
| `color` | `string` | Override indicator color |
| `position` | `"left" \| "right"` | (alternate mode only) which side |

## Variants

### Modes

| Mode | Indicator placement | Use |
| --- | --- | --- |
| `left` (default) | Left side, content right | Most common, KR convention |
| `right` | Right side, content left | RTL contexts |
| `alternate` | Alternates left/right | Marketing pages, "story" timelines |

### Status → indicator

| Status | Indicator |
| --- | --- |
| `completed` | Filled circle, primary color |
| `active` (current) | Filled circle, larger or pulsing |
| `pending` | Empty / outline circle |
| `error` | Filled circle, error red, X icon |

## States

A timeline doesn't have hover/focus states unless individual items are interactive (links, drill-ins).

## Tokens consumed

```
--color-primary-default      (completed indicator)
--color-text-tertiary        (pending indicator + connector line)
--color-error                 (error status)
--color-text-primary
--color-text-secondary        (timestamp)
--space-md, --space-base
--radius-full                  (indicator circle)
```

## Accessibility

- Container: `<ol>` (ordered list — order matters in a timeline).
- Each item: `<li>`.
- Timestamps: `<time datetime="ISO-format">` for machine-readable.
- Status: include in screen reader text — "Completed: 결제가 완료되었습니다".

```html
<ol>
  <li>
    <time datetime="2026-05-07T14:30:00+09:00">2026.05.07 14:30</time>
    <span class="sr-only">완료됨: </span>
    <h4>주문이 접수되었습니다</h4>
  </li>
  ...
</ol>
```

## Use cases

| Where | Pattern |
| --- | --- |
| Order tracking (e-commerce) | `left` mode, completed → pending sequence |
| Activity feed (social, project) | `left`, all completed, scrollable |
| Audit log | Compact mode, dense |
| Marketing "story" page | `alternate` mode with images |
| Project milestones | Horizontal, large indicators with dates |

## Korean convention

For order/transaction tracking (대표적인 한국 e-commerce / fintech):

```
● 주문 접수            2026.05.07 14:30
● 결제 완료            2026.05.07 15:00
● 상품 준비            2026.05.08 09:30
○ 배송 시작            예정
○ 배송 완료            예정
```

Status terms:
- 완료 (completed)
- 진행 중 (in progress)
- 대기 (pending)
- 실패 (failed)
- 취소됨 (cancelled)

## Don't

- Don't use Timeline for non-sequential data. Use a list.
- Don't omit timestamps. Timeline without "when" is just a list.
- Don't use 50+ items. Paginate or virtualize. For activity feeds, use a scroll-load pattern.
- Don't use horizontal Timeline on mobile (cramped).

## References

- Ant Design: [`refs/ant-design/components/timeline/`](../refs/ant-design/components/timeline/) — `Timeline` with modes, custom icons, color overrides.
- MUI: `@mui/lab` `Timeline` (separate package) — alternate mode well-supported.
- shadcn-ui: no built-in. Compose from primitives.

## Cross-reference

- [`examples/component-steps.md`](component-steps.md) — when sequence has discrete user actions
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md) — activity feed patterns
