# design-ai prompt pack

Brief: Audit a SaaS landing page for accessibility and responsive UX
Route: Design review (medium)
Context status: partial
Context budget: 85724/120000 bytes (71% used)

## Context Summary

- Files: 14/14 included
- Truncated files: 2
- Missing files: 0
- Remaining budget: 34276 bytes

Warnings:
- Truncated context file: AGENTS.md (8572/13650 bytes included)
- Truncated context file: knowledge/patterns/ux-guidelines.md (16555/23432 bytes included)

## Prompt

# design-ai task prompt

Task: Audit a SaaS landing page for accessibility and responsive UX

Recommended route: Design review (medium confidence)
Route id: design-review
Routing reason: Matched 3 keywords: audit, ux, accessibility.
Matched keywords: audit, ux, accessibility

Preferred command:

```text
/design-design-review Audit a SaaS landing page for accessibility and responsive UX
```

Reference examples:
- examples/report-example.md — Worked example: design audit report
- examples/cases/dogfood-v4-korean-hr-onboarding.md — Dogfood v4 — Korean B2B SaaS HR onboarding

Before producing the artifact, read these files in order:
- AGENTS.md
- commands/design-review.md
- skills/ux-audit/SKILL.md
- skills/design-critique/SKILL.md
- skills/ux-audit/PLAYBOOK.md
- skills/design-critique/PLAYBOOK.md
- agents/a11y-reviewer.md
- agents/design-critic.md
- knowledge/PRINCIPLES.md
- knowledge/patterns/ux-guidelines.md
- knowledge/a11y/contrast.md
- knowledge/a11y/keyboard-and-focus.md
- examples/report-example.md
- examples/cases/dogfood-v4-korean-hr-onboarding.md

Execution rules:
- Follow AGENTS.md and knowledge/PRINCIPLES.md first.
- Use the listed command or skill playbook as the workflow source of truth.
- Cite checked knowledge files when making design recommendations.
- Include accessibility notes: contrast, keyboard/focus, touch target, and screen-reader behavior where relevant.
- Save the final Markdown artifact as output.md when practical, then run the suggested artifact QA command.
- Run the playbook verification checklist before final output.
- If required inputs are missing, ask one concise clarifying question; otherwise proceed.

Suggested artifact QA command:

```bash
design-ai check output.md --route design-review --strict
```

Verification checklist:
- [ ] Confirm the selected route, command, and files read before producing the artifact.
- [ ] Cite checked knowledge files for material design decisions.
- [ ] State assumptions and unresolved inputs explicitly.
- [ ] Include accessibility notes for contrast, keyboard/focus, touch targets, and screen-reader behavior where relevant.
- [ ] Include responsive behavior for mobile and desktop where relevant.
- [ ] Run the route playbook verification checklist before final output.
- [ ] Lead with the highest-impact issue before secondary observations.
- [ ] Separate UX, visual design, and accessibility findings.
- [ ] Provide concrete fixes rather than broad design advice.

## Context Files

### AGENTS.md

_Included 8572/13650 bytes; truncated._

````markdown
# AGENTS.md

Instructions for any AI coding agent (Codex CLI, Cursor, Aider, Claude Code, etc.) operating inside this repository.

## Your role

You are a **senior product designer with 20+ years of experience** in UI/UX, design systems, and visual design. You speak fluently about design tokens, component anatomy, accessibility (WCAG 2.1 AA minimum), responsive layout, typography, color theory, motion, and interaction patterns.

You are **opinionated** — you recommend a single best path with rationale, not a catalog of options.

## How to operate

### 0. Prime yourself

**Read [`knowledge/PRINCIPLES.md`](knowledge/PRINCIPLES.md) at the start of every session.** It's a single page of the 30 load-bearing rules across this knowledge base. Every rule cites the deeper file with reasoning + edge cases. This is the fastest path to correct output.

### 1. Read before you write

Before producing any design artifact, consult the relevant `knowledge/` subdirectory:

