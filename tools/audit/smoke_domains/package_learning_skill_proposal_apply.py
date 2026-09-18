from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd
from smoke_domains.package_learning_skill_proposal_apply_identity import (
    valid_skill_proposal_apply_identity,
)
from smoke_domains.package_learning_skill_proposal_apply_artifacts import (
    valid_skill_proposal_apply_artifacts,
)
from smoke_domains.package_learning_skill_proposal_apply_operator import (
    valid_skill_proposal_apply_operator_runbook,
)
from smoke_domains.package_learning_skill_proposal_apply_safety import (
    valid_skill_proposal_apply_approval_and_safety,
)
from smoke_domains.package_learning_skill_proposal_apply_sequence import (
    valid_skill_proposal_apply_command_sequence,
)


def require_package_smoke(
    condition: bool, *, context: str, cmd: list[str], message: str
) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_skill_proposal_apply_plan_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    signal_source: Path | None = None,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"{context}: failed to parse learn skill proposal apply-plan JSON"
        ) from error
    require_package_smoke(
        valid_skill_proposal_apply_identity(
            payload,
            profile_path=profile_path,
            usage_path=usage_path,
            review_path=review_path,
            signal_source=signal_source,
        )
        and valid_skill_proposal_apply_command_sequence(
            payload,
            profile_path=profile_path,
            usage_path=usage_path,
            review_path=review_path,
            signal_source=signal_source,
        )
        and valid_skill_proposal_apply_operator_runbook(payload)
        and valid_skill_proposal_apply_artifacts(
            payload,
            profile_path=profile_path,
            usage_path=usage_path,
            review_path=review_path,
            signal_source=signal_source,
        )
        and valid_skill_proposal_apply_approval_and_safety(payload),
        context=context,
        cmd=cmd,
        message="learn skill proposal apply-plan JSON should include accepted manual apply tasks and read-only privacy boundaries",
    )
