<!-- hand-written -->
# `LoadingSequence` (custom — splash + first-screen coordination) — spec

> Coordinates the cold-launch experience: brand splash → biometric / auth gate (optional) → first screen reveal. Wraps the moments after process start and before the user sees real content. Pairs with [`knowledge/motion/app-loading-sequences.md`](../knowledge/motion/app-loading-sequences.md).

## Purpose

Make cold launch feel **intentional** instead of like a stall:

1. Show brand-led splash that matches the first screen's background (no flash).
2. Optionally chain a biometric gate (Korean fintech default).
3. Cross-fade into the real app content as soon as it's ready.
4. Respect `prefers-reduced-motion`.

Without this: blank screen → flash of unstyled content → spinner → app. Reads as broken.

## Anatomy

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│                                      │
│            [logo / wordmark]         │  ← splash (brand bg)
│                                      │
│                                      │
│                                      │
└──────────────────────────────────────┘
              ↓ (optional)
┌──────────────────────────────────────┐
│        🔒 Face ID                    │
│        본인 확인이 필요합니다          │  ← biometric gate
│        [지문으로 잠금 해제]            │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  Header                              │
│  [content cross-fades in]            │  ← first screen
│  ...                                 │
└──────────────────────────────────────┘
```

## API

```tsx
<LoadingSequence
  brand={{ logo: <Logo />, backgroundColor: "var(--color-brand-bg)" }}
  minDurationMs={600}
  gate={biometricEnabled ? <BiometricGate onUnlock={resolve} /> : null}
  onReady={() => setAppReady(true)}
>
  <App />
</LoadingSequence>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `brand` | `{ logo: ReactNode; backgroundColor: string }` | — | Splash content + bg color (must match first screen) |
| `minDurationMs` | `number` | `600` | Floor on splash duration to avoid flash if app boots in 80ms |
| `gate` | `ReactNode \| null` | `null` | Optional auth gate (biometric, PIN). When present, splash → gate → content. |
| `onReady` | `() => void` | — | Fires when content is fully visible |
| `children` | `ReactNode` | — | Real app content; rendered behind splash, revealed on transition |
| `disableAnimation` | `boolean` | auto via `prefers-reduced-motion` | Skip cross-fade |

## Behavior

### State machine

```
       ┌─────────┐
       │ booting │  ← process started; splash fully opaque
       └────┬────┘
            │ minDurationMs reached AND app ready
            ▼
       ┌─────────┐
       │  gate?  │ ← if `gate` prop, render it (splash bg stays)
       └────┬────┘
            │ gate resolves (or no gate)
            ▼
    ┌─────────────┐
    │ revealing   │ ← 200ms cross-fade splash → content
    └──────┬──────┘
           │
           ▼
       ┌────────┐
       │ ready  │ ← onReady fires; LoadingSequence unmounts splash
       └────────┘
```

### Timing budget

| Phase | Duration | Notes |
| --- | --- | --- |
| Splash visible | `max(minDurationMs, timeToAppReady)` | Floor prevents flash; ceiling is real boot time |
| Gate (if present) | User-driven | Typically 1–3s for biometric; can be longer |
| Cross-fade | 200ms | Cross-fade splash out + content in simultaneously |
| Total cold launch | 0.6–3s typical | Korean fintech: 1.5–3s with biometric |

### Cross-fade

```css
.splash {
  opacity: 1;
  transition: opacity var(--motion-medium) var(--ease-out);
}
.splash[data-state="revealing"] { opacity: 0; }

.content {
  opacity: 0;
  transition: opacity var(--motion-medium) var(--ease-out);
}
.content[data-state="revealing"],
.content[data-state="ready"] { opacity: 1; }
```

Both run together — true cross-fade, not sequential.

## States

| State | Splash | Gate | Content |
| --- | --- | --- | --- |
| `booting` | Visible (opacity 1) | hidden | Hidden behind splash |
| `gating` | Hidden | Visible | Behind gate |
| `revealing` | Fading out | Hidden | Fading in |
| `ready` | Unmounted | Unmounted | Visible |

## Tokens consumed

```
--color-brand-bg                (splash + first screen background — MUST match)
--color-brand-fg                (logo color on splash)
--motion-medium                 (200ms cross-fade)
--ease-out                      (cross-fade easing)
--z-splash                      (above all app chrome)
```

## Korean fintech convention

