# Release gates — full assertion detail

This file preserves the complete, unabridged text that previously lived in
`README.md`'s `## Status` and `## Contributing` sections. It exists so the
README can carry a short summary while this document keeps every factual
claim about what `release:check`, packed-tarball smoke, and registry smoke
actually verify. Nothing below has been dropped or reworded from the
original README prose — only split into bullets at natural boundaries
(", plus ", " also verifies ", "and ", etc.) for readability.

See `README.md` for the short version, [`docs/ROADMAP.md`](ROADMAP.md)
for the full phase log, and [`docs/PRODUCT-READINESS.md`](PRODUCT-READINESS.md)
for the current completion boundary.

## Status detail (published v4.65.0; source v5.0.0 release candidate)

Published **v4.65.0** remains the public baseline. The current source is the
**v5.0.0 release candidate**. Public npm publish, provenance-backed GitHub
Actions release, public registry smoke, Website Console MCP readiness, workspace
learning restore/eval coverage, handoff bundle verification, and 90%+
component coverage are complete.

Core design consulting workflows are locally release-ready. The website
improvement control tower is available as a zero-dependency static Web App at
[`docs/website-console/index.html`](website-console/index.html), plus a
`website-improvement` route/skill/command for:

- Site Profiles, audit checklists, MCP readiness, refactor prompts
- Browser-local handoff evidence tracking
- CLI/bundle evidence export with verified bundle evidence metadata
- Generated bundle contract verification
- Bundle repair preview/apply with repair report `--out file` output-file persistence
- Packed-tarball evidence preservation smoke coverage
- Handoff reports

Local learning preferences are available through `design-ai learn`, with:

- Starter profile bootstrap via preview-first `learn --init`
- Explicit `learn --feedback` keep/improve/avoid guidance
- Explicit `check --learn --yes` capture for local QA warning/failure results
- Read-only `learn --signals` registry reports that join learning audit, usage sidecar, eval signal files, check capture entries, deterministic agent development backlog actions, and workspace readiness without mutating `learning.json`
- Focused read-only `learn --agent-backlog` reports that expose only the local AI/agent next-action queue with JSON/Markdown output and strict gating
- `learn --signals --report --out learning-signals.md` Markdown handoff artifacts
- `learn --signals --strict` gating for warning/failing signal registry or backlog status
- Preview-only `learn --propose-skills` reports that convert repeated check-capture signals into candidate skill instruction deltas without editing skill files
- Adjustable `learn --propose-skills --min-evidence N` thresholds for stricter or faster local proposal review
- Read-only `learn --propose-skills --review-file skill-proposals.review.json` decision joins for applied/rejected proposal state
- Read-only `learn --propose-skills --review-file skill-proposals.review.json --review-check` review-file readiness checks for current proposals
- Read-only `learn --propose-skills --review-file skill-proposals.review.json --apply-plan` accepted proposal apply plans for manual skill edits
- `--review-template --out skill-proposals.review.json` JSON decision scaffolds
- `--report --out skill-proposals.md` Markdown review artifacts
- Preview-only `--patch --out skill-proposals.patch` unified diff handoffs for manual review
- `learn --propose-skills --strict` gating when proposal review or upstream signal readiness is pending
- Read-only `design-ai workspace` dogfood readiness snapshots for git, canonical repository remote/metadata alignment, learning, optional or sibling `--learning-usage` sidecar summaries with stale selected-id/profile-mismatch readiness warnings
- Optional `--learning-eval` checkpoint summaries with freshness metadata
- Automatic sibling `learning-eval.json` checkpoint detection
- Checkpoint freshness warnings when the active learning profile changed after checkpoint generation or no longer matches checkpoint metadata
- Shell-safe learning usage/eval next-action commands for local paths
- Usage-aware `learn --curate --usage-file` next actions when learning profile audit or usage sidecar drift needs review
- Companion `learn --curate --report --out learning-curation-report.md` workspace report next actions before archive cleanup
- Eval-template bootstrap next-action hints when a clean learning profile has entries but no checkpoint
- Release-script state with `--strict` readiness gating

