# 기여 가이드

design-ai 프로젝트에 기여하는 방법이에요. 코드 / 지식 파일 / 스킬 / 번역 어떤 형태로든 환영해요.

## 새 소스 레포 추가하기

1. `refs/`에 sparse clone으로 추가:
   ```bash
   git clone --depth 1 --filter=blob:none --sparse https://github.com/<org>/<repo>.git refs/<name>
   git -C refs/<name> sparse-checkout init --cone
   git -C refs/<name> sparse-checkout set <필요한 디렉토리만>
   ```
2. `README.md`의 표에 추가하세요.
3. `tools/extractors/<source>.py`에 추출기를 작성하거나 갱신하세요.
4. `./tools/extractors/run-all.sh` 실행.
5. `knowledge/`의 생성 결과가 새 소스를 인용하는지 확인하세요.

## 새 스킬 추가하기

1. `skills/<skill-name>/` 디렉토리 생성.
2. `PLAYBOOK.md` 작성 — 단계별 프로세스.
3. `SKILL.md` 작성 — 같은 내용에 frontmatter 추가:
   ```markdown
   ---
   name: <skill-name>
   description: <한 문장 — 트리거 조건>
   ---
   ```
4. 스킬이 구조화된 산출물을 만든다면 `TEMPLATE.md` 작성.
5. `skills/<skill-name>/examples/`에 워크드 예제 추가.
6. `skills/README.md` 인덱스 갱신.
7. **검증 단계 (verification phase)** 필수 — PLAYBOOK 끝에 결과물 체크리스트 작성.

## 새 에이전트 페르소나 추가하기

1. `agents/<persona>.md` 생성, frontmatter 포함:
   ```markdown
   ---
   name: <persona>
   description: <언제 호출할지>
   tools: [Read, Grep, Glob]
   ---
   ```
2. 본문: 페르소나 설명, 범위, 출력 형식.
3. `agents/README.md` 인덱스 갱신.

## 슬래시 커맨드 추가하기

1. `commands/<name>.md` 생성, frontmatter 포함:
   ```markdown
   ---
   description: </name이 하는 일>
   ---
   ```
2. 본문: 커맨드가 확장될 프롬프트 템플릿.
3. `commands/README.md` 인덱스 갱신.

## 지식 파일 편집하기

- **생성된 파일**: 추출기를 편집하고 재실행하세요. 출력을 손으로 직접 편집하면 안 돼요.
- **핸드라이팅 파일**: 본문 상단에 반드시 `<!-- hand-written -->`을 포함해야 해요.
- **혼합 파일**: 허용 안 됨. 생성 + 핸드라이팅 두 개로 분리하고 상호 링크하세요.

### 버전 메타데이터 (v3.11+)

모든 지식 파일에는 버전 정보가 포함돼야 해요:

```yaml
---
title: <제목>
applies_to: [<태그>]
version: 1.0.0
last_updated: 2026-05
stability: stable
---
```

- `version`: semver 형식 (`1.0.0`, `1.2.3-beta`).
- `last_updated`: `YYYY-MM` 또는 `YYYY-MM-DD`. 내용을 수정할 때마다 갱신.
- `stability`: `stable` / `beta` / `experimental` / `deprecated` 중 하나.

새 파일은 보통 `version: 1.0.0`, `stability: stable`로 시작해요. 활발히 변경 중인 내용이면 `stability: experimental`로 표시하세요.

## 인용 규칙

지식 파일이 업스트림 소스를 참조할 때:

```markdown
---
source: refs/ant-design/components/button/Button.tsx
extracted_at: 2026-05-07
---
```

여러 소스를 합치는 파일은 리스트로:

```yaml
sources:
  - refs/ant-design/components/button/Button.tsx
  - refs/mui/packages/mui-material/src/Button/Button.js
  - refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx
```

## 스타일

- **마크다운 우선** — 산문보다 구조화된 마크다운.
- **비교는 표로** — 어떤 비교든 표 형식이 더 읽기 쉬워요.
- **코드 블록에 언어 태그** (`json`, `tsx`, `css`, `bash`).
- **로컬 파일 링크는 상대 경로**.
- **업스트림 링크는 GitHub canonical URL** (로컬 `refs/`는 wiped될 수 있어서 깨질 수 있어요).

## 한국어 콘텐츠 기여

