#!/usr/bin/env python3
"""
Verify release metadata before tagging.

This keeps the release checklist's manual version / changelog / roadmap scan
from drifting away from the actual package metadata and audit runner.

Usage:
  python3 tools/audit/release-metadata.py
  python3 tools/audit/release-metadata.py --json
  python3 tools/audit/release-metadata.py --self-test
"""
from __future__ import annotations

import argparse
import json
import re
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_JSON = ROOT / "package.json"
PLUGIN_JSON = ROOT / ".claude-plugin" / "plugin.json"
CHANGELOG = ROOT / "CHANGELOG.md"
ROADMAP = ROOT / "docs" / "ROADMAP.md"
RUN_ALL = ROOT / "tools" / "audit" / "run-all.py"
REQUIRED_RELEASE_POLICY_DOC_LABELS = (
    "README.md",
    "README.ko.md",
    "docs/RELEASE-CHECKLIST.md",
    "docs/DISTRIBUTION.md",
    "docs/DISTRIBUTION.ko.md",
)
RELEASE_POLICY_DOC_PATHS = tuple(
    (label, ROOT / label) for label in REQUIRED_RELEASE_POLICY_DOC_LABELS
)

CHANGELOG_HEADER_RE = re.compile(
    r"^## v(?P<version>\d+\.\d+\.\d+) — (?P<title>.+?) "
    r"\((?P<date>\d{4}-(?P<month>\d{2}))\)\s*$",
    re.MULTILINE,
)
ROADMAP_HEADER_RE = re.compile(r"^## Phase .*\(v(?P<version>\d+\.\d+\.\d+)\).*$", re.MULTILINE)
VERSION_BUMP_RE = re.compile(
    r"`package\.json`\s+\+\s+`\.claude-plugin/plugin\.json`:\s+"
    r"(?P<from>\d+\.\d+\.\d+)\s+→\s+(?P<to>\d+\.\d+\.\d+)"
)
AUDIT_COUNT_RE = re.compile(r"\bAll\s+(?P<count>\d+)\s+audits?\s+pass(?:ed)?\b", re.IGNORECASE)
AUDIT_SCRIPT_RE = re.compile(r'script="([^"]+\.py)"')
RELEASE_WARNING_POLICY_TERM_GROUPS = (
    ("MkDocs warning policy", "MkDocs 경고 정책"),
    ("baseline", "기준선"),
    ("refs-only", "`refs/` source-link", "`refs/` 소스 링크"),
    ("non-`refs/`", "non-refs", "only intentional `refs/`", "의도된 `refs/`"),
)
RELEASE_LOCAL_CI_COMMAND_TERM_GROUPS = (
    ("`npm run ci:local`", "npm run ci:local"),
)
RELEASE_CHECK_GATE_TERM_GROUPS = (
    ("`npm run release:check`", "npm run release:check"),
    (
        "core automated gate",
        "core gate",
        "before release PRs or tags",
        "Before tagging any release",
        "Before tagging a release",
        "태그 전",
        "태그를 만들기 전",
    ),
)
RELEASE_PACKED_TARBALL_INSTALLED_BIN_TERM_GROUPS = (
    (
        "packed-tarball installed-bin",
        "packed tarball installed bin",
        "installed-bin",
        "installed bin",
        "Installs the packed tarball into a temporary project",
        "패킹된 tarball을 임시 프로젝트에 설치",
    ),
)
RELEASE_PACKED_TARBALL_SMOKE_TERM_GROUPS = (
    (
        "packed-tarball smoke",
        "packed tarball smoke",
        "packed-tarball smoke test",
        "packed-tarball smoke gate",
    ),
)
RELEASE_PACKAGE_SMOKE_COMMAND_TERM_GROUPS = (
    ("`npm run package:smoke`", "npm run package:smoke"),
    (
        "packed-tarball smoke",
        "packed tarball smoke",
        "packed-tarball smoke gate",
        "package smoke",
    ),
    (
        "installed-bin",
        "installed bin",
        "one-shot `npm exec --package <tarball>`",
        "one-shot npm exec",
    ),
)
RELEASE_PACKED_TARBALL_NPM_EXEC_TERM_GROUPS = (
    (
        "one-shot `npm exec --package <tarball>`",
        "`npm exec --package <tarball>`",
        "packed-tarball npm exec",
        "packed tarball npm exec",
        "one-shot npm exec",
        "npm exec --package <tarball> 경로",
    ),
)
RELEASE_PUBLIC_REGISTRY_NPM_EXEC_TERM_GROUPS = (
    (
        "public `npm exec --package`",
        "`npm exec --package @design-ai/cli@<version>`",
        "public registry npm exec",
        "public registry package with `npm exec --package @design-ai/cli@<version>`",
        "공개 `npm exec --package` 설치 경로",
        "공개 npm registry package를 `npm exec --package @design-ai/cli@<version>`",
    ),
)
RELEASE_REGISTRY_SMOKE_COMMAND_TERM_GROUPS = (
    ("`npm run registry:smoke`", "npm run registry:smoke"),
    (
        "After npm publish",
        "After the npm publish workflow completes",
        "After the tag is live",
        "publish 후",
        "publish 워크플로가 끝난 뒤",
        "npm publish가 끝난 뒤",
    ),
    (
        "public install path",
        "public `npm exec --package` install path",
        "공개 설치 경로",
        "공개 `npm exec --package` 설치 경로",
    ),
)
RELEASE_PACKAGE_CONTENTS_TERM_GROUPS = (
    (
        "package contents check",
        "package contents checks",
        "package contents verification",
    ),
)
RELEASE_PACKAGE_CONTENTS_COMMAND_TERM_GROUPS = (
    ("`npm run package:check`", "npm run package:check"),
    (
        "package contents check",
        "package contents checks",
        "package contents verification",
        "package contents check도",
    ),
)
RELEASE_METADATA_CHECK_TERM_GROUPS = (
    (
        "release metadata checks",
        "release metadata check",
        "release metadata 검증",
    ),
)
RELEASE_METADATA_COMMAND_TERM_GROUPS = (
    ("`npm run release:metadata`", "npm run release:metadata"),
    (
        "release metadata checks",
        "release metadata check",
        "release metadata 검증",
    ),
)
RELEASE_CLI_UNIT_TEST_TERM_GROUPS = (
    (
        "CLI unit tests",
        "CLI unit test",
        "CLI unit test 실행",
        "CLI unit test 검증",
    ),
)
RELEASE_CLI_UNIT_TEST_COMMAND_TERM_GROUPS = (
    ("`npm test`", "npm test"),
    (
        "CLI unit tests",
        "CLI unit test",
        "CLI unit test 실행",
        "CLI unit test 검증",
    ),
)
RELEASE_REPOSITORY_AUDIT_TERM_GROUPS = (
    (
        "all eight repository audits",
        "all 8 audits",
        "8 audits",
        "8-audit gate",
        "8개 audit",
        "8개 repository audit",
    ),
)
RELEASE_REPOSITORY_AUDIT_COMMAND_TERM_GROUPS = (
    ("`npm run audit:strict`", "npm run audit:strict"),
    (
        "all eight repository audits",
        "all 8 audits",
        "8 audits",
        "8-audit gate",
        "8개 audit",
        "8개 repository audit",
    ),
)
RELEASE_WHITESPACE_CHECK_TERM_GROUPS = (
    (
        "whitespace checks",
        "whitespace check",
        "whitespace check 검증",
    ),
)
RELEASE_WHITESPACE_COMMAND_TERM_GROUPS = (
    ("`git diff --check`", "git diff --check"),
    (
        "whitespace checks",
        "whitespace check",
        "whitespace check 검증",
    ),
)
RELEASE_SELF_TEST_TERM_GROUPS = (
    (
        "release self-test",
        "release assertion self-tests",
        "release self-test 검증",
    ),
)
RELEASE_SELF_TEST_COMMAND_TERM_GROUPS = (
    ("`npm run release:self-test`", "npm run release:self-test"),
    (
        "release self-test",
        "release assertion self-tests",
        "release self-test 검증",
    ),
)
RELEASE_HUMAN_VERSION_TERM_GROUPS = (
    (
        "human `design-ai version`",
        "human and JSON `design-ai version`",
        "human and JSON version",
        "human/JSON version",
        "human/JSON `design-ai version`",
        "human `design-ai version`과 JSON",
        "human/JSON `design-ai version`과",
    ),
)
RELEASE_VERSION_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai version --json`",),
)
RELEASE_VERSION_JSON_TERM_GROUPS = (
    (
        "machine-readable CLI/plugin version metadata",
        "machine-readable version metadata",
    ),
)
RELEASE_TOP_LEVEL_HELP_TERM_GROUPS = (
    ("top-level help", "top-level help output", "top-level help 출력"),
)
RELEASE_TOP_LEVEL_HELP_COMMAND_TERM_GROUPS = (
    ("`design-ai help`",),
    ("top-level help", "top-level help output", "top-level help 출력"),
)
RELEASE_HELP_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai help --json`",),
)
RELEASE_HELP_JSON_TERM_GROUPS = (
    ("topic catalog", "topic catalog output", "topic catalog 출력"),
)
RELEASE_COMMAND_ALIAS_SMOKE_TERM_GROUPS = (
    (
        "command alias help",
        "documented help and command aliases",
        "help and command aliases",
        "help/command alias 출력",
        "문서화된 help/command alias 출력",
    ),
)
RELEASE_FUNCTIONAL_ALIAS_SMOKE_TERM_GROUPS = (
    (
        "functional alias output",
        "functional aliases",
        "functional alias 출력",
    ),
)
RELEASE_ALIAS_SMOKE_TERM_GROUPS = (
    *RELEASE_COMMAND_ALIAS_SMOKE_TERM_GROUPS,
    *RELEASE_FUNCTIONAL_ALIAS_SMOKE_TERM_GROUPS,
)
RELEASE_HELP_TOPIC_TERM_GROUPS = (
    (
        "command-specific help topic output",
        "every `design-ai help <command>` topic-specific usage output",
        "discovered help topic usage output",
        "command-specific help topic 출력",
        "모든 `design-ai help <command>` topic-specific usage 출력",
        "발견된 help topic usage 출력",
    ),
)
RELEASE_LIST_JSON_TERM_GROUPS = (
    (
        "list --json",
        "list skills --json",
        "list commands --json",
        "list agents --json",
        "human and JSON `list skills`",
        "all three `list` catalog domains in human and JSON mode",
        "세 가지 `list` catalog domain의 human/JSON 출력",
    ),
)
RELEASE_LIST_JSON_MODE_TERM_GROUPS = (
    (
        "list --json",
        "list skills --json",
        "list commands --json",
        "list agents --json",
        "human and JSON `list skills`",
        "all three `list` catalog domains in human and JSON mode",
        "세 가지 `list` catalog domain의 human/JSON 출력",
    ),
)
RELEASE_LIST_CATALOG_DOMAIN_TERM_GROUPS = (
    (
        "all three `list` catalog domains",
        "human and JSON `list skills`, `list commands`, and `list agents`",
        "세 가지 `list` catalog domain",
    ),
)
RELEASE_CORPUS_DISCOVERY_JSON_TERM_GROUPS = (
    (
        "human and JSON `search` / `show` / `examples` output",
        "human / JSON corpus discovery output",
        "human/JSON `search` / `show` / `examples` 출력",
        "human / JSON corpus discovery 출력",
    ),
)
RELEASE_ROUTE_JSON_TERM_GROUPS = (
    (
        "route JSON/catalog/stdin",
        "route JSON output, route catalog output, and route stdin input",
        "route recommendation, catalog, and stdin JSON",
        "route JSON/catalog/stdin 출력",
        "route JSON 출력, route catalog 출력, route stdin 입력",
    ),
)
RELEASE_ROUTE_JSON_OUTPUT_TERM_GROUPS = (
    (
        "route JSON output",
        "route JSON 출력",
    ),
)
RELEASE_ROUTE_CATALOG_OUTPUT_TERM_GROUPS = (
    (
        "route catalog output",
        "route catalog 출력",
    ),
)
RELEASE_ROUTE_STDIN_INPUT_TERM_GROUPS = (
    (
        "route stdin input",
        "route stdin 입력",
    ),
)
RELEASE_EXPLICIT_OUTPUT_TERM_GROUPS = (
    (
        "show --lines",
        "`show --lines`",
        "show --lines output",
        "`show --lines` output",
        "show --lines 출력",
        "`show --lines` 출력",
        "show --lines range",
        "show --lines ranges",
        "명시적 `show --lines`",
    ),
    (
        "route --explain",
        "`route --explain`",
        "route --explain output",
        "`route --explain` output",
        "route --explain 출력",
        "`route --explain` 출력",
        "명시적 `route --explain`",
    ),
)
RELEASE_SHOW_LINES_OUTPUT_TERM_GROUPS = (
    (
        "show --lines output",
        "`show --lines` output",
        "show --lines 출력",
        "`show --lines` 출력",
        "show --lines range",
        "show --lines ranges",
    ),
)
RELEASE_ROUTE_EXPLAIN_OUTPUT_TERM_GROUPS = (
    (
        "route --explain output",
        "`route --explain` output",
        "route --explain 출력",
        "`route --explain` 출력",
        "route explanation output",
    ),
)
RELEASE_UNKNOWN_COMMAND_FAILURE_TERM_GROUPS = (
    (
        "unknown command/help/list/search-dir failure",
        "unknown command/help/list/search-dir failures",
        "unknown command, help-topic, list-domain, and search-dir failures",
        (
            "unknown command failure, unknown help-topic failure, "
            "unknown list-domain failure, and unknown search-dir failure"
        ),
        "unknown command/help/list-domain/search-dir failure",
        "unknown command/help/list/search-dir failure 검증",
        "unknown command/help/list-domain/search-dir failure 검증",
        (
            "unknown command failure, unknown help-topic failure, "
            "unknown list-domain failure, unknown search-dir failure"
        ),
    ),
)
RELEASE_UNKNOWN_COMMAND_ONLY_FAILURE_TERM_GROUPS = (
    (
        "unknown command failure",
        "unknown command failures",
    ),
)
RELEASE_UNKNOWN_HELP_TOPIC_FAILURE_TERM_GROUPS = (
    (
        "unknown help-topic failure",
        "unknown help-topic failures",
        "unknown help topic failure",
        "unknown help topic failures",
    ),
)
RELEASE_UNKNOWN_LIST_DOMAIN_FAILURE_TERM_GROUPS = (
    (
        "unknown list-domain failure",
        "unknown list-domain failures",
        "unknown list domain failure",
        "unknown list domain failures",
    ),
)
RELEASE_UNKNOWN_SEARCH_DIR_FAILURE_TERM_GROUPS = (
    (
        "unknown search-dir failure",
        "unknown search-dir failures",
        "unknown search dir failure",
        "unknown search dir failures",
    ),
)
RELEASE_SUGGESTION_FAILURE_TERM_GROUPS = (
    (
        "unknown route-id/option/value suggestion",
        "unknown route-id/option/value suggestion and numeric range failures",
        "unknown route-id/option/value suggestion 및 numeric range failure",
    ),
    (
        "numeric range failure",
        "numeric range failures",
        "numeric range failure 검증",
    ),
)
RELEASE_PROMPT_PACK_OUTPUT_TERM_GROUPS = (
    ("prompt/pack",),
    (
        "forced `--out`",
        "forced output-file",
        "강제 `--out`",
        "강제 output-file",
    ),
    (
        "file-write confirmation",
        "file-write confirmations",
        "`Wrote <path>` confirmation",
        "`Wrote <path>` confirmations",
        "output-file confirmation",
        "output-file confirmations",
    ),
)
RELEASE_PROMPT_PACK_MODE_TERM_GROUPS = (
    (
        "prompt/pack JSON/markdown/from-file/stdin",
        "prompt/pack JSON, markdown, from-file, and stdin",
        "prompt/pack JSON/markdown/from-file/stdin 출력",
    ),
)
RELEASE_CHECK_COMMAND_TERM_GROUPS = (
    (
        "check examples/artifact/stdin/all-routes",
        "check examples, artifact, stdin, and all-routes",
        "check examples/artifact/stdin/all-routes 출력",
    ),
)
RELEASE_INSTALL_HUMAN_TERM_GROUPS = (
    (
        "human `design-ai install`",
        "human install plus",
        "human install plus JSON",
        "human install과 JSON",
        "human install lifecycle",
    ),
)
RELEASE_INSTALL_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai install --json`",),
)
RELEASE_INSTALL_JSON_TERM_GROUPS = (
    (
        "machine-readable install lifecycle output",
        "machine-readable install lifecycle 출력",
    ),
)
RELEASE_STATUS_HUMAN_TERM_GROUPS = (
    (
        "human+JSON status",
        "human+JSON `status`",
        "human/JSON status",
        "human/JSON `status`",
        "human and JSON status",
        "human and JSON `status`",
    ),
)
RELEASE_STATUS_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai status --json`",),
)
RELEASE_STATUS_JSON_TERM_GROUPS = (
    (
        "machine-readable install-state output",
        "machine-readable install-state 출력",
    ),
)
RELEASE_UNINSTALL_HUMAN_TERM_GROUPS = (
    (
        "human `design-ai uninstall`",
        "human uninstall plus",
        "human uninstall plus JSON",
        "human uninstall and JSON",
        "human uninstall, and JSON",
        "human uninstall, JSON",
        "human uninstall과 JSON",
        "human uninstall lifecycle",
    ),
)
RELEASE_UNINSTALL_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai uninstall --json`",),
)
RELEASE_UNINSTALL_JSON_TERM_GROUPS = (
    (
        "machine-readable uninstall lifecycle output",
        "machine-readable uninstall lifecycle 출력",
    ),
)
RELEASE_AUDIT_STRICT_QUIET_TERM_GROUPS = (
    ("audit --strict --quiet", "design-ai audit --strict --quiet"),
)
RELEASE_AUDIT_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai audit --strict --quiet --json`",),
)
RELEASE_AUDIT_JSON_OUTPUT_TERM_GROUPS = (
    (
        "machine-readable repository-audit output",
        "machine-readable repository-audit 출력",
    ),
)
RELEASE_DOCTOR_STRICT_TERM_GROUPS = (
    ("doctor --strict", "design-ai doctor --strict"),
)
RELEASE_DOCTOR_STRICT_COMMAND_TERM_GROUPS = (
    ("`design-ai doctor --strict`",),
)
RELEASE_DOCTOR_HUMAN_DIAGNOSTICS_TERM_GROUPS = (
    ("human diagnostics",),
)
RELEASE_UPDATE_DRY_RUN_TERM_GROUPS = (
    ("update --dry-run", "design-ai update --dry-run"),
)
RELEASE_UPDATE_DRY_RUN_COMMAND_TERM_GROUPS = (
    ("`design-ai update --dry-run`",),
)
RELEASE_UPDATE_DRY_RUN_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai update --dry-run --json`",),
)
RELEASE_UPDATE_DRY_RUN_PLAN_TERM_GROUPS = (
    ("machine-readable update plan",),
)
RELEASE_POLICY_PHRASE_LABELS = (
    "MkDocs warning-policy phrase",
    "local CI command phrase",
    "release check command phrase",
    "packed tarball smoke phrase",
    "package smoke command phrase",
    "packed tarball installed-bin smoke phrase",
    "packed tarball npm exec smoke phrase",
    "public registry npm exec smoke phrase",
    "registry smoke command phrase",
    "package contents command phrase",
    "package contents check phrase",
    "release metadata command phrase",
    "release metadata check phrase",
    "CLI unit test command phrase",
    "CLI unit test phrase",
    "repository audit command phrase",
    "repository audit gate phrase",
    "whitespace check command phrase",
    "whitespace check phrase",
    "release self-test command phrase",
    "release self-test phrase",
    "human version smoke phrase",
    "version JSON command phrase",
    "version JSON metadata phrase",
    "top-level help command phrase",
    "top-level help smoke phrase",
    "help JSON command phrase",
    "help JSON topic catalog phrase",
    "alias smoke phrase",
    "command alias smoke phrase",
    "functional alias smoke phrase",
    "help topic smoke phrase",
    "list JSON catalog phrase",
    "list JSON mode phrase",
    "list catalog domains phrase",
    "corpus discovery JSON phrase",
    "route JSON catalog stdin smoke phrase",
    "route JSON output phrase",
    "route catalog output phrase",
    "route stdin input phrase",
    "show-lines route-explain smoke phrase",
    "show-lines output phrase",
    "route-explain output phrase",
    "unknown command failure smoke phrase",
    "unknown command-only failure phrase",
    "unknown help-topic failure phrase",
    "unknown list-domain failure phrase",
    "unknown search-dir failure phrase",
    "suggestion failure smoke phrase",
    "prompt-pack mode smoke phrase",
    "prompt-pack output smoke phrase",
    "check command smoke phrase",
    "human install lifecycle phrase",
    "install JSON command phrase",
    "install JSON lifecycle phrase",
    "human status lifecycle phrase",
    "status JSON command phrase",
    "status JSON install-state phrase",
    "human uninstall lifecycle phrase",
    "uninstall JSON command phrase",
    "uninstall JSON lifecycle phrase",
    "audit strict-quiet smoke phrase",
    "audit JSON command phrase",
    "audit JSON repository-audit phrase",
    "doctor strict smoke phrase",
    "doctor strict command phrase",
    "doctor human diagnostics phrase",
    "update dry-run lifecycle phrase",
    "update dry-run command phrase",
    "update dry-run JSON command phrase",
    "update dry-run plan phrase",
)
RELEASE_POLICY_PHRASE_CHECKS = (
    ("MkDocs warning-policy phrase", RELEASE_WARNING_POLICY_TERM_GROUPS),
    ("local CI command phrase", RELEASE_LOCAL_CI_COMMAND_TERM_GROUPS),
    ("release check command phrase", RELEASE_CHECK_GATE_TERM_GROUPS),
    ("packed tarball smoke phrase", RELEASE_PACKED_TARBALL_SMOKE_TERM_GROUPS),
    ("package smoke command phrase", RELEASE_PACKAGE_SMOKE_COMMAND_TERM_GROUPS),
    ("packed tarball installed-bin smoke phrase", RELEASE_PACKED_TARBALL_INSTALLED_BIN_TERM_GROUPS),
    ("packed tarball npm exec smoke phrase", RELEASE_PACKED_TARBALL_NPM_EXEC_TERM_GROUPS),
    ("public registry npm exec smoke phrase", RELEASE_PUBLIC_REGISTRY_NPM_EXEC_TERM_GROUPS),
    ("registry smoke command phrase", RELEASE_REGISTRY_SMOKE_COMMAND_TERM_GROUPS),
    ("package contents command phrase", RELEASE_PACKAGE_CONTENTS_COMMAND_TERM_GROUPS),
    ("package contents check phrase", RELEASE_PACKAGE_CONTENTS_TERM_GROUPS),
    ("release metadata command phrase", RELEASE_METADATA_COMMAND_TERM_GROUPS),
    ("release metadata check phrase", RELEASE_METADATA_CHECK_TERM_GROUPS),
    ("CLI unit test command phrase", RELEASE_CLI_UNIT_TEST_COMMAND_TERM_GROUPS),
    ("CLI unit test phrase", RELEASE_CLI_UNIT_TEST_TERM_GROUPS),
    ("repository audit command phrase", RELEASE_REPOSITORY_AUDIT_COMMAND_TERM_GROUPS),
    ("repository audit gate phrase", RELEASE_REPOSITORY_AUDIT_TERM_GROUPS),
    ("whitespace check command phrase", RELEASE_WHITESPACE_COMMAND_TERM_GROUPS),
    ("whitespace check phrase", RELEASE_WHITESPACE_CHECK_TERM_GROUPS),
    ("release self-test command phrase", RELEASE_SELF_TEST_COMMAND_TERM_GROUPS),
    ("release self-test phrase", RELEASE_SELF_TEST_TERM_GROUPS),
    ("human version smoke phrase", RELEASE_HUMAN_VERSION_TERM_GROUPS),
    ("version JSON command phrase", RELEASE_VERSION_JSON_COMMAND_TERM_GROUPS),
    ("version JSON metadata phrase", RELEASE_VERSION_JSON_TERM_GROUPS),
    ("top-level help command phrase", RELEASE_TOP_LEVEL_HELP_COMMAND_TERM_GROUPS),
    ("top-level help smoke phrase", RELEASE_TOP_LEVEL_HELP_TERM_GROUPS),
    ("help JSON command phrase", RELEASE_HELP_JSON_COMMAND_TERM_GROUPS),
    ("help JSON topic catalog phrase", RELEASE_HELP_JSON_TERM_GROUPS),
    ("alias smoke phrase", RELEASE_ALIAS_SMOKE_TERM_GROUPS),
    ("command alias smoke phrase", RELEASE_COMMAND_ALIAS_SMOKE_TERM_GROUPS),
    ("functional alias smoke phrase", RELEASE_FUNCTIONAL_ALIAS_SMOKE_TERM_GROUPS),
    ("help topic smoke phrase", RELEASE_HELP_TOPIC_TERM_GROUPS),
    ("list JSON catalog phrase", RELEASE_LIST_JSON_TERM_GROUPS),
    ("list JSON mode phrase", RELEASE_LIST_JSON_MODE_TERM_GROUPS),
    ("list catalog domains phrase", RELEASE_LIST_CATALOG_DOMAIN_TERM_GROUPS),
    ("corpus discovery JSON phrase", RELEASE_CORPUS_DISCOVERY_JSON_TERM_GROUPS),
    ("route JSON catalog stdin smoke phrase", RELEASE_ROUTE_JSON_TERM_GROUPS),
    ("route JSON output phrase", RELEASE_ROUTE_JSON_OUTPUT_TERM_GROUPS),
    ("route catalog output phrase", RELEASE_ROUTE_CATALOG_OUTPUT_TERM_GROUPS),
    ("route stdin input phrase", RELEASE_ROUTE_STDIN_INPUT_TERM_GROUPS),
    ("show-lines route-explain smoke phrase", RELEASE_EXPLICIT_OUTPUT_TERM_GROUPS),
    ("show-lines output phrase", RELEASE_SHOW_LINES_OUTPUT_TERM_GROUPS),
    ("route-explain output phrase", RELEASE_ROUTE_EXPLAIN_OUTPUT_TERM_GROUPS),
    ("unknown command failure smoke phrase", RELEASE_UNKNOWN_COMMAND_FAILURE_TERM_GROUPS),
    ("unknown command-only failure phrase", RELEASE_UNKNOWN_COMMAND_ONLY_FAILURE_TERM_GROUPS),
    ("unknown help-topic failure phrase", RELEASE_UNKNOWN_HELP_TOPIC_FAILURE_TERM_GROUPS),
    ("unknown list-domain failure phrase", RELEASE_UNKNOWN_LIST_DOMAIN_FAILURE_TERM_GROUPS),
    ("unknown search-dir failure phrase", RELEASE_UNKNOWN_SEARCH_DIR_FAILURE_TERM_GROUPS),
    ("suggestion failure smoke phrase", RELEASE_SUGGESTION_FAILURE_TERM_GROUPS),
    ("prompt-pack mode smoke phrase", RELEASE_PROMPT_PACK_MODE_TERM_GROUPS),
    ("prompt-pack output smoke phrase", RELEASE_PROMPT_PACK_OUTPUT_TERM_GROUPS),
    ("check command smoke phrase", RELEASE_CHECK_COMMAND_TERM_GROUPS),
    ("human install lifecycle phrase", RELEASE_INSTALL_HUMAN_TERM_GROUPS),
    ("install JSON command phrase", RELEASE_INSTALL_JSON_COMMAND_TERM_GROUPS),
    ("install JSON lifecycle phrase", RELEASE_INSTALL_JSON_TERM_GROUPS),
    ("human status lifecycle phrase", RELEASE_STATUS_HUMAN_TERM_GROUPS),
    ("status JSON command phrase", RELEASE_STATUS_JSON_COMMAND_TERM_GROUPS),
    ("status JSON install-state phrase", RELEASE_STATUS_JSON_TERM_GROUPS),
    ("human uninstall lifecycle phrase", RELEASE_UNINSTALL_HUMAN_TERM_GROUPS),
    ("uninstall JSON command phrase", RELEASE_UNINSTALL_JSON_COMMAND_TERM_GROUPS),
    ("uninstall JSON lifecycle phrase", RELEASE_UNINSTALL_JSON_TERM_GROUPS),
    ("audit strict-quiet smoke phrase", RELEASE_AUDIT_STRICT_QUIET_TERM_GROUPS),
    ("audit JSON command phrase", RELEASE_AUDIT_JSON_COMMAND_TERM_GROUPS),
    ("audit JSON repository-audit phrase", RELEASE_AUDIT_JSON_OUTPUT_TERM_GROUPS),
    ("doctor strict smoke phrase", RELEASE_DOCTOR_STRICT_TERM_GROUPS),
    ("doctor strict command phrase", RELEASE_DOCTOR_STRICT_COMMAND_TERM_GROUPS),
    ("doctor human diagnostics phrase", RELEASE_DOCTOR_HUMAN_DIAGNOSTICS_TERM_GROUPS),
    ("update dry-run lifecycle phrase", RELEASE_UPDATE_DRY_RUN_TERM_GROUPS),
    ("update dry-run command phrase", RELEASE_UPDATE_DRY_RUN_COMMAND_TERM_GROUPS),
    ("update dry-run JSON command phrase", RELEASE_UPDATE_DRY_RUN_JSON_COMMAND_TERM_GROUPS),
    ("update dry-run plan phrase", RELEASE_UPDATE_DRY_RUN_PLAN_TERM_GROUPS),
)
RELEASE_METADATA_SUMMARY_KEYS = (
    "version",
    "plugin_version",
    "changelog_version",
    "changelog_date",
    "roadmap_entry_found",
    "audit_count",
    "release_policy_docs_checked",
    "errors",
)


def load_json_input(label: str, path: Path) -> tuple[dict, list[str]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}, [f"release metadata input is missing: {label} ({path})"]
    except json.JSONDecodeError as exc:
        return {}, [
            "release metadata input is invalid JSON: "
            f"{label} ({path}): line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ]
    except OSError as exc:
        return {}, [f"release metadata input cannot be read: {label} ({path}): {exc}"]

    if not isinstance(data, dict):
        return {}, [f"release metadata input must be a JSON object: {label} ({path})"]
    return data, []


def load_text_input(label: str, path: Path) -> tuple[str, list[str]]:
    try:
        return path.read_text(encoding="utf-8"), []
    except FileNotFoundError:
        return "", [f"release metadata input is missing: {label} ({path})"]
    except OSError as exc:
        return "", [f"release metadata input cannot be read: {label} ({path}): {exc}"]


def load_release_policy_docs(
    policy_doc_paths: tuple[tuple[str, Path], ...] = RELEASE_POLICY_DOC_PATHS,
) -> tuple[dict[str, str], list[str]]:
    docs: dict[str, str] = {}
    errors: list[str] = []
    for label, path in policy_doc_paths:
        try:
            docs[label] = path.read_text(encoding="utf-8")
        except FileNotFoundError:
            errors.append(f"release policy docs required file is missing on disk: {label} ({path})")
        except OSError as exc:
            errors.append(f"release policy docs required file cannot be read: {label} ({path}): {exc}")
    return docs, errors


def load_audit_count(text: str | None = None, path: Path = RUN_ALL) -> tuple[int | None, list[str]]:
    source = "tools/audit/run-all.py" if path == RUN_ALL else str(path)
    if text is None:
        try:
            run_all_text = path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return None, [f"release metadata audit count source is missing: {source} ({path})"]
        except OSError as exc:
            return None, [f"release metadata audit count source cannot be read: {source} ({path}): {exc}"]
    else:
        run_all_text = text

    match = re.search(
        r"AUDITS: tuple\[AuditSpec, \.\.\.\] = \(\n(?P<body>.*?)\n\)\n\n\n@dataclass",
        run_all_text,
        re.DOTALL,
    )
    if not match:
        return None, [f"release metadata audit count source is missing AUDITS tuple: {source}"]
    scripts = AUDIT_SCRIPT_RE.findall(match.group("body"))
    if not scripts:
        return None, [f"release metadata audit count source has no audit script entries: {source}"]
    return len(scripts), []


def first_changelog_entry(changelog_text: str) -> tuple[re.Match[str] | None, str]:
    match = CHANGELOG_HEADER_RE.search(changelog_text)
    if not match:
        return None, ""

    next_match = CHANGELOG_HEADER_RE.search(changelog_text, match.end())
    end = next_match.start() if next_match else len(changelog_text)
    return match, changelog_text[match.start():end]


def roadmap_entry_for_version(roadmap_text: str, version: str) -> str:
    for match in ROADMAP_HEADER_RE.finditer(roadmap_text):
        if match.group("version") != version:
            continue
        next_match = ROADMAP_HEADER_RE.search(roadmap_text, match.end())
        end = next_match.start() if next_match else len(roadmap_text)
        return roadmap_text[match.start():end]
    return ""


def validate_month(month: str) -> bool:
    return 1 <= int(month) <= 12


def audit_count_errors(label: str, entry: str, expected_count: int | None) -> list[str]:
    if expected_count is None:
        return []

    errors: list[str] = []
    mentions = [(int(match.group("count")), match.group(0)) for match in AUDIT_COUNT_RE.finditer(entry)]
    if not mentions:
        return [f"{label} is missing an audit-count verification statement"]

    for count, phrase in mentions:
        if count != expected_count:
            errors.append(f"{label} audit count mismatch: {phrase} != All {expected_count} audits pass")
    return errors


def required_section_errors(label: str, entry: str, sections: tuple[str, ...]) -> list[str]:
    return [f"{label} is missing required section: {section}" for section in sections if section not in entry]


def release_policy_phrase_table_errors(
    phrase_checks: tuple[tuple[str, tuple[tuple[str, ...], ...]], ...] = RELEASE_POLICY_PHRASE_CHECKS,
) -> list[str]:
    errors: list[str] = []
    labels = tuple(label for label, _ in phrase_checks)
    if labels != RELEASE_POLICY_PHRASE_LABELS:
        expected = ", ".join(RELEASE_POLICY_PHRASE_LABELS)
        actual = ", ".join(labels)
        errors.append(
            f"release policy phrase guard labels mismatch: expected {expected}; got {actual}"
        )
    if len(labels) != len(set(labels)):
        errors.append("release policy phrase guard labels must be unique")

    for label, term_groups in phrase_checks:
        if not isinstance(label, str) or not label:
            errors.append("release policy phrase guard label must be a non-empty string")
        if not isinstance(term_groups, tuple) or not term_groups:
            errors.append(f"release policy phrase guard has no term groups: {label}")
            continue
        for term_group in term_groups:
            if not isinstance(term_group, tuple) or not term_group:
                errors.append(f"release policy phrase guard has an empty term group: {label}")
                continue
            for term in term_group:
                if not isinstance(term, str) or not term:
                    errors.append(f"release policy phrase guard has an invalid term: {label}")
    return errors


def release_policy_phrase_doc_errors(label: str, text: str) -> list[str]:
    errors: list[str] = []
    normalized = text.casefold()
    for phrase_label, term_groups in RELEASE_POLICY_PHRASE_CHECKS:
        for term_group in term_groups:
            if not any(term.casefold() in normalized for term in term_group):
                expected = " or ".join(term_group)
                errors.append(f"{label} is missing {phrase_label}: {expected}")
    return errors


def release_policy_doc_set_errors(release_policy_docs: dict[str, str]) -> list[str]:
    required_labels = set(REQUIRED_RELEASE_POLICY_DOC_LABELS)
    missing_errors = [
        f"release policy docs missing required file: {label}"
        for label in REQUIRED_RELEASE_POLICY_DOC_LABELS
        if label not in release_policy_docs
    ]
    unexpected_errors = [
        f"release policy docs contains unexpected file: {label}"
        for label in release_policy_docs
        if label not in required_labels
    ]
    errors = missing_errors + unexpected_errors
    actual_labels = tuple(release_policy_docs)
    if not errors and actual_labels != REQUIRED_RELEASE_POLICY_DOC_LABELS:
        expected = ", ".join(REQUIRED_RELEASE_POLICY_DOC_LABELS)
        actual = ", ".join(actual_labels)
        errors.append(f"release policy docs order mismatch: expected {expected}; got {actual}")
    return errors


def release_metadata_summary(
    *,
    package_json: dict,
    plugin_json: dict,
    changelog_text: str,
    roadmap_text: str,
    release_policy_docs: dict[str, str],
    audit_count: int | None,
) -> dict:
    errors: list[str] = []
    version = package_json.get("version")
    plugin_version = plugin_json.get("version")

    if not isinstance(version, str) or not version:
        errors.append("package.json version is missing")
        version = ""
    if plugin_version != version:
        errors.append(f"plugin manifest version mismatch: {plugin_version} != {version}")

    changelog_match, changelog_entry = first_changelog_entry(changelog_text)
    changelog_version = changelog_match.group("version") if changelog_match else None
    changelog_date = changelog_match.group("date") if changelog_match else None
    if not changelog_match:
        errors.append("CHANGELOG.md top entry is missing a vX.Y.Z release heading")
    else:
        if changelog_version != version:
            errors.append(f"CHANGELOG.md top version mismatch: {changelog_version} != {version}")
        if not validate_month(changelog_match.group("month")):
            errors.append(f"CHANGELOG.md top release month is invalid: {changelog_date}")

    if changelog_entry:
        errors.extend(
            required_section_errors(
                "CHANGELOG.md top entry",
                changelog_entry,
                ("### Verified", "### Versions", "### What this enables"),
            )
        )
        version_bump = VERSION_BUMP_RE.search(changelog_entry)
        if not version_bump:
            errors.append("CHANGELOG.md top entry is missing package/plugin version bump line")
        elif version_bump.group("to") != version:
            errors.append(
                "CHANGELOG.md top entry version bump target mismatch: "
                f"{version_bump.group('to')} != {version}"
            )
        errors.extend(audit_count_errors("CHANGELOG.md top entry", changelog_entry, audit_count))

    roadmap_entry = roadmap_entry_for_version(roadmap_text, version)
    if not roadmap_entry:
        errors.append(f"docs/ROADMAP.md is missing a current release entry for v{version}")
    else:
        errors.extend(
            required_section_errors(
                "docs/ROADMAP.md current entry",
                roadmap_entry,
                ("### Verified", "### Versions", "### What this enables", "### What's still ahead"),
            )
        )
        errors.extend(audit_count_errors("docs/ROADMAP.md current entry", roadmap_entry, audit_count))

    errors.extend(release_policy_doc_set_errors(release_policy_docs))
    for label, text in release_policy_docs.items():
        errors.extend(release_policy_phrase_doc_errors(label, text))

    return {
        "version": version,
        "plugin_version": plugin_version,
        "changelog_version": changelog_version,
        "changelog_date": changelog_date,
        "roadmap_entry_found": bool(roadmap_entry),
        "audit_count": audit_count,
        "release_policy_docs_checked": list(release_policy_docs),
        "errors": errors,
    }


def assert_condition(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"self-test failed: {message}")


def format_human_summary(summary: dict) -> str:
    if summary["errors"]:
        return "\n".join(["Release metadata check failed:"] + [f"- {error}" for error in summary["errors"]])

    audit_count = summary["audit_count"] if summary["audit_count"] is not None else "unknown"
    return (
        "Release metadata check passed: "
        f"v{summary['version']}, "
        f"{audit_count} audits, "
        f"CHANGELOG {summary['changelog_date']}"
    )


def format_json_summary(summary: dict) -> str:
    return json.dumps(summary, ensure_ascii=False, indent=2)


def run_self_test() -> int:
    package_json = {"version": "1.2.3"}
    plugin_json = {"version": "1.2.3"}
    changelog = """# Changelog

## v1.2.3 — Fixture release (2026-05)

### Verified
- All 8 audits pass.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 1.2.2 → 1.2.3.

### What this enables
- Fixture release metadata can be verified.

## v1.2.2 — Previous release (2026-04)
"""
    roadmap = """# Roadmap

## Phase 99 — Fixture release (v1.2.3) ✓ shipped

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 1.2.2 → 1.2.3.

### Verified
- All 8 audits pass.

### What this enables
- Fixture roadmap metadata can be verified.

### What's still ahead
- Continue fixture hardening.
"""
    english_policy_doc = """# Distribution

Before tagging any release, the release workflow runs `npm run release:check`
as the core automated gate and `npm run ci:local`, including the MkDocs warning policy
that allows only intentional `refs/` source-link warnings and caps refs-only
warnings at the accepted baseline. It also smoke-tests human `design-ai version` output,
the packed-tarball smoke gate that covers the packed-tarball installed-bin path,
`npm run package:smoke` for installed-bin and one-shot npm exec package coverage,
the one-shot `npm exec --package <tarball>` packed-tarball path,
the public `npm exec --package @design-ai/cli@<version>` registry path,
and after npm publish completes, `npm run registry:smoke` verifies the public install path,
and `npm run package:check` package contents check,
`npm run release:metadata` release metadata check,
`npm test` CLI unit tests,
`npm run audit:strict` all 8 audits,
`git diff --check` whitespace checks,
`npm run release:self-test` release assertion self-tests,
human/JSON `design-ai audit --strict --quiet` output, `design-ai help` top-level help output,
`design-ai audit --strict --quiet --json` for machine-readable repository-audit output,
`design-ai help --json` topic catalog output,
command alias help and functional alias output,
command-specific help topic output,
all three `list` catalog domains in human and JSON mode,
human / JSON corpus discovery output,
route JSON output, route catalog output, and route stdin input,
explicit `show --lines` output and `route --explain` output,
unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure,
unknown route-id/option/value suggestion and numeric range failures,
prompt/pack JSON/markdown/from-file/stdin output,
prompt/pack forced `--out` overwrites plus file-write confirmations,
check examples/artifact/stdin/all-routes output,
`design-ai version --json` for machine-readable CLI/plugin version metadata,
human install plus `design-ai install --json`
for machine-readable install lifecycle output, human+JSON status output,
`design-ai status --json` for machine-readable install-state output, and
human uninstall plus `design-ai uninstall --json`
for machine-readable uninstall lifecycle output. It also checks human
`design-ai update --dry-run` output and `design-ai update --dry-run --json`
machine-readable update plan before mutating lifecycle commands, plus
`design-ai doctor --strict` human diagnostics before release.
"""
    korean_policy_doc = """# Distribution Korean

태그 전에는 `npm run release:check` core gate와 `npm run ci:local`을 실행해요.
`npm run ci:local`은 MkDocs 경고 정책을 확인해요. non-`refs/` warning은
차단하고, 의도된 `refs/` 소스 링크와 refs-only warning은 승인된 기준선
안에 있어야 해요. human `design-ai version` 출력도 smoke test하고,
packed-tarball installed-bin 경로도 확인하고,
`npm run package:smoke`로 installed-bin과 one-shot npm exec package smoke를 확인하고,
npm exec --package <tarball> 경로도 packed-tarball smoke로 확인하고,
공개 npm registry package를 `npm exec --package @design-ai/cli@<version>` 경로로 확인하고,
npm publish가 끝난 뒤 `npm run registry:smoke`로 공개 설치 경로도 확인하고,
`npm run package:check` package contents check도 확인하고,
`npm run release:metadata` release metadata 검증도 확인하고,
`npm test` CLI unit test 실행도 확인하고,
`npm run audit:strict` 8개 audit도 확인하고,
`git diff --check` whitespace check 검증도 확인하고,
`npm run release:self-test` release self-test 검증도 확인하고,
human/JSON `design-ai audit --strict --quiet` 출력도
smoke test하고, `design-ai audit --strict --quiet --json`으로
machine-readable repository-audit output도 확인하며, `design-ai help` top-level help 출력도 확인하며,
`design-ai help --json` topic catalog output도 확인하며,
command alias help와 functional alias 출력도 확인해요.
command-specific help topic 출력도 확인해요.
세 가지 `list` catalog domain의 human/JSON 출력도 확인해요.
human / JSON corpus discovery 출력도 확인해요.
route JSON 출력, route catalog 출력, route stdin 입력도 확인해요.
명시적 `show --lines` 출력과 `route --explain` 출력도 확인해요.
unknown command failure, unknown help-topic failure, unknown list-domain failure, unknown search-dir failure 검증도 확인해요.
unknown route-id/option/value suggestion 및 numeric range failure도 확인해요.
prompt/pack JSON/markdown/from-file/stdin 출력도 확인해요.
prompt/pack 강제 `--out` overwrite와 file-write confirmation도 확인해요.
check examples/artifact/stdin/all-routes 출력도 확인해요.
`design-ai version --json`으로 machine-readable version metadata도 smoke test해요.
human install과 JSON `design-ai install --json`으로 machine-readable install lifecycle output을 확인하고,
human+JSON `status` 출력도 확인하며,
`design-ai status --json`으로 machine-readable install-state output도 uninstall 전에 확인하고,
human uninstall과 JSON `design-ai uninstall --json`으로 machine-readable uninstall lifecycle output도 확인해요.
human `design-ai update --dry-run` 출력과 `design-ai update --dry-run --json`
machine-readable update plan도 mutating lifecycle command 전에 확인하고,
`design-ai doctor --strict` human diagnostics도 release 전에 확인해요.
"""
    release_policy_docs = {
        "README.md": english_policy_doc,
        "README.ko.md": korean_policy_doc,
        "docs/RELEASE-CHECKLIST.md": english_policy_doc,
        "docs/DISTRIBUTION.md": english_policy_doc,
        "docs/DISTRIBUTION.ko.md": korean_policy_doc,
    }
    passing = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
    )
    assert_condition(passing["errors"] == [], "complete fixture should pass without errors")
    assert_condition(
        passing["release_policy_docs_checked"] == list(REQUIRED_RELEASE_POLICY_DOC_LABELS),
        "complete fixture should report the required release policy docs in order",
    )
    assert_condition(
        tuple(passing) == RELEASE_METADATA_SUMMARY_KEYS,
        "complete fixture should preserve the release metadata summary key order",
    )
    passing_json_output = format_json_summary(passing)
    assert_condition(
        json.loads(passing_json_output) == passing,
        "JSON formatter should round-trip the release metadata summary",
    )
    assert_condition(
        '"release_policy_docs_checked": [\n    "README.md",' in passing_json_output,
        "JSON formatter should preserve readable indentation and checked-doc order",
    )
    assert_condition(
        format_human_summary(passing) == "Release metadata check passed: v1.2.3, 8 audits, CHANGELOG 2026-05",
        "human formatter should preserve the passing release metadata summary",
    )
    assert_condition(
        release_policy_phrase_table_errors() == [],
        "release policy phrase guard table should be well formed",
    )
    missing_phrase_table_errors = "\n".join(
        release_policy_phrase_table_errors(RELEASE_POLICY_PHRASE_CHECKS[:-1])
    )
    assert_condition(
        "release policy phrase guard labels mismatch" in missing_phrase_table_errors,
        "release policy phrase guard table should fail if a phrase label drops out",
    )
    duplicate_phrase_checks = RELEASE_POLICY_PHRASE_CHECKS + (RELEASE_POLICY_PHRASE_CHECKS[0],)
    duplicate_phrase_table_errors = "\n".join(
        release_policy_phrase_table_errors(duplicate_phrase_checks)
    )
    assert_condition(
        "release policy phrase guard labels must be unique" in duplicate_phrase_table_errors,
        "release policy phrase guard table should fail duplicate labels",
    )
    empty_group_table_errors = "\n".join(
        release_policy_phrase_table_errors((("fixture phrase", ((),)),))
    )
    assert_condition(
        "release policy phrase guard has an empty term group" in empty_group_table_errors,
        "release policy phrase guard table should fail empty term groups",
    )
    invalid_phrase_table_errors = "\n".join(
        release_policy_phrase_table_errors((("fixture phrase", (("",),)),))
    )
    assert_condition(
        "release policy phrase guard has an invalid term" in invalid_phrase_table_errors,
        "release policy phrase guard table should fail invalid terms",
    )

    failing = release_metadata_summary(
        package_json=package_json,
        plugin_json={"version": "1.2.2"},
        changelog_text=changelog.replace("All 8 audits pass.", "All 7 audits pass."),
        roadmap_text=roadmap.replace("(v1.2.3)", "(v1.2.2)"),
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace("accepted baseline", "accepted policy"),
        },
        audit_count=8,
    )
    joined_errors = "\n".join(failing["errors"])
    assert_condition("plugin manifest version mismatch" in joined_errors, "plugin mismatch should fail")
    assert_condition("CHANGELOG.md top entry audit count mismatch" in joined_errors, "stale audit count should fail")
    assert_condition("docs/ROADMAP.md is missing a current release entry" in joined_errors, "missing roadmap entry should fail")
    assert_condition("docs/DISTRIBUTION.md" in joined_errors, "distribution warning policy drift should fail")
    failing_human_output = format_human_summary(failing)
    assert_condition(
        failing_human_output.startswith("Release metadata check failed:\n- "),
        "human formatter should print failed summaries as bullet-prefixed errors",
    )
    assert_condition(
        "- plugin manifest version mismatch: 1.2.2 != 1.2.3" in failing_human_output,
        "human formatter should include structured validation errors",
    )
    korean_error_json = format_json_summary({**passing, "errors": ["MkDocs 경고 정책 누락"]})
    assert_condition(
        "MkDocs 경고 정책 누락" in korean_error_json and "\\u" not in korean_error_json,
        "JSON formatter should keep Korean structured errors readable",
    )

    local_ci_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace("npm run ci:local", "npm run release:check"),
        },
        audit_count=8,
    )
    local_ci_command_drift_errors = "\n".join(local_ci_command_drift["errors"])
    assert_condition(
        "README.md is missing local CI command phrase" in local_ci_command_drift_errors,
        "release policy docs should mention ci:local command guidance",
    )

    release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run release:check`",
                "the release command sequence",
            ),
        },
        audit_count=8,
    )
    release_check_drift_errors = "\n".join(release_check_drift["errors"])
    assert_condition(
        "README.md is missing release check command phrase" in release_check_drift_errors,
        "release policy docs should mention release:check command guidance",
    )

    packed_tarball_installed_bin_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "the packed-tarball installed-bin path",
                "the packed tarball command path",
            ).replace(
                "installed-bin and one-shot npm exec package coverage",
                "local package execution coverage",
            ),
        },
        audit_count=8,
    )
    packed_tarball_installed_bin_drift_errors = "\n".join(
        packed_tarball_installed_bin_drift["errors"]
    )
    assert_condition(
        "README.md is missing packed tarball installed-bin smoke phrase"
        in packed_tarball_installed_bin_drift_errors,
        "release policy docs should mention packed-tarball installed-bin smoke",
    )

    packed_tarball_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "the packed-tarball smoke gate",
                "the package runtime gate",
            ),
        },
        audit_count=8,
    )
    packed_tarball_smoke_drift_errors = "\n".join(packed_tarball_smoke_drift["errors"])
    assert_condition(
        "README.md is missing packed tarball smoke phrase" in packed_tarball_smoke_drift_errors,
        "release policy docs should mention packed-tarball smoke",
    )

    package_smoke_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run package:smoke`",
                "the package smoke command",
            ),
        },
        audit_count=8,
    )
    package_smoke_command_drift_errors = "\n".join(package_smoke_command_drift["errors"])
    assert_condition(
        "README.md is missing package smoke command phrase" in package_smoke_command_drift_errors,
        "release policy docs should mention package:smoke command guidance",
    )

    packed_tarball_npm_exec_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "one-shot `npm exec --package <tarball>`",
                "one-shot package exec",
            ).replace(
                "installed-bin and one-shot npm exec package coverage",
                "installed-bin package coverage",
            ),
        },
        audit_count=8,
    )
    packed_tarball_npm_exec_drift_errors = "\n".join(packed_tarball_npm_exec_drift["errors"])
    assert_condition(
        "README.md is missing packed tarball npm exec smoke phrase"
        in packed_tarball_npm_exec_drift_errors,
        "release policy docs should mention packed-tarball npm exec smoke",
    )

    public_registry_npm_exec_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public `npm exec --package @design-ai/cli@<version>` registry path",
                "public registry install path",
            ),
        },
        audit_count=8,
    )
    public_registry_npm_exec_drift_errors = "\n".join(public_registry_npm_exec_drift["errors"])
    assert_condition(
        "README.md is missing public registry npm exec smoke phrase"
        in public_registry_npm_exec_drift_errors,
        "release policy docs should mention public registry npm exec smoke",
    )

    registry_smoke_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run registry:smoke`",
                "the registry smoke command",
            ),
        },
        audit_count=8,
    )
    registry_smoke_command_drift_errors = "\n".join(registry_smoke_command_drift["errors"])
    assert_condition(
        "README.md is missing registry smoke command phrase"
        in registry_smoke_command_drift_errors,
        "release policy docs should mention registry:smoke command guidance",
    )

    package_contents_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run package:check`",
                "the package contents command",
            ),
        },
        audit_count=8,
    )
    package_contents_command_drift_errors = "\n".join(package_contents_command_drift["errors"])
    assert_condition(
        "README.md is missing package contents command phrase"
        in package_contents_command_drift_errors,
        "release policy docs should mention package:check command guidance",
    )

    package_contents_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "package contents check",
                "package file review",
            ),
        },
        audit_count=8,
    )
    package_contents_drift_errors = "\n".join(package_contents_drift["errors"])
    assert_condition(
        "README.md is missing package contents check phrase" in package_contents_drift_errors,
        "release policy docs should mention package contents checks",
    )

    release_metadata_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run release:metadata`",
                "the release metadata command",
            ),
        },
        audit_count=8,
    )
    release_metadata_command_drift_errors = "\n".join(release_metadata_command_drift["errors"])
    assert_condition(
        "README.md is missing release metadata command phrase"
        in release_metadata_command_drift_errors,
        "release policy docs should mention release:metadata command guidance",
    )

    release_metadata_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run release:metadata` release metadata check",
                "release manifest review",
            ),
        },
        audit_count=8,
    )
    release_metadata_check_drift_errors = "\n".join(release_metadata_check_drift["errors"])
    assert_condition(
        "README.md is missing release metadata check phrase"
        in release_metadata_check_drift_errors,
        "release policy docs should mention release metadata checks",
    )

    cli_unit_test_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm test`",
                "the CLI test command",
            ),
        },
        audit_count=8,
    )
    cli_unit_test_command_drift_errors = "\n".join(cli_unit_test_command_drift["errors"])
    assert_condition(
        "README.md is missing CLI unit test command phrase" in cli_unit_test_command_drift_errors,
        "release policy docs should mention npm test CLI unit test command guidance",
    )

    cli_unit_test_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "CLI unit tests",
                "CLI checks",
            ),
        },
        audit_count=8,
    )
    cli_unit_test_drift_errors = "\n".join(cli_unit_test_drift["errors"])
    assert_condition(
        "README.md is missing CLI unit test phrase" in cli_unit_test_drift_errors,
        "release policy docs should mention CLI unit tests",
    )

    repository_audit_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run audit:strict`",
                "the repository audit command",
            ),
        },
        audit_count=8,
    )
    repository_audit_command_drift_errors = "\n".join(
        repository_audit_command_drift["errors"]
    )
    assert_condition(
        "README.md is missing repository audit command phrase"
        in repository_audit_command_drift_errors,
        "release policy docs should mention audit:strict command guidance",
    )

    repository_audit_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "all 8 audits",
                "the audit suite",
            ),
        },
        audit_count=8,
    )
    repository_audit_drift_errors = "\n".join(repository_audit_drift["errors"])
    assert_condition(
        "README.md is missing repository audit gate phrase" in repository_audit_drift_errors,
        "release policy docs should mention repository audit gate coverage",
    )

    whitespace_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`git diff --check`",
                "the whitespace command",
            ),
        },
        audit_count=8,
    )
    whitespace_command_drift_errors = "\n".join(whitespace_command_drift["errors"])
    assert_condition(
        "README.md is missing whitespace check command phrase"
        in whitespace_command_drift_errors,
        "release policy docs should mention git diff whitespace check command guidance",
    )

    whitespace_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "whitespace checks",
                "spacing review",
            ),
        },
        audit_count=8,
    )
    whitespace_check_drift_errors = "\n".join(whitespace_check_drift["errors"])
    assert_condition(
        "README.md is missing whitespace check phrase" in whitespace_check_drift_errors,
        "release policy docs should mention whitespace checks",
    )

    release_self_test_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run release:self-test`",
                "the assertion fixture command",
            ),
        },
        audit_count=8,
    )
    release_self_test_command_drift_errors = "\n".join(release_self_test_command_drift["errors"])
    assert_condition(
        "README.md is missing release self-test command phrase"
        in release_self_test_command_drift_errors,
        "release policy docs should mention release:self-test command guidance",
    )

    release_self_test_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`npm run release:self-test` release assertion self-tests",
                "release assertion checks",
            ),
        },
        audit_count=8,
    )
    release_self_test_drift_errors = "\n".join(release_self_test_drift["errors"])
    assert_condition(
        "README.md is missing release self-test phrase" in release_self_test_drift_errors,
        "release policy docs should mention release self-tests",
    )

    human_version_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("human `design-ai version`", "`design-ai version`"),
        },
        audit_count=8,
    )
    human_version_drift_errors = "\n".join(human_version_drift["errors"])
    assert_condition(
        "README.ko.md is missing human version smoke phrase" in human_version_drift_errors,
        "release policy docs should mention human version smoke",
    )

    route_json_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "route JSON output, route catalog output, and route stdin input",
                "route output",
            ),
        },
        audit_count=8,
    )
    route_json_drift_errors = "\n".join(route_json_drift["errors"])
    assert_condition(
        "README.md is missing route JSON catalog stdin smoke phrase" in route_json_drift_errors,
        "release policy docs should mention route JSON catalog stdin smoke",
    )

    route_json_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace("route JSON output", "route output"),
        },
        audit_count=8,
    )
    route_json_output_drift_errors = "\n".join(route_json_output_drift["errors"])
    assert_condition(
        "README.md is missing route JSON output phrase" in route_json_output_drift_errors,
        "release policy docs should mention route JSON output smoke",
    )

    route_catalog_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "route catalog output",
                "route output",
            ),
        },
        audit_count=8,
    )
    route_catalog_output_drift_errors = "\n".join(
        route_catalog_output_drift["errors"]
    )
    assert_condition(
        "README.md is missing route catalog output phrase"
        in route_catalog_output_drift_errors,
        "release policy docs should mention route catalog output smoke",
    )

    route_stdin_input_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("route stdin 입력", "route 입력"),
        },
        audit_count=8,
    )
    route_stdin_input_drift_errors = "\n".join(route_stdin_input_drift["errors"])
    assert_condition(
        "README.ko.md is missing route stdin input phrase"
        in route_stdin_input_drift_errors,
        "release policy docs should mention route stdin input smoke",
    )

    check_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "check examples/artifact/stdin/all-routes",
                "check output",
            ),
        },
        audit_count=8,
    )
    check_command_drift_errors = "\n".join(check_command_drift["errors"])
    assert_condition(
        "docs/DISTRIBUTION.md is missing check command smoke phrase" in check_command_drift_errors,
        "release policy docs should mention check command smoke",
    )

    version_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace(
                "`design-ai version --json`",
                "the JSON version command",
            ),
        },
        audit_count=8,
    )
    version_json_command_drift_errors = "\n".join(version_json_command_drift["errors"])
    assert_condition(
        "README.ko.md is missing version JSON command phrase"
        in version_json_command_drift_errors,
        "release policy docs should mention design-ai version --json command guidance",
    )

    version_json_metadata_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace(
                "machine-readable version metadata",
                "machine-readable version output",
            ),
        },
        audit_count=8,
    )
    version_json_metadata_drift_errors = "\n".join(version_json_metadata_drift["errors"])
    assert_condition(
        "README.ko.md is missing version JSON metadata phrase"
        in version_json_metadata_drift_errors,
        "release policy docs should mention version JSON metadata smoke",
    )

    top_level_help_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace(
                "`design-ai help`",
                "the help command",
            ),
        },
        audit_count=8,
    )
    top_level_help_command_drift_errors = "\n".join(
        top_level_help_command_drift["errors"]
    )
    assert_condition(
        "README.ko.md is missing top-level help command phrase"
        in top_level_help_command_drift_errors,
        "release policy docs should mention design-ai help command guidance",
    )

    top_level_help_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("top-level help 출력", "help 출력"),
        },
        audit_count=8,
    )
    top_level_help_drift_errors = "\n".join(top_level_help_drift["errors"])
    assert_condition(
        "README.ko.md is missing top-level help smoke phrase" in top_level_help_drift_errors,
        "release policy docs should mention top-level help smoke",
    )

    help_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`design-ai help --json`",
                "the JSON help command",
            ),
        },
        audit_count=8,
    )
    help_json_command_drift_errors = "\n".join(help_json_command_drift["errors"])
    assert_condition(
        "README.md is missing help JSON command phrase" in help_json_command_drift_errors,
        "release policy docs should mention design-ai help --json command guidance",
    )

    help_json_topic_catalog_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "topic catalog output",
                "JSON help output",
            ),
        },
        audit_count=8,
    )
    help_json_topic_catalog_drift_errors = "\n".join(
        help_json_topic_catalog_drift["errors"]
    )
    assert_condition(
        "README.md is missing help JSON topic catalog phrase"
        in help_json_topic_catalog_drift_errors,
        "release policy docs should mention help JSON topic catalog smoke",
    )

    alias_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("functional alias 출력", "alias 출력"),
        },
        audit_count=8,
    )
    alias_smoke_drift_errors = "\n".join(alias_smoke_drift["errors"])
    assert_condition(
        "README.ko.md is missing alias smoke phrase" in alias_smoke_drift_errors,
        "release policy docs should mention command and functional alias smoke",
    )

    command_alias_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "command alias help",
                "alias help",
            ),
        },
        audit_count=8,
    )
    command_alias_smoke_drift_errors = "\n".join(
        command_alias_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing command alias smoke phrase"
        in command_alias_smoke_drift_errors,
        "release policy docs should mention command alias smoke",
    )

    functional_alias_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "functional alias output",
                "alias output",
            ),
        },
        audit_count=8,
    )
    functional_alias_smoke_drift_errors = "\n".join(
        functional_alias_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing functional alias smoke phrase"
        in functional_alias_smoke_drift_errors,
        "release policy docs should mention functional alias smoke",
    )

    help_topic_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "command-specific help topic output", "command help output"
            ),
        },
        audit_count=8,
    )
    help_topic_drift_errors = "\n".join(help_topic_drift["errors"])
    assert_condition(
        "README.md is missing help topic smoke phrase" in help_topic_drift_errors,
        "release policy docs should mention command-specific help topic smoke",
    )

    list_json_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("human/JSON 출력", "human 출력"),
        },
        audit_count=8,
    )
    list_json_drift_errors = "\n".join(list_json_drift["errors"])
    assert_condition(
        "README.ko.md is missing list JSON catalog phrase" in list_json_drift_errors,
        "release policy docs should mention list JSON catalog smoke",
    )

    list_json_mode_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("human/JSON 출력", "human 출력"),
        },
        audit_count=8,
    )
    list_json_mode_drift_errors = "\n".join(list_json_mode_drift["errors"])
    assert_condition(
        "README.ko.md is missing list JSON mode phrase"
        in list_json_mode_drift_errors,
        "release policy docs should mention list JSON mode smoke",
    )

    list_catalog_domain_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "all three `list` catalog domains in human and JSON mode",
                "`list --json` output",
            ),
        },
        audit_count=8,
    )
    list_catalog_domain_drift_errors = "\n".join(
        list_catalog_domain_drift["errors"]
    )
    assert_condition(
        "README.md is missing list catalog domains phrase"
        in list_catalog_domain_drift_errors,
        "release policy docs should mention list catalog domain coverage",
    )

    corpus_discovery_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("corpus discovery 출력", "corpus discovery"),
        },
        audit_count=8,
    )
    corpus_discovery_drift_errors = "\n".join(corpus_discovery_drift["errors"])
    assert_condition(
        "README.ko.md is missing corpus discovery JSON phrase" in corpus_discovery_drift_errors,
        "release policy docs should mention corpus discovery JSON smoke",
    )

    explicit_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace("route --explain", "route"),
        },
        audit_count=8,
    )
    explicit_output_drift_errors = "\n".join(explicit_output_drift["errors"])
    assert_condition(
        "README.md is missing show-lines route-explain smoke phrase" in explicit_output_drift_errors,
        "release policy docs should mention show-lines and route-explain smoke",
    )

    show_lines_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`show --lines` output",
                "`show --lines`",
            ),
        },
        audit_count=8,
    )
    show_lines_output_drift_errors = "\n".join(show_lines_output_drift["errors"])
    assert_condition(
        "README.md is missing show-lines output phrase" in show_lines_output_drift_errors,
        "release policy docs should mention show-lines output smoke",
    )

    route_explain_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`route --explain` output",
                "`route --explain`",
            ),
        },
        audit_count=8,
    )
    route_explain_output_drift_errors = "\n".join(route_explain_output_drift["errors"])
    assert_condition(
        "README.md is missing route-explain output phrase" in route_explain_output_drift_errors,
        "release policy docs should mention route-explain output smoke",
    )

    unknown_command_failure_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                (
                    "unknown command failure, unknown help-topic failure, "
                    "unknown list-domain failure, and unknown search-dir failure"
                ),
                "unknown failures",
            ),
        },
        audit_count=8,
    )
    unknown_command_failure_drift_errors = "\n".join(unknown_command_failure_drift["errors"])
    assert_condition(
        "README.md is missing unknown command failure smoke phrase"
        in unknown_command_failure_drift_errors,
        "release policy docs should mention unknown command/help/list/search-dir failure smoke",
    )

    unknown_command_only_failure_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "unknown command failure",
                "unknown failure",
            ),
        },
        audit_count=8,
    )
    unknown_command_only_failure_drift_errors = "\n".join(
        unknown_command_only_failure_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing unknown command-only failure phrase"
            in unknown_command_only_failure_drift_errors
        ),
        "release policy docs should mention unknown command failure smoke",
    )

    unknown_help_topic_failure_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "unknown help-topic failure",
                "unknown help failure",
            ),
        },
        audit_count=8,
    )
    unknown_help_topic_failure_drift_errors = "\n".join(
        unknown_help_topic_failure_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing unknown help-topic failure phrase"
            in unknown_help_topic_failure_drift_errors
        ),
        "release policy docs should mention unknown help-topic failure smoke",
    )

    unknown_list_domain_failure_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "unknown list-domain failure",
                "unknown list failure",
            ),
        },
        audit_count=8,
    )
    unknown_list_domain_failure_drift_errors = "\n".join(
        unknown_list_domain_failure_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing unknown list-domain failure phrase"
            in unknown_list_domain_failure_drift_errors
        ),
        "release policy docs should mention unknown list-domain failure smoke",
    )

    unknown_search_dir_failure_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "unknown search-dir failure",
                "unknown search failure",
            ),
        },
        audit_count=8,
    )
    unknown_search_dir_failure_drift_errors = "\n".join(
        unknown_search_dir_failure_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing unknown search-dir failure phrase"
            in unknown_search_dir_failure_drift_errors
        ),
        "release policy docs should mention unknown search-dir failure smoke",
    )

    suggestion_failure_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace("numeric range failure", "numeric range"),
        },
        audit_count=8,
    )
    suggestion_failure_drift_errors = "\n".join(suggestion_failure_drift["errors"])
    assert_condition(
        "README.ko.md is missing suggestion failure smoke phrase" in suggestion_failure_drift_errors,
        "release policy docs should mention suggestion and numeric range failure smoke",
    )

    prompt_pack_mode_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "prompt/pack JSON/markdown/from-file/stdin",
                "prompt/pack output",
            ),
        },
        audit_count=8,
    )
    prompt_pack_mode_drift_errors = "\n".join(prompt_pack_mode_drift["errors"])
    assert_condition(
        "README.md is missing prompt-pack mode smoke phrase" in prompt_pack_mode_drift_errors,
        "release policy docs should mention prompt/pack mode smoke",
    )

    prompt_pack_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "file-write confirmations", "write confirmations"
            ),
        },
        audit_count=8,
    )
    prompt_pack_output_drift_errors = "\n".join(prompt_pack_output_drift["errors"])
    assert_condition(
        "docs/DISTRIBUTION.md is missing prompt-pack output smoke phrase"
        in prompt_pack_output_drift_errors,
        "release policy docs should mention prompt/pack output-file smoke",
    )

    human_install_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace("human install plus ", "install plus "),
        },
        audit_count=8,
    )
    human_install_drift_errors = "\n".join(human_install_drift["errors"])
    assert_condition(
        "README.md is missing human install lifecycle phrase" in human_install_drift_errors,
        "release policy docs should mention human install lifecycle smoke",
    )

    install_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "`design-ai install --json`",
                "the JSON install command",
            ),
        },
        audit_count=8,
    )
    install_json_command_drift_errors = "\n".join(install_json_command_drift["errors"])
    assert_condition(
        "docs/DISTRIBUTION.md is missing install JSON command phrase"
        in install_json_command_drift_errors,
        "release policy docs should mention design-ai install --json command guidance",
    )

    install_json_lifecycle_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "machine-readable install lifecycle output",
                "machine-readable install output",
            ),
        },
        audit_count=8,
    )
    install_json_lifecycle_drift_errors = "\n".join(
        install_json_lifecycle_drift["errors"]
    )
    assert_condition(
        "docs/DISTRIBUTION.md is missing install JSON lifecycle phrase"
        in install_json_lifecycle_drift_errors,
        "release policy docs should mention install JSON lifecycle smoke",
    )

    human_status_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace("human+JSON status output", "status output"),
        },
        audit_count=8,
    )
    human_status_drift_errors = "\n".join(human_status_drift["errors"])
    assert_condition(
        "README.md is missing human status lifecycle phrase" in human_status_drift_errors,
        "release policy docs should mention human status lifecycle smoke",
    )

    human_uninstall_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "human uninstall plus ",
                "uninstall plus ",
            ),
        },
        audit_count=8,
    )
    human_uninstall_drift_errors = "\n".join(human_uninstall_drift["errors"])
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing human uninstall lifecycle phrase"
        in human_uninstall_drift_errors,
        "release policy docs should mention human uninstall lifecycle smoke",
    )

    uninstall_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "`design-ai uninstall --json`",
                "the JSON uninstall command",
            ),
        },
        audit_count=8,
    )
    uninstall_json_command_drift_errors = "\n".join(
        uninstall_json_command_drift["errors"]
    )
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing uninstall JSON command phrase"
        in uninstall_json_command_drift_errors,
        "release policy docs should mention design-ai uninstall --json command guidance",
    )

    uninstall_json_lifecycle_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "machine-readable uninstall lifecycle output",
                "machine-readable uninstall output",
            ),
        },
        audit_count=8,
    )
    uninstall_json_lifecycle_drift_errors = "\n".join(
        uninstall_json_lifecycle_drift["errors"]
    )
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing uninstall JSON lifecycle phrase"
        in uninstall_json_lifecycle_drift_errors,
        "release policy docs should mention uninstall JSON lifecycle smoke",
    )

    audit_strict_quiet_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.ko.md": korean_policy_doc.replace("audit --strict --quiet", "audit --strict"),
        },
        audit_count=8,
    )
    audit_strict_quiet_drift_errors = "\n".join(audit_strict_quiet_drift["errors"])
    assert_condition(
        "docs/DISTRIBUTION.ko.md is missing audit strict-quiet smoke phrase"
        in audit_strict_quiet_drift_errors,
        "release policy docs should mention audit strict-quiet smoke",
    )

    audit_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "`design-ai audit --strict --quiet --json`",
                "the JSON audit command",
            ),
        },
        audit_count=8,
    )
    audit_json_command_drift_errors = "\n".join(audit_json_command_drift["errors"])
    assert_condition(
        "docs/DISTRIBUTION.md is missing audit JSON command phrase"
        in audit_json_command_drift_errors,
        "release policy docs should mention design-ai audit --strict --quiet --json command guidance",
    )

    audit_json_repository_audit_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "machine-readable repository-audit output",
                "machine-readable audit output",
            ),
        },
        audit_count=8,
    )
    audit_json_repository_audit_drift_errors = "\n".join(
        audit_json_repository_audit_drift["errors"]
    )
    assert_condition(
        "docs/DISTRIBUTION.md is missing audit JSON repository-audit phrase"
        in audit_json_repository_audit_drift_errors,
        "release policy docs should mention audit JSON repository-audit output smoke",
    )

    doctor_strict_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace("doctor --strict", "doctor"),
        },
        audit_count=8,
    )
    doctor_strict_drift_errors = "\n".join(doctor_strict_drift["errors"])
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing doctor strict smoke phrase" in doctor_strict_drift_errors,
        "release policy docs should mention doctor strict smoke",
    )

    doctor_strict_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "`design-ai doctor --strict`",
                "`doctor --strict`",
            ),
        },
        audit_count=8,
    )
    doctor_strict_command_drift_errors = "\n".join(
        doctor_strict_command_drift["errors"]
    )
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing doctor strict command phrase"
        in doctor_strict_command_drift_errors,
        "release policy docs should mention exact design-ai doctor --strict command guidance",
    )

    doctor_human_diagnostics_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "human diagnostics",
                "plain diagnostics",
            ),
        },
        audit_count=8,
    )
    doctor_human_diagnostics_drift_errors = "\n".join(
        doctor_human_diagnostics_drift["errors"]
    )
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing doctor human diagnostics phrase"
        in doctor_human_diagnostics_drift_errors,
        "release policy docs should mention doctor human diagnostics guidance",
    )

    status_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "`design-ai status --json`",
                "the JSON status command",
            ),
        },
        audit_count=8,
    )
    status_json_command_drift_errors = "\n".join(status_json_command_drift["errors"])
    assert_condition(
        "docs/DISTRIBUTION.md is missing status JSON command phrase"
        in status_json_command_drift_errors,
        "release policy docs should mention design-ai status --json command guidance",
    )

    status_json_install_state_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "machine-readable install-state output",
                "machine-readable status output",
            ),
        },
        audit_count=8,
    )
    status_json_install_state_drift_errors = "\n".join(
        status_json_install_state_drift["errors"]
    )
    assert_condition(
        "docs/DISTRIBUTION.md is missing status JSON install-state phrase"
        in status_json_install_state_drift_errors,
        "release policy docs should mention status JSON install-state smoke",
    )

    update_dry_run_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace("update --dry-run", "update"),
        },
        audit_count=8,
    )
    update_dry_run_drift_errors = "\n".join(update_dry_run_drift["errors"])
    assert_condition(
        "README.md is missing update dry-run lifecycle phrase" in update_dry_run_drift_errors,
        "release policy docs should mention update dry-run lifecycle smoke",
    )

    update_dry_run_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`design-ai update --dry-run`",
                "`update --dry-run`",
            ),
        },
        audit_count=8,
    )
    update_dry_run_command_drift_errors = "\n".join(
        update_dry_run_command_drift["errors"]
    )
    assert_condition(
        "README.md is missing update dry-run command phrase"
        in update_dry_run_command_drift_errors,
        "release policy docs should mention exact design-ai update --dry-run command guidance",
    )

    update_dry_run_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`design-ai update --dry-run --json`",
                "`update --dry-run --json`",
            ),
        },
        audit_count=8,
    )
    update_dry_run_json_command_drift_errors = "\n".join(
        update_dry_run_json_command_drift["errors"]
    )
    assert_condition(
        "README.md is missing update dry-run JSON command phrase"
        in update_dry_run_json_command_drift_errors,
        "release policy docs should mention exact design-ai update --dry-run --json command guidance",
    )

    update_dry_run_plan_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "machine-readable update plan",
                "machine-readable update output",
            ),
        },
        audit_count=8,
    )
    update_dry_run_plan_drift_errors = "\n".join(
        update_dry_run_plan_drift["errors"]
    )
    assert_condition(
        "README.md is missing update dry-run plan phrase"
        in update_dry_run_plan_drift_errors,
        "release policy docs should mention machine-readable update plan guidance",
    )

    missing_docs = dict(release_policy_docs)
    missing_docs.pop("README.ko.md")
    missing_doc_summary = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=missing_docs,
        audit_count=8,
    )
    missing_doc_errors = "\n".join(missing_doc_summary["errors"])
    assert_condition(
        "release policy docs missing required file: README.ko.md" in missing_doc_errors,
        "release metadata should fail if a required policy doc drops out of coverage",
    )

    unexpected_docs = {
        **release_policy_docs,
        "docs/UNTRACKED.md": english_policy_doc,
    }
    unexpected_doc_summary = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=unexpected_docs,
        audit_count=8,
    )
    unexpected_doc_errors = "\n".join(unexpected_doc_summary["errors"])
    assert_condition(
        "release policy docs contains unexpected file: docs/UNTRACKED.md" in unexpected_doc_errors,
        "release metadata should fail if an unexpected policy doc enters coverage",
    )

    reordered_docs = {
        "README.md": english_policy_doc,
        "docs/RELEASE-CHECKLIST.md": english_policy_doc,
        "README.ko.md": korean_policy_doc,
        "docs/DISTRIBUTION.md": english_policy_doc,
        "docs/DISTRIBUTION.ko.md": korean_policy_doc,
    }
    reordered_doc_summary = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=reordered_docs,
        audit_count=8,
    )
    reordered_doc_errors = "\n".join(reordered_doc_summary["errors"])
    assert_condition(
        "release policy docs order mismatch" in reordered_doc_errors,
        "release metadata should fail if the policy docs order drifts",
    )

    run_all_fixture = """AUDITS: tuple[AuditSpec, ...] = (
    AuditSpec(name="frontmatter", script="frontmatter-check.py"),
    AuditSpec(name="link", script="link-check.py"),
)


@dataclass
class AuditResult:
    spec=AuditSpec(name="fixture", script="fixture.py")
"""
    assert_condition(
        load_audit_count(run_all_fixture) == (2, []),
        "audit count should parse only the AUDITS tuple and ignore self-test fixtures",
    )
    missing_tuple_count, missing_tuple_errors = load_audit_count("# missing audits tuple\n")
    assert_condition(
        missing_tuple_count is None
        and "release metadata audit count source is missing AUDITS tuple" in "\n".join(missing_tuple_errors),
        "audit count loader should report missing AUDITS tuple without a traceback",
    )
    empty_scripts_fixture = """AUDITS: tuple[AuditSpec, ...] = (
    AuditSpec(name="frontmatter", script="frontmatter"),
)


@dataclass
class AuditResult:
"""
    empty_scripts_count, empty_scripts_errors = load_audit_count(empty_scripts_fixture)
    assert_condition(
        empty_scripts_count is None
        and "release metadata audit count source has no audit script entries" in "\n".join(empty_scripts_errors),
        "audit count loader should report missing script entries without a traceback",
    )

    loaded_docs, load_errors = load_release_policy_docs(
        (
            ("README.md", ROOT / "README.md"),
            ("docs/MISSING-POLICY.md", ROOT / "docs" / "MISSING-POLICY.md"),
        )
    )
    assert_condition("README.md" in loaded_docs, "release policy doc loader should read existing files")
    joined_load_errors = "\n".join(load_errors)
    assert_condition(
        "release policy docs required file is missing on disk: docs/MISSING-POLICY.md" in joined_load_errors,
        "release policy doc loader should report missing files without a traceback",
    )

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        valid_json = temp_path / "valid.json"
        invalid_json = temp_path / "invalid.json"
        valid_text = temp_path / "valid.md"
        valid_json.write_text('{"version": "1.2.3"}', encoding="utf-8")
        invalid_json.write_text('{"version": ', encoding="utf-8")
        valid_text.write_text("# Fixture\n", encoding="utf-8")

        parsed_json, parsed_json_errors = load_json_input("fixture valid JSON", valid_json)
        assert_condition(
            parsed_json == {"version": "1.2.3"} and parsed_json_errors == [],
            "core JSON loader should parse valid JSON objects",
        )
        _, invalid_json_errors = load_json_input("fixture invalid JSON", invalid_json)
        assert_condition(
            "release metadata input is invalid JSON: fixture invalid JSON" in "\n".join(invalid_json_errors),
            "core JSON loader should report invalid JSON without a traceback",
        )
        _, missing_json_errors = load_json_input("fixture missing JSON", temp_path / "missing.json")
        assert_condition(
            "release metadata input is missing: fixture missing JSON" in "\n".join(missing_json_errors),
            "core JSON loader should report missing JSON without a traceback",
        )
        parsed_text, parsed_text_errors = load_text_input("fixture valid text", valid_text)
        assert_condition(
            parsed_text == "# Fixture\n" and parsed_text_errors == [],
            "core text loader should read valid UTF-8 text",
        )
        _, missing_text_errors = load_text_input("fixture missing text", temp_path / "missing.md")
        assert_condition(
            "release metadata input is missing: fixture missing text" in "\n".join(missing_text_errors),
            "core text loader should report missing text without a traceback",
        )
        missing_audit_count, missing_audit_errors = load_audit_count(path=temp_path / "missing-run-all.py")
        assert_condition(
            missing_audit_count is None
            and "release metadata audit count source is missing" in "\n".join(missing_audit_errors),
            "audit count loader should report missing run-all.py without a traceback",
        )

    print("Release metadata self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print machine-readable summary")
    parser.add_argument("--self-test", action="store_true", help="Run local fixture checks")
    args = parser.parse_args()

    if args.self_test:
        return run_self_test()

    release_policy_docs, release_policy_doc_load_errors = load_release_policy_docs()
    package_json, package_json_errors = load_json_input("package.json", PACKAGE_JSON)
    plugin_json, plugin_json_errors = load_json_input(".claude-plugin/plugin.json", PLUGIN_JSON)
    changelog_text, changelog_errors = load_text_input("CHANGELOG.md", CHANGELOG)
    roadmap_text, roadmap_errors = load_text_input("docs/ROADMAP.md", ROADMAP)
    audit_count, audit_count_load_errors = load_audit_count()
    summary = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog_text,
        roadmap_text=roadmap_text,
        release_policy_docs=release_policy_docs,
        audit_count=audit_count,
    )
    summary["errors"] = (
        package_json_errors
        + plugin_json_errors
        + changelog_errors
        + roadmap_errors
        + release_policy_doc_load_errors
        + audit_count_load_errors
        + summary["errors"]
    )

    if args.json:
        print(format_json_summary(summary))
    else:
        print(format_human_summary(summary))

    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
