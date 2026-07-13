# Case Study

## 1. 배경

- 이 프로젝트를 시작한 배경: 범용 AI coding agent가 제품 디자인, 접근성, 한국 시장 UX, 문서화 기준을 일관되게 적용하도록 돕기 위해 시작한 것으로 판단됩니다.
- 해결하려는 사용자 문제: agent가 매번 다른 prompt와 암묵적 지식에 의존하면 산출물 품질과 검증 기준이 흔들립니다.
- 이 문제가 중요한 이유: 디자인 시스템, UX audit, 문서화, handoff는 근거와 반복성이 중요합니다.
- 현재 개발 진행 상태: CLI, knowledge base, skills, examples, Website Console, VS Code Extension, audit pipeline이 구현되어 있습니다. 로컬 release gate는 통과했지만 외부 public launch와 일부 자동화는 개발 중입니다.

## 2. 문제 정의

### As-Is

- 현재 사용자는 어떤 방식으로 문제를 해결하고 있는가? 매번 별도 prompt를 작성하거나, 디자인 시스템 문서를 수동으로 찾아 agent에게 전달합니다.
- 기존 방식의 한계는 무엇인가? 요청 분류, 근거 파일, 품질 검증, handoff 형식이 매번 달라집니다.

### Pain Points

- 불편 1: agent가 디자인 원칙과 접근성 기준을 놓칠 수 있습니다.
- 불편 2: 산출물 검증이 수동이며 release gate와 연결되기 어렵습니다.
- 불편 3: 웹사이트 개선처럼 여러 tool과 단계가 필요한 업무에서 handoff 증거가 흩어집니다.

## 3. 목표

### MVP 목표

- Markdown 기반 지식 베이스, skill, command, examples를 agent가 바로 사용할 수 있게 구성합니다.
- CLI로 route, prompt, pack, check, audit, workspace, site workflow를 제공합니다.

### 기술 목표

- Node.js CLI와 Python audit runner로 로컬에서 검증 가능한 구조를 만듭니다.
- Website Console은 dependency 없는 static app으로 유지합니다.

### 사용자 목표

- 사용자가 brief를 입력하면 관련 workflow와 근거 파일을 빠르게 찾게 합니다.
- target repo 작업 전후의 실행 근거와 검증 결과를 handoff 문서로 남기게 합니다.

### 학습 목표

- agent workflow 설계, CLI 제품화, 문서 정보구조, release QA를 포트폴리오 근거로 축적합니다.

## 4. 해결 접근

- 어떤 기능으로 문제를 해결하려 했는가? route engine, prompt/pack generator, artifact checker, Website Console, local learning profile, VS Code tree view를 제공합니다.
- AI/IT 기술을 어디에 적용했는가? 모델 호출이 아니라 agent가 읽을 수 있는 knowledge, prompt, skill orchestration에 적용했습니다.
- 왜 이 기술스택을 선택했는가? Markdown은 agent와 사람이 모두 읽을 수 있고, Node.js CLI는 배포와 cross-platform 실행이 쉽습니다. Python audit은 문서 검증 스크립트 작성에 적합합니다.
- 현재 구현된 접근과 향후 목표 접근:
  - 현재: deterministic local CLI, static console, local JSON/localStorage 저장, docs site.
  - 향후: real MCP connection checks, Playwright/Lighthouse/axe automation, VS Code Webview reuse.

## 5. 구현 범위

### 구현 완료

- `design-ai` CLI entrypoint와 dispatcher
- 16개 공개 slash command 문서와 CLI canonical commands
- 20개 skills와 92개 knowledge files
- Website Improvement Console static app
- local learning preference CLI
- Python audit runner와 release scripts
- VS Code Extension 명령 및 tree providers

### 개발 중

- public launch, registry smoke 이후 운영 안정화
- Website Console 자동화 확장
- 실제 MCP 연결 검증

### 미구현 / 예정

- backend API, database sync, auth, multi-user collaboration
- model fine-tuning, private model training, embedding index
- 자동 crawling, screenshot capture, Lighthouse/axe 실행

### 이번 MVP에서 제외한 범위

