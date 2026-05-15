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
    EXPECTED_CORPUS_SHOW_TARGET,
    EXPECTED_EXAMPLES_ROUTE,
    EXPECTED_HELP_ALIASES,
    EXPECTED_PACK_MAX_BYTES,
    EXPECTED_ROUTE_BRIEF,
    EXPECTED_ROUTE_ID,
    EXPECTED_UNKNOWN_COMMAND,
    EXPECTED_UNKNOWN_HELP_TOPIC,
    EXPECTED_UNKNOWN_LIST_DOMAIN,
    assert_audit_strict_quiet_output,
    assert_check_artifact_json_component_spec,
    assert_check_examples_json_component_spec,
    assert_check_stdin_json_component_spec,
    assert_doctor_json_clean,
    assert_examples_json_route_hit,
    assert_no_ansi,
    assert_pack_json_component_spec,
    assert_pack_markdown_body_component_spec,
    assert_pack_markdown_component_spec,
    assert_prompt_json_component_spec,
    assert_prompt_markdown_body_component_spec,
    assert_prompt_markdown_component_spec,
    assert_route_json_component_spec,
    assert_search_json_contains_hit,
    assert_show_json_line,
    assert_unknown_command_failure,
    assert_unknown_help_topic_failure,
    assert_unknown_list_domain_failure,
    command_alias_script,
    doctor_report_json_missing,
    expect_self_test_failure,
    format_cmd,
    help_alias_script,
    help_topic_script,
    passing_doctor_report_json,
    passing_check_artifact_content,
    parse_help_topics,
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

    if result.returncode != 0:
        raise SystemExit(f"command failed with exit code {result.returncode}: {format_cmd(cmd)}")

    output = f"{result.stdout}\n{result.stderr}"
    assert_no_ansi(output, cmd)

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


def assert_doctor_clean(bin_path: Path, env: dict[str, str]) -> None:
    cmd = [str(bin_path), "doctor", "--json"]
    result = run(cmd, env=env, capture=True)
    assert_doctor_json_clean(
        result.stdout,
        context="package smoke install",
        cmd=cmd,
        parse_error_message="failed to parse doctor JSON after package smoke install",
    )


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


def assert_search_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_search_json_contains_hit(result.stdout, context=context, cmd=cmd)


def assert_show_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_json_line(result.stdout, context=context, cmd=cmd)


def assert_examples_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_examples_json_route_hit(result.stdout, context=context, cmd=cmd)


def write_smoke_brief(brief_path: Path) -> None:
    brief_path.write_text(f"{EXPECTED_ROUTE_BRIEF}\n", encoding="utf-8")


def assert_route_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_json_component_spec(result.stdout, context=context, cmd=cmd)


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


def assert_prompt_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_plain(cmd, cwd=cwd, env=env)
    assert_prompt_json_component_spec(read_json_output_file(output_path, context=context), context=context, cmd=cmd)


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
    run_plain(cmd, cwd=cwd, env=env)
    assert_prompt_markdown_body_component_spec(
        read_markdown_output_file(output_path, context=context),
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
    run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_prompt_json_component_spec(read_json_output_file(output_path, context=context), context=context, cmd=cmd)


def assert_pack_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_plain(cmd, cwd=cwd, env=env)
    assert_pack_json_component_spec(read_json_output_file(output_path, context=context), context=context, cmd=cmd)


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
    run_plain(cmd, cwd=cwd, env=env)
    assert_pack_markdown_body_component_spec(
        read_markdown_output_file(output_path, context=context),
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
    run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_pack_json_component_spec(read_json_output_file(output_path, context=context), context=context, cmd=cmd)


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

        run_plain([str(bin_path), "version"], env=smoke_env)
        run_plain([str(bin_path), "help"], env=smoke_env)
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
        help_topics = read_help_topics([str(bin_path), "help", "--json"], env=smoke_env)
        for topic in help_topics:
            run_plain([str(bin_path), "help", topic], env=smoke_env)
        for alias in EXPECTED_HELP_ALIASES:
            run_plain([str(bin_path), "help", alias], env=smoke_env)
        for command in EXPECTED_COMMAND_ALIAS_COMMANDS:
            run_plain([str(bin_path), *command], env=smoke_env)
        run_plain([str(bin_path), "routes", "--help"], env=smoke_env)
        run_plain([str(bin_path), "install", "--help"], env=smoke_env)
        run_plain([str(bin_path), "list", "skills"], env=smoke_env)
        assert_search_smoke(
            [str(bin_path), "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"],
            env=smoke_env,
            context="package smoke installed bin search corpus",
        )
        assert_show_smoke(
            [str(bin_path), "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"],
            env=smoke_env,
            context="package smoke installed bin show corpus",
        )
        assert_route_smoke(
            [str(bin_path), "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"],
            env=smoke_env,
            context="package smoke installed bin route recommendation",
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
        run_plain([str(bin_path), "install"], env=smoke_env)
        assert_doctor_clean(bin_path, smoke_env)
        run_plain([str(bin_path), "doctor", "--strict"], env=smoke_env)
        run_plain([str(bin_path), "status"], env=smoke_env)
        run_plain([str(bin_path), "uninstall"], env=smoke_env)

        npx_env = base_env.copy()
        npx_env.update({
            "CLAUDE_HOME": str(npx_claude_home),
            "DESIGN_AI_PREFIX": "npx-design-",
            "NO_COLOR": "1",
        })
        run_plain(npm_exec_cmd(tarball, "version"), cwd=npx_root, env=npx_env)
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
        npx_help_topics = read_help_topics(
            npm_exec_cmd(tarball, "help", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec help catalog",
        )
        if npx_help_topics != help_topics:
            raise SystemExit("package smoke npm exec help catalog differs from installed bin catalog")
        assert_search_smoke(
            npm_exec_cmd(tarball, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec search corpus",
        )
        assert_show_smoke(
            npm_exec_cmd(tarball, "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec show corpus",
        )
        assert_route_smoke(
            npm_exec_cmd(tarball, "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"),
            cwd=npx_root,
            env=npx_env,
            context="package smoke npm exec route recommendation",
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
        run_plain(
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
                "design-ai uninstall",
            ),
            cwd=npx_root,
            env=npx_env,
        )
        assert_doctor_report_file(npx_root / "npx-doctor.json", context="package smoke npm exec install")


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
