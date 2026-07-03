# Next surface decision

> Status: proposed — awaiting maintainer sign-off
> Date: 2026-07-03

This record answers option 3 of the "Recommended next decision" in [`PRODUCT-READINESS.md`](PRODUCT-READINESS.md): if the goal is "best design tool" as a broader product, which surface do we deepen next — CLI, VS Code extension, web UI, Figma plugin, or agent SDK?

## Context and decision drivers

### Who uses design-ai today

design-ai is a model-agnostic design knowledge corpus plus a deterministic, zero-dependency Node.js CLI. Its primary consumer is an **AI coding agent** (Claude Code, Codex, Cursor, Aider) that picks up the repo and behaves like a senior product designer for a session. The human is present but works *through* the agent — routing briefs, packing prompts, checking artifacts, running the Website Improvement handoff flow. Secondary consumers are maintainers who run the CLI directly and adopters who install via npm/Homebrew.

### What is already shipped

Per [`external-status.md`](external-status.md) (checked 2026-07-02):

- **CLI** — `@design-ai/cli@4.56.0` on npm, GitHub Release `v4.56.0`, Homebrew tap. This is the mature surface: route/prompt/pack/check/search/show/examples, plus `site` (Website Console), `learn`, and `workspace`.
- **MCP server** — public `design-ai-mcp` entrypoint, 10 tools, connected to Claude Code and Codex. This is the agent-facing distribution channel and it already works.
- **VS Code extension** — `sungjin.design-ai-vscode@0.4.1` on the Marketplace: sidebar trees + quick-pick commands over the corpus.
- **Web console** — the zero-dependency static web console under [`website-console/`](website-console/) for the website-improvement workflow (workflow graph, browser-local handoff evidence tracking).
- **Docs** — GitHub Pages (MkDocs).

The important framing: none of the five candidates is greenfield. Each is a *deepening* of something that already ships in thin form.

### Maintenance constraints

- **Single maintainer.** Build cost and ongoing maintenance cost dominate. A surface that needs continuous platform-review babysitting (store submissions, plugin re-approvals) is expensive out of proportion to its code.
- **Zero-dependency stance.** The CLI and web console ship with no runtime dependencies. Any surface that forces a framework/toolchain (React build, Figma plugin bundler) breaks that stance and adds supply-chain surface.
- **Deterministic architecture.** The product is deterministic corpus routing, prompt packing, and quality checking — not model inference. Surfaces that imply "smart UI" set an expectation the architecture deliberately does not meet.
- **Korean-market focus.** Load-bearing value in the dogfood runs came from Korean i18n knowledge (see [`DOGFOOD-FINDINGS.md`](DOGFOOD-FINDINGS.md), [`DOGFOOD-V4-FINDINGS.md`](DOGFOOD-V4-FINDINGS.md)). Any surface should keep that differentiator front and center, not dilute it into a generic tool.

### Synergy driver

A sibling doc, `AI-LEARNING-PHASE2.md`, is being authored in parallel to open an AI-learning retrieval phase (retrieval memory over the corpus and local learning signals). Whichever surface we deepen should compound with that phase rather than fork effort away from it.

## Evaluation criteria

Each surface is scored 1–5 on:

- **Leverage** — reuse of existing assets (corpus, CLI lib, MCP tools, web console).
- **Reach** — user value and how many of today's users it serves.
- **Build cost** — 1 = expensive, 5 = cheap (higher is better).
- **Maintenance** — ongoing burden for one maintainer; 1 = heavy, 5 = light.
- **Distribution** — discovery and install friction; 5 = frictionless.
- **Risk** — platform dependency and review-process exposure; 5 = low risk.
- **Learning synergy** — compounding with the AI-learning retrieval phase.

## Scoring table

