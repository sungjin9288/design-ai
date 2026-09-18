# Roadmap

## Image Console release evidence

Image Console release hardening shipped in v5.2.0 and is published behavior.
Published registry smoke passed; a live Prompt Guide call and a real provider
generation/edit remain unverified. The
deterministic local mock loopback flow covers
packaged static assets, health, catalog, generation draft validation, rejection
before approval, and one approved deterministic local provider execution through
installed-bin and one-shot packed-tarball paths. It makes no Prompt Guide/provider-network call, uses isolated temporary HOME, npm cache, provider, and asset roots, reaps child processes, and asserts unchanged repository status. Package contents require the complete
Image Console runtime, static, configuration, and
`cli/lib/image-prompt-contract.d.ts` artifacts.

The exact current-source test, audit, package, documentation, packed-smoke,
browser-QA, and external-verification receipt is maintained once in the
[Prompt Guide Image Console](integrations/prompt-guide-image-prompts.md)
integration guide.

## Phase 802 - Product completion design and Image Console correctness

- [x] Established the [overall completion plan](product-completion-plan.md),
  domain ownership, state lifetimes, and evidence-gated P17 follow-up sequence.
- [x] Reconciled EN/KO architecture with thin skill dispatchers and existing
  opt-in embedding retrieval.
- [x] Contained provider stdin failures, bound edit approval to the original
  asset snapshot, and prevented stale job responses from replacing newer UI state.
- [x] Added regression tests for each reproduced failure.
- [x] Complete browser generation/edit QA and the full local release gate;
  the canonical Image Console guide owns the latest measurement.

The baseline PR #62 CI passed at `dc329273ab26ce4ae428f4827fbfeac79eb2461e`.
This working-tree hardening requires its own verification; no new merge, tag,
publication, live provider result, or external participation is claimed.

## Phase 801 - Image Console release integration (v5.2.0)

- [x] Chose a backward-compatible minor release because the Image Console and
  prompt-generation workflow are additive and keep the existing CLI, SDK, MCP,
  learning, and approval boundaries intact.
- [x] Aligned the package and Claude plugin manifests at v5.2.0.
- [x] Converted the accumulated Image Console, skill-contract, smoke-domain,
  external-pilot, and documentation work into one release entry.
- [x] Added a release-metadata transition guard that keeps checking the canonical
  Image Console receipt after the changelog moves from Unreleased to v5.2.0.
- [x] Completed local release and browser verification without a Prompt Guide or
  provider-network call.
- [x] Pass pull-request CI at `dc329273ab26ce4ae428f4827fbfeac79eb2461e`.
- [ ] Merge the exact reviewed release candidate after owner approval.
- [ ] Run a controlled live Prompt Guide and real provider generation/edit check
  when server-only configuration is available.
- [ ] Create and push the v5.2.0 tag only after merge approval; then verify npm,
  GitHub Release, public registry smoke, docs, and any Homebrew follow-up.

### Verified

- All 8 audits passed for the v5.2.0 release candidate.
- `npm run release:check` passed with 891/891 Node tests, 884 package files,
  0/0 documentation-policy warnings, release self-tests, and packed installed-bin
  plus one-shot npm smoke.
- Browser QA passed at desktop and mobile widths with keyboard navigation, visible
  focus, 44 px targets, reduced motion, WCAG 2.1 AA contrast, no horizontal
  overflow, and clean console output before the expected missing-provider error.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 5.1.0 → 5.2.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables

- The complete approval-gated Image Console can be reviewed and installed under
  one candidate identity without representing its mock proof as a live provider
  result or a published package.
- The same PR can prove that release-facing documentation, package contents,
  smoke contracts, and browser evidence describe the same source tree.

### What's still ahead

- Fresh CI for subsequent source changes, reviewer approval, merge, controlled live integration when
  credentials exist, tag workflows, npm/GitHub publication, public registry
  smoke, and post-publish distribution verification.

## Phase 800 - Implementation-evidence smoke domain extraction (P17B.5)

- [x] Materialized and verified the exact P17B.4 dirty baseline at
  `695721ba102d3d2f2c2bd0224e862fb0d0198b70` before editing; the pre-edit
  716-command packed smoke passed in 581.77 seconds.
- [x] Moved only the P11 implementation-evidence assertion into a focused domain
  while preserving its `smoke_assertions` import name, exact AST digest, and all
  seven `SystemExit` failure expressions.
- [x] Added a focused package adapter, pure request fixture builder, and separate
  installed-bin and one-shot npm P11 phase authorities without moving real
  command execution or the stable wrapper guards out of `package-smoke.py`.
- [x] Added an independently runnable contract self-test for the AST snapshot,
  positive and existing failure fixtures, phase-sequence negatives, and
  unsupported executors, then wired it into `release:self-test`.
- [x] Kept all five new modules below 400 lines and every new or moved function at
  or below 79 lines; P12 pilot, Website Console runtime, SDK smoke, registry
  runtime, lifecycle coverage, dependencies, migrations, and package 5.1.0 are
  unchanged.
- [x] Preserved the 4387-byte registry Website Console fixture and the exact
  716-command normalized sequence SHA-256
  `0654a8730d42526860bb1d00c16f1c828395ffd0aca448a1f137fcb30fd24a46`.
