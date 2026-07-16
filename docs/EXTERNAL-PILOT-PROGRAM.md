# External pilot program

P14 prepares three real-user pilot slots without treating preparation as
participation. Every slot starts at `awaiting-owner`. No repository, source,
measurement, feedback, or adoption claim exists until a project owner gives
recorded consent.

The canonical launch record is
[`docs/pilots/external/program.json`](pilots/external/program.json). Verify it
before recruitment:

```bash
npm run external-pilot:check
```

## Three slots

| Slot | Intended project | Current state |
|---|---|---|
| Marketing site | One existing landing or marketing page | Awaiting an external owner |
| App workflow | One observable web or app flow | Awaiting an external owner |
| Korean commerce or fintech | One bounded interface using an opt-in Korean review pack | Awaiting an external owner |

The slots are capacity, not evidence. Their current records deliberately contain
no owner identity, contact reference, target path, consent, result, or feedback.

[Apply through the external pilot Issue Form](https://github.com/sungjin9288/design-ai/issues/new?template=external-pilot.yml).
Submitting the form creates a candidate intake only; it does not approve source
inspection, evidence collection, or target mutation.
The [P15 recruitment plan](PILOT-RECRUITMENT-PLAN.md) defines the public intake
funnel and its completion checks.

## Entry gate

Start a pilot only when all of these statements are true:

1. The participant owns or can authorize the named repository and artifact.
2. The participant accepts evidence collection and the exact mutation boundary.
3. One page, screen, or user flow defines the initial scope.
4. Local verification or a safe preview can exercise the relevant behavior.
5. Secrets, customer data, analytics exports, and production credentials stay out
   of the design-ai evidence bundle.

Use the [recruitment](pilots/external/recruitment-message.md),
[consent](pilots/external/owner-consent-template.md), and
[measurement](pilots/external/measurement-template.md) templates. Store private
contact details outside this repository. The retained consent record needs only a
participant-chosen role or handle, authority statement, approved scope, data
boundary, canonical UTC time, and source reference.

## Execution sequence

### 1. Record intake and consent

Complete `owner-consent-template.md`. Do not inspect application source or begin a
review while authority, target, evidence retention, or mutation permission is
unclear.

### 2. Run the existing evidence chain

Use the public package and keep every intermediate JSON byte-identifiable:

```bash
npx --yes @design-ai/cli@5.1.0 review target.html \
  --brief "<bounded owner-approved task>" \
  --repo-url "<declared repository URL>" \
  --local-path "<absolute target path>" \
  --url "<safe preview URL>" \
  --viewport mobile \
  --viewport desktop \
  --json > review-workflow.json
```

Continue through `review-handoff`, `review-handoff-verify`, `review-intake`,
`review-scope`, `review-scope-approve`, and `review-evidence`. Target mutation,
dependency changes, migrations, commit, push, deployment, and external writes
retain their own approvals.

### 3. Close the pilot record

After implementation evidence exists, fill one `design-ai-pilot-record` v1 using
the exact workflow finding order and approval gates. Then derive the final artifact:

```bash
npx --yes @design-ai/cli@5.1.0 review-pilot implementation-evidence.json \
  --workflow review-workflow.json \
  --record pilot-record.json \
  --json > pilot-evidence.json
```

Use `measurement-template.md` to review the derived evidence. Do not hand-enter a
time, precision count, approval count, or implementation result when the canonical
artifact can derive it.

## Measurement

Each pilot records six separate observations:

| Measure | Source |
|---|---|
| Time to first useful artifact | Canonical pilot UTC timeline |
| Finding decisions | Accepted, rejected, and unresolved workflow findings |
| Approval friction | Approved, not-required, and pending gates |
| Implementation completion | Exact P11 implementation evidence |
| Unresolved risk | P11 remaining risks, unchanged |
| Participant feedback | Owner-approved wording and source reference, when collected |

There is no aggregate score. Missing or invalid evidence remains `unverified` or
`attention-required`.

## Accessibility and responsive proof

A completed pilot records keyboard reachability, visible focus, semantic or
screen-reader behavior where applicable, text contrast, 44-by-44-pixel touch
targets, mobile and desktop overflow, and reduced-motion behavior. Unsupported
runtime behavior remains unverified. Private screenshots stay in the target
project unless the owner separately approves publication.

## Stop conditions

Stop before source inspection or mutation when any of these conditions appears:

- owner authority or consent is missing or ambiguous;
- the task expands beyond the recorded page, screen, or flow;
- secrets or personal, customer, analytics, or production data enter the path;
- a dependency, migration, external write, commit, push, or deployment lacks its
  separate approval;
- observed behavior cannot be separated from inference.

## Decision rule

Do not select another product capability from one anecdote. The same user problem
must appear in at least two independent pilot records from distinct project
owners. A prepared slot, an internal dogfood run, or synthetic package smoke does
not establish external adoption.
