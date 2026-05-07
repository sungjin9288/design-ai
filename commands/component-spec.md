---
description: Produce a developer-ready spec for a UI component by comparing implementations across Ant Design, MUI, and shadcn-ui.
---

Produce a full developer-ready spec for the component named in `$ARGUMENTS`.

## Input

Parse `$ARGUMENTS`. Expect a component name (canonical, kebab-case). Optionally followed by:
- target framework (`react` | `vue` | `svelte`, default `react`)
- style system (`tailwind` | `mui` | `antd` | `css-vars`, default `css-vars`)

If ambiguous, ask one clarifying question.

## Steps

1. Look up the component in [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md). Find references in all three libraries (or the closest analogous component if it's not indexed).

2. Apply the [`component-spec-writer` playbook](../skills/component-spec-writer/PLAYBOOK.md):
   - Find references → choose canonical API → define anatomy → states → variants → tokens → a11y → edge cases.

3. Output using [`skills/component-spec-writer/TEMPLATE.md`](../skills/component-spec-writer/TEMPLATE.md).

## Done when

- Anatomy diagram + parts table.
- API table (props, types, defaults, descriptions).
- States, Variants tables.
- Tokens consumed list.
- Accessibility (semantic, ARIA, keyboard, touch).
- Code example for the most common usage.
- Edge cases section.
- Don't section with 2–3 misuses.
- All referenced from the three libraries cited by file path.
