// Next-action reports for Website Improvement workspaces.

import { buildSiteMcpProbeReport } from "./site-mcp-probes.mjs";
import { buildSiteMcpCheckReport, combineStatuses } from "./site-mcp-report.mjs";
import { buildSiteNextActionCommandSet, siteMcpCommandTarget } from "./site-mcp-commands.mjs";
import { PRIORITY_OPTIONS } from "./site-options.mjs";
import { countImplementationEvidence } from "./site-evidence.mjs";

function nextActionEntry({ severity, title, reason, command = "", references = [] }) {
  return {
    severity,
    title,
    reason,
    command,
    references,
  };
}

function quoteCliValue(value) {
  const text = String(value || "");
  if (/^[A-Za-z0-9_./:@+-]+$/.test(text)) {
    return text;
  }
  return `'${text.replaceAll("'", "'\"'\"'")}'`;
}

function buildSiteInitCommand(profile, outPath = "website-workspace.json") {
  const args = [
    "design-ai site --init",
    "--name",
    quoteCliValue(profile.name),
    "--live-url",
    quoteCliValue(profile.liveUrl),
  ];
  if (profile.repoUrl) args.push("--repo-url", quoteCliValue(profile.repoUrl));
  if (profile.localPath) args.push("--local-path", quoteCliValue(profile.localPath));
  if (profile.figmaUrl) args.push("--figma-url", quoteCliValue(profile.figmaUrl));
  if (profile.brandNotes) args.push("--brand-notes", quoteCliValue(profile.brandNotes));
  if (profile.deployProvider && profile.deployProvider !== "none") args.push("--deploy", quoteCliValue(profile.deployProvider));
  if (profile.sentryProject) args.push("--sentry", quoteCliValue(profile.sentryProject));
  if (profile.cms && profile.cms !== "none") args.push("--cms", quoteCliValue(profile.cms));
  if (profile.database && profile.database !== "none") args.push("--database", quoteCliValue(profile.database));
  for (const page of profile.pages) args.push("--page", quoteCliValue(page));
  for (const flow of profile.userFlows) args.push("--flow", quoteCliValue(flow));
  for (const viewport of profile.viewports) args.push("--viewport", quoteCliValue(viewport));
  args.push("--out", quoteCliValue(outPath));
  return args.join(" ");
}

