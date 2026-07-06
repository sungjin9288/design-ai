# Dogfood findings — dashboard/data-screen class (Phase 766)

Second dogfood pass, run immediately after the v4.62.0 dogfood-loop release to (a) verify the v4.62 fixes hold on fresh briefs and (b) probe a different task class. Method identical to [DOGFOOD-SDK-FINDINGS.md](DOGFOOD-SDK-FINDINGS.md): the full SDK flow (`route` → `pack --withRecall` → author → `check` → `learn.captureFromCheck`, temp-profile isolated), preceded by a cheap three-brief routing/recall probe to pick the weakest class.

**Probe briefs** (three distinct classes): 정산 대시보드 (settlement dashboard), B2B 온보딩 위저드 (onboarding wizard), 빈 상태·에러 상태 설계 (empty/error states). The settlement dashboard scored worst and became the full run's brief.

## v4.62 regression evidence (all three fixes verified live)

- **`flow-design` route works**: the onboarding-wizard probe routed to `flow-design` (was impossible before v4.62). Confidence was only `[low] score=1` — see G-2.
- **Recall purity holds**: every probe's recall selections were 100% design corpus (`knowledge/`, `examples/`) — zero `docs/` entries, where the round-1 probes had repo-meta docs at #1.
- **`pack` byte-budget guarantee holds**: the 60,000-byte pack used 59,998 bytes — the character-boundary trim landing 2 bytes under budget instead of the pre-fix "fill exactly and sometimes overflow".

## The full run (settlement dashboard)

**Brief**: 커머스 셀러용 정산 대시보드 설계 — 일별 매출·수수료·정산 예정 금액 표, 기간 필터, 엑셀 내보내기, 미정산 알림.

- `route()`: `[low] design-from-brief score=0, matched=[]` — **zero keyword hits**, pure fallback. Worse than round 1's report/block brief (score=1).
- `pack()`: the fallback route curates design-system skills (`color-palette`, `design-system-builder`) and foundation knowledge; `dashboard-composition.md` reached the pack only through the recall block, and `money-and-amount.md` / `korean-density-conventions.md` not at all — despite `relatedKnowledge` correctly surfacing dashboard-composition (27) and money-and-amount (13). The knowledge exists; no route curates it.
- `check(artifact, { routeId: "design-from-brief" })`: `warn 9/10`, the single warn again being `route-design-from-brief-design-system-foundation` — the same route-mismatch fingerprint as round 1, on a different class.
- `learn.captureFromCheck`: `added 1, skipped 0` into the temp profile; real profile untouched.

## Findings

### G-1. Route-table gap: data-dense screen briefs (dashboard/admin/back-office) have no route

The dashboard class — 정산·매출·지표·어드민·백오피스 screens, arguably the single most common Korean B2B design task — falls through with **zero** keyword matches, landing on design-system scaffolding skills. The curated knowledge for this class already exists and is strong: `patterns/dashboard-composition.md`, `patterns/money-and-amount.md`, `i18n/korean-density-conventions.md`, `patterns/list-and-feed.md`, plus layout/typography foundations.

**Proposed fix**: a `dashboard-design` route (`command: null`, like `flow-design`): keywords 대시보드, 정산, 매출 화면, 지표, KPI, 어드민, 백오피스, 데이터 테이블, dashboard, admin, back-office, analytics, KPI, data table; curated knowledge as above; check requirements suited to data screens (금액/단위 표기 evidence, 테이블 접근성, 밀도/반응형 강등 전략); a worked example adapted from this run's artifact (example-qa gate).

