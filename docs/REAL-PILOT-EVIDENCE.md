# Real pilot evidence

`design-ai review-pilot` closes one review-to-implementation pilot without
turning self-reported activity into an adoption or production claim. It reads
three exact JSON sources and returns a `design-ai-pilot-evidence` v1 artifact.

## Inputs

1. `design-ai-implementation-evidence` v1 from `review-evidence`
2. The original `design-ai-review-workflow` v1 linked by the intake receipt
3. An operator-authored `design-ai-pilot-record` v1

The workflow is a separate input because later stages preserve its SHA-256 link,
not its full source. The pilot record supplies consent, timing, finding decisions,
approval events, outcome, and claim classification. It does not replace the
machine-derived P6 or P11 evidence.

## Pilot record template

```json
{
  "kind": "design-ai-pilot-record",
  "schemaVersion": 1,
  "project": {
    "name": "Website Console dogfood",
    "repositoryUrl": "https://github.com/example/design-ai.git",
    "pilotClass": "internal-dogfood"
  },
  "consent": {
    "status": "approved",
    "approver": "project-owner",
    "identity": "self-declared",
    "reference": "task approval record",
    "approvedAt": "2026-07-15T00:00:00.000Z",
    "evidenceCollection": true,
    "targetMutation": true
  },
  "timeline": {
    "pilotStartedAt": "2026-07-15T00:00:00.000Z",
    "firstUsefulArtifactAt": "2026-07-15T00:01:00.000Z",
    "implementationCompletedAt": "2026-07-15T00:10:00.000Z"
  },
  "findingDecisions": [
    {
      "findingId": "finding-id-from-workflow",
      "decision": "accepted",
      "summary": "The finding was implemented within the approved scope.",
      "reference": "review decision record"
    }
  ],
  "approvalEvents": [
    {
      "gateId": "source-inspection",
      "status": "approved",
      "occurredAt": "2026-07-15T00:02:00.000Z",
      "reference": "scope approval record"
    }
  ],
  "outcome": {
    "implementationStatus": "complete",
    "productionStatus": "not-deployed",
    "feedback": {
      "status": "not-collected",
      "summary": "No external user feedback was collected.",
      "reference": ""
    }
  },
  "claims": [
    { "class": "real", "statement": "The pilot ran in the named repository.", "reference": "implementation evidence" },
    { "class": "synthetic", "statement": "Package fixtures remain synthetic proof.", "reference": "package smoke" },
    { "class": "inferred", "statement": "The linked chain is reusable by another agent.", "reference": "contract parity" },
    { "class": "unverified", "statement": "External adoption and production outcomes are not established.", "reference": "pilot boundary" }
  ]
}
```

Every workflow finding and every scope approval gate must appear once, in source
order. Approved gates require a canonical UTC timestamp. Pending and not-required
gates keep `occurredAt` empty.

## CLI

```bash
design-ai review-pilot implementation-evidence.json \
  --workflow review-workflow.json \
  --record pilot-record.json \
  --json > pilot-evidence.json
```

The command reads only those three files. It does not write the output file,
change a repository, call a network, or perform a release action; shell
redirection above is operator-controlled.

## SDK

```js
import { readFileSync } from "node:fs";
import { recordPilotEvidence } from "@design-ai/cli/sdk";

const evidence = recordPilotEvidence(
  readFileSync("implementation-evidence.json", "utf8"),
  readFileSync("review-workflow.json", "utf8"),
  readFileSync("pilot-record.json", "utf8"),
  {
    implementationEvidenceRef: "implementation-evidence.json",
    reviewWorkflowRef: "review-workflow.json",
    recordRef: "pilot-record.json"
  }
);
```

MCP tool `design_ai_review_pilot` accepts the same three exact JSON strings and
references. Website Console accepts the resulting evidence, verifies its source
bytes and digests, exports the original bytes unchanged, and restores P11 through
P6 when the pilot artifact is cleared.

## Reading the result

- `timeToFirstUsefulArtifact` is derived from the recorded UTC timeline.
- `findingPrecision` reports accepted, rejected, and unresolved decisions. It is
  not a general design-quality score.
- `approvalFriction` preserves approved, not-required, and pending gates.
- `implementation` must agree with P11 evidence status.
- `unresolvedRisk` comes from P11 remaining risks.
- `claims` keeps real, synthetic, inferred, and unverified statements separate.

`evidence-complete` means the bounded sources agree. It does not independently
verify identity, feedback, adoption, production quality, or business outcomes.
`attention-required` preserves a source-backed gap. `blocked` means source or
linkage drift must be repaired before the artifact is used.

## Evidence checklist

- [ ] Owner consent covers evidence collection and target mutation.
- [ ] P6 workflow and P11 implementation evidence are exact, unchanged sources.
- [ ] Every finding decision and approval gate is recorded in source order.
- [ ] Runtime, accessibility, keyboard, and responsive proof remains explicit.
- [ ] Real, synthetic, inferred, and unverified claims are separated.
- [ ] Commit, push, deployment, and external writes retain their own gates.

