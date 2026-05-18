# `StepButton` - spec

> Direct upstream component: MUI `StepButton`. Parent pattern references: Ant Design `Steps`, MUI `Stepper`, and composed shadcn-style primitives.

## Purpose

`StepButton` makes a step indicator clickable in non-linear steppers. Use it when users may revisit completed steps, fix validation errors, or jump between sections in a wizard.

Do not use it when the flow must be strictly linear. Future steps should remain unavailable until prerequisites are satisfied.

## Anatomy

```
StepButton
├── Root button
│   ├── StepIcon        optional override
│   ├── StepLabel       text/content
│   └── Optional text   optional helper, e.g. "선택"
```

| Part | Required | Purpose |
| --- | --- | --- |
| Root button | yes | Receives focus and activates navigation to the step. |
| Icon | optional | Overrides the default number/check/error icon. |
| Label | yes | Names the step. |
| Optional node | optional | Marks optional/skipped status. |

## API

```tsx
<Step completed={isCompleted}>
  <StepButton onClick={() => goToStep(index)} optional={<Text size="sm">선택</Text>}>
    결제 수단
  </StepButton>
</Step>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Usually `StepLabel` or label content passed into `StepLabel`. |
| `classes` | `Partial<StepButtonClasses>` | - | Style override hooks for MUI-style implementations. |
| `component` | `React.ElementType` | MUI `ButtonBase` default | Root override. Must preserve button semantics. |
| `icon` | `ReactNode` | Step index from parent | Icon displayed by the step label. |
| `optional` | `ReactNode` | - | Secondary optional/skipped content below or beside label. |
| `sx` | `SxProps<Theme>` | - | MUI system override. Prefer tokens for shared design-system code. |

Inherits button-like props from MUI `ButtonBase`. In MUI, `disabled` is controlled by step context rather than the `StepButton` prop surface.

## API choices made

- Keep `StepButton` as a child of `Step`. Status and disabled logic should come from the parent stepper.
- Expose `optional` because multi-step forms often need visible "선택" or "건너뜀" context.
- Do not add `status` here. Status belongs to `Step`, `StepLabel`, or the parent `Steps` model.
- Do not use anchors for wizard navigation unless the route actually changes.

## States

| State | Trigger | Visual rule |
| --- | --- | --- |
| Wait | Future or incomplete step | Muted label and neutral icon. |
| Process | Current active step | Primary icon/label; set current-step semantics. |
| Finish | Completed step | Check icon or completed marker; remains clickable if revisiting is allowed. |
| Error | Step has validation error | Error icon and text label; do not rely on color alone. |
| Hover | Pointer over enabled step | Subtle background or label emphasis. |
| Focus-visible | Keyboard focus | 2px focus ring around the whole button, not only the icon. |
| Active | Press | Pressed background; no layout shift. |
| Disabled | Future locked step | Muted, non-clickable, `aria-disabled` if not native disabled. |
| Loading | Step validation pending | Small spinner near label/icon; suppress repeated activation. |

## Tokens consumed

```
--color-primary-default
--color-error
--color-text-primary
--color-text-secondary
--color-text-disabled
--color-bg-subtle
--color-border-default
--color-focus-ring
--space-xs
--space-sm
--space-md
--radius-md
--motion-fast
```

## Accessibility

- Render a native `<button type="button">` when the step does not navigate to a new route.
- The active step must be announced as current. Use `aria-current="step"` on the current step item or button, consistently with the parent `Steps` implementation.
- Disabled future steps use native `disabled` where possible; custom roots need `aria-disabled="true"` and no activation.
- Error steps need text in the accessible name, such as "오류: 결제 수단".
- Touch target must be at least 44x44 on mobile.
- The connector line remains `aria-hidden`; the button owns only the step label/icon.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Moves through enabled clickable steps in order. |
| `Enter` / `Space` | Activates the focused step. |
| Arrow keys | Optional parent-level roving behavior when the stepper is implemented as a tablist. |

## Code example

```tsx
<Steps current={currentStep} clickable onChange={setCurrentStep}>
  {steps.map((step, index) => (
    <Step
      key={step.id}
      completed={index < currentStep && !step.hasError}
      disabled={index > highestReachableStep}
      status={step.hasError ? "error" : undefined}
    >
      <StepButton
        aria-current={index === currentStep ? "step" : undefined}
        onClick={() => setCurrentStep(index)}
        optional={step.optional ? <Text size="sm">선택</Text> : undefined}
      >
        {step.label}
      </StepButton>
    </Step>
  ))}
</Steps>
```

## Edge cases

- **User jumps back and edits**: mark later dependent steps as needing review if their data becomes stale.
- **Future step disabled**: keep it visible so progress is understandable, but suppress focus/activation.
- **Validation error in completed step**: keep the step clickable and expose error text in the label.
- **Vertical stepper**: root button can fill width for easier scanning and larger touch target.
- **Custom component root**: must forward refs, keyboard events, disabled state, and focus-visible styles.
- **Long Korean labels**: allow two-line labels in vertical mode; truncate in compact horizontal mode with tooltip only if necessary.
- **Reduced motion**: remove animated icon transitions; state changes still occur.

## Don't

- Don't make future locked steps clickable.
- Don't use `StepButton` for a decorative progress indicator.
- Don't put form fields inside the button.
- Don't encode error/completed state only with icon color.

## References

- MUI direct source: [`refs/mui/packages/mui-material/src/StepButton/StepButton.d.ts`](../refs/mui/packages/mui-material/src/StepButton/StepButton.d.ts)
- MUI implementation: [`refs/mui/packages/mui-material/src/StepButton/StepButton.js`](../refs/mui/packages/mui-material/src/StepButton/StepButton.js)
- MUI stepper docs/examples: [`refs/mui/docs/data/material/components/steppers/`](../refs/mui/docs/data/material/components/steppers/)
- Ant Design parent pattern: [`refs/ant-design/components/steps/`](../refs/ant-design/components/steps/)
- Accessibility baseline: [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)

## Cross-reference

- [examples/component-steps.md](component-steps.md)
- [examples/component-step-label.md](component-step-label.md)
- [examples/component-step-icon.md](component-step-icon.md)