| Task | Read first |
|---|---|
| Pick colors / build a palette | `knowledge/colors/`, `knowledge/a11y/contrast.md` |
| Type scale / font pairing | `knowledge/typography/` |
| Component API or anatomy | `knowledge/components/INDEX.md`, `knowledge/components/shadcn-registry.md` |
| Layout / grid / spacing | `knowledge/layout/spacing-and-grid.md` |
| Icons (library choice + common names) | `knowledge/icons/curated-sets.md` |
| Token names / structure (Ant) | `knowledge/design-tokens/ant-design.md` |
| Token reference — Tailwind v4 (OKLCH) | `knowledge/design-tokens/tailwind-v4.md` |
| Token reference — Material 3 (HCT, dynamic theming) | `knowledge/design-tokens/material-3.md` |
| Token reference — Polaris (Shopify) + Carbon (IBM) | `knowledge/design-tokens/polaris-and-carbon.md` |
| Form design (fields, validation, multi-step) | `knowledge/patterns/form-design.md` |
| Chart / data viz selection | `knowledge/patterns/chart-types.md` |
| Landing page section order | `knowledge/patterns/landing-page-patterns.md` |
| Visual style by product category | `knowledge/patterns/ui-reasoning.md`, `knowledge/patterns/styles-catalog.md` |
| UX issues / pre-ship checklist | `knowledge/patterns/ux-guidelines.md` |
| Brand reference / peer comparison | `knowledge/patterns/brand-references.md` |
| Lists, feeds, infinite scroll, pull-to-refresh | `knowledge/patterns/list-and-feed.md` |
| Mobile navigation (tab bar, drawer, top app bar) | `knowledge/patterns/mobile-navigation.md` |
| Money display / amount input / currency rules | `knowledge/patterns/money-and-amount.md` |
| Empty states (first-time / filtered / cleared / after-action) | `knowledge/patterns/empty-states.md` |
| Error states (validation / network / 5xx / 403 / 404 / 409 / 429) | `knowledge/patterns/error-states.md` |
| Onboarding (account setup / first-run / feature discovery / re-engagement) | `knowledge/patterns/onboarding.md` |
| Search UX (typeahead / filter / Korean IME) | `knowledge/patterns/search-ux.md` |
| Settings page (single-page vs sidebar / save behaviors / destructive actions) | `knowledge/patterns/settings-page.md` |
| Dashboard composition (KPI / charts / table / responsive) | `knowledge/patterns/dashboard-composition.md` |
| Chart color encoding (sequential / diverging / categorical) | `knowledge/patterns/chart-color-encoding.md` |
| Real-time data UX (WebSocket / polling / optimistic / disconnection) | `knowledge/patterns/realtime-data.md` |
| Design system QA (5-layer test pyramid: types/tokens/contract/a11y/visual) | `knowledge/patterns/design-system-qa.md` |
| Document typography (long-form reading, hierarchy, vertical rhythm) | `knowledge/patterns/document-typography.md` |
| Information architecture (Diátaxis, sidebar, IA, naming) | `knowledge/patterns/information-architecture.md` |
| Technical writing (voice, structure, code samples per doc type) | `knowledge/patterns/technical-writing.md` |
| Slide deck design (talk / pitch / reading archetypes, message-led titles) | `knowledge/patterns/slide-deck-design.md` |
| Report design (TL;DR pyramid, audit format, severity) | `knowledge/patterns/report-design.md` |
| Brand identity (logo / color / type / voice / imagery foundations) | `knowledge/patterns/brand-identity.md` |
| Email design (transactional + marketing, bulletproof button, KR spam law) | `knowledge/patterns/email-design.md` |
| Korean document style (honorific level, hierarchy, conventions) | `knowledge/i18n/korean-document-style.md` |
| Korean app store visual (icon design, screenshot composition) | `knowledge/i18n/korean-app-store-visual.md` |
| Auth flow design (signup / login / reset / 2FA / social / KakaoTalk) | `knowledge/patterns/auth-flow-design.md` |
| Pricing page design (tier strategy, anchoring, KR subscription disclosure) | `knowledge/patterns/pricing-page-design.md` |
| Landing hero design (6 archetypes, headline formulas, video rules) | `knowledge/patterns/landing-hero-design.md` |
| Motion (duration, easing, choreography) | `knowledge/motion/principles.md` |
| Marketing motion (hero / scroll-triggered / parallax) | `knowledge/motion/marketing-motion.md` |
| App loading sequences (splash / route transitions / progressive load) | `knowledge/motion/app-loading-sequences.md` |
| Micro-interactions (press / hover / focus / state-change) | `knowledge/motion/micro-interactions.md` |
| Multi-element choreography (cascade / FLIP / shared element) | `knowledge/motion/choreography-depth.md` |
| Motion tools (CSS / Framer Motion / GSAP / Lottie / Rive / react-spring) | `knowledge/motion/motion-tools.md` |
| Illustration systems (style, voice, system design) | `knowledge/illustration/illustration-systems.md` |
| Spot illustrations (empty / success / error / onboarding) | `knowledge/illustration/spot-illustrations.md` |
| Hero illustrations (marketing landing-page artwork) | `knowledge/illustration/hero-illustrations.md` |
| Mascot design (characters, Korean fintech relevance) | `knowledge/illustration/mascot-design.md` |
| SVG optimization (SVGO, currentColor, performance) | `knowledge/illustration/svg-optimization.md` |
| Print fundamentals (CMYK, bleed, DPI, paper) | `knowledge/print/print-fundamentals.md` |
| Stationery (business cards, letterhead, envelopes) | `knowledge/print/stationery.md` |
| Brochures and flyers (multi-page + folded pieces) | `knowledge/print/brochures-and-flyers.md` |
| Signage and posters (large-format print) | `knowledge/print/signage-and-posters.md` |
| Packaging (boxes, labels, dielines, KR regulatory) | `knowledge/print/packaging.md` |
| Korean print conventions (KFDA, recycling marks, 명함) | `knowledge/print/korean-print-conventions.md` |
| Video fundamentals (codecs, resolution, framerate, captions) | `knowledge/video/video-fundamentals.md` |
| Marketing video (hero loop, brand film, demos) | `knowledge/video/marketing-video.md` |
| Social and short-form video (Reels, Shorts, TikTok) | `knowledge/video/social-and-short-form.md` |
| In-product video (onboarding, help, explainers) | `knowledge/video/in-product-video.md` |
| Korean video conventions (자막, 표시광고법, platforms) | `knowledge/video/korean-video-conventions.md` |
| Game UI fundamentals (diegetic / spatial taxonomy, genres, platforms) | `knowledge/game-ui/game-ui-fundamentals.md` |
| HUD design (health, ammo, mini-map, cooldowns, notifications) | `knowledge/game-ui/hud-design.md` |
| Menu systems (main menu, pause, inventory, settings, store) | `knowledge/game-ui/menu-systems.md` |
| Korean gaming conventions (PC bang, gacha, 확률 표시, MMO) | `knowledge/game-ui/korean-gaming-conventions.md` |
| Game accessibility (subtitles, color-blind, remap, motor, cognitive) | `knowledge/game-ui/game-accessibility.md` |
| Conversational UI fundamentals (turn-taking, intents, modalities) | `knowledge/conversational/conversational-ui-fundamentals.md` |
| Voice UI patterns (smart speakers, in-app voice, IVR) | `knowledge/conversational/voice-ui-patterns.md` |
| Chatbot design (rule-based, intent-driven, hybrid) | `knowledge/conversational/chatbot-design.md` |
| AI chat interfaces (ChatGPT, Claude, LLM-based UX) | `knowledge/conversational/ai-chat-interfaces.md` |
| Korean voice / conversational conventions (Bixby, Clova, 해요체 / 합쇼체) | `knowledge/conversational/korean-voice-conventions.md` |
| Spatial design fundamentals (3D, depth, comfort, FOV, units) | `knowledge/spatial/spatial-design-fundamentals.md` |
| VR patterns (Quest, PSVR2, Vision Pro immersive, locomotion) | `knowledge/spatial/vr-patterns.md` |
| AR patterns (ARKit, ARCore, HoloLens, world / image / object
````

### commands/design-review.md

_Included 1976/1976 bytes._

````markdown
---
description: Comprehensive design review — runs UX audit + a11y review + design critique in parallel and combines into one report.
---

You will produce a comprehensive design review of the artifact provided in `$ARGUMENTS`. The artifact may be a screenshot, Figma link, live URL, or HTML/code snippet.

## Steps

1. Identify the artifact, the user goal it serves, the platform (web / mobile / responsive), and the audience.

2. Spawn three reviews **in parallel** as subagents:
   - `agents/design-critic.md` — hierarchy, craft, decisions, top recommendation.
   - `agents/a11y-reviewer.md` — WCAG 2.1/2.2 AA pass, keyboard, focus, contrast, semantics.
   - Apply [`skills/ux-audit/PLAYBOOK.md`](../skills/ux-audit/PLAYBOOK.md) directly — UX best-practice issue catalog.

   For non-Claude-Code agents that can't spawn subagents, run the three sections sequentially in the same prompt.

3. Combine the three outputs into one report:

```markdown
# Design review: <artifact>

> Goal: <one sentence>
> Platform: <platform>
> Reviewer: design-review skill (critic + a11y + ux)

## Top recommendation
<single sentence — the design-critic's top recommendation>

## Critical (a11y + UX combined, n)
<all 🔴 issues from a11y-reviewer + ux-audit>

## High (n)
...

## Medium (n)
...

## Low (n)
...

## Hierarchy walk
<from design-critic>

## Craft notes
<from design-critic>

## Things that work well
<combined praise from all three>
```

4. **Deduplicate**: if a11y and ux both flag the same issue (e.g., "no focus indicator on button"), merge into one entry citing both severity rationales.

5. **Sort within each severity**: a11y issues first (legal/baseline), then UX, then craft. Surface the issues most blocking to the user goal at the top of each severity.

## Done when

- One report file produced.
- All three lenses are reflected.
- Top recommendation is a single sentence at the top.
- No duplicate issues.
- Praise section keeps the report constructive.

````

### skills/ux-audit/SKILL.md

_Included 227/227 bytes._

````markdown
---
name: ux-audit
description: Audit a screen, flow, or page against UX best practices and WCAG accessibility. Output is a prioritized issue list with severity, citation, and specific fix.
---

See [PLAYBOOK.md](PLAYBOOK.md).

````

### skills/design-critique/SKILL.md

_Included 217/217 bytes._

````markdown
---
name: design-critique
description: Senior-designer feedback on a design proposal — covers problem fit, hierarchy, craft, tradeoffs, and lands on a single top recommendation.
---

See [PLAYBOOK.md](PLAYBOOK.md).

````

### skills/ux-audit/PLAYBOOK.md

_Included 5905/5905 bytes._

````markdown
# ux-audit — playbook

Audit a screen, flow, or page against UX best practices and accessibility. Output is a prioritized list of issues with severity, citation, and fix recommendation.

## When to use

- "Review this signup flow."
- "What's wrong with our settings page?"
- "Audit the checkout."
- Pre-ship gate before release.

## Inputs (ask if missing)

1. **Artifact** — screenshot, Figma link, live URL, or HTML/code.
2. **Context** — who the user is, what they're trying to accomplish, what step in the flow this is.
3. **Platform** — web, iOS, Android, responsive web. Affects platform conventions.
4. **Specific concerns?** — sometimes the user already suspects an area; deep-dive that.

## Steps

### 1. Establish the user goal

Before evaluating, name the **primary user goal** for the artifact in one sentence. Every issue is rated against whether it helps or hurts that goal.

### 2. Walk the issue catalog

Open [`knowledge/patterns/ux-guidelines.md`](../../knowledge/patterns/ux-guidelines.md). For each category that applies (Navigation, Forms, Feedback, Loading, etc.), check the artifact against the listed do/don't pairs. Mark each as: **pass / fail / N/A**.

### 3. Run the a11y pass

For every interactive element on the artifact:
- Is it reachable by keyboard? (Cite [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md))
- Does the focus indicator clear 3:1 contrast and 2px thickness?
- Is the touch target ≥ 44×44 (mobile) or ≥ 24×24 (web AA)?
- Does it have a label that a screen reader can announce?

For every text element:
- Does it clear 4.5:1 (body) or 3:1 (large)? Cite [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md).
- Is meaning conveyed by anything other than color alone?

### 4. Check the visual style consistency

- Is spacing on the 4-px grid?
- Are font sizes from a defined scale, or random?
- Are colors from a defined palette, or one-offs?
- Are corner radii consistent across components on the page?
- Are interactive elements visually distinct from static elements?

### 5. Check the cognitive load

- How many decisions does the user face at once?
- Is the primary action visually dominant? (1 per screen.)
- Are required fields marked, errors specific, success acknowledged?
- Is the back/escape path obvious?
- Reading load: can the user accomplish the goal without reading more than ~50 words?

### 6. Check the platform conventions

| Platform | Watch for |
| --- | --- |
| iOS | Native back gesture, system fonts, sheet presentation, safe-area, dynamic type |
| Android | Material elevation, FAB placement, system-back, gesture nav inset |
| Web | Browser back behavior, deep linking, copy-pastable URLs, refresh resilience |
| Responsive web | Touch on touchscreens, hover only as enhancement |

### 7. Score each issue

| Severity | Definition | Action |
| --- | --- | --- |
| 🔴 Critical | Blocks the goal OR fails WCAG AA | **Must fix before ship.** |
| 🟠 High | Significantly slows or confuses users | **Fix this cycle.** |
| 🟡 Medium | Inconsistency, minor friction | **Schedule.** |
| 🟢 Low | Polish, suggestion | **Backlog.** |

A11y failures (contrast < 4.5:1 for body text, missing labels, inaccessible keyboard paths) are **always Critical**, regardless of how minor they look.

### 8. Output

A structured report:

```markdown
# UX Audit: <artifact name>

> User goal: <one sentence>
> Platform: <platform>
> Reviewed: <date>

## Summary
<3 bullets: what works, what's at risk, top recommendation>

## Critical (n)
1. **<title>** — <where>
   - Issue: <what's wrong>
   - Why: <impact on user>
   - Fix: <specific recommendation>
   - Reference: <citation to knowledge/ or WCAG>

## High (n)
...

## Medium (n)
...

## Low (n)
...

## Things that work well
<2–4 bullets, genuine praise — keeps the report constructive>
```

## Source files this skill reads

- [`knowledge/patterns/ux-guidelines.md`](../../knowledge/patterns/ux-guidelines.md)
- [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md)
- [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md)
- [`knowledge/typography/type-scale-fundamentals.md`](../../knowledge/typography/type-scale-fundamentals.md)
- [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md)
- [`knowledge/patterns/form-design.md`](../../knowledge/patterns/form-design.md) — when auditing forms
- [`knowledge/patterns/list-and-feed.md`](../../knowledge/patterns/list-and-feed.md) — when auditing feeds/lists
- [`knowledge/patterns/mobile-navigation.md`](../../knowledge/patterns/mobile-navigation.md) — when auditing mobile nav
- [`knowledge/i18n/korean-product-conventions.md`](../../knowledge/i18n/korean-product-conventions.md) — Korean apps

## Verification phase (run before declaring done)

- [ ] Did I name the user goal at the top of the report?
- [ ] Does every issue have a citation to a knowledge/ file or WCAG section?
- [ ] Does every CRITICAL issue cite a specific WCAG criterion (e.g., 1.4.3, 2.4.7)?
- [ ] Are issues sorted within each severity (most blocking first)?
- [ ] Did I include a "things that work well" section (constructive balance)?
- [ ] Is each fix recommendation actionable (not "consider improving")?
- [ ] If platform-specific (mobile / KR): did I check the relevant convention file?
- [ ] Are duplicate issues merged (not listed in both a11y and UX)?

## Done when

- One report file with summary + 4 severity sections + "things that work well".
- Every issue has: where, what, why, fix, citation.
- Every Critical issue has at least one knowledge/ or WCAG citation.
- The report names the user goal up top.
- The report is **specific** — no "could be improved" without a stated alternative.
- The verification phase checklist passes.

````

### skills/design-critique/PLAYBOOK.md

_Included 5923/5923 bytes._

````markdown
# design-critique — playbook

Senior-designer feedback on a design proposal. Different from `ux-audit`: critique speaks to **craft, hierarchy, and decisions** — not just bugs and a11y.

## When to use

- "What do you think of this design?"
- "Critique this mockup before I share with the team."
- "Is this hero working?"

## Inputs (ask if missing)

1. **Artifact** — image, Figma link, live page.
2. **The decision being made** — "I'm trying to pick between layout A and B" vs. "is this ready to ship?".
3. **Audience** — who sees this?
4. **Constraints** — brand guidelines, technical limitations, deadline.

## How to critique

A senior critique has four levels. Always cover all four, in order:

### 1. Did this solve the problem?

Before any visual feedback, name the problem and ask whether the design solves it. If not, the visual critique doesn't matter yet.

> "The goal here is helping new users find the import flow. The hero CTA labeled 'Get started' doesn't communicate that. Without seeing the import path emphasized somewhere on this page, the design doesn't yet meet its goal — even though the visual execution is strong."

### 2. Hierarchy — does the eye go where it should?

The single most-used senior-designer move is **hierarchy critique**. Walk the artifact in **scanning order**:

1. What does the eye land on first? (Should be the primary message or action.)
2. Second?
3. Third?

If a designer's intended primary is not the actual visual primary, that's the lead with the critique.

Drivers of hierarchy:
- Size (largest wins).
- Weight (boldest wins).
- Color contrast (most-contrast wins).
- Whitespace (most-isolated wins).
- Position (top-left in LTR, top-right in RTL).
- Motion (moving wins, but is fatiguing).

### 3. Craft — is the execution at the level of the bar?

| Aspect | What to check |
| --- | --- |
| **Spacing** | Is everything on a 4-px grid? Are gaps between unrelated elements visibly larger than gaps between related ones? |
| **Alignment** | Optical center vs mathematical center for icons, asymmetric shapes. |
| **Type** | Are the type sizes from a scale? Line heights tuned? No widows/orphans on important headlines? |
| **Color use** | Is one color dominant, one accent, neutrals doing the rest? Or is it 5 brand colors competing? |
| **Iconography** | Same stroke weight, same corner radius, same fill style? |
| **Density** | Right for the audience? Power users prefer dense; new users prefer breathing room. |
| **Polish** | Hover states designed? Empty states designed? Loading designed? |

### 4. Tradeoffs — what was given up?

Every design choice gives something up. Name it. This is what separates a critique from a takedown:

> "By making the hero illustration full-bleed, you're trading off the ability to communicate the value prop in the same scroll. That's the right call for a brand-led page. If you want this to also drive activation, the prop needs to live in the next scroll within reach of the fold."

### 5. The single recommendation

End every critique with **one** recommendation. Not three, not five. The most important thing.

> "Top recommendation: pull 'Sign up free' out of the secondary nav and make it the hero CTA. Everything else can stay."

## Output format

```markdown
# Critique: <artifact>

> Decision being made: <one sentence>
> Audience: <one sentence>

## What this design does well
<2–3 bullets, specific and earned. Not "looks great". "The spacing rhythm in the feature grid is consistent and gives each card breathing room.">

## Did this solve the problem?
<answer the named problem head-on>

## Hierarchy walk
1. <what the eye lands on first>
2. <second>
3. <third>

<If misaligned with intent, name it.>

## Craft notes
- <observation>
- <observation>

## Tradeoffs accepted
- <named tradeoff with rationale>

## Top recommendation
<one sentence>
```

## Tone

- Specific over vague. "The CTA is hard to find" → "The CTA's blue blends with the link colors above it; consider a primary button style or a hue shift."
- Critique the decision, not the designer.
- Praise what works, before what doesn't.
- One recommendation, not a wishlist.
- Avoid jargon a non-designer can't follow without context.

## Source files this skill reads

- [`knowledge/patterns/ux-guidelines.md`](../../knowledge/patterns/ux-guidelines.md)
- [`knowledge/patterns/styles-catalog.md`](../../knowledge/patterns/styles-catalog.md)
- [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md)
- [`knowledge/typography/type-scale-fundamentals.md`](../../knowledge/typography/type-scale-fundamentals.md)
- [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md)
- [`knowledge/patterns/brand-references.md`](../../knowledge/patterns/brand-references.md) — for compare/contrast with peer brands.
- [`knowledge/patterns/ui-reasoning.md`](../../knowledge/patterns/ui-reasoning.md) — category-level expectations vs the design

## Verification phase (run before declaring done)

- [ ] Did I open with the named problem (not visual feedback first)?
- [ ] Does the hierarchy walk identify what the eye lands on 1st / 2nd / 3rd?
- [ ] Did I praise specific things (not "looks great")?
- [ ] Are craft observations actionable (specific element + specific change)?
- [ ] Is the named tradeoff genuine (designer gave up something specific)?
- [ ] Is there exactly **one** top recommendation in bold at the end?
- [ ] No jargon a non-designer can't follow?
- [ ] Did I critique the decision ("the CTA's blue blends"), not the designer ("you should")?

## Done when

- All five sections delivered: works well, problem fit, hierarchy walk, craft notes, tradeoffs, top recommendation.
- Each observation is specific (a designer could act on it).
- The critique is balanced (praise + concerns, not just concerns).
- One top recommendation, not several.
- The verification phase checklist passes.

````

### agents/a11y-reviewer.md

_Included 3879/3879 bytes._

````markdown
---
name: a11y-reviewer
description: Accessibility specialist. WCAG 2.1/2.2 AA review covering contrast, keyboard, focus, ARIA, touch targets, and screen reader behavior. Use before any release containing UI changes.
tools: [Read, Grep, Glob, WebFetch]
---

# a11y-reviewer

You are an accessibility specialist. Your job is to find every WCAG 2.1 / 2.2 AA violation in a design or implementation and rate severity.

## Your job

For the given artifact (design, screenshot, code, URL):

### 1. Contrast pass

For every text/background pair and every UI/background pair:
- Compute or estimate the contrast ratio.
- Flag any body text under 4.5:1.
- Flag any large text under 3:1.
- Flag any UI element (border, focus ring, icon conveying meaning) under 3:1.

Cite [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) for the rule.

### 2. Keyboard pass

For every interactive element:
- Reachable by `Tab`?
- Activatable by `Enter` and/or `Space` per element type?
- Has a visible focus indicator (≥ 2px, ≥ 3:1 contrast)?
- Skipped from tab order if non-interactive but visually clickable?

For widgets (menus, comboboxes, tabs, modals): is the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) keyboard pattern fully implemented?

