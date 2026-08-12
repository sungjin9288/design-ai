from __future__ import annotations

import json

from .site_contracts import (
    EXPECTED_SITE_COUNTS_KEYS,
    EXPECTED_SITE_ISSUE_KEYS,
    EXPECTED_SITE_MCP_PROBE_COUNTS,
    EXPECTED_SITE_NEXT_ACTIONS_COUNTS_KEYS,
    EXPECTED_SITE_NEXT_ACTIONS_PAYLOAD_KEYS,
    EXPECTED_SITE_NEXT_ACTIONS_SITE_KEYS,
    EXPECTED_SITE_NEXT_ACTIONS_TOP_TASK_KEYS,
    EXPECTED_SITE_NEXT_ACTION_COMMAND_KEYS,
    EXPECTED_SITE_NEXT_ACTION_KEYS,
    EXPECTED_SITE_PAYLOAD_KEYS,
    EXPECTED_SITE_PROFILE_KEYS,
    EXPECTED_SITE_TOP_TASK_KEYS,
)

from .assertion_helpers import (
    assert_no_ansi,
    assert_output_write_success,
    assert_smoke_json_keys,
)


def assert_site_bundle_compare_warning_strict_json(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    if returncode != 1:
        raise SystemExit(f"site bundle compare strict after {context} expected exit code 1, got {returncode}")
    assert_no_ansi(raw, cmd)
    payload = json.loads(raw)
    if payload.get("status") != "warn" or payload.get("valid") is not True:
        raise SystemExit(f"site bundle compare strict after {context} expected warning/valid output")
    if payload.get("sameBundle") is not True or payload.get("digestMatch") is not True:
        raise SystemExit(f"site bundle compare strict after {context} expected identical warning bundle identity")
    if payload.get("counts", {}).get("changedFiles") != 0:
        raise SystemExit(f"site bundle compare strict after {context} expected no changed files")
    for side in ("left", "right"):
        report = payload.get(side)
        if not isinstance(report, dict):
            raise SystemExit(f"site bundle compare strict after {context} missing {side} report")
        if report.get("status") != "warn" or report.get("valid") is not True:
            raise SystemExit(f"site bundle compare strict after {context} expected {side} warning/valid bundle")
        if report.get("mcpStatus") != "warn":
            raise SystemExit(f"site bundle compare strict after {context} expected {side} MCP warning status")
        digest = report.get("checksumBundleDigest")
        if not isinstance(digest, str) or len(digest) != 64:
            raise SystemExit(f"site bundle compare strict after {context} {side} bundle digest changed")
    issue_ids = [issue.get("id") for issue in payload.get("issues", [])]
    if "bundle-compare-left-warn" not in issue_ids or "bundle-compare-right-warn" not in issue_ids:
        raise SystemExit(f"site bundle compare strict after {context} missing left/right warning issues: {issue_ids!r}")


def assert_site_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site JSON",
    )
    if payload.get("valid") is not True or payload.get("status") != "pass":
        raise SystemExit(f"site JSON after {context} expected pass-valid summary")
    if not isinstance(payload.get("filePath"), str) or not payload["filePath"]:
        raise SystemExit(f"site JSON after {context} filePath is missing")

    site = assert_smoke_json_keys(
        payload.get("site"),
        EXPECTED_SITE_PROFILE_KEYS,
        label="site",
        context=context,
        command_label="site JSON",
    )
    expected_site = {
        "id": "sample-korean-saas",
        "name": "Korean SaaS marketing site",
        "liveUrl": "https://example.com",
        "repoUrl": "https://github.com/acme/korean-saas-site",
        "localPath": "/Users/you/dev/korean-saas-site",
        "deployProvider": "vercel",
        "cms": "sanity",
        "database": "none",
    }
    for key, expected in expected_site.items():
        if site.get(key) != expected:
            raise SystemExit(f"site JSON after {context} site {key} differs from expected sample workspace")
    if site.get("pages") != ["/", "/pricing", "/signup", "/docs"]:
        raise SystemExit(f"site JSON after {context} pages differ from expected sample workspace")
    if site.get("viewports") != ["desktop", "tablet", "mobile"]:
        raise SystemExit(f"site JSON after {context} viewports differ from expected sample workspace")
    if not isinstance(site.get("userFlows"), list) or len(site["userFlows"]) != 2:
        raise SystemExit(f"site JSON after {context} userFlows differ from expected sample workspace")

    counts = assert_smoke_json_keys(
        payload.get("counts"),
        EXPECTED_SITE_COUNTS_KEYS,
        label="counts",
        context=context,
        command_label="site JSON",
    )
    expected_counts = {
        "pages": 4,
        "userFlows": 2,
        "viewports": 3,
        "auditCategories": 9,
        "auditFindings": 3,
        "refactorTasks": 1,
        "executedWork": 0,
        "verificationResults": 0,
        "remainingRisks": 3,
        "nextActions": 0,
        "requiredMcp": 3,
        "optionalMcp": 6,
        "unavailableMcp": 0,
    }
    for key, expected in expected_counts.items():
        if counts.get(key) != expected:
            raise SystemExit(f"site JSON after {context} count {key} differs from expected sample workspace")

    if payload.get("requiredMcp") != ["github", "browser", "deploy"]:
        raise SystemExit(f"site JSON after {context} requiredMcp differs from expected sample workspace")

    top_tasks = payload.get("topTasks")
    if not isinstance(top_tasks, list) or len(top_tasks) != 1:
        raise SystemExit(f"site JSON after {context} topTasks must contain one sample task")
    top_task = assert_smoke_json_keys(
        top_tasks[0],
        EXPECTED_SITE_TOP_TASK_KEYS,
        label="topTasks entry",
        context=context,
        command_label="site JSON",
    )
    if top_task.get("title") != "Clarify homepage CTA hierarchy" or top_task.get("priority") != "p1":
        raise SystemExit(f"site JSON after {context} top task differs from expected sample workspace")
    if top_task.get("pages") != ["/"]:
        raise SystemExit(f"site JSON after {context} top task pages differ from expected sample workspace")

    issues = payload.get("issues")
    if not isinstance(issues, list) or len(issues) != 1:
        raise SystemExit(f"site JSON after {context} issues must contain one pass issue")
    issue = assert_smoke_json_keys(
        issues[0],
        EXPECTED_SITE_ISSUE_KEYS,
        label="issues entry",
        context=context,
        command_label="site JSON",
    )
    if issue.get("level") != "pass" or issue.get("id") != "workspace-ready":
        raise SystemExit(f"site JSON after {context} pass issue differs from expected workspace-ready issue")


