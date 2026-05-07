# `Tour` (in-product overlay tour) — spec

> Citing Ant Design `Tour`, MUI (no built-in), shadcn-ui (composition with Popover)

## Purpose

A series of overlay tooltips that highlight UI elements one at a time, with "Next / Previous / Skip" navigation. Used for: onboarding new users, surfacing new features, complex tool walkthroughs.

**Use sparingly.** See [`knowledge/patterns/onboarding.md`](../knowledge/patterns/onboarding.md) — tours have the highest friction of any onboarding pattern.

## Anatomy

```
[Page content, dimmed except for the highlighted element]

   ┌──[ highlighted UI element ]──┐
   │   [target, brightly visible]  │
   └──────────────────────────────┘
        ▼ (callout pointer)
   ┌────────────────────────────────────┐
   │  Step 1 of 4                        │
   │                                      │
   │  Click here to add a transaction.   │
   │                                      │
   │       [Skip]    [Next]              │
   └────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Backdrop dim | yes | Darkens the page (~50% black) |
| Spotlight area | yes | Cuts a hole around the target element so it's bright |
| Callout | yes | Position relative to target |
| Step indicator | yes | "Step N of M" |
| Title | yes | Action description |
| Next / Previous / Skip | yes | Step navigation |

## API

```tsx
<Tour
  open={tourOpen}
  steps={[
    {
      target: "#add-button",
      title: "거래 추가",
      description: "여기를 클릭해 첫 거래를 추가해 보세요.",
      placement: "bottom",
    },
    {
      target: "#filter-area",
      title: "필터링",
      description: "기간 / 카테고리로 거래를 필터링할 수 있어요.",
    },
    {
      target: "#export",
      title: "내보내기",
      description: "거래 내역을 CSV로 내보낼 수 있어요.",
    },
  ]}
  onClose={() => setTourOpen(false)}
  onComplete={() => markFirstRunDone()}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Whether tour is active |
| `current` | `number` | `0` | Current step index (controlled mode) |
| `onChange` | `(step: number) => void` | — | |
| `steps` | `Step[]` | — | Tour steps |
| `onClose` | `() => void` | — | User clicked Skip / closed |
| `onComplete` | `() => void` | — | Reached the end |
| `placement` | `"top" \| "right" \| "bottom" \| "left"` (default callout side) | `"bottom"` | Per-step override possible |
| `mask` | `boolean` | `true` | Show backdrop dim |
| `maskClosable` | `boolean` | `false` | Click on backdrop closes |

```ts
type Step = {
  target: string | HTMLElement;     // CSS selector or element ref
  title: string;
  description: ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
  hideArrow?: boolean;
  beforeShow?: () => void | Promise<void>;   // e.g., scroll target into view
  afterHide?: () => void;
};
```

## Behavior

### Step transition

1. Tour finds target element by selector/ref.
2. Calls `beforeShow` (e.g., scroll into view, expand a section).
3. Fades in backdrop + cuts spotlight around target.
4. Renders callout near target.
5. User clicks Next → repeat for next step.

### Target element off-screen

`beforeShow` should `scrollIntoView` to bring the target into view. Wait for scroll to complete (200–300ms), then position callout.

### Target element not present

If selector doesn't match (e.g., conditional UI not rendered), skip the step or show error. Best: validate steps when starting tour.

### Closing

- **Skip**: closes tour, `onClose` fires. Current step is remembered (offer to resume later).
- **Complete**: reaches last step + clicks Done. `onComplete` fires.
- **Backdrop click**: only if `maskClosable=true`.
- **Escape key**: closes (UX convention — provide).

## States

| State | Visual |
| --- | --- |
| Idle | not visible |
| Animating in | fade backdrop + scale-in callout |
| Active step | spotlight + callout visible |
| Transitioning between steps | smooth cross-fade or slide |

## Tokens consumed

```
--color-bg-overlay         (backdrop)
--color-bg-elevated         (callout)
--color-text-primary
--color-text-secondary
--color-primary-default     (Next button bg)
--space-md, --space-base
--radius-md
--shadow-popover
--motion-default            (250-300ms transitions)
```

## Accessibility

- Tour is a modal-equivalent: focus trap inside the callout while active.
- Each callout: `role="dialog"`, `aria-labelledby={titleId}`, `aria-describedby={descId}`.
- Backdrop: `aria-hidden="true"`.
- Step indicator: announced ("Step 1 of 4").
- Focus moves into callout on step change.
- Escape closes tour.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Cycle through callout interactive elements (Next, Prev, Skip) |
| `Enter` (on Next) | Advance |
| `Escape` | Close tour |
| `←` `→` | Optional: previous / next step (not standard) |

## Don't

- Don't use Tour as the primary onboarding for simple products. Empty-state CTA is friendlier. See [`knowledge/patterns/onboarding.md`](../knowledge/patterns/onboarding.md).
- Don't run tours longer than 5 steps. User fatigue is real.
- Don't auto-show tours on every visit. Show once, dismiss, persist.
- Don't tour features the user might never use. Tour the core path.
- Don't make tours required. Always provide Skip.
- Don't run tour without scroll/visibility setup — target out of view = broken.
- Don't gate the feature behind the tour ("can't proceed until you complete tour").

## References

- Ant Design: [`refs/ant-design/components/tour/`](../refs/ant-design/components/tour/) — `Tour` with steps, target refs, custom rendering. Modern Ant addition.
- MUI: no built-in. Use libraries like `react-joyride` or `intro.js`.
- shadcn-ui: no built-in. Compose with Popover + custom backdrop.

## Cross-reference

- [`knowledge/patterns/onboarding.md`](../knowledge/patterns/onboarding.md) — when to use Tour vs other patterns
- [`examples/component-popover.md`](component-popover.md) — Tour callouts use popover pattern
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — focus trap, Escape behavior
