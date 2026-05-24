# 빠른 시작

클론부터 첫 디자인 산출물까지 5분.

## 1. 설치 (Claude Code)

```bash
git clone https://github.com/sungjin/design-ai.git ~/dev/design-ai
cd ~/dev/design-ai
./install.sh
```

19개 스킬, 16개 명령어, 4개 리뷰 에이전트가 `~/.claude/` 아래에 심볼릭 링크로 설치돼요. Claude Code를 다시 시작(또는 새 세션 열기)하면 적용돼요.

확인:

```bash
./install.sh --status
```

19 skills, 4 agents, 16 commands가 설치되었다고 나와야 해요.

```bash
design-ai doctor
```

설치 상태, runtime 전제 조건, symlink target이 의심될 때 이 명령으로 먼저 진단하세요.
경고가 design-ai symlink 누락뿐이라면 `design-ai doctor --fix`로 갱신하세요.

```bash
design-ai route "audit a Figma signup flow for Korean fintech" --explain
design-ai routes
design-ai prompt "audit a Figma signup flow for Korean fintech"
design-ai pack "audit a Figma signup flow for Korean fintech" --max-bytes 80000
design-ai prompt --from-file product-brief.md --route design-review --out prompt.md
cat product-brief.md | design-ai pack --stdin --out prompt-pack.md
design-ai pack "audit a Figma signup flow for Korean fintech" --out audit-pack.md
design-ai check output.md --route component-spec --strict
design-ai check --examples --route design-from-brief --limit 1
design-ai check --examples --all-routes --issues-only
design-ai examples --route component-spec --limit 5
design-ai learn --remember "Prefer dense Korean product UI" --category korean
design-ai learn --feedback "Keep audit findings short and evidence-led" --outcome keep
cat feedback.md | design-ai learn --feedback --stdin --outcome improve --category workflow
design-ai learn --backup --json --out learning-backup.json
design-ai learn --redact --json --out learning-redacted.json
design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force
design-ai learn --verify --from-file learning-backup.json
design-ai learn --import --from-file learning-backup.json --dry-run
design-ai learn --list --category korean --limit 5
design-ai learn --audit
design-ai learn --audit --fix --dry-run
design-ai learn --stats --json
design-ai prompt "audit a Figma signup flow" --with-learning --learning-category korean --learning-limit 5
design-ai search Pretendard --dir knowledge --limit 5
design-ai show knowledge/PRINCIPLES.md:29
```

맞는 command, 재사용 가능한 agent prompt, portable context bundle, artifact QA, known-good reference, opt-in local preference, 정확한 knowledge file을 찾아야 할 때 CLI route + prompt + pack + check + examples + learn + search + show를 사용하세요. `design-ai route --explain`은 왜 해당 route가 매칭됐는지와 참조 파일이 몇 개 사용 가능한지 보여줘요. 생성된 prompt에는 선택된 route id, routing reason, reference examples, 읽을 파일 목록, 실행 규칙, 추천 `design-ai check output.md --route <id> --strict` 명령, route-aware verification checklist가 포함돼요. 생성된 pack에는 context summary와 truncated/unavailable file warning이 들어가고, 가능한 경우 선택된 reference example file까지 포함돼서 다른 agent에 보내기 전에 bundle이 충분한지 판단할 수 있어요. `design-ai learn`은 local preference entry를 저장하고, 명시적 `--feedback`을 durable keep/improve/avoid guidance로 바꾸며, inline text / `--from-file` / `--stdin` feedback, category/limit filtering, 전체 portable `--backup --json`, local profile 또는 portable JSON을 `--redact --from-file` / `--redact --stdin`으로 받아 공유용 redacted `--redact --json` 출력 생성, `--out file` JSON artifact 저장과 `--force` overwrite control, portable JSON `--verify`, `--dry-run` preview와 confirmed `--yes` merge를 포함한 portable import, cleanup suggestion을 포함하는 non-mutating `--audit`, 안전한 `--audit --fix --dry-run` preview와 confirmed `--fix --yes` cleanup, `--stats` summary, confirmed `--forget`/`--clear` control을 지원해요. `prompt`/`pack --with-learning`은 명시적으로 요청했을 때만 entry를 포함하고, 현재 brief와의 relevance로 먼저 정렬한 뒤 recency로 보완하며, `--learning-category`와 `--learning-limit`으로 주입 범위를 좁히고, warning profile이 보이도록 learned-context audit summary를 함께 넣어요. `design-ai check`는 생성된 Markdown이 grounding, unresolved marker, accessibility, responsive, screen-reader, misuse guidance를 갖췄는지 검사하고, `--route <id>`를 주면 산출물 유형별 route-specific evidence도 함께 점검해요. `design-ai check --examples --route <id>`를 쓰면 같은 QA rule로 해당 workflow의 worked example도 검사할 수 있고, `design-ai check --examples --all-routes --issues-only`는 maintainer용 전체 example QA gap summary를 출력해요. `design-ai examples --route <id>`는 선택한 workflow에 맞는 worked output을 찾아줘요. 실제 product/design brief가 shell 한 줄보다 길면 `--from-file` 또는 `--stdin`을 사용하세요. 자동 routing이 거의 맞지만 특정 workflow를 고르고 싶다면 `--route <id>`를 사용하세요. id는 `design-ai routes`, `design-ai route --list`, 또는 `design-ai route "..." --json`에서 확인할 수 있어요.

## 2. 첫 번째 작업 세 가지

### 작업 1: 컴포넌트 스펙 만들기

```
/design-component-spec Banner
```

