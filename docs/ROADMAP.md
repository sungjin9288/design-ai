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

## Phase 178 — Scoped learning prompt injection (v4.13.0) ✓ shipped

`design-ai prompt` and `design-ai pack` now let users scope opt-in local learning context by category and entry count before injecting it into generated agent context.

### Changed
- Added `--learning-category` and `--learning-limit` to `design-ai prompt --with-learning`.
- Added the same scoped learning controls to `design-ai pack --with-learning`, passing filters into the embedded prompt plan.
- Kept scoped learning flags behind the existing `--with-learning` privacy boundary.
- Updated CLI help discovery, smoke assertions, README command references, quickstart guidance, product readiness docs, and AI learning docs for scoped prompt injection.
- Expanded prompt and pack unit coverage for parser contracts, invalid filter handling, and category/limit propagation.

### Impact
- Prompt personalization can now include only the relevant local learning category and a bounded number of entries.
- Existing unfiltered `prompt`/`pack --with-learning`, local learning profile management, audit controls, and non-learning prompt/pack behavior remain unchanged.

### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- Scoped learning prompt/pack smoke passed with a temporary profile file.
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:metadata`
- `npm run release:check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Users can apply saved local preferences more safely to focused tasks without exposing unrelated profile entries to generated prompts or packs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.
- Decide whether future AI learning should expand into embeddings, feedback learning, or model fine-tuning.

## Phase 177 — Learning profile audit controls (v4.13.0) ✓ shipped

`design-ai learn` now includes a non-mutating audit mode for local learning profiles before they are exported or injected into prompts.

### Changed
- Added `design-ai learn --audit` and `design-ai learn --audit --json` to inspect local profile existence, entry counts, category counts, schema issues, duplicate notes, timestamp gaps, long notes, and conservative sensitive-content patterns.
- Kept audit mode advisory and read-only so users can inspect a profile before deciding whether to use `--with-learning`, `--forget`, or `--clear`.
- Updated CLI help discovery, smoke assertions, README command references, quickstart guidance, product readiness docs, and AI learning docs for the audit surface.
- Expanded learning unit coverage for audit parsing, missing-profile pass state, invalid JSON failure reporting, duplicate detection, timestamp warnings, and sensitive-content warnings.

### Impact
- Local learning now has a safer inspection step before prompt personalization without adding telemetry, embeddings, model training, or background collection.
- Existing `learn --remember`, list/export filtering, forget/clear retention controls, and prompt/pack `--with-learning` behavior remain unchanged.

### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- Learning audit smoke passed with temporary profile files.
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:metadata`
- `npm run release:check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Users can inspect local personalization memory for quality and possible sensitive content before including it in generated agent context.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.
- Decide whether future AI learning should expand into embeddings, feedback learning, or model fine-tuning.

## Phase 176 — Learning profile management controls (v4.13.0) ✓ shipped

`design-ai learn` now supports local profile management with category/limit filters plus confirmed `--forget` and `--clear` deletion controls.

### Changed
- Added `design-ai learn --forget id-or-number --yes` and `design-ai learn --clear --yes` so users can remove local learning entries without editing the JSON profile by hand.
- Added `--category` and `--limit` filtering for `learn --list` and `learn --export`, keeping prompt personalization context easier to inspect before use.
- Updated CLI help discovery, smoke assertions, README command references, and AI learning docs for the expanded management surface.
- Expanded learning unit coverage for parsing, category/limit filtering, single-entry deletion, full-profile clearing, and filtered Markdown export.

### Impact
- Local learning remains explicit and privacy-safe, but now has user-controlled retention and narrower inspection/export controls.
- Existing `learn --remember`, default list output, prompt/pack `--with-learning`, and package manifest counts remain unchanged.

### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- Learning management smoke passed with a temporary profile file.
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:metadata`
- `npm run release:check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Users can inspect, export, forget, or clear local learning preferences from the CLI before allowing those preferences into generated prompt and pack context.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.
- Decide whether future AI learning should expand into embeddings, feedback learning, or model fine-tuning.

## Phase 175 — Local learning profile MVP (v4.13.0) ✓ shipped

`design-ai learn` now stores local learning preferences and `prompt`/`pack --with-learning` can inject them into generated agent context without model training.

### Changed
- Added `design-ai learn` for explicit local preference memory with `--remember`, `--list`, `--export`, `--from-file`, `--stdin`, `--category`, `--file`, and `--json` support.
- Added opt-in `--with-learning` support to `design-ai prompt` and `design-ai pack`, injecting the learned-context block only when requested.
- Added `docs/AI-LEARNING.md`, updated product readiness docs, README command references, MkDocs navigation, and CLI help discovery for the new learning surface.
- Wrapped long top-level help rows so `prompt`, `pack`, and `learn` usage stays readable after adding learning options.
- Expanded unit and smoke assertion coverage for learning profile parsing, persistence, prompt/pack injection, help topic discovery, and unknown-option suggestion behavior.

### Impact
- design-ai now ships a privacy-safe local personalization layer while keeping model training, fine-tuning, embeddings, and feedback learning outside the shipped scope.
- Existing route selection, prompt/pack output without `--with-learning`, slash-command inventory, install lifecycle, and package manifest counts remain unchanged.

### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- All 8 audits pass.
- Learning profile prompt/pack smoke passed with a temporary profile file.
- `npm run release:metadata`
- `npm run release:check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Users can make design-ai remember project or taste constraints locally, then explicitly include that context in prompt and pack generation.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.
- Decide whether future AI learning should expand into embeddings, feedback learning, or model fine-tuning.

## Phase 174 — Product readiness scope boundary documented (v4.13.0) ✓ shipped

Product readiness docs now clarify that core design consulting workflows are locally release-ready while AI model training is outside shipped scope.

### Changed
- `docs/PRODUCT-READINESS.md` now separates shipped design consulting capability, local release confidence, conversational AI design coverage, and non-shipped AI learning/model-training scope.
- README status sections now link to the readiness boundary and clarify that design-ai is a corpus/routing/prompt-pack/QA layer rather than a model or fine-tune.
- MkDocs navigation now exposes the readiness page under Reference so launch reviewers can find the current completion matrix.
- CHANGELOG and SESSION-LOG now record the Phase 174 readiness boundary.

### Impact
- Product status is now explicit: core design consulting workflows are locally release-ready for v4.13, while Real-CI, external launch, registry smoke, and any future personalization/model-learning work remain separate decisions.
- Existing CLI runtime behavior, package contents, release smoke assertions, knowledge corpus files, examples, and command coverage remain unchanged.

### Verified
- All 8 audits pass.
- `npm run release:metadata`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The team can answer completion questions without conflating the shipped design consulting system with future AI learning or personalization products.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.
- Decide whether future AI learning means embeddings, feedback learning, or model fine-tuning.

## Phase 173 — Lifecycle JSON context path assertion hardening (v4.13.0) ✓ shipped

Lifecycle JSON smoke assertions now verify source/target context separation across install, update dry-run, status, and uninstall reports.

### Changed
- `tools/audit/smoke_assertions.py` now validates lifecycle JSON context paths through a shared source/target guard for `design-ai install --json`, `design-ai update --dry-run --json`, `design-ai status --json`, and `design-ai uninstall --json`.
- Lifecycle JSON assertions now reject `sourceRoot` and `claudeHome` when they are identical or nested inside each other, while preserving the existing key-order, prefix, count, plan, and install-state checks.
- The smoke assertion self-test now covers install context equality, update source-inside-target drift, status target-inside-source drift, and uninstall target-inside-source drift fixtures.
- CHANGELOG and SESSION-LOG now record the Phase 173 hardening.

### Impact
- Package and registry smoke checks now fail when lifecycle JSON remains parseable and counts still match, but the reported source and Claude Code target roots no longer describe separate lifecycle contexts.
- Existing CLI runtime behavior, lifecycle JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now validates lifecycle source/target separation before relying on lifecycle counts, update plan summaries, or status target directories.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 172 — Status JSON install-state target assertion hardening (v4.13.0) ✓ shipped

Status JSON smoke assertions now verify exact install-state section labels and Claude-home target directory contracts.

### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai status --json` section labels and target directories against the install-state contract used by package and registry smoke.
- Status JSON assertions now require each section to keep the exact `Skills`, `Agents`, and `Slash commands` labels, keep target directories under `claudeHome`, and end each target path with the matching `skills`, `agents`, or `commands` directory.
- The smoke assertion self-test now covers section label drift, target directory escaping `claudeHome`, and target directory basename drift fixtures.
- CHANGELOG and SESSION-LOG now record the Phase 172 hardening.

