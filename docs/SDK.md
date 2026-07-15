# Agent SDK reference

> Status: current source candidate — 15 read-only exports plus the opt-in `learn.*` local-write namespace; published v5.0.0 has 9 read-only verbs

`@design-ai/cli/sdk` lets an external Node.js program — an agent runtime, a build script, a custom tool — use design-ai's deterministic design capabilities as importable functions, without shelling out to the CLI or spawning the MCP server. It is a thin, curated adapter over the same `cli/lib` functions the CLI and MCP server already call, so a capability that ships in the CLI is instantly available to an SDK consumer.

See [`AGENT-SDK.md`](AGENT-SDK.md) for the full design rationale, phased plan, and open questions. This page is the public reference for the shipped Phase A (read-only) and Phase B (local-write) surface.

MCP parity: SDK `start()`, `reviewHtml()`, `reviewHandoff()`, `verifyReviewHandoff()`, `inspectHtml()`, `reviewPack()`, and `artifact()` map to `design_ai_start`, `design_ai_review_html`, `design_ai_review_handoff`, `design_ai_verify_review_handoff`, `design_ai_inspect_html`, `design_ai_review_pack`, and `design_ai_artifact`; `recall` and `learn.*` (`remember`, `feedback`, `captureFromCheck`) map 1:1 to `design_ai_recall` and `design_ai_learn_*` (`design_ai_learn_remember`, `design_ai_learn_feedback`, `design_ai_learn_capture`) — see [`integrations/design-ai-mcp-server.md`](integrations/design-ai-mcp-server.md).

Filesystem boundary: Website Improvement linked-preview inspection and target repository intake remain CLI/MCP operations (`design-ai site --linked-preview`, `design_ai_site_linked_preview`, `design-ai review-intake`, `design_ai_review_intake`) rather than SDK exports. SDK `start()` may declare references without reading them, while `reviewHtml()`, `reviewHandoff()`, `verifyReviewHandoff()`, and `inspectHtml()` accept source text and display references instead of paths. `reviewPack()` reads shipped definitions only. The SDK therefore stays a curated capability adapter with 16 current-source exports and no general local-project filesystem surface.

## Install and import

The SDK ships inside the `@design-ai/cli` package (no separate install):

```bash
npm install @design-ai/cli
```

```js
import { artifact, start, reviewHtml, reviewHandoff, verifyReviewHandoff, inspectHtml, reviewPack, route, prompt, pack, search, recall, check, routes, version } from "@design-ai/cli/sdk";
```

Only the `./sdk` subpath is exported — `import "@design-ai/cli"` (the bare package root) is intentionally not exported, so importing the SDK is always an explicit `@design-ai/cli/sdk` import. `cli/lib/*` is internal and unstable; do not import it directly.

### TypeScript

Hand-written type declarations ship with the package at `cli/sdk/index.d.ts` and are wired through the `exports` `types` condition, so TypeScript and editors resolve them automatically for `@design-ai/cli/sdk` — no `@types` install, and no build step on our side (the declarations are maintained by hand to preserve the zero-toolchain stance). Use `moduleResolution: node16`/`nodenext` (or `bundler`) so the subpath `types` condition is honored. All exported types (`RouteResult`, `PromptPlan`, `Pack`, `SearchHit`, `RankedSearchHit`, `RecallResult`, `CheckReport`, option interfaces, …) are importable:

```ts
import { route, type RouteResult, type SearchOptions } from "@design-ai/cli/sdk";
```

A `node --test` guard (`cli/sdk/types.test.mjs`) asserts the declaration file stays in exact sync with the runtime exports.

## Phase A: read-only

Every verb below is a pure, read-only adapter:

- It validates its inputs and throws a plain `Error` with a clear message on bad input (e.g. a non-string brief).
- It resolves the package root the same way the CLI does.
- It calls the corresponding `cli/lib` function and returns a plain JSON-serializable object — the same shape the CLI's `--json` mode emits.
- It performs no file writes, no network calls, and no learning-usage sidecar writes. This is a deliberate difference from the CLI: `prompt`/`pack`'s `withLearning` option in the SDK only **reads** the local learning profile to build context — it never records a usage event, unlike the CLI's `--with-learning` flag. There is no SDK equivalent of `check --learn` (capture) in Phase A.
- Semantic results are deterministic. Timestamped reports expose `generatedAt`; callers that need byte-stable output provide that value explicitly.

