# Project Card

> 기준일: 2026-10-20. 수치는 이 날짜의 저장소, npm, GitHub에서 직접 확인한 값입니다.

## 1. Snapshot

| 항목 | 내용 |
|---|---|
| 프로젝트 | design-ai: AI 코딩 에이전트의 디자인 산출물을 **증거로 검증하는** CLI·SDK·MCP 툴킷 |
| 유형 | 1인 오픈소스 프로젝트 |
| 기간 | 2026-05-07 ~ 현재. 2026-10 기준 기능 개발은 동결하고 유지보수 전환을 검토 중입니다. |
| 역할 | 기획, 아키텍처, 계약 설계, 검증 기준, 릴리스 운영을 모두 맡았습니다. 구현은 Claude Code와 Codex를 함께 쓰며 진행했습니다. |
| 공개 배포 | npm `@design-ai/cli` 5.4.0 (SLSA provenance), GitHub Release, Homebrew formula, VS Code Marketplace `sungjin.design-ai-vscode` 0.4.1, GitHub Pages 문서 사이트 |
| 규모 | 커밋 1,029개, 머지된 PR 84개, npm 버전 16개(4.55.0 → 5.4.0), 태그 17개 |
| 검증 | Node 테스트 933개, strict audit 8종, 패키지 tarball 설치·실행 smoke, 게시 후 registry smoke |
| 링크 | [GitHub](https://github.com/sungjin9288/design-ai) · [npm](https://www.npmjs.com/package/@design-ai/cli) · [문서](https://sungjin9288.github.io/design-ai/) · [v5.4.0 Release](https://github.com/sungjin9288/design-ai/releases/tag/v5.4.0) |

## 2. One-liner

AI가 만든 화면이 그럴듯해 보이는 것과 검증된 것은 다릅니다. design-ai는 이 차이를 다룹니다.
리뷰 결과, 승인 범위, 구현 증거, 전후 비교를 **바이트 digest로 연결된 산출물**로 남깁니다.
그리고 근거가 없는 상태를 `pass`로 올리지 않도록 계약과 테스트로 강제합니다.

## 3. Problem

- 범용 AI 에이전트는 디자인·접근성·한국어 UI 문구를 매번 다른 기준으로 다루고, "고쳤다"는 주장을 확인할 수단이 없습니다.
- 디자인 생성 도구는 빠르게 좋아졌지만, 결과물이 실제로 나아졌는지를 재현 가능한 근거로 보여주는 도구는 드뭅니다.
- 승인 경계(파일 범위, commit, push, 배포)가 섞이면 에이전트가 의도하지 않은 변경을 만들 수 있습니다.

## 4. Solution

| 계층 | 하는 일 | 근거 파일 |
|---|---|---|
| 정적 리뷰 | HTML에서 9개 lens의 quality report(schemaVersion 2)를 만들고, 확인된 결함만 `fail`로 판정합니다 | `cli/lib/design-quality-inspector.mjs`, `cli/lib/interface-copy-inspector.mjs` |
| 승인 체인 | review → handoff → receipt → intake → scope 제안 → 사람의 승인 → 구현 증거로 이어지고, 각 단계가 앞 단계 파일의 SHA-256에 묶입니다 | `cli/lib/review-handoff*.mjs`, `cli/lib/implementation-scope*.mjs`, `cli/lib/implementation-evidence*.mjs` |
| 전후 비교 | 두 report의 lens 변화와 finding 판단(resolved, persistent, introduced, uncertain)을 계산하고, 파생 값은 validator가 다시 계산해 정확히 일치해야 합니다 | `cli/lib/review-comparison*.mjs` |
| 런타임 증거 | 승인된 브라우저 adapter의 결과를 정규화하고, 증거가 불완전한 probe는 `unverified`로 남깁니다 | `cli/lib/browser-verification*.mjs` |
| 시각 평가 | 스크린샷 회귀, 가로 넘침, 브랜드 토큰 이탈을 결정적으로 측정하며, 총점은 두지 않습니다 | `cli/lib/visual-evaluators.mjs` |
| 연속성 | 산출물을 digest로 잇는 프로젝트 스냅샷 체인을 만들고, 복원은 읽기 전용 계획만 제공합니다 | `cli/lib/project-snapshot*.mjs` |
| 표면 | CLI 16개 공개 명령, SDK 20개 export, MCP tool 29개, Website Console, Image Console, VS Code 확장 | `cli/bin/`, `cli/sdk/`, `cli/lib/mcp-server.mjs`, `docs/website-console/`, `docs/image-console/` |

## 5. Tech Stack

| 영역 | 기술 | 규모 |
|---|---|---|
| 런타임 | Node.js ESM (외부 런타임 의존성 없음), SDK 타입 선언(`index.d.ts`) | CLI 약 44,000줄, 테스트 약 31,600줄 |
| 검증 하네스 | Python audit, packed-tarball smoke, registry smoke, self-test | 약 66,000줄 |
| UI | 의존성 없는 정적 HTML/CSS/JS (Website Console, Image Console) | 약 6,300줄 |
| 통합 | MCP stdio 서버, VS Code Extension (TypeScript), Claude/Codex plugin manifest | MCP tool 29개 |
| 지식 | Markdown skill 21개, knowledge 97개, 리뷰 agent 4개 | Agent Skills 계약 검사 포함 |
| 배포 | GitHub Actions, npm Trusted Publishing(OIDC), SLSA provenance, Homebrew, MkDocs Material | 게시 후 registry smoke 자동 실행 |

## 6. Architecture

```text
정적 HTML ─▶ quality report v2 ─▶ review workflow ─▶ handoff ─▶ receipt ─▶ intake
                                                                          │
         사람의 scope 승인 ◀── scope 제안 (읽기 전용, 대상 저장소를 수정하지 않음) ◀┘
                │
                ▼
    구현 (승인된 파일만) ─▶ implementation evidence (Git 상태·검증 결과·관찰)
                │
   브라우저 adapter (승인 필요) ─▶ browser verification ─▶ visual evaluation
                │
                ▼
    review comparison v2 (전후 report) ─▶ project snapshot 체인 (digest 연결)
```

- 모든 연결은 바이트 SHA-256 digest입니다. 파일을 다시 포맷하면 다른 산출물이 되어 연결이 깨집니다.
- commit, push, 배포, 외부 쓰기는 각각 별도의 승인 게이트로 남깁니다.

## 7. 결과와 한계

- **검증된 것**
  - 공개 배포 5개 채널: npm, GitHub Release, Homebrew, VS Code Marketplace, Pages.
  - 게시 후 registry smoke 통과.
  - 자기 프로젝트에 적용해 찾은 실제 결함 수정 4건(#78, #79, #83, #87).
- **검증되지 않은 것**
  - 외부 사용자와 채택: star 0, 외부 이슈 0, 파일럿 참여 0.
  - 실제 이미지 provider 연동.
  - 독립 파일럿.
- **판단**: 외부 수요 근거가 없다는 것을 측정한 뒤, 기능 개발을 동결하고 수요 검증을 먼저 하기로 결정했습니다.

## 8. 이 프로젝트가 보여주는 역량

- 계약 우선 설계: 상태 머신, digest 연결, 파생 값 정확 일치, 하위 호환을 지키는 스키마 버전 관리.
- 검증 엔지니어링: 의도적으로 망가뜨려 보는 검증(mutation), 독립 리뷰, 부하 상황의 flaky test 원인 분석.
- 릴리스 엔지니어링: OIDC Trusted Publishing, provenance, tarball 재현성, 게시 후 검증.
- AI 에이전트를 활용한 개발 운영: 범위·승인·검증 기준을 사람이 정하고 에이전트 산출물을 증거로 검수.
- 제품 판단: 시장 변화와 실제 사용 지표를 보고 확장을 멈추는 결정.