- [x] Passed the full release gate: 832 Node tests, eight strict audits, 861
  packaged files, 0/0 documentation warnings, release self-tests, and actual
  packed installed-bin plus one-shot npm smoke in 680.33 seconds.
- [ ] Extract pilot contracts after review and implementation evidence remain
  stable.
- [ ] Extract install/help/search/route lifecycle contracts last.

### Boundary

- P17B.5 changes only P11 smoke-test organization. It adds no dependency,
  migration, product-runtime change, CLI/SDK/MCP/Website Console API, package
  version, P16 state, external write, commit, push, publish, or deploy.

## Phase 799 - Review smoke domain extraction (P17B.4)

- [x] Used committed clean P17B.3 baseline
  `695721ba102d3d2f2c2bd0224e862fb0d0198b70` before source edits.
- [x] Moved only inspect, review comparison, P6 review, P7 handoff, P8 receipt,
  P9 intake, P10 scope proposal/approval, and browser-review assertions into
  focused modules while keeping stable smoke entry points and real command
  execution local.
- [x] Preserved the nine moved callable ASTs (including `review_workflow_digest`)
  and assertion failure-message behavior, the
  npm 5.1.0 package version, SDK smoke bytes, P16 evidence digest, registry
  fixture digest, and normalized packed command sequence.
- [x] Added the narrow P6-P10 phase authority for installed-bin and one-shot npm
  paths; focused negative cases reject missing, duplicate, reordered, and
  unknown phases without a generic command facade.
- [x] Kept all new modules below 400 lines and each new or moved function at or
  below 200 lines; P11/P12, learning proposal review, product runtime, SDK
  smoke, and install/search/show/route lifecycle remain untouched.
- [x] Passed the full release gate: 832 Node tests, eight strict audits, 858
  packaged files, documentation policy, release self-tests, and packed
  installed-bin/one-shot npm smoke with a disposable local npm cache.

### Boundary

- P17B.4 changes only review-smoke organization. It adds no dependency,
  migration, product-runtime change, CLI/SDK/MCP API, external write, commit,
  push, publish, or deploy.

## Phase 798 - Learning smoke domain extraction (P17B.3)

- [x] Applied and verified the sealed P17B.2 dirty baseline before editing.
- [x] Split learning smoke ownership into direct profile, transfer,
  relevance/eval, agent-backlog, skill-proposal report/review, and skill-proposal
  apply-plan imports while leaving command execution in the stable entry points.
- [x] Grouped backlog and apply-plan validation by contract responsibility instead
  of positional argument bags or mechanically split condition ranges; retained
  the original public failure messages.
- [x] Delivered 30 new learning modules below 400 lines. The largest is 394 lines,
  the largest new-module function is 173 lines, and the largest added entry-point
  scenario helper is 184 lines. The entrypoints are now 12,655 / 20,228 / 7,311
  lines (`smoke_assertions.py` / `package-smoke.py` / `registry-smoke.py`).
- [x] Preserved the actual 716-command packed-smoke sequence and normalized
  SHA-256 `0654a8730d42526860bb1d00c16f1c828395ffd0aca448a1f137fcb30fd24a46`.
- [x] Preserved the 4387-byte registry Website Console fixture, npm 5.1.0, and
  the immutable P16 program digest.
- [x] Passed focused self-tests, F821 and syntax checks, 832 Node tests, eight
  strict audits, the 845-file package-content check, documentation policy,
  release self-tests, and packed smoke.
- [x] Extracted the review domain in Phase 799.
- [x] Extracted implementation-evidence after review remained stable in Phase 800.
- [ ] Extract pilot contracts after review and evidence remain stable.
- [ ] Extract install/help/search/route lifecycle contracts last.

### Boundary

- P17B.3 changes only smoke-test architecture and verification. It adds no CLI,
  SDK, MCP, Website Console runtime, public API, package version, dependency,
  migration, P16 state, external write, commit, push, merge, publish, or deploy.
- JSON, Markdown, human output, patch, template, sidecar, workspace fixture,
  command coverage, and negative failure contracts remain authoritative.

## Phase 797 - Website Console smoke domain extraction (P17B.2)

- [x] Recorded the pre-extraction smoke harness sizes and focused self-test times.
- [x] Moved 42 Website Console contract constants into
  `smoke_domains/site_contracts.py` and eight shared command, MCP probe, and
  repair validators into `smoke_domains/site_validators.py`.
- [x] Preserved stable callable names, execution paths, and focused self-test
  paths for `smoke_assertions.py`, local package-smoke, and registry-smoke.
- [x] Added a byte-stable contract snapshot plus positive and negative fixtures
  in a separate, independently runnable self-test wired through
  `smoke:site-contracts:self-test` and the release self-test chain.
- [x] Proved exact parity with the pre-extraction values and command rewrite order.
- [x] Delivered 17 new modules and 64 extracted functions; all new files remain
  below 400 lines, the largest file is 354 lines, and the largest extracted
  function is 163 lines. The entrypoints are 12,655 / 24,494 / 9,078 lines
  (`smoke_assertions.py` / `package-smoke.py` / `registry-smoke.py`).
- [x] Preserved the exact 716-command packed-smoke sequence and normalized
  SHA-256 before and after extraction; recorded 1,444.11-second and
  914.29-second local wall-clock observations.
