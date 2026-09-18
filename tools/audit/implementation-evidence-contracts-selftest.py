#!/usr/bin/env python3
"""Run isolated P11 implementation-evidence contract checks."""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import sys
import tempfile
from copy import deepcopy
from pathlib import Path
from typing import Callable

from smoke_domains.implementation_evidence import assert_implementation_evidence_json
from smoke_domains.implementation_evidence_fixtures import implementation_evidence_request_fixture
from smoke_domains.implementation_evidence_runner import (
    IMPLEMENTATION_EVIDENCE_SMOKE_PLAN,
    ImplementationEvidenceSmokePhaseAuthority,
    assert_implementation_evidence_smoke_plan,
    implementation_evidence_smoke_plan,
)

ROOT = Path(__file__).resolve().parents[2]
IMPLEMENTATION_EVIDENCE_CONTRACT_AST_SHA256 = (
    "4af3d29424a464b61740f5610826b951b209e71a02dd8063cf1630d6c4b2433d"
)
BOUNDARY_FALSE_FIELDS = (
    "localWrites",
    "targetRepoMutation",
    "externalWrites",
    "networkCalls",
    "implementationPerformed",
    "commitAuthorized",
    "commitPerformed",
    "pushAuthorized",
    "pushPerformed",
    "deploymentAuthorized",
    "deploymentPerformed",
)


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


def implementation_evidence_contract_ast_snapshot() -> str:
    module_path = ROOT / "tools" / "audit" / "smoke_domains" / "implementation_evidence.py"
    tree = ast.parse(module_path.read_text(encoding="utf-8"))
    definition = next(
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "assert_implementation_evidence_json"
    )
    return repr(canonical_ast(definition))


def expect_system_exit(callback: Callable[[], object], expected: str) -> None:
    try:
        callback()
    except SystemExit as error:
        if expected not in str(error):
            raise SystemExit(
                f"implementation evidence self-test expected {expected!r}, got {str(error)!r}"
            ) from error
        return
    raise SystemExit(f"implementation evidence self-test expected failure containing {expected!r}")


def expect_value_error(callback: Callable[[], object], expected: str) -> None:
    try:
        callback()
    except ValueError as error:
        if expected not in str(error):
            raise SystemExit(
                f"implementation evidence self-test expected {expected!r}, got {str(error)!r}"
            ) from error
        return
    raise SystemExit(f"implementation evidence self-test expected ValueError containing {expected!r}")


def source_artifact(file_path: Path) -> dict[str, object]:
    source = file_path.read_text(encoding="utf-8")
    return {
        "reference": str(file_path.resolve()),
        "source": source,
        "sha256": hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "bytes": len(source.encode("utf-8")),
        "value": json.loads(source),
    }


def passing_implementation_evidence(
    approval_path: Path,
    request_path: Path,
    target_root: Path,
) -> dict[str, object]:
    return {
        "kind": "design-ai-implementation-evidence",
        "schemaVersion": 1,
        "status": "attention-required",
        "consumer": "package-smoke-agent",
        "approval": source_artifact(approval_path),
        "request": source_artifact(request_path),
        "observed": {
            "targetPath": str(target_root),
            "branch": "main",
            "worktreeChanges": [
                {
                    "path": "src/settings/view.tsx",
                    "reported": True,
                    "selector": "src/settings/**/*.tsx",
                }
            ],
        },
        "verification": {
            "expectedCommands": ["npm test", "npm run build"],
            "summary": {"pass": 0, "fail": 0, "notRun": 2},
        },
        "observations": [{"status": "unverified"} for _ in range(3)],
        "artifacts": [],
        "issues": [{"level": "warning"}],
        "boundary": {
            "mode": "read-only-evidence",
            "verificationCommandsExecuted": [],
            "evidenceFilesRead": [],
            "applicationSourceRead": False,
            **{field: False for field in BOUNDARY_FALSE_FIELDS},
        },
    }


def assert_fixture(
    payload: object,
    approval_path: Path,
    request_path: Path,
    target_root: Path,
) -> None:
    assert_implementation_evidence_json(
        json.dumps(payload),
        approval_path,
        request_path,
        target_root,
        consumer="package-smoke-agent",
        context="implementation evidence contract self-test",
        cmd=["design-ai", "review-evidence"],
    )