export function buildSiteNextActionsReport(workspace, summary = {}) {
  const filePath = summary.filePath || "workspace.json";
  const commandTarget = siteMcpCommandTarget(filePath);
  const commands = buildSiteNextActionCommandSet(commandTarget);
  const mcpReport = buildSiteMcpCheckReport(workspace, summary);
  const mcpProbeReport = buildSiteMcpProbeReport(workspace);
  const topTasks = workspace.refactorTasks
    .slice()
    .sort((a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority))
    .slice(0, 3);
  const actions = [];

  for (const issue of (summary.issues || []).filter((item) => item.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: issue.level === "fail" ? "blocking" : "warning",
      title: `Fix workspace validation: ${issue.id}`,
      reason: issue.message,
      command: commands.summary,
      references: [issue.id],
    }));
  }

  for (const item of mcpReport.items.filter((mcp) => mcp.requestedStatus === "required" && mcp.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: "blocking",
      title: `Add required MCP readiness: ${item.label}`,
      reason: item.actions.join(" ") || "Required MCP readiness is missing.",
      command: commands.mcpCheck,
      references: [item.key],
    }));
  }

  for (const item of mcpReport.items.filter((mcp) => mcp.requestedStatus === "optional" && mcp.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: "warning",
      title: `Clarify optional MCP readiness: ${item.label}`,
      reason: item.actions.join(" ") || "Optional MCP readiness is missing; add evidence or mark it unused.",
      command: commands.mcpPlan,
      references: [item.key],
    }));
  }

  for (const gap of mcpReport.taskGaps) {
    actions.push(nextActionEntry({
      severity: "warning",
      title: `Align MCP status for ${gap.taskId}`,
      reason: gap.message,
      command: commands.mcpPlan,
      references: [gap.taskId, gap.mcp],
    }));
  }

  for (const item of mcpProbeReport.items.filter((probe) => probe.level !== "pass")) {
    actions.push(nextActionEntry({
      severity: item.level === "fail" ? "blocking" : "warning",
      title: `Resolve MCP probe readiness: ${item.label}`,
      reason: item.actions.join(" ") || item.message,
      command: item.level === "fail" ? commands.mcpCheckProbes : commands.mcpPlanProbes,
      references: [item.id, item.key],
    }));
  }

  if (workspace.refactorTasks.length === 0) {
    actions.push(nextActionEntry({
      severity: "setup",
      title: "Generate starter refactor tasks",
      reason: "No refactor tasks exist yet; generate task scaffolding from audit findings before implementation handoff.",
      command: commands.tasks,
      references: ["refactorTasks"],
    }));
  } else {
    const selected = topTasks[0];
    actions.push(nextActionEntry({
      severity: "implementation",
      title: `Prepare Codex implementation prompt for ${selected.id}`,
      reason: `${selected.title} is the highest-priority available refactor task.`,
      command: commands.implementationPrompt,
      references: [selected.id],
    }));
  }

  const evidenceCounts = countImplementationEvidence(summary.counts || workspace.implementationEvidence);
  if (evidenceCounts.executedWork === 0 || evidenceCounts.verificationResults === 0) {
    actions.push(nextActionEntry({
      severity: "handoff",
      title: "Create implementation evidence trail",
      reason: "Executed work or verification results are still empty, so the handoff report should capture what remains unverified.",
      command: commands.handoffReport,
      references: ["implementationEvidence"],
    }));
  }

  actions.push(nextActionEntry({
    severity: "handoff",
    title: "Export portable handoff bundle",
    reason: "A bundle keeps summary, tasks, MCP evidence, prompts, and handoff report together for the target website repo workflow.",
    command: commands.handoffBundle,
    references: ["bundle"],
  }));

  const severityOrder = {
    blocking: 0,
    warning: 1,
    setup: 2,
    implementation: 3,
    handoff: 4,
  };
  const rankedActions = actions
    .map((action, index) => ({ action, index }))
    .sort((a, b) => {
      const severityDiff = (severityOrder[a.action.severity] ?? 99) - (severityOrder[b.action.severity] ?? 99);
      return severityDiff || a.index - b.index;
    })
    .map(({ action }, index) => ({
      rank: index + 1,
      ...action,
    }));

  return {
    kind: "website-improvement-next-actions",
    version: 1,
    filePath,
    status: combineStatuses(summary.status || "pass", mcpReport.status, mcpProbeReport.status),
    workspaceStatus: summary.status || "unknown",
    mcpStatus: mcpReport.status,
    mcpProbeStatus: mcpProbeReport.status,
    mcpProbeCounts: {
      count: mcpProbeReport.count,
      pass: mcpProbeReport.pass,
      warn: mcpProbeReport.warn,
      fail: mcpProbeReport.fail,
    },
    site: {
      name: workspace.siteProfile.name,
      liveUrl: workspace.siteProfile.liveUrl,
      repoUrl: workspace.siteProfile.repoUrl,
      localPath: workspace.siteProfile.localPath,
    },
    counts: {
      actions: rankedActions.length,
      blocking: rankedActions.filter((action) => action.severity === "blocking").length,
      warnings: rankedActions.filter((action) => action.severity === "warning").length,
      tasks: workspace.refactorTasks.length,
      requiredMcpMissing: mcpReport.items.filter((item) => item.requestedStatus === "required" && item.level !== "pass").length,
      taskGaps: mcpReport.taskGaps.length,
      probeGaps: mcpProbeReport.items.filter((item) => item.level !== "pass").length,
    },
    topTasks: topTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      category: task.category,
      impact: task.impact,
      effort: task.effort,
    })),
    actions: rankedActions,
    commands,
    boundaries: [
      "This next-action report is deterministic and local.",
      "It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write deployment/CMS/Sentry data.",
      "MCP probes are read-only local URL/path/reference checks and do not connect to external MCP servers.",
      "Run implementation commands in the target website workflow after readiness blockers are cleared.",
    ],
    externalCalls: false,
    targetRepoMutation: false,
  };
}

