#!/usr/bin/env python3
"""Fail when non-allowlisted examples use raw hex colors.

Most component examples should reference semantic token aliases such as
`--color-primary-default`. Raw hex is allowed only for fixtures that explicitly
teach palette/token formats, brand colors, chart conventions, email markup, or
color-input behavior.

Usage:
  python3 tools/audit/raw-hex-check.py
  python3 tools/audit/raw-hex-check.py --json
  python3 tools/audit/raw-hex-check.py --self-test
"""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Mapping

ROOT = Path(__file__).resolve().parents[2]

# Match CSS-style 3, 6, and 8 digit hex colors while avoiding order numbers
# (`#1234`) and CSS/hash anchors (`#add-button`).
HEX_COLOR_RE = re.compile(
    r"(?<![\w-])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(?![0-9A-Za-z_-])"
)
ALLOW_MARKERS = ("design-ai-raw-hex-ok", "raw-hex-ok")

ALLOWED_RAW_HEX_FILES: dict[str, str] = {
    "examples/README.md": "Index documents a palette seed example.",
    "examples/cases/dogfood-v4-korean-hr-onboarding.md": "Dogfood fixture includes generated primitive color ramps.",
    "examples/component-account-card.md": "Payment/bank brand colors are literal brand references.",
    "examples/component-avatar.md": "Avatar color hashing example demonstrates a fixed fallback palette.",
    "examples/component-color-picker.md": "Color picker component intentionally exposes a HEX input.",
    "examples/component-email-layout.md": "Email markup requires inline-compatible color examples.",
    "examples/component-game-hud.md": "HUD example includes engine color props.",
    "examples/component-loading-sequence.md": "Splash/loading brand fixture uses a literal brand color.",
    "examples/component-payment-brand-button.md": "Payment provider brand colors are literal brand references.",
    "examples/component-payment-method-selector.md": "Payment provider brand colors are literal brand references.",
    "examples/component-qr-code.md": "QR libraries expose foreground/background color props.",
    "examples/component-stock-chart.md": "Stock chart example documents market-specific color tokens.",
    "examples/doc-explanation-example.md": "Token-format explanation demonstrates primitive token values.",
    "examples/doc-tutorial-example.md": "Tutorial prompt includes a palette seed value.",
    "examples/dogfood-korean-fintech-system.md": "Dogfood design-system output includes primitive and semantic token values.",
    "examples/email-transactional-example.md": "Email clients require inline-compatible color examples.",
    "examples/palette-saas-violet.md": "Palette artifact is the canonical primitive-token example.",
    "examples/slide-deck-example.md": "Slide example illustrates hardcoded-hex drift in design handoff.",
}


@dataclass(frozen=True)
class RawHexFinding:
    path: str
    line: int
    value: str
    text: str


@dataclass(frozen=True)
class RawHexSummary:
    files_scanned: int
    findings: tuple[RawHexFinding, ...]
    allowed_hits_by_path: dict[str, int]
    missing_allowlist_paths: tuple[str, ...]

    @property
    def failed(self) -> bool:
        return bool(self.findings or self.missing_allowlist_paths)


def line_has_allow_marker(line: str) -> bool:
    return any(marker in line for marker in ALLOW_MARKERS)


def scan_document(
    *,
    rel_path: str,
    text: str,
    allowed_files: Mapping[str, str] = ALLOWED_RAW_HEX_FILES,
) -> tuple[list[RawHexFinding], int]:
    findings: list[RawHexFinding] = []
    allowed_hits = 0
    is_allowed_file = rel_path in allowed_files

    for line_number, line in enumerate(text.splitlines(), start=1):
        if line_has_allow_marker(line):
            continue

        matches = [match.group(0) for match in HEX_COLOR_RE.finditer(line)]
        if is_allowed_file:
            allowed_hits += len(matches)
            continue

        for value in matches:
            findings.append(
                RawHexFinding(
                    path=rel_path,
                    line=line_number,
                    value=value,
                    text=line.strip(),
                )
            )

    return findings, allowed_hits


def iter_example_markdown_files(root: Path) -> list[Path]:
    examples_dir = root / "examples"
    if not examples_dir.is_dir():
        raise SystemExit(f"examples directory not found: {examples_dir}")
    return sorted(path for path in examples_dir.rglob("*.md") if path.is_file())


