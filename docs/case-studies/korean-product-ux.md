# Korean product UX benchmark

## Source

The source pair is synthetic. The initial
[`source.html`](../../examples/benchmarks/korean-product-packs/korean-fintech/source.html)
fixture belongs to the shipped `korean-fintech` review pack. The
[`after.html`](../../examples/benchmarks/product-specialization/korean-product-ux/after.html)
fixture corrects only the three static form defects the pack can confirm.

## Change

The phone field gains `type=tel` and `autocomplete=tel`, the password field declares
`current-password`, and optional marketing consent is no longer preselected. The
revision does not claim that payment disclosure, dense financial layouts, Korean
wrapping, or assistive-technology behavior passed.

## Verification

Run:

```bash
design-ai benchmark korean-product-ux --strict
```

The benchmark requires the initial report to contain the three namespaced confirmed
findings and the revised report to contain none. It also requires payment
disclosure, density, runtime accessibility, and the general runtime check to remain
`unverified`. Any missing or unexpected finding is a regression.

## Permission boundary

The Korean review pack is selected explicitly. Locale alone never activates it.
The command reads packaged HTML and pack definitions only; it performs no write,
browser run, target-repository mutation, or external request.

## Remaining risk

This case proves deterministic form semantics and honest uncertainty. It does not
prove legal compliance, payment completion, responsive Korean copy, density under
real data, or accessibility in a rendered product. Those require scenario and
browser evidence owned by the product team.

## Claim boundary

This synthetic fixture does not prove customer adoption, Korean legal compliance,
or production usability. It proves only the review pack's declared static rules and
the continued visibility of evidence gaps.
