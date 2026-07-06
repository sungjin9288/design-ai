# Dogfood findings — Agent SDK end-to-end flow (Phase 764)

A real design task driven entirely through the Agent SDK (`@design-ai/cli/sdk`, shipped v4.59.0–v4.61.0), per the accepted composed slice in [NEXT-SURFACE-DECISION.md](NEXT-SURFACE-DECISION.md): SDK adoption evidence and a dogfood pass in one run.

**Scope of this dogfood**: the full consumer flow `route(brief)` → `pack(brief, { withRecall })` → author the artifact → `check(artifact, { routeId })` → `learn.captureFromCheck(artifact, { routeId })`, on a genuine brief, with the learning write isolated to a temp profile via `DESIGN_AI_LEARNING_FILE`.

**The brief** (deliberately chosen from a suspected corpus gap): 커뮤니티 앱의 게시물 신고 및 사용자 차단 플로우 설계 — 신고 사유 선택, 처리 상태 안내, 차단 후 상호작용 차단 범위.

## What worked

### 1. The SDK flow itself: zero friction

Every step worked first-try in a plain Node ESM script — no CLI shell-out, no MCP server, no docs consultation beyond `docs/SDK.md`:

- `route(brief, { limit: 3, explain: true })` returned scored routes with `relatedKnowledge`.
- `pack(brief, { withRecall: true, recallLimit: 5, maxBytes: 60000 })` returned a bounded 15-file context bundle (60,000 bytes exactly at budget) with the plan, checklist, and recall block.
- `check(artifact, { routeId })` returned `warn 9/10` with a precise per-result breakdown.
- `learn.captureFromCheck(artifact, { routeId })` captured the single non-pass result into the temp profile (`added 1, skipped 0`) and wrote nothing anywhere else.
- `DESIGN_AI_LEARNING_FILE` isolation behaved exactly as documented — the real user profile was untouched.

This is the adoption story: the flow a hosted agent would run is four function calls. It is recorded as the basis for the Agent SDK walkthrough.

### 2. The eval/check loop caught the routing mismatch on its own

The one `warn` (`route-design-from-brief-design-system-foundation`) is not noise — it is the check system correctly reporting that a flow-design artifact lacks design-system-foundation evidence, which is exactly what finding 1 below predicts: the brief should never have landed on `design-from-brief` in the first place.

## Findings

### F-1. Route-table gap: flow/feature-design briefs fall through to the wrong route

`route()` scored the report/block brief `[low] score=1`, matching only the keyword `앱`, and fell back to `design-from-brief` — whose command, skills (`color-palette`, `design-system-builder`, `handoff-spec`), checklist ("Produce foundations, tokens, component baseline"), and check requirements all target a **from-scratch design-system brief**, not a **feature-flow spec**. There is no route for interaction/flow design (신고, 차단, 온보딩, 결제 플로우류) — a very common real-task class. The mismatch propagated end-to-end: wrong skills in the pack, wrong checklist, and a guaranteed check warn.

**Proposed fix**: a `flow-design` (or `feature-flow`) route with keywords for common flows (신고/차단/온보딩/가입/결제/설정/알림, report/block/onboarding/signup/checkout/settings), curated knowledge (`ui-reasoning`, `async-control`, forms/patterns), and route-specific check requirements suited to flow specs (states, edge cases, error paths) rather than token foundations.

_Done (2026-07-06): `flow-design` route added to `cli/lib/route.mjs` (`command: null`, mirroring `handoff-spec`/`design-system-qa`), with skills `ux-audit` + `design-critique`, agent `a11y-reviewer`, and curated knowledge `ui-reasoning`, `async-control`, `trust-safety-moderation` (F-3), `form-design`, `error-states`, `onboarding`. Keywords use compound Korean/English terms (`결제 플로우`, `설정 화면`, `알림 설정`, `report flow`, `signup flow`, `moderation flow`, …) chosen to avoid stealing bare terms already owned by other routes (`앱`/`서비스`/`프로덕트`/`app`/`product` → `design-from-brief`; `component`/`form` → `component-spec`). Re-ran the dogfood brief: `route()` now returns `[high] flow-design score=4` (matched `플로우`, `신고`, `차단`, `처리 상태`), with `design-from-brief` still present at `[low] score=1` (matched `앱`) as a secondary candidate — up from the prior single `[low] design-from-brief score=1` result. Added `ROUTE_REQUIREMENTS["flow-design"]` to `cli/lib/check.mjs` (states/steps, edge/error paths, entry/exit/completion — bilingual patterns mirroring house style); the Walkthrough 3 sample artifact now scores `warn 8/12` against `--route flow-design` (3 route-specific warns, as expected for a short sample), matching the walkthrough doc's existing "mostly-pass" framing. Added `examples/flow-design-report-block.md`, an expanded version of the dogfooded artifact that satisfies every example-qa bar (12/12) and is now the top-ranked example for the route. Updated the `EXPECTED_ROUTE_CATALOG_IDS` tuple in `tools/audit/smoke_assertions.py` (the single source both `package-smoke.py` and `registry-smoke.py` import from) and both README example-count badges (221 → 222, matching `check-coverage.py`'s top-level-only `examples/*.md` count — the new file lives at `examples/flow-design-report-block.md`, not under `examples/cases/`). `knowledge/COVERAGE.md` was left to its normal regeneration via `tools/audit/check-coverage.py` (not hand-edited), matching the F-3 precedent. Incidental fix: this route's 15-file pack combination exposed a pre-existing off-by-a-few-bytes bug in `cli/lib/pack.mjs`'s `takeUtf8` — truncating mid-UTF-8-character let `Buffer.toString("utf8")` insert a 3-byte U+FFFD replacement character that could be larger than the partial bytes it replaced, letting `usedBytes` exceed `maxBytes` by 1-2 bytes on multi-file packs with tight budgets; fixed by trimming to the last complete UTF-8 character boundary before decoding (`trimIncompleteUtf8Tail`), verified against ASCII, Korean (1/2/3-byte-cut), and 4-byte emoji boundary cases. Full suite green (585 tests), all 8 audits, release-metadata, package-smoke, registry-smoke self-test, and ci:local pass. Route eval: default `--eval-template` checkpoint (6 cases) still `pass 6/6` under `--eval --strict`; four other representative briefs (design-review, website-improvement, component-spec, palette-from-brand, design-system-qa, motion-design eval checkpoints) all still resolve to their prior top route unchanged._

### F-2. Recall pollution: repo-meta docs outrank design knowledge

For this brief, `relatedKnowledge` surfaced `pricing-page-design` (37.0), `korean-document-style` (22.8), `dashboard-composition` (10.8) — none relevant — and the pack's recall block selected `docs/case-study.md` (49.1, the **top** hit), `docs/project-card.md` (30.8), `docs/interview-story.md` (30.4), and `docs/integrations/codex-walkthrough.ko.md` (30.2). Those are repo-meta documents (portfolio/case-study material, integration walkthroughs), not design knowledge; three of the four are even excluded from the npm package by the `files` field. The v4.58 generated-index exclusion (`COVERAGE.md`, `INDEX.md`, `docs/reference/*`) does not cover them.

**Proposed fix**: extend the recall exclusion list from "generated index files" to a "non-knowledge docs" set — at minimum the package-excluded meta docs (`docs/case-study.md`, `docs/project-card.md`, `docs/interview-story.md`, `docs/resume-bullets.md`, …) and `docs/integrations/*` walkthroughs — for recall-injection surfaces only (raw `search` stays unfiltered, same boundary as v4.58).

_Done (2026-07-06): `isRecallExcludedDoc(relPath)` added in `cli/lib/search-ranked.mjs`, extending `isGeneratedIndexDoc` with the package-excluded repo-meta docs (the exact `!docs/*.md` set from `package.json` `files`: case-study, evidence-checklist, evidence-gallery, implementation-evidence, interview-story, project-card, project-roadmap, readme-improvement, resume-bullets) and the `docs/integrations/` prefix. `rankedSearchCorpus`'s opt-in filter option was renamed `excludeGeneratedIndex` → `excludeNonKnowledge` (only 3 internal call sites + tests referenced the old name) and now applies the broader predicate; `cli/lib/recall.mjs` (both call sites) and `cli/lib/route.mjs`'s `relatedKnowledgeFor` pass it unchanged. Re-ran the dogfood brief through the SDK: `recall()`'s `corpus.selected` and `route --explain`'s `relatedKnowledge` no longer surface `docs/case-study.md` / `docs/project-card.md` / `docs/interview-story.md` / `docs/integrations/codex-walkthrough.ko.md` — those slots are now filled by real corpus knowledge. Raw `search --ranked` is unaffected (verified unfiltered). Full suite green (585 tests), all 8 audits, release-metadata, package-smoke, registry-smoke self-test, and ci:local pass._

_Follow-up F-2b (2026-07-06): the enumerated meta-doc list proved to be whack-a-mole — the post-fix probe surfaced `docs/DOGFOOD-SDK-FINDINGS.md` itself as the new top recall hit (141.2, ~3× the best knowledge score) because this document quotes the brief's vocabulary, with `docs/inspection-*.md` and `docs/announcements/*` next in line. Resolved by the principled rule: `isRecallExcludedDoc` now excludes **everything under `docs/`** (recall injects design knowledge; the design corpus is `knowledge/`, `examples/`, `skills/`, `agents/`, `commands/` — `docs/` is product documentation). The per-file meta list was removed as dead code. Raw `search`/`search --ranked` still returns `docs/` hits unfiltered. Post-change probe: `recall()` top hit for the dogfood brief is `knowledge/patterns/trust-safety-moderation.md` (the F-3 file), with zero `docs/` entries._

### F-3. Corpus gap: no trust & safety / moderation UX knowledge

Nothing in `knowledge/` covers report/block/moderation patterns: 신고 사유 분류 설계, 처리 상태 커뮤니케이션(접수→검토→조치), 차단 의미론(양방향 범위, 비통지 원칙), 신고 남용 방지, and the Korean regulatory angle (정보통신망법 제44조의2 임시조치 30일, KCSC 처리 관행). For a product with Korean community/social apps in scope, this is a real gap — the artifact had to be authored from general principles alone.

**Proposed fix**: `knowledge/patterns/trust-safety-moderation.md` (hand-written), covering the above plus accessibility specifics for report sheets/status badges; pairs naturally with the F-1 flow route's curated knowledge.

## Verdict

- **SDK**: walkthrough-ready as-is; no API changes needed. The flow is the walkthrough.
- **Backlog generated (evidence-backed, in priority order)**: F-2 recall exclusion (small, mirrors the shipped v4.58 exclusion mechanism), F-3 trust-safety knowledge file (corpus), F-1 flow-design route (route table + check requirements + smoke surface updates).
