# `StepContent` — spec

> Synthesized from MUI `StepContent`. The body region under a vertical-orientation `Step`. Renders the step's actual form / instruction / control panel. Only used with `<Stepper orientation="vertical">`.

## When to use

- Vertical-orientation steppers (each step has expanded body content).
- Mobile onboarding flows where steps stack vertically.
- For horizontal steppers, render content separately below the stepper.

## API

```tsx
<Stepper activeStep={step} orientation="vertical">
  <Step>
    <StepLabel>이메일 입력</StepLabel>
    <StepContent>
      <TextField fullWidth label="이메일" />
      <Stack direction="row" gap={1} sx={{ mt: 2 }}>
        <Button onClick={handleNext} variant="contained">다음</Button>
      </Stack>
    </StepContent>
  </Step>
</Stepper>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Step body content |
| `transitionDuration` | `number \| 'auto'` | `'auto'` | Collapse animation |
| `TransitionComponent` | `Component` | `Collapse` | Custom transition |
| `TransitionProps` | `TransitionProps` | — | Pass-through |

## States

| State | Visual |
| --- | --- |
| Active step | Content expanded |
| Inactive step | Content collapsed (animated) |

## Tokens consumed

```
--space-md                  /* horizontal padding */
--space-md-y                /* vertical padding */
--motion-duration-auto
--step-connector-line       /* left vertical rule */
```

## Accessibility

- Hidden content is `aria-hidden` when collapsed.
- Focus moves into the active step's content automatically when activeStep changes.
- For long step content with internal scrolling, the parent step should handle scroll-into-view.

## Edge cases

- **Form validation per step** — show errors inline AND prevent progression to next step. Keep current `StepContent` expanded until valid.
- **Long content (10+ form fields)** — that's a multi-screen flow, not a vertical stepper. Switch to a separate page per step.
- **Mobile narrow viewport** — vertical orientation works well; ensure step labels and content fit at 320px.

## Code example

```tsx
function VerticalOnboarding() {
  const [step, setStep] = useState(0);
  const totalSteps = 3;

  return (
    <Stepper activeStep={step} orientation="vertical">
      <Step>
        <StepLabel>기본 정보</StepLabel>
        <StepContent>
          <Stack gap={2}>
            <TextField label="이름" />
            <TextField label="이메일" />
            <Stack direction="row" gap={1}>
              <Button onClick={() => setStep(1)} variant="contained">
                다음
              </Button>
            </Stack>
          </Stack>
        </StepContent>
      </Step>
      <Step>
        <StepLabel>비밀번호</StepLabel>
        <StepContent>
          <TextField fullWidth label="비밀번호" type="password" />
          <Stack direction="row" gap={1} sx={{ mt: 2 }}>
            <Button onClick={() => setStep(0)}>이전</Button>
            <Button onClick={() => setStep(2)} variant="contained">다음</Button>
          </Stack>
        </StepContent>
      </Step>
      <Step>
        <StepLabel>완료</StepLabel>
        <StepContent>
          <Typography>가입이 완료됐어요.</Typography>
          <Button variant="contained" sx={{ mt: 2 }}>시작하기</Button>
        </StepContent>
      </Step>
    </Stepper>
  );
}
```

## Don't

- Don't use with horizontal stepper — content won't render.
- Don't omit Back/Next buttons — users need explicit progression controls.

## References

- MUI: [`StepContent`](../refs/mui/packages/mui-material/src/StepContent/)

## Cross-reference

- [`component-steps.md`](component-steps.md)
- [`component-step.md`](component-step.md)
- [`component-step-label.md`](component-step-label.md)
- [`knowledge/patterns/b2b-onboarding-flows.md`](../knowledge/patterns/b2b-onboarding-flows.md)