Toss / KakaoBank pattern:

```tsx
<LoadingSequence
  brand={{ logo: <TossLogo />, backgroundColor: "#0064FF" }}
  minDurationMs={400}
  gate={
    user.biometricEnrolled ? (
      <BiometricGate
        prompt="Face ID로 잠금 해제"
        fallback={<PINGate />}
      />
    ) : null
  }
>
  <Dashboard />
</LoadingSequence>
```

- Brand color splash (full bleed)
- Biometric gate appears almost immediately (within minDurationMs floor)
- Gate dominates the cold-launch experience; actual app boot hides underneath
- After unlock: 200ms cross-fade to dashboard

See [`examples/component-biometric-gate.md`](component-biometric-gate.md).

## Accessibility

- Splash: `role="presentation"` (decorative). Logo gets `alt="[brand name]"` if `<img>`, or `aria-label` if `<svg>`.
- Gate: standard a11y from gate component.
- During splash: focus is trapped on splash root with `tabindex="-1"` so screen readers don't read app behind it prematurely.
- Content reveal: announce via `<div role="status" aria-live="polite">앱 준비 완료</div>` only if minDurationMs is hit and reveal is delayed beyond 1s. Otherwise silent.
- `prefers-reduced-motion`: skip cross-fade; instant swap. Splash still shows for `minDurationMs`.

## Implementation hints

```tsx
function LoadingSequence({ brand, minDurationMs = 600, gate, onReady, children }: Props) {
  const [phase, setPhase] = useState<"booting" | "gating" | "revealing" | "ready">("booting");
  const mountedAt = useRef(Date.now());
  const [appReady, setAppReady] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Wait for app content to render at least once
  useEffect(() => {
    requestIdleCallback(() => setAppReady(true));
  }, []);

  // Transition booting → gating/revealing once minDuration + appReady
  useEffect(() => {
    if (!appReady) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, minDurationMs - elapsed);
    const id = setTimeout(() => {
      setPhase(gate ? "gating" : "revealing");
    }, wait);
    return () => clearTimeout(id);
  }, [appReady, gate, minDurationMs]);

  // Reveal → ready
  useEffect(() => {
    if (phase !== "revealing") return;
    const id = setTimeout(() => {
      setPhase("ready");
      onReady?.();
    }, reduced ? 0 : 200);
    return () => clearTimeout(id);
  }, [phase, onReady, reduced]);

  return (
    <>
      {phase !== "ready" && (
        <div
          className="splash"
          data-state={phase}
          style={{ background: brand.backgroundColor }}
          role="presentation"
        >
          {phase === "gating" ? gate : brand.logo}
        </div>
      )}
      <div className="content" data-state={phase}>
        {children}
      </div>
    </>
  );
}
```

## Edge cases

- **App boots faster than `minDurationMs`**: splash still shown until floor. Prevents 80ms flash.
- **App boots slower than splash floor**: splash stays until app is ready. No premature reveal.
- **Gate fails (biometric denied 3×)**: bubble up to gate's `onFallback`; LoadingSequence stays in `gating` until resolved.
- **App backgrounded during splash**: pause timers via `visibilitychange` listener; resume on focus.
- **Hot reload in dev**: `LoadingSequence` should NOT re-trigger on every HMR — only on real cold mount.
- **Server-side rendering**: render content directly without splash on SSR; client-side mount triggers splash only if `document.readyState !== "complete"` at mount.

## Don't

- Don't put a spinner on the splash. Static logo only. Looping spinner reads as stuck.
- Don't animate the logo with bounce / pulse on every cold launch — once the user has seen it, animation feels precious.
- Don't mismatch `brand.backgroundColor` with the first screen's bg. The whole point is seamless transition.
- Don't keep splash up longer than 3 seconds without a gate. User thinks the app froze.
- Don't tie `onReady` to data fetching — fires when first paint completes, not when feed is loaded.

## References

No upstream component matches. This composes splash + gate + cross-fade in a single shell.

## Cross-reference

- [`knowledge/motion/app-loading-sequences.md`](../knowledge/motion/app-loading-sequences.md) — strategy
- [`knowledge/motion/principles.md`](../knowledge/motion/principles.md) — duration / easing
- [`examples/component-biometric-gate.md`](component-biometric-gate.md) — gate component
- [`examples/component-page-transition.md`](component-page-transition.md) — route-level transitions (after splash)
