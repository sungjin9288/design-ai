from __future__ import annotations

from smoke_domains.package_learning_agent_backlog_actions import (
    is_agent_backlog_refresh_command,
)


def valid_agent_backlog_queue_and_handoff(action_plan: object) -> bool:
    safety_summary = (
        action_plan.get("safetySummary") if isinstance(action_plan, dict) else None
    )
    execution_queue = (
        action_plan.get("executionQueue") if isinstance(action_plan, dict) else None
    )
    operator_runbook = (
        execution_queue.get("operatorRunbook")
        if isinstance(execution_queue, dict)
        else None
    )
    next_command_selection = (
        execution_queue.get("nextCommandSelection")
        if isinstance(execution_queue, dict)
        else None
    )
    next_command_alignment = (
        execution_queue.get("nextCommandAlignment")
        if isinstance(execution_queue, dict)
        else None
    )
    operator_handoff = (
        execution_queue.get("operatorHandoff")
        if isinstance(execution_queue, dict)
        else None
    )
    operator_handoff_state = (
        operator_handoff.get("state") if isinstance(operator_handoff, dict) else None
    )
    operator_handoff_source = (
        operator_handoff.get("source") if isinstance(operator_handoff, dict) else ""
    )
    operator_handoff_matches_source = (
        (
            (
                operator_handoff_source == "operator-runbook"
                and operator_handoff.get("phase") == operator_runbook.get("nextStage")
                and operator_handoff.get("command")
                == operator_runbook.get("nextCommand")
            )
            or (
                operator_handoff_source == "execution-queue"
                and operator_handoff.get("phase") == "execute"
                and operator_handoff.get("command")
                == execution_queue.get("nextCommand")
            )
        )
        if isinstance(operator_handoff, dict)
        else False
    )
    return (
        isinstance(action_plan, dict)
        and action_plan.get("version") == 1
        and (action_plan.get("stepCount", 0) >= 1)
        and isinstance(safety_summary, dict)
        and (safety_summary.get("total", 0) >= 1)
        and (safety_summary.get("readOnly", 0) >= 1)
        and (safety_summary.get("writesLocalFile", -1) >= 0)
        and (safety_summary.get("mutatesLocalState", -1) >= 0)
        and (safety_summary.get("requiresReviewBeforeMutation", -1) >= 0)
        and isinstance(execution_queue, dict)
        and (execution_queue.get("previewCount", -1) >= 1)
        and (execution_queue.get("fileWriteReviewCount", -1) >= 0)
        and (execution_queue.get("mutationReviewCount", -1) >= 0)
        and (execution_queue.get("orderedCount", 0) >= 1)
        and (execution_queue.get("commandManifestCount", 0) >= 1)
        and isinstance(execution_queue.get("nextCommandArgs"), list)
        and (len(execution_queue.get("nextCommandArgs")) >= 2)
        and isinstance(next_command_selection, dict)
        and (
            next_command_selection.get("strategy")
            == "first-command-in-safety-ordered-queue"
        )
        and (
            next_command_selection.get("actionId")
            == execution_queue.get("nextActionId")
        )
        and isinstance(next_command_selection.get("safetyOrder"), list)
        and (
            next_command_selection.get("safetyOrder")
            == ["read-only", "writes-local-file", "mutates-local-state"]
        )
        and isinstance(next_command_selection.get("matchesPlanNextAction"), bool)
        and isinstance(next_command_selection.get("reason"), str)
        and bool(next_command_selection.get("reason"))
        and isinstance(next_command_alignment, dict)
        and (
            next_command_alignment.get("strategy")
            == "compare-operator-runbook-next-command-to-execution-queue-next-command"
        )
        and (
            next_command_alignment.get("operatorStage")
            == operator_runbook.get("nextStage")
        )
        and (
            next_command_alignment.get("operatorCommand")
            == operator_runbook.get("nextCommand")
        )
        and (
            next_command_alignment.get("queueActionId")
            == execution_queue.get("nextActionId")
        )
        and (
            next_command_alignment.get("queueCommand")
            == execution_queue.get("nextCommand")
        )
        and isinstance(next_command_alignment.get("matchesQueueNextCommand"), bool)
        and isinstance(next_command_alignment.get("matchesQueueNextAction"), bool)
        and isinstance(
            next_command_alignment.get("operatorRunsBeforeQueueCommand"), bool
        )
        and isinstance(next_command_alignment.get("queueMatchesRankedNextAction"), bool)
        and isinstance(next_command_alignment.get("reason"), str)
        and bool(next_command_alignment.get("reason"))
        and isinstance(operator_handoff, dict)
        and (operator_handoff.get("version") == 1)
        and (
            operator_handoff.get("decision")
            in {
                "run-operator-gate",
                "run-shared-command",
                "run-operator-command",
                "run-queue-command",
                "none",
            }
        )
        and isinstance(operator_handoff_state, dict)
        and (operator_handoff_state.get("version") == 1)
        and (
            operator_handoff_state.get("status")
            in {"ready", "gate-required", "review-required", "no-command"}
        )
        and isinstance(operator_handoff_state.get("ready"), bool)
        and isinstance(operator_handoff_state.get("hasCommand"), bool)
        and isinstance(operator_handoff_state.get("complete"), bool)
        and isinstance(operator_handoff_state.get("canRunWithoutReview"), bool)
        and isinstance(operator_handoff_state.get("requiresGate"), bool)
        and isinstance(operator_handoff_state.get("requiresRefresh"), bool)
        and isinstance(operator_handoff_state.get("summary"), str)
        and bool(operator_handoff_state.get("summary"))
        and (operator_handoff.get("source") in {"operator-runbook", "execution-queue"})
        and operator_handoff_matches_source
        and isinstance(operator_handoff.get("commandArgs"), list)
        and (len(operator_handoff.get("commandArgs")) >= 2)
        and isinstance(operator_handoff.get("required"), bool)
        and isinstance(operator_handoff.get("isGate"), bool)
        and (
            operator_handoff.get("nextQueueActionId")
            == execution_queue.get("nextActionId")
        )
        and isinstance(operator_handoff.get("nextQueueCommandRequiresGate"), bool)
        and isinstance(
            operator_handoff.get("operatorGateAppliesToNextQueueAction"), bool
        )
        and (
            operator_handoff.get("nextQueueCommand")
            == execution_queue.get("nextCommand")
        )
        and isinstance(operator_handoff.get("nextQueueActionBlockedByGate"), bool)
        and isinstance(operator_handoff.get("refreshCommand"), str)
        and bool(operator_handoff.get("refreshCommand"))
        and isinstance(operator_handoff.get("refreshCommandArgs"), list)
        and (len(operator_handoff.get("refreshCommandArgs")) >= 2)
        and is_agent_backlog_refresh_command(
            {
                "command": operator_handoff.get("refreshCommand"),
                "commandArgs": operator_handoff.get("refreshCommandArgs"),
            }
        )
        and isinstance(operator_handoff.get("refreshCommandRequired"), bool)
        and isinstance(operator_handoff.get("requiresOperatorReview"), bool)
    )


