# SDK 워크스루 — Anthropic + OpenAI

Anthropic SDK 또는 OpenAI SDK를 통해 자체 코드에서 design-ai를 사용하는 방법. CLI 에이전트가 아니라 디자인 인식 AI를 제품에 임베드할 때 사용해요.

## 사전 준비

```bash
# design-ai 가져오기 (코퍼스만; SDK 사용에 CLI install 불필요)
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai

# 선택한 SDK 설치
pip install anthropic   # 또는
pip install openai

# API 키 설정
export ANTHROPIC_API_KEY=...
# 또는
export OPENAI_API_KEY=...
```

## 설치

SDK 채택의 경우 design-ai는 그냥 마크다운 파일이에요. 설치 단계 없음 — 코드가 런타임에 모델의 시스템 프롬프트로 직접 읽어요.

아래 패턴은 코퍼스의 구성 가능한 부분 집합을 로드해요:

```python
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")  # 클론 경로로 조정

def design_ai_path(rel: str) -> str:
    return (DESIGN_AI / rel).read_text(encoding="utf-8")
```

이게 다예요. 아래 워크스루는 이 primitive 위에 구축돼요.

## 패턴: design-ai를 시스템 프롬프트로

design-ai는 마크다운. 관련 파일을 시스템 프롬프트로 로드; 모델이 이를 권위 있는 컨텍스트로 취급.

### 구조

```
시스템 프롬프트 =
  AGENTS.md (범용 진입점)
  + knowledge/PRINCIPLES.md (단일 페이지 핵심 규칙)
  + skills/<skill>/PLAYBOOK.md (활성 스킬)
  + knowledge/<관련>/<파일>.md (작업별)

사용자 메시지 =
  "X 스킬 적용: <작업>"

출력 =
  스킬의 템플릿에 따름
```

## 워크스루 1: Anthropic SDK + Sonnet

```python
import anthropic
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")

def load_skill_context(skill: str, knowledge_files: list[str]) -> str:
    parts = [
        (DESIGN_AI / "AGENTS.md").read_text(),
        (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
        (DESIGN_AI / f"skills/{skill}/PLAYBOOK.md").read_text(),
    ]
    for k in knowledge_files:
        parts.append((DESIGN_AI / k).read_text())
    return "\n\n---\n\n".join(parts)

client = anthropic.Anthropic()

system = load_skill_context(
    skill="component-spec-writer",
    knowledge_files=[
        "knowledge/components/INDEX.md",
        "knowledge/i18n/korean-document-style.md",
        "examples/component-banner.md",
    ],
)

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=system,
    messages=[
        {"role": "user", "content": (
            "한국 핀테크 앱용 Banner 컴포넌트 스펙 만들어 주세요. "
            "시스템 상태 알림용 영구 인페이지 스트립. Alert (인라인)와 "
            "Toast (일시적)와 다름. 변형: info / success / warning / "
            "error / promo. 닫기 가능."
        )},
    ],
)

print(message.content[0].text)
```

### 프롬프트 캐싱과 함께 (추천)

같은 시스템 프롬프트로 반복 호출 시 프롬프트 캐싱 사용해서 코퍼스 재결제 방지:

```python
import anthropic

client = anthropic.Anthropic()

system_blocks = [
    {
        "type": "text",
        "text": (DESIGN_AI / "AGENTS.md").read_text(),
        "cache_control": {"type": "ephemeral"},
    },
    {
        "type": "text",
        "text": (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
        "cache_control": {"type": "ephemeral"},
    },
    {
        "type": "text",
        "text": (DESIGN_AI / "skills/component-spec-writer/PLAYBOOK.md").read_text(),
        "cache_control": {"type": "ephemeral"},
    },
]

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=system_blocks,  # 캐시 인식 블록 배열
    messages=[{"role": "user", "content": "Banner 컴포넌트 스펙..."}],
)
```

코퍼스가 프롬프트에 ~10-30K 토큰 기여. 캐싱과 함께라면 첫 호출 후 이어지는 호출이 캐시 히트 (5분 TTL); 비용 ~90% 감소.

## 워크스루 2: OpenAI SDK + GPT-4o

