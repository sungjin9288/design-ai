# OKKY 포스트 초안

대상: <https://okky.kr/community/qna> (질문/답변) 또는 자유게시판.

## 제목 후보

1. `[공유] AI 코딩 도구를 시니어 프로덕트 디자이너로 만드는 오픈소스 — design-ai v4.0`
2. `Claude Code / Cursor / Codex에서 한국 시장 디자인 작업 자동화하기 (오픈소스)`
3. `한국 핀테크 컨벤션 내장된 디자인 지식 베이스 만들었어요 (model-agnostic, MIT)`

가장 안전한 선택: **1번** (자랑형 아닌 공유형, 결과물 명시).

## 본문 (해요체)

```
안녕하세요, OKKY 여러분.

지난 몇 개월 동안 만들어 온 오픈소스 프로젝트가 v4.0 stable에
도달해서 공유드려요.

# design-ai

design-ai는 AI 코딩 에이전트(Claude Code / Codex CLI / Cursor /
Aider 등)를 시니어 프로덕트 디자이너처럼 동작하게 만드는 지식
베이스예요. 한국 시장 컨벤션이 기본 내장되어 있어요.

## 뭐가 들어 있나요

- 지식 파일 91개 — Ant Design + MUI + shadcn-ui에서 종합한 토큰 /
  컴포넌트 / 모션 / 일러스트 / 인쇄 / 영상 / 게임 UI / 음성 /
  공간 디자인.
- 워크드 예제 160개 — 컬러 팔레트, 컴포넌트 스펙, 디자인 시스템
  부트스트랩 등.
- 스킬 19개 + 슬래시 커맨드 15개 + 리뷰 에이전트 4개.
- 통합 워크스루 5개 (Codex / Cursor / Aider / SDK / VS Code) —
  영문 + 한국어 둘 다.

## 한국 시장 깊이

이 부분이 다른 디자인 시스템 자료와 차별점이에요:

- **결제**: Toss / KakaoPay / NaverPay 비교, 본인인증
  (PASS / NICE / KCB), 청약철회, 표시광고법.
- **타이포그래피**: Pretendard 우선, fallback 체인, 한글 광학
  보정.
- **음성 / 챗봇**: 해요체 vs 합쇼체 분기, Bixby / Clova / NUGU /
  카카오 i 컨벤션.
- **게임 UI**: 확률 표시 의무, GRAC 등급, PC방 사용성.
- **영상**: KFDA / KFTC 광고 표시, 자막 컨벤션.
- **인쇄**: 명함 90×50, 분리배출 표시, KFDA / KATS 규제.

## 모델 무관 (model-agnostic)

같은 마크다운 파일이 다음 환경에서 모두 작동해요:

- Claude Code (스킬 + 커맨드 + 에이전트)
- Codex CLI (AGENTS.md 컨벤션)
- Cursor (.cursorrules에 경로 추가)
- Aider (--read 플래그)
- VS Code 확장 (사이드바 탐색)
- 또는 그냥 시스템 프롬프트로 LLM에 직접 주입

## 시작하기

가장 빠른 방법:

```
npx @design-ai/cli install
```

이러면 Claude Code에 심볼릭 링크로 설치돼서 슬래시 커맨드와
스킬 자동 로딩이 바로 동작해요.

수동 설치 / Cursor / Codex / Aider 가이드는 README에 있어요:
https://github.com/sungjin9288/design-ai

한국어 문서:
- README.ko.md
- QUICKSTART.ko.md
- USING.ko.md (사용 가이드)
- AGENTS.ko.md
- DISTRIBUTION.ko.md
- 5개 도구 통합 워크스루 .ko.md

## 왜 만들었나요

기존 디자인 시스템 자료(Material 3, Polaris 등)는 훌륭하지만
한국 시장 컨벤션이 거의 없어요. 한국 디자이너 / 개발자가 AI 도구
로 디자인 작업할 때 매번 "Toss는 어떻게 하지?", "Pretendard
fallback은?", "본인인증 UX는?"을 직접 알려줘야 했어요.

design-ai는 그걸 한 번 정리해서 어떤 AI 도구든 바로 쓸 수
있게 만들어요.

## 라이선스

MIT — 상업용 사용 / 포크 / 번역 모두 자유.

## 피드백

- GitHub Issues에 버그 / 제안 환영해요.
- 한국 디자인 시스템에서 빠진 컨벤션 (예: 특정 핀테크 패턴, 특정
  규제) 있으면 말씀해 주세요.
- 한국어 번역 / 콘텐츠 기여도 환영해요 (CONTRIBUTING.ko.md
  참고).

긴 글 읽어 주셔서 감사합니다. 의견 / 질문 댓글로 부탁드려요.

— Sungjin Park
```

## 답글 준비 (예상 질문)

### "Claude만 쓰는 사람 입장에서는 그냥 Claude 스킬만 있어도 충분하지 않나요?"

> 충분해요. design-ai의 스킬들도 Claude Code 스킬 시스템으로
> 구현되어 있어서 Claude만 쓰시면 그대로 활용 가능합니다.
>
> 모델 무관 설계는 회사 / 팀 단위에서 의미가 커요 — 디자이너는
> Cursor를 쓰고 개발자는 Claude Code를 쓰는 팀에서, 같은 지식
> 베이스를 둘 다 참조할 수 있어요.

### "한국 컨벤션 부분이 정확한가요? 출처는?"

> 모든 한국 관련 파일은 핸드라이팅이고, 출처를 frontmatter에
> 명시하거나 본문에 링크해요. KFDA / KFTC / GRAC는 공식
> 가이드라인 문서, 핀테크 컨벤션은 실제 Toss / Kakao / Naver
> 앱 분석 + 공시 자료에서 가져왔어요.
>
> 틀린 부분 발견하시면 GitHub Issues에 부탁드려요 — 즉시
> 수정할게요.

### "Cursor에서 어떻게 쓰면 가장 좋아요?"

> docs/integrations/cursor-walkthrough.ko.md에 5개 워크드 세션이
> 있어요 (인라인 spec / 기존 감사 / Figma 비평 / 토큰 생성 /
> Cmd+K 인플레이스 편집). 거기서 시작하시면 가장 빨라요.

### "디자이너 일자리 뺏는 거 아닌가요?"

> 아니에요. design-ai는 LLM이 시니어 디자이너 *수준의 출력을*
> 내도록 돕는 도구지, 디자이너를 대체하는 게 아니에요. 실무
> 시니어가 봐야 할 디자인 결정 (브랜드 정체성, 사용자 연구,
> 우선순위) 은 여전히 사람의 영역이고, design-ai는 그 결정에
> 따른 *세부 산출물* (토큰 / 컴포넌트 / 워크플로) 생성을
> 자동화해요.
>
> 1인 / 소규모 스타트업에서는 시간 절약 효과가 크고, 큰 팀에서는
> "주니어 디자이너 + design-ai = 시니어 수준" 패턴으로 활용
> 가능해요.

## 포스팅 팁

- **한국 시간 오전 9-11시**가 OKKY 트래픽 피크.
- 첫 30분 내 댓글 5개 이상이면 추천글 영역 진입 확률 높음.
- 코드 블록은 OKKY 마크다운 지원 확인 후 (안 되면 인라인 코드로
  대체).
- 답글에서 자랑하지 말기. "도움 됐다면 좋겠어요" 톤 유지.
