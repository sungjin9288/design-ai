# Changelog

User-facing release notes for design-ai. Versions follow semver.

## v5.2.0 — Image Console and release reliability (2026-09)

Image Console release hardening shipped in v5.2.0 and is published behavior. The deterministic local mock loopback flow makes no Prompt Guide/provider-network call. Published registry smoke passed; a live Prompt Guide call and a real provider generation/edit remain unverified. Canonical receipt: [`docs/integrations/prompt-guide-image-prompts.md`](docs/integrations/prompt-guide-image-prompts.md).

### Added

- Added current-source Image Console release hardening: the canonical `image`
  help topic, reusable package/registry smoke contract, and bounded local mock
  loopback flow now cover packaged static assets, health, catalog, generation
  draft validation, pre-approval rejection, and one approved deterministic
  local provider execution. The flow uses isolated temporary roots, reaps its
  child process, preserves repository status, and never records API keys, raw
  responses, or the full compiled prompt.
- The deterministic local mock loopback smoke makes no Prompt Guide/provider-network call; registry live coverage remains pending future publish.
- The exact current-source test, audit, package, documentation, packed-smoke,
  browser-QA, and external-verification receipt is maintained once in the
  [Prompt Guide Image Console](docs/integrations/prompt-guide-image-prompts.md)
  integration guide; registry live coverage remains pending future publish.
- Added focused P11 implementation-evidence assertion, package-adapter, request
  fixture, and phase-authority modules. Installed-bin and one-shot npm smoke each
  execute `review-evidence` once at their existing command blocks.
- Added an independently runnable implementation-evidence contract self-test for
  the canonical callable AST, positive and failure fixtures, phase ordering, and
  unsupported executors, then connected it to `release:self-test`.
- Added focused review-smoke modules for inspect, review comparison, P6 review,
  P7 handoff, P8 receipt, P9 intake, P10 scope proposal/approval, and browser
  review evidence. Installed-bin and one-shot npm smoke now each advance the
  same explicit P6-P10 phase authority at their existing command blocks.
- Added focused Website Console smoke-domain fixture and assertion modules for
  JSON/Markdown scenarios, package intake/evidence payloads, and MCP/bundle
  contracts. The stable smoke entry point imports those responsibility modules
  directly, and installed-bin plus one-shot npm paths now advance one
  explicit ordered phase authority from their real command blocks without
  changing CLI behavior or coverage; registry smoke retains the byte-stable
  normal Website Console fixture.
- Added an independently runnable Website Console smoke-contract self-test with
  a byte-stable SHA-256 snapshot, command-order checks, and negative fixtures for
  unsafe guidance, malformed probe payloads, and repair-state drift.
- Added a zero-dependency skill contract gate for all 21 shipped skills. It
  validates Agent Skills metadata, explicit activation wording, progressive
  disclosure, playbook inputs and completion criteria, local source authority,
  line budgets, and inventory parity across plugin, capability manifest, and
  repository directories.
- Added isolated negative fixtures for skill metadata, playbook linkage,
  completion criteria, unstable pricing guidance, and manifest drift, then
  connected both fixture and repository checks to `release:self-test`.
- Added a machine-checked three-slot external pilot launch packet for marketing
  sites, app workflows, and Korean commerce or fintech interfaces. Recruitment,
  owner consent, data boundaries, measurement, and stop conditions are reusable
  without implying a participant, result, feedback, or adoption claim.
- Added a privacy-safe GitHub Issue Form and deterministic validator for public
  external-pilot candidate intake, plus a public three-slot recruitment issue.
  Applications remain separate from owner consent, target access, implementation,
  feedback, and adoption evidence.
- Added a P16 marketing-site pilot operations guide, Korean-first direct outreach
  cadence, anonymous recruitment status, fixed-key problem hypothesis template,
  lifecycle labels, and deterministic boundary checks. The operating layer keeps
  the P14 three-slot baseline unchanged and blocks capability selection until two
  distinct project owners reproduce the same source-backed problem.

### Changed

- Added release metadata negative fixtures for current-source Image Console
  evidence and made package contents require the complete Image Console
  runtime, static assets, server configuration, and
  `image-prompt-contract.d.ts`; registry smoke mirrors the contract only for a
  future post-publish run and does not claim live registry coverage here.
