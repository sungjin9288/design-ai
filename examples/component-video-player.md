<!-- hand-written -->
# `VideoPlayer` (custom — accessible HTML5 video with captions, speed, transcript) — spec

> Standard video player for in-product help, marketing demos, and embedded brand video. Wraps native `<video>` with captions toggle, playback speed, transcript link, and reduced-motion handling. Pairs with [`knowledge/video/in-product-video.md`](../knowledge/video/in-product-video.md) and [`knowledge/video/video-fundamentals.md`](../knowledge/video/video-fundamentals.md).

## Purpose

The HTML5 `<video>` element is fine for trivial cases but lacks:
1. Caption toggle UI that's discoverable.
2. Speed control.
3. Transcript link.
4. Brand-aligned controls.
5. Reduced-motion handling.
6. Korean caption styling defaults.

`VideoPlayer` provides these without ceding to third-party players (Video.js, JW Player) for typical product use.

## Anatomy

```
┌────────────────────────────────────────┐
│                                        │
│         [video frame / poster]         │
│                                        │
│                                        │
│   ▶ 0:23 / 1:15  ━━━━━○━━━━━           │   ← progress
│                                        │
│   [Play] [Vol] [CC] [Speed 1x] [Full]  │   ← controls
└────────────────────────────────────────┘

[View transcript ↓]                          ← optional below
```

## API

```tsx
<VideoPlayer
  src="/videos/onboarding.mp4"
  poster="/videos/onboarding-poster.jpg"
  captions={[
    { src: "/captions/onboarding-ko.vtt", lang: "ko", label: "한국어", default: true },
    { src: "/captions/onboarding-en.vtt", lang: "en", label: "English" },
  ]}
  transcript="/transcripts/onboarding.html"
  title="앱 시작하기"
  onComplete={() => trackComplete("onboarding")}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string \| Source[]` | — | Single URL OR array of `{ src, type }` for multi-format |
