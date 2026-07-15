# P13 release gate

Date: 2026-07-16

## Final result

`npm run release:check` passed.

- Tests: 832 passed, 0 failed.
- Strict audits: 8 passed.
- Package inventory: 774 files, 2.5 MB packed, 10.9 MB unpacked.
- Documentation warning policy: 0 warnings, 0 errors.
- Release metadata and release self-tests: passed.
- Packed tarball installed-bin smoke: passed.
- Packed tarball one-shot `npm exec` smoke: passed.
- SDK smoke includes full and compact `compareReviews()` contracts.
- CLI smoke includes compact installed-bin and full one-shot `review-compare` paths.
- A fresh stdio MCP process listed 29 tools and returned the default compact
  `design_ai_compare_reviews` result in 3,934 bytes with matching source hashes.

## Corrected gate failure

The first full run reached packed one-shot help validation and failed because the
fixed smoke inventory did not yet include the new `review-compare` topic. The
packed CLI had exposed the command correctly. The expected topic, usage, and help
fragments were added to `tools/audit/smoke_assertions.py`; its self-test passed,
then the complete release gate passed on the next run.

## Boundary

The gate installed and executed a locally packed tarball in temporary directories.
It did not publish npm, push Git, deploy documentation, or write to an external
system.