Cite [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md).

### 3. Semantics pass

- Are landmarks present (`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`)?
- Heading hierarchy: one `<h1>`, no skipped levels?
- Form inputs have `<label>` (or `aria-label`)?
- Buttons are `<button>`, links are `<a href>`?
- Decorative images have `alt=""`?
- Icons that convey meaning have an accessible name?

### 4. ARIA pass

- `aria-*` only used to fill gaps native HTML doesn't (don't `role="button"` a `<button>`).
- Required ARIA properties present for the role.
- `aria-live` for dynamic announcements (toast, error).
- `aria-expanded`, `aria-controls`, `aria-haspopup` paired correctly on disclosure widgets.

### 5. Touch / target pass

- Primary actions ≥ 44×44 pt (mobile).
- Web AA minimum 24×24 (WCAG 2.2).
- Spacing between adjacent targets ≥ 8 px.

### 6. Reduced motion pass

- Animations longer than 5s loop or auto-play hero video — must be pauseable.
- Parallax / scroll-jacking respects `prefers-reduced-motion: reduce`.

### 7. Screen reader pass (best-effort static)

- Form errors announced (live region or `aria-describedby`).
- Loading states announced (`aria-busy="true"`).
- Modal open: focus moves into modal, modal title announced.
- Modal close: focus returns to trigger.

## Severity model

| Severity | Definition |
| --- | --- |
| 🔴 Critical | Fails WCAG AA. Must fix before ship. |
| 🟠 High | Likely AAA failure or serious usability issue for users with disabilities. |
| 🟡 Medium | Minor, AAA-only, or context-dependent. |
| 🟢 Low | Polish — affordance improvements. |

A11y bugs **never** ship as Medium-or-lower silently. If unsure, raise to High and let the team decide.

## Output

```markdown
# A11y review: <artifact>

> Reviewed against WCAG 2.1 AA + 2.2 additions
> Reviewer: <agent>
> Date: <date>

## Summary
- Critical: <n>
- High: <n>
- Medium: <n>
- Low: <n>

## Critical
1. **<issue title>** — `<location>`
   - Failure: <what's broken, with computed value if applicable>
   - WCAG: <e.g., 1.4.3 Contrast (Minimum) — Level AA>
   - Fix: <specific recommendation>

## High
...

## Medium
...

## Low
...

## Things tested clean
- <2–4 things you specifically checked and passed>
```

## Sources

- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
- [W3C WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) (cite by URL when relevant)
- [WCAG 2.2 standard](https://www.w3.org/TR/WCAG22/) (cite section number for each Critical)

````

### agents/design-critic.md

_Included 2116/2116 bytes._

````markdown
---
name: design-critic
description: Senior product designer who reviews UI/UX proposals. Use when the user shares a design and wants critique on hierarchy, craft, and decisions — not just bug-finding. Invoke proactively after any design artifact is shared.
tools: [Read, Grep, Glob, WebFetch]
---

# design-critic

You are a senior product designer with 20+ years of experience reviewing work from junior and mid-level designers, founders, and engineers turning ideas into screens.

## Your job

Apply the [`design-critique`](../skills/design-critique/PLAYBOOK.md) playbook. Always cover all five sections in order:

1. What works well (specific praise, 2–3 bullets)
2. Did this solve the problem (head-on answer)
3. Hierarchy walk (where the eye lands, in scanning order)
4. Craft notes (spacing, alignment, type, color, polish)
5. Tradeoffs accepted
6. **One** top recommendation

## Tone

- Specific, not vague. "The hero CTA is hard to find" → "The hero CTA's blue blends with the link colors above it; consider primary button styling or a hue shift."
- Critique the decision, not the designer.
- Praise what works before what doesn't.
- One recommendation, not five.
- No jargon a non-designer can't follow without context.

## Sources you cite

- [`knowledge/colors/color-theory.md`](../knowledge/colors/color-theory.md)
- [`knowledge/typography/type-scale-fundamentals.md`](../knowledge/typography/type-scale-fundamentals.md)
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
- [`knowledge/patterns/styles-catalog.md`](../knowledge/patterns/styles-catalog.md)
- [`knowledge/patterns/brand-references.md`](../knowledge/patterns/brand-references.md) — for compare/contrast against peer brands.

## What you do NOT do

- You don't review code. (That's a code-reviewer agent.)
- You don't spec components. (That's `component-architect`.)
- You don't catalog every a11y issue. (That's `a11y-reviewer` — invoke them in parallel if needed.)

## Output

A markdown report following the structure above. End with the single top recommendation in **bold**, on its own line.

````

### knowledge/PRINCIPLES.md

_Included 8410/8410 bytes._

````markdown
<!-- hand-written -->
---
title: Design-AI principles — agent priming cheat sheet
applies_to: [all]
purpose: Single-page reference. Read at the start of every design task. Every rule cites a deeper knowledge file.
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Design-AI principles

The 30 load-bearing rules across this knowledge base. Read this first; it primes you for any design task. Every line links to the deeper file with reasoning + edge cases.

## Color

1. **Contrast: 4.5:1 body, 3:1 UI/large text.** Cite [`a11y/contrast.md`](a11y/contrast.md). Always state the ratio explicitly when introducing a color pair.
2. **Tokens by role, not by hex.** `--color-primary-default` not `--blue-600`. Cite [`colors/color-theory.md`](colors/color-theory.md).
3. **Dark mode is recomputed, not inverted.** Increase chroma 10–20% for low-light; reset semantic anchors. Cite [`colors/color-theory.md`](colors/color-theory.md).
4. **Money colors are a separate axis** from primary/error. `--color-money-positive` / `--color-money-negative` / `--color-money-neutral`. Cite [`patterns/money-and-amount.md`](patterns/money-and-amount.md).
5. **Korean stock convention is INVERTED**: red=up, blue=down. Cite [`patterns/money-and-amount.md`](patterns/money-and-amount.md).
6. **Color + icon redundancy.** Never encode meaning by color alone — pair with icon, label, or pattern. Cite [`a11y/contrast.md`](a11y/contrast.md).

## Typography

7. **Korean +10% line-height** vs Latin defaults. Body 1.5 → 1.6. Cite [`i18n/korean-typography.md`](i18n/korean-typography.md).
8. **Korean body emphasis = weight 600** (not 500). Hangul reads thinner at the same numeric weight. Cite [`i18n/korean-typography.md`](i18n/korean-typography.md).
9. **Tabular numerals for amounts.** `font-feature-settings: 'tnum' 1`. Cite [`patterns/money-and-amount.md`](patterns/money-and-amount.md).
10. **Pretendard for Korean primary.** Pairs Hangul + Latin in matched proportions. Cite [`i18n/korean-typography.md`](i18n/korean-typography.md).
11. **Type scale: base 14 product UI / 18+ marketing.** Ratio 1.25 (major third) is the safe default. Cite [`typography/type-scale-fundamentals.md`](typography/type-scale-fundamentals.md).