- [x] Moved Website Console JSON and Markdown fixtures into focused smoke-domain
  modules, including package-smoke intake/evidence/warning payload fixtures.
- [x] Moved Website Console assertion groups into focused responsibility modules
  imported directly by `smoke_assertions.py` without changing failure messages.
- [x] Added one explicit ordered Website Console runner plan shared by installed-bin
  and one-shot npm executors; their command factories and coverage remain separate.
- [x] Ran the full release evidence gate for the delivered source snapshot:
  832 Node tests, eight strict audits, package contents, documentation policy,
  release self-tests, and packed smoke all passed.
- [x] Extracted the learning profile and skill proposals domain in Phase 798;
  review, evidence, pilot, and lifecycle domains remain separate follow-up work.

### Boundary

- P17B.2 changes only smoke-test architecture and release verification. It adds no CLI,
  SDK, MCP, Website Console, package-version, publication, or P16 state change.
- The original smoke entry points, command sequence, JSON contracts, local versus
  registry coverage, and failure messages remain authoritative.

## Phase 796 - Skill contract and core hardening

- [x] Audited the 21-skill inventory against the Agent Skills specification,
  repository manifests, progressive-disclosure structure, and durable guidance.
- [x] Compared current open-source design-agent patterns and recorded explicit
  `ADAPT`, `DEFER`, and `REJECT` decisions in the
  [P17 hardening plan](P17-SKILL-AND-CORE-HARDENING-PLAN.md).
- [x] Added one shared Markdown frontmatter helper and preserved the existing
  knowledge frontmatter audit behavior.
- [x] Added a deterministic skill contract gate for metadata, activation wording,
  playbook linkage and sections, line budgets, manifest parity, and unstable
  capability or pricing claims.
- [x] Standardized all 21 skill dispatchers with an explicit `Use when` condition
  and one direct executable-playbook handoff.
- [x] Replaced guessed Figma and collaboration MCP operation names with active
  tool-schema detection, and removed dated capability and fixed-price guidance.
- [x] Connected isolated negative fixtures and the complete 21-skill check to
  `release:self-test`.
- [x] Re-ran the complete release gate: 832/832 tests, eight strict audits, 794
  packaged files, zero documentation warnings, and installed-bin plus one-shot
  package smoke passed.
- [ ] Split the Website Console, learning, review, and lifecycle smoke domains
  from the monolithic package-smoke harness without changing command order or
  contract output.

### Boundary

- P17A adds no CLI command, SDK export, MCP tool, Website Console stage, package
  version, npm publication, target-repository mutation, or external write.
- P16 recruitment and the P14 three-slot baseline remain unchanged; this internal
  hardening creates no external participation or adoption evidence.
- Source-grounded design-system compilation, interface content quality, objective
  visual evaluators, and project continuity remain separately gated follow-up
  phases.

## Phase 795 - External marketing pilot operations readiness

- [x] Defined one P16 operator flow from private invitation through Issue Form
  review, separate consent, bounded execution, feedback, publication, and close-out.
- [x] Limited the first active slot to one public marketing page and one real CTA
  or core flow with a safe local run or preview.
- [x] Added five mutually exclusive candidate lifecycle labels and documented the
  transition rule without treating intake metadata as consent.
- [x] Added a Korean-first direct invitation, one-reminder cadence, Day 14 public
  fallback, Day 28 blocked close-out, and an anonymous aggregate status record.
- [x] Added a Markdown hypothesis template with seven fixed problem keys, three
  required evidence sources, two-distinct-owner repetition, and one-capability
  tie-breaking rules.
- [x] Added deterministic operation checks that reject missing status labels,
  weakened owner independence, personal contact data, premature activity, a
  changed Issue Form link, or any byte drift in the P14 program baseline.
- [x] Merged PR #58 after required CI run `29503138956`, passed main audit run
  `29503275956` and Pages run `29503275933`, then verified the deployed P16 guide,
  issue #56, and five lifecycle labels at desktop and mobile widths.
