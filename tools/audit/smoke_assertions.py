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
EXPECTED_HELP_USAGE = "design-ai help [command|--json]"
EXPECTED_HELP_ALIASES = {
    "i": "install",
    "upgrade": "update",
    "u": "update",
    "remove": "uninstall",
    "rm": "uninstall",
    "s": "status",
    "ls": "list",
    "find": "search",
    "cat": "show",
    "recommend": "route",
    "lint": "check",
    "a": "audit",
    "diag": "doctor",
    "example": "examples",
    "ex": "examples",
    "v": "version",
}
EXPECTED_COMMAND_ALIAS_COMMANDS = (
    ("i", "--help"),
    ("upgrade", "--help"),
    ("u", "--help"),
    ("remove", "--help"),
    ("rm", "--help"),
    ("s", "--help"),
    ("ls", "--help"),
    ("find", "--help"),
    ("cat", "--help"),
    ("recommend", "--help"),
    ("lint", "--help"),
    ("a", "--help"),
    ("diag", "--help"),
    ("example", "--help"),
    ("ex", "--help"),
    ("v", "--help"),
    ("--version",),
    ("-v",),
    ("--help",),
    ("-h",),
)
EXPECTED_UNKNOWN_COMMAND = "docter"
EXPECTED_UNKNOWN_COMMAND_SUGGESTION = "doctor"
EXPECTED_UNKNOWN_HELP_TOPIC = "serach"
EXPECTED_UNKNOWN_HELP_TOPIC_SUGGESTION = "search"
EXPECTED_UNKNOWN_LIST_DOMAIN = "skillz"
EXPECTED_UNKNOWN_LIST_DOMAIN_SUGGESTION = "skills"
EXPECTED_ERROR_PREFIX = "\u2717"
EXPECTED_CORPUS_SEARCH_QUERY = "Pretendard"
EXPECTED_CORPUS_SEARCH_HIT = "knowledge/PRINCIPLES.md"
EXPECTED_CORPUS_SEARCH_PREVIEW = "Pretendard for Korean primary"
EXPECTED_CORPUS_SHOW_TARGET = "knowledge/PRINCIPLES.md:1"
EXPECTED_CORPUS_SHOW_REL_PATH = "knowledge/PRINCIPLES.md"
EXPECTED_CORPUS_SHOW_TEXT = "<!-- hand-written -->"
EXPECTED_EXAMPLES_ROUTE = "component-spec"
EXPECTED_EXAMPLES_EFFECTIVE_QUERY = "component"
EXPECTED_EXAMPLES_HIT = "examples/component-button.md"
EXPECTED_EXAMPLES_CATEGORY = "component"
EXPECTED_EXAMPLES_TITLE_FRAGMENT = "Button"


def format_cmd(cmd: list[str]) -> str:
    return shlex.join(cmd)


def assert_no_ansi(output: str, cmd: list[str]) -> None:
    if ANSI_ESCAPE_RE.search(output):
        raise SystemExit(f"NO_COLOR command emitted ANSI escape sequence: {format_cmd(cmd)}")


def passing_unknown_command_output() -> str:
    return "\n".join([
        f"Unknown command: {EXPECTED_UNKNOWN_COMMAND}",
        f"Did you mean `design-ai {EXPECTED_UNKNOWN_COMMAND_SUGGESTION}`?",
        "Run `design-ai help` for usage.",
    ])


def passing_unknown_help_topic_output() -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Unknown help topic: {EXPECTED_UNKNOWN_HELP_TOPIC}",
        f"Did you mean `design-ai help {EXPECTED_UNKNOWN_HELP_TOPIC_SUGGESTION}`?",
        "Run `design-ai help` to list available commands.",
    ])


def passing_unknown_list_domain_output() -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Unknown domain: {EXPECTED_UNKNOWN_LIST_DOMAIN}",
        "domain expects one of: skills, commands, agents",
        f"Received: {EXPECTED_UNKNOWN_LIST_DOMAIN}",
        f"Did you mean `{EXPECTED_UNKNOWN_LIST_DOMAIN_SUGGESTION}`?",
    ])


def assert_unknown_command_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown command after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_command_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown command after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_unknown_help_topic_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown help topic after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_help_topic_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown help topic after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_unknown_list_domain_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown list domain after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_list_domain_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown list domain after {context} missing expected output: {' | '.join(missing)}"
        )


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


