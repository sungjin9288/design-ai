# Roadmap

## Phase 1 — Foundation ✓ shipped (v1.0)

Three commits. See `git log --oneline`.

- [x] Project skeleton, entry docs (`README`, `AGENTS.md`, `CLAUDE.md`)
- [x] Sparse-cloned upstream sources into `refs/`
- [x] Architecture, contributing, using, Figma-integration, token-sync docs
- [x] 7 idempotent extractors (`tools/extractors/`)
- [x] 24 knowledge files / 10K+ lines (a11y, colors, components, design-tokens, i18n, icons, layout, motion, patterns, typography)
- [x] 6 skills with playbooks: design-system-builder, component-spec-writer, color-palette, ux-audit, design-critique, handoff-spec
- [x] 4 agent personas: design-critic, a11y-reviewer, token-extractor, component-architect
- [x] 4 slash commands: design-review, palette-from-brand, component-spec, extract-tokens
- [x] 6 worked examples: violet SaaS palette, Button, Input, Modal, Toast, Card
- [x] Dogfood validation: Korean fintech app design system bootstrap end-to-end
- [x] Self-critique published as [`docs/DOGFOOD-FINDINGS.md`](DOGFOOD-FINDINGS.md)

## Phase 2 — Depth ✓ shipped (v1.1)

Driven by the dogfood findings. Wrapped in 4 commits (Batch A–D).

### Knowledge gaps filled

- [x] `knowledge/patterns/money-and-amount.md` — currency display, amount input ergonomics, ± color semantics (separate axis from primary/error), Korean stock convention (red=up), tabular numerals, edge cases.
- [x] `knowledge/patterns/mobile-navigation.md` — bottom tab bar, top app bar, drawer (when NOT), stack, back navigation contract, search patterns, sheets.
- [x] `knowledge/patterns/list-and-feed.md` — list anatomy, settings/chat/transaction/search patterns, pull-to-refresh, infinite scroll vs Load More, empty/loading/error states, swipe actions, virtualization.
- [x] `knowledge/platforms/react-native.md` — web↔RN gap matrix, token translation, Pressable, touch targets/hitSlop, safe area, keyboard handling, animations (Reanimated), Pretendard loading, navigation, common pitfalls.
- [x] `knowledge/i18n/korean-payments.md` — vendor landscape, decision tree by product type, payment selector ordering, subscription disclosure, 청약철회, 본인인증, ESCROW, cost structure.

### More component specs (examples/)

- [x] Form (composition pattern with Zod + react-hook-form)
- [x] Table / DataTable (TanStack engine, mobile→card-list)
- [x] Tabs (underline / segmented / card / bottom-bar in one spec)
- [x] DatePicker (single / range / dateTime / quickRange, Korean formats)
- [x] Select / Combobox (single/multi/searchable/creatable/async)
- [x] Pagination (numbered / Load More / simple, URL sync)

### Skill upgrades

