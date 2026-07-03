# `Step` — spec

> Synthesized from MUI `Step`. A single step in a `Steps` / `Stepper` flow. Sub-component spec for completeness; in practice, use [`component-steps.md`](component-steps.md) for the full Stepper pattern.

## API

```tsx
<Steps current={1}>
  <Step title="배송지 입력" />
  <Step title="결제 수단" status="active" />
  <Step title="주문 확인" status="upcoming" />
</Steps>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | required | Step label |
| `description` | `string` | — | Sub-label |
| `status` | `"complete" \| "active" \| "upcoming" \| "error"` | derived | Visual state |
| `icon` | `ReactNode` | — | Custom icon override |
| `disabled` | `boolean` | `false` | Disabled |

## States

| Status | Visual |
| --- | --- |
| `complete` | Filled circle + check icon, brand color |
| `active` (current) | Filled circle + step number, brand color, larger |
| `upcoming` | Outline circle + step number, muted |
| `error` | Filled circle + X icon, error color |

## Connector lines

Between Step instances, render a connector line indicating progress:
- Complete → Active: solid brand color line.
- Active → Upcoming: muted line.
- Error: red dashed.

This is handled by the parent `Steps` component, not Step itself.

## Tokens consumed

```
--step-circle-bg-complete
--step-circle-bg-active
--step-circle-bg-upcoming
--step-circle-bg-error
--step-fg-complete
--step-connector-complete
--step-connector-incomplete
--space-sm
--font-size-sm
```

## Accessibility

- Each Step: `<li>` (parent is `<ol role="list">`).
- Step status communicated via `aria-current="step"` (active) or text label.
- Don't rely on color alone — include icon (check / X / number).

## Code example

```tsx
<Steps current={2}>
  <Step title="배송지" description="입력 완료" />
  <Step title="결제" description="진행 중" />
  <Step title="확인" />
  <Step title="완료" />
</Steps>
```

## Don't

- Don't ship Step without parent Steps. Step is a sub-component.
- Don't use Step for non-sequential UI. Use Tabs or Pagination instead.

## References

- MUI: [`Step`](../docs/reference/mui.md#step)
- Ant: [`Steps`](../docs/reference/ant-design.md#steps) (parent)

## Cross-reference

- [`examples/component-steps.md`](component-steps.md) — full Stepper spec
