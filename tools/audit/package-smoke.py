#!/usr/bin/env python3
"""
Smoke-test a packed design-ai npm tarball in a fresh temporary install.

This catches release-only packaging regressions that unit tests miss:
- missing bin shim
- missing package files used by install.sh / doctor
- broken install against a clean CLAUDE_HOME
- broken one-shot npm exec / npx-style package execution

Usage:
  python3 tools/audit/package-smoke.py --pack
  python3 tools/audit/package-smoke.py dist/design-ai-cli-4.47.0.tgz
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from smoke_assertions import (
    EXPECTED_CHECK_ARTIFACT_NAME,
    EXPECTED_CHECK_EXAMPLES_LIMIT,
    EXPECTED_COMMAND_ALIAS_COMMANDS,
    EXPECTED_CORPUS_SEARCH_QUERY,
    EXPECTED_CORPUS_SHOW_RANGE,
    EXPECTED_CORPUS_SHOW_REL_PATH,
    EXPECTED_CORPUS_SHOW_TARGET,
    EXPECTED_EXAMPLES_ROUTE,
    EXPECTED_HELP_ALIASES,
    EXPECTED_NUMERIC_VALUE_SMOKES,
    EXPECTED_PACK_MAX_BYTES,
    EXPECTED_REPOSITORY_URL,
    EXPECTED_ROUTE_BRIEF,
    EXPECTED_ROUTE_ID,
    EXPECTED_UNKNOWN_COMMAND,
    EXPECTED_UNKNOWN_HELP_TOPIC,
    EXPECTED_UNKNOWN_LIST_DOMAIN,
    EXPECTED_UNKNOWN_OPTION_SMOKES,
    EXPECTED_UNKNOWN_ROUTE_ID,
    EXPECTED_UNKNOWN_SEARCH_DIR,
    assert_audit_json,
    assert_audit_strict_quiet_output,
    assert_check_artifact_json_component_spec,
    assert_check_all_routes_issues_only_output,
    assert_check_examples_json_component_spec,
    assert_check_stdin_json_component_spec,
    assert_command_alias_output,
    assert_doctor_json_clean,
    assert_doctor_strict_output,
    assert_examples_human_output,
    assert_examples_json_route_hit,
    assert_force_overwrite_replaced,
    assert_functional_alias_smokes,
    assert_help_topic_output,
    assert_install_doctor_lifecycle_output,
    assert_install_output,
    assert_list_catalog_output,
    assert_list_catalog_json,
    assert_main_help_output,
    assert_no_ansi,
    assert_numeric_value_failure,
    assert_output_overwrite_failure,
    assert_output_write_success,
    assert_site_repair_apply_report_payload,
    assert_site_repair_guidance_report_contract,
    assert_site_repair_preview_report_payload,
    assert_pack_json_component_spec,
    assert_pack_markdown_body_component_spec,
    assert_pack_markdown_component_spec,
    assert_prompt_json_component_spec,
    assert_prompt_markdown_body_component_spec,
    assert_prompt_markdown_component_spec,
    assert_route_catalog_json,
    assert_route_explain_human_output,
    assert_route_json_component_spec,
    assert_search_human_output,
    assert_search_json_contains_hit,
    assert_show_human_output,
    assert_show_human_range_output,
    assert_show_json_range,
    assert_show_json_line,
    assert_status_json,
    assert_status_output,
    assert_smoke_json_keys,
    assert_site_from_intake_json,
    assert_site_json,
    assert_site_init_json,
    assert_site_intake_template_json,
    assert_site_intake_template_json_file_output,
    assert_site_intake_template_markdown,
    assert_site_intake_template_markdown_file_output,
    assert_site_mcp_check_json,
    assert_site_mcp_check_probes_human,
    assert_site_mcp_check_probes_human_file_output,
    assert_site_mcp_check_probes_json,
    assert_site_mcp_check_probes_json_file_output,
    assert_site_mcp_plan_json,
    assert_site_mcp_plan_markdown,
    assert_site_mcp_plan_probes_json,
    assert_site_mcp_plan_probes_json_file_output,
    assert_site_mcp_plan_probes_markdown,
    assert_site_bundle_compare_warning_strict_json,
    assert_site_next_actions_human_file_output,
    assert_site_next_actions_json,
    assert_site_next_actions_json_file_output,
    assert_site_workflow_graph_json,
    assert_site_prompt_markdown,
    assert_site_prompt_templates_json,
    assert_site_sample_json,
    assert_site_tasks_json,
    assert_search_dir_value_failure,
    assert_update_dry_run_json,
    assert_update_dry_run_output,
    assert_unknown_command_failure,
    assert_unknown_help_topic_failure,
    assert_unknown_list_domain_failure,
    assert_unknown_option_failure,
    assert_unknown_route_id_failure,
    assert_install_json,
    assert_version_json,
    assert_workspace_json,
    assert_workspace_strict_failure_json,
    assert_workspace_strict_success_json,
    assert_uninstall_json,
    assert_uninstall_output,
    assert_version_output,
    command_alias_script,
    doctor_report_json_missing,
    expect_self_test_failure,
    format_cmd,
    help_alias_script,
    help_topic_script,
    passing_doctor_report_json,
    passing_check_artifact_content,
    passing_site_mcp_check_probes_human,
    passing_site_mcp_check_probes_json,
    passing_site_mcp_plan_json,
    passing_site_next_actions_human,
    passing_site_next_actions_json,
    parse_help_topics,
    seed_force_overwrite_target,
    site_guidance_command,
    site_mcp_probe_embedded_command,
    unknown_option_args,
)

SITE_EVIDENCE_VALUES = {
    "executedWork": "Implemented pricing CTA cleanup in the target repo",
    "verificationResults": "npm run lint passed in the target repo",
    "remainingRisks": "Preview deploy still needs analytics review",
    "nextActions": "Attach before/after screenshots",
}
SITE_EVIDENCE_COUNTS = {key: 1 for key in SITE_EVIDENCE_VALUES}
EXPECTED_SITE_MCP_PROBE_COUNTS = {"count": 4, "pass": 4, "warn": 0, "fail": 0}
EXPECTED_SITE_BUNDLE_MCP_PROBES_KEYS = [
    "enabled",
    "mode",
    "externalCalls",
    "status",
    "count",
    "pass",
    "warn",
    "fail",
    "items",
]
EXPECTED_SITE_BUNDLE_MCP_PROBE_ITEM_KEYS = [
    "id",
    "key",
    "label",
    "requestedStatus",
    "level",
    "passed",
    "message",
    "evidence",
    "actions",
]
EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS = [
    "github-repo-reference",
    "figma-url-reference",
    "browser-smoke-target",
    "deploy-provider-reference",
]
SITE_INIT_SMOKE_ARGS = [
    "site",
    "--init",
    "--name",
    "Company marketing site",
    "--live-url",
    "https://example.com",
    "--repo-url",
    "https://github.com/acme/site",
    "--deploy",
    "vercel",
    "--cms",
    "none",
    "--database",
    "none",
    "--page",
    "/",
    "--page",
    "/pricing",
    "--flow",
    "Visitor compares plans and starts signup",
    "--viewport",
    "desktop",
    "--viewport",
    "mobile",
]
SITE_FROM_INTAKE_SMOKE_MARKDOWN = """# Company Website Intake Template

## Site Profile

| Field | Value |
|---|---|
| Site name | Company marketing site |
| Live URL | https://example.com |
| Target repo URL | https://github.com/acme/site |
| Target repo local path | |
| Figma URL | |
| Deploy provider | vercel |
| Sentry project | |
| CMS | none |
| Database | none |

## Priority Pages

| Priority | Path or URL | Why it matters |
|---:|---|---|
| 1 | / | Primary conversion |
| 2 | /pricing | Pricing comparison |

## Primary User Flows

| Priority | Flow | Success signal |
|---:|---|---|
| 1 | Visitor compares plans and starts signup | Signup intent |

## Brand And Content Notes

| Area | Notes |
|---|---|
| Brand tone | |

## MCP Readiness Notes

| System | Status | Evidence or fallback |
|---|---|---|
| GitHub | required | repo reference |
| Figma | unused | no file |
| Browser / Playwright | required | live URL |
| Chrome DevTools | optional | manual debugging if needed |
| Deploy provider | required | vercel |
| Sentry | unused | none |
| Database | unused | none |
| CMS | unused | none |
| Collaboration tool | optional | internal review |
| Research tool | optional | competitor review |

## Initial Audit Findings

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | | | |
"""

SITE_FROM_INTAKE_TASKS_SMOKE_MARKDOWN = """# Company Website Intake Template

## Site Profile

| Field | Value |
|---|---|
| Site name | Company marketing site |
| Live URL | https://example.com |
| Target repo URL | https://github.com/acme/site |
| Target repo local path | |
| Figma URL | |
| Deploy provider | vercel |
| Sentry project | |
| CMS | none |
| Database | none |

## Priority Pages

| Priority | Path or URL | Why it matters |
|---:|---|---|
| 1 | / | Primary conversion |
| 2 | /pricing | Pricing comparison |

## Primary User Flows

| Priority | Flow | Success signal |
|---:|---|---|
| 1 | Visitor compares plans and starts signup | Signup intent |

## MCP Readiness Notes

| System | Status | Evidence or fallback |
|---|---|---|
| GitHub | required | repo reference |
| Browser / Playwright | required | live URL |
| Deploy provider | required | vercel |

## Initial Audit Findings

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Accessibility | Mobile nav focus is unclear | Keyboard focus ring is missing from the menu trigger | / |
"""


def assert_site_mcp_probe_counts(
    actual: object,
    *,
    context: str,
    label: str,
) -> None:
    if actual != EXPECTED_SITE_MCP_PROBE_COUNTS:
        raise SystemExit(f"{label} after {context} MCP probe counts changed: {actual!r}")


def assert_site_bundle_mcp_probes_payload(payload: object, *, context: str) -> None:
    checked = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_BUNDLE_MCP_PROBES_KEYS,
        label="mcp-probes.json",
        context=context,
        command_label="site bundle",
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
        checked_item = assert_smoke_json_keys(
            item,
            EXPECTED_SITE_BUNDLE_MCP_PROBE_ITEM_KEYS,
            label="mcp-probes.json item",
            context=context,
            command_label="site bundle",
        )
        checked_ids.append(checked_item.get("id"))
        if checked_item.get("level") != "pass" or checked_item.get("passed") is not True:
            raise SystemExit(f"site bundle after {context} mcp-probes.json item should pass: {checked_item.get('id')}")
        if not isinstance(checked_item.get("evidence"), list) or not checked_item.get("evidence"):
            raise SystemExit(f"site bundle after {context} mcp-probes.json item evidence missing")
        if not isinstance(checked_item.get("actions"), list):
            raise SystemExit(f"site bundle after {context} mcp-probes.json item actions must be an array")
    if checked_ids != EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS:
        raise SystemExit(f"site bundle after {context} mcp-probes.json item order changed")


def npm_exec_cmd(tarball: Path, *args: str) -> list[str]:
    return [
        "npm",
        "exec",
        "--yes",
        "--package",
        str(tarball),
        "--",
        "design-ai",
        *args,
    ]


def npm_exec_shell_cmd(tarball: Path, script: str) -> list[str]:
    return [
        "npm",
        "exec",
        "--yes",
        "--package",
        str(tarball),
        "--",
        "sh",
        "-c",
        script,
    ]


def is_npm_exec_cache_enoent(cmd: list[str], result: subprocess.CompletedProcess[str]) -> bool:
    if len(cmd) < 2 or cmd[0] != "npm" or cmd[1] != "exec" or result.returncode == 0:
        return False

    output = f"{result.stdout}\n{result.stderr}"
    return (
        "Could not read package.json" in output
        and "_cacache" in output
        and "ENOENT" in output
    )


def retry_env_with_fresh_npm_cache(env: dict[str, str] | None) -> dict[str, str]:
    retry_env = (env or os.environ).copy()
    npm_cache = retry_env.get("npm_config_cache")
    if npm_cache:
        retry_env["npm_config_cache"] = f"{npm_cache}-retry"
    return retry_env


def retry_npm_exec_once(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    input_text: str | None = None,
) -> subprocess.CompletedProcess[str]:
    retry_env = retry_env_with_fresh_npm_cache(env)
    print("npm exec cache ENOENT detected; retrying once with a fresh npm cache", file=sys.stderr, flush=True)
    return subprocess.run(
        cmd,
        cwd=cwd,
        env=retry_env,
        input=input_text,
        text=True,
        capture_output=True,
    )


def run(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    print(f"$ {format_cmd(cmd)}", flush=True)
    return subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        capture_output=capture,
        check=True,
    )


def run_plain(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    print(f"$ {format_cmd(cmd)}", flush=True)
    result = subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        capture_output=True,
    )

    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)

    if is_npm_exec_cache_enoent(cmd, result):
        result = retry_npm_exec_once(cmd, cwd=cwd, env=env)
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)

    if result.returncode != 0:
        raise SystemExit(f"command failed with exit code {result.returncode}: {format_cmd(cmd)}")

    output = f"{result.stdout}\n{result.stderr}"
    assert_no_ansi(output, cmd)

    return result


def run_plain_with_input(
    cmd: list[str],
    *,
    input_text: str,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    print(f"$ {format_cmd(cmd)} < stdin", flush=True)
    result = subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        input=input_text,
        text=True,
        capture_output=True,
    )

    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)

    if is_npm_exec_cache_enoent(cmd, result):
        result = retry_npm_exec_once(cmd, cwd=cwd, env=env, input_text=input_text)
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)

    if result.returncode != 0:
        raise SystemExit(f"command failed with exit code {result.returncode}: {format_cmd(cmd)}")

    output = f"{result.stdout}\n{result.stderr}"
    assert_no_ansi(output, cmd)

    return result


def fail_package_smoke(context: str, cmd: list[str], message: str) -> None:
    raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        fail_package_smoke(context, cmd, message)


def run_expected_failure(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    context: str,
    assertion=assert_unknown_command_failure,
) -> subprocess.CompletedProcess[str]:
    print(f"$ {format_cmd(cmd)}", flush=True)
    result = subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        capture_output=True,
    )

    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)

    if is_npm_exec_cache_enoent(cmd, result):
        result = retry_npm_exec_once(cmd, cwd=cwd, env=env)
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)

    assertion(
        f"{result.stdout}\n{result.stderr}",
        returncode=result.returncode,
        context=context,
        cmd=cmd,
    )

    return result


def assert_unknown_option_smoke(
    cmd: list[str],
    *,
    command_name: str,
    option: str,
    suggestion: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=lambda raw, *, returncode, context, cmd: assert_unknown_option_failure(
            raw,
            returncode=returncode,
            context=context,
            cmd=cmd,
            command_name=command_name,
            option=option,
            suggestion=suggestion,
        ),
    )


def assert_numeric_value_smoke(
    cmd: list[str],
    *,
    expected_message: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=lambda raw, *, returncode, context, cmd: assert_numeric_value_failure(
            raw,
            returncode=returncode,
            context=context,
            cmd=cmd,
            expected_message=expected_message,
        ),
    )


def assert_doctor_clean(bin_path: Path, env: dict[str, str]) -> None:
    cmd = [str(bin_path), "doctor", "--json"]
    result = run(cmd, env=env, capture=True)
    assert_doctor_json_clean(
        result.stdout,
        context="package smoke install",
        cmd=cmd,
        parse_error_message="failed to parse doctor JSON after package smoke install",
    )


def assert_doctor_strict_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_doctor_strict_output(result.stdout, context=context, cmd=cmd)


def assert_doctor_report_file(report_path: Path, *, context: str) -> None:
    try:
        raw = report_path.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read doctor JSON after {context}: {report_path}") from error

    assert_doctor_json_clean(
        raw,
        context=context,
        cmd=["design-ai", "doctor", "--json"],
        parse_error_message=f"failed to parse doctor JSON after {context}",
    )


def read_help_topics(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str = "package smoke help catalog",
) -> list[str]:
    result = run_plain(cmd, cwd=cwd, env=env)
    return parse_help_topics(result.stdout, context=context, cmd=cmd)


def assert_help_topic_smoke(
    cmd: list[str],
    *,
    topic: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_help_topic_output(result.stdout, topic=topic, context=context, cmd=cmd)


def assert_main_help_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_main_help_output(result.stdout, context=context, cmd=cmd)


def assert_version_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_version_output(result.stdout, context=context, cmd=cmd)


def assert_version_json_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_version_json(result.stdout, context=context, cmd=cmd)


def assert_workspace_json_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_workspace_json(result.stdout, context=context, cmd=cmd)


def assert_workspace_restore_backups_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_workspace_json(result.stdout, context=context, cmd=cmd)
    payload = json.loads(result.stdout)
    restore_backups = payload.get("learningRestoreBackups")
    if not isinstance(restore_backups, dict):
        raise SystemExit(f"workspace restore-backups after {context} did not report learningRestoreBackups")
    if restore_backups.get("totalCount") != 6 or restore_backups.get("count") != 5:
        raise SystemExit(
            f"workspace restore-backups after {context} expected totalCount=6/count=5, "
            f"got totalCount={restore_backups.get('totalCount')!r}/count={restore_backups.get('count')!r}"
        )
    readiness = restore_backups.get("readiness")
    if not isinstance(readiness, dict) or readiness.get("status") != "warn" or readiness.get("pruneCandidateCount") != 1:
        raise SystemExit(f"workspace restore-backups after {context} readiness did not report one prune candidate")
    latest_backup = restore_backups.get("latestBackup")
    if not isinstance(latest_backup, dict) or "--restore" not in latest_backup.get("restorePreviewCommand", ""):
        raise SystemExit(f"workspace restore-backups after {context} latest restore preview command is missing")
    next_actions = payload.get("nextActions")
    if not any(
        isinstance(action, dict)
        and "--restore-backups" in action.get("command", "")
        and "--prune --keep 5" in action.get("command", "")
        for action in next_actions or []
    ):
        raise SystemExit(f"workspace restore-backups after {context} missing prune next action")


def site_workspace_fixture_json() -> str:
    return json.dumps(
        {
            "version": 1,
            "updatedAt": "2026-05-30T00:00:00.000Z",
            "siteProfile": {
                "id": "sample-korean-saas",
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
                "figmaUrl": "https://figma.com/file/example",
                "brandNotes": "Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.",
                "deployProvider": "vercel",
                "sentryProject": "acme/korean-saas-web",
                "cms": "sanity",
                "database": "none",
                "pages": ["/", "/pricing", "/signup", "/docs"],
                "userFlows": [
                    "Visitor compares pricing and starts signup",
                    "Existing customer finds feature proof before contacting sales",
                ],
                "viewports": ["desktop", "tablet", "mobile"],
            },
            "auditChecklist": {
                "visual-design": {
                    "status": "in-progress",
                    "notes": "Hero hierarchy and CTA contrast need review before company pilot.",
                    "findings": ["Primary CTA competes with secondary link on the homepage"],
                },
                "ux-flow": {
                    "status": "todo",
                    "notes": "Map visitor path from landing page to pricing and signup.",
                    "findings": [],
                },
                "responsive": {
                    "status": "todo",
                    "notes": "Check 1440, 1024, 390, and 360 width layouts.",
                    "findings": [],
                },
                "accessibility": {
                    "status": "todo",
                    "notes": "Keyboard and focus audit required for nav, pricing toggle, and forms.",
                    "findings": ["Focus state is not yet documented for the mobile menu"],
                },
                "performance": {
                    "status": "todo",
                    "notes": "Run Lighthouse after visual pass.",
                    "findings": [],
                },
                "seo": {
                    "status": "todo",
                    "notes": "Inspect title, description, heading order, canonical, OG.",
                    "findings": [],
                },
                "technical-quality": {
                    "status": "todo",
                    "notes": "Confirm component reuse before editing target repo.",
                    "findings": [],
                },
                "runtime-issues": {
                    "status": "todo",
                    "notes": "Open console/network once preview deploy is available.",
                    "findings": [],
                },
                "content-quality": {
                    "status": "in-progress",
                    "notes": "Copy should lead with proof and reduce generic SaaS phrasing.",
                    "findings": ["Pricing page does not explain plan fit in the first viewport"],
                },
            },
            "mcpReadiness": {
                "github": "required",
                "figma": "optional",
                "browser": "required",
                "chromeDevtools": "optional",
                "deploy": "required",
                "sentry": "optional",
                "database": "unused",
                "cms": "optional",
                "collaboration": "optional",
                "research": "optional",
            },
            "refactorTasks": [
                {
                    "id": "task-homepage-cta",
                    "title": "Clarify homepage CTA hierarchy",
                    "category": "visual-design",
                    "problem": "Primary and secondary actions compete in the hero, which weakens the visitor's first decision.",
                    "evidence": "Sample finding: Primary CTA competes with secondary link on the homepage.",
                    "impact": "high",
                    "effort": "medium",
                    "priority": "p1",
                    "pages": ["/"],
                    "recommendedMcp": ["browser", "figma"],
                    "codexPrompt": "Inspect the target homepage implementation, preserve existing design system patterns, and revise the hero CTA hierarchy so the primary signup action is visually dominant while the secondary action remains available.",
                    "verification": [
                        "Run target repo lint/build",
                        "Verify desktop/tablet/mobile hero layout",
                        "Confirm focus indicators and text contrast",
                    ],
                    "risks": ["Could change conversion copy without stakeholder approval"],
                },
            ],
            "implementationEvidence": {
                "executedWork": [],
                "verificationResults": [],
                "remainingRisks": [
                    "MCP readiness gaps may limit verification depth.",
                    "Copy or brand changes may require stakeholder review.",
                    "Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
                ],
                "nextActions": [],
            },
            "reportNotes": "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
        },
        ensure_ascii=False,
    )


def site_workspace_evidence_fixture_json() -> str:
    payload = json.loads(site_workspace_fixture_json())
    payload["implementationEvidence"] = {
        key: [value]
        for key, value in SITE_EVIDENCE_VALUES.items()
    }
    return json.dumps(payload, ensure_ascii=False)


def site_workspace_warning_fixture_json() -> str:
    payload = json.loads(site_workspace_fixture_json())
    payload["siteProfile"]["sentryProject"] = ""
    return json.dumps(payload, ensure_ascii=False)


def assert_site_evidence_payload(payload: object, *, context: str, label: str) -> None:
    if not isinstance(payload, dict):
        raise SystemExit(f"{label} after {context} did not emit an object payload")
    evidence = payload.get("implementationEvidence")
    if not isinstance(evidence, dict):
        raise SystemExit(f"{label} after {context} did not preserve implementationEvidence")
    for key, expected in SITE_EVIDENCE_VALUES.items():
        if evidence.get(key) != [expected]:
            raise SystemExit(f"{label} after {context} evidence field {key} changed: {evidence.get(key)!r}")


def assert_site_evidence_markdown(raw: str, *, context: str, cmd: list[str], label: str) -> None:
    assert_no_ansi(raw, cmd)
    stripped = raw.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        raise SystemExit(f"{label} after {context} looks like JSON output")
    for fragment in SITE_EVIDENCE_VALUES.values():
        if fragment not in raw:
            raise SystemExit(f"{label} after {context} missing evidence fragment: {fragment!r}")


def assert_site_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_json(result.stdout, context=context, cmd=cmd)


def assert_site_sample_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_sample_json(result.stdout, context=context, cmd=cmd)


def assert_site_intake_template_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    language: str = "en",
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_intake_template_json(result.stdout, context=context, cmd=cmd, language=language)


def assert_site_intake_template_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    language: str = "en",
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_intake_template_markdown(result.stdout, context=context, cmd=cmd, language=language)


def assert_site_intake_template_json_file_smoke(
    cmd: list[str],
    out_file: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    language: str = "en",
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    try:
        contents = out_file.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read site intake template JSON out file after {context}: {out_file}") from error
    assert_site_intake_template_json_file_output(
        result.stdout,
        contents,
        output_path=str(out_file),
        context=context,
        cmd=cmd,
        language=language,
    )


def assert_site_intake_template_markdown_file_smoke(
    cmd: list[str],
    out_file: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    language: str = "en",
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    try:
        contents = out_file.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read site intake template Markdown out file after {context}: {out_file}") from error
    assert_site_intake_template_markdown_file_output(
        result.stdout,
        contents,
        output_path=str(out_file),
        context=context,
        cmd=cmd,
        language=language,
    )


def assert_site_init_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_init_json(result.stdout, context=context, cmd=cmd)


def write_site_from_intake_fixture(root: Path, *, filename: str = "company-website-intake.filled.md") -> Path:
    path = root / filename
    path.write_text(SITE_FROM_INTAKE_SMOKE_MARKDOWN, encoding="utf-8")
    return path


def write_site_from_intake_tasks_fixture(root: Path, *, filename: str = "company-website-intake.tasks.md") -> Path:
    path = root / filename
    path.write_text(SITE_FROM_INTAKE_TASKS_SMOKE_MARKDOWN, encoding="utf-8")
    return path


def assert_site_from_intake_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_from_intake_json(result.stdout, context=context, cmd=cmd)


def assert_site_from_intake_stdin_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=SITE_FROM_INTAKE_SMOKE_MARKDOWN,
        cwd=cwd,
        env=env,
    )
    assert_site_from_intake_json(result.stdout, context=context, cmd=cmd)


def assert_site_from_intake_json_file_smoke(
    cmd: list[str],
    out_file: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    try:
        contents = out_file.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read site from-intake JSON out file after {context}: {out_file}") from error
    assert_output_write_success(result.stdout, expected_path=str(out_file), context=context, cmd=cmd)
    assert_site_from_intake_json(contents, context=context, cmd=cmd)


def assert_site_from_intake_stdin_json_file_smoke(
    cmd: list[str],
    out_file: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=SITE_FROM_INTAKE_SMOKE_MARKDOWN,
        cwd=cwd,
        env=env,
    )
    try:
        contents = out_file.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read site from-intake stdin JSON out file after {context}: {out_file}") from error
    assert_output_write_success(result.stdout, expected_path=str(out_file), context=context, cmd=cmd)
    assert_site_from_intake_json(contents, context=context, cmd=cmd)


def assert_site_from_intake_tasks_payload(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site from-intake tasks JSON after {context} is not valid JSON: {error}") from error

    profile = payload.get("siteProfile")
    if not isinstance(profile, dict) or profile.get("name") != "Company marketing site":
        raise SystemExit(f"site from-intake tasks JSON after {context} site profile changed")
    if profile.get("liveUrl") != "https://example.com" or profile.get("repoUrl") != "https://github.com/acme/site":
        raise SystemExit(f"site from-intake tasks JSON after {context} site URLs changed")

    tasks = payload.get("refactorTasks")
    if not isinstance(tasks, list) or len(tasks) != 1:
        raise SystemExit(f"site from-intake tasks JSON after {context} expected one generated task")
    task = tasks[0]
    if not isinstance(task, dict):
        raise SystemExit(f"site from-intake tasks JSON after {context} task is not an object")
    expected = {
        "id": "task-accessibility",
        "category": "accessibility",
        "priority": "p0",
        "impact": "high",
        "effort": "medium",
    }
    for key, value in expected.items():
        if task.get(key) != value:
            raise SystemExit(f"site from-intake tasks JSON after {context} task {key} changed: {task.get(key)!r}")
    if "Mobile nav focus is unclear" not in task.get("problem", ""):
        raise SystemExit(f"site from-intake tasks JSON after {context} task problem missing intake finding")
    if task.get("pages") != ["/", "/pricing"]:
        raise SystemExit(f"site from-intake tasks JSON after {context} task pages changed")
    if "chromeDevtools" not in task.get("recommendedMcp", []):
        raise SystemExit(f"site from-intake tasks JSON after {context} accessibility task should recommend Chrome DevTools")
    if "target website repo" not in task.get("codexPrompt", ""):
        raise SystemExit(f"site from-intake tasks JSON after {context} generated prompt must preserve target repo boundary")
    if "design-ai site --from-intake" not in payload.get("reportNotes", ""):
        raise SystemExit(f"site from-intake tasks JSON after {context} reportNotes provenance changed")


def assert_site_from_intake_tasks_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_from_intake_tasks_payload(result.stdout, context=context, cmd=cmd)


def assert_site_from_intake_stdin_tasks_json_file_smoke(
    cmd: list[str],
    out_file: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=SITE_FROM_INTAKE_TASKS_SMOKE_MARKDOWN,
        cwd=cwd,
        env=env,
    )
    try:
        contents = out_file.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read site from-intake stdin tasks JSON out file after {context}: {out_file}") from error
    assert_output_write_success(result.stdout, expected_path=str(out_file), context=context, cmd=cmd)
    assert_site_from_intake_tasks_payload(contents, context=f"{context} out file", cmd=cmd)


def assert_site_from_intake_next_actions_json_payload(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site from-intake next-actions JSON after {context} is not valid JSON: {error}") from error

    if payload.get("kind") != "website-improvement-next-actions" or payload.get("version") != 1:
        raise SystemExit(f"site from-intake next-actions JSON after {context} kind/version changed")
    if payload.get("mode") != "from-intake-next-actions" or payload.get("intakePath") != "--stdin":
        raise SystemExit(f"site from-intake next-actions JSON after {context} source mode changed")
    for key in ("status", "workspaceStatus", "mcpStatus", "mcpProbeStatus"):
        if payload.get(key) != "pass":
            raise SystemExit(f"site from-intake next-actions JSON after {context} expected pass {key}")
    if payload.get("externalCalls") is not False or payload.get("targetRepoMutation") is not False:
        raise SystemExit(f"site from-intake next-actions JSON after {context} boundary flags must remain false")

    site = payload.get("site")
    if not isinstance(site, dict) or site.get("name") != "Company marketing site":
        raise SystemExit(f"site from-intake next-actions JSON after {context} site summary changed")
    if site.get("liveUrl") != "https://example.com" or site.get("repoUrl") != "https://github.com/acme/site":
        raise SystemExit(f"site from-intake next-actions JSON after {context} site URLs changed")

    counts = payload.get("counts")
    if not isinstance(counts, dict):
        raise SystemExit(f"site from-intake next-actions JSON after {context} counts missing")
    expected_counts = {
        "actions": 4,
        "blocking": 0,
        "warnings": 0,
        "tasks": 0,
        "requiredMcpMissing": 0,
        "taskGaps": 0,
        "probeGaps": 0,
    }
    for key, expected in expected_counts.items():
        if counts.get(key) != expected:
            raise SystemExit(f"site from-intake next-actions JSON after {context} count {key} changed: {counts.get(key)!r}")

    if payload.get("mcpProbeCounts") != {"count": 3, "pass": 3, "warn": 0, "fail": 0}:
        raise SystemExit(f"site from-intake next-actions JSON after {context} MCP probe counts changed: {payload.get('mcpProbeCounts')!r}")
    if payload.get("topTasks") != []:
        raise SystemExit(f"site from-intake next-actions JSON after {context} topTasks should start empty")

    actions = payload.get("actions")
    if not isinstance(actions, list) or len(actions) != 4:
        raise SystemExit(f"site from-intake next-actions JSON after {context} actions changed")
    expected_action_fragments = [
        "--from-intake --stdin --out website-workspace.json --force",
        "--tasks --out website-workspace.tasks.json",
        "--report --out website-handoff.md",
        "--bundle --out website-handoff-bundle",
    ]
    for index, fragment in enumerate(expected_action_fragments):
        action = actions[index]
        if not isinstance(action, dict) or action.get("rank") != index + 1:
            raise SystemExit(f"site from-intake next-actions JSON after {context} action rank changed")
        command = action.get("command")
        if not isinstance(command, str) or fragment not in command:
            raise SystemExit(f"site from-intake next-actions JSON after {context} action command missing {fragment!r}: {command!r}")

    commands = payload.get("commands")
    if not isinstance(commands, dict):
        raise SystemExit(f"site from-intake next-actions JSON after {context} commands missing")
    if "--from-intake --stdin --out website-workspace.json --force" not in commands.get("createWorkspace", ""):
        raise SystemExit(f"site from-intake next-actions JSON after {context} createWorkspace command changed")
    for key, fragment in (
        ("tasks", "--tasks --out website-workspace.tasks.json"),
        ("handoffReport", "--report --out website-handoff.md"),
        ("handoffBundle", "--bundle --out website-handoff-bundle"),
    ):
        if fragment not in commands.get(key, ""):
            raise SystemExit(f"site from-intake next-actions JSON after {context} command {key} changed")

    boundary_text = "\n".join(str(item) for item in payload.get("boundaries", []))
    for fragment in ("intake next-action report is deterministic and local", "does not call external MCPs", "mutate the target website repo"):
        if fragment not in boundary_text:
            raise SystemExit(f"site from-intake next-actions JSON after {context} boundary guidance missing {fragment!r}")


def assert_site_from_intake_next_actions_human_payload(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    required_fragments = (
        "Website Improvement next actions: Company marketing site",
        "Status: pass",
        "MCP probes: 3/3 passing, 0 warning, 0 failing",
        "Actions: 4 (0 blocking, 0 warning)",
        "Save the parsed Website Improvement workspace",
        "--from-intake --stdin --out website-workspace.json --force",
        "--tasks --out website-workspace.tasks.json",
        "--report --out website-handoff.md",
        "--bundle --out website-handoff-bundle",
        "Boundaries:",
        "deterministic and local",
        "does not call external MCPs",
        "mutate the target website repo",
    )
    for fragment in required_fragments:
        if fragment not in raw:
            raise SystemExit(f"site from-intake next-actions human after {context} missing fragment: {fragment!r}")
    if '"kind": "website-improvement-next-actions"' in raw:
        raise SystemExit(f"site from-intake next-actions human after {context} unexpectedly emitted JSON")


def assert_site_from_intake_stdin_next_actions_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=SITE_FROM_INTAKE_SMOKE_MARKDOWN,
        cwd=cwd,
        env=env,
    )
    assert_site_from_intake_next_actions_json_payload(result.stdout, context=context, cmd=cmd)


def assert_site_from_intake_stdin_next_actions_json_file_smoke(
    cmd: list[str],
    out_file: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=SITE_FROM_INTAKE_SMOKE_MARKDOWN,
        cwd=cwd,
        env=env,
    )
    try:
        contents = out_file.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read site from-intake stdin next-actions JSON out file after {context}: {out_file}") from error
    assert_output_write_success(result.stdout, expected_path=str(out_file), context=context, cmd=cmd)
    assert_site_from_intake_next_actions_json_payload(contents, context=f"{context} out file", cmd=cmd)


def assert_site_from_intake_stdin_next_actions_human_file_smoke(
    cmd: list[str],
    out_file: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=SITE_FROM_INTAKE_SMOKE_MARKDOWN,
        cwd=cwd,
        env=env,
    )
    try:
        contents = out_file.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read site from-intake stdin next-actions human out file after {context}: {out_file}") from error
    assert_output_write_success(result.stdout, expected_path=str(out_file), context=context, cmd=cmd)
    assert_site_from_intake_next_actions_human_payload(contents, context=f"{context} out file", cmd=cmd)


def assert_site_init_bundle_smoke(
    cmd: list[str],
    *,
    out_dir: Path,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    input_text: str | None = None,
    expected_refactor_task_ids: list[str] | None = None,
) -> None:
    result = (
        run_plain_with_input(cmd, input_text=input_text, cwd=cwd, env=env)
        if input_text is not None
        else run_plain(cmd, cwd=cwd, env=env)
    )
    assert_no_ansi(result.stdout, cmd)
    assert_output_write_success(result.stdout, expected_path=str(out_dir), context=context, cmd=cmd)

    expected_files = [
        "README.md",
        "summary.json",
        "website-workspace.tasks.json",
        "mcp-check.json",
        "mcp-probes.json",
        "mcp-action-plan.md",
        "website-handoff.md",
        "website-prompts.md",
        "codex-implementation.md",
    ]
    for name in expected_files:
        target = out_dir / name
        if not target.is_file():
            raise SystemExit(f"site init bundle after {context} missing {target}")

    summary = json.loads((out_dir / "summary.json").read_text(encoding="utf-8"))
    if summary.get("site", {}).get("name") != "Company marketing site":
        raise SystemExit(f"site init bundle after {context} site name changed")
    if summary.get("source") != "website-workspace.json":
        raise SystemExit(f"site init bundle after {context} source changed: {summary.get('source')!r}")
    expected_refactor_task_ids = expected_refactor_task_ids or []
    expected_refactor_task_count = len(expected_refactor_task_ids)
    if (
        summary.get("counts", {}).get("refactorTasks") != expected_refactor_task_count
        or summary.get("taskGeneration", {}).get("totalTasks") != expected_refactor_task_count
    ):
        raise SystemExit(
            f"site init bundle after {context} expected {expected_refactor_task_count} starter task(s)"
        )
    if summary.get("files") != expected_files:
        raise SystemExit(f"site init bundle after {context} file manifest changed")
    handoff = summary.get("handoff")
    strict_ready = summary.get("status") == "pass"
    strict_command = "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md"
    draft_command = "design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff.md"
    expected_execution_checklist = [
        {
            "id": "confirm-target-repo",
            "label": "Confirm target repo working directory",
            "required": True,
            "evidence": "State the target repo path and confirm it is not the design-ai repo before editing.",
        },
        {
            "id": "inspect-architecture",
            "label": "Inspect existing architecture and design system",
            "required": True,
            "evidence": "Name the routing, component, styling, token, and test/build surfaces inspected before implementation.",
        },
        {
            "id": "apply-focused-task",
            "label": "Apply one focused Website Improvement task",
            "required": True,
            "evidence": "Identify the completed task id/title, changed files, and why the scope stayed limited.",
        },
        {
            "id": "verify-quality-gates",
            "label": "Run target repo quality gates",
            "required": True,
            "evidence": "Record lint/typecheck/build/test results plus browser, viewport, accessibility, and deployment checks that were available.",
        },
        {
            "id": "record-handoff-evidence",
            "label": "Record implementation evidence and remaining risks",
            "required": True,
            "evidence": "Return executed work, verification results, remaining risks, next actions, and the bundle digest used.",
        },
    ]
    expected_handoff = {
        "strictReady": strict_ready,
        "readiness": "ready-for-strict-handoff" if strict_ready else "review-warnings-before-strict-handoff",
        "recommendedCommand": strict_command if strict_ready else draft_command,
        "strictCommand": strict_command,
        "draftCommand": draft_command,
        "verifyCommand": "design-ai site <bundle-dir> --bundle-check --strict --json",
        "note": (
            "Use the strict handoff command before target-repo implementation."
            if strict_ready
            else "Use the draft handoff command only for planning while readiness warnings remain; use the strict handoff command before treating the bundle as implementation authority."
        ),
        "executionChecklist": expected_execution_checklist,
    }
    if handoff != expected_handoff:
        raise SystemExit(f"site init bundle after {context} handoff guidance changed: {handoff!r}")

    readme = (out_dir / "README.md").read_text(encoding="utf-8")
    expected_strict_ready = "yes" if strict_ready else "no"
    if f"Strict-ready: {expected_strict_ready}" not in readme:
        raise SystemExit(f"site init bundle after {context} README missing strict-ready guidance")
    if f"Recommended command: `{expected_handoff['recommendedCommand']}`" not in readme:
        raise SystemExit(f"site init bundle after {context} README missing recommended handoff command")
    if "Target Repo Execution Checklist" not in readme or "Confirm target repo working directory" not in readme:
        raise SystemExit(f"site init bundle after {context} README missing target repo execution checklist")

    workspace = json.loads((out_dir / "website-workspace.tasks.json").read_text(encoding="utf-8"))
    if workspace.get("siteProfile", {}).get("name") != "Company marketing site":
        raise SystemExit(f"site init bundle after {context} workspace site name changed")
    refactor_task_ids = [task.get("id") for task in workspace.get("refactorTasks", []) if isinstance(task, dict)]
    if refactor_task_ids != expected_refactor_task_ids:
        raise SystemExit(
            f"site init bundle after {context} expected refactor tasks {expected_refactor_task_ids!r}, got {refactor_task_ids!r}"
        )


def assert_site_tasks_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_tasks_json(result.stdout, context=context, cmd=cmd)


def assert_site_next_actions_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_next_actions_json(result.stdout, context=context, cmd=cmd)


def assert_site_next_actions_json_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_next_actions_json_file_output(
        result.stdout,
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        output_path=str(output_path),
        context=context,
        cmd=cmd,
    )


def assert_site_next_actions_human_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_next_actions_human_file_output(
        result.stdout,
        read_forced_markdown_output_file(output_path, context=context, cmd=cmd),
        output_path=str(output_path),
        context=context,
        cmd=cmd,
    )


def assert_site_report_evidence_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_evidence_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_evidence_markdown(result.stdout, context=context, cmd=cmd, label="site report evidence markdown")


def assert_site_tasks_evidence_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_evidence_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_tasks_json(result.stdout, context=context, cmd=cmd)
    assert_site_evidence_payload(
        json.loads(result.stdout),
        context=context,
        label="site tasks evidence JSON",
    )


def assert_site_prompt_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_prompt_markdown(result.stdout, context=context, cmd=cmd)


def assert_site_prompt_templates_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_prompt_templates_json(result.stdout, context=context, cmd=cmd)


def assert_site_mcp_check_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_check_json(result.stdout, context=context, cmd=cmd)


def assert_site_mcp_check_probes_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> dict[str, object]:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_check_probes_json(result.stdout, context=context, cmd=cmd)
    return json.loads(result.stdout)


def assert_site_mcp_check_probes_human_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_check_probes_human(result.stdout, context=context, cmd=cmd)


def assert_site_mcp_check_probes_human_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_check_probes_human_file_output(
        result.stdout,
        output_path.read_text(encoding="utf-8"),
        output_path=str(output_path),
        context=context,
        cmd=cmd,
    )


def assert_site_mcp_check_probes_json_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_check_probes_json_file_output(
        result.stdout,
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        output_path=str(output_path),
        context=context,
        cmd=cmd,
    )


def assert_site_mcp_plan_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_plan_markdown(result.stdout, context=context, cmd=cmd)


def assert_site_mcp_plan_probes_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_plan_probes_markdown(result.stdout, context=context, cmd=cmd)


def assert_site_mcp_plan_probes_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> object:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_plan_probes_json(result.stdout, context=context, cmd=cmd)
    return json.loads(result.stdout)


def assert_site_mcp_plan_probes_json_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_mcp_plan_probes_json_file_output(
        result.stdout,
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        output_path=str(output_path),
        context=context,
        cmd=cmd,
    )


def assert_site_workflow_graph_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_site_workflow_graph_json(result.stdout, context=context, cmd=cmd)


def assert_site_bundle_smoke(
    cmd: list[str],
    *,
    out_dir: Path,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_no_ansi(result.stdout, cmd)
    assert_output_write_success(result.stdout, expected_path=str(out_dir), context=context, cmd=cmd)

    expected_files = [
        "README.md",
        "summary.json",
        "website-workspace.tasks.json",
        "mcp-check.json",
        "mcp-probes.json",
        "mcp-action-plan.md",
        "website-handoff.md",
        "website-prompts.md",
        "codex-implementation.md",
    ]
    for name in expected_files:
        target = out_dir / name
        if not target.is_file():
            raise SystemExit(f"site bundle after {context} missing {target}")

    summary = json.loads((out_dir / "summary.json").read_text(encoding="utf-8"))
    if summary.get("status") != "pass":
        raise SystemExit(f"site bundle after {context} summary status changed: {summary.get('status')!r}")
    if summary.get("taskGeneration", {}).get("totalTasks") != 3:
        raise SystemExit(f"site bundle after {context} expected 3 generated/retained tasks")
    evidence_counts = summary.get("implementationEvidence")
    if (
        not isinstance(evidence_counts, dict)
        or evidence_counts.get("executedWork") != 0
        or evidence_counts.get("verificationResults") != 0
        or evidence_counts.get("remainingRisks") != 3
        or evidence_counts.get("nextActions") != 0
    ):
        raise SystemExit(f"site bundle after {context} implementation evidence counts changed")
    if summary.get("files") != expected_files:
        raise SystemExit(f"site bundle after {context} file manifest changed")
    execution_checklist = summary.get("handoff", {}).get("executionChecklist")
    if not isinstance(execution_checklist, list) or [item.get("id") for item in execution_checklist] != [
        "confirm-target-repo",
        "inspect-architecture",
        "apply-focused-task",
        "verify-quality-gates",
        "record-handoff-evidence",
    ]:
        raise SystemExit(f"site bundle after {context} handoff execution checklist changed")
    checksums = summary.get("checksums", {})
    checksum_files = checksums.get("files", {})
    if checksums.get("algorithm") != "sha256":
        raise SystemExit(f"site bundle after {context} checksum algorithm changed")
    bundle_digest = checksums.get("bundleDigest")
    if not isinstance(bundle_digest, str) or len(bundle_digest) != 64:
        raise SystemExit(f"site bundle after {context} bundle digest is not a SHA-256 hex digest")
    expected_checksum_files = [name for name in expected_files if name != "summary.json"]
    if list(checksum_files.keys()) != expected_checksum_files:
        raise SystemExit(f"site bundle after {context} checksum file manifest changed")
    for name, digest in checksum_files.items():
        if not isinstance(digest, str) or len(digest) != 64:
            raise SystemExit(f"site bundle after {context} checksum for {name} is not a SHA-256 hex digest")

    tasks = json.loads((out_dir / "website-workspace.tasks.json").read_text(encoding="utf-8"))
    task_ids = [task.get("id") for task in tasks.get("refactorTasks", [])]
    if task_ids != ["task-homepage-cta", "task-accessibility", "task-content-quality"]:
        raise SystemExit(f"site bundle after {context} task ids changed: {task_ids!r}")
    evidence = tasks.get("implementationEvidence")
    if not isinstance(evidence, dict) or len(evidence.get("remainingRisks", [])) != 3:
        raise SystemExit(f"site bundle after {context} did not preserve implementationEvidence in workspace JSON")

    mcp_check = json.loads((out_dir / "mcp-check.json").read_text(encoding="utf-8"))
    assert_site_mcp_check_json(json.dumps(mcp_check), context=context, cmd=cmd)
    mcp_probes = json.loads((out_dir / "mcp-probes.json").read_text(encoding="utf-8"))
    assert_site_bundle_mcp_probes_payload(mcp_probes, context=context)
    assert_site_mcp_plan_markdown((out_dir / "mcp-action-plan.md").read_text(encoding="utf-8"), context=context, cmd=cmd)
    implementation_prompt = (out_dir / "codex-implementation.md").read_text(encoding="utf-8")
    assert_no_ansi(implementation_prompt, cmd)
    for fragment in (
        "# Codex implementation prompt",
        "Task ID: task-accessibility",
        "Focus state is not yet documented for the mobile menu",
        "Work in the target website repository, not in this design-ai repository.",
    ):
        if fragment not in implementation_prompt:
            raise SystemExit(f"site bundle after {context} implementation prompt missing fragment: {fragment!r}")
    readme = (out_dir / "README.md").read_text(encoding="utf-8")
    if "Website improvement handoff bundle" not in readme or "does not call external MCPs" not in readme:
        raise SystemExit(f"site bundle after {context} README missing bundle boundary guidance")
    if "Target Repo Execution Checklist" not in readme or "Run target repo quality gates" not in readme:
        raise SystemExit(f"site bundle after {context} README missing target repo execution checklist")


def assert_site_warning_bundle_smoke(
    cmd: list[str],
    *,
    out_dir: Path,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_warning_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_no_ansi(result.stdout, cmd)
    assert_output_write_success(result.stdout, expected_path=str(out_dir), context=context, cmd=cmd)

    summary = json.loads((out_dir / "summary.json").read_text(encoding="utf-8"))
    mcp_check = json.loads((out_dir / "mcp-check.json").read_text(encoding="utf-8"))
    if summary.get("status") != "warn":
        raise SystemExit(f"site warning bundle after {context} summary status changed: {summary.get('status')!r}")
    if summary.get("mcp", {}).get("status") != "warn":
        raise SystemExit(f"site warning bundle after {context} summary MCP status changed")
    if mcp_check.get("status") != "warn":
        raise SystemExit(f"site warning bundle after {context} mcp-check status changed: {mcp_check.get('status')!r}")
    sentry_item = next((item for item in mcp_check.get("items", []) if item.get("key") == "sentry"), None)
    if not isinstance(sentry_item, dict) or sentry_item.get("state") != "missing" or sentry_item.get("level") != "warn":
        raise SystemExit(f"site warning bundle after {context} did not preserve optional Sentry warning")


def assert_site_bundle_compare_warning_strict_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=assert_site_bundle_compare_warning_strict_json,
    )


def assert_site_bundle_evidence_smoke(
    cmd: list[str],
    *,
    out_dir: Path,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=site_workspace_evidence_fixture_json(),
        cwd=cwd,
        env=env,
    )
    assert_no_ansi(result.stdout, cmd)
    assert_output_write_success(result.stdout, expected_path=str(out_dir), context=context, cmd=cmd)

    summary_path = out_dir / "summary.json"
    tasks_path = out_dir / "website-workspace.tasks.json"
    handoff_path = out_dir / "website-handoff.md"
    readme_path = out_dir / "README.md"
    for target in (summary_path, tasks_path, handoff_path, readme_path):
        if not target.is_file():
            raise SystemExit(f"site evidence bundle after {context} missing {target}")

    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    evidence_counts = summary.get("implementationEvidence")
    if not isinstance(evidence_counts, dict):
        raise SystemExit(f"site evidence bundle after {context} did not report implementationEvidence counts")
    for key in SITE_EVIDENCE_VALUES:
        if evidence_counts.get(key) != 1:
            raise SystemExit(f"site evidence bundle after {context} evidence count {key} changed: {evidence_counts.get(key)!r}")

    tasks = json.loads(tasks_path.read_text(encoding="utf-8"))
    assert_site_evidence_payload(tasks, context=context, label="site evidence bundle workspace JSON")
    assert_site_evidence_markdown(
        handoff_path.read_text(encoding="utf-8"),
        context=context,
        cmd=cmd,
        label="site evidence bundle handoff markdown",
    )
    readme = readme_path.read_text(encoding="utf-8")
    if "- Evidence entries: 2" not in readme:
        raise SystemExit(f"site evidence bundle after {context} README evidence count changed")


def assert_site_bundle_check_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    expected_evidence_counts: dict[str, int] | None = None,
) -> None:
    if expected_evidence_counts is None:
        expected_evidence_counts = {
            "executedWork": 0,
            "verificationResults": 0,
            "remainingRisks": 3,
            "nextActions": 0,
        }
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_no_ansi(result.stdout, cmd)
    payload = json.loads(result.stdout)
    if payload.get("status") != "pass" or payload.get("valid") is not True:
        raise SystemExit(f"site bundle check after {context} expected pass/valid output")
    if payload.get("externalCalls") is not False or payload.get("targetRepoMutation") is not False:
        raise SystemExit(f"site bundle check after {context} boundary flags changed")
    boundaries = payload.get("boundaries")
    if (
        not isinstance(boundaries, list)
        or "deterministic-local" not in boundaries
        or "no-external-mcp-calls" not in boundaries
        or "no-target-repo-mutation" not in boundaries
    ):
        raise SystemExit(f"site bundle check after {context} boundary list changed: {boundaries!r}")
    if payload.get("counts", {}).get("presentFiles") != 9:
        raise SystemExit(f"site bundle check after {context} expected 9 present files")
    if payload.get("counts", {}).get("verifiedChecksumFiles") != 8:
        raise SystemExit(f"site bundle check after {context} expected 8 verified checksum files")
    if payload.get("counts", {}).get("checksumFailures") != 0:
        raise SystemExit(f"site bundle check after {context} expected no checksum failures")
    if payload.get("counts", {}).get("verifiedGeneratedFiles") != 8:
        raise SystemExit(f"site bundle check after {context} expected 8 current-contract generated files")
    if payload.get("counts", {}).get("generatedFailures") != 0:
        raise SystemExit(f"site bundle check after {context} expected no generated bundle contract failures")
    generated_contract = payload.get("generatedContract")
    if not isinstance(generated_contract, dict) or generated_contract.get("available") is not True:
        raise SystemExit(f"site bundle check after {context} generated contract diagnostics missing")
    if generated_contract.get("expectedFiles") != 8 or generated_contract.get("verifiedFiles") != 8:
        raise SystemExit(f"site bundle check after {context} generated contract file counts changed")
    if generated_contract.get("driftFiles") != []:
        raise SystemExit(f"site bundle check after {context} expected no generated contract drift files")
    generated_files = generated_contract.get("files")
    if not isinstance(generated_files, list) or len(generated_files) != 8:
        raise SystemExit(f"site bundle check after {context} expected 8 generated contract file diagnostics")
    for item in generated_files:
        if item.get("present") is not True or item.get("matches") is not True:
            raise SystemExit(f"site bundle check after {context} generated contract file did not match: {item!r}")
        for key in ("expectedDigest", "actualDigest"):
            digest = item.get(key)
            if not isinstance(digest, str) or len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise SystemExit(f"site bundle check after {context} generated contract {key} is not a SHA-256 hex digest")
    repair_guidance = payload.get("repairGuidance")
    if not isinstance(repair_guidance, dict) or repair_guidance.get("available") is not True:
        raise SystemExit(f"site bundle check after {context} repair guidance missing")
    if repair_guidance.get("targetRepoMutation") is not False or repair_guidance.get("externalCalls") is not False:
        raise SystemExit(f"site bundle check after {context} repair guidance boundary flags changed")
    repair_command = repair_guidance.get("command")
    verify_command = repair_guidance.get("verifyCommand")
    if (
        not isinstance(repair_command, str)
        or "website-workspace.tasks.json --bundle --out " not in repair_command
        or " --force" not in repair_command
    ):
        raise SystemExit(f"site bundle check after {context} repair command changed: {repair_command!r}")
    if not isinstance(verify_command, str) or "--bundle-check --strict --json" not in verify_command:
        raise SystemExit(f"site bundle check after {context} repair verify command changed: {verify_command!r}")
    if payload.get("summary", {}).get("totalTasks") != 3:
        raise SystemExit(f"site bundle check after {context} expected 3 tasks")
    if payload.get("summary", {}).get("siteName") != "Korean SaaS marketing site":
        raise SystemExit(f"site bundle check after {context} site name changed")
    evidence_counts = payload.get("summary", {}).get("implementationEvidence")
    if not isinstance(evidence_counts, dict):
        raise SystemExit(f"site bundle check after {context} implementationEvidence counts missing")
    for key, expected in expected_evidence_counts.items():
        if evidence_counts.get(key) != expected:
            raise SystemExit(f"site bundle check after {context} evidence count {key} changed: {evidence_counts.get(key)!r}")
    if payload.get("summary", {}).get("checksumAlgorithm") != "sha256":
        raise SystemExit(f"site bundle check after {context} checksum algorithm changed")
    bundle_digest = payload.get("summary", {}).get("checksumBundleDigest")
    if not isinstance(bundle_digest, str) or len(bundle_digest) != 64:
        raise SystemExit(f"site bundle check after {context} bundle digest changed")
    if payload.get("mcpStatus") != "pass":
        raise SystemExit(f"site bundle check after {context} MCP status changed")
    if payload.get("mcpProbeStatus") != "pass":
        raise SystemExit(f"site bundle check after {context} MCP probe status changed")
    assert_site_mcp_probe_counts(
        payload.get("mcpProbeCounts"),
        context=context,
        label="site bundle check",
    )
    assert_site_mcp_probe_counts(
        payload.get("summary", {}).get("mcpProbeCounts"),
        context=context,
        label="site bundle check summary",
    )
    issue_ids = [issue.get("id") for issue in payload.get("issues", [])]
    if issue_ids != ["bundle-ready"]:
        raise SystemExit(f"site bundle check after {context} expected bundle-ready only, got {issue_ids!r}")


def assert_site_bundle_compare_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    expected_evidence_counts: dict[str, int] | None = None,
) -> None:
    if expected_evidence_counts is None:
        expected_evidence_counts = {
            "executedWork": 0,
            "verificationResults": 0,
            "remainingRisks": 3,
            "nextActions": 0,
        }
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_no_ansi(result.stdout, cmd)
    payload = json.loads(result.stdout)
    if payload.get("status") != "pass" or payload.get("valid") is not True:
        raise SystemExit(f"site bundle compare after {context} expected pass/valid output")
    if payload.get("sameBundle") is not True or payload.get("digestMatch") is not True:
        raise SystemExit(f"site bundle compare after {context} expected identical bundle digest")
    if payload.get("counts", {}).get("changedFiles") != 0:
        raise SystemExit(f"site bundle compare after {context} expected no changed files")
    for side in ("left", "right"):
        digest = payload.get(side, {}).get("checksumBundleDigest")
        if not isinstance(digest, str) or len(digest) != 64:
            raise SystemExit(f"site bundle compare after {context} {side} bundle digest changed")
        if payload.get(side, {}).get("siteName") != "Korean SaaS marketing site":
            raise SystemExit(f"site bundle compare after {context} {side} site name changed")
        assert_site_mcp_probe_counts(
            payload.get(side, {}).get("mcpProbeCounts"),
            context=context,
            label=f"site bundle compare {side}",
        )
        if payload.get(side, {}).get("verifiedGeneratedFiles") != 8 or payload.get(side, {}).get("generatedFailures") != 0:
            raise SystemExit(f"site bundle compare after {context} {side} generated bundle contract verification changed")
        if payload.get(side, {}).get("generatedDriftFiles") != []:
            raise SystemExit(f"site bundle compare after {context} {side} generated bundle contract drift changed")
        evidence_counts = payload.get(side, {}).get("implementationEvidence")
        if not isinstance(evidence_counts, dict):
            raise SystemExit(f"site bundle compare after {context} {side} implementationEvidence counts missing")
        for key, expected in expected_evidence_counts.items():
            if evidence_counts.get(key) != expected:
                raise SystemExit(f"site bundle compare after {context} {side} evidence count {key} changed: {evidence_counts.get(key)!r}")
    issue_ids = [issue.get("id") for issue in payload.get("issues", [])]
    if issue_ids != ["bundle-compare-identical"]:
        raise SystemExit(f"site bundle compare after {context} expected bundle-compare-identical only, got {issue_ids!r}")


def assert_site_bundle_handoff_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    expected_evidence_counts: dict[str, int] | None = None,
    expected_task_id: str = "task-accessibility",
    expected_selected_task_id: str | None = None,
) -> None:
    if expected_evidence_counts is None:
        expected_evidence_counts = {
            "executedWork": 0,
            "verificationResults": 0,
            "remainingRisks": 3,
            "nextActions": 0,
        }
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_no_ansi(result.stdout, cmd)
    payload = json.loads(result.stdout)
    if payload.get("status") != "pass" or payload.get("valid") is not True:
        raise SystemExit(f"site bundle handoff after {context} expected pass/valid output")
    expected_boundaries = [
        "deterministic-local",
        "no-external-mcp-calls",
        "no-target-repo-mutation",
        "no-lighthouse-axe-visual-diff",
        "target-repo-work-after-handoff",
    ]
    if payload.get("boundaries") != expected_boundaries:
        raise SystemExit(f"site bundle handoff after {context} boundary list changed: {payload.get('boundaries')!r}")
    if payload.get("externalCalls") is not False or payload.get("targetRepoMutation") is not False:
        raise SystemExit(f"site bundle handoff after {context} boundary flags changed")
    bundle = payload.get("bundle", {})
    source_bundle = payload.get("sourceBundle")
    if not isinstance(source_bundle, dict):
        raise SystemExit(f"site bundle handoff after {context} source bundle provenance missing")
    if bundle.get("sourceBundle") != source_bundle:
        raise SystemExit(f"site bundle handoff after {context} source bundle provenance is not mirrored under bundle")
    if (
        source_bundle.get("status") != "pass"
        or source_bundle.get("valid") is not True
        or source_bundle.get("sourceWorkspace") != "stdin"
        or source_bundle.get("siteName") != "Korean SaaS marketing site"
    ):
        raise SystemExit(f"site bundle handoff after {context} source bundle provenance summary changed: {source_bundle!r}")
    if (
        source_bundle.get("verifiedGeneratedFiles") != 8
        or source_bundle.get("expectedGeneratedFiles") != 8
        or source_bundle.get("verifiedChecksumFiles") != 8
        or source_bundle.get("expectedChecksumFiles") != 8
    ):
        raise SystemExit(f"site bundle handoff after {context} source bundle provenance verification counts changed: {source_bundle!r}")
    for key, expected_fragment in {
        "checkCommand": "--bundle-check --json",
        "strictCheckCommand": "--bundle-check --strict --json",
        "handoffCommand": "--bundle-handoff --json",
        "strictHandoffCommand": "--bundle-handoff --strict --json",
    }.items():
        command = source_bundle.get(key)
        if not isinstance(command, str) or expected_fragment not in command:
            raise SystemExit(f"site bundle handoff after {context} source bundle {key} changed: {command!r}")
    for key, expected_tail in {
        "checkCommandArgs": ["--bundle-check", "--json"],
        "strictCheckCommandArgs": ["--bundle-check", "--strict", "--json"],
        "handoffCommandArgs": ["--bundle-handoff", "--json"],
        "strictHandoffCommandArgs": ["--bundle-handoff", "--strict", "--json"],
    }.items():
        command_args = source_bundle.get(key)
        if (
            not isinstance(command_args, list)
            or len(command_args) != len(expected_tail) + 3
            or command_args[:2] != ["design-ai", "site"]
            or not isinstance(command_args[2], str)
            or command_args[-len(expected_tail):] != expected_tail
        ):
            raise SystemExit(f"site bundle handoff after {context} source bundle {key} changed: {command_args!r}")
    for policy_key in [
        "checkCommandRunPolicy",
        "strictCheckCommandRunPolicy",
        "handoffCommandRunPolicy",
        "strictHandoffCommandRunPolicy",
    ]:
        if source_bundle.get(policy_key) != "read-only":
            raise SystemExit(f"site bundle handoff after {context} source bundle {policy_key} changed: {source_bundle.get(policy_key)!r}")
    for key, expected_strict in {
        "checkCommandSafety": False,
        "strictCheckCommandSafety": True,
        "handoffCommandSafety": False,
        "strictHandoffCommandSafety": True,
    }.items():
        safety = source_bundle.get(key)
        if (
            not isinstance(safety, dict)
            or safety.get("runPolicy") != "read-only"
            or safety.get("safetyLevel") != "local-read-only"
            or safety.get("writesLocalFile") is not False
            or safety.get("outputFile") != ""
            or safety.get("mutates") != "none"
            or safety.get("externalCalls") is not False
            or safety.get("targetRepoMutation") is not False
            or safety.get("requiresCleanWorkspace") is not False
            or safety.get("requiresReviewBeforeMutation") is not False
            or safety.get("strict") is not expected_strict
        ):
            raise SystemExit(f"site bundle handoff after {context} source bundle {key} changed: {safety!r}")
    if bundle.get("siteName") != "Korean SaaS marketing site":
        raise SystemExit(f"site bundle handoff after {context} site name changed")
    if bundle.get("boundaries") != expected_boundaries:
        raise SystemExit(f"site bundle handoff after {context} bundle boundary list changed: {bundle.get('boundaries')!r}")
    if bundle.get("externalCalls") is not False or bundle.get("targetRepoMutation") is not False:
        raise SystemExit(f"site bundle handoff after {context} bundle boundary flags changed")
    command_manifest = payload.get("commandManifest")
    if not isinstance(command_manifest, dict) or bundle.get("commandManifest") != command_manifest:
        raise SystemExit(f"site bundle handoff after {context} command manifest missing or not mirrored")
    expected_effective_task_id = expected_selected_task_id or "task-accessibility"
    expected_command_keys = [
        "source.bundleCheck",
        "source.bundleCheck.strict",
        "source.bundleHandoff",
        "source.bundleHandoff.strict",
        "task.task-accessibility.handoff.default",
        "task.task-accessibility.handoff.strict",
        "task.task-homepage-cta.handoff.default",
        "task.task-homepage-cta.handoff.strict",
        "task.task-content-quality.handoff.default",
        "task.task-content-quality.handoff.strict",
    ]
    manifest_commands = command_manifest.get("commands")
    if (
        command_manifest.get("version") != 1
        or command_manifest.get("source") != "bundle-handoff"
        or command_manifest.get("commandCount") != 10
        or command_manifest.get("sourceCommandCount") != 4
        or command_manifest.get("taskCommandCount") != 6
        or command_manifest.get("readOnlyCount") != 4
        or command_manifest.get("localOutputFileCount") != 6
        or command_manifest.get("externalCallCount") != 0
        or command_manifest.get("targetRepoMutationCount") != 0
        or command_manifest.get("requiresCleanWorkspaceCount") != 0
        or command_manifest.get("requiresReviewBeforeMutationCount") != 0
        or command_manifest.get("defaultTaskId") != "task-accessibility"
        or command_manifest.get("selectedTaskId") != (expected_selected_task_id or "")
        or command_manifest.get("effectiveTaskId") != expected_effective_task_id
        or command_manifest.get("defaultStrictTaskCommandKey") != "task.task-accessibility.handoff.strict"
        or command_manifest.get("selectedStrictTaskCommandKey") != (f"task.{expected_selected_task_id}.handoff.strict" if expected_selected_task_id else "")
        or command_manifest.get("effectiveStrictTaskCommandKey") != f"task.{expected_effective_task_id}.handoff.strict"
        or not isinstance(manifest_commands, list)
        or [command.get("key") for command in manifest_commands] != expected_command_keys
    ):
        raise SystemExit(f"site bundle handoff after {context} command manifest summary changed: {command_manifest!r}")
    source_manifest_command = manifest_commands[0]
    effective_manifest_command = next(
        (command for command in manifest_commands if command.get("key") == f"task.{expected_effective_task_id}.handoff.strict"),
        None,
    )
    if (
        source_manifest_command.get("scope") != "source-bundle"
        or source_manifest_command.get("runPolicy") != "read-only"
        or source_manifest_command.get("strict") is not False
        or source_manifest_command.get("taskId") != ""
        or source_manifest_command.get("outputFile") != ""
        or not isinstance(source_manifest_command.get("commandArgs"), list)
        or source_manifest_command["commandArgs"][-2:] != ["--bundle-check", "--json"]
        or not isinstance(source_manifest_command.get("safety"), dict)
        or source_manifest_command["safety"].get("safetyLevel") != "local-read-only"
    ):
        raise SystemExit(f"site bundle handoff after {context} source command manifest entry changed: {source_manifest_command!r}")
    if (
        not isinstance(effective_manifest_command, dict)
        or effective_manifest_command.get("scope") != "task-handoff"
        or effective_manifest_command.get("runPolicy") != "writes-local-file"
        or effective_manifest_command.get("strict") is not True
        or effective_manifest_command.get("taskId") != expected_effective_task_id
        or effective_manifest_command.get("outputFile") != f"target-repo-{expected_effective_task_id}-handoff.md"
        or effective_manifest_command.get("effectiveTask") is not True
        or effective_manifest_command.get("selectedTask") is not bool(expected_selected_task_id)
        or effective_manifest_command.get("defaultTask") is not (expected_effective_task_id == "task-accessibility")
        or not isinstance(effective_manifest_command.get("safety"), dict)
        or effective_manifest_command["safety"].get("outputFile") != f"target-repo-{expected_effective_task_id}-handoff.md"
        or effective_manifest_command["safety"].get("targetRepoMutation") is not False
    ):
        raise SystemExit(f"site bundle handoff after {context} effective command manifest entry changed: {effective_manifest_command!r}")
    operator_runbook = payload.get("operatorRunbook")
    if not isinstance(operator_runbook, dict) or bundle.get("operatorRunbook") != operator_runbook:
        raise SystemExit(f"site bundle handoff after {context} operator runbook missing or not mirrored")
    runbook_stages = operator_runbook.get("stages")
    expected_stage_keys = [
        "verifySourceBundle",
        "refreshHandoffSnapshot",
        "writeEffectiveTaskPrompt",
        "executeInTargetRepo",
        "recordEvidence",
    ]
    expected_capture_field_keys = {
        "verifySourceBundle": ["strictBundleCheckOutput", "bundleDigest"],
        "refreshHandoffSnapshot": ["handoffJsonSnapshot"],
        "writeEffectiveTaskPrompt": ["promptOutputFile", "selectedTaskId"],
        "executeInTargetRepo": [
            "targetRepoChangedFiles",
            "targetRepoVerificationResults",
            "viewportAccessibilityNotes",
        ],
        "recordEvidence": ["finalEvidenceRecord", "remainingRisks"],
    }
    expected_capture_field_input_types = {
        "verifySourceBundle": ["textarea", "text"],
        "refreshHandoffSnapshot": ["textarea"],
        "writeEffectiveTaskPrompt": ["file-path", "text"],
        "executeInTargetRepo": ["list", "textarea", "textarea"],
        "recordEvidence": ["textarea", "textarea"],
    }
    expected_capture_field_value_shapes = {
        "verifySourceBundle": ["long-text", "short-text"],
        "refreshHandoffSnapshot": ["long-text"],
        "writeEffectiveTaskPrompt": ["file-path", "short-text"],
        "executeInTargetRepo": ["string-list", "long-text", "long-text"],
        "recordEvidence": ["long-text", "long-text"],
    }
    expected_capture_field_accepts_multiple = {
        "verifySourceBundle": [False, False],
        "refreshHandoffSnapshot": [False],
        "writeEffectiveTaskPrompt": [False, False],
        "executeInTargetRepo": [True, False, False],
        "recordEvidence": [False, False],
    }
    expected_capture_field_default_values = {
        "verifySourceBundle": ["", ""],
        "refreshHandoffSnapshot": [""],
        "writeEffectiveTaskPrompt": ["", ""],
        "executeInTargetRepo": [[], "", ""],
        "recordEvidence": ["", ""],
    }
    expected_capture_field_empty_values = {
        "verifySourceBundle": ["", ""],
        "refreshHandoffSnapshot": [""],
        "writeEffectiveTaskPrompt": ["", ""],
        "executeInTargetRepo": [[], "", ""],
        "recordEvidence": ["", ""],
    }
    expected_capture_field_placeholders = {
        "verifySourceBundle": [
            "Paste the strict bundle-check pass output or JSON status.",
            "Record the bundle digest or checksum summary.",
        ],
        "refreshHandoffSnapshot": ["Paste or link the refreshed strict handoff JSON snapshot when used."],
        "writeEffectiveTaskPrompt": ["target-repo-task-...-handoff.md", "task-..."],
        "executeInTargetRepo": [
            "List changed files from the target website repo.",
            "Record lint, typecheck, build, test, or equivalent command results.",
            "Record desktop/tablet/mobile checks, keyboard focus, contrast, and screen-reader notes.",
        ],
        "recordEvidence": [
            "Summarize changed files, verification, viewport/accessibility checks, risks, and digest.",
            "List unresolved risks, skipped checks, or follow-up tasks.",
        ],
    }
    expected_capture_field_requirement_labels = {
        "verifySourceBundle": ["Required", "Required"],
        "refreshHandoffSnapshot": ["Optional"],
        "writeEffectiveTaskPrompt": ["Required", "Required"],
        "executeInTargetRepo": ["Required", "Required", "Required"],
        "recordEvidence": ["Required", "Required"],
    }
    expected_capture_field_aria_labels = {
        "verifySourceBundle": [
            "Strict bundle-check output evidence (required)",
            "Bundle digest evidence (required)",
        ],
        "refreshHandoffSnapshot": ["Strict handoff JSON snapshot evidence (optional)"],
        "writeEffectiveTaskPrompt": [
            "Prompt output file evidence (required)",
            "Selected task id evidence (required)",
        ],
        "executeInTargetRepo": [
            "Target repo changed files evidence (required)",
            "Target repo verification results evidence (required)",
            "Viewport and accessibility notes evidence (required)",
        ],
        "recordEvidence": [
            "Final evidence record evidence (required)",
            "Remaining risks evidence (required)",
        ],
    }
    expected_capture_field_help_texts = {
        "verifySourceBundle": [
            "Required: paste a passing strict bundle-check result.",
            "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        ],
        "refreshHandoffSnapshot": ["Optional: paste the refreshed strict handoff JSON snapshot when available."],
        "writeEffectiveTaskPrompt": [
            "Required: record the local Markdown prompt file path generated for the selected task.",
            "Required: record the bundle task id used for the target-repo handoff prompt.",
        ],
        "executeInTargetRepo": [
            "Required: list at least one changed target-repo file or a no-change justification.",
            "Required: record target-repo verification commands and results.",
            "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
        ],
        "recordEvidence": [
            "Required: summarize changes, verification, viewport/accessibility checks, risks, and digest.",
            "Required: record unresolved risks, skipped checks, or confirm none remain.",
        ],
    }
    expected_capture_field_section_keys = {
        "verifySourceBundle": ["source-bundle-verification", "source-bundle-verification"],
        "refreshHandoffSnapshot": ["handoff-snapshot"],
        "writeEffectiveTaskPrompt": ["handoff-prompt-output", "handoff-prompt-output"],
        "executeInTargetRepo": [
            "target-repo-changes",
            "target-repo-verification",
            "viewport-accessibility-qa",
        ],
        "recordEvidence": ["final-handoff-evidence", "risk-record"],
    }
    expected_capture_field_section_labels = {
        "verifySourceBundle": ["Source bundle verification", "Source bundle verification"],
        "refreshHandoffSnapshot": ["Handoff snapshot"],
        "writeEffectiveTaskPrompt": ["Handoff prompt output", "Handoff prompt output"],
        "executeInTargetRepo": [
            "Target repo changes",
            "Target repo verification",
            "Viewport and accessibility QA",
        ],
        "recordEvidence": ["Final handoff evidence", "Risk record"],
    }
    expected_capture_section_keys = {
        "verifySourceBundle": ["source-bundle-verification"],
        "refreshHandoffSnapshot": ["handoff-snapshot"],
        "writeEffectiveTaskPrompt": ["handoff-prompt-output"],
        "executeInTargetRepo": [
            "target-repo-changes",
            "target-repo-verification",
            "viewport-accessibility-qa",
        ],
        "recordEvidence": ["final-handoff-evidence", "risk-record"],
    }
    expected_capture_section_labels = {
        "verifySourceBundle": ["Source bundle verification"],
        "refreshHandoffSnapshot": ["Handoff snapshot"],
        "writeEffectiveTaskPrompt": ["Handoff prompt output"],
        "executeInTargetRepo": [
            "Target repo changes",
            "Target repo verification",
            "Viewport and accessibility QA",
        ],
        "recordEvidence": ["Final handoff evidence", "Risk record"],
    }
    expected_capture_field_payload_namespaces = {
        "verifySourceBundle": ["sourceBundle", "sourceBundle"],
        "refreshHandoffSnapshot": ["handoffSnapshot"],
        "writeEffectiveTaskPrompt": ["handoffPrompt", "handoffPrompt"],
        "executeInTargetRepo": ["targetRepo", "targetRepo", "targetRepo"],
        "recordEvidence": ["handoffEvidence", "handoffEvidence"],
    }
    expected_capture_field_payload_paths = {
        "verifySourceBundle": [
            "sourceBundle.verification.strictBundleCheckOutput",
            "sourceBundle.verification.bundleDigest",
        ],
        "refreshHandoffSnapshot": ["handoffSnapshot.strictJson"],
        "writeEffectiveTaskPrompt": ["handoffPrompt.outputFile", "handoffPrompt.selectedTaskId"],
        "executeInTargetRepo": [
            "targetRepo.changedFiles",
            "targetRepo.verificationResults",
            "targetRepo.viewportAccessibilityNotes",
        ],
        "recordEvidence": ["handoffEvidence.finalRecord", "handoffEvidence.remainingRisks"],
    }
    expected_capture_payload_namespaces = {
        "verifySourceBundle": ["sourceBundle"],
        "refreshHandoffSnapshot": ["handoffSnapshot"],
        "writeEffectiveTaskPrompt": ["handoffPrompt"],
        "executeInTargetRepo": ["targetRepo"],
        "recordEvidence": ["handoffEvidence"],
    }
    expected_capture_payload_templates = {
        "verifySourceBundle": {
            "sourceBundle": {
                "verification": {
                    "strictBundleCheckOutput": "",
                    "bundleDigest": "",
                },
            },
        },
        "refreshHandoffSnapshot": {
            "handoffSnapshot": {
                "strictJson": "",
            },
        },
        "writeEffectiveTaskPrompt": {
            "handoffPrompt": {
                "outputFile": "",
                "selectedTaskId": "",
            },
        },
        "executeInTargetRepo": {
            "targetRepo": {
                "changedFiles": [],
                "verificationResults": "",
                "viewportAccessibilityNotes": "",
            },
        },
        "recordEvidence": {
            "handoffEvidence": {
                "finalRecord": "",
                "remainingRisks": "",
            },
        },
    }
    expected_capture_payload_flat_templates = {
        "verifySourceBundle": {
            "sourceBundle.verification.strictBundleCheckOutput": "",
            "sourceBundle.verification.bundleDigest": "",
        },
        "refreshHandoffSnapshot": {
            "handoffSnapshot.strictJson": "",
        },
        "writeEffectiveTaskPrompt": {
            "handoffPrompt.outputFile": "",
            "handoffPrompt.selectedTaskId": "",
        },
        "executeInTargetRepo": {
            "targetRepo.changedFiles": [],
            "targetRepo.verificationResults": "",
            "targetRepo.viewportAccessibilityNotes": "",
        },
        "recordEvidence": {
            "handoffEvidence.finalRecord": "",
            "handoffEvidence.remainingRisks": "",
        },
    }
    expected_capture_field_validation_rules = {
        "verifySourceBundle": ["non-empty-text", "checksum-or-digest-text"],
        "refreshHandoffSnapshot": ["optional-json-snapshot"],
        "writeEffectiveTaskPrompt": ["local-markdown-file-path", "task-id"],
        "executeInTargetRepo": ["non-empty-file-list", "verification-results", "viewport-accessibility-notes"],
        "recordEvidence": ["final-evidence-record", "risk-notes"],
    }
    expected_capture_field_min_lengths = {
        "verifySourceBundle": [20, 8],
        "refreshHandoffSnapshot": [0],
        "writeEffectiveTaskPrompt": [12, 5],
        "executeInTargetRepo": [1, 20, 20],
        "recordEvidence": [30, 10],
    }
    expected_required_capture_field_keys = {
        "verifySourceBundle": ["strictBundleCheckOutput", "bundleDigest"],
        "refreshHandoffSnapshot": [],
        "writeEffectiveTaskPrompt": ["promptOutputFile", "selectedTaskId"],
        "executeInTargetRepo": [
            "targetRepoChangedFiles",
            "targetRepoVerificationResults",
            "viewportAccessibilityNotes",
        ],
        "recordEvidence": ["finalEvidenceRecord", "remainingRisks"],
    }
    expected_optional_capture_field_keys = {
        "verifySourceBundle": [],
        "refreshHandoffSnapshot": ["handoffJsonSnapshot"],
        "writeEffectiveTaskPrompt": [],
        "executeInTargetRepo": [],
        "recordEvidence": [],
    }
    expected_next_capture_fields = [
        {
            "key": "strictBundleCheckOutput",
            "label": "Strict bundle-check output",
            "inputType": "textarea",
            "required": True,
            "evidenceTarget": "local-command-output",
            "placeholder": "Paste the strict bundle-check pass output or JSON status.",
            "validationRule": "non-empty-text",
            "minLength": 20,
            "example": "Status: pass; checksumFailures: 0; generatedFailures: 0",
            "validationHint": "Required: paste a passing strict bundle-check result.",
            "valueShape": "long-text",
            "acceptsMultiple": False,
            "defaultValue": "",
            "emptyValue": "",
            "requirementLabel": "Required",
            "ariaLabel": "Strict bundle-check output evidence (required)",
            "helpText": "Required: paste a passing strict bundle-check result.",
            "sectionKey": "source-bundle-verification",
            "sectionLabel": "Source bundle verification",
            "payloadNamespace": "sourceBundle",
            "payloadPath": "sourceBundle.verification.strictBundleCheckOutput",
        },
        {
            "key": "bundleDigest",
            "label": "Bundle digest",
            "inputType": "text",
            "required": True,
            "evidenceTarget": "local-command-output",
            "placeholder": "Record the bundle digest or checksum summary.",
            "validationRule": "checksum-or-digest-text",
            "minLength": 8,
            "example": "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
            "validationHint": "Required: record a digest, checksum, or equivalent bundle integrity summary.",
            "valueShape": "short-text",
            "acceptsMultiple": False,
            "defaultValue": "",
            "emptyValue": "",
            "requirementLabel": "Required",
            "ariaLabel": "Bundle digest evidence (required)",
            "helpText": "Required: record a digest, checksum, or equivalent bundle integrity summary.",
            "sectionKey": "source-bundle-verification",
            "sectionLabel": "Source bundle verification",
            "payloadNamespace": "sourceBundle",
            "payloadPath": "sourceBundle.verification.bundleDigest",
        },
    ]
    binding_keys = [
        "key",
        "label",
        "payloadNamespace",
        "payloadPath",
        "inputType",
        "valueShape",
        "acceptsMultiple",
        "required",
        "requirementLabel",
        "emptyValue",
        "validationRule",
        "minLength",
        "sectionKey",
        "sectionLabel",
        "ariaLabel",
    ]
    expected_next_capture_payload_bindings = [
        {key: field[key] for key in binding_keys}
        for field in expected_next_capture_fields
    ]
    expected_target_repo_changed_files_binding = {
        "key": "targetRepoChangedFiles",
        "label": "Target repo changed files",
        "payloadNamespace": "targetRepo",
        "payloadPath": "targetRepo.changedFiles",
        "inputType": "list",
        "valueShape": "string-list",
        "acceptsMultiple": True,
        "required": True,
        "requirementLabel": "Required",
        "emptyValue": [],
        "validationRule": "non-empty-file-list",
        "minLength": 1,
        "sectionKey": "target-repo-changes",
        "sectionLabel": "Target repo changes",
        "ariaLabel": "Target repo changed files evidence (required)",
    }
    expected_next_capture_validation_specs = [
        {
            **{key: field[key] for key in ["key", "label", "required", "minLength", "valueShape", "acceptsMultiple", "emptyValue"]},
            "rule": field["validationRule"],
            "severity": "error" if field["required"] else "info",
            "allowsEmpty": not field["required"],
            "message": field["validationHint"],
            "failureMessage": (
                f"Provide {field['label'].lower()} before marking this action complete."
                if field["required"]
                else f"Optional: provide {field['label'].lower()} when available."
            ),
        }
        for field in expected_next_capture_fields
    ]
    expected_next_initial_validation_states = [
        {
            "key": field["key"],
            "label": field["label"],
            "rule": field["validationRule"],
            "status": "missing-required" if field["required"] else "optional-empty",
            "statusLabel": "Missing required" if field["required"] else "Optional empty",
            "statusTone": "danger" if field["required"] else "info",
            "iconName": "alert-circle" if field["required"] else "info",
            "actionLabel": "Provide evidence" if field["required"] else "Add optional evidence",
            "helperText": "Required before completion" if field["required"] else "Can remain empty",
            "valid": not field["required"],
            "blocking": field["required"],
            "severity": "error" if field["required"] else "info",
            "required": field["required"],
            "allowsEmpty": not field["required"],
            "touched": False,
            "dirty": False,
            "valuePresent": False,
            "valueLength": 0,
            "minLength": field["minLength"],
            "valueShape": field["valueShape"],
            "acceptsMultiple": field["acceptsMultiple"],
            "emptyValue": field["emptyValue"],
            "payloadPath": field["payloadPath"],
            "message": (
                f"Provide {field['label'].lower()} before marking this action complete."
                if field["required"]
                else field["validationHint"]
            ),
        }
        for field in expected_next_capture_fields
    ]
    expected_next_initial_validation_display_metadata = [
        {
            "key": state["key"],
            "label": state["label"],
            "status": state["status"],
            "statusLabel": state["statusLabel"],
            "statusTone": state["statusTone"],
            "iconName": state["iconName"],
            "actionLabel": state["actionLabel"],
            "helperText": state["helperText"],
            "blocking": state["blocking"],
            "required": state["required"],
            "message": state["message"],
        }
        for state in expected_next_initial_validation_states
    ]
    expected_next_initial_validation_checklist = [
        {
            "key": state["key"],
            "label": state["label"],
            "status": state["status"],
            "statusLabel": state["statusLabel"],
            "statusTone": state["statusTone"],
            "iconName": state["iconName"],
            "actionLabel": state["actionLabel"],
            "helperText": state["helperText"],
            "required": state["required"],
            "blocking": state["blocking"],
            "completionBlocking": state["blocking"],
            "checkedInitially": state["valid"],
            "disabled": False,
            "message": state["message"],
            "payloadPath": state["payloadPath"],
        }
        for state in expected_next_initial_validation_states
    ]

    def expected_initial_validation_summary(states):
        blocking_states = [state for state in states if state["blocking"]]
        first_blocking = blocking_states[0] if blocking_states else {}
        status = "blocked" if blocking_states else "ready"
        return {
            "status": status,
            "statusLabel": "Blocked by required evidence" if status == "blocked" else "Ready for completion",
            "statusTone": "danger" if status == "blocked" else "success",
            "iconName": "alert-circle" if status == "blocked" else "check-circle",
            "actionLabel": "Provide required evidence" if status == "blocked" else "Continue",
            "helperText": (
                f"{len(blocking_states)} required evidence field(s) need input before completion."
                if status == "blocked"
                else "No required evidence is missing on first render."
            ),
            "fieldCount": len(states),
            "requiredCount": len([state for state in states if state["required"]]),
            "optionalCount": len([state for state in states if not state["required"]]),
            "validCount": len([state for state in states if state["valid"]]),
            "invalidCount": len([state for state in states if not state["valid"]]),
            "blockingCount": len(blocking_states),
            "nonBlockingCount": len([state for state in states if not state["blocking"]]),
            "missingRequiredCount": len([state for state in states if state["status"] == "missing-required"]),
            "optionalEmptyCount": len([state for state in states if state["status"] == "optional-empty"]),
            "dangerDisplayCount": len([state for state in states if state["statusTone"] == "danger"]),
            "infoDisplayCount": len([state for state in states if state["statusTone"] == "info"]),
            "allFieldsPristine": all(not state["dirty"] and not state["touched"] for state in states),
            "canCompleteInitially": len(blocking_states) == 0,
            "firstBlockingFieldKey": first_blocking.get("key", ""),
            "firstBlockingFieldLabel": first_blocking.get("label", ""),
            "firstBlockingMessage": first_blocking.get("message", ""),
        }

    expected_next_initial_validation_summary = expected_initial_validation_summary(
        expected_next_initial_validation_states
    )
    expected_optional_handoff_validation_spec = {
        "key": "handoffJsonSnapshot",
        "label": "Strict handoff JSON snapshot",
        "rule": "optional-json-snapshot",
        "severity": "info",
        "required": False,
        "allowsEmpty": True,
        "minLength": 0,
        "valueShape": "long-text",
        "acceptsMultiple": False,
        "emptyValue": "",
        "message": "Optional: paste the refreshed strict handoff JSON snapshot when available.",
        "failureMessage": "Optional: provide strict handoff json snapshot when available.",
    }
    expected_target_repo_changed_files_validation_spec = {
        "key": "targetRepoChangedFiles",
        "label": "Target repo changed files",
        "rule": "non-empty-file-list",
        "severity": "error",
        "required": True,
        "allowsEmpty": False,
        "minLength": 1,
        "valueShape": "string-list",
        "acceptsMultiple": True,
        "emptyValue": [],
        "message": "Required: list at least one changed target-repo file or a no-change justification.",
        "failureMessage": "Provide target repo changed files before marking this action complete.",
    }
    expected_optional_handoff_initial_validation_state = {
        "key": "handoffJsonSnapshot",
        "label": "Strict handoff JSON snapshot",
        "rule": "optional-json-snapshot",
        "status": "optional-empty",
        "statusLabel": "Optional empty",
        "statusTone": "info",
        "iconName": "info",
        "actionLabel": "Add optional evidence",
        "helperText": "Can remain empty",
        "valid": True,
        "blocking": False,
        "severity": "info",
        "required": False,
        "allowsEmpty": True,
        "touched": False,
        "dirty": False,
        "valuePresent": False,
        "valueLength": 0,
        "minLength": 0,
        "valueShape": "long-text",
        "acceptsMultiple": False,
        "emptyValue": "",
        "payloadPath": "handoffSnapshot.strictJson",
        "message": "Optional: paste the refreshed strict handoff JSON snapshot when available.",
    }
    expected_optional_handoff_initial_validation_display_metadata = {
        "key": "handoffJsonSnapshot",
        "label": "Strict handoff JSON snapshot",
        "status": "optional-empty",
        "statusLabel": "Optional empty",
        "statusTone": "info",
        "iconName": "info",
        "actionLabel": "Add optional evidence",
        "helperText": "Can remain empty",
        "blocking": False,
        "required": False,
        "message": "Optional: paste the refreshed strict handoff JSON snapshot when available.",
    }
    expected_optional_handoff_initial_validation_checklist = {
        "key": "handoffJsonSnapshot",
        "label": "Strict handoff JSON snapshot",
        "status": "optional-empty",
        "statusLabel": "Optional empty",
        "statusTone": "info",
        "iconName": "info",
        "actionLabel": "Add optional evidence",
        "helperText": "Can remain empty",
        "required": False,
        "blocking": False,
        "completionBlocking": False,
        "checkedInitially": True,
        "disabled": False,
        "message": "Optional: paste the refreshed strict handoff JSON snapshot when available.",
        "payloadPath": "handoffSnapshot.strictJson",
    }
    expected_optional_handoff_initial_validation_summary = expected_initial_validation_summary(
        [expected_optional_handoff_initial_validation_state]
    )
    expected_target_repo_changed_files_initial_validation_state = {
        "key": "targetRepoChangedFiles",
        "label": "Target repo changed files",
        "rule": "non-empty-file-list",
        "status": "missing-required",
        "statusLabel": "Missing required",
        "statusTone": "danger",
        "iconName": "alert-circle",
        "actionLabel": "Provide evidence",
        "helperText": "Required before completion",
        "valid": False,
        "blocking": True,
        "severity": "error",
        "required": True,
        "allowsEmpty": False,
        "touched": False,
        "dirty": False,
        "valuePresent": False,
        "valueLength": 0,
        "minLength": 1,
        "valueShape": "string-list",
        "acceptsMultiple": True,
        "emptyValue": [],
        "payloadPath": "targetRepo.changedFiles",
        "message": "Provide target repo changed files before marking this action complete.",
    }
    expected_target_repo_changed_files_initial_validation_display_metadata = {
        "key": "targetRepoChangedFiles",
        "label": "Target repo changed files",
        "status": "missing-required",
        "statusLabel": "Missing required",
        "statusTone": "danger",
        "iconName": "alert-circle",
        "actionLabel": "Provide evidence",
        "helperText": "Required before completion",
        "blocking": True,
        "required": True,
        "message": "Provide target repo changed files before marking this action complete.",
    }
    expected_target_repo_changed_files_initial_validation_checklist = {
        "key": "targetRepoChangedFiles",
        "label": "Target repo changed files",
        "status": "missing-required",
        "statusLabel": "Missing required",
        "statusTone": "danger",
        "iconName": "alert-circle",
        "actionLabel": "Provide evidence",
        "helperText": "Required before completion",
        "required": True,
        "blocking": True,
        "completionBlocking": True,
        "checkedInitially": False,
        "disabled": False,
        "message": "Provide target repo changed files before marking this action complete.",
        "payloadPath": "targetRepo.changedFiles",
    }
    expected_target_repo_initial_validation_summary = {
        **expected_initial_validation_summary(
            [
                expected_target_repo_changed_files_initial_validation_state,
                {
                    **expected_target_repo_changed_files_initial_validation_state,
                    "key": "targetRepoVerificationResults",
                    "label": "Target repo verification results",
                    "minLength": 20,
                    "valueShape": "long-text",
                    "acceptsMultiple": False,
                    "emptyValue": "",
                    "payloadPath": "targetRepo.verificationResults",
                    "message": "Provide target repo verification results before marking this action complete.",
                },
                {
                    **expected_target_repo_changed_files_initial_validation_state,
                    "key": "viewportAccessibilityNotes",
                    "label": "Viewport and accessibility notes",
                    "minLength": 20,
                    "valueShape": "long-text",
                    "acceptsMultiple": False,
                    "emptyValue": "",
                    "payloadPath": "targetRepo.viewportAccessibilityNotes",
                    "message": "Provide viewport and accessibility notes before marking this action complete.",
                },
            ]
        )
    }
    if (
        operator_runbook.get("version") != 1
        or operator_runbook.get("source") != "bundle-handoff"
        or operator_runbook.get("stageCount") != 5
        or operator_runbook.get("commandStageCount") != 3
        or operator_runbook.get("manualStageCount") != 2
        or operator_runbook.get("requiredStageCount") != 4
        or operator_runbook.get("optionalStageCount") != 1
        or operator_runbook.get("readOnlyCommandStageCount") != 2
        or operator_runbook.get("localOutputCommandStageCount") != 1
        or operator_runbook.get("externalCallCommandStageCount") != 0
        or operator_runbook.get("targetRepoMutationCommandStageCount") != 0
        or operator_runbook.get("effectiveTaskId") != expected_effective_task_id
        or operator_runbook.get("effectiveStrictTaskCommandKey") != f"task.{expected_effective_task_id}.handoff.strict"
        or operator_runbook.get("stageKeys") != expected_stage_keys
        or operator_runbook.get("stageLabelByKey") != {
            "verifySourceBundle": "Verify source bundle integrity",
            "refreshHandoffSnapshot": "Refresh strict handoff JSON snapshot",
            "writeEffectiveTaskPrompt": "Write effective task handoff prompt",
            "executeInTargetRepo": "Execute the task in the target website repo",
            "recordEvidence": "Record implementation evidence",
        }
        or operator_runbook.get("stageKindByKey") != {
            "verifySourceBundle": "read-only-gate",
            "refreshHandoffSnapshot": "read-only-preview",
            "writeEffectiveTaskPrompt": "local-output",
            "executeInTargetRepo": "manual-target-repo",
            "recordEvidence": "manual-reporting",
        }
        or operator_runbook.get("stageRequiredByKey") != {
            "verifySourceBundle": True,
            "refreshHandoffSnapshot": False,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": True,
            "recordEvidence": True,
        }
        or operator_runbook.get("stageRunPolicyByKey") != {
            "verifySourceBundle": "read-only",
            "refreshHandoffSnapshot": "read-only",
            "writeEffectiveTaskPrompt": "writes-local-file",
            "executeInTargetRepo": "manual-target-repo",
            "recordEvidence": "manual-target-repo",
        }
        or operator_runbook.get("stageSafetyLevelByKey") != {
            "verifySourceBundle": "local-read-only",
            "refreshHandoffSnapshot": "local-read-only",
            "writeEffectiveTaskPrompt": "local-output-file",
            "executeInTargetRepo": "operator-controlled-target-repo",
            "recordEvidence": "operator-controlled-target-repo",
        }
        or operator_runbook.get("stageCommandCountByKey") != {
            "verifySourceBundle": 1,
            "refreshHandoffSnapshot": 1,
            "writeEffectiveTaskPrompt": 1,
            "executeInTargetRepo": 0,
            "recordEvidence": 0,
        }
        or operator_runbook.get("stageCommandKeysByKey") != {
            "verifySourceBundle": ["source.bundleCheck.strict"],
            "refreshHandoffSnapshot": ["source.bundleHandoff.strict"],
            "writeEffectiveTaskPrompt": [f"task.{expected_effective_task_id}.handoff.strict"],
            "executeInTargetRepo": [],
            "recordEvidence": [],
        }
        or operator_runbook.get("stageCommandLabelsByKey") != {
            "verifySourceBundle": ["Strict bundle check JSON"],
            "refreshHandoffSnapshot": ["Strict bundle handoff JSON"],
            "writeEffectiveTaskPrompt": [f"Strict Task handoff: {expected_effective_task_id}"],
            "executeInTargetRepo": [],
            "recordEvidence": [],
        }
        or operator_runbook.get("stageCommandRunPoliciesByKey") != {
            "verifySourceBundle": ["read-only"],
            "refreshHandoffSnapshot": ["read-only"],
            "writeEffectiveTaskPrompt": ["writes-local-file"],
            "executeInTargetRepo": [],
            "recordEvidence": [],
        }
        or operator_runbook.get("stageCommandSafetyLevelsByKey") != {
            "verifySourceBundle": ["local-read-only"],
            "refreshHandoffSnapshot": ["local-read-only"],
            "writeEffectiveTaskPrompt": ["local-output-file"],
            "executeInTargetRepo": [],
            "recordEvidence": [],
        }
        or operator_runbook.get("stageActionTypeByKey") != {
            "verifySourceBundle": "run-local-gate",
            "refreshHandoffSnapshot": "refresh-local-preview",
            "writeEffectiveTaskPrompt": "write-local-output",
            "executeInTargetRepo": "manual-target-repo",
            "recordEvidence": "manual-evidence",
        }
        or operator_runbook.get("stageActionLabelByKey") != {
            "verifySourceBundle": "Run strict bundle check",
            "refreshHandoffSnapshot": "Refresh strict handoff JSON",
            "writeEffectiveTaskPrompt": "Write selected task prompt",
            "executeInTargetRepo": "Implement in target repo",
            "recordEvidence": "Record verification evidence",
        }
        or operator_runbook.get("stageActionButtonLabelsByKey") != {
            "verifySourceBundle": "Run Check",
            "refreshHandoffSnapshot": "Refresh JSON",
            "writeEffectiveTaskPrompt": "Write Prompt",
            "executeInTargetRepo": "Open Target Repo",
            "recordEvidence": "Record Evidence",
        }
        or operator_runbook.get("stageActionAffordanceByKey") != {
            "verifySourceBundle": "primary-command-button",
            "refreshHandoffSnapshot": "secondary-command-button",
            "writeEffectiveTaskPrompt": "local-output-button",
            "executeInTargetRepo": "manual-target-repo-step",
            "recordEvidence": "manual-evidence-step",
        }
        or operator_runbook.get("stageActionEnabledByKey") != {
            "verifySourceBundle": True,
            "refreshHandoffSnapshot": True,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": False,
            "recordEvidence": False,
        }
        or operator_runbook.get("stageActionStatusByKey") != {
            "verifySourceBundle": "ready",
            "refreshHandoffSnapshot": "optional",
            "writeEffectiveTaskPrompt": "ready",
            "executeInTargetRepo": "manual",
            "recordEvidence": "manual",
        }
        or operator_runbook.get("stageActionStatusLabelsByKey") != {
            "verifySourceBundle": "Ready",
            "refreshHandoffSnapshot": "Optional",
            "writeEffectiveTaskPrompt": "Ready",
            "executeInTargetRepo": "Manual",
            "recordEvidence": "Manual",
        }
        or operator_runbook.get("stageActionStatusToneByKey") != {
            "verifySourceBundle": "success",
            "refreshHandoffSnapshot": "neutral",
            "writeEffectiveTaskPrompt": "success",
            "executeInTargetRepo": "info",
            "recordEvidence": "info",
        }
        or operator_runbook.get("stageActionDisabledReasonCodeByKey") != {
            "verifySourceBundle": "",
            "refreshHandoffSnapshot": "",
            "writeEffectiveTaskPrompt": "",
            "executeInTargetRepo": "manual-target-repo-step",
            "recordEvidence": "manual-evidence-step",
        }
        or not isinstance(operator_runbook.get("stageActionDisabledReasonByKey"), dict)
        or operator_runbook["stageActionDisabledReasonByKey"].get("executeInTargetRepo")
        != "No local design-ai command is available for this stage; execute the generated prompt inside the target website repo."
        or operator_runbook["stageActionDisabledReasonByKey"].get("recordEvidence")
        != "No local design-ai command is available for this stage; record evidence after target-repo implementation and verification."
        or operator_runbook.get("stageActionPrerequisiteKeysByKey") != {
            "verifySourceBundle": [],
            "refreshHandoffSnapshot": [],
            "writeEffectiveTaskPrompt": ["verifySourceBundle"],
            "executeInTargetRepo": ["verifySourceBundle", "writeEffectiveTaskPrompt"],
            "recordEvidence": ["executeInTargetRepo"],
        }
        or operator_runbook.get("stageActionPrerequisiteCountByKey") != {
            "verifySourceBundle": 0,
            "refreshHandoffSnapshot": 0,
            "writeEffectiveTaskPrompt": 1,
            "executeInTargetRepo": 2,
            "recordEvidence": 1,
        }
        or operator_runbook.get("stageActionHasPrerequisitesByKey") != {
            "verifySourceBundle": False,
            "refreshHandoffSnapshot": False,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": True,
            "recordEvidence": True,
        }
        or operator_runbook.get("stageActionDependencyReasonCodeByKey") != {
            "verifySourceBundle": "",
            "refreshHandoffSnapshot": "",
            "writeEffectiveTaskPrompt": "requires-prerequisite-actions",
            "executeInTargetRepo": "requires-prerequisite-actions",
            "recordEvidence": "requires-prerequisite-actions",
        }
        or not isinstance(operator_runbook.get("stageActionDependencyReasonByKey"), dict)
        or operator_runbook["stageActionDependencyReasonByKey"].get("executeInTargetRepo")
        != "Complete Verify source bundle integrity and Write effective task handoff prompt before implementing in the target website repo."
        or not isinstance(operator_runbook.get("stageActionPrerequisiteLabelsByKey"), dict)
        or operator_runbook["stageActionPrerequisiteLabelsByKey"].get("executeInTargetRepo")
        != ["Verify source bundle integrity", "Write effective task handoff prompt"]
        or operator_runbook.get("stageActionBlockedStageKeysByKey") != {
            "verifySourceBundle": ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
            "refreshHandoffSnapshot": [],
            "writeEffectiveTaskPrompt": ["executeInTargetRepo"],
            "executeInTargetRepo": ["recordEvidence"],
            "recordEvidence": [],
        }
        or not isinstance(operator_runbook.get("stageActionBlockedStageLabelsByKey"), dict)
        or operator_runbook["stageActionBlockedStageLabelsByKey"].get("executeInTargetRepo")
        != ["Record implementation evidence"]
        or operator_runbook.get("stageActionBlockedStageCountByKey") != {
            "verifySourceBundle": 2,
            "refreshHandoffSnapshot": 0,
            "writeEffectiveTaskPrompt": 1,
            "executeInTargetRepo": 1,
            "recordEvidence": 0,
        }
        or operator_runbook.get("stageActionBlocksStagesByKey") != {
            "verifySourceBundle": True,
            "refreshHandoffSnapshot": False,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": True,
            "recordEvidence": False,
        }
        or not isinstance(operator_runbook.get("stageActionCompletionCriteriaByKey"), dict)
        or operator_runbook["stageActionCompletionCriteriaByKey"].get("verifySourceBundle")
        != ["Strict bundle check status is pass.", "Checksum and generated-file drift counts are zero."]
        or operator_runbook["stageActionCompletionCriteriaByKey"].get("executeInTargetRepo")
        != [
            "Target website repo has scoped implementation changes for the selected task.",
            "Target repo lint/typecheck/build or equivalent verification has been run.",
        ]
        or operator_runbook.get("stageActionCompletionCriteriaCountByKey") != {
            "verifySourceBundle": 2,
            "refreshHandoffSnapshot": 1,
            "writeEffectiveTaskPrompt": 2,
            "executeInTargetRepo": 2,
            "recordEvidence": 1,
        }
        or operator_runbook.get("stageActionHasCompletionCriteriaByKey") != {
            "verifySourceBundle": True,
            "refreshHandoffSnapshot": True,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": True,
            "recordEvidence": True,
        }
        or not isinstance(operator_runbook.get("stageActionEvidenceRequirementsByKey"), dict)
        or operator_runbook["stageActionEvidenceRequirementsByKey"].get("verifySourceBundle")
        != ["Strict bundle-check command output or JSON status.", "Bundle digest and zero drift counts."]
        or operator_runbook["stageActionEvidenceRequirementsByKey"].get("executeInTargetRepo")
        != [
            "Target repo changed file list.",
            "Target repo verification command results.",
            "Viewport and accessibility check notes for affected pages.",
        ]
        or operator_runbook.get("stageActionEvidenceRequirementCountByKey") != {
            "verifySourceBundle": 2,
            "refreshHandoffSnapshot": 1,
            "writeEffectiveTaskPrompt": 2,
            "executeInTargetRepo": 3,
            "recordEvidence": 1,
        }
        or operator_runbook.get("stageActionRequiresEvidenceByKey") != {
            "verifySourceBundle": True,
            "refreshHandoffSnapshot": True,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": True,
            "recordEvidence": True,
        }
        or operator_runbook.get("stageActionEvidenceTargetByKey") != {
            "verifySourceBundle": "local-command-output",
            "refreshHandoffSnapshot": "local-command-output",
            "writeEffectiveTaskPrompt": "local-output-file",
            "executeInTargetRepo": "target-repo-working-tree",
            "recordEvidence": "handoff-evidence-record",
        }
        or operator_runbook.get("stageActionEvidenceTargetLabelByKey") != {
            "verifySourceBundle": "Local command output",
            "refreshHandoffSnapshot": "Local command output",
            "writeEffectiveTaskPrompt": "Local output file",
            "executeInTargetRepo": "Target repo working tree",
            "recordEvidence": "Handoff evidence record",
        }
        or operator_runbook.get("stageActionEvidenceCaptureFieldKeysByKey") != expected_capture_field_keys
        or operator_runbook.get("stageActionEvidenceCaptureFieldLabelsByKey", {}).get("verifySourceBundle")
        != ["Strict bundle-check output", "Bundle digest"]
        or operator_runbook.get("stageActionEvidenceCaptureFieldInputTypesByKey") != expected_capture_field_input_types
        or operator_runbook.get("stageActionEvidenceCaptureFieldValueShapesByKey") != expected_capture_field_value_shapes
        or operator_runbook.get("stageActionEvidenceCaptureFieldAcceptsMultipleByKey") != expected_capture_field_accepts_multiple
        or operator_runbook.get("stageActionEvidenceCaptureFieldDefaultValuesByKey") != expected_capture_field_default_values
        or operator_runbook.get("stageActionEvidenceCaptureFieldEmptyValuesByKey") != expected_capture_field_empty_values
        or operator_runbook.get("stageActionEvidenceCaptureFieldPlaceholdersByKey") != expected_capture_field_placeholders
        or operator_runbook.get("stageActionEvidenceCaptureFieldRequirementLabelsByKey") != expected_capture_field_requirement_labels
        or operator_runbook.get("stageActionEvidenceCaptureFieldAriaLabelsByKey") != expected_capture_field_aria_labels
        or operator_runbook.get("stageActionEvidenceCaptureFieldHelpTextsByKey") != expected_capture_field_help_texts
        or operator_runbook.get("stageActionEvidenceCaptureFieldSectionKeysByKey") != expected_capture_field_section_keys
        or operator_runbook.get("stageActionEvidenceCaptureFieldSectionLabelsByKey") != expected_capture_field_section_labels
        or operator_runbook.get("stageActionEvidenceCaptureSectionKeysByKey") != expected_capture_section_keys
        or operator_runbook.get("stageActionEvidenceCaptureSectionLabelsByKey") != expected_capture_section_labels
        or operator_runbook.get("stageActionEvidenceCaptureSectionCountByKey") != {
            "verifySourceBundle": 1,
            "refreshHandoffSnapshot": 1,
            "writeEffectiveTaskPrompt": 1,
            "executeInTargetRepo": 3,
            "recordEvidence": 2,
        }
        or operator_runbook.get("stageActionEvidenceCaptureFieldPayloadNamespacesByKey")
        != expected_capture_field_payload_namespaces
        or operator_runbook.get("stageActionEvidenceCaptureFieldPayloadPathsByKey")
        != expected_capture_field_payload_paths
        or operator_runbook.get("stageActionEvidenceCapturePayloadNamespacesByKey")
        != expected_capture_payload_namespaces
        or operator_runbook.get("stageActionEvidenceCapturePayloadNamespaceCountByKey")
        != {
            "verifySourceBundle": 1,
            "refreshHandoffSnapshot": 1,
            "writeEffectiveTaskPrompt": 1,
            "executeInTargetRepo": 1,
            "recordEvidence": 1,
        }
        or operator_runbook.get("stageActionEvidenceCapturePayloadTemplateByKey")
        != expected_capture_payload_templates
        or operator_runbook.get("stageActionEvidenceCapturePayloadFlatTemplateByKey")
        != expected_capture_payload_flat_templates
        or operator_runbook.get("stageActionEvidenceCapturePayloadBindingsByKey", {}).get("verifySourceBundle")
        != expected_next_capture_payload_bindings
        or operator_runbook.get("stageActionEvidenceCapturePayloadBindingsByKey", {})
        .get("executeInTargetRepo", [{}])[0]
        != expected_target_repo_changed_files_binding
        or operator_runbook.get("stageActionEvidenceCaptureValidationSpecsByKey", {}).get("verifySourceBundle")
        != expected_next_capture_validation_specs
        or operator_runbook.get("stageActionEvidenceCaptureValidationSpecsByKey", {})
        .get("refreshHandoffSnapshot", [{}])[0]
        != expected_optional_handoff_validation_spec
        or operator_runbook.get("stageActionEvidenceCaptureValidationSpecsByKey", {})
        .get("executeInTargetRepo", [{}])[0]
        != expected_target_repo_changed_files_validation_spec
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationStatesByKey", {}).get("verifySourceBundle")
        != expected_next_initial_validation_states
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey", {}).get(
            "verifySourceBundle"
        )
        != expected_next_initial_validation_display_metadata
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationChecklistByKey", {}).get(
            "verifySourceBundle"
        )
        != expected_next_initial_validation_checklist
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationSummaryByKey", {}).get(
            "verifySourceBundle"
        )
        != expected_next_initial_validation_summary
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationStatesByKey", {})
        .get("refreshHandoffSnapshot", [{}])[0]
        != expected_optional_handoff_initial_validation_state
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey", {})
        .get("refreshHandoffSnapshot", [{}])[0]
        != expected_optional_handoff_initial_validation_display_metadata
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationChecklistByKey", {})
        .get("refreshHandoffSnapshot", [{}])[0]
        != expected_optional_handoff_initial_validation_checklist
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationSummaryByKey", {}).get(
            "refreshHandoffSnapshot"
        )
        != expected_optional_handoff_initial_validation_summary
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationStatesByKey", {})
        .get("executeInTargetRepo", [{}])[0]
        != expected_target_repo_changed_files_initial_validation_state
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey", {})
        .get("executeInTargetRepo", [{}])[0]
        != expected_target_repo_changed_files_initial_validation_display_metadata
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationChecklistByKey", {})
        .get("executeInTargetRepo", [{}])[0]
        != expected_target_repo_changed_files_initial_validation_checklist
        or operator_runbook.get("stageActionEvidenceCaptureInitialValidationSummaryByKey", {}).get(
            "executeInTargetRepo"
        )
        != expected_target_repo_initial_validation_summary
        or operator_runbook.get("stageActionEvidenceCaptureFieldValidationRulesByKey") != expected_capture_field_validation_rules
        or operator_runbook.get("stageActionEvidenceCaptureFieldMinLengthsByKey") != expected_capture_field_min_lengths
        or operator_runbook.get("stageActionEvidenceCaptureFieldExamplesByKey", {}).get("verifySourceBundle")
        != [
            "Status: pass; checksumFailures: 0; generatedFailures: 0",
            "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
        ]
        or operator_runbook.get("stageActionEvidenceCaptureFieldValidationHintsByKey", {}).get("verifySourceBundle")
        != [
            "Required: paste a passing strict bundle-check result.",
            "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        ]
        or operator_runbook.get("stageActionRequiredEvidenceCaptureFieldKeysByKey") != expected_required_capture_field_keys
        or operator_runbook.get("stageActionOptionalEvidenceCaptureFieldKeysByKey") != expected_optional_capture_field_keys
        or operator_runbook.get("stageActionEvidenceCaptureFieldCountByKey") != {
            "verifySourceBundle": 2,
            "refreshHandoffSnapshot": 1,
            "writeEffectiveTaskPrompt": 2,
            "executeInTargetRepo": 3,
            "recordEvidence": 2,
        }
        or operator_runbook.get("stageActionRequiredEvidenceCaptureFieldCountByKey") != {
            "verifySourceBundle": 2,
            "refreshHandoffSnapshot": 0,
            "writeEffectiveTaskPrompt": 2,
            "executeInTargetRepo": 3,
            "recordEvidence": 2,
        }
        or operator_runbook.get("stageActionOptionalEvidenceCaptureFieldCountByKey") != {
            "verifySourceBundle": 0,
            "refreshHandoffSnapshot": 1,
            "writeEffectiveTaskPrompt": 0,
            "executeInTargetRepo": 0,
            "recordEvidence": 0,
        }
        or operator_runbook.get("stageActionHasEvidenceCaptureFieldsByKey") != {
            "verifySourceBundle": True,
            "refreshHandoffSnapshot": True,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": True,
            "recordEvidence": True,
        }
        or not isinstance(operator_runbook.get("stageActionEvidenceCaptureFieldsByKey"), dict)
        or operator_runbook["stageActionEvidenceCaptureFieldsByKey"].get("verifySourceBundle") != expected_next_capture_fields
        or operator_runbook["stageActionEvidenceCaptureFieldsByKey"].get("executeInTargetRepo", [{}])[2].get("key")
        != "viewportAccessibilityNotes"
        or not isinstance(operator_runbook.get("stageActionInstructionsByKey"), dict)
        or operator_runbook["stageActionInstructionsByKey"].get("verifySourceBundle")
        != "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff."
        or operator_runbook["stageActionInstructionsByKey"].get("writeEffectiveTaskPrompt")
        != "Write the selected task prompt to a local Markdown file before switching into the target website repo."
        or operator_runbook["stageActionInstructionsByKey"].get("executeInTargetRepo")
        != "Manual: open the generated prompt in the target website repo, inspect architecture, implement the scoped task, and run target-repo verification."
        or operator_runbook.get("actionSummary") != {
            "totalActionCount": 5,
            "commandActionCount": 3,
            "manualActionCount": 2,
            "enabledActionCount": 3,
            "disabledActionCount": 2,
            "manualDisabledActionCount": 2,
            "actionWithPrerequisiteCount": 3,
            "maxActionPrerequisiteCount": 2,
            "actionWithDependencyReasonCount": 3,
            "actionBlockingOtherActionCount": 3,
            "maxActionBlockedStageCount": 2,
            "actionWithCompletionCriteriaCount": 5,
            "totalActionCompletionCriteriaCount": 8,
            "maxActionCompletionCriteriaCount": 2,
            "actionRequiringEvidenceCount": 5,
            "totalActionEvidenceRequirementCount": 9,
            "maxActionEvidenceRequirementCount": 3,
            "localCommandEvidenceActionCount": 2,
            "localOutputEvidenceActionCount": 1,
            "targetRepoEvidenceActionCount": 1,
            "handoffRecordEvidenceActionCount": 1,
            "actionWithEvidenceCaptureFieldCount": 5,
            "actionWithRequiredEvidenceCaptureFieldCount": 4,
            "actionWithOptionalEvidenceCaptureFieldCount": 1,
            "totalActionEvidenceCaptureFieldCount": 10,
            "totalRequiredActionEvidenceCaptureFieldCount": 9,
            "totalOptionalActionEvidenceCaptureFieldCount": 1,
            "maxActionEvidenceCaptureFieldCount": 3,
            "textareaEvidenceCaptureFieldCount": 6,
            "textEvidenceCaptureFieldCount": 2,
            "filePathEvidenceCaptureFieldCount": 1,
            "listEvidenceCaptureFieldCount": 1,
            "longTextEvidenceCaptureFieldCount": 6,
            "shortTextEvidenceCaptureFieldCount": 2,
            "filePathValueEvidenceCaptureFieldCount": 1,
            "stringListEvidenceCaptureFieldCount": 1,
            "multiValueEvidenceCaptureFieldCount": 1,
            "singleValueEvidenceCaptureFieldCount": 9,
            "emptyStringEvidenceCaptureFieldCount": 9,
            "emptyListEvidenceCaptureFieldCount": 1,
            "placeholderEvidenceCaptureFieldCount": 10,
            "ariaLabelEvidenceCaptureFieldCount": 10,
            "helpTextEvidenceCaptureFieldCount": 10,
            "sectionedEvidenceCaptureFieldCount": 10,
            "uniqueEvidenceCaptureSectionCount": 8,
            "actionWithMultipleEvidenceCaptureSectionCount": 2,
            "maxActionEvidenceCaptureSectionCount": 3,
            "payloadMappedEvidenceCaptureFieldCount": 10,
            "uniqueEvidenceCapturePayloadNamespaceCount": 5,
            "actionWithMultipleEvidenceCapturePayloadNamespaceCount": 0,
            "maxActionEvidenceCapturePayloadNamespaceCount": 1,
            "actionWithEvidenceCapturePayloadTemplateCount": 5,
            "evidenceCapturePayloadTemplatePathCount": 10,
            "maxActionEvidenceCapturePayloadTemplatePathCount": 3,
            "actionWithEvidenceCapturePayloadBindingCount": 5,
            "evidenceCapturePayloadBindingCount": 10,
            "requiredEvidenceCapturePayloadBindingCount": 9,
            "optionalEvidenceCapturePayloadBindingCount": 1,
            "multiValueEvidenceCapturePayloadBindingCount": 1,
            "actionWithEvidenceCaptureValidationSpecCount": 5,
            "evidenceCaptureValidationSpecCount": 10,
            "requiredEvidenceCaptureValidationSpecCount": 9,
            "optionalEvidenceCaptureValidationSpecCount": 1,
            "errorEvidenceCaptureValidationSpecCount": 9,
            "infoEvidenceCaptureValidationSpecCount": 1,
            "multiValueEvidenceCaptureValidationSpecCount": 1,
            "actionWithEvidenceCaptureInitialValidationStateCount": 5,
            "evidenceCaptureInitialValidationStateCount": 10,
            "validInitialEvidenceCaptureStateCount": 1,
            "invalidInitialEvidenceCaptureStateCount": 9,
            "blockingInitialEvidenceCaptureStateCount": 9,
            "optionalEmptyInitialEvidenceCaptureStateCount": 1,
            "missingRequiredInitialEvidenceCaptureStateCount": 9,
            "pristineInitialEvidenceCaptureStateCount": 10,
            "actionWithEvidenceCaptureInitialValidationDisplayMetadataCount": 5,
            "evidenceCaptureInitialValidationDisplayMetadataCount": 10,
            "dangerInitialEvidenceCaptureDisplayMetadataCount": 9,
            "infoInitialEvidenceCaptureDisplayMetadataCount": 1,
            "blockingInitialEvidenceCaptureDisplayMetadataCount": 9,
            "nonBlockingInitialEvidenceCaptureDisplayMetadataCount": 1,
            "actionWithEvidenceCaptureInitialValidationSummaryCount": 5,
            "blockedInitialEvidenceCaptureSummaryActionCount": 4,
            "readyInitialEvidenceCaptureSummaryActionCount": 1,
            "completableInitialEvidenceCaptureSummaryActionCount": 1,
            "nonCompletableInitialEvidenceCaptureSummaryActionCount": 4,
            "initialEvidenceCaptureSummaryBlockingFieldCount": 9,
            "initialEvidenceCaptureSummaryMissingRequiredFieldCount": 9,
            "initialEvidenceCaptureSummaryOptionalEmptyFieldCount": 1,
            "actionWithEvidenceCaptureInitialValidationChecklistCount": 5,
            "evidenceCaptureInitialValidationChecklistItemCount": 10,
            "checkedInitialEvidenceCaptureChecklistItemCount": 1,
            "uncheckedInitialEvidenceCaptureChecklistItemCount": 9,
            "blockingInitialEvidenceCaptureChecklistItemCount": 9,
            "nonBlockingInitialEvidenceCaptureChecklistItemCount": 1,
            "requiredInitialEvidenceCaptureChecklistItemCount": 9,
            "optionalInitialEvidenceCaptureChecklistItemCount": 1,
            "validatedEvidenceCaptureFieldCount": 10,
            "requiredValidatedEvidenceCaptureFieldCount": 9,
            "optionalValidatedEvidenceCaptureFieldCount": 1,
            "minEvidenceCaptureFieldLengthTotal": 126,
            "maxEvidenceCaptureFieldMinLength": 30,
            "requiredActionCount": 4,
            "optionalActionCount": 1,
            "readOnlyActionCount": 2,
            "localOutputActionCount": 1,
            "outputFileActionCount": 1,
            "externalCallActionCount": 0,
            "targetRepoMutationActionCount": 0,
            "nextActionKey": "verifySourceBundle",
            "nextActionType": "run-local-gate",
            "nextActionLabel": "Run strict bundle check",
            "nextActionEnabled": True,
            "nextActionStatus": "ready",
            "nextActionStatusLabel": "Ready",
            "nextActionStatusTone": "success",
            "nextActionDisabledReasonCode": "",
            "nextActionPrerequisiteKeys": [],
            "nextActionPrerequisiteLabels": [],
            "nextActionPrerequisiteCount": 0,
            "nextActionHasPrerequisites": False,
            "nextActionDependencyReasonCode": "",
            "nextActionDependencyReason": "",
            "nextActionBlockedStageKeys": ["writeEffectiveTaskPrompt", "executeInTargetRepo"],
            "nextActionBlockedStageLabels": [
                "Write effective task handoff prompt",
                "Execute the task in the target website repo",
            ],
            "nextActionBlockedStageCount": 2,
            "nextActionBlocksStages": True,
            "nextActionCompletionCriteria": [
                "Strict bundle check status is pass.",
                "Checksum and generated-file drift counts are zero.",
            ],
            "nextActionCompletionCriteriaCount": 2,
            "nextActionHasCompletionCriteria": True,
            "nextActionEvidenceRequirements": [
                "Strict bundle-check command output or JSON status.",
                "Bundle digest and zero drift counts.",
            ],
            "nextActionEvidenceRequirementCount": 2,
            "nextActionRequiresEvidence": True,
            "nextActionEvidenceTarget": "local-command-output",
            "nextActionEvidenceTargetLabel": "Local command output",
            "nextActionEvidenceCaptureFields": expected_next_capture_fields,
            "nextActionEvidenceCaptureFieldKeys": ["strictBundleCheckOutput", "bundleDigest"],
            "nextActionEvidenceCaptureFieldLabels": ["Strict bundle-check output", "Bundle digest"],
            "nextActionEvidenceCaptureFieldPlaceholders": [
                "Paste the strict bundle-check pass output or JSON status.",
                "Record the bundle digest or checksum summary.",
            ],
            "nextActionEvidenceCaptureFieldRequirementLabels": ["Required", "Required"],
            "nextActionEvidenceCaptureFieldAriaLabels": [
                "Strict bundle-check output evidence (required)",
                "Bundle digest evidence (required)",
            ],
            "nextActionEvidenceCaptureFieldHelpTexts": [
                "Required: paste a passing strict bundle-check result.",
                "Required: record a digest, checksum, or equivalent bundle integrity summary.",
            ],
            "nextActionEvidenceCaptureFieldSectionKeys": [
                "source-bundle-verification",
                "source-bundle-verification",
            ],
            "nextActionEvidenceCaptureFieldSectionLabels": [
                "Source bundle verification",
                "Source bundle verification",
            ],
            "nextActionEvidenceCaptureSectionKeys": ["source-bundle-verification"],
            "nextActionEvidenceCaptureSectionLabels": ["Source bundle verification"],
            "nextActionEvidenceCaptureSectionCount": 1,
            "nextActionEvidenceCaptureFieldPayloadNamespaces": ["sourceBundle", "sourceBundle"],
            "nextActionEvidenceCaptureFieldPayloadPaths": [
                "sourceBundle.verification.strictBundleCheckOutput",
                "sourceBundle.verification.bundleDigest",
            ],
            "nextActionEvidenceCapturePayloadNamespaces": ["sourceBundle"],
            "nextActionEvidenceCapturePayloadNamespaceCount": 1,
            "nextActionEvidenceCapturePayloadTemplate": expected_capture_payload_templates["verifySourceBundle"],
            "nextActionEvidenceCapturePayloadFlatTemplate": expected_capture_payload_flat_templates["verifySourceBundle"],
            "nextActionEvidenceCapturePayloadBindings": expected_next_capture_payload_bindings,
            "nextActionEvidenceCaptureValidationSpecs": expected_next_capture_validation_specs,
            "nextActionEvidenceCaptureInitialValidationStates": expected_next_initial_validation_states,
            "nextActionEvidenceCaptureInitialValidationDisplayMetadata": expected_next_initial_validation_display_metadata,
            "nextActionEvidenceCaptureInitialValidationChecklist": expected_next_initial_validation_checklist,
            "nextActionEvidenceCaptureInitialValidationSummary": expected_next_initial_validation_summary,
            "nextActionEvidenceCaptureFieldInputTypes": ["textarea", "text"],
            "nextActionEvidenceCaptureFieldValueShapes": ["long-text", "short-text"],
            "nextActionEvidenceCaptureFieldAcceptsMultiple": [False, False],
            "nextActionEvidenceCaptureFieldDefaultValues": ["", ""],
            "nextActionEvidenceCaptureFieldEmptyValues": ["", ""],
            "nextActionEvidenceCaptureFieldValidationRules": ["non-empty-text", "checksum-or-digest-text"],
            "nextActionEvidenceCaptureFieldMinLengths": [20, 8],
            "nextActionEvidenceCaptureFieldExamples": [
                "Status: pass; checksumFailures: 0; generatedFailures: 0",
                "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
            ],
            "nextActionEvidenceCaptureFieldValidationHints": [
                "Required: paste a passing strict bundle-check result.",
                "Required: record a digest, checksum, or equivalent bundle integrity summary.",
            ],
            "nextActionRequiredEvidenceCaptureFieldKeys": ["strictBundleCheckOutput", "bundleDigest"],
            "nextActionOptionalEvidenceCaptureFieldKeys": [],
            "nextActionEvidenceCaptureFieldCount": 2,
            "nextActionRequiredEvidenceCaptureFieldCount": 2,
            "nextActionOptionalEvidenceCaptureFieldCount": 0,
            "nextActionHasEvidenceCaptureFields": True,
            "nextActionRunPolicy": "read-only",
            "nextActionSafetyLevel": "local-read-only",
            "firstRequiredCommandStageKey": "verifySourceBundle",
            "firstLocalOutputStageKey": "writeEffectiveTaskPrompt",
            "firstManualStageKey": "executeInTargetRepo",
            "firstRequiredManualStageKey": "executeInTargetRepo",
            "firstEvidenceStageKey": "recordEvidence",
            "firstActionWithPrerequisiteKey": "writeEffectiveTaskPrompt",
            "firstManualActionWithPrerequisiteKey": "executeInTargetRepo",
            "firstEvidenceActionWithPrerequisiteKey": "recordEvidence",
            "firstActionWithDependencyReasonKey": "writeEffectiveTaskPrompt",
            "firstActionBlockingOtherActionKey": "verifySourceBundle",
            "firstActionWithCompletionCriteriaKey": "verifySourceBundle",
            "firstManualActionWithCompletionCriteriaKey": "executeInTargetRepo",
            "firstActionRequiringEvidenceKey": "verifySourceBundle",
            "firstManualActionRequiringEvidenceKey": "executeInTargetRepo",
            "firstEvidenceRecordingActionKey": "recordEvidence",
            "firstTargetRepoEvidenceActionKey": "executeInTargetRepo",
            "firstLocalOutputEvidenceActionKey": "writeEffectiveTaskPrompt",
            "firstActionWithEvidenceCaptureFieldKey": "verifySourceBundle",
            "firstActionWithOptionalEvidenceCaptureFieldKey": "refreshHandoffSnapshot",
            "firstManualActionWithEvidenceCaptureFieldKey": "executeInTargetRepo",
            "firstTextareaEvidenceCaptureActionKey": "verifySourceBundle",
            "firstMultiValueEvidenceCaptureActionKey": "executeInTargetRepo",
            "firstValidationRuleEvidenceCaptureActionKey": "verifySourceBundle",
            "requiresTargetRepoWork": True,
            "requiresEvidenceReturn": True,
            "externalCalls": False,
            "targetRepoMutation": False,
        }
        or operator_runbook.get("stageHasCommandsByKey") != {
            "verifySourceBundle": True,
            "refreshHandoffSnapshot": True,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": False,
            "recordEvidence": False,
        }
        or operator_runbook.get("stageManualByKey") != {
            "verifySourceBundle": False,
            "refreshHandoffSnapshot": False,
            "writeEffectiveTaskPrompt": False,
            "executeInTargetRepo": True,
            "recordEvidence": True,
        }
        or operator_runbook.get("stageWritesLocalFileByKey") != {
            "verifySourceBundle": False,
            "refreshHandoffSnapshot": False,
            "writeEffectiveTaskPrompt": True,
            "executeInTargetRepo": False,
            "recordEvidence": False,
        }
        or operator_runbook.get("stageExternalCallsByKey") != {
            "verifySourceBundle": False,
            "refreshHandoffSnapshot": False,
            "writeEffectiveTaskPrompt": False,
            "executeInTargetRepo": False,
            "recordEvidence": False,
        }
        or operator_runbook.get("stageTargetRepoMutationByKey") != {
            "verifySourceBundle": False,
            "refreshHandoffSnapshot": False,
            "writeEffectiveTaskPrompt": False,
            "executeInTargetRepo": False,
            "recordEvidence": False,
        }
        or operator_runbook.get("commandStageKeys") != [
            "verifySourceBundle",
            "refreshHandoffSnapshot",
            "writeEffectiveTaskPrompt",
        ]
        or operator_runbook.get("manualStageKeys") != [
            "executeInTargetRepo",
            "recordEvidence",
        ]
        or operator_runbook.get("nextStageKey") != "verifySourceBundle"
        or operator_runbook.get("nextStageLabel") != "Verify source bundle integrity"
        or operator_runbook.get("nextStageActionType") != "run-local-gate"
        or operator_runbook.get("nextStageActionLabel") != "Run strict bundle check"
        or operator_runbook.get("nextStageActionInstruction")
        != "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff."
        or operator_runbook.get("nextStageActionButtonLabel") != "Run Check"
        or operator_runbook.get("nextStageActionAffordance") != "primary-command-button"
        or operator_runbook.get("nextStageActionEnabled") is not True
        or operator_runbook.get("nextStageActionStatus") != "ready"
        or operator_runbook.get("nextStageActionStatusLabel") != "Ready"
        or operator_runbook.get("nextStageActionStatusTone") != "success"
        or operator_runbook.get("nextStageActionDisabledReasonCode") != ""
        or operator_runbook.get("nextStageActionDisabledReason") != ""
        or operator_runbook.get("nextStageActionPrerequisiteKeys") != []
        or operator_runbook.get("nextStageActionPrerequisiteLabels") != []
        or operator_runbook.get("nextStageActionPrerequisiteCount") != 0
        or operator_runbook.get("nextStageActionHasPrerequisites") is not False
        or operator_runbook.get("nextStageActionDependencyReasonCode") != ""
        or operator_runbook.get("nextStageActionDependencyReason") != ""
        or operator_runbook.get("nextStageActionBlockedStageKeys") != ["writeEffectiveTaskPrompt", "executeInTargetRepo"]
        or operator_runbook.get("nextStageActionBlockedStageLabels")
        != ["Write effective task handoff prompt", "Execute the task in the target website repo"]
        or operator_runbook.get("nextStageActionBlockedStageCount") != 2
        or operator_runbook.get("nextStageActionBlocksStages") is not True
        or operator_runbook.get("nextStageActionCompletionCriteria")
        != ["Strict bundle check status is pass.", "Checksum and generated-file drift counts are zero."]
        or operator_runbook.get("nextStageActionCompletionCriteriaCount") != 2
        or operator_runbook.get("nextStageActionHasCompletionCriteria") is not True
        or operator_runbook.get("nextStageActionEvidenceRequirements")
        != ["Strict bundle-check command output or JSON status.", "Bundle digest and zero drift counts."]
        or operator_runbook.get("nextStageActionEvidenceRequirementCount") != 2
        or operator_runbook.get("nextStageActionRequiresEvidence") is not True
        or operator_runbook.get("nextStageActionEvidenceTarget") != "local-command-output"
        or operator_runbook.get("nextStageActionEvidenceTargetLabel") != "Local command output"
        or operator_runbook.get("nextStageActionEvidenceCaptureFields") != expected_next_capture_fields
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldKeys") != ["strictBundleCheckOutput", "bundleDigest"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldLabels") != ["Strict bundle-check output", "Bundle digest"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldPlaceholders")
        != [
            "Paste the strict bundle-check pass output or JSON status.",
            "Record the bundle digest or checksum summary.",
        ]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldRequirementLabels") != ["Required", "Required"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldAriaLabels")
        != [
            "Strict bundle-check output evidence (required)",
            "Bundle digest evidence (required)",
        ]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldHelpTexts")
        != [
            "Required: paste a passing strict bundle-check result.",
            "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        ]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldSectionKeys")
        != ["source-bundle-verification", "source-bundle-verification"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldSectionLabels")
        != ["Source bundle verification", "Source bundle verification"]
        or operator_runbook.get("nextStageActionEvidenceCaptureSectionKeys") != ["source-bundle-verification"]
        or operator_runbook.get("nextStageActionEvidenceCaptureSectionLabels") != ["Source bundle verification"]
        or operator_runbook.get("nextStageActionEvidenceCaptureSectionCount") != 1
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldPayloadNamespaces")
        != ["sourceBundle", "sourceBundle"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldPayloadPaths")
        != [
            "sourceBundle.verification.strictBundleCheckOutput",
            "sourceBundle.verification.bundleDigest",
        ]
        or operator_runbook.get("nextStageActionEvidenceCapturePayloadNamespaces") != ["sourceBundle"]
        or operator_runbook.get("nextStageActionEvidenceCapturePayloadNamespaceCount") != 1
        or operator_runbook.get("nextStageActionEvidenceCapturePayloadTemplate")
        != expected_capture_payload_templates["verifySourceBundle"]
        or operator_runbook.get("nextStageActionEvidenceCapturePayloadFlatTemplate")
        != expected_capture_payload_flat_templates["verifySourceBundle"]
        or operator_runbook.get("nextStageActionEvidenceCapturePayloadBindings")
        != expected_next_capture_payload_bindings
        or operator_runbook.get("nextStageActionEvidenceCaptureValidationSpecs")
        != expected_next_capture_validation_specs
        or operator_runbook.get("nextStageActionEvidenceCaptureInitialValidationStates")
        != expected_next_initial_validation_states
        or operator_runbook.get("nextStageActionEvidenceCaptureInitialValidationDisplayMetadata")
        != expected_next_initial_validation_display_metadata
        or operator_runbook.get("nextStageActionEvidenceCaptureInitialValidationChecklist")
        != expected_next_initial_validation_checklist
        or operator_runbook.get("nextStageActionEvidenceCaptureInitialValidationSummary")
        != expected_next_initial_validation_summary
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldInputTypes") != ["textarea", "text"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldValueShapes") != ["long-text", "short-text"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldAcceptsMultiple") != [False, False]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldDefaultValues") != ["", ""]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldEmptyValues") != ["", ""]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldValidationRules")
        != ["non-empty-text", "checksum-or-digest-text"]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldMinLengths") != [20, 8]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldExamples")
        != [
            "Status: pass; checksumFailures: 0; generatedFailures: 0",
            "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
        ]
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldValidationHints")
        != [
            "Required: paste a passing strict bundle-check result.",
            "Required: record a digest, checksum, or equivalent bundle integrity summary.",
        ]
        or operator_runbook.get("nextStageActionRequiredEvidenceCaptureFieldKeys") != ["strictBundleCheckOutput", "bundleDigest"]
        or operator_runbook.get("nextStageActionOptionalEvidenceCaptureFieldKeys") != []
        or operator_runbook.get("nextStageActionEvidenceCaptureFieldCount") != 2
        or operator_runbook.get("nextStageActionRequiredEvidenceCaptureFieldCount") != 2
        or operator_runbook.get("nextStageActionOptionalEvidenceCaptureFieldCount") != 0
        or operator_runbook.get("nextStageActionHasEvidenceCaptureFields") is not True
        or operator_runbook.get("nextStageKind") != "read-only-gate"
        or operator_runbook.get("nextStageRequired") is not True
        or operator_runbook.get("nextStageRunPolicy") != "read-only"
        or operator_runbook.get("nextStageSafetyLevel") != "local-read-only"
        or operator_runbook.get("nextStageCommandCount") != 1
        or operator_runbook.get("nextStageCommandLabels") != ["Strict bundle check JSON"]
        or operator_runbook.get("nextStageCommandRunPolicies") != ["read-only"]
        or operator_runbook.get("nextStageCommandSafetyLevels") != ["local-read-only"]
        or operator_runbook.get("nextStageOutputFiles") != []
        or operator_runbook.get("nextStageHasCommands") is not True
        or operator_runbook.get("nextStageManual") is not False
        or operator_runbook.get("nextStageWritesLocalFile") is not False
        or operator_runbook.get("nextStageExternalCalls") is not False
        or operator_runbook.get("nextStageTargetRepoMutation") is not False
        or operator_runbook.get("nextStageCommandKeys") != ["source.bundleCheck.strict"]
        or operator_runbook.get("nextCommandKey") != "source.bundleCheck.strict"
        or not isinstance(operator_runbook.get("stageByKey"), dict)
        or not isinstance(operator_runbook.get("stageSummaryByKey"), dict)
        or not isinstance(operator_runbook.get("stageCommandStringsByKey"), dict)
        or not isinstance(operator_runbook.get("stageCommandArgsByKey"), dict)
        or not isinstance(operator_runbook.get("stageActionRows"), list)
        or not isinstance(operator_runbook.get("stageOutputFilesByKey"), dict)
        or not isinstance(runbook_stages, list)
        or [stage.get("key") for stage in runbook_stages] != expected_stage_keys
    ):
        raise SystemExit(f"site bundle handoff after {context} operator runbook summary changed: {operator_runbook!r}")
    verify_stage = runbook_stages[0]
    task_prompt_stage = runbook_stages[2]
    manual_stage = runbook_stages[3]
    action_rows = operator_runbook["stageActionRows"]
    stage_by_key = operator_runbook["stageByKey"]
    if (
        stage_by_key.get("verifySourceBundle") != verify_stage
        or stage_by_key.get("writeEffectiveTaskPrompt") != task_prompt_stage
        or [stage.get("key") for stage in action_rows] != expected_stage_keys
        or action_rows[0].get("actionType") != "run-local-gate"
        or action_rows[0].get("actionLabel") != "Run strict bundle check"
        or action_rows[0].get("actionButtonLabel") != "Run Check"
        or action_rows[0].get("actionAffordance") != "primary-command-button"
        or action_rows[0].get("actionEnabled") is not True
        or action_rows[0].get("actionStatus") != "ready"
        or action_rows[0].get("actionStatusTone") != "success"
        or action_rows[0].get("actionPrerequisiteKeys") != []
        or action_rows[0].get("actionPrerequisiteCount") != 0
        or action_rows[0].get("actionHasPrerequisites") is not False
        or action_rows[0].get("actionDependencyReasonCode") != ""
        or action_rows[0].get("actionBlockedStageKeys") != ["writeEffectiveTaskPrompt", "executeInTargetRepo"]
        or action_rows[0].get("actionBlockedStageCount") != 2
        or action_rows[0].get("actionBlocksStages") is not True
        or action_rows[0].get("actionCompletionCriteriaCount") != 2
        or action_rows[0].get("actionHasCompletionCriteria") is not True
        or action_rows[0].get("actionEvidenceRequirementCount") != 2
        or action_rows[0].get("actionRequiresEvidence") is not True
        or action_rows[0].get("actionEvidenceTarget") != "local-command-output"
        or action_rows[0].get("actionEvidenceTargetLabel") != "Local command output"
        or action_rows[0].get("actionEvidenceCaptureFieldKeys") != ["strictBundleCheckOutput", "bundleDigest"]
        or action_rows[0].get("actionEvidenceCaptureFieldLabels") != ["Strict bundle-check output", "Bundle digest"]
        or action_rows[0].get("actionEvidenceCaptureFieldSectionKeys")
        != ["source-bundle-verification", "source-bundle-verification"]
        or action_rows[0].get("actionEvidenceCaptureSectionKeys") != ["source-bundle-verification"]
        or action_rows[0].get("actionEvidenceCaptureSectionCount") != 1
        or action_rows[0].get("actionEvidenceCaptureFieldPayloadNamespaces") != ["sourceBundle", "sourceBundle"]
        or action_rows[0].get("actionEvidenceCaptureFieldPayloadPaths")
        != [
            "sourceBundle.verification.strictBundleCheckOutput",
            "sourceBundle.verification.bundleDigest",
        ]
        or action_rows[0].get("actionEvidenceCapturePayloadNamespaces") != ["sourceBundle"]
        or action_rows[0].get("actionEvidenceCapturePayloadNamespaceCount") != 1
        or action_rows[0].get("actionEvidenceCapturePayloadTemplate")
        != expected_capture_payload_templates["verifySourceBundle"]
        or action_rows[0].get("actionEvidenceCapturePayloadFlatTemplate")
        != expected_capture_payload_flat_templates["verifySourceBundle"]
        or action_rows[0].get("actionEvidenceCapturePayloadBindings")
        != expected_next_capture_payload_bindings
        or action_rows[0].get("actionEvidenceCaptureValidationSpecs")
        != expected_next_capture_validation_specs
        or action_rows[0].get("actionEvidenceCaptureInitialValidationStates")
        != expected_next_initial_validation_states
        or action_rows[0].get("actionEvidenceCaptureInitialValidationDisplayMetadata")
        != expected_next_initial_validation_display_metadata
        or action_rows[0].get("actionEvidenceCaptureInitialValidationChecklist")
        != expected_next_initial_validation_checklist
        or action_rows[0].get("actionEvidenceCaptureInitialValidationSummary")
        != expected_next_initial_validation_summary
        or action_rows[0].get("actionEvidenceCaptureFieldInputTypes") != ["textarea", "text"]
        or action_rows[0].get("actionEvidenceCaptureFieldValueShapes") != ["long-text", "short-text"]
        or action_rows[0].get("actionEvidenceCaptureFieldAcceptsMultiple") != [False, False]
        or action_rows[0].get("actionEvidenceCaptureFieldValidationRules")
        != ["non-empty-text", "checksum-or-digest-text"]
        or action_rows[0].get("actionEvidenceCaptureFieldMinLengths") != [20, 8]
        or action_rows[0].get("actionRequiredEvidenceCaptureFieldKeys") != ["strictBundleCheckOutput", "bundleDigest"]
        or action_rows[0].get("actionOptionalEvidenceCaptureFieldKeys") != []
        or action_rows[0].get("actionEvidenceCaptureFieldCount") != 2
        or action_rows[0].get("actionRequiredEvidenceCaptureFieldCount") != 2
        or action_rows[0].get("actionOptionalEvidenceCaptureFieldCount") != 0
        or action_rows[0].get("actionHasEvidenceCaptureFields") is not True
        or action_rows[0].get("actionEvidenceCaptureFields") != expected_next_capture_fields
        or action_rows[0].get("commandKeys") != verify_stage.get("commandKeys")
        or action_rows[0].get("manual") is not False
        or action_rows[2].get("actionType") != "write-local-output"
        or action_rows[2].get("actionButtonLabel") != "Write Prompt"
        or action_rows[2].get("actionAffordance") != "local-output-button"
        or action_rows[2].get("actionEnabled") is not True
        or action_rows[2].get("actionStatus") != "ready"
        or action_rows[2].get("actionPrerequisiteKeys") != ["verifySourceBundle"]
        or action_rows[2].get("actionPrerequisiteCount") != 1
        or action_rows[2].get("actionDependencyReasonCode") != "requires-prerequisite-actions"
        or action_rows[2].get("actionBlockedStageKeys") != ["executeInTargetRepo"]
        or action_rows[2].get("actionBlockedStageCount") != 1
        or action_rows[2].get("actionBlocksStages") is not True
        or action_rows[2].get("actionCompletionCriteriaCount") != 2
        or action_rows[2].get("actionHasCompletionCriteria") is not True
        or action_rows[2].get("actionEvidenceRequirementCount") != 2
        or action_rows[2].get("actionRequiresEvidence") is not True
        or action_rows[2].get("actionEvidenceTarget") != "local-output-file"
        or action_rows[2].get("actionEvidenceTargetLabel") != "Local output file"
        or action_rows[2].get("actionEvidenceCaptureFieldKeys") != ["promptOutputFile", "selectedTaskId"]
        or action_rows[2].get("actionEvidenceCaptureFieldSectionKeys")
        != ["handoff-prompt-output", "handoff-prompt-output"]
        or action_rows[2].get("actionEvidenceCaptureSectionKeys") != ["handoff-prompt-output"]
        or action_rows[2].get("actionEvidenceCaptureSectionCount") != 1
        or action_rows[2].get("actionEvidenceCaptureFieldPayloadNamespaces") != ["handoffPrompt", "handoffPrompt"]
        or action_rows[2].get("actionEvidenceCaptureFieldPayloadPaths")
        != ["handoffPrompt.outputFile", "handoffPrompt.selectedTaskId"]
        or action_rows[2].get("actionEvidenceCapturePayloadNamespaces") != ["handoffPrompt"]
        or action_rows[2].get("actionEvidenceCapturePayloadNamespaceCount") != 1
        or action_rows[2].get("actionEvidenceCapturePayloadTemplate")
        != expected_capture_payload_templates["writeEffectiveTaskPrompt"]
        or action_rows[2].get("actionEvidenceCapturePayloadFlatTemplate")
        != expected_capture_payload_flat_templates["writeEffectiveTaskPrompt"]
        or action_rows[2].get("actionEvidenceCaptureFieldInputTypes") != ["file-path", "text"]
        or action_rows[2].get("actionEvidenceCaptureFieldValueShapes") != ["file-path", "short-text"]
        or action_rows[2].get("actionEvidenceCaptureFieldAcceptsMultiple") != [False, False]
        or action_rows[2].get("actionEvidenceCaptureFieldValidationRules") != ["local-markdown-file-path", "task-id"]
        or action_rows[2].get("actionEvidenceCaptureFieldMinLengths") != [12, 5]
        or action_rows[2].get("actionRequiredEvidenceCaptureFieldKeys") != ["promptOutputFile", "selectedTaskId"]
        or action_rows[2].get("actionOptionalEvidenceCaptureFieldKeys") != []
        or action_rows[2].get("actionEvidenceCaptureFieldCount") != 2
        or action_rows[2].get("actionRequiredEvidenceCaptureFieldCount") != 2
        or action_rows[2].get("actionOptionalEvidenceCaptureFieldCount") != 0
        or action_rows[2].get("actionHasEvidenceCaptureFields") is not True
        or action_rows[2].get("outputFiles") != task_prompt_stage.get("outputFiles")
        or action_rows[2].get("writesLocalFile") != task_prompt_stage.get("writesLocalFile")
        or action_rows[3].get("actionType") != "manual-target-repo"
        or action_rows[3].get("actionButtonLabel") != "Open Target Repo"
        or action_rows[3].get("actionAffordance") != "manual-target-repo-step"
        or action_rows[3].get("actionEnabled") is not False
        or action_rows[3].get("actionStatus") != "manual"
        or action_rows[3].get("actionDisabledReasonCode") != "manual-target-repo-step"
        or action_rows[3].get("actionPrerequisiteKeys") != ["verifySourceBundle", "writeEffectiveTaskPrompt"]
        or action_rows[3].get("actionPrerequisiteCount") != 2
        or action_rows[3].get("actionDependencyReasonCode") != "requires-prerequisite-actions"
        or action_rows[3].get("actionBlockedStageKeys") != ["recordEvidence"]
        or action_rows[3].get("actionBlockedStageCount") != 1
        or action_rows[3].get("actionBlocksStages") is not True
        or action_rows[3].get("actionCompletionCriteriaCount") != 2
        or action_rows[3].get("actionHasCompletionCriteria") is not True
        or action_rows[3].get("actionEvidenceRequirementCount") != 3
        or action_rows[3].get("actionRequiresEvidence") is not True
        or action_rows[3].get("actionEvidenceTarget") != "target-repo-working-tree"
        or action_rows[3].get("actionEvidenceTargetLabel") != "Target repo working tree"
        or action_rows[3].get("actionEvidenceCaptureFieldKeys")
        != ["targetRepoChangedFiles", "targetRepoVerificationResults", "viewportAccessibilityNotes"]
        or action_rows[3].get("actionEvidenceCaptureFieldSectionKeys")
        != ["target-repo-changes", "target-repo-verification", "viewport-accessibility-qa"]
        or action_rows[3].get("actionEvidenceCaptureSectionKeys")
        != ["target-repo-changes", "target-repo-verification", "viewport-accessibility-qa"]
        or action_rows[3].get("actionEvidenceCaptureSectionCount") != 3
        or action_rows[3].get("actionEvidenceCaptureFieldPayloadNamespaces")
        != ["targetRepo", "targetRepo", "targetRepo"]
        or action_rows[3].get("actionEvidenceCaptureFieldPayloadPaths")
        != [
            "targetRepo.changedFiles",
            "targetRepo.verificationResults",
            "targetRepo.viewportAccessibilityNotes",
        ]
        or action_rows[3].get("actionEvidenceCapturePayloadNamespaces") != ["targetRepo"]
        or action_rows[3].get("actionEvidenceCapturePayloadNamespaceCount") != 1
        or action_rows[3].get("actionEvidenceCapturePayloadTemplate")
        != expected_capture_payload_templates["executeInTargetRepo"]
        or action_rows[3].get("actionEvidenceCapturePayloadFlatTemplate")
        != expected_capture_payload_flat_templates["executeInTargetRepo"]
        or action_rows[3].get("actionEvidenceCapturePayloadBindings", [{}])[0]
        != expected_target_repo_changed_files_binding
        or action_rows[3].get("actionEvidenceCaptureValidationSpecs", [{}])[0]
        != expected_target_repo_changed_files_validation_spec
        or action_rows[3].get("actionEvidenceCaptureInitialValidationSummary")
        != expected_target_repo_initial_validation_summary
        or action_rows[3].get("actionEvidenceCaptureInitialValidationChecklist", [{}])[0]
        != expected_target_repo_changed_files_initial_validation_checklist
        or action_rows[3].get("actionEvidenceCaptureFieldInputTypes") != ["list", "textarea", "textarea"]
        or action_rows[3].get("actionEvidenceCaptureFieldValueShapes") != ["string-list", "long-text", "long-text"]
        or action_rows[3].get("actionEvidenceCaptureFieldAcceptsMultiple") != [True, False, False]
        or action_rows[3].get("actionEvidenceCaptureFieldValidationRules")
        != ["non-empty-file-list", "verification-results", "viewport-accessibility-notes"]
        or action_rows[3].get("actionEvidenceCaptureFieldMinLengths") != [1, 20, 20]
        or action_rows[3].get("actionRequiredEvidenceCaptureFieldKeys")
        != ["targetRepoChangedFiles", "targetRepoVerificationResults", "viewportAccessibilityNotes"]
        or action_rows[3].get("actionOptionalEvidenceCaptureFieldKeys") != []
        or action_rows[3].get("actionEvidenceCaptureFieldCount") != 3
        or action_rows[3].get("actionRequiredEvidenceCaptureFieldCount") != 3
        or action_rows[3].get("actionOptionalEvidenceCaptureFieldCount") != 0
        or action_rows[3].get("actionHasEvidenceCaptureFields") is not True
        or action_rows[3].get("manual") is not True
        or operator_runbook.get("nextStage") != verify_stage
        or operator_runbook.get("nextStageSummary") != verify_stage.get("reason")
        or operator_runbook["stageSummaryByKey"].get("verifySourceBundle") != verify_stage.get("reason")
        or operator_runbook["stageSummaryByKey"].get("writeEffectiveTaskPrompt") != task_prompt_stage.get("reason")
        or operator_runbook["stageCommandStringsByKey"].get("verifySourceBundle") != [verify_stage["commands"][0].get("command")]
        or operator_runbook["stageCommandStringsByKey"].get("writeEffectiveTaskPrompt") != [task_prompt_stage["commands"][0].get("command")]
        or operator_runbook["stageCommandArgsByKey"].get("verifySourceBundle") != [verify_stage["commands"][0].get("commandArgs")]
        or operator_runbook["stageCommandArgsByKey"].get("writeEffectiveTaskPrompt") != [task_prompt_stage["commands"][0].get("commandArgs")]
        or operator_runbook.get("nextStageCommands") != [verify_stage["commands"][0].get("command")]
        or operator_runbook.get("nextStageCommandArgsList") != [verify_stage["commands"][0].get("commandArgs")]
        or operator_runbook["stageOutputFilesByKey"].get("writeEffectiveTaskPrompt") != task_prompt_stage.get("outputFiles")
        or operator_runbook["stageOutputFilesByKey"].get("verifySourceBundle") != []
        or operator_runbook["stageHasCommandsByKey"].get("verifySourceBundle") != (verify_stage.get("commandCount") > 0)
        or operator_runbook["stageHasCommandsByKey"].get("executeInTargetRepo") != (manual_stage.get("commandCount") > 0)
        or operator_runbook["stageManualByKey"].get("executeInTargetRepo") != (manual_stage.get("commandCount") == 0)
        or operator_runbook["stageWritesLocalFileByKey"].get("writeEffectiveTaskPrompt") != task_prompt_stage.get("writesLocalFile")
        or operator_runbook["stageExternalCallsByKey"].get("verifySourceBundle") != verify_stage.get("externalCalls")
        or operator_runbook["stageTargetRepoMutationByKey"].get("executeInTargetRepo") != manual_stage.get("targetRepoMutation")
        or not isinstance(operator_runbook.get("nextCommandEntry"), dict)
        or operator_runbook["nextCommandEntry"].get("key") != "source.bundleCheck.strict"
        or operator_runbook.get("nextCommand") != operator_runbook["nextCommandEntry"].get("command")
        or operator_runbook.get("nextCommandArgs") != operator_runbook["nextCommandEntry"].get("commandArgs")
        or operator_runbook.get("nextCommandRunPolicy") != "read-only"
        or operator_runbook.get("nextCommandSafetyLevel") != "local-read-only"
        or operator_runbook.get("nextCommandSafety") != operator_runbook["nextCommandEntry"].get("safety")
    ):
        raise SystemExit(f"site bundle handoff after {context} operator runbook lookup fields changed: {operator_runbook!r}")
    if (
        verify_stage.get("commandKeys") != ["source.bundleCheck.strict"]
        or verify_stage.get("runPolicy") != "read-only"
        or verify_stage.get("safetyLevel") != "local-read-only"
        or verify_stage.get("commandCount") != 1
        or verify_stage.get("externalCalls") is not False
        or verify_stage.get("targetRepoMutation") is not False
    ):
        raise SystemExit(f"site bundle handoff after {context} operator runbook verify stage changed: {verify_stage!r}")
    if (
        task_prompt_stage.get("commandKeys") != [f"task.{expected_effective_task_id}.handoff.strict"]
        or task_prompt_stage.get("runPolicy") != "writes-local-file"
        or task_prompt_stage.get("safetyLevel") != "local-output-file"
        or task_prompt_stage.get("outputFiles") != [f"target-repo-{expected_effective_task_id}-handoff.md"]
        or task_prompt_stage.get("commandCount") != 1
        or not isinstance(task_prompt_stage.get("commands"), list)
        or task_prompt_stage["commands"][0].get("key") != f"task.{expected_effective_task_id}.handoff.strict"
    ):
        raise SystemExit(f"site bundle handoff after {context} operator runbook task prompt stage changed: {task_prompt_stage!r}")
    if (
        manual_stage.get("runPolicy") != "manual-target-repo"
        or manual_stage.get("safetyLevel") != "operator-controlled-target-repo"
        or manual_stage.get("commandCount") != 0
        or manual_stage.get("commands") != []
        or manual_stage.get("required") is not True
    ):
        raise SystemExit(f"site bundle handoff after {context} operator runbook manual stage changed: {manual_stage!r}")
    execution_checklist = bundle.get("executionChecklist")
    if not isinstance(execution_checklist, list) or [item.get("id") for item in execution_checklist] != [
        "confirm-target-repo",
        "inspect-architecture",
        "apply-focused-task",
        "verify-quality-gates",
        "record-handoff-evidence",
    ]:
        raise SystemExit(f"site bundle handoff after {context} execution checklist changed")
    if bundle.get("mcpProbeStatus") != "pass":
        raise SystemExit(f"site bundle handoff after {context} MCP probe status changed")
    assert_site_mcp_probe_counts(
        bundle.get("mcpProbeCounts"),
        context=context,
        label="site bundle handoff",
    )
    if bundle.get("verifiedChecksumFiles") != 8 or bundle.get("checksumFailures") != 0:
        raise SystemExit(f"site bundle handoff after {context} checksum verification changed")
    if bundle.get("verifiedGeneratedFiles") != 8 or bundle.get("generatedFailures") != 0:
        raise SystemExit(f"site bundle handoff after {context} generated bundle contract verification changed")
    if bundle.get("generatedDriftFiles") != []:
        raise SystemExit(f"site bundle handoff after {context} generated bundle contract drift changed")

    def assert_task_command_args(task, task_id, label):
        expected_out_file = f"target-repo-{task_id}-handoff.md"
        for key, expected_tail in {
            "handoffCommandArgs": ["--bundle-handoff", "--task", task_id, "--out", expected_out_file],
            "strictHandoffCommandArgs": ["--bundle-handoff", "--task", task_id, "--strict", "--out", expected_out_file],
        }.items():
            command_args = task.get(key) if isinstance(task, dict) else None
            if (
                not isinstance(command_args, list)
                or len(command_args) != len(expected_tail) + 3
                or command_args[:2] != ["design-ai", "site"]
                or not isinstance(command_args[2], str)
                or command_args[-len(expected_tail):] != expected_tail
            ):
                raise SystemExit(f"site bundle handoff after {context} {label} {key} changed: {command_args!r}")
        for policy_key in ["handoffCommandRunPolicy", "strictHandoffCommandRunPolicy"]:
            if task.get(policy_key) != "writes-local-file":
                raise SystemExit(f"site bundle handoff after {context} {label} {policy_key} changed: {task.get(policy_key)!r}")
        for key, expected_strict in {
            "handoffCommandSafety": False,
            "strictHandoffCommandSafety": True,
        }.items():
            safety = task.get(key) if isinstance(task, dict) else None
            if (
                not isinstance(safety, dict)
                or safety.get("runPolicy") != "writes-local-file"
                or safety.get("safetyLevel") != "local-output-file"
                or safety.get("writesLocalFile") is not True
                or safety.get("outputFile") != expected_out_file
                or safety.get("mutates") != "local-output-file-only"
                or safety.get("externalCalls") is not False
                or safety.get("targetRepoMutation") is not False
                or safety.get("requiresCleanWorkspace") is not False
                or safety.get("requiresReviewBeforeMutation") is not False
                or safety.get("strict") is not expected_strict
            ):
                raise SystemExit(f"site bundle handoff after {context} {label} {key} changed: {safety!r}")

    default_task = bundle.get("defaultTask")
    if (
        not isinstance(default_task, dict)
        or default_task.get("id") != "task-accessibility"
        or default_task.get("handoffOutFile") != "target-repo-task-accessibility-handoff.md"
        or not isinstance(default_task.get("strictHandoffCommand"), str)
        or "--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff.md" not in default_task.get("strictHandoffCommand")
    ):
        raise SystemExit(f"site bundle handoff after {context} default task command metadata changed: {default_task!r}")
    assert_task_command_args(default_task, "task-accessibility", "default task")
    selected_task = bundle.get("selectedTask")
    effective_task = bundle.get("effectiveTask")
    if (
        not isinstance(effective_task, dict)
        or effective_task.get("id") != expected_effective_task_id
        or effective_task.get("handoffOutFile") != f"target-repo-{expected_effective_task_id}-handoff.md"
        or not isinstance(effective_task.get("strictHandoffCommand"), str)
        or f"--bundle-handoff --task {expected_effective_task_id} --strict --out target-repo-{expected_effective_task_id}-handoff.md" not in effective_task.get("strictHandoffCommand")
    ):
        raise SystemExit(f"site bundle handoff after {context} effective task command metadata changed: {effective_task!r}")
    assert_task_command_args(effective_task, expected_effective_task_id, "effective task")
    if expected_selected_task_id is None:
        if selected_task is not None:
            raise SystemExit(f"site bundle handoff after {context} default selected task should be null: {selected_task!r}")
    elif not isinstance(selected_task, dict) or selected_task.get("id") != expected_selected_task_id:
        raise SystemExit(f"site bundle handoff after {context} selected task changed: {selected_task!r}")
    elif (
        selected_task.get("handoffOutFile") != f"target-repo-{expected_selected_task_id}-handoff.md"
        or not isinstance(selected_task.get("strictHandoffCommand"), str)
        or f"--bundle-handoff --task {expected_selected_task_id} --strict --out target-repo-{expected_selected_task_id}-handoff.md" not in selected_task.get("strictHandoffCommand")
    ):
        raise SystemExit(f"site bundle handoff after {context} selected task command metadata changed: {selected_task!r}")
    elif expected_selected_task_id:
        assert_task_command_args(selected_task, expected_selected_task_id, "selected task")
    task_catalog = bundle.get("taskCatalog")
    if not isinstance(task_catalog, dict):
        raise SystemExit(f"site bundle handoff after {context} task catalog missing")
    if task_catalog.get("count") != 3 or task_catalog.get("defaultTaskId") != "task-accessibility":
        raise SystemExit(f"site bundle handoff after {context} task catalog summary changed: {task_catalog!r}")
    if task_catalog.get("selectedTaskId") != (expected_selected_task_id or ""):
        raise SystemExit(f"site bundle handoff after {context} task catalog selected id changed: {task_catalog!r}")
    if task_catalog.get("selectionMode") != ("explicit" if expected_selected_task_id else "bundled-default"):
        raise SystemExit(f"site bundle handoff after {context} task catalog selection mode changed: {task_catalog!r}")
    task_items = task_catalog.get("items")
    if not isinstance(task_items, list) or [f"{item.get('number')}:{item.get('id')}" for item in task_items] != [
        "1:task-accessibility",
        "2:task-homepage-cta",
        "3:task-content-quality",
    ]:
        raise SystemExit(f"site bundle handoff after {context} task catalog items changed: {task_items!r}")
    first_task = task_items[0]
    if first_task.get("handoffOutFile") != "target-repo-task-accessibility-handoff.md":
        raise SystemExit(f"site bundle handoff after {context} task catalog out file changed: {first_task!r}")
    strict_handoff_command = first_task.get("strictHandoffCommand")
    if (
        not isinstance(strict_handoff_command, str)
        or "--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff.md" not in strict_handoff_command
    ):
        raise SystemExit(f"site bundle handoff after {context} task catalog strict command changed: {strict_handoff_command!r}")
    assert_task_command_args(first_task, "task-accessibility", "task catalog first task")
    repair_guidance = bundle.get("repairGuidance")
    if not isinstance(repair_guidance, dict) or repair_guidance.get("available") is not True:
        raise SystemExit(f"site bundle handoff after {context} repair guidance missing")
    repair_command = repair_guidance.get("command")
    if (
        not isinstance(repair_command, str)
        or "website-workspace.tasks.json --bundle --out " not in repair_command
        or " --force" not in repair_command
    ):
        raise SystemExit(f"site bundle handoff after {context} repair command changed: {repair_command!r}")
    evidence_counts = bundle.get("implementationEvidence")
    if not isinstance(evidence_counts, dict):
        raise SystemExit(f"site bundle handoff after {context} implementationEvidence counts missing")
    for key, expected in expected_evidence_counts.items():
        if evidence_counts.get(key) != expected:
            raise SystemExit(f"site bundle handoff after {context} evidence count {key} changed: {evidence_counts.get(key)!r}")
    digest = bundle.get("checksumBundleDigest")
    if not isinstance(digest, str) or len(digest) != 64:
        raise SystemExit(f"site bundle handoff after {context} bundle digest changed")
    prompt = payload.get("prompt")
    if not isinstance(prompt, str):
        raise SystemExit(f"site bundle handoff after {context} prompt missing")
    for fragment in (
        "Website improvement target-repo handoff prompt",
        "You are Codex working in the target website repository, not in the design-ai repository.",
        "Source bundle provenance: pass/valid from ",
        "Source bundle strict check command: `",
        "--bundle-check --strict --json",
        "Primary Codex Implementation Prompt",
        "Available Bundle Tasks",
        "Default task: task-accessibility",
        "Default task strict command: `",
        f"Effective task: {expected_effective_task_id}",
        "Effective task strict command: `",
        "--bundle-handoff --task task-accessibility --strict --out target-repo-task-accessibility-handoff.md",
        f"Task ID: {expected_task_id}",
        "MCP probes: 4/4 passing, 0 warning, 0 failing",
        "Generated files: 8/8 match the current CLI bundle contract",
        "Generated drift files: none",
        "Handoff generation boundary flags: external calls no; target repo mutation no",
        "Handoff boundaries: deterministic-local, no-external-mcp-calls, no-target-repo-mutation, no-lighthouse-axe-visual-diff, target-repo-work-after-handoff",
        "Target Repo Execution Checklist",
        "Run target repo quality gates",
        "Repair guidance:",
        "Regenerate: design-ai site ",
        "website-workspace.tasks.json --bundle --out ",
        "Required Final Response",
    ):
        if fragment not in prompt:
            raise SystemExit(f"site bundle handoff after {context} prompt missing fragment: {fragment!r}")
    if expected_selected_task_id and f"Selected task strict command: `" not in prompt:
        raise SystemExit(f"site bundle handoff after {context} prompt missing selected task strict command")
    included = {
        item.get("path")
        for item in payload.get("files", [])
        if item.get("included") is True
    }
    if "codex-implementation.md" not in included or "website-handoff.md" not in included:
        raise SystemExit(f"site bundle handoff after {context} included files changed: {sorted(included)!r}")


def assert_site_bundle_handoff_human_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    expected_task_id: str = "task-accessibility",
    expected_selected_task_id: str | None = None,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    output = result.stdout
    expected_effective_task_id = expected_selected_task_id or "task-accessibility"
    fragments = [
        "Website improvement target-repo handoff prompt",
        "You are Codex working in the target website repository, not in the design-ai repository.",
        "Source bundle provenance: pass/valid from ",
        "Source bundle strict check command: `",
        "--bundle-check --strict --json",
        "Available Bundle Tasks",
        "Default task: task-accessibility",
        "Default task strict command: `",
        f"Effective task: {expected_effective_task_id}",
        "Effective task strict command: `",
        f"--bundle-handoff --task {expected_effective_task_id} --strict --out target-repo-{expected_effective_task_id}-handoff.md",
        f"Task ID: {expected_task_id}",
        "Target Repo Execution Checklist",
        "Required Final Response",
    ]
    if expected_selected_task_id:
        fragments.extend([
            f"Selected task: {expected_selected_task_id}",
            "Selected task strict command: `",
        ])
    else:
        fragments.append("Selected task: none")
    for fragment in fragments:
        if fragment not in output:
            raise SystemExit(f"site bundle handoff human after {context} missing fragment: {fragment!r}")


def assert_site_bundle_repair_json_smoke(
    preview_cmd: list[str],
    apply_cmd: list[str],
    check_cmd: list[str],
    *,
    bundle_dir: Path,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    handoff_path = bundle_dir / "website-handoff.md"
    original_handoff = handoff_path.read_text(encoding="utf-8")
    tampered_handoff = f"{original_handoff}\nPackage smoke drift before bundle repair.\n"
    handoff_path.write_text(tampered_handoff, encoding="utf-8")

    preview_result = run_plain(preview_cmd, cwd=cwd, env=env)
    assert_no_ansi(preview_result.stdout, preview_cmd)
    preview = json.loads(preview_result.stdout)
    if preview.get("status") != "pass" or preview.get("dryRun") is not True or preview.get("applied") is not False:
        raise SystemExit(f"site bundle repair preview after {context} expected pass dry-run output")
    if preview.get("before", {}).get("status") != "fail":
        raise SystemExit(f"site bundle repair preview after {context} expected failing pre-repair bundle")
    if "website-handoff.md" not in preview.get("before", {}).get("generatedDriftFiles", []):
        raise SystemExit(f"site bundle repair preview after {context} expected website-handoff.md generated drift")
    if preview.get("after") is not None or preview.get("written") is not None:
        raise SystemExit(f"site bundle repair preview after {context} must not report applied artifacts")
    preview_report_command, apply_report_command, preview_out, apply_out = (
        assert_site_repair_guidance_report_contract(
            preview.get("repairGuidance"),
            bundle_dir=bundle_dir,
            context=context,
        )
    )
    if handoff_path.read_text(encoding="utf-8") != tampered_handoff:
        raise SystemExit(f"site bundle repair preview after {context} mutated the bundle")

    preview_report_cmd = site_guidance_command(
        preview_report_command,
        preview_cmd,
        context=f"site bundle repair preview after {context}",
    )
    preview_out_result = run_plain(preview_report_cmd, cwd=cwd, env=env)
    assert_no_ansi(preview_out_result.stdout, preview_report_cmd)
    if "Wrote " not in preview_out_result.stdout:
        raise SystemExit(f"site bundle repair preview after {context} expected guidance --out write confirmation")
    preview_out_payload = json.loads(preview_out.read_text(encoding="utf-8"))
    assert_site_repair_preview_report_payload(preview_out_payload, context=context)
    if handoff_path.read_text(encoding="utf-8") != tampered_handoff:
        raise SystemExit(f"site bundle repair preview guidance --out after {context} mutated the bundle")

    apply_report_cmd = site_guidance_command(
        apply_report_command,
        apply_cmd,
        context=f"site bundle repair apply after {context}",
    )
    apply_result = run_plain(apply_report_cmd, cwd=cwd, env=env)
    assert_no_ansi(apply_result.stdout, apply_report_cmd)
    if "Wrote " not in apply_result.stdout:
        raise SystemExit(f"site bundle repair apply after {context} expected guidance --out write confirmation")
    applied = json.loads(apply_out.read_text(encoding="utf-8"))
    assert_site_repair_apply_report_payload(applied, context=context)
    if handoff_path.read_text(encoding="utf-8") != original_handoff:
        raise SystemExit(f"site bundle repair apply after {context} did not restore generated handoff")

    assert_site_bundle_check_json_smoke(
        check_cmd,
        cwd=cwd,
        env=env,
        context=f"{context} repaired bundle-check JSON",
    )


def assert_workspace_strict_success_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_workspace_strict_success_json(result.stdout, returncode=result.returncode, context=context, cmd=cmd)


def assert_workspace_strict_failure_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=assert_workspace_strict_failure_json,
    )


def assert_command_alias_smoke(
    cmd: list[str],
    *,
    command: tuple[str, ...],
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_command_alias_output(result.stdout, command=command, context=context, cmd=cmd)


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


def assert_update_dry_run_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_update_dry_run_output(result.stdout, context=context, cmd=cmd)


def assert_update_dry_run_json_smoke(
    cmd: list[str],
    *,
    prefix: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_update_dry_run_json(result.stdout, prefix=prefix, context=context, cmd=cmd)


def assert_status_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_status_output(result.stdout, context=context, cmd=cmd)


def assert_status_json_smoke(
    cmd: list[str],
    *,
    prefix: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_status_json(result.stdout, prefix=prefix, context=context, cmd=cmd)


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


def assert_install_lifecycle_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_install_doctor_lifecycle_output(result.stdout, context=context, cmd=cmd)


def assert_search_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_search_json_contains_hit(result.stdout, context=context, cmd=cmd)


def assert_search_human_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_search_human_output(result.stdout, context=context, cmd=cmd)


def assert_show_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_json_line(result.stdout, context=context, cmd=cmd)


def assert_show_human_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_human_output(result.stdout, context=context, cmd=cmd)


def assert_show_range_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_json_range(result.stdout, context=context, cmd=cmd)


def assert_show_human_range_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_human_range_output(result.stdout, context=context, cmd=cmd)


def assert_examples_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_examples_json_route_hit(result.stdout, context=context, cmd=cmd)


def assert_examples_human_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_examples_human_output(result.stdout, context=context, cmd=cmd)


def assert_list_smoke(
    cmd: list[str],
    *,
    kind: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_list_catalog_output(result.stdout, kind=kind, context=context, cmd=cmd)


def assert_list_json_smoke(
    cmd: list[str],
    *,
    kind: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_list_catalog_json(result.stdout, kind=kind, context=context, cmd=cmd)


def write_smoke_brief(brief_path: Path) -> None:
    brief_path.write_text(f"{EXPECTED_ROUTE_BRIEF}\n", encoding="utf-8")


def run_fixture_git(repo: Path, *args: str) -> None:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        output = f"{result.stdout}\n{result.stderr}".strip()
        raise SystemExit(f"failed to prepare workspace strict git fixture: git {' '.join(args)}\n{output}")


def prepare_workspace_strict_repo(repo: Path) -> None:
    repo.mkdir(parents=True, exist_ok=True)
    run_fixture_git(repo, "init", "-q")
    run_fixture_git(repo, "checkout", "-b", "main")
    run_fixture_git(repo, "config", "user.email", "package-smoke@example.com")
    run_fixture_git(repo, "config", "user.name", "Package Smoke")
    (repo / "README.md").write_text("# workspace strict fixture\n", encoding="utf-8")
    run_fixture_git(repo, "add", "README.md")
    run_fixture_git(repo, "commit", "-m", "feat: workspace strict fixture")
    run_fixture_git(repo, "remote", "add", "origin", f"{EXPECTED_REPOSITORY_URL}.git")
    run_fixture_git(repo, "update-ref", "refs/remotes/origin/main", "HEAD")
    run_fixture_git(repo, "branch", "--set-upstream-to=origin/main", "main")


def write_workspace_learning_eval_fixture(profile_path: Path, eval_path: Path) -> None:
    profile_path.parent.mkdir(parents=True, exist_ok=True)
    eval_path.parent.mkdir(parents=True, exist_ok=True)
    usage_path = profile_path.with_name(f"{profile_path.stem}.usage{profile_path.suffix}")
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:02.000Z",
                "entries": [
                    {
                        "id": "learn-workspace-keyboard",
                        "category": "accessibility",
                        "text": "Prioritize keyboard accessibility details for Button component API specs",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    eval_path.write_text(
        json.dumps(
            {
                "version": 1,
                "generatedAt": "2026-05-22T00:00:03.000Z",
                "sourceProfile": {
                    "file": str(profile_path),
                    "exists": True,
                    "entryCount": 1,
                    "auditStatus": "pass",
                    "category": "",
                    "query": "",
                    "limit": 6,
                },
                "cases": [
                    {
                        "id": "workspace-keyboard-selection",
                        "brief": "Spec a Button component API with keyboard accessibility",
                        "expectedSelectedIds": ["learn-workspace-keyboard"],
                        "minMatchedCount": 1,
                        "requireNoFallback": True,
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    usage_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:04.000Z",
                "profileFile": str(profile_path),
                "events": [
                    {
                        "id": "learn-use-workspace-keyboard",
                        "command": "prompt",
                        "routeId": "component-spec",
                        "profileFile": str(profile_path),
                        "briefHash": "b20206b62f51bb23",
                        "category": "accessibility",
                        "limit": 1,
                        "selectedEntryIds": ["learn-workspace-keyboard"],
                        "selectedCount": 1,
                        "candidateCount": 1,
                        "matchedCount": 1,
                        "fallbackCount": 0,
                        "queryTokenCount": 6,
                        "auditStatus": "pass",
                        "createdAt": "2026-05-22T00:00:04.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def write_workspace_restore_backup_fixture(profile_path: Path, count: int = 6) -> None:
    profile_path.parent.mkdir(parents=True, exist_ok=True)
    for index in range(1, count + 1):
        timestamp = f"20260522T000{index}00000Z"
        backup_path = profile_path.with_name(
            f"{profile_path.stem}.restore-backup-{timestamp}{profile_path.suffix or '.json'}"
        )
        backup_path.write_text(
            json.dumps(
                {
                    "version": 1,
                    "updatedAt": f"2026-05-22T00:0{index}:00.000Z",
                    "entries": [
                        {
                            "id": f"learn-workspace-restore-{index}",
                            "category": "workflow",
                            "text": f"Rollback snapshot {index} for workspace restore backup smoke",
                            "source": "package-smoke",
                            "createdAt": f"2026-05-22T00:0{index}:00.000Z",
                        },
                    ],
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )


def write_learning_audit_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": [
                    {
                        "id": "learn-a",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-b",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "learn-c",
                        "category": "constraint",
                        "text": "Never include api_key=redacted placeholders in prompt context",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def write_learning_curation_usage_fixture(profile_path: Path, usage_path: Path) -> None:
    usage_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:10:00.000Z",
                "profileFile": str(profile_path),
                "events": [
                    {
                        "id": "learn-use-package-smoke",
                        "command": "prompt",
                        "routeId": "design-review",
                        "profileFile": str(profile_path),
                        "briefHash": "package-smoke-hash",
                        "category": "",
                        "limit": 12,
                        "selectedEntryIds": ["learn-a", "learn-stale"],
                        "selectedCount": 2,
                        "candidateCount": 3,
                        "matchedCount": 1,
                        "fallbackCount": 1,
                        "queryTokenCount": 2,
                        "auditStatus": "pass",
                        "createdAt": "2026-05-22T00:10:00.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def write_learning_stats_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": [
                    {
                        "id": "learn-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise brand language",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-a11y",
                        "category": "accessibility",
                        "text": "Prefer keyboard-first critique notes",
                        "source": "feedback:keep",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "learn-korean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts with compact controls",
                        "source": "import:cli",
                        "createdAt": "2026-05-22T00:00:03.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def assert_learning_stats_json(
    raw: str,
    *,
    profile_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn stats JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn stats JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn stats JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("exists") is True, context=context, cmd=cmd, message="learn stats profile should exist")
    require_package_smoke(payload.get("version") == 1, context=context, cmd=cmd, message="learn stats version changed")
    require_package_smoke(payload.get("updatedAt") == "2026-05-22T00:00:03.000Z", context=context, cmd=cmd, message="learn stats updatedAt changed")
    require_package_smoke(payload.get("count") == 3, context=context, cmd=cmd, message="learn stats entry count changed")

    category_counts = payload.get("categoryCounts")
    require_package_smoke(
        isinstance(category_counts, dict)
        and category_counts.get("brand") == 1
        and category_counts.get("accessibility") == 1
        and category_counts.get("korean") == 1,
        context=context,
        cmd=cmd,
        message="learn stats category distribution changed",
    )
    source_counts = payload.get("sourceCounts")
    require_package_smoke(
        isinstance(source_counts, dict)
        and source_counts.get("package-smoke") == 1
        and source_counts.get("feedback:keep") == 1
        and source_counts.get("import:cli") == 1,
        context=context,
        cmd=cmd,
        message="learn stats source distribution changed",
    )

    audit_summary = payload.get("auditSummary")
    require_package_smoke(
        isinstance(audit_summary, dict)
        and audit_summary.get("status") == "pass"
        and audit_summary.get("failures") == 0
        and audit_summary.get("warnings") == 0,
        context=context,
        cmd=cmd,
        message="learn stats audit summary changed",
    )

    latest = payload.get("latestEntry")
    oldest = payload.get("oldestEntry")
    require_package_smoke(
        isinstance(latest, dict)
        and latest.get("id") == "learn-korean"
        and latest.get("category") == "korean"
        and latest.get("source") == "import:cli"
        and latest.get("textPreview") == "Prefer dense Korean mobile layouts with compact controls",
        context=context,
        cmd=cmd,
        message="learn stats latest entry summary changed",
    )
    require_package_smoke(
        isinstance(oldest, dict)
        and oldest.get("id") == "learn-brand"
        and oldest.get("category") == "brand"
        and oldest.get("source") == "package-smoke",
        context=context,
        cmd=cmd,
        message="learn stats oldest entry summary changed",
    )


def assert_learning_stats_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Local learning profile stats",
        "Exists: yes",
        "Entries: 3",
        "Updated: 2026-05-22T00:00:03.000Z",
        "Audit: pass (0 failure(s), 0 warning(s))",
        "Categories: brand 1, accessibility 1, korean 1",
        "Sources: package-smoke 1, feedback:keep 1, import:cli 1",
        "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
        "learn-korean · 2026-05-22T00:00:03.000Z",
        "Oldest: [brand] Use quiet enterprise brand language",
        "learn-brand · 2026-05-22T00:00:00.000Z",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn stats human output missing {expected!r}",
        )


def assert_learning_stats_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_stats_fixture(profile_path)

    human_cmd = command_factory("learn", "--stats", "--file", str(profile_path))
    human_result = run_plain(human_cmd, cwd=cwd, env=env)
    assert_learning_stats_human(human_result.stdout, context=f"{context} human", cmd=human_cmd)

    json_cmd = command_factory("learn", "--stats", "--file", str(profile_path), "--json")
    json_result = run_plain(json_cmd, cwd=cwd, env=env)
    assert_learning_stats_json(
        json_result.stdout,
        profile_path=profile_path,
        context=f"{context} JSON",
        cmd=json_cmd,
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-stats-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--stats",
        "--file",
        str(profile_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_stats_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        context=f"{context} out file",
        cmd=out_cmd,
    )


def assert_learning_audit_cleanup_json(
    raw: str,
    *,
    profile_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn audit JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn audit JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn audit JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("exists") is True, context=context, cmd=cmd, message="learn audit profile should exist")
    require_package_smoke(payload.get("count") == 3, context=context, cmd=cmd, message="learn audit entry count changed")

    summary = payload.get("summary")
    require_package_smoke(isinstance(summary, dict), context=context, cmd=cmd, message="learn audit summary missing")
    warnings = summary.get("warnings")
    require_package_smoke(summary.get("status") == "warn", context=context, cmd=cmd, message="learn audit should warn")
    require_package_smoke(summary.get("failures") == 0, context=context, cmd=cmd, message="learn audit should not fail")
    require_package_smoke(
        isinstance(warnings, int) and not isinstance(warnings, bool) and warnings >= 2,
        context=context,
        cmd=cmd,
        message="learn audit warning count should cover duplicate and sensitive entries",
    )

    issues = payload.get("issues")
    require_package_smoke(isinstance(issues, list), context=context, cmd=cmd, message="learn audit issues missing")
    require_package_smoke(
        any(issue.get("code") == "duplicate-entry-text" and issue.get("entryId") == "learn-b" for issue in issues),
        context=context,
        cmd=cmd,
        message="learn audit duplicate entry issue missing",
    )
    require_package_smoke(
        any(issue.get("code") == "sensitive-secret-assignment" and issue.get("entryId") == "learn-c" for issue in issues),
        context=context,
        cmd=cmd,
        message="learn audit sensitive entry issue missing",
    )

    suggestions = payload.get("suggestions")
    require_package_smoke(
        isinstance(suggestions, list),
        context=context,
        cmd=cmd,
        message="learn audit suggestions missing",
    )
    duplicate_suggestion = next(
        (
            suggestion for suggestion in suggestions
            if suggestion.get("action") == "remove-duplicate" and suggestion.get("entryId") == "learn-b"
        ),
        None,
    )
    sensitive_suggestion = next(
        (
            suggestion for suggestion in suggestions
            if (
                suggestion.get("action") == "remove-or-redact-sensitive-content"
                and suggestion.get("entryId") == "learn-c"
            )
        ),
        None,
    )
    duplicate_command_args = ["design-ai", "learn", "--file", str(profile_path), "--forget", "learn-b", "--yes"]
    sensitive_command_args = ["design-ai", "learn", "--file", str(profile_path), "--forget", "learn-c", "--yes"]
    require_package_smoke(
        duplicate_suggestion is not None,
        context=context,
        cmd=cmd,
        message="learn audit remove-duplicate suggestion missing",
    )
    require_package_smoke(
        duplicate_suggestion.get("commandArgs") == duplicate_command_args,
        context=context,
        cmd=cmd,
        message="learn audit duplicate cleanup command args changed",
    )
    require_package_smoke(
        "--forget learn-b --yes" in duplicate_suggestion.get("command", ""),
        context=context,
        cmd=cmd,
        message="learn audit duplicate cleanup command missing forget target",
    )
    require_package_smoke(
        sensitive_suggestion is not None,
        context=context,
        cmd=cmd,
        message="learn audit sensitive cleanup suggestion missing",
    )
    require_package_smoke(
        sensitive_suggestion.get("commandArgs") == sensitive_command_args,
        context=context,
        cmd=cmd,
        message="learn audit sensitive cleanup command args changed",
    )


def assert_learning_audit_cleanup_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Local learning profile audit",
        "Status: warn",
        "Suggested cleanup:",
        "remove-duplicate (learn-b)",
        "remove-or-redact-sensitive-content (learn-c)",
        "--forget learn-b --yes",
        "--forget learn-c --yes",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn audit human output missing {expected!r}",
        )


def assert_learning_audit_fix_json(
    raw: str,
    *,
    profile_path: Path,
    dry_run: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn audit fix JSON") from error

    require_package_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn audit fix JSON must be an object",
    )
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn audit fix JSON file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("dryRun") is dry_run,
        context=context,
        cmd=cmd,
        message="learn audit fix dryRun flag changed",
    )
    require_package_smoke(
        payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn audit fix applied flag changed",
    )
    require_package_smoke(
        payload.get("cleanupCount") == 2,
        context=context,
        cmd=cmd,
        message="learn audit fix cleanup count should cover duplicate and sensitive entries",
    )

    before = payload.get("before")
    require_package_smoke(
        isinstance(before, dict) and before.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn audit fix should start from a warning profile",
    )

    cleanup = payload.get("cleanup")
    require_package_smoke(isinstance(cleanup, list), context=context, cmd=cmd, message="learn audit fix cleanup list missing")
    cleanup_by_entry = {
        item.get("entryId"): item
        for item in cleanup
        if isinstance(item, dict)
    }
    for entry_id, action in (
        ("learn-b", "remove-duplicate"),
        ("learn-c", "remove-or-redact-sensitive-content"),
    ):
        item = cleanup_by_entry.get(entry_id)
        require_package_smoke(
            item is not None,
            context=context,
            cmd=cmd,
            message=f"learn audit fix cleanup entry missing: {entry_id}",
        )
        require_package_smoke(
            action in item.get("actions", []),
            context=context,
            cmd=cmd,
            message=f"learn audit fix cleanup action missing for {entry_id}",
        )
        require_package_smoke(
            item.get("commandArgs") == ["design-ai", "learn", "--file", str(profile_path), "--forget", entry_id, "--yes"],
            context=context,
            cmd=cmd,
            message=f"learn audit fix cleanup command args changed for {entry_id}",
        )

    removed = payload.get("removed")
    if dry_run:
        require_package_smoke(removed == [], context=context, cmd=cmd, message="learn audit fix dry run should not remove entries")
        require_package_smoke(payload.get("after") is None, context=context, cmd=cmd, message="learn audit fix dry run should not include after summary")
    else:
        require_package_smoke(isinstance(removed, list), context=context, cmd=cmd, message="learn audit fix removed list missing")
        require_package_smoke(
            [item.get("id") for item in removed] == ["learn-b", "learn-c"],
            context=context,
            cmd=cmd,
            message="learn audit fix removed entries changed",
        )
        after = payload.get("after")
        require_package_smoke(
            isinstance(after, dict) and after.get("status") == "pass",
            context=context,
            cmd=cmd,
            message="learn audit fix should leave a passing profile",
        )


def assert_learning_curation_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path | None = None,
    dry_run: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn curate JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn curate JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn curate JSON file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("archiveFile") == str(profile_path.with_name(f"{profile_path.stem}.archive{profile_path.suffix}")),
        context=context,
        cmd=cmd,
        message="learn curate archive file path changed",
    )
    require_package_smoke(payload.get("dryRun") is dry_run, context=context, cmd=cmd, message="learn curate dryRun flag changed")
    require_package_smoke(payload.get("applied") is (not dry_run), context=context, cmd=cmd, message="learn curate applied flag changed")

    before = payload.get("before")
    require_package_smoke(
        isinstance(before, dict) and before.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn curate should start from a warning profile",
    )
    require_package_smoke(payload.get("proposalCount") == 2, context=context, cmd=cmd, message="learn curate proposal count changed")
    require_package_smoke(payload.get("archiveCount") == 2, context=context, cmd=cmd, message="learn curate archive count changed")
    require_package_smoke(payload.get("manualReviewCount") == 0, context=context, cmd=cmd, message="learn curate manual-review count changed")

    usage = payload.get("usage")
    require_package_smoke(isinstance(usage, dict), context=context, cmd=cmd, message="learn curate usage review missing")
    if usage_path is not None:
        require_package_smoke(
            usage.get("usageFile") == str(usage_path),
            context=context,
            cmd=cmd,
            message="learn curate usage file path changed",
        )
        require_package_smoke(
            usage.get("profileFile") == str(profile_path),
            context=context,
            cmd=cmd,
            message="learn curate usage profile path changed",
        )
        require_package_smoke(
            usage.get("profileFileMatches") is True,
            context=context,
            cmd=cmd,
            message="learn curate usage profile match flag changed",
        )
        require_package_smoke(usage.get("exists") is True, context=context, cmd=cmd, message="learn curate usage fixture missing")
        require_package_smoke(usage.get("eventCount") == 1, context=context, cmd=cmd, message="learn curate usage event count changed")
        require_package_smoke(usage.get("usedEntryCount") == 1, context=context, cmd=cmd, message="learn curate usage used count changed")
        require_package_smoke(usage.get("unusedEntryCount") == 2, context=context, cmd=cmd, message="learn curate usage unused count changed")
        require_package_smoke(
            usage.get("staleSelectedEntryCount") == 1,
            context=context,
            cmd=cmd,
            message="learn curate usage stale count changed",
        )
        require_package_smoke(usage.get("reviewCount") == 3, context=context, cmd=cmd, message="learn curate usage review count changed")
        require_package_smoke(usage.get("unusedReviewCount") == 2, context=context, cmd=cmd, message="learn curate usage unused review count changed")
        require_package_smoke(usage.get("staleReviewCount") == 1, context=context, cmd=cmd, message="learn curate usage stale review count changed")
        require_package_smoke(usage.get("autoArchive") is False, context=context, cmd=cmd, message="learn curate usage autoArchive changed")
        reviews = usage.get("reviews")
        require_package_smoke(isinstance(reviews, list), context=context, cmd=cmd, message="learn curate usage reviews missing")
        review_reasons = {
            item.get("entryId"): item.get("reason")
            for item in reviews
            if isinstance(item, dict)
        }
        require_package_smoke(
            review_reasons.get("learn-stale") == "stale-selected-entry-id",
            context=context,
            cmd=cmd,
            message="learn curate stale usage review changed",
        )
        require_package_smoke(
            review_reasons.get("learn-b") == "unused-with-limited-history"
            and review_reasons.get("learn-c") == "unused-with-limited-history",
            context=context,
            cmd=cmd,
            message="learn curate unused usage review changed",
        )
    else:
        require_package_smoke(
            usage.get("autoArchive") is False,
            context=context,
            cmd=cmd,
            message="learn curate usage autoArchive changed",
        )

    proposals = payload.get("proposals")
    require_package_smoke(isinstance(proposals, list), context=context, cmd=cmd, message="learn curate proposals missing")
    proposals_by_entry = {
        proposal.get("entryId"): proposal
        for proposal in proposals
        if isinstance(proposal, dict)
    }
    expected_reasons = {
        "learn-b": "duplicate-entry",
        "learn-c": "sensitive-content",
    }
    for entry_id, reason in expected_reasons.items():
        proposal = proposals_by_entry.get(entry_id)
        require_package_smoke(
            isinstance(proposal, dict)
            and proposal.get("action") == "archive"
            and proposal.get("reason") == reason,
            context=context,
            cmd=cmd,
            message=f"learn curate proposal changed for {entry_id}",
        )

    archived = payload.get("archived")
    if dry_run:
        require_package_smoke(archived == [], context=context, cmd=cmd, message="learn curate dry run should not archive entries")
        require_package_smoke(payload.get("after") is None, context=context, cmd=cmd, message="learn curate dry run should not include after summary")
    else:
        require_package_smoke(
            isinstance(archived, list) and [item.get("id") for item in archived] == ["learn-b", "learn-c"],
            context=context,
            cmd=cmd,
            message="learn curate archived entries changed",
        )
        after = payload.get("after")
        require_package_smoke(
            isinstance(after, dict) and after.get("status") == "pass",
            context=context,
            cmd=cmd,
            message="learn curate should leave a passing profile after archived entries move out",
        )


def assert_learning_curation_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Learning curation preview",
        "Archive candidates: 2",
        "Would archive:",
        "learn-b: duplicate-entry",
        "learn-c: sensitive-content",
        "No changes made.",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn curate human output missing {expected!r}",
        )


def assert_learning_curation_report(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Learning Curation Report",
        "Mode: preview",
        "Archive candidates: 2",
        "`learn-b`: duplicate-entry",
        "`learn-c`: sensitive-content",
        "## Usage Review",
        "Usage sidecars store selected entry ids and short brief hashes",
        "rerun `design-ai learn --curate --yes`",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn curate report missing {expected!r}",
        )


def assert_learning_feedback_json(
    raw: str,
    *,
    profile_path: Path,
    outcome: str,
    category: str,
    expected_instruction: str,
    expected_count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn feedback JSON") from error

    require_package_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON must be an object",
    )
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn feedback JSON file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("count") == expected_count,
        context=context,
        cmd=cmd,
        message="learn feedback JSON count changed",
    )
    feedback = payload.get("feedback")
    entry = payload.get("entry")
    require_package_smoke(
        isinstance(feedback, dict) and isinstance(entry, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON should include feedback and entry objects",
    )
    require_package_smoke(
        feedback.get("outcome") == outcome,
        context=context,
        cmd=cmd,
        message="learn feedback outcome changed",
    )
    require_package_smoke(
        feedback.get("category") == category and entry.get("category") == category,
        context=context,
        cmd=cmd,
        message="learn feedback category changed",
    )
    require_package_smoke(
        entry.get("source") == f"feedback:{outcome}",
        context=context,
        cmd=cmd,
        message="learn feedback source should preserve the outcome",
    )
    require_package_smoke(
        isinstance(feedback.get("instruction"), str)
        and feedback.get("instruction") == entry.get("text")
        and feedback.get("instruction") == expected_instruction,
        context=context,
        cmd=cmd,
        message="learn feedback instruction text changed",
    )


def assert_learning_feedback_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    if profile_path.exists():
        profile_path.unlink()

    cmd = command_factory(
        "learn",
        "--feedback",
        "Keep audit findings short and evidence-led",
        "--outcome",
        "keep",
        "--file",
        str(profile_path),
        "--json",
    )
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_learning_feedback_json(
        result.stdout,
        profile_path=profile_path,
        outcome="keep",
        category="workflow",
        expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
        expected_count=1,
        context=context,
        cmd=cmd,
    )

    feedback_file = profile_path.with_name(f"{profile_path.stem}-feedback.md")
    feedback_file.write_text("Prefer keyboard-first critique notes\n", encoding="utf-8")
    file_cmd = command_factory(
        "learn",
        "--feedback",
        "--from-file",
        str(feedback_file),
        "--outcome",
        "improve",
        "--category",
        "accessibility",
        "--file",
        str(profile_path),
        "--json",
    )
    file_result = run_plain(file_cmd, cwd=cwd, env=env)
    assert_learning_feedback_json(
        file_result.stdout,
        profile_path=profile_path,
        outcome="improve",
        category="accessibility",
        expected_instruction="Improve future outputs by: Prefer keyboard-first critique notes",
        expected_count=2,
        context=f"{context} from-file",
        cmd=file_cmd,
    )

    stdin_cmd = command_factory(
        "learn",
        "--feedback",
        "--stdin",
        "--outcome",
        "avoid",
        "--category",
        "brand",
        "--file",
        str(profile_path),
        "--json",
    )
    stdin_result = run_plain_with_input(
        stdin_cmd,
        input_text="decorative launch-page language in enterprise dashboards",
        cwd=cwd,
        env=env,
    )
    assert_learning_feedback_json(
        stdin_result.stdout,
        profile_path=profile_path,
        outcome="avoid",
        category="brand",
        expected_instruction="Avoid in future outputs: decorative launch-page language in enterprise dashboards",
        expected_count=3,
        context=f"{context} stdin",
        cmd=stdin_cmd,
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-feedback-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--feedback",
        "Keep evidence labels attached to design QA findings",
        "--outcome",
        "keep",
        "--category",
        "workflow",
        "--file",
        str(profile_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_feedback_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        outcome="keep",
        category="workflow",
        expected_instruction="Repeat in future outputs: Keep evidence labels attached to design QA findings",
        expected_count=4,
        context=f"{context} out file",
        cmd=out_cmd,
    )
    out_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(out_profile.get("entries", [])) == 4,
        context=f"{context} out profile",
        cmd=out_cmd,
        message="learn feedback --out should still persist the feedback entry",
    )


def assert_learning_init_json(
    raw: str,
    *,
    profile_path: Path,
    dry_run: bool,
    added_count: int,
    skipped_count: int,
    count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn init JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn init JSON must be an object")
    require_package_smoke(
        list(payload) == [
            "file",
            "dryRun",
            "applied",
            "source",
            "candidateCount",
            "addedCount",
            "skippedCount",
            "count",
            "entries",
            "skipped",
        ],
        context=context,
        cmd=cmd,
        message="learn init JSON keys changed",
    )
    require_package_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn init file path changed")
    require_package_smoke(payload.get("dryRun") is dry_run, context=context, cmd=cmd, message="learn init dryRun flag changed")
    require_package_smoke(payload.get("applied") is (not dry_run), context=context, cmd=cmd, message="learn init applied flag changed")
    require_package_smoke(payload.get("source") == "init:local-dogfood", context=context, cmd=cmd, message="learn init source changed")
    require_package_smoke(payload.get("candidateCount") == 6, context=context, cmd=cmd, message="learn init candidate count changed")
    require_package_smoke(payload.get("addedCount") == added_count, context=context, cmd=cmd, message="learn init added count changed")
    require_package_smoke(payload.get("skippedCount") == skipped_count, context=context, cmd=cmd, message="learn init skipped count changed")
    require_package_smoke(payload.get("count") == count, context=context, cmd=cmd, message="learn init profile count changed")

    entries = payload.get("entries")
    skipped = payload.get("skipped")
    require_package_smoke(isinstance(entries, list) and len(entries) == added_count, context=context, cmd=cmd, message="learn init entries list changed")
    require_package_smoke(isinstance(skipped, list) and len(skipped) == skipped_count, context=context, cmd=cmd, message="learn init skipped list changed")

    if entries:
        categories = [entry.get("category") for entry in entries if isinstance(entry, dict)]
        require_package_smoke(
            categories == ["preference", "workflow", "accessibility", "korean", "brand", "constraint"],
            context=context,
            cmd=cmd,
            message="learn init entry categories changed",
        )
        require_package_smoke(
            all(
                isinstance(entry, dict)
                and isinstance(entry.get("id"), str)
                and entry["id"].startswith("learn-")
                and entry.get("source") == "init:local-dogfood"
                and isinstance(entry.get("createdAt"), str)
                and isinstance(entry.get("text"), str)
                for entry in entries
            ),
            context=context,
            cmd=cmd,
            message="learn init entry schema changed",
        )
        require_package_smoke(
            "one best path" in entries[0].get("text", "")
            and "repository context" in entries[1].get("text", "")
            and "WCAG 2.1 AA" in entries[2].get("text", "")
            and "Pretendard" in entries[3].get("text", "")
            and "restrained product UI language" in entries[4].get("text", "")
            and "external AI APIs" in entries[5].get("text", ""),
            context=context,
            cmd=cmd,
            message="learn init entry text changed",
        )

    if skipped:
        require_package_smoke(
            all(item.get("reason") == "duplicate-entry-text" for item in skipped if isinstance(item, dict)),
            context=context,
            cmd=cmd,
            message="learn init skipped reason changed",
        )


def assert_learning_init_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    if profile_path.exists():
        profile_path.unlink()

    preview_cmd = command_factory("learn", "--init", "--file", str(profile_path), "--json")
    preview_result = run_plain(preview_cmd, cwd=cwd, env=env)
    assert_learning_init_json(
        preview_result.stdout,
        profile_path=profile_path,
        dry_run=True,
        added_count=6,
        skipped_count=0,
        count=6,
        context=f"{context} preview",
        cmd=preview_cmd,
    )
    require_package_smoke(
        not profile_path.exists(),
        context=f"{context} preview",
        cmd=preview_cmd,
        message="learn init preview should not create a profile",
    )

    apply_cmd = command_factory("learn", "--init", "--yes", "--file", str(profile_path), "--json")
    apply_result = run_plain(apply_cmd, cwd=cwd, env=env)
    assert_learning_init_json(
        apply_result.stdout,
        profile_path=profile_path,
        dry_run=False,
        added_count=6,
        skipped_count=0,
        count=6,
        context=f"{context} apply",
        cmd=apply_cmd,
    )
    try:
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"{context}: failed to read initialized learning profile") from error
    require_package_smoke(
        isinstance(profile.get("entries"), list) and len(profile["entries"]) == 6,
        context=f"{context} apply",
        cmd=apply_cmd,
        message="learn init did not persist starter entries",
    )

    duplicate_result = run_plain(apply_cmd, cwd=cwd, env=env)
    assert_learning_init_json(
        duplicate_result.stdout,
        profile_path=profile_path,
        dry_run=False,
        added_count=0,
        skipped_count=6,
        count=6,
        context=f"{context} duplicate",
        cmd=apply_cmd,
    )


def write_learning_import_target_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:00.000Z",
                "entries": [
                    {
                        "id": "learn-existing",
                        "category": "brand",
                        "text": "Use quiet enterprise language",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def write_learning_redaction_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:01.000Z",
                "entries": [
                    {
                        "id": "learn-sensitive",
                        "category": "constraint",
                        "text": "Never include api_key: sk-test12345678901234567890 in shared learning profiles",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-clean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def learning_import_payload_text() -> str:
    return json.dumps(
        {
            "file": "/portable/learning.json",
            "entries": [
                {
                    "id": "learn-existing",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "learn-existing",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
        },
        indent=2,
    )


def learning_diff_payload_text() -> str:
    return json.dumps(
        {
            "file": "/portable/learning-diff.json",
            "version": 1,
            "updatedAt": "2026-05-22T00:00:03.000Z",
            "entries": [
                {
                    "id": "learn-existing-restored",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
                {
                    "id": "learn-new",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:02.000Z",
                },
                {
                    "id": "learn-existing",
                    "category": "workflow",
                    "text": "Use a release checklist before handoff",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:03.000Z",
                },
            ],
        },
        indent=2,
    )


def assert_learning_import_json(
    raw: str,
    *,
    profile_path: Path,
    dry_run: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn import JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn import JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn import JSON file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn import dry-run/apply flags changed",
    )
    require_package_smoke(payload.get("importedCount") == 2, context=context, cmd=cmd, message="learn import source count changed")
    require_package_smoke(payload.get("addedCount") == 1, context=context, cmd=cmd, message="learn import added count changed")
    require_package_smoke(payload.get("skippedCount") == 1, context=context, cmd=cmd, message="learn import skipped count changed")
    require_package_smoke(payload.get("count") == 2, context=context, cmd=cmd, message="learn import final count changed")

    added = payload.get("added")
    skipped = payload.get("skipped")
    require_package_smoke(isinstance(added, list) and len(added) == 1, context=context, cmd=cmd, message="learn import added list missing")
    require_package_smoke(isinstance(skipped, list) and len(skipped) == 1, context=context, cmd=cmd, message="learn import skipped list missing")

    added_entry = added[0]
    skipped_entry = skipped[0]
    require_package_smoke(
        added_entry.get("category") == "korean"
        and added_entry.get("source") == "import:cli"
        and added_entry.get("id") != "learn-existing",
        context=context,
        cmd=cmd,
        message="learn import added entry metadata changed",
    )
    require_package_smoke(
        skipped_entry.get("reason") == "duplicate-entry-text"
        and skipped_entry.get("category") == "brand",
        context=context,
        cmd=cmd,
        message="learn import duplicate skip metadata changed",
    )


def assert_learning_import_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_import_target_fixture(profile_path)
    import_file = profile_path.with_name(f"{profile_path.stem}-import.json")
    import_file.write_text(f"{learning_import_payload_text()}\n", encoding="utf-8")

    dry_run_cmd = command_factory(
        "learn",
        "--import",
        "--from-file",
        str(import_file),
        "--dry-run",
        "--file",
        str(profile_path),
        "--json",
    )
    dry_run_result = run_plain(dry_run_cmd, cwd=cwd, env=env)
    assert_learning_import_json(
        dry_run_result.stdout,
        profile_path=profile_path,
        dry_run=True,
        context=f"{context} from-file dry-run",
        cmd=dry_run_cmd,
    )
    dry_run_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(dry_run_profile.get("entries", [])) == 1,
        context=f"{context} dry-run profile unchanged",
        cmd=dry_run_cmd,
        message="learn import dry-run should leave target profile unchanged",
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-import-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--import",
        "--from-file",
        str(import_file),
        "--dry-run",
        "--file",
        str(profile_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_import_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        dry_run=True,
        context=f"{context} out file",
        cmd=out_cmd,
    )
    out_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(out_profile.get("entries", [])) == 1,
        context=f"{context} out profile unchanged",
        cmd=out_cmd,
        message="learn import --out dry-run should leave target profile unchanged",
    )

    apply_cmd = command_factory(
        "learn",
        "--import",
        "--stdin",
        "--yes",
        "--file",
        str(profile_path),
        "--json",
    )
    apply_result = run_plain_with_input(
        apply_cmd,
        input_text=learning_import_payload_text(),
        cwd=cwd,
        env=env,
    )
    assert_learning_import_json(
        apply_result.stdout,
        profile_path=profile_path,
        dry_run=False,
        context=f"{context} stdin apply",
        cmd=apply_cmd,
    )
    applied_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(applied_profile.get("entries", [])) == 2,
        context=f"{context} apply profile",
        cmd=apply_cmd,
        message="learn import apply should persist the merged entry",
    )


def assert_learning_backup_json(
    raw: str,
    *,
    profile_path: Path,
    expected_count: int,
    expected_status: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn backup JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn backup JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn backup JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("version") == 1, context=context, cmd=cmd, message="learn backup version changed")
    require_package_smoke(payload.get("count") == expected_count, context=context, cmd=cmd, message="learn backup count changed")
    require_package_smoke(
        isinstance(payload.get("exportedAt"), str) and payload.get("exportedAt"),
        context=context,
        cmd=cmd,
        message="learn backup exportedAt missing",
    )

    audit_summary = payload.get("auditSummary")
    require_package_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == expected_status,
        context=context,
        cmd=cmd,
        message="learn backup audit summary changed",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == expected_count,
        context=context,
        cmd=cmd,
        message="learn backup entries list changed",
    )
    require_package_smoke(
        all(isinstance(entry, dict) and isinstance(entry.get("text"), str) and entry.get("text") for entry in entries),
        context=context,
        cmd=cmd,
        message="learn backup entries should preserve full text",
    )


def assert_learning_backup_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_import_target_fixture(profile_path)
    cmd = command_factory(
        "learn",
        "--backup",
        "--file",
        str(profile_path),
        "--json",
    )
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_learning_backup_json(
        result.stdout,
        profile_path=profile_path,
        expected_count=1,
        expected_status="pass",
        context=context,
        cmd=cmd,
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-backup-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--backup",
        "--file",
        str(profile_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    require_package_smoke(
        "Wrote " in out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        message="learn backup --out should confirm the written file",
    )
    assert_learning_backup_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        expected_count=1,
        expected_status="pass",
        context=f"{context} out file",
        cmd=out_cmd,
    )


def assert_learning_redact_json(
    raw: str,
    *,
    profile_path: Path,
    expected_count: int,
    expected_redacted_count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn redact JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn redact JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn redact JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("redacted") is True, context=context, cmd=cmd, message="learn redact marker missing")
    require_package_smoke(payload.get("count") == expected_count, context=context, cmd=cmd, message="learn redact count changed")
    require_package_smoke(
        payload.get("redactedCount") == expected_redacted_count,
        context=context,
        cmd=cmd,
        message="learn redact redactedCount changed",
    )

    source_audit = payload.get("sourceAuditSummary")
    require_package_smoke(
        isinstance(source_audit, dict) and source_audit.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn redact source audit should warn for the fixture",
    )
    audit_summary = payload.get("auditSummary")
    require_package_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == "pass",
        context=context,
        cmd=cmd,
        message="learn redact redacted audit should pass for the fixture",
    )

    redactions = payload.get("redactions")
    require_package_smoke(
        isinstance(redactions, list) and len(redactions) == expected_redacted_count,
        context=context,
        cmd=cmd,
        message="learn redact redactions list changed",
    )
    require_package_smoke(
        redactions and redactions[0].get("entryId") == "learn-sensitive",
        context=context,
        cmd=cmd,
        message="learn redact should report the sensitive entry id",
    )
    require_package_smoke(
        set(redactions[0].get("codes", [])) >= {"sensitive-secret-assignment", "sensitive-openai-secret-key"},
        context=context,
        cmd=cmd,
        message="learn redact should report sensitive pattern codes",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == expected_count,
        context=context,
        cmd=cmd,
        message="learn redact entries list changed",
    )
    sensitive_entry = next((entry for entry in entries if entry.get("id") == "learn-sensitive"), None)
    require_package_smoke(isinstance(sensitive_entry, dict), context=context, cmd=cmd, message="learn redact sensitive entry missing")
    redacted_text = sensitive_entry.get("text", "")
    require_package_smoke(
        "[REDACTED:secret-assignment]" in redacted_text and "[REDACTED:openai-secret-key]" in redacted_text,
        context=context,
        cmd=cmd,
        message="learn redact did not include redaction markers",
    )
    require_package_smoke(
        "sk-test" not in redacted_text and "api_key" not in redacted_text,
        context=context,
        cmd=cmd,
        message="learn redact leaked sensitive-looking text",
    )


def assert_learning_redact_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_redaction_fixture(profile_path)
    cmd = command_factory(
        "learn",
        "--redact",
        "--file",
        str(profile_path),
        "--json",
    )
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_learning_redact_json(
        result.stdout,
        profile_path=profile_path,
        expected_count=2,
        expected_redacted_count=1,
        context=context,
        cmd=cmd,
    )
    source_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        "sk-test12345678901234567890" in source_profile["entries"][0]["text"],
        context=f"{context} source profile unchanged",
        cmd=cmd,
        message="learn redact should not mutate the source profile",
    )

    source_path = profile_path.with_name(f"{profile_path.stem}-portable.json")
    write_learning_redaction_fixture(source_path)
    from_file_cmd = command_factory(
        "learn",
        "--redact",
        "--from-file",
        str(source_path),
        "--json",
    )
    from_file_result = run_plain(from_file_cmd, cwd=cwd, env=env)
    assert_learning_redact_json(
        from_file_result.stdout,
        profile_path=source_path,
        expected_count=2,
        expected_redacted_count=1,
        context=f"{context} from-file",
        cmd=from_file_cmd,
    )
    source_payload = json.loads(source_path.read_text(encoding="utf-8"))
    require_package_smoke(
        "sk-test12345678901234567890" in source_payload["entries"][0]["text"],
        context=f"{context} from-file source unchanged",
        cmd=from_file_cmd,
        message="learn redact --from-file should not mutate the source payload",
    )

    stdin_cmd = command_factory(
        "learn",
        "--redact",
        "--stdin",
        "--json",
    )
    stdin_result = run_plain_with_input(
        stdin_cmd,
        input_text=source_path.read_text(encoding="utf-8"),
        cwd=cwd,
        env=env,
    )
    assert_learning_redact_json(
        stdin_result.stdout,
        profile_path=Path("stdin"),
        expected_count=2,
        expected_redacted_count=1,
        context=f"{context} stdin",
        cmd=stdin_cmd,
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-redacted-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--redact",
        "--from-file",
        str(source_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    require_package_smoke(
        "Wrote " in out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        message="learn redact --out should confirm the written file",
    )
    assert_learning_redact_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=source_path,
        expected_count=2,
        expected_redacted_count=1,
        context=f"{context} out file",
        cmd=out_cmd,
    )


def assert_learning_verify_json(
    raw: str,
    *,
    source: str,
    expected_count: int,
    expected_status: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn verify JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn verify JSON must be an object")
    require_package_smoke(
        payload.get("source") == source,
        context=context,
        cmd=cmd,
        message="learn verify JSON source changed",
    )
    require_package_smoke(payload.get("importable") is True, context=context, cmd=cmd, message="learn verify importable flag changed")
    require_package_smoke(payload.get("count") == expected_count, context=context, cmd=cmd, message="learn verify count changed")

    audit_summary = payload.get("auditSummary")
    require_package_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == expected_status,
        context=context,
        cmd=cmd,
        message="learn verify audit summary changed",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == expected_count,
        context=context,
        cmd=cmd,
        message="learn verify entries list changed",
    )
    require_package_smoke(
        all(isinstance(entry, dict) and entry.get("source", "").startswith("import:") for entry in entries),
        context=context,
        cmd=cmd,
        message="learn verify entries should be normalized as import entries",
    )


def assert_learning_verify_smoke(
    command_factory,
    source_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    source_path.write_text(f"{learning_import_payload_text()}\n", encoding="utf-8")

    from_file_cmd = command_factory(
        "learn",
        "--verify",
        "--from-file",
        str(source_path),
        "--json",
    )
    from_file_result = run_plain(from_file_cmd, cwd=cwd, env=env)
    assert_learning_verify_json(
        from_file_result.stdout,
        source=str(source_path),
        expected_count=2,
        expected_status="warn",
        context=f"{context} from-file",
        cmd=from_file_cmd,
    )

    out_path = source_path.with_name(f"{source_path.stem}-verify-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--verify",
        "--from-file",
        str(source_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_verify_json(
        out_path.read_text(encoding="utf-8"),
        source=str(source_path),
        expected_count=2,
        expected_status="warn",
        context=f"{context} out file",
        cmd=out_cmd,
    )

    stdin_cmd = command_factory(
        "learn",
        "--verify",
        "--stdin",
        "--json",
    )
    stdin_result = run_plain_with_input(
        stdin_cmd,
        input_text=learning_import_payload_text(),
        cwd=cwd,
        env=env,
    )
    assert_learning_verify_json(
        stdin_result.stdout,
        source="stdin",
        expected_count=2,
        expected_status="warn",
        context=f"{context} stdin",
        cmd=stdin_cmd,
    )


def assert_learning_diff_json(
    raw: str,
    *,
    profile_path: Path,
    source: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn diff JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn diff JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn diff JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("source") == source, context=context, cmd=cmd, message="learn diff source changed")
    require_package_smoke(payload.get("profileCount") == 1, context=context, cmd=cmd, message="learn diff profile count changed")
    require_package_smoke(payload.get("comparisonCount") == 3, context=context, cmd=cmd, message="learn diff comparison count changed")
    require_package_smoke(payload.get("sameTextCount") == 1, context=context, cmd=cmd, message="learn diff same text count changed")
    require_package_smoke(payload.get("profileOnlyCount") == 0, context=context, cmd=cmd, message="learn diff profile-only count changed")
    require_package_smoke(payload.get("comparisonOnlyCount") == 2, context=context, cmd=cmd, message="learn diff comparison-only count changed")
    require_package_smoke(payload.get("metadataChangedCount") == 1, context=context, cmd=cmd, message="learn diff metadata change count changed")
    require_package_smoke(payload.get("idConflictCount") == 1, context=context, cmd=cmd, message="learn diff id conflict count changed")

    metadata_changed = payload.get("metadataChanged")
    comparison_only = payload.get("comparisonOnly")
    id_conflicts = payload.get("idConflicts")
    require_package_smoke(
        isinstance(metadata_changed, list)
        and len(metadata_changed) == 1
        and metadata_changed[0].get("changedFields") == ["id", "source", "createdAt"],
        context=context,
        cmd=cmd,
        message="learn diff metadata change details changed",
    )
    require_package_smoke(
        isinstance(comparison_only, list)
        and len(comparison_only) == 2
        and {entry.get("id") for entry in comparison_only} == {"learn-new", "learn-existing"},
        context=context,
        cmd=cmd,
        message="learn diff comparison-only entries changed",
    )
    require_package_smoke(
        isinstance(id_conflicts, list)
        and len(id_conflicts) == 1
        and id_conflicts[0].get("id") == "learn-existing",
        context=context,
        cmd=cmd,
        message="learn diff id conflict details changed",
    )

    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict) and privacy.get("mutatesProfile") is False,
        context=context,
        cmd=cmd,
        message="learn diff should report read-only privacy behavior",
    )


def assert_learning_diff_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_import_target_fixture(profile_path)
    diff_file = profile_path.with_name(f"{profile_path.stem}-diff.json")
    diff_file.write_text(f"{learning_diff_payload_text()}\n", encoding="utf-8")

    cmd = command_factory(
        "learn",
        "--diff",
        "--from-file",
        str(diff_file),
        "--file",
        str(profile_path),
        "--json",
    )
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_learning_diff_json(
        result.stdout,
        profile_path=profile_path,
        source=str(diff_file),
        context=context,
        cmd=cmd,
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-diff-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--diff",
        "--from-file",
        str(diff_file),
        "--file",
        str(profile_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_diff_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        source=str(diff_file),
        context=f"{context} out file",
        cmd=out_cmd,
    )

    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(profile.get("entries", [])) == 1,
        context=f"{context} profile mutation",
        cmd=cmd,
        message="learn diff should not import or remove active profile entries",
    )


def assert_learning_restore_json(
    raw: str,
    *,
    profile_path: Path,
    source: str,
    dry_run: bool,
    backup_path: Path | None = None,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn restore JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn restore JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("source") == source, context=context, cmd=cmd, message="learn restore source changed")
    require_package_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore dry-run/apply flags changed",
    )
    require_package_smoke(payload.get("restorable") is True, context=context, cmd=cmd, message="learn restore should be restorable")
    backup_file = payload.get("backupFile")
    require_package_smoke(isinstance(backup_file, str) and backup_file, context=context, cmd=cmd, message="learn restore backup file is missing")
    if backup_path is not None:
        require_package_smoke(backup_file == str(backup_path), context=context, cmd=cmd, message="learn restore backup file path changed")
    else:
        require_package_smoke(
            f"{profile_path.stem}.restore-backup-" in backup_file,
            context=context,
            cmd=cmd,
            message="learn restore default backup file naming changed",
        )
    require_package_smoke(
        payload.get("backupCreated") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore backup created flag changed",
    )
    require_package_smoke(payload.get("backupEntryCount") == 1, context=context, cmd=cmd, message="learn restore backup entry count changed")
    rollback_command = payload.get("rollbackCommand")
    require_package_smoke(
        isinstance(rollback_command, str)
        and "design-ai learn --restore --from-file" in rollback_command
        and str(profile_path) in rollback_command,
        context=context,
        cmd=cmd,
        message="learn restore rollback command changed",
    )
    require_package_smoke(payload.get("previousCount") == 1, context=context, cmd=cmd, message="learn restore previous count changed")
    require_package_smoke(payload.get("restoredCount") == 3, context=context, cmd=cmd, message="learn restore restored count changed")
    require_package_smoke(payload.get("removedCount") == 0, context=context, cmd=cmd, message="learn restore removed count changed")
    require_package_smoke(payload.get("addedCount") == 2, context=context, cmd=cmd, message="learn restore added count changed")
    require_package_smoke(payload.get("metadataChangedCount") == 1, context=context, cmd=cmd, message="learn restore metadata change count changed")
    require_package_smoke(payload.get("idConflictCount") == 1, context=context, cmd=cmd, message="learn restore id conflict count changed")
    require_package_smoke(
        payload.get("auditSummary") == {"status": "pass", "failures": 0, "warnings": 0},
        context=context,
        cmd=cmd,
        message="learn restore audit summary changed",
    )

    diff = payload.get("diff")
    require_package_smoke(
        isinstance(diff, dict)
        and diff.get("comparisonOnlyCount") == 2
        and diff.get("metadataChangedCount") == 1
        and diff.get("idConflictCount") == 1,
        context=context,
        cmd=cmd,
        message="learn restore diff summary changed",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict) and privacy.get("mutatesProfile") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore privacy mutation flag changed",
    )


def assert_learning_restore_backups_json(
    raw: str,
    *,
    profile_path: Path,
    backup_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn restore-backups JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore-backups JSON must be an object")
    require_package_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn restore-backups file path changed")
    require_package_smoke(
        payload.get("directory") == str(profile_path.parent)
        and payload.get("pattern") == f"{profile_path.stem}.restore-backup-*.json",
        context=context,
        cmd=cmd,
        message="learn restore-backups search pattern changed",
    )
    require_package_smoke(payload.get("totalCount", 0) >= 1, context=context, cmd=cmd, message="learn restore-backups should find rollback backups")
    require_package_smoke(payload.get("count", 0) >= 1, context=context, cmd=cmd, message="learn restore-backups limited count changed")
    backups = payload.get("backups")
    require_package_smoke(isinstance(backups, list) and backups, context=context, cmd=cmd, message="learn restore-backups backups array missing")
    first = backups[0]
    require_package_smoke(first.get("file") == str(backup_path), context=context, cmd=cmd, message="learn restore-backups latest file changed")
    require_package_smoke(first.get("entryCount") == 1, context=context, cmd=cmd, message="learn restore-backups entry count changed")
    require_package_smoke(
        first.get("auditSummary") == {"status": "pass", "failures": 0, "warnings": 0},
        context=context,
        cmd=cmd,
        message="learn restore-backups audit summary changed",
    )
    restore_preview_command = first.get("restorePreviewCommand")
    require_package_smoke(
        isinstance(restore_preview_command, str)
        and "design-ai learn --restore --from-file" in restore_preview_command
        and str(backup_path) in restore_preview_command
        and str(profile_path) in restore_preview_command,
        context=context,
        cmd=cmd,
        message="learn restore-backups preview command changed",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict) and privacy.get("mutatesProfile") is False,
        context=context,
        cmd=cmd,
        message="learn restore-backups privacy mutation flag changed",
    )


def assert_learning_restore_backups_prune_json(
    raw: str,
    *,
    profile_path: Path,
    deleted_path: Path,
    dry_run: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn restore-backups prune JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore-backups prune JSON must be an object")
    require_package_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn restore-backups prune file path changed")
    prune = payload.get("prune")
    require_package_smoke(isinstance(prune, dict), context=context, cmd=cmd, message="learn restore-backups prune payload missing")
    require_package_smoke(prune.get("dryRun") is dry_run, context=context, cmd=cmd, message="learn restore-backups prune dryRun changed")
    require_package_smoke(prune.get("applied") is (not dry_run), context=context, cmd=cmd, message="learn restore-backups prune applied flag changed")
    require_package_smoke(prune.get("keep") == 1, context=context, cmd=cmd, message="learn restore-backups prune keep count changed")
    require_package_smoke(prune.get("candidateCount") == 1, context=context, cmd=cmd, message="learn restore-backups prune candidate count changed")
    expected_deleted_count = 0 if dry_run else 1
    require_package_smoke(prune.get("deletedCount") == expected_deleted_count, context=context, cmd=cmd, message="learn restore-backups prune deleted count changed")
    candidates = prune.get("candidates")
    require_package_smoke(isinstance(candidates, list) and candidates, context=context, cmd=cmd, message="learn restore-backups prune candidates missing")
    require_package_smoke(candidates[0].get("file") == str(deleted_path), context=context, cmd=cmd, message="learn restore-backups prune candidate file changed")
    if not dry_run:
        deleted = prune.get("deleted")
        require_package_smoke(isinstance(deleted, list) and deleted, context=context, cmd=cmd, message="learn restore-backups prune deleted list missing")
        require_package_smoke(deleted[0].get("file") == str(deleted_path), context=context, cmd=cmd, message="learn restore-backups prune deleted file changed")
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("deletesBackupFiles") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore-backups prune privacy flags changed",
    )


def assert_learning_restore_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_import_target_fixture(profile_path)
    restore_file = profile_path.with_name(f"{profile_path.stem}-restore.json")
    restore_file.write_text(f"{learning_diff_payload_text()}\n", encoding="utf-8")

    dry_run_cmd = command_factory(
        "learn",
        "--restore",
        "--from-file",
        str(restore_file),
        "--dry-run",
        "--file",
        str(profile_path),
        "--json",
    )
    dry_run_result = run_plain(dry_run_cmd, cwd=cwd, env=env)
    assert_learning_restore_json(
        dry_run_result.stdout,
        profile_path=profile_path,
        source=str(restore_file),
        dry_run=True,
        context=f"{context} from-file dry-run",
        cmd=dry_run_cmd,
    )
    dry_run_payload = json.loads(dry_run_result.stdout)
    require_package_smoke(
        not Path(dry_run_payload["backupFile"]).exists(),
        context=f"{context} dry-run rollback backup",
        cmd=dry_run_cmd,
        message="learn restore dry-run should not create rollback backup file",
    )
    dry_run_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(dry_run_profile.get("entries", [])) == 1,
        context=f"{context} dry-run profile unchanged",
        cmd=dry_run_cmd,
        message="learn restore dry-run should leave target profile unchanged",
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-restore-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--restore",
        "--from-file",
        str(restore_file),
        "--dry-run",
        "--file",
        str(profile_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_restore_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        source=str(restore_file),
        dry_run=True,
        context=f"{context} out file",
        cmd=out_cmd,
    )
    out_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(out_profile.get("entries", [])) == 1,
        context=f"{context} out profile unchanged",
        cmd=out_cmd,
        message="learn restore --out dry-run should leave target profile unchanged",
    )

    backup_path = profile_path.with_name(f"{profile_path.stem}-rollback.json")
    apply_cmd = command_factory(
        "learn",
        "--restore",
        "--stdin",
        "--yes",
        "--file",
        str(profile_path),
        "--backup-file",
        str(backup_path),
        "--json",
    )
    apply_result = run_plain_with_input(
        apply_cmd,
        input_text=learning_diff_payload_text(),
        cwd=cwd,
        env=env,
    )
    assert_learning_restore_json(
        apply_result.stdout,
        profile_path=profile_path,
        source="stdin",
        dry_run=False,
        backup_path=backup_path,
        context=f"{context} stdin apply",
        cmd=apply_cmd,
    )
    backup_profile = json.loads(backup_path.read_text(encoding="utf-8"))
    backup_ids = {entry.get("id") for entry in backup_profile.get("entries", [])}
    require_package_smoke(
        backup_ids == {"learn-existing"},
        context=f"{context} rollback backup profile",
        cmd=apply_cmd,
        message="learn restore apply should save the previous active profile as rollback backup",
    )
    applied_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    applied_ids = {entry.get("id") for entry in applied_profile.get("entries", [])}
    require_package_smoke(
        len(applied_profile.get("entries", [])) == 3
        and applied_ids == {"learn-existing-restored", "learn-new", "learn-existing"},
        context=f"{context} apply profile",
        cmd=apply_cmd,
        message="learn restore apply should replace target profile with restore source",
    )

    restore_inventory_path = profile_path.with_name(f"{profile_path.stem}.restore-backup-20260522T000500000Z.json")
    older_restore_inventory_path = profile_path.with_name(f"{profile_path.stem}.restore-backup-20260522T000400000Z.json")
    restore_inventory_path.write_text(json.dumps(backup_profile, indent=2), encoding="utf-8")
    older_restore_inventory_path.write_text(json.dumps(backup_profile, indent=2), encoding="utf-8")
    backups_human_cmd = command_factory("learn", "--restore-backups", "--file", str(profile_path), "--limit", "1")
    backups_human_result = run_plain(backups_human_cmd, cwd=cwd, env=env)
    require_package_smoke(
        "Learning restore rollback backups" in backups_human_result.stdout
        and restore_inventory_path.name in backups_human_result.stdout
        and "Preview: design-ai learn --restore --from-file" in backups_human_result.stdout,
        context=f"{context} restore-backups human",
        cmd=backups_human_cmd,
        message="learn restore-backups human output changed",
    )

    backups_json_cmd = command_factory("learn", "--restore-backups", "--file", str(profile_path), "--limit", "1", "--json")
    backups_json_result = run_plain(backups_json_cmd, cwd=cwd, env=env)
    assert_learning_restore_backups_json(
        backups_json_result.stdout,
        profile_path=profile_path,
        backup_path=restore_inventory_path,
        context=f"{context} restore-backups JSON",
        cmd=backups_json_cmd,
    )

    backups_out_path = profile_path.with_name(f"{profile_path.stem}-restore-backups-out.json")
    backups_out_path.write_text("stale output\n", encoding="utf-8")
    backups_out_cmd = command_factory(
        "learn",
        "--restore-backups",
        "--file",
        str(profile_path),
        "--limit",
        "1",
        "--json",
        "--out",
        str(backups_out_path),
        "--force",
    )
    backups_out_result = run_plain(backups_out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        backups_out_result.stdout,
        context=f"{context} restore-backups out",
        cmd=backups_out_cmd,
        expected_path=str(backups_out_path),
    )
    assert_learning_restore_backups_json(
        backups_out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        backup_path=restore_inventory_path,
        context=f"{context} restore-backups out file",
        cmd=backups_out_cmd,
    )

    prune_preview_cmd = command_factory(
        "learn",
        "--restore-backups",
        "--prune",
        "--keep",
        "1",
        "--file",
        str(profile_path),
        "--json",
    )
    prune_preview_result = run_plain(prune_preview_cmd, cwd=cwd, env=env)
    assert_learning_restore_backups_prune_json(
        prune_preview_result.stdout,
        profile_path=profile_path,
        deleted_path=older_restore_inventory_path,
        dry_run=True,
        context=f"{context} restore-backups prune preview",
        cmd=prune_preview_cmd,
    )
    require_package_smoke(
        restore_inventory_path.exists() and older_restore_inventory_path.exists(),
        context=f"{context} restore-backups prune preview files",
        cmd=prune_preview_cmd,
        message="learn restore-backups prune preview should not delete backup files",
    )

    prune_apply_cmd = command_factory(
        "learn",
        "--restore-backups",
        "--prune",
        "--keep",
        "1",
        "--file",
        str(profile_path),
        "--yes",
        "--json",
    )
    prune_apply_result = run_plain(prune_apply_cmd, cwd=cwd, env=env)
    assert_learning_restore_backups_prune_json(
        prune_apply_result.stdout,
        profile_path=profile_path,
        deleted_path=older_restore_inventory_path,
        dry_run=False,
        context=f"{context} restore-backups prune apply",
        cmd=prune_apply_cmd,
    )
    require_package_smoke(
        restore_inventory_path.exists() and not older_restore_inventory_path.exists(),
        context=f"{context} restore-backups prune apply files",
        cmd=prune_apply_cmd,
        message="learn restore-backups prune apply should delete only older backup files",
    )


def assert_learning_audit_cleanup_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_audit_fixture(profile_path)
    json_cmd = command_factory("learn", "--audit", "--file", str(profile_path), "--json")
    json_result = run_plain(json_cmd, cwd=cwd, env=env)
    assert_learning_audit_cleanup_json(
        json_result.stdout,
        profile_path=profile_path,
        context=f"{context} JSON",
        cmd=json_cmd,
    )

    out_path = profile_path.with_name(f"{profile_path.stem}-audit-out.json")
    out_path.write_text("stale output\n", encoding="utf-8")
    out_cmd = command_factory(
        "learn",
        "--audit",
        "--file",
        str(profile_path),
        "--json",
        "--out",
        str(out_path),
        "--force",
    )
    out_result = run_plain(out_cmd, cwd=cwd, env=env)
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_audit_cleanup_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        context=f"{context} out file",
        cmd=out_cmd,
    )

    human_cmd = command_factory("learn", "--audit", "--file", str(profile_path))
    human_result = run_plain(human_cmd, cwd=cwd, env=env)
    assert_learning_audit_cleanup_human(human_result.stdout, context=f"{context} human", cmd=human_cmd)

    fix_dry_run_cmd = command_factory("learn", "--audit", "--fix", "--dry-run", "--file", str(profile_path), "--json")
    fix_dry_run_result = run_plain(fix_dry_run_cmd, cwd=cwd, env=env)
    assert_learning_audit_fix_json(
        fix_dry_run_result.stdout,
        profile_path=profile_path,
        dry_run=True,
        context=f"{context} fix dry-run JSON",
        cmd=fix_dry_run_cmd,
    )
    dry_run_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(dry_run_profile.get("entries", [])) == 3,
        context=f"{context} fix dry-run profile unchanged",
        cmd=fix_dry_run_cmd,
        message="learn audit fix dry-run should leave profile entries unchanged",
    )

    fix_apply_cmd = command_factory("learn", "--audit", "--fix", "--yes", "--file", str(profile_path), "--json")
    fix_apply_result = run_plain(fix_apply_cmd, cwd=cwd, env=env)
    assert_learning_audit_fix_json(
        fix_apply_result.stdout,
        profile_path=profile_path,
        dry_run=False,
        context=f"{context} fix apply JSON",
        cmd=fix_apply_cmd,
    )


def assert_learning_curation_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_audit_fixture(profile_path)
    archive_path = profile_path.with_name(f"{profile_path.stem}.archive{profile_path.suffix}")

    human_cmd = command_factory("learn", "--curate", "--file", str(profile_path))
    human_result = run_plain(human_cmd, cwd=cwd, env=env)
    assert_learning_curation_human(human_result.stdout, context=f"{context} human preview", cmd=human_cmd)
    profile_after_human = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(profile_after_human.get("entries", [])) == 3,
        context=f"{context} human preview profile unchanged",
        cmd=human_cmd,
        message="learn curate preview should leave profile entries unchanged",
    )
    require_package_smoke(
        not archive_path.exists(),
        context=f"{context} human preview archive absent",
        cmd=human_cmd,
        message="learn curate preview should not create an archive file",
    )

    report_path = profile_path.with_name(f"{profile_path.stem}.curation-report.md")
    report_cmd = command_factory(
        "learn",
        "--curate",
        "--file",
        str(profile_path),
        "--report",
        "--out",
        str(report_path),
    )
    report_result = run_plain(report_cmd, cwd=cwd, env=env)
    assert_no_ansi(report_result.stdout, report_cmd)
    require_package_smoke(
        "Wrote " in report_result.stdout,
        context=f"{context} report write confirmation",
        cmd=report_cmd,
        message="learn curate report should confirm --out file writes",
    )
    assert_learning_curation_report(
        report_path.read_text(encoding="utf-8"),
        context=f"{context} report preview",
        cmd=report_cmd,
    )
    profile_after_report = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        len(profile_after_report.get("entries", [])) == 3,
        context=f"{context} report preview profile unchanged",
        cmd=report_cmd,
        message="learn curate report should leave profile entries unchanged",
    )
    require_package_smoke(
        not archive_path.exists(),
        context=f"{context} report preview archive absent",
        cmd=report_cmd,
        message="learn curate report preview should not create an archive file",
    )

    json_cmd = command_factory("learn", "--curate", "--file", str(profile_path), "--json")
    json_result = run_plain(json_cmd, cwd=cwd, env=env)
    assert_learning_curation_json(
        json_result.stdout,
        profile_path=profile_path,
        dry_run=True,
        context=f"{context} JSON preview",
        cmd=json_cmd,
    )

    usage_path = profile_path.with_name(f"{profile_path.stem}.usage{profile_path.suffix}")
    write_learning_curation_usage_fixture(profile_path, usage_path)
    usage_cmd = command_factory(
        "learn",
        "--curate",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--json",
    )
    usage_result = run_plain(usage_cmd, cwd=cwd, env=env)
    assert_learning_curation_json(
        usage_result.stdout,
        profile_path=profile_path,
        usage_path=usage_path,
        dry_run=True,
        context=f"{context} usage JSON preview",
        cmd=usage_cmd,
    )

    apply_cmd = command_factory("learn", "--curate", "--yes", "--file", str(profile_path), "--json")
    apply_result = run_plain(apply_cmd, cwd=cwd, env=env)
    assert_learning_curation_json(
        apply_result.stdout,
        profile_path=profile_path,
        dry_run=False,
        context=f"{context} JSON apply",
        cmd=apply_cmd,
    )
    profile_after_apply = json.loads(profile_path.read_text(encoding="utf-8"))
    require_package_smoke(
        [entry.get("id") for entry in profile_after_apply.get("entries", [])] == ["learn-a"],
        context=f"{context} apply profile archived",
        cmd=apply_cmd,
        message="learn curate apply should leave only the canonical profile entry",
    )
    archive_payload = json.loads(archive_path.read_text(encoding="utf-8"))
    require_package_smoke(
        [entry.get("id") for entry in archive_payload.get("entries", [])] == ["learn-b", "learn-c"],
        context=f"{context} apply archive file",
        cmd=apply_cmd,
        message="learn curate apply should write duplicate and sensitive entries to archive",
    )


def assert_route_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_route_explain_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_explain_human_output(result.stdout, context=context, cmd=cmd)


def assert_route_catalog_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_catalog_json(result.stdout, context=context, cmd=cmd)


def assert_route_stdin_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_route_json_component_spec(result.stdout, context=context, cmd=cmd)


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


def assert_audit_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_audit_strict_quiet_output(result.stdout, context=context, cmd=cmd)


def assert_audit_json_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_audit_json(result.stdout, context=context, cmd=cmd)


def assert_check_examples_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_check_examples_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_check_all_routes_issues_only_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_check_all_routes_issues_only_output(result.stdout, context=context, cmd=cmd)


def write_check_artifact(artifact_path: Path) -> None:
    artifact_path.write_text(passing_check_artifact_content(), encoding="utf-8")


def check_learning_capture_artifact_content() -> str:
    return "\n".join([
        "# Design note",
        "",
        (
            "This output cites knowledge/PRINCIPLES.md and gives a concise "
            "recommendation with enough implementation detail for review. "
            "It includes a contrast note for the main foreground and background pair."
        ),
        "",
        (
            "The artifact intentionally leaves several delivery details out so "
            "package smoke can verify check learning capture without producing "
            "a failing check report."
        ),
    ])


def write_check_learning_capture_artifact(artifact_path: Path) -> None:
    artifact_path.write_text(check_learning_capture_artifact_content(), encoding="utf-8")


def assert_check_learning_capture_json(
    raw: str,
    *,
    profile_path: Path,
    expected_file_suffix: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse check learning capture JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="check learning capture JSON must be an object")
    require_package_smoke(
        isinstance(payload.get("filePath"), str) and payload["filePath"].endswith(expected_file_suffix),
        context=context,
        cmd=cmd,
        message="check learning capture file path changed",
    )
    require_package_smoke(payload.get("status") == "warn", context=context, cmd=cmd, message="check learning capture status should warn")
    require_package_smoke(payload.get("failures") == 0, context=context, cmd=cmd, message="check learning capture fixture should not fail")

    capture = payload.get("learningCapture")
    require_package_smoke(isinstance(capture, dict), context=context, cmd=cmd, message="check learningCapture object missing")
    require_package_smoke(
        list(capture) == [
            "file",
            "dryRun",
            "applied",
            "source",
            "candidateCount",
            "addedCount",
            "skippedCount",
            "count",
            "entries",
            "skipped",
        ],
        context=context,
        cmd=cmd,
        message="check learningCapture keys changed",
    )
    require_package_smoke(
        capture.get("file") == str(profile_path)
        and capture.get("dryRun") is False
        and capture.get("applied") is True
        and capture.get("source") == "check:artifact",
        context=context,
        cmd=cmd,
        message="check learning capture metadata changed",
    )
    require_package_smoke(
        capture.get("candidateCount") == 4
        and capture.get("addedCount") == 4
        and capture.get("skippedCount") == 0
        and capture.get("count") == 4,
        context=context,
        cmd=cmd,
        message="check learning capture counts changed",
    )

    entries = capture.get("entries")
    require_package_smoke(isinstance(entries, list) and len(entries) == 4, context=context, cmd=cmd, message="check learning capture entries changed")
    require_package_smoke(capture.get("skipped") == [], context=context, cmd=cmd, message="check learning capture should not skip fresh entries")
    categories = [entry.get("category") for entry in entries if isinstance(entry, dict)]
    require_package_smoke(
        categories.count("accessibility") == 2 and categories.count("workflow") == 2,
        context=context,
        cmd=cmd,
        message="check learning capture categories changed",
    )
    require_package_smoke(
        all(
            isinstance(entry, dict)
            and isinstance(entry.get("id"), str)
            and entry["id"].startswith("learn-")
            and entry.get("source") == "check:artifact"
            and isinstance(entry.get("createdAt"), str)
            and isinstance(entry.get("text"), str)
            and entry["text"].startswith("Improve future outputs by addressing ")
            for entry in entries
        ),
        context=context,
        cmd=cmd,
        message="check learning capture entry schema changed",
    )
    require_package_smoke(
        any("Keyboard and focus behavior" in entry.get("text", "") for entry in entries)
        and any("Screen-reader semantics" in entry.get("text", "") for entry in entries)
        and any("Responsive behavior" in entry.get("text", "") for entry in entries)
        and any("Misuse guidance" in entry.get("text", "") for entry in entries),
        context=context,
        cmd=cmd,
        message="check learning capture entry text changed",
    )

    try:
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"{context}: failed to read check learning capture profile") from error
    profile_entries = profile.get("entries")
    require_package_smoke(
        isinstance(profile_entries, list)
        and len(profile_entries) == 4
        and [entry.get("text") for entry in profile_entries] == [entry.get("text") for entry in entries],
        context=context,
        cmd=cmd,
        message="check learning capture did not persist captured entries",
    )


def assert_check_artifact_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_check_artifact_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_check_stdin_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=passing_check_artifact_content(),
        cwd=cwd,
        env=env,
    )
    assert_check_stdin_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_check_learning_capture_smoke(
    cmd: list[str],
    *,
    profile_path: Path,
    expected_file_suffix: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_check_learning_capture_json(
        result.stdout,
        profile_path=profile_path,
        expected_file_suffix=expected_file_suffix,
        context=context,
        cmd=cmd,
    )


def read_output_file(output_path: Path, *, context: str, label: str) -> str:
    try:
        return output_path.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read {label} output after {context}: {output_path}") from error


def read_json_output_file(output_path: Path, *, context: str) -> str:
    return read_output_file(output_path, context=context, label="JSON")


def read_markdown_output_file(output_path: Path, *, context: str) -> str:
    return read_output_file(output_path, context=context, label="Markdown")


def read_forced_output_file(output_path: Path, *, context: str, cmd: list[str], label: str) -> str:
    content = read_output_file(output_path, context=context, label=label)
    assert_force_overwrite_replaced(content, context=context, cmd=cmd, expected_path=str(output_path))
    return content


def read_forced_json_output_file(output_path: Path, *, context: str, cmd: list[str]) -> str:
    return read_forced_output_file(output_path, context=context, cmd=cmd, label="JSON")


def read_forced_markdown_output_file(output_path: Path, *, context: str, cmd: list[str]) -> str:
    return read_forced_output_file(output_path, context=context, cmd=cmd, label="Markdown")


def assert_output_overwrite_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=lambda raw, *, returncode, context, cmd: assert_output_overwrite_failure(
            raw,
            returncode=returncode,
            context=context,
            cmd=cmd,
            expected_path=str(output_path),
        ),
    )


def assert_prompt_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_prompt_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_prompt_stdout_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_prompt_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_prompt_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_prompt_markdown_component_spec(result.stdout, context=context, cmd=cmd)


def assert_prompt_markdown_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_prompt_markdown_body_component_spec(
        read_forced_markdown_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_prompt_stdin_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_prompt_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_pack_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_pack_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_pack_stdout_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_pack_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_pack_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_pack_markdown_component_spec(result.stdout, context=context, cmd=cmd)


def assert_pack_markdown_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_pack_markdown_body_component_spec(
        read_forced_markdown_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_pack_stdin_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_pack_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_prompt_eval_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse prompt eval JSON") from error

    require_package_smoke(payload.get("evalVersion") == 1, context=context, cmd=cmd, message="prompt eval version changed")
    require_package_smoke(payload.get("status") == "pass", context=context, cmd=cmd, message="prompt eval should pass")
    summary = payload.get("summary")
    require_package_smoke(
        isinstance(summary, dict)
        and summary.get("total", 0) >= 2
        and summary.get("pass") == summary.get("total")
        and summary.get("fail") == 0,
        context=context,
        cmd=cmd,
        message="prompt eval summary changed",
    )
    cases = payload.get("cases")
    require_package_smoke(isinstance(cases, list) and cases, context=context, cmd=cmd, message="prompt eval cases missing")
    ids = {case.get("id") for case in cases if isinstance(case, dict)}
    require_package_smoke(
        {"component-spec-prompt-plan", "website-improvement-prompt-plan"}.issubset(ids),
        context=context,
        cmd=cmd,
        message="prompt eval template case ids changed",
    )
    require_package_smoke(
        all(
            isinstance(case, dict)
            and case.get("status") == "pass"
            and case.get("routeId") == case.get("expectedRouteId")
            and case.get("missingRequiredFiles") == []
            and case.get("missingChecklist") == []
            and case.get("missingPromptFragments") == []
            and case.get("issues") == []
            for case in cases
        ),
        context=context,
        cmd=cmd,
        message="prompt eval case result changed",
    )


def assert_pack_eval_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse pack eval JSON") from error

    require_package_smoke(payload.get("evalVersion") == 1, context=context, cmd=cmd, message="pack eval version changed")
    require_package_smoke(payload.get("status") == "pass", context=context, cmd=cmd, message="pack eval should pass")
    summary = payload.get("summary")
    require_package_smoke(
        isinstance(summary, dict)
        and summary.get("total", 0) >= 2
        and summary.get("pass") == summary.get("total")
        and summary.get("fail") == 0,
        context=context,
        cmd=cmd,
        message="pack eval summary changed",
    )
    cases = payload.get("cases")
    require_package_smoke(isinstance(cases, list) and cases, context=context, cmd=cmd, message="pack eval cases missing")
    ids = {case.get("id") for case in cases if isinstance(case, dict)}
    require_package_smoke(
        {"component-spec-pack", "website-improvement-pack"}.issubset(ids),
        context=context,
        cmd=cmd,
        message="pack eval template case ids changed",
    )
    require_package_smoke(
        all(
            isinstance(case, dict)
            and case.get("status") == "pass"
            and case.get("routeId") == case.get("expectedRouteId")
            and case.get("contextStatus") == "complete"
            and case.get("missingRequiredFiles") == []
            and case.get("missingIncludedFiles") == []
            and case.get("issues") == []
            and isinstance(case.get("pack"), dict)
            and isinstance(case["pack"].get("markdownBytes"), int)
            and case["pack"]["markdownBytes"] > 0
            and all(
                isinstance(file, dict) and "content" not in file
                for file in case["pack"].get("files", [])
            )
            for case in cases
        ),
        context=context,
        cmd=cmd,
        message="pack eval case result changed",
    )


def assert_prompt_eval_smoke(
    command_factory,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    template_cmd = command_factory("prompt", "--eval-template", "--json")
    template_result = run_plain(template_cmd, cwd=cwd, env=env)
    eval_cmd = command_factory("prompt", "--eval", "--stdin", "--strict", "--json")
    eval_result = run_plain_with_input(
        eval_cmd,
        input_text=template_result.stdout,
        cwd=cwd,
        env=env,
    )
    assert_prompt_eval_json(eval_result.stdout, context=context, cmd=eval_cmd)


def assert_pack_eval_smoke(
    command_factory,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    template_cmd = command_factory("pack", "--eval-template", "--json")
    template_result = run_plain(template_cmd, cwd=cwd, env=env)
    eval_cmd = command_factory("pack", "--eval", "--stdin", "--strict", "--json")
    eval_result = run_plain_with_input(
        eval_cmd,
        input_text=template_result.stdout,
        cwd=cwd,
        env=env,
    )
    assert_pack_eval_json(eval_result.stdout, context=context, cmd=eval_cmd)


def write_learning_relevance_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:02.000Z",
                "entries": [
                    {
                        "id": "learn-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise brand language",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "text": "Prioritize keyboard accessibility details for Button component API specs",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "learn-unrelated-newer",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile checkout layout",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def assert_learning_relevance_context(payload: dict[str, object], *, context: str, cmd: list[str]) -> None:
    learning_context = payload.get("learningContext")
    require_package_smoke(
        isinstance(learning_context, dict),
        context=context,
        cmd=cmd,
        message="learningContext should be present when --with-learning is used",
    )

    selection = learning_context.get("selection")
    require_package_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learningContext selection metadata missing",
    )
    require_package_smoke(
        selection.get("mode") == "brief-relevance",
        context=context,
        cmd=cmd,
        message="learningContext should use brief-relevance selection",
    )
    require_package_smoke(
        selection.get("candidateCount") == 3,
        context=context,
        cmd=cmd,
        message="learningContext candidate count changed",
    )
    require_package_smoke(
        selection.get("matchedCount") >= 1,
        context=context,
        cmd=cmd,
        message="learningContext should report at least one relevant match",
    )
    require_package_smoke(
        selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learningContext should report the limited selected entry count",
    )
    require_package_smoke(
        selection.get("fallbackCount") == 0,
        context=context,
        cmd=cmd,
        message="learningContext should not use recency fallback when the relevant entry fits the limit",
    )

    selected = selection.get("selected")
    require_package_smoke(
        isinstance(selected, list) and len(selected) == 1 and isinstance(selected[0], dict),
        context=context,
        cmd=cmd,
        message="learningContext selection should explain the selected entry",
    )
    selected_entry = selected[0]
    require_package_smoke(
        selected_entry.get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learning selection explanation should point at the relevant entry",
    )
    require_package_smoke(
        selected_entry.get("reason") == "brief-match",
        context=context,
        cmd=cmd,
        message="learning selection explanation should mark the relevant entry as a brief match",
    )
    require_package_smoke(
        isinstance(selected_entry.get("score"), int) and selected_entry.get("score") > 0,
        context=context,
        cmd=cmd,
        message="learning selection explanation should include a positive relevance score",
    )
    matched_tokens = selected_entry.get("matchedTokens")
    require_package_smoke(
        (
            isinstance(matched_tokens, list)
            and "button" in matched_tokens
            and "accessibility" in matched_tokens
        ),
        context=context,
        cmd=cmd,
        message="learning selection explanation should include matched brief tokens",
    )

    entries = learning_context.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learningContext should include the single limited entry",
    )
    require_package_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="brief relevance should pick the Button accessibility entry over the newer unrelated entry",
    )

    prompt = payload.get("prompt")
    require_package_smoke(isinstance(prompt, str), context=context, cmd=cmd, message="prompt should be a string")
    require_package_smoke(
        "Learning selection: brief relevance" in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should disclose brief-relevance learning selection",
    )
    require_package_smoke(
        "Prioritize keyboard accessibility details" in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should include the relevant learning entry",
    )
    require_package_smoke(
        "dense Korean mobile checkout" not in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should exclude the newer unrelated learning entry when limit is 1",
    )


def assert_learning_usage_payload(
    payload: dict[str, object],
    *,
    expected_command: str,
    context: str,
    cmd: list[str],
) -> None:
    learning_usage = payload.get("learningUsage")
    require_package_smoke(
        isinstance(learning_usage, dict),
        context=context,
        cmd=cmd,
        message="learningUsage should be present when --with-learning records usage",
    )
    require_package_smoke(
        learning_usage.get("recorded") is True,
        context=context,
        cmd=cmd,
        message="learningUsage should report a recorded local sidecar event",
    )

    event = learning_usage.get("event")
    require_package_smoke(
        isinstance(event, dict),
        context=context,
        cmd=cmd,
        message="learningUsage event metadata missing",
    )
    require_package_smoke(
        event.get("command") == expected_command,
        context=context,
        cmd=cmd,
        message=f"learningUsage event should record command {expected_command}",
    )
    require_package_smoke(
        event.get("selectedEntryIds") == ["learn-relevant"],
        context=context,
        cmd=cmd,
        message="learningUsage event should record the selected learning entry id",
    )
    require_package_smoke(
        isinstance(event.get("briefHash"), str) and len(event.get("briefHash")) == 16,
        context=context,
        cmd=cmd,
        message="learningUsage event should store a short brief hash instead of raw brief text",
    )
    require_package_smoke(
        "query" not in event and "brief" not in event,
        context=context,
        cmd=cmd,
        message="learningUsage event should not persist raw brief/query text",
    )


def assert_learning_usage_sidecar(
    usage_path: Path,
    *,
    expected_commands: list[str],
    context: str,
    cmd: list[str],
) -> None:
    require_package_smoke(
        usage_path.exists(),
        context=context,
        cmd=cmd,
        message="learning usage sidecar file should be written next to the learning profile",
    )
    try:
        payload = json.loads(usage_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learning usage sidecar JSON") from error

    events = payload.get("events")
    require_package_smoke(
        isinstance(events, list) and len(events) >= len(expected_commands),
        context=context,
        cmd=cmd,
        message="learning usage sidecar should contain prompt/pack usage events",
    )
    recent_events = events[-len(expected_commands):]
    require_package_smoke(
        [event.get("command") for event in recent_events if isinstance(event, dict)] == expected_commands,
        context=context,
        cmd=cmd,
        message="learning usage sidecar should preserve prompt/pack command order",
    )
    for event in recent_events:
        require_package_smoke(
            isinstance(event, dict)
            and event.get("selectedEntryIds") == ["learn-relevant"]
            and isinstance(event.get("briefHash"), str)
            and "query" not in event
            and "brief" not in event,
            context=context,
            cmd=cmd,
            message="learning usage sidecar event should be privacy-preserving and reference selected ids",
        )


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
        raise SystemExit(f"{context}: failed to parse learn agent backlog JSON") from error

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
    action_plan_steps = action_plan.get("steps") if isinstance(action_plan, dict) else None
    action_plan_verification = action_plan.get("verification") if isinstance(action_plan, dict) else None
    safety_summary = action_plan.get("safetySummary") if isinstance(action_plan, dict) else None
    execution_queue = action_plan.get("executionQueue") if isinstance(action_plan, dict) else None
    ordered_queue = execution_queue.get("ordered") if isinstance(execution_queue, dict) else None
    command_manifest = execution_queue.get("commandManifest") if isinstance(execution_queue, dict) else None
    operator_runbook = execution_queue.get("operatorRunbook") if isinstance(execution_queue, dict) else None
    next_command_selection = execution_queue.get("nextCommandSelection") if isinstance(execution_queue, dict) else None
    next_command_alignment = execution_queue.get("nextCommandAlignment") if isinstance(execution_queue, dict) else None
    operator_handoff = execution_queue.get("operatorHandoff") if isinstance(execution_queue, dict) else None
    operator_handoff_state = operator_handoff.get("state") if isinstance(operator_handoff, dict) else None
    operator_handoff_source = operator_handoff.get("source") if isinstance(operator_handoff, dict) else ""
    operator_handoff_matches_source = (
        (
            operator_handoff_source == "operator-runbook"
            and operator_handoff.get("phase") == operator_runbook.get("nextStage")
            and operator_handoff.get("command") == operator_runbook.get("nextCommand")
        )
        or (
            operator_handoff_source == "execution-queue"
            and operator_handoff.get("phase") == "execute"
            and operator_handoff.get("command") == execution_queue.get("nextCommand")
        )
    ) if isinstance(operator_handoff, dict) else False
    operator_next_command_selection = operator_runbook.get("nextCommandSelection") if isinstance(operator_runbook, dict) else None
    command_effect_summary = execution_queue.get("commandEffectSummary") if isinstance(execution_queue, dict) else None
    command_effect_review = execution_queue.get("commandEffectReview") if isinstance(execution_queue, dict) else None
    gate_phase_summary = command_effect_review.get("gatePhaseSummary") if isinstance(command_effect_review, dict) else None
    gate_runbook = command_effect_review.get("gateRunbook") if isinstance(command_effect_review, dict) else None
    def valid_optional_apply_command(item: object) -> bool:
        if not isinstance(item, dict):
            return False
        apply_command = item.get("applyCommand", "")
        apply_args = item.get("applyCommandArgs", [])
        apply_safety = item.get("applyCommandSafety")
        if not apply_command:
            return True
        return (
            isinstance(apply_command, str)
            and isinstance(apply_args, list)
            and len(apply_args) >= 2
            and isinstance(apply_safety, dict)
            and apply_safety.get("level") in {"read-only", "writes-local-file", "mutates-local-state"}
            and isinstance(apply_safety.get("writesLocalFiles"), bool)
            and isinstance(apply_safety.get("mutatesLocalState"), bool)
            and isinstance(apply_safety.get("requiresCleanWorkspace"), bool)
            and isinstance(item.get("applyRequiresReviewBeforeMutation"), bool)
        )
    def is_agent_backlog_refresh_command(item: object) -> bool:
        if not isinstance(item, dict):
            return False
        command = str(item.get("command", ""))
        args = item.get("commandArgs", [])
        return (
            "learn --agent-backlog" in command
            and isinstance(args, list)
            and args[:3] == ["design-ai", "learn", "--agent-backlog"]
            and "--from-file" in args
            and "--file" in args
            and "--usage-file" in args
            and "--strict" in args
            and "--json" in args
        )
    require_package_smoke(
        isinstance(action_plan, dict)
        and action_plan.get("version") == 1
        and action_plan.get("stepCount", 0) >= 1
        and isinstance(safety_summary, dict)
        and safety_summary.get("total", 0) >= 1
        and safety_summary.get("readOnly", 0) >= 1
        and safety_summary.get("writesLocalFile", -1) >= 0
        and safety_summary.get("mutatesLocalState", -1) >= 0
        and safety_summary.get("requiresReviewBeforeMutation", -1) >= 0
        and isinstance(execution_queue, dict)
        and execution_queue.get("previewCount", -1) >= 1
        and execution_queue.get("fileWriteReviewCount", -1) >= 0
        and execution_queue.get("mutationReviewCount", -1) >= 0
        and execution_queue.get("orderedCount", 0) >= 1
        and execution_queue.get("commandManifestCount", 0) >= 1
        and isinstance(execution_queue.get("nextCommandArgs"), list)
        and len(execution_queue.get("nextCommandArgs")) >= 2
        and isinstance(next_command_selection, dict)
        and next_command_selection.get("strategy") == "first-command-in-safety-ordered-queue"
        and next_command_selection.get("actionId") == execution_queue.get("nextActionId")
        and isinstance(next_command_selection.get("safetyOrder"), list)
        and next_command_selection.get("safetyOrder") == ["read-only", "writes-local-file", "mutates-local-state"]
        and isinstance(next_command_selection.get("matchesPlanNextAction"), bool)
        and isinstance(next_command_selection.get("reason"), str)
        and bool(next_command_selection.get("reason"))
        and isinstance(next_command_alignment, dict)
        and next_command_alignment.get("strategy") == "compare-operator-runbook-next-command-to-execution-queue-next-command"
        and next_command_alignment.get("operatorStage") == operator_runbook.get("nextStage")
        and next_command_alignment.get("operatorCommand") == operator_runbook.get("nextCommand")
        and next_command_alignment.get("queueActionId") == execution_queue.get("nextActionId")
        and next_command_alignment.get("queueCommand") == execution_queue.get("nextCommand")
        and isinstance(next_command_alignment.get("matchesQueueNextCommand"), bool)
        and isinstance(next_command_alignment.get("matchesQueueNextAction"), bool)
        and isinstance(next_command_alignment.get("operatorRunsBeforeQueueCommand"), bool)
        and isinstance(next_command_alignment.get("queueMatchesRankedNextAction"), bool)
        and isinstance(next_command_alignment.get("reason"), str)
        and bool(next_command_alignment.get("reason"))
        and isinstance(operator_handoff, dict)
        and operator_handoff.get("version") == 1
        and operator_handoff.get("decision") in {"run-operator-gate", "run-shared-command", "run-operator-command", "run-queue-command", "none"}
        and isinstance(operator_handoff_state, dict)
        and operator_handoff_state.get("version") == 1
        and operator_handoff_state.get("status") in {"ready", "gate-required", "review-required", "no-command"}
        and isinstance(operator_handoff_state.get("ready"), bool)
        and isinstance(operator_handoff_state.get("hasCommand"), bool)
        and isinstance(operator_handoff_state.get("complete"), bool)
        and isinstance(operator_handoff_state.get("canRunWithoutReview"), bool)
        and isinstance(operator_handoff_state.get("requiresGate"), bool)
        and isinstance(operator_handoff_state.get("requiresRefresh"), bool)
        and isinstance(operator_handoff_state.get("summary"), str)
        and bool(operator_handoff_state.get("summary"))
        and operator_handoff.get("source") in {"operator-runbook", "execution-queue"}
        and operator_handoff_matches_source
        and isinstance(operator_handoff.get("commandArgs"), list)
        and len(operator_handoff.get("commandArgs")) >= 2
        and isinstance(operator_handoff.get("required"), bool)
        and isinstance(operator_handoff.get("isGate"), bool)
        and operator_handoff.get("nextQueueActionId") == execution_queue.get("nextActionId")
        and isinstance(operator_handoff.get("nextQueueCommandRequiresGate"), bool)
        and isinstance(operator_handoff.get("operatorGateAppliesToNextQueueAction"), bool)
        and operator_handoff.get("nextQueueCommand") == execution_queue.get("nextCommand")
        and isinstance(operator_handoff.get("nextQueueActionBlockedByGate"), bool)
        and isinstance(operator_handoff.get("refreshCommand"), str)
        and bool(operator_handoff.get("refreshCommand"))
        and isinstance(operator_handoff.get("refreshCommandArgs"), list)
        and len(operator_handoff.get("refreshCommandArgs")) >= 2
        and is_agent_backlog_refresh_command({
            "command": operator_handoff.get("refreshCommand"),
            "commandArgs": operator_handoff.get("refreshCommandArgs"),
        })
        and isinstance(operator_handoff.get("refreshCommandRequired"), bool)
        and isinstance(operator_handoff.get("requiresOperatorReview"), bool)
        and isinstance(operator_handoff.get("reason"), str)
        and bool(operator_handoff.get("reason"))
        and isinstance(operator_runbook, dict)
        and operator_runbook.get("version") == 1
        and operator_runbook.get("stageCount") == 4
        and operator_runbook.get("commandCount", 0) >= execution_queue.get("commandManifestCount", 0)
        and operator_runbook.get("requiredCommandCount", 0) >= execution_queue.get("commandManifestCount", 0)
        and isinstance(operator_runbook.get("phases"), list)
        and operator_runbook.get("phases") == ["before", "execute", "after", "refresh"]
        and operator_runbook.get("nextStage") in {"before", "execute"}
        and isinstance(operator_runbook.get("nextCommand"), str)
        and bool(operator_runbook.get("nextCommand"))
        and isinstance(operator_runbook.get("nextCommandArgs"), list)
        and len(operator_runbook.get("nextCommandArgs")) >= 2
        and isinstance(operator_runbook.get("nextCommandRequired"), bool)
        and isinstance(operator_next_command_selection, dict)
        and operator_next_command_selection.get("strategy") == "first-command-in-operator-runbook-stage-order"
        and operator_next_command_selection.get("stage") == operator_runbook.get("nextStage")
        and operator_next_command_selection.get("command") == operator_runbook.get("nextCommand")
        and isinstance(operator_next_command_selection.get("stageOrder"), list)
        and operator_next_command_selection.get("stageOrder") == ["before", "execute", "after", "refresh"]
        and isinstance(operator_next_command_selection.get("required"), bool)
        and isinstance(operator_next_command_selection.get("reason"), str)
        and bool(operator_next_command_selection.get("reason"))
        and isinstance(operator_runbook.get("stages"), list)
        and any(
            isinstance(stage, dict)
            and stage.get("phase") == "execute"
            and stage.get("commandCount", 0) >= 1
            and any(
                isinstance(item, dict)
                and item.get("actionId") == "agent-skill-proposal-preview"
                and item.get("runPolicy") == "preview-only"
                and "learn --propose-skills" in str(item.get("command", ""))
                and item.get("commandArgs", [])[:3] == ["design-ai", "learn", "--propose-skills"]
                for item in stage.get("commands", [])
            )
            for stage in operator_runbook.get("stages", [])
        )
        and any(
            isinstance(stage, dict)
            and stage.get("phase") == "refresh"
            and any(
                isinstance(item, dict)
                and item.get("required") is True
                and is_agent_backlog_refresh_command(item)
                for item in stage.get("commands", [])
            )
            for stage in operator_runbook.get("stages", [])
        )
        and isinstance(command_effect_summary, dict)
        and command_effect_summary.get("totalCommands", 0) >= 1
        and command_effect_summary.get("outputTargetCount", -1) >= 0
        and command_effect_summary.get("profileTargetCount", -1) >= 0
        and command_effect_summary.get("usageTargetCount", -1) >= 0
        and command_effect_summary.get("mutationFlagCount", -1) >= 0
        and isinstance(command_effect_summary.get("outputTargets"), list)
        and isinstance(command_effect_summary.get("profileTargets"), list)
        and isinstance(command_effect_summary.get("usageTargets"), list)
        and isinstance(command_effect_summary.get("mutationFlags"), list)
        and isinstance(command_effect_review, dict)
        and command_effect_review.get("level") in {"clear", "target-review", "mutation-review"}
        and isinstance(command_effect_review.get("requiresOperatorReview"), bool)
        and isinstance(command_effect_review.get("headline"), str)
        and isinstance(command_effect_review.get("checklist"), list)
        and isinstance(gate_phase_summary, dict)
        and gate_phase_summary.get("count", 0) >= 1
        and gate_phase_summary.get("requiredCount", 0) >= 1
        and gate_phase_summary.get("optionalCount", -1) >= 0
        and isinstance(gate_phase_summary.get("phases"), list)
        and gate_phase_summary.get("hasRefresh") is True
        and isinstance(gate_runbook, dict)
        and isinstance(gate_runbook.get("before"), list)
        and isinstance(gate_runbook.get("after"), list)
        and isinstance(gate_runbook.get("refresh"), list)
        and isinstance(gate_runbook.get("other"), list)
        and any(
            isinstance(item, dict)
            and item.get("phase") == "refresh"
            and item.get("required") is True
            and is_agent_backlog_refresh_command(item)
            for item in gate_runbook.get("refresh", [])
        )
        and isinstance(command_effect_review.get("gateCommands"), list)
        and any(
            isinstance(item, dict)
            and item.get("phase") == "refresh"
            and item.get("required") is True
            and is_agent_backlog_refresh_command(item)
            for item in command_effect_review.get("gateCommands", [])
        )
        and execution_queue.get("nextActionId")
        and "learn --propose-skills" in str(execution_queue.get("nextCommand", ""))
        and execution_queue.get("nextCommandRunPolicy") == "preview-only"
        and isinstance(ordered_queue, list)
        and any(
            isinstance(item, dict)
            and item.get("actionId") == "agent-skill-proposal-preview"
            and item.get("safetyLevel") == "read-only"
            and item.get("runPolicy") == "preview-only"
            for item in ordered_queue
        )
        and isinstance(command_manifest, list)
        and any(
            isinstance(item, dict)
            and item.get("actionId") == "agent-skill-proposal-preview"
            and item.get("runPolicy") == "preview-only"
            and isinstance(item.get("commandEffects"), dict)
            and valid_optional_apply_command(item)
            and item["commandEffects"].get("writesLocalFiles") is False
            and item["commandEffects"].get("mutatesLocalState") is False
            and item["commandEffects"].get("outputTargets") == []
            and item["commandEffects"].get("mutationFlags") == []
            for item in command_manifest
        )
        and isinstance(action_plan_steps, list)
        and any(
            isinstance(item, dict)
            and item.get("actionId") == "agent-skill-proposal-preview"
            and "learn --propose-skills" in str(item.get("command", ""))
            and item.get("requiresReviewBeforeMutation") is False
            and isinstance(item.get("commandSafety"), dict)
            and valid_optional_apply_command(item)
            and item["commandSafety"].get("level") == "read-only"
            and item["commandSafety"].get("writesLocalFiles") is False
            and item["commandSafety"].get("mutatesLocalState") is False
            for item in action_plan_steps
        )
        and isinstance(action_plan_verification, list)
        and any(
            isinstance(item, dict)
            and is_agent_backlog_refresh_command(item)
            for item in action_plan_verification
        ),
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
EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_REASON = (
    "No real warn/fail check result has been intentionally captured into the local learning profile yet."
)
EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_NEXT_CONDITION = (
    "Run `design-ai check <artifact.md> --learn --yes` only after reviewing an actual warning or failure "
    "that should improve future outputs."
)
EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_AUTOMATION_POLICY = (
    "Do not emit placeholder mutation commands for this advisory gap; wait for real check evidence."
)


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


def assert_agent_backlog_readiness_json(
    payload: dict,
    *,
    expect_check_capture_gap: bool,
    context: str,
    cmd: list[str],
) -> None:
    readiness = payload.get("readiness")
    checks = readiness.get("checks") if isinstance(readiness, dict) else None
    check_by_id = {
        item.get("id"): item
        for item in checks
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    } if isinstance(checks, list) else {}
    check_capture = check_by_id.get("check-capture")
    agent_development = check_by_id.get("agent-development")
    optional_gaps = readiness.get("optionalGaps") if isinstance(readiness, dict) else None
    optional_gap_details = readiness.get("optionalGapDetails") if isinstance(readiness, dict) else None
    required_check_ids = readiness.get("requiredCheckIds") if isinstance(readiness, dict) else None
    optional_check_ids = readiness.get("optionalCheckIds") if isinstance(readiness, dict) else None
    check_status_by_id = readiness.get("checkStatusById") if isinstance(readiness, dict) else None
    check_required_by_id = readiness.get("checkRequiredById") if isinstance(readiness, dict) else None
    check_count_by_status = readiness.get("checkCountByStatus") if isinstance(readiness, dict) else None
    required_check_count_by_status = readiness.get("requiredCheckCountByStatus") if isinstance(readiness, dict) else None
    optional_check_count_by_status = readiness.get("optionalCheckCountByStatus") if isinstance(readiness, dict) else None
    blocking_checks = readiness.get("blockingChecks") if isinstance(readiness, dict) else None
    count_status_keys = ("pass", "info", "warn", "fail", "missing", "template", "unknown")
    check_count_total = sum(
        check_count_by_status.get(key, 0)
        for key in count_status_keys
    ) if isinstance(check_count_by_status, dict) else -1
    required_check_count_total = sum(
        required_check_count_by_status.get(key, 0)
        for key in count_status_keys
    ) if isinstance(required_check_count_by_status, dict) else -1
    optional_check_count_total = sum(
        optional_check_count_by_status.get(key, 0)
        for key in count_status_keys
    ) if isinstance(optional_check_count_by_status, dict) else -1
    detail_by_id = {
        item.get("id"): item
        for item in optional_gap_details
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    } if isinstance(optional_gap_details, list) else {}
    check_capture_detail = detail_by_id.get("check-capture")
    check_capture_detail_valid = (
        isinstance(check_capture_detail, dict)
        and check_capture_detail.get("label") == "Check learning capture"
        and check_capture_detail.get("status") == "info"
        and check_capture_detail.get("reason") == EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_REASON
        and check_capture_detail.get("nextCondition") == EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_NEXT_CONDITION
        and check_capture_detail.get("automationPolicy") == EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_AUTOMATION_POLICY
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
        and all(isinstance(check_count_by_status.get(key), int) for key in count_status_keys)
        and all(isinstance(required_check_count_by_status.get(key), int) for key in count_status_keys)
        and all(isinstance(optional_check_count_by_status.get(key), int) for key in count_status_keys)
        and check_count_total == len(checks)
        and required_check_count_total == len(required_check_ids)
        and optional_check_count_total == len(optional_check_ids)
        and "agent-development" in required_check_ids
        and "check-capture" in optional_check_ids
        and isinstance(agent_development, dict)
        and agent_development.get("required") is True
        and check_status_by_id.get("agent-development") == agent_development.get("status")
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


def assert_skill_proposal_report_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    returncode: int | None = None,
    expect_status: str | None = "warn",
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode is not None:
        require_package_smoke(
            returncode == 1,
            context=context,
            cmd=cmd,
            message="learn skill proposals strict JSON should exit with code 1 when proposal review is pending",
        )
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal JSON") from error

    require_package_smoke(
        payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path),
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should report the learning profile and usage paths",
    )
    require_package_smoke(
        payload.get("dryRun") is True and payload.get("applied") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals must remain preview-only",
    )
    if expect_status is not None:
        require_package_smoke(
            payload.get("status") == expect_status,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals JSON should report {expect_status!r} status when proposals need review",
        )
    require_package_smoke(
        payload.get("checkCaptureCount") >= 2
        and payload.get("candidateCount") >= 1
        and payload.get("proposalCount") >= 1
        and payload.get("count") == payload.get("proposalCount"),
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should summarize repeated check captures",
    )
    proposals = payload.get("proposals")
    require_package_smoke(
        isinstance(proposals, list)
        and any(
            isinstance(item, dict)
            and item.get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
            and item.get("sourceIssueCount", 0) >= 2
            and item.get("proposedInstructionDelta")
            and item.get("verificationCommand")
            and isinstance(item.get("evidenceSources"), list)
            and len(item.get("evidenceSources")) >= 2
            for item in proposals
        ),
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should include the repeated component-spec skill delta",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should be read-only and local",
    )
    return payload


def assert_skill_proposal_review_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    payload = assert_skill_proposal_report_json(
        raw,
        profile_path=profile_path,
        usage_path=usage_path,
        context=context,
        cmd=cmd,
        expect_status=None,
    )
    review = payload.get("review")
    require_package_smoke(
        payload.get("reviewFile") == str(review_path)
        and payload.get("pendingReviewCount") == 0
        and payload.get("reviewedCount") >= 1
        and isinstance(review, dict)
        and review.get("file") == str(review_path)
        and review.get("exists") is True
        and review.get("matchedCount") >= 1
        and review.get("appliedCount") >= 1,
        context=context,
        cmd=cmd,
        message="learn skill proposals review JSON should join applied review decisions",
    )
    proposals = payload.get("proposals")
    require_package_smoke(
        isinstance(proposals, list)
        and any(
            isinstance(item, dict)
            and item.get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
            and item.get("reviewStatus") == "applied"
            and item.get("reviewClearsStrict") is True
            for item in proposals
        ),
        context=context,
        cmd=cmd,
        message="learn skill proposals review JSON should mark applied proposals as strict-clearing",
    )


def assert_skill_proposal_review_check_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    context: str,
    cmd: list[str],
    expect_status: str = "pass",
    returncode: int | None = None,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal review-check JSON") from error

    if returncode is not None:
        expected_returncode = 0 if expect_status == "pass" else 1
        require_package_smoke(
            returncode == expected_returncode,
            context=context,
            cmd=cmd,
            message=f"learn skill proposal review-check strict JSON should exit with code {expected_returncode} when status is {expect_status}",
        )

    review = payload.get("review")
    summary = payload.get("summary")
    checks = payload.get("checks")
    require_package_smoke(
        payload.get("kind") == "skill-proposal-review-check"
        and payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path)
        and payload.get("reviewFile") == str(review_path)
        and payload.get("status") == expect_status
        and payload.get("pendingReviewCount") == 0
        and payload.get("reviewedCount") >= 1
        and isinstance(review, dict)
        and review.get("file") == str(review_path)
        and review.get("exists") is True
        and review.get("status") == "pass",
        context=context,
        cmd=cmd,
        message=f"learn skill proposal review-check JSON should report {expect_status} review-file readiness",
    )
    require_package_smoke(
        isinstance(summary, dict)
        and summary.get("status") == expect_status
        and summary.get("failures") == 0
        and summary.get("warnings") == 0
        and isinstance(checks, list)
        and len(checks) >= 5
        and all(isinstance(item, dict) and item.get("level") == "pass" and item.get("passed") is True for item in checks),
        context=context,
        cmd=cmd,
        message="learn skill proposal review-check JSON should include passing check summary",
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
        message="learn skill proposal review-check JSON should be read-only and local",
    )


def assert_skill_proposal_review_check_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Skill Proposal Review Check",
        "- Status: pass",
        "- Proposal status:",
        "- Signal status:",
        f"- File: {profile_path}",
        f"- Usage sidecar: {usage_path}",
        f"- Review file: {review_path}",
        "- Pending review: 0",
        "## Checks",
        "pass: review-file-configured - A skill proposal review file is configured.",
        "pass: current-proposals-cleared - All current proposals are applied or rejected.",
        "pass: no-stale-review-decisions - No stale review decisions were found.",
        "## Review Summary",
        "- Status: pass",
        "- Applied: 1",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
        "- Stores raw brief text: no",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposal review-check Markdown report missing {expected!r}",
        )


def assert_skill_proposal_apply_plan_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    signal_source: Path | None = None,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal apply-plan JSON") from error

    review = payload.get("review")
    tasks = payload.get("tasks")
    commands = payload.get("commands")
    command_args = payload.get("commandArgs")
    command_contract = payload.get("commandContract")
    privacy = payload.get("privacy")
    review_check_json_command = str(commands.get("reviewCheckJson", "")) if isinstance(commands, dict) else ""
    command_context_args = [
        "design-ai",
        "learn",
        "--propose-skills",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
    ]
    if signal_source is not None:
        command_context_args.extend(["--from-file", str(signal_source)])
    command_context_args.extend([
        "--review-file",
        str(review_path),
    ])
    expected_command_args = {
        "reviewCheckJson": [*command_context_args, "--review-check", "--json"],
        "reviewCheckReport": [
            *command_context_args,
            "--review-check",
            "--report",
            "--out",
            "skill-proposal-review-check.md",
        ],
        "proposalPatchPreview": [
            *command_context_args,
            "--patch",
            "--out",
            "skill-proposals.patch",
        ],
        "strictGate": [*command_context_args, "--strict", "--json"],
    }
    command_sequence = command_contract.get("commandSequence") if isinstance(command_contract, dict) else None
    command_sequence_summary = command_contract.get("commandSequenceSummary") if isinstance(command_contract, dict) else None
    command_sequence_by_key = command_contract.get("commandSequenceByKey") if isinstance(command_contract, dict) else None
    operator_runbook = command_contract.get("operatorRunbook") if isinstance(command_contract, dict) else None
    operator_stage_selection = operator_runbook.get("stageSelection") if isinstance(operator_runbook, dict) else None
    operator_stage_decision = (
        operator_stage_selection.get("decision") if isinstance(operator_stage_selection, dict) else None
    )
    operator_stage_decision_safety = (
        operator_stage_decision.get("safety") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_commands = (
        operator_stage_decision.get("commands") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_by_key = (
        operator_stage_decision.get("commandByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_step_by_key = (
        operator_stage_decision.get("commandStepByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_run_policy_by_key = (
        operator_stage_decision.get("commandRunPolicyByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_safety_level_by_key = (
        operator_stage_decision.get("commandSafetyLevelByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_args_by_key = (
        operator_stage_decision.get("commandArgsByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_string_by_key = (
        operator_stage_decision.get("commandStringByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_display_label_by_key = (
        operator_stage_decision.get("commandDisplayLabelByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_description_by_key = (
        operator_stage_decision.get("commandDescriptionByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_output_artifact_by_key = (
        operator_stage_decision.get("commandOutputArtifactByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_output_artifact_type_by_key = (
        operator_stage_decision.get("commandOutputArtifactTypeByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_output_artifact_action_by_key = (
        operator_stage_decision.get("commandOutputArtifactActionByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_output_artifact_media_type_by_key = (
        operator_stage_decision.get("commandOutputArtifactMediaTypeByKey") if isinstance(operator_stage_decision, dict) else None
    )
    operator_stage_decision_command_output_artifact_disposition_by_key = (
        operator_stage_decision.get("commandOutputArtifactDispositionByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_manual_apply_candidate_by_key = (
        operator_stage_decision.get("commandOutputArtifactManualApplyCandidateByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_requires_manual_review_by_key = (
        operator_stage_decision.get("commandOutputArtifactRequiresManualReviewByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_review_instruction_by_key = (
        operator_stage_decision.get("commandOutputArtifactReviewInstructionByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_requires_clean_workspace_before_apply_by_key = (
        operator_stage_decision.get("commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_apply_precondition_ids_by_key = (
        operator_stage_decision.get("commandOutputArtifactApplyPreconditionIdsByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_apply_precondition_labels_by_key = (
        operator_stage_decision.get("commandOutputArtifactApplyPreconditionLabelsByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_apply_preconditions_by_key = (
        operator_stage_decision.get("commandOutputArtifactApplyPreconditionsByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_apply_precondition_count_by_key = (
        operator_stage_decision.get("commandOutputArtifactApplyPreconditionCountByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_required_apply_precondition_count_by_key = (
        operator_stage_decision.get("commandOutputArtifactRequiredApplyPreconditionCountByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_satisfied_apply_precondition_count_by_key = (
        operator_stage_decision.get("commandOutputArtifactSatisfiedApplyPreconditionCountByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_pending_apply_precondition_count_by_key = (
        operator_stage_decision.get("commandOutputArtifactPendingApplyPreconditionCountByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_required_pending_apply_precondition_count_by_key = (
        operator_stage_decision.get("commandOutputArtifactRequiredPendingApplyPreconditionCountByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_manual_apply_ready_by_key = (
        operator_stage_decision.get("commandOutputArtifactManualApplyReadyByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_manual_apply_status_by_key = (
        operator_stage_decision.get("commandOutputArtifactManualApplyStatusByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_manual_apply_status_label_by_key = (
        operator_stage_decision.get("commandOutputArtifactManualApplyStatusLabelByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_manual_apply_status_tone_by_key = (
        operator_stage_decision.get("commandOutputArtifactManualApplyStatusToneByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_manual_apply_blocked_reason_by_key = (
        operator_stage_decision.get("commandOutputArtifactManualApplyBlockedReasonByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_command_output_artifact_manual_apply_blocked_reason_code_by_key = (
        operator_stage_decision.get("commandOutputArtifactManualApplyBlockedReasonCodeByKey")
        if isinstance(operator_stage_decision, dict)
        else None
    )
    operator_stage_decision_next_command_entry = (
        operator_stage_decision.get("nextCommandEntry") if isinstance(operator_stage_decision, dict) else None
    )
    operator_selected_stage = (
        operator_stage_selection.get("nextStage") if isinstance(operator_stage_selection, dict) else None
    )
    operator_selected_required_stage = (
        operator_stage_selection.get("nextRequiredStage") if isinstance(operator_stage_selection, dict) else None
    )
    operator_selected_required_command_stage = (
        operator_stage_selection.get("nextRequiredCommandStage")
        if isinstance(operator_stage_selection, dict)
        else None
    )
    expected_command_sequence = [
        (1, "reviewCheckJson", "preview-only", "read-only", False),
        (2, "reviewCheckReport", "output-artifact", "local-output", True),
        (3, "proposalPatchPreview", "output-artifact", "local-output", True),
        (4, "strictGate", "strict-readiness-gate", "read-only", False),
    ]
    expected_local_output_decision_safety = {
        "level": "local-output",
        "writesLocalFiles": True,
        "writesOutputArtifact": True,
        "mutatesLocalState": True,
        "mutatesProfile": False,
        "mutatesReviewFile": False,
        "mutatesSkillFiles": False,
        "callsExternalAiApis": False,
        "requiresCleanWorkspace": False,
        "reason": "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
    }
    expected_operator_runbook_stages = [
        (1, "previewArtifacts", "local-output-preview", False, ["reviewCheckReport", "proposalPatchPreview"]),
        (2, "manualSkillEdit", "manual-review", True, []),
        (3, "reviewReadiness", "read-only-check", True, ["reviewCheckJson"]),
        (4, "strictGate", "read-only-gate", True, ["strictGate"]),
    ]
    require_package_smoke(
        payload.get("kind") == "skill-proposal-apply-plan"
        and payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path)
        and payload.get("reviewFile") == str(review_path)
        and payload.get("status") == "warn"
        and payload.get("acceptedCount") == 1
        and payload.get("count") == 1
        and payload.get("pendingReviewCount") == 1
        and isinstance(review, dict)
        and review.get("file") == str(review_path)
        and review.get("exists") is True
        and review.get("acceptedCount") == 1
        and isinstance(tasks, list)
        and len(tasks) == 1
        and isinstance(tasks[0], dict)
        and tasks[0].get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
        and tasks[0].get("proposalId", "").startswith("skill-proposal-component-spec-writer-")
        and "accepted" in " ".join(tasks[0].get("manualSteps", []))
        and "applied" in " ".join(tasks[0].get("manualSteps", []))
        and isinstance(commands, dict)
        and "learn --propose-skills" in review_check_json_command
        and f"--file {profile_path}" in review_check_json_command
        and f"--usage-file {usage_path}" in review_check_json_command
        and (signal_source is None or f"--from-file {signal_source}" in review_check_json_command)
        and f"--review-file {review_path}" in review_check_json_command
        and "--review-check --json" in review_check_json_command
        and isinstance(command_args, dict)
        and all(command_args.get(key) == expected for key, expected in expected_command_args.items())
        and isinstance(command_contract, dict)
        and command_contract.get("valid") is True
        and command_contract.get("status") == "pass"
        and command_contract.get("commandCount") == 4
        and command_contract.get("checkCount") == 18
        and command_contract.get("passCount") == 18
        and command_contract.get("warningCount") == 0
        and command_contract.get("requiredKeys") == list(expected_command_args.keys())
        and command_contract.get("missingCommandKeys") == []
        and command_contract.get("unexpectedCommandKeys") == []
        and command_contract.get("baseCommand") == ["design-ai", "learn", "--propose-skills"]
        and command_contract.get("reviewFileRequired") is True
        and command_contract.get("reviewFile") == str(review_path)
        and command_contract.get("forbiddenFlags") == ["--yes"]
        and command_contract.get("failureCount") == 0
        and command_contract.get("failedCheckIds") == []
        and command_contract.get("failedChecks") == []
        and command_contract.get("nextCommandKey") == "reviewCheckJson"
        and command_contract.get("nextCommand") == review_check_json_command
        and command_contract.get("nextCommandArgs") == expected_command_args["reviewCheckJson"]
        and command_contract.get("nextCommandRunPolicy") == "preview-only"
        and isinstance(command_contract.get("nextCommandSafety"), dict)
        and command_contract["nextCommandSafety"].get("level") == "read-only"
        and command_contract["nextCommandSafety"].get("writesLocalFiles") is False
        and command_contract["nextCommandSafety"].get("mutatesLocalState") is False
        and command_contract["nextCommandSafety"].get("mutatesProfile") is False
        and command_contract["nextCommandSafety"].get("mutatesReviewFile") is False
        and command_contract["nextCommandSafety"].get("mutatesSkillFiles") is False
        and command_contract["nextCommandSafety"].get("callsExternalAiApis") is False
        and command_contract.get("commandSequenceCount") == 4
        and command_contract.get("commandSequenceKeys") == list(expected_command_args.keys())
        and isinstance(command_sequence_summary, dict)
        and command_sequence_summary.get("executable") is True
        and command_sequence_summary.get("blocked") is False
        and command_sequence_summary.get("stepCount") == 4
        and command_sequence_summary.get("readOnlyStepCount") == 2
        and command_sequence_summary.get("localOutputStepCount") == 2
        and command_sequence_summary.get("writesLocalFiles") is True
        and command_sequence_summary.get("writesOutputArtifacts") is True
        and command_sequence_summary.get("mutatesProfile") is False
        and command_sequence_summary.get("mutatesReviewFile") is False
        and command_sequence_summary.get("mutatesSkillFiles") is False
        and command_sequence_summary.get("callsExternalAiApis") is False
        and command_sequence_summary.get("requiresCleanWorkspace") is False
        and command_sequence_summary.get("runPolicy") == "mixed-preview-local-output"
        and isinstance(command_sequence, list)
        and len(command_sequence) == 4
        and isinstance(command_sequence_by_key, dict)
        and list(command_sequence_by_key.keys()) == list(expected_command_args.keys())
        and isinstance(operator_runbook, dict)
        and operator_runbook.get("version") == 1
        and operator_runbook.get("executable") is True
        and operator_runbook.get("blocked") is False
        and operator_runbook.get("stageCount") == 4
        and operator_runbook.get("requiredStageCount") == 3
        and operator_runbook.get("commandStageCount") == 3
        and operator_runbook.get("nextStageKey") == "previewArtifacts"
        and operator_runbook.get("nextStageCommandKeys") == ["reviewCheckReport", "proposalPatchPreview"]
        and operator_runbook.get("nextRequiredStageKey") == "manualSkillEdit"
        and operator_runbook.get("nextRequiredStageCommandKeys") == []
        and operator_runbook.get("nextRequiredCommandStageKey") == "reviewReadiness"
        and operator_runbook.get("nextRequiredCommandStageCommandKeys") == ["reviewCheckJson"]
        and isinstance(operator_stage_selection, dict)
        and operator_stage_selection.get("strategy") == "optional-preview-before-required-manual-edit"
        and isinstance(operator_stage_decision, dict)
        and operator_stage_decision.get("action") == "offer-optional-preview"
        and operator_stage_decision.get("stageKey") == "previewArtifacts"
        and operator_stage_decision.get("stageKind") == "local-output-preview"
        and operator_stage_decision.get("required") is False
        and operator_stage_decision.get("hasCommands") is True
        and operator_stage_decision.get("commandCount") == 2
        and operator_stage_decision.get("commandKeys") == ["reviewCheckReport", "proposalPatchPreview"]
        and isinstance(operator_stage_decision_commands, list)
        and len(operator_stage_decision_commands) == 2
        and [command.get("key") for command in operator_stage_decision_commands] == [
            "reviewCheckReport",
            "proposalPatchPreview",
        ]
        and [command.get("step") for command in operator_stage_decision_commands] == [2, 3]
        and operator_stage_decision_commands[0].get("command") == commands.get("reviewCheckReport")
        and operator_stage_decision_commands[0].get("commandArgs") == expected_command_args["reviewCheckReport"]
        and operator_stage_decision_commands[0].get("runPolicy") == "output-artifact"
        and operator_stage_decision_commands[0].get("safetyLevel") == "local-output"
        and operator_stage_decision_commands[0].get("safety") == expected_local_output_decision_safety
        and operator_stage_decision_commands[0].get("writesLocalFiles") is True
        and operator_stage_decision_commands[0].get("mutatesSkillFiles") is False
        and operator_stage_decision_commands[1].get("command") == commands.get("proposalPatchPreview")
        and operator_stage_decision_commands[1].get("commandArgs") == expected_command_args["proposalPatchPreview"]
        and operator_stage_decision_commands[1].get("runPolicy") == "output-artifact"
        and operator_stage_decision_commands[1].get("safetyLevel") == "local-output"
        and operator_stage_decision_commands[1].get("safety") == expected_local_output_decision_safety
        and operator_stage_decision_commands[1].get("writesLocalFiles") is True
        and operator_stage_decision_commands[1].get("mutatesSkillFiles") is False
        and isinstance(operator_stage_decision_command_by_key, dict)
        and list(operator_stage_decision_command_by_key.keys()) == [
            "reviewCheckReport",
            "proposalPatchPreview",
        ]
        and operator_stage_decision_command_by_key["reviewCheckReport"] == operator_stage_decision_commands[0]
        and operator_stage_decision_command_by_key["proposalPatchPreview"] == operator_stage_decision_commands[1]
        and operator_stage_decision_command_step_by_key == {
            "reviewCheckReport": 2,
            "proposalPatchPreview": 3,
        }
        and operator_stage_decision_command_run_policy_by_key == {
            "reviewCheckReport": "output-artifact",
            "proposalPatchPreview": "output-artifact",
        }
        and operator_stage_decision_command_safety_level_by_key == {
            "reviewCheckReport": "local-output",
            "proposalPatchPreview": "local-output",
        }
        and operator_stage_decision_command_args_by_key == {
            "reviewCheckReport": expected_command_args["reviewCheckReport"],
            "proposalPatchPreview": expected_command_args["proposalPatchPreview"],
        }
        and operator_stage_decision_command_string_by_key == {
            "reviewCheckReport": commands.get("reviewCheckReport"),
            "proposalPatchPreview": commands.get("proposalPatchPreview"),
        }
        and operator_stage_decision_command_display_label_by_key == {
            "reviewCheckReport": "Review check Markdown report",
            "proposalPatchPreview": "Skill proposal patch preview",
        }
        and operator_stage_decision_command_description_by_key == {
            "reviewCheckReport": "Generate a Markdown review-check artifact for accepted proposal readiness.",
            "proposalPatchPreview": "Generate a unified diff preview for accepted skill proposal edits.",
        }
        and operator_stage_decision_command_output_artifact_by_key == {
            "reviewCheckReport": "skill-proposal-review-check.md",
            "proposalPatchPreview": "skill-proposals.patch",
        }
        and operator_stage_decision_command_output_artifact_type_by_key == {
            "reviewCheckReport": "markdown-report",
            "proposalPatchPreview": "unified-diff",
        }
        and operator_stage_decision_command_output_artifact_action_by_key == {
            "reviewCheckReport": "render-markdown-report",
            "proposalPatchPreview": "render-unified-diff-preview",
        }
        and operator_stage_decision_command_output_artifact_media_type_by_key == {
            "reviewCheckReport": "text/markdown",
            "proposalPatchPreview": "text/x-diff",
        }
        and operator_stage_decision_command_output_artifact_disposition_by_key == {
            "reviewCheckReport": "review-only",
            "proposalPatchPreview": "manual-apply-preview",
        }
        and operator_stage_decision_command_output_artifact_manual_apply_candidate_by_key == {
            "reviewCheckReport": False,
            "proposalPatchPreview": True,
        }
        and operator_stage_decision_command_output_artifact_requires_manual_review_by_key == {
            "reviewCheckReport": False,
            "proposalPatchPreview": True,
        }
        and operator_stage_decision_command_output_artifact_review_instruction_by_key == {
            "reviewCheckReport": "Review the Markdown readiness report before changing proposal review status.",
            "proposalPatchPreview": "Review the unified diff manually before applying any skill-file edits.",
        }
        and operator_stage_decision_command_output_artifact_requires_clean_workspace_before_apply_by_key == {
            "reviewCheckReport": False,
            "proposalPatchPreview": True,
        }
        and operator_stage_decision_command_output_artifact_apply_precondition_ids_by_key == {
            "reviewCheckReport": [],
            "proposalPatchPreview": ["manual-review", "clean-workspace"],
        }
        and operator_stage_decision_command_output_artifact_apply_precondition_labels_by_key == {
            "reviewCheckReport": [],
            "proposalPatchPreview": ["Manual review completed", "Clean workspace confirmed"],
        }
        and operator_stage_decision_command_output_artifact_apply_preconditions_by_key == {
            "reviewCheckReport": [],
            "proposalPatchPreview": [
                {"id": "manual-review", "label": "Manual review completed", "required": True},
                {"id": "clean-workspace", "label": "Clean workspace confirmed", "required": True},
            ],
        }
        and operator_stage_decision_command_output_artifact_apply_precondition_count_by_key == {
            "reviewCheckReport": 0,
            "proposalPatchPreview": 2,
        }
        and operator_stage_decision_command_output_artifact_required_apply_precondition_count_by_key == {
            "reviewCheckReport": 0,
            "proposalPatchPreview": 2,
        }
        and operator_stage_decision_command_output_artifact_satisfied_apply_precondition_count_by_key == {
            "reviewCheckReport": 0,
            "proposalPatchPreview": 0,
        }
        and operator_stage_decision_command_output_artifact_pending_apply_precondition_count_by_key == {
            "reviewCheckReport": 0,
            "proposalPatchPreview": 2,
        }
        and operator_stage_decision_command_output_artifact_required_pending_apply_precondition_count_by_key == {
            "reviewCheckReport": 0,
            "proposalPatchPreview": 2,
        }
        and operator_stage_decision_command_output_artifact_manual_apply_ready_by_key == {
            "reviewCheckReport": False,
            "proposalPatchPreview": False,
        }
        and operator_stage_decision_command_output_artifact_manual_apply_status_by_key == {
            "reviewCheckReport": "not-applicable",
            "proposalPatchPreview": "blocked",
        }
        and operator_stage_decision_command_output_artifact_manual_apply_status_label_by_key == {
            "reviewCheckReport": "Review only",
            "proposalPatchPreview": "Blocked",
        }
        and operator_stage_decision_command_output_artifact_manual_apply_status_tone_by_key == {
            "reviewCheckReport": "neutral",
            "proposalPatchPreview": "warning",
        }
        and operator_stage_decision_command_output_artifact_manual_apply_blocked_reason_by_key == {
            "reviewCheckReport": "This output artifact is review-only and cannot be applied.",
            "proposalPatchPreview": "Complete required apply preconditions before applying this patch preview.",
        }
        and operator_stage_decision_command_output_artifact_manual_apply_blocked_reason_code_by_key == {
            "reviewCheckReport": "not-manual-apply-candidate",
            "proposalPatchPreview": "required-preconditions-pending",
        }
        and operator_stage_decision_next_command_entry == operator_stage_decision_commands[0]
        and operator_stage_decision_next_command_entry.get("safety") == expected_local_output_decision_safety
        and operator_stage_decision.get("nextCommandKey") == "reviewCheckReport"
        and operator_stage_decision.get("nextCommandDisplayLabel") == "Review check Markdown report"
        and operator_stage_decision.get("nextCommandDescription") == "Generate a Markdown review-check artifact for accepted proposal readiness."
        and operator_stage_decision.get("nextCommandOutputArtifact") == "skill-proposal-review-check.md"
        and operator_stage_decision.get("nextCommandOutputArtifactType") == "markdown-report"
        and operator_stage_decision.get("nextCommandOutputArtifactAction") == "render-markdown-report"
        and operator_stage_decision.get("nextCommandOutputArtifactMediaType") == "text/markdown"
        and operator_stage_decision.get("nextCommandOutputArtifactDisposition") == "review-only"
        and operator_stage_decision.get("nextCommandOutputArtifactManualApplyCandidate") is False
        and operator_stage_decision.get("nextCommandOutputArtifactRequiresManualReview") is False
        and operator_stage_decision.get("nextCommandOutputArtifactReviewInstruction") == "Review the Markdown readiness report before changing proposal review status."
        and operator_stage_decision.get("nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply") is False
        and operator_stage_decision.get("nextCommandOutputArtifactApplyPreconditionIds") == []
        and operator_stage_decision.get("nextCommandOutputArtifactApplyPreconditionLabels") == []
        and operator_stage_decision.get("nextCommandOutputArtifactApplyPreconditions") == []
        and operator_stage_decision.get("nextCommandOutputArtifactApplyPreconditionCount") == 0
        and operator_stage_decision.get("nextCommandOutputArtifactRequiredApplyPreconditionCount") == 0
        and operator_stage_decision.get("nextCommandOutputArtifactSatisfiedApplyPreconditionCount") == 0
        and operator_stage_decision.get("nextCommandOutputArtifactPendingApplyPreconditionCount") == 0
        and operator_stage_decision.get("nextCommandOutputArtifactRequiredPendingApplyPreconditionCount") == 0
        and operator_stage_decision.get("nextCommandOutputArtifactManualApplyReady") is False
        and operator_stage_decision.get("nextCommandOutputArtifactManualApplyStatus") == "not-applicable"
        and operator_stage_decision.get("nextCommandOutputArtifactManualApplyStatusLabel") == "Review only"
        and operator_stage_decision.get("nextCommandOutputArtifactManualApplyStatusTone") == "neutral"
        and operator_stage_decision.get("nextCommandOutputArtifactManualApplyBlockedReason") == "This output artifact is review-only and cannot be applied."
        and operator_stage_decision.get("nextCommandOutputArtifactManualApplyBlockedReasonCode") == "not-manual-apply-candidate"
        and operator_stage_decision.get("nextCommandStep") == 2
        and operator_stage_decision.get("nextCommand") == commands.get("reviewCheckReport")
        and operator_stage_decision.get("nextCommandArgs") == expected_command_args["reviewCheckReport"]
        and operator_stage_decision.get("nextCommandRunPolicy") == "output-artifact"
        and operator_stage_decision.get("nextCommandSafetyLevel") == "local-output"
        and operator_stage_decision.get("nextCommandSafety") == expected_local_output_decision_safety
        and operator_stage_decision.get("runPolicy") == "optional-local-output-preview"
        and isinstance(operator_stage_decision_safety, dict)
        and operator_stage_decision_safety.get("level") == "local-output"
        and operator_stage_decision_safety.get("writesLocalFiles") is True
        and operator_stage_decision_safety.get("writesOutputArtifacts") is True
        and operator_stage_decision_safety.get("mutatesLocalState") is True
        and operator_stage_decision_safety.get("mutatesProfile") is False
        and operator_stage_decision_safety.get("mutatesReviewFile") is False
        and operator_stage_decision_safety.get("mutatesSkillFiles") is False
        and operator_stage_decision_safety.get("callsExternalAiApis") is False
        and operator_stage_decision_safety.get("requiresCleanWorkspace") is False
        and operator_stage_decision.get("nextRequiredStageKey") == "manualSkillEdit"
        and operator_stage_decision.get("nextRequiredCommandStageKey") == "reviewReadiness"
        and operator_stage_decision.get("requiresOperatorActionBeforeRequiredCommands") is True
        and operator_stage_selection.get("stageOrder") == [stage[1] for stage in expected_operator_runbook_stages]
        and operator_stage_selection.get("nextStageKey") == "previewArtifacts"
        and operator_stage_selection.get("nextStageCommandKeys") == ["reviewCheckReport", "proposalPatchPreview"]
        and isinstance(operator_selected_stage, dict)
        and operator_selected_stage.get("key") == "previewArtifacts"
        and operator_selected_stage.get("kind") == "local-output-preview"
        and operator_selected_stage.get("required") is False
        and operator_selected_stage.get("hasCommands") is True
        and operator_selected_stage.get("commandCount") == 2
        and operator_selected_stage.get("writesOutputArtifacts") is True
        and operator_selected_stage.get("mutatesSkillFiles") is False
        and operator_stage_selection.get("nextRequiredStageKey") == "manualSkillEdit"
        and operator_stage_selection.get("nextRequiredStageCommandKeys") == []
        and isinstance(operator_selected_required_stage, dict)
        and operator_selected_required_stage.get("key") == "manualSkillEdit"
        and operator_selected_required_stage.get("kind") == "manual-review"
        and operator_selected_required_stage.get("required") is True
        and operator_selected_required_stage.get("hasCommands") is False
        and operator_selected_required_stage.get("commandCount") == 0
        and operator_stage_selection.get("nextRequiredCommandStageKey") == "reviewReadiness"
        and operator_stage_selection.get("nextRequiredCommandStageCommandKeys") == ["reviewCheckJson"]
        and isinstance(operator_selected_required_command_stage, dict)
        and operator_selected_required_command_stage.get("key") == "reviewReadiness"
        and operator_selected_required_command_stage.get("kind") == "read-only-check"
        and operator_selected_required_command_stage.get("required") is True
        and operator_selected_required_command_stage.get("hasCommands") is True
        and operator_selected_required_command_stage.get("commandCount") == 1
        and operator_selected_required_command_stage.get("writesLocalFiles") is False
        and operator_selected_required_command_stage.get("callsExternalAiApis") is False
        and operator_runbook.get("stageKeys") == [stage[1] for stage in expected_operator_runbook_stages]
        and isinstance(operator_runbook.get("stageByKey"), dict)
        and list(operator_runbook["stageByKey"].keys()) == [stage[1] for stage in expected_operator_runbook_stages]
        and isinstance(operator_runbook.get("stages"), list)
        and len(operator_runbook["stages"]) == 4
        and all(
            isinstance(operator_runbook["stageByKey"].get(key), dict)
            and operator_runbook["stageByKey"][key].get("step") == step
            and operator_runbook["stageByKey"][key].get("kind") == kind
            and operator_runbook["stageByKey"][key].get("required") is required
            and operator_runbook["stageByKey"][key].get("commandKeys") == command_keys
            for step, key, kind, required, command_keys
            in expected_operator_runbook_stages
        )
        and all(
            isinstance(stage, dict)
            and stage.get("step") == step
            and stage.get("key") == key
            and stage.get("kind") == kind
            and stage.get("required") is required
            and stage.get("commandKeys") == command_keys
            and [
                command.get("key")
                for command in stage.get("commands", [])
                if isinstance(command, dict)
            ] == command_keys
            for stage, (step, key, kind, required, command_keys)
            in zip(operator_runbook["stages"], expected_operator_runbook_stages, strict=True)
        )
        and "Generate optional local review artifacts" in str(operator_runbook.get("reason", ""))
        and all(
            isinstance(command_sequence_by_key.get(key), dict)
            and command_sequence_by_key[key].get("key") == key
            and command_sequence_by_key[key].get("command") == str(commands.get(key, ""))
            and command_sequence_by_key[key].get("runPolicy") == run_policy
            and isinstance(command_sequence_by_key[key].get("safety"), dict)
            and command_sequence_by_key[key]["safety"].get("level") == safety_level
            for _, key, run_policy, safety_level, _
            in expected_command_sequence
        )
        and all(
            isinstance(item, dict)
            and item.get("step") == step
            and item.get("key") == key
            and item.get("command") == str(commands.get(key, ""))
            and item.get("commandArgs") == expected_command_args[key]
            and item.get("runPolicy") == run_policy
            and isinstance(item.get("safety"), dict)
            and item["safety"].get("level") == safety_level
            and item["safety"].get("writesLocalFiles") is writes_local_files
            and item["safety"].get("writesOutputArtifact") is writes_local_files
            and item["safety"].get("mutatesProfile") is False
            and item["safety"].get("mutatesReviewFile") is False
            and item["safety"].get("mutatesSkillFiles") is False
            and item["safety"].get("callsExternalAiApis") is False
            for item, (step, key, run_policy, safety_level, writes_local_files)
            in zip(command_sequence, expected_command_sequence, strict=True)
        )
        and "Run reviewCheckJson after manual skill edits" in str(command_contract.get("nextAction", ""))
        and isinstance(command_contract.get("summary"), dict)
        and command_contract["summary"].get("failures") == 0
        and command_contract["summary"].get("warnings") == 0
        and command_contract["summary"].get("passes") == 18
        and command_contract["summary"].get("total") == 18
        and isinstance(command_contract.get("checks"), list)
        and all(check.get("passed") is True for check in command_contract.get("checks", []))
        and isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesReviewFile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposal apply-plan JSON should include accepted manual apply tasks and read-only privacy boundaries",
    )


def assert_skill_proposal_apply_plan_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Skill Proposal Apply Plan",
        "- Status: warn",
        "- Proposal status:",
        "- Signal status:",
        f"- File: {profile_path}",
        f"- Usage sidecar: {usage_path}",
        f"- Review file: {review_path}",
        "- Accepted proposals: 1",
        "## Manual Apply Tasks",
        "skills/component-spec-writer/SKILL.md",
        "After the skill edit and verification pass, update the review decision from `accepted` to `applied`.",
        "## Follow-up Commands",
        "--review-check --json",
        "## Command Contract",
        "- Valid: yes",
        "- Required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
        "- Check count: 18",
        "- Pass count: 18",
        "- Warning count: 0",
        "- Failure count: 0",
        "- Failed checks: none",
        "- Next command key: reviewCheckJson",
        "- Next command policy: preview-only",
        "- Next command safety: read-only",
        "- Next command: `design-ai learn --propose-skills",
        "- Command sequence count: 4",
        "- Command sequence policy: mixed-preview-local-output",
        "- Command sequence executable: yes",
        "- Command sequence local outputs: 2",
        "- Command sequence mutates profile: no",
        "- Command sequence mutates review file: no",
        "- Command sequence mutates skill files: no",
        "- Command sequence calls external AI APIs: no",
        "- Operator runbook stages: 4",
        "- Operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate",
        "- Operator runbook required stages: 3",
        "- Operator runbook next stage: previewArtifacts",
        "- Operator runbook next required stage: manualSkillEdit",
        "- Operator runbook next required command stage: reviewReadiness",
        "- Operator runbook stage selection: optional-preview-before-required-manual-edit",
        "- Operator runbook decision: offer-optional-preview",
        "- Operator runbook decision safety: local-output",
        "- Operator runbook decision commands: reviewCheckReport, proposalPatchPreview",
        "- Operator runbook decision next command: reviewCheckReport",
        "- Operator runbook selected stage: previewArtifacts (optional, local-output-preview)",
        "Command sequence:",
        "- 1. reviewCheckJson (preview-only / read-only): `design-ai learn --propose-skills",
        "- 2. reviewCheckReport (output-artifact / local-output): `design-ai learn --propose-skills",
        "- 3. proposalPatchPreview (output-artifact / local-output): `design-ai learn --propose-skills",
        "- 4. strictGate (strict-readiness-gate / read-only): `design-ai learn --propose-skills",
        "Operator runbook:",
        "- 1. previewArtifacts (optional / local-output-preview): reviewCheckReport, proposalPatchPreview",
        "- 2. manualSkillEdit (required / manual-review): manual",
        "- 3. reviewReadiness (required / read-only-check): reviewCheckJson",
        "- 4. strictGate (required / read-only-gate): strictGate",
        "- Next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Mutates review file: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposal apply-plan Markdown report missing {expected!r}",
        )


def assert_skill_proposal_apply_plan_human(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Skill proposal apply plan",
        "Manual apply tasks:",
        "Follow-up commands:",
        "Command contract:",
        "- valid: yes",
        "- status: pass",
        "- required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
        "- forbidden flags: --yes",
        "- check count: 18",
        "- pass count: 18",
        "- warning count: 0",
        "- failure count: 0",
        "- failed checks: none",
        "- next command key: reviewCheckJson",
        "- next command policy: preview-only",
        "- next command safety: read-only",
        "- next command: design-ai learn --propose-skills",
        "- command sequence count: 4",
        "- command sequence policy: mixed-preview-local-output",
        "- command sequence executable: yes",
        "- command sequence local outputs: 2",
        "- command sequence mutates profile: no",
        "- command sequence mutates review file: no",
        "- command sequence mutates skill files: no",
        "- command sequence calls external AI APIs: no",
        "- operator runbook stages: 4",
        "- operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate",
        "- operator runbook required stages: 3",
        "- operator runbook next stage: previewArtifacts",
        "- operator runbook next required stage: manualSkillEdit",
        "- operator runbook next required command stage: reviewReadiness",
        "- operator runbook stage selection: optional-preview-before-required-manual-edit",
        "- operator runbook decision: offer-optional-preview",
        "- operator runbook decision safety: local-output",
        "- operator runbook decision commands: reviewCheckReport, proposalPatchPreview",
        "- operator runbook decision next command: reviewCheckReport",
        "- operator runbook selected stage: previewArtifacts (optional, local-output-preview)",
        "Command sequence:",
        "- 1. reviewCheckJson: preview-only / read-only",
        "- 2. reviewCheckReport: output-artifact / local-output",
        "- 3. proposalPatchPreview: output-artifact / local-output",
        "- 4. strictGate: strict-readiness-gate / read-only",
        "Operator runbook:",
        "- 1. previewArtifacts: optional / local-output-preview / reviewCheckReport, proposalPatchPreview",
        "- 2. manualSkillEdit: required / manual-review / manual",
        "- 3. reviewReadiness: required / read-only-check / reviewCheckJson",
        "- 4. strictGate: required / read-only-gate / strictGate",
        "- next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
        "Privacy: apply plan is read-only",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposal apply-plan human output missing {expected!r}",
        )


def assert_skill_proposal_review_template_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    expected_decision_count: int = 1,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal review-template JSON") from error

    decisions = payload.get("decisions")
    require_package_smoke(
        payload.get("version") == 1
        and payload.get("source") == "design-ai learn --propose-skills --review-template"
        and payload.get("proposalFile") == str(profile_path)
        and payload.get("usageFile") == str(usage_path)
        and isinstance(payload.get("reviewPolicy"), dict)
        and payload["reviewPolicy"].get("clearsStrict") == ["applied", "rejected"]
        and payload["reviewPolicy"].get("remainsPending") == ["accepted", "deferred"],
        context=context,
        cmd=cmd,
        message="learn skill proposal review template JSON should describe review policy and source files",
    )
    require_package_smoke(
        isinstance(decisions, list)
        and len(decisions) == expected_decision_count,
        context=context,
        cmd=cmd,
        message=f"learn skill proposal review template JSON should contain {expected_decision_count} pending decision scaffold(s)",
    )
    if expected_decision_count > 0:
        require_package_smoke(
            any(
                isinstance(item, dict)
                and str(item.get("proposalId", "")).startswith("skill-proposal-component-spec-writer-")
                and item.get("status") == "deferred"
                and item.get("reviewedAt") == ""
                and item.get("reviewer") == ""
                and "skills/component-spec-writer/SKILL.md" in str(item.get("note", ""))
                for item in decisions
            ),
            context=context,
            cmd=cmd,
            message="learn skill proposal review template JSON should scaffold a deferred component-spec proposal decision",
        )


def assert_skill_proposal_min_evidence_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    expected_min_evidence: int = 3,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal min-evidence JSON") from error

    require_package_smoke(
        payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path),
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should report the learning profile and usage paths",
    )
    require_package_smoke(
        payload.get("dryRun") is True and payload.get("applied") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON must remain preview-only",
    )
    require_package_smoke(
        payload.get("minEvidenceCount") == expected_min_evidence,
        context=context,
        cmd=cmd,
        message=f"learn skill proposals min-evidence JSON should report minEvidenceCount {expected_min_evidence}",
    )
    require_package_smoke(
        payload.get("checkCaptureCount") >= 2
        and payload.get("candidateCount") >= 1
        and payload.get("proposalCount") == 0
        and payload.get("count") == 0
        and payload.get("skippedCount") >= 1,
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should skip two-entry groups when threshold is higher",
    )
    skipped = payload.get("skipped")
    require_package_smoke(
        isinstance(skipped, list)
        and any(
            isinstance(item, dict)
            and item.get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
            and item.get("sourceIssueCount") == 2
            and f"Needs at least {expected_min_evidence}" in str(item.get("reason", ""))
            for item in skipped
        ),
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should explain skipped component-spec evidence",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should keep read-only privacy boundaries",
    )


def assert_skill_proposal_report_human(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    for expected in (
        "Skill evolution proposals",
        "Signal source:",
        "Status: warn",
        "Proposed skill deltas:",
        "skills/component-spec-writer/SKILL.md",
        "No changes made. This command is preview-only",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals human output missing {expected!r}",
        )


def assert_skill_proposal_report_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Skill Evolution Proposal Report",
        f"- File: {profile_path}",
        f"- Usage sidecar: {usage_path}",
        "- Status: warn",
        "## Proposed Skill Deltas",
        "skills/component-spec-writer/SKILL.md",
        "Proposed instruction delta:",
        "```bash",
        "node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
        "This report is preview-only evidence; it does not apply changes.",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals Markdown report missing {expected!r}",
        )


def assert_skill_proposal_patch(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# design-ai skill proposal patch preview",
        "# Preview-only output from `design-ai learn --propose-skills --patch`.",
        "# Review manually before applying. This command does not edit skill files.",
        "diff --git a/skills/component-spec-writer/SKILL.md b/skills/component-spec-writer/SKILL.md",
        "--- a/skills/component-spec-writer/SKILL.md",
        "+++ b/skills/component-spec-writer/SKILL.md",
        "+## Local Learning Proposal: skill-proposal-component-spec-writer-",
        "+- Category: accessibility",
        "+- Routes: component-spec",
        "+- Risk: low",
        "+- Evidence count: 2",
        "+- Proposed instruction: Add a pre-handoff accessibility checkpoint",
        "+- Verification: `node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json`",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals patch output missing {expected!r}",
        )


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


def assert_learning_query_json(
    raw: str,
    *,
    profile_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn query JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn query JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn query file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("query") == "keyboard accessibility",
        context=context,
        cmd=cmd,
        message="learn query text changed",
    )
    require_package_smoke(
        payload.get("count") == 1 and payload.get("totalCount") == 3,
        context=context,
        cmd=cmd,
        message="learn query should return only the matching entry while reporting total profile size",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learn query entries list should contain exactly one matching entry",
    )
    require_package_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learn query should return the Button accessibility entry",
    )
    selection = payload.get("selection")
    require_package_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learn query explain selection metadata missing",
    )
    require_package_smoke(
        selection.get("fallbackEnabled") is False and selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn query explain should select exactly one entry without fallback",
    )
    selected = selection.get("selected")
    require_package_smoke(
        isinstance(selected, list) and len(selected) == 1 and isinstance(selected[0], dict),
        context=context,
        cmd=cmd,
        message="learn query explain selected list should contain one entry",
    )
    require_package_smoke(
        selected[0].get("id") == "learn-relevant"
        and selected[0].get("reason") == "brief-match"
        and isinstance(selected[0].get("score"), int)
        and selected[0].get("score") > 0,
        context=context,
        cmd=cmd,
        message="learn query explain should include score and match reason",
    )
    matched_tokens = selected[0].get("matchedTokens")
    require_package_smoke(
        isinstance(matched_tokens, list)
        and "keyboard" in matched_tokens
        and "accessibility" in matched_tokens,
        context=context,
        cmd=cmd,
        message="learn query explain should include matched query tokens",
    )


def assert_learning_query_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Local learning profile",
        "Entries: 1/3",
        "Query: keyboard accessibility",
        "Limit: 2",
        "Explain: selection score, matched tokens, and reason",
        "[accessibility] Prioritize keyboard accessibility details for Button component API specs",
        "matched keyboard, accessibility",
        "reason brief-match",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn query human output missing {expected!r}",
        )
    require_package_smoke(
        "dense Korean mobile checkout" not in raw and "quiet enterprise brand voice" not in raw,
        context=context,
        cmd=cmd,
        message="learn query human output should exclude unrelated profile entries",
    )


def assert_learning_query_export_json(
    raw: str,
    *,
    profile_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn query export JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn query export JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn query export file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("query") == "keyboard accessibility",
        context=context,
        cmd=cmd,
        message="learn query export text changed",
    )
    selection = payload.get("selection")
    require_package_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learn query export selection metadata missing",
    )
    require_package_smoke(
        selection.get("fallbackEnabled") is False and selection.get("fallbackCount") == 0,
        context=context,
        cmd=cmd,
        message="learn query export should not use recency fallback",
    )
    require_package_smoke(
        selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn query export should select one matching entry",
    )
    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learn query export entries list should contain exactly one matching entry",
    )
    require_package_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learn query export should return the Button accessibility entry",
    )
    markdown = payload.get("markdown")
    require_package_smoke(
        isinstance(markdown, str) and "no recency fallback" in markdown,
        context=context,
        cmd=cmd,
        message="learn query export markdown should disclose that fallback is disabled",
    )


def assert_learning_relevance_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_relevance_fixture(profile_path)
    relevance_env = env.copy()
    relevance_env["DESIGN_AI_LEARNING_FILE"] = str(profile_path)

    list_human_cmd = command_factory(
        "learn",
        "--list",
        "--query",
        "keyboard accessibility",
        "--explain",
        "--limit",
        "2",
    )
    list_human_result = run_plain(list_human_cmd, cwd=cwd, env=relevance_env)
    assert_learning_query_human(
        list_human_result.stdout,
        context=f"{context} learn query human list",
        cmd=list_human_cmd,
    )

    list_cmd = command_factory(
        "learn",
        "--list",
        "--query",
        "keyboard accessibility",
        "--explain",
        "--limit",
        "2",
        "--json",
    )
    list_result = run_plain(list_cmd, cwd=cwd, env=relevance_env)
    assert_learning_query_json(
        list_result.stdout,
        profile_path=profile_path,
        context=f"{context} learn query list",
        cmd=list_cmd,
    )

    export_cmd = command_factory(
        "learn",
        "--export",
        "--query",
        "keyboard accessibility",
        "--limit",
        "2",
        "--json",
    )
    export_result = run_plain(export_cmd, cwd=cwd, env=relevance_env)
    assert_learning_query_export_json(
        export_result.stdout,
        profile_path=profile_path,
        context=f"{context} learn query export",
        cmd=export_cmd,
    )

    prompt_cmd = command_factory(
        "prompt",
        EXPECTED_ROUTE_BRIEF,
        "--route",
        EXPECTED_ROUTE_ID,
        "--with-learning",
        "--learning-limit",
        "1",
        "--json",
    )
    prompt_result = run_plain(prompt_cmd, cwd=cwd, env=relevance_env)
    try:
        prompt_payload = json.loads(prompt_result.stdout)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse prompt learning relevance JSON") from error
    assert_learning_relevance_context(prompt_payload, context=f"{context} prompt", cmd=prompt_cmd)
    assert_learning_usage_payload(
        prompt_payload,
        expected_command="prompt",
        context=f"{context} prompt usage",
        cmd=prompt_cmd,
    )

    pack_cmd = command_factory(
        "pack",
        EXPECTED_ROUTE_BRIEF,
        "--route",
        EXPECTED_ROUTE_ID,
        "--with-learning",
        "--learning-limit",
        "1",
        "--max-bytes",
        str(EXPECTED_PACK_MAX_BYTES),
        "--json",
    )
    pack_result = run_plain(pack_cmd, cwd=cwd, env=relevance_env)
    try:
        pack_payload = json.loads(pack_result.stdout)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse pack learning relevance JSON") from error
    plan = pack_payload.get("plan")
    require_package_smoke(isinstance(plan, dict), context=f"{context} pack", cmd=pack_cmd, message="pack plan missing")
    assert_learning_relevance_context(plan, context=f"{context} pack plan", cmd=pack_cmd)
    assert_learning_usage_payload(
        pack_payload,
        expected_command="pack",
        context=f"{context} pack usage",
        cmd=pack_cmd,
    )
    assert_learning_usage_payload(
        plan,
        expected_command="pack",
        context=f"{context} pack plan usage",
        cmd=pack_cmd,
    )
    usage_path = profile_path.with_name(f"{profile_path.stem}.usage{profile_path.suffix}")
    assert_learning_usage_sidecar(
        usage_path,
        expected_commands=["prompt", "pack"],
        context=f"{context} learning usage sidecar",
        cmd=pack_cmd,
    )

    usage_human_cmd = command_factory(
        "learn",
        "--usage",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
    )
    usage_human_result = run_plain(usage_human_cmd, cwd=cwd, env=relevance_env)
    assert_learning_usage_report_human(
        usage_human_result.stdout,
        context=f"{context} learn usage human",
        cmd=usage_human_cmd,
    )

    usage_json_cmd = command_factory(
        "learn",
        "--usage",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--json",
    )
    usage_json_result = run_plain(usage_json_cmd, cwd=cwd, env=relevance_env)
    assert_learning_usage_report_json(
        usage_json_result.stdout,
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn usage JSON",
        cmd=usage_json_cmd,
    )

    usage_out_path = profile_path.with_name(f"{profile_path.stem}-usage-out.json")
    usage_out_path.write_text("stale usage output\n", encoding="utf-8")
    usage_out_cmd = command_factory(
        "learn",
        "--usage",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--json",
        "--out",
        str(usage_out_path),
        "--force",
    )
    usage_out_result = run_plain(usage_out_cmd, cwd=cwd, env=relevance_env)
    assert_output_write_success(
        usage_out_result.stdout,
        context=f"{context} learn usage out",
        cmd=usage_out_cmd,
        expected_path=str(usage_out_path),
    )
    assert_learning_usage_report_json(
        usage_out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn usage out file",
        cmd=usage_out_cmd,
    )

    profile_payload = json.loads(profile_path.read_text(encoding="utf-8"))
    signal_dir = profile_path.parent
    signal_workspace_root = profile_path.with_name(f"{profile_path.stem}-signals-workspace")
    prepare_workspace_strict_repo(signal_workspace_root)
    route_signal_path = signal_dir / "route-eval-report.json"
    route_signal_path.write_text(
        json.dumps({
            "evalVersion": 1,
            "generatedAt": "2026-06-02T00:00:00.000Z",
            "status": "pass",
            "summary": {
                "total": 1,
                "pass": 1,
                "warn": 0,
                "fail": 0,
            },
            "cases": [
                {
                    "id": "component-spec-contract",
                    "status": "pass",
                    "expectedRouteId": EXPECTED_ROUTE_ID,
                    "topRouteId": EXPECTED_ROUTE_ID,
                    "issues": [],
                },
            ],
        }),
        encoding="utf-8",
    )

    no_command_profile_path = profile_path.with_name(f"{profile_path.stem}-no-command.json")
    no_command_usage_path = profile_path.with_name(f"{profile_path.stem}-no-command.usage.json")
    no_command_profile_path.write_text(json.dumps(profile_payload, indent=2) + "\n", encoding="utf-8")
    no_command_usage_payload = json.loads(usage_path.read_text(encoding="utf-8"))
    no_command_usage_payload["profileFile"] = str(no_command_profile_path)
    for event in no_command_usage_payload.get("events", []):
        if isinstance(event, dict):
            event["profileFile"] = str(no_command_profile_path)
    no_command_usage_path.write_text(json.dumps(no_command_usage_payload, indent=2) + "\n", encoding="utf-8")
    no_command_cmd = command_factory(
        "learn",
        "--agent-backlog",
        "--file",
        str(no_command_profile_path),
        "--usage-file",
        str(no_command_usage_path),
        "--from-file",
        str(signal_dir),
        "--strict",
        "--json",
    )
    no_command_result = run_plain(no_command_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_agent_backlog_no_command_json(
        no_command_result.stdout,
        profile_path=no_command_profile_path,
        usage_path=no_command_usage_path,
        context=f"{context} learn agent backlog no-command strict JSON",
        cmd=no_command_cmd,
    )
    no_command_report_path = no_command_profile_path.with_name(
        f"{no_command_profile_path.stem}-agent-backlog-report.md"
    )
    no_command_report_path.write_text("stale no-command agent backlog Markdown report\n", encoding="utf-8")
    no_command_report_cmd = command_factory(
        "learn",
        "--agent-backlog",
        "--file",
        str(no_command_profile_path),
        "--usage-file",
        str(no_command_usage_path),
        "--from-file",
        str(signal_dir),
        "--report",
        "--out",
        str(no_command_report_path),
        "--force",
    )
    no_command_report_result = run_plain(no_command_report_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_output_write_success(
        no_command_report_result.stdout,
        context=f"{context} learn agent backlog no-command Markdown report",
        cmd=no_command_report_cmd,
        expected_path=str(no_command_report_path),
    )
    assert_agent_backlog_no_command_report_markdown(
        no_command_report_path.read_text(encoding="utf-8"),
        profile_path=no_command_profile_path,
        usage_path=no_command_usage_path,
        context=f"{context} learn agent backlog no-command Markdown report",
        cmd=no_command_report_cmd,
    )
    require_package_smoke(
        no_command_profile_path.read_text(encoding="utf-8") == json.dumps(profile_payload, indent=2) + "\n",
        context=f"{context} learn agent backlog no-command Markdown report",
        cmd=no_command_report_cmd,
        message="learn agent backlog no-command Markdown report output must not mutate the profile",
    )

    profile_payload["entries"].append({
        "id": "learn-check-capture",
        "category": "workflow",
        "text": "Improve future outputs by addressing Responsive QA coverage: Add desktop and mobile verification notes.",
        "source": "check:artifact",
        "createdAt": "2026-05-22T00:00:03.000Z",
    })
    profile_path.write_text(json.dumps(profile_payload, indent=2) + "\n", encoding="utf-8")

    signals_human_cmd = command_factory(
        "learn",
        "--signals",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
    )
    signals_human_result = run_plain(signals_human_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_learning_signal_report_human(
        signals_human_result.stdout,
        context=f"{context} learn signals human",
        cmd=signals_human_cmd,
    )

    signals_json_cmd = command_factory(
        "learn",
        "--signals",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--json",
    )
    signals_json_result = run_plain(signals_json_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_learning_signal_report_json(
        signals_json_result.stdout,
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn signals JSON",
        cmd=signals_json_cmd,
    )

    signals_report_path = profile_path.with_name(f"{profile_path.stem}-signals-report.md")
    signals_report_cmd = command_factory(
        "learn",
        "--signals",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--report",
        "--out",
        str(signals_report_path),
    )
    signals_report_result = run_plain(signals_report_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_output_write_success(
        signals_report_result.stdout,
        context=f"{context} learn signals Markdown report",
        cmd=signals_report_cmd,
        expected_path=str(signals_report_path),
    )
    assert_learning_signal_report_markdown(
        signals_report_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn signals Markdown report",
        cmd=signals_report_cmd,
    )

    signals_strict_json_cmd = command_factory(
        "learn",
        "--signals",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--strict",
        "--json",
    )
    signals_strict_json_result = run_plain(signals_strict_json_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_learning_signal_report_json(
        signals_strict_json_result.stdout,
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn signals strict JSON",
        cmd=signals_strict_json_cmd,
        require_agent_status_pass=True,
    )

    signals_out_path = profile_path.with_name(f"{profile_path.stem}-signals-out.json")
    signals_out_path.write_text("stale signals output\n", encoding="utf-8")
    signals_out_cmd = command_factory(
        "learn",
        "--signals",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--json",
        "--out",
        str(signals_out_path),
        "--force",
    )
    signals_out_result = run_plain(signals_out_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_output_write_success(
        signals_out_result.stdout,
        context=f"{context} learn signals out",
        cmd=signals_out_cmd,
        expected_path=str(signals_out_path),
    )
    assert_learning_signal_report_json(
        signals_out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn signals out file",
        cmd=signals_out_cmd,
    )

    agent_backlog_human_cmd = command_factory(
        "learn",
        "--agent-backlog",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
    )
    agent_backlog_human_result = run_plain(agent_backlog_human_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_agent_backlog_report_human(
        agent_backlog_human_result.stdout,
        context=f"{context} learn agent backlog human",
        cmd=agent_backlog_human_cmd,
    )
    require_package_smoke(
        profile_path.read_text(encoding="utf-8") == json.dumps(profile_payload, indent=2) + "\n",
        context=f"{context} learn agent backlog human",
        cmd=agent_backlog_human_cmd,
        message="learn agent backlog human output must not mutate the profile",
    )

    agent_backlog_json_cmd = command_factory(
        "learn",
        "--agent-backlog",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--json",
    )
    agent_backlog_json_result = run_plain(agent_backlog_json_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_agent_backlog_report_json(
        agent_backlog_json_result.stdout,
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn agent backlog JSON",
        cmd=agent_backlog_json_cmd,
    )
    require_package_smoke(
        profile_path.read_text(encoding="utf-8") == json.dumps(profile_payload, indent=2) + "\n",
        context=f"{context} learn agent backlog JSON",
        cmd=agent_backlog_json_cmd,
        message="learn agent backlog JSON output must not mutate the profile",
    )

    agent_backlog_strict_json_cmd = command_factory(
        "learn",
        "--agent-backlog",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--strict",
        "--json",
    )
    agent_backlog_strict_json_result = run_plain(agent_backlog_strict_json_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_agent_backlog_report_json(
        agent_backlog_strict_json_result.stdout,
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn agent backlog strict JSON",
        cmd=agent_backlog_strict_json_cmd,
        require_status_pass=True,
    )

    agent_backlog_report_path = profile_path.with_name(f"{profile_path.stem}-agent-backlog-report.md")
    agent_backlog_report_path.write_text("stale agent backlog Markdown report\n", encoding="utf-8")
    agent_backlog_report_cmd = command_factory(
        "learn",
        "--agent-backlog",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--report",
        "--out",
        str(agent_backlog_report_path),
        "--force",
    )
    agent_backlog_report_result = run_plain(agent_backlog_report_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_output_write_success(
        agent_backlog_report_result.stdout,
        context=f"{context} learn agent backlog Markdown report",
        cmd=agent_backlog_report_cmd,
        expected_path=str(agent_backlog_report_path),
    )
    assert_agent_backlog_report_markdown(
        agent_backlog_report_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn agent backlog Markdown report",
        cmd=agent_backlog_report_cmd,
    )
    require_package_smoke(
        profile_path.read_text(encoding="utf-8") == json.dumps(profile_payload, indent=2) + "\n",
        context=f"{context} learn agent backlog Markdown report",
        cmd=agent_backlog_report_cmd,
        message="learn agent backlog Markdown report output must not mutate the profile",
    )

    agent_backlog_out_path = profile_path.with_name(f"{profile_path.stem}-agent-backlog-out.json")
    agent_backlog_out_path.write_text("stale agent backlog output\n", encoding="utf-8")
    agent_backlog_out_cmd = command_factory(
        "learn",
        "--agent-backlog",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
        "--from-file",
        str(signal_dir),
        "--json",
        "--out",
        str(agent_backlog_out_path),
        "--force",
    )
    agent_backlog_out_result = run_plain(agent_backlog_out_cmd, cwd=signal_workspace_root, env=relevance_env)
    assert_output_write_success(
        agent_backlog_out_result.stdout,
        context=f"{context} learn agent backlog out",
        cmd=agent_backlog_out_cmd,
        expected_path=str(agent_backlog_out_path),
    )
    assert_agent_backlog_report_json(
        agent_backlog_out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        usage_path=usage_path,
        context=f"{context} learn agent backlog out file",
        cmd=agent_backlog_out_cmd,
    )

    proposal_profile_path = profile_path.with_name(f"{profile_path.stem}-skill-proposals.json")
    proposal_usage_path = proposal_profile_path.with_name(f"{proposal_profile_path.stem}.usage{proposal_profile_path.suffix}")
    proposal_profile_path.write_text(
        json.dumps({
            "version": 1,
            "updatedAt": "2026-06-02T00:00:02.000Z",
            "entries": [
                {
                    "id": "learn-skill-proposal-a",
                    "category": "accessibility",
                    "text": "Improve future outputs by addressing Keyboard and focus behavior: No keyboard or focus behavior note detected.",
                    "source": "check:component-spec",
                    "createdAt": "2026-06-02T00:00:01.000Z",
                },
                {
                    "id": "learn-skill-proposal-b",
                    "category": "accessibility",
                    "text": "Improve future outputs by addressing Screen reader behavior: No screen-reader behavior note detected.",
                    "source": "check:component-spec",
                    "createdAt": "2026-06-02T00:00:02.000Z",
                },
            ],
        }),
        encoding="utf-8",
    )
    proposal_usage_path.write_text(
        json.dumps({
            "version": 1,
            "updatedAt": "2026-06-02T00:00:02.000Z",
            "profileFile": str(proposal_profile_path),
            "events": [],
        }),
        encoding="utf-8",
    )
    proposal_before = proposal_profile_path.read_text(encoding="utf-8")

    skill_proposals_human_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
    )
    skill_proposals_human_result = run_plain(skill_proposals_human_cmd, cwd=cwd, env=relevance_env)
    assert_skill_proposal_report_human(
        skill_proposals_human_result.stdout,
        context=f"{context} learn skill proposals human",
        cmd=skill_proposals_human_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before,
        context=f"{context} learn skill proposals human",
        cmd=skill_proposals_human_cmd,
        message="learn skill proposals human output must not mutate the profile",
    )

    skill_proposals_json_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
        "--json",
    )
    skill_proposals_json_result = run_plain(skill_proposals_json_cmd, cwd=cwd, env=relevance_env)
    skill_proposals_payload = assert_skill_proposal_report_json(
        skill_proposals_json_result.stdout,
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        context=f"{context} learn skill proposals JSON",
        cmd=skill_proposals_json_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before,
        context=f"{context} learn skill proposals JSON",
        cmd=skill_proposals_json_cmd,
        message="learn skill proposals JSON output must not mutate the profile",
    )

    skill_proposals_review_template_path = proposal_profile_path.with_name(f"{proposal_profile_path.stem}.review-template.json")
    skill_proposals_review_template_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
        "--review-template",
        "--out",
        str(skill_proposals_review_template_path),
    )
    skill_proposals_review_template_result = run_plain(skill_proposals_review_template_cmd, cwd=cwd, env=relevance_env)
    assert_output_write_success(
        skill_proposals_review_template_result.stdout,
        expected_path=str(skill_proposals_review_template_path),
        context=f"{context} learn skill proposals review template",
        cmd=skill_proposals_review_template_cmd,
    )
    assert_skill_proposal_review_template_json(
        skill_proposals_review_template_path.read_text(encoding="utf-8"),
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        context=f"{context} learn skill proposals review template",
        cmd=skill_proposals_review_template_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before,
        context=f"{context} learn skill proposals review template",
        cmd=skill_proposals_review_template_cmd,
        message="learn skill proposals review-template output must not mutate the profile",
    )

    review_proposal_id = next(
        (
            item.get("id")
            for item in skill_proposals_payload.get("proposals", [])
            if isinstance(item, dict)
            and item.get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
        ),
        "",
    )
    require_package_smoke(
        bool(review_proposal_id),
        context=f"{context} learn skill proposals review JSON",
        cmd=skill_proposals_json_cmd,
        message="learn skill proposals review fixture needs a component-spec proposal id",
    )
    skill_proposals_review_path = profile_path.with_name(f"{profile_path.stem}-skill-proposals.review.json")
    skill_proposals_review_path.write_text(json.dumps({
        "version": 1,
        "decisions": [
            {
                "proposalId": review_proposal_id,
                "status": "applied",
                "reviewedAt": "2026-06-11T00:00:00.000Z",
                "reviewer": "package-smoke",
                "note": "Package smoke confirms review-file decision joins remain read-only.",
            },
        ],
    }, indent=2) + "\n", encoding="utf-8")
    skill_proposals_review_before = skill_proposals_review_path.read_text(encoding="utf-8")
    skill_proposals_review_json_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--review-file",
        str(skill_proposals_review_path),
        "--from-file",
        str(signal_dir),
        "--json",
    )
    skill_proposals_review_json_result = run_plain(skill_proposals_review_json_cmd, cwd=cwd, env=relevance_env)
    assert_skill_proposal_review_json(
        skill_proposals_review_json_result.stdout,
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        review_path=skill_proposals_review_path,
        context=f"{context} learn skill proposals review JSON",
        cmd=skill_proposals_review_json_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before
        and skill_proposals_review_path.read_text(encoding="utf-8") == skill_proposals_review_before,
        context=f"{context} learn skill proposals review JSON",
        cmd=skill_proposals_review_json_cmd,
        message="learn skill proposals review JSON output must not mutate the profile or review file",
    )

    skill_proposals_review_check_json_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--review-file",
        str(skill_proposals_review_path),
        "--review-check",
        "--from-file",
        str(signal_dir),
        "--json",
    )
    skill_proposals_review_check_json_result = run_plain(skill_proposals_review_check_json_cmd, cwd=cwd, env=relevance_env)
    assert_skill_proposal_review_check_json(
        skill_proposals_review_check_json_result.stdout,
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        review_path=skill_proposals_review_path,
        context=f"{context} learn skill proposals review-check JSON",
        cmd=skill_proposals_review_check_json_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before
        and skill_proposals_review_path.read_text(encoding="utf-8") == skill_proposals_review_before,
        context=f"{context} learn skill proposals review-check JSON",
        cmd=skill_proposals_review_check_json_cmd,
        message="learn skill proposals review-check JSON output must not mutate the profile or review file",
    )

    skill_proposals_review_check_report_path = profile_path.with_name(f"{profile_path.stem}-skill-proposals-review-check.md")
    skill_proposals_review_check_report_path.write_text("stale skill proposal review-check Markdown report\n", encoding="utf-8")
    skill_proposals_review_check_report_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--review-file",
        str(skill_proposals_review_path),
        "--review-check",
        "--from-file",
        str(signal_dir),
        "--report",
        "--out",
        str(skill_proposals_review_check_report_path),
        "--force",
    )
    skill_proposals_review_check_report_result = run_plain(
        skill_proposals_review_check_report_cmd,
        cwd=cwd,
        env=relevance_env,
    )
    assert_output_write_success(
        skill_proposals_review_check_report_result.stdout,
        context=f"{context} learn skill proposals review-check Markdown report out",
        cmd=skill_proposals_review_check_report_cmd,
        expected_path=str(skill_proposals_review_check_report_path),
    )
    assert_skill_proposal_review_check_markdown(
        skill_proposals_review_check_report_path.read_text(encoding="utf-8"),
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        review_path=skill_proposals_review_path,
        context=f"{context} learn skill proposals review-check Markdown report out file",
        cmd=skill_proposals_review_check_report_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before
        and skill_proposals_review_path.read_text(encoding="utf-8") == skill_proposals_review_before,
        context=f"{context} learn skill proposals review-check Markdown report out",
        cmd=skill_proposals_review_check_report_cmd,
        message="learn skill proposals review-check Markdown report output must not mutate the profile or review file",
    )

    skill_proposals_apply_plan_review_path = profile_path.with_name(f"{profile_path.stem}-skill-proposals.accepted.review.json")
    skill_proposals_apply_plan_review_path.write_text(json.dumps({
        "version": 1,
        "decisions": [
            {
                "proposalId": review_proposal_id,
                "status": "accepted",
                "reviewedAt": "2026-06-11T00:10:00.000Z",
                "reviewer": "package-smoke",
                "note": "Package smoke confirms accepted proposals become manual apply-plan tasks.",
            },
        ],
    }, indent=2) + "\n", encoding="utf-8")
    skill_proposals_apply_plan_review_before = skill_proposals_apply_plan_review_path.read_text(encoding="utf-8")
    skill_proposals_apply_plan_json_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--review-file",
        str(skill_proposals_apply_plan_review_path),
        "--apply-plan",
        "--from-file",
        str(signal_dir),
        "--json",
    )
    skill_proposals_apply_plan_json_result = run_plain(skill_proposals_apply_plan_json_cmd, cwd=cwd, env=relevance_env)
    assert_skill_proposal_apply_plan_json(
        skill_proposals_apply_plan_json_result.stdout,
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        review_path=skill_proposals_apply_plan_review_path,
        signal_source=signal_dir,
        context=f"{context} learn skill proposals apply-plan JSON",
        cmd=skill_proposals_apply_plan_json_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before
        and skill_proposals_apply_plan_review_path.read_text(encoding="utf-8") == skill_proposals_apply_plan_review_before,
        context=f"{context} learn skill proposals apply-plan JSON",
        cmd=skill_proposals_apply_plan_json_cmd,
        message="learn skill proposals apply-plan JSON output must not mutate the profile or review file",
    )

    skill_proposals_apply_plan_human_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--review-file",
        str(skill_proposals_apply_plan_review_path),
        "--apply-plan",
        "--from-file",
        str(signal_dir),
    )
    skill_proposals_apply_plan_human_result = run_plain(
        skill_proposals_apply_plan_human_cmd,
        cwd=cwd,
        env=relevance_env,
    )
    assert_skill_proposal_apply_plan_human(
        skill_proposals_apply_plan_human_result.stdout,
        context=f"{context} learn skill proposals apply-plan human output",
        cmd=skill_proposals_apply_plan_human_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before
        and skill_proposals_apply_plan_review_path.read_text(encoding="utf-8") == skill_proposals_apply_plan_review_before,
        context=f"{context} learn skill proposals apply-plan human output",
        cmd=skill_proposals_apply_plan_human_cmd,
        message="learn skill proposals apply-plan human output must not mutate the profile or review file",
    )

    skill_proposals_apply_plan_report_path = profile_path.with_name(f"{profile_path.stem}-skill-proposal-apply-plan.md")
    skill_proposals_apply_plan_report_path.write_text("stale skill proposal apply-plan Markdown report\n", encoding="utf-8")
    skill_proposals_apply_plan_report_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--review-file",
        str(skill_proposals_apply_plan_review_path),
        "--apply-plan",
        "--from-file",
        str(signal_dir),
        "--report",
        "--out",
        str(skill_proposals_apply_plan_report_path),
        "--force",
    )
    skill_proposals_apply_plan_report_result = run_plain(
        skill_proposals_apply_plan_report_cmd,
        cwd=cwd,
        env=relevance_env,
    )
    assert_output_write_success(
        skill_proposals_apply_plan_report_result.stdout,
        context=f"{context} learn skill proposals apply-plan Markdown report out",
        cmd=skill_proposals_apply_plan_report_cmd,
        expected_path=str(skill_proposals_apply_plan_report_path),
    )
    assert_skill_proposal_apply_plan_markdown(
        skill_proposals_apply_plan_report_path.read_text(encoding="utf-8"),
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        review_path=skill_proposals_apply_plan_review_path,
        context=f"{context} learn skill proposals apply-plan Markdown report out file",
        cmd=skill_proposals_apply_plan_report_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before
        and skill_proposals_apply_plan_review_path.read_text(encoding="utf-8") == skill_proposals_apply_plan_review_before,
        context=f"{context} learn skill proposals apply-plan Markdown report out",
        cmd=skill_proposals_apply_plan_report_cmd,
        message="learn skill proposals apply-plan Markdown report output must not mutate the profile or review file",
    )

    skill_proposals_min_evidence_json_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
        "--min-evidence",
        "3",
        "--json",
    )
    skill_proposals_min_evidence_json_result = run_plain(skill_proposals_min_evidence_json_cmd, cwd=cwd, env=relevance_env)
    assert_skill_proposal_min_evidence_json(
        skill_proposals_min_evidence_json_result.stdout,
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        context=f"{context} learn skill proposals min-evidence JSON",
        cmd=skill_proposals_min_evidence_json_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before,
        context=f"{context} learn skill proposals min-evidence JSON",
        cmd=skill_proposals_min_evidence_json_cmd,
        message="learn skill proposals min-evidence JSON output must not mutate the profile",
    )

    skill_proposals_strict_json_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
        "--strict",
        "--json",
    )
    run_expected_failure(
        skill_proposals_strict_json_cmd,
        cwd=cwd,
        env=relevance_env,
        context=f"{context} learn skill proposals strict JSON",
        assertion=lambda raw, *, returncode, context, cmd: assert_skill_proposal_report_json(
            raw,
            profile_path=proposal_profile_path,
            usage_path=proposal_usage_path,
            context=context,
            cmd=cmd,
            returncode=returncode,
        ),
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before,
        context=f"{context} learn skill proposals strict JSON",
        cmd=skill_proposals_strict_json_cmd,
        message="learn skill proposals strict JSON output must not mutate the profile",
    )

    skill_proposals_out_path = profile_path.with_name(f"{profile_path.stem}-skill-proposals-out.json")
    skill_proposals_out_path.write_text("stale skill proposal output\n", encoding="utf-8")
    skill_proposals_out_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
        "--json",
        "--out",
        str(skill_proposals_out_path),
        "--force",
    )
    skill_proposals_out_result = run_plain(skill_proposals_out_cmd, cwd=cwd, env=relevance_env)
    assert_output_write_success(
        skill_proposals_out_result.stdout,
        context=f"{context} learn skill proposals out",
        cmd=skill_proposals_out_cmd,
        expected_path=str(skill_proposals_out_path),
    )
    assert_skill_proposal_report_json(
        skill_proposals_out_path.read_text(encoding="utf-8"),
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        context=f"{context} learn skill proposals out file",
        cmd=skill_proposals_out_cmd,
    )

    skill_proposals_report_path = profile_path.with_name(f"{profile_path.stem}-skill-proposals-report.md")
    skill_proposals_report_path.write_text("stale skill proposal Markdown report\n", encoding="utf-8")
    skill_proposals_report_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
        "--report",
        "--out",
        str(skill_proposals_report_path),
        "--force",
    )
    skill_proposals_report_result = run_plain(skill_proposals_report_cmd, cwd=cwd, env=relevance_env)
    assert_output_write_success(
        skill_proposals_report_result.stdout,
        context=f"{context} learn skill proposals Markdown report out",
        cmd=skill_proposals_report_cmd,
        expected_path=str(skill_proposals_report_path),
    )
    assert_skill_proposal_report_markdown(
        skill_proposals_report_path.read_text(encoding="utf-8"),
        profile_path=proposal_profile_path,
        usage_path=proposal_usage_path,
        context=f"{context} learn skill proposals Markdown report out file",
        cmd=skill_proposals_report_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before,
        context=f"{context} learn skill proposals Markdown report out",
        cmd=skill_proposals_report_cmd,
        message="learn skill proposals Markdown report output must not mutate the profile",
    )

    skill_proposals_patch_path = profile_path.with_name(f"{profile_path.stem}-skill-proposals.patch")
    skill_proposals_patch_path.write_text("stale skill proposal patch\n", encoding="utf-8")
    skill_proposals_patch_cmd = command_factory(
        "learn",
        "--propose-skills",
        "--file",
        str(proposal_profile_path),
        "--usage-file",
        str(proposal_usage_path),
        "--from-file",
        str(signal_dir),
        "--patch",
        "--out",
        str(skill_proposals_patch_path),
        "--force",
    )
    skill_proposals_patch_result = run_plain(skill_proposals_patch_cmd, cwd=cwd, env=relevance_env)
    assert_output_write_success(
        skill_proposals_patch_result.stdout,
        context=f"{context} learn skill proposals patch out",
        cmd=skill_proposals_patch_cmd,
        expected_path=str(skill_proposals_patch_path),
    )
    assert_skill_proposal_patch(
        skill_proposals_patch_path.read_text(encoding="utf-8"),
        context=f"{context} learn skill proposals patch out file",
        cmd=skill_proposals_patch_cmd,
    )
    require_package_smoke(
        proposal_profile_path.read_text(encoding="utf-8") == proposal_before,
        context=f"{context} learn skill proposals patch out",
        cmd=skill_proposals_patch_cmd,
        message="learn skill proposals patch output must not mutate the profile",
    )

    eval_template_path = profile_path.with_name(f"{profile_path.stem}-eval-template.json")
    eval_template_path.write_text("stale eval template output\n", encoding="utf-8")
    eval_template_cmd = command_factory(
        "learn",
        "--eval-template",
        "--query",
        EXPECTED_ROUTE_BRIEF,
        "--category",
        "accessibility",
        "--file",
        str(profile_path),
        "--out",
        str(eval_template_path),
        "--force",
    )
    eval_template_result = run_plain(eval_template_cmd, cwd=cwd, env=relevance_env)
    assert_output_write_success(
        eval_template_result.stdout,
        context=f"{context} learn eval-template out",
        cmd=eval_template_cmd,
        expected_path=str(eval_template_path),
    )
    assert_learning_eval_template_json(
        eval_template_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        context=f"{context} learn eval-template out file",
        cmd=eval_template_cmd,
    )

    eval_template_check_cmd = command_factory(
        "learn",
        "--eval",
        "--from-file",
        str(eval_template_path),
        "--file",
        str(profile_path),
        "--strict",
        "--json",
    )
    eval_template_check_result = run_plain(eval_template_check_cmd, cwd=cwd, env=relevance_env)
    assert_learning_eval_template_report_json(
        eval_template_check_result.stdout,
        profile_path=profile_path,
        eval_path=eval_template_path,
        context=f"{context} generated learn eval-template checkpoint",
        cmd=eval_template_check_cmd,
    )

    eval_path = profile_path.with_name(f"{profile_path.stem}-eval.json")
    eval_path.write_text(
        json.dumps({
            "version": 1,
            "cases": [
                {
                    "id": "button-accessibility",
                    "routeId": EXPECTED_ROUTE_ID,
                    "brief": EXPECTED_ROUTE_BRIEF,
                    "limit": 1,
                    "expectedSelectedIds": ["learn-relevant"],
                    "avoidedSelectedIds": ["learn-brand"],
                    "minMatchedCount": 1,
                    "requireNoFallback": True,
                },
            ],
        }),
        encoding="utf-8",
    )

    eval_human_cmd = command_factory(
        "learn",
        "--eval",
        "--from-file",
        str(eval_path),
        "--file",
        str(profile_path),
        "--limit",
        "1",
    )
    eval_human_result = run_plain(eval_human_cmd, cwd=cwd, env=relevance_env)
    assert_learning_eval_report_human(
        eval_human_result.stdout,
        context=f"{context} learn eval human",
        cmd=eval_human_cmd,
    )

    eval_json_cmd = command_factory(
        "learn",
        "--eval",
        "--from-file",
        str(eval_path),
        "--file",
        str(profile_path),
        "--limit",
        "1",
        "--json",
    )
    eval_json_result = run_plain(eval_json_cmd, cwd=cwd, env=relevance_env)
    assert_learning_eval_report_json(
        eval_json_result.stdout,
        profile_path=profile_path,
        eval_path=eval_path,
        context=f"{context} learn eval JSON",
        cmd=eval_json_cmd,
    )

    strict_eval_path = profile_path.with_name(f"{profile_path.stem}-eval-strict-fail.json")
    strict_eval_path.write_text(
        json.dumps({
            "version": 1,
            "cases": [
                {
                    "id": "missing-accessibility",
                    "routeId": EXPECTED_ROUTE_ID,
                    "brief": EXPECTED_ROUTE_BRIEF,
                    "limit": 1,
                    "expectedSelectedIds": ["missing-entry"],
                    "minMatchedCount": 1,
                    "requireNoFallback": True,
                },
            ],
        }),
        encoding="utf-8",
    )
    strict_eval_cmd = command_factory(
        "learn",
        "--eval",
        "--from-file",
        str(strict_eval_path),
        "--file",
        str(profile_path),
        "--limit",
        "1",
        "--strict",
        "--json",
    )
    run_expected_failure(
        strict_eval_cmd,
        cwd=cwd,
        env=relevance_env,
        context=f"{context} learn eval strict failure",
        assertion=lambda raw, *, returncode, context, cmd: assert_learning_eval_strict_failure_json(
            raw,
            returncode=returncode,
            profile_path=profile_path,
            eval_path=strict_eval_path,
            context=context,
            cmd=cmd,
        ),
    )

    eval_out_path = profile_path.with_name(f"{profile_path.stem}-eval-out.json")
    eval_out_path.write_text("stale eval output\n", encoding="utf-8")
    eval_out_cmd = command_factory(
        "learn",
        "--eval",
        "--from-file",
        str(eval_path),
        "--file",
        str(profile_path),
        "--limit",
        "1",
        "--json",
        "--out",
        str(eval_out_path),
        "--force",
    )
    eval_out_result = run_plain(eval_out_cmd, cwd=cwd, env=relevance_env)
    assert_output_write_success(
        eval_out_result.stdout,
        context=f"{context} learn eval out",
        cmd=eval_out_cmd,
        expected_path=str(eval_out_path),
    )
    assert_learning_eval_report_json(
        eval_out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        eval_path=eval_path,
        context=f"{context} learn eval out file",
        cmd=eval_out_cmd,
    )


def run_self_test() -> None:
    context = "package smoke self-test"
    cmd = ["design-ai", "doctor", "--json"]
    assert_doctor_json_clean(
        passing_doctor_report_json(),
        context=context,
        cmd=cmd,
        parse_error_message=f"failed to parse doctor JSON after {context}",
    )

    expect_self_test_failure(
        lambda: assert_doctor_json_clean(
            "{",
            context=context,
            cmd=cmd,
            parse_error_message=f"failed to parse doctor JSON after {context}",
        ),
        expected="failed to parse doctor JSON",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_doctor_json_clean(
            "\x1b[31m{}",
            context=context,
            cmd=cmd,
            parse_error_message=f"failed to parse doctor JSON after {context}",
        ),
        expected="ANSI escape",
        scope="package smoke",
    )

    expect_self_test_failure(
        lambda: assert_doctor_json_clean(
            doctor_report_json_missing("Package smoke check"),
            context=context,
            cmd=cmd,
            parse_error_message=f"failed to parse doctor JSON after {context}",
            print_raw_on_failure=False,
        ),
        expected="Package smoke check=missing",
        scope="package smoke",
    )

    site_evidence_cmd = ["design-ai", "site", "--stdin", "--report"]
    site_evidence_payload = {
        "implementationEvidence": {
            key: [value]
            for key, value in SITE_EVIDENCE_VALUES.items()
        }
    }
    assert_site_evidence_payload(site_evidence_payload, context=context, label="site evidence self-test")
    assert_site_evidence_markdown(
        "\n".join(SITE_EVIDENCE_VALUES.values()),
        context=context,
        cmd=site_evidence_cmd,
        label="site evidence self-test markdown",
    )
    stale_site_evidence_payload = json.loads(json.dumps(site_evidence_payload))
    stale_site_evidence_payload["implementationEvidence"]["remainingRisks"] = []
    expect_self_test_failure(
        lambda: assert_site_evidence_payload(
            stale_site_evidence_payload,
            context=context,
            label="site evidence self-test",
        ),
        expected="evidence field remainingRisks changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_site_evidence_markdown(
            SITE_EVIDENCE_VALUES["executedWork"],
            context=context,
            cmd=site_evidence_cmd,
            label="site evidence self-test markdown",
        ),
        expected="missing evidence fragment",
        scope="package smoke",
    )
    assert_site_mcp_probe_counts(
        EXPECTED_SITE_MCP_PROBE_COUNTS,
        context=f"{context} site bundle check",
        label="site bundle check",
    )
    site_bundle_mcp_probes_payload = json.loads(passing_site_mcp_check_probes_json())["probes"]
    assert_site_bundle_mcp_probes_payload(
        site_bundle_mcp_probes_payload,
        context=f"{context} site bundle mcp-probes.json",
    )
    for label in (
        "site bundle check",
        "site bundle check summary",
        "site bundle compare left",
        "site bundle compare right",
        "site bundle handoff",
    ):
        expect_self_test_failure(
            lambda label=label: assert_site_mcp_probe_counts(
                {**EXPECTED_SITE_MCP_PROBE_COUNTS, "warn": 1},
                context=context,
                label=label,
            ),
            expected=f"{label} after {context} MCP probe counts changed",
            scope="package smoke",
        )
    stale_site_bundle_mcp_probes_payload = json.loads(json.dumps(site_bundle_mcp_probes_payload))
    stale_site_bundle_mcp_probes_payload["items"][0]["level"] = "warn"
    expect_self_test_failure(
        lambda: assert_site_bundle_mcp_probes_payload(
            stale_site_bundle_mcp_probes_payload,
            context=f"{context} site bundle mcp-probes.json",
        ),
        expected="mcp-probes.json item should pass",
        scope="package smoke",
    )

    with tempfile.TemporaryDirectory(prefix="design-ai-package-smoke-self-test-") as tmp:
        report_path = Path(tmp) / "doctor.json"
        report_path.write_text(passing_doctor_report_json(), encoding="utf-8")
        assert_doctor_report_file(report_path, context=context)
        expect_self_test_failure(
            lambda: assert_doctor_report_file(Path(tmp) / "missing.json", context=context),
            expected="failed to read doctor JSON",
            scope="package smoke",
        )

        site_next_actions_out_path = Path(tmp) / "site-next-actions.json"
        site_next_actions_out_path.write_text(passing_site_next_actions_json(), encoding="utf-8")
        site_next_actions_out_cmd = [
            "design-ai",
            "site",
            "--stdin",
            "--next-actions",
            "--json",
            "--out",
            str(site_next_actions_out_path),
            "--force",
        ]
        assert_site_next_actions_json_file_output(
            f"Wrote {site_next_actions_out_path}\n",
            site_next_actions_out_path.read_text(encoding="utf-8"),
            output_path=str(site_next_actions_out_path),
            context=f"{context} site next-actions JSON out",
            cmd=site_next_actions_out_cmd,
        )
        site_next_actions_human_out_path = Path(tmp) / "site-next-actions.md"
        site_next_actions_human_out_path.write_text(passing_site_next_actions_human(), encoding="utf-8")
        site_next_actions_human_out_cmd = [
            "design-ai",
            "site",
            "--stdin",
            "--next-actions",
            "--out",
            str(site_next_actions_human_out_path),
            "--force",
        ]
        assert_site_next_actions_human_file_output(
            f"Wrote {site_next_actions_human_out_path}\n",
            site_next_actions_human_out_path.read_text(encoding="utf-8"),
            output_path=str(site_next_actions_human_out_path),
            context=f"{context} site next-actions human out",
            cmd=site_next_actions_human_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_site_next_actions_human_file_output(
                f"Wrote {site_next_actions_human_out_path}\n",
                passing_site_next_actions_human().replace("does not call external MCPs", "may call external MCPs"),
                output_path=str(site_next_actions_human_out_path),
                context=f"{context} site next-actions human out",
                cmd=site_next_actions_human_out_cmd,
            ),
            expected="missing fragment",
            scope="package smoke",
        )

        site_mcp_check_probes_out_path = Path(tmp) / "site-mcp-check-probes.json"
        site_mcp_check_probes_out_path.write_text(passing_site_mcp_check_probes_json(), encoding="utf-8")
        site_mcp_check_probes_out_cmd = [
            "design-ai",
            "site",
            "--stdin",
            "--mcp-check",
            "--probes",
            "--json",
            "--out",
            str(site_mcp_check_probes_out_path),
            "--force",
        ]
        assert_site_mcp_check_probes_json_file_output(
            f"Wrote {site_mcp_check_probes_out_path}\n",
            site_mcp_check_probes_out_path.read_text(encoding="utf-8"),
            output_path=str(site_mcp_check_probes_out_path),
            context=f"{context} site mcp-check probes JSON out",
            cmd=site_mcp_check_probes_out_cmd,
        )
        assert_site_mcp_check_probes_human(
            passing_site_mcp_check_probes_human(),
            context=f"{context} site mcp-check probes human",
            cmd=["design-ai", "site", "--stdin", "--mcp-check", "--probes"],
        )
        site_mcp_check_probes_human_out_path = Path(tmp) / "site-mcp-check-probes.txt"
        site_mcp_check_probes_human_out_path.write_text(passing_site_mcp_check_probes_human(), encoding="utf-8")
        site_mcp_check_probes_human_out_cmd = [
            "design-ai",
            "site",
            "--stdin",
            "--mcp-check",
            "--probes",
            "--out",
            str(site_mcp_check_probes_human_out_path),
            "--force",
        ]
        assert_site_mcp_check_probes_human_file_output(
            f"Wrote {site_mcp_check_probes_human_out_path}\n",
            site_mcp_check_probes_human_out_path.read_text(encoding="utf-8"),
            output_path=str(site_mcp_check_probes_human_out_path),
            context=f"{context} site mcp-check probes human out",
            cmd=site_mcp_check_probes_human_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_site_mcp_check_probes_json_file_output(
                f"Wrote {site_mcp_check_probes_out_path}\n",
                site_mcp_check_probes_out_path.read_text(encoding="utf-8").replace(
                    '"externalCalls": false',
                    '"externalCalls": true',
                ),
                output_path=str(site_mcp_check_probes_out_path),
                context=f"{context} site mcp-check probes JSON out",
                cmd=site_mcp_check_probes_out_cmd,
            ),
            expected="without external calls",
            scope="package smoke",
        )

        site_mcp_plan_json_out_path = Path(tmp) / "site-mcp-plan-probes.json"
        site_mcp_plan_json_out_path.write_text(passing_site_mcp_plan_json(probes=True), encoding="utf-8")
        site_mcp_plan_json_out_cmd = [
            "design-ai",
            "site",
            "--stdin",
            "--mcp-plan",
            "--probes",
            "--json",
            "--out",
            str(site_mcp_plan_json_out_path),
            "--force",
        ]
        assert_site_mcp_plan_probes_json_file_output(
            f"Wrote {site_mcp_plan_json_out_path}\n",
            site_mcp_plan_json_out_path.read_text(encoding="utf-8"),
            output_path=str(site_mcp_plan_json_out_path),
            context=f"{context} site mcp-plan probes JSON out",
            cmd=site_mcp_plan_json_out_cmd,
        )
        site_mcp_plan_human_out_path = Path(tmp) / "site-mcp-plan-probes-human.txt"
        site_mcp_plan_human_out_path.write_text(passing_site_mcp_check_probes_human(), encoding="utf-8")
        site_mcp_plan_human_out_cmd = site_mcp_probe_embedded_command(
            json.loads(passing_site_mcp_plan_json(probes=True)),
            "mcpCheckProbesHumanOut",
            ["design-ai", "site", "--stdin", "--mcp-plan", "--probes", "--json"],
            output_path=str(site_mcp_plan_human_out_path),
            context=f"{context} site mcp-plan probes emitted human out command",
        )
        assert_site_mcp_check_probes_human_file_output(
            f"Wrote {site_mcp_plan_human_out_path}\n",
            site_mcp_plan_human_out_path.read_text(encoding="utf-8"),
            output_path=str(site_mcp_plan_human_out_path),
            context=f"{context} site mcp-plan probes emitted human out",
            cmd=site_mcp_plan_human_out_cmd,
        )
        site_mcp_plan_check_json_out_path = Path(tmp) / "site-mcp-plan-probes-check.json"
        site_mcp_plan_check_json_out_path.write_text(passing_site_mcp_check_probes_json(), encoding="utf-8")
        site_mcp_plan_check_json_out_cmd = site_mcp_probe_embedded_command(
            json.loads(passing_site_mcp_plan_json(probes=True)),
            "mcpCheckProbesJsonOut",
            ["design-ai", "site", "--stdin", "--mcp-plan", "--probes", "--json"],
            output_path=str(site_mcp_plan_check_json_out_path),
            context=f"{context} site mcp-plan probes emitted check JSON out command",
        )
        assert_site_mcp_check_probes_json_file_output(
            f"Wrote {site_mcp_plan_check_json_out_path}\n",
            site_mcp_plan_check_json_out_path.read_text(encoding="utf-8"),
            output_path=str(site_mcp_plan_check_json_out_path),
            context=f"{context} site mcp-plan probes emitted check JSON out",
            cmd=site_mcp_plan_check_json_out_cmd,
        )
        site_mcp_plan_emitted_json_out_path = Path(tmp) / "site-mcp-plan-probes-emitted.json"
        site_mcp_plan_emitted_json_out_path.write_text(passing_site_mcp_plan_json(probes=True), encoding="utf-8")
        site_mcp_plan_emitted_json_out_cmd = site_mcp_probe_embedded_command(
            json.loads(passing_site_mcp_plan_json(probes=True)),
            "mcpPlanProbesJsonOut",
            ["design-ai", "site", "--stdin", "--mcp-plan", "--probes", "--json"],
            output_path=str(site_mcp_plan_emitted_json_out_path),
            context=f"{context} site mcp-plan probes emitted plan JSON out command",
        )
        assert_site_mcp_plan_probes_json_file_output(
            f"Wrote {site_mcp_plan_emitted_json_out_path}\n",
            site_mcp_plan_emitted_json_out_path.read_text(encoding="utf-8"),
            output_path=str(site_mcp_plan_emitted_json_out_path),
            context=f"{context} site mcp-plan probes emitted plan JSON out",
            cmd=site_mcp_plan_emitted_json_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_site_mcp_check_probes_human_file_output(
                f"Wrote {site_mcp_plan_human_out_path}\n",
                site_mcp_plan_human_out_path.read_text(encoding="utf-8").replace(
                    "Probe commands:",
                    "Probe notes:",
                ),
                output_path=str(site_mcp_plan_human_out_path),
                context=f"{context} site mcp-plan probes emitted human out",
                cmd=site_mcp_plan_human_out_cmd,
            ),
            expected="Probe commands",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_site_mcp_check_probes_json_file_output(
                f"Wrote {site_mcp_plan_check_json_out_path}\n",
                site_mcp_plan_check_json_out_path.read_text(encoding="utf-8").replace(
                    '"externalCalls": false',
                    '"externalCalls": true',
                ),
                output_path=str(site_mcp_plan_check_json_out_path),
                context=f"{context} site mcp-plan probes emitted check JSON out",
                cmd=site_mcp_plan_check_json_out_cmd,
            ),
            expected="external calls",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_site_mcp_plan_probes_json_file_output(
                f"Wrote {site_mcp_plan_emitted_json_out_path}\n",
                site_mcp_plan_emitted_json_out_path.read_text(encoding="utf-8").replace(
                    '"targetRepoMutation": false',
                    '"targetRepoMutation": true',
                ),
                output_path=str(site_mcp_plan_emitted_json_out_path),
                context=f"{context} site mcp-plan probes emitted plan JSON out",
                cmd=site_mcp_plan_emitted_json_out_cmd,
            ),
            expected="local/read-only",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_site_mcp_plan_probes_json_file_output(
                f"Wrote {site_mcp_plan_json_out_path}\n",
                site_mcp_plan_json_out_path.read_text(encoding="utf-8").replace(
                    '"externalCalls": false',
                    '"externalCalls": true',
                ),
                output_path=str(site_mcp_plan_json_out_path),
                context=f"{context} site mcp-plan probes JSON out",
                cmd=site_mcp_plan_json_out_cmd,
            ),
            expected="local/read-only",
            scope="package smoke",
        )

        check_learning_profile_path = Path(tmp) / "check-learning.json"
        check_learning_entries = [
            {
                "id": "learn-check-keyboard",
                "category": "accessibility",
                "text": "Improve future outputs by addressing Keyboard and focus behavior: No keyboard or focus behavior note detected.",
                "source": "check:artifact",
                "createdAt": "2026-05-22T00:00:00.000Z",
            },
            {
                "id": "learn-check-responsive",
                "category": "workflow",
                "text": "Improve future outputs by addressing Responsive behavior: No mobile/desktop/responsive behavior note detected.",
                "source": "check:artifact",
                "createdAt": "2026-05-22T00:00:01.000Z",
            },
            {
                "id": "learn-check-screen-reader",
                "category": "accessibility",
                "text": "Improve future outputs by addressing Screen-reader semantics: No screen-reader or ARIA behavior note detected.",
                "source": "check:artifact",
                "createdAt": "2026-05-22T00:00:02.000Z",
            },
            {
                "id": "learn-check-misuse",
                "category": "workflow",
                "text": "Improve future outputs by addressing Misuse guidance: No Don't/avoid/anti-pattern guidance detected.",
                "source": "check:artifact",
                "createdAt": "2026-05-22T00:00:03.000Z",
            },
        ]
        check_learning_profile_path.write_text(
            json.dumps(
                {
                    "version": 1,
                    "updatedAt": "2026-05-22T00:00:03.000Z",
                    "entries": check_learning_entries,
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        check_learning_cmd = [
            "design-ai",
            "check",
            "check-learning.md",
            "--learn",
            "--yes",
            "--learning-file",
            str(check_learning_profile_path),
            "--json",
        ]
        check_learning_payload = {
            "filePath": "/tmp/check-learning.md",
            "status": "warn",
            "passes": 5,
            "warnings": 4,
            "failures": 0,
            "total": 9,
            "score": "5/9",
            "results": [],
            "learningCapture": {
                "file": str(check_learning_profile_path),
                "dryRun": False,
                "applied": True,
                "source": "check:artifact",
                "candidateCount": 4,
                "addedCount": 4,
                "skippedCount": 0,
                "count": 4,
                "entries": check_learning_entries,
                "skipped": [],
            },
        }
        assert_check_learning_capture_json(
            json.dumps(check_learning_payload),
            profile_path=check_learning_profile_path,
            expected_file_suffix="check-learning.md",
            context=context,
            cmd=check_learning_cmd,
        )
        expect_self_test_failure(
            lambda: assert_check_learning_capture_json(
                json.dumps({
                    **check_learning_payload,
                    "learningCapture": {
                        **check_learning_payload["learningCapture"],
                        "addedCount": 3,
                    },
                }),
                profile_path=check_learning_profile_path,
                expected_file_suffix="check-learning.md",
                context=context,
                cmd=check_learning_cmd,
            ),
            expected="check learning capture counts changed",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_check_learning_capture_json(
                json.dumps({
                    **check_learning_payload,
                    "learningCapture": {
                        **check_learning_payload["learningCapture"],
                        "source": "check:component-spec",
                    },
                }),
                profile_path=check_learning_profile_path,
                expected_file_suffix="check-learning.md",
                context=context,
                cmd=check_learning_cmd,
            ),
            expected="check learning capture metadata changed",
            scope="package smoke",
        )

        learning_profile_path = Path(tmp) / "learning.json"
        learn_feedback_cmd = [
            "design-ai",
            "learn",
            "--feedback",
            "Keep audit findings short and evidence-led",
            "--outcome",
            "keep",
            "--file",
            str(learning_profile_path),
            "--json",
        ]
        learning_feedback_payload = {
            "file": str(learning_profile_path),
            "feedback": {
                "outcome": "keep",
                "category": "workflow",
                "instruction": "Repeat in future outputs: Keep audit findings short and evidence-led",
            },
            "entry": {
                "id": "learn-feedback",
                "category": "workflow",
                "text": "Repeat in future outputs: Keep audit findings short and evidence-led",
                "source": "feedback:keep",
                "createdAt": "2026-05-22T00:00:00.000Z",
            },
            "count": 1,
        }
        assert_learning_feedback_json(
            json.dumps(learning_feedback_payload),
            profile_path=learning_profile_path,
            outcome="keep",
            category="workflow",
            expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
            expected_count=1,
            context=context,
            cmd=learn_feedback_cmd,
        )
        learning_feedback_out_path = Path(tmp) / "learning-feedback-out.json"
        learning_feedback_out_path.write_text(json.dumps(learning_feedback_payload), encoding="utf-8")
        learn_feedback_out_cmd = [
            "design-ai",
            "learn",
            "--feedback",
            "Keep audit findings short and evidence-led",
            "--outcome",
            "keep",
            "--file",
            str(learning_profile_path),
            "--json",
            "--out",
            str(learning_feedback_out_path),
            "--force",
        ]
        assert_output_write_success(
            f"Wrote {learning_feedback_out_path}\n",
            context=f"{context} feedback out",
            cmd=learn_feedback_out_cmd,
            expected_path=str(learning_feedback_out_path),
        )
        assert_learning_feedback_json(
            learning_feedback_out_path.read_text(encoding="utf-8"),
            profile_path=learning_profile_path,
            outcome="keep",
            category="workflow",
            expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
            expected_count=1,
            context=f"{context} feedback out file",
            cmd=learn_feedback_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_feedback_json(
                json.dumps({
                    **learning_feedback_payload,
                    "entry": {
                        **learning_feedback_payload["entry"],
                        "source": "cli",
                    },
                }),
                profile_path=learning_profile_path,
                outcome="keep",
                category="workflow",
                expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
                expected_count=1,
                context=context,
                cmd=learn_feedback_cmd,
            ),
            expected="learn feedback source should preserve the outcome",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-feedback.json\n",
                context=f"{context} feedback out",
                cmd=learn_feedback_out_cmd,
                expected_path=str(learning_feedback_out_path),
            ),
            expected="output write success",
            scope="package smoke",
        )

        learn_init_cmd = [
            "design-ai",
            "learn",
            "--init",
            "--yes",
            "--file",
            str(learning_profile_path),
            "--json",
        ]
        learning_init_entries = [
            {
                "id": "learn-init-preference",
                "category": "preference",
                "text": "Prefer concise, evidence-led design recommendations with one best path and explicit tradeoffs.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:00.000Z",
            },
            {
                "id": "learn-init-workflow",
                "category": "workflow",
                "text": "For implementation work, inspect repository context first, keep edits scoped, and run meaningful verification before handoff.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:01.000Z",
            },
            {
                "id": "learn-init-a11y",
                "category": "accessibility",
                "text": "For non-trivial UI, include keyboard navigation, visible focus, screen-reader behavior, and WCAG 2.1 AA contrast notes.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:02.000Z",
            },
            {
                "id": "learn-init-korean",
                "category": "korean",
                "text": "When Korean users or Korean copy are involved, use Pretendard, Korean typography line-height, dense mobile conventions, and a consistent honorific level.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:03.000Z",
            },
            {
                "id": "learn-init-brand",
                "category": "brand",
                "text": "Use restrained product UI language for internal tools and avoid decorative marketing phrasing unless explicitly requested.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:04.000Z",
            },
            {
                "id": "learn-init-constraint",
                "category": "constraint",
                "text": "Do not add external AI APIs, embeddings, telemetry, or fine-tuning behavior without explicit approval.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:05.000Z",
            },
        ]
        learning_init_payload = {
            "file": str(learning_profile_path),
            "dryRun": False,
            "applied": True,
            "source": "init:local-dogfood",
            "candidateCount": 6,
            "addedCount": 6,
            "skippedCount": 0,
            "count": 6,
            "entries": learning_init_entries,
            "skipped": [],
        }
        assert_learning_init_json(
            json.dumps(learning_init_payload),
            profile_path=learning_profile_path,
            dry_run=False,
            added_count=6,
            skipped_count=0,
            count=6,
            context=context,
            cmd=learn_init_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_init_json(
                json.dumps({
                    **learning_init_payload,
                    "source": "cli",
                }),
                profile_path=learning_profile_path,
                dry_run=False,
                added_count=6,
                skipped_count=0,
                count=6,
                context=context,
                cmd=learn_init_cmd,
            ),
            expected="learn init source changed",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_init_json(
                json.dumps({
                    **learning_init_payload,
                    "entries": [
                        {
                            **learning_init_entries[0],
                            "category": "workflow",
                        },
                        *learning_init_entries[1:],
                    ],
                }),
                profile_path=learning_profile_path,
                dry_run=False,
                added_count=6,
                skipped_count=0,
                count=6,
                context=context,
                cmd=learn_init_cmd,
            ),
            expected="learn init entry categories changed",
            scope="package smoke",
        )

        learn_import_cmd = [
            "design-ai",
            "learn",
            "--import",
            "--from-file",
            str(Path(tmp) / "import.json"),
            "--dry-run",
            "--file",
            str(learning_profile_path),
            "--json",
        ]
        learning_import_payload = {
            "file": str(learning_profile_path),
            "dryRun": True,
            "applied": False,
            "importedCount": 2,
            "addedCount": 1,
            "skippedCount": 1,
            "added": [
                {
                    "id": "learn-new",
                    "category": "korean",
                    "source": "import:cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                    "textPreview": "Prefer dense Korean mobile layouts",
                },
            ],
            "skipped": [
                {
                    "id": "learn-existing",
                    "category": "brand",
                    "source": "import:package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                    "textPreview": "Use quiet enterprise language",
                    "reason": "duplicate-entry-text",
                },
            ],
            "count": 2,
        }
        assert_learning_import_json(
            json.dumps(learning_import_payload),
            profile_path=learning_profile_path,
            dry_run=True,
            context=context,
            cmd=learn_import_cmd,
        )
        learning_import_out_path = Path(tmp) / "learning-import-out.json"
        learning_import_out_path.write_text(json.dumps(learning_import_payload), encoding="utf-8")
        learn_import_out_cmd = [
            "design-ai",
            "learn",
            "--import",
            "--from-file",
            str(Path(tmp) / "import.json"),
            "--dry-run",
            "--file",
            str(learning_profile_path),
            "--json",
            "--out",
            str(learning_import_out_path),
            "--force",
        ]
        assert_output_write_success(
            f"Wrote {learning_import_out_path}\n",
            context=f"{context} import out",
            cmd=learn_import_out_cmd,
            expected_path=str(learning_import_out_path),
        )
        assert_learning_import_json(
            learning_import_out_path.read_text(encoding="utf-8"),
            profile_path=learning_profile_path,
            dry_run=True,
            context=f"{context} import out file",
            cmd=learn_import_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_import_json(
                json.dumps({**learning_import_payload, "addedCount": 2}),
                profile_path=learning_profile_path,
                dry_run=True,
                context=context,
                cmd=learn_import_cmd,
            ),
            expected="learn import added count changed",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-import.json\n",
                context=f"{context} import out",
                cmd=learn_import_out_cmd,
                expected_path=str(learning_import_out_path),
            ),
            expected="output write success",
            scope="package smoke",
        )

        learning_backup_payload = {
            "file": str(learning_profile_path),
            "version": 1,
            "updatedAt": "2026-05-22T00:00:00.000Z",
            "exportedAt": "2026-05-22T00:01:00.000Z",
            "count": 1,
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "entries": [
                {
                    "id": "learn-existing",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
            ],
        }
        learn_backup_cmd = ["design-ai", "learn", "--backup", "--file", str(learning_profile_path), "--json"]
        assert_learning_backup_json(
            json.dumps(learning_backup_payload),
            profile_path=learning_profile_path,
            expected_count=1,
            expected_status="pass",
            context=context,
            cmd=learn_backup_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_backup_json(
                json.dumps({**learning_backup_payload, "entries": []}),
                profile_path=learning_profile_path,
                expected_count=1,
                expected_status="pass",
                context=context,
                cmd=learn_backup_cmd,
            ),
            expected="learn backup entries list changed",
            scope="package smoke",
        )

        learning_redact_payload = {
            "file": str(learning_profile_path),
            "version": 1,
            "updatedAt": "2026-05-22T00:00:01.000Z",
            "exportedAt": "2026-05-24T00:00:00.000Z",
            "redacted": True,
            "count": 2,
            "redactedCount": 1,
            "sourceAuditSummary": {
                "status": "warn",
                "failures": 0,
                "warnings": 2,
            },
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "redactions": [
                {
                    "entryId": "learn-sensitive",
                    "category": "constraint",
                    "codes": ["sensitive-secret-assignment", "sensitive-openai-secret-key"],
                    "textPreview": "Never include [REDACTED:secret-assignment] [REDACTED:openai-secret-key] in shared...",
                },
            ],
            "entries": [
                {
                    "id": "learn-sensitive",
                    "category": "constraint",
                    "text": "Never include [REDACTED:secret-assignment] [REDACTED:openai-secret-key] in shared learning profiles",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "learn-clean",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
        }
        learn_redact_cmd = ["design-ai", "learn", "--redact", "--file", str(learning_profile_path), "--json"]
        assert_learning_redact_json(
            json.dumps(learning_redact_payload),
            profile_path=learning_profile_path,
            expected_count=2,
            expected_redacted_count=1,
            context=context,
            cmd=learn_redact_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_redact_json(
                json.dumps({**learning_redact_payload, "redactedCount": 0}),
                profile_path=learning_profile_path,
                expected_count=2,
                expected_redacted_count=1,
                context=context,
                cmd=learn_redact_cmd,
            ),
            expected="learn redact redactedCount changed",
            scope="package smoke",
        )

        learning_verify_payload = {
            "source": str(Path(tmp) / "learning-backup.json"),
            "importable": True,
            "count": 1,
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "issues": [],
            "entries": [
                {
                    "id": "learn-existing",
                    "category": "brand",
                    "source": "import:package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                    "textPreview": "Use quiet enterprise language",
                },
            ],
        }
        learn_verify_cmd = ["design-ai", "learn", "--verify", "--from-file", str(Path(tmp) / "learning-backup.json"), "--json"]
        assert_learning_verify_json(
            json.dumps(learning_verify_payload),
            source=str(Path(tmp) / "learning-backup.json"),
            expected_count=1,
            expected_status="pass",
            context=context,
            cmd=learn_verify_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_verify_json(
                json.dumps({**learning_verify_payload, "importable": False}),
                source=str(Path(tmp) / "learning-backup.json"),
                expected_count=1,
                expected_status="pass",
                context=context,
                cmd=learn_verify_cmd,
            ),
            expected="learn verify importable flag changed",
            scope="package smoke",
        )
        learning_verify_out_path = Path(tmp) / "learning-verify-out.json"
        learn_verify_out_cmd = [
            "design-ai",
            "learn",
            "--verify",
            "--from-file",
            str(Path(tmp) / "learning-backup.json"),
            "--json",
            "--out",
            str(learning_verify_out_path),
            "--force",
        ]
        learning_verify_out_path.write_text(json.dumps(learning_verify_payload), encoding="utf-8")
        assert_output_write_success(
            f"Wrote {learning_verify_out_path}\n",
            context=f"{context} verify out",
            cmd=learn_verify_out_cmd,
            expected_path=str(learning_verify_out_path),
        )
        assert_learning_verify_json(
            learning_verify_out_path.read_text(encoding="utf-8"),
            source=str(Path(tmp) / "learning-backup.json"),
            expected_count=1,
            expected_status="pass",
            context=f"{context} verify out file",
            cmd=learn_verify_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-verify.json\n",
                context=f"{context} verify out",
                cmd=learn_verify_out_cmd,
                expected_path=str(learning_verify_out_path),
            ),
            expected="output write success",
            scope="package smoke",
        )

        learning_diff_path = Path(tmp) / "learning-diff.json"
        learning_diff_payload = {
            "file": str(learning_profile_path),
            "source": str(learning_diff_path),
            "generatedAt": "2026-05-22T00:01:00.000Z",
            "profileExists": True,
            "profileUpdatedAt": "2026-05-22T00:00:00.000Z",
            "comparisonUpdatedAt": "2026-05-22T00:00:03.000Z",
            "profileCount": 1,
            "comparisonCount": 3,
            "profileAuditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "comparisonAuditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "sameTextCount": 1,
            "profileOnlyCount": 0,
            "comparisonOnlyCount": 2,
            "metadataChangedCount": 1,
            "idConflictCount": 1,
            "profileOnly": [],
            "comparisonOnly": [
                {
                    "id": "learn-new",
                    "category": "korean",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:02.000Z",
                    "textPreview": "Prefer dense Korean mobile layouts",
                },
                {
                    "id": "learn-existing",
                    "category": "workflow",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:03.000Z",
                    "textPreview": "Use a release checklist before handoff",
                },
            ],
            "metadataChanged": [
                {
                    "key": "brand\nuse quiet enterprise language",
                    "changedFields": ["id", "source", "createdAt"],
                    "profile": {
                        "id": "learn-existing",
                        "category": "brand",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                        "textPreview": "Use quiet enterprise language",
                    },
                    "comparison": {
                        "id": "learn-existing-restored",
                        "category": "brand",
                        "source": "backup",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                        "textPreview": "Use quiet enterprise language",
                    },
                },
            ],
            "idConflicts": [
                {
                    "id": "learn-existing",
                    "profile": {
                        "id": "learn-existing",
                        "category": "brand",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                        "textPreview": "Use quiet enterprise language",
                    },
                    "comparison": {
                        "id": "learn-existing",
                        "category": "workflow",
                        "source": "backup",
                        "createdAt": "2026-05-22T00:00:03.000Z",
                        "textPreview": "Use a release checklist before handoff",
                    },
                },
            ],
            "recommendations": [],
            "privacy": {
                "storesRawBriefText": False,
                "exposesEntryTextPreview": True,
                "mutatesProfile": False,
            },
        }
        learn_diff_cmd = [
            "design-ai",
            "learn",
            "--diff",
            "--from-file",
            str(learning_diff_path),
            "--file",
            str(learning_profile_path),
            "--json",
        ]
        assert_learning_diff_json(
            json.dumps(learning_diff_payload),
            profile_path=learning_profile_path,
            source=str(learning_diff_path),
            context=context,
            cmd=learn_diff_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_diff_json(
                json.dumps({**learning_diff_payload, "comparisonOnlyCount": 1}),
                profile_path=learning_profile_path,
                source=str(learning_diff_path),
                context=context,
                cmd=learn_diff_cmd,
            ),
            expected="learn diff comparison-only count changed",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_diff_json(
                json.dumps({
                    **learning_diff_payload,
                    "privacy": {
                        **learning_diff_payload["privacy"],
                        "mutatesProfile": True,
                    },
                }),
                profile_path=learning_profile_path,
                source=str(learning_diff_path),
                context=context,
                cmd=learn_diff_cmd,
            ),
            expected="learn diff should report read-only privacy behavior",
            scope="package smoke",
        )

        learning_restore_path = Path(tmp) / "learning-restore.json"
        learning_restore_backup_path = Path(tmp) / "learning.restore-backup-20260522T000100000Z.json"
        learning_restore_backup_prune_path = Path(tmp) / "learning.restore-backup-20260522T000000000Z.json"
        learning_restore_payload = {
            "file": str(learning_profile_path),
            "source": str(learning_restore_path),
            "generatedAt": "2026-05-22T00:01:00.000Z",
            "dryRun": True,
            "applied": False,
            "restorable": True,
            "profileExists": True,
            "backupFile": str(learning_restore_backup_path),
            "backupCreated": False,
            "backupEntryCount": 1,
            "backupUpdatedAt": "2026-05-22T00:00:00.000Z",
            "rollbackCommand": f"design-ai learn --restore --from-file {learning_restore_backup_path} --file {learning_profile_path} --dry-run",
            "previousUpdatedAt": "2026-05-22T00:00:00.000Z",
            "restoredUpdatedAt": "2026-05-22T00:00:03.000Z",
            "previousCount": 1,
            "restoredCount": 3,
            "removedCount": 0,
            "addedCount": 2,
            "sameTextCount": 1,
            "metadataChangedCount": 1,
            "idConflictCount": 1,
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "issues": [],
            "diff": {
                "profileOnlyCount": 0,
                "comparisonOnlyCount": 2,
                "metadataChangedCount": 1,
                "idConflictCount": 1,
                "profileOnly": [],
                "comparisonOnly": learning_diff_payload["comparisonOnly"],
                "metadataChanged": learning_diff_payload["metadataChanged"],
                "idConflicts": learning_diff_payload["idConflicts"],
            },
            "privacy": {
                "storesRawBriefText": False,
                "exposesEntryTextPreview": True,
                "mutatesProfile": False,
            },
        }
        learn_restore_cmd = [
            "design-ai",
            "learn",
            "--restore",
            "--from-file",
            str(learning_restore_path),
            "--dry-run",
            "--file",
            str(learning_profile_path),
            "--json",
        ]
        assert_learning_restore_json(
            json.dumps(learning_restore_payload),
            profile_path=learning_profile_path,
            source=str(learning_restore_path),
            dry_run=True,
            context=context,
            cmd=learn_restore_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_restore_json(
                json.dumps({**learning_restore_payload, "restoredCount": 2}),
                profile_path=learning_profile_path,
                source=str(learning_restore_path),
                dry_run=True,
                context=context,
                cmd=learn_restore_cmd,
            ),
            expected="learn restore restored count changed",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_restore_json(
                json.dumps({**learning_restore_payload, "backupCreated": True}),
                profile_path=learning_profile_path,
                source=str(learning_restore_path),
                dry_run=True,
                context=context,
                cmd=learn_restore_cmd,
            ),
            expected="learn restore backup created flag changed",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_restore_json(
                json.dumps({
                    **learning_restore_payload,
                    "privacy": {
                        **learning_restore_payload["privacy"],
                        "mutatesProfile": True,
                    },
                }),
                profile_path=learning_profile_path,
                source=str(learning_restore_path),
                dry_run=True,
                context=context,
                cmd=learn_restore_cmd,
            ),
            expected="learn restore privacy mutation flag changed",
            scope="package smoke",
        )

        learning_restore_backups_payload = {
            "file": str(learning_profile_path),
            "directory": str(learning_profile_path.parent),
            "pattern": "learning.restore-backup-*.json",
            "generatedAt": "2026-05-22T00:02:00.000Z",
            "limit": 1,
            "totalCount": 1,
            "count": 1,
            "backups": [
                {
                    "file": str(learning_restore_backup_path),
                    "name": learning_restore_backup_path.name,
                    "createdAt": "2026-05-22T00:01:00.000Z",
                    "modifiedAt": "2026-05-22T00:01:00.000Z",
                    "sizeBytes": 512,
                    "updatedAt": "2026-05-22T00:00:00.000Z",
                    "entryCount": 1,
                    "auditSummary": {
                        "status": "pass",
                        "failures": 0,
                        "warnings": 0,
                    },
                    "issueCount": 0,
                    "restorePreviewCommand": f"design-ai learn --restore --from-file {learning_restore_backup_path} --file {learning_profile_path} --dry-run",
                },
            ],
            "privacy": {
                "storesRawBriefText": False,
                "exposesEntryTextPreview": False,
                "mutatesProfile": False,
            },
        }
        learn_restore_backups_cmd = [
            "design-ai",
            "learn",
            "--restore-backups",
            "--file",
            str(learning_profile_path),
            "--limit",
            "1",
            "--json",
        ]
        assert_learning_restore_backups_json(
            json.dumps(learning_restore_backups_payload),
            profile_path=learning_profile_path,
            backup_path=learning_restore_backup_path,
            context=context,
            cmd=learn_restore_backups_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_restore_backups_json(
                json.dumps({**learning_restore_backups_payload, "totalCount": 0}),
                profile_path=learning_profile_path,
                backup_path=learning_restore_backup_path,
                context=context,
                cmd=learn_restore_backups_cmd,
            ),
            expected="learn restore-backups should find rollback backups",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_restore_backups_json(
                json.dumps({
                    **learning_restore_backups_payload,
                    "privacy": {
                        **learning_restore_backups_payload["privacy"],
                        "mutatesProfile": True,
                    },
                }),
                profile_path=learning_profile_path,
                backup_path=learning_restore_backup_path,
                context=context,
                cmd=learn_restore_backups_cmd,
            ),
            expected="learn restore-backups privacy mutation flag changed",
            scope="package smoke",
        )

        learning_restore_backups_prune_payload = {
            **learning_restore_backups_payload,
            "totalCount": 2,
            "prune": {
                "dryRun": True,
                "applied": False,
                "keep": 1,
                "retainedCount": 1,
                "candidateCount": 1,
                "deletedCount": 0,
                "failureCount": 0,
                "retained": learning_restore_backups_payload["backups"],
                "candidates": [
                    {
                        **learning_restore_backups_payload["backups"][0],
                        "file": str(learning_restore_backup_prune_path),
                        "name": learning_restore_backup_prune_path.name,
                        "createdAt": "2026-05-22T00:00:00.000Z",
                        "restorePreviewCommand": f"design-ai learn --restore --from-file {learning_restore_backup_prune_path} --file {learning_profile_path} --dry-run",
                    },
                ],
                "deleted": [],
                "failures": [],
            },
            "privacy": {
                "storesRawBriefText": False,
                "exposesEntryTextPreview": False,
                "mutatesProfile": False,
                "deletesBackupFiles": False,
            },
        }
        learn_restore_backups_prune_cmd = [
            "design-ai",
            "learn",
            "--restore-backups",
            "--prune",
            "--keep",
            "1",
            "--file",
            str(learning_profile_path),
            "--json",
        ]
        assert_learning_restore_backups_prune_json(
            json.dumps(learning_restore_backups_prune_payload),
            profile_path=learning_profile_path,
            deleted_path=learning_restore_backup_prune_path,
            dry_run=True,
            context=context,
            cmd=learn_restore_backups_prune_cmd,
        )
        assert_learning_restore_backups_prune_json(
            json.dumps({
                **learning_restore_backups_prune_payload,
                "prune": {
                    **learning_restore_backups_prune_payload["prune"],
                    "dryRun": False,
                    "applied": True,
                    "deletedCount": 1,
                    "deleted": learning_restore_backups_prune_payload["prune"]["candidates"],
                },
                "privacy": {
                    **learning_restore_backups_prune_payload["privacy"],
                    "deletesBackupFiles": True,
                },
            }),
            profile_path=learning_profile_path,
            deleted_path=learning_restore_backup_prune_path,
            dry_run=False,
            context=context,
            cmd=[*learn_restore_backups_prune_cmd[:-1], "--yes", "--json"],
        )
        expect_self_test_failure(
            lambda: assert_learning_restore_backups_prune_json(
                json.dumps({
                    **learning_restore_backups_prune_payload,
                    "prune": {
                        **learning_restore_backups_prune_payload["prune"],
                        "candidateCount": 0,
                    },
                }),
                profile_path=learning_profile_path,
                deleted_path=learning_restore_backup_prune_path,
                dry_run=True,
                context=context,
                cmd=learn_restore_backups_prune_cmd,
            ),
            expected="learn restore-backups prune candidate count changed",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_restore_backups_prune_json(
                json.dumps({
                    **learning_restore_backups_prune_payload,
                    "privacy": {
                        **learning_restore_backups_prune_payload["privacy"],
                        "deletesBackupFiles": True,
                    },
                }),
                profile_path=learning_profile_path,
                deleted_path=learning_restore_backup_prune_path,
                dry_run=True,
                context=context,
                cmd=learn_restore_backups_prune_cmd,
            ),
            expected="learn restore-backups prune privacy flags changed",
            scope="package smoke",
        )

        learning_stats_payload = {
            "file": str(learning_profile_path),
            "exists": True,
            "version": 1,
            "updatedAt": "2026-05-22T00:00:03.000Z",
            "count": 3,
            "categoryCounts": {
                "brand": 1,
                "accessibility": 1,
                "korean": 1,
            },
            "sourceCounts": {
                "package-smoke": 1,
                "feedback:keep": 1,
                "import:cli": 1,
            },
            "oldestEntry": {
                "id": "learn-brand",
                "category": "brand",
                "source": "package-smoke",
                "createdAt": "2026-05-22T00:00:00.000Z",
                "textPreview": "Use quiet enterprise brand language",
            },
            "latestEntry": {
                "id": "learn-korean",
                "category": "korean",
                "source": "import:cli",
                "createdAt": "2026-05-22T00:00:03.000Z",
                "textPreview": "Prefer dense Korean mobile layouts with compact controls",
            },
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
        }
        learn_stats_cmd = ["design-ai", "learn", "--stats", "--file", str(learning_profile_path), "--json"]
        assert_learning_stats_json(
            json.dumps(learning_stats_payload),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_stats_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_stats_json(
                json.dumps({
                    **learning_stats_payload,
                    "sourceCounts": {
                        "package-smoke": 3,
                    },
                }),
                profile_path=learning_profile_path,
                context=context,
                cmd=learn_stats_cmd,
            ),
            expected="learn stats source distribution changed",
            scope="package smoke",
        )
        learning_stats_out_path = Path(tmp) / "learning-stats-out.json"
        learning_stats_out_path.write_text(json.dumps(learning_stats_payload), encoding="utf-8")
        learn_stats_out_cmd = [
            "design-ai",
            "learn",
            "--stats",
            "--file",
            str(learning_profile_path),
            "--json",
            "--out",
            str(learning_stats_out_path),
            "--force",
        ]
        assert_output_write_success(
            f"Wrote {learning_stats_out_path}\n",
            context=f"{context} stats out",
            cmd=learn_stats_out_cmd,
            expected_path=str(learning_stats_out_path),
        )
        assert_learning_stats_json(
            learning_stats_out_path.read_text(encoding="utf-8"),
            profile_path=learning_profile_path,
            context=f"{context} stats out file",
            cmd=learn_stats_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-stats.json\n",
                context=f"{context} stats out",
                cmd=learn_stats_out_cmd,
                expected_path=str(learning_stats_out_path),
            ),
            expected="output write success",
            scope="package smoke",
        )
        learn_stats_human_cmd = ["design-ai", "learn", "--stats", "--file", str(learning_profile_path)]
        assert_learning_stats_human(
            "\n".join([
                "design-ai learn",
                "Local learning profile stats",
                f"File: {learning_profile_path}",
                "Exists: yes",
                "Entries: 3",
                "Updated: 2026-05-22T00:00:03.000Z",
                "Audit: pass (0 failure(s), 0 warning(s))",
                "Categories: brand 1, accessibility 1, korean 1",
                "Sources: package-smoke 1, feedback:keep 1, import:cli 1",
                "",
                "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
                "        learn-korean · 2026-05-22T00:00:03.000Z",
                "Oldest: [brand] Use quiet enterprise brand language",
                "        learn-brand · 2026-05-22T00:00:00.000Z",
            ]),
            context=context,
            cmd=learn_stats_human_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_stats_human(
                "\n".join([
                    "design-ai learn",
                    "Local learning profile stats",
                    f"File: {learning_profile_path}",
                    "Exists: yes",
                    "Entries: 3",
                    "Updated: 2026-05-22T00:00:03.000Z",
                    "Audit: pass (0 failure(s), 0 warning(s))",
                    "Categories: brand 1, accessibility 1, korean 1",
                    "",
                    "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
                    "        learn-korean · 2026-05-22T00:00:03.000Z",
                    "Oldest: [brand] Use quiet enterprise brand language",
                    "        learn-brand · 2026-05-22T00:00:00.000Z",
                ]),
                context=context,
                cmd=learn_stats_human_cmd,
            ),
            expected="learn stats human output missing 'Sources: package-smoke 1, feedback:keep 1, import:cli 1'",
            scope="package smoke",
        )

        learning_query_payload = {
            "file": str(learning_profile_path),
            "version": 1,
            "updatedAt": "2026-05-22T00:00:02.000Z",
            "category": "",
            "query": "keyboard accessibility",
            "limit": 2,
            "entries": [
                {
                    "id": "learn-relevant",
                    "category": "accessibility",
                    "text": "Prioritize keyboard accessibility details for Button component API specs",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
            "count": 1,
            "totalCount": 3,
            "selection": {
                "mode": "brief-relevance",
                "query": "keyboard accessibility",
                "candidateCount": 3,
                "matchedCount": 1,
                "queryTokenCount": 2,
                "fallbackEnabled": False,
                "selectedCount": 1,
                "fallbackCount": 0,
                "selected": [
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "score": 4,
                        "matchedTokens": ["keyboard", "accessibility"],
                        "reason": "brief-match",
                    },
                ],
            },
        }
        learn_query_cmd = [
            "design-ai",
            "learn",
            "--list",
            "--query",
            "keyboard accessibility",
            "--explain",
            "--limit",
            "2",
            "--json",
        ]
        assert_learning_query_json(
            json.dumps(learning_query_payload),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_query_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_query_json(
                json.dumps({
                    **learning_query_payload,
                    "selection": {
                        **learning_query_payload["selection"],
                        "selected": [
                            {
                                **learning_query_payload["selection"]["selected"][0],
                                "matchedTokens": ["keyboard"],
                            },
                        ],
                    },
                }),
                profile_path=learning_profile_path,
                context=context,
                cmd=learn_query_cmd,
            ),
            expected="learn query explain should include matched query tokens",
            scope="package smoke",
        )
        learn_query_human_cmd = [
            "design-ai",
            "learn",
            "--list",
            "--query",
            "keyboard accessibility",
            "--explain",
            "--limit",
            "2",
        ]
        assert_learning_query_human(
            "\n".join([
                "design-ai learn",
                "Local learning profile",
                f"File: {learning_profile_path}",
                "Entries: 1/3",
                "Query: keyboard accessibility",
                "Limit: 2",
                "Explain: selection score, matched tokens, and reason",
                "",
                "1. [accessibility] Prioritize keyboard accessibility details for Button component API specs",
                "   learn-relevant · 2026-05-22T00:00:01.000Z",
                "   score 4 · matched keyboard, accessibility · reason brief-match",
            ]),
            context=context,
            cmd=learn_query_human_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_query_human(
                "\n".join([
                    "Local learning profile",
                    "Entries: 1/3",
                    "Query: keyboard accessibility",
                    "Limit: 2",
                    "Explain: selection score, matched tokens, and reason",
                    "[accessibility] Prioritize keyboard accessibility details for Button component API specs",
                    "matched keyboard, accessibility",
                ]),
                context=context,
                cmd=learn_query_human_cmd,
            ),
            expected="learn query human output missing 'reason brief-match'",
            scope="package smoke",
        )

        learning_query_export_payload = {
            "file": str(learning_profile_path),
            "category": "",
            "limit": 2,
            "query": "keyboard accessibility",
            "selection": {
                "mode": "brief-relevance",
                "query": "keyboard accessibility",
                "candidateCount": 3,
                "matchedCount": 1,
                "queryTokenCount": 2,
                "fallbackEnabled": False,
                "selectedCount": 1,
                "fallbackCount": 0,
                "selected": [
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "score": 4,
                        "matchedTokens": ["keyboard", "accessibility"],
                        "reason": "brief-match",
                    },
                ],
            },
            "entries": learning_query_payload["entries"],
            "empty": False,
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "markdown": "Learning selection: brief relevance (1/3 matched; no recency fallback).\nPrioritize keyboard accessibility details",
        }
        learn_query_export_cmd = [
            "design-ai",
            "learn",
            "--export",
            "--query",
            "keyboard accessibility",
            "--limit",
            "2",
            "--json",
        ]
        assert_learning_query_export_json(
            json.dumps(learning_query_export_payload),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_query_export_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_query_export_json(
                json.dumps({
                    **learning_query_export_payload,
                    "selection": {
                        **learning_query_export_payload["selection"],
                        "fallbackEnabled": True,
                    },
                }),
                profile_path=learning_profile_path,
                context=context,
                cmd=learn_query_export_cmd,
            ),
            expected="learn query export should not use recency fallback",
            scope="package smoke",
        )

        learning_relevance_payload = {
            "learningContext": {
                "selection": {
                    "mode": "brief-relevance",
                    "query": EXPECTED_ROUTE_BRIEF,
                    "candidateCount": 3,
                    "matchedCount": 1,
                    "selectedCount": 1,
                    "fallbackCount": 0,
                    "selected": [
                        {
                            "id": "learn-relevant",
                            "category": "accessibility",
                            "score": 10,
                            "matchedTokens": ["button", "accessibility"],
                            "reason": "brief-match",
                        },
                    ],
                },
                "entries": [
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "text": "Prioritize keyboard accessibility details for Button component API specs",
                    },
                ],
            },
            "prompt": (
                "Learning selection: brief relevance\n"
                "Prioritize keyboard accessibility details for Button component API specs"
            ),
            "learningUsage": {
                "recorded": True,
                "event": {
                    "id": "learn-use-prompt",
                    "command": "prompt",
                    "routeId": EXPECTED_ROUTE_ID,
                    "profileFile": str(learning_profile_path),
                    "briefHash": "0123456789abcdef",
                    "selectedEntryIds": ["learn-relevant"],
                    "selectedCount": 1,
                    "candidateCount": 3,
                    "matchedCount": 1,
                    "fallbackCount": 0,
                    "queryTokenCount": 6,
                    "auditStatus": "pass",
                    "createdAt": "2026-06-01T00:00:00.000Z",
                },
            },
        }
        learning_relevance_cmd = ["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--with-learning", "--json"]
        assert_learning_relevance_context(
            learning_relevance_payload,
            context=context,
            cmd=learning_relevance_cmd,
        )
        assert_learning_usage_payload(
            learning_relevance_payload,
            expected_command="prompt",
            context=context,
            cmd=learning_relevance_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_relevance_context(
                {
                    **learning_relevance_payload,
                    "learningContext": {
                        **learning_relevance_payload["learningContext"],
                        "entries": [
                            {
                                "id": "learn-unrelated-newer",
                                "category": "korean",
                                "text": "Prefer dense Korean mobile checkout layout",
                            },
                        ],
                    },
                },
                context=context,
                cmd=learning_relevance_cmd,
            ),
            expected="brief relevance should pick the Button accessibility entry",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_usage_payload(
                {
                    **learning_relevance_payload,
                    "learningUsage": {
                        **learning_relevance_payload["learningUsage"],
                        "event": {
                            **learning_relevance_payload["learningUsage"]["event"],
                            "brief": EXPECTED_ROUTE_BRIEF,
                            "briefHash": "",
                        },
                    },
                },
                expected_command="prompt",
                context=context,
                cmd=learning_relevance_cmd,
            ),
            expected="learningUsage event should store a short brief hash",
            scope="package smoke",
        )

        learning_usage_path = Path(tmp) / "learning.usage.json"
        learning_usage_path.write_text(
            json.dumps({
                "version": 1,
                "updatedAt": "2026-06-01T00:00:01.000Z",
                "profileFile": str(learning_profile_path),
                "events": [
                    {
                        **learning_relevance_payload["learningUsage"]["event"],
                        "id": "learn-use-prompt",
                        "command": "prompt",
                    },
                    {
                        **learning_relevance_payload["learningUsage"]["event"],
                        "id": "learn-use-pack",
                        "command": "pack",
                        "createdAt": "2026-06-01T00:00:01.000Z",
                    },
                ],
            }),
            encoding="utf-8",
        )
        assert_learning_usage_sidecar(
            learning_usage_path,
            expected_commands=["prompt", "pack"],
            context=context,
            cmd=learning_relevance_cmd,
        )
        learning_usage_report_payload = {
            "file": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "exists": True,
            "profileExists": True,
            "profileFile": str(learning_profile_path),
            "version": 1,
            "updatedAt": "2026-06-01T00:00:01.000Z",
            "eventCount": 2,
            "profileEntryCount": 3,
            "usedEntryCount": 1,
            "unusedEntryCount": 2,
            "staleSelectedEntryCount": 0,
            "commandCounts": {
                "prompt": 1,
                "pack": 1,
            },
            "routeCounts": {
                EXPECTED_ROUTE_ID: 2,
            },
            "categoryCounts": {
                "all": 2,
            },
            "auditStatusCounts": {
                "pass": 2,
            },
            "selectedEntryCounts": {
                "learn-relevant": 2,
            },
            "topSelectedEntries": [
                {
                    "id": "learn-relevant",
                    "category": "accessibility",
                    "source": "package-smoke",
                    "textPreview": "Prioritize keyboard accessibility details for Button component API specs",
                    "usageCount": 2,
                    "latestUsedAt": "2026-06-01T00:00:01.000Z",
                    "commands": {
                        "prompt": 1,
                        "pack": 1,
                    },
                    "routes": {
                        EXPECTED_ROUTE_ID: 2,
                    },
                },
            ],
            "unusedEntryIds": ["learn-unrelated-newer", "learn-brand"],
            "staleSelectedEntryIds": [],
            "oldestEvent": {
                **learning_relevance_payload["learningUsage"]["event"],
                "id": "learn-use-prompt",
                "command": "prompt",
            },
            "latestEvent": {
                **learning_relevance_payload["learningUsage"]["event"],
                "id": "learn-use-pack",
                "command": "pack",
                "createdAt": "2026-06-01T00:00:01.000Z",
            },
            "recentEvents": [
                {
                    **learning_relevance_payload["learningUsage"]["event"],
                    "id": "learn-use-pack",
                    "command": "pack",
                    "createdAt": "2026-06-01T00:00:01.000Z",
                },
            ],
            "recommendations": [],
            "privacy": {
                "storesRawBriefText": False,
                "storesBriefHash": True,
                "storesSelectedEntryIds": True,
            },
        }
        learn_usage_cmd = ["design-ai", "learn", "--usage", "--file", str(learning_profile_path), "--usage-file", str(learning_usage_path), "--json"]
        assert_learning_usage_report_json(
            json.dumps(learning_usage_report_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_usage_cmd,
        )
        assert_learning_usage_report_human(
            "\n".join([
                "design-ai learn",
                "Local learning usage report",
                f"Usage sidecar: {learning_usage_path}",
                "Events: 2",
                "Top selected entries:",
                "Recent events:",
                "Privacy: usage events store selected entry ids and a short brief hash",
            ]),
            context=context,
            cmd=learn_usage_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_usage_report_json(
                json.dumps({
                    **learning_usage_report_payload,
                    "latestEvent": {
                        **learning_usage_report_payload["latestEvent"],
                        "brief": EXPECTED_ROUTE_BRIEF,
                        "briefHash": "",
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_usage_cmd,
            ),
            expected="learn usage report should keep event details privacy-preserving",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_usage_sidecar(
                learning_usage_path.with_name("missing-usage.json"),
                expected_commands=["prompt", "pack"],
                context=context,
                cmd=learning_relevance_cmd,
            ),
            expected="learning usage sidecar file should be written",
            scope="package smoke",
        )

        learn_signals_cmd = [
            "design-ai",
            "learn",
            "--signals",
            "--file",
            str(learning_profile_path),
            "--usage-file",
            str(learning_usage_path),
            "--from-file",
            str(Path(tmp)),
            "--json",
        ]
        learning_signal_payload = {
            "version": 1,
            "generatedAt": "2026-06-02T00:00:00.000Z",
            "status": "pass",
            "file": str(learning_profile_path),
            "signalSource": str(Path(tmp)),
            "learning": {
                "exists": True,
                "version": 1,
                "updatedAt": "2026-06-01T00:00:00.000Z",
                "count": 3,
                "categoryCounts": {"workflow": 2, "brand": 1},
                "sourceCounts": {"feedback:keep": 2, "check:artifact": 1},
                "auditSummary": {"status": "pass", "failures": 0, "warnings": 0},
            },
            "usage": {
                "usageFile": str(learning_usage_path),
                "exists": True,
                "eventCount": 2,
                "usedEntryCount": 2,
                "unusedEntryCount": 1,
                "staleSelectedEntryCount": 0,
                "commandCounts": {"prompt": 1, "pack": 1},
                "routeCounts": {EXPECTED_ROUTE_ID: 2},
                "latestEvent": learning_usage_report_payload["latestEvent"],
                "privacy": learning_usage_report_payload["privacy"],
            },
            "evals": {
                "source": str(Path(tmp)),
                "count": 1,
                "reports": 1,
                "templates": 0,
                "failed": 0,
                "warned": 0,
                "passed": 1,
                "files": [
                    {
                        "file": str(Path(tmp) / "route-eval-report.json"),
                        "exists": True,
                        "kind": "route-eval",
                        "shape": "report",
                        "status": "pass",
                        "caseCount": 1,
                        "passed": 1,
                        "warned": 0,
                        "failed": 0,
                        "generatedAt": "2026-06-02T00:00:00.000Z",
                        "error": "",
                    },
                ],
            },
            "checkCapture": {
                "count": 1,
                "categoryCounts": {"workflow": 1},
                "sourceCounts": {"check:artifact": 1},
                "latestEntries": [
                    {
                        "id": "learn-check",
                        "category": "workflow",
                        "source": "check:artifact",
                        "createdAt": "2026-06-01T00:00:00.000Z",
                        "textPreview": "Improve future outputs by addressing responsive QA.",
                    },
                ],
            },
            "workspace": {
                "root": str(Path(tmp)),
                "version": "4.55.0",
                "git": {"isRepo": True, "branch": "main", "clean": True, "ahead": 0, "behind": 0},
                "repository": {"status": "pass", "canonical": True},
                "learning": {"status": "pass", "reason": ""},
                "learningUsage": {"status": "pass", "reason": ""},
                "learningEval": {"status": "pass", "reason": ""},
                "nextActionCounts": {},
                "nextActionCount": 0,
            },
            "readiness": {
                "version": 1,
                "status": "pass",
                "summary": "Required and optional local learning signal surfaces are complete.",
                "requiredPassCount": 4,
                "requiredCount": 4,
                "requiredReady": True,
                "blockingCount": 0,
                "optionalGapCount": 0,
                "blockingChecks": [],
                "optionalGaps": [],
                "optionalGapDetails": [],
                "requiredCheckIds": ["learning-profile", "eval-signals", "workspace-readiness", "agent-development"],
                "optionalCheckIds": ["usage-sidecar", "check-capture"],
                "checkStatusById": {
                    "learning-profile": "pass",
                    "usage-sidecar": "pass",
                    "eval-signals": "pass",
                    "check-capture": "pass",
                    "workspace-readiness": "pass",
                    "agent-development": "pass",
                },
                "checkRequiredById": {
                    "learning-profile": True,
                    "usage-sidecar": False,
                    "eval-signals": True,
                    "check-capture": False,
                    "workspace-readiness": True,
                    "agent-development": True,
                },
                "checkCountByStatus": {
                    "pass": 6,
                    "info": 0,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "requiredCheckCountByStatus": {
                    "pass": 4,
                    "info": 0,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "optionalCheckCountByStatus": {
                    "pass": 2,
                    "info": 0,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "checks": [
                    {"id": "learning-profile", "label": "Learning profile", "status": "pass", "required": True, "summary": "Profile is ready."},
                    {"id": "usage-sidecar", "label": "Usage sidecar", "status": "pass", "required": False, "summary": "Usage is ready."},
                    {"id": "eval-signals", "label": "Eval signals", "status": "pass", "required": True, "summary": "Eval is ready."},
                    {"id": "check-capture", "label": "Check learning capture", "status": "pass", "required": False, "summary": "Check capture is ready."},
                    {"id": "workspace-readiness", "label": "Workspace readiness", "status": "pass", "required": True, "summary": "Workspace is ready."},
                    {"id": "agent-development", "label": "Agent development backlog", "status": "pass", "required": True, "summary": "Agent backlog is ready."},
                ],
            },
            "agentDevelopment": {
                "status": "pass",
                "actionCount": 1,
                "p0Count": 0,
                "p1Count": 0,
                "p2Count": 1,
                "p3Count": 0,
                "actions": [
                    {
                        "rank": 1,
                        "id": "agent-skill-proposal-preview",
                        "priority": "p2",
                        "category": "skill-evolution",
                        "title": "Preview skill instruction deltas from repeated check-capture signals.",
                        "rationale": "Captured warn/fail check results can become deterministic skill improvements without mutating skill files automatically.",
                        "command": "design-ai learn --propose-skills --json",
                        "evidence": {"checkCaptureCount": 1},
                    },
                ],
                "privacy": {
                    "mutatesProfile": False,
                    "mutatesSkillFiles": False,
                    "callsExternalAiApis": False,
                    "storesRawBriefText": False,
                },
            },
            "recommendations": [],
            "privacy": {
                "mutatesProfile": False,
                "storesRawBriefText": False,
                "exposesEntryTextPreview": True,
                "readsSignalFilesOnly": True,
            },
        }
        assert_learning_signal_report_json(
            json.dumps(learning_signal_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_signals_cmd,
        )
        assert_learning_signal_report_human(
            "\n".join([
                "design-ai learn",
                "Learning signal registry",
                f"Signal source: {Path(tmp)}",
                "Learning audit: pass",
                "Eval signals:",
                "Workspace readiness:",
                "Agent development backlog:",
                "Privacy: signal registry is read-only",
            ]),
            context=context,
            cmd=learn_signals_cmd,
        )
        assert_learning_signal_report_markdown(
            "\n".join([
                "# Learning Signal Registry Report",
                "",
                f"- Learning file: {learning_profile_path}",
                f"- Usage file: {learning_usage_path}",
                "## Readiness Summary",
                "- Required ready: yes",
                "- Required checks: 4/4",
                "- Blocking checks: 0",
                "- Optional gaps: 0",
                "Readiness check index:",
                "- Required ids: learning-profile, eval-signals, workspace-readiness, agent-development",
                "- Optional ids: usage-sidecar, check-capture",
                "- Status index: learning-profile=pass, usage-sidecar=pass, eval-signals=pass, check-capture=pass, workspace-readiness=pass, agent-development=pass",
                "- Required index: learning-profile=yes, usage-sidecar=no, eval-signals=yes, check-capture=no, workspace-readiness=yes, agent-development=yes",
                "- Status counts: pass=6, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                "- Required status counts: pass=4, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                "- Optional status counts: pass=2, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                "## Learning Profile",
                "## Usage Signals",
                "## Eval Signals",
                "## Check Capture",
                "## Workspace Readiness",
                "## Agent Development Backlog",
                "```bash",
                "design-ai learn --propose-skills --json",
                "```",
                "## Privacy And Boundaries",
                "- Mutates learning profile: no",
                "- Stores raw brief text: no",
                "This report is read-only evidence; it does not mutate learning profiles, usage sidecars, eval files, skill files, or target repositories.",
            ]),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=[*learn_signals_cmd[:-1], "--report"],
        )
        expect_self_test_failure(
            lambda: assert_learning_signal_report_markdown(
                "\n".join([
                    "# Learning Signal Registry Report",
                    "",
                    f"- Learning file: {learning_profile_path}",
                    f"- Usage file: {learning_usage_path}",
                    "## Readiness Summary",
                    "- Required ready: yes",
                    "- Required checks: 4/4",
                    "- Blocking checks: 0",
                    "- Optional gaps: 0",
                    "Readiness checks:",
                    "## Learning Profile",
                    "## Usage Signals",
                    "## Eval Signals",
                    "## Check Capture",
                    "## Workspace Readiness",
                    "## Agent Development Backlog",
                    "```bash",
                    "design-ai learn --propose-skills --json",
                    "```",
                    "## Privacy And Boundaries",
                    "- Mutates learning profile: no",
                    "- Stores raw brief text: no",
                    "This report is read-only evidence; it does not mutate learning profiles, usage sidecars, eval files, skill files, or target repositories.",
                ]),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=[*learn_signals_cmd[:-1], "--report"],
            ),
            expected="learn signals Markdown report missing 'Readiness check index:'",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_signal_report_json(
                json.dumps({
                    **learning_signal_payload,
                    "evals": {
                        **learning_signal_payload["evals"],
                        "files": [],
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_signals_cmd,
            ),
            expected="learn signals JSON should include route eval signal files",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_signal_report_json(
                json.dumps({
                    **learning_signal_payload,
                    "agentDevelopment": {
                        **learning_signal_payload["agentDevelopment"],
                        "status": "warn",
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_signals_cmd,
                require_agent_status_pass=True,
            ),
            expected="learn signals JSON should include passing agent development backlog actions",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_signal_report_json(
                json.dumps({
                    **learning_signal_payload,
                    "agentDevelopment": {
                        **learning_signal_payload["agentDevelopment"],
                        "privacy": {
                            **learning_signal_payload["agentDevelopment"]["privacy"],
                            "callsExternalAiApis": True,
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_signals_cmd,
            ),
            expected="learn signals JSON should keep agent development backlog local and preview-only",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_signal_report_human(
                "\n".join([
                    "design-ai learn",
                    "Learning signal registry",
                    "Signal source:",
                    "Learning audit:",
                    "Eval signals:",
                    "Privacy: signal registry is read-only",
                ]),
                context=context,
                cmd=learn_signals_cmd,
            ),
            expected="learn signals human output missing 'Workspace readiness:'",
            scope="package smoke",
        )

        learn_agent_backlog_cmd = [
            "design-ai",
            "learn",
            "--agent-backlog",
            "--file",
            str(learning_profile_path),
            "--usage-file",
            str(learning_usage_path),
            "--from-file",
            str(Path(tmp)),
            "--json",
        ]
        agent_backlog_refresh_args = [
            "design-ai",
            "learn",
            "--agent-backlog",
            "--from-file",
            str(Path(tmp)),
            "--file",
            str(learning_profile_path),
            "--usage-file",
            str(learning_usage_path),
            "--strict",
            "--json",
        ]
        agent_backlog_refresh_command = " ".join(agent_backlog_refresh_args)
        learning_agent_backlog_payload = {
            "version": 1,
            "generatedAt": "2026-06-02T00:00:05.000Z",
            "status": "pass",
            "signalStatus": "pass",
            "file": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "signalSource": str(Path(tmp)),
            "counts": {
                "actions": 1,
                "p0": 0,
                "p1": 0,
                "p2": 1,
                "p3": 0,
                "learningEntries": 3,
                "usageEvents": 2,
                "evalSignals": 1,
                "checkCaptures": 1,
                "workspaceNextActions": 0,
            },
            "actions": [
                {
                    "rank": 1,
                    "id": "agent-skill-proposal-preview",
                    "priority": "p2",
                    "category": "skill-evolution",
                    "title": "Preview skill instruction deltas from repeated check-capture signals.",
                    "rationale": "Captured warn/fail check results can become deterministic skill improvements without mutating skill files automatically.",
                    "command": "design-ai learn --propose-skills --json",
                    "evidence": {"checkCaptureCount": 1},
                },
            ],
            "actionPlan": {
                "version": 1,
                "stepCount": 1,
                "nextStep": {
                    "rank": 1,
                    "actionId": "agent-skill-proposal-preview",
                    "priority": "p2",
                    "category": "skill-evolution",
                    "title": "Preview skill instruction deltas from repeated check-capture signals.",
                    "command": "design-ai learn --propose-skills --json",
                    "expectedOutcome": "Captured warn/fail check results can become deterministic skill improvements without mutating skill files automatically.",
                    "verification": [
                        "Run the command and inspect the preview/report output before applying any follow-up changes.",
                        "Re-run `design-ai learn --agent-backlog --strict --json` after the step to confirm the backlog status improved.",
                    ],
                    "requiresReviewBeforeMutation": False,
                    "commandSafety": {
                        "level": "read-only",
                        "writesLocalFiles": False,
                        "mutatesLocalState": False,
                        "requiresCleanWorkspace": False,
                        "detectedFlags": [],
                        "reason": "Command is preview/report oriented and has no detected mutation flags.",
                    },
                },
                "steps": [
                    {
                        "rank": 1,
                        "actionId": "agent-skill-proposal-preview",
                        "priority": "p2",
                        "category": "skill-evolution",
                        "title": "Preview skill instruction deltas from repeated check-capture signals.",
                        "command": "design-ai learn --propose-skills --json",
                        "expectedOutcome": "Captured warn/fail check results can become deterministic skill improvements without mutating skill files automatically.",
                        "verification": [
                            "Run the command and inspect the preview/report output before applying any follow-up changes.",
                            "Re-run `design-ai learn --agent-backlog --strict --json` after the step to confirm the backlog status improved.",
                        ],
                        "requiresReviewBeforeMutation": False,
                        "commandSafety": {
                            "level": "read-only",
                            "writesLocalFiles": False,
                            "mutatesLocalState": False,
                            "requiresCleanWorkspace": False,
                            "detectedFlags": [],
                            "outputTargets": [],
                            "profileTargets": [],
                            "usageTargets": [],
                            "mutationFlags": [],
                            "reason": "Command is preview/report oriented and has no detected mutation flags.",
                        },
                    },
                ],
                "safetySummary": {
                    "total": 1,
                    "readOnly": 1,
                    "writesLocalFile": 0,
                    "mutatesLocalState": 0,
                    "requiresCleanWorkspace": 0,
                    "requiresReviewBeforeMutation": 0,
                },
                "executionQueue": {
                    "orderedCount": 1,
                    "commandManifestCount": 1,
                    "previewCount": 1,
                    "fileWriteReviewCount": 0,
                    "mutationReviewCount": 0,
                    "nextActionId": "agent-skill-proposal-preview",
                    "nextCommand": "design-ai learn --propose-skills --json",
                    "nextCommandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                    "nextCommandRunPolicy": "preview-only",
                    "nextCommandSelection": {
                        "strategy": "first-command-in-safety-ordered-queue",
                        "safetyOrder": ["read-only", "writes-local-file", "mutates-local-state"],
                        "actionId": "agent-skill-proposal-preview",
                        "rank": 1,
                        "safetyLevel": "read-only",
                        "runPolicy": "preview-only",
                        "planNextActionId": "agent-skill-proposal-preview",
                        "planNextActionRank": 1,
                        "matchesPlanNextAction": True,
                        "reason": "Selected the ranked next action because it is first in the safety-ordered queue.",
                    },
                    "nextCommandAlignment": {
                        "strategy": "compare-operator-runbook-next-command-to-execution-queue-next-command",
                        "operatorStage": "execute",
                        "operatorActionId": "agent-skill-proposal-preview",
                        "operatorCommand": "design-ai learn --propose-skills --json",
                        "operatorCommandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                        "queueActionId": "agent-skill-proposal-preview",
                        "queueCommand": "design-ai learn --propose-skills --json",
                        "queueCommandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                        "rankedNextActionId": "agent-skill-proposal-preview",
                        "matchesQueueNextCommand": True,
                        "matchesQueueNextAction": True,
                        "operatorRunsBeforeQueueCommand": False,
                        "queueMatchesRankedNextAction": True,
                        "reason": "Operator runbook starts with the same command as the safety-ordered execution queue.",
                    },
                    "operatorHandoff": {
                        "version": 1,
                        "decision": "run-shared-command",
                        "state": {
                            "version": 1,
                            "status": "ready",
                            "ready": True,
                            "hasCommand": True,
                            "complete": False,
                            "canRunWithoutReview": True,
                            "requiresGate": False,
                            "requiresRefresh": True,
                            "summary": "The handoff command can be presented or run, then refreshed with the focused backlog check.",
                        },
                        "source": "operator-runbook",
                        "phase": "execute",
                        "label": "Run agent-skill-proposal-preview",
                        "command": "design-ai learn --propose-skills --json",
                        "commandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                        "actionId": "agent-skill-proposal-preview",
                        "rank": 1,
                        "runPolicy": "preview-only",
                        "required": True,
                        "isGate": False,
                        "nextQueueActionId": "agent-skill-proposal-preview",
                        "nextQueueCommand": "design-ai learn --propose-skills --json",
                        "nextQueueCommandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                        "nextQueueCommandRequiresGate": False,
                        "operatorGateAppliesToNextQueueAction": False,
                        "nextQueueActionBlockedByGate": False,
                        "refreshCommand": agent_backlog_refresh_command,
                        "refreshCommandArgs": agent_backlog_refresh_args,
                        "refreshCommandLabel": "Refresh focused agent backlog after review",
                        "refreshCommandRequired": True,
                        "reviewLevel": "clear",
                        "requiresOperatorReview": False,
                        "reason": "Run the shared operator and queue command next.",
                    },
                    "commandEffectSummary": {
                        "totalCommands": 1,
                        "writesLocalFileCount": 0,
                        "mutatesLocalStateCount": 0,
                        "requiresCleanWorkspaceCount": 0,
                        "outputTargetCount": 0,
                        "profileTargetCount": 0,
                        "usageTargetCount": 0,
                        "mutationFlagCount": 0,
                        "outputTargets": [],
                        "profileTargets": [],
                        "usageTargets": [],
                        "mutationFlags": [],
                    },
                    "commandEffectReview": {
                        "level": "clear",
                        "requiresOperatorReview": False,
                        "headline": "No command target or mutation flag exposure detected.",
                        "checklist": [
                            "No command target or mutation flag exposure detected.",
                        ],
                        "gatePhaseSummary": {
                            "count": 1,
                            "requiredCount": 1,
                            "optionalCount": 0,
                            "phases": ["refresh"],
                            "hasBefore": False,
                            "hasAfter": False,
                            "hasRefresh": True,
                        },
                        "gateRunbook": {
                            "before": [],
                            "after": [],
                            "refresh": [
                                {
                                    "phase": "refresh",
                                    "label": "Refresh focused agent backlog after review",
                                    "command": agent_backlog_refresh_command,
                                    "commandArgs": agent_backlog_refresh_args,
                                    "required": True,
                                },
                            ],
                            "other": [],
                        },
                        "gateCommands": [
                            {
                                "phase": "refresh",
                                "label": "Refresh focused agent backlog after review",
                                "command": agent_backlog_refresh_command,
                                "commandArgs": agent_backlog_refresh_args,
                                "required": True,
                            },
                        ],
                    },
                    "operatorRunbook": {
                        "version": 1,
                        "stageCount": 4,
                        "commandCount": 2,
                        "requiredCommandCount": 2,
                        "reviewLevel": "clear",
                        "requiresOperatorReview": False,
                        "phases": ["before", "execute", "after", "refresh"],
                        "nextStage": "execute",
                        "nextCommandLabel": "Run agent-skill-proposal-preview",
                        "nextCommand": "design-ai learn --propose-skills --json",
                        "nextCommandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                        "nextCommandRequired": True,
                        "nextCommandRunPolicy": "preview-only",
                        "nextCommandSelection": {
                            "strategy": "first-command-in-operator-runbook-stage-order",
                            "stageOrder": ["before", "execute", "after", "refresh"],
                            "stage": "execute",
                            "label": "Run agent-skill-proposal-preview",
                            "command": "design-ai learn --propose-skills --json",
                            "commandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                            "actionId": "agent-skill-proposal-preview",
                            "rank": 1,
                            "required": True,
                            "runPolicy": "preview-only",
                            "reason": "Selected the first command in the execute stage using operator runbook stage order.",
                        },
                        "stages": [
                            {
                                "phase": "before",
                                "label": "Run before executing backlog commands",
                                "commandCount": 0,
                                "requiredCount": 0,
                                "commands": [],
                            },
                            {
                                "phase": "execute",
                                "label": "Execute reviewed backlog commands",
                                "commandCount": 1,
                                "requiredCount": 1,
                                "commands": [
                                    {
                                        "phase": "execute",
                                        "rank": 1,
                                        "actionId": "agent-skill-proposal-preview",
                                        "label": "Run agent-skill-proposal-preview",
                                        "command": "design-ai learn --propose-skills --json",
                                        "commandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                                        "required": True,
                                        "safetyLevel": "read-only",
                                        "runPolicy": "preview-only",
                                        "requiresReviewBeforeMutation": False,
                                    },
                                ],
                            },
                            {
                                "phase": "after",
                                "label": "Run after executing backlog commands",
                                "commandCount": 0,
                                "requiredCount": 0,
                                "commands": [],
                            },
                            {
                                "phase": "refresh",
                                "label": "Refresh backlog status after execution",
                                "commandCount": 1,
                                "requiredCount": 1,
                                "commands": [
                                    {
                                        "phase": "refresh",
                                        "label": "Refresh focused agent backlog after review",
                                        "command": agent_backlog_refresh_command,
                                        "commandArgs": agent_backlog_refresh_args,
                                        "required": True,
                                    },
                                ],
                            },
                        ],
                    },
                    "ordered": [
                        {
                            "rank": 1,
                            "actionId": "agent-skill-proposal-preview",
                            "priority": "p2",
                            "category": "skill-evolution",
                            "title": "Preview skill instruction deltas from repeated check-capture signals.",
                            "command": "design-ai learn --propose-skills --json",
                            "commandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                            "safetyLevel": "read-only",
                            "runPolicy": "preview-only",
                            "commandEffects": {
                                "writesLocalFiles": False,
                                "mutatesLocalState": False,
                                "requiresCleanWorkspace": False,
                                "detectedFlags": [],
                                "mutationFlags": [],
                                "outputTargets": [],
                                "profileTargets": [],
                                "usageTargets": [],
                                "reviewReason": "Command is preview/report oriented and has no detected mutation flags.",
                            },
                            "requiresReviewBeforeMutation": False,
                        },
                    ],
                    "commandManifest": [
                        {
                            "rank": 1,
                            "actionId": "agent-skill-proposal-preview",
                            "command": "design-ai learn --propose-skills --json",
                            "commandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                            "safetyLevel": "read-only",
                            "runPolicy": "preview-only",
                            "commandEffects": {
                                "writesLocalFiles": False,
                                "mutatesLocalState": False,
                                "requiresCleanWorkspace": False,
                                "detectedFlags": [],
                                "mutationFlags": [],
                                "outputTargets": [],
                                "profileTargets": [],
                                "usageTargets": [],
                                "reviewReason": "Command is preview/report oriented and has no detected mutation flags.",
                            },
                            "requiresReviewBeforeMutation": False,
                        },
                    ],
                    "preview": [
                        {
                            "rank": 1,
                            "actionId": "agent-skill-proposal-preview",
                            "priority": "p2",
                            "category": "skill-evolution",
                            "title": "Preview skill instruction deltas from repeated check-capture signals.",
                            "command": "design-ai learn --propose-skills --json",
                            "commandArgs": ["design-ai", "learn", "--propose-skills", "--json"],
                            "safetyLevel": "read-only",
                            "runPolicy": "preview-only",
                            "commandEffects": {
                                "writesLocalFiles": False,
                                "mutatesLocalState": False,
                                "requiresCleanWorkspace": False,
                                "detectedFlags": [],
                                "mutationFlags": [],
                                "outputTargets": [],
                                "profileTargets": [],
                                "usageTargets": [],
                                "reviewReason": "Command is preview/report oriented and has no detected mutation flags.",
                            },
                            "requiresReviewBeforeMutation": False,
                        },
                    ],
                    "fileWriteReview": [],
                    "mutationReview": [],
                },
                "verification": [
                    {
                        "label": "Refresh signal registry JSON",
                        "command": "design-ai learn --signals --from-file . --json",
                    },
                    {
                        "label": "Save signal registry Markdown handoff",
                        "command": "design-ai learn --signals --from-file . --report --out learning-signals.md",
                    },
                    {
                        "label": "Gate focused agent backlog",
                        "command": agent_backlog_refresh_command,
                        "commandArgs": agent_backlog_refresh_args,
                    },
                ],
                "boundaries": {
                    "reportMutatesProfile": False,
                    "reportMutatesSkillFiles": False,
                    "reportCallsExternalAiApis": False,
                    "generatedFromLocalSignals": True,
                },
            },
            "readiness": {
                "version": 1,
                "status": "pass",
                "summary": "Required and optional local learning signal surfaces are complete.",
                "requiredPassCount": 4,
                "requiredCount": 4,
                "requiredReady": True,
                "blockingCount": 0,
                "optionalGapCount": 0,
                "blockingChecks": [],
                "optionalGaps": [],
                "optionalGapDetails": [],
                "requiredCheckIds": ["learning-profile", "eval-signals", "workspace-readiness", "agent-development"],
                "optionalCheckIds": ["usage-sidecar", "check-capture"],
                "checkStatusById": {
                    "learning-profile": "pass",
                    "usage-sidecar": "pass",
                    "eval-signals": "pass",
                    "check-capture": "pass",
                    "workspace-readiness": "pass",
                    "agent-development": "pass",
                },
                "checkRequiredById": {
                    "learning-profile": True,
                    "usage-sidecar": False,
                    "eval-signals": True,
                    "check-capture": False,
                    "workspace-readiness": True,
                    "agent-development": True,
                },
                "checkCountByStatus": {
                    "pass": 6,
                    "info": 0,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "requiredCheckCountByStatus": {
                    "pass": 4,
                    "info": 0,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "optionalCheckCountByStatus": {
                    "pass": 2,
                    "info": 0,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "checks": [
                    {
                        "id": "learning-profile",
                        "label": "Learning profile",
                        "status": "pass",
                        "required": True,
                        "summary": "Profile has 3 entries with 0 audit failure(s) and 0 warning(s).",
                        "evidence": {"entries": 3},
                    },
                    {
                        "id": "usage-sidecar",
                        "label": "Usage sidecar",
                        "status": "pass",
                        "required": False,
                        "summary": "Usage sidecar has 2 event(s) and 0 stale selected id(s).",
                        "evidence": {"events": 2},
                    },
                    {
                        "id": "eval-signals",
                        "label": "Eval signals",
                        "status": "pass",
                        "required": True,
                        "summary": "Eval signals include 1 report(s), 0 unresolved template(s), 0 failed report(s), and 0 warned report(s).",
                        "evidence": {"files": 1},
                    },
                    {
                        "id": "check-capture",
                        "label": "Check learning capture",
                        "status": "pass",
                        "required": False,
                        "summary": "Profile includes 1 check-capture learning entry.",
                        "evidence": {"entries": 1},
                    },
                    {
                        "id": "workspace-readiness",
                        "label": "Workspace readiness",
                        "status": "pass",
                        "required": True,
                        "summary": "Workspace has 0 fail action(s), 0 warn action(s), and 0 total next action(s).",
                        "evidence": {"nextActionCount": 0},
                    },
                    {
                        "id": "agent-development",
                        "label": "Agent development backlog",
                        "status": "pass",
                        "required": True,
                        "summary": "Agent backlog has 1 action(s): 0 P0, 0 P1, 1 P2, 0 P3.",
                        "evidence": {"actions": 1},
                    },
                ],
            },
            "commands": {
                "signalsJson": "design-ai learn --signals --from-file . --json",
                "signalsReport": "design-ai learn --signals --from-file . --report --out learning-signals.md",
            },
            "recommendations": [],
            "privacy": {
                "mutatesProfile": False,
                "mutatesSkillFiles": False,
                "callsExternalAiApis": False,
                "storesRawBriefText": False,
                "readsSignalFilesOnly": True,
            },
        }
        assert_agent_backlog_report_json(
            json.dumps(learning_agent_backlog_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_agent_backlog_cmd,
            require_status_pass=True,
        )
        missing_readiness_payload = json.loads(json.dumps(learning_agent_backlog_payload))
        missing_readiness_payload.pop("readiness", None)
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_json(
                json.dumps(missing_readiness_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include signal readiness summary with optional gap details, check index, and status count index",
            scope="package smoke",
        )
        no_command_agent_backlog_payload = {
            "version": 1,
            "generatedAt": "2026-06-02T00:00:06.000Z",
            "status": "pass",
            "signalStatus": "pass",
            "file": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "signalSource": str(Path(tmp)),
            "counts": {
                "actions": 0,
                "p0": 0,
                "p1": 0,
                "p2": 0,
                "p3": 0,
                "learningEntries": 3,
                "usageEvents": 2,
                "evalSignals": 1,
                "checkCaptures": 0,
                "workspaceNextActions": 0,
            },
            "actions": [],
            "actionPlan": {
                "version": 1,
                "stepCount": 0,
                "nextStep": None,
                "steps": [],
                "safetySummary": {
                    "total": 0,
                    "readOnly": 0,
                    "writesLocalFile": 0,
                    "mutatesLocalState": 0,
                    "requiresCleanWorkspace": 0,
                    "requiresReviewBeforeMutation": 0,
                },
                "executionQueue": {
                    "orderedCount": 0,
                    "commandManifestCount": 0,
                    "previewCount": 0,
                    "fileWriteReviewCount": 0,
                    "mutationReviewCount": 0,
                    "nextActionId": "",
                    "nextCommand": "",
                    "nextCommandArgs": [],
                    "nextCommandRunPolicy": "",
                    "nextCommandSelection": {
                        "strategy": "first-command-in-safety-ordered-queue",
                        "safetyOrder": ["read-only", "writes-local-file", "mutates-local-state"],
                        "actionId": "",
                        "rank": None,
                        "safetyLevel": "",
                        "runPolicy": "",
                        "planNextActionId": "",
                        "planNextActionRank": None,
                        "matchesPlanNextAction": False,
                        "reason": "No command-bearing backlog action is available.",
                    },
                    "nextCommandAlignment": {
                        "strategy": "compare-operator-runbook-next-command-to-execution-queue-next-command",
                        "operatorStage": "refresh",
                        "operatorActionId": "",
                        "operatorCommand": agent_backlog_refresh_command,
                        "operatorCommandArgs": agent_backlog_refresh_args,
                        "queueActionId": "",
                        "queueCommand": "",
                        "queueCommandArgs": [],
                        "rankedNextActionId": "",
                        "matchesQueueNextCommand": False,
                        "matchesQueueNextAction": False,
                        "operatorRunsBeforeQueueCommand": False,
                        "queueMatchesRankedNextAction": False,
                        "reason": EXPECTED_AGENT_BACKLOG_EMPTY_QUEUE_ALIGNMENT_REASON,
                    },
                    "operatorHandoff": {
                        "version": 1,
                        "decision": "none",
                        "state": {
                            "version": 1,
                            "status": "no-command",
                            "ready": True,
                            "hasCommand": False,
                            "complete": True,
                            "canRunWithoutReview": False,
                            "requiresGate": False,
                            "requiresRefresh": False,
                            "summary": "Focused agent backlog is clear; no handoff command is required.",
                        },
                        "source": "",
                        "phase": "",
                        "label": "",
                        "command": "",
                        "commandArgs": [],
                        "actionId": "",
                        "rank": None,
                        "runPolicy": "",
                        "required": False,
                        "isGate": False,
                        "nextQueueActionId": "",
                        "nextQueueCommand": "",
                        "nextQueueCommandArgs": [],
                        "nextQueueCommandRequiresGate": False,
                        "operatorGateAppliesToNextQueueAction": False,
                        "nextQueueActionBlockedByGate": False,
                        "refreshCommand": agent_backlog_refresh_command,
                        "refreshCommandArgs": agent_backlog_refresh_args,
                        "refreshCommandLabel": "Refresh focused agent backlog after review",
                        "refreshCommandRequired": False,
                        "reviewLevel": "clear",
                        "requiresOperatorReview": False,
                        "reason": EXPECTED_AGENT_BACKLOG_NO_COMMAND_HANDOFF_REASON,
                    },
                    "commandEffectReview": {
                        "level": "clear",
                        "requiresOperatorReview": False,
                        "headline": "No command target or mutation flag exposure detected.",
                        "checklist": ["No command target or mutation flag exposure detected."],
                        "gatePhaseSummary": {
                            "count": 1,
                            "requiredCount": 0,
                            "optionalCount": 1,
                            "phases": ["refresh"],
                            "hasBefore": False,
                            "hasAfter": False,
                            "hasRefresh": True,
                        },
                        "gateRunbook": {
                            "before": [],
                            "after": [],
                            "refresh": [
                                {
                                    "phase": "refresh",
                                    "label": "Refresh focused agent backlog after review",
                                    "command": agent_backlog_refresh_command,
                                    "commandArgs": agent_backlog_refresh_args,
                                    "required": False,
                                },
                            ],
                            "other": [],
                        },
                        "gateCommands": [
                            {
                                "phase": "refresh",
                                "label": "Refresh focused agent backlog after review",
                                "command": agent_backlog_refresh_command,
                                "commandArgs": agent_backlog_refresh_args,
                                "required": False,
                            },
                        ],
                    },
                    "operatorRunbook": {
                        "version": 1,
                        "stageCount": 4,
                        "commandCount": 1,
                        "requiredCommandCount": 0,
                        "reviewLevel": "clear",
                        "requiresOperatorReview": False,
                        "phases": ["before", "execute", "after", "refresh"],
                        "nextStage": "refresh",
                        "nextCommandLabel": "Refresh focused agent backlog after review",
                        "nextCommand": agent_backlog_refresh_command,
                        "nextCommandArgs": agent_backlog_refresh_args,
                        "nextCommandRequired": False,
                        "nextCommandRunPolicy": "",
                        "nextCommandSelection": {
                            "strategy": "first-command-in-operator-runbook-stage-order",
                            "stageOrder": ["before", "execute", "after", "refresh"],
                            "stage": "refresh",
                            "label": "Refresh focused agent backlog after review",
                            "command": agent_backlog_refresh_command,
                            "commandArgs": agent_backlog_refresh_args,
                            "actionId": "",
                            "rank": None,
                            "required": False,
                            "runPolicy": "",
                            "reason": EXPECTED_AGENT_BACKLOG_REFRESH_ONLY_RUNBOOK_REASON,
                        },
                    },
                    "ordered": [],
                    "commandManifest": [],
                    "preview": [],
                    "fileWriteReview": [],
                    "mutationReview": [],
                },
                "verification": [
                    {
                        "label": "Gate focused agent backlog",
                        "command": agent_backlog_refresh_command,
                        "commandArgs": agent_backlog_refresh_args,
                    },
                ],
                "boundaries": {
                    "reportMutatesProfile": False,
                    "reportMutatesSkillFiles": False,
                    "reportCallsExternalAiApis": False,
                    "generatedFromLocalSignals": True,
                },
            },
            "readiness": {
                "version": 1,
                "status": "pass",
                "summary": "Required local learning signal surfaces are ready; optional evidence gaps remain.",
                "requiredPassCount": 4,
                "requiredCount": 4,
                "requiredReady": True,
                "blockingCount": 0,
                "optionalGapCount": 1,
                "blockingChecks": [],
                "optionalGaps": ["check-capture"],
                "optionalGapDetails": [
                    {
                        "id": "check-capture",
                        "label": "Check learning capture",
                        "status": "info",
                        "summary": "No check-capture entries are present; this is advisory until real warn/fail checks are captured.",
                        "reason": EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_REASON,
                        "nextCondition": EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_NEXT_CONDITION,
                        "automationPolicy": EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_AUTOMATION_POLICY,
                    },
                ],
                "requiredCheckIds": ["learning-profile", "eval-signals", "workspace-readiness", "agent-development"],
                "optionalCheckIds": ["usage-sidecar", "check-capture"],
                "checkStatusById": {
                    "learning-profile": "pass",
                    "usage-sidecar": "pass",
                    "eval-signals": "pass",
                    "check-capture": "info",
                    "workspace-readiness": "pass",
                    "agent-development": "pass",
                },
                "checkRequiredById": {
                    "learning-profile": True,
                    "usage-sidecar": False,
                    "eval-signals": True,
                    "check-capture": False,
                    "workspace-readiness": True,
                    "agent-development": True,
                },
                "checkCountByStatus": {
                    "pass": 5,
                    "info": 1,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "requiredCheckCountByStatus": {
                    "pass": 4,
                    "info": 0,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "optionalCheckCountByStatus": {
                    "pass": 1,
                    "info": 1,
                    "warn": 0,
                    "fail": 0,
                    "missing": 0,
                    "template": 0,
                    "unknown": 0,
                },
                "checks": [
                    {
                        "id": "learning-profile",
                        "label": "Learning profile",
                        "status": "pass",
                        "required": True,
                        "summary": "Profile has 3 entries with 0 audit failure(s) and 0 warning(s).",
                        "evidence": {"entries": 3},
                    },
                    {
                        "id": "usage-sidecar",
                        "label": "Usage sidecar",
                        "status": "pass",
                        "required": False,
                        "summary": "Usage sidecar has 2 event(s) and 0 stale selected id(s).",
                        "evidence": {"events": 2},
                    },
                    {
                        "id": "eval-signals",
                        "label": "Eval signals",
                        "status": "pass",
                        "required": True,
                        "summary": "Eval signals include 1 report(s), 0 unresolved template(s), 0 failed report(s), and 0 warned report(s).",
                        "evidence": {"files": 1},
                    },
                    {
                        "id": "check-capture",
                        "label": "Check learning capture",
                        "status": "info",
                        "required": False,
                        "summary": "No check-capture entries are present; this is advisory until real warn/fail checks are captured.",
                        "evidence": {"entries": 0},
                    },
                    {
                        "id": "workspace-readiness",
                        "label": "Workspace readiness",
                        "status": "pass",
                        "required": True,
                        "summary": "Workspace has 0 fail action(s), 0 warn action(s), and 0 total next action(s).",
                        "evidence": {"nextActionCount": 0},
                    },
                    {
                        "id": "agent-development",
                        "label": "Agent development backlog",
                        "status": "pass",
                        "required": True,
                        "summary": "Agent backlog has 0 action(s): 0 P0, 0 P1, 0 P2, 0 P3.",
                        "evidence": {"actions": 0},
                    },
                ],
            },
            "commands": {
                "signalsJson": "design-ai learn --signals --from-file . --json",
                "signalsReport": "design-ai learn --signals --from-file . --report --out learning-signals.md",
                "agentBacklogJson": agent_backlog_refresh_command,
                "agentBacklogJsonArgs": agent_backlog_refresh_args,
            },
            "recommendations": [],
            "privacy": {
                "mutatesProfile": False,
                "mutatesSkillFiles": False,
                "callsExternalAiApis": False,
                "storesRawBriefText": False,
                "readsSignalFilesOnly": True,
            },
        }
        assert_agent_backlog_no_command_json(
            json.dumps(no_command_agent_backlog_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_agent_backlog_cmd,
        )
        no_command_agent_backlog_markdown = "\n".join([
            "# Agent Development Backlog Report",
            "",
            f"- Learning file: {learning_profile_path}",
            f"- Usage file: {learning_usage_path}",
            "## Summary",
            "- Actions: 0",
            "- Check captures: 0",
            "## Signal Readiness",
            "- Required ready: yes",
            "- Required checks: 4/4",
            "- Blocking checks: 0",
            "- Optional gaps: 1",
            "Readiness check index:",
            "- Required ids: learning-profile, eval-signals, workspace-readiness, agent-development",
            "- Optional ids: usage-sidecar, check-capture",
            "- Status index: learning-profile=pass, usage-sidecar=pass, eval-signals=pass, check-capture=info, workspace-readiness=pass, agent-development=pass",
            "- Required index: learning-profile=yes, usage-sidecar=no, eval-signals=yes, check-capture=no, workspace-readiness=yes, agent-development=yes",
            "- Status counts: pass=5, info=1, warn=0, fail=0, missing=0, template=0, unknown=0",
            "- Required status counts: pass=4, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
            "- Optional status counts: pass=1, info=1, warn=0, fail=0, missing=0, template=0, unknown=0",
            "Readiness checks:",
            "- check-capture [optional] info: No check-capture entries are present; this is advisory until real warn/fail checks are captured.",
            "- agent-development [required] pass: Agent backlog has 0 action(s): 0 P0, 0 P1, 0 P2, 0 P3.",
            "Optional gap details:",
            f"- check-capture: {EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_REASON}",
            f"  Next condition: {EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_NEXT_CONDITION}",
            f"  Automation policy: {EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_AUTOMATION_POLICY}",
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
            f"- Operator next command: refresh: `{agent_backlog_refresh_command}`",
            "- Operator next command selection: first-command-in-operator-runbook-stage-order",
            "- Recommended next command selection: first-command-in-safety-ordered-queue",
            "- Operator/queue next command alignment: different",
            "- Operator handoff state: no-command; ready yes; can run without review no; refresh optional",
            "- Operator handoff summary: Focused agent backlog is clear; no handoff command is required.",
            f"- Operator handoff refresh: {agent_backlog_refresh_command}",
            "No execution steps emitted.",
            "## Follow-Up Commands",
            "design-ai learn --signals --from-file . --json",
            "## Privacy And Boundaries",
            "- Mutates learning profile: no",
            "- Mutates skill files: no",
            "- Calls external AI APIs: no",
            "This report is read-only evidence",
        ])
        assert_agent_backlog_no_command_report_markdown(
            no_command_agent_backlog_markdown,
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=[*learn_agent_backlog_cmd[:-1], "--report"],
        )
        expect_self_test_failure(
            lambda: assert_agent_backlog_no_command_report_markdown(
                no_command_agent_backlog_markdown.replace("Optional gap details:", "Optional evidence details:"),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=[*learn_agent_backlog_cmd[:-1], "--report"],
            ),
            expected="no-command learn agent backlog Markdown report missing 'Optional gap details:'",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_agent_backlog_no_command_report_markdown(
                no_command_agent_backlog_markdown.replace("Readiness check index:", "Readiness check summary:"),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=[*learn_agent_backlog_cmd[:-1], "--report"],
            ),
            expected="no-command learn agent backlog Markdown report missing 'Readiness check index:'",
            scope="package smoke",
        )
        optional_gap_detail_drift_payload = json.loads(json.dumps(no_command_agent_backlog_payload))
        optional_gap_detail_drift_payload["readiness"].pop("optionalGapDetails", None)
        expect_self_test_failure(
            lambda: assert_agent_backlog_no_command_json(
                json.dumps(optional_gap_detail_drift_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include signal readiness summary with optional gap details, check index, and status count index",
            scope="package smoke",
        )
        check_index_drift_payload = json.loads(json.dumps(no_command_agent_backlog_payload))
        check_index_drift_payload["readiness"].pop("checkStatusById", None)
        expect_self_test_failure(
            lambda: assert_agent_backlog_no_command_json(
                json.dumps(check_index_drift_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include signal readiness summary with optional gap details, check index, and status count index",
            scope="package smoke",
        )
        check_count_index_drift_payload = json.loads(json.dumps(no_command_agent_backlog_payload))
        check_count_index_drift_payload["readiness"].pop("checkCountByStatus", None)
        expect_self_test_failure(
            lambda: assert_agent_backlog_no_command_json(
                json.dumps(check_count_index_drift_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include signal readiness summary with optional gap details, check index, and status count index",
            scope="package smoke",
        )
        refresh_reason_drift_payload = json.loads(json.dumps(no_command_agent_backlog_payload))
        refresh_reason_drift_payload["actionPlan"]["executionQueue"]["operatorRunbook"]["nextCommandSelection"]["reason"] = (
            "Selected the first command in the refresh stage using operator runbook stage order."
        )
        expect_self_test_failure(
            lambda: assert_agent_backlog_no_command_json(
                json.dumps(refresh_reason_drift_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="no-command learn agent backlog JSON should preserve optional refresh-only runbook reason",
            scope="package smoke",
        )
        assert_agent_backlog_report_human(
            "\n".join([
                "design-ai learn",
                "Agent development backlog",
                f"Signal source: {Path(tmp)}",
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
                "design-ai learn --propose-skills --json",
                "Privacy: agent backlog is read-only",
            ]),
            context=context,
            cmd=learn_agent_backlog_cmd,
        )
        assert_agent_backlog_report_markdown(
            "\n".join([
                "# Agent Development Backlog Report",
                "",
                f"- Learning file: {learning_profile_path}",
                f"- Usage file: {learning_usage_path}",
                "## Summary",
                "## Signal Readiness",
                "- Required ready: yes",
                "- Required checks: 4/4",
                "- Blocking checks: 0",
                "- Optional gaps: 0",
                "Readiness check index:",
                "- Required ids: learning-profile, eval-signals, workspace-readiness, agent-development",
                "- Optional ids: usage-sidecar, check-capture",
                "- Status index: learning-profile=pass, usage-sidecar=pass, eval-signals=pass, check-capture=pass, workspace-readiness=pass, agent-development=pass",
                "- Required index: learning-profile=yes, usage-sidecar=no, eval-signals=yes, check-capture=no, workspace-readiness=yes, agent-development=yes",
                "- Status counts: pass=6, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                "- Required status counts: pass=4, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                "- Optional status counts: pass=2, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                "Readiness checks:",
                "- check-capture [optional] pass: Profile includes 1 check-capture learning entry.",
                "- agent-development [required] pass: Agent backlog has 1 action(s): 0 P0, 0 P1, 1 P2, 0 P3.",
                "## Backlog Actions",
                "design-ai learn --propose-skills --json",
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
                "- Command effect targets: output 0, profile 0, usage 0, mutation flags 0",
                "- Command effect review: No command target or mutation flag exposure detected.",
                "- Command effect gate phases: refresh (1/1 required)",
                "- Command effect gate runbook: before 0, after 0, refresh 1",
                "- Command effect gates:",
                "refresh: Refresh focused agent backlog after review",
                agent_backlog_refresh_command,
                "- Operator runbook: 4 stage(s), 2 command(s), 2 required",
                "- Operator next command: execute: `design-ai learn --propose-skills --json`",
                "- Operator handoff state: ready; ready yes; can run without review yes; refresh required",
                "- Recommended next action: agent-skill-proposal-preview",
                "- Recommended next command policy: preview-only",
                "Recommended next command:",
                "Queue order:",
                "1. agent-skill-proposal-preview (read-only, preview-only)",
                "Command manifest:",
                "1. agent-skill-proposal-preview - preview-only (read-only)",
                "- Command safety: read-only",
                "- Writes local files: no",
                "- Mutates local state: no",
                "- Requires mutation review: no",
                agent_backlog_refresh_command,
                "## Follow-Up Commands",
                "design-ai learn --signals --from-file . --json",
                "## Privacy And Boundaries",
                "- Mutates learning profile: no",
                "- Mutates skill files: no",
                "- Calls external AI APIs: no",
                "This report is read-only evidence; it does not mutate learning profiles, usage sidecars, eval files, skill files, or target repositories.",
            ]),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=[*learn_agent_backlog_cmd[:-1], "--report"],
        )
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_json(
                json.dumps({
                    **learning_agent_backlog_payload,
                    "counts": {
                        **learning_agent_backlog_payload["counts"],
                        "evalSignals": 0,
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include focused backlog counts",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_json(
                json.dumps({
                    **learning_agent_backlog_payload,
                    "actionPlan": {
                        **learning_agent_backlog_payload["actionPlan"],
                        "steps": [],
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include executable action plan steps and verification",
            scope="package smoke",
        )
        missing_safety_summary_payload = json.loads(json.dumps(learning_agent_backlog_payload))
        missing_safety_summary_payload["actionPlan"].pop("safetySummary", None)
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_json(
                json.dumps(missing_safety_summary_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include executable action plan steps and verification",
            scope="package smoke",
        )
        missing_execution_queue_payload = json.loads(json.dumps(learning_agent_backlog_payload))
        missing_execution_queue_payload["actionPlan"].pop("executionQueue", None)
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_json(
                json.dumps(missing_execution_queue_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include executable action plan steps and verification",
            scope="package smoke",
        )
        unsafe_action_plan_payload = json.loads(json.dumps(learning_agent_backlog_payload))
        unsafe_action_plan_payload["actionPlan"]["steps"][0].pop("commandSafety", None)
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_json(
                json.dumps(unsafe_action_plan_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should include executable action plan steps and verification",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_json(
                json.dumps({
                    **learning_agent_backlog_payload,
                    "privacy": {
                        **learning_agent_backlog_payload["privacy"],
                        "mutatesSkillFiles": True,
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_agent_backlog_cmd,
            ),
            expected="learn agent backlog JSON should keep read-only local privacy boundaries",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_agent_backlog_report_markdown(
                "\n".join([
                    "# Agent Development Backlog Report",
                    f"- Learning file: {learning_profile_path}",
                    f"- Usage file: {learning_usage_path}",
                    "## Summary",
                    "## Signal Readiness",
                    "- Required ready: yes",
                    "- Required checks: 4/4",
                    "- Blocking checks: 0",
                    "- Optional gaps: 0",
                    "Readiness check index:",
                    "- Required ids: learning-profile, eval-signals, workspace-readiness, agent-development",
                    "- Optional ids: usage-sidecar, check-capture",
                    "- Status index: learning-profile=pass, usage-sidecar=pass, eval-signals=pass, check-capture=pass, workspace-readiness=pass, agent-development=pass",
                    "- Required index: learning-profile=yes, usage-sidecar=no, eval-signals=yes, check-capture=no, workspace-readiness=yes, agent-development=yes",
                    "- Status counts: pass=6, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                    "- Required status counts: pass=4, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                    "- Optional status counts: pass=2, info=0, warn=0, fail=0, missing=0, template=0, unknown=0",
                    "Readiness checks:",
                    "- check-capture [optional] pass: Profile includes 1 check-capture learning entry.",
                    "- agent-development [required] pass: Agent backlog has 1 action(s): 0 P0, 0 P1, 1 P2, 0 P3.",
                    "## Backlog Actions",
                    "design-ai learn --propose-skills --json",
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
                    "- Command effect targets: output 0, profile 0, usage 0, mutation flags 0",
                    "- Command effect review: No command target or mutation flag exposure detected.",
                    "- Command effect gate phases: refresh (1/1 required)",
                    "- Command effect gate runbook: before 0, after 0, refresh 1",
                    "- Command effect gates:",
                    "refresh: Refresh focused agent backlog after review",
                    agent_backlog_refresh_command,
                    "- Operator runbook: 4 stage(s), 2 command(s), 2 required",
                    "- Operator next command: execute: `design-ai learn --propose-skills --json`",
                    "- Operator handoff state: ready; ready yes; can run without review yes; refresh required",
                    "- Recommended next action: agent-skill-proposal-preview",
                    "- Recommended next command policy: preview-only",
                    "Recommended next command:",
                    "Queue order:",
                    "1. agent-skill-proposal-preview (read-only, preview-only)",
                    "Command manifest:",
                    "1. agent-skill-proposal-preview - preview-only (read-only)",
                    "- Command safety: read-only",
                    "- Writes local files: no",
                    "- Mutates local state: no",
                    "- Requires mutation review: no",
                    agent_backlog_refresh_command,
                    "## Follow-Up Commands",
                    "design-ai learn --signals --from-file . --json",
                    "## Privacy And Boundaries",
                    "- Mutates learning profile: no",
                    "- Mutates skill files: yes",
                    "- Calls external AI APIs: no",
                    "This report is read-only evidence",
                ]),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=[*learn_agent_backlog_cmd[:-1], "--report"],
            ),
            expected="learn agent backlog Markdown report missing '- Mutates skill files: no'",
            scope="package smoke",
        )

        learn_skill_proposals_cmd = [
            "design-ai",
            "learn",
            "--propose-skills",
            "--file",
            str(learning_profile_path),
            "--usage-file",
            str(learning_usage_path),
            "--from-file",
            str(Path(tmp)),
            "--json",
        ]
        learning_skill_proposal_payload = {
            "version": 1,
            "generatedAt": "2026-06-02T00:00:00.000Z",
            "file": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "signalSource": str(Path(tmp)),
            "dryRun": True,
            "applied": False,
            "minEvidenceCount": 2,
            "checkCaptureCount": 2,
            "candidateCount": 1,
            "count": 1,
            "proposalCount": 1,
            "skippedCount": 0,
            "pendingReviewCount": 1,
            "reviewedCount": 0,
            "reviewFile": "",
            "review": {
                "file": "",
                "exists": False,
                "status": "not-configured",
                "decisionCount": 0,
                "matchedCount": 0,
                "staleCount": 0,
                "pendingCount": 1,
                "acceptedCount": 0,
                "rejectedCount": 0,
                "appliedCount": 0,
                "deferredCount": 0,
                "clearedCount": 0,
                "warnings": [],
            },
            "status": "warn",
            "signalStatus": "pass",
            "proposals": [
                {
                    "id": "skill-proposal-component-spec-writer-abcdef1234",
                    "candidateSkill": "component-spec-writer",
                    "candidateSkillPath": "skills/component-spec-writer/SKILL.md",
                    "title": "Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
                    "riskLevel": "low",
                    "reviewStatus": "pending",
                    "reviewClearsStrict": False,
                    "category": "accessibility",
                    "routeIds": [EXPECTED_ROUTE_ID],
                    "sourceIssueCount": 2,
                    "proposedInstructionDelta": "Add a pre-handoff accessibility checkpoint.",
                    "verificationCommand": f"node cli/bin/design-ai.mjs check --examples --route {EXPECTED_ROUTE_ID} --limit 1 --strict --json",
                    "evidenceSources": [
                        {
                            "kind": "check-capture",
                            "entryId": "learn-skill-proposal-a",
                            "category": "accessibility",
                            "source": f"check:{EXPECTED_ROUTE_ID}",
                            "routeId": EXPECTED_ROUTE_ID,
                            "textPreview": "Improve future outputs by addressing Keyboard and focus behavior.",
                        },
                        {
                            "kind": "check-capture",
                            "entryId": "learn-skill-proposal-b",
                            "category": "accessibility",
                            "source": f"check:{EXPECTED_ROUTE_ID}",
                            "routeId": EXPECTED_ROUTE_ID,
                            "textPreview": "Improve future outputs by addressing Screen reader behavior.",
                        },
                    ],
                },
            ],
            "skipped": [],
            "recommendations": [],
            "privacy": {
                "mutatesProfile": False,
                "mutatesSkillFiles": False,
                "callsExternalAiApis": False,
                "storesRawBriefText": False,
                "exposesEntryTextPreview": True,
            },
        }
        assert_skill_proposal_report_json(
            json.dumps(learning_skill_proposal_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_skill_proposals_cmd,
        )
        learning_skill_proposal_review_path = learning_profile_path.with_name("skill-proposals.review.json")
        assert_skill_proposal_review_json(
            json.dumps({
                **learning_skill_proposal_payload,
                "status": "pass",
                "pendingReviewCount": 0,
                "reviewedCount": 1,
                "reviewFile": str(learning_skill_proposal_review_path),
                "review": {
                    **learning_skill_proposal_payload["review"],
                    "file": str(learning_skill_proposal_review_path),
                    "exists": True,
                    "status": "pass",
                    "decisionCount": 1,
                    "matchedCount": 1,
                    "pendingCount": 0,
                    "appliedCount": 1,
                    "clearedCount": 1,
                },
                "proposals": [
                    {
                        **learning_skill_proposal_payload["proposals"][0],
                        "reviewStatus": "applied",
                        "reviewClearsStrict": True,
                        "reviewDecision": {
                            "proposalId": "skill-proposal-component-spec-writer-abcdef1234",
                            "status": "applied",
                            "reviewedAt": "2026-06-11T00:00:00.000Z",
                            "reviewer": "package-smoke",
                            "note": "Instruction delta manually applied.",
                        },
                    },
                ],
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--json"],
        )
        learning_skill_proposal_review_check_payload = {
            "version": 1,
            "kind": "skill-proposal-review-check",
            "generatedAt": "2026-06-11T00:05:00.000Z",
            "file": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "signalSource": str(Path(tmp)),
            "reviewFile": str(learning_skill_proposal_review_path),
            "status": "pass",
            "proposalStatus": "pass",
            "signalStatus": "pass",
            "proposalCount": 1,
            "pendingReviewCount": 0,
            "reviewedCount": 1,
            "review": {
                **learning_skill_proposal_payload["review"],
                "file": str(learning_skill_proposal_review_path),
                "exists": True,
                "status": "pass",
                "decisionCount": 1,
                "matchedCount": 1,
                "pendingCount": 0,
                "appliedCount": 1,
                "clearedCount": 1,
            },
            "summary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
                "passes": 5,
                "total": 5,
            },
            "checks": [
                {"id": "review-file-configured", "level": "pass", "passed": True, "message": "A skill proposal review file is configured.", "evidence": {}},
                {"id": "review-file-exists", "level": "pass", "passed": True, "message": "The review file exists.", "evidence": {}},
                {"id": "review-file-valid", "level": "pass", "passed": True, "message": "The review file is valid and has a decisions array.", "evidence": {}},
                {"id": "current-proposals-cleared", "level": "pass", "passed": True, "message": "All current proposals are applied or rejected.", "evidence": {}},
                {"id": "no-stale-review-decisions", "level": "pass", "passed": True, "message": "No stale review decisions were found.", "evidence": {}},
            ],
            "recommendations": [{"level": "info", "text": "Review decisions clear the current skill proposal gate."}],
            "privacy": {
                "mutatesProfile": False,
                "mutatesSkillFiles": False,
                "callsExternalAiApis": False,
                "storesRawBriefText": False,
                "exposesEntryTextPreview": False,
            },
        }
        assert_skill_proposal_review_check_json(
            json.dumps(learning_skill_proposal_review_check_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--review-check", "--json"],
        )
        learning_skill_proposal_review_check_markdown = "\n".join([
            "# Skill Proposal Review Check",
            "",
            "- Generated: 2026-06-11T00:05:00.000Z",
            "- Status: pass",
            "- Proposal status: pass",
            "- Signal status: pass",
            f"- File: {learning_profile_path}",
            f"- Usage sidecar: {learning_usage_path}",
            f"- Signal source: {Path(tmp)}",
            f"- Review file: {learning_skill_proposal_review_path}",
            "- Proposals: 1",
            "- Pending review: 0",
            "- Reviewed: 1",
            "",
            "## Checks",
            "",
            "- pass: review-file-configured - A skill proposal review file is configured.",
            "- pass: review-file-exists - The review file exists.",
            "- pass: review-file-valid - The review file is valid and has a decisions array.",
            "- pass: current-proposals-cleared - All current proposals are applied or rejected.",
            "- pass: no-stale-review-decisions - No stale review decisions were found.",
            "",
            "## Review Summary",
            "",
            "- Exists: yes",
            "- Status: pass",
            "- Decisions: 1",
            "- Matched: 1",
            "- Stale: 0",
            "- Applied: 1",
            "- Rejected: 0",
            "- Accepted: 0",
            "- Deferred: 0",
            "",
            "## Recommendations",
            "",
            "- info: Review decisions clear the current skill proposal gate.",
            "",
            "## Privacy And Boundaries",
            "",
            "- Mutates learning profile: no",
            "- Mutates skill files: no",
            "- Calls external AI APIs: no",
            "- Stores raw brief text: no",
        ])
        assert_skill_proposal_review_check_markdown(
            learning_skill_proposal_review_check_markdown,
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--review-check", "--report"],
        )
        learning_skill_proposal_apply_plan_review_path = learning_profile_path.with_name("skill-proposals.accepted.review.json")
        learning_skill_proposal_apply_plan_decision_command_safety = {
            "level": "local-output",
            "writesLocalFiles": True,
            "writesOutputArtifact": True,
            "mutatesLocalState": True,
            "mutatesProfile": False,
            "mutatesReviewFile": False,
            "mutatesSkillFiles": False,
            "callsExternalAiApis": False,
            "requiresCleanWorkspace": False,
            "reason": "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
        }
        learning_skill_proposal_apply_plan_payload = {
            "version": 1,
            "kind": "skill-proposal-apply-plan",
            "generatedAt": "2026-06-11T00:10:00.000Z",
            "file": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "signalSource": str(Path(tmp)),
            "reviewFile": str(learning_skill_proposal_apply_plan_review_path),
            "status": "warn",
            "proposalStatus": "warn",
            "signalStatus": "pass",
            "candidateCount": 1,
            "proposalCount": 1,
            "acceptedCount": 1,
            "count": 1,
            "pendingReviewCount": 1,
            "reviewedCount": 1,
            "review": {
                **learning_skill_proposal_payload["review"],
                "file": str(learning_skill_proposal_apply_plan_review_path),
                "exists": True,
                "status": "pass",
                "decisionCount": 1,
                "matchedCount": 1,
                "pendingCount": 1,
                "acceptedCount": 1,
            },
            "tasks": [
                {
                    "id": "apply-1-skill-proposal-component-spec-writer-abcdef1234",
                    "proposalId": "skill-proposal-component-spec-writer-abcdef1234",
                    "title": "Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
                    "candidateSkill": "component-spec-writer",
                    "candidateSkillPath": "skills/component-spec-writer/SKILL.md",
                    "category": "accessibility",
                    "riskLevel": "low",
                    "routeIds": [EXPECTED_ROUTE_ID],
                    "sourceIssueCount": 2,
                    "proposedInstructionDelta": "Add a pre-handoff accessibility checkpoint.",
                    "verificationCommand": f"node cli/bin/design-ai.mjs check --examples --route {EXPECTED_ROUTE_ID} --limit 1 --strict --json",
                    "manualSteps": [
                        "Open skills/component-spec-writer/SKILL.md and inspect the relevant checklist or playbook section.",
                        "Merge the proposed instruction delta manually instead of pasting duplicate generated text.",
                        "Run the verification command and inspect any route-specific failures before marking the work complete.",
                        "After the skill edit and verification pass, update the review decision from `accepted` to `applied`.",
                    ],
                    "safetyChecklist": [
                        "Do not edit learning.json as part of this apply plan.",
                        "Do not call external AI APIs, embeddings, or fine-tuning jobs.",
                    ],
                    "evidenceSources": learning_skill_proposal_payload["proposals"][0]["evidenceSources"],
                    "reviewDecision": {
                        "proposalId": "skill-proposal-component-spec-writer-abcdef1234",
                        "status": "accepted",
                        "reviewedAt": "2026-06-11T00:10:00.000Z",
                        "reviewer": "package-smoke",
                        "note": "Instruction delta accepted for manual apply.",
                    },
                },
            ],
            "commands": {
                "reviewCheckJson": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
                "reviewCheckReport": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                "proposalPatchPreview": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --patch --out skill-proposals.patch",
                "strictGate": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --strict --json",
            },
            "commandArgs": {
                "reviewCheckJson": [
                    "design-ai", "learn", "--propose-skills",
                    "--file", str(learning_profile_path),
                    "--usage-file", str(learning_usage_path),
                    "--from-file", str(Path(tmp)),
                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                    "--review-check", "--json",
                ],
                "reviewCheckReport": [
                    "design-ai", "learn", "--propose-skills",
                    "--file", str(learning_profile_path),
                    "--usage-file", str(learning_usage_path),
                    "--from-file", str(Path(tmp)),
                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                    "--review-check", "--report", "--out", "skill-proposal-review-check.md",
                ],
                "proposalPatchPreview": [
                    "design-ai", "learn", "--propose-skills",
                    "--file", str(learning_profile_path),
                    "--usage-file", str(learning_usage_path),
                    "--from-file", str(Path(tmp)),
                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                    "--patch", "--out", "skill-proposals.patch",
                ],
                "strictGate": [
                    "design-ai", "learn", "--propose-skills",
                    "--file", str(learning_profile_path),
                    "--usage-file", str(learning_usage_path),
                    "--from-file", str(Path(tmp)),
                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                    "--strict", "--json",
                ],
            },
            "commandContract": {
                "version": 1,
                "valid": True,
                "status": "pass",
                "commandCount": 4,
                "checkCount": 18,
                "passCount": 18,
                "warningCount": 0,
                "requiredKeys": [
                    "reviewCheckJson",
                    "reviewCheckReport",
                    "proposalPatchPreview",
                    "strictGate",
                ],
                "missingCommandKeys": [],
                "unexpectedCommandKeys": [],
                "baseCommand": ["design-ai", "learn", "--propose-skills"],
                "reviewFileRequired": True,
                "reviewFile": str(learning_skill_proposal_apply_plan_review_path),
                "forbiddenFlags": ["--yes"],
                "failureCount": 0,
                "failedCheckIds": [],
                "failedChecks": [],
                "nextCommandKey": "reviewCheckJson",
                "nextCommand": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
                "nextCommandArgs": [
                    "design-ai", "learn", "--propose-skills",
                    "--file", str(learning_profile_path),
                    "--usage-file", str(learning_usage_path),
                    "--from-file", str(Path(tmp)),
                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                    "--review-check", "--json",
                ],
                "nextCommandRunPolicy": "preview-only",
                "nextCommandSafety": {
                    "level": "read-only",
                    "writesLocalFiles": False,
                    "mutatesLocalState": False,
                    "mutatesProfile": False,
                    "mutatesReviewFile": False,
                    "mutatesSkillFiles": False,
                    "callsExternalAiApis": False,
                    "requiresCleanWorkspace": False,
                    "reason": "The next apply-plan follow-up command only checks proposal review readiness and does not mutate local state.",
                },
                "commandSequenceCount": 4,
                "commandSequenceSummary": {
                    "executable": True,
                    "blocked": False,
                    "stepCount": 4,
                    "readOnlyStepCount": 2,
                    "localOutputStepCount": 2,
                    "writesLocalFiles": True,
                    "writesOutputArtifacts": True,
                    "mutatesProfile": False,
                    "mutatesReviewFile": False,
                    "mutatesSkillFiles": False,
                    "callsExternalAiApis": False,
                    "requiresCleanWorkspace": False,
                    "runPolicy": "mixed-preview-local-output",
                    "reason": "The sequence combines read-only readiness checks with local output artifact previews; it does not mutate learning, review, or skill files.",
                },
                "commandSequenceKeys": [
                    "reviewCheckJson",
                    "reviewCheckReport",
                    "proposalPatchPreview",
                    "strictGate",
                ],
                "commandSequenceByKey": {
                    "reviewCheckJson": {
                        "key": "reviewCheckJson",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
                        "runPolicy": "preview-only",
                        "safety": {"level": "read-only"},
                    },
                    "reviewCheckReport": {
                        "key": "reviewCheckReport",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                        "runPolicy": "output-artifact",
                        "safety": {"level": "local-output"},
                    },
                    "proposalPatchPreview": {
                        "key": "proposalPatchPreview",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --patch --out skill-proposals.patch",
                        "runPolicy": "output-artifact",
                        "safety": {"level": "local-output"},
                    },
                    "strictGate": {
                        "key": "strictGate",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --strict --json",
                        "runPolicy": "strict-readiness-gate",
                        "safety": {"level": "read-only"},
                    },
                },
                "commandSequence": [
                    {
                        "step": 1,
                        "key": "reviewCheckJson",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
                        "commandArgs": [
                            "design-ai", "learn", "--propose-skills",
                            "--file", str(learning_profile_path),
                            "--usage-file", str(learning_usage_path),
                            "--from-file", str(Path(tmp)),
                            "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                            "--review-check", "--json",
                        ],
                        "runPolicy": "preview-only",
                        "safety": {
                            "level": "read-only",
                            "writesLocalFiles": False,
                            "writesOutputArtifact": False,
                            "mutatesLocalState": False,
                            "mutatesProfile": False,
                            "mutatesReviewFile": False,
                            "mutatesSkillFiles": False,
                            "callsExternalAiApis": False,
                            "requiresCleanWorkspace": False,
                            "reason": "This follow-up command validates readiness without writing local files or mutating local state.",
                        },
                    },
                    {
                        "step": 2,
                        "key": "reviewCheckReport",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                        "commandArgs": [
                            "design-ai", "learn", "--propose-skills",
                            "--file", str(learning_profile_path),
                            "--usage-file", str(learning_usage_path),
                            "--from-file", str(Path(tmp)),
                            "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                            "--review-check", "--report", "--out", "skill-proposal-review-check.md",
                        ],
                        "runPolicy": "output-artifact",
                        "safety": {
                            "level": "local-output",
                            "writesLocalFiles": True,
                            "writesOutputArtifact": True,
                            "mutatesLocalState": True,
                            "mutatesProfile": False,
                            "mutatesReviewFile": False,
                            "mutatesSkillFiles": False,
                            "callsExternalAiApis": False,
                            "requiresCleanWorkspace": False,
                            "reason": "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
                        },
                    },
                    {
                        "step": 3,
                        "key": "proposalPatchPreview",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --patch --out skill-proposals.patch",
                        "commandArgs": [
                            "design-ai", "learn", "--propose-skills",
                            "--file", str(learning_profile_path),
                            "--usage-file", str(learning_usage_path),
                            "--from-file", str(Path(tmp)),
                            "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                            "--patch", "--out", "skill-proposals.patch",
                        ],
                        "runPolicy": "output-artifact",
                        "safety": {
                            "level": "local-output",
                            "writesLocalFiles": True,
                            "writesOutputArtifact": True,
                            "mutatesLocalState": True,
                            "mutatesProfile": False,
                            "mutatesReviewFile": False,
                            "mutatesSkillFiles": False,
                            "callsExternalAiApis": False,
                            "requiresCleanWorkspace": False,
                            "reason": "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files.",
                        },
                    },
                    {
                        "step": 4,
                        "key": "strictGate",
                        "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --strict --json",
                        "commandArgs": [
                            "design-ai", "learn", "--propose-skills",
                            "--file", str(learning_profile_path),
                            "--usage-file", str(learning_usage_path),
                            "--from-file", str(Path(tmp)),
                            "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                            "--strict", "--json",
                        ],
                        "runPolicy": "strict-readiness-gate",
                        "safety": {
                            "level": "read-only",
                            "writesLocalFiles": False,
                            "writesOutputArtifact": False,
                            "mutatesLocalState": False,
                            "mutatesProfile": False,
                            "mutatesReviewFile": False,
                            "mutatesSkillFiles": False,
                            "callsExternalAiApis": False,
                            "requiresCleanWorkspace": False,
                            "reason": "This follow-up command validates readiness without writing local files or mutating local state.",
                        },
                    },
                ],
                "operatorRunbook": {
                    "version": 1,
                    "executable": True,
                    "blocked": False,
                    "stageCount": 4,
                    "requiredStageCount": 3,
                    "commandStageCount": 3,
                    "nextStageKey": "previewArtifacts",
                    "nextStageCommandKeys": ["reviewCheckReport", "proposalPatchPreview"],
                    "nextRequiredStageKey": "manualSkillEdit",
                    "nextRequiredStageCommandKeys": [],
                    "nextRequiredCommandStageKey": "reviewReadiness",
                    "nextRequiredCommandStageCommandKeys": ["reviewCheckJson"],
                    "stageSelection": {
                        "strategy": "optional-preview-before-required-manual-edit",
                        "decision": {
                            "action": "offer-optional-preview",
                            "stageKey": "previewArtifacts",
                            "stageKind": "local-output-preview",
                            "required": False,
                            "hasCommands": True,
                            "commandCount": 2,
                            "commandKeys": ["reviewCheckReport", "proposalPatchPreview"],
                            "commands": [
                                {
                                    "step": 2,
                                    "key": "reviewCheckReport",
                                    "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                                    "commandArgs": [
                                        "design-ai", "learn", "--propose-skills",
                                        "--file", str(learning_profile_path),
                                        "--usage-file", str(learning_usage_path),
                                        "--from-file", str(Path(tmp)),
                                        "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                        "--review-check", "--report", "--out", "skill-proposal-review-check.md",
                                    ],
                                    "runPolicy": "output-artifact",
                                    "safetyLevel": "local-output",
                                    "safety": learning_skill_proposal_apply_plan_decision_command_safety,
                                    "writesLocalFiles": True,
                                    "writesOutputArtifact": True,
                                    "mutatesLocalState": True,
                                    "mutatesProfile": False,
                                    "mutatesReviewFile": False,
                                    "mutatesSkillFiles": False,
                                    "callsExternalAiApis": False,
                                    "requiresCleanWorkspace": False,
                                },
                                {
                                    "step": 3,
                                    "key": "proposalPatchPreview",
                                    "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --patch --out skill-proposals.patch",
                                    "commandArgs": [
                                        "design-ai", "learn", "--propose-skills",
                                        "--file", str(learning_profile_path),
                                        "--usage-file", str(learning_usage_path),
                                        "--from-file", str(Path(tmp)),
                                        "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                        "--patch", "--out", "skill-proposals.patch",
                                    ],
                                    "runPolicy": "output-artifact",
                                    "safetyLevel": "local-output",
                                    "safety": learning_skill_proposal_apply_plan_decision_command_safety,
                                    "writesLocalFiles": True,
                                    "writesOutputArtifact": True,
                                    "mutatesLocalState": True,
                                    "mutatesProfile": False,
                                    "mutatesReviewFile": False,
                                    "mutatesSkillFiles": False,
                                    "callsExternalAiApis": False,
                                    "requiresCleanWorkspace": False,
                                },
                            ],
                            "commandByKey": {
                                "reviewCheckReport": {
                                    "step": 2,
                                    "key": "reviewCheckReport",
                                    "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                                    "commandArgs": [
                                        "design-ai", "learn", "--propose-skills",
                                        "--file", str(learning_profile_path),
                                        "--usage-file", str(learning_usage_path),
                                        "--from-file", str(Path(tmp)),
                                        "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                        "--review-check", "--report", "--out", "skill-proposal-review-check.md",
                                    ],
                                    "runPolicy": "output-artifact",
                                    "safetyLevel": "local-output",
                                    "safety": learning_skill_proposal_apply_plan_decision_command_safety,
                                    "writesLocalFiles": True,
                                    "writesOutputArtifact": True,
                                    "mutatesLocalState": True,
                                    "mutatesProfile": False,
                                    "mutatesReviewFile": False,
                                    "mutatesSkillFiles": False,
                                    "callsExternalAiApis": False,
                                    "requiresCleanWorkspace": False,
                                },
                                "proposalPatchPreview": {
                                    "step": 3,
                                    "key": "proposalPatchPreview",
                                    "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --patch --out skill-proposals.patch",
                                    "commandArgs": [
                                        "design-ai", "learn", "--propose-skills",
                                        "--file", str(learning_profile_path),
                                        "--usage-file", str(learning_usage_path),
                                        "--from-file", str(Path(tmp)),
                                        "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                        "--patch", "--out", "skill-proposals.patch",
                                    ],
                                    "runPolicy": "output-artifact",
                                    "safetyLevel": "local-output",
                                    "safety": learning_skill_proposal_apply_plan_decision_command_safety,
                                    "writesLocalFiles": True,
                                    "writesOutputArtifact": True,
                                    "mutatesLocalState": True,
                                    "mutatesProfile": False,
                                    "mutatesReviewFile": False,
                                    "mutatesSkillFiles": False,
                                    "callsExternalAiApis": False,
                                    "requiresCleanWorkspace": False,
                                },
                            },
                            "commandStepByKey": {
                                "reviewCheckReport": 2,
                                "proposalPatchPreview": 3,
                            },
                            "commandRunPolicyByKey": {
                                "reviewCheckReport": "output-artifact",
                                "proposalPatchPreview": "output-artifact",
                            },
                            "commandSafetyLevelByKey": {
                                "reviewCheckReport": "local-output",
                                "proposalPatchPreview": "local-output",
                            },
                            "commandArgsByKey": {
                                "reviewCheckReport": [
                                    "design-ai", "learn", "--propose-skills",
                                    "--file", str(learning_profile_path),
                                    "--usage-file", str(learning_usage_path),
                                    "--from-file", str(Path(tmp)),
                                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                    "--review-check", "--report", "--out", "skill-proposal-review-check.md",
                                ],
                                "proposalPatchPreview": [
                                    "design-ai", "learn", "--propose-skills",
                                    "--file", str(learning_profile_path),
                                    "--usage-file", str(learning_usage_path),
                                    "--from-file", str(Path(tmp)),
                                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                    "--patch", "--out", "skill-proposals.patch",
                                ],
                            },
                            "commandStringByKey": {
                                "reviewCheckReport": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                                "proposalPatchPreview": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --patch --out skill-proposals.patch",
                            },
                            "commandDisplayLabelByKey": {
                                "reviewCheckReport": "Review check Markdown report",
                                "proposalPatchPreview": "Skill proposal patch preview",
                            },
                            "commandDescriptionByKey": {
                                "reviewCheckReport": "Generate a Markdown review-check artifact for accepted proposal readiness.",
                                "proposalPatchPreview": "Generate a unified diff preview for accepted skill proposal edits.",
                            },
                            "commandOutputArtifactByKey": {
                                "reviewCheckReport": "skill-proposal-review-check.md",
                                "proposalPatchPreview": "skill-proposals.patch",
                            },
                            "commandOutputArtifactTypeByKey": {
                                "reviewCheckReport": "markdown-report",
                                "proposalPatchPreview": "unified-diff",
                            },
                            "commandOutputArtifactActionByKey": {
                                "reviewCheckReport": "render-markdown-report",
                                "proposalPatchPreview": "render-unified-diff-preview",
                            },
                            "commandOutputArtifactMediaTypeByKey": {
                                "reviewCheckReport": "text/markdown",
                                "proposalPatchPreview": "text/x-diff",
                            },
                            "commandOutputArtifactDispositionByKey": {
                                "reviewCheckReport": "review-only",
                                "proposalPatchPreview": "manual-apply-preview",
                            },
                            "commandOutputArtifactManualApplyCandidateByKey": {
                                "reviewCheckReport": False,
                                "proposalPatchPreview": True,
                            },
                            "commandOutputArtifactRequiresManualReviewByKey": {
                                "reviewCheckReport": False,
                                "proposalPatchPreview": True,
                            },
                            "commandOutputArtifactReviewInstructionByKey": {
                                "reviewCheckReport": "Review the Markdown readiness report before changing proposal review status.",
                                "proposalPatchPreview": "Review the unified diff manually before applying any skill-file edits.",
                            },
                            "commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey": {
                                "reviewCheckReport": False,
                                "proposalPatchPreview": True,
                            },
                            "commandOutputArtifactApplyPreconditionIdsByKey": {
                                "reviewCheckReport": [],
                                "proposalPatchPreview": ["manual-review", "clean-workspace"],
                            },
                            "commandOutputArtifactApplyPreconditionLabelsByKey": {
                                "reviewCheckReport": [],
                                "proposalPatchPreview": ["Manual review completed", "Clean workspace confirmed"],
                            },
                            "commandOutputArtifactApplyPreconditionsByKey": {
                                "reviewCheckReport": [],
                                "proposalPatchPreview": [
                                    {"id": "manual-review", "label": "Manual review completed", "required": True},
                                    {"id": "clean-workspace", "label": "Clean workspace confirmed", "required": True},
                                ],
                            },
                            "commandOutputArtifactApplyPreconditionCountByKey": {
                                "reviewCheckReport": 0,
                                "proposalPatchPreview": 2,
                            },
                            "commandOutputArtifactRequiredApplyPreconditionCountByKey": {
                                "reviewCheckReport": 0,
                                "proposalPatchPreview": 2,
                            },
                            "commandOutputArtifactSatisfiedApplyPreconditionCountByKey": {
                                "reviewCheckReport": 0,
                                "proposalPatchPreview": 0,
                            },
                            "commandOutputArtifactPendingApplyPreconditionCountByKey": {
                                "reviewCheckReport": 0,
                                "proposalPatchPreview": 2,
                            },
                            "commandOutputArtifactRequiredPendingApplyPreconditionCountByKey": {
                                "reviewCheckReport": 0,
                                "proposalPatchPreview": 2,
                            },
                            "commandOutputArtifactManualApplyReadyByKey": {
                                "reviewCheckReport": False,
                                "proposalPatchPreview": False,
                            },
                            "commandOutputArtifactManualApplyStatusByKey": {
                                "reviewCheckReport": "not-applicable",
                                "proposalPatchPreview": "blocked",
                            },
                            "commandOutputArtifactManualApplyStatusLabelByKey": {
                                "reviewCheckReport": "Review only",
                                "proposalPatchPreview": "Blocked",
                            },
                            "commandOutputArtifactManualApplyStatusToneByKey": {
                                "reviewCheckReport": "neutral",
                                "proposalPatchPreview": "warning",
                            },
                            "commandOutputArtifactManualApplyBlockedReasonByKey": {
                                "reviewCheckReport": "This output artifact is review-only and cannot be applied.",
                                "proposalPatchPreview": "Complete required apply preconditions before applying this patch preview.",
                            },
                            "commandOutputArtifactManualApplyBlockedReasonCodeByKey": {
                                "reviewCheckReport": "not-manual-apply-candidate",
                                "proposalPatchPreview": "required-preconditions-pending",
                            },
                            "nextCommandEntry": {
                                "step": 2,
                                "key": "reviewCheckReport",
                                "command": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                                "commandArgs": [
                                    "design-ai", "learn", "--propose-skills",
                                    "--file", str(learning_profile_path),
                                    "--usage-file", str(learning_usage_path),
                                    "--from-file", str(Path(tmp)),
                                    "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                    "--review-check", "--report", "--out", "skill-proposal-review-check.md",
                                ],
                                "runPolicy": "output-artifact",
                                "safetyLevel": "local-output",
                                "safety": learning_skill_proposal_apply_plan_decision_command_safety,
                                "writesLocalFiles": True,
                                "writesOutputArtifact": True,
                                "mutatesLocalState": True,
                                "mutatesProfile": False,
                                "mutatesReviewFile": False,
                                "mutatesSkillFiles": False,
                                "callsExternalAiApis": False,
                                "requiresCleanWorkspace": False,
                            },
                            "nextCommandKey": "reviewCheckReport",
                            "nextCommandDisplayLabel": "Review check Markdown report",
                            "nextCommandDescription": "Generate a Markdown review-check artifact for accepted proposal readiness.",
                            "nextCommandOutputArtifact": "skill-proposal-review-check.md",
                            "nextCommandOutputArtifactType": "markdown-report",
                            "nextCommandOutputArtifactAction": "render-markdown-report",
                            "nextCommandOutputArtifactMediaType": "text/markdown",
                            "nextCommandOutputArtifactDisposition": "review-only",
                            "nextCommandOutputArtifactManualApplyCandidate": False,
                            "nextCommandOutputArtifactRequiresManualReview": False,
                            "nextCommandOutputArtifactReviewInstruction": "Review the Markdown readiness report before changing proposal review status.",
                            "nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply": False,
                            "nextCommandOutputArtifactApplyPreconditionIds": [],
                            "nextCommandOutputArtifactApplyPreconditionLabels": [],
                            "nextCommandOutputArtifactApplyPreconditions": [],
                            "nextCommandOutputArtifactApplyPreconditionCount": 0,
                            "nextCommandOutputArtifactRequiredApplyPreconditionCount": 0,
                            "nextCommandOutputArtifactSatisfiedApplyPreconditionCount": 0,
                            "nextCommandOutputArtifactPendingApplyPreconditionCount": 0,
                            "nextCommandOutputArtifactRequiredPendingApplyPreconditionCount": 0,
                            "nextCommandOutputArtifactManualApplyReady": False,
                            "nextCommandOutputArtifactManualApplyStatus": "not-applicable",
                            "nextCommandOutputArtifactManualApplyStatusLabel": "Review only",
                            "nextCommandOutputArtifactManualApplyStatusTone": "neutral",
                            "nextCommandOutputArtifactManualApplyBlockedReason": "This output artifact is review-only and cannot be applied.",
                            "nextCommandOutputArtifactManualApplyBlockedReasonCode": "not-manual-apply-candidate",
                            "nextCommandStep": 2,
                            "nextCommand": f"design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --report --out skill-proposal-review-check.md",
                            "nextCommandArgs": [
                                "design-ai", "learn", "--propose-skills",
                                "--file", str(learning_profile_path),
                                "--usage-file", str(learning_usage_path),
                                "--from-file", str(Path(tmp)),
                                "--review-file", str(learning_skill_proposal_apply_plan_review_path),
                                "--review-check", "--report", "--out", "skill-proposal-review-check.md",
                            ],
                            "nextCommandRunPolicy": "output-artifact",
                            "nextCommandSafetyLevel": "local-output",
                            "nextCommandSafety": learning_skill_proposal_apply_plan_decision_command_safety,
                            "runPolicy": "optional-local-output-preview",
                            "safety": {
                                "level": "local-output",
                                "writesLocalFiles": True,
                                "writesOutputArtifacts": True,
                                "mutatesLocalState": True,
                                "mutatesProfile": False,
                                "mutatesReviewFile": False,
                                "mutatesSkillFiles": False,
                                "callsExternalAiApis": False,
                                "requiresCleanWorkspace": False,
                                "reason": "The selected decision only writes optional local preview artifacts and does not mutate learning, review, or skill files.",
                            },
                            "nextRequiredStageKey": "manualSkillEdit",
                            "nextRequiredCommandStageKey": "reviewReadiness",
                            "requiresOperatorActionBeforeRequiredCommands": True,
                            "reason": "Offer optional local preview artifacts first; the required path still starts with manual skill edits before read-only command gates.",
                        },
                        "stageOrder": ["previewArtifacts", "manualSkillEdit", "reviewReadiness", "strictGate"],
                        "nextStageKey": "previewArtifacts",
                        "nextStageCommandKeys": ["reviewCheckReport", "proposalPatchPreview"],
                        "nextStage": {
                            "key": "previewArtifacts",
                            "step": 1,
                            "label": "Generate optional review artifacts",
                            "kind": "local-output-preview",
                            "required": False,
                            "hasCommands": True,
                            "commandCount": 2,
                            "commandKeys": ["reviewCheckReport", "proposalPatchPreview"],
                            "writesLocalFiles": True,
                            "writesOutputArtifacts": True,
                            "mutatesLocalState": True,
                            "mutatesProfile": False,
                            "mutatesReviewFile": False,
                            "mutatesSkillFiles": False,
                            "callsExternalAiApis": False,
                            "requiresCleanWorkspace": False,
                            "reason": "Optional Markdown review and patch preview artifacts can be generated before manual skill edits.",
                        },
                        "nextRequiredStageKey": "manualSkillEdit",
                        "nextRequiredStageCommandKeys": [],
                        "nextRequiredStage": {
                            "key": "manualSkillEdit",
                            "step": 2,
                            "label": "Apply accepted skill deltas manually",
                            "kind": "manual-review",
                            "required": True,
                            "hasCommands": False,
                            "commandCount": 0,
                            "commandKeys": [],
                            "writesLocalFiles": False,
                            "writesOutputArtifacts": False,
                            "mutatesLocalState": False,
                            "mutatesProfile": False,
                            "mutatesReviewFile": False,
                            "mutatesSkillFiles": False,
                            "callsExternalAiApis": False,
                            "requiresCleanWorkspace": False,
                            "reason": "No apply-plan command mutates skill files; the operator must manually edit accepted skill deltas after review.",
                        },
                        "nextRequiredCommandStageKey": "reviewReadiness",
                        "nextRequiredCommandStageCommandKeys": ["reviewCheckJson"],
                        "nextRequiredCommandStage": {
                            "key": "reviewReadiness",
                            "step": 3,
                            "label": "Run review readiness check",
                            "kind": "read-only-check",
                            "required": True,
                            "hasCommands": True,
                            "commandCount": 1,
                            "commandKeys": ["reviewCheckJson"],
                            "writesLocalFiles": False,
                            "writesOutputArtifacts": False,
                            "mutatesLocalState": False,
                            "mutatesProfile": False,
                            "mutatesReviewFile": False,
                            "mutatesSkillFiles": False,
                            "callsExternalAiApis": False,
                            "requiresCleanWorkspace": False,
                            "reason": "Run the read-only review check after manual skill edits to verify proposal review state.",
                        },
                        "reason": "Offer optional local preview artifacts first, then require the manual skill edit before read-only review and strict gates.",
                    },
                    "stageKeys": ["previewArtifacts", "manualSkillEdit", "reviewReadiness", "strictGate"],
                    "stageByKey": {
                        "previewArtifacts": {
                            "step": 1,
                            "key": "previewArtifacts",
                            "kind": "local-output-preview",
                            "required": False,
                            "commandKeys": ["reviewCheckReport", "proposalPatchPreview"],
                            "commands": [{"key": "reviewCheckReport"}, {"key": "proposalPatchPreview"}],
                        },
                        "manualSkillEdit": {
                            "step": 2,
                            "key": "manualSkillEdit",
                            "kind": "manual-review",
                            "required": True,
                            "commandKeys": [],
                            "commands": [],
                        },
                        "reviewReadiness": {
                            "step": 3,
                            "key": "reviewReadiness",
                            "kind": "read-only-check",
                            "required": True,
                            "commandKeys": ["reviewCheckJson"],
                            "commands": [{"key": "reviewCheckJson"}],
                        },
                        "strictGate": {
                            "step": 4,
                            "key": "strictGate",
                            "kind": "read-only-gate",
                            "required": True,
                            "commandKeys": ["strictGate"],
                            "commands": [{"key": "strictGate"}],
                        },
                    },
                    "stages": [
                        {
                            "step": 1,
                            "key": "previewArtifacts",
                            "kind": "local-output-preview",
                            "required": False,
                            "commandKeys": ["reviewCheckReport", "proposalPatchPreview"],
                            "commands": [{"key": "reviewCheckReport"}, {"key": "proposalPatchPreview"}],
                        },
                        {
                            "step": 2,
                            "key": "manualSkillEdit",
                            "kind": "manual-review",
                            "required": True,
                            "commandKeys": [],
                            "commands": [],
                        },
                        {
                            "step": 3,
                            "key": "reviewReadiness",
                            "kind": "read-only-check",
                            "required": True,
                            "commandKeys": ["reviewCheckJson"],
                            "commands": [{"key": "reviewCheckJson"}],
                        },
                        {
                            "step": 4,
                            "key": "strictGate",
                            "kind": "read-only-gate",
                            "required": True,
                            "commandKeys": ["strictGate"],
                            "commands": [{"key": "strictGate"}],
                        },
                    ],
                    "reason": "Generate optional local review artifacts, apply accepted skill deltas manually, then run read-only review and strict readiness gates.",
                },
                "nextAction": "Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
                "checks": [
                    {"id": "required-command-keys-present", "level": "pass", "passed": True},
                    {"id": "no-unexpected-command-keys", "level": "pass", "passed": True},
                    {"id": "reviewCheckJson-base-command", "level": "pass", "passed": True},
                    {"id": "reviewCheckJson-review-file-context", "level": "pass", "passed": True},
                    {"id": "reviewCheckJson-expected-suffix", "level": "pass", "passed": True},
                    {"id": "reviewCheckJson-read-only-flags", "level": "pass", "passed": True},
                    {"id": "reviewCheckReport-base-command", "level": "pass", "passed": True},
                    {"id": "reviewCheckReport-review-file-context", "level": "pass", "passed": True},
                    {"id": "reviewCheckReport-expected-suffix", "level": "pass", "passed": True},
                    {"id": "reviewCheckReport-read-only-flags", "level": "pass", "passed": True},
                    {"id": "proposalPatchPreview-base-command", "level": "pass", "passed": True},
                    {"id": "proposalPatchPreview-review-file-context", "level": "pass", "passed": True},
                    {"id": "proposalPatchPreview-expected-suffix", "level": "pass", "passed": True},
                    {"id": "proposalPatchPreview-read-only-flags", "level": "pass", "passed": True},
                    {"id": "strictGate-base-command", "level": "pass", "passed": True},
                    {"id": "strictGate-review-file-context", "level": "pass", "passed": True},
                    {"id": "strictGate-expected-suffix", "level": "pass", "passed": True},
                    {"id": "strictGate-read-only-flags", "level": "pass", "passed": True},
                ],
                "summary": {
                    "failures": 0,
                    "warnings": 0,
                    "passes": 18,
                    "total": 18,
                },
            },
            "recommendations": [{"level": "warning", "text": "Apply accepted proposal deltas manually."}],
            "privacy": {
                "mutatesProfile": False,
                "mutatesReviewFile": False,
                "mutatesSkillFiles": False,
                "callsExternalAiApis": False,
                "storesRawBriefText": False,
                "exposesEntryTextPreview": True,
            },
        }
        assert_skill_proposal_apply_plan_json(
            json.dumps(learning_skill_proposal_apply_plan_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        )
        learning_skill_proposal_apply_plan_human = "\n".join([
            "  design-ai learn",
            "  Skill proposal apply plan",
            "",
            "Manual apply tasks:",
            "- skill-proposal-component-spec-writer-abcdef1234: skills/component-spec-writer/SKILL.md",
            "",
            "Follow-up commands:",
            f"- reviewCheckJson: design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
            "",
            "Command contract:",
            "- valid: yes",
            "- status: pass",
            "- required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
            "- forbidden flags: --yes",
            "- check count: 18",
            "- pass count: 18",
            "- warning count: 0",
            "- failure count: 0",
            "- failed checks: none",
            "- next command key: reviewCheckJson",
            "- next command policy: preview-only",
            "- next command safety: read-only",
            f"- next command: design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
            "- command sequence count: 4",
            "- command sequence keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
            "- command sequence policy: mixed-preview-local-output",
            "- command sequence executable: yes",
            "- command sequence local outputs: 2",
            "- command sequence mutates profile: no",
            "- command sequence mutates review file: no",
            "- command sequence mutates skill files: no",
            "- command sequence calls external AI APIs: no",
            "- operator runbook stages: 4",
            "- operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate",
            "- operator runbook required stages: 3",
            "- operator runbook next stage: previewArtifacts",
            "- operator runbook next required stage: manualSkillEdit",
            "- operator runbook next required command stage: reviewReadiness",
            "- operator runbook stage selection: optional-preview-before-required-manual-edit",
            "- operator runbook decision: offer-optional-preview",
            "- operator runbook decision safety: local-output",
            "- operator runbook decision commands: reviewCheckReport, proposalPatchPreview",
            "- operator runbook decision next command: reviewCheckReport",
            "- operator runbook selected stage: previewArtifacts (optional, local-output-preview)",
            "Command sequence:",
            "- 1. reviewCheckJson: preview-only / read-only",
            "- 2. reviewCheckReport: output-artifact / local-output",
            "- 3. proposalPatchPreview: output-artifact / local-output",
            "- 4. strictGate: strict-readiness-gate / read-only",
            "Operator runbook:",
            "- 1. previewArtifacts: optional / local-output-preview / reviewCheckReport, proposalPatchPreview",
            "- 2. manualSkillEdit: required / manual-review / manual",
            "- 3. reviewReadiness: required / read-only-check / reviewCheckJson",
            "- 4. strictGate: required / read-only-gate / strictGate",
            "- next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
            "",
            "Privacy: apply plan is read-only and does not mutate learning.json, review files, or skill files.",
        ])
        assert_skill_proposal_apply_plan_human(
            learning_skill_proposal_apply_plan_human,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan"],
        )
        learning_skill_proposal_apply_plan_markdown = "\n".join([
            "# Skill Proposal Apply Plan",
            "",
            "- Generated: 2026-06-11T00:10:00.000Z",
            "- Status: warn",
            "- Proposal status: warn",
            "- Signal status: pass",
            f"- File: {learning_profile_path}",
            f"- Usage sidecar: {learning_usage_path}",
            f"- Signal source: {Path(tmp)}",
            f"- Review file: {learning_skill_proposal_apply_plan_review_path}",
            "- Accepted proposals: 1",
            "- Pending review: 1",
            "- Reviewed: 1",
            "",
            "## Manual Apply Tasks",
            "",
            "### Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
            "",
            "- Candidate skill: skills/component-spec-writer/SKILL.md",
            "",
            "Manual steps:",
            "- After the skill edit and verification pass, update the review decision from `accepted` to `applied`.",
            "",
            "## Follow-up Commands",
            "",
            f"- reviewCheckJson: `design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json`",
            "",
            "## Command Contract",
            "",
            "- Valid: yes",
            "- Required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
            "- Check count: 18",
            "- Pass count: 18",
            "- Warning count: 0",
            "- Failure count: 0",
            "- Failed checks: none",
            "- Next command key: reviewCheckJson",
            "- Next command policy: preview-only",
            "- Next command safety: read-only",
            f"- Next command: `design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json`",
            "- Command sequence count: 4",
            "- Command sequence keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
            "- Command sequence policy: mixed-preview-local-output",
            "- Command sequence executable: yes",
            "- Command sequence local outputs: 2",
            "- Command sequence mutates profile: no",
            "- Command sequence mutates review file: no",
            "- Command sequence mutates skill files: no",
            "- Command sequence calls external AI APIs: no",
            "- Operator runbook stages: 4",
            "- Operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate",
            "- Operator runbook required stages: 3",
            "- Operator runbook next stage: previewArtifacts",
            "- Operator runbook next required stage: manualSkillEdit",
            "- Operator runbook next required command stage: reviewReadiness",
            "- Operator runbook stage selection: optional-preview-before-required-manual-edit",
            "- Operator runbook decision: offer-optional-preview",
            "- Operator runbook decision safety: local-output",
            "- Operator runbook decision commands: reviewCheckReport, proposalPatchPreview",
            "- Operator runbook decision next command: reviewCheckReport",
            "- Operator runbook selected stage: previewArtifacts (optional, local-output-preview)",
            "",
            "Command sequence:",
            "- 1. reviewCheckJson (preview-only / read-only): `design-ai learn --propose-skills",
            "- 2. reviewCheckReport (output-artifact / local-output): `design-ai learn --propose-skills",
            "- 3. proposalPatchPreview (output-artifact / local-output): `design-ai learn --propose-skills",
            "- 4. strictGate (strict-readiness-gate / read-only): `design-ai learn --propose-skills",
            "",
            "Operator runbook:",
            "- 1. previewArtifacts (optional / local-output-preview): reviewCheckReport, proposalPatchPreview",
            "- 2. manualSkillEdit (required / manual-review): manual",
            "- 3. reviewReadiness (required / read-only-check): reviewCheckJson",
            "- 4. strictGate (required / read-only-gate): strictGate",
            "- Next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
            "",
            "## Privacy And Boundaries",
            "",
            "- Mutates learning profile: no",
            "- Mutates review file: no",
            "- Mutates skill files: no",
            "- Calls external AI APIs: no",
        ])
        assert_skill_proposal_apply_plan_markdown(
            learning_skill_proposal_apply_plan_markdown,
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--report"],
        )
        assert_skill_proposal_review_template_json(
            json.dumps({
                "version": 1,
                "generatedAt": "2026-06-11T00:00:00.000Z",
                "source": "design-ai learn --propose-skills --review-template",
                "proposalFile": str(learning_profile_path),
                "usageFile": str(learning_usage_path),
                "signalSource": str(Path(tmp)),
                "reviewFile": "",
                "reviewPolicy": {
                    "clearsStrict": ["applied", "rejected"],
                    "remainsPending": ["accepted", "deferred"],
                },
                "summary": {
                    "proposalCount": 1,
                    "pendingReviewCount": 1,
                    "reviewedCount": 0,
                    "templateDecisionCount": 1,
                },
                "decisions": [
                    {
                        "proposalId": "skill-proposal-component-spec-writer-abcdef1234",
                        "status": "deferred",
                        "reviewedAt": "",
                        "reviewer": "",
                        "note": "Review skills/component-spec-writer/SKILL.md: Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
                    },
                ],
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-template"],
        )
        assert_skill_proposal_min_evidence_json(
            json.dumps({
                **learning_skill_proposal_payload,
                "minEvidenceCount": 3,
                "count": 0,
                "proposalCount": 0,
                "skippedCount": 1,
                "proposals": [],
                "skipped": [
                    {
                        "candidateSkillPath": "skills/component-spec-writer/SKILL.md",
                        "category": "accessibility",
                        "sourceIssueCount": 2,
                        "reason": "Needs at least 3 related check-capture entries before proposing a skill edit.",
                    },
                ],
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--min-evidence", "3", "--json"],
        )
        assert_skill_proposal_report_human(
            "\n".join([
                "design-ai learn",
                "Skill evolution proposals",
                f"Signal source: {Path(tmp)}",
                "Status: warn",
                "Proposed skill deltas:",
                "skills/component-spec-writer/SKILL.md",
                "No changes made. This command is preview-only",
            ]),
            context=context,
            cmd=learn_skill_proposals_cmd,
        )
        learning_skill_proposal_markdown = "\n".join([
            "# Skill Evolution Proposal Report",
            "",
            "- Generated: 2026-06-02T00:00:03.000Z",
            f"- File: {learning_profile_path}",
            f"- Usage sidecar: {learning_usage_path}",
            f"- Signal source: {Path(tmp)}",
            "- Status: warn",
            "- Signal status: pass",
            "- Check capture entries: 2",
            "- Candidate groups: 1",
            "- Proposal count: 1",
            "- Skipped groups: 0",
            "- Dry run: yes",
            "- Applied: no",
            "",
            "## Proposed Skill Deltas",
            "",
            "### Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
            "",
            "- Proposal id: skill-proposal-component-spec-writer-abc123",
            "- Candidate skill: skills/component-spec-writer/SKILL.md",
            "- Category: accessibility",
            "- Routes: component-spec",
            "- Risk: low",
            "- Source issues: 2",
            "- Rationale: Repeated accessibility check captures were recorded for component-spec.",
            "",
            "Proposed instruction delta:",
            "",
            "> Add a pre-handoff accessibility checkpoint.",
            "",
            "Verification:",
            "",
            "```bash",
            "node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json",
            "```",
            "",
            "Evidence:",
            "- `learn-skill-proposal-a` [accessibility] check:component-spec",
            "",
            "## Skipped Groups",
            "",
            "No candidate groups were skipped.",
            "",
            "## Privacy And Boundaries",
            "",
            "- Mutates learning profile: no",
            "- Mutates skill files: no",
            "- Calls external AI APIs: no",
            "- Stores raw brief text: no",
            "- Includes entry text preview: yes",
            "",
            "## Next Steps",
            "",
            "- This report is preview-only evidence; it does not apply changes.",
        ])
        assert_skill_proposal_report_markdown(
            learning_skill_proposal_markdown,
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_skill_proposals_cmd,
        )
        learning_skill_proposal_patch = "\n".join([
            "# design-ai skill proposal patch preview",
            "# Preview-only output from `design-ai learn --propose-skills --patch`.",
            "# Review manually before applying. This command does not edit skill files.",
            "",
            "diff --git a/skills/component-spec-writer/SKILL.md b/skills/component-spec-writer/SKILL.md",
            "--- a/skills/component-spec-writer/SKILL.md",
            "+++ b/skills/component-spec-writer/SKILL.md",
            "@@ -7,1 +7,10 @@",
            " See [PLAYBOOK.md](PLAYBOOK.md).",
            "+",
            "+## Local Learning Proposal: skill-proposal-component-spec-writer-abc123",
            "+",
            "+<!-- Generated by design-ai learn --propose-skills --patch. Review manually before applying. -->",
            "+",
            "+- Category: accessibility",
            "+- Routes: component-spec",
            "+- Risk: low",
            "+- Evidence count: 2",
            "+- Proposed instruction: Add a pre-handoff accessibility checkpoint.",
            "+- Verification: `node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json`",
        ])
        assert_skill_proposal_patch(
            learning_skill_proposal_patch,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--patch"],
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_report_json(
                json.dumps({
                    **learning_skill_proposal_payload,
                    "proposals": [],
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_skill_proposals_cmd,
            ),
            expected="learn skill proposals JSON should include the repeated component-spec skill delta",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_review_json(
                json.dumps({
                    **learning_skill_proposal_payload,
                    "reviewFile": str(learning_skill_proposal_review_path),
                    "pendingReviewCount": 1,
                    "reviewedCount": 1,
                    "review": {
                        **learning_skill_proposal_payload["review"],
                        "file": str(learning_skill_proposal_review_path),
                        "exists": True,
                        "matchedCount": 1,
                        "pendingCount": 1,
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_review_path,
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--json"],
            ),
            expected="learn skill proposals review JSON should join applied review decisions",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_review_check_json(
                json.dumps({
                    **learning_skill_proposal_review_check_payload,
                    "status": "warn",
                    "summary": {
                        **learning_skill_proposal_review_check_payload["summary"],
                        "status": "warn",
                        "warnings": 1,
                    },
                    "checks": [
                        *learning_skill_proposal_review_check_payload["checks"][:-1],
                        {
                            "id": "no-stale-review-decisions",
                            "level": "warn",
                            "passed": False,
                            "message": "Review file contains decisions for proposals that are no longer current.",
                            "evidence": {"staleCount": 1},
                        },
                    ],
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_review_path,
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--review-check", "--json"],
            ),
            expected="learn skill proposal review-check JSON should report pass review-file readiness",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_review_check_markdown(
                learning_skill_proposal_review_check_markdown.replace(
                    "- Mutates skill files: no",
                    "- Mutates skill files: yes",
                ),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_review_path,
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--review-check", "--report"],
            ),
            expected="learn skill proposal review-check Markdown report missing '- Mutates skill files: no'",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "acceptedCount": 0,
                    "count": 0,
                    "tasks": [],
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactRequiresManualReviewByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactRequiresManualReviewByKey"],
                                        "proposalPatchPreview": False,
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactManualApplyStatusToneByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyStatusToneByKey"],
                                        "proposalPatchPreview": "success",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactManualApplyStatusLabelByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyStatusLabelByKey"],
                                        "proposalPatchPreview": "Ready to apply",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactManualApplyStatusByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyStatusByKey"],
                                        "proposalPatchPreview": "ready",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactManualApplyBlockedReasonCodeByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyBlockedReasonCodeByKey"],
                                        "proposalPatchPreview": "",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactManualApplyReadyByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyReadyByKey"],
                                        "proposalPatchPreview": True,
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactPendingApplyPreconditionCountByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactPendingApplyPreconditionCountByKey"],
                                        "proposalPatchPreview": 1,
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactApplyPreconditionCountByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionCountByKey"],
                                        "proposalPatchPreview": 1,
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactApplyPreconditionsByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionsByKey"],
                                        "proposalPatchPreview": [
                                            {"id": "manual-review", "label": "Manual review completed", "required": True},
                                        ],
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactApplyPreconditionLabelsByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionLabelsByKey"],
                                        "proposalPatchPreview": ["Manual review completed"],
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactApplyPreconditionIdsByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionIdsByKey"],
                                        "proposalPatchPreview": ["manual-review"],
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey"],
                                        "proposalPatchPreview": False,
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactReviewInstructionByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactReviewInstructionByKey"],
                                        "proposalPatchPreview": "",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactManualApplyCandidateByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyCandidateByKey"],
                                        "proposalPatchPreview": False,
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactDispositionByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactDispositionByKey"],
                                        "proposalPatchPreview": "review-only",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactMediaTypeByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactMediaTypeByKey"],
                                        "proposalPatchPreview": "text/plain",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactActionByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactActionByKey"],
                                        "proposalPatchPreview": "download-file",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandDescriptionByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandDescriptionByKey"],
                                        "reviewCheckReport": "Generate review report.",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactTypeByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactTypeByKey"],
                                        "reviewCheckReport": "markdown",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandOutputArtifactByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactByKey"],
                                        "proposalPatchPreview": "proposal.patch",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandDisplayLabelByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandDisplayLabelByKey"],
                                        "proposalPatchPreview": "Patch preview",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageCount": 3,
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandStringByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandStringByKey"],
                                        "reviewCheckReport": "design-ai learn --propose-skills --review-check --report",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandArgsByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandArgsByKey"],
                                        "proposalPatchPreview": [
                                            "design-ai", "learn", "--propose-skills",
                                            "--patch",
                                        ],
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandSafetyLevelByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandSafetyLevelByKey"],
                                        "reviewCheckReport": "read-only",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandRunPolicyByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandRunPolicyByKey"],
                                        "proposalPatchPreview": "preview-only",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandStepByKey": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandStepByKey"],
                                        "reviewCheckReport": 3,
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "nextCommandStep": 3,
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "nextCommandSafety": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["nextCommandSafety"],
                                        "level": "read-only",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commands": [
                                        {
                                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commands"][0],
                                            "safety": {
                                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commands"][0]["safety"],
                                                "reason": "drift",
                                            },
                                        },
                                        *learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commands"][1:],
                                    ],
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "nextCommandEntry": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["nextCommandEntry"],
                                        "key": "proposalPatchPreview",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commandByKey": {},
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "nextCommandKey": "proposalPatchPreview",
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "commands": [],
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "safety": {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["safety"],
                                        "level": "read-only",
                                    },
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "decision": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                    "action": "run-required-command",
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageKeys": [],
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "nextRequiredCommandStageKey": "",
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "strategy": "",
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_json(
                json.dumps({
                    **learning_skill_proposal_apply_plan_payload,
                    "commandContract": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"],
                        "operatorRunbook": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                            "stageSelection": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                                "nextStage": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["nextStage"],
                                    "kind": "manual-review",
                                },
                            },
                        },
                    },
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                signal_source=Path(tmp),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
            ),
            expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_human(
                learning_skill_proposal_apply_plan_human.replace(
                    "Command contract:",
                    "Command summary:",
                ),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan"],
            ),
            expected="learn skill proposal apply-plan human output missing 'Command contract:'",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_human(
                learning_skill_proposal_apply_plan_human.replace(
                    "Operator runbook:",
                    "Operator stages:",
                ),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan"],
            ),
            expected="learn skill proposal apply-plan human output missing 'Operator runbook:'",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_markdown(
                learning_skill_proposal_apply_plan_markdown.replace(
                    "- Mutates skill files: no",
                    "- Mutates skill files: yes",
                ),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--report"],
            ),
            expected="learn skill proposal apply-plan Markdown report missing '- Mutates skill files: no'",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_apply_plan_markdown(
                learning_skill_proposal_apply_plan_markdown.replace(
                    "Operator runbook:",
                    "Operator stages:",
                ),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                review_path=learning_skill_proposal_apply_plan_review_path,
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--report"],
            ),
            expected="learn skill proposal apply-plan Markdown report missing 'Operator runbook:'",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_min_evidence_json(
                json.dumps({
                    **learning_skill_proposal_payload,
                    "minEvidenceCount": 2,
                    "count": 1,
                    "proposalCount": 1,
                    "skippedCount": 0,
                    "skipped": [],
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--min-evidence", "3", "--json"],
            ),
            expected="learn skill proposals min-evidence JSON should report minEvidenceCount 3",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_patch(
                learning_skill_proposal_patch.replace("This command does not edit skill files.", "This command edits skill files."),
                context=context,
                cmd=[*learn_skill_proposals_cmd[:-1], "--patch"],
            ),
            expected="learn skill proposals patch output missing",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_report_markdown(
                learning_skill_proposal_markdown.replace("- Mutates skill files: no", "- Mutates skill files: yes"),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_skill_proposals_cmd,
            ),
            expected="learn skill proposals Markdown report missing '- Mutates skill files: no'",
            scope="package smoke",
        )
        assert_skill_proposal_report_json(
            json.dumps(learning_skill_proposal_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_skill_proposals_cmd,
            returncode=1,
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_report_json(
                json.dumps({
                    **learning_skill_proposal_payload,
                    "status": "pass",
                }),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_skill_proposals_cmd,
            ),
            expected="learn skill proposals JSON should report 'warn' status when proposals need review",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_skill_proposal_report_json(
                json.dumps(learning_skill_proposal_payload),
                profile_path=learning_profile_path,
                usage_path=learning_usage_path,
                context=context,
                cmd=learn_skill_proposals_cmd,
                returncode=0,
            ),
            expected="learn skill proposals strict JSON should exit with code 1 when proposal review is pending",
            scope="package smoke",
        )

        learning_eval_template_path = Path(tmp) / "learning-eval-template.json"
        learning_eval_template_payload = {
            "version": 1,
            "generatedAt": "2026-06-01T00:00:02.000Z",
            "sourceProfile": {
                "file": str(learning_profile_path),
                "exists": True,
                "entryCount": 3,
                "auditStatus": "pass",
                "category": "accessibility",
                "query": EXPECTED_ROUTE_BRIEF,
                "limit": 6,
            },
            "selection": {
                "mode": "brief-relevance",
                "candidateCount": 1,
                "matchedCount": 1,
                "selectedCount": 1,
                "queryTokenCount": 7,
                "fallbackCount": 0,
            },
            "caseCount": 1,
            "cases": [
                {
                    "id": "eval-1-0123456789",
                    "brief": EXPECTED_ROUTE_BRIEF,
                    "category": "accessibility",
                    "limit": 1,
                    "expectedSelectedIds": ["learn-relevant"],
                    "minMatchedCount": 1,
                    "requireNoFallback": True,
                },
            ],
            "recommendations": [],
            "privacy": {
                "storesRawBriefText": True,
                "storesBriefHash": False,
                "exposesMatchedTokens": False,
            },
        }
        learn_eval_template_cmd = ["design-ai", "learn", "--eval-template", "--query", EXPECTED_ROUTE_BRIEF, "--file", str(learning_profile_path), "--json"]
        assert_learning_eval_template_json(
            json.dumps(learning_eval_template_payload),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_eval_template_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_eval_template_json(
                json.dumps({
                    **learning_eval_template_payload,
                    "privacy": {
                        **learning_eval_template_payload["privacy"],
                        "storesRawBriefText": False,
                    },
                }),
                profile_path=learning_profile_path,
                context=context,
                cmd=learn_eval_template_cmd,
            ),
            expected="learn eval-template JSON should disclose that checkpoint templates store raw brief text",
            scope="package smoke",
        )
        learning_eval_path = Path(tmp) / "learning-eval.json"
        learning_eval_payload = {
            "file": str(learning_profile_path),
            "source": str(learning_eval_path),
            "profileExists": True,
            "profileEntryCount": 3,
            "checkpointVersion": 1,
            "defaultLimit": 1,
            "defaultCategory": "",
            "status": "pass",
            "caseCount": 1,
            "passed": 1,
            "warned": 0,
            "failed": 0,
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "cases": [
                {
                    "id": "button-accessibility",
                    "routeId": EXPECTED_ROUTE_ID,
                    "briefHash": "0123456789abcdef",
                    "category": "",
                    "limit": 1,
                    "status": "pass",
                    "failures": 0,
                    "warnings": 0,
                    "candidateCount": 3,
                    "matchedCount": 1,
                    "selectedCount": 1,
                    "fallbackCount": 0,
                    "expectedSelectedIds": ["learn-relevant"],
                    "missingExpectedIds": [],
                    "avoidedSelectedIds": ["learn-brand"],
                    "unexpectedAvoidedIds": [],
                    "minMatchedCount": 1,
                    "requireNoFallback": True,
                    "selectedEntryIds": ["learn-relevant"],
                    "selected": [
                        {
                            "id": "learn-relevant",
                            "category": "accessibility",
                            "score": 10,
                            "reason": "brief-match",
                        },
                    ],
                    "issues": [],
                },
            ],
            "recommendations": [],
            "privacy": {
                "storesRawBriefText": False,
                "storesBriefHash": True,
                "exposesMatchedTokens": False,
            },
        }
        learn_eval_cmd = ["design-ai", "learn", "--eval", "--from-file", str(learning_eval_path), "--file", str(learning_profile_path), "--json"]
        assert_learning_eval_report_json(
            json.dumps(learning_eval_payload),
            profile_path=learning_profile_path,
            eval_path=learning_eval_path,
            context=context,
            cmd=learn_eval_cmd,
        )
        assert_learning_eval_template_report_json(
            json.dumps({
                **learning_eval_payload,
                "source": str(learning_eval_template_path),
            }),
            profile_path=learning_profile_path,
            eval_path=learning_eval_template_path,
            context=context,
            cmd=["design-ai", "learn", "--eval", "--from-file", str(learning_eval_template_path), "--file", str(learning_profile_path), "--strict", "--json"],
        )
        assert_learning_eval_report_human(
            "\n".join([
                "design-ai learn",
                "Local learning eval report",
                f"Checkpoint: {learning_eval_path}",
                "Status: pass",
                "button-accessibility / component-spec: pass",
                "Privacy: eval reports expose brief hashes and selected ids, not raw brief text.",
            ]),
            context=context,
            cmd=learn_eval_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_eval_report_json(
                json.dumps({
                    **learning_eval_payload,
                    "cases": [
                        {
                            **learning_eval_payload["cases"][0],
                            "brief": EXPECTED_ROUTE_BRIEF,
                        },
                    ],
                }),
                profile_path=learning_profile_path,
                eval_path=learning_eval_path,
                context=context,
                cmd=learn_eval_cmd,
            ),
            expected="learn eval JSON should not expose raw brief or query text",
            scope="package smoke",
        )
        learning_eval_strict_path = Path(tmp) / "learning-eval-strict-fail.json"
        learning_eval_strict_payload = {
            **learning_eval_payload,
            "source": str(learning_eval_strict_path),
            "status": "fail",
            "passed": 0,
            "failed": 1,
            "cases": [
                {
                    **learning_eval_payload["cases"][0],
                    "id": "missing-accessibility",
                    "status": "fail",
                    "failures": 2,
                    "expectedSelectedIds": ["missing-entry"],
                    "missingExpectedIds": ["missing-entry"],
                    "issues": [
                        {
                            "level": "failure",
                            "code": "expected-entry-not-in-profile",
                            "message": "Expected entry missing-entry is not present in the active learning profile.",
                        },
                        {
                            "level": "failure",
                            "code": "expected-entry-not-selected",
                            "message": "Expected selected entries were missing: missing-entry.",
                        },
                    ],
                },
            ],
            "recommendations": [
                {
                    "level": "warning",
                    "text": "Review failed eval cases before trusting prompt/pack --with-learning selection.",
                },
            ],
        }
        learn_eval_strict_cmd = [
            "design-ai",
            "learn",
            "--eval",
            "--from-file",
            str(learning_eval_strict_path),
            "--file",
            str(learning_profile_path),
            "--strict",
            "--json",
        ]
        assert_learning_eval_strict_failure_json(
            json.dumps(learning_eval_strict_payload),
            returncode=1,
            profile_path=learning_profile_path,
            eval_path=learning_eval_strict_path,
            context=context,
            cmd=learn_eval_strict_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_eval_strict_failure_json(
                json.dumps(learning_eval_strict_payload),
                returncode=0,
                profile_path=learning_profile_path,
                eval_path=learning_eval_strict_path,
                context=context,
                cmd=learn_eval_strict_cmd,
            ),
            expected="learn eval --strict should exit with code 1 when checkpoints fail",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_eval_strict_failure_json(
                json.dumps({
                    **learning_eval_strict_payload,
                    "cases": [
                        {
                            **learning_eval_strict_payload["cases"][0],
                            "brief": EXPECTED_ROUTE_BRIEF,
                        },
                    ],
                }),
                returncode=1,
                profile_path=learning_profile_path,
                eval_path=learning_eval_strict_path,
                context=context,
                cmd=learn_eval_strict_cmd,
            ),
            expected="learn eval strict JSON should not expose raw brief or query text",
            scope="package smoke",
        )

        duplicate_command_args = [
            "design-ai",
            "learn",
            "--file",
            str(learning_profile_path),
            "--forget",
            "learn-b",
            "--yes",
        ]
        sensitive_command_args = [
            "design-ai",
            "learn",
            "--file",
            str(learning_profile_path),
            "--forget",
            "learn-c",
            "--yes",
        ]
        learning_audit_payload = {
            "file": str(learning_profile_path),
            "exists": True,
            "count": 3,
            "categoryCounts": {
                "workflow": 2,
                "constraint": 1,
            },
            "summary": {
                "status": "warn",
                "failures": 0,
                "warnings": 2,
            },
            "issues": [
                {
                    "level": "warning",
                    "code": "duplicate-entry-text",
                    "entryId": "learn-b",
                    "message": "Entry duplicates learn-a in the same category.",
                },
                {
                    "level": "warning",
                    "code": "sensitive-secret-assignment",
                    "entryId": "learn-c",
                    "message": "Entry may contain a secret-like assignment.",
                },
            ],
            "suggestions": [
                {
                    "issueCode": "duplicate-entry-text",
                    "entryId": "learn-b",
                    "action": "remove-duplicate",
                    "message": "Remove the duplicate entry.",
                    "commandArgs": duplicate_command_args,
                    "command": " ".join(duplicate_command_args),
                },
                {
                    "issueCode": "sensitive-secret-assignment",
                    "entryId": "learn-c",
                    "action": "remove-or-redact-sensitive-content",
                    "message": "Remove this entry or re-add a redacted preference.",
                    "commandArgs": sensitive_command_args,
                    "command": " ".join(sensitive_command_args),
                },
            ],
        }
        learn_audit_cmd = ["design-ai", "learn", "--audit", "--file", str(learning_profile_path), "--json"]
        assert_learning_audit_cleanup_json(
            json.dumps(learning_audit_payload),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_audit_cmd,
        )
        learning_audit_fix_payload = {
            "file": str(learning_profile_path),
            "dryRun": True,
            "applied": False,
            "before": {
                "status": "warn",
                "failures": 0,
                "warnings": 2,
            },
            "cleanupCount": 2,
            "cleanup": [
                {
                    "entryId": "learn-b",
                    "issueCodes": ["duplicate-entry-text"],
                    "actions": ["remove-duplicate"],
                    "commandArgs": duplicate_command_args,
                    "command": " ".join(duplicate_command_args),
                },
                {
                    "entryId": "learn-c",
                    "issueCodes": ["sensitive-secret-assignment"],
                    "actions": ["remove-or-redact-sensitive-content"],
                    "commandArgs": sensitive_command_args,
                    "command": " ".join(sensitive_command_args),
                },
            ],
            "skipped": [],
            "removed": [],
            "after": None,
        }
        learn_audit_fix_cmd = [
            "design-ai",
            "learn",
            "--audit",
            "--fix",
            "--dry-run",
            "--file",
            str(learning_profile_path),
            "--json",
        ]
        assert_learning_audit_fix_json(
            json.dumps(learning_audit_fix_payload),
            profile_path=learning_profile_path,
            dry_run=True,
            context=context,
            cmd=learn_audit_fix_cmd,
        )
        applied_learning_audit_fix_payload = {
            **learning_audit_fix_payload,
            "dryRun": False,
            "applied": True,
            "removed": [
                {
                    "id": "learn-b",
                    "category": "workflow",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                    "textPreview": "Prefer release notes that state evidence before claims",
                },
                {
                    "id": "learn-c",
                    "category": "constraint",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:02.000Z",
                    "textPreview": "Never include api_key=redacted placeholders in prompt context",
                },
            ],
            "after": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
        }
        assert_learning_audit_fix_json(
            json.dumps(applied_learning_audit_fix_payload),
            profile_path=learning_profile_path,
            dry_run=False,
            context=context,
            cmd=["design-ai", "learn", "--audit", "--fix", "--yes", "--file", str(learning_profile_path), "--json"],
        )
        learning_curation_payload = {
            "file": str(learning_profile_path),
            "archiveFile": str(learning_profile_path.with_name(f"{learning_profile_path.stem}.archive{learning_profile_path.suffix}")),
            "usage": {
                "autoArchive": False,
            },
            "before": {
                "status": "warn",
                "failures": 0,
                "warnings": 2,
            },
            "proposalCount": 2,
            "archiveCount": 2,
            "manualReviewCount": 0,
            "proposals": [
                {
                    "entryId": "learn-b",
                    "action": "archive",
                    "reason": "duplicate-entry",
                    "issueCodes": ["duplicate-entry-text"],
                    "messages": ["Entry duplicates learn-a in the same category."],
                    "category": "workflow",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                    "textPreview": "Prefer release notes that state evidence before claims",
                },
                {
                    "entryId": "learn-c",
                    "action": "archive",
                    "reason": "sensitive-content",
                    "issueCodes": ["sensitive-secret-assignment"],
                    "messages": ["Entry may contain a secret-like assignment."],
                    "category": "constraint",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:02.000Z",
                    "textPreview": "Never include api_key=redacted placeholders in prompt context",
                },
            ],
            "skipped": [],
            "count": 3,
            "dryRun": True,
            "applied": False,
            "archived": [],
            "after": None,
        }
        learn_curate_cmd = ["design-ai", "learn", "--curate", "--file", str(learning_profile_path), "--json"]
        assert_learning_curation_json(
            json.dumps(learning_curation_payload),
            profile_path=learning_profile_path,
            dry_run=True,
            context=context,
            cmd=learn_curate_cmd,
        )
        learning_usage_path = learning_profile_path.with_name(
            f"{learning_profile_path.stem}.usage{learning_profile_path.suffix}"
        )
        learning_curation_usage_payload = {
            **learning_curation_payload,
            "usage": {
                "file": str(learning_profile_path),
                "usageFile": str(learning_usage_path),
                "profileFile": str(learning_profile_path),
                "profileFileMatches": True,
                "exists": True,
                "eventCount": 1,
                "usedEntryCount": 1,
                "unusedEntryCount": 2,
                "staleSelectedEntryCount": 1,
                "reviewCount": 3,
                "unusedReviewCount": 2,
                "staleReviewCount": 1,
                "reviews": [
                    {
                        "level": "warning",
                        "action": "review-usage-sidecar",
                        "reason": "stale-selected-entry-id",
                        "entryId": "learn-stale",
                        "usageCount": 1,
                        "message": "Usage sidecar selected an entry id that is no longer present in the active learning profile.",
                    },
                    {
                        "level": "info",
                        "action": "manual-review",
                        "reason": "unused-with-limited-history",
                        "entryId": "learn-b",
                        "usageCount": 0,
                        "message": "Active entry has not been selected in recorded prompt/pack usage; review manually before archiving.",
                    },
                    {
                        "level": "info",
                        "action": "manual-review",
                        "reason": "unused-with-limited-history",
                        "entryId": "learn-c",
                        "usageCount": 0,
                        "message": "Active entry has not been selected in recorded prompt/pack usage; review manually before archiving.",
                    },
                ],
                "recommendations": [],
                "error": "",
                "privacy": {
                    "storesRawBriefText": False,
                    "storesBriefHash": True,
                    "storesSelectedEntryIds": True,
                },
                "autoArchive": False,
            },
        }
        assert_learning_curation_json(
            json.dumps(learning_curation_usage_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            dry_run=True,
            context=f"{context} usage curation",
            cmd=[
                "design-ai",
                "learn",
                "--curate",
                "--file",
                str(learning_profile_path),
                "--usage-file",
                str(learning_usage_path),
                "--json",
            ],
        )
        applied_learning_curation_payload = {
            **learning_curation_payload,
            "dryRun": False,
            "applied": True,
            "archived": [
                {
                    "id": "learn-b",
                    "category": "workflow",
                    "text": "Prefer release notes that state evidence before claims",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
                {
                    "id": "learn-c",
                    "category": "constraint",
                    "text": "Never include api_key=redacted placeholders in prompt context",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:02.000Z",
                },
            ],
            "after": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
        }
        assert_learning_curation_json(
            json.dumps(applied_learning_curation_payload),
            profile_path=learning_profile_path,
            dry_run=False,
            context=context,
            cmd=["design-ai", "learn", "--curate", "--yes", "--file", str(learning_profile_path), "--json"],
        )
        expect_self_test_failure(
            lambda: assert_learning_audit_cleanup_json(
                json.dumps({**learning_audit_payload, "suggestions": []}),
                profile_path=learning_profile_path,
                context=context,
                cmd=learn_audit_cmd,
            ),
            expected="remove-duplicate suggestion missing",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_audit_fix_json(
                json.dumps({**learning_audit_fix_payload, "cleanup": []}),
                profile_path=learning_profile_path,
                dry_run=True,
                context=context,
                cmd=learn_audit_fix_cmd,
            ),
            expected="learn audit fix cleanup entry missing: learn-b",
            scope="package smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_curation_json(
                json.dumps({**learning_curation_payload, "archiveCount": 1}),
                profile_path=learning_profile_path,
                dry_run=True,
                context=context,
                cmd=learn_curate_cmd,
            ),
            expected="learn curate archive count changed",
            scope="package smoke",
        )
        learn_curate_report_cmd = [
            "design-ai",
            "learn",
            "--curate",
            "--file",
            str(learning_profile_path),
            "--report",
            "--out",
            "learning-curation-report.md",
        ]
        assert_learning_curation_report(
            "\n".join([
                "# Learning Curation Report",
                "- Mode: preview",
                "- Archive candidates: 2",
                "## Archive Candidates",
                "- `learn-b`: duplicate-entry",
                "- `learn-c`: sensitive-content",
                "## Usage Review",
                "Usage sidecars store selected entry ids and short brief hashes",
                "- Review archive candidates, then rerun `design-ai learn --curate --yes` only if the proposed archive actions are correct.",
            ]),
            context=context,
            cmd=learn_curate_report_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_curation_report(
                "# Learning Curation Report\n- Mode: preview\n",
                context=context,
                cmd=learn_curate_report_cmd,
            ),
            expected="learn curate report missing 'Archive candidates: 2'",
            scope="package smoke",
        )
        learn_audit_human_cmd = ["design-ai", "learn", "--audit", "--file", str(learning_profile_path)]
        assert_learning_audit_cleanup_human(
            "\n".join([
                "design-ai learn",
                "Local learning profile audit",
                "Status: warn",
                "Suggested cleanup:",
                "- remove-duplicate (learn-b): Remove the duplicate entry.",
                "  design-ai learn --file /tmp/learning.json --forget learn-b --yes",
                "- remove-or-redact-sensitive-content (learn-c): Remove sensitive content.",
                "  design-ai learn --file /tmp/learning.json --forget learn-c --yes",
            ]),
            context=context,
            cmd=learn_audit_human_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_audit_cleanup_human(
                "Local learning profile audit\nStatus: warn\n",
                context=context,
                cmd=learn_audit_human_cmd,
            ),
            expected="learn audit human output missing 'Suggested cleanup:'",
            scope="package smoke",
        )

    print("Package smoke self-test passed")


def smoke_tarball(tarball: Path) -> None:
    if not tarball.exists():
        raise SystemExit(f"tarball not found: {tarball}")
    if tarball.suffix != ".tgz":
        raise SystemExit(f"expected .tgz tarball, got: {tarball}")

    with tempfile.TemporaryDirectory(prefix="design-ai-package-smoke-") as tmp:
        tmp_root = Path(tmp)
        install_root = tmp_root / "project"
        claude_home = tmp_root / "claude-home"
        npx_root = tmp_root / "npx-project"
        npx_claude_home = tmp_root / "npx-claude-home"
        npm_cache = tmp_root / "npm-cache"
        installed_workspace_strict_root = tmp_root / "installed-workspace-strict"
        npx_workspace_strict_root = tmp_root / "npx-workspace-strict"
        installed_workspace_learning_profile = tmp_root / "installed-workspace-strict-learning.json"
        installed_workspace_learning_eval = tmp_root / "installed-workspace-learning-eval.json"
        installed_workspace_auto_profile = tmp_root / "installed-workspace-auto" / "learning.json"
        installed_workspace_auto_eval = tmp_root / "installed-workspace-auto" / "learning-eval.json"
        npx_workspace_learning_profile = tmp_root / "npx-workspace-strict-learning.json"
        npx_workspace_learning_eval = tmp_root / "npx-workspace-learning-eval.json"
        npx_workspace_auto_profile = tmp_root / "npx-workspace-auto" / "learning.json"
        npx_workspace_auto_eval = tmp_root / "npx-workspace-auto" / "learning-eval.json"
        install_root.mkdir()
        npx_root.mkdir()
        prepare_workspace_strict_repo(installed_workspace_strict_root)
        prepare_workspace_strict_repo(npx_workspace_strict_root)
        write_workspace_learning_eval_fixture(
            installed_workspace_learning_profile,
            installed_workspace_learning_eval,
        )
        write_workspace_learning_eval_fixture(
            installed_workspace_auto_profile,
            installed_workspace_auto_eval,
        )
        write_workspace_learning_eval_fixture(
            npx_workspace_learning_profile,
            npx_workspace_learning_eval,
        )
        write_workspace_learning_eval_fixture(
            npx_workspace_auto_profile,
            npx_workspace_auto_eval,
        )
        write_workspace_restore_backup_fixture(installed_workspace_learning_profile)
        write_workspace_restore_backup_fixture(installed_workspace_auto_profile)
        write_workspace_restore_backup_fixture(npx_workspace_learning_profile)
        write_workspace_restore_backup_fixture(npx_workspace_auto_profile)

        base_env = os.environ.copy()
        base_env.update({
            "npm_config_cache": str(npm_cache),
            "npm_config_update_notifier": "false",
            "npm_config_audit": "false",
            "npm_config_fund": "false",
        })

        run([
            "npm",
            "install",
            "--prefix",
            str(install_root),
            str(tarball),
            "--no-audit",
            "--no-fund",
        ], env=base_env)

        bin_path = install_root / "node_modules" / ".bin" / "design-ai"
        if not bin_path.exists():
            raise SystemExit(f"design-ai bin shim not found: {bin_path}")

        smoke_env = base_env.copy()
        smoke_env.update({
            "CLAUDE_HOME": str(claude_home),
            "DESIGN_AI_PREFIX": "smoke-design-",
            "NO_COLOR": "1",
        })

        assert_version_smoke(
            [str(bin_path), "version"],
            env=smoke_env,
            context="package smoke installed bin version",
        )
        assert_version_json_smoke(
            [str(bin_path), "version", "--json"],
            env=smoke_env,
            context="package smoke installed bin version JSON",
        )
        assert_workspace_json_smoke(
            [str(bin_path), "workspace", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin workspace JSON",
        )
        assert_workspace_strict_failure_smoke(
            [str(bin_path), "workspace", "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin workspace strict JSON failure",
        )
        assert_workspace_strict_success_smoke(
            [
                str(bin_path),
                "workspace",
                "--root",
                str(installed_workspace_strict_root),
                "--learning-file",
                str(installed_workspace_learning_profile),
                "--learning-eval",
                str(installed_workspace_learning_eval),
                "--strict",
                "--json",
            ],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin workspace strict JSON success",
        )
        assert_workspace_restore_backups_smoke(
            [
                str(bin_path),
                "workspace",
                "--root",
                str(installed_workspace_strict_root),
                "--learning-file",
                str(installed_workspace_learning_profile),
                "--learning-eval",
                str(installed_workspace_learning_eval),
                "--strict",
                "--json",
            ],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin workspace restore-backups JSON",
        )
        assert_workspace_strict_success_smoke(
            [
                str(bin_path),
                "workspace",
                "--root",
                str(installed_workspace_strict_root),
                "--learning-file",
                str(installed_workspace_auto_profile),
                "--strict",
                "--json",
            ],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin workspace auto learning-eval JSON success",
        )
        assert_workspace_restore_backups_smoke(
            [
                str(bin_path),
                "workspace",
                "--root",
                str(installed_workspace_strict_root),
                "--learning-file",
                str(installed_workspace_auto_profile),
                "--strict",
                "--json",
            ],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin workspace auto restore-backups JSON",
        )
        assert_site_json_smoke(
            [str(bin_path), "site", "--stdin", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site JSON",
        )
        assert_site_next_actions_json_smoke(
            [str(bin_path), "site", "--stdin", "--next-actions", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site next-actions JSON",
        )
        installed_site_next_actions_out = install_root / "site-next-actions.json"
        assert_site_next_actions_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--stdin",
                "--next-actions",
                "--json",
                "--out",
                str(installed_site_next_actions_out),
                "--force",
            ],
            installed_site_next_actions_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site next-actions JSON out file",
        )
        installed_site_next_actions_human_out = install_root / "site-next-actions.md"
        assert_site_next_actions_human_file_smoke(
            [
                str(bin_path),
                "site",
                "--stdin",
                "--next-actions",
                "--out",
                str(installed_site_next_actions_human_out),
                "--force",
            ],
            installed_site_next_actions_human_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site next-actions human out file",
        )
        assert_site_sample_json_smoke(
            [str(bin_path), "site", "--sample"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site sample JSON",
        )
        assert_site_intake_template_json_smoke(
            [str(bin_path), "site", "--intake-template", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site intake template JSON",
        )
        assert_site_intake_template_markdown_smoke(
            [str(bin_path), "site", "--intake-template"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site intake template Markdown",
        )
        assert_site_intake_template_json_smoke(
            [str(bin_path), "site", "--intake-template", "--language", "ko", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site intake template Korean JSON",
            language="ko",
        )
        assert_site_intake_template_markdown_smoke(
            [str(bin_path), "site", "--intake-template", "--language", "ko"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site intake template Korean Markdown",
            language="ko",
        )
        installed_site_intake_markdown_out = install_root / "company-website-intake.md"
        assert_site_intake_template_markdown_file_smoke(
            [
                str(bin_path),
                "site",
                "--intake-template",
                "--out",
                str(installed_site_intake_markdown_out),
                "--force",
            ],
            installed_site_intake_markdown_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site intake template Markdown out file",
        )
        installed_site_intake_korean_markdown_out = install_root / "company-website-intake.ko.md"
        assert_site_intake_template_markdown_file_smoke(
            [
                str(bin_path),
                "site",
                "--intake-template",
                "--language",
                "ko",
                "--out",
                str(installed_site_intake_korean_markdown_out),
                "--force",
            ],
            installed_site_intake_korean_markdown_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site intake template Korean Markdown out file",
            language="ko",
        )
        installed_site_intake_json_out = install_root / "company-website-intake.json"
        assert_site_intake_template_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--intake-template",
                "--json",
                "--out",
                str(installed_site_intake_json_out),
                "--force",
            ],
            installed_site_intake_json_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site intake template JSON out file",
        )
        assert_site_init_json_smoke(
            [str(bin_path), *SITE_INIT_SMOKE_ARGS],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site init JSON",
        )
        installed_site_from_intake = write_site_from_intake_fixture(install_root)
        assert_site_from_intake_json_smoke(
            [str(bin_path), "site", "--from-intake", str(installed_site_from_intake), "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake JSON",
        )
        assert_site_from_intake_stdin_json_smoke(
            [str(bin_path), "site", "--from-intake", "--stdin", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin JSON",
        )
        installed_site_from_intake_tasks = write_site_from_intake_tasks_fixture(install_root)
        assert_site_from_intake_tasks_json_smoke(
            [str(bin_path), "site", "--from-intake", str(installed_site_from_intake_tasks), "--tasks"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake tasks JSON",
        )
        installed_site_from_intake_stdin_tasks_out = install_root / "site-from-intake-stdin-tasks.json"
        assert_site_from_intake_stdin_tasks_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                "--stdin",
                "--tasks",
                "--out",
                str(installed_site_from_intake_stdin_tasks_out),
                "--force",
            ],
            installed_site_from_intake_stdin_tasks_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin tasks JSON out file",
        )
        assert_site_from_intake_stdin_next_actions_json_smoke(
            [str(bin_path), "site", "--from-intake", "--stdin", "--next-actions", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin next-actions JSON",
        )
        installed_site_from_intake_stdin_next_actions_json_out = install_root / "site-from-intake-stdin-next-actions.json"
        assert_site_from_intake_stdin_next_actions_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                "--stdin",
                "--next-actions",
                "--json",
                "--out",
                str(installed_site_from_intake_stdin_next_actions_json_out),
                "--force",
            ],
            installed_site_from_intake_stdin_next_actions_json_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin next-actions JSON out file",
        )
        installed_site_from_intake_stdin_next_actions_human_out = install_root / "site-from-intake-stdin-next-actions.md"
        assert_site_from_intake_stdin_next_actions_human_file_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                "--stdin",
                "--next-actions",
                "--out",
                str(installed_site_from_intake_stdin_next_actions_human_out),
                "--force",
            ],
            installed_site_from_intake_stdin_next_actions_human_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin next-actions human out file",
        )
        installed_site_from_intake_json_out = install_root / "site-from-intake-workspace.json"
        assert_site_from_intake_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                str(installed_site_from_intake),
                "--out",
                str(installed_site_from_intake_json_out),
                "--force",
            ],
            installed_site_from_intake_json_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake JSON out file",
        )
        installed_site_from_intake_stdin_json_out = install_root / "site-from-intake-stdin-workspace.json"
        assert_site_from_intake_stdin_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                "--stdin",
                "--out",
                str(installed_site_from_intake_stdin_json_out),
                "--force",
            ],
            installed_site_from_intake_stdin_json_out,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin JSON out file",
        )
        installed_site_from_intake_bundle_dir = install_root / "site-from-intake-handoff-bundle"
        assert_site_init_bundle_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                str(installed_site_from_intake),
                "--bundle",
                "--out",
                str(installed_site_from_intake_bundle_dir),
            ],
            out_dir=installed_site_from_intake_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake handoff bundle",
        )
        installed_site_from_intake_task_bundle_dir = install_root / "site-from-intake-task-handoff-bundle"
        assert_site_init_bundle_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                str(installed_site_from_intake_tasks),
                "--bundle",
                "--tasks",
                "--out",
                str(installed_site_from_intake_task_bundle_dir),
            ],
            out_dir=installed_site_from_intake_task_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake task handoff bundle",
            expected_refactor_task_ids=["task-accessibility"],
        )
        installed_site_from_intake_stdin_bundle_dir = install_root / "site-from-intake-stdin-handoff-bundle"
        assert_site_init_bundle_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                "--stdin",
                "--bundle",
                "--out",
                str(installed_site_from_intake_stdin_bundle_dir),
            ],
            out_dir=installed_site_from_intake_stdin_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin handoff bundle",
            input_text=SITE_FROM_INTAKE_SMOKE_MARKDOWN,
        )
        installed_site_from_intake_stdin_task_bundle_dir = install_root / "site-from-intake-stdin-task-handoff-bundle"
        assert_site_init_bundle_smoke(
            [
                str(bin_path),
                "site",
                "--from-intake",
                "--stdin",
                "--bundle",
                "--tasks",
                "--out",
                str(installed_site_from_intake_stdin_task_bundle_dir),
            ],
            out_dir=installed_site_from_intake_stdin_task_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site from-intake stdin task handoff bundle",
            input_text=SITE_FROM_INTAKE_TASKS_SMOKE_MARKDOWN,
            expected_refactor_task_ids=["task-accessibility"],
        )
        installed_site_init_bundle_dir = install_root / "site-init-handoff-bundle"
        assert_site_init_bundle_smoke(
            [str(bin_path), *SITE_INIT_SMOKE_ARGS, "--bundle", "--out", str(installed_site_init_bundle_dir)],
            out_dir=installed_site_init_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site init handoff bundle",
        )
        assert_site_prompt_templates_json_smoke(
            [str(bin_path), "site", "--prompt-list", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site prompt template listing JSON",
        )
        assert_site_mcp_check_json_smoke(
            [str(bin_path), "site", "--stdin", "--mcp-check", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-check JSON",
        )
        installed_site_mcp_check_probes_cmd = [str(bin_path), "site", "--stdin", "--mcp-check", "--probes", "--json"]
        installed_site_mcp_check_probes_payload = assert_site_mcp_check_probes_json_smoke(
            installed_site_mcp_check_probes_cmd,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-check probes JSON",
        )
        assert_site_mcp_check_probes_human_smoke(
            [str(bin_path), "site", "--stdin", "--mcp-check", "--probes"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-check probes human",
        )
        installed_site_mcp_check_probes_human_path = install_root / "installed-site-mcp-check-probes.txt"
        assert_site_mcp_check_probes_human_file_smoke(
            [
                str(bin_path),
                "site",
                "--stdin",
                "--mcp-check",
                "--probes",
                "--out",
                str(installed_site_mcp_check_probes_human_path),
                "--force",
            ],
            installed_site_mcp_check_probes_human_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-check probes human out file",
        )
        installed_site_mcp_check_probes_human_emitted_path = install_root / "installed-site-mcp-check-probes-human-emitted.txt"
        assert_site_mcp_check_probes_human_file_smoke(
            site_mcp_probe_embedded_command(
                installed_site_mcp_check_probes_payload,
                "mcpCheckProbesHumanOut",
                installed_site_mcp_check_probes_cmd,
                output_path=installed_site_mcp_check_probes_human_emitted_path,
                context="package smoke installed bin emitted site mcp-check probes human command",
            ),
            installed_site_mcp_check_probes_human_emitted_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin emitted site mcp-check probes human out file",
        )
        installed_site_mcp_check_probes_json_path = install_root / "installed-site-mcp-check-probes.json"
        assert_site_mcp_check_probes_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--stdin",
                "--mcp-check",
                "--probes",
                "--json",
                "--out",
                str(installed_site_mcp_check_probes_json_path),
                "--force",
            ],
            installed_site_mcp_check_probes_json_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-check probes JSON out file",
        )
        installed_site_mcp_check_probes_emitted_path = install_root / "installed-site-mcp-check-probes-emitted.json"
        assert_site_mcp_check_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                installed_site_mcp_check_probes_payload,
                "mcpCheckProbesJsonOut",
                installed_site_mcp_check_probes_cmd,
                output_path=installed_site_mcp_check_probes_emitted_path,
                context="package smoke installed bin emitted site mcp-check probes command",
            ),
            installed_site_mcp_check_probes_emitted_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin emitted site mcp-check probes JSON out file",
        )
        assert_site_mcp_plan_probes_json_smoke(
            site_mcp_probe_embedded_command(
                installed_site_mcp_check_probes_payload,
                "mcpPlanProbesJson",
                installed_site_mcp_check_probes_cmd,
                context="package smoke installed bin emitted site mcp-plan probes JSON command",
            ),
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin emitted site mcp-plan probes JSON",
        )
        installed_site_mcp_plan_emitted_json_path = install_root / "installed-site-mcp-plan-probes-emitted.json"
        assert_site_mcp_plan_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                installed_site_mcp_check_probes_payload,
                "mcpPlanProbesJsonOut",
                installed_site_mcp_check_probes_cmd,
                output_path=installed_site_mcp_plan_emitted_json_path,
                context="package smoke installed bin emitted site mcp-plan probes output command",
            ),
            installed_site_mcp_plan_emitted_json_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin emitted site mcp-plan probes JSON out file",
        )
        assert_site_mcp_plan_markdown_smoke(
            [str(bin_path), "site", "--stdin", "--mcp-plan"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-plan markdown",
        )
        assert_site_mcp_plan_probes_markdown_smoke(
            [str(bin_path), "site", "--stdin", "--mcp-plan", "--probes"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-plan probes markdown",
        )
        installed_site_mcp_plan_probes_payload = assert_site_mcp_plan_probes_json_smoke(
            [str(bin_path), "site", "--stdin", "--mcp-plan", "--probes", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-plan probes JSON",
        )
        installed_site_mcp_plan_human_emitted_path = install_root / "installed-site-mcp-plan-probes-human-emitted.txt"
        assert_site_mcp_check_probes_human_file_smoke(
            site_mcp_probe_embedded_command(
                installed_site_mcp_plan_probes_payload,
                "mcpCheckProbesHumanOut",
                [str(bin_path), "site", "--stdin", "--mcp-plan", "--probes", "--json"],
                output_path=installed_site_mcp_plan_human_emitted_path,
                context="package smoke installed bin emitted site mcp-plan probes human command",
            ),
            installed_site_mcp_plan_human_emitted_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin emitted site mcp-plan probes human out file",
        )
        installed_site_mcp_plan_check_json_emitted_path = install_root / "installed-site-mcp-plan-probes-check-emitted.json"
        assert_site_mcp_check_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                installed_site_mcp_plan_probes_payload,
                "mcpCheckProbesJsonOut",
                [str(bin_path), "site", "--stdin", "--mcp-plan", "--probes", "--json"],
                output_path=installed_site_mcp_plan_check_json_emitted_path,
                context="package smoke installed bin emitted site mcp-plan probes check JSON command",
            ),
            installed_site_mcp_plan_check_json_emitted_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin emitted site mcp-plan probes check JSON out file",
        )
        installed_site_mcp_plan_json_emitted_path = install_root / "installed-site-mcp-plan-probes-plan-emitted.json"
        assert_site_mcp_plan_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                installed_site_mcp_plan_probes_payload,
                "mcpPlanProbesJsonOut",
                [str(bin_path), "site", "--stdin", "--mcp-plan", "--probes", "--json"],
                output_path=installed_site_mcp_plan_json_emitted_path,
                context="package smoke installed bin emitted site mcp-plan probes plan JSON command",
            ),
            installed_site_mcp_plan_json_emitted_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin emitted site mcp-plan probes plan JSON out file",
        )
        installed_site_mcp_plan_json_path = install_root / "installed-site-mcp-plan-probes.json"
        assert_site_mcp_plan_probes_json_file_smoke(
            [
                str(bin_path),
                "site",
                "--stdin",
                "--mcp-plan",
                "--probes",
                "--json",
                "--out",
                str(installed_site_mcp_plan_json_path),
                "--force",
            ],
            installed_site_mcp_plan_json_path,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site mcp-plan probes JSON out file",
        )
        assert_site_workflow_graph_json_smoke(
            [str(bin_path), "site", "--stdin", "--graph", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site workflow graph JSON",
        )
        assert_site_report_evidence_markdown_smoke(
            [str(bin_path), "site", "--stdin", "--report"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site evidence report markdown",
        )
        assert_site_tasks_evidence_json_smoke(
            [str(bin_path), "site", "--stdin", "--tasks"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site evidence tasks JSON",
        )
        installed_site_bundle_dir = install_root / "installed-site-handoff-bundle"
        assert_site_bundle_smoke(
            [str(bin_path), "site", "--stdin", "--bundle", "--out", str(installed_site_bundle_dir)],
            out_dir=installed_site_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site handoff bundle",
        )
        installed_site_evidence_bundle_dir = install_root / "installed-site-evidence-handoff-bundle"
        assert_site_bundle_evidence_smoke(
            [str(bin_path), "site", "--stdin", "--bundle", "--out", str(installed_site_evidence_bundle_dir)],
            out_dir=installed_site_evidence_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site evidence handoff bundle",
        )
        assert_site_bundle_check_json_smoke(
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-check", "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site bundle-check JSON",
        )
        assert_site_bundle_compare_json_smoke(
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-compare", str(installed_site_bundle_dir), "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site bundle-compare JSON",
        )
        installed_site_warning_bundle_dir = install_root / "installed-site-warning-handoff-bundle"
        assert_site_warning_bundle_smoke(
            [str(bin_path), "site", "--stdin", "--bundle", "--out", str(installed_site_warning_bundle_dir)],
            out_dir=installed_site_warning_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site warning handoff bundle",
        )
        assert_site_bundle_compare_warning_strict_smoke(
            [
                str(bin_path),
                "site",
                str(installed_site_warning_bundle_dir),
                "--bundle-compare",
                str(installed_site_warning_bundle_dir),
                "--strict",
                "--json",
            ],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site warning bundle-compare strict JSON",
        )
        assert_site_bundle_handoff_json_smoke(
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-handoff", "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site bundle-handoff JSON",
        )
        assert_site_bundle_handoff_human_smoke(
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-handoff", "--strict"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site bundle-handoff human",
        )
        assert_site_bundle_handoff_json_smoke(
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-handoff", "--task", "task-content-quality", "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site bundle-handoff selected task JSON",
            expected_task_id="task-content-quality",
            expected_selected_task_id="task-content-quality",
        )
        assert_site_bundle_handoff_human_smoke(
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-handoff", "--task", "task-content-quality", "--strict"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site bundle-handoff selected task human",
            expected_task_id="task-content-quality",
            expected_selected_task_id="task-content-quality",
        )
        assert_site_bundle_repair_json_smoke(
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-repair", "--json"],
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-repair", "--yes", "--json"],
            [str(bin_path), "site", str(installed_site_bundle_dir), "--bundle-check", "--strict", "--json"],
            bundle_dir=installed_site_bundle_dir,
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site bundle-repair JSON",
        )
        assert_site_bundle_check_json_smoke(
            [str(bin_path), "site", str(installed_site_evidence_bundle_dir), "--bundle-check", "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site evidence bundle-check JSON",
            expected_evidence_counts=SITE_EVIDENCE_COUNTS,
        )
        assert_site_bundle_compare_json_smoke(
            [str(bin_path), "site", str(installed_site_evidence_bundle_dir), "--bundle-compare", str(installed_site_evidence_bundle_dir), "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site evidence bundle-compare JSON",
            expected_evidence_counts=SITE_EVIDENCE_COUNTS,
        )
        assert_site_bundle_handoff_json_smoke(
            [str(bin_path), "site", str(installed_site_evidence_bundle_dir), "--bundle-handoff", "--strict", "--json"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site evidence bundle-handoff JSON",
            expected_evidence_counts=SITE_EVIDENCE_COUNTS,
        )
        assert_site_tasks_json_smoke(
            [str(bin_path), "site", "--stdin", "--tasks"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site tasks JSON",
        )
        assert_site_prompt_markdown_smoke(
            [str(bin_path), "site", "--stdin", "--prompt", "codex-implementation", "--task", "task-homepage-cta"],
            cwd=install_root,
            env=smoke_env,
            context="package smoke installed bin site task-selected prompt markdown",
        )
        assert_main_help_smoke(
            [str(bin_path), "help"],
            env=smoke_env,
            context="package smoke installed bin main help",
        )
        run_expected_failure(
            [str(bin_path), EXPECTED_UNKNOWN_COMMAND],
            env=smoke_env,
            context="package smoke installed bin unknown command",
        )
        run_expected_failure(
            [str(bin_path), "help", EXPECTED_UNKNOWN_HELP_TOPIC],
            env=smoke_env,
            context="package smoke installed bin unknown help topic",
            assertion=assert_unknown_help_topic_failure,
        )
        run_expected_failure(
            [str(bin_path), "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
            env=smoke_env,
            context="package smoke installed bin unknown list domain",
            assertion=assert_unknown_list_domain_failure,
        )
        unknown_route_smokes = (
            ("prompt", [str(bin_path), "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID]),
            ("pack", [str(bin_path), "pack", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID]),
            ("examples", [str(bin_path), "examples", "--route", EXPECTED_UNKNOWN_ROUTE_ID]),
            ("check", [str(bin_path), "check", "--examples", "--route", EXPECTED_UNKNOWN_ROUTE_ID]),
        )
        for label, command in unknown_route_smokes:
            run_expected_failure(
                command,
                env=smoke_env,
                context=f"package smoke installed bin unknown route id {label}",
                assertion=assert_unknown_route_id_failure,
            )
        for command_name, option, suggestion in EXPECTED_UNKNOWN_OPTION_SMOKES:
            assert_unknown_option_smoke(
                [str(bin_path), *unknown_option_args(command_name, option)],
                command_name=command_name,
                option=option,
                suggestion=suggestion,
                env=smoke_env,
                context=f"package smoke installed bin unknown {command_name} option",
            )
        run_expected_failure(
            [str(bin_path), "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", EXPECTED_UNKNOWN_SEARCH_DIR],
            env=smoke_env,
            context="package smoke installed bin unknown search dir value",
            assertion=assert_search_dir_value_failure,
        )
        for label, args, expected_message in EXPECTED_NUMERIC_VALUE_SMOKES:
            assert_numeric_value_smoke(
                [str(bin_path), *args],
                expected_message=expected_message,
                env=smoke_env,
                context=f"package smoke installed bin invalid numeric value {label}",
            )
        help_topics = read_help_topics([str(bin_path), "help", "--json"], env=smoke_env)
        for topic in help_topics:
            assert_help_topic_smoke(
                [str(bin_path), "help", topic],
                topic=topic,
                env=smoke_env,
                context=f"package smoke installed bin help topic {topic}",
            )
        for alias in EXPECTED_HELP_ALIASES:
            assert_help_topic_smoke(
                [str(bin_path), "help", alias],
                topic=alias,
                env=smoke_env,
                context=f"package smoke installed bin help alias {alias}",
            )
        for command in EXPECTED_COMMAND_ALIAS_COMMANDS:
            assert_command_alias_smoke(
                [str(bin_path), *command],
                command=command,
                env=smoke_env,
                context=f"package smoke installed bin command alias {' '.join(command)}",
            )
        assert_functional_alias_smokes(
            lambda *args: [str(bin_path), *args],
            run_command=run_plain,
            env=smoke_env,
            context="package smoke installed bin functional alias",
        )
        assert_help_topic_smoke(
            [str(bin_path), "routes", "--help"],
            topic="routes",
            env=smoke_env,
            context="package smoke installed bin routes help flag",
        )
        assert_help_topic_smoke(
            [str(bin_path), "install", "--help"],
            topic="install",
            env=smoke_env,
            context="package smoke installed bin install help flag",
        )
        for kind in ("skills", "commands", "agents"):
            assert_list_smoke(
                [str(bin_path), "list", kind],
                kind=kind,
                env=smoke_env,
                context=f"package smoke installed bin list {kind}",
            )
            assert_list_json_smoke(
                [str(bin_path), "list", kind, "--json"],
                kind=kind,
                env=smoke_env,
                context=f"package smoke installed bin list {kind} JSON",
            )
        assert_search_smoke(
            [str(bin_path), "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"],
            env=smoke_env,
            context="package smoke installed bin search corpus",
        )
        assert_search_human_smoke(
            [str(bin_path), "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1"],
            env=smoke_env,
            context="package smoke installed bin search human corpus",
        )
        assert_show_smoke(
            [str(bin_path), "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"],
            env=smoke_env,
            context="package smoke installed bin show corpus",
        )
        assert_show_human_smoke(
            [str(bin_path), "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0"],
            env=smoke_env,
            context="package smoke installed bin show human corpus",
        )
        assert_show_range_smoke(
            [
                str(bin_path),
                "show",
                EXPECTED_CORPUS_SHOW_REL_PATH,
                "--lines",
                EXPECTED_CORPUS_SHOW_RANGE,
                "--json",
            ],
            env=smoke_env,
            context="package smoke installed bin show line range",
        )
        assert_show_human_range_smoke(
            [str(bin_path), "show", EXPECTED_CORPUS_SHOW_REL_PATH, "--lines", EXPECTED_CORPUS_SHOW_RANGE],
            env=smoke_env,
            context="package smoke installed bin show human line range",
        )
        assert_route_catalog_smoke(
            [str(bin_path), "routes", "--json"],
            env=smoke_env,
            context="package smoke installed bin routes catalog",
        )
        assert_route_catalog_smoke(
            [str(bin_path), "route", "--list", "--json"],
            env=smoke_env,
            context="package smoke installed bin route list catalog",
        )
        assert_route_smoke(
            [str(bin_path), "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"],
            env=smoke_env,
            context="package smoke installed bin route recommendation",
        )
        assert_route_explain_smoke(
            [str(bin_path), "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--explain"],
            env=smoke_env,
            context="package smoke installed bin route explanation",
        )
        installed_route_brief = tmp_root / "installed-route-brief.md"
        write_smoke_brief(installed_route_brief)
        assert_route_smoke(
            [str(bin_path), "route", "--from-file", str(installed_route_brief), "--limit", "1", "--json"],
            env=smoke_env,
            context="package smoke installed bin route from file",
        )
        assert_route_stdin_smoke(
            [str(bin_path), "route", "--stdin", "--limit", "1", "--json"],
            env=smoke_env,
            context="package smoke installed bin route stdin",
        )
        assert_route_eval_smoke(
            lambda *args: [str(bin_path), *args],
            env=smoke_env,
            context="package smoke installed bin route eval",
        )
        installed_prompt_json = tmp_root / "installed-prompt.json"
        assert_prompt_smoke(
            [
                str(bin_path),
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(installed_prompt_json),
                "--force",
            ],
            installed_prompt_json,
            env=smoke_env,
            context="package smoke installed bin prompt plan",
        )
        assert_prompt_stdout_smoke(
            [
                str(bin_path),
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
            ],
            env=smoke_env,
            context="package smoke installed bin prompt stdout",
        )
        assert_prompt_markdown_smoke(
            [
                str(bin_path),
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
            ],
            env=smoke_env,
            context="package smoke installed bin prompt markdown stdout",
        )
        installed_prompt_markdown = tmp_root / "installed-prompt.md"
        assert_prompt_markdown_file_smoke(
            [
                str(bin_path),
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--out",
                str(installed_prompt_markdown),
                "--force",
            ],
            installed_prompt_markdown,
            env=smoke_env,
            context="package smoke installed bin prompt markdown file",
        )
        assert_output_overwrite_smoke(
            [
                str(bin_path),
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--out",
                str(installed_prompt_markdown),
            ],
            installed_prompt_markdown,
            env=smoke_env,
            context="package smoke installed bin prompt output overwrite",
        )
        installed_prompt_file_json = tmp_root / "installed-prompt-from-file.json"
        assert_prompt_smoke(
            [
                str(bin_path),
                "prompt",
                "--from-file",
                str(installed_route_brief),
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(installed_prompt_file_json),
                "--force",
            ],
            installed_prompt_file_json,
            env=smoke_env,
            context="package smoke installed bin prompt from file",
        )
        installed_prompt_stdin_json = tmp_root / "installed-prompt-stdin.json"
        assert_prompt_stdin_smoke(
            [
                str(bin_path),
                "prompt",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(installed_prompt_stdin_json),
                "--force",
            ],
            installed_prompt_stdin_json,
            env=smoke_env,
            context="package smoke installed bin prompt stdin",
        )
        assert_prompt_eval_smoke(
            lambda *args: [str(bin_path), *args],
            env=smoke_env,
            context="package smoke installed bin prompt eval",
        )
        installed_pack_json = tmp_root / "installed-pack.json"
        assert_pack_smoke(
            [
                str(bin_path),
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(installed_pack_json),
                "--force",
            ],
            installed_pack_json,
            env=smoke_env,
            context="package smoke installed bin prompt pack",
        )
        assert_pack_stdout_smoke(
            [
                str(bin_path),
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
            ],
            env=smoke_env,
            context="package smoke installed bin pack stdout",
        )
        assert_pack_markdown_smoke(
            [
                str(bin_path),
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
            ],
            env=smoke_env,
            context="package smoke installed bin pack markdown stdout",
        )
        installed_pack_markdown = tmp_root / "installed-pack.md"
        assert_pack_markdown_file_smoke(
            [
                str(bin_path),
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--out",
                str(installed_pack_markdown),
                "--force",
            ],
            installed_pack_markdown,
            env=smoke_env,
            context="package smoke installed bin pack markdown file",
        )
        assert_output_overwrite_smoke(
            [
                str(bin_path),
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--out",
                str(installed_pack_markdown),
            ],
            installed_pack_markdown,
            env=smoke_env,
            context="package smoke installed bin pack output overwrite",
        )
        installed_pack_file_json = tmp_root / "installed-pack-from-file.json"
        assert_pack_smoke(
            [
                str(bin_path),
                "pack",
                "--from-file",
                str(installed_route_brief),
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(installed_pack_file_json),
                "--force",
            ],
            installed_pack_file_json,
            env=smoke_env,
            context="package smoke installed bin pack from file",
        )
        installed_pack_stdin_json = tmp_root / "installed-pack-stdin.json"
        assert_pack_stdin_smoke(
            [
                str(bin_path),
                "pack",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(installed_pack_stdin_json),
                "--force",
            ],
            installed_pack_stdin_json,
            env=smoke_env,
            context="package smoke installed bin pack stdin",
        )
        assert_pack_eval_smoke(
            lambda *args: [str(bin_path), *args],
            env=smoke_env,
            context="package smoke installed bin pack eval",
        )
        assert_examples_smoke(
            [str(bin_path), "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1", "--json"],
            env=smoke_env,
            context="package smoke installed bin examples corpus",
        )
        assert_examples_human_smoke(
            [str(bin_path), "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1"],
            env=smoke_env,
            context="package smoke installed bin examples human corpus",
        )
        assert_check_examples_smoke(
            [
                str(bin_path),
                "check",
                "--examples",
                "--route",
                EXPECTED_ROUTE_ID,
                "--limit",
                str(EXPECTED_CHECK_EXAMPLES_LIMIT),
                "--strict",
                "--json",
            ],
            env=smoke_env,
            context="package smoke installed bin check examples",
        )
        assert_check_all_routes_issues_only_smoke(
            [
                str(bin_path),
                "check",
                "--examples",
                "--all-routes",
                "--limit",
                "1",
                "--issues-only",
            ],
            env=smoke_env,
            context="package smoke installed bin check all routes issues only",
        )
        installed_check_artifact = tmp_root / EXPECTED_CHECK_ARTIFACT_NAME
        write_check_artifact(installed_check_artifact)
        assert_check_artifact_smoke(
            [
                str(bin_path),
                "check",
                str(installed_check_artifact),
                "--route",
                EXPECTED_ROUTE_ID,
                "--strict",
                "--json",
            ],
            env=smoke_env,
            context="package smoke installed bin check artifact",
        )
        assert_check_stdin_smoke(
            [
                str(bin_path),
                "check",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--strict",
                "--json",
            ],
            env=smoke_env,
            context="package smoke installed bin check stdin",
        )
        installed_check_learning_artifact = tmp_root / "installed-check-learning.md"
        installed_check_learning_profile = tmp_root / "installed-check-learning.json"
        write_check_learning_capture_artifact(installed_check_learning_artifact)
        assert_check_learning_capture_smoke(
            [
                str(bin_path),
                "check",
                str(installed_check_learning_artifact),
                "--learn",
                "--yes",
                "--learning-file",
                str(installed_check_learning_profile),
                "--json",
            ],
            profile_path=installed_check_learning_profile,
            expected_file_suffix=installed_check_learning_artifact.name,
            env=smoke_env,
            context="package smoke installed bin check learning capture",
        )
        assert_audit_smoke(
            [str(bin_path), "audit", "--strict", "--quiet"],
            env=smoke_env,
            context="package smoke installed bin audit strict",
        )
        assert_audit_json_smoke(
            [str(bin_path), "audit", "--strict", "--quiet", "--json"],
            env=smoke_env,
            context="package smoke installed bin audit JSON",
        )
        assert_learning_feedback_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-feedback-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn feedback",
        )
        assert_learning_init_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-init-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn init",
        )
        assert_learning_import_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-import-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn import",
        )
        assert_learning_backup_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-backup-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn backup",
        )
        assert_learning_redact_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-redact-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn redact",
        )
        assert_learning_verify_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-verify-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn verify",
        )
        assert_learning_diff_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-diff-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn diff",
        )
        assert_learning_restore_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-restore-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn restore",
        )
        assert_learning_stats_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-stats-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn stats",
        )
        assert_learning_audit_cleanup_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn audit cleanup",
        )
        assert_learning_curation_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-curate-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn curation",
        )
        assert_learning_relevance_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-learning-relevance.json",
            env=smoke_env,
            context="package smoke installed bin learning relevance",
        )
        assert_update_dry_run_smoke(
            [str(bin_path), "update", "--dry-run"],
            env=smoke_env,
            context="package smoke installed bin update dry run",
        )
        assert_update_dry_run_json_smoke(
            [str(bin_path), "update", "--dry-run", "--json"],
            prefix="smoke-design-",
            env=smoke_env,
            context="package smoke installed bin update dry-run JSON",
        )
        assert_install_smoke(
            [str(bin_path), "install"],
            env=smoke_env,
            context="package smoke installed bin install",
        )
        assert_doctor_clean(bin_path, smoke_env)
        assert_doctor_strict_smoke(
            [str(bin_path), "doctor", "--strict"],
            env=smoke_env,
            context="package smoke installed bin doctor strict",
        )
        assert_status_smoke(
            [str(bin_path), "status"],
            env=smoke_env,
            context="package smoke installed bin status",
        )
        assert_status_json_smoke(
            [str(bin_path), "status", "--json"],
            prefix="smoke-design-",
            env=smoke_env,
            context="package smoke installed bin status JSON",
        )
        assert_uninstall_smoke(
            [str(bin_path), "uninstall"],
            env=smoke_env,
            context="package smoke installed bin uninstall",
        )
        assert_install_json_smoke(
            [str(bin_path), "install", "--json"],
            prefix="smoke-design-",
            env=smoke_env,
            context="package smoke installed bin install JSON",
        )
        assert_uninstall_json_smoke(
            [str(bin_path), "uninstall", "--json"],
            prefix="smoke-design-",
            env=smoke_env,
            context="package smoke installed bin uninstall JSON",
        )

        npx_env = base_env.copy()
        npx_env.update({
            "CLAUDE_HOME": str(npx_claude_home),
            "DESIGN_AI_PREFIX": "npx-design-",
            "NO_COLOR": "1",
        })
        assert_version_smoke(
            npm_exec_cmd(tarball, "version"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec version",
        )
        assert_version_json_smoke(
            npm_exec_cmd(tarball, "version", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec version JSON",
        )
        assert_workspace_json_smoke(
            npm_exec_cmd(tarball, "workspace", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec workspace JSON",
        )
        assert_workspace_strict_failure_smoke(
            npm_exec_cmd(tarball, "workspace", "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec workspace strict JSON failure",
        )
        assert_workspace_strict_success_smoke(
            npm_exec_cmd(
                tarball,
                "workspace",
                "--root",
                str(npx_workspace_strict_root),
                "--learning-file",
                str(npx_workspace_learning_profile),
                "--learning-eval",
                str(npx_workspace_learning_eval),
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec workspace strict JSON success",
        )
        assert_workspace_restore_backups_smoke(
            npm_exec_cmd(
                tarball,
                "workspace",
                "--root",
                str(npx_workspace_strict_root),
                "--learning-file",
                str(npx_workspace_learning_profile),
                "--learning-eval",
                str(npx_workspace_learning_eval),
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec workspace restore-backups JSON",
        )
        assert_workspace_strict_success_smoke(
            npm_exec_cmd(
                tarball,
                "workspace",
                "--root",
                str(npx_workspace_strict_root),
                "--learning-file",
                str(npx_workspace_auto_profile),
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec workspace auto learning-eval JSON success",
        )
        assert_workspace_restore_backups_smoke(
            npm_exec_cmd(
                tarball,
                "workspace",
                "--root",
                str(npx_workspace_strict_root),
                "--learning-file",
                str(npx_workspace_auto_profile),
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec workspace auto restore-backups JSON",
        )
        assert_site_json_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site JSON",
        )
        assert_site_next_actions_json_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--next-actions", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site next-actions JSON",
        )
        npx_site_next_actions_out = npx_root / "site-next-actions.json"
        assert_site_next_actions_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--stdin",
                "--next-actions",
                "--json",
                "--out",
                str(npx_site_next_actions_out),
                "--force",
            ),
            npx_site_next_actions_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site next-actions JSON out file",
        )
        npx_site_next_actions_human_out = npx_root / "site-next-actions.md"
        assert_site_next_actions_human_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--stdin",
                "--next-actions",
                "--out",
                str(npx_site_next_actions_human_out),
                "--force",
            ),
            npx_site_next_actions_human_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site next-actions human out file",
        )
        assert_site_sample_json_smoke(
            npm_exec_cmd(tarball, "site", "--sample"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site sample JSON",
        )
        assert_site_intake_template_json_smoke(
            npm_exec_cmd(tarball, "site", "--intake-template", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site intake template JSON",
        )
        assert_site_intake_template_markdown_smoke(
            npm_exec_cmd(tarball, "site", "--intake-template"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site intake template Markdown",
        )
        assert_site_intake_template_json_smoke(
            npm_exec_cmd(tarball, "site", "--intake-template", "--language", "ko", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site intake template Korean JSON",
            language="ko",
        )
        assert_site_intake_template_markdown_smoke(
            npm_exec_cmd(tarball, "site", "--intake-template", "--language", "ko"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site intake template Korean Markdown",
            language="ko",
        )
        npx_site_intake_markdown_out = npx_root / "company-website-intake.md"
        assert_site_intake_template_markdown_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--intake-template",
                "--out",
                str(npx_site_intake_markdown_out),
                "--force",
            ),
            npx_site_intake_markdown_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site intake template Markdown out file",
        )
        npx_site_intake_json_out = npx_root / "company-website-intake.json"
        assert_site_intake_template_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--intake-template",
                "--json",
                "--out",
                str(npx_site_intake_json_out),
                "--force",
            ),
            npx_site_intake_json_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site intake template JSON out file",
        )
        assert_site_init_json_smoke(
            npm_exec_cmd(tarball, *SITE_INIT_SMOKE_ARGS),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site init JSON",
        )
        npx_site_from_intake = write_site_from_intake_fixture(npx_root)
        assert_site_from_intake_json_smoke(
            npm_exec_cmd(tarball, "site", "--from-intake", str(npx_site_from_intake), "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake JSON",
        )
        assert_site_from_intake_stdin_json_smoke(
            npm_exec_cmd(tarball, "site", "--from-intake", "--stdin", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin JSON",
        )
        npx_site_from_intake_tasks = write_site_from_intake_tasks_fixture(npx_root)
        assert_site_from_intake_tasks_json_smoke(
            npm_exec_cmd(tarball, "site", "--from-intake", str(npx_site_from_intake_tasks), "--tasks"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake tasks JSON",
        )
        npx_site_from_intake_stdin_tasks_out = npx_root / "site-from-intake-stdin-tasks.json"
        assert_site_from_intake_stdin_tasks_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                "--stdin",
                "--tasks",
                "--out",
                str(npx_site_from_intake_stdin_tasks_out),
                "--force",
            ),
            npx_site_from_intake_stdin_tasks_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin tasks JSON out file",
        )
        assert_site_from_intake_stdin_next_actions_json_smoke(
            npm_exec_cmd(tarball, "site", "--from-intake", "--stdin", "--next-actions", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin next-actions JSON",
        )
        npx_site_from_intake_stdin_next_actions_json_out = npx_root / "site-from-intake-stdin-next-actions.json"
        assert_site_from_intake_stdin_next_actions_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                "--stdin",
                "--next-actions",
                "--json",
                "--out",
                str(npx_site_from_intake_stdin_next_actions_json_out),
                "--force",
            ),
            npx_site_from_intake_stdin_next_actions_json_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin next-actions JSON out file",
        )
        npx_site_from_intake_stdin_next_actions_human_out = npx_root / "site-from-intake-stdin-next-actions.md"
        assert_site_from_intake_stdin_next_actions_human_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                "--stdin",
                "--next-actions",
                "--out",
                str(npx_site_from_intake_stdin_next_actions_human_out),
                "--force",
            ),
            npx_site_from_intake_stdin_next_actions_human_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin next-actions human out file",
        )
        npx_site_from_intake_json_out = npx_root / "site-from-intake-workspace.json"
        assert_site_from_intake_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                str(npx_site_from_intake),
                "--out",
                str(npx_site_from_intake_json_out),
                "--force",
            ),
            npx_site_from_intake_json_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake JSON out file",
        )
        npx_site_from_intake_stdin_json_out = npx_root / "site-from-intake-stdin-workspace.json"
        assert_site_from_intake_stdin_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                "--stdin",
                "--out",
                str(npx_site_from_intake_stdin_json_out),
                "--force",
            ),
            npx_site_from_intake_stdin_json_out,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin JSON out file",
        )
        npx_site_from_intake_bundle_dir = npx_root / "site-from-intake-handoff-bundle"
        assert_site_init_bundle_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                str(npx_site_from_intake),
                "--bundle",
                "--out",
                str(npx_site_from_intake_bundle_dir),
            ),
            out_dir=npx_site_from_intake_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake handoff bundle",
        )
        npx_site_from_intake_task_bundle_dir = npx_root / "site-from-intake-task-handoff-bundle"
        assert_site_init_bundle_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                str(npx_site_from_intake_tasks),
                "--bundle",
                "--tasks",
                "--out",
                str(npx_site_from_intake_task_bundle_dir),
            ),
            out_dir=npx_site_from_intake_task_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake task handoff bundle",
            expected_refactor_task_ids=["task-accessibility"],
        )
        npx_site_from_intake_stdin_bundle_dir = npx_root / "site-from-intake-stdin-handoff-bundle"
        assert_site_init_bundle_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                "--stdin",
                "--bundle",
                "--out",
                str(npx_site_from_intake_stdin_bundle_dir),
            ),
            out_dir=npx_site_from_intake_stdin_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin handoff bundle",
            input_text=SITE_FROM_INTAKE_SMOKE_MARKDOWN,
        )
        npx_site_from_intake_stdin_task_bundle_dir = npx_root / "site-from-intake-stdin-task-handoff-bundle"
        assert_site_init_bundle_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--from-intake",
                "--stdin",
                "--bundle",
                "--tasks",
                "--out",
                str(npx_site_from_intake_stdin_task_bundle_dir),
            ),
            out_dir=npx_site_from_intake_stdin_task_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site from-intake stdin task handoff bundle",
            input_text=SITE_FROM_INTAKE_TASKS_SMOKE_MARKDOWN,
            expected_refactor_task_ids=["task-accessibility"],
        )
        npx_site_init_bundle_dir = npx_root / "site-init-handoff-bundle"
        assert_site_init_bundle_smoke(
            npm_exec_cmd(tarball, *SITE_INIT_SMOKE_ARGS, "--bundle", "--out", str(npx_site_init_bundle_dir)),
            out_dir=npx_site_init_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site init handoff bundle",
        )
        assert_site_prompt_templates_json_smoke(
            npm_exec_cmd(tarball, "site", "--prompt-list", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site prompt template listing JSON",
        )
        assert_site_mcp_check_json_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--mcp-check", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-check JSON",
        )
        npx_site_mcp_check_probes_cmd = npm_exec_cmd(tarball, "site", "--stdin", "--mcp-check", "--probes", "--json")
        npx_site_mcp_check_probes_payload = assert_site_mcp_check_probes_json_smoke(
            npx_site_mcp_check_probes_cmd,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-check probes JSON",
        )
        assert_site_mcp_check_probes_human_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--mcp-check", "--probes"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-check probes human",
        )
        npx_site_mcp_check_probes_human_path = npx_root / "npx-site-mcp-check-probes.txt"
        assert_site_mcp_check_probes_human_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--stdin",
                "--mcp-check",
                "--probes",
                "--out",
                str(npx_site_mcp_check_probes_human_path),
                "--force",
            ),
            npx_site_mcp_check_probes_human_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-check probes human out file",
        )
        npx_site_mcp_check_probes_human_emitted_path = npx_root / "npx-site-mcp-check-probes-human-emitted.txt"
        assert_site_mcp_check_probes_human_file_smoke(
            site_mcp_probe_embedded_command(
                npx_site_mcp_check_probes_payload,
                "mcpCheckProbesHumanOut",
                npx_site_mcp_check_probes_cmd,
                output_path=npx_site_mcp_check_probes_human_emitted_path,
                context="package smoke npm exec emitted site mcp-check probes human command",
            ),
            npx_site_mcp_check_probes_human_emitted_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec emitted site mcp-check probes human out file",
        )
        npx_site_mcp_check_probes_json_path = npx_root / "npx-site-mcp-check-probes.json"
        assert_site_mcp_check_probes_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--stdin",
                "--mcp-check",
                "--probes",
                "--json",
                "--out",
                str(npx_site_mcp_check_probes_json_path),
                "--force",
            ),
            npx_site_mcp_check_probes_json_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-check probes JSON out file",
        )
        npx_site_mcp_check_probes_emitted_path = npx_root / "npx-site-mcp-check-probes-emitted.json"
        assert_site_mcp_check_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                npx_site_mcp_check_probes_payload,
                "mcpCheckProbesJsonOut",
                npx_site_mcp_check_probes_cmd,
                output_path=npx_site_mcp_check_probes_emitted_path,
                context="package smoke npm exec emitted site mcp-check probes command",
            ),
            npx_site_mcp_check_probes_emitted_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec emitted site mcp-check probes JSON out file",
        )
        assert_site_mcp_plan_probes_json_smoke(
            site_mcp_probe_embedded_command(
                npx_site_mcp_check_probes_payload,
                "mcpPlanProbesJson",
                npx_site_mcp_check_probes_cmd,
                context="package smoke npm exec emitted site mcp-plan probes JSON command",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec emitted site mcp-plan probes JSON",
        )
        npx_site_mcp_plan_emitted_json_path = npx_root / "npx-site-mcp-plan-probes-emitted.json"
        assert_site_mcp_plan_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                npx_site_mcp_check_probes_payload,
                "mcpPlanProbesJsonOut",
                npx_site_mcp_check_probes_cmd,
                output_path=npx_site_mcp_plan_emitted_json_path,
                context="package smoke npm exec emitted site mcp-plan probes output command",
            ),
            npx_site_mcp_plan_emitted_json_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec emitted site mcp-plan probes JSON out file",
        )
        assert_site_mcp_plan_markdown_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--mcp-plan"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-plan markdown",
        )
        assert_site_mcp_plan_probes_markdown_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--mcp-plan", "--probes"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-plan probes markdown",
        )
        npx_site_mcp_plan_probes_payload = assert_site_mcp_plan_probes_json_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--mcp-plan", "--probes", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-plan probes JSON",
        )
        npx_site_mcp_plan_human_emitted_path = npx_root / "npx-site-mcp-plan-probes-human-emitted.txt"
        assert_site_mcp_check_probes_human_file_smoke(
            site_mcp_probe_embedded_command(
                npx_site_mcp_plan_probes_payload,
                "mcpCheckProbesHumanOut",
                npm_exec_cmd(tarball, "site", "--stdin", "--mcp-plan", "--probes", "--json"),
                output_path=npx_site_mcp_plan_human_emitted_path,
                context="package smoke npm exec emitted site mcp-plan probes human command",
            ),
            npx_site_mcp_plan_human_emitted_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec emitted site mcp-plan probes human out file",
        )
        npx_site_mcp_plan_check_json_emitted_path = npx_root / "npx-site-mcp-plan-probes-check-emitted.json"
        assert_site_mcp_check_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                npx_site_mcp_plan_probes_payload,
                "mcpCheckProbesJsonOut",
                npm_exec_cmd(tarball, "site", "--stdin", "--mcp-plan", "--probes", "--json"),
                output_path=npx_site_mcp_plan_check_json_emitted_path,
                context="package smoke npm exec emitted site mcp-plan probes check JSON command",
            ),
            npx_site_mcp_plan_check_json_emitted_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec emitted site mcp-plan probes check JSON out file",
        )
        npx_site_mcp_plan_json_emitted_path = npx_root / "npx-site-mcp-plan-probes-plan-emitted.json"
        assert_site_mcp_plan_probes_json_file_smoke(
            site_mcp_probe_embedded_command(
                npx_site_mcp_plan_probes_payload,
                "mcpPlanProbesJsonOut",
                npm_exec_cmd(tarball, "site", "--stdin", "--mcp-plan", "--probes", "--json"),
                output_path=npx_site_mcp_plan_json_emitted_path,
                context="package smoke npm exec emitted site mcp-plan probes plan JSON command",
            ),
            npx_site_mcp_plan_json_emitted_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec emitted site mcp-plan probes plan JSON out file",
        )
        npx_site_mcp_plan_json_path = npx_root / "npx-site-mcp-plan-probes.json"
        assert_site_mcp_plan_probes_json_file_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                "--stdin",
                "--mcp-plan",
                "--probes",
                "--json",
                "--out",
                str(npx_site_mcp_plan_json_path),
                "--force",
            ),
            npx_site_mcp_plan_json_path,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site mcp-plan probes JSON out file",
        )
        assert_site_workflow_graph_json_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--graph", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site workflow graph JSON",
        )
        assert_site_report_evidence_markdown_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--report"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site evidence report markdown",
        )
        assert_site_tasks_evidence_json_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--tasks"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site evidence tasks JSON",
        )
        npx_site_bundle_dir = npx_root / "npx-site-handoff-bundle"
        assert_site_bundle_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--bundle", "--out", str(npx_site_bundle_dir)),
            out_dir=npx_site_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site handoff bundle",
        )
        npx_site_evidence_bundle_dir = npx_root / "npx-site-evidence-handoff-bundle"
        assert_site_bundle_evidence_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--bundle", "--out", str(npx_site_evidence_bundle_dir)),
            out_dir=npx_site_evidence_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site evidence handoff bundle",
        )
        assert_site_bundle_check_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-check", "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site bundle-check JSON",
        )
        assert_site_bundle_compare_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-compare", str(npx_site_bundle_dir), "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site bundle-compare JSON",
        )
        npx_site_warning_bundle_dir = npx_root / "npx-site-warning-handoff-bundle"
        assert_site_warning_bundle_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--bundle", "--out", str(npx_site_warning_bundle_dir)),
            out_dir=npx_site_warning_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site warning handoff bundle",
        )
        assert_site_bundle_compare_warning_strict_smoke(
            npm_exec_cmd(
                tarball,
                "site",
                str(npx_site_warning_bundle_dir),
                "--bundle-compare",
                str(npx_site_warning_bundle_dir),
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site warning bundle-compare strict JSON",
        )
        assert_site_bundle_handoff_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-handoff", "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site bundle-handoff JSON",
        )
        assert_site_bundle_handoff_human_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-handoff", "--strict"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site bundle-handoff human",
        )
        assert_site_bundle_handoff_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-handoff", "--task", "task-content-quality", "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site bundle-handoff selected task JSON",
            expected_task_id="task-content-quality",
            expected_selected_task_id="task-content-quality",
        )
        assert_site_bundle_handoff_human_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-handoff", "--task", "task-content-quality", "--strict"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site bundle-handoff selected task human",
            expected_task_id="task-content-quality",
            expected_selected_task_id="task-content-quality",
        )
        assert_site_bundle_repair_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-repair", "--json"),
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-repair", "--yes", "--json"),
            npm_exec_cmd(tarball, "site", str(npx_site_bundle_dir), "--bundle-check", "--strict", "--json"),
            bundle_dir=npx_site_bundle_dir,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site bundle-repair JSON",
        )
        assert_site_bundle_check_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_evidence_bundle_dir), "--bundle-check", "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site evidence bundle-check JSON",
            expected_evidence_counts=SITE_EVIDENCE_COUNTS,
        )
        assert_site_bundle_compare_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_evidence_bundle_dir), "--bundle-compare", str(npx_site_evidence_bundle_dir), "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site evidence bundle-compare JSON",
            expected_evidence_counts=SITE_EVIDENCE_COUNTS,
        )
        assert_site_bundle_handoff_json_smoke(
            npm_exec_cmd(tarball, "site", str(npx_site_evidence_bundle_dir), "--bundle-handoff", "--strict", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site evidence bundle-handoff JSON",
            expected_evidence_counts=SITE_EVIDENCE_COUNTS,
        )
        assert_site_tasks_json_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--tasks"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site tasks JSON",
        )
        assert_site_prompt_markdown_smoke(
            npm_exec_cmd(tarball, "site", "--stdin", "--prompt", "codex-implementation", "--task", "task-homepage-cta"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec site task-selected prompt markdown",
        )
        assert_main_help_smoke(
            npm_exec_cmd(tarball, "help"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec main help",
        )
        run_expected_failure(
            npm_exec_cmd(tarball, EXPECTED_UNKNOWN_COMMAND),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec unknown command",
        )
        run_expected_failure(
            npm_exec_cmd(tarball, "help", EXPECTED_UNKNOWN_HELP_TOPIC),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec unknown help topic",
            assertion=assert_unknown_help_topic_failure,
        )
        run_expected_failure(
            npm_exec_cmd(tarball, "list", EXPECTED_UNKNOWN_LIST_DOMAIN),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec unknown list domain",
            assertion=assert_unknown_list_domain_failure,
        )
        npx_unknown_route_smokes = (
            ("prompt", npm_exec_cmd(tarball, "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
            ("pack", npm_exec_cmd(tarball, "pack", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
            ("examples", npm_exec_cmd(tarball, "examples", "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
            ("check", npm_exec_cmd(tarball, "check", "--examples", "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
        )
        for label, command in npx_unknown_route_smokes:
            run_expected_failure(
                command,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec unknown route id {label}",
                assertion=assert_unknown_route_id_failure,
            )
        for command_name, option, suggestion in EXPECTED_UNKNOWN_OPTION_SMOKES:
            assert_unknown_option_smoke(
                npm_exec_cmd(tarball, *unknown_option_args(command_name, option)),
                command_name=command_name,
                option=option,
                suggestion=suggestion,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec unknown {command_name} option",
            )
        run_expected_failure(
            npm_exec_cmd(tarball, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", EXPECTED_UNKNOWN_SEARCH_DIR),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec unknown search dir value",
            assertion=assert_search_dir_value_failure,
        )
        for label, args, expected_message in EXPECTED_NUMERIC_VALUE_SMOKES:
            assert_numeric_value_smoke(
                npm_exec_cmd(tarball, *args),
                expected_message=expected_message,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec invalid numeric value {label}",
            )
        npx_help_topics = read_help_topics(
            npm_exec_cmd(tarball, "help", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec help catalog",
        )
        if npx_help_topics != help_topics:
            raise SystemExit("package smoke npm exec help catalog differs from installed bin catalog")
        for topic in npx_help_topics:
            assert_help_topic_smoke(
                npm_exec_cmd(tarball, "help", topic),
                topic=topic,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec help topic {topic}",
            )
        for alias in EXPECTED_HELP_ALIASES:
            assert_help_topic_smoke(
                npm_exec_cmd(tarball, "help", alias),
                topic=alias,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec help alias {alias}",
            )
        for command in EXPECTED_COMMAND_ALIAS_COMMANDS:
            assert_command_alias_smoke(
                npm_exec_cmd(tarball, *command),
                command=command,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec command alias {' '.join(command)}",
            )
        assert_functional_alias_smokes(
            lambda *args: npm_exec_cmd(tarball, *args),
            run_command=run_plain,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec functional alias",
        )
        for kind in ("skills", "commands", "agents"):
            assert_list_smoke(
                npm_exec_cmd(tarball, "list", kind),
                kind=kind,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec list {kind}",
            )
            assert_list_json_smoke(
                npm_exec_cmd(tarball, "list", kind, "--json"),
                kind=kind,
                cwd=npx_root,
                env=npx_env,
                context=f"package smoke npm exec list {kind} JSON",
            )
        assert_search_smoke(
            npm_exec_cmd(tarball, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec search corpus",
        )
        assert_search_human_smoke(
            npm_exec_cmd(tarball, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec search human corpus",
        )
        assert_show_smoke(
            npm_exec_cmd(tarball, "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec show corpus",
        )
        assert_show_human_smoke(
            npm_exec_cmd(tarball, "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec show human corpus",
        )
        assert_show_range_smoke(
            npm_exec_cmd(
                tarball,
                "show",
                EXPECTED_CORPUS_SHOW_REL_PATH,
                "--lines",
                EXPECTED_CORPUS_SHOW_RANGE,
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec show line range",
        )
        assert_show_human_range_smoke(
            npm_exec_cmd(tarball, "show", EXPECTED_CORPUS_SHOW_REL_PATH, "--lines", EXPECTED_CORPUS_SHOW_RANGE),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec show human line range",
        )
        assert_route_catalog_smoke(
            npm_exec_cmd(tarball, "routes", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec routes catalog",
        )
        assert_route_catalog_smoke(
            npm_exec_cmd(tarball, "route", "--list", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec route list catalog",
        )
        assert_route_smoke(
            npm_exec_cmd(tarball, "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec route recommendation",
        )
        assert_route_explain_smoke(
            npm_exec_cmd(tarball, "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--explain"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec route explanation",
        )
        npx_route_brief = npx_root / "npx-route-brief.md"
        write_smoke_brief(npx_route_brief)
        assert_route_smoke(
            npm_exec_cmd(tarball, "route", "--from-file", str(npx_route_brief), "--limit", "1", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec route from file",
        )
        assert_route_stdin_smoke(
            npm_exec_cmd(tarball, "route", "--stdin", "--limit", "1", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec route stdin",
        )
        assert_route_eval_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec route eval",
        )
        npx_prompt_json = npx_root / "npx-prompt.json"
        assert_prompt_smoke(
            npm_exec_cmd(
                tarball,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(npx_prompt_json),
                "--force",
            ),
            npx_prompt_json,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt plan",
        )
        assert_prompt_stdout_smoke(
            npm_exec_cmd(
                tarball,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt stdout",
        )
        assert_prompt_markdown_smoke(
            npm_exec_cmd(
                tarball,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt markdown stdout",
        )
        npx_prompt_markdown = npx_root / "npx-prompt.md"
        assert_prompt_markdown_file_smoke(
            npm_exec_cmd(
                tarball,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--out",
                str(npx_prompt_markdown),
                "--force",
            ),
            npx_prompt_markdown,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt markdown file",
        )
        assert_output_overwrite_smoke(
            npm_exec_cmd(
                tarball,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--out",
                str(npx_prompt_markdown),
            ),
            npx_prompt_markdown,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt output overwrite",
        )
        npx_prompt_file_json = npx_root / "npx-prompt-from-file.json"
        assert_prompt_smoke(
            npm_exec_cmd(
                tarball,
                "prompt",
                "--from-file",
                str(npx_route_brief),
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(npx_prompt_file_json),
                "--force",
            ),
            npx_prompt_file_json,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt from file",
        )
        npx_prompt_stdin_json = npx_root / "npx-prompt-stdin.json"
        assert_prompt_stdin_smoke(
            npm_exec_cmd(
                tarball,
                "prompt",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(npx_prompt_stdin_json),
                "--force",
            ),
            npx_prompt_stdin_json,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt stdin",
        )
        assert_prompt_eval_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt eval",
        )
        npx_pack_json = npx_root / "npx-pack.json"
        assert_pack_smoke(
            npm_exec_cmd(
                tarball,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(npx_pack_json),
                "--force",
            ),
            npx_pack_json,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec prompt pack",
        )
        assert_pack_stdout_smoke(
            npm_exec_cmd(
                tarball,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec pack stdout",
        )
        assert_pack_markdown_smoke(
            npm_exec_cmd(
                tarball,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec pack markdown stdout",
        )
        npx_pack_markdown = npx_root / "npx-pack.md"
        assert_pack_markdown_file_smoke(
            npm_exec_cmd(
                tarball,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--out",
                str(npx_pack_markdown),
                "--force",
            ),
            npx_pack_markdown,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec pack markdown file",
        )
        assert_output_overwrite_smoke(
            npm_exec_cmd(
                tarball,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--out",
                str(npx_pack_markdown),
            ),
            npx_pack_markdown,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec pack output overwrite",
        )
        npx_pack_file_json = npx_root / "npx-pack-from-file.json"
        assert_pack_smoke(
            npm_exec_cmd(
                tarball,
                "pack",
                "--from-file",
                str(npx_route_brief),
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(npx_pack_file_json),
                "--force",
            ),
            npx_pack_file_json,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec pack from file",
        )
        npx_pack_stdin_json = npx_root / "npx-pack-stdin.json"
        assert_pack_stdin_smoke(
            npm_exec_cmd(
                tarball,
                "pack",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(npx_pack_stdin_json),
                "--force",
            ),
            npx_pack_stdin_json,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec pack stdin",
        )
        assert_pack_eval_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec pack eval",
        )
        assert_examples_smoke(
            npm_exec_cmd(tarball, "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec examples corpus",
        )
        assert_examples_human_smoke(
            npm_exec_cmd(tarball, "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec examples human corpus",
        )
        assert_check_examples_smoke(
            npm_exec_cmd(
                tarball,
                "check",
                "--examples",
                "--route",
                EXPECTED_ROUTE_ID,
                "--limit",
                str(EXPECTED_CHECK_EXAMPLES_LIMIT),
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec check examples",
        )
        assert_check_all_routes_issues_only_smoke(
            npm_exec_cmd(
                tarball,
                "check",
                "--examples",
                "--all-routes",
                "--limit",
                "1",
                "--issues-only",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec check all routes issues only",
        )
        npx_check_artifact = npx_root / EXPECTED_CHECK_ARTIFACT_NAME
        write_check_artifact(npx_check_artifact)
        assert_check_artifact_smoke(
            npm_exec_cmd(
                tarball,
                "check",
                str(npx_check_artifact),
                "--route",
                EXPECTED_ROUTE_ID,
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec check artifact",
        )
        assert_check_stdin_smoke(
            npm_exec_cmd(
                tarball,
                "check",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec check stdin",
        )
        npx_check_learning_artifact = npx_root / "npx-check-learning.md"
        npx_check_learning_profile = npx_root / "npx-check-learning.json"
        write_check_learning_capture_artifact(npx_check_learning_artifact)
        assert_check_learning_capture_smoke(
            npm_exec_cmd(
                tarball,
                "check",
                str(npx_check_learning_artifact),
                "--learn",
                "--yes",
                "--learning-file",
                str(npx_check_learning_profile),
                "--json",
            ),
            profile_path=npx_check_learning_profile,
            expected_file_suffix=npx_check_learning_artifact.name,
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec check learning capture",
        )
        assert_audit_smoke(
            npm_exec_cmd(tarball, "audit", "--strict", "--quiet"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec audit strict",
        )
        assert_audit_json_smoke(
            npm_exec_cmd(tarball, "audit", "--strict", "--quiet", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec audit JSON",
        )
        assert_learning_feedback_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-feedback-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn feedback",
        )
        assert_learning_init_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-init-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn init",
        )
        assert_learning_import_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-import-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn import",
        )
        assert_learning_backup_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-backup-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn backup",
        )
        assert_learning_redact_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-redact-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn redact",
        )
        assert_learning_verify_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-verify-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn verify",
        )
        assert_learning_diff_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-diff-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn diff",
        )
        assert_learning_restore_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-restore-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn restore",
        )
        assert_learning_stats_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-stats-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn stats",
        )
        assert_learning_audit_cleanup_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn audit cleanup",
        )
        assert_learning_curation_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-curate-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn curation",
        )
        assert_learning_relevance_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-learning-relevance.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learning relevance",
        )
        assert_update_dry_run_smoke(
            npm_exec_cmd(tarball, "update", "--dry-run"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec update dry run",
        )
        assert_update_dry_run_json_smoke(
            npm_exec_cmd(tarball, "update", "--dry-run", "--json"),
            prefix="npx-design-",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec update dry-run JSON",
        )
        assert_install_lifecycle_smoke(
            npm_exec_shell_cmd(
                tarball,
                help_topic_script(npx_help_topics) + " && "
                + help_alias_script() + " && "
                + command_alias_script() + " && "
                "design-ai routes --help && "
                "design-ai install --help && "
                "design-ai install && "
                "design-ai doctor --json > npx-doctor.json && "
                "design-ai doctor --strict && "
                "design-ai status && "
                "design-ai status --json > npx-status.json && "
                "design-ai uninstall && "
                "design-ai install --json > npx-install.json && "
                "design-ai uninstall --json > npx-uninstall.json",
            ),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec install lifecycle",
        )
        assert_doctor_report_file(npx_root / "npx-doctor.json", context="package smoke npm exec install")
        assert_status_json(
            (npx_root / "npx-status.json").read_text(encoding="utf-8"),
            prefix="npx-design-",
            context="package smoke npm exec status JSON",
            cmd=["design-ai", "status", "--json"],
        )
        assert_install_json(
            (npx_root / "npx-install.json").read_text(encoding="utf-8"),
            prefix="npx-design-",
            context="package smoke npm exec install JSON",
            cmd=["design-ai", "install", "--json"],
        )
        assert_uninstall_json(
            (npx_root / "npx-uninstall.json").read_text(encoding="utf-8"),
            prefix="npx-design-",
            context="package smoke npm exec uninstall JSON",
            cmd=["design-ai", "uninstall", "--json"],
        )


def pack_and_smoke() -> None:
    with tempfile.TemporaryDirectory(prefix="design-ai-pack-") as tmp:
        dist = Path(tmp)
        run(["npm", "pack", "--pack-destination", str(dist)])
        tarballs = sorted(dist.glob("*.tgz"))
        if len(tarballs) != 1:
            raise SystemExit(f"expected exactly one packed tarball, found {len(tarballs)} in {dist}")
        smoke_tarball(tarballs[0])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tarball", nargs="?", help="Path to the .tgz produced by npm pack")
    parser.add_argument("--pack", action="store_true", help="Run npm pack into a temp dir before smoking")
    parser.add_argument("--self-test", action="store_true", help="Run local package smoke assertion fixtures")
    args = parser.parse_args()

    if args.self_test:
        if args.pack or args.tarball:
            raise SystemExit("--self-test cannot be combined with --pack or a tarball path")
        run_self_test()
        return
    elif args.pack:
        if args.tarball:
            raise SystemExit("--pack cannot be combined with a tarball path")
        pack_and_smoke()
    elif args.tarball:
        smoke_tarball(Path(args.tarball).resolve())
    else:
        raise SystemExit("provide a tarball path or use --pack")

    print("Package smoke passed")


if __name__ == "__main__":
    main()
