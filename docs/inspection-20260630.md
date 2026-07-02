# design-ai 리팩토링·디밸롭 점검 리포트 (2026-06-30)

> 읽기 전용 점검. 코드 변경 없음. 대상: `/Users/sungjin/dev/design` (`@design-ai/cli@4.55.0`).
> 전제: RAG/파인튜닝이 아니라 **deterministic 지식 코퍼스 + 라우팅**. README도 "Not a model. Not a fine-tune."로 명시 — 전제 유지 확인됨.

---

## 1. 현황 요약

| 항목 | 실측값 | 배경값(2026-06-23) 대비 |
|---|---|---|
| 브랜치 | `main` | 동일 |
| 미커밋 변경 | 없음 (working tree clean) | 동일 |
| origin 동기화 | `0 0` (ahead 0 / behind 0, 완전 동기화) | 동일 |
| 패키지 버전 | `4.55.0` | 동일 |
| `npm test` | **332 pass / 0 fail** (`node --test cli/lib/*.test.mjs`) | 신규 실측 |
| `npm run audit` | **8/8 audit 통과** (2.16s) | 신규 실측 |
| `npm audit` (루트) | 실행 불가 — ENOLOCK(락파일 없음, deps 0개) | — |
| `npm audit` (vscode-extension) | 3건(moderate 2, high 1) — **전부 devDependencies** | 신규 실측 |

최근 커밋 흐름은 전부 VS Code Marketplace publish 마무리 + MCP 서버 추가 + 배포 상태 문서화에 집중되어 있다 (`adf74a3`, `70f72df`, `9387f99`, `6ed2eb6`, `617dd4e` 등). 핵심 코어(라우팅·지식·스킬)는 안정적이고, 활동은 "배포 표면 완성"과 "학습/MCP 부가기능"에 쏠려 있다.

---

## 2. 리팩토링 후보

사용자 코딩 스타일 규칙(파일 800줄 max, 함수 50줄, many-small-files)을 기준으로 측정.

### P1 — 800줄 한계 초과 대형 모듈 (구조적 부채)

| 파일 | 줄 수 | 한계 대비 | 비고 |
|---|---|---|---|
| `cli/lib/site.mjs` | **6617** | **8.3×** | Website Improvement 전체 로직 단일 파일. 테스트도 5525줄. |
| `cli/lib/learn.mjs` | **3694** | 4.6× | 학습 프로필/백업/복원/큐레이션/시그널 전부 응집. |
| `cli/lib/signals.mjs` | 2337 | 2.9× | 학습 시그널 레지스트리. |
| `cli/lib/skill-proposals.mjs` | 2046 | 2.6× | 스킬 제안 생성. |
| `cli/commands/learn.mjs` | 1871 | 2.3× | learn 커맨드 디스패치/플래그. |
| `cli/lib/workspace.mjs` | 1056 | 1.3× | 워크스페이스 리포트. |

- 권고: `site.mjs`를 기능 경계(intake / bundle / mcp-check / mcp-plan / next-actions / repair)로 모듈 분할. 던전 수호자 씬 분할 패턴(Shared 순수헬퍼 + 렌더 모듈 + ctx 콜백)과 동일한 전략 적용 가능.
- 주의: 대형 파일 리팩터는 컨텍스트 윈도우 후반부에서 truncation 위험이 큼(메모리 기록된 함정). 모듈당 1 PR로 쪼개고 각 단계 후 `npm test`로 회귀 확인.

### P2 — CLI 커맨드 구조

- `cli/commands/*.mjs` 19개 + `cli/lib/*.mjs` 페어 구조는 일관적이며 양호. 각 lib에 `.test.mjs` 페어(26개 테스트 파일)도 잘 유지됨.
- `learn` 표면이 비대(README 한 문장에 `--init/--feedback/--signals/--propose-skills/--curate/--restore/--restore-backups/--eval/--audit/...` 등 30+ 서브플래그). 라우팅은 정상이나, **기능 표면 자체가 과적재**되어 신규 기여자 진입장벽이 높다. 서브커맨드 그룹화(`learn signals`, `learn restore`) 고려 여지.

