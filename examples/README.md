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
| [component-tag-badge.md](component-tag-badge.md) | Tag + Badge | Two sibling status indicators in one spec. Inline label vs dot/count overlay. |
| [component-tree.md](component-tree.md) | Tree (TreeView) | Hierarchical data, async lazy-load, check + select modes, WAI-ARIA tree pattern, mobile drill-in alternative. |
| [component-statistic.md](component-statistic.md) | Statistic | Hero KPI display. Delta semantics (goalDirection-aware coloring), Korean stock convention, sparkline. |
| [component-upload.md](component-upload.md) | Upload | Drop zone + button + avatar patterns. Per-file progress, async validation, retry, Korean copy. |
| [component-result.md](component-result.md) | Result + Empty | Two sibling full-page components in one spec. Status icons, primary/secondary actions, inline mode. |
| [component-carousel.md](component-carousel.md) | Carousel | When NOT to use. Multi-slide view, auto-play warnings, WAI-ARIA carousel pattern. |
| [component-image.md](component-image.md) | Image | Wrapper with lazy load, aspect-ratio, fallback, lightbox, srcset, alt rules. |
| [component-calendar.md](component-calendar.md) | Calendar (full month view) | Distinct from DatePicker. Event rendering, holiday/weekend Korean colors, view modes. |
| [component-cascader.md](component-cascader.md) | Cascader (multi-level select) | 2–4 level hierarchy picker. When NOT to use (mobile drill-in instead). |
| [component-color-picker.md](component-color-picker.md) | ColorPicker | HSV square + hue slider, hex/rgb/hsl/oklch inputs, presets, alpha. |
| [component-transfer.md](component-transfer.md) | Transfer (dual list) | Permission/tag editor pattern. When NOT to use (Multi-Select instead). |
| [component-spin.md](component-spin.md) | Spin (Spinner) | Indeterminate loading. Distinct from Skeleton/Progress. Delay to avoid flash, reduced motion. |
| [component-segmented.md](component-segmented.md) | Segmented (toggle button group) | iOS-native pill, time/view filters, WAI-ARIA radiogroup pattern. |
| [component-autocomplete.md](component-autocomplete.md) | AutoComplete | Free-text + suggestions. Distinct from Select. Korean IME composition handling. |
| [component-mention.md](component-mention.md) | Mention (@-trigger) | Trigger char (@/#/:) opens picker, chip insertion. Storage formats, IME. |
| [component-timeline.md](component-timeline.md) | Timeline | Sequential events: order tracking, activity feed, audit log. Status indicators. |
| [component-tour.md](component-tour.md) | Tour (in-product overlay) | Step-by-step UI walkthrough. When NOT to use (most cases). |
| [component-affix.md](component-affix.md) | Affix (sticky positioning) | When CSS `position: sticky` isn't enough. Container-scoped sticky. |
| [component-float-button.md](component-float-button.md) | FloatButton (FAB) | Floating action button. Speed-dial menu, safe-area handling. |
| [component-qrcode.md](component-qrcode.md) | QRCode | Encoding strings as QR. Error correction levels, center logo, color contrast. |
| [component-splitter.md](component-splitter.md) | Splitter (resizable panel) | When CSS sticky isn't enough. IDE / 3-pane layouts. |
| [component-anchor.md](component-anchor.md) | Anchor (scrollspy / TOC) | Side-rail nav for long-form content. Active section detection. |
| [component-app-bar.md](component-app-bar.md) | AppBar (top app bar) | Persistent top header. iOS large-title variant, search overlay, sub-tabs. |
| [component-layout.md](component-layout.md) | Layout (page chrome) | Header / Sidebar / Content / Footer slots. Responsive sider collapse. |
| [component-input-otp.md](component-input-otp.md) | InputOTP (verification code) | Multi-cell digit input. Korean SMS verification flow, autocomplete=one-time-code. |
| [component-watermark.md](component-watermark.md) | Watermark | Repeating overlay for sensitive content. Per-user trace, screenshot deterrent. |
| [component-code.md](component-code.md) | Code (inline + block) | Monospace text + syntax highlighting + copy button. |
| [component-typography.md](component-typography.md) | Typography (text primitive) | Variant-driven text. When NOT to use (Tailwind utility classes are usually clearer). |

### Documentation components

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-callout.md](component-callout.md) | Callout (doc info/warning/note) | Distinct from Alert. note/tip/info/warning/danger/success types, Korean header conventions. |
| [component-blockquote.md](component-blockquote.md) | Blockquote | Attributed quotations. Italic Latin / weight-shift Korean. |
| [component-doc-page.md](component-doc-page.md) | DocPage (doc-site layout) | Header + sidebar + body + right TOC + footer. Distinct from product app Layout. |
| [component-email-layout.md](component-email-layout.md) | EmailLayout | Table-based responsive email scaffolding. Bulletproof button, preheader, Korean spam law. |
| [component-descriptions.md](component-descriptions.md) | Descriptions (key-value list) | Static read-only multi-row labels + values. dl semantics, Korean labels. |
| [component-hero-block.md](component-hero-block.md) | HeroBlock (landing hero) | Headline + sub-headline + CTA + visual. 4 layouts, video/image variants, Korean conventions. |
| [component-feature-grid.md](component-feature-grid.md) | FeatureGrid | 3-up/4-up feature cells. Icon + title + description per cell. Mobile stacks. |
| [component-testimonial-carousel.md](component-testimonial-carousel.md) | TestimonialCarousel | Customer quotes. single-large / 3-up-grid / auto-scroll variants. Don't fabricate. |
| [component-pricing-cards.md](component-pricing-cards.md) | PricingCards | 2–4 pricing tiers with anchoring, monthly/annual toggle, Korean subscription disclosure. |

