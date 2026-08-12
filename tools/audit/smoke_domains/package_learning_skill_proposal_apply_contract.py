from __future__ import annotations

from pathlib import Path


EXPECTED_COMMAND_SEQUENCE = [
    (1, "reviewCheckJson", "preview-only", "read-only", False),
    (2, "reviewCheckReport", "output-artifact", "local-output", True),
    (3, "proposalPatchPreview", "output-artifact", "local-output", True),
    (4, "strictGate", "strict-readiness-gate", "read-only", False),
]

EXPECTED_LOCAL_OUTPUT_SAFETY = {
    "level": "local-output",
    "writesLocalFiles": True,
    "writesOutputArtifact": True,
    "mutatesLocalState": True,
    "mutatesProfile": False,
    "mutatesReviewFile": False,
    "mutatesSkillFiles": False,
    "callsExternalAiApis": False,
    "requiresCleanWorkspace": False,
    "reason": (
        "This follow-up command writes a local preview artifact with --out but "
        "does not mutate learning, review, or skill files."
    ),
}

EXPECTED_RUNBOOK_STAGES = [
    (
        1,
        "previewArtifacts",
        "local-output-preview",
        False,
        ["reviewCheckReport", "proposalPatchPreview"],
    ),
    (2, "manualSkillEdit", "manual-review", True, []),
    (3, "reviewReadiness", "read-only-check", True, ["reviewCheckJson"]),
    (4, "strictGate", "read-only-gate", True, ["strictGate"]),
]


def expected_apply_command_args(
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    signal_source: Path | None,
) -> dict[str, list[str]]:
    context_args = [
        "design-ai",
        "learn",
        "--propose-skills",
        "--file",
        str(profile_path),
        "--usage-file",
        str(usage_path),
    ]
    if signal_source is not None:
        context_args.extend(["--from-file", str(signal_source)])
    context_args.extend(["--review-file", str(review_path)])
    return {
        "reviewCheckJson": [*context_args, "--review-check", "--json"],
        "reviewCheckReport": [
            *context_args,
            "--review-check",
            "--report",
            "--out",
            "skill-proposal-review-check.md",
        ],
        "proposalPatchPreview": [
            *context_args,
            "--patch",
            "--out",
            "skill-proposals.patch",
        ],
        "strictGate": [*context_args, "--strict", "--json"],
    }


def exact_keyed_values(
    section: object, field: str, expected: dict[str, object]
) -> bool:
    return isinstance(section, dict) and section.get(field) == expected


def command_by_key(commands: object, key: str) -> dict[str, object] | None:
    if not isinstance(commands, list):
        return None
    return next(
        (
            command
            for command in commands
            if isinstance(command, dict) and command.get("key") == key
        ),
        None,
    )