- Split only the P11 implementation-evidence smoke contract into direct focused
  imports while preserving stable package wrapper names, real command execution,
  input and Git mutation guards, return and exception behavior, failure messages,
  and the 716-command packed sequence. Pilot, Website Console runtime, SDK smoke,
  registry runtime, and lifecycle domains are unchanged.
- Split the existing review assertions into direct responsibility imports while
  retaining stable entry-point callable names, real command execution, and exact
  assertion failure behavior. Implementation evidence, pilot evidence, learning
  proposal review, product runtime, SDK smoke, and lifecycle coverage are
  unchanged.
- Split the package and registry learning smoke assertions into directly imported
  profile, transfer, relevance/eval, agent-backlog, skill-proposal report/review,
  and skill-proposal apply-plan modules. The stable smoke entry points still own
  command execution, while responsibility-named validators preserve exact
  payload, report, patch, template, sidecar, fixture, and failure contracts.
- Moved 42 Website Console contract constants and shared site/probe/repair
  validators into focused contract and validator modules while preserving the
  existing `smoke_assertions`, local package-smoke, and registry-smoke surfaces.
- Standardized every `SKILL.md` as a concise discovery and activation contract
  that delegates execution to its linked `PLAYBOOK.md`, without duplicating the
  workflow or adding a public command, SDK export, or MCP tool.
- Replaced guessed Figma and collaboration MCP operation names with active
  tool-schema inspection, and replaced dated capability and fixed recurring-price
  statements with durable source-verification rules.

### Fixed

- Contain provider stdin failures when an adapter exits before reading input,
  without terminating the Image Console gateway.
- Bind editing approval to the compose-time source descriptor, rejecting even
  coherent image/manifest replacement before creating a job.
- Consume approval immediately, ignore stale job success/failure responses,
  and preserve the current source selection during Image Console asset refresh.
  Keep asset-list failures actionable and hide stale draft metadata after reset.
- Restored GitHub Pages project paths in multilingual alternate links and mirrored
  the combined sitemap at locale roots. Head alternate links now provide stable
  language-root sitemap discovery while visible language controls retain contextual
  page links, removing homepage and nested-page 404s without changing local preview
  navigation.

### Verified

- All 8 audits passed for the v5.2.0 release candidate.
- `npm run release:check` passed with 891/891 Node tests, 884 packaged files,
  0/0 documentation-policy warnings, release self-tests, and installed-bin plus
  one-shot `npm exec` smoke against the packed tarball.
- Image Console browser QA passed at 1440×900 and 390×844 with no horizontal
  overflow, keyboard tab operation, skip-link focus transfer, a 3 px visible
  focus ring, 44 px minimum controls, reduced-motion handling, WCAG 2.1 AA
  contrast, and no console warnings or errors before the intentional
  missing-provider request.
- The exact current-source receipt remains in the
  [Prompt Guide Image Console](docs/integrations/prompt-guide-image-prompts.md)
  integration guide. A live Prompt Guide call, real provider execution, and
  post-publish registry smoke remain unverified until their separate gates run.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 5.1.0 → 5.2.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables

- Local operators can compose, validate, explicitly approve, generate, persist,
  and later edit image assets through one loopback-only console without exposing
  Prompt Guide credentials to the browser or provider process.
- Maintainers can verify the Image Console through focused contracts, packaged
  installed-bin and one-shot smoke, browser evidence, and release metadata that
  fails closed when the canonical receipt disappears.
- Skill and smoke-domain hardening keeps the existing review, learning, Website
  Console, and external-pilot contracts independently testable as the package
  grows.

## v5.1.0 — Verified design delivery loop (2026-07)

Turns the first design artifact into a traceable review-to-implementation loop. The
release adds deterministic quality inspection, optional browser evidence, exact
handoffs, target-repository intake, immutable scope approval, implementation and
pilot evidence, and verified before-and-after comparison without weakening human
approval or claim boundaries.

