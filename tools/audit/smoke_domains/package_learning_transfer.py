from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def write_learning_import_target_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:00.000Z",
                "entries": [
                    {
                        "id": "learn-existing",
                        "category": "brand",
                        "text": "Use quiet enterprise language",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def write_learning_redaction_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:01.000Z",
                "entries": [
                    {
                        "id": "learn-sensitive",
                        "category": "constraint",
                        "text": "Never include api_key: sk-test12345678901234567890 in shared learning profiles",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-clean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def learning_import_payload_text() -> str:
    return json.dumps(
        {
            "file": "/portable/learning.json",
            "entries": [
                {
                    "id": "learn-existing",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "learn-existing",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
        },
        indent=2,
    )

def learning_diff_payload_text() -> str:
    return json.dumps(
        {
            "file": "/portable/learning-diff.json",
            "version": 1,
            "updatedAt": "2026-05-22T00:00:03.000Z",
            "entries": [
                {
                    "id": "learn-existing-restored",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
                {
                    "id": "learn-new",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:02.000Z",
                },
                {
                    "id": "learn-existing",
                    "category": "workflow",
                    "text": "Use a release checklist before handoff",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:03.000Z",
                },
            ],
        },
        indent=2,
    )

def assert_learning_import_json(
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
        raise SystemExit(f"{context}: failed to parse learn import JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn import JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn import JSON file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn import dry-run/apply flags changed",
    )
    require_package_smoke(payload.get("importedCount") == 2, context=context, cmd=cmd, message="learn import source count changed")
    require_package_smoke(payload.get("addedCount") == 1, context=context, cmd=cmd, message="learn import added count changed")
    require_package_smoke(payload.get("skippedCount") == 1, context=context, cmd=cmd, message="learn import skipped count changed")
    require_package_smoke(payload.get("count") == 2, context=context, cmd=cmd, message="learn import final count changed")

    added = payload.get("added")
    skipped = payload.get("skipped")
    require_package_smoke(isinstance(added, list) and len(added) == 1, context=context, cmd=cmd, message="learn import added list missing")
    require_package_smoke(isinstance(skipped, list) and len(skipped) == 1, context=context, cmd=cmd, message="learn import skipped list missing")

    added_entry = added[0]
    skipped_entry = skipped[0]
    require_package_smoke(
        added_entry.get("category") == "korean"
        and added_entry.get("source") == "import:cli"
        and added_entry.get("id") != "learn-existing",
        context=context,
        cmd=cmd,
        message="learn import added entry metadata changed",
    )
    require_package_smoke(
        skipped_entry.get("reason") == "duplicate-entry-text"
        and skipped_entry.get("category") == "brand",
        context=context,
        cmd=cmd,
        message="learn import duplicate skip metadata changed",
    )

def assert_learning_backup_json(
    raw: str,
    *,
    profile_path: Path,
    expected_count: int,
    expected_status: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn backup JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn backup JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn backup JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("version") == 1, context=context, cmd=cmd, message="learn backup version changed")
    require_package_smoke(payload.get("count") == expected_count, context=context, cmd=cmd, message="learn backup count changed")
    require_package_smoke(
        isinstance(payload.get("exportedAt"), str) and payload.get("exportedAt"),
        context=context,
        cmd=cmd,
        message="learn backup exportedAt missing",
    )

    audit_summary = payload.get("auditSummary")
    require_package_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == expected_status,
        context=context,
        cmd=cmd,
        message="learn backup audit summary changed",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == expected_count,
        context=context,
        cmd=cmd,
        message="learn backup entries list changed",
    )
    require_package_smoke(
        all(isinstance(entry, dict) and isinstance(entry.get("text"), str) and entry.get("text") for entry in entries),
        context=context,
        cmd=cmd,
        message="learn backup entries should preserve full text",
    )

def assert_learning_verify_json(
    raw: str,
    *,
    source: str,
    expected_count: int,
    expected_status: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn verify JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn verify JSON must be an object")
    require_package_smoke(
        payload.get("source") == source,
        context=context,
        cmd=cmd,
        message="learn verify JSON source changed",
    )
    require_package_smoke(payload.get("importable") is True, context=context, cmd=cmd, message="learn verify importable flag changed")
    require_package_smoke(payload.get("count") == expected_count, context=context, cmd=cmd, message="learn verify count changed")

    audit_summary = payload.get("auditSummary")
    require_package_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == expected_status,
        context=context,
        cmd=cmd,
        message="learn verify audit summary changed",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == expected_count,
        context=context,
        cmd=cmd,
        message="learn verify entries list changed",
    )
    require_package_smoke(
        all(isinstance(entry, dict) and entry.get("source", "").startswith("import:") for entry in entries),
        context=context,
        cmd=cmd,
        message="learn verify entries should be normalized as import entries",
    )
