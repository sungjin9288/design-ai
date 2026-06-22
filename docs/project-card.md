# Project Card

## 1. Snapshot

- 프로젝트명: design-ai
- 프로젝트 유형: 개인 / PoC 확장 / 오픈소스 도구형 프로젝트로 판단
- 기간: 확인 필요
- 현재 상태: 고도화 중
- 내 역할: 저장소 소유자 및 주요 구현자로 추정되나, 개인 기여 범위는 확인 필요
- GitHub 링크: https://github.com/sungjin9288/design-ai
- Demo 링크: 공개 demo 미확인. 문서화된 GitHub Pages URL은 2026-06-22 확인 시 HTTP 404입니다.
- 핵심 기술스택: Node.js, ESM CLI, Python audit tooling, MkDocs Material, TypeScript VS Code Extension, Markdown knowledge base
- 이력서 반영 가능 여부: 가능
- 판단 이유: CLI, 문서 사이트 config, Website Improvement Console, VS Code Extension, 테스트 및 release gate가 코드와 문서로 확인됩니다. 다만 개인 기여 범위와 실제 사용자 수는 저장소만으로 확정할 수 없고, 외부 배포면은 현재 public listing이 확인되지 않았습니다.

## 2. One-liner

AI coding agent 사용자의 디자인 판단, 문서화, 검증 흐름을 지원하기 위해 디자인 지식 베이스, task routing CLI, Website Improvement Console, VS Code Extension을 고도화 중인 agent-ready design intelligence toolkit입니다.

## 3. Problem

- 이 프로젝트가 해결하려는 사용자 문제: 범용 AI coding agent가 디자인 시스템, UI/UX, 접근성, 한국 시장 UX를 일관되게 다루기 어렵습니다.
- 기존 방식의 불편함 또는 한계: prompt가 분산되고, 디자인 근거가 암묵적이며, 산출물 품질 검증이 수동으로 남습니다.
- 이 프로젝트에서 가장 중요한 문제정의: 디자인 지식을 Markdown, skill, command, CLI 검증 흐름으로 구조화해 agent가 재사용 가능한 방식으로 실행하게 만드는 것입니다.
- 컨설팅 경험과 자연스럽게 연결되는 부분:
  - 문제정의: 사용자 요청을 route, skill, knowledge로 분류합니다.
  - 요구사항 정리: `skills/*/PLAYBOOK.md`, `commands/*.md`로 작업 절차를 표준화합니다.
  - 사용자 관점: Codex, Claude Code, Cursor, Aider, VS Code 등 실제 사용 표면을 분리합니다.
  - 문서화: `knowledge/`, `docs/`, `examples/`로 근거와 예시를 함께 제공합니다.
  - 기대효과 정리: `docs/PRODUCT-READINESS.md`, `docs/ROADMAP.md`에서 출시 범위와 남은 작업을 분리합니다.

## 4. Solution

- 제공하려는 핵심 기능: 디자인 지식 검색, 작업 routing, prompt/pack 생성, 산출물 check, local learning preference, Website Console handoff, VS Code 탐색 UI입니다.
- 현재 실제로 제공 가능한 기능:
  - `design-ai` CLI 명령 실행: `cli/bin/design-ai.mjs`, `cli/lib/dispatch.mjs`
  - route 기반 작업 추천: `cli/lib/route.mjs`
  - prompt/pack/check/audit/workspace/site/learn 명령: `cli/commands/*.mjs`, `cli/lib/*.mjs`
  - Website Improvement Console: `docs/website-console/index.html`, `docs/website-console/app.js`
  - VS Code Extension 명령과 tree view: `vscode-extension/src/extension.ts`, `vscode-extension/src/commands.ts`
