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
- [x] CI lint that fails PRs introducing raw hex in `examples/` unless the file is an explicit palette/brand/email/chart fixture. _(Phase 50)_

## Phase 88 — Show command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai show` now self-tests its JSON output contract for corpus file metadata, context windows, and explicit line ranges.

### Changed
- `cli/lib/show.mjs` now uses `formatShowJson()` as the shared formatter for corpus file JSON output.
- `cli/commands/show.mjs` now sends `--json` output through that formatter.
- `cli/lib/show.test.mjs` now checks JSON round-trip behavior, top-level file payload key order, line-entry key order, explicit line-range payload order, and readable Korean file text.

### Impact
- Automation that chains `design-ai search --json` into `design-ai show --json` can rely on stable file metadata and `lines` entry order.
- Korean corpus file content stays readable instead of being escaped in machine-readable file display output.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- `design-ai show` keeps machine-readable corpus file display refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 87 — Search command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai search` now self-tests its JSON output contract for corpus search hits and empty result payloads.

### Changed
- `cli/lib/search.mjs` now uses `formatSearchJson()` as the shared formatter for corpus search JSON output.
- `cli/commands/search.mjs` now sends `--json` output through that formatter.
- `cli/lib/search.test.mjs` now checks JSON round-trip behavior, top-level payload key order, hit-entry key order, empty-result payload order, and readable Korean previews.

### Impact
- Automation that uses `design-ai search --json` can rely on stable `query` and `hits` payload order.
- Korean search previews stay readable instead of being escaped in corpus search JSON output.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- `design-ai search` keeps machine-readable corpus discovery refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 86 — Examples command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai examples` now self-tests its JSON output contract for query-driven and route-biased worked-example discovery.

### Changed
- `cli/lib/examples.mjs` now uses `formatExamplesJson()` as the shared formatter for worked-example discovery JSON output.
- `cli/commands/examples.mjs` now sends `--json` output through that formatter.
- `cli/lib/examples.test.mjs` now checks JSON round-trip behavior, top-level payload key order, example-entry key order, route-biased payload order, and readable Korean example text.

### Impact
- Automation that uses `design-ai examples --json` can rely on stable `query`, `routeId`, `effectiveQuery`, and `examples` payload order.
- Korean example titles and previews stay readable instead of being escaped in worked-example discovery JSON output.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- `design-ai examples` keeps machine-readable worked-example lookup refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 85 — Pack command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai pack` now self-tests its JSON output contract for complete and partial prompt-context bundles.

### Changed
- `cli/lib/pack.mjs` now uses `formatPackJson()` as the shared formatter for prompt-context bundle JSON output.
- `cli/commands/pack.mjs` now sends both stdout and `--out` JSON bundles through that formatter.
- `cli/lib/pack.test.mjs` now checks JSON round-trip behavior, prompt-pack key order, context summary key order, nested prompt-plan key order, file-entry key order, forced-route partial-context payload order, and readable Korean briefs.

### Impact
- Automation that consumes generated context bundles can rely on the same top-level report order for complete and partial packs.
- Korean briefs stay readable instead of being escaped in prompt-context bundle JSON output.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- `design-ai pack` keeps machine-readable prompt-context bundles refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 84 — Prompt command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai prompt` now self-tests its JSON output contract for inferred and forced route prompt plans.

### Changed
- `cli/lib/prompt.mjs` now uses `formatPromptJson()` as the shared formatter for prompt-plan JSON output.
- `cli/commands/prompt.mjs` now sends both stdout and `--out` JSON prompt plans through that formatter.
- `cli/lib/prompt.test.mjs` now checks JSON round-trip behavior, prompt plan key order, nested route key order, forced-route payload order, and readable Korean briefs.

### Impact
- Automation that consumes generated prompt plans can rely on the same top-level report order for inferred and forced route workflows.
- Korean briefs stay readable instead of being escaped in prompt-plan JSON output.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- `design-ai prompt` keeps machine-readable agent handoff plans refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 83 — Route command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai route` now self-tests its JSON output contract for recommendation and catalog reports.

### Changed
- `cli/lib/route.mjs` now uses `formatRouteJson()` as the shared formatter for route JSON output.
- `cli/commands/route.mjs` now sends scored route recommendations and route catalog `--json` output through that formatter.
- `cli/lib/route.test.mjs` now checks JSON round-trip behavior, recommendation/catalog key order, and readable Korean route keywords.

### Impact
- Automation that consumes route recommendations can rely on the same top-level report order.
- Korean route keywords stay readable instead of being escaped in JSON output.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- `design-ai route` keeps machine-readable recommendation and catalog reports refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 82 — Check command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai check` now self-tests its JSON output contract for artifact and examples reports.

### Changed
- `cli/lib/check.mjs` now uses `formatCheckJson()` as the shared formatter for check reports.
- `cli/commands/check.mjs` now sends artifact and examples `--json` output through that formatter.
- `cli/lib/check.test.mjs` now checks JSON round-trip behavior, artifact/examples key order, and readable Korean messages.

### Impact
- Automation that consumes `design-ai check --json` can rely on the same top-level report order.
- Future localized diagnostics can include Korean text without Unicode-escaped output.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- `design-ai check` keeps machine-readable artifact quality reports refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 81 — Release metadata JSON output formatter guard added (v4.13.0) ✓ shipped

Release metadata now self-tests its JSON output contract.

### Changed
- `tools/audit/release-metadata.py` now uses `format_json_summary()` for `--json` output.
- `npm run release:metadata:self-test` now checks JSON round-trip behavior, summary key order, checked-doc indentation/order, and Korean error readability.
- `docs/RELEASE-CHECKLIST.md` now documents the stable JSON summary contract.

### Impact
- JSON release metadata output can be refactored without losing top-level key order or checked-doc order.
- Korean structured errors remain readable instead of being escaped into Unicode sequences.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata keeps tested contracts for both automation-facing JSON and maintainer-facing terminal output.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 80 — Release metadata human output formatter guard added (v4.13.0) ✓ shipped

Release metadata now self-tests its non-JSON output contract.

### Changed
- `tools/audit/release-metadata.py` now uses `format_human_summary()` for human pass/fail output.
- `npm run release:metadata:self-test` now checks the passing summary string and failed bullet output.
- `docs/RELEASE-CHECKLIST.md` now describes structured bullet errors for metadata failures.

### Impact
- Human release metadata output can be refactored without losing the failed-output header or structured bullet lines.
- JSON output remains unchanged, while reviewer-facing terminal output now has explicit regression coverage.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata keeps a tested contract for both automation output and maintainer terminal output.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 79 — Release metadata audit-count loader guard added (v4.13.0) ✓ shipped

Release metadata now reports audit-count source failures as structured errors.

### Changed
- `tools/audit/release-metadata.py` now returns `(audit_count, errors)` from `load_audit_count()` instead of raising `SystemExit`.
- `npm run release:metadata:self-test` now covers missing `AUDITS` tuple, missing audit script entries, and missing `run-all.py` path fixtures.
- `docs/RELEASE-CHECKLIST.md` now states that audit-count source failures produce release metadata errors instead of tracebacks or early exits.

### Impact
- A broken audit runner shape no longer prevents release metadata from producing JSON/human error output.
- CHANGELOG and ROADMAP audit-count checks avoid cascading mismatch noise when the expected audit count cannot be loaded.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata remains actionable even when its audit-count source drifts or disappears.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 78 — Release metadata core input loader guard added (v4.13.0) ✓ shipped

Release metadata now reports core input loading failures as structured errors.

### Changed
- `tools/audit/release-metadata.py` now uses structured loaders for `package.json`, `.claude-plugin/plugin.json`, `CHANGELOG.md`, and `docs/ROADMAP.md`.
- `npm run release:metadata:self-test` now covers missing JSON, invalid JSON, missing text, and valid fixture input paths.
- `docs/RELEASE-CHECKLIST.md` now states that core input loading failures produce release metadata errors instead of tracebacks.

### Impact
- Broken core release inputs now produce actionable metadata errors instead of Python exceptions.
- The release metadata command keeps a consistent JSON/human error surface for manifests, release docs, and policy docs.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata remains useful and machine-readable even when required manifests or release docs are damaged.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 77 — Release policy docs loader error guard added (v4.13.0) ✓ shipped

Release metadata now reports policy-doc filesystem failures as structured errors.

### Changed
- `tools/audit/release-metadata.py` now uses `load_release_policy_docs()` to read the required release policy docs.
- `npm run release:metadata:self-test` now covers a missing-on-disk policy doc fixture.
- `docs/RELEASE-CHECKLIST.md` now states that missing required policy docs produce release metadata errors instead of tracebacks.

### Impact
- Deleted or unreadable release policy docs now produce actionable release metadata failures.
- The exact coverage contract applies to both the loaded filesystem path and the pure metadata summary path.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata remains useful when docs coverage fails because a required file disappeared.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 76 — Release policy docs deterministic order guard added (v4.13.0) ✓ shipped

Release metadata now guards the policy-doc coverage order as well as membership.

### Changed
- `tools/audit/release-metadata.py` now fails when release policy docs contain the required labels in a different order.
- `npm run release:metadata:self-test` now covers a reordered policy-doc fixture.
- `docs/RELEASE-CHECKLIST.md` now documents the exact required release policy docs order.

### Impact
- `release_policy_docs_checked` stays stable for release JSON output and reviewer comparisons.
- Required docs, unexpected docs, and order drift now each have explicit release metadata failure modes.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata remains deterministic even when the checked docs set is maintained by future edits.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 75 — Release policy docs exact set guard added (v4.13.0) ✓ shipped

Release metadata now guards the policy-doc coverage set as an exact set.

### Changed
- `tools/audit/release-metadata.py` now rejects release policy doc labels outside `REQUIRED_RELEASE_POLICY_DOC_LABELS`.
- `npm run release:metadata:self-test` now covers an unexpected `docs/UNTRACKED.md` policy-doc entry.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now records that metadata checks exact policy-doc membership as well as policy wording.

### Impact
- A required policy doc cannot silently disappear from release metadata coverage.
- An unexpected or mistyped policy-doc label cannot silently enter release metadata coverage.
- The Phase 72/73 release-facing docs guard now fails closed for exact coverage membership and command/policy content.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata remains reliable even as the list of release-facing docs evolves.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 74 — Release policy docs coverage set guard added (v4.13.0) ✓ shipped

Release metadata now guards the required policy-doc coverage set itself.

### Changed
- `tools/audit/release-metadata.py` now stores the required release policy docs in `REQUIRED_RELEASE_POLICY_DOC_LABELS`.
- `RELEASE_POLICY_DOC_PATHS` is derived from that required set.
- `npm run release:metadata:self-test` now covers a missing-doc failure when `README.ko.md` is removed from the policy docs map.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now records that metadata checks policy-doc membership as well as policy wording.

### Impact
- A required policy doc cannot silently disappear from release metadata coverage.
- The Phase 72/73 release-facing docs guard now fails closed for both coverage membership and command/policy content.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata remains reliable even as the list of release-facing docs evolves.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 73 — Release policy docs ci:local command guard added (v4.13.0) ✓ shipped

Release metadata now guards the executable command in release-facing policy docs.

### Changed
- `tools/audit/release-metadata.py` now requires release-facing MkDocs warning-policy docs to mention `ci:local`.
- `npm run release:metadata:self-test` now includes a README command-drift fixture where `npm run ci:local` is replaced by `npm run release:check`.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now records that release metadata covers both warning-policy baseline drift and command-reference drift.

### Impact
- Docs cannot keep the warning-policy words while losing the actual pre-push command maintainers need before Real-CI.
- README, release checklist, and Distribution docs stay aligned on both command and policy.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release-facing docs keep command-level pre-push guidance intact.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 72 — Release policy docs metadata coverage expanded (v4.13.0) ✓ shipped

Release metadata now checks every release-facing docs page that carries the MkDocs warning-policy baseline.

### Changed
- `tools/audit/release-metadata.py` now checks `README.md`, `README.ko.md`, `docs/RELEASE-CHECKLIST.md`, `docs/DISTRIBUTION.md`, and `docs/DISTRIBUTION.ko.md` for the warning-policy phrase groups.
- `npm run release:metadata -- --json` now reports that full `release_policy_docs_checked` set.
- `docs/RELEASE-CHECKLIST.md` and `docs/DOGFOOD-V4-NPM-FINDINGS.md` now describe the expanded release policy docs coverage.

### Impact
- Entry docs, the release checklist, and Distribution docs now stay aligned on the `ci:local` MkDocs warning-policy baseline.
- Maintainers get one metadata gate for the release-facing docs they read before Real-CI verification.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release guidance remains consistent across README, checklist, and distribution surfaces.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 71 — Release metadata bilingual phrase guard hardened (v4.13.0) ✓ shipped

The release metadata distribution policy guard now accepts Korean equivalents.

### Changed
- `tools/audit/release-metadata.py` now accepts English and Korean phrase alternatives for MkDocs warning policy, refs-only warning, non-`refs/` warning, and accepted baseline checks.
- `npm run release:metadata:self-test` now includes a Korean `MkDocs 경고 정책` / `기준선` passing fixture.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now records that release metadata covers bilingual distribution warning-policy drift.

### Impact
- Korean docs can use natural Korean policy language without causing false release metadata failures.
- The guard still fails when the required warning-policy meaning disappears from either distribution guide.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Bilingual release guidance remains idiomatic while staying under automated metadata validation.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 70 — Bilingual distribution policy metadata guard added (v4.13.0) ✓ shipped

Release metadata now guards the English and Korean distribution warning-policy language.

### Changed
- `tools/audit/release-metadata.py` now checks `docs/DISTRIBUTION.md` and `docs/DISTRIBUTION.ko.md` for the MkDocs warning-policy terms covering refs-only warnings and the accepted baseline.
- `npm run release:metadata:self-test` now includes a distribution warning-policy drift fixture.
- `docs/RELEASE-CHECKLIST.md` now states that release metadata covers the bilingual distribution warning-policy guidance.

### Impact
- Future docs edits cannot silently drop the Phase 68/69 warning-policy baseline language from either distribution guide.
- The release metadata gate now protects the bilingual release guidance before Real-CI verification.

### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Bilingual release docs stay aligned with the executable MkDocs warning policy as local CI hardening continues.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 69 — Korean distribution warning policy guidance synced (v4.13.0) ✓ shipped

The Korean distribution guide now matches the Phase 68 MkDocs warning policy.

### Changed
- `docs/DISTRIBUTION.ko.md` now states that `npm run ci:local` blocks non-`refs/` MkDocs warnings and requires refs-only warnings to stay within the accepted baseline cap.

### Impact
- Korean release guidance now matches the English distribution docs before Real-CI verification.
- Maintainers using Korean docs get the same expectation for the docs warning policy.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release checklist stays bilingual as the local docs policy continues to harden.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 68 — MkDocs refs warning baseline capped (v4.13.0) ✓ shipped

The local MkDocs warning policy now caps the intentional `refs/` warning stream at the accepted baseline.

### Changed
- `tools/audit/local-ci.py` now fails if refs-only MkDocs warnings exceed the current accepted baseline of 632.
- `tools/audit/local-ci.py --self-test` now covers refs-warning classification and baseline-regression behavior.

### Impact
- New upstream-source links cannot silently grow the accepted warning stream before Real-CI verification.
- Maintainers get a focused failure that asks for either link normalization or a documented baseline update.

### Verified
- All 8 audits pass.
- `npm test`
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The remaining docs warning policy is now bounded by both category and count.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 67 — Docs workflow corpus path invariant expanded (v4.13.0) ✓ shipped

The local docs workflow drift check now guards all main corpus directory triggers.

### Changed
- `tools/audit/local-ci.py` now requires the docs workflow path filter to include `knowledge/**`, `examples/**`, `skills/**`, `agents/**`, `commands/**`, and `docs/**`.

### Impact
- Future workflow edits cannot silently stop deploying changes to the main MkDocs corpus directories.
- The docs workflow trigger invariant now covers corpus directories, top-level site files, shared helper scripts, and the workflow file itself.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- GitHub Pages trigger coverage stays aligned with the directories symlinked into the MkDocs site.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 66 — Korean top-level docs trigger Pages deploy (v4.13.0) ✓ shipped

