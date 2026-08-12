from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_registry_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}: {format_cmd(cmd)}")


def assert_learning_verify_json(
    raw: str,
    *,
    source: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn verify JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn verify JSON must be an object",
    )
    require_registry_smoke(
        payload.get("source") == source,
        context=context,
        cmd=cmd,
        message="learn verify JSON source changed",
    )
    require_registry_smoke(
        payload.get("importable") is True,
        context=context,
        cmd=cmd,
        message="learn verify importable flag changed",
    )
    require_registry_smoke(
        payload.get("count") == 2,
        context=context,
        cmd=cmd,
        message="learn verify count changed",
    )

    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
        isinstance(audit_summary, dict)
        and audit_summary.get("status") == "warn"
        and audit_summary.get("failures") == 0
        and audit_summary.get("warnings") == 1,
        context=context,
        cmd=cmd,
        message="learn verify audit summary changed",
    )

    issues = payload.get("issues")
    require_registry_smoke(
        isinstance(issues, list)
        and len(issues) == 1
        and issues[0].get("code") == "duplicate-entry-id"
        and issues[0].get("entryId") == "registry-verify-entry",
        context=context,
        cmd=cmd,
        message="learn verify duplicate-id warning changed",
    )

    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 2,
        context=context,
        cmd=cmd,
        message="learn verify entries list changed",
    )
    require_registry_smoke(
        all(
            isinstance(entry, dict)
            and isinstance(entry.get("source"), str)
            and entry["source"].startswith("import:")
            for entry in entries
        ),
        context=context,
        cmd=cmd,
        message="learn verify entries should be normalized as import entries",
    )

    categories = {entry.get("category") for entry in entries if isinstance(entry, dict)}
    previews = {entry.get("textPreview") for entry in entries if isinstance(entry, dict)}
    require_registry_smoke(
        categories == {"brand", "korean"}
        and "Use quiet enterprise language" in previews
        and "Prefer dense Korean mobile layouts" in previews,
        context=context,
        cmd=cmd,
        message="learn verify entry summaries changed",
    )

def assert_learning_restore_json(
    raw: str,
    *,
    profile_path: Path,
    source: str,
    dry_run: bool,
    backup_path: Path | None = None,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn restore JSON") from error

    require_registry_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore JSON must be an object")
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn restore JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(payload.get("source") == source, context=context, cmd=cmd, message="learn restore source changed")
    require_registry_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore dry-run/apply flags changed",
    )
    require_registry_smoke(payload.get("restorable") is True, context=context, cmd=cmd, message="learn restore should be restorable")
    backup_file = payload.get("backupFile")
    require_registry_smoke(isinstance(backup_file, str) and backup_file, context=context, cmd=cmd, message="learn restore backup file is missing")
    if backup_path is not None:
        require_registry_smoke(backup_file == str(backup_path), context=context, cmd=cmd, message="learn restore backup file path changed")
    else:
        require_registry_smoke(
            f"{profile_path.stem}.restore-backup-" in backup_file,
            context=context,
            cmd=cmd,
            message="learn restore default backup file naming changed",
        )
    require_registry_smoke(
        payload.get("backupCreated") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore backup created flag changed",
    )
    require_registry_smoke(payload.get("backupEntryCount") == 1, context=context, cmd=cmd, message="learn restore backup entry count changed")
    rollback_command = payload.get("rollbackCommand")
    require_registry_smoke(
        isinstance(rollback_command, str)
        and "design-ai learn --restore --from-file" in rollback_command
        and str(profile_path) in rollback_command,
        context=context,
        cmd=cmd,
        message="learn restore rollback command changed",
    )
    require_registry_smoke(payload.get("previousCount") == 1, context=context, cmd=cmd, message="learn restore previous count changed")
    require_registry_smoke(payload.get("restoredCount") == 3, context=context, cmd=cmd, message="learn restore restored count changed")
    require_registry_smoke(payload.get("removedCount") == 0, context=context, cmd=cmd, message="learn restore removed count changed")
    require_registry_smoke(payload.get("addedCount") == 2, context=context, cmd=cmd, message="learn restore added count changed")
    require_registry_smoke(payload.get("metadataChangedCount") == 1, context=context, cmd=cmd, message="learn restore metadata change count changed")
    require_registry_smoke(payload.get("idConflictCount") == 1, context=context, cmd=cmd, message="learn restore id conflict count changed")
    require_registry_smoke(
        payload.get("auditSummary") == {"status": "pass", "failures": 0, "warnings": 0},
        context=context,
        cmd=cmd,
        message="learn restore audit summary changed",
    )

    diff = payload.get("diff")
    require_registry_smoke(
        isinstance(diff, dict)
        and diff.get("comparisonOnlyCount") == 2
        and diff.get("metadataChangedCount") == 1
        and diff.get("idConflictCount") == 1,
        context=context,
        cmd=cmd,
        message="learn restore diff summary changed",
    )
    privacy = payload.get("privacy")
    require_registry_smoke(
        isinstance(privacy, dict) and privacy.get("mutatesProfile") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore privacy mutation flag changed",
    )

