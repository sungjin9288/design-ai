# Evidence Manifest

## 프로젝트 정보

- 프로젝트명: design-ai
- 생성일: 2026-06-09
- 프로젝트 유형: CLI / agent workflow / static documentation tool
- 경영평가 관련 기능: 확인되지 않음
- evidence 수집 범위: CLI 실행, output artifact 생성, Website Console screenshot, Mermaid architecture, Node test suite
- 우선 증거: CLI 실행 화면, Website Console 화면, VS Code Extension surface, generated design artifact, audit 결과

## 생성한 evidence 파일

### CLI logs

- `evidence/cli-logs/cli-version-json.log`
- `evidence/cli-logs/cli-help.log`
- `evidence/cli-logs/cli-list-skills.log`
- `evidence/cli-logs/cli-route-json.log`
- `evidence/cli-logs/cli-search-json.log`
- `evidence/cli-logs/cli-prompt-output.log`
- `evidence/cli-logs/cli-pack-output.log`
- `evidence/cli-logs/cli-site-sample.log`
- `evidence/cli-logs/cli-site-next-actions.log`
- `evidence/cli-logs/git-diff-check.log`
- `evidence/cli-logs/release-check.log`
- `evidence/cli-logs/ci-local.log`
- `evidence/cli-logs/npm-registry-status.log`
- `evidence/cli-logs/npm-registry-smoke.log`
- `evidence/cli-logs/github-pages-status.log`
- `evidence/cli-logs/github-release-v4.55.0.log`
- `evidence/cli-logs/github-release-v4.56.0.log`
- `evidence/cli-logs/npm-publish-v4.56.0-failed.log`
- `evidence/cli-logs/npm-publish-v4.56.0-preflight-failed.log`
- `evidence/cli-logs/homebrew-formula-status.log`
- `evidence/cli-logs/vscode-marketplace-status.log`
- `evidence/cli-logs/zip-integrity.log`
- `evidence/cli-logs/zip-contents.log`
- `evidence/cli-logs/secret-scan.log`
- `evidence/cli-logs/npm-test.log`
- `evidence/cli-logs/static-http-server.log`
- `evidence/cli-logs/cli-screen-route.log`
- `evidence/cli-logs/cli-screen-list-commands.log`
- `evidence/cli-logs/cli-check-design-artifact.log`
- `evidence/cli-logs/cli-audit-strict-json.log`
- `evidence/cli-logs/vscode-extension-compile.log`
- `evidence/cli-logs/vscode-extension-npm-test.log`
- `evidence/cli-logs/vscode-extension-vsce-package.log`
- `evidence/cli-logs/vscode-marketplace-listing-copy.log`
- `evidence/cli-logs/vscode-marketplace-secret-status.log`
- `evidence/cli-logs/vscode-publish-workflow-status.log`

### Audit results

- `evidence/audit-results/link-check-detail.log`

### Output artifacts

- `evidence/output-artifacts/button-component-prompt.md`
- `evidence/output-artifacts/landing-audit-pack.md`
- `evidence/output-artifacts/website-workspace-sample.json`
- `evidence/output-artifacts/website-next-actions.md`

### Screenshots

- `evidence/screenshots/website-console-home.png`
- `evidence/screenshots/website-console-accessibility-snapshot.md`
- `evidence/screenshots/cli-execution-screen.png`
- `evidence/screenshots/cli-execution-screen.html`
- `evidence/screenshots/website-console-priority.png`
- `evidence/screenshots/vscode-extension-surface-evidence.png`
- `evidence/screenshots/vscode-extension-surface-evidence.html`
- `evidence/screenshots/generated-design-artifact.png`
- `evidence/screenshots/generated-design-artifact.html`
- `evidence/screenshots/audit-results-evidence.png`
- `evidence/screenshots/audit-results-evidence.html`

### Architecture

- `evidence/architecture/current-architecture.md`
- `evidence/architecture/cli-sequence.md`

### API responses

- `evidence/api-responses/not-applicable.md`

## 검증 결과 요약

| 항목 | 결과 |
|---|---|
| CLI 대표 명령 | 통과 |
| output artifact 생성 | 통과 |
| Website Console 렌더링 | 통과 |
| Node test suite | 통과 - 302 tests, 302 pass, 0 fail |
| VS Code Extension compile/test/package | 통과 - GitHub Actions publish run `28430044818`에서 compile pass, 25 tests pass, VSIX package artifact upload, `vsce publish`, Marketplace Gallery API listing verification 통과 |
| git diff whitespace check | 통과 |
| design artifact check | 통과(exit 0), score 8/9 warning |
| repository audit strict | 통과 - 8 audits pass |
| full release gate | 통과 - `npm run release:check` exit 0, package smoke passed |
| local CI parity | 통과 - `npm run ci:local` exit 0, VS Code compile/unit test 및 MkDocs warning policy 포함 |
| portfolio zip integrity | 통과 - `unzip -t _portfolio_export/design_ai_portfolio_pack.zip` |
| portfolio zip contents | 확인 완료 - `zipinfo -1 _portfolio_export/design_ai_portfolio_pack.zip` |
| secret pattern scan | 통과 - API key, GitHub token, Slack token, AWS key, private key 패턴 매치 없음 |
| public npm registry status | 부분 통과 - `@design-ai/cli@4.55.0` published, registry smoke passed; `v4.56.0` publish attempt failed with npm registry `E404`, and current publish preflight fails with npm `E401` until `NPM_TOKEN` is replaced with a valid `@design-ai/cli` publish token |
| GitHub Pages status | 통과 - documented URL HTTP 200 |
| GitHub Release status | 통과 - `v4.56.0` published with release asset |
| Homebrew formula status | 부분 통과 - `v4.56.0` tarball SHA, Ruby syntax, `brew style` passed; path-based `brew audit` blocked by current Homebrew |
| VS Code Marketplace status | 통과 - `sungjin.design-ai-vscode@0.4.1` public listing 확인, Gallery API visible version `0.4.1`, browser item URL HTTP 200 |
| API response capture | 해당 없음 |

## 제외 원칙

다음 항목은 evidence와 portfolio zip에 포함하지 않습니다.

- `.env`, `.env.*`
- API key, password, credential, token 파일
- 개인정보, 고객사/기관 내부자료
- `node_modules/`, `venv/`, `.venv/`
- `.git/`
- `build/`, `dist/`, `.next/`, `out/`, `target/`
- 소스코드 전체 폴더