The GitHub Pages workflow now watches the Korean top-level files that are symlinked into the MkDocs source tree.

### Changed
- `.github/workflows/docs.yml` now includes `README.ko.md` and `AGENTS.ko.md` in its `paths` filter.
- `tools/audit/local-ci.py` now treats the top-level MkDocs source files as required docs workflow paths.

### Impact
- Korean landing page and Korean agent entry point changes now trigger docs deployment directly.
- Local CI catches future path-filter drift for the top-level site inputs created by `tools/build-docs.sh`.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Korean top-level documentation changes no longer wait for another docs path change to deploy.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 65 — Docs workflow policy parser tightened (v4.13.0) ✓ shipped

The docs workflow drift check now validates extracted workflow fields instead of broad file substrings.

### Changed
- `tools/audit/local-ci.py` now parses one-line `run:` commands from workflow text.
- `tools/audit/local-ci.py` now parses entries under `paths:` and checks required docs helper paths from that list.
- The expected docs workflow command and path constants are stored separately.

### Impact
- The docs workflow policy check is less sensitive to indentation and unrelated text.
- Failure messages remain focused on the actual invariant: missing `--docs-only`, direct MkDocs build use, or missing helper path filters.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Workflow policy enforcement can evolve without adding a ninth repository audit or relying on fragile whole-file substring checks.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 64 — Docs workflow policy drift check (v4.13.0) ✓ shipped

The docs deployment workflow alignment from Phase 63 is now enforced by local CI.

### Added
- `tools/audit/local-ci.py` checks `.github/workflows/docs.yml` for the shared `--docs-only` build path.
- `tools/audit/local-ci.py --self-test` now covers passing and failing docs workflow policy fixtures.

### Changed
- `npm run ci:local` and `python3 -B tools/audit/local-ci.py --docs-only` now fail if the docs workflow calls `mkdocs build --clean` directly or omits shared docs helper paths from the workflow trigger.
- Release checklist documentation now calls out docs workflow policy alignment as part of local CI.

### Impact
- Future workflow edits cannot silently bypass the non-`refs/` MkDocs warning policy.
- Real-CI docs deployment remains aligned with local parity unless maintainers deliberately update the policy and its checks together.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Docs workflow policy is now an executable invariant rather than a manual review note.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 63 — Docs workflow uses local MkDocs policy (v4.13.0) ✓ shipped

The GitHub Pages deployment workflow now runs through the same docs-only warning-policy path as local CI.

### Added
- `tools/audit/local-ci.py --docs-only` runs MkDocs version check, `tools/build-docs.sh`, `mkdocs build --clean`, and non-`refs/` warning enforcement without release, VS Code, or package checks.

### Changed
- `.github/workflows/docs.yml` now calls `python3 -B tools/audit/local-ci.py --docs-only`.
- The docs workflow path filter now includes `tools/audit/local-ci.py` and `tools/build-docs.sh`.
- README pre-push guidance now explicitly mentions the MkDocs non-`refs/` warning policy.

### Impact
- Local docs parity and GitHub Pages deployment share one warning-policy implementation.
- Real-CI docs deployment should fail on the same non-`refs/` MkDocs warning regressions as local `ci:local`.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Real-CI verification is more meaningful because docs deployment no longer uses a separate direct MkDocs command.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 62 — Local CI MkDocs output summarized (v4.13.0) ✓ shipped

Successful local CI docs runs now keep MkDocs output compact while preserving the Phase 61 warning policy.

### Changed
- `tools/audit/local-ci.py` captures successful MkDocs build output without echoing the full accepted `refs/` warning stream.
- Failed subprocesses still print captured output so MkDocs install, config, or build failures remain visible.

### Impact
- Local parity logs no longer print hundreds of expected `refs/` warning lines on success.
- Maintainers still get a clear `MkDocs warning policy passed: N refs-only warning(s)` summary.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `npm run release:self-test`
- `npm run ci:local -- --skip-release-check --skip-vscode`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Pre-push local CI output is short enough to inspect quickly before Real-CI verification.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 61 — Local CI enforces MkDocs warning policy (v4.13.0) ✓ shipped

The Phase 60 MkDocs warning baseline is now enforced by the local CI parity gate.

### Added
- `tools/audit/local-ci.py` captures `mkdocs build --clean` output and classifies warning lines.
- `tools/audit/local-ci.py --self-test` now covers refs-only warning output and mixed warning output.

### Changed
- `npm run ci:local` now fails on any non-`refs/` MkDocs warning.
- Existing upstream `refs/` source-link warnings remain allowed because they are a known documentation policy question, not current navigation breakage.

### Impact
- New docs navigation regressions should be caught before push.
- Real-CI docs logs should stay focused on external confirmation rather than first-pass warning discovery.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `npm run release:self-test`
- `npm run ci:local -- --skip-release-check --skip-vscode`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Maintainers can rely on the existing local parity command to protect the non-`refs/` warning baseline.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 60 — MkDocs warning stream narrowed to refs (v4.13.0) ✓ shipped

The local docs build now has 0 non-`refs/` MkDocs warnings; remaining warnings are intentionally concentrated in upstream source-reference links.

### Changed
- Stability-review command tooling references now render as code paths instead of links to files outside the MkDocs site tree.
- Npm dogfood tooling references now render as code paths where they refer to repository scripts.
- Korean launch draft and Korean contributor references now point at GitHub URLs to avoid static-i18n `.ko.md` resolution noise.

### Impact
- MkDocs `WARNING` lines dropped to 632 in the latest local build.
- Non-`refs/` MkDocs warnings are 0.
- Remaining warning volume is now policy-level `refs/` source-link handling, not general docs navigation breakage.

### Verified
- All 8 audits pass.
- `./tools/build-docs.sh`
- `python3 -m mkdocs build --clean`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Real-CI docs logs should now make any new non-`refs/` warning stand out immediately.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 59 — Documentation link hygiene before Real-CI (v4.13.0) ✓ shipped

The public docs now avoid common directory-style links that MkDocs cannot resolve cleanly in the symlink-farm site build.

### Changed
- README badges, language toggles, AGENTS references, skill catalog entries, MCP docs, and integration docs now point to concrete markdown files or public docs URLs.
- Worked examples now use correct relative paths from `examples/` into `knowledge/`, `commands/`, `docs/`, and sibling component specs.
- Repository tool references that are intentionally outside the MkDocs docs tree now render as code paths instead of site links.

### Impact
- Root `index.md` / `index.ko.md` link warnings are 0 in the local MkDocs build.
- Skill directory link INFO messages are 0 in the local MkDocs build.
- MkDocs `WARNING` lines dropped to 643 in the latest local build, with the remaining noise concentrated in repo-local source references and older launch/i18n materials.

### Verified
- All 8 audits pass.
- `./tools/build-docs.sh`
- `python3 -m mkdocs build --clean`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Real-CI docs output should be easier to inspect because navigation-level false positives are no longer mixed into the warning stream.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Continue targeted coverage only when upstream adds product-relevant primitives.

## Phase 58 — MkDocs-safe Ant Design token swatches (v4.13.0) ✓ shipped

The generated Ant Design token reference no longer produces false MkDocs hash-link warnings for preset palette swatches.

### Added
- `tools/extractors/ant_design_tokens.py --self-test` validates seed parsing, preset parsing, swatch rendering, and decorative `aria-hidden` output.
- `npm run tokens:ant-design:self-test` exposes the extractor self-test directly.
- `npm run release:self-test` now includes the Ant Design token extractor self-test.

### Changed
- Ant Design preset palette swatches now render as inline decorative HTML instead of `![](#HEX)` image links.
- `knowledge/design-tokens/ant-design.md` was regenerated from the extractor.
- `docs/DOGFOOD-V4-MKDOCS-FINDINGS.md` now records that the old hex-anchor warning class is fixed.

### Impact
- MkDocs no longer emits false internal-anchor messages for Ant Design colors such as `#1677FF`.
- Remaining docs-build warnings are easier to review because generated color swatch noise is gone.

### Verified
- All 8 audits pass.
- `python3 -B tools/extractors/ant_design_tokens.py --self-test`
- `python3 -B tools/extractors/ant_design_tokens.py`
- `./tools/build-docs.sh`
- `python3 -m mkdocs build --clean`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Real-CI docs logs should be more readable when this branch is pushed, because one known generated-warning class has been removed at the source.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Continue targeted coverage only when upstream adds product-relevant primitives.

## Phase 57 — Local CI parity self-test coverage (v4.13.0) ✓ shipped

The new local CI parity gate now has its own lightweight self-test and participates in the existing release self-test chain.

### Added
- `tools/audit/local-ci.py --self-test` validates compile-file discovery, markdown line counting, warning threshold behavior, and hard-cap failure handling with temporary fixtures.
- `npm run ci:local:self-test` exposes the helper self-test directly.
- `npm run release:self-test` now includes the local CI self-test.

### Changed
- `local-ci.py` now factors Python compile file discovery, markdown line counting, and size budget validation into reusable testable functions.

### Impact
- Regressions in the pre-push local parity helper are caught by the fast release self-test path.
- Maintainers can edit `ci:local` behavior without having to run the full package smoke, VS Code compile, and mkdocs build for every small logic change.

### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `npm run release:self-test`
- `npm run release:metadata`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Local CI parity remains useful as it grows because its cheap logic checks run inside the standard release self-test command.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Continue targeted coverage only when upstream adds product-relevant primitives.

## Phase 56 — CI cache hardening + local parity gate (v4.13.0) ✓ shipped

The branch is now better prepared for Real-CI verification: GitHub Actions npm caching points at the actual lockfile, and maintainers have a single local command that exercises workflow-only surfaces before pushing.

### Added
- `tools/audit/local-ci.py` runs the local equivalent of the non-publishing GitHub workflows.
- `npm run ci:local` wraps `release:check`, Python syntax checks, knowledge/docs/examples size budget, VS Code extension compile/unit tests, and mkdocs site build.
- `README.md`, `README.ko.md`, `docs/RELEASE-CHECKLIST.md`, `docs/DISTRIBUTION.md`, and `docs/DISTRIBUTION.ko.md` document when to use the broader local gate.

### Changed
- `.github/workflows/audit.yml` now sets `cache-dependency-path: vscode-extension/package-lock.json` for jobs using `actions/setup-node` npm caching.
- VS Code extension dependency installs in CI now use `npm ci --no-audit --no-fund` instead of `npm install`, matching the committed lockfile.

### Impact
- A pushed branch should no longer depend on a root `package-lock.json` that does not exist.
- Local release verification now covers workflow-only checks that `release:check` intentionally did not run: Python `py_compile`, size budget, VS Code extension compile/unit tests, and mkdocs build.

### Verified
- All 8 audits pass.
- `npm run ci:local`
- `npm run release:metadata`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Real-CI verification can be treated as an external confirmation step after local parity passes, not as the first run of docs or VS Code workflow checks.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Continue targeted coverage only when upstream adds product-relevant primitives.

## Phase 55 — Upstream refs refresh + BorderBeam coverage (v4.13.0) ✓ shipped

Fresh upstream refs were pulled, generated knowledge was regenerated, and the newly surfaced Ant Design `border-beam` canonical received a full worked spec so the corpus stays above the 90% coverage threshold.

### Added
- `examples/component-border-beam.md` documents Ant Design `BorderBeam` as a decorative emphasis layer with host DOM requirements, portal behavior, `aria-hidden`, reduced-motion handling, gradient stops, and semantic-state boundaries.
- `examples/README.md` now lists `BorderBeam` in the component catalog.
- `knowledge/COVERAGE.md` now reports 181/200 canonical components with worked specs (90.5%).

### Changed
- `tools/clone-refs.sh` now uses sparse-checkout `--skip-checks` so the `nerd-fonts` file path `glyphnames.json` does not abort refs refresh.
- Generated extractor outputs now preserve `version`, `last_updated`, and `stability` frontmatter when `bash tools/extractors/run-all.sh` rewrites knowledge files.
- `tools/extractors/ui_ux_pro_max.py` preserves the local Korean B2B SaaS sensitive-data palette overlay across upstream CSV refreshes.
- `knowledge/components/INDEX.md` now indexes 200 canonical components, including Ant Design `border-beam`.
- `knowledge/patterns/brand-references.md` now indexes 71 brands after upstream added Slack.

### Impact
- Coverage remains 90.5% even after the canonical component denominator increases from 199 to 200.
- The quarterly drift baseline is refreshed: 33 components analyzed, 408 total conflicts, 1 CRITICAL, 2 HIGH, 8 MEDIUM, 397 LOW, 0 INFO.
- Re-running the extractor pipeline no longer silently strips versioning metadata from generated knowledge files.

### Verified
- All 8 audits pass.
- `bash tools/clone-refs.sh`
- `bash tools/extractors/run-all.sh`
- `python3 -B tools/extractors/component_spec_conflict_check.py --self-test`
- `python3 -B tools/extractors/component_spec_conflict_check.py --multi-source --summary-only`
- `python3 -B tools/audit/check-coverage.py`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Upstream component additions can be absorbed without losing the public 90%+ coverage claim.
- Future refs refreshes are safer because sparse checkout, generated metadata, and local Korean-market overlays are now repeatable.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Continue targeted coverage only when upstream adds product-relevant primitives.

## Phase 54 — Korean maintenance docs audit-count sync (v4.13.0) ✓ shipped

Current Korean contributor and distribution docs now match the actual 8-audit release gate and the summary-first upstream drift workflow added in Phase 53.

### Added
- `docs/CONTRIBUTING.ko.md` now documents `npm run audit:strict`, all 8 active audits, and the summary-first cross-source API reconciliation flow.
- `docs/ARCHITECTURE.ko.md`, `docs/DISTRIBUTION.ko.md`, and `docs/QUICKSTART.ko.md` now describe the current 8-audit CI/release gate.
- `README.md` and `docs/SESSION-LOG.md` now describe the current extractor/audit inventory without stale 7-audit wording.

### Impact
- Korean contributors see the same quality gate as English contributors: frontmatter, link, Korean copy, raw hex, integration, stale, coverage, and example QA.
- Release/distribution guidance no longer understates the gate by omitting raw hex hygiene.

### Verified
- All 8 audits pass.
- Full verification suite at close-out:
  - `python3 -B tools/audit/run-all.py --strict`
  - `npm test`
  - `npm run package:check`
  - `npm run release:metadata`
  - `npm run release:self-test`
  - `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Korean-language maintenance docs can be used as the source of truth for PR prep instead of sending contributors back to English docs for current audit details.
- Future audit additions have a clearer set of current docs to update in one pass.

### What's still ahead (4.x — incremental only)
- Run the quarterly upstream drift review after the next `refs/` refresh and document the result.
- Real-CI verification (push these workflows; observe green).
- External launch (held).

## Phase 53 — Upstream drift review ergonomics (v4.13.0) ✓ shipped

Quarterly upstream review now starts with a short risk summary before maintainers open the full cross-source conflict report. This keeps the drift workflow usable after crossing 90% component coverage.

### Added
- `tools/extractors/component_spec_conflict_check.py --summary-only` suppresses per-component details and prints aggregate severity counts.
- `tools/extractors/component_spec_conflict_check.py --self-test` validates CRITICAL / HIGH / MEDIUM / LOW classification and summary rendering without requiring refs parsing.
- `docs/CONTRIBUTING.md` now documents the summary-first quarterly review flow.

### Impact
- Current multi-source drift baseline remains explicit: 33 components analyzed, 413 total conflicts, 1 CRITICAL, 2 HIGH, 7 MEDIUM, 403 LOW, 0 INFO.
- Maintainers can quickly decide whether a refs refresh introduced new HIGH/CRITICAL risk before reading the full report.

### Verified
- All 8 audits pass.
- `python3 -B tools/extractors/component_spec_conflict_check.py --self-test`
- `python3 -B tools/extractors/component_spec_conflict_check.py --multi-source --summary-only`
- Full verification suite at close-out:
  - `python3 -B tools/audit/run-all.py --strict`
  - `npm test`
  - `npm run package:check`
  - `npm run release:metadata`
  - `npm run release:self-test`
  - `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Drift review becomes a fast triage gate first, then a detailed reconciliation task only when severity counts justify deeper work.