- [x] `color-palette` PLAYBOOK — added "mood → hue mapping" section + differentiation check + Korean considerations + verification phase.
- [x] `design-system-builder` PLAYBOOK — added "starter component set by category" with extension matrix for 8 product categories + verification phase.
- [x] `component-spec-writer` PLAYBOOK — added verification phase (cite ≥ 2 references, all states, ARIA, keyboard, RN/IME conditional).
- [x] `ux-audit` PLAYBOOK — verification phase (user goal stated, every issue cited, CRITICAL has WCAG section).
- [x] `design-critique` PLAYBOOK — verification phase (problem-fit first, hierarchy walk, single recommendation).
- [x] `handoff-spec` PLAYBOOK — verification phase (every screen, every component referenced or sub-spec'd).

### Tooling

- [x] `tools/audit/check-coverage.py` — coverage report. Outputs to `knowledge/COVERAGE.md` + console summary.
- [ ] CI lint that fails PRs introducing raw hex in `examples/` (must be a token alias). _(Phase 3)_

## Phase 7 — Coverage push + automation tooling (v1.6) ✓ shipped

- [x] **Cursor + Aider integration guides** (docs/CURSOR-INTEGRATION.md, docs/AIDER-INTEGRATION.md): `.cursorrules` template, `@`-mention patterns, Aider `--read` configuration, per-task aliases.
- [x] **10 component specs** (Cascader, ColorPicker, Transfer, Spin, Segmented, AutoComplete, Mention, Timeline, Tour, Affix): coverage 14.6% → 19.6%.
- [x] **3 Korean fintech custom specs**: CategoryPicker (가계부 emoji-first), TransactionListItem (high-volume row), AccountCard (banking card).
- [x] **3 automation tools** (`tools/audit/`):
  - `changelog-generate.py` — generates CHANGELOG.md from git log
  - `frontmatter-check.py` — validates YAML frontmatter on knowledge files
  - `link-check.py` — validates internal markdown links resolve
- [x] AGENTS.md / examples/README / README updated. Knowledge: 43 → 43 (added 0 — all of v1.6 was examples + tooling). Examples: 40 → 53.

## Phase 6 — Token references + QA + integrations ✓ shipped (v1.5)

- [x] 3 design token reference docs:
  - `knowledge/design-tokens/tailwind-v4.md` — OKLCH defaults, full color/spacing/typography/motion
  - `knowledge/design-tokens/material-3.md` — HCT tonal palettes, container pattern, M3 type scale
  - `knowledge/design-tokens/polaris-and-carbon.md` — Shopify + IBM enterprise reference
- [x] New skill: `design-system-qa` — 5-layer test pyramid audit (TypeScript / token drift / contract / a11y / visual regression)
- [x] `knowledge/patterns/design-system-qa.md` — full QA layer model
- [x] `docs/CODEX-INTEGRATION.md` — Codex CLI deep-dive: skill invocation, slash command translation, MCP setup, token budget per task, common pitfalls
- [x] `docs/PLUGIN-PACKAGING.md` — current symlink approach + future Claude Code plugin format, distribution channels, versioning, CI for releases
- [x] AGENTS.md / skills/README / README updated. Skills: 6 → 7.
- [x] Token references: 1 → 4. Knowledge: 39 → 43.

## Phase 5 — Coverage push + data viz + Korean fintech ✓ shipped (v1.4)

- [x] 8 component specs: Tag+Badge, Tree, Statistic, Upload, Result+Empty, Carousel, Image, Calendar.
- [x] 3 Korean fintech custom specs: BiometricGate, PaymentMethodSelector, PaymentBrandButton (KakaoPay/NaverPay/Toss/Apple/Samsung).
- [x] 3 data visualization knowledge files: dashboard-composition (3 archetypes, KPI→chart→table), chart-color-encoding (sequential/diverging/categorical, colorblind, KR stock convention), realtime-data (WebSocket vs polling, optimistic UI, disconnection, throttling).
- [x] Component spec coverage: 23 → ~32 worked specs (~16% — exceeds the 20% canonical target since several specs cover multiple canonical components).
- [x] PRINCIPLES.md extended with data viz rules (31–35).
- [x] AGENTS.md / examples/README / ROADMAP updated.

## Phase 4 — Depth + agent priming ✓ shipped (v1.3)

- [x] `knowledge/PRINCIPLES.md` — agent priming cheat sheet. 30 load-bearing rules across the system, each citing its deeper file. Loaded at session start.
- [x] 5 universal pattern knowledge files: `empty-states.md`, `error-states.md`, `onboarding.md`, `search-ux.md`, `settings-page.md`.
- [x] 6 more component specs: Drawer, Slider, Popover, Divider, Steps, Rate.
- [x] 2 custom component specs (Korean fintech): `component-amount-input.md`, `component-address-input.md` — proves the system handles non-upstream patterns.
- [x] Component spec coverage: 19 → 27 worked specs (8.5% → ~13%).
- [x] AGENTS.md updated with new lookup-table entries. ROADMAP marked.

## Phase 3 — Connective ✓ shipped (v1.2)

- [x] `/design-from-brief` — full design from a one-paragraph product brief. Orchestrates color-palette + design-system-builder + handoff-spec.
- [x] `/iterate` — apply a critique and produce a revision + changelog.
- [x] HTML preview generator (`tools/preview/render-tokens.py`) — extracts tokens, renders light+dark swatches, contrast matrix, live component previews, theme toggle.
- [x] Component spec coverage push: 11 → 19 worked specs (5% → 8.5%). New: Alert, Tooltip, Form-controls (Switch/Checkbox/Radio combined), Skeleton, Progress, Avatar, Breadcrumb, Accordion.
- [ ] Optional embedding index if knowledge base exceeds 100K tokens. _(Deferred — base is currently ~13K lines / well under threshold.)_

## Phase 4 — Multi-tool

- [ ] Codex CLI: real-world session against this repo, captured as a worked example.
- [ ] Cursor `.cursorrules` overlay.
- [ ] Aider configuration.

## Phase 5 — Maturity

- [ ] Versioned knowledge files (semver headers).
- [ ] CHANGELOG that summarizes upstream-source updates affecting `refs/`.
- [ ] Public site (knowledge/ as a browsable doc site).
- [ ] Plugin packaging — install design-ai as a Claude Code plugin / VS Code extension.

## Out of scope

- Image generation. We produce specs, tokens, and code-ready artifacts. Visual mockups go through Figma / external tools.
- Brand strategy. We assume a brand has constraints and translate them into tokens/components.
- Custom font design. We pair existing fonts.
- Implementing actual product code. design-ai produces the contract; the consuming product implements.