### Impact
- Package and registry smoke checks now fail when status JSON remains parseable and has the right symlink entries, but no longer describes the same user-facing install-state sections or Claude Code target directories.
- Existing CLI runtime behavior, status JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects the status install-state JSON as a stable human-readable and machine-readable map of installed symlink sections and their Claude Code target directories.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 171 — Update dry-run JSON smoke plan assertion hardening (v4.13.0) ✓ shipped

Update dry-run JSON smoke assertions now verify exact git/install plan key order, boolean contracts, command arrays, and readiness reasons.

### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai update --dry-run --json` with stricter update-plan guards for top-level key order, nested `plan` key order, git-pull boolean fields, git command arrays, and git/install readiness reasons.
- Update dry-run JSON assertions now reject bool-as-int drift for `gitPull.wouldRun`, stale git clone reasons, missing git pull commands for clone sources, missing install reason keys, and install reason wording drift.
- The smoke assertion self-test now covers top-level reorder, plan reorder, boolean type drift, clone command drift, git reason drift, install key drift, and install reason drift fixtures.
- CHANGELOG and SESSION-LOG now record the Phase 171 hardening.

### Impact
- Package and registry smoke checks now fail when update preview JSON remains parseable but no longer describes the same non-mutating git/install plan contract used before install lifecycle checks.
- Existing CLI runtime behavior, update dry-run JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects the update preview plan as a stable non-mutating lifecycle contract before install, status, doctor, and uninstall smoke checks run.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 170 — Help/list/version JSON smoke schema assertion hardening (v4.13.0) ✓ shipped

Help, list, and version JSON smoke assertions now verify command-discovery key shape, alias/topic order, catalog item contracts, and version metadata keys.

### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai help --json`, `design-ai list --json`, and `design-ai version --json` with stable top-level, topic, alias, catalog section, catalog item, context, and version key guards.
- Help JSON assertions now require exact topic usage strings, stable topic entry key order, exact alias order, and per-topic alias lists aligned with the canonical alias map.
- List JSON assertions now reject non-object payloads, top-level key-order drift, bool-as-int section counts, and catalog item shape drift.
- Version JSON assertions now reject non-object payloads, top-level key-order drift, missing context keys, and version metadata key-order drift.
- CHANGELOG and SESSION-LOG now record the Phase 170 hardening.

### Impact
- Package and registry smoke checks now fail when command discovery or version metadata JSON remains parseable but drifts from the machine-readable contracts used by automation and downstream agents.
- Existing CLI runtime behavior, help/list/version JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects command discovery, catalog listing, and version metadata JSON as stable machine-readable contracts, not only as parseable JSON containing expected fragments.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 169 — Check JSON smoke schema assertion hardening (v4.13.0) ✓ shipped

Check JSON smoke assertions now verify artifact/stdin/example report key shape, exact result order, count consistency, and example metadata contracts.

### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai check --json`, `design-ai check --stdin --json`, and `design-ai check --examples --json` with stable report, result, example-entry, and example-metadata key guards.
- Artifact and stdin check assertions now require stable report keys, exact component-spec result order, non-boolean integer count fields, exact score formatting, required result title/message fields, and `content-depth` evidence shape.
- Check examples JSON assertions now require stable top-level key order, exact example entry shape, positive non-boolean example scores, non-empty previews, nested report schema checks, and summary counts aligned with nested example reports.
- CHANGELOG and SESSION-LOG now record the Phase 169 hardening.

### Impact
- Package and registry smoke checks now fail when `design-ai check` JSON remains parseable but drifts from the artifact QA contract used by release automation and downstream agents.
- Existing CLI runtime behavior, check JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects `design-ai check` artifact/stdin/examples JSON as stable machine-readable QA contracts, not only as passing reports that contain expected result ids.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 168 — Route/prompt/pack JSON smoke schema assertion hardening (v4.13.0) ✓ shipped

Route, prompt, and pack JSON smoke assertions now verify recommendation/prompt-bundle key shape, exact numeric fields, reference coverage consistency, and context file order.

### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai route --json`, `design-ai routes --json`, `design-ai prompt --json`, and `design-ai pack --json` with stable top-level, route-entry, explanation, reference, prompt-plan, summary, and file-entry key guards.
- Route JSON assertions now require exact route result counts for `--limit 1`, stable recommendation key shape, exact non-boolean integer scores, keyword lists, reference entry shape, score breakdown shape, and full reference coverage consistency.
- Prompt JSON assertions now require stable forced-route plan shape, exact `filesToRead` order, reference example previews/scores, route coverage consistency, and prompt bundle content.
- Pack JSON assertions now require stable bundle and summary key shape, exact budget/count fields, ordered context files aligned with the prompt plan, included file-entry contracts, string warnings, and explicit context budget exhaustion.
- CHANGELOG and SESSION-LOG now record the Phase 168 hardening.

### Impact
- Package and registry smoke checks now fail when route selection, prompt generation, or context packing JSON remains parseable but drifts from the machine-readable contracts used by automation and downstream agents.
- Existing CLI runtime behavior, route/prompt/pack JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects route selection, prompt-plan, and context-pack JSON as stable machine-readable contracts, not only as valid JSON containing expected route fragments.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 167 — Corpus discovery JSON smoke schema assertion hardening (v4.13.0) ✓ shipped

Corpus discovery JSON smoke assertions now verify search/show/examples key shape, file paths, exact integer fields, and limit-bound result counts.

### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai search --json`, `design-ai show --json`, `design-ai show --lines --json`, and `design-ai examples --json` with corpus-specific object/key guards.
- Search JSON assertions now require stable hit keys, non-empty absolute file paths ending in the expected corpus path, exact positive integer line numbers, and the single result promised by `--limit 1`.
- Show JSON assertions now require stable top-level and line-entry keys, exact positive integer range fields, valid `totalLines`, and file paths aligned with the reported `relPath`.
- Examples JSON assertions now require stable route-biased payload keys, exact positive integer scores, non-empty previews, and the single result promised by `--limit 1`.
- CHANGELOG and SESSION-LOG now record the Phase 167 hardening.

### Impact
- Package and registry smoke checks now fail when corpus discovery JSON remains parseable but drifts from the machine-readable search/show/examples contract that prompt-building and automation depend on.
- Existing CLI runtime behavior, corpus JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects corpus discovery JSON as stable machine-readable search/show/examples contracts, not only as parseable JSON containing expected text fragments.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 166 — Lifecycle JSON smoke schema assertion hardening (v4.13.0) ✓ shipped

Lifecycle JSON smoke assertions now verify payload type, nested key shape, exact integer counts, and install/status/uninstall summary consistency.

### Changed
- `tools/audit/smoke_assertions.py` now verifies lifecycle JSON payloads for `design-ai install --json`, `design-ai status --json`, `design-ai uninstall --json`, and `design-ai update --dry-run --json` with shared object/key guards.
- Install JSON assertions now reject non-object top-level payloads, bool-as-int count drift, and installed total values that do not equal the section counts.
- Status JSON assertions now reject unexpected section counts, bool-as-int section/summary counts, and non-object top-level payloads before comparing installed entries.
- Uninstall and update dry-run JSON assertions now reject non-object top-level payloads, and uninstall JSON rejects bool-as-int removed counts.
- CHANGELOG and SESSION-LOG now record the Phase 166 hardening.

