# Design quality contract

The design quality report is the shared evidence contract for reviewing a design,
flow, page, or application. Its source of truth is the packaged
`cli/lib/design-quality-report.schema.json` file.

Version 1 is deliberately strict. Its JSON Schema defines the portable structure,
and the dependency-free validator enforces cross-field consistency that JSON Schema
cannot derive. A report is valid only when it passes both parts of that contract. It
favors an incomplete but honest report over a complete-looking report built from
assumptions.

## Report shape

Every report records:

- the subject and review context;
- the read, write, and approval boundary;
- the sources that were actually inspected;
- one result for each of the eight quality lenses;
- actionable findings with evidence and verification steps;
- a derived summary; and
- actions that require approval.

Unknown properties are rejected. Contract changes therefore require a schema
version decision instead of silently changing adapter output.

`generatedAt` uses normalized UTC form such as `2026-07-14T00:00:00.000Z` so
evidence bundles compare dates without locale or timezone ambiguity.

## Quality lenses

| Lens | Question |
|---|---|
| `purpose-frequency` | Does the interface fit the task's purpose and frequency? |
| `response` | Does each action return timely, understandable feedback? |
| `spatial-continuity` | Do navigation, overlays, and state changes preserve orientation? |
| `interruptibility` | Can repeated actions, cancellation, and in-flight work be handled safely? |
| `timing-cohesion` | Do motion and state transitions feel related and respect reduced motion? |
| `performance` | Does the experience remain responsive under realistic content and work? |
| `accessibility` | Can keyboard, screen-reader, low-vision, and motor users complete the task? |
| `responsive-resilience` | Does the interface survive narrow, wide, zoomed, and localized layouts? |

All eight lenses are required. A lens may be `unverified`, but it cannot be omitted.

## Status model

| Status | Meaning |
|---|---|
| `pass` | Available evidence supports the expected behavior. |
| `warning` | The behavior works, but evidence shows a meaningful quality risk. |
| `fail` | Evidence confirms that the expected behavior does not hold. |
| `unverified` | The required source or runtime observation was not available. |

The report has no numeric quality score. A number would make an accessibility
failure and missing runtime proof look interchangeable. The summary instead follows
the strongest lens status: `fail`, then `warning`, then `unverified`, then `pass`.

## Evidence rules

Evidence uses one of seven kinds: `brief`, `code`, `runtime`, `screenshot`,
`accessibility`, `manual`, or `design-contract`.

Every evidence entry includes a concrete `reference` and a plain observation. The
reference should be a file and line, selector, URL and viewport, screenshot path,
test artifact, or named manual step. An interpretation without an inspected source
is not evidence.

Code can confirm static structure. It cannot prove focus order, animation feel,
network behavior, responsive wrapping, or repeated-action handling. Those behaviors
remain `unverified` until runtime evidence exists.

## Static HTML inspector

`design-ai inspect <source.html> --brief text --json` is the first producer of
this contract. The CLI reads one explicit regular `.html` or `.htm` file up to
1 MB and rejects symbolic links in the selected path or its user-controlled path
segments. Filesystem-root aliases supplied by the operating system, such as
macOS `/var`, remain readable. SDK `inspectHtml()` and MCP
`design_ai_inspect_html` accept HTML content directly and never read a path.

An explicit Korean product review pack can extend that same report without changing
its v1 shape:

```bash
design-ai review-pack
design-ai inspect page.html \
  --brief "Review the Korean checkout flow" \
  --review-pack korean-commerce \
  --locale ko-KR \
  --viewport mobile \
  --viewport desktop \
  --json
```

The five shipped ids are `korean-fintech`, `korean-commerce`, `korean-saas`,
`korean-content`, and `korean-game`. A selected pack is recorded through an
existing `design-contract` source entry with its immutable revision and namespaced
finding ids. Locale never selects a pack implicitly. Phone input semantics,
password autocomplete intent, and preselected marketing consent are the only extra
static confirmations. Korean
wrapping, density, payment disclosure, game probability disclosure, and runtime
accessibility remain `unverified` until their declared browser or scenario
evidence exists.

The deterministic rules confirm only evidence visible in supplied markup:
document language, supported active control names, button names, image `alt`
declarations, and a mobile viewport declaration containing `width=device-width`
when mobile coverage is requested. Template, `noscript`, and `inert` content plus
tags written inside HTML raw-text controls are not treated as active elements;
SVG title text remains available to the accessible-name check. A passing static rule is not
promoted to a passing lens. Keyboard,
accessibility-tree, interaction, motion, performance, and rendered responsive
behavior remain `unverified` until a runtime produces evidence.

```bash
design-ai inspect page.html \
  --brief "Review account settings before implementation" \
  --locale ko-KR \
  --viewport mobile \
  --viewport desktop \
  --json
```

## Browser verification sidecar

`design-ai verify-browser` is the optional runtime step after static inspection.
It does not change the canonical quality report. Instead, it reads that report,
runs one user-supplied adapter, and writes a separate
`design-ai-browser-verification` artifact under
`~/.design-ai/evidence/browser/`.