def scan_examples(
    *,
    root: Path = ROOT,
    allowed_files: Mapping[str, str] = ALLOWED_RAW_HEX_FILES,
) -> RawHexSummary:
    files = iter_example_markdown_files(root)
    findings: list[RawHexFinding] = []
    allowed_hits_by_path: dict[str, int] = {}

    for file_path in files:
        rel_path = file_path.relative_to(root).as_posix()
        file_findings, allowed_hits = scan_document(
            rel_path=rel_path,
            text=file_path.read_text(encoding="utf-8"),
            allowed_files=allowed_files,
        )
        findings.extend(file_findings)
        if allowed_hits:
            allowed_hits_by_path[rel_path] = allowed_hits

    missing_allowlist_paths = tuple(
        sorted(path for path in allowed_files if not (root / path).is_file())
    )

    return RawHexSummary(
        files_scanned=len(files),
        findings=tuple(findings),
        allowed_hits_by_path=allowed_hits_by_path,
        missing_allowlist_paths=missing_allowlist_paths,
    )


def assert_condition(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"raw hex self-test failed: {message}")


def run_self_test() -> int:
    normal_findings, normal_allowed = scan_document(
        rel_path="examples/component-button.md",
        text="Use `--color-primary-default`, not `#7C3AED`.",
        allowed_files={},
    )
    assert_condition(len(normal_findings) == 1, "non-allowlisted hex should be reported")
    assert_condition(normal_findings[0].value == "#7C3AED", "reported value should preserve the hex color")
    assert_condition(normal_allowed == 0, "non-allowlisted files should not count allowed hits")

    allowed_findings, allowed_hits = scan_document(
        rel_path="examples/palette-saas-violet.md",
        text='{"value": "#7C3AED"}',
        allowed_files={"examples/palette-saas-violet.md": "fixture"},
    )
    assert_condition(allowed_findings == [], "allowlisted files should not report findings")
    assert_condition(allowed_hits == 1, "allowlisted files should count raw hex hits")

    marker_findings, _ = scan_document(
        rel_path="examples/component-button.md",
        text="`#7C3AED` <!-- design-ai-raw-hex-ok: fixture -->",
        allowed_files={},
    )
    assert_condition(marker_findings == [], "line-level marker should suppress a justified exception")

    false_positive_findings, _ = scan_document(
        rel_path="examples/component-timeline.md",
        text='target: "#add-button"\norder: #1234\nreceipt: #1234567',
        allowed_files={},
    )
    assert_condition(false_positive_findings == [], "anchors and order numbers should not be treated as colors")

    three_digit_findings, _ = scan_document(
        rel_path="examples/component-button.md",
        text="Legacy shorthand #fff should still be caught.",
        allowed_files={},
    )
    assert_condition(three_digit_findings[0].value == "#fff", "3-digit CSS hex should be caught")

    print("Raw hex self-test passed")
    return 0


def summary_to_json(summary: RawHexSummary) -> str:
    payload = {
        **asdict(summary),
        "finding_count": len(summary.findings),
        "allowed_file_count": len(summary.allowed_hits_by_path),
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def print_human_summary(summary: RawHexSummary) -> None:
    if not summary.failed:
        print(
            "Raw hex check passed: "
            f"{summary.files_scanned} example file(s) scanned; "
            f"{len(summary.allowed_hits_by_path)} intentional fixture file(s) carry raw hex."
        )
        return

    print("Raw hex check failed:")
    if summary.missing_allowlist_paths:
        print("- Allowlist references missing example file(s):")
        for path in summary.missing_allowlist_paths:
            print(f"  - {path}")

    if summary.findings:
        print(
            "- Non-allowlisted examples contain raw hex color(s). "
            "Use semantic token aliases, or add a line-level design-ai-raw-hex-ok marker with justification."
        )
        for finding in summary.findings[:50]:
            print(f"  - {finding.path}:{finding.line}: {finding.value} in {finding.text}")
        remaining = len(summary.findings) - 50
        if remaining > 0:
            print(f"  - ... {remaining} more finding(s)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print machine-readable summary")
    parser.add_argument("--self-test", action="store_true", help="Run local fixture checks")
    args = parser.parse_args()

    if args.self_test:
        return run_self_test()

    summary = scan_examples()
    if args.json:
        print(summary_to_json(summary))
    else:
        print_human_summary(summary)

    return 1 if summary.failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
