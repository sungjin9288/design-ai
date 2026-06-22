# Implementation Evidence

## 1. 프로젝트 유형 판단

| 항목 | 판단 | 근거 |
|---|---|---|
| 프로젝트 유형 | CLI / agent workflow / static documentation tool | `package.json`, `cli/bin/design-ai.mjs`, `AGENTS.md`, `docs/website-console/index.html` |
| 웹앱 포함 여부 | 포함 - static Website Improvement Console | `docs/website-console/index.html`, `docs/website-console/app.js` |
| API 프로젝트 여부 | 아님 | HTTP server/API route 구현 근거 없음 |
| 오케스트레이션 여부 | 해당 | CLI dispatcher가 command modules, corpus, output artifacts를 연결 |
| 현재 상태 | 고도화 중 | `README.md`, `docs/PRODUCT-READINESS.md` |
| 경영평가 관련 기능 | 확인되지 않음 | README, CLI, docs 기준 디자인/agent workflow 도구 |

## 2. 구현 증거가 필요한 기능

| 기능 | 구현 상태 | 증거 유형 | 근거 파일 | 실행 증거 |
|---|---|---|---|---|
| CLI 실행 화면 | 검증 완료 | screenshot + CLI log | `cli/bin/design-ai.mjs`, `cli/lib/dispatch.mjs` | `evidence/screenshots/cli-execution-screen.png` |
| Website Console 화면 | 검증 완료 | screenshot | `docs/website-console/index.html`, `docs/website-console/app.js` | `evidence/screenshots/website-console-priority.png` |
| VS Code Extension surface | 조건부 검증 완료 | manifest-based screenshot + compile/test log | `vscode-extension/package.json`, `vscode-extension/src/`, `vscode-extension/out/` | `evidence/screenshots/vscode-extension-surface-evidence.png` |
| 생성된 design artifact | 검증 완료 | output artifact + preview screenshot | `cli/commands/prompt.mjs`, `cli/lib/prompt.mjs` | `evidence/output-artifacts/button-component-prompt.md`, `evidence/screenshots/generated-design-artifact.png` |
| audit 결과 | 검증 완료 | audit log + screenshot | `cli/commands/audit.mjs`, `tools/audit/run-all.py` | `evidence/screenshots/audit-results-evidence.png`, `evidence/cli-logs/release-check.log` |
| CLI version metadata | 검증 완료 | CLI log | `cli/bin/design-ai.mjs`, `cli/commands/version.mjs` | `evidence/cli-logs/cli-version-json.log` |
| CLI help/catalog | 검증 완료 | CLI log | `cli/lib/dispatch.mjs`, `cli/commands/help.mjs` | `evidence/cli-logs/cli-help.log` |
| skill catalog listing | 검증 완료 | CLI JSON log | `cli/commands/list.mjs`, `.claude-plugin/plugin.json` | `evidence/cli-logs/cli-list-skills.log` |
| route recommendation | 검증 완료 | CLI JSON log | `cli/commands/route.mjs`, `cli/lib/route.mjs` | `evidence/cli-logs/cli-route-json.log` |
| corpus search | 검증 완료 | CLI JSON log | `cli/commands/search.mjs`, `cli/lib/search.mjs` | `evidence/cli-logs/cli-search-json.log` |
| prompt artifact generation | 검증 완료 | CLI log + output artifact | `cli/commands/prompt.mjs`, `cli/lib/prompt.mjs` | `evidence/output-artifacts/button-component-prompt.md` |
| pack artifact generation | 검증 완료 | CLI log + output artifact | `cli/commands/pack.mjs`, `cli/lib/pack.mjs` | `evidence/output-artifacts/landing-audit-pack.md` |
| Website Console sample workspace | 검증 완료 | CLI log + JSON artifact | `cli/commands/site.mjs`, `cli/lib/site.mjs` | `evidence/output-artifacts/website-workspace-sample.json` |
| Website Console next actions | 검증 완료 | CLI log + Markdown artifact | `cli/commands/site.mjs`, `cli/lib/site.mjs` | `evidence/output-artifacts/website-next-actions.md` |
| Website Console UI rendering | 검증 완료 | screenshot + accessibility snapshot | `docs/website-console/index.html`, `docs/website-console/app.js` | `evidence/screenshots/website-console-home.png` |
| Node test suite | 검증 완료 | test log | `package.json`, `cli/lib/*.test.mjs` | `evidence/cli-logs/npm-test.log` |
| VS Code Extension compile/test | 검증 완료 | CLI logs | `vscode-extension/package.json`, `vscode-extension/test/lib.test.mjs` | `evidence/cli-logs/vscode-extension-compile.log`, `evidence/cli-logs/vscode-extension-npm-test.log` |
| whitespace diff check | 검증 완료 | CLI log | git working tree | `evidence/cli-logs/git-diff-check.log` |
| HTTP API response | 해당 없음 | not-applicable note | HTTP endpoint 없음 | `evidence/api-responses/not-applicable.md` |
| backend auth / database sync | 미구현 | 문서상 boundary | `docs/PRODUCT-READINESS.md` | 검증 대상 아님 |
| model training / fine-tuning | 미구현 | 문서상 boundary | `docs/PRODUCT-READINESS.md`, `docs/AI-LEARNING.md` | 검증 대상 아님 |
| full release gate | 검증 완료 | release check log | `package.json` `release:check` | `evidence/cli-logs/release-check.log` |

