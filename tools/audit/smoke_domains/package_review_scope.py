"""Package-smoke adapters for P9 intake and P10 scope assertions."""
from __future__ import annotations

from pathlib import Path

from .review_intake import assert_target_repo_intake_json
from .review_scope import (
    assert_implementation_scope_approval_json,
    assert_implementation_scope_proposal_json,
)


def assert_target_repo_intake_smoke_output(
    raw: str,
    receipt_path: Path,
    target_root: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> str:
    assert_target_repo_intake_json(
        raw,
        receipt_path,
        target_root,
        consumer=consumer,
        context=context,
        cmd=cmd,
    )
    return raw


def assert_implementation_scope_proposal_smoke_output(
    raw: str,
    intake_path: Path,
    request_path: Path,
    target_root: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> str:
    assert_implementation_scope_proposal_json(
        raw,
        intake_path,
        request_path,
        consumer=consumer,
        context=context,
        cmd=cmd,
    )
    return raw


def assert_implementation_scope_approval_smoke_output(
    raw: str,
    proposal_path: Path,
    target_root: Path,
    *,
    approver: str,
    approval_ref: str,
    approved_at: str,
    context: str,
    cmd: list[str],
) -> str:
    assert_implementation_scope_approval_json(
        raw,
        proposal_path,
        approver=approver,
        approval_ref=approval_ref,
        approved_at=approved_at,
        context=context,
        cmd=cmd,
    )
    return raw
