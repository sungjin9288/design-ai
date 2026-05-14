#!/usr/bin/env python3
"""Run all repository audits and produce a unified summary.

Each individual audit can still be run standalone. This wrapper is for:
- Local pre-commit runs.
- A single CI step instead of many separate commands.
- Dogfooding the RELEASE-CHECKLIST step 1.

Usage:
  python3 tools/audit/run-all.py            # warn-only mode
  python3 tools/audit/run-all.py --strict   # exit 1 if any audit fails
  python3 tools/audit/run-all.py --quiet    # only print failures + final summary

Exit codes:
  0 = all passed
  1 = at least one failure (only emitted with --strict OR if a hard error occurs)
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

ROOT = Path(__file__).resolve().parents[2]
AUDIT_DIR = ROOT / "tools" / "audit"


@dataclass(frozen=True)
class AuditSpec:
    name: str
    script: str
    strict_args: tuple[str, ...] = ()
    description: str = ""


AUDITS: tuple[AuditSpec, ...] = (
    AuditSpec(
        name="frontmatter",
        script="frontmatter-check.py",
        description="YAML frontmatter validity + version field shape",
    ),
    AuditSpec(
        name="link",
        script="link-check.py",
        description="Internal link resolution",
    ),
    AuditSpec(
        name="korean-copy",
        script="korean-copy-check.py",
        description="Korean voice / register / typography",
    ),
    AuditSpec(
        name="integration",
        script="integration-check.py",
        description="Integration walkthrough completeness",
    ),
    AuditSpec(
        name="stale",
        script="stale-check.py",
        strict_args=("--strict",),
        description="Knowledge freshness (last_updated thresholds)",
    ),
    AuditSpec(
        name="coverage",
        script="check-coverage.py",
        description="Component / skill / example coverage report",
    ),
    AuditSpec(
        name="example-qa",
        script="example-qa.py",
        description="Top worked example quality for every route",
    ),
)


@dataclass(frozen=True)
class AuditResult:
    spec: AuditSpec
    returncode: int
    duration_s: float
    stdout: str
    stderr: str

    @property
    def passed(self) -> bool:
        return self.returncode == 0


def run_audit(spec: AuditSpec, *, strict: bool) -> AuditResult:
    args: Sequence[str] = (sys.executable, str(AUDIT_DIR / spec.script))
    if strict:
        args = (*args, *spec.strict_args)
    started = time.monotonic()
    completed = subprocess.run(
        args,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    return AuditResult(
        spec=spec,
        returncode=completed.returncode,
        duration_s=time.monotonic() - started,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )


def format_status(result: AuditResult) -> str:
    icon = "✓" if result.passed else "✗"
    return f"{icon} {result.spec.name:<14} {result.duration_s:>5.2f}s  {result.spec.description}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Pass --strict to audits that support it; exit 1 on failure.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only print failures and the final summary line.",
    )
    args = parser.parse_args()

    print()
    print(f"Running {len(AUDITS)} audits from {AUDIT_DIR.relative_to(ROOT)}/")
    print()

    results: list[AuditResult] = []
    for spec in AUDITS:
        result = run_audit(spec, strict=args.strict)
        results.append(result)

        if not args.quiet:
            print(format_status(result))
            if not result.passed:
                # Show stdout / stderr inline on failure
                if result.stdout.strip():
                    print("  stdout:")
                    for line in result.stdout.rstrip().splitlines()[-30:]:
                        print(f"    {line}")
                if result.stderr.strip():
                    print("  stderr:")
                    for line in result.stderr.rstrip().splitlines()[-30:]:
                        print(f"    {line}")
        elif not result.passed:
            print(format_status(result))
            if result.stdout.strip():
                print(result.stdout.rstrip())
            if result.stderr.strip():
                print(result.stderr.rstrip(), file=sys.stderr)

    failures = [r for r in results if not r.passed]
    total_duration = sum(r.duration_s for r in results)

    print()
    print("─" * 60)
    if failures:
        print(
            f"✗ {len(failures)}/{len(results)} audit(s) failed in {total_duration:.2f}s"
        )
        for r in failures:
            print(f"   - {r.spec.name}")
        if args.strict:
            return 1
        print()
        print("Use --strict to fail with non-zero exit code.")
        return 0
    else:
        print(f"✓ All {len(results)} audits passed in {total_duration:.2f}s")
        return 0


if __name__ == "__main__":
    sys.exit(main())
