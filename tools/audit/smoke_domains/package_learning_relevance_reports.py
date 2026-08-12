from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_learning_usage_report_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn usage JSON") from error

    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn usage JSON should report the learning profile path",
    )
    require_package_smoke(
        payload.get("usageFile") == str(usage_path),
        context=context,
        cmd=cmd,
        message="learn usage JSON should report the usage sidecar path",
    )
    require_package_smoke(
        payload.get("exists") is True,
        context=context,
        cmd=cmd,
        message="learn usage JSON should confirm the usage sidecar exists",
    )
    require_package_smoke(
        payload.get("eventCount") >= 2,
        context=context,
        cmd=cmd,
        message="learn usage JSON should count prompt/pack sidecar events",
    )
    require_package_smoke(
        payload.get("usedEntryCount") == 1 and payload.get("unusedEntryCount") >= 1,
        context=context,
        cmd=cmd,
        message="learn usage JSON should summarize used and unused profile entries",
    )
    command_counts = payload.get("commandCounts")
    require_package_smoke(
        isinstance(command_counts, dict)
        and command_counts.get("prompt") >= 1
        and command_counts.get("pack") >= 1,
        context=context,
        cmd=cmd,
        message="learn usage JSON should summarize prompt and pack command counts",
    )
    selected_counts = payload.get("selectedEntryCounts")
    require_package_smoke(
        isinstance(selected_counts, dict)
        and selected_counts.get("learn-relevant") >= 2,
        context=context,
        cmd=cmd,
        message="learn usage JSON should count selected learning entry ids",
    )
    latest_event = payload.get("latestEvent")
    require_package_smoke(
        isinstance(latest_event, dict)
        and isinstance(latest_event.get("briefHash"), str)
        and "query" not in latest_event
        and "brief" not in latest_event,
        context=context,
        cmd=cmd,
        message="learn usage report should keep event details privacy-preserving",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict) and privacy.get("storesRawBriefText") is False,
        context=context,
        cmd=cmd,
        message="learn usage JSON should explicitly state that raw brief text is not stored",
    )

