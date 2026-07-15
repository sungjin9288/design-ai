# Review evidence handoff

Use a review handoff when one agent has prepared a canonical review and another
agent or role will decide what to implement. The handoff keeps the exact source
JSON beside its parsed value, verifies every digest, and stops before transport or
implementation.

## Prepare a static handoff

Create the canonical review first:

```bash
design-ai review page.html \
  --brief "Review the Korean account settings flow" \
  --locale ko-KR \
  --viewport mobile \
  --viewport desktop \
  --json > review-workflow.json
```

Then name the intended recipient:

```bash
design-ai review-handoff review-workflow.json \
  --recipient implementation-agent \
  --json > review-handoff.json
```

The shell redirection writes the output file. `design-ai review-handoff` itself
only reads the explicit workflow file. It does not deliver the result, inspect a
target repository, or start implementation.

## Attach browser evidence

Browser evidence is optional. When it exists, supply both the exact quality report
used by the browser runner and its verification sidecar:

```bash
design-ai review-handoff review-workflow.json \
  --recipient implementation-agent \
  --quality-report quality-report.json \
  --browser-verification browser-verification.json \
  --json > review-handoff.json
```

The pair is accepted only when:

1. The quality report value matches the report nested in the review workflow.
2. The quality report's exact source-byte digest matches the browser sidecar.
3. The browser evidence covers every viewport declared by the review workflow.

Supplying only one file fails. A changed byte, parsed-value drift, digest mismatch,
or incomplete viewport set also fails.

A failed or unverified browser report remains valid handoff evidence, but it does
not clear the browser approval requirement. Only a `pass` browser summary clears
that requirement.

## Read the contract

`design-ai-review-handoff` v1 contains:

| Field | Meaning |
|---|---|
| `recipient` | The named destination, `not-delivered` state, and pending consumer validation. |
| `artifacts` | Exact source text, byte count, SHA-256 digest, reference, and parsed value for each included artifact. |
| `linkage` | Semantic and source-byte checks across the workflow, quality report, and browser evidence. |
| `stages` | Completed planning and static review, optional browser status, and a prepared implementation handoff. |
| `nextAction` | The consumer validation still required before implementation. |
| `boundary` | Read-only execution with no local write, target mutation, external write, or delivery. |

`prepared` does not mean delivered. `linkage.status: pass` does not mean that the
design passed review. Read the nested quality summary and findings before deciding
what to change.

## Use the same operation from an agent

### Node.js SDK

```js
import { readFileSync } from "node:fs";
import { reviewHandoff } from "@design-ai/cli/sdk";

const workflowSource = readFileSync("review-workflow.json", "utf8");
const handoff = reviewHandoff(workflowSource, {
  workflowRef: "review-workflow.json",
  recipient: "implementation-agent",
});
```

For browser-linked evidence, also pass `qualityReportSource`,
`qualityReportRef`, `browserVerificationSource`, and
`browserVerificationRef`. The two sources are required together.

### MCP

Call `design_ai_review_handoff` with the exact workflow JSON string, its reference,
and the recipient. Optional quality and browser source pairs follow the same
contract. Claude, Codex, or another MCP client receives the handoff without
spawning the CLI.

### Website Console

Import `review-handoff.json` into Website Console. The Console revalidates every
embedded source, renders the recipient and stage boundary, and exports the original
handoff bytes without reformatting. Direct review imports remain available after
the handoff is cleared.

## Consumer checklist

Before implementation, the receiving agent or reviewer must:

1. Validate the handoff contract again with `design-ai review-handoff-verify`.
2. Read confirmed and unverified findings separately.
3. Confirm that the named recipient and requested scope are still correct.
4. Obtain any approvals listed in `nextAction.approvalRequiredBefore`.
5. Inspect the target repository under its own permission boundary.

Only then can a separate implementation workflow begin. Design AI does not claim
delivery, acceptance, target-repository inspection, code changes, tests, commits,
pushes, deployment, or external writes through this handoff.

See [Review handoff validation receipt](REVIEW-HANDOFF-RECEIPT.md) for the CLI,
SDK, MCP, and Website Console validation flow.
