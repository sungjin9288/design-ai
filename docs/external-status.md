# External Publication Status

> Checked: 2026-07-14
> Scope: npm registry, GitHub Release, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

`@design-ai/cli@5.0.0` is publicly available and npm `latest` points to `5.0.0`. GitHub Actions run `29302950960` published the package through npm Trusted Publishing, attached SLSA provenance, and completed the public registry smoke. A separate local `npm run registry:smoke` also passed against the published package. GitHub Release `v5.0.0` is public, and the Homebrew formula targets the same tag. The release exposes 21 skills, 16 public commands, 4 review agents, 17 MCP tools, and 10 SDK exports. GitHub Pages remains public, and `sungjin.design-ai-vscode@0.4.1` remains available on the VS Code Marketplace.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli@5.0.0` | Published as `latest` at `2026-07-14T03:23:14.040Z`; SLSA provenance is present; workflow and local live registry smoke passed. | Publish run `29302950960`; npm attestation predicate `https://slsa.dev/provenance/v1`; Sigstore log index `2166685545`; `evidence/cli-logs/npm-registry-smoke-v5-summary.log` |
| GitHub Release | `v5.0.0` | Published, not draft or prerelease, for tag commit `b352302eb1775296a493cf9fd68a7164fd905bf7`; asset `design-ai-cli-5.0.0.tgz` is 2,351,328 bytes with digest `sha256:e2053e29797ef3b07d83cd84b87c731b7a68af3b0d0b1797a933dbb8612b19f4`. | `gh release view v5.0.0`; [release page](https://github.com/sungjin9288/design-ai/releases/tag/v5.0.0) |
| Homebrew tap | `Formula/design-ai.rb` | Formula targets `v5.0.0` with source SHA-256 `710b458eee34b9813b0e96c355271e33e0cd25d1561002229c1c19858c689ae9`; `brew style`, temporary-tap install, and `brew test` passed. | `Formula/design-ai.rb`; PR `#31` verification |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Public docs deployment remains active; the post-merge Docs workflow for the publish-path fix passed. | Docs run `29302935114`; [public docs](https://sungjin9288.github.io/design-ai/) |
| VS Code Marketplace | `sungjin.design-ai-vscode` | Published version remains `0.4.1`; no extension release was part of v5.0.0. | `evidence/cli-logs/vscode-marketplace-status.log`; `evidence/cli-logs/vscode-publish-workflow-status.log` |
| MCP server | `@design-ai/cli@5.0.0` / local clone | Public registry smoke validates the `design-ai-mcp` entrypoint and 17-tool contract. Existing local evidence records both Codex and Claude Code connections to the clone-backed server. | Publish run `29302950960`; local registry smoke; `evidence/cli-logs/design-ai-mcp-client-status.log` |

## Interpretation

- v5.0.0 distribution is complete across npm, GitHub Release, and the Homebrew tap.
- npm publication no longer depends on a long-lived repository token; the workflow uses OIDC Trusted Publishing, and the obsolete GitHub `NPM_TOKEN` repository secret was removed after the successful publish.
- The public package and its MCP entrypoint have both workflow and independent local registry-smoke evidence.
- GitHub Pages and the VS Code extension are separate published surfaces; the extension remains at `0.4.1`.
- A public announcement is not implied by distribution completion and remains a maintainer decision.

## Recheck Commands

```bash
npm view @design-ai/cli@5.0.0 version dist-tags time dist.attestations --json
npm run registry:smoke
gh release view v5.0.0 --repo sungjin9288/design-ai --json tagName,isDraft,isPrerelease,publishedAt,url,assets
gh run view 29302950960 --repo sungjin9288/design-ai --json status,conclusion,name,url,headSha,createdAt,updatedAt
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v5.0.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
brew style Formula/design-ai.rb
npm exec --yes --package=@design-ai/cli@5.0.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