## Spacing & layout

12. **4-base spacing scale.** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. No arbitrary values. Cite [`layout/spacing-and-grid.md`](layout/spacing-and-grid.md).
13. **12-col grid, 24px gutter.** Standard for product UIs. Container queries for component-internal layout. Cite [`layout/spacing-and-grid.md`](layout/spacing-and-grid.md).
14. **Korean consumer mobile is denser** than Western defaults. Reduce padding ~15–25% from MUI/Material defaults. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).

## Motion

15. **Three duration tiers**: 150ms (micro) / 250ms (component) / 400ms (hero only). Cite [`motion/principles.md`](motion/principles.md).
16. **`ease-out` for entrances, `ease-in` for exits, `ease-in-out` for position changes.** Cite [`motion/principles.md`](motion/principles.md).
17. **Respect `prefers-reduced-motion`.** Drop fade/scale/parallax; keep state changes. Cite [`motion/principles.md`](motion/principles.md).

## Accessibility

18. **Every interactive element keyboard-reachable** with visible focus indicator (≥ 2px, 3:1 contrast). Cite [`a11y/keyboard-and-focus.md`](a11y/keyboard-and-focus.md).
19. **Touch targets ≥ 44×44 mobile / ≥ 24×24 web AA.** Use `hitSlop` to extend without growing visual. Cite [`a11y/keyboard-and-focus.md`](a11y/keyboard-and-focus.md).
20. **Modal: focus trap on open, restore focus on close, Escape closes.** Cite WAI-ARIA Dialog Pattern + [`examples/component-modal.md`](../examples/component-modal.md).
21. **Form errors via `aria-invalid` + `aria-describedby`** pointing at the error text. Cite [`patterns/form-design.md`](patterns/form-design.md).
22. **Disabled state requires `aria-disabled`** in addition to native `disabled`. Cite [`a11y/keyboard-and-focus.md`](a11y/keyboard-and-focus.md).

## Forms

23. **Single column, labels above, validate on blur.** Cite [`patterns/form-design.md`](patterns/form-design.md).
24. **Mark optional with `(optional)`, not required with `*`.** Required is the default; mark exceptions. Cite [`patterns/form-design.md`](patterns/form-design.md).
25. **Korean: separate marketing-consent checkbox** from required-terms. Pre-checked is illegal. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).
26. **Phone-first auth + KakaoTalk login** for Korean consumer apps. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).
27. **Daum Postcode API for any Korean address field.** Never free-form. Cite [`i18n/korean-product-conventions.md`](i18n/korean-product-conventions.md).

## Lists & navigation

28. **Virtualize lists > 50 items** (FlatList on RN, react-virtual on web). Skeleton on first load only. Cite [`patterns/list-and-feed.md`](patterns/list-and-feed.md).
29. **Bottom-tab-bar for Korean consumer mobile** (3–5 tabs, always with Korean labels). Cite [`patterns/mobile-navigation.md`](patterns/mobile-navigation.md).

## Components

30. **When specing a component, cite all 3 references** (Ant Design, MUI, shadcn-ui) and explain API choices ("API choices made" section). Don't invent — adapt. Cite [`skills/component-spec-writer/PLAYBOOK.md`](../skills/component-spec-writer/PLAYBOOK.md).

## Data visualization

31. **Pick palette type by data shape**: sequential (low→high), diverging (positive↔negative), categorical (distinct). Cite [`patterns/chart-color-encoding.md`](patterns/chart-color-encoding.md).
32. **≤ 8 categorical colors.** More than 8 = user can't track. Cite [`patterns/chart-color-encoding.md`](patterns/chart-color-encoding.md).
33. **Dashboard order: KPI row → primary chart → secondary 2-up → detail table.** Cite [`patterns/dashboard-composition.md`](patterns/dashboard-composition.md).
34. **"Last updated" indicator on every live dashboard.** Cite [`patterns/realtime-data.md`](patterns/realtime-data.md).
35. **Don't blast updates** — throttle to ≤10/sec per element, batch high-frequency. Respect `prefers-reduced-motion`. Cite [`patterns/realtime-data.md`](patterns/realtime-data.md).

## Documentation & long-form

36. **Documents follow Diátaxis types**: tutorial / how-to / reference / explanation. Each has a different template + voice. Don't mix in one doc. Cite [`patterns/information-architecture.md`](patterns/information-architecture.md).
37. **Body 18px on docs, not 14px.** Long-form reading needs bigger text than UI. Cite [`patterns/document-typography.md`](patterns/document-typography.md).
38. **Lead with the answer (TL;DR pyramid).** Especially in reports. Senior reader stops at the first paragraph; structure for that. Cite [`patterns/report-design.md`](patterns/report-design.md).
39. **Active voice, second person, imperative for instructions.** Cite [`patterns/technical-writing.md`](patterns/technical-writing.md).
40. **Slide title = the message, not the topic.** "Revenue tripled in Q4" beats "Revenue". Cite [`patterns/slide-deck-design.md`](patterns/slide-deck-design.md).
41. **Korean documents: pick honorific level (~합니다 vs ~해요) and stay consistent.** Cite [`i18n/korean-document-style.md`](i18n/korean-document-style.md).

## Output discipline

When producing any design artifact:

- **Cite knowledge files** for every claim category. No silent assertions.
- **Contrast matrix** for any color-related output.
- **Tokens by name in semantic layer**, hex only in primitive layer.
- **Light + dark** when both requested. Recomputed.
- **Don't section** with at least 2 specific misuses.
- **Korean considerations** if `language` includes `ko`.

## When in doubt

- Default to **boring, defensible, cited** over **clever, novel, justified-by-vibe**.
- If the upstream design systems all do X, do X unless you have a specific reason.
- If you're unsure, ask one clarifying question. Don't guess.
- Open the relevant `knowledge/<category>/<file>.md` rather than reasoning from training data.

## How this file is used

- **Loaded at session start** by the agent (alongside `AGENTS.md` / `CLAUDE.md`).
- **Re-read before declaring an artifact complete** — verification phase reference.
- **Cited in artifacts** as `PRINCIPLES.md` for the broad rules; specific files for details.

````

### knowledge/patterns/ux-guidelines.md

_Included 16555/23432 bytes; truncated._

````markdown
---
title: UX guidelines
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/ux-guidelines.csv
upstream: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
extracted_at: 2026-05-19
applies_to: [web, mobile, accessibility]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# UX guidelines

A catalog of common UX issues with do/don't pairs. Use as a **review checklist** before sign-off and as a learning index for new designers.

## AI Interaction

### 🔴 Disclaimer _(_All_)_

Users need to know they talk to AI

**Do**: Clearly label AI generated content
**Don't**: Present AI as human

```
// good
AI Assistant label
// bad
Fake human name without label
```

### 🟡 Streaming _(_All_)_

Waiting for full text is slow

**Do**: Stream text response token by token
**Don't**: Show loading spinner for 10s+

```
// good
Typewriter effect
// bad
Spinner until 100% complete
```

### 🟢 Feedback Loop _(_All_)_

AI needs user feedback to improve

**Do**: Thumps up/down or 'Regenerate'
**Don't**: Static output only

```
// good
Feedback component
// bad
Read-only text
```


## Accessibility

### 🔴 Color Contrast _(_All_)_

Text must be readable against background

**Do**: Minimum 4.5:1 ratio for normal text
**Don't**: Low contrast text

```
// good
#333 on white (7:1)
// bad
#999 on white (2.8:1)
```

### 🔴 Color Only _(_All_)_

Don't convey information by color alone

**Do**: Use icons/text in addition to color
**Don't**: Red/green only for error/success

```
// good
Red text + error icon
// bad
Red border only for error
```

### 🔴 Alt Text _(_All_)_

Images need text alternatives

**Do**: Descriptive alt text for meaningful images
**Don't**: Empty or missing alt attributes

```
// good
alt='Dog playing in park'
// bad
alt='' for content images
```

### 🟡 Heading Hierarchy _(_Web_)_

Screen readers use headings for navigation

**Do**: Use sequential heading levels h1-h6
**Don't**: Skip heading levels or misuse for styling

```
// good
h1 then h2 then h3
// bad
h1 then h4
```

### 🔴 ARIA Labels _(_All_)_

Interactive elements need accessible names

**Do**: Add aria-label for icon-only buttons
**Don't**: Icon buttons without labels

```
// good
aria-label='Close menu'
// bad
<button><Icon/></button>
```

### 🔴 Keyboard Navigation _(_Web_)_

All functionality accessible via keyboard

**Do**: Tab order matches visual order
**Don't**: Keyboard traps or illogical tab order

```
// good
tabIndex for custom order
// bad
Unreachable elements
```

### 🟡 Screen Reader _(_All_)_

Content should make sense when read aloud

**Do**: Use semantic HTML and ARIA properly
**Don't**: Div soup with no semantics

```
// good
<nav> <main> <article>
// bad
<div> for everything
```

### 🔴 Form Labels _(_All_)_

Inputs must have associated labels

**Do**: Use label with for attribute or wrap input
**Don't**: Placeholder-only inputs

```
// good
<label for='email'>
// bad
placeholder='Email' only
```

### 🔴 Error Messages _(_All_)_

Error messages must be announced

**Do**: Use aria-live or role=alert for errors
**Don't**: Visual-only error indication

```
// good
role='alert'
// bad
Red border only
```

### 🟡 Skip Links _(_Web_)_

Allow keyboard users to skip navigation

**Do**: Provide skip to main content link
**Don't**: No skip link on nav-heavy pages

```
// good
Skip to main content link
// bad
100 tabs to reach content
```

### 🔴 Motion Sensitivity _(_All_)_

Parallax/Scroll-jacking causes nausea

**Do**: Respect prefers-reduced-motion
**Don't**: Force scroll effects

```
// good
@media (prefers-reduced-motion)
// bad
ScrollTrigger.create()
```


## Animation

### 🔴 Excessive Motion _(_All_)_

Too many animations cause distraction and motion sickness

**Do**: Animate 1-2 key elements per view maximum
**Don't**: Animate everything that moves

```
// good
Single hero animation
// bad
animate-bounce on 5+ elements
```

### 🟡 Duration Timing _(_All_)_

Animations should feel responsive not sluggish

**Do**: Use 150-300ms for micro-interactions
**Don't**: Use animations longer than 500ms for UI

```
// good
transition-all duration-200
// bad
duration-1000
```

### 🔴 Reduced Motion _(_All_)_

Respect user's motion preferences

**Do**: Check prefers-reduced-motion media query
**Don't**: Ignore accessibility motion settings

```
// good
@media (prefers-reduced-motion: reduce)
// bad
No motion query check
```

### 🔴 Loading States _(_All_)_

Show feedback during async operations

**Do**: Use skeleton screens or spinners
**Don't**: Leave UI frozen with no feedback

```
// good
animate-pulse skeleton
// bad
Blank screen while loading
```

### 🔴 Hover vs Tap _(_All_)_

Hover effects don't work on touch devices

**Do**: Use click/tap for primary interactions
**Don't**: Rely only on hover for important actions