### Added
- Added CLI `design-ai review-compare`, SDK `compareReviews()`, MCP `design_ai_compare_reviews`, and Website Console import over one exact-source before-and-after design review operation.
- Added `design-ai-review-comparison` v1 and compact summary contracts with matching subject and context guards, all eight lens transitions, and resolved, persistent, introduced, or uncertain finding decisions.
- Added CLI `design-ai review-pilot`, SDK `recordPilotEvidence()`, MCP `design_ai_review_pilot`, and Website Console import over one exact-source real-pilot evidence operation.
- Added strict `design-ai-pilot-record` and derived `design-ai-pilot-evidence` v1 contracts for consent, first-value time, finding decisions, approval friction, implementation completion, unresolved risk, and real/synthetic/inferred/unverified claim separation.
- Added CLI `design-ai review-evidence`, MCP `design_ai_review_evidence`, and Website Console import over one read-only implementation-evidence operation.
- Added exact-source implementation-evidence request and result v1 contracts that compare the approved Git baseline, enumerate every current changed file, preserve failed or missing verification, and hash only declared regular evidence files.
- Added CLI `design-ai review-scope` and `review-scope-approve`, SDK `proposeImplementationScope()` and `approveImplementationScope()`, MCP `design_ai_review_scope` and `design_ai_approve_review_scope`, and Website Console proposal/approval import over shared exact-source contracts.
- Added immutable implementation-scope request, proposal, and approval v1 artifacts with derived repository baseline, file selectors, pre-existing-change ownership, risks, verification commands, and explicit implementation versus release gates.
- Added CLI `design-ai review-intake`, MCP `design_ai_review_intake`, and Website Console intake import over one shared read-only target repository operation.
- Added `design-ai-target-repo-intake` v1 with exact receipt linkage, declared and resolved path identity, bounded root project metadata, unfiltered local Git evidence, remaining approvals, and an unauthorized implementation-scope gate.
- Added `design-ai review-handoff-verify`, SDK `verifyReviewHandoff()`, MCP `design_ai_verify_review_handoff`, and Website Console receipt import over one shared read-only validator.
- Added `design-ai-review-handoff-receipt` v1 with exact handoff source identity, matching self-declared consumer, derived evidence summary, unchanged remaining approvals, and pending target-repository intake.
- Added `design-ai review-handoff`, SDK `reviewHandoff()`, MCP `design_ai_review_handoff`, and Website Console handoff import over one shared read-only operation.
- Added exact source-byte envelopes, optional quality/browser evidence linkage, named but undelivered recipients, pending consumer validation, and prepared implementation-handoff stages to `design-ai-review-handoff` v1.
- Added the canonical `design-ai review`, SDK `reviewHtml()`, and MCP `design_ai_review_html` workflow over one shared read-only operation.
- Added exact source-byte identity, nested start and quality contracts, SHA-256 artifact linkage, ordered review stages, and a pending human decision to the `design-ai-review-workflow` v1 contract.
- Added Website Console review-session import, original-byte export, nested artifact rendering, and a responsive semantic stage timeline.
- Added CLI-only `design-ai benchmark` with strict/list/JSON modes over four packaged synthetic journeys: new design, existing-product refactor, Korean product UX, and multi-agent handoff.
- Added strict start and design-artifact runtime validators, exact finding-id regression comparisons, SHA-256 suite/input/contract/case-study evidence, consumer-validated transfer envelopes, and four claim-bounded public case studies.
- Added five versioned Korean product review packs for fintech, commerce, SaaS, content, and game workflows across CLI, SDK, and MCP, plus Website Console quality/browser contract review.
- Added approval-gated `design-ai verify-browser` as a CLI-only sidecar runner for responsive, keyboard, accessibility, reduced-motion, loading, error, and repeated-action evidence over a canonical static quality report.
- Added exact adapter network-policy attestation, post-run source-report digest comparison, POSIX process-group timeout termination, complete screenshot/accessibility artifact checks, run-interval timestamps, and explicit `unverified` boundaries for restored intermediate source mutation, adapter target-repository writes, and external writes.
- Added `design-ai inspect <source.html> --brief text`, SDK `inspectHtml()`, and MCP `design_ai_inspect_html` over one dependency-free operation that returns the canonical eight-lens quality report.
- Added deterministic static checks for document language, supported interactive-control names, image alternatives, and the mobile viewport contract, with concrete source locations and complete Before/After/Why evidence.
- Added the versioned `design-ai-quality-report` v1 schema and a dependency-free validator that requires all eight interface-quality lenses, concrete evidence, derived summary counts, and explicit permission boundaries.
- Added a Korean fintech settings benchmark with one confirmed accessibility finding and clearly marked runtime evidence gaps.
- Added a product specialization plan that sequences one start flow, a read-only quality engine, optional browser verification, Korean product packs, Website Console review, and benchmark-backed adoption proof.
- Added `design-ai start`, SDK `start()`, and MCP `design_ai_start` over one shared operation that returns a route, existing design contract, unexecuted review state, next command, and explicit performed/intended effect boundary.
- Added a Website Console Start tab that validates and persists the canonical start JSON, displays declared references without claiming inspection, copies the next command and design contract, and exports the unchanged payload.

