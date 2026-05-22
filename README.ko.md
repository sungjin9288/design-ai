# Design AI

[![Audit](https://img.shields.io/badge/audit-passing-brightgreen)](https://github.com/sungjin/design-ai/actions/workflows/audit.yml)
[![Docs](https://img.shields.io/badge/docs-mkdocs-indigo)](https://sungjin9288.github.io/design-ai/)
[![Knowledge files](https://img.shields.io/badge/knowledge-91-blue)](knowledge/PRINCIPLES.md)
[![Examples](https://img.shields.io/badge/examples-124-blue)](examples/README.md)
[![Skills](https://img.shields.io/badge/skills-19-blue)](skills/README.md)

> 🇰🇷 한국어 / [🇺🇸 English](https://sungjin9288.github.io/design-ai/)

모델에 종속되지 않는 디자인 지식 베이스 + 스킬 시스템. 어떤 AI 코딩 에이전트(Claude Code, Codex CLI, Cursor, Aider)에 붙이든 20년 경력의 시니어 프로덕트 디자이너로 변신해요. 의견이 분명하고, 접근성을 기본으로 챙기며, 한국 시장을 깊이 이해해요.

> **모델이 아니에요. 파인튜닝도 아니에요.** 디자인 전문 지식을 구조화한 코퍼스 + 에이전트가 바로 실행할 수 있는 지시문이에요. 범용 LLM을 이번 세션에서만큼은 시니어 디자이너로 바꿔주는 셈이에요.

## 한눈에 보는 커버리지

| 영역 | 지식 | 워크드 예제 | 스킬 |
|---|---|---|---|
| 디자인 토큰 (W3C DTCG, OKLCH) | ✓ | ✓ | `color-palette` |
| 컴포넌트 (Ant + MUI + shadcn 합성) | ✓ | 72 specs | `component-spec-writer` |
| UX 패턴 (인증, 가격, 히어로, 폼 등) | ✓ | ✓ | `ux-audit`, `design-critique` |
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

### A. NPM (한 줄로 끝, 추천)

```bash
npx @design-ai/cli install
```

또는 글로벌 설치:

```bash
npm install -g @design-ai/cli
design-ai install
```

### B. Homebrew

```bash
brew tap sungjin/design-ai https://github.com/sungjin/design-ai.git
brew install design-ai
design-ai install
```

### C. Git clone (기여자용)

```bash
git clone https://github.com/sungjin/design-ai.git
cd design-ai
./install.sh
```

세 방법 모두 19개 스킬, 16개 명령어, 4개 에이전트가 `~/.claude/`에 `design-` 접두사로 설치돼요. Claude Code를 다시 실행하고 시도해 보세요:

```
/design-component-spec Banner
/design-motion-design 랜딩 페이지 히어로 루프
/design-spatial Vision Pro 생산성 앱
/design-from-brief 프리랜서를 위한 한국 핀테크
```

CLI 명령어: `design-ai install [--json]`, `update [--dry-run] [--json]`, `uninstall [--json]`, `status [--json]`, `list [skills|commands|agents] [--json]`, `route <brief|--from-file file|--stdin|--list> [--limit N] [--explain] [--json]`, `routes [--json]`, `prompt <brief|--from-file file|--stdin> [--out file] [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--json]`, `pack <brief|--from-file file|--stdin> [--out file] [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N] [--json]`, `learn [--remember text|--list|--export|--audit|--forget id|--clear] [--json]`, `check <artifact.md|--stdin|--examples> [--route id|--all-routes] [--issues-only] [--strict] [--json]`, `examples [query|--route id] [--limit N] [--json]`, `search <query> [--dir kind] [--limit N] [--json]`, `show <file[:line]> [--lines N:M] [--context N] [--json]`, `audit [--strict] [--quiet] [--json]`, `doctor [--strict] [--json] [--fix]`, `version [--json]`, `help [command|--json]`.

자세한 내용은 [`docs/DISTRIBUTION.ko.md`](docs/DISTRIBUTION.ko.md)를 확인하세요.

## 다른 에이전트에서 설치

| 에이전트 | 방법 |
|---|---|
| **Codex CLI** | 이 폴더를 프로젝트 루트로 열어요. `AGENTS.md`가 자동으로 읽혀요. [워크스루](docs/integrations/codex-walkthrough.md). |
| **Cursor** | 이 폴더를 열고 `AGENTS.md`를 `.cursorrules`로 심볼릭 링크하거나 복사해요. [워크스루](docs/integrations/cursor-walkthrough.md). |
| **Aider** | `AGENTS.md`를 시스템 프롬프트로 전달해요. [워크스루](docs/integrations/aider-walkthrough.md). |
| **Anthropic / OpenAI SDK** | 관련 스킬 `PLAYBOOK.md` 파일을 프롬프트에 포함시켜요. [워크스루](docs/integrations/sdk-walkthrough.md). |
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
├── knowledge/               # 91개 손으로 쓴 + 추출된 지식 파일
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
├── examples/                # 124개 워크드 예제 ("good"이 어떻게 생겼는지)
│
├── skills/                  # 19개 재사용 가능한 플레이북 (작업 중심)
├── agents/                  # 4개 서브 에이전트 (병렬 리뷰)
├── commands/                # 16개 슬래시 명령어
├── tools/                   # 유지보수 파이프라인 (추출 / 감사 / 미리보기)
└── docs/                    # 아키텍처 + 통합 가이드
```

## 처음 5분 투어

[`docs/QUICKSTART.ko.md`](docs/QUICKSTART.ko.md)를 참고하세요. 가장 짧은 경로는:

1. 설치 (`./install.sh` 또는 `npx @design-ai/cli install`).
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

업데이트가 필요할 때마다 `./tools/extractors/run-all.sh` 실행.

## 상태

전체 단계 로그는 [`docs/ROADMAP.md`](docs/ROADMAP.md), 현재 완료 범위는 [`docs/PRODUCT-READINESS.md`](docs/PRODUCT-READINESS.md)에서 확인하세요. 현재 **v4.13.0** (DRAFT closure + 90% component coverage).

핵심 디자인 컨설팅 워크플로우는 로컬 릴리스 기준으로 준비되어 있어요. 로컬 학습 선호도는 `design-ai learn`, 읽기 전용 `learn --audit`, category/limit 범위 지정이 가능한 선택형 `prompt`/`pack --with-learning`으로 사용할 수 있고, AI 모델 학습이나 fine-tuning은 여전히 현재 배포 범위 밖이에요.

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
- 릴리스 PR 또는 태그 전에는 `npm run release:check`를 core gate로 실행해요. `npm test` CLI unit test, `npm run audit:strict` 8개 audit, `git diff --check` whitespace check, `npm run package:check` package contents check, `npm run release:metadata` release metadata check, `npm run release:self-test` release self-test 검증, installed-bin과 one-shot `npm exec --package <tarball>` 경로를 포함한 `npm run package:smoke` packed-tarball smoke, human `design-ai version`과 JSON `design-ai version --json` machine-readable version metadata, `design-ai help` top-level help, `design-ai help --json` topic catalog, command alias help와 functional alias 출력, command-specific help topic 출력 검증, 세 가지 `list` catalog domain의 human/JSON 출력, human / JSON corpus discovery 출력, route JSON 출력, route catalog 출력, route stdin 입력, 명시적 `show --lines` 출력과 `route --explain` 출력 검증, unknown command failure, unknown help-topic failure, unknown list-domain failure, unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, numeric range failure 검증, prompt JSON 출력, prompt markdown 출력, prompt from-file 출력, prompt stdin 출력, pack JSON 출력, pack markdown 출력, pack from-file 출력, pack stdin 출력, prompt/pack 강제 `--out` overwrite 및 prompt/pack file-write confirmation, check examples 출력, check artifact 출력, check stdin 출력, check all-routes 출력, human `design-ai audit --strict --quiet` 출력과 JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, `design-ai doctor --strict` human diagnostics 출력, `design-ai doctor --json` machine-readable diagnostics 출력, human `design-ai install` 출력과 `design-ai install --json` machine-readable install lifecycle output, human `design-ai status` 출력과 JSON status, `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` 출력과 `design-ai uninstall --json` machine-readable uninstall lifecycle output 검증을 한 번에 확인해요.
- npm publish가 끝난 뒤에는 `npm run registry:smoke`로 공개 `npm exec --package` 설치 경로, human `design-ai version`과 JSON `design-ai version --json` machine-readable version metadata, `design-ai help` top-level help, `design-ai help --json` topic catalog, functional alias 출력, 세 가지 `list` catalog domain의 human/JSON 출력, human / JSON corpus discovery 출력, route JSON 출력, route catalog 출력, route stdin 입력, 명시적 `show --lines` 출력과 `route --explain` 출력 검증, unknown command failure, unknown help-topic failure, unknown list-domain failure, unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, numeric range failure 검증, prompt JSON 출력, prompt markdown 출력, prompt from-file 출력, prompt stdin 출력, pack JSON 출력, pack markdown 출력, pack from-file 출력, pack stdin 출력, prompt/pack 강제 `--out` overwrite 및 prompt/pack file-write confirmation, check examples 출력, check artifact 출력, check stdin 출력, check all-routes 출력, human `design-ai audit --strict --quiet` 출력과 JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, `design-ai doctor --strict` human diagnostics 출력, `design-ai doctor --json` machine-readable diagnostics 출력, human `design-ai install` 출력과 `design-ai install --json` machine-readable install lifecycle output, human `design-ai status` 출력과 JSON status, `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` 출력과 `design-ai uninstall --json` machine-readable uninstall lifecycle output을 확인해요.
- 손으로 쓴 지식 파일은 `<!-- hand-written -->` 마커 사용.
- 스킬 PLAYBOOK은 verification phase 체크리스트 포함.
- 한국어 문자열은 한국어로 직접 작성 (기계 번역 금지).
- 모든 검사 통과.
- CI에 올리기 전 GitHub workflow와 가까운 로컬 검증이 필요하면 `npm run ci:local`을 실행하세요. `release:check`, Python syntax check, knowledge size budget, VS Code extension compile/unit test, MkDocs build, docs deployment workflow와 같은 MkDocs warning policy를 한 번에 확인해요. 이 정책은 non-`refs/` warning을 막고, refs-only warning도 승인된 baseline 이상 늘어나지 않게 제한해요.

## 라이선스

MIT. [LICENSE](https://github.com/sungjin/design-ai/blob/main/LICENSE) 참조.

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
