<!-- hand-written -->
---
title: Spot illustrations (empty / success / error / onboarding)
applies_to: [illustration, empty-state, error-state, onboarding]
---

# Spot illustrations

Spot illustrations are **purposeful, small** illustrations that appear at moments where the UI needs emotional clarity. Empty states, success confirmations, error pages, onboarding screens, paywall moments.

This is the most common illustration use case. Get it right and the system works; get it wrong and every screen feels different.

## What "spot" means

- 80–240px square (display size).
- One subject, one idea.
- Conveys a single emotion or state.
- Decorative or supplementary — never the only conveyance of meaning.

Bigger than an icon (24–48px), smaller than a hero (400px+).

## Five canonical spot moments

### 1. Empty state — "no data yet"

| Sub-context | Illustration suggestion |
| --- | --- |
| First-run empty (user has no data ever) | Encouraging, action-prompting (open box, blank canvas, sprout) |
| Filtered empty (user filtered to nothing) | Magnifying glass, "no match" character |
| Search empty (query returned nothing) | Same as filtered |
| Failure empty (data load failed) | Use error state, not empty |

**Voice**: encouraging, not pitying. "탐색 시작하기" not "데이터가 없습니다".

Cite [`examples/component-empty-state.md`](../../examples/component-empty-state.md).

### 2. Success state

| Sub-context | Illustration suggestion |
| --- | --- |
| Payment success | Checkmark + confetti / receipt motif (use motion sparingly) |
| Submission success | Letter sent, paper plane |
| Account created | Welcome, sprout, key |
| Goal completed | Trophy, milestone marker |

**Voice**: warm, not over-the-top. Don't celebrate routine actions ("Logged in!" doesn't need a fireworks illustration).

For Korean fintech 결제 완료: gentle checkmark + brand color, no confetti.

### 3. Error state

| Sub-context | Illustration suggestion |
| --- | --- |
| 404 not found | Lost character, broken link, signpost |
| 500 server error | Tools / wrench / "we're fixing it" |
| Permission denied | Locked door, "no entry" |
| Rate limited / quota | Hourglass, "slow down" |
| Generic failure | Cloud with X, simple sad-face symbol |

**Voice**: humble, helpful. Take responsibility. "잠시 후 다시 시도해 주세요" is better than "Something went wrong."

Avoid:
- Cartoon mascots crying (childish).
- Skull / death / ominous imagery (alarming).
- Robots / 1990s clip-art (dated).

### 4. Onboarding step

| Sub-context | Illustration suggestion |
| --- | --- |
| Welcome | Wave / handshake / sunrise |
| Setup step 1 | Door opening, key, blank canvas |
| Permission request | Specific to permission (camera = lens, location = pin, notification = bell) |
| Final / "you're ready" | Rocket, ribbon, completed checklist |

**Voice**: encouraging, low-friction. Each illustration unique to its step (no repetition of one mascot pose).

### 5. Permissions / privacy explainer

| Sub-context | Illustration suggestion |
| --- | --- |
| Notification permission | Bell with notification dot |
| Location permission | Pin on map |
| Camera / mic | Lens / microphone outline |
| Contacts | People silhouettes |
| Biometric (Face ID, fingerprint) | Face outline / fingerprint |

**Voice**: trust-building. Show what's being asked for visually so the user understands.

## Composition rules

### Single subject

One main element. Not five things in one illustration.

```
✓ Empty state: one open box.
✗ Empty state: open box, sad face, magnifier, "no data" text in illustration, arrows pointing.
```

### Use white space (or background)

Spot illustrations breathe. Don't fill the bounding box edge-to-edge — leave 10-20% padding inside the canvas.

### Centered or off-center consistently

Pick a rule: all spot illustrations centered, OR all left-anchored, OR all bottom-anchored. Mixing positions across the system reads as inconsistent.

### Color anchoring

One **dominant** color (usually `--color-brand-default` or `--color-brand-light`).
One **secondary** color (usually `--color-fg-muted` or `--color-bg-secondary`).
That's it. No additional colors.

Exception: skin tones in character illustrations require a third token (see [`mascot-design.md`](mascot-design.md)).

### Stroke vs fill