### Impact
- Package and registry smoke checks now fail when lifecycle JSON remains parseable but drifts from the machine-readable install/status/uninstall/update contract that automation consumes.
- Existing CLI runtime behavior, lifecycle JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects lifecycle JSON as stable machine-readable install-state and lifecycle-result contracts, not only as valid JSON with expected command labels.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 165 — Audit JSON smoke schema assertion hardening (v4.13.0) ✓ shipped

Audit JSON smoke assertions now verify payload type, entry schema, numeric contracts, and summary/count consistency.

### Changed
- `tools/audit/smoke_assertions.py` now verifies the full `design-ai audit --strict --quiet --json` report contract: top-level payload type, context shape, audit entry keys, boolean/integer/numeric field contracts, strict args shape, and summary/count consistency.
- Audit JSON smoke assertion self-tests now include fixtures for array top-level payloads, missing audit-entry keys, boolean numeric drift, non-boolean pass flags, and mismatched summary counts.
- CHANGELOG and SESSION-LOG now record the Phase 165 hardening.

### Impact
- Package and registry smoke checks now fail when audit JSON remains parseable but drifts from the machine-readable repository-audit schema that automation consumes.
- Existing CLI runtime behavior, audit JSON formatter output, audit runner execution, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/run-all.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects audit JSON as a stable machine-readable repository-audit contract, not only as valid JSON with passing audit names.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 164 — Doctor JSON smoke schema assertion hardening (v4.13.0) ✓ shipped

Doctor JSON smoke assertions now verify schema shape, key order, and summary/count consistency.

### Changed
- `tools/audit/doctor_assertions.py` now verifies the full `design-ai doctor --json` report contract: top-level key order, context shape, expected inventory counts, check entry keys, summary keys, fix keys, and summary/count consistency.
- Doctor assertion self-tests now include fixtures for missing `fix`, mismatched summary counts, and changed check-entry shape.
- Shared package/registry smoke doctor JSON fixtures now match the production `context`, `checks`, `summary`, and `fix` payload shape.
- CHANGELOG and SESSION-LOG now record the Phase 164 hardening.

### Impact
- Package and registry smoke checks now fail when doctor JSON remains parseable but drifts from the machine-readable diagnostics schema that automation consumes.
- Existing CLI runtime behavior, doctor JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/doctor_assertions.py --self-test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke automation now protects doctor JSON as a stable machine-readable contract, not only as valid JSON with passing labels.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 163 — Doctor JSON diagnostics guard split (v4.13.0) ✓ shipped

Release metadata now reports doctor JSON command and machine-readable diagnostics output drift separately.

### Changed
- `tools/audit/release-metadata.py` now adds separate release policy phrase labels for the exact `design-ai doctor --json` command and machine-readable diagnostics output.
- `release-metadata.py --self-test` now has drift fixtures for dropping the doctor JSON command while keeping output wording, and for dropping machine-readable diagnostics output wording while keeping the exact command.
- README, Korean README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out `design-ai doctor --json` machine-readable diagnostics output in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 163 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the doctor JSON command or machine-readable diagnostics output coverage.
- Existing CLI, doctor JSON formatter, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve doctor smoke guidance as independently reported human strict, JSON command, and machine-readable diagnostics output contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 162 — Doctor human diagnostics output guard split (v4.13.0) ✓ shipped

Release metadata now reports human doctor strict diagnostics output drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad doctor human diagnostics guard and adds a separate human doctor strict diagnostics output release policy phrase label.
- `release-metadata.py --self-test` now has a drift fixture for dropping human diagnostics output from `design-ai doctor --strict` while the generic human diagnostics wording remains present.
- README, Korean README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out human diagnostics output from `design-ai doctor --strict` in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 162 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with a separate metadata error when they lose human doctor strict diagnostics output coverage.
- Existing CLI, doctor execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve doctor strict smoke guidance as independently reported command, generic human diagnostics, and human diagnostics output contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 161 — Human update dry-run output guard split (v4.13.0) ✓ shipped

Release metadata now reports human update dry-run output drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad `update --dry-run` lifecycle guard and adds a separate human update dry-run output release policy phrase label.
- `release-metadata.py --self-test` now has a drift fixture for dropping human `design-ai update --dry-run` output wording while JSON dry-run command and update plan wording remain present.
- `docs/RELEASE-CHECKLIST.md` now names human update dry-run output separately from the exact command and machine-readable update plan in the metadata guard explanation.
- CHANGELOG and SESSION-LOG now record the Phase 161 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with a separate metadata error when they lose human update dry-run output coverage.
- Existing CLI, update dry-run output, update dry-run JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve update dry-run smoke guidance as independently reported human output, command, JSON command, and machine-readable plan contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 160 — Human audit output guard split (v4.13.0) ✓ shipped

Release metadata now reports human audit strict-quiet output drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad `audit --strict --quiet` smoke guard and adds a separate human audit output release policy phrase label.
- `release-metadata.py --self-test` now has a drift fixture for dropping human `design-ai audit --strict --quiet` output wording while JSON audit wording remains present.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out human audit output separately from JSON repository-audit output.
- CHANGELOG and SESSION-LOG now record the Phase 160 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with a separate metadata error when they lose human audit output coverage.
- Existing CLI, audit execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve audit smoke guidance as independently reported human and machine-readable output contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 159 — Human lifecycle output guard split (v4.13.0) ✓ shipped

Release metadata now reports human install, human status, and human uninstall output drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad human install/status/uninstall lifecycle guards and adds separate human install output, human status output, and human uninstall output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping each human lifecycle output wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out human install, status, and uninstall output as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 159 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose human install, status, or uninstall output coverage.
- Existing CLI, install execution, status execution, uninstall execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve human lifecycle smoke guidance as three independently reported output contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 158 — Check output guard split (v4.13.0) ✓ shipped

Release metadata now reports check examples, check artifact, check stdin, and check all-routes output drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad check examples/artifact/stdin/all-routes guard and adds separate check examples output, check artifact output, check stdin output, and check all-routes output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping each `design-ai check` smoke-surface wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the four check output surfaces as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 158 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose check examples, artifact, stdin, or all-routes output coverage.
- Existing CLI, check execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve `design-ai check` smoke guidance as four independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 157 — Prompt/pack output-file guard split (v4.13.0) ✓ shipped

Release metadata now reports prompt/pack forced output-file and prompt/pack file-write confirmation drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad prompt/pack output-file guard and adds separate prompt/pack forced output-file and prompt/pack file-write confirmation release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping forced `--out` wording and file-write confirmation wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out prompt/pack forced output-file coverage and prompt/pack file-write confirmations as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 157 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose prompt/pack forced output-file coverage or prompt/pack file-write confirmation coverage.
- Existing CLI, prompt execution, pack execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve prompt/pack output-file smoke guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 156 — Prompt/pack mode guard split (v4.13.0) ✓ shipped

Release metadata now reports prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad prompt/pack mode guard and adds separate prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping each prompt/pack mode output wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the eight prompt/pack mode smoke surfaces as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 156 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose prompt JSON, prompt markdown, prompt from-file, prompt stdin, pack JSON, pack markdown, pack from-file, or pack stdin coverage.
- Existing CLI, prompt execution, pack execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve prompt/pack mode smoke guidance as eight independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 155 — Suggestion failure guard split (v4.13.0) ✓ shipped

Release metadata now reports route-id suggestion, option suggestion, value suggestion, and numeric range failure drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad suggestion/range failure guard and adds separate route-id suggestion, option suggestion, value suggestion, and numeric range failure release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping unknown route-id suggestion wording, unknown option suggestion wording, unknown value suggestion wording, and numeric range failure wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the four suggestion/range smoke surfaces as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 155 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose route-id suggestion, option suggestion, value suggestion, or numeric range failure coverage.
- Existing CLI, unknown route-id suggestion execution, unknown option suggestion execution, unknown value suggestion execution, numeric range failure execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve route-id suggestion, option suggestion, value suggestion, and numeric range failure smoke guidance as four independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 154 — Unknown failure guard split (v4.13.0) ✓ shipped

