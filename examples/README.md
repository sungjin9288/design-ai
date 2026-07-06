# Examples

Worked outputs from each skill — what "good" looks like. Use as reference when invoking the skill on your own task.

### Website improvement

| File | Skill | Input | What it demonstrates |
| --- | --- | --- | --- |
| [website-improvement-report.md](website-improvement-report.md) | `website-improvement` | Korean SaaS marketing site improvement control tower | Site Profile, audit summary, MCP readiness, refactor plan, prompt/report handoff, and MVP boundary that keeps target repo changes outside design-ai |

### Color & tokens

| File | Skill | Input | What it demonstrates |
| --- | --- | --- | --- |
| [palette-saas-violet.md](palette-saas-violet.md) | `color-palette` | B2B SaaS, violet seed `#7C3AED` | Full palette with OKLCH ramps, semantic aliases, light + dark, contrast matrix, Tailwind v4 + shadcn-ui + Style Dictionary outputs, use guidance |

### Component specs (synthesized from Ant Design + MUI + shadcn-ui)

| File | Component | What it covers |
| --- | --- | --- |
| [component-button.md](component-button.md) | Button | The most-used control. Variants, intent, sizes, loading state, asChild pattern. |
| [component-button-base.md](component-button-base.md) | ButtonBase | Low-level interactive primitive for building design-system controls. Semantics, focus-visible, ripple, disabled, and polymorphic root rules. |
| [component-border-beam.md](component-border-beam.md) | BorderBeam | Decorative moving border emphasis layer. Host DOM constraints, reduced motion, aria-hidden, and semantic-state boundaries. |
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
| [component-auto-complete.md](component-auto-complete.md) | AutoComplete | Free-text + suggestions. Distinct from Select. Korean IME composition handling. |
| [component-mentions.md](component-mentions.md) | Mention (@-trigger) | Trigger char (@/#/:) opens picker, chip insertion. Storage formats, IME. |
| [component-timeline.md](component-timeline.md) | Timeline | Sequential events: order tracking, activity feed, audit log. Status indicators. |
| [component-tour.md](component-tour.md) | Tour (in-product overlay) | Step-by-step UI walkthrough. When NOT to use (most cases). |
| [component-affix.md](component-affix.md) | Affix (sticky positioning) | When CSS `position: sticky` isn't enough. Container-scoped sticky. |
| [component-float-button.md](component-float-button.md) | FloatButton (FAB) | Floating action button. Speed-dial menu, safe-area handling. |
| [component-qr-code.md](component-qr-code.md) | QRCode | Encoding strings as QR. Error correction levels, center logo, color contrast. |
| [component-splitter.md](component-splitter.md) | Splitter (resizable panel) | When CSS sticky isn't enough. IDE / 3-pane layouts. |
| [component-anchor.md](component-anchor.md) | Anchor (scrollspy / TOC) | Side-rail nav for long-form content. Active section detection. |
| [component-app-bar.md](component-app-bar.md) | AppBar (top app bar) | Persistent top header. iOS large-title variant, search overlay, sub-tabs. |
| [component-layout.md](component-layout.md) | Layout (page chrome) | Header / Sidebar / Content / Footer slots. Responsive sider collapse. |
| [component-input-otp.md](component-input-otp.md) | InputOTP (verification code) | Multi-cell digit input. Korean SMS verification flow, autocomplete=one-time-code. |
| [component-watermark.md](component-watermark.md) | Watermark | Repeating overlay for sensitive content. Per-user trace, screenshot deterrent. |
| [component-code.md](component-code.md) | Code (inline + block) | Monospace text + syntax highlighting + copy button. |
| [component-css-baseline.md](component-css-baseline.md) | CssBaseline | Root global baseline for app shells. Box sizing, body typography, color-scheme, print, SSR, and reset ownership. |
| [component-typography.md](component-typography.md) | Typography (text primitive) | Variant-driven text. When NOT to use (Tailwind utility classes are usually clearer). |
| [component-badge.md](component-badge.md) | Badge | Standalone label + indicator dual modes. Variants (default/secondary/destructive/outline), count + dot indicator on parent. |
| [component-dropdown.md](component-dropdown.md) | Dropdown / DropdownMenu | Triggered overlay menu of actions. WAI-ARIA Menu pattern, sub-menus, checkbox / radio items, shortcuts. |
| [component-context-menu.md](component-context-menu.md) | ContextMenu | Right-click / long-press triggered menu. Same WAI-ARIA Menu pattern as Dropdown. |
| [component-config-provider.md](component-config-provider.md) | ConfigProvider | App-level design-system configuration boundary. Theme, locale, direction, portals, CSP, static APIs, and component defaults. |
| [component-hover-card.md](component-hover-card.md) | HoverCard | Hover-triggered floating preview. Distinct from Tooltip + Popover; profile previews, link previews. |
| [component-sheet.md](component-sheet.md) | Sheet | Side-anchored modal panel. Mobile-first detents, side variants (top/right/bottom/left). |
| [component-command.md](component-command.md) | Command / CommandPalette | cmdk-based searchable command palette. Cmd+K pattern, fuzzy match, async results. |
| [component-sidebar.md](component-sidebar.md) | Sidebar | Persistent collapsible navigation panel. Icon-only mode, mobile offcanvas, multi-level menu. |
| [component-navigation-menu.md](component-navigation-menu.md) | NavigationMenu | Top horizontal nav with mega-menu panels. Marketing site / SaaS header pattern. |
| [component-menubar.md](component-menubar.md) | Menubar | Persistent menu bar (File / Edit / View). Desktop-style web apps; hover-roving between menus. |
| [component-aspect-ratio.md](component-aspect-ratio.md) | AspectRatio | Lock child to specific aspect ratio. Image, video, card thumbnail wrapper. |
| [component-collapsible.md](component-collapsible.md) | Collapsible | Single expandable section primitive. Base for Accordion; FAQ, "Show more" patterns. |
| [component-toggle.md](component-toggle.md) | Toggle / ToggleGroup | Two-state pressable button. Toolbar formatting, mutually-exclusive (single) or independent (multiple) groups. |
| [component-scroll-area.md](component-scroll-area.md) | ScrollArea | Custom-styled scrollbar. Cross-platform consistency; visibility modes (auto/always/scroll/hover). |
| [component-banner.md](component-banner.md) | Banner | Persistent in-page strip (system status, trial, cookie consent). Distinct from Alert + Toast. |
| [component-kbd.md](component-kbd.md) | Kbd | Keyboard shortcut display. Platform-aware Mac/Win symbols, used in tooltips + menus. |
| [component-separator.md](component-separator.md) | Separator | Horizontal / vertical divider. Decorative vs semantic; aliased as Divider in some libs. |
| [component-alert-dialog.md](component-alert-dialog.md) | AlertDialog | Modal confirmation for destructive actions. Distinct from Modal; default focus on Cancel; `role="alertdialog"`. |
| [component-bottom-navigation.md](component-bottom-navigation.md) | BottomNavigation | Mobile primary nav (3-5 tabs). iOS / Android / Material 3 conventions; safe-area handling. |
| [component-chart.md](component-chart.md) | Chart | Recharts wrapper with theming + a11y. Korean stock convention (red=up); engine-agnostic chart-type table. |
| [component-combobox.md](component-combobox.md) | Combobox | Searchable select. WAI-ARIA combobox pattern; Korean IME composition handling; multi-select + creatable variants. |
| [component-field.md](component-field.md) | Field family | Form-field wrapper (Field / FieldLabel / FieldDescription / FieldError / FieldGroup / FieldSet / FieldLegend). |
| [component-item.md](component-item.md) | Item family | List-item primitive (Item / ItemMedia / ItemContent / ItemTitle / ItemDescription / ItemActions). |
| [component-link.md](component-link.md) | Link | Text link primitive. Link vs Button decision; external indicator; underline policies; Korean conventions. |
| [component-paper.md](component-paper.md) | Paper | MUI surface primitive — elevation + outlined variants. Building block for Card, Modal, Drawer. |
| [component-spinner.md](component-spinner.md) | Spinner | Indeterminate loading indicator. Spinner vs Progress vs Skeleton; size scale; reduced-motion. |
| [component-empty.md](component-empty.md) | Empty | Inline "no data" primitive. Distinct from EmptyState (full-page custom KR-aware). |
| [component-masonry.md](component-masonry.md) | Masonry | Pinterest-style staggered grid. CSS multicolumn vs JS measurement trade-offs; a11y reading order. |
| [component-icon.md](component-icon.md) | Icon | Base primitive for rendering icons; size scale, currentColor theming, decorative vs meaningful. |
| [component-icon-button.md](component-icon-button.md) | IconButton | Icon-only button. Variants (ghost/outline/filled/tonal), sizes, mandatory aria-label. |
| [component-checkbox.md](component-checkbox.md) | Checkbox | Form selection control. Indeterminate state, "select all" pattern, Korean marketing-consent rule. |
| [component-radio.md](component-radio.md) | Radio + RadioGroup | Mutually exclusive choice control. Radio vs Select decision; KR payment-method picker example. |
| [component-label.md](component-label.md) | Label | Form-control label primitive. htmlFor linking, required/optional indicators, KR conventions. |
| [component-box.md](component-box.md) | Box | Most generic styled `<div>` primitive. System-prop access; when to use vs Stack/Grid/Flex. |
| [component-flex.md](component-flex.md) | Flex | flex layout primitive. Direction, gap, align, justify, wrap; common patterns. |
| [component-grid.md](component-grid.md) | Grid | 2D grid layout. Ant Row+Col / MUI v2 / modern CSS Grid wrapper. |
| [component-list.md](component-list.md) | List | Semantic + styled wrapper around Item rows. Pagination, infinite scroll, virtualization, empty state. |
| [component-menu.md](component-menu.md) | Menu | Structured navigation menu (Ant style). Distinct from DropdownMenu / NavigationMenu / Sidebar. |
| [component-message.md](component-message.md) | Message | Top thin pill notification (Ant). Imperative API; distinct from Toast / Notification. |
| [component-notification.md](component-notification.md) | Notification | Richer corner card notification. Title + description + actions; placement variants. |
| [component-space.md](component-space.md) | Space | Tiny utility for inline gap. Direction, size, wrap, split element-between-children. |
| [component-button-group.md](component-button-group.md) | ButtonGroup | Visually-unified action button cluster. Distinct from ToggleGroup / Segmented. |
| [component-speed-dial.md](component-speed-dial.md) | SpeedDial | FAB that expands into 2-5 secondary action FABs. Mobile compose pattern. |
| [component-time-picker.md](component-time-picker.md) | TimePicker | Hour/minute/second picker. 24- vs 12-hour, step granularity, KR conventions, range variant. |
| [component-tree-select.md](component-tree-select.md) | TreeSelect | Dropdown with hierarchical tree picker. Distinct from Cascader (columns) / Tree (full-page). |
| [component-backdrop.md](component-backdrop.md) | Backdrop | Semi-opaque scrim overlay. Used internally by Modal/Drawer/Sheet; standalone for full-page loading. |
| [component-switch.md](component-switch.md) | Switch | iOS-style toggle for binary on/off settings. Distinct from Checkbox (form). |
| [component-tag.md](component-tag.md) | Tag | Closeable label / chip; filter chips, multi-select selected items. |
| [component-snackbar.md](component-snackbar.md) | Snackbar | Material's bottom-anchored Toast variant; brief result + optional Undo. |
| [component-sonner.md](component-sonner.md) | Sonner | Modern shadcn toast library; stacking depth, promise wrapper, rich actions. |
| [component-textarea.md](component-textarea.md) | Textarea | Multi-line text input. Korean IME composition handling, character counter. |
| [component-textarea-autosize.md](component-textarea-autosize.md) | TextareaAutosize | Textarea that grows with content; CSS field-sizing + JS measurement fallback. |
| [component-popconfirm.md](component-popconfirm.md) | Popconfirm | Inline confirmation popover; lightweight alternative to AlertDialog. |
| [component-popper.md](component-popper.md) | Popper | Low-level positioning primitive. Used internally by Tooltip / Popover / Menu. |
| [component-swipeable-drawer.md](component-swipeable-drawer.md) | SwipeableDrawer | Drawer with swipe-to-open / swipe-to-close gestures; mobile-first. |
| [component-resizable.md](component-resizable.md) | Resizable | IDE-style resizable panel groups (horizontal + vertical); layout persistence. |
| [component-image-list.md](component-image-list.md) | ImageList | Uniform-grid photo display. Distinct from Masonry (varied) and Grid (general). |
| [component-back-top.md](component-back-top.md) | BackTop | Floating "scroll to top" button after threshold; reduced-motion aware. |
| [component-click-away-listener.md](component-click-away-listener.md) | ClickAwayListener | Outside-click callback utility. Used internally by overlays. |
| [component-toolbar.md](component-toolbar.md) | Toolbar | Horizontal action container; app bar / editor / dialog footer. `role="toolbar"`. |
| [component-step.md](component-step.md) | Step | Single step sub-component within a Steps / Stepper flow. |
| [component-zoom.md](component-zoom.md) | Zoom | Transition primitive (scale + fade). Sibling to Fade / Slide / Grow. |
| [component-speed-dial-action.md](component-speed-dial-action.md) | SpeedDialAction | Single action item inside a SpeedDial; child component spec. |
| [component-slide.md](component-slide.md) | Slide | Direction-based slide-in/out transition. Used internally by Drawer / Sheet / Snackbar. |
| [component-auto-complete.md](component-auto-complete.md) | AutoComplete | Free-text + suggestions input. (Canonical name; sibling of Combobox.) |
| [component-mentions.md](component-mentions.md) | Mentions / Mention | @-trigger picker for inline chips / tagging. |

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

### Motion components

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-loading-sequence.md](component-loading-sequence.md) | LoadingSequence | Splash + biometric gate + first-screen reveal coordination for cold launch. Korean fintech default. |
| [component-page-transition.md](component-page-transition.md) | PageTransition | Route-level wrapper (fade / slide / hero variants). Framer Motion + View Transitions API implementations. |
| [component-lottie-player.md](component-lottie-player.md) | LottiePlayer | After Effects animation embed with lazy-load, offscreen pause, poster fallback, reduced-motion handling. |
| [component-scroll-reveal.md](component-scroll-reveal.md) | ScrollReveal | Viewport-triggered animation primitive (fade-up / fade-in-blur / scale-in) with stagger and `once` semantics. |

