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
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git
brew install design-ai
design-ai install
```

코퍼스는 Homebrew의 `libexec`에 설치되고 `design-ai` 바이너리가 PATH에 추가돼요.

### C. Git clone (기여자용)

```bash
git clone https://github.com/sungjin9288/design-ai.git
cd design-ai
./install.sh
```

NPM과 같은 최종 상태이지만 소스가 작업 클론에 있어요. 업데이트는 `git pull && ./install.sh`.

## CLI 명령어

```
design-ai install     ~/.claude로 design-ai 심볼릭 링크; `design-ai install --json`으로 machine-readable install lifecycle output 출력
design-ai update      최신 소스 가져오기 + 재설치; `design-ai update --dry-run` human preview와 `design-ai update --dry-run --json` machine-readable update plan 지원
design-ai uninstall   심볼릭 링크 제거 (소스는 유지); `design-ai uninstall --json`으로 machine-readable uninstall lifecycle output 출력
design-ai status      설치된 항목 보기; `design-ai status --json`으로 machine-readable install-state output 출력
design-ai list [kind] 카탈로그 보기 (skills | commands | agents); --json으로 machine-readable manifest entry 출력
design-ai route brief command, skill, knowledge file 추천; --from-file/--stdin/--list/--limit N/--explain/--json 지원
design-ai routes      prompt/pack --route에 사용할 route id 목록 보기
design-ai prompt brief 바로 사용할 수 있는 agent prompt 생성; --out file/--from-file/--stdin/--json/--route id 지원
design-ai pack brief summary/warning이 포함된 prompt + 제한된 context file bundle 생성; --out file/--from-file/--stdin/--max-bytes N/--json/--route id 지원
design-ai learn      local learning preference 관리; --init으로 preview-first starter profile bootstrap을 하고, list/export에서 --query로 matching profile을 확인하고, --backup --json은 전체 portable profile backup, --redact --json / --redact --from-file / --redact --stdin은 공유용 redacted backup을 만들며, --verify / --diff로 portable profile 이동 전 상태를 확인하고, --restore는 preview-first 전체 profile 교체와 automatic rollback backup 및 선택형 --backup-file path를 제공하고, --restore-backups는 rollback backup inventory를 읽기 전용으로 보여주며, --restore-backups --prune --keep N은 오래된 rollback backup cleanup을 preview-first로 처리하고, --curate는 duplicate/sensitive entry를 archive-first 방식으로 정리하며, --propose-skills는 반복 check capture 기반 skill delta proposal을 preview-only로 출력하고 조절 가능한 --min-evidence proposal threshold, 선택형 --strict proposal readiness gate, `--report --out skill-proposals.md` Markdown review artifact, read-only `--review-file` decision join, read-only `--apply-plan` accepted proposal manual apply plan, `--review-template --out skill-proposals.review.json` JSON decision scaffold, `--patch --out skill-proposals.patch` unified diff handoff를 지원하며, --out file과 --force로 안전한 artifact 저장을 지원하며, --import는 확인된 profile merge를 수행
design-ai check file  생성된 Markdown artifact 품질 검사; --examples/--route id/--all-routes/--issues-only/--stdin/--strict/--learn/--yes/--learning-file path/--json 지원
design-ai workspace   git, repository metadata, learning, optional learning usage sidecar, learning eval checkpoint, release script 상태를 보는 read-only local dogfood readiness snapshot; --root path/--learning-file path/--learning-usage path/--learning-eval path/--strict/--json 지원
design-ai site file   Website Improvement Console JSON export 검증, sample workspace 생성, intake template 생성, handoff artifact 생성; --stdin/--sample/--intake-template/--language en|ko/--strict/--json/--mcp-check/--probes/--mcp-plan/--next-actions/--graph/--tasks/--bundle/--bundle-check/--bundle-compare/--bundle-handoff/--bundle-repair/--yes/--report/--prompts/--prompt id/--task id/--out file/--force 지원
design-ai examples q worked example 검색; --route id/--limit N/--json 지원
design-ai search q    로컬 코퍼스 Markdown 검색; --dir kind/--limit N/--json 지원
design-ai show file   코퍼스 파일 또는 line range 출력; --lines N:M/--context N/--json 지원
design-ai audit       8개 repository audit 실행; `design-ai audit --strict --quiet --json`으로 machine-readable repository-audit output 출력
design-ai doctor      설치 및 runtime 상태 진단; `design-ai doctor --strict` human diagnostics 출력, `design-ai doctor --json` machine-readable diagnostics 출력, --fix 지원
design-ai version     CLI + 플러그인 버전; `design-ai version --json`으로 machine-readable version metadata 출력
design-ai help [cmd|--json] 전체 또는 command별 도움말; --json으로 topic catalog 출력
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
4. 커밋 + 태그: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. GitHub Actions가 publish 및 release 워크플로 실행.

