# Product specialization plan

## Product thesis

Design AI should become the design quality layer for AI coding agents.

It should not compete with visual canvases or prompt-to-app generators on how quickly
they produce a first screen. Its advantage is the work that begins after a first
screen exists: turning intent into an explicit design contract, inspecting code and
runtime behavior, separating evidence from inference, and carrying a verified
improvement plan into implementation.

The primary user is a product builder who already works in Claude, Codex, Cursor, or
another coding agent. They need design judgment inside the development loop without
moving every decision into a separate design tool.

## Golden journey

The product should make one path obvious:

1. Start with a brief, repository, page URL, screenshot, or existing artifact.
2. Establish the route, source of truth, locale, viewport, and mutation boundary.
3. Produce a design contract before suggesting implementation.
4. Inspect the available code, runtime, accessibility, and responsive evidence.
5. Return a quality report whose findings include location, Before, After, Why,
   evidence, severity, and verification.
6. Ask for approval before target-repository edits or external writes.
7. Verify the approved implementation and export a reusable evidence bundle.
8. Record only approved local learning signals for later work.

The first useful artifact should take less than five minutes for a prepared project.
That is a delivery target, not a current performance claim.

## Specialization pillars

### Evidence-backed design judgment

Every recommendation must say what was observed, where it was observed, and how the
change will be verified. Behavior that was not exercised remains `unverified`.
Design AI does not use a numeric score that can hide missing evidence.

### Existing-product improvement

The core workflow starts from real products and real repositories. It should be as
useful for refactoring an account flow or homepage as it is for creating a new
design contract. The product preserves existing architecture until evidence shows
that a larger change is necessary.

### Agent portability

The same contract should work through CLI, SDK, MCP, and Website Console. Adapters
may differ, but route identity, report shape, permissions, and verification meaning
must not drift.

### Korean product depth

Korean typography, density, payments, authentication, commerce, financial color
semantics, and platform conventions should be executable review criteria rather
than a final localization note.

### Permission and history integrity

Read-only inspection is the default. Local evidence writes are explicit. Target
repository mutation, external publication, deployment, and learning-profile writes
remain visible gates with a record of what was approved and verified.

## Delivery plan

### P0 - Quality contract foundation

Status: implemented in the current source, pending release.

- Publish a versioned JSON Schema for the canonical quality report.
- Validate the contract with a dependency-free Node module.
- Require all eight interface-quality lenses and evidence for every lens.
- Add a representative Korean product benchmark with confirmed and unverified
  findings.
- Guard the contract, fixture, and documentation in package-content verification.

Exit criteria:

- The benchmark passes the canonical validator.
- Missing evidence, missing lenses, stale summary counts, and unsafe mutation
  boundaries fail tests.
- The schema and benchmark are present in the packed package.

### P1 - One start flow

Status: implemented in the current source, pending release.

Create `design-ai start` as the primary entry point over existing route, artifact,
site, and review operations. It should collect the minimum context once and return
the next safe action without duplicating those operations.

Exit criteria:

- One command accepts a brief and optional repository, URL, screenshot, locale, and
  viewport context.
- CLI, SDK, MCP, and Website Console expose the same design-contract payload.
- Dry-run output names every intended read, local write, target mutation, and
  external action before execution.

The implementation is read-only rather than a simulated executor. CLI, SDK, and
MCP call the same operation directly, while Website Console validates, stores,
displays, and exports that canonical JSON without rerouting the brief or inspecting
declared references.

### P2 - Quality engine

Status: implemented in the current source, pending release.

Build a read-only inspector that maps repository and artifact evidence into the
quality report. Keep static checks deterministic. Use design knowledge to explain
the finding and its consequence, not to invent observations.

Exit criteria:

- Findings point to concrete files, selectors, nodes, or runtime steps.
- Every finding has Before, After, Why, evidence, and verification fields.
- Confirmed and unverified findings never collapse into one count.
- A target repository remains unchanged during inspection.

The first implementation is deliberately narrow. CLI inspection reads one
explicit regular HTML file, while SDK and MCP accept source text. Supported
static rules cover document language, accessible names, image alternatives,
and the mobile viewport contract. Every behavior that needs rendering or
interaction remains `unverified`; linked resources and scripts are not followed
or executed.

### P3 - Browser verification runner

Status: implemented in the current source, pending release.

Add an optional runner for responsive, keyboard, accessibility, reduced-motion,
loading, error, and repeated-action checks. Keep it separate from the pure report
contract so the core package remains usable without browser dependencies.

