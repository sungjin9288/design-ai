# Verified design iteration

Use review comparison after a design change when the important question is not
"did the code change?" but "what design evidence changed?"

The operation compares two exact `design-ai-quality-report` artifacts of the
same schema version. It keeps the reports intact, verifies that they describe the
same subject and review context, and derives a separate
`design-ai-review-comparison` v2 artifact. Stored v1 comparisons still validate.

## Compare two reviews

```bash
design-ai review-compare baseline-quality-report.json \
  --candidate candidate-quality-report.json \
  --json > review-comparison.json
```

The command reads only the two named regular files. It writes nothing unless the
shell redirects stdout, calls no network, and does not change a repository.

Use compact JSON when another agent needs the decisions but not two repeated
source bodies:

```bash
design-ai review-compare baseline-quality-report.json \
  --candidate candidate-quality-report.json \
  --compact \
  --json
```

## What must match

The comparison fails before making a decision unless both reports have the same:

- subject kind, name, and reference;
- brief and review route;
- locale;
- declared viewport set.

A finding id also keeps its lens identity. Reusing an id under another lens is
contract drift, not a design improvement.

## How findings are decided

| Decision | Meaning |
| --- | --- |
| `resolved` | The baseline finding is absent and its candidate lens passes. |
| `persistent` | The same finding remains in the candidate report. |
| `introduced` | The finding appears only in the candidate report. |
| `uncertain` | The baseline finding is absent, but its candidate lens still warns, fails, or lacks evidence. |

The uncertain state prevents a missing static signal from being presented as a
fix. For example, removing an accessible-name warning is not verified improvement
if the accessibility lens still lacks the evidence needed to pass.

Each lens of the shared schema version also records one transition:

| Transition | Meaning |
| --- | --- |
| `unchanged` | The lens status is the same. |
| `improved` / `regressed` | The lens moved between `pass`, `warning`, and `fail`. |
| `evidence-gained` | The lens lacked evidence before and has a status now. |
| `evidence-lost` | The lens passed before and lacks evidence now. |
| `unconfirmed` | The lens failed or warned before and lacks evidence now. |

`unconfirmed` is new in comparison v2. Static inspection never passes a lens, so
a fix that removes every confirmed finding, for example in `accessibility` or
`interface-copy`, leaves that lens `unverified`. Version 1 called that `evidence-lost` and read
the fix as `regressed`. Version 2 reads it as `attention-required`: the issue is no
longer confirmed, and runtime evidence is still needed to call it resolved. A
stored v1 comparison keeps its original derivation, so it validates unchanged.

Both reports must share a quality report schema version. A stored version 1
report has eight lenses and a new version 2 report adds `interface-copy`, so the
comparison refuses a mixed pair. Re-run the baseline review to compare it with a
new one.

## Read the overall status

| Status | Meaning |
| --- | --- |
| `regressed` | A lens regressed, lost a pass, or a confirmed finding was introduced. |
| `attention-required` | Persistent, introduced, or uncertain findings, or an `unconfirmed` lens, remain without a confirmed regression. |
| `improved` | At least one finding resolved and no unresolved comparison decision remains. |
| `unchanged` | No verified finding change was established. |

The status is a release decision aid, not a universal design score. An `improved`
artifact establishes only bounded improvement between the two supplied reports.
Production quality and adoption remain separate claims.

## Use the same operation from an agent

### Node.js SDK

```js
import { readFileSync } from "node:fs";
import { compareReviews } from "@design-ai/cli/sdk";

const baselineSource = readFileSync("baseline-quality-report.json", "utf8");
const candidateSource = readFileSync("candidate-quality-report.json", "utf8");

const comparison = compareReviews(baselineSource, candidateSource, {
  baselineRef: "baseline-quality-report.json",
  candidateRef: "candidate-quality-report.json",
  compact: true,
});
```

### MCP

Call `design_ai_compare_reviews` with both exact JSON strings and their references.
Compact output is the default. Set `compact: false` only when the caller needs the
full source envelopes.

### Website Console

Import the full `review-comparison.json` into Website Console. The Console
revalidates both nested quality reports, renders source identity, lens transitions,
finding decisions, approval gates, and boundaries, then exports the original JSON
bytes. Compact summaries are intentionally rejected because the browser cannot
revalidate omitted source bodies.

The comparison panel remains keyboard reachable, preserves a 44-pixel minimum
target for visible controls, and stacks without horizontal overflow at mobile
widths.

## Permission and claim boundary

Comparison always leaves these actions pending:

- target repository mutation;
- commit and push;
- deployment;
- external writes.

The operation performs no local write, target mutation, external write, or network
call. It does not verify runtime behavior beyond evidence already present in the
two reports, and it never establishes production quality, customer adoption, or
business impact.

## Recommended iteration loop

1. Preserve the baseline quality report before implementation.
2. Make only the approved change.
3. Produce the candidate report with the same subject and context.
4. Compare the exact reports.
5. Resolve regressions and remaining uncertainty, or record why they are accepted.
6. Store the comparison beside implementation, browser, and release evidence.
