# Review handoff validation receipt

Use a validation receipt when the named consumer needs to prove that it parsed
and revalidated the exact handoff bytes it received. The receipt is a separate,
deterministic contract. It does not modify the original handoff.

## CLI

```bash
design-ai review-handoff-verify review-handoff.json \
  --consumer implementation-agent \
  --json > review-handoff-receipt.json
```

The consumer must exactly match `review-handoff.json`'s `recipient.name`.
Design AI rejects a different name, changed source bytes, digest drift, invalid
embedded evidence, or changed approval requirements. The command reads one
explicit JSON file and writes nothing; shell redirection creates the output.

## Contract

`design-ai-review-handoff-receipt` v1 records:

| Field | Meaning |
|---|---|
| `consumer` | Matching self-declared consumer, passed contract validation, and no acceptance claim. |
| `handoff` | Exact source, reference, byte count, SHA-256 digest, and parsed handoff value. |
| `evidence` | Quality finding counts and browser status derived from the validated handoff. |
| `remainingApprovals` | The unchanged approval requirements from the handoff. |
| `nextAction` | Pending target-repository intake with implementation still unauthorized. |
| `boundary` | No local write, target mutation, external write, identity proof, acceptance, or implementation. |

`status: contract-validated` proves only that the supplied contract is internally
valid and names the same consumer as the handoff. It does not prove who ran the
command, how the file arrived, whether the consumer accepted the work, or whether
the target repository was inspected.

## SDK

```js
import { readFileSync } from "node:fs";
import { verifyReviewHandoff } from "@design-ai/cli/sdk";

const handoffSource = readFileSync("review-handoff.json", "utf8");
const receipt = verifyReviewHandoff(handoffSource, {
  handoffRef: "review-handoff.json",
  consumer: "implementation-agent",
});
```

## MCP

Call `design_ai_verify_review_handoff` with `handoffSource`, `handoffRef`, and
`consumer`. Claude, Codex, and other MCP clients use the same in-process
validator as the CLI and SDK. The tool does not spawn the CLI or contact an
external service.

## Website Console

Import `review-handoff-receipt.json`. Website Console validates the receipt
before the nested handoff, restores the linked workflow and evidence, and keeps
the exact receipt and handoff source bytes. Export returns the original receipt
without reformatting. Clearing the receipt restores the original handoff view.

## Continue safely

After validation, run `design-ai review-intake` against the exact path declared in
the receipt. See [Target repository intake](REVIEW-INTAKE.md). The later approved
implementation workflow owns code changes, tests, commits, pushes, and deployment
evidence.