Adding a browser or accessibility production dependency requires a separate review
and approval before implementation.

The implementation keeps that dependency boundary intact. `design-ai
verify-browser` runs only after `--yes` and a named `--approval-ref`, accepts a
loopback preview, reads one canonical P2 report, and invokes a user-supplied
adapter. Its separate sidecar contract records normalized probe evidence under
`~/.design-ai/evidence/browser/`; it does not rewrite the static report or promote
missing evidence to pass.

Exit criteria:

- Every run records URL, viewport, time, tool, observation, and artifact path.
- A failed probe with valid run-time evidence produces `fail`; unavailable or invalid
  evidence produces `unverified`, never a false pass.
- Screenshots and accessibility output are linked to the findings they support.
- Design AI's own writes stay outside the target repository; adapter target and
  external writes remain explicitly `unverified` because the executable is not sandboxed.

All four exit criteria are enforced by the sidecar validator and focused runner
tests. Responsive passes require complete 8-bit RGB/RGBA PNG structure, accessibility passes
require JSON content, timestamps must fall inside the run interval, and timeout
handling terminates the adapter process group. A post-run source-report digest
mismatch is rejected; mutation restored before adapter exit remains `unverified`.

### P4 - Korean product packs and Website Console

Turn the strongest Korean knowledge into focused fintech, commerce, SaaS, content,
and game review packs. Make Website Console the place where a human can inspect the
contract, evidence, approval boundary, and implementation handoff without reading
raw JSON.

Implemented in the current source:

- Five versioned `ko-KR` review packs share one validated contract, carry an
  immutable revision for report reproducibility, and remain explicitly opt-in
  through CLI `--review-pack`, SDK `reviewPack()` /
  `inspectHtml({ reviewPack })`, and MCP `design_ai_review_pack` /
  `design_ai_inspect_html`.
- Three high-confidence HTML rules cover phone-field semantics, password-manager
  intent, and preselected marketing consent. Wrapping, density, payment,
  probability, interaction, and assistive-technology criteria stay `unverified`
  until browser or scenario evidence is attached.
- Each pack owns a mobile and desktop benchmark, expected finding ids, criterion-
  level false-positive notes, knowledge references, and a read-only boundary.
- Website Console validates quality and browser contracts separately, preserves
  the exact imported JSON bytes for export, checks sidecar SHA-256 linkage when
  both artifacts are present, and shows missing viewport coverage without merging
  or upgrading evidence.

Exit criteria:

- Each pack has a benchmark, expected findings, false-positive notes, and mobile
  plus desktop coverage.
- Website Console can import and export the canonical report without changing its
  meaning.
- Korean wrapping, density, input, payment, auth, and accessibility checks are
  visible in the evidence chain.

### P5 - Benchmark and adoption proof

Status: implemented in the current source, pending release.

Build a repeatable benchmark suite and publish case studies that show what changed,
what evidence supported it, and what remained unverified.

The implementation adds a CLI-only, read-only `design-ai benchmark` runner over a
versioned packaged suite. It covers one new-design contract, two exact finding
comparisons for existing-product and Korean UX revisions, and one serialized
multi-agent handoff. Results expose contract failures, missing and unexpected
finding IDs, fixed findings, persistent `unverified` risks, and false-positive
notes without calculating an aggregate quality score. Four public synthetic case
studies record source, change, verification, permission boundary, and remaining
risk without claiming real customer adoption or production outcomes.

Exit criteria:

- Benchmarks cover new design, existing-product refactor, Korean product UX, and
  multi-agent handoff.
- Regression runs compare contract validity and finding precision without using an
  arbitrary aggregate quality score.
- Public case studies identify the source, change, verification, permission
  boundary, and remaining risk.

All three exit criteria are enforced in the packaged suite. Each case study also
states its claim boundary, and the runner records `evidenceClass: synthetic-fixture`
plus `adoptionClaim: none` so repeatable product proof cannot be mistaken for real
customer adoption.

Local release evidence: `npm run release:check` passes with 736 tests, 8 strict
audits, 715 packaged files, a 0/0 documentation warning policy, and benchmark smoke
through installed-bin plus one-shot `npm exec` paths.

### P6 - Canonical review workflow

Status: implemented in the current source, pending release.

Make the first complete review action as obvious as the product thesis. A user with
an existing HTML artifact should not have to run `start` and `inspect` separately,
carry their context by hand, or guess which result owns the next decision.