- 개발 중인 기능: external launch readiness, real MCP connection checks, Playwright/Lighthouse/axe 자동화, VS Code Webview 재사용은 문서상 향후 작업입니다.
- 아직 할 수 없는 기능: model training, fine-tuning, embedding index, backend API, multi-user auth, DB sync, 자동 웹 크롤링은 shipped scope가 아닙니다.
- 사용자 흐름: 사용자가 brief 입력 -> CLI route 추천 -> 관련 skill/knowledge/examples 로드 -> prompt 또는 pack 생성 -> 결과물 check/audit -> 필요 시 Website Console 또는 handoff artifact 생성
- AI/IT 기술을 적용한 방식: 모델 자체를 학습시키지 않고, agent가 읽을 수 있는 Markdown corpus, deterministic routing, local CLI validation으로 AI coding agent의 작업 품질을 보조합니다.

## 5. Tech Stack

| 영역 | 사용 기술 | 현재 사용 여부 | 근거 파일 |
|---|---|---|---|
| Language | JavaScript ESM, TypeScript, Python, Markdown | 사용 중 | `package.json`, `vscode-extension/package.json`, `tools/audit/run-all.py` |
| Frontend | Static HTML/CSS/JS Website Console | 사용 중 | `docs/website-console/index.html`, `docs/website-console/app.js`, `docs/website-console/styles.css` |
| Backend | 없음 | 미구현 | `docs/WEBSITE-IMPROVEMENT.md` boundaries |
| AI/LLM | Agent prompt/skill/knowledge system | 사용 중 | `AGENTS.md`, `skills/*/SKILL.md`, `cli/lib/route.mjs` |
| Database | 없음. Browser `localStorage`와 local JSON profile 사용 | 사용 중 / 제한적 | `docs/website-console/app.js`, `cli/lib/learn.mjs` |
| Infra/Deploy | GitHub Pages docs config, npm package metadata, GitHub Actions workflow | 배포 준비 구조 확인 / public 배포 미확인 | `mkdocs.yml`, `.github/workflows/*.yml`, `package.json`, `docs/external-status.md` |
| Tools | MkDocs Material, npm scripts, Python audit scripts | 사용 중 | `mkdocs.yml`, `package.json`, `tools/audit/run-all.py` |
| Test | Node test, Python audit, package smoke, VS Code unit test | 사용 중 | `package.json`, `cli/lib/*.test.mjs`, `vscode-extension/test/lib.test.mjs` |

## 6. Architecture

### 현재 아키텍처

```text
User / AI coding agent
-> AGENTS.md / CLAUDE.md instructions
-> CLI command dispatcher
-> route / prompt / pack / check / site / learn modules
-> Markdown knowledge, skills, commands, examples
-> local files, localStorage, generated Markdown/JSON artifacts
```

### 목표 아키텍처

```text
User / AI coding agent
-> CLI + docs site + VS Code Extension + Website Console
-> deterministic routing and validation
-> optional MCP readiness / future real probes
-> target repo handoff
-> verified implementation evidence
```

### 설명

- 주요 데이터 흐름: brief 또는 Website Console JSON을 입력받아 route, prompt, task, report, bundle artifact로 변환합니다.
- 주요 모듈 구성: `cli/`, `knowledge/`, `skills/`, `commands/`, `agents/`, `examples/`, `docs/website-console/`, `vscode-extension/`입니다.
- API 구조: HTTP API endpoint는 확인되지 않습니다. CLI command가 주된 API입니다.
- AI/LLM 처리 흐름: 직접 모델을 호출하지 않고, prompt/context를 생성해 외부 agent가 사용하도록 합니다.
- DB 또는 저장소 구조: DB는 없습니다. `learn`은 `~/.design-ai/learning.json`을 기본 저장소로 사용합니다.
- 인증/보안/환경변수 처리 방식: 제품 자체 인증은 없습니다. MCP 인증은 각 agent 설정에 위임됩니다.
- 배포 구조: npm package metadata, Homebrew Formula, GitHub Pages docs config, VS Code Extension manifest가 확인됩니다. 다만 2026-06-22 기준 public npm registry, GitHub Pages URL, VS Code Marketplace listing은 확인되지 않았습니다.
- 배포 구조가 아직 없다면: backend/server 배포는 미구현입니다.