한국어 번역 / 콘텐츠 추가도 환영해요.

### 톤 가이드

- **어댑터 / 사용자 대상**: 해요체 (친근, 일상). README.ko.md, USING.ko.md, integration walkthroughs 등.
- **법적 / 규정 / 공식**: 합쇼체 (정중, 격식). 약관, 정책, 공시 관련.
- **기술 / 코드 옆**: 중립적 — 명령형 또는 설명형. ARCHITECTURE.ko.md, 추출기 주석 등.

### 번역 원칙

- **직역 거부**. 자연스러운 한국어 우선.
- **영어 기술 용어**는 그대로 두는 게 자연스러우면 그대로 (예: "API", "frontmatter", "schema").
- **한국 브랜드 / 컨벤션**은 한국어 유지 (Toss, KakaoPay, 카카오톡, 네이버, Pretendard).
- **코드 블록 / 명령어**는 보통 영문 그대로.
- **검증**: `tools/audit/korean-copy-check.py`로 영어 UI 문구가 한국어 파일에 섞여 있지 않은지 확인.

### 한국어 파일 명명 규칙

- 영문 원본이 `FILE.md`면 한국어는 `FILE.ko.md`.
- 한국어 전용 지식 파일 (예: `korean-payments.md`)은 영문 파일명에 한국 컨벤션 내용을 한국어로 (혼용 OK).

## 감사 (Audits)

PR을 올리기 전에 8개 감사를 모두 통과해야 해요. 보통은 통합 명령을 먼저 실행하세요:

```bash
npm run audit:strict
```

개별 감사는 다음 8개예요:

| # | 스크립트 | 목적 |
| --- | --- | --- |
| 1 | `frontmatter-check.py` | YAML frontmatter 유효성 + 버전 필드 형식 |
| 2 | `link-check.py` | 내부 링크 해석 |
| 3 | `korean-copy-check.py` | 한국어 voice / register / typography |
| 4 | `raw-hex-check.py` | 예제 파일의 raw hex 색상 위생 |
| 5 | `integration-check.py` | 통합 워크스루 완전성 |
| 6 | `stale-check.py` | 지식 신선도 (`last_updated` 임계값) |
| 7 | `check-coverage.py` | 컴포넌트 / 스킬 / 예제 커버리지 리포트 |
| 8 | `example-qa.py` | 라우트별 대표 worked example 품질 |

CI가 PR마다 자동으로 실행해요. 로컬에서 미리 돌리면 시간 절약돼요.

## Cross-source API reconciliation

Ant Design / MUI / shadcn-ui가 업데이트되면 component spec의 API가 업스트림과 어긋날 수 있어요. 먼저 짧은 summary로 위험도를 보고, 필요할 때만 전체 report를 열어보세요:

```bash
# 빠른 분기 리뷰 요약
python3 tools/extractors/component_spec_conflict_check.py --multi-source --summary-only

# 전체 conflict report
python3 tools/extractors/component_spec_conflict_check.py --multi-source > /tmp/conflicts.md

# 단일 컴포넌트 reconciliation proposal
python3 tools/extractors/component_spec_reconcile.py --name button
```

우선순위는 `CRITICAL` / `HIGH`부터예요. `LOW`는 대부분 library-specific prop이라 바로 수정 대상은 아니고, 실제 design-system API에 필요한지 판단하면 돼요.

## 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따라요:

```
<type>: <description>

<optional body>
```

타입: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

## PR 워크플로

1. 새 브랜치 생성 (`feat/<feature-name>` 또는 `fix/<issue>`).
2. 변경사항 작성 + 8개 감사 통과 확인.
3. 커밋 (Conventional Commits).
4. PR 생성 — 변경 요약 + 테스트 플랜 포함.
5. CI 통과 확인.
6. 리뷰 요청.

자세한 PR 형식은 영문 [`CONTRIBUTING.md`](CONTRIBUTING.md)와 [`AGENTS.md`](../AGENTS.md)를 참고하세요.

## 참고 문서

- [`AGENTS.ko.md`](../AGENTS.ko.md) — 에이전트 진입점
- [`docs/ARCHITECTURE.ko.md`](ARCHITECTURE.ko.md) — 시스템 구조
- [`docs/USING.ko.md`](USING.ko.md) — 사용자 가이드
- [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) — 릴리스 의식
