from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_learning_curation_json(
    raw: str,
    *,
    profile_path: Path,
    usage_path: Path | None = None,
    dry_run: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn curate JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn curate JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn curate JSON file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("archiveFile") == str(profile_path.with_name(f"{profile_path.stem}.archive{profile_path.suffix}")),
        context=context,
        cmd=cmd,
        message="learn curate archive file path changed",
    )
    require_package_smoke(payload.get("dryRun") is dry_run, context=context, cmd=cmd, message="learn curate dryRun flag changed")
    require_package_smoke(payload.get("applied") is (not dry_run), context=context, cmd=cmd, message="learn curate applied flag changed")

    before = payload.get("before")
    require_package_smoke(
        isinstance(before, dict) and before.get("status") == "warn",
        context=context,
        cmd=cmd,
        message="learn curate should start from a warning profile",
    )
    require_package_smoke(payload.get("proposalCount") == 2, context=context, cmd=cmd, message="learn curate proposal count changed")
    require_package_smoke(payload.get("archiveCount") == 2, context=context, cmd=cmd, message="learn curate archive count changed")
    require_package_smoke(payload.get("manualReviewCount") == 0, context=context, cmd=cmd, message="learn curate manual-review count changed")

    usage = payload.get("usage")
    require_package_smoke(isinstance(usage, dict), context=context, cmd=cmd, message="learn curate usage review missing")
    if usage_path is not None:
        require_package_smoke(
            usage.get("usageFile") == str(usage_path),
            context=context,
            cmd=cmd,
            message="learn curate usage file path changed",
        )
        require_package_smoke(
            usage.get("profileFile") == str(profile_path),
            context=context,
            cmd=cmd,
            message="learn curate usage profile path changed",
        )
        require_package_smoke(
            usage.get("profileFileMatches") is True,
            context=context,
            cmd=cmd,
            message="learn curate usage profile match flag changed",
        )
        require_package_smoke(usage.get("exists") is True, context=context, cmd=cmd, message="learn curate usage fixture missing")
        require_package_smoke(usage.get("eventCount") == 1, context=context, cmd=cmd, message="learn curate usage event count changed")
        require_package_smoke(usage.get("usedEntryCount") == 1, context=context, cmd=cmd, message="learn curate usage used count changed")
        require_package_smoke(usage.get("unusedEntryCount") == 2, context=context, cmd=cmd, message="learn curate usage unused count changed")
        require_package_smoke(
            usage.get("staleSelectedEntryCount") == 1,
            context=context,
            cmd=cmd,
            message="learn curate usage stale count changed",
        )
        require_package_smoke(usage.get("reviewCount") == 3, context=context, cmd=cmd, message="learn curate usage review count changed")
        require_package_smoke(usage.get("unusedReviewCount") == 2, context=context, cmd=cmd, message="learn curate usage unused review count changed")
        require_package_smoke(usage.get("staleReviewCount") == 1, context=context, cmd=cmd, message="learn curate usage stale review count changed")
        require_package_smoke(usage.get("autoArchive") is False, context=context, cmd=cmd, message="learn curate usage autoArchive changed")
        reviews = usage.get("reviews")
        require_package_smoke(isinstance(reviews, list), context=context, cmd=cmd, message="learn curate usage reviews missing")
        review_reasons = {
            item.get("entryId"): item.get("reason")
            for item in reviews
            if isinstance(item, dict)
        }
        require_package_smoke(
            review_reasons.get("learn-stale") == "stale-selected-entry-id",
            context=context,
            cmd=cmd,
            message="learn curate stale usage review changed",
        )
        require_package_smoke(
            review_reasons.get("learn-b") == "unused-with-limited-history"
            and review_reasons.get("learn-c") == "unused-with-limited-history",
            context=context,
            cmd=cmd,
            message="learn curate unused usage review changed",
        )
    else:
        require_package_smoke(
            usage.get("autoArchive") is False,
            context=context,
            cmd=cmd,
            message="learn curate usage autoArchive changed",
        )

    proposals = payload.get("proposals")
    require_package_smoke(isinstance(proposals, list), context=context, cmd=cmd, message="learn curate proposals missing")
    proposals_by_entry = {
        proposal.get("entryId"): proposal
        for proposal in proposals
        if isinstance(proposal, dict)
    }
    expected_reasons = {
        "learn-b": "duplicate-entry",
        "learn-c": "sensitive-content",
    }
    for entry_id, reason in expected_reasons.items():
        proposal = proposals_by_entry.get(entry_id)
        require_package_smoke(
            isinstance(proposal, dict)
            and proposal.get("action") == "archive"
            and proposal.get("reason") == reason,
            context=context,
            cmd=cmd,
            message=f"learn curate proposal changed for {entry_id}",
        )

    archived = payload.get("archived")
    if dry_run:
        require_package_smoke(archived == [], context=context, cmd=cmd, message="learn curate dry run should not archive entries")
        require_package_smoke(payload.get("after") is None, context=context, cmd=cmd, message="learn curate dry run should not include after summary")
    else:
        require_package_smoke(
            isinstance(archived, list) and [item.get("id") for item in archived] == ["learn-b", "learn-c"],
            context=context,
            cmd=cmd,
            message="learn curate archived entries changed",
        )
        after = payload.get("after")
        require_package_smoke(
            isinstance(after, dict) and after.get("status") == "pass",
            context=context,
            cmd=cmd,
            message="learn curate should leave a passing profile after archived entries move out",
        )

def assert_learning_curation_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Learning curation preview",
        "Archive candidates: 2",
        "Would archive:",
        "learn-b: duplicate-entry",
        "learn-c: sensitive-content",
        "No changes made.",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn curate human output missing {expected!r}",
        )

def assert_learning_curation_report(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "# Learning Curation Report",
        "Mode: preview",
        "Archive candidates: 2",
        "`learn-b`: duplicate-entry",
        "`learn-c`: sensitive-content",
        "## Usage Review",
        "Usage sidecars store selected entry ids and short brief hashes",
        "rerun `design-ai learn --curate --yes`",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn curate report missing {expected!r}",
        )
