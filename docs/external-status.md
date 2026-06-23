# External Publication Status

> Checked: 2026-06-23
> Scope: npm registry, GitHub Pages, Homebrew tap, VS Code Marketplace

## Summary

Local release readiness is verified, GitHub Pages docs are publicly reachable, `@design-ai/cli@4.55.0` is published on npm with public registry smoke coverage, and the Homebrew tap formula points at the `v4.55.0` release source tarball with a verified SHA-256. The VS Code Marketplace extension id still returned no public listing at the time of this check.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli` | Published: npm reports version `4.55.0`; public registry smoke passed for `@design-ai/cli@4.55.0` | `evidence/cli-logs/npm-registry-status.log`, `evidence/cli-logs/npm-registry-smoke.log` |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Published and reachable: HTTP `200`, design-ai MkDocs page rendered | `evidence/cli-logs/github-pages-status.log` |
| Homebrew tap | `Formula/design-ai.rb` | Formula pinned to `v4.55.0` release source tarball with SHA-256 `ed59898e1134d5482d394a191a272ca835a6759b65f3a73215a16d1203892ab5`; Ruby syntax and `brew style` passed | `evidence/cli-logs/homebrew-formula-status.log` |
| VS Code Marketplace | `sungjin.design-ai-vscode` | No public Marketplace listing found for the publisher/extension id; publish token env vars were not present in this environment | `evidence/cli-logs/vscode-marketplace-status.log`, `evidence/cli-logs/vscode-extension-vsce-package.log` |
| GitHub Release | `v4.55.0` | Published with release tarball asset | `evidence/cli-logs/github-release-v4.55.0.log` |

## Interpretation

- The repository is locally release-ready based on `npm run release:check`.
- GitHub Pages docs can now be described as publicly deployed.
- Public npm install can now be described as published and smoke-tested.
- Homebrew tap install can now be described as pinned to the `v4.55.0` release tarball; full tap audit/install/test remains a maintainer-side verification step because this Homebrew version rejects path-based `brew audit Formula/...` calls.
- Public VS Code Marketplace install claims should not be used in portfolio or README copy until that surface is published with a Marketplace publisher token and rechecked.
- For portfolio wording, describe VS Code Marketplace as "prepared for" or "locally packaged", not "publicly shipped".

## Recheck Commands

```bash
npm view @design-ai/cli version name time.modified dist-tags --json
curl -sS -L -o /tmp/design-ai-pages.html -w 'http_code=%{http_code}\nurl_effective=%{url_effective}\n' https://sungjin9288.github.io/design-ai/
curl -sL https://github.com/sungjin9288/design-ai/archive/refs/tags/v4.55.0.tar.gz | shasum -a 256
ruby -c Formula/design-ai.rb
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