---

## 3. 디밸롭 후보 (publish · MCP 중심)

### 3-A. VS Code Marketplace publish — 현재 진척과 남은 작업

**진척(완료):**
- `.github/workflows/vscode-publish.yml` 완비: `workflow_dispatch`(dry_run 기본 true), npm ci → compile → test → `vsce package` → VSIX 아티팩트 업로드.
- publish 단계는 `VSCE_PAT` 부재 시 명확한 에러로 차단(`Verify Marketplace token is configured`).
- publish 후 Marketplace `extensionquery` API로 listing 존재를 **검증하는 단계**까지 포함 — 견고함.
- 확장 identity 정합성 OK: `vscode-extension/package.json` → name `design-ai-vscode`, publisher `sungjin`, 워크플로 쿼리 id `sungjin.design-ai-vscode`와 일치. 버전 `0.4.0`.
- 런타임 의존성 0개(`dependencies: {}`) → VSIX 공급망 위험 없음.

**남은 작업(blocker):**
1. **`VSCE_PAT` repository secret 미설정** — 유일한 실질 blocker. Azure DevOps에서 Marketplace publish 권한 PAT 발급 → GitHub repo secret 등록 필요(코드/CI 변경 불요).
2. PAT 등록 후 `dry_run=false`로 워크플로 1회 수동 실행 → 자동 listing 검증 단계 통과 확인.
3. publish 성공 시 `docs/external-status.md`의 VS Code 행과 README L15 "VS Code Marketplace distribution is not currently confirmed" 문구를 "published"로 갱신.

**리스크:**
- 코드/설정 리스크는 **낮음**(워크플로 완비, dry-run 검증 경로 존재). 순수하게 **계정/시크릿 운영(operational)** 블로커이며 코드로 풀 수 없음.
- 부차: 확장 devDependencies 취약점(아래 4장)은 VSIX에 포함되지 않으나, Marketplace 심사/이미지에 영향은 없음.

### 3-B. MCP 서버 안정화 — 현재 진척과 견고성

`cli/lib/mcp-server.mjs`(426줄) + `cli/bin/design-ai-mcp.mjs` + 테스트 135줄.

**견고함(강점):**
- 11개 툴 모두 **read-only 기본**(`withLearning=true`일 때만 로컬 메타 기록). 입력 스키마 `additionalProperties:false` + `required` 명시 → 경계 검증 양호.
- 에러 처리 충실: `spawn` 실패 `child.on("error")` 캡처, `assertString` 입력 검증, JSON-RPC 표준 에러코드(`-32700/-32600/-32601/-32602/-32603`), 출력 `MAX_TOOL_OUTPUT_BYTES`(220KB) 트렁케이션.
- `tools/call` 핸들러는 미지 툴은 `-32602`, 실행 예외는 `isError:true`로 graceful 처리.
- 테스트가 계약을 잘 고정: tools/list 이름 순서, initialize serverInfo/instructions, `buildCliInvocation` 인자 매핑, 주입 러너 tools/call, **실제 stdio 서브프로세스 왕복**(initialize→list→route) 검증.

**잠재 이슈(우선순위순):**
1. **계약 안정성 — 프로토콜 버전 고정 리스크 (P1):** `PROTOCOL_VERSION = "2025-11-25"`. `initialize`는 클라이언트가 보낸 `params.protocolVersion`을 그대로 에코백한다(L359). 클라이언트가 미지원 버전을 보내도 서버가 무비판 수용 → 버전 협상(negotiation) 로직 부재. Claude/Codex가 다른 버전을 요구할 때 silent mismatch 가능. **버전 화이트리스트 검증 + 미스매치 시 서버 지원 버전으로 다운그레이드** 권고.
2. **부분 입력 라인 처리 — readline 경계 (P2):** `startMcpStdioServer`는 `readline` line 단위로 JSON-RPC를 파싱한다. 한 줄에 들어온 잘못된 JSON은 `-32700`으로 안전 응답하지만, **stdout 백프레셔/대형 메시지 분할** 시 라인 기반 가정이 깨질 수 있다. 현재 테스트는 정상 경로만 커버 — `tools/call` 예외/타임아웃/대용량 출력 트렁케이션 경로에 대한 **부정(negative) 테스트가 없음**.

