from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


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
