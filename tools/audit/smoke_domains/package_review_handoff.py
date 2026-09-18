"""Package-smoke adapters for P7 handoff and P8 receipt assertions."""
from __future__ import annotations

from pathlib import Path

from .review_handoff import assert_review_handoff_json, assert_review_handoff_receipt_json


def assert_review_handoff_smoke_output(
    raw: str,
    workflow_path: Path,
    *,
    recipient: str,
    context: str,
    cmd: list[str],
) -> str:
    assert_review_handoff_json(raw, workflow_path, recipient=recipient, context=context, cmd=cmd)
    return raw


def assert_review_handoff_receipt_smoke_output(
    raw: str,
    handoff_path: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> str:
    assert_review_handoff_receipt_json(raw, handoff_path, consumer=consumer, context=context, cmd=cmd)
    return raw
