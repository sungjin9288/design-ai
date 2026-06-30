# VS Code 워크스루

[design-ai-vscode 확장](https://github.com/sungjin9288/design-ai/tree/main/vscode-extension)을 통해 **VS Code**에서 design-ai 사용. 확장은 코퍼스를 사이드바 트리 + 빠른 선택 명령어로 노출. 어떤 AI 어시스턴트 (Copilot Chat, Continue, Cursor 등)와도 페어링해서 완전한 디자인 인식 코딩.

## 사전 준비

```bash
# design-ai 소스 설치 (현재 추천)
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai && cd ~/dev/design-ai && ./install.sh

# public publish 이후에는 npm/Homebrew 설치 경로로 local clone을 대체할 수 있어요.

# 공개 VS Code 확장 설치
code --install-extension sungjin.design-ai-vscode
# 또는 로컬 확장 개발 중에는 .vsix 사이드로드
```

## 설치 (60초)

1. design-ai 소스 설치 (위).
2. design-ai VS Code 확장 설치 또는 sideload.
3. VS Code 열기; design-ai 활동 표시줄 항목 표시 (아이콘: gradient "D").
4. 클릭 — 4개 사이드바 트리가 Skills / Knowledge / Component specs / Walkthroughs로 채워져요.

확장이 design-ai를 못 찾으면 **"Open settings"** 배너 표시 — `design-ai.path`를 설치 위치로 설정.

## 워크스루 1: 채팅에서 브라우징 + 참조

목표: AI 어시스턴트로 Banner 컴포넌트를 작성하면서 design-ai의 spec을 진리의 소스로 사용.

### 세션

```
1. design-ai 활동 표시줄 → Component specs.
2. 트리에서 component-banner.md 찾기 → 클릭 → 에디터에서 열림.
3. Copilot Chat (또는 Cursor / Continue / Claude Chat) 열기.
4. 열린 파일 참조:

You ▸ #file:component-banner.md  이 Banner spec을 src/components/Banner.tsx에
      React 컴포넌트로 구현. 우리 토큰 시스템 (var(--color-banner-bg-info) 등) 사용.

AI  ▸ [spec에 충실한 Banner.tsx 구현 생성]
```

패턴: **design-ai spec이 권위**, AI가 구현 엔진. 출력 품질 = 참조되는 spec의 품질.

## 워크스루 2: 기존 컴포넌트 감사

목표: 오래된 `Alert.tsx`를 design-ai의 spec에 맞춰 끌어올리기.

```
1. 프로젝트의 src/components/Alert.tsx 열기.
2. design-ai 사이드바 → Component specs → component-alert.md → 클릭.
3. 이제 두 파일 나란히 열림.
4. AI 어시스턴트에서:

You ▸ 두 파일 비교. Alert.tsx를 component-alert.md에 맞추기 위해 필요한
      구체적 diff 나열. CRITICAL / HIGH / MEDIUM 분류.

AI  ▸ [감사 발견사항]
```

## 워크스루 3: 스킬 PLAYBOOK에서 생성

목표: design-ai 스킬을 사용해 컬러 팔레트 부트스트랩.

```
1. design-ai 사이드바 → Skills → color-palette → 클릭 (PLAYBOOK 열림).
2. AI 어시스턴트에서:

You ▸ #file:PLAYBOOK.md  이 스킬 적용해서 프리랜서를 위한 한국 핀테크용
      팔레트 생성. 브랜드: 신뢰감, 차분함, 모던. Seed: oklch(56% 0.16 244).
      출력은 src/tokens/colors.css와 tailwind.config.ts.

AI  ▸ [플레이북을 단계별 따름; 두 파일 모두 생성]
```

PLAYBOOK 끝에 verification phase 체크리스트 있음 — 출력 후 AI에 적용 요청.

## 워크스루 4: 코퍼스 전체에서 빠른 선택

목표: 적절한 지식 파일 빨리 찾기.

```
Cmd+Shift+P → "design-ai: Open knowledge file..."
```

빠른 선택이 92개 지식 파일을 경로와 함께 나열. 입력으로 필터 — "korean", "motion", "spatial", "typography" 등. Enter로 열기.

같은 패턴:
- "design-ai: Open component spec..." → 142개 spec
- "design-ai: Open skill PLAYBOOK..." → 20개 스킬
- "design-ai: Open integration walkthrough..." → 5개 워크스루

## 워크스루 5: 멀티 파일 디자인 시스템 부트스트랩

목표: 브리프에서 전체 디자인 시스템 생성, 파일로 머터리얼라이즈.

```
1. design-ai 사이드바 → Skills → design-system-builder → 클릭.
2. design-ai 사이드바 → Skills → color-palette → cmd+클릭 (두 번째 탭에서 열기).
3. design-ai 사이드바 → Knowledge → i18n/korean-typography.md → cmd+클릭.
4. AI 어시스턴트에서:

You ▸ 스킬 순서로 적용: color-palette, design-system-builder.
      브리프: 프리랜서를 위한 한국 핀테크. 신뢰감, 차분함. Pretendard.
      Seed oklch(56% 0.16 244). 출력:
      - src/tokens/colors.css
      - src/tokens/typography.css
      - src/tokens/spacing.css
      - tailwind.config.ts

AI  ▸ [3개 참조된 파일 읽기; 4개 출력 파일 원자적 생성]
```

VS Code의 멀티 파일 편집 지원 (특히 Cursor / Copilot Edits / Continue)이 이를 깔끔히 처리.

## 설정

| 설정 | 기본값 | 사용 |
|---|---|---|
| `design-ai.path` | _(자동 탐지)_ | design-ai가 비표준 위치에 있을 때 설정 |
| `design-ai.language` | `en` | `ko`로 설정해 README / QUICKSTART / DISTRIBUTION / AGENTS의 한국어 번역 열기 |

Cmd+Shift+P → "design-ai: Open extension settings".

## 한국 팀

한국 1순위 팀의 경우:

```jsonc
// .vscode/settings.json
{
  "design-ai.language": "ko"
}
```

이제 확장을 통해 README / QUICKSTART 등을 열면 한국어 버전이 보여요. 스킬 + 지식 파일은 언어 무관 (코퍼스의 한국어 커버리지는 콘텐츠 안에 있고 별도 번역 아님).

## VS Code + AI 어시스턴트 페어링

design-ai는 **모든** AI 어시스턴트와 작동. 테스트된 조합:

| AI 어시스턴트 | design-ai 페어링 |
| --- | --- |
| **Copilot Chat** | `#file:` 참조 |
| **Cursor Chat** | `@file` 참조 |
| **Continue** | `@File` 슬래시 명령 |
| **Claude in VS Code** (사용 가능 시) | `#file:` 참조 |
| **CodeWhisperer** | 파일 열기; 채팅이 현재 파일 참조 |

패턴은 모두에서 일관: design-ai가 콘텐츠 열기; AI가 참조. 벤더 종속 없음.

## 문제 해결

### 사이드바에 "design-ai source not found" 표시

확장이 design-ai를 못 찾음. 배너의 "Open settings" 클릭, `design-ai.path`를 설치 위치로 설정:

```bash
# design-ai 설치 위치 찾기
npm root -g  # → /path/to/global/node_modules
# design-ai는 /path/to/global/node_modules/@design-ai/cli에 있음

# 또는 git clone의 경우
ls ~/dev/design-ai/.claude-plugin/plugin.json  # 마커 파일 확인
```

절대 경로 설정; VS Code 재시작.

### 트리가 비어 있음

design-ai 소스가 온전한지 확인:

```bash
ls ~/dev/design-ai/{knowledge,examples,skills,docs}
```

비어 있으면 재설치:

```bash
cd ~/dev/design-ai && git pull && ./install.sh
```

### 업데이트 반영 안 됨

```bash
# VS Code:
Cmd+Shift+P → "design-ai: Refresh tree"
```

### 한국어 파일 안 열림

`design-ai.language` 설정 확인. 한국어 변형 존재해야 함 (`README.ko.md`, `docs/QUICKSTART.ko.md` 등). 모든 파일에 한국어 번역 있는 건 아니에요.

## 다음

- [`docs/integrations/codex-walkthrough.ko.md`](codex-walkthrough.ko.md) — Codex CLI 변형
- [`docs/integrations/cursor-walkthrough.ko.md`](cursor-walkthrough.ko.md) — Cursor 변형
- [`docs/integrations/aider-walkthrough.ko.md`](aider-walkthrough.ko.md) — Aider 변형
- [`docs/integrations/sdk-walkthrough.ko.md`](sdk-walkthrough.ko.md) — Anthropic / OpenAI SDK
- [VS Code 확장 소스](https://github.com/sungjin9288/design-ai/tree/main/vscode-extension)
