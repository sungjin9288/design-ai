<!-- hand-written -->
# `LottiePlayer` (custom — designer-led After Effects animation in product UI) — spec

> Renders a Lottie JSON animation with sane defaults: lazy-load, pause when offscreen, respect reduced motion, fall back to a poster image. Pairs with [`knowledge/motion/motion-tools.md`](../knowledge/motion/motion-tools.md) and [`knowledge/motion/marketing-motion.md`](../knowledge/motion/marketing-motion.md).

## Purpose

Designers create motion in After Effects → export with Bodymovin → engineer drops the JSON in via `LottiePlayer`. This component handles the **lifecycle** concerns engineers usually forget:

1. Lazy-load the JSON (don't ship a 200kB animation in the main bundle).
2. Pause when offscreen (battery + perf).
3. Provide a poster image for `prefers-reduced-motion`, slow connections, and SSR.
4. Standardize play / loop / once-only semantics across the app.

Without this: each Lottie usage hand-rolls these concerns, and at least one will skip them.

## Anatomy

```
┌──────────────────────────────────┐
│                                  │
│      [Lottie animation]          │  ← canvas / SVG render
│                                  │
└──────────────────────────────────┘
        ↓ if reduced-motion or no JS
┌──────────────────────────────────┐
│                                  │
│      [Poster image — last frame] │  ← static fallback
│                                  │
└──────────────────────────────────┘
```

## API

```tsx
<LottiePlayer
  src="/animations/checkmark-success.json"
  poster="/animations/checkmark-success.png"
  mode="once"
  onComplete={() => navigate("/done")}
  width={240}
  height={240}
  ariaLabel="결제 완료"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string \| object` | — | URL to JSON or imported JSON object |
| `poster` | `string` | — | Poster image URL for fallback (REQUIRED for animations >50kB or above-fold) |
| `mode` | `"once" \| "loop" \| "controlled"` | `"once"` | Play behavior |
| `autoplay` | `boolean` | `true` (loop & once); `false` (controlled) | Start playing on mount |
| `playing` | `boolean` | — | Controlled play state (when `mode="controlled"`) |
| `speed` | `number` | `1` | Playback speed multiplier |
| `direction` | `1 \| -1` | `1` | Forward or reverse |
| `loop` | `boolean \| number` | derived from mode | Override loop count |
| `pauseOffscreen` | `boolean` | `true` | Auto-pause when not in viewport |
| `width` | `number \| string` | — | Render dimensions |
| `height` | `number \| string` | — | Render dimensions |
| `ariaLabel` | `string` | — | REQUIRED — describes what the animation conveys |
| `onComplete` | `() => void` | — | Fires after `mode="once"` completes |
| `onLoop` | `() => void` | — | Fires each loop iteration |
| `renderer` | `"svg" \| "canvas"` | `"svg"` | SVG = sharper; canvas = better perf for complex |
| `disabled` | `boolean` | auto via `prefers-reduced-motion` | Show poster instead |

## Modes

### `once`

Plays through, fires `onComplete`, holds last frame. Used for success states, error states, milestones.

```tsx
<LottiePlayer src={successAnim} poster={successPng} mode="once" onComplete={dismiss} />
```

### `loop`

Plays continuously. Used for ambient brand moments, loading indicators with character.

```tsx
<LottiePlayer src={loadingAnim} poster={loadingPng} mode="loop" pauseOffscreen />
```

### `controlled`

Parent controls play / pause via `playing` prop. Used for scroll-triggered, hover-triggered, gesture-triggered.

```tsx
const [hovered, setHovered] = useState(false);
<div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
  <LottiePlayer src={iconAnim} mode="controlled" playing={hovered} />
</div>
```

## States

| State | Visual | Why |
| --- | --- | --- |
| Loading JSON | Poster image | First paint while ~50–150kB JSON streams in |
| Playing | Animation rendering | Normal |
| Paused (offscreen) | Last rendered frame held | Saves CPU + battery |
| Paused (controlled false) | Last rendered frame held | Parent decided |
| Reduced motion | Poster image, never animates | a11y |
| Error (JSON failed to load) | Poster image | Graceful degradation |
| No JS / SSR | Poster image | `<noscript>` |

## Tokens consumed

```
--motion-fast               (poster → animation cross-fade once JSON loads)
--ease-out
```

LottiePlayer is mostly a wrapper around an external JSON; it does not consume color / typography tokens directly. The animation itself was authored in After Effects with brand colors baked in.

## Korean fintech use cases

| Scenario | Animation type | Mode |
| --- | --- | --- |
| 송금 완료 (transfer success) | Money flying / checkmark | `once` |
| 결제 실패 (payment failed) | Error pulse / X mark | `once` |
| 가입 환영 (signup welcome) | Brand mascot wave | `once` |
| 로딩 (loading with character) | Mascot bouncing | `loop` (paused after 5s if still loading) |
| 잔액 변화 (balance change) | Number counter | `controlled` (triggered by data update) |

For all of the above: provide a poster image showing the **end state** (checkmark, X, mascot final pose) so reduced-motion users still get the meaning.

## Accessibility

- `ariaLabel` is REQUIRED. Describe what the animation conveys, not what it visually does:
  - ✓ "결제가 완료되었습니다"
  - ✗ "체크마크가 그려지는 애니메이션"
- Wrap in `role="img"` (animation conveys meaning) OR `role="presentation"` (purely decorative + adjacent text already conveys meaning). Pick one consciously.
- For `mode="once"` success / error states: also fire `role="status"` text announcement adjacent. Don't rely on the animation alone.
- `prefers-reduced-motion: reduce` → show poster, never animate. Required.
- Don't auto-play sound (Lottie can carry audio in some exports — strip it in Bodymovin export).

## Lazy-loading strategy

For Lottie files >30kB:

```tsx
const SuccessLottie = lazy(() =>
  import("./animations/success.json").then(mod => ({
    default: () => <LottiePlayer src={mod.default} poster="/success.png" mode="once" />
  }))
);

<Suspense fallback={<img src="/success.png" alt="결제 완료" />}>
  <SuccessLottie />
</Suspense>
```

For above-the-fold animations: include the poster as `<link rel="preload" as="image">` and let the JSON stream in.

## Implementation hints

```tsx
import { useEffect, useRef, useState } from "react";
import lottie, { AnimationItem } from "lottie-web";

function LottiePlayer({
  src, poster, mode = "once", autoplay, playing, pauseOffscreen = true,
  ariaLabel, onComplete, renderer = "svg", width, height,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Skip everything if reduced motion
  if (reduced || errored) {
    return <img src={poster} alt={ariaLabel} width={width} height={height} />;
  }

  // Load + initialize
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const data = typeof src === "string" ? await fetch(src).then(r => r.json()) : src;
        if (cancelled) return;
        animRef.current = lottie.loadAnimation({
          container: containerRef.current!,
          renderer,
          loop: mode === "loop",
          autoplay: mode !== "controlled" && (autoplay ?? true),
          animationData: data,
        });
        animRef.current.addEventListener("complete", () => onComplete?.());
        setLoaded(true);
      } catch {
        setErrored(true);
      }
    })();
    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, [src]);

  // Controlled mode play/pause
  useEffect(() => {
    if (mode !== "controlled" || !animRef.current) return;
    if (playing) animRef.current.play();
    else animRef.current.pause();
  }, [playing, mode]);

  // Pause offscreen
  useEffect(() => {
    if (!pauseOffscreen || !containerRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!animRef.current) return;
      if (entry.isIntersecting) animRef.current.play();
      else animRef.current.pause();
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [pauseOffscreen]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      style={{ width, height, position: "relative" }}
    >
      {!loaded && poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0 }} />}
    </div>
  );
}
```

## Bundle / performance

| Library | Bundle | Notes |
| --- | --- | --- |
| `lottie-web` | ~150kB | Full-featured, all renderers |
| `lottie-react` | ~150kB (wraps lottie-web) | React API |
| `lottie-react-light` | ~50kB | Subset (svg renderer only) |
| `@lottiefiles/dotlottie-react` | ~80kB | Smaller binary `.lottie` format |

Recommendation: use `lottie-react-light` if you only need SVG (sharpest, most cases). Use canvas renderer only for complex animations with many shapes.

For `.lottie` (compressed binary): 30–50% smaller files than JSON. Worth the swap if you ship 5+ animations.

## Edge cases

- **JSON fails to load (404, network error)**: show poster image. Never blank.
- **Animation has audio**: strip it in Bodymovin export (`Audio: Off`). Don't auto-play sound.
- **User rapid-mounts/unmounts (e.g., toast notifications)**: each mount creates lottie instance. Ensure `destroy()` runs in cleanup.
- **Animation longer than 5 seconds**: reconsider — Lottie is for moments, not videos. Use a real video element.
- **Same animation in 50 instances on a page (icon list)**: lottie-web shares JSON parse cache, but DOM nodes still cost. Consider sprite or static SVG instead.
- **SSR (Next.js)**: lottie-web requires DOM. Wrap in `dynamic(() => import("./LottiePlayer"), { ssr: false })`.

## Don't

- Don't ship Lottie for what CSS can do (fade-in, simple icon flip). Bundle cost not justified.
- Don't auto-play decorative loops on every page — battery drain on mobile.
- Don't skip the poster — it's the fallback for reduced motion, slow networks, errors, and SSR.
- Don't ship animations with embedded fonts (massively inflates JSON). Convert text to outlines in After Effects.
- Don't ship 60fps animations when 30fps reads identically. Cuts file size in half.
- Don't include color in the JSON if the surrounding theme might change (dark mode). Use `expressions` or post-load color override.

## References

- [`lottie-web`](https://github.com/airbnb/lottie-web) — Airbnb's renderer
- [`lottie-react`](https://lottiereact.com/) — React wrapper
- [Bodymovin plugin](https://aescripts.com/bodymovin/) — After Effects → JSON exporter
- [LottieFiles](https://lottiefiles.com/) — animation library + dotlottie format

## Cross-reference

- [`knowledge/motion/motion-tools.md`](../knowledge/motion/motion-tools.md) — when Lottie vs Rive vs CSS
- [`knowledge/motion/marketing-motion.md`](../knowledge/motion/marketing-motion.md) — Lottie in marketing
- [`examples/component-empty-state.md`](component-empty-state.md) — uses Lottie for empty illustrations
- [`examples/component-result.md`](component-result.md) — success / error states