def passing_search_json() -> str:
    return json.dumps({
        "query": EXPECTED_CORPUS_SEARCH_QUERY,
        "hits": [
            {
                "relPath": EXPECTED_CORPUS_SEARCH_HIT,
                "lineNumber": 29,
                "preview": EXPECTED_CORPUS_SEARCH_PREVIEW,
            }
        ],
    })


def passing_show_json() -> str:
    return json.dumps({
        "relPath": EXPECTED_CORPUS_SHOW_REL_PATH,
        "start": 1,
        "end": 1,
        "totalLines": 109,
        "lines": [
            {"number": 1, "text": EXPECTED_CORPUS_SHOW_TEXT},
        ],
    })


def passing_examples_json() -> str:
    return json.dumps({
        "query": "",
        "routeId": EXPECTED_EXAMPLES_ROUTE,
        "effectiveQuery": EXPECTED_EXAMPLES_EFFECTIVE_QUERY,
        "examples": [
            {
                "relPath": EXPECTED_EXAMPLES_HIT,
                "title": "`Button` - spec",
                "category": EXPECTED_EXAMPLES_CATEGORY,
                "score": 57,
                "preview": "Status: example artifact for component-spec-writer skill",
            }
        ],
    })


def assert_search_json_contains_hit(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse search JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"search JSON after {context} is not an object")

    if payload.get("query") != EXPECTED_CORPUS_SEARCH_QUERY:
        raise SystemExit(f"search JSON after {context} query differs from expected query")

    hits = payload.get("hits")
    if not isinstance(hits, list) or not hits:
        raise SystemExit(f"search JSON after {context} does not contain any hits")

    for hit in hits:
        if not isinstance(hit, dict):
            continue
        if hit.get("relPath") != EXPECTED_CORPUS_SEARCH_HIT:
            continue
        preview = hit.get("preview")
        line_number = hit.get("lineNumber")
        if not isinstance(line_number, int) or line_number < 1:
            raise SystemExit(f"search JSON after {context} has invalid line number for expected hit")
        if not isinstance(preview, str) or EXPECTED_CORPUS_SEARCH_PREVIEW not in preview:
            raise SystemExit(f"search JSON after {context} has invalid preview for expected hit")
        return

    raise SystemExit(
        f"search JSON after {context} is missing expected hit: {EXPECTED_CORPUS_SEARCH_HIT}"
    )


def assert_show_json_line(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse show JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"show JSON after {context} is not an object")

    if payload.get("relPath") != EXPECTED_CORPUS_SHOW_REL_PATH:
        raise SystemExit(f"show JSON after {context} relPath differs from expected path")

    if payload.get("start") != 1 or payload.get("end") != 1:
        raise SystemExit(f"show JSON after {context} range differs from expected line")

    lines = payload.get("lines")
    if not isinstance(lines, list) or len(lines) != 1:
        raise SystemExit(f"show JSON after {context} does not contain exactly one line")

    line = lines[0]
    if not isinstance(line, dict):
        raise SystemExit(f"show JSON after {context} contains an invalid line entry")

    if line.get("number") != 1 or line.get("text") != EXPECTED_CORPUS_SHOW_TEXT:
        raise SystemExit(f"show JSON after {context} line content differs from expected content")


def assert_examples_json_route_hit(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse examples JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"examples JSON after {context} is not an object")

    if payload.get("routeId") != EXPECTED_EXAMPLES_ROUTE:
        raise SystemExit(f"examples JSON after {context} routeId differs from expected route")

    effective_query = payload.get("effectiveQuery")
    if not isinstance(effective_query, str) or EXPECTED_EXAMPLES_EFFECTIVE_QUERY not in effective_query:
        raise SystemExit(f"examples JSON after {context} effectiveQuery differs from expected query")

    examples = payload.get("examples")
    if not isinstance(examples, list) or not examples:
        raise SystemExit(f"examples JSON after {context} does not contain any examples")

    first = examples[0]
    if not isinstance(first, dict):
        raise SystemExit(f"examples JSON after {context} contains an invalid example entry")

    if first.get("relPath") != EXPECTED_EXAMPLES_HIT:
        raise SystemExit(f"examples JSON after {context} first example differs from expected hit")

    if first.get("category") != EXPECTED_EXAMPLES_CATEGORY:
        raise SystemExit(f"examples JSON after {context} category differs from expected category")

    title = first.get("title")
    if not isinstance(title, str) or EXPECTED_EXAMPLES_TITLE_FRAGMENT not in title:
        raise SystemExit(f"examples JSON after {context} title differs from expected title")

    score = first.get("score")
    if not isinstance(score, int) or score <= 0:
        raise SystemExit(f"examples JSON after {context} score is not a positive integer")