```
// good
onClick handler
// bad
onMouseEnter only
```

### 🟡 Continuous Animation _(_All_)_

Infinite animations are distracting

**Do**: Use for loading indicators only
**Don't**: Use for decorative elements

```
// good
animate-spin on loader
// bad
animate-bounce on icons
```

### 🟡 Transform Performance _(_Web_)_

Some CSS properties trigger expensive repaints

**Do**: Use transform and opacity for animations
**Don't**: Animate width/height/top/left properties

```
// good
transform: translateY()
// bad
top: 10px animation
```

### 🟢 Easing Functions _(_All_)_

Linear motion feels robotic

**Do**: Use ease-out for entering ease-in for exiting
**Don't**: Use linear for UI transitions

```
// good
ease-out
// bad
linear
```


## Content

### 🟡 Truncation _(_All_)_

Handle long content gracefully

**Do**: Truncate with ellipsis and expand option
**Don't**: Overflow or broken layout

```
// good
line-clamp-2 with expand
// bad
Overflow or cut off
```

### 🟢 Date Formatting _(_All_)_

Use locale-appropriate date formats

**Do**: Use relative or locale-aware dates
**Don't**: Ambiguous date formats

```
// good
2 hours ago or locale format
// bad
01/02/03
```

### 🟢 Number Formatting _(_All_)_

Format large numbers for readability

**Do**: Use thousand separators or abbreviations
**Don't**: Long unformatted numbers

```
// good
1.2K or 1,234
// bad
1234567
```

### 🟢 Placeholder Content _(_All_)_

Show realistic placeholders during dev

**Do**: Use realistic sample data
**Don't**: Lorem ipsum everywhere

```
// good
Real sample content
// bad
Lorem ipsum
```


## Data Entry

### 🟢 Bulk Actions _(_Web_)_

Editing one by one is tedious

**Do**: Allow multi-select and bulk edit
**Don't**: Single row actions only

```
// good
Checkbox column + Action bar
// bad
Repeated actions per row
```


## Feedback

### 🔴 Loading Indicators _(_All_)_

Show system status during waits

**Do**: Show spinner/skeleton for operations > 300ms
**Don't**: No feedback during loading

```
// good
Skeleton or spinner
// bad
Frozen UI
```

### 🟡 Empty States _(_All_)_

Guide users when no content exists

**Do**: Show helpful message and action
**Don't**: Blank empty screens

```
// good
No items yet. Create one!
// bad
Empty white space
```

### 🟡 Error Recovery _(_All_)_

Help users recover from errors

**Do**: Provide clear next steps
**Don't**: Error without recovery path

```
// good
Try again button + help link
// bad
Error message only
```

### 🟡 Progress Indicators _(_All_)_

Show progress for multi-step processes

**Do**: Step indicators or progress bar
**Don't**: No indication of progress

```
// good
Step 2 of 4 indicator
// bad
No step information
```

### 🟡 Toast Notifications _(_All_)_

Transient messages for non-critical info

**Do**: Auto-dismiss after 3-5 seconds
**Don't**: Toasts that never disappear

```
// good
Auto-dismiss toast
// bad
Persistent toast
```

### 🟡 Confirmation Messages _(_All_)_

Confirm successful actions

**Do**: Brief success message
**Don't**: Silent success

```
// good
Saved successfully toast
// bad
No confirmation
```


## Forms

### 🔴 Input Labels _(_All_)_

Every input needs a visible label

**Do**: Always show label above or beside input
**Don't**: Placeholder as only label

```
// good
<label>Email</label><input>
// bad
placeholder='Email' only
```

### 🟡 Error Placement _(_All_)_

Errors should appear near the problem

**Do**: Show error below related input
**Don't**: Single error message at top of form

```
// good
Error under each field
// bad
All errors at form top
```

### 🟡 Inline Validation _(_All_)_

Validate as user types or on blur

**Do**: Validate on blur for most fields
**Don't**: Validate only on submit

```
// good
onBlur validation
// bad
Submit-only validation
```

### 🟡 Input Types _(_All_)_

Use appropriate input types

**Do**: Use email tel number url etc
**Don't**: Text input for everything

```
// good
type='email'
// bad
type='text' for email
```

### 🟡 Autofill Support _(_Web_)_

Help browsers autofill correctly

**Do**: Use autocomplete attribute properly
**Don't**: Block or ignore autofill

```
// good
autocomplete='email'
// bad
autocomplete='off' everywhere
```

### 🟡 Required Indicators _(_All_)_

Mark required fields clearly

**Do**: Use asterisk or (required) text
**Don't**: No indication of required fields

```
// good
* required indicator
// bad
Guess which are required
```

### 🟡 Password Visibility _(_All_)_

Let users see password while typing

**Do**: Toggle to show/hide password
**Don't**: No visibility toggle

```
// good
Show/hide password button
// bad
Password always hidden
```

### 🔴 Submit Feedback _(_All_)_

Confirm form submission status

**Do**: Show loading then success/error state
**Don't**: No feedback after submit

```
// good
Loading -> Success message
// bad
Button click with no response
```

### 🟡 Input Affordance _(_All_)_

Inputs should look interactive

**Do**: Use distinct input styling
**Don't**: Inputs that look like plain text

```
// good
Border/background on inputs
// bad
Borderless inputs
```

### 🟡 Mobile Keyboards _(_Mobile_)_

Show appropriate keyboard for input type

**Do**: Use inputmode attribute
**Don't**: Default keyboard for all inputs

```
// good
inputmode='numeric'
// bad
Text keyboard for numbers
```


## Interaction

### 🔴 Focus States _(_All_)_

Keyboard users need visible focus indicators

**Do**: Use visible focus rings on interactive elements
**Don't**: Remove focus outline without replacement

```
// good
focus:ring-2 focus:ring-blue-500
// bad
outline-none without alternative
```

### 🟡 Hover States _(_Web_)_

Visual feedback on interactive elements

**Do**: Change cursor and add subtle visual change
**Don't**: No hover feedback on clickable elements

```
// good
hover:bg-gray-100 cursor-pointer
// bad
No hover style
```

### 🟡 Active States _(_All_)_

Show immediate feedback on press/click

**Do**: Add pressed/active state visual change
**Don't**: No feedback during interaction

```
// good
active:scale-95
// bad
No active state
```

### 🟡 Disabled States _(_All_)_

Clearly indicate non-interactive elements

**Do**: Reduce opacity and change cursor
**Don't**: Confuse disabled with normal state

```
// good
opacity-50 cursor-not-allowed
// bad
Same style as enabled
```

### 🔴 Loading Buttons _(_All_)_

Prevent double submission during async actions

**Do**: Disable button and show loading state
**Don't**: Allow multiple clicks during processing

```
// good
disabled={loading} spinner
// bad
Button clickable while loading
```

### 🔴 Error Feedback _(_All_)_

Users need to know when something fails

**Do**: Show clear error messages near problem
**Don't**: Silent failures with no feedback

```
// good
Red border + error message
// bad
No indication of error
```

### 🟡 Success Feedback _(_All_)_

Confirm successful actions to users

**Do**: Show success message or visual change
**Don't**: No confirmation of completed action

```
// good
Toast notification or checkmark
// bad
Action completes silently
```

### 🔴 Confirmation Dialogs _(_All_)_

Prevent accidental destructive actions

**Do**: Confirm before delete/irreversible actions
**Don't**: Delete without confirmation

```
// good
Are you sure modal
// bad
Direct delete on click
```


## Layout

### 🔴 Z-Index Management _(_Web_)_

Stacking context conflicts cause hidden elements

**Do**: Define z-index scale system (10 20 30 50)
**Don't**: Use arbitrary large z-index values

```
// good
z-10 z-20 z-50
// bad
z-[9999]
```

### 🟡 Overflow Hidden _(_Web_)_

Hidden overflow can clip important content

**Do**: Test all content fits within containers
**Don't**: Blindly apply overflow-hidden

```
// good
overflow-auto with scroll
// bad
overflow-hidden truncating content
```

### 🟡 Fixed Positioning _(_Web_)_

Fixed elements can overlap or be inaccessible

**Do**: Account for safe areas and other fixed elements
**Don't**: Stack multiple fixed elements carelessly

```
// good
Fixed nav + fixed bottom with gap
// bad
Multiple overlapping fixed elements
```

### 🟡 Stacking Context _(_Web_)_

New stacking contexts reset z-index

**Do**: Understand what creates new stacking context
**Don't**: Expect z-index to work across contexts

```
// good
Parent with z-index isolates children
// bad
z-index: 9999 not working
```

### 🔴 Content Jumping _(_Web_)_

Layout shift when content loads is jarring

**Do**: Reserve space for async content
**Don't**: Let images/content push layout around

```
// good
aspect-ratio or fixed height
// bad
No dimensions on images
```

### 🟡 Viewport Units _(_Web_)_

100vh can be problematic on mobile browsers

**Do**: Use dvh or account for mobile browser chrome
**Don't**: Use 100vh for full-screen mobile layouts

```
// good
min-h-dvh or min-h-screen
// bad
h-screen on mobile
```

### 🟡 Container Width _(_Web_)_

Content too wide is hard to read

**Do**: Limit max-width for text content (65-75ch)
**Don't**: Let text span full viewport width

```
// good
max-w-prose or max-w-3xl
// bad
Full width paragraphs
```


## Navigation

### 🔴 Smooth Scroll _(_Web_)_

Anchor links should scroll smoothly to target section

**Do**: Use scroll-behavior: smooth on html element
**Don't**: Jump directly without transition

```
// good
html { scroll-behavior: smooth; }
// bad
<a href='#section'> without CSS
```

### 🟡 Sticky Navigation _(_Web_)_

Fixed nav should not obscure content

**Do**: Add padding-top to body equal to nav height
**Don't**: Let nav overlap first section content

```
// good
pt-20 (if nav is h-20)
// bad
No padding compensation
```

### 🟡 Active State _(_All_)_

Current page/section should be visually indicated

**Do**: Highlight active nav item with color/underline
**Don't**: No visual feedback on current location

```
// good
text-primary border-b-2
// bad
All links same style
```

### 🔴 Back Button _(_Mobile_)_

Users expect back to work predictably

**Do**: Preserve navigation history properly
**Don't**: Break browser/app back button behavior

```
// good
history.pushState()
// bad
location.replace()
```

### 🟡 Deep Linking _(_All_)_

URLs should reflect current state for sharing

**Do**: Update URL on state/view changes
**Don't**: Static URLs for dynamic content

```
// good
Use query params or hash
// bad
Single URL for all states
```

### 🟢 Breadcrumbs _(_Web_)_

Show user location in site hierarchy

**Do**: Use for sites with 3+ levels of depth
**Don't**: Use for flat single-level sites

```
// good
Home > Category > Product
// bad
Only on deep nested pages
```


## Onboarding

### 🟡 User Freedom _(_All_)_

Users should be able to skip tutorials

**Do**: Provide Skip and Back buttons
**Don't**: Force linear unskippable tour

```
// good
Skip Tutorial button
// bad
Locked overlay until finished
```


## Performance

### 🔴 Image Optimization _(_All_)_

Large images slow page load

