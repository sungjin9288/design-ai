# External pilot recruitment plan

P15 turns the prepared P14 slots into a public, privacy-safe intake path. It does
not add a design capability or weaken the rule that product work needs repeated
evidence from distinct project owners.

Launch evidence: [public recruitment issue #56](https://github.com/sungjin9288/design-ai/issues/56)
and [the source-controlled P15 launch record](https://github.com/sungjin9288/design-ai/blob/main/evidence/p15/recruitment-launch.md).
The form and recruitment path are live; candidate intake, consent, participation,
results, and adoption evidence remain separate future states.

## Objective

Let a project owner apply for one bounded design-ai pilot through GitHub without
publishing private source, credentials, personal contact details, or a local path.
Keep application, consent, implementation, feedback, and adoption as separate
states.

## Funnel

| State | Evidence | What it authorizes |
|---|---|---|
| Recruitment published | Public recruitment issue and rendered Issue Form | Nothing in a target project |
| Candidate intake | One submitted GitHub issue | Follow-up questions only |
| Consent pending | Candidate selected for an available slot | Drafting the separate consent record |
| Consented | Complete owner-consent record | Only its explicit read and mutation boundaries |
| Pilot running | Exact P6-P11 source chain | Approved implementation and verification steps |
| Evidence complete | Valid P12-P13 artifacts | Bounded findings and outcomes only |

A GitHub issue never counts as consent. Closing or labeling an issue never counts
as a completed pilot.

## Intake fields

The public form asks for:

- one of the three prepared pilot segments;
- a project role or GitHub handle, not a legal name or email address;
- a statement that the submitter can authorize the target;
- one bounded page, screen, or user flow;
- target visibility and available verification surface;
- the improvement goal;
- acknowledgements for privacy, separate consent, and separate action gates.

Repository URLs are optional and public URLs only. A private repository, local
path, preview credential, screenshot, source file, analytics export, or customer
record belongs in neither the issue nor this repository.

## Delivery steps

1. Add a GitHub Issue Form for external-pilot intake.
2. Add deterministic source validation for form structure, required boundaries,
   and prohibited data requests.
3. Run that validation in the existing release self-test and required PR workflow.
4. Publish one recruitment issue linking the form and program documentation.
5. Keep the canonical three-slot launch inventory unchanged at zero participants.

## Exit criteria

- The Issue Form renders from the default branch and exposes all three segments.
- Required authority, privacy, intake-only, and separate-consent acknowledgements
  are visible.
- The form asks for no email, phone, legal name, credential, local path, private
  source, analytics export, or customer data.
- Labels identify new submissions as external-pilot intake.
- CI rejects structural or boundary drift in the form.
- A public recruitment issue is open and links to the form plus the published
  program guide.
- `docs/pilots/external/program.json` still reports three `awaiting-owner` slots,
  zero participants, and a blocked adoption claim.

## Product decision gate

P15 collects candidates; it does not choose the next capability. That decision
still requires the same user problem in at least two independent, completed pilot
records from distinct owners.
