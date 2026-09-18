from __future__ import annotations

import json

from .site_contracts import (
    EXPECTED_SITE_MCP_ACTION_PLAN_COMMAND_KEYS,
    EXPECTED_SITE_MCP_ACTION_PLAN_PAYLOAD_KEYS,
    EXPECTED_SITE_MCP_ACTION_PLAN_TASK_KEYS,
    EXPECTED_SITE_MCP_CHECK_COUNTS_KEYS,
    EXPECTED_SITE_MCP_CHECK_ITEM_KEYS,
    EXPECTED_SITE_MCP_CHECK_SITE_KEYS,
    EXPECTED_SITE_MCP_PROBES_KEYS,
    EXPECTED_SITE_MCP_PROBE_ITEM_KEYS,
)

from .assertion_helpers import (
    assert_contains_fragments,
    assert_no_ansi,
    assert_output_write_success,
    assert_smoke_json_keys,
)

from .site_assertions_mcp import assert_site_mcp_check_json


def assert_site_mcp_plan_markdown(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    stripped = raw.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        raise SystemExit(f"site mcp-plan markdown after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        (
            "# Website improvement MCP action plan: Korean SaaS marketing site",
            "## Readiness Matrix",
            "| GitHub | required | ready | pass |",
            "## Blocking Items",
            "No blocking readiness issues.",
            "## Task/MCP Alignment",
            "task-homepage-cta",
            "## Execution Sequence",
            "design-ai site <workspace.json> --mcp-check --strict --json",
            "does not call external MCPs, mutate the target website repo",
        ),
        context=context,
        label="site mcp-plan markdown",
    )


def assert_site_mcp_plan_probes_markdown(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_site_mcp_plan_markdown(raw, context=context, cmd=cmd)

    assert_contains_fragments(
        raw,
        (
            "## Read-Only Probes",
            "- Probe status: pass",
            "- Mode: read-only-local",
            "- External calls: no",
            "| Probe | MCP | Level | Result | Evidence | Next Action |",
            "| GitHub repo reference | github | pass | pass |",
            "| Figma file reference | figma | pass | pass |",
            "| Browser smoke target | browser | pass | pass |",
            "| Deployment provider reference | deploy | pass | pass |",
        ),
        context=context,
        label="site mcp-plan probes markdown",
    )


def assert_site_mcp_plan_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site mcp-plan JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_MCP_ACTION_PLAN_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site mcp-plan JSON",
    )
    if payload.get("kind") != "website-improvement-mcp-action-plan" or payload.get("version") != 1:
        raise SystemExit(f"site mcp-plan JSON after {context} action plan identity changed")
    if payload.get("status") != "pass" or payload.get("workspaceStatus") != "pass":
        raise SystemExit(f"site mcp-plan JSON after {context} should pass for the sample workspace")
    if payload.get("externalCalls") is not False or payload.get("targetRepoMutation") is not False:
        raise SystemExit(f"site mcp-plan JSON after {context} must remain local/read-only")

    site = assert_smoke_json_keys(
        payload.get("site"),
        EXPECTED_SITE_MCP_CHECK_SITE_KEYS,
        label="site",
        context=context,
        command_label="site mcp-plan JSON",
    )
    if site.get("name") != "Korean SaaS marketing site" or site.get("liveUrl") != "https://example.com":
        raise SystemExit(f"site mcp-plan JSON after {context} sample site identity changed")

    counts = assert_smoke_json_keys(
        payload.get("counts"),
        EXPECTED_SITE_MCP_CHECK_COUNTS_KEYS,
        label="counts",
        context=context,
        command_label="site mcp-plan JSON",
    )
    if counts.get("ready") != 9 or counts.get("missing") != 0 or counts.get("taskGaps") != 0:
        raise SystemExit(f"site mcp-plan JSON after {context} readiness counts changed")

    matrix = payload.get("readinessMatrix")
    if not isinstance(matrix, list) or len(matrix) != 10:
        raise SystemExit(f"site mcp-plan JSON after {context} should include ten readiness rows")
    for item in matrix:
        checked = assert_smoke_json_keys(
            item,
            EXPECTED_SITE_MCP_CHECK_ITEM_KEYS,
            label="readinessMatrix entry",
            context=context,
            command_label="site mcp-plan JSON",
        )
        if checked.get("level") != "pass":
            raise SystemExit(f"site mcp-plan JSON after {context} sample readiness row should pass: {checked.get('key')}")

    probes_value = payload.get("probes")
    if probes_value is not None and not isinstance(probes_value, dict):
        raise SystemExit(f"site mcp-plan JSON after {context} probes must be null or an object")
    for key in ("blockingItems", "warnings", "taskGaps", "workspaceIssues", "nextActions"):
        if not isinstance(payload.get(key), list) or payload[key]:
            raise SystemExit(f"site mcp-plan JSON after {context} sample {key} should be an empty array")

    tasks = payload.get("taskAlignment")
    if not isinstance(tasks, list) or not tasks:
        raise SystemExit(f"site mcp-plan JSON after {context} should include sample task alignment rows")
    first_task = assert_smoke_json_keys(
        tasks[0],
        EXPECTED_SITE_MCP_ACTION_PLAN_TASK_KEYS,
        label="taskAlignment entry",
        context=context,
        command_label="site mcp-plan JSON",
    )
    if first_task.get("task") != "task-homepage-cta" or "browser: ready" not in str(first_task.get("readinessState")):
        raise SystemExit(f"site mcp-plan JSON after {context} top task alignment changed")

    commands = assert_smoke_json_keys(
        payload.get("commands"),
        EXPECTED_SITE_MCP_ACTION_PLAN_COMMAND_KEYS,
        label="commands",
        context=context,
        command_label="site mcp-plan JSON",
    )
    if commands.get("mcpCheck") != "design-ai site <workspace.json> --mcp-check --strict --json":
        raise SystemExit(f"site mcp-plan JSON after {context} strict mcp-check command changed")
    if commands.get("mcpCheckProbesHumanOut") != "design-ai site <workspace.json> --mcp-check --probes --out mcp-check-probes.txt":
        raise SystemExit(f"site mcp-plan JSON after {context} mcp-check probe human output command changed")
    if commands.get("mcpCheckProbesJsonOut") != "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json":
        raise SystemExit(f"site mcp-plan JSON after {context} mcp-check probe output command changed")
    if commands.get("mcpPlanProbesJsonOut") != "design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json":
        raise SystemExit(f"site mcp-plan JSON after {context} mcp-plan probe output command changed")
    if not isinstance(payload.get("executionSequence"), list) or len(payload["executionSequence"]) != 5:
        raise SystemExit(f"site mcp-plan JSON after {context} execution sequence changed")
    boundaries = payload.get("boundaries")
    if not isinstance(boundaries, list) or not any("does not call external MCPs" in item for item in boundaries):
        raise SystemExit(f"site mcp-plan JSON after {context} boundary guidance changed")


