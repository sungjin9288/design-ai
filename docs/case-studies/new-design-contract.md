# New design contract benchmark

## Source

This is a synthetic regression case, not a customer project or an adoption claim.
The suite brief asks for a Korean team workspace for reviewing pending approvals
without losing context. The inspected candidate is the packaged
[`candidate.html`](../../examples/benchmarks/product-specialization/new-design-contract/candidate.html)
fixture.

## Change

`design-ai start` turns the brief into the existing `design-from-brief` route and
an agent-readable `DESIGN.md` contract. The benchmark does not generate or edit a
product screen. It checks that the first artifact still names its route, output,
workflow, verification, and approval boundary before implementation begins.

## Verification

Run:

```bash
design-ai benchmark new-design-contract --strict
```

The case passes only when the start payload and embedded design contract keep their
versioned identities, the review remains unexecuted, every performed write array is
empty, and target-repository editing still requires approval.

## Permission boundary

The case reads the shipped corpus to compose a plan. It writes no local file, does
not inspect or mutate a target repository, and makes no external request. The next
implementation action remains behind the human approval list in the artifact.

## Remaining risk

The benchmark proves contract composition, not visual quality or first-value time.
No interface, runtime, accessibility tree, responsive layout, or user outcome was
observed. Those claims remain unverified until a real implementation is reviewed.

## Claim boundary

This synthetic case does not prove customer adoption, production quality, or the
five-minute first-value target. It proves only that the local design contract and
fixture inspection retain their declared evidence and approval boundaries.
