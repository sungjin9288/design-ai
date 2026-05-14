# 배포

design-ai를 이 레포에서 어댑터의 Claude Code 환경으로 가져오는 방법.

## 세 가지 설치 경로 (하나 선택)

### A. NPM (대부분의 어댑터에 추천)

```bash
# npx로 일회성 (글로벌 설치 없음)
npx @design-ai/cli install

# 또는 CLI 글로벌 설치
npm install -g @design-ai/cli
design-ai install
```

npm 패키지는 코퍼스(`knowledge/`, `examples/`, `skills/`, `agents/`, `commands/`, `.claude-plugin/`)를 번들링해요 — 어댑터가 따로 클론할 필요 없어요.

설치 후 CLI는 번들된 코퍼스를 `~/.claude/skills/`, `~/.claude/agents/`, `~/.claude/commands/`에 `design-` 접두사로 심볼릭 링크해요.

### B. Homebrew (Mac)

```bash
brew tap sungjin/design-ai https://github.com/sungjin/design-ai.git
brew install design-ai
design-ai install
```

코퍼스는 Homebrew의 `libexec`에 설치되고 `design-ai` 바이너리가 PATH에 추가돼요.

### C. Git clone (기여자용)

```bash
git clone https://github.com/sungjin/design-ai.git
cd design-ai
./install.sh
```

NPM과 같은 최종 상태이지만 소스가 작업 클론에 있어요. 업데이트는 `git pull && ./install.sh`.

## CLI 명령어

```
design-ai install     ~/.claude로 design-ai 심볼릭 링크
design-ai update      최신 소스 가져오기 + 재설치
design-ai uninstall   심볼릭 링크 제거 (소스는 유지)
design-ai status      설치된 항목 보기
design-ai list [kind] 카탈로그 보기 (skills | commands | agents)
design-ai route brief command, skill, knowledge file 추천; --from-file/--stdin/--list/--explain/--json 지원
design-ai routes      prompt/pack --route에 사용할 route id 목록 보기
design-ai prompt brief 바로 사용할 수 있는 agent prompt 생성; --out file/--from-file/--stdin/--json/--route id 지원
design-ai pack brief summary/warning이 포함된 prompt + 제한된 context file bundle 생성; --out file/--from-file/--stdin/--max-bytes N/--json/--route id 지원
design-ai check file  생성된 Markdown artifact 품질 검사; --examples/--route id/--all-routes/--issues-only/--stdin/--strict/--json 지원
design-ai examples q worked example 검색; --route id/--limit N/--json 지원
design-ai search q    로컬 코퍼스 Markdown 검색; --dir kind/--limit N/--json 지원
design-ai show file   코퍼스 파일 또는 line range 출력; --lines N:M/--context N/--json 지원
design-ai audit       7개 repository audit 실행; --strict/--quiet 지원
design-ai doctor      설치 및 runtime 상태 진단; --strict/--json/--fix 지원
design-ai version     CLI + 플러그인 버전
design-ai help        도움말
```

환경 변수로 오버라이드:

| 변수 | 기본값 | 용도 |
|---|---|---|
| `DESIGN_AI_PREFIX` | `design-` | 심볼릭 링크 이름 접두사 |
| `CLAUDE_HOME` | `~/.claude` | Claude Code 홈 |
| `DESIGN_AI_HOME` | npm 패키지 dir 또는 레포 루트 | 코퍼스 소스 위치 |
| `VERBOSE` | (off) | 자세한 status 출력 |
| `DEBUG` | (off) | 에러 시 stack trace |

## 버전 관리

추적할 두 가지 버전:

| 버전 | 의미 |
|---|---|
| **CLI** (`package.json`) | npm CLI 도구 |
| **Plugin / corpus** (`.claude-plugin/plugin.json`) | 지식 + 스킬 코퍼스 |

릴리스에서는 두 버전이 일치해야 해요. publish / release 워크플로가 강제해요:

1. `package.json` 버전 올리기.
2. `.claude-plugin/plugin.json` 버전을 일치시키기.
3. `CHANGELOG.md` 업데이트.
4. 커밋 + 태그: `git tag v3.6.0 && git push --tags`.
5. GitHub Actions가 publish 및 release 워크플로 실행.

