from __future__ import annotations


def valid_optional_apply_command(item: object) -> bool:
    if not isinstance(item, dict):
        return False
    apply_command = item.get("applyCommand", "")
    apply_args = item.get("applyCommandArgs", [])
    apply_safety = item.get("applyCommandSafety")
    if not apply_command:
        return True
    return (
        isinstance(apply_command, str)
        and isinstance(apply_args, list)
        and len(apply_args) >= 2
        and isinstance(apply_safety, dict)
        and apply_safety.get("level")
        in {"read-only", "writes-local-file", "mutates-local-state"}
        and isinstance(apply_safety.get("writesLocalFiles"), bool)
        and isinstance(apply_safety.get("mutatesLocalState"), bool)
        and isinstance(apply_safety.get("requiresCleanWorkspace"), bool)
        and isinstance(item.get("applyRequiresReviewBeforeMutation"), bool)
    )


def is_agent_backlog_refresh_command(item: object) -> bool:
    if not isinstance(item, dict):
        return False
    command = str(item.get("command", ""))
    args = item.get("commandArgs", [])
    return (
        "learn --agent-backlog" in command
        and isinstance(args, list)
        and args[:3] == ["design-ai", "learn", "--agent-backlog"]
        and "--from-file" in args
        and "--file" in args
        and "--usage-file" in args
        and "--strict" in args
        and "--json" in args
    )


def valid_agent_backlog_actions_and_verification(action_plan: object) -> bool:
    action_plan_steps = (
        action_plan.get("steps") if isinstance(action_plan, dict) else None
    )
    action_plan_verification = (
        action_plan.get("verification") if isinstance(action_plan, dict) else None
    )
    execution_queue = (
        action_plan.get("executionQueue") if isinstance(action_plan, dict) else None
    )
    ordered_queue = (
        execution_queue.get("ordered") if isinstance(execution_queue, dict) else None
    )
    command_manifest = (
        execution_queue.get("commandManifest")
        if isinstance(execution_queue, dict)
        else None
    )
    command_effect_review = (
        execution_queue.get("commandEffectReview")
        if isinstance(execution_queue, dict)
        else None
    )
    gate_runbook = (
        command_effect_review.get("gateRunbook")
        if isinstance(command_effect_review, dict)
        else None
    )
    return (
        isinstance(gate_runbook.get("before"), list)
        and isinstance(gate_runbook.get("after"), list)
        and isinstance(gate_runbook.get("refresh"), list)
        and isinstance(gate_runbook.get("other"), list)
        and any(
            (
                isinstance(item, dict)
                and item.get("phase") == "refresh"
                and (item.get("required") is True)
                and is_agent_backlog_refresh_command(item)
                for item in gate_runbook.get("refresh", [])
            )
        )
        and isinstance(command_effect_review.get("gateCommands"), list)
        and any(
            (
                isinstance(item, dict)
                and item.get("phase") == "refresh"
                and (item.get("required") is True)
                and is_agent_backlog_refresh_command(item)
                for item in command_effect_review.get("gateCommands", [])
            )
        )
        and execution_queue.get("nextActionId")
        and ("learn --propose-skills" in str(execution_queue.get("nextCommand", "")))
        and (execution_queue.get("nextCommandRunPolicy") == "preview-only")
        and isinstance(ordered_queue, list)
        and any(
            (
                isinstance(item, dict)
                and item.get("actionId") == "agent-skill-proposal-preview"
                and (item.get("safetyLevel") == "read-only")
                and (item.get("runPolicy") == "preview-only")
                for item in ordered_queue
            )
        )
        and isinstance(command_manifest, list)
        and any(
            (
                isinstance(item, dict)
                and item.get("actionId") == "agent-skill-proposal-preview"
                and (item.get("runPolicy") == "preview-only")
                and isinstance(item.get("commandEffects"), dict)
                and valid_optional_apply_command(item)
                and (item["commandEffects"].get("writesLocalFiles") is False)
                and (item["commandEffects"].get("mutatesLocalState") is False)
                and (item["commandEffects"].get("outputTargets") == [])
                and (item["commandEffects"].get("mutationFlags") == [])
                for item in command_manifest
            )
        )
        and isinstance(action_plan_steps, list)
        and any(
            (
                isinstance(item, dict)
                and item.get("actionId") == "agent-skill-proposal-preview"
                and ("learn --propose-skills" in str(item.get("command", "")))
                and (item.get("requiresReviewBeforeMutation") is False)
                and isinstance(item.get("commandSafety"), dict)
                and valid_optional_apply_command(item)
                and (item["commandSafety"].get("level") == "read-only")
                and (item["commandSafety"].get("writesLocalFiles") is False)
                and (item["commandSafety"].get("mutatesLocalState") is False)
                for item in action_plan_steps
            )
        )
        and isinstance(action_plan_verification, list)
        and any(
            (
                isinstance(item, dict) and is_agent_backlog_refresh_command(item)
                for item in action_plan_verification
            )
        )
    )
