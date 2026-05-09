<!-- hand-written -->
---
title: In-product video (onboarding, help, explainers)
applies_to: [video, in-product, onboarding, help]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# In-product video

Video inside the product itself: onboarding tutorials, help videos, feature explainers, embedded demos. Different rules from marketing video — these viewers already chose your product; they want help, not seduction.

Read [`video-fundamentals.md`](video-fundamentals.md) first.

## Three categories

### 1. Onboarding video (first-run)

Shown to new users during signup or first session.

| Spec | Target |
| --- | --- |
| Length | 30-90 seconds |
| Format | 16:9 desktop / 9:16 mobile |
| Click | Skippable; optional |
| Audio | Optional (often muted with captions) |
| Goal | Get user to first value moment |

Structure:
```
0:00-0:05  Welcome (warm; 2-3 word headline)
0:05-0:30  What this product does (1-2 sentences max in caption)
0:30-0:60  How to do the first thing (specific action)
0:60-0:90  What's next (CTA: try it)
```

Don't over-explain. Onboarding video is supplemental; the actual product walkthrough does the teaching.

### 2. Help video (in-context)

Shown when user is stuck or asks for help. Embedded in help articles, settings pages, error states.

| Spec | Target |
| --- | --- |
| Length | 30-120 seconds (focused on one task) |
| Format | 16:9 mostly; 9:16 for mobile-only flows |
| Click | Always playable; controls visible |
| Audio | Voiceover preferred; captions mandatory |
| Goal | User completes the task they're stuck on |

Structure:
```
0:00-0:05  What this video shows
0:05-end   Task steps in order, each with brief voiceover
0:end      "Try it now" or close
```

Pace: brisk for power users; deliberate for beginners. Can produce 2 versions.

### 3. Feature explainer / changelog video

Promotes a new feature or update. Lives in product changelog, release notes, in-app announcements.

| Spec | Target |
| --- | --- |
| Length | 15-60 seconds |
| Format | 16:9 |
| Click | Click-to-play; auto-play loop variant for hero |
| Audio | Optional |
| Goal | User understands new capability + tries it |

Structure:
```
0:00-0:05  What's new (feature name + benefit)
0:05-0:30  How it works (short demo)
0:30-end   CTA (try it, learn more)
```

## Production approach

### Screen recording vs filmed

Most in-product video is **screen-recorded** (capturing actual UI):
- **Tools**: Loom, ScreenFlow, OBS, Riverside, CleanShot X.
- **Pros**: cheap, fast, accurate.
- **Cons**: Less polished; cursor / UI quirks visible.

Some is **filmed** (actor + product on phone / laptop):
- **Tools**: full production setup.
- **Pros**: more emotional, brand-feeling.
- **Cons**: expensive, dates fast (UI changes → reshoot).

**Hybrid**: filmed cutaways + screen-recorded core. Best of both.

### Screen recording tips