**Do**: Use appropriate size and format (WebP)
**Don't**: Unoptimized full-size images

```
// good
srcset with multiple sizes
// bad
4000px image for 400px display
```

### 🟡 Lazy Loading _(_All_)_

Load content as needed

**Do**: Lazy load below-fold images and content
**Don't**: Load everything upfront

```
// good
loading='lazy'
// bad
All images eager load
```

### 🟡 Code Splitting _(_Web_)_

Large bundles slow initial load

**Do**: Split code by route/feature
**Don't**: Single large bundle

```
// good
dynamic import()
// bad
All code in main bundle
```

### 🟡 Caching _(_Web_)_

Repeat visits should be fast

**Do**: Set appropriate cache headers
**Don't**: No caching strategy

```
// good
Cache-Control headers
//
````

### knowledge/a11y/contrast.md

_Included 3161/3161 bytes._

````markdown
<!-- hand-written -->
---
title: Contrast — WCAG 2.1 / 2.2 reference
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Contrast

WCAG 2.1 / 2.2 contrast requirements. Cite this file when justifying any color decision involving text or interactive UI.

## Required ratios

| Content | AA (legal floor) | AAA (target for product UI) |
| --- | --- | --- |
| Body text (< 18pt regular / < 14pt bold) | **4.5:1** | 7:1 |
| Large text (≥ 18pt regular / ≥ 14pt bold) | **3:1** | 4.5:1 |
| UI components (buttons, form borders, focus indicators, icons that convey meaning) | **3:1** | — |
| Graphical objects that convey information | **3:1** | — |
| Decorative content, logos | exempt | exempt |

> "Large text" = ≥ 24px regular or ≥ 18.66px bold. Pixel sizes assume default browser root.

## Quick failure modes

- **Placeholder gray**: `#9CA3AF` on `#FFFFFF` is 2.88:1 — fails AA at any size. Use `#6B7280` (4.83:1) or darker.
- **Disabled text "disabled-by-design"**: WCAG explicitly **exempts disabled controls**. But if "disabled" is your primary state (e.g., greyed-out menu item), users perceive it as live and you must clear AA.
- **Brand color on white**: Many brand reds and greens fail AA for body. Reserve them for large text, icons (3:1 only), or accents on darker backgrounds.
- **Focus indicators**: WCAG 2.4.11 (AA in WCAG 2.2) requires the focus ring itself to clear **3:1 against adjacent colors AND ≥ 2px thickness**. A subtle outline-blue on a light blue button often fails.
- **Hover-only states**: hover is not a contrast requirement, but the **default state** must clear contrast on its own. Don't rely on hover to fix a non-compliant resting state.

## Computing contrast (WCAG)

The relative luminance of an sRGB component `c ∈ [0, 1]` is:

```
c' = c/12.92               if c ≤ 0.03928
c' = ((c + 0.055)/1.055)^2.4   otherwise

L = 0.2126 R' + 0.7152 G' + 0.0722 B'
```

Contrast ratio of two luminances:

```
ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

Range: 1 (identical) to 21 (black on white).

## APCA (forthcoming)

WCAG 3 will replace the WCAG 2 ratio with APCA (Accessible Perceptual Contrast Algorithm). Different scale (`Lc`), different polarity rules (dark-on-light vs light-on-dark are not symmetric). Don't migrate yet — APCA is not yet a normative web standard. Track: <https://www.myndex.com/APCA/>.

## Tools

| Tool | When |
| --- | --- |
| Browser DevTools color picker | Quick spot check (every browser shows AA/AAA badges). |
| `color-contrast` CLI npm package | Automated CI check. |
| WebAIM Contrast Checker | Authoritative web reference. |
| Stark (Figma plugin) | Designing in Figma. |

## What this rule does NOT cover

- **Color blindness simulation** — pass contrast does not guarantee discriminability. Test with deuteranopia/protanopia simulators if color encodes meaning (status, charts).
- **Text on imagery / video** — use a scrim (overlay 40–60% black) and verify against the **darkest** patch of the image you allow.
- **Dark mode contrast inversion** — recompute every token. Light-mode AA does not imply dark-mode AA.

````

### knowledge/a11y/keyboard-and-focus.md

_Included 4548/4548 bytes._

````markdown
<!-- hand-written -->
---
title: Keyboard and focus — WCAG operable
applies_to: [web, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Keyboard and focus

Every interactive element on screen must be operable by keyboard alone, with a visible focus indicator at every step. This is non-negotiable for AA compliance and for ~7% of users.

## Tab order rules

- Logical reading order. Tab follows the visual reading order — top-to-bottom, left-to-right (or RTL equivalent).
- Skipping with `tabindex="-1"`: removes the element from the tab order but keeps it focusable programmatically. Use for items focused by code (e.g., modal title focused on open).
- **Never** use `tabindex` ≥ 1. It overrides natural order and creates inconsistencies.
- Hidden/disabled elements: `display:none`, `visibility:hidden`, `disabled` — auto-removed.
- Decorative interactive-looking divs: must have `role` and `tabindex="0"` to be reachable, OR not be interactive.

## Focus indicators

Required by WCAG 2.4.11 (AA in 2.2).

| Property | Minimum |
| --- | --- |
| Thickness | 2 CSS px outline OR equivalent area |
| Contrast | 3:1 against adjacent colors (the element's normal color AND its background) |
| Coverage | Encloses the element fully OR fills it with a 3:1+ contrast change |

```css
/* Good — works on light and dark backgrounds */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Better for design systems — token-driven */
button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* DO NOT do this */
*:focus { outline: none; }  /* removes a11y, fails 2.4.7 */
```

`:focus-visible` (modern browsers) keeps focus rings on keyboard nav but hides them for mouse clicks — users who don't want them are not disturbed, keyboard users are protected.

## Required keyboard interactions per pattern

| Component | Keys |
| --- | --- |
| Button | `Enter`, `Space` activate. |
| Link | `Enter` activates. (Not space — that scrolls.) |
| Menu / Dropdown | `↑/↓` move, `Enter` activate, `Escape` close, `Home/End` first/last. |
| Tabs | `←/→` move (`↑/↓` if vertical), `Home/End` first/last, `Enter/Space` activate (or auto-activate for some patterns). |
| Combobox | `↓` open, `↑/↓` navigate options, `Enter` select, `Escape` close, type-ahead supported. |
| Modal / Dialog | Open: focus moves into dialog. `Escape` closes. Focus is **trapped** until close. On close: focus returns to the trigger. |
| Slider | `←/↓` decrement, `→/↑` increment, `Home` min, `End` max, `PageUp/Down` larger step. |
| Tree | `↑/↓` move, `←` collapse / move to parent, `→` expand / move to first child, `Enter` activate. |
| Toggle / Switch | `Space` toggles. (Not Enter unless `<button>`-typed.) |
| Date picker | Within calendar grid: arrow keys move days, `PageUp/Down` months, `Shift+PgUp/Dn` years. |

Source: [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — the canonical reference for keyboard patterns.

## Focus management on route change (SPA)

When a client-side route changes:
- Move focus to the new page's `<h1>` (or main landmark).
- Update document title (so screen reader announces the new context).
- Without this, screen reader users hear nothing — the route change is invisible.

```ts
// On route change
useEffect(() => {
  document.title = newTitle;
  document.querySelector('h1')?.focus();
}, [route]);
```

## Touch target sizing

WCAG 2.5.5 (Level AAA) and 2.5.8 (Level AA in 2.2) require:

| Standard | Minimum |
| --- | --- |
| WCAG 2.2 AA (Target Size — Minimum) | **24×24 CSS px** |
| WCAG 2.1 AAA (Target Size) | **44×44 CSS px** |
| iOS HIG | 44×44 pt |
| Material guidelines | 48×48 dp |

For consumer mobile UIs, **target 44×44 minimum**. Smaller is allowed only when:
- Equivalent target available elsewhere on the page, OR
- Inline within a sentence (e.g., link in body text).

Spacing matters too: a 24×24 button surrounded by enough space to count as a 44×44 hit area is better than a tightly-packed grid of 32×32 buttons.

## Common failures to flag in review

- `<div onClick>` with no `role` and no tab support.
- Placeholder used as label (`<input placeholder="Email">` with no `<label>`).
- Modal that steals focus on open but doesn't return it on close.
- `Escape` on dropdown closes the page modal too (event bubbling).
- Custom select with no type-ahead.
- Focus ring removed globally with `outline: none`.
- Carousel that auto-advances and traps focus.

````

### examples/report-example.md

_Included 8766/8766 bytes._

````markdown
# Worked example: design audit report

> Generated by `skills/ux-audit` (or `skills/design-system-qa`). Demonstrates the canonical audit report format — TL;DR pyramid, severity-aggregated findings, citations.

---

```markdown
# UX Audit: 신규 가입 흐름

> 검토일: 2026.05.08
> 검토자: design-ai (skills/ux-audit)
> 사용자 목표: 첫 화면에서 30초 안에 가입 완료
> 플랫폼: 모바일 웹 (iOS Safari + Android Chrome)
> 검토 기준: WCAG 2.1 AA + design-ai PRINCIPLES.md

## TL;DR

신규 가입 흐름에 12개 문제가 있습니다 (Critical 3 / High 4 / Medium 3 / Low 2). 가입 성공률이 32% 떨어지는 주된 원인은 (1) 비밀번호 필드가 IME 영향 받음, (2) 이메일 검증 후에도 form이 reset됨, (3) 마케팅 동의가 default-checked로 들어가 있어 한국 e-commerce 법 위반입니다.

**최우선 권장사항**: 마케팅 동의 default-checked 즉시 해제. 법적 리스크 + 사용자 신뢰 양쪽 회복.

## 핵심 발견

1. **마케팅 동의 default-checked로 체크됨** 🔴 — 정보통신망법 위반 가능
2. **비밀번호 입력 시 IME 활성화** 🔴 — 한글 자모가 비밀번호로 인식되어 검증 실패
3. **이메일 인증 후 form reset** 🔴 — 사용자가 입력한 값을 잃음 (이탈 발생)
4. **휴대폰 번호 검증 regex가 미국 형식** 🟠 — 한국 010-####-#### 거부
5. ~~기타 8건~~ (아래 상세)

## 권장사항

| 권장사항 | 담당 | 마감 |
| --- | --- | --- |
| 마케팅 동의 unchecked로 변경 | 프론트엔드 팀 | **즉시** |
| 비밀번호 필드 IME 비활성화 | 프론트엔드 팀 | 이번 sprint |
| 이메일 인증 후 form state 보존 | 풀스택 | 이번 sprint |
| 휴대폰 regex 한국 형식으로 변경 | 프론트엔드 팀 | 이번 sprint |

---

## 상세

### Critical (3건 — 출시 전 반드시 수정)

#### 1. 마케팅 동의 default-checked
**위치**: `src/screens/Signup.tsx:147`

**문제**: 마케팅 정보 수신 동의 체크박스가 페이지 로드 시 체크 상태로 표시됩니다.

**왜 문제인가**:
- 한국 정보통신망법 제50조의2: 마케팅 동의는 사용자가 명시적으로 opt-in해야 하며, default-checked는 명백한 위반.
- 사용자 신뢰 손상.
- 신고 시 과태료 (최대 3,000만원).

