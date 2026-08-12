from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_registry_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}: {format_cmd(cmd)}")


def write_learning_backup_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:01.000Z",
                "entries": [
                    {
                        "id": "registry-backup-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise language",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-backup-korean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts",
                        "source": "feedback:keep",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def write_learning_import_target_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:00.000Z",
                "entries": [
                    {
                        "id": "registry-import-existing",
                        "category": "brand",
                        "text": "Use quiet enterprise language",
                        "source": "registry-smoke",
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
                        "id": "registry-sensitive",
                        "category": "constraint",
                        "text": "Never include api_key: sk-test12345678901234567890 in shared learning profiles",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-clean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts",
                        "source": "registry-smoke",
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
            "file": "/portable/registry-learning.json",
            "entries": [
                {
                    "id": "registry-import-existing",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "registry-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "registry-import-existing",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
            ],
        },
        indent=2,
    )

def learning_restore_payload_text() -> str:
    return json.dumps(
        {
            "file": "/portable/registry-learning-restore.json",
            "version": 1,
            "updatedAt": "2026-05-22T00:00:03.000Z",
            "entries": [
                {
                    "id": "registry-restore-existing-restored",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                },
                {
                    "id": "registry-restore-new",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:02.000Z",
                },
                {
                    "id": "registry-import-existing",
                    "category": "workflow",
                    "text": "Use a release checklist before handoff",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:03.000Z",
                },
            ],
        },
        indent=2,
    )

def learning_verify_payload_text() -> str:
    return json.dumps(
        {
            "file": "/portable/registry-learning.json",
            "entries": [
                {
                    "id": "registry-verify-entry",
                    "category": "brand",
                    "text": "Use quiet enterprise language",
                    "source": "registry-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                },
                {
                    "id": "registry-verify-entry",
                    "category": "korean",
                    "text": "Prefer dense Korean mobile layouts",
                    "source": "cli",
                    "createdAt": "2026-05-22T00:00:01.000Z",
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

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn import JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn import JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn import dry-run/apply flags changed",
    )
    require_registry_smoke(
        payload.get("importedCount") == 2
        and payload.get("addedCount") == 1
        and payload.get("skippedCount") == 1
        and payload.get("count") == 2,
        context=context,
        cmd=cmd,
        message="learn import counts changed",
    )

    added = payload.get("added")
    skipped = payload.get("skipped")
    require_registry_smoke(
        isinstance(added, list) and len(added) == 1,
        context=context,
        cmd=cmd,
        message="learn import added list missing",
    )
    require_registry_smoke(
        isinstance(skipped, list) and len(skipped) == 1,
        context=context,
        cmd=cmd,
        message="learn import skipped list missing",
    )

    added_entry = added[0]
    skipped_entry = skipped[0]
    require_registry_smoke(
        isinstance(added_entry, dict)
        and added_entry.get("category") == "korean"
        and added_entry.get("source") == "import:cli"
        and added_entry.get("id") != "registry-import-existing",
        context=context,
        cmd=cmd,
        message="learn import added entry metadata changed",
    )
    require_registry_smoke(
        isinstance(skipped_entry, dict)
        and skipped_entry.get("reason") == "duplicate-entry-text"
        and skipped_entry.get("category") == "brand",
        context=context,
        cmd=cmd,
        message="learn import duplicate skip metadata changed",
    )

def assert_learning_backup_json(
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
        raise SystemExit(f"{context}: failed to parse learn backup JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn backup JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn backup JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("version") == 1,
        context=context,
        cmd=cmd,
        message="learn backup version changed",
    )
    require_registry_smoke(
        payload.get("updatedAt") == "2026-05-22T00:00:01.000Z",
        context=context,
        cmd=cmd,
        message="learn backup updatedAt changed",
    )
    require_registry_smoke(
        payload.get("count") == 2,
        context=context,
        cmd=cmd,
        message="learn backup count changed",
    )
    require_registry_smoke(
        isinstance(payload.get("exportedAt"), str) and payload.get("exportedAt"),
        context=context,
        cmd=cmd,
        message="learn backup exportedAt missing",
    )

    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
        isinstance(audit_summary, dict)
        and audit_summary.get("status") == "pass"
        and audit_summary.get("failures") == 0
        and audit_summary.get("warnings") == 0,
        context=context,
        cmd=cmd,
        message="learn backup audit summary changed",
    )

    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 2,
        context=context,
        cmd=cmd,
        message="learn backup entries list changed",
    )
    require_registry_smoke(
        all(
            isinstance(entry, dict)
            and isinstance(entry.get("text"), str)
            and entry.get("text")
            for entry in entries
        ),
        context=context,
        cmd=cmd,
        message="learn backup entries should preserve full text",
    )

    entry_by_id = {entry.get("id"): entry for entry in entries if isinstance(entry, dict)}
    first_entry = entry_by_id.get("registry-backup-brand")
    second_entry = entry_by_id.get("registry-backup-korean")
    require_registry_smoke(
        isinstance(first_entry, dict)
        and first_entry.get("category") == "brand"
        and first_entry.get("text") == "Use quiet enterprise language"
        and first_entry.get("source") == "registry-smoke",
        context=context,
        cmd=cmd,
        message="learn backup first entry changed",
    )
    require_registry_smoke(
        isinstance(second_entry, dict)
        and second_entry.get("category") == "korean"
        and second_entry.get("text") == "Prefer dense Korean mobile layouts"
        and second_entry.get("source") == "feedback:keep",
        context=context,
        cmd=cmd,
        message="learn backup second entry changed",
    )