- Future provider/utility specs can be kept aligned with upstream without asking maintainers to parse hundreds of LOW library-specific differences every time.

### What's still ahead (4.x — incremental only)
- Run the quarterly upstream drift review after the next `refs/` refresh and document the result.
- Real-CI verification (push these workflows; observe green).
- External launch (held).

## Phase 52 — Coverage 90% utility specs (v4.13.0) ✓ shipped

The corpus crossed the 90% canonical component coverage milestone by documenting three foundational utility/provider primitives that are useful to real design-system authors.

### Added
- `examples/component-button-base.md` — low-level interactive primitive spec covering semantics, focus-visible handling, ripple boundaries, disabled behavior, and polymorphic root risks.
- `examples/component-css-baseline.md` — root global baseline spec covering reset ownership, body typography, color-scheme, print behavior, SSR ordering, and microfrontend boundaries.
- `examples/component-config-provider.md` — app-level provider spec covering theme, locale, direction, component defaults, portal containers, CSP, static APIs, and Korean product shell concerns.
- `examples/README.md` now exposes all three specs in the component catalog.

### Impact
- Component spec coverage: 177/199 (88.9%) → 180/199 (90.5%).
- The remaining gap is now mostly low-level internals, registry metadata, and utility types rather than common product-facing primitives.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/check-coverage.py`
- Full verification suite at close-out:
  - `python3 -B tools/audit/run-all.py --strict`
  - `npm test`
  - `npm run package:check`
  - `npm run release:metadata`
  - `npm run release:self-test`
  - `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The public corpus now has 90%+ canonical component coverage with no DRAFT banners, so adopter workflows can rely on polished specs for nearly all common primitives.
- Future coverage work can be selective: document only utility/provider entries that reduce real implementation ambiguity.

### What's still ahead (4.x — incremental only)
- Quarterly upstream drift review for polished thin specs and provider primitives.
- Real-CI verification (push these workflows; observe green).
- External launch (held).

## Phase 51 — Coverage alias accounting (v4.13.0) ✓ shipped

Coverage accounting now recognizes canonical components already covered by parent/alias specs. This moves component spec coverage from 161/199 (80.9%) to 177/199 (88.9%) without creating duplicate thin docs.

### Added
- `tools/audit/check-coverage.py` has an explicit `COVERAGE_ALIASES` map for parent-covered subcomponents and naming aliases.
- `knowledge/COVERAGE.md` now separates direct canonical spec matches from parent/alias coverage.

### Alias coverage recognized (16)
- Navigation/actions: bottom-navigation-action, card-action-area, speed-dial-icon.
- Layout/media: row, col, image-list-item, image-list-item-bar.
- Forms/lists: input-label, input-group, native-select, list-item-secondary-action.
- Data/controls: pagination-item, table-pagination-actions, toggle-group.
- Aliases/primitives: qrcode, svg-icon.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/check-coverage.py --self-test`
- `python3 -B tools/audit/check-coverage.py`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Coverage reports now distinguish missing specs from canonical entries already covered by parent component docs.
- The remaining path to 90% is narrowed to true utility/provider primitives instead of duplicate sub-component files.

### What's still ahead (4.x — incremental only)
- Coverage 90%+ maintenance, with future additions focused on genuinely useful provider/utility docs rather than duplicate sub-component files.
- Quarterly upstream drift review for polished thin specs.
- Real-CI verification (push these workflows; observe green).
- External launch (held).

## Phase 50 — DRAFT closure + reconciliation auto-apply (v4.13.0) ✓ shipped

22 DRAFT → 0 DRAFT. 22 polished. 9 families now 100% polished (Form / List / Dialog / Card / Menu / Inputs / Tabs / Steps / Accordion).

### Polished (22)
- Input family: input-base (39 props), filled-input, input-adornment.
- Table family: table-cell, -body, -head, -pagination, -container, -footer, -sort-label.
- Step family: step-icon, -label, -content.
- Misc: snackbar-content, alert-title.
- Final thin sub-components: accordion-actions, accordion-details, accordion-summary, avatar-group, step-button, step-connector, tab-scroll-button.

### Final DRAFT closure (7)
- 3 accordion subs now cover summary button semantics, disclosed body regions, and scoped action rows.
- 4 thin sub-components now cover minimal API surfaces, parent-derived state, accessibility boundaries, edge cases, and token usage.

### Added
- `component_spec_reconcile.py --apply-high` updates existing API table rows for HIGH-confidence proposals only.
- `--dry-run` previews changes; `--multi-source --apply-high` requires `--force` before writing broadly.
- Auto-apply skips missing prop rows and leaves MEDIUM/MANUAL proposals for human review.
- `raw-hex-check.py` blocks new non-allowlisted `examples/` raw hex colors so component specs stay token-alias-first.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.12.0 → 4.13.0.

### Verified
- All 8 audits pass.
- Reconciliation auto-apply self-test covers polished and scaffolded API table formats.
- Raw hex audit self-test covers token violations, allowlisted fixtures, line-level exceptions, CSS anchors, and order-number false positives.
- 22 new fully-polished specs follow established template.
- 3 cross-ref corrections (`component-stepper.md` → `component-steps.md`).

### What this enables
- Release candidates can focus on distribution confidence instead of unresolved DRAFT-spec uncertainty.
- HIGH-confidence upstream reconciliation can be applied mechanically without rewriting component narratives.
- New component examples now fail CI if they hardcode raw hex colors instead of semantic token aliases.
- Component examples no longer contain v2 scaffold DRAFT banners.

### What's still ahead at Phase 50 close
- Quarterly upstream drift review for polished thin specs.
- Coverage 80.9% → 90% (utility types — diminishing value).
- Real-CI verification (push these workflows; observe green).
- External launch (held).

## Phase 49 — Extractor v3 reconciliation mode (v4.12.0) ✓ shipped

v3 detected drift; reconciliation mode now proposes unified-API resolutions. Closes the loop on cross-source maintenance.

### Added
- `tools/extractors/component_spec_reconcile.py` — proposes unified API per component. 3-axis reconciliation (type / default / deprecation). Confidence: HIGH / MEDIUM / LOW / MANUAL. Migration notes for deprecation drift + library-specific props.
- `docs/CONTRIBUTING.md` — quarterly upstream-review 6-step workflow.

### Verified
- 33 multi-source canonicals: 3 HIGH, 411 MEDIUM, 1 MANUAL (Switch.value boolean vs unknown — same one v3 flagged CRITICAL).
- Migration notes correctly route deprecation drift (Alert.closeText, Alert.onClose).
- Library-specific props classified MEDIUM with explicit adoption guidance.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.11.0 → 4.12.0.

### What this enables
- Quarterly upstream review becomes a 6-step ritual instead of an open-ended task.
- HIGH-confidence proposals can be auto-adopted by future tooling.
- MANUAL items concentrate human attention on real design calls (1 currently).
- Migration notes preserve adopter context across version transitions.

### What's still ahead
- Polish remaining ~24 v2-DRAFT specs (incremental).
- Coverage 80.9% → 90% (utility types — diminishing value).
- Real-CI verification.
- v3 reconciliation auto-apply mode (HIGH-confidence proposals → spec edits).
- External launch (held).

## Phase 48 — CI wiring (v4.11.0) ✓ shipped

The infrastructure from v4.3–v4.10 (unit tests / audit runner / e2e tests / conflict checker) wasn't being used by CI. v4.11 wires it all in.

### Changed
- `.github/workflows/audit.yml` — 1 job → 4 jobs:
  - `audit`: uses `run-all.py` (was 5 separate steps).
  - `unit-tests` (NEW): runs CLI + VS Code lib unit tests (41 total).
  - `vscode-e2e` (NEW): real VS Code instance under xvfb; gated to push-main or PR label.
  - `conflict-check` (NEW): cross-source API drift; informational on push-main.
- `.github/workflows/publish.yml` — uses `run-all.py --strict` + adds unit-tests step.
- `package.json` + `.claude-plugin/plugin.json`: 4.10.0 → 4.11.0.

### Verified
- All 4 workflows parse as valid YAML.
- All workflow commands execute locally.
- 6 audits + 41 unit tests + size budget all run via the new pipeline.

### CI matrix
| Trigger | Runs |
| --- | --- |
| PR | audit + unit-tests |
| PR + `test:e2e` label | + vscode-e2e |
| push main | audit (--strict) + unit-tests + vscode-e2e + conflict-check |
| tag `v*` | audit (--strict) + unit-tests + npm pack + publish |

### What's still ahead
- Polish remaining ~24 v2-DRAFT specs (incremental).
- Coverage 80.9% → 90% (utility types — diminishing value).
- Real-CI verification (push these workflows; observe them green).
- v3 extractor reconciliation mode (auto-suggest unified API for HIGH conflicts).
- External launch (held).

## Phases 45-47 — VS Code e2e + extractor v3 + SESSION-LOG (v4.10.0) ✓ shipped

Three independent threads in one release.

### Phase 45 — VS Code `@vscode/test-electron` integration
- 8 e2e tests: activation, command registration (10/10), settings readability, view container, status/refresh/openSettings.
- Runs inside a real VS Code instance (downloaded ~300MB on first run, cached).
- Compiles cleanly; not exercised in this session due to download cost.

### Phase 46 — SESSION-LOG comprehensive update
- At-a-glance table extended to v4.10 (3 columns).
- Phase log extended through v4.10 (v4.0 stable → v4.10 e2e).
- Patterns refactored: 2 new v4-era patterns (Dogfood drives next-pass quality, Honest DRAFTs > false completeness) + 1 anti-pattern (audit false negatives).

### Phase 47 — Component spec extractor v3 (conflict detection)
- Cross-source conflict report: CRITICAL / HIGH / MEDIUM / LOW / INFO severity.
- Smart filtering: strips `| undefined` from type comparison; skips standard HTML props.
- First-pass scan of 33 multi-source canonicals: 1 CRITICAL (Switch.value), 2 HIGH (deprecation drift), 7 MEDIUM, 403 LOW (legitimate vendor specifics like Ant's `autoInsertSpace` for Korean).

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.9.0 → 4.10.0.
- `vscode-extension/package.json`: 0.3.0 → 0.4.0.

### Verified
- All 6 audits pass.
- 25 VS Code unit + 16 CLI unit tests pass.
- VS Code .vsix builds cleanly.
- Conflict check runs end-to-end on 33 components.

### What this enables
- VS Code regression coverage in CI (when set up).
- API drift visibility — `--strict` can gate PRs.
- Adopter switching guidance — the LOW conflict list tells adopters what they lose by switching libraries.

### What's still ahead
- Polish remaining ~24 v2-DRAFT specs (incremental).
- Coverage 80.9% → 90%+ (mostly utility types — diminishing value).
- Real-VS-Code test run + CI matrix wiring (xvfb-run on Linux).
- v3 extractor "auto-suggest reconciliation" mode (for HIGH conflicts, propose unified API).
- External launch (held).

## Phases 43-44 — Polish + coverage 80.9% (v4.9.0) ✓ shipped

Two phases combined: full polish on 18 of 21 DRAFT specs from v4.5/v4.7 (Phase 43) + coverage 68.8% → 80.9% with 24 new specs (Phase 44).

### Phase 43 — DRAFT polish
- 18 fully polished specs (Dialog parent, Stack, 5 List subs, 4 Form subs, 2 Card subs, MenuList, ToggleButton, MobileStepper, InputNumber, DialogContentText).
- 3 intentionally left as DRAFT (accordion sub-components — rarely standalone).
- Cross-ref corrections (broken paths from polished specs fixed).

### Phase 44 — Coverage push
- 24 new specs (5 polished, 19 v2 drafts).
- Polished: Fade, Grow, Tab, OutlinedInput, TableRow.
- Drafts: 19 across Transitions / Inputs / Tables / Steps / Misc families.
- Filled coverage gaps surfaced during the polish (TableCell + InputAdornment generated mid-phase to satisfy cross-refs from polished specs).

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.8.0 → 4.9.0.

### Verified
- All 6 audits pass.
- Coverage: 137 → 161 of 199 (68.8% → 80.9%) — exceeded 80% target.
- 26 new fully-polished specs.
- 3 accordion drafts retain honest DRAFT banner.

### Coverage milestone

80%+ canonical coverage. Every flagship MUI primitive is covered. Remaining 20% is mostly utility types (`use-lazy-ripple`, `class-name`, `direction`, `theme`) + edge primitives (`overridable-component`, `_registry`).

### What's still ahead
- Phase 45: VS Code real-instance tests (`@vscode/test-electron`).
- Phase 46: SESSION-LOG v4 update (full v2 → v4.9 narrative).
- Phase 47: Component spec extractor v3 (cross-source conflict detection).
- Polish remaining ~24 drafts (incremental).
- Coverage 80.9% → 90% (low-priority utility types).

## Phases 40-42 — Three-surface dogfood (v4.8.0) ✓ shipped

VS Code extension + npm distribution + mkdocs site build — three surfaces v4.7 explicitly didn't validate. All three exercised end-to-end; each surfaced real bugs that were fixed.

### Phase 40 — VS Code extension dogfood
- Findings: `docs/DOGFOOD-V4-VSCODE-FINDINGS.md`.
- Extracted pure logic to `vscode-extension/src/lib.ts` (8 helpers, 230 LOC).
- 25 unit tests against shipped JS — including a real bug: search preview lost the matched word past column 120. Fixed via `buildPreview()` that centers on the match.
- Generated `media/icon.png` (was referenced but missing → vsce package failed).
- Excluded `test/` from .vsix (was leaking into shipped package).
- Verified: 10/10 commands match between manifest and impl. tsc clean. .vsix 19.65 KB, 13 files.

### Phase 41 — npm fresh install dogfood
- Findings: `docs/DOGFOOD-V4-NPM-FINDINGS.md`.
- Full lifecycle: pack → install in mktemp → version/help/list/install/status/uninstall against fake CLAUDE_HOME.
- Surfaced: `tools/migrations/` not in npm allowlist — `/stability-review` slash command pointed adopters to scripts that weren't shipped. Fixed.
- Verified: 39 symlinks created (19 skills + 4 agents + 16 commands), all cleaned up on uninstall, sub-second install. PATH bin works.

### Phase 42 — mkdocs site build dogfood
- Findings: `docs/DOGFOOD-V4-MKDOCS-FINDINGS.md`.
- **Found and fixed false-negative in `link-check.py`**: regex required ≥1 char of link text, but inline-code-strip pre-pass converted backtick-wrapped link patterns to empty-text links, masking ALL backtick-wrapped link references. Changed `+` → `*`.
- 11 real broken links surfaced after the fix — all fixed.
- **Two missing primitive specs surfaced** (`component-dialog.md`, `component-stack.md` — flagship MUI primitives that v4.5 family-completion claimed were shipped but weren't). Generated via v2 extractor.
- Disabled `navigation.instant` in mkdocs.yml (incompatible with mkdocs-static-i18n contextual switcher).
- Verified: 782 HTML pages, 15.84 s build, both languages render, all v4.x docs included.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.7.0 → 4.8.0.
- `vscode-extension/package.json`: 0.2.0 → 0.3.0.

### What this validates
- VS Code extension code shape + shippability.
- npm distribution + fresh-machine install lifecycle.
- Doc site builds cleanly with bilingual routing.
- Audit infrastructure (link-check now catches the previously-silent class of broken backtick links).

### What's still ahead
- VS Code extension under real IDE (`@vscode/test-electron` future).
- npm publish flow (push to actual registry — deferred to launch).
- GitHub Pages deployment of doc site.
- Polish remaining drafts (now including dialog + stack from this dogfood).
- Coverage push 68.8% → 80%.

## Phase 39 — Dogfood v4 + 5 fixes (v4.7.0) ✓ shipped

End-to-end practical test on Korean B2B HR onboarding scenario. v4.0/4.5/4.6 capabilities exercised in a real flow; 5 actionable gaps surfaced and fixed in the same commit.

### Added
- `examples/cases/dogfood-v4-korean-hr-onboarding.md` — real deliverable: tokens → EmployeeInfoForm → Card + Dialog upload flow → UX audit → stability review.
- `docs/DOGFOOD-V4-FINDINGS.md` — self-critique. v3-vs-v4 time comparison: 3-5x faster on form/dialog/list-heavy work.
- `examples/component-loading-button.md` (Fix 1) — polished pattern spec.
- `knowledge/patterns/b2b-onboarding-flows.md` (Fix 3) — B2B onboarding-specific knowledge.
- Palette row 162 (Fix 4) — Korean B2B SaaS sensitive-data palette.

### Changed
- `tools/audit/stability-review.py` (Fix 2) — skip generated artifacts (`COVERAGE.md`).
- `tools/extractors/component_spec_scaffold_v2.py` (Fix 5) — banner clarifies API table is AST-extracted and trustworthy.
- Versions: 4.6.0 → 4.7.0.

### Verified
- All 6 audits pass.
- Dogfood deliverable + findings cite real specs and knowledge.
- v3 vs v4 time comparison: 3-5x faster on form/dialog/list work.

### What v4 validated
- v4.0 graduation correct — 8 stable surfaces held up.
- v4.5 family completion right call — form/dialog/list specs paid off.
- v4.6 stability automation works — false positive surfaced and fixed.

### What v4 did NOT validate (future)
- VS Code extension under real adopter load.
- npm install on fresh machine.
- Multi-language doc site rendering since v3.12.

These belong in a separate install / e2e test pass.

### What's still ahead (4.x)
- VS Code extension dogfood test.
- npm fresh-install test.
- Doc site mkdocs build verification.
- Coverage push 68.8% → 80% (transitions, table sub-components).
- Polish remaining 21 v4.5 drafts.

## Phase 38 — Stability re-review automation (v4.6.0) ✓ shipped

Operationalizes the quarterly stability review ritual. Until now, a manual step described in RELEASE-CHECKLIST. Now: report + 2 bulk tools + slash command + CONTRIBUTING walkthrough.

### Added
- `tools/audit/stability-review.py` — quarterly report generator. Sections: summary, promotion candidates (exp/beta → stable), stale stable files, deprecated review, missing-metadata files, ritual checklist.
- `tools/migrations/promote-stability.py` — bulk `stability:` field promote/demote with `--from` enforcement + `--dry-run` + atomic write.
- `tools/migrations/bump-last-updated.py` — bulk `last_updated:` refresh with `--dry-run`. Idempotent.
- `commands/stability-review.md` — slash command `/stability-review`. Runs report, summarizes inline, suggests next bulk op with confirmation gate.
- `docs/CONTRIBUTING.md` "Quarterly stability review" — full 5-step ritual.

### Changed
- `.claude-plugin/plugin.json` — registered 16th command.
- Description strings across 3 manifests: "15 commands" → "16 commands".
- Versions: 4.5.0 → 4.6.0.

### Verified
- All 6 audits pass.
- Stability review: 90 stable, 0 beta/experimental/deprecated, 1 file without metadata (`knowledge/COVERAGE.md`, generated artifact — intentional).
- Promote tool dry-run validates --from before mutating.
- Bump tool dry-run idempotent.
- Slash command file passes frontmatter + verification-phase checks.

### Workflow (per quarter)
1. `python3 tools/audit/stability-review.py --output docs/STABILITY-REVIEW.md`
2. Walk the report; decide per file.
3. Apply via `promote-stability.py` / `bump-last-updated.py`.
4. Document outcome in CHANGELOG.
5. Commit.

Or `/stability-review` in Claude Code.

### What this enables
- Knowledge freshness becomes routine, not a vague aspiration.
- Stability promotions happen on cadence; beta / experimental don't pile up.
- Deprecated files are surfaced every quarter until removed.
- Ritual discoverable in Claude Code via slash command.

### What's still ahead (4.x)
- Polish remaining 21 v4.5 drafts.
- Coverage push 68.8% → 80% (transitions, table sub-components).
- Semantic search index (Algolia / Typesense).
- Dispatch / commands integration tests.
- Component spec extractor v3 (cross-source intersection — flag prop names/types that conflict between Ant and MUI).
- VS Code marketplace publish (when external launch happens).

## Phase 37 — Coverage push 55% → 68.8% (v4.5.0) ✓ shipped

First coverage push using v2 extractor. Crosses 2/3 canonical coverage. Family-completion focus on the primitives Korean B2B / fintech UIs lean on most.

### Added — 27 new specs (110 → 137 of 199)
- **6 fully polished** (real spec style, not draft): `list-item`, `menu-item`, `dialog-title`, `dialog-content`, `dialog-actions`, `card-content`, `card-actions`, `form-control`.
- **21 v2-extracted drafts** with DRAFT banner + accurate API table + placeholder narrative:
  - List family (5): `list-item-button` / `-icon` / `-text` / `-avatar`, `list-subheader`.
  - Form family (4): `form-control-label`, `form-group`, `form-helper-text`, `form-label`.
  - Card family (2): `card-header`, `card-media`.
  - Dialog family (1): `dialog-content-text`.
  - Accordion family (3): `accordion-actions` / `-details` / `-summary`.
  - Menu (1): `menu-list`.
  - Standalone (2): `toggle-button`, `mobile-stepper`.
  - From v4.4: `input-number`.

### Changed
- `tools/extractors/component_spec_scaffold_v2.py` `find_mui_source` — fall back to `.d.ts` (MUI ships compiled JS + types). Unlocks AST extraction for all MUI sub-components.
- `package.json` + `.claude-plugin/plugin.json`: 4.4.0 → 4.5.0.

### Verified
- All 6 audits pass.
- Coverage: 110 → 137 (55.3% → 68.8%).
- 6 polished specs follow established sub-component style.
- 21 drafts retain honest "DRAFT — scaffolded via TS-AST" banner.

### Coverage check by family
| Family | Status |
| --- | --- |
| Form (FormControl + 4 sub-roles) | complete |
| List (ListItem + 5 sub-roles) | complete |
| Dialog (Title / Content / Actions / ContentText) | complete |
| Card (Content / Actions / Header / Media) | complete |
| Accordion (Actions / Details / Summary) | complete |
| Menu (Item / List) | complete |
| Transitions (Fade / Grow / Zoom / Slide) | partial |
| Sub-components / utility types | thin (intentional) |

### Why honest drafts vs polished for all 27
v2 produces accurate API + structure but placeholder narrative. 6 flagship sub-components got full polish; remaining 21 retain DRAFT banner. False completeness > honest "in progress" — the banner tells reviewers what's still pending.

### What this enables
- Family-completion: designers find all sub-roles together.
- Real-world Korean fintech UIs covered (List + Form + Dialog + Card).
- v2 extractor validated end-to-end (27 in one pass, zero parser bugs).

### What's still ahead (4.x)
- Stability re-review automation (Phase 38).
- Polish remaining 21 v4.5 drafts (incremental, as user feedback comes in).
- Coverage push 68.8% → 80% (transitions, more table sub-components).
- Semantic search index.
- VS Code marketplace publish.

## Phase 36 — Component spec extractor v2 (v4.4.0) ✓ shipped

TypeScript AST parsing replaces regex. The v2 extractor produces noticeably cleaner drafts and unlocks faster coverage pushes (Phase 37).

### Added
- **`tools/extractors/ts-ast/parse-component.mjs`** — Node.js parser using TS Compiler API. AST walk covers interfaces, type aliases, components (function / arrow / forwardRef / memo), destructured defaults, JSDoc tags (`@deprecated`, `@default`, `@since`).
- **`tools/extractors/ts-ast/package.json`** — local dev package (`typescript` dep). Not shipped via npm.
- **`tools/extractors/component_spec_scaffold_v2.py`** — Python wrapper. Invokes parser, picks primary `*Props` interface, merges across Ant + MUI + shadcn with per-prop provenance, separates events, surfaces deprecated.

### Changed
- `package.json` + `.claude-plugin/plugin.json`: 4.3.0 → 4.4.0.

### Verified
- Parser correctly handles: Ant Button (deprecated `iconPosition` flagged), shadcn Button (intersection type + 3 destructured defaults), MUI components.
- v2 produced clean draft for `input-number` (14 props, 3 auto-flagged deprecated).
- 6 audits pass; 16 CLI unit tests pass.

### v1 → v2 capability gain
| Capability | v1 (regex) | v2 (AST) |
| --- | --- | --- |
| Generic `Props<T>` | ✗ | ✓ |
| extends chains | ✗ | ✓ |
| Intersection types | partial | ✓ |
| Destructured defaults | ✗ | ✓ |
| `@deprecated` JSDoc | ✗ | ✓ |
| Event handler grouping | mixed | separate |
| Per-prop provenance | first-source | all sources |

### What this enables
- Coverage push 55→70% (Phase 37) becomes practical — drafts require less cleanup.
- Reviewer sees "prop X exists in Ant+MUI but not shadcn" at a glance.
- Deprecated props auto-surface for review.

### What's still ahead (4.x)
- Coverage push 55% → 65% using v2 (Phase 37).
- Stability re-review automation (Phase 38).
- Semantic search index.
- Dispatch / commands integration tests.
- VS Code marketplace publish.

## Phase 35 — Internal completeness (v4.3.0) ✓ shipped

Tightens internal quality. Pure dogfooding work — no new content, but the corpus and tooling are now more consistent and testable.

### Added
- **`tools/audit/run-all.py`** — unified runner for all 6 audits. ~0.8s end-to-end. `--strict` for CI, `--quiet` for minimal output.
- **CLI unit tests** — 16 tests across `cli/lib/paths.test.mjs` + `cli/lib/log.test.mjs`. Covers path resolution, file/dir checks, color helpers in NO_COLOR mode. Uses `node --test` (Node 18+ built-in).
- **VS Code extension `design-ai.openReadme`** — language-aware README opener.
- **VS Code extension `design-ai.search`** — corpus-wide markdown search with jump-to-line.

### Changed
- **`tools/audit/check-coverage.py`** — verification phase check tightened. Strict: canonical `## Verification phase` heading. Loose-only cases surfaced separately for nudging.
- **`skills/figma-token-sync/PLAYBOOK.md`** — `### 7. Verification phase` → `## Verification phase (run before declaring done)`.
- **`skills/slide-deck-author/PLAYBOOK.md`** — same standardization.
- **VS Code extension `design-ai.openWalkthrough`** — language-aware. Prefers `.ko.md` when `design-ai.language: ko`; quick-pick shows `[KO]` / `[EN]` tags.
- **VS Code extension `design-ai.status`** — Korean labels when `design-ai.language: ko`.
- **VS Code extension `commands.ts`** — extracted `readManifest()` + `PluginManifest` interface. Removed unused `child_process` import.
- **`vscode-extension/package.json`** — extension version 0.1.0 → 0.2.0. New commands registered.
- **`package.json` scripts** — `npm test` runs CLI tests; `npm run audit` uses unified runner; `npm run audit:strict` for CI.
- `package.json` + `.claude-plugin/plugin.json`: 4.2.0 → 4.3.0.