Release metadata now reports unknown command, help-topic, list-domain, and search-dir failure drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad unknown command/help/list/search-dir failure guard and adds separate unknown command, help-topic, list-domain, and search-dir failure release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping unknown command failure wording, unknown help-topic failure wording, unknown list-domain failure wording, and unknown search-dir failure wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the four unknown failure smoke surfaces as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 154 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose unknown command, help-topic, list-domain, or search-dir failure coverage.
- Existing CLI, unknown command failure execution, unknown help-topic failure execution, unknown list-domain failure execution, unknown search-dir failure execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve unknown command, help-topic, list-domain, and search-dir failure smoke guidance as four independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 153 — Explicit output guard split (v4.13.0) ✓ shipped

Release metadata now reports show-lines output drift separately from route-explain output drift.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad explicit output guard and adds separate show-lines output and route-explain output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping `show --lines` output wording and dropping `route --explain` output wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out `show --lines` output and `route --explain` output as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 153 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose explicit line-range output coverage or route explanation output coverage.
- Existing CLI, `show --lines` output, `route --explain` output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve explicit line-range output and route explanation output as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 152 — Route smoke guard split (v4.13.0) ✓ shipped

Release metadata now reports route JSON output, route catalog output, and route stdin input drift separately.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad route JSON/catalog/stdin guard and adds separate route JSON output, route catalog output, and route stdin input release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping route JSON output wording, route catalog output wording, and route stdin input wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out route JSON output, route catalog output, and route stdin input as separate protected release smoke surfaces.
- CHANGELOG and SESSION-LOG now record the Phase 152 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose route recommendation JSON output, route catalog output, or route stdin input coverage.
- Existing CLI, route JSON output, route catalog output, route stdin input execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve route JSON output, route catalog output, and route stdin input as three independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 151 — List catalog guard split (v4.13.0) ✓ shipped

Release metadata now reports list JSON mode drift separately from list catalog domain drift.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad list JSON catalog guard and adds separate list JSON mode and list catalog domains release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping list JSON mode wording and dropping all-three list catalog domain wording.
- `docs/RELEASE-CHECKLIST.md` now describes list JSON mode and list catalog domains as separate protected release metadata phrases.
- CHANGELOG and SESSION-LOG now record the Phase 151 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose list JSON mode guidance versus skills/commands/agents catalog domain coverage.
- Existing CLI, list JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve list JSON mode guidance and list catalog domain coverage as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 150 — Alias smoke guard split (v4.13.0) ✓ shipped

Release metadata now reports command alias smoke drift separately from functional alias smoke drift.

### Changed
- `tools/audit/release-metadata.py` now keeps the broad alias smoke guard and adds separate command alias smoke and functional alias smoke release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping command alias wording and dropping functional alias wording.
- `docs/RELEASE-CHECKLIST.md` now describes command alias smoke and functional alias smoke as separate protected release metadata phrases.
- CHANGELOG and SESSION-LOG now record the Phase 150 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose command alias help guidance versus functional alias output guidance.
- Existing CLI, help alias output, functional alias output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve command alias help guidance and functional alias output guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 149 — Update dry-run JSON command guard split (v4.13.0) ✓ shipped

