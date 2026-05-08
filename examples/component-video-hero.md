<!-- hand-written -->
# `VideoHero` (custom — autoplay landing-page video hero) — spec

> Above-the-fold autoplay video loop with text overlay, poster fallback, and reduced-motion handling. Pairs with [`knowledge/video/marketing-video.md`](../knowledge/video/marketing-video.md) and [`knowledge/patterns/landing-hero-design.md`](../knowledge/patterns/landing-hero-design.md).

## Purpose

Hero loops on landing pages need specific behavior:
1. Autoplay muted; loop seamlessly.
2. Show poster instantly; video loads behind.
3. Skip video entirely on reduced-motion or slow connection.
4. Layer text + CTA over the video without competing.
5. Respond to mobile (often vertical / different ratio).

Without this: every team hand-rolls `<video>` and gets some of these wrong.

## Anatomy

```
┌──────────────────────────────────────────┐
│                                          │
│       [video loop or poster]             │
│                                          │
│       [Headline overlay]                 │
│       [Sub-headline]                     │
│       [CTA button]                       │
│                                          │
│       [↓ scroll cue]                     │
└──────────────────────────────────────────┘
```

## API

```tsx
<VideoHero
  src={[
    { src: "/hero.webm", type: "video/webm", media: "(min-width: 768px)" },
    { src: "/hero-mobile.webm", type: "video/webm", media: "(max-width: 767px)" },
    { src: "/hero.mp4", type: "video/mp4", media: "(min-width: 768px)" },
    { src: "/hero-mobile.mp4", type: "video/mp4", media: "(max-width: 767px)" },
  ]}
  poster="/hero-poster.jpg"
  posterMobile="/hero-poster-mobile.jpg"
  overlay="dark"
  align="center"
>
  <h1>송금이 더 쉬워졌어요</h1>
  <p>30초 만에 가입하고, 첫 송금까지 무료.</p>
  <Button>지금 시작하기</Button>
</VideoHero>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `Source[]` | — | Multi-format sources; can include `media` for art-direction (mobile vs desktop video) |
| `poster` | `string` | — | Desktop poster image (REQUIRED) |
| `posterMobile` | `string` | `poster` | Mobile-specific poster |
| `overlay` | `"none" \| "light" \| "dark" \| "gradient-bottom" \| "gradient-top"` | `"dark"` | Tint over video for text contrast |
| `overlayOpacity` | `number` | `0.4` | 0-1 |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Horizontal text alignment |
| `verticalAlign` | `"top" \| "middle" \| "bottom"` | `"middle"` | Vertical text position |
| `aspectRatio` | `string` | `"16/9"` desktop / `"4/5"` mobile | CSS aspect-ratio |
| `minHeight` | `string` | `"600px"` desktop / `"500px"` mobile | Minimum hero height |
| `lazy` | `boolean` | `false` | Delay video load (only for non-LCP heroes) |
| `children` | `ReactNode` | — | Text + CTA overlay |
| `loadingStrategy` | `"eager" \| "viewport" \| "interaction"` | `"eager"` | When to start loading video |

```ts
type Source = { src: string; type: string; media?: string };
```

## Behavior

### Loading strategy

Hero is above-the-fold → above-the-fold. Optimize for **LCP**:

```
Phase 1 (instant): poster image renders. LCP captures this.
Phase 2 (parallel): video starts streaming.
Phase 3 (when buffered): video plays + cross-fades poster out.
```

Don't block on video. The poster IS the LCP element; video enhances after.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .video-hero video {
    display: none;
  }
}
```

In reduced-motion: poster only. No video. Text + CTA still overlay normally.

### Slow connection detection

If `navigator.connection?.effectiveType` is `"2g"` or `"slow-2g"`: skip video; show poster only.

```ts
const connection = (navigator as any).connection;
const slowConnection = connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
const shouldLoadVideo = !slowConnection && !reducedMotion;
```

### Art direction (mobile vs desktop video)

Desktop hero might be 16:9 wide cinematic; mobile 4:5 with subject closer.

`<source media="...">` lets browser pick:

```html
<video autoplay muted loop playsinline poster="hero-mobile.jpg">
  <source src="hero-desktop.mp4" media="(min-width: 768px)" type="video/mp4" />
  <source src="hero-mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
</video>
```

