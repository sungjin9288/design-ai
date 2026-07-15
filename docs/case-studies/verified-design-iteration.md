# Verified design iteration: Website Console proof

## Question

Can Design AI preserve two exact design reviews and explain what changed without
turning missing evidence into an improvement claim?

## Test subject

The internal Website Console was used as a controlled development subject. The
baseline and candidate were canonical quality-report fixtures with matching
subject, brief, route, locale, and viewports. This is repository-owned development
evidence, not external customer research.

## Result

The P13 operation produced a full `design-ai-review-comparison` v1 artifact. It
preserved both references, source strings, parsed reports, byte counts, and SHA-256
digests. The sample remained `attention-required` because unchanged findings stay
persistent; the operation did not manufacture an improvement from equal inputs.

Website Console imported and restored the full artifact, rendered its decisions,
and exported bytes with SHA-256
`c274093e1ba0f2e9ad21208ae7c512efc0e891f1d15b52cfac7e5a6a94f81b0f`, matching
the imported file.

## Interface evidence

- Desktop viewport: 1440 by 1100, no horizontal overflow.
- Mobile viewport: 390 by 844, no horizontal overflow.
- Minimum visible navigation control height: 44 pixels.
- Keyboard skip link moved focus to the main content.
- Browser console: zero warnings and zero errors in both checks.

Screenshots and the detailed run record are stored under `evidence/p13/` in the
source repository. They are development evidence and are not included in the npm
package.

## Permission boundary

The comparison read two explicit report sources and made no repository mutation,
network call, deployment, commit, push, or external write. Those actions remained
separate gates. The browser check ran only against a local static server.

## Claim boundary

| Class | Supported statement |
| --- | --- |
| Real | The repository implementation, package contracts, and Console import/export path were exercised locally. |
| Synthetic | The compared review reports were controlled fixtures. |
| Inferred | The shared contract can support a before-and-after review loop when callers preserve matching context. |
| Unverified | External adoption, customer finding precision, production quality, business impact, and manual screen-reader output. |

This case proves contract behavior and one internal interface path. It does not
prove customer adoption or production outcomes.
