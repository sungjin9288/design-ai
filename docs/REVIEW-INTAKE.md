# Target repository intake

Target repository intake is the first receiving-side step after a handoff receipt.
It proves that Design AI inspected the repository named in the receipt, not a
different local checkout. The operation reads only supported root metadata and
local Git state. It stops before application-source review or implementation.

## CLI

The original review must declare the repository and absolute local path:

```bash
design-ai review page.html \
  --brief "Review Korean fintech settings" \
  --repo-url https://github.com/acme/settings \
  --local-path /absolute/path/to/settings \
  --json > review-workflow.json
```

After handoff validation, run intake with the same consumer and path:

```bash
design-ai review-intake review-handoff-receipt.json \
  --target-root /absolute/path/to/settings \
  --consumer implementation-agent \
  --json > target-repo-intake.json
```

Design AI rejects a different consumer or path before it inspects the target.
The command also rejects symbolic links rather than following them.

## What the artifact records

`design-ai-target-repo-intake` v1 contains:

| Field | Meaning |
|---|---|
| `receipt` | Exact receipt reference, bytes, SHA-256 digest, consumer, and nested handoff/workflow digests. |
| `target` | Declared and resolved paths, declared and observed remotes, and their match state. |
| `project` | Root `package.json`, supported lockfile, `index.html`, package manager, framework, scripts, and start command when present. |
| `git` | Repository root, branch, upstream, ahead/behind state, remote, last commit, and existing changes. |
| `inspection` | The bounded metadata and Git commands used, with an empty application-source list. |
| `nextAction` | A pending implementation-scope approval. |
| `boundary` | Read-only intake with no preview, network, target mutation, source review, or implementation. |

The receipt itself is linked by digest instead of embedded again. This keeps the
artifact portable while preserving an exact evidence chain.

## Status

- `ready-for-scope-review`: path and remote match, the target is a clean Git
  repository on a named branch, and root metadata is usable.
- `attention-required`: intake is valid, but existing changes, a detached HEAD,
  or incomplete metadata needs an owner decision.
- `blocked`: the target is unavailable or unsafe, is not a Git repository, lies
  outside the detected repository root, or its remote does not match the receipt.

A clean result does not authorize implementation. The next phase must name the
files, intended edits, risks, and verification commands, then obtain explicit
scope approval.

## MCP

Call `design_ai_review_intake` with the absolute local `receiptPath`, `targetRoot`,
and `consumer`. The MCP server reads the exact receipt bytes directly, invokes the
same operation in-process, and returns the same contract as the CLI. This keeps a
large receipt out of the tool request without widening the read boundary.

There is no Agent SDK export. Intake intentionally owns a local-project
filesystem boundary; the SDK remains a source-string adapter with no general
repository access.

## Website Console

Import `target-repo-intake.json` in Website Console. The Console validates the
contract, shows repository identity, project metadata, Git state, and the pending
scope gate, and preserves the original JSON for export. Clearing intake restores
the earlier receipt, handoff, and review evidence when they are present.

## Permission boundary

Intake does not read application source, install dependencies, start a preview,
contact a remote, edit the target, accept the handoff, verify consumer identity,
or begin implementation. Shell redirection may create the output file outside the
target repository; the Design AI operation itself writes nothing.
