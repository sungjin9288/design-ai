"""Package-smoke validation for browser review evidence."""
from __future__ import annotations

import json
from pathlib import Path


def assert_browser_verification_smoke_output(
    raw: str,
    source_report: Path,
    target_root: Path,
    *,
    source_before: bytes,
    target_before: list[Path],
    context: str,
) -> None:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: browser verification output is not JSON: {error}") from error
    if payload.get("kind") != "design-ai-browser-verification" or payload.get("schemaVersion") != 1:
        raise SystemExit(f"{context}: browser verification contract identity changed")
    summary = payload.get("summary")
    if not isinstance(summary, dict) or summary.get("status") != "pass":
        raise SystemExit(f"{context}: browser verification did not pass")
    if (summary.get("passed"), summary.get("failed"), summary.get("unverified")) != (14, 0, 0):
        raise SystemExit(f"{context}: browser verification probe counts changed")
    boundary = payload.get("boundary")
    attestation = boundary.get("adapterAttestation") if isinstance(boundary, dict) else None
    if not isinstance(attestation, dict) or attestation.get("networkPolicy") != "attested":
        raise SystemExit(f"{context}: browser adapter network-policy attestation missing")
    if attestation.get("targetRepoMutation") != "unverified" or attestation.get("externalWrites") != "unverified":
        raise SystemExit(f"{context}: browser adapter write boundaries must remain unverified")
    source_contract = payload.get("sourceReport")
    if not isinstance(source_contract, dict) or source_contract.get("postRunDigestMatch") is not True:
        raise SystemExit(f"{context}: browser source-report post-run digest match missing")
    if boundary.get("sourceReportDigestMatchedAfterRun") is not True:
        raise SystemExit(f"{context}: browser boundary post-run digest match missing")
    evidence_path = Path(str(boundary.get("localEvidencePath", "")))
    if not (evidence_path / "browser-verification.json").is_file():
        raise SystemExit(f"{context}: normalized browser verification sidecar missing")
    if source_report.read_bytes() != source_before:
        raise SystemExit(f"{context}: browser verification changed the source report")
    target_after = sorted(path.relative_to(target_root) for path in target_root.rglob("*"))
    if target_after != target_before:
        raise SystemExit(f"{context}: browser verification changed the target root")
