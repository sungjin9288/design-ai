"""Website Console command and payload validators."""
from __future__ import annotations

import shlex
from pathlib import Path

from smoke_domains.site_contracts import (
    EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS,
    EXPECTED_SITE_BUNDLE_MCP_PROBE_ITEM_KEYS,
    EXPECTED_SITE_BUNDLE_MCP_PROBES_KEYS,
    EXPECTED_SITE_MCP_PROBE_COUNTS,
)


def site_guidance_command(guidance_command: str, reference_cmd: list[str], *, context: str) -> list[str]:
    tokens = shlex.split(guidance_command)
    if len(tokens) < 2 or tokens[0] != "design-ai" or tokens[1] != "site":
        raise SystemExit(f"{context} guidance command is not a design-ai site command: {guidance_command!r}")
    try:
        site_index = reference_cmd.index("site")
    except ValueError as error:
        raise SystemExit(f"{context} reference command does not include site: {reference_cmd!r}") from error
    return [*reference_cmd[:site_index], *tokens[1:]]


def site_mcp_probe_embedded_command(
    payload: object,
    command_key: str,
    reference_cmd: list[str],
    *,
    context: str,
    output_path: Path | str | None = None,
) -> list[str]:
    if not isinstance(payload, dict):
        raise SystemExit(f"{context} MCP probe payload is not an object")
    commands = payload.get("commands")
    if not isinstance(commands, dict):
        raise SystemExit(f"{context} MCP probe payload missing commands")
    command = commands.get(command_key)
    if not isinstance(command, str):
        raise SystemExit(f"{context} MCP probe command missing or invalid: {command_key}")

    expected_tails = {
        "mcpCheckProbesHumanOut": ["--mcp-check", "--probes", "--out", "mcp-check-probes.txt"],
        "mcpCheckProbesJsonOut": ["--mcp-check", "--probes", "--json", "--out", "mcp-check-probes.json"],
        "mcpPlanProbesJson": ["--mcp-plan", "--probes", "--json"],
        "mcpPlanProbesJsonOut": ["--mcp-plan", "--probes", "--json", "--out", "mcp-action-plan-probes.json"],
    }
    expected_tail = expected_tails.get(command_key)
    if expected_tail is None:
        raise SystemExit(f"{context} unsupported MCP probe command key: {command_key}")

    tokens = shlex.split(command)
    if tokens[:3] != ["design-ai", "site", "<workspace.json>"] or tokens[3:] != expected_tail:
        raise SystemExit(f"{context} MCP probe command changed: {command!r}")

    try:
        site_index = reference_cmd.index("site")
    except ValueError as error:
        raise SystemExit(f"{context} reference command does not include site: {reference_cmd!r}") from error

    site_args = ["site", "--stdin", *tokens[3:]]
    if "--out" in site_args:
        if output_path is None:
            raise SystemExit(f"{context} output path is required for embedded command: {command_key}")
        out_index = site_args.index("--out")
        site_args[out_index + 1] = str(output_path)
        if "--force" not in site_args:
            site_args.append("--force")
    elif output_path is not None:
        raise SystemExit(f"{context} output path is only valid for --out embedded commands: {command_key}")

    return [*reference_cmd[:site_index], *site_args]


def guidance_out_path(guidance_command: str, *, context: str) -> Path:
    tokens = shlex.split(guidance_command)
    try:
        out_index = tokens.index("--out")
    except ValueError as error:
        raise SystemExit(f"{context} guidance command missing --out: {guidance_command!r}") from error
    if out_index + 1 >= len(tokens):
        raise SystemExit(f"{context} guidance command has no --out path: {guidance_command!r}")
    return Path(tokens[out_index + 1])


def assert_site_repair_guidance_report_contract(
    guidance: object,
    *,
    bundle_dir: Path,
    context: str,
) -> tuple[str, str, Path, Path]:
    if not isinstance(guidance, dict) or guidance.get("available") is not True:
        raise SystemExit(f"site bundle repair preview after {context} guidance missing")
    if guidance.get("targetRepoMutation") is not False or guidance.get("externalCalls") is not False:
        raise SystemExit(f"site bundle repair preview after {context} boundary flags changed")

    apply_command = guidance.get("applyCommand")
    if not isinstance(apply_command, str) or "--bundle-repair --yes --json" not in apply_command:
        raise SystemExit(f"site bundle repair preview after {context} apply command changed: {apply_command!r}")

    preview_report_command = guidance.get("previewReportCommand")
    if (
        not isinstance(preview_report_command, str)
        or "--bundle-repair --json --out " not in preview_report_command
        or "repair-preview.json" not in preview_report_command
    ):
        raise SystemExit(
            f"site bundle repair preview after {context} preview report command changed: {preview_report_command!r}"
        )

    apply_report_command = guidance.get("applyReportCommand")
    if (
        not isinstance(apply_report_command, str)
        or "--bundle-repair --yes --json --out " not in apply_report_command
        or "repair-applied.json" not in apply_report_command
    ):
        raise SystemExit(
            f"site bundle repair apply after {context} apply report command changed: {apply_report_command!r}"
        )

    preview_out = guidance_out_path(preview_report_command, context=f"{context} preview report")
    expected_preview_out = bundle_dir.parent / f"{bundle_dir.name}-repair-preview.json"
    if preview_out != expected_preview_out:
        raise SystemExit(
            f"site bundle repair preview after {context} guidance report path changed: {preview_out!s}"
        )

    apply_out = guidance_out_path(apply_report_command, context=f"{context} apply report")
    expected_apply_out = bundle_dir.parent / f"{bundle_dir.name}-repair-applied.json"
    if apply_out != expected_apply_out:
        raise SystemExit(
            f"site bundle repair apply after {context} guidance report path changed: {apply_out!s}"
        )

    return preview_report_command, apply_report_command, preview_out, apply_out


