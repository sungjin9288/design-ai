# External Publication Status

> Checked: 2026-07-06
> Scope: npm registry, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

npm is publicly published at `@design-ai/cli@4.62.0` (npm dist-tag `latest` = `4.62.0`); publish run from tag `v4.62.0` succeeded with provenance and all pre-publish gates green. This release ships the closed dogfood loop: the `flow-design` route, the trust & safety corpus file and worked example, the recall-injection exclusion of `docs/` (design-knowledge-only recall), the `pack` UTF-8 byte-budget fix, and the Agent SDK walkthrough (en/ko). The live `npm run registry:smoke` passes cleanly against published `@design-ai/cli@4.62.0` ("Registry smoke passed"), covering the retrieval surfaces (index/ranked/embeddings/recall) and route enrichment. GitHub Release `v4.62.0` is published, and the Homebrew tap formula points at the `v4.62.0` release source tarball with a verified SHA-256. The VS Code extension `sungjin.design-ai-vscode` remains published at `0.4.1`. GitHub Pages docs are publicly reachable.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli` | Published latest is `4.62.0` (tag `v4.62.0`, provenance). Pre-publish packed-tarball smoke (incl. SDK import + `learn.remember` write) and live `npm run registry:smoke` both pass for `@design-ai/cli@4.62.0`. | `npm view @design-ai/cli version` → `4.62.0`; live registry smoke "Registry smoke passed" |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Published and reachable: HTTP `200`, design-ai MkDocs page rendered | `evidence/cli-logs/github-pages-status.log` |
| Homebrew tap | `Formula/design-ai.rb` | Formula pinned to `v4.62.0` release source tarball with SHA-256 `bb56b461359b4d94b5f2dd99d8f068364290d0b52469c75599725bd1ca78659f` (recomputed from the published tag tarball) | `Formula/design-ai.rb` |
| VS Code Marketplace | `sungjin.design-ai-vscode` | Published: run `28431571256` published `v0.4.1`, and the Marketplace Gallery API returned visible version `0.4.1` on 2026-07-02. | `evidence/cli-logs/vscode-marketplace-status.log`, `evidence/cli-logs/vscode-marketplace-secret-status.log`, `evidence/cli-logs/vscode-extension-vsce-package.log`, `evidence/cli-logs/vscode-publish-workflow-status.log` |
| GitHub Release | `v4.62.0` | Published for tag `v4.62.0` at commit `751c84d` | `gh release view v4.62.0` |
| MCP server | `@design-ai/cli@4.62.0` / local clone | Public npm `design-ai-mcp` responds to initialize and tools/list with 10 tools; local Codex and Claude Code both report `design-ai` MCP as configured and connected. | `evidence/cli-logs/npm-registry-smoke.log`, `evidence/cli-logs/design-ai-mcp-client-status.log` |

## Interpretation

- The repository is locally release-ready based on `npm run release:check`.
- GitHub Pages docs can now be described as publicly deployed.
- Public npm install can now be described as published and smoke-tested at `4.62.0`.
- Homebrew tap install can now be described as pinned to the `v4.62.0` release tarball; full tap audit/install/test remains a maintainer-side verification step because this Homebrew version rejects path-based `brew audit Formula/...` calls.
- VS Code Marketplace can now be described as published and publicly reachable at version `0.4.1`.
- Claude Code and Codex can now be described as locally connected to the clone-backed `design-ai` MCP server, while public npm users can verify the published `design-ai-mcp` entrypoint from a clean working directory.

## Recheck Commands

```bash
npm view @design-ai/cli version name time.modified dist-tags --json
curl -sS -L -o /tmp/design-ai-pages.html -w 'http_code=%{http_code}\nurl_effective=%{url_effective}\n' https://sungjin9288.github.io/design-ai/
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v4.62.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
brew style Formula/design-ai.rb
gh release view v4.62.0 --repo sungjin9288/design-ai --json tagName,isDraft,isPrerelease,publishedAt,name,url,assets
gh run view 28569283984 --repo sungjin9288/design-ai --json status,conclusion,name,url,createdAt,updatedAt
npm exec --yes --package=@design-ai/cli@4.62.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
