# P15 external pilot recruitment preparation

## Source state

- Plan: `docs/PILOT-RECRUITMENT-PLAN.md`
- Issue Form: `.github/ISSUE_TEMPLATE/external-pilot.yml`
- Issue chooser config: `.github/ISSUE_TEMPLATE/config.yml`
- Recruitment issue source: `docs/pilots/external/recruitment-issue.md`
- Validator: `tools/audit/external-pilot-intake.py`

## External state

- `external-pilot` label exists.
- `pilot:intake` label exists and explicitly states that consent is not recorded.
- The recruitment issue is not published until the Issue Form is merged and
  verified on the default branch.

## Verification

- `npm run external-pilot:intake-self-test`: passed
- `npm run external-pilot:intake-check`: passed
- `npm run external-pilot:self-test`: passed
- `npm run external-pilot:check`: passed
- Parsed YAML when PyYAML is available; dependency-free structural and boundary
  checks remain active when it is not.

## Claim boundary

- Candidate intakes: 0
- Owner consent records: 0
- Active external pilots: 0
- External pilot results: 0
- Adoption evidence: none

This file proves recruitment readiness only. It does not prove that the form is
live or that an external owner has applied.