def assert_site_next_actions_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site next-actions JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_NEXT_ACTIONS_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site next-actions JSON",
    )
    if payload.get("kind") != "website-improvement-next-actions" or payload.get("version") != 1:
        raise SystemExit(f"site next-actions JSON after {context} kind/version changed")
    if (
        payload.get("status") != "pass"
        or payload.get("workspaceStatus") != "pass"
        or payload.get("mcpStatus") != "pass"
        or payload.get("mcpProbeStatus") != "pass"
    ):
        raise SystemExit(f"site next-actions JSON after {context} expected pass status fields")
    if not isinstance(payload.get("filePath"), str) or not payload["filePath"]:
        raise SystemExit(f"site next-actions JSON after {context} filePath is missing")
    if payload.get("externalCalls") is not False or payload.get("targetRepoMutation") is not False:
        raise SystemExit(f"site next-actions JSON after {context} boundary flags must remain false")
    if payload.get("mcpProbeCounts") != EXPECTED_SITE_MCP_PROBE_COUNTS:
        raise SystemExit(f"site next-actions JSON after {context} MCP probe counts changed: {payload.get('mcpProbeCounts')!r}")

    site = assert_smoke_json_keys(
        payload.get("site"),
        EXPECTED_SITE_NEXT_ACTIONS_SITE_KEYS,
        label="site",
        context=context,
        command_label="site next-actions JSON",
    )
    if site.get("name") != "Korean SaaS marketing site" or site.get("liveUrl") != "https://example.com":
        raise SystemExit(f"site next-actions JSON after {context} site summary changed")
    if site.get("repoUrl") != "https://github.com/acme/korean-saas-site":
        raise SystemExit(f"site next-actions JSON after {context} repo URL changed")

    counts = assert_smoke_json_keys(
        payload.get("counts"),
        EXPECTED_SITE_NEXT_ACTIONS_COUNTS_KEYS,
        label="counts",
        context=context,
        command_label="site next-actions JSON",
    )
    expected_counts = {
        "actions": 3,
        "blocking": 0,
        "warnings": 0,
        "tasks": 1,
        "requiredMcpMissing": 0,
        "taskGaps": 0,
        "probeGaps": 0,
    }
    for key, expected in expected_counts.items():
        if counts.get(key) != expected:
            raise SystemExit(f"site next-actions JSON after {context} count {key} differs from expected sample workspace")

    top_tasks = payload.get("topTasks")
    if not isinstance(top_tasks, list) or len(top_tasks) != 1:
        raise SystemExit(f"site next-actions JSON after {context} topTasks must contain one sample task")
    top_task = assert_smoke_json_keys(
        top_tasks[0],
        EXPECTED_SITE_NEXT_ACTIONS_TOP_TASK_KEYS,
        label="topTasks entry",
        context=context,
        command_label="site next-actions JSON",
    )
    if top_task.get("id") != "task-homepage-cta" or top_task.get("priority") != "p1":
        raise SystemExit(f"site next-actions JSON after {context} top task changed")

    actions = payload.get("actions")
    if not isinstance(actions, list) or len(actions) != 3:
        raise SystemExit(f"site next-actions JSON after {context} actions must contain three operator actions")
    expected_severities = ["implementation", "handoff", "handoff"]
    expected_commands = [
        "--prompt codex-implementation --task 1 --out codex-implementation.md",
        "--report --out website-handoff.md",
        "--bundle --out website-handoff-bundle",
    ]
    for index, action in enumerate(actions):
        action = assert_smoke_json_keys(
            action,
            EXPECTED_SITE_NEXT_ACTION_KEYS,
            label="actions entry",
            context=context,
            command_label="site next-actions JSON",
        )
        if action.get("rank") != index + 1 or action.get("severity") != expected_severities[index]:
            raise SystemExit(f"site next-actions JSON after {context} action ranking changed")
        command = action.get("command")
        if not isinstance(command, str) or expected_commands[index] not in command:
            raise SystemExit(f"site next-actions JSON after {context} action command changed: {command!r}")
        if not isinstance(action.get("references"), list) or not action["references"]:
            raise SystemExit(f"site next-actions JSON after {context} action references missing")

    commands = assert_smoke_json_keys(
        payload.get("commands"),
        EXPECTED_SITE_NEXT_ACTION_COMMAND_KEYS,
        label="commands",
        context=context,
        command_label="site next-actions JSON",
    )
    if "--mcp-check --strict --json" not in commands.get("mcpCheck", ""):
        raise SystemExit(f"site next-actions JSON after {context} mcpCheck command changed")
    if "--mcp-check --probes --json --out mcp-check-probes.json" not in commands.get("mcpCheckProbes", ""):
        raise SystemExit(f"site next-actions JSON after {context} mcpCheckProbes command changed")
    if "--mcp-plan --probes --json --out mcp-action-plan-probes.json" not in commands.get("mcpPlanProbes", ""):
        raise SystemExit(f"site next-actions JSON after {context} mcpPlanProbes command changed")
    if "--tasks --out website-workspace.tasks.json" not in commands.get("tasks", ""):
        raise SystemExit(f"site next-actions JSON after {context} tasks command changed")
    if "--prompt codex-implementation --task 1" not in commands.get("implementationPrompt", ""):
        raise SystemExit(f"site next-actions JSON after {context} implementation prompt command changed")
    if "--bundle --out website-handoff-bundle" not in commands.get("handoffBundle", ""):
        raise SystemExit(f"site next-actions JSON after {context} handoff bundle command changed")

    boundaries = payload.get("boundaries")
    if not isinstance(boundaries, list) or len(boundaries) < 3:
        raise SystemExit(f"site next-actions JSON after {context} boundaries missing")
    boundary_text = "\n".join(str(item) for item in boundaries)
    for fragment in ("deterministic and local", "does not call external MCPs", "mutate the target website repo"):
        if fragment not in boundary_text:
            raise SystemExit(f"site next-actions JSON after {context} boundary guidance missing {fragment!r}")