`design-ai site` covers:

- Sample workspace generation, prompt template listing
- Deterministic MCP readiness checks through `--mcp-check`
- Opt-in read-only MCP probe checks through `--mcp-check --probes`
- Markdown or JSON MCP action plan export through `--mcp-plan`, `--mcp-plan --probes`, and `--mcp-plan --probes --json`
- Portable workflow graph export through `--graph --json`
- Complete handoff bundle export through `--bundle --out`
- Handoff bundle checksum/fingerprint and generated contract verification through `--bundle-check --strict --json`
- Handoff bundle comparison through `--bundle-compare --strict --json`
- Target-repo handoff prompt generation from a verified bundle through `--bundle-handoff --strict --json`
- Local handoff bundle repair through `--bundle-repair --yes --json`
- Refactor task generation, single prompt template export with task selection
- Validation/report/prompt generation from Website Console JSON exports

Additional learning surfaces:

- Full portable `learn --backup --json` profile export with safe `--out` file output and `--force` overwrite control
- Redacted portable `learn --redact --json` profile export for sharing from the local profile or portable JSON via `--from-file` / `--stdin`
- Non-mutating `learn --verify` import validation
- Read-only `learn --diff` profile comparison against portable JSON
- Preview-first full-profile `learn --restore` replacement from portable backups with automatic rollback backup and optional `--backup-file` path
- Read-only `learn --restore-backups` inventory for sibling rollback backups
- Preview-first `learn --restore-backups --prune --keep N` cleanup for older sibling rollback backups
- Portable `learn --import` dry-run/confirmed profile merge
- Query-filtered `learn --list --explain` / `learn --export` inspection without recency fallback
- Read-only `learn --audit` cleanup suggestions / `learn --stats`
- Read-only `learn --usage` reports for local prompt/pack usage sidecar activity
- Runnable `learn --eval-template` checkpoint generation from the active profile
- Read-only `learn --eval` checkpoint reports for deterministic local learning selection QA with `--strict` failure gating and sanitized checkpoint metadata
- Safe `learn --audit --fix --dry-run` previews plus confirmed `--fix --yes` cleanup
- Archive-first `learn --curate` preview/apply flow for duplicate and sensitive learning entries plus `learn --curate --report --out` Markdown audit trails and advisory usage review hints for profile mismatch, stale selected ids, and unused active entries
- Opt-in `prompt`/`pack --with-learning` with brief-relevance ranking, category/limit scoping, selection scoring metadata, learned-context audit summaries, and local `learning.usage.json` sidecar events that store selected entry ids plus a short brief hash instead of raw brief text

**AI model training or fine-tuning remains outside the shipped scope.**

The corpus has been audited under CI checks since v1.7. It currently runs 8 audits:
- Frontmatter validity
- Internal link resolution
- Korean copy quality
- Raw hex color hygiene in examples
- Integration walkthrough completeness
- Stale-content freshness
- Component coverage report freshness
- Top worked example QA for every routed workflow

All 8 pass on every commit to `main`.

## Reproducible gate structure (v5.0.0 candidate)

`npm run release:preflight` runs every non-publishing gate except packed-tarball
execution smoke:

- Unit tests
- All 8 strict audits
- Whitespace and package contents checks
- Release metadata and assertion self-tests
- Documentation build and warning policy

Strict coverage auditing calls `npm run coverage:check`, which compares the committed
`knowledge/COVERAGE.md` without rewriting it. Contributors use
`npm run coverage:generate` when an intentional capability change requires a new
report.

`npm run release:check` adds one packed-tarball smoke to the preflight. Tag workflows
run the preflight, build their final tarball, and smoke-test that same artifact once
before GitHub release or npm publication. This avoids validating one temporary
tarball and publishing another.

## release:check coverage

`npm run release:check` is the core gate before release PRs or tags. It covers:

- `npm test` CLI unit tests
- `npm run audit:strict` all 8 audits
- `git diff --check` whitespace checks
- `npm run package:check` package contents checks
- `npm run release:metadata` release metadata checks with release metadata JSON `product_readiness_checked: true` Product Readiness guard coverage
- `npm run release:self-test` release assertion self-tests (including audit runner exit-code and coverage timestamp preservation fixtures)
- `npm run package:smoke` packed-tarball smoke for installed-bin plus one-shot `npm exec --package <tarball>` paths, covering:
  - `design-ai workspace --strict --json` workspace strict failure/success readiness checks plus workspace `--learning-usage` sidecar summaries and workspace `--learning-eval` checkpoint summaries with freshness metadata plus `design-ai workspace` workspace learning restore-backups readiness with restore rollback backup inventory
  - `design-ai site --stdin --json` Website Console export validation
  - `design-ai site --stdin --linked-preview --strict --json` read-only linked-code preview readiness in installed-bin and one-shot paths, with process-not-started, URL-not-probed, and no-target-repo-mutation assertions
  - `design-ai site --stdin --next-actions --json --out file --force` Website Console next-action operator checklist output-file persistence
  - `design-ai site --stdin --next-actions --out file --force` Website Console next-action human checklist output-file persistence
  - `design-ai site --sample` Website Console sample workspace coverage
  - `design-ai site --intake-template` Website Console intake template coverage for JSON stdout, Markdown stdout, Markdown `--out`, JSON `--out`, and `--language ko` Korean JSON/Markdown plus Korean Markdown `--out` in installed-bin and one-shot paths
  - `design-ai site --from-intake` Website Console from-intake filled Markdown intake import coverage for workspace JSON stdout, stdin workspace JSON stdout, stdin next-actions JSON stdout, stdin next-actions JSON `--out` file output-file persistence, stdin next-actions human `--out` file output-file persistence, stdin workspace JSON `--out` file output-file persistence, workspace JSON `--out` file output-file persistence, from-intake task generation, stdin from-intake task JSON `--out` output-file persistence, from-intake task handoff bundle generation, stdin from-intake task handoff bundle generation, stdin handoff bundle generation, and from-intake handoff bundle generation in installed-bin and one-shot paths
  - `design-ai site --init` Website Console project init workspace coverage in installed-bin and one-shot paths
  - `design-ai site --init --bundle --out <dir>` Website Console init handoff bundle coverage in package bin path and one-shot paths
  - `design-ai site --prompt-list --json` Website Console prompt template listing
  - `design-ai site --stdin --mcp-check --json` Website Console MCP readiness check
  - `design-ai site --stdin --mcp-check --probes --json` Website Console MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command
  - `design-ai site --stdin --mcp-plan` Website Console MCP action plan
  - `design-ai site --stdin --mcp-plan --probes` Website Console MCP probe action plan
  - `design-ai site --stdin --mcp-plan --probes --json` Website Console MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage
  - `design-ai site --stdin --graph --json` Website Console workflow graph export
  - `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle
  - `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification, bundle digest/fingerprint verification, and generated bundle contract verification
  - `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison plus packed-tarball and public-registry smoke for warning-state Website Console bundle-compare strict failures where identical warning bundles keep `sameBundle: true` while exiting non-zero under `--strict`
  - `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest plus `--bundle-handoff --task task-content-quality --strict --json` task-selected bundle handoff
  - `design-ai site <bundle-dir> --bundle-repair --yes --json` Website Console bundle repair preview/apply drift recovery with repair report `--out file` output-file persistence, shared repair guidance smoke helpers, and shared repair report assertion helpers
  - `design-ai site --stdin --tasks` Website Console refactor task generation
  - `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation
  - Human `design-ai version` and machine-readable version metadata from JSON `design-ai version --json`
  - `design-ai help` top-level help, the `design-ai help --json` topic catalog with probe-capable Website Console site help usage, command alias help and functional alias output, command-specific help topic output, shared Website Console site help topic example smoke assertions including the `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown help example plus from-intake stdin help examples (`cat company-website-intake.ko.md | design-ai site --from-intake --stdin --out website-workspace.json --force`, `cat company-website-intake.ko.md | design-ai site --from-intake --stdin --next-actions --out website-next-actions.md --force`, `cat company-website-intake.ko.md | design-ai site --from-intake --stdin --tasks --out website-workspace.tasks.json --force`, `cat company-website-intake.ko.md | design-ai site --from-intake --stdin --bundle --tasks --out website-handoff-bundle`)
  - All three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input
  - Explicit `show --lines` output and `route --explain` output
  - Unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure
  - Unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure
  - Prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output
  - Prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations
  - Check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output
  - Human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output
  - JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation
  - JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage
  - JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation
  - JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation plus learn restore rollback backup verification plus learn restore `--backup-file` path coverage plus `design-ai learn --restore-backups` restore rollback backup inventory coverage plus `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage
  - JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation
  - Human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation
  - Query-filtered human learn list explanation and export JSON output
  - Brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording
  - Human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation
  - Human / JSON `design-ai learn --signals` learning signal registry plus `design-ai learn --signals --strict --json` strict gate plus learn signals `--out` file-write confirmation
  - Human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation
  - Human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate
  - Human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation
  - Human / JSON `design-ai learn --curate` archive-first curation output plus usage-aware curation JSON review
  - Human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan
  - Human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`
  - Human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output
  - Human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output
  - Human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output