## 7. My Contribution

- 직접 구현했다고 설명 가능한 기능: 확인 필요. 저장소 기준으로 CLI command dispatcher, route system, Website Console, local learning, audit pipeline, VS Code Extension 구현을 설명할 수 있습니다.
- 설계했다고 설명 가능한 구조: Markdown knowledge base -> skill/playbook -> CLI route/check -> handoff artifact 구조입니다.
- 문서화 또는 기획 측면 기여: `docs/PRODUCT-READINESS.md`, `docs/ROADMAP.md`, `docs/AI-LEARNING.md`, `docs/WEBSITE-IMPROVEMENT.md`에 출시 범위와 경계가 정리되어 있습니다.
- 문제 해결 또는 디버깅 사례: release metadata guard, bundle boundary evidence, package smoke coverage가 최근 roadmap에 반복적으로 기록되어 있습니다.
- 면접에서 코드 수준으로 설명해야 할 부분: `cli/lib/route.mjs`, `cli/lib/site.mjs`, `cli/lib/learn.mjs`, `tools/audit/run-all.py`, `vscode-extension/src/commands.ts`입니다.

## 8. Current Status

| 구분 | 기능 | 상태 | 근거 파일 | 이력서 반영 가능 여부 |
|---|---|---|---|---|
| 구현 완료 | CLI command dispatcher와 command alias | 구현 완료 | `cli/bin/design-ai.mjs`, `cli/lib/dispatch.mjs` | 가능 |
| 구현 완료 | deterministic route 추천 | 구현 완료 | `cli/lib/route.mjs` | 가능 |
| 구현 완료 | Website Console local workflow | 구현 완료 | `docs/WEBSITE-IMPROVEMENT.md`, `docs/website-console/app.js` | 가능 |
| 구현 완료 | local learning preference 관리 | 구현 완료 | `cli/lib/learn.mjs`, `docs/AI-LEARNING.md` | 가능 |
| 구현 완료 | Python audit runner | 구현 완료 | `tools/audit/run-all.py`, `package.json` | 가능 |
| 구현 완료 | VS Code Extension command/tree surface | 구현 완료 | `vscode-extension/package.json`, `vscode-extension/src/extension.ts` | 가능 |
| 개발 중 | 외부 launch / registry smoke 이후 운영 안정화 | 개발 중 | `docs/PRODUCT-READINESS.md` | 조건부 가능 |
| 미구현 | backend API, auth, DB sync | 미구현 | `docs/WEBSITE-IMPROVEMENT.md` | 보류 |
| 미구현 | model training, fine-tuning, embeddings | 미구현 | `docs/AI-LEARNING.md`, `docs/PRODUCT-READINESS.md` | 보류 |
| 검증 필요 | 실제 사용자 수, 채택률, 성과 수치 | 검증 필요 | 저장소 근거 없음 | 보류 |
| 외부 공개 상태 | npm registry, GitHub Pages, VS Code Marketplace public listing | 미공개 또는 미확인 | `docs/external-status.md`, `evidence/cli-logs/npm-registry-status.log`, `evidence/cli-logs/github-pages-status.log`, `evidence/cli-logs/vscode-marketplace-status.log` | 보류 |
| 문서상 존재, 코드 근거 없음 | 실제 사용자 수, 채택률, 정량 성과 | 문서상 존재하지 않음 / 코드 근거 없음 | 저장소 근거 없음 | 보류 |

## 9. Evidence

