// Website Improvement workflow graph helpers.

import {
  buildSiteMcpCheckReport,
  combineStatuses,
  normalizeMcpKey,
} from "./site-mcp-report.mjs";
import { orderedRefactorTasks } from "./site-prompts.mjs";
import { markdownTable } from "./site-strings.mjs";
import {
  AUDIT_CATEGORIES,
} from "./site-options.mjs";
import {
  SITE_PROMPT_TEMPLATES,
} from "./site-content.mjs";
import { analyzeSiteWorkspace } from "./site-analysis.mjs";
import { generateSiteRefactorTasks } from "./site-tasks.mjs";

function workflowNode(id, type, label, status, data = {}) {
  return {
    id,
    type,
    label,
    status,
    data,
  };
}

function workflowEdge(from, to, type, label) {
  return {
    id: `${from}->${to}:${type}`,
    from,
    to,
    type,
    label,
  };
}

function siteProfileNodeId(profile) {
  return `profile:${profile.id || "site"}`;
}

function workflowGraphMcpNodes(mcpReport) {
  return mcpReport.items.map((item) => workflowNode(
    `mcp:${item.key}`,
    "mcp-readiness",
    item.label,
    item.level,
    {
      key: item.key,
      requestedStatus: item.requestedStatus,
      state: item.state,
      evidence: item.evidence,
      actions: item.actions,
    },
  ));
}

function workflowGraphTaskNode(task) {
  return workflowNode(
    `task:${task.id}`,
    "refactor-task",
    task.title,
    "planned",
    {
      id: task.id,
      category: task.category,
      problem: task.problem,
      evidence: task.evidence,
      impact: task.impact,
      effort: task.effort,
      priority: task.priority,
      pages: task.pages,
      recommendedMcp: task.recommendedMcp,
      codexPrompt: task.codexPrompt,
      verification: task.verification,
      risks: task.risks,
    },
  );
}