**MCP 테스트 커버리지 평가:** 핵심 정상 경로는 견고하나, (a) 에러/예외 응답, (b) 트렁케이션, (c) 프로토콜 버전 미스매치 — 3개 부정 경로 테스트 보강이 가장 가성비 높은 다음 작업.

---

## 4. 기술 부채 · 위험

| 심각도 | 항목 | 근거 |
|---|---|---|
| HIGH | `cli/lib/site.mjs` 6617줄 — 800줄 한계 8배 | 유지보수·리뷰·리팩터 비용 폭증, truncation 위험 |
| MEDIUM | vscode-extension devDeps 취약점 3건(moderate 2, high 1) | `mocha`→`serialize-javascript`. **VSIX 미포함(runtime deps 0)**이라 출시 차단은 아니나 CI 신호 정리 필요. `npm audit fix` 가능 |
| MEDIUM | MCP 프로토콜 버전 무검증 에코백 | `mcp-server.mjs` L359 — 버전 협상 부재 |
| LOW | MCP 부정 경로 테스트 부재 | 에러/트렁케이션/버전 미스매치 미커버 |
| LOW | `learn` 기능 표면 과적재 | 30+ 서브플래그, 신규 기여자 진입장벽 |

루트 패키지는 **의존성 0개**라 `npm audit`이 ENOLOCK으로 실행 자체가 불가 — 이는 결함이 아니라 zero-dependency 보안 자세의 결과(공급망 표면 최소). vscode-extension만 락파일 보유.

---

## 5. 정직성 · 문서 (배지 수치 포함)

### 배지 수치 검증 (코드/파일 카운트 실측) — **가장 중요**

검증 기준은 저장소 자체 coverage 툴(`tools/audit/check-coverage.py`)의 canonical 카운트와 `knowledge/COVERAGE.md`.

| 배지 | README 주장 | 실측(coverage 툴 canonical) | 일치? |
|---|---|---|---|
| Knowledge files | **92** | **92** (77 hand-written + 15 generated) | ✅ 일치 |
| Skills | **20** | **20** (전부 verification phase 보유) | ✅ 일치 |
| Examples | **223** | **221** (coverage 툴 + COVERAGE.md L17 모두 221) | ❌ **불일치** |

- **Examples 배지(223)가 stale.** 저장소의 단일 진실원(`check-coverage.py` 출력 `Examples: 221`, `knowledge/COVERAGE.md` "Worked examples | 221")은 **221**을 보고한다. README 배지 L6과 본문 L128("223 worked outputs")이 옛 값.
  - 참고: `examples/` 디렉터리에는 top-level `component-*.md` 등 **221개** + `README.md` + `cases/`(1 파일) = 디렉터리 엔트리 226개. "223"은 어느 카운트와도 매칭되지 않는 **과거 잔존 수치**로 판단.
  - 권고(읽기 전용 점검이므로 변경은 미수행): README L6 배지와 L128을 `221`로 갱신, 또는 배지를 coverage 툴이 자동 생성하도록 배선해 drift 재발 차단.
- Knowledge(92)·Skills(20)는 정확.

### 정직성 스탠스 (양호)

- "**Not a model. Not a fine-tune.**"(README L13), "AI model training or fine-tuning remains outside the shipped scope" — RAG/파인튜닝 아닌 deterministic 전제 일관 유지. ✅
- 검증 안 된 정량 성과·채택률 주장 **없음**. "fastest/best-selling/adoption %" 류 카피 미발견. ✅
- VS Code Marketplace를 "not currently confirmed" / "prepared for, not publicly shipped"로 **정직하게** 기술(`external-status.md` L26-27). ✅
- 배포 상태에 검증 날짜(2026-06-23)·evidence 로그 경로 명시 — 추적 가능. ✅

