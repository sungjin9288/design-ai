from __future__ import annotations

from smoke_domains.package_learning_skill_proposal_apply_contract import (
    EXPECTED_RUNBOOK_STAGES,
)


def valid_skill_proposal_apply_operator_runbook(payload: dict[str, object]) -> bool:
    contract = payload.get("commandContract")
    runbook = contract.get("operatorRunbook") if isinstance(contract, dict) else None
    selection = runbook.get("stageSelection") if isinstance(runbook, dict) else None
    decision = selection.get("decision") if isinstance(selection, dict) else None
    selected_stage = selection.get("nextStage") if isinstance(selection, dict) else None
    required_stage = (
        selection.get("nextRequiredStage") if isinstance(selection, dict) else None
    )
    required_command_stage = (
        selection.get("nextRequiredCommandStage")
        if isinstance(selection, dict)
        else None
    )
    stage_keys = [stage[1] for stage in EXPECTED_RUNBOOK_STAGES]
    return (
        isinstance(runbook, dict)
        and runbook.get("version") == 1
        and runbook.get("executable") is True
        and runbook.get("blocked") is False
        and runbook.get("stageCount") == 4
        and runbook.get("requiredStageCount") == 3
        and runbook.get("commandStageCount") == 3
        and runbook.get("nextStageKey") == "previewArtifacts"
        and runbook.get("nextStageCommandKeys")
        == ["reviewCheckReport", "proposalPatchPreview"]
        and runbook.get("nextRequiredStageKey") == "manualSkillEdit"
        and runbook.get("nextRequiredStageCommandKeys") == []
        and runbook.get("nextRequiredCommandStageKey") == "reviewReadiness"
        and runbook.get("nextRequiredCommandStageCommandKeys") == ["reviewCheckJson"]
        and isinstance(selection, dict)
        and selection.get("strategy") == "optional-preview-before-required-manual-edit"
        and isinstance(decision, dict)
        and decision.get("action") == "offer-optional-preview"
        and decision.get("stageKey") == "previewArtifacts"
        and decision.get("stageKind") == "local-output-preview"
        and decision.get("required") is False
        and decision.get("hasCommands") is True
        and decision.get("commandCount") == 2
        and decision.get("commandKeys") == ["reviewCheckReport", "proposalPatchPreview"]
        and decision.get("runPolicy") == "optional-local-output-preview"
        and decision.get("nextRequiredStageKey") == "manualSkillEdit"
        and decision.get("nextRequiredCommandStageKey") == "reviewReadiness"
        and decision.get("requiresOperatorActionBeforeRequiredCommands") is True
        and selection.get("stageOrder") == stage_keys
        and selection.get("nextStageKey") == "previewArtifacts"
        and selection.get("nextStageCommandKeys")
        == ["reviewCheckReport", "proposalPatchPreview"]
        and isinstance(selected_stage, dict)
        and selected_stage.get("key") == "previewArtifacts"
        and selected_stage.get("kind") == "local-output-preview"
        and selected_stage.get("required") is False
        and selected_stage.get("hasCommands") is True
        and selected_stage.get("commandCount") == 2
        and selected_stage.get("writesOutputArtifacts") is True
        and selected_stage.get("mutatesSkillFiles") is False
        and selection.get("nextRequiredStageKey") == "manualSkillEdit"
        and selection.get("nextRequiredStageCommandKeys") == []
        and isinstance(required_stage, dict)
        and required_stage.get("key") == "manualSkillEdit"
        and required_stage.get("kind") == "manual-review"
        and required_stage.get("required") is True
        and required_stage.get("hasCommands") is False
        and required_stage.get("commandCount") == 0
        and selection.get("nextRequiredCommandStageKey") == "reviewReadiness"
        and selection.get("nextRequiredCommandStageCommandKeys") == ["reviewCheckJson"]
        and isinstance(required_command_stage, dict)
        and required_command_stage.get("key") == "reviewReadiness"
        and required_command_stage.get("kind") == "read-only-check"
        and required_command_stage.get("required") is True
        and required_command_stage.get("hasCommands") is True
        and required_command_stage.get("commandCount") == 1
        and required_command_stage.get("writesLocalFiles") is False
        and required_command_stage.get("callsExternalAiApis") is False
        and runbook.get("stageKeys") == stage_keys
        and isinstance(runbook.get("stageByKey"), dict)
        and list(runbook["stageByKey"].keys()) == stage_keys
        and isinstance(runbook.get("stages"), list)
        and len(runbook["stages"]) == 4
        and all(
            isinstance(runbook["stageByKey"].get(key), dict)
            and runbook["stageByKey"][key].get("step") == step
            and runbook["stageByKey"][key].get("kind") == kind
            and runbook["stageByKey"][key].get("required") is required
            and runbook["stageByKey"][key].get("commandKeys") == command_keys
            for step, key, kind, required, command_keys in EXPECTED_RUNBOOK_STAGES
        )
        and all(
            isinstance(stage, dict)
            and stage.get("step") == step
            and stage.get("key") == key
            and stage.get("kind") == kind
            and stage.get("required") is required
            and stage.get("commandKeys") == command_keys
            and [
                command.get("key")
                for command in stage.get("commands", [])
                if isinstance(command, dict)
            ]
            == command_keys
            for stage, (step, key, kind, required, command_keys) in zip(
                runbook["stages"],
                EXPECTED_RUNBOOK_STAGES,
                strict=True,
            )
        )
        and "Generate optional local review artifacts" in str(runbook.get("reason", ""))
    )
