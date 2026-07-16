#!/usr/bin/env python3
"""Validate the P16 external-pilot operating boundary."""

from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OPERATIONS = ROOT / "docs" / "EXTERNAL-PILOT-OPERATIONS.md"
INVITATION = ROOT / "docs" / "pilots" / "external" / "direct-invitation-ko.md"
HYPOTHESIS = ROOT / "docs" / "pilots" / "external" / "hypothesis-template.md"
STATUS = ROOT / "docs" / "pilots" / "external" / "recruitment-status.md"
PROGRAM = ROOT / "docs" / "pilots" / "external" / "program.json"

PROGRAM_SHA256 = "9ca6d1421c25c30c89fc8dae84752d42770f8e78ed4a41a1df4e071da09b5338"
FORM_URL = "https://github.com/sungjin9288/design-ai/issues/new?template=external-pilot.yml"

LIFECYCLE_LABELS = [
    "pilot:reviewing",
    "pilot:consent-pending",
    "pilot:running",
    "pilot:evidence-complete",
    "pilot:closed-no-pilot",
]
HYPOTHESIS_KEYS = [
    "brief-direction-lock",
    "brand-system-grounding",
    "project-history-continuity",
    "runtime-deliverable-truth",
    "motion-quality-planning",
    "korean-product-pattern-fit",
    "other",
]
CAPABILITY_PHRASES = [
    "question-led brief and explicit visual-direction lock",
    "`DESIGN.md` input and validation",
    "project-level snapshots and comparison",
    "preview and deliverable-completion evidence",
    "motion audit findings to an executable plan",
    "Korean pack and knowledge",
]
COUNT_ROWS = [
    "Private invitations sent",
    "Day 7 reminders sent",
    "Candidate issues submitted",
    "Candidates under review",
    "Consent pending",
    "Pilots running",
    "Evidence-complete pilots",
    "Closed without a pilot",
]
RECRUITMENT_STATES = {
    "direct-outreach-not-started",
    "direct-outreach-active",
    "public-recruitment-active",
    "pilot-active",
    "evidence-collection",
    "external-participation-blocked",
}


def require_text(source: str, required: list[str], field: str) -> None:
    for text in required:
        if text not in source:
            raise ValueError(f"{field} is missing required text: {text}")


def validate_operations(source: str) -> None:
    require_text(
        source,
        [
            "@design-ai/cli@5.1.0",
            "exactly one lifecycle label",
            "Day 7",
            "Day 14",
            "Day 28",
            "390x844",
            "1440x900",
            "keyboard order",
            "visible focus",
            "reduced motion",
            "horizontal overflow",
            "authority is unclear",
            "scope is larger than one page or flow",
            "a safe preview is",
            "sensitive data appears",
            "dependency or migration work is required",
            "Only a complete, approved record can move the issue",
            "review-pilot",
            "review-compare",
            "improved`, `unchanged`, and `blocked",
            "Two records from one owner",
            "add no new capability",
            *LIFECYCLE_LABELS,
            *HYPOTHESIS_KEYS,
            *CAPABILITY_PHRASES,
        ],
        "operations guide",
    )


def invitation_section(source: str, heading: str, next_heading: str) -> str:
    start = source.find(heading)
    end = source.find(next_heading, start + len(heading))
    if start < 0 or end < 0:
        raise ValueError(f"direct invitation is missing section: {heading}")
    return source[start:end]


def validate_invitation(source: str) -> None:
    day_zero = invitation_section(source, "## Day 0 초대", "## Day 7 한 번의 알림")
    require_text(
        day_zero,
        [
            "<프로젝트명 또는 최근 작업을 언급하는 개인화 문장 한 줄>",
            "실제 CTA 또는 핵심 흐름 하나",
            "폼 제출은 후보 접수일 뿐 작업 동의가 아닙니다",
            FORM_URL,
        ],
        "Day 0 invitation",
    )
    urls = re.findall(r"https://[^\s)>]+", day_zero)
    if urls != [FORM_URL]:
        raise ValueError("Day 0 invitation must contain only the existing Issue Form link")
    require_text(
        source,
        [
            "## Day 7 한 번의 알림",
            "이후에는 같은 대상자에게 다시 알리지 않는다",
            "## Day 14 공개 모집 전환",
            "공개 전환 뒤 14일 동안에도 후보가 없으면 모집을 중단",
        ],
        "direct invitation",
    )


