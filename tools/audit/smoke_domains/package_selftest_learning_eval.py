"""Package smoke self-test: learn evaluation templates, audit, and curation."""
from __future__ import annotations

import json

from pathlib import Path
from smoke_assertions import (
    EXPECTED_ROUTE_BRIEF,
    EXPECTED_ROUTE_ID,
    expect_self_test_failure,
)
from smoke_domains.package_learning_eval import (
    assert_learning_eval_report_human,
    assert_learning_eval_report_json,
    assert_learning_eval_strict_failure_json,
    assert_learning_eval_template_json,
    assert_learning_eval_template_report_json,
)
from smoke_domains.package_learning_profile_audit import (
    assert_learning_audit_cleanup_json,
    assert_learning_audit_fix_json,
)
from smoke_domains.package_learning_profile_curation import assert_learning_curation_json
from smoke_domains.package_learning_skill_proposal import (
    assert_skill_proposal_min_evidence_json,
    assert_skill_proposal_patch,
    assert_skill_proposal_report_json,
    assert_skill_proposal_report_markdown,
)
from smoke_domains.package_learning_skill_proposal_apply import assert_skill_proposal_apply_plan_json
from smoke_domains.package_learning_skill_proposal_apply_reports import (
    assert_skill_proposal_apply_plan_human,
    assert_skill_proposal_apply_plan_markdown,
)


