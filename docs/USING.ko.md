# AI 코딩 도구에서 design-ai 사용하기

이 지식 베이스를 다양한 AI 코딩 도구에 연결하는 방법이에요.

## Codex CLI

Codex는 프로젝트 루트의 `AGENTS.md`를 자동으로 읽어요.

```bash
cd /path/to/design-ai
codex "한국 핀테크 앱을 위한 컬러 팔레트를 만들어 주세요"
```

Codex가 `AGENTS.md`를 읽고, `knowledge/`를 탐색해서, 적절한 스킬 플레이북을 적용해요. 별도 설정 필요 없어요.

## Claude Code

Claude Code는 `CLAUDE.md`를 자동으로 읽어요. **슬래시 커맨드**와 **스킬 자동 로딩**을 쓰려면 심볼릭 링크를 거는 게 좋아요:

```bash
# 프로젝트 루트에서:
mkdir -p ~/.claude/commands ~/.claude/skills ~/.claude/agents

# 슬래시 커맨드
for f in commands/*.md; do
  ln -sf "$(pwd)/$f" "$HOME/.claude/commands/design-$(basename "$f")"
done

# 스킬
for d in skills/*/; do
  name=$(basename "$d")
  ln -sf "$(pwd)/$d" "$HOME/.claude/skills/design-$name"
done

# 에이전트
for f in agents/*.md; do
  [ "$(basename "$f")" = "README.md" ] && continue
  ln -sf "$(pwd)/$f" "$HOME/.claude/agents/$(basename "$f")"
done
```

또는 NPM CLI로 한 번에:

```bash
npx @design-ai/cli install
```

이렇게 하면:
- `/design-design-review`, `/design-palette-from-brand` 같은 커맨드를 어디서든 쓸 수 있어요.
- Claude Code 스킬 시스템에서 스킬이 자동 로딩돼요.
- 에이전트를 이름으로 호출할 수 있어요.

심볼릭 링크를 안 걸어도 대화에서 경로로 직접 참조하면 돼요:
- "`skills/color-palette/PLAYBOOK.md`의 플레이북을 핀테크 앱에 적용해 주세요."
- "`agents/design-critic.md` 에이전트를 띄워서 이 Figma 링크를 리뷰해 주세요."

## Cursor

프로젝트의 `.cursorrules`에 다음 내용을 넣어요:

```
당신은 20년 이상 경력의 시니어 프로덕트 디자이너입니다.

사용자가 디자인 작업을 요청하면, /path/to/design-ai/AGENTS.md의 플레이북을 따르세요.

UX 감사: /path/to/design-ai/skills/ux-audit/PLAYBOOK.md
팔레트: /path/to/design-ai/skills/color-palette/PLAYBOOK.md
컴포넌트 스펙: /path/to/design-ai/skills/component-spec-writer/PLAYBOOK.md
...
```

경로는 환경에 맞게 조정하세요.

## Aider

```bash
aider --read AGENTS.md --read knowledge/colors/color-theory.md \
      --read skills/color-palette/PLAYBOOK.md
```

또는 `.aider.conf.yml`:

```yaml
read:
  - AGENTS.md
  - knowledge/a11y/contrast.md
  - knowledge/a11y/keyboard-and-focus.md
  - knowledge/colors/color-theory.md
  - knowledge/typography/type-scale-fundamentals.md
```

## 일반 프롬프트 (모든 모델)

관련 지식과 스킬을 시스템 프롬프트로 합쳐요:

```bash
cat AGENTS.md \
    skills/color-palette/PLAYBOOK.md \
    knowledge/colors/color-theory.md \
    knowledge/a11y/contrast.md \
    > /tmp/system-prompt.md
```

`/tmp/system-prompt.md`를 어떤 LLM이든 시스템 프롬프트로 넘겨요.

## VS Code 확장

VS Code 확장은 사이드바에서 design-ai 자산을 탐색할 수 있게 해줘요:

```bash
cd vscode-extension
npm install
npx @vscode/vsce package
code --install-extension design-ai-*.vsix
```

