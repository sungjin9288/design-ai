from __future__ import annotations

import json
from pathlib import Path

from smoke_assertions import assert_no_ansi, format_cmd


def require_registry_smoke(condition: bool, *, context: str, cmd: list[str], message: str) -> None:
    if not condition:
        raise SystemExit(f"{context}: {message}: {format_cmd(cmd)}")


def write_learning_stats_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": [
                    {
                        "id": "registry-brand",
                        "category": "brand",
                        "text": "Use quiet enterprise brand language",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-a11y",
                        "category": "accessibility",
                        "text": "Prefer keyboard-first critique notes",
                        "source": "feedback:keep",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "registry-korean",
                        "category": "korean",
                        "text": "Prefer dense Korean mobile layouts with compact controls",
                        "source": "import:cli",
                        "createdAt": "2026-05-22T00:00:03.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def write_learning_audit_fixture(profile_path: Path) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": [
                    {
                        "id": "registry-audit-a",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:00.000Z",
                    },
                    {
                        "id": "registry-audit-b",
                        "category": "workflow",
                        "text": "Prefer release notes that state evidence before claims",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:01.000Z",
                    },
                    {
                        "id": "registry-audit-c",
                        "category": "constraint",
                        "text": "Never include api_key=redacted placeholders in prompt context",
                        "source": "registry-smoke",
                        "createdAt": "2026-05-22T00:00:02.000Z",
                    },
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

def assert_learning_feedback_json(
    raw: str,
    *,
    profile_path: Path,
    outcome: str,
    category: str,
    expected_instruction: str,
    expected_count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn feedback JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON must be an object",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn feedback JSON file path differs from the registry smoke profile",
    )
    require_registry_smoke(
        payload.get("count") == expected_count,
        context=context,
        cmd=cmd,
        message="learn feedback JSON count changed",
    )

    feedback = payload.get("feedback")
    entry = payload.get("entry")
    require_registry_smoke(
        isinstance(feedback, dict) and isinstance(entry, dict),
        context=context,
        cmd=cmd,
        message="learn feedback JSON should include feedback and entry objects",
    )
    require_registry_smoke(
        feedback.get("outcome") == outcome,
        context=context,
        cmd=cmd,
        message="learn feedback outcome changed",
    )
    require_registry_smoke(
        feedback.get("category") == category and entry.get("category") == category,
        context=context,
        cmd=cmd,
        message="learn feedback category changed",
    )
    require_registry_smoke(
        entry.get("source") == f"feedback:{outcome}",
        context=context,
        cmd=cmd,
        message="learn feedback source should preserve the outcome",
    )
    require_registry_smoke(
        isinstance(feedback.get("instruction"), str)
        and feedback.get("instruction") == entry.get("text")
        and feedback.get("instruction") == expected_instruction,
        context=context,
        cmd=cmd,
        message="learn feedback instruction text changed",
    )

def assert_learning_init_json(
    raw: str,
    *,
    profile_path: Path,
    dry_run: bool,
    added_count: int,
    skipped_count: int,
    count: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse learn init JSON") from error

    require_registry_smoke(
        isinstance(payload, dict),
        context=context,
        cmd=cmd,
        message="learn init JSON must be an object",
    )
    require_registry_smoke(
        list(payload) == [
            "file",
            "dryRun",
            "applied",
            "source",
            "candidateCount",
            "addedCount",
            "skippedCount",
            "count",
            "entries",
            "skipped",
        ],
        context=context,
        cmd=cmd,
        message="learn init JSON keys changed",
    )
    require_registry_smoke(
        payload.get("file") == str(profile_path),
        context=context,
        cmd=cmd,
        message="learn init file path changed",
    )
    require_registry_smoke(
        payload.get("dryRun") is dry_run and payload.get("applied") is (not dry_run),
        context=context,
        cmd=cmd,
        message="learn init dryRun/apply flags changed",
    )
    require_registry_smoke(
        payload.get("source") == "init:local-dogfood",
        context=context,
        cmd=cmd,
        message="learn init source changed",
    )
    require_registry_smoke(
        payload.get("candidateCount") == 6
        and payload.get("addedCount") == added_count
        and payload.get("skippedCount") == skipped_count
        and payload.get("count") == count,
        context=context,
        cmd=cmd,
        message="learn init counts changed",
    )

    entries = payload.get("entries")
    skipped = payload.get("skipped")
    require_registry_smoke(
        isinstance(entries, list) and len(entries) == added_count,
        context=context,
        cmd=cmd,
        message="learn init entries list changed",
    )
    require_registry_smoke(
        isinstance(skipped, list) and len(skipped) == skipped_count,
        context=context,
        cmd=cmd,
        message="learn init skipped list changed",
    )

    if entries:
        categories = [entry.get("category") for entry in entries if isinstance(entry, dict)]
        require_registry_smoke(
            categories == ["preference", "workflow", "accessibility", "korean", "brand", "constraint"],
            context=context,
            cmd=cmd,
            message="learn init entry categories changed",
        )
        require_registry_smoke(
            all(
                isinstance(entry, dict)
                and isinstance(entry.get("id"), str)
                and entry["id"].startswith("learn-")
                and entry.get("source") == "init:local-dogfood"
                and isinstance(entry.get("createdAt"), str)
                and isinstance(entry.get("text"), str)
                for entry in entries
            ),
            context=context,
            cmd=cmd,
            message="learn init entry schema changed",
        )
        require_registry_smoke(
            "one best path" in entries[0].get("text", "")
            and "repository context" in entries[1].get("text", "")
            and "WCAG 2.1 AA" in entries[2].get("text", "")
            and "Pretendard" in entries[3].get("text", "")
            and "restrained product UI language" in entries[4].get("text", "")
            and "external AI APIs" in entries[5].get("text", ""),
            context=context,
            cmd=cmd,
            message="learn init entry text changed",
        )

    if skipped:
        require_registry_smoke(
            all(item.get("reason") == "duplicate-entry-text" for item in skipped if isinstance(item, dict)),
            context=context,
            cmd=cmd,
            message="learn init skipped reason changed",
        )