워크플로:
- 태그가 `package.json` 버전과 일치하는지 검증.
- `package.json`과 `plugin.json` 버전이 일치하는지 검증.
- `npm run audit:strict`로 8개 검사 모두 실행 (frontmatter / link / Korean copy / raw hex / integration / stale / coverage / example QA).
- publish 또는 release asset 첨부 전에 `npm test` CLI unit test 실행.
- packaging 전에 `git diff --check`로 whitespace check 검증.
- `npm run package:check`로 tarball에 필요한 runtime file이 포함되고 test/cache/source-only file이 빠졌는지 확인.
- `npm run release:metadata`로 release metadata check와 release metadata JSON `product_readiness_checked: true` Product Readiness guard coverage를 실행해 release self-test 전에 버전과 release-facing docs guidance를 확인.
- packed-tarball smoke gate에서는 installed-bin과 one-shot npm exec 양쪽에서 `design-ai workspace --json`, `design-ai workspace --strict --json` strict 실패/성공 readiness 동작, `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summary와 freshness metadata, auto-detected learning usage sidecar summary, `design-ai workspace` workspace learning restore-backups readiness와 restore rollback backup inventory, `design-ai site --stdin --json` Website Console export validation, `design-ai site --stdin --next-actions --json --out file --force` Website Console next-action operator checklist `--out` file 저장 확인, `design-ai site --stdin --next-actions --out file --force` Website Console next-action human checklist `--out` file 저장 확인, `design-ai site --sample` Website Console sample workspace 생성, `design-ai site --intake-template` Website Console intake template coverage for JSON stdout, Markdown stdout, Markdown `--out`, JSON `--out`, and `--language ko` Korean JSON/Markdown plus Korean Markdown `--out` in installed-bin and one-shot paths, `design-ai site --from-intake` Website Console from-intake filled Markdown intake import coverage for workspace JSON stdout, stdin workspace JSON stdout, stdin workspace JSON `--out` file output-file persistence, workspace JSON `--out` file output-file persistence, stdin handoff bundle generation, and from-intake handoff bundle generation in installed-bin과 one-shot paths, `design-ai site --init` Website Console project init workspace coverage in installed-bin and one-shot paths, `design-ai site --init --bundle --out <dir>` Website Console init handoff bundle도 설치된 binary와 one-shot 경로에서 확인, `design-ai site --prompt-list --json` Website Console prompt template 목록, `design-ai site --stdin --mcp-check --json` Website Console MCP readiness 검증, `design-ai site --stdin --mcp-check --probes --json` Website Console MCP readiness probe JSON with `--out` file-write confirmation, shared MCP probe output-file smoke assertions, MCP check 내장 probe next-step commands, MCP check 내장 command 실행 smoke coverage, human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command 검증, `design-ai site --stdin --mcp-plan` Website Console MCP action plan 생성, `design-ai site --stdin --mcp-plan --probes` Website Console MCP probe action plan 생성, `design-ai site --stdin --mcp-plan --probes --json` Website Console MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage 생성, `design-ai site --stdin --graph --json` Website Console workflow graph 생성, `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle 생성, non-empty Website Console evidence count를 evidence bundle check/compare/handoff JSON에서 검증하는 경로, `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle checksum 검증, bundle digest 검증, generated bundle contract 검증, `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle 비교와 bundle digest 비교 및 packed-tarball과 public-registry smoke에서 warning-state Website Console bundle-compare strict 경고 실패가 동일 warning bundle의 sameBundle true 유지와 strict에서 non-zero 종료를 보존하는지도 확인, `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console 대상 repo handoff prompt와 검증된 handoff bundle digest, `design-ai site <bundle-dir> --bundle-repair --yes --json` Website Console bundle repair preview/apply drift recovery와 repair report `--out file` output-file persistence, 공용 repair guidance smoke helper, 공용 repair report assertion helper, `design-ai site --stdin --tasks` Website Console refactor task 생성, `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected 단일 prompt 생성을 함께 검증.
- Packed-tarball smoke는 installed-bin과 one-shot `npm exec --package <tarball>` 경로에서 route eval, prompt eval, pack eval checkpoint output도 확인해요.
- Packed-tarball smoke는 installed-bin과 one-shot `npm exec --package <tarball>` 경로에서 `design-ai learn --signals` learning signal registry, Markdown signal report `design-ai learn --signals --report --out learning-signals.md`, learn signals JSON `--out` file-write confirmation, `design-ai learn --signals --strict --json` strict gate, `design-ai learn --agent-backlog --report --out agent-backlog.md` focused agent backlog Markdown report, agent backlog JSON `--out` file-write confirmation, `design-ai learn --agent-backlog --strict --json` agent backlog strict gate, focused agent backlog readiness summaries, `optionalGapDetails` JSON field coverage, check index JSON field coverage, Markdown check index section coverage, check-capture optional-gap semantics, optional refresh-only runbook selection reason이 no-command refresh output을 executable handoff command가 아닌 status metadata로 다루는지도 확인하고, `design-ai learn --propose-skills` skill proposal의 human, JSON, Markdown `--report --out`, read-only review `--review-file`, read-only review-check Markdown report `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --report --out skill-proposal-review-check.md`, read-only accepted proposal apply plan `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --json`, `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` human apply-plan command contract summary와 `Command contract` section, read-only apply-plan Markdown report `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --report --out skill-proposal-apply-plan.md`, JSON review template `--review-template --out`, unified diff `--patch --out`, JSON `--out` output, `design-ai learn --propose-skills --min-evidence 3 --json` threshold skipping, 그리고 `design-ai learn --propose-skills --strict --json` expected-failure gate도 확인해요.
- push 준비 시 `npm run ci:local`로 Real-CI parity를 먼저 확인하고, 의도된 `refs/` source-link warning만 허용하며 refs-only warning도 승인된 baseline을 넘지 않는지 함께 검증.
- 패킹된 tarball을 임시 프로젝트에 설치해 packed-tarball installed-bin 경로를 smoke test하고 같은 public CLI surface를 one-shot `npm exec --package <tarball>` 경로로 다시 검증하며, human `design-ai version`과 `design-ai version --json` machine-readable version metadata, `design-ai help` top-level help 출력을 검증한 뒤 `design-ai help --json` topic catalog with probe-capable Website Console site help usage를 읽어 expected public topic/alias set을 확인하고, 모든 `design-ai help <command>` topic-specific usage 출력 및 shared Website Console site help topic example smoke assertions 및 `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown 도움말 예시, 문서화된 help/command alias 출력, `find`, `cat`, `recommend`, `example`, `ex`, `ls`, `lint` functional alias 출력, 세 가지 `list` catalog domain의 human/JSON 출력, human/JSON `search` / `show` / `examples` 출력, route JSON 출력, route catalog 출력, route stdin 입력, 명시적 `show --lines` 출력과 `route --explain` 출력, unknown command failure, unknown help-topic failure, unknown list-domain failure, unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, numeric range failure 검증, prompt JSON 출력, prompt markdown 출력, prompt from-file 출력, prompt stdin 출력, pack JSON 출력, pack markdown 출력, pack from-file 출력, pack stdin 출력, prompt/pack 강제 `--out` overwrite와 prompt/pack `Wrote <path>` file-write confirmation, check examples 출력, check artifact 출력, check stdin 출력, check all-routes 출력, check learning capture output, human `design-ai audit --strict --quiet` 출력과 JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation과 forced overwrite coverage, JSON `design-ai learn --verify` output과 learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output과 learn restore `--out` file-write confirmation, learn restore rollback backup verification, learn restore `--backup-file` path coverage, design-ai learn --restore-backups restore rollback backup inventory coverage, design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output과 learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output과 learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --signals` learning signal registry plus Markdown `design-ai learn --signals --report --out learning-signals.md` signal report plus `design-ai learn --signals --strict --json` strict gate plus learn signals `--out` file-write confirmation, human / JSON `design-ai learn --propose-skills` preview-only skill proposal report plus Markdown `--report --out skill-proposals.md` review artifact plus read-only review `--review-file skill-proposals.review.json` decision join plus read-only review-file readiness check `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --json` plus read-only review-check Markdown report `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --report --out skill-proposal-review-check.md` plus read-only accepted proposal apply plan `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --json` plus read-only apply-plan Markdown report `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan --report --out skill-proposal-apply-plan.md` plus JSON review template `--review-template --out skill-proposals.review.json` plus unified diff `--patch --out skill-proposals.patch` handoff plus learn skill proposals JSON `--out` file-write confirmation plus `design-ai learn --propose-skills --min-evidence 3 --json` threshold skipping plus `design-ai learn --propose-skills --strict --json` expected-failure gate, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output과 learn audit `--out` file-write confirmation, human / JSON `design-ai learn --curate` archive-first curation output plus usage-aware curation JSON review, human `design-ai update --dry-run` output과 `design-ai update --dry-run --json` machine-readable update plan, fake `CLAUDE_HOME` 기반 human `design-ai install` 출력, `design-ai install --json` machine-readable install lifecycle output, `design-ai doctor --strict` human diagnostics 출력, `design-ai doctor --json` machine-readable diagnostics 출력, human `design-ai status` 출력과 JSON status, `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` 출력과 `design-ai uninstall --json` machine-readable uninstall lifecycle output까지 검증.
- `--provenance`로 publish (npm provenance attestation).
- publish 후 공개 npm registry package를 `npm exec --package @design-ai/cli@<version>` 경로로 smoke test하고, human version과 `design-ai version --json` machine-readable version metadata, `design-ai help` top-level help 출력, expected `design-ai help --json` catalog with probe-capable Website Console site help usage, 발견된 help topic usage 출력 및 shared Website Console site help topic example smoke assertions 및 `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown 도움말 예시, 문서화된 help/command alias 출력, `find`, `cat`, `recommend`, `example`, `ex`, `ls`, `lint` functional alias 출력, 세 가지 `list` catalog domain의 human/JSON 출력, human/JSON corpus discovery 출력, route JSON 출력, route catalog 출력, route stdin 입력, 명시적 `show --lines` 출력과 `route --explain` 출력, unknown command failure, unknown help-topic failure, unknown list-domain failure, unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, numeric range failure 검증, prompt JSON 출력, prompt markdown 출력, prompt from-file 출력, prompt stdin 출력, pack JSON 출력, pack markdown 출력, pack from-file 출력, pack stdin 출력, prompt/pack 강제 output-file과 prompt/pack file-write confirmation, check examples 출력, check artifact 출력, check stdin 출력, check all-routes 출력, check learning capture output, human `design-ai audit --strict --quiet` 출력과 JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, public registry JSON `design-ai learn --verify` output과 public registry learn verify `--out` file-write confirmation, public registry JSON `design-ai learn --backup` output과 public registry learn backup `--out` file-write confirmation, public registry human / JSON `design-ai learn --stats` profile summary output과 public registry learn stats `--out` file-write confirmation, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, human `design-ai install` 출력과 `design-ai install --json` machine-readable install lifecycle output, `design-ai doctor --strict` human diagnostics 출력, `design-ai doctor --json` machine-readable diagnostics 출력, human `design-ai status` 출력과 JSON status, `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` 출력과 `design-ai uninstall --json` machine-readable uninstall lifecycle output도 함께 검증.
- Public registry workspace readiness coverage는 공개 npm registry `design-ai workspace --strict --json` strict 실패/성공 readiness checks를 published package path에서 확인해요.
- Public registry workspace learning-eval coverage는 공개 npm registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summary와 freshness metadata, auto-detected learning usage sidecar summary를 published package path에서 확인해요.
- Public registry workspace restore-backups coverage는 공개 npm registry `design-ai workspace` workspace restore-backups readiness와 restore rollback backup inventory를 published package path에서 확인해요.
- Public registry Website Console coverage는 공개 npm registry `design-ai site` Website Console export validation, 공개 npm registry `design-ai site --stdin --next-actions --json` next-action operator checklist 계약 및 `mcpProbeCounts` probe count telemetry와 shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts 및 공개 npm registry `design-ai site --stdin --next-actions --json --out file --force` next-action operator checklist `--out` file 저장 확인 및 공개 npm registry `design-ai site --stdin --next-actions --out file --force` next-action human checklist `--out` file 저장 확인, sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle, bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation, bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry plus package smoke self-test coverage for Website Console bundle MCP probe counts plus bundled Website Console `mcp-probes.json` saved probe evidence payload assertion instead of the full `site --mcp-check --probes --json` response, bundle-repair, refactor task 생성, task-selected prompt 생성을 published package path에서 확인해요.
- Public registry learning eval-template coverage는 public registry `design-ai learn --eval-template` checkpoint generation과 public registry generated checkpoint strict validation을 published package path에서 확인해요.
- Public registry learning readiness Markdown report coverage는 `design-ai learn --signals --report --out learning-signals.md`와 `design-ai learn --agent-backlog --report --out agent-backlog.md`가 published package path에서 `Readiness check index` section을 보존하는지 확인해요.
- Public registry learning bootstrap coverage는 public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation, public registry `design-ai learn --feedback --from-file`, public registry `design-ai learn --feedback --stdin`, public registry JSON `design-ai learn --init` preview/apply output, public registry learn init duplicate-skip output도 확인해요.
- Public registry learning restore coverage는 public registry JSON `design-ai learn --restore` preview/apply output, public registry learn restore `--out` file-write confirmation, public registry learn restore rollback backup verification, public registry learn restore `--backup-file` path coverage, public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage, public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage도 확인해요.
- Public registry portable learning coverage는 public registry JSON `design-ai learn --import` dry-run/apply output과 public registry learn import `--out` file-write confirmation과 public registry JSON `design-ai learn --redact` output, public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, public registry learn redact `--out` file-write confirmation도 확인해요.
- Public registry learning cleanup coverage는 public registry human / JSON `design-ai learn --audit` cleanup suggestion output과 public registry learn audit `--out` file-write confirmation과 public registry `design-ai learn --audit --fix --dry-run` cleanup preview 및 confirmed apply output도 확인해요.
- Public registry learning relevance coverage는 public registry query-filtered learn list explanation/export JSON output과 public registry brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, public registry prompt/pack --with-learning도 확인해요.
- GitHub Release에는 같은 `npm pack` allowlist로 만든 tarball을 첨부.

로컬에서 태그를 만들기 전에는 먼저 다음 core gate를 실행하세요:

```bash
npm run release:check
```

이 명령은 CLI unit test, `npm run audit:strict` 8개 audit, `git diff --check` whitespace check, package contents check, release metadata check, `npm run release:self-test`, packed-tarball smoke를 한 번에 검증해요. Packed-tarball smoke는 installed-bin과 one-shot `npm exec --package <tarball>` 경로, human `design-ai version`, `design-ai version --json` machine-readable version metadata, `design-ai help` top-level help, command alias help와 functional alias output, command-specific help topic output, shared Website Console site help topic example smoke assertions 및 `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown 도움말 예시, route JSON 출력, route catalog 출력, route stdin 입력, 명시적 `show --lines` 출력과 `route --explain` 출력, unknown command failure, unknown help-topic failure, unknown list-domain failure, unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, numeric range failure, prompt JSON 출력, prompt markdown 출력, prompt from-file 출력, prompt stdin 출력, pack JSON 출력, pack markdown 출력, pack from-file 출력, pack stdin 출력, prompt/pack 강제 `--out` overwrite와 prompt/pack file-write confirmation, check examples 출력, check artifact 출력, check stdin 출력, check all-routes 출력, check learning capture output, human `design-ai audit --strict --quiet` 출력과 JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation과 forced overwrite coverage, JSON `design-ai learn --verify` output과 learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output과 learn restore `--out` file-write confirmation, learn restore rollback backup verification, learn restore `--backup-file` path coverage, design-ai learn --restore-backups restore rollback backup inventory coverage, design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output과 learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output과 learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output과 learn audit `--out` file-write confirmation, human / JSON `design-ai learn --curate` archive-first curation output plus usage-aware curation JSON review, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, `design-ai doctor --strict` human diagnostics 출력, `design-ai doctor --json` machine-readable diagnostics 출력, human `design-ai install` 출력과 `design-ai install --json` machine-readable install lifecycle output, human `design-ai status` 출력과 `design-ai status --json` machine-readable install-state output, human `design-ai uninstall` 출력과 `design-ai uninstall --json` machine-readable uninstall lifecycle output까지 포함해요.
같은 `npm run release:check` gate는 Website Console bundle `mcp-probes.json` saved-payload guard 단계를 package contents, release self-tests, packed-tarball smoke로 함께 보존해요.
같은 `npm run release:check` gate는 Website Console bundle boundary metadata guard 단계도 bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke와 함께 보존해요.
같은 `npm run release:check` gate는 Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence도 unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, packed-tarball smoke와 함께 보존해요.
같은 `npm run release:check` gate는 Product Readiness release policy full gate evidence guard도 unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, packed-tarball smoke와 함께 보존해요.
`npm run package:smoke`는 이 packed-tarball smoke gate를 직접 실행해 installed-bin과 one-shot npm exec 경로를 함께 확인해요.

GitHub CI에 올리기 전에는 더 넓은 로컬 parity gate도 실행하세요:

```bash
npm run ci:local
```

이 명령은 `release:check`에 더해 Python syntax check, knowledge/docs/examples size budget, VS Code extension compile/unit test, mkdocs build, 그리고 MkDocs warning policy까지 확인해요. non-`refs/` warning은 차단하고 refs-only warning은 승인된 baseline cap 안에 있어야 해요.

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
design-ai status --json
design-ai audit --strict --quiet --json
design-ai list skills
design-ai version --json
```

### Homebrew 어댑터 (Mac)

```bash
# Tap 추가
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git

# 설치
brew install design-ai

# Claude Code에 등록
design-ai install

# 확인
design-ai version
design-ai version --json
```

### 다른 환경

- **Codex CLI / Cursor / Aider**: 직접 [`docs/integrations/codex-walkthrough.ko.md`](integrations/codex-walkthrough.ko.md)의 워크스루 예시를 보세요.
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
