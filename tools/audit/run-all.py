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
  python3 tools/audit/run-all.py --json     # emit machine-readable audit results
  python3 tools/audit/run-all.py --self-test

Exit codes:
  0 = all passed
  1 = at least one failure (only emitted with --strict OR if a hard error occurs)
"""
from __future__ import annotations

import argparse
import json
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
        name="raw-hex",
        script="raw-hex-check.py",
        description="Example raw hex colors use token aliases unless explicitly allowlisted",
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
        strict_args=("--check",),
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


def summarize_results(results: Sequence[AuditResult], *, strict: bool) -> tuple[list[str], int]:
    failures = [result for result in results if not result.passed]
    total_duration = sum(result.duration_s for result in results)

    lines = ["", "─" * 60]
    if failures:
        lines.append(
            f"✗ {len(failures)}/{len(results)} audit(s) failed in {total_duration:.2f}s"
        )
        for result in failures:
            lines.append(f"   - {result.spec.name}")
        if strict:
            return lines, 1
        lines.extend(["", "Use --strict to fail with non-zero exit code."])
        return lines, 0

    lines.append(f"✓ All {len(results)} audits passed in {total_duration:.2f}s")
    return lines, 0


def build_json_report(
    results: Sequence[AuditResult],
    *,
    strict: bool,
    quiet: bool,
    exit_code: int,
    root: Path = ROOT,
    audit_dir: Path = AUDIT_DIR,
) -> dict[str, object]:
    failures = [result for result in results if not result.passed]
    total_duration = sum(result.duration_s for result in results)
    return {
        "context": {
            "root": str(root),
            "auditDir": str(audit_dir.relative_to(root)),
            "strict": strict,
            "quiet": quiet,
        },
        "audits": [
            {
                "name": result.spec.name,
                "script": result.spec.script,
                "description": result.spec.description,
                "passed": result.passed,
                "returncode": result.returncode,
                "durationSeconds": round(result.duration_s, 3),
                "strictArgs": list(result.spec.strict_args if strict else ()),
            }
            for result in results
        ],
        "summary": {
            "total": len(results),
            "passed": len(results) - len(failures),
            "failed": len(failures),
            "durationSeconds": round(total_duration, 3),
            "exitCode": exit_code,
        },
    }


def format_json_report(report: dict[str, object]) -> str:
    return json.dumps(report, ensure_ascii=False, indent=2)


def assert_self_test(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"audit runner self-test failed: {message}")


def run_self_test() -> int:
    passing = AuditResult(
        spec=AuditSpec(name="passing", script="passing.py", description="Passing fixture"),
        returncode=0,
        duration_s=0.25,
        stdout="",
        stderr="",
    )
    failing = AuditResult(
        spec=AuditSpec(name="failing", script="failing.py", description="Failing fixture"),
        returncode=1,
        duration_s=0.75,
        stdout="fixture stdout",
        stderr="fixture stderr",
    )

    assert_self_test(format_status(passing).startswith("✓ passing"), "passing status should use success marker")
    assert_self_test(format_status(failing).startswith("✗ failing"), "failing status should use failure marker")

    pass_lines, pass_code = summarize_results([passing], strict=True)
    assert_self_test(pass_code == 0, "strict mode should pass when every audit passes")
    assert_self_test("✓ All 1 audits passed in 0.25s" in pass_lines, "passing summary should include count and duration")

    warn_lines, warn_code = summarize_results([passing, failing], strict=False)
    assert_self_test(warn_code == 0, "warn-only mode should keep exit code 0 for failures")
    assert_self_test("Use --strict to fail with non-zero exit code." in warn_lines, "warn-only failures should explain strict mode")
    assert_self_test("   - failing" in warn_lines, "failure summary should list failing audit names")

    strict_lines, strict_code = summarize_results([passing, failing], strict=True)
    assert_self_test(strict_code == 1, "strict mode should exit 1 when any audit fails")
    assert_self_test("Use --strict to fail with non-zero exit code." not in strict_lines, "strict failures should not print warn-only hint")

    json_report = build_json_report([passing, failing], strict=True, quiet=False, exit_code=strict_code)
    formatted_json = format_json_report(json_report)
    parsed_json = json.loads(formatted_json)
    assert_self_test(list(parsed_json) == ["context", "audits", "summary"], "JSON report top-level keys should stay stable")
    assert_self_test(
        list(parsed_json["context"]) == ["root", "auditDir", "strict", "quiet"],
        "JSON context keys should stay stable",
    )
    assert_self_test(
        list(parsed_json["audits"][0]) == [
            "name",
            "script",
            "description",
            "passed",
            "returncode",
            "durationSeconds",
            "strictArgs",
        ],
        "JSON audit entry keys should stay stable",
    )
    assert_self_test(
        list(parsed_json["summary"]) == ["total", "passed", "failed", "durationSeconds", "exitCode"],
        "JSON summary keys should stay stable",
    )
    assert_self_test(parsed_json["summary"]["exitCode"] == 1, "JSON summary should include strict exit code")
    localized_json = format_json_report(build_json_report(
        [
            AuditResult(
                spec=AuditSpec(name="한국어", script="korean.py", description="한국어 설명"),
                returncode=0,
                duration_s=0.1,
                stdout="",
                stderr="",
            )
        ],
        strict=False,
        quiet=True,
        exit_code=0,
    ))
    assert_self_test("한국어 설명" in localized_json and "\\u" not in localized_json, "JSON output should keep localized text readable")

    assert_self_test(len(AUDITS) == 8, "release gate should still enumerate eight repository audits")
    assert_self_test(
        any(spec.name == "stale" and "--strict" in spec.strict_args for spec in AUDITS),
        "stale audit should still receive strict args in strict mode",
    )
    assert_self_test(
        any(spec.name == "coverage" and spec.strict_args == ("--check",) for spec in AUDITS),
        "strict coverage audit should check without regenerating the committed report",
    )

    print("Audit runner self-test passed")
    return 0


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
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable audit results.",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run built-in runner summary and exit-code fixtures without invoking audits.",
    )
    args = parser.parse_args()

    if args.self_test:
        return run_self_test()

    if not args.json:
        print()
        print(f"Running {len(AUDITS)} audits from {AUDIT_DIR.relative_to(ROOT)}/")
        print()

    results: list[AuditResult] = []
    for spec in AUDITS:
        result = run_audit(spec, strict=args.strict)
        results.append(result)

        if args.json:
            continue
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

    summary_lines, exit_code = summarize_results(results, strict=args.strict)
    if args.json:
        print(format_json_report(build_json_report(
            results,
            strict=args.strict,
            quiet=args.quiet,
            exit_code=exit_code,
        )))
    else:
        for line in summary_lines:
            print(line)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
