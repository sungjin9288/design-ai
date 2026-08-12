from __future__ import annotations

from pathlib import Path

from smoke_domains.package_learning_skill_proposal_apply_contract import (
    EXPECTED_LOCAL_OUTPUT_SAFETY,
    command_by_key,
    exact_keyed_values,
    expected_apply_command_args,
)


def valid_skill_proposal_apply_artifacts(
    payload: dict[str, object],
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    signal_source: Path | None,
) -> bool:
    commands = payload.get("commands")
    contract = payload.get("commandContract")
    runbook = contract.get("operatorRunbook") if isinstance(contract, dict) else None
    selection = runbook.get("stageSelection") if isinstance(runbook, dict) else None
    decision = selection.get("decision") if isinstance(selection, dict) else None
    decision_commands = decision.get("commands") if isinstance(decision, dict) else None
    review_report = command_by_key(decision_commands, "reviewCheckReport")
    patch_preview = command_by_key(decision_commands, "proposalPatchPreview")
    expected_args = expected_apply_command_args(
        profile_path,
        usage_path,
        review_path,
        signal_source,
    )
    return (
        isinstance(commands, dict)
        and isinstance(decision, dict)
        and isinstance(decision_commands, list)
        and len(decision_commands) == 2
        and [command.get("key") for command in decision_commands]
        == ["reviewCheckReport", "proposalPatchPreview"]
        and [command.get("step") for command in decision_commands] == [2, 3]
        and isinstance(review_report, dict)
        and review_report.get("command") == commands.get("reviewCheckReport")
        and review_report.get("commandArgs") == expected_args["reviewCheckReport"]
        and review_report.get("runPolicy") == "output-artifact"
        and review_report.get("safetyLevel") == "local-output"
        and review_report.get("writesLocalFiles") is True
        and review_report.get("mutatesSkillFiles") is False
        and isinstance(patch_preview, dict)
        and patch_preview.get("command") == commands.get("proposalPatchPreview")
        and patch_preview.get("commandArgs") == expected_args["proposalPatchPreview"]
        and patch_preview.get("runPolicy") == "output-artifact"
        and patch_preview.get("safetyLevel") == "local-output"
        and patch_preview.get("writesLocalFiles") is True
        and patch_preview.get("mutatesSkillFiles") is False
        and exact_keyed_values(
            decision,
            "commandByKey",
            {"reviewCheckReport": review_report, "proposalPatchPreview": patch_preview},
        )
        and exact_keyed_values(
            decision,
            "commandStepByKey",
            {"reviewCheckReport": 2, "proposalPatchPreview": 3},
        )
        and exact_keyed_values(
            decision,
            "commandRunPolicyByKey",
            {
                "reviewCheckReport": "output-artifact",
                "proposalPatchPreview": "output-artifact",
            },
        )
        and exact_keyed_values(
            decision,
            "commandSafetyLevelByKey",
            {
                "reviewCheckReport": "local-output",
                "proposalPatchPreview": "local-output",
            },
        )
        and exact_keyed_values(
            decision,
            "commandArgsByKey",
            {
                "reviewCheckReport": expected_args["reviewCheckReport"],
                "proposalPatchPreview": expected_args["proposalPatchPreview"],
            },
        )
        and exact_keyed_values(
            decision,
            "commandStringByKey",
            {
                "reviewCheckReport": commands.get("reviewCheckReport"),
                "proposalPatchPreview": commands.get("proposalPatchPreview"),
            },
        )
        and exact_keyed_values(
            decision,
            "commandDisplayLabelByKey",
            {
                "reviewCheckReport": "Review check Markdown report",
                "proposalPatchPreview": "Skill proposal patch preview",
            },
        )
        and exact_keyed_values(
            decision,
            "commandDescriptionByKey",
            {
                "reviewCheckReport": "Generate a Markdown review-check artifact for accepted proposal readiness.",
                "proposalPatchPreview": "Generate a unified diff preview for accepted skill proposal edits.",
            },
        )
        and _valid_artifact_keyed_views(decision)
        and decision.get("nextCommandEntry") == review_report
        and decision.get("nextCommandEntry", {}).get("safety")
        == EXPECTED_LOCAL_OUTPUT_SAFETY
        and _valid_next_artifact(decision)
        and decision.get("nextCommandStep") == 2
        and decision.get("nextCommand") == commands.get("reviewCheckReport")
        and decision.get("nextCommandArgs") == expected_args["reviewCheckReport"]
        and decision.get("nextCommandRunPolicy") == "output-artifact"
        and decision.get("nextCommandSafetyLevel") == "local-output"
    )