export function buildSiteInitNextActionsReport(workspace, summary = {}) {
  const filePath = summary.filePath || "website-workspace.json";
  const report = buildSiteNextActionsReport(workspace, {
    ...summary,
    filePath,
  });
  const createWorkspaceCommand = buildSiteInitCommand(workspace.siteProfile, filePath);
  const createWorkspaceAction = {
    rank: 1,
    ...nextActionEntry({
      severity: "setup",
      title: "Save the generated Website Improvement workspace",
      reason: "The company dogfood flow needs a durable workspace JSON before MCP checks, task generation, handoff reports, or target-repo prompts can reference it.",
      command: createWorkspaceCommand,
      references: ["siteProfile", "workspace"],
    }),
  };
  const actions = [createWorkspaceAction, ...report.actions.map((action) => ({
    ...action,
    rank: action.rank + 1,
  }))];
  return {
    ...report,
    mode: "init-next-actions",
    counts: {
      ...report.counts,
      actions: actions.length,
      blocking: actions.filter((action) => action.severity === "blocking").length,
      warnings: actions.filter((action) => action.severity === "warning").length,
    },
    actions,
    commands: {
      createWorkspace: createWorkspaceCommand,
      ...report.commands,
    },
    boundaries: [
      "This init next-action report is deterministic and local.",
      "Save the workspace JSON first when you plan to continue in the Website Console or target website repo.",
      ...report.boundaries,
    ],
  };
}

export function buildSiteIntakeNextActionsReport(workspace, summary = {}, options = {}) {
  const intakePath = options.intakePath || "company-website-intake.md";
  const workspacePath = options.workspacePath || "website-workspace.json";
  const report = buildSiteNextActionsReport(workspace, {
    ...summary,
    filePath: workspacePath,
  });
  const createWorkspaceCommand = options.stdin
    ? `cat company-website-intake.md | design-ai site --from-intake --stdin --out ${quoteCliValue(workspacePath)} --force`
    : `design-ai site --from-intake ${quoteCliValue(intakePath)} --out ${quoteCliValue(workspacePath)} --force`;
  const createWorkspaceAction = {
    rank: 1,
    ...nextActionEntry({
      severity: "setup",
      title: "Save the parsed Website Improvement workspace",
      reason: "The filled intake Markdown should be converted into durable workspace JSON before MCP checks, task generation, handoff reports, or target-repo prompts reference it.",
      command: createWorkspaceCommand,
      references: ["intake", "workspace"],
    }),
  };
  const actions = [createWorkspaceAction, ...report.actions.map((action) => ({
    ...action,
    rank: action.rank + 1,
  }))];
  return {
    ...report,
    mode: "from-intake-next-actions",
    intakePath,
    counts: {
      ...report.counts,
      actions: actions.length,
      blocking: actions.filter((action) => action.severity === "blocking").length,
      warnings: actions.filter((action) => action.severity === "warning").length,
    },
    actions,
    commands: {
      createWorkspace: createWorkspaceCommand,
      ...report.commands,
    },
    boundaries: [
      "This intake next-action report is deterministic and local.",
      "Save the parsed workspace JSON first when you plan to continue in the Website Console or target website repo.",
      ...report.boundaries,
    ],
  };
}

export function formatSiteNextActionsJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteNextActionsHuman(report) {
  return [
    `Website Improvement next actions: ${report.site.name}`,
    "",
    `Status: ${report.status}`,
    `Workspace status: ${report.workspaceStatus}`,
    `MCP status: ${report.mcpStatus}`,
    `MCP probe status: ${report.mcpProbeStatus}`,
    `MCP probes: ${report.mcpProbeCounts.pass}/${report.mcpProbeCounts.count} passing, ${report.mcpProbeCounts.warn} warning, ${report.mcpProbeCounts.fail} failing`,
    `Actions: ${report.counts.actions} (${report.counts.blocking} blocking, ${report.counts.warnings} warning)`,
    "",
    "Prioritized actions:",
    ...report.actions.map((action) => {
      const command = action.command ? `\n   Command: \`${action.command}\`` : "";
      const refs = action.references.length ? `\n   References: ${action.references.join(", ")}` : "";
      return `${action.rank}. [${action.severity}] ${action.title}\n   Why: ${action.reason}${command}${refs}`;
    }),
    "",
    "Boundaries:",
    ...report.boundaries.map((boundary) => `- ${boundary}`),
  ].join("\n");
}