Release metadata now reports update dry-run command, JSON command, and machine-readable update plan drift separately.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai update --dry-run` and `design-ai update --dry-run --json` commands with their own release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the human dry-run command, dropping the JSON dry-run command, and dropping machine-readable update plan wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now document all three protected update dry-run phrases in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 149 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the update dry-run command, the JSON dry-run command, or the machine-readable update plan behavior it validates.
- Existing CLI, update dry-run output, update dry-run JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the update dry-run human command, JSON command, and machine-readable update plan guidance as three independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 148 — Doctor strict command guard split (v4.13.0) ✓ shipped

Release metadata now reports `design-ai doctor --strict` command drift separately from human diagnostics wording drift.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai doctor --strict` command with its own release policy phrase label.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai doctor --strict` command and dropping human diagnostics wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now document both protected phrases in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 148 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the doctor strict command versus the human diagnostics behavior it validates.
- Existing CLI, doctor strict diagnostics output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the `design-ai doctor --strict` command and human diagnostics guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 147 — Audit JSON command guard split (v4.13.0) ✓ shipped

Release metadata now reports `design-ai audit --strict --quiet --json` command drift separately from machine-readable repository-audit output drift.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai audit --strict --quiet --json` command with its own release policy phrase label.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai audit --strict --quiet --json` command and dropping machine-readable repository-audit output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now document both protected phrases in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 147 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the audit JSON command versus the repository-audit output behavior it validates.
- Existing CLI, audit JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the `design-ai audit --strict --quiet --json` command and machine-readable repository-audit output guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 146 — Status JSON command guard split (v4.13.0) ✓ shipped

Release metadata now reports `design-ai status --json` command drift separately from machine-readable install-state output drift.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai status --json` command with its own release policy phrase label.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai status --json` command and dropping machine-readable install-state output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now document both protected phrases in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 146 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the status JSON command versus the install-state output behavior it validates.
- Existing CLI, status JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the `design-ai status --json` command and machine-readable install-state output guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 145 — Uninstall JSON command guard split (v4.13.0) ✓ shipped

Release metadata now reports `design-ai uninstall --json` command drift separately from machine-readable uninstall lifecycle output drift.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai uninstall --json` command with its own release policy phrase label.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai uninstall --json` command and dropping machine-readable uninstall lifecycle output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now document both protected phrases in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 145 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the uninstall JSON command versus the uninstall lifecycle output behavior it validates.
- Existing CLI, uninstall JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the `design-ai uninstall --json` command and machine-readable uninstall lifecycle output guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 144 — Install JSON command guard split (v4.13.0) ✓ shipped

Release metadata now reports `design-ai install --json` command drift separately from machine-readable install lifecycle output drift.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai install --json` command with its own release policy phrase label.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai install --json` command and dropping machine-readable install lifecycle output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now document both protected phrases in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 144 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the install JSON command versus the install lifecycle output behavior it validates.
- Existing CLI, install JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the `design-ai install --json` command and machine-readable install lifecycle output guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 143 — Version JSON command guard split (v4.13.0) ✓ shipped

Release metadata now reports `design-ai version --json` command drift separately from machine-readable version metadata drift.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai version --json` command with its own release policy phrase label.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai version --json` command and dropping machine-readable version metadata wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now document both protected phrases in release smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 143 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the version JSON command versus the version metadata behavior it validates.
- Existing CLI, version JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the `design-ai version --json` command and machine-readable version metadata guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 142 — Help JSON command guard split (v4.13.0) ✓ shipped

Release metadata now reports `design-ai help --json` command drift separately from help JSON topic catalog drift.

### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai help --json` command with its own release policy phrase label.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai help --json` command and dropping help JSON topic catalog wording.
- `docs/RELEASE-CHECKLIST.md` now documents both protected phrases in the release metadata guard list.
- CHANGELOG and SESSION-LOG now record the Phase 142 split.

### Impact
- README, Release checklist, and English/Korean Distribution docs now fail with separate metadata errors when they lose the help JSON command versus the topic catalog behavior it validates.
- Existing CLI, help JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the `design-ai help --json` command and help JSON topic catalog guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 141 — Top-level help command guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `design-ai help` command that package and registry smoke use to validate top-level help output.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `design-ai help` top-level help command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `design-ai help` command.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now identify `design-ai help` as the top-level help command.
- CHANGELOG and SESSION-LOG now record the Phase 141 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep top-level help wording while dropping the `design-ai help` command that package and registry smoke validate.
- Existing CLI, help command execution, local CI execution, repository audits, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check, package smoke, registry smoke, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the top-level help command and top-level help smoke guidance as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 140 — Local CI command guard split (v4.13.0) ✓ shipped

Release metadata now reports local CI command drift separately from MkDocs warning-policy drift.

### Changed
- `tools/audit/release-metadata.py` now checks `npm run ci:local` with a dedicated local CI command phrase label.
- `release-metadata.py --self-test` now has a drift fixture that fails with the exact local CI command phrase error when a release-facing policy doc drops the `npm run ci:local` command.
- `docs/RELEASE-CHECKLIST.md` now documents `npm run ci:local` command guidance separately from MkDocs warning-policy baseline guidance.
- CHANGELOG and SESSION-LOG now record the Phase 140 split.

### Impact
- Release metadata failures now distinguish the local CI command handoff from MkDocs warning-policy baseline prose, so maintainers can see whether a doc dropped the command to run, the warning policy itself, or both.
- Existing CLI, local CI execution, repository audits, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check, package smoke, registry smoke, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve local CI command guidance and MkDocs warning-policy guidance as two independently reported contracts.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 139 — Repository audit command guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `npm run audit:strict` command that runs all eight repository audits before whitespace, package, and smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run audit:strict` repository audit command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `npm run audit:strict` command.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now identify `npm run audit:strict` as the all-eight repository audit command.
- CHANGELOG and SESSION-LOG now record the Phase 139 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep all-eight repository audit wording while dropping the `npm run audit:strict` command that runs before whitespace, package, and smoke checks.
- Existing CLI, repository audit execution, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check, package smoke, registry smoke, and release check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the repository audit command and all-eight repository audit guidance as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 138 — CLI unit test command guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `npm test` command that runs CLI unit tests before repository audits and package checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm test` CLI unit test command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `npm test` command.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now identify `npm test` as the CLI unit test command.
- CHANGELOG and SESSION-LOG now record the Phase 138 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep CLI unit test wording while dropping the `npm test` command that runs before repository audits and package checks.
- Existing CLI, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check, package smoke, registry smoke, release check, and repository audits behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the CLI unit test command and CLI unit test guidance as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 137 — Whitespace check command guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `git diff --check` command that runs whitespace checks before package contents and smoke gates.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `git diff --check` command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `git diff --check` command.
- README, Korean README, Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now identify `git diff --check` as the whitespace check command.
- CHANGELOG and SESSION-LOG now record the Phase 137 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep whitespace check wording while dropping the `git diff --check` command that runs before package contents and smoke checks.
- Existing CLI, whitespace check execution, release self-test execution, release metadata execution, package contents check, package smoke, registry smoke, release check, repository audits, and unit tests behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the whitespace command and whitespace check guidance as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 136 — Release self-test command guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `release:self-test` command that runs release assertion fixtures before package smoke.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run release:self-test` command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `release:self-test` command.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now identify `release:self-test` as the release assertion fixture command before package smoke.
- CHANGELOG and SESSION-LOG now record the Phase 136 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep release self-test wording while dropping the `release:self-test` command that runs assertion fixtures before package smoke.
- Existing CLI, release self-test execution, release metadata execution, package contents check, package smoke, registry smoke, release check, whitespace check execution, repository audits, and unit tests behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the release self-test command and release self-test guidance as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 135 — Release metadata command guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `release:metadata` command that runs release metadata checks before tagging.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run release:metadata` command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `release:metadata` command.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now identify `release:metadata` as the release metadata command before listing downstream release gates.
- CHANGELOG and SESSION-LOG now record the Phase 135 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep release metadata check wording while dropping the `release:metadata` command that runs the guard before tagging.
- Existing CLI, release metadata execution, package contents check, package smoke, registry smoke, release check, release self-test execution, whitespace check execution, repository audits, and unit tests behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the release metadata command and release metadata check wording as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 134 — Package contents command metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `package:check` command that verifies tarball package contents before smoke tests.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run package:check` package contents command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `package:check` command.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now identify `package:check` as the package contents command before listing downstream smoke checks.
- CHANGELOG and SESSION-LOG now record the Phase 134 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep package contents wording while dropping the `package:check` command that verifies tarball contents.
- Existing CLI, package contents check, package smoke, registry smoke, release check, release metadata execution, release self-test execution, whitespace check execution, repository audits, and unit tests behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the package contents command and package contents check wording as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 133 — Package smoke command metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the local `package:smoke` command that runs packed-tarball installed-bin and one-shot npm exec checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run package:smoke` packed-tarball command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `package:smoke` command.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now identify `package:smoke` as the packed-tarball smoke command before listing its execution paths.
- CHANGELOG and SESSION-LOG now record the Phase 133 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep packed-tarball smoke path details while dropping the `package:smoke` command that verifies them.
- Existing CLI, package smoke, registry smoke, release check, release metadata execution, release self-test execution, whitespace check execution, repository audits, unit tests, and package contents check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the local package smoke command and the packed-tarball execution paths as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 132 — Registry smoke command metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the post-publish `registry:smoke` command that verifies the public npm install path.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run registry:smoke` post-publish command guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `registry:smoke` command.
- `docs/RELEASE-CHECKLIST.md` now names `registry:smoke` inside the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 132 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep the public registry npm exec path while dropping the post-publish command that verifies it.
- Existing CLI, registry smoke, release check, package smoke, release metadata execution, release self-test execution, whitespace check execution, repository audits, unit tests, and package contents check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the post-publish registry smoke command and the public registry install path as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 131 — Release check command metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the top-level `release:check` core gate command that maintainers run before release PRs or tags.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run release:check` core gate guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the `release:check` command.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now identify `release:check` as the core gate before listing its downstream checks.
- CHANGELOG and SESSION-LOG now record the Phase 131 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep downstream gate details while dropping the `release:check` command that runs them.
- Existing CLI, release check execution, package smoke, registry smoke, release metadata execution, release self-test execution, whitespace check execution, repository audits, unit tests, and package contents check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The release-facing docs now preserve the top-level local release command and the checks it orchestrates as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 130 — Packed tarball smoke metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the packed-tarball smoke gate that wraps the installed-bin and one-shot npm exec package checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for packed-tarball smoke gate guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops packed-tarball smoke wording.
- README, Korean README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now identify packed-tarball smoke as the package smoke gate for installed-bin and one-shot npm exec paths.
- CHANGELOG and SESSION-LOG now record the Phase 130 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep the individual package smoke paths while dropping the packed-tarball smoke gate that runs them.
- Existing CLI, package smoke, registry smoke, release metadata execution, release self-test execution, whitespace check execution, repository audits, unit tests, and package contents check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release-facing docs now preserve the package smoke gate and the local packed-tarball execution paths as one contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 129 — Release metadata check guidance guard added (v4.13.0) ✓ shipped

Release metadata now protects the release metadata check guidance already covered by `npm run release:metadata` in the release gate.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run release:metadata` / release metadata check guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops release metadata check wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now list release metadata check guidance in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 129 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the release metadata check gate while keeping package, self-test, and smoke guidance.
- Existing CLI, release metadata execution, package smoke, registry smoke, release self-test execution, whitespace check execution, repository audits, unit tests, and package contents check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata check guidance now has an end-to-end drift guard from `release:check` to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 128 — Packed tarball installed-bin metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the packed-tarball installed-bin guidance already covered by package smoke.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for packed-tarball installed-bin smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops installed-bin wording.
- English/Korean Distribution docs and `docs/RELEASE-CHECKLIST.md` now list installed-bin guidance in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 128 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the installed-bin package smoke path while keeping one-shot npm exec, registry, and lifecycle smoke guidance.
- Existing CLI, package smoke, registry smoke, release self-test execution, whitespace check execution, repository audits, unit tests, and package contents check behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Local package smoke guidance now preserves both packed-tarball execution paths: installed-bin and one-shot npm exec.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 127 — Release self-test metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects release self-test guidance already covered by `npm run release:self-test` in the release gate.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `npm run release:self-test` guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops release self-test wording.
- English Distribution docs and `docs/RELEASE-CHECKLIST.md` now list release self-test guidance in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 127 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the release assertion self-test gate while keeping downstream package smoke and registry smoke guidance.
- Existing CLI, release self-test execution, whitespace check execution, repository audits, unit tests, package contents check, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release self-test guidance now has an end-to-end drift guard from `release:check` to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 126 — Whitespace check release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects whitespace check guidance already covered by `git diff --check` in the release gate.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for whitespace check guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops whitespace check wording.
- English Distribution docs and `docs/RELEASE-CHECKLIST.md` now list whitespace check guidance in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 126 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the whitespace gate while keeping downstream package contents, package smoke, and registry smoke guidance.
- Existing CLI, whitespace check execution, repository audits, unit tests, package contents check, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Whitespace check guidance now has an end-to-end drift guard from `release:check` to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 125 — Repository audit gate release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects all-eight repository audit guidance already covered by `npm run audit:strict` in the release gate.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for all-eight repository audit guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops repository audit gate wording.
- `docs/RELEASE-CHECKLIST.md` now lists all-eight repository audit guidance in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 125 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the repository audit gate while keeping downstream package contents, package smoke, and registry smoke guidance.
- Existing CLI, repository audits, unit tests, package contents check, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Repository audit gate guidance now has an end-to-end drift guard from `run-all.py --strict` to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 124 — CLI unit test release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects CLI unit test guidance already covered by `npm test` in the release gate.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for CLI unit test guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops CLI unit test wording.
- `docs/RELEASE-CHECKLIST.md` now lists CLI unit test guidance in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 124 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the first release gate while keeping downstream package contents, package smoke, and registry smoke guidance.
- Existing CLI, unit tests, package contents check, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- CLI unit test guidance now has an end-to-end drift guard from the release gate script to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 123 — Package contents release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects package contents check guidance already covered by `npm run package:check` in the release gate.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for package contents check guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops package contents wording.
- `docs/RELEASE-CHECKLIST.md` now lists package contents check guidance in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 123 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package contents gate while keeping downstream package and registry smoke guidance.
- Existing CLI, package contents check, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Package contents guidance now has an end-to-end drift guard from the package allowlist audit to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 122 — Public registry npm exec release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the post-publish public registry `npm exec --package @design-ai/cli@<version>` guidance already covered by registry smoke.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for public registry npm exec smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops public registry `npm exec --package @design-ai/cli@<version>` wording.
- `docs/RELEASE-CHECKLIST.md` now lists the public registry npm exec path in the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 122 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the post-publish package execution path while keeping local packed-tarball smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Registry smoke guidance now has an end-to-end drift guard from post-publish npm exec verification to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 121 — Packed tarball npm exec release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the one-shot packed-tarball `npm exec --package <tarball>` guidance already covered by package smoke.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for packed-tarball npm exec smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops one-shot `npm exec --package <tarball>` wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now distinguish the local packed-tarball installed-bin and npm exec paths from public registry npm exec smoke.
- CHANGELOG and SESSION-LOG now record the Phase 121 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package smoke contract for one-shot packed-tarball execution.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Local tarball smoke guidance now has an end-to-end drift guard from package-smoke implementation to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 120 — Unknown command failure release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects unknown command/help/list/search-dir failure guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for unknown command/help/list/search-dir failure smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops unknown command/help/list/search-dir wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now describe unknown command/help/list/search-dir failure coverage in package and registry smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 120 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently narrow failure-path smoke guidance to route-id/option/value and numeric range checks.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Unknown command/help/list/search-dir failure guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 119 — Human lifecycle release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects human install, human+JSON status, and human uninstall lifecycle guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for human install/status/uninstall lifecycle smoke guidance.
- `release-metadata.py --self-test` now has drift fixtures that fail when a release-facing policy doc drops human lifecycle wording while retaining JSON lifecycle wording.
- `docs/RELEASE-CHECKLIST.md` now describes the human lifecycle phrases inside the release metadata protected phrase set.
- CHANGELOG and SESSION-LOG now record the Phase 119 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently collapse lifecycle smoke guidance down to JSON-only install/status/uninstall checks.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Human lifecycle smoke guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 118 — Prompt/pack mode release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the prompt/pack JSON/markdown/from-file/stdin guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for prompt/pack JSON/markdown/from-file/stdin smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops prompt/pack mode wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now describe prompt/pack JSON/markdown/from-file/stdin coverage in package and registry smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 118 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop prompt/pack mode smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Prompt/pack JSON/markdown/from-file/stdin guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 117 — Route JSON release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the route JSON/catalog/stdin guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for route JSON/catalog/stdin smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops route JSON/catalog/stdin wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now describe route JSON/catalog/stdin coverage in package and registry smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 117 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop route JSON/catalog/stdin smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Route JSON/catalog/stdin guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 116 — Check command release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the `design-ai check` guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for check examples/artifact/stdin/all-routes smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops check command wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now describe check command coverage in package and registry smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 116 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop check command smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Check command guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 115 — Human version release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the human version guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for human version smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops human version wording.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for human version guidance.
- CHANGELOG and SESSION-LOG now record the Phase 115 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop human version smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Human version guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 114 — Top-level help release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the top-level help guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for top-level help smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops top-level help wording.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for top-level help guidance.
- CHANGELOG and SESSION-LOG now record the Phase 114 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop top-level help smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Top-level help guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 113 — Help topic release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the command-specific help topic guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for command-specific help topic smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops command-specific help topic wording.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for help topic output guidance.
- CHANGELOG and SESSION-LOG now record the Phase 113 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop command-specific help topic smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Command-specific help topic guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 112 — Alias smoke release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the command alias and functional alias guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for command alias help and functional alias smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops functional alias wording.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for alias smoke guidance.
- CHANGELOG and SESSION-LOG now record the Phase 112 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop command alias and functional alias smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Alias smoke guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 111 — Prompt and pack output-file release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the prompt/pack forced output-file confirmation guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for prompt/pack forced output-file confirmation guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops file-write confirmation wording.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for prompt/pack output-file confirmations.
- CHANGELOG and SESSION-LOG now record the Phase 111 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop prompt/pack output-file confirmation smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Prompt and pack output-file confirmation guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 110 — Suggestion and numeric range release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the unknown suggestion and numeric range failure guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for unknown route-id/option/value suggestion and numeric range failure smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops numeric range failure wording.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for suggestion/range failure guidance.
- CHANGELOG and SESSION-LOG now record the Phase 110 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop suggestion and numeric range failure smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Suggestion and numeric range failure smoke guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 109 — Show lines and route explain release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the explicit `show --lines` and `route --explain` guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for both `show --lines` and `route --explain` smoke guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the route explanation phrase.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for explicit `show --lines` / `route --explain` guidance.
- CHANGELOG and SESSION-LOG now record the Phase 109 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop explicit line-range and route explanation smoke guidance.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Explicit output smoke guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 108 — Corpus discovery release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the human/JSON corpus discovery guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for human/JSON corpus discovery guidance covering `search`, `show`, and `examples`.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the corpus discovery JSON phrase.
- English and Korean README release guidance now names human/JSON corpus discovery smoke coverage explicitly.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for corpus discovery JSON guidance.
- CHANGELOG and SESSION-LOG now record the Phase 108 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the corpus discovery JSON smoke contract.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Corpus discovery automation guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 107 — List JSON release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the list JSON catalog guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `list --json` or human/JSON list catalog guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the list JSON catalog phrase.
- English and Korean README release guidance now names human/JSON list catalog smoke coverage explicitly.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for release smoke guidance, including `list --json`.
- CHANGELOG and SESSION-LOG now record the Phase 107 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the list catalog JSON smoke contract.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- List catalog automation guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 106 — Release metadata phrase table self-test added (v4.13.0) ✓ shipped