Match the system's chosen style — see [`illustration-systems.md`](illustration-systems.md) "Defining your style".

## Sizing rules

| Context | Size |
| --- | --- |
| Mobile empty state | 120–160px |
| Desktop empty state | 160–240px |
| Inline (within a card / tile) | 80–120px |
| Onboarding screen (modal) | 200–280px |
| Onboarding screen (full-bleed) | 240–320px |
| Toast / inline notification | None — use icon, not illustration |

Don't go larger than 320px for spot illustrations. That's hero territory.

## Layout patterns

### Empty state layout

```
        [illustration  120-200px]
              ↑ centered
        [Headline — 18-22px, semibold]
        [Description — 14-16px, regular, max 2 lines]
              ↓ optional
              [Primary CTA]
              [Secondary link]
```

Total vertical: ~280-360px. Centered in available space.

### Error state layout (full-page 404)

```
        [Illustration 200-280px]
        
        404
        [Headline]
        [Description with link back]
        [Search OR Home CTA]
```

### Onboarding step layout

```
        [Illustration 240-320px]
        [Headline]
        [Description]
        ────
        [Step indicator 1/3]
        [Skip] [Next →]
```

## Production checklist

For each spot illustration:

- [ ] Renders correctly at 1×, 2×, 3× (test on retina + non-retina)
- [ ] Has a light AND dark mode variant (or uses theme tokens)
- [ ] Optimized SVG (no inline styles, no metadata, see [`svg-optimization.md`](svg-optimization.md))
- [ ] Accessible: `<img alt="">` if decorative, `<img alt="...">` if conveying state
- [ ] File size < 30kB SVG (most should be < 10kB)
- [ ] Named per convention: `illo-{state}-{specific}.svg` (e.g., `illo-empty-search.svg`)
- [ ] Exported at native size + 2x bitmap fallback for non-SVG contexts (email, etc.)

## Accessibility

Spot illustrations are usually decorative — the surrounding text already conveys meaning. In that case:

```html
<img src="empty-search.svg" alt="" aria-hidden="true" />
<h2>찾으시는 결과가 없어요</h2>
```

Don't add redundant alt text ("a person looking through a magnifying glass at empty space"). The text already says what's happening.

If the illustration **is** the only conveyance (e.g., a status badge), then alt text is required:

```html
<img src="payment-success.svg" alt="결제가 완료되었습니다" />
```

For animated illustrations (Lottie / SVG SMIL): respect `prefers-reduced-motion` — show the static frame. See [`motion/motion-tools.md`](../motion/motion-tools.md).

## Theming

SVG illustrations should theme via `currentColor` and CSS variables:

```svg
<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
  <circle cx="120" cy="120" r="100" fill="var(--color-brand-light, #E0F2FF)" />
  <path d="..." stroke="currentColor" stroke-width="2" fill="none" />
</svg>
```

```css
.empty-state-illustration {
  color: var(--color-brand-default);
}

@media (prefers-color-scheme: dark) {
  /* CSS variable cascade handles it; no per-illustration override needed */
}
```

Avoid baking brand color into the SVG as a literal hex. The whole point of a system is one source of truth.

## Don't

- Don't use one mascot for all 50 spot illustrations — boring, repetitive.
- Don't use 5 different mascots — fragmenting.
- Don't make empty-state illustrations bigger than the headline. The headline is the message.
- Don't draw something that contradicts the message ("error" with a happy character).
- Don't over-celebrate routine success ("You added 1 item to cart!" with confetti = annoying).
- Don't hardcode brand color in the SVG file. Use `currentColor` or CSS variables.
- Don't ship the same illustration for "no data" and "no search results" — different moments need different cues.

## Cross-reference

- [`knowledge/illustration/illustration-systems.md`](illustration-systems.md) — system foundation
- [`knowledge/illustration/hero-illustrations.md`](hero-illustrations.md) — large brand-led
- [`knowledge/illustration/mascot-design.md`](mascot-design.md) — when characters are central
- [`knowledge/illustration/svg-optimization.md`](svg-optimization.md) — file optimization
- [`examples/component-empty-state.md`](../../examples/component-empty-state.md) — empty state component
- [`knowledge/motion/motion-tools.md`](../motion/motion-tools.md) — Lottie for animated spots
