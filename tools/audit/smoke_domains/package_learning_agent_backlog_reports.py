from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd
from smoke_domains.package_learning_agent_backlog import assert_agent_backlog_readiness_json


EXPECTED_AGENT_BACKLOG_REFRESH_ONLY_RUNBOOK_REASON = (
    "Optional refresh command is available as status metadata; "
    "no executable backlog handoff command is selected."
)
EXPECTED_AGENT_BACKLOG_NO_COMMAND_HANDOFF_REASON = (
    "No handoff command is required; optional refresh command remains available as status metadata."
)
EXPECTED_AGENT_BACKLOG_EMPTY_QUEUE_ALIGNMENT_REASON = (
    "Operator runbook exposes an optional refresh command while the safety-ordered execution queue is empty."
)


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_agent_backlog_no_command_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse no-command learn agent backlog JSON") from error

    counts = payload.get("counts")
    action_plan = payload.get("actionPlan")
    execution_queue = action_plan.get("executionQueue") if isinstance(action_plan, dict) else None
    next_command_selection = execution_queue.get("nextCommandSelection") if isinstance(execution_queue, dict) else None
    next_command_alignment = execution_queue.get("nextCommandAlignment") if isinstance(execution_queue, dict) else None
    operator_handoff = execution_queue.get("operatorHandoff") if isinstance(execution_queue, dict) else None
    operator_handoff_state = operator_handoff.get("state") if isinstance(operator_handoff, dict) else None
    operator_runbook = execution_queue.get("operatorRunbook") if isinstance(execution_queue, dict) else None
    operator_next_command_selection = operator_runbook.get("nextCommandSelection") if isinstance(operator_runbook, dict) else None
    command_effect_review = execution_queue.get("commandEffectReview") if isinstance(execution_queue, dict) else None
    gate_phase_summary = command_effect_review.get("gatePhaseSummary") if isinstance(command_effect_review, dict) else None
    gate_runbook = command_effect_review.get("gateRunbook") if isinstance(command_effect_review, dict) else None

    require_package_smoke(
        payload.get("version") == 1
        and payload.get("status") == "pass"
        and payload.get("signalStatus") == "pass"
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path),
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should report passing status and paths",
    )
    require_package_smoke(
        isinstance(counts, dict)
        and counts.get("actions") == 0
        and counts.get("checkCaptures") == 0
        and counts.get("usageEvents", 0) >= 1
        and counts.get("evalSignals", 0) >= 1,
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should report an empty focused backlog",
    )
    require_package_smoke(
        payload.get("actions") == []
        and isinstance(action_plan, dict)
        and action_plan.get("stepCount") == 0
        and action_plan.get("nextStep") is None
        and action_plan.get("steps") == []
        and isinstance(execution_queue, dict)
        and execution_queue.get("orderedCount") == 0
        and execution_queue.get("commandManifestCount") == 0
        and execution_queue.get("previewCount") == 0
        and execution_queue.get("fileWriteReviewCount") == 0
        and execution_queue.get("mutationReviewCount") == 0
        and execution_queue.get("nextCommand") == ""
        and execution_queue.get("nextCommandArgs") == []
        and execution_queue.get("nextCommandRunPolicy") == "",
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should keep the execution queue empty",
    )
    require_package_smoke(
        isinstance(next_command_selection, dict)
        and next_command_selection.get("reason") == "No command-bearing backlog action is available."
        and isinstance(next_command_alignment, dict)
        and next_command_alignment.get("operatorStage") == "refresh"
        and next_command_alignment.get("queueCommand") == ""
        and next_command_alignment.get("reason") == EXPECTED_AGENT_BACKLOG_EMPTY_QUEUE_ALIGNMENT_REASON,
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should explain empty queue alignment",
    )
    require_package_smoke(
        isinstance(operator_handoff, dict)
        and operator_handoff.get("decision") == "none"
        and operator_handoff.get("command") == ""
        and operator_handoff.get("commandArgs") == []
        and operator_handoff.get("hasCommand", operator_handoff_state.get("hasCommand") if isinstance(operator_handoff_state, dict) else None) is False
        and operator_handoff.get("refreshCommandRequired") is False
        and operator_handoff.get("reason") == EXPECTED_AGENT_BACKLOG_NO_COMMAND_HANDOFF_REASON
        and isinstance(operator_handoff_state, dict)
        and operator_handoff_state.get("status") == "no-command"
        and operator_handoff_state.get("ready") is True
        and operator_handoff_state.get("complete") is True
        and operator_handoff_state.get("hasCommand") is False
        and operator_handoff_state.get("requiresRefresh") is False,
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should expose completed operator handoff state",
    )
    require_package_smoke(
        isinstance(operator_runbook, dict)
        and operator_runbook.get("stageCount") == 4
        and operator_runbook.get("commandCount") == 1
        and operator_runbook.get("requiredCommandCount") == 0
        and operator_runbook.get("nextStage") == "refresh"
        and operator_runbook.get("nextCommandRequired") is False
        and "learn --agent-backlog" in str(operator_runbook.get("nextCommand", ""))
        and isinstance(operator_next_command_selection, dict)
        and operator_next_command_selection.get("stage") == "refresh"
        and operator_next_command_selection.get("required") is False
        and operator_next_command_selection.get("reason") == EXPECTED_AGENT_BACKLOG_REFRESH_ONLY_RUNBOOK_REASON,
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should preserve optional refresh-only runbook reason",
    )
    require_package_smoke(
        isinstance(command_effect_review, dict)
        and command_effect_review.get("level") == "clear"
        and command_effect_review.get("requiresOperatorReview") is False
        and isinstance(gate_phase_summary, dict)
        and gate_phase_summary.get("count") == 1
        and gate_phase_summary.get("requiredCount") == 0
        and gate_phase_summary.get("optionalCount") == 1
        and gate_phase_summary.get("hasRefresh") is True
        and isinstance(gate_runbook, dict)
        and any(
            isinstance(item, dict)
            and item.get("phase") == "refresh"
            and item.get("required") is False
            and "learn --agent-backlog" in str(item.get("command", ""))
            for item in gate_runbook.get("refresh", [])
        ),
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should keep refresh gate optional",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False,
        context=context,
        cmd=cmd,
        message="no-command learn agent backlog JSON should keep local read-only privacy boundaries",
    )
    assert_agent_backlog_readiness_json(
        payload,
        expect_check_capture_gap=True,
        context=context,
        cmd=cmd,
    )

