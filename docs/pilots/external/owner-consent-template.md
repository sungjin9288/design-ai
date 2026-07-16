# External pilot owner consent

## Authority

- Slot id:
- Project role or owner-approved handle:
- Authority to approve the target:
- Consent source reference:
- Approved at, canonical UTC:

Do not store email, phone, legal name, access token, or credential in this record.

## Target

- Repository URL or non-sensitive identifier:
- Absolute local target path:
- Page, screen, flow, or artifact:
- Initial readable selectors:
- Initial mutable selectors:
- Existing change ownership:
- Evidence retention location and duration:
- Screenshot publication: `approved`, `declined`, or `not-requested`

## Consent decisions

- [ ] Read-only intake and review are approved.
- [ ] Evidence collection is approved within the boundary below.
- [ ] Mutation of the listed target selectors is approved after scope review.
- [ ] Private screenshots and logs remain in the target project by default.
- [ ] Publishable evidence requires a separate explicit decision.
- [ ] Commit, push, deployment, migration, dependency, and external-write gates
      remain separate.

## Data boundary

Allowed retained evidence:

- source references and SHA-256 identities;
- finding decisions and approval events;
- verification commands and results;
- owner-approved feedback wording and reference.

Excluded data:

- secrets and credentials;
- personal or customer records;
- private analytics exports;
- private source or screenshots not separately approved for publication.

## Stop conditions

- [ ] Stop if authority or consent becomes ambiguous.
- [ ] Stop if scope expands beyond the named artifact or selectors.
- [ ] Stop if excluded data enters the evidence path.
- [ ] Stop before any separately gated action without its approval record.
- [ ] Stop if observation and inference cannot be distinguished.

## Owner decision

- Status: `approved` or `declined`
- Evidence collection: `true` or `false`
- Target mutation: `true` or `false`
- Notes:
