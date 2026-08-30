"""Package-smoke adapter for P11 implementation evidence."""
from __future__ import annotations

from pathlib import Path

from .implementation_evidence import assert_implementation_evidence_json


def assert_implementation_evidence_smoke_output(
    raw: str,
    approval_path: Path,
    request_path: Path,
    target_root: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> str:
    assert_implementation_evidence_json(
        raw,
        approval_path,
        request_path,
        target_root,
        consumer=consumer,
        context=context,
        cmd=cmd,
    )
    return raw