def assert_agent_backlog_report_human(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    for expected in (
        "Agent development backlog",
        "Signal source:",
        "Backlog actions:",
        "Action plan:",
        "safety summary:",
        "execution queue:",
        "next action:",
        "next command:",
        "next command policy:",
        "queue order:",
        "command manifest:",
        "command effects:",
        "command effect review:",
        "command effect gate phases:",
        "command effect gate runbook:",
        "command effect gates:",
        "operator runbook:",
        "operator next command:",
        "refresh:",
        "safety: read-only",
        "requires mutation review: no",
        "learn --propose-skills",
        "Privacy: agent backlog is read-only",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn agent backlog human output missing {expected!r}",
        )

def assert_agent_backlog_report_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Agent Development Backlog Report",
        f"- Learning file: {profile_path}",
        f"- Usage file: {usage_path}",
        "## Summary",
        "## Signal Readiness",
        "- Required ready:",
        "- Required checks:",
        "- Blocking checks:",
        "- Optional gaps:",
        "Readiness check index:",
        "- Required ids:",
        "- Optional ids:",
        "- Status index:",
        "- Required index:",
        "- Status counts:",
        "- Required status counts:",
        "- Optional status counts:",
        "Readiness checks:",
        "check-capture [optional]",
        "agent-development [required]",
        "## Backlog Actions",
        "design-ai learn --propose-skills",
        "## Action Plan",
        "Safety summary:",
        "- Read-only: 1",
        "- Writes local file: 0",
        "- Mutates local state: 0",
        "Execution queue:",
        "- Preview/read-only commands: 1",
        "- Local file-write review commands: 0",
        "- Local mutation review commands: 0",
        "- Ordered commands: 1",
        "- Command manifest entries: 1",
        "- Command effect targets:",
        "- Command effect review:",
        "- Command effect gate phases:",
        "- Command effect gate runbook:",
        "- Command effect gates:",
        "- Operator runbook:",
        "- Operator next command:",
        "- Operator handoff state:",
        "- Recommended next action: agent-skill-proposal-preview",
        "- Recommended next command policy: preview-only",
        "Recommended next command:",
        "Queue order:",
        "1. agent-skill-proposal-preview (read-only, preview-only)",
        "Command manifest:",
        "1. agent-skill-proposal-preview - preview-only",
        "- Command safety: read-only",
        "- Writes local files: no",
        "- Mutates local state: no",
        "- Requires mutation review: no",
        "design-ai learn --agent-backlog",
        "## Follow-Up Commands",
        "design-ai learn --signals",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
        "This report is read-only evidence",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn agent backlog Markdown report missing {expected!r}",
        )

def assert_agent_backlog_no_command_report_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Agent Development Backlog Report",
        f"- Learning file: {profile_path}",
        f"- Usage file: {usage_path}",
        "## Summary",
        "- Actions: 0",
        "- Check captures: 0",
        "## Signal Readiness",
        "- Required ready: yes",
        "- Required checks:",
        "- Blocking checks: 0",
        "- Optional gaps: 1",
        "Readiness check index:",
        "- Required ids:",
        "- Optional ids:",
        "- Status index:",
        "- Required index:",
        "- Status counts:",
        "- Required status counts:",
        "- Optional status counts:",
        "Readiness checks:",
        "check-capture [optional] info",
        "agent-development [required] pass",
        "Optional gap details:",
        "No real warn/fail check result has been intentionally captured",
        "Next condition: Run `design-ai check <artifact.md> --learn --yes`",
        "Automation policy: Do not emit placeholder mutation commands",
        "## Backlog Actions",
        "No agent development backlog actions emitted.",
        "## Action Plan",
        "Safety summary:",
        "- Read-only: 0",
        "- Writes local file: 0",
        "- Mutates local state: 0",
        "Execution queue:",
        "- Preview/read-only commands: 0",
        "- Local file-write review commands: 0",
        "- Local mutation review commands: 0",
        "- Ordered commands: 0",
        "- Command manifest entries: 0",
        "- Command effect review: No command target or mutation flag exposure detected.",
        "- Operator runbook: 4 stage(s), 1 command(s), 0 required",
        "- Operator next command: refresh: `design-ai learn --agent-backlog",
        "- Operator next command selection: first-command-in-operator-runbook-stage-order",
        "- Recommended next command selection: first-command-in-safety-ordered-queue",
        "- Operator/queue next command alignment: different",
        "- Operator handoff state: no-command; ready yes; can run without review no; refresh optional",
        "- Operator handoff summary: Focused agent backlog is clear; no handoff command is required.",
        "- Operator handoff refresh: design-ai learn --agent-backlog",
        "No execution steps emitted.",
        "## Follow-Up Commands",
        "design-ai learn --signals",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
        "This report is read-only evidence",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"no-command learn agent backlog Markdown report missing {expected!r}",
        )
