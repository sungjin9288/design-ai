# `MobileStepper` — spec

> Synthesized from MUI `MobileStepper`. Compact step indicator for mobile-first flows — shows progress as dots, text, or a progress bar. Used in onboarding, image carousels, multi-step bottom sheets.

## When to use

- Mobile onboarding flow (3-7 steps).
- Carousel position indicator.
- Multi-step bottom sheet.

## When NOT to use

- Desktop multi-step form → use `Stepper` (horizontal, labeled).
- Single-step → no indicator needed.
- Long flows (10+ steps) → use a percentage progress instead.

## Anatomy

```
Variant = "dots":
┌──────────────────────────────────────────┐
│  [Back]    ● ○ ○ ○ ○             [Next] │
└──────────────────────────────────────────┘

Variant = "progress":
┌──────────────────────────────────────────┐
│  [Back]    ▓▓▓▓░░░░░░░░░░         [Next] │
└──────────────────────────────────────────┘

Variant = "text":
┌──────────────────────────────────────────┐
│  [Back]         3 / 7             [Next] │
└──────────────────────────────────────────┘
```

## API

```tsx
<MobileStepper
  variant="dots"
  steps={5}
  position="bottom"
  activeStep={step}
  nextButton={
    <Button onClick={handleNext} disabled={step === 4}>
      다음 <KeyboardArrowRight />
    </Button>
  }
  backButton={
    <Button onClick={handleBack} disabled={step === 0}>
      <KeyboardArrowLeft /> 이전
    </Button>
  }
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'dots' \| 'progress' \| 'text'` | `'dots'` | Indicator style |
| `steps` | `number` | required | Total steps |
| `activeStep` | `number` | `0` | Current step (0-indexed) |
| `position` | `'bottom' \| 'top' \| 'static'` | `'bottom'` | Sticky position |
| `nextButton` | `ReactNode` | required | Next button element |
| `backButton` | `ReactNode` | required | Back button element |
| `LinearProgressProps` | `LinearProgressProps` | — | Customize progress variant |

## States

| State | Visual |
| --- | --- |
| Step N active | Nth dot filled / progress bar at N/total / "N / total" text |
| First step | Back button disabled |
| Last step | Next button label often changes ("완료" / "Done") |

## Tokens consumed

```
--space-md                 /* horizontal padding */
--dot-size-8               /* dot diameter */
--dot-color-active         /* brand */
--dot-color-inactive       /* fg-subtle */
--mobile-stepper-height-48
```

## Accessibility

- The buttons own their accessible names. The stepper itself has no implicit role.
- For screen-reader announcement of progress, add live region: `aria-live="polite"` on the step text.
- Don't disable navigation buttons — MUI does it; but ensure focus moves elsewhere when disabled (e.g., to the form below).

## Edge cases

- **Too many steps** — 8+ dots become unreadable. Switch to `progress` or `text` variant.
- **Korean step labels** — use "다음" / "이전" / "완료" / "건너뛰기". Cite [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md).
- **Last-step Next button** — label change to "완료" + change `onClick` to submit. Pair with optimistic UI for snappy feel.
- **Position="static"** — embeds inline (good inside cards/sheets); `bottom` floats to viewport bottom.

## Code example

```tsx
function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const totalSteps = 4;
  const isLast = step === totalSteps - 1;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
        {step === 0 && <WelcomeStep />}
        {step === 1 && <ProfileStep />}
        {step === 2 && <PreferencesStep />}
        {step === 3 && <SummaryStep />}
      </Box>
      <MobileStepper
        variant="dots"
        steps={totalSteps}
        position="static"
        activeStep={step}
        nextButton={
          <Button
            onClick={isLast ? handleSubmit : () => setStep(step + 1)}
            variant={isLast ? 'contained' : 'text'}
          >
            {isLast ? '완료' : '다음'}
            {!isLast && <KeyboardArrowRight />}
          </Button>
        }
        backButton={
          <Button onClick={() => setStep(step - 1)} disabled={step === 0}>
            <KeyboardArrowLeft />
            이전
          </Button>
        }
      />
    </Box>
  );
}
```

## Don't

- Don't use without `nextButton` + `backButton` — required props.
- Don't use on desktop — too small / sparse for desktop scale; use `Stepper`.
- Don't change the indicator type mid-flow.

## References

- MUI: [`MobileStepper`](../refs/mui/packages/mui-material/src/MobileStepper/)

## Cross-reference

- [`component-step.md`](component-step.md) — desktop equivalent
- [`component-step.md`](component-step.md)
- [`knowledge/patterns/onboarding.md`](../knowledge/patterns/onboarding.md)
- [`knowledge/patterns/b2b-onboarding-flows.md`](../knowledge/patterns/b2b-onboarding-flows.md)
