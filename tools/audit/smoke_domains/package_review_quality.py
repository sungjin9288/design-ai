"""Package-smoke adapters for P6 quality and comparison assertions."""
from __future__ import annotations

from pathlib import Path

from .review_quality import assert_inspect_json, assert_review_comparison_json
from .review_workflow import assert_review_workflow_json


def assert_review_smoke_output(raw: str, source_path: Path, *, context: str, cmd: list[str]) -> str:
    assert_review_workflow_json(raw, source_path, context=context, cmd=cmd)
    return raw


def assert_review_comparison_smoke_output(
    raw: str,
    baseline_path: Path,
    candidate_path: Path,
    *,
    compact: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_review_comparison_json(
        raw,
        baseline_path,
        candidate_path,
        compact=compact,
        context=context,
        cmd=cmd,
    )


def assert_inspect_smoke_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_inspect_json(raw, context=context, cmd=cmd)
