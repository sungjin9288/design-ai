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

### G-2. `flow-design` keyword gaps: Korean wizard/step vocabulary missing

The onboarding-wizard probe — unambiguously a flow brief — matched only `온보딩` (`score=1 [low]`). 위저드, 단계(별), 이어하기 and similar step-flow Korean vocabulary are absent from the v4.62 keyword set (English `wizard`/`stepper` made it in; the Korean forms didn't).

**Proposed fix**: additive keywords on `flow-design` (위저드, 단계별 플로우, 스텝, 이어하기, 팀 초대 …), gated by the route eval checkpoint and the round-1 brief still scoring `[high]`.

### G-3. Reverse hijack: `빈 상태` belongs to the illustration route, so states-design briefs misroute

The empty/error-states probe routed `[low] illustration score=1` via `빈 상태` (an empty-state-*illustration* keyword), tied with `palette-from-brand`. But a 빈 상태·에러 상태 *design* brief is a screen-states task — `flow-design`'s check requirements (states, edge/error paths) and its curated `error-states.md` are the right home; illustration is only right when the brief actually asks for artwork.

**Proposed fix**: add compound state-design keywords to `flow-design` (에러 상태, 빈 상태 화면, 상태 설계, empty state, error state, 검색 결과 없음 …) so a states brief outscores illustration's single `빈 상태` hit, while an actual illustration brief (빈 상태 일러스트, 마스코트 …) keeps matching illustration harder. Verify both directions in the route eval.

## Verdict

- **v4.62 loop fixes: all holding on fresh briefs** — the loop's second turn is regression evidence for the first.
- **Backlog (evidence-backed)**: G-1 `dashboard-design` route (route + check reqs + example) → G-2/G-3 `flow-design` keyword expansion (small, eval-gated, both directions).
- The two-round pattern converges: each round's misroute lands on `design-from-brief` with the same check-warn fingerprint — route-table coverage, not check logic, is the recurring gap class.