- **Resolution**: record at 2× display resolution; deliver at 1×.
- **Cursor**: highlight (yellow circle, color trail) — visible at small sizes.
- **Click feedback**: animate cursor click (Loom does this automatically).
- **Zoom on detail**: zoom into the relevant UI region; don't show whole screen at small video size.
- **Hide irrelevant UI**: minimize taskbar, hide dock, clean desktop.
- **Realistic data**: use representative names, not "Test User #1".
- **Korean data**: use Korean names / addresses for KR audiences (don't show "John Doe" in a Korean app).

### Voiceover for in-product video

- **Korean primary** for KR audience.
- **Pace**: slightly slower than marketing — viewers are following along.
- **Tone**: helpful, neutral; not salesy.
- **Female / male voice**: pick one and consistent across the product video library.

For AI voice: ElevenLabs / 클로바보이스 produce decent Korean output. Always review for pronunciation of brand / product names.

### No-voice variant

Some in-product video has no voice — just visual + on-screen text.

| Pros | Cons |
| --- | --- |
| Faster production (no recording) | Limited information density |
| Localizable easily (text only) | Can feel sterile |
| Plays in muted contexts | Requires clear visual direction |

For multi-region products: text-only might be better than recording 5 language voiceovers.

## Embedded video player UX

When video is embedded in product UI:

```
┌──────────────────────────────────────┐
│  [Video thumbnail or first frame]    │
│                                      │
│        ▶ Play                        │
│                                      │
│  Duration: 0:45    [CC] [Speed]      │
└──────────────────────────────────────┘
```

Controls users expect:
- **Play / pause**.
- **Progress bar** (seekable).
- **Volume** (or muted-by-default toggle).
- **Captions toggle** (default ON for product video).
- **Speed control** (1x, 1.25x, 1.5x, 2x — power users skim).
- **Fullscreen**.
- **Close / dismiss** (if modal-embedded).

For minimal UX: at least play/pause + caption toggle.

See [`examples/component-video-player.md`](../../examples/component-video-player.md) for spec.

## Lazy-loading video in-product

In-product videos shouldn't slow down the app:

```tsx
// Show poster only; load video on click or on visibility
<HelpVideoEmbed
  poster="/help-videos/onboarding-poster.jpg"
  src="/help-videos/onboarding.mp4"
  loadOn="click"   // or "visible" via IntersectionObserver
/>
```

For modal-embedded videos: lazy-load when modal opens, not when product mounts.

## Captions for in-product video

**Captions mandatory** for any in-product video with speech. Reasons:

- Accessibility (deaf / hard-of-hearing users).
- Sound-off viewing (open offices, public, late night).
- Non-native speakers (Korean → English content).
- Indexing (caption text searchable).

Default: captions ON for product video. User can toggle off if preferred (remember preference).

## Variable speed for power users

Allow 1x, 1.25x, 1.5x, 2x. Power users skim help videos at 1.5-2x. Don't force them to wait.

## Localization

For multi-region products:

- **English original** + Korean / Japanese / etc. caption tracks.
- OR **separate videos per language** (different voiceover, captions).
- OR **no-voice + localized text overlay** (cheapest scaling).

Choose based on:
- Audience size per region.
- Voice / brand consistency requirements.
- Budget.

## Korean in-product video

- **자막 ON by default**.
- **Korean voiceover** for KR audience.
- **Reach pace**: slightly slower than marketing video.
- **Brand voice**: 해요체 (~해요) for friendly products; 합쇼체 for B2B / financial.
- **Korean data in screen recordings** (Korean names, KRW currency).

For Korean fintech in-product video: 해요체, female voice (Toss-style), captioned, brand-color CTA at end.

## Updating videos when product changes

In-product videos date fast. UI changes → video shows old UI → confused user.

Strategies:
- **Stylized animation** (After Effects mockup) instead of screen recording — doesn't date with UI changes.
- **Periodic refresh schedule** (every 6 months: review + reshoot).
- **Versioned URLs** so old videos can be archived without breaking links.
- **Track which UI flows are video-documented** so you know what to update.

For SaaS with rapid UI iteration: animation-based explainer videos > screen recordings.

## Performance considerations

- **Compress aggressively** — in-product video doesn't need 4K.
- **Provide poster** — first paint shows poster, video loads behind.
- **HLS / adaptive bitrate** for longer videos (5+ minutes) — players adjust quality based on connection.
- **CDN delivery** — Cloudflare, Fastly, AWS CloudFront, or platform native (YouTube embed for some cases).

## Accessibility

- **Captions**: required.
- **Transcripts**: post the full transcript for help articles (text-searchable, screen-reader-friendly).
- **Audio descriptions**: for video where critical info is visual-only.
- **Don't auto-play with sound**: users with sensitive ears, in shared spaces, abandon.
- **Keyboard controls**: spacebar to play/pause; M to mute; arrows to seek.
- **Pause control**: for any auto-play.

## Common in-product video mistakes

- **Too long** — users skip.
- **Outdated UI** in screen recording — confused users.
- **No captions** — accessibility fail + 80% miss the message.
- **Auto-play with sound** — disorienting; abandoned.
- **Video where text would do** — reading is faster for many tasks.
- **Salesy tone** — these are existing users, not prospects.
- **Generic stock footage** — feels off-brand for a help video.

## When NOT to use video

| Situation | Better alternative |
| --- | --- |
| Linear text task ("how to delete") | Text + screenshot |
| Search / scan-friendly content | Text article (skimmable) |
| Multi-step process where users go at their own pace | Annotated screenshots |
| Reference (looked up later) | Text + animated GIF |
| Common error explanation | Inline help in UI |

Use video when:
- Spatial / motion is hard to describe in text (drag-and-drop, gesture).
- Emotional moment (welcome, celebration).
- Walkthrough where seeing > reading.

## Don't

- Don't ship a 5-minute onboarding video. Cut to 60 seconds.
- Don't skip captions. Mandatory.
- Don't auto-play with sound.
- Don't show outdated UI in screen recording. Update when product updates.
- Don't use video for everything. Text + screenshots are often better.
- Don't put video in time-critical flows (checkout, payment) — slows users.
- Don't lock features behind "watch the video first" — let users skip.

## Cross-reference

- [`knowledge/video/video-fundamentals.md`](video-fundamentals.md) — encoding, captions
- [`knowledge/video/marketing-video.md`](marketing-video.md) — marketing-side
- [`knowledge/video/social-and-short-form.md`](social-and-short-form.md) — short-form
- [`knowledge/video/korean-video-conventions.md`](korean-video-conventions.md) — KR
- [`knowledge/patterns/technical-writing.md`](../patterns/technical-writing.md) — when text is better
- [`examples/component-video-player.md`](../../examples/component-video-player.md) — player component
