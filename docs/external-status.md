# External Publication Status

> Checked: 2026-09-28
> Scope: npm registry, GitHub Release, GitHub Pages, Homebrew tap, VS Code Marketplace, Claude/Codex MCP

## Summary

`@design-ai/cli@5.3.0` is public, and npm `latest` points to `5.3.0`. GitHub
Actions run `36386562069` published it through npm Trusted Publishing with SLSA
provenance. The same run's post-publish registry smoke passed this time. The
ten-minute retry window added after v5.2.0 covered registry propagation. GitHub
Release `v5.3.0` is public. The Homebrew formula targets the new tag and passes
`ruby -c` and `brew style`. A temporary-tap install and `brew test` have not
been run for v5.3.0 yet.

The release exposes 21 skills, 16 public commands, 4 review agents, 29 MCP
tools, and 20 SDK exports. Quality reports are now schemaVersion 2, with the
`interface-copy` lens as the ninth lens. GitHub Pages remains public, and
`sungjin.design-ai-vscode@0.4.1` remains available on the VS Code Marketplace.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli@5.3.0` | Published as `latest` at `2026-09-28T06:47:38.417Z`. SLSA provenance is present. 907 files, 11,842,897 bytes unpacked, integrity `sha512-mjGRX5v8LmbndWmEp7WlhKN5hClzF4B7ogrEeZ8JGtrBVYtrMbsL5MbuCQGlDmyfEO4qK5K9zTEuxZBkFjFNvQ==`. | Publish run `36386562069`; npm attestation predicate `https://slsa.dev/provenance/v1`; attestation endpoint `https://registry.npmjs.org/-/npm/v1/attestations/@design-ai%2fcli@5.3.0` |
| Public registry smoke | `@design-ai/cli@5.3.0` | Passed twice: in the publish workflow's post-publish step, and in a separate local `npm run registry:smoke` against the published package. Both reported `Registry smoke passed: @design-ai/cli@5.3.0`. | Publish run `36386562069`, step "Smoke-test published npm package"; local run on 2026-09-28 |
| GitHub Release | `v5.3.0` | Published, not a draft or prerelease, at `2026-09-28T06:41:56Z`. The tag is annotated on commit `a9567ebc6f656142cb2a9092122c21865aaa13c2`. Asset `design-ai-cli-5.3.0.tgz` is 2,763,760 bytes. | Release run `36386562080`; [release page](https://github.com/sungjin9288/design-ai/releases/tag/v5.3.0) |
| Homebrew tap | `Formula/design-ai.rb` | Formula targets `v5.3.0` with source SHA-256 `97e0714da953d8238c2f94b3f53b795ee1c47e932f5bc914a07215afb4b77e8b`, the same across two downloads. `ruby -c` reports `Syntax OK`, and `brew style` reports no offenses. A temporary-tap `--build-from-source` install and `brew test` have not been run for this version. | `Formula/design-ai.rb`; local checks on 2026-09-28 |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Public docs return HTTP 200, and the Docs workflow passed on the release commit. | Docs run `36386421062`; [public docs](https://sungjin9288.github.io/design-ai/) |
| VS Code Marketplace | `sungjin.design-ai-vscode` | The published version remains `0.4.1`; no extension release was part of v5.3.0. | `evidence/cli-logs/vscode-marketplace-status.log`; `evidence/cli-logs/vscode-publish-workflow-status.log` |
| MCP server | `@design-ai/cli@5.3.0` / local clone | Public registry smoke validates the `design-ai-mcp` entrypoint and the 29-tool contract. Exactly three tools keep opt-in local learning-write behavior. | Publish run `36386562069` registry smoke |

## Interpretation

- v5.3.0 is distributed through npm and GitHub Release. The Homebrew formula
  points at it, but its install test is still pending.
- npm publication uses OIDC Trusted Publishing, not a long-lived repository
  token.
- The default quality report output changed from schemaVersion 1 to 2. Readers
  still accept version 1, so stored evidence keeps verifying.
- GitHub Pages and the VS Code extension are separate published surfaces. The
  extension remains at `0.4.1`.
- The Image Console is unchanged since v5.2.0. Its deterministic local mock
  loopback is verified. A live Prompt Guide call and a real provider
  generation/edit remain unverified.
- Distribution does not establish external adoption, production design quality,
  customer outcomes, or authentic pilot feedback.

## Recheck Commands

```bash
npm view @design-ai/cli@5.3.0 version dist-tags time dist.attestations --json
npm run registry:smoke
gh release view v5.3.0 --repo sungjin9288/design-ai --json tagName,isDraft,isPrerelease,publishedAt,url,assets
gh run view 36386562069 --repo sungjin9288/design-ai --json status,conclusion,name,url,headSha,createdAt,updatedAt
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v5.3.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
brew style Formula/design-ai.rb
npm exec --yes --package=@design-ai/cli@5.3.0 -- design-ai-mcp
codex mcp get design-ai
claude mcp list
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
