# `Spin` (Spinner) — spec

> Citing Ant Design `Spin`, MUI `CircularProgress` (used as spinner), shadcn-ui (composition)

## Purpose

A simple loading indicator. **Indeterminate spinner** for "something is happening, no progress %." Different from `Progress` (percentage-based) and `Skeleton` (content-shape).

## When Spin vs Skeleton vs Progress

| Use Spin | Use Skeleton | Use Progress |
| --- | --- | --- |
| Async action with no shape (button submit, modal opening) | Page/list initial load (you know the shape) | Determinate operation (upload %, multi-step) |
| Brief (< 2s) waiting | Longer (1s+) load | Any duration with % known |

## Anatomy

```
Standalone:                     With overlay:
   ⟳                            ┌─────────────────┐
                                 │   ⟳             │
                                 │   "로딩 중..."  │
                                 │                  │
                                 └─────────────────┘
                                 (content faded behind)
```

| Slot | Required | Notes |
| --- | --- | --- |
| Spinner | yes | Rotating circular indicator |
| Tip / label | optional | "로딩 중..." text |
| Overlay | optional | Fades the wrapped content |
| Children | optional | Wrapped element (Spin can wrap content to overlay loading) |

## API

```tsx
// Standalone
<Spin size="md" />
<Spin tip="로딩 중..." />

// Wrapping content
<Spin spinning={isLoading}>
  <DataTable data={data} />
</Spin>

// Inside a button (rare — buttons have their own loading)
<Button loading><Spin size="sm" /></Button>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `spinning` | `boolean` | `true` | Whether to show |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Spinner size |
| `tip` | `string` | — | Optional label |
| `delay` | `number` | `0` | Show only after N ms (avoids flash for fast loads) |
| `children` | `ReactNode` | — | Wrapped content (gets overlay) |
| `indicator` | `ReactNode` | default circular | Custom spinner |

## Sizes

| Size | Diameter | Use |
| --- | --- | --- |
| `sm` | 16px | Inline (button, badge) |
| `md` (default) | 24px | Standard inline |
| `lg` | 40px | Page-level loading |

## Animation

Standard spinner: `360°` rotation, 1000ms loop, linear easing.

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.spinner {
  animation: spin 1000ms linear infinite;
}
```

For Material 3 style: arc length also varies (10–80%) for a "pulsing" feel. More expensive; default static-arc spinner is fine.

## States

| State | Visual |
| --- | --- |
| Spinning (active) | Animated rotation |
| Stopped (`spinning={false}`) | Hidden (or unmounted) |
| Delayed (`delay > 0`) | Hidden until delay elapses |

## Accessibility

- Wrap with `aria-busy="true"` on the loading container.
- The spinner itself: `aria-hidden="true"` (decorative).
- Provide `aria-label` on the wrapper if tip is missing: "Loading...".
- Don't announce "Loading" repeatedly via `aria-live` — single announcement at start of load.

```html
<div aria-busy="true" aria-live="polite" aria-label="데이터 로딩 중">
  <span class="spin" aria-hidden="true">⟳</span>
</div>
```

For `delay` > 0: don't show the spinner OR announce until the delay elapses. Avoids flash for fast loads.

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}
```

When motion disabled: spinner is static. Provide a text label or different non-animated indicator (dots fading, etc.). Don't leave a static rotated icon — looks broken.

## Tokens consumed

```
--color-primary-default      (default spinner color)
--color-text-secondary       (tip text)
--color-bg-overlay           (overlay when wrapping content)
--space-sm
--motion-default              (rotation period; though linear loop ignores easing)
```

## Code example

```tsx
// Inline spinner
<div>
  <Spin /> 데이터를 불러오는 중...
</div>

// Wrapping a list
<Spin spinning={isLoading} tip="저장하는 중...">
  <Form>
    {/* form content */}
  </Form>
</Spin>

// With delay (avoid flash)
<Spin spinning={isLoading} delay={200} />
{/* Spinner appears only if loading takes > 200ms */}
```

## Edge cases

- **Delay vs no delay**: for sub-200ms loads, don't show spinner at all (avoid flicker). Use `delay: 200` to gate.
- **Spin wrapping a tall scrollable**: overlay covers visible viewport; spinner centered. Don't anchor to top.
- **Multiple Spin on screen**: collapse into one spinner if they all represent the same operation.
- **Reduced motion**: spinner is static; text "로딩 중..." carries the meaning.
- **Custom indicator** (animated logo, etc.): provide via `indicator` prop. Don't violate reduced-motion preference.

## Don't

- Don't use Spin for known-shape content. Use Skeleton.
- Don't use Spin for known-percentage operation. Use Progress.
- Don't show Spin without context. Pair with text or place it where the content will land.
- Don't auto-show spinner on every interaction. Sub-200ms loads don't need spinner.
- Don't omit reduced-motion handling.

## References

- Ant Design: [`refs/ant-design/components/spin/`](../refs/ant-design/components/spin/) — `Spin`. Standard spinner with `tip`, `delay`, `wrapperClassName`.
- MUI: [`CircularProgress`](../refs/mui/packages/mui-material/src/CircularProgress/) (Material's equivalent). Same role.
- shadcn-ui: no built-in. Use Lucide's `Loader2` icon with CSS spin.

## Cross-reference

- [`examples/component-skeleton.md`](component-skeleton.md) — for known-shape loading
- [`examples/component-progress.md`](component-progress.md) — for percentage operations
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — reduced motion
