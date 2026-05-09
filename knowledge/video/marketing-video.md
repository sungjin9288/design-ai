<!-- hand-written -->
---
title: Marketing video (landing-page hero, brand films, product demos)
applies_to: [video, marketing, landing, brand]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Marketing video

Video on marketing surfaces does one of three things:

1. **Stop the scroll** (hero loop, autoplay).
2. **Tell the story** (brand film, founder video, customer testimonial).
3. **Show the product** (demo, walkthrough, feature highlight).

Each has different rules.

Read [`video-fundamentals.md`](video-fundamentals.md) first.

## Three categories

### 1. Hero loop (above-the-fold)

Short autoplay loop on landing page hero. The video IS the visual — no separate hero image needed.

| Spec | Target |
| --- | --- |
| Duration | 5-15 seconds, seamless loop |
| Resolution | 1080p (often 720p delivered) |
| Aspect | 16:9 desktop / 4:5 or 9:16 mobile |
| File size | < 5MB |
| Audio | None (autoplay = muted) |
| Captions | None (no audio) |
| Reduced motion | Show static poster |

Use for:
- Product with motion (Linear's keyboard demo, Cron's calendar).
- Atmospheric brand setting (lifestyle imagery).
- Process / "money flowing" shot (Toss-style).

Don't use for:
- Static products (form builder, CMS).
- Mobile-primary audiences in low-bandwidth regions.

### 2. Brand film / story video (1-3 minutes)

A longer, narrative video. Click-to-play (not autoplay). Lives on a section of the landing page or "About" page.

| Spec | Target |
| --- | --- |
| Duration | 60-180 seconds |
| Resolution | 1080p / 4K |
| Aspect | 16:9 |
| Audio | Yes; mixed properly (-14 LUFS) |
| Captions | Mandatory |
| Music | Brand-aligned; licensed |
| Voiceover | Often founder / customer |

Structure:
```
0:00-0:05  Hook (visual or question)
0:05-0:30  Problem (what users face today)
0:30-1:00  Solution (your product, in real use)
1:00-2:00  Story (founder, customer, vision)
2:00-2:30  Proof (numbers, logos, testimonials)
2:30-3:00  CTA (try it, watch demo, contact)
```

For most B2B SaaS: a 90-second brand film outperforms a 3-minute one. Short attention span; respect it.

### 3. Product demo / walkthrough (30-90 seconds)

Shows the product working. Often screen-captured + voiceover.

| Spec | Target |
| --- | --- |
| Duration | 30-90 seconds (longer for complex products) |
| Resolution | 1080p (60fps for smooth UI) |
| Audio | Voiceover + ambient music low |
| Captions | Mandatory |
| Pace | Brisk; cut every 3-5 seconds |
| Cursor | Highlighted (custom cursor or zoom on click) |

Structure:
```
0:00-0:05  What problem this solves
0:05-0:15  Step 1 (open product, basic action)
0:15-0:35  Step 2-3 (core feature)
0:35-0:50  Result / outcome
0:50-1:00  CTA (try free, sign up)
```

Pace matters. Slow demos feel unproductive. Cut aggressively; dwell only on results.

## Production budget tiers

### Tier 1: DIY (budget < 500,000 KRW)

- Phone or webcam shoot.
- Software like Capcut, DaVinci Resolve free, Final Cut.
- Royalty-free music (Epidemic Sound, Artlist, Musicbed).
- Auto-caption + manual review.

Realistic output: 30-60 second product demo, decent for landing pages.

### Tier 2: Indie production (5-20M KRW)

- Hired videographer + editor (1-2 people, 1-3 days).
- Better cameras (Sony A7, Canon R-series).
- Licensed music.
- Color grading.
- Captions + light motion graphics.

Realistic output: brand film 60-120s + 2-3 product demos.

### Tier 3: Production company (20-100M+ KRW)

- Full crew (director, DP, sound, makeup, gaffer).
- Professional cameras (Arri, RED).
- Talent / actors.
- Studio + locations.
- Music composition.
- Full post (color, sound mix, motion graphics).

Realistic output: brand film with cinematic quality, multi-spot ad campaign.

## Korean marketing video conventions

Korean B2C / fintech video trends:

- **Toss-style**: clean product shots + Korean voiceover (gentle female voice common), warm color grade, slow pan / push, minimal cuts.
- **Kakao-style**: mascot integration, playful, brighter colors, faster cuts.
- **Coupang-style**: rapid product cuts, emphasis on speed (rocket motion), urgency.
- **Naver-style**: dense info, multiple use cases shown, often a product walkthrough.

Korean B2B video:
- More formal voiceover (해요체 or 합쇼체).
- Often subtitled (자막) for in-meeting playback.
- Numbers / testimonials prominent (사용 기업 N개 등).

