from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import (
    EXPECTED_ROUTE_BRIEF,
    EXPECTED_ROUTE_ID,
    assert_no_ansi,
    format_cmd,
)


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_learning_eval_report_json(
    raw: str,
    *,
    profile_path: Path,
    eval_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn eval JSON") from error

    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn eval JSON should report the learning profile path",
    )
    require_package_smoke(
        payload.get("source") == str(eval_path),
        context=context,
        cmd=cmd,
        message="learn eval JSON should report the checkpoint source path",
    )
    require_package_smoke(
        payload.get("status") == "pass"
        and payload.get("caseCount") == 1
        and payload.get("passed") == 1,
        context=context,
        cmd=cmd,
        message="learn eval JSON should pass the expected checkpoint case",
    )
    cases = payload.get("cases")
    require_package_smoke(
        isinstance(cases, list)
        and len(cases) == 1
        and cases[0].get("id") == "button-accessibility"
        and cases[0].get("routeId") == EXPECTED_ROUTE_ID
        and cases[0].get("briefHash")
        and cases[0].get("selectedEntryIds") == ["learn-relevant"]
        and cases[0].get("missingExpectedIds") == [],
        context=context,
        cmd=cmd,
        message="learn eval JSON should include selected ids and checkpoint status",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("storesRawBriefText") is False
        and privacy.get("storesBriefHash") is True
        and privacy.get("exposesMatchedTokens") is False,
        context=context,
        cmd=cmd,
        message="learn eval JSON should describe privacy-preserving checkpoint output",
    )
    require_package_smoke(
        EXPECTED_ROUTE_BRIEF not in raw
        and "\"brief\"" not in raw
        and "\"query\"" not in raw,
        context=context,
        cmd=cmd,
        message="learn eval JSON should not expose raw brief or query text",
    )

def assert_learning_eval_template_json(
    raw: str,
    *,
    profile_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn eval-template JSON") from error

    source_profile = payload.get("sourceProfile")
    require_package_smoke(
        payload.get("version") == 1
        and isinstance(source_profile, dict)
        and source_profile.get("file") == str(profile_path)
        and source_profile.get("entryCount") >= 1,
        context=context,
        cmd=cmd,
        message="learn eval-template JSON should report the source learning profile",
    )
    cases = payload.get("cases")
    require_package_smoke(
        payload.get("caseCount") == 1
        and isinstance(cases, list)
        and len(cases) == 1
        and cases[0].get("expectedSelectedIds") == ["learn-relevant"]
        and cases[0].get("minMatchedCount") == 1
        and cases[0].get("requireNoFallback") is True,
        context=context,
        cmd=cmd,
        message="learn eval-template JSON should generate a runnable expected-selection checkpoint",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("storesRawBriefText") is True
        and privacy.get("storesBriefHash") is False
        and privacy.get("exposesMatchedTokens") is False,
        context=context,
        cmd=cmd,
        message="learn eval-template JSON should disclose that checkpoint templates store raw brief text",
    )
    require_package_smoke(
        EXPECTED_ROUTE_BRIEF in raw
        and "\"brief\"" in raw,
        context=context,
        cmd=cmd,
        message="learn eval-template JSON should include runnable raw brief text in checkpoint cases",
    )

def assert_learning_eval_template_report_json(
    raw: str,
    *,
    profile_path: Path,
    eval_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse generated learn eval JSON") from error

    require_package_smoke(
        payload.get("file") == str(profile_path)
        and payload.get("source") == str(eval_path)
        and payload.get("status") == "pass"
        and payload.get("caseCount") == 1
        and payload.get("passed") == 1,
        context=context,
        cmd=cmd,
        message="generated learn eval-template checkpoint should pass learn --eval --strict",
    )
    cases = payload.get("cases")
    require_package_smoke(
        isinstance(cases, list)
        and len(cases) == 1
        and cases[0].get("selectedEntryIds") == ["learn-relevant"]
        and cases[0].get("missingExpectedIds") == [],
        context=context,
        cmd=cmd,
        message="generated learn eval-template report should select the expected learning entry",
    )

def assert_learning_eval_strict_failure_json(
    raw: str,
    *,
    returncode: int,
    profile_path: Path,
    eval_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    require_package_smoke(
        returncode == 1,
        context=context,
        cmd=cmd,
        message="learn eval --strict should exit with code 1 when checkpoints fail",
    )
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn eval strict JSON") from error

    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn eval strict JSON should report the learning profile path",
    )
    require_package_smoke(
        payload.get("source") == str(eval_path),
        context=context,
        cmd=cmd,
        message="learn eval strict JSON should report the checkpoint source path",
    )
    require_package_smoke(
        payload.get("status") == "fail"
        and payload.get("caseCount") == 1
        and payload.get("failed") == 1,
        context=context,
        cmd=cmd,
        message="learn eval strict JSON should report the failed checkpoint case",
    )
    cases = payload.get("cases")
    issue_codes = []
    if isinstance(cases, list) and cases and isinstance(cases[0].get("issues"), list):
        issue_codes = [issue.get("code") for issue in cases[0]["issues"] if isinstance(issue, dict)]
    require_package_smoke(
        isinstance(cases, list)
        and len(cases) == 1
        and cases[0].get("status") == "fail"
        and cases[0].get("missingExpectedIds") == ["missing-entry"]
        and "expected-entry-not-in-profile" in issue_codes
        and "expected-entry-not-selected" in issue_codes,
        context=context,
        cmd=cmd,
        message="learn eval strict JSON should include deterministic failure details",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("storesRawBriefText") is False
        and privacy.get("storesBriefHash") is True
        and privacy.get("exposesMatchedTokens") is False,
        context=context,
        cmd=cmd,
        message="learn eval strict JSON should describe privacy-preserving checkpoint output",
    )
    require_package_smoke(
        EXPECTED_ROUTE_BRIEF not in raw
        and "\"brief\"" not in raw
        and "\"query\"" not in raw,
        context=context,
        cmd=cmd,
        message="learn eval strict JSON should not expose raw brief or query text",
    )

def assert_learning_eval_report_human(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    for expected in (
        "Local learning eval report",
        "Checkpoint:",
        "Status: pass",
        "button-accessibility / component-spec: pass",
        "Privacy: eval reports expose brief hashes and selected ids, not raw brief text.",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn eval human output missing {expected!r}",
        )
