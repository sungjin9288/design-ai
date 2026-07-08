# design-system-builder — playbook

Bootstrap a complete design system from a brand brief. Output is a directory of design tokens, foundational guidelines, and a starter component set.

## When to use

- "We're starting a new product, build the design system."
- "Migrate our hardcoded styles into a token system."
- "I have these brand colors and fonts — turn it into a system."

## Inputs (ask if missing)

1. **Product type / category** — SaaS, e-commerce, fintech, etc. Use to seed palette and density.
2. **Brand inputs**:
   - Primary brand color (hex).
   - Optional: secondary color, font preferences, mood words.
3. **Target framework** — `tailwind v4`, `shadcn-ui`, `mui`, `antd`, `css variables`, `style dictionary`.
4. **Content language(s)** — affects type system (Korean line-height, RTL).
5. **Density default** — comfortable / compact.
6. **Light + dark, or light only?** — default both.
7. **Agent surfaces** — optional target agents, MCP tools, preview/export formats, and any external references to mine.

## Steps

### 1. Seed from a curated row

Open [`knowledge/colors/palettes-by-product-type.md`](../../knowledge/colors/palettes-by-product-type.md). Find the closest product-type row. Use it as a reference shape — not values to copy. The user's brand color overrides the primary.

### 2. Build tokens — color

Invoke the `color-palette` skill (or its playbook) with the brand color as seed. Get back:
- Brand ramps (primary, accent, neutrals)
- Semantic aliases (light + dark)
- Contrast matrix

### 3. Build tokens — typography

- Pick a font pairing from [`knowledge/typography/font-pairings.md`](../../knowledge/typography/font-pairings.md) by mood.
- Build the type scale using base 14 (product UI) or 16 (marketing). Ratio 1.25 (major third) is the safe default. See [`knowledge/typography/type-scale-fundamentals.md`](../../knowledge/typography/type-scale-fundamentals.md).
- Define 5–7 named variants: `display`, `heading-lg`, `heading-md`, `heading-sm`, `body-lg`, `body`, `caption`.
- Each variant has: family, weight, size, line-height, letter-spacing, casing.

For Korean content: bump line-heights by 10%.

### 4. Build tokens — spacing, radius, elevation, motion