워크플로:
- 태그가 `package.json` 버전과 일치하는지 검증.
- `package.json`과 `plugin.json` 버전이 일치하는지 검증.
- 7개 검사 모두 실행 (frontmatter / link / Korean copy / integration / stale / coverage / example QA).
- publish 또는 release asset 첨부 전에 CLI unit test 실행.
- `npm run package:check`로 tarball에 필요한 runtime file이 포함되고 test/cache/source-only file이 빠졌는지 확인.
- 패킹된 tarball을 임시 프로젝트에 설치하고 fake `CLAUDE_HOME`에서 `design-ai install` smoke test 실행.
- `--provenance`로 publish (npm provenance attestation).
- publish 후 공개 npm registry package를 `npm exec --package @design-ai/cli@<version>` 경로로 smoke test.
- GitHub Release에는 같은 `npm pack` allowlist로 만든 tarball을 첨부.

로컬에서 태그를 만들기 전에는 먼저 다음 core gate를 실행하세요:

```bash
npm run release:check
```

이 명령은 CLI unit test, 7개 audit, whitespace check, package contents check, `npm run release:self-test`, packed-tarball smoke를 한 번에 검증해요.

publish 워크플로가 끝난 뒤에는 공개 설치 경로도 확인하세요:

```bash
npm run registry:smoke
```

## 한국어 어댑터 가이드

### NPM 어댑터

```bash
# Node ≥ 18 필요
node --version

# 한 줄 설치
npx @design-ai/cli install

# 확인
design-ai status
design-ai list skills
```

### Homebrew 어댑터 (Mac)

```bash
# Tap 추가
brew tap sungjin/design-ai https://github.com/sungjin/design-ai.git

# 설치
brew install design-ai

# Claude Code에 등록
design-ai install

# 확인
design-ai version
```

### 다른 환경

- **Codex CLI / Cursor / Aider**: 직접 [`docs/integrations/`](integrations/)의 워크스루를 보세요.
- **Anthropic / OpenAI SDK**: [`docs/integrations/sdk-walkthrough.md`](integrations/sdk-walkthrough.md).

## 문제 해결

### `design-ai install`은 성공했는데 Claude Code가 스킬을 못 찾아요

Claude Code를 재시작하거나 새 세션을 열어주세요. 스킬은 세션 시작 시점에 로드돼요.

### `npm update` 후 심볼릭 링크가 stale path를 가리켜요

`design-ai install`을 다시 실행하세요. Idempotent해요.

### 다른 플러그인이 `design-` 접두사를 쓰고 있어요

접두사를 오버라이드하세요:

```bash
DESIGN_AI_PREFIX=myteam-design- design-ai install
```

### `~/.claude/`에 권한 거부 에러

Claude Code 디렉토리가 현재 사용자 소유인지 확인:

```bash
chown -R $USER ~/.claude
```

### NPM tarball이 너무 커요

`package.json`의 `files`를 점검. 가능성 큰 원인: `refs/`가 실수로 다시 추가됐어요 (gitignored지만 `npm pack`은 `.gitignore`가 아닌 `files`를 봐요).

## 미래 배포 채널

가능성 있지만 아직 구현되지 않은 것:

- **Homebrew tap → homebrew-core** — 코퍼스가 안정화되면 정식 등록.
- **Claude Code 플러그인 마켓플레이스** — 그 생태계가 성숙하면.
- **VS Code 확장** — design-ai를 설치 + UI를 제공하는 wrapper.
- **Docker 이미지** — CI / 샌드박스 환경용.

## 교차 참조

- [`PLUGIN-PACKAGING.md`](PLUGIN-PACKAGING.md) — 수동 심볼릭 링크 방식 + Claude Code 플러그인 형식 변화
- [`QUICKSTART.ko.md`](QUICKSTART.ko.md) — 어댑터 빠른 시작
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — 기여자 가이드
- [`CHANGELOG.md`](../CHANGELOG.md) — 버전 이력