### Custom components (Korean fintech / commerce)

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-amount-input.md](component-amount-input.md) | AmountInput | KRW-aware currency input. Auto-format, paste handling, IME composition, quick chips, max-balance affordance. |
| [component-address-input.md](component-address-input.md) | AddressInput | Korean address with Daum Postcode lookup. Two-line structure (zip + main + detail), 도로명/지번 toggle. |
| [component-biometric-gate.md](component-biometric-gate.md) | BiometricGate | Face ID / Touch ID / fingerprint gate for fintech app launch + sensitive flows. OS API integration, fallback to PIN. |
| [component-payment-method-selector.md](component-payment-method-selector.md) | PaymentMethodSelector | Korean payment method selector. Audience-driven ordering (consumer vs B2B), saved cards, amount-based filtering. |
| [component-payment-brand-button.md](component-payment-brand-button.md) | PaymentBrandButton | Brand-styled CTA for KakaoPay / NaverPay / Toss / Apple Pay / Samsung Pay. Official asset compliance. |
| [component-category-picker.md](component-category-picker.md) | CategoryPicker | 가계부 emoji-first category selector. Horizontal pills / grid / list, custom category creation. |
| [component-transaction-list-item.md](component-transaction-list-item.md) | TransactionListItem | Most-rendered row in 가계부 / banking. Tabular numerals, amount color semantics, status badges. |
| [component-account-card.md](component-account-card.md) | AccountCard | Bank account card. Branded logo + masked number + balance. compact/default/hero variants. |
| [component-stock-chart.md](component-stock-chart.md) | StockChart | Korean inverted color convention (red=up, blue=down). Candle/line/area, crosshair, performance with canvas. |
| [component-krw-amount.md](component-krw-amount.md) | KRWAmount (display-only) | Display counterpart to AmountInput. Comma vs Korean number format, sign, hero variant. |
| [component-payment-receipt.md](component-payment-receipt.md) | PaymentReceipt | Korean receipt convention with dotted dividers, structured price breakdown, share/reorder actions. |
| [component-pass-auth.md](component-pass-auth.md) | PASSAuth (Korean 본인인증) | Wraps PASS app / NICE / KCB identity verification. Required for high-value Korean fintech transactions. |
| [component-otp-countdown.md](component-otp-countdown.md) | OTPCountdown | SMS code expiration timer + resend cooldown. Pairs with InputOTP. |

### Documentation worked examples

| File | Skill | Demonstrates |
| --- | --- | --- |
| [doc-tutorial-example.md](doc-tutorial-example.md) | `document-author` (tutorial) | Canonical tutorial format — time + audience, "what you'll build", numbered steps with confirmation, "what's next". |
| [doc-how-to-example.md](doc-how-to-example.md) | `document-author` (how-to) | Problem-driven format — TL;DR + steps + variations + pitfalls. Korean localization context. |
| [doc-explanation-example.md](doc-explanation-example.md) | `document-author` (explanation) | Discursive format — problem / alternatives / decision / tradeoffs. W3C DTCG choice rationale. |
| [slide-deck-example.md](slide-deck-example.md) | `slide-deck-author` (talk) | 17-slide talk deck outline. Message-led titles, one visual per slide, speaker notes, Korean conference voice. |
| [report-example.md](report-example.md) | `ux-audit` | UX audit report — TL;DR pyramid, severity-aggregated findings, citations, code diffs, "things that work well". |
| [email-transactional-example.md](email-transactional-example.md) | `document-author` (email) | Korean fintech transactional email — preheader, receipt structure, bulletproof button, sender info per 정보통신망법. |

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