def valid_agent_backlog_runbook_and_effects(action_plan: object) -> bool:
    execution_queue = (
        action_plan.get("executionQueue") if isinstance(action_plan, dict) else None
    )
    operator_runbook = (
        execution_queue.get("operatorRunbook")
        if isinstance(execution_queue, dict)
        else None
    )
    operator_handoff = (
        execution_queue.get("operatorHandoff")
        if isinstance(execution_queue, dict)
        else None
    )
    operator_next_command_selection = (
        operator_runbook.get("nextCommandSelection")
        if isinstance(operator_runbook, dict)
        else None
    )
    command_effect_summary = (
        execution_queue.get("commandEffectSummary")
        if isinstance(execution_queue, dict)
        else None
    )
    command_effect_review = (
        execution_queue.get("commandEffectReview")
        if isinstance(execution_queue, dict)
        else None
    )
    gate_phase_summary = (
        command_effect_review.get("gatePhaseSummary")
        if isinstance(command_effect_review, dict)
        else None
    )
    gate_runbook = (
        command_effect_review.get("gateRunbook")
        if isinstance(command_effect_review, dict)
        else None
    )
    return (
        isinstance(operator_handoff.get("reason"), str)
        and bool(operator_handoff.get("reason"))
        and isinstance(operator_runbook, dict)
        and (operator_runbook.get("version") == 1)
        and (operator_runbook.get("stageCount") == 4)
        and (
            operator_runbook.get("commandCount", 0)
            >= execution_queue.get("commandManifestCount", 0)
        )
        and (
            operator_runbook.get("requiredCommandCount", 0)
            >= execution_queue.get("commandManifestCount", 0)
        )
        and isinstance(operator_runbook.get("phases"), list)
        and (
            operator_runbook.get("phases") == ["before", "execute", "after", "refresh"]
        )
        and (operator_runbook.get("nextStage") in {"before", "execute"})
        and isinstance(operator_runbook.get("nextCommand"), str)
        and bool(operator_runbook.get("nextCommand"))
        and isinstance(operator_runbook.get("nextCommandArgs"), list)
        and (len(operator_runbook.get("nextCommandArgs")) >= 2)
        and isinstance(operator_runbook.get("nextCommandRequired"), bool)
        and isinstance(operator_next_command_selection, dict)
        and (
            operator_next_command_selection.get("strategy")
            == "first-command-in-operator-runbook-stage-order"
        )
        and (
            operator_next_command_selection.get("stage")
            == operator_runbook.get("nextStage")
        )
        and (
            operator_next_command_selection.get("command")
            == operator_runbook.get("nextCommand")
        )
        and isinstance(operator_next_command_selection.get("stageOrder"), list)
        and (
            operator_next_command_selection.get("stageOrder")
            == ["before", "execute", "after", "refresh"]
        )
        and isinstance(operator_next_command_selection.get("required"), bool)
        and isinstance(operator_next_command_selection.get("reason"), str)
        and bool(operator_next_command_selection.get("reason"))
        and isinstance(operator_runbook.get("stages"), list)
        and any(
            (
                isinstance(stage, dict)
                and stage.get("phase") == "execute"
                and (stage.get("commandCount", 0) >= 1)
                and any(
                    (
                        isinstance(item, dict)
                        and item.get("actionId") == "agent-skill-proposal-preview"
                        and (item.get("runPolicy") == "preview-only")
                        and ("learn --propose-skills" in str(item.get("command", "")))
                        and (
                            item.get("commandArgs", [])[:3]
                            == ["design-ai", "learn", "--propose-skills"]
                        )
                        for item in stage.get("commands", [])
                    )
                )
                for stage in operator_runbook.get("stages", [])
            )
        )
        and any(
            (
                isinstance(stage, dict)
                and stage.get("phase") == "refresh"
                and any(
                    (
                        isinstance(item, dict)
                        and item.get("required") is True
                        and is_agent_backlog_refresh_command(item)
                        for item in stage.get("commands", [])
                    )
                )
                for stage in operator_runbook.get("stages", [])
            )
        )
        and isinstance(command_effect_summary, dict)
        and (command_effect_summary.get("totalCommands", 0) >= 1)
        and (command_effect_summary.get("outputTargetCount", -1) >= 0)
        and (command_effect_summary.get("profileTargetCount", -1) >= 0)
        and (command_effect_summary.get("usageTargetCount", -1) >= 0)
        and (command_effect_summary.get("mutationFlagCount", -1) >= 0)
        and isinstance(command_effect_summary.get("outputTargets"), list)
        and isinstance(command_effect_summary.get("profileTargets"), list)
        and isinstance(command_effect_summary.get("usageTargets"), list)
        and isinstance(command_effect_summary.get("mutationFlags"), list)
        and isinstance(command_effect_review, dict)
        and (
            command_effect_review.get("level")
            in {"clear", "target-review", "mutation-review"}
        )
        and isinstance(command_effect_review.get("requiresOperatorReview"), bool)
        and isinstance(command_effect_review.get("headline"), str)
        and isinstance(command_effect_review.get("checklist"), list)
        and isinstance(gate_phase_summary, dict)
        and (gate_phase_summary.get("count", 0) >= 1)
        and (gate_phase_summary.get("requiredCount", 0) >= 1)
        and (gate_phase_summary.get("optionalCount", -1) >= 0)
        and isinstance(gate_phase_summary.get("phases"), list)
        and (gate_phase_summary.get("hasRefresh") is True)
        and isinstance(gate_runbook, dict)
    )