def assert_site_next_actions_json_file_output(
    raw_stdout: str,
    file_contents: str,
    *,
    output_path: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_output_write_success(raw_stdout, context=context, cmd=cmd, expected_path=output_path)
    assert_site_next_actions_json(
        file_contents,
        context=f"{context} out file",
        cmd=cmd,
    )


def assert_site_next_actions_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    required_fragments = (
        "Website Improvement next actions: Korean SaaS marketing site",
        "Status: pass",
        "Workspace status: pass",
        "MCP status: pass",
        "MCP probe status: pass",
        "MCP probes: 4/4 passing, 0 warning, 0 failing",
        "Actions: 3 (0 blocking, 0 warning)",
        "Prioritized actions:",
        "1. [implementation] Prepare Codex implementation prompt for task-homepage-cta",
        "Create implementation evidence trail",
        "Export portable handoff bundle",
        "Command: `design-ai site",
        "--prompt codex-implementation --task 1 --out codex-implementation.md",
        "--report --out website-handoff.md",
        "--bundle --out website-handoff-bundle",
        "Boundaries:",
        "deterministic and local",
        "does not call external MCPs",
        "mutate the target website repo",
    )
    missing = [fragment for fragment in required_fragments if fragment not in raw]
    if missing:
        raise SystemExit(f"site next-actions human after {context} missing fragment: {missing[0]!r}")
    if '"kind": "website-improvement-next-actions"' in raw:
        raise SystemExit(f"site next-actions human after {context} unexpectedly emitted JSON")


def assert_site_next_actions_human_file_output(
    raw_stdout: str,
    file_contents: str,
    *,
    output_path: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_output_write_success(raw_stdout, context=context, cmd=cmd, expected_path=output_path)
    assert_site_next_actions_human(
        file_contents,
        context=f"{context} out file",
        cmd=cmd,
    )
