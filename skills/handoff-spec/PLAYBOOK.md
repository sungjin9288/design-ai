# handoff-spec — playbook

Produce a developer handoff document from a finalized design. The output is a single markdown file an engineer can implement against without follow-up questions.

## When to use

- Design is approved and ready to ship; engineering needs a spec.
- A Figma file has 6+ screens and devs keep DM'ing for clarifications.
- Cross-team handoff (design → another team's eng).

## Inputs (ask if missing)

1. **Designs** — Figma link or screenshots of the final state.
2. **Scope** — single feature, full screen, multi-screen flow.
3. **Tech stack** — for code-side conventions (Tailwind class hints, MUI props, etc.).
4. **Existing design system?** — if yes, name it and let the spec reference tokens; if no, inline the values.
5. **Audience** — frontend dev, full-stack, design engineer.

## Steps

### 1. Inventory

List every screen and every reusable component on each. If components are repeated, note them once and reference.

### 2. For each screen, document

- **Purpose** — one sentence on what the screen accomplishes.
- **Entry points** — how the user reaches it (route, button, deep link).
- **Exit points** — what actions navigate away and where.
- **Layout** — wireframe diagram + breakpoints behavior.
- **States** — empty, loading, error, success, partial data.
- **Edge cases** — what happens with very long content, zero items, network failure.

### 3. For each component, document

If it's an existing system component, just reference it: "Use `<Button intent='primary' size='lg'>` from our system." Don't re-spec.

If it's new, follow the [`component-spec-writer`](../component-spec-writer/PLAYBOOK.md) skill's playbook to produce a full sub-spec.

### 4. Document interactions

For every interactive element, document:

| Element | Trigger | Action |
| --- | --- | --- |
| `Save` button | click / `Enter` while focused | Persist form, show toast on success, redirect to detail page |
| `Discard` link | click | Open confirmation modal; on confirm, route to list |

### 5. Document data and content

- **Data shape** — what does the server return? What's required vs optional?
- **Content rules** — character limits, validation rules, empty-string behavior.
- **i18n** — keys used, plurals, RTL considerations.
- **Tone** — formal/casual; example copy that hits the bar.

### 6. Document responsive behavior

For each breakpoint (xs/sm/md/lg/xl), describe:
- Layout changes (column count, sidebar collapse, nav transformation).
- Component swaps (e.g., "tabs become accordion below `md`").
- Hidden / shown elements.

### 7. Document a11y requirements

- Semantic HTML expected (which `<h1>` / `<nav>` / `<main>` lives where).
- Keyboard interaction map (what `Tab` reaches, in what order).
- ARIA roles / properties for complex widgets.
- Focus management (where focus goes on route change, modal open/close).
- Announcements (live regions for toast/error).

### 8. Document analytics events (if applicable)

| Event name | Trigger | Properties |
| --- | --- | --- |
| `signup_completed` | After successful signup | `method`, `referrer`, `plan` |

### 9. Open questions (be explicit)

Don't leave decisions implicit. List anything ambiguous:

> **Open**: When the user has 0 saved items, do we show the empty state OR auto-redirect to onboarding? Need product to decide before ship.

### 10. Output

```markdown
# Handoff: <feature name>

> Designs: <link>
> System: <existing? name?>
> Stack: <stack>
> Owner: <name>
> Status: ready-for-implementation

## Summary
<3 sentences: what this is, who it's for, what done looks like>

## Screens
### <Screen 1 name>
- Purpose:
- Entry/Exit:
- Layout (with sketch):
- States:
- Edge cases:

### <Screen 2 name>
...

## Components
### <Component A>
- (existing system component, no re-spec) | (full sub-spec inline)

## Interactions
<table>

## Data and content
- ...

## Responsive
- xs: ...
- md: ...
- xl: ...

## Accessibility
- ...

## Analytics
<table or skip>

## Open questions
- [ ] <question>

## References
- Designs: <link>
- Component system: <link>
- Token reference: knowledge/design-tokens/...
```

## Source files this skill reads

- [`knowledge/components/INDEX.md`](../../knowledge/components/INDEX.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md)
- [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md)
- [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md)
- [`knowledge/motion/principles.md`](../../knowledge/motion/principles.md) — animation specs
- [`knowledge/patterns/form-design.md`](../../knowledge/patterns/form-design.md) — when forms are involved
- [`knowledge/i18n/korean-product-conventions.md`](../../knowledge/i18n/korean-product-conventions.md) — Korean apps

## Verification phase (run before declaring done)

- [ ] Every screen has: purpose, entry/exit, layout, states, edge cases?
- [ ] Every component is either a system reference OR has an inline sub-spec?
- [ ] Are interactions documented as a table (element / trigger / action)?
- [ ] Is responsive behavior named per breakpoint (xs / sm / md / lg / xl)?
- [ ] Are a11y requirements explicit (semantic HTML, ARIA, keyboard, focus management)?
- [ ] Are analytics events listed (or explicitly "none for v1")?
- [ ] Are open questions listed (not implicit)?
- [ ] Could an engineer implement without DM'ing the designer? (If unsure, you've left an open question.)
- [ ] Are design tokens referenced by name, not inlined as hex?

## Done when

- One markdown file, end-to-end.
- Every screen has purpose, layout, states, edge cases.
- Every component has a system-reference OR a sub-spec.
- Interactions table is complete.
- Responsive behavior is named per breakpoint.
- A11y requirements are explicit.
- Open questions are listed (or "none").
- An engineer would not need to ask design follow-up questions to implement.
- The verification phase checklist passes.
