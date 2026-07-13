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

### 6.5. Escalate interaction craft when needed

If the artifact includes implemented motion, rapid repeated input, anchored overlays, direct manipulation, or a request to make the UI feel more polished, apply [`knowledge/patterns/interface-craft.md`](../../knowledge/patterns/interface-craft.md) and the [`design-engineering-review`](../design-engineering-review/PLAYBOOK.md) contract.

Do not infer interaction quality from a screenshot. Mark response, interruptibility, reduced motion, and coarse-pointer behavior as `unverified` until code or runtime evidence is available.

For an escalated craft audit, append the complete eight-lens `Craft scorecard` and use the required `Before / After / Why / Verification` finding table from `design-engineering-review`. Map priorities without creating two competing severity systems: Critical = P0, High = P1, Medium = P2, Low = P3.

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

## Craft scorecard
<required only when interaction craft is escalated; all eight lenses with evidence>

## Craft findings
| Priority | Location | Before | After | Why | Verification |
| --- | --- | --- | --- | --- | --- |

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
- [`knowledge/patterns/interface-craft.md`](../../knowledge/patterns/interface-craft.md) — when auditing implemented interaction quality
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
- [ ] If implemented interaction craft is in scope, did I provide runtime/code evidence or mark it unverified?
- [ ] If interaction craft was escalated, is the eight-lens scorecard complete and does every craft finding include Before / After / Why / Verification?

## Done when

- One report file with summary + 4 severity sections + "things that work well".
- Every issue has: where, what, why, fix, citation.
- Every Critical issue has at least one knowledge/ or WCAG citation.
- The report names the user goal up top.
- The report is **specific** — no "could be improved" without a stated alternative.
- An escalated interaction-craft report includes the complete scorecard and P0–P3 finding contract.
- The verification phase checklist passes.