### Verified
- All 6 audits pass via unified runner (0.81s).
- 16 CLI unit tests pass.
- VS Code extension compiles cleanly (`tsc --noEmit` zero errors).
- All 19 skills use canonical `## Verification phase` heading.

### What this enables
- One-command quality gate (`npm run audit`).
- First test-backed CLI helpers — foundation for further test growth.
- Language-aware VS Code experience for KR adopters.
- Searchable corpus from inside VS Code.
- Skill heading consistency — future audits can hard-fail on non-canonical formats.

### What's still ahead (4.x)
- Coverage push 55% → 70%.
- Component spec extractor v2 (TS AST parsing).
- Semantic search index (Algolia / Typesense) — externally hosted, complements VS Code in-tree search.
- Dispatch / commands integration tests (currently only pure-logic helpers tested).
- VS Code marketplace publish (1.0.0).
- Stability re-review ritual (quarterly stale-check at warn-months 3).
- Homebrew formula refresh post-tag.

## Phase 34 — Launch kit (v4.2.0) ✓ shipped

Ready-to-post announcement materials. Drafts only — posting is owner action. Each draft uses the voice/length its channel rewards.

### Added — `docs/announcements/` (7 drafts + index)
- **`README.md`** — index, posting order, tracking template, channel tone matrix.
- **`press-kit.md`** — one-liner / stats card / origin narrative / FAQ (EN + KO).
- **`show-hn.md`** — Show HN title alts + body + reply-prep for likely questions.
- **`okky-post.ko.md`** — OKKY long-form (해요체, ~600 words, KR adoption focus).
- **`hashnode-post.ko.md`** — hashnode blog (해요체, ~800 words, retrospective tone).
- **`dev-to-korea.md`** — dev.to (EN + bilingual examples, ~600 words).
- **`twitter-thread.md`** — parallel EN + KO threads (8 tweets each).
- **`reddit-r-korea.md`** — r/programming + r/korea + r/ClaudeAI with rule notes per sub.

### Changed
- `package.json` + `.claude-plugin/plugin.json`: 4.1.0 → 4.2.0.

### Verified
- All 6 audits pass.
- KR drafts in natural Korean (no auto-translation).

### Posting cadence (suggested)
- Day 1: HN + dev.to.
- Day 2: r/programming.
- Day 3: r/korea + r/ClaudeAI.
- Day 4-7: OKKY + hashnode + Twitter threads (EN + KO 2hr offset).
- Track in `docs/announcements/posted.md`.

### What this enables
- Owner pushes v4.0 tag → verifies CI publish → posts in any order without last-minute writing.
- Channel-tailored tone per draft — lower friction for owner, higher engagement per channel.
- Press kit reusable for v4.1 / v5.0 releases.

### What's still ahead (4.x)
- VS Code marketplace publish (1.0.0).
- Coverage push 55% → 70%.
- Component spec extractor v2 (TS AST).
- Semantic search index (Algolia / Typesense).
- Stability re-review ritual (quarterly stale-check at warn-months 3).
- Homebrew formula refresh post-tag.

## Phase 33 — Korean adopter / contributor docs (v4.1.0) ✓ shipped

First 4.x minor. Continues v3.6 / v3.10 KR i18n investment. Three foundational docs previously English-only are now Korean-native.

### Added
- **`docs/USING.ko.md`** — 사용자 가이드 (5개 도구 통합, 토큰 예산, KR 컨텍스트 표).
- **`docs/CONTRIBUTING.ko.md`** — 기여 가이드 (스킬 / 에이전트 / 커맨드 추가, 버전 메타데이터, 한국어 톤 가이드, 6개 감사, PR 플로).
- **`docs/ARCHITECTURE.ko.md`** — 아키텍처 (4 계층 다이어그램, 계약, 6개 감사 표, 4개 배포 채널).

### Changed
- `mkdocs.yml` — `nav_translations`에 사용 가이드 / 기여 가이드 추가. `docs_structure: suffix`로 `.ko.md` 자동 매핑.
- `package.json` + `.claude-plugin/plugin.json`: 4.0.0 → 4.1.0.

### Verified
- All 6 audits pass.
- Korean copy check now scans 29 files (was 26).

### Translation approach
- 사용자 / 기여자 대상: 해요체 (친근).
- 아키텍처 / 기술 문서: 중립적 톤 (해요체 유지하되 설명형).
- 코드 / 명령어: 영문 유지.
- 기술 용어 (API, frontmatter): 영문이 자연스러우면 영문.
- 한국 브랜드 / 컨벤션: 한국어 유지.

### What this enables
- Korean adopters can sense-check (USING.ko, ARCHITECTURE.ko) before adopting.
- Korean contributors can follow the contribution flow without English friction.
- KR community announcement materials can link to Korean-native docs.

### Korean docs coverage now
| Doc | EN | KO |
| --- | --- | --- |
| README | ✓ | ✓ (v3.6) |
| QUICKSTART | ✓ | ✓ (v3.6) |
| AGENTS | ✓ | ✓ (v3.6) |
| DISTRIBUTION | ✓ | ✓ (v3.6) |
| USING | ✓ | ✓ (v4.1) |
| CONTRIBUTING | ✓ | ✓ (v4.1) |
| ARCHITECTURE | ✓ | ✓ (v4.1) |
| 5 integration walkthroughs | ✓ | ✓ (v3.10) |
| 8 KR-specific knowledge files | ✓ | KR-native already |

