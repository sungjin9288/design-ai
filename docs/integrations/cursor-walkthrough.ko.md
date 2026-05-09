# Cursor 워크스루

[Cursor IDE](https://cursor.sh)에서 design-ai를 사용하는 구체적인 가이드. [`docs/CURSOR-INTEGRATION.md`](../CURSOR-INTEGRATION.md)는 설치를, 이 문서는 워크플로를 다뤄요.

## 사전 준비

```bash
# Cursor 설치 (cursor.sh)
# design-ai 설치
git clone https://github.com/sungjin/design-ai.git ~/dev/design-ai
```

## 설치 (90초)

### 옵션 A: 사용 프로젝트의 `.cursorrules`

가장 흔한 패턴. design-ai 전문성을 원하는 프로젝트에서 `.cursorrules` 생성:

```bash
cd ~/projects/my-app
cat > .cursorrules <<'EOF'
당신은 UI/UX, 디자인 시스템, 접근성(WCAG 2.1 AA), 한국 시장 디자인에
20년 이상의 경력을 가진 시니어 프로덕트 디자이너입니다.

디자인 작업에서 다음 프로토콜을 따르세요:
1. /Users/sungjin/dev/design-ai/AGENTS.md (범용 진입점) 읽기.
2. /Users/sungjin/dev/design-ai/knowledge/PRINCIPLES.md (30개 핵심 규칙) 읽기.
3. /Users/sungjin/dev/design-ai/skills/<skill-name>/PLAYBOOK.md에서 매칭 스킬 찾기.
4. 적용. 모든 주장에 대해 지식 파일 인용.
5. 한국어 콘텐츠는 Pretendard + 해요체 (B2C) 또는 합쇼체 (격식) 기본.
6. 출처 없는 주장은 "(판단, 출처 없음)" 표시.

사용 가능한 스킬:
- color-palette, component-spec-writer, ux-audit, design-critique
- design-system-builder, handoff-spec, design-system-qa, design-pr-review
- figma-token-sync, design-broadcast, document-author, slide-deck-author
- motion-designer, illustration-designer, print-designer, video-designer
- game-ui-designer, conversational-ui-designer, spatial-designer

스킬은 /Users/sungjin/dev/design-ai/skills/<name>/PLAYBOOK.md에 있어요.
EOF
```

Cursor는 채팅 시작 시 `.cursorrules`를 자동 로드해요.

### 옵션 B: design-ai를 워크스페이스 폴더로 추가

```
File → Add Folder to Workspace → ~/dev/design-ai
```

이후 Cursor 채팅에서 `@`로 파일 참조:

```
@design-ai/skills/color-palette/PLAYBOOK.md teal-blue 핀테크 앱에 적용해 주세요.
```

`@` 자동완성이 전체 워크스페이스를 검색해요. design-ai의 구조화된 트리가 깔끔하게 보여요.

## 워크스루 1: 인라인 컴포넌트 스펙

**목표**: 앱 코드베이스에서 작업하면서 Cursor에 Banner 컴포넌트 스펙 요청 후 구현.

### 세션

```
You ▸ (src/components/Banner.tsx 열려 있음)
      @design-ai/skills/component-spec-writer/PLAYBOOK.md
      @design-ai/examples/component-banner.md

      우리 시스템용 Banner 컴포넌트 스펙 만들어 주세요. 시스템 상태용
      영구 인페이지 스트립. 변형: info / success / warning / error /
      promo. 닫기 가능. 한국어 카피.

Cursor ▸ component-spec-writer 스킬을 적용하고 기존 Banner spec을 참조해서
       당신 코드베이스에 맞춰 적용할게요.

       [채팅에 인라인으로 스펙 생성]
       [표 형식 API, 아나토미, 상태, 토큰 포함]

You ▸  이 스펙을 React 컴포넌트로 이 파일에 구현해 주세요. 우리 토큰
       시스템 (`var(--color-banner-bg-info)` 등) 사용. dismiss 버튼은
       src/components/Alert.tsx의 패턴을 따라 주세요.

Cursor ▸ [Banner.tsx 구현 생성]
```

두 단계 워크플로 — **스펙 먼저, 구현 그 다음** — 이 핵심 Cursor 패턴이에요. 스펙은 지식 산출물; 구현은 코드.

## 워크스루 2: 기존 컴포넌트 감사

**목표**: Cursor가 현재 Button 컴포넌트를 design-ai 스펙과 비교 검토.

### 세션

```
You ▸ src/components/Button.tsx와 @design-ai/examples/component-button.md를
      나란히 열어 주세요.

      내 Button을 스펙에 대비해 감사해 주세요. 누락된 변형, 누락된
      상태, 접근성 격차, 한국 컨텐츠 고려사항 표시.

Cursor ▸ Button.tsx와 component-button.md 비교 중.

       발견사항:

       [HIGH] `loading` 상태 누락. 스펙 "States" 섹션은 spinner +
       비활성 이벤트가 있는 loading 변형 요구. 컴포넌트에 loading
       prop 없음.

       [HIGH] `asChild` 지원 누락. 스펙 "Composition patterns" → asChild가
       Button을 Link 또는 다른 슬롯으로 렌더링하도록 함. 현재는 button
       전용.

       [MEDIUM] 터치 타겟. 스펙은 모바일 primary에 ≥ 44pt 요구; 현재
       `size="sm"`은 32px 높이. 데스크톱 secondary에는 OK; 모바일
       primary에는 실패.

       [LOW] 한국어: IME 고려 없음. Button submit으로 가는 입력의 경우
       IME composition이 Enter를 삼킬 수 있음. compositionend를
       존중하는 Form의 submit 핸들러로 감싸기 권장.

       [파일 diff와 함께 권고사항]
```

이는 컴포넌트별로 적용한 `design-system-qa` 스킬이에요. 기존 코드베이스 품질을 spec으로 끌어올리는 강력한 방법.

## 워크스루 3: Figma 스크린샷 반복

**목표**: Figma 스크린샷을 붙여넣고 구체적인 수정과 함께 비평 받기.

### 세션

```
You ▸ [screenshot.png를 채팅에 붙여넣기]
      @design-ai/agents/design-critic.md
      @design-ai/agents/a11y-reviewer.md

      이 hero 섹션 비평. 한국 핀테크 audience.

Cursor ▸ design-critic + a11y-reviewer를 병렬 실행 중.

       최우선 권고:
       헤드라인이 메시지의 70%를 전달하지만 24px Inter Light 사용.
       한국 타겟 사용자에겐 Light weight가 라틴에서 의미하는 따뜻함이
       전달되지 않음. Pretendard 600 Semibold로 모바일 32px,
       데스크톱 48px로 강화하세요.

       [CRITICAL]
       - CTA 대비 3.4:1 (oklch(70% 0.16 240) 위 흰색 텍스트)이
         WCAG AA 실패. 배경을 oklch(58% 0.18 240)로 강화해서 4.5:1
         만족.

       [HIGH]
       - 서브 헤드라인이 `당신의 ...` 사용 — 너무 격식-거리감.
         `~해요`로 재작성: "여러분의 송금을 더 쉽게 만들어요".
       - 30% 세일 배지가 CTA 근처에서 주의를 끌어요. 카드 우상단으로
         이동하거나 제거.

       [제안 재작성]
```

## 워크스루 4: 브랜드 브리프에서 토큰 생성

**목표**: 브랜드 브리프에서 디자인 토큰 파일 부트스트랩, CSS와 Tailwind config로 export.

### 세션

```
You ▸ @design-ai/skills/color-palette/PLAYBOOK.md

      프리랜서를 위한 한국 핀테크용 전체 팔레트 생성. 브랜드: 신뢰감 있고,
      차분하고, 모던. Seed: oklch(56% 0.16 244). 출력:
      src/tokens/colors.css (CSS vars) + tailwind.config.ts
      (colors 확장). 다크 모드 포함.

Cursor ▸ [플레이북 읽기]
       [당신 프로젝트에 두 파일 생성]

You ▸  이제 spec에 따라 semantic alias (--color-primary-default 등)
       추가. 그리고 colors.css 위에 주석 블록으로 대비 매트릭스 추가.

Cursor ▸ [파일 업데이트]
```

## 워크스루 5: Cursor의 `Cmd+K`로 인플레이스 편집

빠른 반복 루프를 위해, Cursor의 `Cmd+K` (인라인 편집)이 design-ai 컨텍스트로 작동해요. 규칙을 글로벌로 설정하면.

```
[문제 있는 JSX 블록 선택]
[Cmd+K]
"우리 색상 토큰 사용해서 design-ai의 component-button.md에 있는
 'destructive' 변형 일치시켜 주세요."
```

Cursor가 워크스페이스 컨텍스트를 통해 spec을 읽고 인플레이스 재작성.

## Cursor 전용 팁

### MCP 서버

Cursor 0.40+ MCP 지원. 디자인 인식 MCP 추가:

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-mcp"],
      "env": { "FIGMA_TOKEN": "..." }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "..." }
    }
  }
}
```

이후 design-ai의 Figma + GitHub 인식 스킬 (`figma-token-sync`, `design-pr-review`)이 라이브 데이터로 작동.

### Composer 모드

여러 파일 변경 시 (예: 5개 컴포넌트를 새 spec에 맞춰 리팩토링) Cursor Composer 사용:

```
[Composer 모드]
"@design-ai/examples/component-button.md의 destructive 변형을 src/의 모든
DangerButton 사용처에 적용. 컴포넌트, Storybook, 모든 사용처 업데이트.
우리 토큰 시스템 일치."
```

Composer가 spec을 한 번 읽고 여러 파일에 적용.

### 프로젝트별 AGENTS.md fork

큰 프로젝트의 경우 design-ai AGENTS.md를 프로젝트로 fork:

```bash
cp ~/dev/design-ai/AGENTS.md ./AGENTS.md
# 프로젝트별 오버라이드 + design-ai 경로 추가하도록 편집.
```

Cursor가 프로젝트 `AGENTS.md`를 읽고 `.cursorrules`도 읽어요.

## 문제 해결

### Cursor가 `.cursorrules`를 인식 안 함

Cursor 재시작. 또는 `Cmd+Shift+P → Developer: Reload Window`.

### `@`가 design-ai 파일 자동완성 안 됨

design-ai 폴더를 워크스페이스에 추가 (`.cursorrules`만 아니라). Cursor의 `@`는 워크스페이스 폴더만 인덱싱해요.

### 한국 컨벤션이 세션 전체에서 일관되지 않음

`.cursorrules`에 명시적 리마인더 추가:

```
한국어 콘텐츠는 항상:
- Pretendard 타이포그래피
- 해요체 (B2C) 또는 합쇼체 (격식) — 한 컴포넌트에서 섞지 말 것
- 명함 90×50mm (국제 85×55 아님)
```

### Cursor가 GPT-4 사용 (Claude 아님)

design-ai는 모델에 종속되지 않아요. 둘 다 작동. 긴 합성 작업에는 Claude Sonnet 4.6+이 약간 강하고; 코드 생성에는 GPT-4o + Claude 둘 다 작동. Cursor 모델 선택 (Cmd+/ → Model)으로 전환.

## 다음

- [`docs/CURSOR-INTEGRATION.md`](../CURSOR-INTEGRATION.md) — 전체 설치 레퍼런스
- [`docs/integrations/codex-walkthrough.ko.md`](codex-walkthrough.ko.md) — Codex CLI 변형
- [`docs/integrations/aider-walkthrough.ko.md`](aider-walkthrough.ko.md) — Aider 변형
- [`docs/integrations/sdk-walkthrough.ko.md`](sdk-walkthrough.ko.md) — Anthropic / OpenAI SDK
- [`docs/integrations/vscode-walkthrough.ko.md`](vscode-walkthrough.ko.md) — VS Code 확장
- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — MCP 서버
