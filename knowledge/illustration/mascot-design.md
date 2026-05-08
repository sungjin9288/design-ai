<!-- hand-written -->
---
title: Mascot design (characters and brand creatures)
applies_to: [mascot, character, brand, korean]
---

# Mascot design

A mascot is a recurring character that **embodies the brand**. Done right (Kakao Friends, Duolingo's owl, Mailchimp's Freddie, Mint's piggy), the mascot becomes more recognizable than the wordmark.

Done wrong, mascots feel childish, off-brand, or worse — distracting.

This file covers when mascots fit, how to design them, and how to maintain them across surfaces.

## When mascots fit

| Brand context | Mascot fit |
| --- | --- |
| Consumer fintech (Toss, Kakao) | Strong fit |
| Consumer wellness / education | Strong fit |
| Children's apps | Strong fit (almost required) |
| Fun / casual SaaS (Mailchimp, Slack-adjacent) | Good fit |
| Enterprise B2B | Risky — usually feels off-brand |
| Healthcare / financial services (B2B) | Bad fit — unprofessional |
| Government / civic | Bad fit |
| Luxury / premium consumer | Bad fit |

The mascot must match brand voice. Toss's gentle "money characters" wouldn't work for Linear; Linear's geometric severity wouldn't work for Toss.

## What makes a good mascot

### 1. Distinctive silhouette

You should recognize the mascot from a black silhouette alone. Test:
- Print the mascot in solid black at 24px.
- Show it to someone unfamiliar.
- They should be able to say "that's a [thing]."

If they can't — silhouette isn't strong enough.

### 2. Simple geometry

Mascots that scale to icon size and stay recognizable:
- 5-10 primary shapes
- 1-2 distinctive features (Duolingo owl: round body + green; Mint: piggy + green; Kakao Ryan: round + ear-less + impassive face)
- Avoid: thin lines that disappear at small sizes; complex patterns that pixelate

### 3. Consistent personality

Mascots have a personality that comes through across poses:
- Duolingo owl: cheerful but passive-aggressive (especially recent versions)
- Kakao Ryan: stoic, expressionless, reactive
- Mint piggy: friendly, neutral
- Toss money: gentle, calm

Define personality in 3-5 adjectives before the mascot is drawn. Otherwise, illustrators / animators interpret differently.

### 4. Adaptable to expressions

The mascot needs to express:
- Happiness / success
- Sadness / disappointment
- Surprise / excitement
- Concern / warning
- Neutral / waiting

Without each of these, the mascot can't appear in all the contexts a UI needs.

### 5. Scalable across formats

The mascot must work as:
- 24-48px icon (app icon, tiny inline)
- 100-200px spot illustration (empty / success / error states)
- 400-1200px hero illustration
- Animated (Lottie / Rive)
- 3D / printed / sticker (merchandise)

Test all sizes in the design phase.

## Korean mascot economy

Korea has a well-developed mascot culture:

| Brand | Mascot | Style |
| --- | --- | --- |
| **Kakao** | Kakao Friends (라이언/어피치/무지/콘/네오/제이지/튜브/프로도) | Round, soft, expressive |
| **Toss** | Money characters / generic round friends | Soft, calm, minimal |
| **Naver** | NaverPay characters, LINE Friends | Range — minimal to playful |
| **GS25** | 무무씨 | Friendly, retail-coded |
| **Coupang** | Rocket / Pang | Energy, speed |
| **TmoneyGO** | T-money character | Transit-coded |
| **Pang Pang** (KEB Hana) | Bear character | Bank-warmth |

Common traits in Korean mascots:
- Round, plump silhouette (cute / 귀여움 / kawaii-adjacent)
- Few facial features (Kakao Ryan style — no mouth)
- Minimal expression range (subtlety > exaggeration)
- Coordinated with brand color (Kakao yellow, Naver green)

Korean B2C without a mascot reads as either premium-minimal (Toss-tier) or under-branded.

## Designing a mascot

### Brief

Before drawing:
1. **What is it?** (animal, abstract creature, object personified)
2. **Why this?** (relevance to brand — Mint = piggy bank; Duolingo = wise owl; Kakao Ryan = was originally a lion concept stripped of mane)
3. **Voice / personality** (3-5 adjectives)
4. **Required expressions** (joy, sad, surprise, neutral — which 5-7?)
5. **Required poses** (standing, waving, holding, falling, working — which 8-10?)
6. **Color** (1 primary, max 1 accent)
7. **Where will it appear?** (icon? hero? loading screen? animation?)

### Design phase

1. **20+ thumbnails** — sketches at 1cm size. Pick top 3.
2. **Refinement** — tighten silhouette. Test against silhouette test.
3. **Expression sheet** — same character, 5-7 expressions. Confirm consistency.
4. **Pose sheet** — same character, 8-10 poses.
5. **Style guide** — proportions, colors, line weight, off-limit modifications.

### Style guide must include

- **Construction grid** — proportions in head-units (head : body ratio).
- **Allowed views** (front, 3/4, side — all? just one?)
- **Forbidden modifications** (don't recolor, don't skew, don't add accessories without approval).
- **Minimum size** — below this, simplify or use icon variant instead.
- **Spacing rules** — clear space around mascot when adjacent to other elements.

## Animation considerations

Mascots are heavily animated. Key animations:

| Animation | Use |
| --- | --- |
| **Idle** (subtle breathing / blinking) | Loading screens, ambient |
| **Reaction** (success cheer, error sad) | Confirmation moments |
| **Walk / move** | Onboarding, transitions |
| **Talk / mouth movement** | Voice / chat moments |

For animation: use Lottie or Rive (see [`motion/motion-tools.md`](../motion/motion-tools.md)). Designer creates in After Effects (Lottie) or rive.app (Rive); engineer drops in.

Reduced-motion: show static frame (hero pose). Don't auto-loop on every screen — battery drain.

## Mascot governance

Mascots drift faster than other system elements. Without governance:
- Different illustrators draw the mascot slightly differently.
- Marketing redraws for one campaign and the redraw enters the system.
- 18 months later, you have 3 versions of the mascot.

Required governance:
- **One owner** (illustrator or design lead).
- **Version-controlled source files** (Figma library, Adobe Illustrator masters in repo).
- **Mandatory review** for every new mascot illustration.
- **Asset library** — engineers can't ship a mascot illustration not in the library.
- **Refresh cadence** — every 18-24 months, full audit + retouch.

## Cultural sensitivity

Mascots represent the brand internationally if the brand goes global:

- **Animal symbolism varies**: owl (wise in West / unlucky in some Asian contexts); pig (lucky in China / negative in Muslim-majority markets); white tiger (revered in Korea).
- **Skin tone for human characters**: design with a range.
- **Gender**: avoid heavily gender-coded mascots if global.
- **Religious symbols**: avoid (crosses, lotus, etc.) unless intentional.

Korean brand entering global market: many Korean mascots translate well (Kakao Friends are popular in Asia / Southeast Asia), but Western markets may need positioning work.

## Mascot vs illustrator's brand

A common mistake: the mascot's style becomes the illustrator's style, and as soon as the illustrator leaves, the brand's mascot drifts.

Mitigation:
- Document the mascot completely (no implicit knowledge in one person's head).
- Treat the mascot as brand asset, not illustrator asset.
- Source files belong to the company, not the freelancer.

## When mascots become liabilities

Mascots can outlive their welcome:
- Mascot dates (1990s-style mascots aged badly into 2010s).
- Mascot misaligns with brand evolution (childish mascot when brand goes premium).
- Mascot becomes meme target (in unflattering ways).

Plan for mascot retirement / redesign every 5-10 years. Sudden retirement causes user backlash (Mailchimp's Freddie redesign, Twitter logo replacement); plan transitions.

## Don't

- Don't add a mascot just to have one. The brand must need it.
- Don't have multiple mascots that compete. Pick one primary; supporting cast is OK.
- Don't put the mascot in every screen — overuse kills the magic.
- Don't let the mascot drift across artists without governance.
- Don't use the mascot in serious / sensitive contexts (errors involving money loss, account security failures). Drop the mascot for these moments.
- Don't design the mascot before the brand voice is set.

## Cross-reference

- [`knowledge/illustration/illustration-systems.md`](illustration-systems.md) — system foundation
- [`knowledge/illustration/spot-illustrations.md`](spot-illustrations.md) — mascot in spot illustrations
- [`knowledge/illustration/hero-illustrations.md`](hero-illustrations.md) — mascot in heroes
- [`knowledge/patterns/brand-identity.md`](../patterns/brand-identity.md) — brand foundation
- [`knowledge/motion/motion-tools.md`](../motion/motion-tools.md) — animating mascots (Lottie / Rive)
- [`knowledge/i18n/korean-app-store-visual.md`](../i18n/korean-app-store-visual.md) — Korean market visual conventions