Foundational doc set: now fully bilingual.

## Phase 32 — Stable (v4.0.0) ✓ shipped

**Graduation release.** No code changes from v3.12.0 — this phase promotes the corpus to stable, codifies the API surface, and commits to a deprecation policy. The major bump signals to adopters: design-ai is no longer a moving target.

### Added
- **`docs/MIGRATION-v4.md`** — graduation migration guide:
  - TL;DR: no code changes required.
  - What v4.0 promises (8 surfaces: knowledge / skills / commands / agents / CLI / plugin / VS Code / doc site).
  - What v4.0 does NOT promise (content evolution still expected).
  - Stability levels recap.
  - Deprecation policy: deprecate in 4.x → maintain in 4.x → remove in 5.0.
  - Upgrade instructions per channel (npm / git / Homebrew / VS Code).
  - Verification commands.

### Changed
- `package.json` + `.claude-plugin/plugin.json`: 3.12.0 → 4.0.0.

### Verified (RELEASE-CHECKLIST.md run)
- All 6 audits pass (frontmatter / link / Korean copy / coverage / integration-check / stale-check).
- Version alignment: package.json + plugin.json + CHANGELOG.md top entry all match.
- CLI smoke test: `version` / `help` / `status` / `list skills` clean.
- `npm pack --dry-run`: tarball within budget; allowlist correct.
- Doc site builds.
- VS Code extension compiles.

### Deprecation policy (effective from v4.0)

Anything publicly documented (skills, commands, CLI flags, plugin fields, knowledge file IDs) follows:

1. **Deprecate in 4.x:** Mark `deprecated: true` (or `stability: deprecated` for knowledge); update docs; log warning.
2. **Maintain in 4.x:** All deprecated surfaces keep working through the 4.x line.
3. **Remove in 5.0:** Only at next major.

Adopters always get one full minor cycle of warnings.

### The journey (v2.0 → v4.0)

| Surface | v2.0 | v4.0 |
|---|---|---|
| Knowledge files | 55 | 91 |
| Worked examples | 83 | 160 |
| Skills | 12 | 19 |
| Slash commands | 8 | 15 |
| Review agents | 4 | 4 |
| Component coverage | ~24% | 55.3% |
| Distribution channels | 1 | 4 |
| Integration walkthroughs | 0 | 5 (EN + KO) |
| Site languages | 0 | 2 |
| CI audits | 4 | 6 |

### What's still ahead (4.x)
- KR tech community announcement (OKKY, hashnode.kr, dev.to/korea).
- VS Code marketplace publish (1.0.0).
- Homebrew formula refresh post-tag (sha256 + version).
- Coverage push 55% → 70%.
- More Korean translations (CONTRIBUTING.ko.md, ARCHITECTURE.ko.md, USING.ko.md).
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).
- Stability re-review ritual (quarterly cycle defined in RELEASE-CHECKLIST.md).

## Phase 31 — Release readiness (v3.12) ✓ shipped

Closes the v3.x arc. Operationalizes the versioned frontmatter from v3.11 with a stale-content audit, codifies the pre-release ritual, and narrates the journey for adopters / contributors / future maintainers.

### Added
- **`tools/audit/stale-check.py`** — flags knowledge files whose `last_updated` is too old:
  - Default thresholds: warn at 6 months, error at 12 months.
  - Configurable via `--warn-months` / `--error-months`.
  - `--strict` exits 1 on stale (for CI).
  - `--today YYYY-MM-DD` for testing.
  - Files without `last_updated` are skipped (backward-compatible).
  - Treats `YYYY-MM` as last day of month (most generous reading).
- **`docs/RELEASE-CHECKLIST.md`** — pre-release ritual:
  - 11 main sections: audits / version alignment / CHANGELOG / ROADMAP / CLI smoke test / NPM preview / doc site build / VS Code build / Korean copy spot-check / tag and push / post-tag.
  - Major-version add-ons: migration guide / announcement template / stability re-review.
  - Channel-specific: VS Code marketplace publish (`vsce`), Homebrew formula update (`shasum -a 256`).
  - Common failure modes table (8 symptoms → causes → fixes).
  - Stability promotion ritual (quarterly review cycle).
- **`docs/SESSION-LOG.md`** — single-page narrative v2.0 → v3.12:
  - At-a-glance metrics table (knowledge / examples / skills / commands / coverage / channels / languages / audits).
  - The arc: foundation → domain expansion → distribution → coverage acceleration → VS Code → Korean depth → release readiness.
  - Phase log v2.1 → v3.12 (20 phases).
  - Patterns that worked / didn't.
  - Repo structure.

### Changed
- **`.github/workflows/audit.yml`** — added stale-content audit step:
  - Strict mode (`--strict`) on `push` to `main` (CI fails on ≥12-month-stale files).
  - Warn-only on PRs (so contributors can see warnings without blocking).
- `package.json` + `.claude-plugin/plugin.json`: 3.11.0 → 3.12.0.

### Verified
- All 6 audits pass (frontmatter / link / Korean copy / coverage / integration-check / stale-check).
- Stale-check output: "Fresh (≤ 6 months): 90, Skipped (no last_updated): 1, Total knowledge files: 91, All knowledge files within freshness window ✓".
- Stale-check tested with `--today 2027-08-15` — correctly flagged 75 files as 15 months stale (would fail CI under `--strict`).

### Audits — now 6
| # | Script | Purpose |
| --- | --- | --- |
| 1 | `frontmatter-check.py` | YAML frontmatter validity + version field shape |
| 2 | `link-check.py` | Internal link resolution |
| 3 | `korean-copy-check.py` | Korean voice / register / typography |
| 4 | `check-coverage.py` | Component coverage report |
| 5 | `integration-check.py` | Integration walkthrough completeness |
| 6 | `stale-check.py` | Knowledge freshness (last_updated thresholds) |

### What this enables
- **Confident releases** — RELEASE-CHECKLIST.md codifies the pre-tag ritual; nothing slips through.
- **Continuous freshness** — stale-check runs on every push to main; surfaces files that need review before they rot.
- **Project narrative** — adopters / contributors can read SESSION-LOG.md to understand the arc.
- **v4.0 readiness** — design-ai is now versioned, audited, distributed (4 channels), localized (EN + KO), release-checklisted.

### What's still ahead (v4.0+)
- Tag v4.0.0 stable.
- VS Code marketplace publication (1.0.0).
- KR tech community announcement (OKKY, hashnode.kr, dev.to/korea).
- Coverage push 55% → 70%.
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).
- More Korean translations (CONTRIBUTING.ko.md, ARCHITECTURE.ko.md, USING.ko.md).

## Phase 30 — Versioned knowledge frontmatter (v3.11) ✓ shipped

Foundation for v4.0 stability. Every knowledge file now carries `version`, `last_updated`, and `stability` metadata. Adopters can pin to specific versions; future audits can flag stale content.

### Added
- **`tools/migrations/add-version-frontmatter.py`** — one-shot migration script:
  - Idempotent (re-running skips already-versioned files).
  - Detects existing frontmatter (with optional leading HTML comment), inserts before closing `---`.
  - `--write` to apply; default is dry-run.
  - Locates 91 knowledge files; all updated.
- **`tools/audit/frontmatter-check.py`** — validates new optional fields:
  - `version`: semver-shaped (`1.0.0`, `1.2.3-beta`).
  - `last_updated`: `YYYY-MM` or `YYYY-MM-DD`.
  - `stability`: one of `stable` / `beta` / `experimental` / `deprecated`.
  - Missing keys remain OK (backward-compatible).
- **`tools/migrations/`** directory — new home for one-shot migration scripts.

### Changed
- All 91 knowledge files — frontmatter extended with version metadata; no content changes.
- `package.json` + `.claude-plugin/plugin.json`: 3.10.0 → 3.11.0.

### Stability levels
| Level | Meaning |
| --- | --- |
| `stable` | Reviewed; canonical; safe to depend on |
| `beta` | Substantively complete but pending review or polish |
| `experimental` | Active iteration; may change significantly |
| `deprecated` | Superseded; will be removed in a future major version |

All current knowledge starts at `stable`.

### Verified
- All 5 audits pass.
- Migration script idempotent.
- Format identical across 91 files.

### What this enables
- **Version pinning** — "knowledge v1.0.0" reference for adopters.
- **Stale-content detection** — future audit can flag `last_updated > 12 months ago`.
- **Stability-aware skills** — skills can prefer `stable` knowledge.
- **Migration tracking** — `last_updated` will diverge over time as files are reviewed individually.

### What's still ahead (v3.12+)
- Coverage push 55% → 70%.
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).
- VS Code marketplace publication (1.0.0).
- Stale-content audit (flag files with old `last_updated`).
- More Korean translations.

## Phase 29 — Korean integration walkthroughs (v3.10) ✓ shipped

Five integration walkthroughs translated to Korean. Continues v3.6 KR i18n investment — primary audience (KR designers / developers) can use Codex / Cursor / Aider / SDK / VS Code without English friction.

### Added
- **5 Korean walkthroughs** in `docs/integrations/`:
  - `codex-walkthrough.ko.md` — Codex CLI 워크스루
  - `cursor-walkthrough.ko.md` — Cursor 워크스루
  - `aider-walkthrough.ko.md` — Aider 워크스루
  - `sdk-walkthrough.ko.md` — Anthropic + OpenAI SDK 워크스루
  - `vscode-walkthrough.ko.md` — VS Code 확장 워크스루
- Each translation includes 4-5 worked sessions (matching English depth), not abridged summaries.

### Changed
- **`tools/audit/korean-copy-check.py`** — added `.ko.md` pattern; now scans 26 Korean-relevant files (was 17).
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.9.0 → 3.10.0.

### Translation approach
- 어댑터 / 사용자 대상 콘텐츠는 해요체 (친근).
- 코드 블록은 영문 유지 (대부분 명령어 / API).
- 한국어 브랜드 이름은 한국어 유지 (Toss, KakaoPay, Pretendard).
- Direct word-for-word translation 거부 — 한국어 자연스러움 우선.
- Each Korean file mirrors the English structure (Prerequisites / Setup / Walkthroughs / Tips / Troubleshooting) but with Korean phrasing.

### Verified
- All 5 audits pass.
- Korean copy check picks up 26 files (was 17).
- 358 internal links resolve.

### What this enables
- **Korean adopters** can use any of 5 AI coding tools with full Korean walkthroughs.
- **Korean B2B teams** can share walkthroughs with non-developer stakeholders.
- **Lower English-friction** for KR designers evaluating design-ai.
- **Audit coverage** — Korean files validated by korean-copy-check on every PR.

### What's still ahead (v3.11+)
- Coverage push 55% → 70%.
- Versioned knowledge files (semver in frontmatter).
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).
- VS Code marketplace publication (1.0.0).
- More Korean translations (CONTRIBUTING.ko.md, ARCHITECTURE.ko.md, USING.ko.md).
- Brand identity polish for v4.0 (logo refinement, marketing landing).

## Phase 28 — Coverage push 45% → 55% (v3.9) ✓ shipped

Component coverage from 45.2% → **55.3%** (90 → 110 of 199 canonical components). Majority canonical coverage milestone. Form / overlay / transition / notification primitives largely complete.

### Added (18 net new + 2 renames)

**Form / control primitives** (3):
- `component-switch.md` — iOS-style toggle (Switch vs Checkbox decision)
- `component-textarea.md` — multi-line input; Korean IME handling
- `component-textarea-autosize.md` — grows-with-content variant

**Notifications** (2):
- `component-snackbar.md` — Material's bottom-Toast variant
- `component-sonner.md` — modern shadcn library; stacking + promise wrapper

**Overlays** (3):
- `component-popconfirm.md` — inline confirmation
- `component-popper.md` — low-level positioning primitive
- `component-click-away-listener.md` — outside-click utility

**Display / layout** (4):
- `component-tag.md` — closeable chip
- `component-resizable.md` — IDE-style panels
- `component-image-list.md` — uniform-grid photos
- `component-toolbar.md` — action container

**Mobile** (1):
- `component-swipeable-drawer.md` — swipe-to-open

**Floating / scroll** (2):
- `component-back-top.md` — scroll-to-top
- `component-speed-dial-action.md` — sub-action

**Transitions** (2):
- `component-zoom.md` — scale + fade
- `component-slide.md` — direction-based

**Sub-components** (1):
- `component-step.md` — sub-component of Steps

**Renames** (2):
- `component-autocomplete.md` → `component-auto-complete.md`
- `component-mention.md` → `component-mentions.md`

### Versions
- CLI: 3.8.0 → 3.9.0
- Plugin / corpus: 3.8.0 → 3.9.0

### Verified
- All 5 audits pass.
- 110/199 = 55.3% coverage.
- Examples: 142 → 160 (+18).

### What this enables
- **Majority canonical coverage** — over half the 199-component surface.
- **Notification family complete** — Toast / Snackbar / Sonner / Message / Notification / Banner / Alert distinguished + comparable.
- **Transition primitives complete** — Fade / Zoom / Slide / Grow / Collapse referenced from one consistent vocabulary.
- **Form primitives complete** — Switch / Checkbox / Radio / Label / Textarea + autosize / Field family all distinct.

### What's still ahead (v3.10+)
- Coverage push 55% → 70% (next batch).
- Versioned knowledge files (semver in frontmatter).
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).
- VS Code marketplace publication (1.0.0 milestone).
- Korean translations of integration walkthroughs.

## Phase 27 — VS Code extension (v3.8) ✓ shipped

design-ai is now accessible inside VS Code via a dedicated extension. New distribution surface for the millions of VS Code users — pairs with any AI assistant (Copilot Chat / Cursor / Continue / Claude / CodeWhisperer) without competing.

### Added
- **`vscode-extension/`** — TypeScript-based VS Code extension:
  - `package.json` manifest:
    - 8 commands (Install / Status / Open knowledge / Open spec / Open skill / Open walkthrough / Refresh / Settings).
    - 4 sidebar TreeViews (Skills / Knowledge / Examples / Walkthroughs) under a dedicated activity bar entry.
    - 2 settings (`design-ai.path`, `design-ai.language`).
  - `src/extension.ts` — entry point. Path auto-probing on activation; reactive to setting changes.
  - `src/paths.ts` — locates design-ai source via setting → workspace folder → common locations (~/dev/design-ai, ~/.local/lib, /opt, npm-global, Homebrew lib).
  - `src/commands.ts` — 8 command implementations. `Install` invokes the project's `install.sh`. `Status` reads `.claude-plugin/plugin.json` for version + counts. Open commands use `showQuickPick` for fast filtering across the corpus.
  - `src/providers/trees.ts` — 4 TreeDataProviders. Knowledge tree is recursive (categories → files); Skills / Examples / Walkthroughs are flat lists.
  - `media/icon.svg` — gradient indigo/violet "D" mark.
  - `tsconfig.json`, `.vscodeignore`, `LICENSE`, `README.md`, `CHANGELOG.md`.
- **`docs/integrations/vscode-walkthrough.md`** — 5 worked sessions:
  - Browse + reference in chat
  - Audit existing component
  - Generate from skill PLAYBOOK
  - Quick-pick across the corpus
  - Multi-file design system bootstrap
- **`tools/audit/integration-check.py`** — added vscode-walkthrough.md to validation list (5 walkthroughs total).

### Changed
- `README.md` agent table — VS Code added as supported environment with link to walkthrough.
- `mkdocs.yml` Integrations nav — VS Code entry added.
- `package.json` + `.claude-plugin/plugin.json`: 3.7.0 → 3.8.0.

### Verified
- All 5 audits pass.
- Integration audit covers all 5 walkthroughs (added vscode-walkthrough.md).
- Extension scaffold compiles cleanly via `tsc -p .` (TypeScript 5.3+ required).

### Versions
- CLI: 3.7.0 → 3.8.0
- Plugin / corpus: 3.7.0 → 3.8.0
- VS Code extension: 0.1.0 (initial release; lives in `vscode-extension/`)

