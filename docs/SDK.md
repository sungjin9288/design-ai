# Agent SDK reference

> Status: shipped (Phase A) — read-only verbs, semver-stable surface

`@design-ai/cli/sdk` lets an external Node.js program — an agent runtime, a build script, a custom tool — use design-ai's deterministic design capabilities as importable functions, without shelling out to the CLI or spawning the MCP server. It is a thin, curated adapter over the same `cli/lib` functions the CLI and MCP server already call, so a capability that ships in the CLI is instantly available to an SDK consumer.

See [`AGENT-SDK.md`](AGENT-SDK.md) for the full design rationale, phased plan, and open questions. This page is the public reference for the shipped Phase A surface.

## Install and import

The SDK ships inside the `@design-ai/cli` package (no separate install):

```bash
npm install @design-ai/cli
```

```js
import { route, prompt, pack, search, recall, check, routes, version } from "@design-ai/cli/sdk";
```

Only the `./sdk` subpath is exported — `import "@design-ai/cli"` (the bare package root) is intentionally not exported, so importing the SDK is always an explicit `@design-ai/cli/sdk` import. `cli/lib/*` is internal and unstable; do not import it directly.

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
}): PromptPlan | null
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
- The 8 exported names (`route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version`) and their return-shape key sets are pinned by an SDK contract test (`cli/sdk/index.test.mjs`) — this is the semver anchor. If a name or a top-level key drifts unintentionally, that test fails.
- `cli/lib/*` remains internal and unstable. Only `@design-ai/cli/sdk` is a supported import path.
- Determinism: the same inputs always produce the same outputs, with no randomness or time-dependence added by the adapter layer.

## Phase B (not yet shipped)

Phase A is read-only by design. A future Phase B may add opt-in, explicit local-write adapters mirroring the CLI's local-write commands (`learn.remember`, `learn.feedback`, `check` with capture) — deferred until an adopter needs it. See [`AGENT-SDK.md`](AGENT-SDK.md#phase-b-optional-explicit-local-writes) for the current plan.
