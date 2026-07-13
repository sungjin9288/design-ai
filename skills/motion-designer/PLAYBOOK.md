# motion-designer — playbook

Design and spec motion for a screen, component, or page. Output is a **motion spec**: a markdown document a developer can implement against without follow-ups, with the right tool chosen, durations and easings derived from tokens, and reduced-motion handled.

## When to use

- "Design the entrance for our landing page hero."
- "Spec the loading sequence for our app cold launch."
- "We want the success state to feel celebratory — design it."
- "Add motion to the modal open/close."
- "Pick a tool: should we use Framer Motion or GSAP?"

## Inputs (ask if missing)

1. **Surface** — landing page / app screen / component / route transition.
2. **Intent** — what motion should accomplish (stop scroll, confirm action, smooth navigation, brand moment).
3. **Trigger** — page load / scroll / tap / state change / hover.
4. **Audience + platform** — web / mobile web / native / hybrid; Korean / global.
5. **Performance budget** — bundle target, target devices.
6. **Existing motion language** — does the brand have one (rubber-band? snappy? gentle?). If not, this skill helps define it.
7. **Reference or component library** — optional React Bits, Motion, GSAP examples, brand sites, or local component primitives.

## Steps

### 1. Classify the moment

Pick the category. The category determines the rules:

| Category | Goal | Reference |
| --- | --- | --- |
| Micro-interaction | Confirm input within 100ms | [`knowledge/motion/micro-interactions.md`](../../knowledge/motion/micro-interactions.md) |
| Marketing motion | Stop scroll / reveal value / anchor brand | [`knowledge/motion/marketing-motion.md`](../../knowledge/motion/marketing-motion.md) |
| App loading | Hide load latency; feel intentional | [`knowledge/motion/app-loading-sequences.md`](../../knowledge/motion/app-loading-sequences.md) |
| Choreography | Coordinate multi-element reveal | [`knowledge/motion/choreography-depth.md`](../../knowledge/motion/choreography-depth.md) |
| State transition | Show change in product UI | [`knowledge/motion/principles.md`](../../knowledge/motion/principles.md) |

Get this wrong and the rules don't apply. A marketing reveal is NOT a micro-interaction; a button press is NOT a choreographed sequence.

Before assigning motion, map the trigger frequency using [`knowledge/patterns/interface-craft.md`](../../knowledge/patterns/interface-craft.md). Continuous or keyboard-driven expert actions keep state feedback but should not wait for decorative choreography. Occasional and rare moments may use a larger motion budget when the purpose is explicit.

### 2. Pick duration tier

From [`knowledge/motion/principles.md`](../../knowledge/motion/principles.md):

| Tier | Range | Use |
| --- | --- | --- |
| Instant | 0–80ms | Immediate pressed or selected feedback; not a transition tier |
| Fast | 100–150ms | Hover, focus, press, and simple component state changes |
| Default | 200–300ms | Modal, drawer, tooltip, accordion, and in-app page transition |
| Slow | 400–600ms | Rare hero, onboarding, or celebratory storytelling moments |
| Above slow | > 600ms | Not product-UI motion; justify against a separate marketing/video timeline or cut |

State the chosen tier explicitly. Map to token: `--motion-fast`, `--motion-medium`, etc.

### 3. Pick easing

| Easing | Curve | Use |
| --- | --- | --- |
| `ease-out` | Decelerate to stop | Default for entrances ("arrive and settle") |
| `ease-in` | Accelerate from rest | Exits ("leave the screen") |
| `ease-in-out` | Both | Position-to-position movement |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot | Confirm / playful (rubber-band) |
| `linear` | Constant | Loading bars, infinite spinners |

Map to token: `--ease-out`, `--ease-in`, etc. Don't ship raw cubic-beziers in components — promote them to tokens first.

### 4. Pick tool

Use [`knowledge/motion/motion-tools.md`](../../knowledge/motion/motion-tools.md) decision tree.