def assert_site_repair_preview_report_payload(payload: object, *, context: str) -> None:
    if not isinstance(payload, dict):
        raise SystemExit(f"site bundle repair preview after {context} guidance --out payload must be an object")
    if payload.get("dryRun") is not True or payload.get("applied") is not False:
        raise SystemExit(f"site bundle repair preview after {context} guidance --out payload changed")


def assert_site_repair_apply_report_payload(payload: object, *, context: str) -> None:
    if not isinstance(payload, dict):
        raise SystemExit(f"site bundle repair apply after {context} guidance --out payload must be an object")
    if payload.get("status") != "pass" or payload.get("dryRun") is not False or payload.get("applied") is not True:
        raise SystemExit(f"site bundle repair apply after {context} expected applied pass output")
    if payload.get("before", {}).get("status") != "fail" or payload.get("after", {}).get("status") != "pass":
        raise SystemExit(f"site bundle repair apply after {context} expected fail -> pass transition")
    if payload.get("after", {}).get("generatedDriftFiles") != []:
        raise SystemExit(f"site bundle repair apply after {context} expected no generated drift after repair")
    if payload.get("written", {}).get("count") != 9:
        raise SystemExit(f"site bundle repair apply after {context} expected 9 rewritten files")


def assert_site_mcp_probe_counts(actual: object, *, context: str, label: str) -> None:
    if actual != EXPECTED_SITE_MCP_PROBE_COUNTS:
        raise SystemExit(f"{label} after {context} MCP probe counts changed: {actual!r}")


def _assert_json_keys(
    payload: object,
    expected_keys: list[str],
    *,
    label: str,
    context: str,
) -> dict[str, object]:
    if not isinstance(payload, dict):
        raise SystemExit(f"site bundle after {context} {label} must be an object")
    keys = list(payload.keys())
    if keys != expected_keys:
        raise SystemExit(f"site bundle after {context} {label} keys changed: {keys!r}")
    return payload


def assert_site_bundle_mcp_probes_payload(payload: object, *, context: str) -> None:
    checked = _assert_json_keys(
        payload,
        EXPECTED_SITE_BUNDLE_MCP_PROBES_KEYS,
        label="mcp-probes.json",
        context=context,
    )
    if checked.get("enabled") is not True or checked.get("mode") != "read-only-local":
        raise SystemExit(f"site bundle after {context} mcp-probes.json mode changed")
    if checked.get("externalCalls") is not False:
        raise SystemExit(f"site bundle after {context} mcp-probes.json must remain read-only")
    if checked.get("status") != "pass":
        raise SystemExit(f"site bundle after {context} mcp-probes.json status changed")
    assert_site_mcp_probe_counts(
        {key: checked.get(key) for key in ("count", "pass", "warn", "fail")},
        context=context,
        label="site bundle mcp-probes.json",
    )

    items = checked.get("items")
    if not isinstance(items, list) or len(items) != len(EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS):
        raise SystemExit(f"site bundle after {context} mcp-probes.json item count changed")
    checked_ids = []
    for item in items:
        checked_item = _assert_json_keys(
            item,
            EXPECTED_SITE_BUNDLE_MCP_PROBE_ITEM_KEYS,
            label="mcp-probes.json item",
            context=context,
        )
        checked_ids.append(checked_item.get("id"))
        if checked_item.get("level") != "pass" or checked_item.get("passed") is not True:
            raise SystemExit(
                f"site bundle after {context} mcp-probes.json item should pass: {checked_item.get('id')}"
            )
        if not isinstance(checked_item.get("evidence"), list) or not checked_item.get("evidence"):
            raise SystemExit(f"site bundle after {context} mcp-probes.json item evidence missing")
        if not isinstance(checked_item.get("actions"), list):
            raise SystemExit(f"site bundle after {context} mcp-probes.json item actions must be an array")
    if checked_ids != EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS:
        raise SystemExit(f"site bundle after {context} mcp-probes.json item order changed")
