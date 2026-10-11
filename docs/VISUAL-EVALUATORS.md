# Visual evaluators

The P17E evaluators turn browser artifacts into objective, criterion-level
evidence. They cover screenshot regression, visual diff against a design
reference, responsive overflow, and brand-token drift. Each result records the
evaluator version, the capture tool, the viewport, the source digest, the
threshold, the artifacts it read, and the uncertainty that remains. Evidence that
is missing or invalid stays `unverified`. No aggregate score exists.

This is an internal library contract in `cli/lib/`. The package exports only
`./sdk`, and no CLI command, SDK export, MCP tool, or Website Console view calls
it yet. Promoting it to a public capability is a separate decision under the
[P17 selection rule](P17-SKILL-AND-CORE-HARDENING-PLAN.md).

## Boundary

- The evaluators read only regular files inside one evidence directory. They
  refuse absolute paths, parent traversal, an artifact that is itself a symbolic
  link, any path that resolves outside the directory, empty files, and files over
  25 MB. A symbolic-linked directory that stays inside the evidence directory is
  followed.
- PNG decoding caps decompressed output at the size the header declares, and it
  refuses critical chunks it cannot interpret, such as `PLTE`.
- They write nothing, start no browser, and make no network call. Capturing
  screenshots, layout, and computed styles is the job of an approved
  [browser verification adapter](BROWSER-VERIFICATION.md).
- They never update the canonical quality report or the browser verification
  sidecar.

## Evaluators

| Evaluator | Inputs | Threshold | Pass when | Unverified when |
| --- | --- | --- | --- | --- |
| `screenshot-regression` | `baseline`, `candidate` PNG | `maxChangedRatio`, `channelTolerance` | Dimensions match and the changed-pixel count is at most `floor(maxChangedRatio × pixels)` | A PNG is missing, corrupt, or not 8-bit RGB/RGBA, or the candidate width is not a multiple of the viewport width |
| `visual-diff` | `reference`, `candidate` PNG | `maxChangedRatio`, `channelTolerance` | Same as above, against a design reference | As above, or the reference and candidate dimensions differ |
| `responsive-overflow` | `layout` JSON | `tolerancePx` | Document overflow is at most `tolerancePx`, and no reported element extends more than `tolerancePx` past the right edge or before the left edge | The layout is missing, malformed, or measured at a different viewport |
| `brand-token-drift` | `styles` JSON, `tokens` JSON | `maxDeltaE`, `maxOffPalette`, `maxUnevaluated` | At most `maxOffPalette` color declarations sit farther than `maxDeltaE` (CIE76) from every token | No color declaration can be evaluated, more than `maxUnevaluated` values are translucent or unparsable, or the token palette is missing or invalid |

A pixel counts as changed when any RGBA channel differs by more than
`channelTolerance`, an integer from 0 to 254. The pass decision uses the exact
changed-pixel count, so a single changed pixel on a large capture still fails a
zero threshold. A regression whose dimensions changed fails, because the layout
moved. A visual diff with different dimensions stays `unverified`, because the
evaluator does not crop, scale, or register images. Embedded color profiles and
gamma chunks are ignored, and each result says so in its uncertainty.

Overflow counts an element past either edge. The adapter must leave out
off-canvas drawers, hidden elements, and children of horizontal scroll
containers, because they would otherwise read as overflow.

The adapter supplies these JSON shapes:

```json
{
  "viewport": { "width": 390, "height": 844 },
  "document": { "scrollWidth": 412, "clientWidth": 390 },
  "elements": [{ "selector": ".pricing-table", "left": 0, "right": 412 }]
}
```

```json
{ "declarations": [{ "selector": ".cta", "property": "background-color", "value": "rgb(37, 99, 235)" }] }
```

```json
{ "colors": { "--brand-primary": "#1a56db", "--surface": "#ffffff" } }
```

The evaluator compares only color properties: `color`, `background-color`, the
border colors, `outline-color`, `text-decoration-color`, `fill`, `stroke`, and
`caret-color`. It reads hex values and strict `rgb()`/`rgba()` syntax. It skips
keywords such as `currentcolor` and fully transparent colors, because they paint
no color of their own. Translucent colors depend on what is behind them, so they
count as unevaluated, together with values it cannot parse, such as `hsl()` or
`oklch()`. More than `maxUnevaluated` of them makes the result `unverified`.

## Request and report

A request names the source digest that the artifacts belong to. This is usually
the SHA-256 of the canonical quality report or of the browser verification
sidecar. It also names the capture tool and the evaluations to run:

```json
{
  "kind": "design-ai-visual-evaluation-request",
  "schemaVersion": 1,
  "source": { "kind": "browser-verification", "sha256": "<64 hex>" },
  "tool": { "name": "playwright-chromium", "version": "1.58.0" },
  "evaluations": [
    {
      "id": "home-mobile",
      "evaluator": "screenshot-regression",
      "viewport": { "name": "mobile", "width": 390, "height": 844 },
      "threshold": { "maxChangedRatio": 0.001, "channelTolerance": 8 },
      "inputs": { "baseline": "baseline/home-mobile.png", "candidate": "responsive-mobile.png" }
    }
  ]
}
```

`evaluateVisualRequest(request, { evidenceDir })` in
`cli/lib/visual-evaluators.mjs` returns a `design-ai-visual-evaluation` v1
report. The report adds `evaluatorVersion` and `requestSha256`, and for each
evaluation it records `status`, `measurement`, the `artifacts` it read with their
SHA-256 and size, `uncertainty`, and `reasons`.
[`visual-evaluation.schema.json`](https://github.com/sungjin9288/design-ai/blob/main/cli/lib/visual-evaluation.schema.json)
describes the shape, and `validateVisualEvaluation()` enforces these invariants:

- A `pass` or `fail` must follow from its own measurement and threshold. A
  report that asserts `pass` over a failing measurement is rejected.
- Each measurement has an exact shape per evaluator, and its fields must agree.
  For example, `changedRatio` must equal `changedPixels` divided by the pixel
  count, and the listed offenders must match `offenderCount`.
- A `pass` or `fail` needs an artifact for every input role. An `unverified`
  result has no measurement and at least one reason.
- Every evaluation carries at least one uncertainty statement.
- The summary is derived from the statuses. It is `fail` if anything failed,
  otherwise `unverified` if anything is unverified, and `pass` only when every
  evaluation passed.
- Any key containing `score`, `grade`, or `rating` is rejected, in the request
  and in the report.

## Verification

`cli/lib/visual-evaluators.test.mjs` runs in `npm test`. It covers:

- the PNG decoder under all five row filters, including rejection of corrupt,
  truncated, and unsupported images, decompression bombs, and unsupported
  critical chunks;
- a single changed pixel on a 3840×2160 capture failing a zero threshold;
- pass, fail, and unverified paths for each evaluator;
- refusal of symbolic links, traversal, missing files, and corrupt files, with
  the evidence directory left unchanged;
- rejection of contract violations, including forged or inconsistent
  measurements;
- deterministic output for identical input;
- the schema enums matching the evaluator registry.

## First application

The evaluators were first run on artifacts from design-ai's own Website
Console, as [Roadmap](ROADMAP.md) Phase 816 records. An approved scratch
Playwright adapter captured screenshots, layout, and computed colors for the
Audit Checklist of the v5.3.0 code and of `main`. Screenshot regression showed
that the #78 accessibility fix changed no pixels. Brand-token drift found a
hardcoded border color and form controls that ignored the text token, and it
passed after the fix. This was dogfooding, not an independent pilot.