Bias rules:
- **CSS first**. Hover / press / focus / simple entrances. ~80% of motion needs this and only this.
- **Framer Motion** for React-side state-driven animation (modals, route transitions, layout animations).
- **GSAP** for marketing timelines / scroll-triggered choreography longer than 600ms.
- **Lottie** when designer brings After Effects animation.
- **Rive** when motion needs state machines and interactivity.
- **react-spring** only when you need physics (drag, swipe).

Don't load 4 motion libraries. Pick 1–2 max. Justify each.

### 4.5. Gate animated component adoption

If the user references an animated component catalog such as React Bits, decide whether to adapt the pattern, install a dependency, or reject it. Use [`knowledge/patterns/agentic-design-workflows.md`](../../knowledge/patterns/agentic-design-workflows.md).

| Check | Required output |
| --- | --- |
| Intent | Which product goal the motion supports: orientation, feedback, hierarchy, delight, or brand moment. |
| Category | Text animation, background, component, cursor/gesture, loading, or decorative layer. |
| Dependency | Required package(s), CSS-only alternative, and bundle risk. |
| Variant | JS/TS and CSS/Tailwind target, or local equivalent. |
| Customization | Props/tokens the team can tune safely. |
| Accessibility | Reduced-motion fallback, loop pause/stop behavior, keyboard/focus impact, contrast. |
| Ownership | License, attribution, local copy strategy, and maintenance responsibility. |

Default to re-expressing the idea in the product's token and motion system. Do not add a library for one hover, press, or focus state.

### 5. Spec the motion

For each motion event, write:

```
Trigger: <what causes this>
Duration: <ms>, tier <tier>, token <var>
Easing: <name>, token <var>
Properties: <named properties and performance rationale>
Initial: <starting value>
Final: <end value>
Stagger (if multiple): <ms between siblings>
```

Prefer `opacity` and `transform` for movement. `color`, `background-color`, and small-area `box-shadow` transitions are valid state feedback when paint cost is measured; use `filter` sparingly. Do not animate `width`, `height`, `top`, or `left` per frame when a transform can express the same result.

### 6. Choreograph (if multi-element)

For sequences with > 1 element, use stagger formula from [`knowledge/motion/choreography-depth.md`](../../knowledge/motion/choreography-depth.md):

```
total budget = parent duration + (children − 1) × stagger
```

Cap stagger at 80ms. Keep coordinated product-UI reveals within the local 400ms choreography budget and in-app transitions within 300ms. Longer marketing or video timelines are a different artifact and must not delay product operation.

Provide a timing diagram:

```
0ms ┃■■■■■                          ┃ headline (200ms fade)
50ms┃   ■■■■■                       ┃ sub (200ms fade)
100ms┃     ■■■■■■                   ┃ CTA (250ms fade-up)
200ms┃           ■■■■■■■■           ┃ visual (300ms scale-in)
```

### 7. Reduced motion

Always specify behavior when `prefers-reduced-motion: reduce`:

| Original | Reduced fallback |
| --- | --- |
| Fade + translate | Pure fade |
| Slide-in | Pure fade or instant |
| Scale-in | Pure fade |
| Parallax | Disable |
| Auto-loop | Pause; show static frame |
| Hero / shared element | Instant layout swap |

Reduced motion ≠ no motion. Opacity-only is usually OK; large translations / scales are not.

### 8. Performance check

For every motion spec, verify:

- [ ] Movement prefers `opacity` / `transform`; any color, shadow, or filter transition has a bounded paint cost
- [ ] Total page-level animation count under 10 simultaneously
- [ ] If above-the-fold: doesn't block LCP
- [ ] If using JS lib: bundle cost stated and justified
- [ ] If looping: pauses when offscreen / tab hidden
- [ ] If `filter: blur()`: only on small areas, not large lists
- [ ] No `setInterval` driving animation (use `requestAnimationFrame` or CSS / library)
- [ ] Rapidly repeated state changes can retarget from the current visual state
- [ ] Anchored overlays use a trigger-aware origin; centered modals remain centered
- [ ] Hover-only movement/elevation is gated to hover-capable fine pointers

### 9. Korean product check (if relevant)

Read [`knowledge/i18n/korean-product-conventions.md`](../../knowledge/i18n/korean-product-conventions.md) and test the actual product audience. Do not infer a Korean-market motion preference from one well-known brand.