The implementation adds `design-ai review`, SDK `reviewHtml()`, MCP
`design_ai_review_html`, and Website Console review-session import. All four call or
validate the same operation. The workflow preserves the original start and quality
contracts, records the exact source byte identity, and links the plan, design
contract, and report with SHA-256 evidence. Website Console preserves the imported
workflow bytes while rendering its nested artifacts and ordered stages.

Exit criteria:

- One input produces one plan, one static quality report, and one pending human
  decision without duplicating context entry.
- Brief, locale, viewport, source reference, and artifact digests must agree before
  linkage can pass.
- Confirmed and unverified findings retain their original meaning.
- Browser verification remains `not-run`; implementation remains `not-started`.
- CLI, SDK, MCP, and Website Console preserve the same read-only boundary and
  contract identity.
- Installed package, one-shot `npm exec`, SDK import, and Console fixtures reject
  context, stage, digest, or permission drift.

P6 does not run a browser, edit a target repository, call an external service,
record learning, or create a general evidence archive. A reusable evidence bundle
belongs in a later phase after the canonical review chain has stable adoption and
its additional write boundary is designed explicitly.

Local release evidence: `npm run release:check` passes with 749 tests, 8 strict
audits, 722 packaged files, a 0/0 documentation warning policy, SDK import smoke,
and canonical review smoke through installed-bin plus one-shot `npm exec` paths.

### P7 - Review evidence handoff

Status: implemented in the current source, pending release.

Make a review safe to pass between agents without pretending that a local JSON
object is a delivered or accepted result. A consumer should be able to prove which
workflow it received, whether browser evidence came from the exact quality-report
bytes, and which approvals still block implementation.

The implementation adds CLI `design-ai review-handoff`, SDK `reviewHandoff()`, MCP
`design_ai_review_handoff`, and Website Console handoff import. The contract stores
each source string beside its parsed value, byte count, SHA-256 digest, and
reference. Browser evidence is optional, but its quality report and sidecar must be
supplied as a pair and agree with the workflow report and declared viewports.

Exit criteria:

- The exact review-workflow source survives preparation, import, and export.
- Browser-linked handoffs reject missing pairs, semantic drift, source-digest
  drift, and incomplete viewport evidence.
- A named recipient never implies transport; delivery stays `not-delivered` and
  consumer validation stays `pending`.
- The handoff stage is `prepared`, not implemented, and remaining approval gates
  survive unchanged unless browser evidence has actually satisfied them.
- CLI, SDK, MCP, and Website Console validate the same read-only contract.
- Installed package, one-shot `npm exec`, SDK import, Console fixtures, and shared
  smoke assertions reject source, linkage, stage, recipient, or permission drift.

P7 does not send a message, invoke another model, inspect a target repository,
write an evidence file, edit code, run implementation tests, commit, push, deploy,
or call an external service. Those actions belong to the receiving workflow under
its own permissions and evidence.

## P8 - Consumer validation receipt

Status: implemented in the current source, pending release.

P8 closes the next trust gap without adding transport. CLI
`design-ai review-handoff-verify`, SDK `verifyReviewHandoff()`, MCP
`design_ai_verify_review_handoff`, and Website Console validate the exact handoff
bytes for the named consumer and emit `design-ai-review-handoff-receipt` v1.

The receipt preserves the source, digest, parsed handoff, evidence summary, and
remaining approvals. The consumer name must match the handoff recipient, but the
identity remains self-declared. Target-repository intake stays pending and
implementation remains unauthorized.

Exit criteria:

- Changed source bytes, digest drift, evidence drift, approval drift, or consumer mismatch fail validation.
- CLI, SDK, MCP, and Website Console use the same receipt contract and preserve exact source bytes.
- Installed package and one-shot `npm exec` paths validate both handoff and receipt.
- Fresh Claude and Codex subprocesses discover and call the receipt MCP tool without editing the repository.
- Full release checks, browser QA, pull-request CI, and merge evidence are recorded before completion.

P8 does not verify who the consumer is, how a file was transported, whether the
consumer accepted the work, whether a target repository was inspected, or whether
implementation began. Those claims require separate evidence from the receiving
workflow.

### P9 - Target repository intake

Status: implemented in the current source, pending release.

P9 grounds the handoff in the repository that will actually receive the work.
CLI `design-ai review-intake`, MCP `design_ai_review_intake`, and Website Console
share `design-ai-target-repo-intake` v1. The operation accepts an exact P8 receipt,
requires the same consumer and absolute path, and links the receipt by source
digest, byte count, handoff digest, and workflow digest.