## 3. 실행한 검증

| 명령 | 결과 | 증거 파일 |
|---|---|---|
| `node cli/bin/design-ai.mjs version --json` | 통과 | `evidence/cli-logs/cli-version-json.log` |
| `node cli/bin/design-ai.mjs help` | 통과 | `evidence/cli-logs/cli-help.log` |
| `node cli/bin/design-ai.mjs list skills --json` | 통과 | `evidence/cli-logs/cli-list-skills.log` |
| `node cli/bin/design-ai.mjs route ... --json` | 통과 | `evidence/cli-logs/cli-route-json.log` |
| `node cli/bin/design-ai.mjs search ... --json` | 통과 | `evidence/cli-logs/cli-search-json.log` |
| `node cli/bin/design-ai.mjs prompt ... --out ...` | 통과 | `evidence/cli-logs/cli-prompt-output.log` |
| `node cli/bin/design-ai.mjs pack ... --out ...` | 통과 | `evidence/cli-logs/cli-pack-output.log` |
| `node cli/bin/design-ai.mjs site --sample --out ...` | 통과 | `evidence/cli-logs/cli-site-sample.log` |
| `node cli/bin/design-ai.mjs site ... --next-actions --out ...` | 통과 | `evidence/cli-logs/cli-site-next-actions.log` |
| `git diff --check` | 통과 | `evidence/cli-logs/git-diff-check.log` |
| `npm test` | 통과 - 302 tests, 302 pass, 0 fail | `evidence/cli-logs/npm-test.log` |
| `npm --prefix vscode-extension test` | 통과 - 25 tests, 25 pass, 0 fail | `evidence/cli-logs/vscode-extension-npm-test.log` |
| `npm --prefix vscode-extension run compile` | 통과 | `evidence/cli-logs/vscode-extension-compile.log` |
| `node cli/bin/design-ai.mjs audit --strict --quiet --json` | 실패 - 8 audits 중 7 pass, link audit fail | `evidence/cli-logs/cli-audit-strict-json.log`, `evidence/audit-results/link-check-detail.log` |
| `npm run release:check` | 통과 - test, audit, docs build, package smoke 포함 | `evidence/cli-logs/release-check.log` |
| `npm view @design-ai/cli ...` | public package 미확인 - `E404` | `evidence/cli-logs/npm-registry-status.log` |
| `curl https://sungjin9288.github.io/design-ai/` | public docs site 미확인 - HTTP 404 | `evidence/cli-logs/github-pages-status.log` |
| VS Code Marketplace extension query | public listing 없음 | `evidence/cli-logs/vscode-marketplace-status.log` |

## 4. 미구현 / 검증 필요 분리

### 미구현

- backend API
- auth
- database sync
- multi-user collaboration
- model training / fine-tuning
- embedding index
- automatic crawling / Lighthouse / axe / screenshot automation as product feature

### 검증 필요

- live VS Code Extension screenshot: 현재 환경에서 `code` CLI 및 VS Code 앱 경로를 확인하지 못해 manifest 기반 surface evidence로 대체
- GitHub Actions latest hosted run: local release gate는 통과했지만 hosted CI 최신 run은 별도 확인 필요
- repository link audit: 이번 evidence/export 산출물이 repo 루트에 생성되면서 `_portfolio_export/`와 generated pack 내부 상대 링크가 link checker 대상에 포함되어 실패
- 실제 사용자 피드백, adoption, 성과 수치

## 5. 안전한 포트폴리오 표현

- "Node.js CLI 기반 agent workflow toolkit을 구현하고 대표 명령 실행을 검증했다."
- "Markdown corpus, skills, commands, examples를 CLI route/prompt/pack/check workflow와 연결했다."
- "Website Improvement Console은 static local-first 화면으로 렌더링되며, sample workspace와 next-action artifact 생성이 확인됐다."
- "302개 Node test가 통과했다."

## 6. 위험 표현

- "AI 모델을 학습시켰다."
- "RAG/embedding 검색을 구현했다."
- "SaaS backend/API 서비스를 운영했다."
- "자동 Lighthouse/axe 진단 기능이 완성됐다."
- "정량 성과를 달성했다."
