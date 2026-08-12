from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_package_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}\ncommand: {format_cmd(cmd)}")


def write_learning_relevance_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:02.000Z",
                "entries": [
                    {
                        "id": "learn-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise brand language",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "learn-relevant",
                        "category": "accessibility",
                        "text": "Prioritize keyboard accessibility details for Button component API specs",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "learn-unrelated-newer",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile checkout layout",
                        "source": "package-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def assert_learning_recall_json(
    raw: str,
    *,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn recall JSON") from error

    require_package_smoke(
        isinstance(payload, dict) and payload.get("query") == "korean mobile",
        context=context,
        cmd=cmd,
        message="learn recall JSON must echo the query",
    )
    corpus = payload.get("corpus")
    require_package_smoke(
        isinstance(corpus, dict)
        and isinstance(corpus.get("candidateCount"), int)
        and corpus.get("candidateCount") > 0
        and isinstance(corpus.get("selectedCount"), int)
        and isinstance(corpus.get("selected"), list),
        context=context,
        cmd=cmd,
        message="learn recall corpus block shape changed",
    )
    learning = payload.get("learning")
    require_package_smoke(
        isinstance(learning, dict)
        and learning.get("mode") == "brief-relevance"
        and learning.get("candidateCount") == 3
        and isinstance(learning.get("selected"), list),
        context=context,
        cmd=cmd,
        message="learn recall learning block shape changed",
    )
    selected = learning.get("selected")
    require_package_smoke(
        len(selected) >= 1
        and isinstance(selected[0], dict)
        and selected[0].get("id") == "learn-korean"
        and selected[0].get("category") == "korean"
        and isinstance(selected[0].get("matchedTokens"), list),
        context=context,
        cmd=cmd,
        message="learn recall should rank the Korean learning entry for a Korean query",
    )

def assert_learning_relevance_context(payload: dict[str, object], *, context: str, cmd: list[str]) -> None:
    learning_context = payload.get("learningContext")
    require_package_smoke(
        isinstance(learning_context, dict),
        context=context,
        cmd=cmd,
        message="learningContext should be present when --with-learning is used",
    )

    selection = learning_context.get("selection")
    require_package_smoke(
        isinstance(selection, dict),
        context=context,
        cmd=cmd,
        message="learningContext selection metadata missing",
    )
    require_package_smoke(
        selection.get("mode") == "brief-relevance",
        context=context,
        cmd=cmd,
        message="learningContext should use brief-relevance selection",
    )
    require_package_smoke(
        selection.get("candidateCount") == 3,
        context=context,
        cmd=cmd,
        message="learningContext candidate count changed",
    )
    require_package_smoke(
        selection.get("matchedCount") >= 1,
        context=context,
        cmd=cmd,
        message="learningContext should report at least one relevant match",
    )
    require_package_smoke(
        selection.get("selectedCount") == 1,
        context=context,
        cmd=cmd,
        message="learningContext should report the limited selected entry count",
    )
    require_package_smoke(
        selection.get("fallbackCount") == 0,
        context=context,
        cmd=cmd,
        message="learningContext should not use recency fallback when the relevant entry fits the limit",
    )

    selected = selection.get("selected")
    require_package_smoke(
        isinstance(selected, list) and len(selected) == 1 and isinstance(selected[0], dict),
        context=context,
        cmd=cmd,
        message="learningContext selection should explain the selected entry",
    )
    selected_entry = selected[0]
    require_package_smoke(
        selected_entry.get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="learning selection explanation should point at the relevant entry",
    )
    require_package_smoke(
        selected_entry.get("reason") == "brief-match",
        context=context,
        cmd=cmd,
        message="learning selection explanation should mark the relevant entry as a brief match",
    )
    require_package_smoke(
        type(selected_entry.get("score")) in (int, float) and selected_entry.get("score") > 0,
        context=context,
        cmd=cmd,
        message="learning selection explanation should include a positive relevance score",
    )
    matched_tokens = selected_entry.get("matchedTokens")
    require_package_smoke(
        (
            isinstance(matched_tokens, list)
            and "button" in matched_tokens
            and "accessibility" in matched_tokens
        ),
        context=context,
        cmd=cmd,
        message="learning selection explanation should include matched brief tokens",
    )

    entries = learning_context.get("entries")
    require_package_smoke(
        isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict),
        context=context,
        cmd=cmd,
        message="learningContext should include the single limited entry",
    )
    require_package_smoke(
        entries[0].get("id") == "learn-relevant",
        context=context,
        cmd=cmd,
        message="brief relevance should pick the Button accessibility entry over the newer unrelated entry",
    )

    prompt = payload.get("prompt")
    require_package_smoke(isinstance(prompt, str), context=context, cmd=cmd, message="prompt should be a string")
    require_package_smoke(
        "Learning selection: brief relevance" in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should disclose brief-relevance learning selection",
    )
    require_package_smoke(
        "Prioritize keyboard accessibility details" in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should include the relevant learning entry",
    )
    require_package_smoke(
        "dense Korean mobile checkout" not in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should exclude the newer unrelated learning entry when limit is 1",
    )

def assert_recall_context(payload: dict[str, object], *, context: str, cmd: list[str]) -> None:
    recall = payload.get("recall")
    require_package_smoke(
        isinstance(recall, dict),
        context=context,
        cmd=cmd,
        message="recall should be present when --with-recall is used",
    )

    require_package_smoke(
        recall.get("mode") == "lexical",
        context=context,
        cmd=cmd,
        message="recall should use the deterministic lexical scorer",
    )
    require_package_smoke(
        isinstance(recall.get("candidateCount"), int) and recall.get("candidateCount") > 0,
        context=context,
        cmd=cmd,
        message="recall should report the corpus candidate count it scanned",
    )
    selected_count = recall.get("selectedCount")
    require_package_smoke(
        isinstance(selected_count, int) and selected_count >= 1,
        context=context,
        cmd=cmd,
        message="recall should select at least one corpus file for the Button brief",
    )

    selected = recall.get("selected")
    require_package_smoke(
        isinstance(selected, list) and len(selected) == selected_count and len(selected) >= 1,
        context=context,
        cmd=cmd,
        message="recall selected list should match the reported selected count",
    )
    top = selected[0]
    require_package_smoke(
        isinstance(top, dict) and isinstance(top.get("id"), str) and top.get("id"),
        context=context,
        cmd=cmd,
        message="recall selection should cite the corpus relPath as its id",
    )
    require_package_smoke(
        type(top.get("score")) in (int, float) and top.get("score") > 0,
        context=context,
        cmd=cmd,
        message="recall selection should include a positive relevance score",
    )
    require_package_smoke(
        isinstance(top.get("matchedTokens"), list) and len(top.get("matchedTokens")) >= 1,
        context=context,
        cmd=cmd,
        message="recall selection should list the matched brief tokens",
    )

    markdown = recall.get("markdown")
    require_package_smoke(
        isinstance(markdown, str) and "## Recalled design knowledge" in markdown,
        context=context,
        cmd=cmd,
        message="recall markdown should carry the Recalled design knowledge section",
    )
    require_package_smoke(
        top.get("id") in markdown,
        context=context,
        cmd=cmd,
        message="recall markdown should cite the top recalled corpus file",
    )

    prompt = payload.get("prompt")
    require_package_smoke(
        isinstance(prompt, str) and "## Recalled design knowledge" in prompt,
        context=context,
        cmd=cmd,
        message="prompt markdown should render the recalled knowledge section",
    )

def assert_learning_usage_payload(
    payload: dict[str, object],
    *,
    expected_command: str,
    context: str,
    cmd: list[str],
) -> None:
    learning_usage = payload.get("learningUsage")
    require_package_smoke(
        isinstance(learning_usage, dict),
        context=context,
        cmd=cmd,
        message="learningUsage should be present when --with-learning records usage",
    )
    require_package_smoke(
        learning_usage.get("recorded") is True,
        context=context,
        cmd=cmd,
        message="learningUsage should report a recorded local sidecar event",
    )

    event = learning_usage.get("event")
    require_package_smoke(
        isinstance(event, dict),
        context=context,
        cmd=cmd,
        message="learningUsage event metadata missing",
    )
    require_package_smoke(
        event.get("command") == expected_command,
        context=context,
        cmd=cmd,
        message=f"learningUsage event should record command {expected_command}",
    )
    require_package_smoke(
        event.get("selectedEntryIds") == ["learn-relevant"],
        context=context,
        cmd=cmd,
        message="learningUsage event should record the selected learning entry id",
    )
    require_package_smoke(
        isinstance(event.get("briefHash"), str) and len(event.get("briefHash")) == 16,
        context=context,
        cmd=cmd,
        message="learningUsage event should store a short brief hash instead of raw brief text",
    )
    require_package_smoke(
        "query" not in event and "brief" not in event,
        context=context,
        cmd=cmd,
        message="learningUsage event should not persist raw brief/query text",
    )

def assert_learning_usage_sidecar(
    usage_path: Path,
    *,
    expected_commands: list[str],
    context: str,
    cmd: list[str],
) -> None:
    require_package_smoke(
        usage_path.exists(),
        context=context,
        cmd=cmd,
        message="learning usage sidecar file should be written next to the learning profile",
    )
    try:
        payload = json.loads(usage_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learning usage sidecar JSON") from error

    events = payload.get("events")
    require_package_smoke(
        isinstance(events, list) and len(events) >= len(expected_commands),
        context=context,
        cmd=cmd,
        message="learning usage sidecar should contain prompt/pack usage events",
    )
    recent_events = events[-len(expected_commands):]
    require_package_smoke(
        [event.get("command") for event in recent_events if isinstance(event, dict)] == expected_commands,
        context=context,
        cmd=cmd,
        message="learning usage sidecar should preserve prompt/pack command order",
    )
    for event in recent_events:
        require_package_smoke(
            isinstance(event, dict)
            and event.get("selectedEntryIds") == ["learn-relevant"]
            and isinstance(event.get("briefHash"), str)
            and "query" not in event
            and "brief" not in event,
            context=context,
            cmd=cmd,
            message="learning usage sidecar event should be privacy-preserving and reference selected ids",
        )