def run_contract_fixtures() -> None:
    with tempfile.TemporaryDirectory(prefix="design-ai-implementation-evidence-contract-") as tmp:
        tmp_root = Path(tmp)
        approval_path = tmp_root / "approval.json"
        approval_path.write_text(json.dumps({"kind": "approval"}) + "\n", encoding="utf-8")
        request_path = tmp_root / "request.json"
        request_path.write_text(
            json.dumps(implementation_evidence_request_fixture(" M src/settings/view.tsx")) + "\n",
            encoding="utf-8",
        )
        target_root = tmp_root / "target"
        target_root.mkdir()
        passing = passing_implementation_evidence(approval_path, request_path, target_root)
        assert_fixture(passing, approval_path, request_path, target_root)

        expect_system_exit(
            lambda: assert_implementation_evidence_json(
                "\x1b[31m{}",
                approval_path,
                request_path,
                target_root,
                consumer="package-smoke-agent",
                context="implementation evidence contract self-test",
                cmd=["design-ai", "review-evidence"],
            ),
            "ANSI escape",
        )
        expect_system_exit(
            lambda: assert_implementation_evidence_json(
                "{",
                approval_path,
                request_path,
                target_root,
                consumer="package-smoke-agent",
                context="implementation evidence contract self-test",
                cmd=["design-ai", "review-evidence"],
            ),
            "failed to parse implementation evidence",
        )
        mutations = (
            ("kind", "changed identity or status", lambda value: value.update(kind="wrong")),
            (
                "source",
                "changed approval source identity",
                lambda value: value["approval"].update(sha256="0" * 64),
            ),
            (
                "observed",
                "changed observed Git evidence",
                lambda value: value["observed"].update(branch="feature"),
            ),
            (
                "proof",
                "promoted missing proof",
                lambda value: value["verification"].update(summary={"pass": 2, "fail": 0, "notRun": 0}),
            ),
            (
                "read-boundary",
                "changed its read boundary",
                lambda value: value["boundary"].update(applicationSourceRead=True),
            ),
            (
                "expanded-boundary",
                "expanded localWrites",
                lambda value: value["boundary"].update(localWrites=True),
            ),
        )
        for _, expected, mutate in mutations:
            changed = deepcopy(passing)
            mutate(changed)
            expect_system_exit(
                lambda changed=changed: assert_fixture(
                    changed,
                    approval_path,
                    request_path,
                    target_root,
                ),
                expected,
            )


def run_phase_fixtures() -> None:
    assert_implementation_evidence_smoke_plan(
        "installed-bin",
        actual=IMPLEMENTATION_EVIDENCE_SMOKE_PLAN,
    )
    assert_implementation_evidence_smoke_plan(
        "npm-exec",
        actual=IMPLEMENTATION_EVIDENCE_SMOKE_PLAN,
    )
    expect_system_exit(
        lambda: assert_implementation_evidence_smoke_plan(
            "installed-bin",
            actual=IMPLEMENTATION_EVIDENCE_SMOKE_PLAN[:-1],
        ),
        "phase missing",
    )
    expect_system_exit(
        lambda: assert_implementation_evidence_smoke_plan(
            "npm-exec",
            actual=tuple(reversed(IMPLEMENTATION_EVIDENCE_SMOKE_PLAN)),
        ),
        "phase order changed",
    )
    expect_system_exit(
        lambda: assert_implementation_evidence_smoke_plan(
            "installed-bin",
            actual=IMPLEMENTATION_EVIDENCE_SMOKE_PLAN + (IMPLEMENTATION_EVIDENCE_SMOKE_PLAN[-1],),
        ),
        "phase duplicate",
    )
    authority = ImplementationEvidenceSmokePhaseAuthority("npm-exec")
    authority.advance(IMPLEMENTATION_EVIDENCE_SMOKE_PLAN[0])
    expect_system_exit(lambda: authority.advance("unknown-phase"), "phase unknown")
    expect_value_error(
        lambda: implementation_evidence_smoke_plan("unsupported"),
        "unsupported implementation evidence smoke executor",
    )


def run_self_test() -> int:
    run_contract_fixtures()
    run_phase_fixtures()
    digest = hashlib.sha256(
        implementation_evidence_contract_ast_snapshot().encode("utf-8")
    ).hexdigest()
    if digest != IMPLEMENTATION_EVIDENCE_CONTRACT_AST_SHA256:
        raise SystemExit(
            "implementation evidence self-test AST snapshot changed: "
            f"expected {IMPLEMENTATION_EVIDENCE_CONTRACT_AST_SHA256}, got {digest}"
        )
    print("Implementation evidence contracts self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run isolated implementation-evidence contract fixtures",
    )
    args = parser.parse_args()
    if not args.self_test:
        parser.error("--self-test is required")
    return run_self_test()


if __name__ == "__main__":
    sys.exit(main())
