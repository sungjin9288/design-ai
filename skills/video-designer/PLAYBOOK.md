# video-designer — playbook

Design and spec video for marketing, social, or in-product use. Output is a production-ready video spec a producer / videographer / editor can deliver against.

## When to use

- "Design the hero video for our landing page."
- "Spec a 60-second product demo."
- "Plan a YouTube Shorts campaign."
- "What captions / formats do we need?"
- "Spec the onboarding video for our app."

## Inputs (ask if missing)

1. **Surface** — landing-page hero / brand film / product demo / onboarding / help video / short-form social / ad spot.
2. **Platform** — YouTube / Reels / Shorts / TikTok / website / in-app / OOH.
3. **Length** — desired duration.
4. **Audience** — Korean / international / mixed; B2C / B2B; age range.
5. **Brand voice** — Toss-style / playful / formal / cinematic.
6. **Production budget** — DIY / indie / production-company / TVCM-tier.
7. **Audio strategy** — voiceover / music-only / silent autoplay.
8. **Existing assets** — existing footage, brand video, music library.

## Steps

### 1. Classify the video

| Type | Read |
| --- | --- |
| Hero loop, brand film, demo, ad | [`marketing-video.md`](../../knowledge/video/marketing-video.md) |
| Reels / Shorts / TikTok / vertical | [`social-and-short-form.md`](../../knowledge/video/social-and-short-form.md) |
| Onboarding, help, changelog | [`in-product-video.md`](../../knowledge/video/in-product-video.md) |
| Korean market specifics | [`korean-video-conventions.md`](../../knowledge/video/korean-video-conventions.md) |

Always also: [`video-fundamentals.md`](../../knowledge/video/video-fundamentals.md).

### 2. Spec the technical format

| Spec | Decide |
| --- | --- |
| Resolution | 1080p default; 4K master if reframing needed |
| Aspect ratio | 16:9 landscape / 9:16 vertical / 1:1 square |
| Framerate | 30fps default; 60fps for fast UI / sports |
| Codec | H.264 (compatibility) + H.265 / AV1 (size); WebM for web |
| Audio | AAC 128-256 kbps; -14 LUFS for online |
| Captions | WebVTT or burned-in (specify language tracks) |
| File size | Target by use: < 5MB hero loop, < 50MB demo |

### 3. Pick length

| Use | Length |
| --- | --- |
| Hero loop autoplay | 5-15s |
| Product demo | 30-90s |
| Brand film | 60-180s |
| Onboarding video | 30-90s |
| Help video | 30-120s |
| Reels / Shorts | 15-60s |
| TikTok | 15-60s (up to 3min, 10min) |
| YouTube long-form | varies |
| TVCM | 15s, 30s, 60s spots |

Cut to shortest that conveys the message. Default: **shorter than the obvious answer**.

### 4. Spec the script structure

For long-form (60+ seconds):
```
0:00-0:05  Hook (1-second-grade attention grab)
0:05-0:20  Problem (what users face)
0:20-0:50  Solution (your product / value)
0:50-end   CTA (try it, sign up, learn more)
```

For short-form (15-30s):
```
0:00-0:01  Hook (must stop scroll)
0:01-end   Single message / single demo
0:end-1s   CTA / brand mark
```

For hero loop (5-15s):
```
0:00       Calm starting frame
0:05       Peak action (the "wow" beat)
0:end      Settle to start frame (loop)
```

### 5. Captions / subtitles

| Use | Captions |
| --- | --- |
| Hero loop (silent autoplay) | None needed (no audio) |
| Brand film / demo | WebVTT, multi-language |
| Social short-form | Burned-in (open captions) — 80% watch muted |
| In-product | WebVTT toggle, default ON |
| Korean any platform | Korean subtitle always |

Style:
- Bottom 10-20% of frame.
- White text + black outline OR brand color.
- Sans-serif, condensed (Pretendard / NanumSquare for Korean).
- Max 2 lines, ≤ 32 chars per line.

### 6. Voiceover (if applicable)

| Choice | Use |
| --- | --- |
| Korean female gentle | Toss-style fintech, beauty |
| Korean female professional | B2B, education |
| Korean male warm | Premium consumer, automotive |
| English voiceover | International primary |
| AI voice (Clova, ElevenLabs) | Short-form, changelogs, low-stakes |
| Human voiceover | Brand-critical, ads, hero |

Honorific level (Korean):
- 합쇼체 (~합니다) for B2B, banking, formal.
- 해요체 (~해요) for B2C, lifestyle, fintech (default 2024+).

