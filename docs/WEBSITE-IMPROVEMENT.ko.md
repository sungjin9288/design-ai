# Website Improvement Control Tower

`website-improvement`는 기존 웹사이트 개선 작업을 준비하고 관리하는 로컬 컨트롤 타워입니다. 이 repo는 대상 사이트의 소스 코드를 포함하거나 수정하지 않고, 진단 구조, 체크리스트, MCP readiness, Codex/Claude용 프롬프트, handoff report를 관리합니다.

## Web App

정적 앱은 [`docs/website-console/index.html`](website-console/index.html)에 있습니다. 별도 build나 dependency 없이 브라우저에서 열 수 있고, 상태는 `localStorage`에 저장됩니다.

주요 섹션:

| 섹션 | 역할 |
|---|---|
| Site Profile | 사이트 이름, live URL, repo/local path, Figma, brand notes, pages, user flows, viewport를 정리 |
| Audit Checklist | visual design, UX flow, responsive, accessibility, performance, SEO, technical quality, runtime issues, content quality 점검 |
| MCP Readiness Matrix | GitHub, Figma, Browser, DevTools, Deploy, Sentry, DB, CMS, 협업, 리서치 연결 필요도를 표시 |
| Refactor Plan | finding을 실제 task, priority, Codex prompt, verification, risk로 변환 |
| Prompt Generator | Codex/Claude에 넘길 8개 prompt template 생성 |
| Handoff Report | 작업 전후 상태와 남은 리스크를 Markdown report로 정리 |

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
design-ai route "improve website UX SEO performance" --json
design-ai prompt "improve homepage conversion" --route website-improvement --json
design-ai check examples/website-improvement-report.md --route website-improvement --strict
design-ai site --sample --out website-workspace.json
design-ai site website-workspace.json --tasks --out website-workspace.tasks.json
design-ai site website-workspace.json --json
design-ai site website-workspace.json --report --out website-handoff.md
design-ai site website-workspace.json --prompts --out website-prompts.md
```

`design-ai site --sample`은 파일 기반 workflow를 바로 시작할 수 있는 유효한 starter workspace JSON을 생성합니다. `design-ai site --tasks`는 audit finding를 deterministic starter refactor task로 확장합니다. `design-ai site`는 Website Console에서 export한 JSON을 검증하고, audit/MCP/task readiness summary, Markdown handoff report, Codex/Claude prompt bundle을 생성합니다. 대상 웹사이트 repo를 수정하거나 외부 MCP를 호출하지 않습니다.

Claude Code에서는 `/design-website-improvement` 명령이나 `website-improvement` skill을 사용할 수 있습니다.

## Verification Notes

최종 artifact는 target repo boundary, MCP readiness, refactor plan, verification method, accessibility/focus/contrast note, responsive note를 포함해야 합니다. 자동화되지 않은 Lighthouse, axe, crawling, 외부 write, model training을 완료된 기능처럼 쓰지 않아야 합니다.