## Verbs

### `start(brief, opts)`

Build one read-only route, design contract, review state, and next-step plan from a
brief plus optional declared context.

```js
start(brief: string, opts?: {
  routeId?: string,
  siteName?: string,
  repoUrl?: string,
  localPath?: string,
  url?: string,
  screenshots?: string[],
  locale?: string,
  viewports?: string[],
}): StartPayload
```

The return value matches `design-ai start ... --json` and MCP
`design_ai_start`. `effects.performed` records only design-ai corpus reads;
local writes, target-repository mutations, and external actions remain empty.
Declared references appear under `effects.intended` with a not-performed state.
The function does not inspect those references or execute `pathway.command`.

### `reviewHtml(source, opts)`

Compose the canonical start plan and static quality report for one supplied HTML
artifact. The return value is the same `design-ai-review-workflow` v1 contract as
CLI `design-ai review --json` and MCP `design_ai_review_html`.

```js
reviewHtml(source: string, opts: {
  sourceRef: string,
  brief: string,
  name?: string,
  locale?: string,
  viewports?: string[],
  generatedAt?: string,
  reviewPack?: string,
  siteName?: string,
  repoUrl?: string,
  localPath?: string,
  url?: string,
  screenshots?: string[],
}): ReviewWorkflow
```

The source byte length and digest cover the exact supplied string, including
leading and trailing whitespace. `linkage` proves that the plan and report share
the same brief, locale, viewports, and source reference. Browser verification
remains `not-run`, implementation remains `not-started`, and every write boundary
remains false. See [Canonical review workflow](REVIEW-WORKFLOW.md).

### `reviewHandoff(workflowSource, opts)`

Prepare a portable, self-validating handoff from one exact review-workflow JSON
string. The operation names a recipient but keeps delivery and consumer validation
pending.

```js
reviewHandoff(workflowSource: string, opts: {
  workflowRef: string,
  recipient: string,
  qualityReportSource?: string,
  qualityReportRef?: string,
  browserVerificationSource?: string,
  browserVerificationRef?: string,
}): ReviewHandoff
```

The browser fields are optional pairs. When present, the quality report value must
match the report inside the workflow, its exact source digest must match the
browser sidecar, and the observed viewport names must cover the workflow's declared
viewports. The function writes nothing and performs no delivery, target-repository
inspection, implementation, or external call. See [Review evidence
handoff](REVIEW-HANDOFF.md).

### `verifyReviewHandoff(handoffSource, opts)`

Validate one exact review-handoff JSON string for its named consumer and return a
separate `design-ai-review-handoff-receipt` v1 contract.

```js
verifyReviewHandoff(handoffSource: string, opts: {
  handoffRef: string,
  consumer: string,
}): ReviewHandoffReceipt
```

The consumer must match the handoff recipient. The receipt preserves the exact
handoff bytes and digest, evidence summary, and remaining approvals. It proves
contract validation only; consumer identity, transport, acceptance,
target-repository intake, and implementation remain unverified. See [Review
handoff validation receipt](REVIEW-HANDOFF-RECEIPT.md).

### `inspectHtml(source, opts)`

Inspect supplied HTML with deterministic static rules and return the canonical
`design-ai-quality-report` v1 contract.

```js
inspectHtml(source: string, opts: {
  sourceRef: string,
  brief: string,
  name?: string,
  locale?: string,
  viewports?: string[],
  generatedAt?: string,
  reviewPack?: string,
}): DesignQualityReport
```

The current rule set checks document language, supported form-control names,
button names, image `alt` declarations, and the mobile viewport contract. It
does not execute scripts, open a browser, resolve linked resources, read a path,
or write a file. Response, interruption, motion, performance, keyboard,
accessibility-tree, and rendered responsive behavior remain `unverified` until
runtime evidence is collected. Every confirmed finding includes a concrete
source location, Before, After, Why, evidence, and verification steps.
`generatedAt` defaults to the current UTC time. Supply a normalized UTC value when
fixtures, caches, or signatures require byte-equivalent reports.

Use `reviewPack()` to list the five shipped Korean product review ids, or
`reviewPack("korean-fintech")` to read one versioned contract. Supplying that id
as `inspectHtml(..., { reviewPack: "korean-fintech" })` adds its namespaced
findings and design-contract source evidence. Locale alone never enables a pack.

