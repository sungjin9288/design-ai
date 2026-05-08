<!-- hand-written -->
---
title: SVG optimization (file size, performance, accessibility)
applies_to: [svg, illustration, performance, optimization]
---

# SVG optimization

SVGs are usually the right format for illustration. They scale, theme, and animate. But raw exports from Figma / Illustrator are bloated — 5-10× larger than they need to be, and they break theming.

This file is the production checklist for shipping a clean SVG.

## Why optimize

A typical Figma SVG export of a medium-detail spot illustration:
- **Raw**: 80kB
- **After optimization**: 8-15kB

10× reduction is normal. For 100 illustrations across a site, that's 7MB → 1MB.

Beyond size: optimized SVGs theme correctly, render faster, and are easier to inline in React.

## The bloat sources

Raw SVG exports include:
1. **Editor metadata** — Figma / Sketch / Illustrator editor tags (10-30% of file).
2. **Default styles** — `fill="#000"`, `stroke-width="1"` on every element even when it's the default.
3. **Decimal precision** — `M123.4567890123` instead of `M123.46`.
4. **Empty groups** — `<g></g>` wrappers with no purpose.
5. **Unused attributes** — `id` on every element, even when unused.
6. **Embedded fonts** — text rendered as font (not paths) carrying entire font subsets.
7. **Embedded raster** — images embedded as base64 inside the SVG.

Cleaning these is mechanical (run a tool) plus judgmental (preserve structure for theming / animation).

## SVGO — the standard tool

**SVGO** (svgo on npm) is the de-facto SVG optimizer. Run on every SVG before shipping.

```bash
npm install -g svgo
svgo input.svg -o output.svg
```

Or batch:

```bash
svgo --folder=src/illustrations --output=dist/illustrations
```

### Recommended SVGO config

```js
// svgo.config.js
module.exports = {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeViewBox: false,        // KEEP viewBox — required for responsive scaling
          cleanupIds: false,           // KEEP ids if you reference them in CSS / JS
          removeUselessDefs: false,    // KEEP defs if used by clipPath / filter / linearGradient
        },
      },
    },
    "removeXMLNS",                     // Remove if you inline; keep if standalone <img src>
    "convertStyleToAttrs",
    "removeDimensions",                // Use viewBox + CSS sizing
    {
      name: "convertPathData",
      params: { floatPrecision: 2 },
    },
    "removeMetadata",
    "removeEditorsNSData",
    "removeEmptyContainers",
    "convertColors",                   // Hex → shorter forms / named
  ],
};
```

`removeViewBox: false` is critical. Without viewBox, SVG can't scale responsively.

`cleanupIds: false` if you have any `<use>`, `clipPath`, or CSS targeting by id.

## Theming with currentColor

To make SVGs theme-aware, use `currentColor`:

```svg
<!-- Bad: hardcoded brand color -->
<svg viewBox="0 0 24 24"><path d="..." fill="#0064FF"/></svg>

<!-- Good: themeable -->
<svg viewBox="0 0 24 24"><path d="..." fill="currentColor"/></svg>
```

```css
.icon { color: var(--color-brand-default); }
```

Now the SVG inherits color from CSS. Dark mode? Just change the variable.

For multi-color illustrations, use CSS variables in the SVG (requires inline SVG or CSS-aware loader):

```svg
<svg viewBox="0 0 240 240">
  <circle cx="120" cy="120" r="100" fill="var(--color-bg-illo, #E0F2FF)" />
  <path d="..." fill="var(--color-brand-default, #0064FF)" />
</svg>
```

The fallback after the comma is the static value — used if CSS variables aren't applied.

## Inline vs `<img src>` vs `<object>`

| Method | When | Pros | Cons |
| --- | --- | --- | --- |
| **Inline `<svg>`** in HTML / JSX | Theming, animation, SVG you control | Full theming, full animation | Bigger HTML, no caching of SVG itself |
| **`<img src="...svg">`** | Decorative, no theming needed | Cacheable, simple | No CSS targeting from outside |
| **`<object>` / `<iframe>`** | Rare | SVG can have its own CSS | Layout edge cases |
| **CSS `background-image: url(...svg)`** | Decorative backgrounds | Cacheable | No theming, no animation |

Default: **inline** for icons / themed illustrations; **`<img>`** for static illustrations.

For React, popular pattern is inline-as-component:

```tsx
// SearchEmpty.tsx
export function SearchEmptyIllustration({ className, ...props }: SVGProps) {
  return (
    <svg viewBox="0 0 240 240" className={className} {...props}>
      <path d="..." fill="currentColor" />
    </svg>
  );
}
```

Build tool (vite-svg-loader, SVGR, esbuild-plugin-svgr) auto-converts SVG files to React components.

## Avoiding common pitfalls

### 1. Don't lose theming during optimization

SVGO can replace `currentColor` with the value if it's not careful. Whitelist `currentColor`:

```js
// In svgo config
{
  name: "convertColors",
  params: { currentColor: false },  // Don't replace currentColor
}
```

### 2. Don't strip ids you reference

If your CSS or JS targets `#illo-bg` inside SVG, `cleanupIds: false` and explicit preservation needed.

### 3. Don't strip viewBox

Without viewBox, SVG renders at intrinsic size and won't respond to `width` / `height` CSS.

### 4. Don't inline raster

Some Figma exports embed PNGs as base64 inside SVG. This defeats the point — you have an SVG wrapper around a PNG. Identify with:

```bash
grep "data:image" myfile.svg
```

If found: re-export with the raster as a separate file, OR redraw the part as vector.

### 5. Don't keep editor metadata

```bash
# Check size before / after
ls -la myfile.svg          # 80kB
svgo myfile.svg
ls -la myfile.svg          # 8kB
```

If your "after" is still 30kB+, something didn't strip — open and check.

## Accessibility

### Decorative SVG

```html
<svg aria-hidden="true" focusable="false">...</svg>
```

`aria-hidden` removes from a11y tree. `focusable="false"` prevents keyboard focus on the SVG element (important for IE/legacy; defensive in modern browsers).

### Meaningful SVG (conveys information)

```html
<svg role="img" aria-label="결제 완료">
  <title>결제 완료</title>
  ...
</svg>
```

`role="img"` + `aria-label` is the cleanest. `<title>` element inside SVG is also read by some screen readers — defense in depth.

### Interactive SVG (button, link)

```html
<svg role="button" aria-label="닫기" tabindex="0" onclick="..." onkeydown="...">
  ...
</svg>
```

Better: wrap the SVG in a real `<button>` and let the SVG be decorative. Avoids handling keyboard manually.

## Performance

| Metric | Target |
| --- | --- |
| Inline SVG (icon-sized, < 32px) | < 1kB |
| Inline SVG (spot illustration, 100-200px) | < 10kB |
| Hero SVG | < 100kB; ideal < 50kB |
| Path count per SVG | < 200 (above this, consider raster) |
| Distinct gradients | < 5 (browsers de-dupe; > 10 hurts paint) |
| Filters (blur, drop-shadow) | Use sparingly; expensive |

For SVG with > 500 paths (very detailed): seriously consider a WebP / AVIF instead. Browsers paint thousands of paths slowly on mobile.

## Animation in SVG

SVG can animate via:

| Method | Use |
| --- | --- |
| **CSS animation on SVG elements** | Hover effects, simple loops |
| **SMIL** (`<animate>`, `<animateTransform>`) | Legacy; deprecated in some browsers; avoid for new |
| **JavaScript (GSAP, Framer Motion)** | Complex animation, scroll-triggered |
| **Lottie** | Designer-led; bypasses SVG animation entirely |

For most cases: CSS animation on inline SVG is the best balance. SMIL is dead. Lottie when designer makes it in After Effects.

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner svg {
  animation: spin 1s linear infinite;
}
```

`prefers-reduced-motion` rules apply — pause / freeze on reduce.

## Sprite vs separate files

| Approach | Use |
| --- | --- |
| **One SVG sprite** (one file, many `<symbol>` IDs, referenced via `<use>`) | Many icons, want HTTP single-fetch |
| **Separate SVG files** | Treeshaking with build tools, modern HTTP/2/3 |
| **React component per SVG** (most common modern) | React apps, full type-safety, easy theming |

With HTTP/2/3 multiplexing, separate files are usually fine. Sprites add build complexity. For most projects: separate files / per-component is simpler.

## Workflow checklist

For each new illustration:

- [ ] Created at canvas size matching display (don't scale up small canvas)
- [ ] Strokes converted to fills (or kept as strokes — pick one and stay consistent)
- [ ] Text either converted to paths OR uses Pretendard / system fonts (safe for cross-platform)
- [ ] Brand colors replaced with `currentColor` or CSS variables
- [ ] Run through SVGO with config above
- [ ] viewBox preserved
- [ ] No embedded raster (`grep "data:image"`)
- [ ] No editor metadata (`grep -E "sodipodi|inkscape|sketch:"`)
- [ ] File size < target for category (1kB icon, 10kB spot, 50kB hero)
- [ ] Accessibility: `aria-hidden` for decorative, `role="img"` + `aria-label` for meaningful
- [ ] Tested in light + dark modes
- [ ] Tested at 1×, 2×, 3× device pixel ratio (cribs / blur check)

## Tools

| Tool | Use |
| --- | --- |
| **SVGO** | CLI optimizer; mandatory |
| **SVGOMG** (svgomg.net) | Web UI for SVGO; preview before/after |
| **vite-plugin-svgr / SVGR** | SVG → React component build |
| **Figma → "Copy as SVG"** | Fast extraction; still needs SVGO |
| **Adobe Illustrator → "Save for Web"** | Slightly cleaner output than Figma |
| **PurgeCSS / unused style sweep** | After build, ensure unused SVG IDs / classes purged |

## Don't

- Don't ship raw Figma exports — always SVGO.
- Don't keep `width` / `height` attributes on the `<svg>` if you want it responsive — use viewBox + CSS sizing.
- Don't embed raster inside SVG. Defeats the format.
- Don't bake brand color as raw hex — use `currentColor` or CSS variables.
- Don't make 100 separate SVG components when an inline icon font / sprite would do (icons specifically).
- Don't ignore reduced-motion when SVG animates.

## Cross-reference

- [`knowledge/illustration/illustration-systems.md`](illustration-systems.md) — system foundation
- [`knowledge/illustration/spot-illustrations.md`](spot-illustrations.md) — production rules
- [`knowledge/illustration/hero-illustrations.md`](hero-illustrations.md) — performance targets
- [`knowledge/icons/curated-sets.md`](../icons/curated-sets.md) — icon system
- [`knowledge/motion/motion-tools.md`](../motion/motion-tools.md) — Lottie alternative
