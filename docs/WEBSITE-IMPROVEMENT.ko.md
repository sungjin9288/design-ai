# Website Improvement Control Tower

`website-improvement`는 기존 웹사이트 개선 작업을 준비하고 관리하는 로컬 컨트롤 타워입니다. 이 repo는 대상 사이트의 소스 코드를 포함하거나 수정하지 않고, 진단 구조, 체크리스트, MCP readiness, Codex/Claude용 프롬프트, handoff report를 관리합니다.

## Web App

정적 앱은 [`docs/website-console/index.html`](website-console/index.html)에 있습니다. 별도 build나 dependency 없이 브라우저에서 열 수 있고, 상태는 `localStorage`에 저장됩니다.

첫 실제 회사 사이트 pilot은 [회사 웹사이트 Intake Template](COMPANY-WEBSITE-INTAKE-TEMPLATE.ko.md)을 채운 뒤, 대상 repo를 열기 전에 [회사 웹사이트 Dogfood Runbook](COMPANY-WEBSITE-DOGFOOD.ko.md)을 따릅니다.

주요 섹션:

| 섹션 | 역할 |
|---|---|
| Site Profile | 사이트 이름, live URL, repo/local path, Figma, brand notes, pages, user flows, viewport를 정리 |
| Audit Checklist | visual design, UX flow, responsive, accessibility, performance, SEO, technical quality, runtime issues, content quality 점검 |
| MCP Readiness Matrix | GitHub, Figma, Browser, DevTools, Deploy, Sentry, DB, CMS, 협업, 리서치 연결 필요도를 표시 |
| Workflow Graph | workspace, profile, audit, MCP, task, prompt, handoff, bundle, target repo node와 deterministic edge를 시각화하고 graph JSON을 export |
| Refactor Plan | finding을 실제 task, priority, Codex prompt, verification, risk로 변환 |
| Prompt Generator | Codex/Claude에 넘길 8개 prompt template 생성 |
| Handoff Report | 실행한 작업, 검증 결과, 남은 리스크, 다음 작업을 기록하고 Markdown report로 정리 |
| Operator Runbook | `design-ai site <bundle-dir> --bundle-handoff --json` 결과를 import해 source-bundle provenance/detail review, focused source-bundle JSON import, provenance-only review state, copy-ready strict source command, source-bundle Markdown/JSON copy/export, task/command provenance chip, stage metric, resettable action/evidence row filter, status index, evidence progress, copy-ready stage row, row-level Markdown copy/export와 line copy, filtered/full Markdown export, guarded next-line copy action을 검토 |

브라우저에서 기록한 `implementationEvidence`는 JSON export 뒤에도 유지됩니다. `design-ai site --json`은 evidence count를 보고하고, `--tasks`는 evidence block을 보존하며, `--report`와 `--bundle`은 실행 작업 / 검증 결과 / 남은 리스크 / 다음 작업을 handoff artifact에 반영합니다.

## Boundary

MVP에서 하지 않는 것:

- 자동 crawling, Lighthouse, axe, visual diff, screenshot capture
- MCP 직접 연결이나 외부 시스템 write
- 대상 웹사이트 repo 코드 수정
- backend API, auth, multi-user sync
- embeddings, fine-tuning, background learning

## CLI / Skill

라우팅과 프롬프트 생성은 다음처럼 사용할 수 있습니다.

```bash
design-ai site --intake-template --out company-website-intake.md
design-ai site --intake-template --language ko --out company-website-intake.ko.md
design-ai site --from-intake company-website-intake.ko.md --out website-workspace.json
design-ai site --from-intake company-website-intake.ko.md --next-actions --out website-next-actions.md
design-ai site --from-intake company-website-intake.ko.md --bundle --out website-handoff-bundle
design-ai route "improve website UX SEO performance" --json
design-ai prompt "improve homepage conversion" --route website-improvement --json
design-ai check examples/website-improvement-report.md --route website-improvement --strict
design-ai site --sample --out website-workspace.json
design-ai site website-workspace.json --tasks --out website-workspace.tasks.json
design-ai site website-workspace.json --json
design-ai site website-workspace.json --mcp-check --strict --json
design-ai site website-workspace.json --mcp-check --probes --json
design-ai site website-workspace.json --mcp-plan --out mcp-action-plan.md
design-ai site website-workspace.json --next-actions --json
design-ai site website-workspace.json --next-actions --out website-next-actions.md
design-ai site website-workspace.json --graph --json --out website-workflow-graph.json
design-ai site website-workspace.json --bundle --out website-handoff-bundle
design-ai site website-handoff-bundle --bundle-check --strict --json
design-ai site website-handoff-bundle --bundle-compare website-handoff-bundle.previous --strict --json
design-ai site website-handoff-bundle --bundle-handoff --strict --json --out target-repo-handoff.json --force
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md
design-ai site website-workspace.json --report --out website-handoff.md
design-ai site website-workspace.json --prompts --out website-prompts.md
design-ai site website-workspace.json --prompt codex-implementation --out codex-implementation.md
design-ai site website-workspace.json --prompt codex-implementation --task task-accessibility --out task-accessibility.md
```

