# Existing product refactor benchmark

## Source

The synthetic
[`before.html`](../../examples/benchmarks/product-specialization/existing-product-refactor/before.html)
fixture represents an existing settings page with four deliberate static defects.
[`after.html`](../../examples/benchmarks/product-specialization/existing-product-refactor/after.html)
changes only the markup needed to address those findings.

## Change

The revision declares the document language and mobile viewport, gives the button a
visible name, and gives the profile image an alternative. It keeps the page
structure intact. This makes the case about evidence-led refactoring rather than a
replacement redesign.

## Verification

Run:

```bash
design-ai benchmark existing-product-refactor --strict
```

The runner validates both canonical quality reports. It compares the exact expected
and observed confirmed finding IDs before and after the change. Missing and
unexpected findings are listed separately; they are not converted into a quality
score. Runtime evidence must remain `unverified` in both reports.

## Permission boundary

The runner reads the two packaged fixtures in place and never writes to them. It
does not open a browser, execute the page, mutate a target repository, or contact an
external service.

## Remaining risk

The corrected source has no supported static defect, but keyboard order, screen
reader output, focus appearance, loading, errors, repeated actions, motion, and
rendered layout were not exercised. A browser evidence run is still required before
calling the product behavior verified.

## Claim boundary

This synthetic comparison does not prove customer adoption or production impact.
It proves only that the deterministic inspector removes the expected static finding
IDs without promoting missing runtime evidence.