### 문서 품질 이슈 (LOW)

- README L216/L218/L235가 **극단적 run-on 단락**(changelog 전체를 한 문장에 나열, 수천 자). 정직하지만 가독성·유지보수성 저하. 변경 로그는 `CHANGELOG.md`(이미 존재, 505KB)로 위임하고 README는 요약만 권고.

---

## 6. 우선순위 P0/P1/P2

**P0 (즉시):**
- (없음) — 출시 차단 코드 결함 없음. 테스트/감사 전부 green. Marketplace blocker는 코드가 아닌 시크릿 운영 이슈.

**P1 (다음 스프린트):**
- P1-a. **Examples 배지 221로 정정** (정직성·문서 정확성). README L6 배지 + L128 본문. 가능하면 coverage 툴 자동 생성으로 배선.
- P1-b. **MCP 프로토콜 버전 협상 추가** — 미지원 버전 화이트리스트 검증/다운그레이드. 계약 안정성.
- P1-c. **`cli/lib/site.mjs`(6617줄) 모듈 분할 시작** — 기능 경계별. 단계당 `npm test` 회귀 게이트.

**P2 (백로그):**
- P2-a. MCP 부정 경로 테스트 보강(에러/트렁케이션/버전 미스매치).
- P2-b. vscode-extension `npm audit fix`로 devDeps 취약점 정리(출시 영향 없음, CI 신호 위생).
- P2-c. `learn` 서브플래그 그룹화 검토.
- P2-d. README run-on 단락 → CHANGELOG 위임.

---

## 7. 권장 다음 액션

**"Marketplace publish 마무리" vs "MCP 서버 안정화" — 무엇이 더 가치 있는가**

> **권고: MCP 서버 안정화를 우선.** 근거:
> 1. **Marketplace publish는 코드 작업이 끝났다.** 워크플로·dry-run·listing 검증까지 완비되어 남은 건 `VSCE_PAT` 발급/등록이라는 **1회성 운영 행동**(코드로 풀 수 없음). 즉, 엔지니어링이 더 투입할 표면이 거의 없다.
> 2. **MCP는 최근 추가(2026-06-23)된 신규·확장 중인 계약 표면**이고, Claude/Codex라는 외부 클라이언트와의 프로토콜 호환이 제품 가치에 직접 연결된다. 버전 협상 부재(P1-b)와 부정 경로 테스트 공백(P2-a)은 실제 사용 시 silent 실패로 이어질 수 있는 **코드로 해결 가능한 리스크**다.
> 3. 가치 대비 노력: Marketplace는 노력↓·코드기여↓(시크릿만), MCP는 노력 투입이 곧 계약 견고성으로 환원된다.
>
> **결론:** Marketplace는 "PAT 등록 1건 + dry_run=false 실행 + 문서 갱신"으로 병렬 클로즈하고, **엔지니어링 집중은 MCP 안정화(버전 협상 + 부정 테스트)에 둔다.**

**구체 다음 액션 순서:**
1. (운영) Azure DevOps PAT 발급 → GitHub `VSCE_PAT` secret 등록 → `vscode-publish.yml` `dry_run=false` 실행 → external-status/README 갱신.
2. (코드, P1) Examples 배지 221 정정 + MCP 프로토콜 버전 협상 추가.
3. (코드, P1) `site.mjs` 모듈 분할 1차(intake/bundle 분리)로 시작, 단계별 `npm test`.
4. (코드, P2) MCP 부정 경로 테스트 3종 추가, vscode-extension `npm audit fix`.

---

*점검 방법: `git status/log`, `node --test`, `tools/audit/run-all.py`, `tools/audit/check-coverage.py`, 파일 라인 카운트, `mcp-server.mjs` 정독, `vscode-publish.yml`·`external-status.md` 정독, README/COVERAGE.md 배지 대조. 코드 무변경.*