- Keep Korean control labels, status text, and reduced-motion settings understandable without relying on animation.
- Test long Hangul labels during animated layout changes at mobile widths.
- Treat mascot motion and auto-play media as product-specific brand decisions with reduced-motion, bandwidth, and battery fallbacks.
- Use references as comparative evidence, not as a universal Korean B2C default.

### 10. Output

Use this structure:

```markdown
# Motion spec: <surface name>

> Surface: <landing page hero | settings drawer | etc>
> Intent: <one sentence>
> Trigger: <what fires it>
> Tool: <CSS | Framer Motion | GSAP | Lottie | Rive | react-spring>

## Tokens used
<list>

## Reference / adoption decision
<if applicable: adapt / install / reject, with gate results>

## Sequence
<step-by-step with durations, easings, properties>

## Timing diagram
<gantt-style ASCII>

## Reduced motion
<fallback per element>

## Performance budget
<bundle delta, animation count, LCP impact>

## Code stub
<minimal CSS / React snippet>

## Don't
<2-3 specific misuses>
```

## Source files this skill reads

- [`knowledge/motion/principles.md`](../../knowledge/motion/principles.md) — durations / easings / fundamentals
- [`knowledge/motion/micro-interactions.md`](../../knowledge/motion/micro-interactions.md) — < 200ms moments
- [`knowledge/motion/marketing-motion.md`](../../knowledge/motion/marketing-motion.md) — landing / hero / scroll
- [`knowledge/motion/app-loading-sequences.md`](../../knowledge/motion/app-loading-sequences.md) — splash / route / progressive
- [`knowledge/motion/choreography-depth.md`](../../knowledge/motion/choreography-depth.md) — multi-element coordination
- [`knowledge/motion/motion-tools.md`](../../knowledge/motion/motion-tools.md) — tool decision tree
- [`knowledge/patterns/agentic-design-workflows.md`](../../knowledge/patterns/agentic-design-workflows.md) — animated component adoption gate
- [`knowledge/patterns/interface-craft.md`](../../knowledge/patterns/interface-craft.md) — frequency, response, origin, and interruptibility review
- [`knowledge/i18n/korean-product-conventions.md`](../../knowledge/i18n/korean-product-conventions.md) — Korean product behavior and localization constraints
- [`examples/component-loading-sequence.md`](../../examples/component-loading-sequence.md) — reference spec
- [`examples/component-page-transition.md`](../../examples/component-page-transition.md) — reference spec
- [`examples/component-lottie-player.md`](../../examples/component-lottie-player.md) — Lottie integration
- [`examples/component-scroll-reveal.md`](../../examples/component-scroll-reveal.md) — scroll-triggered

## Verification phase (run before declaring done)

- [ ] Was the moment classified into one of the 5 categories?
- [ ] Is the duration tier explicit (not just "200ms" — "fast tier")?
- [ ] Is the easing named AND mapped to a token?
- [ ] Is the tool choice justified ("CSS because it's a < 100ms hover" — not just "Framer Motion")?
- [ ] Are only `opacity` / `transform` / `filter` animated?
- [ ] If multi-element: is stagger ≤ 80ms and total ≤ 800ms (entrance) / 300ms (in-app)?
- [ ] If using an animated component library: did the adoption gate pass and state dependency/ownership?
- [ ] Is `prefers-reduced-motion` behavior specified for every element?
- [ ] Is bundle cost stated if a library is used?
- [ ] Does the "Don't" section catch 2–3 specific misuses?
- [ ] If Korean B2C: is the restraint check applied?
- [ ] Is the trigger frequency stated, and can repeated or gesture-driven motion be interrupted safely?

## Done when

- One markdown spec, < 400 lines.
- Surface, intent, trigger, tool stated up top.
- Tokens listed (no raw values in body — reference tokens).
- Sequence with durations + easings + properties.
- Timing diagram (if multi-element).
- Reduced-motion fallback for every element.
- Performance budget stated.
- Code stub developer can paste in.
- "Don't" section.
- Verification phase passes.
