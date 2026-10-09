# External Publication Status

> Checked: 2026-10-09
> Scope: npm registry, GitHub Release, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

`@design-ai/cli@5.4.0` is public, and npm `latest` points to `5.4.0`. GitHub
Actions run `37805118505` published it through npm Trusted Publishing with SLSA
provenance, and the same run's post-publish registry smoke passed. GitHub
Release `v5.4.0` is public. The Homebrew formula targets the new tag. It passes
`brew style`, a temporary-tap source install, and `brew test`, with Node-gated
assertions checked by hand as described below.

The release exposes 21 skills, 16 public commands, 4 review agents, 29 MCP
tools, and 20 SDK exports. Review comparisons are now schemaVersion 2, and
quality reports stay at schemaVersion 2 with nine lenses. GitHub Pages remains
public, and `sungjin.design-ai-vscode@0.4.1` remains available on the VS Code
Marketplace.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli@5.4.0` | Published as `latest` at `2026-10-08T16:18:53.874Z`. SLSA provenance is present. 907 files, 11,869,934 bytes unpacked, integrity `sha512-8al2wsaRp1rya0KS6CB8b02z14vfBrB0XnVfPY4mzyRMPmGRTND3Av9SP41mgeZ+oeGxcyxVdn1/qxAVuWRLRg==`. | Publish run `37805118505`; npm attestation predicate `https://slsa.dev/provenance/v1`; attestation endpoint `https://registry.npmjs.org/-/npm/v1/attestations/@design-ai%2fcli@5.4.0` |
| Public registry smoke | `@design-ai/cli@5.4.0` | Passed twice: in the publish workflow's post-publish step, and in a separate local `npm run registry:smoke` against the published package. Both reported `Registry smoke passed: @design-ai/cli@5.4.0`. The published `review-compare` also emitted a schemaVersion 2 comparison. | Publish run `37805118505`, step "Smoke-test published npm package"; local run on 2026-10-09 |
| GitHub Release | `v5.4.0` | Published, not a draft or prerelease, at `2026-10-08T16:13:40Z`. The tag is annotated on commit `9e532b33b7de53ddb3cdd29edfd298e4665006a7`. Asset `design-ai-cli-5.4.0.tgz` is 2,772,488 bytes. | Release run `37805118474`; [release page](https://github.com/sungjin9288/design-ai/releases/tag/v5.4.0) |
| Homebrew tap | `Formula/design-ai.rb` | Formula targets `v5.4.0` with source SHA-256 `6774ee2327f46ee9bcba65f80b567e75b1deca3d849e03500a5b71c161433e11`, the same across two downloads. `ruby -c` reports `Syntax OK`, and `brew style` reports no offenses. A temporary-tap `--build-from-source --without-node` install and `brew test` both exited 0. Homebrew had no `node`, so the formula skipped linking the `design-ai` CLI and `brew test` skipped its Node-gated `help` and `version` assertions. Running the installed `libexec/cli/bin/design-ai.mjs` with the system Node reported CLI and corpus `5.4.0`, and `review-compare` emitted a schemaVersion 2 comparison. The plugin manifest lists 21 skills, 16 commands, and 4 agents. The temporary tap and install were removed afterwards, and `brew missing` reports no gaps. | `Formula/design-ai.rb`; local temporary-tap verification on 2026-10-09 |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Public docs return HTTP 200, and the Docs workflow passed on the release commit. | Docs run `36386421062`; [public docs](https://sungjin9288.github.io/design-ai/) |
| VS Code Marketplace | `sungjin.design-ai-vscode` | The published version remains `0.4.1`; no extension release was part of v5.4.0. | `evidence/cli-logs/vscode-marketplace-status.log`; `evidence/cli-logs/vscode-publish-workflow-status.log` |
| MCP server | `@design-ai/cli@5.4.0` / local clone | Public registry smoke validates the `design-ai-mcp` entrypoint and the 29-tool contract. Exactly three tools keep opt-in local learning-write behavior. | Publish run `37805118505` registry smoke |

## Interpretation

- v5.4.0 distribution is complete across npm, GitHub Release, and the Homebrew
  formula. Re-run the Node-gated `brew test` assertions on a machine that has
  Homebrew `node` to cover the linked CLI path.
- npm publication uses OIDC Trusted Publishing, not a long-lived repository
  token.
- The default review comparison output changed from schemaVersion 1 to 2.
  Readers still accept version 1, so stored comparisons keep verifying, but
  readers older than v5.4.0 reject comparison v2. Quality reports stay at
  schemaVersion 2.
- GitHub Pages and the VS Code extension are separate published surfaces. The
  extension remains at `0.4.1`.
- The Image Console shipped in v5.2.0; v5.4.0 only improves its required-field
  errors and completion message. Its deterministic local mock loopback is
  verified. A live Prompt Guide call and a real provider
  generation/edit remain unverified.
- Distribution does not establish external adoption, production design quality,
  customer outcomes, or authentic pilot feedback.

## Recheck Commands

```bash
npm view @design-ai/cli@5.4.0 version dist-tags time dist.attestations --json
npm run registry:smoke
gh release view v5.4.0 --repo sungjin9288/design-ai --json tagName,isDraft,isPrerelease,publishedAt,url,assets
gh run view 37805118505 --repo sungjin9288/design-ai --json status,conclusion,name,url,headSha,createdAt,updatedAt
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v5.4.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
brew style Formula/design-ai.rb
npm exec --yes --package=@design-ai/cli@5.4.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
