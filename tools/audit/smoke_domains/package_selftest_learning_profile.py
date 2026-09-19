"""Package smoke self-test: learn init, import, backup, restore, prune, query, and export."""
from __future__ import annotations

import json

from pathlib import Path
from smoke_assertions import (
    EXPECTED_ROUTE_BRIEF,
    EXPECTED_ROUTE_ID,
    assert_output_write_success,
    expect_self_test_failure,
)
from smoke_domains.package_learning_profile import (
    assert_learning_feedback_json,
    assert_learning_init_json,
    assert_learning_stats_human,
    assert_learning_stats_json,
)
from smoke_domains.package_learning_query import (
    assert_learning_query_export_json,
    assert_learning_query_human,
    assert_learning_query_json,
)
from smoke_domains.package_learning_relevance import (
    assert_learning_relevance_context,
    assert_learning_usage_payload,
    assert_learning_usage_sidecar,
    assert_recall_context,
)
from smoke_domains.package_learning_transfer import (
    assert_learning_backup_json,
    assert_learning_import_json,
    assert_learning_verify_json,
)
from smoke_domains.package_learning_transfer_restore import (
    assert_learning_diff_json,
    assert_learning_redact_json,
    assert_learning_restore_backups_json,
    assert_learning_restore_backups_prune_json,
    assert_learning_restore_json,
)


