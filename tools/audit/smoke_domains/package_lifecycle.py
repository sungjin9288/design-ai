"""Package smoke lifecycle domains: pilot record, install/uninstall, help
catalog, ranked-search determinism, and route evaluation.

Completes the P17B domain split. Assertions move verbatim; package-smoke.py
keeps the stable callable names by importing them back.
"""
from __future__ import annotations

import json
import subprocess

from pathlib import Path
from smoke_assertions import (
    EXPECTED_CORPUS_SEARCH_QUERY,
    EXPECTED_RANKED_SEARCH_LIMIT,
    EXPECTED_RANKED_SEARCH_NOT_BUILT_NOTICE,
    assert_install_json,
    assert_install_output,
    assert_no_ansi,
    assert_pilot_evidence_json,
    assert_ranked_search_determinism,
    assert_ranked_search_json,
    assert_uninstall_json,
    assert_uninstall_output,
    parse_help_topics,
)
from smoke_domains.cli_runner import (
    run_plain,
    run_plain_with_input,
)
from smoke_domains.package_failures import require_package_smoke


def read_help_topics(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str = "package smoke help catalog",
) -> list[str]:
    result = run_plain(cmd, cwd=cwd, env=env)
    return parse_help_topics(result.stdout, context=context, cmd=cmd)


def assert_install_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_install_output(result.stdout, context=context, cmd=cmd)


