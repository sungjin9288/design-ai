# P14 external pilot launch packet

This shipped directory prepares three consent-gated slots. It contains no
participant, project, consent, result, feedback, or adoption evidence.

## Files

- `program.json`: machine-checked slot inventory and claim boundary
- `recruitment-message.md`: paste-ready invitation with eligibility and privacy
- `recruitment-issue.md`: source-controlled public recruitment issue body
- `owner-consent-template.md`: pre-inspection authority and data boundary record
- `measurement-template.md`: source-backed close-out checklist

## Use

1. Run `npm run external-pilot:check` in the design-ai repository.
2. Share the public [recruitment issue](https://github.com/sungjin9288/design-ai/issues/56),
   send the recruitment message, or use the public
   [Issue Form](https://github.com/sungjin9288/design-ai/issues/new?template=external-pilot.yml)
   without adding private contact data here.
3. Create a separate owner consent record for the selected project.
4. Run the P6-P13 chain in the participant project after consent.
5. Derive `pilot-evidence.json` with `design-ai review-pilot`.
6. Add only owner-approved, publishable evidence to a new source-linked slot
   directory outside this immutable launch packet.

Do not edit `program.json` to suggest that a slot ran. A real pilot gets a new
source-linked evidence directory; the launch inventory remains the pre-participation
baseline.

The P15 launch proof is recorded in
[the source-controlled launch record](https://github.com/sungjin9288/design-ai/blob/main/evidence/p15/recruitment-launch.md).
