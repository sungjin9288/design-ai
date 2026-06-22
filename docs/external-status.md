# External Publication Status

> Checked: 2026-06-22
> Scope: npm registry, GitHub Pages, VS Code Marketplace

## Summary

Local release readiness is verified, but public distribution is not currently confirmed. The npm package name in `package.json`, the documented GitHub Pages URL, and the VS Code Marketplace extension id all returned no public listing or a 404 response at the time of this check.

## Results

| Surface | Checked target | Result | Evidence |
|---|---|---|---|
| npm registry | `@design-ai/cli` | Not published or not publicly accessible: npm returned `E404` | `evidence/cli-logs/npm-registry-status.log` |
| GitHub Pages | `https://sungjin9288.github.io/design-ai/` | Not deployed at that URL: HTTP `404`, GitHub Pages "Site not found" page | `evidence/cli-logs/github-pages-status.log` |
| VS Code Marketplace | `sungjin.design-ai-vscode` | No public Marketplace listing found for the publisher/extension id | `evidence/cli-logs/vscode-marketplace-status.log` |

## Interpretation

- The repository is locally release-ready based on `npm run release:check`.
- Public npm install, GitHub Pages docs, and Marketplace install claims should not be used in portfolio or README copy until these surfaces are published and rechecked.
- For portfolio wording, describe npm/package/Pages/Marketplace as "prepared for" or "local/package smoke verified", not "publicly shipped".

## Recheck Commands

```bash
npm view @design-ai/cli version name time.modified dist-tags --json
curl -sS -L -o /tmp/design-ai-pages.html -w 'http_code=%{http_code}\nurl_effective=%{url_effective}\n' https://sungjin9288.github.io/design-ai/
curl -sS -H 'Content-Type: application/json' \
  -H 'Accept: application/json;api-version=7.2-preview.1' \
  -X POST https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery \
  -d '{"filters":[{"criteria":[{"filterType":7,"value":"sungjin.design-ai-vscode"}]}],"flags":914}'
```
