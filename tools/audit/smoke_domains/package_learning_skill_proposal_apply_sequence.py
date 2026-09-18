from __future__ import annotations

from pathlib import Path

from smoke_domains.package_learning_skill_proposal_apply_contract import (
    EXPECTED_COMMAND_SEQUENCE,
    expected_apply_command_args,
)


def valid_skill_proposal_apply_command_sequence(
    payload: dict[str, object],
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    signal_source: Path | None,
) -> bool:
    commands = payload.get("commands")
    contract = payload.get("commandContract")
    expected_args = expected_apply_command_args(
        profile_path,
        usage_path,
        review_path,
        signal_source,
    )
    sequence = contract.get("commandSequence") if isinstance(contract, dict) else None
    sequence_summary = (
        contract.get("commandSequenceSummary") if isinstance(contract, dict) else None
    )
    sequence_by_key = (
        contract.get("commandSequenceByKey") if isinstance(contract, dict) else None
    )
    review_check = (
        str(commands.get("reviewCheckJson", "")) if isinstance(commands, dict) else ""
    )
    return (
        isinstance(commands, dict)
        and isinstance(contract, dict)
        and contract.get("valid") is True
        and contract.get("status") == "pass"
        and contract.get("commandCount") == 4
        and contract.get("checkCount") == 18
        and contract.get("passCount") == 18
        and contract.get("warningCount") == 0
        and contract.get("requiredKeys") == list(expected_args.keys())
        and contract.get("missingCommandKeys") == []
        and contract.get("unexpectedCommandKeys") == []
        and contract.get("baseCommand") == ["design-ai", "learn", "--propose-skills"]
        and contract.get("reviewFileRequired") is True
        and contract.get("reviewFile") == str(review_path)
        and contract.get("forbiddenFlags") == ["--yes"]
        and contract.get("failureCount") == 0
        and contract.get("failedCheckIds") == []
        and contract.get("failedChecks") == []
        and contract.get("nextCommandKey") == "reviewCheckJson"
        and contract.get("nextCommand") == review_check
        and contract.get("nextCommandArgs") == expected_args["reviewCheckJson"]
        and contract.get("nextCommandRunPolicy") == "preview-only"
        and contract.get("commandSequenceCount") == 4
        and contract.get("commandSequenceKeys") == list(expected_args.keys())
        and isinstance(sequence_summary, dict)
        and sequence_summary.get("executable") is True
        and sequence_summary.get("blocked") is False
        and sequence_summary.get("stepCount") == 4
        and sequence_summary.get("readOnlyStepCount") == 2
        and sequence_summary.get("localOutputStepCount") == 2
        and sequence_summary.get("writesLocalFiles") is True
        and sequence_summary.get("writesOutputArtifacts") is True
        and sequence_summary.get("mutatesProfile") is False
        and sequence_summary.get("mutatesReviewFile") is False
        and sequence_summary.get("mutatesSkillFiles") is False
        and sequence_summary.get("callsExternalAiApis") is False
        and sequence_summary.get("requiresCleanWorkspace") is False
        and sequence_summary.get("runPolicy") == "mixed-preview-local-output"
        and isinstance(sequence, list)
        and len(sequence) == 4
        and isinstance(sequence_by_key, dict)
        and list(sequence_by_key.keys()) == list(expected_args.keys())
        and all(
            isinstance(sequence_by_key.get(key), dict)
            and sequence_by_key[key].get("key") == key
            and sequence_by_key[key].get("command") == str(commands.get(key, ""))
            and sequence_by_key[key].get("runPolicy") == run_policy
            and isinstance(sequence_by_key[key].get("safety"), dict)
            and sequence_by_key[key]["safety"].get("level") == safety_level
            for _, key, run_policy, safety_level, _ in EXPECTED_COMMAND_SEQUENCE
        )
        and all(
            isinstance(item, dict)
            and item.get("step") == step
            and item.get("key") == key
            and item.get("command") == str(commands.get(key, ""))
            and item.get("commandArgs") == expected_args[key]
            and item.get("runPolicy") == run_policy
            for item, (step, key, run_policy, _, _) in zip(
                sequence,
                EXPECTED_COMMAND_SEQUENCE,
                strict=True,
            )
        )
        and "Run reviewCheckJson after manual skill edits"
        in str(contract.get("nextAction", ""))
        and isinstance(contract.get("summary"), dict)
        and contract["summary"].get("failures") == 0
        and contract["summary"].get("warnings") == 0
        and contract["summary"].get("passes") == 18
        and contract["summary"].get("total") == 18
        and isinstance(contract.get("checks"), list)
        and all(check.get("passed") is True for check in contract.get("checks", []))
    )
