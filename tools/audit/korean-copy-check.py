#!/usr/bin/env python3
"""
Korean copy validator — flags English UI copy in files marked Korean-specific.

Heuristic: scans Korean-relevant files (i18n/, korean-*, examples that
explicitly reference Korean conventions) for English UI strings that
should likely be Korean. Suggests Korean equivalents.

Outputs warnings (not errors) — this is a hint, not enforcement. True
copy review needs human judgment.

Usage:
  python3 tools/audit/korean-copy-check.py [--strict]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


# Common English UI strings that should be Korean in KR-specific contexts.
# Map: regex pattern → suggested Korean (and reason).
ENGLISH_UI_PATTERNS: list[tuple[str, str, str]] = [
    # (regex, suggested_korean, reason)
    (r'\b"Save"\b', '"저장"', 'KR convention: save action'),
    (r'\b"Cancel"\b', '"취소"', 'KR convention: cancel action'),
    (r'\b"Submit"\b', '"제출"', 'KR convention: submit (rare in consumer; usually 등록/저장)'),
    (r'\b"Delete"\b', '"삭제"', 'KR convention'),
    (r'\b"Edit"\b', '"수정"', 'KR convention'),
    (r'\b"Confirm"\b', '"확인"', 'KR convention'),
    (r'\b"Sign in"\b', '"로그인"', 'KR convention'),
    (r'\b"Sign out"\b', '"로그아웃"', 'KR convention'),
    (r'\b"Sign up"\b', '"회원가입" or "가입하기"', 'KR convention'),
    (r'\b"Search"\b', '"검색"', 'KR convention'),
    (r'\b"Loading"\b', '"로딩 중" or "불러오는 중"', 'KR convention (polite form)'),
    (r'\b"Error"\b', '"오류"', 'KR convention'),
    (r'\b"Try again"\b', '"다시 시도"', 'KR convention'),
    (r'\b"Next"\b', '"다음"', 'KR convention'),
    (r'\b"Previous"\b', '"이전"', 'KR convention'),
    (r'\b"Done"\b', '"완료"', 'KR convention'),
    (r'\b"Skip"\b', '"건너뛰기" or "넘기기"', 'KR convention'),
    (r'\b"Required"\b', '"필수"', 'KR convention'),
    (r'\b"Optional"\b', '"선택"', 'KR convention'),
    (r'\b"More"\b', '"더보기"', 'KR convention'),
    (r'\b"Settings"\b', '"설정"', 'KR convention'),
    (r'\b"Profile"\b', '"프로필"', 'KR convention'),
    (r'\b"Notifications"\b', '"알림"', 'KR convention'),
    (r'\b"Phone"\b', '"휴대폰" or "전화번호"', 'KR convention'),
    (r'\b"Email"\b', '"이메일"', 'KR convention'),
    (r'\b"Password"\b', '"비밀번호"', 'KR convention'),
    (r'\b"Welcome"\b', '"환영합니다"', 'KR convention'),
]


# Files that are explicitly marked Korean-specific.
KOREAN_PATH_PATTERNS = [
    "knowledge/i18n/korean-",
    "examples/component-amount-input.md",
    "examples/component-address-input.md",
    "examples/component-biometric-gate.md",
    "examples/component-payment-method-selector.md",
    "examples/component-payment-brand-button.md",
    "examples/component-category-picker.md",
    "examples/component-transaction-list-item.md",
    "examples/component-account-card.md",
    "examples/component-stock-chart.md",
    "examples/component-krw-amount.md",
    "examples/component-payment-receipt.md",
]


def is_korean_relevant(path: Path) -> bool:
    rel = str(path.relative_to(ROOT))
    return any(p in rel for p in KOREAN_PATH_PATTERNS)


def in_code_block(line: str, in_block: bool) -> bool:
    """State machine for tracking code block boundaries."""
    if line.strip().startswith("```"):
        return not in_block
    return in_block


def scan(path: Path, strict: bool) -> list[tuple[int, str, str, str]]:
    """Returns list of (line_num, matched_text, suggestion, reason)."""
    text = path.read_text(encoding="utf-8")
    issues: list[tuple[int, str, str, str]] = []
    in_code = False

    for line_num, line in enumerate(text.splitlines(), 1):
        # Track code block boundaries
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            # English in code blocks is expected (CSS, code samples)
            continue

        # Skip lines that are clearly meta-discussion of the rule
        # (e.g., "When to use Korean: ...")
        if "convention" in line.lower() or "korean" in line.lower():
            # Allow English in meta-discussion of Korean conventions
            continue

        # Tables explaining Korean translations (English | Korean)
        # Skip lines that have Korean characters present — they're
        # likely showing the equivalence
        has_korean = bool(re.search(r"[가-힯]", line))
        if has_korean:
            continue

        for pattern, suggestion, reason in ENGLISH_UI_PATTERNS:
            for match in re.finditer(pattern, line):
                issues.append((line_num, match.group(0), suggestion, reason))

    return issues


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    parser.add_argument("--verbose", action="store_true", help="Show all matches even when no issues")
    args = parser.parse_args()

    targets = [
        p for p in ROOT.rglob("*.md")
        if is_korean_relevant(p)
        and not any(skip in str(p) for skip in ("refs/", ".claude/", "site-src/", "/site/", "node_modules/"))
    ]

    print(f"Scanning {len(targets)} Korean-relevant files...\n")

    total_issues = 0
    for path in targets:
        rel = path.relative_to(ROOT)
        issues = scan(path, args.strict)
        if issues:
            print(f"{rel}:")
            for line_num, matched, suggestion, reason in issues:
                print(f"  line {line_num}: {matched} → suggest {suggestion} ({reason})")
            print()
            total_issues += len(issues)

    if total_issues == 0:
        print("No English UI strings flagged in Korean-relevant files ✓")
        sys.exit(0)
    else:
        print(f"Found {total_issues} potential Korean copy issues.")
        print("(Heuristic check — verify each manually. Some English strings are")
        print("legitimate, e.g., showing translations or referencing UI conventions.)")
        sys.exit(1 if args.strict else 0)


if __name__ == "__main__":
    main()