def _self_test_learn_init_import_backup(context, learn_feedback_cmd, learn_feedback_out_cmd, learning_feedback_out_path, learning_feedback_payload, learning_profile_path, tmp):
    """Package smoke self-test: learn init, import, and backup contracts."""
    expect_self_test_failure(
        lambda: assert_learning_feedback_json(
            json.dumps({
                **learning_feedback_payload,
                "entry": {
                    **learning_feedback_payload["entry"],
                    "source": "cli",
                },
            }),
            profile_path=learning_profile_path,
            outcome="keep",
            category="workflow",
            expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
            expected_count=1,
            context=context,
            cmd=learn_feedback_cmd,
        ),
        expected="learn feedback source should preserve the outcome",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            "Wrote different-feedback.json\n",
            context=f"{context} feedback out",
            cmd=learn_feedback_out_cmd,
            expected_path=str(learning_feedback_out_path),
        ),
        expected="output write success",
        scope="package smoke",
    )

    learn_init_cmd = [
        "design-ai",
        "learn",
        "--init",
        "--yes",
        "--file",
        str(learning_profile_path),
        "--json",
    ]
    learning_init_entries = [
        {
            "id": "learn-init-preference",
            "category": "preference",
            "text": "Prefer concise, evidence-led design recommendations with one best path and explicit tradeoffs.",
            "source": "init:local-dogfood",
            "createdAt": "2026-05-22T00:00:00.000Z",
        },
        {
            "id": "learn-init-workflow",
            "category": "workflow",
            "text": "For implementation work, inspect repository context first, keep edits scoped, and run meaningful verification before handoff.",
            "source": "init:local-dogfood",
            "createdAt": "2026-05-22T00:00:01.000Z",
        },
        {
            "id": "learn-init-a11y",
            "category": "accessibility",
            "text": "For non-trivial UI, include keyboard navigation, visible focus, screen-reader behavior, and WCAG 2.1 AA contrast notes.",
            "source": "init:local-dogfood",
            "createdAt": "2026-05-22T00:00:02.000Z",
        },
        {
            "id": "learn-init-korean",
            "category": "korean",
            "text": "When Korean users or Korean copy are involved, use Pretendard, Korean typography line-height, dense mobile conventions, and a consistent honorific level.",
            "source": "init:local-dogfood",
            "createdAt": "2026-05-22T00:00:03.000Z",
        },
        {
            "id": "learn-init-brand",
            "category": "brand",
            "text": "Use restrained product UI language for internal tools and avoid decorative marketing phrasing unless explicitly requested.",
            "source": "init:local-dogfood",
            "createdAt": "2026-05-22T00:00:04.000Z",
        },
        {
            "id": "learn-init-constraint",
            "category": "constraint",
            "text": "Do not add external AI APIs, embeddings, telemetry, or fine-tuning behavior without explicit approval.",
            "source": "init:local-dogfood",
            "createdAt": "2026-05-22T00:00:05.000Z",
        },
    ]
    learning_init_payload = {
        "file": str(learning_profile_path),
        "dryRun": False,
        "applied": True,
        "source": "init:local-dogfood",
        "candidateCount": 6,
        "addedCount": 6,
        "skippedCount": 0,
        "count": 6,
        "entries": learning_init_entries,
        "skipped": [],
    }
    assert_learning_init_json(
        json.dumps(learning_init_payload),
        profile_path=learning_profile_path,
        dry_run=False,
        added_count=6,
        skipped_count=0,
        count=6,
        context=context,
        cmd=learn_init_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_init_json(
            json.dumps({
                **learning_init_payload,
                "source": "cli",
            }),
            profile_path=learning_profile_path,
            dry_run=False,
            added_count=6,
            skipped_count=0,
            count=6,
            context=context,
            cmd=learn_init_cmd,
        ),
        expected="learn init source changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_init_json(
            json.dumps({
                **learning_init_payload,
                "entries": [
                    {
                        **learning_init_entries[0],
                        "category": "workflow",
                    },
                    *learning_init_entries[1:],
                ],
            }),
            profile_path=learning_profile_path,
            dry_run=False,
            added_count=6,
            skipped_count=0,
            count=6,
            context=context,
            cmd=learn_init_cmd,
        ),
        expected="learn init entry categories changed",
        scope="package smoke",
    )

    learn_import_cmd = [
        "design-ai",
        "learn",
        "--import",
        "--from-file",
        str(Path(tmp) / "import.json"),
        "--dry-run",
        "--file",
        str(learning_profile_path),
        "--json",
    ]
    learning_import_payload = {
        "file": str(learning_profile_path),
        "dryRun": True,
        "applied": False,
        "importedCount": 2,
        "addedCount": 1,
        "skippedCount": 1,
        "added": [
            {
                "id": "learn-new",
                "category": "korean",
                "source": "import:cli",
                "createdAt": "2026-05-22T00:00:01.000Z",
                "textPreview": "Prefer dense Korean mobile layouts",
            },
        ],
        "skipped": [
            {
                "id": "learn-existing",
                "category": "brand",
                "source": "import:package-smoke",
                "createdAt": "2026-05-22T00:00:00.000Z",
                "textPreview": "Use quiet enterprise language",
                "reason": "duplicate-entry-text",
            },
        ],
        "count": 2,
    }
    assert_learning_import_json(
        json.dumps(learning_import_payload),
        profile_path=learning_profile_path,
        dry_run=True,
        context=context,
        cmd=learn_import_cmd,
    )
    learning_import_out_path = Path(tmp) / "learning-import-out.json"
    learning_import_out_path.write_text(json.dumps(learning_import_payload), encoding="utf-8")
    learn_import_out_cmd = [
        "design-ai",
        "learn",
        "--import",
        "--from-file",
        str(Path(tmp) / "import.json"),
        "--dry-run",
        "--file",
        str(learning_profile_path),
        "--json",
        "--out",
        str(learning_import_out_path),
        "--force",
    ]
    assert_output_write_success(
        f"Wrote {learning_import_out_path}\n",
        context=f"{context} import out",
        cmd=learn_import_out_cmd,
        expected_path=str(learning_import_out_path),
    )
    assert_learning_import_json(
        learning_import_out_path.read_text(encoding="utf-8"),
        profile_path=learning_profile_path,
        dry_run=True,
        context=f"{context} import out file",
        cmd=learn_import_out_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_import_json(
            json.dumps({**learning_import_payload, "addedCount": 2}),
            profile_path=learning_profile_path,
            dry_run=True,
            context=context,
            cmd=learn_import_cmd,
        ),
        expected="learn import added count changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            "Wrote different-import.json\n",
            context=f"{context} import out",
            cmd=learn_import_out_cmd,
            expected_path=str(learning_import_out_path),
        ),
        expected="output write success",
        scope="package smoke",
    )

    learning_backup_payload = {
        "file": str(learning_profile_path),
        "version": 1,
        "updatedAt": "2026-05-22T00:00:00.000Z",
        "exportedAt": "2026-05-22T00:01:00.000Z",
        "count": 1,
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "entries": [
            {
                "id": "learn-existing",
                "category": "brand",
                "text": "Use quiet enterprise language",
                "source": "package-smoke",
                "createdAt": "2026-05-22T00:00:00.000Z",
            },
        ],
    }
    learn_backup_cmd = ["design-ai", "learn", "--backup", "--file", str(learning_profile_path), "--json"]
    assert_learning_backup_json(
        json.dumps(learning_backup_payload),
        profile_path=learning_profile_path,
        expected_count=1,
        expected_status="pass",
        context=context,
        cmd=learn_backup_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_backup_json(
            json.dumps({**learning_backup_payload, "entries": []}),
            profile_path=learning_profile_path,
            expected_count=1,
            expected_status="pass",
            context=context,
            cmd=learn_backup_cmd,
        ),
        expected="learn backup entries list changed",
        scope="package smoke",
    )

    learning_redact_payload = {
        "file": str(learning_profile_path),
        "version": 1,
        "updatedAt": "2026-05-22T00:00:01.000Z",
        "exportedAt": "2026-05-24T00:00:00.000Z",
        "redacted": True,
        "count": 2,
        "redactedCount": 1,
        "sourceAuditSummary": {
            "status": "warn",
            "failures": 0,
            "warnings": 2,
        },
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "redactions": [
            {
                "entryId": "learn-sensitive",
                "category": "constraint",
                "codes": ["sensitive-secret-assignment", "sensitive-openai-secret-key"],
                "textPreview": "Never include [REDACTED:secret-assignment] [REDACTED:openai-secret-key] in shared...",
            },
        ],
        "entries": [
            {
                "id": "learn-sensitive",
                "category": "constraint",
                "text": "Never include [REDACTED:secret-assignment] [REDACTED:openai-secret-key] in shared learning profiles",
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
    }
    learn_redact_cmd = ["design-ai", "learn", "--redact", "--file", str(learning_profile_path), "--json"]
    assert_learning_redact_json(
        json.dumps(learning_redact_payload),
        profile_path=learning_profile_path,
        expected_count=2,
        expected_redacted_count=1,
        context=context,
        cmd=learn_redact_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_redact_json(
            json.dumps({**learning_redact_payload, "redactedCount": 0}),
            profile_path=learning_profile_path,
            expected_count=2,
            expected_redacted_count=1,
            context=context,
            cmd=learn_redact_cmd,
        ),
        expected="learn redact redactedCount changed",
        scope="package smoke",
    )

    learning_verify_payload = {
        "source": str(Path(tmp) / "learning-backup.json"),
        "importable": True,
        "count": 1,
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "issues": [],
        "entries": [
            {
                "id": "learn-existing",
                "category": "brand",
                "source": "import:package-smoke",
                "createdAt": "2026-05-22T00:00:00.000Z",
                "textPreview": "Use quiet enterprise language",
            },
        ],
    }
    learn_verify_cmd = ["design-ai", "learn", "--verify", "--from-file", str(Path(tmp) / "learning-backup.json"), "--json"]
    assert_learning_verify_json(
        json.dumps(learning_verify_payload),
        source=str(Path(tmp) / "learning-backup.json"),
        expected_count=1,
        expected_status="pass",
        context=context,
        cmd=learn_verify_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_verify_json(
            json.dumps({**learning_verify_payload, "importable": False}),
            source=str(Path(tmp) / "learning-backup.json"),
            expected_count=1,
            expected_status="pass",
            context=context,
            cmd=learn_verify_cmd,
        ),
        expected="learn verify importable flag changed",
        scope="package smoke",
    )
    learning_verify_out_path = Path(tmp) / "learning-verify-out.json"
    learn_verify_out_cmd = [
        "design-ai",
        "learn",
        "--verify",
        "--from-file",
        str(Path(tmp) / "learning-backup.json"),
        "--json",
        "--out",
        str(learning_verify_out_path),
        "--force",
    ]
    learning_verify_out_path.write_text(json.dumps(learning_verify_payload), encoding="utf-8")
    assert_output_write_success(
        f"Wrote {learning_verify_out_path}\n",
        context=f"{context} verify out",
        cmd=learn_verify_out_cmd,
        expected_path=str(learning_verify_out_path),
    )
    assert_learning_verify_json(
        learning_verify_out_path.read_text(encoding="utf-8"),
        source=str(Path(tmp) / "learning-backup.json"),
        expected_count=1,
        expected_status="pass",
        context=f"{context} verify out file",
        cmd=learn_verify_out_cmd,
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            "Wrote different-verify.json\n",
            context=f"{context} verify out",
            cmd=learn_verify_out_cmd,
            expected_path=str(learning_verify_out_path),
        ),
        expected="output write success",
        scope="package smoke",
    )

    learning_diff_path = Path(tmp) / "learning-diff.json"
    return learning_diff_path


def _self_test_learn_restore_and_prune(context, learning_diff_path, learning_profile_path, tmp):
    """Package smoke self-test: learn restore, diff, and backup pruning contracts."""
    learning_diff_payload = {
        "file": str(learning_profile_path),
        "source": str(learning_diff_path),
        "generatedAt": "2026-05-22T00:01:00.000Z",
        "profileExists": True,
        "profileUpdatedAt": "2026-05-22T00:00:00.000Z",
        "comparisonUpdatedAt": "2026-05-22T00:00:03.000Z",
        "profileCount": 1,
        "comparisonCount": 3,
        "profileAuditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "comparisonAuditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "sameTextCount": 1,
        "profileOnlyCount": 0,
        "comparisonOnlyCount": 2,
        "metadataChangedCount": 1,
        "idConflictCount": 1,
        "profileOnly": [],
        "comparisonOnly": [
            {
                "id": "learn-new",
                "category": "korean",
                "source": "backup",
                "createdAt": "2026-05-22T00:00:02.000Z",
                "textPreview": "Prefer dense Korean mobile layouts",
            },
            {
                "id": "learn-existing",
                "category": "workflow",
                "source": "backup",
                "createdAt": "2026-05-22T00:00:03.000Z",
                "textPreview": "Use a release checklist before handoff",
            },
        ],
        "metadataChanged": [
            {
                "key": "brand\nuse quiet enterprise language",
                "changedFields": ["id", "source", "createdAt"],
                "profile": {
                    "id": "learn-existing",
                    "category": "brand",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                    "textPreview": "Use quiet enterprise language",
                },
                "comparison": {
                    "id": "learn-existing-restored",
                    "category": "brand",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:01.000Z",
                    "textPreview": "Use quiet enterprise language",
                },
            },
        ],
        "idConflicts": [
            {
                "id": "learn-existing",
                "profile": {
                    "id": "learn-existing",
                    "category": "brand",
                    "source": "package-smoke",
                    "createdAt": "2026-05-22T00:00:00.000Z",
                    "textPreview": "Use quiet enterprise language",
                },
                "comparison": {
                    "id": "learn-existing",
                    "category": "workflow",
                    "source": "backup",
                    "createdAt": "2026-05-22T00:00:03.000Z",
                    "textPreview": "Use a release checklist before handoff",
                },
            },
        ],
        "recommendations": [],
        "privacy": {
            "storesRawBriefText": False,
            "exposesEntryTextPreview": True,
            "mutatesProfile": False,
        },
    }
    learn_diff_cmd = [
        "design-ai",
        "learn",
        "--diff",
        "--from-file",
        str(learning_diff_path),
        "--file",
        str(learning_profile_path),
        "--json",
    ]
    assert_learning_diff_json(
        json.dumps(learning_diff_payload),
        profile_path=learning_profile_path,
        source=str(learning_diff_path),
        context=context,
        cmd=learn_diff_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_diff_json(
            json.dumps({**learning_diff_payload, "comparisonOnlyCount": 1}),
            profile_path=learning_profile_path,
            source=str(learning_diff_path),
            context=context,
            cmd=learn_diff_cmd,
        ),
        expected="learn diff comparison-only count changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_diff_json(
            json.dumps({
                **learning_diff_payload,
                "privacy": {
                    **learning_diff_payload["privacy"],
                    "mutatesProfile": True,
                },
            }),
            profile_path=learning_profile_path,
            source=str(learning_diff_path),
            context=context,
            cmd=learn_diff_cmd,
        ),
        expected="learn diff should report read-only privacy behavior",
        scope="package smoke",
    )

    learning_restore_path = Path(tmp) / "learning-restore.json"
    learning_restore_backup_path = Path(tmp) / "learning.restore-backup-20260522T000100000Z.json"
    learning_restore_backup_prune_path = Path(tmp) / "learning.restore-backup-20260522T000000000Z.json"
    learning_restore_payload = {
        "file": str(learning_profile_path),
        "source": str(learning_restore_path),
        "generatedAt": "2026-05-22T00:01:00.000Z",
        "dryRun": True,
        "applied": False,
        "restorable": True,
        "profileExists": True,
        "backupFile": str(learning_restore_backup_path),
        "backupCreated": False,
        "backupEntryCount": 1,
        "backupUpdatedAt": "2026-05-22T00:00:00.000Z",
        "rollbackCommand": f"design-ai learn --restore --from-file {learning_restore_backup_path} --file {learning_profile_path} --dry-run",
        "previousUpdatedAt": "2026-05-22T00:00:00.000Z",
        "restoredUpdatedAt": "2026-05-22T00:00:03.000Z",
        "previousCount": 1,
        "restoredCount": 3,
        "removedCount": 0,
        "addedCount": 2,
        "sameTextCount": 1,
        "metadataChangedCount": 1,
        "idConflictCount": 1,
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "issues": [],
        "diff": {
            "profileOnlyCount": 0,
            "comparisonOnlyCount": 2,
            "metadataChangedCount": 1,
            "idConflictCount": 1,
            "profileOnly": [],
            "comparisonOnly": learning_diff_payload["comparisonOnly"],
            "metadataChanged": learning_diff_payload["metadataChanged"],
            "idConflicts": learning_diff_payload["idConflicts"],
        },
        "privacy": {
            "storesRawBriefText": False,
            "exposesEntryTextPreview": True,
            "mutatesProfile": False,
        },
    }
    learn_restore_cmd = [
        "design-ai",
        "learn",
        "--restore",
        "--from-file",
        str(learning_restore_path),
        "--dry-run",
        "--file",
        str(learning_profile_path),
        "--json",
    ]
    assert_learning_restore_json(
        json.dumps(learning_restore_payload),
        profile_path=learning_profile_path,
        source=str(learning_restore_path),
        dry_run=True,
        context=context,
        cmd=learn_restore_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_restore_json(
            json.dumps({**learning_restore_payload, "restoredCount": 2}),
            profile_path=learning_profile_path,
            source=str(learning_restore_path),
            dry_run=True,
            context=context,
            cmd=learn_restore_cmd,
        ),
        expected="learn restore restored count changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_restore_json(
            json.dumps({**learning_restore_payload, "backupCreated": True}),
            profile_path=learning_profile_path,
            source=str(learning_restore_path),
            dry_run=True,
            context=context,
            cmd=learn_restore_cmd,
        ),
        expected="learn restore backup created flag changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_restore_json(
            json.dumps({
                **learning_restore_payload,
                "privacy": {
                    **learning_restore_payload["privacy"],
                    "mutatesProfile": True,
                },
            }),
            profile_path=learning_profile_path,
            source=str(learning_restore_path),
            dry_run=True,
            context=context,
            cmd=learn_restore_cmd,
        ),
        expected="learn restore privacy mutation flag changed",
        scope="package smoke",
    )

    learning_restore_backups_payload = {
        "file": str(learning_profile_path),
        "directory": str(learning_profile_path.parent),
        "pattern": "learning.restore-backup-*.json",
        "generatedAt": "2026-05-22T00:02:00.000Z",
        "limit": 1,
        "totalCount": 1,
        "count": 1,
        "backups": [
            {
                "file": str(learning_restore_backup_path),
                "name": learning_restore_backup_path.name,
                "createdAt": "2026-05-22T00:01:00.000Z",
                "modifiedAt": "2026-05-22T00:01:00.000Z",
                "sizeBytes": 512,
                "updatedAt": "2026-05-22T00:00:00.000Z",
                "entryCount": 1,
                "auditSummary": {
                    "status": "pass",
                    "failures": 0,
                    "warnings": 0,
                },
                "issueCount": 0,
                "restorePreviewCommand": f"design-ai learn --restore --from-file {learning_restore_backup_path} --file {learning_profile_path} --dry-run",
            },
        ],
        "privacy": {
            "storesRawBriefText": False,
            "exposesEntryTextPreview": False,
            "mutatesProfile": False,
        },
    }
    learn_restore_backups_cmd = [
        "design-ai",
        "learn",
        "--restore-backups",
        "--file",
        str(learning_profile_path),
        "--limit",
        "1",
        "--json",
    ]
    assert_learning_restore_backups_json(
        json.dumps(learning_restore_backups_payload),
        profile_path=learning_profile_path,
        backup_path=learning_restore_backup_path,
        context=context,
        cmd=learn_restore_backups_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_restore_backups_json(
            json.dumps({**learning_restore_backups_payload, "totalCount": 0}),
            profile_path=learning_profile_path,
            backup_path=learning_restore_backup_path,
            context=context,
            cmd=learn_restore_backups_cmd,
        ),
        expected="learn restore-backups should find rollback backups",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_restore_backups_json(
            json.dumps({
                **learning_restore_backups_payload,
                "privacy": {
                    **learning_restore_backups_payload["privacy"],
                    "mutatesProfile": True,
                },
            }),
            profile_path=learning_profile_path,
            backup_path=learning_restore_backup_path,
            context=context,
            cmd=learn_restore_backups_cmd,
        ),
        expected="learn restore-backups privacy mutation flag changed",
        scope="package smoke",
    )

    learning_restore_backups_prune_payload = {
        **learning_restore_backups_payload,
        "totalCount": 2,
        "prune": {
            "dryRun": True,
            "applied": False,
            "keep": 1,
            "retainedCount": 1,
            "candidateCount": 1,
            "deletedCount": 0,
            "failureCount": 0,
            "retained": learning_restore_backups_payload["backups"],
            "candidates": [
                {
                    **learning_restore_backups_payload["backups"][0],
                    "file": str(learning_restore_backup_prune_path),
                    "name": learning_restore_backup_prune_path.name,
                    "createdAt": "2026-05-22T00:00:00.000Z",
                    "restorePreviewCommand": f"design-ai learn --restore --from-file {learning_restore_backup_prune_path} --file {learning_profile_path} --dry-run",
                },
            ],
            "deleted": [],
            "failures": [],
        },
        "privacy": {
            "storesRawBriefText": False,
            "exposesEntryTextPreview": False,
            "mutatesProfile": False,
            "deletesBackupFiles": False,
        },
    }
    learn_restore_backups_prune_cmd = [
        "design-ai",
        "learn",
        "--restore-backups",
        "--prune",
        "--keep",
        "1",
        "--file",
        str(learning_profile_path),
        "--json",
    ]
    assert_learning_restore_backups_prune_json(
        json.dumps(learning_restore_backups_prune_payload),
        profile_path=learning_profile_path,
        deleted_path=learning_restore_backup_prune_path,
        dry_run=True,
        context=context,
        cmd=learn_restore_backups_prune_cmd,
    )
    assert_learning_restore_backups_prune_json(
        json.dumps({
            **learning_restore_backups_prune_payload,
            "prune": {
                **learning_restore_backups_prune_payload["prune"],
                "dryRun": False,
                "applied": True,
                "deletedCount": 1,
                "deleted": learning_restore_backups_prune_payload["prune"]["candidates"],
            },
            "privacy": {
                **learning_restore_backups_prune_payload["privacy"],
                "deletesBackupFiles": True,
            },
        }),
        profile_path=learning_profile_path,
        deleted_path=learning_restore_backup_prune_path,
        dry_run=False,
        context=context,
        cmd=[*learn_restore_backups_prune_cmd[:-1], "--yes", "--json"],
    )
    expect_self_test_failure(
        lambda: assert_learning_restore_backups_prune_json(
            json.dumps({
                **learning_restore_backups_prune_payload,
                "prune": {
                    **learning_restore_backups_prune_payload["prune"],
                    "candidateCount": 0,
                },
            }),
            profile_path=learning_profile_path,
            deleted_path=learning_restore_backup_prune_path,
            dry_run=True,
            context=context,
            cmd=learn_restore_backups_prune_cmd,
        ),
        expected="learn restore-backups prune candidate count changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_restore_backups_prune_json(
            json.dumps({
                **learning_restore_backups_prune_payload,
                "privacy": {
                    **learning_restore_backups_prune_payload["privacy"],
                    "deletesBackupFiles": True,
                },
            }),
            profile_path=learning_profile_path,
            deleted_path=learning_restore_backup_prune_path,
            dry_run=True,
            context=context,
            cmd=learn_restore_backups_prune_cmd,
        ),
        expected="learn restore-backups prune privacy flags changed",
        scope="package smoke",
    )

    learning_stats_payload = {
        "file": str(learning_profile_path),
        "exists": True,
        "version": 1,
        "updatedAt": "2026-05-22T00:00:03.000Z",
        "count": 3,
        "categoryCounts": {
            "brand": 1,
            "accessibility": 1,
            "korean": 1,
        },
        "sourceCounts": {
            "package-smoke": 1,
            "feedback:keep": 1,
            "import:cli": 1,
        },
        "oldestEntry": {
            "id": "learn-brand",
            "category": "brand",
            "source": "package-smoke",
            "createdAt": "2026-05-22T00:00:00.000Z",
            "textPreview": "Use quiet enterprise brand language",
        },
        "latestEntry": {
            "id": "learn-korean",
            "category": "korean",
            "source": "import:cli",
            "createdAt": "2026-05-22T00:00:03.000Z",
            "textPreview": "Prefer dense Korean mobile layouts with compact controls",
        },
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
    }
    learn_stats_cmd = ["design-ai", "learn", "--stats", "--file", str(learning_profile_path), "--json"]
    assert_learning_stats_json(
        json.dumps(learning_stats_payload),
        profile_path=learning_profile_path,
        context=context,
        cmd=learn_stats_cmd,
    )
    return learn_stats_cmd, learning_stats_payload


