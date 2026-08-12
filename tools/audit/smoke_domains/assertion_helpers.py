"""Small assertion primitives shared by smoke-domain validators."""
from __future__ import annotations

import re
import shlex

ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")

def format_cmd(cmd: list[str]) -> str:
    return shlex.join(cmd)

def assert_no_ansi(output: str, cmd: list[str]) -> None:
    if ANSI_ESCAPE_RE.search(output):
        raise SystemExit(f"NO_COLOR command emitted ANSI escape sequence: {format_cmd(cmd)}")


def assert_contains_fragments(raw: str, fragments: tuple[str, ...], *, context: str, label: str) -> None:
    missing = [fragment for fragment in fragments if fragment not in raw]
    if missing:
        raise SystemExit(
            f"{label} after {context} missing expected content: {' | '.join(missing)}"
        )


def assert_output_write_success(raw: str, *, context: str, cmd: list[str], expected_path: str) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{") or raw.lstrip().startswith("#"):
        raise SystemExit(f"output write success after {context} looks like artifact content")
    if "Output file already exists:" in raw or "Use --force to overwrite." in raw:
        raise SystemExit(f"output write success after {context} reported overwrite failure")

    assert_contains_fragments(
        raw,
        ("Wrote", expected_path),
        context=context,
        label="output write success",
    )


def assert_smoke_json_keys(
    value: object,
    expected_keys: list[str],
    *,
    label: str,
    context: str,
    command_label: str,
) -> dict[str, object]:
    if not isinstance(value, dict):
        raise SystemExit(f"{command_label} after {context} {label} is not an object")
    if list(value) != expected_keys:
        raise SystemExit(f"{command_label} after {context} {label} keys changed")
    return value
