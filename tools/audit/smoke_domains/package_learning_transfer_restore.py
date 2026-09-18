from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_learning_redact_json(
    raw: str,
    *,
    profile_path: Path,
    expected_count: int,
    expected_redacted_count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn redact JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn redact JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn redact JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("redacted") is True, context=context, cmd=cmd, message="learn redact marker missing")
    require_package_smoke(payload.get("count") == expected_count, context=context, cmd=cmd, message="learn redact count changed")
    require_package_smoke(
        payload.get("redactedCount") == expected_redacted_count,
        context=context,
        cmd=cmd,
        message="learn redact redactedCount changed",
    )

    source_audit = payload.get("sourceAuditSummary")
    require_package_smoke(
        isinstance(source_audit, dict) and source_audit.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn redact source audit should warn for the fixture",
    )
    audit_summary = payload.get("auditSummary")
    require_package_smoke(
        isinstance(audit_summary, dict) and audit_summary.get("status") == "pass",
        context=context,
        cmd=cmd,
        message="learn redact redacted audit should pass for the fixture",
    )

    redactions = payload.get("redactions")
    require_package_smoke(
        isinstance(redactions, list) and len(redactions) == expected_redacted_count,
        context=context,
        cmd=cmd,
        message="learn redact redactions list changed",
    )
    require_package_smoke(
        redactions and redactions[0].get("entryId") == "learn-sensitive",
        context=context,
        cmd=cmd,
        message="learn redact should report the sensitive entry id",
    )
    require_package_smoke(
        set(redactions[0].get("codes", [])) >= {"sensitive-secret-assignment", "sensitive-openai-secret-key"},
        context=context,
        cmd=cmd,
        message="learn redact should report sensitive pattern codes",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == expected_count,
        context=context,
        cmd=cmd,
        message="learn redact entries list changed",
    )
    sensitive_entry = next((entry for entry in entries if entry.get("id") == "learn-sensitive"), None)
    require_package_smoke(isinstance(sensitive_entry, dict), context=context, cmd=cmd, message="learn redact sensitive entry missing")
    redacted_text = sensitive_entry.get("text", "")
    require_package_smoke(
        "[REDACTED:secret-assignment]" in redacted_text and "[REDACTED:openai-secret-key]" in redacted_text,
        context=context,
        cmd=cmd,
        message="learn redact did not include redaction markers",
    )
    require_package_smoke(
        "sk-test" not in redacted_text and "api_key" not in redacted_text,
        context=context,
        cmd=cmd,
        message="learn redact leaked sensitive-looking text",
    )