def assert_learning_usage_report_human(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    for expected in (
        "Local learning usage report",
        "Usage sidecar:",
        "Events:",
        "Top selected entries:",
        "Recent events:",
        "Privacy: usage events store selected entry ids and a short brief hash",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn usage human output missing {expected!r}",
        )

def assert_learning_signal_report_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    require_agent_status_pass: bool = False,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn signals JSON") from error

    require_package_smoke(
        payload.get("version") == 1,
        context=context,
        cmd=cmd,
        message="learn signals JSON version changed",
    )
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn signals JSON should report the learning profile path",
    )
    learning = payload.get("learning")
    require_package_smoke(
        isinstance(learning, dict)
        and learning.get("count") >= 3
        and isinstance(learning.get("auditSummary"), dict),
        context=context,
        cmd=cmd,
        message="learn signals JSON should include learning profile audit summary",
    )
    usage = payload.get("usage")
    require_package_smoke(
        isinstance(usage, dict)
        and usage.get("usageFile") == str(usage_path)
        and usage.get("eventCount") >= 2,
        context=context,
        cmd=cmd,
        message="learn signals JSON should include usage sidecar summary",
    )
    evals = payload.get("evals")
    eval_files = evals.get("files") if isinstance(evals, dict) else None
    require_package_smoke(
        isinstance(evals, dict)
        and isinstance(eval_files, list)
        and any(isinstance(item, dict) and item.get("kind") == "route-eval" for item in eval_files),
        context=context,
        cmd=cmd,
        message="learn signals JSON should include route eval signal files",
    )
    check_capture = payload.get("checkCapture")
    require_package_smoke(
        isinstance(check_capture, dict)
        and isinstance(check_capture.get("count"), int)
        and isinstance(check_capture.get("latestEntries"), list),
        context=context,
        cmd=cmd,
        message="learn signals JSON should include check capture summary shape",
    )
    workspace = payload.get("workspace")
    require_package_smoke(
        isinstance(workspace, dict)
        and isinstance(workspace.get("nextActionCount"), int),
        context=context,
        cmd=cmd,
        message="learn signals JSON should include workspace readiness summary",
    )
    readiness = payload.get("readiness")
    checks = readiness.get("checks") if isinstance(readiness, dict) else None
    check_count_by_status = readiness.get("checkCountByStatus") if isinstance(readiness, dict) else None
    required_check_count_by_status = readiness.get("requiredCheckCountByStatus") if isinstance(readiness, dict) else None
    optional_check_count_by_status = readiness.get("optionalCheckCountByStatus") if isinstance(readiness, dict) else None
    count_status_keys = ("pass", "info", "warn", "fail", "missing", "template", "unknown")
    require_package_smoke(
        isinstance(readiness, dict)
        and readiness.get("status") == payload.get("status")
        and isinstance(checks, list)
        and isinstance(check_count_by_status, dict)
        and isinstance(required_check_count_by_status, dict)
        and isinstance(optional_check_count_by_status, dict)
        and all(isinstance(check_count_by_status.get(key), int) for key in count_status_keys)
        and all(isinstance(required_check_count_by_status.get(key), int) for key in count_status_keys)
        and all(isinstance(optional_check_count_by_status.get(key), int) for key in count_status_keys)
        and sum(check_count_by_status.get(key, 0) for key in count_status_keys) == len(checks),
        context=context,
        cmd=cmd,
        message="learn signals JSON should include readiness status count index",
    )
    agent_development = payload.get("agentDevelopment")
    agent_actions = agent_development.get("actions") if isinstance(agent_development, dict) else None
    require_package_smoke(
        isinstance(agent_development, dict)
        and isinstance(agent_actions, list)
        and isinstance(agent_development.get("actionCount"), int)
        and agent_development.get("actionCount") == len(agent_actions)
        and any(isinstance(item, dict) and item.get("category") == "skill-evolution" for item in agent_actions),
        context=context,
        cmd=cmd,
        message="learn signals JSON should include agent development backlog actions",
    )
    if require_agent_status_pass:
        require_package_smoke(
            agent_development.get("status") == "pass",
            context=context,
            cmd=cmd,
            message="learn signals JSON should include passing agent development backlog actions",
        )
    agent_privacy = agent_development.get("privacy") if isinstance(agent_development, dict) else None
    require_package_smoke(
        isinstance(agent_privacy, dict)
        and agent_privacy.get("mutatesProfile") is False
        and agent_privacy.get("mutatesSkillFiles") is False
        and agent_privacy.get("callsExternalAiApis") is False,
        context=context,
        cmd=cmd,
        message="learn signals JSON should keep agent development backlog local and preview-only",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("storesRawBriefText") is False,
        context=context,
        cmd=cmd,
        message="learn signals JSON should be read-only and privacy-preserving",
    )

def assert_learning_signal_report_human(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    for expected in (
        "Learning signal registry",
        "Signal source:",
        "Learning audit:",
        "Eval signals:",
        "Workspace readiness:",
        "Agent development backlog:",
        "Privacy: signal registry is read-only",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn signals human output missing {expected!r}",
        )

def assert_learning_signal_report_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Learning Signal Registry Report",
        f"- Learning file: {profile_path}",
        f"- Usage file: {usage_path}",
        "## Readiness Summary",
        "Readiness check index:",
        "- Required ids:",
        "- Optional ids:",
        "- Status index:",
        "- Required index:",
        "- Status counts:",
        "- Required status counts:",
        "- Optional status counts:",
        "## Learning Profile",
        "## Usage Signals",
        "## Eval Signals",
        "## Check Capture",
        "## Workspace Readiness",
        "## Agent Development Backlog",
        "```bash",
        "design-ai learn --propose-skills",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Stores raw brief text: no",
        "This report is read-only evidence",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn signals Markdown report missing {expected!r}",
        )
