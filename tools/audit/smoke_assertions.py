"""Shared assertions for design-ai package and registry smoke tests."""
from __future__ import annotations

import argparse
import json
import re
import shlex
import sys
from typing import Callable

from doctor_assertions import EXPECTED_DOCTOR_PASS_LABELS, assert_doctor_report_clean

ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
EXPECTED_HELP_TOPICS = (
    "install",
    "update",
    "uninstall",
    "status",
    "list",
    "search",
    "show",
    "route",
    "routes",
    "prompt",
    "pack",
    "check",
    "audit",
    "doctor",
    "examples",
    "version",
    "help",
)


def format_cmd(cmd: list[str]) -> str:
    return shlex.join(cmd)


def assert_no_ansi(output: str, cmd: list[str]) -> None:
    if ANSI_ESCAPE_RE.search(output):
        raise SystemExit(f"NO_COLOR command emitted ANSI escape sequence: {format_cmd(cmd)}")


def passing_doctor_report_json() -> str:
    return json.dumps({
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS), "warn": 0, "fail": 0},
        "checks": [
            {"label": label, "status": "PASS"}
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
        ],
    })


def doctor_report_json_missing(label_to_remove: str) -> str:
    return json.dumps({
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS) - 1, "warn": 0, "fail": 0},
        "checks": [
            {"label": label, "status": "PASS"}
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
            if label != label_to_remove
        ],
    })


def parse_help_topics(raw: str, *, context: str, cmd: list[str]) -> list[str]:
    assert_no_ansi(raw, cmd)
    try:
        catalog = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse help JSON after {context}") from error

    if not isinstance(catalog, dict):
        raise SystemExit(f"help JSON after {context} is not an object")

    raw_topics = catalog.get("topics")
    if not isinstance(raw_topics, list):
        raise SystemExit(f"help JSON after {context} does not contain a topics array")

    topics: list[str] = []
    for item in raw_topics:
        topic = item.get("topic") if isinstance(item, dict) else None
        if not isinstance(topic, str) or not topic:
            raise SystemExit(f"help JSON after {context} contains an invalid topic entry")
        topics.append(topic)

    if len(set(topics)) != len(topics):
        raise SystemExit(f"help JSON after {context} contains duplicate topics")

    missing_expected = [topic for topic in EXPECTED_HELP_TOPICS if topic not in topics]
    if missing_expected:
        raise SystemExit(
            f"help JSON after {context} is missing expected topic(s): {', '.join(missing_expected)}"
        )

    return topics


def help_topic_script(topics: list[str]) -> str:
    if not topics:
        raise SystemExit("help topic script requires at least one topic")
    return " && ".join(f"design-ai help {shlex.quote(topic)}" for topic in topics)


def assert_doctor_json_clean(
    raw: str,
    *,
    context: str,
    cmd: list[str],
    parse_error_message: str,
    print_raw_on_failure: bool = True,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        report = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(parse_error_message) from error

    try:
        assert_doctor_report_clean(report, context=context)
    except SystemExit:
        if print_raw_on_failure:
            print(raw, file=sys.stderr)
        raise


def expect_self_test_failure(action: Callable[[], object], *, expected: str, scope: str) -> None:
    try:
        action()
    except SystemExit as error:
        if expected not in str(error):
            raise
    else:
        raise SystemExit(f"self-test failed: expected {scope} failure containing {expected!r}")


def run_self_test() -> None:
    context = "smoke assertion self-test"
    cmd = ["design-ai", "doctor", "--json"]
    help_cmd = ["design-ai", "help", "--json"]
    parse_error_message = f"failed to parse doctor JSON after {context}"

    assert_no_ansi("plain output", cmd)
    expect_self_test_failure(
        lambda: assert_no_ansi("\x1b[31mred", cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    assert_doctor_json_clean(
        passing_doctor_report_json(),
        context=context,
        cmd=cmd,
        parse_error_message=parse_error_message,
    )
    expect_self_test_failure(
        lambda: assert_doctor_json_clean(
            "{",
            context=context,
            cmd=cmd,
            parse_error_message=parse_error_message,
        ),
        expected="failed to parse doctor JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_doctor_json_clean(
            doctor_report_json_missing("Smoke assertions helper"),
            context=context,
            cmd=cmd,
            parse_error_message=parse_error_message,
            print_raw_on_failure=False,
        ),
        expected="Smoke assertions helper=missing",
        scope="smoke assertions",
    )

    assert parse_help_topics(
        json.dumps({
            "topics": [
                {"topic": topic}
                for topic in EXPECTED_HELP_TOPICS
            ],
        }),
        context=context,
        cmd=help_cmd,
    ) == list(EXPECTED_HELP_TOPICS)
    expect_self_test_failure(
        lambda: parse_help_topics("{", context=context, cmd=help_cmd),
        expected="failed to parse help JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: parse_help_topics(json.dumps([]), context=context, cmd=help_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps({
                "topics": [
                    {"topic": topic}
                    for topic in EXPECTED_HELP_TOPICS
                    if topic != "pack"
                ],
            }),
            context=context,
            cmd=help_cmd,
        ),
        expected="missing expected topic",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps({
                "topics": [
                    *[
                        {"topic": topic}
                        for topic in EXPECTED_HELP_TOPICS
                    ],
                    {"topic": "help"},
                ],
            }),
            context=context,
            cmd=help_cmd,
        ),
        expected="duplicate topics",
        scope="smoke assertions",
    )
    assert help_topic_script(["install", "route"]) == (
        "design-ai help install && design-ai help route"
    )
    assert help_topic_script(["route topic"]) == "design-ai help 'route topic'"
    expect_self_test_failure(
        lambda: help_topic_script([]),
        expected="requires at least one topic",
        scope="smoke assertions",
    )

    print("Smoke assertions self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run local smoke assertion fixtures")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    run_self_test()


if __name__ == "__main__":
    main()