export function buildSiteWorkflowGraph(workspaceInput, summary = {}) {
  const taskResult = generateSiteRefactorTasks(workspaceInput);
  const workspace = taskResult.workspace;
  const filePath = summary.filePath || "workspace.json";
  const { summary: taskSummary } = analyzeSiteWorkspace(workspace, { filePath });
  const mcpReport = buildSiteMcpCheckReport(workspace, taskSummary);
  const profile = workspace.siteProfile;
  const profileNodeId = siteProfileNodeId(profile);
  const orderedTasks = orderedRefactorTasks(workspace);
  const nodes = [];
  const edges = [];

  nodes.push(workflowNode(
    "workspace:intake",
    "workspace",
    "Workspace intake",
    taskSummary.status,
    {
      version: workspace.version,
      updatedAt: workspace.updatedAt,
      source: filePath,
      workspaceStatus: taskSummary.status,
      mcpStatus: mcpReport.status,
    },
  ));
  nodes.push(workflowNode(
    profileNodeId,
    "site-profile",
    profile.name,
    taskSummary.status,
    {
      id: profile.id,
      liveUrl: profile.liveUrl,
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      figmaUrl: profile.figmaUrl,
      deployProvider: profile.deployProvider,
      cms: profile.cms,
      database: profile.database,
      pages: profile.pages,
      userFlows: profile.userFlows,
      viewports: profile.viewports,
      brandNotes: profile.brandNotes,
    },
  ));
  edges.push(workflowEdge("workspace:intake", profileNodeId, "profile", "Workspace defines the target site profile"));

  for (const category of AUDIT_CATEGORIES) {
    const row = workspace.auditChecklist[category.id];
    const nodeId = `audit:${category.id}`;
    nodes.push(workflowNode(
      nodeId,
      "audit-category",
      category.label,
      row.status,
      {
        category: category.id,
        notes: row.notes,
        findings: row.findings,
        findingCount: row.findings.length,
        defaultVerification: category.defaultVerification,
      },
    ));
    edges.push(workflowEdge(profileNodeId, nodeId, "audit-input", "Site context drives this audit category"));
  }

  const mcpNodes = workflowGraphMcpNodes(mcpReport);
  nodes.push(...mcpNodes);
  for (const node of mcpNodes) {
    edges.push(workflowEdge(profileNodeId, node.id, "readiness-input", "Site profile provides MCP readiness evidence"));
  }

  for (const task of orderedTasks) {
    const taskNode = workflowGraphTaskNode(task);
    nodes.push(taskNode);
    edges.push(workflowEdge(`audit:${task.category}`, taskNode.id, "finding-to-task", "Audit finding informs this refactor task"));
    edges.push(workflowEdge(profileNodeId, taskNode.id, "site-context", "Site profile scopes this refactor task"));
    for (const rawMcp of task.recommendedMcp) {
      const key = normalizeMcpKey(rawMcp);
      if (workspace.mcpReadiness[key]) {
        edges.push(workflowEdge(`mcp:${key}`, taskNode.id, "mcp-support", "MCP readiness supports task execution"));
      }
    }
  }

  for (const template of SITE_PROMPT_TEMPLATES) {
    const promptNodeId = `prompt:${template.id}`;
    nodes.push(workflowNode(
      promptNodeId,
      "prompt-template",
      template.label,
      "ready",
      {
        id: template.id,
        agent: template.agent,
        output: template.output,
        description: template.description,
        taskSelectable: template.taskSelectable,
      },
    ));
    edges.push(workflowEdge(profileNodeId, promptNodeId, "profile-context", "Prompt template receives site profile context"));
  }

  for (const task of orderedTasks) {
    edges.push(workflowEdge(`task:${task.id}`, "prompt:codex-implementation", "implementation-prompt", "Task can be exported as a Codex implementation prompt"));
  }

  nodes.push(workflowNode(
    "handoff:report",
    "handoff-report",
    "Handoff report",
    "ready",
    {
      output: "website-handoff.md",
      purpose: "Summarize site state, audit findings, priority improvements, verification, and remaining risk",
    },
  ));
  nodes.push(workflowNode(
    "handoff:bundle",
    "handoff-bundle",
    "Local handoff bundle",
    "ready",
    {
      output: "website-handoff-bundle",
      purpose: "Package the local Website Improvement plan without mutating the target repo",
    },
  ));
  nodes.push(workflowNode(
    "handoff:target-repo",
    "target-repo",
    "Target website repo",
    "external",
    {
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      boundary: "Implementation happens outside the design-ai repository",
    },
  ));
  edges.push(workflowEdge(profileNodeId, "handoff:report", "handoff-input", "Site profile anchors the handoff report"));
  for (const task of orderedTasks) {
    edges.push(workflowEdge(`task:${task.id}`, "handoff:report", "handoff-input", "Refactor task is summarized in the handoff report"));
  }
  for (const item of mcpReport.items.filter((item) => item.requestedStatus !== "unused")) {
    edges.push(workflowEdge(`mcp:${item.key}`, "handoff:report", "readiness-input", "MCP readiness is summarized in the handoff report"));
  }
  for (const template of SITE_PROMPT_TEMPLATES) {
    edges.push(workflowEdge(`prompt:${template.id}`, "handoff:target-repo", "agent-prompt", "Prompt can be used in the target website workflow"));
  }
  edges.push(workflowEdge("handoff:report", "handoff:bundle", "bundle-input", "Handoff report can be packaged into a local bundle"));
  edges.push(workflowEdge("handoff:bundle", "handoff:target-repo", "handoff", "Verified bundle can become target-repo implementation context"));

  const status = combineStatuses(taskSummary.status, mcpReport.status);
  return {
    version: 1,
    kind: "website-improvement-workflow-graph",
    generatedAt: workspace.updatedAt,
    filePath,
    status,
    workspaceStatus: taskSummary.status,
    mcpStatus: mcpReport.status,
    externalCalls: false,
    site: {
      id: profile.id,
      name: profile.name,
      liveUrl: profile.liveUrl,
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
    },
    summary: {
      status,
      workspaceStatus: taskSummary.status,
      mcpStatus: mcpReport.status,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      auditCategoryCount: AUDIT_CATEGORIES.length,
      taskCount: orderedTasks.length,
      generatedTaskCount: taskResult.created.length,
      requiredMcpCount: mcpReport.counts.required,
      promptTemplateCount: SITE_PROMPT_TEMPLATES.length,
    },
    nodes,
    edges,
    boundaries: [
      "deterministic-local",
      "no-external-mcp-calls",
      "no-target-repo-mutation",
      "no-new-dependencies",
    ],
  };
}

export function formatSiteWorkflowGraphJson(graph) {
  return JSON.stringify(graph, null, 2);
}

export function formatSiteWorkflowGraphMarkdown(graph) {
  return [
    `# Website improvement workflow graph: ${graph.site.name}`,
    "",
    "## Summary",
    `- Source: ${graph.filePath}`,
    `- Status: ${graph.status}`,
    `- Workspace status: ${graph.workspaceStatus}`,
    `- MCP status: ${graph.mcpStatus}`,
    `- Nodes: ${graph.summary.nodeCount}`,
    `- Edges: ${graph.summary.edgeCount}`,
    `- Tasks: ${graph.summary.taskCount}`,
    `- Prompt templates: ${graph.summary.promptTemplateCount}`,
    `- External calls: ${graph.externalCalls ? "yes" : "no"}`,
    "",
    "## Nodes",
    markdownTable(
      ["ID", "Type", "Status", "Label"],
      graph.nodes.map((node) => [node.id, node.type, node.status, node.label]),
    ),
    "",
    "## Edges",
    markdownTable(
      ["From", "To", "Type", "Label"],
      graph.edges.map((edge) => [edge.from, edge.to, edge.type, edge.label]),
    ),
    "",
    "## Boundaries",
    "- This graph is deterministic and local.",
    "- No external MCP calls are made.",
    "- It does not mutate the target website repo, run Lighthouse/axe, crawl pages, add dependencies, or write to external systems.",
  ].join("\n");
}
