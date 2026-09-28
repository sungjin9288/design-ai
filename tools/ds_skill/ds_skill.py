#!/usr/bin/env python3
"""Compile a source-grounded, project-local Agent Skill from one design system.

Clone-only maintainer tool (P17C). Stages run in order and bind by digest:

  scope     persist the declared roots and directories before reading source
  facts     extract verified package, component, prop, token, and icon facts
            (plus consumer usage and drift when a consumer is scoped)
  contract  close the generation vocabulary over those facts
  generate  render the skill from the contract only
  verify    re-check source, anchors, provenance, vocabulary, and skill contract

`build` runs facts through verify against an existing scope.

Usage:
  python3 tools/ds_skill/ds_skill.py scope --ds-root DIR --entry src/index.ts \\
      --components src/components [--tokens DIR] [--icons DIR] \\
      [--consumer DIR --consumer-src DIR] --name SKILL --out WORK
  python3 tools/ds_skill/ds_skill.py build --work WORK
  python3 tools/ds_skill/ds_skill.py --self-test
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CompilerError, read_json  # noqa: E402
from contract import write_contract  # noqa: E402
from facts import write_facts  # noqa: E402
from generate import write_skill  # noqa: E402
from scope import load_scope, write_scope  # noqa: E402
from usage import write_usage  # noqa: E402
from verify import write_verify  # noqa: E402


def stage_facts(work: Path) -> None:
    facts_path = write_facts(work)
    print(f"facts: {facts_path}")
    usage_path = write_usage(work, load_scope(work), read_json(facts_path, "facts"))
    if usage_path:
        print(f"usage: {usage_path}")


def stage_verify(work: Path) -> int:
    report = write_verify(work)
    for check in report["checks"]:
        print(f"{'✓' if check['status'] == 'pass' else '✗'} {check['id']}")
        for failure in check["failures"]:
            print(f"    {failure}")
    print(f"verify: {report['status']} ({work / 'verify.json'})")
    return 0 if report["status"] == "pass" else 1


def run_build(work: Path) -> int:
    stage_facts(work)
    print(f"contract: {write_contract(work)}")
    print(f"skill: {write_skill(work)}")
    return stage_verify(work)


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    root.add_argument("--self-test", action="store_true", help="run the fixture and mutation suite")
    commands = root.add_subparsers(dest="command")
    scope = commands.add_parser("scope", help="persist scope decisions before reading source")
    scope.add_argument("--ds-root", required=True)
    scope.add_argument("--entry", required=True, help="public entry module, relative to --ds-root")
    scope.add_argument("--components", required=True, action="append", help="component directory (repeatable)")
    scope.add_argument("--tokens", action="append", help="token directory with .css or DTCG .json (repeatable)")
    scope.add_argument("--icons", action="append", help="SVG icon directory (repeatable)")
    scope.add_argument("--consumer", help="optional consuming repository root")
    scope.add_argument("--consumer-src", action="append", help="consumer source directory (repeatable)")
    scope.add_argument("--name", required=True, help="generated skill name")
    scope.add_argument("--out", required=True, help="work directory outside both roots")
    scope.add_argument("--replace", action="store_true", help="supersede an existing scope")
    for name in ("facts", "contract", "generate", "verify", "build"):
        commands.add_parser(name).add_argument("--work", required=True)
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    if args.self_test:
        from selftest import run_self_test
        return run_self_test()
    if not args.command:
        parser().print_help()
        return 2
    try:
        if args.command == "scope":
            print(f"scope: {write_scope(args)}")
            return 0
        work = Path(args.work).expanduser().resolve()
        actions = {
            "facts": lambda: stage_facts(work),
            "contract": lambda: print(f"contract: {write_contract(work)}"),
            "generate": lambda: print(f"skill: {write_skill(work)}"),
        }
        if args.command == "verify":
            return stage_verify(work)
        if args.command == "build":
            return run_build(work)
        actions[args.command]()
        return 0
    except CompilerError as error:
        print(f"ds-skill: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
