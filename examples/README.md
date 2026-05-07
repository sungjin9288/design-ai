# Examples

Worked outputs from each skill — what "good" looks like. Use as reference when invoking the skill on your own task.

### Color & tokens

| File | Skill | Input | What it demonstrates |
| --- | --- | --- | --- |
| [palette-saas-violet.md](palette-saas-violet.md) | `color-palette` | B2B SaaS, violet seed `#7C3AED` | Full palette with OKLCH ramps, semantic aliases, light + dark, contrast matrix, Tailwind v4 + shadcn-ui + Style Dictionary outputs, use guidance |

### Component specs (synthesized from Ant Design + MUI + shadcn-ui)

| File | Component | What it covers |
| --- | --- | --- |
| [component-button.md](component-button.md) | Button | The most-used control. Variants, intent, sizes, loading state, asChild pattern. |
| [component-input.md](component-input.md) | Input (text field) | Label/help/error, validation timing, autocomplete, IME (Korean) handling, password/clearable affordances. |
| [component-modal.md](component-modal.md) | Modal / Dialog / Sheet | Focus trap, scroll lock, keyboard contract, three variants in one spec (dialog/alert-dialog/sheet). |
| [component-toast.md](component-toast.md) | Toast / Snackbar | Imperative API (`toast.success(...)`), promise wrapper, intent + duration matrix, persistent errors. |
| [component-card.md](component-card.md) | Card | Composition slots, variants, interactive cards, block-link pattern, when NOT to use a card. |
| [component-form.md](component-form.md) | Form (composition pattern) | Field/Label/Control/HelpText/ErrorText composition, Zod schema validation, multi-step, server-error mapping, accessibility wiring. |
| [component-table.md](component-table.md) | Table / DataTable | Headless engine (TanStack), sort/select/paginate, density, mobile→card-list, sticky columns. |
| [component-tabs.md](component-tabs.md) | Tabs | Underline / segmented / card / bottom-bar variants, WAI-ARIA tabs pattern, manual vs automatic activation. |
| [component-date-picker.md](component-date-picker.md) | DatePicker | Single/range/dateTime/quickRange modes, Korean date formats, calendar grid keyboard contract, mobile bottom sheet. |
| [component-select.md](component-select.md) | Select / Combobox | Single/multi/searchable/creatable/async, WAI-ARIA combobox pattern, Korean IME composition handling. |
| [component-pagination.md](component-pagination.md) | Pagination | Numbered + Load More + simple variants, sibling/boundary algorithm, URL sync, accessibility. |
| [component-alert.md](component-alert.md) | Alert (Banner) | Persistent in-page feedback. Subtle/outlined/solid variants, intent + icon redundancy, action buttons, role=alert vs status. |
| [component-tooltip.md](component-tooltip.md) | Tooltip | Hover/focus hint, why native `title` is wrong, touch handling, WAI-ARIA tooltip pattern, when NOT to use. |
| [component-form-controls.md](component-form-controls.md) | Switch / Checkbox / Radio | Three sibling controls in one spec — semantic differences, when each, shared accessibility patterns, Korean marketing-consent rule. |
| [component-skeleton.md](component-skeleton.md) | Skeleton | Loading shape (not progress %), shimmer animation, primitive composition, transition rules, reduced motion. |
| [component-progress.md](component-progress.md) | Progress | Linear + circular, determinate vs indeterminate, intent variants, aria-valuenow rules, when Progress vs Spinner vs Skeleton. |
| [component-avatar.md](component-avatar.md) | Avatar | Image → initials → icon fallback chain, Korean initials convention, AvatarGroup overlap, status indicators, hash-to-color. |
| [component-breadcrumb.md](component-breadcrumb.md) | Breadcrumb | Hierarchy navigation, truncation algorithm, when not to use (mobile), aria-current="page", ordered list semantics. |
| [component-accordion.md](component-accordion.md) | Accordion (Collapse) | Single vs multiple, four visual variants, height animation via grid-template-rows, WAI-ARIA disclosure pattern. |
| [component-drawer.md](component-drawer.md) | Drawer | Side-anchored panel for navigation. Modal vs persistent mode, mobile detents, swipe-to-dismiss. |
| [component-slider.md](component-slider.md) | Slider | Single + range, step semantics, when slider vs number input, WAI-ARIA slider pattern. |
| [component-popover.md](component-popover.md) | Popover | Click-triggered overlay with interactive content. Distinct from Tooltip / Modal / Dropdown. |
| [component-divider.md](component-divider.md) | Divider (Separator) | Horizontal + vertical, solid/dashed/dotted, inset, decorative vs semantic, when whitespace is better. |
| [component-steps.md](component-steps.md) | Steps (Stepper) | Multi-step progress visualization. Status states, mobile compact variant, when Steps vs Tabs vs Progress. |
| [component-rate.md](component-rate.md) | Rate (Rating) | Stars / emoji / custom icons. Input + display modes, half-star precision, slider-pattern a11y. |

### Custom components (Korean fintech / commerce)

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-amount-input.md](component-amount-input.md) | AmountInput | KRW-aware currency input. Auto-format, paste handling, IME composition, quick chips, max-balance affordance. |
| [component-address-input.md](component-address-input.md) | AddressInput | Korean address with Daum Postcode lookup. Two-line structure (zip + main + detail), 도로명/지번 toggle. |

### End-to-end deliverables

| File | Skill | Demonstrates |
| --- | --- | --- |
| [dogfood-korean-fintech-system.md](dogfood-korean-fintech-system.md) | `design-system-builder` | Full design system bootstrap for a Korean fintech mobile app. Token cascade + foundations + component baseline + starter set + handoff. |

## How to use these

These are **reference shapes**, not templates to copy verbatim. When invoking a skill:

1. Note the structure (which sections appear, in what order).
2. Note the specificity (every claim has a number or a citation).
3. Note the tradeoffs section (every choice has a "why this and not the obvious alternative").

Adapt to your input.
