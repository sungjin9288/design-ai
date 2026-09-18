from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd
from smoke_domains.package_learning_agent_backlog_actions import (
    valid_agent_backlog_actions_and_verification,
)
from smoke_domains.package_learning_agent_backlog_plan import (
    valid_agent_backlog_queue_and_handoff,
    valid_agent_backlog_runbook_and_effects,
)

EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_REASON = "No real warn/fail check result has been intentionally captured into the local learning profile yet."
EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_NEXT_CONDITION = (
    "Run `design-ai check <artifact.md> --learn --yes` only after reviewing an actual warning or failure "
    "that should improve future outputs."
)
EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_AUTOMATION_POLICY = "Do not emit placeholder mutation commands for this advisory gap; wait for real check evidence."


def require_package_smoke(
    condition: bool, *, context: str, cmd: list[str], message: str
) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_agent_backlog_report_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    require_status_pass: bool = False,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"{context}: failed to parse learn agent backlog JSON"
        ) from error

    require_package_smoke(
        payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path),
        context=context,
        cmd=cmd,
        message="learn agent backlog JSON should report the learning profile and usage paths",
    )
    if require_status_pass:
        require_package_smoke(
            payload.get("status") == "pass" and payload.get("signalStatus") == "pass",
            context=context,
            cmd=cmd,
            message="learn agent backlog strict JSON should report passing backlog and signal status",
        )
    counts = payload.get("counts")
    require_package_smoke(
        isinstance(counts, dict)
        and counts.get("actions", 0) >= 1
        and counts.get("evalSignals", 0) >= 1
        and counts.get("checkCaptures", 0) >= 1
        and counts.get("usageEvents", 0) >= 2,
        context=context,
        cmd=cmd,
        message="learn agent backlog JSON should include focused backlog counts",
    )
    actions = payload.get("actions")
    require_package_smoke(
        isinstance(actions, list)
        and any(
            isinstance(item, dict)
            and item.get("id") == "agent-skill-proposal-preview"
            and item.get("category") == "skill-evolution"
            and "learn --propose-skills" in str(item.get("command", ""))
            for item in actions
        ),
        context=context,
        cmd=cmd,
        message="learn agent backlog JSON should include skill-evolution next action",
    )
    action_plan = payload.get("actionPlan")
    require_package_smoke(
        valid_agent_backlog_queue_and_handoff(action_plan)
        and valid_agent_backlog_runbook_and_effects(action_plan)
        and valid_agent_backlog_actions_and_verification(action_plan),
        context=context,
        cmd=cmd,
        message="learn agent backlog JSON should include executable action plan steps and verification",
    )
    commands = payload.get("commands")
    require_package_smoke(
        isinstance(commands, dict)
        and "learn --signals" in str(commands.get("signalsJson", ""))
        and "learn --signals" in str(commands.get("signalsReport", "")),
        context=context,
        cmd=cmd,
        message="learn agent backlog JSON should include signal registry follow-up commands",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False
        and privacy.get("storesRawBriefText") is False,
        context=context,
        cmd=cmd,
        message="learn agent backlog JSON should keep read-only local privacy boundaries",
    )
    assert_agent_backlog_readiness_json(
        payload,
        expect_check_capture_gap=False,
        context=context,
        cmd=cmd,
    )


