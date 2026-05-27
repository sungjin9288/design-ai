# Aider 워크스루

[Aider](https://aider.chat) (터미널 기반 AI 페어 프로그래머)에서 design-ai를 사용하는 구체적인 가이드. [`docs/AIDER-INTEGRATION.md`](../AIDER-INTEGRATION.md)는 설치를, 이 문서는 워크플로를 다뤄요.

## 사전 준비

```bash
pip install aider-chat
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai
```

Aider는 모델 API 키 (Anthropic, OpenAI 등) 필요:

```bash
export ANTHROPIC_API_KEY=...
# 또는
export OPENAI_API_KEY=...
```

## 설치 (60초)

```bash
cd ~/projects/my-app
aider --read ~/dev/design-ai/AGENTS.md \
      --read ~/dev/design-ai/knowledge/PRINCIPLES.md \
      --model claude-sonnet-4-6
```

`--read`는 파일을 읽기 전용 컨텍스트로 추가해요 (Aider가 수정 안 함). 영구 설정은 `.aider.conf.yml`에 추가:

```yaml
# ~/projects/my-app/.aider.conf.yml
read:
  - /Users/sungjin/dev/design-ai/AGENTS.md
  - /Users/sungjin/dev/design-ai/knowledge/PRINCIPLES.md
model: claude-sonnet-4-6
```

## 워크스루 1: 스펙에서 컴포넌트 구현 생성

**목표**: Aider가 design-ai Banner spec을 읽고 프로젝트에 작동하는 React 구현 생성.

### 세션

```
$ aider src/components/Banner.tsx \
        --read ~/dev/design-ai/examples/component-banner.md \
        --read ~/dev/design-ai/knowledge/i18n/korean-document-style.md

Aider v0.x — claude-sonnet-4-6 사용 중
Read: examples/component-banner.md
Read: knowledge/i18n/korean-document-style.md
편집 중: src/components/Banner.tsx (새 파일)

> spec에 따라 Banner 구현 주세요. 변형 info / success / warning /
  error / promo. 닫기 가능. 토큰 시스템 (var(--color-...)) 사용.
  기본값에 한국어 인식 카피.

[Aider가 구현 생성]

[Aider가 diff 제안하고 적용 요청]

> y

적용됨: src/components/Banner.tsx
```

`--read` 플래그는 Aider에게 design-ai 파일을 컨텍스트로 사용하되 수정하지 말라고 알려요. 편집은 작업 파일 (`src/components/Banner.tsx`)에만 들어가요.

## 워크스루 2: 기존 컴포넌트를 spec에 맞춰 리팩토링

**목표**: 오래된 `Alert.tsx`를 design-ai spec에 맞게 끌어올리기.

### 세션

```
$ aider src/components/Alert.tsx \
        --read ~/dev/design-ai/examples/component-alert.md \
        --read ~/dev/design-ai/knowledge/a11y/contrast.md

> 두 파일 다 읽어 주세요. Alert.tsx를 spec에 맞추기 위해 필요한 구체적
  diff 나열. 그리고 적용해 주세요.

[Aider가 읽고 5개 diff 나열, 각 적용 요청]

> 1, 3, 5만 적용. 2와 4는 건너뛰기 (제품 승인 필요).

[Aider가 부분 적용]
```

Aider의 diff별 적용은 spec 컴플라이언스에 좋아요 — 크리티컬 수정은 받아들이고 주관적인 변경은 미룰 수 있어요.

## 워크스루 3: 완전한 디자인 시스템 생성

**목표**: 브리프에서 디자인 토큰 부트스트랩, 파일로 머터리얼라이즈.

### 세션

```
$ aider \
    --read ~/dev/design-ai/skills/design-system-builder/PLAYBOOK.md \
    --read ~/dev/design-ai/skills/color-palette/PLAYBOOK.md \
    --read ~/dev/design-ai/knowledge/colors/color-theory.md \
    --read ~/dev/design-ai/knowledge/i18n/korean-typography.md \
    src/tokens/colors.css \
    src/tokens/typography.css \
    src/tokens/spacing.css \
    tailwind.config.ts

> design-system-builder 적용. 브리프: 프리랜서를 위한 한국 핀테크.
  브랜드: 신뢰감, 차분함, 모던. Seed: oklch(56% 0.16 244).
  Pretendard 타이포그래피. 4개 열린 파일에 출력. colors.css
  맨 위에 주석 블록으로 대비 매트릭스.

[Aider가 한 번의 적용 패스에서 4개 파일 모두 생성]
```

여러 파일 산출물의 경우, Aider의 "여러 파일을 한 번에 열기 + 원자적 diff 적용" 패턴이 순차적 단일 파일 생성보다 효율적이에요.

## 워크스루 4: 한 세션에서 감사 + 수정

**목표**: 화면을 a11y 감사하고, 수정 생성, 적용.

### 세션

```
$ aider \
    --read ~/dev/design-ai/agents/a11y-reviewer.md \
    --read ~/dev/design-ai/knowledge/a11y/contrast.md \
    --read ~/dev/design-ai/knowledge/a11y/keyboard-and-focus.md \
    src/screens/PricingScreen.tsx \
    src/screens/PricingScreen.css

> PricingScreen을 a11y 감사. 발견사항을 CRITICAL / HIGH / MEDIUM / LOW
  로 보고. 그리고 CRITICAL과 HIGH는 자동 수정.

[Aider가 감사하고 7개 발견사항 나열]
[CRITICAL/HIGH 4개 자동 수정]
[저우선 3개에 대해 질문]

> 일단 건너뛰기.

[Aider가 명확한 메시지로 수정 커밋]
```

## Aider 전용 패턴

### 읽기 전용 vs 편집 가능

```
aider [편집 가능 파일들] --read [읽기 전용 컨텍스트 파일들]
```

design-ai 파일은 항상 `--read` (Aider가 절대 수정 안 함). 프로젝트 파일은 편집 가능.

전형적인 세션:
- 1-3개 편집 대상 파일 (컴포넌트, CSS, 테스트)
- 5-15개 읽기 전용 design-ai 파일 (스킬 플레이북 + 관련 지식)

### 동적 컨텍스트의 `/add` and `/drop`

세션 중에:

```
> /add src/components/Button.tsx     # 편집 가능에 추가
> /read ~/dev/design-ai/examples/component-button.md   # 읽기 전용에 추가
> /drop src/components/Button.tsx    # 세션에서 제거
```

작업 범위가 중간에 바뀔 때 유용.

### 복잡한 spec을 위한 Architect 모드

Aider의 `--architect` 모드는 계획에 강력한 모델, 편집에 빠른 모델 사용:

```bash
aider --architect \
      --architect-model claude-opus-4 \
      --editor-model claude-sonnet-4-6 \
      --read ~/dev/design-ai/skills/design-system-builder/PLAYBOOK.md \
      [files...]
```

Architect 모드가 spec을 계획; editor 모델이 적용. 큰 리팩토링에 좋음.

### 변경별 자동 커밋

Aider는 기본적으로 각 적용을 자동 커밋. design-ai 워크플로에서:
- Commit 1: "design-ai spec에 맞춰 Banner 컴포넌트 추가"
- Commit 2: "브리프에서 시맨틱 컬러 토큰 추가"
- Commit 3: "a11y 리뷰에 따라 CTA 대비를 WCAG AA로 수정"

각 커밋이 작게 범위 잡힘. 리뷰 / revert / cherry-pick 쉬움.

비활성화: `--no-auto-commits`.

### 테스트 모드

```bash
aider --test-cmd "pnpm test" --auto-test
```

Aider가 각 변경 후 테스트 명령 실행. 컴포넌트 구현 시 유용 — 구현 패스 중 회귀 catch.

## 팁

### design-ai PRINCIPLES를 시스템 리마인더로 사용

```bash
aider --read ~/dev/design-ai/knowledge/PRINCIPLES.md ...
```

해당 파일은 30개 핵심 규칙을 단일 페이지로 요약. 항상 로드; 저렴.

### 스킬별 alias

흔한 워크플로용 bash alias 추가:

```bash
# ~/.bashrc
alias aider-design='aider --read ~/dev/design-ai/AGENTS.md --read ~/dev/design-ai/knowledge/PRINCIPLES.md --model claude-sonnet-4-6'
alias aider-spec='aider-design --read ~/dev/design-ai/skills/component-spec-writer/PLAYBOOK.md'
alias aider-palette='aider-design --read ~/dev/design-ai/skills/color-palette/PLAYBOOK.md'
```

이후:
```bash
aider-spec src/components/NewComponent.tsx
```

### 한국어 기본값

```bash
aider --read ~/dev/design-ai/AGENTS.md \
      --read ~/dev/design-ai/knowledge/i18n/korean-typography.md \
      --read ~/dev/design-ai/knowledge/i18n/korean-document-style.md \
      --read ~/dev/design-ai/knowledge/i18n/korean-product-conventions.md \
      [files...]
```

한국 B2C 팀의 경우 위의 read를 `.aider.conf.yml`에 굽기.

## 문제 해결

### Aider가 큰 스킬에서 컨텍스트 한도에 부딪힘

Aider는 `--read` 파일을 매 턴 컨텍스트에 보내요. 매우 큰 플레이북 + 많은 지식 파일의 경우:
- 작업당 관련 항목만 `--read`.
- `/drop`으로 컨텍스트 비우기.
- 매우 큰 세션은 더 큰 컨텍스트 모델 사용 (Claude Sonnet 4.6 ≥ 200K 토큰, GPT-4o ~ 128K).

### 출력이 design-ai 컨벤션 무시

Aider에 명시적 리마인더 (세션 중간):

```
> 제가 드린 읽기 전용 파일의 design-ai 컨벤션을 따라:
  destructive 변형 적용해 주세요.
```

또는 `AGENTS.md`가 `--read`로 로드되었는지 확인.

### 한국어 텍스트가 깨짐

Aider는 모든 주요 모델에서 한국어 작동. 한글이 `?`나 박스로 렌더링되면:
- 터미널이 UTF-8 지원하는지 확인 (대부분 지원, Windows cmd는 기본 아닐 수 있음).
- UTF-8 강제: `export PYTHONIOENCODING=utf-8`.

## 다음

- [`docs/AIDER-INTEGRATION.md`](../AIDER-INTEGRATION.md) — 전체 설치 레퍼런스
- [`docs/integrations/codex-walkthrough.ko.md`](codex-walkthrough.ko.md) — Codex CLI 변형
- [`docs/integrations/cursor-walkthrough.ko.md`](cursor-walkthrough.ko.md) — Cursor 변형
- [`docs/integrations/sdk-walkthrough.ko.md`](sdk-walkthrough.ko.md) — Anthropic / OpenAI SDK
- [`docs/integrations/vscode-walkthrough.ko.md`](vscode-walkthrough.ko.md) — VS Code 확장
