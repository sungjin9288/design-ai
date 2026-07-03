# `StepConnector` - spec

> Direct upstream component: MUI `StepConnector`. Parent pattern references: Ant Design `Steps`, MUI `Stepper`, and composed shadcn-style primitives.

## Purpose

`StepConnector` draws the visual line between steps in a stepper. It communicates sequence and completed progress, but it is not interactive and should not be announced by assistive technology.

Use it only inside a `Steps` / `Stepper` composition.

## Anatomy

```
Step
└── StepIcon
    |
    |  StepConnector
    |
Step
└── StepIcon
```

| Part | Required | Purpose |
| --- | --- | --- |
| Root | yes | Positions the connector between adjacent steps. |
| Line | yes | Visual track for wait/active/completed state. |
| State classes | contextual | Active, completed, disabled, orientation, and alternative-label states come from parent context. |

## API

```tsx
<Stepper connector={<StepConnector />}>
  <Step>
    <StepLabel>본인인증</StepLabel>
  </Step>
  <Step>
    <StepLabel>정보 입력</StepLabel>
  </Step>
</Stepper>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `classes` | `Partial<StepConnectorClasses>` | - | Style override hooks for MUI-style implementations. |
| `sx` | `SxProps<Theme>` | - | MUI system override. Prefer tokens for shared design-system code. |

`children` is intentionally omitted in MUI. This component renders the connector structure itself.

## API choices made

- Keep the API minimal. Connector state is derived from parent stepper context.
- Do not add `status`, `orientation`, or `completed` props to the public API unless building a standalone custom connector.
- Do not expose content slots. A connector is decorative, not a label surface.

## States

| State | Trigger | Visual rule |
| --- | --- | --- |
| Wait | Neither adjacent step is completed/current | Neutral border/line color. |
| Active | Adjacent current step | Primary or emphasized line segment if the product wants active progress. |
| Completed | Previous step completed | Primary filled line. |
| Error | Adjacent step has error | Error line only when it helps locate the failing step; pair with error text on the step label. |
| Disabled | Parent step disabled | Muted connector. |
| Horizontal | Parent orientation | Line runs inline between indicators. |
| Vertical | Parent orientation | Line runs block direction below the indicator. |
| Alternative label | Parent layout | Connector positions behind labels and aligns to indicator centers. |

## Tokens consumed

```
--color-border-default
--color-primary-default
--color-error
--color-text-disabled
--space-sm
--space-md
--step-icon-size-sm
--step-icon-size-md
--step-connector-thickness
--motion-fast
```

If step-specific tokens do not exist, map to the existing border, size, and spacing tokens.

## Accessibility

- Connector is decorative: set `aria-hidden="true"` and keep it out of the tab order.
- Do not encode step status only in connector color. `StepLabel` or the parent list must expose completed/current/error text.
- In high contrast mode, connector should remain visible through border/outline properties.
- Touch target requirements do not apply because the connector is not interactive.

## Layout rules

| Rule | Value |
| --- | --- |
| Thickness | 1px default; 2px only for high-emphasis progress flows. |
| Horizontal | Flexible line between step indicators; do not force fixed width. |
| Vertical | Minimum height should preserve spacing between labels. |
| Last step | No trailing connector after the final step. |
| RTL | Use logical inline properties; horizontal connector mirrors automatically. |

## Code example

```tsx
function CheckoutConnector(props: StepConnectorProps) {
  return (
    <StepConnector
      {...props}
      aria-hidden="true"
      className="checkout-step-connector"
    />
  );
}

<Steps current={currentStep} connector={<CheckoutConnector />}>
  <Step completed>
    <StepLabel>장바구니</StepLabel>
  </Step>
  <Step>
    <StepLabel>배송 정보</StepLabel>
  </Step>
  <Step>
    <StepLabel>결제</StepLabel>
  </Step>
</Steps>
```

## Edge cases

- **One step only**: render no connector.
- **Skipped optional step**: connector after the skipped step should follow the chosen status model, usually completed if the flow can advance.
- **Error step**: show error on the step icon/label first; connector color is secondary.
- **Vertical labels with long copy**: connector height should follow layout, not overlap label text.
- **Alternative label layout**: align connector to icon centers, not label baselines.
- **Reduced motion**: avoid animated line filling. State changes can switch instantly.
- **Print**: connectors should remain visible in grayscale; avoid relying on primary color alone.

## Don't

- Don't make the connector clickable.
- Don't place text or icons inside the connector line.
- Don't show a connector after the final step.
- Don't use connector color as the only indication of completed/error state.

## References

- MUI direct source: [`refs/mui/packages/mui-material/src/StepConnector/StepConnector.d.ts`](../docs/reference/mui.md#step-connector)
- MUI implementation: [`refs/mui/packages/mui-material/src/StepConnector/StepConnector.js`](../docs/reference/mui.md#step-connector)
- MUI stepper docs/examples: [`refs/mui/docs/data/material/components/steppers/`](../docs/reference/mui.md)
- Ant Design parent pattern: [`refs/ant-design/components/steps/`](../docs/reference/ant-design.md#steps)
- Accessibility baseline: [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)

## Cross-reference

- [examples/component-steps.md](component-steps.md)
- [examples/component-step-icon.md](component-step-icon.md)
- [examples/component-step-label.md](component-step-label.md)