Additional preserved guard phases under the same `npm run release:check` gate:

- Website Console bundle `mcp-probes.json` saved-payload guard phases through package contents, release self-tests, and packed-tarball smoke.
- Website Console bundle boundary metadata guard phases for bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.
- The Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.
- The Product Readiness release policy full gate evidence guard through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.

## Packed-tarball smoke coverage

In addition to the release:check coverage above, packed-tarball smoke also verifies:

- Route eval, prompt eval, and pack eval checkpoint output for installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai learn --signals --report --out learning-signals.md` Markdown signal reports, learn signals JSON `--out` file-write confirmations, and `design-ai learn --agent-backlog --report --out agent-backlog.md` focused agent backlog Markdown reports plus agent backlog JSON `--out` file-write confirmations and `design-ai learn --agent-backlog --strict --json` agent backlog strict gates, focused agent backlog readiness summaries, `optionalGapDetails` JSON field coverage, check index JSON field coverage, Markdown check index section coverage, and check-capture optional-gap semantics for installed-bin and one-shot `npm exec --package <tarball>` paths. That smoke coverage also preserves the optional refresh-only runbook selection reason so no-command agent backlog output treats refresh as status metadata, not an executable handoff command.
- `design-ai learn --propose-skills --min-evidence 3 --json` threshold skipping, learn skill proposals JSON `--out` file-write confirmations, `design-ai learn --propose-skills --report --out skill-proposals.md` Markdown review artifacts, `design-ai learn --propose-skills --review-file skill-proposals.review.json --json` read-only review decision joins, `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --json` read-only review-file readiness checks, `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --report --out skill-proposal-review-check.md` read-only review-check Markdown reports, `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --json` read-only accepted proposal apply plans, human apply-plan command contract summaries via `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` with the `Command contract` section, `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --report --out skill-proposal-apply-plan.md` read-only apply-plan Markdown reports, `design-ai learn --propose-skills --review-template --out skill-proposals.review.json` JSON review templates, `design-ai learn --propose-skills --patch --out skill-proposals.patch` unified diff handoffs, and `design-ai learn --propose-skills --strict --json` as an expected-failure skill proposal readiness gate for installed-bin and one-shot `npm exec --package <tarball>` paths.

## Registry smoke coverage

After npm publish completes, `npm run registry:smoke` verifies the public `npm exec --package` install path, including:

- Human `design-ai version` and machine-readable version metadata from JSON `design-ai version --json`
- `design-ai help` top-level help, the `design-ai help --json` topic catalog with probe-capable Website Console site help usage, functional aliases
- All three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input
- Explicit `show --lines` output and `route --explain` output
- Unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure
- Unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure
- Prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output
- Prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations
- Check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output
- Human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output
- Public registry JSON `design-ai learn --verify` output plus public registry learn verify `--out` file-write confirmation
- Public registry JSON `design-ai learn --backup` output plus public registry learn backup `--out` file-write confirmation
- Public registry human / JSON `design-ai learn --stats` profile summary output plus public registry learn stats `--out` file-write confirmation
- Human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan
- Human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`
- Human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output
- Human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output
- Human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output