def _self_test_learn_query_and_export(context, learn_stats_cmd, learning_profile_path, learning_stats_payload, tmp):
    """Package smoke self-test: learn list, explain, query, and export contracts."""
    expect_self_test_failure(
        lambda: assert_learning_stats_json(
            json.dumps({
                **learning_stats_payload,
                "sourceCounts": {
                    "package-smoke": 3,
                },
            }),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_stats_cmd,
        ),
        expected="learn stats source distribution changed",
        scope="package smoke",
    )
    learning_stats_out_path = Path(tmp) / "learning-stats-out.json"
    learning_stats_out_path.write_text(json.dumps(learning_stats_payload), encoding="utf-8")
    learn_stats_out_cmd = [
        "design-ai",
        "learn",
        "--stats",
        "--file",
        str(learning_profile_path),
        "--json",
        "--out",
        str(learning_stats_out_path),
        "--force",
    ]
    assert_output_write_success(
        f"Wrote {learning_stats_out_path}\n",
        context=f"{context} stats out",
        cmd=learn_stats_out_cmd,
        expected_path=str(learning_stats_out_path),
    )
    assert_learning_stats_json(
        learning_stats_out_path.read_text(encoding="utf-8"),
        profile_path=learning_profile_path,
        context=f"{context} stats out file",
        cmd=learn_stats_out_cmd,
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            "Wrote different-stats.json\n",
            context=f"{context} stats out",
            cmd=learn_stats_out_cmd,
            expected_path=str(learning_stats_out_path),
        ),
        expected="output write success",
        scope="package smoke",
    )
    learn_stats_human_cmd = ["design-ai", "learn", "--stats", "--file", str(learning_profile_path)]
    assert_learning_stats_human(
        "\n".join([
            "design-ai learn",
            "Local learning profile stats",
            f"File: {learning_profile_path}",
            "Exists: yes",
            "Entries: 3",
            "Updated: 2026-05-22T00:00:03.000Z",
            "Audit: pass (0 failure(s), 0 warning(s))",
            "Categories: brand 1, accessibility 1, korean 1",
            "Sources: package-smoke 1, feedback:keep 1, import:cli 1",
            "",
            "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
            "        learn-korean · 2026-05-22T00:00:03.000Z",
            "Oldest: [brand] Use quiet enterprise brand language",
            "        learn-brand · 2026-05-22T00:00:00.000Z",
        ]),
        context=context,
        cmd=learn_stats_human_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_stats_human(
            "\n".join([
                "design-ai learn",
                "Local learning profile stats",
                f"File: {learning_profile_path}",
                "Exists: yes",
                "Entries: 3",
                "Updated: 2026-05-22T00:00:03.000Z",
                "Audit: pass (0 failure(s), 0 warning(s))",
                "Categories: brand 1, accessibility 1, korean 1",
                "",
                "Latest: [korean] Prefer dense Korean mobile layouts with compact controls",
                "        learn-korean · 2026-05-22T00:00:03.000Z",
                "Oldest: [brand] Use quiet enterprise brand language",
                "        learn-brand · 2026-05-22T00:00:00.000Z",
            ]),
            context=context,
            cmd=learn_stats_human_cmd,
        ),
        expected="learn stats human output missing 'Sources: package-smoke 1, feedback:keep 1, import:cli 1'",
        scope="package smoke",
    )

    learning_query_payload = {
        "file": str(learning_profile_path),
        "version": 1,
        "updatedAt": "2026-05-22T00:00:02.000Z",
        "category": "",
        "query": "keyboard accessibility",
        "limit": 2,
        "entries": [
            {
                "id": "learn-relevant",
                "category": "accessibility",
                "text": "Prioritize keyboard accessibility details for Button component API specs",
                "source": "package-smoke",
                "createdAt": "2026-05-22T00:00:01.000Z",
            },
        ],
        "count": 1,
        "totalCount": 3,
        "selection": {
            "mode": "brief-relevance",
            "query": "keyboard accessibility",
            "candidateCount": 3,
            "matchedCount": 1,
            "queryTokenCount": 2,
            "fallbackEnabled": False,
            "selectedCount": 1,
            "fallbackCount": 0,
            "selected": [
                {
                    "id": "learn-relevant",
                    "category": "accessibility",
                    "score": 2.114533,
                    "matchedTokens": ["accessibility", "keyboard"],
                    "reason": "brief-match",
                },
            ],
        },
    }
    learn_query_cmd = [
        "design-ai",
        "learn",
        "--list",
        "--query",
        "keyboard accessibility",
        "--explain",
        "--limit",
        "2",
        "--json",
    ]
    assert_learning_query_json(
        json.dumps(learning_query_payload),
        profile_path=learning_profile_path,
        context=context,
        cmd=learn_query_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_query_json(
            json.dumps({
                **learning_query_payload,
                "selection": {
                    **learning_query_payload["selection"],
                    "selected": [
                        {
                            **learning_query_payload["selection"]["selected"][0],
                            "matchedTokens": ["keyboard"],
                        },
                    ],
                },
            }),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_query_cmd,
        ),
        expected="learn query explain should include matched query tokens",
        scope="package smoke",
    )
    learn_query_human_cmd = [
        "design-ai",
        "learn",
        "--list",
        "--query",
        "keyboard accessibility",
        "--explain",
        "--limit",
        "2",
    ]
    assert_learning_query_human(
        "\n".join([
            "design-ai learn",
            "Local learning profile",
            f"File: {learning_profile_path}",
            "Entries: 1/3",
            "Query: keyboard accessibility",
            "Limit: 2",
            "Explain: selection score, matched tokens, and reason",
            "",
            "1. [accessibility] Prioritize keyboard accessibility details for Button component API specs",
            "   learn-relevant · 2026-05-22T00:00:01.000Z",
            "   score 2.114533 · matched accessibility, keyboard · reason brief-match",
        ]),
        context=context,
        cmd=learn_query_human_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_query_human(
            "\n".join([
                "Local learning profile",
                "Entries: 1/3",
                "Query: keyboard accessibility",
                "Limit: 2",
                "Explain: selection score, matched tokens, and reason",
                "[accessibility] Prioritize keyboard accessibility details for Button component API specs",
                "matched accessibility, keyboard",
            ]),
            context=context,
            cmd=learn_query_human_cmd,
        ),
        expected="learn query human output missing 'reason brief-match'",
        scope="package smoke",
    )

    learning_query_export_payload = {
        "file": str(learning_profile_path),
        "category": "",
        "limit": 2,
        "query": "keyboard accessibility",
        "selection": {
            "mode": "brief-relevance",
            "query": "keyboard accessibility",
            "candidateCount": 3,
            "matchedCount": 1,
            "queryTokenCount": 2,
            "fallbackEnabled": False,
            "selectedCount": 1,
            "fallbackCount": 0,
            "selected": [
                {
                    "id": "learn-relevant",
                    "category": "accessibility",
                    "score": 2.114533,
                    "matchedTokens": ["accessibility", "keyboard"],
                    "reason": "brief-match",
                },
            ],
        },
        "entries": learning_query_payload["entries"],
        "empty": False,
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "markdown": "Learning selection: brief relevance (1/3 matched; no recency fallback).\nPrioritize keyboard accessibility details",
    }
    learn_query_export_cmd = [
        "design-ai",
        "learn",
        "--export",
        "--query",
        "keyboard accessibility",
        "--limit",
        "2",
        "--json",
    ]
    assert_learning_query_export_json(
        json.dumps(learning_query_export_payload),
        profile_path=learning_profile_path,
        context=context,
        cmd=learn_query_export_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_query_export_json(
            json.dumps({
                **learning_query_export_payload,
                "selection": {
                    **learning_query_export_payload["selection"],
                    "fallbackEnabled": True,
                },
            }),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_query_export_cmd,
        ),
        expected="learn query export should not use recency fallback",
        scope="package smoke",
    )

    learning_relevance_payload = {
        "learningContext": {
            "selection": {
                "mode": "brief-relevance",
                "query": EXPECTED_ROUTE_BRIEF,
                "candidateCount": 3,
                "matchedCount": 1,
                "selectedCount": 1,
                "fallbackCount": 0,
                "selected": [
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "score": 10,
                        "matchedTokens": ["button", "accessibility"],
                        "reason": "brief-match",
                    },
                ],
            },
            "entries": [
                {
                    "id": "learn-relevant",
                    "category": "accessibility",
                    "text": "Prioritize keyboard accessibility details for Button component API specs",
                },
            ],
        },
        "prompt": (
            "Learning selection: brief relevance\n"
            "Prioritize keyboard accessibility details for Button component API specs"
        ),
        "learningUsage": {
            "recorded": True,
            "event": {
                "id": "learn-use-prompt",
                "command": "prompt",
                "routeId": EXPECTED_ROUTE_ID,
                "profileFile": str(learning_profile_path),
                "briefHash": "0123456789abcdef",
                "selectedEntryIds": ["learn-relevant"],
                "selectedCount": 1,
                "candidateCount": 3,
                "matchedCount": 1,
                "fallbackCount": 0,
                "queryTokenCount": 6,
                "auditStatus": "pass",
                "createdAt": "2026-06-01T00:00:00.000Z",
            },
        },
    }
    learning_relevance_cmd = ["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--with-learning", "--json"]
    assert_learning_relevance_context(
        learning_relevance_payload,
        context=context,
        cmd=learning_relevance_cmd,
    )
    assert_learning_usage_payload(
        learning_relevance_payload,
        expected_command="prompt",
        context=context,
        cmd=learning_relevance_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_relevance_context(
            {
                **learning_relevance_payload,
                "learningContext": {
                    **learning_relevance_payload["learningContext"],
                    "entries": [
                        {
                            "id": "learn-unrelated-newer",
                            "category": "korean",
                            "text": "Prefer dense Korean mobile checkout layout",
                        },
                    ],
                },
            },
            context=context,
            cmd=learning_relevance_cmd,
        ),
        expected="brief relevance should pick the Button accessibility entry",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_usage_payload(
            {
                **learning_relevance_payload,
                "learningUsage": {
                    **learning_relevance_payload["learningUsage"],
                    "event": {
                        **learning_relevance_payload["learningUsage"]["event"],
                        "brief": EXPECTED_ROUTE_BRIEF,
                        "briefHash": "",
                    },
                },
            },
            expected_command="prompt",
            context=context,
            cmd=learning_relevance_cmd,
        ),
        expected="learningUsage event should store a short brief hash",
        scope="package smoke",
    )

    recall_payload = {
        "recall": {
            "query": EXPECTED_ROUTE_BRIEF,
            "mode": "lexical",
            "candidateCount": 42,
            "selectedCount": 2,
            "selected": [
                {
                    "id": "knowledge/components/INDEX.md",
                    "score": 9.5,
                    "matchedTokens": ["button", "component"],
                },
                {
                    "id": "knowledge/a11y/keyboard-and-focus.md",
                    "score": 4.2,
                    "matchedTokens": ["accessibility"],
                },
            ],
            "markdown": (
                "## Recalled design knowledge\n\n"
                "- knowledge/components/INDEX.md\n"
                "  - Component index\n"
                "- knowledge/a11y/keyboard-and-focus.md\n"
                "  - Keyboard and focus"
            ),
        },
        "prompt": (
            "Recalled corpus knowledge:\n\n"
            "## Recalled design knowledge\n\n"
            "- knowledge/components/INDEX.md"
        ),
    }
    recall_cmd = ["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--with-recall", "--json"]
    assert_recall_context(recall_payload, context=context, cmd=recall_cmd)
    expect_self_test_failure(
        lambda: assert_recall_context(
            {**recall_payload, "recall": {**recall_payload["recall"], "mode": "embeddings"}},
            context=context,
            cmd=recall_cmd,
        ),
        expected="recall should use the deterministic lexical scorer",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_recall_context(
            {**recall_payload, "recall": {**recall_payload["recall"], "selectedCount": 0, "selected": []}},
            context=context,
            cmd=recall_cmd,
        ),
        expected="recall should select at least one corpus file",
        scope="package smoke",
    )

    learning_usage_path = Path(tmp) / "learning.usage.json"
    learning_usage_path.write_text(
        json.dumps({
            "version": 1,
            "updatedAt": "2026-06-01T00:00:01.000Z",
            "profileFile": str(learning_profile_path),
            "events": [
                {
                    **learning_relevance_payload["learningUsage"]["event"],
                    "id": "learn-use-prompt",
                    "command": "prompt",
                },
                {
                    **learning_relevance_payload["learningUsage"]["event"],
                    "id": "learn-use-pack",
                    "command": "pack",
                    "createdAt": "2026-06-01T00:00:01.000Z",
                },
            ],
        }),
        encoding="utf-8",
    )
    assert_learning_usage_sidecar(
        learning_usage_path,
        expected_commands=["prompt", "pack"],
        context=context,
        cmd=learning_relevance_cmd,
    )
    return learning_relevance_cmd, learning_relevance_payload, learning_usage_path
