# Prompt Guide Image Console

`design-ai image serve` runs a loopback-only Image Console for one local operator. Prompt Guide is the sole authority for prompt templates and specialization; the browser only talks to the same-origin Design gateway. The gateway performs recommendation, composition, and validation before one explicitly approved provider subprocess execution.

## Current-source release status

Image Console release hardening is part of the current-source v5.2.0 release
candidate and remains unreleased; it is not published behavior. The
deterministic local mock loopback flow covers
packaged static assets, health, catalog, generation draft validation, rejection
before approval, and one approved deterministic local provider execution through
the installed-bin and one-shot packed-tarball paths. It makes no Prompt
Guide/provider-network call, uses isolated temporary HOME, npm cache, provider,
and asset roots, reaps child processes, and asserts unchanged repository status.
Registry live coverage remains pending future publish. The registry smoke
self-test mirrors this contract without claiming post-publish coverage.

This page owns the exact current-source measurement so release-facing documents
do not copy counts that drift as the package changes. The 2026-09-05 local RC
receipt on macOS 26.6.2, Node 24.18.0, and Python 3.12.12 records 59/59 focused
Image Console tests with no skips, 891/891 release-preflight Node tests, 8/8
strict audits, 886 package files, and 0/0 documentation-policy warnings. Packed
installed-bin and one-shot smoke plus `npm run release:check` pass. Packed bytes,
artifact digest, and wall time belong to the source-repository run receipt rather
than this packaged page. The earlier 46-pass/4-skip observation was sandbox-
specific and is not the current local result.

Manual browser QA covers successful deterministic local generation and editing,
approval consumption, source selection, draft reset, desktop and mobile layouts,
keyboard navigation, focus visibility, reduced motion, and WCAG 2.1 AA contrast.
Its current source-repository receipt is `evidence/image-console/completion-qa.md`;
the earlier missing-provider browser receipt remains in `evidence/image-console/browser-qa.md`.
No live Prompt Guide endpoint/key or real provider adapter was configured, so a
live Prompt Guide call and real provider generation/edit remain unverified. Registry live
coverage remains pending future publish.

## Architecture and boundaries

| Role | Owns | Must not contain |
| --- | --- | --- |
| Browser Console | Separate generation/editing forms, draft review, explicit approval | Prompt Guide URL, key, `Authorization`, provider secret, template content |
| Loopback gateway | Same-origin routes, Prompt Guide client, local asset selector | Public network bind, browser-facing credentials |
| Prompt Guide | Catalog/versioned recommendation, compiled prompt, validation | Provider execution or local asset bytes |
| Local provider adapter | One JSON subprocess input and image bytes/result metadata | Prompt Guide environment variables or raw template response |
| Asset store | Image bytes and bounded review manifest | Raw provider response, secret, or full prompt text |

The gateway accepts only `127.0.0.1`, `::1`, or `localhost`, rejects a Host/port or Origin that does not match that loopback authority, and accepts POST bodies only as JSON. Every response denies framing and carries a same-origin CSP, preventing another page from overlaying the approval control. Browser responses omit catalog template definitions and internal compiled prompt blocks. It does not expose the SDK or MCP server, retry POST composition, fetch an upstream fallback catalog, or copy upstream templates, cases, images, source, API, or database content.

## Server-only environment

Put values in the server process only; do not expose any of these to the browser, source control, logs, or a generated manifest.

| Variable | Required | Meaning |
| --- | --- | --- |
| `PROMPT_GUIDE_MODE` | Yes | `live` for Prompt Guide HTTP; `mock` for deterministic local synthetic responses. Mock is rejected when `NODE_ENV=production`. |
| `PROMPT_GUIDE_BASE_URL` | Live | Absolute HTTPS endpoint root for the v1 Prompt Guide service. Plain HTTP is accepted only for literal loopback development. |
| `PROMPT_GUIDE_API_KEY` | Live | Server-only bearer credential. Never include a value in this repository. |
| `PROMPT_GUIDE_TIMEOUT_MS` | No | Integer 100–120000; default `15000`. |
| `PROMPT_GUIDE_EXPECTED_RESPONSE_VERSION` | No | Must be `v1`; matching accepted versions are persisted in a compiled draft and manifest. |
| `IMAGE_PROVIDER_COMMAND` | Yes to execute | Absolute local adapter executable path. |
| `IMAGE_PROVIDER_ARGS` | No | JSON string array of local adapter arguments. |
| `IMAGE_PROVIDER_NAME` | No | Non-secret provider label. The adapter response supplies the actual model recorded in the manifest. |
| `IMAGE_PROVIDER_TIMEOUT_MS` | No | Integer 100–120000; default `60000`. |