def assert_agent_backlog_readiness_json(
    payload: dict,
    *,
    expect_check_capture_gap: bool,
    context: str,
    cmd: list[str],
) -> None:
    readiness = payload.get("readiness")
    checks = readiness.get("checks") if isinstance(readiness, dict) else None
    check_by_id = (
        {
            item.get("id"): item
            for item in checks
            if isinstance(item, dict) and isinstance(item.get("id"), str)
        }
        if isinstance(checks, list)
        else {}
    )
    check_capture = check_by_id.get("check-capture")
    agent_development = check_by_id.get("agent-development")
    optional_gaps = (
        readiness.get("optionalGaps") if isinstance(readiness, dict) else None
    )
    optional_gap_details = (
        readiness.get("optionalGapDetails") if isinstance(readiness, dict) else None
    )
    required_check_ids = (
        readiness.get("requiredCheckIds") if isinstance(readiness, dict) else None
    )
    optional_check_ids = (
        readiness.get("optionalCheckIds") if isinstance(readiness, dict) else None
    )
    check_status_by_id = (
        readiness.get("checkStatusById") if isinstance(readiness, dict) else None
    )
    check_required_by_id = (
        readiness.get("checkRequiredById") if isinstance(readiness, dict) else None
    )
    check_count_by_status = (
        readiness.get("checkCountByStatus") if isinstance(readiness, dict) else None
    )
    required_check_count_by_status = (
        readiness.get("requiredCheckCountByStatus")
        if isinstance(readiness, dict)
        else None
    )
    optional_check_count_by_status = (
        readiness.get("optionalCheckCountByStatus")
        if isinstance(readiness, dict)
        else None
    )
    blocking_checks = (
        readiness.get("blockingChecks") if isinstance(readiness, dict) else None
    )
    count_status_keys = (
        "pass",
        "info",
        "warn",
        "fail",
        "missing",
        "template",
        "unknown",
    )
    check_count_total = (
        sum(check_count_by_status.get(key, 0) for key in count_status_keys)
        if isinstance(check_count_by_status, dict)
        else -1
    )
    required_check_count_total = (
        sum(required_check_count_by_status.get(key, 0) for key in count_status_keys)
        if isinstance(required_check_count_by_status, dict)
        else -1
    )
    optional_check_count_total = (
        sum(optional_check_count_by_status.get(key, 0) for key in count_status_keys)
        if isinstance(optional_check_count_by_status, dict)
        else -1
    )
    detail_by_id = (
        {
            item.get("id"): item
            for item in optional_gap_details
            if isinstance(item, dict) and isinstance(item.get("id"), str)
        }
        if isinstance(optional_gap_details, list)
        else {}
    )
    check_capture_detail = detail_by_id.get("check-capture")
    check_capture_detail_valid = (
        isinstance(check_capture_detail, dict)
        and check_capture_detail.get("label") == "Check learning capture"
        and check_capture_detail.get("status") == "info"
        and check_capture_detail.get("reason")
        == EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_REASON
        and check_capture_detail.get("nextCondition")
        == EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_NEXT_CONDITION
        and check_capture_detail.get("automationPolicy")
        == EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_AUTOMATION_POLICY
    )
    require_package_smoke(
        isinstance(readiness, dict)
        and readiness.get("version") == 1
        and readiness.get("status") == payload.get("signalStatus")
        and isinstance(readiness.get("summary"), str)
        and bool(readiness.get("summary"))
        and isinstance(readiness.get("requiredReady"), bool)
        and isinstance(readiness.get("requiredPassCount"), int)
        and isinstance(readiness.get("requiredCount"), int)
        and readiness.get("requiredCount", 0) >= 1
        and isinstance(readiness.get("blockingCount"), int)
        and isinstance(readiness.get("optionalGapCount"), int)
        and isinstance(blocking_checks, list)
        and isinstance(optional_gaps, list)
        and isinstance(optional_gap_details, list)
        and isinstance(required_check_ids, list)
        and isinstance(optional_check_ids, list)
        and isinstance(check_status_by_id, dict)
        and isinstance(check_required_by_id, dict)
        and isinstance(checks, list)
        and len(checks) >= 2
        and isinstance(check_count_by_status, dict)
        and isinstance(required_check_count_by_status, dict)
        and isinstance(optional_check_count_by_status, dict)
        and all(
            isinstance(check_count_by_status.get(key), int) for key in count_status_keys
        )
        and all(
            isinstance(required_check_count_by_status.get(key), int)
            for key in count_status_keys
        )
        and all(
            isinstance(optional_check_count_by_status.get(key), int)
            for key in count_status_keys
        )
        and check_count_total == len(checks)
        and required_check_count_total == len(required_check_ids)
        and optional_check_count_total == len(optional_check_ids)
        and "agent-development" in required_check_ids
        and "check-capture" in optional_check_ids
        and isinstance(agent_development, dict)
        and agent_development.get("required") is True
        and check_status_by_id.get("agent-development")
        == agent_development.get("status")
        and check_required_by_id.get("agent-development") is True
        and isinstance(agent_development.get("summary"), str)
        and isinstance(check_capture, dict)
        and check_capture.get("required") is False
        and check_status_by_id.get("check-capture") == check_capture.get("status")
        and check_required_by_id.get("check-capture") is False
        and isinstance(check_capture.get("summary"), str)
        and (
            (
                expect_check_capture_gap
                and check_capture.get("status") == "info"
                and "check-capture" in optional_gaps
                and check_capture_detail_valid
                and readiness.get("optionalGapCount", 0) >= 1
            )
            or (
                not expect_check_capture_gap
                and check_capture.get("status") == "pass"
                and "check-capture" not in optional_gaps
                and optional_gap_details == []
            )
        ),
        context=context,
        cmd=cmd,
        message="learn agent backlog JSON should include signal readiness summary with optional gap details, check index, and status count index",
    )
