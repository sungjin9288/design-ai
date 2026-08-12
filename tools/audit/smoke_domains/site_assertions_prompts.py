from __future__ import annotations

import json

from .site_contracts import (
    EXPECTED_SITE_PROMPT_TEMPLATE_IDS,
    EXPECTED_SITE_PROMPT_TEMPLATE_KEYS,
    EXPECTED_SITE_PROMPT_TEMPLATE_PAYLOAD_KEYS,
)

from .assertion_helpers import (
    assert_contains_fragments,
    assert_no_ansi,
    assert_smoke_json_keys,
)


def assert_site_prompt_markdown(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    stripped = raw.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        raise SystemExit(f"site prompt markdown after {context} looks like JSON output")
    assert_contains_fragments(
        raw,
        (
            "# Codex implementation prompt",
            "Site profile:",
            "Korean SaaS marketing site",
            "Selected task:",
            "Task ID: task-homepage-cta",
            "Clarify homepage CTA hierarchy",
            "Work in the target website repository, not in this design-ai repository.",
            "Verify desktop, tablet, and mobile layouts.",
            "lint/typecheck/build/test",
        ),
        context=context,
        label="site prompt markdown",
    )
    forbidden_fragments = (
        "# Website improvement prompt bundle",
        "## codex-repo-intake",
        "## claude-competitor",
    )
    for fragment in forbidden_fragments:
        if fragment in raw:
            raise SystemExit(f"site prompt markdown after {context} unexpectedly contains bundle fragment: {fragment}")


def assert_site_prompt_templates_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site prompt templates JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_PROMPT_TEMPLATE_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site prompt templates JSON",
    )
    if payload.get("count") != 11:
        raise SystemExit(f"site prompt templates JSON after {context} expected eleven templates")

    templates = payload.get("templates")
    if not isinstance(templates, list) or len(templates) != 11:
        raise SystemExit(f"site prompt templates JSON after {context} templates must contain eleven entries")
    ids = []
    for template in templates:
        item = assert_smoke_json_keys(
            template,
            EXPECTED_SITE_PROMPT_TEMPLATE_KEYS,
            label="templates entry",
            context=context,
            command_label="site prompt templates JSON",
        )
        ids.append(item.get("id"))
        if not isinstance(item.get("description"), str) or not item["description"]:
            raise SystemExit(f"site prompt templates JSON after {context} template description is missing")
        if type(item.get("taskSelectable")) is not bool:
            raise SystemExit(f"site prompt templates JSON after {context} taskSelectable must be boolean")

    if ids != EXPECTED_SITE_PROMPT_TEMPLATE_IDS:
        raise SystemExit(f"site prompt templates JSON after {context} template ids changed")
    implementation = templates[4]
    if implementation.get("id") != "codex-implementation" or implementation.get("taskSelectable") is not True:
        raise SystemExit(f"site prompt templates JSON after {context} codex-implementation must remain task selectable")
    if implementation.get("agent") != "codex":
        raise SystemExit(f"site prompt templates JSON after {context} codex-implementation agent changed")
