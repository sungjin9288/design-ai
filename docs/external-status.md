# External Publication Status

> Checked: 2026-09-18
> Scope: npm registry, GitHub Release, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

`@design-ai/cli@5.2.0` is public and npm `latest` points to `5.2.0`. GitHub
Actions run `35324226089` published the package through npm Trusted Publishing
with SLSA provenance. That run then **failed** at its post-publish registry
smoke: the package had not propagated within the step's 12 retries over about
two minutes. The publication itself succeeded, and `npm run registry:smoke`
passed against the published package once propagation completed. GitHub Release
`v5.2.0` is public. The Homebrew formula targets the new tag and passed
`brew style`, a temporary-tap source install, and `brew test`. The release exposes 21 skills, 16 public
commands, 4 review agents, 29 MCP tools, and 20 SDK exports. GitHub Pages
remains public, and `sungjin.design-ai-vscode@0.4.1` remains available on the
VS Code Marketplace.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli@5.2.0` | Published as `latest` at `2026-09-18T08:40:57.973Z`; SLSA provenance is present; 884 files, 11,750,510 bytes unpacked, integrity `sha512-LXx65aIFqaspsrN5Fo+sUH3i05be3+74HMv17XNcA2pu8CHzn8vNztQ8n51h4qB/KV8lpqAYgb+vW5cCdTzCjw==`. | Publish run `35324226089`; npm attestation predicate `https://slsa.dev/provenance/v1`; attestation endpoint `https://registry.npmjs.org/-/npm/v1/attestations/@design-ai%2fcli@5.2.0` |
| GitHub Release | `v5.2.0` | Published, not draft or prerelease, for tag commit `14e9dcc8980e7c10ad942d44eeb90cfba5c83de7` at `2026-09-18T08:34:48Z`; asset `design-ai-cli-5.2.0.tgz` is 2,708,914 bytes. | Release run `35324226056`; [release page](https://github.com/sungjin9288/design-ai/releases/tag/v5.2.0) |
| Homebrew tap | `Formula/design-ai.rb` | Formula targets `v5.2.0` with source SHA-256 `216ed71227c4f7b7e317702594ae45af2f1e8cf62795b80aefda92e21453dce2`. `brew style` reported no offenses; a temporary-tap `--build-from-source` install and `brew test` both passed, including the Node-gated `design-ai help` and `design-ai version` assertions, with the installed binary reporting CLI and corpus `5.2.0` and a plugin manifest of 21 skills, 16 commands, and 4 agents. The temporary tap and install were removed afterwards and `brew missing` reports no gaps. | `Formula/design-ai.rb`; local temporary-tap verification on 2026-09-19 |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Public docs deployment remains active; the post-merge Docs workflow passed on `main`. | Docs run `35318694563`; [public docs](https://sungjin9288.github.io/design-ai/) |
| VS Code Marketplace | `sungjin.design-ai-vscode` | Published version remains `0.4.1`; no extension release was part of v5.2.0. | `evidence/cli-logs/vscode-marketplace-status.log`; `evidence/cli-logs/vscode-publish-workflow-status.log` |
| MCP server | `@design-ai/cli@5.2.0` / local clone | Public registry smoke validates the `design-ai-mcp` entrypoint and 29-tool contract. Exactly three tools retain opt-in local learning-write behavior. | `npm run registry:smoke` against the published package, 2026-09-18 |

## Interpretation

- v5.2.0 distribution is complete across npm, GitHub Release, and the Homebrew formula.
- npm publication uses OIDC Trusted Publishing rather than a long-lived repository token.
- Registry-smoke evidence for this version is a local run against the published package, not a workflow run; the workflow's own post-publish smoke failed on propagation timing and was not re-run.
- GitHub Pages and the VS Code extension are separate published surfaces; the extension remains at `0.4.1`.
- The Image Console ships in this release with its deterministic local mock loopback verified. A live Prompt Guide call and a real provider generation/edit remain unverified.
- Distribution does not establish external adoption, production design quality, customer outcomes, or authentic pilot feedback.

## Recheck Commands

```bash
npm view @design-ai/cli@5.2.0 version dist-tags time dist.attestations --json
npm run registry:smoke
gh release view v5.2.0 --repo sungjin9288/design-ai --json tagName,isDraft,isPrerelease,publishedAt,url,assets
gh run view 29485715200 --repo sungjin9288/design-ai --json status,conclusion,name,url,headSha,createdAt,updatedAt
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v5.2.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
brew style Formula/design-ai.rb
npm exec --yes --package=@design-ai/cli@5.2.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
