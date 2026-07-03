# `StepLabel` — spec

> Synthesized from MUI `StepLabel`. The text label of a `Step` — primary text + optional caption. Combines `StepIcon` + label into the standard step appearance.

## When to use

- Inside every `Step` that has a visible label.
- For step-only-by-position (rare), use `Step` without `StepLabel`.

## API

```tsx
<Step>
  <StepLabel
    optional={<Typography variant="caption">선택</Typography>}
    error={!!stepErrors[currentStep]}
  >
    배송지 정보
  </StepLabel>
</Step>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Primary label |
| `icon` | `ReactNode` | step number | Override icon |
| `optional` | `ReactNode` | — | Caption beneath label (e.g., "Optional", "Required") |
| `error` | `boolean` | `false` | Mark step as failed |
| `StepIconComponent` | `ElementType` | `StepIcon` | Custom icon component |
| `StepIconProps` | `StepIconProps` | — | Pass-through to icon |

## States

Inherited from parent `Step`:
- Upcoming: muted text + outlined icon
- Active: bold text + filled icon
- Completed: regular text + checkmark icon
- Error: error-colored text + error icon

## Tokens consumed

```
--font-size-body
--font-weight-medium       /* active */
--font-weight-regular
--color-fg-default
--color-fg-muted
--color-fg-error
--space-sm                 /* gap between icon and label */
```

## Accessibility

- The label is the accessible name of the step.
- For `error={true}`, `aria-invalid="true"` propagates.
- `optional` content is read after the primary label.
- Korean step labels: keep concise (1-3 words). Long labels truncate.

## Edge cases

- **Korean honorific** — step labels use noun form ("배송지 입력") not sentence form ("배송지를 입력하세요").
- **Optional steps** — set `optional={<Typography variant="caption">선택</Typography>}`. Don't bake "(선택)" into the primary label.
- **Long labels in horizontal stepper** — switch to `<Stepper alternativeLabel>` so labels render below icons (more horizontal room).

## Code example

```tsx
<Stepper activeStep={step} orientation="vertical">
  <Step>
    <StepLabel>이메일 인증</StepLabel>
  </Step>
  <Step>
    <StepLabel
      optional={<Typography variant="caption" color="text.secondary">선택</Typography>}
    >
      프로필 사진
    </StepLabel>
  </Step>
  <Step>
    <StepLabel error={!!errors.payment}>
      결제 정보
    </StepLabel>
  </Step>
</Stepper>
```

## Don't

- Don't put block-level content inside the label — break composition.
- Don't omit error state when a step actually failed — silent failure is confusing.

## References

- MUI: [`StepLabel`](../docs/reference/mui.md#step-label)

## Cross-reference

- [`component-step.md`](component-step.md)
- [`component-step-icon.md`](component-step-icon.md)
- [`component-steps.md`](component-steps.md)
- [`knowledge/patterns/onboarding.md`](../knowledge/patterns/onboarding.md)
