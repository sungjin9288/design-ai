# Changelog

User-facing release notes for design-ai. Versions follow semver.

## v4.13.0 — Close DRAFT spec debt, reach 90% coverage, and reconciliation auto-apply (2026-05)

22 DRAFT → 0 DRAFT. 22 v2-extracted scaffolds promoted to full polished specs (when-to-use / anatomy / API / states / tokens / a11y / edge cases / code example / don't / Korean considerations).
Coverage accounting now recognizes parent/alias specs, moving canonical component coverage from 161/199 (80.9%) to 177/199 (88.9%) without duplicating already-covered sub-component docs.
Three additional foundational specs (`button-base`, `css-baseline`, `config-provider`) moved canonical component coverage to 180/199 (90.5%); a later refs refresh added Ant Design `border-beam`, and the matching worked spec keeps current coverage at 181/200 (90.5%).
The cross-source conflict checker now supports summary-only drift triage and a local self-test for severity classification.
Korean maintenance docs now describe the same 8-audit gate and drift review workflow as the English contributor docs.
Push-readiness now has a local CI parity command and GitHub Actions cache paths are aligned with the actual VS Code extension lockfile.
The local CI parity gate now has a lightweight self-test wired into the release self-test chain.
Ant Design token swatches no longer create MkDocs hash-link noise, and the extractor now has a release self-test for that renderer.
Docs navigation links now target concrete tracked pages instead of directories, reducing MkDocs link noise before Real-CI.
MkDocs warning output now contains no non-`refs/` warnings in the local build.
The local CI parity gate now enforces that same MkDocs warning policy so new non-`refs/` docs warnings fail before push.
Successful local CI docs runs now summarize MkDocs warning policy instead of printing the full refs warning stream.
The GitHub Pages docs workflow now uses the same docs-only MkDocs warning-policy path as local CI.
Local CI now checks that the docs workflow keeps using that shared docs-only policy path.
Docs workflow policy checks now inspect parsed `run:` commands and `paths:` entries instead of relying on broad substring matches.
Docs deployment now re-runs when Korean top-level site entries change.
Local CI now also guards the docs workflow corpus directory path filters.
MkDocs refs-only warnings are now capped at the accepted 632-warning baseline.
Korean distribution guidance now describes the same MkDocs refs warning baseline cap as the English release docs.
Release metadata now checks that English and Korean distribution docs keep the MkDocs warning-policy baseline language.

### Phase 70 — Bilingual distribution policy metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now verifies that both `docs/DISTRIBUTION.md` and `docs/DISTRIBUTION.ko.md` retain the MkDocs warning-policy phrases for refs-only warnings and the accepted baseline.
- `npm run release:metadata:self-test` now covers a distribution warning-policy drift failure fixture.
- `docs/RELEASE-CHECKLIST.md` now describes the expanded release metadata check.

#### Impact
- Future release documentation edits cannot silently remove the bilingual refs warning baseline guidance before tagging.
- The Phase 69 Korean/English documentation sync is now executable release metadata policy instead of a manual convention.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release docs policy drift is caught by the same metadata gate maintainers already run before Real-CI.

### Phase 69 — Korean distribution warning policy guidance synced

#### Changed
- `docs/DISTRIBUTION.ko.md` now describes the Phase 68 MkDocs warning policy: non-`refs/` warnings are blocked, and refs-only warnings must stay within the accepted baseline cap.

#### Impact
- Korean release/publish guidance now matches the English distribution checklist before Real-CI verification.
- Maintainers using the Korean docs get the same warning-policy expectation when preparing `npm run ci:local`.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release guidance stays bilingual and consistent as the local CI docs policy continues to harden.

### Phase 68 — MkDocs refs warning baseline capped

#### Changed
- `tools/audit/local-ci.py` now caps accepted MkDocs `refs/` warning output at the current 632-warning baseline.
- The local CI self-test now covers refs-only warning count classification and a baseline-regression failure case.

#### Impact
- Future docs changes can still keep intentional upstream `refs/` source links, but they cannot silently increase the warning stream before Real-CI verification.
- Maintainers now get a specific failure message when new `refs/` links expand the accepted warning baseline without a documented policy decision.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- The remaining MkDocs warning policy is now bounded by count as well as by category, making Real-CI logs easier to compare against local parity.

### Phase 67 — Docs workflow corpus path invariant expanded

#### Changed
- `tools/audit/local-ci.py` now requires the docs workflow path filter to keep the corpus directory globs used by the MkDocs site: `knowledge/**`, `examples/**`, `skills/**`, `agents/**`, `commands/**`, and `docs/**`.

#### Impact
- Future edits to `.github/workflows/docs.yml` cannot silently drop the main corpus directories from the GitHub Pages deploy trigger.
- The docs workflow trigger invariant now covers both corpus directories and top-level symlinked site inputs.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Docs deployment trigger coverage now matches the MkDocs site inputs more completely before Real-CI verification.

### Phase 66 — Korean top-level docs trigger Pages deploy

#### Changed
- `.github/workflows/docs.yml` now includes `README.ko.md` and `AGENTS.ko.md` in its path filter.
- `tools/audit/local-ci.py` now requires every top-level file that `tools/build-docs.sh` symlinks into `site-src/` to remain present in the docs workflow path filter.

#### Impact
- Korean landing page and Korean agent entry point edits now trigger the GitHub Pages docs workflow.
- Future path-filter drift for top-level site inputs is caught by local CI before push.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Korean docs updates are no longer dependent on unrelated docs changes to reach the deployed site.

### Phase 65 — Docs workflow policy parser tightened

#### Changed
- `tools/audit/local-ci.py` now extracts one-line workflow `run:` commands and `paths:` entries before applying the docs workflow policy check.
- The docs workflow policy constants now track the expected command and required paths separately.

#### Impact
- The drift check is less brittle because it validates the workflow shape being guarded rather than searching for indentation-specific snippets across the full file.
- Future workflow edits should produce clearer failure messages for missing `--docs-only`, direct MkDocs command use, or missing helper path filters.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Docs workflow policy enforcement is easier to maintain without changing the 8-audit release gate.

### Phase 64 — Docs workflow policy drift check

#### Added
- Added a docs workflow policy check to `tools/audit/local-ci.py`.
- Added self-test fixtures for passing and failing docs workflow policy shapes.

#### Changed
- `npm run ci:local`, `python3 -B tools/audit/local-ci.py --docs-only`, and `npm run ci:local:self-test` now fail if `.github/workflows/docs.yml` stops using `local-ci.py --docs-only`, calls `mkdocs build --clean` directly, or omits the shared docs helper paths from its trigger filter.
- Release checklist documentation now notes that local CI verifies docs workflow policy alignment.

#### Impact
- The Phase 63 workflow alignment is now guarded against future drift.
- Maintainers can edit `docs.yml`, `tools/audit/local-ci.py`, or `tools/build-docs.sh` with a local check that catches mismatched docs deploy wiring before push.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Docs workflow policy alignment is no longer a one-time review; it is an executable local invariant.

### Phase 63 — Docs workflow uses local MkDocs policy

#### Added
- Added `python3 tools/audit/local-ci.py --docs-only` for docs deploy jobs that need only MkDocs build plus warning policy.

#### Changed
- `.github/workflows/docs.yml` now builds the site through `tools/audit/local-ci.py --docs-only` instead of calling `./tools/build-docs.sh` and `mkdocs build --clean` directly.
- The docs workflow trigger now includes `tools/audit/local-ci.py` and `tools/build-docs.sh` so docs deployment re-runs when the shared docs build path changes.
- README pre-push guidance now names the MkDocs non-`refs/` warning policy explicitly.

#### Impact
- Local pre-push docs verification and GitHub Pages deployment now use the same warning policy implementation.
- Real-CI docs deployment should fail on the same non-`refs/` MkDocs warning regressions that fail locally.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Push-readiness is tighter because the deploy workflow no longer has a separate, weaker docs build path.

### Phase 62 — Local CI MkDocs output summarized

#### Changed
- `tools/audit/local-ci.py` now captures successful MkDocs build output quietly and prints only the warning-policy summary.
- Failed subprocesses still print captured output so MkDocs or environment errors remain diagnosable.

#### Impact
- `npm run ci:local -- --skip-release-check --skip-vscode` no longer floods local and Real-CI parity logs with hundreds of accepted `refs/` warning lines.
- The docs verification signal is now easier to scan: successful runs end with the refs-only warning count, while non-`refs/` policy failures still show actionable samples.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `npm run release:self-test`
- `npm run ci:local -- --skip-release-check --skip-vscode`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Push-readiness logs stay compact enough to review quickly while preserving the warning policy added in Phase 61.

### Phase 61 — Local CI enforces MkDocs warning policy

#### Added
- Added MkDocs output capture and warning classification to `tools/audit/local-ci.py`.
- Added self-test coverage for refs-only warning output and mixed warning output.

#### Changed
- `npm run ci:local` now fails when `mkdocs build --clean` emits any non-`refs/` warning, while preserving the existing accepted upstream `refs/` source-link warnings.
- Release and distribution docs now describe the warning-policy check as part of pre-push Real-CI parity.

#### Impact
- The Phase 60 warning baseline is now executable guardrail, not only release documentation.
- Any new broken docs navigation, unresolved `.ko.md` page, or directory-style link warning should be caught locally before Real-CI.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `npm run release:self-test`
- `npm run ci:local -- --skip-release-check --skip-vscode`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Push-readiness improves because docs warning regressions now fail the same local parity command maintainers already run before Real-CI.

### Phase 60 — MkDocs warning stream narrowed to refs

#### Changed
- Converted stability-review command tool links and npm dogfood tool references into code paths because those files are repo-local tooling, not site pages.
- Moved Korean announcement draft links and Korean contributor reference links to GitHub URLs so MkDocs static i18n no longer treats `.ko.md` launch drafts as unresolved site pages.

#### Impact
- Local MkDocs `WARNING` output is now concentrated entirely in intentional `refs/` source-material links.
- Non-`refs/` MkDocs warnings are 0, which makes Real-CI docs logs significantly easier to scan.

#### Verified
- All 8 audits pass.
- `./tools/build-docs.sh`
- `python3 -m mkdocs build --clean`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- The remaining docs warning work can be treated as a deliberate policy choice for `refs/` source links instead of a mixed set of real navigation bugs and intentional repo references.

### Phase 59 — Documentation link hygiene before Real-CI

#### Changed
- Replaced directory-style links in README, AGENTS, skills, MCP/integration docs, and selected worked examples with concrete tracked markdown files or public docs URLs.
- Corrected worked-example relative links from `examples/` into `knowledge/`, `commands/`, `docs/`, and sibling component specs.
- Converted tool-only references that are outside the MkDocs docs tree into code literals where they are meant as repository paths rather than site links.

#### Impact
- MkDocs no longer reports root `index.md` / `index.ko.md` warnings for language toggles, top-level badges, `skills/`, `examples/`, or `LICENSE` links.
- Skill directory INFO noise is now 0 in the local MkDocs build.
- Remaining warnings are concentrated in intentionally repo-local `refs/`/tooling references and older announcement/i18n edge cases.

#### Verified
- All 8 audits pass.
- `./tools/build-docs.sh`
- `python3 -m mkdocs build --clean`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Real-CI docs logs are easier to scan because common navigation and skill catalog links no longer obscure the warning categories that still need deliberate handling.

### Phase 58 — MkDocs-safe Ant Design token swatches

#### Added
- Added `tools/extractors/ant_design_tokens.py --self-test` to validate seed parsing, preset parsing, MkDocs-safe swatch rendering, and decorative `aria-hidden` output.
- Added `npm run tokens:ant-design:self-test` and wired it into `npm run release:self-test`.

#### Changed
- Regenerated `knowledge/design-tokens/ant-design.md` so preset palette swatches render as inline decorative HTML instead of `![](#HEX)` image links.
- Updated the v4 MkDocs dogfood notes to remove the Ant Design hex-anchor warning from the accepted-warning list.

#### Impact
- MkDocs no longer reports false internal-anchor messages for Ant Design preset palette colors such as `#1677FF`.
- Future extractor changes are less likely to reintroduce hash-image swatch links because the release self-test now checks for that exact regression.

#### Verified
- All 8 audits pass.
- `python3 -B tools/extractors/ant_design_tokens.py --self-test`
- `python3 -B tools/extractors/ant_design_tokens.py`
- `./tools/build-docs.sh`
- `python3 -m mkdocs build --clean`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- The local docs build is quieter before Real-CI verification, making remaining warnings easier to triage because they are not mixed with generated color-swatch false positives.

### Phase 57 — Local CI parity self-test coverage

#### Added
- Added `tools/audit/local-ci.py --self-test` to validate Python compile file discovery, markdown line budget counting, warning threshold behavior, and hard-cap failure handling without running the expensive CI parity workflow.
- Added `npm run ci:local:self-test` and wired it into `npm run release:self-test`.

#### Changed
- `local-ci.py` now separates compile-file discovery, markdown line counting, and size-budget validation into reusable functions that can be tested without invoking npm, VS Code, or mkdocs.

#### Impact
- The release self-test chain now catches regressions in the local CI parity helper itself before a full `ci:local` run or external CI push.
- Maintainers can quickly validate the helper logic when editing workflow-only local checks.

#### Verified
- All 8 audits pass.
- `npm run ci:local:self-test`
- `npm run release:self-test`
- `npm run release:metadata`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Future changes to the local CI parity gate can be verified through the existing lightweight release self-test path instead of depending only on the full, slower `npm run ci:local`.

### Phase 56 — CI cache hardening and local parity gate

#### Added
- Added `npm run ci:local`, backed by `tools/audit/local-ci.py`, to run the local equivalent of non-publishing GitHub CI before a branch is pushed.
- The local parity gate wraps `release:check`, then adds Python `py_compile`, knowledge/docs/examples size budget, VS Code extension `npm ci` + compile + unit tests, and `mkdocs build --clean`.
- Release and distribution docs now explain when to use `ci:local` versus the narrower `release:check`.

#### Changed
- `.github/workflows/audit.yml` now points npm cache lookup at `vscode-extension/package-lock.json` instead of relying on a nonexistent root lockfile.
- VS Code workflow dependency installs now use `npm ci` so CI consumes the committed lockfile exactly.

#### Impact
- Real-CI verification is less likely to fail before tests start because setup-node can resolve a concrete cache dependency path.
- Maintainers can reproduce workflow-only checks locally without waiting for a pushed branch.

#### Verified
- All 8 audits pass.
- `npm run ci:local`
- `npm run release:metadata`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- The remaining Real-CI step becomes an external confirmation of already-exercised local surfaces instead of the first place cache, docs, or VS Code compile issues appear.

### Phase 55 — Upstream refs refresh and BorderBeam coverage

#### Added
- Refreshed local `refs/` sources and regenerated generated knowledge artifacts with `extracted_at: 2026-05-19`.
- Added `examples/component-border-beam.md` for Ant Design `BorderBeam`, covering host DOM constraints, `aria-hidden` decorative behavior, focus-ring boundaries, reduced-motion handling, gradient stops, and Korean sensitive-data usage limits.
- Added `BorderBeam` to `examples/README.md` and regenerated `knowledge/COVERAGE.md`.

#### Changed
- `knowledge/components/INDEX.md` now indexes 200 canonical components after Ant Design added `border-beam`.
- `knowledge/patterns/brand-references.md` now indexes 71 brands after the upstream brand corpus added Slack.
- `tools/clone-refs.sh` now passes `--skip-checks` to sparse-checkout so `nerd-fonts` file paths such as `glyphnames.json` do not break refs refresh.
- Generated extractor outputs now preserve `version`, `last_updated`, and `stability` frontmatter instead of dropping the v3.11 metadata contract on regeneration.
- `ui_ux_pro_max.py` preserves the local Korean B2B SaaS sensitive-data palette overlay across upstream CSV refreshes.

#### Impact
- Component spec coverage remains above the release threshold at 181/200 (90.5%) instead of dropping when the canonical index expands.
- Quarterly drift review has a fresh baseline: 33 components analyzed, 408 total conflicts, 1 CRITICAL, 2 HIGH, 8 MEDIUM, 397 LOW, 0 INFO.
- Future refs refreshes are less likely to regress knowledge metadata or local Korean-market additions.

#### Verified
- All 8 audits pass.
- `bash tools/clone-refs.sh`
- `bash tools/extractors/run-all.sh`
- `python3 -B tools/extractors/component_spec_conflict_check.py --self-test`
- `python3 -B tools/extractors/component_spec_conflict_check.py --multi-source --summary-only`
- `python3 -B tools/audit/check-coverage.py`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- The corpus can absorb upstream component-index growth without slipping below 90% worked-spec coverage.
- The refs refresh workflow is now repeatable on current Git sparse-checkout behavior.

### Phase 54 — Korean maintenance docs audit-count sync

#### Added
- `docs/CONTRIBUTING.ko.md` now lists all 8 active audits and points contributors to `npm run audit:strict`.
- Korean contributor docs now include the summary-first cross-source API reconciliation flow using `component_spec_conflict_check.py --summary-only`.
- `docs/ARCHITECTURE.ko.md`, `docs/DISTRIBUTION.ko.md`, `docs/QUICKSTART.ko.md`, `README.md`, and `docs/SESSION-LOG.md` no longer use stale 6/7-audit wording for current maintenance guidance.

#### Impact
- Korean contributors now see raw hex hygiene and example QA as part of the current required gate.
- Distribution docs align with `npm run release:check`, which already runs all 8 audits.

#### Verified
- Full 8-audit suite, CLI tests, package checks, and release metadata checks validate the docs after the sync.

### Phase 53 — Upstream drift review ergonomics

#### Added
- `component_spec_conflict_check.py --summary-only` prints only aggregate severity counts for the quarterly upstream review first pass.
- `component_spec_conflict_check.py --self-test` validates CRITICAL / HIGH / MEDIUM / LOW classification and summary rendering without parsing local refs.
- `docs/CONTRIBUTING.md` now documents the summary-first drift review flow before capturing the full conflict report.

#### Impact
- Current multi-source drift baseline is explicit: 33 components analyzed, 413 total conflicts, 1 CRITICAL, 2 HIGH, 7 MEDIUM, 403 LOW, 0 INFO.
- Maintainers can spot new HIGH/CRITICAL drift after a refs refresh without reading hundreds of LOW library-specific differences first.

#### Verified
- Conflict-check self-test passes.
- `--multi-source --summary-only` produces the current aggregate baseline.

### Phase 52 — Coverage 90% utility specs

#### Added
- `component-button-base.md` documents the low-level interactive primitive used to build design-system controls, including semantic root rules, focus-visible handling, ripple boundaries, disabled behavior, and polymorphic link/button risks.
- `component-css-baseline.md` documents root reset ownership, body typography, color-scheme integration, print behavior, SSR ordering, and microfrontend boundaries.
- `component-config-provider.md` documents app-level theme, locale, direction, component defaults, portal containers, CSP, static APIs, and Korean product shell concerns.
- `examples/README.md` now lists the three new specs in the component catalog.

#### Impact
- Component spec coverage: 177/199 (88.9%) → 180/199 (90.5%).
- The remaining canonical gap is now mostly low-level internals, registry metadata, and utility types rather than common product-facing primitives.

#### Verified
- `check-coverage.py` regenerated `knowledge/COVERAGE.md` with the 90.5% coverage result.
- Full audit/test/release metadata suite validates the corpus at close-out.

### Phase 51 — Coverage alias accounting

#### Added
- `check-coverage.py` now has an explicit `COVERAGE_ALIASES` map for canonical components that are already covered by parent specs or established aliases.
- `knowledge/COVERAGE.md` separates direct canonical spec matches from parent/alias coverage so the metric stays auditable instead of silently inflating.

#### Parent/alias coverage recognized (16)
- **Navigation / actions**: `bottom-navigation-action` → `bottom-navigation`, `card-action-area` → `card`, `speed-dial-icon` → `speed-dial`.
- **Layout / media**: `row` and `col` → `grid`, `image-list-item` and `image-list-item-bar` → `image-list`.
- **Forms / lists**: `input-label` and `input-group` → `input`, `native-select` → `select`, `list-item-secondary-action` → `list-item`.
- **Data / controls**: `pagination-item` → `pagination`, `table-pagination-actions` → `table-pagination`, `toggle-group` → `toggle`.
- **Aliases / primitives**: `qrcode` → `qr-code`, `svg-icon` → `icon`.

#### Impact
- Component spec coverage: 161/199 (80.9%) → 177/199 (88.9%).
- Remaining gap is now mostly true utility/provider primitives (`theme`, `locale`, `css-baseline`, `no-ssr`, `utils`, etc.) rather than already-documented sub-components.

#### Verified
- `check-coverage.py --self-test` covers timestamp preservation with the expanded coverage payload.
- Full audit suite validates the regenerated coverage report.

### Phase 50 — DRAFT polish round 2

#### Polished (22)
- **Input family** (3): `input-base` (39 props — full surface), `filled-input`, `input-adornment`.
- **Table family** (7): `table-cell` (10 props — alignment conventions, KR amount handling), `table-body` (empty/loading state patterns), `table-head` (sticky header, scope), `table-pagination` (KR-localized labels), `table-container`, `table-footer` (totals row patterns), `table-sort-label`.
- **Step family** (3): `step-icon` (state visuals), `step-label` (KR honorific), `step-content` (vertical-orientation flows).
- **Misc** (2): `snackbar-content`, `alert-title`.
- **Final thin sub-components** (7): `accordion-actions`, `accordion-details`, `accordion-summary`, `avatar-group`, `step-button`, `step-connector`, `tab-scroll-button`.

#### Final DRAFT closure (7)
- **Accordion subs** (3): `accordion-actions`, `accordion-details`, `accordion-summary` now document scoped action rows, disclosed body regions, and summary button semantics against the parent Disclosure / Accordion contract.
- **Thin sub-components** (4): `avatar-group`, `step-button`, `step-connector`, `tab-scroll-button` now document their minimal API surfaces, derived parent state, accessibility boundaries, edge cases, and token usage.

### Cross-ref corrections
- 3 step specs referenced `component-stepper.md` (doesn't exist; canonical is `component-steps.md`). Fixed.

### Reconciliation automation
- `component_spec_reconcile.py --apply-high` can now update existing API table rows for HIGH-confidence proposals only.
- `--dry-run` previews changes, while `--multi-source --apply-high` requires `--force` before writing across many specs.
- The auto-apply path preserves narrative content, skips missing prop rows, and keeps MEDIUM/MANUAL proposals review-only.

### Example token hygiene
- `raw-hex-check.py` now fails non-allowlisted `examples/` raw hex colors so component specs prefer semantic token aliases.
- Existing palette, brand, email, chart, QR, color-picker, slide, and dogfood fixtures are explicitly allowlisted because they intentionally teach primitive color values or literal brand colors.

### Verified
- All 8 audits pass (with strengthened link-check from v4.8 catching the stepper→steps fix, plus raw hex hygiene for examples).
- Reconciliation auto-apply self-test covers polished and scaffolded API table formats.
- Raw hex audit self-test covers token violations, allowlisted fixtures, line-level exceptions, CSS anchors, and order-number false positives.
- 22 new fully-polished specs follow established sub-component spec template.
- Korean conventions threaded through all polished specs (KR text density, 합쇼체 vs 해요체 usage, KR-localized label formatters for TablePagination).

### Polish-debt inventory (post v4.13)

| Family | Polished | Open debt | % |
| --- | --- | --- | --- |
| Form (FormControl + 5 subs) | 6/6 | 0 | 100% |
| List (ListItem + 5 subs) | 6/6 | 0 | 100% |
| Dialog (parent + 4 children) | 5/5 | 0 | 100% |
| Card (parent + 4 subs) | 5/5 | 0 | 100% |
| Menu (parent + Item + List) | 3/3 | 0 | 100% |
| Tabs (Tab + Tabs + ScrollButton) | 3/3 | 0 | 100% |
| Tables (8 subs) | 7/8 | parent `component-table.md` absent; no DRAFT banner | 88% |
| Steps (Step + Stepper subs) | 7/7 | 0 | 100% |
| Inputs (Outlined + Filled + Base + Adornment + Number) | 5/5 | 0 | 100% |
| Transitions (Fade + Grow + Slide + Zoom) | 2/4 polished, 4/4 covered | no public DRAFT debt | covered |
| Accordion (parent + 3 subs) | 4/4 | 0 | 100% |

9 families now fully polished (Form, List, Dialog, Card, Menu, Inputs, Tabs, Steps, Accordion).

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.12.0 → 4.13.0.

### What this enables
- Release candidates can focus on distribution confidence instead of unresolved DRAFT-spec uncertainty.
- HIGH-confidence upstream reconciliation can be applied mechanically without rewriting component narratives.
- Component spec consumers no longer need to distinguish polished specs from v2 scaffold placeholders in `examples/`.

## v4.12.0 — Extractor v3 reconciliation mode (2026-05)

v3 detected drift; v3.1 proposes resolution. Pairs with `component_spec_conflict_check.py` to give maintainers a structured upstream-review workflow.

### Phase 49 — Reconciliation mode

#### Added
- **`tools/extractors/component_spec_reconcile.py`** — proposes unified API per component. Same TS-AST parser + source finder as v3 conflict checker, but the output is a *recommendation*, not just a *report*.

#### Per-prop reconciliation

For each cross-source prop, the proposal covers 3 axes:

| Axis | Strategy |
| --- | --- |
| **Type** | Pick most-specific compatible (e.g., `boolean` over `unknown`). Truly incompatible → MANUAL. |
| **Default** | Majority across sources; tie/split → MANUAL. |
| **Deprecation** | If any source deprecates: lean toward deprecated; emit migration note covering both states. |

Confidence rolls up as the worst of the 3 axes:
- **HIGH** — all sources agree; safe to auto-adopt.
- **MEDIUM** — compatible refinements / library-specific props (review before adopt).
- **LOW** — minority signals (rarely produced).
- **MANUAL** — incompatible types or no-majority default; human design call required.

#### First-pass results across 33 multi-source canonicals

```
Total proposals: 415
  HIGH:    3   (all sources fully aligned — safe auto-adopt)
  MEDIUM: 411  (mostly library-specific props or compatible refinements)
  MANUAL:  1   (Switch.value: Ant boolean vs MUI unknown — needs design call)
```

The 1 MANUAL is exactly the v3 conflict scan's CRITICAL — the tool routes consistent issues consistently.

#### Migration notes

For deprecation drift, the tool emits structured notes:

```
- `closeText`: Lean toward deprecated (Ant/MUI deprecate signals API maturity).
  Note in spec: 'deprecated in [ant-design]; still supported in [mui] for compatibility.'
```

For library-specific props:

```
- `autoInsertSpace`: This prop is unique to ant-design. Adopt only if your
  design system needs the same capability; otherwise document as a known omission.
```

#### `docs/CONTRIBUTING.md` — quarterly upstream review workflow

New section documents the 6-step ritual:
1. Pull latest `refs/`.
2. Run conflict-check; capture report.
3. For HIGH/CRITICAL, run reconcile per component.
4. Review MANUAL items first (design calls).
5. Apply changes; bump `last_updated`.
6. Document in CHANGELOG.

#### Usage

```bash
# Single component reconciliation
python3 tools/extractors/component_spec_reconcile.py --name button

# Bulk review session (every multi-source canonical)
python3 tools/extractors/component_spec_reconcile.py --multi-source

# JSON output for tooling integration
python3 tools/extractors/component_spec_reconcile.py --name button --json
```

### Verified
- Tool runs end-to-end on 33 components without errors.
- Switch.value correctly identified as MANUAL (boolean vs unknown).
- Alert.closeText / Alert.onClose correctly identified with deprecation drift + migration note.
- Library-specific props (Ant `autoInsertSpace`, MUI `slots`) correctly classified as MEDIUM with adoption guidance.
- All 6 audits pass.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.11.0 → 4.12.0.

## v4.11.0 — CI wiring (2026-05)

The infrastructure built across v4.3–v4.10 (unit tests, audit runner, e2e tests, conflict checker) wasn't actually being used by CI. v4.11 wires it all in. Every PR now exercises the full validation surface.

### Phase 48 — CI workflow modernization

#### Changed
- **`.github/workflows/audit.yml`** — restructured from 1 job (running 5 separate audit steps) to **4 jobs**:
  - `audit` — uses `tools/audit/run-all.py` instead of 5 separate steps. PR mode warns; push to main is `--strict`. Includes Python lint (now covers `tools/migrations/` too) + size budget (raised 100K → 150K warn, 150K → 200K cap to match v4.x growth).
  - `unit-tests` — **NEW**. Installs deps, runs CLI unit tests (16) + VS Code lib unit tests (25). Total 41 tests on every PR.
  - `vscode-e2e` — **NEW**. Real-VS-Code-instance tests under `xvfb-run`. Cached VS Code download (~300MB). Gated to push-to-main OR PR with `test:e2e` label (so casual PRs don't pay the cost).
  - `conflict-check` — **NEW**. Cross-source API drift surfacing. Push-to-main only. `continue-on-error: true` — informational, doesn't fail CI. Gracefully skips when `refs/` not populated (expected in fork CI).
- **`.github/workflows/publish.yml`** — replaced 4 separate audit steps with `run-all.py --strict`. Added CLI unit tests step (catches regressions before npm publish).

#### What this enables
- **Real PR gating** — every PR runs all 6 audits + 41 unit tests on every push.
- **API drift surfacing** — main-branch CI flags conflict report; reviewers see drift between Ant / MUI / shadcn at PR-merge time.
- **e2e regression coverage** — tag-pinned releases run the real VS Code instance under xvfb.
- **Faster CI** — `run-all.py` is ~0.8s for all 6 audits vs ~5s for 5 separate `python3 ...` invocations (process startup amortization).
- **Pre-publish safety net** — `publish.yml` now runs unit tests before npm publish. A failing test halts the release.

#### CI matrix (after v4.11)

| Trigger | Runs |
| --- | --- |
| PR (any path) | `audit` + `unit-tests` |
| PR with `test:e2e` label | + `vscode-e2e` |
| Push to `main` | `audit` (--strict) + `unit-tests` + `vscode-e2e` + `conflict-check` |
| Tag `v*` | `publish.yml`: audit (--strict) + unit-tests + npm pack + npm publish |
| Push to `main` (docs/) | `docs.yml`: mkdocs build + deploy |

### Verified
- All 6 audits pass via unified runner.
- All 4 YAML workflows parse correctly.
- All workflow commands execute locally:
  - `python3 tools/audit/run-all.py [--strict]` ✓
  - `npm test` (16 CLI tests) ✓
  - `npm run test:unit` in vscode-extension (25 tests) ✓
  - Python lint across all 4 tool dirs ✓
- Size budget: 82,455 lines (well under 150K warn / 200K cap).

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.10.0 → 4.11.0.

## v4.10.0 — VS Code e2e infra + extractor v3 + SESSION-LOG update (2026-05)

Three phases combined: real-VS-Code integration test infrastructure (Phase 45) + cross-source API conflict detection (Phase 47) + comprehensive SESSION-LOG update through v4.10 (Phase 46).

### Phase 45 — VS Code `@vscode/test-electron` integration tests

Phase 40 stopped at unit-testable pure logic. Phase 45 adds the missing layer: tests that run inside a real VS Code instance.

#### Added
- **`vscode-extension/test/integration/runTest.ts`** — boots a headless VS Code via `@vscode/test-electron`, loads the extension under development, runs the suite. Uses dedicated user-data dir so test runs don't pollute the developer's profile.
- **`vscode-extension/test/integration/suite/index.ts`** — Mocha 10 suite loader (TDD UI, 30s timeout for cold-cache activation).
- **`vscode-extension/test/integration/suite/extension.test.ts`** — 8 integration tests:
  - Extension activates without errors.
  - All 10 declared commands are registered.
  - `design-ai.path` and `design-ai.language` settings are readable.
  - `openSettings` / `status` / `refreshTree` commands resolve cleanly.
  - Activity-bar view container is registered.
- **`vscode-extension/test/integration/tsconfig.json`** — separate tsconfig (mocha + node + vscode types, CommonJS output).
- **`vscode-extension/test/README.md`** — docs the unit + e2e test tiers, CI matrix recommendation.

#### Changed
- **`vscode-extension/package.json`** — added `@vscode/test-electron`, `mocha`, `@types/mocha` devDeps. New scripts: `test:unit`, `test:e2e`, `test`.
- **`vscode-extension/.gitignore`** — exclude `test/integration/out/`, `.vscode-test-user-data/`.
- **`vscode-extension/.vscodeignore`** — exclude `test/**`, `.vscode-test-user-data`.
- **`vscode-extension/package.json`** — version 0.3.0 → 0.4.0.

#### Status
- TypeScript compiles cleanly (`tsc -p ./test/integration` → zero errors).
- 25 unit tests still pass alongside e2e infrastructure.
- Running `test:e2e` requires VS Code download (~300MB; cached after first run). Not exercised in this session — local dogfood only.

### Phase 46 — SESSION-LOG comprehensive update

`docs/SESSION-LOG.md` was last updated at v3.12. v4 phases (32-47) added but the narrative was missing.

#### Changed
- **`docs/SESSION-LOG.md`**:
  - At-a-glance table now 3 columns (v2.0 / v3.12 / v4.10) with new rows for unit tests, e2e infra, dogfood findings.
  - Phase log extended through v4.10 (v4.0 → v4.10 phases added).
  - Patterns section restructured: separated "didn't work" patterns + added 2 new v4-discovered patterns:
    - **"Dogfood drives next-pass quality"** — Phases 39-42 found more bugs than the previous 30 phases combined.
    - **"Honest DRAFT banners > false completeness"** — v4.5/v4.7/v4.9 left ~24 specs intentionally banner-marked.
  - Added "It's audited so it's correct" anti-pattern (link-check false-negative across hundreds of commits).
  - "What's next" reframed for v4.10+ trajectory.

### Phase 47 — Component spec extractor v3 (conflict detection)

v2 extracted props from one source at a time. v3 compares the SAME canonical component across Ant + MUI + shadcn and surfaces drift.

#### Added
- **`tools/extractors/component_spec_conflict_check.py`** — cross-source conflict detection. Reuses v2's TS-AST parser. Output: severity-categorized conflict report.

#### Severity model
| Level | Meaning | Example |
| --- | --- | --- |
| **CRITICAL** | Same prop, incompatible types | `value: boolean` (Ant) vs `value: unknown` (MUI) |
| **HIGH** | Deprecation drift | Prop deprecated in one source, active in another |
| **MEDIUM** | Same prop, different types but compatible / default-value drift | `component: C` (Ant) vs `component: React.ElementType` (MUI) |
| **LOW** | Prop exists in one source only | `autoInsertSpace` Ant-only (Korean spacing) |
| **INFO** | Naming convention difference | (filtered out — none currently) |

#### Smart filtering
- Strips `T | undefined` and `T | null` from type comparison (optionality is captured separately by `optional` flag).
- Skips standard HTML/React props (`children`, `className`, `style`, `id`, `tabIndex`, ARIA attrs, Ant's `prefixCls` / `rootClassName`) from "missing in source X" reports — they spread implicitly via element passthrough.

#### First-pass scan results

```bash
python3 tools/extractors/component_spec_conflict_check.py --multi-source
```

Output across 33 multi-source canonicals:
- **1 CRITICAL** — Switch's `value: boolean` (Ant) vs `value: unknown` (MUI) — design intent diverges.
- **2 HIGH** — `closeText` deprecated in Ant Alert but active in MUI Alert; same pattern in another component.
- **7 MEDIUM** — type/default drift on `component`, `disabled`, `open`, `indeterminate` (mostly compatible refinements).
- **403 LOW** — props existing only in one source. The bulk are Ant-specific Korean conventions (`autoInsertSpace`), MUI's `slots` API, MUI's polymorphic `component`, etc. Adopters switching sources lose these.

#### Usage

```bash
# Single component
python3 tools/extractors/component_spec_conflict_check.py --name button

# All multi-source canonicals
python3 tools/extractors/component_spec_conflict_check.py --multi-source

# JSON output for tooling
python3 tools/extractors/component_spec_conflict_check.py --name button --json

# CI gating: exit 1 on HIGH/CRITICAL
python3 tools/extractors/component_spec_conflict_check.py --multi-source --strict
```

### Verified
- All 6 audits pass.
- 25 VS Code unit tests + 16 CLI unit tests pass.
- VS Code .vsix builds cleanly (19.74 KB).
- Conflict check run end-to-end on 33 components without errors.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.9.0 → 4.10.0.
- `vscode-extension/package.json`: 0.3.0 → 0.4.0.

### What this enables
- **VS Code real-instance regression coverage** — future extension changes can run e2e tests in CI before shipping a new .vsix.
- **API drift visibility** — `--multi-source --strict` can gate PRs that introduce new conflicts.
- **Adopter-switching guidance** — the LOW conflict report tells adopters "if you switch from Ant to MUI, you lose `autoInsertSpace` (Korean spacing)".
- **Documented narrative** — anyone reading SESSION-LOG.md can understand v2 → v4.10 trajectory in one sit.

## v4.9.0 — Polish + coverage 80.9% (2026-05)

Two phases combined: polished v4.5/v4.7 DRAFT specs (Phase 43) + coverage push 68.8% → 80.9% (Phase 44). The corpus now has 80%+ canonical coverage with full polish on 26 of the new specs.

### Phase 43 — Polished 18 of 21 DRAFT specs (full real specs)
- **Dialog family parent**: `component-dialog.md` (15 props, full anatomy / a11y / Korean honorific guidance / focus-trap docs).
- **Stack** layout primitive: full responsive examples + KR text density notes.
- **List family** (5 sub-components polished): `list-item-button`, `list-item-text`, `list-item-icon`, `list-item-avatar`, `list-subheader`.
- **Form family** (4 sub-components polished): `form-control-label`, `form-group`, `form-helper-text`, `form-label`.
- **Card family** (2 sub-components polished): `card-header`, `card-media`.
- **Misc**: `dialog-content-text`, `menu-list`, `toggle-button`, `mobile-stepper`, `input-number`.
- **Intentionally left as DRAFT (3)**: `accordion-actions`, `accordion-details`, `accordion-summary` — rarely used standalone; banner stays so adopters know API table is accurate but narrative is placeholder.

### Phase 44 — Coverage 137 → 161 (68.8% → 80.9%)

Added 24 specs (5 polished, 19 v2-extracted DRAFTs):

**Polished** (full narrative): `fade`, `grow`, `tab`, `outlined-input`, `table-row`.

**v2 DRAFTs** (accurate API table + placeholder narrative):
- Transitions: `fade`, `grow` (above polished)
- Inputs: `outlined-input`, `filled-input`, `input-base` (39 props), `input-adornment`
- Tables: `table-row`, `table-body`, `table-head`, `table-cell` (10 props), `table-container`, `table-footer`, `table-pagination`, `table-sort-label`
- Steps: `step-button`, `step-connector`, `step-content`, `step-icon`, `step-label`
- Misc: `alert-title`, `avatar-group`, `tab` (above polished), `tab-scroll-button`, `snackbar-content`

### Changed
- Cross-references in 4 newly-polished specs corrected (e.g., `knowledge/motion/easings-and-durations.md` → `knowledge/motion/principles.md`; `component-text-field.md` → `component-amount-input.md`).
- Versions: 4.8.0 → 4.9.0.

### Verified
- All 6 audits pass.
- Coverage: 137 → 161 of 199 (68.8% → 80.9%).
- 26 new fully-polished specs added across Phases 43+44.
- 3 accordion sub-component drafts retain honest DRAFT banner.

### Coverage by family (post v4.9)

| Family | v4.7 | v4.9 | Status |
| --- | --- | --- | --- |
| Form (FormControl + 5 sub-roles) | complete | complete | ✓ all polished |
| List (ListItem + 5 sub-roles) | complete | complete | ✓ all polished |
| Dialog (parent + 4 children) | partial | complete | ✓ all polished (parent added v4.8 dogfood) |
| Card (Content + Actions + Header + Media) | complete | complete | ✓ all polished |
| Tabs (Tab + Tabs + ScrollButton) | partial | complete | ✓ Tab polished |
| Tables (Row + Cell + Body + Head + Container + Footer + Pagination + SortLabel) | partial | complete | ⚠ Row polished; rest DRAFT |
| Steps (Button + Connector + Content + Icon + Label + Step + Stepper) | partial | complete | ⚠ all DRAFT (low priority — already covered via Step parent) |
| Inputs (OutlinedInput + FilledInput + InputBase + InputAdornment + Input + TextField...) | partial | complete | ⚠ OutlinedInput polished; rest DRAFT |
| Transitions (Fade + Grow + Slide + Zoom) | partial | complete | ⚠ Fade + Grow polished; rest DRAFT |

### What this enables
- **80% coverage milestone crossed** — covers virtually every flagship MUI primitive an adopter will reach for.
- **Family-completion verified** — all major families (Form, List, Dialog, Card, Tabs, Tables, Steps, Inputs, Transitions) have parent + children covered.
- **Polish-debt visible** — DRAFT banners signal which specs need narrative (~24 remaining v4.5+v4.7+v4.9 drafts; will land incrementally).

### What's still ahead
- Phase 45: `@vscode/test-electron` integration tests (real VS Code instance).
- Phase 46: SESSION-LOG v4 update (narrative through v4.9).
- Phase 47: Component spec extractor v3 (cross-source conflict detection).
- Polish remaining ~24 drafts (incremental).
- Coverage 80.9% → 90%+ (mostly utility types and edge primitives — diminishing value).

## v4.8.0 — Three-surface dogfood (VS Code + npm + mkdocs) (2026-05)

Three more surfaces dogfooded end-to-end. Each surfaced real bugs that were fixed in this release. The audit infrastructure itself caught a false-negative bug (link-check regex skipping links with backtick-wrapped text).

### Phase 40 — VS Code extension dogfood

**Findings**: [`docs/DOGFOOD-V4-VSCODE-FINDINGS.md`](docs/DOGFOOD-V4-VSCODE-FINDINGS.md).

#### Added
- **`vscode-extension/src/lib.ts`** — pure-logic helpers (`searchCorpus`, `pairWalkthroughs`, `chooseWalkthrough`, `readManifest`, `pickReadme`, `walkMd`, `globToRegex`, `splitGlob`). Extracted so they're testable without a VS Code instance. 230 LOC.
- **`vscode-extension/test/lib.test.mjs`** — 25 unit tests against compiled `out/lib.js`. Real corpus assertions (e.g., `searchCorpus("Pretendard")` should find 5+ hits and each preview should contain "pretendard").
- **`vscode-extension/media/icon.png`** — 128×128 placeholder PNG (PIL-generated). Required by `vsce package`; designer should replace pre-marketplace.

#### Changed
- **`vscode-extension/src/commands.ts`** — refactored to import from `lib.ts`. 423 → 310 LOC.
- **`vscode-extension/src/lib.ts`** — `searchCorpus` preview now centers on the match (was: line start + 120 char slice — would lose the matched word if it appeared past column 120). Real adopter-facing improvement; surfaced by the `searchCorpus("Pretendard")` test.
- **`vscode-extension/.vscodeignore`** — exclude `test/`, `*.vsix`. .vsix size 21.96 KB → 19.65 KB.
- **`vscode-extension/package.json`** — version 0.2.0 → 0.3.0.

#### Verified
- 25/25 unit tests pass against the shipped JS.
- `tsc --noEmit` zero errors.
- `vsce package` produces clean 19.65 KB .vsix (13 files).
- Command-manifest ↔ implementation parity: 10/10 commands match.

### Phase 41 — npm fresh install dogfood

**Findings**: [`docs/DOGFOOD-V4-NPM-FINDINGS.md`](docs/DOGFOOD-V4-NPM-FINDINGS.md).

#### Procedure
- `npm pack` → 1.1 MB tarball, 436 files.
- Install into `mktemp -d` fresh dir.
- Run full lifecycle: `version` / `help` / `list skills` / `list commands` / `install` (against fake `CLAUDE_HOME`) / `status` / `uninstall`.
- Verify symlinks created (39 total: 19 skills + 4 agents + 16 commands) + cleaned up.
- Verify `design-ai` PATH bin works.

#### Changed
- **`package.json` `files` allowlist** — added `tools/migrations/`. Previously the `/stability-review` slash command (v4.6) instructed adopters to run `tools/migrations/promote-stability.py` and `bump-last-updated.py` — but those weren't in the npm package. Adopters who installed via npm couldn't run the documented ritual. Fixed.

#### Verified
- 19 skills + 4 agents + 16 commands enumerate from manifest.
- Symlink farm against fake `CLAUDE_HOME` works correctly.
- Sub-second install + uninstall.
- Korean characters in `list` output render correctly.
- No stowaways in tarball (`refs/`, `node_modules`, `.git/` all absent).

### Phase 42 — mkdocs site build dogfood

**Findings**: [`docs/DOGFOOD-V4-MKDOCS-FINDINGS.md`](docs/DOGFOOD-V4-MKDOCS-FINDINGS.md).

#### Procedure
- `pip install -r docs/requirements.txt`.
- `./tools/build-docs.sh` (symlink farm).
- `mkdocs build --clean`.
- Verify Korean pages built at `/ko/...`.

#### Bugs surfaced — fixed
- **`tools/audit/link-check.py` regex bug** — required ≥ 1 char of link text, so backtick-wrapped link patterns (the most common style in this corpus) silently bypassed validation after the inline-code-strip pass. Changed `+` → `*`. **This was a false-negative across the entire audit history**: every backtick-wrapped link reference was unchecked.
- **11 real broken links surfaced** (after fix):
  - 2 in `docs/USING.ko.md` (wrong relative paths to QUICKSTART/DISTRIBUTION).
  - 5 in `examples/cases/dogfood-v4-korean-hr-onboarding.md` (cited fictional knowledge file paths).
  - 4 in dialog/flex specs referencing `component-dialog.md` and `component-stack.md` which **didn't exist** despite being flagship MUI primitives.
- **Generated missing primitives** — `examples/component-dialog.md` (15 props from Ant + MUI) and `examples/component-stack.md` (1 prop from MUI) via v2 extractor.
- **mkdocs.yml `navigation.instant` disabled** — incompatible with mkdocs-static-i18n's contextual language switcher. Disabled with inline comment explaining why.

#### Verified
- mkdocs build: 0 errors, 631 warnings (categorized as known-acceptable: refs/ links, hex anchor noise, .py/.yml utility links).
- 782 HTML pages generated.
- Korean i18n routing: all `*.ko.md` → `/ko/...` paths render.
- Build time: 15.84 s (within RELEASE-CHECKLIST < 20s budget).
- v4.x docs (MIGRATION-v4, USING.ko, CONTRIBUTING.ko, ARCHITECTURE.ko, dogfood findings) all rendered.

### Combined verified
- All 6 audits pass (with strengthened link-check now actually validating backtick-text links).
- 25 VS Code lib tests pass.
- 16 CLI lib tests pass.
- npm fresh install lifecycle works end-to-end.
- mkdocs builds cleanly to 782 pages.

### What three surfaces validated
- VS Code extension code shape correct; .vsix shippable; manifest consistent.
- npm distribution path works on fresh machine.
- Doc site renders both languages correctly.
- Audit infrastructure now stronger (link-check no longer skips backtick-wrapped link texts).

### What's still ahead (4.x)
- VS Code extension under real IDE (Headless tests don't cover quick-pick UI / config-change handling).
- npm publish flow (would push to actual registry — deferred to launch).
- GitHub Pages deployment of doc site.
- Polish remaining v4.5/v4.7 drafts (now including dialog + stack).
- Coverage push 68.8% → 80%.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.7.0 → 4.8.0.
- `vscode-extension/package.json`: 0.2.0 → 0.3.0.

## v4.7.0 — Dogfood v4 + 5 fixes (2026-05)

End-to-end practical test of the v4.6 corpus on a real Korean B2B HR onboarding scenario. Surfaced 5 actionable gaps; all 5 fixed in this commit.

### Added
- **`examples/cases/dogfood-v4-korean-hr-onboarding.md`** — real deliverable: tokens (palette + typography + spacing) → EmployeeInfoForm composition → document upload Card + confirmation Dialog → UX audit → stability review run. Cites every knowledge file + spec used.
- **`docs/DOGFOOD-V4-FINDINGS.md`** — self-critique. What worked since v3 (family-completed specs paid off; KR knowledge composes naturally; /stability-review dogfooded itself; single audit runner saved time). What broke (5 gaps surfaced + fixed). Time comparison v3 vs v4 (~3-5x faster on form/dialog/list-heavy work).
- **`examples/component-loading-button.md`** (Fix 1) — polished pattern spec for the loading-button pattern. MUI v6+ merged it into Button (`<Button loading>`); shadcn / Ant don't ship a separate one. Spec documents the **pattern** to apply to any Button.
- **`knowledge/patterns/b2b-onboarding-flows.md`** (Fix 3) — new knowledge file. B2B vs B2C differences, 5-9 step pacing, auto-save strategy, sensitive-data handling (주민등록번호, 통장 사본, 주소), bilingual KR+EN flows, state recovery, HR-vs-hire dual views.
- **Korean B2B SaaS palette row** (Fix 4) — added row 162 to `knowledge/colors/palettes-by-product-type.md`. Muted teal (`#0D9488`) + professional blue accent for HR / Payroll / Legal sensitive-data products.

### Changed
- **`tools/audit/stability-review.py`** (Fix 2) — added `GENERATED_ARTIFACTS` skip-list. `knowledge/COVERAGE.md` no longer reported as "missing stability metadata" (false positive — generated artifact, by design).
- **`tools/extractors/component_spec_scaffold_v2.py`** (Fix 5) — DRAFT banner now explicitly states "API table below is parsed directly from typed declarations — accurate and trustworthy". Distinguishes the trustworthy AST-extracted parts from the placeholder narrative parts. Reduces adopter ambiguity.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.6.0 → 4.7.0.

### Verified
- All 6 audits pass.
- Dogfood findings doc cites real knowledge files and specs throughout.
- Loading-button pattern spec follows established polished-spec style (when-to-use / anatomy / API / states / tokens / a11y / edge cases / code example / don't).
- B2B onboarding knowledge file: 9-step flow documented, sensitive-data rules explicit, KR-specific (주민번호 masking / 도로명 주소 API / 4대보험).

### What this validates
- **v4.0 graduation was correct** — the 8 stable surfaces all held up under real use.
- **v4.5 family completion was the right call** — Form / Dialog / List polished specs returned 3-5x productivity vs deriving from primitives.
- **v4.6 stability automation works** — one false positive surfaced and got fixed.

### What this does NOT validate
- VS Code extension under real adopter load (didn't exercise during this dogfood).
- npm install path on a fresh machine (would need clean-clone test).
- Multi-language doc site rendering (last verified at v3.12 release).

These belong in a separate **install / e2e test** — future work.

### v3 vs v4 dogfood time comparison
| Phase | v3 dogfood | v4 dogfood |
| --- | --- | --- |
| Brief → palette + tokens | ~12 min | ~6 min |
| First component spec | ~15 min (had to invent FormControl composition) | ~5 min (cited 5 family-completed specs) |
| Confirmation dialog | ~10 min | ~3 min |
| UX audit | ~8 min | ~5 min |
| Stability review | (didn't exist) | <1 min |

## v4.6.0 — Stability re-review automation (2026-05)

Operationalizes the quarterly stability review ritual described in `RELEASE-CHECKLIST.md` and `ARCHITECTURE.ko.md`. Until v4.6 this was a manual step; now it's a script + two bulk-mutation tools + a slash command.

### Added
- **`tools/audit/stability-review.py`** — generates a quarterly review markdown report. Sections:
  - Summary table (counts by stability level + oldest file per level).
  - Promotion candidates: experimental → stable (≥ 6 months held).
  - Promotion candidates: beta → stable (≥ 3 months held).
  - Stable files due for re-review (≥ 12 months old).
  - Deprecated files (review for next major).
  - Files missing `stability` metadata.
  - Ritual checklist at the bottom.
  - Configurable thresholds via `--warn-months` / `--promote-after` / `--stale-months`.
  - `--today YYYY-MM-DD` for testing future scenarios.
  - `--output <path>` writes report; default stdout.
- **`tools/migrations/promote-stability.py`** — bulk promote / demote `stability:` field:
  - Enforces `--from <level>` (verifies current state before mutating).
  - `--force` to override the check (rare).
  - `--dry-run` previews.
  - Atomic per-file (temp + rename).
  - Bumps `last_updated` to current month on promotion.
- **`tools/migrations/bump-last-updated.py`** — bulk-bump `last_updated` to current month:
  - Use after a quarterly review when files are still accurate.
  - `--dry-run`, `--today YYYY-MM` for testing.
  - Idempotent (no-op if already at target date).
- **`commands/stability-review.md`** — slash command `/stability-review` runs the report + summarizes inline + suggests next bulk operations (with confirmation gate before mutation). Verification phase included.
- **`docs/CONTRIBUTING.md`** "Quarterly stability review" — full 5-step ritual: generate report → walk it → apply via bulk tools → document outcome → commit. Examples included.

### Changed
- **`.claude-plugin/plugin.json`** — registered `/stability-review` as the 16th slash command.
- **`package.json` + `.claude-plugin/plugin.json` + `vscode-extension/package.json`** description strings updated: 15 commands → 16 commands.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.5.0 → 4.6.0.

### Verified
- All 6 audits pass.
- Stability review runs correctly: surfaces files without `stability` (1 found: `knowledge/COVERAGE.md` — generated artifact, intentional).
- Promote tool dry-run correctly verifies `--from` level before allowing transition.
- Bump tool dry-run correctly identifies which files would change vs are already at target.
- Slash command file passes frontmatter + verification-phase checks.

### Workflow

```bash
# Quarter-start (once per Q):
python3 tools/audit/stability-review.py --output docs/STABILITY-REVIEW.md

# Read the report. For each candidate, decide.

# Apply decisions:
python3 tools/migrations/promote-stability.py --from experimental --to stable knowledge/foo.md
python3 tools/migrations/bump-last-updated.py knowledge/bar.md knowledge/baz.md

# Document outcome in CHANGELOG, commit.
```

Or in Claude Code: `/stability-review` — runs the report + walks you through.

### What this enables
- **Knowledge stays fresh.** No more "we should review old files sometime" — the script tells you exactly which.
- **Stability promotions become routine.** beta / experimental files don't accumulate; they're promoted when they hold up.
- **Deprecation hygiene.** Deprecated files are flagged at every review until removed; CHANGELOG captures removal plan.
- **Discoverable in Claude Code.** `/stability-review` surfaces the ritual as a one-command operation.

## v4.5.0 — Coverage push 55% → 68.8% (2026-05)

First coverage push using v2 extractor. Crosses 2/3 canonical coverage. Family-completion focus: List / Card / Dialog / Form-Control / Menu sub-components — the primitives most-used in real Korean B2B / fintech UIs.

### Added — 27 new component specs (110 → 137 of 199)
- **Family-complete (full real specs, polished narrative + tokens + a11y + Korean considerations)** — 6:
  - `list-item` (foundational MUI primitive)
  - `menu-item` (Select / Menu / context menu)
  - `dialog-title`, `dialog-content`, `dialog-actions` (Dialog triplet)
  - `card-content`, `card-actions` (Card triplet)
  - `form-control` (form-input wrapper)
- **v2-extracted drafts (DRAFT banner; accurate API table; narrative placeholders)** — 21:
  - List family: `list-item-button`, `list-item-icon`, `list-item-text`, `list-item-avatar`, `list-subheader`
  - Form family: `form-control-label`, `form-group`, `form-helper-text`, `form-label`
  - Card family: `card-header`, `card-media`
  - Dialog family: `dialog-content-text`
  - Accordion family: `accordion-actions`, `accordion-details`, `accordion-summary`
  - Menu family: `menu-list`
  - Standalone: `toggle-button`, `mobile-stepper`
  - Earlier in v4.4: `input-number`

### Changed
- **`tools/extractors/component_spec_scaffold_v2.py`** — `find_mui_source` now falls back to `.d.ts` (MUI ships compiled JS + types per component). This unlocks AST extraction for all MUI sub-components, not just the few with checked-in `.tsx`.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.4.0 → 4.5.0.

### Verified
- All 6 audits pass.
- Coverage: 110 → 137 (55.3% → 68.8%).
- 6 polished specs follow established sub-component spec style (concise: when-to-use / anatomy / API table / states / tokens / a11y / edge cases / code example / don't).
- 21 v2 drafts retain "DRAFT — scaffolded via TS-AST" banner; honest signal to readers that narrative sections are placeholders.

### Coverage breakdown
| Category | v4.4.0 | v4.5.0 |
| --- | --- | --- |
| Foundational primitives (Button, Input, Card, Dialog, etc.) | ~95% | 100% (with sub-components) |
| Form family (FormControl + variants) | partial | complete |
| List family (ListItem + sub-roles) | partial | complete |
| Dialog family (Title / Content / Actions) | partial | complete |
| Card family (Content / Actions / Header / Media) | partial | complete |
| Transitions (Fade / Grow / Zoom / Slide) | partial | partial |
| Sub-components / utility types | thin | thin (intentional — most don't warrant specs) |

### Why drafts (and not polished for all 27)
v2-extracted drafts have:
- ✓ Accurate API table (props / types / defaults / deprecated / event handlers / source provenance)
- ✓ Standard structure (every spec has the same sections)
- ✗ Placeholder narrative (when-to-use / anatomy / Korean considerations / edge cases)

Honest banner > false completeness. The 6 polished specs prove the patterns apply; remaining 21 will land full content as user-feedback informs which need it.

### What this enables
- **Family completion** — designers searching for "ListItem variants" find them all together.
- **Real-world fintech UIs covered** — most Korean B2C app patterns lean on List + Form + Dialog + Card primitives. v4.5 fills gaps that previously forced ad-hoc references.
- **v2 extractor validated end-to-end** — 27 components extracted in one pass, no parser bugs surfaced.

## v4.4.0 — Component spec extractor v2 (2026-05)

Replaces regex-based component scaffolding with TypeScript AST parsing. Drafts are now produced from the same Compiler API that VS Code uses — no more missed generics, intersection types, or destructured defaults.

### Added
- **`tools/extractors/ts-ast/parse-component.mjs`** — Node.js parser using TypeScript Compiler API. Walks the AST to extract:
  - Interface declarations + extends chains.
  - Type aliases (object literals + intersections).
  - Property signatures with `?:` optional flag.
  - JSDoc tags: `@deprecated`, `@default` / `@defaultValue`, `@since`, prose comment.
  - Component declarations (`function`, arrow, `forwardRef`, `memo`).
  - Destructured defaults from function parameters.
  - Event handler detection (`on*` props).
- **`tools/extractors/ts-ast/package.json`** — local-only package with `typescript` dep. Not shipped via npm (`tools/extractors/` not in package allowlist).
- **`tools/extractors/component_spec_scaffold_v2.py`** — Python wrapper:
  - Invokes parser via subprocess; loads JSON.
  - Picks primary `Props` interface using heuristics (`<Name>Props` → `Base<Name>Props` → largest `*Props`).
  - **Merges props across Ant + MUI + shadcn** with provenance per prop.
  - Surfaces deprecated props in dedicated section.
  - Splits event handlers into separate "Events" table.
  - Falls back cleanly when refs/ or node_modules/ missing.

### Changed
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.3.0 → 4.4.0.

### Verified
- Parser round-trips real Ant Button (29+ props, multiple interfaces, deprecated `iconPosition` correctly flagged).
- Parser round-trips shadcn Button (intersection type `React.ComponentProps<"button"> & VariantProps<...> & {...}` + 3 destructured defaults).
- Parser round-trips MUI components.
- v2 wrapper produces clean spec for missing canonical: `examples/component-input-number.md` (14 props, 3 auto-flagged deprecated, default `variant="outlined"` from destructured).
- All 6 audits pass.
- 16 CLI unit tests pass.

### v1 vs v2 sample diff
Same component, two extractors:

| Capability | v1 (regex) | v2 (AST) |
| --- | --- | --- |
| Generic types `Props<T>` | ✗ misses | ✓ captured |
| `extends` chains | ✗ misses | ✓ captured |
| Intersection types | ✗ partial | ✓ full |
| Destructured defaults | ✗ misses | ✓ captured |
| `@deprecated` JSDoc | ✗ misses | ✓ flagged |
| `@default` JSDoc | ✗ misses | ✓ used |
| Event handler grouping | ✗ mixed in | ✓ separate section |
| Source provenance per prop | ✗ first-source-wins | ✓ all sources |

### What this enables
- **Faster coverage push** — drafts now require less manual cleanup. 14 props extracted with correct types where v1 needed regex tuning per source.
- **Safer multi-source merging** — provenance per prop means the human reviewer can see "this prop exists in Ant + MUI but not shadcn" at a glance.
- **Deprecation visibility** — surfaces deprecated props upfront so reviewers don't accidentally promote them.

### Setup (one-time)

```bash
cd tools/extractors/ts-ast
npm install
```

After setup, use v2 like v1:

```bash
python3 tools/extractors/component_spec_scaffold_v2.py --name <component>
python3 tools/extractors/component_spec_scaffold_v2.py --all-missing --limit 20
```

v1 (`component_spec_scaffold.py`) remains for backward compatibility but v2 is now preferred.

## v4.3.0 — Internal completeness (2026-05)

Tightens internal quality. Standardizes skill verification headings, strengthens the audit that enforces them, adds 3 VS Code commands (language-aware walkthroughs / README opener / corpus search), introduces a unified audit runner, and adds the first CLI unit tests.

### Added
- **`tools/audit/run-all.py`** — unified runner for all 6 audits. Single command instead of six. `--strict` flag fails CI on any audit failure. `--quiet` suppresses pass-output. ~0.8s end-to-end.
- **CLI tests** (`cli/lib/paths.test.mjs`, `cli/lib/log.test.mjs`) — 16 unit tests covering pure-logic helpers (path resolution, file/dir checks, color helpers in NO_COLOR mode). Uses Node 18+ built-in `node --test`. No new deps.
- **VS Code extension — `design-ai.openReadme`** — opens `README.ko.md` if `design-ai.language` is `ko`, else `README.md`.
- **VS Code extension — `design-ai.search`** — searches across `knowledge/`, `examples/`, `skills/`, `docs/`, `agents/`, `commands/`. Surfaces first match per file. Jumps to the matching line on selection. Korean / English UI strings via `getLanguagePreference()`.

### Changed
- **`tools/audit/check-coverage.py`** — strengthened skill verification check:
  - Strict: requires canonical `## Verification phase` level-2 heading.
  - Loose-only files (e.g., `### 7. Verification`) surfaced separately as a soft signal — encourages standardization.
- **`skills/figma-token-sync/PLAYBOOK.md`** — verification phase promoted from `### 7. Verification phase` to standalone `## Verification phase (run before declaring done)`.
- **`skills/slide-deck-author/PLAYBOOK.md`** — same standardization (`### 7. Verification` → `## Verification phase ...`).
- **VS Code extension — `design-ai.openWalkthrough`** — now language-aware. Prefers `.ko.md` when `design-ai.language` is `ko`; falls back to `.md`. Quick-pick labels show `[KO]` / `[EN]` tags.
- **VS Code extension — `design-ai.status`** — labels in Korean when `design-ai.language` is `ko` (소스 / 스킬 / 커맨드 / 에이전트).
- **VS Code extension — `commands.ts`** — extracted `readManifest()` helper with explicit `PluginManifest` interface. Removed unused `child_process` import.
- **`vscode-extension/package.json`** — extension version 0.1.0 → 0.2.0. Two new commands registered.
- **`package.json` scripts** — `npm test` now runs CLI tests. `npm run audit` uses unified runner. New `npm run audit:strict` for CI.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.2.0 → 4.3.0.

### Verified
- All 6 audits pass (via unified runner, 0.81s).
- 16 CLI unit tests pass.
- VS Code extension compiles cleanly (`tsc --noEmit` zero errors).
- All 19 skills now have canonical `## Verification phase` heading.

### What this enables
- **One-command quality gate.** `npm run audit` runs all 6 in 0.8s with a unified summary. `npm run audit:strict` for CI.
- **Test-backed CLI.** First unit tests for the CLI surface — paths resolution and color helpers covered. Foundation for more tests.
- **Language-aware VS Code.** Korean adopters get Korean READMEs / walkthroughs / status labels by setting `design-ai.language: ko` once.
- **Searchable corpus.** No more "where was that knowledge file?" — VS Code search across the full corpus, jumps to the line.
- **Skill verification consistency.** All 19 skills use the same canonical heading. Future audit can fail (not just warn) on non-canonical formats.

## v4.2.0 — Launch kit (2026-05)

Ready-to-post announcement materials for the v4.0 launch. Drafts only — posting is owner action.

### Added
- **`docs/announcements/`** directory — 7 launch-channel drafts:
  - `README.md` — index, posting order (HN → dev.to → r/programming → KR channels), tracking template, channel tone matrix.
  - `press-kit.md` — reusable assets: one-liner / two-liner / three-bullet (EN + KO), stats card, origin narrative, FAQ, links.
  - `show-hn.md` — Show HN submission (title alts, body, comment-prep replies for likely questions).
  - `okky-post.ko.md` — OKKY long-form Korean post (해요체 voice, KR adoption focus, prepared 답글).
  - `hashnode-post.ko.md` — hashnode KR-tagged blog post (~800 words, technical retrospective tone).
  - `dev-to-korea.md` — dev.to post (English with Korean code/example fragments).
  - `twitter-thread.md` — parallel EN + KO threads (8 tweets each), hook → architecture → journey → CTA.
  - `reddit-r-korea.md` — r/programming + r/korea + r/ClaudeAI drafts with sub-specific rule notes.

### Changed
- `package.json` + `.claude-plugin/plugin.json`: 4.1.0 → 4.2.0.

### Verified
- All 6 audits pass.
- Drafts written in target voice per channel — no auto-translation; KR drafts in natural Korean (해요체).

### Posting strategy
- Stagger over 7 days, not same-day burst.
- Day 1: HN + dev.to (US/EU primary).
- Day 2: r/programming.
- Day 3: r/korea + r/ClaudeAI.
- Day 4-7: KR community (OKKY, hashnode), Twitter EN + KO threads.
- Track in `docs/announcements/posted.md` (created at first post).

### What this enables
- **Owner-ready launch.** Push the v4.0 tag, verify CI publish, then post in any order — no last-minute writing under pressure.
- **Channel-tailored tone.** Each draft uses the voice that channel rewards (HN: low-key engineer-to-engineer; OKKY: 해요체 KR community; dev.to: technical blog; Twitter: scannable hooks).
- **Reusable on future releases.** Press kit, FAQ, and stats card carry forward; just refresh numbers per release.

### Reminder

These are **drafts only**. Posting is your action — I won't push to remote, npm, or any external service without your explicit confirmation. The v4.0.0 git tag is also still local from Phase 32.

## v4.1.0 — Korean adopter / contributor docs (2026-05)

First 4.x minor. Continues v3.6 / v3.10 KR i18n investment. Korean adopters now have full Korean docs for using, contributing, and understanding the architecture — three foundational docs that previously existed only in English.

### Added
- **`docs/USING.ko.md`** — 사용자 가이드. Codex / Claude Code / Cursor / Aider / VS Code 통합, 토큰 예산 표, 한국 프로젝트 추가 컨텍스트 (KR 결제 / 타이포 / 음성 / 게임 / 영상 / 인쇄 / 일러스트 / 공간), 새로고침 주기.
- **`docs/CONTRIBUTING.ko.md`** — 기여 가이드. 소스 레포 추가, 새 스킬 / 에이전트 / 커맨드 추가, 지식 파일 편집, 버전 메타데이터 (v3.11+), 인용 규칙, 한국어 콘텐츠 기여 톤 가이드 (해요체 / 합쇼체 분기), 6개 감사, PR 워크플로.
- **`docs/ARCHITECTURE.ko.md`** — 아키텍처. 4 계층 다이어그램, model-agnostic 철학, 지식 / 추출기 / 스킬 파일 계약, 검증 단계, 6개 감사 표, 4개 배포 채널, i18n 구조.

### Changed
- **`mkdocs.yml`** — `nav_translations`에 `Using design-ai: 사용 가이드`, `Contributing: 기여 가이드` 추가. `docs_structure: suffix`로 `.ko.md` 파일은 자동으로 `/ko/...` 경로 매핑.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.0.0 → 4.1.0.

### Verified
- All 6 audits pass.
- Korean copy check now scans 29 Korean-relevant files (was 26).
- Translations adapted to natural Korean — 해요체 voice for adopter-facing docs (USING / CONTRIBUTING), neutral technical tone for ARCHITECTURE.

### Translation choices
- 사용자 / 기여자 대상 본문: 해요체 (친근, 일상).
- 코드 블록 / 명령어: 영문 그대로.
- 기술 용어 (API, frontmatter, schema 등): 영문 그대로 자연스러우면 영문 유지.
- 한국 브랜드 / 컨벤션: 한국어 유지 (Toss, KakaoPay, Pretendard, 카카오톡).
- 직역 거부 — 한국어 자연스러움 우선.

### What this enables
- **Korean adopters** can read full sense-making docs in Korean (USING + ARCHITECTURE) before committing to adopt.
- **Korean contributors** can follow the contribution flow without English friction (CONTRIBUTING).
- **Lower English-friction barrier** for KR design / engineering teams evaluating design-ai for company adoption.
- **KR community announcement** (planned for 4.x): when design-ai is announced on OKKY / hashnode.kr / dev.to/korea, the linked docs are now Korean-native.

## v4.0.0 — Stable (2026-05)

**design-ai graduates to stable.** No code changes from v3.12.0 — this is a graduation release that promises API stability across skills, commands, agents, CLI, and plugin manifest. See [`docs/MIGRATION-v4.md`](docs/MIGRATION-v4.md) for the (deliberately small) migration story.

### What v4.0 means

| Surface | Promise |
|---|---|
| Knowledge files (91) | Frozen at `version: 1.0.0`, `stability: stable` |
| Skills (19) | API-stable; deprecation cycle required for removals |
| Slash commands (15) | API-stable; deprecation cycle required for removals |
| Review agents (4) | API-stable |
| CLI (`@design-ai/cli`) | Argv contract stable; pin to `^4.0.0` |
| Plugin manifest | Schema stable |
| VS Code extension | Configuration keys stable |
| Doc site | URL structure frozen |

### Added
- **`docs/MIGRATION-v4.md`** — graduation migration guide. TL;DR (no code changes), what v4.0 promises (API stability across 8 surfaces), what it does NOT promise (content evolution still expected), deprecation policy (deprecate in 4.x → remove in 5.0), upgrade instructions per channel.

### Changed
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.12.0 → 4.0.0.

### Verified
- All 6 audits pass (frontmatter / link / Korean copy / coverage / integration-check / stale-check).
- CLI smoke test: `version`, `help`, `status`, `list skills` all clean.
- NPM pack preview: tarball within budget; allowlist correct.
- Doc site builds.
- VS Code extension compiles.

### Deprecation policy (effective from v4.0)

Anything publicly documented follows: deprecate in 4.x → maintain in 4.x → remove in 5.0. Adopters always get one full minor cycle of warnings.

### What's still ahead (4.x)
- KR tech community announcement (OKKY, hashnode.kr, dev.to/korea).
- VS Code marketplace publish (1.0.0).
- Coverage push 55% → 70%.
- More Korean translations (CONTRIBUTING.ko.md, ARCHITECTURE.ko.md, USING.ko.md).
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).

### The journey

v2.0 → v4.0 in one table:

| Surface | v2.0 | v4.0 |
|---|---|---|
| Knowledge files | 55 | 91 |
| Worked examples | 83 | 160 |
| Skills | 12 | 19 |
| Slash commands | 8 | 15 |
| Review agents | 4 | 4 |
| Component coverage | ~24% | 55.3% |
| Distribution channels | 1 | 4 (npm / Homebrew / git / VS Code) |
| Integration walkthroughs | 0 | 5 (each EN + KO) |
| Site languages | 0 | 2 (EN + KO) |
| CI audits | 4 | 6 |

See [`docs/SESSION-LOG.md`](docs/SESSION-LOG.md) for the full narrative.

## v3.12.0 — Release readiness (2026-05)

Operationalizes the versioned frontmatter from v3.11. Adds a stale-content audit, a release checklist, and a session log. Closes the v3.x arc — design-ai is now release-ready (versioned, audited, distributed, localized).

### Added
- **`tools/audit/stale-check.py`** — flags knowledge files whose `last_updated` is too old. Default thresholds: warn at 6 months, error at 12 months. Configurable via `--warn-months` / `--error-months`. Supports `--strict` (exit 1 on stale). `--today YYYY-MM-DD` for testing. Files without `last_updated` are skipped (backward-compatible).
- **`docs/RELEASE-CHECKLIST.md`** — pre-release ritual. 11 main sections (audits / version alignment / CHANGELOG / ROADMAP / CLI smoke test / NPM preview / doc site build / VS Code build / Korean copy spot-check / tag and push / post-tag) + major-version sections (migration guide / announcement template / stability re-review) + VS Code marketplace publish + Homebrew formula update + common failure modes table + stability promotion ritual.
- **`docs/SESSION-LOG.md`** — single-page narrative of how design-ai grew from v2.0 (foundation) to v3.12 (release-ready). At-a-glance metrics table, phase log organized by epochs (domain expansion / distribution / coverage acceleration / VS Code / Korean depth / release readiness), patterns that worked, patterns that didn't, repo structure, cross-references.

### Changed
- **`.github/workflows/audit.yml`** — added stale-content audit to CI. Strict mode on `push` to `main` (CI fails on ≥12-month-stale files); warn-only on PRs.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.11.0 → 3.12.0.

### Verified
- All 6 audits pass (frontmatter / link / Korean copy / coverage / integration-check / stale-check).
- Stale-check tested with `--today 2027-08-15` — correctly flagged 75 files as 15 months stale (would fail CI under `--strict`).
- All 91 knowledge files within freshness window (≤ 6 months).

### What this enables
- **Confident releases** — RELEASE-CHECKLIST.md codifies the pre-tag ritual; nothing slips through.
- **Continuous freshness** — stale-check runs on every push to main; surfaces files that need review before they rot.
- **Project narrative** — adopters and contributors can read SESSION-LOG.md to understand the arc; future maintainers have context for design decisions.
- **v4.0 readiness** — design-ai is now versioned, audited, distributed (4 channels), localized (EN + KO), and release-checklisted. Ready to tag stable.

## v3.11.0 — Versioned knowledge frontmatter (2026-05)

Foundation for v4.0 stability. Every knowledge file now carries `version`, `last_updated`, and `stability` metadata. Adopters can pin to specific versions; future audits can flag stale content.

### Added
- **`tools/migrations/add-version-frontmatter.py`** — one-shot migration script. Idempotent. Adds `version: 1.0.0`, `last_updated: 2026-05`, `stability: stable` to all 91 knowledge frontmatters. Supports `--write` (apply) and dry-run.
- **`tools/audit/frontmatter-check.py`** — validates the new optional fields:
  - `version`: must be semver-shaped (e.g., `1.0.0`, `1.2.3-beta`).
  - `last_updated`: must be `YYYY-MM` or `YYYY-MM-DD`.
  - `stability`: must be one of `stable` / `beta` / `experimental` / `deprecated`.
  - Missing keys remain OK (backward-compatible).
- **`tools/migrations/`** directory — new home for one-shot migration scripts (separate from `tools/audit/` and `tools/extractors/`).

### Changed
- **All 91 knowledge files** — frontmatter extended with version metadata. No content changes.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.10.0 → 3.11.0.

### Stability levels
| Level | Meaning |
| --- | --- |
| `stable` | Reviewed; canonical; safe to depend on |
| `beta` | Substantively complete but pending review or final polish |
| `experimental` | Active iteration; may change significantly |
| `deprecated` | Superseded; will be removed in a future major version |

All current knowledge starts at `stable` — they were all reviewed during their respective phases.

### Verified
- All 5 audits pass (frontmatter / link / Korean copy / coverage / integration-check).
- Migration script idempotent (re-running detects existing version keys, skips).
- All 91 files updated; format identical to existing convention.

### What this enables
- **Version pinning** — adopters can reference "knowledge v1.0.0" or "design-ai @ 3.11" with confidence.
- **Stale-content detection** — future audit can flag files with `last_updated > 12 months ago`.
- **Stability-aware skills** — skills can prefer `stable` knowledge over `experimental` when both exist.
- **Migration tracking** — `last_updated` reflects the substantive last review of each file (currently 2026-05 for all; will diverge over time).

## v3.10.0 — Korean integration walkthroughs (2026-05)

Five integration walkthroughs translated to Korean. Continues v3.6 KR i18n investment — primary audience (KR designers / developers) can now use Codex / Cursor / Aider / SDK / VS Code without English friction.

### Added
- **`docs/integrations/codex-walkthrough.ko.md`** — Codex CLI 워크스루 (4 sessions: 컴포넌트 spec / 디자인 시스템 / 비평 반복 / Figma 감사) + Codex 전용 팁 (파일 경로, MCP 설정, AGENTS.md 조각).
- **`docs/integrations/cursor-walkthrough.ko.md`** — Cursor 워크스루 (5 sessions: 인라인 spec / 기존 감사 / Figma 비평 / 토큰 생성 / Cmd+K 인플레이스 편집) + Composer 모드 + MCP 설정.
- **`docs/integrations/aider-walkthrough.ko.md`** — Aider 워크스루 (4 sessions: 구현 / 리팩토링 / 디자인 시스템 부트스트랩 / 감사-수정) + Aider 패턴 (architect mode, auto-test, bash alias).
- **`docs/integrations/sdk-walkthrough.ko.md`** — Anthropic + OpenAI SDK 워크스루 (5 sessions: prompt caching, 도구 사용, 스트리밍, 프로덕션 챗봇).
- **`docs/integrations/vscode-walkthrough.ko.md`** — VS Code 확장 워크스루 (5 sessions: 채팅 참조 / 기존 감사 / PLAYBOOK 생성 / 빠른 선택 / 멀티 파일 부트스트랩).

### Changed
- **`tools/audit/korean-copy-check.py`** — `.ko.md` 패턴 추가; 26개 한국어 관련 파일 스캔 (이전 17).
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.9.0 → 3.10.0.

### Verified
- All 5 audits pass.
- Korean copy check now scans `.ko.md` files (26 total).
- 358 internal links resolve.
- Translations adapted to natural Korean — 해요체 voice for adopter-facing content; not literal English-to-Korean.

### Voice / register choices
- 어댑터 / 사용자 대상 콘텐츠 — 해요체 (친근).
- 코드 블록은 영문 그대로 유지 (대부분의 명령어 / API).
- 한국어 브랜드 이름 / 컨벤션은 한국어 유지 (Toss, KakaoPay, Pretendard).
- Direct translation 거부 — 한국어 자연스러움 우선 ("Let's get started" → "시작해 봐요" 아닌 영어 직역 "시작합시다 우리는").

### What this enables
- **Korean adopters** can use any of 5 AI coding tools with full walkthroughs in Korean.
- **B2B 한국 팀** can share Korean walkthroughs with non-developer stakeholders.
- **Lower English-friction** for KR designers / developers evaluating design-ai.
- **Audit coverage** — Korean files now validated by korean-copy-check on every PR.

## v3.9.0 — Coverage push 45% → 55% (2026-05)

Component coverage 45.2% → **55.3%** (90 → 110 of 199 canonical components). Crosses majority canonical coverage. Form / overlay / transition primitives largely complete.

### Added (20 specs total — 18 new + 2 renames)

**Form / control primitives** (3):
- `component-switch.md` — sibling to form-controls; iOS-style toggle; Switch vs Checkbox decision
- `component-textarea.md` — multi-line input; Korean IME composition handling
- `component-textarea-autosize.md` — grows-with-content variant; CSS field-sizing + JS fallback

**Notifications** (2):
- `component-snackbar.md` — Material's Toast (bottom-anchored)
- `component-sonner.md` — modern shadcn toast library; stacking depth, promise wrapper

**Overlays** (3):
- `component-popconfirm.md` — inline confirmation popover; lightweight vs AlertDialog
- `component-popper.md` — low-level positioning primitive used by all overlays
- `component-click-away-listener.md` — outside-click utility wrapper

**Display / layout** (4):
- `component-tag.md` — closeable label / chip
- `component-resizable.md` — IDE-style resizable panel groups
- `component-image-list.md` — uniform-grid photo display
- `component-toolbar.md` — horizontal action container with role="toolbar"

**Mobile-first** (1):
- `component-swipeable-drawer.md` — swipe-to-open / swipe-to-close drawer

**Floating / scroll** (2):
- `component-back-top.md` — scroll-to-top button after threshold
- `component-speed-dial-action.md` — sub-action inside SpeedDial

**Transitions** (2):
- `component-zoom.md` — scale + fade transition primitive
- `component-slide.md` — direction-based slide transition

**Sub-components** (1):
- `component-step.md` — single Step inside Steps/Stepper

**Renames** (2):
- `component-autocomplete.md` → `component-auto-complete.md` (matches canonical)
- `component-mention.md` → `component-mentions.md` (matches canonical)

### Coverage
- Examples: 142 → 160 (+18)
- Component coverage: 90 → **110** (45.2% → **55.3%**)

### Versions
- CLI: 3.8.0 → 3.9.0
- Plugin / corpus: 3.8.0 → 3.9.0

### What this enables
- **Majority canonical coverage** — over half of the 199-component surface specced.
- **Notification family complete** — Toast / Snackbar / Sonner / Message / Notification / Banner / Alert all distinct + comparable.
- **Transition primitives complete** — Fade / Zoom / Slide / Grow / Collapse all referenced.
- **Form primitives complete** — Switch / Checkbox / Radio / Label / Textarea + autosize / Field family.

## v3.8.0 — VS Code extension (2026-05)

design-ai is now accessible inside VS Code via a dedicated extension. Surfaces the corpus as sidebar trees + quick-pick commands; pairs with any AI assistant (Copilot Chat, Cursor Chat, Continue, Claude in VS Code, etc.).

### Added
- **`vscode-extension/`** — TypeScript-based VS Code extension:
  - `package.json` manifest with 8 commands + 4 sidebar views + 2 settings.
  - `src/extension.ts` — entry point with path auto-probing.
  - `src/paths.ts` — locates design-ai source via setting / workspace folder / common locations / npm-global / Homebrew.
  - `src/commands.ts` — 8 commands (Install, Status, Open knowledge, Open spec, Open skill, Open walkthrough, Refresh, Settings).
  - `src/providers/trees.ts` — TreeDataProviders for Skills / Knowledge (recursive) / Examples / Walkthroughs.
  - `media/icon.svg` — gradient indigo/violet "D" mark.
  - `tsconfig.json`, `.vscodeignore`, `LICENSE`, `README.md`, `CHANGELOG.md`.
- **`docs/integrations/vscode-walkthrough.md`** — 5 worked sessions (browse + reference, audit existing, generate from PLAYBOOK, quick-pick across corpus, multi-file design system bootstrap).
- **`tools/audit/integration-check.py`** — added vscode-walkthrough.md to the validation list (now 5 walkthroughs).
- **`README.md`** — agent table now lists VS Code as a supported environment.
- **`mkdocs.yml`** — Integrations nav adds VS Code entry.

### Versions
- CLI: 3.7.0 → 3.8.0
- Plugin / corpus: 3.7.0 → 3.8.0
- VS Code extension: 0.1.0 (initial release; lives in `vscode-extension/`)

### What this enables
- **Millions of VS Code users** can browse design-ai content without leaving the editor.
- **Pair with any AI assistant** — Copilot Chat / Cursor / Continue / Claude / CodeWhisperer all work via `#file:` / `@file` references.
- **Korean preference setting** — `design-ai.language: "ko"` opens Korean translations of README / QUICKSTART / etc.
- **Doesn't compete with AI assistants** — provides design-aware **content** that complements any AI tool.

### How to publish (maintainer note)
The extension is scaffolded but not yet published to the VS Code Marketplace. To publish:
```bash
cd vscode-extension
npm install
npm run compile
npx @vscode/vsce package         # produces .vsix
npx @vscode/vsce publish         # requires Azure DevOps PAT + publisher account
```
Or distribute via the GitHub Releases page until marketplace publication.

## v3.7.0 — Coverage push 36% → 45% (2026-05)

Component coverage 36.2% → **45.2%** (72 → 90 of 199 canonical components). Crosses the halfway-to-100% threshold for canonical primitive coverage.

### Added (18 specs total — 17 new + 1 rename)

**Form / control primitives** (5):
- `component-checkbox.md` — sibling spec to form-controls; indeterminate state, KR marketing-consent rule
- `component-radio.md` + RadioGroup — mutually exclusive choice; KR payment-method picker
- `component-label.md` — htmlFor linking; required / optional indicators; KR conventions
- `component-icon.md` — base primitive; size scale, currentColor theming
- `component-icon-button.md` — icon-only variant; mandatory aria-label

**Layout primitives** (4):
- `component-box.md` — most generic styled `<div>` with system props
- `component-flex.md` — flex layout primitive; direction / gap / align / justify
- `component-grid.md` — 2D layout (Ant Row+Col / MUI v2 / modern CSS Grid)
- `component-space.md` — tiny inline-gap utility (sibling to Flex / Stack)

**Navigation / overlays** (3):
- `component-menu.md` — Ant-style structured nav; distinct from Dropdown / NavigationMenu / Sidebar
- `component-button-group.md` — visually unified action cluster
- `component-speed-dial.md` — FAB with 2-5 secondary action FABs (mobile compose pattern)

**Feedback / data** (3):
- `component-message.md` — top thin pill notification (Ant); distinct from Toast / Notification
- `component-notification.md` — richer corner card with title + description + actions
- `component-list.md` — semantic + styled wrapper around Item rows; pagination, virtualization

**Pickers** (2):
- `component-time-picker.md` — hour/minute/second; 24/12-hour; KR step conventions
- `component-tree-select.md` — dropdown hierarchical picker; distinct from Cascader / Tree

**Utility** (1):
- `component-backdrop.md` — semi-opaque scrim overlay

**Renamed** (1):
- `component-qrcode.md` → `component-qr-code.md` (matches canonical kebab-case naming)

### Coverage
- Examples: 124 → 142 (+18)
- Component coverage: 72 → **90** (36.2% → **45.2%**)
- Knowledge: 91 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)

### Versions
- CLI: 3.6.0 → 3.7.0
- Plugin / corpus: 3.6.0 → 3.7.0

### What this enables
- **Halfway to 100%** — 45.2% is a meaningful milestone; the canonical primitive surface is well-covered.
- **Form construction primitives complete** — Checkbox / Radio / Label / Field family / Switch (in form-controls) all covered. Form skill output uses real spec foundations.
- **Layout primitives covered** — Box / Flex / Grid / Stack / Space / Masonry — adopters can pick the right tool.
- **Notification family unified** — Toast / Message / Notification / Banner / Alert all distinct, comparable; team picks the right one.

## v3.6.0 — Doc site Korean i18n (2026-05)

design-ai's primary audience is Korean designers / developers. The doc site is now bilingual: English (default) + Korean translations of the highest-traffic pages.

### Added
- **`README.ko.md`** — Korean primary landing. Coverage table, install paths, agent table, project structure, Korean market focus.
- **`docs/QUICKSTART.ko.md`** — 5-minute getting-started in Korean.
- **`docs/DISTRIBUTION.ko.md`** — distribution guide in Korean (NPM / Homebrew / git clone).
- **`AGENTS.ko.md`** — universal agent entry point in Korean.
- **`mkdocs-static-i18n` plugin** — file-suffix-based translations (`README.ko.md`, `index.ko.md`); language switcher in mkdocs-material header.
- **mkdocs nav translations** — section labels (Home / Quickstart / Distribution / etc.) translated to Korean.
- **README badges** — language toggle at top of both English and Korean READMEs.

### Changed
- **`tools/build-docs.sh`** — symlinks Korean translations into `site-src/`.
- **`docs/requirements.txt`** — added `mkdocs-static-i18n>=1.3.0`.
- **`mkdocs.yml`** — `extra.alternate` declares English / Korean languages; `i18n` plugin configured.
- **`README.md`** (English) — language toggle to Korean version; examples count corrected to 124.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.5.0 → 3.6.0.

### Verified
- All 5 audits pass.
- mkdocs build succeeds in 12s with both languages.
- Korean pages render at `/ko/` with translated nav.
- Search supports both English and Korean.

### What this enables
- **Korean B2C / B2B audiences** can browse the corpus without English friction.
- **SEO for the primary market** — Korean meta tags + content indexed by Naver / Google KR.
- **Lower adoption friction** — KR designers / developers evaluate in their native language before installing.

## v3.5.0 — Component spec scaffolder + coverage push (2026-05)

Component coverage 30.7% → **36.2%** (61 → 72 of 199 canonical components). Adds an extractor that scaffolds future spec drafts from upstream sources, accelerating future coverage pushes.

### Added (1 extractor + 11 specs)

**Extractor**:
- `tools/extractors/component_spec_scaffold.py` — given a canonical component name, reads its sources from `refs/{ant,mui,shadcn}` and emits a draft `examples/component-{name}.md`. Best-effort prop extraction from TS interfaces. Supports `--name`, `--all-missing`, `--limit`, `--dry-run`, `--force`. Graceful degradation when refs/ is missing (still produces template).

**11 component specs**:
- `component-alert-dialog.md` — destructive action confirmation; default focus on Cancel; `role="alertdialog"`.
- `component-bottom-navigation.md` — mobile primary nav; iOS / Android / M3 conventions; safe-area handling.
- `component-chart.md` — Recharts wrapper with theming + a11y; KR stock convention (red=up); engine-agnostic chart-type table.
- `component-combobox.md` — searchable select with WAI-ARIA combobox pattern; Korean IME composition handling.
- `component-field.md` — Field family form-wrapper (Field / FieldLabel / FieldDescription / FieldError / FieldGroup / FieldSet / FieldLegend).
- `component-item.md` — list-item primitive (Item / ItemMedia / ItemContent / ItemTitle / ItemDescription / ItemActions).
- `component-link.md` — text link primitive; Link vs Button decision; external indicator; underline policies.
- `component-paper.md` — MUI surface primitive; elevation + outlined; building block for Card / Modal / Drawer.
- `component-spinner.md` — indeterminate loading; Spinner vs Progress vs Skeleton; reduced-motion.
- `component-empty.md` — inline "no data" primitive; distinct from EmptyState (full-page custom).
- `component-masonry.md` — Pinterest-style staggered grid; CSS multicolumn vs JS measurement trade-offs; a11y reading order.

### Coverage
- Examples: 113 → 124 (+11)
- Component coverage: 61 → **72** (30.7% → **36.2%**)
- Knowledge: 91 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)

### Versions
- CLI: 3.4.0 → 3.5.0
- Plugin / corpus: 3.4.0 → 3.5.0

### What this enables
- **Future coverage pushes accelerate** — scaffold 30+ drafts in seconds, refine + ship.
- **Closer parity with shadcn-ui** — most flagship primitives now have specs (alert-dialog, command, sheet, dropdown, navigation-menu, menubar, sidebar, combobox, field, item).
- **Form scaffolding ready** — Field family enables structured form construction across the corpus.

## v3.4.0 — Multi-agent integration + Homebrew (2026-05)

Concrete proof of design-ai's "model-agnostic" tagline. Four worked-example walkthroughs (Codex CLI / Cursor / Aider / SDK), Homebrew formula for `brew install`, and a CI audit that keeps walkthroughs from drifting.

### Added
- **`docs/integrations/codex-walkthrough.md`** — 4 walkthroughs (component spec, design system, iterate critique, Figma audit) + Codex-specific tips (file paths, MCP config, AGENTS.md fragments).
- **`docs/integrations/cursor-walkthrough.md`** — 5 walkthroughs (inline component spec, audit existing component, Figma critique, token generation, `Cmd+K` inline edits) + Composer mode patterns.
- **`docs/integrations/aider-walkthrough.md`** — 4 walkthroughs (component impl, refactor to spec, design system bootstrap, audit-then-fix) + Aider-specific patterns (architect mode, auto-test, bash aliases).
- **`docs/integrations/sdk-walkthrough.md`** — Anthropic SDK + OpenAI SDK adoption with prompt caching, tool use, streaming. Production chatbot example.
- **`Formula/design-ai.rb`** — Homebrew formula for `brew install design-ai`. Tap-based distribution; future-ready for homebrew-core submission.
- **`Formula/README.md`** — Maintainer instructions for releasing new versions via Homebrew.
- **`tools/audit/integration-check.py`** — verifies each walkthrough has required sections (Prerequisites, Setup, ≥3 Walkthrough N, Next/cross-reference). Wired into CI.

### Changed
- **`docs/CODEX-INTEGRATION.md`**, **`docs/CURSOR-INTEGRATION.md`**, **`docs/AIDER-INTEGRATION.md`** — link to the new walkthroughs at the top.
- **`README.md`** — added Option B: Homebrew install path; agent table now links to per-agent walkthroughs.
- **`mkdocs.yml`** — Integrations nav restructured: each agent now has Setup + Walkthrough sub-entries; SDK and Distribution pages added at top level.
- **`.github/workflows/audit.yml`** — added `integration-check.py` step. CI now has 5 audits.

### Versions
- CLI: 3.3.0 → 3.4.0
- Plugin / corpus: 3.3.0 → 3.4.0

### What this enables
- **Model-agnostic adoption** — adopters can choose Codex, Cursor, Aider, or pure SDK without reverse-engineering setup.
- **Homebrew install** — Mac users get `brew install design-ai`. Cleaner than git clone for non-developer audiences.
- **Quality bar on integration docs** — CI fails if a walkthrough loses its standard structure (Prerequisites / Setup / Walkthroughs / Next).

## v3.3.0 — Component coverage push (2026-05)

Component spec coverage 23.6% → **30.7%** (47 → 61 of 199 canonical components).

### Added (15 component specs)

**Overlay primitives**:
- `component-badge.md` — standalone label + indicator dual modes
- `component-dropdown.md` — Dropdown / DropdownMenu (renamed from `component-dropdown-menu.md` to match canonical)
- `component-context-menu.md` — right-click / long-press triggered
- `component-hover-card.md` — hover-triggered floating preview
- `component-sheet.md` — side-anchored modal panel with mobile detents
- `component-command.md` — Command / CommandPalette (renamed from `component-command-palette.md`); cmdk-based searchable palette

**Navigation / layout**:
- `component-sidebar.md` — persistent collapsible navigation
- `component-navigation-menu.md` — top horizontal nav with mega-menu
- `component-menubar.md` — desktop-style File / Edit / View menus

**Utilities**:
- `component-aspect-ratio.md` — proportions wrapper
- `component-collapsible.md` — single expandable section primitive
- `component-toggle.md` — Toggle + ToggleGroup pressable buttons
- `component-scroll-area.md` — custom-styled scrollbar
- `component-banner.md` — persistent in-page strip (distinct from Alert + Toast)
- `component-kbd.md` — keyboard shortcut display (platform-aware symbols)
- `component-separator.md` — horizontal / vertical divider

### Coverage
- Examples: 99 → 113 (+14; 2 renamed, 13 net new + 2 small)
- Component coverage: 47 → **61** (23.6% → **30.7%**)
- Knowledge: 91 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)

### Versions
- CLI: 3.1.0 → 3.3.0
- Plugin / corpus: 3.1.0 → 3.3.0

(v3.2 didn't bump versions — that phase added the doc site without changing the corpus / CLI.)

## v3.2.0 — Public doc site (2026-05)

mkdocs-material site at GitHub Pages. The corpus is now browsable + searchable for prospective adopters before they install.

### Added
- **`mkdocs.yml`** — site config with full nav covering knowledge / skills / commands / agents / examples / integrations / reference. Material theme with brand-colored palette (indigo/violet) and Korean typography (Pretendard variable font from CDN).
- **`tools/build-docs.sh`** — populates `site-src/` with a symlink farm pointing to corpus content (mkdocs requires docs_dir to be a sibling of the config, not the parent — symlink farm is the standard workaround).
- **`docs/site-overrides/`** — theme customizations: `extra.css` (Pretendard for Korean, brand color tweaks, `word-break: keep-all` for Hangul), `main.html` (announcement bar + OpenGraph metadata), `logo.svg`, `favicon.svg`.
- **`docs/requirements.txt`** — pinned mkdocs-material dependencies (resolves a pygments/pymdown-extensions interaction bug in older 9.5.x).
- **`.github/workflows/docs.yml`** — auto-deploy to GitHub Pages on every push to main. Uses `actions/configure-pages@v4` + `actions/deploy-pages@v4`.
- **README badge** linking to the live doc site.

### Changed
- `tools/audit/link-check.py` and `korean-copy-check.py` — now skip `site-src/`, `site/`, `node_modules/` walk paths so audits don't double-count symlinked content.
- `.gitignore` — excludes `site/`, `site-src/` build artifacts.

### Local preview
```bash
pip install -r docs/requirements.txt
./tools/build-docs.sh
mkdocs serve
```

### What this enables
- **Discoverability** — prospective adopters can browse the corpus on the public site before deciding to install.
- **Search** — built-in mkdocs-material search across all 91 knowledge files + 99 examples + skill playbooks.
- **Korean readability** — Pretendard font + word-break rules render Hangul correctly throughout the site.
- **Lower-friction evaluation** — open-source contributors can read full skill / pattern docs without cloning.

## v3.1.0 — Distribution / NPM CLI (2026-05)

NPM CLI distribution. One-command install for adopters.

### Added
- **`@design-ai/cli` npm package** — `npx @design-ai/cli install` from any machine with Node ≥ 18.
- **CLI** (`cli/`): `install`, `update`, `uninstall`, `status`, `list`, `version`, `help`. Aliases (`i`, `u`, `s`, `ls`, `v`).
- **`docs/DISTRIBUTION.md`** — three install paths, CLI reference, versioning rules, publishing checklist, troubleshooting.
- **`.github/workflows/publish.yml`** — auto-publish on `v*` tag with version-match enforcement, audit run, `npm pack --dry-run`, `--provenance` attestation.
- **`.npmignore`** — safety net for what stays out of the npm tarball.

### Changed
- **`.claude-plugin/plugin.json`** version: 3.0.0 → 3.1.0 (aligned with CLI).
- **`README.md`** — lead with `npx @design-ai/cli install` as primary install path.

### What you can do now
```bash
npx @design-ai/cli install
design-ai status
design-ai list skills
design-ai update
```

## v3.0.0 — Stabilization (2026-05)

Productization phase. Makes design-ai installable as a Claude Code plugin and prepares the corpus for adopters beyond the original author.

### Added
- **`.claude-plugin/plugin.json`** — Claude Code plugin manifest. All 19 skills, 15 commands, 4 agents discoverable via plugin tooling.
- **`install.sh`** — automated installer with symlink approach; supports `--uninstall`, `--status`, custom prefix and target.
- **`docs/QUICKSTART.md`** — 5-minute getting-started for new adopters.
- **`CHANGELOG.md`** — this file.
- **CI** now runs the Korean copy check on every PR (previously only frontmatter / link / coverage).

### Changed
- **`README.md`** rewritten to reflect the v2 expansion (motion / illustration / print / video / game UI / conversational / spatial) and to lead adopters through install → first task.

### Stats
- 91 knowledge files
- 99 worked examples
- 19 skills (all with verification phase)
- 15 slash commands
- 4 review agents
- 7 reference extractors
- 5 audit tools (frontmatter, link, korean copy, coverage, changelog)

## v2.7.0 — Spatial / AR / VR (2026-05)

Final phase of v2 expansion. Spatial computing as a first-class design surface.

### Added
- **5 spatial knowledge files**: `spatial-design-fundamentals.md`, `vr-patterns.md`, `ar-patterns.md`, `spatial-ui-elements.md`, `comfort-and-accessibility.md`
- **2 component specs**: `component-spatial-panel.md` (anchoring, sizing, billboarding, hand+gaze input), `component-spatial-locomotion.md` (teleport / smooth / snap turn / room-scale)
- **Skill**: `spatial-designer`
- **Command**: `/spatial`

Korean Galaxy XR ecosystem context, motion sickness mitigations, vergence-accommodation guidance, comfort defaults for new users.

## v2.6.0 — Voice / Conversational UI (2026-05)

### Added
- **5 conversational knowledge files**: fundamentals (turn-taking, intents, modalities, latency, hallucinations), `voice-ui-patterns.md`, `chatbot-design.md`, `ai-chat-interfaces.md` (LLM streaming + markdown), `korean-voice-conventions.md`
- **2 component specs**: `component-chat-interface.md`, `component-voice-input.md`
- **Skill**: `conversational-ui-designer`
- **Command**: `/conversational`

Korean voice ecosystem (Bixby, Clova, NUGU, GiGA Genie, Kakao i), 해요체 / 합쇼체 selection, KakaoTalk channel chatbot, 개인정보보호법 / 정보통신망법 / 자본시장법 compliance.

## v2.5.0 — Game UI (2026-05)

### Added
- **5 game-ui knowledge files**: Russell taxonomy (diegetic / non-diegetic / spatial / non-spatial), HUD design (health / ammo / crosshair / mini-map / cooldowns), menu systems (main / pause / inventory / settings / store), Korean gaming conventions, game accessibility (4 axes)
- **2 component specs**: `component-game-hud.md`, `component-game-menu.md`
- **Skill**: `game-ui-designer`
- **Command**: `/game-ui`

Korean gaming context: PC bang culture, NEXON / NCSoft / Krafton / Smilegate, 게임산업진흥법, 확률 표시 mandatory, 본인인증 / PASS / NICE, GRAC ratings, gacha pity / 천장.

## v2.4.0 — Video content (2026-05)

### Added
- **5 video knowledge files**: fundamentals (codecs, resolution, framerate, bitrate, audio loudness, captions, color space), marketing video, social / short-form (Reels / Shorts / TikTok), in-product video (onboarding / help), Korean video conventions
- **2 component specs**: `component-video-player.md` (multi-lang captions, speed, transcript), `component-video-hero.md` (autoplay loop with art-direction)
- **Skill**: `video-designer`
- **Command**: `/video`

Korean platforms (YouTube / Naver TV / KakaoTV / SOOP), 자막 styling, voiceover (해요체 / 합쇼체), 표시광고법 ad disclosure, KFDA / KFTC compliance.

## v2.3.0 — Print / physical design (2026-05)

### Added
- **6 print knowledge files**: fundamentals (CMYK, bleed, DPI, paper), stationery, brochures and flyers, signage and posters, packaging (dielines), Korean print conventions
- **2 worked print specs**: `print-business-card-spec.md` (Korean 명함, premium tier), `print-packaging-spec.md` (cosmetics carton)
- **Skill**: `print-designer`
- **Command**: `/print`

Korean print specifics: 명함 90×50mm, KFDA / KATS regulatory content for cosmetics / food / supplements, 분리배출 표시 recycling marks, Pretendard typography for print.

## v2.2.0 — Illustration systems (2026-05)

### Added
- **5 illustration knowledge files**: `illustration-systems.md`, `spot-illustrations.md`, `hero-illustrations.md`, `mascot-design.md`, `svg-optimization.md`
- **2 component specs**: `component-empty-state.md` (with illustration registry), `component-illustration.md` (themeable SVG / Lottie display)
- **Skill**: `illustration-designer`
- **Command**: `/illustration`

Korean mascot conventions (Kakao Friends, Toss money characters, Naver / NaverPay characters), soft rounded geometry for B2C, mascot design + governance.

## v2.1.0 — Motion design depth (2026-05)

### Added
- **5 motion knowledge files**: `marketing-motion.md`, `app-loading-sequences.md`, `micro-interactions.md`, `choreography-depth.md`, `motion-tools.md`
- **4 component specs**: `component-loading-sequence.md` (splash + biometric gate + first-screen reveal), `component-page-transition.md`, `component-lottie-player.md`, `component-scroll-reveal.md`
- **Skill**: `motion-designer`
- **Command**: `/motion-design`

Tool decision tree (CSS / Framer Motion / GSAP / Lottie / Rive / react-spring), reduced-motion safety throughout.

## v2.0.0 — Completion (earlier 2026)

Final completion of v2.0 baseline scope.

### Added
- 6 doc / deck / report / email worked examples (Diátaxis tutorial / how-to / explanation; slide deck talk; UX audit report; Korean fintech transactional email).
- 7 component specs: `component-descriptions.md`, `component-hero-block.md`, `component-feature-grid.md`, `component-testimonial-carousel.md`, `component-pricing-cards.md`, `component-pass-auth.md` (Korean 본인인증), `component-otp-countdown.md`.
- 3 universal pattern knowledge files: `auth-flow-design.md`, `pricing-page-design.md`, `landing-hero-design.md`.

## v1.9.0 — Document design + brand + email

### Added
- 5 document design knowledge files (typography for long-form, information architecture / Diátaxis, technical writing voice, slide deck design, report design).
- 3 brand / medium files (`brand-identity.md`, `email-design.md`, `i18n/korean-app-store-visual.md`).
- `i18n/korean-document-style.md` — honorific level (합쇼체 vs 해요체), hierarchy, spacing.
- 4 doc component specs (Heading, Code, Callout, Blockquote).
- 1 email component spec (`email-layout.md` — bulletproof button, Outlook fallback).
- Skills: `document-author`, `slide-deck-author`.
- Commands: `/document-from-brief`, `/slide-deck`, `/design-review`.

## v1.8.0 — MCP integrations

### Added
- 4 MCP-aware skills: `design-pr-review` (GitHub), `figma-token-sync` (Figma), `design-broadcast` (Slack + Notion), `design-system-qa` (5 testing layers).
- `docs/MCP-INTEGRATION.md`, `docs/FIGMA-INTEGRATION.md`.

## v1.7.0 — Coverage push + automation

### Added
- 8 component specs (Alert, Tooltip, Form-controls, Skeleton, Progress, Avatar, Breadcrumb, Accordion).
- Audit tools: `frontmatter-check.py`, `link-check.py`, `korean-copy-check.py`, `check-coverage.py`.
- HTML preview generator (`tools/preview/render-tokens.py`).
- CI: GitHub Actions workflow for audits.

## v1.0.0 — Initial release

Foundation: AGENTS.md / CLAUDE.md / README.md / refs / knowledge / skills / commands / agents structure. Design tokens (W3C DTCG format), color (OKLCH-aware), typography, spacing, components (Ant Design + MUI + shadcn-ui canonical synthesis), accessibility (WCAG 2.1 AA), Korean i18n (Hangul typography, payments / 본인인증, app store conventions, fintech UX patterns). 11 worked component specs. 6 skills. Initial commands.
