from __future__ import annotations

import json

from .site_contracts import (
    EXPECTED_SITE_MCP_CHECK_COUNTS_KEYS,
    EXPECTED_SITE_MCP_CHECK_ITEM_KEYS,
    EXPECTED_SITE_MCP_CHECK_PAYLOAD_KEYS,
    EXPECTED_SITE_MCP_CHECK_PROBES_PAYLOAD_KEYS,
    EXPECTED_SITE_MCP_CHECK_PROBE_COMMAND_KEYS,
    EXPECTED_SITE_MCP_CHECK_SITE_KEYS,
    EXPECTED_SITE_MCP_PROBES_KEYS,
    EXPECTED_SITE_MCP_PROBE_ITEM_KEYS,
)

from .assertion_helpers import (
    assert_no_ansi,
    assert_output_write_success,
    assert_smoke_json_keys,
)


def assert_site_mcp_check_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site mcp-check JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_MCP_CHECK_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site mcp-check JSON",
    )
    if payload.get("status") != "pass" or payload.get("workspaceStatus") != "pass":
        raise SystemExit(f"site mcp-check JSON after {context} should pass for the sample workspace")

    site = assert_smoke_json_keys(
        payload.get("site"),
        EXPECTED_SITE_MCP_CHECK_SITE_KEYS,
        label="site",
        context=context,
        command_label="site mcp-check JSON",
    )
    if site.get("name") != "Korean SaaS marketing site" or site.get("liveUrl") != "https://example.com":
        raise SystemExit(f"site mcp-check JSON after {context} sample site identity changed")

    counts = assert_smoke_json_keys(
        payload.get("counts"),
        EXPECTED_SITE_MCP_CHECK_COUNTS_KEYS,
        label="counts",
        context=context,
        command_label="site mcp-check JSON",
    )
    expected_counts = {
        "total": 10,
        "required": 3,
        "optional": 6,
        "ready": 9,
        "missing": 0,
        "unused": 1,
        "unavailable": 0,
        "taskGaps": 0,
    }
    for key, value in expected_counts.items():
        if counts.get(key) != value:
            raise SystemExit(f"site mcp-check JSON after {context} count {key} changed")

    items = payload.get("items")
    if not isinstance(items, list) or len(items) != 10:
        raise SystemExit(f"site mcp-check JSON after {context} should include ten MCP items")
    item_keys = []
    for item in items:
        checked = assert_smoke_json_keys(
            item,
            EXPECTED_SITE_MCP_CHECK_ITEM_KEYS,
            label="items entry",
            context=context,
            command_label="site mcp-check JSON",
        )
        item_keys.append(checked.get("key"))
        if checked.get("level") != "pass":
            raise SystemExit(f"site mcp-check JSON after {context} sample item should pass: {checked.get('key')}")
        if not isinstance(checked.get("evidence"), list) or not isinstance(checked.get("actions"), list):
            raise SystemExit(f"site mcp-check JSON after {context} item evidence/actions must be arrays")

    if item_keys != [key for key, _label in (
        ("github", "GitHub"),
        ("figma", "Figma"),
        ("browser", "Browser/Playwright"),
        ("chromeDevtools", "Chrome DevTools"),
        ("deploy", "Deploy"),
        ("sentry", "Sentry"),
        ("database", "Database"),
        ("cms", "CMS"),
        ("collaboration", "Collaboration"),
        ("research", "Research"),
    )]:
        raise SystemExit(f"site mcp-check JSON after {context} MCP item order changed")

    if not isinstance(payload.get("taskGaps"), list) or payload["taskGaps"]:
        raise SystemExit(f"site mcp-check JSON after {context} should not report sample task gaps")
    if not isinstance(payload.get("workspaceIssues"), list) or payload["workspaceIssues"]:
        raise SystemExit(f"site mcp-check JSON after {context} should not report sample workspace issues")
    if not isinstance(payload.get("nextActions"), list):
        raise SystemExit(f"site mcp-check JSON after {context} nextActions must be an array")


