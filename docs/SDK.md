# Agent SDK reference

> Status: shipped (Phase A + Phase B) — 8 read-only verbs plus the opt-in `learn.*` local-write namespace, semver-stable surface

`@design-ai/cli/sdk` lets an external Node.js program — an agent runtime, a build script, a custom tool — use design-ai's deterministic design capabilities as importable functions, without shelling out to the CLI or spawning the MCP server. It is a thin, curated adapter over the same `cli/lib` functions the CLI and MCP server already call, so a capability that ships in the CLI is instantly available to an SDK consumer.

See [`AGENT-SDK.md`](AGENT-SDK.md) for the full design rationale, phased plan, and open questions. This page is the public reference for the shipped Phase A (read-only) and Phase B (local-write) surface.

## Install and import

The SDK ships inside the `@design-ai/cli` package (no separate install):

```bash
npm install @design-ai/cli
```

```js
import { route, prompt, pack, search, recall, check, routes, version } from "@design-ai/cli/sdk";
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
- Given the same inputs, it returns the same outputs (determinism), matching the CLI.

## Verbs

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
- The 8 read-only function exports (`route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version`) plus the frozen `learn` namespace object (`learn.remember`, `learn.feedback`, `learn.captureFromCheck`) and their return-shape key sets are pinned by an SDK contract test (`cli/sdk/index.test.mjs`) — this is the semver anchor. If a name or a top-level key drifts unintentionally, that test fails.
- `cli/lib/*` remains internal and unstable. Only `@design-ai/cli/sdk` is a supported import path.
- Determinism: the same inputs always produce the same outputs, with no randomness or time-dependence added by the adapter layer.

## Phase B — local writes

Phase A (above) is read-only by design: the 8 verbs never write a file. Phase B adds a single namespace export, `learn`, grouping the three explicit, opt-in **LOCAL-WRITE** verbs. This is the only place the SDK writes files — every Phase A verb stays read-only and unchanged.

```js
import { learn } from "@design-ai/cli/sdk";

learn.remember(text, opts?)               // opts: { category?: string }
learn.feedback(text, opts?)                // opts: { outcome?: string, category?: string }
learn.captureFromCheck(artifact, opts?)    // opts: { routeId?: string }
```

**Write boundary rationale:** an SDK consumer should never be surprised by a file write. Phase A's 8 verbs are safe to call from any context — a build script, a read path, a CI check — with zero side effects. `learn.*` is the deliberate, narrow exception: three verbs, one destination, no ambiguity about what gets written or where.

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
