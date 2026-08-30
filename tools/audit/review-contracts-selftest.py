#!/usr/bin/env python3
"""Run isolated phase-order and AST snapshot checks for the P6–P10 review domain."""
from __future__ import annotations

import argparse
import ast
import hashlib
import sys
from pathlib import Path
from typing import Callable

from smoke_domains.review_runner import (
    REVIEW_SMOKE_PLAN,
    ReviewSmokePhaseAuthority,
    assert_review_smoke_plan,
)

ROOT = Path(__file__).resolve().parents[2]
REVIEW_MODULES = (
    "review_quality.py",
    "review_workflow.py",
    "review_handoff.py",
    "review_intake.py",
    "review_scope.py",
)
REVIEW_CONTRACT_AST_SHA256 = "5388c3a7e258006c2a48ace720c690e943f598c136696a71cf308b904cf08ff1"


def canonical_ast(value: object) -> object:
    if isinstance(value, ast.AST):
        return (
            type(value).__name__,
            tuple(
                (name, canonical_ast(item))
                for name, item in ast.iter_fields(value)
                if name != "type_params"
            ),
        )
    if isinstance(value, list):
        return tuple(canonical_ast(item) for item in value)
    return value


def review_contract_ast_snapshot() -> str:
    definitions: list[tuple[str, str, str]] = []
    for name in REVIEW_MODULES:
        module_path = ROOT / "tools" / "audit" / "smoke_domains" / name
        tree = ast.parse(module_path.read_text(encoding="utf-8"))
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and (
                node.name.startswith("assert_") or node.name == "review_workflow_digest"
            ):
                definitions.append((name, node.name, repr(canonical_ast(node))))
    return repr(definitions)


def expect_system_exit(callback: Callable[[], object], expected: str) -> None:
    try:
        callback()
    except SystemExit as error:
        if expected not in str(error):
            raise SystemExit(
                f"review contracts self-test expected {expected!r}, got {str(error)!r}"
            ) from error
        return
    raise SystemExit(f"review contracts self-test expected failure containing {expected!r}")


def run_self_test() -> int:
    assert_review_smoke_plan("installed-bin", actual=REVIEW_SMOKE_PLAN)
    assert_review_smoke_plan("npm-exec", actual=REVIEW_SMOKE_PLAN)
    expect_system_exit(
        lambda: assert_review_smoke_plan("installed-bin", actual=REVIEW_SMOKE_PLAN[:-1]),
        "phase missing",
    )
    expect_system_exit(
        lambda: assert_review_smoke_plan(
            "npm-exec",
            actual=(REVIEW_SMOKE_PLAN[1], REVIEW_SMOKE_PLAN[0], *REVIEW_SMOKE_PLAN[2:]),
        ),
        "phase order changed",
    )
    expect_system_exit(
        lambda: assert_review_smoke_plan(
            "installed-bin",
            actual=REVIEW_SMOKE_PLAN + (REVIEW_SMOKE_PLAN[-1],),
        ),
        "phase duplicate",
    )
    authority = ReviewSmokePhaseAuthority("npm-exec")
    authority.advance(REVIEW_SMOKE_PLAN[0])
    expect_system_exit(lambda: authority.advance("unknown-phase"), "phase unknown")
    digest = hashlib.sha256(review_contract_ast_snapshot().encode("utf-8")).hexdigest()
    if digest != REVIEW_CONTRACT_AST_SHA256:
        raise SystemExit(
            "review contracts self-test AST snapshot changed: "
            f"expected {REVIEW_CONTRACT_AST_SHA256}, got {digest}"
        )
    print("Review contracts self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run isolated review contract fixtures")
    args = parser.parse_args()
    if not args.self_test:
        parser.error("--self-test is required")
    return run_self_test()


if __name__ == "__main__":
    sys.exit(main())