def assert_site_mcp_check_probes_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site mcp-check probes JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_MCP_CHECK_PROBES_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site mcp-check probes JSON",
    )
    base_payload = dict(payload)
    probes = base_payload.pop("probes")
    commands = base_payload.pop("commands")
    assert_site_mcp_check_json(json.dumps(base_payload), context=context, cmd=cmd)

    commands = assert_smoke_json_keys(
        commands,
        EXPECTED_SITE_MCP_CHECK_PROBE_COMMAND_KEYS,
        label="commands",
        context=context,
        command_label="site mcp-check probes JSON",
    )
    if commands.get("mcpCheckProbesHumanOut") != "design-ai site <workspace.json> --mcp-check --probes --out mcp-check-probes.txt":
        raise SystemExit(f"site mcp-check probes JSON after {context} mcp-check probe human output command changed")
    if commands.get("mcpCheckProbesJsonOut") != "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json":
        raise SystemExit(f"site mcp-check probes JSON after {context} mcp-check probe output command changed")
    if commands.get("mcpPlanProbesJson") != "design-ai site <workspace.json> --mcp-plan --probes --json":
        raise SystemExit(f"site mcp-check probes JSON after {context} mcp-plan probe JSON command changed")
    if commands.get("mcpPlanProbesJsonOut") != "design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json":
        raise SystemExit(f"site mcp-check probes JSON after {context} mcp-plan probe output command changed")

    probes = assert_smoke_json_keys(
        probes,
        EXPECTED_SITE_MCP_PROBES_KEYS,
        label="probes",
        context=context,
        command_label="site mcp-check probes JSON",
    )
    if probes.get("enabled") is not True or probes.get("mode") != "read-only-local":
        raise SystemExit(f"site mcp-check probes JSON after {context} probe mode changed")
    if probes.get("externalCalls") is not False:
        raise SystemExit(f"site mcp-check probes JSON after {context} must remain read-only without external calls")
    if probes.get("status") != "pass" or probes.get("count") != 4 or probes.get("pass") != 4:
        raise SystemExit(f"site mcp-check probes JSON after {context} sample probes should pass")
    if probes.get("warn") != 0 or probes.get("fail") != 0:
        raise SystemExit(f"site mcp-check probes JSON after {context} sample probes should not warn or fail")

    items = probes.get("items")
    if not isinstance(items, list) or len(items) != 4:
        raise SystemExit(f"site mcp-check probes JSON after {context} should include four probe items")
    expected_ids = [
        "github-repo-reference",
        "figma-url-reference",
        "browser-smoke-target",
        "deploy-provider-reference",
    ]
    checked_ids = []
    for item in items:
        checked = assert_smoke_json_keys(
            item,
            EXPECTED_SITE_MCP_PROBE_ITEM_KEYS,
            label="probes item",
            context=context,
            command_label="site mcp-check probes JSON",
        )
        checked_ids.append(checked.get("id"))
        if checked.get("level") != "pass" or checked.get("passed") is not True:
            raise SystemExit(f"site mcp-check probes JSON after {context} sample probe should pass: {checked.get('id')}")
        if not isinstance(checked.get("evidence"), list) or not checked.get("evidence"):
            raise SystemExit(f"site mcp-check probes JSON after {context} probe evidence is missing")
        if not isinstance(checked.get("actions"), list):
            raise SystemExit(f"site mcp-check probes JSON after {context} probe actions must be an array")
    if checked_ids != expected_ids:
        raise SystemExit(f"site mcp-check probes JSON after {context} probe item order changed")


def assert_site_mcp_check_probes_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    required_fragments = [
        "Website Improvement MCP readiness: Korean SaaS marketing site",
        "Status: pass",
        "Workspace status: pass",
        "MCP checks:",
        "- [pass] GitHub (required) -> ready",
        "Task MCP gaps:\n- none",
        "Read-only probes:",
        "Mode: read-only-local; external calls: no; status: pass",
        "- [pass] GitHub repo reference (required) -> pass",
        "- [pass] Browser smoke target (required) -> pass",
        "Probe commands:",
        "- Save readiness probe report: `design-ai site <workspace.json> --mcp-check --probes --out mcp-check-probes.txt`",
        "- Save readiness probe JSON: `design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json`",
        "- Generate probe action plan JSON: `design-ai site <workspace.json> --mcp-plan --probes --json`",
        "- Save probe action plan JSON: `design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json`",
        "Next actions:\n- none",
    ]
    for fragment in required_fragments:
        if fragment not in raw:
            raise SystemExit(f"site mcp-check probes human after {context} missing fragment: {fragment}")

    if "--json --json" in raw:
        raise SystemExit(f"site mcp-check probes human after {context} includes duplicated JSON flags")


def assert_site_mcp_check_probes_human_file_output(
    raw_stdout: str,
    file_contents: str,
    *,
    output_path: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_output_write_success(raw_stdout, context=context, cmd=cmd, expected_path=output_path)
    assert_site_mcp_check_probes_human(
        file_contents,
        context=f"{context} out file",
        cmd=cmd,
    )


def assert_site_mcp_check_probes_json_file_output(
    raw_stdout: str,
    file_contents: str,
    *,
    output_path: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_output_write_success(raw_stdout, context=context, cmd=cmd, expected_path=output_path)
    assert_site_mcp_check_probes_json(
        file_contents,
        context=f"{context} out file",
        cmd=cmd,
    )