| `poster` | `string` | — | Poster image; first paint and reduced-motion fallback |
| `captions` | `Caption[]` | `[]` | Caption tracks (REQUIRED if video has speech) |
| `transcript` | `string` | — | URL to full transcript page |
| `title` | `string` | — | Video title; used for `aria-label` |
| `controls` | `boolean \| "minimal"` | `true` | Show controls; `"minimal"` shows play/pause + caption only |
| `autoplay` | `boolean` | `false` | Auto-play (must also be muted to work in browsers) |
| `muted` | `boolean` | `false` (or `true` if autoplay) | Mute on load |
| `loop` | `boolean` | `false` | Loop continuously |
| `playsinline` | `boolean` | `true` | iOS inline (don't go fullscreen on play) |
| `speedOptions` | `number[]` | `[0.5, 1, 1.25, 1.5, 2]` | Playback speed options |
| `defaultSpeed` | `number` | `1` | Initial speed |
| `onComplete` | `() => void` | — | Fires when video ends |
| `onPlay` / `onPause` | `() => void` | — | Standard events |
| `aspectRatio` | `string` | `"16/9"` | CSS aspect-ratio value |
| `width` | `string \| number` | `"100%"` | Wrapper width |

```ts
type Source = { src: string; type: string };
type Caption = { src: string; lang: string; label: string; default?: boolean };
```

## Behavior

### Controls

| Control | Behavior |
| --- | --- |
| Play / pause | Spacebar, click, button |
| Progress bar | Drag to scrub; click to seek |
| Volume | Slider + mute toggle; M to toggle |
| Captions (CC) | Cycle through tracks + off; C to toggle |
| Speed | Dropdown 0.5x-2x |
| Fullscreen | Button + F to toggle |
| Picture-in-picture | (optional) browser native |

### Caption defaults

If user has saved a caption preference (locale match): apply.
Else if a track is `default: true`: apply.
Else: off.

Remember user's caption choice in `localStorage`:
```ts
localStorage.setItem("videoplayer.captions", "ko" | "en" | "off");
```

### Speed defaults

Remember user's speed choice in localStorage too. Power users want 1.5x persistent.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .video-player[data-autoplay="true"] video {
    display: none;
  }
  .video-player[data-autoplay="true"] .poster-fallback {
    display: block;
  }
}
```

If `autoplay` is true and user prefers reduced motion: show poster image only with a "Play" button overlay. User can opt in.

## States

| State | Visual |
| --- | --- |
| `loading` | Poster + spinner |
| `ready` | Poster + Play button |
| `playing` | Video playing; controls visible (auto-hide after 3s of mouse idle) |
| `paused` | Frozen frame; controls always visible |
| `buffering` | Spinner over current frame |
| `ended` | Last frame; replay button |
| `error` | Poster + "Couldn't load video" message |
| `reduced-motion` (autoplay only) | Poster + Play button (no auto-play) |

## Tokens consumed

```
--color-bg-default            (player bg behind controls)
--color-fg-on-bg              (control icons / text)
--color-bg-overlay            (semi-opaque controls bar)
--color-brand-default         (progress bar fill)
--color-text-primary          (caption text default)
--space-sm, --space-md
--radius-md                   (player container)
--font-size-sm                (control labels)
--motion-fast                 (controls fade in/out)
--ease-out
--font-feature-tnum           (timecode digit alignment)
```

For caption styling (when burning is not an option and user toggles on):

```
--video-caption-font          (Pretendard for KR; system-ui fallback)
--video-caption-size          (4-5% of player height)
--video-caption-color         (white)
--video-caption-bg            (rgba(0,0,0,0.7))
--video-caption-shadow        (drop shadow for visibility)
```

## Accessibility

- **Captions REQUIRED** for any video with speech.
- **Transcript link** for full-text access.
- Wrapper: `<figure>` with `<figcaption>` for the title.
- `<video aria-label="{title}">` so screen reader announces.
- Controls: each `<button>` with `aria-label` (e.g., `aria-label="재생"`).
- Progress bar: `<input type="range" role="slider">` with `aria-valuetext` reporting current time.
- Caption toggle: `aria-pressed` for current state.
- Keyboard: space (play/pause), arrows (seek 5s / 10s), M (mute), C (captions), F (fullscreen).
- Focus visible on all controls.
- Don't auto-play with sound — accessibility + browser policy.

## Code example

```tsx
function ProductDemoSection() {
  return (
    <section>
      <h2>제품 둘러보기</h2>
      <VideoPlayer
        src={[
          { src: "/videos/demo.webm", type: "video/webm" },
          { src: "/videos/demo.mp4", type: "video/mp4" },
        ]}
        poster="/videos/demo-poster.jpg"
        captions={[
          { src: "/captions/demo-ko.vtt", lang: "ko", label: "한국어", default: true },
          { src: "/captions/demo-en.vtt", lang: "en", label: "English" },
        ]}
        transcript="/transcripts/demo.html"
        title="제품 데모 - 1분 30초"
      />
    </section>
  );
}
```

## Implementation hints

```tsx
function VideoPlayer({ src, poster, captions, transcript, title, ...props }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [activeCaption, setActiveCaption] = useState(() =>
    localStorage.getItem("videoplayer.captions") ??
    captions.find(c => c.default)?.lang ??
    "off"
  );
  const [speed, setSpeed] = useState(() =>
    Number(localStorage.getItem("videoplayer.speed") ?? props.defaultSpeed ?? 1)
  );
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    localStorage.setItem("videoplayer.captions", activeCaption);
    localStorage.setItem("videoplayer.speed", String(speed));
  }, [activeCaption, speed]);

  // Apply active caption track
  useEffect(() => {
    const tracks = videoRef.current?.textTracks;
    if (!tracks) return;
    for (const track of Array.from(tracks)) {
      track.mode = track.language === activeCaption ? "showing" : "disabled";
    }
  }, [activeCaption]);

  if (reduced && props.autoplay) {
    return <PosterFallback poster={poster} title={title} onPlay={() => setPlaying(true)} />;
  }

  return (
    <figure className="video-player" data-state={playing ? "playing" : "paused"}>
      <video
        ref={videoRef}
        poster={poster}
        playsInline={props.playsinline ?? true}
        autoPlay={props.autoplay}
        muted={props.muted ?? props.autoplay}
        loop={props.loop}
        aria-label={title}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); props.onComplete?.(); }}
      >
        {Array.isArray(src)
          ? src.map(s => <source key={s.src} src={s.src} type={s.type} />)
          : <source src={src} />}
        {captions.map(c => (
          <track
            key={c.lang}
            kind="captions"
            src={c.src}
            srcLang={c.lang}
            label={c.label}
            default={c.default}
          />
        ))}
      </video>

      <Controls
        videoRef={videoRef}
        captions={captions}
        activeCaption={activeCaption}
        onCaptionChange={setActiveCaption}
        speed={speed}
        speedOptions={props.speedOptions ?? [0.5, 1, 1.25, 1.5, 2]}
        onSpeedChange={setSpeed}
      />

      <figcaption className="sr-only">{title}</figcaption>

      {transcript && (
        <a href={transcript} className="video-player__transcript">
          전체 스크립트 보기
        </a>
      )}
    </figure>
  );
}
```

## Caption file (WebVTT) example

```vtt
WEBVTT

