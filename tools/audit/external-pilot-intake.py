#!/usr/bin/env python3
"""Validate the public external-pilot GitHub Issue Form."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_FORM = ROOT / ".github" / "ISSUE_TEMPLATE" / "external-pilot.yml"
DEFAULT_CONFIG = ROOT / ".github" / "ISSUE_TEMPLATE" / "config.yml"

EXPECTED_FIELD_IDS = [
    "pilot-segment",
    "project-role",
    "owner-authority",
    "target-scope",
    "public-reference",
    "target-visibility",
    "verification-surface",
    "improvement-goal",
    "data-boundary",
    "execution-boundary",
]
EXPECTED_TYPES = [
    "dropdown",
    "input",
    "checkboxes",
    "textarea",
    "input",
    "dropdown",
    "dropdown",
    "textarea",
    "checkboxes",
    "checkboxes",
]
REQUIRED_TEXT = [
    "intake signal, not consent",
    "separate owner-consent record",
    "Marketing site",
    "App workflow",
    "Korean commerce or fintech",
    "source inspection or target mutation",
    "Dependency changes, migrations, commit, push, deployment, and external writes",
]
PROHIBITED_REQUESTS = [
    "label: Email",
    "label: Phone",
    "label: Legal name",
    "label: Local path",
    "label: Access token",
    "label: Customer data",
    "label: Analytics export",
    "label: Private source",
]


def validate_yaml_when_available(source: str, field: str) -> None:
    try:
        import yaml
    except ModuleNotFoundError:
        return

    try:
        payload = yaml.safe_load(source)
    except yaml.YAMLError as error:
        raise ValueError(f"{field} must contain valid YAML") from error
    if not isinstance(payload, dict):
        raise ValueError(f"{field} must parse as a YAML object")


def form_fields(source: str) -> list[dict[str, str]]:
    fields: list[dict[str, str]] = []
    current: dict[str, str] | None = None

    for line in source.splitlines():
        field_type = re.fullmatch(r"  - type: ([a-z-]+)", line)
        if field_type:
            if current is not None:
                fields.append(current)
            current = {"type": field_type.group(1), "source": line}
            continue

        if current is None:
            continue
        current["source"] += f"\n{line}"
        field_id = re.fullmatch(r"    id: ([a-z0-9-]+)", line)
        if field_id:
            current["id"] = field_id.group(1)

    if current is not None:
        fields.append(current)
    return fields


def validate_form_source(source: str) -> None:
    validate_yaml_when_available(source, "issue form")
    if not source.endswith("\n"):
        raise ValueError("issue form must end with a newline")

    required_headers = [
        "name: External design pilot",
        "description: Apply for one bounded, owner-consented design-ai improvement pilot.",
        'title: "[Pilot] "',
        "  - external-pilot",
        "  - pilot:intake",
    ]
    for header in required_headers:
        if header not in source:
            raise ValueError(f"issue form is missing required header: {header}")

    fields = form_fields(source)
    if not fields or fields[0].get("type") != "markdown" or "id" in fields[0]:
        raise ValueError("issue form must begin with one boundary markdown block")

    interactive = fields[1:]
    if [field.get("id") for field in interactive] != EXPECTED_FIELD_IDS:
        raise ValueError("issue form field ids or order drifted")
    if [field.get("type") for field in interactive] != EXPECTED_TYPES:
        raise ValueError("issue form field types drifted")

    optional_ids = {"public-reference"}
    for field in interactive:
        required = "    validations:\n      required: true" in field["source"]
        if field["id"] in optional_ids and required:
            raise ValueError(f"{field['id']} must remain optional")
        if field["id"] not in optional_ids and field["type"] != "checkboxes" and not required:
            raise ValueError(f"{field['id']} must remain required")
        if field["type"] == "checkboxes" and "          required: true" not in field["source"]:
            raise ValueError(f"{field['id']} must contain required acknowledgements")

    for phrase in REQUIRED_TEXT:
        if phrase not in source:
            raise ValueError(f"issue form is missing boundary text: {phrase}")
    for request in PROHIBITED_REQUESTS:
        if request in source:
            raise ValueError(f"issue form requests prohibited public data: {request}")


def validate_config_source(source: str) -> None:
    validate_yaml_when_available(source, "issue template config")
    required_text = [
        "blank_issues_enabled: true",
        "name: External pilot program guide",
        "https://sungjin9288.github.io/design-ai/docs/EXTERNAL-PILOT-PROGRAM/",
        "Review scope, privacy, consent, measurement, and stop conditions before applying.",
    ]
    for text in required_text:
        if text not in source:
            raise ValueError(f"issue template config is missing: {text}")


def validate_form(path: Path = DEFAULT_FORM, config_path: Path = DEFAULT_CONFIG) -> None:
    validate_form_source(path.read_text(encoding="utf-8"))
    validate_config_source(config_path.read_text(encoding="utf-8"))


def run_self_test() -> None:
    source = DEFAULT_FORM.read_text(encoding="utf-8")
    validate_form_source(source)
    validate_config_source(DEFAULT_CONFIG.read_text(encoding="utf-8"))

    missing_consent = source.replace("A separate owner-consent record is required before a pilot starts.\n", "")
    try:
        validate_form_source(missing_consent)
    except ValueError:
        pass
    else:
        raise AssertionError("self-test accepted a form without separate consent")

    private_data = source.replace("label: Public project reference", "label: Local path")
    try:
        validate_form_source(private_data)
    except ValueError:
        pass
    else:
        raise AssertionError("self-test accepted a prohibited local-path request")

    optional_reference = source.replace(
        "      placeholder: https://github.com/owner/repository or https://example.com/page\n",
        "      placeholder: https://github.com/owner/repository or https://example.com/page\n"
        "    validations:\n"
        "      required: true\n",
    )
    try:
        validate_form_source(optional_reference)
    except ValueError:
        pass
    else:
        raise AssertionError("self-test accepted a required public project reference")

    print("External pilot intake form self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_FORM)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    validate_form(args.path)
    print("External pilot intake form check passed: 3 segments, 10 fields, intake-only boundary")


if __name__ == "__main__":
    main()