def validate_hypothesis(source: str) -> None:
    require_text(
        source,
        [
            "Pilot evidence reference and SHA-256",
            "Owner-approved feedback reference",
            "Source finding reference",
            "Select exactly one fixed key",
            "Two completed records from distinct project owners are required",
            "Only one follow-up may be selected",
            *HYPOTHESIS_KEYS,
        ],
        "hypothesis template",
    )


def status_counts(source: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for label in COUNT_ROWS:
        match = re.search(rf"^\| {re.escape(label)} \| (\d+) \|$", source, re.MULTILINE)
        if not match:
            raise ValueError(f"recruitment status is missing aggregate row: {label}")
        counts[label] = int(match.group(1))
    return counts


def validate_status(source: str) -> None:
    require_text(
        source,
        [
            "Priority segment: `marketing-site`",
            PROGRAM_SHA256,
            "aggregate operating state only",
            "exactly one P16 lifecycle label",
        ],
        "recruitment status",
    )
    state_match = re.search(r"^- State: `([^`]+)`$", source, re.MULTILINE)
    if not state_match or state_match.group(1) not in RECRUITMENT_STATES:
        raise ValueError("recruitment status must use one known aggregate state")
    if re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", source, re.IGNORECASE):
        raise ValueError("recruitment status must not contain an email address")
    if re.search(r"\b01[016789][ -]?\d{3,4}[ -]?\d{4}\b", source):
        raise ValueError("recruitment status must not contain a phone number")
    counts = status_counts(source)
    if state_match.group(1) == "direct-outreach-not-started" and any(counts.values()):
        raise ValueError("not-started recruitment status must keep every aggregate count at zero")


def validate_program(source: bytes) -> None:
    digest = hashlib.sha256(source).hexdigest()
    if digest != PROGRAM_SHA256:
        raise ValueError(
            "program.json must remain the byte-identical three-slot, zero-participant baseline"
        )


def validate_all() -> None:
    validate_operations(OPERATIONS.read_text(encoding="utf-8"))
    validate_invitation(INVITATION.read_text(encoding="utf-8"))
    validate_hypothesis(HYPOTHESIS.read_text(encoding="utf-8"))
    validate_status(STATUS.read_text(encoding="utf-8"))
    validate_program(PROGRAM.read_bytes())


def assert_rejected(callback, message: str) -> None:
    try:
        callback()
    except ValueError:
        return
    raise AssertionError(message)


def run_self_test() -> None:
    validate_all()

    operations = OPERATIONS.read_text(encoding="utf-8")
    assert_rejected(
        lambda: validate_operations(operations.replace("pilot:consent-pending", "pilot:pending")),
        "self-test accepted a missing lifecycle label",
    )
    assert_rejected(
        lambda: validate_operations(operations.replace("Two records from one owner", "One owner record")),
        "self-test accepted a weakened distinct-owner rule",
    )
    assert_rejected(
        lambda: validate_operations(
            operations.replace("Only a complete, approved record can move the issue", "A record moves the issue")
        ),
        "self-test accepted pilot execution without complete consent",
    )

    invitation = INVITATION.read_text(encoding="utf-8")
    assert_rejected(
        lambda: validate_invitation(invitation.replace(FORM_URL, "https://example.com/apply", 1)),
        "self-test accepted a different Day 0 intake link",
    )

    status = STATUS.read_text(encoding="utf-8")
    active_status = status.replace(
        "State: `direct-outreach-not-started`",
        "State: `direct-outreach-active`",
    ).replace("| Private invitations sent | 0 |", "| Private invitations sent | 1 |")
    validate_status(active_status)
    assert_rejected(
        lambda: validate_status(status + "\nCandidate email: owner@example.com\n"),
        "self-test accepted personal contact data in aggregate status",
    )
    assert_rejected(
        lambda: validate_status(status.replace("| Private invitations sent | 0 |", "| Private invitations sent | 1 |")),
        "self-test accepted activity before Day 0 started",
    )

    program = PROGRAM.read_bytes()
    assert_rejected(
        lambda: validate_program(program + b"\n"),
        "self-test accepted drift in the immutable program baseline",
    )
    print("External pilot operations self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    validate_all()
    print(
        "External pilot operations check passed: marketing-first, consent-gated, "
        "aggregate-only, repeated-problem decision rule preserved"
    )


if __name__ == "__main__":
    main()