The intake reads only supported root project metadata and local Git state. It
records the declared and observed remote, branch, upstream, ahead/behind state,
last commit, and every current worktree entry up to a documented output limit.
Existing changes are never hidden with Design AI-specific ignore rules.

Exit criteria:

- Consumer and path mismatches fail before target inspection.
- Symbolic links are rejected and are not followed by either metadata or Git
  inspection.
- Remote drift blocks scope review; existing changes and detached HEAD remain
  visible attention states.
- The artifact lists every metadata file and Git command inspected and keeps the
  application-source list empty.
- CLI, MCP, Console, installed package, and one-shot `npm exec` validate the same
  contract while leaving the receipt and target repository unchanged.

P9 does not expose an SDK adapter because local repository access is an explicit
filesystem boundary. It does not read application source, start a preview, install
dependencies, call a network, accept the handoff, or authorize implementation.

### P10 - Implementation scope approval

Status: implemented in the current source, pending release.

Turn a valid P9 intake into a reviewable proposal that names the exact files to
inspect or change, intended behavior, risks, verification commands, and ownership
of pre-existing worktree changes. No source read or edit begins until the proposal
is explicitly approved.

Exit criteria:

- The proposal references one P9 intake digest and cannot silently change target,
  consumer, or repository identity.
- File globs, dependency changes, migrations, generated files, external writes,
  commit, push, and deployment each have visible approval states.
- Scope expansion creates a new proposal instead of mutating approved history.

The implementation adds `design-ai review-scope` and
`design-ai review-scope-approve`, SDK `proposeImplementationScope()` and
`approveImplementationScope()`, MCP `design_ai_review_scope` and
`design_ai_approve_review_scope`, and Website Console import, exact export, and
stage restore. Proposal and approval are separate immutable v1 artifacts.

Every gate is derived again from the exact P9 intake and request. Approval grants
only listed source inspection and target-file selectors. External writes, commit,
push, deployment, and running an external-state migration remain separate. P10
does not read application source or perform any implementation action.

### P11 - Implementation evidence

Status: implemented in the current source, pending release.

Execute only an approved P10 scope and record what changed, which tests ran, which
runtime observations were collected, and what remains unverified. Evidence must
distinguish Design AI's action from pre-existing target changes.

Exit criteria:

- Every changed file maps to approved scope or is reported as a blocking drift.
- Test, build, accessibility, responsive, and browser evidence records commands,
  outcomes, timestamps, and artifact references without upgrading missing runs.
- Commit and push remain separate, explicit gates with immutable before/after Git
  identity.

The implementation adds an exact-source evidence request and a derived evidence
artifact. CLI `review-evidence` and MCP `design_ai_review_evidence` compare the
approved branch, HEAD, remote, pre-existing status, and file selectors with current
Git state. They hash only declared evidence files and never run the reported
commands. Website Console validates and preserves the same artifact, then restores
the approval when the evidence is cleared. SDK remains unchanged because local
filesystem and Git access are explicit operator boundaries.

### P12 - Real pilot and adoption proof

Status: merged in PR #46. One consented internal dogfood chain and the compact
fresh-process MCP path are complete. The full nested MCP response remains an
explicit response-size error instead of being truncated.

Run the complete review-to-implementation chain on one consented real project.
Measure time to first useful artifact, finding precision, approval friction,
implementation completion, and unresolved risk. Synthetic benchmarks remain
separate from pilot evidence.

Exit criteria:

- The project owner approves evidence collection and every mutation boundary.
- The case study identifies real, synthetic, inferred, and unverified claims.
- No adoption, outcome, or production-quality claim appears without source-backed
  pilot evidence.

The implementation adds a strict `design-ai-pilot-record` v1 input and a derived
`design-ai-pilot-evidence` v1 artifact. CLI `review-pilot`, SDK
`recordPilotEvidence()`, MCP `design_ai_review_pilot`, and Website Console bind
the exact P11 implementation evidence to its original P6 workflow and the
operator's consented record. They derive the five measures above, preserve every
approval gate and finding decision, and separate real, synthetic, inferred, and
unverified claims. The operation reads only supplied sources and never establishes
identity, feedback authenticity, external adoption, production quality, or
business outcomes.

