"""Registry-smoke adapter for the read-only inspect assertion."""
from __future__ import annotations

from .review_quality import assert_inspect_json


def assert_inspect_smoke_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_inspect_json(raw, context=context, cmd=cmd)
