# Route coverage sweep (Phase 768)

Two dogfood rounds converged on one recurring gap class: route-table coverage ([DOGFOOD-SDK-FINDINGS.md](DOGFOOD-SDK-FINDINGS.md), [DOGFOOD-DASHBOARD-FINDINGS.md](DOGFOOD-DASHBOARD-FINDINGS.md)). Instead of a third one-class round, this sweep enumerates 18 common product-design task classes, probes them all through `route()` in one batch, and fixes every gap at once.

## Sweep results (2026-07-07, at v4.63.0)

| Class | Routed to | Verdict |
|---|---|---|
| settings, a11y-audit, dark-mode, brand-identity | flow-design / design-review / design-from-brief / palette-from-brand, all `[medium]` | ✅ correct |
| long-form (다단계 보험 가입 폼) | component-spec `[medium] 2` | ⚠️ marginal — a multi-step form flow fits flow-design better than a component spec |
| checkout | design-from-brief `[low] 1` (flow-design 2nd at 1) | ❌ `체크아웃` not in any keyword set (`결제 플로우` doesn't substring-match "결제 체크아웃 플로우") |
| notifications | flow-design `[low] 1` | ⚠️ right route, weak match (알림 센터 vocabulary missing) |
| account | design-from-brief `[low] 1` | ❌ 계정 관리/프로필 수정/회원 탈퇴 unmatched |
| file-upload | design-review `[low] 1` | ❌ 업로드/드래그 앤 드롭 unmatched |
| collaboration | design-review `[low] 1` | ❌ 댓글/멘션/공유 권한 unmatched |
| product-tour | flow-design `[low] 1` | ⚠️ right route, weak (코치마크/투어 missing) |
| search-filter | design-review `[low] 1` | ❌ 필터/정렬/패싯 unmatched — despite `search-ux.md`, `list-and-feed.md` existing |
| navigation | design-from-brief `[low] 1` | ❌ 내비게이션/하단 탭 unmatched — despite `mobile-navigation.md`, `information-architecture.md` existing |
| data-viz | design-from-brief `[low] 0` | ❌ zero match — despite `chart-types.md`, `chart-color-encoding.md`, `realtime-data.md` existing |
| rbac-admin | design-from-brief `[low] 0` | ❌ zero match — admin-permissions class |
| landing | handoff-spec `[low] 1` (via `개발자`!) | ❌ misroute — despite `landing-hero-design.md`, `landing-page-patterns.md` existing |
| pricing-page | design-from-brief `[low] 0` | ❌ zero match — despite `pricing-page-design.md` existing |
| email-template | palette-from-brand `[low] 1` (via `다크모드`) | ❌ misroute — despite `email-design.md` existing |

Pattern: the knowledge corpus already covers nearly every weak class — the route table simply doesn't connect briefs to it. 13 of 18 classes were low/misrouted/zero-match.

## Fix plan (one batch)

1. **New route `marketing-page`** — consolidates three zero/misrouted classes (landing, pricing-page, email-template) that share a marketing-surface character and have five dedicated knowledge files (`landing-hero-design`, `landing-page-patterns`, `pricing-page-design`, `email-design`, `brand-identity`). Keywords: 랜딩 페이지, 히어로, 가격 페이지, 플랜 비교, 이메일 템플릿, CTA + English forms. Check requirements: conversion/CTA evidence, visual-hierarchy evidence, responsive/email-client behavior. Worked example required (example-qa).
   - _Done (2026-07-07): added `marketing-page` route in `cli/lib/route.mjs` (command: null, `skills/design-critique`, `skills/handoff-spec`, `agents/a11y-reviewer`, `agents/design-critic`, the five curated knowledge files above), `ROUTE_REQUIREMENTS["marketing-page"]` in `cli/lib/check.mjs` (conversion/CTA, visual-hierarchy/fold, responsive/email-client), worked example `examples/marketing-page-saas-landing.md` (12/12 on `check --route marketing-page`), wired into `cli/lib/examples.mjs` (`ROUTE_EXAMPLE_QUERIES` + `CANONICAL_ROUTE_EXAMPLES`) and `examples/README.md`. `tools/audit/smoke_assertions.py` `EXPECTED_ROUTE_CATALOG_IDS` += `marketing-page`. README/README.ko examples badge 223 → 224._
2. **`dashboard-design` enrichment** — data-viz and rbac-admin are data-screen/admin classes: add 차트, 데이터 시각화, 시계열, 범례, 권한 관리, 역할 관리 (+ English) keywords, and add `chart-types.md`, `chart-color-encoding.md`, `realtime-data.md` to the curated knowledge.
   - _Done (2026-07-07): keywords added in `cli/lib/route.mjs` (plus bare `권한`, needed because the rbac-admin brief uses a middle-dot form "권한·역할 관리" that the space-separated compound `권한 관리` doesn't substring-match). The three knowledge files were added to `dashboard-design.knowledge`._
3. **`flow-design` keyword batch** — nine interaction classes (checkout, notifications, account, file-upload, collaboration, product-tour, search-filter, navigation, long-form): 체크아웃, 알림 센터, 계정 관리, 프로필 수정, 회원 탈퇴, 업로드, 드래그 앤 드롭, 댓글, 멘션, 공유 권한, 코치마크, 투어, 필터, 정렬, 무한 스크롤, 내비게이션, 하단 탭, 다단계 (+ English). Keywords only — the curated knowledge list stays at its current size; `search-ux`/`mobile-navigation`/`information-architecture`/`settings-page` reach these briefs through recall. If a future dogfood shows curation mismatch for browse/IA briefs, a dedicated route is the follow-up.
   - _Done (2026-07-07): all listed keywords added to `flow-design.keywords` in `cli/lib/route.mjs`, verified collision-free against every other route's keyword set. Two extra keywords beyond the plan's literal list were needed to actually tip the long-form class over to flow-design (see Post-fix probe note below): `임시저장` and `유효성 검증`, both collision-free._

Regression gates: route eval checkpoint stays all-pass; the well-routed five stay put; both prior dogfood briefs keep their routes/confidence; every existing route's representative brief unchanged; all 18 sweep briefs re-probed with the target outcomes recorded below.

## Post-fix probe

Re-probed with the same 18 briefs via `sweep.mjs` after the fix batch above landed:

| Class | Routed to | Outcome |
|---|---|---|
| search-filter | flow-design `[medium] 3` (필터, 정렬, 무한 스크롤) | ✅ fixed — was design-review `[low] 1` |
| checkout | flow-design `[medium] 2` (플로우, 체크아웃) | ✅ fixed — was design-from-brief `[low] 1` |
| settings | flow-design `[medium] 2` (설정 화면, 알림 설정) | ✅ unchanged (already correct pre-fix) |
| landing | marketing-page `[medium] 3` (랜딩 페이지, 히어로, CTA) | ✅ fixed — was handoff-spec `[low] 1` misroute |
| long-form | flow-design `[medium] 3` (다단계, 임시저장, 유효성 검증) | ✅ fixed (intended move) — was component-spec `[medium] 2` |
| notifications | flow-design `[medium] 2` (알림 설정, 알림 센터) | ✅ fixed — was flow-design `[low] 1` (weak match) |
| account | flow-design `[medium] 3` (계정 관리, 프로필 수정, 회원 탈퇴) | ✅ fixed — was design-from-brief `[low] 1` |
| data-viz | dashboard-design `[medium] 3` (차트, 시계열, 범례) | ✅ fixed — was design-from-brief `[low] 0` (zero match) |
| navigation | flow-design `[medium] 2` (내비게이션, 하단 탭) | ✅ fixed — was design-from-brief `[low] 1` |
| rbac-admin | dashboard-design `[medium] 2` (역할 관리, 권한) | ✅ fixed — was design-from-brief `[low] 0` (zero match) |
| file-upload | flow-design `[medium] 2` (업로드, 드래그 앤 드롭) | ✅ fixed — was design-review `[low] 1` |
| collaboration | flow-design `[medium] 3` (댓글, 멘션, 공유 권한) | ✅ fixed — was design-review `[low] 1` |
| pricing-page | marketing-page `[medium] 2` (가격 페이지, 플랜 비교) | ✅ fixed — was design-from-brief `[low] 0` (zero match) |
| email-template | marketing-page `[medium] 2` (이메일 템플릿, CTA) | ✅ fixed — was palette-from-brand `[low] 1` misroute |
| a11y-audit | design-review `[medium] 2` (감사, 접근성) | ✅ unchanged (already correct pre-fix) |
| dark-mode | design-from-brief `[medium] 2` (디자인 시스템, 토큰) | ✅ unchanged (already correct pre-fix) |
| brand-identity | palette-from-brand `[medium] 2` (컬러, 팔레트) | ✅ unchanged (already correct pre-fix) |
| product-tour | flow-design `[medium] 3` (온보딩, 코치마크, 투어) | ✅ fixed — was flow-design `[low] 1` (weak match) |

All 18 classes land on their target route at medium+ confidence. Zero regressions on the five previously-✅ classes. `long-form` completed its intended move from `component-spec` to `flow-design`.

Regression gates re-run after the fix, all green: route eval checkpoint (`--eval --strict`, 6/6 pass); both dogfood briefs (report/block → flow-design `[high] 4`; settlement → dashboard-design `[medium] 2`); representative briefs for design-system, component, palette, website, motion, illustration all unchanged; `npm test` (586/586); `npm run audit` (8/8, example-qa 22/22 routes and 22/22 examples); `npm run release:metadata`; `npm run package:smoke`; `npm run registry:smoke:self-test`; `npm run ci:local`.
