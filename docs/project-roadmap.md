# Development Roadmap

## 1. 현재 상태 요약

- 현재 구현 완료: Node.js CLI, route/prompt/pack/check/audit/workspace/site/learn workflow, Markdown knowledge base, skills, examples, Website Console, VS Code Extension, MkDocs docs site config, Python audit runner
- 개발 중: external launch readiness, public publish/deploy, Website Console automation 확장, real MCP connection check 설계
- 미구현: backend API, auth, database sync, multi-user collaboration, model training, embedding index, automatic crawling, Lighthouse/axe/Playwright automation
- 검증 필요: 실제 사용자 피드백, 개인 기여 범위, demo screenshot/GIF, 최신 CI 결과
- 외부 공개 상태: 2026-06-22 확인 결과 npm registry는 `E404`, GitHub Pages URL은 HTTP 404, VS Code Marketplace listing은 없음입니다.

## 2. Phase 1 - MVP 완성

- 목표: 현재 구현된 local-first workflow를 포트폴리오에서 설명 가능한 수준으로 정리합니다.
- 해야 할 작업:
  - CLI 주요 명령 실행 예시를 짧게 캡처합니다.
  - Website Console 화면 screenshot 또는 GIF를 추가합니다.
  - VS Code Extension sidebar screenshot을 추가합니다.
  - README 상단에 shipped scope와 not shipped scope를 분리합니다.
- 완료 기준:
  - README와 docs가 구현/미구현 범위를 혼동하지 않습니다.
  - `npm test`, `npm run audit:strict`, `git diff --check` 결과를 기록합니다.
  - 포트폴리오 문서의 모든 구현 완료 주장이 코드 파일 근거를 가집니다.
- 산출물:
  - 개선된 README 초안
  - demo assets
  - release evidence note

## 3. Phase 2 - 기능 고도화

- 목표: 현재 수동 검증으로 남은 Website Console QA를 부분 자동화합니다.
- 해야 할 작업:
  - Playwright 기반 smoke check prototype을 설계합니다.
  - Lighthouse/axe 실행 여부를 target repo opt-in 방식으로 정의합니다.
  - MCP readiness에서 실제 read-only probe와 deterministic local check를 구분합니다.
  - CLI JSON report schema에 skipped/warn/fail/pass 상태를 명확히 둡니다.
- 완료 기준:
  - target repo를 수정하지 않고 read-only verification artifact를 생성합니다.
  - failure, warning, skipped 상태가 CLI output에 명확히 표시됩니다.
- 산출물:
  - automation proof of concept
  - CLI JSON report schema
  - 테스트 fixture

## 4. Phase 3 - 서비스화 / 배포

- 목표: local-first toolkit을 외부 사용자가 설치, 실행, 검증할 수 있게 public publish/deploy까지 마무리합니다.
- 해야 할 작업:
  - npm public registry publish를 수행하고 smoke 결과를 확인합니다.
  - GitHub Actions latest run을 README 또는 release note에 연결합니다.
  - VS Code Extension Marketplace 배포를 수행하고 install guide를 정리합니다.
  - GitHub Pages docs를 배포하고 최신 빌드 상태를 확인합니다.
- 완료 기준:
  - 설치 명령, 실행 명령, 검증 명령이 처음 사용자에게 재현됩니다.
  - 배포 링크와 package version이 일치합니다.
  - external launch 표현에 최신 증거 링크가 붙습니다.
- 산출물:
  - release checklist update
  - install verification log
  - public demo section

## 5. Phase 4 - 포트폴리오 완성

- 목표: 개발 중인 프로젝트를 지원 직무별 portfolio narrative로 완성합니다.
- 해야 할 작업:
  - case study에 실제 화면, CLI output, architecture diagram을 추가합니다.
  - resume bullets를 지원 직무별로 3개 버전으로 압축합니다.
  - 면접용 1분/3분 답변을 녹음 리허설 기준으로 다듬습니다.
  - 성과 수치는 실제 근거가 생긴 뒤만 추가합니다.
- 완료 기준:
  - "구현 완료", "개발 중", "미구현", "검증 필요" 표현이 일관됩니다.
  - 면접에서 핵심 코드 파일을 열어 설명할 수 있습니다.
  - 위험 표현이 resume/case study 본문에 섞이지 않습니다.
- 산출물:
  - portfolio case study
  - resume project section
  - interview answer sheet

## 6. 우선순위 높은 다음 작업 5개

| 우선순위 | 작업 | 이유 | 예상 산출물 |
|---|---|---|---|
| 1 | CLI 주요 명령 실행 캡처 | 이력서 주장에 실행 근거가 필요합니다. | command output screenshot/text |
| 2 | Website Console demo screenshot/GIF 추가 | 프로젝트를 빠르게 이해시키는 시각 자료가 부족합니다. | demo image 또는 GIF |
| 3 | `npm run release:check` 최신 결과 유지 | 검증 가능한 개발 역량 근거가 됩니다. | release verification log |
| 4 | README shipped / not shipped scope 정리 | 제품 범위 오해를 줄입니다. | README 개선 PR 또는 evidence note |
| 5 | Playwright/Lighthouse/axe 자동화 범위 설계 | future roadmap의 가장 큰 기술 확장 지점입니다. | automation design note |