### 7. Music + sound

| Source | Use |
| --- | --- |
| Royalty-free libraries (Epidemic, Artlist, Musicbed) | Most B2B / B2C |
| Korean royalty-free (Audionetwork KR, Pond5 KR) | KR market |
| Platform-native trending sound | Reels / TikTok algorithm boost |
| Custom composition | Brand-defining campaigns |
| K-pop tracks | Avoid — copyright |

Mix loudness to **-14 LUFS** for online platforms.

### 8. Korean ad disclosure (if branded)

For sponsored / paid promotion:
- YouTube: tag "Includes paid promotion" + verbal disclosure.
- Instagram / TikTok: `#광고`, `#유료광고`, `#PR` in caption.
- Public-facing ads: 표시광고법 compliance.

For health / cosmetic / financial products: KFDA / FSC pre-approval of claims.

### 9. Performance + delivery

For web:
- Provide multiple formats (WebM + MP4 H.265 + MP4 H.264).
- Include poster for first paint.
- `preload="auto"` for hero, `preload="metadata"` below the fold.
- Use `<source media="...">` for art-direction (mobile vs desktop video).

For platform delivery:
- YouTube: 1080p+ at high bitrate; YouTube re-encodes.
- Reels / Shorts / TikTok: 1080×1920 vertical at platform spec.
- In-product: HLS adaptive bitrate for longer videos.

### 10. Output

Use this structure:

```markdown
# Video spec: <title>

> Surface: <hero loop / brand film / demo / shorts / etc>
> Platform: <YouTube / Reels / website / in-app>
> Audience: <KR / international>
> Brand voice: <...>
> Length: <duration>

## Technical specs
| Spec | Value |
... resolution, fps, codec, audio, captions

## Script / structure
<beat-by-beat outline>

## Captions
<language tracks, style, file format>

## Voiceover
<voice, language, honorific level>

## Music
<library / track, loudness>

## Korean compliance (if applicable)
<ad disclosure, KFDA, KFTC>

## File delivery
<formats, bitrates, file naming>

## Performance budget
<file size, LCP impact>

## Accessibility
<captions, transcripts, audio descriptions>

## Don't
<2-3 specific misuses>
```

## Source files this skill reads

- [`knowledge/video/video-fundamentals.md`](../../knowledge/video/video-fundamentals.md)
- [`knowledge/video/marketing-video.md`](../../knowledge/video/marketing-video.md)
- [`knowledge/video/social-and-short-form.md`](../../knowledge/video/social-and-short-form.md)
- [`knowledge/video/in-product-video.md`](../../knowledge/video/in-product-video.md)
- [`knowledge/video/korean-video-conventions.md`](../../knowledge/video/korean-video-conventions.md)
- [`knowledge/motion/motion-tools.md`](../../knowledge/motion/motion-tools.md) — when motion < video
- [`knowledge/i18n/korean-document-style.md`](../../knowledge/i18n/korean-document-style.md) — honorific level
- [`examples/component-video-player.md`](../../examples/component-video-player.md) — player spec
- [`examples/component-video-hero.md`](../../examples/component-video-hero.md) — autoplay hero spec

## Verification phase (run before declaring done)

- [ ] Is the surface category explicit (hero loop / demo / shorts / onboarding / etc)?
- [ ] Is the technical spec (resolution / fps / codec / aspect ratio) explicit?
- [ ] Is length within range for the surface?
- [ ] Is the script structure (hook / body / CTA) explicit?
- [ ] Are captions specified (language tracks + format)?
- [ ] If voiceover: is the language + tone + honorific level explicit?
- [ ] Is loudness target (-14 LUFS for online) specified?
- [ ] Are platform-specific constraints (Reels safe area, YouTube spec) addressed?
- [ ] If Korean B2C: is ad disclosure + KFDA where applicable addressed?
- [ ] Is file delivery format (multi-codec, poster, HLS) specified?
- [ ] Is performance budget (file size, LCP impact) stated?
- [ ] Is reduced-motion / slow-connection fallback specified for autoplay?
- [ ] Does "Don't" section catch 2-3 specific misuses?

## Done when

- One markdown spec, < 400 lines.
- Surface, platform, audience, length explicit.
- Technical specs (resolution, fps, codec, audio, captions).
- Script structure.
- Captions language + format.
- Voiceover details if applicable.
- Music source + loudness.
- Korean compliance if applicable.
- File delivery format.
- Performance + accessibility addressed.
- "Don't" section.
- Verification passes.
