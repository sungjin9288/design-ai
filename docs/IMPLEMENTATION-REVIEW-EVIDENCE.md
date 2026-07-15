# Implementation evidence

P11 checks whether completed implementation still matches one exact P10 approval.
It reads the approval and evidence request, compares the approved baseline with
local Git state, and hashes only the evidence files named in the request.

It does not implement changes, run tests, read application source, write files,
commit, push, deploy, call a network, or authorize a release action.

## Prepare the request

List every current changed file with its exact output from:

```bash
git -c core.quotepath=false status --short --untracked-files=all
```

Every approved verification command must appear once and in approval order.
Use `not-run` with empty timestamps and `null` exit code when a command was not
run. Accessibility, responsive, and browser observations must always appear;
use `unverified` rather than omitting missing proof.

```json
{
  "kind": "design-ai-implementation-evidence-request",
  "schemaVersion": 1,
  "consumer": "implementation-agent",
  "implementationStartedAt": "2026-07-15T12:01:00.000Z",
  "implementationCompletedAt": "2026-07-15T12:20:00.000Z",
  "executedWork": [
    {
      "statusEntry": " M src/settings/view.tsx",
      "path": "src/settings/view.tsx",
      "summary": "Clarified the approved settings action without changing its data flow."
    },
    {
      "statusEntry": "?? evidence/test.log",
      "path": "evidence/test.log",
      "summary": "Recorded the approved test result."
    }
  ],
  "verificationResults": [
    {
      "command": "npm test",
      "status": "pass",
      "startedAt": "2026-07-15T12:10:00.000Z",
      "completedAt": "2026-07-15T12:11:00.000Z",
      "exitCode": 0,
      "summary": "Unit tests passed.",
      "artifacts": ["evidence/test.log"]
    }
  ],
  "observations": [
    {
      "id": "accessibility-check",
      "category": "accessibility",
      "status": "unverified",
      "summary": "Accessibility was not exercised in this run.",
      "artifacts": []
    },
    {
      "id": "responsive-check",
      "category": "responsive",
      "status": "unverified",
      "summary": "Responsive behavior was not exercised in this run.",
      "artifacts": []
    },
    {
      "id": "browser-check",
      "category": "browser",
      "status": "unverified",
      "summary": "Browser behavior was not exercised in this run.",
      "artifacts": []
    }
  ],
  "remainingRisks": [
    {
      "severity": "p2",
      "summary": "Responsive and browser behavior still need confirmation."
    }
  ]
}
```

Evidence artifact paths must be exact relative paths covered by the approval's
`files.change` or `files.generated` selectors. Each file must be regular,
non-symlinked, and remain inside the approved repository root.

## Run the review

```bash
design-ai review-evidence implementation-scope-approval.json \
  --request implementation-evidence-request.json \
  --target-root /absolute/path/to/repo \
  --consumer implementation-agent \
  --json > /tmp/design-ai-implementation-evidence.json
```

The shell redirection writes the output; the operation itself writes nothing.

The result is:

- `evidence-complete` when scope, Git state, verification, observations, and
  risks contain no gap;
- `attention-required` when verification failed or was not run, an observation
  is unverified, pre-existing work overlaps, or a risk remains;
- `blocked` when baseline identity drifted, a changed file is missing or outside
  scope, an artifact is unsafe or unavailable, or the record contradicts Git.

## MCP and Website Console

MCP exposes `design_ai_review_evidence`. It accepts absolute `approvalPath`,
`requestPath`, and `targetRoot` values plus the matching `consumer`. The tool uses
the same in-process operation and does not spawn the CLI.

Website Console imports the resulting JSON, revalidates its exact nested approval
and request sources, preserves original bytes for export, and restores the approval
when evidence is cleared:

`implementation evidence -> scope approval -> scope proposal -> target intake`

## Release boundary

P11 records evidence before commit. It does not grant commit, push, deployment,
migration execution, or external-write authority. A changed HEAD expires the P10
approval and blocks P11; create a new intake, proposal, and approval instead of
editing the evidence around the drift.
