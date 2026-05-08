<!-- hand-written -->
---
title: Video fundamentals (codecs, resolution, framerate, bitrate, captions)
applies_to: [video, production, encoding, accessibility]
---

# Video fundamentals

Designing for video means thinking about more than visual composition. Every video has technical specs (codec, resolution, framerate, bitrate, audio) that determine quality, file size, compatibility, and accessibility.

This file is the foundation for [`marketing-video.md`](marketing-video.md), [`social-and-short-form.md`](social-and-short-form.md), [`in-product-video.md`](in-product-video.md), and [`korean-video-conventions.md`](korean-video-conventions.md).

## Resolution

| Name | Pixels | Aspect | Use |
| --- | --- | --- | --- |
| **SD** | 720 × 480 | 4:3 | Legacy; rare today |
| **HD / 720p** | 1280 × 720 | 16:9 | Mid-quality web |
| **Full HD / 1080p** | 1920 × 1080 | 16:9 | Most common; YouTube standard |
| **2K** | 2048 × 1080 | 17:9 | Cinema |
| **4K UHD** | 3840 × 2160 | 16:9 | Premium delivery; 4× of 1080p |
| **8K UHD** | 7680 × 4320 | 16:9 | Future; rare delivery |
| **Vertical 1080** | 1080 × 1920 | 9:16 | Reels, Shorts, TikTok |
| **Square 1080** | 1080 × 1080 | 1:1 | Instagram feed |

Default delivery: **1080p (1920×1080)** for landscape, **1080×1920** for vertical. Shoot at 4K when possible (gives reframe headroom in post).

## Framerate (fps)

| fps | Use |
| --- | --- |
| **24** | Cinematic / film aesthetic |
| **25** | PAL broadcast (KR uses NTSC, but online is fps-agnostic) |
| **30 (29.97)** | NTSC broadcast; default for many online platforms |
| **48 / 50** | High-frame "soap opera" effect |
| **60** | Smooth motion, sports, gaming |
| **120+** | Slow-motion source (slowed in post) |

Default: **30fps** for product / marketing. **60fps** for product demos with motion (UI scrolling, gaming, fast action). **24fps** for cinematic / brand storytelling.

Don't mix framerates within a single video — looks weird at cuts.

## Codec and container

| Container | Codec | Use |
| --- | --- | --- |
| **MP4** | H.264 (AVC) | Universal compatibility; default delivery |
| **MP4** | H.265 (HEVC) | 50% smaller files at same quality; 2024+ widely supported |
| **WebM** | VP9 | YouTube uses; smaller than H.264 |
| **WebM** | AV1 | Newest; smallest files; nascent support |
| **MOV** | ProRes | Editing master format; huge files |
| **MKV** | Various | Personal libraries; not for delivery |

For web delivery in 2024+: **MP4 / H.264** for compatibility, **MP4 / H.265** or **WebM / AV1** for smaller file size. Provide both; let the browser pick.

## Bitrate

Bitrate = data per second. Higher = better quality + larger files.

| Resolution | fps | Bitrate (Mbps) for streaming |
| --- | --- | --- |
| 720p | 30 | 2.5-5 |
| 1080p | 30 | 5-10 |
| 1080p | 60 | 8-12 |
| 4K | 30 | 15-25 |
| 4K | 60 | 25-50 |

For landing page autoplay video: **target 1-3 Mbps** (small file size, optimized for mobile data). Compress aggressively; the eye forgives more than designers expect.

For YouTube delivery: YouTube re-encodes anyway, so upload at higher bitrate (10-50 Mbps for 1080p source) and let the platform optimize.

## Audio

| Spec | Default |
| --- | --- |
| Codec | AAC |
| Sample rate | 48 kHz |
| Channels | Stereo (2 ch) |
| Bitrate | 128-256 kbps |

For voice-only / product demos: 96-128 kbps mono is enough.
For music / cinematic: 192-256 kbps stereo.

### Loudness

