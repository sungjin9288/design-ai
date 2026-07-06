# Changelog

User-facing release notes for design-ai. Versions follow semver.

## v4.63.0 — Dogfood round 2: dashboard-design route and flow-design keyword depth (2026-07)

The dogfood loop's second turn, run immediately after v4.62.0 on fresh briefs. It first verified the v4.62 fixes live (flow briefs route to `flow-design`, recall selections are 100% design corpus, `pack` trims to the character boundary), then probed three new task classes and shipped what the weakest one surfaced. Evidence trail in `docs/DOGFOOD-DASHBOARD-FINDINGS.md`. All additive and backward-compatible.

### Added
- **`dashboard-design` route** — the data-dense screen class (대시보드, 정산, 어드민, 백오피스, KPI / dashboard, admin panel, back-office, analytics) previously matched **zero** route keywords and fell through to design-system scaffolding. The new route curates the knowledge that already existed for this class (`dashboard-composition`, `money-and-amount`, `korean-density-conventions`, `list-and-feed` + layout/typography foundations) and adds data-screen check requirements: money/number formatting evidence, table accessibility (caption/scope/aria-sort), and density/responsive degradation. The settlement-dashboard brief moved from `[low] design-from-brief score=0` to `[medium] dashboard-design score=2`.
- **`examples/dashboard-design-settlement.md`** (examples now 223) — the route's worked example, adapted from the dogfooded 정산 대시보드 artifact (원화 표기, tabular-nums 우측 정렬, 상태 배지 색+텍스트, 테이블 접근성, 밀도 강등 전략).

### Changed
- **`flow-design` keywords deepened, verified in both directions.** Korean step-flow vocabulary (위저드, 단계별 플로우, 스텝, 이어하기) lifts an onboarding-wizard brief from `[low] score=1` to `[medium] score=3`; compound states-design keywords (에러 상태, 빈 상태 화면, 상태 설계, 검색 결과 없음, empty state, error state) route a states-design brief to `flow-design [medium] 3` above `illustration [low] 1`, while a genuine illustration brief (빈 상태 일러스트/마스코트) still routes `illustration [high] 4`. The route eval checkpoint stays 6/6 and representative briefs route unchanged.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `git diff --check`.
- Route eval 6/6; example-qa 21/21 routes; representative-brief routing unchanged.
- Main-branch GitHub Actions (`Design-AI audit`, `Deploy doc site`) passed for the constituent commits.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.62.0 → 4.63.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- The single most common Korean B2B design task class — data-dense dashboard/admin screens — now routes to purpose-built curation and checks, and flow briefs match in the vocabulary Korean users actually write. The loop's second turn also doubles as live regression evidence for everything v4.62.0 shipped.

## v4.62.0 — Dogfood loop: flow-design route, trust & safety corpus, recall purity, SDK walkthrough (2026-07)

A full dogfood cycle shipped as one release: a real design task (커뮤니티 앱 신고·차단 플로우) was driven end-to-end through the Agent SDK, and everything the run surfaced — a routing gap, recall pollution, a corpus gap, and a real byte-accounting bug — is fixed here, together with the walkthrough the run produced. See `docs/DOGFOOD-SDK-FINDINGS.md` for the evidence trail.

### Added
- **`flow-design` route** — interaction/feature-flow briefs (신고, 차단, 온보딩, 가입, 결제 플로우, 설정, 알림 / report, block, onboarding, signup, checkout flows) now route to a dedicated route with flow-appropriate curated skills/knowledge and route-specific check requirements (states/steps, edge/error paths, entry/completion). The dogfood brief moved from `[low] design-from-brief score=1` to `[high] flow-design score=4`; compound keywords were chosen so existing routes' briefs are unaffected (route eval checkpoint still 6/6).
- **`knowledge/patterns/trust-safety-moderation.md`** (corpus now 95) — report flow and reason taxonomy, moderation status pipeline including the 정보통신망법 제44조의2 임시조치(30일)/이의제기 obligations, block semantics (bidirectional scope, non-notification principle), report-abuse prevention, and the accessibility floor.
- **`examples/flow-design-report-block.md`** (examples now 222) — the route's top worked example, expanded from the dogfooded artifact.
- **Agent SDK walkthrough** — `docs/integrations/agent-sdk-walkthrough.md` (+ Korean mirror): a copy-pastable Node consumer script driving `route` → `pack` → author → `check` → `learn.captureFromCheck` with temp-profile isolation, with outputs verified against a live run; linked from the README install table and `docs/SDK.md`, and guarded against drift by `cli/sdk/flow-example.test.mjs`.