```bash
design-ai inspect page.html \
  --brief "Review account settings before implementation" \
  --json > /tmp/account-settings-quality.json

design-ai verify-browser /tmp/account-settings-quality.json \
  --url http://127.0.0.1:4173/settings \
  --target-root /absolute/path/to/account-settings \
  --adapter node \
  --adapter-arg /absolute/path/to/browser-adapter.mjs \
  --approval-ref "human: account settings browser run approved" \
  --yes \
  --json
```

The runner accepts loopback URLs only. It neither installs a browser nor adds a
browser dependency to the package. The adapter receives a JSON request on stdin
and returns tool metadata plus one probe for each requested check and viewport.
The seven checks are responsive layout, keyboard operation, accessibility,
reduced motion, loading, error handling, and repeated action.

Every normalized probe records URL through the parent run, viewport, observation
time, tool, observation, and at least one local artifact path. Responsive probes
need screenshot evidence and accessibility probes need accessibility output before
they can pass. Missing adapters, missing probes, invalid JSON, incomplete artifacts,
and timeouts remain `unverified`. An adapter-reported failure remains `fail` only
when its timestamp and supporting artifact satisfy the same evidence contract.
Nothing is promoted to a pass by absence of evidence.

Each non-passing probe creates a sidecar finding. That finding links its artifacts
and any related unverified finding IDs from the source quality report. The sidecar
also records the source report SHA-256 digest, approval reference, target root,
adapter name and version, and local evidence directory. The source report digest
is checked again after execution; a mismatch is recorded as a boundary violation
and the run is rejected. Mutation restored before adapter exit remains unverified.

The adapter is external executable code and currently runs on macOS or Linux. Design AI starts it from the dedicated
evidence directory with a minimal environment, but the operator must still trust
that executable separately. Design AI compares the source-report digest after exit and confines
its own files to the evidence directory. It records the adapter's exact network-policy
attestation separately; target-repository mutation and external writes by the adapter
remain `unverified` because the runner does not sandbox the executable.

The complete stdin/stdout and artifact contract is documented in
[`BROWSER-VERIFICATION.md`](BROWSER-VERIFICATION.md).

Website Console imports the quality report and browser sidecar as separate immutable
contracts. It preserves the original JSON bytes, compares the quality bytes with the
sidecar SHA-256 digest when Web Crypto is available, and reports missing viewport
coverage. It never treats a sidecar as a merged report or changes an unverified lens
because an unrelated probe passed.

## Finding rules

Every finding includes:

- a stable ID and one quality lens;
- severity and confirmation status;
- a concrete location;
- Before, After, and Why statements;
- at least one evidence entry; and
- at least one verification step.

Severity means:

| Severity | Meaning |
|---|---|
| `p0` | Release blocker, destructive behavior, or a core task that cannot be completed |
| `p1` | Major task failure or accessibility barrier with broad user impact |
| `p2` | Localized quality gap with a clear workaround or limited impact |
| `p3` | Non-blocking polish that improves clarity or cohesion |

`confirmed` means the current evidence supports the finding. `unverified` means the
risk is worth checking but the evidence is not yet sufficient. A report must not
rewrite an unverified risk as a confirmed defect.

Summary finding counts are derived from the findings array. `blockingFindings`
counts `p0` findings. Adapters must not supply hand-edited totals.

## Permission boundary

Version 1 allows two review modes:

- `read-only`: reads sources and writes nothing;
- `local-evidence-write`: may write a named local evidence artifact.

Both modes require `targetRepoMutation: false` and `externalWrites: false`. Editing
the reviewed repository, starting an operator-controlled process, committing,
pushing, publishing, deploying, or writing to another system remains outside this
report and must appear in `approval.requiredBefore` when applicable.

`local-evidence-write` also requires `localEvidenceWrites: true` and a non-empty
`localEvidencePath`. The report names the artifact; it does not authorize a writer
to bypass the package's output-path, overwrite, root, or symbolic-link checks.

## Canonical benchmark

The baseline fixture is
[`examples/benchmarks/korean-fintech-settings/`](../examples/benchmarks/korean-fintech-settings/).
It contains a small Korean account-settings page with one confirmed accessibility
failure and several behaviors that static inspection cannot verify. This makes the
fixture useful for testing both finding precision and honest uncertainty.

Run the contract tests with:

```bash
node --test cli/lib/design-quality-contract.test.mjs
```

Consumers that load a report in Node can use:

```js
import { readDesignQualityReport } from "./cli/lib/design-quality-contract.mjs";

const report = readDesignQualityReport(
  "examples/benchmarks/korean-fintech-settings/quality-report.json",
);
```

The validator returns the report unchanged when it passes and throws an actionable
error when the contract is incomplete or internally inconsistent.

## Product specialization regression suite

The canonical report fixture proves the v1 report contract in isolation. The wider
[`design-ai benchmark`](BENCHMARKS.md) suite checks how that contract behaves across
new design, existing-product refactor, Korean product UX, and multi-agent handoff.

```bash
design-ai benchmark --strict
design-ai benchmark korean-product-ux --strict --json
```

Quality comparison cases run the same inspector against packaged before and after
sources. They compare exact confirmed finding IDs and preserve the list of
unverified runtime risks. The handoff case serializes and parses the canonical
payloads, validates the received report again, and checks that the repository-edit
approval gate survived. No case writes a file or assigns an aggregate quality
score.
