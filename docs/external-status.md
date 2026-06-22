# External Publication Status

> Checked: 2026-06-23
> Scope: npm registry, GitHub Pages, VS Code Marketplace

## Summary

Local release readiness is verified and GitHub Pages docs are publicly reachable. The npm package name in `package.json` and the VS Code Marketplace extension id still returned no public listing at the time of this check.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli` | Not published or not publicly accessible: npm returned `E404` | `evidence/cli-logs/npm-registry-status.log` |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Published and reachable: HTTP `200`, design-ai MkDocs page rendered | `evidence/cli-logs/github-pages-status.log` |
| VS Code Marketplace | `sungjin.design-ai-vscode` | No public Marketplace listing found for the publisher/extension id | `evidence/cli-logs/vscode-marketplace-status.log` |

## Interpretation

- The repository is locally release-ready based on `npm run release:check`.
- GitHub Pages docs can now be described as publicly deployed.
- Public npm install and Marketplace install claims should not be used in portfolio or README copy until those surfaces are published and rechecked.
- For portfolio wording, describe npm/package/Marketplace as "prepared for" or "local/package smoke verified", not "publicly shipped".

## Recheck Commands

```bash
npm view @design-ai/cli version name time.modified dist-tags --json
curl -sS -L -o /tmp/design-ai-pages.html -w 'http_code=%{http_code}\nurl_effective=%{url_effective}\n' https://sungjin9288.github.io/design-ai/
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
