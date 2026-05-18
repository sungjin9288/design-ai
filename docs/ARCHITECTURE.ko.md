# 아키텍처

## 4 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│  에이전트 인터페이스 (AGENTS.md, CLAUDE.md)                 │
│  ─ 모든 LLM이 이 레포를 읽고 시니어 디자이너처럼 동작하는    │
│    진입 규약                                                │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ 읽음
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  스킬 + 에이전트 + 커맨드                                    │
│  ─ 작업별 플레이북 (skills/)                                 │
│  ─ 페르소나별 리뷰어 (agents/)                               │
│  ─ 사용자 호출 단축 (commands/)                              │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ 인용
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  지식 베이스 (knowledge/)                                    │
│  ─ 구조화 / 중복 제거 / 모델 친화                            │
│  ─ tools/extractors/가 refs/에서 생성                       │
│  ─ 핸드라이팅 오버라이드는 `<!-- hand-written -->`로 표시    │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ 파생
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  소스 자료 (refs/)                                           │
│  ─ Sparse-clone된 업스트림 디자인 시스템                     │
│  ─ READ-ONLY. 절대 수정 금지.                                │
│  ─ `git -C refs/<repo> pull`로 갱신                          │
└─────────────────────────────────────────────────────────────┘
```

## 왜 모델 무관 (model-agnostic)인가

사용자는 여러 에이전트 표면(Claude Code, Codex CLI, Cursor 등)에서 디자인 작업을 호출해요. **마크다운 + JSON**으로 인코딩된 지식은 다음 환경에서 모두 살아남아요:

- Claude Code의 스킬 시스템
- Codex CLI의 `AGENTS.md` 컨벤션
- 모든 LLM의 일반 프롬프트 컨텍스트

같은 지식을 Claude 전용 스킬 파일로만 인코딩하면 lock-in 돼요. 우리는 ergonomics를 위해 스킬 시스템을 쓰지만, **진실의 원천(source of truth)**은 평범한 마크다운이에요.

## 지식 파일 계약

모든 `knowledge/` 아래 파일은 다음 형식을 따라요:

```markdown
---
title: <사람이 읽는 제목>
source: <업스트림 URL 또는 "hand-written">
extracted_at: <ISO 날짜, 핸드라이팅이면 생략>
applies_to: [<프레임워크 또는 범위 태그>]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# <제목>