Release metadata now self-tests the shared phrase guard table before validating release policy docs.

### Changed
- `tools/audit/release-metadata.py` now keeps expected release policy phrase labels in `RELEASE_POLICY_PHRASE_LABELS`.
- `release_policy_phrase_table_errors()` validates label order, label uniqueness, non-empty term groups, and non-empty string terms.
- `release-metadata.py --self-test` now includes fixtures for dropped phrase labels, duplicate labels, and invalid empty terms.
- CHANGELOG and SESSION-LOG now record the Phase 106 table-shape guard.

### Impact
- Future release smoke phrase coverage cannot silently drift because a table entry was removed, duplicated, or malformed.
- Existing CLI behavior, metadata output shape, policy-doc requirements, and release docs remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- The table-driven release phrase guard can keep scaling without depending on reviewer memory to notice schema drift.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 105 — Release metadata phrase guard table refactor (v4.13.0) ✓ shipped

Release metadata phrase validation now uses one table-driven guard list.

### Changed
- `tools/audit/release-metadata.py` now routes all release policy-doc smoke phrase checks through `RELEASE_POLICY_PHRASE_CHECKS`.
- `release_policy_phrase_doc_errors()` now produces the same structured phrase-drift errors that the individual helper functions previously produced.
- Existing self-test drift fixtures now validate the shared phrase-check path.
- CHANGELOG and SESSION-LOG now record the Phase 105 refactor.

