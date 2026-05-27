# hashnode 블로그 포스트 초안

대상: hashnode.com (개인 블로그) — `#korea`, `#design`, `#ai`, `#claude`, `#opensource` 태그.

## 제목

```
AI 코딩 도구를 시니어 프로덕트 디자이너로 — design-ai v4.0 회고
```

부제 (subtitle):
```
한국 시장 컨벤션 내장된 디자인 지식 베이스를 32 단계에 걸쳐 만들고
v4.0 stable에 도달한 이야기
```

## 본문

```markdown
지난 몇 개월, 개인 사이드 프로젝트로 시작한 design-ai가 v4.0 stable에
도달했어요. v2.0(55개 지식 파일 / 1개 배포 채널)에서 v4.0(91개 / 4개
채널 / EN+KO 2개 언어 / 6개 CI 감사)까지 32 단계로 진화한 과정을
정리해 봐요.

## TL;DR

design-ai는 모든 AI 코딩 에이전트(Claude Code / Codex CLI / Cursor /
Aider)를 시니어 프로덕트 디자이너처럼 동작하게 만드는 모델 무관
지식 베이스예요. 한국 핀테크 / SaaS 컨벤션이 기본 내장돼 있어요.

```bash
npx @design-ai/cli install
```

GitHub: https://github.com/sungjin9288/design-ai
라이선스: MIT.

## 동기 — 왜 만들었나

기존 디자인 시스템 자료(Material 3, Polaris, Carbon, Ant Design)는
훌륭하지만 한국 시장 디테일이 거의 없어요:

- Toss / KakaoPay / NaverPay 결제 흐름 차이
- 본인인증(PASS / NICE / KCB) 통합 패턴
- Pretendard 폰트 fallback 체인
- 해요체 vs 합쇼체 챗봇 톤 분기
- 확률 표시 / GRAC 등급 (게임 UI)
- 분리배출 표시 / KFDA / KATS 규제 (인쇄)

AI 도구로 디자인 작업할 때마다 이걸 다시 알려줘야 했어요. 한 번
정리해서 모든 도구가 참조하게 만들면 좋겠다는 생각에서 시작했어요.

## 4 계층 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  에이전트 인터페이스 (AGENTS.md, CLAUDE.md)                 │
└────────────────────────────────┬────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────┐
│  스킬 + 에이전트 + 커맨드 (skills/ agents/ commands/)        │
└────────────────────────────────┬────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────┐
│  지식 베이스 (knowledge/) — 91개, 모두 stable / versioned    │
└────────────────────────────────┬────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────┐
│  소스 자료 (refs/) — Ant + MUI + shadcn sparse-clone         │
└─────────────────────────────────────────────────────────────┘
```

핵심: **마크다운이 진실의 원천**. Claude 전용 스킬 파일이 아닌
일반 마크다운으로 인코딩해서, Codex CLI / Cursor / Aider / VS Code
에서 모두 살아남아요.

## 4 가지 전략적 선택

### 1. 지식 우선, 스킬 다음

초기에는 스킬을 더 많이 추가하고 싶었어요. 하지만 스킬은 얇아요 —
지식을 가리키는 플레이북이에요. 지식 깊이 없이는 스킬이 일반적인
출력만 내요.

v2.x는 도메인 깊이(모션 / 일러스트 / 인쇄 / 영상 / 게임 UI / 음성 /
공간)에 집중했고, v2.7 이후 새 스킬은 거의 추가 안 했어요. 결과:
출력 품질이 ~~생성형 AI 답변~~ → ~~디자인 시스템 가이드~~ → 시니어
디자인 리뷰 수준으로 올라갔어요.

### 2. 컨텐츠 양 늘리기 전에 배포 가능하게 만들기

v3.0–3.4는 코퍼스를 *설치 가능하게* 만드는 데 집중했어요:

- npm CLI (`@design-ai/cli`)
- Homebrew formula
- 공개 doc 사이트 (mkdocs-material)
- VS Code 확장
- Claude Code plugin manifest

당시 컴포넌트 커버리지는 30% 정도였어요. 70%까지 올리고 싶은
유혹이 있었지만, **adopters가 설치할 수 있는 30%** > **private repo
에 갇힌 70%** 라는 판단이었어요.

이후 v3.x에서 커버리지를 55%까지 올렸어요.

### 3. 한국 시장을 처음부터 일등 시민으로

도메인 단계마다 한국 컨벤션을 *추가로 첨부*가 아니라 *동등한 깊이로*
포함했어요. v3.6에서 영문 → 한국어 번역(README, QUICKSTART, AGENTS,
DISTRIBUTION)이 자연스럽게 이어졌고, v3.10에서 5개 통합 워크스루
도, v4.1에서 USING / CONTRIBUTING / ARCHITECTURE까지 한국어로 갖춰
졌어요.

