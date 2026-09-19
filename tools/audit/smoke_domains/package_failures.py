"""Failure helpers shared by package smoke and its extracted domain modules.

Kept out of package-smoke.py so domain modules can raise the same labelled
SystemExit without importing the executable, whose filename is not a module name.
"""
from __future__ import annotations

from smoke_domains.assertion_helpers import format_cmd


def fail_package_smoke(context: str, cmd: list[str], message: str) -> None:
    raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        fail_package_smoke(context, cmd, message)