### Changed
- The current source capability contract grows from 28 to 29 MCP tools and from 19 to 20 SDK exports while retaining exactly three opt-in learning-profile write tools.
- Review comparison calls a missing finding resolved only when its candidate lens passes. Target mutation, commit, push, deployment, external writes, production quality, and adoption remain outside the read-only contract.
- `design_ai_review_pilot` now accepts opt-in `compact: true` for large exact-source
  chains. It validates the full P12 artifact first, then keeps source identities,
  consent, metrics, claims, issues, next action, and safety boundaries while
  omitting duplicated nested source bodies. The backward-compatible default remains
  the full artifact.
- Website Console mobile section navigation now stays in one horizontally
  scrollable 44-pixel row, restores focus after tab activation, and uses a solid
  focus outline with at least 5.62:1 contrast on its active surface.
- Added a consented Website Console real-pilot case with exact first-value,
  decision, approval, implementation, browser, package, and claim-boundary
  evidence. A fresh-process MCP proof records both the explicit full-output limit
  and the verified compact response.
- The current source capability contract grows from 27 to 28 MCP tools and from 18 to 19 SDK exports while retaining exactly three opt-in learning-profile write tools.
- Pilot evidence remains read-only and bounded; identity, feedback authenticity, external adoption, production quality, business outcomes, commit, push, deployment, and external writes are not established by the contract.
- The current source capability contract grows from 26 to 27 MCP tools while the SDK remains at 18 exports and exactly three opt-in learning-profile write tools.
- Implementation evidence remains pre-commit and read-only; commit, push, deployment, migration execution, network calls, and external writes stay separately gated.
- The current source capability contract grows from 24 to 26 MCP tools and from 16 to 18 SDK exports while retaining exactly three opt-in learning-profile write tools.
- Scope approval authorizes only listed source inspection and target-file selectors; commit, push, deployment, migration execution, network calls, and external writes remain separate gates.
- The current source capability contract grows from 23 to 24 MCP tools while the SDK remains at 16 exports and exactly three opt-in learning-profile write tools.
- Receiving agents can now prove which local checkout they inspected without reading application source, following symbolic links, starting a preview, calling a network, or authorizing implementation.
- The current source capability contract grows from 22 to 23 MCP tools and from 15 to 16 SDK exports while retaining exactly three opt-in learning-profile write tools.
- Receiving agents can now record contract validation without claiming identity, transport, acceptance, target-repository inspection, or implementation.
- The current source capability contract grows from 21 to 22 MCP tools and from 14 to 15 SDK exports while retaining exactly three opt-in learning-profile write tools.
- Review sessions can now be prepared for another agent without claiming transport, acceptance, target-repository inspection, or implementation.
- The current source capability contract grows from 20 to 21 MCP tools and from 13 to 14 SDK exports while retaining exactly three opt-in learning-profile write tools.
- Existing HTML review now has one canonical entry point; browser verification and implementation remain separate approval-gated stages.
- Product specialization proof is explicitly `synthetic-fixture` evidence with `adoptionClaim: none`; it reports false negatives, false positives, and missing required uncertainty without an aggregate quality score.
- The current source capability contract grows from 18 to 19 MCP tools and from 11 to 12 SDK exports while retaining exactly three opt-in learning-profile write tools.
- CLI inspection reads one explicit regular HTML file up to 1 MB and rejects symbolic links; SDK and MCP inspect supplied strings. None executes scripts, opens a browser, resolves linked resources, writes files, or mutates a target repository.
- Static inspection preserves original source lines, ignores template, `noscript`, `inert`, and HTML raw-text markup, retains SVG title names, excludes hidden descendant text from button names, requires an effective device-width viewport, and returns structured MCP overflow errors instead of malformed truncated JSON.
- The architecture and package-content audit now treat the quality schema, validator, benchmark, and contract documentation as release-owned artifacts.
- The current source capability contract grows from 17 to 18 MCP tools and from 10 to 11 SDK exports while retaining exactly three opt-in learning-profile write tools.
- Packed-tarball and public-registry smoke now require the start payload to preserve an embedded design contract and empty performed local-write, target-mutation, and external-action arrays.