def _valid_artifact_keyed_views(decision: dict[str, object]) -> bool:
    expected = {
        "commandOutputArtifactByKey": {
            "reviewCheckReport": "skill-proposal-review-check.md",
            "proposalPatchPreview": "skill-proposals.patch",
        },
        "commandOutputArtifactTypeByKey": {
            "reviewCheckReport": "markdown-report",
            "proposalPatchPreview": "unified-diff",
        },
        "commandOutputArtifactActionByKey": {
            "reviewCheckReport": "render-markdown-report",
            "proposalPatchPreview": "render-unified-diff-preview",
        },
        "commandOutputArtifactMediaTypeByKey": {
            "reviewCheckReport": "text/markdown",
            "proposalPatchPreview": "text/x-diff",
        },
        "commandOutputArtifactDispositionByKey": {
            "reviewCheckReport": "review-only",
            "proposalPatchPreview": "manual-apply-preview",
        },
        "commandOutputArtifactManualApplyCandidateByKey": {
            "reviewCheckReport": False,
            "proposalPatchPreview": True,
        },
        "commandOutputArtifactRequiresManualReviewByKey": {
            "reviewCheckReport": False,
            "proposalPatchPreview": True,
        },
        "commandOutputArtifactReviewInstructionByKey": {
            "reviewCheckReport": "Review the Markdown readiness report before changing proposal review status.",
            "proposalPatchPreview": "Review the unified diff manually before applying any skill-file edits.",
        },
        "commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey": {
            "reviewCheckReport": False,
            "proposalPatchPreview": True,
        },
        "commandOutputArtifactApplyPreconditionIdsByKey": {
            "reviewCheckReport": [],
            "proposalPatchPreview": ["manual-review", "clean-workspace"],
        },
        "commandOutputArtifactApplyPreconditionLabelsByKey": {
            "reviewCheckReport": [],
            "proposalPatchPreview": [
                "Manual review completed",
                "Clean workspace confirmed",
            ],
        },
        "commandOutputArtifactApplyPreconditionsByKey": {
            "reviewCheckReport": [],
            "proposalPatchPreview": [
                {
                    "id": "manual-review",
                    "label": "Manual review completed",
                    "required": True,
                },
                {
                    "id": "clean-workspace",
                    "label": "Clean workspace confirmed",
                    "required": True,
                },
            ],
        },
        "commandOutputArtifactManualApplyReadyByKey": {
            "reviewCheckReport": False,
            "proposalPatchPreview": False,
        },
        "commandOutputArtifactManualApplyStatusByKey": {
            "reviewCheckReport": "not-applicable",
            "proposalPatchPreview": "blocked",
        },
        "commandOutputArtifactManualApplyStatusLabelByKey": {
            "reviewCheckReport": "Review only",
            "proposalPatchPreview": "Blocked",
        },
        "commandOutputArtifactManualApplyStatusToneByKey": {
            "reviewCheckReport": "neutral",
            "proposalPatchPreview": "warning",
        },
        "commandOutputArtifactManualApplyBlockedReasonByKey": {
            "reviewCheckReport": "This output artifact is review-only and cannot be applied.",
            "proposalPatchPreview": (
                "Complete required apply preconditions before applying this patch preview."
            ),
        },
        "commandOutputArtifactManualApplyBlockedReasonCodeByKey": {
            "reviewCheckReport": "not-manual-apply-candidate",
            "proposalPatchPreview": "required-preconditions-pending",
        },
    }
    count_views = {
        "commandOutputArtifactApplyPreconditionCountByKey": (0, 2),
        "commandOutputArtifactRequiredApplyPreconditionCountByKey": (0, 2),
        "commandOutputArtifactSatisfiedApplyPreconditionCountByKey": (0, 0),
        "commandOutputArtifactPendingApplyPreconditionCountByKey": (0, 2),
        "commandOutputArtifactRequiredPendingApplyPreconditionCountByKey": (0, 2),
    }
    return all(
        exact_keyed_values(decision, field, values)
        for field, values in expected.items()
    ) and all(
        exact_keyed_values(
            decision,
            field,
            {"reviewCheckReport": review_value, "proposalPatchPreview": patch_value},
        )
        for field, (review_value, patch_value) in count_views.items()
    )


def _valid_next_artifact(decision: dict[str, object]) -> bool:
    expected = {
        "nextCommandKey": "reviewCheckReport",
        "nextCommandDisplayLabel": "Review check Markdown report",
        "nextCommandDescription": "Generate a Markdown review-check artifact for accepted proposal readiness.",
        "nextCommandOutputArtifact": "skill-proposal-review-check.md",
        "nextCommandOutputArtifactType": "markdown-report",
        "nextCommandOutputArtifactAction": "render-markdown-report",
        "nextCommandOutputArtifactMediaType": "text/markdown",
        "nextCommandOutputArtifactDisposition": "review-only",
        "nextCommandOutputArtifactManualApplyCandidate": False,
        "nextCommandOutputArtifactRequiresManualReview": False,
        "nextCommandOutputArtifactReviewInstruction": (
            "Review the Markdown readiness report before changing proposal review status."
        ),
        "nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply": False,
        "nextCommandOutputArtifactApplyPreconditionIds": [],
        "nextCommandOutputArtifactApplyPreconditionLabels": [],
        "nextCommandOutputArtifactApplyPreconditions": [],
        "nextCommandOutputArtifactApplyPreconditionCount": 0,
        "nextCommandOutputArtifactRequiredApplyPreconditionCount": 0,
        "nextCommandOutputArtifactSatisfiedApplyPreconditionCount": 0,
        "nextCommandOutputArtifactPendingApplyPreconditionCount": 0,
        "nextCommandOutputArtifactRequiredPendingApplyPreconditionCount": 0,
        "nextCommandOutputArtifactManualApplyReady": False,
        "nextCommandOutputArtifactManualApplyStatus": "not-applicable",
        "nextCommandOutputArtifactManualApplyStatusLabel": "Review only",
        "nextCommandOutputArtifactManualApplyStatusTone": "neutral",
        "nextCommandOutputArtifactManualApplyBlockedReason": (
            "This output artifact is review-only and cannot be applied."
        ),
        "nextCommandOutputArtifactManualApplyBlockedReasonCode": "not-manual-apply-candidate",
    }
    return all(decision.get(field) == value for field, value in expected.items())
