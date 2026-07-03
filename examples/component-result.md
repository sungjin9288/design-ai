# `Result` + `Empty` — combined spec

> Two sibling full-page components. Result for outcome of an action; Empty for no-data state. Same shape, different intent.
>
> Citing Ant Design `Result` + `Empty`, MUI (composition), shadcn-ui (composition)

## Semantic difference

| Component | Use | Trigger |
| --- | --- | --- |
| **Result** | Confirms an outcome (success / error / 404 / etc.) | After user action OR after navigation to a status page |
| **Empty** | "No data here" placeholder | When data is absent (first-time, filtered, cleared) |

Both render full-page-style content (icon + title + description + action). They differ in **what they communicate** and **when they appear**.

The patterns for both are detailed in:
- [`knowledge/patterns/empty-states.md`](../knowledge/patterns/empty-states.md) — full empty-state pattern reference
- [`knowledge/patterns/error-states.md`](../knowledge/patterns/error-states.md) — full error-state pattern reference

This spec provides the **component primitive** for both.

## Anatomy

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              [icon / illustration]               │
│                                                  │
│                  Title                           │
│                                                  │
│         Description (1–2 sentences)              │
│                                                  │
│         [Primary CTA]   [Secondary]              │
│                                                  │
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Icon / illustration | recommended | Conveys outcome; ~80–120px |
| Title | yes | Plain language outcome |
| Description | usually | Detail or recovery hint |
| Primary action | usually | Most likely next step |
| Secondary action | optional | Alternative path |
| Extra content | optional | Order ID, error code, transaction details |

## API

### Result

```tsx
<Result
  status="success"
  title="결제가 완료되었습니다"
  description="주문번호 #1234567 - 영수증이 이메일로 전송되었습니다."
  primaryAction={{ label: "주문 내역 보기", onClick: () => nav("/orders") }}
  secondaryAction={{ label: "쇼핑 계속", onClick: () => nav("/") }}
  extra={<OrderSummary order={order} />}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `"success" \| "info" \| "warning" \| "error" \| "404" \| "403" \| "500"` | `"info"` | Drives icon + color |
| `title` | `string \| ReactNode` | — | Required |
| `description` | `string \| ReactNode` | — | |
| `icon` | `ReactNode` | derived from status | Custom icon override |
| `primaryAction` | `Action` | — | |
| `secondaryAction` | `Action` | — | |
| `extra` | `ReactNode` | — | Below actions: order details, error code, etc. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |

### Empty

```tsx
<Empty
  title="아직 거래 내역이 없어요"
  description="첫 거래를 추가해 보세요."
  illustration="default"
  primaryAction={{ label: "거래 추가", onClick: openAddModal }}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string \| ReactNode` | — | Required |
| `description` | `string \| ReactNode` | — | |
| `illustration` | `"default" \| "search" \| "error" \| ReactNode` | `"default"` | Pre-set illustrations or custom |
| `primaryAction` | `Action` | — | |
| `secondaryAction` | `Action` | — | |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `inline` | `boolean` | `false` | Compact horizontal layout for inside cards/sidebars |

## Status → icon + color

| Status | Default icon | Color |
| --- | --- | --- |
| `success` | ✓ check circle | `--color-success` |
| `info` | ℹ info circle | `--color-info` |
| `warning` | ⚠ warning triangle | `--color-warning` |
| `error` | ✕ error circle | `--color-error` |
| `404` | 🗺 map / lost | `--color-text-secondary` |
| `403` | 🔒 lock | `--color-text-secondary` |
| `500` | ⚠ alert | `--color-error` |

For brand-led products: replace with custom illustrations. Keep size + position consistent.

## Sizes

| Size | Icon | Title font | Padding |
| --- | --- | --- | --- |
| `sm` | 48px | 16px | 24px |
| `md` (default) | 80px | 20px | 48px |
| `lg` | 120px | 24px | 64px |

For full-page result (404 page, post-checkout): `lg`. For inline empty in a card: `sm` or `inline`.

## Layout — full-page vs inline

### Full-page (default)

Vertical centered. Padding pushes content to ~1/3 from top.

```
[empty space ~30vh]
[icon centered]
[title centered]
[description centered, max-w 480px]
[actions centered]
[empty space below]
```

### Inline (Empty only, with `inline={true}`)

Horizontal compact. Icon left, text right. For inside small cards/sidebars where vertical centered would waste space.

```
[icon] [title]
       [description]
       [link CTA]
