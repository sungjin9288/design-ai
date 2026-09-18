# Product completion and Image Console QA — 2026-09-05

## Scope and result

Local engineering verification passed for the v5.2.0 working-tree delta over
`dc329273ab26ce4ae428f4827fbfeac79eb2461e` on
`codex/image-console-v5.2.0`. No commit, push, merge, tag, publication, external
recruitment, live Prompt Guide call, or real image provider call was performed.
The baseline Draft PR #62 CI receipt is not CI evidence for this later delta.

The overall design and phase gates are in
[`docs/product-completion-plan.md`](../../docs/product-completion-plan.md).
The [integration guide](../../docs/integrations/prompt-guide-image-prompts.md)
owns the exact current test, audit, package, and documentation counts.
This receipt owns the browser and artifact identities below.

## Reproduced failures and regression coverage

| Failure | Root cause and correction | Decisive evidence |
| --- | --- | --- |
| Early adapter exit terminated gateway | Unhandled stdin error; route it through the existing typed provider failure | Real child process with 1 MB input rejects safely; independent reviewer repeated it 20 times |
| Edit approval accepted replaced source | Execution resolved current source without comparing the draft snapshot | Coherent bytes/manifest replacement and shared mutable descriptor tests fail before provider/job mutation |
| Old job replaced newer draft state | Execution response lacked the compose revision guard | Delayed success and failure tests preserve the newer prompt, approval and status |
| Asset refresh failure hid its error | Invalidation changed revision before the error-display comparison | Failed asset-list test disables source/approval and preserves the actionable error |
| Reset draft metadata remained visible | `display: grid` overrode the native hidden presentation | Scoped `[hidden]` CSS plus contract test; browser reports `hidden: true`, `display: none` |

All new behavioral regressions were observed failing before their corresponding
fix. The CSS failure was observed in the real browser before correction.
The final read-only reviewer found no remaining blocker in these changes.

## Verification receipts

- Focused Image Console command from the integration guide: exit 0, no skips.
- `npm test`: exit 0 after the last runtime change.
- `npm run release:check`: final exit 0, ending with `Package smoke passed`.
- Both installed-bin and one-shot local tarball execution paths completed.
- `git diff --check`: exit 0.
- The first release attempt stopped on one MkDocs i18n link warning. Replacing
  the direct translated-file link with the canonical localized route resolved it;
  the final full release run passed documentation policy with zero warnings.

Raw local logs are retained at
`/tmp/design-ai-completion.2xYS0Y/release-check-final.log` and
`/tmp/design-ai-completion.2xYS0Y/final-tests.log`.
They are temporary diagnostic files, not a permanent published evidence service.

## Browser execution

Environment: macOS 26.6.2, Node 24.18.0, Python 3.12.12,
Chromium 152.0.7977.83. The gateway bound `127.0.0.1:53275` during this run.
The named browser session and gateway were stopped after verification.

Prompt Guide used deterministic mock mode with a rejecting external-fetch stub.
A temporary local Node subprocess returned a valid 68-byte, 1×1 PNG. For editing,
it read the supplied source path and verified its size and SHA-256. It also
asserted absence of Prompt Guide environment variables. This proves the local
protocol, not image quality, real model output, or provider compatibility.

Two generation/edit pairs were exercised; the final corrected UI pair was:

| Task | Asset ID | Source |
| --- | --- | --- |
| Generation | `1ca07867-eae3-4b59-b503-108c4d2dfe3f` | None |
| Editing | `f72aa30e-a52c-4629-95fe-5a53af5761a7` | `1ca07867-eae3-4b59-b503-108c4d2dfe3f` |

Both manifests retain `acceptedResponseVersion: v1`, `reviewStatus: draft`, and
model `deterministic-local-test`. The synthetic image SHA-256 is
`431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460`.
The live browser showed successful composition and provider POSTs as HTTP 201;
the asset selector preserved the selected source after editing completed.

| Check | Observation |
| --- | --- |
| Approval | Disabled before compose; explicit checkbox enables execution; consumed immediately and disabled after success |
| Desktop | 1440×1000 viewport; no horizontal overflow; separate form and preview columns |
| Mobile | 390×844 viewport; scroll width 390; single column and document-flow preview |
| Keyboard | ArrowRight switches the focused generation tab to editing; Tab moves purpose to domain |
| Focus and target | Domain has 3 px solid `rgb(79,70,229)` outline and 44 px height |
| Contrast | Primary on white 6.29:1; field boundary on white 7.58:1, computed from browser colors |
| Reduced motion | Emulated preference matches; transition duration `1e-05s` |
| Console | 0 errors and 0 warnings across the successful flows |
| Semantic reset | Hidden metadata is absent after mode reset; fresh composition displays current metadata |

Screenshots were opened and visually reviewed. Full-page capture was repeated
from scroll position zero to avoid a fixed skip-link capture artifact.
This is targeted keyboard, semantic, responsive, and contrast coverage, not a
complete assistive-technology or cross-browser accessibility certification.

## Artifact identities

The executed tarball SHA-256 was
`ca1482b21ee23319c92ffb8393837c3cc657b2eb51bb23070f824e9d5eeec7a9`.
Before temporary tarball cleanup, extracting the four changed runtime files
proved exact equality with the browser-tested working tree:

| File | SHA-256 |
| --- | --- |
| `cli/lib/image-provider.mjs` | `dbd777d6a58e23c1531a6d53729283a2814dfaf956ec02a95768c5503d88e657` |
| `cli/lib/image-workflow.mjs` | `fd2fd79df958e257397fb2af7d470a3fa467fe61aca67863ccca6f211b1665a8` |
| `docs/image-console/app.js` | `27ba1a5f65af5a1f85e7deb1cd70fc1a2a36ce01114721c6b03b889362e6e5be` |
| `docs/image-console/styles.css` | `0c14e05b5ffb1f3efd73a44700a0dea2881186d667ddbca61efec2d975419298` |

| Screenshot | SHA-256 |
| --- | --- |
| [Desktop](browser/completion-desktop-1440.png) | `227bb8180cded83a8c6037a1fc80e8f4e936335273002889bdb16797e5e24c9d` |
| [Mobile](browser/completion-mobile-390.png) | `2e37f7e1798d8c07ef9b3a3dd0e04c0c976fb91fdcc401cd81d035499c3b7ed9` |
| [Keyboard focus](browser/completion-keyboard-focus.png) | `37bdb5f143144a0baee1c8809f47b07fc52ef3630de5c037049125f4c03cab07` |

After the full release gate, only close-out documentation and evidence were
updated. The executed tarball identity above describes the pre-close-out
documentation snapshot, not a new published package. Runtime hashes stayed
unchanged; final documentation, release metadata, and package-content checks
also passed with exit 0 after the close-out updates. The final strict audits
and `git diff --check` passed. This closes the local engineering receipt;
it does not close the external gates below.

## Remaining external gates

Live Prompt Guide and real provider generation/edit remain unverified because
endpoint/key and real adapter configuration are unavailable. Merge, tag,
publication, public registry smoke, distribution confirmation, and independent
external pilot results retain the separate conditions in the completion plan.
