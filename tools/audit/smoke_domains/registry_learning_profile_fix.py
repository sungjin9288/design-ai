from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_registry_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}: {format_cmd(cmd)}")


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