### Illustration components

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-empty-state.md](component-empty-state.md) | EmptyState | Layout for "no data yet" surfaces. Illustration registry, voice rules, KR 해요체 default. |
| [component-illustration.md](component-illustration.md) | Illustration | Themeable SVG / Lottie display backed by a typesafe illustration registry. |

### Print specs

| File | Piece | Demonstrates |
| --- | --- | --- |
| [print-business-card-spec.md](print-business-card-spec.md) | Korean 명함 (premium tier) | Korean fintech business card spec: 90×50mm, 350gsm uncoated, soft-touch + spot UV, Pretendard, Pantone + CMYK, file delivery checklist. |
| [print-packaging-spec.md](print-packaging-spec.md) | Folding carton (cosmetics) | Korean cosmetics carton spec: dieline, KFDA regulatory content (전성분 / 사용기한 / 분리배출 표시), FSC + soy ink, press proof. |

### Video components

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-video-player.md](component-video-player.md) | VideoPlayer | Accessible HTML5 video with multi-language captions, speed control, transcript link, reduced-motion handling. |
| [component-video-hero.md](component-video-hero.md) | VideoHero | Above-the-fold autoplay loop with poster fallback, art-direction (mobile vs desktop video), reduced-motion + slow-connection skip. |

### Game UI components

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-game-hud.md](component-game-hud.md) | GameHUD | Composable HUD shell with anchored slots, customization, color-blind / contrast modes, UI scale, cross-platform input. |
| [component-game-menu.md](component-game-menu.md) | GameMenu | Composable menu shell — main / pause / settings / inventory / store. Focus management, controller / d-pad nav, button-prompt swapping per platform, modal stacking. |