Online platforms normalize loudness:
- **YouTube**: -14 LUFS integrated.
- **Instagram / TikTok**: -14 LUFS approx.
- **Cinema**: -23 to -27 LUFS.
- **Broadcast (KR)**: -23 LUFS (방송통신위원회 standard).

Mix to **-14 LUFS** for online delivery. Going louder = platforms turn it down. Going much quieter = users can't hear, abandon video.

### Audio matters more than designers think

Bad audio = users abandon faster than bad video. A pristine 4K shot with hissy audio reads as amateur. A blurry phone-shot with crisp audio reads as authentic.

Invest in:
- A real microphone (lavalier, shotgun, USB condenser).
- Quiet recording environment.
- Audio leveling in post.

## Color space

| Color space | Use |
| --- | --- |
| **sRGB / Rec. 709** | Standard web / HD; default |
| **DCI-P3** | Wider gamut; modern displays; iPhone standard |
| **Rec. 2020** | 4K / HDR; future |
| **HDR (HDR10, Dolby Vision)** | Premium content with bright highlights |

Default delivery: **Rec. 709 (sRGB equivalent)**. HDR for premium / cinematic only — most users don't have HDR displays.

For Korean video: most platforms still SDR. HDR is "nice to have" but not standard.

## Aspect ratios

| Ratio | Use |
| --- | --- |
| **16:9 (1.78)** | YouTube, TV, landscape default |
| **9:16 (0.56)** | Vertical (TikTok, Reels, Shorts, Stories) |
| **1:1 (1.0)** | Instagram feed, square crops |
| **4:5 (0.8)** | Instagram feed (taller, more screen) |
| **2.35:1 / 2.39:1** | Cinema widescreen (anamorphic) |
| **2:1 (2.0)** | Modern shows (Stranger Things etc.) |

Plan ratio at shoot time. Cropping 16:9 to 9:16 wastes ~70% of frame and rarely works. Shoot 4K 16:9 if you need both 16:9 + 1:1 outputs (1:1 crops from center).

## File size estimation

Rough formula: **resolution × fps × bitrate × duration**.

| Output | 30 sec file size |
| --- | --- |
| 1080p / 30fps / 5 Mbps | ~19 MB |
| 1080p / 30fps / 2 Mbps (web optimized) | ~7.5 MB |
| 4K / 30fps / 25 Mbps | ~94 MB |
| Vertical 1080 / 30fps / 3 Mbps | ~11 MB |

For autoplay marketing video: **target < 5MB for 5-15 second loops**. Above that, mobile users on cellular abandon.

## Captions and subtitles

### Why captions matter

- **Accessibility**: deaf / hard-of-hearing users.
- **Sound-off viewing**: 80%+ of social video viewed muted.
- **Non-native speakers**: Korean → English markets, etc.
- **SEO**: caption text indexed by search engines.
- **Watch-time**: captioned videos retain viewers longer.

### Format

| Format | Use |
| --- | --- |
| **SRT** (.srt) | Universal; simplest |
| **WebVTT** (.vtt) | Web video standard; supports styling |
| **TTML** | Broadcast / cinema |
| **Burned-in (open captions)** | Always-visible; can't disable |

For web video: **WebVTT** sidecar files; let the platform / `<track>` element load them.

For social video where captions need to be always-visible: burn them in at editing time (1-2 second visibility per phrase, styled to match brand).

### Caption styling

- **Position**: bottom center; avoid bottom 5% (cut off on some screens) — use bottom 10-15%.
- **Background**: semi-opaque dark band behind text.
- **Font**: sans-serif, condensed (more text fits per line).
- **Size**: 4-6% of video height (1080p video = 40-60px).
- **Line length**: ≤ 32 characters per line; ≤ 2 lines visible at once.
- **Duration**: 1-7 seconds per caption; align with speech.

### Korean captions

- **Hangul reads larger** at the same point size — slightly smaller font OK (3.5-5% of video height).
- **Line breaks**: break at natural phrase boundaries, not character count.
- **자막 vs 폐쇄자막** — 자막 is open / always visible; 폐쇄자막 is closed / toggleable.

### Auto-captioning