### Verified
- All 8 audits passed for the v5.1.0 release candidate.
- `npm run release:check` passes for P13 with 832 tests, all 8 strict audits, 774 packaged files, a 0/0 documentation warning policy, SDK import smoke, and review-comparison smoke through installed-bin plus one-shot `npm exec` paths.
- Website Console full comparison import, reload restore, exact-byte export, and responsive rendering pass at 1440px and 390px with a working keyboard skip link, 44px minimum visible navigation height, no horizontal overflow, no console warnings or errors, and matching exported SHA-256.
- A fresh stdio MCP process lists all 29 current-source tools and returns a 3,934-byte compact `design_ai_compare_reviews` result with matching baseline and candidate hashes plus unchanged read-only and claim boundaries.
- PR #47 passed required audit, documentation, package, and unit-test checks before
  squash merge. The resulting main-branch audit, real VS Code e2e, documentation
  build, and GitHub Pages deployment also passed at commit `83479b2`.

- `npm run release:check` passes for P11 with 805 tests, all 8 strict audits, 757 packaged files, a 0/0 documentation warning policy, and installed-bin plus one-shot `npm exec` implementation-evidence smoke.
- A fresh MCP process called `design_ai_review_evidence`, preserved two declared verification artifact hashes, executed no verification command itself, and returned `attention-required` for three unverified runtime observations plus one remaining risk.
- Website Console implementation-evidence import, exact-byte export, clear-to-approval restore, and responsive rendering passed at 1440px and 390px with matching SHA-256, 44px minimum visible button targets, no horizontal overflow, and no console warnings or errors.
- PR #45 passed required audit, documentation policy, package integrity, and CLI plus VS Code library unit-test checks in CI run `29424169441` before merge.
- `npm run release:check` passed for P10 implementation scope approval with 795 tests, 8 strict audits, 749 packaged files, a 0/0 documentation warning policy, SDK import smoke, and installed-bin plus one-shot proposal/approval smoke.
- A fresh MCP process created and approved one exact scope while keeping local writes, target mutation, application-source reads, implementation, and external writes unperformed; commit, push, and the declared external write remained separate gates.
- Website Console approval import, exact-byte export, clear-to-proposal restore, and responsive rendering passed at 1440px and 390px with matching SHA-256, 44px minimum visible button targets, no horizontal overflow, and no console warnings or errors.
- PR #44 passed required audit, documentation policy, package integrity, and CLI plus VS Code library unit-test checks in CI run `29418999657` before merge.
- `npm run release:check` passed for the P9 target repository intake with 778 tests, 8 strict audits, 739 packaged files, a 0/0 documentation warning policy, and installed-bin plus one-shot intake smoke.
- Website Console intake import, exact JSON export, clear, and receipt restore passed at 1440px and 390px with 44px minimum visible button targets, no horizontal overflow, no console warnings or errors, and matching exported SHA-256.
- A fresh Codex process called `design_ai_review_intake` through the configured local MCP server and confirmed exact target path and repository URL matches without target mutation, application-source reads, or implementation authorization.
- PR #43 passed required audit, documentation policy, package integrity, and CLI plus VS Code library unit-test checks in CI run `29413686416` before merge.
- `npm run release:check` passed for the P8 consumer validation receipt with 767 tests, 8 strict audits, 734 packaged files, a 0/0 documentation warning policy, SDK import smoke, and installed-bin plus one-shot receipt smoke.
- Website Console receipt import, exact-byte export, clear, and handoff restore passed at 1440px and 390px with 44px minimum visible button targets, no horizontal overflow, no console warnings or errors, and an exported SHA-256 matching the imported receipt.
- A fresh Codex process called `design_ai_verify_review_handoff` through the configured local MCP server. Fresh Claude execution remained blocked before the MCP call by organization-level Claude Code subscription policy, so no Claude receipt validation is claimed.
- PR #42 passed required audit, documentation policy, package integrity, and CLI plus VS Code library unit-test checks in CI run `29408587642` before merge.
- `npm run release:check` passed for the P7 review evidence handoff with 760 tests, 8 strict audits, 728 packaged files, a 0/0 documentation warning policy, SDK import smoke, and installed-bin plus one-shot handoff smoke.
- Website Console handoff import and original-byte export passed at 1440px and 390px with no horizontal overflow, undersized visible buttons, console warnings, or console errors; exported SHA-256 matched the imported file.
- `npm run release:check` passed for the P6 canonical review workflow with 749 tests, 8 strict audits, 722 packaged files, a 0/0 documentation warning policy, SDK import smoke, and canonical review smoke through installed-bin plus one-shot `npm exec` paths.
- `npm run release:check` passed for the P5 product specialization benchmark with 736 tests, 8 strict audits, 715 packaged files, a 0/0 documentation warning policy, and `design-ai benchmark --strict --json` smoke through installed-bin plus one-shot `npm exec` paths.
- `npm run release:check` passed for the approval-gated browser verification runner with 706 tests, 8 strict audits, 682 packaged files, a warning-free documentation build, and functional browser sidecar smoke through installed-bin plus one-shot `npm exec` paths.
- `npm run release:check` passed for the P2 read-only quality engine with 694 tests, 8 strict audits, 676 packaged files, a warning-free documentation build, and installed-bin plus one-shot `npm exec` smoke coverage.
- Focused quality-engine, CLI, SDK, MCP, help, dispatch, and capability contract tests pass, including benchmark reproduction and unchanged-source assertions.
- Focused design quality contract tests cover the canonical fixture, mutation boundaries, required evidence and lenses, and derived summary consistency.
- `npm run release:check` passed with 656 tests, 8 strict audits, 668 packaged files, a warning-free documentation build, and installed-bin plus one-shot `npm exec` smoke coverage.
- `npm run release:check` passed for the P1 source candidate with 669 tests, all 8 strict audits, 672 packaged files, a warning-free documentation build, and installed-bin plus one-shot `npm exec` start smoke coverage.
- Browser verification passed at 1440px and 390px with no horizontal overflow, 44px minimum visible button targets, working skip-link focus transfer, and zero console warnings or errors.
- Pull request #35 passed audits and size budget, package integrity, documentation policy, and CLI plus VS Code library unit-test checks.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 5.0.0 → 5.1.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- An installed agent can move from one exact design review through handoff,
  consumer validation, target intake, approved implementation, evidence, pilot
  measurement, and before-and-after comparison without changing contract meaning
  across CLI, SDK, MCP, and Website Console.