### What this enables
- **VS Code users** browse design-ai content without leaving the editor.
- **Pair with any AI assistant** — Copilot Chat / Cursor / Continue / Claude / CodeWhisperer.
- **Korean preference setting** — `design-ai.language: "ko"` opens Korean translations.
- **Doesn't compete with AI assistants** — surfaces design-aware **content**, complements AI tools.

### Publication path (maintainer)
The extension is scaffolded but not yet published to the VS Code Marketplace. Steps:
```bash
cd vscode-extension
npm install
npm run compile
npx @vscode/vsce package        # produces .vsix
npx @vscode/vsce publish        # requires Azure DevOps PAT + publisher account
```

Until then, distribute via GitHub Releases.

### What's still ahead (v3.9+)
- Coverage push 45% → 60%.
- Versioned knowledge files (semver in frontmatter).
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).
- VS Code marketplace publication (1.0.0 milestone).
- More Korean translations.
- VS Code extension: walkthroughs panel (vscode walkthrough API), code actions for spec compliance.

## Phase 26 — Coverage push 36.2% → 45.2% (v3.7) ✓ shipped

Component coverage from 36.2% → **45.2%** (72 → 90 of 199 canonical components). Crosses the halfway-to-100% threshold for canonical primitive coverage.

### Added (18 specs)

17 net new + 1 rename.

**Form / control primitives** (5):
- `component-checkbox.md` — indeterminate state, "select all", KR marketing-consent rule
- `component-radio.md` (+ RadioGroup) — mutually exclusive choice; Korean payment-method picker
- `component-label.md` — htmlFor linking; required / optional indicators
- `component-icon.md` — base primitive (size, currentColor, decorative vs meaningful)
- `component-icon-button.md` — icon-only variant; mandatory aria-label

**Layout primitives** (4):
- `component-box.md` — most generic styled `<div>` (system props pattern)
- `component-flex.md` — flex layout (direction / gap / align / justify)
- `component-grid.md` — 2D layout (Ant Row+Col / MUI v2 / CSS Grid)
- `component-space.md` — inline-gap utility (sibling to Flex / Stack)

**Navigation / overlays** (3):
- `component-menu.md` — Ant-style structured nav (distinct from Dropdown / NavigationMenu / Sidebar)
- `component-button-group.md` — visually unified action cluster
- `component-speed-dial.md` — FAB + 2-5 sub-action FABs (mobile compose pattern)

**Feedback / data** (3):
- `component-message.md` — Ant top thin pill notification (vs Toast / Notification / Banner)
- `component-notification.md` — richer corner card (title + description + actions)
- `component-list.md` — semantic wrapper around Item rows; pagination + virtualization

**Pickers** (2):
- `component-time-picker.md` — hour/minute/second; 24/12-hour; KR step conventions
- `component-tree-select.md` — dropdown hierarchy picker (vs Cascader / Tree)

**Utility** (1):
- `component-backdrop.md` — semi-opaque scrim overlay

**Renamed** (1):
- `component-qrcode.md` → `component-qr-code.md` (canonical kebab-case)

### Verified
- All 5 audits pass.
- Coverage: 72 → 90 (45.2%).
- Examples: 124 → 142.
- Versions bumped: 3.6.0 → 3.7.0.

### What this enables
- **Halfway to 100%** — 45.2% milestone for canonical primitive coverage.
- **Form construction primitives complete** — Checkbox / Radio / Label / Field family / Switch (form-controls) all specced. Form skill output uses real spec foundations.
- **Layout primitives covered** — Box / Flex / Grid / Stack / Space / Masonry — adopters pick the right tool.
- **Notification family unified** — Toast / Message / Notification / Banner / Alert all distinct + comparable.
- **Pickers complete enough** — DatePicker / TimePicker / TreeSelect / Cascader / Combobox / Select all specced.

### What's still ahead (v3.8+)
- Coverage push 45% → 60% (next 30+ specs).
- VS Code extension wrapper.
- Semantic search index for the doc site.
- Versioned knowledge files (semver in frontmatter).
- Component spec extractor v2 (TS AST parsing).
- More Korean translations of integration walkthroughs.

## Phase 25 — Doc site Korean i18n (v3.6) ✓ shipped

design-ai's primary audience is Korean. The doc site was English-only; this phase makes it bilingual so KR users can evaluate and adopt without English friction. Direct lever for the user's stated 시장성 / 대중성 goal.

### Added
- **4 Korean translations of high-traffic pages**:
  - `README.ko.md` — Korean primary landing with full feature coverage, install paths, agent table, KR market focus, source material, status, contribution guidelines, changelog highlights.
  - `docs/QUICKSTART.ko.md` — 5-minute getting-started in Korean.
  - `docs/DISTRIBUTION.ko.md` — Distribution guide (NPM / Homebrew / git clone) in Korean with 한국어 어댑터 가이드 section.
  - `AGENTS.ko.md` — Universal agent entry point in Korean. Mirrors English AGENTS.md with KR-specific guidance built in.
- **`mkdocs-static-i18n` plugin** — file-suffix translation pattern. Same content tree, two languages.
- **mkdocs nav translations** — Home / Quickstart / Distribution / Architecture / Knowledge / Skills / Commands / Agents / Examples / Integrations / Reference all translated.
- **Header language switcher** — mkdocs-material's `extra.alternate` provides English / 한국어 toggle in nav.
- **README badges** — language toggle at top of both READMEs.
- **`tools/build-docs.sh`** updated to symlink Korean translations into `site-src/`.

### Changed
- `docs/requirements.txt` — added `mkdocs-static-i18n>=1.3.0`.
- `mkdocs.yml` — i18n plugin config + nav_translations + extra.alternate.
- `README.md` (English) — language toggle to Korean variant.
- `package.json` + `.claude-plugin/plugin.json` versions: 3.5.0 → 3.6.0.

### Verified
- All 5 audits pass (frontmatter / link / Korean / coverage / integration-check).
- mkdocs build succeeds in 12s with both languages.
- Korean pages render at `/ko/` with translated nav.
- Search supports both English and Korean tokenizers.

### Voice / register choices

For Korean translations:
- **README + QUICKSTART**: 해요체 (friendly) — adopters / explorers
- **AGENTS.md**: 해요체 — agent-facing instructions
- **DISTRIBUTION**: mixed — code blocks in code, narrative in 해요체
- Direct translation rejected — adapted to natural Korean (e.g., "let's get started" → "시작해 봐요" not "시작합시다 우리는")

### What this enables
- **Korean adopters can evaluate** without bouncing off English.
- **SEO for the primary market** — Korean meta tags improve Naver / Google KR indexing.
- **B2B Korean teams** can share Korean docs with non-developer stakeholders.
- **Lower adoption barrier** — KR designers see "made for our market" via the toggle alone.

### What's still ahead (v3.7+)
- Translate more pages (CONTRIBUTING.ko.md, ARCHITECTURE.ko.md, integrations Korean).
- Coverage push 36% → 50% (extractor accelerates).
- VS Code extension wrapper.
- Semantic search index (Algolia / Typesense) for cross-language search.
- Versioned knowledge files (semver in frontmatter).
- Component spec extractor v2 (TS AST parsing).

## Phase 24 — Component spec scaffolder + coverage push (v3.5) ✓ shipped

Component coverage from 30.7% → **36.2%** (61 → 72 of 199 canonical components). Builds an extractor that scaffolds future spec drafts from upstream sources, then exercises the muscle with 11 new manual specs.

### Added
- **`tools/extractors/component_spec_scaffold.py`** — leverage tool:
  - Given a canonical name (e.g., `combobox`), reads upstream sources from `refs/{ant,mui,shadcn}`.
  - Best-effort prop extraction from TypeScript interfaces.
  - Emits `examples/component-{name}.md` as a draft following the established skill template.
  - Banner clearly marks output as DRAFT — maintainer must review narrative sections + tokens before shipping.
  - CLI flags: `--name X`, `--all-missing`, `--limit N`, `--force`, `--dry-run`.
  - Graceful degradation when `refs/` is missing — produces template anyway.
- **11 component specs** (manual, full-quality):
  - `component-alert-dialog.md` — destructive confirmation; `role="alertdialog"` + Cancel default focus
  - `component-bottom-navigation.md` — mobile primary nav; iOS + Android + M3 conventions
  - `component-chart.md` — Recharts wrapper; KR stock convention (red=up); chart-type selection
  - `component-combobox.md` — searchable select; WAI-ARIA combobox; Korean IME handling
  - `component-field.md` — Field family form-wrapper (Field / FieldLabel / FieldDescription / FieldError / FieldGroup / FieldSet / FieldLegend)
  - `component-item.md` — list-item primitive (Item / ItemMedia / ItemContent / ItemTitle / etc.)
  - `component-link.md` — text link primitive; Link vs Button decision; external indicator
  - `component-paper.md` — MUI surface primitive (elevation + outlined)
  - `component-spinner.md` — indeterminate loading; Spinner vs Progress vs Skeleton
  - `component-empty.md` — inline "no data" primitive; distinct from EmptyState (custom)
  - `component-masonry.md` — Pinterest-style staggered grid; CSS multicolumn vs JS trade-offs

### Changed
- `examples/README.md` — added new specs to Component specs table.
- `package.json` + `.claude-plugin/plugin.json` versions: 3.4.0 → 3.5.0.

### Verified
- All 5 audits pass (frontmatter / link / Korean / coverage / integration-check).
- Scaffolder dry-run + smoke-test produces valid output.
- No regressions in existing specs.

### Coverage
- Examples: 113 → 124 (+11)
- Component coverage: 61 → **72** (30.7% → **36.2%**)

### What this enables
- **Future coverage pushes are 5-10× faster** — scaffold 30 drafts in seconds, then maintainers refine the narrative sections (anatomy, edge cases, code examples, "Don'ts").
- **Closer parity with shadcn-ui** — most flagship primitives now have specs (alert-dialog, command, sheet, dropdown, navigation-menu, menubar, sidebar, combobox, field, item, hover-card, context-menu).
- **Form construction primitives ready** — Field family is the canonical form-wrapper across the corpus, used internally by `Form` skill output.
- **Korean stock convention canonicalized** — chart spec captures the red=up / blue=down inversion as a token-driven default.

### What's still ahead (v3.6+)
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Coverage push 36% → 50% (next 30+ specs — extractor accelerates this).
- VS Code extension wrapper.
- Semantic search index for the doc site (Algolia / Typesense).
- Doc site i18n (Korean translations of QUICKSTART, README, AGENTS).
- Component spec extractor v2 — TypeScript AST parsing for fuller prop extraction.

## Phase 23 — Multi-agent integration + Homebrew (v3.4) ✓ shipped

Concrete proof that design-ai's "model-agnostic" tagline is real. Until now, the corpus had been heavily exercised through Claude Code; this phase adds worked walkthroughs for Codex CLI / Cursor / Aider / SDK and a Homebrew formula for broader install reach.

### Added
- **4 integration walkthroughs** in `docs/integrations/`:
  - `codex-walkthrough.md` — 4 sessions (component spec, design system, iterate critique, Figma audit) + Codex-specific tips (paths, MCP config, AGENTS.md fragments).
  - `cursor-walkthrough.md` — 5 sessions (inline spec, audit existing, Figma critique, token gen, `Cmd+K` inline) + Composer mode + MCP config.
  - `aider-walkthrough.md` — 4 sessions (impl, refactor, design-system bootstrap, audit-then-fix) + Aider patterns (architect mode, auto-test, bash aliases).
  - `sdk-walkthrough.md` — Anthropic + OpenAI SDK adoption with prompt caching, tool use, streaming. Production chatbot example.
- **`Formula/design-ai.rb`** — Homebrew formula:
  - Installs corpus to `libexec`.
  - Wraps `install.sh` as `design-ai-install` binary.
  - Symlinks the npm CLI as `design-ai` if Node is present.
  - Includes a `test do` block validating plugin manifest + skill counts.
- **`Formula/README.md`** — maintainer release runbook (tag, release, get sha256, update formula, test, push).
- **`tools/audit/integration-check.py`** — verifies each walkthrough has required sections (Prerequisites / Setup / ≥3 Walkthroughs / Next). Catches structural drift over time.
- **`.github/workflows/audit.yml`** — wired the new audit into CI. 5 audits now run on every PR.

### Changed
- **`docs/CODEX-INTEGRATION.md`** + **`CURSOR-INTEGRATION.md`** + **`AIDER-INTEGRATION.md`** — top-of-file callouts linking to the corresponding walkthrough.
- **`README.md`** — Option B: Homebrew install path added; agent table links to per-agent walkthroughs.
- **`mkdocs.yml`** — Integrations nav restructured per agent (Setup + Walkthrough sub-entries); SDK + Distribution promoted to top-level entries.

### Verified
- All 5 audits pass (frontmatter / link / Korean / coverage / integration-check).
- Integration audit confirms all 4 walkthroughs have the required structure.
- CLI smoke tests still pass.
- mkdocs build with new nav succeeds.

### Versions
- CLI: 3.3.0 → 3.4.0
- Plugin / corpus: 3.3.0 → 3.4.0

