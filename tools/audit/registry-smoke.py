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
    assert_unknown_command_failure,
    assert_unknown_help_topic_failure,
    assert_unknown_list_domain_failure,
    assert_unknown_option_failure,
    assert_unknown_route_id_failure,
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


def assert_status_json_file(path: Path, *, prefix: str, context: str) -> None:
    assert_status_json(
        path.read_text(encoding="utf-8"),
        prefix=prefix,
        context=context,
        cmd=["design-ai", "status", "--json"],
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
        assert_audit_smoke(
            npm_exec_cmd(package_spec, "audit", "--strict", "--quiet"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec audit strict",
        )
        doctor_json = npx_root / "doctor.json"
        status_json = npx_root / "status.json"
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
                "design-ai uninstall",
            ),
            cwd=npx_root,
            env=env,
            context="registry smoke install lifecycle",
        )
        assert_doctor_report_clean(read_doctor_report(doctor_json), context="registry smoke install")
        assert_status_json_file(status_json, prefix="registry-design-", context="registry smoke status JSON")


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
