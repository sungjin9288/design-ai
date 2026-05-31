#!/usr/bin/env python3
"""
Smoke-test a published design-ai npm package from the registry.

This is meant for post-publish verification, after the local tarball gate has
already passed. It catches registry-only issues such as propagation delay,
incorrect dist-tags, broken public package metadata, or npm exec failures when
users install the package by name.

Usage:
  python3 tools/audit/registry-smoke.py
  python3 tools/audit/registry-smoke.py @design-ai/cli@4.15.0
  python3 tools/audit/registry-smoke.py --retries 18 --delay 10
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from doctor_assertions import (
    assert_doctor_report_clean,
    run_self_test as run_doctor_assertions_self_test,
)
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
    assert_examples_human_output,
    assert_examples_json_route_hit,
    assert_force_overwrite_replaced,
    assert_functional_alias_smokes,
    assert_help_topic_output,
    assert_install_doctor_lifecycle_output,
    assert_list_catalog_output,
    assert_list_catalog_json,
    assert_main_help_output,
    assert_no_ansi,
    assert_numeric_value_failure,
    assert_output_overwrite_failure,
    assert_output_write_success,
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
    assert_search_dir_value_failure,
    assert_update_dry_run_json,
    assert_update_dry_run_output,
    assert_unknown_command_failure,
    assert_unknown_help_topic_failure,
    assert_unknown_list_domain_failure,
    assert_unknown_option_failure,
    assert_unknown_route_id_failure,
    assert_install_json,
    assert_uninstall_json,
    assert_version_json,
    assert_version_output,
    assert_workspace_json,
    assert_workspace_strict_failure_json,
    assert_workspace_strict_success_json,
    command_alias_script,
    doctor_report_json_missing,
    expect_self_test_failure,
    format_cmd,
    help_alias_script,
    help_topic_script,
    parse_help_topics,
    passing_doctor_report_json,
    passing_check_artifact_content,
    passing_workspace_json,
    passing_workspace_strict_clean_json,
    seed_force_overwrite_target,
    unknown_option_args,
)

ROOT = Path(__file__).resolve().parents[2]
PACKAGE = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
DEFAULT_PACKAGE_SPEC = f"{PACKAGE['name']}@{PACKAGE['version']}"


def npm_exec_cmd(package_spec: str, *args: str) -> list[str]:
    return [
        "npm",
        "exec",
        "--yes",
        "--package",
        package_spec,
        "--",
        "design-ai",
        *args,
    ]


def npm_exec_shell_cmd(package_spec: str, script: str) -> list[str]:
    return [
        "npm",
        "exec",
        "--yes",
        "--package",
        package_spec,
        "--",
        "sh",
        "-c",
        script,
    ]


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

    if result.returncode != 0:
        raise SystemExit(f"command failed with exit code {result.returncode}: {format_cmd(cmd)}")

    assert_no_ansi(f"{result.stdout}\n{result.stderr}", cmd)
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

    if result.returncode != 0:
        raise SystemExit(f"command failed with exit code {result.returncode}: {format_cmd(cmd)}")

    assert_no_ansi(f"{result.stdout}\n{result.stderr}", cmd)
    return result


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


def read_doctor_report(report_path: Path) -> dict:
    try:
        raw = report_path.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read registry smoke doctor JSON: {report_path}") from error

    assert_no_ansi(raw, ["design-ai", "doctor", "--json"])
    try:
        return json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse registry smoke doctor JSON: {report_path}") from error


def read_help_topics(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None) -> list[str]:
    result = run_plain(cmd, cwd=cwd, env=env)
    return parse_help_topics(result.stdout, context="registry smoke help catalog", cmd=cmd)


def require_registry_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}: {format_cmd(cmd)}")


def write_learning_stats_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": [
                    {
                        "id": "registry-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise brand language",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-a11y",
                        "category": "accessibility",
                        "text": "Prefer keyboard-first critique notes",
                        "source": "feedback:keep",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "registry-korean",
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
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "text": "Prioritize keyboard accessibility details for Button component API specs",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "learn-unrelated-newer",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile checkout layout",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
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
                        "id": "registry-audit-a",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-audit-b",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "registry-audit-c",
                        "category": "constraint",
                        "text": "Never include api_key=redacted placeholders in prompt context",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def write_learning_backup_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:01.000Z",
                "entries": [
                    {
                        "id": "registry-backup-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise language",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-backup-korean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts",
                        "source": "feedback:keep",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def write_learning_import_target_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:00.000Z",
                "entries": [
                    {
                        "id": "registry-import-existing",
                        "category": "brand",
                        "text": "Use quiet enterprise language",
                        "source": "registry-smoke",
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
                        "id": "registry-sensitive",
                        "category": "constraint",
                        "text": "Never include api_key: sk-test12345678901234567890 in shared learning profiles",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-clean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts",
                        "source": "registry-smoke",
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
            "file": "/portable/registry-learning.json",
            "entries": [
                {
                    "id": "registry-import-existing",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "registry-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "registry-import-existing",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
        },
        indent=2,
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn feedback JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("count") == expected_count,
        context=context,
        cmd=cmd,
        message="learn feedback JSON count changed",
    )

    feedback = payload.get("feedback")
    entry = payload.get("entry")
    require_registry_smoke(
        isinstance(feedback, dict) and isinstance(entry, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON should include feedback and entry objects",
    )
    require_registry_smoke(
        feedback.get("outcome") == outcome,
        context=context,
        cmd=cmd,
        message="learn feedback outcome changed",
    )
    require_registry_smoke(
        feedback.get("category") == category and entry.get("category") == category,
        context=context,
        cmd=cmd,
        message="learn feedback category changed",
    )
    require_registry_smoke(
        entry.get("source") == f"feedback:{outcome}",
        context=context,
        cmd=cmd,
        message="learn feedback source should preserve the outcome",
    )
    require_registry_smoke(
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
    require_registry_smoke(
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn init JSON must be an object",
    )
    require_registry_smoke(
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
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn init file path changed",
    )
    require_registry_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn init dryRun/apply flags changed",
    )
    require_registry_smoke(
        payload.get("source") == "init:local-dogfood",
        context=context,
        cmd=cmd,
        message="learn init source changed",
    )
    require_registry_smoke(
        payload.get("candidateCount") == 6
        and payload.get("addedCount") == added_count
        and payload.get("skippedCount") == skipped_count
        and payload.get("count") == count,
        context=context,
        cmd=cmd,
        message="learn init counts changed",
    )

    entries = payload.get("entries")
    skipped = payload.get("skipped")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == added_count,
        context=context,
        cmd=cmd,
        message="learn init entries list changed",
    )
    require_registry_smoke(
        isinstance(skipped, list) and len(skipped) == skipped_count,
        context=context,
        cmd=cmd,
        message="learn init skipped list changed",
    )

    if entries:
        categories = [entry.get("category") for entry in entries if isinstance(entry, dict)]
        require_registry_smoke(
            categories == ["preference", "workflow", "accessibility", "korean", "brand", "constraint"],
            context=context,
            cmd=cmd,
            message="learn init entry categories changed",
        )
        require_registry_smoke(
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
        require_registry_smoke(
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
        require_registry_smoke(
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
    require_registry_smoke(
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
    require_registry_smoke(
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


def learning_verify_payload_text() -> str:
    return json.dumps(
        {
            "file": "/portable/registry-learning.json",
            "entries": [
                {
                    "id": "registry-verify-entry",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "registry-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "registry-verify-entry",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
        },
        indent=2,
    )


def assert_learning_verify_json(
    raw: str,
    *,
    source: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn verify JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn verify JSON must be an object",
    )
    require_registry_smoke(
        payload.get("source") == source,
        context=context,
        cmd=cmd,
        message="learn verify JSON source changed",
    )
    require_registry_smoke(
        payload.get("importable") is True,
        context=context,
        cmd=cmd,
        message="learn verify importable flag changed",
    )
    require_registry_smoke(
        payload.get("count") == 2,
        context=context,
        cmd=cmd,
        message="learn verify count changed",
    )

    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
        isinstance(audit_summary, dict)
        and audit_summary.get("status") == "warn"
        and audit_summary.get("failures") == 0
        and audit_summary.get("warnings") == 1,
        context=context,
        cmd=cmd,
        message="learn verify audit summary changed",
    )

    issues = payload.get("issues")
    require_registry_smoke(
        isinstance(issues, list)
        and len(issues) == 1
        and issues[0].get("code") == "duplicate-entry-id"
        and issues[0].get("entryId") == "registry-verify-entry",
        context=context,
        cmd=cmd,
        message="learn verify duplicate-id warning changed",
    )

    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 2,
        context=context,
        cmd=cmd,
        message="learn verify entries list changed",
    )
    require_registry_smoke(
        all(
            isinstance(entry, dict)
            and isinstance(entry.get("source"), str)
            and entry["source"].startswith("import:")
            for entry in entries
        ),
        context=context,
        cmd=cmd,
        message="learn verify entries should be normalized as import entries",
    )

    categories = {entry.get("category") for entry in entries if isinstance(entry, dict)}
    previews = {entry.get("textPreview") for entry in entries if isinstance(entry, dict)}
    require_registry_smoke(
        categories == {"brand", "korean"}
        and "Use quiet enterprise language" in previews
        and "Prefer dense Korean mobile layouts" in previews,
        context=context,
        cmd=cmd,
        message="learn verify entry summaries changed",
    )


def assert_learning_verify_smoke(
    command_factory,
    source_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    source_path.write_text(f"{learning_verify_payload_text()}\n", encoding="utf-8")

    from_file_cmd = command_factory("learn", "--verify", "--from-file", str(source_path), "--json")
    from_file_result = run_plain(from_file_cmd, cwd=cwd, env=env)
    assert_learning_verify_json(
        from_file_result.stdout,
        source=str(source_path),
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
        context=f"{context} out file",
        cmd=out_cmd,
    )

    stdin_cmd = command_factory("learn", "--verify", "--stdin", "--json")
    stdin_result = run_plain_with_input(
        stdin_cmd,
        input_text=learning_verify_payload_text(),
        cwd=cwd,
        env=env,
    )
    assert_learning_verify_json(
        stdin_result.stdout,
        source="stdin",
        context=f"{context} stdin",
        cmd=stdin_cmd,
    )


def assert_learning_backup_json(
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
        raise SystemExit(f"{context}: failed to parse learn backup JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn backup JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn backup JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("version") == 1,
        context=context,
        cmd=cmd,
        message="learn backup version changed",
    )
    require_registry_smoke(
        payload.get("updatedAt") == "2026-05-22T00:00:01.000Z",
        context=context,
        cmd=cmd,
        message="learn backup updatedAt changed",
    )
    require_registry_smoke(
        payload.get("count") == 2,
        context=context,
        cmd=cmd,
        message="learn backup count changed",
    )
    require_registry_smoke(
        isinstance(payload.get("exportedAt"), str) and payload.get("exportedAt"),
        context=context,
        cmd=cmd,
        message="learn backup exportedAt missing",
    )

    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
        isinstance(audit_summary, dict)
        and audit_summary.get("status") == "pass"
        and audit_summary.get("failures") == 0
        and audit_summary.get("warnings") == 0,
        context=context,
        cmd=cmd,
        message="learn backup audit summary changed",
    )

    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 2,
        context=context,
        cmd=cmd,
        message="learn backup entries list changed",
    )
    require_registry_smoke(
        all(
            isinstance(entry, dict)
            and isinstance(entry.get("text"), str)
            and entry.get("text")
            for entry in entries
        ),
        context=context,
        cmd=cmd,
        message="learn backup entries should preserve full text",
    )

    entry_by_id = {entry.get("id"): entry for entry in entries if isinstance(entry, dict)}
    first_entry = entry_by_id.get("registry-backup-brand")
    second_entry = entry_by_id.get("registry-backup-korean")
    require_registry_smoke(
        isinstance(first_entry, dict)
        and first_entry.get("category") == "brand"
        and first_entry.get("text") == "Use quiet enterprise language"
        and first_entry.get("source") == "registry-smoke",
        context=context,
        cmd=cmd,
        message="learn backup first entry changed",
    )
    require_registry_smoke(
        isinstance(second_entry, dict)
        and second_entry.get("category") == "korean"
        and second_entry.get("text") == "Prefer dense Korean mobile layouts"
        and second_entry.get("source") == "feedback:keep",
        context=context,
        cmd=cmd,
        message="learn backup second entry changed",
    )


def assert_learning_backup_smoke(
    command_factory,
    profile_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    write_learning_backup_fixture(profile_path)
    cmd = command_factory("learn", "--backup", "--file", str(profile_path), "--json")
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_learning_backup_json(result.stdout, profile_path=profile_path, context=context, cmd=cmd)

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
    assert_output_write_success(
        out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        expected_path=str(out_path),
    )
    assert_learning_backup_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=profile_path,
        context=f"{context} out file",
        cmd=out_cmd,
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn import JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn import JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn import dry-run/apply flags changed",
    )
    require_registry_smoke(
        payload.get("importedCount") == 2
        and payload.get("addedCount") == 1
        and payload.get("skippedCount") == 1
        and payload.get("count") == 2,
        context=context,
        cmd=cmd,
        message="learn import counts changed",
    )

    added = payload.get("added")
    skipped = payload.get("skipped")
    require_registry_smoke(
        isinstance(added, list) and len(added) == 1,
        context=context,
        cmd=cmd,
        message="learn import added list missing",
    )
    require_registry_smoke(
        isinstance(skipped, list) and len(skipped) == 1,
        context=context,
        cmd=cmd,
        message="learn import skipped list missing",
    )

    added_entry = added[0]
    skipped_entry = skipped[0]
    require_registry_smoke(
        isinstance(added_entry, dict)
        and added_entry.get("category") == "korean"
        and added_entry.get("source") == "import:cli"
        and added_entry.get("id") != "registry-import-existing",
        context=context,
        cmd=cmd,
        message="learn import added entry metadata changed",
    )
    require_registry_smoke(
        isinstance(skipped_entry, dict)
        and skipped_entry.get("reason") == "duplicate-entry-text"
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
    require_registry_smoke(
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
    require_registry_smoke(
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
    require_registry_smoke(
        len(applied_profile.get("entries", [])) == 2,
        context=f"{context} apply profile",
        cmd=apply_cmd,
        message="learn import apply should persist the merged entry",
    )


def assert_learning_redact_json(
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
        raise SystemExit(f"{context}: failed to parse learn redact JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn redact JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn redact JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("redacted") is True
        and payload.get("count") == 2
        and payload.get("redactedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn redact metadata changed",
    )

    source_audit = payload.get("sourceAuditSummary")
    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
        isinstance(source_audit, dict) and source_audit.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn redact source audit should warn for the fixture",
    )
    require_registry_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == "pass",
        context=context,
        cmd=cmd,
        message="learn redact redacted audit should pass for the fixture",
    )

    redactions = payload.get("redactions")
    require_registry_smoke(
        isinstance(redactions, list)
        and len(redactions) == 1
        and redactions[0].get("entryId") == "registry-sensitive"
        and set(redactions[0].get("codes", [])) >= {
            "sensitive-secret-assignment",
            "sensitive-openai-secret-key",
        },
        context=context,
        cmd=cmd,
        message="learn redact redactions changed",
    )

    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 2,
        context=context,
        cmd=cmd,
        message="learn redact entries list changed",
    )
    sensitive_entry = next((entry for entry in entries if entry.get("id") == "registry-sensitive"), None)
    require_registry_smoke(
        isinstance(sensitive_entry, dict),
        context=context,
        cmd=cmd,
        message="learn redact sensitive entry missing",
    )
    redacted_text = sensitive_entry.get("text", "")
    require_registry_smoke(
        "[REDACTED:secret-assignment]" in redacted_text
        and "[REDACTED:openai-secret-key]" in redacted_text,
        context=context,
        cmd=cmd,
        message="learn redact did not include redaction markers",
    )
    require_registry_smoke(
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
    cmd = command_factory("learn", "--redact", "--file", str(profile_path), "--json")
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_learning_redact_json(result.stdout, profile_path=profile_path, context=context, cmd=cmd)
    source_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_registry_smoke(
        "sk-test12345678901234567890" in source_profile["entries"][0]["text"],
        context=f"{context} source profile unchanged",
        cmd=cmd,
        message="learn redact should not mutate the source profile",
    )

    source_path = profile_path.with_name(f"{profile_path.stem}-portable.json")
    write_learning_redaction_fixture(source_path)
    from_file_cmd = command_factory("learn", "--redact", "--from-file", str(source_path), "--json")
    from_file_result = run_plain(from_file_cmd, cwd=cwd, env=env)
    assert_learning_redact_json(
        from_file_result.stdout,
        profile_path=source_path,
        context=f"{context} from-file",
        cmd=from_file_cmd,
    )
    source_payload = json.loads(source_path.read_text(encoding="utf-8"))
    require_registry_smoke(
        "sk-test12345678901234567890" in source_payload["entries"][0]["text"],
        context=f"{context} from-file source unchanged",
        cmd=from_file_cmd,
        message="learn redact --from-file should not mutate the source payload",
    )

    stdin_cmd = command_factory("learn", "--redact", "--stdin", "--json")
    stdin_result = run_plain_with_input(
        stdin_cmd,
        input_text=source_path.read_text(encoding="utf-8"),
        cwd=cwd,
        env=env,
    )
    assert_learning_redact_json(
        stdin_result.stdout,
        profile_path=Path("stdin"),
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
    require_registry_smoke(
        "Wrote " in out_result.stdout,
        context=f"{context} out",
        cmd=out_cmd,
        message="learn redact --out should confirm the written file",
    )
    assert_learning_redact_json(
        out_path.read_text(encoding="utf-8"),
        profile_path=source_path,
        context=f"{context} out file",
        cmd=out_cmd,
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn stats JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn stats JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("exists") is True,
        context=context,
        cmd=cmd,
        message="learn stats profile should exist",
    )
    require_registry_smoke(
        payload.get("version") == 1,
        context=context,
        cmd=cmd,
        message="learn stats version changed",
    )
    require_registry_smoke(
        payload.get("updatedAt") == "2026-05-22T00:00:03.000Z",
        context=context,
        cmd=cmd,
        message="learn stats updatedAt changed",
    )
    require_registry_smoke(
        payload.get("count") == 3,
        context=context,
        cmd=cmd,
        message="learn stats entry count changed",
    )

    category_counts = payload.get("categoryCounts")
    require_registry_smoke(
        isinstance(category_counts, dict)
        and category_counts.get("brand") == 1
        and category_counts.get("accessibility") == 1
        and category_counts.get("korean") == 1,
        context=context,
        cmd=cmd,
        message="learn stats category distribution changed",
    )
    source_counts = payload.get("sourceCounts")
    require_registry_smoke(
        isinstance(source_counts, dict)
        and source_counts.get("registry-smoke") == 1
        and source_counts.get("feedback:keep") == 1
        and source_counts.get("import:cli") == 1,
        context=context,
        cmd=cmd,
        message="learn stats source distribution changed",
    )

    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
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
    require_registry_smoke(
        isinstance(latest, dict)
        and latest.get("id") == "registry-korean"
        and latest.get("category") == "korean"
        and latest.get("source") == "import:cli"
        and latest.get("textPreview") == "Prefer dense Korean mobile layouts with compact controls",
        context=context,
        cmd=cmd,
        message="learn stats latest entry summary changed",
    )
    require_registry_smoke(
        isinstance(oldest, dict)
        and oldest.get("id") == "registry-brand"
        and oldest.get("category") == "brand"
        and oldest.get("source") == "registry-smoke",
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
        "Sources: registry-smoke 1, feedback:keep 1, import:cli 1",
        "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
        "registry-korean",
        "Oldest: [brand] Use quiet enterprise brand language",
        "registry-brand",
        "2026-05-22T00:00:00.000Z",
        "2026-05-22T00:00:03.000Z",
    ):
        require_registry_smoke(
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn audit JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn audit JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("exists") is True and payload.get("count") == 3,
        context=context,
        cmd=cmd,
        message="learn audit profile metadata changed",
    )

    summary = payload.get("summary")
    require_registry_smoke(
        isinstance(summary, dict)
        and summary.get("status") == "warn"
        and summary.get("failures") == 0
        and isinstance(summary.get("warnings"), int)
        and not isinstance(summary.get("warnings"), bool)
        and summary["warnings"] >= 2,
        context=context,
        cmd=cmd,
        message="learn audit warning summary changed",
    )

    issues = payload.get("issues")
    require_registry_smoke(
        isinstance(issues, list)
        and any(
            issue.get("code") == "duplicate-entry-text" and issue.get("entryId") == "registry-audit-b"
            for issue in issues
            if isinstance(issue, dict)
        )
        and any(
            issue.get("code") == "sensitive-secret-assignment" and issue.get("entryId") == "registry-audit-c"
            for issue in issues
            if isinstance(issue, dict)
        ),
        context=context,
        cmd=cmd,
        message="learn audit issues changed",
    )

    suggestions = payload.get("suggestions")
    require_registry_smoke(
        isinstance(suggestions, list),
        context=context,
        cmd=cmd,
        message="learn audit suggestions missing",
    )
    duplicate_command_args = [
        "design-ai",
        "learn",
        "--file",
        str(profile_path),
        "--forget",
        "registry-audit-b",
        "--yes",
    ]
    sensitive_command_args = [
        "design-ai",
        "learn",
        "--file",
        str(profile_path),
        "--forget",
        "registry-audit-c",
        "--yes",
    ]
    duplicate_suggestion = next(
        (
            suggestion for suggestion in suggestions
            if (
                isinstance(suggestion, dict)
                and suggestion.get("action") == "remove-duplicate"
                and suggestion.get("entryId") == "registry-audit-b"
            )
        ),
        None,
    )
    sensitive_suggestion = next(
        (
            suggestion for suggestion in suggestions
            if (
                isinstance(suggestion, dict)
                and suggestion.get("action") == "remove-or-redact-sensitive-content"
                and suggestion.get("entryId") == "registry-audit-c"
            )
        ),
        None,
    )
    require_registry_smoke(
        isinstance(duplicate_suggestion, dict)
        and duplicate_suggestion.get("commandArgs") == duplicate_command_args
        and "--forget registry-audit-b --yes" in duplicate_suggestion.get("command", ""),
        context=context,
        cmd=cmd,
        message="learn audit duplicate cleanup suggestion changed",
    )
    require_registry_smoke(
        isinstance(sensitive_suggestion, dict)
        and sensitive_suggestion.get("commandArgs") == sensitive_command_args
        and "--forget registry-audit-c --yes" in sensitive_suggestion.get("command", ""),
        context=context,
        cmd=cmd,
        message="learn audit sensitive cleanup suggestion changed",
    )


def assert_learning_audit_cleanup_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Local learning profile audit",
        "Status: warn",
        "Suggested cleanup:",
        "remove-duplicate (registry-audit-b)",
        "remove-or-redact-sensitive-content (registry-audit-c)",
        "--forget registry-audit-b --yes",
        "--forget registry-audit-c --yes",
    ):
        require_registry_smoke(
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn audit fix JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path)
        and payload.get("dryRun") is dry_run
        and payload.get("applied") is (not dry_run)
        and payload.get("cleanupCount") == 2,
        context=context,
        cmd=cmd,
        message="learn audit fix metadata changed",
    )
    before = payload.get("before")
    require_registry_smoke(
        isinstance(before, dict) and before.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn audit fix should start from a warning profile",
    )

    cleanup = payload.get("cleanup")
    require_registry_smoke(
        isinstance(cleanup, list),
        context=context,
        cmd=cmd,
        message="learn audit fix cleanup list missing",
    )
    cleanup_by_entry = {
        item.get("entryId"): item
        for item in cleanup
        if isinstance(item, dict)
    }
    for entry_id, action in (
        ("registry-audit-b", "remove-duplicate"),
        ("registry-audit-c", "remove-or-redact-sensitive-content"),
    ):
        item = cleanup_by_entry.get(entry_id)
        require_registry_smoke(
            isinstance(item, dict)
            and action in item.get("actions", [])
            and item.get("commandArgs")
            == ["design-ai", "learn", "--file", str(profile_path), "--forget", entry_id, "--yes"],
            context=context,
            cmd=cmd,
            message=f"learn audit fix cleanup entry changed: {entry_id}",
        )

    removed = payload.get("removed")
    if dry_run:
        require_registry_smoke(
            removed == [] and payload.get("after") is None,
            context=context,
            cmd=cmd,
            message="learn audit fix dry run should not remove entries",
        )
    else:
        require_registry_smoke(
            isinstance(removed, list)
            and [item.get("id") for item in removed if isinstance(item, dict)]
            == ["registry-audit-b", "registry-audit-c"],
            context=context,
            cmd=cmd,
            message="learn audit fix removed entries changed",
        )
        after = payload.get("after")
        require_registry_smoke(
            isinstance(after, dict) and after.get("status") == "pass",
            context=context,
            cmd=cmd,
            message="learn audit fix should leave a passing profile",
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
    require_registry_smoke(
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
    applied_profile = json.loads(profile_path.read_text(encoding="utf-8"))
    require_registry_smoke(
        [entry.get("id") for entry in applied_profile.get("entries", [])] == ["registry-audit-a"],
        context=f"{context} fix apply profile",
        cmd=fix_apply_cmd,
        message="learn audit fix apply should persist only the clean entry",
    )


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


def assert_workspace_strict_success_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_workspace_strict_success_json(
        result.stdout,
        returncode=result.returncode,
        context=context,
        cmd=cmd,
    )


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


def assert_install_lifecycle_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_install_doctor_lifecycle_output(result.stdout, context=context, cmd=cmd)


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


def assert_status_json_file(path: Path, *, prefix: str, context: str) -> None:
    assert_status_json(
        path.read_text(encoding="utf-8"),
        prefix=prefix,
        context=context,
        cmd=["design-ai", "status", "--json"],
    )


def assert_install_json_file(path: Path, *, prefix: str, context: str) -> None:
    assert_install_json(
        path.read_text(encoding="utf-8"),
        prefix=prefix,
        context=context,
        cmd=["design-ai", "install", "--json"],
    )


def assert_uninstall_json_file(path: Path, *, prefix: str, context: str) -> None:
    assert_uninstall_json(
        path.read_text(encoding="utf-8"),
        prefix=prefix,
        context=context,
        cmd=["design-ai", "uninstall", "--json"],
    )


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
        raise SystemExit(
            f"failed to prepare registry workspace strict git fixture: git {' '.join(args)}\n{output}"
        )


def prepare_workspace_strict_repo(repo: Path) -> None:
    repo.mkdir(parents=True, exist_ok=True)
    run_fixture_git(repo, "init", "-q")
    run_fixture_git(repo, "checkout", "-b", "main")
    run_fixture_git(repo, "config", "user.email", "registry-smoke@example.com")
    run_fixture_git(repo, "config", "user.name", "Registry Smoke")
    (repo / "README.md").write_text("# registry workspace strict fixture\n", encoding="utf-8")
    run_fixture_git(repo, "add", "README.md")
    run_fixture_git(repo, "commit", "-m", "feat: registry workspace strict fixture")
    run_fixture_git(repo, "remote", "add", "origin", f"{EXPECTED_REPOSITORY_URL}.git")
    run_fixture_git(repo, "update-ref", "refs/remotes/origin/main", "HEAD")
    run_fixture_git(repo, "branch", "--set-upstream-to=origin/main", "main")


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
            "registry smoke can verify check learning capture without producing "
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="check learning capture JSON must be an object",
    )
    require_registry_smoke(
        isinstance(payload.get("filePath"), str) and payload["filePath"].endswith(expected_file_suffix),
        context=context,
        cmd=cmd,
        message="check learning capture file path changed",
    )
    require_registry_smoke(
        payload.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="check learning capture status should warn",
    )
    require_registry_smoke(
        payload.get("failures") == 0,
        context=context,
        cmd=cmd,
        message="check learning capture fixture should not fail",
    )

    capture = payload.get("learningCapture")
    require_registry_smoke(
        isinstance(capture, dict),
        context=context,
        cmd=cmd,
        message="check learningCapture object missing",
    )
    require_registry_smoke(
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
    require_registry_smoke(
        capture.get("file") == str(profile_path)
        and capture.get("dryRun") is False
        and capture.get("applied") is True
        and capture.get("source") == "check:artifact",
        context=context,
        cmd=cmd,
        message="check learning capture metadata changed",
    )
    require_registry_smoke(
        capture.get("candidateCount") == 4
        and capture.get("addedCount") == 4
        and capture.get("skippedCount") == 0
        and capture.get("count") == 4,
        context=context,
        cmd=cmd,
        message="check learning capture counts changed",
    )

    entries = capture.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 4,
        context=context,
        cmd=cmd,
        message="check learning capture entries changed",
    )
    require_registry_smoke(
        capture.get("skipped") == [],
        context=context,
        cmd=cmd,
        message="check learning capture should not skip fresh entries",
    )
    categories = [entry.get("category") for entry in entries if isinstance(entry, dict)]
    require_registry_smoke(
        categories.count("accessibility") == 2 and categories.count("workflow") == 2,
        context=context,
        cmd=cmd,
        message="check learning capture categories changed",
    )
    require_registry_smoke(
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
    require_registry_smoke(
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
    require_registry_smoke(
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


def assert_learning_relevance_context(payload: dict[str, object], *, context: str, cmd: list[str]) -> None:
    learning_context = payload.get("learningContext")
    require_registry_smoke(
        isinstance(learning_context, dict),
        context=context,
        cmd=cmd,
        message="learningContext should be present when --with-learning is used",
    )

    selection = learning_context.get("selection")
    require_registry_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learningContext selection metadata missing",
    )
    require_registry_smoke(
        selection.get("mode") == "brief-relevance",
        context=context,
        cmd=cmd,
        message="learningContext should use brief-relevance selection",
    )
    require_registry_smoke(
        selection.get("candidateCount") == 3,
        context=context,
        cmd=cmd,
        message="learningContext candidate count changed",
    )
    require_registry_smoke(
        selection.get("matchedCount") >= 1,
        context=context,
        cmd=cmd,
        message="learningContext should report at least one relevant match",
    )
    require_registry_smoke(
        selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learningContext should report the limited selected entry count",
    )
    require_registry_smoke(
        selection.get("fallbackCount") == 0,
        context=context,
        cmd=cmd,
        message="learningContext should not use recency fallback when the relevant entry fits the limit",
    )

    selected = selection.get("selected")
    require_registry_smoke(
        isinstance(selected, list) and len(selected) == 1 and isinstance(selected[0], dict),
        context=context,
        cmd=cmd,
        message="learningContext selection should explain the selected entry",
    )
    selected_entry = selected[0]
    require_registry_smoke(
        selected_entry.get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learning selection explanation should point at the relevant entry",
    )
    require_registry_smoke(
        selected_entry.get("reason") == "brief-match",
        context=context,
        cmd=cmd,
        message="learning selection explanation should mark the relevant entry as a brief match",
    )
    require_registry_smoke(
        isinstance(selected_entry.get("score"), int) and selected_entry.get("score") > 0,
        context=context,
        cmd=cmd,
        message="learning selection explanation should include a positive relevance score",
    )
    matched_tokens = selected_entry.get("matchedTokens")
    require_registry_smoke(
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
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learningContext should include the single limited entry",
    )
    require_registry_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="brief relevance should pick the Button accessibility entry over the newer unrelated entry",
    )

    prompt = payload.get("prompt")
    require_registry_smoke(isinstance(prompt, str), context=context, cmd=cmd, message="prompt should be a string")
    require_registry_smoke(
        "Learning selection: brief relevance" in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should disclose brief-relevance learning selection",
    )
    require_registry_smoke(
        "Prioritize keyboard accessibility details" in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should include the relevant learning entry",
    )
    require_registry_smoke(
        "dense Korean mobile checkout" not in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should exclude the newer unrelated learning entry when limit is 1",
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

    require_registry_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn query JSON must be an object")
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn query file path differs from the smoke profile",
    )
    require_registry_smoke(
        payload.get("query") == "keyboard accessibility",
        context=context,
        cmd=cmd,
        message="learn query text changed",
    )
    require_registry_smoke(
        payload.get("count") == 1 and payload.get("totalCount") == 3,
        context=context,
        cmd=cmd,
        message="learn query should return only the matching entry while reporting total profile size",
    )

    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learn query entries list should contain exactly one matching entry",
    )
    require_registry_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learn query should return the Button accessibility entry",
    )
    selection = payload.get("selection")
    require_registry_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learn query explain selection metadata missing",
    )
    require_registry_smoke(
        selection.get("fallbackEnabled") is False and selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn query explain should select exactly one entry without fallback",
    )
    selected = selection.get("selected")
    require_registry_smoke(
        isinstance(selected, list) and len(selected) == 1 and isinstance(selected[0], dict),
        context=context,
        cmd=cmd,
        message="learn query explain selected list should contain one entry",
    )
    require_registry_smoke(
        selected[0].get("id") == "learn-relevant"
        and selected[0].get("reason") == "brief-match"
        and isinstance(selected[0].get("score"), int)
        and selected[0].get("score") > 0,
        context=context,
        cmd=cmd,
        message="learn query explain should include score and match reason",
    )
    matched_tokens = selected[0].get("matchedTokens")
    require_registry_smoke(
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
        require_registry_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn query human output missing {expected!r}",
        )
    require_registry_smoke(
        "dense Korean mobile checkout" not in raw
        and "quiet enterprise brand language" not in raw
        and "quiet enterprise brand voice" not in raw,
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

    require_registry_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn query export JSON must be an object")
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn query export file path differs from the smoke profile",
    )
    require_registry_smoke(
        payload.get("query") == "keyboard accessibility",
        context=context,
        cmd=cmd,
        message="learn query export text changed",
    )
    selection = payload.get("selection")
    require_registry_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learn query export selection metadata missing",
    )
    require_registry_smoke(
        selection.get("fallbackEnabled") is False and selection.get("fallbackCount") == 0,
        context=context,
        cmd=cmd,
        message="learn query export should not use recency fallback",
    )
    require_registry_smoke(
        selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn query export should select one matching entry",
    )
    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learn query export entries list should contain exactly one matching entry",
    )
    require_registry_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learn query export should return the Button accessibility entry",
    )
    markdown = payload.get("markdown")
    require_registry_smoke(
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
    require_registry_smoke(isinstance(plan, dict), context=f"{context} pack", cmd=pack_cmd, message="pack plan missing")
    assert_learning_relevance_context(plan, context=f"{context} pack plan", cmd=pack_cmd)


def wait_for_registry_package(
    package_spec: str,
    *,
    retries: int,
    delay: float,
    env: dict[str, str],
) -> None:
    cmd = ["npm", "view", package_spec, "version"]

    for attempt in range(1, retries + 1):
        print(f"$ {format_cmd(cmd)}  # attempt {attempt}/{retries}", flush=True)
        result = subprocess.run(cmd, env=env, text=True, capture_output=True)
        output = f"{result.stdout}\n{result.stderr}"

        if result.returncode == 0 and result.stdout.strip():
            assert_no_ansi(output, cmd)
            print(result.stdout, end="")
            return

        if attempt == retries:
            if result.stdout:
                print(result.stdout, end="")
            if result.stderr:
                print(result.stderr, end="", file=sys.stderr)
            raise SystemExit(f"package not available from npm registry: {package_spec}")

        time.sleep(delay)


def smoke_registry_package(package_spec: str, *, retries: int, delay: float) -> None:
    if retries < 1:
        raise SystemExit("--retries must be at least 1")
    if delay < 0:
        raise SystemExit("--delay cannot be negative")

    with tempfile.TemporaryDirectory(prefix="design-ai-registry-smoke-") as tmp:
        tmp_root = Path(tmp)
        npx_root = tmp_root / "npx-project"
        claude_home = tmp_root / "claude-home"
        npm_cache = tmp_root / "npm-cache"
        workspace_strict_root = tmp_root / "registry-workspace-strict"
        npx_root.mkdir()
        prepare_workspace_strict_repo(workspace_strict_root)

        env = os.environ.copy()
        env.update({
            "CLAUDE_HOME": str(claude_home),
            "DESIGN_AI_PREFIX": "registry-design-",
            "NO_COLOR": "1",
            "npm_config_cache": str(npm_cache),
            "npm_config_update_notifier": "false",
            "npm_config_audit": "false",
            "npm_config_fund": "false",
        })

        wait_for_registry_package(package_spec, retries=retries, delay=delay, env=env)
        assert_version_smoke(
            npm_exec_cmd(package_spec, "version"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec version",
        )
        assert_version_json_smoke(
            npm_exec_cmd(package_spec, "version", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec version JSON",
        )
        assert_workspace_json_smoke(
            npm_exec_cmd(package_spec, "workspace", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec workspace JSON",
        )
        assert_workspace_strict_failure_smoke(
            npm_exec_cmd(package_spec, "workspace", "--strict", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec workspace strict JSON failure",
        )
        assert_workspace_strict_success_smoke(
            npm_exec_cmd(
                package_spec,
                "workspace",
                "--root",
                str(workspace_strict_root),
                "--learning-file",
                str(tmp_root / "registry-workspace-strict-learning.json"),
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec workspace strict JSON success",
        )
        assert_main_help_smoke(
            npm_exec_cmd(package_spec, "help"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec main help",
        )
        run_expected_failure(
            npm_exec_cmd(package_spec, EXPECTED_UNKNOWN_COMMAND),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec unknown command",
        )
        run_expected_failure(
            npm_exec_cmd(package_spec, "help", EXPECTED_UNKNOWN_HELP_TOPIC),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec unknown help topic",
            assertion=assert_unknown_help_topic_failure,
        )
        run_expected_failure(
            npm_exec_cmd(package_spec, "list", EXPECTED_UNKNOWN_LIST_DOMAIN),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec unknown list domain",
            assertion=assert_unknown_list_domain_failure,
        )
        unknown_route_smokes = (
            ("prompt", npm_exec_cmd(package_spec, "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
            ("pack", npm_exec_cmd(package_spec, "pack", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
            ("examples", npm_exec_cmd(package_spec, "examples", "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
            ("check", npm_exec_cmd(package_spec, "check", "--examples", "--route", EXPECTED_UNKNOWN_ROUTE_ID)),
        )
        for label, command in unknown_route_smokes:
            run_expected_failure(
                command,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec unknown route id {label}",
                assertion=assert_unknown_route_id_failure,
            )
        for command_name, option, suggestion in EXPECTED_UNKNOWN_OPTION_SMOKES:
            assert_unknown_option_smoke(
                npm_exec_cmd(package_spec, *unknown_option_args(command_name, option)),
                command_name=command_name,
                option=option,
                suggestion=suggestion,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec unknown {command_name} option",
            )
        run_expected_failure(
            npm_exec_cmd(package_spec, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", EXPECTED_UNKNOWN_SEARCH_DIR),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec unknown search dir value",
            assertion=assert_search_dir_value_failure,
        )
        for label, args, expected_message in EXPECTED_NUMERIC_VALUE_SMOKES:
            assert_numeric_value_smoke(
                npm_exec_cmd(package_spec, *args),
                expected_message=expected_message,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec invalid numeric value {label}",
            )
        help_topics = read_help_topics(npm_exec_cmd(package_spec, "help", "--json"), cwd=npx_root, env=env)
        for topic in help_topics:
            assert_help_topic_smoke(
                npm_exec_cmd(package_spec, "help", topic),
                topic=topic,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec help topic {topic}",
            )
        for alias in EXPECTED_HELP_ALIASES:
            assert_help_topic_smoke(
                npm_exec_cmd(package_spec, "help", alias),
                topic=alias,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec help alias {alias}",
            )
        for command in EXPECTED_COMMAND_ALIAS_COMMANDS:
            assert_command_alias_smoke(
                npm_exec_cmd(package_spec, *command),
                command=command,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec command alias {' '.join(command)}",
            )
        assert_functional_alias_smokes(
            lambda *args: npm_exec_cmd(package_spec, *args),
            run_command=run_plain,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec functional alias",
        )
        for kind in ("skills", "commands", "agents"):
            assert_list_smoke(
                npm_exec_cmd(package_spec, "list", kind),
                kind=kind,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec list {kind}",
            )
            assert_list_json_smoke(
                npm_exec_cmd(package_spec, "list", kind, "--json"),
                kind=kind,
                cwd=npx_root,
                env=env,
                context=f"registry smoke npm exec list {kind} JSON",
            )
        assert_search_smoke(
            npm_exec_cmd(package_spec, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec search corpus",
        )
        assert_search_human_smoke(
            npm_exec_cmd(package_spec, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec search human corpus",
        )
        assert_show_smoke(
            npm_exec_cmd(package_spec, "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec show corpus",
        )
        assert_show_human_smoke(
            npm_exec_cmd(package_spec, "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec show human corpus",
        )
        assert_show_range_smoke(
            npm_exec_cmd(
                package_spec,
                "show",
                EXPECTED_CORPUS_SHOW_REL_PATH,
                "--lines",
                EXPECTED_CORPUS_SHOW_RANGE,
                "--json",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec show line range",
        )
        assert_show_human_range_smoke(
            npm_exec_cmd(package_spec, "show", EXPECTED_CORPUS_SHOW_REL_PATH, "--lines", EXPECTED_CORPUS_SHOW_RANGE),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec show human line range",
        )
        assert_route_catalog_smoke(
            npm_exec_cmd(package_spec, "routes", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec routes catalog",
        )
        assert_route_catalog_smoke(
            npm_exec_cmd(package_spec, "route", "--list", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec route list catalog",
        )
        assert_route_smoke(
            npm_exec_cmd(package_spec, "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec route recommendation",
        )
        assert_route_explain_smoke(
            npm_exec_cmd(package_spec, "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--explain"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec route explanation",
        )
        route_brief = npx_root / "route-brief.md"
        write_smoke_brief(route_brief)
        assert_route_smoke(
            npm_exec_cmd(package_spec, "route", "--from-file", str(route_brief), "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec route from file",
        )
        assert_route_stdin_smoke(
            npm_exec_cmd(package_spec, "route", "--stdin", "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec route stdin",
        )
        prompt_json = npx_root / "prompt.json"
        assert_prompt_smoke(
            npm_exec_cmd(
                package_spec,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(prompt_json),
                "--force",
            ),
            prompt_json,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt plan",
        )
        assert_prompt_stdout_smoke(
            npm_exec_cmd(
                package_spec,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt stdout",
        )
        assert_prompt_markdown_smoke(
            npm_exec_cmd(
                package_spec,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt markdown stdout",
        )
        prompt_markdown = npx_root / "prompt.md"
        assert_prompt_markdown_file_smoke(
            npm_exec_cmd(
                package_spec,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--out",
                str(prompt_markdown),
                "--force",
            ),
            prompt_markdown,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt markdown file",
        )
        assert_output_overwrite_smoke(
            npm_exec_cmd(
                package_spec,
                "prompt",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--out",
                str(prompt_markdown),
            ),
            prompt_markdown,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt output overwrite",
        )
        prompt_file_json = npx_root / "prompt-from-file.json"
        assert_prompt_smoke(
            npm_exec_cmd(
                package_spec,
                "prompt",
                "--from-file",
                str(route_brief),
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(prompt_file_json),
                "--force",
            ),
            prompt_file_json,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt from file",
        )
        prompt_stdin_json = npx_root / "prompt-stdin.json"
        assert_prompt_stdin_smoke(
            npm_exec_cmd(
                package_spec,
                "prompt",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--json",
                "--out",
                str(prompt_stdin_json),
                "--force",
            ),
            prompt_stdin_json,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt stdin",
        )
        pack_json = npx_root / "pack.json"
        assert_pack_smoke(
            npm_exec_cmd(
                package_spec,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(pack_json),
                "--force",
            ),
            pack_json,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec prompt pack",
        )
        assert_pack_stdout_smoke(
            npm_exec_cmd(
                package_spec,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec pack stdout",
        )
        assert_pack_markdown_smoke(
            npm_exec_cmd(
                package_spec,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec pack markdown stdout",
        )
        pack_markdown = npx_root / "pack.md"
        assert_pack_markdown_file_smoke(
            npm_exec_cmd(
                package_spec,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--out",
                str(pack_markdown),
                "--force",
            ),
            pack_markdown,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec pack markdown file",
        )
        assert_output_overwrite_smoke(
            npm_exec_cmd(
                package_spec,
                "pack",
                EXPECTED_ROUTE_BRIEF,
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--out",
                str(pack_markdown),
            ),
            pack_markdown,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec pack output overwrite",
        )
        pack_file_json = npx_root / "pack-from-file.json"
        assert_pack_smoke(
            npm_exec_cmd(
                package_spec,
                "pack",
                "--from-file",
                str(route_brief),
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(pack_file_json),
                "--force",
            ),
            pack_file_json,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec pack from file",
        )
        pack_stdin_json = npx_root / "pack-stdin.json"
        assert_pack_stdin_smoke(
            npm_exec_cmd(
                package_spec,
                "pack",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--max-bytes",
                str(EXPECTED_PACK_MAX_BYTES),
                "--json",
                "--out",
                str(pack_stdin_json),
                "--force",
            ),
            pack_stdin_json,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec pack stdin",
        )
        assert_examples_smoke(
            npm_exec_cmd(package_spec, "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec examples corpus",
        )
        assert_examples_human_smoke(
            npm_exec_cmd(package_spec, "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec examples human corpus",
        )
        assert_check_examples_smoke(
            npm_exec_cmd(
                package_spec,
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
            env=env,
            context="registry smoke npm exec check examples",
        )
        assert_check_all_routes_issues_only_smoke(
            npm_exec_cmd(
                package_spec,
                "check",
                "--examples",
                "--all-routes",
                "--limit",
                "1",
                "--issues-only",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec check all routes issues only",
        )
        check_artifact = npx_root / EXPECTED_CHECK_ARTIFACT_NAME
        write_check_artifact(check_artifact)
        assert_check_artifact_smoke(
            npm_exec_cmd(
                package_spec,
                "check",
                str(check_artifact),
                "--route",
                EXPECTED_ROUTE_ID,
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec check artifact",
        )
        assert_check_stdin_smoke(
            npm_exec_cmd(
                package_spec,
                "check",
                "--stdin",
                "--route",
                EXPECTED_ROUTE_ID,
                "--strict",
                "--json",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec check stdin",
        )
        check_learning_artifact = npx_root / "registry-check-learning.md"
        check_learning_profile = npx_root / "registry-check-learning.json"
        write_check_learning_capture_artifact(check_learning_artifact)
        assert_check_learning_capture_smoke(
            npm_exec_cmd(
                package_spec,
                "check",
                str(check_learning_artifact),
                "--learn",
                "--yes",
                "--learning-file",
                str(check_learning_profile),
                "--json",
            ),
            profile_path=check_learning_profile,
            expected_file_suffix=check_learning_artifact.name,
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec check learning capture",
        )
        assert_audit_smoke(
            npm_exec_cmd(package_spec, "audit", "--strict", "--quiet"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec audit strict",
        )
        assert_audit_json_smoke(
            npm_exec_cmd(package_spec, "audit", "--strict", "--quiet", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec audit JSON",
        )
        assert_learning_feedback_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-feedback-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn feedback",
        )
        assert_learning_init_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-init-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn init",
        )
        assert_learning_verify_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-verify-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn verify",
        )
        assert_learning_backup_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-backup-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn backup",
        )
        assert_learning_import_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-import-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn import",
        )
        assert_learning_redact_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-redact-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn redact",
        )
        assert_learning_stats_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-stats-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn stats",
        )
        assert_learning_audit_cleanup_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-audit-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn audit cleanup",
        )
        assert_learning_relevance_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-relevance-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learning relevance",
        )
        assert_update_dry_run_smoke(
            npm_exec_cmd(package_spec, "update", "--dry-run"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec update dry run",
        )
        assert_update_dry_run_json_smoke(
            npm_exec_cmd(package_spec, "update", "--dry-run", "--json"),
            prefix="registry-design-",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec update dry-run JSON",
        )
        doctor_json = npx_root / "doctor.json"
        status_json = npx_root / "status.json"
        install_json = npx_root / "install.json"
        uninstall_json = npx_root / "uninstall.json"
        assert_install_lifecycle_smoke(
            npm_exec_shell_cmd(
                package_spec,
                help_topic_script(help_topics) + " && "
                + help_alias_script() + " && "
                + command_alias_script() + " && "
                "design-ai install && "
                "design-ai doctor --json > doctor.json && "
                "design-ai doctor --strict && "
                "design-ai status && "
                "design-ai status --json > status.json && "
                "design-ai uninstall && "
                "design-ai install --json > install.json && "
                "design-ai uninstall --json > uninstall.json",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke install lifecycle",
        )
        assert_doctor_report_clean(read_doctor_report(doctor_json), context="registry smoke install")
        assert_status_json_file(status_json, prefix="registry-design-", context="registry smoke status JSON")
        assert_install_json_file(install_json, prefix="registry-design-", context="registry smoke install JSON")
        assert_uninstall_json_file(uninstall_json, prefix="registry-design-", context="registry smoke uninstall JSON")


def run_self_test() -> None:
    run_doctor_assertions_self_test(context="registry smoke install", quiet=True)

    with tempfile.TemporaryDirectory(prefix="design-ai-registry-smoke-self-test-") as tmp:
        tmp_root = Path(tmp)
        report_path = tmp_root / "doctor.json"
        report_path.write_text(passing_doctor_report_json(), encoding="utf-8")
        assert_doctor_report_clean(read_doctor_report(report_path), context="registry smoke install")

        invalid_json_path = tmp_root / "invalid-doctor.json"
        invalid_json_path.write_text("{", encoding="utf-8")
        expect_self_test_failure(
            lambda: read_doctor_report(invalid_json_path),
            expected="failed to parse registry smoke doctor JSON",
            scope="registry smoke",
        )

        ansi_path = tmp_root / "ansi-doctor.json"
        ansi_path.write_text("\x1b[31m{}", encoding="utf-8")
        expect_self_test_failure(
            lambda: read_doctor_report(ansi_path),
            expected="ANSI escape",
            scope="registry smoke",
        )

        missing_check_path = tmp_root / "missing-check-doctor.json"
        missing_check_path.write_text(doctor_report_json_missing("Registry smoke check"), encoding="utf-8")
        expect_self_test_failure(
            lambda: assert_doctor_report_clean(
                read_doctor_report(missing_check_path),
                context="registry smoke install",
            ),
            expected="Registry smoke check=missing",
            scope="registry smoke",
        )

        expect_self_test_failure(
            lambda: read_doctor_report(tmp_root / "missing-doctor.json"),
            expected="failed to read registry smoke doctor JSON",
            scope="registry smoke",
        )

        workspace_cmd = ["design-ai", "workspace", "--json"]
        workspace_strict_cmd = ["design-ai", "workspace", "--strict", "--json"]
        assert_workspace_json(
            passing_workspace_json(),
            context="registry smoke self-test",
            cmd=workspace_cmd,
        )
        assert_workspace_strict_failure_json(
            passing_workspace_json(),
            returncode=1,
            context="registry smoke self-test",
            cmd=workspace_strict_cmd,
        )
        assert_workspace_strict_success_json(
            passing_workspace_strict_clean_json(),
            returncode=0,
            context="registry smoke self-test",
            cmd=workspace_strict_cmd,
        )
        expect_self_test_failure(
            lambda: assert_workspace_strict_failure_json(
                passing_workspace_strict_clean_json(),
                returncode=1,
                context="registry smoke self-test",
                cmd=workspace_strict_cmd,
            ),
            expected="missing a strict readiness issue",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_workspace_strict_success_json(
                passing_workspace_json(),
                returncode=0,
                context="registry smoke self-test",
                cmd=workspace_strict_cmd,
            ),
            expected="readiness warnings/failures",
            scope="registry smoke",
        )

        check_learning_profile_path = tmp_root / "check-learning.json"
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
            "/tmp/check-learning.md",
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
            context="registry smoke self-test",
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
                context="registry smoke self-test",
                cmd=check_learning_cmd,
            ),
            expected="check learning capture counts changed",
            scope="registry smoke",
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
                context="registry smoke self-test",
                cmd=check_learning_cmd,
            ),
            expected="check learning capture metadata changed",
            scope="registry smoke",
        )

        learning_feedback_path = tmp_root / "learning-feedback.json"
        learning_feedback_payload = {
            "file": str(learning_feedback_path),
            "count": 1,
            "feedback": {
                "outcome": "keep",
                "category": "workflow",
                "instruction": "Repeat in future outputs: Keep audit findings short and evidence-led",
            },
            "entry": {
                "id": "registry-feedback-entry",
                "category": "workflow",
                "text": "Repeat in future outputs: Keep audit findings short and evidence-led",
                "source": "feedback:keep",
                "createdAt": "2026-05-22T00:00:00.000Z",
            },
        }
        learn_feedback_cmd = [
            "design-ai",
            "learn",
            "--feedback",
            "Keep audit findings short and evidence-led",
            "--outcome",
            "keep",
            "--file",
            str(learning_feedback_path),
            "--json",
        ]
        assert_learning_feedback_json(
            json.dumps(learning_feedback_payload),
            profile_path=learning_feedback_path,
            outcome="keep",
            category="workflow",
            expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
            expected_count=1,
            context="registry smoke self-test",
            cmd=learn_feedback_cmd,
        )
        learning_feedback_out_path = tmp_root / "registry-learning-feedback-out.json"
        learning_feedback_out_path.write_text(json.dumps(learning_feedback_payload), encoding="utf-8")
        learn_feedback_out_cmd = [
            "design-ai",
            "learn",
            "--feedback",
            "Keep audit findings short and evidence-led",
            "--outcome",
            "keep",
            "--file",
            str(learning_feedback_path),
            "--json",
            "--out",
            str(learning_feedback_out_path),
            "--force",
        ]
        assert_output_write_success(
            f"Wrote {learning_feedback_out_path}\n",
            context="registry smoke self-test feedback out",
            cmd=learn_feedback_out_cmd,
            expected_path=str(learning_feedback_out_path),
        )
        assert_learning_feedback_json(
            learning_feedback_out_path.read_text(encoding="utf-8"),
            profile_path=learning_feedback_path,
            outcome="keep",
            category="workflow",
            expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
            expected_count=1,
            context="registry smoke self-test feedback out file",
            cmd=learn_feedback_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_feedback_json(
                json.dumps({
                    **learning_feedback_payload,
                    "feedback": {
                        **learning_feedback_payload["feedback"],
                        "outcome": "avoid",
                    },
                }),
                profile_path=learning_feedback_path,
                outcome="keep",
                category="workflow",
                expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
                expected_count=1,
                context="registry smoke self-test",
                cmd=learn_feedback_cmd,
            ),
            expected="learn feedback outcome changed",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-feedback.json\n",
                context="registry smoke self-test feedback out",
                cmd=learn_feedback_out_cmd,
                expected_path=str(learning_feedback_out_path),
            ),
            expected="output write success",
            scope="registry smoke",
        )

        learning_init_path = tmp_root / "learning-init.json"
        learning_init_entries = [
            {
                "id": "learn-init-preference",
                "category": "preference",
                "text": "Recommend one best path instead of broad options.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:00.000Z",
            },
            {
                "id": "learn-init-workflow",
                "category": "workflow",
                "text": "Read repository context before changing files.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:01.000Z",
            },
            {
                "id": "learn-init-accessibility",
                "category": "accessibility",
                "text": "Keep WCAG 2.1 AA checks explicit.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:02.000Z",
            },
            {
                "id": "learn-init-korean",
                "category": "korean",
                "text": "Prefer Pretendard for Korean product UI.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:03.000Z",
            },
            {
                "id": "learn-init-brand",
                "category": "brand",
                "text": "Use restrained product UI language.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:04.000Z",
            },
            {
                "id": "learn-init-constraint",
                "category": "constraint",
                "text": "Do not call external AI APIs during local learning.",
                "source": "init:local-dogfood",
                "createdAt": "2026-05-22T00:00:05.000Z",
            },
        ]
        learning_init_payload = {
            "file": str(learning_init_path),
            "dryRun": True,
            "applied": False,
            "source": "init:local-dogfood",
            "candidateCount": 6,
            "addedCount": 6,
            "skippedCount": 0,
            "count": 6,
            "entries": learning_init_entries,
            "skipped": [],
        }
        learn_init_cmd = ["design-ai", "learn", "--init", "--file", str(learning_init_path), "--json"]
        assert_learning_init_json(
            json.dumps(learning_init_payload),
            profile_path=learning_init_path,
            dry_run=True,
            added_count=6,
            skipped_count=0,
            count=6,
            context="registry smoke self-test",
            cmd=learn_init_cmd,
        )
        assert_learning_init_json(
            json.dumps({
                **learning_init_payload,
                "dryRun": False,
                "applied": True,
            }),
            profile_path=learning_init_path,
            dry_run=False,
            added_count=6,
            skipped_count=0,
            count=6,
            context="registry smoke self-test",
            cmd=["design-ai", "learn", "--init", "--yes", "--file", str(learning_init_path), "--json"],
        )
        duplicate_init_payload = {
            **learning_init_payload,
            "dryRun": False,
            "applied": True,
            "addedCount": 0,
            "skippedCount": 6,
            "entries": [],
            "skipped": [
                {
                    "reason": "duplicate-entry-text",
                    "category": entry["category"],
                    "textPreview": entry["text"],
                }
                for entry in learning_init_entries
            ],
        }
        assert_learning_init_json(
            json.dumps(duplicate_init_payload),
            profile_path=learning_init_path,
            dry_run=False,
            added_count=0,
            skipped_count=6,
            count=6,
            context="registry smoke self-test",
            cmd=["design-ai", "learn", "--init", "--yes", "--file", str(learning_init_path), "--json"],
        )
        expect_self_test_failure(
            lambda: assert_learning_init_json(
                json.dumps({**learning_init_payload, "candidateCount": 5}),
                profile_path=learning_init_path,
                dry_run=True,
                added_count=6,
                skipped_count=0,
                count=6,
                context="registry smoke self-test",
                cmd=learn_init_cmd,
            ),
            expected="learn init counts changed",
            scope="registry smoke",
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
                profile_path=learning_init_path,
                dry_run=True,
                added_count=6,
                skipped_count=0,
                count=6,
                context="registry smoke self-test",
                cmd=learn_init_cmd,
            ),
            expected="learn init entry categories changed",
            scope="registry smoke",
        )

        learning_verify_path = tmp_root / "learning-verify.json"
        learning_verify_payload = {
            "source": str(learning_verify_path),
            "importable": True,
            "count": 2,
            "auditSummary": {
                "status": "warn",
                "failures": 0,
                "warnings": 1,
            },
            "issues": [
                {
                    "level": "warning",
                    "code": "duplicate-entry-id",
                    "entryId": "registry-verify-entry",
                    "message": "Entry id duplicates registry-verify-entry and can make deletion ambiguous.",
                },
            ],
            "entries": [
                {
                    "id": "registry-verify-entry",
                    "category": "brand",
                    "source": "import:registry-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                    "textPreview": "Use quiet enterprise language",
                },
                {
                    "id": "registry-verify-entry",
                    "category": "korean",
                    "source": "import:cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                    "textPreview": "Prefer dense Korean mobile layouts",
                },
            ],
        }
        learn_verify_cmd = ["design-ai", "learn", "--verify", "--from-file", str(learning_verify_path), "--json"]
        assert_learning_verify_json(
            json.dumps(learning_verify_payload),
            source=str(learning_verify_path),
            context="registry smoke self-test",
            cmd=learn_verify_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_verify_json(
                json.dumps({**learning_verify_payload, "importable": False}),
                source=str(learning_verify_path),
                context="registry smoke self-test",
                cmd=learn_verify_cmd,
            ),
            expected="learn verify importable flag changed",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_verify_json(
                json.dumps({
                    **learning_verify_payload,
                    "issues": [
                        {
                            **learning_verify_payload["issues"][0],
                            "code": "duplicate-entry-text",
                        },
                    ],
                }),
                source=str(learning_verify_path),
                context="registry smoke self-test",
                cmd=learn_verify_cmd,
            ),
            expected="learn verify duplicate-id warning changed",
            scope="registry smoke",
        )
        learning_verify_out_path = tmp_root / "learning-verify-out.json"
        learn_verify_out_cmd = [
            "design-ai",
            "learn",
            "--verify",
            "--from-file",
            str(learning_verify_path),
            "--json",
            "--out",
            str(learning_verify_out_path),
            "--force",
        ]
        learning_verify_out_path.write_text(json.dumps(learning_verify_payload), encoding="utf-8")
        assert_output_write_success(
            f"Wrote {learning_verify_out_path}\n",
            context="registry smoke self-test verify out",
            cmd=learn_verify_out_cmd,
            expected_path=str(learning_verify_out_path),
        )
        assert_learning_verify_json(
            learning_verify_out_path.read_text(encoding="utf-8"),
            source=str(learning_verify_path),
            context="registry smoke self-test verify out file",
            cmd=learn_verify_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-verify.json\n",
                context="registry smoke self-test verify out",
                cmd=learn_verify_out_cmd,
                expected_path=str(learning_verify_out_path),
            ),
            expected="output write success",
            scope="registry smoke",
        )

        learning_backup_path = tmp_root / "learning-backup.json"
        learning_backup_payload = {
            "file": str(learning_backup_path),
            "version": 1,
            "updatedAt": "2026-05-22T00:00:01.000Z",
            "exportedAt": "2026-05-22T00:01:00.000Z",
            "count": 2,
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "entries": [
                {
                    "id": "registry-backup-brand",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "registry-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "registry-backup-korean",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "feedback:keep",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
        }
        learn_backup_cmd = ["design-ai", "learn", "--backup", "--file", str(learning_backup_path), "--json"]
        assert_learning_backup_json(
            json.dumps(learning_backup_payload),
            profile_path=learning_backup_path,
            context="registry smoke self-test",
            cmd=learn_backup_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_backup_json(
                json.dumps({**learning_backup_payload, "entries": []}),
                profile_path=learning_backup_path,
                context="registry smoke self-test",
                cmd=learn_backup_cmd,
            ),
            expected="learn backup entries list changed",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_backup_json(
                json.dumps({
                    **learning_backup_payload,
                    "entries": [
                        {
                            **learning_backup_payload["entries"][0],
                            "text": "",
                        },
                        learning_backup_payload["entries"][1],
                    ],
                }),
                profile_path=learning_backup_path,
                context="registry smoke self-test",
                cmd=learn_backup_cmd,
            ),
            expected="learn backup entries should preserve full text",
            scope="registry smoke",
        )
        learning_backup_out_path = tmp_root / "learning-backup-out.json"
        learn_backup_out_cmd = [
            "design-ai",
            "learn",
            "--backup",
            "--file",
            str(learning_backup_path),
            "--json",
            "--out",
            str(learning_backup_out_path),
            "--force",
        ]
        learning_backup_out_path.write_text(json.dumps(learning_backup_payload), encoding="utf-8")
        assert_output_write_success(
            f"Wrote {learning_backup_out_path}\n",
            context="registry smoke self-test backup out",
            cmd=learn_backup_out_cmd,
            expected_path=str(learning_backup_out_path),
        )
        assert_learning_backup_json(
            learning_backup_out_path.read_text(encoding="utf-8"),
            profile_path=learning_backup_path,
            context="registry smoke self-test backup out file",
            cmd=learn_backup_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-backup.json\n",
                context="registry smoke self-test backup out",
                cmd=learn_backup_out_cmd,
                expected_path=str(learning_backup_out_path),
            ),
            expected="output write success",
            scope="registry smoke",
        )

        learning_import_path = tmp_root / "learning-import.json"
        learning_import_payload = {
            "file": str(learning_import_path),
            "dryRun": True,
            "applied": False,
            "importedCount": 2,
            "addedCount": 1,
            "skippedCount": 1,
            "count": 2,
            "added": [
                {
                    "id": "registry-import-generated",
                    "category": "korean",
                    "source": "import:cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                    "textPreview": "Prefer dense Korean mobile layouts",
                },
            ],
            "skipped": [
                {
                    "reason": "duplicate-entry-text",
                    "category": "brand",
                    "textPreview": "Use quiet enterprise language",
                },
            ],
        }
        learn_import_cmd = [
            "design-ai",
            "learn",
            "--import",
            "--from-file",
            str(tmp_root / "registry-import-source.json"),
            "--dry-run",
            "--file",
            str(learning_import_path),
            "--json",
        ]
        assert_learning_import_json(
            json.dumps(learning_import_payload),
            profile_path=learning_import_path,
            dry_run=True,
            context="registry smoke self-test",
            cmd=learn_import_cmd,
        )
        learning_import_out_path = tmp_root / "registry-learning-import-out.json"
        learning_import_out_path.write_text(json.dumps(learning_import_payload), encoding="utf-8")
        learn_import_out_cmd = [
            "design-ai",
            "learn",
            "--import",
            "--from-file",
            str(tmp_root / "registry-import-source.json"),
            "--dry-run",
            "--file",
            str(learning_import_path),
            "--json",
            "--out",
            str(learning_import_out_path),
            "--force",
        ]
        assert_output_write_success(
            f"Wrote {learning_import_out_path}\n",
            context="registry smoke self-test import out",
            cmd=learn_import_out_cmd,
            expected_path=str(learning_import_out_path),
        )
        assert_learning_import_json(
            learning_import_out_path.read_text(encoding="utf-8"),
            profile_path=learning_import_path,
            dry_run=True,
            context="registry smoke self-test import out file",
            cmd=learn_import_out_cmd,
        )
        assert_learning_import_json(
            json.dumps({**learning_import_payload, "dryRun": False, "applied": True}),
            profile_path=learning_import_path,
            dry_run=False,
            context="registry smoke self-test",
            cmd=[
                "design-ai",
                "learn",
                "--import",
                "--stdin",
                "--yes",
                "--file",
                str(learning_import_path),
                "--json",
            ],
        )
        expect_self_test_failure(
            lambda: assert_learning_import_json(
                json.dumps({**learning_import_payload, "addedCount": 2}),
                profile_path=learning_import_path,
                dry_run=True,
                context="registry smoke self-test",
                cmd=learn_import_cmd,
            ),
            expected="learn import counts changed",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-import.json\n",
                context="registry smoke self-test import out",
                cmd=learn_import_out_cmd,
                expected_path=str(learning_import_out_path),
            ),
            expected="output write success",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_import_json(
                json.dumps({
                    **learning_import_payload,
                    "skipped": [
                        {
                            **learning_import_payload["skipped"][0],
                            "reason": "duplicate-entry-id",
                        },
                    ],
                }),
                profile_path=learning_import_path,
                dry_run=True,
                context="registry smoke self-test",
                cmd=learn_import_cmd,
            ),
            expected="learn import duplicate skip metadata changed",
            scope="registry smoke",
        )

        learning_redact_path = tmp_root / "learning-redact.json"
        learning_redact_payload = {
            "file": str(learning_redact_path),
            "redacted": True,
            "count": 2,
            "redactedCount": 1,
            "sourceAuditSummary": {
                "status": "warn",
                "failures": 0,
                "warnings": 1,
            },
            "auditSummary": {
                "status": "pass",
                "failures": 0,
                "warnings": 0,
            },
            "redactions": [
                {
                    "entryId": "registry-sensitive",
                    "codes": [
                        "sensitive-secret-assignment",
                        "sensitive-openai-secret-key",
                    ],
                },
            ],
            "entries": [
                {
                    "id": "registry-sensitive",
                    "category": "constraint",
                    "source": "registry-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                    "text": (
                        "Never include [REDACTED:secret-assignment]: "
                        "[REDACTED:openai-secret-key] in shared learning profiles"
                    ),
                },
                {
                    "id": "registry-clean",
                    "category": "korean",
                    "source": "registry-smoke",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                    "text": "Prefer dense Korean mobile layouts",
                },
            ],
        }
        learn_redact_cmd = ["design-ai", "learn", "--redact", "--file", str(learning_redact_path), "--json"]
        assert_learning_redact_json(
            json.dumps(learning_redact_payload),
            profile_path=learning_redact_path,
            context="registry smoke self-test",
            cmd=learn_redact_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_redact_json(
                json.dumps({**learning_redact_payload, "redactedCount": 0}),
                profile_path=learning_redact_path,
                context="registry smoke self-test",
                cmd=learn_redact_cmd,
            ),
            expected="learn redact metadata changed",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_redact_json(
                json.dumps({
                    **learning_redact_payload,
                    "redactions": [
                        {
                            "entryId": "registry-sensitive",
                            "codes": ["sensitive-secret-assignment"],
                        },
                    ],
                }),
                profile_path=learning_redact_path,
                context="registry smoke self-test",
                cmd=learn_redact_cmd,
            ),
            expected="learn redact redactions changed",
            scope="registry smoke",
        )

        learning_profile_path = tmp_root / "learning-stats.json"
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
                "registry-smoke": 1,
                "feedback:keep": 1,
                "import:cli": 1,
            },
            "oldestEntry": {
                "id": "registry-brand",
                "category": "brand",
                "source": "registry-smoke",
                "createdAt": "2026-05-22T00:00:00.000Z",
                "textPreview": "Use quiet enterprise brand language",
            },
            "latestEntry": {
                "id": "registry-korean",
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
            context="registry smoke self-test",
            cmd=learn_stats_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_stats_json(
                json.dumps({
                    **learning_stats_payload,
                    "sourceCounts": {
                        "registry-smoke": 3,
                    },
                }),
                profile_path=learning_profile_path,
                context="registry smoke self-test",
                cmd=learn_stats_cmd,
            ),
            expected="learn stats source distribution changed",
            scope="registry smoke",
        )
        learning_stats_out_path = Path(tmp) / "registry-learning-stats-out.json"
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
            context="registry smoke self-test stats out",
            cmd=learn_stats_out_cmd,
            expected_path=str(learning_stats_out_path),
        )
        assert_learning_stats_json(
            learning_stats_out_path.read_text(encoding="utf-8"),
            profile_path=learning_profile_path,
            context="registry smoke self-test stats out file",
            cmd=learn_stats_out_cmd,
        )
        expect_self_test_failure(
            lambda: assert_output_write_success(
                "Wrote different-stats.json\n",
                context="registry smoke self-test stats out",
                cmd=learn_stats_out_cmd,
                expected_path=str(learning_stats_out_path),
            ),
            expected="output write success",
            scope="registry smoke",
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
                "Sources: registry-smoke 1, feedback:keep 1, import:cli 1",
                "",
                "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
                "        registry-korean - 2026-05-22T00:00:03.000Z",
                "Oldest: [brand] Use quiet enterprise brand language",
                "        registry-brand - 2026-05-22T00:00:00.000Z",
            ]),
            context="registry smoke self-test",
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
                    "        registry-korean - 2026-05-22T00:00:03.000Z",
                    "Oldest: [brand] Use quiet enterprise brand language",
                    "        registry-brand - 2026-05-22T00:00:00.000Z",
                ]),
                context="registry smoke self-test",
                cmd=learn_stats_human_cmd,
            ),
            expected="learn stats human output missing 'Sources: registry-smoke 1, feedback:keep 1, import:cli 1'",
            scope="registry smoke",
        )

        learning_relevance_path = tmp_root / "learning-relevance.json"
        learning_query_payload = {
            "file": str(learning_relevance_path),
            "exists": True,
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
                    "source": "registry-smoke",
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
            profile_path=learning_relevance_path,
            context="registry smoke self-test",
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
                profile_path=learning_relevance_path,
                context="registry smoke self-test",
                cmd=learn_query_cmd,
            ),
            expected="learn query explain should include matched query tokens",
            scope="registry smoke",
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
                f"File: {learning_relevance_path}",
                "Entries: 1/3",
                "Query: keyboard accessibility",
                "Limit: 2",
                "Explain: selection score, matched tokens, and reason",
                "",
                "1. [accessibility] Prioritize keyboard accessibility details for Button component API specs",
                "   learn-relevant · 2026-05-22T00:00:01.000Z",
                "   score 4 · matched keyboard, accessibility · reason brief-match",
            ]),
            context="registry smoke self-test",
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
                context="registry smoke self-test",
                cmd=learn_query_human_cmd,
            ),
            expected="learn query human output missing 'reason brief-match'",
            scope="registry smoke",
        )

        learning_query_export_payload = {
            "file": str(learning_relevance_path),
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
            profile_path=learning_relevance_path,
            context="registry smoke self-test",
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
                profile_path=learning_relevance_path,
                context="registry smoke self-test",
                cmd=learn_query_export_cmd,
            ),
            expected="learn query export should not use recency fallback",
            scope="registry smoke",
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
        }
        learning_relevance_cmd = ["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--with-learning", "--json"]
        assert_learning_relevance_context(
            learning_relevance_payload,
            context="registry smoke self-test",
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
                context="registry smoke self-test",
                cmd=learning_relevance_cmd,
            ),
            expected="brief relevance should pick the Button accessibility entry",
            scope="registry smoke",
        )

        learning_audit_path = tmp_root / "learning-audit.json"
        duplicate_command_args = [
            "design-ai",
            "learn",
            "--file",
            str(learning_audit_path),
            "--forget",
            "registry-audit-b",
            "--yes",
        ]
        sensitive_command_args = [
            "design-ai",
            "learn",
            "--file",
            str(learning_audit_path),
            "--forget",
            "registry-audit-c",
            "--yes",
        ]
        learning_audit_payload = {
            "file": str(learning_audit_path),
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
                    "entryId": "registry-audit-b",
                    "message": "Entry duplicates registry-audit-a in the same category.",
                },
                {
                    "level": "warning",
                    "code": "sensitive-secret-assignment",
                    "entryId": "registry-audit-c",
                    "message": "Entry may contain a secret-like assignment.",
                },
            ],
            "suggestions": [
                {
                    "issueCode": "duplicate-entry-text",
                    "entryId": "registry-audit-b",
                    "action": "remove-duplicate",
                    "message": "Remove the duplicate entry.",
                    "commandArgs": duplicate_command_args,
                    "command": " ".join(duplicate_command_args),
                },
                {
                    "issueCode": "sensitive-secret-assignment",
                    "entryId": "registry-audit-c",
                    "action": "remove-or-redact-sensitive-content",
                    "message": "Remove this entry or re-add a redacted preference.",
                    "commandArgs": sensitive_command_args,
                    "command": " ".join(sensitive_command_args),
                },
            ],
        }
        learn_audit_cmd = ["design-ai", "learn", "--audit", "--file", str(learning_audit_path), "--json"]
        assert_learning_audit_cleanup_json(
            json.dumps(learning_audit_payload),
            profile_path=learning_audit_path,
            context="registry smoke self-test",
            cmd=learn_audit_cmd,
        )
        learning_audit_fix_payload = {
            "file": str(learning_audit_path),
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
                    "entryId": "registry-audit-b",
                    "issueCodes": ["duplicate-entry-text"],
                    "actions": ["remove-duplicate"],
                    "commandArgs": duplicate_command_args,
                    "command": " ".join(duplicate_command_args),
                },
                {
                    "entryId": "registry-audit-c",
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
            str(learning_audit_path),
            "--json",
        ]
        assert_learning_audit_fix_json(
            json.dumps(learning_audit_fix_payload),
            profile_path=learning_audit_path,
            dry_run=True,
            context="registry smoke self-test",
            cmd=learn_audit_fix_cmd,
        )
        assert_learning_audit_fix_json(
            json.dumps({
                **learning_audit_fix_payload,
                "dryRun": False,
                "applied": True,
                "removed": [
                    {
                        "id": "registry-audit-b",
                        "category": "workflow",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                        "textPreview": "Prefer release notes that state evidence before claims",
                    },
                    {
                        "id": "registry-audit-c",
                        "category": "constraint",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
                        "textPreview": "Never include api_key=redacted placeholders in prompt context",
                    },
                ],
                "after": {
                    "status": "pass",
                    "failures": 0,
                    "warnings": 0,
                },
            }),
            profile_path=learning_audit_path,
            dry_run=False,
            context="registry smoke self-test",
            cmd=[
                "design-ai",
                "learn",
                "--audit",
                "--fix",
                "--yes",
                "--file",
                str(learning_audit_path),
                "--json",
            ],
        )
        learn_audit_human_cmd = ["design-ai", "learn", "--audit", "--file", str(learning_audit_path)]
        assert_learning_audit_cleanup_human(
            "\n".join([
                "design-ai learn",
                "Local learning profile audit",
                "Status: warn",
                "Suggested cleanup:",
                "- remove-duplicate (registry-audit-b): Remove the duplicate entry.",
                "  design-ai learn --file /tmp/learning.json --forget registry-audit-b --yes",
                "- remove-or-redact-sensitive-content (registry-audit-c): Remove sensitive content.",
                "  design-ai learn --file /tmp/learning.json --forget registry-audit-c --yes",
            ]),
            context="registry smoke self-test",
            cmd=learn_audit_human_cmd,
        )
        expect_self_test_failure(
            lambda: assert_learning_audit_cleanup_json(
                json.dumps({**learning_audit_payload, "suggestions": []}),
                profile_path=learning_audit_path,
                context="registry smoke self-test",
                cmd=learn_audit_cmd,
            ),
            expected="learn audit duplicate cleanup suggestion changed",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_audit_fix_json(
                json.dumps({**learning_audit_fix_payload, "cleanup": []}),
                profile_path=learning_audit_path,
                dry_run=True,
                context="registry smoke self-test",
                cmd=learn_audit_fix_cmd,
            ),
            expected="learn audit fix cleanup entry changed: registry-audit-b",
            scope="registry smoke",
        )
        expect_self_test_failure(
            lambda: assert_learning_audit_cleanup_human(
                "Local learning profile audit\nStatus: warn\n",
                context="registry smoke self-test",
                cmd=learn_audit_human_cmd,
            ),
            expected="learn audit human output missing 'Suggested cleanup:'",
            scope="registry smoke",
        )

    expect_self_test_failure(
        lambda: smoke_registry_package("self-test-package", retries=0, delay=0),
        expected="--retries must be at least 1",
        scope="registry smoke",
    )
    expect_self_test_failure(
        lambda: smoke_registry_package("self-test-package", retries=1, delay=-1),
        expected="--delay cannot be negative",
        scope="registry smoke",
    )

    print("Registry smoke self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "package_spec",
        nargs="?",
        default=DEFAULT_PACKAGE_SPEC,
        help=f"npm package spec to smoke-test (default: {DEFAULT_PACKAGE_SPEC})",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=12,
        help="Number of npm view attempts while waiting for registry propagation",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=10.0,
        help="Seconds to wait between registry propagation attempts",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run local doctor JSON assertion fixtures without contacting npm",
    )
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    smoke_registry_package(args.package_spec, retries=args.retries, delay=args.delay)
    print(f"Registry smoke passed: {args.package_spec}")


if __name__ == "__main__":
    main()