- 주요 코드 파일: `cli/bin/design-ai.mjs`, `cli/lib/dispatch.mjs`, `cli/lib/route.mjs`, `cli/lib/site.mjs`, `cli/lib/learn.mjs`, `docs/website-console/app.js`, `vscode-extension/src/extension.ts`
- 주요 함수/클래스: `runCommand`, `parseSiteArgs`, `parseLearnArgs`, `collectGitReport`, `registerCommands`
- 주요 API 엔드포인트: HTTP endpoint 없음. CLI 명령이 사용 표면입니다.
- 설정 파일: `package.json`, `mkdocs.yml`, `vscode-extension/package.json`, `.claude-plugin/plugin.json`
- 실행 파일: `cli/bin/design-ai.mjs`, `install.sh`, `tools/build-docs.sh`
- 테스트 파일: `cli/lib/*.test.mjs`, `vscode-extension/test/lib.test.mjs`, `tools/audit/*.py`
- README 또는 문서 근거: `README.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT-READINESS.md`, `docs/AI-LEARNING.md`, `docs/WEBSITE-IMPROVEMENT.md`
- 실행 방법이 명확한지: `README.md`, `docs/QUICKSTART.md`, `package.json` scripts로 확인됩니다.
- 스크린샷/데모가 필요한 부분: Website Console, VS Code Extension sidebar, CLI 결과 예시입니다.
- 수량 근거: 현재 로컬 기준 `knowledge/*.md` 92개, `skills/*/SKILL.md` 20개, `commands/*.md` 17개, `examples/*.md` 223개가 확인됩니다.

## 10. Consulting Angle

| 프로젝트 요소 | 연결되는 컨설팅 역량 | 이력서/면접 표현 | 근거 |
|---|---|---|---|
| route 기반 task 분류 | 문제정의 | 사용자 brief를 작업 유형별 workflow로 분류했습니다. | `cli/lib/route.mjs` |
| skills/playbooks | 요구사항 정리 | 반복 가능한 산출물 작성 절차를 skill 단위로 표준화했습니다. | `skills/*/PLAYBOOK.md` |
| Website Console | 업무 흐름 이해 | 웹사이트 개선 업무를 profile, audit, MCP readiness, task, handoff 흐름으로 구조화했습니다. | `docs/WEBSITE-IMPROVEMENT.md` |
| check/audit tooling | 개선안 도출 | 산출물 품질 기준을 코드화하고 release gate에 포함했습니다. | `cli/lib/check.mjs`, `tools/audit/run-all.py` |
| Product Readiness 문서 | 문서화 | 현재 제공 범위와 향후 범위를 분리해 과장된 제품 설명을 방지했습니다. | `docs/PRODUCT-READINESS.md` |

## 11. Safe vs Risky Expressions

### 써도 되는 표현

- "AI coding agent를 위한 design knowledge base와 CLI workflow를 구축"
- "Node.js CLI와 Python audit pipeline으로 문서/산출물 검증 자동화"
- "Website Improvement Console을 정적 Web App으로 구현하고 local handoff artifact export 지원"
- "VS Code Extension으로 knowledge, skills, examples 탐색 UI 제공"

### 조건부로 가능한 표현

- "오픈소스 배포 준비 경험" - npm/GitHub Pages/Marketplace public publish 전까지는 "배포 완료"가 아니라 "배포 준비 구조와 release gate 구축"으로 표현해야 합니다.
- "사용자 피드백 기반 개선" - 실제 issue, PR, 사용자 피드백 링크가 있을 때만 사용합니다.
- "AI learning 기능" - model training이 아니라 local preference injection임을 함께 설명해야 합니다.

### 쓰면 위험한 표현

- "AI 모델 학습/파인튜닝 플랫폼"
- "RAG/embedding 기반 검색 시스템"
- "SaaS backend 또는 multi-user product"
- "자동 웹사이트 진단/크롤링/axe/Lighthouse 실행"
- "정량 성과 달성"

### 위험한 이유

- 해당 표현은 현재 코드와 문서의 shipped boundary를 넘어섭니다.
- 저장소에는 backend API, DB, auth, model training, external telemetry, 자동 crawling 구현이 확인되지 않습니다.
- 성과 수치는 README나 git history만으로 검증할 수 없습니다.
