---
description: Spec video for marketing, social, or in-product use. Picks length, format, aspect ratio, codec, captions, voiceover. Korean conventions and ad disclosure included.
---

You will produce a video spec for the surface described in `$ARGUMENTS`.

## Input

Parse `$ARGUMENTS`. Expect:
- A surface (e.g., "landing-page hero loop", "product demo", "Reels campaign", "onboarding video", "TVCM 30s spot").
- Optionally: platform, length, audience (Korean / international), brand voice, budget.

If ambiguous, ask one clarifying question — but only one. Otherwise apply reasonable defaults and proceed.

## Steps

1. **Classify the video** into one of: hero loop / brand film / product demo / onboarding / help / short-form / ad spot. The category determines rules.

2. **Apply the [video-designer playbook](../skills/video-designer/PLAYBOOK.md)**:
   - Spec technical format (resolution, fps, codec, audio, aspect).
   - Pick length per surface category.
   - Outline script structure (hook / body / CTA).
   - Spec captions (language tracks + style + format).
   - Spec voiceover if applicable (language, tone, honorific level).
   - Spec music (source + loudness).
   - Apply Korean ad disclosure + KFDA compliance if applicable.
   - File delivery format (multi-codec, poster, HLS for streaming).

3. **Output** using the structure in PLAYBOOK.md step 10.

## Done when

- Surface, platform, audience, length explicit.
- Technical specs (resolution, fps, codec, audio, captions) stated.
- Script structure with timing.
- Captions language + format specified.
- Voiceover or audio strategy explicit.
- Korean compliance (ad disclosure, KFDA) addressed if applicable.
- File delivery format (poster, multi-codec, performance) specified.
- Reduced-motion / slow-connection fallback for autoplay.
- "Don't" section catches 2-3 misuses.
- Verification phase from PLAYBOOK.md passes.