Browser respects `media` query; only loads the matching source.

### Loop seamlessness

Video must loop without visible cut:
- Edit so first frame == last frame.
- OR fade out / fade in at loop boundary in encoded video itself.

Don't rely on `loop` attribute alone; bad edits show a flash on loop.

## States

| State | Visual |
| --- | --- |
| Initial | Poster + text overlay; video loading |
| Video ready | Cross-fade poster → video (200ms); video plays |
| Playing | Video loops; text overlay always |
| Reduced motion | Poster only; text overlay |
| Slow connection | Poster only; text overlay |
| Video error | Poster only; text overlay |

## Tokens consumed

```
--color-bg-overlay-light       (light overlay tint)
--color-bg-overlay-dark        (dark overlay tint)
--color-fg-on-overlay          (text color over video)
--space-lg, --space-xl         (overlay spacing)
--motion-medium                (poster → video fade)
--ease-out
--max-width-prose              (overlay text max-width)
```

## Accessibility

- **Video has no audio** (autoplay + muted). No caption track needed.
- **Text content** carries the meaning. Video is decorative.
- Wrap video in `<div role="presentation">` or use `aria-hidden="true"` on `<video>`.
- Heading + body + CTA in standard semantic markup (`<h1>`, `<p>`, `<button>`).
- Pause control: provide a small "Pause" button (corner) for users who want to stop the loop. Required by WCAG 2.2 SC 2.2.2.

```html
<button aria-label="비디오 일시정지" class="video-pause-toggle">⏸</button>
```

- Reduced motion: handled via media query; no video shown.

## Performance budget

| Metric | Target |
| --- | --- |
| Hero loop file size | < 3MB (5-15s, 1080p, ~1.5 Mbps) |
| Mobile variant | < 1.5MB (5-15s, 720p) |
| LCP | < 2.5s (poster, not video) |
| Video start playing | < 3s on 4G |
| First frame match poster | Critical (otherwise visible flash) |

## File preparation tips (for content team)

- **Source**: 4K master, edit in 16:9 desktop + 4:5 / 9:16 mobile.
- **Trim**: 5-15 seconds; loop-friendly cuts.
- **Audio**: stripped (autoplay = muted).
- **Compression**: ffmpeg with H.264 + faststart:

```bash
ffmpeg -i master.mov \
  -c:v libx264 -profile:v main -crf 23 -preset slow \
  -an \
  -movflags +faststart \
  -vf "scale=1920:1080" \
  hero-desktop.mp4
```

- **WebM (smaller)**:

```bash
ffmpeg -i master.mov \
  -c:v libvpx-vp9 -crf 35 -b:v 0 \
  -an \
  -vf "scale=1920:1080" \
  hero-desktop.webm
```

## Implementation hints

```tsx
function VideoHero({
  src,
  poster,
  posterMobile,
  overlay = "dark",
  overlayOpacity = 0.4,
  align = "center",
  verticalAlign = "middle",
  aspectRatio = "16/9",
  minHeight = "600px",
  loadingStrategy = "eager",
  children,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const reduced = usePrefersReducedMotion();
  const slowConnection = useSlowConnection();
  const [pausedByUser, setPausedByUser] = useState(false);

  const shouldLoadVideo = !reduced && !slowConnection;

  useEffect(() => {
    if (!shouldLoadVideo || !videoRef.current) return;

    const video = videoRef.current;
    const onCanPlay = () => setVideoReady(true);
    video.addEventListener("canplaythrough", onCanPlay);

    if (loadingStrategy === "eager") {
      video.load();
    }

    return () => video.removeEventListener("canplaythrough", onCanPlay);
  }, [shouldLoadVideo, loadingStrategy]);

  return (
    <section
      className="video-hero"
      data-overlay={overlay}
      data-align={align}
      data-vertical-align={verticalAlign}
      style={{
        aspectRatio,
        minHeight,
        "--overlay-opacity": overlayOpacity,
      } as React.CSSProperties}
    >
      <picture className="video-hero__poster" data-state={videoReady ? "hidden" : "visible"}>
        <source media="(max-width: 767px)" srcSet={posterMobile ?? poster} />
        <img src={poster} alt="" />
      </picture>

      {shouldLoadVideo && (
        <video
          ref={videoRef}
          className="video-hero__video"
          data-state={videoReady && !pausedByUser ? "visible" : "hidden"}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          {src.map(s => (
            <source key={s.src} src={s.src} type={s.type} media={s.media} />
          ))}
        </video>
      )}

      <div className="video-hero__overlay" />

      <div className="video-hero__content">
        {children}
      </div>

      {shouldLoadVideo && (
        <button
          className="video-hero__pause"
          aria-label={pausedByUser ? "비디오 재생" : "비디오 일시정지"}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) { video.play(); setPausedByUser(false); }
            else { video.pause(); setPausedByUser(true); }
          }}
        >
          {pausedByUser ? "▶" : "⏸"}
        </button>
      )}
    </section>
  );
}
```

