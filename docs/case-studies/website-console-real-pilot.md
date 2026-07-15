# Website Console real pilot

## Source

This internal pilot used the Design AI Website Console in the current repository.
The project owner authorized evidence collection, the approved file selectors, the
responsive navigation change, browser verification, commit, and push. The P6-P12
chain is preserved under `evidence/p12/`; the original review workflow and scope
approval remain independently hashable.

## Change

On a 390-pixel viewport, nine section buttons formed a tall navigation block that
pushed the active work surface down the page. The approved change keeps those
buttons in one native horizontal scroll row, preserves a 44-pixel target height,
and returns keyboard focus to the active button after each render. Desktop keeps
its existing sidebar.

The focus outline is a solid three-pixel `#4f46e5` line. Its measured contrast is
6.29:1 on white and 5.62:1 on the active navigation surface, above the 3:1 non-text
contrast requirement.

## Pilot measures

| Measure | Recorded result |
|---|---:|
| Time to first useful P6 artifact | 14 seconds |
| Findings accepted / rejected / unresolved | 1 / 0 / 0 |
| Approval gates | 10 total; 3 approved, 4 not required, 3 pending release gates |
| Implementation evidence | Complete |
| Unresolved implementation risk | 0 |

The three pending gates are commit, push, and the declared external write. They are
release controls, not missing implementation evidence.

## Verification

`npm run release:check` passed with 815 tests, all 8 strict audits, 0 documentation
warnings and errors, 766 packaged files, and installed-bin plus one-shot `npm exec`
package smoke. The focused Website Console suite passed 25 tests.

Playwright verified 1440x1000 and 390x844 viewports. Mobile body width remained
390 pixels with no page overflow; navigation stayed 52 pixels tall in one row;
every target was 44 pixels tall. Forward and reverse keyboard navigation retained
focus after activation, five repeated activations stayed stable, reduced-motion
preference was detected, and the console reported no errors or warnings. A manual
screen-reader session was not run.

Website Console imported a 416,114-byte P12 artifact and exported the exact original
bytes. Input, browser storage, and export all share SHA-256
`0491b4f2ea369b102d3faffb4dffab0dad91c8c8e046120910ef663694af597a`.
Clearing P12 restored the exact P11 implementation-evidence stage.

## Permission boundary

The implementation changed only the approved Website Console source, focused test,
case, status documents, and `evidence/p12/**`. No dependency, migration, deployment,
or production system changed. Browser verification used a loopback preview. Commit
and push remain separate recorded release actions.

## Remaining risk

The complete nested P12 response is 416,019 bytes when returned by MCP. A fresh MCP
process correctly rejects it because the transport limit is 220,000 bytes. CLI,
SDK, package smoke, and Website Console prove the underlying contract, but fresh
MCP transport is not complete. The next slice will add a compact response that
keeps exact source hashes, derived measures, issues, and claim boundaries without
repeating nested source bodies.

## Claim boundary

| Class | What this case supports |
|---|---|
| Real | One consented internal review-to-implementation run and its exact local evidence |
| Synthetic | Packaged fixture and smoke checks, kept separate from the pilot |
| Inferred | The workflow is operable by this repository's owner under the recorded controls |
| Unverified | External identity, authentic customer feedback, adoption, production quality, business impact, and manual screen-reader behavior |

This case proves one internal workflow. It is not a customer-adoption or production-
outcome claim.