| Criterion | CLI deepening | VS Code deepening | Web UI | Figma plugin | Agent SDK |
|---|---|---|---|---|---|
| Leverage | 5 | 4 | 4 | 2 | 5 |
| Reach | 4 | 3 | 3 | 2 | 4 |
| Build cost | 5 | 3 | 3 | 2 | 4 |
| Maintenance | 5 | 3 | 4 | 1 | 4 |
| Distribution | 5 | 4 | 3 | 3 | 4 |
| Risk | 5 | 3 | 4 | 1 | 4 |
| Learning synergy | 5 | 3 | 3 | 2 | 5 |
| **Total** | **34** | **23** | **24** | **13** | **30** |

## Per-surface analysis

### 1. CLI deepening

**Scores.** Leverage 5: every command already routes through the shared `cli/lib` surface and the MCP server wraps the same functions, so a CLI capability is instantly an MCP capability. Reach 4: serves the primary agent user and the maintainer directly. Build cost 5 and maintenance 5: no toolchain, no store, `npm run audit` (8/8) plus the packed-tarball and registry smokes already gate every change. Distribution 5: publish is a solved, provenance-signed path. Risk 5: no platform dependency. Learning synergy 5: retrieval memory is naturally exposed as new `learn`/`route`/`pack` flags and reused verbatim by MCP.

**90-day slice.** Land the AI-learning retrieval flow as CLI verbs (`learn --recall`, `pack --with-recall`), close the concrete corpus gaps the dogfoods named — money-aware patterns, mobile navigation, list/feed, React Native, Korean payments (from [`DOGFOOD-FINDINGS.md`](DOGFOOD-FINDINGS.md)) — and add the async-control and Korean-density knowledge from [`DOGFOOD-V4-FINDINGS.md`](DOGFOOD-V4-FINDINGS.md). Each ships behind existing gates and flows to MCP for free.

**Evidence.** The v4 dogfood explicitly credits the single `npm run audit` runner and the CLI corpus for a 3–5x speedup on Form/Dialog/List work; the friction it surfaced was *missing corpus and flags*, not a missing surface.

### 2. VS Code extension deepening

**Scores.** Leverage 4: reuses the corpus and search logic but the `vscode` API layer is its own code. Reach 3: serves humans who browse the corpus, not the agent that is the primary consumer. Build cost 3 and maintenance 3: TypeScript toolchain, and [`DOGFOOD-V4-VSCODE-FINDINGS.md`](DOGFOOD-V4-VSCODE-FINDINGS.md) shows the untested `vscode` API surface (quick-pick rendering, config propagation, tree refresh) still needs `@vscode/test-electron` plus a CI matrix. Distribution 4: Marketplace publish already works at 0.4.1. Risk 3: Marketplace review and API churn. Learning synergy 3: a webview could show recall results but that is net-new UI.

**90-day slice.** Add a webview that renders the Website Console workflow graph inside the editor and surfaces `check` results inline; add the deferred headless integration tests. Real value, but it targets the human-browsing path while the agent path (MCP) is where the product is consumed.

**Evidence.** The VS Code dogfood is honest that pure logic is 100% extracted and tested, but "actual UI rendering inside VS Code" and "config change handling under real load" are explicitly *not* validated — deepening here means first paying down that test debt.

### 3. Web UI (expand the website console)

**Scores.** Leverage 4: the static console already exists and is zero-dependency. Reach 3: good for the website-improvement workflow specifically, narrower for the rest of the corpus. Build cost 3 and maintenance 4: staying zero-dependency keeps it cheap, but broadening beyond the console's single workflow is real design work. Distribution 3: a static site needs hosting and discovery it doesn't have yet. Risk 4: low platform risk if it stays static. Learning synergy 3: could visualize recall, but as new UI.

**90-day slice.** Generalize [`website-console/`](website-console/) from one workflow into a small corpus browser + prompt-pack builder that runs fully client-side against exported JSON. Attractive, but it risks re-implementing the CLI's routing/packing in a second language and diverging from it.

**Evidence.** The console is the one shipped web asset and it is deliberately scoped to website-improvement; there is no dogfood evidence of demand for a broader web surface, whereas corpus and flag gaps are documented repeatedly.

### 4. Figma plugin

