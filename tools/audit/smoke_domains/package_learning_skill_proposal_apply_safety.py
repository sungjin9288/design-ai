from __future__ import annotations

from smoke_domains.package_learning_skill_proposal_apply_contract import (
    EXPECTED_COMMAND_SEQUENCE,
    EXPECTED_LOCAL_OUTPUT_SAFETY,
    command_by_key,
)


def valid_skill_proposal_apply_approval_and_safety(payload: dict[str, object]) -> bool:
    contract = payload.get("commandContract")
    privacy = payload.get("privacy")
    sequence = contract.get("commandSequence") if isinstance(contract, dict) else None
    next_safety = (
        contract.get("nextCommandSafety") if isinstance(contract, dict) else None
    )
    runbook = contract.get("operatorRunbook") if isinstance(contract, dict) else None
    selection = runbook.get("stageSelection") if isinstance(runbook, dict) else None
    decision = selection.get("decision") if isinstance(selection, dict) else None
    decision_safety = decision.get("safety") if isinstance(decision, dict) else None
    decision_commands = decision.get("commands") if isinstance(decision, dict) else None
    review_report = command_by_key(decision_commands, "reviewCheckReport")
    patch_preview = command_by_key(decision_commands, "proposalPatchPreview")
    return (
        isinstance(next_safety, dict)
        and next_safety.get("level") == "read-only"
        and next_safety.get("writesLocalFiles") is False
        and next_safety.get("mutatesLocalState") is False
        and next_safety.get("mutatesProfile") is False
        and next_safety.get("mutatesReviewFile") is False
        and next_safety.get("mutatesSkillFiles") is False
        and next_safety.get("callsExternalAiApis") is False
        and isinstance(review_report, dict)
        and review_report.get("safety") == EXPECTED_LOCAL_OUTPUT_SAFETY
        and isinstance(patch_preview, dict)
        and patch_preview.get("safety") == EXPECTED_LOCAL_OUTPUT_SAFETY
        and decision.get("nextCommandSafety") == EXPECTED_LOCAL_OUTPUT_SAFETY
        and isinstance(decision_safety, dict)
        and decision_safety.get("level") == "local-output"
        and decision_safety.get("writesLocalFiles") is True
        and decision_safety.get("writesOutputArtifacts") is True
        and decision_safety.get("mutatesLocalState") is True
        and decision_safety.get("mutatesProfile") is False
        and decision_safety.get("mutatesReviewFile") is False
        and decision_safety.get("mutatesSkillFiles") is False
        and decision_safety.get("callsExternalAiApis") is False
        and decision_safety.get("requiresCleanWorkspace") is False
        and isinstance(sequence, list)
        and all(
            isinstance(item, dict)
            and isinstance(item.get("safety"), dict)
            and item["safety"].get("level") == safety_level
            and item["safety"].get("writesLocalFiles") is writes_local_files
            and item["safety"].get("writesOutputArtifact") is writes_local_files
            and item["safety"].get("mutatesProfile") is False
            and item["safety"].get("mutatesReviewFile") is False
            and item["safety"].get("mutatesSkillFiles") is False
            and item["safety"].get("callsExternalAiApis") is False
            for item, (_, _, _, safety_level, writes_local_files) in zip(
                sequence,
                EXPECTED_COMMAND_SEQUENCE,
                strict=True,
            )
        )
        and isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesReviewFile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False
    )
