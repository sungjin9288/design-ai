# Documentation homepage pilot

## Source

This internal pilot used the English and Korean design-ai documentation homepage
in the current repository. The project owner authorized the review, bounded source
changes, browser evidence, grouped commit, push, and deployment in this Codex task.
The exact P6-P13 chain is preserved under `evidence/p14/homepage/`.

The review followed `knowledge/PRINCIPLES.md`,
`knowledge/patterns/interface-craft.md`,
`knowledge/patterns/landing-hero-design.md`, and
`skills/design-engineering-review/PLAYBOOK.md`.

## Problem

The baseline opened with badges and a long distribution paragraph. A first-time
visitor could not see a prominent install or quickstart action in the first mobile
viewport. Static inspection also found an unnamed search toggle input. The browser
console recorded a failed Pretendard font request and a local multilingual sitemap
warning.

## Approved change

The implementation adds one concise product promise, a primary quickstart action,
a secondary distribution action, and four compact proof points. The English and
Korean pages use the same information order. Header controls now expose localized
programmatic names, and the skip link moves focus to the page heading.

The change stays within the approved homepage, theme override, navigation, status
documentation, and `evidence/p14/homepage/**` selectors. It adds no dependency,
migration, application service, analytics, or external data collection.

## Comparison

| Measure | Baseline | Candidate |
|---|---:|---:|
| Confirmed P1 findings | 2 | 0 |
| Full action hero in 390×844 first viewport | No | Yes, ending at 714 px |
| Full action hero in 1440×900 first viewport | No clear action | Yes, ending at 657 px |
| Search open and dismiss cycles | Not retained | 5 of 5 passed |
| Drawer open and dismiss cycles | Not retained | 5 of 5 passed |
| English / Korean mobile overflow | Not observed / not observed | None / none |
| Failed Pretendard request | 403 | Resolved |

The canonical review comparison is `improved`: both confirmed findings are
resolved, no finding persists, no finding is introduced, and no finding remains
uncertain. Its immutable local evidence keeps the multilingual sitemap warning.
A deployment follow-up in PR #51 restored the GitHub Pages project path, mirrored
the combined sitemap at the Korean locale root, and passed public English desktop
and Korean mobile checks with zero console errors or warnings. Both public sitemap
paths return 200 with byte-identical content. The follow-up evidence is preserved
under `evidence/p14/public-pages/`; it does not rewrite the P6-P13 source chain.

The P12 timing window starts when the retained scope approval became available,
so its zero-millisecond first-artifact value is an evidence-window boundary, not a
claim about total human task time. This case does not use it as an outcome metric.

## Accessibility and responsive evidence

The primary action measures 49.59 pixels high and has 6.86:1 text contrast. The
secondary action has 16.07:1 text contrast. Keyboard focus uses a three-pixel solid
outline with a three-pixel offset. The first Tab reaches the skip link; activating
it focuses `#design-ai`, and subsequent navigation reaches the primary action in
document order.

At 390 pixels, English and Korean document widths match the viewport and both
actions remain visible without horizontal overflow. The English hero ends at 714
pixels and the Korean hero at 654 pixels in an 844-pixel viewport. Reduced-motion
inspection reports zero-second hero and action animation and transition durations.
A manual screen-reader session was not run.

## Evidence

- P6 baseline and candidate workflows: `baseline-review.json`,
  `candidate-review.json`
- P7-P10 handoff and approved scope: `review-handoff.json`,
  `review-handoff-receipt.json`, `target-repo-intake.json`,
  `implementation-scope-proposal.json`, `implementation-scope-approval.json`
- P11 implementation evidence: `implementation-evidence.json`
- P12 pilot evidence: `pilot-evidence.json`
- P13 exact comparison: `review-comparison.json`
- Browser observations and captures: `baseline-browser-qa.md`,
  `candidate-browser-qa.md`, and the PNG files in the same directory

All paths above are relative to `evidence/p14/homepage/`.

## Claim boundary

| Class | What this case supports |
|---|---|
| Real | One owner-consented internal homepage review, implementation, browser check, and exact comparison |
| Synthetic | Package and release smoke fixtures, kept separate from this pilot |
| Inferred | The public P6-P13 workflow can guide one bounded documentation improvement |
| Unverified | External-user adoption, customer feedback, business impact, manual screen-reader behavior, and broader production quality |

This case proves one internal workflow and one bounded quality improvement. It is
not an external adoption or customer outcome claim.
