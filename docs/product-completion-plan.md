---
title: Design AI 제품 완성 계획
description: 전체 architecture, v5.2 engineering completion, 외부 출시 게이트와 후속 capability의 실행 기준입니다.
type: explanation
audience: product owner and maintainers
last_updated: 2026-09-05
---

# Design AI 제품 완성 계획

현재 제품의 design-quality layer를 유지하면서 v5.2의 로컬 engineering completion을 먼저 달성합니다.
실제 provider 검증, 배포, 외부 사용자 검증은 각각 별도 증거로 완료를 판단합니다.
전체 기능 수나 임의의 완성률 대신 사용자 흐름별 acceptance gate를 사용합니다.

## 목표와 기준선

2026-09-05 기준 작업 기준선은 `dc329273ab26ce4ae428f4827fbfeac79eb2461e`입니다.
`codex/image-console-v5.2.0`의 [Draft PR #62](https://github.com/sungjin9288/design-ai/pull/62)는 열려 있습니다.
기준선의 필수 CI 4개는 성공했고, 수정 후 working tree는 별도 검증 대상입니다.
기준선 CI를 이후 변경의 CI 결과로 간주하지 않습니다.

등록한 Goal의 완료 범위는 전체 설계·계획, 현재 기능 결함 수정, regression test,
로컬 생성→편집 확인, 전체 non-publishing release gate와 상태 문서 동기화입니다.
새 public capability, 유료 provider, 배포, 자동 학습은 이 Goal의 구현 범위가 아닙니다.

| 제품 영역 | 구현 상태 | 다음 완료 조건 |
| --- | --- | --- |
| Knowledge·21 skills·16 commands·4 agents | 기존 corpus와 skill contract 구현 | 8개 audit 및 skill contract 유지 |
| CLI·SDK·MCP | 공통 계약과 29 MCP tools·20 SDK exports 구현 | 이름·schema·permission parity 유지 |
| Start→review→approval→evidence→comparison | 기존 파일 기반 golden journey 구현 | 변경된 패키지의 실제 실행 smoke 통과 |
| Website Console | 기존 contract와 evidence UI 구현 | 기존 browser/contract coverage 회귀 없음 |
| Image Console | 생성·편집·승인·local asset 저장 구현 | 오류 격리·원본 binding·비동기 UI 및 생성→편집 검증 |
| Distribution | v5.1 published baseline, v5.2 candidate | exact reviewed commit에 대한 승인·publish·registry 증거 |
| External pilot | 모집·동의·운영 계약 준비 | 실제 참여와 독립 owner 결과; synthetic 증거 대체 금지 |
| P17C–F | 설계된 후속 개발 | 각 진입 조건 충족 후 별도 구현 |

## 설계 결정

[Architecture](ARCHITECTURE.md)의 공통 domain contract와 얇은 adapter 구조를 유지합니다.
UI, CLI, SDK, MCP가 각자 품질이나 승인 의미를 재정의하지 않습니다.
원본은 Markdown·JSON·검증된 local file이고, index와 화면 상태는 파생 데이터입니다.

고려한 대안은 단일 통합 canvas, 새 backend/database, public command 확장입니다.
현재 누락은 transport 추가보다 실행 안정성과 증거 일관성에 집중되어 있습니다.
따라서 기존 architecture 안에서 결함을 수정하는 방안을 선택합니다.
이는 현 코드와 제품 방향을 근거로 한 설계 판단입니다.

| 설계 규칙 | 구현 책임 | 검증 방법 |
| --- | --- | --- |
| 의도→계약→검토→승인→실행→증거 순서 유지 | 기존 operation·quality contract | contract·negative fixture·packed smoke |
| API 이름과 permission 의미 단일 관리 | capability manifest와 validator | inventory·SDK·MCP parity |
| Prompt Guide만 template authority 보유 | client·workflow | v1·lineage·provenance 오류 시 실행 0회 |
| 승인한 편집 원본과 실제 실행 원본 일치 | immutable descriptor snapshot | bytes·manifest 동시 교체도 job 시작 전에 거절 |
| subprocess 실패가 gateway를 종료하지 않음 | provider adapter | 조기 종료·stdin error·timeout 회귀 |
| 이전 비동기 결과가 새 draft를 덮어쓰지 않음 | Image Console revision 관리 | delayed success/failure와 반복 실행 회귀 |
| 저장 성공과 품질 승인 분리 | atomic image/manifest store | source IDs·hash·draft status 확인 |
| 미확인 상태를 완료로 승격하지 않음 | report·release receipt | mock/live/CI/registry 단계별 증거 |

Draft와 job은 process memory에만 있습니다. 재시작하면 새 compose와 승인이 필요합니다.
저장된 image와 manifest는 유지됩니다. 전체 작업 이력 DB와 자동 복원은 구현하지 않습니다.
UI는 현재 asset ID를 알려주고 저장된 원본을 선택하게 합니다.
결과 이미지 gallery·inline preview·다운로드 UI는 현재 제공하지 않는 후속 UX 범위입니다.

## 실행 순서와 현재 체크리스트

단계가 실패하면 해당 단계에서 수정하고 동일 경로를 재검증합니다.
외부 게이트의 미충족을 로컬 테스트 통과로 대체하지 않습니다.

### G1 — 전체 설계와 범위 확정

- [x] 현재 branch·diff·manifest·PR CI·기존 P17 계획을 확인했습니다.
- [x] EN/KO architecture의 skill dispatcher와 opt-in embedding 설명을 현재 코드와 맞췄습니다.
- [x] 데이터 수명, domain owner, 사용자 여정과 후속 capability 진입 조건을 명시했습니다.

### G2 — 현재 기능 안정화

- [x] provider 조기 종료의 stdin error를 typed failure로 격리했습니다.
- [x] 편집 원본의 compose-time snapshot과 실행 descriptor를 비교합니다.
- [x] 실행 즉시 승인 UI를 소비하고 이전 job 응답을 revision으로 구분합니다.
- [x] asset 목록 갱신 시 사용자의 현재 선택을 유지합니다.
- [x] asset 갱신 오류를 표시하고 초기화한 draft 정보가 CSS로 다시 노출되지 않도록 수정했습니다.
- [x] 재현한 실패에 regression test를 추가하고 focused test를 통과했습니다.

### G3 — 로컬 engineering completion

- [x] 임시 asset root와 deterministic subprocess로 브라우저 생성→편집을 확인했습니다.
- [x] desktop·mobile·keyboard·focus·contrast·console 결과를 기록했습니다.
- [x] `npm run release:check` 최종 exit 0과 packed smoke 통과를 확보했습니다.
- [x] 최종 diff·문서·검증 기록을 검토하고 외부 출시 조건을 분리했습니다.

명령은 저장소 root에서 실행합니다. runtime의 lint/typecheck/build script는 새로 만들지 않습니다.

```bash
node --test cli/lib/prompt-guide-client.test.mjs cli/lib/image-provider.test.mjs cli/lib/image-workflow.test.mjs cli/lib/image-console-server.test.mjs docs/image-console/*.test.mjs
npm run release:check
git diff --check
```

정확한 수치와 결과는 [Image Console 통합 가이드](integrations/prompt-guide-image-prompts.md)가 관리합니다.
소스 저장소의 상세 작업 기록은 `evidence/image-console/completion-qa.md`에 유지합니다.

## 외부 출시 게이트

G3 완료는 로컬 engineering completion입니다. 아래 항목까지 완료되어야 v5.2 출시 완료입니다.
현재 server-only Prompt Guide/provider 환경 변수는 설정되어 있지 않습니다.

| 게이트 | 진입 조건과 담당 | 완료 증거 | 실패 시 조치 |
| --- | --- | --- | --- |
| R1 Live integration | Owner가 endpoint·server-only key·adapter·호출 비용/범위를 승인 | 실제 generation 1회와 동일 원본 editing 1회, v1·hash·lineage·redacted receipt | provider 호출 중단, 원인 수정, 새 draft 승인 |
| R2 Review·merge | Owner의 commit/push 및 merge 요청, exact head CI와 reviewer 승인 | 승인된 head SHA와 merge receipt | merge 보류; 이후 source 변경은 재검증 |
| R3 Tag·publish | Owner의 tag/publish 승인, R1/R2 완료 | 동일 tarball smoke, npm version/dist integrity, GitHub Release | release 중단; 별도 승인 없는 강제 tag 변경 금지 |
| R4 Distribution | 실제 publish 완료 | public registry smoke, docs, Homebrew 상태와 version 일치 | 채널별 불일치 명시 및 복구 검토 |
| R5 Product validation | 실제 지원자와 별도 동의 | 독립 owner별 pilot·comparison·feedback | 모집 상태 유지; 내부 smoke를 adoption으로 표기 금지 |

Merge와 tag 전에는 `.github/workflows/`의 실행 trigger를 다시 확인합니다.
이 계획 자체는 commit·push·merge·publish 또는 외부 연락 승인이 아닙니다.
운영 장애 시 먼저 local gateway를 중단합니다. 저장 asset과 기존 audit history는 보존합니다.
코드 rollback은 정확한 변경 범위를 검토한 뒤 승인된 revert로 수행합니다.

## 후속 개발의 설계와 진입 조건

동시에 public capability 하나만 선택합니다. 아래 순서는 근거가 추가되면 재평가합니다.
진행 날짜를 임의로 약속하지 않고 prerequisite와 검증 가능한 산출물로 순서를 고정합니다.

| 우선순위·단계 | 입력과 책임 | 산출물·완료 조건 | 확대 금지 경계 |
| --- | --- | --- | --- |
| 1 · P17B 잔여 — **완료** | 안정된 review/evidence smoke baseline | pilot·install·help·search·route 도메인과 self-test 단계를 모듈로 분리; callable 15개 유지, 722-command 정규화 시퀀스 해시 불변, 실패 메시지 verbatim | runtime 동작·coverage 축소 없음 |
| 2 · P17C | 명시한 design-system root와 소비 repo, scope 승인 | verified facts→closed generation contract→project-local skill; path/import/token/asset 전수 검증 | clone-only 시작; 2개 독립 pilot 또는 새 제품 결정 전 CLI/SDK/MCP 승격 없음 |
| 3 · P17D | 기존 voice·locale·review 계약과 KO/EN fixtures | button/form/error/empty/notification/onboarding/destructive copy lens; 전후 예제와 SR 의미 유지 | 계약·fixtures 전 ninth lens 추가 금지; 단독 command 없음 |
| 4 · P17E | 승인된 browser adapter·source digest·viewport | visual diff·overflow·brand drift의 version/threshold/artifact/uncertainty 계약 | missing artifact는 `unverified`; 총점으로 누락 은폐 금지 |
| 5 · P17F | 기존 review·scope·implementation·comparison | digest와 owner decision을 잇는 successor snapshot | 새 history DB·자동 restore·자동 학습 없음 |

Image 결과 gallery·preview·download는 별도 요구와 fixture를 확보한 뒤 계획합니다.
asset byte serving의 path·media·same-origin 계약과 접근성 검증이 선행되어야 합니다.
기존 P17 capability보다 우선할지는 실제 사용자 blocking evidence로 결정합니다.

## 품질과 문서 기준

UI acceptance는 WCAG 2.1 AA, keyboard, visible focus, 44 px targets,
reduced motion, desktop/mobile overflow를 포함합니다.
현재 Image Console primary action은 white에서 6.29:1이며,
field boundary는 white에서 7.58:1입니다. 실제 측정 조건은 통합 가이드를 참조합니다.
새 UI는 이 기존 측정을 재사용하는 것만으로 완료되지 않습니다.

설계 설명과 실행 how-to를 분리하고 source와 상태를 직접 연결합니다.
문서 구조는 [information architecture](../knowledge/patterns/information-architecture.md),
서술은 [technical writing](../knowledge/patterns/technical-writing.md)과
[Korean document style](../knowledge/i18n/korean-document-style.md)을 따릅니다.

## Cross-reference

- [Architecture](ARCHITECTURE.md) — 사이트 언어 선택으로 한국어 번역을 확인합니다.
- [Product readiness](PRODUCT-READINESS.md)
- [P17 상세 계획](P17-SKILL-AND-CORE-HARDENING-PLAN.md)
- [Release checklist](RELEASE-CHECKLIST.md)
- [Roadmap](ROADMAP.md)
