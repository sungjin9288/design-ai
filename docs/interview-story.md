# Interview Story

## 1. 1분 프로젝트 소개

이 프로젝트는 AI coding agent가 디자인 지식과 접근성 기준을 일관되게 적용하기 어려운 문제를 해결하기 위해 시작했습니다.
저는 확인 필요 범위 내에서 Node.js CLI, Markdown knowledge base, Website Improvement Console, VS Code Extension을 중심으로 현재 구현된 design workflow toolkit을 개발했습니다.
기술적으로는 Node.js ESM, Python audit tooling, MkDocs, TypeScript VS Code API, Vanilla JS static app을 사용했고, 현재는 local-first CLI와 documentation product가 고도화 단계까지 구현되었습니다.
개발 과정에서 shipped scope와 future scope가 섞일 수 있는 문제가 있었고, 이를 Product Readiness, Roadmap, audit/release gate 문서로 분리해 관리했습니다.
이 프로젝트를 통해 agent workflow 설계, CLI 제품화, 문서 정보구조, 검증 자동화 경험을 얻었고, 향후에는 real MCP probe와 Playwright/Lighthouse/axe 자동화로 고도화할 계획입니다.

## 2. 3분 상세 설명

- 프로젝트 배경: 범용 LLM agent에게 디자인 전문가 역할을 맡기려면 prompt만으로는 부족하고, 구조화된 knowledge, workflow, examples, verification이 필요했습니다.
- 문제정의: 사용자의 brief를 적절한 디자인 작업 유형으로 분류하고, 필요한 근거 파일과 검증 기준을 함께 제공해야 했습니다.
- 기술 선택 이유: Markdown은 agent와 사람이 함께 읽을 수 있고, Node.js CLI는 npm 배포와 cross-platform 실행에 적합합니다. Python은 audit script 작성에 효율적입니다.
- 핵심 구현: `runCommand` dispatcher, `ROUTES` 기반 task routing, `learn` local profile, `site` Website Console artifact pipeline, VS Code tree provider입니다.
- 현재 상태: core design consulting workflow는 locally release-ready로 문서화되어 있으며, external launch와 일부 자동화는 future work입니다.
- 앞으로의 개선 방향: real MCP connection check, browser automation QA, backend 없는 local-first workflow의 artifact 품질 강화입니다.
- 컨설팅 경험과의 자연스러운 연결: 문제정의, 요구사항 구조화, 사용자 흐름 설계, 실행 증거 정리, 개선 로드맵 제시 역량으로 설명합니다.

## 3. 기술 면접 예상 질문 10개

| 예상 질문 | 답변 방향 | 코드 근거 | 보완 필요 지식 |
|---|---|---|---|
| CLI command는 어떻게 dispatch되나요? | `cli/bin/design-ai.mjs`가 command를 받고 `runCommand`가 handler map으로 위임한다고 설명합니다. | `cli/bin/design-ai.mjs`, `cli/lib/dispatch.mjs` | Node ESM module lifecycle |
| route 추천은 어떤 방식인가요? | keyword 기반 deterministic route이며 LLM 호출 없이 command/skill/knowledge를 매핑한다고 설명합니다. | `cli/lib/route.mjs` | 검색 ranking, BM25, semantic routing |
| Website Console은 어디에 상태를 저장하나요? | browser `localStorage`와 JSON export/import를 사용한다고 설명합니다. | `docs/website-console/app.js`, `docs/WEBSITE-IMPROVEMENT.md` | client-side persistence tradeoffs |
| `learn`은 모델 학습인가요? | 아니며 local JSON preference profile과 prompt injection이라고 명확히 말합니다. | `cli/lib/learn.mjs`, `docs/AI-LEARNING.md` | privacy by design |
| release quality는 어떻게 검증하나요? | npm scripts와 Python audit runner가 frontmatter/link/Korean copy/coverage/example QA 등을 실행한다고 설명합니다. | `package.json`, `tools/audit/run-all.py` | CI/CD quality gate design |
| backend가 없는 이유는 무엇인가요? | MVP는 local-first artifact workflow에 집중했고 target repo mutation을 피했다고 설명합니다. | `docs/WEBSITE-IMPROVEMENT.md` | backend productization roadmap |
| VS Code Extension은 무엇을 제공하나요? | skills, knowledge, examples, walkthroughs tree와 command palette를 제공한다고 설명합니다. | `vscode-extension/src/extension.ts`, `vscode-extension/src/commands.ts` | VS Code Extension API |
| 보안상 주의한 부분은 무엇인가요? | local profile, redaction, no external telemetry, MCP auth 위임을 설명합니다. | `cli/lib/learn.mjs`, `docs/AI-LEARNING.md` | secret handling, threat modeling |
| 테스트 구조는 어떻게 되어 있나요? | Node test, Python audit, package smoke, VS Code unit test가 분리되어 있다고 설명합니다. | `package.json`, `cli/lib/*.test.mjs`, `vscode-extension/test/lib.test.mjs` | integration test strategy |
| 가장 복잡한 모듈은 무엇인가요? | `cli/lib/site.mjs`가 workspace validation, MCP readiness, bundle export/check를 담당한다고 설명합니다. | `cli/lib/site.mjs` | schema validation, artifact integrity |

