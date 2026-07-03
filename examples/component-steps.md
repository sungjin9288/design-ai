# `Steps` (Stepper) — spec

> Citing Ant Design `Steps`, MUI `Stepper`, shadcn-ui (no built-in — composed)

## Purpose

Visualizes progress through a sequence of steps. Used in: multi-step forms, checkout flows, onboarding wizards, KYC / 본인인증 flows.

Different from:

| Pattern | Use |
| --- | --- |
| **Steps / Stepper** | Sequential, predetermined N steps |
| **Breadcrumb** | Hierarchical position (not sequential) |
| **Tabs** | Mutually exclusive views, no inherent order |
| **Progress bar** | Continuous % completion |

## Anatomy

```
Horizontal:
┌────┐    ┌────┐    ┌────┐    ┌────┐
│ ✓  │ ── │ 2  │ ── │ 3  │ ── │ 4  │
└────┘    └────┘    └────┘    └────┘
완료      현재      대기      대기

Vertical:
┌────┐
│ ✓  │  Step 1: 본인인증
│    │  완료
└────┘
  │
┌────┐
│ 2  │  Step 2: 정보 입력
│    │  진행 중
└────┘
  │
┌────┐
│ 3  │  Step 3: 확인
│    │  대기
└────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Step indicator | yes | Number / icon — shows status |
| Step label | usually | Title of the step |
| Step description | optional | Subtitle or instruction |
| Connector | yes | Line between steps (filled if completed) |

## API

```tsx
<Steps current={2} status="process">
  <Steps.Item title="본인인증" description="휴대폰 번호로 인증" />
  <Steps.Item title="정보 입력" description="기본 정보를 입력합니다" />
  <Steps.Item title="확인" description="입력한 정보를 확인합니다" />
  <Steps.Item title="완료" />
</Steps>
```

| Prop (root) | Type | Default | Description |
| --- | --- | --- | --- |
| `current` | `number` | `0` | Index of the currently-active step (0-indexed) |
| `status` | `"process" \| "wait" \| "finish" \| "error"` | `"process"` | Status of the current step |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `clickable` | `boolean` | `false` | Allow user to click steps to navigate |
| `onChange` | `(step: number) => void` | — | Called when user clicks a step (clickable mode) |

| Prop (Item) | Type | Description |
| --- | --- | --- |
| `title` | `string \| ReactNode` | Step title |
| `description` | `string \| ReactNode` | Subtitle |
| `icon` | `ReactNode` | Custom icon (override number / checkmark) |
| `disabled` | `boolean` | Skip this step (rare) |
| `status` | overrides root | Per-step status override |

## Step status states

| Status | When | Visual |
| --- | --- | --- |
| `wait` | Steps after current | Gray indicator + gray line |
| `process` | Currently-active step | Primary indicator + filled label |
| `finish` | Completed steps | Primary indicator with checkmark + filled line |
| `error` | Step failed (validation, upload error) | Error red indicator |

## Variants

### Numbered

Steps show numbers `1, 2, 3...`. Switches to checkmark when complete.

### Dot (compact)

Just a dot indicator, no number. Use for many steps where number is noise:

```
●──●──●──○──○──○
```

### With icon

Custom icon per step (e.g., 📞 phone for verification, 📋 form for input):

```
[📞] ── [📋] ── [✓]
```

### Status-only (just label)

For text-heavy multi-step forms:

```
✓ 본인인증 완료
● 정보 입력 (현재)
○ 확인
○ 완료
```

## Sizes

| Size | Indicator | Font |
| --- | --- | --- |
| `sm` | 24px | 12px |
| `md` (default) | 32px | 14px |
| `lg` | 40px | 16px |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle
--color-primary-default       (process, finish indicator + line)
--color-text-primary
--color-text-secondary        (wait labels)
--color-text-tertiary         (descriptions)
--color-on-primary             (text inside indicator when filled)
--color-error                  (error status)
--color-border-default         (connector line — wait state)
--space-md, --space-base
--radius-full                  (indicator circle)
--motion-default               (transition between states)
```

## Accessibility

- Wrap in `<ol role="list" aria-label="Form progress">` (or "checkout steps" / "verification steps").
- Each step is `<li>`.
- Current step: `aria-current="step"`.
- Completed steps: include `<span class="sr-only">Completed: </span>` before label so screen reader announces status.
- Connector lines: `aria-hidden="true"`.