<단일 / 집중된 주제. 400줄 이하.>
```

생성 파일은 사람이 역추적할 수 있도록 source 경로를 반드시 포함해요.

### 버전 메타데이터 (v3.11+)

세 필드가 도입됐어요:

| 필드 | 의미 | 형식 |
| --- | --- | --- |
| `version` | 파일 자체의 안정성 (semver) | `1.0.0`, `1.2.3-beta` |
| `last_updated` | 마지막 substantive 리뷰 | `YYYY-MM` 또는 `YYYY-MM-DD` |
| `stability` | 라이프사이클 상태 | `stable` / `beta` / `experimental` / `deprecated` |

이 메타데이터는 `tools/audit/stale-check.py`로 검증돼요 — 6개월 이상 된 파일은 경고, 12개월 이상은 에러.

## 추출기 계약

`tools/extractors/`의 각 추출기는:

1. 단일 `refs/<source>/` 디렉토리에서 읽어요.
2. 단일 `knowledge/<category>/` 디렉토리에 써요.
3. **멱등성 (idempotent)** — 두 번 실행해도 같은 결과를 만들어요.
4. `<!-- hand-written -->` 표시된 파일은 절대 덮어쓰지 않아요.
5. 자체 헤더에 source 경로를 문서화해요.

## 스킬 파일 계약

```
skills/<skill-name>/
├── SKILL.md          # Claude Code 스킬 매니페스트 (frontmatter + 본문)
├── PLAYBOOK.md       # 단계별 프로세스 (모든 에이전트가 읽음)
├── TEMPLATE.md       # 출력 템플릿 (해당하는 경우)
└── examples/         # 워크드 예제
```

Codex CLI는 `PLAYBOOK.md`를 직접 읽어요. Claude Code는 호출용으로 `SKILL.md`를 쓰지만 두 파일은 같은 내용을 공유해요 — `SKILL.md`는 `PLAYBOOK.md`에 frontmatter 래핑한 것.

### 검증 단계 (verification phase)

모든 PLAYBOOK은 끝에 검증 단계가 있어야 해요. 산출물이 다음을 충족하는지 체크:

- 인용 출처 ≥ 2개 (지식 파일 또는 업스트림).
- 모든 상태 / 케이스 다룸.
- 한국 컨벤션 적용 (해당하는 경우).
- 접근성 / 키보드 / ARIA / RN(필요시) 검증.

이게 산출물 품질을 시니어 디자인 리뷰 수준으로 끌어올려요.

## 왜 벡터 임베딩 안 쓰는가

검토했지만 이 버전에서는 거부했어요:

- 큐레이션된 지식은 50K 토큰 이내에 잘 들어가요. 직접 파일 읽기가 벡터 검색보다 빠르고 저렴해요.
- 마크다운은 grep 가능 / 사람이 감사 가능. 벡터는 안 그래요.
- 미래: 지식이 100K 토큰을 넘어가면 source-of-truth 계층은 그대로 두고 `tools/index/`에 옵션 임베딩 인덱스를 추가할 수 있어요.

## 갱신 주기

| 작업 | 시기 |
|---|---|
| `git -C refs/<repo> pull` | 월간, 또는 업스트림 신기능 참조 시 |
| `./tools/extractors/run-all.sh` | `refs/` 갱신 후 |
| 핸드라이팅 `knowledge/` 리뷰 | 분기, 또는 생태계 큰 변화 후 |
| `stable` 승격 검토 | 분기 (`tools/audit/stale-check.py --warn-months 3`) |

자세한 분기 의식은 [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md)의 "Stability promotion ritual" 참고.

## 배포 채널 (v3.x +)

design-ai는 4개 채널로 배포돼요:

| 채널 | 명령어 | 사용 케이스 |
|---|---|---|
| **NPM CLI** | `npx @design-ai/cli install` | 가장 빠른 시작 |
| **Homebrew** | `brew install design-ai` (tap 추가 후) | macOS 사용자 |
| **Git clone** | `git clone ... && ./install.sh` | 풀 컨트롤 / 커스터마이징 |
| **VS Code 확장** | `.vsix` 설치 | IDE 통합 / 사이드바 탐색 |

자세한 비교는 [`docs/DISTRIBUTION.ko.md`](DISTRIBUTION.ko.md) 참고.

## 8개 감사 (CI 게이팅)

| # | 스크립트 | 목적 |
| --- | --- | --- |
| 1 | `frontmatter-check.py` | YAML frontmatter 유효성 + 버전 필드 형식 |
| 2 | `link-check.py` | 내부 링크 해석 |
| 3 | `korean-copy-check.py` | 한국어 voice / register / typography |
| 4 | `raw-hex-check.py` | 예제 raw hex 색상 위생 |
| 5 | `integration-check.py` | 통합 워크스루 완전성 |
| 6 | `stale-check.py` | 지식 신선도 (`last_updated` 임계값) |
| 7 | `check-coverage.py` | 컴포넌트 / 스킬 / 예제 커버리지 리포트 |
| 8 | `example-qa.py` | 라우트별 대표 worked example 품질 |

PR마다 모두 실행돼요. 로컬에서 미리 돌리려면 [`docs/CONTRIBUTING.ko.md`](CONTRIBUTING.ko.md) 참고.

## 다국어 (i18n) 구조

doc 사이트는 `mkdocs-static-i18n`으로 EN + KO를 같이 호스팅해요:

```
mkdocs.yml          # 사이트 설정 (EN + KO 둘 다)
site-src/           # 빌드 입력 (build-docs.sh가 만든 심볼릭 팜)
docs/*.md           # 영문 원본
docs/*.ko.md        # 한국어 번역 — `/ko/...` 경로로 호스팅
```

새 한국어 페이지 추가는 `docs/<file>.ko.md`로 짝 파일을 만들고 `mkdocs.yml` nav에 등록.

## 참고 문서

- [`docs/CONTRIBUTING.ko.md`](CONTRIBUTING.ko.md) — 기여 가이드
- [`docs/USING.ko.md`](USING.ko.md) — 사용자 가이드
- [`docs/SESSION-LOG.md`](SESSION-LOG.md) — v2.0 → v4.0 내러티브
- [`docs/ROADMAP.md`](ROADMAP.md) — 단계별 상세
- [`AGENTS.ko.md`](../AGENTS.ko.md) — 에이전트 진입점
