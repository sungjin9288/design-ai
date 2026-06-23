# External Publication Status

> Checked: 2026-06-23
> Scope: npm registry, GitHub Pages, VS Code Marketplace

## Summary

Local release readiness is verified, GitHub Pages docs are publicly reachable, and `@design-ai/cli@4.55.0` is published on npm with public registry smoke coverage. The VS Code Marketplace extension id still returned no public listing at the time of this check.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli` | Published: npm reports version `4.55.0`; public registry smoke passed for `@design-ai/cli@4.55.0` | `evidence/cli-logs/npm-registry-status.log`, `evidence/cli-logs/npm-registry-smoke.log` |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Published and reachable: HTTP `200`, design-ai MkDocs page rendered | `evidence/cli-logs/github-pages-status.log` |
| VS Code Marketplace | `sungjin.design-ai-vscode` | No public Marketplace listing found for the publisher/extension id | `evidence/cli-logs/vscode-marketplace-status.log` |
| GitHub Release | `v4.55.0` | Published with release tarball asset | `evidence/cli-logs/github-release-v4.55.0.log` |

## Interpretation

- The repository is locally release-ready based on `npm run release:check`.
- GitHub Pages docs can now be described as publicly deployed.
- Public npm install can now be described as published and smoke-tested.
- Public VS Code Marketplace install claims should not be used in portfolio or README copy until that surface is published and rechecked.
- For portfolio wording, describe VS Code Marketplace as "prepared for" or "locally packaged", not "publicly shipped".

## Recheck Commands

```bash
npm view @design-ai/cli version name time.modified dist-tags --json
curl -sS -L -o /tmp/design-ai-pages.html -w 'http_code=%{http_code}\nurl_effective=%{url_effective}\n' https://sungjin9288.github.io/design-ai/
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
