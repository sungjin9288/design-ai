from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd
from smoke_domains.package_learning_skill_proposal import assert_skill_proposal_report_json


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_skill_proposal_review_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    payload = assert_skill_proposal_report_json(
        raw,
        profile_path=profile_path,
        usage_path=usage_path,
        context=context,
        cmd=cmd,
        expect_status=None,
    )
    review = payload.get("review")
    require_package_smoke(
        payload.get("reviewFile") == str(review_path)
        and payload.get("pendingReviewCount") == 0
        and payload.get("reviewedCount") >= 1
        and isinstance(review, dict)
        and review.get("file") == str(review_path)
        and review.get("exists") is True
        and review.get("matchedCount") >= 1
        and review.get("appliedCount") >= 1,
        context=context,
        cmd=cmd,
        message="learn skill proposals review JSON should join applied review decisions",
    )
    proposals = payload.get("proposals")
    require_package_smoke(
        isinstance(proposals, list)
        and any(
            isinstance(item, dict)
            and item.get("candidateSkillPath") == "skills/component-spec-writer/SKILL.md"
            and item.get("reviewStatus") == "applied"
            and item.get("reviewClearsStrict") is True
            for item in proposals
        ),
        context=context,
        cmd=cmd,
        message="learn skill proposals review JSON should mark applied proposals as strict-clearing",
    )

def assert_skill_proposal_review_check_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    context: str,
    cmd: list[str],
    expect_status: str = "pass",
    returncode: int | None = None,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal review-check JSON") from error

    if returncode is not None:
        expected_returncode = 0 if expect_status == "pass" else 1
        require_package_smoke(
            returncode == expected_returncode,
            context=context,
            cmd=cmd,
            message=f"learn skill proposal review-check strict JSON should exit with code {expected_returncode} when status is {expect_status}",
        )

    review = payload.get("review")
    summary = payload.get("summary")
    checks = payload.get("checks")
    require_package_smoke(
        payload.get("kind") == "skill-proposal-review-check"
        and payload.get("version") == 1
        and payload.get("file") == str(profile_path)
        and payload.get("usageFile") == str(usage_path)
        and payload.get("reviewFile") == str(review_path)
        and payload.get("status") == expect_status
        and payload.get("pendingReviewCount") == 0
        and payload.get("reviewedCount") >= 1
        and isinstance(review, dict)
        and review.get("file") == str(review_path)
        and review.get("exists") is True
        and review.get("status") == "pass",
        context=context,
        cmd=cmd,
        message=f"learn skill proposal review-check JSON should report {expect_status} review-file readiness",
    )
    require_package_smoke(
        isinstance(summary, dict)
        and summary.get("status") == expect_status
        and summary.get("failures") == 0
        and summary.get("warnings") == 0
        and isinstance(checks, list)
        and len(checks) >= 5
        and all(isinstance(item, dict) and item.get("level") == "pass" and item.get("passed") is True for item in checks),
        context=context,
        cmd=cmd,
        message="learn skill proposal review-check JSON should include passing check summary",
    )
    privacy = payload.get("privacy")
    require_package_smoke(
        isinstance(privacy, dict)
        and privacy.get("mutatesProfile") is False
        and privacy.get("mutatesSkillFiles") is False
        and privacy.get("callsExternalAiApis") is False
        and privacy.get("storesRawBriefText") is False,
        context=context,
        cmd=cmd,
        message="learn skill proposal review-check JSON should be read-only and local",
    )

def assert_skill_proposal_review_check_markdown(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    review_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Skill Proposal Review Check",
        "- Status: pass",
        "- Proposal status:",
        "- Signal status:",
        f"- File: {profile_path}",
        f"- Usage sidecar: {usage_path}",
        f"- Review file: {review_path}",
        "- Pending review: 0",
        "## Checks",
        "pass: review-file-configured - A skill proposal review file is configured.",
        "pass: current-proposals-cleared - All current proposals are applied or rejected.",
        "pass: no-stale-review-decisions - No stale review decisions were found.",
        "## Review Summary",
        "- Status: pass",
        "- Applied: 1",
        "## Privacy And Boundaries",
        "- Mutates learning profile: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
        "- Stores raw brief text: no",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn skill proposal review-check Markdown report missing {expected!r}",
        )

def assert_skill_proposal_review_template_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path,
    context: str,
    cmd: list[str],
    expected_decision_count: int = 1,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn skill proposal review-template JSON") from error

    decisions = payload.get("decisions")
    require_package_smoke(
        payload.get("version") == 1
        and payload.get("source") == "design-ai learn --propose-skills --review-template"
        and payload.get("proposalFile") == str(profile_path)
        and payload.get("usageFile") == str(usage_path)
        and isinstance(payload.get("reviewPolicy"), dict)
        and payload["reviewPolicy"].get("clearsStrict") == ["applied", "rejected"]
        and payload["reviewPolicy"].get("remainsPending") == ["accepted", "deferred"],
        context=context,
        cmd=cmd,
        message="learn skill proposal review template JSON should describe review policy and source files",
    )
    require_package_smoke(
        isinstance(decisions, list)
        and len(decisions) == expected_decision_count,
        context=context,
        cmd=cmd,
        message=f"learn skill proposal review template JSON should contain {expected_decision_count} pending decision scaffold(s)",
    )
    if expected_decision_count > 0:
        require_package_smoke(
            any(
                isinstance(item, dict)
                and str(item.get("proposalId", "")).startswith("skill-proposal-component-spec-writer-")
                and item.get("status") == "deferred"
                and item.get("reviewedAt") == ""
                and item.get("reviewer") == ""
                and "skills/component-spec-writer/SKILL.md" in str(item.get("note", ""))
                for item in decisions
            ),
            context=context,
            cmd=cmd,
            message="learn skill proposal review template JSON should scaffold a deferred component-spec proposal decision",
        )
