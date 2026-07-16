# External marketing pilot operations

P16 turns the public P15 intake path into an operator-ready pilot workflow. It
does not add a product capability, change the three-slot launch inventory, or
claim participation. The first active slot is limited to one public marketing
page with a real CTA or other owner-observable primary flow.

Current aggregate status:
[`docs/pilots/external/recruitment-status.md`](pilots/external/recruitment-status.md).

## Operating boundary

- Use only the public `@design-ai/cli@5.1.0` package. Do not depend on unpublished
  `main` behavior.
- Keep the private invitation list, names, email addresses, phone numbers, and
  direct-message content outside this repository.
- Treat the public Issue Form as the only candidate intake. A direct reply or
  private message is neither intake nor consent.
- Do not inspect a private repository or non-public artifact before a separate
  owner-consent record is complete.
- Keep dependency, migration, commit, push, deployment, and external-write
  decisions as separate approvals.
- Preserve `docs/pilots/external/program.json` as the three-slot,
  zero-participant baseline. A real pilot gets a separate evidence directory.

## Candidate lifecycle

Every candidate issue keeps the `external-pilot` and `pilot:intake` origin labels.
After triage starts, it also has exactly one lifecycle label from this list:

| Label | Meaning | Allowed next state |
|---|---|---|
| `pilot:reviewing` | The Issue Form is under eligibility review; no consent exists | `pilot:consent-pending` or `pilot:closed-no-pilot` |
| `pilot:consent-pending` | The candidate is selected, but the separate consent record is incomplete | `pilot:running` or `pilot:closed-no-pilot` |
| `pilot:running` | Consent and the bounded target are complete; the P6-P13 chain is active | `pilot:evidence-complete` or `pilot:closed-no-pilot` |
| `pilot:evidence-complete` | The source-linked pilot and owner-approved feedback are complete | terminal |
| `pilot:closed-no-pilot` | Intake closed without a completed pilot | terminal |

Remove the previous lifecycle label in the same update that adds the next one.
The intake labels do not authorize repository access, source inspection, evidence
collection, or mutation.

## Recruitment cadence

The maintainer owns a private list of three to five trusted project owners. Use
the [Korean-first direct invitation](pilots/external/direct-invitation-ko.md) and
add one personal sentence about the recipient's project.

| Relative day | Action | Repository record |
|---|---|---|
| Day 0 | Send one private invitation to each selected owner | Update aggregate invitations only |
| Day 7 | Send one reminder to each non-responder | Update aggregate reminders only |
| Day 14 | If no candidate exists, publish the fallback message on X, LinkedIn, or one developer community | Change the aggregate channel state |
| Day 28 | If no candidate exists after the public fallback, stop recruitment | Record `external-participation-blocked`; do not invent product evidence |

Day 0 starts when the first invitation is actually sent. Do not backfill a start
date from document publication. There is no second reminder.

## Candidate review

Review only submitted Issue Forms. Select in this order:

1. clear authority to approve the target;
2. one-page or one-flow scope;
3. a public page URL;
4. a safe local run or preview;
5. no required dependency or migration.

The first pilot must expose a public marketing page and one real CTA or core flow.
The source repository may remain private. Reject or close the intake when owner
authority is unclear, scope is larger than one page or flow, a safe preview is
missing, sensitive data appears, or dependency or migration work is required
before a separately approved plan exists.

## Separate consent

Move a candidate to `pilot:consent-pending` before requesting private material.
Complete a copy of
[`owner-consent-template.md`](pilots/external/owner-consent-template.md) outside
this repository when it would expose private target data. The record must name:

- the target path or non-sensitive artifact identifier;
- readable and mutable selectors;
- allowed evidence and retention location;
- whether screenshots may be published;
- stop conditions;
- separate decisions for dependency, migration, commit, push, deployment, and
  external writes.

Only a complete, approved record can move the issue to `pilot:running`.

## Pilot execution

Run the existing P6-P13 chain without skipping or combining approval records:

1. `review`
2. `review-handoff`
3. `review-handoff-verify`
4. `review-intake`
5. `review-scope`
6. `review-scope-approve`
7. approved implementation
8. `review-evidence`
9. `review-pilot`
10. `review-compare`

Capture baseline and candidate evidence at `390x844` and `1440x900`. Exercise
keyboard order, visible focus, reduced motion, horizontal overflow, console
output, accessibility behavior, and the target repository's relevant test and
build commands. Preserve `improved`, `unchanged`, and `blocked` as equally valid
outcomes; do not rewrite the result to imply success.

Store private source, logs, and screenshots in the participant repository. The
design-ai repository may retain exact source digests, approval references,
verification summaries, and only the feedback or images the owner explicitly
allows to be public.

## Pilot close-out

A candidate can become `pilot:evidence-complete` only when all of these records
are connected:

- exact source digest;
- owner authority and consent history;
- approved implementation scope;
- target test and build results;
- desktop and mobile browser evidence;
- `review-pilot` output;
- `review-compare` output;
- owner-approved feedback.

Each completed pilot uses its own evidence PR. Keep implementation and evidence
for that pilot in one cohesive commit and PR. A closed issue, elapsed recruitment
period, or implementation without the complete evidence chain is not a completed
pilot.

## Problem classification

Classify one primary problem in every completed pilot using exactly one key:

- `brief-direction-lock`
- `brand-system-grounding`
- `project-history-continuity`
- `runtime-deliverable-truth`
- `motion-quality-planning`
- `korean-product-pattern-fit`
- `other`

Use the
[`hypothesis-template.md`](pilots/external/hypothesis-template.md). A record can
influence the next capability only when it links completed `pilot-evidence`,
owner-approved feedback, and a source finding reference.

The first problem must appear again in a completed pilot owned by a different
project owner. If the first two pilots report different primary problems, use the
third slot once to test the more blocking problem. Two records from one owner do
not satisfy the rule.

| Repeated problem | Allowed follow-up plan |
|---|---|
| `brief-direction-lock` | Add a question-led brief and explicit visual-direction lock |
| `brand-system-grounding` | Add `DESIGN.md` input and validation |
| `project-history-continuity` | Plan project-level snapshots and comparison |
| `runtime-deliverable-truth` | Strengthen preview and deliverable-completion evidence |
| `motion-quality-planning` | Connect motion audit findings to an executable plan |
| `korean-product-pattern-fit` | Improve the Korean pack and knowledge, not a new surface |
| `other` | Research and name the repeated problem before proposing a capability |

When more than one problem qualifies, choose one by blocking impact, repeat count,
shared CLI/SDK/MCP usefulness, and maintenance cost, in that order. If no problem
repeats across the three slots, add no new capability.

## Operator checklist

- [ ] The private list contains three to five trusted project owners.
- [ ] The aggregate status contains no personal or private message data.
- [ ] The candidate entered through the Issue Form.
- [ ] Exactly one lifecycle status label is present.
- [ ] Selection follows the authority, scope, URL, preview, dependency order.
- [ ] Separate owner consent is complete before non-public inspection.
- [ ] Every separately gated action has its own approval.
- [ ] Baseline and candidate browser checks cover both required viewports.
- [ ] The target test and build results are preserved.
- [ ] The outcome remains `improved`, `unchanged`, or `blocked` as observed.
- [ ] Public evidence is limited to owner-approved material.
- [ ] Capability discussion stays closed until two distinct owners reproduce the
      same eligible problem.
