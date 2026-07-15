# Implementation scope approval

P10 turns one validated target-repository intake into an immutable proposal, then
records human approval as a second artifact. Proposal creation and approval are
read-only operations. They do not inspect application source or change the target.

## 1. Write the request

Create `implementation-scope-request.json`:

```json
{
  "kind": "design-ai-implementation-scope-request",
  "schemaVersion": 1,
  "objective": "Clarify the settings save action without changing the architecture.",
  "intendedBehavior": [
    "Keep the primary action clear and keyboard accessible."
  ],
  "files": {
    "inspect": ["src/settings/**/*.tsx", "src/settings/**/*.test.tsx"],
    "change": ["src/settings/**/*.tsx"],
    "generated": []
  },
  "dependencies": [],
  "migrations": [],
  "externalWrites": [
    { "system": "GitHub", "action": "push branch", "destination": "owner/repo" }
  ],
  "verificationCommands": ["npm test", "npm run build"],
  "risks": ["The current label may be referenced by an existing test."],
  "preExistingChanges": [],
  "release": { "commit": true, "push": true, "deployment": false }
}
```

Every change selector must also appear under `files.inspect`. Relative selectors
cannot contain traversal. Record every P9 worktree entry once and in order under
`preExistingChanges`; unresolved ownership blocks approval.

## 2. Build the proposal

```bash
design-ai review-scope target-repo-intake.json \
  --request implementation-scope-request.json \
  --consumer codex \
  --json > implementation-scope-proposal.json
```

Shell redirection writes the file. The command reads only the two named JSON files.
The proposal preserves their exact source, SHA-256, byte count, parsed value,
repository baseline, selectors, risks, verification commands, and gate states.

## 3. Record approval

After reviewing the proposal:

```bash
design-ai review-scope-approve implementation-scope-proposal.json \
  --approver "product owner" \
  --approval-ref "approved in task" \
  --approved-at "2026-07-15T12:00:00.000Z" \
  --yes \
  --json > implementation-scope-approval.json
```

The timestamp must be canonical UTC ISO. The approval authorizes source inspection
and target-file mutation only for the listed selectors. It expires when the target
branch, head, repository, or approved scope drifts.

## Gate meaning

| Gate | P10 result |
| --- | --- |
| Source inspection and target files | Approved by the approval artifact |
| Pre-existing changes, dependencies, migration files, generated files | Approved only when requested and listed |
| External writes, commit, push, deployment | Still pending and separately recorded |
| Running an external-state migration | Not authorized by approving migration files |

The approval operation itself performs no source read, target mutation, commit,
push, deployment, migration execution, network call, or external write.

## SDK and MCP

```js
import {
  approveImplementationScope,
  proposeImplementationScope,
} from "@design-ai/cli/sdk";

const proposal = proposeImplementationScope(intakeSource, requestSource, {
  intakeRef: "target-repo-intake.json",
  requestRef: "implementation-scope-request.json",
  consumer: "codex",
});
```

MCP exposes the same in-process operations as `design_ai_review_scope` and
`design_ai_approve_review_scope`. Neither tool spawns the CLI.

## Website Console

Import the proposal or approval JSON in Website Console. It revalidates nested
source identity and derived gates before display, preserves original bytes for
export, and restores the prior stage when the current artifact is cleared:

`approval -> proposal -> target intake`

## Before P11

- Confirm branch, head, remote, and worktree entries still match the approval.
- Read and change only authorized selectors.
- Stop and create a new proposal when scope expands.
- Keep commit, push, deployment, and external writes behind their own gates.
- Record commands, outcomes, artifacts, and remaining uncertainty as P11 evidence.

Continue with [Implementation evidence](IMPLEMENTATION-REVIEW-EVIDENCE.md).