```html
<ol aria-label="가입 진행 단계">
  <li aria-current="false">
    <span class="sr-only">완료: </span>
    본인인증
  </li>
  <li aria-current="step">
    정보 입력 (단계 2 / 4)
  </li>
  <li aria-current="false">
    <span class="sr-only">대기: </span>
    확인
  </li>
  ...
</ol>
```

### When clickable

Render steps as `<button>` (not just clickable divs):
- Completed steps: clickable to revisit.
- Future steps: disabled.
- Use `aria-disabled="true"` for non-clickable future steps.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Move through clickable steps |
| `Enter` / `Space` | Activate (navigate to step) |

## Mobile patterns

For narrow screens, horizontal steppers crunch. Three options:

| Approach | Use |
| --- | --- |
| **Vertical stepper** | Best when label + description matter, screens are tall enough |
| **Compact dot stepper** | Just dots showing "step N of M" |
| **Just text** | "단계 2 / 4: 정보 입력" — simplest |

For `n > 5` steps on mobile, **always switch to compact or text-only**.

## Code example

```tsx
// Multi-step form
<Form>
  <Steps current={currentStep} status={hasError ? "error" : "process"}>
    <Steps.Item title="본인인증" description="휴대폰으로 본인 확인" />
    <Steps.Item title="정보 입력" description="기본 정보를 입력해 주세요" />
    <Steps.Item title="확인" description="입력 정보를 확인합니다" />
    <Steps.Item title="완료" />
  </Steps>

  <Form.Steps current={currentStep}>
    <Form.Step><PhoneVerificationStep /></Form.Step>
    <Form.Step><BasicInfoStep /></Form.Step>
    <Form.Step><ConfirmStep /></Form.Step>
    <Form.Step><DoneStep /></Form.Step>
  </Form.Steps>

  <div className="flex justify-between">
    {currentStep > 0 && <Button variant="outline" onClick={prev}>이전</Button>}
    <Button onClick={next}>{currentStep === 3 ? "완료" : "다음"}</Button>
  </div>
</Form>

// Compact for mobile
<div aria-label="가입 단계">
  <p className="text-sm text-text-secondary">단계 {current + 1} / {total}</p>
  <Progress value={(current + 1) / total * 100} />
</div>
```

## Edge cases

- **User navigates back**: previous steps must remain marked as `finish` (until they re-edit). Don't reset to `wait`.
- **Step has an error after user advanced**: mark with `status="error"` AND keep the step accessible (don't trap user forward).
- **Skipping optional steps**: if a step is skippable, show it as `finish` with a "Skipped" sub-label after skipping.
- **Async server validation between steps**: lock advance with a spinner; don't let user click ahead while pending.
- **Many steps (8+)**: switch to compact / text-only on mobile; consider splitting into sub-flows.
- **One-step (just current shown)**: don't render Steps. Show "Step 1 of 1" or omit.
- **Conditional steps** (steps that appear/disappear based on prior choices): manage in state; render the actual current set, not the maximum.

## Don't

- Don't make every step clickable. Only completed (and current); future steps locked.
- Don't show error on a step the user hasn't yet touched.
- Don't auto-advance steps — user explicitly clicks "Next".
- Don't lose user input when navigating back.
- Don't show 5+ step labels on mobile portrait — they overlap. Use compact.
- Don't use Steps for non-sequential navigation. Use Tabs.

## References

- Ant Design: [`refs/ant-design/components/steps/`](../docs/reference/ant-design.md#steps) — `Steps`, `Steps.Item`. Status, direction, size, progress dot variant. Most exhaustive.
- MUI: [`refs/mui/packages/mui-material/src/Stepper/`](../docs/reference/mui.md#stepper) — `Stepper`, `Step`, `StepLabel`, `StepContent`. Vertical with collapsible content per step is unique.
- shadcn-ui: no built-in — compose from primitives. The `progress` and custom layout get you 80% there.

API choices made:
- **Adopted Ant's `current` prop** (numeric, 0-indexed) rather than per-step `active` flags — cleaner for forms.
- **`status` at root applies to current step**; per-step override available.
- **`clickable` opt-in**: most use cases are linear; making clickable the default invites users to skip ahead.

## Cross-reference

- [`examples/component-form.md`](component-form.md) — Form.Steps pattern
- [`examples/component-progress.md`](component-progress.md) — alternative for non-discrete progress
- [`knowledge/patterns/onboarding.md`](../knowledge/patterns/onboarding.md) — multi-step onboarding patterns
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — 본인인증 flow expectations