def assert_learning_restore_backups_json(
    raw: str,
    *,
    profile_path: Path,
    backup_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn restore-backups JSON") from error

    require_registry_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore-backups JSON must be an object")
    require_registry_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn restore-backups file path changed")
    require_registry_smoke(
        payload.get("directory") == str(profile_path.parent)
        and payload.get("pattern") == f"{profile_path.stem}.restore-backup-*.json",
        context=context,
        cmd=cmd,
        message="learn restore-backups search pattern changed",
    )
    require_registry_smoke(payload.get("totalCount", 0) >= 1, context=context, cmd=cmd, message="learn restore-backups should find rollback backups")
    require_registry_smoke(payload.get("count", 0) >= 1, context=context, cmd=cmd, message="learn restore-backups limited count changed")
    backups = payload.get("backups")
    require_registry_smoke(isinstance(backups, list) and backups, context=context, cmd=cmd, message="learn restore-backups backups array missing")
    first = backups[0]
    require_registry_smoke(first.get("file") == str(backup_path), context=context, cmd=cmd, message="learn restore-backups latest file changed")
    require_registry_smoke(first.get("entryCount") == 1, context=context, cmd=cmd, message="learn restore-backups entry count changed")
    require_registry_smoke(
        first.get("auditSummary") == {"status": "pass", "failures": 0, "warnings": 0},
        context=context,
        cmd=cmd,
        message="learn restore-backups audit summary changed",
    )
    restore_preview_command = first.get("restorePreviewCommand")
    require_registry_smoke(
        isinstance(restore_preview_command, str)
        and "design-ai learn --restore --from-file" in restore_preview_command
        and str(backup_path) in restore_preview_command
        and str(profile_path) in restore_preview_command,
        context=context,
        cmd=cmd,
        message="learn restore-backups preview command changed",
    )
    privacy = payload.get("privacy")
    require_registry_smoke(
        isinstance(privacy, dict) and privacy.get("mutatesProfile") is False,
        context=context,
        cmd=cmd,
        message="learn restore-backups privacy mutation flag changed",
    )

def assert_learning_restore_backups_prune_json(
    raw: str,
    *,
    profile_path: Path,
    deleted_path: Path,
    dry_run: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn restore-backups prune JSON") from error

    require_registry_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore-backups prune JSON must be an object")
    require_registry_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn restore-backups prune file path changed")
    prune = payload.get("prune")
    require_registry_smoke(isinstance(prune, dict), context=context, cmd=cmd, message="learn restore-backups prune payload missing")
    require_registry_smoke(prune.get("dryRun") is dry_run, context=context, cmd=cmd, message="learn restore-backups prune dryRun changed")
    require_registry_smoke(prune.get("applied") is (not dry_run), context=context, cmd=cmd, message="learn restore-backups prune applied flag changed")
    require_registry_smoke(prune.get("keep") == 1, context=context, cmd=cmd, message="learn restore-backups prune keep count changed")
    require_registry_smoke(prune.get("candidateCount") == 1, context=context, cmd=cmd, message="learn restore-backups prune candidate count changed")
    expected_deleted_count = 0 if dry_run else 1
    require_registry_smoke(prune.get("deletedCount") == expected_deleted_count, context=context, cmd=cmd, message="learn restore-backups prune deleted count changed")
    candidates = prune.get("candidates")
    require_registry_smoke(isinstance(candidates, list) and candidates, context=context, cmd=cmd, message="learn restore-backups prune candidates missing")
    require_registry_smoke(candidates[0].get("file") == str(deleted_path), context=context, cmd=cmd, message="learn restore-backups prune candidate file changed")
    if not dry_run:
        deleted = prune.get("deleted")
        require_registry_smoke(isinstance(deleted, list) and deleted, context=context, cmd=cmd, message="learn restore-backups prune deleted list missing")
        require_registry_smoke(deleted[0].get("file") == str(deleted_path), context=context, cmd=cmd, message="learn restore-backups prune deleted file changed")
    privacy = payload.get("privacy")
    require_registry_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("deletesBackupFiles") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore-backups prune privacy flags changed",
    )

def assert_learning_redact_json(
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
        raise SystemExit(f"{context}: failed to parse learn redact JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn redact JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn redact JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("redacted") is True
        and payload.get("count") == 2
        and payload.get("redactedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn redact metadata changed",
    )

    source_audit = payload.get("sourceAuditSummary")
    audit_summary = payload.get("auditSummary")
    require_registry_smoke(
        isinstance(source_audit, dict) and source_audit.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn redact source audit should warn for the fixture",
    )
    require_registry_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == "pass",
        context=context,
        cmd=cmd,
        message="learn redact redacted audit should pass for the fixture",
    )

    redactions = payload.get("redactions")
    require_registry_smoke(
        isinstance(redactions, list)
        and len(redactions) == 1
        and redactions[0].get("entryId") == "registry-sensitive"
        and set(redactions[0].get("codes", [])) >= {
            "sensitive-secret-assignment",
            "sensitive-openai-secret-key",
        },
        context=context,
        cmd=cmd,
        message="learn redact redactions changed",
    )

    entries = payload.get("entries")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == 2,
        context=context,
        cmd=cmd,
        message="learn redact entries list changed",
    )
    sensitive_entry = next((entry for entry in entries if entry.get("id") == "registry-sensitive"), None)
    require_registry_smoke(
        isinstance(sensitive_entry, dict),
        context=context,
        cmd=cmd,
        message="learn redact sensitive entry missing",
    )
    redacted_text = sensitive_entry.get("text", "")
    require_registry_smoke(
        "[REDACTED:secret-assignment]" in redacted_text
        and "[REDACTED:openai-secret-key]" in redacted_text,
        context=context,
        cmd=cmd,
        message="learn redact did not include redaction markers",
    )
    require_registry_smoke(
        "sk-test" not in redacted_text and "api_key" not in redacted_text,
        context=context,
        cmd=cmd,
        message="learn redact leaked sensitive-looking text",
    )
