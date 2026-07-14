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

Create `design-ai start` as the primary entry point over existing route, artifact,
site, and review operations. It should collect the minimum context once and return
the next safe action without duplicating those operations.

Exit criteria:

- One command accepts a brief and optional repository, URL, screenshot, locale, and
  viewport context.
- CLI, SDK, MCP, and Website Console expose the same design-contract payload.
- Dry-run output names every intended read, local write, target mutation, and
  external action before execution.

### P2 - Quality engine

Build a read-only inspector that maps repository and artifact evidence into the
quality report. Keep static checks deterministic. Use design knowledge to explain
the finding and its consequence, not to invent observations.

Exit criteria:

- Findings point to concrete files, selectors, nodes, or runtime steps.
- Every finding has Before, After, Why, evidence, and verification fields.
- Confirmed and unverified findings never collapse into one count.
- A target repository remains unchanged during inspection.

### P3 - Browser verification runner

Add an optional runner for responsive, keyboard, accessibility, reduced-motion,
loading, error, and repeated-action checks. Keep it separate from the pure report
contract so the core package remains usable without browser dependencies.

Adding a browser or accessibility production dependency requires a separate review
and approval before implementation.

Exit criteria:

- Every run records URL, viewport, time, tool, observation, and artifact path.
- A failed or unavailable probe produces `fail` or `unverified`, never a false pass.
- Screenshots and accessibility output are linked to the findings they support.
- The runner does not deploy, install into, or edit the target repository.

### P4 - Korean product packs and Website Console

Turn the strongest Korean knowledge into focused fintech, commerce, SaaS, content,
and game review packs. Make Website Console the place where a human can inspect the
contract, evidence, approval boundary, and implementation handoff without reading
raw JSON.

Exit criteria:

- Each pack has a benchmark, expected findings, false-positive notes, and mobile
  plus desktop coverage.
- Website Console can import and export the canonical report without changing its
  meaning.
- Korean wrapping, density, input, payment, auth, and accessibility checks are
  visible in the evidence chain.

### P5 - Benchmark and adoption proof

Build a repeatable benchmark suite and publish case studies that show what changed,
what evidence supported it, and what remained unverified.

Exit criteria:

- Benchmarks cover new design, existing-product refactor, Korean product UX, and
  multi-agent handoff.
- Regression runs compare contract validity and finding precision without using an
  arbitrary aggregate quality score.
- Public case studies identify the source, change, verification, permission
  boundary, and remaining risk.

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
