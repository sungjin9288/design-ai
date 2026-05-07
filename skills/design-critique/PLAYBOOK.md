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
