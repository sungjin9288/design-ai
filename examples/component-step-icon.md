# `StepIcon` — spec

> Synthesized from MUI `StepIcon`. The numbered/checked circle in a `Stepper` flow. Shows step number when upcoming/active, checkmark when complete, error icon when failed.

## When to use

- Inside `StepLabel` (auto-rendered by `Step` parent).
- For custom step icons, override via `StepLabel.StepIconComponent`.

## API

```tsx
<Step>
  <StepLabel
    StepIconComponent={CustomStepIcon}
    error={hasError}
  >
    배송지 입력
  </StepLabel>
</Step>
```

`StepIcon` is rarely used directly — `Step` + `StepLabel` render it automatically. Override only when you need a custom icon set.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `ReactNode` | step number | The icon content (number, custom component) |
| `active` | `boolean` | `false` | Current step |
| `completed` | `boolean` | `false` | Past step |
| `error` | `boolean` | `false` | Step failed |

## States

| State | Visual |
| --- | --- |
| Upcoming | outlined circle, step number, fg-muted |
| Active | filled brand circle, step number, fg-on-brand, slightly larger |
| Completed | filled brand circle, checkmark icon, fg-on-brand |
| Error | filled error circle, X icon, fg-on-error |
| Disabled | reduced opacity |

## Tokens consumed

```
--step-icon-size-24
--step-icon-bg-active           /* brand */
--step-icon-bg-completed        /* brand */
--step-icon-bg-error            /* error */
--step-icon-bg-upcoming         /* transparent */
--step-icon-border-upcoming     /* fg-muted */
--step-icon-fg-on-brand
--step-icon-fg-on-error
--step-icon-fg-upcoming
```

## Accessibility

- Decorative (the `StepLabel` text is the accessible name).
- For error states, screen readers announce via `StepLabel.error` setting `aria-invalid` on the step.

## Edge cases

- **Long stepper (8+ steps)** — number-in-circle becomes hard to read; switch to `MobileStepper` (dots/progress) for mobile.
- **Custom icons per step** (e.g., shopping cart → payment → confirmation) — override `StepIconComponent` per `StepLabel`. Different icons signal step *type*, not just step *number*.

## Code example

```tsx
function CartStepper({ activeStep }) {
  const steps = [
    { label: '장바구니', icon: <CartIcon /> },
    { label: '결제 정보', icon: <CardIcon /> },
    { label: '주문 확인', icon: <CheckIcon /> },
  ];

  return (
    <Stepper activeStep={activeStep} alternativeLabel>
      {steps.map((step, idx) => (
        <Step key={step.label}>
          <StepLabel
            StepIconComponent={({ active, completed }) => (
              <Avatar
                sx={{
                  bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                  width: 32,
                  height: 32,
                }}
              >
                {step.icon}
              </Avatar>
            )}
          >
            {step.label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
```

## Don't

- Don't render directly outside `StepLabel`.
- Don't use icons that don't communicate progress (e.g., decorative-only flowers).

## References

- MUI: [`StepIcon`](../docs/reference/mui.md#step-icon)

## Cross-reference

- [`component-step.md`](component-step.md)
- [`component-step-label.md`](component-step-label.md)
- [`component-steps.md`](component-steps.md)