- 제외한 기능: 서버 저장소, 자동 외부 tool 실행, 모델 학습, target repo 직접 수정
- 제외한 이유: 현재 제품은 agent workflow와 local handoff를 안정화하는 것이 핵심입니다.

## 6. 시스템 설계

- 전체 구조: `AGENTS.md` instructions -> `skills/commands/knowledge/examples` corpus -> `cli/` workflow -> docs site / Website Console / VS Code Extension
- 데이터 흐름: brief, Markdown, JSON export를 입력받아 route result, prompt pack, audit report, handoff bundle로 변환합니다.
- API 구조: HTTP API는 없습니다. CLI command와 static browser app이 사용 표면입니다.
- AI/LLM 처리 흐름이 있다면 설명: external LLM에 보낼 prompt와 context를 생성합니다. repo 내부에서 LLM API를 호출하지 않습니다.
- 예외 처리: CLI argument parsing과 unknown option suggestion이 `cli/lib/*`에 구현되어 있습니다.
- 보안/환경변수 처리: local learning은 `~/.design-ai/learning.json`에 저장됩니다. MCP auth token은 외부 agent 설정에 위임됩니다.
- 배포 계획: npm package metadata, Homebrew formula, GitHub Pages docs config, VS Code Extension manifest가 존재합니다. 2026-06-22 기준 public npm registry, GitHub Pages URL, VS Code Marketplace listing은 확인되지 않았습니다.

## 7. 나의 역할

- 기획: design knowledge를 agent workflow로 전환하는 제품 구조를 설계한 것으로 설명 가능합니다. 개인 기여 범위는 확인 필요입니다.
- 요구사항 정의: skill/playbook, route, readiness 문서로 요구사항을 구조화했습니다.
- 프론트엔드: Website Console static UI와 VS Code Extension UI surface를 설명할 수 있습니다.
- 백엔드: 해당 없음. backend는 미구현입니다.
- AI/LLM: prompt routing, local context packing, skill orchestration을 설명할 수 있습니다.
- 데이터 처리: local JSON profile, Website Console JSON export/import, release metadata checks를 설명할 수 있습니다.
- 배포: npm/GitHub Pages/Homebrew/VS Code Extension 배포 준비 구조와 local release gate를 설명할 수 있습니다.
- 문서화: README, docs, knowledge, examples, readiness 문서를 포트폴리오 근거로 활용할 수 있습니다.

## 8. 결과

- 구현 완료 기능: CLI, static console, extension surface, audit scripts, docs site config
- 로컬 실행 가능 여부: `npm run release:check`가 통과해 package smoke까지 확인했습니다.
- 테스트 여부: `npm test`, `npm run audit:strict`, `npm run release:check` 흐름이 검증되었습니다.
- 배포 여부: public 배포 완료 상태는 아닙니다. npm registry는 `E404`, GitHub Pages URL은 HTTP 404, VS Code Marketplace listing은 없음으로 확인되었습니다.
- 사용자 피드백: 현재 없음. 임의 생성 금지.
- 수치 성과:
  - 현재 없음. 임의 생성 금지.

## 9. 배운 점

- 기술적으로 배운 점: CLI product는 command parsing, output artifact, test, packaging이 함께 설계되어야 합니다.
- 설계에서 배운 점: model training 없이도 corpus, route, check, handoff 구조로 agent 품질을 높일 수 있습니다.
- 사용자 관점에서 배운 점: target repo를 직접 수정하지 않는 local-first boundary가 신뢰를 만듭니다.
- 다음 프로젝트에 반영할 점: 구현 범위, 미구현 범위, 검증 evidence를 처음부터 문서와 release gate에 연결합니다.

## 10. 이 프로젝트가 보여주는 역량

- 개발 역량: Node.js CLI, TypeScript extension, Python audit tooling, static app 구현
- 문제정의 역량: agent 디자인 작업을 route와 skill로 분해
- 데이터/AI 활용 역량: LLM 호출보다 prompt/context orchestration과 local preference injection에 집중
- 커뮤니케이션/문서화 역량: 사용자/개발자/agent가 읽는 문서를 같은 저장소에서 관리
- 컨설팅형 사고: 문제 구조화, 범위 관리, handoff, 검증 기준, roadmap 분리
