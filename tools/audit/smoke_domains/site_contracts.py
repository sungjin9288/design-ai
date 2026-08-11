#!/usr/bin/env python3
"""Website Console smoke contracts shared by local and registry verification."""

EXPECTED_SITE_PAYLOAD_KEYS = [
    "filePath",
    "valid",
    "status",
    "site",
    "counts",
    "auditStatusCounts",
    "mcpStatusCounts",
    "taskPriorityCounts",
    "requiredMcp",
    "topTasks",
    "issues",
]
EXPECTED_SITE_PROFILE_KEYS = [
    "id",
    "name",
    "liveUrl",
    "repoUrl",
    "localPath",
    "deployProvider",
    "cms",
    "database",
    "pages",
    "userFlows",
    "viewports",
]
EXPECTED_SITE_COUNTS_KEYS = [
    "pages",
    "userFlows",
    "viewports",
    "auditCategories",
    "auditFindings",
    "refactorTasks",
    "executedWork",
    "verificationResults",
    "remainingRisks",
    "nextActions",
    "requiredMcp",
    "optionalMcp",
    "unavailableMcp",
]
EXPECTED_SITE_TOP_TASK_KEYS = ["id", "title", "priority", "category", "impact", "effort", "pages"]
EXPECTED_SITE_ISSUE_KEYS = ["level", "id", "message"]
EXPECTED_SITE_NEXT_ACTIONS_PAYLOAD_KEYS = [
    "kind",
    "version",
    "filePath",
    "status",
    "workspaceStatus",
    "mcpStatus",
    "mcpProbeStatus",
    "mcpProbeCounts",
    "site",
    "counts",
    "topTasks",
    "actions",
    "commands",
    "boundaries",
    "externalCalls",
    "targetRepoMutation",
]
EXPECTED_SITE_MCP_PROBE_COUNTS = {"count": 4, "pass": 4, "warn": 0, "fail": 0}
EXPECTED_SITE_BUNDLE_MCP_PROBES_KEYS = [
    "enabled",
    "mode",
    "externalCalls",
    "status",
    "count",
    "pass",
    "warn",
    "fail",
    "items",
]
EXPECTED_SITE_BUNDLE_MCP_PROBE_ITEM_KEYS = [
    "id",
    "key",
    "label",
    "requestedStatus",
    "level",
    "passed",
    "message",
    "evidence",
    "actions",
]
EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS = [
    "github-repo-reference",
    "figma-url-reference",
    "browser-smoke-target",
    "deploy-provider-reference",
]
EXPECTED_SITE_NEXT_ACTIONS_SITE_KEYS = ["name", "liveUrl", "repoUrl", "localPath"]
EXPECTED_SITE_NEXT_ACTIONS_COUNTS_KEYS = [
    "actions",
    "blocking",
    "warnings",
    "tasks",
    "requiredMcpMissing",
    "taskGaps",
    "probeGaps",
]
EXPECTED_SITE_NEXT_ACTIONS_TOP_TASK_KEYS = ["id", "title", "priority", "category", "impact", "effort"]
EXPECTED_SITE_NEXT_ACTION_KEYS = ["rank", "severity", "title", "reason", "command", "references"]
EXPECTED_SITE_NEXT_ACTION_COMMAND_KEYS = [
    "summary",
    "mcpCheck",
    "mcpPlan",
    "mcpCheckProbes",
    "mcpPlanProbes",
    "tasks",
    "implementationPrompt",
    "handoffReport",
    "handoffBundle",
]
EXPECTED_SITE_SAMPLE_KEYS = [
    "version",
    "updatedAt",
    "siteProfile",
    "auditChecklist",
    "mcpReadiness",
    "refactorTasks",
    "implementationEvidence",
    "reportNotes",
]
EXPECTED_SITE_SAMPLE_PROFILE_KEYS = [
    "id",
    "name",
    "liveUrl",
    "repoUrl",
    "localPath",
    "figmaUrl",
    "brandNotes",
    "deployProvider",
    "sentryProject",
    "cms",
    "database",
    "pages",
    "userFlows",
    "viewports",
]
EXPECTED_SITE_SAMPLE_TASK_KEYS = [
    "id",
    "title",
    "category",
    "problem",
    "evidence",
    "impact",
    "effort",
    "priority",
    "pages",
    "recommendedMcp",
    "codexPrompt",
    "verification",
    "risks",
]
EXPECTED_SITE_INTAKE_TEMPLATE_KEYS = [
    "kind",
    "version",
    "format",
    "language",
    "recommendedFileName",
    "sections",
    "privacy",
    "commands",
    "content",
]
EXPECTED_SITE_INTAKE_TEMPLATE_PRIVACY_KEYS = [
    "storesCredentials",
    "storesProductionSecrets",
    "storesCustomerData",
]
EXPECTED_SITE_INTAKE_TEMPLATE_COMMAND_KEYS = [
    "nextActions",
    "bundle",
    "bundleCheck",
    "bundleHandoff",
]
EXPECTED_SITE_PROMPT_TEMPLATE_PAYLOAD_KEYS = ["count", "templates"]
EXPECTED_SITE_PROMPT_TEMPLATE_KEYS = [
    "id",
    "label",
    "agent",
    "output",
    "description",
    "taskSelectable",
]
EXPECTED_SITE_PROMPT_TEMPLATE_IDS = [
    "implementation-plan",
    "critique-loop",
    "design-contract",
    "codex-repo-intake",
    "codex-implementation",
    "codex-visual-qa",
    "codex-deployment",
    "claude-design-review",
    "claude-competitor",
    "claude-copy-ux",
    "handoff-report",
]
EXPECTED_SITE_MCP_CHECK_PAYLOAD_KEYS = [
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "items",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
]
EXPECTED_SITE_MCP_CHECK_SITE_KEYS = ["name", "liveUrl", "repoUrl", "localPath"]
EXPECTED_SITE_MCP_CHECK_COUNTS_KEYS = [
    "total",
    "required",
    "optional",
    "ready",
    "missing",
    "unused",
    "unavailable",
    "taskGaps",
]
EXPECTED_SITE_MCP_CHECK_ITEM_KEYS = [
    "key",
    "label",
    "requestedStatus",
    "state",
    "level",
    "evidence",
    "actions",
]
EXPECTED_SITE_MCP_CHECK_PROBES_PAYLOAD_KEYS = EXPECTED_SITE_MCP_CHECK_PAYLOAD_KEYS + ["probes", "commands"]
EXPECTED_SITE_MCP_PROBES_KEYS = [
    "enabled",
    "mode",
    "externalCalls",
    "status",
    "count",
    "pass",
    "warn",
    "fail",
    "items",
]
EXPECTED_SITE_MCP_PROBE_ITEM_KEYS = [
    "id",
    "key",
    "label",
    "requestedStatus",
    "level",
    "passed",
    "message",
    "evidence",
    "actions",
]
EXPECTED_SITE_MCP_CHECK_PROBE_COMMAND_KEYS = [
    "mcpCheckProbesHumanOut",
    "mcpCheckProbesJsonOut",
    "mcpPlanProbesJson",
    "mcpPlanProbesJsonOut",
]
EXPECTED_SITE_MCP_CHECK_TASK_GAP_KEYS = ["taskId", "title", "mcp", "status", "level", "message"]
EXPECTED_SITE_MCP_ACTION_PLAN_PAYLOAD_KEYS = [
    "kind",
    "version",
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "readinessMatrix",
    "probes",
    "blockingItems",
    "warnings",
    "taskAlignment",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
    "executionSequence",
    "commands",
    "boundaries",
    "externalCalls",
    "targetRepoMutation",
]
EXPECTED_SITE_MCP_ACTION_PLAN_TASK_KEYS = [
    "task",
    "priorityImpact",
    "recommendedMcp",
    "readinessState",
]
EXPECTED_SITE_MCP_ACTION_PLAN_COMMAND_KEYS = [
    "mcpCheck",
    "mcpCheckProbesHumanOut",
    "mcpCheckProbesJsonOut",
    "mcpPlanProbesJsonOut",
    "tasks",
    "implementationPrompt",
    "handoffReport",
]
EXPECTED_SITE_WORKFLOW_GRAPH_PAYLOAD_KEYS = [
    "version",
    "kind",
    "generatedAt",
    "filePath",
    "status",
    "workspaceStatus",
    "mcpStatus",
    "externalCalls",
    "site",
    "summary",
    "nodes",
    "edges",
    "boundaries",
]
EXPECTED_SITE_WORKFLOW_GRAPH_SITE_KEYS = ["id", "name", "liveUrl", "repoUrl", "localPath"]
EXPECTED_SITE_WORKFLOW_GRAPH_SUMMARY_KEYS = [
    "status",
    "workspaceStatus",
    "mcpStatus",
    "nodeCount",
    "edgeCount",
    "auditCategoryCount",
    "taskCount",
    "generatedTaskCount",
    "requiredMcpCount",
    "promptTemplateCount",
]
EXPECTED_SITE_WORKFLOW_GRAPH_NODE_KEYS = ["id", "type", "label", "status", "data"]
EXPECTED_SITE_WORKFLOW_GRAPH_EDGE_KEYS = ["id", "from", "to", "type", "label"]
EXPECTED_SITE_WORKFLOW_GRAPH_NODE_IDS = [
    "workspace:intake",
    "profile:sample-korean-saas",
    "audit:visual-design",
    "audit:accessibility",
    "mcp:github",
    "mcp:browser",
    "task:task-homepage-cta",
    "task:task-accessibility",
    "task:task-content-quality",
    "prompt:codex-implementation",
    "prompt:claude-design-review",
    "handoff:report",
    "handoff:bundle",
    "handoff:target-repo",
]