## 4. 프로젝트 면접 예상 질문 10개

| 예상 질문 | 답변 방향 | 근거 | 보완 필요 사항 |
|---|---|---|---|
| 이 프로젝트의 핵심 사용자는 누구인가요? | AI coding agent로 디자인 작업을 수행하는 개발자/디자이너/컨설턴트입니다. | `README.md`, `AGENTS.md` | 실제 사용자 인터뷰 |
| 경쟁 도구와 차별점은 무엇인가요? | model이 아니라 agent-readable corpus와 workflow layer라는 점입니다. | `README.md`, `docs/ARCHITECTURE.md` | 경쟁 분석 |
| 현재 가장 확실한 성과는 무엇인가요? | 구현된 CLI, static console, extension, audit pipeline입니다. | source files | 사용량 지표 |
| 아직 부족한 점은 무엇인가요? | backend, real MCP probe, browser automation, external launch evidence입니다. | `docs/PRODUCT-READINESS.md` | 출시 체크리스트 |
| 왜 Markdown 중심인가요? | 사람이 검토할 수 있고 여러 agent가 공통으로 읽을 수 있기 때문입니다. | `docs/ARCHITECTURE.md` | content governance |
| README 개선 포인트는 무엇인가요? | 구현/미구현 범위와 demo evidence를 더 짧게 분리해야 합니다. | `docs/readme-improvement.md` | screenshot/GIF |
| 수익화 가능한가요? | 현재는 개발 도구/오픈소스 성격이 강하며 수익화는 검증 필요입니다. | 저장소 근거 없음 | business model |
| 왜 static Website Console인가요? | target repo를 직접 수정하지 않는 local-first planning tool이기 때문입니다. | `docs/WEBSITE-IMPROVEMENT.md` | web app scaling |
| 팀 프로젝트인가요? | 저장소만으로는 개인/팀 기여 범위를 확정할 수 없습니다. | git metadata 추가 확인 필요 | contribution evidence |
| 다음 우선순위는 무엇인가요? | README evidence 정리, demo, real CI/registry status 확인, automation prototype입니다. | `docs/roadmap.md` | 작업 계획 |

## 5. 컨설팅 경험과의 연결 질문 5개

| 예상 질문 | 답변 방향 | 주의할 점 |
|---|---|---|
| 컨설팅 경험이 개발에 어떻게 도움이 되었나요? | 문제를 구조화하고 요구사항을 문서와 workflow로 전환하는 데 도움이 되었다고 답합니다. | 과장된 도메인 연결을 피합니다. |
| 사용자 관점은 어떻게 반영했나요? | agent 사용자의 입력 brief부터 handoff까지 흐름을 나눴다고 답합니다. | 실제 사용자 조사는 확인 필요라고 말합니다. |
| 문서화 역량은 어디에 드러나나요? | `knowledge/`, `skills/`, `docs/`, `examples/` 구조를 근거로 설명합니다. | 문서 양보다 구조와 검증을 강조합니다. |
| 개선안 도출은 어떻게 했나요? | roadmap과 readiness 문서에서 shipped/future scope를 분리했다고 답합니다. | 성과 수치를 만들지 않습니다. |
| 기술과 비즈니스 연결은 무엇인가요? | 디자인 업무의 품질 기준과 handoff 비용을 줄이는 developer tool이라고 설명합니다. | 검증되지 않은 ROI를 말하지 않습니다. |

## 6. 내가 추가로 공부해야 할 부분

- 기술: Node.js CLI architecture, schema validation, package distribution
- 아키텍처: plugin architecture, local-first app design, artifact integrity
- 보안: local secret redaction, MCP auth boundary, supply-chain security
- 배포: npm publish, Homebrew formula, VS Code Marketplace, GitHub Pages
- 테스트: e2e browser automation, package smoke, fixture design
- AI/LLM: prompt routing evaluation, retrieval architecture, preference injection limits
- CS 기초: file system semantics, process spawning, deterministic hashing
