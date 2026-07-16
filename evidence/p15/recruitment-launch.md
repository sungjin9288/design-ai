# P15 external pilot recruitment launch evidence

## Source state

- Plan: `docs/PILOT-RECRUITMENT-PLAN.md`
- Issue Form: `.github/ISSUE_TEMPLATE/external-pilot.yml`
- Issue chooser config: `.github/ISSUE_TEMPLATE/config.yml`
- Recruitment issue source: `docs/pilots/external/recruitment-issue.md`
- Validator: `tools/audit/external-pilot-intake.py`
- Merge: [PR #55](https://github.com/sungjin9288/design-ai/pull/55), commit
  `8a4bc88ba1b485e0c1713aeb86018756418f74f3`
- Default-branch form blob: `226d45555644a7fb4c7a18e80a225199cedc2a17`,
  4,024 bytes

## Public state

- [External design pilot Issue Form](https://github.com/sungjin9288/design-ai/issues/new?template=external-pilot.yml)
  rendered from `main` with all three segments and ten expected fields.
- Required owner-authority, public-data, intake-only, separate-consent, and action
  gate acknowledgements were visible.
- The optional public project reference remained unrequired.
- `external-pilot` and `pilot:intake` labels rendered with their intended claim
  boundaries.
- [Recruitment issue #56](https://github.com/sungjin9288/design-ai/issues/56)
  rendered open with the form link, program guide, three-slot offer, and zero-result
  evidence boundary.
- [Published P15 plan](https://sungjin9288.github.io/design-ai/docs/PILOT-RECRUITMENT-PLAN/)
  rendered with the funnel, intake boundaries, exit criteria, and product gate.

The browser checks used the logged-in owner session only to observe rendering. No
candidate form was submitted and no pilot consent was created.

## Verification

- `npm run release:preflight`: passed
- `npm run package:smoke`: passed
- `npm run external-pilot:intake-self-test`: passed
- `npm run external-pilot:intake-check`: passed
- `npm run external-pilot:self-test`: passed
- `npm run external-pilot:check`: passed with three slots, zero participants, and
  the adoption claim blocked
- PR #55 required checks: passed in run `29498635522`
- Main Audit: [run `29498762177`](https://github.com/sungjin9288/design-ai/actions/runs/29498762177),
  passed including real VS Code e2e and the external-pilot intake validator
- GitHub Pages: [run `29498762066`](https://github.com/sungjin9288/design-ai/actions/runs/29498762066),
  build and deployment passed

## Claim boundary

- Candidate intakes: 0 observed
- Owner consent records: 0
- Active external pilots: 0
- External pilot results: 0
- Adoption evidence: none

This file proves recruitment activation only. A submitted issue would prove
candidate intake, not authority to inspect or mutate a target. A real pilot begins
only after a separate source-linked owner-consent record is complete.
