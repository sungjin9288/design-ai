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
  python3 tools/audit/package-smoke.py dist/design-ai-cli-4.13.0.tgz
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
    parse_help_topics,
    seed_force_overwrite_target,
    unknown_option_args,
)


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

    with tempfile.TemporaryDirectory(prefix="design-ai-package-smoke-self-test-") as tmp:
        report_path = Path(tmp) / "doctor.json"
        report_path.write_text(passing_doctor_report_json(), encoding="utf-8")
        assert_doctor_report_file(report_path, context=context)
        expect_self_test_failure(
            lambda: assert_doctor_report_file(Path(tmp) / "missing.json", context=context),
            expected="failed to read doctor JSON",
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
        install_root.mkdir()
        npx_root.mkdir()

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
        assert_learning_audit_cleanup_smoke(
            lambda *args: [str(bin_path), *args],
            tmp_root / "installed-learning.json",
            env=smoke_env,
            context="package smoke installed bin learn audit cleanup",
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
        assert_learning_audit_cleanup_smoke(
            lambda *args: npm_exec_cmd(tarball, *args),
            npx_root / "npx-learning.json",
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec learn audit cleanup",
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
