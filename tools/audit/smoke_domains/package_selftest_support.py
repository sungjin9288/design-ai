"""Shared fixtures and assertions for the package smoke self-test phases."""
from __future__ import annotations

import json
import tarfile

from capability_manifest import (
    SOURCE_CAPABILITIES as EXPECTED_CAPABILITIES,
    validate_capability_manifest,
)
from pathlib import Path
from smoke_assertions import (
    assert_doctor_json_clean,
    assert_no_ansi,
)
from smoke_domains.package_failures import require_package_smoke


EXPECTED_AGENT_BACKLOG_REFRESH_ONLY_RUNBOOK_REASON = (
    "Optional refresh command is available as status metadata; "
    "no executable backlog handoff command is selected."
)


EXPECTED_AGENT_BACKLOG_NO_COMMAND_HANDOFF_REASON = (
    "No handoff command is required; optional refresh command remains available as status metadata."
)


EXPECTED_AGENT_BACKLOG_EMPTY_QUEUE_ALIGNMENT_REASON = (
    "Operator runbook exposes an optional refresh command while the safety-ordered execution queue is empty."
)


EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_REASON = (
    "No real warn/fail check result has been intentionally captured into the local learning profile yet."
)


EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_NEXT_CONDITION = (
    "Run `design-ai check <artifact.md> --learn --yes` only after reviewing an actual warning or failure "
    "that should improve future outputs."
)


EXPECTED_CHECK_CAPTURE_OPTIONAL_GAP_AUTOMATION_POLICY = (
    "Do not emit placeholder mutation commands for this advisory gap; wait for real check evidence."
)


def assert_doctor_report_file(report_path: Path, *, context: str) -> None:
    try:
        raw = report_path.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read doctor JSON after {context}: {report_path}") from error

    assert_doctor_json_clean(
        raw,
        context=context,
        cmd=["design-ai", "doctor", "--json"],
        parse_error_message=f"failed to parse doctor JSON after {context}",
    )


def assert_tarball_capability_manifest(tarball: Path) -> None:
    member_name = "package/cli/lib/capability-manifest.json"
    try:
        with tarfile.open(tarball, "r:gz") as archive:
            member = archive.getmember(member_name)
            source = archive.extractfile(member)
            if source is None:
                raise SystemExit(f"packed capability manifest is unreadable: {member_name}")
            manifest = json.loads(source.read().decode("utf-8"))
    except (KeyError, OSError, tarfile.TarError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SystemExit(f"packed capability manifest is missing or invalid: {member_name}") from error

    validated = validate_capability_manifest(manifest)
    if validated != EXPECTED_CAPABILITIES:
        raise SystemExit("packed capability manifest differs from the verified source contract")


def assert_check_learning_capture_json(
    raw: str,
    *,
    profile_path: Path,
    expected_file_suffix: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{context}: failed to parse check learning capture JSON") from error

    require_package_smoke(isinstance(payload, dict), context=context, cmd=cmd, message="check learning capture JSON must be an object")
    require_package_smoke(
        isinstance(payload.get("filePath"), str) and payload["filePath"].endswith(expected_file_suffix),
        context=context,
        cmd=cmd,
        message="check learning capture file path changed",
    )
    require_package_smoke(payload.get("status") == "warn", context=context, cmd=cmd, message="check learning capture status should warn")
    require_package_smoke(payload.get("failures") == 0, context=context, cmd=cmd, message="check learning capture fixture should not fail")

    capture = payload.get("learningCapture")
    require_package_smoke(isinstance(capture, dict), context=context, cmd=cmd, message="check learningCapture object missing")
    require_package_smoke(
        list(capture) == [
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
        message="check learningCapture keys changed",
    )
    require_package_smoke(
        capture.get("file") == str(profile_path)
        and capture.get("dryRun") is False
        and capture.get("applied") is True
        and capture.get("source") == "check:artifact",
        context=context,
        cmd=cmd,
        message="check learning capture metadata changed",
    )
    require_package_smoke(
        capture.get("candidateCount") == 4
        and capture.get("addedCount") == 4
        and capture.get("skippedCount") == 0
        and capture.get("count") == 4,
        context=context,
        cmd=cmd,
        message="check learning capture counts changed",
    )

    entries = capture.get("entries")
    require_package_smoke(isinstance(entries, list) and len(entries) == 4, context=context, cmd=cmd, message="check learning capture entries changed")
    require_package_smoke(capture.get("skipped") == [], context=context, cmd=cmd, message="check learning capture should not skip fresh entries")
    categories = [entry.get("category") for entry in entries if isinstance(entry, dict)]
    require_package_smoke(
        categories.count("accessibility") == 2 and categories.count("workflow") == 2,
        context=context,
        cmd=cmd,
        message="check learning capture categories changed",
    )
    require_package_smoke(
        all(
            isinstance(entry, dict)
            and isinstance(entry.get("id"), str)
            and entry["id"].startswith("learn-")
            and entry.get("source") == "check:artifact"
            and isinstance(entry.get("createdAt"), str)
            and isinstance(entry.get("text"), str)
            and entry["text"].startswith("Improve future outputs by addressing ")
            for entry in entries
        ),
        context=context,
        cmd=cmd,
        message="check learning capture entry schema changed",
    )
    require_package_smoke(
        any("Keyboard and focus behavior" in entry.get("text", "") for entry in entries)
        and any("Screen-reader semantics" in entry.get("text", "") for entry in entries)
        and any("Responsive behavior" in entry.get("text", "") for entry in entries)
        and any("Misuse guidance" in entry.get("text", "") for entry in entries),
        context=context,
        cmd=cmd,
        message="check learning capture entry text changed",
    )

    try:
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"{context}: failed to read check learning capture profile") from error
    profile_entries = profile.get("entries")
    require_package_smoke(
        isinstance(profile_entries, list)
        and len(profile_entries) == 4
        and [entry.get("text") for entry in profile_entries] == [entry.get("text") for entry in entries],
        context=context,
        cmd=cmd,
        message="check learning capture did not persist captured entries",
    )
