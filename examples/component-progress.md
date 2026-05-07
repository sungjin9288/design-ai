# `Progress` — spec

> Citing Ant Design `Progress`, MUI `LinearProgress`/`CircularProgress`, shadcn-ui `progress`

## Purpose

Visualizes the completion of a task. Two variants:

| Variant | Use |
| --- | --- |
| **Linear** (bar) | Long, sequential operations: file upload, multi-step form, page-load progress |
| **Circular** (ring) | Compact: button loading, profile completion percentage, score display |

## Determinate vs Indeterminate

| Mode | Use |
| --- | --- |
| **Determinate** (knows %) | Upload of known file size, multi-step wizard (3/5), survey progress |
| **Indeterminate** (doesn't know %) | API call with unknown duration, "thinking" states |

For indeterminate operations < 2 seconds, prefer a Spinner (not a Progress component). Progress implies multi-step.

## Anatomy — Linear

```
Determinate:     ▰▰▰▰▰▰▰▱▱▱  60%
Indeterminate:   ▱▱▰▰▰▰▱▱▱▱  (animated sweep)
```

```tsx
<Progress value={60} />                 {/* determinate */}
<Progress />                            {/* indeterminate (no value) */}
<Progress value={60} max={100} />       {/* explicit max */}
```

## Anatomy — Circular

```
   ⌒⌒
  ⟨ 60% ⟩    ← ring with arc filled to 60%, label centered
   ⌣⌣
```

```tsx
<Progress variant="circular" value={60} size={48} showLabel />
<Progress variant="circular" />          {/* indeterminate spinner */}
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | — | 0–100 (or 0–`max`). Omit for indeterminate. |
| `max` | `number` | `100` | Upper bound |
| `variant` | `"linear" \| "circular"` | `"linear"` | |
| `intent` | `"primary" \| "success" \| "warning" \| "error"` | `"primary"` | Bar color |
| `size` | `"sm" \| "md" \| "lg"` (linear) / `number` (circular, px) | `"md"` / `40` | |
| `thickness` | `number` | derived | Bar height (linear) or ring stroke (circular) |
| `showLabel` | `boolean` | `false` | Render the % value |
| `label` | `ReactNode` | `${value}%` | Custom label |
| `striped` | `boolean` | `false` | Animated diagonal stripes (linear, indicates active progress) |

## Linear sizes

| Size | Height | Use |
| --- | --- | --- |
| `sm` | 4px | Subtle, beneath nav bars |
| `md` (default) | 8px | Standard upload/download |
| `lg` | 12px | Hero / dashboard prominence |

## Circular sizes

| Size | Diameter | Stroke | Use |
| --- | --- | --- | --- |
| `sm` (16) | 16px | 2px | Inside a button (loading) |
| `md` (24) | 24px | 3px | Inline loading indicator |
| `lg` (40, default) | 40px | 4px | Page/section loader |
| `xl` (64+) | 64px | 5px | Hero / score display |

## States

| State | Linear | Circular |
| --- | --- | --- |
| Determinate, value > 0 | Bar fills `value`% | Ring arc to `value`° |
| Determinate, value = 100 | Full bar, optional success color shift | Full ring |
| Indeterminate | Animated sweep (1500ms loop, ease-in-out) | Spinning arc (1000ms loop, linear) |
| Striped (linear active) | Bar fills + diagonal stripes animate | N/A |

## Tokens consumed

```
--color-bg-subtle           (track)
--color-primary-default     (bar fill, default intent)
--color-success
--color-warning
--color-error
--color-text-secondary       (label)
--space-xs, --space-sm
--radius-full                (rounded bar/ring ends)
--motion-default             (transitions on value change)
--easing-out
```

For dark mode, ensure track is visible against bg — typically `--color-bg-subtle` works in both modes.

## Behavior

### Determinate value transitions

- Animate value changes over 200–400ms with `ease-out`.
- For very small changes (< 5%), instant transition is fine.
- Don't animate every frame on continuous progress (e.g., upload at 47.3% → 47.4%) — let the visual update lag for smoother perception.

### Indeterminate animation

Linear: 0% → 100% sweep, 1500ms loop. The "wave" travels left to right.

Circular: full rotation, 1000ms loop, linear easing. The arc itself can also pulse in length (10–80% arc) for the Material-style "growing/shrinking" spinner.

## Accessibility

- **Determinate**: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` (or `aria-labelledby`).
  ```html
  <div role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" aria-label="Upload progress">
  ```
- **Indeterminate**: `role="progressbar"` with no `aria-valuenow` (omit, don't set to 0).
- **Don't update aria-valuenow on every frame** — debounce to ~5–10% steps, or update on percentage milestones.
- **Reduced motion**: indeterminate animation should be replaced with a static "loading" indicator. Determinate value transitions should be instant (no 300ms animation).

```css
@media (prefers-reduced-motion: reduce) {
  .progress { transition: none; }
  .progress-indeterminate { animation: none; }
}
```

## Code example

```tsx
// File upload progress
<div>
  <p>uploading.pdf — {bytesFormatted}</p>
  <Progress value={uploadPct} aria-label="Upload progress" />
</div>

// Multi-step form
<Progress value={(currentStep / totalSteps) * 100} aria-label={`Step ${currentStep} of ${totalSteps}`} showLabel />

// Indeterminate while waiting
<Progress aria-label="Loading account data" />

// Profile completion (circular hero)
<Progress
  variant="circular"
  value={profileCompletion}
  size={120}
  showLabel
  label={`${profileCompletion}% 완료`}
/>

// Inside a Button (replaces button's children with circular)
<Button loading><Progress variant="circular" size={16} /></Button>
```

## Edge cases

- **Value > max**: clamp to max. Don't render at 110%.
- **Negative value**: clamp to 0.
- **Value transitions backwards** (e.g., 80% → 30%, retrying upload): animate, but communicate the rollback in copy ("재시도 중…").
- **Stuck progress** (no movement for 30s+): show a "still working…" indicator alongside, or escalate to error.
- **0% determinate**: show empty track. Don't fall back to indeterminate animation.
- **100% determinate**: optionally shift to success color + checkmark when done. Otherwise, unmount the progress.
- **Multiple concurrent**: stack vertically, each labeled. Don't sum into one combined progress.
- **Reduced motion + indeterminate**: still need to communicate "in progress" — show a text label, e.g., "처리 중…".

## Don't

- Don't use indeterminate for operations under 1 second. Just don't show a progress component.
- Don't fake progress (e.g., always show 0 → 100% over 3s while actual completion time is unknown). Fails when reality differs.
- Don't combine multiple unrelated tasks into one progress bar.
- Don't show progress for irreversible / consequential actions without a way to cancel.
- Don't omit aria-label.
- Don't use a Progress for a Skeleton's job — Skeleton is for content shape, Progress is for completion %.

## References

- Ant Design: [`refs/ant-design/components/progress/`](../refs/ant-design/components/progress/) — `Progress` with `type="line" | "circle" | "dashboard"` (3/4 ring), `steps` (segmented), `success` (overlay).
- MUI: separate `LinearProgress` and `CircularProgress` components. `variant="determinate" | "indeterminate" | "buffer" | "query"`. Buffer mode for media playback.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/progress.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/progress.tsx) — Radix primitive. Linear only. Circular requires a different primitive.

## Cross-reference

- [examples/component-skeleton.md](component-skeleton.md) — for "loading shape", not "progress %"
- [examples/component-button.md](component-button.md) — uses circular Progress for `loading` state
- [knowledge/motion/principles.md](../knowledge/motion/principles.md) — animation timing
