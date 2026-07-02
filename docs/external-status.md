# External Publication Status

> Checked: 2026-07-02
> Scope: npm registry, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

Local release readiness is verified, GitHub Pages docs are publicly reachable, GitHub Release `v4.56.0` is published, and the Homebrew tap formula points at the `v4.56.0` release source tarball with a verified SHA-256. npm is still publicly published at `@design-ai/cli@4.55.0`; the `v4.56.0` npm publish attempt failed with registry `E404` on `PUT @design-ai/cli`, and the current publish preflight now fails earlier with npm `E401` on `whoami`. Replace `NPM_TOKEN` with a valid granular token that can publish `@design-ai/cli` before rerunning. The VS Code extension `sungjin.design-ai-vscode` is published to the VS Code Marketplace at version `0.4.1`; the Gallery API is reachable. The public npm MCP entrypoint and the local Claude Code / Codex MCP client registrations were rechecked on 2026-07-02.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli` | Published latest remains `4.55.0`; public registry smoke passed for `@design-ai/cli@4.55.0`. `v4.56.0` publish failed with `E404` on `PUT @design-ai/cli`; the current main workflow preflight now fails earlier with `E401 Unauthorized` on `npm whoami`, so `NPM_TOKEN` must be replaced with a valid granular token that can publish `@design-ai/cli`. | `evidence/cli-logs/npm-registry-status.log`, `evidence/cli-logs/npm-registry-smoke.log`, `evidence/cli-logs/npm-publish-v4.56.0-failed.log`, `evidence/cli-logs/npm-publish-v4.56.0-preflight-failed.log` |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Published and reachable: HTTP `200`, design-ai MkDocs page rendered | `evidence/cli-logs/github-pages-status.log` |
| Homebrew tap | `Formula/design-ai.rb` | Formula pinned to `v4.56.0` release source tarball with SHA-256 `507d2519296497defcd486c0ffc2b5164967a0bc540ddc31bc89502350688212`; Ruby syntax and `brew style` passed | `evidence/cli-logs/homebrew-formula-status.log` |
| VS Code Marketplace | `sungjin.design-ai-vscode` | Published: run `28431571256` published `v0.4.1`, and the Marketplace Gallery API returned visible version `0.4.1` on 2026-07-02. | `evidence/cli-logs/vscode-marketplace-status.log`, `evidence/cli-logs/vscode-marketplace-secret-status.log`, `evidence/cli-logs/vscode-extension-vsce-package.log`, `evidence/cli-logs/vscode-publish-workflow-status.log` |
| GitHub Release | `v4.56.0` | Published with release tarball asset `design-ai-cli-4.56.0.tgz` | `evidence/cli-logs/github-release-v4.56.0.log` |
| MCP server | `@design-ai/cli@4.55.0` / local clone | Public npm `design-ai-mcp` responds to initialize and tools/list with 10 tools; local Codex and Claude Code both report `design-ai` MCP as configured and connected. | `evidence/cli-logs/design-ai-mcp-public-registry-smoke.log`, `evidence/cli-logs/design-ai-mcp-client-status.log` |

## Interpretation

- The repository is locally release-ready based on `npm run release:check`.
- GitHub Pages docs can now be described as publicly deployed.
- Public npm install can be described as published and smoke-tested at `4.55.0`; `4.56.0` must not be described as npm-published until `NPM_TOKEN` is replaced, the publish preflight passes, and the publish workflow succeeds.
- Homebrew tap install can now be described as pinned to the `v4.56.0` release tarball; full tap audit/install/test remains a maintainer-side verification step because this Homebrew version rejects path-based `brew audit Formula/...` calls.
- VS Code Marketplace can now be described as published and publicly reachable at version `0.4.1`.
- Claude Code and Codex can now be described as locally connected to the clone-backed `design-ai` MCP server, while public npm users can verify the published `design-ai-mcp` entrypoint from a clean working directory.

## Recheck Commands

```bash
npm view @design-ai/cli version name time.modified dist-tags --json
curl -sS -L -o /tmp/design-ai-pages.html -w 'http_code=%{http_code}\nurl_effective=%{url_effective}\n' https://sungjin9288.github.io/design-ai/
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v4.56.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
brew style Formula/design-ai.rb
gh release view v4.56.0 --repo sungjin9288/design-ai --json tagName,isDraft,isPrerelease,publishedAt,name,url,assets
gh run view 28561753737 --repo sungjin9288/design-ai --log-failed
gh run view 28562868536 --repo sungjin9288/design-ai --log-failed
npm exec --yes --package=@design-ai/cli@4.55.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
