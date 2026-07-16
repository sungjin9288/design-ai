# P16 external marketing pilot operations readiness

Date: 2026-07-16

## Result

P16 repository and public operations preparation is complete. Direct outreach has
not started. No candidate, owner consent, target, external pilot result, feedback,
repeated problem, or adoption evidence exists.

This record proves operating readiness only. It does not prove participation or
product-market adoption.

## Source identity

| Source | Identity |
|---|---|
| Merged implementation | [PR #58](https://github.com/sungjin9288/design-ai/pull/58) |
| Main commit | `28158386be1d2ad0d567299f9f193f597c6fab97` |
| P16 operations guide | SHA-256 `6605eb900403bcf299cc6288785b407a61857567793a03e066e882c268290583` |
| Anonymous recruitment status | SHA-256 `24efdfd4a9871bb63aa6b3439d06d41b8adf18efc4515102b42e4010e0cdd64b` |
| P15 Issue Form | SHA-256 `0ef67cdfa8e3c3cbf4cf52487fc0d8fb1025a28a5ca2cca229cab8c99d7fda6c` |
| P14 program baseline | SHA-256 `9ca6d1421c25c30c89fc8dae84752d42770f8e78ed4a41a1df4e071da09b5338` |

The P14 digest is unchanged from the three-slot, zero-participant launch record.

## Delivered operating surface

- [P16 operations guide](https://sungjin9288.github.io/design-ai/docs/EXTERNAL-PILOT-OPERATIONS/)
- [Korean-first direct invitation](https://sungjin9288.github.io/design-ai/docs/pilots/external/direct-invitation-ko/)
- [Anonymous recruitment status](https://sungjin9288.github.io/design-ai/docs/pilots/external/recruitment-status/)
- [Problem hypothesis template](https://sungjin9288.github.io/design-ai/docs/pilots/external/hypothesis-template/)
- [Recruitment issue #56](https://github.com/sungjin9288/design-ai/issues/56)
- [External pilot Issue Form](https://github.com/sungjin9288/design-ai/issues/new?template=external-pilot.yml)
- [Repository lifecycle labels](https://github.com/sungjin9288/design-ai/labels)

## Lifecycle labels

The repository exposes all five P16 lifecycle labels. Candidate issues must use
exactly one at a time.

| Label | Color | Meaning |
|---|---|---|
| `pilot:reviewing` | `FBCA04` | Eligibility review; no consent |
| `pilot:consent-pending` | `D4C5F9` | Candidate selected; separate consent incomplete |
| `pilot:running` | `0E8A16` | Owner-consented bounded pilot running |
| `pilot:evidence-complete` | `1D76DB` | Pilot evidence and owner-approved feedback complete |
| `pilot:closed-no-pilot` | `6E7781` | Intake closed without a completed pilot |

The open recruitment issue is not a candidate and therefore has no lifecycle
status label.

## Verification

### Local release gates

- `npm run release:check`: passed, including installed-bin and one-shot package
  smoke.
- Final-tree `npm run release:preflight`: passed.
- Node tests: 832 passed, 0 failed.
- Strict corpus audits: 8 passed.
- Package contents: 791 files, 2.5 MB packed, 11.0 MB unpacked.
- MkDocs warning policy: 0 unexpected warnings.
- `external-pilot:operations-self-test`: passed. It rejects missing lifecycle
  labels, incomplete consent gates, weakened distinct-owner rules, changed Day 0
  intake links, personal contact data in aggregate status, premature activity,
  and P14 baseline drift.

The full package smoke ran before the final self-test-only rejection case was
added. The exact final tree then passed `release:preflight`; no package runtime or
public product contract changed in that last test-only edit.

### GitHub Actions

| Evidence | Result |
|---|---|
| [PR required CI run `29503138956`](https://github.com/sungjin9288/design-ai/actions/runs/29503138956) | 4 required jobs passed; 2 non-applicable jobs skipped |
| [Main audit run `29503275956`](https://github.com/sungjin9288/design-ai/actions/runs/29503275956) | audit, operations validation, package integrity, unit tests, and VS Code e2e passed |
| [Pages run `29503275933`](https://github.com/sungjin9288/design-ai/actions/runs/29503275933) | MkDocs build and GitHub Pages deploy passed |

### Public browser checks

Checks ran against the deployed URLs after Pages run `29503275933`.

| Surface | `1440x900` | `390x844` |
|---|---|---|
| P16 operations guide | Correct title and H1; lifecycle, classification, and status link present; no horizontal overflow; 0 console errors or warnings | No horizontal overflow; H1 and all three tables fit the viewport; 0 console errors or warnings |
| Recruitment issue #56 | Title, operations link, Issue Form link, and zero-completed-pilot boundary present; no horizontal overflow | Same required content present; no horizontal overflow |
| Lifecycle labels | All five P16 labels visible; no horizontal overflow | All five P16 labels visible; no horizontal overflow |
| Issue Form URL | Anonymous browser redirected to GitHub sign-in with the exact form URL preserved in `return_to`; no horizontal overflow | Same authentication boundary and return URL; no horizontal overflow |

The operations guide's first keyboard Tab focused the visible `Skip to content`
link with a browser outline. GitHub's issue page emitted one host-owned Copilot
endpoint 404 and two telemetry collector 503 responses; the issue content and all
required links still rendered. These GitHub-host errors are not emitted by the
design-ai Pages site.

Because the Playwright context was anonymous, it did not render the authenticated
Issue Form fields. The merged form source instead passed
`external-pilot:intake-check` and its rejection self-tests, while the public URL
proved the expected GitHub authentication and exact post-login return path.

## Claim boundary

- Current state: `direct-outreach-not-started`.
- Private invitations sent: 0.
- Candidate issues submitted: 0.
- Consent pending: 0.
- Pilots running: 0.
- Evidence-complete pilots: 0.
- External adoption: unverified.
- Package remains `@design-ai/cli@5.1.0`; no npm publication occurred.
- No CLI command, SDK export, MCP tool, or JSON product contract was added.

## Next external action

The maintainer must keep a private list of three to five trusted project owners
outside this repository, personalize one sentence per owner, and send the Day 0
Korean invitation. Only a submitted Issue Form can enter candidate review. The
first pilot remains blocked until a qualifying candidate and separate owner
consent exist.
