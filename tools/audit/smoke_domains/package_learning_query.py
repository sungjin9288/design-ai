from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def assert_learning_query_json(
    raw: str,
    *,
    profile_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn query JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn query JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn query file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("query") == "keyboard accessibility",
        context=context,
        cmd=cmd,
        message="learn query text changed",
    )
    require_package_smoke(
        payload.get("count") == 1 and payload.get("totalCount") == 3,
        context=context,
        cmd=cmd,
        message="learn query should return only the matching entry while reporting total profile size",
    )

    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learn query entries list should contain exactly one matching entry",
    )
    require_package_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learn query should return the Button accessibility entry",
    )
    selection = payload.get("selection")
    require_package_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learn query explain selection metadata missing",
    )
    require_package_smoke(
        selection.get("fallbackEnabled") is False and selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn query explain should select exactly one entry without fallback",
    )
    selected = selection.get("selected")
    require_package_smoke(
        isinstance(selected, list) and len(selected) == 1 and isinstance(selected[0], dict),
        context=context,
        cmd=cmd,
        message="learn query explain selected list should contain one entry",
    )
    require_package_smoke(
        selected[0].get("id") == "learn-relevant"
        and selected[0].get("reason") == "brief-match"
        and type(selected[0].get("score")) in (int, float)
        and selected[0].get("score") > 0,
        context=context,
        cmd=cmd,
        message="learn query explain should include score and match reason",
    )
    matched_tokens = selected[0].get("matchedTokens")
    require_package_smoke(
        isinstance(matched_tokens, list)
        and "keyboard" in matched_tokens
        and "accessibility" in matched_tokens,
        context=context,
        cmd=cmd,
        message="learn query explain should include matched query tokens",
    )

def assert_learning_query_human(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    for expected in (
        "Local learning profile",
        "Entries: 1/3",
        "Query: keyboard accessibility",
        "Limit: 2",
        "Explain: selection score, matched tokens, and reason",
        "[accessibility] Prioritize keyboard accessibility details for Button component API specs",
        "matched accessibility, keyboard",
        "reason brief-match",
    ):
        require_package_smoke(
            expected in raw,
            context=context,
            cmd=cmd,
            message=f"learn query human output missing {expected!r}",
        )
    require_package_smoke(
        "dense Korean mobile checkout" not in raw and "quiet enterprise brand voice" not in raw,
        context=context,
        cmd=cmd,
        message="learn query human output should exclude unrelated profile entries",
    )

def assert_learning_query_export_json(
    raw: str,
    *,
    profile_path: Path,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn query export JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="learn query export JSON must be an object")
    require_package_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn query export file path differs from the smoke profile",
    )
    require_package_smoke(
        payload.get("query") == "keyboard accessibility",
        context=context,
        cmd=cmd,
        message="learn query export text changed",
    )
    selection = payload.get("selection")
    require_package_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learn query export selection metadata missing",
    )
    require_package_smoke(
        selection.get("fallbackEnabled") is False and selection.get("fallbackCount") == 0,
        context=context,
        cmd=cmd,
        message="learn query export should not use recency fallback",
    )
    require_package_smoke(
        selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learn query export should select one matching entry",
    )
    entries = payload.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learn query export entries list should contain exactly one matching entry",
    )
    require_package_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learn query export should return the Button accessibility entry",
    )
    markdown = payload.get("markdown")
    require_package_smoke(
        isinstance(markdown, str) and "no recency fallback" in markdown,
        context=context,
        cmd=cmd,
        message="learn query export markdown should disclose that fallback is disabled",
    )
