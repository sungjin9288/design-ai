from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_skill_proposal_report_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    returncode: int | None = None,
    expect_status: str | None = "warn",
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode is not None:
        require_package_smoke(
            returncode == 1,
            context=context,
            cmd=cmd,
            message="learn skill proposals strict JSON should exit with code 1 when proposal review is pending",
        )
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal JSON") from error

    require_package_smoke(
        payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path),
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should report the learning profile and usage paths",
    )
    require_package_smoke(
        payload.get("dryRun") is True and payload.get("applied") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals must remain preview-only",
    )
    if expect_status is not None:
        require_package_smoke(
            payload.get("status") == expect_status,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals JSON should report {expect_status!r} status when proposals need review",
        )
    require_package_smoke(
        payload.get("checkCaptureCount") >= 2
        and payload.get("candidateCount") >= 1
        and payload.get("proposalCount") >= 1
        and payload.get("count") == payload.get("proposalCount"),
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should summarize repeated check captures",
    )
    proposals = payload.get("proposals")
    require_package_smoke(
        isinstance(proposals, list)
        and any(
            isinstance(item, dict)
            and item.get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
            and item.get("sourceIssueCount", 0) >= 2
            and item.get("proposedInstructionDelta")
            and item.get("verificationCommand")
            and isinstance(item.get("evidenceSources"), list)
            and len(item.get("evidenceSources")) >= 2
            for item in proposals
        ),
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should include the repeated component-spec skill delta",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals JSON should be read-only and local",
    )
    return payload

def assert_skill_proposal_min_evidence_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    expected_min_evidence: int = 3,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal min-evidence JSON") from error

    require_package_smoke(
        payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path),
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should report the learning profile and usage paths",
    )
    require_package_smoke(
        payload.get("dryRun") is True and payload.get("applied") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON must remain preview-only",
    )
    require_package_smoke(
        payload.get("minEvidenceCount") == expected_min_evidence,
        context=context,
        cmd=cmd,
        message=f"learn skill proposals min-evidence JSON should report minEvidenceCount {expected_min_evidence}",
    )
    require_package_smoke(
        payload.get("checkCaptureCount") >= 2
        and payload.get("candidateCount") >= 1
        and payload.get("proposalCount") == 0
        and payload.get("count") == 0
        and payload.get("skippedCount") >= 1,
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should skip two-entry groups when threshold is higher",
    )
    skipped = payload.get("skipped")
    require_package_smoke(
        isinstance(skipped, list)
        and any(
            isinstance(item, dict)
            and item.get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
            and item.get("sourceIssueCount") == 2
            and f"Needs at least {expected_min_evidence}" in str(item.get("reason", ""))
            for item in skipped
        ),
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should explain skipped component-spec evidence",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposals min-evidence JSON should keep read-only privacy boundaries",
    )

def assert_skill_proposal_report_human(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    for expected in (
        "Skill evolution proposals",
        "Signal source:",
        "Status: warn",
        "Proposed skill deltas:",
        "skills/component-spec-writer/SKILL.md",
        "No changes made. This command is preview-only",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals human output missing {expected!r}",
        )

def assert_skill_proposal_report_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Skill Evolution Proposal Report",
        f"- File: {profile_path}",
        f"- Usage sidecar: {usage_path}",
        "- Status: warn",
        "## Proposed Skill Deltas",
        "skills/component-spec-writer/SKILL.md",
        "Proposed instruction delta:",
        "```bash",
        "node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
        "This report is preview-only evidence; it does not apply changes.",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals Markdown report missing {expected!r}",
        )

def assert_skill_proposal_patch(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# design-ai skill proposal patch preview",
        "# Preview-only output from `design-ai learn --propose-skills --patch`.",
        "# Review manually before applying. This command does not edit skill files.",
        "diff --git a/skills/component-spec-writer/SKILL.md b/skills/component-spec-writer/SKILL.md",
        "--- a/skills/component-spec-writer/SKILL.md",
        "+++ b/skills/component-spec-writer/SKILL.md",
        "+## Local Learning Proposal: skill-proposal-component-spec-writer-",
        "+- Category: accessibility",
        "+- Routes: component-spec",
        "+- Risk: low",
        "+- Evidence count: 2",
        "+- Proposed instruction: Add a pre-handoff accessibility checkpoint",
        "+- Verification: `node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json`",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposals patch output missing {expected!r}",
        )
