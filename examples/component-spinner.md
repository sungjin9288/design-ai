# `Spinner` — spec

> Synthesized from MUI `CircularProgress` (indeterminate variant) and shadcn-ui's spinner pattern. Indeterminate loading indicator — a small rotating circle / ring used inline or as a centered loading state.

## Spinner vs Progress vs Skeleton

> Pick the right loading affordance for the situation.

| | Spinner | Progress | Skeleton |
| --- | --- | --- | --- |
| Determinate? | No | Yes | No |
| Use | Brief loads; intermediate state | Long operations with measurable progress | Layout-aware "content is coming" |
| Where | Buttons, inline within content | Section / page-level, file uploads | Cards, lists, full pages |
| Duration | < 1-2s typical | 1-30s+ | Until content arrives |

For "I'm doing something briefly" → Spinner. For "X% done" → Progress. For "preserve layout while loading" → Skeleton.

## Anatomy

```
   ◜◝
  ◟◞              ← rotating partial-arc

[Loading...]      ← optional adjacent text
```

## API

```tsx
<Spinner />
<Spinner size="sm" />
<Spinner size="lg" />

<Spinner aria-label="Loading data" />

<Spinner color="brand" />
<Spinner color="muted" />

<Button loading>Save</Button>   {/* Spinner inside button */}
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Diameter |
| `color` | `"brand" \| "muted" \| "current" \| "white"` | `"current"` | Color |
| `aria-label` | `string` | `"Loading"` | Screen-reader label |
| `speed` | `"slow" \| "normal" \| "fast"` | `"normal"` | Rotation duration |

## Sizes

| Size | Diameter | Use |
| --- | --- | --- |
| `xs` | 12px | Inline within text, very compact |
| `sm` | 16px | Inside small buttons, beside text |
| `md` (default) | 24px | Inline within content, default buttons |
| `lg` | 32px | Section-level loading |
| `xl` | 48px | Page-level loading |

For most cases: `sm` for inline, `md` for component-level, `lg` for full-section. Avoid going larger — use Skeleton instead.

## Variants

### Color

- `current` (default): inherits from text color (`color: currentColor`).
- `brand`: brand color.
- `muted`: gray.
- `white`: explicit white (for use on dark / colored backgrounds, e.g., inside primary button).

### Speed

- `slow`: 1.5s rotation (calm; for premium / luxury feel).
- `normal` (default): 0.8-1s rotation.
- `fast`: 0.5s rotation (urgent, snappy feedback).

## States

Stateless. Spinner is always animating (when rendered).

For "stop spinning + show success": un-render the Spinner; render a check icon instead. Don't try to morph the spinner.

## Tokens consumed

```
--color-fg-default                 (current)
--color-brand-default              (brand variant)
--color-fg-muted                   (muted)
--motion-spinner-duration          (typically 1s)
```

## CSS

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spinner {
  display: inline-block;
  width: var(--spinner-size);
  height: var(--spinner-size);
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: spin 2s linear infinite;  /* Slower; or none entirely */
  }
}
```

For SVG-based spinner (more flexible coloring / variants):

```tsx
<svg className="spinner" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
  <path d="M2 12 a10 10 0 0 1 10-10" stroke="currentColor" strokeWidth="2" />
</svg>
```

## Accessibility

- `role="status"` (preferred) OR `role="progressbar" aria-valuenow="0"` (less common for indeterminate).
- `aria-label` (default "Loading") for screen readers.
- For very brief loads (< 500ms): consider hiding the Spinner from screen readers (`aria-hidden`) — repeated "Loading" announcements are noise.
- For longer loads: include text content adjacent ("Loading data...") so users with reduced-motion who don't see spinning still get feedback.
- Reduced motion: slow the rotation OR replace with static dots.

## Inside buttons

```tsx
<Button loading>
  {loading && <Spinner size="sm" color="current" />}
  Save
</Button>
```

When button is loading:
- Spinner replaces (or sits beside) the icon.
- Button is disabled (`aria-disabled`).
- Label may be replaced ("Saving...") OR kept (with spinner before it).

## Code example

```tsx
function SaveButton() {
  const [saving, setSaving] = useState(false);

  return (
    <Button onClick={async () => { setSaving(true); await save(); setSaving(false); }} disabled={saving}>
      {saving && <Spinner size="sm" />}
      {saving ? "저장 중..." : "저장"}
    </Button>
  );
}

function DataTable() {
  if (loading) {
    return (
      <div className="table-loading">
        <Spinner size="lg" />
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }
  // ...
}
```

For longer waits, Korean: "잠시만 기다려 주세요...".

## Edge cases

- **Spinner shown for < 200ms**: skip it. Brief flicker = bad UX. Use a debounced reveal.
- **Spinner stuck for > 10s**: show timeout UI ("This is taking longer than expected. Retry?").
- **Multiple concurrent spinners on a page**: coordinate so one section settles, others reveal staggered.
- **Spinner inside disabled button + button gets focus**: `aria-disabled` prevents click but allows focus. Spinner inside is purely visual.
- **Reduced motion**: per CSS above; can also replace with static "Loading" text.
- **RTL**: no impact (rotation is symmetric).

## Don't

- Don't show Spinner for sub-200ms operations. Flickers; do nothing instead.
- Don't use Spinner where progress is measurable. Use Progress.
- Don't use Spinner to fill large empty regions. Use Skeleton.
- Don't show multiple spinners in one button — confusing. One per loading control.
- Don't rotate via JS — use CSS animation.
- Don't omit reduced-motion handling.

## References

- MUI: [`CircularProgress`](../docs/reference/mui.md#circular-progress) (indeterminate variant)
- Patterns: standard SVG spinner

## Cross-reference

- [`examples/component-progress.md`](component-progress.md) — determinate progress
- [`examples/component-skeleton.md`](component-skeleton.md) — layout-aware loading
- [`examples/component-button.md`](component-button.md) — Spinner inside loading button
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — duration tiers