```

## Tokens consumed

```
--color-text-primary           (title)
--color-text-secondary         (description)
--color-text-tertiary
--color-success, --color-warning, --color-error, --color-info
--color-bg-default
--color-primary-default        (primary action)
--space-xl, --space-2xl, --space-3xl
--font-size-base, --font-size-xl, --font-size-2xl
```

## Accessibility

- Wrap in a heading hierarchy: title is `<h1>` for full-page (404), `<h2>` for in-page.
- Status icons: `aria-hidden="true"` (decorative — title carries meaning).
- Container: `role="status"` for empty / info / success; `role="alert"` for error / warning.
- Primary action gets focus when component mounts (full-page Result), so keyboard users land on the recovery path.

```html
<section role="alert">
  <Icon aria-hidden="true" />
  <h1>찾을 수 없는 페이지입니다</h1>
  <p>주소를 확인하거나 홈으로 돌아가 주세요.</p>
  <Button autoFocus>홈으로</Button>
</section>
```

## Code examples

```tsx
// 404 page
<Result
  status="404"
  title="찾을 수 없는 페이지입니다"
  description="주소를 확인하거나 홈으로 돌아가 주세요."
  primaryAction={{ label: "홈으로", onClick: () => nav("/") }}
  secondaryAction={{ label: "검색", onClick: () => nav("/search") }}
/>

// Post-checkout success
<Result
  status="success"
  title="결제가 완료되었습니다"
  description={`주문번호 #${order.id}`}
  primaryAction={{ label: "주문 내역 보기", onClick: () => nav(`/orders/${order.id}`) }}
  secondaryAction={{ label: "쇼핑 계속", onClick: () => nav("/") }}
  extra={
    <Card>
      <p>{order.items.length}개 상품 · ₩{order.total.toLocaleString()}</p>
      <p>예상 도착일: {order.deliveryDate}</p>
    </Card>
  }
/>

// Permission error
<Result
  status="403"
  title="접근 권한이 없습니다"
  description="이 페이지를 보려면 관리자 권한이 필요합니다."
  primaryAction={{ label: "관리자에게 요청", onClick: requestAccess }}
  secondaryAction={{ label: "돌아가기", onClick: () => history.back() }}
/>

// First-time empty in a list
<Empty
  title="아직 거래 내역이 없어요"
  description="첫 거래를 추가해 보세요."
  primaryAction={{ label: "거래 추가", onClick: openAddModal }}
/>

// Filtered empty
<Empty
  title="검색 결과가 없습니다"
  description="다른 검색어를 시도해 보세요."
  illustration="search"
  primaryAction={{ label: "검색어 지우기", onClick: clearQuery }}
/>

// Inline empty (small card)
<Card>
  <Empty
    inline
    size="sm"
    title="할 일이 없어요"
    description="새 작업을 추가하면 여기에 표시됩니다."
  />
</Card>
```

## Edge cases

- **Result during async waiting**: don't render Result for "loading" state. Use Skeleton or Spinner.
- **Result with no actions**: legitimate for "Account closed" or "Operation logged" — but most should have at least one path.
- **Empty inside a paginated list**: empty applies to page 1 only, not page 5 of 10. Page 5 with no items means "load more" exhausted, which is different.
- **404 with deep link guess**: detect common patterns and offer ("Did you mean /projects/123?").
- **Mobile sizing**: full `lg` may overflow on small phones. Cap icon at 100px on mobile.
- **Long titles** (Korean often verbose): allow 2-line wrap; don't truncate.

## Don't

- Don't use Result for inline status indicators (use Tag or Badge).
- Don't use Empty when there's an error — distinct pattern. See [`error-states.md`](../knowledge/patterns/error-states.md).
- Don't show a Result with no primary action for failure states — user is stuck.
- Don't auto-redirect after Result without giving the user time to read.
- Don't use technical jargon ("Error 404"). Plain language.
- Don't show stock illustrations from a vendor library — they date.
- Don't render multiple Results stacked. One per screen.

## References

- Ant Design: [`refs/ant-design/components/result/`](../docs/reference/ant-design.md#result) (Result) + [`refs/ant-design/components/empty/`](../docs/reference/ant-design.md#empty) (Empty). Both well-developed.
- MUI: no dedicated components. Compose with Card + Typography.
- shadcn-ui: no built-in. Compose from primitives.

API choices made:
- **Combined spec for Result + Empty**: 90% of the visual + a11y is shared. Speccing separately would force triplicate maintenance.
- **`status` prop on Result, not Empty**: Empty doesn't have status semantics ("empty" is the state).
- **`extra` slot on Result**: outcome confirmations frequently need order/transaction detail.
- **`inline` mode on Empty**: full-page is overkill for cards/sidebars; provides escape hatch.

## Cross-reference

- [`knowledge/patterns/empty-states.md`](../knowledge/patterns/empty-states.md) — comprehensive empty pattern guide
- [`knowledge/patterns/error-states.md`](../knowledge/patterns/error-states.md) — error pattern guide
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Korean tone for results
- [`examples/component-button.md`](component-button.md) — primary/secondary actions
