# Project continuity snapshots

A project snapshot records where one piece of design work stands. It covers
which exact review, approved scope, implementation evidence, comparison, and
pilot evidence belong together, and what the owner decided about them. Each
snapshot can point to the one before it, so a project keeps a verifiable
history without a separate history database.

This is an internal library contract in `cli/lib/` (P17F). No CLI command, SDK
export, MCP tool, or Website Console view calls it yet. Promoting it is a
separate decision under the [P17 selection rule](P17-SKILL-AND-CORE-HARDENING-PLAN.md).

## What a snapshot holds

A `design-ai-project-snapshot` v1 is a small index. It never embeds artifact
bodies. The artifact files stay the only source of truth.

| Field | Content |
| --- | --- |
| `project.id` | A declared, hyphenated lowercase ID shared by every snapshot in one chain |
| `recordedAt` | When the snapshot was recorded |
| `artifacts` | For the review workflow and, when present, the scope approval, implementation evidence, review comparison, and pilot evidence: reference, SHA-256 of the exact file bytes, size, kind, and schema version |
| `identity` | Source HTML digest, design-contract digest, and quality-report digest from the review workflow, plus the approved scope digest, repository baseline, implementation status, comparison status, and pilot status when present |
| `links` | Each cross-artifact check and whether it is `verified` or `unverified`. The set is fixed by which artifacts are present, so a snapshot cannot add, drop, or upgrade a link |
| `stage` | `reviewed`, `scoped`, `implemented`, or `piloted`, derived from which artifacts are present |
| `decision` | The owner decision: `pending`, `accepted`, `revise`, or `rejected`, with a self-declared owner, a reference, the decision time (no later than `recordedAt`), and a rationale. Evidence whose implementation or pilot status is `blocked` cannot be `accepted` |
| `predecessor` | The previous snapshot's reference, byte digest, and size, or `null` for the first snapshot |
| `boundary` | Fixed: no history database, no embedded artifacts, read-only restore, no automatic learning, no target writes |

## Links

Building a snapshot validates each artifact with its own contract, then checks
the links between them. A broken link rejects the snapshot, because the
artifacts would come from different work.

| Link | Check |
| --- | --- |
| Scope approval → review workflow | The intake receipt's `reviewWorkflowSha256` equals the review workflow file bytes |
| Implementation evidence → scope approval | The embedded approval digest equals the scope approval file bytes |
| Review comparison → review workflow | The comparison baseline value equals the reviewed quality report (a value comparison, because the workflow embeds the report rather than its file bytes) |
| Review comparison → implementation evidence | Always `unverified` when both are present: no existing contract binds the candidate report to the implemented source |
| Pilot evidence → implementation evidence | The embedded implementation evidence and review workflow digests equal those file bytes, and the pilot record does not report a different repository or review workflow |

Implementation evidence needs its scope approval, and pilot evidence needs its
implementation evidence. Every link except the comparison baseline binds exact
bytes, so a reformatted file is a different artifact.

## Successors

A successor names its predecessor by byte digest and size. It must belong to the
same project, be recorded later, follow a snapshot whose owner decision is no
longer `pending`, and keep the same repository once a scope is approved. These
rules are enforced when a successor is built and checked again for every edge
when a chain is read, so a hand-edited snapshot cannot slip through. Successors
are derived when a chain is read, so no snapshot is edited after it is written.
A later snapshot may reach an earlier stage, such as a new review cycle after a
pilot. The chain order shows each stage so a reviewer can see it.

## Verify and restore

- `verifyProjectSnapshot(snapshot, sources, { predecessor })` rechecks a stored
  snapshot against the artifact files as they are now. It reports `drift`, not an
  exception, when:
  - a file changed, disappeared, appeared, or moved to a new reference;
  - the recorded predecessor is missing;
  - a rebuild from the artifacts differs, and it names each field that differs.

  The project ID, `recordedAt`, and the decision are declarations. A rebuild
  cannot prove them, and the result lists them under `notProvenByArtifacts`.
- `inspectProjectSnapshotChain(snapshots)` orders a chain and reports forks,
  missing predecessors, extra roots, and successor-rule violations. It still
  returns the order it can follow. When the chain is linear and clean, it also
  returns a read-only restore plan: the head snapshot and the exact artifact
  references and digests a restore would need. It writes nothing, and a real
  restore stays a separate, approved step.

All three functions take file text and return values, and none of them touches
the file system. `cli/lib/project-snapshot.test.mjs` builds a real chain against
a temporary Git checkout, from review workflow through pilot evidence, and runs
in `npm test`.