**해결**:
```diff
- <Checkbox defaultChecked label="마케팅 정보 수신 동의" />
+ <Checkbox label="마케팅 정보 수신 동의" />
```

또한 약관 동의(필수)와 분리해 별도 checkbox로 두어야 함.

**참고**:
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md) — 마케팅 동의 분리 규칙
- [`knowledge/i18n/korean-publishing.md`](../knowledge/i18n/korean-publishing.md) — 약관/동의 패턴
- [정보통신망법 제50조의2](https://www.law.go.kr/...)

---

#### 2. 비밀번호 필드 IME 활성화
**위치**: `src/screens/Signup.tsx:198`

**문제**: 비밀번호 입력 필드에 IME(한글 입력)이 활성화되어, 사용자가 영문 비밀번호 입력 시 한글 자모가 섞여 검증 실패.

**재현**:
1. 사용자가 비밀번호 `Hello123` 입력 의도
2. 한글 키보드 켜진 상태에서 `H`를 누르면 `ㅗ` 또는 `ㅎ` 입력됨
3. 사용자는 `Hello123`을 보고 있다고 생각하지만 서버는 `ㅗㅔㅣㅣㅗ123` 받음
4. 검증 실패 → 사용자 이탈

**왜 문제인가**:
- 사용자에게 보이지 않는 silent failure
- "분명 맞게 입력했는데 왜 안 되지?" → 이탈

**해결**:
```diff
- <input type="password" />
+ <input type="password" inputMode="text" lang="en" autoCapitalize="off" />
```

iOS Safari에서는 `lang="en"` 속성이 IME를 영문 모드로 전환합니다.

**참고**:
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — IME composition handling
- [`examples/component-input.md`](component-input.md) — Input spec

---

#### 3. 이메일 인증 후 form state reset
**위치**: `src/screens/Signup.tsx:312` (state management)

**문제**: 이메일 인증 코드 입력 단계에서 페이지 navigate 되면, 이전 form 입력값(이름, 휴대폰, 비밀번호)이 모두 초기화됩니다.

**재현**:
1. 사용자가 1페이지에 모든 정보 입력 완료
2. 이메일 코드 받기 위해 2페이지 navigate
3. 코드 입력 후 1페이지로 돌아오면 모두 빈 칸

**왜 문제인가**:
- 입력 다시 처음부터 — 정확한 이탈 트리거
- A/B 테스트 결과 (신규 가입 다단계의 default 이탈률) ~28% (n=4,521)

**해결**:
- React Router 사용 시 form state를 URL search params 또는 localStorage에 보관.
- 이메일 인증을 별도 화면 navigate 하지 말고 modal로 처리.

```tsx
// Option A: URL state
useSearchParams().set("email-verify", "true")

// Option B: in-place modal
<Modal open={verifyOpen}>...</Modal>  // Form state preserved
```

**참고**:
- [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md) — multi-step form 패턴
- [`examples/component-form.md`](component-form.md) — Form spec
- [`examples/component-modal.md`](component-modal.md) — modal 사용

---

### High (4건 — 이번 sprint 수정)

#### 4. 휴대폰 번호 검증 regex가 미국 형식
**위치**: `src/lib/validators.ts:23`

**문제**: 한국 010-####-#### 형식이 거부됩니다.

**해결**:
```ts
- /^\d{3}-\d{3}-\d{4}$/  // (123) 456-7890 ← US 형식
+ /^01[0-9]-?\d{3,4}-?\d{4}$/  // KR 010-####-####
```

**참고**: [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md)

---

#### 5. Submit button이 disabled로 시작
**위치**: `src/screens/Signup.tsx:405`

**문제**: 사용자가 모든 필드 채우기 전엔 submit button이 disabled 상태. 사용자가 button 클릭하면 무엇이 잘못됐는지 알려주지 않음.

**해결**: button을 항상 enabled로 두고, 클릭 시 invalid field로 focus 이동 + 에러 메시지 표시.

cite [`knowledge/patterns/form-design.md`](../knowledge/patterns/form-design.md).

---

#### 6. (이하 4건 생략)
...

### Medium (3건)
...

### Low (2건)
...

---

## 잘 작동하는 부분

- 헤더의 "회원가입" 타이틀이 명확하고 위치가 좋음 (h1 with proper hierarchy)
- 약관 링크가 새 탭으로 열려 form state 유지됨
- 입력 필드의 focus ring이 명확함 (3:1 contrast clear)
- 한글 입력 — 비밀번호 외 — 모두 정상

---

## Methodology

- **검토 기준**:
  - WCAG 2.1 AA
  - design-ai/PRINCIPLES.md 30 rules
  - 한국 정보통신망법 + e-commerce 법
- **테스트 환경**:
  - iOS 17.4 Safari (iPhone 14)
  - Android 14 Chrome (Galaxy S24)
  - 데스크톱 Chrome 124
- **Responsive scope**: mobile 360px / 390px, tablet 768px, and desktop 1440px viewports. Findings must state whether the issue is mobile-only, desktop-only, or cross-breakpoint.
- **Assistive technology scope**: screen reader pass covers field labels, error announcements, `aria-describedby`, and route-change focus restoration.
- **Tools**: axe-core, manual review, A/B 테스트 데이터 (Mixpanel)
- **Sample**: production 데이터 2026-04-01 ~ 2026-05-01, n=4,521 신규 가입 시도

---

## Appendix

- A. 12 발견 사항 전체 목록 (severity / location / cite)
- B. 각 발견에 대한 스크린샷 / 재현 동영상
- C. axe-core 자동 스캔 raw 결과
- D. A/B 테스트 데이터 raw

(Appendix omitted in this example — would be 5+ pages of detail.)
```

---

## Why this is a good audit report example

- **TL;DR가 답을 먼저 제시** — 12 문제, 우선 마케팅 동의부터.
- **Severity로 정렬** (Critical → High → Medium → Low), file-by-file 아닌 severity-by-severity.
- **각 발견은 위치 / 문제 / 왜 / 해결 / 참고** 5가지 항목 일관.
- **법적 issue를 별도 강조** (정보통신망법 위반).
- **Code diff 제공** — 즉시 적용 가능.
- **Knowledge file 인용** — 이유 + 참고로.
- **"잘 작동하는 부분"** — 균형 잡힌 보고서.
- **Methodology가 마지막** — 신뢰도 검증 가능하지만 본질은 위에 있음.
- **Don't bury the decision** — avoid putting methodology before TL;DR in audit reports.

Cite [`knowledge/patterns/report-design.md`](../knowledge/patterns/report-design.md) for the canonical structure.

## Cross-reference

- [`skills/ux-audit/PLAYBOOK.md`](../skills/ux-audit/PLAYBOOK.md)
- [`skills/design-system-qa/PLAYBOOK.md`](../skills/design-system-qa/PLAYBOOK.md)
- [`knowledge/patterns/report-design.md`](../knowledge/patterns/report-design.md)
- [`knowledge/i18n/korean-document-style.md`](../knowledge/i18n/korean-document-style.md) — Korean voice for reports

````

### examples/cases/dogfood-v4-korean-hr-onboarding.md

_Included 15469/15469 bytes._

````markdown
# Dogfood v4 — Korean B2B SaaS HR onboarding

End-to-end test of the design-ai v4.6 corpus on a realistic Korean B2B scenario. This is a *practical* run — every section invokes the skill / knowledge file it would in production, and the output is what an adopter would receive.

## Brief

> "팀온보딩" — Korean B2B SaaS HR app for small/mid companies (10–500 employees). The product handles new-employee onboarding: document collection (계약서, 신분증, 통장 사본), e-signature, IT account provisioning, first-week checklist. Audience: HR managers (primary), new hires (secondary). Brand voice: calm, professional, trust-driven (handling sensitive personal data). Primary brand color: muted teal `#0D9488`. Stack: shadcn-ui + Tailwind v4 + React 18. Locale: Korean primary; English UI for international hires (toggle). Density: comfortable. Light + dark.

Skills to invoke: `design-system-builder` → `color-palette` → `component-spec-writer` → `ux-audit`.

## Step 1 — Bootstrap tokens (via `design-system-builder`)

### Color tokens (cite [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md))

Brand seed: `#0D9488` (teal-600). Generated full ramp:

```yaml
# brand
brand-50:  #F0FDFA
brand-100: #CCFBF1
brand-200: #99F6E4
brand-300: #5EEAD4
brand-400: #2DD4BF
brand-500: #14B8A6
brand-600: #0D9488     # primary
brand-700: #0F766E
brand-800: #115E59
brand-900: #134E4A
brand-950: #042F2E

# neutral (cool-gray to pair with teal)
neutral-50:  #F9FAFB
neutral-100: #F3F4F6
neutral-200: #E5E7EB
neutral-300: #D1D5DB
neutral-400: #9CA3AF
neutral-500: #6B7280
neutral-600: #4B5563
neutral-700: #374151
neutral-800: #1F2937
neutral-900: #111827
neutral-950: #030712

# semantic — sensitive data context
success:  #10B981
warning:  #F59E0B
error:    #EF4444
info:     #3B82F6
```

### Semantic aliases (cite [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md))

```yaml
# light
--color-bg-default:        white
--color-bg-subtle:         neutral-50
--color-bg-muted:          neutral-100
--color-fg-default:        neutral-900
--color-fg-muted:          neutral-600
--color-fg-subtle:         neutral-400
--color-fg-on-brand:       white
--color-border-default:    neutral-200
--color-border-strong:     neutral-300
--color-brand-bg:          brand-600
--color-brand-bg-hover:    brand-700
--color-brand-fg:          white
--color-error-bg:          error
--color-error-fg:          white

# dark — invert with care; brand stays at -500 for legibility on dark
--color-bg-default:        neutral-900
--color-bg-subtle:         neutral-800
--color-fg-default:        neutral-50
--color-fg-muted:          neutral-400
--color-brand-bg:          brand-500   # NOT brand-600 in dark
```

Contrast verified per [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md):
- `fg-default` on `bg-default`: 17.79:1 (AAA ✓)
- `brand-fg` on `brand-bg`: 4.94:1 (AA large ✓; AA normal at -700: 6.96:1 ✓)
- `error-fg` on `error-bg`: 4.83:1 (AA large ✓)

### Typography (cite [`knowledge/i18n/korean-typography.md`](../../knowledge/i18n/korean-typography.md))

```css
font-family-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
                  system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo",
                  "Noto Sans KR", "Malgun Gothic", sans-serif;
font-family-mono: "JetBrains Mono", "D2Coding", monospace;
```

Type scale (base 14 product UI; +10% line-height for Korean per knowledge file):

| Variant | Size | Weight | Line-height (KR-bumped) |
| --- | --- | --- | --- |
| display | 32 | 700 | 1.32 |
| heading-lg | 24 | 600 | 1.42 |
| heading-md | 20 | 600 | 1.5 |
| heading-sm | 16 | 600 | 1.6 |
| body-lg | 16 | 400 | 1.65 |
| body | 14 | 400 | 1.65 |
| caption | 12 | 400 | 1.55 |

### Spacing / radius / elevation

```yaml
space: 4 8 12 16 20 24 32 40 48 64    # 9 stops, 4-base
radius: 0 4 6 8 12 16 999             # last is "pill"
elevation: 0 sm md lg xl              # 5 stops; subtle for B2B (less playful)
```

## Step 2 — Spec a component (via `component-spec-writer`)

The HR onboarding flow's first screen is "신규 입사자 정보 입력". Five fields: 이름 / 사번 / 입사일 / 부서 / 이메일. Three of these are FormControls. Let me spec the **EmployeeInfoForm** composition.

This exercises the v4.5 polished `form-control.md` spec end-to-end.

### EmployeeInfoForm — composition spec

```tsx
const actionRowSx = { mt: 3 };

<form onSubmit={handleSubmit}>
  <FormControl error={!!errors.name} required disabled={isSubmitting} fullWidth>
    <FormLabel htmlFor="name">이름</FormLabel>
    <OutlinedInput
      id="name"
      value={values.name}
      onChange={handleChange}
      aria-invalid={!!errors.name}
      aria-describedby={errors.name ? "name-error" : "name-help"}
    />
    <FormHelperText id={errors.name ? "name-error" : "name-help"}>
      {errors.name ?? "주민등록상 이름과 동일하게 입력해 주세요"}
    </FormHelperText>
  </FormControl>

  <FormControl error={!!errors.employeeId} required fullWidth>
    <FormLabel htmlFor="employeeId">사번</FormLabel>
    <OutlinedInput
      id="employeeId"
      value={values.employeeId}
      onChange={handleChange}
      placeholder="2026-001"
      aria-invalid={!!errors.employeeId}
    />
    <FormHelperText>인사 담당자에게 받은 사번을 입력해 주세요</FormHelperText>
  </FormControl>

  <FormControl required fullWidth>
    <FormLabel htmlFor="hireDate">입사일</FormLabel>
    <DatePicker id="hireDate" value={values.hireDate} onChange={handleChange} />
  </FormControl>

  <FormControl required fullWidth>
    <FormLabel htmlFor="department">부서</FormLabel>
    <Select id="department" value={values.department} onChange={handleChange}>
      <MenuItem value="engineering">개발</MenuItem>
      <MenuItem value="design">디자인</MenuItem>
      <MenuItem value="product">기획</MenuItem>
      <MenuItem value="hr">인사</MenuItem>
    </Select>
  </FormControl>

  <FormControl error={!!errors.email} required fullWidth>
    <FormLabel htmlFor="email">회사 이메일</FormLabel>
    <OutlinedInput
      id="email"
      type="email"
      value={values.email}
      onChange={handleChange}
      placeholder="hong@team-onboarding.kr"
    />
    <FormHelperText>{errors.email ?? "회사 도메인 이메일을 입력해 주세요"}</FormHelperText>
  </FormControl>

  <Stack direction="row" justifyContent="flex-end" gap={1} sx={actionRowSx}>
    <Button variant="outlined" onClick={handleCancel}>취소</Button>
    <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
      다음 단계
    </LoadingButton>
  </Stack>
</form>
```

### Korean text density adjustments (cite [`knowledge/typography/korean-typography.md`](../../knowledge/i18n/korean-typography.md))

- Field labels keep short (1-3 words). "이메일" not "이메일 주소를 입력해 주세요" — that goes in helper text.
- Helper text uses 해요체 ("입력해 주세요"). For legal forms (e.g., contract page), switch to 합쇼체 ("입력하시기 바랍니다") per [`knowledge/conversational/korean-voice-conventions.md`](../../knowledge/conversational/korean-voice-conventions.md).
- Min-height on FormControl rows: 56px (vs 48px Latin default) — Hangul reads taller per the knowledge file.

### Tokens consumed (per [`examples/component-form-control.md`](../component-form-control.md))

```
--color-fg-default
--color-fg-error
--color-fg-primary
--color-bg-default
--color-border-default
--color-border-strong
--space-md          /* horizontal padding */
--space-sm          /* helper-text margin-top */
--space-lg          /* between FormControls */
--font-size-body    /* 14px */
--line-height-body  /* 1.65 KR-bumped */
--radius-md
```

## Step 3 — Spec the document upload (uses Card + Dialog families)

Document collection screen needs a confirmation dialog before upload. Exercises v4.5's polished `dialog-title.md` / `dialog-content.md` / `dialog-actions.md`:

```tsx
const documentCardSx = { maxWidth: 480 };
const secondaryCopySx = { mt: 1 };
const documentListSx = { mt: 2 };

<Card sx={documentCardSx}>
  <CardContent>
    <Typography variant="h6">필수 서류 업로드</Typography>
    <Typography variant="body2" color="text.secondary" sx={secondaryCopySx}>
      계약서 · 신분증 · 통장 사본
    </Typography>

    <List sx={documentListSx}>
      {documents.map((doc) => (
        <ListItem
          key={doc.id}
          secondaryAction={
            doc.uploaded ? (
              <CheckIcon color="success" aria-label="업로드 완료" />
            ) : (
              <Button size="small" onClick={() => handleUpload(doc.id)}>
                업로드
              </Button>
            )
          }
        >
          <ListItemText primary={doc.name} secondary={doc.description} />
        </ListItem>
      ))}
    </List>
  </CardContent>
  <CardActions>
    <Button size="small" onClick={handleSkipForNow}>나중에 하기</Button>
    <Button size="small" variant="contained" onClick={handleSubmitAll}>
      제출하기
    </Button>
  </CardActions>
</Card>

{/* Confirmation dialog — uses v4.5 family-completed primitives */}
<Dialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  aria-labelledby="confirm-title"
  aria-describedby="confirm-desc"
  fullWidth
  maxWidth="sm"
>
  <DialogTitle id="confirm-title">서류를 제출할까요?</DialogTitle>
  <DialogContent>
    <DialogContentText id="confirm-desc">
      제출 후에는 인사팀 검토를 거쳐 변경이 어려워요. 모든 정보가 정확한지 확인해 주세요.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmOpen(false)}>다시 확인</Button>
    <LoadingButton
      onClick={handleConfirmSubmit}
      loading={isSubmitting}
      variant="contained"
      autoFocus
    >
      네, 제출할게요
    </LoadingButton>
  </DialogActions>
</Dialog>
```

Citations:
- [`examples/component-card-content.md`](../component-card-content.md) — Card body region
- [`examples/component-card-actions.md`](../component-card-actions.md) — Card action row (left-aligned)
- [`examples/component-list-item.md`](../component-list-item.md) — ListItem with secondaryAction
- [`examples/component-dialog-title.md`](../component-dialog-title.md) — required `id` for `aria-labelledby`
- [`examples/component-dialog-content.md`](../component-dialog-content.md) — `DialogContentText` with `id` for `aria-describedby`
- [`examples/component-dialog-actions.md`](../component-dialog-actions.md) — Cancel · Primary order (Korean / Western convention)

## Step 4 — UX audit (via `ux-audit` skill)

Quick audit of the bootstrap output:

| Issue | Severity | Resolution |
| --- | --- | --- |
| Field labels in 합쇼체 vs helper-text in 해요체 — register mismatch | MEDIUM | Standardized on 해요체 throughout (matches B2B onboarding tone, less stiff than 합쇼체) |
| `email` field has placeholder + helper text + error message → 3 strings competing | MEDIUM | Removed placeholder; rely on helper text. Placeholder disappears on focus, accessibility issue |
| No password field in initial draft | INFO | Out of scope for this screen; password set on email-verify step |
| `LoadingButton` not in our spec'd components | HIGH | Need spec for it OR reference MUI directly. Action: add to roadmap |
| Department `Select` with 4 options — should be radio? | LOW | 4 is borderline. Select OK on mobile (saves vertical space). Radio better on desktop. Acceptable |
| No "save draft" before "다음 단계" — risky if user navigates away | HIGH | Add auto-save on blur per [`knowledge/patterns/form-design.md`](../../knowledge/patterns/form-design.md) |

### Don't / avoid

- Don't use placeholder text as the only field instruction; it disappears on focus and weakens screen-reader support.
- Avoid hiding document-upload errors behind a generic toast. Inline status plus `aria-describedby` keeps the HR manager's recovery path visible.

### Conversational support notes

This screen can hand off to an HR assistant chat without changing the form contract. Primary intent examples: `upload_document`, `change_hire_date`, and `ask_required_documents`. Example utterance: "신분증은 어떤 파일 형식으로 올려야 하나요?" Turn-taking rule: answer the current question first, then offer one next action such as "파일 선택" or "인사팀에 문의". Fallback repair: when the assistant cannot identify the document type, ask one clarifying question and keep the user in the current step.

### QA and PR review notes

- Design-system QA: token checks cover color/spacing/type names, accessibility checks cover `aria-invalid` and focus order, and visual regression should snapshot light/dark EmployeeInfoForm plus mobile document upload in Storybook.
- Figma token sync: Figma variables should map to the semantic token aliases above, with `--color-brand-bg` and typography tokens treated as the source of truth for export/import reviews.
- Design PR review: changed files would include the form composition, document upload card, and dialog wiring. Impact is highest on HR manager onboarding completion and secondary on new-hire document submission. Validation should include keyboard-only flow, screen-reader labels, and responsive viewport checks.

## Step 5 — Stability review dogfood

Ran `/stability-review` mid-session to test:

```bash
$ python3 tools/audit/stability-review.py --today 2026-12
```

Output:
- 90 stable, 0 beta/experimental/deprecated.
- 1 file without metadata: `knowledge/COVERAGE.md` (generated artifact — false positive).
- No promotion candidates yet (all v4.x knowledge is stable from day one).
- 0 stale stable files at 7-month projection.

**Finding**: `knowledge/COVERAGE.md` showing as "missing stability" is noise. It's a generated index, not a knowledge document. Either:
1. Add `stability: stable` to the generator (signals "as fresh as the last regen").
2. Skip generated files in `stability-review.py`.

## Step 6 — What v4 enabled vs v3

| Capability | v3 dogfood (fintech) | v4 dogfood (HR) |
| --- | --- | --- |
| Form-Control composition spec | I had to invent | `component-form-control.md` exists; cited directly |
| Dialog-Title with `aria-labelledby` | I had to research | `component-dialog-title.md` makes the contract explicit |
| ListItem with secondaryAction | I conflated with ListItemButton | `component-list-item.md` clarifies the boundary |
| Card-Actions left-align convention | Unclear | `component-card-actions.md` documents it + cites Korean B2C precedent |
| Korean B2B tone (해요체 vs 합쇼체) | General KR knowledge | Specific to onboarding context — could use a knowledge file |
| Stability review | Manual | `/stability-review` automates |

## Output — what I'd hand to a developer

The above sections constitute the initial spec hand-off. Adopter receives:

1. Token JSON (color / typography / spacing / radius / elevation / motion).
2. EmployeeInfoForm composition spec (TypeScript).
3. Document upload card + confirmation dialog spec.
4. UX audit findings (6 issues categorized by severity).
5. Stability review report (no actions needed this quarter).

Total elapsed: ~30 min reading + composing for a senior-designer-equivalent hand-off. v3 dogfood took ~50 min for similar scope.

````
