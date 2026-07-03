# External Publication Status

> Checked: 2026-07-03
> Scope: npm registry, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

npm is publicly published at `@design-ai/cli@4.57.0` (npm dist-tag `latest` = `4.57.0`); publish run `28663430171` from tag `v4.57.0` succeeded with provenance and all pre-publish gates green (8 audits, CLI unit tests, release self-tests, package contents, and the packed-tarball installed-package smoke on the 4.57.0 tarball). The automated post-publish live registry smoke step failed on a stale learn-relevance token-order assertion in `tools/audit/registry-smoke.py` — a verification-tool bug fixed on `main` in `710656a`, not a package defect; the published package is validated by the pre-publish packed-tarball smoke. GitHub Release `v4.57.0` is published, and the Homebrew tap formula points at the `v4.57.0` release source tarball with a verified SHA-256. The VS Code extension `sungjin.design-ai-vscode` remains published at `0.4.1`. GitHub Pages docs are publicly reachable.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli` | Published latest is `4.57.0`; publish run `28663430171` (tag `v4.57.0`) succeeded with provenance. Pre-publish packed-tarball smoke passed on the 4.57.0 tarball; the post-publish live registry smoke failed on a stale assertion (fixed on `main` `710656a`). | publish run `28663430171`; `npm view @design-ai/cli version` → `4.57.0` |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Published and reachable: HTTP `200`, design-ai MkDocs page rendered | `evidence/cli-logs/github-pages-status.log` |
| Homebrew tap | `Formula/design-ai.rb` | Formula pinned to `v4.57.0` release source tarball with SHA-256 `c1fed279ed7bc2daf42473bd9a68cf3fa6df6823fe3390b2f2ccee8625407559` (recomputed from the published tag tarball) | `Formula/design-ai.rb` |
| VS Code Marketplace | `sungjin.design-ai-vscode` | Published: run `28431571256` published `v0.4.1`, and the Marketplace Gallery API returned visible version `0.4.1` on 2026-07-02. | `evidence/cli-logs/vscode-marketplace-status.log`, `evidence/cli-logs/vscode-marketplace-secret-status.log`, `evidence/cli-logs/vscode-extension-vsce-package.log`, `evidence/cli-logs/vscode-publish-workflow-status.log` |
| GitHub Release | `v4.57.0` | Published (not draft/prerelease) for tag `v4.57.0` at commit `4be46d7` | `gh release view v4.57.0` |
| MCP server | `@design-ai/cli@4.57.0` / local clone | Public npm `design-ai-mcp` responds to initialize and tools/list with 10 tools; local Codex and Claude Code both report `design-ai` MCP as configured and connected. | `evidence/cli-logs/npm-registry-smoke.log`, `evidence/cli-logs/design-ai-mcp-client-status.log` |

## Interpretation

- The repository is locally release-ready based on `npm run release:check`.
- GitHub Pages docs can now be described as publicly deployed.
- Public npm install can now be described as published and smoke-tested at `4.56.0`.
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
gh run view 28569283984 --repo sungjin9288/design-ai --json status,conclusion,name,url,createdAt,updatedAt
npm exec --yes --package=@design-ai/cli@4.56.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