def assert_install_json_smoke(
    cmd: list[str],
    *,
    prefix: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_install_json(result.stdout, prefix=prefix, context=context, cmd=cmd)


def assert_uninstall_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_uninstall_output(result.stdout, context=context, cmd=cmd)


def assert_uninstall_json_smoke(
    cmd: list[str],
    *,
    prefix: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_uninstall_json(result.stdout, prefix=prefix, context=context, cmd=cmd)


def assert_route_eval_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse route eval JSON") from error

    require_package_smoke(payload.get("evalVersion") == 1, context=context, cmd=cmd, message="route eval version changed")
    require_package_smoke(payload.get("status") == "pass", context=context, cmd=cmd, message="route eval should pass")
    summary = payload.get("summary")
    require_package_smoke(
        isinstance(summary, dict)
        and summary.get("total", 0) >= 2
        and summary.get("pass") == summary.get("total")
        and summary.get("fail") == 0,
        context=context,
        cmd=cmd,
        message="route eval summary changed",
    )
    cases = payload.get("cases")
    require_package_smoke(isinstance(cases, list) and cases, context=context, cmd=cmd, message="route eval cases missing")
    ids = {case.get("id") for case in cases if isinstance(case, dict)}
    require_package_smoke(
        {"design-review-a11y", "component-spec-contract", "website-improvement-control-tower"}.issubset(ids),
        context=context,
        cmd=cmd,
        message="route eval template case ids changed",
    )
    require_package_smoke(
        all(
            isinstance(case, dict)
            and case.get("status") == "pass"
            and case.get("topRouteId") == case.get("expectedRouteId")
            and case.get("issues", []) == []
            for case in cases
        ),
        context=context,
        cmd=cmd,
        message="route eval case result changed",
    )


def assert_route_eval_smoke(
    command_factory,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    template_cmd = command_factory("route", "--eval-template", "--json")
    template_result = run_plain(template_cmd, cwd=cwd, env=env)
    eval_cmd = command_factory("route", "--eval", "--stdin", "--strict", "--json")
    eval_result = run_plain_with_input(
        eval_cmd,
        input_text=template_result.stdout,
        cwd=cwd,
        env=env,
    )
    assert_route_eval_json(eval_result.stdout, context=context, cmd=eval_cmd)


def assert_pilot_evidence_smoke(
    cmd: list[str],
    implementation_evidence_path: Path,
    review_workflow_path: Path,
    record_path: Path,
    target_root: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> str:
    sources_before = {
        file_path: file_path.read_bytes()
        for file_path in (implementation_evidence_path, review_workflow_path, record_path)
    }
    status_before = subprocess.run(
        ["git", "status", "--short", "--untracked-files=all"],
        cwd=target_root,
        text=True,
        capture_output=True,
        check=True,
    ).stdout
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_pilot_evidence_json(
        result.stdout,
        implementation_evidence_path,
        review_workflow_path,
        record_path,
        context=context,
        cmd=cmd,
    )
    if any(file_path.read_bytes() != source for file_path, source in sources_before.items()):
        raise SystemExit(f"{context}: review-pilot changed an input artifact")
    status_after = subprocess.run(
        ["git", "status", "--short", "--untracked-files=all"],
        cwd=target_root,
        text=True,
        capture_output=True,
        check=True,
    ).stdout
    if status_after != status_before:
        raise SystemExit(f"{context}: review-pilot changed the target repository")
    return result.stdout


def write_pilot_record(
    file_path: Path,
    review_workflow_path: Path,
    approval_path: Path,
    implementation_evidence_path: Path,
) -> None:
    workflow = json.loads(review_workflow_path.read_text(encoding="utf-8"))
    approval = json.loads(approval_path.read_text(encoding="utf-8"))
    implementation_evidence = json.loads(implementation_evidence_path.read_text(encoding="utf-8"))
    record = {
        "kind": "design-ai-pilot-record",
        "schemaVersion": 1,
        "project": {
            "name": "Package smoke project",
            "repositoryUrl": implementation_evidence["observed"]["repositoryUrl"],
            "pilotClass": "internal-dogfood",
        },
        "consent": {
            "status": "approved",
            "approver": "package-smoke-owner",
            "identity": "self-declared",
            "reference": "package-smoke-confirmation",
            "approvedAt": "2026-07-15T12:00:00.000Z",
            "evidenceCollection": True,
            "targetMutation": True,
        },
        "timeline": {
            "pilotStartedAt": "2026-07-15T12:00:00.000Z",
            "firstUsefulArtifactAt": "2026-07-15T12:00:30.000Z",
            "implementationCompletedAt": "2026-07-15T12:02:00.000Z",
        },
        "findingDecisions": [
            {
                "findingId": finding["id"],
                "decision": "accepted",
                "summary": "The package smoke pilot retained this finding.",
                "reference": "package smoke finding review",
            }
            for finding in workflow["report"]["findings"]
        ],
        "approvalEvents": [
            {
                "gateId": gate["id"],
                "status": gate["status"],
                "occurredAt": "2026-07-15T12:00:00.000Z" if gate["status"] == "approved" else "",
                "reference": "package-smoke-confirmation" if gate["status"] == "approved" else "implementation scope gate record",
            }
            for gate in approval["approvalGates"]
        ],
        "outcome": {
            "implementationStatus": "partial",
            "productionStatus": "not-deployed",
            "feedback": {
                "status": "not-collected",
                "summary": "No user feedback is claimed by package smoke.",
                "reference": "",
            },
        },
        "claims": [
            {"class": "real", "statement": "The command used a real temporary Git checkout.", "reference": "implementation-evidence.json"},
            {"class": "synthetic", "statement": "The target content is a package smoke fixture.", "reference": "package-smoke.py"},
            {"class": "inferred", "statement": "Contract parity suggests the packaged workflow is operable.", "reference": "package smoke result"},
            {"class": "unverified", "statement": "Customer adoption and production outcomes are not established.", "reference": "pilot boundary"},
        ],
    }
    file_path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")


def assert_ranked_search_determinism_smoke(
    command_factory,
    index_dir: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    index_dir.mkdir(parents=True, exist_ok=True)
    ranked_env = env.copy()
    ranked_env["DESIGN_AI_INDEX_DIR"] = str(index_dir)

    ranked_cmd = command_factory(
        "search",
        EXPECTED_CORPUS_SEARCH_QUERY,
        "--dir",
        "knowledge",
        "--limit",
        str(EXPECTED_RANKED_SEARCH_LIMIT),
        "--ranked",
        "--json",
    )
    first_result = run_plain(ranked_cmd, cwd=cwd, env=ranked_env)
    second_result = run_plain(ranked_cmd, cwd=cwd, env=ranked_env)
    assert_ranked_search_json(
        first_result.stdout,
        context=f"{context} payload",
        cmd=ranked_cmd,
        expected_notice=EXPECTED_RANKED_SEARCH_NOT_BUILT_NOTICE,
    )
    assert_ranked_search_determinism(
        first_result.stdout,
        second_result.stdout,
        context=context,
        cmd=ranked_cmd,
    )