### `route(brief, opts)`

Recommend the best design-ai route(s), commands, skills, and knowledge files for a task brief.

```js
route(brief: string, opts?: { limit?: number, explain?: boolean }): RouteResult[]
```

- `limit` — maximum route recommendations, 1-10. Default: `3`.
- `explain` — include route scoring, reference coverage, and related-knowledge detail. Default: `false`.

Returns an array of `RouteResult` objects (`id`, `label`, `score`, `confidence`, `matchedKeywords`, `command`, `skills`, `agents`, `knowledge`, `keywords`, `explanation`, plus `relatedKnowledge` when `explain: true`) — the same shape as the `routes` array in `design-ai route --json`.

### `prompt(brief, opts)`

Build a ready-to-use agent prompt plan from a task brief.

```js
prompt(brief: string, opts?: {
  routeId?: string,
  withLearning?: boolean,
  learningCategory?: string,
  learningLimit?: number,
  withRecall?: boolean,
  recallLimit?: number,
}): PromptPlan
```

- `routeId` — force a route id instead of scoring the brief.
- `withLearning` — include brief-relevant local learning preferences (reads `DESIGN_AI_LEARNING_FILE`; **never** records usage, unlike the CLI's `--with-learning`).
- `learningCategory`, `learningLimit` (1-100) — scope/limit the learning context; require `withLearning`.
- `withRecall` — include brief-relevant shipped corpus knowledge.
- `recallLimit` (1-20) — limit recalled corpus files; requires `withRecall`.

Returns a `PromptPlan` object (`brief`, `version`, `route`, `slashCommand`, `referenceExamples`, `filesToRead`, `checklist`, `qualityCommand`, `prompt`, plus `learningContext`/`recall` when requested) — the same shape as `design-ai prompt --json`, minus `learningUsage` (Phase A never writes it).

### `artifact(brief, opts)`

Build one portable, read-only artifact contract shared by CLI, SDK, MCP, and Website Console.

```js
artifact(brief: string, opts: {
  mode: "implementation-plan" | "critique-loop" | "design-contract",
  routeId?: string,
}): DesignArtifact
```

- `implementation-plan` turns a brief into a source-grounded implementation sequence with explicit approval and verification boundaries.
- `critique-loop` defines an observe → diagnose → revise → re-observe cycle with one top recommendation and preserved evidence.
- `design-contract` defines an agent-readable `DESIGN.md` structure covering product intent, foundations, components, motion, accessibility, responsive behavior, anti-patterns, and ownership.
- `routeId` can force a known route; otherwise the shared router selects one.

The return shape is the same as `design-ai artifact <mode> <brief> --json`: mode, route, source files, four workflow steps, output sections, `pending-human-approval`, verification command/checklist, and rendered Markdown. The function never writes `outputFile`; only an explicit CLI `--out` writes a local artifact.

### `pack(brief, opts)`

Build a ready-to-use prompt plus a bounded context-file bundle from a task brief.

```js
pack(brief: string, opts?: {
  routeId?: string,
  maxBytes?: number,
  withLearning?: boolean,
  learningCategory?: string,
  learningLimit?: number,
  withRecall?: boolean,
  recallLimit?: number,
}): Pack
```

- `maxBytes` — maximum context bytes to include, 1000-1,000,000. Default: `120000`.
- The remaining options mirror `prompt`'s learning/recall options.

Returns a `Pack` object (`brief`, `version`, `maxBytes`, `usedBytes`, `summary`, `warnings`, `plan`, `files`, `markdown`) — the same shape as `design-ai pack --json`, minus `learningUsage`.

### `search(query, opts)`

Search the local design-ai markdown corpus.

```js
search(query: string, opts?: { dir?: string, limit?: number, ranked?: boolean }): SearchHit[]
```

- `dir` — restrict to one corpus directory: `knowledge`, `examples`, `skills`, `docs`, `agents`, or `commands`.
- `limit` — maximum hits, 1-500. Default: `20`.
- `ranked` — rank results with the deterministic lexical (BM25-style) scorer instead of returning raw line hits. Default: `false`.

Returns `SearchHit[]`. Unranked hits: `{ file, relPath, lineNumber, preview }`. Ranked hits: `{ file, relPath, score, matchedTokens, preview }` — the same shapes as `design-ai search --json` and `design-ai search --ranked --json`.

### `recall(query, opts)`

Recall brief-relevant shipped corpus knowledge and local learning-profile entries for a query — a combined read-only view.

```js
recall(query: string, opts?: { limit?: number, category?: string }): { corpus: object, learning: object }
```

- `limit` — applies to both the corpus and learning lists, 1-20. Default: `5`.
- `category` — scopes only the learning list.

Returns `{ corpus: { candidateCount, selectedCount, selected }, learning: { mode, candidateCount, selectedCount, selected } }` — the same shape as `design-ai learn --recall --json`.

The corpus side (and every other recall-injection surface — `pack`/`prompt` `--with-recall` and `route --explain`'s `relatedKnowledge`) excludes non-knowledge docs before ranking is cut to `limit`: generated index/meta docs (`COVERAGE.md`, `INDEX.md`, `docs/reference/*`) and everything under `docs/` — recall injects design knowledge, and the design corpus lives in `knowledge/`, `examples/`, `skills/`, `agents/`, `commands/`; `docs/` is product documentation. Raw `search`/`search --ranked` never applies this filter (docs/DOGFOOD-SDK-FINDINGS.md, F-2).

### `check(artifact, opts)`

Check a generated design Markdown artifact for grounding, accessibility, responsive, unresolved-marker, and route-specific requirements.

```js
check(artifact: string, opts?: { routeId?: string, strict?: boolean }): CheckReport
```

- `routeId` — add route-specific checks (e.g. `component-spec`, `palette-from-brand`). Must be a known route id.
- `strict` — accepted for CLI-flag parity but has no effect on the returned report; the SDK never sets a process exit code. Inspect `report.status` yourself.

Returns a `CheckReport` object (`filePath`, `status`, `passes`, `warnings`, `failures`, `total`, `score`, `results`, plus `routeId` when passed) — the same shape as `design-ai check --json` (minus any `--learn` capture, which Phase A does not support).

### `routes()`

List the full route catalog (every route id with its static metadata), independent of any brief.

```js
routes(): { version: string, routes: RouteResult[] }
```

Returns the same shape as `design-ai route --list --json`.

### `version()`

Report the CLI package version and the plugin/corpus version.

```js
version(): { cli: string, corpus: string }
```

## Stability contract

`@design-ai/cli/sdk` is **semver-stable**:

- Additive changes (new optional fields, new opt-in options) are minor version bumps.
- Signature or return-shape changes are major version bumps.
- The 15 current-source read-only function exports (`artifact`, `start`, `reviewHtml`, `reviewHandoff`, `verifyReviewHandoff`, `inspectHtml`, `reviewPack`, `route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version`) plus the frozen `learn` namespace object (`learn.remember`, `learn.feedback`, `learn.captureFromCheck`) and their return-shape key sets are pinned by an SDK contract test (`cli/sdk/index.test.mjs`) — this is the semver anchor. If a name or a top-level key drifts unintentionally, that test fails.
- `cli/lib/*` remains internal and unstable. Only `@design-ai/cli/sdk` is a supported import path.
- Determinism: semantic results contain no randomness. Timestamped reports are byte-stable when the caller supplies `generatedAt`.

## Phase B — local writes

The primary SDK surface is read-only by design: the 15 current-source verbs never write a file. Phase B adds a single namespace export, `learn`, grouping the three explicit, opt-in **LOCAL-WRITE** verbs. This is the only place the SDK writes files — every other verb stays read-only.

```js
import { learn } from "@design-ai/cli/sdk";

learn.remember(text, opts?)               // opts: { category?: string }
learn.feedback(text, opts?)                // opts: { outcome?: string, category?: string }
learn.captureFromCheck(artifact, opts?)    // opts: { routeId?: string }
```

**Write boundary rationale:** an SDK consumer should never be surprised by a file write. The 11 current-source read-only verbs are safe to call from any context — a build script, a read path, a CI check — with zero side effects. `learn.*` is the deliberate, narrow exception: three verbs, one destination, no ambiguity about what gets written or where.

All three verbs write **only** the local learning profile — `DESIGN_AI_LEARNING_FILE` if set, otherwise the CLI's `defaultLearningFile()` default path — and never touch the network. There is no `filePath` option and no `now`/timestamp option on any of them: target a specific profile the same way the CLI does, by setting the `DESIGN_AI_LEARNING_FILE` environment variable before calling. The underlying library functions supply their own defaults (the env var and `new Date()`).

### `learn.remember(text, opts)`

Record a local learning-profile preference. Adapter over `rememberLearning` from `cli/lib/learn-profile.mjs`.

```js
learn.remember(text: string, opts?: { category?: string }): RememberResult
```

- `text` — required, non-empty string.
- `category` — one of the learning-profile categories (e.g. `preference`, `brand`, `workflow`, `constraint`, `accessibility`, `korean`, `other`); the library normalizes and validates it. Default: `"preference"`.

Returns a `RememberResult`: `{ file, entry, profile }`, where `entry` is `{ id, category, text, source, createdAt }` (`source` is always `"sdk"`) and `profile` is the full updated learning profile `{ version, updatedAt, entries }`.

### `learn.feedback(text, opts)`

Record feedback (keep/avoid/improve) as a local learning-profile entry. Adapter over `recordLearningFeedback` from `cli/lib/learn-profile.mjs`.

```js
learn.feedback(text: string, opts?: { outcome?: string, category?: string }): RememberResult
```

- `text` — required, non-empty string.
- `outcome` — any string; the library normalizes it (`normalizeFeedbackOutcome`) to one of `keep` / `avoid` / `improve` and folds it into both the stored entry's `text` (e.g. `"Avoid in future outputs: …"`) and its `source` (e.g. `"feedback:avoid"`). Default: `"improve"`.
- `category` — same category enum as `remember`. Default: `"workflow"`.

Returns the same `RememberResult` shape as `learn.remember`.

### `learn.captureFromCheck(artifact, opts)`

Check a Markdown artifact, then capture its non-pass results as local learning-profile entries — the SDK equivalent of the CLI's `check --learn --yes`. Adapter over `checkArtifactContent` + `buildCheckLearningCapture` from `cli/lib/check.mjs`.

```js
learn.captureFromCheck(artifact: string, opts?: { routeId?: string }): CaptureResult
```

- `artifact` — required, non-empty Markdown string.
- `routeId` — add route-specific check requirements before capturing; must be a known route id (validated with the same `assertKnownRouteId` helper the read-only `check` adapter uses).

Returns a `CaptureResult` — the `captureLearningEntries` return shape:

```
{
  file: string,           // the learning profile file written to
  dryRun: false,           // always false; captureFromCheck always applies
  applied: true,           // always true when dryRun is false
  source: string,          // "check:<routeId>" or "check:artifact"
  candidateCount: number,  // non-pass check results considered
  addedCount: number,      // entries newly written
  skippedCount: number,    // entries skipped as duplicates of existing entries
  count: number,           // total entries in the profile after this call
  entries: LearningProfileEntry[],  // the entries that were added
  skipped: Array<{ category, text, source, reason }>,  // reason is "duplicate-entry-text"
}
```

Calling `captureFromCheck` twice with the same artifact adds nothing the second time — every candidate is skipped with `reason: "duplicate-entry-text"`.

### Validation

All three verbs use the same `cli/sdk/validate.mjs` helpers as Phase A: `requireNonEmptyString` for `text`/`artifact`, `requireOptions` for the options bag, and `optionalString` for string options. `routeId` is validated with `assertKnownRouteId`, exactly like the read-only `check` adapter. Bad input throws a plain `Error` with a clear message — no process exit code, no silent fallback.

### What stays unchanged

`check()` (the Phase A read-only verb) is untouched: it still never writes, and it has no capture option. Capture is exclusively reached through `learn.captureFromCheck`, which is a separate, explicitly-named write verb — this keeps the read/write boundary visible at the call site rather than hidden behind an option flag on a read-only function.

## Walkthrough

See [`docs/integrations/agent-sdk-walkthrough.md`](integrations/agent-sdk-walkthrough.md) for a complete, copy-pastable script that drives `route` → `pack` → author → `check` → `learn.captureFromCheck` end-to-end, based on a real dogfooded run (see [`docs/DOGFOOD-SDK-FINDINGS.md`](DOGFOOD-SDK-FINDINGS.md)).
