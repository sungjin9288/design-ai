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
PRODUCT_READINESS = ROOT / "docs" / "PRODUCT-READINESS.md"
RUN_ALL = ROOT / "tools" / "audit" / "run-all.py"
CANONICAL_REPOSITORY_SLUG = "sungjin9288/design-ai"
CANONICAL_REPOSITORY_URL = f"https://github.com/{CANONICAL_REPOSITORY_SLUG}"
STALE_REPOSITORY_SLUG = "sungjin/design-ai"
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
PRODUCT_READINESS_WARNING_STRICT_COMPARE_TERM_GROUPS = (
    (
        "warning-state Website Console bundle-compare strict smoke coverage",
        "warning-state bundle-compare strict smoke coverage",
        "warning-state Website Console bundle-compare strict failures",
        "warning-state bundle-compare strict failures",
    ),
    (
        "identical warning bundles",
        "`sameBundle: true`",
        "sameBundle: true",
    ),
    (
        "exiting non-zero under `--strict`",
        "non-zero under `--strict`",
        "strict non-zero",
    ),
    (
        "public registry",
        "published-package",
        "post-publish",
    ),
)
PRODUCT_READINESS_MCP_PROBE_COUNT_SELF_TEST_TERM_GROUPS = (
    (
        "Website Console MCP probe count self-test coverage",
        "package/shared smoke self-test coverage for Website Console MCP probe counts",
        "MCP probe count self-test coverage",
    ),
    (
        "MCP probe count telemetry",
        "mcpProbeCounts",
    ),
    (
        "package smoke self-test",
        "shared smoke assertion self-test",
        "self-test coverage",
    ),
)
PRODUCT_READINESS_MCP_PROBES_PAYLOAD_TERM_GROUPS = (
    (
        "bundled Website Console `mcp-probes.json` saved probe evidence payload",
        "bundled Website Console mcp-probes.json saved probe evidence payload",
        "Website Console bundle `mcp-probes.json` saved probe evidence payload",
        "bundle mcp-probes.json saved probe evidence payload",
    ),
    (
        "instead of the full `site --mcp-check --probes --json` response",
        "not the full `site --mcp-check --probes --json` response",
        "not the full site --mcp-check --probes --json response",
    ),
)
PRODUCT_READINESS_MCP_PROBES_RELEASE_CHECK_TERM_GROUPS = (
    (
        "`npm run release:check` now passes",
        "`npm run release:check` passes",
        "npm run release:check now passes",
        "release:check now passes",
    ),
    (
        "Website Console bundle `mcp-probes.json` saved-payload guard phases",
        "Website Console bundle mcp-probes.json saved-payload guard phases",
        "mcp-probes.json saved-payload guard phases",
    ),
    (
        "packed-tarball smoke",
        "package contents",
        "release self-tests",
    ),
)
PRODUCT_READINESS_BUNDLE_BOUNDARY_METADATA_TERM_GROUPS = (
    (
        "bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata",
        "bundle-check JSON/human plus bundle-handoff JSON/prompt boundary metadata",
        "bundle-check and bundle-handoff boundary metadata",
        "bundle-handoff JSON/prompt boundary metadata",
    ),
    (
        "deterministic-local",
        "no-external-call",
        "no-external-calls",
        "no-external-mcp-calls",
    ),
    (
        "no-target-repo-mutation",
        "targetRepoMutation: false",
        "target repo mutation",
    ),
)
PRODUCT_READINESS_BUNDLE_BOUNDARY_RELEASE_CHECK_TERM_GROUPS = (
    (
        "`npm run release:check` now passes",
        "`npm run release:check` passes",
        "npm run release:check now passes",
        "release:check now passes",
    ),
    (
        "Product Readiness and release-facing policy docs bundle boundary metadata guards",
        "Product Readiness and release-facing policy docs guards for Website Console bundle boundary metadata",
        "bundle boundary metadata guards",
    ),
    (
        "bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata",
        "bundle-check JSON/human plus bundle-handoff JSON/prompt boundary metadata",
        "bundle-check and bundle-handoff boundary metadata",
    ),
    (
        "packed-tarball smoke",
        "package contents",
        "release self-tests",
    ),
)
PRODUCT_READINESS_BUNDLE_BOUNDARY_FULL_RELEASE_CHECK_TERM_GROUPS = (
    (
        "`npm run release:check` now passes",
        "`npm run release:check` passes",
        "npm run release:check now passes",
        "release:check now passes",
    ),
    (
        "full `release:self-test` evidence recording",
        "full release:self-test evidence recording",
        "`release:self-test` evidence recording",
        "release:self-test evidence recording",
    ),
    ("unit tests",),
    ("strict audits",),
    ("whitespace checks",),
    ("package contents",),
    ("release metadata",),
    ("release self-tests",),
    ("packed-tarball smoke",),
)
PRODUCT_READINESS_BUNDLE_BOUNDARY_RELEASE_POLICY_FULL_RELEASE_CHECK_TERM_GROUPS = (
    (
        "release-facing policy docs guard",
        "release-facing policy docs full evidence guard",
        "release-facing policy docs Website Console bundle boundary metadata full",
    ),
    (
        "Website Console bundle boundary metadata full `release:check` evidence",
        "Website Console bundle boundary metadata full release:check evidence",
        "bundle boundary metadata full `release:check` evidence",
    ),
    (
        "`npm run release:check` now passes",
        "`npm run release:check` passes",
        "npm run release:check now passes",
        "release:check now passes",
    ),
)
PRODUCT_READINESS_RELEASE_POLICY_PRODUCT_READINESS_FULL_GATE_RELEASE_CHECK_TERM_GROUPS = (
    (
        "release-facing policy docs Product Readiness release policy full gate evidence guard",
        "release-facing docs and release metadata guard coverage for Product Readiness release policy full gate",
        "Product Readiness release policy full gate evidence guard",
    ),
    (
        "`npm run release:check` now passes",
        "`npm run release:check` passes",
        "npm run release:check now passes",
        "release:check now passes",
    ),
    ("unit tests",),
    ("strict audits",),
    ("whitespace checks",),
    ("package contents",),
    ("release metadata",),
    ("release self-tests",),
    ("packed-tarball smoke",),
)
PRODUCT_READINESS_PHRASE_CHECKS = (
    (
        "product readiness warning strict compare phrase",
        PRODUCT_READINESS_WARNING_STRICT_COMPARE_TERM_GROUPS,
    ),
    (
        "product readiness Website Console MCP probe count self-test phrase",
        PRODUCT_READINESS_MCP_PROBE_COUNT_SELF_TEST_TERM_GROUPS,
    ),
    (
        "product readiness Website Console mcp-probes payload phrase",
        PRODUCT_READINESS_MCP_PROBES_PAYLOAD_TERM_GROUPS,
    ),
    (
        "product readiness Website Console mcp-probes release-check phrase",
        PRODUCT_READINESS_MCP_PROBES_RELEASE_CHECK_TERM_GROUPS,
    ),
    (
        "product readiness Website Console bundle boundary metadata phrase",
        PRODUCT_READINESS_BUNDLE_BOUNDARY_METADATA_TERM_GROUPS,
    ),
    (
        "product readiness Website Console bundle boundary release-check phrase",
        PRODUCT_READINESS_BUNDLE_BOUNDARY_RELEASE_CHECK_TERM_GROUPS,
    ),
    (
        "product readiness Website Console bundle boundary full release-check phrase",
        PRODUCT_READINESS_BUNDLE_BOUNDARY_FULL_RELEASE_CHECK_TERM_GROUPS,
    ),
    (
        "product readiness Website Console bundle boundary release policy full release-check phrase",
        PRODUCT_READINESS_BUNDLE_BOUNDARY_RELEASE_POLICY_FULL_RELEASE_CHECK_TERM_GROUPS,
    ),
    (
        "product readiness release policy Product Readiness full gate release-check phrase",
        PRODUCT_READINESS_RELEASE_POLICY_PRODUCT_READINESS_FULL_GATE_RELEASE_CHECK_TERM_GROUPS,
    ),
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
RELEASE_MCP_PROBES_RELEASE_CHECK_TERM_GROUPS = (
    (
        "Website Console bundle `mcp-probes.json` saved-payload guard phases",
        "Website Console bundle mcp-probes.json saved-payload guard phases",
        "mcp-probes.json saved-payload guard phases",
        "`mcp-probes.json` saved-payload guard 단계",
        "mcp-probes.json saved-payload guard 단계",
    ),
    (
        "`npm run release:check`",
        "npm run release:check",
        "release:check",
    ),
    (
        "packed-tarball smoke",
        "packed tarball smoke",
        "package contents",
        "release self-tests",
    ),
)
RELEASE_BUNDLE_BOUNDARY_RELEASE_CHECK_TERM_GROUPS = (
    (
        "Website Console bundle boundary metadata guard phases",
        "Website Console bundle boundary metadata guard 단계",
        "bundle boundary metadata guard phases",
        "bundle boundary metadata guard 단계",
    ),
    (
        "bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata",
        "bundle-check JSON/human plus bundle-handoff JSON/prompt boundary metadata",
        "bundle-check and bundle-handoff boundary metadata",
    ),
    (
        "`npm run release:check`",
        "npm run release:check",
        "release:check",
    ),
    (
        "packed-tarball smoke",
        "packed tarball smoke",
        "package contents",
        "release self-tests",
    ),
    (
        "full `release:self-test` evidence recording",
        "full release:self-test evidence recording",
        "`release:self-test` evidence recording",
        "release:self-test evidence recording",
    ),
    (
        "unit tests",
        "unit test",
        "CLI unit tests",
        "CLI unit test",
    ),
    (
        "strict audits",
        "strict audit",
        "all 8 audits",
        "8개 audit",
    ),
    (
        "whitespace checks",
        "whitespace check",
    ),
    (
        "release metadata",
        "release metadata checks",
        "release metadata check",
    ),
)
RELEASE_PRODUCT_READINESS_POLICY_FULL_GATE_RELEASE_CHECK_TERM_GROUPS = (
    (
        "Product Readiness release policy full gate guard",
        "Product Readiness guard for release-facing policy docs Website Console bundle boundary metadata full `release:check` evidence",
        "Product Readiness guard for release-facing policy docs Website Console bundle boundary metadata full release:check evidence",
    ),
    (
        "Website Console bundle boundary metadata full `release:check` evidence",
        "Website Console bundle boundary metadata full release:check evidence",
        "bundle boundary metadata full `release:check` evidence",
    ),
    (
        "`npm run release:check`",
        "npm run release:check",
        "release:check",
    ),
    ("unit tests",),
    ("strict audits",),
    ("whitespace checks",),
    ("package contents",),
    ("release metadata",),
    ("release self-tests",),
    ("packed-tarball smoke",),
)
RELEASE_PRODUCT_READINESS_POLICY_FULL_GATE_EVIDENCE_RELEASE_CHECK_TERM_GROUPS = (
    (
        "Product Readiness release policy full gate evidence guard",
        "Product Readiness release policy full gate evidence",
    ),
    (
        "`npm run release:check`",
        "npm run release:check",
        "release:check",
    ),
    ("unit tests",),
    ("strict audits",),
    ("whitespace checks",),
    ("package contents",),
    ("release metadata",),
    ("release self-tests",),
    ("packed-tarball smoke",),
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
RELEASE_LEARN_SIGNALS_STRICT_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai learn --signals --strict --json`",
        "design-ai learn --signals --strict --json",
        "`design-ai learn --signals` learning signal registry coverage for human, JSON, `--strict --json`",
    ),
    (
        "strict gate",
        "strict gate output",
        "strict learning signal",
        "strict learning signal registry",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "installed-bin과 one-shot",
        "one-shot `npm exec --package <tarball>`",
    ),
)
RELEASE_WORKSPACE_STRICT_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai workspace --strict --json`",
        "design-ai workspace --strict --json",
        "workspace --strict --json",
    ),
    (
        "workspace strict failure/success",
        "workspace strict failure and success",
        "strict failure/success readiness",
        "strict failure and clean-success readiness",
        "strict 실패/성공 readiness",
        "strict 실패/성공",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_WORKSPACE_LEARNING_EVAL_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai workspace --learning-eval",
        "design-ai workspace --learning-eval",
        "workspace `--learning-eval` checkpoint",
        "workspace --learning-eval checkpoint",
        "workspace learning-eval summary",
        "workspace learning eval summary",
        "workspace `--learning-eval` checkpoint summary",
    ),
    (
        "checkpoint summaries",
        "checkpoint summary",
        "learning eval checkpoint summaries",
        "learning eval checkpoint summary",
        "learning-eval checkpoint summaries",
        "learning-eval checkpoint summary",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_WORKSPACE_RESTORE_BACKUPS_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "workspace learning restore-backups readiness",
        "workspace restore-backups readiness",
        "workspace restore rollback backup readiness",
        "workspace learning restore rollback backup readiness",
    ),
    (
        "restore rollback backup inventory",
        "learningRestoreBackups",
        "restore-backups inventory",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_JSON_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --json`",
        "design-ai site --stdin --json",
        "site --stdin --json",
    ),
    (
        "Website Console export validation",
        "Website Improvement Console export validation",
        "site JSON validation",
        "Website Console JSON export 검증",
        "Website Console export validation",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_SAMPLE_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --sample`",
        "design-ai site --sample",
        "site --sample",
    ),
    (
        "Website Console sample workspace",
        "Website Improvement sample workspace",
        "site sample workspace",
        "Website Console sample JSON",
        "Website Console sample workspace 생성",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_PROMPT_LIST_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --prompt-list --json`",
        "design-ai site --prompt-list --json",
        "site --prompt-list --json",
    ),
    (
        "Website Console prompt template listing",
        "Website Improvement prompt template listing",
        "site prompt template listing",
        "Website Console prompt template catalog",
        "Website Console prompt template 목록",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_MCP_CHECK_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --mcp-check --json`",
        "design-ai site --stdin --mcp-check --json",
        "site --stdin --mcp-check --json",
        "site --mcp-check --json",
    ),
    (
        "`design-ai site --stdin --mcp-check --probes --json`",
        "design-ai site --stdin --mcp-check --probes --json",
        "site --stdin --mcp-check --probes --json",
        "site --mcp-check --probes --json",
    ),
    (
        "Website Console MCP readiness check",
        "Website Improvement MCP readiness check",
        "site mcp-check JSON",
        "Website Console MCP readiness 검증",
        "Website Console MCP readiness check",
    ),
    (
        "Website Console MCP readiness probe JSON with `--out` file-write confirmation",
        "Website Console MCP readiness probe JSON `--out` file-write confirmation",
        "Website Console MCP readiness probe JSON with --out file-write confirmation",
        "Website Console MCP readiness probe JSON --out file-write confirmation",
        "MCP readiness probe JSON with `--out` file-write confirmation",
        "MCP readiness probe JSON `--out` file-write confirmation",
        "MCP readiness probe JSON with --out file-write confirmation",
        "MCP readiness probe JSON --out file-write confirmation",
        "MCP readiness probe JSON output-file persistence",
        "MCP readiness probe JSON `--out` file 저장 확인",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_MCP_PLAN_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --mcp-plan`",
        "design-ai site --stdin --mcp-plan",
        "site --stdin --mcp-plan",
        "site --mcp-plan",
    ),
    (
        "`design-ai site --stdin --mcp-plan --probes`",
        "design-ai site --stdin --mcp-plan --probes",
        "site --stdin --mcp-plan --probes",
        "site --mcp-plan --probes",
    ),
    (
        "`design-ai site --stdin --mcp-plan --probes --json`",
        "design-ai site --stdin --mcp-plan --probes --json",
        "site --stdin --mcp-plan --probes --json",
        "site --mcp-plan --probes --json",
    ),
    (
        "Website Console MCP action plan",
        "Website Improvement MCP action plan",
        "site mcp-plan Markdown",
        "Website Console MCP action plan",
        "Website Console MCP action plan 생성",
    ),
    (
        "Website Console MCP probe action plan",
        "Website Improvement MCP probe action plan",
        "site mcp-plan probes Markdown",
        "Website Console MCP probe action plan 생성",
    ),
    (
        "Website Console MCP probe action plan JSON",
        "Website Improvement MCP probe action plan JSON",
        "site mcp-plan probes JSON",
        "Website Console MCP probe action plan JSON 생성",
    ),
    (
        "Website Console MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "Website Console MCP probe action plan JSON `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "Website Console MCP probe action plan JSON with --out file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "Website Console MCP probe action plan JSON --out file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON with --out file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON --out file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON output-file persistence",
        "MCP probe action plan JSON `--out` file 저장 확인과 MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_MCP_SHARED_OUTPUT_ASSERTION_TERM_GROUPS = (
    (
        "shared MCP probe output-file smoke assertions",
        "shared MCP probe output-file smoke assertion helpers",
        "shared MCP probe output-file assertion helpers",
        "shared MCP probe JSON output-file smoke assertions",
        "shared MCP probe JSON output-file assertion helpers",
        "공용 MCP probe output-file smoke assertion helper",
        "공용 MCP probe output-file smoke assertions",
    ),
)
RELEASE_SITE_MCP_CHECK_COMMANDS_TERM_GROUPS = (
    (
        "embedded MCP check probe next-step commands",
        "MCP check embedded probe next-step commands",
        "MCP readiness probe embedded next-step commands",
        "embedded MCP readiness probe commands",
        "MCP check 내장 probe next-step commands",
        "MCP readiness probe 내장 next-step commands",
    ),
)
RELEASE_SITE_MCP_CHECK_EXECUTABLE_COMMANDS_TERM_GROUPS = (
    (
        "executable embedded MCP check probe command smoke coverage",
        "embedded MCP check probe command execution smoke coverage",
        "executable MCP readiness probe embedded command smoke coverage",
        "MCP check embedded command execution smoke coverage",
        "MCP check 내장 command 실행 smoke coverage",
        "MCP readiness probe 내장 command 실행 smoke coverage",
    ),
)
RELEASE_SITE_MCP_CHECK_HUMAN_COMMANDS_TERM_GROUPS = (
    (
        "human MCP check probe command guidance and output-file smoke coverage",
        "MCP check probe human command guidance and output-file smoke coverage",
        "MCP check probe human command guidance smoke coverage",
        "MCP readiness probe human command guidance and output-file smoke coverage",
        "MCP readiness probe human command guidance smoke coverage",
        "human-readable MCP check probe command guidance and output-file smoke coverage",
        "human-readable MCP check probe command guidance smoke coverage",
        "human MCP check probe command guidance with `--out` file-write confirmation",
        "MCP check probe human 출력 command guidance",
    ),
)
RELEASE_SITE_MCP_CHECK_HUMAN_OUTPUT_COMMAND_TERM_GROUPS = (
    (
        "embedded MCP check probe human report output command",
        "embedded MCP check probe human report output commands",
        "mcpCheckProbesHumanOut",
        "MCP check probe human report output command",
        "MCP readiness probe human report output command",
        "MCP check 내장 human report output command",
    ),
)
RELEASE_SITE_MCP_ACTION_PLAN_COMMANDS_TERM_GROUPS = (
    (
        "embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP action plan embedded probe output-file commands",
        "MCP action plan probe output-file commands",
        "embedded probe output-file commands",
        "MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
    ),
)
RELEASE_SITE_MCP_ACTION_PLAN_HUMAN_OUTPUT_COMMAND_TERM_GROUPS = (
    (
        "MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP action plan human report output command",
        "MCP action plan JSON human report output command",
        "structured MCP action plan human report output command",
        "mcp-plan human report output command parity",
        "MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage 검증",
    ),
)
RELEASE_SITE_MCP_ACTION_PLAN_HUMAN_OUTPUT_COMMAND_SMOKE_TERM_GROUPS = (
    (
        "MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP action plan emitted human report command execution smoke coverage",
        "MCP action plan JSON emitted human report command smoke coverage",
        "mcp-plan emitted human report command smoke coverage",
        "MCP action plan emitted human report command smoke 검증",
    ),
)
RELEASE_SITE_MCP_ACTION_PLAN_CHECK_JSON_COMMAND_SMOKE_TERM_GROUPS = (
    (
        "MCP action plan emitted check JSON command smoke coverage",
        "MCP action plan emitted check JSON command execution smoke coverage",
        "MCP action plan JSON emitted check JSON command smoke coverage",
        "mcp-plan emitted check JSON command smoke coverage",
        "mcpCheckProbesJsonOut action plan emitted command smoke coverage",
        "MCP action plan emitted check JSON command smoke 검증",
    ),
)
RELEASE_SITE_MCP_ACTION_PLAN_SELF_ARCHIVE_COMMAND_SMOKE_TERM_GROUPS = (
    (
        "MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP action plan emitted self-archive command execution smoke coverage",
        "MCP action plan JSON emitted self-archive command smoke coverage",
        "mcp-plan emitted self-archive command smoke coverage",
        "mcpPlanProbesJsonOut action plan emitted command smoke coverage",
        "MCP action plan emitted self-archive command smoke 검증",
    ),
)
RELEASE_SITE_MCP_ACTION_PLAN_COMMAND_MAPPING_SELF_TEST_TERM_GROUPS = (
    (
        "shared MCP action plan command mapping self-test coverage",
        "MCP action plan command mapping self-test coverage",
        "action-plan emitted command mapping self-test coverage",
        "MCP action plan shared command mapping self-test coverage",
        "MCP action plan command mapping self-test 검증",
    ),
)
RELEASE_SITE_GRAPH_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --graph --json`",
        "design-ai site --stdin --graph --json",
        "site --stdin --graph --json",
        "site --graph --json",
    ),
    (
        "Website Console workflow graph",
        "Website Improvement workflow graph",
        "site workflow graph JSON",
        "Website Console workflow graph export",
        "Website Console workflow graph 생성",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_BUNDLE_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --bundle --out <dir>`",
        "design-ai site --stdin --bundle --out <dir>",
        "site --stdin --bundle --out",
        "site --bundle",
    ),
    (
        "Website Console handoff bundle",
        "Website Improvement handoff bundle",
        "site handoff bundle",
        "handoff bundle",
        "Website Console handoff bundle 생성",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_BUNDLE_CHECK_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site <bundle-dir> --bundle-check --strict --json`",
        "design-ai site <bundle-dir> --bundle-check --strict --json",
        "site --bundle-check --strict --json",
        "site --bundle-check",
    ),
    (
        "Website Console handoff bundle check",
        "Website Improvement handoff bundle check",
        "site bundle-check JSON",
        "Website Console handoff bundle 검증",
    ),
    (
        "SHA-256 checksum",
        "checksum verification",
        "checksum 검증",
        "체크섬 검증",
    ),
    (
        "bundle digest",
        "bundle fingerprint",
        "bundle identity",
        "bundle digest/fingerprint",
        "bundle fingerprint 검증",
        "bundle digest 검증",
    ),
    (
        "generated bundle contract",
        "current CLI bundle contract",
        "generated contract",
        "generated artifact contract",
        "현재 CLI bundle contract",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_BUNDLE_COMPARE_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json`",
        "design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json",
        "site --bundle-compare --strict --json",
        "site --bundle-compare",
    ),
    (
        "Website Console handoff bundle compare",
        "Website Improvement handoff bundle compare",
        "site bundle-compare JSON",
        "Website Console handoff bundle 비교",
    ),
    (
        "bundle digest comparison",
        "bundle fingerprint comparison",
        "bundle identity comparison",
        "bundle digest 비교",
        "bundle fingerprint 비교",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_BUNDLE_COMPARE_WARNING_STRICT_SMOKE_TERM_GROUPS = (
    (
        "warning-state Website Console bundle-compare strict failures",
        "warning-state Website Console bundle-compare strict failure",
        "warning-state bundle-compare strict failures",
        "warning-state bundle-compare strict failure",
        "Website Console bundle-compare warning strict failures",
        "Website Console bundle-compare warning strict failure",
        "Website Console bundle-compare strict warning failures",
        "Website Console bundle-compare strict warning failure",
        "Website Console bundle-compare strict 경고 실패",
    ),
    (
        "identical warning bundles",
        "identical warning bundle",
        "sameBundle true",
        "`sameBundle: true`",
        "sameBundle: true",
        "sameBundle true 유지",
        "동일 warning bundle",
    ),
    (
        "exiting non-zero under `--strict`",
        "exit non-zero under `--strict`",
        "exiting non-zero under --strict",
        "exit non-zero under --strict",
        "non-zero under `--strict`",
        "strict에서 non-zero",
        "strict에서 non-zero 종료",
    ),
    (
        "packed-tarball and public-registry smoke",
        "packed-tarball and public registry smoke",
        "packed-tarball plus public-registry smoke",
        "packed-tarball/public-registry smoke",
        "packed-tarball과 public-registry smoke",
        "packed-tarball 및 public-registry smoke",
    ),
)
RELEASE_SITE_BUNDLE_HANDOFF_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site <bundle-dir> --bundle-handoff --strict --json`",
        "design-ai site <bundle-dir> --bundle-handoff --strict --json",
        "site --bundle-handoff --strict --json",
        "site --bundle-handoff",
    ),
    (
        "Website Console target-repo handoff prompt",
        "Website Improvement target-repo handoff prompt",
        "site bundle-handoff JSON",
        "Website Console target repo handoff prompt",
        "Website Console 대상 repo handoff prompt",
    ),
    (
        "bundle digest",
        "verified bundle",
        "validated handoff bundle",
        "검증된 handoff bundle",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_BUNDLE_BOUNDARY_METADATA_TERM_GROUPS = (
    (
        "bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata",
        "bundle-check JSON/human plus bundle-handoff JSON/prompt boundary metadata",
        "bundle-check and bundle-handoff boundary metadata",
        "bundle-handoff JSON/prompt boundary metadata",
    ),
    (
        "deterministic-local",
        "no-external-call",
        "no-external-calls",
        "no-external-mcp-calls",
    ),
    (
        "no-target-repo-mutation",
        "targetRepoMutation: false",
        "target repo mutation",
    ),
)
RELEASE_SITE_BUNDLE_MCP_PROBE_COUNTS_TERM_GROUPS = (
    (
        "bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry",
        "bundle-check/compare/handoff mcpProbeCounts probe count telemetry",
        "bundle check/compare/handoff mcpProbeCounts probe count telemetry",
        "bundle-check/compare/handoff MCP probe count telemetry",
    ),
)
RELEASE_SITE_BUNDLE_MCP_PROBE_COUNTS_SELF_TEST_TERM_GROUPS = (
    (
        "package smoke self-test coverage for Website Console bundle MCP probe counts",
        "package smoke self-test coverage for bundle MCP probe counts",
        "bundle MCP probe count package smoke self-test coverage",
        "bundle MCP probe count smoke self-test 검증",
    ),
)
RELEASE_SITE_BUNDLE_MCP_PROBES_PAYLOAD_ASSERTION_TERM_GROUPS = (
    (
        "bundled Website Console `mcp-probes.json` saved probe evidence payload",
        "bundled Website Console mcp-probes.json saved probe evidence payload",
        "bundle `mcp-probes.json` saved probe evidence payload",
        "bundle mcp-probes.json saved probe evidence payload",
        "Website Console bundle `mcp-probes.json` saved probe evidence payload",
    ),
    (
        "not the full `site --mcp-check --probes --json` response",
        "not the full site --mcp-check --probes --json response",
        "instead of the full `site --mcp-check --probes --json` response",
        "saved probe evidence instead of the full `site --mcp-check --probes --json` response",
    ),
)
RELEASE_SITE_BUNDLE_REPAIR_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site <bundle-dir> --bundle-repair --yes --json`",
        "design-ai site <bundle-dir> --bundle-repair --yes --json",
        "site --bundle-repair --yes --json",
        "site --bundle-repair",
    ),
    (
        "Website Console bundle repair",
        "Website Improvement bundle repair",
        "site bundle-repair JSON",
        "handoff bundle repair",
        "Website Console bundle repair 적용",
    ),
    (
        "preview/apply",
        "preview and apply",
        "drift repair",
        "drift recovery",
        "repair preview/apply",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
    (
        "repair report `--out file`",
        "repair report --out file",
        "repair report output-file persistence",
        "bundle repair `--out file`",
        "bundle repair --out file",
        "bundle repair output-file persistence",
        "repair report `--out file` output-file persistence",
        "repair report file 저장",
    ),
    (
        "shared repair guidance smoke helpers",
        "shared repair guidance helper",
        "repair guidance shared helper",
        "공용 repair guidance smoke helper",
    ),
    (
        "shared repair report assertion helpers",
        "shared repair report assertion helper",
        "repair report assertion helpers",
        "repair report shared assertion helper",
        "공용 repair report assertion helper",
    ),
)
RELEASE_SITE_TASKS_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --tasks`",
        "design-ai site --stdin --tasks",
        "site --stdin --tasks",
        "site --tasks",
    ),
    (
        "Website Console refactor task generation",
        "Website Improvement refactor task generation",
        "site task generation",
        "Website Console starter task generation",
        "Website Console refactor task 생성",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_SITE_PROMPT_PACKAGE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --prompt codex-implementation --task task-homepage-cta`",
        "design-ai site --stdin --prompt codex-implementation --task task-homepage-cta",
        "site --stdin --prompt codex-implementation --task task-homepage-cta",
        "site --prompt codex-implementation --task task-homepage-cta",
    ),
    (
        "Website Console task-selected single prompt generation",
        "Website Improvement task-selected single prompt generation",
        "site task-selected prompt generation",
        "task-selected single prompt template export",
        "Website Console task-selected 단일 prompt 생성",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
)
RELEASE_WORKSPACE_STRICT_REGISTRY_SMOKE_TERM_GROUPS = (
    (
        "public registry `design-ai workspace --strict --json`",
        "public registry design-ai workspace --strict --json",
        "public registry workspace strict",
        "공개 npm registry `design-ai workspace --strict --json`",
        "registry `design-ai workspace --strict --json`",
    ),
    (
        "workspace strict failure/success",
        "workspace strict failure and success",
        "strict failure/success readiness",
        "strict failure and clean-success readiness",
        "strict 실패/성공 readiness",
        "strict 실패/성공",
    ),
)
RELEASE_WORKSPACE_LEARNING_EVAL_REGISTRY_SMOKE_TERM_GROUPS = (
    (
        "public registry `design-ai workspace --learning-eval",
        "public registry design-ai workspace --learning-eval",
        "public registry workspace learning-eval",
        "registry `design-ai workspace --learning-eval",
        "공개 npm registry `design-ai workspace --learning-eval",
    ),
    (
        "checkpoint summaries",
        "checkpoint summary",
        "learning eval checkpoint summaries",
        "learning eval checkpoint summary",
        "learning-eval checkpoint summaries",
        "learning-eval checkpoint summary",
    ),
)
RELEASE_WORKSPACE_RESTORE_BACKUPS_REGISTRY_SMOKE_TERM_GROUPS = (
    (
        "public registry `design-ai workspace` workspace restore-backups readiness",
        "public registry design-ai workspace restore-backups readiness",
        "public registry workspace restore-backups readiness",
        "public registry workspace learning restore-backups readiness",
        "공개 npm registry `design-ai workspace` workspace restore-backups readiness",
    ),
    (
        "restore rollback backup inventory",
        "learningRestoreBackups",
        "restore-backups inventory",
    ),
)
RELEASE_SITE_REGISTRY_SMOKE_TERM_GROUPS = (
    (
        "public registry `design-ai site` Website Console export validation",
        "public registry design-ai site Website Console export validation",
        "공개 npm registry `design-ai site` Website Console export validation",
    ),
    (
        "sample workspace coverage, prompt template listing, MCP readiness, MCP readiness probes, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace coverage, prompt template listing, MCP readiness, MCP readiness probes, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace coverage, prompt template listing, MCP readiness, MCP readiness probes, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON `--out` file 저장 확인, shared MCP probe output-file smoke assertions, human MCP check probe command guidance and output-file smoke coverage plus MCP check 내장 human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON `--out` file 저장 확인과 MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON `--out` file 저장 확인, shared MCP probe output-file smoke assertions, human MCP check probe command guidance and output-file smoke coverage, MCP action plan, MCP probe action plan, MCP probe action plan JSON `--out` file 저장 확인과 MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
        "sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON `--out` file 저장 확인, shared MCP probe output-file smoke assertions, MCP action plan, MCP probe action plan, MCP probe action plan JSON `--out` file 저장 확인과 MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle",
    ),
    (
        "MCP readiness probes",
        "MCP readiness probe",
        "MCP readiness probe 검증",
    ),
    (
        "MCP readiness probe JSON with `--out` file-write confirmation",
        "MCP readiness probe JSON `--out` file-write confirmation",
        "MCP readiness probe JSON with --out file-write confirmation",
        "MCP readiness probe JSON --out file-write confirmation",
        "MCP readiness probe JSON output-file persistence",
        "MCP readiness probe JSON `--out` file 저장 확인",
    ),
    (
        "MCP probe action plan",
        "MCP probe action plan 생성",
    ),
    (
        "MCP probe action plan JSON",
        "MCP probe action plan JSON 생성",
    ),
    (
        "MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON with --out file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON --out file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
        "MCP probe action plan JSON output-file persistence",
        "MCP probe action plan JSON `--out` file 저장 확인과 MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
    ),
    (
        "bundle-check",
        "bundle-check/compare/handoff",
        "bundle-check/compare/handoff/repair",
    ),
    (
        "task-selected prompt generation",
        "task-selected prompt 생성",
    ),
)
RELEASE_SITE_NEXT_ACTIONS_REGISTRY_SMOKE_TERM_GROUPS = (
    (
        "public registry `design-ai site --stdin --next-actions --json`",
        "public registry design-ai site --stdin --next-actions --json",
        "registry `design-ai site --stdin --next-actions --json`",
        "공개 npm registry `design-ai site --stdin --next-actions --json`",
    ),
    (
        "next-action operator checklist",
        "next-actions operator checklist",
        "Website Console next-actions",
        "next-actions JSON",
        "next-action checklist",
        "next-action operator checklist contract",
        "next-action operator checklist 계약",
    ),
)
RELEASE_SITE_NEXT_ACTIONS_OUTPUT_FILE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --next-actions --json --out",
        "design-ai site --stdin --next-actions --json --out",
        "site --stdin --next-actions --json --out",
        "design-ai site --stdin --next-actions --json --out file --force",
        "design-ai site --stdin --next-actions --json --out <file> --force",
    ),
    (
        "next-action operator checklist output-file persistence",
        "next-action operator checklist `--out` file-write confirmation",
        "next-action operator checklist --out file-write confirmation",
        "next-actions JSON output-file persistence",
        "next-actions JSON `--out` file-write confirmation",
        "next-action operator checklist `--out` file 저장 확인",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
    (
        "public registry",
        "공개 npm registry",
        "published package path",
        "published-package path",
    ),
)
RELEASE_SITE_NEXT_ACTIONS_HUMAN_OUTPUT_FILE_SMOKE_TERM_GROUPS = (
    (
        "`design-ai site --stdin --next-actions --out",
        "design-ai site --stdin --next-actions --out",
        "site --stdin --next-actions --out",
        "design-ai site --stdin --next-actions --out file --force",
        "design-ai site --stdin --next-actions --out <file> --force",
    ),
    (
        "next-action human checklist output-file persistence",
        "next-action human checklist `--out` file-write confirmation",
        "next-action human checklist --out file-write confirmation",
        "next-actions human report output-file persistence",
        "next-actions Markdown output-file persistence",
        "next-action human checklist `--out` file 저장 확인",
    ),
    (
        "installed-bin and one-shot",
        "installed-bin plus one-shot",
        "both installed-bin and one-shot",
        "installed-bin과 one-shot",
    ),
    (
        "public registry",
        "공개 npm registry",
        "published package path",
        "published-package path",
    ),
)
RELEASE_SITE_NEXT_ACTIONS_MCP_PROBE_COUNTS_TERM_GROUPS = (
    (
        "next-action operator checklist contract with `mcpProbeCounts` probe count telemetry",
        "next-action operator checklist contract with mcpProbeCounts probe count telemetry",
        "next-actions operator checklist with mcpProbeCounts probe count telemetry",
        "next-action operator checklist 계약 및 `mcpProbeCounts` probe count telemetry",
        "next-action operator checklist 계약 및 mcpProbeCounts probe count telemetry",
    ),
)
RELEASE_SITE_NEXT_ACTIONS_MCP_PROBE_COUNTS_SELF_TEST_TERM_GROUPS = (
    (
        "shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts",
        "shared smoke assertion self-test coverage for next-actions MCP probe counts",
        "next-actions MCP probe count smoke self-test coverage",
        "next-actions MCP probe count smoke self-test 검증",
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
RELEASE_METADATA_PRODUCT_READINESS_JSON_TERM_GROUPS = (
    (
        "release metadata JSON",
        "release metadata JSON summary",
        "release metadata JSON output",
    ),
    (
        "`product_readiness_checked: true`",
        "product_readiness_checked",
    ),
    (
        "Product Readiness guard coverage",
        "Product Readiness guard",
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
RELEASE_SITE_HELP_USAGE_TERM_GROUPS = (
    (
        "probe-capable Website Console site help usage",
        "probe-capable Website Console site usage",
        "probe-capable site help usage",
        "Website Console site help usage",
        "Website Console site usage",
    ),
)
RELEASE_SITE_HELP_TOPIC_EXAMPLE_TERM_GROUPS = (
    (
        "shared Website Console site help topic example smoke assertions",
        "Website Console site help topic example smoke assertions",
        "site help topic example smoke assertions",
    ),
)
RELEASE_SITE_NEXT_ACTIONS_HELP_EXAMPLE_TERM_GROUPS = (
    (
        "`design-ai site website-workspace.json --next-actions --out website-next-actions.md`",
        "design-ai site website-workspace.json --next-actions --out website-next-actions.md",
    ),
    (
        "next-actions Markdown help example",
        "next-actions Markdown help example coverage",
        "next-actions Markdown 도움말 예시",
        "next-actions Markdown help 예시",
    ),
    (
        "site help topic",
        "help topic example",
        "help-topic",
        "도움말 예시",
    ),
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
RELEASE_AGENT_EVAL_SMOKE_TERM_GROUPS = (
    (
        "route eval",
        "route eval checkpoint",
    ),
    (
        "prompt eval",
        "prompt eval checkpoint",
    ),
    (
        "pack eval",
        "pack eval checkpoint",
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
        "unknown route-id/option/value suggestions",
        "unknown route-id/option/value suggestion and numeric range failures",
        (
            "unknown route-id suggestion, unknown option suggestion, "
            "unknown value suggestion, and numeric range failure"
        ),
        (
            "unknown route-id suggestion, unknown option suggestion, "
            "unknown value suggestion, numeric range failure"
        ),
        "unknown route-id/option/value suggestion 및 numeric range failure",
    ),
    (
        "numeric range failure",
        "numeric range failures",
        "numeric range failure 검증",
    ),
)
RELEASE_UNKNOWN_ROUTE_ID_SUGGESTION_TERM_GROUPS = (
    (
        "unknown route-id suggestion",
        "unknown route-id suggestions",
        "unknown route id suggestion",
        "unknown route id suggestions",
    ),
)
RELEASE_UNKNOWN_OPTION_SUGGESTION_TERM_GROUPS = (
    (
        "unknown option suggestion",
        "unknown option suggestions",
    ),
)
RELEASE_UNKNOWN_VALUE_SUGGESTION_TERM_GROUPS = (
    (
        "unknown value suggestion",
        "unknown value suggestions",
    ),
)
RELEASE_NUMERIC_RANGE_FAILURE_TERM_GROUPS = (
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
        "prompt/pack file-write confirmation",
        "prompt/pack file-write confirmations",
        "prompt/pack `Wrote <path>` file-write confirmation",
        "prompt/pack `Wrote <path>` file-write confirmations",
        "prompt/pack output-file confirmation",
        "prompt/pack output-file confirmations",
    ),
)
RELEASE_PROMPT_PACK_FORCED_OUTPUT_TERM_GROUPS = (
    ("prompt/pack",),
    (
        "forced `--out`",
        "forced output-file",
        "강제 `--out`",
        "강제 output-file",
    ),
)
RELEASE_PROMPT_PACK_FILE_WRITE_CONFIRMATION_TERM_GROUPS = (
    ("prompt/pack",),
    (
        "prompt/pack file-write confirmation",
        "prompt/pack file-write confirmations",
        "prompt/pack `Wrote <path>` file-write confirmation",
        "prompt/pack `Wrote <path>` file-write confirmations",
        "prompt/pack output-file confirmation",
        "prompt/pack output-file confirmations",
    ),
)
RELEASE_PROMPT_PACK_MODE_TERM_GROUPS = (
    ("prompt/pack",),
    (
        "prompt/pack JSON/markdown/from-file/stdin",
        "prompt/pack JSON, markdown, from-file, and stdin",
        (
            "prompt JSON output, prompt markdown output, prompt from-file output, "
            "prompt stdin output, pack JSON output, pack markdown output, "
            "pack from-file output, and pack stdin output"
        ),
        (
            "prompt JSON output, prompt markdown output, prompt from-file output, "
            "prompt stdin output, pack JSON output, pack markdown output, "
            "pack from-file output, pack stdin output"
        ),
        "prompt/pack JSON/markdown/from-file/stdin 출력",
        (
            "prompt JSON 출력, prompt markdown 출력, prompt from-file 출력, "
            "prompt stdin 출력, pack JSON 출력, pack markdown 출력, "
            "pack from-file 출력, pack stdin 출력"
        ),
    ),
)
RELEASE_PROMPT_JSON_OUTPUT_TERM_GROUPS = (
    (
        "prompt JSON output",
        "prompt JSON 출력",
    ),
)
RELEASE_PROMPT_MARKDOWN_OUTPUT_TERM_GROUPS = (
    (
        "prompt markdown output",
        "prompt markdown 출력",
    ),
)
RELEASE_PROMPT_FROM_FILE_OUTPUT_TERM_GROUPS = (
    (
        "prompt from-file output",
        "prompt from-file 출력",
    ),
)
RELEASE_PROMPT_STDIN_OUTPUT_TERM_GROUPS = (
    (
        "prompt stdin output",
        "prompt stdin 출력",
    ),
)
RELEASE_PACK_JSON_OUTPUT_TERM_GROUPS = (
    (
        "pack JSON output",
        "pack JSON 출력",
    ),
)
RELEASE_PACK_MARKDOWN_OUTPUT_TERM_GROUPS = (
    (
        "pack markdown output",
        "pack markdown 출력",
    ),
)
RELEASE_PACK_FROM_FILE_OUTPUT_TERM_GROUPS = (
    (
        "pack from-file output",
        "pack from-file 출력",
    ),
)
RELEASE_PACK_STDIN_OUTPUT_TERM_GROUPS = (
    (
        "pack stdin output",
        "pack stdin 출력",
    ),
)
RELEASE_CHECK_COMMAND_TERM_GROUPS = (
    (
        "check examples/artifact/stdin/all-routes",
        "check examples/artifact/stdin/all-routes/learning capture",
        "check examples, artifact, stdin, and all-routes",
        (
            "check examples output, check artifact output, check stdin output, "
            "and check all-routes output"
        ),
        (
            "check examples output, check artifact output, check stdin output, "
            "check all-routes output, and check learning capture output"
        ),
        "check examples/artifact/stdin/all-routes 출력",
        "check examples/artifact/stdin/all-routes/learning capture 출력",
        (
            "check examples 출력, check artifact 출력, check stdin 출력, "
            "check all-routes 출력"
        ),
        (
            "check examples 출력, check artifact 출력, check stdin 출력, "
            "check all-routes 출력, check learning capture output"
        ),
    ),
)
RELEASE_CHECK_EXAMPLES_OUTPUT_TERM_GROUPS = (
    (
        "check examples output",
        "check examples 출력",
    ),
)
RELEASE_CHECK_ARTIFACT_OUTPUT_TERM_GROUPS = (
    (
        "check artifact output",
        "check artifact 출력",
    ),
)
RELEASE_CHECK_STDIN_OUTPUT_TERM_GROUPS = (
    (
        "check stdin output",
        "check stdin 출력",
    ),
)
RELEASE_CHECK_ALL_ROUTES_OUTPUT_TERM_GROUPS = (
    (
        "check all-routes output",
        "check all-routes 출력",
    ),
)
RELEASE_CHECK_LEARNING_CAPTURE_OUTPUT_TERM_GROUPS = (
    (
        "check learning capture output",
        "check learning capture 출력",
    ),
)
RELEASE_INSTALL_HUMAN_TERM_GROUPS = (
    (
        "human `design-ai install`",
        "human `design-ai install` output",
        "human install plus",
        "human install plus JSON",
        "human install과 JSON",
        "human install 출력",
        "human install lifecycle",
    ),
)
RELEASE_INSTALL_HUMAN_OUTPUT_TERM_GROUPS = (
    (
        "human `design-ai install` output",
        "human install output",
        "human `design-ai install` 출력",
        "human install 출력",
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
        "human `design-ai status` output",
        "human `design-ai status` 출력",
        "human status output",
        "human status 출력",
    ),
)
RELEASE_STATUS_HUMAN_OUTPUT_TERM_GROUPS = (
    (
        "human `design-ai status` output",
        "human status output",
        "human `design-ai status` 출력",
        "human status 출력",
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
        "human `design-ai uninstall` output",
        "human uninstall plus",
        "human uninstall plus JSON",
        "human uninstall and JSON",
        "human uninstall, and JSON",
        "human uninstall, JSON",
        "human uninstall과 JSON",
        "human uninstall 출력",
        "human uninstall lifecycle",
    ),
)
RELEASE_UNINSTALL_HUMAN_OUTPUT_TERM_GROUPS = (
    (
        "human `design-ai uninstall` output",
        "human uninstall output",
        "human `design-ai uninstall` 출력",
        "human uninstall 출력",
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
    (
        "audit --strict --quiet",
        "design-ai audit --strict --quiet",
        "human `design-ai audit --strict --quiet` output",
        "human `design-ai audit --strict --quiet` 출력",
        "human audit strict-quiet output",
        "human audit strict-quiet 출력",
    ),
)
RELEASE_AUDIT_HUMAN_OUTPUT_TERM_GROUPS = (
    (
        "human `design-ai audit --strict --quiet` output",
        "human audit strict-quiet output",
        "human `design-ai audit --strict --quiet` 출력",
        "human audit strict-quiet 출력",
    ),
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
RELEASE_LEARN_AUDIT_CLEANUP_TERM_GROUPS = (
    (
        "`design-ai learn --audit` cleanup suggestion output",
        "design-ai learn --audit cleanup suggestion output",
        "learn audit cleanup suggestion output",
        "learning audit cleanup guidance",
    ),
)
RELEASE_LEARN_AUDIT_OUT_TERM_GROUPS = (
    (
        "human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation",
        "human / JSON `design-ai learn --audit` cleanup suggestion output과 learn audit `--out` file-write confirmation",
        "design-ai learn --audit cleanup suggestion output plus learn audit --out file-write confirmation",
    ),
)
RELEASE_REGISTRY_LEARN_AUDIT_CLEANUP_TERM_GROUPS = (
    (
        "public registry human / JSON `design-ai learn --audit` cleanup suggestion output",
        "public registry human / JSON design-ai learn --audit cleanup suggestion output",
        "public registry learn audit cleanup suggestion output",
        "registry learn audit cleanup suggestion output",
    ),
    (
        "public registry `design-ai learn --audit --fix --dry-run`",
        "public registry design-ai learn --audit --fix --dry-run",
        "public registry learn audit fix dry-run",
        "registry learn audit fix dry-run",
    ),
)
RELEASE_REGISTRY_LEARN_AUDIT_OUT_TERM_GROUPS = (
    (
        "public registry human / JSON `design-ai learn --audit` cleanup suggestion output plus public registry learn audit `--out` file-write confirmation",
        "public registry human / JSON `design-ai learn --audit` cleanup suggestion output과 public registry learn audit `--out` file-write confirmation",
        "public registry design-ai learn --audit cleanup suggestion output plus public registry learn audit --out file-write confirmation",
        "registry learn audit cleanup suggestion output plus registry learn audit --out file-write confirmation",
    ),
)
RELEASE_LEARN_FEEDBACK_TERM_GROUPS = (
    (
        "`design-ai learn --feedback` output",
        "design-ai learn --feedback output",
        "learn feedback JSON",
        "learning feedback",
    ),
    (
        "JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation",
        "JSON `design-ai learn --feedback` output과 learn feedback `--out` file-write confirmation",
    ),
)
RELEASE_REGISTRY_LEARN_FEEDBACK_TERM_GROUPS = (
    (
        "public registry JSON `design-ai learn --feedback` output",
        "public registry design-ai learn --feedback JSON output",
        "public registry learn feedback JSON output",
        "registry learn feedback JSON output",
    ),
    (
        "public registry `design-ai learn --feedback --from-file`",
        "public registry design-ai learn --feedback --from-file",
        "public registry learn feedback from-file",
        "registry learn feedback from-file",
    ),
    (
        "public registry `design-ai learn --feedback --stdin`",
        "public registry design-ai learn --feedback --stdin",
        "public registry learn feedback stdin",
        "registry learn feedback stdin",
    ),
    (
        "public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation",
        "public registry JSON `design-ai learn --feedback` output과 public registry learn feedback `--out` file-write confirmation",
    ),
)
RELEASE_REGISTRY_LEARN_INIT_TERM_GROUPS = (
    (
        "public registry JSON `design-ai learn --init` preview/apply output",
        "public registry design-ai learn --init preview/apply output",
        "public registry learn init preview/apply output",
        "registry learn init preview/apply output",
    ),
    (
        "public registry learn init duplicate-skip output",
        "registry learn init duplicate-skip output",
        "public registry learn init duplicate skip output",
    ),
)
RELEASE_LEARN_BACKUP_TERM_GROUPS = (
    (
        "JSON `design-ai learn --backup` output",
        "design-ai learn --backup JSON output",
        "learn backup JSON",
        "learning backup",
    ),
)
RELEASE_REGISTRY_LEARN_BACKUP_TERM_GROUPS = (
    (
        "public registry JSON `design-ai learn --backup` output",
        "public registry design-ai learn --backup JSON output",
        "public registry learn backup JSON output",
        "registry learn backup JSON output",
    ),
    (
        "public registry learn backup `--out` file-write confirmation",
        "public registry learn backup --out file-write confirmation",
        "registry learn backup --out file-write confirmation",
    ),
)
RELEASE_LEARN_REDACT_TERM_GROUPS = (
    (
        "JSON `design-ai learn --redact` output",
        "design-ai learn --redact JSON output",
        "learn redact JSON",
        "redacted learning backup",
    ),
    (
        "`design-ai learn --redact --from-file`",
        "design-ai learn --redact --from-file",
        "learn --redact --from-file",
        "--redact --from-file",
    ),
    (
        "`design-ai learn --redact --stdin`",
        "design-ai learn --redact --stdin",
        "learn --redact --stdin",
        "--redact --stdin",
    ),
)
RELEASE_REGISTRY_LEARN_REDACT_TERM_GROUPS = (
    (
        "public registry JSON `design-ai learn --redact` output",
        "public registry design-ai learn --redact JSON output",
        "public registry learn redact JSON output",
        "registry learn redact JSON output",
    ),
    (
        "public registry `design-ai learn --redact --from-file`",
        "public registry design-ai learn --redact --from-file",
        "public registry learn redact from-file",
        "registry learn redact from-file",
    ),
    (
        "public registry `design-ai learn --redact --stdin`",
        "public registry design-ai learn --redact --stdin",
        "public registry learn redact stdin",
        "registry learn redact stdin",
    ),
    (
        "public registry learn redact `--out` file-write confirmation",
        "public registry learn redact --out file-write confirmation",
        "registry learn redact --out file-write confirmation",
    ),
)
RELEASE_LEARN_OUTPUT_FILE_TERM_GROUPS = (
    (
        "learn JSON `--out` file-write confirmation",
        "learn JSON --out file-write confirmation",
        "learn JSON `--out` file-write",
        "learn JSON --out file-write",
        "learn --out file-write",
    ),
)
RELEASE_LEARN_VERIFY_TERM_GROUPS = (
    (
        "JSON `design-ai learn --verify` output",
        "design-ai learn --verify JSON output",
        "learn verify JSON",
        "learning import verification",
    ),
    (
        "learn verify `--out` file-write confirmation",
        "design-ai learn --verify --out file-write confirmation",
        "learn verify --out file-write confirmation",
    ),
)
RELEASE_REGISTRY_LEARN_VERIFY_TERM_GROUPS = (
    (
        "public registry JSON `design-ai learn --verify` output",
        "public registry design-ai learn --verify JSON output",
        "public registry learn verify JSON output",
        "registry learn verify JSON output",
    ),
    (
        "public registry learn verify `--out` file-write confirmation",
        "public registry learn verify --out file-write confirmation",
        "registry learn verify --out file-write confirmation",
    ),
)
RELEASE_LEARN_RESTORE_TERM_GROUPS = (
    (
        "JSON `design-ai learn --restore` preview/apply output",
        "design-ai learn --restore preview/apply output",
        "learn restore preview/apply output",
        "learning profile restore",
    ),
    (
        "learn restore `--out` file-write confirmation",
        "design-ai learn --restore --out file-write confirmation",
        "learn restore --out file-write confirmation",
    ),
)
RELEASE_REGISTRY_LEARN_RESTORE_TERM_GROUPS = (
    (
        "public registry JSON `design-ai learn --restore` preview/apply output",
        "public registry design-ai learn --restore preview/apply output",
        "public registry learn restore preview/apply output",
        "registry learn restore preview/apply output",
    ),
    (
        "public registry learn restore `--out` file-write confirmation",
        "public registry learn restore --out file-write confirmation",
        "registry learn restore --out file-write confirmation",
    ),
    (
        "public registry learn restore rollback backup verification",
        "public registry learning restore rollback backup verification",
        "registry learn restore rollback backup verification",
    ),
    (
        "public registry learn restore `--backup-file` path coverage",
        "public registry design-ai learn --restore --backup-file path coverage",
        "registry learn restore --backup-file path coverage",
    ),
)
RELEASE_LEARN_RESTORE_ROLLBACK_TERM_GROUPS = (
    (
        "learn restore rollback backup",
        "learning restore rollback backup",
        "restore rollback backup",
    ),
    (
        "learn restore `--backup-file`",
        "design-ai learn --restore --backup-file",
        "restore --backup-file",
    ),
)
RELEASE_LEARN_RESTORE_BACKUPS_TERM_GROUPS = (
    (
        "learn restore-backups",
        "design-ai learn --restore-backups",
        "restore-backups",
    ),
    (
        "restore rollback backup inventory",
        "learning restore rollback backup inventory",
        "rollback backup inventory",
    ),
)
RELEASE_REGISTRY_LEARN_RESTORE_BACKUPS_TERM_GROUPS = (
    (
        "public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage",
        "public registry design-ai learn --restore-backups restore rollback backup inventory coverage",
        "public registry learn restore-backups rollback backup inventory coverage",
        "registry learn restore-backups inventory coverage",
    ),
)
RELEASE_LEARN_RESTORE_BACKUPS_PRUNE_TERM_GROUPS = (
    (
        "learn restore-backups --prune",
        "design-ai learn --restore-backups --prune",
        "restore-backups --prune",
    ),
    (
        "restore rollback backup pruning",
        "learning restore rollback backup pruning",
        "rollback backup pruning",
    ),
)
RELEASE_REGISTRY_LEARN_RESTORE_BACKUPS_PRUNE_TERM_GROUPS = (
    (
        "public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage",
        "public registry design-ai learn --restore-backups --prune restore rollback backup pruning coverage",
        "public registry learn restore-backups --prune rollback backup pruning coverage",
        "registry learn restore-backups prune coverage",
    ),
)
RELEASE_LEARN_IMPORT_TERM_GROUPS = (
    (
        "`design-ai learn --import` dry-run/apply output",
        "design-ai learn --import dry-run/apply output",
        "learn import dry-run/apply output",
        "learning import",
    ),
    (
        "JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation",
        "JSON `design-ai learn --import` dry-run/apply output과 learn import `--out` file-write confirmation",
    ),
)
RELEASE_REGISTRY_LEARN_IMPORT_TERM_GROUPS = (
    (
        "public registry JSON `design-ai learn --import` dry-run/apply output",
        "public registry design-ai learn --import dry-run/apply output",
        "public registry learn import dry-run/apply output",
        "registry learn import dry-run/apply output",
    ),
    (
        "public registry JSON `design-ai learn --import` dry-run/apply output plus public registry learn import `--out` file-write confirmation",
        "public registry JSON `design-ai learn --import` dry-run/apply output과 public registry learn import `--out` file-write confirmation",
    ),
)
RELEASE_LEARN_STATS_TERM_GROUPS = (
    (
        "human / JSON `design-ai learn --stats` profile summary output",
        "human / JSON design-ai learn --stats profile summary output",
        "learn stats profile summary output",
        "learning stats profile summary",
    ),
    (
        "learn stats `--out` file-write confirmation",
        "design-ai learn --stats --out file-write confirmation",
        "learn stats --out file-write confirmation",
    ),
)
RELEASE_REGISTRY_LEARN_STATS_TERM_GROUPS = (
    (
        "public registry human / JSON `design-ai learn --stats` profile summary output",
        "public registry human / JSON design-ai learn --stats profile summary output",
        "public registry learn stats profile summary output",
        "registry learn stats profile summary output",
    ),
    (
        "public registry learn stats `--out` file-write confirmation",
        "public registry design-ai learn --stats --out file-write confirmation",
        "public registry learn stats --out file-write confirmation",
        "registry learn stats --out file-write confirmation",
    ),
)
RELEASE_LEARN_QUERY_EXPLAIN_TERM_GROUPS = (
    (
        "query-filtered human learn list explanation and export JSON output",
        "query-filtered learn list explanation/export JSON output",
        "query-filtered learn list explanation/export JSON",
        "query-filtered `learn --list --explain` / `learn --export`",
        "query-filtered `learn --list --explain` / `learn --export` inspection",
    ),
)
RELEASE_REGISTRY_LEARN_QUERY_EXPLAIN_TERM_GROUPS = (
    (
        "public registry query-filtered learn list explanation/export JSON output",
        "public registry query-filtered human learn list explanation and export JSON output",
        "public registry learn query explanation/export JSON output",
        "registry query-filtered learn list explanation/export JSON output",
    ),
)
RELEASE_LEARN_RELEVANCE_TERM_GROUPS = (
    (
        "brief-relevant prompt/pack learning selection",
        "brief relevant prompt/pack learning selection",
        "brief-relevance ranking",
        "brief relevance ranking",
        "prompt/pack learning relevance",
        "prompt/pack learning selection",
    ),
    (
        "prompt/pack",
        "`prompt`/`pack",
        "prompt --with-learning",
        "pack --with-learning",
        "`prompt --with-learning`",
        "`pack --with-learning`",
    ),
)
RELEASE_LEARN_USAGE_SIDECAR_TERM_GROUPS = (
    (
        "prompt/pack learning usage sidecar recording",
        "learning usage sidecar",
        "learning.usage.json",
    ),
    (
        "prompt --with-learning",
        "pack --with-learning",
        "`prompt --with-learning`",
        "`pack --with-learning`",
        "prompt/pack",
    ),
)
RELEASE_LEARN_USAGE_REPORT_TERM_GROUPS = (
    (
        "human / JSON `design-ai learn --usage` usage sidecar report",
        "human / JSON design-ai learn --usage usage sidecar report",
        "learn --usage usage sidecar report",
        "learning usage report",
    ),
    (
        "learn usage `--out` file-write confirmation",
        "learn usage --out file-write confirmation",
        "learn --usage --out",
        "design-ai learn --usage",
    ),
)
RELEASE_LEARN_EVAL_TERM_GROUPS = (
    (
        "human / JSON `design-ai learn --eval` checkpoint report",
        "human / JSON design-ai learn --eval checkpoint report",
        "learn --eval checkpoint report",
        "learning eval checkpoint",
    ),
    (
        "learn eval `--out` file-write confirmation",
        "learn eval --out file-write confirmation",
        "learn --eval --out",
        "design-ai learn --eval",
    ),
    (
        "learn eval `--strict` failure gate",
        "learn eval --strict failure gate",
        "learn --eval --strict",
        "design-ai learn --eval --strict",
    ),
)
RELEASE_LEARN_EVAL_TEMPLATE_TERM_GROUPS = (
    (
        "human / JSON `design-ai learn --eval-template` checkpoint generation",
        "human / JSON design-ai learn --eval-template checkpoint generation",
        "learn --eval-template checkpoint generation",
        "learning eval template generation",
    ),
    (
        "generated checkpoint strict validation",
        "generated checkpoint strict eval",
        "generated checkpoint strict validation",
        "generated learn eval-template checkpoint",
    ),
)
RELEASE_REGISTRY_LEARN_RELEVANCE_TERM_GROUPS = (
    (
        "public registry brief-relevant prompt/pack learning selection",
        "public registry brief relevant prompt/pack learning selection",
        "public registry prompt/pack learning relevance",
        "registry brief-relevant prompt/pack learning selection",
    ),
    (
        "public registry prompt/pack --with-learning",
        "public registry `prompt --with-learning`",
        "public registry `pack --with-learning`",
        "registry prompt/pack --with-learning",
    ),
)
RELEASE_REGISTRY_LEARN_EVAL_TEMPLATE_TERM_GROUPS = (
    (
        "public registry `design-ai learn --eval-template` checkpoint generation",
        "public registry design-ai learn --eval-template checkpoint generation",
        "public registry learn --eval-template checkpoint generation",
        "registry learn eval-template checkpoint generation",
    ),
    (
        "public registry generated checkpoint strict validation",
        "public registry generated checkpoint strict eval",
        "registry generated learn eval-template checkpoint",
        "public registry generated learn eval-template checkpoint",
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
RELEASE_DOCTOR_HUMAN_DIAGNOSTICS_OUTPUT_TERM_GROUPS = (
    (
        "human diagnostics output from `design-ai doctor --strict`",
        "human diagnostics output from design-ai doctor --strict",
        "`design-ai doctor --strict` human diagnostics output",
        "design-ai doctor --strict human diagnostics output",
        "`design-ai doctor --strict` human diagnostics 출력",
        "design-ai doctor --strict human diagnostics 출력",
    ),
)
RELEASE_DOCTOR_JSON_COMMAND_TERM_GROUPS = (
    ("`design-ai doctor --json`",),
)
RELEASE_DOCTOR_JSON_OUTPUT_TERM_GROUPS = (
    (
        "machine-readable diagnostics output",
        "machine-readable diagnostics 출력",
    ),
)
RELEASE_UPDATE_DRY_RUN_TERM_GROUPS = (
    ("update --dry-run", "design-ai update --dry-run"),
)
RELEASE_UPDATE_DRY_RUN_COMMAND_TERM_GROUPS = (
    ("`design-ai update --dry-run`",),
)
RELEASE_UPDATE_DRY_RUN_HUMAN_OUTPUT_TERM_GROUPS = (
    (
        "human `design-ai update --dry-run` output",
        "human update dry-run output",
        "human `design-ai update --dry-run` 출력",
        "human update dry-run 출력",
    ),
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
    "Website Console mcp-probes release-check evidence phrase",
    "Website Console bundle boundary release-check evidence phrase",
    "Product Readiness release policy full gate release-check evidence phrase",
    "Product Readiness release policy full gate evidence guard release-check phrase",
    "packed tarball smoke phrase",
    "package smoke command phrase",
    "learn signals strict package smoke phrase",
    "workspace strict package smoke phrase",
    "workspace learning-eval package smoke phrase",
    "workspace restore-backups package smoke phrase",
    "site JSON package smoke phrase",
    "site sample package smoke phrase",
    "site prompt-list package smoke phrase",
    "site mcp-check package smoke phrase",
    "site mcp-plan package smoke phrase",
    "site MCP shared output assertion phrase",
    "site MCP check embedded command phrase",
    "site MCP check executable embedded command smoke phrase",
    "site MCP check human command guidance smoke phrase",
    "site MCP check human output command phrase",
    "site MCP action plan embedded command phrase",
    "site MCP action plan human output command parity phrase",
    "site MCP action plan human output command smoke phrase",
    "site MCP action plan check JSON command smoke phrase",
    "site MCP action plan self-archive command smoke phrase",
    "site MCP action plan command mapping self-test phrase",
    "site workflow graph package smoke phrase",
    "site bundle package smoke phrase",
    "site bundle-check package smoke phrase",
    "site bundle-compare package smoke phrase",
    "site bundle-compare warning strict smoke phrase",
    "site bundle-handoff package smoke phrase",
    "site bundle boundary metadata phrase",
    "site bundle MCP probe counts phrase",
    "site bundle MCP probe count self-test phrase",
    "site bundle mcp-probes payload assertion phrase",
    "site bundle-repair package smoke phrase",
    "site tasks package smoke phrase",
    "site prompt package smoke phrase",
    "workspace strict registry smoke phrase",
    "workspace learning-eval registry smoke phrase",
    "workspace restore-backups registry smoke phrase",
    "site registry smoke phrase",
    "site next-actions registry smoke phrase",
    "site next-actions output-file smoke phrase",
    "site next-actions human output-file smoke phrase",
    "site next-actions MCP probe counts phrase",
    "site next-actions MCP probe count self-test phrase",
    "packed tarball installed-bin smoke phrase",
    "packed tarball npm exec smoke phrase",
    "public registry npm exec smoke phrase",
    "registry smoke command phrase",
    "package contents command phrase",
    "package contents check phrase",
    "release metadata command phrase",
    "release metadata check phrase",
    "release metadata Product Readiness JSON phrase",
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
    "site help usage phrase",
    "site help topic example phrase",
    "site next-actions help example phrase",
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
    "agent eval smoke phrase",
    "show-lines route-explain smoke phrase",
    "show-lines output phrase",
    "route-explain output phrase",
    "unknown command failure smoke phrase",
    "unknown command-only failure phrase",
    "unknown help-topic failure phrase",
    "unknown list-domain failure phrase",
    "unknown search-dir failure phrase",
    "suggestion failure smoke phrase",
    "unknown route-id suggestion phrase",
    "unknown option suggestion phrase",
    "unknown value suggestion phrase",
    "numeric range failure phrase",
    "prompt-pack mode smoke phrase",
    "prompt JSON output phrase",
    "prompt markdown output phrase",
    "prompt from-file output phrase",
    "prompt stdin output phrase",
    "pack JSON output phrase",
    "pack markdown output phrase",
    "pack from-file output phrase",
    "pack stdin output phrase",
    "prompt-pack output smoke phrase",
    "prompt-pack forced output-file phrase",
    "prompt-pack file-write confirmation phrase",
    "check command smoke phrase",
    "check examples output phrase",
    "check artifact output phrase",
    "check stdin output phrase",
    "check all-routes output phrase",
    "check learning capture output phrase",
    "human install lifecycle phrase",
    "human install output phrase",
    "install JSON command phrase",
    "install JSON lifecycle phrase",
    "human status lifecycle phrase",
    "human status output phrase",
    "status JSON command phrase",
    "status JSON install-state phrase",
    "human uninstall lifecycle phrase",
    "human uninstall output phrase",
    "uninstall JSON command phrase",
    "uninstall JSON lifecycle phrase",
    "audit strict-quiet smoke phrase",
    "audit human output phrase",
    "audit JSON command phrase",
    "audit JSON repository-audit phrase",
    "learn feedback smoke phrase",
    "registry learn feedback smoke phrase",
    "registry learn init smoke phrase",
    "learn backup smoke phrase",
    "registry learn backup smoke phrase",
    "learn redact smoke phrase",
    "registry learn redact smoke phrase",
    "learn output file smoke phrase",
    "learn verify smoke phrase",
    "registry learn verify smoke phrase",
    "learn restore smoke phrase",
    "registry learn restore smoke phrase",
    "learn restore rollback backup smoke phrase",
    "learn restore-backups smoke phrase",
    "registry learn restore-backups smoke phrase",
    "learn restore-backups prune smoke phrase",
    "registry learn restore-backups prune smoke phrase",
    "learn import smoke phrase",
    "registry learn import smoke phrase",
    "learn stats smoke phrase",
    "registry learn stats smoke phrase",
    "learn query explain smoke phrase",
    "registry learn query explain smoke phrase",
    "learn relevance smoke phrase",
    "learn usage sidecar smoke phrase",
    "learn usage report smoke phrase",
    "learn eval-template smoke phrase",
    "learn eval checkpoint smoke phrase",
    "registry learn relevance smoke phrase",
    "registry learn eval-template smoke phrase",
    "learn audit cleanup smoke phrase",
    "learn audit out smoke phrase",
    "registry learn audit cleanup smoke phrase",
    "registry learn audit out smoke phrase",
    "doctor strict smoke phrase",
    "doctor strict command phrase",
    "doctor human diagnostics phrase",
    "doctor human diagnostics output phrase",
    "doctor JSON command phrase",
    "doctor JSON diagnostics output phrase",
    "update dry-run lifecycle phrase",
    "update dry-run command phrase",
    "update dry-run human output phrase",
    "update dry-run JSON command phrase",
    "update dry-run plan phrase",
)
RELEASE_POLICY_PHRASE_CHECKS = (
    ("MkDocs warning-policy phrase", RELEASE_WARNING_POLICY_TERM_GROUPS),
    ("local CI command phrase", RELEASE_LOCAL_CI_COMMAND_TERM_GROUPS),
    ("release check command phrase", RELEASE_CHECK_GATE_TERM_GROUPS),
    (
        "Website Console mcp-probes release-check evidence phrase",
        RELEASE_MCP_PROBES_RELEASE_CHECK_TERM_GROUPS,
    ),
    (
        "Website Console bundle boundary release-check evidence phrase",
        RELEASE_BUNDLE_BOUNDARY_RELEASE_CHECK_TERM_GROUPS,
    ),
    (
        "Product Readiness release policy full gate release-check evidence phrase",
        RELEASE_PRODUCT_READINESS_POLICY_FULL_GATE_RELEASE_CHECK_TERM_GROUPS,
    ),
    (
        "Product Readiness release policy full gate evidence guard release-check phrase",
        RELEASE_PRODUCT_READINESS_POLICY_FULL_GATE_EVIDENCE_RELEASE_CHECK_TERM_GROUPS,
    ),
    ("packed tarball smoke phrase", RELEASE_PACKED_TARBALL_SMOKE_TERM_GROUPS),
    ("package smoke command phrase", RELEASE_PACKAGE_SMOKE_COMMAND_TERM_GROUPS),
    (
        "learn signals strict package smoke phrase",
        RELEASE_LEARN_SIGNALS_STRICT_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "workspace strict package smoke phrase",
        RELEASE_WORKSPACE_STRICT_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "workspace learning-eval package smoke phrase",
        RELEASE_WORKSPACE_LEARNING_EVAL_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "workspace restore-backups package smoke phrase",
        RELEASE_WORKSPACE_RESTORE_BACKUPS_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site JSON package smoke phrase",
        RELEASE_SITE_JSON_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site sample package smoke phrase",
        RELEASE_SITE_SAMPLE_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site prompt-list package smoke phrase",
        RELEASE_SITE_PROMPT_LIST_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site mcp-check package smoke phrase",
        RELEASE_SITE_MCP_CHECK_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site mcp-plan package smoke phrase",
        RELEASE_SITE_MCP_PLAN_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site MCP shared output assertion phrase",
        RELEASE_SITE_MCP_SHARED_OUTPUT_ASSERTION_TERM_GROUPS,
    ),
    (
        "site MCP check embedded command phrase",
        RELEASE_SITE_MCP_CHECK_COMMANDS_TERM_GROUPS,
    ),
    (
        "site MCP check executable embedded command smoke phrase",
        RELEASE_SITE_MCP_CHECK_EXECUTABLE_COMMANDS_TERM_GROUPS,
    ),
    (
        "site MCP check human command guidance smoke phrase",
        RELEASE_SITE_MCP_CHECK_HUMAN_COMMANDS_TERM_GROUPS,
    ),
    (
        "site MCP check human output command phrase",
        RELEASE_SITE_MCP_CHECK_HUMAN_OUTPUT_COMMAND_TERM_GROUPS,
    ),
    (
        "site MCP action plan embedded command phrase",
        RELEASE_SITE_MCP_ACTION_PLAN_COMMANDS_TERM_GROUPS,
    ),
    (
        "site MCP action plan human output command parity phrase",
        RELEASE_SITE_MCP_ACTION_PLAN_HUMAN_OUTPUT_COMMAND_TERM_GROUPS,
    ),
    (
        "site MCP action plan human output command smoke phrase",
        RELEASE_SITE_MCP_ACTION_PLAN_HUMAN_OUTPUT_COMMAND_SMOKE_TERM_GROUPS,
    ),
    (
        "site MCP action plan check JSON command smoke phrase",
        RELEASE_SITE_MCP_ACTION_PLAN_CHECK_JSON_COMMAND_SMOKE_TERM_GROUPS,
    ),
    (
        "site MCP action plan self-archive command smoke phrase",
        RELEASE_SITE_MCP_ACTION_PLAN_SELF_ARCHIVE_COMMAND_SMOKE_TERM_GROUPS,
    ),
    (
        "site MCP action plan command mapping self-test phrase",
        RELEASE_SITE_MCP_ACTION_PLAN_COMMAND_MAPPING_SELF_TEST_TERM_GROUPS,
    ),
    (
        "site workflow graph package smoke phrase",
        RELEASE_SITE_GRAPH_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site bundle package smoke phrase",
        RELEASE_SITE_BUNDLE_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site bundle-check package smoke phrase",
        RELEASE_SITE_BUNDLE_CHECK_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site bundle-compare package smoke phrase",
        RELEASE_SITE_BUNDLE_COMPARE_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site bundle-compare warning strict smoke phrase",
        RELEASE_SITE_BUNDLE_COMPARE_WARNING_STRICT_SMOKE_TERM_GROUPS,
    ),
    (
        "site bundle-handoff package smoke phrase",
        RELEASE_SITE_BUNDLE_HANDOFF_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site bundle boundary metadata phrase",
        RELEASE_SITE_BUNDLE_BOUNDARY_METADATA_TERM_GROUPS,
    ),
    (
        "site bundle MCP probe counts phrase",
        RELEASE_SITE_BUNDLE_MCP_PROBE_COUNTS_TERM_GROUPS,
    ),
    (
        "site bundle MCP probe count self-test phrase",
        RELEASE_SITE_BUNDLE_MCP_PROBE_COUNTS_SELF_TEST_TERM_GROUPS,
    ),
    (
        "site bundle mcp-probes payload assertion phrase",
        RELEASE_SITE_BUNDLE_MCP_PROBES_PAYLOAD_ASSERTION_TERM_GROUPS,
    ),
    (
        "site bundle-repair package smoke phrase",
        RELEASE_SITE_BUNDLE_REPAIR_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site tasks package smoke phrase",
        RELEASE_SITE_TASKS_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "site prompt package smoke phrase",
        RELEASE_SITE_PROMPT_PACKAGE_SMOKE_TERM_GROUPS,
    ),
    (
        "workspace strict registry smoke phrase",
        RELEASE_WORKSPACE_STRICT_REGISTRY_SMOKE_TERM_GROUPS,
    ),
    (
        "workspace learning-eval registry smoke phrase",
        RELEASE_WORKSPACE_LEARNING_EVAL_REGISTRY_SMOKE_TERM_GROUPS,
    ),
    (
        "workspace restore-backups registry smoke phrase",
        RELEASE_WORKSPACE_RESTORE_BACKUPS_REGISTRY_SMOKE_TERM_GROUPS,
    ),
    (
        "site registry smoke phrase",
        RELEASE_SITE_REGISTRY_SMOKE_TERM_GROUPS,
    ),
    (
        "site next-actions registry smoke phrase",
        RELEASE_SITE_NEXT_ACTIONS_REGISTRY_SMOKE_TERM_GROUPS,
    ),
    (
        "site next-actions output-file smoke phrase",
        RELEASE_SITE_NEXT_ACTIONS_OUTPUT_FILE_SMOKE_TERM_GROUPS,
    ),
    (
        "site next-actions human output-file smoke phrase",
        RELEASE_SITE_NEXT_ACTIONS_HUMAN_OUTPUT_FILE_SMOKE_TERM_GROUPS,
    ),
    (
        "site next-actions MCP probe counts phrase",
        RELEASE_SITE_NEXT_ACTIONS_MCP_PROBE_COUNTS_TERM_GROUPS,
    ),
    (
        "site next-actions MCP probe count self-test phrase",
        RELEASE_SITE_NEXT_ACTIONS_MCP_PROBE_COUNTS_SELF_TEST_TERM_GROUPS,
    ),
    ("packed tarball installed-bin smoke phrase", RELEASE_PACKED_TARBALL_INSTALLED_BIN_TERM_GROUPS),
    ("packed tarball npm exec smoke phrase", RELEASE_PACKED_TARBALL_NPM_EXEC_TERM_GROUPS),
    ("public registry npm exec smoke phrase", RELEASE_PUBLIC_REGISTRY_NPM_EXEC_TERM_GROUPS),
    ("registry smoke command phrase", RELEASE_REGISTRY_SMOKE_COMMAND_TERM_GROUPS),
    ("package contents command phrase", RELEASE_PACKAGE_CONTENTS_COMMAND_TERM_GROUPS),
    ("package contents check phrase", RELEASE_PACKAGE_CONTENTS_TERM_GROUPS),
    ("release metadata command phrase", RELEASE_METADATA_COMMAND_TERM_GROUPS),
    ("release metadata check phrase", RELEASE_METADATA_CHECK_TERM_GROUPS),
    (
        "release metadata Product Readiness JSON phrase",
        RELEASE_METADATA_PRODUCT_READINESS_JSON_TERM_GROUPS,
    ),
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
    ("site help usage phrase", RELEASE_SITE_HELP_USAGE_TERM_GROUPS),
    ("site help topic example phrase", RELEASE_SITE_HELP_TOPIC_EXAMPLE_TERM_GROUPS),
    (
        "site next-actions help example phrase",
        RELEASE_SITE_NEXT_ACTIONS_HELP_EXAMPLE_TERM_GROUPS,
    ),
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
    ("agent eval smoke phrase", RELEASE_AGENT_EVAL_SMOKE_TERM_GROUPS),
    ("show-lines route-explain smoke phrase", RELEASE_EXPLICIT_OUTPUT_TERM_GROUPS),
    ("show-lines output phrase", RELEASE_SHOW_LINES_OUTPUT_TERM_GROUPS),
    ("route-explain output phrase", RELEASE_ROUTE_EXPLAIN_OUTPUT_TERM_GROUPS),
    ("unknown command failure smoke phrase", RELEASE_UNKNOWN_COMMAND_FAILURE_TERM_GROUPS),
    ("unknown command-only failure phrase", RELEASE_UNKNOWN_COMMAND_ONLY_FAILURE_TERM_GROUPS),
    ("unknown help-topic failure phrase", RELEASE_UNKNOWN_HELP_TOPIC_FAILURE_TERM_GROUPS),
    ("unknown list-domain failure phrase", RELEASE_UNKNOWN_LIST_DOMAIN_FAILURE_TERM_GROUPS),
    ("unknown search-dir failure phrase", RELEASE_UNKNOWN_SEARCH_DIR_FAILURE_TERM_GROUPS),
    ("suggestion failure smoke phrase", RELEASE_SUGGESTION_FAILURE_TERM_GROUPS),
    ("unknown route-id suggestion phrase", RELEASE_UNKNOWN_ROUTE_ID_SUGGESTION_TERM_GROUPS),
    ("unknown option suggestion phrase", RELEASE_UNKNOWN_OPTION_SUGGESTION_TERM_GROUPS),
    ("unknown value suggestion phrase", RELEASE_UNKNOWN_VALUE_SUGGESTION_TERM_GROUPS),
    ("numeric range failure phrase", RELEASE_NUMERIC_RANGE_FAILURE_TERM_GROUPS),
    ("prompt-pack mode smoke phrase", RELEASE_PROMPT_PACK_MODE_TERM_GROUPS),
    ("prompt JSON output phrase", RELEASE_PROMPT_JSON_OUTPUT_TERM_GROUPS),
    ("prompt markdown output phrase", RELEASE_PROMPT_MARKDOWN_OUTPUT_TERM_GROUPS),
    ("prompt from-file output phrase", RELEASE_PROMPT_FROM_FILE_OUTPUT_TERM_GROUPS),
    ("prompt stdin output phrase", RELEASE_PROMPT_STDIN_OUTPUT_TERM_GROUPS),
    ("pack JSON output phrase", RELEASE_PACK_JSON_OUTPUT_TERM_GROUPS),
    ("pack markdown output phrase", RELEASE_PACK_MARKDOWN_OUTPUT_TERM_GROUPS),
    ("pack from-file output phrase", RELEASE_PACK_FROM_FILE_OUTPUT_TERM_GROUPS),
    ("pack stdin output phrase", RELEASE_PACK_STDIN_OUTPUT_TERM_GROUPS),
    ("prompt-pack output smoke phrase", RELEASE_PROMPT_PACK_OUTPUT_TERM_GROUPS),
    (
        "prompt-pack forced output-file phrase",
        RELEASE_PROMPT_PACK_FORCED_OUTPUT_TERM_GROUPS,
    ),
    (
        "prompt-pack file-write confirmation phrase",
        RELEASE_PROMPT_PACK_FILE_WRITE_CONFIRMATION_TERM_GROUPS,
    ),
    ("check command smoke phrase", RELEASE_CHECK_COMMAND_TERM_GROUPS),
    ("check examples output phrase", RELEASE_CHECK_EXAMPLES_OUTPUT_TERM_GROUPS),
    ("check artifact output phrase", RELEASE_CHECK_ARTIFACT_OUTPUT_TERM_GROUPS),
    ("check stdin output phrase", RELEASE_CHECK_STDIN_OUTPUT_TERM_GROUPS),
    ("check all-routes output phrase", RELEASE_CHECK_ALL_ROUTES_OUTPUT_TERM_GROUPS),
    (
        "check learning capture output phrase",
        RELEASE_CHECK_LEARNING_CAPTURE_OUTPUT_TERM_GROUPS,
    ),
    ("human install lifecycle phrase", RELEASE_INSTALL_HUMAN_TERM_GROUPS),
    ("human install output phrase", RELEASE_INSTALL_HUMAN_OUTPUT_TERM_GROUPS),
    ("install JSON command phrase", RELEASE_INSTALL_JSON_COMMAND_TERM_GROUPS),
    ("install JSON lifecycle phrase", RELEASE_INSTALL_JSON_TERM_GROUPS),
    ("human status lifecycle phrase", RELEASE_STATUS_HUMAN_TERM_GROUPS),
    ("human status output phrase", RELEASE_STATUS_HUMAN_OUTPUT_TERM_GROUPS),
    ("status JSON command phrase", RELEASE_STATUS_JSON_COMMAND_TERM_GROUPS),
    ("status JSON install-state phrase", RELEASE_STATUS_JSON_TERM_GROUPS),
    ("human uninstall lifecycle phrase", RELEASE_UNINSTALL_HUMAN_TERM_GROUPS),
    ("human uninstall output phrase", RELEASE_UNINSTALL_HUMAN_OUTPUT_TERM_GROUPS),
    ("uninstall JSON command phrase", RELEASE_UNINSTALL_JSON_COMMAND_TERM_GROUPS),
    ("uninstall JSON lifecycle phrase", RELEASE_UNINSTALL_JSON_TERM_GROUPS),
    ("audit strict-quiet smoke phrase", RELEASE_AUDIT_STRICT_QUIET_TERM_GROUPS),
    ("audit human output phrase", RELEASE_AUDIT_HUMAN_OUTPUT_TERM_GROUPS),
    ("audit JSON command phrase", RELEASE_AUDIT_JSON_COMMAND_TERM_GROUPS),
    ("audit JSON repository-audit phrase", RELEASE_AUDIT_JSON_OUTPUT_TERM_GROUPS),
    ("learn feedback smoke phrase", RELEASE_LEARN_FEEDBACK_TERM_GROUPS),
    ("registry learn feedback smoke phrase", RELEASE_REGISTRY_LEARN_FEEDBACK_TERM_GROUPS),
    ("registry learn init smoke phrase", RELEASE_REGISTRY_LEARN_INIT_TERM_GROUPS),
    ("learn backup smoke phrase", RELEASE_LEARN_BACKUP_TERM_GROUPS),
    ("registry learn backup smoke phrase", RELEASE_REGISTRY_LEARN_BACKUP_TERM_GROUPS),
    ("learn redact smoke phrase", RELEASE_LEARN_REDACT_TERM_GROUPS),
    ("registry learn redact smoke phrase", RELEASE_REGISTRY_LEARN_REDACT_TERM_GROUPS),
    ("learn output file smoke phrase", RELEASE_LEARN_OUTPUT_FILE_TERM_GROUPS),
    ("learn verify smoke phrase", RELEASE_LEARN_VERIFY_TERM_GROUPS),
    ("registry learn verify smoke phrase", RELEASE_REGISTRY_LEARN_VERIFY_TERM_GROUPS),
    ("learn restore smoke phrase", RELEASE_LEARN_RESTORE_TERM_GROUPS),
    ("registry learn restore smoke phrase", RELEASE_REGISTRY_LEARN_RESTORE_TERM_GROUPS),
    ("learn restore rollback backup smoke phrase", RELEASE_LEARN_RESTORE_ROLLBACK_TERM_GROUPS),
    ("learn restore-backups smoke phrase", RELEASE_LEARN_RESTORE_BACKUPS_TERM_GROUPS),
    ("registry learn restore-backups smoke phrase", RELEASE_REGISTRY_LEARN_RESTORE_BACKUPS_TERM_GROUPS),
    ("learn restore-backups prune smoke phrase", RELEASE_LEARN_RESTORE_BACKUPS_PRUNE_TERM_GROUPS),
    (
        "registry learn restore-backups prune smoke phrase",
        RELEASE_REGISTRY_LEARN_RESTORE_BACKUPS_PRUNE_TERM_GROUPS,
    ),
    ("learn import smoke phrase", RELEASE_LEARN_IMPORT_TERM_GROUPS),
    ("registry learn import smoke phrase", RELEASE_REGISTRY_LEARN_IMPORT_TERM_GROUPS),
    ("learn stats smoke phrase", RELEASE_LEARN_STATS_TERM_GROUPS),
    ("registry learn stats smoke phrase", RELEASE_REGISTRY_LEARN_STATS_TERM_GROUPS),
    ("learn query explain smoke phrase", RELEASE_LEARN_QUERY_EXPLAIN_TERM_GROUPS),
    (
        "registry learn query explain smoke phrase",
        RELEASE_REGISTRY_LEARN_QUERY_EXPLAIN_TERM_GROUPS,
    ),
    ("learn relevance smoke phrase", RELEASE_LEARN_RELEVANCE_TERM_GROUPS),
    ("learn usage sidecar smoke phrase", RELEASE_LEARN_USAGE_SIDECAR_TERM_GROUPS),
    ("learn usage report smoke phrase", RELEASE_LEARN_USAGE_REPORT_TERM_GROUPS),
    ("learn eval-template smoke phrase", RELEASE_LEARN_EVAL_TEMPLATE_TERM_GROUPS),
    ("learn eval checkpoint smoke phrase", RELEASE_LEARN_EVAL_TERM_GROUPS),
    (
        "registry learn relevance smoke phrase",
        RELEASE_REGISTRY_LEARN_RELEVANCE_TERM_GROUPS,
    ),
    (
        "registry learn eval-template smoke phrase",
        RELEASE_REGISTRY_LEARN_EVAL_TEMPLATE_TERM_GROUPS,
    ),
    ("learn audit cleanup smoke phrase", RELEASE_LEARN_AUDIT_CLEANUP_TERM_GROUPS),
    ("learn audit out smoke phrase", RELEASE_LEARN_AUDIT_OUT_TERM_GROUPS),
    (
        "registry learn audit cleanup smoke phrase",
        RELEASE_REGISTRY_LEARN_AUDIT_CLEANUP_TERM_GROUPS,
    ),
    (
        "registry learn audit out smoke phrase",
        RELEASE_REGISTRY_LEARN_AUDIT_OUT_TERM_GROUPS,
    ),
    ("doctor strict smoke phrase", RELEASE_DOCTOR_STRICT_TERM_GROUPS),
    ("doctor strict command phrase", RELEASE_DOCTOR_STRICT_COMMAND_TERM_GROUPS),
    ("doctor human diagnostics phrase", RELEASE_DOCTOR_HUMAN_DIAGNOSTICS_TERM_GROUPS),
    (
        "doctor human diagnostics output phrase",
        RELEASE_DOCTOR_HUMAN_DIAGNOSTICS_OUTPUT_TERM_GROUPS,
    ),
    ("doctor JSON command phrase", RELEASE_DOCTOR_JSON_COMMAND_TERM_GROUPS),
    (
        "doctor JSON diagnostics output phrase",
        RELEASE_DOCTOR_JSON_OUTPUT_TERM_GROUPS,
    ),
    ("update dry-run lifecycle phrase", RELEASE_UPDATE_DRY_RUN_TERM_GROUPS),
    ("update dry-run command phrase", RELEASE_UPDATE_DRY_RUN_COMMAND_TERM_GROUPS),
    (
        "update dry-run human output phrase",
        RELEASE_UPDATE_DRY_RUN_HUMAN_OUTPUT_TERM_GROUPS,
    ),
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
    "product_readiness_checked",
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


def repository_metadata_errors(
    package_json: dict,
    plugin_json: dict,
    release_policy_docs: dict[str, str],
) -> list[str]:
    errors: list[str] = []
    expected_package_values = {
        "package.json repository.url": f"git+{CANONICAL_REPOSITORY_URL}.git",
        "package.json homepage": f"{CANONICAL_REPOSITORY_URL}#readme",
        "package.json bugs.url": f"{CANONICAL_REPOSITORY_URL}/issues",
    }
    actual_package_values = {
        "package.json repository.url": (
            package_json.get("repository", {}).get("url")
            if isinstance(package_json.get("repository"), dict)
            else None
        ),
        "package.json homepage": package_json.get("homepage"),
        "package.json bugs.url": (
            package_json.get("bugs", {}).get("url")
            if isinstance(package_json.get("bugs"), dict)
            else None
        ),
    }
    for label, expected in expected_package_values.items():
        actual = actual_package_values.get(label)
        if actual != expected:
            errors.append(f"{label} mismatch: {actual!r} != {expected!r}")

    expected_plugin_values = {
        ".claude-plugin/plugin.json homepage": CANONICAL_REPOSITORY_URL,
        ".claude-plugin/plugin.json repository": CANONICAL_REPOSITORY_URL,
    }
    actual_plugin_values = {
        ".claude-plugin/plugin.json homepage": plugin_json.get("homepage"),
        ".claude-plugin/plugin.json repository": plugin_json.get("repository"),
    }
    for label, expected in expected_plugin_values.items():
        actual = actual_plugin_values.get(label)
        if actual != expected:
            errors.append(f"{label} mismatch: {actual!r} != {expected!r}")

    for label, text in release_policy_docs.items():
        if STALE_REPOSITORY_SLUG in text:
            errors.append(
                f"{label} contains stale repository slug: {STALE_REPOSITORY_SLUG}"
            )

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


def product_readiness_phrase_doc_errors(label: str, text: str) -> list[str]:
    errors: list[str] = []
    normalized = text.casefold()
    for phrase_label, term_groups in PRODUCT_READINESS_PHRASE_CHECKS:
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
    product_readiness_text: str | None = None,
) -> dict:
    errors: list[str] = []
    version = package_json.get("version")
    plugin_version = plugin_json.get("version")

    if not isinstance(version, str) or not version:
        errors.append("package.json version is missing")
        version = ""
    if plugin_version != version:
        errors.append(f"plugin manifest version mismatch: {plugin_version} != {version}")
    errors.extend(repository_metadata_errors(package_json, plugin_json, release_policy_docs))

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
    if product_readiness_text is not None:
        errors.extend(
            product_readiness_phrase_doc_errors(
                "docs/PRODUCT-READINESS.md",
                product_readiness_text,
            )
        )

    return {
        "version": version,
        "plugin_version": plugin_version,
        "changelog_version": changelog_version,
        "changelog_date": changelog_date,
        "roadmap_entry_found": bool(roadmap_entry),
        "audit_count": audit_count,
        "release_policy_docs_checked": list(release_policy_docs),
        "product_readiness_checked": product_readiness_text is not None,
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
    package_json = {
        "version": "1.2.3",
        "repository": {"url": f"git+{CANONICAL_REPOSITORY_URL}.git"},
        "homepage": f"{CANONICAL_REPOSITORY_URL}#readme",
        "bugs": {"url": f"{CANONICAL_REPOSITORY_URL}/issues"},
    }
    plugin_json = {
        "version": "1.2.3",
        "homepage": CANONICAL_REPOSITORY_URL,
        "repository": CANONICAL_REPOSITORY_URL,
    }
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
warnings at the accepted baseline. The same `npm run release:check` gate preserves Website Console bundle `mcp-probes.json` saved-payload guard phases through package contents, release self-tests, and packed-tarball smoke. The same `npm run release:check` gate also preserves Website Console bundle boundary metadata guard phases for bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke. The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke. The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate evidence guard through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke. It also smoke-tests human `design-ai version` output,
the packed-tarball smoke gate that covers the packed-tarball installed-bin path,
`npm run package:smoke` for installed-bin and one-shot npm exec package coverage,
including `design-ai workspace --strict --json` workspace strict failure/success readiness checks,
including `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries in installed-bin and one-shot paths,
including `design-ai workspace` workspace learning restore-backups readiness with restore rollback backup inventory in installed-bin and one-shot paths,
`design-ai site --stdin --json` Website Console export validation,
`design-ai site --stdin --next-actions --json --out file --force` Website Console next-action operator checklist output-file persistence in installed-bin and one-shot paths,
`design-ai site --stdin --next-actions --out file --force` Website Console next-action human checklist output-file persistence in installed-bin and one-shot paths,
`design-ai site --sample` Website Console sample workspace coverage,
`design-ai site --prompt-list --json` Website Console prompt template listing,
`design-ai site --stdin --mcp-check --json` Website Console MCP readiness check,
`design-ai site --stdin --mcp-check --probes --json` Website Console MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command,
`design-ai site --stdin --mcp-plan` Website Console MCP action plan,
`design-ai site --stdin --mcp-plan --probes` Website Console MCP probe action plan,
`design-ai site --stdin --mcp-plan --probes --json` Website Console MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage,
`design-ai site --stdin --graph --json` Website Console workflow graph export,
`design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle,
`design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification, bundle digest fingerprint verification, and generated bundle contract verification,
`design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison plus packed-tarball and public-registry smoke for warning-state Website Console bundle-compare strict failures where identical warning bundles keep `sameBundle: true` while exiting non-zero under `--strict`,
`design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest,
`design-ai site <bundle-dir> --bundle-repair --yes --json` Website Console bundle repair preview/apply drift recovery in installed-bin and one-shot paths with repair report --out file output-file persistence, shared repair guidance smoke helpers, and shared repair report assertion helpers,
`design-ai site --stdin --tasks` Website Console refactor task generation,
`design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation,
the one-shot `npm exec --package <tarball>` packed-tarball path,
the public `npm exec --package @design-ai/cli@<version>` registry path,
including public registry `design-ai workspace --strict --json` workspace strict failure/success readiness checks,
including public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries,
including public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory,
including public registry `design-ai site` Website Console export validation, including public registry `design-ai site --stdin --next-actions --json` next-action operator checklist contract with `mcpProbeCounts` probe count telemetry plus shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts plus public registry `design-ai site --stdin --next-actions --json --out file --force` next-action operator checklist output-file persistence plus public registry `design-ai site --stdin --next-actions --out file --force` next-action human checklist output-file persistence, sample workspace coverage, prompt template listing, MCP readiness, MCP readiness probes, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle, bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation, bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry plus package smoke self-test coverage for Website Console bundle MCP probe counts plus bundled Website Console `mcp-probes.json` saved probe evidence payload assertion instead of the full `site --mcp-check --probes --json` response, bundle-repair, refactor task generation, and task-selected prompt generation,
and after npm publish completes, `npm run registry:smoke` verifies the public install path,
public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation including public registry `design-ai learn --feedback --from-file` and public registry `design-ai learn --feedback --stdin`,
public registry JSON `design-ai learn --init` preview/apply output plus public registry learn init duplicate-skip output,
public registry JSON `design-ai learn --verify` output plus public registry learn verify `--out` file-write confirmation,
public registry JSON `design-ai learn --backup` output plus public registry learn backup `--out` file-write confirmation,
public registry JSON `design-ai learn --restore` preview/apply output plus public registry learn restore `--out` file-write confirmation plus public registry learn restore rollback backup verification plus public registry learn restore `--backup-file` path coverage,
public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage plus public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage,
public registry JSON `design-ai learn --import` dry-run/apply output plus public registry learn import `--out` file-write confirmation,
public registry JSON `design-ai learn --redact` output including public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, and public registry learn redact `--out` file-write confirmation,
public registry human / JSON `design-ai learn --stats` profile summary output plus public registry learn stats `--out` file-write confirmation,
public registry query-filtered learn list explanation/export JSON output,
public registry brief-relevant prompt/pack learning selection with public registry prompt/pack --with-learning and prompt/pack learning usage sidecar recording,
public registry `design-ai learn --eval-template` checkpoint generation plus public registry generated checkpoint strict validation,
public registry human / JSON `design-ai learn --audit` cleanup suggestion output plus public registry learn audit `--out` file-write confirmation,
public registry `design-ai learn --audit --fix --dry-run` cleanup preview and confirmed apply output,
and `npm run package:check` package contents check,
`npm run release:metadata` release metadata check,
release metadata JSON `product_readiness_checked: true` Product Readiness guard coverage,
`npm test` CLI unit tests,
`npm run audit:strict` all 8 audits,
`git diff --check` whitespace checks,
`npm run release:self-test` release assertion self-tests,
human `design-ai audit --strict --quiet` output and
`design-ai audit --strict --quiet --json` for machine-readable repository-audit output,
JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation,
JSON `design-ai learn --backup` output,
JSON `design-ai learn --redact` output including `design-ai learn --redact --from-file` and `design-ai learn --redact --stdin`,
learn JSON `--out` file-write confirmation and forced overwrite coverage,
JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation,
JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation,
learn restore rollback backup verification plus learn restore `--backup-file` path coverage,
design-ai learn --restore-backups restore rollback backup inventory coverage,
design-ai learn --restore-backups --prune restore rollback backup pruning coverage,
JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation,
human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation,
query-filtered learn list explanation/export JSON output,
brief-relevant prompt/pack learning selection and prompt/pack learning usage sidecar recording,
human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation,
human / JSON `design-ai learn --signals` learning signal registry plus `design-ai learn --signals --strict --json` strict gate plus learn signals `--out` file-write confirmation in installed-bin and one-shot paths,
human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation,
human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate,
human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation,
`design-ai help` top-level help output,
`design-ai help --json` topic catalog with probe-capable Website Console site help usage output,
command alias help and functional alias output,
command-specific help topic output, shared Website Console site help topic example smoke assertions including the `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown help example,
all three `list` catalog domains in human and JSON mode,
human / JSON corpus discovery output,
route JSON output, route catalog output, and route stdin input,
route eval, prompt eval, and pack eval checkpoint output in local package paths,
explicit `show --lines` output and `route --explain` output,
unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure,
unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure,
prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output,
prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations,
check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output,
`design-ai version --json` for machine-readable CLI/plugin version metadata,
human `design-ai install` output plus `design-ai install --json`
for machine-readable install lifecycle output, human `design-ai status` output plus JSON status output,
`design-ai status --json` for machine-readable install-state output, and
human `design-ai uninstall` output plus `design-ai uninstall --json`
for machine-readable uninstall lifecycle output. It also checks
human `design-ai update --dry-run` output and `design-ai update --dry-run --json`
machine-readable update plan before mutating lifecycle commands, plus
human diagnostics output from `design-ai doctor --strict` and
machine-readable diagnostics output from `design-ai doctor --json` before release.
"""
    korean_policy_doc = """# Distribution Korean

태그 전에는 `npm run release:check` core gate와 `npm run ci:local`을 실행해요.
`npm run ci:local`은 MkDocs 경고 정책을 확인해요. non-`refs/` warning은
차단하고, 의도된 `refs/` 소스 링크와 refs-only warning은 승인된 기준선
안에 있어야 해요. 같은 `npm run release:check` gate는 Website Console bundle `mcp-probes.json` saved-payload guard 단계를 package contents, release self-tests, packed-tarball smoke로 함께 보존해요. 같은 `npm run release:check` gate는 Website Console bundle boundary metadata guard 단계도 bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke와 함께 보존해요. 같은 `npm run release:check` gate는 Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence도 unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, packed-tarball smoke와 함께 보존해요. 같은 `npm run release:check` gate는 Product Readiness release policy full gate evidence guard도 unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, packed-tarball smoke와 함께 보존해요. human `design-ai version` 출력도 smoke test하고,
packed-tarball installed-bin 경로도 확인하고,
`npm run package:smoke`로 installed-bin과 one-shot npm exec package smoke를 확인하고,
`design-ai workspace --strict --json` strict 실패/성공 readiness checks도 확인하고,
`design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summary도 installed-bin과 one-shot 경로에서 확인하고,
`design-ai workspace` workspace learning restore-backups readiness와 restore rollback backup inventory도 installed-bin과 one-shot 경로에서 확인하고,
`design-ai site --stdin --json` Website Console export validation도 확인하고,
`design-ai site --stdin --next-actions --json --out file --force` Website Console next-action operator checklist `--out` file 저장 확인도 installed-bin과 one-shot 경로에서 확인하고,
`design-ai site --stdin --next-actions --out file --force` Website Console next-action human checklist `--out` file 저장 확인도 installed-bin과 one-shot 경로에서 확인하고,
`design-ai site --sample` Website Console sample workspace 생성도 확인하고,
`design-ai site --prompt-list --json` Website Console prompt template 목록도 확인하고,
`design-ai site --stdin --mcp-check --json` Website Console MCP readiness 검증도 확인하고,
`design-ai site --stdin --mcp-check --probes --json` Website Console MCP readiness probe JSON `--out` file 저장 확인, shared MCP probe output-file smoke assertions, MCP check 내장 probe next-step commands, MCP check 내장 command 실행 smoke coverage, human MCP check probe command guidance and output-file smoke coverage plus MCP check 내장 human report output command도 확인하고,
`design-ai site --stdin --mcp-plan` Website Console MCP action plan 생성도 확인하고,
`design-ai site --stdin --mcp-plan --probes` Website Console MCP probe action plan 생성도 확인하고,
`design-ai site --stdin --mcp-plan --probes --json` Website Console MCP probe action plan JSON 생성과 `--out` file 저장 확인 및 MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage도 확인하고,
`design-ai site --stdin --graph --json` Website Console workflow graph 생성도 확인하고,
`design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle 생성도 확인하고,
`design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle checksum 검증, bundle digest 검증, generated bundle contract 검증도 확인하고,
`design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle 비교와 bundle digest 비교 및 packed-tarball과 public-registry smoke에서 warning-state Website Console bundle-compare strict 경고 실패가 동일 warning bundle의 sameBundle true 유지와 strict에서 non-zero 종료를 보존하는지도 확인하고,
`design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console 대상 repo handoff prompt와 검증된 handoff bundle digest도 확인하고,
`design-ai site <bundle-dir> --bundle-repair --yes --json` Website Console bundle repair preview/apply drift recovery와 repair report --out file 저장, 공용 repair guidance smoke helper, 공용 repair report assertion helper도 installed-bin과 one-shot 경로에서 확인하고,
`design-ai site --stdin --tasks` Website Console refactor task 생성도 확인하고,
`design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected 단일 prompt 생성도 확인하고,
npm exec --package <tarball> 경로도 packed-tarball smoke로 확인하고,
공개 npm registry package를 `npm exec --package @design-ai/cli@<version>` 경로로 확인하고,
공개 npm registry `design-ai workspace --strict --json` strict 실패/성공 readiness checks도 확인하고,
공개 npm registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summary도 확인하고,
공개 npm registry `design-ai workspace` workspace restore-backups readiness와 restore rollback backup inventory도 확인하고,
공개 npm registry `design-ai site` Website Console export validation, 공개 npm registry `design-ai site --stdin --next-actions --json` next-action operator checklist 계약 및 `mcpProbeCounts` probe count telemetry와 shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts 및 공개 npm registry `design-ai site --stdin --next-actions --json --out file --force` next-action operator checklist `--out` file 저장 확인 및 공개 npm registry `design-ai site --stdin --next-actions --out file --force` next-action human checklist `--out` file 저장 확인, sample workspace, prompt template 목록, MCP readiness, MCP readiness probe, MCP readiness probe JSON `--out` file 저장 확인, shared MCP probe output-file smoke assertions, human MCP check probe command guidance and output-file smoke coverage plus MCP check 내장 human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON `--out` file 저장 확인과 MCP action plan 내장 probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle, bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation, bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry 및 package smoke self-test coverage for Website Console bundle MCP probe counts plus bundled Website Console `mcp-probes.json` saved probe evidence payload assertion instead of the full `site --mcp-check --probes --json` response, bundle-repair, refactor task 생성, task-selected prompt 생성도 확인하고,
npm publish가 끝난 뒤 `npm run registry:smoke`로 공개 설치 경로도 확인하고,
public registry JSON `design-ai learn --feedback` output과 public registry learn feedback `--out` file-write confirmation, public registry `design-ai learn --feedback --from-file`, public registry `design-ai learn --feedback --stdin`도 확인하고,
public registry JSON `design-ai learn --init` preview/apply output과 public registry learn init duplicate-skip output도 확인하고,
public registry JSON `design-ai learn --verify` output과 public registry learn verify `--out` file-write confirmation도 확인하고,
public registry JSON `design-ai learn --backup` output과 public registry learn backup `--out` file-write confirmation도 확인하고,
public registry JSON `design-ai learn --restore` preview/apply output과 public registry learn restore `--out` file-write confirmation, public registry learn restore rollback backup verification, public registry learn restore `--backup-file` path coverage도 확인하고,
public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage와 public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage도 확인하고,
public registry JSON `design-ai learn --import` dry-run/apply output과 public registry learn import `--out` file-write confirmation도 확인하고,
public registry JSON `design-ai learn --redact` output과 public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, public registry learn redact `--out` file-write confirmation도 확인하고,
public registry human / JSON `design-ai learn --stats` profile summary output과 public registry learn stats `--out` file-write confirmation도 확인하고,
public registry query-filtered learn list explanation/export JSON output도 확인하고,
public registry brief-relevant prompt/pack learning selection과 public registry prompt/pack --with-learning, prompt/pack learning usage sidecar recording도 확인하고,
public registry `design-ai learn --eval-template` checkpoint generation과 public registry generated checkpoint strict validation도 확인하고,
public registry human / JSON `design-ai learn --audit` cleanup suggestion output과 public registry learn audit `--out` file-write confirmation도 확인하고,
public registry `design-ai learn --audit --fix --dry-run` cleanup preview와 confirmed apply output도 확인하고,
`npm run package:check` package contents check도 확인하고,
`npm run release:metadata` release metadata 검증도 확인하고,
release metadata JSON `product_readiness_checked: true` Product Readiness guard coverage도 확인하고,
`npm test` CLI unit test 실행도 확인하고,
`npm run audit:strict` 8개 audit도 확인하고,
`git diff --check` whitespace check 검증도 확인하고,
`npm run release:self-test` release self-test 검증도 확인하고,
human `design-ai audit --strict --quiet` 출력도 smoke test하고,
`design-ai audit --strict --quiet --json`으로 machine-readable repository-audit output도 확인하며,
JSON `design-ai learn --feedback` output과 learn feedback `--out` file-write confirmation도 확인하며,
JSON `design-ai learn --backup` output도 확인하며,
JSON `design-ai learn --redact` output과 `design-ai learn --redact --from-file`, `design-ai learn --redact --stdin`도 확인하며,
learn JSON `--out` file-write confirmation과 forced overwrite coverage도 확인하며,
JSON `design-ai learn --verify` output과 learn verify `--out` file-write confirmation도 확인하며,
JSON `design-ai learn --restore` preview/apply output과 learn restore `--out` file-write confirmation도 확인하며,
learn restore rollback backup verification과 learn restore `--backup-file` path coverage도 확인하며,
design-ai learn --restore-backups restore rollback backup inventory coverage도 확인하며,
design-ai learn --restore-backups --prune restore rollback backup pruning coverage도 확인하며,
JSON `design-ai learn --import` dry-run/apply output과 learn import `--out` file-write confirmation도 확인하며,
human / JSON `design-ai learn --stats` profile summary output과 learn stats `--out` file-write confirmation도 확인하며,
query-filtered learn list explanation/export JSON output도 확인하며,
brief-relevant prompt/pack learning selection과 prompt/pack learning usage sidecar recording도 확인하며,
human / JSON `design-ai learn --usage` usage sidecar report와 learn usage `--out` file-write confirmation도 확인하며,
human / JSON `design-ai learn --signals` learning signal registry plus `design-ai learn --signals --strict --json` strict gate plus learn signals `--out` file-write confirmation도 installed-bin과 one-shot 경로에서 확인하며,
human / JSON `design-ai learn --eval-template` checkpoint generation과 generated checkpoint strict validation도 확인하며,
human / JSON `design-ai learn --eval` checkpoint report와 learn eval `--out` file-write confirmation 및 learn eval `--strict` failure gate도 확인하며,
human / JSON `design-ai learn --audit` cleanup suggestion output과 learn audit `--out` file-write confirmation도 확인하며,
`design-ai help` top-level help 출력도 확인하며,
`design-ai help --json` topic catalog with probe-capable Website Console site help usage output도 확인하며,
command alias help와 functional alias 출력도 확인해요.
command-specific help topic 출력과 shared Website Console site help topic example smoke assertions 및 `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown 도움말 예시도 확인해요.
세 가지 `list` catalog domain의 human/JSON 출력도 확인해요.
human / JSON corpus discovery 출력도 확인해요.
route JSON 출력, route catalog 출력, route stdin 입력도 확인해요.
route eval, prompt eval, pack eval checkpoint output도 local package paths에서 확인해요.
명시적 `show --lines` 출력과 `route --explain` 출력도 확인해요.
unknown command failure, unknown help-topic failure, unknown list-domain failure, unknown search-dir failure 검증도 확인해요.
unknown route-id suggestion, unknown option suggestion, unknown value suggestion, numeric range failure도 확인해요.
prompt JSON 출력, prompt markdown 출력, prompt from-file 출력, prompt stdin 출력, pack JSON 출력, pack markdown 출력, pack from-file 출력, pack stdin 출력도 확인해요.
prompt/pack 강제 `--out` overwrite와 prompt/pack file-write confirmation도 확인해요.
check examples 출력, check artifact 출력, check stdin 출력, check all-routes 출력, check learning capture output도 확인해요.
`design-ai version --json`으로 machine-readable version metadata도 smoke test해요.
human `design-ai install` 출력과 JSON `design-ai install --json`으로 machine-readable install lifecycle output을 확인하고,
human `design-ai status` 출력과 JSON status 출력도 확인하며,
`design-ai status --json`으로 machine-readable install-state output도 uninstall 전에 확인하고,
human `design-ai uninstall` 출력과 JSON `design-ai uninstall --json`으로 machine-readable uninstall lifecycle output도 확인해요.
human `design-ai update --dry-run` 출력과 `design-ai update --dry-run --json`
machine-readable update plan도 mutating lifecycle command 전에 확인하고,
`design-ai doctor --strict` human diagnostics 출력과
`design-ai doctor --json` machine-readable diagnostics 출력도 release 전에 확인해요.
"""
    release_policy_docs = {
        "README.md": english_policy_doc,
        "README.ko.md": korean_policy_doc,
        "docs/RELEASE-CHECKLIST.md": english_policy_doc,
        "docs/DISTRIBUTION.md": english_policy_doc,
        "docs/DISTRIBUTION.ko.md": korean_policy_doc,
    }
    product_readiness_doc = """
Product readiness covers Website Console handoff bundle compare through `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` with bundle digest comparison plus warning-state strict smoke coverage that keeps identical warning bundles at `sameBundle: true` while exiting non-zero under `--strict`. Public registry Website Console coverage includes handoff bundle, bundle-check/compare/handoff/repair including warning-state bundle-compare strict smoke coverage after publish, plus bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation, plus MCP probe count telemetry and package/shared smoke self-test coverage for Website Console MCP probe counts, plus bundled Website Console `mcp-probes.json` saved probe evidence payload instead of the full `site --mcp-check --probes --json` response. Local release confidence says `npm run release:check` now passes after the Website Console bundle `mcp-probes.json` saved-payload guard phases, after the Product Readiness and release-facing policy docs bundle boundary metadata guards for bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording, after the release-facing policy docs guard for Website Console bundle boundary metadata full `release:check` evidence, and after the release-facing policy docs Product Readiness release policy full gate evidence guard, covering unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.
"""
    passing = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc,
    )
    assert_condition(passing["errors"] == [], "complete fixture should pass without errors")
    assert_condition(
        passing["release_policy_docs_checked"] == list(REQUIRED_RELEASE_POLICY_DOC_LABELS),
        "complete fixture should report the required release policy docs in order",
    )
    assert_condition(
        passing["product_readiness_checked"] is True,
        "complete fixture should report Product Readiness guard coverage",
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
        '"product_readiness_checked": true' in passing_json_output,
        "JSON formatter should expose Product Readiness guard coverage",
    )
    assert_condition(
        format_human_summary(passing) == "Release metadata check passed: v1.2.3, 8 audits, CHANGELOG 2026-05",
        "human formatter should preserve the passing release metadata summary",
    )
    assert_condition(
        release_policy_phrase_table_errors() == [],
        "release policy phrase guard table should be well formed",
    )
    stale_repo_summary = release_metadata_summary(
        package_json={
            **package_json,
            "repository": {"url": f"git+https://github.com/{STALE_REPOSITORY_SLUG}.git"},
        },
        plugin_json={
            **plugin_json,
            "repository": f"https://github.com/{STALE_REPOSITORY_SLUG}",
        },
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc + f"\nhttps://github.com/{STALE_REPOSITORY_SLUG}\n",
        },
        audit_count=8,
    )
    stale_repo_errors = "\n".join(stale_repo_summary["errors"])
    assert_condition(
        "package.json repository.url mismatch" in stale_repo_errors,
        "release metadata should fail stale package repository URLs",
    )
    assert_condition(
        ".claude-plugin/plugin.json repository mismatch" in stale_repo_errors,
        "release metadata should fail stale plugin repository URLs",
    )
    assert_condition(
        "README.md contains stale repository slug" in stale_repo_errors,
        "release metadata should fail stale release-policy repository slugs",
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

    mcp_probes_release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " The same `npm run release:check` gate preserves Website Console bundle `mcp-probes.json` saved-payload guard phases through package contents, release self-tests, and packed-tarball smoke.",
                "",
            ),
        },
        audit_count=8,
    )
    mcp_probes_release_check_drift_errors = "\n".join(
        mcp_probes_release_check_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing Website Console mcp-probes release-check evidence phrase"
            in mcp_probes_release_check_drift_errors
        ),
        "release policy docs should tie release:check to mcp-probes saved-payload guard evidence",
    )

    bundle_boundary_release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " The same `npm run release:check` gate also preserves Website Console bundle boundary metadata guard phases for bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
            ),
        },
        audit_count=8,
    )
    bundle_boundary_release_check_drift_errors = "\n".join(
        bundle_boundary_release_check_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing Website Console bundle boundary release-check evidence phrase"
            in bundle_boundary_release_check_drift_errors
        ),
        "release policy docs should tie release:check to bundle boundary metadata guard evidence",
    )

    product_readiness_policy_full_gate_release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
            ),
        },
        audit_count=8,
    )
    product_readiness_policy_full_gate_release_check_drift_errors = "\n".join(
        product_readiness_policy_full_gate_release_check_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing Product Readiness release policy full gate release-check evidence phrase"
            in product_readiness_policy_full_gate_release_check_drift_errors
        ),
        "release policy docs should tie release:check to Product Readiness full gate evidence",
    )

    product_readiness_policy_full_gate_evidence_release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate evidence guard through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
            ),
        },
        audit_count=8,
    )
    product_readiness_policy_full_gate_evidence_release_check_drift_errors = "\n".join(
        product_readiness_policy_full_gate_evidence_release_check_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing Product Readiness release policy full gate evidence guard release-check phrase"
            in product_readiness_policy_full_gate_evidence_release_check_drift_errors
        ),
        "release policy docs should tie release:check to Product Readiness full gate evidence guard",
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
            ).replace(
                "next-action operator checklist output-file persistence in installed-bin and one-shot paths",
                "next-action operator checklist output-file persistence in packaged paths",
            ).replace(
                "next-action human checklist output-file persistence in installed-bin and one-shot paths",
                "next-action human checklist output-file persistence in packaged paths",
            ).replace(
                "checkpoint summaries in installed-bin and one-shot paths",
                "checkpoint summaries in packaged paths",
            ).replace(
                "restore rollback backup inventory in installed-bin and one-shot paths",
                "restore rollback backup inventory in packaged paths",
            ).replace(
                "learn signals `--out` file-write confirmation in installed-bin and one-shot paths",
                "learn signals output-file confirmation in packaged paths",
            ).replace(
                "bundle repair preview/apply drift recovery in installed-bin and one-shot paths with repair report --out file output-file persistence, shared repair guidance smoke helpers, and shared repair report assertion helpers",
                "bundle repair preview/apply drift recovery in packaged paths with repair report output-file persistence",
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

    repair_guidance_helper_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                ", shared repair guidance smoke helpers",
                "",
            ),
        },
        audit_count=8,
    )
    repair_guidance_helper_drift_errors = "\n".join(repair_guidance_helper_drift["errors"])
    assert_condition(
        "README.md is missing site bundle-repair package smoke phrase"
        in repair_guidance_helper_drift_errors,
        "release policy docs should mention shared repair guidance smoke helpers",
    )

    repair_report_assertion_helper_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                ", and shared repair report assertion helpers",
                "",
            ),
        },
        audit_count=8,
    )
    repair_report_assertion_helper_drift_errors = "\n".join(
        repair_report_assertion_helper_drift["errors"]
    )
    assert_condition(
        "README.md is missing site bundle-repair package smoke phrase"
        in repair_report_assertion_helper_drift_errors,
        "release policy docs should mention shared repair report assertion helpers",
    )

    mcp_shared_output_assertion_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus shared MCP probe output-file smoke assertions",
                "",
            ),
        },
        audit_count=8,
    )
    mcp_shared_output_assertion_drift_errors = "\n".join(
        mcp_shared_output_assertion_drift["errors"]
    )
    assert_condition(
        "README.md is missing site MCP shared output assertion phrase"
        in mcp_shared_output_assertion_drift_errors,
        "release policy docs should mention shared MCP probe output-file smoke assertions",
    )

    mcp_check_embedded_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus embedded MCP check probe next-step commands",
                "",
            ),
        },
        audit_count=8,
    )
    mcp_check_embedded_command_drift_errors = "\n".join(
        mcp_check_embedded_command_drift["errors"]
    )
    assert_condition(
        "README.md is missing site MCP check embedded command phrase"
        in mcp_check_embedded_command_drift_errors,
        "release policy docs should mention embedded MCP check probe next-step commands",
    )

    mcp_check_executable_embedded_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus executable embedded MCP check probe command smoke coverage",
                "",
            ),
        },
        audit_count=8,
    )
    mcp_check_executable_embedded_command_drift_errors = "\n".join(
        mcp_check_executable_embedded_command_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP check executable embedded command smoke phrase"
            in mcp_check_executable_embedded_command_drift_errors
        ),
        "release policy docs should mention executable embedded MCP check probe command smoke coverage",
    )

    mcp_check_human_command_guidance_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus human MCP check probe command guidance and output-file smoke coverage",
                "",
            ),
        },
        audit_count=8,
    )
    mcp_check_human_command_guidance_drift_errors = "\n".join(
        mcp_check_human_command_guidance_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP check human command guidance smoke phrase"
            in mcp_check_human_command_guidance_drift_errors
        ),
        "release policy docs should mention human MCP check probe command guidance and output-file smoke coverage",
    )

    mcp_check_human_output_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus embedded MCP check probe human report output command",
                "",
            ),
        },
        audit_count=8,
    )
    mcp_check_human_output_command_drift_errors = "\n".join(
        mcp_check_human_output_command_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP check human output command phrase"
            in mcp_check_human_output_command_drift_errors
        ),
        "release policy docs should mention embedded MCP check probe human report output command",
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
            ).replace(
                " The same `npm run release:check` gate preserves Website Console bundle `mcp-probes.json` saved-payload guard phases through package contents, release self-tests, and packed-tarball smoke.",
                "",
            ).replace(
                " The same `npm run release:check` gate also preserves Website Console bundle boundary metadata guard phases for bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
            ).replace(
                " The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
            ).replace(
                " The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate evidence guard through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
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

    learn_signals_strict_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human / JSON `design-ai learn --signals` learning signal registry plus `design-ai learn --signals --strict --json` strict gate plus learn signals `--out` file-write confirmation in installed-bin and one-shot paths",
                "human / JSON learning signal registry coverage",
            ),
        },
        audit_count=8,
    )
    learn_signals_strict_package_smoke_drift_errors = "\n".join(
        learn_signals_strict_package_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing learn signals strict package smoke phrase"
            in learn_signals_strict_package_smoke_drift_errors
        ),
        "release policy docs should mention learn signals strict package smoke",
    )

    workspace_strict_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`design-ai workspace --strict --json` workspace strict failure/success readiness checks",
                "workspace readiness coverage",
            ),
        },
        audit_count=8,
    )
    workspace_strict_package_smoke_drift_errors = "\n".join(
        workspace_strict_package_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing workspace strict package smoke phrase"
            in workspace_strict_package_smoke_drift_errors
        ),
        "release policy docs should mention workspace strict package smoke",
    )

    workspace_learning_eval_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": (
                english_policy_doc.replace(
                    "`design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries in installed-bin and one-shot paths",
                    "workspace eval coverage",
                ).replace(
                    "including public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries",
                    "including public registry workspace eval coverage",
                )
            ),
        },
        audit_count=8,
    )
    workspace_learning_eval_package_smoke_drift_errors = "\n".join(
        workspace_learning_eval_package_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing workspace learning-eval package smoke phrase"
            in workspace_learning_eval_package_smoke_drift_errors
        ),
        "release policy docs should mention workspace learning-eval package smoke",
    )

    workspace_restore_backups_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": (
                english_policy_doc.replace(
                    "including `design-ai workspace` workspace learning restore-backups readiness with restore rollback backup inventory in installed-bin and one-shot paths",
                    "including workspace restore backup coverage",
                ).replace(
                    "including public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory",
                    "including public registry workspace restore backup coverage",
                )
            ),
        },
        audit_count=8,
    )
    workspace_restore_backups_package_smoke_drift_errors = "\n".join(
        workspace_restore_backups_package_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing workspace restore-backups package smoke phrase"
            in workspace_restore_backups_package_smoke_drift_errors
        ),
        "release policy docs should mention workspace restore-backups package smoke",
    )

    workspace_strict_registry_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry `design-ai workspace --strict --json` workspace strict failure/success readiness checks",
                "public registry workspace readiness checks",
            ),
        },
        audit_count=8,
    )
    workspace_strict_registry_smoke_drift_errors = "\n".join(
        workspace_strict_registry_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing workspace strict registry smoke phrase"
            in workspace_strict_registry_smoke_drift_errors
        ),
        "release policy docs should mention public registry workspace strict smoke",
    )

    workspace_learning_eval_registry_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "including public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries",
                "including public registry workspace eval coverage",
            ),
        },
        audit_count=8,
    )
    workspace_learning_eval_registry_smoke_drift_errors = "\n".join(
        workspace_learning_eval_registry_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing workspace learning-eval registry smoke phrase"
            in workspace_learning_eval_registry_smoke_drift_errors
        ),
        "release policy docs should mention public registry workspace learning-eval smoke",
    )

    workspace_restore_backups_registry_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "including public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory",
                "including public registry workspace restore backup coverage",
            ),
        },
        audit_count=8,
    )
    workspace_restore_backups_registry_smoke_drift_errors = "\n".join(
        workspace_restore_backups_registry_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing workspace restore-backups registry smoke phrase"
            in workspace_restore_backups_registry_smoke_drift_errors
        ),
        "release policy docs should mention public registry workspace restore-backups smoke",
    )

    site_registry_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "including public registry `design-ai site` Website Console export validation, including public registry `design-ai site --stdin --next-actions --json` next-action operator checklist contract with `mcpProbeCounts` probe count telemetry plus shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts plus public registry `design-ai site --stdin --next-actions --json --out file --force` next-action operator checklist output-file persistence plus public registry `design-ai site --stdin --next-actions --out file --force` next-action human checklist output-file persistence, sample workspace coverage, prompt template listing, MCP readiness, MCP readiness probes, MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, MCP action plan, MCP probe action plan, MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, handoff bundle, bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation, bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry plus package smoke self-test coverage for Website Console bundle MCP probe counts plus bundled Website Console `mcp-probes.json` saved probe evidence payload assertion instead of the full `site --mcp-check --probes --json` response, bundle-repair, refactor task generation, and task-selected prompt generation",
                "including public registry Website Console coverage",
            ),
        },
        audit_count=8,
    )
    site_registry_smoke_drift_errors = "\n".join(site_registry_smoke_drift["errors"])
    assert_condition(
        "README.md is missing site registry smoke phrase" in site_registry_smoke_drift_errors,
        "release policy docs should mention public registry Website Console smoke",
    )

    site_next_actions_registry_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "including public registry `design-ai site --stdin --next-actions --json` next-action operator checklist contract with `mcpProbeCounts` probe count telemetry plus shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts plus ",
                "including ",
            ),
        },
        audit_count=8,
    )
    site_next_actions_registry_smoke_drift_errors = "\n".join(
        site_next_actions_registry_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site next-actions registry smoke phrase"
            in site_next_actions_registry_smoke_drift_errors
        ),
        "release policy docs should mention public registry Website Console next-actions smoke",
    )

    site_next_actions_mcp_probe_counts_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " with `mcpProbeCounts` probe count telemetry",
                "",
            ),
        },
        audit_count=8,
    )
    site_next_actions_mcp_probe_counts_drift_errors = "\n".join(
        site_next_actions_mcp_probe_counts_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site next-actions MCP probe counts phrase"
            in site_next_actions_mcp_probe_counts_drift_errors
        ),
        "release policy docs should mention Website Console next-actions MCP probe counts",
    )

    site_next_actions_mcp_probe_counts_self_test_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus shared smoke assertion self-test coverage for Website Console next-actions MCP probe counts",
                "",
            ),
        },
        audit_count=8,
    )
    site_next_actions_mcp_probe_counts_self_test_drift_errors = "\n".join(
        site_next_actions_mcp_probe_counts_self_test_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site next-actions MCP probe count self-test phrase"
            in site_next_actions_mcp_probe_counts_self_test_drift_errors
        ),
        (
            "release policy docs should mention Website Console next-actions "
            "MCP probe count smoke self-tests"
        ),
    )

    site_next_actions_output_file_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": (
                english_policy_doc.replace(
                    "`design-ai site --stdin --next-actions --json --out file --force` Website Console next-action operator checklist output-file persistence in installed-bin and one-shot paths,\n",
                    "",
                ).replace(
                    " plus public registry `design-ai site --stdin --next-actions --json --out file --force` next-action operator checklist output-file persistence",
                    "",
                )
            ),
        },
        audit_count=8,
    )
    site_next_actions_output_file_smoke_drift_errors = "\n".join(
        site_next_actions_output_file_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site next-actions output-file smoke phrase"
            in site_next_actions_output_file_smoke_drift_errors
        ),
        "release policy docs should mention Website Console next-actions output-file smoke",
    )

    site_next_actions_human_output_file_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": (
                english_policy_doc.replace(
                    "`design-ai site --stdin --next-actions --out file --force` Website Console next-action human checklist output-file persistence in installed-bin and one-shot paths,\n",
                    "",
                ).replace(
                    " plus public registry `design-ai site --stdin --next-actions --out file --force` next-action human checklist output-file persistence",
                    "",
                )
            ),
        },
        audit_count=8,
    )
    site_next_actions_human_output_file_smoke_drift_errors = "\n".join(
        site_next_actions_human_output_file_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site next-actions human output-file smoke phrase"
            in site_next_actions_human_output_file_smoke_drift_errors
        ),
        "release policy docs should mention Website Console next-actions human output-file smoke",
    )

    site_registry_mcp_probe_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "MCP readiness probes, ",
                "",
            ),
        },
        audit_count=8,
    )
    site_registry_mcp_probe_drift_errors = "\n".join(site_registry_mcp_probe_drift["errors"])
    assert_condition(
        "README.md is missing site registry smoke phrase" in site_registry_mcp_probe_drift_errors,
        "release policy docs should mention public registry Website Console MCP probe smoke",
    )

    site_registry_mcp_probe_json_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "MCP readiness probe JSON with `--out` file-write confirmation plus shared MCP probe output-file smoke assertions plus embedded MCP check probe next-step commands plus executable embedded MCP check probe command smoke coverage plus human MCP check probe command guidance and output-file smoke coverage plus embedded MCP check probe human report output command, ",
                "",
            ),
        },
        audit_count=8,
    )
    site_registry_mcp_probe_json_out_drift_errors = "\n".join(
        site_registry_mcp_probe_json_out_drift["errors"]
    )
    assert_condition(
        "README.md is missing site registry smoke phrase"
        in site_registry_mcp_probe_json_out_drift_errors,
        "release policy docs should mention public registry Website Console MCP readiness probe JSON out-file smoke",
    )

    site_registry_mcp_probe_action_plan_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "MCP probe action plan",
                "MCP probe plan",
            ),
        },
        audit_count=8,
    )
    site_registry_mcp_probe_action_plan_drift_errors = "\n".join(
        site_registry_mcp_probe_action_plan_drift["errors"]
    )
    assert_condition(
        "README.md is missing site registry smoke phrase"
        in site_registry_mcp_probe_action_plan_drift_errors,
        "release policy docs should mention public registry Website Console MCP probe action plan smoke",
    )

    site_registry_mcp_probe_action_plan_json_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage, ",
                "",
            ),
        },
        audit_count=8,
    )
    site_registry_mcp_probe_action_plan_json_drift_errors = "\n".join(
        site_registry_mcp_probe_action_plan_json_drift["errors"]
    )
    assert_condition(
        "README.md is missing site registry smoke phrase"
        in site_registry_mcp_probe_action_plan_json_drift_errors,
        "release policy docs should mention public registry Website Console MCP probe action plan JSON smoke",
    )

    site_registry_mcp_probe_action_plan_json_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
                "MCP probe action plan JSON",
            ),
        },
        audit_count=8,
    )
    site_registry_mcp_probe_action_plan_json_out_drift_errors = "\n".join(
        site_registry_mcp_probe_action_plan_json_out_drift["errors"]
    )
    assert_condition(
        "README.md is missing site registry smoke phrase"
        in site_registry_mcp_probe_action_plan_json_out_drift_errors,
        "release policy docs should mention public registry Website Console MCP probe action plan JSON out-file smoke",
    )

    site_mcp_probe_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`design-ai site --stdin --mcp-check --probes --json` Website Console MCP readiness probe JSON with `--out` file-write confirmation",
                "Website Console MCP probe coverage",
            ).replace(
                "`site --mcp-check --probes --json`",
                "`site mcp-check probes json`",
            ),
        },
        audit_count=8,
    )
    site_mcp_probe_package_smoke_drift_errors = "\n".join(
        site_mcp_probe_package_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing site mcp-check package smoke phrase"
        in site_mcp_probe_package_smoke_drift_errors,
        "release policy docs should mention Website Console MCP probe smoke",
    )

    site_mcp_probe_json_out_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "MCP readiness probe JSON with `--out` file-write confirmation",
                "MCP readiness probe JSON",
            ),
        },
        audit_count=8,
    )
    site_mcp_probe_json_out_package_smoke_drift_errors = "\n".join(
        site_mcp_probe_json_out_package_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing site mcp-check package smoke phrase"
        in site_mcp_probe_json_out_package_smoke_drift_errors,
        "release policy docs should mention Website Console MCP readiness probe JSON out-file smoke",
    )

    site_mcp_plan_probe_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "MCP probe action plan",
                "MCP probe plan",
            ),
        },
        audit_count=8,
    )
    site_mcp_plan_probe_package_smoke_drift_errors = "\n".join(
        site_mcp_plan_probe_package_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing site mcp-plan package smoke phrase"
        in site_mcp_plan_probe_package_smoke_drift_errors,
        "release policy docs should mention Website Console MCP probe action plan smoke",
    )

    site_mcp_plan_probe_json_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`design-ai site --stdin --mcp-plan --probes --json` Website Console MCP probe action plan JSON with `--out` file-write confirmation plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
                "Website Console MCP probe plan JSON coverage",
            ),
        },
        audit_count=8,
    )
    site_mcp_plan_probe_json_package_smoke_drift_errors = "\n".join(
        site_mcp_plan_probe_json_package_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing site mcp-plan package smoke phrase"
        in site_mcp_plan_probe_json_package_smoke_drift_errors,
        "release policy docs should mention Website Console MCP probe action plan JSON smoke",
    )

    site_mcp_plan_probe_json_out_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " with `--out` file-write confirmation",
                "",
            ),
        },
        audit_count=8,
    )
    site_mcp_plan_probe_json_out_package_smoke_drift_errors = "\n".join(
        site_mcp_plan_probe_json_out_package_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing site mcp-plan package smoke phrase"
        in site_mcp_plan_probe_json_out_package_smoke_drift_errors,
        "release policy docs should mention Website Console MCP probe action plan JSON out-file smoke",
    )

    site_mcp_action_plan_embedded_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
                "",
            ),
        },
        audit_count=8,
    )
    site_mcp_action_plan_embedded_command_drift_errors = "\n".join(
        site_mcp_action_plan_embedded_command_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP action plan embedded command phrase"
            in site_mcp_action_plan_embedded_command_drift_errors
        ),
        "release policy docs should mention embedded MCP action plan probe output-file commands plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
    )

    site_mcp_action_plan_human_output_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
                "",
            ),
        },
        audit_count=8,
    )
    site_mcp_action_plan_human_output_command_drift_errors = "\n".join(
        site_mcp_action_plan_human_output_command_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP action plan human output command parity phrase"
            in site_mcp_action_plan_human_output_command_drift_errors
        ),
        "release policy docs should mention MCP action plan human report output command parity plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
    )

    site_mcp_action_plan_human_output_command_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
                "",
            ),
        },
        audit_count=8,
    )
    site_mcp_action_plan_human_output_command_smoke_drift_errors = "\n".join(
        site_mcp_action_plan_human_output_command_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP action plan human output command smoke phrase"
            in site_mcp_action_plan_human_output_command_smoke_drift_errors
        ),
        "release policy docs should mention MCP action plan emitted human report command smoke coverage plus MCP action plan emitted check JSON command smoke coverage plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
    )

    site_mcp_action_plan_check_json_command_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus MCP action plan emitted check JSON command smoke coverage",
                "",
            ),
        },
        audit_count=8,
    )
    site_mcp_action_plan_check_json_command_smoke_drift_errors = "\n".join(
        site_mcp_action_plan_check_json_command_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP action plan check JSON command smoke phrase"
            in site_mcp_action_plan_check_json_command_smoke_drift_errors
        ),
        "release policy docs should mention MCP action plan emitted check JSON command smoke coverage",
    )

    site_mcp_action_plan_self_archive_command_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
                "",
            ),
        },
        audit_count=8,
    )
    site_mcp_action_plan_self_archive_command_smoke_drift_errors = "\n".join(
        site_mcp_action_plan_self_archive_command_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP action plan self-archive command smoke phrase"
            in site_mcp_action_plan_self_archive_command_smoke_drift_errors
        ),
        "release policy docs should mention MCP action plan emitted self-archive command smoke coverage plus shared MCP action plan command mapping self-test coverage",
    )

    site_mcp_action_plan_command_mapping_self_test_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus shared MCP action plan command mapping self-test coverage",
                "",
            ),
        },
        audit_count=8,
    )
    site_mcp_action_plan_command_mapping_self_test_drift_errors = "\n".join(
        site_mcp_action_plan_command_mapping_self_test_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site MCP action plan command mapping self-test phrase"
            in site_mcp_action_plan_command_mapping_self_test_drift_errors
        ),
        "release policy docs should mention shared MCP action plan command mapping self-test coverage",
    )

    site_workflow_graph_package_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "`design-ai site --stdin --graph --json` Website Console workflow graph export",
                "Website Console graph coverage",
            ),
        },
        audit_count=8,
    )
    site_workflow_graph_package_smoke_drift_errors = "\n".join(
        site_workflow_graph_package_smoke_drift["errors"]
    )
    assert_condition(
        "README.md is missing site workflow graph package smoke phrase"
        in site_workflow_graph_package_smoke_drift_errors,
        "release policy docs should mention Website Console workflow graph smoke",
    )

    product_readiness_warning_strict_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc.replace(
            "warning-state bundle-compare strict smoke coverage",
            "generic bundle compare coverage",
        ).replace(
            "warning-state strict smoke coverage",
            "generic strict smoke coverage",
        ),
    )
    product_readiness_warning_strict_drift_errors = "\n".join(
        product_readiness_warning_strict_drift["errors"]
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness warning strict compare phrase"
            in product_readiness_warning_strict_drift_errors
        ),
        "product readiness should mention warning-state bundle-compare strict coverage",
    )

    product_readiness_mcp_probe_count_self_test_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc.replace(
            " plus MCP probe count telemetry and package/shared smoke self-test coverage for Website Console MCP probe counts",
            "",
        ),
    )
    product_readiness_mcp_probe_count_self_test_drift_errors = "\n".join(
        product_readiness_mcp_probe_count_self_test_drift["errors"]
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness Website Console MCP probe count self-test phrase"
            in product_readiness_mcp_probe_count_self_test_drift_errors
        ),
        "product readiness should mention Website Console MCP probe count self-test coverage",
    )

    product_readiness_mcp_probes_payload_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc.replace(
            ", plus bundled Website Console `mcp-probes.json` saved probe evidence payload instead of the full `site --mcp-check --probes --json` response",
            "",
        ),
    )
    product_readiness_mcp_probes_payload_drift_errors = "\n".join(
        product_readiness_mcp_probes_payload_drift["errors"]
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness Website Console mcp-probes payload phrase"
            in product_readiness_mcp_probes_payload_drift_errors
        ),
        "product readiness should mention Website Console bundle mcp-probes payload boundary",
    )

    product_readiness_mcp_probes_release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc.replace(
            "after the Website Console bundle `mcp-probes.json` saved-payload guard phases, ",
            "",
        ),
    )
    product_readiness_mcp_probes_release_check_drift_errors = "\n".join(
        product_readiness_mcp_probes_release_check_drift["errors"]
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness Website Console mcp-probes release-check phrase"
            in product_readiness_mcp_probes_release_check_drift_errors
        ),
        "product readiness should mention full release:check coverage after mcp-probes saved-payload guards",
    )

    product_readiness_bundle_boundary_metadata_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc.replace(
            "bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation",
            "generic handoff boundary validation",
        ),
    )
    product_readiness_bundle_boundary_metadata_drift_errors = "\n".join(
        product_readiness_bundle_boundary_metadata_drift["errors"]
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness Website Console bundle boundary metadata phrase"
            in product_readiness_bundle_boundary_metadata_drift_errors
        ),
        "product readiness should mention bundle-check and bundle-handoff boundary metadata",
    )

    product_readiness_bundle_boundary_release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc.replace(
            ", after the Product Readiness and release-facing policy docs bundle boundary metadata guards for bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata",
            "",
        ),
    )
    product_readiness_bundle_boundary_release_check_drift_errors = "\n".join(
        product_readiness_bundle_boundary_release_check_drift["errors"]
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness Website Console bundle boundary release-check phrase"
            in product_readiness_bundle_boundary_release_check_drift_errors
        ),
        "product readiness should mention full release:check coverage after bundle boundary metadata guards",
    )

    product_readiness_bundle_boundary_full_release_check_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs=release_policy_docs,
        audit_count=8,
        product_readiness_text=product_readiness_doc.replace(
            " plus full `release:self-test` evidence recording",
            "",
        ).replace(
            "unit tests, strict audits, whitespace checks, package contents, release metadata, ",
            "",
        ),
    )
    product_readiness_bundle_boundary_full_release_check_drift_errors = "\n".join(
        product_readiness_bundle_boundary_full_release_check_drift["errors"]
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness Website Console bundle boundary full release-check phrase"
            in product_readiness_bundle_boundary_full_release_check_drift_errors
        ),
        "product readiness should mention full release:check coverage after bundle boundary self-test evidence",
    )

    product_readiness_bundle_boundary_release_policy_full_release_check_drift = (
        release_metadata_summary(
            package_json=package_json,
            plugin_json=plugin_json,
            changelog_text=changelog,
            roadmap_text=roadmap,
            release_policy_docs=release_policy_docs,
            audit_count=8,
            product_readiness_text=product_readiness_doc.replace(
                ", after the release-facing policy docs guard for Website Console bundle boundary metadata full `release:check` evidence",
                "",
            ),
        )
    )
    product_readiness_bundle_boundary_release_policy_full_release_check_drift_errors = (
        "\n".join(
            product_readiness_bundle_boundary_release_policy_full_release_check_drift[
                "errors"
            ]
        )
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness Website Console bundle boundary release policy full release-check phrase"
            in product_readiness_bundle_boundary_release_policy_full_release_check_drift_errors
        ),
        "product readiness should mention full release:check coverage after release-facing policy docs full evidence guard",
    )

    product_readiness_release_policy_product_readiness_full_gate_drift = (
        release_metadata_summary(
            package_json=package_json,
            plugin_json=plugin_json,
            changelog_text=changelog,
            roadmap_text=roadmap,
            release_policy_docs=release_policy_docs,
            audit_count=8,
            product_readiness_text=product_readiness_doc.replace(
                ", and after the release-facing policy docs Product Readiness release policy full gate evidence guard",
                "",
            ),
        )
    )
    product_readiness_release_policy_product_readiness_full_gate_drift_errors = (
        "\n".join(
            product_readiness_release_policy_product_readiness_full_gate_drift[
                "errors"
            ]
        )
    )
    assert_condition(
        (
            "docs/PRODUCT-READINESS.md is missing product readiness release policy Product Readiness full gate release-check phrase"
            in product_readiness_release_policy_product_readiness_full_gate_drift_errors
        ),
        "product readiness should mention full release:check coverage after release-facing Product Readiness full gate evidence guard",
    )

    site_bundle_compare_warning_strict_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus packed-tarball and public-registry smoke for warning-state Website Console bundle-compare strict failures where identical warning bundles keep `sameBundle: true` while exiting non-zero under `--strict`",
                "",
            ),
        },
        audit_count=8,
    )
    site_bundle_compare_warning_strict_smoke_drift_errors = "\n".join(
        site_bundle_compare_warning_strict_smoke_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site bundle-compare warning strict smoke phrase"
            in site_bundle_compare_warning_strict_smoke_drift_errors
        ),
        "release policy docs should mention warning-state bundle-compare strict smoke coverage",
    )

    site_bundle_boundary_metadata_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata for deterministic-local, no-external-call, and no-target-repo-mutation handoff validation",
                "generic bundle boundary coverage",
            ),
        },
        audit_count=8,
    )
    site_bundle_boundary_metadata_drift_errors = "\n".join(
        site_bundle_boundary_metadata_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site bundle boundary metadata phrase"
            in site_bundle_boundary_metadata_drift_errors
        ),
        "release policy docs should mention Website Console bundle boundary metadata",
    )

    site_bundle_mcp_probe_counts_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry",
                "bundle-check/compare/handoff",
            ),
        },
        audit_count=8,
    )
    site_bundle_mcp_probe_counts_drift_errors = "\n".join(
        site_bundle_mcp_probe_counts_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site bundle MCP probe counts phrase"
            in site_bundle_mcp_probe_counts_drift_errors
        ),
        "release policy docs should mention Website Console bundle MCP probe counts",
    )

    site_bundle_mcp_probe_counts_self_test_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus package smoke self-test coverage for Website Console bundle MCP probe counts",
                "",
            ),
        },
        audit_count=8,
    )
    site_bundle_mcp_probe_counts_self_test_drift_errors = "\n".join(
        site_bundle_mcp_probe_counts_self_test_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site bundle MCP probe count self-test phrase"
            in site_bundle_mcp_probe_counts_self_test_drift_errors
        ),
        "release policy docs should mention Website Console bundle MCP probe count self-tests",
    )

    site_bundle_mcp_probes_payload_assertion_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " plus bundled Website Console `mcp-probes.json` saved probe evidence payload assertion instead of the full `site --mcp-check --probes --json` response",
                "",
            ),
        },
        audit_count=8,
    )
    site_bundle_mcp_probes_payload_assertion_drift_errors = "\n".join(
        site_bundle_mcp_probes_payload_assertion_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing site bundle mcp-probes payload assertion phrase"
            in site_bundle_mcp_probes_payload_assertion_drift_errors
        ),
        "release policy docs should mention Website Console bundle mcp-probes payload assertion",
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

    registry_learn_feedback_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry JSON `design-ai learn --feedback` output",
                "public registry learning feedback overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_feedback_drift_errors = "\n".join(registry_learn_feedback_drift["errors"])
    assert_condition(
        "README.md is missing registry learn feedback smoke phrase"
        in registry_learn_feedback_drift_errors,
        "release policy docs should mention public registry learn feedback smoke",
    )
    registry_learn_feedback_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "plus public registry learn feedback `--out` file-write confirmation",
                "plus public registry learning feedback saved artifact",
            ),
        },
        audit_count=8,
    )
    registry_learn_feedback_out_drift_errors = "\n".join(
        registry_learn_feedback_out_drift["errors"]
    )
    assert_condition(
        "README.md is missing registry learn feedback smoke phrase"
        in registry_learn_feedback_out_drift_errors,
        "release policy docs should mention public registry learn feedback --out smoke",
    )

    registry_learn_init_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry JSON `design-ai learn --init` preview/apply output",
                "public registry learning init overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_init_drift_errors = "\n".join(registry_learn_init_drift["errors"])
    assert_condition(
        "README.md is missing registry learn init smoke phrase"
        in registry_learn_init_drift_errors,
        "release policy docs should mention public registry learn init smoke",
    )

    registry_learn_verify_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry JSON `design-ai learn --verify` output",
                "public registry learning verification overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_verify_drift_errors = "\n".join(registry_learn_verify_drift["errors"])
    assert_condition(
        "README.md is missing registry learn verify smoke phrase"
        in registry_learn_verify_drift_errors,
        "release policy docs should mention public registry learn verify smoke",
    )
    registry_learn_verify_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry learn verify `--out` file-write confirmation",
                "public registry learning verification saved artifact",
            ),
        },
        audit_count=8,
    )
    registry_learn_verify_out_drift_errors = "\n".join(
        registry_learn_verify_out_drift["errors"]
    )
    assert_condition(
        "README.md is missing registry learn verify smoke phrase"
        in registry_learn_verify_out_drift_errors,
        "release policy docs should mention public registry learn verify --out smoke",
    )

    registry_learn_backup_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry JSON `design-ai learn --backup` output",
                "public registry learning backup overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_backup_drift_errors = "\n".join(registry_learn_backup_drift["errors"])
    assert_condition(
        "README.md is missing registry learn backup smoke phrase"
        in registry_learn_backup_drift_errors,
        "release policy docs should mention public registry learn backup smoke",
    )
    registry_learn_backup_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry learn backup `--out` file-write confirmation",
                "public registry learning backup saved artifact",
            ),
        },
        audit_count=8,
    )
    registry_learn_backup_out_drift_errors = "\n".join(
        registry_learn_backup_out_drift["errors"]
    )
    assert_condition(
        "README.md is missing registry learn backup smoke phrase"
        in registry_learn_backup_out_drift_errors,
        "release policy docs should mention public registry learn backup --out smoke",
    )

    registry_learn_restore_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry JSON `design-ai learn --restore` preview/apply output",
                "public registry learning restore overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_restore_drift_errors = "\n".join(registry_learn_restore_drift["errors"])
    assert_condition(
        "README.md is missing registry learn restore smoke phrase"
        in registry_learn_restore_drift_errors,
        "release policy docs should mention public registry learn restore smoke",
    )

    registry_learn_restore_backups_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage",
                "public registry restore rollback inventory coverage",
            ),
        },
        audit_count=8,
    )
    registry_learn_restore_backups_drift_errors = "\n".join(registry_learn_restore_backups_drift["errors"])
    assert_condition(
        "README.md is missing registry learn restore-backups smoke phrase"
        in registry_learn_restore_backups_drift_errors,
        "release policy docs should mention public registry learn restore-backups smoke",
    )

    registry_learn_restore_backups_prune_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage",
                "public registry restore rollback cleanup coverage",
            ),
        },
        audit_count=8,
    )
    registry_learn_restore_backups_prune_drift_errors = "\n".join(registry_learn_restore_backups_prune_drift["errors"])
    assert_condition(
        "README.md is missing registry learn restore-backups prune smoke phrase"
        in registry_learn_restore_backups_prune_drift_errors,
        "release policy docs should mention public registry learn restore-backups prune smoke",
    )

    registry_learn_import_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry JSON `design-ai learn --import` dry-run/apply output",
                "public registry learning import overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_import_drift_errors = "\n".join(registry_learn_import_drift["errors"])
    assert_condition(
        "README.md is missing registry learn import smoke phrase"
        in registry_learn_import_drift_errors,
        "release policy docs should mention public registry learn import smoke",
    )
    registry_learn_import_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "plus public registry learn import `--out` file-write confirmation",
                "plus public registry learning import saved artifact",
            ),
        },
        audit_count=8,
    )
    registry_learn_import_out_drift_errors = "\n".join(
        registry_learn_import_out_drift["errors"]
    )
    assert_condition(
        "README.md is missing registry learn import smoke phrase"
        in registry_learn_import_out_drift_errors,
        "release policy docs should mention public registry learn import --out smoke",
    )

    registry_learn_redact_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry JSON `design-ai learn --redact` output",
                "public registry learning redaction overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_redact_drift_errors = "\n".join(registry_learn_redact_drift["errors"])
    assert_condition(
        "README.md is missing registry learn redact smoke phrase"
        in registry_learn_redact_drift_errors,
        "release policy docs should mention public registry learn redact smoke",
    )

    registry_learn_stats_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry human / JSON `design-ai learn --stats` profile summary output",
                "public registry learning profile overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_stats_drift_errors = "\n".join(registry_learn_stats_drift["errors"])
    assert_condition(
        "README.md is missing registry learn stats smoke phrase"
        in registry_learn_stats_drift_errors,
        "release policy docs should mention public registry learn stats smoke",
    )

    registry_learn_stats_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry learn stats `--out` file-write confirmation",
                "public registry learning stats saved artifact",
            ),
        },
        audit_count=8,
    )
    registry_learn_stats_out_drift_errors = "\n".join(registry_learn_stats_out_drift["errors"])
    assert_condition(
        "README.md is missing registry learn stats smoke phrase"
        in registry_learn_stats_out_drift_errors,
        "release policy docs should mention public registry learn stats --out smoke",
    )

    registry_learn_query_explain_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry query-filtered learn list explanation/export JSON output",
                "public registry learning query overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_query_explain_drift_errors = "\n".join(
        registry_learn_query_explain_drift["errors"]
    )
    assert_condition(
        "README.md is missing registry learn query explain smoke phrase"
        in registry_learn_query_explain_drift_errors,
        "release policy docs should mention public registry learn query explanation/export smoke",
    )

    registry_learn_relevance_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry brief-relevant prompt/pack learning selection",
                "public registry prompt learning overview",
            ).replace(
                "public registry prompt/pack --with-learning",
                "public registry learned prompt context",
            ),
        },
        audit_count=8,
    )
    registry_learn_relevance_drift_errors = "\n".join(
        registry_learn_relevance_drift["errors"]
    )
    assert_condition(
        "README.md is missing registry learn relevance smoke phrase"
        in registry_learn_relevance_drift_errors,
        "release policy docs should mention public registry prompt/pack learning relevance smoke",
    )

    registry_learn_eval_template_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry `design-ai learn --eval-template` checkpoint generation",
                "public registry learning checkpoint bootstrap",
            ).replace(
                "public registry generated checkpoint strict validation",
                "public registry checkpoint review",
            ),
        },
        audit_count=8,
    )
    registry_learn_eval_template_drift_errors = "\n".join(
        registry_learn_eval_template_drift["errors"]
    )
    assert_condition(
        "README.md is missing registry learn eval-template smoke phrase"
        in registry_learn_eval_template_drift_errors,
        "release policy docs should mention public registry learn eval-template smoke",
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

    release_metadata_product_readiness_json_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "release metadata JSON `product_readiness_checked: true` Product Readiness guard coverage",
                "release metadata JSON summary",
            ),
        },
        audit_count=8,
    )
    release_metadata_product_readiness_json_drift_errors = "\n".join(
        release_metadata_product_readiness_json_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing release metadata Product Readiness JSON phrase"
            in release_metadata_product_readiness_json_drift_errors
        ),
        "release policy docs should mention Product Readiness release metadata JSON coverage",
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
            ).replace(
                " The same `npm run release:check` gate preserves Website Console bundle `mcp-probes.json` saved-payload guard phases through package contents, release self-tests, and packed-tarball smoke.",
                "",
            ).replace(
                " The same `npm run release:check` gate also preserves Website Console bundle boundary metadata guard phases for bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata plus full `release:self-test` evidence recording through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
            ).replace(
                " The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
            ).replace(
                " The same `npm run release:check` gate now also preserves the Product Readiness release policy full gate evidence guard through unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke.",
                "",
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

    agent_eval_smoke_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "route eval, prompt eval, and pack eval checkpoint output",
                "agent eval checkpoint output",
            ),
        },
        audit_count=8,
    )
    agent_eval_smoke_drift_errors = "\n".join(agent_eval_smoke_drift["errors"])
    assert_condition(
        "README.md is missing agent eval smoke phrase" in agent_eval_smoke_drift_errors,
        "release policy docs should mention route/prompt/pack eval smoke",
    )

    check_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                (
                    "check examples output, check artifact output, "
                    "check stdin output, check all-routes output, "
                    "and check learning capture output"
                ),
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

    check_examples_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "check examples output",
                "check output",
            ),
        },
        audit_count=8,
    )
    check_examples_output_drift_errors = "\n".join(
        check_examples_output_drift["errors"]
    )
    assert_condition(
        "README.md is missing check examples output phrase"
        in check_examples_output_drift_errors,
        "release policy docs should mention check examples output smoke",
    )

    check_artifact_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "check artifact output",
                "check output",
            ),
        },
        audit_count=8,
    )
    check_artifact_output_drift_errors = "\n".join(
        check_artifact_output_drift["errors"]
    )
    assert_condition(
        (
            "docs/DISTRIBUTION.md is missing check artifact output phrase"
            in check_artifact_output_drift_errors
        ),
        "release policy docs should mention check artifact output smoke",
    )

    check_stdin_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace(
                "check stdin 출력",
                "check 출력",
            ),
        },
        audit_count=8,
    )
    check_stdin_output_drift_errors = "\n".join(check_stdin_output_drift["errors"])
    assert_condition(
        "README.ko.md is missing check stdin output phrase"
        in check_stdin_output_drift_errors,
        "release policy docs should mention check stdin output smoke",
    )

    check_all_routes_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "check all-routes output",
                "check output",
            ),
        },
        audit_count=8,
    )
    check_all_routes_output_drift_errors = "\n".join(
        check_all_routes_output_drift["errors"]
    )
    assert_condition(
        (
            "docs/RELEASE-CHECKLIST.md is missing check all-routes output phrase"
            in check_all_routes_output_drift_errors
        ),
        "release policy docs should mention check all-routes output smoke",
    )

    check_learning_capture_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "check learning capture output",
                "check output",
            ),
        },
        audit_count=8,
    )
    check_learning_capture_output_drift_errors = "\n".join(
        check_learning_capture_output_drift["errors"]
    )
    assert_condition(
        (
            "docs/DISTRIBUTION.md is missing check learning capture output phrase"
            in check_learning_capture_output_drift_errors
        ),
        "release policy docs should mention check learning capture output smoke",
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
                "topic catalog with probe-capable Website Console site help usage output",
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

    site_help_usage_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " with probe-capable Website Console site help usage",
                "",
            ),
        },
        audit_count=8,
    )
    site_help_usage_drift_errors = "\n".join(site_help_usage_drift["errors"])
    assert_condition(
        "README.md is missing site help usage phrase" in site_help_usage_drift_errors,
        "release policy docs should mention probe-capable Website Console site help usage",
    )

    site_help_topic_example_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                ", shared Website Console site help topic example smoke assertions",
                "",
            ),
        },
        audit_count=8,
    )
    site_help_topic_example_drift_errors = "\n".join(
        site_help_topic_example_drift["errors"]
    )
    assert_condition(
        "README.md is missing site help topic example phrase"
        in site_help_topic_example_drift_errors,
        "release policy docs should mention shared Website Console site help topic example smoke assertions",
    )

    site_next_actions_help_example_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                " including the `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown help example",
                "",
            ),
        },
        audit_count=8,
    )
    site_next_actions_help_example_drift_errors = "\n".join(
        site_next_actions_help_example_drift["errors"]
    )
    assert_condition(
        "README.md is missing site next-actions help example phrase"
        in site_next_actions_help_example_drift_errors,
        "release policy docs should mention Website Console next-actions Markdown help example",
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
            "README.ko.md": korean_policy_doc
            .replace("human/JSON 출력", "human 출력")
            .replace("site --prompt-list --json", "site prompt template listing"),
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
            "README.ko.md": korean_policy_doc
            .replace("human/JSON 출력", "human 출력")
            .replace("site --prompt-list --json", "site prompt template listing"),
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
            "README.md": english_policy_doc.replace(
                (
                    "unknown route-id suggestion, unknown option suggestion, "
                    "unknown value suggestion, and numeric range failure"
                ),
                "suggestion failures",
            ),
        },
        audit_count=8,
    )
    suggestion_failure_drift_errors = "\n".join(suggestion_failure_drift["errors"])
    assert_condition(
        "README.md is missing suggestion failure smoke phrase" in suggestion_failure_drift_errors,
        "release policy docs should mention suggestion and numeric range failure smoke",
    )

    route_id_suggestion_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "unknown route-id suggestion",
                "unknown route suggestion",
            ),
        },
        audit_count=8,
    )
    route_id_suggestion_drift_errors = "\n".join(route_id_suggestion_drift["errors"])
    assert_condition(
        (
            "README.md is missing unknown route-id suggestion phrase"
            in route_id_suggestion_drift_errors
        ),
        "release policy docs should mention unknown route-id suggestion smoke",
    )

    option_suggestion_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "unknown option suggestion",
                "unknown flag suggestion",
            ),
        },
        audit_count=8,
    )
    option_suggestion_drift_errors = "\n".join(option_suggestion_drift["errors"])
    assert_condition(
        (
            "README.md is missing unknown option suggestion phrase"
            in option_suggestion_drift_errors
        ),
        "release policy docs should mention unknown option suggestion smoke",
    )

    value_suggestion_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "unknown value suggestion",
                "unknown parameter suggestion",
            ),
        },
        audit_count=8,
    )
    value_suggestion_drift_errors = "\n".join(value_suggestion_drift["errors"])
    assert_condition(
        (
            "README.md is missing unknown value suggestion phrase"
            in value_suggestion_drift_errors
        ),
        "release policy docs should mention unknown value suggestion smoke",
    )

    numeric_range_failure_drift = release_metadata_summary(
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
    numeric_range_failure_drift_errors = "\n".join(numeric_range_failure_drift["errors"])
    assert_condition(
        "README.ko.md is missing numeric range failure phrase"
        in numeric_range_failure_drift_errors,
        "release policy docs should mention numeric range failure smoke",
    )

    prompt_pack_mode_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                (
                    "prompt JSON output, prompt markdown output, prompt from-file output, "
                    "prompt stdin output, pack JSON output, pack markdown output, "
                    "pack from-file output, and pack stdin output"
                ),
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

    prompt_json_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "prompt JSON output",
                "prompt output",
            ),
        },
        audit_count=8,
    )
    prompt_json_output_drift_errors = "\n".join(prompt_json_output_drift["errors"])
    assert_condition(
        "README.md is missing prompt JSON output phrase" in prompt_json_output_drift_errors,
        "release policy docs should mention prompt JSON output smoke",
    )

    prompt_markdown_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "prompt markdown output",
                "prompt output",
            ),
        },
        audit_count=8,
    )
    prompt_markdown_output_drift_errors = "\n".join(
        prompt_markdown_output_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing prompt markdown output phrase"
            in prompt_markdown_output_drift_errors
        ),
        "release policy docs should mention prompt markdown output smoke",
    )

    prompt_from_file_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "prompt from-file output",
                "prompt file output",
            ),
        },
        audit_count=8,
    )
    prompt_from_file_output_drift_errors = "\n".join(
        prompt_from_file_output_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing prompt from-file output phrase"
            in prompt_from_file_output_drift_errors
        ),
        "release policy docs should mention prompt from-file output smoke",
    )

    prompt_stdin_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "prompt stdin output",
                "prompt input output",
            ),
        },
        audit_count=8,
    )
    prompt_stdin_output_drift_errors = "\n".join(prompt_stdin_output_drift["errors"])
    assert_condition(
        "README.md is missing prompt stdin output phrase" in prompt_stdin_output_drift_errors,
        "release policy docs should mention prompt stdin output smoke",
    )

    pack_json_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "pack JSON output",
                "pack output",
            ),
        },
        audit_count=8,
    )
    pack_json_output_drift_errors = "\n".join(pack_json_output_drift["errors"])
    assert_condition(
        "README.md is missing pack JSON output phrase" in pack_json_output_drift_errors,
        "release policy docs should mention pack JSON output smoke",
    )

    pack_markdown_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "pack markdown output",
                "pack output",
            ),
        },
        audit_count=8,
    )
    pack_markdown_output_drift_errors = "\n".join(pack_markdown_output_drift["errors"])
    assert_condition(
        (
            "README.md is missing pack markdown output phrase"
            in pack_markdown_output_drift_errors
        ),
        "release policy docs should mention pack markdown output smoke",
    )

    pack_from_file_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "pack from-file output",
                "pack file output",
            ),
        },
        audit_count=8,
    )
    pack_from_file_output_drift_errors = "\n".join(pack_from_file_output_drift["errors"])
    assert_condition(
        (
            "README.md is missing pack from-file output phrase"
            in pack_from_file_output_drift_errors
        ),
        "release policy docs should mention pack from-file output smoke",
    )

    pack_stdin_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.ko.md": korean_policy_doc.replace(
                "pack stdin 출력",
                "pack 입력 출력",
            ),
        },
        audit_count=8,
    )
    pack_stdin_output_drift_errors = "\n".join(pack_stdin_output_drift["errors"])
    assert_condition(
        "README.ko.md is missing pack stdin output phrase" in pack_stdin_output_drift_errors,
        "release policy docs should mention pack stdin output smoke",
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

    prompt_pack_forced_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "forced `--out`",
                "output-file",
            ),
        },
        audit_count=8,
    )
    prompt_pack_forced_output_drift_errors = "\n".join(
        prompt_pack_forced_output_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing prompt-pack forced output-file phrase"
            in prompt_pack_forced_output_drift_errors
        ),
        "release policy docs should mention prompt/pack forced output-file smoke",
    )

    prompt_pack_file_write_confirmation_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "file-write confirmations",
                "write confirmations",
            ),
        },
        audit_count=8,
    )
    prompt_pack_file_write_confirmation_drift_errors = "\n".join(
        prompt_pack_file_write_confirmation_drift["errors"]
    )
    assert_condition(
        (
            "docs/DISTRIBUTION.md is missing prompt-pack file-write confirmation phrase"
            in prompt_pack_file_write_confirmation_drift_errors
        ),
        "release policy docs should mention prompt/pack file-write confirmation smoke",
    )

    human_install_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human `design-ai install` output plus ",
                "install output plus ",
            ),
        },
        audit_count=8,
    )
    human_install_drift_errors = "\n".join(human_install_drift["errors"])
    assert_condition(
        "README.md is missing human install lifecycle phrase" in human_install_drift_errors,
        "release policy docs should mention human install lifecycle smoke",
    )

    human_install_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human `design-ai install` output",
                "human install command",
            ),
        },
        audit_count=8,
    )
    human_install_output_drift_errors = "\n".join(
        human_install_output_drift["errors"]
    )
    assert_condition(
        "README.md is missing human install output phrase"
        in human_install_output_drift_errors,
        "release policy docs should mention human install output smoke",
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
            "README.md": english_policy_doc.replace(
                "human `design-ai status` output plus JSON status output",
                "status output",
            ),
        },
        audit_count=8,
    )
    human_status_drift_errors = "\n".join(human_status_drift["errors"])
    assert_condition(
        "README.md is missing human status lifecycle phrase" in human_status_drift_errors,
        "release policy docs should mention human status lifecycle smoke",
    )

    human_status_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human `design-ai status` output",
                "human status command",
            ),
        },
        audit_count=8,
    )
    human_status_output_drift_errors = "\n".join(
        human_status_output_drift["errors"]
    )
    assert_condition(
        "README.md is missing human status output phrase"
        in human_status_output_drift_errors,
        "release policy docs should mention human status output smoke",
    )

    human_uninstall_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "human `design-ai uninstall` output plus ",
                "uninstall output plus ",
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

    human_uninstall_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "human `design-ai uninstall` output",
                "human uninstall command",
            ),
        },
        audit_count=8,
    )
    human_uninstall_output_drift_errors = "\n".join(
        human_uninstall_output_drift["errors"]
    )
    assert_condition(
        (
            "docs/RELEASE-CHECKLIST.md is missing human uninstall output phrase"
            in human_uninstall_output_drift_errors
        ),
        "release policy docs should mention human uninstall output smoke",
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

    audit_human_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human `design-ai audit --strict --quiet` output",
                "human audit command",
            ),
        },
        audit_count=8,
    )
    audit_human_output_drift_errors = "\n".join(
        audit_human_output_drift["errors"]
    )
    assert_condition(
        "README.md is missing audit human output phrase"
        in audit_human_output_drift_errors,
        "release policy docs should mention human audit strict-quiet output smoke",
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

    learn_feedback_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "JSON `design-ai learn --feedback` output",
                "local preference smoke",
            ),
        },
        audit_count=8,
    )
    learn_feedback_drift_errors = "\n".join(learn_feedback_drift["errors"])
    assert_condition(
        "README.md is missing learn feedback smoke phrase"
        in learn_feedback_drift_errors,
        "release policy docs should mention learn feedback smoke",
    )
    learn_feedback_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "plus learn feedback `--out` file-write confirmation",
                "plus local feedback saved artifact",
            ),
        },
        audit_count=8,
    )
    learn_feedback_out_drift_errors = "\n".join(learn_feedback_out_drift["errors"])
    assert_condition(
        "README.md is missing learn feedback smoke phrase"
        in learn_feedback_out_drift_errors,
        "release policy docs should mention learn feedback --out smoke",
    )

    learn_backup_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "JSON `design-ai learn --backup` output",
                "local profile export",
            ),
        },
        audit_count=8,
    )
    learn_backup_drift_errors = "\n".join(learn_backup_drift["errors"])
    assert_condition(
        "README.md is missing learn backup smoke phrase"
        in learn_backup_drift_errors,
        "release policy docs should mention learn backup smoke",
    )

    learn_redact_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "JSON `design-ai learn --redact` output",
                "redacted local profile export",
            ),
        },
        audit_count=8,
    )
    learn_redact_drift_errors = "\n".join(learn_redact_drift["errors"])
    assert_condition(
        "README.md is missing learn redact smoke phrase"
        in learn_redact_drift_errors,
        "release policy docs should mention learn redact smoke",
    )

    learn_output_file_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "learn JSON `--out` file-write confirmation and forced overwrite coverage",
                "learning artifact save behavior",
            ),
        },
        audit_count=8,
    )
    learn_output_file_drift_errors = "\n".join(
        learn_output_file_drift["errors"]
    )
    assert_condition(
        "README.md is missing learn output file smoke phrase"
        in learn_output_file_drift_errors,
        "release policy docs should mention learn output-file smoke",
    )

    learn_verify_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "JSON `design-ai learn --verify` output",
                "local learning validation",
            ),
        },
        audit_count=8,
    )
    learn_verify_drift_errors = "\n".join(learn_verify_drift["errors"])
    assert_condition(
        "README.md is missing learn verify smoke phrase"
        in learn_verify_drift_errors,
        "release policy docs should mention learn verify smoke",
    )

    learn_verify_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "learn verify `--out` file-write confirmation",
                "learning validation saved artifact",
            ),
        },
        audit_count=8,
    )
    learn_verify_out_drift_errors = "\n".join(learn_verify_out_drift["errors"])
    assert_condition(
        "README.md is missing learn verify smoke phrase"
        in learn_verify_out_drift_errors,
        "release policy docs should mention learn verify --out smoke",
    )

    learn_restore_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "JSON `design-ai learn --restore` preview/apply output",
                "local learning profile replacement",
            ),
        },
        audit_count=8,
    )
    learn_restore_drift_errors = "\n".join(learn_restore_drift["errors"])
    assert_condition(
        "README.md is missing learn restore smoke phrase"
        in learn_restore_drift_errors,
        "release policy docs should mention learn restore smoke",
    )
    learn_restore_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "learn restore `--out` file-write confirmation",
                "learning restore saved artifact",
            ),
        },
        audit_count=8,
    )
    learn_restore_out_drift_errors = "\n".join(learn_restore_out_drift["errors"])
    assert_condition(
        "README.md is missing learn restore smoke phrase"
        in learn_restore_out_drift_errors,
        "release policy docs should mention learn restore --out smoke",
    )
    learn_restore_rollback_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc
            .replace(
                "learn restore rollback backup verification",
                "learning restore rollback artifact",
            )
            .replace(
                "design-ai learn --restore-backups restore rollback backup inventory coverage",
                "design-ai learn --restore-backups rollback file inventory coverage",
            )
            .replace(
                "design-ai learn --restore-backups --prune restore rollback backup pruning coverage",
                "design-ai learn --restore-backups --prune rollback file pruning coverage",
            )
            .replace(
                "workspace learning restore-backups readiness with restore rollback backup inventory",
                "workspace restore-backups readiness with rollback file inventory",
            )
            .replace(
                "public registry learn restore rollback backup verification",
                "public registry learning restore rollback artifact",
            )
            .replace(
                "public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage",
                "public registry `design-ai learn --restore-backups` rollback file inventory coverage",
            )
            .replace(
                "public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage",
                "public registry `design-ai learn --restore-backups --prune` rollback file pruning coverage",
            )
            .replace(
                "public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory",
                "public registry `design-ai workspace` workspace restore-backups readiness with rollback file inventory",
            ),
        },
        audit_count=8,
    )
    learn_restore_rollback_drift_errors = "\n".join(learn_restore_rollback_drift["errors"])
    assert_condition(
        "README.md is missing learn restore rollback backup smoke phrase"
        in learn_restore_rollback_drift_errors,
        "release policy docs should mention learn restore rollback backup smoke",
    )
    learn_restore_backup_file_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "learn restore `--backup-file` path coverage",
                "learning restore explicit rollback path coverage",
            ),
        },
        audit_count=8,
    )
    learn_restore_backup_file_drift_errors = "\n".join(learn_restore_backup_file_drift["errors"])
    assert_condition(
        "README.md is missing learn restore rollback backup smoke phrase"
        in learn_restore_backup_file_drift_errors,
        "release policy docs should mention learn restore --backup-file smoke",
    )

    learn_restore_backups_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "design-ai learn --restore-backups restore rollback backup inventory coverage",
                "learning restore rollback file listing coverage",
            ).replace(
                "workspace learning restore-backups readiness with restore rollback backup inventory",
                "workspace restore-backups readiness with rollback file listing",
            ).replace(
                "public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage",
                "public registry restore rollback file listing coverage",
            ).replace(
                "public registry `design-ai workspace` workspace restore-backups readiness with restore rollback backup inventory",
                "public registry `design-ai workspace` workspace restore backup readiness with rollback file listing",
            ),
        },
        audit_count=8,
    )
    learn_restore_backups_drift_errors = "\n".join(learn_restore_backups_drift["errors"])
    assert_condition(
        "README.md is missing learn restore-backups smoke phrase"
        in learn_restore_backups_drift_errors,
        "release policy docs should mention learn restore-backups smoke",
    )
    learn_restore_backups_prune_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "design-ai learn --restore-backups --prune restore rollback backup pruning coverage",
                "learning restore rollback cleanup coverage",
            ).replace(
                "public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage",
                "public registry restore rollback cleanup coverage",
            ),
        },
        audit_count=8,
    )
    learn_restore_backups_prune_drift_errors = "\n".join(learn_restore_backups_prune_drift["errors"])
    assert_condition(
        "README.md is missing learn restore-backups prune smoke phrase"
        in learn_restore_backups_prune_drift_errors,
        "release policy docs should mention learn restore-backups prune smoke",
    )

    learn_import_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "JSON `design-ai learn --import` dry-run/apply output",
                "local learning profile portability",
            ),
        },
        audit_count=8,
    )
    learn_import_drift_errors = "\n".join(learn_import_drift["errors"])
    assert_condition(
        "README.md is missing learn import smoke phrase"
        in learn_import_drift_errors,
        "release policy docs should mention learn import smoke",
    )
    learn_import_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "plus learn import `--out` file-write confirmation",
                "plus local learning import saved artifact",
            ),
        },
        audit_count=8,
    )
    learn_import_out_drift_errors = "\n".join(learn_import_out_drift["errors"])
    assert_condition(
        "README.md is missing learn import smoke phrase"
        in learn_import_out_drift_errors,
        "release policy docs should mention learn import --out smoke",
    )

    learn_stats_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human / JSON `design-ai learn --stats` profile summary output",
                "local learning profile overview",
            ),
        },
        audit_count=8,
    )
    learn_stats_drift_errors = "\n".join(learn_stats_drift["errors"])
    assert_condition(
        "README.md is missing learn stats smoke phrase"
        in learn_stats_drift_errors,
        "release policy docs should mention learn stats smoke",
    )

    learn_stats_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "learn stats `--out` file-write confirmation",
                "learning stats saved artifact",
            ),
        },
        audit_count=8,
    )
    learn_stats_out_drift_errors = "\n".join(learn_stats_out_drift["errors"])
    assert_condition(
        "README.md is missing learn stats smoke phrase"
        in learn_stats_out_drift_errors,
        "release policy docs should mention learn stats --out smoke",
    )

    learn_query_explain_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "query-filtered learn list explanation/export JSON output",
                "local learning query inspection",
            ),
        },
        audit_count=8,
    )
    learn_query_explain_drift_errors = "\n".join(
        learn_query_explain_drift["errors"]
    )
    assert_condition(
        "README.md is missing learn query explain smoke phrase"
        in learn_query_explain_drift_errors,
        "release policy docs should mention query-filtered learn explanation/export smoke",
    )

    learn_relevance_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "brief-relevant prompt/pack learning selection",
                "local learning prompt behavior",
            ),
        },
        audit_count=8,
    )
    learn_relevance_drift_errors = "\n".join(learn_relevance_drift["errors"])
    assert_condition(
        "README.md is missing learn relevance smoke phrase"
        in learn_relevance_drift_errors,
        "release policy docs should mention prompt/pack learning relevance smoke",
    )

    learn_audit_cleanup_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human / JSON `design-ai learn --audit` cleanup suggestion output",
                "human learning audit output",
            ),
        },
        audit_count=8,
    )
    learn_audit_cleanup_drift_errors = "\n".join(
        learn_audit_cleanup_drift["errors"]
    )
    assert_condition(
        "README.md is missing learn audit cleanup smoke phrase"
        in learn_audit_cleanup_drift_errors,
        "release policy docs should mention learn audit cleanup suggestion smoke",
    )

    learn_audit_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "plus learn audit `--out` file-write confirmation",
                "without audit output artifact wording",
            ),
        },
        audit_count=8,
    )
    learn_audit_out_drift_errors = "\n".join(learn_audit_out_drift["errors"])
    assert_condition(
        "README.md is missing learn audit out smoke phrase"
        in learn_audit_out_drift_errors,
        "release policy docs should mention learn audit --out smoke",
    )

    registry_learn_audit_cleanup_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "public registry human / JSON `design-ai learn --audit` cleanup suggestion output",
                "public registry learning cleanup overview",
            ),
        },
        audit_count=8,
    )
    registry_learn_audit_cleanup_drift_errors = "\n".join(
        registry_learn_audit_cleanup_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing registry learn audit cleanup smoke phrase"
            in registry_learn_audit_cleanup_drift_errors
        ),
        "release policy docs should mention public registry learn audit cleanup smoke",
    )

    registry_learn_audit_out_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "plus public registry learn audit `--out` file-write confirmation",
                "without registry audit output artifact wording",
            ),
        },
        audit_count=8,
    )
    registry_learn_audit_out_drift_errors = "\n".join(
        registry_learn_audit_out_drift["errors"]
    )
    assert_condition(
        (
            "README.md is missing registry learn audit out smoke phrase"
            in registry_learn_audit_out_drift_errors
        ),
        "release policy docs should mention public registry learn audit --out smoke",
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

    doctor_human_diagnostics_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "human diagnostics output from `design-ai doctor --strict`",
                "human diagnostics",
            ),
        },
        audit_count=8,
    )
    doctor_human_diagnostics_output_drift_errors = "\n".join(
        doctor_human_diagnostics_output_drift["errors"]
    )
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing doctor human diagnostics output phrase"
        in doctor_human_diagnostics_output_drift_errors,
        "release policy docs should mention doctor human diagnostics output guidance",
    )

    doctor_json_command_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/DISTRIBUTION.md": english_policy_doc.replace(
                "`design-ai doctor --json`",
                "`doctor --json`",
            ),
        },
        audit_count=8,
    )
    doctor_json_command_drift_errors = "\n".join(doctor_json_command_drift["errors"])
    assert_condition(
        "docs/DISTRIBUTION.md is missing doctor JSON command phrase"
        in doctor_json_command_drift_errors,
        "release policy docs should mention exact design-ai doctor --json command guidance",
    )

    doctor_json_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "docs/RELEASE-CHECKLIST.md": english_policy_doc.replace(
                "machine-readable diagnostics output",
                "JSON diagnostics output",
            ),
        },
        audit_count=8,
    )
    doctor_json_output_drift_errors = "\n".join(doctor_json_output_drift["errors"])
    assert_condition(
        "docs/RELEASE-CHECKLIST.md is missing doctor JSON diagnostics output phrase"
        in doctor_json_output_drift_errors,
        "release policy docs should mention doctor JSON diagnostics output guidance",
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

    update_dry_run_human_output_drift = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        release_policy_docs={
            **release_policy_docs,
            "README.md": english_policy_doc.replace(
                "human `design-ai update --dry-run` output",
                "human update preview",
            ),
        },
        audit_count=8,
    )
    update_dry_run_human_output_drift_errors = "\n".join(
        update_dry_run_human_output_drift["errors"]
    )
    assert_condition(
        "README.md is missing update dry-run human output phrase"
        in update_dry_run_human_output_drift_errors,
        "release policy docs should mention human update dry-run output smoke",
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
    product_readiness_text, product_readiness_errors = load_text_input(
        "docs/PRODUCT-READINESS.md",
        PRODUCT_READINESS,
    )
    audit_count, audit_count_load_errors = load_audit_count()
    summary = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog_text,
        roadmap_text=roadmap_text,
        release_policy_docs=release_policy_docs,
        audit_count=audit_count,
        product_readiness_text=product_readiness_text,
    )
    summary["errors"] = (
        package_json_errors
        + plugin_json_errors
        + changelog_errors
        + roadmap_errors
        + product_readiness_errors
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