def _self_test_learn_eval_template(context, learn_skill_proposals_cmd, learning_profile_path, learning_skill_proposal_apply_plan_human, learning_skill_proposal_apply_plan_markdown, learning_skill_proposal_apply_plan_payload, learning_skill_proposal_apply_plan_review_path, learning_skill_proposal_markdown, learning_skill_proposal_patch, learning_skill_proposal_payload, learning_usage_path, tmp):
    """Package smoke self-test: learn evaluation-template contracts."""
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "nextCommandKey": "proposalPatchPreview",
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commands": [],
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "safety": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["safety"],
                                    "level": "read-only",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "action": "run-required-command",
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageKeys": [],
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "nextRequiredCommandStageKey": "",
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "strategy": "",
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "nextStage": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["nextStage"],
                                "kind": "manual-review",
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_human(
            learning_skill_proposal_apply_plan_human.replace(
                "Command contract:",
                "Command summary:",
            ),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan"],
        ),
        expected="learn skill proposal apply-plan human output missing 'Command contract:'",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_human(
            learning_skill_proposal_apply_plan_human.replace(
                "Operator runbook:",
                "Operator stages:",
            ),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan"],
        ),
        expected="learn skill proposal apply-plan human output missing 'Operator runbook:'",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_markdown(
            learning_skill_proposal_apply_plan_markdown.replace(
                "- Mutates skill files: no",
                "- Mutates skill files: yes",
            ),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--report"],
        ),
        expected="learn skill proposal apply-plan Markdown report missing '- Mutates skill files: no'",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_markdown(
            learning_skill_proposal_apply_plan_markdown.replace(
                "Operator runbook:",
                "Operator stages:",
            ),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--report"],
        ),
        expected="learn skill proposal apply-plan Markdown report missing 'Operator runbook:'",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_min_evidence_json(
            json.dumps({
                **learning_skill_proposal_payload,
                "minEvidenceCount": 2,
                "count": 1,
                "proposalCount": 1,
                "skippedCount": 0,
                "skipped": [],
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--min-evidence", "3", "--json"],
        ),
        expected="learn skill proposals min-evidence JSON should report minEvidenceCount 3",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_patch(
            learning_skill_proposal_patch.replace("This command does not edit skill files.", "This command edits skill files."),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--patch"],
        ),
        expected="learn skill proposals patch output missing",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_report_markdown(
            learning_skill_proposal_markdown.replace("- Mutates skill files: no", "- Mutates skill files: yes"),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_skill_proposals_cmd,
        ),
        expected="learn skill proposals Markdown report missing '- Mutates skill files: no'",
        scope="package smoke",
    )
    assert_skill_proposal_report_json(
        json.dumps(learning_skill_proposal_payload),
        profile_path=learning_profile_path,
        usage_path=learning_usage_path,
        context=context,
        cmd=learn_skill_proposals_cmd,
        returncode=1,
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_report_json(
            json.dumps({
                **learning_skill_proposal_payload,
                "status": "pass",
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_skill_proposals_cmd,
        ),
        expected="learn skill proposals JSON should report 'warn' status when proposals need review",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_report_json(
            json.dumps(learning_skill_proposal_payload),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_skill_proposals_cmd,
            returncode=0,
        ),
        expected="learn skill proposals strict JSON should exit with code 1 when proposal review is pending",
        scope="package smoke",
    )

    learning_eval_template_path = Path(tmp) / "learning-eval-template.json"
    learning_eval_template_payload = {
        "version": 1,
        "generatedAt": "2026-06-01T00:00:02.000Z",
        "sourceProfile": {
            "file": str(learning_profile_path),
            "exists": True,
            "entryCount": 3,
            "auditStatus": "pass",
            "category": "accessibility",
            "query": EXPECTED_ROUTE_BRIEF,
            "limit": 6,
        },
        "selection": {
            "mode": "brief-relevance",
            "candidateCount": 1,
            "matchedCount": 1,
            "selectedCount": 1,
            "queryTokenCount": 7,
            "fallbackCount": 0,
        },
        "caseCount": 1,
        "cases": [
            {
                "id": "eval-1-0123456789",
                "brief": EXPECTED_ROUTE_BRIEF,
                "category": "accessibility",
                "limit": 1,
                "expectedSelectedIds": ["learn-relevant"],
                "minMatchedCount": 1,
                "requireNoFallback": True,
            },
        ],
        "recommendations": [],
        "privacy": {
            "storesRawBriefText": True,
            "storesBriefHash": False,
            "exposesMatchedTokens": False,
        },
    }
    learn_eval_template_cmd = ["design-ai", "learn", "--eval-template", "--query", EXPECTED_ROUTE_BRIEF, "--file", str(learning_profile_path), "--json"]
    assert_learning_eval_template_json(
        json.dumps(learning_eval_template_payload),
        profile_path=learning_profile_path,
        context=context,
        cmd=learn_eval_template_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_eval_template_json(
            json.dumps({
                **learning_eval_template_payload,
                "privacy": {
                    **learning_eval_template_payload["privacy"],
                    "storesRawBriefText": False,
                },
            }),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_eval_template_cmd,
        ),
        expected="learn eval-template JSON should disclose that checkpoint templates store raw brief text",
        scope="package smoke",
    )
    learning_eval_path = Path(tmp) / "learning-eval.json"
    learning_eval_payload = {
        "file": str(learning_profile_path),
        "source": str(learning_eval_path),
        "profileExists": True,
        "profileEntryCount": 3,
        "checkpointVersion": 1,
        "defaultLimit": 1,
        "defaultCategory": "",
        "status": "pass",
        "caseCount": 1,
        "passed": 1,
        "warned": 0,
        "failed": 0,
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "cases": [
            {
                "id": "button-accessibility",
                "routeId": EXPECTED_ROUTE_ID,
                "briefHash": "0123456789abcdef",
                "category": "",
                "limit": 1,
                "status": "pass",
                "failures": 0,
                "warnings": 0,
                "candidateCount": 3,
                "matchedCount": 1,
                "selectedCount": 1,
                "fallbackCount": 0,
                "expectedSelectedIds": ["learn-relevant"],
                "missingExpectedIds": [],
                "avoidedSelectedIds": ["learn-brand"],
                "unexpectedAvoidedIds": [],
                "minMatchedCount": 1,
                "requireNoFallback": True,
                "selectedEntryIds": ["learn-relevant"],
                "selected": [
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "score": 10,
                        "reason": "brief-match",
                    },
                ],
                "issues": [],
            },
        ],
        "recommendations": [],
        "privacy": {
            "storesRawBriefText": False,
            "storesBriefHash": True,
            "exposesMatchedTokens": False,
        },
    }
    learn_eval_cmd = ["design-ai", "learn", "--eval", "--from-file", str(learning_eval_path), "--file", str(learning_profile_path), "--json"]
    assert_learning_eval_report_json(
        json.dumps(learning_eval_payload),
        profile_path=learning_profile_path,
        eval_path=learning_eval_path,
        context=context,
        cmd=learn_eval_cmd,
    )
    assert_learning_eval_template_report_json(
        json.dumps({
            **learning_eval_payload,
            "source": str(learning_eval_template_path),
        }),
        profile_path=learning_profile_path,
        eval_path=learning_eval_template_path,
        context=context,
        cmd=["design-ai", "learn", "--eval", "--from-file", str(learning_eval_template_path), "--file", str(learning_profile_path), "--strict", "--json"],
    )
    return learn_eval_cmd, learning_eval_path, learning_eval_payload


def _self_test_learn_audit_and_curation(context, learn_eval_cmd, learning_eval_path, learning_eval_payload, learning_profile_path, learning_usage_path, tmp):
    """Package smoke self-test: learn audit, curation, and forget contracts."""
    assert_learning_eval_report_human(
        "\n".join([
            "design-ai learn",
            "Local learning eval report",
            f"Checkpoint: {learning_eval_path}",
            "Status: pass",
            "button-accessibility / component-spec: pass",
            "Privacy: eval reports expose brief hashes and selected ids, not raw brief text.",
        ]),
        context=context,
        cmd=learn_eval_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_eval_report_json(
            json.dumps({
                **learning_eval_payload,
                "cases": [
                    {
                        **learning_eval_payload["cases"][0],
                        "brief": EXPECTED_ROUTE_BRIEF,
                    },
                ],
            }),
            profile_path=learning_profile_path,
            eval_path=learning_eval_path,
            context=context,
            cmd=learn_eval_cmd,
        ),
        expected="learn eval JSON should not expose raw brief or query text",
        scope="package smoke",
    )
    learning_eval_strict_path = Path(tmp) / "learning-eval-strict-fail.json"
    learning_eval_strict_payload = {
        **learning_eval_payload,
        "source": str(learning_eval_strict_path),
        "status": "fail",
        "passed": 0,
        "failed": 1,
        "cases": [
            {
                **learning_eval_payload["cases"][0],
                "id": "missing-accessibility",
                "status": "fail",
                "failures": 2,
                "expectedSelectedIds": ["missing-entry"],
                "missingExpectedIds": ["missing-entry"],
                "issues": [
                    {
                        "level": "failure",
                        "code": "expected-entry-not-in-profile",
                        "message": "Expected entry missing-entry is not present in the active learning profile.",
                    },
                    {
                        "level": "failure",
                        "code": "expected-entry-not-selected",
                        "message": "Expected selected entries were missing: missing-entry.",
                    },
                ],
            },
        ],
        "recommendations": [
            {
                "level": "warning",
                "text": "Review failed eval cases before trusting prompt/pack --with-learning selection.",
            },
        ],
    }
    learn_eval_strict_cmd = [
        "design-ai",
        "learn",
        "--eval",
        "--from-file",
        str(learning_eval_strict_path),
        "--file",
        str(learning_profile_path),
        "--strict",
        "--json",
    ]
    assert_learning_eval_strict_failure_json(
        json.dumps(learning_eval_strict_payload),
        returncode=1,
        profile_path=learning_profile_path,
        eval_path=learning_eval_strict_path,
        context=context,
        cmd=learn_eval_strict_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_eval_strict_failure_json(
            json.dumps(learning_eval_strict_payload),
            returncode=0,
            profile_path=learning_profile_path,
            eval_path=learning_eval_strict_path,
            context=context,
            cmd=learn_eval_strict_cmd,
        ),
        expected="learn eval --strict should exit with code 1 when checkpoints fail",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_eval_strict_failure_json(
            json.dumps({
                **learning_eval_strict_payload,
                "cases": [
                    {
                        **learning_eval_strict_payload["cases"][0],
                        "brief": EXPECTED_ROUTE_BRIEF,
                    },
                ],
            }),
            returncode=1,
            profile_path=learning_profile_path,
            eval_path=learning_eval_strict_path,
            context=context,
            cmd=learn_eval_strict_cmd,
        ),
        expected="learn eval strict JSON should not expose raw brief or query text",
        scope="package smoke",
    )

    duplicate_command_args = [
        "design-ai",
        "learn",
        "--file",
        str(learning_profile_path),
        "--forget",
        "learn-b",
        "--yes",
    ]
    sensitive_command_args = [
        "design-ai",
        "learn",
        "--file",
        str(learning_profile_path),
        "--forget",
        "learn-c",
        "--yes",
    ]
    learning_audit_payload = {
        "file": str(learning_profile_path),
        "exists": True,
        "count": 3,
        "categoryCounts": {
            "workflow": 2,
            "constraint": 1,
        },
        "summary": {
            "status": "warn",
            "failures": 0,
            "warnings": 2,
        },
        "issues": [
            {
                "level": "warning",
                "code": "duplicate-entry-text",
                "entryId": "learn-b",
                "message": "Entry duplicates learn-a in the same category.",
            },
            {
                "level": "warning",
                "code": "sensitive-secret-assignment",
                "entryId": "learn-c",
                "message": "Entry may contain a secret-like assignment.",
            },
        ],
        "suggestions": [
            {
                "issueCode": "duplicate-entry-text",
                "entryId": "learn-b",
                "action": "remove-duplicate",
                "message": "Remove the duplicate entry.",
                "commandArgs": duplicate_command_args,
                "command": " ".join(duplicate_command_args),
            },
            {
                "issueCode": "sensitive-secret-assignment",
                "entryId": "learn-c",
                "action": "remove-or-redact-sensitive-content",
                "message": "Remove this entry or re-add a redacted preference.",
                "commandArgs": sensitive_command_args,
                "command": " ".join(sensitive_command_args),
            },
        ],
    }
    learn_audit_cmd = ["design-ai", "learn", "--audit", "--file", str(learning_profile_path), "--json"]
    assert_learning_audit_cleanup_json(
        json.dumps(learning_audit_payload),
        profile_path=learning_profile_path,
        context=context,
        cmd=learn_audit_cmd,
    )
    learning_audit_fix_payload = {
        "file": str(learning_profile_path),
        "dryRun": True,
        "applied": False,
        "before": {
            "status": "warn",
            "failures": 0,
            "warnings": 2,
        },
        "cleanupCount": 2,
        "cleanup": [
            {
                "entryId": "learn-b",
                "issueCodes": ["duplicate-entry-text"],
                "actions": ["remove-duplicate"],
                "commandArgs": duplicate_command_args,
                "command": " ".join(duplicate_command_args),
            },
            {
                "entryId": "learn-c",
                "issueCodes": ["sensitive-secret-assignment"],
                "actions": ["remove-or-redact-sensitive-content"],
                "commandArgs": sensitive_command_args,
                "command": " ".join(sensitive_command_args),
            },
        ],
        "skipped": [],
        "removed": [],
        "after": None,
    }
    learn_audit_fix_cmd = [
        "design-ai",
        "learn",
        "--audit",
        "--fix",
        "--dry-run",
        "--file",
        str(learning_profile_path),
        "--json",
    ]
    assert_learning_audit_fix_json(
        json.dumps(learning_audit_fix_payload),
        profile_path=learning_profile_path,
        dry_run=True,
        context=context,
        cmd=learn_audit_fix_cmd,
    )
    applied_learning_audit_fix_payload = {
        **learning_audit_fix_payload,
        "dryRun": False,
        "applied": True,
        "removed": [
            {
                "id": "learn-b",
                "category": "workflow",
                "source": "package-smoke",
                "createdAt": "2026-05-22T00:00:01.000Z",
                "textPreview": "Prefer release notes that state evidence before claims",
            },
            {
                "id": "learn-c",
                "category": "constraint",
                "source": "package-smoke",
                "createdAt": "2026-05-22T00:00:02.000Z",
                "textPreview": "Never include api_key=redacted placeholders in prompt context",
            },
        ],
        "after": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
    }
    assert_learning_audit_fix_json(
        json.dumps(applied_learning_audit_fix_payload),
        profile_path=learning_profile_path,
        dry_run=False,
        context=context,
        cmd=["design-ai", "learn", "--audit", "--fix", "--yes", "--file", str(learning_profile_path), "--json"],
    )
    learning_curation_payload = {
        "file": str(learning_profile_path),
        "archiveFile": str(learning_profile_path.with_name(f"{learning_profile_path.stem}.archive{learning_profile_path.suffix}")),
        "usage": {
            "autoArchive": False,
        },
        "before": {
            "status": "warn",
            "failures": 0,
            "warnings": 2,
        },
        "proposalCount": 2,
        "archiveCount": 2,
        "manualReviewCount": 0,
        "proposals": [
            {
                "entryId": "learn-b",
                "action": "archive",
                "reason": "duplicate-entry",
                "issueCodes": ["duplicate-entry-text"],
                "messages": ["Entry duplicates learn-a in the same category."],
                "category": "workflow",
                "source": "package-smoke",
                "createdAt": "2026-05-22T00:00:01.000Z",
                "textPreview": "Prefer release notes that state evidence before claims",
            },
            {
                "entryId": "learn-c",
                "action": "archive",
                "reason": "sensitive-content",
                "issueCodes": ["sensitive-secret-assignment"],
                "messages": ["Entry may contain a secret-like assignment."],
                "category": "constraint",
                "source": "package-smoke",
                "createdAt": "2026-05-22T00:00:02.000Z",
                "textPreview": "Never include api_key=redacted placeholders in prompt context",
            },
        ],
        "skipped": [],
        "count": 3,
        "dryRun": True,
        "applied": False,
        "archived": [],
        "after": None,
    }
    learn_curate_cmd = ["design-ai", "learn", "--curate", "--file", str(learning_profile_path), "--json"]
    assert_learning_curation_json(
        json.dumps(learning_curation_payload),
        profile_path=learning_profile_path,
        dry_run=True,
        context=context,
        cmd=learn_curate_cmd,
    )
    learning_usage_path = learning_profile_path.with_name(
        f"{learning_profile_path.stem}.usage{learning_profile_path.suffix}"
    )
    learning_curation_usage_payload = {
        **learning_curation_payload,
        "usage": {
            "file": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "profileFile": str(learning_profile_path),
            "profileFileMatches": True,
            "exists": True,
            "eventCount": 1,
            "usedEntryCount": 1,
            "unusedEntryCount": 2,
            "staleSelectedEntryCount": 1,
            "reviewCount": 3,
            "unusedReviewCount": 2,
            "staleReviewCount": 1,
            "reviews": [
                {
                    "level": "warning",
                    "action": "review-usage-sidecar",
                    "reason": "stale-selected-entry-id",
                    "entryId": "learn-stale",
                    "usageCount": 1,
                    "message": "Usage sidecar selected an entry id that is no longer present in the active learning profile.",
                },
                {
                    "level": "info",
                    "action": "manual-review",
                    "reason": "unused-with-limited-history",
                    "entryId": "learn-b",
                    "usageCount": 0,
                    "message": "Active entry has not been selected in recorded prompt/pack usage; review manually before archiving.",
                },
                {
                    "level": "info",
                    "action": "manual-review",
                    "reason": "unused-with-limited-history",
                    "entryId": "learn-c",
                    "usageCount": 0,
                    "message": "Active entry has not been selected in recorded prompt/pack usage; review manually before archiving.",
                },
            ],
            "recommendations": [],
            "error": "",
            "privacy": {
                "storesRawBriefText": False,
                "storesBriefHash": True,
                "storesSelectedEntryIds": True,
            },
            "autoArchive": False,
        },
    }
    assert_learning_curation_json(
        json.dumps(learning_curation_usage_payload),
        profile_path=learning_profile_path,
        usage_path=learning_usage_path,
        dry_run=True,
        context=f"{context} usage curation",
        cmd=[
            "design-ai",
            "learn",
            "--curate",
            "--file",
            str(learning_profile_path),
            "--usage-file",
            str(learning_usage_path),
            "--json",
        ],
    )
    applied_learning_curation_payload = {
        **learning_curation_payload,
        "dryRun": False,
        "applied": True,
        "archived": [
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
        "after": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
    }
    assert_learning_curation_json(
        json.dumps(applied_learning_curation_payload),
        profile_path=learning_profile_path,
        dry_run=False,
        context=context,
        cmd=["design-ai", "learn", "--curate", "--yes", "--file", str(learning_profile_path), "--json"],
    )
    expect_self_test_failure(
        lambda: assert_learning_audit_cleanup_json(
            json.dumps({**learning_audit_payload, "suggestions": []}),
            profile_path=learning_profile_path,
            context=context,
            cmd=learn_audit_cmd,
        ),
        expected="remove-duplicate suggestion missing",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_audit_fix_json(
            json.dumps({**learning_audit_fix_payload, "cleanup": []}),
            profile_path=learning_profile_path,
            dry_run=True,
            context=context,
            cmd=learn_audit_fix_cmd,
        ),
        expected="learn audit fix cleanup entry missing: learn-b",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_learning_curation_json(
            json.dumps({**learning_curation_payload, "archiveCount": 1}),
            profile_path=learning_profile_path,
            dry_run=True,
            context=context,
            cmd=learn_curate_cmd,
        ),
        expected="learn curate archive count changed",
        scope="package smoke",
    )
    learn_curate_report_cmd = [
        "design-ai",
        "learn",
        "--curate",
        "--file",
        str(learning_profile_path),
        "--report",
        "--out",
        "learning-curation-report.md",
    ]
    return learn_curate_report_cmd