Additional registry smoke assertions:

- Registry smoke also verifies public registry `design-ai workspace --strict --json` workspace strict failure/success readiness checks from the published package path.
- Registry smoke also verifies public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries with freshness metadata plus auto-detected learning usage sidecar summaries from the published package path.
- Registry smoke also verifies public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory from the published package path.
- Registry smoke also verifies public registry `design-ai site` Website Console export validation, including public registry `design-ai site --stdin --next-actions --json` next-action operator checklist contract with `mcpProbeCounts` probe count telemetry plus shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts plus public registry `design-ai site --stdin --next-actions --json --out file --force` next-action operator checklist output-file persistence plus public registry `design-ai site --stdin --next-actions --out file --force` next-action human checklist output-file persistence, sample workspace coverage, prompt template listing, MCP readiness, MCP readiness probes, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle, bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation, bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry plus package smoke self-test coverage for Website Console bundle MCP probe counts plus bundled Website Console `mcp-probes.json` saved probe evidence payload assertion instead of the full `site --mcp-check --probes --json` response, bundle-repair, refactor task generation, and task-selected prompt generation from the published package path.
- Registry smoke also verifies public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation, public registry `design-ai learn --feedback --from-file`, public registry `design-ai learn --feedback --stdin`, public registry JSON `design-ai learn --init` preview/apply output, and public registry learn init duplicate-skip output.
- Registry smoke also verifies public registry JSON `design-ai learn --restore` preview/apply output plus public registry learn restore `--out` file-write confirmation, public registry learn restore rollback backup verification, public registry learn restore `--backup-file` path coverage, public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage, and public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage.
- Registry smoke also verifies public registry JSON `design-ai learn --import` dry-run/apply output plus public registry learn import `--out` file-write confirmation plus public registry JSON `design-ai learn --redact` output, public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, and public registry learn redact `--out` file-write confirmation.
- Registry smoke also verifies public registry human / JSON `design-ai learn --audit` cleanup suggestion output plus public registry learn audit `--out` file-write confirmation and public registry `design-ai learn --audit --fix --dry-run` cleanup preview and confirmed apply output.
- Registry smoke also verifies public registry query-filtered learn list explanation/export JSON output, public registry brief-relevant prompt/pack learning selection and prompt/pack learning usage sidecar recording with public registry prompt/pack --with-learning, and public registry `design-ai learn --eval-template` checkpoint generation plus public registry generated checkpoint strict validation.
- Registry smoke also verifies public registry learning readiness Markdown report coverage so `design-ai learn --signals --report --out learning-signals.md` and `design-ai learn --agent-backlog --report --out agent-backlog.md` preserve the `Readiness check index` section from the published package path.

## Other release:check bar items

These are short items that were already concise in the README and remain there as well as here for completeness:

- Knowledge files use `<!-- hand-written -->` marker if hand-authored.
- Skill PLAYBOOKs include a verification phase checklist.
- Korean strings spelled out in Korean (no machine translation passing through).
- All audits pass.
- Before pushing for CI, run `npm run ci:local` when you need local parity with the non-publishing GitHub workflows. It wraps `release:check`, Python syntax checks, knowledge size budget, VS Code extension compile/unit tests, the MkDocs build, and the MkDocs warning policy used by the docs deployment workflow: no non-`refs/` warnings, with refs-only warnings capped at the accepted baseline.