**Scores.** Leverage 2: the [`FIGMA-INTEGRATION.md`](FIGMA-INTEGRATION.md) bridge is token export/import, not a live plugin, so most plugin code is new. Reach 2: serves designers who are not today's primary agent user. Build cost 2, maintenance 1, risk 1: a Figma plugin means a bundler (breaking the zero-dependency stance), the Figma plugin-review process, and API churn maintained by one person. Distribution 3 and synergy 2 do not offset that.

**90-day slice.** A plugin that pushes generated tokens into Figma Variables and pulls selection context back. High desirability, but the worst fit for the constraints: new toolchain, external review gate, and a maintenance tail that competes directly with the learning phase.

**Evidence.** Nothing in the dogfood record points to Figma-plugin friction; the shipped Figma story is file-based token sync, which the CLI already serves.

### 5. Agent SDK (programmatic library surface)

**Scores.** Leverage 5: an SDK is a thin, documented wrapper over the exact `cli/lib` functions the MCP server already calls — near-zero new logic. Reach 4: lets other tools and agents embed design-ai's routing/packing/checking without shelling out to the CLI, extending the primary agent-consumer story. Build cost 4 and maintenance 4: mostly surface stabilization and typing over existing code, gated by the same smokes; the ongoing cost is API stability, not a platform. Distribution 4: ships in the same npm package. Risk 4: the only real risk is committing to a public API contract. Learning synergy 5: the retrieval phase is consumed programmatically day one.

**90-day slice.** Extract and document a stable `@design-ai/cli` programmatic entry (`route()`, `pack()`, `check()`, `recall()`) mirroring the MCP tool set, with typed inputs/outputs and smoke coverage. This is the second-best fit and a natural follow-on to CLI deepening — but committing to a public API contract before the retrieval phase settles risks freezing an interface we will want to change.

**Evidence.** The MCP server already proves these functions are cleanly separable from I/O; an SDK formalizes what MCP consumes internally.

## Recommendation

**Deepen the CLI (option 1), and treat the Agent SDK (option 5) as the fast follow once the AI-learning retrieval phase stabilizes.**

Rationale: the CLI is the one surface where every constraint points the same direction — highest leverage (it is also the MCP surface, so one change serves both the human and the agent consumer), lowest build and maintenance cost, no platform-review risk, and the cleanest synergy with `AI-LEARNING-PHASE2.md`, whose retrieval verbs land as CLI flags and flow to MCP for free. The dogfood record is consistent that the friction today is *missing corpus and missing flags*, not a missing GUI. Deepening the CLI directly retires that friction while keeping the zero-dependency, deterministic, Korean-focused posture intact.

## What we defer, and when to revisit

- **Agent SDK** — deferred only until the retrieval API stabilizes (target: after the first `AI-LEARNING-PHASE2.md` milestone lands in the CLI). Revisit trigger: the CLI recall interface has been stable across two releases, or an external adopter asks to embed design-ai programmatically.
- **VS Code deepening** — deferred pending demand and test-debt paydown. Revisit trigger: adopter reports of the extension being the primary entry point, or the headless `@vscode/test-electron` suite is in place.
- **Web UI** — deferred beyond the current website-console scope. Revisit trigger: repeated requests for a no-install, browser-only corpus experience, or a non-agent audience becomes a real segment.
- **Figma plugin** — deferred longest. Revisit trigger: file-based token sync is demonstrably insufficient and a designer audience (not the agent) becomes a primary user, justifying the toolchain and review-process cost.

Cross-check any surface work against the release gate: `npm run audit` (8/8, link resolution included) and `npm run release:metadata` before touching README/DISTRIBUTION-class docs.

## Decision record

- **Status:** proposed — awaiting maintainer sign-off
- **Date:** 2026-07-03
- **Deciders:** maintainer
- **Supersedes:** none
- **Related:** [`PRODUCT-READINESS.md`](PRODUCT-READINESS.md), [`external-status.md`](external-status.md), `AI-LEARNING-PHASE2.md`
