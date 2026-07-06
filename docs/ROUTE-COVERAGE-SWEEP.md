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
2. **`dashboard-design` enrichment** — data-viz and rbac-admin are data-screen/admin classes: add 차트, 데이터 시각화, 시계열, 범례, 권한 관리, 역할 관리 (+ English) keywords, and add `chart-types.md`, `chart-color-encoding.md`, `realtime-data.md` to the curated knowledge.
3. **`flow-design` keyword batch** — nine interaction classes (checkout, notifications, account, file-upload, collaboration, product-tour, search-filter, navigation, long-form): 체크아웃, 알림 센터, 계정 관리, 프로필 수정, 회원 탈퇴, 업로드, 드래그 앤 드롭, 댓글, 멘션, 공유 권한, 코치마크, 투어, 필터, 정렬, 무한 스크롤, 내비게이션, 하단 탭, 다단계 (+ English). Keywords only — the curated knowledge list stays at its current size; `search-ux`/`mobile-navigation`/`information-architecture`/`settings-page` reach these briefs through recall. If a future dogfood shows curation mismatch for browse/IA briefs, a dedicated route is the follow-up.

Regression gates: route eval checkpoint stays all-pass; the well-routed five stay put; both prior dogfood briefs keep their routes/confidence; every existing route's representative brief unchanged; all 18 sweep briefs re-probed with the target outcomes recorded below.

## Post-fix probe

_(to be filled by the implementation — the same 18 briefs, expected: every ❌/⚠️ class lands on its target route at medium+ where the brief vocabulary allows, with zero regressions on the ✅ five)_