번역 원칙:
- 직역 거부 — 자연스러운 한국어 우선.
- 어댑터 대상은 해요체, 법적 / 공식은 합쇼체.
- 코드 / 명령어는 영문 그대로.
- 한국 브랜드 / 컨벤션은 한국어 유지.
- `korean-copy-check.py` 감사가 영문 UI 문구 유출을 자동 검사.

### 4. 감사 주도 품질

PR마다 6개 감사가 게이팅:

| # | 감사 | 목적 |
|---|---|---|
| 1 | frontmatter-check | YAML + 버전 필드 |
| 2 | link-check | 내부 링크 360+ 해석 |
| 3 | korean-copy-check | 한국어 voice / typography |
| 4 | check-coverage | 컴포넌트 커버리지 리포트 |
| 5 | integration-check | 통합 워크스루 완전성 |
| 6 | stale-check | 지식 신선도 (>12개월 = CI 실패) |

감사 개수가 4개 → 6개로 늘어난 만큼 회귀(regression) 사례가
줄었어요. v3.12에서 추가한 stale-check은 v3.11의 versioned
frontmatter 위에 만들어진 것 — 인프라가 인프라를 만들어요.

## v2.0 → v4.0 한눈에

| 표면 | v2.0 | v4.0 |
|---|---|---|
| 지식 파일 | 55 | 91 |
| 워크드 예제 | 83 | 160 |
| 스킬 | 12 | 19 |
| 슬래시 커맨드 | 8 | 15 |
| 컴포넌트 커버리지 | ~24% | 55.3% |
| 배포 채널 | 1 | 4 |
| 통합 워크스루 | 0 | 5 (각각 EN+KO) |
| 사이트 언어 | 0 | 2 |
| CI 감사 | 4 | 6 |

## 실패한 패턴

### 일반 영문 우선 → 자동 번역

초기 한국어 콘텐츠는 영문 작성 후 자동 번역으로 시도했는데,
어색해서 폐기했어요. 지금은 한국어 파일을 처음부터 한국어로 작성.
korean-copy-check가 자동 번역 흔적을 잡아내요.

### 커버리지 push 피로

v3.3 / v3.5 / v3.7 / v3.9 — 4 번의 커버리지 push 후 한계 효용이
줄었어요. 남은 캐노니컬은 대부분 sub-component(Step.Item, Form.Field
등)나 transition primitive 라 한 번에 큰 진전이 어려워요. v3.11에서
여섯 번째 커버리지 push 대신 versioned frontmatter(인프라)로
전환한 게 결과적으로 옳았어요.

## v4.0 — 안정 약속

v4.0은 그래듀에이션 릴리스예요. 8 개 표면(지식 파일 / 스킬 / 커맨드
/ 에이전트 / CLI / plugin / VS Code / doc 사이트)이 API stable.
deprecation 정책: 4.x에서 deprecate → 4.x 동안 유지 → 5.0에서 제거.

## 다음 — 4.x 로드맵

- VS Code marketplace 게시 (1.0.0).
- 커버리지 push 55% → 70%.
- 시맨틱 검색 인덱스 (Algolia / Typesense).
- 컴포넌트 spec 추출기 v2 (TS AST 파싱).
- 분기별 stability 재검토 의식 (Q마다).

## 시작하기

```bash
# 가장 빠른 방법
npx @design-ai/cli install

# 또는 git clone
git clone https://github.com/sungjin9288/design-ai
cd design-ai && ./install.sh

# Homebrew (macOS)
brew tap sungjin9288/design-ai
brew install design-ai
```

설치 후:
- Claude Code: `/design-design-review`, `/design-palette-from-brand`
  등 슬래시 커맨드 사용 가능.
- Codex CLI: `cd /path/to/design-ai && codex "..."`.
- Cursor / Aider: `docs/integrations/` 워크스루 참고.

## 의견 환영해요

- GitHub Issues: 버그 / 제안 / KR 컨벤션 추가 요청.
- 한국어 번역 / 콘텐츠 기여 (`docs/CONTRIBUTING.ko.md`).
- 사용 후기 / Figma + Cursor 워크플로 등 케이스 공유 환영.

긴 글 읽어 주셔서 감사해요.

— [@sungjin9288](https://github.com/sungjin)
```

## 카드 / 썸네일 (소셜 미디어용)

hashnode가 자동으로 og:image 생성하지만, 직접 만들면 좋아요:

- 1200×630 px
- 좌측: design-ai 로고(미정 — 임시로 큰 monospace `design-ai`)
- 우측: stats card (91 knowledge / 19 skills / 4 channels / 2 languages)
- 하단: `npx @design-ai/cli install`
- 배경: 브랜드 컬러 (TBD — 임시 dark navy + cyan accent)

## 태그

`#korea` `#design` `#ai` `#claude` `#opensource` `#designsystem`
`#typescript` `#cli`

## 발행 시기

한국 시간 오전 9-11시 (KST UTC+9). 화 / 수 / 목 추천. 발행 직후
Twitter / X에 링크 공유 (별도 thread 초안 참고).
