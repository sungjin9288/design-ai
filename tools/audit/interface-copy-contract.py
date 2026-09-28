#!/usr/bin/env python3
"""Validate the interface-copy lens contract against its before/after fixtures.

The contract Markdown owns the criteria IDs, the surfaces, and each surface's
required parts, primary control, and conveyed-fact roles. This checker reads
those tables and requires the fixtures to:

- cover every surface in Korean and English, as pairs with the same roles and numbers;
- tie every finding to one part: evidence quoted from `before`, fix present in `after`;
- remove the flagged string, start the accessible name with a non-generic label,
  and repeat a title word in a destructive confirmation;
- carry every conveyed fact, including in live-region announcements;
- hold one Korean register in `after` with no stray English, and quote a sentence
  in the wrong register for every Korean honorific finding;
- use every criterion at least once and never introduce a score field.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACT = ROOT / "knowledge" / "patterns" / "interface-copy.md"
FIXTURES = ROOT / "knowledge" / "patterns" / "interface-copy-fixtures.json"
SCHEMA = "design-ai.interface-copy-fixtures/v2"
LOCALES = ("ko", "en")
REGISTERS = {"ko": {"haeyo", "hapsyo"}, "en": {"en-plain"}}
ROLES = {"object", "action", "result", "format", "consequence", "amount", "input-kept", "skip"}
SEVERITIES = {"p0", "p1", "p2", "p3"}
HONORIFIC = "korean-honorific-consistency"
ANTI_SCORE_RULE = "No readability score becomes a substitute for the user goal or for evidence."
GENERIC_WORDS = {"확인", "예", "네", "다음", "진행", "계속", "ok", "okay", "yes", "next", "submit",
                 "continue", "proceed", "confirm", "click", "here"}
SCORE_KEY = re.compile(r"score|readability|grade", re.IGNORECASE)
HANGUL = re.compile(r"[가-힣]")
LATIN_WORD = re.compile(r"[A-Za-z]{2,}")
SENTENCE_SPLIT = re.compile(r"(?<=[.?!])\s+")
CLAUSE_SPLIT = re.compile(r",\s+")
FIXTURE_KEYS = {"id", "pair", "surface", "locale", "register", "userGoal", "mustConvey", "before", "after", "findings"}
OPTIONAL_FIXTURE_KEYS = {"brandTerms"}
FINDING_KEYS = {"criterion", "part", "severity", "evidence", "why", "fix", "verification"}
HAPSYO_ENDINGS = ("니다", "니까", "시오", "시다")
NOUNS_ENDING_IN_YO = ("필요", "중요", "주요", "수요", "개요", "요요")
BANMAL_ENDINGS = ("했다", "었다", "았다", "한다", "는다", "된다", "있다", "없다", "했어", "었어", "았어",
                  "렸어", "났어", "됐어", "졌어", "왔어", "갔어", "봤어", "겠어", "할게", "볼게", "줄게",
                  "해 봐", "해 줘", "거야", "할래", "하자", "했니", "이야")
# Only forms that cannot end a noun: 작업함, 보관함, and 모임 are common UI nouns.
EUMSEUM_ENDINGS = ("있음", "없음", "했음", "였음", "었음", "았음", "됐음", "됨")


def table_rows(text: str, heading: str) -> list[list[str]]:
    """Return the body rows of the first table under `## heading`."""
    section = re.search(rf"^## {re.escape(heading)}\s*$\n(?P<body>.*?)(?=^## |\Z)", text, re.MULTILINE | re.DOTALL)
    if not section:
        return []
    rows = [line for line in section.group("body").splitlines() if line.startswith("|")]
    return [[cell.strip() for cell in row.strip().strip("|").split("|")] for row in rows[2:]]


def backticked(cell: str) -> list[str]:
    return re.findall(r"`([^`]+)`", cell)


def parse_contract(text: str) -> tuple[dict, list[str]]:
    errors: list[str] = []
    criteria = [backticked(row[0])[0] for row in table_rows(text, "Criteria") if backticked(row[0])]
    surfaces = {}
    for row in table_rows(text, "Surfaces"):
        if len(row) < 4 or not backticked(row[0]):
            continue
        primary = backticked(row[2])
        surfaces[backticked(row[0])[0]] = {"parts": backticked(row[1]), "primary": primary[0] if primary else None,
                                           "roles": backticked(row[3])}
    if len(criteria) != 8 or HONORIFIC not in criteria:
        errors.append(f"contract must define 8 criteria including {HONORIFIC}, found {criteria}")
    if len(surfaces) != 7:
        errors.append(f"contract must define 7 surfaces, found {len(surfaces)}")
    for name, surface in surfaces.items():
        if not surface["roles"] or set(surface["roles"]) - ROLES:
            errors.append(f"contract surface {name} must list conveyed-fact roles from {sorted(ROLES)}")
    if ANTI_SCORE_RULE not in text:
        errors.append("contract must state the readability-score rule verbatim")
    if "(interface-copy-fixtures.json)" not in text:
        errors.append("contract must link interface-copy-fixtures.json")
    return {"criteria": criteria, "surfaces": surfaces}, errors


def korean_register(sentence: str) -> str | None:
    """Classify one Korean sentence or clause; None for register-neutral fragments."""
    core = re.sub(r"\([^)]*\)", "", sentence).strip()
    ending = re.sub(r"[^\w가-힣]+$", "", core)
    if not HANGUL.search(ending[-2:]):
        return None
    full_sentence = " " in ending or core[-1:] in ".?!"
    if ending.endswith(HAPSYO_ENDINGS):
        return "hapsyo"
    if (ending.endswith("요") and not ending.endswith(NOUNS_ENDING_IN_YO)) or ending.endswith("죠"):
        return "haeyo"
    # Single syllables such as 지 or 해 also end nouns (유지, 이해), so plain -다 and
    # 음슴체 count only in a full sentence; other plain endings need a multi-syllable form.
    if ending.endswith(BANMAL_ENDINGS) or (full_sentence and ending.endswith("다")):
        return "banmal"
    if full_sentence and ending.endswith(EUMSEUM_ENDINGS):
        return "eumseum"
    return None


def units(side: dict) -> list[str]:
    """Every string and sentence on one side, plus the accessible name."""
    found = []
    for value in [*side.get("strings", {}).values(), side.get("accessibleName", "")]:
        if value:
            found.append(value)
            found.extend(part for part in SENTENCE_SPLIT.split(value) if part and part != value)
    return found


def side_text(side: dict) -> str:
    return "\n".join(units(side))


def registers(side: dict) -> set[str]:
    clauses = [clause for unit in units(side) for clause in CLAUSE_SPLIT.split(unit)]
    return {r for clause in clauses for r in [korean_register(clause)] if r}


def part_value(side: dict, part: str) -> str:
    return side.get("accessibleName", "") if part == "accessibleName" else side.get("strings", {}).get(part, "")


def normalized_words(label: str) -> list[str]:
    return re.sub(r"[^\w가-힣]+", " ", label.casefold()).split()


def score_keys(value: object, trail: str = "") -> list[str]:
    if isinstance(value, dict):
        found = [f"{trail}.{key}".lstrip(".") for key in value if SCORE_KEY.search(key)]
        return found + [k for key, item in value.items() for k in score_keys(item, f"{trail}.{key}")]
    if isinstance(value, list):
        return [k for index, item in enumerate(value) for k in score_keys(item, f"{trail}[{index}]")]
    return []


def check_shape(fixture: dict, contract: dict) -> list[str]:
    label = fixture.get("id", "<no id>")
    errors = [f"{label}: missing key {key}" for key in sorted(FIXTURE_KEYS - set(fixture))]
    errors += [f"{label}: unknown key {key}" for key in sorted(set(fixture) - FIXTURE_KEYS - OPTIONAL_FIXTURE_KEYS)]
    if errors:
        return errors
    surface = contract["surfaces"].get(fixture["surface"])
    if surface is None:
        return [f"{label}: unknown surface {fixture['surface']}"]
    if fixture["locale"] not in LOCALES:
        return [f"{label}: locale must be one of {LOCALES}"]
    if fixture["register"] not in REGISTERS[fixture["locale"]]:
        errors.append(f"{label}: register {fixture['register']} is not valid for {fixture['locale']}")
    for side in ("before", "after"):
        missing = [part for part in surface["parts"] if not fixture[side].get("strings", {}).get(part)]
        errors += [f"{label}: {side} is missing required part {part}" for part in missing]
    if not fixture["findings"]:
        errors.append(f"{label}: needs at least one finding")
    convey = fixture["mustConvey"]
    if not isinstance(convey, list) or not all(isinstance(c, dict) and set(c) == {"role", "text"} for c in convey):
        return errors + [f"{label}: mustConvey entries must be {{role, text}} objects"]
    roles = [c["role"] for c in convey]
    errors += [f"{label}: unknown conveyed-fact role {r}" for r in roles if r not in ROLES]
    errors += [f"{label}: must convey the {r} fact" for r in surface["roles"] if r not in roles]
    errors += [f"{label}: conveyed fact {c['role']} has empty text" for c in convey if not c["text"].strip()]
    return errors


def check_finding(fixture: dict, finding: dict, where: str, contract: dict) -> list[str]:
    if set(finding) != FINDING_KEYS:
        return [f"{where}: keys must be exactly {sorted(FINDING_KEYS)}"]
    empty = [key for key in ("evidence", "fix", "why", "verification") if not str(finding[key]).strip()]
    if empty:
        return [f"{where}: {', '.join(empty)} must not be empty"]
    errors = []
    if finding["criterion"] not in contract["criteria"]:
        errors.append(f"{where}: unknown criterion {finding['criterion']}")
    if finding["severity"] not in SEVERITIES:
        errors.append(f"{where}: severity must be p0-p3")
    parts = set(contract["surfaces"][fixture["surface"]]["parts"]) | set(fixture["after"]["strings"]) | {"accessibleName"}
    if finding["part"] not in parts:
        return errors + [f"{where}: unknown part {finding['part']}"]
    if finding["evidence"] not in part_value(fixture["before"], finding["part"]):
        errors.append(f"{where}: evidence is not quoted from before.{finding['part']}")
    if finding["fix"] not in part_value(fixture["after"], finding["part"]):
        errors.append(f"{where}: fix does not appear in after.{finding['part']}")
    if finding["evidence"] in side_text(fixture["after"]) and finding["evidence"] not in finding["fix"]:
        errors.append(f"{where}: flagged string still appears in after")
    if finding["criterion"] == HONORIFIC:
        found = korean_register(finding["evidence"])
        if fixture["locale"] != "ko":
            errors.append(f"{where}: {HONORIFIC} applies only to Korean fixtures")
        elif found is None or found == fixture["register"]:
            errors.append(f"{where}: honorific evidence must be a sentence outside the {fixture['register']} register")
    return errors


def check_findings(fixture: dict, contract: dict) -> list[str]:
    return [error for index, finding in enumerate(fixture["findings"])
            for error in check_finding(fixture, finding, f"{fixture['id']}: findings[{index}]", contract)]


def check_primary(fixture: dict, contract: dict) -> list[str]:
    label, after, errors = fixture["id"], fixture["after"], []
    primary = contract["surfaces"][fixture["surface"]]["primary"]
    if not primary:
        return errors
    visible = after["strings"].get(primary, "")
    words = normalized_words(visible)
    if not words or set(words) <= GENERIC_WORDS:
        errors.append(f"{label}: primary control label {visible!r} is generic")
    if not after.get("accessibleName", "").casefold().startswith(visible.casefold()):
        errors.append(f"{label}: accessible name must start with the visible label {visible!r}")
    if fixture["surface"] == "destructive-confirmation":
        title = after["strings"].get("title", "").casefold()
        if not any(len(word) >= 2 and word in title for word in words):
            errors.append(f"{label}: confirm label must repeat a key word of the title")
    return errors


def check_after(fixture: dict, contract: dict) -> list[str]:
    label, after, errors = fixture["id"], fixture["after"], []
    text = side_text(after)
    facts = [c["text"] for c in fixture["mustConvey"]]
    errors += [f"{label}: after does not convey {fact!r}" for fact in facts if fact not in text]
    announcement = after["strings"].get("announcement")
    if announcement is not None:
        errors += [f"{label}: announcement does not convey {fact!r}" for fact in facts if fact not in announcement]
    errors += check_primary(fixture, contract)
    if fixture["locale"] == "ko":
        found = registers(after)
        if found - {fixture["register"]}:
            errors.append(f"{label}: after mixes registers {sorted(found)}; expected only {fixture['register']}")
        if not HANGUL.search(text):
            errors.append(f"{label}: Korean fixture has no Korean after text")
        brands = {term.casefold() for term in fixture.get("brandTerms", [])}
        stray = sorted({w for w in LATIN_WORD.findall(text) if w.casefold() not in brands})
        if stray:
            errors.append(f"{label}: Korean after text contains English fragments {stray}")
    elif HANGUL.search(text):
        errors.append(f"{label}: English fixture contains Korean after text")
    return errors


def check_pairs(fixtures: list[dict], contract: dict) -> list[str]:
    errors, pairs = [], {}
    for fixture in fixtures:
        pairs.setdefault(fixture["pair"], []).append(fixture)
    for name, members in sorted(pairs.items()):
        locales = sorted(member["locale"] for member in members)
        if locales != sorted(LOCALES):
            errors.append(f"pair {name}: needs exactly one ko and one en fixture, found {locales}")
            continue
        ko, en = sorted(members, key=lambda m: m["locale"], reverse=True)
        if ko["surface"] != en["surface"]:
            errors.append(f"pair {name}: surfaces differ")
        ko_facts = {c["role"]: c["text"] for c in ko["mustConvey"]}
        en_facts = {c["role"]: c["text"] for c in en["mustConvey"]}
        if set(ko_facts) != set(en_facts):
            errors.append(f"pair {name}: ko and en must convey the same roles")
            continue
        for role in sorted(ko_facts):
            if re.findall(r"\d[\d,]*", ko_facts[role]) != re.findall(r"\d[\d,]*", en_facts[role]):
                errors.append(f"pair {name}: numbers differ for {role}")
    for surface in contract["surfaces"]:
        for locale in LOCALES:
            if not any(f["surface"] == surface and f["locale"] == locale for f in fixtures):
                errors.append(f"surface {surface}: missing {locale} fixture")
    return errors


def validate(contract_text: str, data: dict) -> list[str]:
    contract, errors = parse_contract(contract_text)
    if data.get("schema") != SCHEMA:
        errors.append(f"fixtures schema must be {SCHEMA}")
    fixtures = data.get("fixtures")
    if not isinstance(fixtures, list) or not fixtures:
        return errors + ["fixtures must be a non-empty list"]
    errors += [f"score-like field is not allowed: {key}" for key in score_keys(data)]
    ids = [f.get("id") for f in fixtures]
    errors += [f"duplicate fixture id {i}" for i in sorted({i for i in ids if ids.count(i) > 1})]
    valid = []
    for fixture in fixtures:
        shape = check_shape(fixture, contract)
        errors += shape
        if not shape:
            valid.append(fixture)
            errors += check_findings(fixture, contract) + check_after(fixture, contract)
    errors += check_pairs(valid, contract)
    used = {finding.get("criterion") for f in valid for finding in f["findings"]}
    errors += [f"criterion {c} has no fixture finding" for c in contract["criteria"] if c not in used]
    return errors


def load() -> tuple[str, dict]:
    try:
        return CONTRACT.read_text(encoding="utf-8"), json.loads(FIXTURES.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"interface copy contract: cannot read inputs: {error}") from error


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--self-test", action="store_true", help="Reject each named mutation of the real fixtures")
    args = parser.parse_args()
    if args.self_test:
        from interface_copy_selftest import run_self_test
        return run_self_test(sys.modules[__name__])
    text, data = load()
    errors = validate(text, data)
    if errors:
        print(f"Interface copy contract failed with {len(errors)} issue(s):")
        for error in errors:
            print(f"  {error}")
        return 1
    fixtures = data["fixtures"]
    findings = sum(len(f["findings"]) for f in fixtures)
    print(f"Interface copy contract passed: {len(fixtures)} fixtures, {findings} findings, 7 surfaces x ko/en, 8 criteria")
    return 0


if __name__ == "__main__":
    sys.exit(main())