Spacing: 4-base scale, 9 stops (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`). See [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md).

Radius:
- `radius-none: 0`
- `radius-sm: 4px`
- `radius-md: 6–8px` (system default)
- `radius-lg: 12px`
- `radius-full: 9999px`

Elevation (4 levels):
- `elevation-0`: `none`
- `elevation-1`: `0 1px 2px rgba(0,0,0,0.06)`
- `elevation-2`: `0 4px 8px rgba(0,0,0,0.08)`
- `elevation-3`: `0 12px 24px rgba(0,0,0,0.12)`

In dark mode, replace shadow with subtle border + elevated background.

Motion:
- `motion-fast: 150ms`
- `motion-default: 250ms`
- `motion-slow: 400ms`
- `easing-default: cubic-bezier(0.4, 0, 0.2, 1)` (standard)
- `easing-emphasized: cubic-bezier(0.2, 0, 0, 1)` (emphasized accelerate)

Cite Ant Design's motion easings ([`knowledge/design-tokens/ant-design.md`](../../knowledge/design-tokens/ant-design.md)) — they ship a tested set.

### 5. Define foundations document

Write a `FOUNDATIONS.md` with:
- Color usage rules (when to use primary vs accent).
- Typography hierarchy rules.
- Iconography (set choice — Material symbols, Lucide, custom — and stroke/size rules).
- Voice and tone (1 paragraph or skip).
- Layout grid (12-col, 24px gutter, 24px margin scaling).
- Density modes if applicable.

### 5.5. Define the agent-readable brand contract

If the system will be used by coding agents, output a `DESIGN.md` alongside the foundations docs. Use [`knowledge/patterns/agentic-design-workflows.md`](../../knowledge/patterns/agentic-design-workflows.md) for the contract shape.

`DESIGN.md` should be short enough for an agent to read every time and must include:

- brand promise and target audience
- color roles and contrast constraints
- typography, spacing, radius, elevation, and density rules
- component defaults and forbidden variants
- motion personality, duration tiers, and reduced-motion policy
- voice, imagery, and anti-patterns
- artifact modes the system supports: prototype, dashboard, deck, image, video, component spec, or handoff report

Do not copy an external brand system. If the user supplies Open Design, React Bits, WWIT, or other references, mine only the taxonomy and decision rules.

### 6. Pick component baseline

Recommend a baseline based on the framework choice:
- **shadcn-ui** for new React projects with Tailwind. Copy the components, adapt tokens.
- **MUI** for React projects needing rich pre-built widgets (date pickers, data grids).
- **Ant Design** for enterprise/dense/Chinese-market or where Form, Table, Tree need to be production-grade out of the box.
- **Custom (Radix + Tailwind)** if the team has senior FE bandwidth.

Don't recommend more than one — pick the strongest fit and explain why.

### 7. List the starter component set

Pick the right starter set for the product category. Don't ship a 30-component v1 if 12 will do. Don't ship a 12-component v1 if you're building a fintech that needs AmountInput on day 1.

#### Always-needed core (every system, no exceptions)

- Button (3 sizes × 4 intents)
- Input, Textarea
- Select / Combobox
- Checkbox, Radio, Switch
- Card
- Modal / Sheet
- Toast
- Form (Field/Label/Control composition — see [examples/component-form.md](../../examples/component-form.md))
- Alert (4 intents: info, success, warning, error)
- Skeleton, EmptyState
- Tooltip
- Badge, Tag

#### Category-specific extensions

| Category | Add to core |
| --- | --- |
| **Consumer mobile (B2C)** | Bottom-tab-bar, top-app-bar, list item primitives, pull-to-refresh, swipe actions, quick action sheet, biometric gate (KR fintech) |
| **B2B SaaS / dashboard** | Table (TanStack), advanced filter bar, column visibility menu, bulk-action bar, breadcrumb, pagination, sidebar nav, command palette (`Cmd+K`) |
| **Fintech consumer** | All consumer mobile + AmountInput, AmountDisplay (hero), TransactionListItem, AccountCard, CategoryPicker, PaymentMethodSelector, biometric gate, 본인인증 modal |
| **E-commerce** | Product card grid, AddToCart button, QuantityStepper, Price (with discount), ImageGallery, ProductOptionPicker (size/color), CartSummary, Address autocomplete (Daum Postcode for KR) |
| **Content / Publishing** | Article header, byline, table-of-contents, share menu, comment thread, reaction bar, related-articles list |
| **Marketing / Landing** | Hero block, FeatureGrid, TestimonialCarousel, PricingCards, FAQ accordion, NewsletterCTA, Banner (announcement bar) |
| **Productivity / Tools** | Sidebar with collapsible nav, command palette, keyboard-shortcut display, progress bar, activity log, mention picker |
| **Social / Community** | Post composer, FeedItem, reactions, comment thread, mention/hashtag autocomplete, infinite-scroll feed, follow button |
| **Health / Wellness** | Tracker chart (line + area), goal progress ring, streak indicator, reminder card, log entry list |

#### Marked component status

Format the list as:

```
| Component | Status | Source |
| --- | --- | --- |
| Button | derived | shadcn-ui baseline + token override |
| Input | derived | shadcn-ui baseline |
| AmountInput | custom | spec via `component-spec-writer` (Phase 2) |
| TransactionListItem | custom | spec via `component-spec-writer` (Phase 2) |
```

The custom ones go on the **Phase 2** spec list to be authored next via `component-spec-writer`.

#### Worked example

For a Korean fintech consumer app, the starter set is articulated in [`examples/dogfood-korean-fintech-system.md`](../../examples/dogfood-korean-fintech-system.md). Use it as a structural reference.

### 8. Output structure

Produce a directory:

```
design-system/
├── DESIGN.md             # agent-readable brand contract
├── tokens/
│   ├── color.css        # all color tokens, light + dark
│   ├── typography.css
│   ├── spacing.css
│   ├── radius.css
│   ├── elevation.css
│   ├── motion.css
│   └── tokens.json       # Style Dictionary source
├── foundations/
│   ├── color.md
│   ├── typography.md
│   ├── spacing.md
│   ├── iconography.md
│   └── motion.md
├── components/
│   └── README.md         # baseline choice + starter set list
├── README.md             # how to consume the system
└── CHANGELOG.md          # versioned token changes (start at v0.1.0)
```

If the user just wants a single document instead of a directory, condense into one markdown file in the same order.

### 9. Validate

Before declaring done, verify:
- Every semantic color token has a contrast number.
- Light and dark are both populated.
- Type scale has line-heights AND letter-spacing.
- Motion has both duration and easing.
- README explains how to consume (CSS import / Tailwind config / MUI ThemeProvider).

## Source files this skill reads

- [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md)
- [`knowledge/colors/palettes-by-product-type.md`](../../knowledge/colors/palettes-by-product-type.md)
- [`knowledge/typography/type-scale-fundamentals.md`](../../knowledge/typography/type-scale-fundamentals.md)
- [`knowledge/typography/font-pairings.md`](../../knowledge/typography/font-pairings.md)
- [`knowledge/typography/mui-type-scale.md`](../../knowledge/typography/mui-type-scale.md)
- [`knowledge/layout/spacing-and-grid.md`](../../knowledge/layout/spacing-and-grid.md)
- [`knowledge/design-tokens/ant-design.md`](../../knowledge/design-tokens/ant-design.md)
- [`knowledge/components/INDEX.md`](../../knowledge/components/INDEX.md)
- [`knowledge/motion/principles.md`](../../knowledge/motion/principles.md)
- [`knowledge/patterns/agentic-design-workflows.md`](../../knowledge/patterns/agentic-design-workflows.md)
- [`knowledge/i18n/korean-typography.md`](../../knowledge/i18n/korean-typography.md) (Korean content)
- [`knowledge/i18n/korean-product-conventions.md`](../../knowledge/i18n/korean-product-conventions.md) (Korean content)
- [`knowledge/platforms/react-native.md`](../../knowledge/platforms/react-native.md) (RN target)

## Verification phase (run before declaring done)

- [ ] Did I cite at least one knowledge file per major domain (color, typography, spacing, motion)?
- [ ] Are tokens named by **role** in the semantic layer, not by hex value?
- [ ] Does the contrast matrix flag pass/fail for every UI-relevant pair?
- [ ] Light AND dark are both populated (when both requested)?
- [ ] Type scale has line-height AND weight AND letter-spacing?
- [ ] If Korean content: did I apply +10% line-height bump? Recommend Pretendard?
- [ ] If RN target: did I provide tokens as numbers (not strings)?
- [ ] Did I pick exactly **one** component baseline with rationale (not multiple)?
- [ ] Is the starter set sized for the product category (consumer mobile vs B2B SaaS)?
- [ ] Does each starter component have a status (derived / custom)?
- [ ] Did I include foundations docs (color, type, spacing, motion, iconography)?
- [ ] If agent consumption is expected: did I include `DESIGN.md` with artifact modes and anti-patterns?
- [ ] Is the engineering hand-off list specific (commands, configs, vendor SDKs)?

## Done when

- Token files in the requested format(s).
- Foundations docs cover color, type, spacing, motion, iconography.
- Agent-readable `DESIGN.md` exists when the system will be consumed by AI agents.
- Component baseline is named with one-paragraph rationale.
- Starter component list with derived/custom labels and category-appropriate scope.
- A consumer (frontend dev) can import and start building without questions.
- The verification phase checklist passes.
