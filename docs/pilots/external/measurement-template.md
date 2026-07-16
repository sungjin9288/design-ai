# External pilot measurement record

Complete this record from canonical source artifacts. Do not estimate missing
values.

## Source identity

- Slot id:
- Owner consent reference:
- Review workflow reference and SHA-256:
- Implementation evidence reference and SHA-256:
- Pilot record reference and SHA-256:
- Pilot evidence reference and SHA-256:

## Derived observations

| Measure | Value | Source field | Status |
|---|---|---|---|
| Time to first useful artifact | | `metrics.timeToFirstUsefulArtifact` | unverified |
| Accepted findings | | `metrics.findingPrecision.accepted` | unverified |
| Rejected findings | | `metrics.findingPrecision.rejected` | unverified |
| Unresolved findings | | `metrics.findingPrecision.unresolved` | unverified |
| Approved gates | | `metrics.approvalFriction.approved` | unverified |
| Pending gates | | `metrics.approvalFriction.pending` | unverified |
| Implementation | | `metrics.implementation` | unverified |
| Unresolved risks | | `metrics.unresolvedRisk` | unverified |

## Runtime quality

- [ ] Mobile and desktop widths match their viewports without horizontal overflow.
- [ ] Keyboard order, visible focus, and dismiss behavior were exercised.
- [ ] Relevant screen-reader semantics were checked or marked unverified.
- [ ] Text contrast meets WCAG 2.1 AA and touch targets are at least 44 by 44 pixels.
- [ ] Reduced-motion behavior was checked where motion exists.
- [ ] Console, network, loading, error, and repeated-action evidence is attached or
      marked unverified.

## Feedback

- Collection status: `collected` or `not-collected`
- Owner-approved summary:
- Source reference:
- Publication permission:

Do not infer satisfaction, adoption, business impact, or production quality from
task completion.

## Claims

- Real:
- Synthetic:
- Inferred:
- Unverified:

## Close-out

- Outcome: `evidence-complete`, `attention-required`, or `blocked`
- Remaining risk:
- Next action:
- Capability signal, if any:
- Independent pilot record with the same problem:

The capability signal stays pending until the same problem appears in at least two
independent pilot records from distinct project owners.