def passing_help_catalog_json() -> str:
    return json.dumps({
        "usage": EXPECTED_HELP_USAGE,
        "topics": [
            {
                "topic": topic,
                "usage": f"design-ai {topic}",
                "description": f"{topic} help topic",
                "aliases": [
                    alias
                    for alias, target in EXPECTED_HELP_ALIASES.items()
                    if target == topic
                ],
            }
            for topic in EXPECTED_HELP_TOPICS
        ],
        "aliases": EXPECTED_HELP_ALIASES,
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

    raw_aliases = catalog.get("aliases")
    if not isinstance(raw_aliases, dict):
        raise SystemExit(f"help JSON after {context} does not contain an aliases object")

    raw_usage = catalog.get("usage")
    if raw_usage != EXPECTED_HELP_USAGE:
        raise SystemExit(f"help JSON after {context} usage differs from expected usage")

    if raw_aliases != EXPECTED_HELP_ALIASES:
        raise SystemExit(f"help JSON after {context} aliases differ from expected aliases")

    topics: list[str] = []
    topic_aliases: dict[str, str] = {}
    for item in raw_topics:
        topic = item.get("topic") if isinstance(item, dict) else None
        if not isinstance(topic, str) or not topic:
            raise SystemExit(f"help JSON after {context} contains an invalid topic entry")
        usage = item.get("usage")
        if not isinstance(usage, str) or not usage:
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid usage")
        description = item.get("description")
        if not isinstance(description, str) or not description:
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid description")
        aliases = item.get("aliases")
        if not isinstance(aliases, list) or not all(isinstance(alias, str) and alias for alias in aliases):
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid aliases")
        for alias in aliases:
            if raw_aliases.get(alias) != topic:
                raise SystemExit(
                    f"help JSON after {context} alias {alias} does not map to topic {topic}"
                )
            if alias in topic_aliases:
                raise SystemExit(f"help JSON after {context} contains duplicate alias: {alias}")
            topic_aliases[alias] = topic
        topics.append(topic)

    if len(set(topics)) != len(topics):
        raise SystemExit(f"help JSON after {context} contains duplicate topics")

    missing_expected = [topic for topic in EXPECTED_HELP_TOPICS if topic not in topics]
    if missing_expected:
        raise SystemExit(
            f"help JSON after {context} is missing expected topic(s): {', '.join(missing_expected)}"
        )

    unexpected_topics = [topic for topic in topics if topic not in EXPECTED_HELP_TOPICS]
    if unexpected_topics:
        raise SystemExit(
            f"help JSON after {context} contains unexpected topic(s): {', '.join(unexpected_topics)}"
        )

    if topics != list(EXPECTED_HELP_TOPICS):
        raise SystemExit(f"help JSON after {context} topic order differs from expected order")

    if topic_aliases != EXPECTED_HELP_ALIASES:
        raise SystemExit(f"help JSON after {context} topic aliases differ from expected aliases")

    return topics


def help_topic_script(topics: list[str]) -> str:
    if not topics:
        raise SystemExit("help topic script requires at least one topic")
    return " && ".join(f"design-ai help {shlex.quote(topic)}" for topic in topics)


def help_alias_script() -> str:
    return help_topic_script(list(EXPECTED_HELP_ALIASES))


def design_ai_command_script(commands: list[tuple[str, ...]] | tuple[tuple[str, ...], ...]) -> str:
    if not commands:
        raise SystemExit("design-ai command script requires at least one command")
    rendered = []
    for command in commands:
        if not command or not all(isinstance(part, str) and part for part in command):
            raise SystemExit("design-ai command script contains an invalid command")
        rendered.append(" ".join(shlex.quote(part) for part in ("design-ai", *command)))
    return " && ".join(rendered)


def command_alias_script() -> str:
    return design_ai_command_script(EXPECTED_COMMAND_ALIAS_COMMANDS)


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
    assert_unknown_command_failure(
        passing_unknown_command_output(),
        returncode=1,
        context=context,
        cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
    )
    expect_self_test_failure(
        lambda: assert_unknown_command_failure(
            passing_unknown_command_output(),
            returncode=0,
            context=context,
            cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_command_failure(
            f"Unknown command: {EXPECTED_UNKNOWN_COMMAND}",
            returncode=1,
            context=context,
            cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_command_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_unknown_help_topic_failure(
        passing_unknown_help_topic_output(),
        returncode=1,
        context=context,
        cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
    )
    expect_self_test_failure(
        lambda: assert_unknown_help_topic_failure(
            passing_unknown_help_topic_output(),
            returncode=0,
            context=context,
            cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_help_topic_failure(
            f"{EXPECTED_ERROR_PREFIX} Unknown help topic: {EXPECTED_UNKNOWN_HELP_TOPIC}",
            returncode=1,
            context=context,
            cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_help_topic_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_unknown_list_domain_failure(
        passing_unknown_list_domain_output(),
        returncode=1,
        context=context,
        cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
    )
    expect_self_test_failure(
        lambda: assert_unknown_list_domain_failure(
            passing_unknown_list_domain_output(),
            returncode=0,
            context=context,
            cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_list_domain_failure(
            f"{EXPECTED_ERROR_PREFIX} Unknown domain: {EXPECTED_UNKNOWN_LIST_DOMAIN}",
            returncode=1,
            context=context,
            cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_list_domain_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
        ),
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

    search_cmd = ["design-ai", "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"]
    assert_search_json_contains_hit(passing_search_json(), context=context, cmd=search_cmd)
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit("{", context=context, cmd=search_cmd),
        expected="failed to parse search JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps([]), context=context, cmd=search_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    search_wrong_query = json.loads(passing_search_json())
    search_wrong_query["query"] = "Inter"
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_wrong_query), context=context, cmd=search_cmd),
        expected="query differs",
        scope="smoke assertions",
    )
    search_missing_hit = json.loads(passing_search_json())
    search_missing_hit["hits"] = []
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_missing_hit), context=context, cmd=search_cmd),
        expected="does not contain any hits",
        scope="smoke assertions",
    )
    search_invalid_preview = json.loads(passing_search_json())
    search_invalid_preview["hits"][0]["preview"] = "Korean font"
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_invalid_preview), context=context, cmd=search_cmd),
        expected="invalid preview",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit("\x1b[31m{}", context=context, cmd=search_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    show_cmd = ["design-ai", "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"]
    assert_show_json_line(passing_show_json(), context=context, cmd=show_cmd)
    expect_self_test_failure(
        lambda: assert_show_json_line("{", context=context, cmd=show_cmd),
        expected="failed to parse show JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps([]), context=context, cmd=show_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    show_wrong_path = json.loads(passing_show_json())
    show_wrong_path["relPath"] = "knowledge/WRONG.md"
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps(show_wrong_path), context=context, cmd=show_cmd),
        expected="relPath differs",
        scope="smoke assertions",
    )
    show_wrong_line = json.loads(passing_show_json())
    show_wrong_line["lines"][0]["text"] = "# Design-AI principles"
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps(show_wrong_line), context=context, cmd=show_cmd),
        expected="line content differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_json_line("\x1b[31m{}", context=context, cmd=show_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    examples_cmd = ["design-ai", "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1", "--json"]
    assert_examples_json_route_hit(passing_examples_json(), context=context, cmd=examples_cmd)
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit("{", context=context, cmd=examples_cmd),
        expected="failed to parse examples JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps([]), context=context, cmd=examples_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    examples_wrong_route = json.loads(passing_examples_json())
    examples_wrong_route["routeId"] = "design-review"
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_wrong_route), context=context, cmd=examples_cmd),
        expected="routeId differs",
        scope="smoke assertions",
    )
    examples_empty = json.loads(passing_examples_json())
    examples_empty["examples"] = []
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_empty), context=context, cmd=examples_cmd),
        expected="does not contain any examples",
        scope="smoke assertions",
    )
    examples_wrong_hit = json.loads(passing_examples_json())
    examples_wrong_hit["examples"][0]["relPath"] = "examples/component-accordion.md"
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_wrong_hit), context=context, cmd=examples_cmd),
        expected="first example differs",
        scope="smoke assertions",
    )
    examples_bad_score = json.loads(passing_examples_json())
    examples_bad_score["examples"][0]["score"] = 0
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_bad_score), context=context, cmd=examples_cmd),
        expected="score is not a positive integer",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit("\x1b[31m{}", context=context, cmd=examples_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    assert parse_help_topics(
        passing_help_catalog_json(),
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
            json.dumps({"topics": []}),
            context=context,
            cmd=help_cmd,
        ),
        expected="aliases object",
        scope="smoke assertions",
    )
    invalid_root_usage_catalog = json.loads(passing_help_catalog_json())
    invalid_root_usage_catalog["usage"] = "design-ai help"
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(invalid_root_usage_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="usage differs",
        scope="smoke assertions",
    )
    invalid_usage_catalog = json.loads(passing_help_catalog_json())
    invalid_usage_catalog["topics"][0]["usage"] = ""
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(invalid_usage_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="invalid usage",
        scope="smoke assertions",
    )
    invalid_alias_catalog = json.loads(passing_help_catalog_json())
    invalid_alias_catalog["aliases"]["i"] = "route"
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(invalid_alias_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="aliases differ",
        scope="smoke assertions",
    )
    missing_topic_alias_catalog = json.loads(passing_help_catalog_json())
    missing_topic_alias_catalog["topics"][0]["aliases"] = []
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(missing_topic_alias_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="topic aliases differ",
        scope="smoke assertions",
    )
    alias_mapping_catalog = json.loads(passing_help_catalog_json())
    alias_mapping_catalog["topics"][0]["aliases"].append("find")
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(alias_mapping_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="does not map",
        scope="smoke assertions",
    )
    missing_topic_catalog = json.loads(passing_help_catalog_json())
    missing_topic_catalog["topics"] = [
        topic
        for topic in missing_topic_catalog["topics"]
        if topic["topic"] != "pack"
    ]
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(missing_topic_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="missing expected topic",
        scope="smoke assertions",
    )
    unexpected_topic_catalog = json.loads(passing_help_catalog_json())
    unexpected_topic_catalog["topics"].append({
        "topic": "new-topic",
        "usage": "design-ai new-topic",
        "description": "new-topic help topic",
        "aliases": [],
    })
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(unexpected_topic_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="unexpected topic",
        scope="smoke assertions",
    )
    reordered_topic_catalog = json.loads(passing_help_catalog_json())
    reordered_topic_catalog["topics"][0], reordered_topic_catalog["topics"][1] = (
        reordered_topic_catalog["topics"][1],
        reordered_topic_catalog["topics"][0],
    )
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(reordered_topic_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="topic order differs",
        scope="smoke assertions",
    )
    duplicate_topic_catalog = json.loads(passing_help_catalog_json())
    duplicate_topic_catalog["topics"].append(duplicate_topic_catalog["topics"][-1])
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(duplicate_topic_catalog),
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
    assert help_alias_script() == (
        "design-ai help i && "
        "design-ai help upgrade && "
        "design-ai help u && "
        "design-ai help remove && "
        "design-ai help rm && "
        "design-ai help s && "
        "design-ai help ls && "
        "design-ai help find && "
        "design-ai help cat && "
        "design-ai help recommend && "
        "design-ai help lint && "
        "design-ai help a && "
        "design-ai help diag && "
        "design-ai help example && "
        "design-ai help ex && "
        "design-ai help v"
    )
    assert design_ai_command_script([("find", "route topic"), ("cat", "knowledge/PRINCIPLES.md:1")]) == (
        "design-ai find 'route topic' && design-ai cat knowledge/PRINCIPLES.md:1"
    )
    expect_self_test_failure(
        lambda: design_ai_command_script([]),
        expected="requires at least one command",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: design_ai_command_script([("",)]),
        expected="invalid command",
        scope="smoke assertions",
    )
    assert command_alias_script() == (
        "design-ai i --help && "
        "design-ai upgrade --help && "
        "design-ai u --help && "
        "design-ai remove --help && "
        "design-ai rm --help && "
        "design-ai s --help && "
        "design-ai ls --help && "
        "design-ai find --help && "
        "design-ai cat --help && "
        "design-ai recommend --help && "
        "design-ai lint --help && "
        "design-ai a --help && "
        "design-ai diag --help && "
        "design-ai example --help && "
        "design-ai ex --help && "
        "design-ai v --help && "
        "design-ai --version && "
        "design-ai -v && "
        "design-ai --help && "
        "design-ai -h"
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
