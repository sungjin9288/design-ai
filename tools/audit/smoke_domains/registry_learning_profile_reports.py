from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_registry_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}: {format_cmd(cmd)}")


def assert_learning_stats_json(
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
        raise SystemExit(f"{context}: failed to parse learn stats JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn stats JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn stats JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("exists") is True,
        context=context,
        cmd=cmd,
        message="learn stats profile should exist",
    )
    require_registry_smoke(
        payload.get("version") == 1,
        context=context,
        cmd=cmd,
        message="learn stats version changed",
    )
    require_registry_smoke(
        payload.get("updatedAt") == "2026-05-22T00:00:03.000Z",
        context=context,
        cmd=cmd,
        message="learn stats updatedAt changed",
    )
    require_registry_smoke(
        payload.get("count") == 3,
        context=context,
        cmd=cmd,
        message="learn stats entry count changed",
    )

    category_counts = payload.get("categoryCounts")
    require_registry_smoke(
        isinstance(category_counts, dict)
        and category_counts.get("brand") == 1
        and category_counts.get("accessibility") == 1
        and category_counts.get("korean") == 1,
        context=context,
        cmd=cmd,
        message="learn stats category distribution changed",
    )
    source_counts = payload.get("sourceCounts")
    require_registry_smoke(
        isinstance(source_counts, dict)
        and source_counts.get("registry-smoke") == 1
        and source_counts.get("feedback:keep") == 1
        and source_counts.get("import:cli") == 1,
        context=context,
        cmd=cmd,
        message="learn stats source distribution changed",
    )

    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
        isinstance(audit_summary, dict)
        and audit_summary.get("status") == "pass"
        and audit_summary.get("failures") == 0
        and audit_summary.get("warnings") == 0,
        context=context,
        cmd=cmd,
        message="learn stats audit summary changed",
    )

    latest = payload.get("latestEntry")
    oldest = payload.get("oldestEntry")
    require_registry_smoke(
        isinstance(latest, dict)
        and latest.get("id") == "registry-korean"
        and latest.get("category") == "korean"
        and latest.get("source") == "import:cli"
        and latest.get("textPreview") == "Prefer dense Korean mobile layouts with compact controls",
        context=context,
        cmd=cmd,
        message="learn stats latest entry summary changed",
    )
    require_registry_smoke(
        isinstance(oldest, dict)
        and oldest.get("id") == "registry-brand"
        and oldest.get("category") == "brand"
        and oldest.get("source") == "registry-smoke",
        context=context,
        cmd=cmd,
        message="learn stats oldest entry summary changed",
    )

def assert_learning_stats_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Local learning profile stats",
        "Exists: yes",
        "Entries: 3",
        "Updated: 2026-05-22T00:00:03.000Z",
        "Audit: pass (0 failure(s), 0 warning(s))",
        "Categories: brand 1, accessibility 1, korean 1",
        "Sources: registry-smoke 1, feedback:keep 1, import:cli 1",
        "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
        "registry-korean",
        "Oldest: [brand] Use quiet enterprise brand language",
        "registry-brand",
        "2026-05-22T00:00:00.000Z",
        "2026-05-22T00:00:03.000Z",
    ):
        require_registry_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn stats human output missing {expected!r}",
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn audit JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn audit JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("exists") is True and payload.get("count") == 3,
        context=context,
        cmd=cmd,
        message="learn audit profile metadata changed",
    )

    summary = payload.get("summary")
    require_registry_smoke(
        isinstance(summary, dict)
        and summary.get("status") == "warn"
        and summary.get("failures") == 0
        and isinstance(summary.get("warnings"), int)
        and not isinstance(summary.get("warnings"), bool)
        and summary["warnings"] >= 2,
        context=context,
        cmd=cmd,
        message="learn audit warning summary changed",
    )

    issues = payload.get("issues")
    require_registry_smoke(
        isinstance(issues, list)
        and any(
            issue.get("code") == "duplicate-entry-text" and issue.get("entryId") == "registry-audit-b"
            for issue in issues
            if isinstance(issue, dict)
        )
        and any(
            issue.get("code") == "sensitive-secret-assignment" and issue.get("entryId") == "registry-audit-c"
            for issue in issues
            if isinstance(issue, dict)
        ),
        context=context,
        cmd=cmd,
        message="learn audit issues changed",
    )

    suggestions = payload.get("suggestions")
    require_registry_smoke(
        isinstance(suggestions, list),
        context=context,
        cmd=cmd,
        message="learn audit suggestions missing",
    )
    duplicate_command_args = [
        "design-ai",
        "learn",
        "--file",
        str(profile_path),
        "--forget",
        "registry-audit-b",
        "--yes",
    ]
    sensitive_command_args = [
        "design-ai",
        "learn",
        "--file",
        str(profile_path),
        "--forget",
        "registry-audit-c",
        "--yes",
    ]
    duplicate_suggestion = next(
        (
            suggestion for suggestion in suggestions
            if (
                isinstance(suggestion, dict)
                and suggestion.get("action") == "remove-duplicate"
                and suggestion.get("entryId") == "registry-audit-b"
            )
        ),
        None,
    )
    sensitive_suggestion = next(
        (
            suggestion for suggestion in suggestions
            if (
                isinstance(suggestion, dict)
                and suggestion.get("action") == "remove-or-redact-sensitive-content"
                and suggestion.get("entryId") == "registry-audit-c"
            )
        ),
        None,
    )
    require_registry_smoke(
        isinstance(duplicate_suggestion, dict)
        and duplicate_suggestion.get("commandArgs") == duplicate_command_args
        and "--forget registry-audit-b --yes" in duplicate_suggestion.get("command", ""),
        context=context,
        cmd=cmd,
        message="learn audit duplicate cleanup suggestion changed",
    )
    require_registry_smoke(
        isinstance(sensitive_suggestion, dict)
        and sensitive_suggestion.get("commandArgs") == sensitive_command_args
        and "--forget registry-audit-c --yes" in sensitive_suggestion.get("command", ""),
        context=context,
        cmd=cmd,
        message="learn audit sensitive cleanup suggestion changed",
    )

def assert_learning_audit_cleanup_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Local learning profile audit",
        "Status: warn",
        "Suggested cleanup:",
        "remove-duplicate (registry-audit-b)",
        "remove-or-redact-sensitive-content (registry-audit-c)",
        "--forget registry-audit-b --yes",
        "--forget registry-audit-c --yes",
    ):
        require_registry_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn audit human output missing {expected!r}",
        )