### What this enables
- **Model-agnostic adoption** — adopters can choose Codex / Cursor / Aider / SDK without reverse-engineering setup. Each walkthrough is self-contained.
- **Homebrew install** — `brew install design-ai` lowers friction for Mac users (especially designers who aren't comfortable with npm or git clones).
- **Production SDK adoption** — concrete patterns (prompt caching, streaming, tool use, chatbot example) lower the barrier for embedding design-ai into products.
- **CI safeguards** — integration walkthroughs can't silently rot; audit catches missing sections.

### What's still ahead (v3.5+)
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Coverage push 30% → 40%+ (next batch of canonical specs).
- VS Code extension wrapper.
- Component spec extractor (scaffold from upstream diff).
- Semantic search index for the doc site (algolia / typesense).
- Internationalization of the doc site (English primary; Korean translation of key pages).

## Phase 22 — Component coverage push (v3.3) ✓ shipped

Component spec coverage from 23.6% → **30.7%** (47 → 61 of 199 canonical components).

### Added (15 specs total)

13 net new + 2 renames (to align filenames with canonical names from `knowledge/components/index.json`).

**Overlay primitives** (5):
- `component-badge.md` — Standalone label + Indicator dual modes (Ant + MUI + shadcn synthesis).
- `component-dropdown.md` — Dropdown / DropdownMenu; WAI-ARIA Menu pattern, sub-menus, checkbox / radio items, shortcuts. (Renamed from `component-dropdown-menu.md`.)
- `component-context-menu.md` — Right-click / long-press triggered; same Menu pattern as Dropdown.
- `component-hover-card.md` — Hover-triggered floating preview; profile previews, link previews.
- `component-sheet.md` — Side-anchored modal panel; mobile-first detents (peek vs full).
- `component-command.md` — Command / CommandPalette (cmdk-based); Cmd+K pattern, fuzzy match, async results, multi-page navigation. (Renamed from `component-command-palette.md`.)

**Navigation / layout** (3):
- `component-sidebar.md` — Persistent collapsible navigation (the shadcn flagship); icon-only mode, mobile offcanvas.
- `component-navigation-menu.md` — Top horizontal nav with mega-menu panels; marketing site / SaaS header.
- `component-menubar.md` — Desktop File / Edit / View pattern; hover-roving between menus, keyboard nav.

**Utilities** (7):
- `component-aspect-ratio.md` — Lock child to specific aspect ratio.
- `component-collapsible.md` — Single expandable section primitive.
- `component-toggle.md` — Toggle + ToggleGroup pressable buttons (single + multiple).
- `component-scroll-area.md` — Custom-styled scrollbar; visibility modes.
- `component-banner.md` — Persistent in-page strip (system status, trial, cookie consent); distinct from Alert + Toast.
- `component-kbd.md` — Keyboard shortcut display; platform-aware Mac/Win symbols.
- `component-separator.md` — Horizontal / vertical divider; decorative vs semantic.

### Renamed
- `component-dropdown-menu.md` → `component-dropdown.md` (matches canonical `dropdown` from Ant)
- `component-command-palette.md` → `component-command.md` (matches canonical `command` from shadcn)

### Cross-references updated
All in-corpus links updated via `sed`. `link-check.py` confirms no broken references.

### Coverage
- Examples: 99 → 113 (+14)
- Component coverage: 47 → **61** (23.6% → **30.7%**)
- Versions bumped: CLI 3.1.0 → 3.3.0, Plugin 3.1.0 → 3.3.0

### Verified
- All 4 audits pass (frontmatter / link / Korean / coverage).
- mkdocs build still succeeds.
- npm pack tarball clean.

### What this enables
- **Stronger component-spec-writer output** — more canonical patterns matched, better synthesis quality.
- **Closer parity with shadcn-ui** — most flagship primitives (sidebar, command, sheet, dropdown-menu) now have specs.
- **30%+ canonical coverage milestone** — the corpus now covers 30% of the canonical Ant + MUI + shadcn surface.

### What's still ahead (v3.4+)
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Cross-tool integration tests (Codex CLI / Cursor / Aider sessions captured as worked examples).
- Coverage push from 30% → 40%+ (more canonical specs).
- Homebrew formula.
- VS Code extension wrapper.
- Component spec extractor (scaffold a spec from upstream source diff).

## Phase 21 — Public doc site (v3.2) ✓ shipped

mkdocs-material site auto-deploying to GitHub Pages. Discoverability + search for prospective adopters before they install.

### Added
- **`mkdocs.yml`** — site config:
  - Material theme, indigo / violet brand palette (light + dark schemes via `prefers-color-scheme`).
  - Pretendard variable font for Korean, Inter for Latin, JetBrains Mono for code.
  - Full nav tree covering Knowledge / Skills / Commands / Agents / Examples / Integrations / Reference.
  - 17 markdown extensions enabled (admonition, tabs, tasklist, mermaid, etc).
- **`tools/build-docs.sh`** — populates `site-src/` with a symlink farm (mkdocs requires docs_dir to be a sibling/descendant of config, not parent). Idempotent. Index symlink: `site-src/index.md → ../README.md`.
- **`docs/site-overrides/`** — theme customizations:
  - `extra.css` — Pretendard variable font from jsDelivr CDN, brand color tweaks, Korean reading optimizations (`word-break: keep-all`, `font-feature-settings: "kern"`).
  - `main.html` — announcement bar pushing the npx install command + OpenGraph / Twitter Card metadata.
  - `logo.svg`, `favicon.svg` — gradient indigo/violet "D" mark.
- **`docs/requirements.txt`** — pinned mkdocs-material `>=9.7.0` (older 9.5.x had a pygments/pymdown-extensions interaction bug that caused build to crash on `highlight.pygments_lang_class: true`).
- **`.github/workflows/docs.yml`** — auto-deploy to GitHub Pages:
  - Triggers on push to main (paths-filtered to docs-relevant changes only) + manual dispatch.
  - Uses `actions/configure-pages@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`.
  - Concurrency-grouped under `pages` with `cancel-in-progress: false`.
  - Runs `./tools/build-docs.sh` then `mkdocs build --clean` (deliberately not `--strict` — informational cross-reference warnings aren't blocking; actual broken links are caught by the existing `link-check.py` audit on every PR).

### Changed
- **`README.md`** — added doc-site badge linking to the live site.
- **`tools/audit/link-check.py`** + **`korean-copy-check.py`** — now skip `site-src/`, `site/`, `node_modules/` walk paths so audits don't double-count symlinked content.
- **`.gitignore`** — excludes `site/`, `site-src/` build artifacts.

### Local preview
```bash
pip install -r docs/requirements.txt
./tools/build-docs.sh
mkdocs serve
# → http://127.0.0.1:8000
```

### Verified
- All 4 audits still pass (frontmatter / link / Korean copy / coverage).
- `mkdocs build --clean` succeeds in 8 seconds.
- 333 HTML files generated, 35MB total (includes search index + asset duplication).
- Theme overrides loaded (Pretendard, indigo brand colors, custom logo).

### What this enables
- **Discoverability** — prospective adopters can browse the corpus on the public site before deciding to install.
- **Search** — built-in mkdocs-material search across all 91 knowledge files + 99 examples + skill playbooks. Korean + English search both supported.
- **Korean readability** — Pretendard font + word-break rules render Hangul correctly across all pages.
- **Lower-friction evaluation** — open-source evaluators can read full skill / pattern docs without cloning.
- **SEO** — structured site improves Google indexing for design-ai content.

### What's still ahead (v3.3+)
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Cross-tool integration tests (Codex CLI / Cursor / Aider sessions captured as worked examples).
- Component coverage push 23.6% → 30%+.
- Homebrew formula.
- VS Code extension wrapper.
- Search analytics (which knowledge files are most-read).
- Versioned doc site (mkdocs `mike` plugin) for snapshotting v3.x docs.

## Phase 20 — Distribution (v3.1) ✓ shipped — productization phase

NPM CLI distribution. Adopters now go from zero to installed in one command (`npx @design-ai/cli install`) without cloning the repo.

### Added
- **`package.json`** — npm package `@design-ai/cli`, bin `design-ai`, ESM, Node ≥18.
- **`cli/`** — Node.js CLI:
  - `cli/bin/design-ai.mjs` — entry point.
  - `cli/lib/dispatch.mjs` — command router with aliases (`i` / `u` / `s` / `ls` / `v`).
  - `cli/lib/paths.mjs` — path resolution (npm package vs git clone, env overrides).
  - `cli/lib/log.mjs` — colorized terminal output (NO_COLOR-aware).
  - `cli/lib/exec.mjs` — shell exec helpers.
  - 7 commands: `install`, `update`, `uninstall`, `status`, `list`, `version`, `help`.
  - `install` / `uninstall` delegate to the existing `install.sh` (single source of truth).
  - `list` reads from `.claude-plugin/plugin.json` to show full catalog.
- **`.npmignore`** — safety net for what stays out of the npm tarball; primary control via `package.json` `files` allowlist.
- **`.github/workflows/publish.yml`** — auto-publish on `v*` tag. Verifies tag matches `package.json`, plugin.json matches package.json, runs all 4 audits, runs `npm pack --dry-run`, publishes with `--provenance`.
- **`docs/DISTRIBUTION.md`** — three install paths (npm / git clone / manual symlinks), CLI command reference, env override reference, versioning rules, publishing checklist, troubleshooting.

### Changed
- **`.claude-plugin/plugin.json`** version: 3.0.0 → 3.1.0 (aligned with CLI).
- **`README.md`** — lead with `npx @design-ai/cli install` as primary install path; git clone retained as Option B for contributors.
- **`docs/ROADMAP.md`** updated with this section.

### Coverage (no corpus change in this phase)
- Knowledge: 91 (no change)
- Examples: 99 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change) — different from CLI commands; refers to slash commands
- New: NPM CLI with 7 commands, publish workflow, DISTRIBUTION docs

### What this enables
- **One-command install** — `npx @design-ai/cli install` works on any Node ≥ 18 machine.
- **Update path** — `design-ai update` pulls + reinstalls without manual git work.
- **Catalog browsing** — `design-ai list skills` shows what's available before deciding to install.
- **Cross-machine consistency** — npm-published version is the canonical reference; git clone tracks `main` for contributors.
- **Provenance attestation** — npm `--provenance` flag verifies builds came from this GitHub repo.

### What's still ahead (v3.x and beyond)
- Public doc site (mkdocs-material on GitHub Pages) for browsing knowledge without install.
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Cross-tool integration tests (Codex CLI / Cursor / Aider sessions captured as worked examples).
- Component coverage push 23.6% → 30%+.
- Homebrew formula.
- VS Code extension wrapper.

## Phase 19 — Stabilization (v3.0) ✓ shipped — productization phase

The v2 expansion proved the corpus works across 7 new design domains. Phase 19 is the stabilization step the user requested: "안정화 후 시장성, 대중성이 있으면 프로그램화 진행" — stabilize first, productize next.

### Added
- **`.claude-plugin/plugin.json`** — Claude Code plugin manifest. All 19 skills, 15 commands, 4 agents declared with names + paths + descriptions; supports plugin discovery and future `/plugin install` flow.
- **`install.sh`** — automated installer:
  - Symlinks `skills/`, `agents/`, `commands/` into `~/.claude/` with `design-` prefix.
  - Idempotent (safe to re-run).
  - Subcommands: `install` (default), `--uninstall`, `--status`, `--help`.
  - Configurable: `DESIGN_AI_PREFIX`, `CLAUDE_HOME` env overrides.
- **`CHANGELOG.md`** — full release history, v1.0 through v3.0, semver-compliant.
- **`README.md` overhaul** — coverage-at-a-glance table reflecting v2 expansion (motion / illustration / print / video / game UI / conversational / spatial); install instructions; first-task tour; Korean market focus section.
- **`docs/QUICKSTART.md`** — 5-minute getting-started for new adopters.
- **CI: Korean copy check** added to `audit.yml` (was missing despite the script existing).
- **CI: size budget** updated from 50K-line warning (long since exceeded) to 100K warn / 150K hard-cap.

### Changed
- Knowledge size now ~57K lines; budget recalibrated.
- `docs/ROADMAP.md` updated with v3.0 entry (this section).

### Coverage
- Knowledge: 91 (no change in this phase)
- Examples: 99 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)
- New: plugin manifest, install script, CHANGELOG, QUICKSTART
- CI checks: 4 → 5 (added korean-copy-check)

### What this enables
- **Adopters can install design-ai globally** with `./install.sh` instead of the manual symlink loop documented in `PLUGIN-PACKAGING.md`.
- **CHANGELOG.md** is the canonical reference for "what changed when" — adopters can pin to a version.
- **README** stops being a launch-day artifact and becomes a maintained adoption surface.
- **CI parity** — all 4 audits (frontmatter / link / Korean copy / coverage) run on every PR; no skipped checks.

### What's still ahead (v3.x and beyond)
- Versioned knowledge files (`version:` in frontmatter; `version` field optional today).
- Public doc site (mkdocs / docusaurus). Knowledge already markdown-friendly.
- NPM package distribution (`npx design-ai install`).
- Cross-tool integration tests (real sessions in Codex CLI / Cursor / Aider captured as worked examples).
- Component coverage push to 30%+ (currently 23.6%).

## Phase 18 — AR / VR / spatial design (v2.7) ✓ shipped — completes v2 expansion

Final phase of the v2 expansion. Adds spatial computing as a first-class design surface alongside motion / illustration / print / video / game UI / conversational. Covers fundamentals (Milgram continuum, FOV, comfort zones, units, vergence-accommodation), VR patterns (Quest / PSVR2 / Vision Pro immersive / locomotion), AR patterns (ARKit / ARCore / HoloLens / world + image + object anchors), spatial UI elements (panels, billboards, controls, menus), and comfort + accessibility (motion sickness mitigations, vision / hearing / motor / cognitive / photosensitive / mobility).

- [x] **5 spatial knowledge files**:
  - `spatial/spatial-design-fundamentals.md` — Milgram continuum, spatial units, visual angle, FOV, comfort zones (vertical + horizontal), stereoscopic depth, vergence-accommodation conflict, locomotion overview, comfort vignette, spatial audio, hand vs controller vs gaze, anchoring, resolution + PPD, performance budget, platforms, Korean market context.
  - `spatial/vr-patterns.md` — VR experience categories, three core principles (presence / comfort / use-the-body), HUD anti-patterns + diegetic alternatives, locomotion in detail (teleport / smooth / snap turn / room-scale / hybrid), spatial UI placement, hands + avatars, multiplayer / social, reading text in VR, cinema in VR, performance.
  - `spatial/ar-patterns.md` — three AR contexts (mobile handheld / glasses / world-anchored), visibility against real backgrounds, spatial mapping, anchoring strategies (world / image / body / screen), onboarding, common interactions, permission + privacy, tracking failure handling, Korean AR market.
  - `spatial/spatial-ui-elements.md` — panels (the core), billboarding, buttons (push / tap), sliders, menus (wrist / floating / radial / pie), input affordances (pointer / hand cursor / gaze / voice), notifications, lists, forms, Korean text in spatial, dialogs, loading / progress, icons.
  - `spatial/comfort-and-accessibility.md` — motion sickness triggers + mitigations, comfort settings menu, vision / hearing / motor / cognitive / photosensitive accessibility, eye strain, physical safety, wheelchair / mobility, Korean accessibility, hygiene for shared headsets, session length guidance.
- [x] **2 component specs**:
  - `component-spatial-panel.md` — floating 2D-in-3D panel; anchoring (world / wrist / hand / head), visual angle vs absolute sizing, billboarding, hand + gaze + ray-cast + direct-touch input handling, comfort positioning, occlusion.
  - `component-spatial-locomotion.md` — VR locomotion controller; teleport (with arc + landing indicator + fade), smooth (with vignette), snap-turn (with fade), room-scale, hybrid; comfort settings menu; one-handed + voice alt; comfort defaults for new users.
- [x] **`skills/spatial-designer/`** — pick mode (VR / AR / MR / WebXR) + platform; spec geometry, anchoring, locomotion, input, UI elements, comfort, accessibility, onboarding.
- [x] **`/spatial`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 86 → 91 (+5 spatial).
- Examples: 97 → 99 (+2 spatial components).
- Skills: 18 → 19 (+ spatial-designer).
- Commands: 14 → 15 (+ /spatial).

### v2 expansion summary (Phases 12 → 18)

Phases 12-18 added 7 new design domains:

| Phase | Domain | Knowledge | Examples | Skill | Command |
|---|---|---|---|---|---|
| 12 | Motion design depth | 5 | 4 | motion-designer | /motion-design |
| 13 | Illustration systems | 5 | 2 | illustration-designer | /illustration |
| 14 | Print / physical design | 6 | 2 | print-designer | /print |
| 15 | Video content | 5 | 2 | video-designer | /video |
| 16 | Game UI | 5 | 2 | game-ui-designer | /game-ui |
| 17 | Voice / conversational | 5 | 2 | conversational-ui-designer | /conversational |
| 18 | Spatial / AR / VR | 5 | 2 | spatial-designer | /spatial |
| | **Total v2.1-v2.7** | **+36** | **+16** | **+7** | **+7** |

Full repo: knowledge 55→91, examples 83→99, skills 12→19, commands 8→15. Korean market focus across all phases. All audits pass throughout. Ready for v3 stabilization / productization phase.

## Phase 17 — Voice / conversational UI (v2.6) ✓ shipped

Conversational UI as a first-class design surface. Covers fundamentals (turn-taking, intents, modalities, latency, hallucinations), voice UI patterns, traditional chatbot design, AI chat (LLM-based) interfaces, and Korean conventions (Bixby, Clova, NUGU, KakaoTalk channel, 해요체 / 합쇼체).

- [x] **5 conversational knowledge files**:
  - `conversational/conversational-ui-fundamentals.md` — modalities, turn-taking, intents + slots, conversational design principles, streaming, latency budgets, personality, STT/TTS, code-switching.
  - `conversational/voice-ui-patterns.md` — wake word / tap-to-talk / multi-turn / voice search; smart speaker UX, phone assistant UX, in-car, IVR; Korean assistants; SSML; accessibility.
  - `conversational/chatbot-design.md` — rule-based / intent-based / hybrid; anatomy, conversation patterns (greeting, quick replies, forms, lists, cards, confirmation); KakaoTalk channel; human handoff.
  - `conversational/ai-chat-interfaces.md` — LLM chat: streaming, markdown / code rendering, stop / regenerate / continue, context length, hallucination handling, voice mode, memory, keyboard shortcuts.
  - `conversational/korean-voice-conventions.md` — KR voice assistants (Bixby / Clova / NUGU / GiGA Genie / Kakao i), 합쇼체 / 해요체 selection, code-switching, TTS / STT options, KR regulatory (개인정보보호법, 정보통신망법, 자본시장법), KakaoTalk channel.
- [x] **2 component specs**:
  - `component-chat-interface.md` — generic chat UI for chatbot / AI / live agent; markdown / code rendering, streaming, suggested chips, attachments, Korean IME handling.
  - `component-voice-input.md` — push-to-talk + transcript voice input; Web Speech / Clova / Whisper backends, listening visualization, permission handling, accessibility alt.