### Changed
- **Recall injection now excludes everything under `docs/`** (`prompt`/`pack --with-recall`, `learn --recall`, `route --explain` related knowledge): recall injects design knowledge, and the design corpus is `knowledge/`, `examples/`, `skills/`, `agents/`, `commands/` — `docs/` is product documentation. The dogfood run showed repo-meta docs outranking real knowledge (docs/case-study.md at #1); enumerating meta files proved whack-a-mole, so the principled directory rule replaced it. Raw `search`/`search --ranked` is unchanged and still returns `docs/` hits.

### Fixed
- **`pack` could exceed `maxBytes` by 1-2 bytes** when a context file was truncated mid-UTF-8-character: the decoder's 3-byte U+FFFD replacement could outweigh the dangling bytes it replaced. `takeUtf8` now trims to the last complete character boundary before decoding. Caught by the new walkthrough regression guard (which fails on the unfixed code) and additionally covered by a Korean-content budget-sweep invariant test.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `git diff --check`.
- Main-branch GitHub Actions (`Design-AI audit`, `Deploy doc site`) passed for the constituent commits.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.61.0 → 4.62.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- The dogfood loop is closed and shipped: flow briefs route correctly, recall injects only design knowledge, Korean community/social products get trust & safety guidance with the regulatory floor, `pack`'s byte budget is a hard guarantee, and SDK adopters get a verified end-to-end walkthrough.

## v4.61.0 — Ranked-search eval checkpoint (2026-07)

Closes the last open follow-up from the AI-learning Phase A review (FU-3 in `docs/AI-LEARNING-PHASE2.md`): `design-ai search` gains eval-checkpoint modes mirroring the route/prompt/pack/learn pattern, run through the shipped ranked (BM25) search path. This is the standing evidence artifact for any future decision to promote `--ranked` to the default search mode. Additive and backward-compatible; default `search` behavior is unchanged.

### Added
- `search --eval-template [--json]` — emit a versioned ranked-search checkpoint template. The default template ships six cases that all pass against the shipped corpus, including the Korean particle-form regression queries (`버튼`, `버튼을`, `접근성이`) from the Hangul-bigram work, so the eval doubles as the retrieval-level Korean tokenization regression.
- `search --eval [--strict] [--json]` with `--from-file file` / `--stdin` — run a checkpoint file's cases through the ranked search path and report pass/warn/fail per case; `--strict` exits nonzero on any failure. Case assertions: `expectRelPathIn` (top hit), `minHits`, and `matchedTokenIncludes`.

### Changed
- `search` help/usage lines (CLI `help` topic and command help) document the new eval modes; the shared smoke assertion pins were updated in lockstep.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `git diff --check`.
- Main-branch GitHub Actions (`Design-AI audit`, `Deploy doc site`) passed for the constituent commits.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.60.0 → 4.61.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- Any future `--ranked` default promotion is now evidence-backed and announced: the checkpoint demonstrates ranked-search quality (including Korean agglutinative queries) reproducibly, per the FU-3 gate set in the Phase A implementation review.

## v4.60.0 — Agent SDK types and local-write namespace (2026-07)

Extends the Agent SDK (`@design-ai/cli/sdk`) two ways, both additive and backward-compatible. First, hand-written TypeScript declarations now ship with the package, so TypeScript and editors resolve `@design-ai/cli/sdk` with full types — no `@types` install and no build step. Second, an opt-in `learn.*` namespace adds the SDK's first local-write verbs, keeping the eight Phase A verbs read-only and unchanged.

### Added
- `cli/sdk/index.d.ts` — hand-written type declarations for all eight read-only verbs (precise signatures and return interfaces, including `search` ranked/plain overloads, the `RouteConfidence` union, and optional `learningContext`/`recall`/`relatedKnowledge` fields) plus the `learn` namespace. Wired through an `exports` `types` condition, so `moduleResolution: node16`/`nodenext`/`bundler` consumers get types automatically. A `node --test` guard (`cli/sdk/types.test.mjs`) keeps the declarations in exact sync with the runtime exports; the declarations are verified to compile under `tsc --strict`.
- `learn` — a frozen namespace grouping the SDK's only writing verbs (Phase B): `learn.remember(text, { category })`, `learn.feedback(text, { outcome, category })`, and `learn.captureFromCheck(artifact, { routeId })`. Each writes only the local learning profile (`DESIGN_AI_LEARNING_FILE`), never the network, mirroring the CLI's `learn remember` / `learn feedback` / `check --learn` write paths. There is no `filePath` or timestamp option — consumers target a profile via the env var, exactly like the CLI.

### Changed
- The eight Phase A verbs (`route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version`) remain read-only and unchanged. `check` in particular stays read-only: capture lives in `learn.captureFromCheck`, never as a `check` option. The SDK contract test (`cli/sdk/index.test.mjs`) now pins both the eight read-only function verbs and the frozen `learn` namespace with its three verbs and their return-shape keys.
- `tools/audit/package-smoke.py` now also exercises `learn.remember` from the installed tarball against a temp `DESIGN_AI_LEARNING_FILE`, asserting the write.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `git diff --check`.
- Main-branch GitHub Actions (`Design-AI audit`, `Deploy doc site`) passed for the constituent commits.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.59.0 → 4.60.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- TypeScript consumers get first-class types for the whole SDK with zero toolchain cost on either side, and agents can now record design preferences, feedback, and check-derived learnings through a single explicit, opt-in write namespace — while every read-only verb keeps its no-write guarantee.

## v4.59.0 — Agent SDK Phase A (2026-07)

Adds a curated, semver-stable programmatic surface — `@design-ai/cli/sdk` — so an external Node.js program can call design-ai's deterministic design verbs as importable functions, without shelling out to the CLI or spawning the MCP server. The SDK is a thin adapter over the same `cli/lib` functions the CLI and MCP already call, so no design behavior changes. Phase A is read-only: no file writes, no network, no runtime dependencies. All additions are additive and backward-compatible.

### Added
- `@design-ai/cli/sdk` — eight read-only adapter verbs with their own stable signatures: `route(brief, opts)`, `prompt(brief, opts)`, `pack(brief, opts)`, `search(query, opts)`, `recall(query, opts)`, `check(artifact, opts)`, `routes()`, and `version()`. Each validates its inputs, resolves the package root the same way the CLI does, and returns the same JSON-serializable shape the CLI's `--json` mode emits. `check` operates on artifact content (not a path), so it reads and writes nothing.
- `package.json` `exports` map exposing `./sdk` (and `./package.json`) as the only public import paths; `cli/lib/*` stays internal and unstable, refactorable behind the adapter seam.
- `docs/SDK.md` — the public SDK reference (surface, return shapes, semver stability contract) — plus a "Node.js / Agent SDK" row in the README install tables and an Agent SDK mkdocs nav section.

### Changed
- `npm test` now also runs `cli/sdk/*.test.mjs` (61 new SDK tests, 540 total), including a contract test (`cli/sdk/index.test.mjs`) that pins the eight exported names and their return-shape keys — the semver anchor — and asserts Phase A writes no `learningUsage` sidecar.
- `tools/audit/package-smoke.py` now imports `@design-ai/cli/sdk` from the installed tarball and exercises the eight verbs, asserting determinism and the read-only guarantee.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `git diff --check`.
- Main-branch GitHub Actions (`Design-AI audit`, `Deploy doc site`) passed for the constituent commits.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.58.0 → 4.59.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- Agent runtimes, build scripts, and custom tools can consume design-ai's routing, prompt/pack generation, ranked search, recall, and artifact checks as plain functions — deterministic, in-process, zero-dependency — with a semver-stable contract independent of the internal `cli/lib` shapes.

## v4.58.0 — Retrieval Across Surfaces and Corpus Depth (2026-07)

Completes the retrieval integration started in v4.57.0 by bringing it to the last untouched surface (`route --explain`), refines recall quality so injected knowledge is real design guidance rather than index files, and closes the remaining dogfood-named corpus gaps. All additions are additive and backward-compatible; default output is unchanged unless a flag is passed.

### Added
- `route --explain` now includes an advisory "Related knowledge" section — brief-relevant corpus knowledge recalled by the shared lexical scorer, excluding what the route already curates. This is advisory only: route ids, scores, and curated knowledge are unchanged, and default `route` output is byte-unchanged. `design_ai_route`'s existing `explain` parameter carries it to MCP automatically. Retrieval now spans every surface: `search --ranked`, `prompt`/`pack --with-recall`, `learn --recall`, and `route --explain`.
- `knowledge/patterns/async-control.md` — the async action in-flight lifecycle: pending states, double-submit prevention, duration-matched loading affordances, optimistic updates with rollback, debounce/throttle, cancellation and out-of-order handling, concurrency policy, timeouts, and the accessibility floor.
- `knowledge/i18n/korean-density-conventions.md` — Korean B2B/enterprise density: the density ladder, table-first layouts, label-left multi-column forms, dense navigation, typography at density, and where density must yield to accessibility.

### Changed
- Recall injection surfaces (`prompt`/`pack --with-recall`, `learn --recall`, `route --explain`) now exclude generated index/meta files (`COVERAGE.md`, `INDEX.md`, `docs/reference/*`) so injected context is real design knowledge; raw `search --ranked` still returns those files when explicitly searched.
- Knowledge corpus is now 94 files (from 92).

### Fixed
- `tools/audit/registry-smoke.py`'s learn-relevance assertion expected a stale token order (`keyboard, accessibility`) after the v4.57 shared-scorer change sorted matched tokens; aligned it with `package-smoke.py` and the real CLI output so the live post-publish registry smoke matches the published package.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `git diff --check`.
- Main-branch GitHub Actions (`Design-AI audit`, `Deploy doc site`) passed for the constituent commits.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.57.0 → 4.58.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- Agents routing a brief now see additional relevant knowledge beyond the route's curated set, and every retrieval surface injects real design guidance rather than index tables.
- The Korean-market corpus gains async-control and B2B density coverage that dogfood runs specifically named as missing.
- Publishing v4.58.0 realigns `main` with the published package so the live registry smoke verifies cleanly again.

## v4.57.0 — Local Retrieval Memory: Ranked Search and Optional Embeddings (2026-07)

Ships the Phase 754 AI-learning retrieval work: a deterministic, zero-dependency local retrieval layer over the knowledge corpus and the local learning profile, plus an opt-in local embedding rerank backend. Defaults are unchanged — `search`, `route`, `prompt`, and `pack` behave exactly as before unless a new flag is passed — so this release is additive and backward-compatible. It also moves `refs/` source links behind generated reference pages and hardens the docs deploy against intermittent GitHub Pages failures.

### Added
- `design-ai index --build/--status/--verify`: an explicit-only local retrieval index (`~/.design-ai/index/`, `DESIGN_AI_INDEX_DIR` override) over `knowledge/`, `examples/`, `skills/`, `docs/`, `agents/`, `commands/`, and `learning.json`. The index files are derived, rebuildable cache artifacts that are never committed, packaged, or sent anywhere.
- `design-ai search --ranked`: deterministic BM25-style ranked corpus search with fully ordered output. The default substring `search` is unchanged.
- A shared lexical scorer behind `prompt --with-learning` / `pack --with-learning`, so learning-entry selection and ranked search rank with one auditable algorithm; `learn --eval` checkpoints now record a `ranker` field.
- `prompt --with-recall` / `pack --with-recall`: retrieval-augment a prompt or pack with the most relevant shipped corpus knowledge files for the brief, ranked by the same deterministic lexical scorer (opt-in, `--recall-limit N` from 1 to 20, default 5). Default `prompt`/`pack` output is unchanged.
- `design-ai learn --recall <query>`: a read-only view of what design-ai recalls for a query — the top corpus knowledge files and the top local learning entries, ranked by the same shared scorer, in one command. Mutates nothing.
- Hangul-aware tokenization: Korean surface forms emit character bigrams alongside the whole token so stem and particle-attached queries converge (`버튼` now matches documents containing only `버튼을`).
- `design-ai search --ranked --embeddings` and `index --build --embeddings [--provider …]`: an opt-in, local-only embedding rerank backend configured through `~/.design-ai/config.json`. It never runs by default, makes no network calls, ships no model, and degrades visibly to the lexical path on any absence, staleness, or provider failure (exit 0).
- MCP `design_ai_search` gains the same opt-in `ranked` parameter as the CLI, and `design_ai_prompt` / `design_ai_pack` gain the same opt-in `withRecall` / `recallLimit` parameters — no new tools and no implicit index builds.
- `design-ai workspace` reports retrieval-index readiness (unused / fresh / stale) alongside its existing learning-usage and eval-checkpoint freshness.

### Changed
- `refs/` source links in the corpus now resolve to generated reference pages under `docs/reference/` instead of the gitignored upstream mirror; the MkDocs refs-only warning baseline is now 0.
- The retrieval index sidecar format is version 2, recording the resolved checkout path and learning-file identity so a different checkout that shares the per-machine index directory is treated as stale rather than silently trusted.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `npm run audit:strict`.
- `git diff --check`.
- Main-branch GitHub Actions (`Design-AI audit`, `Deploy doc site`) passed for the constituent Phase 754 commits.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.56.0 → 4.57.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- Users get sharper, deterministic corpus and learning-context retrieval — including for Korean queries — with zero new dependencies and no behavior change unless they opt in with `--ranked`.
- Teams that want semantic rerank can wire a local embedding provider without design-ai ever making a network call or shipping a model.
- Maintainers can publish a retrieval-capable release whose new surfaces are covered by both packed-tarball and public-registry smoke.

## v4.56.0 — MCP Protocol Hardening and Published Client Evidence (2026-07)

Hardened the local stdio MCP server that Claude Code, Codex, and other MCP clients use to call design-ai. This release turns malformed JSON-RPC envelopes, request ids, notifications, initialize params, and tool arguments into deterministic protocol errors before CLI execution, then refreshes evidence that the published npm MCP entrypoint and local Claude/Codex registrations work.

### Added
- MCP tool argument validation now rejects unsupported fields, wrong JSON types, non-integer integer fields, out-of-range values, and blank required strings before invoking CLI commands.
- Public npm `design-ai-mcp` evidence now records initialize and tools/list protocol smoke from a clean one-shot `npm exec --package @design-ai/cli@4.55.0 -- design-ai-mcp` path.
- Local Claude Code and Codex client evidence now records the clone-backed `design-ai` MCP server as configured and connected.

### Changed
- Website Improvement runbook helpers were split into clearer, smaller modules and named predicates while preserving the existing handoff JSON and Markdown contracts.
- MCP subprocess tests now use a shared stdio response helper, making negative protocol scenarios easier to read and extend.
- MCP setup docs now explain why one-shot public npm verification should run outside the source checkout.

### Fixed
- MCP initialize now rejects malformed `protocolVersion` values, including non-string and blank-only protocol versions.
- MCP notifications now reject request ids across the whole `notifications/` namespace while preserving silent handling for valid id-less notifications.
- MCP response-producing methods now require ids, and malformed JSON-RPC request ids, methods, params, and tool-call containers return deterministic JSON-RPC errors.

### Verified
- All 8 audits passed.
- `npm run release:check`.
- `npm run release:metadata`.
- `npm run audit:strict`.
- `git diff --check`.
- Public npm MCP protocol smoke returned server version `4.55.0` and 10 tools before the release bump.
- Main-branch GitHub Actions passed for `Design-AI audit` and `Deploy doc site` after the MCP client evidence refresh.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.55.0 → 4.56.0.
- `vscode-extension/package.json`: remains 0.4.1.

### What this enables
- Claude Code and Codex users get stricter, more predictable MCP error behavior without changing the design-ai tool surface.
- Maintainers can verify the published MCP entrypoint and local client registrations from concrete evidence before and after publishing.

## Unreleased — Agent Eval, Learning Signals, Skill Proposals, MCP Probes, Workflow Graphs, and Handoff Evidence

Added deterministic route, prompt-plan, prompt-pack eval surfaces, a read-only learning signal registry with deterministic agent development backlog actions and structured readiness summaries, focused backlog readiness pass-through for local AI/agent handoffs with packed-tarball smoke coverage and release metadata guard coverage, preview-only skill evolution proposals, optional Website Console MCP probes with output-file smoke persistence and executable embedded follow-up commands, shared MCP probe output-file smoke assertions, release metadata guard coverage for shared MCP probe output-file smoke assertions, embedded MCP check probe next-step commands, executable embedded MCP check probe command smoke coverage, human-readable MCP check probe command guidance, packed/public smoke coverage for that human guidance, human report output-file persistence smoke coverage, embedded human report output commands, release metadata guard coverage for embedded human report output commands, MCP action plan JSON parity for embedded human report output commands, release metadata guard coverage for that action-plan parity, and packed/public smoke execution for action-plan emitted human report commands, structured Website Console MCP action plan JSON export with output-file persistence and embedded probe output-file commands, release metadata guard coverage for embedded MCP action plan probe output-file commands, next-action operator checklist output-file smoke persistence, portable Website Console workflow graph export, static Website Console graph rendering, browser-local Website Console handoff evidence tracking, CLI/bundle handoff evidence export, verified bundle evidence metadata, generated bundle contract verification with per-file diagnostics, repair guidance, repair preview/apply, repair report output-file persistence, repair report command guidance, executable repair guidance smoke coverage, shared repair guidance smoke helpers, shared repair report assertion helpers, release metadata guard coverage for shared repair guidance smoke helpers and shared repair report assertion helpers, public registry Website Console MCP probe smoke coverage, MCP probe action plan smoke coverage, shared Website Console site help topic example smoke assertions, release metadata guard coverage for shared Website Console site help topic example smoke assertions, release metadata guard coverage and packed-tarball smoke coverage for optional refresh-only agent backlog runbook selection semantics, post-commit release evidence for that refresh-only backlog smoke contract, full `release:check` evidence after the refresh-only backlog closeout, and packed-tarball evidence preservation smoke coverage for local AI/agent development drift review.

### Added
- Added MCP tool argument validation, so Claude Code and Codex receive clear typed errors for malformed tool calls before `design-ai` invokes any CLI command.
- Added packed-tarball smoke coverage for the standalone `design-ai-mcp` binary, covering both installed `node_modules/.bin/design-ai-mcp` and one-shot `npm exec --package <tarball> -- design-ai-mcp` setup paths.
- Added public registry smoke coverage for `npm exec --package @design-ai/cli@<version> -- design-ai-mcp`, so post-publish verification checks the same MCP stdio entrypoint that users install from npm.
- Improved Website Console revalidation gate action labels, so compact gate copy/export buttons identify their JSON artifact type directly.
- Improved Website Console Source Bundle action labels, so Markdown and provenance JSON copy/export buttons identify their artifact type directly.
- Added Website Console Source Bundle detail source copy action, so operators can copy the current runbook source marker directly from the provenance table.
- Added Website Console source-aware empty runbook Markdown messages, so provenance-only stage sections preserve the compact artifact source.
- Added Website Console focused provenance import source refresh, so provenance-only reviews do not keep stale gate-only source markers after a focused provenance JSON import.
- Added Website Console provenance-only notice source markers, so compact Operator Runbook notices retain their source even when viewed outside the metadata strip.
- Added Website Console Operator Runbook metadata source pills, so provenance is visible before opening the Source Bundle detail table.
- Added Website Console Source Bundle detail source markers, so the browser table shows the same provenance source used by Markdown and JSON exports.
- Added Website Console source-bundle Markdown source markers, so focused provenance exports identify whether they came from full bundle handoff, focused provenance, or gate-only import state.
- Added Website Console focused source-bundle JSON source markers, so provenance payloads expose the same source value used by imported provenance-only Operator Runbooks.
- Added Website Console gate-only JSON source markers, so compact revalidation payloads expose the same provenance source that import stores in Operator Runbook state.
- Added Website Console gate-only import source markers, so compact revalidation artifacts remain distinguishable from focused source-bundle provenance imports in Operator Runbook metadata and Markdown.
- Added Website Console gate-only JSON warning and issue count preservation, so compact revalidation roundtrips keep diagnostic totals.
- Added Website Console gate-only JSON source workspace and site name preservation, so compact revalidation artifacts keep enough source context after import.
- Added Website Console source-bundle revalidation gate JSON import, so compact gate-only artifacts can reopen Operator Runbook review without a full provenance payload.
- Added Website Console source-bundle revalidation gate JSON copy/export actions, so operators can hand off only the machine-readable gate state without exporting full provenance.
- Added Website Console Operator Runbook metadata gate badges, so source-bundle revalidation state is visible before opening the detail table.
- Added Website Console source-bundle JSON revalidation gate `reason` and `strictCheckCommandAvailable` metadata, so automation can distinguish missing commands from ready strict-check gates without string inspection.
- Added Website Console revalidation gate badges in the Source Bundle detail table, so required versus not-required strict-check state is easier to scan.
- Added a Website Console Source Bundle detail revalidation gate row, so operators can see whether strict source-bundle revalidation is required even when no warning is active.
- Added Website Console source-bundle strict command copy guards, so unavailable strict check/handoff commands no longer report successful empty copies.
- Added Website Console source-bundle JSON `revalidationGate` metadata, so automation can detect invalid/failing bundle handoff gates without parsing Markdown or UI copy.
- Added Website Console source-bundle revalidation gates to copied/exported Operator Runbook and focused source-bundle Markdown, so handoff artifacts preserve invalid-bundle stop signals outside the browser UI.
- Added Website Console source-bundle revalidation warnings, so invalid or failing bundle provenance surfaces a clear strict-check gate before target-repo execution.
- Added Website Console provenance-only markers in Operator Runbook Markdown, so copied/exported runbooks distinguish compact source-bundle provenance artifacts from full bundle handoff stage rows.
- Added Website Console filtered-row action guarding, so provenance-only Operator Runbook reviews disable filtered-row copy/export actions when no stage rows exist.
- Added Website Console next-line action guarding, so Operator Runbook review disables unavailable next-stage copy actions instead of copying an empty line.
- Added Website Console provenance-only Operator Runbook review state, so source-bundle JSON imports explain that they contain bundle identity and guard commands without target-repo execution stage rows.
- Added Website Console source-bundle provenance JSON import, so focused source-bundle JSON artifacts can rehydrate or update Operator Runbook provenance without replacing the whole workspace.
- Added Website Console source-bundle JSON copy/export actions, so imported bundle provenance can be passed to follow-up tools without exporting the full workspace or operator runbook.
- Added Website Console source-bundle Markdown copy/export actions, so imported bundle provenance can be archived as a focused artifact separate from full or filtered operator runbooks.
- Added Website Console operator runbook source-bundle detail review, so imported bundle handoff JSON exposes bundle diagnostics, checksum/generated-file counts, and copy-ready strict source commands directly in the Report tab and Markdown exports.
- Added Website Console operator runbook source-bundle provenance display, so imported bundle handoff JSON preserves and shows bundle status, validity, digest, generated-file counts, source directory, and strict source commands in local workspace state and Markdown output.
- Added Website Console operator runbook task and command provenance chips, so imported bundle handoff JSON shows effective task, strict task command key, command/manual stage counts, and read-only/local-output stage counts before target-repo execution.
- Added Website Console operator runbook row-level Markdown export actions, so a single handoff stage can be saved as its own `.md` artifact from the filtered table.
- Added Website Console operator runbook row-level Markdown copy actions, so a single handoff stage can be copied with key, action status, evidence status, next evidence item, and copy-ready line metadata.
- Added a Website Console operator runbook `Reset filters` control, so action/evidence row filters can return to the full imported handoff view in one step.
- Added Website Console operator runbook row-level line copy actions, so individual handoff stage lines can be copied directly from the filtered table.
- Added Website Console operator runbook Markdown export actions, so full and filtered bundle handoff runbooks can be saved as `.md` files from the Report tab.
- Added Website Console filtered operator runbook copy, so operators can copy only the currently visible action/evidence-filtered handoff rows while keeping full-runbook copy unchanged.
- Added Website Console operator runbook row filters, so imported bundle handoff stages can be narrowed by action status and evidence progress status using the existing status-index contract before target-repo execution.
- Improved Website Console operator runbook import handoff UX, so workspace/runbook import copy, Report-tab auto-navigation, nested `bundle.operatorRunbook` fallback, and report navigation counts make bundle handoff JSON review easier to discover before target-repo execution.
- Added Website Console operator runbook import and review UI, so bundle handoff JSON from `design-ai site <bundle-dir> --bundle-handoff --json` can be stored in the local workspace and rendered as stage metrics, status indexes, copy-ready rows, and copyable Markdown inside the Report tab.
- Added Website Console bundle handoff operator runbook human line display-row status indexes, so `operatorRunbook.stageHumanLineDisplayRowKeysByActionStatus` and `stageHumanLineDisplayRowKeysByEvidenceProgressStatus` let wrappers render runbook tabs and filters without reducing display rows.
- Added Website Console bundle handoff operator runbook human line display-row summaries, so `operatorRunbook.stageHumanLineDisplayRowSummary` and action-summary display-row counts let wrappers render row totals, action-status chips, and evidence-progress summary badges without reducing `stageHumanLineDisplayRows`.
- Added Website Console bundle handoff operator runbook human line display rows, so `operatorRunbook.stageHumanLineDisplayRows`, `stageHumanLineDisplayRowByKey`, and `nextStageHumanLineDisplayRow` let wrappers render runbook rows with stage labels, action status, and evidence-progress badge metadata without joining line arrays to action rows.
- Added Website Console bundle handoff operator runbook human line summaries, so `operatorRunbook.stageHumanLineSummary`, `nextStageHumanLineSummary`, and action-summary counts let wrappers render runbook headers, evidence-progress badges, and next-stage previews without reducing `stageHumanLines`.
- Added Website Console bundle handoff operator runbook human line JSON mirrors, so `operatorRunbook.stageHumanLines`, `stageHumanLineByKey`, and `nextStageHumanLine` let wrappers render the exact copy-ready runbook lines without parsing the Markdown prompt.
- Added Website Console bundle handoff operator runbook human evidence checklist progress, so target-repo handoff prompts show each action's first-render evidence progress, checklist status, and first unchecked evidence item without requiring operators to open JSON output first.
- Added Website Console bundle handoff operator runbook action evidence capture initial validation checklist summaries, so `operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey`, row-level checklist summary objects, checklist progress totals, and matching `nextStageAction*` mirrors let wrappers render first-load checklist progress without reducing checklist rows.
- Added Website Console bundle handoff operator runbook action evidence capture initial validation checklist metadata, so `operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistByKey`, row-level checklist arrays, checklist summary totals, and matching `nextStageAction*` mirrors let wrappers render first-load evidence completion checklists without reducing validation state arrays.
- Added Website Console bundle handoff operator runbook action evidence capture initial validation summaries, so `operatorRunbook.stageActionEvidenceCaptureInitialValidationSummaryByKey`, row-level summary objects, summary gate totals, and matching `nextStageAction*` mirrors let wrappers render action-level blocked/ready evidence form states without reducing per-field validation rows.
- Added Website Console bundle handoff operator runbook action evidence capture initial validation display metadata, so `operatorRunbook.stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey`, row-level display metadata arrays, display summary totals, and matching `nextStageAction*` mirrors let wrappers render `missing-required` and `optional-empty` states with stable labels, tones, icon names, action labels, helper text, and blocking flags without local status mapping.
- Added Website Console bundle handoff operator runbook action evidence capture initial validation states, so `operatorRunbook.stageActionEvidenceCaptureInitialValidationStatesByKey`, row-level initial state arrays, validation-state summary totals, and matching `nextStageAction*` mirrors let wrappers initialize required fields as blocking `missing-required` and optional fields as non-blocking `optional-empty` without running a separate validator before rendering evidence forms.
- Added Website Console bundle handoff operator runbook action evidence capture validation specs, so `operatorRunbook.stageActionEvidenceCaptureValidationSpecsByKey`, row-level validation spec arrays, validation spec summary totals, and matching `nextStageAction*` mirrors let wrappers validate required/optional evidence values from rule, severity, empty-state, min-length, value-shape, and failure-message metadata without maintaining separate validation schemas.
- Added Website Console bundle handoff operator runbook action evidence capture payload bindings, so `operatorRunbook.stageActionEvidenceCapturePayloadBindingsByKey`, row-level binding arrays, payload binding summary totals, and matching `nextStageAction*` mirrors let wrappers bind evidence form controls to payload paths, value shapes, validation rules, sections, and accessible labels without zipping parallel arrays.
- Added Website Console bundle handoff operator runbook action evidence capture payload templates, so `operatorRunbook.stageActionEvidenceCapturePayloadTemplateByKey`, flat payload templates, row-level payload template objects, payload template summary totals, and matching `nextStageAction*` mirrors let wrappers initialize source-bundle, handoff snapshot, handoff prompt, target-repo, and final evidence payloads without constructing nested objects from payload paths.
- Added Website Console bundle handoff operator runbook action evidence capture payload metadata, so `operatorRunbook.stageActionEvidenceCaptureFieldPayloadNamespacesByKey`, `stageActionEvidenceCaptureFieldPayloadPathsByKey`, payload namespace maps, row-level payload arrays, payload summary totals, and matching `nextStageAction*` mirrors let wrappers persist source-bundle verification, handoff prompt, target-repo, and final handoff evidence values without hard-coded payload path mapping.
- Added Website Console bundle handoff operator runbook action evidence capture section metadata, so `operatorRunbook.stageActionEvidenceCaptureFieldSectionKeysByKey`, `stageActionEvidenceCaptureFieldSectionLabelsByKey`, `stageActionEvidenceCaptureSectionKeysByKey`, `stageActionEvidenceCaptureSectionLabelsByKey`, section-count maps, row-level section arrays, section summary totals, and matching `nextStageAction*` mirrors let wrappers group evidence forms into source-bundle verification, handoff output, target-repo changes, QA, final evidence, and risk sections without hard-coded UI grouping.
- Added Website Console bundle handoff operator runbook action evidence capture display metadata, so `operatorRunbook.stageActionEvidenceCaptureFieldPlaceholdersByKey`, `stageActionEvidenceCaptureFieldRequirementLabelsByKey`, `stageActionEvidenceCaptureFieldAriaLabelsByKey`, `stageActionEvidenceCaptureFieldHelpTextsByKey`, row-level display arrays, display summary totals, and matching `nextStageAction*` mirrors let wrappers render accessible evidence forms without deriving placeholders, required/optional copy, ARIA labels, or helper text from full field objects.
- Added Website Console bundle handoff operator runbook action evidence capture default-value metadata, so `operatorRunbook.stageActionEvidenceCaptureFieldDefaultValuesByKey`, `stageActionEvidenceCaptureFieldEmptyValuesByKey`, row-level default/empty value arrays, default-value summary totals, and matching `nextStageAction*` mirrors let wrappers initialize text/file fields as empty strings and list fields as empty arrays without maintaining local value-shape defaults.
- Added Website Console bundle handoff operator runbook action evidence capture value-shape metadata, so `operatorRunbook.stageActionEvidenceCaptureFieldValueShapesByKey`, `stageActionEvidenceCaptureFieldAcceptsMultipleByKey`, row-level value-shape arrays, value-shape summary totals, and matching `nextStageAction*` mirrors let wrappers render long-text, short-text, file-path, and multi-value list evidence inputs without maintaining local `inputType` mapping.
- Added Website Console bundle handoff operator runbook action evidence capture validation metadata, so `operatorRunbook.stageActionEvidenceCaptureFieldValidationRulesByKey`, `stageActionEvidenceCaptureFieldMinLengthsByKey`, `stageActionEvidenceCaptureFieldExamplesByKey`, `stageActionEvidenceCaptureFieldValidationHintsByKey`, validation summary totals, and matching `nextStageAction*` mirrors let wrappers validate evidence forms without scanning full field objects or maintaining local schema maps.
- Added Website Console bundle handoff operator runbook action evidence capture field indexes, so `operatorRunbook.stageActionEvidenceCaptureFieldLabelsByKey`, `stageActionEvidenceCaptureFieldInputTypesByKey`, required/optional capture key maps, optional count maps, input-type totals, and matching `nextStageAction*` mirrors let wrappers render required-only, optional-only, and input-type-specific evidence forms without scanning full field arrays.
- Added Website Console bundle handoff operator runbook action evidence capture fields, so `operatorRunbook.stageActionEvidenceCaptureFieldsByKey`, capture field key/count maps, row-level `actionEvidenceCaptureField*`, `actionSummary` capture field totals, and matching `nextStageAction*` mirrors let wrappers render evidence input forms for command output, prompt files, target-repo changes, verification results, viewport/accessibility notes, risks, and final handoff records without local schema maps.
- Added Website Console bundle handoff operator runbook action evidence target fields, so `operatorRunbook.stageActionEvidenceTargetByKey`, `stageActionEvidenceTargetLabelByKey`, row-level `actionEvidenceTarget*`, `actionSummary` target counts, and matching `nextStageAction*` mirrors let wrappers distinguish local command output, local output files, target-repo evidence, and final handoff evidence records without hard-coded source mapping.
- Added Website Console bundle handoff operator runbook action evidence requirement fields, so `operatorRunbook.stageActionEvidenceRequirementsByKey`, `stageActionEvidenceRequirementCountByKey`, `stageActionRequiresEvidenceByKey`, row-level `actionEvidenceRequirement*`, `actionSummary` evidence counts, and matching `nextStageAction*` mirrors let wrappers render per-action evidence capture requirements without hard-coded company handoff checklists.
- Added Website Console bundle handoff operator runbook action completion criteria fields, so `operatorRunbook.stageActionCompletionCriteriaByKey`, `stageActionCompletionCriteriaCountByKey`, `stageActionHasCompletionCriteriaByKey`, row-level `actionCompletionCriteria*`, `actionSummary` completion counts, and matching `nextStageAction*` mirrors let wrappers render per-action done criteria without hard-coded handoff checklists.
- Added Website Console bundle handoff operator runbook action dependency reason fields, so `operatorRunbook.stageActionDependencyReasonCodeByKey`, `stageActionDependencyReasonByKey`, `stageActionBlockedStageCountByKey`, `stageActionBlocksStagesByKey`, row-level `actionDependencyReason*` / `actionBlockedStage*`, and matching `nextStageAction*` mirrors let wrappers explain prerequisite blocks and downstream blocked actions without scanning `stageActionRows`.
- Added Website Console bundle handoff operator runbook action prerequisite fields, so `operatorRunbook.stageActionPrerequisiteKeysByKey`, `stageActionPrerequisiteLabelsByKey`, `stageActionPrerequisiteCountByKey`, `stageActionHasPrerequisitesByKey`, `stageActionBlockedStageKeysByKey`, `stageActionBlockedStageLabelsByKey`, and matching `nextStageAction*` mirrors let wrappers render ordered handoff dependencies without hard-coded stage sequencing.
- Added Website Console bundle handoff operator runbook action readiness fields, so `operatorRunbook.stageActionEnabledByKey`, `stageActionStatusByKey`, `stageActionStatusLabelsByKey`, `stageActionStatusToneByKey`, `stageActionDisabledReasonCodeByKey`, `stageActionDisabledReasonByKey`, and matching `nextStageAction*` mirrors let wrappers render enabled states, manual-step badges, disabled reasons, and status tones without recomputing command availability.
- Added Website Console bundle handoff operator runbook action affordance fields, so `operatorRunbook.stageActionInstructionsByKey`, `stageActionButtonLabelsByKey`, `stageActionAffordanceByKey`, and matching `nextStageAction*` mirrors let wrappers render action guidance, button labels, and command/manual affordances without hard-coded UI copy.
- Added Website Console bundle handoff operator runbook action summary fields, so `operatorRunbook.stageActionRows`, `stageActionTypeByKey`, `stageActionLabelByKey`, `actionSummary`, `nextStageActionType`, and `nextStageActionLabel` let wrappers render run/refresh/write/manual/evidence actions without scanning `stages[]`.
- Added Website Console bundle handoff operator runbook stage command lookup fields, so `operatorRunbook.stageCommandKeysByKey`, `stageCommandLabelsByKey`, `stageCommandStringsByKey`, `stageCommandArgsByKey`, `stageCommandRunPoliciesByKey`, `stageCommandSafetyLevelsByKey`, and matching `nextStage*` arrays let wrappers render or execute stage commands without scanning `stages[]`.
- Added Website Console bundle handoff operator runbook stage capability lookup fields, so `operatorRunbook.stageHasCommandsByKey`, `stageManualByKey`, `stageWritesLocalFileByKey`, `stageExternalCallsByKey`, `stageTargetRepoMutationByKey`, and matching `nextStage*` mirrors let wrappers gate command-bearing, manual, local-output, external-call, and target-repo mutation boundaries without scanning `stages[]`.
- Added Website Console bundle handoff operator runbook stage gating lookup fields, so `operatorRunbook.stageKindByKey`, `stageRequiredByKey`, `stageRunPolicyByKey`, `stageSafetyLevelByKey`, `stageCommandCountByKey`, `stageOutputFilesByKey`, and `nextStage*` mirrors let wrappers render and gate stages without scanning `stages[]`.
- Added Website Console bundle handoff operator runbook display fields, so `operatorRunbook.stageLabelByKey`, `stageSummaryByKey`, `nextStageLabel`, and `nextStageSummary` let wrappers render stage copy without scanning stage objects.
- Added Website Console bundle handoff operator runbook lookup fields, so `operatorRunbook.stageKeys`, `stageByKey`, `commandStageKeys`, `manualStageKeys`, `nextStage`, and `nextCommandEntry` let wrappers consume the next source-bundle gate without scanning stage arrays.
- Added a Website Console bundle handoff operator runbook, so `--bundle-handoff --json` mirrors an `operatorRunbook` with source bundle verification, optional handoff JSON refresh, effective task prompt output, target-repo execution, and evidence-recording stages derived from the command manifest.
- Added a Website Console bundle handoff command manifest, so `--bundle-handoff --json` exposes one mirrored `commandManifest` with source-bundle commands, selectable task handoff commands, safety counts, active task command keys, and per-command safety metadata.
- Added source-bundle command safety metadata to Website Console bundle handoff output, so `sourceBundle.checkCommand`, `sourceBundle.strictCheckCommand`, `sourceBundle.handoffCommand`, and `sourceBundle.strictHandoffCommand` expose read-only run policy and safety objects for wrapper execution gates.
- Added task-level handoff command safety metadata to Website Console bundle handoff output, so `bundle.taskCatalog.items[]`, `bundle.defaultTask`, `bundle.selectedTask`, and `bundle.effectiveTask` expose `handoffCommandRunPolicy`, `strictHandoffCommandRunPolicy`, `handoffCommandSafety`, and `strictHandoffCommandSafety` for wrapper execution gates.
- Added task-level handoff command argument arrays to Website Console bundle handoff output, so `bundle.taskCatalog.items[]`, `bundle.defaultTask`, `bundle.selectedTask`, and `bundle.effectiveTask` expose structured `handoffCommandArgs` / `strictHandoffCommandArgs` alongside the existing copy-ready command strings.
- Added source-bundle verification command argument arrays to Website Console bundle handoff output, so wrappers can execute default/strict bundle-check and bundle-handoff flows from structured `sourceBundle.*CommandArgs` without shell parsing while preserving the existing command strings.
- Added source-bundle verification command metadata to Website Console bundle handoff output, so `sourceBundle` now carries copy-ready bundle-check and bundle-handoff commands for default and strict revalidation, and human target-repo prompts show the strict bundle-check command.
- Added Website Console bundle handoff source provenance metadata, so `--bundle-handoff --json` mirrors the verified bundle directory, status, source workspace, checksum counts, generated contract counts, and issue counts under `sourceBundle` and `bundle.sourceBundle`, while human target-repo prompts show the same source bundle provenance line.
- Added human-output package smoke coverage for Website Console bundle handoff effective-task metadata, so installed-bin and one-shot `npm exec --package <tarball>` paths verify default and selected task prompts keep copy-ready strict handoff commands.
- Added effective-task Website Console bundle handoff command metadata, so `--bundle-handoff --json` responses now expose `bundle.effectiveTask` for both default and explicit task selection without wrapper-side fallback logic.
- Added default-task Website Console bundle handoff command metadata, so `--bundle-handoff --json` responses now expose `bundle.defaultTask` with copy-ready handoff output and strict command fields instead of requiring wrappers to infer the default from `taskCatalog.items[0]`.
- Added selected-task Website Console bundle handoff command metadata, so explicit `--bundle-handoff --task <id-or-number> --json` responses now include `bundle.selectedTask.handoffOutFile`, `handoffCommand`, and `strictHandoffCommand`, and the target-repo prompt calls out the selected strict command directly.
- Added per-task Website Console bundle handoff commands, so `bundle.taskCatalog.items[]` now includes `handoffOutFile`, `handoffCommand`, and `strictHandoffCommand`, and the target-repo prompt shows a copy-ready strict command for each selectable refactor task.
- Added Website Console bundle handoff task catalogs, so `design-ai site <bundle-dir> --bundle-handoff` now exposes selectable task numbers, ids, priority, impact, effort, pages, and recommended MCPs in JSON `bundle.taskCatalog` and in the target-repo prompt.
- Added `design-ai site <bundle-dir> --bundle-handoff --task <id-or-number>`, so verified Website Console handoff bundles can generate a target-repo Codex prompt for a selected refactor task, with JSON `bundle.selectedTask` metadata and installed-bin/one-shot package smoke coverage.
- Added `design-ai site --from-intake file.md|--stdin --bundle --tasks --out <dir>`, so company website pilots can use a task-explicit intake-to-handoff-bundle command, with installed-bin and one-shot package smoke coverage plus release metadata guard wording.
- Added `design-ai site --from-intake file.md|--stdin --tasks`, so filled company website intake Markdown with initial audit findings can generate `website-workspace.tasks.json` directly, with installed-bin and one-shot package smoke coverage plus release metadata guard wording.
- Added Website Console `design-ai site --help` examples and release metadata guard coverage for from-intake stdin workspace, next-actions, and bundle commands, so company website pilots can discover the piped intake workflow directly from CLI help.
- Added package smoke coverage and release metadata guard coverage for `design-ai site --from-intake --stdin --next-actions --json`, JSON `--out`, and human Markdown `--out`, so piped company website intake Markdown can generate a verified operator checklist before target-repo work starts.
- Added package smoke coverage and release metadata guard coverage for `design-ai site --from-intake --stdin --out <file>` and `design-ai site --from-intake --stdin --bundle --out <dir>`, so piped company website intake Markdown is verified through both saved workspace JSON and handoff bundle generation in installed-bin and one-shot package paths.
- Added `design-ai site --from-intake --stdin` so filled company website intake Markdown can be piped directly into workspace JSON or next-actions generation without creating a temporary file, with package smoke coverage for installed-bin and one-shot `npm exec --package <tarball>` paths.
- Added packed-tarball smoke coverage and release metadata guard coverage for `design-ai site --from-intake`, so installed-bin and one-shot `npm exec --package <tarball>` paths verify filled Markdown intake import to workspace JSON stdout, workspace JSON `--out`, and handoff bundle generation.
- `design-ai site --from-intake file.md` now converts a filled English or Korean company website intake Markdown file into deterministic workspace JSON, `--next-actions` runbooks, or `--bundle --out <dir>` handoff bundles while preserving Site Profile fields, priority pages, user flows, brand notes, MCP readiness statuses, and grounded initial audit findings.
- `design-ai site --intake-template --language ko` now emits the Korean company website intake Markdown template, reports `language: "ko"` plus `company-website-intake.ko.md` in JSON metadata, and is covered by installed-bin and one-shot packed-tarball smoke paths while keeping English as the default output.
- Added release metadata guard coverage for `design-ai site --intake-template` package smoke wording, so release-facing docs cannot silently drop the installed-bin and one-shot JSON/Markdown/output-file intake template coverage.
- Added packed-tarball smoke coverage for `design-ai site --intake-template` across installed-bin and one-shot `npm exec --package` paths, including JSON stdout, Markdown stdout, Markdown `--out`, and JSON `--out` assertions.
- `design-ai site --intake-template [--language en|ko] [--json] [--out file]` now emits a blank company website intake Markdown template and optional machine-readable metadata, so company pilots can start from CLI before site details are ready for `--init`.
- Added English and Korean Company Website Intake Templates, linked from Website Improvement and the dogfood runbook, so real company-site pilots can collect site metadata, priority pages, MCP readiness, findings, and target-repo verification gates before bundle generation.
- Added a Company Website Dogfood Runbook in English and Korean, plus MkDocs navigation and Website Improvement links, so the first internal company-site pilot has a concrete intake, bundle, target-repo execution, evidence-return, and stop-condition sequence.
- Website Console handoff bundles now include a target-repo execution checklist in `summary.json.handoff`, bundle README, bundle-check validation, and `bundle-handoff` JSON/prompt output, so company dogfood implementation starts with explicit repo confirmation, architecture inspection, focused task scope, quality gates, and evidence recording requirements.
- Website Console handoff bundles now include machine-readable `summary.json.handoff` readiness guidance and a README Handoff Readiness section, so company dogfood operators can distinguish strict-ready bundles from warning-state draft handoff prompts before target-repo implementation.
- `design-ai site --init --bundle --out <dir>` now writes a complete Website Console init handoff bundle directly from company project intake fields, reducing the company dogfood setup path from workspace-save-then-bundle to a single deterministic local command with installed-bin and one-shot package smoke coverage.
- `design-ai site --init --next-actions` now generates a deterministic company dogfood operator runbook directly from init fields, including the workspace save command plus MCP check, task generation, handoff report, and bundle follow-up commands before target-repo work begins.
- `design-ai site --init --name ... --live-url ...` now generates a real-project Website Improvement workspace JSON with deterministic Site Profile fields, default audit checklist notes, derived MCP readiness, implementation evidence placeholders, stdout/file output support, and packed-tarball smoke coverage for installed-bin and one-shot `npm exec --package` paths.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include manual-apply status tone fields, so wrappers can style apply badges with `neutral`, `warning`, or `success` without maintaining local status-tone mapping.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include manual-apply status label fields, so wrappers can render apply badges without maintaining a local enum-to-label map.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include manual-apply status enum fields, so wrappers can render apply badges from `not-applicable`, `blocked`, or `ready` without deriving state from multiple booleans.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include manual-apply blocked reason code/message fields, so wrappers can render disabled patch-apply copy without deriving explanations from candidate and pending-precondition state.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactManualApplyReadyByKey` and `nextCommandOutputArtifactManualApplyReady`, so wrappers can gate manual patch-apply affordances without recomputing candidate and required-pending precondition state.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include satisfied, pending, and required-pending apply-precondition count fields, so wrappers can render patch-apply checklist enabled/disabled summaries without recomputing state from precondition rows.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactApplyPreconditionCountByKey`, `commandOutputArtifactRequiredApplyPreconditionCountByKey`, `nextCommandOutputArtifactApplyPreconditionCount`, and `nextCommandOutputArtifactRequiredApplyPreconditionCount`, so wrappers can render checklist summaries without recounting compact precondition objects.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactApplyPreconditionsByKey` and `nextCommandOutputArtifactApplyPreconditions`, so wrappers can consume compact `{ id, label, required }` checklist items without zipping parallel id/label arrays.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactApplyPreconditionLabelsByKey` and `nextCommandOutputArtifactApplyPreconditionLabels`, so wrappers can render patch-apply checklist copy without hard-coding labels for precondition ids.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactApplyPreconditionIdsByKey` and `nextCommandOutputArtifactApplyPreconditionIds`, so wrappers can render ordered patch-apply checklist items without recombining review and clean-workspace booleans.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey` and `nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply`, so wrappers can require a clean workspace before manually applying patch previews without confusing preview generation safety with apply safety.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactReviewInstructionByKey` and `nextCommandOutputArtifactReviewInstruction`, so wrappers can render review guidance for Markdown reports and patch previews without hard-coding artifact-specific copy.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactRequiresManualReviewByKey` and `nextCommandOutputArtifactRequiresManualReview`, so wrappers can require human review before applying patch previews without parsing command keys or manual-apply candidate flags.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactManualApplyCandidateByKey` and `nextCommandOutputArtifactManualApplyCandidate`, so wrappers can show manual-apply affordances only for patch previews without parsing artifact disposition strings.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactDispositionByKey` and `nextCommandOutputArtifactDisposition`, so wrappers can distinguish review-only artifacts from manual-apply previews without hard-coding command keys.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactMediaTypeByKey` and `nextCommandOutputArtifactMediaType`, so wrappers can configure Markdown and diff viewers/downloads without parsing file extensions or artifact type strings.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactActionByKey` and `nextCommandOutputArtifactAction`, so wrappers can choose Markdown report rendering or unified diff preview rendering without deriving UI behavior from artifact type strings.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactTypeByKey` and `nextCommandOutputArtifactType`, so wrappers can distinguish Markdown review reports from unified diff previews without parsing file extensions.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandOutputArtifactByKey` and `nextCommandOutputArtifact`, so wrappers can display selected preview artifact targets without parsing `--out` arguments.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandDescriptionByKey` and `nextCommandDescription`, so wrappers can render selected preview command tooltips or secondary descriptions without hard-coding command semantics.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandDisplayLabelByKey` and `nextCommandDisplayLabel`, so wrappers can render selected preview command labels without deriving UI copy from camelCase command keys.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandStringByKey`, so wrappers can display or copy selected preview command strings by key without scanning arrays or opening full command objects.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandArgsByKey`, so wrappers can retrieve selected preview command argv by key without scanning arrays or opening full command objects.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandSafetyLevelByKey`, so wrappers can validate selected preview command safety levels by key without scanning arrays.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandRunPolicyByKey`, so wrappers can validate selected preview command run policies by key without scanning arrays.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandStepByKey`, so wrappers can validate selected preview command order by key without scanning `decision.commands` or the full command sequence.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decision commands now include `step` plus `nextCommandStep`, so wrappers can preserve the selected preview branch's original command-sequence order without reading the full sequence.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `nextCommandSafety`, so wrappers that consume the separate `nextCommand*` fields can gate the selected preview command without reading `nextCommandEntry`.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decision commands now include nested `safety` objects, so wrappers can gate selected preview commands from `decision.commands`, `decision.commandByKey`, or `decision.nextCommandEntry` without jumping to the full command sequence.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `nextCommandEntry`, a compact full command object for the first optional preview command, so wrappers can execute or display the selected preview handoff without reconstructing it from separate fields.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include `commandByKey` plus `nextCommandKey` / `nextCommandArgs` metadata so wrappers can retrieve the first optional preview command without scanning `decision.commands`.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include compact `commands` with command strings, structured args, run policy, and safety flags for the selected optional preview branch.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection decisions now include a self-contained `safety` summary so wrappers can see local-output writes, mutation boundaries, external-AI calls, and clean-workspace requirements from the decision object itself.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection output now includes a `decision` enum with `offer-optional-preview`, selected stage key, run policy, and required follow-up stage keys so local AI/agent wrappers can branch without parsing prose.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` stage-selection output now includes compact selected-stage summaries for the optional preview stage, first required manual stage, and first required command-bearing stage, including command counts and safety flags.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` operator runbooks now include a `stageSelection` summary with the `optional-preview-before-required-manual-edit` strategy, stage order, optional preview commands, first required stage, and first required command-bearing stage in one machine-readable object.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` operator runbooks now expose `nextRequiredStageKey`, `nextRequiredStageCommandKeys`, `nextRequiredCommandStageKey`, and `nextRequiredCommandStageCommandKeys`, letting local AI/agent wrappers distinguish optional preview artifacts from the first required manual stage and the next required command-bearing gate.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` operator runbooks now expose `stageKeys` and `stageByKey`, letting local AI/agent wrappers retrieve `previewArtifacts`, `manualSkillEdit`, `reviewReadiness`, and `strictGate` stages without scanning the ordered `stages` array.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose an `operatorRunbook` with staged preview-artifact, manual skill-edit, review-readiness, and strict-gate steps so local AI/agent wrappers can follow the accepted-proposal handoff without inferring operator order from prose.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose `commandSequenceKeys` and `commandSequenceByKey`, letting local AI/agent wrappers select named follow-up commands without scanning the ordered `commandSequence` array.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose `commandSequenceSummary`, giving local AI/agent wrappers a top-level executable/blocked status, read-only vs local-output counts, write/output flags, mutation flags, and external-AI boundary for the full follow-up sequence.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose a fail-closed `commandSequence` with per-step `commandArgs`, `runPolicy`, and safety metadata, so local AI/agent wrappers can execute the full review-check/report/patch-preview/strict-gate handoff without inferring order from prose.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose `nextCommandRunPolicy` and `nextCommandSafety` metadata, keeping the first follow-up command explicitly read-only and non-mutating for local AI/agent wrappers.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose `nextCommandKey`, `nextCommand`, and `nextCommandArgs` for the first safe read-only follow-up command, so local AI/agent wrappers can execute the review-check handoff without reparsing command prose.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose top-level `checkCount`, `passCount`, and `warningCount` alongside `failureCount`, so local AI/agent wrappers can summarize follow-up command readiness without scanning every contract check.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` command contracts now expose `failureCount`, `failedCheckIds`, `failedChecks`, and `nextAction` diagnostics so local AI/agent wrappers and human operators can recover from invalid follow-up command contracts without scanning every check.
- Release metadata now guards release-facing docs against dropping the packed-tarball human apply-plan `Command contract` smoke wording for `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan`.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` human output now prints the apply-plan command contract summary, and packed-tarball smoke verifies the installed-bin and one-shot package paths preserve that console contract without mutating profile or review files.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --json` now includes a `commandContract` summary that validates required follow-up command keys, review-file context, expected command suffixes, and read-only forbidden flags; Markdown apply-plan reports show the same contract summary.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --json` now has full follow-up `commandArgs` contract coverage for review-check JSON, review-check report, patch preview, and strict-gate commands across unit and packed-tarball smoke tests.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` now preserves the active learning profile, usage sidecar, signal source, and review file in its follow-up command strings and machine-readable `commandArgs`, making manual apply/review-check handoffs reproducible without mutating skill files.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` now turns accepted skill proposal review decisions into read-only manual apply plans in human, JSON, or Markdown report form without mutating `learning.json`, review files, or skill files.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --json` and `--apply-plan --report --out skill-proposal-apply-plan.md` through installed-bin and one-shot `npm exec --package <tarball>` paths, with release metadata guards for the release-facing smoke phrases.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --report --out skill-proposal-review-check.md` Markdown readiness reports through installed-bin and one-shot `npm exec --package <tarball>` paths, with release metadata guards for the release-facing smoke phrase.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check` now emits a read-only review-file readiness check in human, JSON, or Markdown report form, verifying that current skill proposals are cleared by applied/rejected review decisions without mutating `learning.json`, review files, or skill files.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --json` through installed-bin and one-shot `npm exec --package <tarball>` paths, with release metadata guards for the release-facing smoke phrase.
- The full `npm run release:check` gate now passes after the learning readiness status-count index change, covering CLI unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke through installed-bin and one-shot package execution.
- `design-ai learn --signals` and focused `design-ai learn --agent-backlog` readiness JSON now include status count indexes (`checkCountByStatus`, `requiredCheckCountByStatus`, `optionalCheckCountByStatus`) so local AI/agent automation can inspect pass/info/warn/fail distribution without scanning the full check list.
- Learning signal and focused agent backlog Markdown reports now render the same readiness status count index, and packed-tarball smoke assertions verify the packaged JSON/Markdown contract.
- The full `npm run release:check` gate now passes after the public registry learning readiness Markdown report smoke guard, covering CLI unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke through installed-bin and one-shot package execution.
- Public registry smoke now verifies learning readiness Markdown report coverage for `learn --signals --report` and focused `learn --agent-backlog --report`, including the `Readiness check index` section from the published package path.
- Packed-tarball smoke now verifies readiness check index sections in learning signals and focused agent backlog Markdown reports, with release metadata guards for the release-facing smoke wording.
- `design-ai learn --signals --report` and `design-ai learn --agent-backlog --report` now render readiness check index summaries so operators can see required ids, optional ids, status lookup, and required lookup without parsing JSON.
- Release metadata now guards release-facing docs against dropping packed-tarball check index JSON field coverage for focused agent backlog readiness output.
- `design-ai learn --signals` and `design-ai learn --agent-backlog` readiness JSON now include `requiredCheckIds`, `optionalCheckIds`, `checkStatusById`, and `checkRequiredById` so local automation can branch on readiness checks without scanning the full `checks` array.
- Packed-tarball smoke now verifies focused agent backlog `optionalGapDetails` JSON field coverage for no-command check-capture optional gaps in installed-bin and one-shot package execution paths.
- `design-ai learn --signals` readiness JSON now includes `optionalGapDetails` for advisory gaps such as missing check-capture entries, preserving the existing `optionalGaps` id list while exposing the reason, next condition, and automation policy.
- `design-ai learn --signals --report` and `design-ai learn --agent-backlog --report` now render optional gap details so operators can see why missing check captures stay advisory and why no placeholder mutation command is emitted.
- The full `npm run release:check` gate now passes after the agent backlog readiness release metadata guard, covering CLI unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke through installed-bin and one-shot package execution.
- Release metadata now guards release-facing docs against dropping the packed-tarball `design-ai learn --agent-backlog` readiness summary and check-capture optional-gap smoke phrase.
- Packed-tarball smoke now verifies `design-ai learn --agent-backlog` readiness summaries in JSON and Markdown report output, including check-capture optional-gap semantics for no-command backlog states.
- `design-ai learn --agent-backlog` JSON and Markdown reports now pass through the signal registry readiness summary so focused backlog handoffs expose required gates, blocking checks, and optional evidence gaps without requiring a separate `learn --signals` parse.
- `design-ai learn --signals` JSON now includes a structured `readiness` summary that separates required local AI/agent gates from optional evidence gaps such as missing check-capture entries.
- `design-ai learn --signals --report` now renders the readiness summary and per-check required/optional status in Markdown so operators can review gate state without parsing the full JSON payload.
- The full `npm run release:check` gate now passes after the optional refresh-only agent backlog release evidence closeout, covering CLI unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke through installed-bin and one-shot package execution.
- Release evidence now records `release:self-test`, `package:check`, and focused agent backlog clear-state verification after the optional refresh-only no-command package smoke assertion landed.
- Packed-tarball smoke now verifies optional refresh-only `design-ai learn --agent-backlog --strict --json` no-command output in installed-bin and one-shot paths, including the `operatorRunbook.nextCommandSelection.reason` status-metadata wording.
- Release metadata now guards release-facing docs against dropping the optional refresh-only `design-ai learn --agent-backlog` runbook selection reason that treats no-command refresh output as status metadata instead of an executable handoff command.
- `design-ai learn --agent-backlog` eval replay now discovers sibling `learning-eval-report.json` reports, emits concrete `learn --eval --out` report-generation handoffs, and clears template-only warnings once an executed report exists.
- `design-ai learn --agent-backlog` now keeps missing check-capture entries advisory-only instead of emitting a placeholder `check artifact.md --learn --yes` action, so pass-state backlogs expose no mutation-capable next command until real `check:*` captures exist.
- `design-ai workspace` now separates active git changes from known untracked local portfolio/evidence artifacts, preserves the full raw status in `allStatusShort`, and reports ignored local artifacts through `ignoredStatusShort` / `ignoredLocalArtifactCount` without letting them block strict readiness.
- `design-ai learn --agent-backlog` command effect metadata now treats workspace `--learning-usage` arguments as usage sidecar targets, so workspace readiness follow-up commands expose both the active learning profile and usage sidecar path.
- `design-ai learn --agent-backlog` now classifies `--with-learning` usage-record follow-up commands as `mutates-local-state`, exposes `DESIGN_AI_LEARNING_FILE` and `DESIGN_AI_LEARNING_USAGE_FILE` targets in command effects, and routes those commands through `review-before-mutation` instead of preview-only handoff.
- `design-ai learn --agent-backlog` eval checkpoint bootstrap actions now target the active learning profile's sibling `learning-eval.json` path and the signal registry auto-detects that sibling checkpoint when summarizing eval readiness.
- `design-ai learn --agent-backlog` first-run profile initialization actions now expose an explicit `--dry-run` preview command plus separate `applyCommand` / `applyCommandArgs` / `applyCommandSafety` metadata for the confirmed `--yes` profile write.
- `design-ai learn --agent-backlog` operator handoff now scopes gate-required state to the current next queue command, so read-only preview commands can be presented as ready even when later file-write or mutation-review commands remain in the queue.
- `design-ai learn --signals` agent development backlog ranking now puts missing-profile initialization ahead of eval checkpoint bootstrap when both are `p1`, keeping the ranked next action aligned with the safe execution queue.
- `design-ai learn --agent-backlog` operator handoff output now includes compact `state` metadata so automation can distinguish ready, gate-required, review-required, and no-command handoff states without parsing prose.
- `design-ai learn --agent-backlog` refresh command metadata now preserves signal source, learning profile, and usage sidecar arguments so automation can re-check the same backlog context after handoff.
- `design-ai learn --agent-backlog` operator handoff output now includes refresh command metadata so local automation can re-check backlog state after the selected handoff command.
- `design-ai learn --agent-backlog` operator handoff output now includes a `decision` enum so local automation can branch without parsing reason text or recomputing gate state.
- `design-ai learn --agent-backlog` execution queue output now includes `operatorHandoff`, a single deterministic next-command decision for local automation.
- `design-ai learn --agent-backlog` execution queue output now includes `nextCommandAlignment`, comparing the operator runbook's first command with the safety-ordered queue command.
- `design-ai learn --agent-backlog` operator runbook output now includes `nextCommandSelection`, documenting the stage-order strategy behind `operatorRunbook.nextCommand`.
- `design-ai learn --agent-backlog` execution queue output now includes `nextCommandSelection`, documenting the safety-order strategy and whether the recommended queue command matches the ranked action-plan next step.
- `design-ai learn --agent-backlog` execution queue output now includes top-level `nextCommandArgs` next to `nextCommand` / `nextCommandRunPolicy`, completing the structured handoff contract for the safest queued next action.
- `design-ai learn --agent-backlog` action plan, command manifest, verification, gate commands, and operator runbook output now include structured `commandArgs` / `nextCommandArgs` metadata so local automation can consume reviewed commands without reparsing shell strings.
- `design-ai learn --agent-backlog` operator runbook output now includes `nextStage`, `nextCommand`, `nextCommandLabel`, `nextCommandRequired`, and `nextCommandRunPolicy` so local operators can start with the first gate command instead of accidentally jumping straight to the backlog action command.
- `design-ai learn --agent-backlog` execution queue now includes a deterministic `operatorRunbook` with `before`, `execute`, `after`, and `refresh` stages so local operators can follow the reviewed backlog sequence without rebuilding it from separate gate and manifest fields.
- `design-ai learn --agent-backlog` command effect review output now includes a deterministic `gateRunbook` grouped by `before`, `after`, `refresh`, and `other` phases so local runbooks can execute gate checks without filtering the flat command list.
- `design-ai learn --agent-backlog` command effect review output now includes a deterministic `gatePhaseSummary` so local runbooks can read gate counts, required counts, and before/after/refresh coverage without parsing gate command labels.
- `design-ai learn --agent-backlog` gate commands now include deterministic `phase` and `required` metadata so local runbooks can distinguish before-execution, after-execution, and backlog-refresh checks.
- `design-ai learn --agent-backlog` command effect review guidance now includes deterministic gate commands for clean-workspace checks, diff inspection, and backlog refresh.
- `design-ai learn --agent-backlog` execution queues now include `commandEffectReview` guidance that turns command target exposure into an operator review headline and checklist.
- `design-ai learn --agent-backlog` execution queues now include `commandEffectSummary` aggregate counts for command targets and mutation flags.
- `design-ai learn --agent-backlog` command manifest entries now include `commandEffects` target hints for output files, learning profile files, usage sidecars, mutation flags, and clean-workspace review reasons.
- `design-ai learn --agent-backlog` execution queues now include a command manifest with `runPolicy` metadata, so preview-only, file-write review, and mutation-review commands are explicit for operators and local automation.
- `design-ai learn --agent-backlog` action plans now include `executionQueue.ordered`, `orderedCount`, and `nextActionId` so operators and local automation can follow the recommended execution order without rebuilding it from grouped queue buckets.
- `design-ai learn --agent-backlog` action plans now include an `executionQueue` that groups preview/read-only, local file-write review, and local mutation review commands, plus the recommended next command for operator handoff.
- `design-ai learn --agent-backlog` action plans now include `safetySummary` counts so operators can see how many follow-up steps are read-only, local file writes, or local state mutations before opening every step.
- `design-ai learn --agent-backlog` action plan steps now include `commandSafety` metadata so read-only commands, local output-file writes, and apply/fix mutations are classified before an operator runs follow-up actions.
- `design-ai learn --agent-backlog` JSON and Markdown reports now include an executable `actionPlan` with ordered steps, verification commands, and mutation-review flags for local AI/agent development follow-up.
- Release metadata now guards release-facing docs against dropping the packed-tarball `design-ai learn --agent-backlog --report --out agent-backlog.md` Markdown report, agent backlog JSON `--out`, and `design-ai learn --agent-backlog --strict --json` strict gate smoke phrases.
- `design-ai learn --agent-backlog [--from-file signal-file-or-dir] [--usage-file path] [--strict] [--json|--report] [--out file]` now emits a focused read-only local AI/agent development backlog from the existing learning signal registry.
- Agent backlog reports can be saved as Markdown through `design-ai learn --agent-backlog --report --out agent-backlog.md`, while JSON output exposes counts, backlog actions, follow-up signal commands, recommendations, and privacy boundaries without mutating learning profiles, usage sidecars, skill files, eval files, or target repositories.
- Packed-tarball smoke now verifies `design-ai learn --agent-backlog` human, JSON, strict JSON, Markdown report, and JSON `--out` paths through installed-bin and one-shot `npm exec --package <tarball>` execution.
- The full `npm run release:check` gate now passes after the learning signal and skill proposal package smoke release metadata guards, covering CLI unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.
- Release metadata now guards release-facing docs against dropping the packed-tarball learn signals JSON `--out` file-write confirmation smoke phrase.
- Release metadata now guards release-facing docs against dropping the packed-tarball learn skill proposals JSON `--out` file-write confirmation smoke phrase.
- Release metadata now guards release-facing docs against dropping the packed-tarball `design-ai learn --propose-skills --review-file skill-proposals.review.json --json` read-only review decision join smoke phrase.
- Release metadata now guards release-facing docs against dropping the packed-tarball `design-ai learn --signals --report --out learning-signals.md` Markdown signal report smoke phrase.
- `design-ai learn --signals --report --out learning-signals.md` now writes a Markdown signal registry handoff with learning audit state, usage sidecar counts, eval signal files, check captures, workspace readiness, deterministic agent development backlog actions, recommendations, and privacy boundaries.
- Packed-tarball smoke now verifies `design-ai learn --signals --report --out learning-signals.md` Markdown signal reports through installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai learn --propose-skills --review-template --out skill-proposals.review.json` now emits a JSON proposal review scaffold for unresolved skill proposals, defaulting decisions to `deferred` so the review gate stays pending until an operator deliberately marks proposals `applied` or `rejected`.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --review-template --out skill-proposals.review.json` JSON review templates through installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai learn --propose-skills --review-file skill-proposals.review.json` now joins read-only proposal review decisions so applied or rejected skill proposal states can clear the proposal review gate without editing `learning.json`, skill files, or the review file.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --review-file skill-proposals.review.json --json` read-only review decision joins through installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --patch --out skill-proposals.patch` unified diff handoffs through installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai learn --propose-skills --patch` now emits a preview-only unified diff handoff for repeated check-capture skill proposals without mutating `learning.json` or editing skill files.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --min-evidence 3 --json` threshold skipping through installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai learn --propose-skills --min-evidence N` now lets operators tune how many related check-capture entries are required before a preview-only skill proposal appears, keeping the command non-mutating and local.
- Local release gates now isolate portfolio/evidence output artifacts: link audit skips `evidence/` and `_portfolio_export/`, npm package contents exclude local portfolio docs under `docs/`, and the package contents fixture understands exact/directory negation patterns so `npm run release:check` can pass without deleting local portfolio files.
- Release metadata now guards release-facing docs against dropping the packed-tarball `design-ai learn --propose-skills --report --out skill-proposals.md` Markdown review artifact smoke phrase.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --report --out skill-proposals.md` Markdown review artifacts through installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai learn --propose-skills --report --out skill-proposals.md` now writes a reviewer-friendly Markdown artifact for preview-only skill evolution proposals before any manual skill edit.
- The full `npm run release:self-test` chain now passes after the strict skill proposal package smoke metadata guard, covering release assertion fixtures, package smoke self-tests, registry smoke self-tests, release metadata self-tests, local CI self-tests, and token extractor self-tests.
- Release metadata now guards release-facing docs against dropping the packed-tarball `design-ai learn --propose-skills --strict --json` expected-failure smoke phrase.
- Packed-tarball smoke now verifies `design-ai learn --propose-skills --strict --json` as an expected-failure preview gate through installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai learn --propose-skills --strict` now exits non-zero when pending skill proposal review or upstream signal readiness warnings remain, while keeping the command preview-only and non-mutating.
- Release metadata now guards release-facing docs against dropping the packed-tarball `design-ai learn --signals --strict --json` smoke phrase, preserving strict local AI/agent readiness evidence in README, Distribution, and Release checklist guidance.
- Packed-tarball smoke now verifies `design-ai learn --signals --strict --json` through installed-bin and one-shot `npm exec --package <tarball>` paths, preserving the local AI/agent readiness gate after packaging.
- `design-ai learn --signals --strict` now exits non-zero when the local signal registry or deterministic agent development backlog is not `pass`, making learning-signal readiness usable as a local CI gate without mutating files.
- `design-ai learn --signals` now includes an `agentDevelopment` backlog in JSON and human output, ranking local/profile, usage, eval harness, check-capture, skill-evolution, and workspace readiness next actions without mutating profiles, skills, or calling external AI APIs.
- Roadmap and session history now record the post-Phase 409 scope decision boundary, separating push/Real-CI launch work from future AI learning architecture and broader product-surface expansion.
- `design-ai route --eval-template [--json]` generates a runnable route checkpoint template.
- `design-ai route --eval --from-file route-eval.json [--strict] [--json]` checks that briefs still select the expected route.
- Route eval JSON reports include status, pass/warn/fail summary, matched keywords, top route, expected route, and full route candidates.
- `design-ai prompt --eval-template [--json]` generates runnable prompt-plan checkpoints.
- `design-ai prompt --eval --from-file prompt-eval.json [--strict] [--json]` checks expected routes, required files, checklist items, prompt fragments, and optional learning context.
- `design-ai pack --eval-template [--json]` generates runnable prompt-pack checkpoints.
- `design-ai pack --eval --from-file pack-eval.json [--strict] [--json]` checks expected routes, planned files, included context files, context status, and optional learning context.
- Pack eval JSON reports include context metadata and markdown byte counts without embedding full context file bodies.
- `design-ai learn --signals [--from-file signal-file-or-dir] [--usage-file path] [--json]` joins learning profile audit state, usage sidecar activity, route/prompt/pack/learning eval signal files, check learning capture entries, and workspace readiness without changing `learning.json`.
- Learning signal registry JSON reports include `learning`, `usage`, `evals`, `checkCapture`, `workspace`, `recommendations`, and privacy metadata; human output summarizes eval signals, recent check captures, workspace readiness, and next actions.
- `design-ai learn --propose-skills [--from-file signal-file-or-dir] [--usage-file path] [--strict] [--json]` converts repeated check-capture learning signals into preview-only skill instruction delta proposals and can fail local gates when review is pending.
- Skill proposal JSON reports include `proposals` with `candidateSkillPath`, `evidenceSources`, `proposedInstructionDelta`, `verificationCommand`, `riskLevel`, and privacy metadata; single-entry groups are reported in `skipped`.
- `design-ai site --mcp-check --probes [--json]` adds read-only local MCP probe results for GitHub repo references, Figma URLs, Browser smoke targets, and deployment provider references.
- `design-ai site --mcp-check --probes --json` now includes `commands.mcpCheckProbesHumanOut`, `commands.mcpCheckProbesJsonOut`, `commands.mcpPlanProbesJson`, and `commands.mcpPlanProbesJsonOut` so readiness probe payloads carry their own human report preservation, JSON preservation, and next-step action-plan commands without changing the default non-probe MCP check JSON shape.
- `design-ai site --mcp-plan --probes --json` now includes `commands.mcpCheckProbesHumanOut` alongside the existing probe JSON preservation commands, so action-plan payloads can point operators back to the human readiness report archive path without opening the check payload first.
- `design-ai site --next-actions [--json]` now emits a deterministic local operator checklist that ranks workspace validation issues, MCP readiness gaps, task/MCP gaps, the top Codex implementation prompt, evidence handoff, and bundle export commands before target-repo work starts.
- `design-ai site --next-actions [--json]` now also folds read-only MCP probe readiness into the operator checklist, exposes `mcpProbeStatus`, `counts.probeGaps`, and probe follow-up commands, and ranks invalid GitHub/Figma/Browser/deploy references before target-repo handoff.

### Fixed
- Agent backlog operator runbook selection reasons now identify optional refresh-only no-command states as status metadata instead of implying an executable backlog handoff command was selected.
- Agent backlog operator handoff reasons now distinguish completed no-command states from optional refresh metadata, avoiding the implication that refresh is an executable handoff command.
- Agent backlog next-command alignment now reports optional refresh-only no-command states with an explicit empty-queue reason instead of saying no operator runbook command exists.
- Agent backlog operator runbooks now mark refresh-only no-command states as optional instead of required, keeping `operatorRunbook`, `commandEffectReview`, and `operatorHandoff` semantics aligned when the focused backlog is complete.
- Agent backlog operator handoff JSON now marks `no-command` pass states as `ready: true`, `hasCommand: false`, `complete: true`, and `requiresRefresh: false`, so local automation can distinguish a cleared backlog from a blocked handoff.
- Agent backlog unit tests now derive human/report count assertions from the generated JSON payload and tolerate environment-dependent workspace readiness actions while preserving ranking, target metadata, and mutation-review coverage.
- `design-ai site --next-actions [--json]` now surfaces MCP probe counts in both JSON and human output, so operators can see how many read-only repo/Figma/Browser/deploy reference probes passed, warned, or failed before bundle handoff.
- Shared smoke assertion self-tests now include a `design-ai site --stdin --next-actions --json` MCP probe count drift fixture, so next-actions count assertions cannot silently weaken.
- Release metadata now guards release-facing docs against dropping the shared smoke assertion self-test coverage phrase for Website Console next-actions MCP probe counts.
- Release metadata now guards release-facing docs against dropping the `design-ai site --stdin --next-actions --json` `mcpProbeCounts` probe count telemetry phrase.
- Release metadata now guards release-facing docs against dropping the Product Readiness release policy full gate evidence guard `npm run release:check` phrase.
- The full `npm run release:check` gate now passes after the release-facing docs Product Readiness release policy full gate evidence guard, covering unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- `design-ai site --bundle --out <dir>` now preserves read-only MCP probe evidence in `mcp-probes.json`, records probe status/counts in `summary.json`, and includes that probe file in checksum, generated contract, compare, repair, and target-repo handoff validation.
- `design-ai site <bundle-dir> --bundle-check/--bundle-compare/--bundle-handoff --json` now surfaces MCP probe counts alongside probe status, and bundle-check validates `summary.json` probe counts against `mcp-probes.json`.
- `design-ai site <bundle-dir> --bundle-check [--json]` now surfaces bundle boundary metadata in JSON and human output, including deterministic-local boundaries plus `externalCalls: false` and `targetRepoMutation: false`, so target-repo handoff reviews can confirm the check is local and non-mutating without opening `summary.json`.
- `design-ai site <bundle-dir> --bundle-handoff [--json]` now surfaces handoff generation boundary metadata in JSON and in the generated target-repo prompt, including deterministic-local boundaries plus `externalCalls: false` and `targetRepoMutation: false`, so operators can separate local handoff generation from future target-repo implementation work.
- `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir>` human output now shows left/right MCP probe counts so operators can see probe coverage without switching to JSON.
- CLI tests now cover the real `runSite` human `--bundle-compare` path for the left/right MCP probe count summary.
- Package smoke self-tests now include bundle check/compare/handoff MCP probe count drift fixtures, so packed smoke assertions fail if the count contract is weakened.
- Package smoke self-tests now also cover bundle-check top-level and bundle-compare right-side MCP probe count drift, completing the bundle count assertion surface.
- Package smoke now validates bundled Website Console `mcp-probes.json` as saved probe evidence instead of the full `site --mcp-check --probes --json` response, with a self-test drift fixture for bundle probe item status.
- Release metadata now guards release-facing docs against dropping the bundled Website Console `mcp-probes.json` saved probe evidence payload assertion phrase, so docs preserve that bundle files are not the full `site --mcp-check --probes --json` response.
- Product Readiness now preserves the bundled Website Console `mcp-probes.json` saved probe evidence payload boundary, and release metadata guards that readiness wording.
- The full `npm run release:self-test` chain now passes after the Website Console bundle `mcp-probes.json` saved-payload guard phases, covering shared smoke assertions, package smoke, registry smoke, release metadata, local CI, and token extractor self-tests together.
- The full `npm run release:check` gate now passes after the Website Console bundle `mcp-probes.json` saved-payload guard phases, covering unit tests, strict audits, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards Product Readiness against dropping the `npm run release:check` evidence for Website Console bundle `mcp-probes.json` saved-payload guard phases.
- Release metadata now guards release-facing docs against dropping the Website Console bundle `mcp-probes.json` saved-payload `npm run release:check` evidence phrase.
- The full `npm run release:self-test` chain now passes after the Product Readiness and release-facing policy docs `mcp-probes.json` saved-payload `release:check` evidence guards.
- The full `npm run release:check` gate now passes after the Product Readiness and release-facing policy docs `mcp-probes.json` saved-payload `release:check` evidence guards, covering unit tests, strict audits, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards Product Readiness against dropping the Website Console bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata phrase for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation.
- Release metadata now guards release-facing docs against dropping the Website Console bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata phrase alongside public registry Website Console smoke coverage.
- The full `npm run release:check` gate now passes after the Product Readiness and release-facing policy docs bundle boundary metadata guards, covering unit tests, strict audits, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards Product Readiness against dropping the full `npm run release:check` evidence for Website Console bundle boundary metadata guard phases.
- Release metadata now guards release-facing docs against dropping the Website Console bundle boundary metadata `npm run release:check` evidence phrase.
- The full `npm run release:self-test` chain now passes after the Product Readiness and release-facing policy docs bundle boundary metadata `release:check` evidence guards, covering shared smoke assertions, package smoke, registry smoke, release metadata, local CI, and token extractor self-tests together.
- The full `npm run release:check` gate now passes after the Product Readiness and release-facing policy docs bundle boundary metadata `release:check` evidence guards plus their full `release:self-test` evidence recording, covering unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards Product Readiness against dropping the Website Console bundle boundary metadata full `release:check` evidence phrase that includes full `release:self-test` evidence recording plus unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.
- Release metadata now guards release-facing docs against dropping the Website Console bundle boundary metadata full `release:check` evidence phrase, keeping README, Korean README, Distribution docs, Korean Distribution docs, and the release checklist aligned with Product Readiness.
- The full `npm run release:check` gate now passes after the release-facing policy docs Website Console bundle boundary metadata full `release:check` evidence guard, covering unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards Product Readiness against dropping the full `npm run release:check` evidence after the release-facing policy docs Website Console bundle boundary metadata full `release:check` evidence guard.
- The full `npm run release:check` gate now passes after the Product Readiness release policy full gate guard, covering unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards release-facing docs against dropping the Product Readiness release policy full gate `npm run release:check` evidence phrase for Website Console bundle boundary metadata full `release:check` evidence.
- The full `npm run release:check` gate now passes after the release-facing policy docs Product Readiness release policy full gate evidence guard, covering unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards Product Readiness against dropping the full `npm run release:check` evidence after the release-facing policy docs Product Readiness release policy full gate evidence guard.
- The full `npm run release:check` gate now passes after the Product Readiness release policy full gate evidence guard, covering unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke together.
- Release metadata now guards release-facing docs against dropping the package smoke self-test coverage phrase for Website Console bundle MCP probe counts.
- Product Readiness now states that Website Console MCP probe count telemetry is protected by package/shared smoke self-test coverage, and release metadata guards that Product Readiness wording.
- The full `npm run release:self-test` chain now passes after the Website Console MCP probe count self-test and release metadata guard phases, covering shared smoke assertions, package smoke, registry smoke, release metadata, local CI, and token extractor self-tests together.
- Release metadata now guards release-facing docs against dropping the Website Console bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry phrase.
- Release metadata now guards release-facing docs against dropping the public registry `design-ai site --stdin --next-actions --json` next-action operator checklist smoke phrase.
- Public-registry smoke now directly executes `design-ai site --stdin --next-actions --json` through `npm exec --package @design-ai/cli@<version>`, matching packed-tarball coverage for the next-action operator checklist contract.
- Packed-tarball smoke now directly executes `design-ai site --stdin --next-actions --json` through installed-bin and one-shot `npm exec --package <tarball>` paths, with shared JSON assertions for local/read-only boundaries, ranked actions, and emitted follow-up commands.
- Packed-tarball and public-registry smoke now verify `design-ai site --stdin --next-actions --json --out file --force` output-file persistence, checking write confirmation, forced overwrite replacement, and the saved next-action JSON contract through installed-bin, one-shot npm exec, and published-package paths.
- Release metadata now guards release-facing docs against dropping the `design-ai site --stdin --next-actions --json --out file --force` next-action output-file smoke phrase.
- Packed-tarball and public-registry smoke now verify `design-ai site --stdin --next-actions --out file --force` human Markdown output-file persistence, with shared assertions for write confirmation, forced overwrite replacement, prioritized actions, emitted commands, and local/operator boundaries.
- Release metadata now guards release-facing docs against dropping the `design-ai site --stdin --next-actions --out file --force` next-action human output-file smoke phrase.
- `design-ai site --help` now includes a copy/paste example for saving the human next-actions Markdown report with `--out website-next-actions.md`, and shared help-topic smoke assertions require that example in packed-tarball and public-registry help output.
- Release metadata now guards release-facing docs against dropping the `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown help example phrase.
- CLI unit tests now verify `design-ai site <workspace.json> --next-actions --out file --force` human Markdown output-file persistence, including forced overwrite replacement, prioritized command text, local/operator boundaries, and non-JSON output shape.
- CLI help unit tests now also verify the `design-ai site <workspace.json> --next-actions [--json] [--out file] [--force]` usage line so command discovery keeps matching the saved next-actions Markdown and JSON workflows.
- CLI unit tests now verify fail-state Website Console next-actions output, ensuring missing required MCP readiness ranks a blocking action first and `design-ai site --next-actions --strict --json` exits non-zero.
- CLI unit tests now verify the no-task Website Console next-actions setup path, ensuring an empty `refactorTasks` list recommends `design-ai site <workspace.json> --tasks --out website-workspace.tasks.json` before implementation prompts.
- CLI unit tests now verify Website Console next-actions implementation evidence guidance, ensuring missing executed work or verification results recommends `--report --out website-handoff.md` and evidence-ready workspaces skip that handoff reminder.
- CLI unit tests now verify Website Console next-actions warning paths for missing optional MCP readiness evidence and task/MCP gaps, ensuring both route operators to `--mcp-plan --out mcp-action-plan.md` before target-repo implementation.
- CLI unit tests now verify the full Website Console next-actions JSON `commands` block, including summary, MCP check, MCP plan, task generation, implementation prompt, handoff report, and handoff bundle follow-up commands.
- CLI unit tests now verify Website Console next-actions stdin command targets, ensuring `filePath: "stdin"` emits `<workspace.json>` follow-up command placeholders in the JSON `commands` block.
- CLI unit tests now verify Website Console next-actions multi-task priority selection, ensuring P0/P1/P2 refactor tasks sort into top-task order and the implementation action targets the P0 task first.
- CLI unit tests now verify Website Console next-actions top-task capping, ensuring four-task workspaces report the total task count while exposing only the top three P0/P1/P2 tasks.
- CLI unit tests now verify Website Console next-actions action rank sequencing across pass, warning, and blocking paths, ensuring severity sorting renumbers actions from 1 without gaps.
- CLI unit tests now verify `design-ai site --next-actions --strict --json` exits non-zero for warning-only Website Console workspaces, not only fail-state blockers.
- CLI unit tests now verify `design-ai site --mcp-plan --strict --json` exits non-zero for warning-only Website Console MCP readiness gaps, matching the strict behavior already guarded for summary and next-actions outputs.
- CLI unit tests now verify `design-ai site --mcp-check --strict --json` exits non-zero for warning-only optional MCP readiness gaps, covering the source readiness gate behind action plans and next-actions.
- CLI unit tests now verify `design-ai site --graph --strict --json` exits non-zero for warning-only Website Console MCP readiness gaps, ensuring portable workflow graph exports preserve strict readiness gating.
- CLI unit tests now verify `design-ai site --bundle --strict` exits non-zero for warning-only Website Console MCP readiness gaps while preserving warning status in the generated handoff bundle.
- CLI unit tests now verify `design-ai site <bundle-dir> --bundle-check --strict --json` exits non-zero for warning-only handoff bundles while keeping the bundle valid and reporting `bundle-readiness-warn`.
- CLI unit tests now verify `design-ai site <bundle-dir> --bundle-handoff --strict --json` exits non-zero for warning-only handoff bundles while preserving bundle warning context in the target-repo prompt payload.
- `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` now preserves left/right bundle-check warnings as compare warnings, so identical warning-state bundles keep `sameBundle: true` while still exiting non-zero under strict mode.
- CLI unit tests now verify `design-ai site <bundle-dir> --bundle-repair --yes --strict --json` exits non-zero when regeneration cannot clear warning-only MCP readiness gaps, reporting `bundle-repair-verify-fail`.
- Packed-tarball and public-registry smoke now verify warning-state Website Console bundle-compare strict failures, ensuring identical warning bundles keep `sameBundle: true` while exiting non-zero under `--strict`.
- Release metadata now guards release-facing docs against dropping the warning-state Website Console bundle-compare strict smoke phrase.
- Product readiness now explicitly calls out the warning-state Website Console bundle-compare strict smoke coverage, so completion status no longer reads like pass-state digest comparison is the only verified compare path.
- Product readiness public-registry summaries now also name the warning-state Website Console bundle-compare strict smoke path instead of grouping it only under generic bundle-check/compare/handoff/repair coverage.
- Release metadata now guards Product Readiness against dropping the warning-state Website Console bundle-compare strict coverage wording.
- Release metadata JSON now exposes `product_readiness_checked: true` when the Product Readiness guard is active.
- Release metadata now guards release-facing docs against dropping the `product_readiness_checked` Product Readiness JSON summary phrase.
- Packed-tarball and public-registry smoke now execute the `mcpCheckProbesHumanOut` command emitted by `design-ai site --mcp-plan --probes --json`, verifying that action-plan payloads preserve the human readiness probe report through installed-bin, one-shot npm exec, and published-package paths.
- Packed-tarball and public-registry smoke now also execute the `mcpCheckProbesJsonOut` command emitted by `design-ai site --mcp-plan --probes --json`, verifying that action-plan payloads can preserve the machine-readable MCP readiness probe JSON directly.
- Packed-tarball and public-registry smoke now execute the `mcpPlanProbesJsonOut` command emitted by the action-plan payload itself, verifying that structured MCP action plans can preserve their own JSON archive command from installed-bin, one-shot npm exec, and published-package paths.
- Release metadata now guards the MCP action plan emitted check JSON command smoke phrase across release-facing docs, with a self-test fixture that fails when README guidance drops that action-plan check JSON smoke contract.
- Release metadata now guards the MCP action plan emitted self-archive command smoke phrase across release-facing docs, with a self-test fixture that fails when README guidance drops that action-plan self-archive smoke contract.
- Release metadata now guards the shared MCP action plan command mapping self-test phrase across release-facing docs, with a self-test fixture that fails when README guidance drops that shared self-test parity contract.
- Shared smoke assertion self-tests now map action-plan emitted `mcpCheckProbesJsonOut` and `mcpPlanProbesJsonOut` commands back to executable `design-ai site --stdin ... --out file --force` argv, so common assertion coverage matches the package/public-registry runtime smoke paths.
- Package and registry smoke self-tests now include negative drift fixtures for action-plan emitted readiness probe JSON and action-plan self-archive JSON output, failing if emitted JSON reports lose local/read-only boundary guarantees.
- Package and registry smoke self-tests now replay the action-plan emitted human readiness report command through shared file-output assertions, so the local self-test gates catch command mapping drift before packed or public smoke runs.
- Package and registry smoke self-tests now include negative drift fixtures for action-plan emitted human report output, failing if the saved readiness report drops the `Probe commands` guidance.
- Release metadata now guards the MCP action plan human report output command parity phrase across release-facing docs, with a self-test fixture that fails when README guidance drops that action-plan command parity contract.
- `design-ai site --mcp-check --probes` human output now includes a `Probe commands` section with the same save-readiness, generate-action-plan, and save-action-plan commands already exposed in probe JSON, while default non-probe MCP check output stays unchanged.
- Packed-tarball and public-registry smoke now execute the embedded `mcpCheckProbesHumanOut` command emitted by `design-ai site --mcp-check --probes --json`, verifying that the payload's human report preservation command writes the expected probe report file.
- Release metadata now guards the embedded MCP check probe human report output command phrase across release-facing docs, with a self-test fixture that fails when README guidance drops the `mcpCheckProbesHumanOut` command contract.
- Shared packed-tarball and public-registry smoke assertions now verify `design-ai site --stdin --mcp-check --probes` human output, including the `Probe commands` section and copy/paste follow-up command text.
- Packed-tarball and public-registry smoke now verify `design-ai site --stdin --mcp-check --probes --out file` output-file persistence for the human MCP readiness probe report and its `Probe commands` guidance.
- Packed-tarball and public-registry smoke now execute the embedded MCP check probe commands emitted by `design-ai site --mcp-check --probes --json`, verifying that the payload's readiness probe `--out`, action-plan JSON, and action-plan JSON `--out` commands work in installed-bin, one-shot npm exec, and published-package paths.
- Release metadata now guards embedded MCP check probe next-step commands across release-facing docs, with a self-test fixture that fails when README guidance drops the probe payload command phrase.
- Release metadata now also guards executable embedded MCP check probe command smoke coverage across release-facing docs, with a self-test fixture that fails when README guidance drops the executable smoke phrase.
- Packed-tarball and public-registry smoke now verify `design-ai site --stdin --mcp-check --probes --json --out file` output-file persistence for the read-only MCP readiness probe payload.
- `design-ai site --mcp-plan --probes` includes the same read-only probes in the Markdown MCP action plan.
- `design-ai site --mcp-plan [--probes] --json` emits a structured `website-improvement-mcp-action-plan` payload with readiness matrix rows, optional read-only probes, blocking/warning lists, task/MCP alignment, execution sequence, commands, and local boundary flags.
- `design-ai site --mcp-plan [--probes] --json` now includes `commands.mcpCheckProbesJsonOut` and `commands.mcpPlanProbesJsonOut` so machine-readable MCP action plans carry copy/paste JSON `--out` preservation commands.
- Release metadata now guards embedded MCP action plan probe output-file commands across release-facing docs, with a self-test fixture that fails when README guidance drops the command phrase.
- Packed-tarball and public-registry smoke now verify `design-ai site --stdin --mcp-plan --probes --json --out file` output-file persistence for the structured MCP probe action plan payload.
- Shared smoke assertions now own the MCP readiness probe JSON and MCP probe action plan JSON output-file contracts, so packed-tarball and public-registry smoke validate write confirmation plus saved JSON payload drift through the same helper path.
- Release metadata now guards the shared MCP probe output-file smoke assertion phrase across release-facing docs, with a self-test fixture that fails when README guidance drops the shared helper contract.
- `design-ai site --help` now shows copy/paste examples for saving MCP readiness probe JSON and MCP probe action plan JSON with `--out file`.
- Top-level `design-ai help` and `design-ai help --json` now expose `--mcp-check [--probes]` and `--mcp-plan [--probes] [--json]` in the Website Console site usage.
- Shared package/public-registry smoke assertions now require the same probe-capable Website Console site usage in help JSON and main help output, with a self-test fixture for stale probe-less site usage.
- Release metadata now guards probe-capable Website Console site help usage across release-facing docs, with a self-test fixture that fails when README guidance drops the site usage phrase.
- Shared package/public-registry smoke assertions now require the Website Console `site` help topic to retain MCP probe JSON `--out` examples, with a self-test fixture that fails when the copy/paste save command drifts back to a non-output-file command.
- Release metadata now guards shared Website Console site help topic example smoke assertions across release-facing docs, with a self-test fixture that fails when README guidance drops the command-specific help topic example phrase.
- `design-ai site --graph [--json]` exports a portable Website Improvement workflow graph with workspace, profile, audit, MCP, task, prompt, handoff, bundle, and target-repo nodes plus deterministic edges.
- The static Website Improvement Console now includes a `Workflow Graph` tab with lane-based node rendering, 35-node/67-edge sample graph coverage, boundary markers, edge table, and graph JSON copy/export actions.
- The static Website Improvement Console `Handoff Report` tab now tracks executed work, verification results, remaining risks, and next actions in localStorage and injects that evidence into copied/exported Markdown reports.
- `design-ai site` now preserves `implementationEvidence` from Website Console JSON exports, reports evidence counts in JSON summaries, carries evidence through `--tasks` and `--bundle`, and renders executed work / verification / risks / next actions in CLI-generated handoff reports.
- Packed-tarball smoke now verifies non-empty Website Console `implementationEvidence` preservation through `design-ai site --stdin --report`, `--tasks`, and `--bundle --out` in both installed-bin and one-shot `npm exec --package <tarball>` paths.
- Verified Website Console bundle JSON now exposes `implementationEvidence` counts through `design-ai site <bundle-dir> --bundle-check --json`, `--bundle-compare other-bundle-dir --json`, and `--bundle-handoff --json`, with bundle-check drift validation against `website-workspace.tasks.json`.
- Packed-tarball smoke now verifies non-empty Website Console evidence counts through evidence bundle check, compare, and handoff JSON in both installed-bin and one-shot `npm exec --package <tarball>` paths.
- `design-ai site <bundle-dir> --bundle-check --json` now verifies that the seven checksum-managed handoff bundle artifacts match the current CLI-generated bundle contract, and `--bundle-compare` / `--bundle-handoff` carry generated contract counts forward.
- `design-ai site <bundle-dir> --bundle-check --json` now includes `generatedContract` per-file diagnostics with expected/actual SHA-256 digests and drift file paths, and `--bundle-compare` / `--bundle-handoff` carry generated drift file summaries forward.
- `design-ai site <bundle-dir> --bundle-check --json` now includes `repairGuidance` with a local regenerate command and strict verify command; `--bundle-handoff --json` and the generated target-repo handoff prompt carry the same guidance forward.
- `design-ai site <bundle-dir> --bundle-repair [--json]` now previews local handoff bundle repair, and `--bundle-repair --yes [--json]` rewrites only the handoff bundle directory from embedded `website-workspace.tasks.json` before re-running bundle-check verification.
- `design-ai site <bundle-dir> --bundle-repair [--yes] [--json] --out file [--force]` now writes preview/applied repair reports to disk, preserving read-only preview behavior and confirmed apply behavior.
- `repairGuidance` now includes preview/apply report output commands so bundle-check, bundle-handoff, and bundle-repair outputs show how to preserve repair evidence with `--out file`.
- Packed-tarball and public-registry smoke now execute the repair report commands emitted by `repairGuidance`, verifying that the copy/paste guidance writes the expected preview/applied report files.
- Shared smoke assertions now own repair guidance command parsing and `--out` path extraction, so packed-tarball and public-registry smoke cannot drift apart.
- Shared smoke assertions now also own repair report command shape, report output path, preview payload, and apply payload checks for packed-tarball and public-registry smoke.
- Release metadata now guards the shared repair guidance smoke helper phrase across release-facing docs, with a self-test fixture that fails when that helper contract disappears from README guidance.
- Release metadata now also guards the shared repair report assertion helper phrase across release-facing docs, with a self-test fixture that fails when that helper contract disappears from README guidance.
- Packed-tarball smoke now verifies Website Console generated bundle contract counts through bundle-check, compare, and handoff JSON in both installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke now verifies Website Console generated contract diagnostics and empty drift lists through bundle-check, compare, and handoff JSON in both installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke now verifies Website Console bundle repair guidance through bundle-check and handoff JSON in both installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke now verifies Website Console bundle repair preview/apply drift recovery through installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball and public-registry smoke now verify Website Console bundle repair report `--out file` output-file persistence for preview and apply paths.
- Packed-tarball smoke now verifies route eval, prompt eval, and pack eval checkpoints through installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke now verifies `learn --signals` human, JSON, `--strict --json`, and `--out` registry reports through installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke now verifies `learn --propose-skills` human, JSON, and `--out` preview reports through installed-bin and one-shot `npm exec --package <tarball>` paths.
- Packed-tarball smoke now verifies `design-ai site --stdin --mcp-check --probes --json` probe output plus `--out file` persistence through installed-bin and one-shot `npm exec --package <tarball>` paths.
- Public-registry smoke now verifies `design-ai site --stdin --mcp-check --probes --json` probe output plus `--out file` persistence from the published package path.
- Packed-tarball and public-registry smoke now verify `design-ai site --stdin --mcp-plan --probes` Markdown probe action plan output through installed-bin, one-shot `npm exec --package <tarball>`, and published package paths.
- Packed-tarball and public-registry smoke now verify `design-ai site --stdin --mcp-plan --probes --json` structured probe action plan output plus `--out file` persistence, and release metadata guards the matching release-policy docs phrase.
- Release metadata now guards the Website Console MCP probe action plan smoke phrase across release policy docs.
- Release metadata now also guards the public registry Website Console MCP probe action plan phrase, so post-publish registry smoke guidance cannot omit the `--mcp-plan --probes` coverage.
- Packed-tarball smoke now verifies `design-ai site --stdin --graph --json` workflow graph output through installed-bin and one-shot `npm exec --package <tarball>` paths.
- Release metadata now guards the route/prompt/pack eval smoke phrase in release policy docs.
- `docs/AGENT-DEVELOPMENT.md` records the Hermes/Harness-centered reference analysis and the next AI/agent development phases.

### Notes
- Agent evals are read-only. They do not call external AI APIs, mutate the learning profile, or install new dependencies.
- The signal registry is read-only and deterministic; it reports local files only and exposes short check-capture previews rather than raw brief text.
- Skill proposals are preview-only. They do not edit `learning.json` or `skills/*/SKILL.md`; an explicit apply path remains a future phase.
- Website Console probes are opt-in and read-only. They do not call external MCPs, write to external systems, crawl target sites, or add dependencies.
- Website Console workflow graphs are deterministic and read-only in both CLI export and static-console rendering. They do not call external MCPs, mutate target repos, crawl pages, or add dependencies.
- Website Console handoff evidence tracking is browser-local. It records operator-entered target-repo evidence only and does not call external MCPs, mutate target repos, or add dependencies.
- Website Console CLI evidence export remains deterministic and local. It does not validate target-repo claims automatically; it preserves operator-entered evidence in generated artifacts.
- Verified bundle evidence metadata remains deterministic and local. It reports counts and detects summary/workspace drift without verifying the truth of target-repo implementation claims.
- Generated bundle contract verification remains deterministic and local. It checks reproducibility of generated bundle artifacts from `website-workspace.tasks.json`; it does not validate real target-repo implementation claims.
- Generated bundle contract diagnostics expose SHA-256 digests and file paths only. They do not expose generated Markdown bodies, call external MCPs, or mutate target repos.
- Bundle repair is explicit and local. Guidance provides a `--bundle --out <bundle-dir> --force` regeneration command, `--bundle-repair` preview/apply paths, and preview/apply report output commands; repair only runs after `--yes`, rewrites the handoff bundle directory, and does not touch the target website repo.
- npm public publish remains pending until the owner supplies npm 2FA OTP or a suitable publish token.

## v4.55.0 — Public Registry Website Console Smoke Coverage (2026-06)

Extended post-publish registry smoke coverage for the Website Improvement Console CLI surface. `npm run registry:smoke` now verifies the public `npm exec --package @design-ai/cli@<version>` path for `design-ai site` workspace validation, sample generation, MCP readiness, handoff bundles, bundle verification, task generation, and task-selected prompt output.

### Added
- Public registry smoke coverage for `design-ai site --stdin --json`, `design-ai site --sample`, and `design-ai site --prompt-list --json`.
- Public registry smoke coverage for `design-ai site --stdin --mcp-check --json` and `design-ai site --stdin --mcp-plan`.
- Public registry smoke coverage for `design-ai site --stdin --bundle --out <dir>`, bundle checksum/fingerprint verification through `--bundle-check`, bundle comparison through `--bundle-compare`, and target-repo handoff prompt generation through `--bundle-handoff`.
- Public registry smoke coverage for `design-ai site --stdin --tasks` and task-selected `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta`.
- Release metadata guard phrase for public registry Website Console smoke coverage.

### Changed
- Updated README, Korean README, Product Readiness, Distribution docs, Release Checklist, Roadmap, and Session Log coverage for v4.55.
- Updated package/plugin metadata to `4.55.0`.

### Verified
- All 8 audits pass.
- Registry smoke self-test.
- Release metadata self-test.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.54.0 → 4.55.0.

### What this enables
- After publish, operators can verify that the public package path exposes the same Website Console handoff and prompt-generation contracts already covered by local packed-tarball smoke.

## v4.54.0 — Public Registry Workspace Restore Backup Readiness Smoke (2026-06)

Extended post-publish registry smoke coverage for workspace restore-backups readiness. `npm run registry:smoke` now verifies the public `npm exec --package @design-ai/cli@<version>` path for `design-ai workspace` JSON that reports sibling restore rollback backup inventory and prune next actions.

### Added
- Public registry smoke coverage for `design-ai workspace --root <repo> --learning-file <learning.json> --json` with sibling restore rollback backups.
- Registry smoke fixture generation for six sibling `*.restore-backup-*.json` rollback files beside the workspace learning profile.
- Registry smoke assertions for `learningRestoreBackups.totalCount`, limited backup count, latest restore preview command, readiness prune candidate count, and preview-first prune next action.
- Release metadata guard phrase for public registry workspace restore-backups readiness coverage.

### Changed
- Updated README, Korean README, Product Readiness, AI Learning docs, Distribution docs, Release Checklist, Roadmap, and Session Log coverage for v4.54.
- Updated package/plugin metadata to `4.54.0`.

### Verified
- All 8 audits pass.
- Registry smoke self-test.
- Release metadata self-test.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.53.0 → 4.54.0.

### What this enables
- After publish, operators can verify that the public package path exposes the same workspace rollback backup readiness contract already covered by local packed-tarball smoke.

## v4.53.0 — Workspace Learning Restore Backup Readiness (2026-06)

Added `design-ai workspace` readiness coverage for sibling learning restore rollback backups. Workspace JSON now reports `learningRestoreBackups` inventory, latest backup metadata, privacy flags, and prune readiness while remaining read-only.

### Added
- `design-ai workspace` auto-detection for sibling `*.restore-backup-*.json` rollback backups beside the selected learning profile.
- `learningRestoreBackups` JSON output with file, directory, pattern, total count, shown backups, latest backup, readiness, privacy, and error fields.
- Human workspace output for restore rollback backup inventory and readiness.
- Workspace next action for preview-first `design-ai learn --restore-backups --file <learning.json> --prune --keep 5` cleanup when older rollback backups exceed the default keep count.
- Packed-tarball smoke coverage for installed-bin and one-shot `npm exec --package <tarball>` workspace restore-backups readiness.
- Release metadata guard phrase for workspace learning restore-backups readiness coverage.

### Changed
- Updated README, Korean README, Product Readiness, AI Learning docs, Distribution docs, Release Checklist, Roadmap, and Session Log coverage for v4.53.
- Updated package/plugin metadata to `4.53.0`.

### Verified
- All 8 audits pass.
- Targeted workspace/learning unit tests.
- Smoke assertion, package smoke, and release metadata self-tests.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.52.0 → 4.53.0.

### What this enables
- Operators can see local rollback restore points and cleanup readiness in the same dogfood snapshot they already use for git, learning usage, eval checkpoints, and release readiness.

## v4.52.0 — Public Registry Learning Restore Smoke (2026-06)

Extended post-publish registry smoke coverage for the learning restore workflow. `npm run registry:smoke` now verifies the public `npm exec --package @design-ai/cli@<version>` path for preview/apply restore behavior, explicit rollback backup paths, restore-backups inventory, and restore-backups prune preview/apply cleanup.

### Added
- Public registry smoke coverage for `design-ai learn --restore` preview/apply JSON output.
- Public registry smoke coverage for `learn restore --out` file-write confirmation, rollback backup verification, and `--backup-file` path handling.
- Public registry smoke coverage for `design-ai learn --restore-backups` rollback backup inventory and `design-ai learn --restore-backups --prune` rollback backup pruning.
- Registry smoke self-test fixtures for restore metadata, backup inventory drift, and prune candidate drift.
- Release metadata guard phrases for public registry restore, restore-backups, and restore-backups prune coverage.

### Changed
- Updated README, Korean README, Product Readiness, AI Learning docs, Distribution docs, Release Checklist, Roadmap, and Session Log coverage for v4.52.
- Updated package/plugin metadata to `4.52.0`.

### Verified
- All 8 audits pass.
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.51.0 → 4.52.0.

### What this enables
- Post-publish verification now covers the same learning restore rollback and pruning safety path that packed-tarball smoke already checks before release.

## v4.51.0 — Learning Restore Backup Prune (2026-06)

Added preview-first rollback backup pruning for local learning restores. `design-ai learn --restore-backups --prune` now shows which older sibling rollback backup files would be deleted, and `--yes` deletes only those older backup files while leaving the active learning profile unchanged.

### Added
- `design-ai learn --restore-backups --prune [--keep N] [--dry-run|--yes] [--json] [--out file]` for safe rollback backup retention cleanup.
- Default keep policy of the 5 newest rollback backups, with `--keep N` for explicit retention.
- Human output for prune preview/applied states, retained count, candidate count, deleted count, and delete failures.
- JSON output with `prune.dryRun`, `prune.applied`, `prune.keep`, retained backups, candidate backups, deleted backups, failures, and privacy metadata that separates profile mutation from backup file deletion.
- Unit coverage for parser validation, dry-run no-delete behavior, confirmed backup deletion, command human output, command JSON output, and help text.
- Packed-tarball smoke coverage for installed-bin and one-shot `npm exec --package <tarball>` restore-backups prune preview/apply paths.
- Release metadata guard coverage for the `design-ai learn --restore-backups --prune` smoke phrase.

### Preserved
- `learn --restore-backups` inventory remains read-only unless `--prune --yes` is present.
- `learn --restore-backups --prune` never mutates the active learning profile.
- The learning profile schema remains unchanged at version 1.

### What this enables
- Operators can keep automatic restore rollback backups discoverable while safely removing older backup files after reviewing the prune preview.

### Verified
- All 8 audits pass.
- `node --check cli/lib/learn.mjs`
- `node --check cli/commands/learn.mjs`
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.50.0 → 4.51.0.

## v4.50.0 — Learning Restore Backup Inventory (2026-06)

Added a read-only rollback backup inventory for learning profile restores. `design-ai learn --restore-backups` now lists sibling `learning.restore-backup-*.json` files, audits each candidate, and prints a restore dry-run preview command for each backup.

### Added
- `design-ai learn --restore-backups [--limit N] [--json] [--out file]` for local restore rollback backup discovery.
- Human output with active profile path, backup directory, search pattern, backup count, audit status, entry count, timestamps, and restore preview commands.
- JSON output with `file`, `directory`, `pattern`, `totalCount`, `count`, `backups`, and privacy metadata.
- Unit coverage for parser handling, sibling backup scanning, invalid backup JSON visibility, command human output, command JSON output, and help text.
- Packed-tarball smoke coverage for installed-bin and one-shot `npm exec --package <tarball>` restore-backups human, JSON, and `--out` paths.
- Release metadata guard coverage for the `design-ai learn --restore-backups` smoke phrase.

### Preserved
- `learn --restore-backups` is read-only and never mutates the active profile or rollback files.
- The learning profile schema remains unchanged at version 1.
- Restore apply still requires `--yes`; inventory output only prints dry-run preview commands.

### What this enables
- Operators can find and audit automatic restore rollback backups after a confirmed restore before deciding whether to preview or apply a rollback.

### Verified
- All 8 audits pass.
- `node --check cli/lib/learn.mjs`
- `node --check cli/commands/learn.mjs`
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.49.0 → 4.50.0.

## v4.49.0 — Learning Restore Rollback Backup (2026-06)

Added an automatic rollback backup for confirmed learning profile restores. `design-ai learn --restore --yes` now saves the current active profile before replacing it, so operators can preview and apply a rollback with the same restore flow if the replacement is not desired.

### Added
- Automatic sibling rollback backup creation before confirmed `learn --restore --yes` writes the restored profile.
- `--backup-file path` for `learn --restore` so operators can choose the rollback backup location.
- Human and JSON restore output fields for `backupFile`, `backupCreated`, `backupEntryCount`, `backupUpdatedAt`, and a rollback preview command.
- Apply protection that rejects rollback backup paths equal to the active profile, equal to the restore source, or already existing unless `--force` is supplied.
- Unit coverage for parser validation, rollback backup creation, backup path protection, command-level JSON output, and help text.
- Packed-tarball smoke coverage for installed-bin and one-shot `npm exec --package <tarball>` restore rollback backup behavior.
- README, Korean README, Product Readiness, AI Learning docs, Distribution docs, Release Checklist, Roadmap, and Session Log coverage.

### Preserved
- The learning profile schema remains unchanged at version 1.
- `learn --restore` remains preview-first and does not create rollback backup files during preview.
- Restore still blocks apply when the source payload audit has failures.

### What this enables
- Operators can run the complete local learning operations loop with a rollback path: backup or redact, verify, diff, preview restore, apply restore with automatic rollback backup, then restore from that rollback backup if needed.

### Verified
- All 8 audits pass.
- `node --check cli/lib/learn.mjs`
- `node --check cli/commands/learn.mjs`
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.48.0 → 4.49.0.

## v4.48.0 — Learning Profile Restore (2026-06)

Added a preview-first full-profile restore path for local learning backups. `design-ai learn --restore --from-file learning-backup.json` now shows exactly how the active `learning.json` would change, and `--restore --yes` replaces the active profile only after the portable source passes audit.

### Added
- `design-ai learn --restore --from-file learning-backup.json [--dry-run|--yes] [--json] [--out file]` and stdin support.
- Human and JSON restore output with target file, source, dry-run/apply state, restorable state, previous/restored counts, removed/added counts, same-text count, metadata changes, id conflicts, audit summary, diff details, and privacy metadata.
- Apply protection that refuses restore when the source payload audit has failures, while preview still reports the audit issues.
- Unit coverage for parser validation, preview-only behavior, confirmed apply behavior, stdin restore, audit-failure blocking, and command-level JSON output.
- Packed-tarball smoke coverage for installed-bin and one-shot `npm exec --package <tarball>` `learn --restore --yes --json` paths.
- README, Korean README, Product Readiness, AI Learning docs, Distribution docs, Release Checklist, Roadmap, and Session Log coverage.

### Preserved
- The learning profile schema remains unchanged at version 1.
- `learn --restore` is preview-first by default and does not mutate the active profile unless `--yes` is present.
- `learn --restore` replaces the active profile instead of merging; use `learn --import` when the desired operation is additive.

### What this enables
- Operators can now use a complete local learning operations loop: backup or redact, verify, diff, then either restore the complete profile or import only the new entries.

### Verified
- All 8 audits pass.
- `node --check cli/lib/learn.mjs`
- `node --check cli/commands/learn.mjs`
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.47.0 → 4.48.0.

## v4.47.0 — Learning Profile Diff (2026-06)

Added a read-only comparison path for local learning profiles. `design-ai learn --diff --from-file learning.json` now compares the active profile with a portable profile before import/restore decisions, reporting profile-only entries, comparison-only entries, metadata changes, and id conflicts without mutating `learning.json`.

### Added
- `design-ai learn --diff --from-file learning.json [--json] [--out file]` and stdin support.
- Human and JSON diff output with active/comparison audit summaries, profile-only entries, comparison-only entries, metadata drift for matching notes, id conflicts, recommendations, and read-only privacy metadata.
- Safe `--out` artifact writing for diff JSON output through the existing overwrite protection.
- Unit coverage for parser validation, read-only diff payload generation, and command-level JSON output.
- Packed-tarball smoke coverage for installed-bin and one-shot `npm exec --package <tarball>` `learn --diff --json` paths.
- README, Korean README, Product Readiness, AI Learning docs, Roadmap, and Session Log coverage.

### Preserved
- The learning profile schema remains unchanged.
- `learn --diff` does not import entries, archive entries, write sidecars, or mutate active profiles.

### What this enables
- Operators can compare backup, redacted, or portable profiles against the active local profile before deciding whether to import, restore, or share learning data.

### Verified
- All 8 audits pass.
- `node --check cli/lib/learn.mjs`
- `node --check cli/commands/learn.mjs`
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.46.0 → 4.47.0.

## v4.46.0 — Workspace Curation Report Next Actions (2026-06)

Added a read-only workspace bridge from learning curation warnings to durable Markdown report artifacts. `design-ai workspace` now suggests `design-ai learn --curate --report --out <learning-dir>/learning-curation-report.md` beside existing curation preview commands, so operators can save an audit trail before applying archive actions.

### Added
- Learning profile audit warnings in `design-ai workspace` now include an info next action for `design-ai learn --curate --report --out <learning-dir>/learning-curation-report.md`.
- Learning usage sidecar readiness warnings now include the same report next action with `--usage-file <learning.usage.json>` when usage evidence is part of the readiness warning.
- Report next actions reuse shell-safe quoting for learning profile, usage sidecar, and report output paths.
- Unit coverage verifies profile-warning and usage-warning report next actions, including local paths with spaces and apostrophes.

### Preserved
- `design-ai workspace` remains read-only and does not create reports, mutate learning profiles, mutate usage sidecars, mutate eval checkpoints, or change git/release state.
- Existing `learn --curate`, `learn --curate --report`, workspace JSON shape, strict readiness behavior, learning profile schema, archive schema, usage sidecar schema, and eval checkpoint schema remain compatible.

### What this enables
- Operators can move from `workspace --strict` warnings to a durable curation report first, then run the existing preview/apply curation flow only after review.

### Verified
- All 8 audits pass.
- `node --check cli/lib/workspace.mjs`
- `node --test cli/lib/workspace.test.mjs`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.45.0 → 4.46.0.

## v4.45.0 — Learning Curation Markdown Reports (2026-06)

Added a shareable Markdown report mode for archive-first learning curation. `design-ai learn --curate --report` now renders the same preview/apply payload as a durable audit trail, and `--out file` writes it without requiring `--json`.

### Added
- `design-ai learn --curate --report` emits a Markdown curation report for preview or confirmed apply results.
- `design-ai learn --curate --report --out learning-curation-report.md` writes the report artifact with existing overwrite protection and `--force` behavior.
- Reports include profile file, archive file, before/after audit summaries, archive candidates, manual-review candidates, usage sidecar review metadata, privacy notes, and next steps.
- Package smoke now verifies packed-tarball curation report output in the installed-bin and one-shot `npm exec --package <tarball>` paths.

### Preserved
- `learn --curate` remains preview-first; `--report` does not mutate `learning.json` unless `--yes` is explicitly present.
- Usage-derived profile mismatch, stale id, and unused-entry signals remain advisory and cannot archive entries by themselves.
- Existing `learn --curate --json`, archive file schema, usage sidecar schema, eval checkpoint schema, and workspace next actions remain compatible.

### What this enables
- Operators can keep or share a readable local learning maintenance record before applying archive actions, which is useful for solo dogfood, company rollout review, and support handoff without exposing raw prompt/pack brief text.

### Verified
- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -m py_compile tools/audit/package-smoke.py`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.44.0 → 4.45.0.

## v4.44.0 — Workspace Learning Curation Next Actions (2026-06)

Connected workspace readiness warnings to the safer archive-first learning curation flow. `design-ai workspace` now points learning audit warnings and learning usage sidecar drift at `design-ai learn --curate --file ... --usage-file ...`, so operators can inspect profile issues and usage evidence in one preview before applying any cleanup.

### Added
- `workspace` next actions now recommend `learn --curate` for non-passing learning profile audits instead of sending operators back to audit-only output.
- Learning usage sidecar readiness warnings now recommend usage-aware curation with the active `--learning-file` and `--learning-usage` paths.
- `learn --curate` usage review now reports `profileFile`, `profileFileMatches`, and a `usage-profile-file-mismatch` advisory review item when a sidecar was recorded against another profile.
- Added unit coverage for workspace curation next actions and usage profile mismatch review.

### Preserved
- `workspace` remains read-only and does not mutate `learning.json`, usage sidecars, eval checkpoints, git state, or release artifacts.
- `learn --curate --yes` still archives only duplicate/sensitive audit candidates; usage-derived profile mismatch, stale id, and unused-entry signals remain advisory through `autoArchive: false`.
- Existing `learning.json`, `learning.usage.json`, `learning-eval.json`, and prompt/pack usage sidecar schemas remain compatible.

### What this enables
- Operators can move from `workspace --strict` warnings directly into one local curation preview that combines profile audit findings with usage sidecar evidence before applying any archive action.

### Verified
- All 8 audits pass.
- `node --test cli/lib/workspace.test.mjs cli/lib/learn.test.mjs`

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 4.43.0 → 4.44.0.

## v4.43.0 — Learning Usage Curation Review (2026-06)

Made `design-ai learn --curate` usage-aware without making usage history destructive. The command now includes a `usage` review section sourced from the local learning usage sidecar, accepts `--usage-file path`, and reports stale selected entry ids plus active entries that have not appeared in recorded prompt/pack learning usage.

Usage review items are advisory only: duplicate and sensitive learning entries remain the only automatic archive candidates, and unused entries are never archived by usage telemetry alone. Package smoke now verifies the usage-aware curation JSON path through the packed tarball.

### What this enables

Operators can review whether a learning entry is stale, unused, duplicated, or sensitive from one curation preview before deciding what to archive, rewrite, or keep.

### Verified

- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.42.0 → 4.43.0.

## v4.42.0 — Workspace Learning Usage Readiness (2026-06)

Made `design-ai workspace` include the local learning usage sidecar in the dogfood readiness snapshot. The command now supports `--learning-usage path`, auto-detects a sibling `learning.usage.json` when present, and reports prompt/pack usage event counts, used/unused profile entry counts, stale selected ids, latest usage metadata, and privacy guarantees without storing raw brief text.

`workspace --strict` now treats usage sidecar drift as readiness risk when the sidecar points at a different learning profile or references selected entry ids that no longer exist in the active profile. Package and registry smoke fixtures now include aligned usage sidecars in the workspace learning readiness path.

### What this enables

Operators can see whether local learning is only configured, or actually being exercised by prompt/pack runs, before curating entries or trusting personalized prompt context.

### Verified

- All 8 audits pass.
- `node --test cli/lib/workspace.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.41.0 → 4.42.0.

## v4.41.0 — Workspace Learning Eval Freshness Guard (2026-06)

Made `design-ai workspace` compare learning eval checkpoint metadata against the active learning profile, so a passing checkpoint can still warn when it was generated before the profile changed.

`learn --eval` now returns privacy-preserving checkpoint metadata (`generatedAt` and a sanitized `sourceProfile` summary) without exposing raw checkpoint brief or query text. `workspace --strict` treats stale or profile-mismatched checkpoint metadata as a readiness warning and suggests regenerating the checkpoint with `learn --eval-template --force`.

### What this enables

Operators can keep using sibling `learning-eval.json` discovery while avoiding a false sense of readiness after adding, importing, curating, or otherwise changing local learning entries.

### Verified

- All 8 audits pass.
- `node --test cli/lib/workspace.test.mjs cli/lib/learn.test.mjs`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.40.0 → 4.41.0.

## v4.40.0 — Workspace Learning Eval Sibling Checkpoint Discovery (2026-06)

Made `design-ai workspace` automatically include a read-only learning eval summary when a sibling `learning-eval.json` exists next to the selected learning profile.

The eval-template next-action now writes to that same sibling checkpoint path, so the local dogfood loop is consistent: generate the checkpoint once, then run `workspace --strict` without repeatedly passing `--learning-eval`.

### What this enables

Operators can keep private learning profiles and eval checkpoints together, reduce copy/paste friction, and still override the checkpoint explicitly with `--learning-eval path` when needed.

### Verified

- All 8 audits pass.
- `node --test cli/lib/workspace.test.mjs cli/lib/help-command.test.mjs`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.39.0 → 4.40.0.

## v4.39.0 — Workspace Learning Eval Command Path Quoting (2026-06)

Made `design-ai workspace` learning eval next-action commands shell-safe when local learning profile or checkpoint paths include spaces, apostrophes, or other shell-sensitive characters.

The command output still uses the existing `nextActions[].command` string shape and remains read-only; only the generated command text for learning eval-template/eval follow-up actions changes.

### What this enables

Operators can copy/paste workspace learning eval next actions from real local paths such as project folders with spaces without manually rewriting `--file` or `--from-file` arguments.

### Verified

- All 8 audits pass.
- `node --test cli/lib/workspace.test.mjs`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.38.0 → 4.39.0.

## v4.38.0 — Workspace Learning Eval Template Hints (2026-06)

Added a `design-ai workspace` next-action hint that recommends `design-ai learn --eval-template --file <learning.json> --out learning-eval.json` when the selected learning profile has entries, passes audit, and no `--learning-eval` checkpoint is supplied.

The hint keeps `workspace` read-only, does not create or mutate checkpoint files by itself, and disappears once a checkpoint is provided through `--learning-eval`.

### What this enables

Operators get a clearer local learning loop: capture feedback, generate an eval checkpoint, then run `workspace --learning-eval --strict` before trusting personalized prompt context.

### Verified

- All 8 audits pass.
- `node --test cli/lib/workspace.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/smoke_assertions.py tools/audit/package-smoke.py tools/audit/release-metadata.py`
- `npm test`
- `npm run audit:strict`
- `npm run release:self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.37.0 → 4.38.0.

## v4.37.0 — Public Registry Learning Eval Template Smoke (2026-06)

Extended the post-publish registry smoke gate so the public `npm exec --package @design-ai/cli@<version>` path verifies `design-ai learn --eval-template` checkpoint generation and then re-runs the generated checkpoint through `design-ai learn --eval --strict --json`.

The registry smoke now uses the same learning relevance fixture as prompt/pack learning selection, writes a generated eval-template checkpoint artifact, validates its privacy metadata, and confirms the selected entry survives strict eval from the published package path.

### What this enables

Publish verification now protects the new checkpoint bootstrap loop after the package leaves the local tarball path.

### Verified

- All 8 audits pass.
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.36.0 → 4.37.0.

## v4.36.0 — Learning Eval Template Generation (2026-06)

Added `design-ai learn --eval-template` so operators can generate runnable deterministic learning eval checkpoint JSON from the active local profile instead of hand-writing every case.
The template generator supports optional `--query`, `--category`, `--limit`, `--json`, `--out`, and `--force`, keeps the learning profile read-only, and writes checkpoint JSON that can be passed directly to `design-ai learn --eval --from-file ... --strict --json`.

Package smoke now verifies the generated checkpoint path through installed-bin and one-shot `npm exec --package <tarball>` flows, including the follow-up strict eval pass.
README, AI Learning docs, Product Readiness, Roadmap, Session Log, CLI help assertions, and release smoke metadata now describe the new checkpoint bootstrap loop.

### What this enables

Operators can turn the current local learning profile into a repeatable eval suite faster, then use `learn --eval --strict` or `workspace --learning-eval --strict` as a deterministic dogfood readiness signal.

### Verified

- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.35.0 → 4.36.0.

## v4.35.0 — Public Registry Workspace Learning Eval Smoke (2026-06)

Extended the post-publish registry smoke gate so the published package path verifies `design-ai workspace --learning-eval <checkpoint.json> --strict --json` in addition to the existing workspace strict readiness success/failure checks.
The registry fixture now creates a clean git workspace, a local learning profile, and a deterministic eval checkpoint, then validates the public `npm exec --package @design-ai/cli@<version>` path through the shared workspace JSON assertions.

Release metadata guards, README, Distribution docs, Product Readiness, AI Learning docs, Roadmap, and Session Log now preserve the public registry workspace learning-eval smoke contract.

### What this enables

Operators can catch publish-path regressions in workspace learning eval readiness after npm release, matching the local packed-tarball smoke coverage before broader distribution.

### Verified

- All 8 audits pass.
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.34.0 → 4.35.0.

## v4.34.0 — Workspace Learning Eval Readiness (2026-06)

Added `design-ai workspace --learning-eval <checkpoint.json>` so local dogfood readiness snapshots can include deterministic learning-selection checkpoint summaries next to git, repository metadata, learning profile audit, and release-script state.
Workspace JSON now includes a `learningEval` object when a checkpoint file is provided, and human output prints a read-only "Learning eval" section with case counts, status, and privacy notes.
`workspace --strict` now treats learning eval warnings or failures as readiness issues while keeping the command read-only and leaving `learning.json` unchanged.

Package smoke now verifies workspace learning-eval summaries in the clean strict success path for both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, CLI help assertions, README, Distribution docs, Product Readiness, AI Learning docs, Roadmap, and Session Log now describe the workspace learning eval readiness gate.

### What this enables

Operators can check whether the current repo, local learning profile, and learning eval checkpoint suite are ready from one workspace readiness command before internal dogfood handoff.

### Verified

- All 8 audits pass.
- `node --test cli/lib/workspace.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.33.0 → 4.34.0.

## v4.33.0 — Local Learning Eval Strict Gate (2026-06)

Added `design-ai learn --eval --strict` so deterministic local learning checkpoint reports can fail CI or internal release gates when any case warns or fails.
Strict mode preserves the existing read-only eval behavior: JSON/human reports and `--out` artifacts are produced before the command sets a non-zero exit code, and the learning profile is never mutated.
The eval report remains privacy-preserving by exposing brief hashes, selected ids, counts, status, and issues without raw brief/query text, matched tokens, embeddings, model calls, telemetry, or fine-tuning data.

Package smoke now verifies the strict failure path for both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, CLI help assertions, README, Distribution docs, Product Readiness, AI Learning docs, Roadmap, and Session Log now describe the `learn --eval --strict` failure gate.

### What this enables

Operators can promote local learning checkpoint suites from advisory reports into deterministic release gates while keeping local learning explicit, file-based, and offline.

### Verified

- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.32.0 → 4.33.0.

## v4.32.0 — Local Learning Eval Checkpoints (2026-06)

Added `design-ai learn --eval` so operators can validate local learning selection against deterministic JSON checkpoint cases without changing the learning profile.
The eval report compares expected selected ids, avoided selected ids, minimum matched counts, and fallback policy against the same brief-relevance ranking used by `prompt --with-learning` and `pack --with-learning`.
Human and JSON reports expose brief hashes, selected ids, counts, status, and issues, but do not expose raw brief/query text or matched tokens.

Package smoke now verifies `learn --eval` in human, JSON, and safe `--out` file-write paths for both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, CLI help assertions, README, Distribution docs, Product Readiness, AI Learning docs, Roadmap, and Session Log now describe the read-only eval checkpoint report.

### What this enables

Operators can check whether a growing local learning profile still selects the right entries for known scenarios before relying on learned context in prompt or pack generation, without embeddings, model calls, fine-tuning, telemetry, or raw brief storage.

### Verified

- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.31.0 → 4.32.0.

## v4.31.0 — Local Learning Usage Report (2026-06)

Added `design-ai learn --usage` so operators can inspect the local `learning.usage.json` sidecar without changing the learning profile.
The report summarizes event counts, command / route / category distribution, selected learning entry usage, unused active entries, stale selected ids, recent events, and privacy metadata in both human and JSON output.
`--usage-file` lets package smoke and local operators point the report at a specific sidecar while the default still follows the existing `DESIGN_AI_LEARNING_USAGE_FILE` / sibling-file behavior.

Package smoke now verifies the usage report in human, JSON, and safe `--out` file-write paths for both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, CLI help assertions, README, Distribution docs, Product Readiness, AI Learning docs, Roadmap, and Session Log now describe the read-only usage report.

### What this enables

Operators can identify which local learning entries are active, unused, or referenced by stale usage events without adding telemetry, embeddings, model calls, fine-tuning, or raw brief storage.

### Verified

- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.30.0 → 4.31.0.

## v4.30.0 — Local Learning Usage Sidecar (2026-06)

Added local usage sidecar recording for `prompt --with-learning` and `pack --with-learning`.
Whenever learned context is explicitly requested, the CLI now records a deterministic local event in a sibling usage file such as `learning.usage.json`, including the command, route id, selected learning entry ids, selection counts, audit status, and a short brief hash instead of raw prompt text.
JSON output for prompt and pack includes `learningUsage` metadata so operators can verify which learning entries were injected without opening the sidecar file.

Package smoke now verifies learning usage sidecar output for both installed-bin and one-shot `npm exec --package <tarball>` paths.
AI learning docs, README, Product Readiness, Roadmap, and Session Log now describe the privacy-preserving usage log.

### What this enables

Operators can inspect which local learning entries are actually being used over time without changing `learning.json`, adding external telemetry, or storing raw briefs.

### Verified

- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.29.0 → 4.30.0.

## v4.29.0 — Local Learning Archive-First Curation (2026-06)

Added `design-ai learn --curate` so local learning profiles can be maintained with a preview-first, archive-first flow inspired by Hermes-style skill curation without adding model training, external AI APIs, embeddings, telemetry, or new dependencies.
The new curation plan classifies duplicate learning text and conservative sensitive-content warnings as archive candidates, keeps long notes, timestamp gaps, malformed entries, duplicate ids, and profile-level failures in manual-review status, and defaults to a dry-run preview.
Confirmed `design-ai learn --curate --yes` removes archive candidates from the active `learning.json` profile and appends their full entries to a sibling archive file such as `learning.archive.json` with `archivedAt`, `archiveReason`, `issueCodes`, and `originalFile` metadata.

Package smoke now verifies `learn --curate` preview/apply JSON and human output through both installed-bin and one-shot `npm exec --package <tarball>` paths.
AI learning docs, README, Product Readiness, Roadmap, and Session Log now describe the archive-preserving curation flow.

### What this enables

Operators can keep a growing local learning profile clean before using `--with-learning` while preserving removed entries for audit/history instead of deleting them outright.

### Verified

- All 8 audits pass.
- `node --test cli/lib/learn.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.28.0 → 4.29.0.

## v4.28.0 — Website Improvement Target-Repo Bundle Handoff Prompt (2026-06)

Added `design-ai site <bundle-dir> --bundle-handoff [--strict] [--json]` so operators can turn a validated Website Improvement handoff bundle into a paste-ready Codex prompt for the target website repo.
The generated prompt carries the bundle-check status, SHA-256 bundle digest, primary `codex-implementation.md` content, supporting handoff context, operating rules, and required final response evidence while keeping design-ai read-only.

Package smoke now verifies bundle-handoff JSON through both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, README, Distribution docs, Product Readiness, Website Improvement docs, Roadmap, and Session Log now describe the target-repo handoff prompt.
No external MCP calls, target website repo mutation, backend storage, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can move from a verified Website Improvement bundle to target-repo implementation without manually stitching together `summary.json`, `website-handoff.md`, `mcp-action-plan.md`, and `codex-implementation.md`.

### Verified

- All 8 audits pass.
- `node --check cli/lib/site.mjs cli/commands/site.mjs cli/commands/help.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.27.0 → 4.28.0.

## v4.27.0 — Website Improvement Handoff Bundle Compare (2026-06)

Added `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> [--strict] [--json]` so operators can compare two generated Website Improvement handoff bundles before target-repo handoff.
The compare report reuses bundle-check validation for both directories, compares `summary.json.checksums.bundleDigest`, lists changed generated files from checksum drift, and reports summary metadata changes such as site name, source, task count, workspace status, and MCP status.
Human output gives a compact digest comparison, while JSON output exposes `sameBundle`, `digestMatch`, `changedFiles`, `metadataChanges`, and issue counts for release smoke or archive workflows.
Package smoke now verifies bundle-compare JSON through both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, README, Distribution docs, Product Readiness, Website Improvement docs, Roadmap, and Session Log now describe bundle digest comparison.
No external MCP calls, target website repo mutation, backend storage, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can check whether a regenerated or archived handoff bundle is identical to the bundle already approved for implementation, and can see which generated artifacts changed when it is not identical.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- All 8 audits pass.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.26.0 → 4.27.0.

## v4.26.0 — Website Improvement Handoff Bundle Fingerprint Verification (2026-06)

Added a deterministic bundle-level fingerprint to Website Improvement handoff bundles so operators can compare a whole bundle identity, not only individual artifact checksums.
`design-ai site --bundle --out <dir>` now writes `summary.json.checksums.bundleDigest`, derived from the ordered SHA-256 checksum manifest for every generated bundle file except `summary.json`.
`design-ai site <bundle-dir> --bundle-check --strict --json` verifies the stored bundle digest against both the checksum manifest and the current bundle files, reports the digest in human output, and keeps per-file checksum validation intact.
Package smoke now asserts bundle digest presence through both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, README, Distribution docs, Product Readiness, Website Improvement docs, Roadmap, and Session Log now describe bundle digest/fingerprint verification.
No external MCP calls, target website repo mutation, backend storage, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can archive, compare, or attach Website Improvement handoff bundles with one stable digest while still retaining file-level checksum diagnostics for drift and tampering.

### Verified

- `node --check cli/lib/site.mjs`
- `node --test cli/lib/site.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- All 8 audits pass.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.25.0 → 4.26.0.

## v4.25.0 — Website Improvement Handoff Bundle Checksum Verification (2026-06)

Added SHA-256 checksum manifesting to Website Improvement handoff bundles so transferred or manually edited bundle artifacts can be detected before target-repo handoff.
`design-ai site --bundle --out <dir>` now writes `summary.json` with `checksums.algorithm: "sha256"` and digests for every generated bundle file except `summary.json` itself.
`design-ai site <bundle-dir> --bundle-check --strict --json` recomputes those digests, reports verified checksum counts, and fails when a bundle file no longer matches the manifest.
Package smoke now asserts checksum manifest shape and bundle-check checksum verification through both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata guards, README, Distribution docs, Product Readiness, Website Improvement docs, Roadmap, and Session Log now describe the checksum verification boundary.
No external MCP calls, target website repo mutation, backend storage, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can share or archive Website Improvement handoff bundles with a deterministic local tamper/drift check before a Codex or Claude target-repo implementation session uses the bundle.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs`
- `node --test cli/lib/site.test.mjs`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- All 8 audits pass.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.24.0 → 4.25.0.

## v4.24.0 — Website Improvement Handoff Bundle Verification (2026-06)

Added `design-ai site <bundle-dir> --bundle-check [--strict] [--json] [--out file]` so generated Website Improvement handoff bundles can be verified before target-repo handoff.
The check validates the expected bundle file manifest, parses `summary.json`, `website-workspace.tasks.json`, and `mcp-check.json`, recomputes local MCP readiness from the bundled workspace, compares summary/MCP/task counts, and checks required Markdown anchors.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the bundle-check path.
Packed-tarball package smoke verifies `design-ai site <bundle-dir> --bundle-check --strict --json` from both installed-bin and one-shot `npm exec --package <tarball>` paths after bundle generation.
No external MCP calls, target website repo mutation, backend storage, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can treat a handoff bundle as a portable artifact with a local integrity gate before attaching it to a Codex/Claude target-repo implementation session.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs cli/commands/help.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- All 8 audits pass.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.23.0 → 4.24.0.

## v4.23.0 — Website Improvement Handoff Bundle Export (2026-06)

Added `design-ai site <workspace.json|--stdin> --bundle --out <dir> [--strict] [--force]` so Website Improvement workspaces can be exported as a complete local handoff bundle before target-repo implementation.
The bundle writes `README.md`, `summary.json`, `website-workspace.tasks.json`, `mcp-check.json`, `mcp-action-plan.md`, `website-handoff.md`, `website-prompts.md`, and `codex-implementation.md` with deterministic task generation, readiness evidence, prompts, and local/operator boundaries.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the handoff bundle path.
Packed-tarball package smoke verifies `design-ai site --stdin --bundle --out <dir>` from both installed-bin and one-shot `npm exec --package <tarball>` paths, including bundle file creation and summary/task/profile roundtrip checks.
No external MCP calls, target website repo mutation, backend storage, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can package the Website Improvement workspace, generated tasks, MCP readiness check, MCP action plan, full prompt set, focused Codex implementation prompt, and handoff report into one portable directory for solo/internal use.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs cli/commands/help.mjs cli/lib/output.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `npm run package:smoke`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `git diff --check`
- Manual CLI smoke for `design-ai site --bundle --out`, `design-ai site --stdin --bundle --out`, and `design-ai help site`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.22.0 → 4.23.0.

## v4.22.0 — Website Improvement MCP Action Plan Export (2026-06)

Added `design-ai site <workspace.json|--stdin> --mcp-plan [--strict] [--out file]` so Website Improvement MCP readiness results can be exported as a Markdown action plan before target-repo implementation.
The plan includes readiness status, MCP evidence, blocking items, optional warnings, task/MCP alignment, execution sequence, follow-up commands, and local/operator boundaries.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the MCP action plan path.
Packed-tarball package smoke verifies `design-ai site --stdin --mcp-plan` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No external MCP calls, target website repo mutation, backend storage, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can turn readiness warnings into an ordered handoff checklist, then keep the strict JSON readiness gate and Markdown action plan together with the website improvement handoff package.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs cli/commands/help.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `npm run package:smoke`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `git diff --check`
- Manual CLI smoke for `design-ai site --mcp-plan`, `design-ai site --mcp-plan --out`, and `design-ai help site`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.21.0 → 4.22.0.

## v4.21.0 — Website Improvement MCP Readiness Check (2026-06)

Added `design-ai site <workspace.json|--stdin> --mcp-check [--strict] [--json]` so Website Improvement workspace exports can be checked for local MCP readiness evidence and task/MCP gaps before handoff.
The check is deterministic and read-only: it evaluates the existing Site Profile, MCP readiness matrix, workspace validation issues, and refactor task recommendations without calling external MCP tools or mutating a target website repository.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the MCP readiness check path.
Packed-tarball package smoke verifies `design-ai site --stdin --mcp-check --json` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No backend storage, hosted sync, crawling, Lighthouse/axe automation, visual diff, embeddings, fine-tuning, target repo mutation, or new dependencies were added.

### What this enables

Operators can run a terminal-first readiness gate before moving a Website Improvement plan into Codex, Claude, or a target website repo, and can fail `--strict` when required MCP evidence is missing.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs cli/commands/help.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `npm run package:smoke`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `git diff --check`
- Manual CLI smoke for `design-ai site --mcp-check`, `design-ai site --mcp-check --json`, and `design-ai help site`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.20.0 → 4.21.0.

## v4.20.0 — Website Improvement Prompt Template Listing (2026-06)

Added `design-ai site --prompt-list [--json]` so operators can discover the eight Website Improvement prompt template ids before exporting a single Codex or Claude prompt.
The listing works without a workspace file, supports human and machine-readable output, and includes agent, output type, description, and whether a template supports `--task` selection.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the prompt template listing path.
Packed-tarball package smoke verifies `design-ai site --prompt-list --json` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No external MCP calls, target website repo mutation, backend storage, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can stay in the file-first Website Improvement workflow and choose the right prompt id without opening docs or generating the full prompt bundle.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs cli/commands/help.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py tools/audit/registry-smoke.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:self-test`
- `npm run release:metadata`
- `npm run package:check`
- `npm run package:smoke`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `git diff --check`
- Manual CLI smoke for `design-ai site --prompt-list` and `design-ai site --prompt-list --json`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.19.0 → 4.20.0.

## v4.19.0 — Website Improvement Prompt Task Selection (2026-06)

Added `design-ai site --prompt codex-implementation --task <id-or-number>` so Website Improvement workspace JSON can export a Codex implementation prompt for a specific refactor task.
The generated prompt now includes the selected Task ID, and the human `design-ai site` summary lists top tasks with stable numbers and ids for easier handoff.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the task-selected prompt path.
Packed-tarball package smoke verifies `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No external MCP calls, target website repo mutation, backend storage, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can generate task-specific implementation prompts from a multi-task Website Improvement workspace without manually editing the prompt or reordering the refactor plan.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs cli/commands/help.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- Manual CLI smoke for `design-ai site --sample` → `--tasks` → `--prompt codex-implementation --task task-accessibility`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.18.0 → 4.19.0.

## v4.18.0 — Website Improvement Single Prompt CLI Export (2026-06)

Added `design-ai site --prompt <template-id>` so Website Improvement workspace JSON can export one Codex or Claude prompt without generating the full prompt bundle.
The command validates template ids, supports stdin/file input, writes Markdown through safe `--out` / `--force`, and keeps `--sample`, `--tasks`, `--json`, `--report`, and `--prompts` as separate modes.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the single-prompt export path.
Packed-tarball package smoke verifies `design-ai site --stdin --prompt codex-implementation` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No external MCP calls, target website repo mutation, backend storage, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can move from a generated workspace and refactor plan directly to the next implementation prompt for the target website repo without manually extracting a section from the full prompt bundle.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs docs/website-console/app.js`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- All 8 audits pass.
- `git diff --check`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.17.0 → 4.18.0.

## v4.17.0 — Website Improvement Refactor Task CLI Generation (2026-06)

Added `design-ai site --tasks` so Website Improvement workspace JSON can be expanded with deterministic starter refactor tasks from audit findings.
The task generator mirrors the Website Console's local Refactor Plan behavior, skips categories that already have tasks, and emits updated workspace JSON to stdout or safe `--out` / `--force` file output.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, Website Improvement docs, and Session Log now describe the task-generation path.
Packed-tarball package smoke verifies `design-ai site --stdin --tasks` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No external MCP calls, target website repo mutation, backend storage, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can run a file-first workflow: generate a sample workspace, edit audit findings, generate starter refactor tasks, then produce prompt bundles and handoff reports without opening the Web App.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs docs/website-console/app.js`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- All 8 audits pass.
- `git diff --check`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.16.0 → 4.17.0.

## v4.16.0 — Website Improvement Sample Workspace Bootstrap (2026-06)

Added `design-ai site --sample` so operators can generate a valid Website Improvement workspace JSON without opening the browser console first.
The sample mode supports stdout and safe `--out` / `--force` file writing, while keeping validation/report/prompt generation as separate follow-up commands.
CLI help, help JSON catalog, unit tests, package smoke, release metadata guards, README, Distribution docs, Product Readiness, Roadmap, and Website Improvement docs now describe the sample bootstrap path.
Packed-tarball package smoke verifies `design-ai site --sample` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No external MCP calls, target website repo mutation, backend storage, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can start a file-first website improvement workflow with one command, commit/share the generated workspace JSON, then validate it or produce handoff artifacts with the existing `design-ai site` modes.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- All 8 audits pass.
- `git diff --check`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.15.0 → 4.16.0.

## v4.15.0 — Website Improvement Workspace CLI (2026-05)

Added `design-ai site` so Website Improvement Console JSON exports can be validated outside the browser and converted into Markdown handoff reports or Codex/Claude prompt bundles.
The command supports file and stdin input, `--strict` readiness gating, machine-readable `--json` summaries, `--report`, `--prompts`, and safe `--out` / `--force` output-file writing.
Added a reusable sample workspace JSON fixture under `examples/website-improvement-workspace.json`.
Packed-tarball package smoke now verifies `design-ai site --stdin --json` from both installed-bin and one-shot `npm exec --package <tarball>` paths.
No external MCP calls, target website repo mutation, backend storage, embeddings, fine-tuning, or new dependencies were added.

### What this enables

Operators can start in the zero-dependency Website Improvement Console, export the local workspace, then use the CLI to produce stable artifacts for target-repo Codex work and internal handoff.

### Verified

- `node --check cli/lib/site.mjs cli/commands/site.mjs`
- `node --test cli/lib/site.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/release-metadata.py tools/audit/smoke_assertions.py`
- `npm test`
- All 8 audits pass.
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run package:smoke`
- `git diff --check`

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.14.0 → 4.15.0.

## v4.14.0 — Website Improvement Control Tower Web App (2026-05)

Added a zero-dependency static Website Improvement Control Tower under `docs/website-console/` with localStorage persistence, JSON export/import, a sample Korean SaaS Site Profile, audit checklist, MCP readiness matrix, refactor task generation, eight prompt templates, and Markdown handoff report export.
Added `website-improvement` as a route, skill, slash command, docs page, and worked example so `design-ai route`, `prompt`, `pack`, `check`, and example QA can treat professional website improvement work as a first-class workflow.
The MVP keeps the target website source outside this repo, does not call external MCPs, does not crawl pages, does not run Lighthouse/axe/visual diff, and does not introduce embeddings, fine-tuning, backend storage, auth, React, Vite, Next, or new package dependencies.
Package and plugin metadata now report 20 skills, 17 commands, 4 agents, and version `4.14.0`.
Docs navigation, README/Quickstart/Using/Product Readiness/Roadmap/Session Log references now include the website improvement surface and its local/operator boundary.

### What this enables

Website improvement work can now start in design-ai as a structured local planning workspace, then move to Codex in the target website repo with generated prompts and verification guidance.

### Verified

- `node --check docs/website-console/app.js`
- `node --test cli/lib/route.test.mjs cli/lib/prompt.test.mjs cli/lib/check.test.mjs`
- `python3 -m py_compile tools/audit/*.py`
- `npm test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run package:smoke`
- Browser smoke for sample load, profile edit, checklist update, MCP status change, task generation, prompt/report generation, export/import roundtrip, and mobile overflow.
- `git diff --check`
- All 8 audits pass.

### Versions

- `package.json` + `.claude-plugin/plugin.json`: 4.13.0 → 4.14.0.

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
The GitHub Pages docs workflow now skips deployment when Pages is not enabled while still enforcing the MkDocs warning-policy build.
GitHub Actions workflows now opt into the upcoming Node 24 JavaScript action runtime, and local CI self-test guards that opt-in across audit, docs, publish, and release workflows.
GitHub Actions workflows now pin official actions to Node 24-compatible major refs, and local CI self-test guards against stale action ref drift.
GitHub Actions workflows now remove the temporary Node 24 runtime opt-in after official action refs reached Node 24-compatible majors, leaving local CI to guard the actual action pins.
Repository metadata, CLI help, docs, launch drafts, Homebrew examples, docs site config, and VS Code extension references now point to `sungjin9288/design-ai`, with release metadata guarding against stale repository slug drift.
`design-ai workspace` now reports canonical repository remote and package/plugin metadata alignment, and package smoke verifies workspace JSON from installed-bin and one-shot npm exec paths.
`design-ai workspace --strict` now turns readiness warnings/failures into a non-zero exit code so local dogfood handoff checks can block dirty git state, repository drift, learning-profile warnings, or missing release scripts.
Packed-tarball package smoke now verifies `design-ai workspace --strict --json` failure and clean-success readiness behavior in both installed-bin and one-shot `npm exec --package <tarball>` paths.
Release metadata now guards release-facing docs against dropping workspace strict package smoke guidance.
Public registry smoke now verifies `design-ai workspace --strict --json` failure and clean-success readiness behavior from the published npm package path, with release metadata guarding that guidance.
Public registry smoke now verifies human/JSON `design-ai learn --audit` cleanup suggestions plus dry-run and confirmed safe cleanup from the published npm package path, with release metadata guarding that guidance.
Public registry smoke now verifies JSON `design-ai learn --import` dry-run/apply behavior and JSON `design-ai learn --redact` file/stdin/output-file redaction behavior from the published npm package path, with release metadata guarding that guidance.
Public registry smoke now verifies JSON `design-ai learn --feedback` inline/file/stdin capture and JSON `design-ai learn --init` preview/apply/duplicate-skip bootstrap behavior from the published npm package path, with release metadata guarding that guidance.
Public registry smoke now verifies query-filtered learn list/export output and brief-relevant prompt/pack learning selection from the published npm package path, with release metadata guarding that guidance.
Public registry smoke now verifies `design-ai learn --backup --json --out --force` output-file persistence from the published npm package path, with release metadata guarding that guidance.
Packed-tarball package smoke now verifies `design-ai learn --verify --from-file --json --out --force` output-file persistence from installed-bin and one-shot `npm exec --package <tarball>` paths, with release metadata guarding that guidance.
Packed-tarball package smoke now verifies `design-ai learn --stats --json --out --force` output-file persistence from installed-bin and one-shot `npm exec --package <tarball>` paths, with release metadata guarding that guidance.
Public registry smoke now verifies `design-ai learn --stats --json --out --force` output-file persistence from the published npm package path, with release metadata guarding that guidance.
Packed-tarball package smoke and public registry smoke now verify `design-ai learn --audit --json --out --force` output-file persistence, with release metadata guarding both local and post-publish guidance.
Packed-tarball package smoke and public registry smoke now verify `design-ai learn --import --dry-run --json --out --force` output-file persistence, with release metadata guarding both local and post-publish guidance.
Packed-tarball package smoke and public registry smoke now verify `design-ai learn --feedback --json --out --force` output-file persistence while preserving feedback profile writes, with release metadata guarding both local and post-publish guidance.
Release metadata now checks that English and Korean distribution docs keep the MkDocs warning-policy baseline language.
Release metadata now accepts Korean equivalents for the MkDocs warning-policy phrase guard.
Release metadata now covers README, release checklist, and Distribution docs for MkDocs warning-policy drift.
Release metadata now also requires release-facing policy docs to keep the `ci:local` command reference.
Release metadata now reports `ci:local` command drift separately from MkDocs warning-policy drift.
Release metadata now guards release-facing docs against dropping the `release:check` core gate command.
Release metadata now guards release-facing docs against dropping packed-tarball smoke gate guidance.
Release metadata now guards release-facing docs against dropping the `package:smoke` command.
Release metadata now guards release-facing docs against dropping the `package:check` command.
Release metadata now guards release-facing docs against dropping the `release:metadata` command.
Release metadata now guards release-facing docs against dropping packed-tarball `npm exec --package <tarball>` smoke guidance.
Release metadata now guards release-facing docs against dropping packed-tarball installed-bin smoke guidance.
Release metadata now guards release-facing docs against dropping public registry `npm exec --package @design-ai/cli@<version>` smoke guidance.
Release metadata now guards release-facing docs against dropping the post-publish `registry:smoke` command.
Release metadata now guards release-facing docs against dropping package contents check guidance.
Release metadata now guards release-facing docs against dropping release metadata check guidance.
Release metadata now guards release-facing docs against dropping the `npm test` command.
Release metadata now guards release-facing docs against dropping the `npm run audit:strict` command.
Release metadata now guards release-facing docs against dropping CLI unit test guidance.
Release metadata now guards release-facing docs against dropping repository audit gate guidance.
Release metadata now guards release-facing docs against dropping the `git diff --check` command.
Release metadata now guards release-facing docs against dropping whitespace check guidance.
Release metadata now guards release-facing docs against dropping the `release:self-test` command.
Release metadata now guards release-facing docs against dropping release self-test guidance.
Release metadata now fails if a required release policy doc drops out of the checked set.
Release metadata now rejects unexpected release policy docs in the checked set.
Release metadata now rejects release policy docs checked in a non-deterministic order.
Release metadata now reports missing release policy doc files as structured errors instead of tracebacks.
Release metadata now reports missing or invalid core release inputs as structured errors instead of tracebacks.
Release metadata now reports audit-count source failures as structured errors instead of exiting early.
Release metadata now self-tests its human pass/fail output formatter.
Release metadata now self-tests its JSON output formatter and summary key order.
Release metadata policy-doc phrase validation now runs from a single table-driven guard list instead of one helper per smoke phrase.
Release metadata now self-tests the phrase guard table labels, uniqueness, and term-group shape.
`design-ai check` now formats machine-readable output through a self-tested JSON formatter with stable artifact/example key order.
`design-ai route` now formats machine-readable recommendation and catalog output through a self-tested JSON formatter.
`design-ai prompt` now formats machine-readable prompt plans through a self-tested JSON formatter with stable inferred/forced route plan order.
`design-ai pack` now formats machine-readable prompt-context bundles through a self-tested JSON formatter with stable summary, plan, and file-entry order.
`design-ai examples` now formats machine-readable worked-example discovery through a self-tested JSON formatter with stable route-biased result order.
`design-ai search` now formats machine-readable corpus search results through a self-tested JSON formatter with stable hit-entry order.
`design-ai show` now formats machine-readable corpus file output through a self-tested JSON formatter with stable line-entry order.
Release metadata now guards release-facing docs against dropping human/JSON corpus discovery smoke guidance.
Release metadata now guards release-facing docs against dropping route JSON/catalog/stdin smoke guidance.
Release metadata now reports route JSON output, route catalog output, and route stdin input drift separately.
Release metadata now guards release-facing docs against dropping explicit `show --lines` and `route --explain` smoke guidance.
Release metadata now reports show-lines output drift separately from route-explain output drift.
Release metadata now guards release-facing docs against dropping unknown command/help/list/search-dir failure smoke guidance.
Release metadata now reports unknown command, help-topic, list-domain, and search-dir failure drift separately.
Release metadata now guards release-facing docs against dropping unknown suggestion and numeric range failure smoke guidance.
Release metadata now reports route-id suggestion, option suggestion, value suggestion, and numeric range failure drift separately.
Release metadata now guards release-facing docs against dropping prompt/pack JSON/markdown/from-file/stdin smoke guidance.
Release metadata now reports prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output drift separately.
Release metadata now guards release-facing docs against dropping prompt/pack forced output-file smoke guidance.
Release metadata now reports prompt/pack forced output-file and prompt/pack file-write confirmation drift separately.
`design-ai learn --feedback` now records explicit keep/improve/avoid outcome feedback as local learning entries without model training.
`design-ai learn --init` now previews starter local learning entries for dogfood use, and `--init --yes` writes them while skipping duplicates.
`design-ai check --learn` now previews warning/failure QA feedback as local learning entries, and `--learn --yes` writes them to the selected local learning profile without embeddings, external AI calls, or schema changes.
`design-ai workspace` now gives a read-only local dogfood readiness snapshot for git sync, learning profile audit state, release scripts, and next-action hints before solo or internal distribution work.
Packed-tarball package smoke now verifies check learning capture output in both installed-bin and one-shot `npm exec --package <tarball>` paths.
Public registry smoke now verifies check learning capture output from the published `npm exec --package @design-ai/cli@<version>` path.
Release metadata now guards release-facing docs against dropping check learning capture output smoke guidance.
AI learning and product-readiness docs now describe `check --learn` as explicit local QA feedback capture while keeping background learning, embeddings, and model training outside shipped scope.
Packed-tarball package smoke now verifies learn-feedback JSON behavior in installed-bin and one-shot npm exec paths.
`design-ai learn --feedback` help and package smoke now cover inline, `--from-file`, and `--stdin` feedback capture paths.
`design-ai learn --backup --json` now emits a full portable learning-profile backup with all entries, export timestamp, and audit summary.
Packed-tarball package smoke now verifies learn-backup JSON behavior in installed-bin and one-shot npm exec paths.
Release metadata now guards release-facing docs against dropping JSON `design-ai learn --backup` smoke guidance.
`design-ai learn --redact --json` now emits a portable learning-profile backup with sensitive-looking entry text replaced by redaction markers.
`design-ai learn --redact` now also accepts portable learning JSON through `--from-file` and `--stdin`, so existing backup artifacts can be redacted without reading or mutating the local profile.
Packed-tarball package smoke now verifies learn-redact JSON behavior in installed-bin and one-shot npm exec paths.
Release metadata now guards release-facing docs against dropping JSON `design-ai learn --redact`, `design-ai learn --redact --from-file`, and `design-ai learn --redact --stdin` smoke guidance.
`design-ai learn` JSON outputs and `learn --export` Markdown now support `--out file` with `--force` overwrite control, so learning artifacts can be written without shell redirection.
Packed-tarball package smoke now verifies learn JSON `--out` file-write confirmations and forced overwrite behavior for backup/redact outputs in installed-bin and one-shot npm exec paths.
Release metadata now guards release-facing docs against dropping learn JSON `--out` file-write guidance.
`design-ai learn --list` and `learn --export` now accept `--query text` so users can inspect matching local learning entries without recency fallback.
Packed-tarball package smoke now verifies query-filtered learn list/export JSON behavior in installed-bin and one-shot npm exec paths.
`design-ai learn --list` now accepts `--explain` so query-filtered profile inspection can show selection score, matched tokens, and match reason before learned context is exported or injected.
Packed-tarball package smoke now verifies query-filtered `learn --list --explain --json` selection metadata in installed-bin and one-shot npm exec paths.
Release metadata now guards release-facing docs against dropping query-filtered human learn list explanation and export JSON smoke guidance.
Packed-tarball package smoke now verifies human query-filtered `learn --list --explain` output, including the explanation header, matched tokens, match reason, and exclusion of unrelated learning entries.
Packed-tarball package smoke now verifies human and JSON `learn --stats` profile summary output, including counts, category/source distribution, audit status, and recency summaries.
Release metadata now guards release-facing docs against dropping human / JSON `design-ai learn --stats` profile summary smoke guidance.
Public registry smoke now verifies human and JSON `learn --stats` profile summary output from the published npm package path.
Release metadata now guards release-facing docs against dropping public registry human / JSON `design-ai learn --stats` profile summary smoke guidance.
Public registry smoke now verifies JSON `learn --backup` portable profile output from the published npm package path.
Release metadata now guards release-facing docs against dropping public registry JSON `design-ai learn --backup` smoke guidance.
Public registry smoke now verifies JSON `learn --verify` portable profile validation from the published npm package path.
Release metadata now guards release-facing docs against dropping public registry JSON `design-ai learn --verify` smoke guidance.
Public registry smoke now verifies `learn --verify --from-file --json --out --force` file-write confirmation and persisted validation JSON from the published npm package path.
Release metadata now guards release-facing docs against dropping public registry learn verify `--out` file-write confirmation guidance.
`design-ai prompt --with-learning` and `design-ai pack --with-learning` now rank local learning entries by brief relevance before falling back to recency, so limited learned context favors the current task.
Packed-tarball package smoke now verifies brief-relevant learning selection in prompt and pack JSON outputs through installed-bin and one-shot npm exec paths.
Release metadata now guards release-facing docs against dropping brief-relevant prompt/pack learning selection smoke guidance.
`prompt`/`pack --with-learning --json` selection metadata now explains selected learning entries with score, matched brief tokens, and brief-match versus recency-fallback reason.
Packed-tarball package smoke now verifies the explainable learning selection metadata for prompt and pack JSON outputs.
`design-ai learn --verify` now validates portable learning JSON from `--from-file` or `--stdin` without mutating the local profile.
Packed-tarball package smoke now verifies learn-verify JSON behavior in installed-bin and one-shot npm exec paths.
Packed-tarball package smoke now retries transient one-shot `npm exec` cache ENOENT failures once with a fresh npm cache while preserving CLI assertion failures.
Release metadata now guards release-facing docs against dropping JSON `design-ai learn --verify` smoke guidance.
`design-ai learn --audit --fix` now previews and applies safe learning-profile cleanup suggestions behind dry-run / confirmed apply controls.
Packed-tarball package smoke now verifies learn-audit fix dry-run and confirmed apply JSON behavior.
Packed-tarball package smoke now verifies `design-ai learn --audit` cleanup suggestions in installed-bin and one-shot npm exec paths.
Release metadata now guards release-facing docs against dropping human/JSON `design-ai learn --audit` cleanup suggestion smoke guidance.
`design-ai learn --audit` now includes cleanup suggestions and safe forget commands for warning-bearing learning profiles.
Release metadata now guards release-facing docs against dropping check examples/artifact/stdin/all-routes smoke guidance.
Release metadata now reports check examples, check artifact, check stdin, and check all-routes output drift separately.
Release metadata now reports human install, human status, and human uninstall output drift separately.
Release metadata now reports human audit strict-quiet output drift separately.
Release metadata now reports human update dry-run output drift separately.
Release metadata now reports human doctor strict diagnostics output drift separately.
Release metadata now reports doctor JSON command and machine-readable diagnostics output drift separately.
Doctor JSON smoke assertions now verify schema shape, key order, and summary/count consistency.
Audit JSON smoke assertions now verify payload type, entry schema, numeric contracts, and summary/count consistency.
Lifecycle JSON smoke assertions now verify payload type, nested key shape, exact integer counts, and install/status/uninstall summary consistency.
Corpus discovery JSON smoke assertions now verify search/show/examples key shape, file paths, exact integer fields, and limit-bound result counts.
Route, prompt, and pack JSON smoke assertions now verify recommendation/prompt-bundle key shape, exact numeric fields, reference coverage consistency, and context file order.
Check JSON smoke assertions now verify artifact/stdin/example report key shape, exact result order, count consistency, and example metadata contracts.
Help, list, and version JSON smoke assertions now verify command-discovery key shape, alias/topic order, catalog item contracts, and version metadata keys.
Update dry-run JSON smoke assertions now verify exact git/install plan key order, boolean contracts, command arrays, and readiness reasons.
Status JSON smoke assertions now verify exact install-state section labels and Claude-home target directory contracts.
Lifecycle JSON smoke assertions now verify source/target context separation across install, update dry-run, status, and uninstall reports.
Learned context exported or injected through `learn --export`, `prompt --with-learning`, and `pack --with-learning` now carries audit summary metadata and shows a warning notice when the local profile has audit warnings.
`design-ai learn --stats` now summarizes local learning profile size, category/source distribution, recency, and audit status without mutating the profile.
`design-ai prompt --with-learning` and `design-ai pack --with-learning` now support `--learning-category` plus `--learning-limit` so local preferences can be scoped before injection.
`design-ai learn --audit` now provides read-only local profile inspection for schema issues, duplicates, stale metadata, long notes, and possible sensitive content before prompt personalization.
`design-ai learn` now supports local profile management with category/limit filters plus confirmed `--forget` and `--clear` deletion controls.
`design-ai learn` now stores local learning preferences and `prompt`/`pack --with-learning` can inject them into generated agent context without model training.
Product readiness docs now clarify that core design consulting workflows are locally release-ready while AI model training is outside shipped scope.
`design-ai help` now formats machine-readable help-topic catalogs through a self-tested JSON formatter with stable topic and alias order.
Release metadata now guards release-facing docs against dropping the `design-ai help` command.
Release metadata now guards release-facing docs against dropping top-level help smoke guidance.
Release metadata now reports `design-ai help --json` command drift separately from help JSON topic catalog drift.
Release metadata now guards release-facing docs against dropping `design-ai help --json` topic catalog guidance.
Release metadata now guards release-facing docs against dropping command and functional alias smoke guidance.
Release metadata now reports command alias smoke drift separately from functional alias smoke drift.
Release metadata now guards release-facing docs against dropping command-specific help topic smoke guidance.
`design-ai doctor` now formats machine-readable diagnostics through a self-tested JSON formatter with stable context, check, summary, and fix key order.
`design-ai list` now supports machine-readable catalog output through a self-tested JSON formatter with stable section and manifest-item order.
Release metadata now guards release-facing docs against dropping `list --json` catalog smoke guidance.
Release metadata now reports list JSON mode drift separately from list catalog domain drift.
`design-ai status` now supports machine-readable install-state output through a self-tested JSON formatter with stable context, section, entry, and summary order.
Release metadata now reports `design-ai status --json` command drift separately from install-state output drift.
`design-ai audit` now supports machine-readable repository-audit output through the shared audit runner with stable context, audit-entry, and summary order.
Release metadata now reports `design-ai audit --strict --quiet --json` command drift separately from machine-readable repository-audit output drift.
Release metadata now guards release-facing docs against dropping human/JSON `design-ai audit --strict --quiet` smoke guidance.
Release metadata now guards release-facing docs against dropping `design-ai doctor --strict` human diagnostics guidance.
Release metadata now reports `design-ai doctor --strict` command drift separately from human diagnostics wording drift.
`design-ai version` now supports machine-readable version metadata through a self-tested JSON formatter with stable context and version key order.
Release metadata now guards release-facing docs against dropping human version smoke guidance.
Release metadata now reports `design-ai version --json` command drift separately from version metadata drift.
Release metadata now guards release-facing docs against dropping `design-ai version --json` smoke guidance.
`design-ai install` now supports machine-readable lifecycle output through a self-tested JSON formatter with stable context and install-count keys.
Release metadata now reports `design-ai install --json` command drift separately from install lifecycle output drift.
Release metadata now guards release-facing docs against dropping `design-ai install --json` smoke guidance.
`design-ai uninstall` now supports machine-readable lifecycle output through a self-tested JSON formatter with stable context and removal-count keys.
Release metadata now reports `design-ai uninstall --json` command drift separately from uninstall lifecycle output drift.
Release metadata now guards release-facing docs against dropping `design-ai uninstall --json` smoke guidance.
Release metadata now guards release-facing docs against dropping `status --json` install-state smoke guidance.
Release metadata now guards release-facing docs against dropping human install/status/uninstall lifecycle smoke guidance.
`design-ai update` now rejects unknown options with self-tested suggestion output before any git pull or reinstall work starts.
`design-ai update --dry-run` now previews git and reinstall actions, including a machine-readable JSON plan for package and registry smoke checks, without mutating source files or Claude home.
Release metadata now guards release-facing docs against dropping human `design-ai update --dry-run`, JSON `design-ai update --dry-run --json`, and machine-readable update plan smoke guidance.
Release metadata now reports update dry-run command, JSON command, and machine-readable update plan drift separately.
`design-ai learn --import` now merges portable learning profile JSON with dry-run preview and confirmed apply controls.
Packed-tarball package smoke now verifies learn-import dry-run from `--from-file` and confirmed apply from `--stdin` in installed-bin and one-shot npm exec paths.
Release metadata now guards release-facing docs against dropping `design-ai learn --import` dry-run/apply smoke guidance.

### Phase 186 — Portable learning profile import

#### Changed
- Added `design-ai learn --import` for merging entries from a JSON learning profile or `learn --export --json` payload.
- Added `--dry-run` preview and confirmed `--yes` apply behavior so profile imports stay explicit and reviewable.
- Deduplicated imports by category+text, preserved valid imported timestamps, marked imported sources with `import:`, and reminted ids only when an imported id conflicts with an existing entry.
- Expanded command help, top-level help JSON, smoke assertions, package smoke, and release metadata policy guards for the new import path.
- Updated README, Korean README, AI learning docs, quickstart, distribution, release checklist, roadmap, and session log for portable learning profiles.

#### Impact
- Users can back up or move local learning preferences between machines without manually editing `~/.design-ai/learning.json`.
- Confirmed imports are mutating and require `--yes`; dry-run remains non-mutating and reports added/skipped counts.
- Existing remember, feedback, audit cleanup, stats, forget/clear, and prompt/pack learning injection flows remain unchanged.

#### Verified
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/smoke_assertions.py tools/audit/release-metadata.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `git diff --check`
- `npm run release:metadata`
- `npm run package:smoke`
- `npm run release:check`

### Phase 185 — Feedback input source smoke coverage

#### Changed
- Expanded `design-ai learn --feedback` help to show dedicated `--from-file` and `--stdin` feedback capture usage.
- Added command-level tests so feedback parsing covers `--stdin` and `runLearn` stores `--from-file` feedback with the correct outcome/category/source metadata.
- Expanded packed-tarball package smoke so installed-bin and one-shot npm exec paths record inline, `--from-file`, and `--stdin` feedback into the same learning profile.
- Tightened learn-feedback JSON smoke assertions to verify the exact generated instruction for keep, improve, and avoid outcomes.
- Updated AI learning and quickstart docs with file/stdin feedback capture examples.

#### Impact
- Longer reviewed-output feedback can be captured without shell quoting issues while preserving the explicit local-only privacy boundary.
- Release smoke now exercises all supported feedback input sources instead of only the inline path.
- Existing `learn --remember`, `learn --audit`, `learn --audit --fix`, and prompt/pack learning injection behavior remains unchanged.

#### Verified
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/smoke_assertions.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `git diff --check`
- `npm run release:metadata`
- `npm run package:smoke`
- `npm run release:check`

### Phase 184 — Explicit feedback learning loop

#### Changed
- Added `design-ai learn --feedback text` for recording durable outcome feedback into the local learning profile.
- Added `--outcome keep|improve|avoid` so feedback becomes explicit repeat / improve / avoid guidance before prompt injection.
- Defaulted feedback entries to the `workflow` category while preserving `--category` overrides for brand, accessibility, Korean-market, or other scoped feedback.
- Added feedback JSON payloads with outcome, category, generated instruction text, persisted entry metadata, and count.
- Updated CLI help discovery, smoke assertions, package smoke, quickstart, AI learning docs, product readiness docs, README status copy, changelog, roadmap, and session log for the feedback loop.

#### Impact
- Users can turn reviewed output quality signals into opt-in local personalization without automatic telemetry, embeddings, model training, or fine-tuning.
- Existing `learn --remember`, `learn --audit`, `learn --audit --fix`, `learn --stats`, `learn --forget` / `--clear`, and `prompt` / `pack --with-learning` behavior remains unchanged.

#### Verified
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/smoke_assertions.py tools/audit/release-metadata.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `git diff --check`
- `npm run release:metadata`
- `npm run package:smoke`
- `npm run release:check`

### Phase 183 — Learning audit safe fix loop

#### Changed
- Added `design-ai learn --audit --fix --dry-run` to preview automatically fixable cleanup suggestions without mutating the profile.
- Added `design-ai learn --audit --fix --yes` to remove only safe, unambiguous learning entries targeted by audit suggestions.
- Added machine-readable cleanup payloads with before/after audit summaries, skipped manual-review suggestions, removed entry previews, and stable cleanup command metadata.
- Updated learn command help, top-level help catalog, smoke assertions, AI learning docs, quickstart guidance, README status copy, product readiness docs, roadmap, changelog, and session log for the fix loop.
- Expanded package smoke coverage so packed-tarball installed-bin and one-shot npm exec paths verify learn-audit fix dry-run and confirmed apply JSON behavior.

#### Impact
- Users can move from learning audit warnings to safe cleanup without manually copying each generated `--forget` command.
- Ambiguous or unsafe cases still stay manual: invalid JSON, malformed entries, duplicate ids, and warnings without stable ids are skipped instead of being auto-deleted.
- Existing `learn --audit` read-only behavior, `learn --forget` / `learn --clear` confirmation gates, prompt/pack learning injection, repository audits, and package contents checks remain unchanged.

#### Verified
- `node --test cli/lib/learn.test.mjs cli/lib/help-command.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -m py_compile tools/audit/package-smoke.py tools/audit/smoke_assertions.py`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `git diff --check`
- `npm run release:metadata`
- `npm run package:smoke`
- `npm run release:check`

### Phase 182 — Learning audit package smoke coverage

#### Changed
- Added package-smoke coverage for `design-ai learn --audit` cleanup suggestions using a temporary profile with duplicate-entry and sensitive-content warnings.
- Verified `learn --audit --json` status, issue codes, suggestion actions, and safe `design-ai learn --file ... --forget ... --yes` command args.
- Verified human `learn --audit` output keeps the Suggested cleanup section and concrete cleanup commands.
- Ran the new smoke through both packed-tarball installed-bin and one-shot `npm exec --package <tarball>` paths.
- Added package-smoke self-test fixtures for the new JSON and human-output assertions.
- Added a release metadata phrase guard so release-facing docs keep mentioning the learn-audit cleanup smoke surface.

#### Impact
- Release verification now exercises the Phase 181 cleanup guidance in the same package surfaces adopters run.
- Existing CLI behavior, learning profile storage, confirmed deletion controls, repository audits, package contents checks, and registry smoke remain unchanged.

#### Verified
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run package:smoke`
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `git diff --check`
- `npm run release:metadata`
- `npm run release:check`

### Phase 181 — Learning audit cleanup suggestions

#### Changed
- Added `suggestions` metadata to `design-ai learn --audit --json` payloads so duplicate, sensitive-content, long-note, and metadata warnings map to concrete cleanup actions.
- Added safe `design-ai learn --file ... --forget ... --yes` command strings only when a warning has an unambiguous entry id.
- Added manual repair suggestions for ambiguous duplicate ids, missing ids, invalid entries, and profile-level failures where deletion commands could target the wrong data.
- Added a Suggested cleanup section to human `learn --audit` output.
- Updated AI learning docs, quickstart guidance, product readiness docs, README status copy, roadmap, changelog, and session log for the cleanup-suggestion behavior.
- Expanded learning tests for audit suggestion metadata and human cleanup output.

#### Impact
- Users can inspect, decide, and clean local learning profiles faster before exporting or injecting preferences.
- Existing read-only audit behavior, issue reporting, confirmed deletion controls, prompt/pack learning injection, and storage format remain unchanged.

#### Verified
- `node --test cli/lib/learn.test.mjs`
- `node --test cli/lib/help-command.test.mjs`
- Learning audit cleanup suggestion smoke passed with temporary profile files.
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm run audit:strict`
- All 8 audits pass.
- `git diff --check`
- `npm run release:metadata`
- `npm run release:check`

### Phase 180 — Learned-context audit summaries

#### Changed
- Added `auditSummary` metadata to learned context returned by `learn --export --json`, `prompt --with-learning --json`, and `pack --with-learning --json`.
- Added a compact warning notice inside learned-context Markdown when the local learning profile audit status is `warn`.
- Kept clean profiles compact by omitting the notice for `pass` status.
- Updated AI learning docs, quickstart guidance, product readiness docs, README status copy, roadmap, changelog, and session log for the audit-summary behavior.
- Expanded learning tests for prompt/pack learning payload metadata and warning-aware learned-context Markdown.

#### Impact
- Users and downstream agents can see profile quality state at the point local preferences are exported or injected.
- Existing local learning storage, read-only audit/stats, category/limit scoping, and confirmed deletion controls remain unchanged.

#### Verified
- `node --test cli/lib/learn.test.mjs cli/lib/prompt.test.mjs cli/lib/pack.test.mjs`
- Learned-context audit summary smoke passed with temporary profile files.
- `npm test`
- `npm run audit:strict`
- All 8 audits pass.
- `git diff --check`
- `npm run release:metadata`
- `npm run release:check`

### Phase 179 — Learning profile stats summary

#### Changed
- Added `design-ai learn --stats` and `design-ai learn --stats --json` as read-only profile overview commands.
- Summarized profile existence, entry count, category counts, source counts, oldest/latest parseable entries, and audit summary without mutating the profile.
- Kept stats resilient for missing or invalid profiles by returning audit status instead of writing or normalizing files.
- Updated CLI help discovery, smoke assertions, README command references, quickstart guidance, product readiness docs, and AI learning docs for the stats surface.
- Expanded learning unit coverage for stats parsing, normal profile summaries, missing profile summaries, and invalid JSON handling.

#### Impact
- Users can quickly decide whether to filter, audit, clean up, or inject local preferences before using `--with-learning`.
- Existing `learn --audit`, list/export filtering, forget/clear controls, scoped prompt/pack injection, and non-learning prompt/pack behavior remain unchanged.

#### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- Learning stats smoke passed with temporary profile files.
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:metadata`
- `npm run release:check`

### Phase 178 — Scoped learning prompt injection

#### Changed
- Added `--learning-category` and `--learning-limit` to `design-ai prompt --with-learning` so generated prompts can include only the relevant local learning entries.
- Added the same scoped learning controls to `design-ai pack --with-learning`, passing the filter through the prompt plan embedded in portable packs.
- Kept learning filters behind the existing `--with-learning` opt-in boundary so saved local preferences are never injected by category/limit flags alone.
- Updated CLI help discovery, smoke assertions, README command references, quickstart guidance, product readiness docs, and AI learning docs for scoped prompt injection.
- Expanded prompt and pack unit coverage for parser contracts, invalid filter handling, and category/limit propagation into generated learning context.

#### Impact
- Prompt personalization is now narrower by default for real tasks: users can include only one learning category and cap the number of entries.
- Existing unfiltered `prompt`/`pack --with-learning`, `design-ai learn` profile management, audit controls, and non-learning prompt/pack output remain unchanged.

#### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- Scoped learning prompt/pack smoke passed with a temporary profile file.
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:metadata`
- `npm run release:check`

### Phase 177 — Learning profile audit controls

#### Changed
- Added `design-ai learn --audit` and `design-ai learn --audit --json` to inspect local profile existence, entry counts, category counts, schema issues, duplicate notes, timestamp gaps, long notes, and conservative sensitive-content patterns.
- Kept audit mode advisory and read-only so users can inspect a profile before deciding whether to use `--with-learning`, `--forget`, or `--clear`.
- Updated CLI help discovery, smoke assertions, README command references, quickstart guidance, product readiness docs, and AI learning docs for the audit surface.
- Expanded learning unit coverage for audit parsing, missing-profile pass state, invalid JSON failure reporting, duplicate detection, timestamp warnings, and sensitive-content warnings.

#### Impact
- Local learning now has a safer inspection step before prompt personalization without adding telemetry, embeddings, model training, or background collection.
- Existing `learn --remember`, list/export filtering, forget/clear retention controls, and prompt/pack `--with-learning` behavior remain unchanged.

#### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- Learning audit smoke passed with temporary profile files.
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:metadata`
- `npm run release:check`

### Phase 176 — Learning profile management controls

#### Changed
- Added `design-ai learn --forget id-or-number --yes` and `design-ai learn --clear --yes` so users can remove local learning entries without editing the JSON profile by hand.
- Added `--category` and `--limit` filtering for `learn --list` and `learn --export`, keeping prompt personalization context easier to inspect before use.
- Updated CLI help discovery, smoke assertions, README command references, and AI learning docs for the expanded management surface.
- Expanded learning unit coverage for parsing, category/limit filtering, single-entry deletion, full-profile clearing, and filtered Markdown export.

#### Impact
- Local learning remains explicit and privacy-safe, but now has user-controlled retention and narrower inspection/export controls.
- Existing `learn --remember`, default list output, prompt/pack `--with-learning`, and package manifest counts remain unchanged.

#### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- Learning management smoke passed with a temporary profile file.
- `npm run audit:strict`
- All 8 audits pass.
- `npm run release:metadata`
- `npm run release:check`

### Phase 175 — Local learning profile MVP

#### Changed
- Added `design-ai learn` for explicit local preference memory with `--remember`, `--list`, `--export`, `--from-file`, `--stdin`, `--category`, `--file`, and `--json` support.
- Added opt-in `--with-learning` support to `design-ai prompt` and `design-ai pack`, injecting the learned-context block only when requested.
- Added `docs/AI-LEARNING.md`, updated product readiness docs, README command references, MkDocs navigation, and CLI help discovery for the new learning surface.
- Wrapped long top-level help rows so `prompt`, `pack`, and `learn` usage stays readable after adding learning options.
- Expanded unit and smoke assertion coverage for learning profile parsing, persistence, prompt/pack injection, help topic discovery, and unknown-option suggestion behavior.

#### Impact
- design-ai now ships a privacy-safe local personalization layer while keeping model training, fine-tuning, embeddings, and feedback learning outside the shipped scope.
- Existing route selection, prompt/pack output without `--with-learning`, slash-command inventory, install lifecycle, and package manifest counts remain unchanged.

#### Verified
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- All 8 audits pass.
- Learning profile prompt/pack smoke passed with a temporary profile file.
- `npm run release:metadata`
- `npm run release:check`

### Phase 174 — Product readiness scope boundary documented

#### Changed
- `docs/PRODUCT-READINESS.md` now separates shipped design consulting capability, local release confidence, conversational AI design coverage, and non-shipped AI learning/model-training scope.
- README status sections now link to the readiness boundary and clarify that design-ai is a corpus/routing/prompt-pack/QA layer rather than a model or fine-tune.
- MkDocs navigation now exposes the readiness page under Reference so launch reviewers can find the current completion matrix.

#### Impact
- Product status is now explicit: core design consulting workflows are locally release-ready for v4.13, while Real-CI, external launch, registry smoke, and any future personalization/model-learning work remain separate decisions.
- Existing CLI runtime behavior, package contents, release smoke assertions, knowledge corpus files, examples, and command coverage remain unchanged.

#### Verified
- All 8 audits pass.
- `npm run release:metadata`

### Phase 173 — Lifecycle JSON context path assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now validates lifecycle JSON context paths through a shared source/target guard for `design-ai install --json`, `design-ai update --dry-run --json`, `design-ai status --json`, and `design-ai uninstall --json`.
- Lifecycle JSON assertions now reject `sourceRoot` and `claudeHome` when they are identical or nested inside each other, while keeping the existing key-order, prefix, count, plan, and install-state checks.
- The smoke assertion self-test now covers install context equality, update source-inside-target drift, status target-inside-source drift, and uninstall target-inside-source drift fixtures.

#### Impact
- Package and registry smoke checks now fail when lifecycle JSON remains parseable and counts still match, but the reported source and Claude Code target roots no longer describe separate lifecycle contexts.
- Existing CLI runtime behavior, lifecycle JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Phase 172 — Status JSON install-state target assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai status --json` section labels and target directories against the install-state contract used by package and registry smoke.
- Status JSON assertions now require each section to keep the exact `Skills`, `Agents`, and `Slash commands` labels, keep target directories under `claudeHome`, and end each target path with the matching `skills`, `agents`, or `commands` directory.
- The smoke assertion self-test now covers section label drift, target directory escaping `claudeHome`, and target directory basename drift fixtures.

#### Impact
- Package and registry smoke checks now fail when status JSON remains parseable and has the right symlink entries, but no longer describes the same user-facing install-state sections or Claude Code target directories.
- Existing CLI runtime behavior, status JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Phase 171 — Update dry-run JSON smoke plan assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai update --dry-run --json` with stricter update-plan guards for top-level key order, nested `plan` key order, git-pull boolean fields, git command arrays, and git/install readiness reasons.
- Update dry-run JSON assertions now reject bool-as-int drift for `gitPull.wouldRun`, stale git clone reasons, missing git pull commands for clone sources, missing install reason keys, and install reason wording drift.
- The smoke assertion self-test now covers top-level reorder, plan reorder, boolean type drift, clone command drift, git reason drift, install key drift, and install reason drift fixtures.

#### Impact
- Package and registry smoke checks now fail when update preview JSON remains parseable but no longer describes the same non-mutating git/install plan contract used before install lifecycle checks.
- Existing CLI runtime behavior, update dry-run JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Phase 170 — Help/list/version JSON smoke schema assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai help --json`, `design-ai list --json`, and `design-ai version --json` with stable top-level, topic, alias, catalog section, catalog item, context, and version key guards.
- Help JSON assertions now require exact topic usage strings, stable topic entry key order, exact alias order, and per-topic alias lists aligned with the canonical alias map.
- List/version JSON assertions now reject non-object payloads, key-order drift, bool-as-int section counts, catalog item shape drift, and version context/metadata key drift.

#### Impact
- Package and registry smoke checks now fail when command discovery or version metadata JSON remains parseable but drifts from the machine-readable contracts used by automation and downstream agents.
- Existing CLI runtime behavior, help/list/version JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Phase 169 — Check JSON smoke schema assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai check --json`, `design-ai check --stdin --json`, and `design-ai check --examples --json` with stable report, result, example-entry, and example-metadata key guards.
- Check report assertions now require exact non-boolean integer pass/warn/fail/total fields, exact score formatting, exact component-spec result order, required result title/message fields, and `content-depth` evidence shape.
- Check examples JSON assertions now require stable top-level key order, exact non-boolean summary counts, exact example entry shape, positive non-boolean example scores, non-empty previews, and summary counts aligned with nested example reports.

#### Impact
- Package and registry smoke checks now fail when `design-ai check` JSON remains parseable but drifts from the machine-readable artifact QA contract used by release automation and downstream agents.
- Existing CLI runtime behavior, check JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`

### Phase 168 — Route/prompt/pack JSON smoke schema assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai route --json`, `design-ai routes --json`, `design-ai prompt --json`, and `design-ai pack --json` with stable top-level, route-entry, explanation, reference, prompt-plan, summary, and file-entry key guards.
- Route JSON assertions now require exact route result counts for `--limit 1`, stable recommendation key shape, exact non-boolean integer scores, keyword lists, reference entry shape, score breakdown shape, and full reference coverage consistency.
- Prompt JSON assertions now require stable forced-route plan shape, exact `filesToRead` order, reference example previews/scores, route coverage consistency, and prompt bundle content.
- Pack JSON assertions now require stable bundle and summary key shape, exact budget/count fields, ordered context files aligned with the prompt plan, included file-entry contracts, string warnings, and explicit context budget exhaustion.

#### Impact
- Package and registry smoke checks now fail when route selection, prompt generation, or context packing JSON remains parseable but drifts from the machine-readable contracts used by automation and downstream agents.
- Existing CLI runtime behavior, route/prompt/pack JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Phase 167 — Corpus discovery JSON smoke schema assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies `design-ai search --json`, `design-ai show --json`, `design-ai show --lines --json`, and `design-ai examples --json` with corpus-specific object/key guards.
- Search JSON assertions now require stable hit keys, non-empty absolute file paths ending in the expected corpus path, exact positive integer line numbers, and the single result promised by `--limit 1`.
- Show JSON assertions now require stable top-level and line-entry keys, exact positive integer range fields, valid `totalLines`, and file paths aligned with the reported `relPath`.
- Examples JSON assertions now require stable route-biased payload keys, exact positive integer scores, non-empty previews, and the single result promised by `--limit 1`.

#### Impact
- Package and registry smoke checks now fail when corpus discovery JSON remains parseable but drifts from the machine-readable search/show/examples contract that prompt-building and automation depend on.
- Existing CLI runtime behavior, corpus JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Phase 166 — Lifecycle JSON smoke schema assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies lifecycle JSON payloads for `design-ai install --json`, `design-ai status --json`, `design-ai uninstall --json`, and `design-ai update --dry-run --json` with shared object/key guards.
- Install JSON assertions now reject non-object top-level payloads, bool-as-int count drift, and installed total values that do not equal the section counts.
- Status JSON assertions now reject unexpected section counts, bool-as-int section/summary counts, and non-object top-level payloads before comparing installed entries.
- Uninstall and update dry-run JSON assertions now reject non-object top-level payloads, and uninstall JSON rejects bool-as-int removed counts.

#### Impact
- Package and registry smoke checks now fail when lifecycle JSON remains parseable but drifts from the machine-readable install/status/uninstall/update contract that automation consumes.
- Existing CLI runtime behavior, lifecycle JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Phase 165 — Audit JSON smoke schema assertion hardening

#### Changed
- `tools/audit/smoke_assertions.py` now verifies the full `design-ai audit --strict --quiet --json` report contract: top-level payload type, context shape, audit entry keys, boolean/integer/numeric field contracts, strict args shape, and summary/count consistency.
- Audit JSON smoke assertion self-tests now include fixtures for array top-level payloads, missing audit-entry keys, boolean numeric drift, non-boolean pass flags, and mismatched summary counts.

#### Impact
- Package and registry smoke checks now fail when audit JSON remains parseable but drifts from the machine-readable repository-audit schema that automation consumes.
- Existing CLI runtime behavior, audit JSON formatter output, audit runner execution, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/run-all.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

### Phase 164 — Doctor JSON smoke schema assertion hardening

#### Changed
- `tools/audit/doctor_assertions.py` now verifies the full `design-ai doctor --json` report contract: top-level key order, context shape, expected inventory counts, check entry keys, summary keys, fix keys, and summary/count consistency.
- Doctor assertion self-tests now include fixtures for missing `fix`, mismatched summary counts, and changed check-entry shape.
- Shared package/registry smoke doctor JSON fixtures now match the production `context`, `checks`, `summary`, and `fix` payload shape.

#### Impact
- Package and registry smoke checks now fail when doctor JSON remains parseable but drifts from the machine-readable diagnostics schema that automation consumes.
- Existing CLI runtime behavior, doctor JSON formatter output, package smoke command coverage, registry smoke command coverage, release metadata execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/doctor_assertions.py --self-test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run package:smoke`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release smoke automation now protects doctor JSON as a stable machine-readable contract, not only as valid JSON with passing labels.

### Phase 163 — Doctor JSON diagnostics guard split

#### Changed
- `tools/audit/release-metadata.py` now adds separate release policy phrase labels for the exact `design-ai doctor --json` command and machine-readable diagnostics output.
- `release-metadata.py --self-test` now has drift fixtures for dropping the doctor JSON command while keeping output wording, and for dropping machine-readable diagnostics output wording while keeping the exact command.
- README, Korean README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out `design-ai doctor --json` machine-readable diagnostics output in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the doctor strict command, generic human diagnostics wording, human doctor strict output, the doctor JSON command, or the doctor JSON output contract.
- The guard is documentation-only at runtime; existing CLI behavior, doctor JSON formatting, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve doctor smoke guidance as independently reported human strict, JSON command, and machine-readable diagnostics output contracts.

### Phase 162 — Doctor human diagnostics output guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad doctor human diagnostics guard and adds a separate human doctor strict diagnostics output release policy phrase label.
- `release-metadata.py --self-test` now has a drift fixture for dropping human diagnostics output from `design-ai doctor --strict` while the generic human diagnostics wording remains present.
- README, Korean README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out human diagnostics output from `design-ai doctor --strict` in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost generic human diagnostics wording, the exact doctor strict command, or the doctor strict human diagnostics output contract.
- The guard is documentation-only at runtime; existing CLI behavior, doctor execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve doctor strict smoke guidance as independently reported command, generic human diagnostics, and human diagnostics output contracts.

### Phase 161 — Human update dry-run output guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad `update --dry-run` lifecycle guard and adds a separate human update dry-run output release policy phrase label.
- `release-metadata.py --self-test` now has a drift fixture for dropping human `design-ai update --dry-run` output wording while JSON dry-run command and update plan wording remain present.
- `docs/RELEASE-CHECKLIST.md` now names human update dry-run output separately from the exact command and machine-readable update plan in the metadata guard explanation.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the human update dry-run output contract, the exact dry-run command, the JSON dry-run command, or the machine-readable update plan.
- The guard is documentation-only at runtime; existing CLI behavior, update dry-run output, update dry-run JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve update dry-run smoke guidance as independently reported human output, command, JSON command, and machine-readable plan contracts.

### Phase 160 — Human audit output guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad `audit --strict --quiet` smoke guard and adds a separate human audit output release policy phrase label.
- `release-metadata.py --self-test` now has a drift fixture for dropping human `design-ai audit --strict --quiet` output wording while JSON audit wording remains present.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out human audit output separately from JSON repository-audit output.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost human audit output coverage or JSON repository-audit coverage.
- The guard is documentation-only at runtime; existing CLI behavior, audit execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve audit smoke guidance as independently reported human and machine-readable output contracts.

### Phase 159 — Human lifecycle output guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad human install/status/uninstall lifecycle guards and adds separate human install output, human status output, and human uninstall output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping each human lifecycle output wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the human install, status, and uninstall output surfaces separately from JSON lifecycle output.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost human install output, human status output, or human uninstall output coverage.
- The guard is documentation-only at runtime; existing CLI behavior, install execution, status execution, uninstall execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve human lifecycle smoke guidance as independently reported install, status, and uninstall output contracts.

### Phase 158 — Check output guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad check examples/artifact/stdin/all-routes guard and adds separate check examples output, check artifact output, check stdin output, and check all-routes output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping each `design-ai check` smoke-surface wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the four check output surfaces separately.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost check examples, artifact, stdin, or all-routes output coverage.
- The guard is documentation-only at runtime; existing CLI behavior, check execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve `design-ai check` smoke guidance as four independently reported contracts.

### Phase 157 — Prompt/pack output-file guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad prompt/pack output-file guard and adds separate prompt/pack forced output-file and prompt/pack file-write confirmation release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping forced `--out` wording and file-write confirmation wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out prompt/pack forced output-file coverage and prompt/pack file-write confirmations separately.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost prompt/pack forced output-file coverage or prompt/pack file-write confirmation coverage.
- The guard is documentation-only at runtime; existing CLI behavior, prompt execution, pack execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve prompt/pack output-file smoke guidance as two independently reported contracts.

### Phase 156 — Prompt/pack mode guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad prompt/pack mode guard and adds separate prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping each prompt/pack mode output wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the eight prompt/pack mode smoke surfaces separately.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost prompt JSON, prompt markdown, prompt from-file, prompt stdin, pack JSON, pack markdown, pack from-file, or pack stdin coverage.
- The guard is documentation-only at runtime; existing CLI behavior, prompt execution, pack execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve prompt/pack mode smoke guidance as eight independently reported contracts.

### Phase 155 — Suggestion failure guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad suggestion/range failure guard and adds separate route-id suggestion, option suggestion, value suggestion, and numeric range failure release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping unknown route-id suggestion wording, unknown option suggestion wording, unknown value suggestion wording, and numeric range failure wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the four suggestion/range smoke surfaces separately.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost route-id suggestion, option suggestion, value suggestion, or numeric range failure coverage.
- The guard is documentation-only at runtime; existing CLI behavior, unknown route-id suggestion execution, unknown option suggestion execution, unknown value suggestion execution, numeric range failure execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve route-id suggestion, option suggestion, value suggestion, and numeric range failure smoke guidance as four independently reported contracts.

### Phase 154 — Unknown failure guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad unknown command/help/list/search-dir failure guard and adds separate unknown command, help-topic, list-domain, and search-dir failure release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping unknown command failure wording, unknown help-topic failure wording, unknown list-domain failure wording, and unknown search-dir failure wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out the four unknown failure smoke surfaces separately.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost unknown command, help-topic, list-domain, or search-dir failure coverage.
- The guard is documentation-only at runtime; existing CLI behavior, unknown command failure execution, unknown help-topic failure execution, unknown list-domain failure execution, unknown search-dir failure execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve unknown command, help-topic, list-domain, and search-dir failure smoke guidance as four independently reported contracts.

### Phase 153 — Explicit output guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad explicit output guard and adds separate show-lines output and route-explain output release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping `show --lines` output wording and dropping `route --explain` output wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out `show --lines` output and `route --explain` output as separate release smoke surfaces.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost explicit line-range output coverage or route explanation output coverage.
- The guard is documentation-only at runtime; existing CLI behavior, `show --lines` output, `route --explain` output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve explicit line-range output and route explanation output as two independently reported contracts.

### Phase 152 — Route smoke guard split

#### Changed
- `tools/audit/release-metadata.py` now keeps the broad route JSON/catalog/stdin guard and adds separate route JSON output, route catalog output, and route stdin input release policy phrase labels.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping route JSON output wording, route catalog output wording, and route stdin input wording.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now spell out route JSON output, route catalog output, and route stdin input as separate release smoke surfaces.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost route recommendation JSON output, route catalog output, or route stdin input coverage.
- The guard is documentation-only at runtime; existing CLI behavior, route JSON output, route catalog output, route stdin input execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve route JSON output, route catalog output, and route stdin input as three independently reported contracts.

### Phase 151 — List catalog guard split

#### Changed
- `tools/audit/release-metadata.py` now checks list JSON mode wording and list catalog domain coverage with separate release policy phrase labels while keeping the broad list JSON catalog guard.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping list JSON mode wording and dropping all-three list catalog domain wording.
- `docs/RELEASE-CHECKLIST.md` now names list JSON mode and list catalog domains separately in release metadata coverage guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost JSON-mode list guidance or lost the skills/commands/agents catalog domain coverage that package and registry smoke validate.
- The guard is documentation-only at runtime; existing CLI behavior, list JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve list JSON mode guidance and list catalog domain coverage as two independently reported contracts.

### Phase 150 — Alias smoke guard split

#### Changed
- `tools/audit/release-metadata.py` now checks command alias smoke wording and functional alias smoke wording with separate release policy phrase labels while keeping the broad alias smoke guard.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping command alias wording and dropping functional alias wording.
- `docs/RELEASE-CHECKLIST.md` now names command alias smoke and functional alias smoke separately in release metadata coverage guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost command alias help guidance or functional alias output guidance.
- The guard is documentation-only at runtime; existing CLI behavior, help alias output, functional alias output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve command alias help guidance and functional alias output guidance as two independently reported contracts.

### Phase 149 — Update dry-run JSON command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai update --dry-run` and `design-ai update --dry-run --json` commands with dedicated phrase labels instead of coupling them to generic update dry-run wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the human dry-run command, dropping the JSON dry-run command, and dropping machine-readable update plan wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name the human dry-run command, JSON dry-run command, and machine-readable update plan in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the dry-run command to run, the JSON dry-run command, or the machine-readable update plan behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, update dry-run output, update dry-run JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the update dry-run human command, JSON command, and machine-readable update plan as three independently reported contracts.

### Phase 148 — Doctor strict command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai doctor --strict` command with a dedicated phrase label instead of coupling it to human diagnostics wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai doctor --strict` command and for dropping human diagnostics wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name both the `design-ai doctor --strict` command and human diagnostics in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the doctor strict command to run or the human diagnostics behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, doctor strict diagnostics output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `npm run release:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the `design-ai doctor --strict` command and human diagnostics as two independently reported contracts.

### Phase 147 — Audit JSON command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai audit --strict --quiet --json` command with a dedicated phrase label instead of coupling it to machine-readable repository-audit output wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai audit --strict --quiet --json` command and for dropping machine-readable repository-audit output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name both the `design-ai audit --strict --quiet --json` command and machine-readable repository-audit output in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the audit JSON command to run or the repository-audit output behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, audit JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the `design-ai audit --strict --quiet --json` command and machine-readable repository-audit output as two independently reported contracts.

### Phase 146 — Status JSON command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai status --json` command with a dedicated phrase label instead of coupling it to machine-readable install-state output wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai status --json` command and for dropping machine-readable install-state output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name both the `design-ai status --json` command and machine-readable install-state output in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the status JSON command to run or the install-state output behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, status JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the `design-ai status --json` command and machine-readable install-state output as two independently reported contracts.

### Phase 145 — Uninstall JSON command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai uninstall --json` command with a dedicated phrase label instead of coupling it to machine-readable uninstall lifecycle output wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai uninstall --json` command and for dropping machine-readable uninstall lifecycle output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name both the `design-ai uninstall --json` command and machine-readable uninstall lifecycle output in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the uninstall JSON command to run or the uninstall lifecycle output behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, uninstall JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the `design-ai uninstall --json` command and machine-readable uninstall lifecycle output as two independently reported contracts.

### Phase 144 — Install JSON command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai install --json` command with a dedicated phrase label instead of coupling it to machine-readable install lifecycle output wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai install --json` command and for dropping machine-readable install lifecycle output wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name both the `design-ai install --json` command and machine-readable install lifecycle output in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the install JSON command to run or the install lifecycle output behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, install JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the `design-ai install --json` command and machine-readable install lifecycle output as two independently reported contracts.

### Phase 143 — Version JSON command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai version --json` command with a dedicated phrase label instead of coupling it to machine-readable version metadata wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai version --json` command and for dropping machine-readable version metadata wording.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name both the `design-ai version --json` command and machine-readable version metadata behavior in release smoke guidance.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the version JSON command to run or the version metadata behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, version JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the `design-ai version --json` command and machine-readable version metadata behavior as two independently reported contracts.

### Phase 142 — Help JSON command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks the exact `design-ai help --json` command with a dedicated phrase label instead of coupling it to topic catalog wording.
- `release-metadata.py --self-test` now has separate drift fixtures for dropping the `design-ai help --json` command and for dropping help JSON topic catalog wording.
- `docs/RELEASE-CHECKLIST.md` now names both the `design-ai help --json` command and help JSON topic catalog guidance in the protected release metadata phrase set.

#### Impact
- Release metadata failures now distinguish whether release-facing docs lost the command to run or the topic catalog behavior that command validates.
- The guard is documentation-only at runtime; existing CLI behavior, help JSON output, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, package contents check execution, repository audit execution, local CI execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the `design-ai help --json` command and the help JSON topic catalog behavior as two independently reported contracts.

### Phase 141 — Top-level help command guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `design-ai help` command alongside top-level help smoke guidance, help JSON topic catalog guidance, version, alias, route, prompt/pack, check, audit, doctor, lifecycle, failure-path, package smoke, registry smoke, release check, and local CI guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `design-ai help` command wording is removed from a release-facing policy doc.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name `design-ai help` as the top-level help command rather than only describing top-level help output.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep top-level help wording while dropping the `design-ai help` command that package and registry smoke validate.
- The guard is documentation-only at runtime; existing CLI behavior, help command execution, local CI execution, repository audit execution, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check execution, package smoke execution, registry smoke execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the top-level help command and top-level help smoke guidance as one contract.

### Phase 140 — Local CI command guard split

#### Changed
- `tools/audit/release-metadata.py` now checks `npm run ci:local` with a dedicated local CI command phrase label instead of coupling that command to the MkDocs warning-policy phrase label.
- `release-metadata.py --self-test` now asserts the exact `local CI command phrase` drift error when `npm run ci:local` wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now documents `npm run ci:local` command guidance separately from MkDocs warning-policy baseline guidance in the release metadata protected phrase set.

#### Impact
- Release metadata failures now distinguish the local CI command handoff from MkDocs warning-policy baseline prose, so maintainers can see whether a doc dropped the command to run, the warning policy itself, or both.
- The guard is documentation-only at runtime; existing CLI behavior, local CI execution, repository audit execution, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check execution, package smoke execution, registry smoke execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve local CI command guidance and MkDocs warning-policy guidance as two independently reported contracts.

### Phase 139 — Repository audit command guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `npm run audit:strict` command alongside all-eight repository audits, CLI unit tests, whitespace checks, release self-tests, release metadata checks, package contents, package smoke, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, registry smoke, public registry npm exec, release check, MkDocs warning-policy, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `npm run audit:strict` command wording is removed from a release-facing policy doc.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name `npm run audit:strict` as the all-eight repository audit command rather than only describing repository audit coverage.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep all-eight repository audit wording while dropping the `npm run audit:strict` command that runs before whitespace, package, and smoke checks.
- The guard is documentation-only at runtime; existing CLI behavior, repository audit execution, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check execution, package smoke execution, registry smoke execution, and release check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the repository audit command and all-eight repository audit guidance as one contract.

### Phase 138 — CLI unit test command guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `npm test` command alongside CLI unit tests, whitespace checks, release self-tests, release metadata checks, package contents, package smoke, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, registry smoke, public registry npm exec, release check, MkDocs warning-policy, all-eight repository audits, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `npm test` command wording is removed from a release-facing policy doc.
- README, Korean README, English/Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name `npm test` as the CLI unit test command rather than only describing CLI unit tests.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep CLI unit test wording while dropping the `npm test` command that runs before repository audits and package checks.
- The guard is documentation-only at runtime; existing CLI behavior, CLI unit test execution, whitespace check execution, release self-test execution, release metadata execution, package contents check execution, package smoke execution, registry smoke execution, release check execution, and repository audit execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the CLI unit test command and CLI unit test guidance as one contract.

### Phase 137 — Whitespace check command guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `git diff --check` command alongside whitespace checks, release self-tests, release metadata checks, package contents, package smoke, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, registry smoke, public registry npm exec, release check, MkDocs warning-policy, CLI unit tests, all-eight repository audits, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `git diff --check` command wording is removed from a release-facing policy doc.
- README, Korean README, Korean Distribution, and `docs/RELEASE-CHECKLIST.md` now name `git diff --check` as the whitespace check command rather than only describing whitespace checks.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep whitespace check wording while dropping the `git diff --check` command that runs before package contents and smoke checks.
- The guard is documentation-only at runtime; existing CLI behavior, whitespace check execution, release self-test execution, release metadata execution, package contents check execution, package smoke execution, registry smoke execution, release check execution, repository audit execution, and unit test execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the whitespace command and whitespace check guidance as one contract.

### Phase 136 — Release self-test command guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `npm run release:self-test` command alongside release self-tests, release metadata checks, package contents, package smoke, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, registry smoke, public registry npm exec, release check, MkDocs warning-policy, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `release:self-test` command wording is removed from a release-facing policy doc.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now name `release:self-test` as the release assertion fixture command rather than only describing release self-test guidance.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep release self-test wording while dropping the `release:self-test` command that runs assertion fixtures before package smoke.
- The guard is documentation-only at runtime; existing CLI behavior, release self-test execution, release metadata execution, package contents check execution, package smoke execution, registry smoke execution, release check execution, whitespace check execution, repository audit execution, and unit test execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the release self-test command and release self-test guidance as one contract.

### Phase 135 — Release metadata command guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `npm run release:metadata` command alongside release metadata checks, package contents, package smoke, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, registry smoke, public registry npm exec, release check, MkDocs warning-policy, release self-tests, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `release:metadata` command wording is removed from a release-facing policy doc.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now name `release:metadata` as the release metadata command rather than only describing release metadata checks.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep release metadata check wording while dropping the `release:metadata` command that runs the guard before tagging.
- The guard is documentation-only at runtime; existing CLI behavior, release metadata execution, package contents check execution, package smoke execution, registry smoke execution, release check execution, release self-test execution, whitespace check execution, repository audit execution, and unit test execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the release metadata command and release metadata check wording as one contract.

### Phase 134 — Package contents command metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `npm run package:check` command alongside package contents, package smoke, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, registry smoke, public registry npm exec, release check, MkDocs warning-policy, release metadata checks, release self-tests, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `package:check` command wording is removed from a release-facing policy doc.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now name `package:check` as the package contents command rather than only describing package contents checks.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep package contents wording while dropping the `package:check` command that verifies tarball contents.
- The guard is documentation-only at runtime; existing CLI behavior, package contents check execution, package smoke execution, registry smoke execution, release check execution, release metadata execution, release self-test execution, whitespace check execution, repository audit execution, and unit test execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the package contents command and package contents check wording as one contract.

### Phase 133 — Package smoke command metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `npm run package:smoke` command alongside packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, registry smoke, public registry npm exec, release check, MkDocs warning-policy, package contents, release metadata checks, release self-tests, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `package:smoke` command wording is removed from a release-facing policy doc.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now name `package:smoke` as the packed-tarball smoke command rather than only describing the installed-bin and one-shot npm exec paths.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep packed-tarball smoke path details while dropping the `package:smoke` command that verifies them.
- The guard is documentation-only at runtime; existing CLI behavior, package smoke execution, registry smoke execution, release check execution, release metadata execution, release self-test execution, whitespace check execution, repository audit execution, unit test execution, and package contents check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the local package smoke command and its packed-tarball execution paths as one contract.

### Phase 132 — Registry smoke command metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the post-publish `npm run registry:smoke` command alongside public registry npm exec, release check, MkDocs warning-policy, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, package contents, release metadata checks, release self-tests, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `registry:smoke` command wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now names `registry:smoke` inside the release metadata protected phrase set, while README and Distribution docs already retain the post-publish command guidance.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep the public registry npm exec path while dropping the post-publish `registry:smoke` command maintainers are expected to run.
- The guard is documentation-only at runtime; existing CLI behavior, registry smoke execution, release check execution, package smoke execution, release metadata execution, release self-test execution, whitespace check execution, repository audit execution, unit test execution, and package contents check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the post-publish registry smoke command and the public registry install path as one contract.

### Phase 131 — Release check command metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain the `npm run release:check` core gate command alongside MkDocs warning-policy, packed-tarball smoke, installed-bin, one-shot packed-tarball npm exec, public registry, package contents, release metadata checks, release self-tests, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `release:check` command wording is removed from a release-facing policy doc.
- README, Korean README, and `docs/RELEASE-CHECKLIST.md` now explicitly name `release:check` as the core gate rather than only listing the downstream checks it runs.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep downstream gate details while dropping the `release:check` command that maintainers are expected to run.
- The guard is documentation-only at runtime; existing CLI behavior, release check execution, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, whitespace check execution, repository audit execution, unit test execution, and package contents check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the top-level local release command and the checks it orchestrates as one contract.

### Phase 130 — Packed tarball smoke metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain packed-tarball smoke gate guidance alongside installed-bin, one-shot packed-tarball npm exec, public registry, package contents, release metadata checks, release self-tests, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when packed-tarball smoke wording is removed from a release-facing policy doc.
- README, Korean README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now name packed-tarball smoke as the package smoke gate that contains installed-bin and one-shot npm exec paths.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently keep the individual package smoke paths while dropping the packed-tarball smoke gate that runs them.
- The guard is documentation-only at runtime; existing CLI behavior, package smoke execution, registry smoke execution, release metadata execution, release self-test execution, whitespace check execution, repository audit execution, unit test execution, and package contents check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the package smoke gate and its two local packed-tarball execution paths together.

### Phase 129 — Release metadata check guidance guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `npm run release:metadata` / release metadata check guidance alongside package contents, release self-tests, packed-tarball installed-bin, one-shot packed-tarball npm exec, public registry, CLI unit tests, all-eight repository audits, whitespace checks, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when release metadata check wording is removed from a release-facing policy doc.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now name release metadata checks inside the protected release gate set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the release metadata check gate while preserving package, self-test, and smoke guidance.
- The guard is documentation-only at runtime; existing CLI behavior, release metadata execution, package smoke execution, registry smoke execution, release self-test execution, whitespace check execution, repository audit execution, unit test execution, and package contents check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the metadata gate that verifies package/plugin versions, current release notes, roadmap entries, audit counts, and policy-doc wording before release self-tests and package smoke run.

### Phase 128 — Packed tarball installed-bin metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain packed-tarball installed-bin smoke guidance alongside one-shot packed-tarball npm exec, public registry, CLI unit tests, all-eight repository audits, whitespace checks, package contents, release self-tests, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when packed-tarball installed-bin wording is removed from a release-facing policy doc.
- English/Korean Distribution docs and `docs/RELEASE-CHECKLIST.md` now name the installed-bin path as a separately protected package smoke surface.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the installed-bin package smoke path while preserving one-shot npm exec, registry, and lifecycle smoke guidance.
- The guard is documentation-only at runtime; existing CLI behavior, package smoke execution, registry smoke execution, release self-test execution, whitespace check execution, repository audit execution, unit test execution, and package contents check execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve both local packed-tarball smoke execution paths: installed-bin and one-shot `npm exec --package <tarball>`.

### Phase 127 — Release self-test metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `npm run release:self-test` guidance alongside CLI unit tests, all-eight repository audits, whitespace checks, package contents, local packed-tarball, public registry, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when release self-test wording is removed from a release-facing policy doc.
- English Distribution docs and `docs/RELEASE-CHECKLIST.md` now name release self-tests inside the release metadata protected gate set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the release assertion self-test gate while preserving unit test, audit, whitespace, package, and smoke guidance.
- The guard is documentation-only at runtime; existing CLI behavior, release self-test execution, whitespace check execution, repository audit execution, unit test execution, package contents check execution, package smoke execution, and registry smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the release self-test gate as a first-class release contract before package smoke checks run.

### Phase 126 — Whitespace check release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain whitespace check guidance alongside CLI unit tests, all-eight repository audits, package contents, local packed-tarball, public registry, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when whitespace check wording is removed from a release-facing policy doc.
- English Distribution docs and `docs/RELEASE-CHECKLIST.md` now name whitespace checks inside the release metadata protected gate set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the whitespace gate while preserving unit test, audit, package, and smoke guidance.
- The guard is documentation-only at runtime; existing CLI behavior, whitespace check execution, repository audit execution, unit test execution, package contents check execution, package smoke execution, and registry smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the whitespace check gate as a first-class release contract before package contents and smoke checks run.

### Phase 125 — Repository audit gate release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain all-eight repository audit guidance alongside CLI unit tests, package contents, local packed-tarball, public registry, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when repository audit gate wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now names all-eight repository audit guidance inside the release metadata protected phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the repository audit gate while preserving unit test, package, and smoke guidance.
- The guard is documentation-only at runtime; existing CLI behavior, repository audit execution, unit test execution, package contents check execution, package smoke execution, and registry smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the repository audit gate as a first-class release contract before package contents and smoke checks run.

### Phase 124 — CLI unit test release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain CLI unit test guidance alongside package contents, local packed-tarball, public registry, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when CLI unit test wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now names CLI unit test guidance inside the release metadata protected phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the first `release:check` gate while preserving downstream package and smoke guidance.
- The guard is documentation-only at runtime; existing CLI behavior, unit test execution, package contents check execution, package smoke execution, and registry smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the CLI unit test gate as a first-class release contract before package contents and smoke checks run.

### Phase 123 — Package contents release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain package contents check guidance alongside local packed-tarball, public registry, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when package contents wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now names package contents check guidance inside the release metadata protected phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently preserve smoke guidance while dropping the pre-smoke package contents gate that confirms shipped files before release.
- The guard is documentation-only at runtime; existing CLI behavior, package contents check execution, package smoke execution, and registry smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing docs now preserve the package contents gate as a first-class release contract before tarball and registry smoke tests run.

### Phase 122 — Public registry npm exec release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain public registry `npm exec --package @design-ai/cli@<version>` smoke guidance alongside packed-tarball, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when public registry npm exec wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now names the public registry npm exec path inside the release metadata protected phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently preserve local packed-tarball smoke guidance while dropping the post-publish public registry npm exec path.
- The guard is documentation-only at runtime; existing CLI behavior, package smoke execution, and registry smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Post-publish registry smoke guidance now preserves the exact public npm exec package path release operators need to verify after npm publish.

### Phase 121 — Packed tarball npm exec release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain packed-tarball one-shot `npm exec --package <tarball>` smoke guidance alongside installed-bin, version, help, route, prompt/pack, check, audit, doctor, lifecycle, and failure-path guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when one-shot packed-tarball npm exec wording is removed from a release-facing policy doc.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now describe the local packed-tarball installed-bin and `npm exec --package <tarball>` paths separately from public registry `npm exec`.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently imply package smoke only validates the installed bin path while dropping the one-shot npm exec path.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Local tarball smoke guidance now preserves both package execution paths: installed bin and one-shot npm exec.

### Phase 120 — Unknown command failure release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain unknown command/help/list/search-dir failure smoke guidance alongside route-id/option/value suggestions, numeric range failures, and the existing route, check, prompt/pack, audit, doctor, help, list, corpus, and lifecycle guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when unknown command/help/list/search-dir wording is removed from a release-facing policy doc.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now list unknown command/help/list/search-dir failures inside the packed-tarball and registry smoke surfaces.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently narrow failure-path smoke guidance to route-id/option/value and numeric range checks while dropping unknown command, help topic, list domain, and search-dir coverage.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm test`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Failure-path smoke guidance now preserves the same unknown command/help/list/search-dir coverage that package and registry smoke already validate.

### Phase 119 — Human lifecycle release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain human install, human+JSON status, and human uninstall lifecycle smoke guidance alongside their JSON lifecycle phrases and the existing route, check, prompt/pack, audit, doctor, help, list, corpus, and update dry-run guidance.
- `release-metadata.py --self-test` now includes drift fixtures that fail when human install, status, or uninstall wording is removed from a release-facing policy doc while the JSON lifecycle wording remains.
- `docs/RELEASE-CHECKLIST.md` now lists the human lifecycle smoke phrases inside the release metadata protected phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently collapse lifecycle smoke guidance down to JSON-only install/status/uninstall checks.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Human lifecycle smoke guidance is now protected by the same metadata drift guard as the JSON lifecycle checks package and registry smoke already validate.

### Phase 118 — Prompt/pack mode release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain prompt/pack JSON/markdown/from-file/stdin smoke guidance alongside route, check, human version, version JSON, top-level help, help JSON, alias smoke, help topic output, list, corpus discovery, explicit output, suggestion/range failure, prompt/pack output-file, audit, doctor, status, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when prompt/pack mode wording is removed from a release-facing policy doc.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now list prompt/pack JSON/markdown/from-file/stdin inside the packed-tarball and registry smoke surfaces.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for prompt/pack JSON, Markdown, from-file, and stdin output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Prompt/pack mode smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 117 — Route JSON release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain route JSON/catalog/stdin smoke guidance alongside check, human version, version JSON, top-level help, help JSON, alias smoke, help topic output, list, corpus discovery, explicit output, suggestion/range failure, prompt/pack output-file, audit, doctor, status, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when route JSON/catalog/stdin wording is removed from a release-facing policy doc.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now list route JSON/catalog/stdin inside the packed-tarball and registry smoke surfaces.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for route recommendation JSON, route catalog JSON, and route stdin output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Route JSON/catalog/stdin smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 116 — Check command release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain check examples/artifact/stdin/all-routes smoke guidance alongside human version, version JSON, top-level help, help JSON, alias smoke, help topic output, list, corpus discovery, explicit output, suggestion/range failure, prompt/pack output-file, audit, doctor, status, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when check command wording is removed from a release-facing policy doc.
- README, English/Korean Distribution docs, and `docs/RELEASE-CHECKLIST.md` now list check examples/artifact/stdin/all-routes inside the packed-tarball and registry smoke surfaces.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for `design-ai check` examples, artifact, stdin, and all-routes output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Check command smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 115 — Human version release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain human version smoke guidance alongside version JSON, top-level help, help JSON, alias smoke, help topic output, list, corpus discovery, explicit output, suggestion/range failure, prompt/pack output-file, audit, doctor, status, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when human version wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists human version inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for human version output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Human version smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 114 — Top-level help release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain top-level help smoke guidance alongside help JSON, alias smoke, help topic output, list, corpus discovery, explicit output, suggestion/range failure, prompt/pack output-file, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when top-level help wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists top-level help inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for top-level help output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Top-level help smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 113 — Help topic release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain command-specific help topic smoke guidance alongside help JSON, alias smoke, list, corpus discovery, explicit output, suggestion/range failure, prompt/pack output-file, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when command-specific help topic wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists help topic output inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for command-specific help topic output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Command-specific help topic smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 112 — Alias smoke release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain command alias help and functional alias smoke guidance alongside help JSON, list, corpus discovery, explicit output, suggestion/range failure, prompt/pack output-file, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when functional alias wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists alias smoke inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for command aliases and functional aliases.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Alias smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 111 — Prompt and pack output-file release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain prompt/pack forced output-file confirmation smoke guidance alongside suggestion/range failure, explicit output, corpus discovery, list, help, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when file-write confirmation wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists prompt/pack output-file confirmations inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for prompt/pack forced output-file confirmations.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Prompt and pack output-file confirmation smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 110 — Suggestion and numeric range release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain unknown route-id/option/value suggestion and numeric range failure smoke guidance alongside explicit output, corpus discovery, list, help, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when numeric range failure wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists suggestion/range failures inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for suggestion and numeric range failure output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Suggestion and numeric range failure smoke guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 109 — Show lines and route explain release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain explicit `show --lines` and `route --explain` smoke guidance alongside corpus discovery, list, help, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `route --explain` wording is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists `show --lines` / `route --explain` inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for explicit corpus line-range and route explanation output.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Explicit output smoke guidance for `show --lines` and `route --explain` is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 108 — Corpus discovery release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain human/JSON corpus discovery smoke guidance alongside list, help, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when corpus discovery JSON wording is removed from a release-facing policy doc.
- English and Korean README release guidance now explicitly names human/JSON corpus discovery smoke coverage.
- `docs/RELEASE-CHECKLIST.md` now lists corpus discovery JSON inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for `search`, `show`, and `examples` machine-readable discovery flows.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Corpus discovery JSON guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 107 — List JSON release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `list --json` or human/JSON list catalog smoke guidance alongside help, audit, doctor, status, version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when list catalog human/JSON wording is removed from a release-facing policy doc.
- English and Korean README release guidance now explicitly names human/JSON list catalog smoke coverage.
- `docs/RELEASE-CHECKLIST.md` now lists `list --json` inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drop the package and registry smoke contract for list catalog automation.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- List catalog JSON guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 106 — Release metadata phrase table self-test added

#### Changed
- `tools/audit/release-metadata.py` now defines the expected release policy phrase labels separately from the phrase guard table.
- `release-metadata.py --self-test` now verifies phrase guard table label order, label uniqueness, and term-group shape before drift fixtures run.
- The new table-shape fixtures fail closed when a phrase entry is dropped, duplicated, or given an invalid empty term.

#### Impact
- Future edits to `RELEASE_POLICY_PHRASE_CHECKS` cannot silently weaken release policy-doc coverage by losing a guard entry or adding malformed term groups.
- Runtime CLI behavior, release metadata JSON shape, checked policy-doc order, and release-facing documentation requirements remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata can keep using one shared phrase guard table without making the table itself a silent drift risk.

### Phase 105 — Release metadata phrase guard table refactor

#### Changed
- `tools/audit/release-metadata.py` now validates all release policy-doc smoke phrases through `RELEASE_POLICY_PHRASE_CHECKS` and one shared `release_policy_phrase_doc_errors()` helper.
- The refactor preserves the existing structured error strings for MkDocs warning-policy, help JSON, version JSON, install/uninstall JSON, audit strict-quiet, doctor strict, status JSON, and update dry-run drift.
- Existing self-test drift fixtures now exercise the same table-driven path instead of separate phrase-specific helper functions.

#### Impact
- Adding the next release smoke phrase now requires one table entry and one drift fixture instead of a new constant, helper, and validation loop call.
- Runtime CLI behavior, release metadata JSON shape, checked policy-doc order, and release-facing documentation requirements remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata can keep expanding smoke-contract coverage without accumulating repetitive validation helpers.

### Phase 104 — Help JSON release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `design-ai help --json` topic catalog guidance alongside audit, doctor, status, version, install, uninstall, and update dry-run smoke guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `help --json` is removed from a release-facing policy doc.
- English and Korean README release guidance now names the `design-ai help --json` topic catalog explicitly in package and registry smoke descriptions.
- `docs/RELEASE-CHECKLIST.md` now lists `help --json` inside release metadata's protected release smoke phrase set.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drift away from the packaged/registry help JSON topic catalog smoke contract.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Help JSON topic catalog guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 103 — Status JSON release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `status --json` or human+JSON status install-state guidance alongside audit, doctor, version, install, uninstall, and update dry-run smoke guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `status --json` is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists `status --json` inside release metadata's protected release smoke phrase set.
- Release history docs now record Phase 103 as the guard for the existing status JSON package and registry smoke contract.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drift away from the packaged/registry status JSON install-state smoke contract.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Status JSON install-state guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 102 — Doctor strict release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `doctor --strict` human diagnostics guidance alongside audit, version, install, uninstall, and update dry-run smoke guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `doctor --strict` is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now lists `doctor --strict` inside release metadata's protected release smoke phrase set.
- Release history docs now record Phase 102 as the guard for the existing doctor strict package and registry smoke contract.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drift away from the packaged/registry doctor strict diagnostics smoke contract.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Doctor strict release diagnostics guidance is now protected by the same metadata drift guard as the other packaged and registry smoke contracts.

### Phase 101 — Audit strict-quiet release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain human/JSON `audit --strict --quiet` smoke guidance alongside version, install, uninstall, and update dry-run guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `audit --strict --quiet` is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now describes release metadata coverage as release smoke guidance so audit and lifecycle contracts share the same policy surface.
- Release history docs now record Phase 101 as the guard for the existing audit strict-quiet package and registry smoke contract.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drift away from the packaged/registry audit strict-quiet smoke contract.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Audit strict-quiet release smoke guidance is now protected by the same metadata drift guard as the machine-readable and lifecycle contracts.

### Phase 100 — Update dry-run release metadata guard added

#### Changed
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `update --dry-run` lifecycle smoke guidance alongside version, install, and uninstall JSON guidance.
- `release-metadata.py --self-test` now includes a drift fixture that fails when `update --dry-run` is removed from a release-facing policy doc.
- `docs/RELEASE-CHECKLIST.md` now states that release metadata guards lifecycle smoke guidance, including the update dry-run contract.
- Release history docs now record Phase 100 as the follow-up guard for the Phase 99 update dry-run preview.

#### Impact
- README, Release checklist, and English/Korean Distribution docs cannot silently drift away from the packaged/registry update dry-run smoke contract.
- The guard is documentation-only at runtime; existing CLI behavior and package smoke execution remain unchanged.

#### Verified
- All 8 audits pass.
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `python3 -B tools/audit/release-metadata.py --json`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Update dry-run release smoke guidance is now protected by the same metadata drift guard as the other lifecycle machine-readable contracts.

### Phase 99 — Update command dry-run preview added

#### Changed
- `cli/commands/update.mjs` now accepts `--dry-run` and `--dry-run --json` to preview update work before running git pull or install.sh.
- The update dry-run report exposes stable `context`, `plan`, and `result` sections, including git clone detection, install script availability, exact commands that would run, and a `mutating: false` marker.
- `cli/lib/update-command.test.mjs` now covers dry-run parsing, JSON-only rejection, key order, command arrays, localized paths, and readiness state.
- Help output, README, Distribution, and Release checklist docs now advertise `design-ai update [--dry-run] [--json]`.
- Shared package and registry smoke assertions now run both human and JSON dry-run checks before lifecycle install work.

#### Impact
- Contributors can inspect update effects safely before any source pull or reinstall side effect.
- Release automation can validate update readiness from a stable JSON contract instead of parsing human terminal text.
- Existing mutating `design-ai update`, `upgrade`, and `u` behavior remains unchanged.
- `design-ai update --json` without `--dry-run` intentionally fails so mutating update output does not imply a stable JSON lifecycle schema.

#### Verified
- All 8 audits pass.
- `node --test cli/lib/update-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --dry-run`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --dry-run --json`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --json`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `npm test`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run release:metadata`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Update lifecycle verification now has both a safe human preview and a deterministic automation contract before external release smoke runs.

### Phase 98 — Update command option guard added

#### Changed
- `cli/commands/update.mjs` now parses supported flags and rejects unknown options or positional arguments before running git pull or install.sh.
- `cli/lib/update-command.test.mjs` covers `--help`, `-h`, no-arg execution intent, unknown-option suggestions, and unexpected positional arguments.
- Shared package and registry smoke assertions now include `design-ai update --hlep` so packaged CLIs fail closed with a `--help` suggestion.

#### Impact
- A mistyped update command no longer risks starting source update or reinstall work.
- Existing `design-ai update`, `upgrade`, `u`, and help behavior remains unchanged.

#### Verified
- All 8 audits pass.
- `node --test cli/lib/update-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `NO_COLOR=1 node cli/bin/design-ai.mjs update --hlep`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `npm test`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Lifecycle command typos are now consistently caught by the same CLI suggestion and smoke contract before release.

### Phase 97 — Install command JSON lifecycle output added

#### Changed
- `cli/commands/install.mjs` now accepts `--json` and emits source root, Claude home, symlink prefix, and installed skill/agent/command counts as a stable install result.
- `cli/lib/install-command.test.mjs` now asserts install argument parsing, unknown-option suggestions, installed-count parsing, JSON key order, and readable localized paths.
- Help output, package smoke, registry smoke, and shared smoke assertions now cover `design-ai install --json` in addition to the existing human install lifecycle output.
- Release-facing README, Distribution, and Release checklist docs now describe the human install plus JSON `install --json` lifecycle smoke contract.
- `tools/audit/release-metadata.py` now requires release policy docs to retain `install --json` lifecycle guidance.

#### Impact
- Package and registry smoke can verify install lifecycle completion without parsing terminal text.
- Existing human `design-ai install`, `i`, and install.sh symlink behavior remains unchanged.

#### Verified
- All 8 audits pass.
- `node --test cli/lib/install-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm test`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `CLAUDE_HOME=<tmp>/claude DESIGN_AI_PREFIX=smoke-design- NO_COLOR=1 node cli/bin/design-ai.mjs install --json`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Install and uninstall lifecycle checks now both have stable machine-readable outputs for release automation.

### Phase 96 — Uninstall command JSON lifecycle output added

#### Changed
- `cli/commands/uninstall.mjs` now accepts `--json` and emits source root, Claude home, symlink prefix, and removed symlink count as a stable uninstall result.
- `cli/lib/uninstall-command.test.mjs` now asserts uninstall argument parsing, unknown-option suggestions, removed-count parsing, JSON key order, and readable localized paths.
- Help output, package smoke, registry smoke, and shared smoke assertions now cover `design-ai uninstall --json` in addition to the existing human uninstall lifecycle output.
- Release-facing README, Distribution, and Release checklist docs now describe the human uninstall plus JSON `uninstall --json` lifecycle smoke contract.
- `tools/audit/release-metadata.py` now requires release policy docs to retain `uninstall --json` lifecycle guidance.

#### Impact
- Package and registry smoke can verify uninstall lifecycle completion without parsing terminal text.
- Existing human `design-ai uninstall`, `remove`, and `rm` behavior remains unchanged.

#### Verified
- All 8 audits pass.
- `node --test cli/lib/uninstall-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `python3 -B tools/audit/smoke_assertions.py --self-test`
- `python3 -B tools/audit/release-metadata.py --self-test`
- `python3 -B tools/audit/package-smoke.py --self-test`
- `python3 -B tools/audit/registry-smoke.py --self-test`
- `CLAUDE_HOME=<tmp>/claude DESIGN_AI_PREFIX=smoke-design- NO_COLOR=1 node cli/bin/design-ai.mjs uninstall --json`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Install-state and uninstall lifecycle checks now both have stable machine-readable outputs for release automation.

### Phase 95 — README release-smoke version JSON guidance guarded

#### Changed
- `README.md` and `README.ko.md` now document `status [--json]`, `list ... [--json]`, `audit ... [--json]`, and `version [--json]` in the public CLI command summary.
- English and Korean README release guidance now describes human/JSON `design-ai version --json`, human/JSON audit output, and human+JSON status lifecycle smoke checks.
- `tools/audit/release-metadata.py` now requires every release policy doc to retain `version --json` guidance, alongside the existing MkDocs warning-policy guard.
- `release-metadata.py --self-test` now includes a version JSON drift fixture so this release-facing docs contract fails closed.

#### Impact
- Contributors and adopters see the same machine-readable version metadata contract in README, distribution docs, and release checklist.
- Release metadata now catches README or policy-doc drift before tagging.

#### Verified
- `python3 -B tools/audit/release-metadata.py --self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release-facing documentation now stays aligned with the version JSON smoke contract instead of depending on manual README edits.

### Phase 94 — Version command JSON metadata output added

#### Changed
- `cli/commands/version.mjs` now accepts `--json` and emits CLI version, plugin/corpus version, source root, and alignment state as a stable metadata report.
- `cli/commands/version.mjs` now exposes `parseVersionArgs()`, `collectVersionReport()`, and `formatVersionJson()` so version metadata has a testable contract.
- `cli/lib/version-command.test.mjs` now asserts option parsing, unknown-option suggestions, JSON key order, aligned/mismatched version states, and readable localized source paths.
- Package and registry smoke assertions now verify `design-ai version --json` in installed-bin and one-shot npm exec paths.

#### Impact
- Release tooling, package smoke, registry smoke, and external scripts can verify CLI/plugin version alignment without parsing terminal text.
- Existing human `design-ai version`, `design-ai --version`, and `design-ai -v` behavior remains intact.

#### Verified
- `node --test cli/lib/version-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `node cli/bin/design-ai.mjs version --json`
- `npm test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Version alignment becomes a stable automation-facing contract across local, packed-tarball, and registry smoke workflows.

### Phase 93 — Audit command JSON repository gate output added

#### Changed
- `tools/audit/run-all.py` now accepts `--json` and emits repository audit results with context, per-audit entries, and summary counts.
- `cli/commands/audit.mjs` now accepts `--json`, passes it to the shared runner, and suppresses wrapper headers so JSON output stays machine-readable.
- `cli/lib/audit-command.test.mjs` now asserts audit parser behavior, runner-argument forwarding, help handling, and unknown-option suggestions.
- Package and registry smoke assertions now verify `design-ai audit --strict --quiet --json` in addition to the existing human audit smoke.

#### Impact
- CI, release tooling, registry smoke, and external scripts can inspect audit pass/fail state without parsing terminal text.
- Existing human `design-ai audit`, `design-ai a`, `--strict`, and `--quiet` behavior remains intact.

#### Verified
- `python3 tools/audit/run-all.py --self-test`
- `node --test cli/lib/audit-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `node cli/bin/design-ai.mjs audit --strict --quiet --json`
- `npm test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release and CI automation can consume the full eight-audit repository gate through a stable JSON report.

### Phase 92 — Status command JSON install-state output added

#### Changed
- `cli/commands/status.mjs` now accepts `--json` and emits install-state reports for skills, agents, and slash commands.
- `cli/commands/status.mjs` now exposes `parseStatusArgs()`, `collectStatusReport()`, and `formatStatusJson()` so status reporting has a testable data contract.
- `cli/lib/status-command.test.mjs` now asserts option parsing, unknown-option suggestions, top-level status key order, context key order, section key order, sorted entry output, missing-section output, and readable localized paths.
- Package and registry smoke assertions now verify `design-ai status --json` after install and before uninstall.

#### Impact
- Automation can inspect installed design-ai symlink state without parsing human lifecycle output.
- Existing human `design-ai status`, `design-ai s`, and `VERBOSE=1` output behavior remains intact.

#### Verified
- `node --test cli/lib/status-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `npm test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Install lifecycle smoke, registry smoke, and external scripts can validate installed counts and symlink entries through a stable JSON install-state report.

### Phase 91 — List command JSON catalog output added

#### Changed
- `cli/commands/list.mjs` now accepts `--json` for all catalog sections or a filtered `skills`, `commands`, or `agents` section.
- `cli/commands/list.mjs` now exposes `buildListCatalog()` and `formatListJson()` for manifest catalog JSON output.
- `cli/lib/list-command.test.mjs` now asserts argument parsing, JSON round-trip behavior, top-level catalog key order, section key order, manifest item key order, filtered section output, and readable localized catalog text.
- Package and registry smoke assertions now verify `design-ai list <kind> --json` for all three catalog domains.

#### Impact
- Automation can enumerate shipped skills, slash commands, and agents without parsing human terminal output.
- Functional alias `design-ai ls` keeps the existing human behavior, while canonical `design-ai list` now has a stable machine-readable catalog path.

#### Verified
- `node --test cli/lib/list-command.test.mjs cli/lib/help-command.test.mjs cli/lib/dispatch.test.mjs`
- `npm run smoke:assertions:self-test`
- `npm test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Manifest catalog output can be consumed by package smoke, registry smoke, installers, docs, or external automation without depending on terminal formatting.

### Phase 90 — Doctor command JSON formatter guard added

#### Changed
- `cli/lib/doctor.mjs` now exposes `formatDoctorJson()` for `design-ai doctor --json` output.
- `cli/commands/doctor.mjs` now routes diagnostics JSON output through the shared formatter.
- `cli/lib/doctor.test.mjs` now asserts JSON round-trip behavior, top-level diagnostic key order, context/expected/check/summary/fix key order, and readable localized diagnostic text.

#### Impact
- Automation that parses `design-ai doctor --json` can keep relying on stable `context`, `checks`, `summary`, and `fix` payload order.
- Localized diagnostic labels, details, actions, and fix reasons remain readable in machine-readable doctor output.

#### Verified
- `node --test cli/lib/doctor.test.mjs`
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Doctor diagnostics JSON can be refactored without silently changing the automation-facing install-health contract.

### Phase 89 — Help command JSON formatter guard added

#### Changed
- `cli/commands/help.mjs` now exposes `formatHelpJson()` for `design-ai help --json` output.
- `cli/commands/help.mjs` now routes help-topic catalog JSON output through the shared formatter.
- `cli/lib/help-command.test.mjs` now asserts JSON round-trip behavior, top-level catalog key order, topic-entry key order, alias map order, and readable localized help text.

#### Impact
- Automation that uses `design-ai help --json` to discover supported commands and aliases can keep relying on stable `usage`, `topics`, and `aliases` payload order.
- Localized help text remains readable in machine-readable help catalog output.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Help catalog JSON can be refactored without silently changing the automation-facing command discovery contract.

### Phase 88 — Show command JSON formatter guard added

#### Changed
- `cli/lib/show.mjs` now exposes `formatShowJson()` for `design-ai show --json` output.
- `cli/commands/show.mjs` now routes corpus file JSON output through the shared formatter.
- `cli/lib/show.test.mjs` now asserts JSON round-trip behavior, top-level file payload key order, line-entry key order, explicit line-range payload order, readable Korean file text, and non-escaped Unicode output.

#### Impact
- Automation that uses `design-ai show --json` after `design-ai search --json` can keep relying on stable file metadata and line-entry payload order.
- Korean file content remains readable in machine-readable corpus file output.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Corpus file JSON can be refactored without silently changing the automation-facing file display contract.

### Phase 87 — Search command JSON formatter guard added

#### Changed
- `cli/lib/search.mjs` now exposes `formatSearchJson()` for `design-ai search --json` output.
- `cli/commands/search.mjs` now routes corpus search JSON through the shared formatter.
- `cli/lib/search.test.mjs` now asserts JSON round-trip behavior, top-level payload key order, hit-entry key order, empty-result payload order, readable Korean previews, and non-escaped Unicode output.

#### Impact
- Automation that uses `design-ai search --json` to locate source knowledge, examples, commands, or docs can keep relying on stable `query` and `hits` payload order.
- Korean search hits remain readable in machine-readable corpus discovery output.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Corpus search JSON can be refactored without silently changing the automation-facing discovery contract.

### Phase 86 — Examples command JSON formatter guard added

#### Changed
- `cli/lib/examples.mjs` now exposes `formatExamplesJson()` for `design-ai examples --json` output.
- `cli/commands/examples.mjs` now routes worked-example discovery JSON through the shared formatter.
- `cli/lib/examples.test.mjs` now asserts JSON round-trip behavior, top-level payload key order, example-entry key order, route-biased payload order, readable Korean example text, and non-escaped Unicode output.

#### Impact
- Automation that uses `design-ai examples --json` to choose known-good reference artifacts can keep relying on stable `query`, `routeId`, `effectiveQuery`, and `examples` payload order.
- Korean example titles and previews remain readable in machine-readable discovery output.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Worked-example discovery JSON can be refactored without silently changing the automation-facing route reference contract.

### Phase 85 — Pack command JSON formatter guard added

#### Changed
- `cli/lib/pack.mjs` now exposes `formatPackJson()` for `design-ai pack --json` output.
- `cli/commands/pack.mjs` now routes stdout and `--out` prompt-context bundle JSON through the shared formatter.
- `cli/lib/pack.test.mjs` now asserts JSON round-trip behavior, prompt-pack key order, context summary key order, nested prompt-plan key order, file-entry key order, forced-route partial-context payload order, readable Korean briefs, and non-escaped Unicode output.

#### Impact
- Automation that consumes prompt-context bundles can keep relying on a stable top-level payload shape for complete and partial context packs.
- Korean briefs remain readable in machine-readable pack output, including `--out` JSON bundles used for agent orchestration.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Prompt-context bundle JSON can be refactored without silently changing the machine-readable agent context handoff contract.

### Phase 84 — Prompt command JSON formatter guard added

#### Changed
- `cli/lib/prompt.mjs` now exposes `formatPromptJson()` for `design-ai prompt --json` output.
- `cli/commands/prompt.mjs` now routes stdout and `--out` prompt-plan JSON through the shared formatter.
- `cli/lib/prompt.test.mjs` now asserts JSON round-trip behavior, prompt plan key order, nested route key order, forced-route payload order, readable Korean briefs, and non-escaped Unicode output.

#### Impact
- Automation that consumes generated prompt plans can keep relying on a stable top-level payload shape for inferred and forced route workflows.
- Korean briefs remain readable in machine-readable prompt output, including `--out` files used for handoff or agent orchestration.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Prompt-plan JSON can be refactored without silently changing the agent handoff contract for generated prompts.

### Phase 83 — Route command JSON formatter guard added

#### Changed
- `cli/lib/route.mjs` now exposes `formatRouteJson()` for route recommendation and catalog output.
- `cli/commands/route.mjs` now routes `design-ai route --json` and `design-ai route --list --json` through the shared formatter.
- `cli/lib/route.test.mjs` now asserts JSON round-trip behavior, recommendation payload key order, catalog payload key order, readable Korean route keywords, and non-escaped Unicode output.

#### Impact
- Automation that consumes route recommendations can keep relying on the same top-level payload shape for both task-scored routes and catalog listing.
- Korean route keywords remain readable in JSON output, which matters for Korean briefs and downstream agent routing.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Route recommendation JSON can be refactored without silently changing automation-facing route or catalog report contracts.

### Phase 82 — Check command JSON formatter guard added

#### Changed
- `cli/lib/check.mjs` now exposes `formatCheckJson()` for `design-ai check` machine-readable output.
- `cli/commands/check.mjs` now routes artifact and examples `--json` output through the shared formatter.
- `cli/lib/check.test.mjs` now asserts JSON round-trip behavior, artifact report key order, examples report key order, readable Korean messages, and non-escaped Unicode output.

#### Impact
- `design-ai check --json` and `design-ai check --examples ... --json` keep a stable automation-facing shape while the command internals continue to evolve.
- Korean diagnostics or future localized check messages remain readable in JSON output.

#### Verified
- All 8 audits pass.
- `npm test`
- `npm run smoke:assertions:self-test`
- `npm run release:metadata`
- `npm run release:self-test`
- `npm run audit:strict`
- `npm run package:check`
- `npm run package:smoke`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- The CLI quality gate now has an explicit formatter contract for machine-readable artifact and examples reports.

### Phase 81 — Release metadata JSON output formatter guard added

#### Changed
- `tools/audit/release-metadata.py` now formats machine-readable output through `format_json_summary()`.
- `npm run release:metadata:self-test` now asserts JSON round-trip behavior, summary key order, checked-doc indentation/order, and readable Korean structured errors.
- `docs/RELEASE-CHECKLIST.md` now documents the stable JSON summary contract alongside human structured bullet errors.

#### Impact
- `npm run release:metadata -- --json` now has explicit regression coverage for key order, checked docs order, and non-ASCII error readability.
- Automation can keep relying on the same top-level summary shape while Korean release-policy errors remain readable in JSON output.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata now preserves machine-readable JSON and human terminal output through explicit formatter contracts.

### Phase 80 — Release metadata human output formatter guard added

#### Changed
- `tools/audit/release-metadata.py` now formats non-JSON output through `format_human_summary()`.
- `npm run release:metadata:self-test` now asserts the passing summary string and failure bullet-prefix output.
- `docs/RELEASE-CHECKLIST.md` now describes structured bullet errors for release metadata failures.

#### Impact
- Human release metadata output is now covered by the same self-test chain as the structured loader and validation guards.
- Future changes cannot silently remove the failed-output header or bullet-prefixed structured errors.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata now preserves both machine-readable JSON and reviewer-friendly human output as explicit contracts.

### Phase 79 — Release metadata audit-count loader guard added

#### Changed
- `tools/audit/release-metadata.py` now loads the `tools/audit/run-all.py` audit-count source through a structured loader.
- `npm run release:metadata:self-test` now covers valid audit-count parsing, missing `AUDITS` tuple, missing audit script entries, and missing `run-all.py` path fixtures.
- `docs/RELEASE-CHECKLIST.md` and `docs/DOGFOOD-V4-NPM-FINDINGS.md` now document that audit-count source failures produce structured release metadata errors.

#### Impact
- If the audit runner changes shape or disappears, release metadata reports the audit-count source problem instead of raising `SystemExit` before JSON/human output can be produced.
- CHANGELOG and ROADMAP audit-count comparison now only runs when the expected repository audit count is available, avoiding noisy mismatch errors after source-loading failures.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata keeps a complete structured failure surface across manifests, release docs, policy docs, and the audit-count source.

### Phase 78 — Release metadata core input loader guard added

#### Changed
- `tools/audit/release-metadata.py` now reads `package.json`, `.claude-plugin/plugin.json`, `CHANGELOG.md`, and `docs/ROADMAP.md` through structured input loaders.
- `npm run release:metadata:self-test` now covers valid JSON/text fixtures plus missing JSON, invalid JSON, and missing text inputs.
- `docs/RELEASE-CHECKLIST.md` now documents that core release inputs and policy docs both produce structured metadata errors when loading fails.

#### Impact
- Release metadata no longer falls back to Python tracebacks when a core manifest or release doc is missing, unreadable, or invalid JSON.
- JSON and human release metadata output now preserve the same actionable error surface across core inputs and policy-doc inputs.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata stays machine-readable and reviewer-friendly even when its required input files are damaged.

### Phase 77 — Release policy docs loader error guard added

#### Changed
- `tools/audit/release-metadata.py` now loads release policy docs through `load_release_policy_docs()` instead of an inline dict comprehension.
- `npm run release:metadata:self-test` now covers a missing-on-disk policy doc fixture and asserts that the loader reports it without a traceback.
- `docs/RELEASE-CHECKLIST.md` now documents that missing required policy docs are reported as structured release metadata errors.

#### Impact
- If a required release policy doc is deleted or unreadable, maintainers get a release metadata failure that names the affected label and path.
- The Phase 74-76 coverage contract now holds across both in-memory summary validation and the real filesystem loading path.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata failures remain actionable even when the required policy-doc files are missing from disk.

### Phase 76 — Release policy docs deterministic order guard added

#### Changed
- `tools/audit/release-metadata.py` now compares the release policy docs map order against `REQUIRED_RELEASE_POLICY_DOC_LABELS`.
- `npm run release:metadata:self-test` now covers a reordered policy-doc fixture that keeps the same labels but changes the JSON summary order.
- `docs/RELEASE-CHECKLIST.md` now states the exact release policy docs label order guarded by release metadata.

#### Impact
- `release_policy_docs_checked` stays deterministic for automation, reviewers, and release notes.
- Missing/unexpected policy docs still report their direct errors first, while pure ordering drift now fails with a dedicated mismatch message.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release metadata now has a stable, exact policy-doc coverage contract: required labels, no extra labels, and deterministic order.

### Phase 75 — Release policy docs exact set guard added

#### Changed
- `tools/audit/release-metadata.py` now rejects release policy doc labels that are not part of `REQUIRED_RELEASE_POLICY_DOC_LABELS`.
- `npm run release:metadata:self-test` now covers an unexpected `docs/UNTRACKED.md` fixture entering the release policy docs map.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now records that release metadata guards exact policy-doc coverage membership, not only missing entries.

#### Impact
- Maintainers cannot accidentally broaden release metadata coverage with an unreviewed or mistyped policy-doc label.
- The Phase 74 coverage guard is now exact: required docs must be present, and unexpected docs must stay out.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release policy metadata coverage is now fail-closed for exact document membership and policy wording.

### Phase 74 — Release policy docs coverage set guard added

#### Changed
- `tools/audit/release-metadata.py` now keeps the required release policy docs in `REQUIRED_RELEASE_POLICY_DOC_LABELS` and derives path checks from that set.
- `npm run release:metadata:self-test` now fails if a required release policy doc, such as `README.ko.md`, drops out of the checked set.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now records that release metadata guards both policy content and policy coverage membership.

#### Impact
- Maintainers cannot accidentally remove a release-facing policy doc from metadata coverage without a failing release metadata check.
- The broader Phase 72/73 guard now protects both the checked docs' contents and the checked docs list itself.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release policy metadata coverage is now fail-closed for both document membership and policy wording.

### Phase 73 — Release policy docs ci:local command guard added

#### Changed
- `tools/audit/release-metadata.py` now requires release-facing MkDocs warning-policy docs to keep a `ci:local` command reference.
- `npm run release:metadata:self-test` now covers a README command-drift failure where `npm run ci:local` is accidentally replaced by `npm run release:check`.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now documents command-reference drift coverage alongside warning-policy baseline coverage.

#### Impact
- Pre-push docs can no longer preserve the warning-policy wording while losing the actual command maintainers need to run before Real-CI.
- README, release checklist, and Distribution docs remain aligned on both the policy and the executable command.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Release policy docs keep the command-level handoff intact, not only the warning-policy prose.

### Phase 72 — Release policy docs metadata coverage expanded

#### Changed
- `tools/audit/release-metadata.py` now checks all release-facing MkDocs warning-policy docs: `README.md`, `README.ko.md`, `docs/RELEASE-CHECKLIST.md`, `docs/DISTRIBUTION.md`, and `docs/DISTRIBUTION.ko.md`.
- `npm run release:metadata -- --json` now reports the full `release_policy_docs_checked` list.
- `docs/RELEASE-CHECKLIST.md` and `docs/DOGFOOD-V4-NPM-FINDINGS.md` now describe the broader release policy docs coverage.

#### Impact
- README-level pre-push guidance and the canonical release checklist can no longer drift away from the Distribution docs without failing release metadata validation.
- The warning-policy baseline guard now protects the docs maintainers are most likely to read before running Real-CI.

#### Verified
- All 8 audits pass.
- `npm run release:metadata:self-test`
- `npm run release:metadata -- --json`
- `npm run release:metadata`
- `npm run release:self-test`
- `python3 -B tools/audit/local-ci.py --docs-only`
- `npm run ci:local -- --skip-release-check --skip-vscode --skip-docs`
- `npm run package:check`
- `git diff --check`

#### Versions
- `package.json` + `.claude-plugin/plugin.json`: remains 4.13.0.

#### What this enables
- Pre-push and release guidance stay consistent across entry docs, checklist docs, and distribution docs.

### Phase 71 — Release metadata bilingual phrase guard hardened

#### Changed
- `tools/audit/release-metadata.py` now accepts both English and Korean equivalents for the MkDocs warning-policy, refs-only warning, non-`refs/` warning, and accepted baseline phrase groups.
- `npm run release:metadata:self-test` now proves a Korean `MkDocs 경고 정책` / `기준선` fixture passes the distribution policy guard.
- `docs/DOGFOOD-V4-NPM-FINDINGS.md` now documents that release metadata covers bilingual distribution warning-policy drift.

#### Impact
- Korean release docs can use natural Korean terms without weakening the executable release metadata guard.
- The policy check remains strict about meaning while avoiding unnecessary failures caused by English-only phrase matching.

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
- Bilingual release docs can stay idiomatic while still being guarded by automated release metadata validation.

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