def assert_learning_diff_json(
    raw: str,
    *,
    profile_path: Path,
    source: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn diff JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn diff JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn diff JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("source") == source, context=context, cmd=cmd, message="learn diff source changed")
    require_package_smoke(payload.get("profileCount") == 1, context=context, cmd=cmd, message="learn diff profile count changed")
    require_package_smoke(payload.get("comparisonCount") == 3, context=context, cmd=cmd, message="learn diff comparison count changed")
    require_package_smoke(payload.get("sameTextCount") == 1, context=context, cmd=cmd, message="learn diff same text count changed")
    require_package_smoke(payload.get("profileOnlyCount") == 0, context=context, cmd=cmd, message="learn diff profile-only count changed")
    require_package_smoke(payload.get("comparisonOnlyCount") == 2, context=context, cmd=cmd, message="learn diff comparison-only count changed")
    require_package_smoke(payload.get("metadataChangedCount") == 1, context=context, cmd=cmd, message="learn diff metadata change count changed")
    require_package_smoke(payload.get("idConflictCount") == 1, context=context, cmd=cmd, message="learn diff id conflict count changed")

    metadata_changed = payload.get("metadataChanged")
    comparison_only = payload.get("comparisonOnly")
    id_conflicts = payload.get("idConflicts")
    require_package_smoke(
        isinstance(metadata_changed, list)
        and len(metadata_changed) == 1
        and metadata_changed[0].get("changedFields") == ["id", "source", "createdAt"],
        context=context,
        cmd=cmd,
        message="learn diff metadata change details changed",
    )
    require_package_smoke(
        isinstance(comparison_only, list)
        and len(comparison_only) == 2
        and {entry.get("id") for entry in comparison_only} == {"learn-new", "learn-existing"},
        context=context,
        cmd=cmd,
        message="learn diff comparison-only entries changed",
    )
    require_package_smoke(
        isinstance(id_conflicts, list)
        and len(id_conflicts) == 1
        and id_conflicts[0].get("id") == "learn-existing",
        context=context,
        cmd=cmd,
        message="learn diff id conflict details changed",
    )

    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict) and privacy.get("mutatesProfile") is False,
        context=context,
        cmd=cmd,
        message="learn diff should report read-only privacy behavior",
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

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn restore JSON file path differs from the smoke profile",
    )
    require_package_smoke(payload.get("source") == source, context=context, cmd=cmd, message="learn restore source changed")
    require_package_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore dry-run/apply flags changed",
    )
    require_package_smoke(payload.get("restorable") is True, context=context, cmd=cmd, message="learn restore should be restorable")
    backup_file = payload.get("backupFile")
    require_package_smoke(isinstance(backup_file, str) and backup_file, context=context, cmd=cmd, message="learn restore backup file is missing")
    if backup_path is not None:
        require_package_smoke(backup_file == str(backup_path), context=context, cmd=cmd, message="learn restore backup file path changed")
    else:
        require_package_smoke(
            f"{profile_path.stem}.restore-backup-" in backup_file,
            context=context,
            cmd=cmd,
            message="learn restore default backup file naming changed",
        )
    require_package_smoke(
        payload.get("backupCreated") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore backup created flag changed",
    )
    require_package_smoke(payload.get("backupEntryCount") == 1, context=context, cmd=cmd, message="learn restore backup entry count changed")
    rollback_command = payload.get("rollbackCommand")
    require_package_smoke(
        isinstance(rollback_command, str)
        and "design-ai learn --restore --from-file" in rollback_command
        and str(profile_path) in rollback_command,
        context=context,
        cmd=cmd,
        message="learn restore rollback command changed",
    )
    require_package_smoke(payload.get("previousCount") == 1, context=context, cmd=cmd, message="learn restore previous count changed")
    require_package_smoke(payload.get("restoredCount") == 3, context=context, cmd=cmd, message="learn restore restored count changed")
    require_package_smoke(payload.get("removedCount") == 0, context=context, cmd=cmd, message="learn restore removed count changed")
    require_package_smoke(payload.get("addedCount") == 2, context=context, cmd=cmd, message="learn restore added count changed")
    require_package_smoke(payload.get("metadataChangedCount") == 1, context=context, cmd=cmd, message="learn restore metadata change count changed")
    require_package_smoke(payload.get("idConflictCount") == 1, context=context, cmd=cmd, message="learn restore id conflict count changed")
    require_package_smoke(
        payload.get("auditSummary") == {"status": "pass", "failures": 0, "warnings": 0},
        context=context,
        cmd=cmd,
        message="learn restore audit summary changed",
    )

    diff = payload.get("diff")
    require_package_smoke(
        isinstance(diff, dict)
        and diff.get("comparisonOnlyCount") == 2
        and diff.get("metadataChangedCount") == 1
        and diff.get("idConflictCount") == 1,
        context=context,
        cmd=cmd,
        message="learn restore diff summary changed",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
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

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore-backups JSON must be an object")
    require_package_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn restore-backups file path changed")
    require_package_smoke(
        payload.get("directory") == str(profile_path.parent)
        and payload.get("pattern") == f"{profile_path.stem}.restore-backup-*.json",
        context=context,
        cmd=cmd,
        message="learn restore-backups search pattern changed",
    )
    require_package_smoke(payload.get("totalCount", 0) >= 1, context=context, cmd=cmd, message="learn restore-backups should find rollback backups")
    require_package_smoke(payload.get("count", 0) >= 1, context=context, cmd=cmd, message="learn restore-backups limited count changed")
    backups = payload.get("backups")
    require_package_smoke(isinstance(backups, list) and backups, context=context, cmd=cmd, message="learn restore-backups backups array missing")
    first = backups[0]
    require_package_smoke(first.get("file") == str(backup_path), context=context, cmd=cmd, message="learn restore-backups latest file changed")
    require_package_smoke(first.get("entryCount") == 1, context=context, cmd=cmd, message="learn restore-backups entry count changed")
    require_package_smoke(
        first.get("auditSummary") == {"status": "pass", "failures": 0, "warnings": 0},
        context=context,
        cmd=cmd,
        message="learn restore-backups audit summary changed",
    )
    restore_preview_command = first.get("restorePreviewCommand")
    require_package_smoke(
        isinstance(restore_preview_command, str)
        and "design-ai learn --restore --from-file" in restore_preview_command
        and str(backup_path) in restore_preview_command
        and str(profile_path) in restore_preview_command,
        context=context,
        cmd=cmd,
        message="learn restore-backups preview command changed",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
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

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn restore-backups prune JSON must be an object")
    require_package_smoke(payload.get("file") == str(profile_path), context=context, cmd=cmd, message="learn restore-backups prune file path changed")
    prune = payload.get("prune")
    require_package_smoke(isinstance(prune, dict), context=context, cmd=cmd, message="learn restore-backups prune payload missing")
    require_package_smoke(prune.get("dryRun") is dry_run, context=context, cmd=cmd, message="learn restore-backups prune dryRun changed")
    require_package_smoke(prune.get("applied") is (not dry_run), context=context, cmd=cmd, message="learn restore-backups prune applied flag changed")
    require_package_smoke(prune.get("keep") == 1, context=context, cmd=cmd, message="learn restore-backups prune keep count changed")
    require_package_smoke(prune.get("candidateCount") == 1, context=context, cmd=cmd, message="learn restore-backups prune candidate count changed")
    expected_deleted_count = 0 if dry_run else 1
    require_package_smoke(prune.get("deletedCount") == expected_deleted_count, context=context, cmd=cmd, message="learn restore-backups prune deleted count changed")
    candidates = prune.get("candidates")
    require_package_smoke(isinstance(candidates, list) and candidates, context=context, cmd=cmd, message="learn restore-backups prune candidates missing")
    require_package_smoke(candidates[0].get("file") == str(deleted_path), context=context, cmd=cmd, message="learn restore-backups prune candidate file changed")
    if not dry_run:
        deleted = prune.get("deleted")
        require_package_smoke(isinstance(deleted, list) and deleted, context=context, cmd=cmd, message="learn restore-backups prune deleted list missing")
        require_package_smoke(deleted[0].get("file") == str(deleted_path), context=context, cmd=cmd, message="learn restore-backups prune deleted file changed")
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("deletesBackupFiles") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn restore-backups prune privacy flags changed",
    )
