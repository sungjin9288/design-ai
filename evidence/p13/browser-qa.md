# P13 Website Console browser QA

Date: 2026-07-16

## Source artifact

- File: `evidence/p13/review-comparison.json`
- Kind: `design-ai-review-comparison`
- Status: `attention-required`
- Baseline SHA-256: `aa580c20023dd206ac23ccf2817a762e62f2a8194361f012c077912afd58eab4`
- Candidate SHA-256: `38b368b0c219f3e4b06dc29d3381447847fb0fc4d5eeb9444c106a031d98ef47`

## Desktop

- Viewport: 1440 by 1100
- Import succeeded and the `Verified Design Iteration` state survived reload.
- Local storage retained the full comparison source.
- Document width matched viewport width: 1440 pixels.
- Console warnings: 0
- Console errors: 0
- Screenshot: `evidence/p13/website-console-desktop.png`

## Mobile and keyboard

- Viewport: 390 by 844
- Document width matched viewport width: 390 pixels.
- Minimum visible section navigation height: 44 pixels.
- The first Tab focused the skip link; Enter moved focus to `main`.
- Console warnings: 0
- Console errors: 0
- Screenshot: `evidence/p13/website-console-mobile.png`

## Original-byte export

The Console exported `design-ai-review-comparison.json`. `cmp -s` confirmed that
the download matched the imported source exactly. Both files had SHA-256:

`c274093e1ba0f2e9ad21208ae7c512efc0e891f1d15b52cfac7e5a6a94f81b0f`

## Boundary

The test used a local static server at `127.0.0.1:4178`. It made no target
repository mutation, external write, deployment, commit, or push. The fixture is
internal development evidence and does not establish external adoption or
production quality.