설정 (`design-ai.path`, `design-ai.language`)으로 경로와 언어를 지정할 수 있어요. Copilot Chat / Cursor / Continue 등 어떤 AI 어시스턴트와도 함께 쓸 수 있어요 (벤더 중립).

자세한 사용법은 [`docs/integrations/vscode-walkthrough.ko.md`](integrations/vscode-walkthrough.ko.md)를 참고하세요.

## 토큰 예산

전부 다 로딩하면 과해요. 작업별 최소 컨텍스트:

| 작업 | 로딩할 파일 |
| --- | --- |
| 컬러 팔레트 생성 | `AGENTS.md`, `skills/color-palette/PLAYBOOK.md`, `knowledge/colors/color-theory.md`, `knowledge/colors/palettes-by-product-type.md`, `knowledge/a11y/contrast.md` |
| 컴포넌트 스펙 | `AGENTS.md`, `skills/component-spec-writer/PLAYBOOK.md`, `knowledge/components/INDEX.md`, `knowledge/a11y/keyboard-and-focus.md` |
| UX 감사 | `AGENTS.md`, `skills/ux-audit/PLAYBOOK.md`, `knowledge/patterns/ux-guidelines.md`, `knowledge/a11y/contrast.md`, `knowledge/a11y/keyboard-and-focus.md` |
| 디자인 시스템 부트스트랩 | `AGENTS.md`, `skills/design-system-builder/PLAYBOOK.md`, `knowledge/colors/color-theory.md`, `knowledge/typography/type-scale-fundamentals.md`, `knowledge/layout/spacing-and-grid.md` |
| 웹사이트 개선 컨트롤 타워 | `AGENTS.md`, `skills/website-improvement/PLAYBOOK.md`, `docs/WEBSITE-IMPROVEMENT.md`, `knowledge/patterns/dashboard-composition.md`, `knowledge/patterns/report-design.md`, `knowledge/patterns/ux-guidelines.md`, `knowledge/a11y/keyboard-and-focus.md` |

이 정도면 한 작업당 30K 토큰 미만이라 캐싱 전이라도 대부분 모델의 컨텍스트 윈도우에 넉넉히 들어가요.

## 한국 프로젝트에서 추가 컨텍스트

한국 시장 작업에는 KR 전용 지식 파일을 추가로 로딩하세요:

| 도메인 | 파일 |
| --- | --- |
| 결제 / 핀테크 | `knowledge/i18n/korean-payments.md` |
| 타이포그래피 | `knowledge/typography/korean-typography.md`, `knowledge/typography/pretendard-and-fallbacks.md` |
| 음성 / 챗봇 | `knowledge/conversational/korean-conversational-conventions.md` |
| 게임 UI | `knowledge/game-ui/korean-game-conventions.md` |
| 영상 | `knowledge/video/korean-video-conventions.md` |
| 인쇄 | `knowledge/print/korean-print-conventions.md` |
| 일러스트 | `knowledge/illustration/korean-illustration-conventions.md` |
| 공간 / VR | `knowledge/spatial/korean-spatial-context.md` |

## 새로고침 주기

업스트림 디자인 시스템에 새 버전이 나오면 새로고침하세요:

```bash
bash tools/clone-refs.sh         # refs/ 갱신
bash tools/extractors/run-all.sh # knowledge/ 재생성
```

생성된 지식 파일은 frontmatter에 `extracted_at`이 있어요. 핸드라이팅 파일(상단에 `<!-- hand-written -->`)은 보존돼요.

## 참고 문서

- [`AGENTS.ko.md`](../AGENTS.ko.md) — 보편적 진입점
- [`README.ko.md`](https://sungjin9288.github.io/design-ai/ko/) — 사람이 읽는 진입점
- [`QUICKSTART.ko.md`](QUICKSTART.ko.md) — 5분 시작 가이드
- [`DISTRIBUTION.ko.md`](DISTRIBUTION.ko.md) — 배포 채널 비교
- [`integrations/codex-walkthrough.ko.md`](integrations/codex-walkthrough.ko.md) — 도구별 워크스루 예시 (Codex / Cursor / Aider / SDK / VS Code)
