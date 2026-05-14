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
import shlex
import subprocess
import sys
import tempfile
from pathlib import Path

from smoke_assertions import (
    assert_doctor_json_clean,
    assert_no_ansi,
    doctor_report_json_missing,
    expect_self_test_failure,
    format_cmd,
    passing_doctor_report_json,
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


def parse_help_topics(raw: str, *, context: str, cmd: list[str]) -> list[str]:
    assert_no_ansi(raw, cmd)
    try:
        catalog = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse help JSON after {context}") from error

    if not isinstance(catalog, dict):
        raise SystemExit(f"help JSON after {context} is not an object")

    raw_topics = catalog.get("topics")
    if not isinstance(raw_topics, list):
        raise SystemExit(f"help JSON after {context} does not contain a topics array")

    topics: list[str] = []
    for item in raw_topics:
        topic = item.get("topic") if isinstance(item, dict) else None
        if not isinstance(topic, str) or not topic:
            raise SystemExit(f"help JSON after {context} contains an invalid topic entry")
        topics.append(topic)

    if len(set(topics)) != len(topics):
        raise SystemExit(f"help JSON after {context} contains duplicate topics")

    missing_required = sorted({"help", "install", "route"} - set(topics))
    if missing_required:
        raise SystemExit(
            f"help JSON after {context} is missing required topic(s): {', '.join(missing_required)}"
        )

    return topics


def read_help_topics(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None) -> list[str]:
    result = run_plain(cmd, cwd=cwd, env=env)
    return parse_help_topics(result.stdout, context="package smoke help catalog", cmd=cmd)


def help_topic_script(topics: list[str]) -> str:
    return " && ".join(f"design-ai help {shlex.quote(topic)}" for topic in topics)


def run_self_test() -> None:
    context = "package smoke self-test"
    cmd = ["design-ai", "doctor", "--json"]
    help_cmd = ["design-ai", "help", "--json"]
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

    assert parse_help_topics(
        json.dumps({
            "topics": [
                {"topic": "install"},
                {"topic": "route"},
                {"topic": "help"},
            ],
        }),
        context=context,
        cmd=help_cmd,
    ) == ["install", "route", "help"]
    expect_self_test_failure(
        lambda: parse_help_topics("{", context=context, cmd=help_cmd),
        expected="failed to parse help JSON",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps({"topics": [{"topic": "install"}]}),
            context=context,
            cmd=help_cmd,
        ),
        expected="missing required topic",
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
        help_topics = read_help_topics([str(bin_path), "help", "--json"], env=smoke_env)
        for topic in help_topics:
            run_plain([str(bin_path), "help", topic], env=smoke_env)
        run_plain([str(bin_path), "routes", "--help"], env=smoke_env)
        run_plain([str(bin_path), "install", "--help"], env=smoke_env)
        run_plain([str(bin_path), "list", "skills"], env=smoke_env)
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
        run_plain(
            npm_exec_shell_cmd(
                tarball,
                help_topic_script(help_topics) + " && "
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