_Done (2026-07-06): `dashboard-design` route added to `cli/lib/route.mjs` (`command: null`, mirroring `flow-design`/`handoff-spec`), with skills `design-critique` + `handoff-spec`, agent `a11y-reviewer`, and curated knowledge `dashboard-composition.md`, `money-and-amount.md`, `korean-density-conventions.md`, `list-and-feed.md`, `spacing-and-grid.md`, `type-scale-fundamentals.md`. Keywords: 대시보드, 정산, 매출 화면, 지표, 어드민, 백오피스, 데이터 테이블, 정산 내역, KPI, dashboard, admin panel, back-office, back office, analytics screen, data table — compound where a bare term would hijack another route (`테이블` bare stays owned by `component-spec`; `데이터` bare is never used alone). Re-ran the dogfood brief: `route()` now returns `[medium] dashboard-design score=2` (matched `대시보드`, `정산`) — up from the prior `[low] design-from-brief score=0, matched=[]` zero-hit fallback. Added `ROUTE_REQUIREMENTS["dashboard-design"]` to `cli/lib/check.mjs` (money/number-format evidence, table accessibility incl. `aria-sort`, density/responsive degradation — bilingual patterns mirroring house style); checking the dogfooded settlement artifact directly against `--route dashboard-design` scores `pass 12/12` (all 9 base checks plus all 3 new route-specific requirements). Added `examples/dashboard-design-settlement.md`, an expanded version of the dogfooded artifact (explicit `<caption>`/`scope="col"`/`aria-sort` table markup, 4.5:1 contrast ratio, export-failure and empty-result edge cases) that satisfies every example-qa bar (12/12) and is the top-ranked example for the route (canonical-boosted score 42 vs. next-best 24). Wired into `cli/lib/examples.mjs` (`ROUTE_EXAMPLE_QUERIES` + `CANONICAL_ROUTE_EXAMPLES`) and `examples/README.md`. Appended `dashboard-design` to the `EXPECTED_ROUTE_CATALOG_IDS` tuple in `tools/audit/smoke_assertions.py` (shared by `package-smoke.py` and `registry-smoke.py`) and bumped both README example-count badges (222 → 223, matching `check-coverage.py`'s top-level-only `examples/*.md` count). `knowledge/COVERAGE.md` was left to its normal regeneration via `tools/audit/check-coverage.py`, matching the F-1 precedent. `example-qa` now reports `21/21 routes and 21/21 examples pass` (was 20/20)._

### G-2. `flow-design` keyword gaps: Korean wizard/step vocabulary missing

The onboarding-wizard probe — unambiguously a flow brief — matched only `온보딩` (`score=1 [low]`). 위저드, 단계(별), 이어하기 and similar step-flow Korean vocabulary are absent from the v4.62 keyword set (English `wizard`/`stepper` made it in; the Korean forms didn't).

**Proposed fix**: additive keywords on `flow-design` (위저드, 단계별 플로우, 스텝, 이어하기, 팀 초대 …), gated by the route eval checkpoint and the round-1 brief still scoring `[high]`.

_Done (2026-07-06): added 위저드, 단계별 플로우, 스텝, 이어하기 to `flow-design`'s keyword list in `cli/lib/route.mjs` (additive; existing `wizard`/`stepper` English forms kept as-is). Checked all other routes' keyword lists for collisions first — no hits. Re-ran the onboarding-wizard probe brief: `route()` now returns `[medium] flow-design score=3` (matched `온보딩`, `위저드`, `이어하기`) — up from the prior `[low] flow-design score=1` (matched `온보딩` only). Gate held: the round-1 report/block brief still scores `[high] flow-design score=4` (matched `플로우`, `신고`, `차단`, `처리 상태`), unchanged. Route eval checkpoint (`--eval --strict`, 6 cases) stays `pass 6/6`._

### G-3. Reverse hijack: `빈 상태` belongs to the illustration route, so states-design briefs misroute

The empty/error-states probe routed `[low] illustration score=1` via `빈 상태` (an empty-state-*illustration* keyword), tied with `palette-from-brand`. But a 빈 상태·에러 상태 *design* brief is a screen-states task — `flow-design`'s check requirements (states, edge/error paths) and its curated `error-states.md` are the right home; illustration is only right when the brief actually asks for artwork.

**Proposed fix**: add compound state-design keywords to `flow-design` (에러 상태, 빈 상태 화면, 상태 설계, empty state, error state, 검색 결과 없음 …) so a states brief outscores illustration's single `빈 상태` hit, while an actual illustration brief (빈 상태 일러스트, 마스코트 …) keeps matching illustration harder. Verify both directions in the route eval.

_Done (2026-07-06): added 에러 상태, 빈 상태 화면, 상태 설계, 검색 결과 없음, empty state, error state to `flow-design`'s keyword list in `cli/lib/route.mjs`, all compound (never bare `상태`/`에러`/`빈`) so `illustration`'s bare `빈 상태`/`empty state` keywords are left untouched. Verified both directions: the states-design probe brief now routes `[medium] flow-design score=3` (matched `에러 상태`, `상태 설계`, `검색 결과 없음`) ahead of `[low] illustration score=1` (matched `빈 상태` only) — up from the prior `[low] illustration score=1` top result. The control brief (an actual illustration request, "서비스 빈 상태 일러스트와 마스코트 캐릭터 디자인") still routes `[high] illustration score=4` (matched `일러스트`, `마스코트`, `캐릭터`, `빈 상태`), unchanged. Route eval checkpoint stays `pass 6/6`._

## Verdict

- **v4.62 loop fixes: all holding on fresh briefs** — the loop's second turn is regression evidence for the first.
- **Backlog (evidence-backed)**: G-1 `dashboard-design` route (route + check reqs + example) → G-2/G-3 `flow-design` keyword expansion (small, eval-gated, both directions).
- The two-round pattern converges: each round's misroute lands on `design-from-brief` with the same check-warn fingerprint — route-table coverage, not check logic, is the recurring gap class.