다음을 포함한 개발자용 스펙을 받아요:
- 아나토미 (parts table)
- API (props, types, defaults)
- 상태 (default / hover / focus / active / disabled / loading / error)
- 변형 (size, color, shape)
- 사용된 토큰
- ARIA + 키보드 계약
- 엣지 케이스 (empty / overflow / RTL / 모션 감소)
- 코드 예제
- Don't 섹션

자연어로 반복 작업: "닫을 수 있는 변형을 추가해줘", "한국어 카피는 어떻게 할까?"

### 작업 2: 디자인 리뷰

어떤 산출물(스크린샷, Figma 링크, URL)에 대해서든 UX + 접근성 + 디자인 비평을 병렬로 받아요:

```
/design-design-review [이미지 또는 URL 붙여넣기]
```

반환되는 것: 최우선 추천 사항, 크리티컬 이슈, 접근성 발견, 고려할 UX 패턴.

### 작업 3: 처음부터 만들기

```
/design-from-brief 프리랜서를 위한 한국 핀테크. 인보이스, 경비 추적, 세금 추정. 신뢰감 있고, 차분하고, 모바일 우선. Pretendard 타이포그래피, 블루 위주 팔레트.
```

완전한 디자인 시스템을 생성: 팔레트 + 파운데이션 + 컴포넌트 베이스라인 + 5개 컴포넌트 스타터 셋 + 핸드오프 문서.

## 3. 도메인 스킬 시도하기

v2 확장에서 7개 새 도메인을 추가했어요. 각각 슬래시 명령어가 있어요:

| 명령어 | 용도 |
|---|---|
| `/design-motion-design` | 모션 스펙 (CSS / Framer Motion / GSAP / Lottie) |
| `/design-illustration` | 일러스트레이션 시스템 또는 단일 작업 |
| `/design-print` | 인쇄물 스펙 (명함, 브로슈어, 패키징) |
| `/design-video` | 비디오 스펙 (마케팅, 소셜, 인앱) |
| `/design-game-ui` | 게임 UI 스펙 (HUD, 메뉴, 인벤토리) |
| `/design-conversational` | 챗봇, 음성 비서, AI 챗 스펙 |
| `/design-spatial` | VR / AR / Vision Pro 경험 스펙 |

예시:

```
/design-motion-design 한국 핀테크 랜딩 페이지 히어로 루프. Toss 스타일 절제. 8초. 모바일 + 데스크톱.
```

## 4. 지식 베이스 둘러보기

스킬이 컨텍스트가 필요하면 `knowledge/`를 읽어요. 직접 둘러봐도 좋아요:

- [`knowledge/PRINCIPLES.md`](../knowledge/PRINCIPLES.md) — 30개 핵심 규칙을 한 페이지로.
- [`knowledge/COVERAGE.md`](../knowledge/COVERAGE.md) — 무엇이 문서화됐고 무엇이 빈 영역인지.
- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md) — 컴포넌트 커버리지 맵.

## 5. 다른 에이전트에서

| 에이전트 | 방법 |
|---|---|
| **Codex CLI** | 이 폴더를 프로젝트 루트로 열어요. `AGENTS.md`가 자동 로드돼요. |
| **Cursor** | 이 폴더를 열고 `AGENTS.md`를 `.cursorrules`로 심볼릭 링크. |
| **Aider** | `aider --read AGENTS.md` |
| **일반 프롬프트** | 어떤 `skills/*/PLAYBOOK.md` 본문이든 프롬프트에 붙여넣으세요. |
| **Anthropic SDK** | PLAYBOOK.md를 시스템 프롬프트에 임베드; 관련 `knowledge/*.md` 파일 참조. |

각 `PLAYBOOK.md`는 자기 완결적이고 통째로 붙여넣으면 작동해요 — 나머지 레포 없이도.

## 한국어 기본값

대상 사용자가 한국인이면:
- 스킬은 B2C에 해요체, B2B / 뱅킹에 합쇼체를 자동 적용해요.
- Pretendard 타이포그래피가 기본값.
- 명함 90×50 (국제 85×55 아님).
- KFDA / 표시광고법 / 정보통신망법 / 게임산업진흥법 컴플라이언스가 인쇄 / 비디오 / 게임 UI 스킬에 내장.
- 본인인증 (PASS / NICE / KCB) 플로우는 인증 스킬에 포함.
- 한국 주식 차트 빨간색=상승 (서양과 반대 — `knowledge/i18n/`에 인코딩).

스킬 입력에서 오버라이드: "글로벌 1순위, 영문 카피".

## 유지보수

```bash
# refs/ (gitignored 업스트림 소스) 재추출
./tools/extractors/run-all.sh

# 수동으로 검사 실행
design-ai audit --strict

# HTML 토큰 미리보기 렌더링
python3 tools/preview/render-tokens.py
```

CI는 모든 PR에서 8개 검사를 실행해요.

## 다음 단계

- [`docs/USING.md`](USING.md) — 에이전트별 설치 심화.
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — 3계층 아키텍처 설명.
- [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) — 지식 / 스킬 / 추출기 추가하기.
- [`docs/PLUGIN-PACKAGING.md`](PLUGIN-PACKAGING.md) — 패키징 세부 사항.
- [`docs/MCP-INTEGRATION.md`](MCP-INTEGRATION.md) — Figma / Notion / GitHub / Slack / Linear MCP.

## 이슈

스킬이 잘못된 / 일반적인 / 환각 출력을 만들면: 그건 지식 격차예요. 스킬 이름 + 프롬프트 + 예상 vs 실제로 이슈를 열어주세요. 대부분의 수정은 `knowledge/`에 들어가요 (스킬 자체가 아니라) — 플레이북은 작게, 코퍼스는 크게.