For Korean market:
- **Voiceover language**: Korean primary; English subtitles for international.
- **Music**: Korean-pop / instrumental Korean / royalty-free; avoid Western pop with copyright issues.
- **Pacing**: slightly faster cuts than Western (Korean video tradition).
- **Captions**: Korean 자막 always (even if voice is Korean) — common for accessibility + sound-off.

## Hero loop production tips

```
0:00 — start state (calm)
0:05 — peak action (the "wow" beat)
0:10 — settle back to start state (loops cleanly)
```

Match exit frame to entry frame for invisible loop.

### Filming for hero loops

- **Steady framing** — handheld looks amateur on autoplay.
- **Subtle motion** > dramatic — viewers see this many times.
- **No talking heads** — no audio means no lip-sync needed.
- **Brand color anchored** — if brand is teal, dominant frame color is teal.
- **No visible text in video** — overlay text in HTML / CSS instead (responsive, localized).

### Vertical version

For mobile landing page: shoot 9:16 OR shoot 4K 16:9 and crop to 9:16.

If cropping: plan composition with 9:16 safe zone marked at shoot. Subject must work in vertical crop.

## Video on landing pages — placement

| Section | Video type |
| --- | --- |
| **Hero** | 5-15s autoplay loop OR 60-90s click-to-play brand film with thumbnail |
| **How it works** | 30-60s product demo |
| **Customer stories** | 60-120s testimonial video |
| **Features** | Per-feature 15-30s demo loops |
| **CTA / closing** | Optional brand film replay |

Don't put video in every section — fatigue.

## Video accessibility

- **Captions**: required for any video with speech / dialogue.
- **Transcripts**: post the full transcript on the page (or behind a "Show transcript" toggle).
- **Audio descriptions**: required for videos where critical info is visual-only (e.g., "the cursor moves to the gear icon" — sighted viewers see this; screen readers don't).
- **Pause control**: for autoplay loops, provide a way to pause (button or click-to-pause).
- **Don't auto-play with sound**: browsers block; users hate.
- **Reduced motion**: hide autoplay loops; show static poster instead.

## Performance budget

| Metric | Target |
| --- | --- |
| Hero loop (above-fold) | < 3MB; < 1.5s LCP impact |
| Click-to-play brand film | Lazy-load; only fetched when clicked |
| Product demo | Lazy-load below the fold |
| All videos combined per page | < 10MB total |

For LCP-critical hero: provide poster image as primary `<img>` and load video asynchronously after first paint.

## File delivery for marketing video

Provide multiple formats:

```html
<video autoplay muted loop playsinline poster="hero.jpg">
  <source src="hero.webm" type="video/webm" />
  <source src="hero-h265.mp4" type='video/mp4; codecs="hev1.1.6.L93.B0"' />
  <source src="hero-h264.mp4" type="video/mp4" />
</video>
```

Browser picks the first one it supports. WebM (AV1 / VP9) → H.265 → H.264.

For product demos with audio: include caption track:

```html
<video controls poster="demo.jpg">
  <source src="demo.mp4" type="video/mp4" />
  <track kind="captions" src="demo-ko.vtt" srclang="ko" label="한국어" default />
  <track kind="captions" src="demo-en.vtt" srclang="en" label="English" />
</video>
```

## Common marketing video mistakes

- **Too long**. Cut 30%, then cut 30% more.
- **Audio is afterthought**. Bad audio = abandon at 5 seconds.
- **Cinematic shots of irrelevant things**. The product matters; sunset b-roll doesn't.
- **No captions**. 80% watch muted.
- **Wrong aspect for platform**. Vertical for TikTok / Reels; landscape for YouTube.
- **Auto-play with sound**. Browsers block; if it played, users hate.
- **Slow product demos**. Show the result; cut the typing.
- **Talking head only**. Visual variety required (b-roll, screen, product).

## Don't

- Don't make a 4-minute brand film. Cut to 90 seconds.
- Don't shoot 4K hero loops if the delivery is 720p. Wasted time + storage.
- Don't skip color grading. Raw footage looks amateur.
- Don't use unlicensed music. Copyright strikes are real.
- Don't auto-play with sound on. Hostile to users.
- Don't forget mobile. Most marketing video is consumed on phones.
- Don't ship without captions.
- Don't put text inside the video frame — overlay in HTML for responsive / localizable.

## Cross-reference

- [`knowledge/video/video-fundamentals.md`](video-fundamentals.md) — codecs, resolution, captions
- [`knowledge/video/social-and-short-form.md`](social-and-short-form.md) — TikTok / Reels / Shorts
- [`knowledge/video/in-product-video.md`](in-product-video.md) — onboarding / help
- [`knowledge/video/korean-video-conventions.md`](korean-video-conventions.md) — KR-specific
- [`knowledge/patterns/landing-hero-design.md`](../patterns/landing-hero-design.md) — hero strategy
- [`knowledge/motion/marketing-motion.md`](../motion/marketing-motion.md) — motion vs video
