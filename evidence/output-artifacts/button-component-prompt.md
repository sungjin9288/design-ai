# design-ai task prompt

Task: Spec a Button component for a Korean SaaS dashboard

Recommended route: Component spec (medium confidence)
Route id: component-spec
Routing reason: Matched 3 keywords: component, button, spec.
Matched keywords: component, button, spec

Preferred command:

```text
/design-component-spec Spec a Button component for a Korean SaaS dashboard
```

Reference examples:
- examples/component-button.md — `Button` — spec
- examples/component-payment-brand-button.md — `PaymentBrandButton` (custom — Korean) — spec

Before producing the artifact, read these files in order:
- AGENTS.md
- commands/component-spec.md
- skills/component-spec-writer/SKILL.md
- skills/component-spec-writer/PLAYBOOK.md
- agents/component-architect.md
- agents/a11y-reviewer.md
- knowledge/PRINCIPLES.md
- knowledge/components/INDEX.md
- knowledge/components/shadcn-registry.md
- knowledge/a11y/keyboard-and-focus.md
- examples/component-button.md
- examples/component-payment-brand-button.md

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
design-ai check output.md --route component-spec --strict
```

Verification checklist:
- [ ] Confirm the selected route, command, and files read before producing the artifact.
- [ ] Cite checked knowledge files for material design decisions.
- [ ] State assumptions and unresolved inputs explicitly.
- [ ] Include accessibility notes for contrast, keyboard/focus, touch targets, and screen-reader behavior where relevant.
- [ ] Include responsive behavior for mobile and desktop where relevant.
- [ ] Run the route playbook verification checklist before final output.
- [ ] Cover anatomy, variants, states, API, tokens, ARIA, keyboard behavior, and edge cases.
- [ ] Cite Ant Design, MUI, and shadcn-ui references when available.
- [ ] Include at least one implementation-oriented example.