- [x] Recorded source digests, local gates, Real-CI, public browser checks, and the
  remaining zero-participation boundary in
  [the P16 readiness record](https://github.com/sungjin9288/design-ai/blob/main/evidence/p16/operations-readiness.md).
- [ ] Send the first private invitation set after the maintainer supplies a private
  list of three to five trusted project owners.
- [ ] Start the first pilot only after a qualifying Issue Form and separate owner
  consent exist.

### Boundary

- P16 repository preparation creates no candidate, consent, participant, external
  result, feedback, repeated problem, or adoption evidence.
- `@design-ai/cli` stays at v5.1.0; no CLI command, SDK export, MCP tool, version
  bump, or npm publication is part of this phase.
- The P14 three-slot baseline remains byte-identical with three `awaiting-owner`
  slots and zero participation.
- If recruitment reaches Day 28 without a candidate, record external participation
  as blocked and add no capability from invented evidence.

## Phase 794 - External pilot recruitment activation

- [x] Defined the P15 funnel from public recruitment through candidate intake,
  separate consent, pilot execution, and evidence completion.
- [x] Added one privacy-safe GitHub Issue Form covering the three prepared pilot
  segments without requesting private source, credentials, personal contact data,
  analytics exports, local paths, or customer data.
- [x] Required owner authority, intake-only, separate-consent, private-artifact,
  and separately gated action acknowledgements.
- [x] Added deterministic form and chooser validation, including rejection tests
  for missing consent language, prohibited local-path requests, and mandatory
  public project references.
- [x] Connected the validator to `release:self-test` and required PR audit paths.
- [x] Created `external-pilot` and `pilot:intake` repository labels with an explicit
  no-consent intake boundary.
- [x] Merged PR #55, rendered the Issue Form from the default branch, published
  recruitment issue #56, and verified the linked P15 plan on GitHub Pages.
- [x] Recorded successful main Audit run `29498762177`, Pages run `29498762066`,
  the default-branch form source digest, and the live rendered surfaces in
  `evidence/p15/recruitment-launch.md`.

### Boundary

- A submitted issue is candidate intake only and authorizes no target action.
- The P14 launch inventory remains at three `awaiting-owner` slots with zero
  participants, targets, consent records, measurements, feedback, or adoption.
- Product capability selection still requires the same problem in two completed,
  independent pilot records from distinct owners.

## Phase 793 - Public Pages proof and external pilot launch framework

- [x] Fixed the GitHub Pages project-path drift in English and Korean alternate
  links without changing local preview routing.
- [x] Mirrored the combined multilingual sitemap at each locale root through a
  safe MkDocs post-build hook and added path-boundary unit coverage.
- [x] Passed PR #51 required CI run `29492331845` and GitHub Pages deployment run
  `29492452008`.
- [x] Verified public English desktop and Korean mobile views with no horizontal
  overflow, zero console warnings or errors, correct language links, and working
  skip-link focus.
- [x] Reverified the nested external-pilot document in both locales at 390 pixels
  after PR #53: language-root sitemap discovery, contextual navigation, no
  horizontal overflow, and zero console warnings or errors.
- [x] Verified both public sitemap paths return 200 with byte-identical SHA-256
  `3c8737fc5b8801eab0fbdae7f27517406e12bbf615c03569c4735e41e3aa1215`.
- [x] Prepared three external pilot slots for a marketing site, app workflow, and
  Korean commerce or fintech interface.
- [x] Added recruitment, owner-consent, measurement, data-boundary, and stop-condition
  templates plus a checker that rejects invented consent or measurements.

### Boundary

- The three slots have no identified participant, target repository, consent,
  result, feedback, or adoption evidence.
- A real project gets a separate source-linked evidence directory only after its
  owner records authority and consent.
- Another product capability remains blocked until the same problem appears in
  two independent pilot records from distinct project owners.

## Phase 792 - Public release and internal homepage pilot complete (v5.1.0)

- [x] Chose a backward-compatible minor release: the P6-P13 surfaces are additive
  and preserve the existing CLI, SDK, MCP, learning-write, and permission contracts.
- [x] Aligned package and Claude plugin manifests at v5.1.0.
- [x] Converted the accumulated P6-P13 changelog into the v5.1.0 release entry.
- [x] Corrected P13 completion evidence to PR #47, main commit `83479b2`, 832 tests,
  real VS Code e2e, and successful GitHub Pages deployment.
- [x] Passed the exact-tree release gate, PR #48 required CI, main Audit run
  `29485559867`, and Docs run `29485559848`.
- [x] Published the v5.1.0 tag through npm Trusted Publishing run `29485715200`
  and GitHub Release run `29485715193`.
- [x] Refreshed the Homebrew formula against the published tag archive and passed
  Ruby syntax, Homebrew style, temporary-tap source install, and formula test.
- [x] Run the documentation homepage through baseline, approved implementation,
  candidate, browser, and exact review-comparison evidence.
- [x] Prepared three consent-gated external pilot slots in Phase 793 without
  claiming adoption before another project owner actually participates.

### Verified

- The exact release tree passed 832 tests. All 8 audits passed, along with package smoke,
  PR #48 CI, main-branch audit, real VS Code e2e, documentation build, and Pages
  deployment.
- npm `latest` resolves to `@design-ai/cli@5.1.0` with SLSA provenance and public
  registry smoke. GitHub Release `v5.1.0` is public with a digest-attested package
  asset. The Homebrew source archive SHA-256 is
  `66bf42c34ad1bf65f7db0a644353094a5fba715720f108549f69b3f0580b22b1`.
- The documentation homepage internal pilot resolves both confirmed P1 findings,
  adds no persistent, introduced, or uncertain finding, and preserves its local
  multilingual sitemap warning. The Phase 793 deployed follow-up closes the public
  404 with zero console issues and two byte-identical 200 sitemap responses.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 5.0.0 → 5.1.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables

- Users can install the complete review-to-verified-iteration workflow instead of
  depending on unreleased main-branch source.
- Real homepage and external pilots can run against one public package identity.

### What's still ahead

- Real owner participation in the prepared consent-gated slots. A prepared slot
  is not adoption evidence.

## Phase 791 - Verified design iteration (merged in PR #47)

- [x] Added one exact-source `design-ai-review-comparison` v1 contract with all
  eight lens transitions and resolved, persistent, introduced, and uncertain
  finding decisions.
- [x] Added CLI `review-compare`, typed SDK `compareReviews()`, in-process MCP
  `design_ai_compare_reviews`, and Website Console full-artifact import, restore,
  render, and original-byte export.
- [x] Kept a missing finding uncertain until its candidate lens passes and rejected
  subject, review-context, finding-lens, source, and derived-decision drift.
- [x] Added compact output that omits only repeated source bodies while preserving
  references, SHA-256 digests, byte counts, decisions, approvals, and boundaries.
- [x] Added package-content, installed-bin, one-shot `npm exec`, SDK import, MCP,
  and shared Console contract coverage.
- [x] Verified Website Console at 1440px and 390px with no horizontal overflow,
  zero console warnings or errors, a working keyboard skip link, 44px minimum
  visible navigation height, and exact import/export SHA-256 parity.
- [x] Passed `npm run release:check` with 832 tests, all 8 strict audits, 774
  packaged files, a 0/0 documentation warning policy, SDK import smoke, and
  installed-bin plus one-shot comparison smoke.
- [x] Started a fresh stdio MCP process, found `design_ai_compare_reviews` in the
  29-tool inventory, and returned a 3,934-byte compact artifact with matching
  source hashes and unchanged permission and claim boundaries.
- [x] PR #47 passed required CI, was squash-merged as `83479b2`, and passed the
  main-branch audit, real VS Code e2e, documentation build, and Pages deployment.

## Phase 790 - Real pilot evidence (implemented, local verification complete)

- [x] Added strict pilot-record and derived pilot-evidence v1 contracts over exact
  P11 implementation evidence, original P6 workflow, and operator record sources.
- [x] Added CLI `review-pilot`, typed SDK `recordPilotEvidence()`, in-process MCP
  `design_ai_review_pilot`, and Website Console exact import/export and stage restore.
- [x] Added derived first-value, finding-decision, approval-friction,
  implementation, unresolved-risk, and four-class claim inventories.
- [x] Kept identity, feedback authenticity, external adoption, production quality,
  business outcomes, repository mutation, network calls, and release writes outside
  the read-only evidence boundary.
- [x] Added installed-bin and one-shot `npm exec` package smoke over all three exact
  sources with unchanged-input and unchanged-target assertions.
- [x] Completed one consented Website Console dogfood chain with a 14-second first
  useful artifact, one accepted finding, complete P11 evidence, and no unresolved
  implementation risk.
- [x] Passed the full local release gate with 815 tests, all 8 strict audits,
  warning-free docs, 766 packaged files, and installed-bin plus one-shot package
  smoke.
- [x] Verified desktop and mobile layout, keyboard focus restoration, 44-pixel
  targets, reduced-motion detection, clean console output, and an exact 416,114-byte
  Website Console import/export round trip.
- [x] Published the internal case with real, synthetic, inferred, and unverified
  claims kept separate.
- [x] Added opt-in compact MCP output and passed a fresh stdio process proof: the
  452,923-byte full response remains an explicit limit error, while the 4,021-byte
  summary preserves all three source hashes, byte counts, measures, issues,
  claims, next action, and safety boundaries.

## Phase 789 - Implementation evidence (implemented, unreleased)

- [x] Added exact-source implementation-evidence request and result v1 contracts.
- [x] Added read-only Git baseline comparison, approved selector matching, explicit
  pre-existing-change handling, and regular non-symlink evidence-file hashing.
- [x] Added CLI `review-evidence` and in-process MCP `design_ai_review_evidence`;
  SDK remains unchanged because local filesystem and Git access are explicit
  operator boundaries.
- [x] Kept test execution, source reads, mutation, commit, push, deployment,
  network calls, migration execution, and external writes outside the operation.
- [x] Added Website Console import, original-byte export, forged-contract rejection,
  compact evidence rendering, and `evidence -> approval -> proposal -> intake`
  restoration.
- [x] `npm run release:check` passes with 805 tests, all 8 strict audits, 757
  packaged files, a 0/0 documentation warning policy, and installed-bin plus
  one-shot `npm exec` package smoke.
- [x] A fresh MCP process calls `design_ai_review_evidence`, hashes only the two
  declared verification artifacts, executes no verification command itself, and
  preserves unverified browser, responsive, and accessibility proof as warnings.
- [x] Website Console evidence import, exact-byte export, clear-to-approval restore,
  and responsive rendering pass at 1440px and 390px with matching SHA-256, 44px
  minimum visible button targets, no horizontal overflow, and no console warnings
  or errors.
- [x] PR #45 passed required CI run `29424169441` before merge.

## Phase 788 - Implementation scope approval (implemented, unreleased)

- [x] Added exact-source `design-ai-implementation-scope-request`, proposal, and
  approval v1 contracts with derived repository baseline, selector, ownership,
  verification, risk, and gate validation.
- [x] Added `review-scope` and `review-scope-approve` CLI commands, two typed SDK
  exports, and two in-process MCP tools without adding a production dependency.
- [x] Kept proposal and approval operations read-only; approval authorizes only
  listed source reads and target-file changes while commit, push, deployment,
  migration execution, and external writes remain separately gated.
- [x] Added Website Console exact import/export, forged-artifact rejection, compact
  scope rendering, and `approval -> proposal -> intake` restore behavior.
- [x] Added installed-bin, one-shot `npm exec`, SDK import, MCP, package-content,
  and browser contract coverage.
- [x] `npm run release:check` passes with 795 tests, 8 strict audits, 749
  packaged files, a 0/0 documentation warning policy, and package smoke.
- [x] A fresh MCP process creates and approves the exact scope while preserving
  false performed-action flags and the separate commit, push, and external-write
  gates.
- [x] Website Console approval import, original-byte export, clear-to-proposal
  restore, and responsive rendering pass at 1440px and 390px with matching
  SHA-256, 44px minimum button height, no horizontal overflow, and no console
  warnings or errors.
- [x] PR #44 passed required CI run `29418999657` before merge.

## Phase 787 - Target repository intake (implemented, unreleased)

Grounds a validated review handoff in the exact local repository that would
receive implementation, without reading application source or authorizing edits.

### Delivered
- [x] Added CLI `design-ai review-intake` and MCP `design_ai_review_intake` over one shared read-only operation.
- [x] Added `design-ai-target-repo-intake` v1 with receipt digest linkage, declared and resolved target identity, bounded root project metadata, and local Git evidence.
- [x] Required exact consumer and path matches before inspection; rejected symbolic links without running Git through them.
- [x] Reported remote drift as blocked and existing worktree changes or detached HEAD as attention states without filtering target files.
- [x] Added Website Console intake-first validation, rendering, exact JSON export, independent clear, and earlier-evidence restoration.
- [x] Expanded the source capability contract to 24 MCP tools while keeping the SDK at 16 exports and retaining exactly three opt-in learning-profile write tools.
- [x] Added help, Console, package-content, installed-bin, one-shot `npm exec`, and shared smoke coverage.

### Boundary
- CLI reads one explicit receipt file and the receipt-declared local target. MCP reads one explicit absolute receipt path and inspects the same declared target path, avoiding oversized receipt transfer through the tool call.
- Inspection is limited to root `package.json`, supported lockfile and `index.html` existence, plus local Git metadata and status.
- No application source is read. No preview, dependency install, network request, target mutation, implementation, commit, push, or deployment is performed.
- SDK remains unchanged because repository filesystem access is not part of its curated source-string surface.

### Verification target
- [x] Focused contract, CLI, MCP, capability, Console, Git-boundary, help, and smoke self-tests pass.
- [x] `npm run release:check` passes with 778 tests, 8 strict audits, 739 packaged files, a 0/0 documentation warning policy, and installed-bin plus one-shot target-intake smoke.
- [x] Website Console intake import, exact JSON export, clear, and receipt restore pass at 1440px and 390px with matching SHA-256, 44px minimum visible button targets, no horizontal overflow, and no console warnings or errors.
- [x] A fresh Codex process called `design_ai_review_intake` through the configured local MCP server and returned exact path and remote matches, read-only mode, and false mutation, application-source-read, and implementation flags.
- [x] PR #43 passed required CI run `29413686416` before merge.

## Phase 786 - Consumer validation receipt (implemented, unreleased)

Lets the named receiving agent prove that it revalidated the exact handoff bytes
without turning contract validation into an identity, acceptance, or implementation
claim.

### Delivered
- [x] Added CLI `design-ai review-handoff-verify`, SDK `verifyReviewHandoff()`, and MCP `design_ai_verify_review_handoff` over one shared validator.
- [x] Added `design-ai-review-handoff-receipt` v1 with exact handoff source, byte count, SHA-256 digest, parsed value, evidence summary, unchanged approvals, and pending target-repository intake.
- [x] Required the self-declared consumer to match the named handoff recipient and rejected source, digest, evidence, approval, or boundary drift.
- [x] Added Website Console receipt-first import, nested handoff restoration, original-byte export, clear-to-handoff behavior, and responsive receipt rendering.
- [x] Expanded the source capability contract to 23 MCP tools and 16 SDK exports while retaining exactly three opt-in learning-profile write tools.
- [x] Added help, SDK, MCP, Console, package-content, installed-bin, one-shot `npm exec`, and shared smoke coverage.

### Boundary
- Contract validation does not verify consumer identity, transport, receipt by an external system, acceptance, target-repository intake, implementation, or delivery.
- CLI reads one explicit regular JSON file. SDK and MCP receive the exact source string. The operation writes nothing and makes no external request.
- The receipt leaves implementation unauthorized and carries every remaining approval forward unchanged.

### Verification target
- [x] Focused contract, CLI, SDK, MCP, capability, Console, and smoke self-tests pass.
- [x] `npm run release:check` passes with 767 tests, 8 strict audits, 734 packaged files, SDK import smoke, and installed-bin plus one-shot receipt smoke.
- [x] Website Console receipt import, export, clear, and handoff restore pass at 1440px and 390px with exact exported SHA-256, 44px minimum visible button targets, no horizontal overflow, and no console warnings or errors.
- [x] A fresh Codex process calls `design_ai_verify_review_handoff` through the configured local MCP server and returns the bounded receipt.
- [ ] Fresh Claude MCP invocation remains blocked before tool execution because the organization has disabled Claude Code subscription access. The configured server itself reports connected; no Claude receipt claim is made.
- [x] PR #42 passed required CI run `29408587642` before merge.

## Phase 785 - Review evidence handoff (implemented, unreleased)

Turns one canonical review session into a portable contract another agent can
validate without claiming that the handoff was transported, accepted, or
implemented.

### Delivered
- [x] Added CLI `design-ai review-handoff`, SDK `reviewHandoff()`, and MCP `design_ai_review_handoff` over one shared operation.
- [x] Preserved exact workflow, quality-report, and browser-verification source strings with byte counts, SHA-256 digests, parsed values, and explicit references.
- [x] Required optional quality and browser evidence as a pair, then verified semantic report identity, browser source digest, and declared viewport coverage.
- [x] Added named recipient, `not-delivered`, pending consumer validation, prepared implementation handoff, and unchanged remaining approval gates.
- [x] Added Website Console handoff import, full revalidation, original-byte export, and responsive handoff-stage rendering.
- [x] Expanded the source capability contract to 22 MCP tools and 15 SDK exports while retaining exactly three opt-in learning-profile write tools.
- [x] Added installed-bin, one-shot `npm exec`, SDK import, Console, help, package-content, and shared drift assertion coverage.

### Boundary
- The CLI reads explicit regular JSON files. SDK and MCP receive exact source strings.
- The operation writes no local file, sends no transport, invokes no model, inspects or mutates no target repository, starts no implementation, and makes no external request.
- A prepared handoff remains unaccepted until the named consumer validates it and obtains its remaining approvals.

### Verification target
- [x] Focused core, CLI, SDK, MCP, Console, help, capability, and smoke assertion tests pass.
- [x] `npm run release:check` passes with 760 tests, 8 strict audits, 728 packaged files, SDK import smoke, installed-bin and one-shot handoff smoke, and a 0/0 documentation warning policy.
- [x] PR #41 passed required CI run `29405311672` before merge.

## Phase 784 - Canonical review workflow (implemented, unreleased)

Turns one existing HTML artifact into a single linked review session instead of
asking users and agents to carry context between separate planning and inspection
commands.

### Delivered
- [x] Added CLI `design-ai review`, SDK `reviewHtml()`, and MCP `design_ai_review_html` over one shared operation.
- [x] Preserved the nested `design-ai-start` and `design-ai-quality-report` contracts and linked them with exact source identity plus plan, design-contract, and report SHA-256 digests.
- [x] Added the ordered plan, static-review, browser-verification, and implementation-handoff stages with one pending human decision.
- [x] Added Website Console workflow import, original-byte export, nested artifact rendering, and a responsive semantic review timeline.
- [x] Expanded the source capability contract to 21 MCP tools and 14 SDK exports while retaining exactly three opt-in learning-profile write tools.
- [x] Added installed-bin, one-shot `npm exec`, SDK import, Console, help, package-content, and drift assertion coverage.

### Boundary
- The CLI reads one explicit regular HTML file. SDK and MCP receive source text.
- The workflow runs no browser or script, writes no evidence, mutates no target repository, calls no external service, and records no learning signal.
- Declared repository, URL, and screenshot references remain uninspected plan context.
- Browser verification remains `not-run`; implementation remains `not-started` until their separate approval-gated workflows produce evidence.

### Verification target
- [x] Focused core, CLI, SDK, MCP, Console, help, and smoke assertion tests pass.
- [x] `npm run release:check` passes with 749 tests, 8 strict audits, 722 packaged files, a 0/0 documentation warning policy, SDK import smoke, and installed-bin plus one-shot review smoke.
- [x] PR #40 passed required CI before merge.

## Phase 783 - Product specialization benchmark and adoption proof (implemented, unreleased)

Turns the specialization thesis into a repeatable local regression suite without
using a numeric quality score or overstating synthetic evidence as customer
adoption.

### Delivered
- [x] Added CLI-only `design-ai benchmark [case-id] [--strict] [--json]` and `--list` over one versioned packaged suite.
- [x] Covered new design, existing-product refactor, Korean product UX, and multi-agent handoff with four synthetic fixtures and public case studies.
- [x] Added strict validators for start and design-artifact payloads, then reused the canonical quality-report validator for inspected fixture evidence.
- [x] Compared exact `finding-id` sets as false negatives, false positives, and uncertainty regressions instead of calculating an aggregate score.
- [x] Added SHA-256 identity for the suite, fixture inputs, generated contracts, transfer envelopes, and case studies.
- [x] Required every case study to keep Source, Change, Verification, Permission boundary, Remaining risk, and Claim boundary sections.
- [x] Added installed-bin and one-shot `npm exec` package smoke assertions for 4/4 passing cases and the read-only boundary.

### Boundary
- Every case is marked `synthetic-fixture` with `adoptionClaim: none`; no customer use, production outcome, or first-value time is claimed.
- The runner reads packaged fixtures and corpus files only. It writes no file, opens no browser, executes no fixture code, mutates no target repository, and makes no external request.
- Multi-agent coverage uses local transfer envelopes with sender, recipient, artifact kind/version, SHA-256, and consumer validation. It does not claim a real transport or model invocation.
- Target-repository edits, publication, deployment, and real-user evidence collection remain separate approval-gated work.

### Verification target
- [x] Unit, CLI, contract, help, dispatch, package-content, and shared smoke assertion tests pass.
- [x] Package contents include the runner, validators, suite, five HTML fixtures, and four case studies.
- [x] `npm run release:check` passed with 736 tests, 8 strict audits, 715 packaged files, a 0/0 documentation warning policy, and benchmark smoke through installed-bin plus one-shot `npm exec` paths.
- [x] PR #39 passed audits and size budget, docs policy, package integrity, and unit tests before merge.

## Phase 782 - Korean product packs and Website Console quality review (implemented, unreleased)

Turns Korean fintech, commerce, SaaS, content, and game knowledge into explicit,
versioned review contracts and gives operators a human-readable quality evidence
surface in Website Console.

### Delivered
- [x] Added five opt-in product review packs across CLI, SDK, and MCP with revisioned criteria, benchmarks, false-positive notes, and mobile plus desktop coverage.
- [x] Added deterministic phone, password-autocomplete, and marketing-consent checks while leaving wrapping, density, payment, probability, and runtime accessibility unverified.
- [x] Added Website Console quality and browser-sidecar import, validation, digest linkage, viewport coverage, and unchanged JSON export.

### Boundary
- Locale never selects a product pack implicitly.
- Static evidence never upgrades browser or scenario criteria.
- Website Console keeps quality and browser evidence as separate immutable contracts.

### Verification target
- [x] `npm run release:check` passed with 722 tests, 8 strict audits, and installed-bin plus one-shot package smoke coverage.
- [x] Pull request #38 passed CI and merged as `7c45776d5b4dad5f8dadf1f900bfc7c530ae218a`.

## Phase 781 - Approval-gated browser verification runner (implemented, unreleased)

Adds runtime evidence without weakening the read-only static inspector or adding a
browser dependency to the core package.

### Delivered
- [x] Added `design-ai verify-browser` as a CLI-only operation over one canonical P2 quality report, one loopback preview URL, one target root, one user-supplied adapter, and one explicit approval reference.
- [x] Added a versioned `design-ai-browser-verification` sidecar contract for run metadata, boundary, viewports, seven required probe categories, artifact-linked findings, and a derived summary.
- [x] Required responsive passes to include screenshots and accessibility passes to include accessibility output; missing adapters, probes, JSON, and artifacts remain `unverified`.
- [x] Linked non-passing runtime probes to related unverified source-report finding IDs and compared the source-report digest after adapter exit.
- [x] Added focused parser, approval, loopback, adapter-failure, pass/fail normalization, source digest, and boundary-violation tests plus package-content guards.

### Boundary
- The runner starts only with `--yes` and a non-empty `--approval-ref` and confines its own writes to `~/.design-ai/evidence/browser/`.
- It accepts loopback URLs only, runs the adapter from the evidence directory with a minimal environment, and does not install browser or accessibility packages.
- A post-run P2 report digest mismatch creates a boundary-violation artifact and rejects the run. Mutation restored before adapter exit remains `unverified`.
- SDK and MCP inventories stay unchanged. Browser process execution remains an explicit CLI boundary, and the user-supplied adapter must be trusted separately.
- The sidecar distinguishes runner checks from adapter attestations. Post-run source-report digest match and evidence location are verified; restored intermediate source mutation, adapter target-repository mutation, and external writes remain `unverified`.
- Adapter execution currently requires macOS or Linux so timeout handling can terminate the full POSIX process group.

### Verification target
- [x] Focused browser contract, runner, CLI parser, help, dispatch, package-content, and shared smoke assertion tests pass.
- [x] `npm run release:check` passed with 706 tests, 8 strict audits, 682 packaged files, warning-free docs, and functional browser verification smoke through installed-bin plus one-shot `npm exec` paths.
- [ ] Pull-request CI evidence will be recorded before merge.

## Phase 780 - Read-only static HTML quality engine (implemented, unreleased)

Turns one explicit HTML source into the canonical evidence-backed quality
report without executing the page or changing the selected file.

### Delivered
- [x] Added `design-ai inspect <source.html> --brief text` with explicit file selection, regular-file and 1 MB guards, symlink rejection, Markdown output, and canonical JSON output.
- [x] Added one dependency-free static analyzer for document language, supported control and button names, image alternatives, and the mobile viewport contract.
- [x] Added SDK `inspectHtml()` and MCP `design_ai_inspect_html`; both inspect supplied strings and call the same pure operation as the CLI adapter.
- [x] Preserved all eight quality lenses, concrete locations, Before/After/Why, evidence, verification steps, and separate confirmed/unverified counts.
- [x] Expanded the source capability contract to 20 MCP tools and 13 SDK exports at the P2 boundary, while retaining exactly three opt-in learning-profile write tools.
- [x] Added installed-bin, one-shot `npm exec`, and post-publish registry smoke contracts that assert the selected source bytes remain unchanged.

### Boundary
- The CLI reads one operator-selected `.html` or `.htm` file. It does not follow symbolic links, recursively scan a repository, resolve linked resources, execute scripts, open a browser, or write evidence.
- SDK and MCP receive source text and a display reference; neither reads a target path.
- Static success does not become a passing runtime claim. Interaction, interruption, motion, performance, keyboard, accessibility-tree, and rendered responsive behavior remain `unverified`.
- Target-repository mutation, browser verification, publication, and deployment remain explicit approval gates.

### Verification target
- [x] Focused contract, analyzer, CLI, SDK, MCP, help, dispatch, and capability-manifest tests pass.
- [x] `npm run release:check` passed with 694 tests, 8 strict audits, 676 packaged files, warning-free docs, and installed-bin plus one-shot `npm exec` smoke coverage.
- [x] Pull request #36 passed audits and size budget, package integrity, documentation policy, and CLI plus VS Code library unit-test checks in GitHub Actions run `29319044947`.

## Earlier phases

Phases 1-779, covering every release up to and including v5.0.0, moved to the
[roadmap archive](ROADMAP-archive.md).
