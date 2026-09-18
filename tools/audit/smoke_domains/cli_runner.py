"""Subprocess runners shared by the package and registry smoke executables.

Both executables drove byte-identical runner bodies apart from one behavior:
package smoke retries a single `npm exec` invocation when npm reports a cache
ENOENT, registry smoke does not. That difference is preserved here as an
explicit, set-once process policy instead of two diverging copies.

Configure the policy from the executable entry point before any runner call:

    from smoke_domains import cli_runner
    cli_runner.configure(npm_exec_retry=True)

Leaving it unconfigured keeps the retry disabled, matching registry smoke.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from smoke_domains.assertion_helpers import assert_no_ansi, format_cmd

_npm_exec_retry = False
_configured = False


def configure(*, npm_exec_retry: bool) -> None:
    """Set the process-wide runner policy exactly once."""
    global _npm_exec_retry, _configured
    if _configured and _npm_exec_retry != npm_exec_retry:
        raise SystemExit(
            "smoke cli_runner policy was already configured with "
            f"npm_exec_retry={_npm_exec_retry!r}; refusing to change it to {npm_exec_retry!r}"
        )
    _npm_exec_retry = npm_exec_retry
    _configured = True


def npm_exec_retry_enabled() -> bool:
    return _npm_exec_retry


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


def _echo(result: subprocess.CompletedProcess[str]) -> None:
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)


def _maybe_retry(
    cmd: list[str],
    result: subprocess.CompletedProcess[str],
    *,
    cwd: Path | None,
    env: dict[str, str] | None,
    input_text: str | None = None,
) -> subprocess.CompletedProcess[str]:
    if not _npm_exec_retry or not is_npm_exec_cache_enoent(cmd, result):
        return result
    retried = retry_npm_exec_once(cmd, cwd=cwd, env=env, input_text=input_text)
    _echo(retried)
    return retried


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
    _echo(result)
    result = _maybe_retry(cmd, result, cwd=cwd, env=env)

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
    _echo(result)
    result = _maybe_retry(cmd, result, cwd=cwd, env=env, input_text=input_text)

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
    assertion,
) -> subprocess.CompletedProcess[str]:
    print(f"$ {format_cmd(cmd)}", flush=True)
    result = subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        capture_output=True,
    )
    _echo(result)
    result = _maybe_retry(cmd, result, cwd=cwd, env=env)

    assertion(
        f"{result.stdout}\n{result.stderr}",
        returncode=result.returncode,
        context=context,
        cmd=cmd,
    )

    return result
