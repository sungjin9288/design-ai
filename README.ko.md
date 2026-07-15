# Design AI

[![Audit](https://img.shields.io/badge/audit-passing-brightgreen)](https://github.com/sungjin9288/design-ai/actions/workflows/audit.yml)
[![Docs](https://img.shields.io/badge/docs-live-indigo)](https://sungjin9288.github.io/design-ai/ko/)
[![Knowledge files](https://img.shields.io/badge/knowledge-97-blue)](knowledge/PRINCIPLES.md)
[![Examples](https://img.shields.io/badge/examples-226-blue)](examples/README.md)
[![Skills](https://img.shields.io/badge/skills-21-blue)](skills/README.md)

> 🇰🇷 한국어 / [🇺🇸 English](https://github.com/sungjin9288/design-ai/blob/main/README.md)

모델에 종속되지 않는 디자인 지식 베이스 + 스킬 시스템. 어떤 AI 코딩 에이전트(Claude Code, Codex CLI, Cursor, Aider)에 붙이든 20년 경력의 시니어 프로덕트 디자이너로 변신해요. 의견이 분명하고, 접근성을 기본으로 챙기며, 한국 시장을 깊이 이해해요.

> **모델이 아니에요. 파인튜닝도 아니에요.** 디자인 전문 지식을 구조화한 코퍼스 + 에이전트가 바로 실행할 수 있는 지시문이에요. 범용 LLM을 이번 세션에서만큼은 시니어 디자이너로 바꿔주는 셈이에요.

> **배포 상태, 2026-07-14 확인:** GitHub Release `v5.0.0`과 npm `@design-ai/cli@5.0.0`이 공개됐어요. npm `latest`는 `5.0.0`을 가리키고, GitHub Actions Trusted Publishing 기반 SLSA provenance가 포함되며, publish workflow와 별도 live `npm run registry:smoke`가 모두 통과했어요. Homebrew formula는 `v5.0.0`에 pinning되어 있고, GitHub Pages 문서는 live 상태이며, VS Code Marketplace의 `sungjin.design-ai-vscode@0.4.1`도 계속 공개되어 있어요. 자세한 내용은 [`docs/external-status.md`](docs/external-status.md)를 확인하세요.

## 한눈에 보는 커버리지

| 영역 | 지식 | 워크드 예제 | 스킬 |
|---|---|---|---|
| 디자인 토큰 (W3C DTCG, OKLCH) | ✓ | ✓ | `color-palette` |
| 컴포넌트 (Ant + MUI + shadcn 합성) | ✓ | 210 component specs | `component-spec-writer` |
| UX 패턴 (인증, 가격, 히어로, 폼 등) | ✓ | ✓ | `ux-audit`, `design-critique` |
| 웹/앱 인터페이스 완성도 (반응, 빈도, 연속성, 중단 가능성) | ✓ | ✓ | `design-engineering-review` |
| 에이전트형 디자인 워크플로우 (MCP, artifact contract, human gate) | ✓ | ✓ | `agentic-design-development`, `website-improvement`, `design-system-builder` |
| 웹사이트 개선 컨트롤 타워 | ✓ | ✓ | `website-improvement` |
| 한국어 i18n (한글, 결제, 앱스토어, 핀테크) | ✓ | ✓ | (전 영역 적용) |
| 문서 (Diátaxis, 슬라이드 덱, 리포트, 이메일) | ✓ | ✓ | `document-author`, `slide-deck-author` |
| **모션** (CSS / Framer / GSAP / Lottie / Rive) | ✓ | 4 specs | `motion-designer` |
| **일러스트레이션** (스팟 / 히어로 / 마스코트 / SVG) | ✓ | 2 specs | `illustration-designer` |
| **인쇄** (CMYK, 재단, KFDA, 분리배출) | ✓ | 2 specs | `print-designer` |
| **비디오** (코덱, 자막, 표시광고법) | ✓ | 2 specs | `video-designer` |
| **게임 UI** (HUD / 메뉴 / 확률 표시 / PC방) | ✓ | 2 specs | `game-ui-designer` |
| **대화형** (음성, 챗봇, AI 챗 / 해요체) | ✓ | 2 specs | `conversational-ui-designer` |
| **공간 디자인** (VR / AR / Vision Pro / 멀미 방지) | ✓ | 2 specs | `spatial-designer` |

## 설치 (Claude Code)

### A. Git clone / local install

```bash
git clone https://github.com/sungjin9288/design-ai.git
cd design-ai
./install.sh
```

### B. NPM

public npm package 설치 경로예요.

```bash
npx @design-ai/cli install
```

또는 글로벌 설치:

```bash
npm install -g @design-ai/cli
design-ai install
```

### C. Homebrew (release tap 검증 이후)

```bash
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git
brew install design-ai
design-ai install
```

현재 소스는 21개 스킬, 16개 공개 슬래시 명령어, 4개 에이전트를 `~/.claude/`에 `design-` 접두사로 설치해요. Claude Code를 다시 실행하고 시도해 보세요:

```
/design-component-spec Banner
/design-motion-design 랜딩 페이지 히어로 루프
/design-spatial Vision Pro 생산성 앱
/design-website-improvement 한국 SaaS 홈페이지 전환율과 SEO 개선 컨트롤 타워
/design-from-brief 프리랜서를 위한 한국 핀테크
```

CLI에는 `design-ai start <brief|--from-file file|--stdin> ...`, 표준 `design-ai review <source.html> --brief text ...` workflow, `design-ai review-pack [id]`, 하위 수준의 `design-ai inspect <source.html> --brief text --review-pack <id> ...`, 승인 후 실행하는 `design-ai verify-browser <quality-report.json> ...`와 기존 install, route, prompt, artifact, pack, learn, check, workspace, site, corpus, audit, MCP, version, help workflow가 있어요. 전체 machine-readable 목록은 `design-ai help --json`, 각 명령의 정확한 옵션은 `design-ai help <command>`로 확인하세요.

자세한 내용은 [`docs/DISTRIBUTION.ko.md`](docs/DISTRIBUTION.ko.md)를 확인하세요.

## 다른 에이전트에서 설치

| 에이전트 | 방법 |
|---|---|
| **Codex CLI** | 이 폴더를 프로젝트 루트로 열어요. `AGENTS.md`가 자동으로 읽혀요. [워크스루](docs/integrations/codex-walkthrough.md). |
| **Claude Code / Codex MCP** | `design-ai mcp`를 local stdio MCP server로 추가해요. [MCP server guide](docs/integrations/design-ai-mcp-server.md). |
| **Cursor** | 이 폴더를 열고 `AGENTS.md`를 `.cursorrules`로 심볼릭 링크하거나 복사해요. [워크스루](docs/integrations/cursor-walkthrough.md). |
| **Aider** | `AGENTS.md`를 시스템 프롬프트로 전달해요. [워크스루](docs/integrations/aider-walkthrough.md). |
| **Anthropic / OpenAI SDK** | 관련 스킬 `PLAYBOOK.md` 파일을 프롬프트에 포함시켜요. [워크스루](docs/integrations/sdk-walkthrough.md). |
| **Node.js / Agent SDK** | `import { artifact, start, reviewHtml, inspectHtml, route, prompt, pack, search, recall, check, routes, version } from "@design-ai/cli/sdk"` — CLI 셸 실행이나 MCP 서버 없이 design-ai의 결정적 기능을 함수로 바로 호출해요. 명시적인 `learn.*` namespace를 제외하면 읽기 전용이에요. [SDK 레퍼런스](docs/SDK.md). [워크스루](docs/integrations/agent-sdk-walkthrough.md). |
| **일반 프롬프트** | 어떤 `skills/*/PLAYBOOK.md` 본문이든 붙여넣으세요 — 각각 자기 완결적이에요. |

에이전트별 설치 방법은 [`docs/USING.md`](docs/USING.md)를, 구체적인 사용 예시는 위 워크스루 링크를 참고하세요.

## 프로젝트 구조

```
design-ai/
├── AGENTS.md                # 모든 AI 에이전트의 진입점 (범용)
├── CLAUDE.md                # Claude Code 전용 오버레이
├── README.md                # 영문 안내
├── README.ko.md             # 이 파일
├── CHANGELOG.md             # 릴리스 노트
├── install.sh               # 심볼릭 링크 설치 스크립트
│
├── .claude-plugin/          # 플러그인 매니페스트 (plugin.json)
│
├── refs/                    # Sparse-clone된 업스트림 소스 (gitignored)
│
├── knowledge/               # 97개 손으로 쓴 + 추출된 지식 파일
│   ├── design-tokens/       # W3C DTCG, OKLCH, HCT
│   ├── components/          # Ant + MUI + shadcn 합성
│   ├── patterns/            # 인증, 가격, 랜딩 히어로, 브랜드, 이메일 등
│   ├── motion/              # 원칙 + 5개 심층 자료
│   ├── illustration/        # 시스템 / 스팟 / 히어로 / 마스코트 / SVG
│   ├── print/               # 기초 / 명함 / 브로슈어 / 포스터 / 패키징
│   ├── video/               # 기초 / 마케팅 / 소셜 / 인앱
│   ├── game-ui/             # 기초 / HUD / 메뉴 / 접근성
│   ├── conversational/      # 음성 / 챗봇 / AI 챗 / 한국 컨벤션
│   ├── spatial/             # VR / AR / 패널 / 편안함
│   └── i18n/                # 한국어 타이포그래피, 결제, 앱스토어 등
│
├── examples/                # 226개 워크드 예제 ("good"이 어떻게 생겼는지)
│
├── skills/                  # 21개 재사용 가능한 플레이북 (작업 중심)
├── agents/                  # 4개 서브 에이전트 (병렬 리뷰)
├── commands/                # 16개 공개 슬래시 명령어
├── tools/                   # 유지보수 파이프라인 (추출 / 감사 / 미리보기)
└── docs/                    # 아키텍처 + 통합 가이드
```

## 처음 5분 투어

[`docs/QUICKSTART.ko.md`](docs/QUICKSTART.ko.md)를 참고하세요. 가장 짧은 경로는:

1. 설치 (`./install.sh`).
2. Claude Code에서 `/design-component-spec Banner`를 시도해 보세요. Banner 컴포넌트의 개발자용 스펙(아나토미, API, 변형, 상태, 토큰, ARIA, 키보드, 엣지 케이스)을 받아요.
3. Figma 링크나 스크린샷에 대해 `/design-design-review`를 실행하세요. UX + 접근성 + 디자인 비평이 병렬로 실행돼요.

## 한국 시장 포커스

design-ai는 한국 시장을 1순위로 만들어졌고, 글로벌 시장 패리티도 함께 챙겨요:

- **한글 타이포그래피** — Pretendard / NanumSquare / 본명조 기본값. 라틴 문자와 다른 크기 + 행간 규칙.
- **한국 결제** — Toss / KakaoPay / NaverPay / Apple Pay / Samsung Pay 플로우. PASS / NICE / KCB 본인인증.
- **음성** — 합쇼체 (격식) vs 해요체 (친근) — 브랜드별 선택.
- **인쇄** — 명함 90×50mm, KFDA / KATS 규제, 분리배출 표시.
- **비디오** — 자막 컨벤션, 표시광고법 광고 표시, KFDA / KFTC 컴플라이언스.
- **게임** — PC방 문화, 확률 표시 의무, GRAC 등급, 가챠 천장.
- **주식 차트** — 한국식 빨간색=상승 / 파란색=하락 (서양과 반대) — 디자인 토큰에 인코딩됨.

국제 기본값도 그대로 사용 가능 — 한국 컨벤션은 스킬/명령어 파라미터로 옵트인이에요.

## 소스 머티리얼

이 지식은 검증된 소스에서 합성된 것이지 만들어낸 게 아니에요:

| 소스 | 이유 |
|---|---|
| [ant-design](https://github.com/ant-design/ant-design) | 성숙한 엔터프라이즈 컴포넌트 API, 빽빽한 토큰 시스템 |
| [mui/material-ui](https://github.com/mui/material-ui) | Material Design React 레퍼런스 |
| [shadcn-ui](https://github.com/shadcn-ui/ui) | 모던 Radix 기반 copy-paste 모델 |
| [material-design-icons](https://github.com/google/material-design-icons) | 정식 아이콘 셋 |
| [nerd-fonts](https://github.com/ryanoasis/nerd-fonts) | 개발자용 타이포그래피 글리프 메타데이터 |
| [material-design-lite](https://github.com/google/material-design-lite) | 역사적 CSS-first Material 레퍼런스 |
| [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | 큐레이션된 디자인 마크다운 가이드 |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | UI/UX 패턴 + 팔레트 + 폰트 페어링 |
| [open-design](https://github.com/nexu-io/open-design) | 오픈소스 디자인 시스템 레퍼런스 |
| [OpenTag](https://github.com/CopilotKit/OpenTag) | 에이전트형 inline result와 human-gated action workflow 레퍼런스 |
| [WWIT](https://wwit.design/) | 한국 앱 패턴 taxonomy 레퍼런스 |
| [React Bits](https://reactbits.dev/) | animated React component adoption gate 레퍼런스 |

유지보수자는 필요할 때 `./tools/extractors/run-all.sh`를 실행하세요. 토큰 추출은 clone 전용 유지보수 도구이며, 자세한 내용은 `tools/extractors/README.md`에 정리합니다.

## 상태

전체 단계 로그는 [`docs/ROADMAP.md`](docs/ROADMAP.md), 현재 완료 범위는 [`docs/PRODUCT-READINESS.md`](docs/PRODUCT-READINESS.md)에서 확인하세요. **v5.0.0**은 21 skills, 16 public commands, 4 review agents, 17 MCP tools, 10 SDK exports를 제공하는 현재 공개 버전이에요. `agentic-design-development` route, read-only `design_ai_site_bundle_handoff`, `design_ai_site_linked_preview`, `design_ai_artifact` tools, SDK `artifact()` adapter, 그리고 근거 기반 웹/앱 인터페이스 완성도 검토를 위한 `design-engineering-review` skill/route를 추가했어요. linked-preview operation은 root project metadata만 읽고, process 실행·URL probe·source scan·target repo 수정 없이 operator가 직접 시작하는 preview loop를 준비해요. 공통 artifact operation은 CLI, SDK, MCP, Website Console에서 `implementation-plan`, `critique-loop`, agent-readable `DESIGN.md` 계약을 같은 형태로 만들어요. dashboard chart knowledge 보강, token extraction clone-only 분리, public contract와 PR 검증 강화도 포함하며, 이전 public `extract-tokens` command 제거를 major version boundary로 명확히 기록했어요.

현재 미배포 소스에는 읽기 전용 `design-ai start` 진입 흐름, 근거 기반 HTML 품질 검사기, 명시적으로 선택하는 한국형 제품 리뷰 팩 5개, 선택형 CLI browser evidence runner, 반복 가능한 전문화 증빙용 `design-ai benchmark`가 포함되어 있어요. `design-ai review`, SDK `reviewHtml()`, MCP `design_ai_review_html`, Website Console은 시작 계획과 정적 보고서를 정확한 source identity, artifact linkage, 순서가 있는 단계, 사람의 다음 결정이 포함된 하나의 표준 세션으로 결합해요. `design-ai inspect`, SDK `inspectHtml()`, MCP `design_ai_inspect_html`은 하위 수준의 8개 lens 품질 보고서를 공유하고, `design-ai review-pack`, SDK `reviewPack()`, MCP `design_ai_review_pack`은 핀테크·커머스·SaaS·콘텐츠·게임 계약을 같은 형태로 제공해요. source contract는 21 MCP tools와 14 SDK exports예요. CLI 전용 benchmark는 새 디자인, 기존 제품 리팩터링, 한국형 제품 UX, 멀티 에이전트 인계를 다루는 합성 사례 4개를 패키지에서 실행해요. 종합 품질 점수나 실제 고객 채택 주장 없이 계약 유효성과 정확한 finding ID를 비교합니다. 정적 markup에서 확인한 결함은 위치와 함께 `confirmed`로 기록하고, interaction·motion·performance·keyboard·접근성 트리·한국어 줄바꿈과 밀도·결제 또는 확률 고지·실제 responsive 동작은 승인된 browser 또는 scenario 근거가 생기기 전까지 `unverified`로 남겨요. Website Console은 가져온 review, quality, browser JSON 원본 바이트를 보존하고 근거를 승격하지 않은 채 각 계약을 보여 주며 sidecar digest와 viewport 범위를 확인해요. Browser runner는 production browser dependency를 추가하지 않고 loopback preview만 받으며, adapter 종료 뒤 source-report digest를 다시 비교하고 자체 sidecar 파일만 `~/.design-ai/evidence/browser/` 아래에 저장해요. 사용자가 지정한 adapter는 `--yes` 이후 macOS/Linux에서 실행되어 요청된 network policy를 스스로 증명하지만 sandbox 안에서 동작하지 않으므로, target repository 수정, external write, 실행 중 변경했다가 복원한 source 여부는 `unverified`로 기록해요.

핵심 디자인 컨설팅 워크플로우는 로컬 릴리스 기준으로 준비되어 있어요. 웹사이트 개선 컨트롤 타워는 zero-dependency static Web App과 `website-improvement` route/skill/command로 제공되고, Site Profile, audit checklist, MCP readiness, refactor prompt, handoff evidence tracking, bundle export/verify/repair, linked-code preview readiness, read-only intake → human approval → target-repo implementation → browser evidence 계약을 한 번에 다뤄요. 신규 홈페이지는 live URL이 없어도 repo URL 또는 local path로 strict handoff를 만들 수 있고, `design-ai site <workspace.json> --linked-preview --json`으로 기존 root metadata에서 수동 시작 command를 확인할 수 있어요. Operator가 preview를 시작한 뒤 browser와 deployment 증빙을 추가해야 해요. 로컬 학습 선호도는 `design-ai learn`으로 관리해요 — profile bootstrap, feedback 캡처, 읽기 전용 signal registry, 반복 QA 신호에서 만드는 skill 제안, 그리고 backup/restore/curate/audit까지 전부 로컬에서만 동작하는 opt-in 기능이에요. AI 모델 학습이나 fine-tuning은 여전히 현재 배포 범위 밖이에요.

위 모든 기능이 정확히 어떤 명령과 플래그를 검증하는지 — `learn`, `site`, `workspace`의 모든 옵션 단위 상세 — 는 [`docs/RELEASE-GATES.ko.md`](docs/RELEASE-GATES.ko.md)에 정리되어 있어요.

코퍼스는 v1.7부터 CI 검사를 통과해 왔고, 현재 8개 audit으로 운영돼요:
- 프론트매터 유효성
- 내부 링크 해결
- 한국어 카피 품질
- 예제 raw hex 색상 위생
- 통합 워크스루 완성도
- 오래된 콘텐츠 최신성
- 컴포넌트 커버리지 리포트 신선도
- 모든 라우트의 대표 worked example QA

main 브랜치의 모든 커밋에서 8개 모두 통과해요.

## 기여하기

[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)를 참고하세요. 기준:
- `pip install -r docs/requirements.txt`로 문서 도구를 먼저 설치하세요. `release:check`에 MkDocs build와 warning policy가 포함돼요.
- 릴리스 PR 또는 태그 전에는 `npm run release:check`를 core gate로 실행해요. 이 명령은 `npm test`(CLI unit test), `npm run audit:strict`(8개 audit 전부), `git diff --check`(whitespace 검사), `npm run package:check`(package contents 검사), `npm run release:metadata`(release metadata + Product Readiness guard), `npm run release:self-test`(release 자체 검증), `npm run package:smoke`(packed-tarball smoke — install, `site`, `workspace`, `learn`, help/version/audit 표면 전체를 installed-bin과 one-shot `npm exec --package <tarball>` 두 경로에서 확인)를 하나로 묶어요.
- npm publish가 끝난 뒤에는 `npm run registry:smoke`로 같은 표면을 공개 `npm exec --package` 설치 경로에서 다시 확인해요.
- 손으로 쓴 지식 파일은 `<!-- hand-written -->` 마커 사용.
- 스킬 PLAYBOOK은 verification phase 체크리스트 포함.
- 한국어 문자열은 한국어로 직접 작성 (기계 번역 금지).
- 모든 검사 통과.
- CI에 올리기 전 GitHub workflow와 가까운 로컬 검증이 필요하면 `npm run ci:local`을 실행하세요. `release:check`, Python syntax check, knowledge size budget, VS Code extension compile/unit test, MkDocs build, docs deployment workflow와 같은 MkDocs warning policy를 한 번에 확인해요. 이 정책은 non-`refs/` warning을 막고, refs-only warning도 승인된 baseline 이상 늘어나지 않게 제한해요.

`release:check`, packed-tarball smoke, registry smoke가 정확히 어떤 명령과 플래그를 검증하는지 전체 목록은 [`docs/RELEASE-GATES.ko.md`](docs/RELEASE-GATES.ko.md)에 남겨뒀어요.

## 라이선스

MIT. [LICENSE](https://github.com/sungjin9288/design-ai/blob/main/LICENSE) 참조.

## 변경 이력

[CHANGELOG.md](CHANGELOG.md) 참고. 하이라이트:

- **v3.6** — 한국어 doc site i18n.
- **v3.5** — 컴포넌트 스펙 스캐폴더 + 커버리지 푸시 (30.7% → 36.2%).
- **v3.4** — 다중 에이전트 통합 워크스루 + Homebrew.
- **v3.3** — 컴포넌트 커버리지 푸시 (23.6% → 30.7%).
- **v3.2** — 공개 doc site (mkdocs).
- **v3.1** — NPM CLI 배포.
- **v3.0** — 안정화 (플러그인 매니페스트, install.sh, README, QUICKSTART).
- **v2.7** — AR / VR / 공간 디자인.
- **v2.6** — 음성 / 대화형 UI.
- **v2.5** — 게임 UI.
- **v2.4** — 비디오 콘텐츠.
- **v2.3** — 인쇄 / 물리 디자인.
- **v2.2** — 일러스트레이션 시스템.
- **v2.1** — 모션 디자인 심화.
- **v2.0** — 문서 워크드 예제 + 7개 컴포넌트 스펙.
- **v1.x** — MCP 통합, 문서 디자인 + 브랜드 + 이메일, 커버리지 푸시, 기초.