def assert_site_mcp_plan_probes_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_site_mcp_plan_json(raw, context=context, cmd=cmd)
    payload = json.loads(raw)
    probes = assert_smoke_json_keys(
        payload.get("probes"),
        EXPECTED_SITE_MCP_PROBES_KEYS,
        label="probes",
        context=context,
        command_label="site mcp-plan probes JSON",
    )
    if probes.get("externalCalls") is not False or probes.get("mode") != "read-only-local":
        raise SystemExit(f"site mcp-plan probes JSON after {context} probe mode changed")
    if probes.get("status") != "pass" or probes.get("count") != 4 or probes.get("pass") != 4:
        raise SystemExit(f"site mcp-plan probes JSON after {context} sample probes should pass")
    items = probes.get("items")
    if not isinstance(items, list) or len(items) != 4:
        raise SystemExit(f"site mcp-plan probes JSON after {context} should include four probe rows")
    for item in items:
        checked = assert_smoke_json_keys(
            item,
            EXPECTED_SITE_MCP_PROBE_ITEM_KEYS,
            label="probes item",
            context=context,
            command_label="site mcp-plan probes JSON",
        )
        if checked.get("level") != "pass" or checked.get("passed") is not True:
            raise SystemExit(f"site mcp-plan probes JSON after {context} sample probe should pass: {checked.get('id')}")


def assert_site_mcp_plan_probes_json_file_output(
    raw_stdout: str,
    file_contents: str,
    *,
    output_path: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_output_write_success(raw_stdout, context=context, cmd=cmd, expected_path=output_path)
    assert_site_mcp_plan_probes_json(
        file_contents,
        context=f"{context} out file",
        cmd=cmd,
    )