- Teams can distinguish bounded improvement from missing runtime evidence,
  production quality, external adoption, and business impact instead of hiding
  those boundaries behind one score.

## v5.0.0 — Refactor foundation and release-integrity guards (2026-07)

Prepares the codebase for the planned structural refactor without changing the CLI, SDK, or MCP public names. Token extraction is now clearly separated as clone-only maintainer tooling, while the distributed agent surface contains only commands that work from the package.

### Changed
- Added a read-only linked-code preview readiness loop for Website Improvement. `design-ai site <workspace.json> --linked-preview`, MCP `design_ai_site_linked_preview`, and Website Console import/rendering share a `website-improvement-linked-preview` report that detects root project metadata and an existing manual start command without installing dependencies, starting a process, probing a URL, scanning source files, or mutating the target repository.
- Expanded the v5 source MCP inventory to 17 tools while keeping the SDK at 10 exports. Linked preview remains CLI/MCP-only because it reads an operator-selected local project path; packed-tarball smoke covers installed-bin and one-shot `npm exec` paths.
- Added a shared read-only `artifact` operation with `implementation-plan`, `critique-loop`, and `design-contract` modes. CLI `design-ai artifact`, SDK `artifact()`, MCP `design_ai_artifact`, and Website Console Prompt Generator now expose the same source, workflow, approval, verification, and Markdown contract; only an explicit CLI `--out` writes a local file.
- Expanded the v5 source capability contract to 17 MCP tools and 10 SDK exports while keeping exactly three opt-in learning-profile write tools. Packed-tarball smoke now exercises the artifact and linked-preview commands through installed-bin and one-shot `npm exec` paths.
- Added `design-engineering-review`, a 21st installable skill and 24th route for code/runtime interface craft review across purpose and frequency, response, spatial continuity, interruptibility, motion cohesion, performance, accessibility, and responsive resilience. Its strict artifact contract requires a craft scorecard, observed Before/After/Why findings, and inclusive runtime evidence.
- Added `knowledge/patterns/interface-craft.md` and a command-palette worked review, then connected the shared contract to `ux-audit`, `motion-designer`, and `website-improvement` without adding a new public slash command or production dependency.
- Public Claude command inventory is 16. The former `extract-tokens` prompt moved to `tools/extractors/README.md` and is excluded from plugin installation and npm packaging.
- `dashboard-design` once again includes `chart-types`, `chart-color-encoding`, and `realtime-data`, matching its documented contract.
- Pull requests run strict repository audits and a non-deploying MkDocs build under read-only repository permissions.
- Focused contract tests protect route references, package bins and exports, MCP tool order, closed input schemas, and the three explicit learning-write tools.
- `cli/lib/capability-manifest.json` is now the canonical identity contract for 24 routes, the 21/16/4 install inventory, 17 MCP tools, and 10 SDK exports. Runtime owners keep their implementation details, while parity tests and package smoke derive names and counts from this manifest.
- Route payload assembly now lives in one read-only operation shared by the CLI, SDK, and `design_ai_route` MCP tool. The remaining MCP tools retain their existing CLI subprocess boundary.
- Route definitions and ID validation now live in a pure catalog module, while scoring, reference enrichment, parsing, and eval behavior remain in the route engine behind compatibility exports.
- Python capability schema validation now lives in a dedicated audit leaf module, and package/registry smoke self-tests share one MCP protocol fixture covering list, invalid input, and direct route execution.
- Website Console source-bundle provenance and revalidation logic now lives in a dependency-free classic script loaded before the UI, with DOM, storage, graph, and Markdown rendering left in `app.js`.
- Coverage generation now has separate write and non-mutating check modes, and release workflows share a reproducible `release:preflight` before smoke-testing their final tarball once.
- Added the read-only `design_ai_site_bundle_handoff` MCP tool, which verifies a local Website Improvement bundle and returns a task-selectable target-repo prompt with a `pending-human-approval` contract. The tool makes no external calls and never mutates the target repository.
- Homepage implementation/refactor briefs now route to `website-improvement`; generated implementation prompts require read-only repo intake, exact scope disclosure, explicit approval, and real browser/accessibility/responsive evidence before close-out.
- Website Console fallback task IDs are deterministic, marketing-page responsive checks accept browser/viewport evidence instead of requiring email-client behavior, and package contents now require the Console stylesheet.

### Fixed
- Documentation builds now skip tracked files deleted in the current change instead of creating broken symlinks in `site-src/`.
- Public readiness and distribution docs now distinguish the published v4.65.0 baseline from this v5.0.0 release candidate.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run ci:local`, including Python syntax checks, the knowledge-size budget, VS Code extension compile and unit tests, MkDocs build, and the 0/0 warning policy.
- `python3 -B tools/audit/local-ci.py --docs-only`.
- Baseline comparison confirmed stable route IDs, CLI help, SDK exports, existing MCP tool identities, and write boundaries; the additive 15th MCP tool is read-only, and the tarball removes only `commands/extract-tokens.md`.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.65.0 → 5.0.0. The major version records removal of the former public `extract-tokens` command.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- The larger refactor can move internal modules behind explicit contract guards without silently changing the installed command, route, SDK, or MCP surfaces.
- Later adapter refactors can remove duplicated public-name lists without making runtime dispatch data-driven.

## Earlier releases

Entries for v4.65.0 and earlier moved to the
[changelog archive](docs/CHANGELOG-archive.md).