### Impact
- Future release smoke phrase guards can be added with less code churn and less risk of forgetting the validation loop.
- Existing CLI behavior, metadata output shape, policy-doc requirements, and release docs remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release metadata can keep expanding smoke-contract coverage without accumulating phrase-specific helper boilerplate.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 104 — Help JSON release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the help JSON topic catalog guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `help --json` topic catalog guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the help JSON topic catalog phrase.
- English and Korean README release guidance now names the `design-ai help --json` topic catalog explicitly.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for release smoke guidance, including `help --json`.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the help JSON topic catalog smoke contract.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Help topic catalog guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 103 — Status JSON release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the status JSON install-state guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `status --json` or human+JSON status guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the status JSON install-state phrase.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for release smoke guidance, including `status --json`.
- CHANGELOG and SESSION-LOG now record the Phase 103 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the status JSON install-state smoke contract.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Install-state guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 102 — Doctor strict release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the doctor strict diagnostics guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `doctor --strict` guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the doctor strict smoke phrase.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for release smoke guidance, including `doctor --strict`.
- CHANGELOG and SESSION-LOG now record the Phase 102 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the doctor strict diagnostics smoke contract.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release diagnostics guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 101 — Audit strict-quiet release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the audit strict-quiet smoke guidance already covered by package and registry smoke checks.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `audit --strict --quiet` guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the audit strict-quiet smoke phrase.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for release smoke guidance, including `audit --strict --quiet`.
- CHANGELOG and SESSION-LOG now record the Phase 101 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the audit strict-quiet smoke contract.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release smoke guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 100 — Update dry-run release metadata guard added (v4.13.0) ✓ shipped

Release metadata now protects the update dry-run smoke guidance added in Phase 99.

### Changed
- `tools/audit/release-metadata.py` now checks release policy docs for `update --dry-run` guidance.
- `release-metadata.py --self-test` now has a drift fixture that fails when a release-facing policy doc drops the update dry-run lifecycle phrase.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage for lifecycle smoke guidance, including `update --dry-run`.
- CHANGELOG and SESSION-LOG now record the Phase 100 guard.

### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the update dry-run smoke contract.
- Existing CLI, package smoke, and registry smoke behavior remains unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Lifecycle smoke guidance now has an end-to-end drift guard from implementation, to packaged smoke, to release-facing docs.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 99 — Update command dry-run preview added (v4.13.0) ✓ shipped

`design-ai update --dry-run` now previews source update and reinstall actions without mutating the repo or Claude home.

### Changed
- `cli/commands/update.mjs` now accepts `--dry-run` for human preview output and `--dry-run --json` for machine-readable update plans.
- The dry-run JSON report includes stable `context`, `plan`, and `result` sections with git pull intent, install script readiness, exact command arrays, and `mutating: false`.
- `cli/lib/update-command.test.mjs` now covers dry-run parser behavior, JSON-only rejection, key order, command arrays, localized paths, and readiness flags.
- Help output, README, Distribution, and Release checklist docs now list `design-ai update [--dry-run] [--json]`.
- Package smoke and registry smoke now validate both human and JSON update dry-run output before install lifecycle checks.

### Impact
- Contributors can preview update effects before any git pull or install.sh work starts.
- Release automation can verify update readiness from a deterministic JSON plan.
- Existing mutating `design-ai update`, `upgrade`, `u`, and help behavior remain compatible.

### Verified
- All 8 audits pass.
- `node --test cli/lib/update-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --dry-run`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --dry-run --json`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --json`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `npm test`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run release:metadata`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Update lifecycle smoke can now assert non-mutating preview behavior before packaged or registry install checks proceed.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 98 — Update command option guard added (v4.13.0) ✓ shipped

`design-ai update` now rejects unsupported arguments before it can pull source changes or rerun install.sh.

### Changed
- `cli/commands/update.mjs` now has a dedicated parser for help flags, unknown options, and unexpected positional arguments.
- `cli/lib/update-command.test.mjs` covers help aliases, empty argument parsing, typo suggestions, and positional-argument rejection.
- Shared smoke assertions now include `design-ai update --hlep` so package and registry smoke tests verify the same fail-closed update contract.

### Impact
- Update command typos fail fast with `Did you mean \`--help\`?` instead of continuing into git/install work.
- Existing `design-ai update`, `upgrade`, `u`, and help output remain compatible.

### Verified
- All 8 audits pass.
- `node --test cli/lib/update-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --hlep`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm test`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Lifecycle CLI smoke coverage now catches update option typos before release packaging.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 97 — Install command JSON lifecycle output added (v4.13.0) ✓ shipped

`design-ai install` now emits machine-readable lifecycle output for package and registry smoke automation.

### Changed
- `cli/commands/install.mjs` now supports `--json` while keeping the existing human install output.
- The install JSON report includes source root, Claude home, symlink prefix, and installed skill/agent/command counts.
- `cli/lib/install-command.test.mjs` covers parser behavior, unknown-option suggestions, installed-count parsing, JSON key order, and readable localized paths.
- Package smoke and registry smoke now verify both human install output and JSON `install --json` lifecycle output.
- Release metadata now guards policy docs against dropping `install --json` lifecycle smoke guidance.

### Impact
- Release automation can validate install lifecycle completion without scraping human terminal output.
- Existing install, status, doctor, and uninstall flows remain unchanged.

### Verified
- All 8 audits pass.
- `node --test cli/lib/install-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `CLAUDE_HOME=<tmp>/claude DESIGN_AI_PREFIX=smoke-design- NO_COLOR=1 node cli/bin/design-ai.mjs install --json`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Install lifecycle smoke now has machine-readable entry and exit checks.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 96 — Uninstall command JSON lifecycle output added (v4.13.0) ✓ shipped

`design-ai uninstall` now emits machine-readable lifecycle output for package and registry smoke automation.

### Changed
- `cli/commands/uninstall.mjs` now supports `--json` while keeping the existing human uninstall output.
- The uninstall JSON report includes source root, Claude home, symlink prefix, and removed symlink count.
- `cli/lib/uninstall-command.test.mjs` covers parser behavior, unknown-option suggestions, removed-count parsing, JSON key order, and readable localized paths.
- Package smoke and registry smoke now verify both human uninstall output and JSON `uninstall --json` lifecycle output.
- Release metadata now guards policy docs against dropping `uninstall --json` lifecycle smoke guidance.

### Impact
- Release automation can validate uninstall lifecycle completion without scraping human terminal output.
- Existing install, status, doctor, and human uninstall flows remain unchanged.