00:00:00.000 --> 00:00:03.500
안녕하세요, 저희 앱에 오신 것을 환영합니다.

00:00:03.500 --> 00:00:07.000
이 영상에서는 첫 거래 등록 방법을 안내해 드립니다.

00:00:07.000 --> 00:00:11.500
화면 하단의 + 버튼을 눌러 새 거래를 추가하세요.
```

Localized version: same timestamps, translated text in `demo-en.vtt`.

## Edge cases

- **No captions provided + video has speech**: dev warning. Don't ship without captions.
- **Slow network**: poster shown until enough video buffers; "buffering" state appears if mid-playback drops below buffer.
- **Video URL 404**: error state with "Couldn't load. [Retry]" button.
- **iOS background**: `playsinline` mandatory or video opens in fullscreen; respect Apple's autoplay restrictions.
- **Multiple sources, none supported**: fall back to poster + transcript link.
- **Transcript link clicked while playing**: pause video first; navigate after.
- **Caption track 404**: graceful fallback to next track or "off".
- **User locks rotation**: respect; don't force fullscreen rotation.

## Don't

- Don't ship without poster — first paint is blank otherwise.
- Don't auto-play with sound — browsers block; users hate.
- Don't omit captions for spoken-content videos.
- Don't hard-code controls inside the video element. Use the wrapper for brand alignment.
- Don't disable user's right-click "Save video as" unless DRM-protected. The right-click block is annoying without DRM benefit.
- Don't autoplay loops on mobile cellular without warning. Battery + data drain.
- Don't put video in time-critical product flows (checkout, payment).

## References

Patterns drawn from:
- HTML5 `<video>` + `<track>` native APIs
- Vimeo, YouTube embed control conventions
- Video.js (more featureful but heavier)
- Plyr (lightweight modern alternative)

For more capability (HLS streaming, DRM, ads): use Video.js, JW Player, or Shaka Player. This component is for the 90% case.

## Cross-reference

- [`knowledge/video/video-fundamentals.md`](../knowledge/video/video-fundamentals.md) — codecs, captions
- [`knowledge/video/in-product-video.md`](../knowledge/video/in-product-video.md) — in-product use
- [`knowledge/video/marketing-video.md`](../knowledge/video/marketing-video.md) — marketing use
- [`knowledge/video/korean-video-conventions.md`](../knowledge/video/korean-video-conventions.md) — KR caption styling
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — keyboard interactions
- [`examples/component-video-hero.md`](component-video-hero.md) — autoplay loop hero
