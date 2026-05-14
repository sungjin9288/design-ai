#!/usr/bin/env python3
"""Audit the top worked example for every routed design workflow.

This keeps the route/example recommendation surface honest. If routing starts
pointing a workflow at a weak or incomplete example, this audit fails before the
package ships.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLI = ROOT / "cli" / "bin" / "design-ai.mjs"


def run_example_check() -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            "node",
            str(CLI),
            "check",
            "--examples",
            "--all-routes",
            "--limit",
            "1",
            "--json",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )


def issue_lines(report: dict) -> list[str]:
    lines: list[str] = []
    for route in report.get("routes", []):
        if route.get("status") == "pass":
            continue
        route_id = route.get("routeId", "(unknown route)")
        lines.append(f"- {route_id}: {route.get('status', 'unknown')}")
        for example_report in route.get("examples", []):
            example = example_report.get("example", {})
            artifact = example_report.get("report", {})
            if artifact.get("status") == "pass":
                continue
            rel_path = example.get("relPath", "(unknown example)")
            lines.append(f"  - {rel_path}: {artifact.get('status', 'unknown')}")
            for result in artifact.get("results", []):
                if result.get("level") == "pass":
                    continue
                evidence = result.get("evidence")
                suffix = f" — {evidence}" if evidence else ""
                lines.append(f"    - {result.get('id', 'unknown')}: {result.get('message', '')}{suffix}")
    return lines


def main() -> int:
    if not CLI.exists():
        print(f"ERROR: design-ai CLI not found at {CLI}", file=sys.stderr)
        return 1

    completed = run_example_check()
    if completed.returncode != 0:
        print("ERROR: example QA command failed", file=sys.stderr)
        if completed.stdout.strip():
            print(completed.stdout.rstrip())
        if completed.stderr.strip():
            print(completed.stderr.rstrip(), file=sys.stderr)
        return 1

    try:
        report = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        print(f"ERROR: could not parse example QA JSON: {exc}", file=sys.stderr)
        if completed.stdout.strip():
            print(completed.stdout.rstrip())
        return 1

    status = report.get("status")
    total_routes = report.get("totalRoutes", 0)
    passed_routes = report.get("passedRoutes", 0)
    warned_routes = report.get("warnedRoutes", 0)
    failed_routes = report.get("failedRoutes", 0)
    total_examples = report.get("totalExamples", 0)
    passed_examples = report.get("passedExamples", 0)

    if status != "pass":
        print(
            "Example route QA failed: "
            f"{passed_routes}/{total_routes} routes pass, "
            f"{warned_routes} warn, {failed_routes} fail"
        )
        for line in issue_lines(report):
            print(line)
        return 1

    print(
        "Example route QA passed: "
        f"{passed_routes}/{total_routes} routes and {passed_examples}/{total_examples} examples pass"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