```python
import openai
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")

def load_skill_context(skill: str, knowledge_files: list[str]) -> str:
    parts = [
        (DESIGN_AI / "AGENTS.md").read_text(),
        (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
        (DESIGN_AI / f"skills/{skill}/PLAYBOOK.md").read_text(),
    ]
    for k in knowledge_files:
        parts.append((DESIGN_AI / k).read_text())
    return "\n\n---\n\n".join(parts)

client = openai.OpenAI()

system = load_skill_context(
    skill="color-palette",
    knowledge_files=[
        "knowledge/colors/color-theory.md",
        "knowledge/colors/palettes-by-product-type.md",
        "knowledge/i18n/korean-typography.md",
    ],
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": system},
        {"role": "user", "content": (
            "프리랜서를 위한 한국 핀테크용 전체 팔레트 생성. "
            "브랜드: 신뢰감 있고, 차분하고, 모던. Seed: oklch(56% 0.16 244)."
        )},
    ],
)

print(response.choices[0].message.content)
```

OpenAI의 프롬프트 캐싱 (`messages` ≥ 1024 토큰에 자동 감지)이 명시적 `cache_control` 없이도 비용 절감 처리해요.

## 워크스루 3: 긴 출력용 스트리밍

긴 디자인 시스템 부트스트랩의 경우 스트리밍 UX가 필수:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=8192,
    system=system_blocks,
    messages=[{"role": "user", "content": "design-system-builder 적용..."}],
) as stream:
    for chunk in stream.text_stream:
        print(chunk, end="", flush=True)
```

OpenAI 동등:

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "system", "content": system}, {"role": "user", "content": "..."}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

## 워크스루 4: 멀티 스킬 워크플로용 도구 사용

모델의 도구 사용 기능 활용해서 스킬 체인:

```python
tools = [
    {
        "name": "apply_skill",
        "description": "design-ai 스킬 적용. 모델이 따를 스킬의 플레이북 반환.",
        "input_schema": {
            "type": "object",
            "properties": {
                "skill": {
                    "type": "string",
                    "enum": ["color-palette", "component-spec-writer", "ux-audit", "..."],
                },
            },
            "required": ["skill"],
        },
    },
    {
        "name": "read_knowledge",
        "description": "design-ai 코퍼스에서 지식 파일 읽기.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
]

# 모델이 apply_skill 또는 read_knowledge 호출하면 핸들러가
# 해당 마크다운 파일 읽고 콘텐츠를 도구 결과로 반환.
```

이렇게 하면 모델이 모든 컨텍스트를 초기 시스템 프롬프트에 강제로 넣지 않고 동적으로 읽을 항목 선택 가능.

## 워크스루 5: 프로덕션 앱 — 디자인 인식 챗봇

실용적 예제: design-ai에 grounded된 팀용 디자인 질문 챗봇.

```python
from anthropic import Anthropic
from pathlib import Path

DESIGN_AI = Path("/Users/you/dev/design-ai")
client = Anthropic()

# 코퍼스를 단일 캐시된 시스템 프롬프트로 사전 로드.
def build_system() -> list[dict]:
    return [
        {
            "type": "text",
            "text": (DESIGN_AI / "AGENTS.md").read_text(),
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": (DESIGN_AI / "knowledge/PRINCIPLES.md").read_text(),
            "cache_control": {"type": "ephemeral"},
        },
        # 가장 많이 묻는 플레이북 사전 포함
        *[
            {
                "type": "text",
                "text": (DESIGN_AI / f"skills/{s}/PLAYBOOK.md").read_text(),
                "cache_control": {"type": "ephemeral"},
            }
            for s in ["component-spec-writer", "color-palette", "ux-audit"]
        ],
    ]

SYSTEM = build_system()

def ask(question: str) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM,
        messages=[{"role": "user", "content": question}],
    )
    return response.content[0].text

