# Multi-agent handoff benchmark

## Source

This synthetic case starts from one brief and a small
[`source.html`](../../examples/benchmarks/product-specialization/multi-agent-handoff/source.html)
fixture. The named producer and consumer are roles in the regression case, not
claims about external agent services or customer usage.

## Change

The planning role produces a versioned start payload with an embedded design
contract and a canonical static quality report from the supplied HTML. Both
payloads are serialized and parsed before the implementation-review role receives
and validates them. The benchmark checks that this transfer changes neither
contract nor permission state.

## Verification

Run:

```bash
design-ai benchmark multi-agent-handoff --strict
```

The case validates the planning role's start contract and quality report, then the
implementation-review role's received copies. It compares the transferred objects
for exact semantic equality, checks the approval gate, and confirms that a clean
static source still carries the runtime `unverified` finding.

## Permission boundary

The roles exchange in-memory JSON only. No MCP server, model provider, repository,
browser, local evidence directory, or external service is contacted. Editing and
publishing remain explicit downstream approvals in the transferred contract.

## Remaining risk

The case proves portable contract integrity inside the local runner. It does not
prove delivery guarantees of a real agent transport, implementation correctness,
or runtime quality. A production handoff still needs transport evidence, approved
implementation, and post-change browser verification.

## Claim boundary

This synthetic role transfer does not prove external agent adoption or transport
reliability. It proves only the local envelope digest, consumer validation result,
and preserved approval boundary for the packaged payloads.
