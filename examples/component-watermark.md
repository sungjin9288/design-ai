# `Watermark` — spec

> Citing Ant Design `Watermark`, MUI (no built-in), shadcn-ui (no built-in)

## Purpose

Adds a repeating watermark overlay (text or image) on top of content. Used for: confidential documents, leaked-photo deterrents in admin/fintech apps, screenshot tracing, "DRAFT" labels.

## When Watermark vs alternatives

| Pattern | Use |
| --- | --- |
| **Watermark** | Repeating subtle pattern across the surface |
| **Banner** | One-time announcement at top |
| **Toast** | Transient feedback |
| **Status badge** | Attached to specific elements |

Watermarks are subtle by design — the user notices in screenshots, not while using the app.

## Anatomy

```
[Page content]
       •︵•          •︵•
   [confidential]    [confidential]
       •︵•          •︵•
   [confidential]    [confidential]
       (rotated, semi-transparent)
```

Watermark is a **layer** over the content, not a component within it.

## API

```tsx
<Watermark content="confidential">
  <SensitiveDataPage />
</Watermark>

<Watermark
  content={["민지", "2026.05.07"]}    // multi-line
  rotate={-30}
  opacity={0.06}
  spacing={[200, 100]}
>
  {children}
</Watermark>

<Watermark image="/logo-watermark.svg" imageSize={120}>
  {children}
</Watermark>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string \| string[]` | — | Text watermark (single or multi-line) |
| `image` | `string` | — | Image watermark (SVG or PNG) |
| `imageSize` | `number` | — | Image dimension |
| `rotate` | `number` | `-22` | Degrees |
| `opacity` | `number` | `0.06` | 0–1 |
| `color` | `string` | `--color-text-tertiary` | Text color |
| `fontSize` | `number` | `14` | |
| `spacing` | `[number, number]` | `[100, 100]` | Horizontal × vertical gap between marks |
| `zIndex` | `number` | `1` | Above content but below modals |
| `children` | `ReactNode` | — | Wrapped content |

## Implementation strategy

Two approaches:

### CSS pattern (lightweight)

Repeating background image generated as an SVG / canvas and tiled via CSS:

```css
.watermark {
  position: relative;
}
.watermark::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG with text */
  background-size: 200px 100px;
  pointer-events: none;
  opacity: 0.06;
  z-index: 1;
}
```

Generate the SVG once with the watermark text + rotation. Embed as data URI for self-contained.

### Canvas overlay (more flexible)

Render watermark on a canvas overlay:

```js
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");
ctx.globalAlpha = 0.06;
ctx.font = "14px sans-serif";
ctx.fillStyle = "currentColor";

// Draw repeating rotated text
for (let x = 0; x < canvas.width; x += 200) {
  for (let y = 0; y < canvas.height; y += 100) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-22 * Math.PI / 180);
    ctx.fillText("confidential", 0, 0);
    ctx.restore();
  }
}
```

Both work. CSS is simpler; canvas is more flexible (can include user-specific watermarks like usernames).

## Common use cases

### 1. Confidential admin pages

```tsx
<Watermark content="confidential" rotate={-22}>
  <AdminPage />
</Watermark>
```

The screenshot taker leaves traces.

### 2. Per-user tracing (Korean fintech sensitive screens)

```tsx
<Watermark content={[user.name, user.email, today]}>
  <SensitiveAccountInfo />
</Watermark>
```

If a screenshot leaks, the source user is visible.

### 3. "DRAFT" / "PREVIEW" / "SAMPLE"

```tsx
<Watermark content="DRAFT" rotate={-30} opacity={0.08} fontSize={32}>
  <DocumentPreview />
</Watermark>
```

Strong indicator that content isn't final.

### 4. Brand watermark on shared content

```tsx
<Watermark image="/brand.svg" imageSize={200} opacity={0.1}>
  <ShareableContent />
</Watermark>
```

Marketing content that gets exported / screenshotted.

## States

Watermark doesn't have states. It's purely decorative-with-a-purpose.

## Tokens consumed

```
--color-text-tertiary       (default text color)
--color-text-secondary      (alternative for higher visibility)
--space-md
--font-size-sm
```

Opacity is the primary design lever — `0.04–0.10` is the sweet spot. Higher distracts; lower invisible.

## Accessibility

- Watermarks are **decorative** — `aria-hidden="true"` on the watermark layer.
- Text content within the watermark is not announced.
- Watermark must NOT obscure interactive elements (`pointer-events: none` on the layer).
- For screen readers: watermark is invisible (it's purely a screenshot deterrent).

## Performance

- For repeated watermarks: render once and tile via CSS (don't render each instance as a DOM element).
- For canvas: re-render on resize, throttled.
- For per-user watermarks: generate the SVG/canvas once on mount; cache.

## Don't

- Don't make watermarks dark / high-contrast — defeats the "subtle" purpose.
- Don't watermark content the user expects to download cleanly (their own data exports).
- Don't watermark print pages with text that won't print legibly.
- Don't put watermarks **above** modals / overlays — `z-index: 1` is right; modals are z-index 1000+.
- Don't use watermarks for legal compliance alone — they deter, don't prevent. Leaks still happen.
- Don't omit `pointer-events: none` — clicks through must work.

## Korean fintech context

For sensitive financial screens:
- Account balance details
- Transaction history (when shown to support / admin)
- Customer data in CRM tools
- Internal admin views

Watermark with the **viewer's name + date** discourages internal screenshot-leaks. KakaoBank, Toss, and major Korean banks use this pattern.

## References

- Ant Design: [`refs/ant-design/components/watermark/`](../refs/ant-design/components/watermark/) — `Watermark`. Modern Ant addition with comprehensive options.
- MUI / shadcn-ui: no built-in. Compose with CSS or canvas.

## Cross-reference

- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) — watermark text color considerations
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — Korean fintech screenshot-deterrent conventions
