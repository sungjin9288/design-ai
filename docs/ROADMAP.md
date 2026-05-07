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

## Phase 2 — Depth (next)

Driven by the dogfood findings.

### Knowledge gaps to fill

- [ ] `knowledge/patterns/money-and-amount.md` — fintech-essential. Currency display, amount input ergonomics, color semantics for ±, tabular numerals, rounding rules.
- [ ] `knowledge/patterns/mobile-navigation.md` — bottom tab bar, top app bar, modal screen pattern, search behavior on mobile.
- [ ] `knowledge/patterns/list-and-feed.md` — pull-to-refresh, infinite scroll, swipe actions, empty/loading/error/skeleton.
- [ ] `knowledge/platforms/react-native.md` — RN-specific differences (StyleSheet, Pressable, no hover, NativeWind).
- [ ] `knowledge/i18n/korean-payments.md` — split from the conventions doc. Toss / KakaoPay / NaverPay / 휴대폰결제 selection rules + integration patterns.

### More component specs (examples/)

- [ ] Form (full pattern, not just inputs) — multi-field layout, validation orchestration
- [ ] Table / DataTable — sort, filter, pagination, selection, cell types
- [ ] Tabs — including bottom-tab-bar variant for mobile
- [ ] DatePicker — calendar UI, range, Korean locale
- [ ] Select / Combobox — including async loading
- [ ] Pagination

### Skill upgrades

- [ ] `color-palette` PLAYBOOK adds "mood → hue mapping" section.
- [ ] `design-system-builder` PLAYBOOK adds "starter component set by category".
- [ ] `handoff-spec` PLAYBOOK adds "system bootstrap handoff" sub-template.
- [ ] All skills add a verification phase ("Did I cite at least one knowledge file per claim category?").

### Tooling

- [ ] `tools/audit/check-coverage.py` — coverage report (e.g., `12 / 199 components have worked specs`).
- [ ] CI lint that fails PRs introducing raw hex in `examples/` (must be a token alias).

## Phase 3 — Connective

- [ ] `/design-from-brief` — full design from a one-paragraph product brief.
- [ ] `/iterate` — apply a critique and produce a revision artifact.
- [ ] HTML preview generator — render token sets and component specs as a static page for visual review.
- [ ] Optional embedding index if knowledge base exceeds 100K tokens.

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