## CSS

```css
.video-hero {
  position: relative;
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.video-hero__poster,
.video-hero__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 200ms var(--ease-out);
}

.video-hero__poster[data-state="hidden"] { opacity: 0; }
.video-hero__video[data-state="visible"] { opacity: 1; }
.video-hero__video[data-state="hidden"] { opacity: 0; }

.video-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--overlay-opacity, 0.4));
  pointer-events: none;
}

.video-hero[data-overlay="light"] .video-hero__overlay { background: rgba(255,255,255, var(--overlay-opacity)); }
.video-hero[data-overlay="gradient-bottom"] .video-hero__overlay {
  background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.7));
}

.video-hero__content {
  position: relative;
  z-index: 1;
  color: var(--color-fg-on-overlay, white);
  padding: var(--space-xl);
  max-width: var(--max-width-prose);
  text-align: center;
}

.video-hero[data-align="start"] .video-hero__content { text-align: start; }
.video-hero[data-align="end"] .video-hero__content { text-align: end; }

.video-hero__pause {
  position: absolute;
  bottom: var(--space-md);
  right: var(--space-md);
  z-index: 2;
  width: 40px; height: 40px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .video-hero__video { display: none; }
  .video-hero__pause { display: none; }
}
```

## Edge cases

- **Mobile data saver mode**: `prefers-reduced-data` (experimental) — treat as slow connection.
- **iOS Low Power Mode**: video may pause; user can manually resume.
- **Browser tab background**: video pauses automatically (browser default); resumes on focus.
- **Video sources all 404**: fall back to poster only; text overlay still works.
- **Poster image fails to load**: fall back to solid background color from `--color-bg-default`.
- **Mobile bandwidth**: even with WiFi, mobile WebKit is conservative on autoplay; respect that.
- **RTL languages**: text overlay alignment swaps automatically with `text-align: start/end`.

## Don't

- Don't auto-play with sound. Browsers block; users hate.
- Don't put critical info ONLY in the video. Text overlay carries meaning.
- Don't ship 4K hero loops. 1080p mobile + 1080p desktop is enough.
- Don't skip the poster. First paint is otherwise blank.
- Don't loop without seamless edit — visible flash kills polish.
- Don't auto-play on cellular without `prefers-reduced-data` check (where supported).
- Don't omit the pause button — WCAG 2.2 requires user control over autoplay > 5s.
- Don't put text behind low-contrast video areas — overlay tint exists for this.

## References

Patterns drawn from:
- Apple.com hero video patterns (poster + autoplay + loop)
- Stripe.com hero patterns
- Linear.app hero patterns
- Toss.im / 토스 landing-page hero patterns

## Cross-reference

- [`knowledge/video/video-fundamentals.md`](../knowledge/video/video-fundamentals.md) — encoding
- [`knowledge/video/marketing-video.md`](../knowledge/video/marketing-video.md) — marketing video strategy
- [`knowledge/video/korean-video-conventions.md`](../knowledge/video/korean-video-conventions.md) — KR
- [`knowledge/patterns/landing-hero-design.md`](../knowledge/patterns/landing-hero-design.md) — hero strategy
- [`examples/component-video-player.md`](component-video-player.md) — full controls player
- [`examples/component-hero-block.md`](component-hero-block.md) — hero block (alternate without video)