The first internal run used the Website Console itself as the target. It produced
a useful P6 artifact in 14 seconds, accepted one concrete navigation finding,
completed the approved mobile-navigation change, and recorded no unresolved
implementation risk. Website Console preserved and re-exported all 416,114 bytes
of the imported pilot artifact. The final nested MCP response is 452,923 bytes and
remains an explicit output-limit error. An opt-in compact view validates that full
artifact first, then returns a 4,021-byte summary with matching source references,
SHA-256 digests, byte counts, measures, issues, claims, next action, and boundaries.

### P13 - Verified design iteration

Status: merged in PR #47. Local and pull-request verification, main-branch CI,
real VS Code e2e, documentation build, and GitHub Pages deployment are complete.

Close the loop between review and implementation. A user should be able to compare
the exact baseline and candidate quality reports and understand which design
findings resolved, persisted, appeared, or remain uncertain. The answer must keep
the evidence that produced it and must not collapse eight design lenses into an
opaque score.

The implementation adds CLI `review-compare`, SDK `compareReviews()`, MCP
`design_ai_compare_reviews`, and Website Console import, restore, render, and
original-byte export. The shared v1 contract requires the same subject, brief,
route, locale, and viewport set. A missing finding is resolved only when its
candidate lens passes; otherwise it remains uncertain. Lens changes separately
record improvement, regression, evidence gained, and evidence lost.

Exit criteria:

- Exact baseline and candidate references, source bytes, SHA-256 digests, parsed
  reports, and derived decisions survive the full artifact.
- Compact output removes only repeated source bodies and preserves identities,
  decisions, approval gates, and claim boundaries.
- Installed-bin, one-shot `npm exec`, SDK, MCP, and Website Console validate the
  same rules and reject subject, context, lens, source, or derived-decision drift.
- Desktop and mobile Console checks show no horizontal overflow, keyboard skip-link
  failure, undersized visible navigation controls, or console errors.
- Target mutation, commit, push, deployment, and external writes remain separate
  approvals.

P13 can establish bounded improvement between two supplied reviews. It does not
establish production quality, customer adoption, or business impact. Those claims
still require separate runtime and user evidence.

Local release evidence: `npm run release:check` passes with 832 tests, all 8 strict
audits, 774 packaged files, a 0/0 documentation warning policy, SDK import smoke,
and comparison smoke through installed-bin plus one-shot `npm exec` paths. A fresh
stdio MCP process listed all 29 tools and returned a 3,934-byte compact comparison
with matching source identities and unchanged read-only boundaries.

### P14 - Public release and real adoption evidence

Status: v5.1.0 public distribution complete; homepage and consent-gated external
pilot evidence in progress.

Publish the complete P6-P13 workflow before adding another contract. Then run the
same review-to-comparison path against the public documentation homepage and
separately consented external projects. Installation, MCP connection, first useful
artifact time, finding decisions, implementation completion, approval friction,
and unresolved risk remain separate observations rather than one score.

Exit criteria:

- npm `latest`, GitHub Release, and Homebrew resolve to the same verified v5.1.0
  package identity; GitHub Pages remains available.
- The documentation homepage pilot preserves baseline, approved implementation,
  candidate, browser, release, and comparison evidence.
- Three external pilot slots have explicit owner consent, data boundaries, target
  paths, measures, and stop conditions before any project is inspected.
- At least one pilot belongs to another project owner before any external-adoption
  claim is made.
- The next product capability is selected only when the same user problem appears
  in at least two independent pilot records.

P14 does not treat a prepared recruitment packet as adoption, fabricate user
feedback, or publish private project material. External pilot results remain
blocked until real owners consent and participate.

## Quality targets

These are targets for the specialization program, not claims about the current
release:

| Target | Measurement |
|---|---|
| Fast first value | A prepared project receives a valid first artifact within 5 minutes |
| Evidence completeness | 100% of confirmed findings include a concrete reference and observation |
| Honest uncertainty | 100% of unobserved runtime claims are marked `unverified` |
| Adapter parity | CLI, SDK, MCP, and Console fixtures validate against the same schema |
| Permission safety | Every target mutation or external write is preceded by an explicit gate |
| Regression traceability | Every released contract change has tests, package proof, and history entries |

## Non-goals

- Replacing Figma or another visual canvas.
- Becoming a general-purpose full-stack application generator.
- Deploying or publishing as a side effect of design review.
- Editing a target repository during read-only inspection.
- Training a model or collecting private project data remotely.
- Adding image generation when a design-quality decision does not require it.

## Change policy

Work is grouped by one user-visible capability. A batch includes its contract,
implementation, tests, package proof, and history updates. Commit and push happen
after the batch passes its focused checks. Release-grade checks run before the pull
request is declared ready.
