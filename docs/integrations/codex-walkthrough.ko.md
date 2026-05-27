# Codex CLI 워크스루

[OpenAI Codex CLI](https://openai.com/codex)에서 design-ai를 사용하는 구체적인 가이드. [`docs/CODEX-INTEGRATION.md`](../CODEX-INTEGRATION.md)는 설치를, 이 문서는 워크플로를 다뤄요.

## 사전 준비

```bash
# Codex CLI 설치
npm install -g @openai/codex

# design-ai 설치
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai
# 또는
npm install -g @design-ai/cli
# (npm CLI는 Claude Code용 심볼릭 링크를 만들어요. Codex는 소스 디렉토리에서 직접 파일을 읽어요.)
```

## 설치 (60초)

```bash
cd ~/dev/design-ai      # design-ai 프로젝트 루트로 이동
codex                   # Codex CLI 실행
```

이게 다예요. Codex는 세션 시작 시 `AGENTS.md`를 자동으로 로드해요. 전체 코퍼스는 경로 참조로 접근할 수 있어요.

## 워크스루 1: 컴포넌트 스펙 작성

**목표**: 한국 핀테크 앱의 커스텀 `Banner` 컴포넌트 개발자용 스펙을 받기.

### 세션

```
You ▸ 한국 핀테크 앱용 Banner 컴포넌트 스펙을 만들어 주세요. 시스템
      상태 알림용 영구 인페이지 스트립이에요. Alert (인라인)나
      Toast (일시적)와는 달라요.

Codex ▸ component-spec-writer 스킬을 적용할게요.

      Reading: skills/component-spec-writer/PLAYBOOK.md
      Reading: knowledge/components/INDEX.md
      Cross-referencing: examples/component-banner.md
      Reading: knowledge/i18n/korean-document-style.md (KR 음성)

      [확립된 템플릿에 따라 전체 스펙 생성]

      # Banner — spec
      ## Banner vs Alert vs Toast
      | | Banner | Alert | Toast |
      ...
      [계속]
```

### 작동 방식

- Codex가 세션 시작에서 `AGENTS.md` (범용 진입점)을 읽어요.
- 사용자 프롬프트가 컴포넌트 작업을 언급하면 Codex가 매칭되는 스킬을 찾아요.
- 스킬 (`component-spec-writer/PLAYBOOK.md`)이 Codex에게 참조 읽기 → 정식 API 선택 → 아나토미 정의 순서를 안내해요.
- 한국 핀테크 컨텍스트가 `knowledge/i18n/korean-document-style.md`를 호출 (존댓말 가이드).
- 출력은 `skills/component-spec-writer/TEMPLATE.md`을 따라요.

### 왜 Codex에서 잘 작동하는지

Codex의 강점은 컨텍스트에 전체 파일을 읽는 거예요. design-ai의 디자인 — 마크다운 전용, 명확한 교차 참조, 자기 완결적 플레이북 — 이 Codex의 모델에 완벽히 맞아요. Codex 전용 설정이 필요 없어요.

## 워크스루 2: 브리프에서 디자인 시스템 생성

**목표**: 한 단락 브리프에서 완전한 디자인 시스템 부트스트랩.

### 세션

```
You ▸ design-system-builder 스킬 적용. 브리프: 프리랜서를 위한 한국
      핀테크. 인보이스, 경비 추적, 세금 추정. 차분하고, 신뢰감 있고,
      모바일 우선. Pretendard 타이포그래피. 브랜드 컬러:
      teal-blue (#0E7490).

Codex ▸ 시스템을 부트스트랩할게요. 플레이북부터 읽어요.

      Reading: skills/design-system-builder/PLAYBOOK.md
      Reading: knowledge/PRINCIPLES.md
      Reading: knowledge/colors/color-theory.md
      Reading: knowledge/colors/palettes-by-product-type.md
      Reading: knowledge/typography/font-pairings.md
      Reading: knowledge/i18n/korean-typography.md

      Phase 1: 컬러 팔레트
      [램프, semantic alias, 다크 모드, 대비 매트릭스 생성]

      Phase 2: 파운데이션
      [타이포그래피 스케일, 간격, 모서리, 그림자 토큰]

      Phase 3: 컴포넌트 베이스라인
      [Button, Input, Card, Modal API 스펙 교차 참조]

      Phase 4: 스타터 컴포넌트 셋
      [정식 합성에서 5개 컴포넌트 spec]

      Phase 5: 핸드오프 문서
      [토큰 JSON + Tailwind 설정 + Figma 변수 export]
```

### 출력 구조

Codex는 디자인 시스템을 인라인으로 출력하거나 (선호) 프로젝트의 `design/` 디렉토리에 파일로 작성해요. 프롬프트에서 명시:

```
You ▸ design-system-builder 적용. 브리프: ... 출력은 이 레포의 ./design/에
      페이즈별 (1-color, 2-foundations, 3-baseline, 4-starter, 5-handoff)로
      구성해서 작성.
```

Codex는 파일 쓰기 작업을 사용해 시스템을 머터리얼라이즈해요.

## 워크스루 3: 비평을 반영해 반복

**목표**: 스크린샷 비평을 받아 디자인 수정 스펙 생성.

### 세션

```
You ▸ design-critique 스킬이 우리 가격 페이지 스크린샷에 표시한
      이슈가 있어요. 상위 3개 비평:
      1. CTA 대비 3.1:1 — WCAG AA 실패
      2. 티어 비교가 스캔하기 어려움
      3. 한국 통화 형식 불일치 (₩50,000 vs 50,000원)

      iterate 스킬 적용해서 수정 스펙 만들어 주세요.

Codex ▸ Reading: commands/iterate.md
      Reading: knowledge/a11y/contrast.md (WCAG AA 강화용)
      Reading: knowledge/patterns/pricing-page-design.md
      Reading: knowledge/i18n/korean-typography.md (통화)
      Reading: examples/component-pricing-cards.md

      수정 스펙:

      ## 크리티컬 수정 (CRITICAL severity)

      1. CTA 대비 → foreground를 white on
         oklch(64% 0.18 30)로 변경 (현재 oklch(70% 0.16 30)).
         검증된 4.6:1.

      2. 티어 비교 → 기능별 행 정렬 테이블 그리드로 재구성. 3열 동일 너비,
         가운데 티어를 "추천"으로 브랜드 색 보더.

      3. 통화 형식 → "₩50,000"으로 통일. 일관되게
         knowledge/patterns/money-and-amount.md 규칙 적용.

      ## 변경 이력 (vs 원본)
      [diff 스타일 주석]
```

## 워크스루 4: Figma 파일 감사

**목표**: Figma 디자인에 UX 감사 + 접근성 리뷰 실행.

### 세션

```
You ▸ Figma에서 ./screens/로 화면을 export했어요. ux-audit과
      a11y-reviewer 스킬로 감사해 주세요.

Codex ▸ Reading: skills/ux-audit/PLAYBOOK.md
      Reading: agents/a11y-reviewer.md
      Reading: knowledge/a11y/contrast.md
      Reading: knowledge/a11y/keyboard-and-focus.md

      [각 화면 분석]
      [심각도별 발견사항 반환: CRITICAL, HIGH, MEDIUM, LOW]
```

실제 Figma 통합 (정적 export 대신 라이브 디자인 읽기): [Figma MCP 통합](../FIGMA-INTEGRATION.md) 참고. Codex CLI는 MCP 서버를 지원해요. `~/.codex/config.toml`에 설정.

## 일반적인 워크플로 패턴

### 패턴 1: Read-explore-produce

대부분의 디자인 작업은 이 루프에 맞아요:

```
1. 사용자가 의도를 말함.
2. Codex가 관련 스킬 식별.
3. Codex가 플레이북 + 인용된 지식 파일 읽기.
4. Codex가 템플릿에 따라 출력 생성.
5. 사용자가 후속 프롬프트로 반복.
```

### 패턴 2: Cite-everything 모드

높은 stakes 결과물의 경우 프롬프트:

```
You ▸ X 스킬 적용. 참조하는 지식 파일을 모두 footnote로 인용해 주세요.
      뒷받침되지 않는 주장은 "(판단, 출처 없음)"으로 표시.
```

이렇게 하면 Codex가 출처를 명시적으로 밝혀요.

### 패턴 3: 명시적 스킬 체인

여러 스킬을 거치는 복잡한 작업:

```
You ▸ 다음 순서로 스킬 적용:
      1. color-palette (브리프: teal-blue, 차분한 핀테크)
      2. component-spec-writer for: Button, Input, Card, Modal, Toast
      3. handoff-spec으로 통합

Codex ▸ [3개 모두 순차 실행]
```

## Codex 전용 팁

### 프롬프트의 파일 경로

Codex는 `~`와 상대 경로를 인식해요. 둘 다 작동:

```
Read ~/dev/design-ai/skills/color-palette/PLAYBOOK.md
Read ./skills/color-palette/PLAYBOOK.md
```

### MCP 통합

Codex는 `~/.codex/config.toml`을 통해 MCP 서버를 지원:

```toml
[mcp_servers.figma]
command = "npx"
args = ["-y", "figma-mcp"]
env = { FIGMA_TOKEN = "..." }
```

이 후 design-ai의 Figma 인식 스킬 (`figma-token-sync`, `design-pr-review`)이 라이브 Figma 데이터로 작동해요.

### 슬래시 명령어 없음

Codex는 슬래시 명령어 시스템이 없어요. `commands/*.md`의 슬래시 명령어는 여전히 유용해요 — Codex가 프롬프트 레시피로 읽어요:

```
You ▸ /design-from-brief 명령 실행. 브리프: [한 단락].

Codex ▸ Reading: commands/design-from-brief.md
      [레시피 실행]
```

### 사용자 정의 지시

design-ai를 시스템 전체에 사용하려면 Codex의 사용자별 지시에 추가:

```bash
mkdir -p ~/.codex/AGENTS.md.d/
ln -s ~/dev/design-ai/AGENTS.md ~/.codex/AGENTS.md.d/design-ai.md
```

(Codex 0.x+는 합성 AGENTS.md 조각을 지원.)

## 문제 해결

### Codex가 지식 파일을 못 찾음

프로젝트 루트에서 경로 확인:
```bash
ls knowledge/colors/color-theory.md
```

design-ai 외부에서 Codex 실행 시: `cd`로 design-ai에 들어가거나 `--cd ~/dev/design-ai` 전달.

### 출력이 한국 컨벤션을 무시함

명시적으로 프롬프트:

```
You ▸ 대상은 한국 B2C. 해요체 적용. 명함 90×50mm 사용 (국제 85×55 아님).
      출력 전 knowledge/i18n/ 읽으세요.
```

또는 환경 / 프로젝트 AGENTS.md 오버레이에 설정.

### 출력이 모호하거나 일반적임

코퍼스는 구체적인 내용을 알아요. Codex가 실제로 읽는지 확인. 프롬프트:

```
You ▸ 답변 전에 knowledge/components/INDEX.md과 거기 인용된 3개 레퍼런스
      구현을 읽으세요. 어느 라이브러리의 API를 사용하는지 명시.
```

## 다음

- [`docs/CODEX-INTEGRATION.md`](../CODEX-INTEGRATION.md) — 전체 설치 레퍼런스
- [`docs/integrations/cursor-walkthrough.ko.md`](cursor-walkthrough.ko.md) — Cursor 변형
- [`docs/integrations/aider-walkthrough.ko.md`](aider-walkthrough.ko.md) — Aider 변형
- [`docs/integrations/sdk-walkthrough.ko.md`](sdk-walkthrough.ko.md) — Anthropic / OpenAI SDK
- [`docs/integrations/vscode-walkthrough.ko.md`](vscode-walkthrough.ko.md) — VS Code 확장
- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — Figma / Notion / GitHub / Slack / Linear MCP