### Conversational UI components

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-chat-interface.md](component-chat-interface.md) | ChatInterface | Reusable chat shell for chatbot / AI / live agent. Markdown + code block rendering, streaming, suggested chips, typing indicator, attachments, Korean IME + 해요체 defaults. |
| [component-voice-input.md](component-voice-input.md) | VoiceInput | Push-to-talk + transcript voice input. Web Speech / Clova / Whisper backends, listening visualization, permission handling, Korean STT defaults. |

### Spatial / AR / VR components

| File | Component | Demonstrates |
| --- | --- | --- |
| [component-spatial-panel.md](component-spatial-panel.md) | SpatialPanel | Floating 2D-in-3D panel for VR / AR / spatial computing. Anchoring (world / wrist / hand / head), distance / scale / billboarding, comfort positioning, hand + gaze input, depth occlusion. |
| [component-spatial-locomotion.md](component-spatial-locomotion.md) | SpatialLocomotion | VR locomotion controller with teleport, smooth, snap-turn, room-scale modes; comfort vignette, fade transitions, comfort-default presets. |

### Documentation worked examples

| File | Skill | Demonstrates |
| --- | --- | --- |
| [doc-tutorial-example.md](doc-tutorial-example.md) | `document-author` (tutorial) | Canonical tutorial format — time + audience, "what you'll build", numbered steps with confirmation, "what's next". |
| [doc-how-to-example.md](doc-how-to-example.md) | `document-author` (how-to) | Problem-driven format — TL;DR + steps + variations + pitfalls. Korean localization context. |
| [doc-explanation-example.md](doc-explanation-example.md) | `document-author` (explanation) | Discursive format — problem / alternatives / decision / tradeoffs. W3C DTCG choice rationale. |
| [slide-deck-example.md](slide-deck-example.md) | `slide-deck-author` (talk) | 17-slide talk deck outline. Message-led titles, one visual per slide, speaker notes, Korean conference voice. |
| [report-example.md](report-example.md) | `ux-audit` | UX audit report — TL;DR pyramid, severity-aggregated findings, citations, code diffs, "things that work well". |
| [email-transactional-example.md](email-transactional-example.md) | `document-author` (email) | Korean fintech transactional email — preheader, receipt structure, bulletproof button, sender info per 정보통신망법. |

### Feature flow specs

| File | Skill | Demonstrates |
| --- | --- | --- |
| [flow-design-report-block.md](flow-design-report-block.md) | `ux-audit` / `design-critique` (`flow-design` route) | Report + block interaction flow. Entry points, step/state tables, edge/error paths, completion criteria, Korean 정보통신망법 제44조의2 임시조치 handling. |

### Dashboard / data screen specs

| File | Skill | Demonstrates |
| --- | --- | --- |
| [dashboard-design-settlement.md](dashboard-design-settlement.md) | `design-critique` / `handoff-spec` (`dashboard-design` route) | Seller settlement dashboard. KPI strip + table-first layout, Korean amount/number formatting, table accessibility (caption, header scope, aria-sort), density + responsive degradation, export/alert edge cases. |

### Marketing page & campaign surface specs

| File | Skill | Demonstrates |
| --- | --- | --- |
| [marketing-page-saas-landing.md](marketing-page-saas-landing.md) | `design-critique` / `handoff-spec` (`marketing-page` route) | Developer-tool SaaS landing page. Hero archetype selection, above-the-fold section sequencing, pricing plan comparison, Korean trust/CTA copy, email-client-safe responsive behavior. |

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
