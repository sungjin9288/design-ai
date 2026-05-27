#!/usr/bin/env python3
"""
Smoke-test a published design-ai npm package from the registry.

This is meant for post-publish verification, after the local tarball gate has
already passed. It catches registry-only issues such as propagation delay,
incorrect dist-tags, broken public package metadata, or npm exec failures when
users install the package by name.

Usage:
  python3 tools/audit/registry-smoke.py
  python3 tools/audit/registry-smoke.py @design-ai/cli@4.13.0
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
    command_alias_script,
    doctor_report_json_missing,
    expect_self_test_failure,
    format_cmd,
    help_alias_script,
    help_topic_script,
    parse_help_topics,
    passing_doctor_report_json,
    passing_check_artifact_content,
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
        npx_root.mkdir()

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
        assert_learning_stats_smoke(
            lambda *args: npm_exec_cmd(package_spec, *args),
            npx_root / "registry-stats-learning.json",
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec learn stats",
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
