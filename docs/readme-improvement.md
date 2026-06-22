# README Improvement Plan

## 1. 현재 README의 문제점

- 현재 상태 설명이 매우 길어 first-time reader가 핵심 제품을 빠르게 파악하기 어렵습니다.
- 구현 완료, 개발 중, 미구현 범위가 같은 문단에 섞여 있습니다.
- README가 기능 범위를 많이 담고 있어 구현 완료, 검증 필요, 향후 계획의 경계가 first-time reader에게 즉시 보이지 않습니다.
- Website Console, CLI, VS Code Extension의 대표 화면 또는 실행 결과가 부족합니다.
- backend/API/database/model training이 없다는 boundary는 문서에 있지만, README 상단에서 더 명확히 분리하면 좋습니다.
- 현재 로컬 기준 `knowledge/*.md` 92개, `skills/*/SKILL.md` 20개, `commands/*.md` 17개, `examples/*.md` 223개가 확인됩니다. README 수치와 일치하지만, release 전에는 자동 검증 결과를 함께 남기는 편이 안전합니다.

## 2. README에 추가해야 할 섹션

# design-ai

## 1. 프로젝트 개요
## 2. 개발 배경
## 3. 주요 기능
  - 구현 완료
  - 개발 중
  - 향후 개선
## 4. 기술 스택
## 5. 시스템 구조
## 6. 핵심 구현 내용
## 7. 실행 방법
## 8. 환경변수
## 9. 화면 예시
## 10. 개발 과정에서 해결한 문제
## 11. 비즈니스/사용자 관점의 적용 가능성
## 12. 향후 개선 계획

## 3. README 초안

# design-ai

design-ai는 AI coding agent가 제품 디자인, UI/UX, 접근성, 한국 시장 UX, 문서화 기준을 일관되게 적용하도록 돕는 model-agnostic design intelligence toolkit입니다. 모델을 학습시키는 서비스가 아니라, agent가 읽을 수 있는 Markdown knowledge base, skill playbook, CLI workflow, Website Improvement Console, VS Code Extension을 제공합니다.

## 1. 프로젝트 개요

- 목적: 범용 AI coding agent에 senior product designer 수준의 작업 절차와 검증 기준을 제공합니다.
- 대상 사용자: Codex, Claude Code, Cursor, Aider, VS Code를 사용하는 개발자와 디자인/문서 workflow 운영자
- 현재 상태: 고도화 중
- 저장소: https://github.com/sungjin9288/design-ai
- 문서 사이트: 배포 준비 config 존재. 문서화된 GitHub Pages URL은 2026-06-22 확인 시 HTTP 404입니다.

## 2. 개발 배경

AI coding agent는 코드 구현에는 강하지만, 디자인 시스템, 접근성, 한국 UX 관례, 문서 품질 기준을 매번 안정적으로 적용하지는 못합니다. design-ai는 이 문제를 prompt 하나가 아니라 구조화된 corpus와 검증 가능한 CLI workflow로 해결합니다.

## 3. 주요 기능

### 구현 완료

- 92개 Markdown knowledge files
- 20개 design skill playbooks
- 17개 slash command 문서
- Node.js 기반 `design-ai` CLI
- route, prompt, pack, check, audit, workspace, site, learn workflow
- Website Improvement Console static app
- local learning preference profile
- Python audit runner
- MkDocs documentation site config
- VS Code Extension command/tree view

### 개발 중

- public launch 이후 registry smoke 및 운영 안정화
- Website Console automation 확장
- real MCP connection check

### 향후 개선

- Playwright/Lighthouse/axe 기반 opt-in verification
- VS Code Webview reuse
- backend sync와 multi-user workspace는 별도 phase에서 검토

## 4. 기술 스택

| 영역 | 기술 |
|---|---|
| CLI | Node.js, JavaScript ESM |
| Static app | HTML, CSS, Vanilla JavaScript |
| Extension | TypeScript, VS Code Extension API |
| Docs | Markdown, MkDocs Material |
| Audit | Python scripts, npm scripts |
| Storage | browser `localStorage`, local JSON files |
| CI/Packaging | GitHub Actions workflow, GitHub Pages config, npm package metadata |

## 5. 시스템 구조

```text
User / AI coding agent
-> AGENTS.md / CLAUDE.md
-> CLI route / prompt / pack / check
-> skills / commands / knowledge / examples
-> Website Console or generated handoff artifacts
-> target repo implementation by the chosen agent
```

## 6. 핵심 구현 내용

- `cli/lib/dispatch.mjs`: CLI command routing과 alias 처리
- `cli/lib/route.mjs`: brief를 design workflow로 분류하는 deterministic route map
- `cli/lib/check.mjs`: 생성된 Markdown artifact 품질 검증
- `cli/lib/site.mjs`: Website Console JSON validation, task/report/prompt/bundle export
- `cli/lib/learn.mjs`: explicit local preference profile 관리
- `docs/website-console/app.js`: local-first Website Improvement workflow UI
- `vscode-extension/src/extension.ts`: VS Code Extension activation과 tree provider 등록

## 7. 실행 방법

```bash
npm install
npm test
npm run audit:strict
node cli/bin/design-ai.mjs help
node cli/bin/design-ai.mjs route "audit this landing page for accessibility"
```

## 8. 환경변수

- `DESIGN_AI_LEARNING_FILE`: local learning profile 경로를 지정합니다.
- `DESIGN_AI_LEARNING_USAGE_FILE`: learning usage sidecar 경로를 지정합니다.

기본 경로:

```text
~/.design-ai/learning.json
~/.design-ai/learning.usage.json
```

## 9. 화면 예시

추가 필요:

- Website Improvement Console screenshot
- VS Code Extension sidebar screenshot
- `design-ai route`, `design-ai site`, `design-ai check` CLI output screenshot

## 10. 개발 과정에서 해결한 문제

- agent workflow를 route, skill, knowledge, examples로 분해했습니다.
- Website improvement 작업에서 target repo를 직접 수정하지 않는 local-first handoff boundary를 설정했습니다.
- Product Readiness 문서에서 shipped scope와 future scope를 분리했습니다.
- Python audit runner와 npm scripts로 release verification을 자동화했습니다.

## 11. 비즈니스/사용자 관점의 적용 가능성

- design review, component spec, website improvement, document writing 등 반복적인 지식 작업을 표준 workflow로 전환할 수 있습니다.
- consulting workflow의 문제정의, 요구사항 정리, handoff, 검증 evidence 관리와 자연스럽게 연결됩니다.
- 단, 실제 ROI나 사용자 수는 현재 저장소만으로 검증되지 않습니다.

## 12. 향후 개선 계획

- README 상단에 shipped scope / not shipped scope 요약 추가
- demo assets 추가
- public publish/deploy 후 registry smoke evidence 정리
- Playwright/Lighthouse/axe verification prototype
- real MCP readiness probe
- VS Code Webview 또는 web UI 확장 검토