# 사용:
print(ask("Toast vs Alert vs Banner의 정식 구별은?"))
print(ask("shadcn primitive로 Form 어떻게 구성?"))
```

Slack 봇 / Discord 봇 / 웹 채팅: `ask()`를 플랫폼의 HTTP 핸들러로 감싸기. 캐시 히트율 높게 유지; 질문당 비용 ~$0.001-0.005 (Sonnet).

## SDK 채택 팁

### 비용 제어

- **코퍼스 캐시**: 반복 호출 시 90% 비용 감소.
- **필요한 것만 로드**: 92개 지식 파일 모두 포함하지 말 것. 작업별 선택 (3-7 파일)이 충분.
- **간단한 작업엔 Haiku 사용**: 컬러 팔레트 생성은 Haiku에서 잘 작동 (5배 저렴). Sonnet/Opus는 design-system-builder, ux-audit (복잡한 합성)에 예약.

### 출력 구조

design-ai 스킬은 예측 가능한 구조 (anatomy / API / states / tokens / a11y)를 생성. 프로그래밍 후처리:
- 헤딩으로 마크다운을 섹션 파싱.
- 또는 모델에 JSON 출력 지시: "같은 콘텐츠를 anatomy, api, states, tokens, a11y, edgeCases 키로 JSON."

### 제품과의 통합

흔한 패턴:
- **디자인 어시스턴트 챗봇** — 디자인 팀용 Q&A 봇.
- **PR 코멘트 봇** — 코퍼스 대비 디자인 PR 자동 리뷰.
- **내부 문서 생성기** — 브랜드 브리프 → 디자인 시스템 문서.
- **토큰 동기화 에이전트** — Figma 토큰을 코드 토큰과 비교, 조정 제안.
- **사전 출시 검사** — 컴포넌트 출시 전 design-system-qa로 감사.

### 한국어 출력

다른 에이전트와 동일: 한국어 작업에 `knowledge/i18n/` 파일 로드; 해요체 / 합쇼체 register 명시적 프롬프트.

## 레퍼런스 프로젝트

이 패턴은 Anthropic 자체 내부 디자인 도구 및 다른 오픈소스 프로젝트가 코퍼스 컨텍스트를 로드하는 방법을 반영. 비슷한 접근 사례:
- **Continue.dev** — 코드 컨텍스트 인식 코딩 어시스턴트.
- **Claude Code 자체** — SDK 레벨에서 같은 방식의 스킬 + 에이전트 사용.
- **Cursor / Windsurf / Codeium** — 관련 문서 로드하는 워크스페이스 인식 에디터.

## 문제 해결

### "컨텍스트가 너무 큼" 에러

로드된 파일 줄이기. 기본 로드:
- AGENTS.md (~3K 토큰)
- PRINCIPLES.md (~5K 토큰)
- 한 스킬 PLAYBOOK (~3-8K 토큰)
- 1-3 지식 파일 (~3-15K 토큰 각)

총: 15-50K 토큰. Sonnet 4.6 (200K) / GPT-4o (128K) 내. 이 이상 로드하면 너무 많이 로드하는 거예요.

### 모델이 스킬 컨벤션 무시

스킬 PLAYBOOK 끝에 verification phase 체크리스트 있음. 모델에 적용 프롬프트:

```
"출력 생성 후, 플레이북의 verification phase 실행. 실패한 항목 나열하고 조정."
```

### 한국 컨벤션 무시

`i18n/` 파일 명시적 로드 또는 시스템 프롬프트에 추가:

```
"대상은 한국 B2C. 해요체 음성 적용. Pretendard 타이포그래피 기본.
knowledge/i18n/ 컨벤션 따르기."
```

## 다음

- [`docs/integrations/codex-walkthrough.ko.md`](codex-walkthrough.ko.md) — Codex CLI
- [`docs/integrations/cursor-walkthrough.ko.md`](cursor-walkthrough.ko.md) — Cursor
- [`docs/integrations/aider-walkthrough.ko.md`](aider-walkthrough.ko.md) — Aider
- [`docs/integrations/vscode-walkthrough.ko.md`](vscode-walkthrough.ko.md) — VS Code 확장
- [`docs/MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) — MCP 서버 (SDK 로딩의 대안)
- [Anthropic SDK 문서](https://docs.anthropic.com/) — 프롬프트 캐싱 레퍼런스
- [OpenAI SDK 문서](https://platform.openai.com/docs) — 캐싱 레퍼런스