Tools:
- **YouTube** auto-captions: decent for English; OK for Korean; always review.
- **Whisper (OpenAI)** open-source; excellent quality including Korean.
- **Otter.ai / Rev / Descript**: paid services with auto + human review.
- **Capcut, Canva Video**: built-in for short-form / social.

Workflow: auto-generate → human review → export SRT / VTT → embed.

## Loop video for marketing

For autoplay landing-page hero loops:

| Spec | Target |
| --- | --- |
| Duration | 5-15 seconds, seamlessly looping |
| Resolution | 1080p source, often delivered at 720p |
| Bitrate | 1-3 Mbps |
| Audio | None (silent — autoplay browsers mute anyway) |
| Format | MP4 (H.264) + WebM (VP9) for fallback |
| Poster | Static frame for slow connections + reduced-motion |

Optimization:
- Use `ffmpeg -movflags +faststart` so video starts streaming before fully loaded.
- Compress aggressively — landing-page video doesn't need 4K.
- Provide `<video poster="...">` so something shows during load.

## Production format vs delivery format

Two stages:

### Production (master)

- 4K source if possible (gives crop / reframe headroom).
- ProRes 422 or H.264 high-bitrate (50+ Mbps) for editing.
- Lossless audio.
- Color graded but not yet compressed.

### Delivery

- Compressed to platform's spec.
- 1080p typically; 4K for premium.
- Compressed audio (AAC).

Don't deliver the master file (huge) and don't archive the delivery file (lossy). Keep both.

## Performance for web video

For HTML5 video:

```html
<video
  autoplay
  muted
  loop
  playsinline
  poster="hero-poster.jpg"
  preload="auto"
>
  <source src="hero.webm" type="video/webm" />
  <source src="hero.mp4" type="video/mp4" />
</video>
```

- `muted` is required for autoplay (browsers block audio on autoplay).
- `playsinline` for iOS (otherwise full-screen).
- `poster` for first paint / fallback.
- Multiple sources for browser-pick.
- `preload="auto"` for above-the-fold; `preload="metadata"` below.

For lazy-loaded below-the-fold video: use IntersectionObserver to delay `load()`.

For HLS streaming (longer videos, adaptive bitrate): use a player like Video.js, hls.js, or Shaka Player.

## Accessibility

- **Captions / subtitles** for any spoken content.
- **Audio descriptions** for any visual content critical to understanding (separate audio track describing what's on screen).
- **Transcripts** posted near the video (full text alternative).
- **Don't auto-play with sound** — disorienting.
- **Allow pause** on autoplay loops (control or click-to-pause).
- **Respect `prefers-reduced-motion`** — show poster / static image instead of looping video.

```css
@media (prefers-reduced-motion: reduce) {
  video.hero-loop {
    display: none;
  }
  video.hero-loop ~ .poster-fallback {
    display: block;
  }
}
```

## Don't

- Don't ship 4K hero loops for marketing — bandwidth waste on mobile.
- Don't auto-play with sound. Browsers block it; users hate it; accessibility issue.
- Don't skip captions. 80% of social video watched muted.
- Don't deliver MOV / ProRes for web — files are huge.
- Don't shoot vertical at the last minute by cropping landscape — composition suffers.
- Don't mix framerates within a video.
- Don't ignore audio. Bad audio kills retention faster than bad video.
- Don't ship video without a poster image — users see blank space during load.

## Cross-reference

- [`knowledge/video/marketing-video.md`](marketing-video.md) — landing-page / hero / brand video
- [`knowledge/video/social-and-short-form.md`](social-and-short-form.md) — TikTok / Reels / Shorts
- [`knowledge/video/in-product-video.md`](in-product-video.md) — onboarding / help / explainer
- [`knowledge/video/korean-video-conventions.md`](korean-video-conventions.md) — KR-specific
- [`knowledge/motion/motion-tools.md`](../motion/motion-tools.md) — Lottie alternative for shorter motion
- [`knowledge/a11y/contrast.md`](../a11y/contrast.md) — caption contrast rules
