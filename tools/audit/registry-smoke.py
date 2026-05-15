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
    EXPECTED_CORPUS_SEARCH_QUERY,
    EXPECTED_CORPUS_SHOW_TARGET,
    EXPECTED_EXAMPLES_ROUTE,
    EXPECTED_ROUTE_BRIEF,
    EXPECTED_UNKNOWN_COMMAND,
    EXPECTED_UNKNOWN_HELP_TOPIC,
    EXPECTED_UNKNOWN_LIST_DOMAIN,
    assert_examples_json_route_hit,
    assert_no_ansi,
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
    parse_help_topics,
    passing_doctor_report_json,
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


def assert_search_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_search_json_contains_hit(result.stdout, context=context, cmd=cmd)


def assert_show_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_json_line(result.stdout, context=context, cmd=cmd)


def assert_examples_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_examples_json_route_hit(result.stdout, context=context, cmd=cmd)


def assert_route_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_json_component_spec(result.stdout, context=context, cmd=cmd)


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
        run_plain(npm_exec_cmd(package_spec, "version"), cwd=npx_root, env=env)
        run_plain(npm_exec_cmd(package_spec, "help"), cwd=npx_root, env=env)
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
        help_topics = read_help_topics(npm_exec_cmd(package_spec, "help", "--json"), cwd=npx_root, env=env)
        assert_search_smoke(
            npm_exec_cmd(package_spec, "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec search corpus",
        )
        assert_show_smoke(
            npm_exec_cmd(package_spec, "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec show corpus",
        )
        assert_route_smoke(
            npm_exec_cmd(package_spec, "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec route recommendation",
        )
        assert_examples_smoke(
            npm_exec_cmd(package_spec, "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1", "--json"),
            cwd=npx_root,
            env=env,
            context="registry smoke npm exec examples corpus",
        )
        doctor_json = npx_root / "doctor.json"
        run_plain(
            npm_exec_shell_cmd(
                package_spec,
                help_topic_script(help_topics) + " && "
                + help_alias_script() + " && "
                + command_alias_script() + " && "
                "design-ai install && "
                "design-ai doctor --json > doctor.json && "
                "design-ai doctor --strict && "
                "design-ai status && "
                "design-ai uninstall",
            ),
            cwd=npx_root,
            env=env,
        )
        assert_doctor_report_clean(read_doctor_report(doctor_json), context="registry smoke install")


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
