from __future__ import annotations

import json

from .site_contracts import (
    EXPECTED_SITE_WORKFLOW_GRAPH_EDGE_KEYS,
    EXPECTED_SITE_WORKFLOW_GRAPH_NODE_IDS,
    EXPECTED_SITE_WORKFLOW_GRAPH_NODE_KEYS,
    EXPECTED_SITE_WORKFLOW_GRAPH_PAYLOAD_KEYS,
    EXPECTED_SITE_WORKFLOW_GRAPH_SITE_KEYS,
    EXPECTED_SITE_WORKFLOW_GRAPH_SUMMARY_KEYS,
)

from .assertion_helpers import (
    assert_no_ansi,
    assert_smoke_json_keys,
)


def assert_site_workflow_graph_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site workflow graph JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_WORKFLOW_GRAPH_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site workflow graph JSON",
    )
    if payload.get("version") != 1 or payload.get("kind") != "website-improvement-workflow-graph":
        raise SystemExit(f"site workflow graph JSON after {context} graph identity changed")
    if payload.get("status") != "pass" or payload.get("workspaceStatus") != "pass" or payload.get("mcpStatus") != "pass":
        raise SystemExit(f"site workflow graph JSON after {context} should pass for the sample workspace")
    if payload.get("externalCalls") is not False:
        raise SystemExit(f"site workflow graph JSON after {context} must remain read-only without external calls")

    site = assert_smoke_json_keys(
        payload.get("site"),
        EXPECTED_SITE_WORKFLOW_GRAPH_SITE_KEYS,
        label="site",
        context=context,
        command_label="site workflow graph JSON",
    )
    if site.get("name") != "Korean SaaS marketing site" or site.get("liveUrl") != "https://example.com":
        raise SystemExit(f"site workflow graph JSON after {context} sample site identity changed")

    summary = assert_smoke_json_keys(
        payload.get("summary"),
        EXPECTED_SITE_WORKFLOW_GRAPH_SUMMARY_KEYS,
        label="summary",
        context=context,
        command_label="site workflow graph JSON",
    )
    expected_summary = {
        "status": "pass",
        "workspaceStatus": "pass",
        "mcpStatus": "pass",
        "nodeCount": 38,
        "edgeCount": 73,
        "auditCategoryCount": 9,
        "taskCount": 3,
        "generatedTaskCount": 2,
        "requiredMcpCount": 3,
        "promptTemplateCount": 11,
    }
    for key, expected in expected_summary.items():
        if summary.get(key) != expected:
            raise SystemExit(f"site workflow graph JSON after {context} summary {key} changed")

    nodes = payload.get("nodes")
    if not isinstance(nodes, list) or len(nodes) != summary.get("nodeCount"):
        raise SystemExit(f"site workflow graph JSON after {context} node count changed")
    node_ids = []
    for node in nodes:
        checked = assert_smoke_json_keys(
            node,
            EXPECTED_SITE_WORKFLOW_GRAPH_NODE_KEYS,
            label="nodes entry",
            context=context,
            command_label="site workflow graph JSON",
        )
        node_ids.append(checked.get("id"))
        if not isinstance(checked.get("data"), dict):
            raise SystemExit(f"site workflow graph JSON after {context} node data must be an object")

    for expected_node_id in EXPECTED_SITE_WORKFLOW_GRAPH_NODE_IDS:
        if expected_node_id not in node_ids:
            raise SystemExit(f"site workflow graph JSON after {context} missing node {expected_node_id}")

    edges = payload.get("edges")
    if not isinstance(edges, list) or len(edges) != summary.get("edgeCount"):
        raise SystemExit(f"site workflow graph JSON after {context} edge count changed")
    edge_pairs = set()
    for edge in edges:
        checked = assert_smoke_json_keys(
            edge,
            EXPECTED_SITE_WORKFLOW_GRAPH_EDGE_KEYS,
            label="edges entry",
            context=context,
            command_label="site workflow graph JSON",
        )
        edge_pairs.add((checked.get("from"), checked.get("to"), checked.get("type")))
        if checked.get("from") not in node_ids or checked.get("to") not in node_ids:
            raise SystemExit(f"site workflow graph JSON after {context} edge references an unknown node")

    required_edges = {
        ("workspace:intake", "profile:sample-korean-saas", "profile"),
        ("audit:visual-design", "task:task-homepage-cta", "finding-to-task"),
        ("task:task-homepage-cta", "prompt:codex-implementation", "implementation-prompt"),
        ("handoff:bundle", "handoff:target-repo", "handoff"),
    }
    for expected_edge in required_edges:
        if expected_edge not in edge_pairs:
            raise SystemExit(f"site workflow graph JSON after {context} missing edge {expected_edge}")

    boundaries = payload.get("boundaries")
    if not isinstance(boundaries, list) or "no-external-mcp-calls" not in boundaries or "no-target-repo-mutation" not in boundaries:
        raise SystemExit(f"site workflow graph JSON after {context} boundary markers changed")
