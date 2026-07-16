# External Publication Status

> Checked: 2026-07-16
> Scope: npm registry, GitHub Release, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

`@design-ai/cli@5.1.0` is public and npm `latest` points to `5.1.0`. GitHub
Actions run `29485715200` published the package through npm Trusted Publishing,
attached SLSA provenance, and passed public registry smoke. GitHub Release
`v5.1.0` is public, and the Homebrew formula targets the same tag and passed a
temporary-tap source install plus formula test. The release exposes 21 skills,
16 public commands, 4 review agents, 29 MCP tools, and 20 SDK exports. GitHub
Pages remains public, and `sungjin.design-ai-vscode@0.4.1` remains available on
the VS Code Marketplace.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli@5.1.0` | Published as `latest` at `2026-07-16T09:18:28.771Z`; SLSA provenance is present; public registry smoke passed. | Publish run `29485715200`; npm attestation predicate `https://slsa.dev/provenance/v1`; attestation endpoint `https://registry.npmjs.org/-/npm/v1/attestations/@design-ai%2fcli@5.1.0` |
| GitHub Release | `v5.1.0` | Published, not draft or prerelease, for tag commit `8a753359b585e439172e44219710d2f57e44c5ef`; asset `design-ai-cli-5.1.0.tgz` is 2,589,235 bytes with digest `sha256:f05854b4bc81e626096cfe85151f7e8149e3ecbd518c1ff1598e7667b2f7c8fc`. | Release run `29485715193`; [release page](https://github.com/sungjin9288/design-ai/releases/tag/v5.1.0) |
| Homebrew tap | `Formula/design-ai.rb` | Formula targets `v5.1.0` with source SHA-256 `66bf42c34ad1bf65f7db0a644353094a5fba715720f108549f69b3f0580b22b1`; Ruby syntax, `brew style`, temporary-tap source install, and `brew test` passed. | `Formula/design-ai.rb`; local temporary-tap verification on 2026-07-16 |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Public docs deployment remains active; the post-merge v5.1.0 Docs workflow passed. | Docs run `29485559848`; [public docs](https://sungjin9288.github.io/design-ai/) |
| VS Code Marketplace | `sungjin.design-ai-vscode` | Published version remains `0.4.1`; no extension release was part of v5.1.0. | `evidence/cli-logs/vscode-marketplace-status.log`; `evidence/cli-logs/vscode-publish-workflow-status.log` |
| MCP server | `@design-ai/cli@5.1.0` / local clone | Public registry smoke validates the `design-ai-mcp` entrypoint and 29-tool contract. Exactly three tools retain opt-in local learning-write behavior. | Publish run `29485715200`; release metadata and registry smoke |

## Interpretation

- v5.1.0 distribution is complete across npm, GitHub Release, and the Homebrew formula.
- npm publication uses OIDC Trusted Publishing rather than a long-lived repository token.
- The public package and MCP entrypoint share workflow-backed registry-smoke evidence.
- GitHub Pages and the VS Code extension are separate published surfaces; the extension remains at `0.4.1`.
- Distribution does not establish external adoption, production design quality, customer outcomes, or authentic pilot feedback.

## Recheck Commands

```bash
npm view @design-ai/cli@5.1.0 version dist-tags time dist.attestations --json
npm run registry:smoke
gh release view v5.1.0 --repo sungjin9288/design-ai --json tagName,isDraft,isPrerelease,publishedAt,url,assets
gh run view 29485715200 --repo sungjin9288/design-ai --json status,conclusion,name,url,headSha,createdAt,updatedAt
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v5.1.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
brew style Formula/design-ai.rb
npm exec --yes --package=@design-ai/cli@5.1.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
