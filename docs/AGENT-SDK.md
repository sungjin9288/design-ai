# Agent SDK design

> Status: implemented; this page preserves the design rationale and phased delivery record — updated 2026-07-13

This document records the Agent SDK phase chosen in [NEXT-SURFACE-DECISION.md](NEXT-SURFACE-DECISION.md). The public `@design-ai/cli/sdk` entry now ships alongside the CLI and MCP server; [`SDK.md`](SDK.md) is the current API reference.

## Goal

Let an external Node.js program — an agent runtime, a build script, a custom tool — use design-ai's deterministic design capabilities **as importable functions**, without shelling out to the CLI or spawning the MCP server. The SDK is a thin, documented, semver-stable adapter over the same `cli/lib` functions the CLI and MCP already call, so a capability that ships in the CLI is instantly available to an SDK consumer.

The decision record scored this surface highest on leverage and learning synergy precisely because it reuses the shared library verbatim. The same core now serves `start`, `artifact`, `route`, `prompt`, `pack`, `search --ranked`, `recall`, and `check` across the supported surfaces.

## Non-goals

- No new capabilities. The SDK exposes existing CLI/MCP behavior; it does not add design logic.
- No runtime dependencies, no network calls, no telemetry — same posture as the CLI.
- No exposure of the entire `cli/lib` internal surface. The SDK is a curated, stable subset; `cli/lib/*` stays internal and free to refactor.
- No new process model — the SDK runs in the caller's process, deterministic and synchronous where the underlying functions are.
- No model inference or fine-tuning (unchanged product stance).

## The stable surface

A single curated entry (`cli/sdk/index.mjs`) re-exports a small set of adapter functions with **their own stable signatures**, independent of the internal `cli/lib` shapes. Internal functions may be renamed or refactored; the SDK adapter absorbs that so the public API stays put.

Current read-only surface:

```js
import { artifact, start, route, prompt, pack, search, recall, check, routes, version } from "@design-ai/cli/sdk";

start(brief, { routeId, siteName, repoUrl, localPath, url, screenshots, locale, viewports }) // → StartPayload
artifact(brief, { mode: "implementation-plan", routeId }) // → DesignArtifact
route(brief, { limit = 3, explain = false })            // → RouteResult[]
prompt(brief, { routeId, withLearning, learningCategory, learningLimit, withRecall, recallLimit })  // → PromptPlan
pack(brief, { routeId, maxBytes, withLearning, learningCategory, learningLimit, withRecall, recallLimit })  // → Pack
search(query, { dir, limit = 20, ranked = false })      // → SearchHit[]  (ranked: BM25 hits with scores)
recall(query, { limit = 5, category = "" })             // → { corpus, learning }  (combined recall view)
check(artifact, { routeId = "", strict = false })       // → CheckReport
routes()                                                // → RouteCatalog
version()                                               // → { cli, corpus }
```

Every function is a pure adapter: it validates its inputs, calls the corresponding `cli/lib` function with the resolved package root, and returns a plain JSON-serializable object — the same shape the CLI's `--json` mode emits, which is already a contract covered by smoke tests. No function writes files or reads the network in Phase A. `recall` and the `withRecall`/`withLearning` options read the local corpus and the user's local `learning.json` (via `DESIGN_AI_LEARNING_FILE`) exactly as the CLI does; nothing else is read.

## Packaging

Add an `exports` map to `package.json`:

```json
"exports": {
  "./sdk": "./cli/sdk/index.mjs",
  "./package.json": "./package.json"
}
```

- `@design-ai/cli/sdk` is the one public import path. The bare package (`.`) intentionally stays unexported so `import "@design-ai/cli"` does not accidentally couple callers to internals; the CLI is invoked as a bin, the SDK via the explicit subpath.
- `cli/` is already in `files`, so `cli/sdk/` ships with the package with no `files` change.
- The `package-contents` audit and `package:smoke` must cover the new entry: a packed-tarball smoke that `import`s `@design-ai/cli/sdk` and calls `route`/`search --ranked`/`recall` and asserts deterministic output.

## Stability contract