### Verified
- All 8 audits pass.
- `node --test cli/lib/uninstall-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `CLAUDE_HOME=<tmp>/claude DESIGN_AI_PREFIX=smoke-design- NO_COLOR=1 node cli/bin/design-ai.mjs uninstall --json`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Install lifecycle smoke now has machine-readable entry and exit checks.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 95 — README release-smoke version JSON guidance guarded (v4.13.0) ✓ shipped

Release-facing README guidance now stays aligned with the `design-ai version --json` smoke contract.

### Changed
- `README.md` and `README.ko.md` now list the current machine-readable CLI surfaces for status, list, audit, and version commands.
- README release guidance now describes human/JSON version metadata, human/JSON audit output, and human+JSON status lifecycle smoke checks for package and registry verification.
- `tools/audit/release-metadata.py` now checks every release policy doc for `version --json` guidance in addition to the MkDocs warning-policy phrases.
- `release-metadata.py --self-test` now includes a fixture that fails when release-facing docs drop the version JSON smoke phrase.

### Impact
- Contributor-facing release docs cannot silently drift away from the current package/registry smoke coverage.
- Existing CLI behavior and smoke command execution remain unchanged.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

### What this enables
- Release docs and metadata checks now preserve the version JSON smoke contract through future README edits.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 94 — Version command JSON metadata output added (v4.13.0) ✓ shipped

`design-ai version` now emits a self-tested JSON metadata report for CLI/plugin version alignment.

### Changed
- `cli/commands/version.mjs` now supports `--json` while keeping the existing human version output.
- `cli/commands/version.mjs` now uses `parseVersionArgs()`, `collectVersionReport()`, and `formatVersionJson()` for machine-readable version metadata.
- `cli/lib/version-command.test.mjs` now checks argument parsing, unknown-option suggestions, top-level JSON key order, context key order, version key order, aligned/mismatched states, and readable localized paths.
- `tools/audit/smoke_assertions.py`, `tools/audit/package-smoke.py`, and `tools/audit/registry-smoke.py` now cover version JSON output for installed package and registry lifecycle paths.

### Impact
- Automation that uses `design-ai version --json` can verify CLI/plugin version alignment without parsing human terminal output.
- Existing human `design-ai version`, `design-ai --version`, and `design-ai -v` workflows remain unchanged.

### Verified
- All 8 audits pass.
- `node --test cli/lib/version-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `node cli/bin/design-ai.mjs version --json`
- `npm test`
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
- Version alignment becomes a stable automation-facing contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 93 — Audit command JSON repository gate output added (v4.13.0) ✓ shipped

`design-ai audit` now emits a self-tested JSON report for the shared eight-audit repository gate.

### Changed
- `tools/audit/run-all.py` now supports `--json` while keeping the existing human summary output.
- `tools/audit/run-all.py` now uses `build_json_report()` and `format_json_report()` for machine-readable audit results.
- `cli/commands/audit.mjs` now supports `--json` and keeps wrapper headers out of JSON mode.
- `cli/lib/audit-command.test.mjs` now checks argument parsing, runner argument forwarding, help output, and unknown-option suggestions.
- `tools/audit/smoke_assertions.py`, `tools/audit/package-smoke.py`, and `tools/audit/registry-smoke.py` now cover audit JSON output for the installed package and registry lifecycle paths.

### Impact
- Automation that uses `design-ai audit --strict --quiet --json` can verify the repository gate without parsing terminal text.
- Existing human `design-ai audit`, `design-ai a`, `--strict`, and `--quiet` workflows remain unchanged.

### Verified
- All 8 audits pass.
- `python3 tools/audit/run-all.py --self-test`
- `node --test cli/lib/audit-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `node cli/bin/design-ai.mjs audit --strict --quiet --json`
- `npm test`
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
- The final pre-push repository quality gate becomes a stable automation-facing contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 92 — Status command JSON install-state output added (v4.13.0) ✓ shipped

`design-ai status` now emits a self-tested JSON report for installed design-ai symlinks.

### Changed
- `cli/commands/status.mjs` now supports `--json` while keeping the existing human status output.
- `cli/commands/status.mjs` now uses `collectStatusReport()` and `formatStatusJson()` for machine-readable install-state output.
- `cli/lib/status-command.test.mjs` now checks argument parsing, unknown-option suggestions, top-level status key order, context key order, section key order, sorted symlink entry output, missing-section output, and readable localized paths.
- `tools/audit/smoke_assertions.py`, `tools/audit/package-smoke.py`, and `tools/audit/registry-smoke.py` now cover status JSON output after install and before uninstall.

### Impact
- Automation that uses `design-ai status --json` can verify installed skills, agents, and slash commands without parsing terminal text.
- Existing human `design-ai status`, `design-ai s`, and `VERBOSE=1` workflows remain unchanged.

### Verified
- All 8 audits pass.
- `node --test cli/lib/status-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `npm test`
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
- Install lifecycle state becomes a stable automation-facing contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 91 — List command JSON catalog output added (v4.13.0) ✓ shipped

`design-ai list` now emits a self-tested JSON catalog for shipped skills, slash commands, and agents.

### Changed
- `cli/commands/list.mjs` now supports `--json` for all catalog sections and filtered `skills`, `commands`, or `agents` sections.
- `cli/commands/list.mjs` now uses `buildListCatalog()` and `formatListJson()` for machine-readable manifest catalog output.
- `cli/lib/list-command.test.mjs` now checks argument parsing, top-level catalog key order, section key order, manifest item key order, filtered catalog output, and readable localized catalog text.
- `tools/audit/smoke_assertions.py`, `tools/audit/package-smoke.py`, and `tools/audit/registry-smoke.py` now cover list catalog JSON output for all catalog domains.

### Impact
- Automation that uses `design-ai list --json` can enumerate skills, slash commands, and agents without parsing human terminal output.
- Existing human `design-ai list` and `design-ai ls` output remains unchanged.

### Verified
- All 8 audits pass.
- `node --test cli/lib/list-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `npm test`
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
- Manifest catalog enumeration becomes a stable automation-facing contract.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 90 — Doctor command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai doctor` now self-tests its JSON output contract for install-health context, diagnostic checks, summary counts, and fix metadata.

### Changed
- `cli/lib/doctor.mjs` now uses `formatDoctorJson()` as the shared formatter for doctor diagnostics JSON output.
- `cli/commands/doctor.mjs` now sends `--json` output through that formatter.
- `cli/lib/doctor.test.mjs` now checks JSON round-trip behavior, top-level diagnostic key order, context/expected/check/summary/fix key order, and readable localized diagnostic text.

### Impact
- Automation that uses `design-ai doctor --json` can rely on stable install-health payload order.
- Localized diagnostic labels, details, actions, and fix reasons stay readable instead of being escaped in machine-readable diagnostics output.

### Verified
- All 8 audits pass.
- `node --test cli/lib/doctor.test.mjs`
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
- `design-ai doctor` keeps machine-readable install-health diagnostics refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

## Phase 89 — Help command JSON output formatter guard added (v4.13.0) ✓ shipped

`design-ai help` now self-tests its JSON output contract for top-level command discovery, topic entries, and alias maps.

### Changed
- `cli/commands/help.mjs` now uses `formatHelpJson()` as the shared formatter for help-topic catalog JSON output.
- `cli/commands/help.mjs` now sends `--json` output through that formatter.
- `cli/lib/help-command.test.mjs` now checks JSON round-trip behavior, top-level catalog key order, topic-entry key order, alias map order, and readable localized help text.

### Impact
- Automation that uses `design-ai help --json` can rely on stable `usage`, `topics`, and `aliases` payload order.
- Localized help text stays readable instead of being escaped in machine-readable help catalog output.

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
- `design-ai help` keeps machine-readable command discovery refactor-safe.

### What's still ahead (4.x — incremental only)
- Real-CI verification (push these workflows; observe green).
- External launch (held).
- Decide whether `refs/` source links should remain visible repo references or be normalized through generated reference pages.

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