`design-ai site --intake-template --language ko`는 한국어 content를 생성하고, `design-ai site --intake-template`은 문서에 있는 blank 회사 사이트 intake Markdown form을 CLI에서 바로 생성합니다. `--json`을 붙이면 template metadata, privacy boundary, 추천 후속 command, Markdown content를 하나의 payload로 받을 수 있습니다. `design-ai site --from-intake company-website-intake.ko.md`는 작성 완료된 영어 또는 한국어 intake Markdown을 deterministic workspace JSON으로 변환하며 site profile, priority page, user flow, brand note, MCP readiness status, grounded initial audit finding을 보존합니다. `--next-actions [--json]`을 붙이면 `website-workspace.json` 저장부터 시작하는 local runbook을 만들고, `--bundle --out <dir>`을 붙이면 CLI field를 다시 입력하지 않고 filled intake에서 handoff bundle을 바로 생성합니다. `design-ai site --sample`은 파일 기반 workflow를 바로 시작할 수 있는 유효한 starter workspace JSON을 생성합니다. `design-ai site --prompt-list --json`은 선택 전에 사용 가능한 prompt template id를 나열합니다. `design-ai site --mcp-check --json`은 외부 MCP를 호출하지 않고 local MCP readiness evidence와 task/MCP gap을 점검하며, `--strict`를 붙이면 required readiness evidence 누락 시 실패 처리합니다. `--mcp-check` 또는 `--mcp-plan`에 `--probes`를 붙이면 GitHub, Figma, Browser smoke target, deployment provider reference를 read-only URL/path/tool-handoff probe로 확인합니다. Probe는 외부 MCP를 호출하거나 외부 시스템에 write하지 않습니다. `design-ai site --mcp-plan`은 같은 readiness 상태를 blocking item, warning, task/MCP alignment, 선택형 read-only probes, execution sequence, follow-up command가 포함된 action plan으로 변환합니다. 다른 agent, CI smoke, handoff script가 Markdown 대신 구조화된 `website-improvement-mcp-action-plan` payload를 필요로 할 때는 `--json`을 함께 사용합니다. `design-ai site --next-actions [--json]`는 validation issue, MCP readiness, task/MCP gap, top refactor task, handoff command를 target repo로 이동하기 전 prioritized local operator checklist로 정리합니다. 사람이 읽는 runbook checkpoint가 필요하면 `--json`을 빼고 `--out website-next-actions.md`를 붙입니다. `design-ai site --graph --json`은 workspace, site profile, audit, MCP readiness, refactor task, prompt template, handoff, bundle, target-repo node와 deterministic edge를 포함한 portable Website Improvement workflow graph를 생성합니다. 이 graph는 local/read-only artifact이며 static console도 브라우저 상태에서 같은 workflow를 렌더링할 수 있고, 별도 workflow runtime dependency를 추가하지 않습니다. `design-ai site --bundle --out <dir>`은 README, summary JSON, generated tasks workspace, MCP readiness JSON, MCP action plan, handoff report, prompt bundle, top-priority Codex implementation prompt를 포함한 local handoff package를 한 번에 생성합니다. `design-ai site <bundle-dir> --bundle-check --strict --json`은 target-repo handoff 전에 file manifest, JSON consistency, 재계산한 MCP readiness, 필수 Markdown anchor, `summary.json`에 기록된 SHA-256 checksum, `summary.json.checksums.bundleDigest` bundle identity를 확인해 generated package를 검증합니다. `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json`은 두 handoff bundle의 bundle digest, file checksum, summary metadata를 비교해 archive 또는 재생성된 bundle이 같은지 확인합니다. `design-ai site <bundle-dir> --bundle-handoff --strict --json`은 검증된 handoff bundle을 bundle digest, bundle-check status, implementation prompt, operating rules, final response requirements가 포함된 target-repo Codex prompt로 변환합니다. JSON output을 `--out target-repo-handoff.json --force`로 저장한 뒤 Console sidebar의 import로 다시 불러오면 Report tab의 Operator Runbook에서 stage metric, status chip, evidence progress, copy-ready next line을 검토할 수 있습니다. `design-ai site --tasks`는 audit finding를 deterministic starter refactor task로 확장합니다. `design-ai site --prompt <template-id>`는 다른 도구에 붙여넣을 다음 Codex 또는 Claude instruction만 필요할 때 단일 prompt template을 export합니다. Implementation prompt에서는 `--task <id-or-number>`를 붙여 기본 top-priority task 대신 특정 refactor task를 지정할 수 있습니다. `design-ai site`는 Website Console에서 export한 JSON을 검증하고, audit/MCP/task readiness summary, prioritized next-action checklist, Markdown handoff report, Codex/Claude prompt bundle, structured MCP action plan, portable workflow graph, complete handoff bundle directory, target-repo handoff prompt를 생성합니다. 대상 웹사이트 repo를 수정하거나 외부 MCP를 호출하지 않습니다.

Claude Code에서는 `/design-website-improvement` 명령이나 `website-improvement` skill을 사용할 수 있습니다.

## Verification Notes

최종 artifact는 target repo boundary, MCP readiness, refactor plan, verification method, accessibility/focus/contrast note, responsive note를 포함해야 합니다. 자동화되지 않은 Lighthouse, axe, crawling, 외부 write, model training을 완료된 기능처럼 쓰지 않아야 합니다.