- The `@design-ai/cli/sdk` surface is **semver-stable**: additive changes are minor, signature/return changes are major. This is stated in the SDK reference doc and enforced by SDK contract tests that pin the exported names and return-shape keys.
- `cli/lib/*` remains **internal and unstable** — importing `@design-ai/cli/cli/lib/...` is unsupported. The adapter layer is the seam that lets internals refactor (as they did repeatedly during the retrieval work) without breaking SDK consumers.
- Determinism: same inputs → same outputs, matching the CLI. The SDK adds no randomness or time-dependence.

## Phased plan

### Phase A — read-only SDK core

The current read-only verbs, including `start`, `reviewHtml`, `reviewHandoff`, `verifyReviewHandoff`, `inspectHtml`, `reviewPack`, and `artifact`, are pure adapters over existing `cli/lib` functions. They perform no file writes or network calls. `start` records declared product references without reading them; review operations accept caller-supplied source strings; `prompt` and `pack` may read the local learning profile when requested, but they do not record a learning-usage sidecar through the SDK.

Verification gates:
- `node --test` unit coverage for each adapter: signature, option defaults, return-shape keys, determinism, and parity with the CLI `--json` output for a fixed brief.
- SDK contract test pinning the exported names and the return-shape key sets (the semver anchor).
- `npm run audit` 8/8 (the SDK reference doc's links resolve; frontmatter valid).
- `npm run release:check` additions: packed-tarball smoke that imports `@design-ai/cli/sdk` from the installed package and exercises `route`/`search`(ranked)/`recall`, plus a registry-smoke parity check after publish.
- `npm run release:metadata` unchanged (README stance preserved).

### Phase B — explicit local writes (shipped)

Implemented as a single `learn` namespace export grouping three opt-in adapters that mirror the CLI's local-write commands: `learn.remember`, `learn.feedback`, and `learn.captureFromCheck` (capture from a `check()` report). Each writes only the local learning profile (`DESIGN_AI_LEARNING_FILE` / `defaultLearningFile()`), never the network — no `filePath` or `now`/timestamp option; consumers target a profile via the env var, exactly like the CLI. The ten read-only verbs remain separate from this write surface; `check()` in particular gets no capture option. Capture is reached only through the explicitly named `learn.captureFromCheck`, keeping the write boundary visible at the call site. See [`SDK.md`](SDK.md#phase-b--local-writes) for the full reference.

## Integration points

- **MCP server** already wraps the same `cli/lib` functions; the SDK and MCP stay in lockstep because both are thin layers over one core. No MCP change is required for Phase A.
- **Retrieval** (`search` ranked, `recall`, `withRecall`) flows into the SDK for free — the shared lexical scorer and the generated-index exclusion apply identically.
- **Docs**: a `docs/SDK.md` (or this file, promoted from draft) becomes the public SDK reference; the README install table gains an "SDK" row pointing to it.

## Risks and open questions

Risks:
- **Semver commitment.** The published SDK surface is a promise. Mitigation: keep the read-only surface small (ten verbs in the current source), pin names and shapes in a contract test, and treat the adapter as the only stable seam.
- **Return-shape coupling.** SDK returns mirror the CLI `--json` shapes; if those change, the SDK breaks. Mitigation: the same smoke/parity tests that already guard the CLI JSON guard the SDK, and shape changes are already major-version events.

Open questions (answer during Phase A implementation review):
1. Export the bare package root (`.`) as an alias for `./sdk`, or keep `./sdk` the only path? (Leaning: `./sdk` only, to avoid implying the whole package is the SDK.)
2. Type declarations remain hand-written for the public SDK surface so the package keeps its zero-build stance. The SDK contract tests are the semver anchor for exported names and top-level return shapes.
3. Does `prompt`/`pack` via the SDK ever write the learning-usage sidecar, or is that strictly a Phase B explicit opt-in? (Leaning: never in Phase A; read-only.)
4. Is `check` in Phase A (read-only quality check) or deferred with the other write-adjacent verbs? (Leaning: Phase A — `check` is read-only when capture is off.)
