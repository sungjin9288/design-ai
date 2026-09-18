from __future__ import annotations

from pathlib import Path

from smoke_domains.package_learning_skill_proposal_apply_contract import (
    expected_apply_command_args,
)


def valid_skill_proposal_apply_identity(
    payload: dict[str, object],
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    signal_source: Path | None,
) -> bool:
    review = payload.get("review")
    tasks = payload.get("tasks")
    commands = payload.get("commands")
    command_args = payload.get("commandArgs")
    expected_args = expected_apply_command_args(
        profile_path,
        usage_path,
        review_path,
        signal_source,
    )
    review_check = (
        str(commands.get("reviewCheckJson", "")) if isinstance(commands, dict) else ""
    )
    return (
        payload.get("kind") == "skill-proposal-apply-plan"
        and payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path)
        and payload.get("reviewFile") == str(review_path)
        and payload.get("status") == "warn"
        and payload.get("acceptedCount") == 1
        and payload.get("count") == 1
        and payload.get("pendingReviewCount") == 1
        and isinstance(review, dict)
        and review.get("file") == str(review_path)
        and review.get("exists") is True
        and review.get("acceptedCount") == 1
        and isinstance(tasks, list)
        and len(tasks) == 1
        and isinstance(tasks[0], dict)
        and tasks[0].get("candidateSkillPath")
        == "skills/component-spec-writer/SKILL.md"
        and tasks[0]
        .get("proposalId", "")
        .startswith("skill-proposal-component-spec-writer-")
        and "accepted" in " ".join(tasks[0].get("manualSteps", []))
        and "applied" in " ".join(tasks[0].get("manualSteps", []))
        and isinstance(commands, dict)
        and "learn --propose-skills" in review_check
        and f"--file {profile_path}" in review_check
        and f"--usage-file {usage_path}" in review_check
        and (signal_source is None or f"--from-file {signal_source}" in review_check)
        and f"--review-file {review_path}" in review_check
        and "--review-check --json" in review_check
        and isinstance(command_args, dict)
        and all(
            command_args.get(key) == expected for key, expected in expected_args.items()
        )
    )
