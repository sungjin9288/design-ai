from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def write_learning_audit_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": [
                    {
                        "id": "learn-a",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-b",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "learn-c",
                        "category": "constraint",
                        "text": "Never include api_key=redacted placeholders in prompt context",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def write_learning_curation_usage_fixture(profile_path: Path, usage_path: Path) -> None:
    usage_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:10:00.000Z",
                "profileFile": str(profile_path),
                "events": [
                    {
                        "id": "learn-use-package-smoke",
                        "command": "prompt",
                        "routeId": "design-review",
                        "profileFile": str(profile_path),
                        "briefHash": "package-smoke-hash",
                        "category": "",
                        "limit": 12,
                        "selectedEntryIds": ["learn-a", "learn-stale"],
                        "selectedCount": 2,
                        "candidateCount": 3,
                        "matchedCount": 1,
                        "fallbackCount": 1,
                        "queryTokenCount": 2,
                        "auditStatus": "pass",
                        "createdAt": "2026-05-22T00:10:00.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def write_learning_stats_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": [
                    {
                        "id": "learn-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise brand language",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-a11y",
                        "category": "accessibility",
                        "text": "Prefer keyboard-first critique notes",
                        "source": "feedback:keep",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "learn-korean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts with compact controls",
                        "source": "import:cli",
                        "createdAt": "2026-05-22T00:00:03.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

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

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn stats JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn stats JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("exists") is True, context=context, cmd=cmd, message="learn stats profile should exist")
    require_package_smoke(payload.get("version") == 1, context=context, cmd=cmd, message="learn stats version changed")
    require_package_smoke(payload.get("updatedAt") == "2026-05-22T00:00:03.000Z", context=context, cmd=cmd, message="learn stats updatedAt changed")
    require_package_smoke(payload.get("count") == 3, context=context, cmd=cmd, message="learn stats entry count changed")

    category_counts = payload.get("categoryCounts")
    require_package_smoke(
        isinstance(category_counts, dict)
        and category_counts.get("brand") == 1
        and category_counts.get("accessibility") == 1
        and category_counts.get("korean") == 1,
        context=context,
        cmd=cmd,
        message="learn stats category distribution changed",
    )
    source_counts = payload.get("sourceCounts")
    require_package_smoke(
        isinstance(source_counts, dict)
        and source_counts.get("package-smoke") == 1
        and source_counts.get("feedback:keep") == 1
        and source_counts.get("import:cli") == 1,
        context=context,
        cmd=cmd,
        message="learn stats source distribution changed",
    )

    audit_summary = payload.get("auditSummary")
    require_package_smoke(
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
    require_package_smoke(
        isinstance(latest, dict)
        and latest.get("id") == "learn-korean"
        and latest.get("category") == "korean"
        and latest.get("source") == "import:cli"
        and latest.get("textPreview") == "Prefer dense Korean mobile layouts with compact controls",
        context=context,
        cmd=cmd,
        message="learn stats latest entry summary changed",
    )
    require_package_smoke(
        isinstance(oldest, dict)
        and oldest.get("id") == "learn-brand"
        and oldest.get("category") == "brand"
        and oldest.get("source") == "package-smoke",
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
        "Sources: package-smoke 1, feedback:keep 1, import:cli 1",
        "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
        "learn-korean · 2026-05-22T00:00:03.000Z",
        "Oldest: [brand] Use quiet enterprise brand language",
        "learn-brand · 2026-05-22T00:00:00.000Z",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn stats human output missing {expected!r}",
        )

def assert_learning_feedback_json(
    raw: str,
    *,
    profile_path: Path,
    outcome: str,
    category: str,
    expected_instruction: str,
    expected_count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn feedback JSON") from error

    require_package_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON must be an object",
    )
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn feedback JSON file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("count") == expected_count,
        context=context,
        cmd=cmd,
        message="learn feedback JSON count changed",
    )
    feedback = payload.get("feedback")
    entry = payload.get("entry")
    require_package_smoke(
        isinstance(feedback, dict) and isinstance(entry, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON should include feedback and entry objects",
    )
    require_package_smoke(
        feedback.get("outcome") == outcome,
        context=context,
        cmd=cmd,
        message="learn feedback outcome changed",
    )
    require_package_smoke(
        feedback.get("category") == category and entry.get("category") == category,
        context=context,
        cmd=cmd,
        message="learn feedback category changed",
    )
    require_package_smoke(
        entry.get("source") == f"feedback:{outcome}",
        context=context,
        cmd=cmd,
        message="learn feedback source should preserve the outcome",
    )
    require_package_smoke(
        isinstance(feedback.get("instruction"), str)
        and feedback.get("instruction") == entry.get("text")
        and feedback.get("instruction") == expected_instruction,
        context=context,
        cmd=cmd,
        message="learn feedback instruction text changed",
    )

def assert_learning_init_json(
    raw: str,
    *,
    profile_path: Path,
    dry_run: bool,
    added_count: int,
    skipped_count: int,
    count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn init JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn init JSON must be an object")
    require_package_smoke(
        list(payload) == [
            "file",
            "dryRun",
            "applied",
            "source",
            "candidateCount",
            "addedCount",
            "skippedCount",
            "count",
            "entries",
            "skipped",
        ],
        context=context,
        cmd=cmd,
        message="learn init JSON keys changed",
    )
    require_package_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn init file path changed")
    require_package_smoke(payload.get("dryRun") is dry_run, context=context, cmd=cmd, message="learn init dryRun flag changed")
    require_package_smoke(payload.get("applied") is (not dry_run), context=context, cmd=cmd, message="learn init applied flag changed")
    require_package_smoke(payload.get("source") == "init:local-dogfood", context=context, cmd=cmd, message="learn init source changed")
    require_package_smoke(payload.get("candidateCount") == 6, context=context, cmd=cmd, message="learn init candidate count changed")
    require_package_smoke(payload.get("addedCount") == added_count, context=context, cmd=cmd, message="learn init added count changed")
    require_package_smoke(payload.get("skippedCount") == skipped_count, context=context, cmd=cmd, message="learn init skipped count changed")
    require_package_smoke(payload.get("count") == count, context=context, cmd=cmd, message="learn init profile count changed")

    entries = payload.get("entries")
    skipped = payload.get("skipped")
    require_package_smoke(isinstance(entries, list) and len(entries) == added_count, context=context, cmd=cmd, message="learn init entries list changed")
    require_package_smoke(isinstance(skipped, list) and len(skipped) == skipped_count, context=context, cmd=cmd, message="learn init skipped list changed")

    if entries:
        categories = [entry.get("category") for entry in entries if isinstance(entry, dict)]
        require_package_smoke(
            categories == ["preference", "workflow", "accessibility", "korean", "brand", "constraint"],
            context=context,
            cmd=cmd,
            message="learn init entry categories changed",
        )
        require_package_smoke(
            all(
                isinstance(entry, dict)
                and isinstance(entry.get("id"), str)
                and entry["id"].startswith("learn-")
                and entry.get("source") == "init:local-dogfood"
                and isinstance(entry.get("createdAt"), str)
                and isinstance(entry.get("text"), str)
                for entry in entries
            ),
            context=context,
            cmd=cmd,
            message="learn init entry schema changed",
        )
        require_package_smoke(
            "one best path" in entries[0].get("text", "")
            and "repository context" in entries[1].get("text", "")
            and "WCAG 2.1 AA" in entries[2].get("text", "")
            and "Pretendard" in entries[3].get("text", "")
            and "restrained product UI language" in entries[4].get("text", "")
            and "external AI APIs" in entries[5].get("text", ""),
            context=context,
            cmd=cmd,
            message="learn init entry text changed",
        )

    if skipped:
        require_package_smoke(
            all(item.get("reason") == "duplicate-entry-text" for item in skipped if isinstance(item, dict)),
            context=context,
            cmd=cmd,
            message="learn init skipped reason changed",
        )
