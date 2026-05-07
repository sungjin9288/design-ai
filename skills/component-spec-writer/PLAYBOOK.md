# component-spec-writer — playbook

Produce a developer-ready spec sheet for a single UI component. Output is a markdown document that a frontend engineer can implement against without asking follow-up questions.

## When to use

- "Spec a `Banner` component for me."
- "We're adding a `MultiSelect`. Document the API."
- "Help me design the anatomy of a `CommandPalette`."

## Inputs (ask if missing)

1. **Component name** (canonical, kebab-case).
2. **Goal** — what user need it serves.
3. **Target framework** — `react`, `vue`, `svelte`, framework-agnostic. Default: react.
4. **Style system** — `tailwind`, `css vars`, `mui theme`, `antd token`. Default: css vars.
5. **Existing components in the system?** — to check naming consistency.

## Steps

### 1. Find references

Open [`knowledge/components/INDEX.md`](../../knowledge/components/INDEX.md). For the canonical name, locate the row. Open the source files for **all three** libraries that have it. Read enough to understand:

- Required vs optional props.
- Variants (size, color, type).
- States (default, hover, active, focus, disabled, loading, error).
- Composition (does it have sub-components like `Card.Header`, `Card.Body`?).
- Edge cases the libraries handle (empty state, overflow, RTL, long text).

If the component is **not** in the index, find the closest analogous component (e.g., `MultiSelect` ≈ shadcn `Select` + custom multi-mode).

### 2. Choose the canonical API

Compare APIs across the three references. Pick the cleanest. Bias rules:

- Boolean flags > enum strings when there are ≤ 2 options. (`disabled` not `state="disabled"`.)
- Enum strings > booleans when there are 3+ options. (`size="sm" | "md" | "lg"` not `small={bool}, medium={bool}`.)
- Composition > prop overload for layout-rich components. (`<Card><Card.Header /></Card>` not `<Card title={...} />`.)
- One callback per event type. (`onChange(value)` not `onChange(event)` for form fields where event is rarely needed.)

### 3. Define anatomy

Diagram the component's parts in markdown. Name each part:

```
Card
├── Card.Header
│   ├── Card.Title
│   └── Card.Actions
├── Card.Body
└── Card.Footer
```

Each part needs:
- A purpose sentence.
- Whether it's required.
- Default content if omitted.

### 4. Define states

For every interactive component, enumerate:

| State | Trigger | Visual change |
| --- | --- | --- |
| Default | resting | base styles |
| Hover | mouse over | slight bg shift, cursor change |
| Focus-visible | keyboard tab | 2px focus ring (cite [keyboard-and-focus.md](../../knowledge/a11y/keyboard-and-focus.md)) |
| Active | press | deeper bg shift |
| Disabled | `disabled` prop | reduced opacity, no events, `aria-disabled="true"` |
| Loading | `loading` prop | spinner replaces or overlays content |
| Error | `error` prop or invalid value | red border + error text |
| Read-only | `readOnly` prop | no border emphasis, no edit affordance |

Not every state applies to every component. Mark N/A.

### 5. Define variants

| Variant axis | Values | When to use |
| --- | --- | --- |
| `size` | `sm` / `md` / `lg` | sm in dense forms, md default, lg in marketing |
| `color` | `primary` / `secondary` / `danger` / `ghost` | one CTA per surface uses primary |
| `shape` | (component-specific) | |

### 6. Accessibility requirements

For each component, list:

- Semantic element (e.g., `<button>` not `<div role="button">`).
- ARIA attributes (`aria-label`, `aria-expanded`, `aria-haspopup`, `aria-controls`).
- Keyboard interactions (cite [keyboard-and-focus.md](../../knowledge/a11y/keyboard-and-focus.md) for the canonical pattern).
- Screen reader announcement on state change.
- Touch target size (≥ 44×44 for primary actions).

### 7. Tokens consumed

List every design token the component reads:

```
--color-primary-default
--color-primary-hover
--color-on-primary
--space-md
--radius-md
--transition-default
```

If a token does not exist in the system, **flag it** — don't silently invent.

### 8. Edge cases

- Empty state (no data, no value).
- Overflow (text too long, list too tall).
- Long content (truncate vs wrap).
- RTL behavior.
- Reduced motion (`prefers-reduced-motion`).
- High contrast mode.
- Print.

### 9. Output

Use [TEMPLATE.md](TEMPLATE.md). Verify:

- Every prop has a type, default, and one-line description.
- Every state has a visual rule.
- Every keyboard interaction is listed.
- Code example covers the most common usage.
- Don't section addresses 2–3 misuses.

## Source files this skill reads

- [`knowledge/components/INDEX.md`](../../knowledge/components/INDEX.md)
- [`knowledge/components/shadcn-registry.md`](../../knowledge/components/shadcn-registry.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md)
- Source files in `refs/` (cite the exact paths).

## Done when

- One markdown file, < 600 lines.
- Anatomy diagram + parts table.
- API table (props, types, defaults, descriptions).
- States table.
- Variants table.
- Tokens consumed list.
- Keyboard interactions.
- ARIA requirements.
- Code example.
- Edge cases section.
- "Don't" section.