The child process inherits only minimal runtime variables plus explicitly named `IMAGE_PROVIDER_*` configuration; all Prompt Guide and unrelated process credentials are removed. It receives a bounded JSON object with prompt text, constraints, output settings, asset descriptors, and provider options. The command must be an absolute executable path, uses `shell: false`, independently bounds stdout and stderr to 12 MiB, and rejects output whose bytes do not match the declared PNG, JPEG, or WebP media type. An editing descriptor is exactly `{ assetId, assetPath, mediaType, byteSize, sha256 }`; `assetPath` is a verified regular image path inside the configured asset root and the other fields are read from the same manifest and image bytes. The manifest records the approved request's `size` and `quality`; arbitrary adapter response parameters are not persisted.

## Local run: one server terminal

Use Node 18+ from this repository. The command starts no external network service in mock mode; its generated assets still require an operator-provided local provider adapter.

Set Prompt Guide and provider configuration in the same shell that starts the
gateway. Environment exports in a different terminal are not inherited.
Replace the provider path below with an executable adapter you own; there is
deliberately no bundled real provider.

```bash
cd /absolute/path/to/design-ai
export PROMPT_GUIDE_MODE=mock
export PROMPT_GUIDE_TIMEOUT_MS=15000
export PROMPT_GUIDE_EXPECTED_RESPONSE_VERSION=v1
export IMAGE_PROVIDER_COMMAND=/absolute/path/to/local-provider-adapter
export IMAGE_PROVIDER_ARGS='[]'
export IMAGE_PROVIDER_TIMEOUT_MS=60000
```

Start the gateway from that configured terminal, then open its printed URL:

```bash
node cli/bin/design-ai.mjs image serve --host 127.0.0.1 --port 4318
```

For live Prompt Guide, replace `PROMPT_GUIDE_MODE=mock` with `live` and supply the server-only URL/key through your process manager. Do not pass those values to the browser or a provider command line.

## Prompt Guide v1 contracts

All routes are gateway-to-Prompt-Guide only, use JSON, and carry correlation headers. Every successful response requires at least one non-empty response-version claim. Any present `x-response-version`, `x-api-version`, and body `responseVersion` claims must agree on `v1`; a missing, unsupported, or conflicting success claim is a `PromptGuideContractError`. HTTP errors retain their status-specific authentication, validation, rate-limit, and availability mapping even when they do not carry a success-version claim. The version never acts as a template source.

| Method and path | Request | Required response contract |
| --- | --- | --- |
| `GET /api/v1/image-prompts/catalog` | No body | Pinned `sourceRepository`, `upstreamCommit`, `catalogVersion`, `overlayVersions`, non-negative `templateCount` |
| `POST /api/v1/image-prompts/recommend` | `ImagePromptRequest` | Request-matching `taskType`, `language`, selected template ID/version, catalog version, reason, pinned provenance |
| `POST /api/v1/image-prompts/compose` | `ImagePromptRequest` | Request-matching task/language plus selected template/catalog version, compiled text, arrays, pinned provenance, timestamp |
| `POST /api/v1/image-prompts/validate` | Request plus compiled v1 draft | Boolean validity and actionable errors/warnings |

Only catalog GET may retry once for an eligible transient error. POST recommendation, composition, and validation are never automatically retried. The gateway rejects request/recommendation/compiled task, language, template, catalog, and provenance lineage drift before saving a draft; it therefore creates no provider job.

## Generation and editing flows

### Generation

1. Enter purpose, domain, output type, language, and optional constraints.
2. The gateway validates the request and calls Prompt Guide recommend → compose → validate.
3. Review the read-only compiled prompt and response/template/catalog provenance.
4. Check the explicit approval control, then start one local provider job.
5. The asset store writes image bytes plus a minimal review manifest atomically.

Generation rejects editing-only instructions and source asset IDs, so a generated asset cannot claim unverified editing lineage.

The gateway generates one bounded request/correlation ID pair for each flow, passes the same correlation ID through recommend → compose → validate, and echoes safe IDs in response headers. Its injectable logger records only event, method/path, request or correlation ID, optional job ID, and status; it never receives prompts, request bodies, credentials, provider stderr, or raw Prompt Guide responses.

### Editing

