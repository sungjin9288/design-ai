# Product specialization benchmarks

`design-ai benchmark` is the repeatable proof for Design AI's specialization
journey. It runs four packaged cases against the same contracts used by the product:

- a new design brief becoming an agent-readable design contract;
- an evidence-led refactor of an existing product page;
- a Korean fintech UX review with an explicit product pack; and
- an unchanged contract handoff between two agent roles.

These are synthetic regression cases. They prove local contract behavior and
finding precision. They do not prove customer adoption, production outcomes, or a
time-to-value target.

## Run the suite

```bash
design-ai benchmark
design-ai benchmark --strict --json
design-ai benchmark --list
design-ai benchmark korean-product-ux --strict
```

With no case ID, the command runs all four cases. `--strict` exits non-zero when a
contract is invalid or when expected and observed finding IDs differ. `--json`
returns the portable report. `--list` reads the suite catalog without running a
case.

## What the report compares

Each result names its journey, packaged source, case study, contract checks,
permission boundary, and observed outcome. Quality comparison cases report:

- expected and observed confirmed findings before the change;
- expected and observed confirmed findings after the change;
- missing expected findings;
- unexpected findings;
- findings removed by the revision; and
- risks that must remain `unverified` without runtime evidence.

There is no aggregate quality score. A single number would hide the difference
between a false positive, a missing accessibility finding, and a behavior that was
never exercised. The suite uses pass or fail only for regression control and keeps
the underlying lists visible.

## Permission boundary

The command reads shipped fixtures and Design AI corpus files. It writes no local
artifact, does not open a browser, does not execute fixture code, does not mutate a
target repository, and makes no external request. The new-design and multi-agent
cases also assert that downstream repository edits remain behind approval.

## Case studies

- [New design contract](case-studies/new-design-contract.md)
- [Existing product refactor](case-studies/existing-product-refactor.md)
- [Korean product UX](case-studies/korean-product-ux.md)
- [Multi-agent handoff](case-studies/multi-agent-handoff.md)

Every case study records its source, change, verification, permission boundary,
remaining risk, and claim boundary. A case is publishable only while all six
sections remain present and its referenced files stay in the npm package.
