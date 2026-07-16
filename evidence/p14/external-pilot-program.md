# External pilot program verification

- Canonical program: `docs/pilots/external/program.json`
- Reusable templates: `docs/pilots/external/`
- Checker: `tools/audit/external-pilot-program.py`
- Verification: `npm run external-pilot:self-test` and
  `npm run external-pilot:check` passed on 2026-07-16.
- Repository preflight: `npm run release:preflight` passed with 832 tests, all 8
  strict audits, 783 packaged files, release metadata, every self-test, and the
  0/0 documentation warning policy.
- Inventory: 3 recruitment-ready slots
- Participants: 0
- Identified owners: 0
- Consented targets: 0
- Measurements or feedback: 0
- Adoption claim: blocked until real participation

The checker rejects a slot that implies owner identification, consent, a target,
an artifact, or a measurement before a separate real-project record exists. This
file proves launch readiness only; it is not external-user evidence.