1. Choose a stored source asset from the local selector; generation and editing do not share a form.
2. Specify preserve, modify, remove, add, and must-not-change instructions.
3. The workflow snapshots each source descriptor before Prompt Guide calls and requires the same hash, size, media type, ID, and path immediately before execution.
4. The provider sees only one bounded reference descriptor (`assetId`, verified `assetPath`, media type, byte size, hash), never storage payload embedded in the prompt text.

An unknown, deleted, malformed, or changed source asset fails before Prompt Guide composition or job/provider mutation. The UI reports a live, actionable error and keeps the execution control disabled.

Even coherent replacement of both image bytes and manifest requires a new draft.
The UI consumes approval when execution starts and ignores older job responses
after the form or mode changes. Refreshing assets preserves a still-valid selection.
An adapter exiting before reading stdin becomes a provider failure, not a gateway
process crash.

## Accessibility and responsive behavior

The shared console tokens provide 6.29:1 primary-action contrast (`#4f46e5` on white) and 5.91:1 error contrast (`#b91c1c` on `#fef2f2`). Image Console form boundaries use `#475569` on white at 7.58:1, exceeding the WCAG 2.1 AA 3:1 non-text UI threshold. Controls keep the shared 3 px visible focus ring and a minimum 44 px target. The mode tabs use roving `tabindex` with Arrow Left/Right, Home, and End keys; status and error changes use polite/assertive live regions. Below 840 px, the two-column layout becomes one column and the sticky preview returns to document flow.

## Error policy

| Failure | User-visible outcome | Provider/job effect |
| --- | --- | --- |
| Invalid local request or source asset | Specific form/gateway error | None |
| Prompt Guide 401/403, 422, 429, 5xx, timeout, malformed JSON/version | Actionable error; 429 includes retry delay | None |
| Recommendation/compiled lineage mismatch | Contract error | No saved draft or job |
| Invalid draft or missing explicit approval | Draft remains non-executable | None |
| Provider timeout, exit, oversized output, invalid media | Provider failure; no raw stderr displayed | Job recorded failed after valid execution start |

## Stored manifest

The image store persists an atomic `manifest.json` beside image bytes. It has no raw prompt, provider raw response, URL credential, or secret. The prompt fingerprint is always prefixed:

```json
{
  "assetId": "asset-local-1",
  "taskType": "generation",
  "selectedTemplateVersion": "1",
  "catalogVersion": "mock-v1",
  "acceptedResponseVersion": "v1",
  "compiledPromptHash": "sha256:<64-lowercase-hex-characters>",
  "provenance": {
    "sourceRepository": "https://github.com/freestylefly/awesome-gpt-image-2.git",
    "upstreamCommit": "de6a8ad89b6308dc49b316fcd9f7a56bf2a73273"
  },
  "reviewStatus": "draft",
  "rightsStatus": "original-generated"
}
```

## Verification commands

```bash
node --test cli/lib/prompt-guide-client.test.mjs cli/lib/image-provider.test.mjs cli/lib/image-workflow.test.mjs cli/lib/image-console-server.test.mjs docs/image-console/*.test.mjs
npm test
npm run audit:strict
npm run package:check
npm run docs:check
git diff --check
```

The current package has no `lint`, `typecheck`, or `build` script; this integration does not invent or install tooling. `npm run docs:check` may report an unavailable MkDocs dependency in a minimal local checkout; record that dependency limitation instead of treating it as a pass.

## Troubleshooting

| Symptom | Check | Recovery |
| --- | --- | --- |
| Server refuses to start | `PROMPT_GUIDE_MODE`, host, timeouts | Use loopback host; mock cannot run in production; set an integer timeout in range. |
| Live request fails version validation | Prompt Guide response header/body | Update the server-only expected version only after the v1 API contract is reviewed. |
| Editing selector is empty | `/api/image/assets` and local asset root | Generate a valid locally stored asset; do not type a storage path into the prompt. |
| Provider fails | Adapter exit and non-secret provider configuration | Check the local adapter and allowed media result; never add Prompt Guide variables to its environment. |
| Prompt Guide rejects request | Gateway error details | Correct the visible request fields; composition is not automatically retried. |

## Version update and rollback

When Prompt Guide changes, first review its published v1 response contract and pinned provenance. Update the server-only expected version only with matching runtime validator, client, workflow, manifest, fixture, documentation, and regression-test changes; run the commands above before enabling live mode.

To stop local execution, stop the gateway process. Drafts and jobs are in-memory;
restart requires a new composition and approval. Persisted images and manifests
remain under the asset root. Preserve those files and existing evidence. For a
code rollback, review the exact delta and use an explicitly approved revert;
do not reset another worktree or remove unrelated assets.
