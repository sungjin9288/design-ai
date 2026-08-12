"""Website Console evidence preservation assertions."""
from __future__ import annotations

from .assertion_helpers import assert_no_ansi
from .site_package_fixtures import SITE_EVIDENCE_VALUES

def assert_site_evidence_payload(payload: object, *, context: str, label: str) -> None:
    if not isinstance(payload, dict):
        raise SystemExit(f"{label} after {context} did not emit an object payload")
    evidence = payload.get("implementationEvidence")
    if not isinstance(evidence, dict):
        raise SystemExit(f"{label} after {context} did not preserve implementationEvidence")
    for key, expected in SITE_EVIDENCE_VALUES.items():
        if evidence.get(key) != [expected]:
            raise SystemExit(f"{label} after {context} evidence field {key} changed: {evidence.get(key)!r}")


def assert_site_evidence_markdown(raw: str, *, context: str, cmd: list[str], label: str) -> None:
    assert_no_ansi(raw, cmd)
    stripped = raw.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        raise SystemExit(f"{label} after {context} looks like JSON output")
    for fragment in SITE_EVIDENCE_VALUES.values():
        if fragment not in raw:
            raise SystemExit(f"{label} after {context} missing evidence fragment: {fragment!r}")