- [x] **`skills/conversational-ui-designer/`** — pick type, modality, persona, intents, flows, error recovery, KR compliance, accessibility.
- [x] **`/conversational`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 81 → 86 (+5 conversational).
- Examples: 95 → 97 (+2 conversational components).
- Skills: 17 → 18 (+ conversational-ui-designer).
- Commands: 13 → 14 (+ /conversational).

## Phase 16 — Game UI (v2.5) ✓ shipped

Game UI as a first-class design surface. Covers fundamentals (diegetic / spatial taxonomy, genre conventions, platform variations), HUD design, menu systems, Korean gaming conventions (PC bang, 확률 표시, mobile gacha, MMO), and game accessibility.

- [x] **5 game UI knowledge files**:
  - `game-ui/game-ui-fundamentals.md` — Russell taxonomy (diegetic / non-diegetic / spatial / non-spatial), genre conventions (FPS / RPG / MMO / gacha / casual / strategy), platform variations (PC / console / mobile / VR), input methods, button prompts.
  - `game-ui/hud-design.md` — health bars, ammo / resources, crosshair, mini-map, damage numbers, cooldowns, buffs / debuffs, quest markers, notifications, subtitles, customization.
  - `game-ui/menu-systems.md` — main menu, pause, inventory (grid / list / Tetris / stacked), settings, store, gacha (확률 표시), quest log, character / stats, navigation patterns, transitions.
  - `game-ui/korean-gaming-conventions.md` — KR market context (NEXON / NCSoft / Krafton / Smilegate), 게임산업진흥에관한법률, 확률 표시 mandatory, 본인인증 / PASS / NICE, GRAC ratings, PC bang culture, auto-battle, daily login, VIP / 출석, gacha pity / 천장.
  - `game-ui/game-accessibility.md` — four axes (vision / hearing / motor / cognitive), universal options menu standard, subtitles + closed captions, color-blind modes (protanopia / deuteranopia / tritanopia), motor (remap / toggle hold / auto-aim), cognitive (HUD options / hints / save anywhere), motion sickness reduction.
- [x] **2 component specs**:
  - `component-game-hud.md` — composable HUD shell with anchored slots, customization, color-blind / contrast modes, UI scale, cross-platform input.
  - `component-game-menu.md` — composable menu shell with focus management, controller / d-pad nav, platform-specific button-prompt swapping, modal stacking.
- [x] **`skills/game-ui-designer/`** — pick genre, platform, layout, input handling, accessibility, KR compliance.
- [x] **`/game-ui`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 76 → 81 (+5 game-ui).
- Examples: 93 → 95 (+2 game-ui components).
- Skills: 16 → 17 (+ game-ui-designer).
- Commands: 12 → 13 (+ /game-ui).

## Phase 15 — Video content (v2.4) ✓ shipped

Add video as a first-class design surface alongside motion / illustration / print. Covers fundamentals (codecs, resolution, captions, accessibility), marketing video, social/short-form (Reels / Shorts / TikTok), in-product video (onboarding / help), and Korean conventions (자막, 표시광고법, KFDA, 방송통신심의위원회). Two component specs for HTML5 video.

- [x] **5 video knowledge files**:
  - `video/video-fundamentals.md` — codecs (H.264/H.265/AV1), resolution, framerate, bitrate, audio loudness (-14 LUFS), captions (WebVTT), color space, file size estimation, accessibility.
  - `video/marketing-video.md` — hero loop / brand film / product demo; production budget tiers; Korean conventions (Toss / Kakao / Naver style).
  - `video/social-and-short-form.md` — Reels / Shorts / TikTok / vertical; hook in 1 second; safe areas; subtitle styling; algorithm signals.
  - `video/in-product-video.md` — onboarding / help / changelog; screen recording vs filmed; player UX; localization; reduced-motion fallback.
  - `video/korean-video-conventions.md` — KR platforms (YouTube / Naver TV / KakaoTV / SOOP), 자막 style conventions, voiceover (해요체 / 합쇼체), 표시광고법 ad disclosure, KFDA / KFTC compliance.
- [x] **2 component specs**:
  - `component-video-player.md` — accessible HTML5 player with multi-lang captions, speed control, transcript link, reduced-motion.
  - `component-video-hero.md` — autoplay loop with poster fallback, art-direction (mobile vs desktop video), slow-connection / reduced-motion skip, WCAG-compliant pause control.
- [x] **`skills/video-designer/`** — pick surface category, technical spec, length, captions, voiceover, music, KR compliance, file delivery.
- [x] **`/video`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 71 → 76 (+5 video).
- Examples: 91 → 93 (+2 video components).
- Skills: 15 → 16 (+ video-designer).
- Commands: 11 → 12 (+ /video).

## Phase 14 — Print / physical design (v2.3) ✓ shipped

Expand beyond screen design into print + physical: business cards, stationery, brochures, posters, packaging. Korean print conventions (KFDA / KATS regulatory, 명함 size, 분리배출 표시, Pretendard typography for print) baked in. Includes 2 worked print specs.

- [x] **6 print knowledge files**:
  - `print/print-fundamentals.md` — CMYK vs RGB vs spot, DPI, bleed/trim/safe area, paper weight + finish, file formats, ICC.
  - `print/stationery.md` — business cards (KR 90×50 vs international 85×55), bilingual KR+EN, letterhead, envelopes.
  - `print/brochures-and-flyers.md` — flyer / bi-fold / tri-fold / Z-fold / booklet / saddle-stitched; reading order, gutter, imposition.
  - `print/signage-and-posters.md` — large-format; reading distance × size formula, materials, OOH compliance.
  - `print/packaging.md` — folding cartons, labels, mailers; dielines; sustainability.
  - `print/korean-print-conventions.md` — KR sizes, KFDA / KATS regulatory, 분리배출 표시, print districts, MOQ, lead times, costs.
- [x] **2 worked print specs**:
  - `print-business-card-spec.md` — Korean fintech 명함 (premium tier): 90×50, 350gsm uncoated, soft-touch + spot UV, Pretendard, Pantone + CMYK.
  - `print-packaging-spec.md` — Korean cosmetics folding carton: dieline, KFDA regulatory content, FSC + soy ink, press proof.
- [x] **`skills/print-designer/`** — pick piece type, spec dimensions / paper / color / finish / regulatory / file delivery.
- [x] **`/print`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 65 → 71 (+6 print).
- Examples: 89 → 91 (+2 print specs).
- Skills: 14 → 15 (+ print-designer).
- Commands: 10 → 11 (+ /print).

## Phase 13 — Illustration systems (v2.2) ✓ shipped

Lift illustration from an unwritten gap into a full subsystem: knowledge per type, component specs, dedicated skill, slash command. Covers spot illustrations, hero illustrations, mascots (Korean fintech relevance), and SVG production. Korean-market conventions baked in.

- [x] **5 illustration knowledge files**:
  - `illustration/illustration-systems.md` — style, voice, system design (geometric vs organic, line weight, color treatment, perspective).
  - `illustration/spot-illustrations.md` — empty / success / error / onboarding / permissions; composition + sizing + voice.
  - `illustration/hero-illustrations.md` — marketing-led; conceptual / product-in-context / character-driven archetypes.
  - `illustration/mascot-design.md` — Kakao / Toss / Naver mascot conventions, design process, governance.
  - `illustration/svg-optimization.md` — SVGO, currentColor, accessibility, file size targets.
- [x] **2 component specs**:
  - `component-empty-state.md` — illustration + headline + description + CTA stack with registry + voice rules.
  - `component-illustration.md` — themeable SVG / Lottie display backed by typesafe illustration registry.
- [x] **`skills/illustration-designer/`** — pick scope, style, voice, color, format; spec assets; SVGO checklist.
- [x] **`/illustration`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 60 → 65 (+5 illustration).
- Examples: 87 → 89 (+2 illustration components).
- Skills: 13 → 14 (+ illustration-designer).
- Commands: 9 → 10 (+ /illustration).

## Phase 12 — Motion design depth (v2.1) ✓ shipped

Lift motion from a single principles file into a full subsystem: knowledge per category, component specs, a dedicated skill, and a slash command. Covers marketing, app loading, micro-interactions, and multi-element choreography. Reduced-motion-safe by default.

- [x] **5 motion knowledge files**:
  - `motion/marketing-motion.md` — hero entrance, scroll-triggered, parallax, choreographed sequences, hover/cursor, loop animations; KR conventions.
  - `motion/app-loading-sequences.md` — cold launch / warm launch / route changes, splash strategy, View Transitions API, FLIP, progressive content loading.
  - `motion/micro-interactions.md` — 5 categories (press, state change, hover, focus, loading), 4 laws (be fast / functional / match input / no stagger redundancy).
  - `motion/choreography-depth.md` — 5 patterns (cascade, FLIP, View Transitions, choreographed sequences, reactive choreography), stagger formulas, exit choreography, timing diagrams.
  - `motion/motion-tools.md` — CSS / Framer Motion / GSAP / Lottie / Rive / react-spring decision tree + comparison matrix.
- [x] **4 motion component specs**:
  - `component-loading-sequence.md` — splash + biometric gate + first-screen reveal coordination.
  - `component-page-transition.md` — route-level wrapper (fade / slide / hero variants) using Framer Motion or View Transitions API.
  - `component-lottie-player.md` — designer-led After Effects animation embed with lazy-load, offscreen pause, poster fallback.
  - `component-scroll-reveal.md` — viewport-triggered animation primitive (fade-up / fade-in-blur / scale-in) with stagger.
- [x] **`skills/motion-designer/`** — pick category, duration tier, easing, tool; choreograph; verify reduced motion + performance budget.
- [x] **`/motion-design`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 55 → 60 (+5 motion).
- Examples: 83 → 87 (+4 motion components).
- Skills: 12 → 13 (+ motion-designer).
- Commands: 8 → 9 (+ /motion-design).

## Phase 11 — Completion (v2.0) ✓ shipped

Final completion of v2.0 scope. Adds the worked examples that prove the documentation skills work end-to-end, plus a focused component coverage push, plus 3 universal pattern knowledge files.

- [x] **6 doc/deck/report/email worked examples**:
  - `doc-tutorial-example.md` (Diátaxis tutorial)
  - `doc-how-to-example.md` (how-to with Korean localization)
  - `doc-explanation-example.md` (W3C DTCG choice rationale)
  - `slide-deck-example.md` (17-slide Korean conference talk)
  - `report-example.md` (UX audit with severity-aggregated findings)
  - `email-transactional-example.md` (Korean fintech receipt email)
- [x] **7 component specs**:
  - `component-descriptions.md` (key-value list, dl semantics)
  - `component-hero-block.md` (landing hero with 4 layouts + video variants)
  - `component-feature-grid.md` (3-up/4-up feature display)
  - `component-testimonial-carousel.md` (single-large/3-up/auto-scroll variants)
  - `component-pricing-cards.md` (2-4 tier pricing with anchoring + KR subscription disclosure)
  - `component-pass-auth.md` (Korean 본인인증 wrapper — PASS/NICE/KCB)
  - `component-otp-countdown.md` (SMS code expiration + resend cooldown)
- [x] **3 universal pattern knowledge files**:
  - `auth-flow-design.md` — signup / login / reset / 2FA / KakaoTalk / 본인인증
  - `pricing-page-design.md` — tier strategy, anchoring, billing toggle, FAQ, KR legal
  - `landing-hero-design.md` — 6 archetypes, headline formulas, video rules, A/B testing
- [x] AGENTS.md / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 52 → 55 (+3 patterns).
- Examples: 70 → 83 (+13: 6 doc examples + 7 component specs).
- Component spec coverage: ~24% → ~27% (more canonical-matched + 4 new custom).
- Total lines: ~52K → ~62K.

## Phase 10 — Document design + brand + email (v1.9) ✓ shipped

Expansion beyond product UI into the full design domain.

- [x] **5 document design knowledge files**:
  - `document-typography.md` — long-form reading (body 18px+, vertical rhythm, paragraph styling).
  - `information-architecture.md` — Diátaxis 4 types, sidebar structure, naming, versioning, search.
  - `technical-writing.md` — active/imperative/second-person voice, sentence length, code samples, voice-per-doc-type.
  - `slide-deck-design.md` — talk vs pitch vs reading archetypes, message-led titles, layouts.
  - `report-design.md` — TL;DR pyramid, audit format, severity rating, research findings template.
- [x] **3 brand/medium knowledge files**:
  - `brand-identity.md` — logo / color / type / voice / imagery foundations.
  - `email-design.md` — HTML email constraints, transactional vs marketing, bulletproof button, Korean spam law.
  - `i18n/korean-app-store-visual.md` — icon design, screenshot composition, Korean storefront expectations.
- [x] **`i18n/korean-document-style.md`** — honorific level (합쇼체 vs 해요체), hierarchy (가/나/다 + numeric), spacing rules, common Korean technical-writing errors.
- [x] **4 doc component specs**:
  - `component-callout.md` — info/warning/note for docs (distinct from Alert).
  - `component-blockquote.md` — attributed quotations.
  - `component-doc-page.md` — full doc site layout (header / sidebar / TOC / footer).
  - `component-email-layout.md` — table-based responsive email scaffolding.
- [x] **2 new skills**: `document-author` (Diátaxis-aware doc writing), `slide-deck-author` (deck outlining).
- [x] **2 new commands**: `/document-from-brief`, `/slide-deck`.
- [x] **PRINCIPLES.md** extended with rules 36–41 (documentation & long-form).
- [x] AGENTS.md / examples/README / skills/README / commands/README / ROADMAP updated.

Coverage:
- Knowledge: 43 → 52 (28 hand-written + 15 generated → 37 hand-written + 15 generated).
- Skills: 10 → 12 (all with verification phase).
- Commands: 6 → 8.
- Examples: 66 → 70.
- Total lines: ~42K → ~52K.

## Phase 9 — MCP integrations (v1.8) ✓ shipped

- [x] **MCP-INTEGRATION.md** overview — supported MCPs (Tier 1: Figma/Notion/GitHub/Slack; Tier 2: Linear/Atlassian/Asana/Intercom), setup per agent, graceful fallback strategy, MCP catalog with design-ai relevance.
- [x] **5 per-MCP integration guides** in `docs/integrations/`:
  - `figma-mcp.md` — read variables/components, audit Figma designs, spec components from Figma, write tokens (limited), Code Connect via MCP.
  - `notion-mcp.md` — mirror knowledge to Notion, capture design decisions, read brand briefs, weekly status.
  - `github-mcp.md` — PR design review, issue creation for design debt, status reports, token-bump notifications.
  - `slack-mcp.md` — design review summaries, token version notifications, palette artifacts, scheduled status posts.
  - `linear-mcp.md` — convert audit findings to issues, track design system rollout, severity → priority mapping.
- [x] **3 MCP-aware skills**:
  - `skills/design-pr-review/` — reviews GitHub PRs for design compliance (uses GitHub MCP, falls back to markdown output).
  - `skills/figma-token-sync/` — bidirectional token sync Figma↔code (uses Figma MCP, falls back to Tokens Studio).
  - `skills/design-broadcast/` — post artifacts to Slack/Notion (uses Slack + Notion MCPs, falls back to formatted paste).
- [x] AGENTS.md adds "Use MCPs when available" section + skill lookup entries. Skills: 7 → 10.

## Phase 8 — Last big push (v1.7) ✓ shipped

- [x] **10 component specs**: FloatButton, QRCode, Splitter, Anchor, AppBar, Layout, InputOTP, Watermark, Code, Typography. Coverage 18.6% → ~22%.
- [x] **3 Korean fintech custom specs**: StockChart (KR-inverted convention), KRWAmount (display-only), PaymentReceipt (Korean dotted-divider receipt).
- [x] **Figma plugin scaffold** (`tools/figma-plugin/`): manifest.json, code.ts (sandbox), ui.html (paste-to-import), Code Connect examples for Button/Input/Card.
- [x] **CI workflows** (`.github/workflows/`): audit.yml (frontmatter + link + coverage validation on PR + size budget), release.yml (CHANGELOG + tarball on tag push).
- [x] **Korean copy validator** (`tools/audit/korean-copy-check.py`): heuristic scan of Korean-relevant files for English UI strings, suggests Korean equivalents.
- [x] AGENTS.md / examples/README / ROADMAP updated. Examples: 53 → 66.

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
