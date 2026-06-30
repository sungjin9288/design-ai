// MCP readiness reports and action plans for Website Improvement workspaces.

import { buildSiteMcpProbeCommandSet, siteMcpCommandTarget } from "./site-mcp-commands.mjs";
import { buildSiteMcpProbeReport } from "./site-mcp-probes.mjs";
import { mcpItemReport, siteMcpCheckStatus } from "./site-mcp-readiness.mjs";
import { MCP_ITEMS, PRIORITY_OPTIONS } from "./site-options.mjs";
import { markdownList, markdownTable, normalizeStringArray } from "./site-strings.mjs";

export function combineStatuses(...statuses) {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  return "pass";
}

export function normalizeMcpKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const canonical = {
    chrome: "chromeDevtools",
    chromeDevTools: "chromeDevtools",
    devtools: "chromeDevtools",
    playwright: "browser",
    browserplaywright: "browser",
    github: "github",
    figma: "figma",
    browser: "browser",
    chromeDevtools: "chromeDevtools",
    deploy: "deploy",
    sentry: "sentry",
    database: "database",
    cms: "cms",
    collaboration: "collaboration",
    research: "research",
  };
  return canonical[raw] || canonical[raw.replace(/[^a-zA-Z]/g, "")] || raw;
}

function mcpTaskGaps(workspace) {
  return workspace.refactorTasks.flatMap((task) => normalizeStringArray(task.recommendedMcp).flatMap((rawMcp) => {
    const key = normalizeMcpKey(rawMcp);
    if (!key || !workspace.mcpReadiness[key]) return [];
    const status = workspace.mcpReadiness[key];
    if (status !== "unused" && status !== "unavailable") return [];
    return [{
      taskId: task.id,
      title: task.title,
      mcp: key,
      status,
      level: "warn",
      message: `Task '${task.title}' recommends ${key}, but mcpReadiness marks it ${status}.`,
    }];
  }));
}

export function buildSiteMcpCheckReport(workspace, summary = {}, options = {}) {
  const items = MCP_ITEMS.map(([key, label]) => mcpItemReport(workspace, key, label));
  const taskGaps = mcpTaskGaps(workspace);
  const workspaceIssues = (summary.issues || []).filter((issue) => issue.level !== "pass");
  const baseStatus = siteMcpCheckStatus(items, taskGaps, workspaceIssues);
  const probes = options.probes ? buildSiteMcpProbeReport(workspace) : null;
  const status = probes ? combineStatuses(baseStatus, probes.status) : baseStatus;
  const nextActions = [
    ...items.flatMap((item) => item.actions),
    ...(probes ? probes.items.flatMap((item) => item.actions.map((action) => `Probe ${item.id}: ${action}`)) : []),
    ...taskGaps.map((gap) => `Align task '${gap.taskId}' recommendedMcp with mcpReadiness.${gap.mcp}.`),
  ];

  const report = {
    filePath: summary.filePath || "workspace.json",
    status,
    workspaceStatus: summary.status || "unknown",
    site: {
      name: workspace.siteProfile.name,
      liveUrl: workspace.siteProfile.liveUrl,
      repoUrl: workspace.siteProfile.repoUrl,
      localPath: workspace.siteProfile.localPath,
    },
    counts: {
      total: items.length,
      required: items.filter((item) => item.requestedStatus === "required").length,
      optional: items.filter((item) => item.requestedStatus === "optional").length,
      ready: items.filter((item) => item.state === "ready").length,
      missing: items.filter((item) => item.state === "missing").length,
      unused: items.filter((item) => item.state === "unused").length,
      unavailable: items.filter((item) => item.state === "unavailable").length,
      taskGaps: taskGaps.length,
    },
    items,
    taskGaps,
    workspaceIssues,
    nextActions,
  };
  if (probes) {
    report.probes = probes;
    report.commands = buildSiteMcpProbeCommandSet(siteMcpCommandTarget(report.filePath));
  }
  return report;
}

export function formatSiteMcpCheckJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteMcpCheckHuman(report) {
  return [
    `Website Improvement MCP readiness: ${report.site.name}`,
    "",
    `Status: ${report.status}`,
    `Workspace status: ${report.workspaceStatus}`,
    `Required MCP: ${report.counts.required}`,
    `Ready: ${report.counts.ready}`,
    `Missing: ${report.counts.missing}`,
    `Task gaps: ${report.counts.taskGaps}`,
    "",
    "MCP checks:",
    ...report.items.map((item) => {
      const evidence = item.evidence.length ? item.evidence.join("; ") : "no evidence";
      const action = item.actions.length ? `\n   Next: ${item.actions.join(" ")}` : "";
      return `- [${item.level}] ${item.label} (${item.requestedStatus}) -> ${item.state}\n   Evidence: ${evidence}${action}`;
    }),
    "",
    "Task MCP gaps:",
    ...(report.taskGaps.length
      ? report.taskGaps.map((gap) => `- [${gap.level}] ${gap.taskId}: ${gap.message}`)
      : ["- none"]),
    ...(report.probes ? [
      "",
      "Read-only probes:",
      `Mode: ${report.probes.mode}; external calls: ${report.probes.externalCalls ? "yes" : "no"}; status: ${report.probes.status}`,
      ...report.probes.items.map((item) => {
        const evidence = item.evidence.length ? item.evidence.join("; ") : "no evidence";
        const action = item.actions.length ? `\n   Next: ${item.actions.join(" ")}` : "";
        return `- [${item.level}] ${item.label} (${item.requestedStatus}) -> ${item.passed ? "pass" : "needs attention"}\n   Evidence: ${evidence}${action}`;
      }),
    ] : []),
    ...(report.commands ? [
      "",
      "Probe commands:",
      `- Save readiness probe report: \`${report.commands.mcpCheckProbesHumanOut}\``,
      `- Save readiness probe JSON: \`${report.commands.mcpCheckProbesJsonOut}\``,
      `- Generate probe action plan JSON: \`${report.commands.mcpPlanProbesJson}\``,
      `- Save probe action plan JSON: \`${report.commands.mcpPlanProbesJsonOut}\``,
    ] : []),
    "",
    "Next actions:",
    ...(report.nextActions.length ? report.nextActions.map((action) => `- ${action}`) : ["- none"]),
  ].join("\n");
}

function mcpActionPlanTaskRows(workspace, report) {
  const stateByKey = new Map(report.items.map((item) => [item.key, item.state]));
  const topTasks = workspace.refactorTasks
    .slice()
    .sort((a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority))
    .slice(0, 8);

  if (topTasks.length === 0) {
    return [["No refactor tasks", "n/a", "n/a", "Generate starter tasks with `design-ai site <workspace.json> --tasks`."]];
  }

  return topTasks.map((task) => {
    const mcps = normalizeStringArray(task.recommendedMcp);
    const states = mcps.length
      ? mcps.map((rawMcp) => {
        const key = normalizeMcpKey(rawMcp);
        return `${key}: ${stateByKey.get(key) || "unknown"}`;
      }).join(", ")
      : "none";
    return [
      task.id,
      `${task.priority} / ${task.impact}`,
      mcps.join(", ") || "none",
      states,
    ];
  });
}

export function buildSiteMcpActionPlanData(workspace, summary = {}, options = {}) {
  const report = buildSiteMcpCheckReport(workspace, summary, options);
  const filePath = report.filePath || "workspace.json";
  const commandTarget = siteMcpCommandTarget(filePath);
  const probeCommands = buildSiteMcpProbeCommandSet(commandTarget);
  const requiredGaps = report.items.filter((item) => item.requestedStatus === "required" && item.level !== "pass");
  const optionalGaps = report.items.filter((item) => item.requestedStatus === "optional" && item.level !== "pass");
  const blockingIssues = [
    ...report.workspaceIssues.filter((issue) => issue.level === "fail").map((issue) => `${issue.id}: ${issue.message}`),
    ...requiredGaps.map((item) => `${item.label}: ${item.actions.join(" ") || "Add required readiness evidence."}`),
  ];
  const warningIssues = [
    ...report.workspaceIssues.filter((issue) => issue.level === "warn").map((issue) => `${issue.id}: ${issue.message}`),
    ...optionalGaps.map((item) => `${item.label}: ${item.actions.join(" ") || "Add optional readiness evidence or mark unused."}`),
    ...report.taskGaps.map((gap) => `${gap.taskId}: ${gap.message}`),
  ];
  const taskAlignment = mcpActionPlanTaskRows(workspace, report).map((row) => ({
    task: row[0],
    priorityImpact: row[1],
    recommendedMcp: row[2],
    readinessState: row[3],
  }));
  const commands = {
    mcpCheck: `design-ai site ${commandTarget} --mcp-check --strict --json`,
    mcpCheckProbesHumanOut: probeCommands.mcpCheckProbesHumanOut,
    mcpCheckProbesJsonOut: probeCommands.mcpCheckProbesJsonOut,
    mcpPlanProbesJsonOut: probeCommands.mcpPlanProbesJsonOut,
    tasks: `design-ai site ${commandTarget} --tasks --out website-workspace.tasks.json`,
    implementationPrompt: `design-ai site ${commandTarget} --prompt codex-implementation --task 1 --out codex-implementation.md`,
    handoffReport: `design-ai site ${commandTarget} --report --out website-handoff.md`,
  };
  const executionSequence = [
    "Fix every blocking item before target-repo implementation handoff.",
    "Resolve warnings that affect the next selected refactor task, or mark the MCP unused when it is intentionally out of scope.",
    "Re-run the strict readiness gate and keep the JSON output with the handoff package.",
    "Generate or refresh starter tasks, then export the selected Codex implementation prompt.",
    "Run target-repo lint/typecheck/build plus desktop, tablet, mobile, keyboard, and screen-reader verification after implementation.",
  ];
  const boundaries = [
    "This plan is deterministic and local.",
    "It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.",
    "Run the generated Codex/Claude prompts in the target website workflow after this readiness plan is clean.",
  ];

  return {
    kind: "website-improvement-mcp-action-plan",
    version: 1,
    filePath,
    status: report.status,
    workspaceStatus: report.workspaceStatus,
    site: report.site,
    counts: report.counts,
    readinessMatrix: report.items,
    probes: report.probes || null,
    blockingItems: blockingIssues,
    warnings: warningIssues,
    taskAlignment,
    taskGaps: report.taskGaps,
    workspaceIssues: report.workspaceIssues,
    nextActions: report.nextActions,
    executionSequence,
    commands,
    boundaries,
    externalCalls: false,
    targetRepoMutation: false,
  };
}

export function formatSiteMcpActionPlanJson(plan) {
  return JSON.stringify(plan, null, 2);
}

export function buildSiteMcpActionPlan(workspace, summary = {}, options = {}) {
  const plan = buildSiteMcpActionPlanData(workspace, summary, options);

  return [
    `# Website improvement MCP action plan: ${plan.site.name}`,
    "",
    "## Summary",
    `- Source: ${plan.filePath}`,
    `- Status: ${plan.status}`,
    `- Workspace status: ${plan.workspaceStatus}`,
    `- Live URL: ${plan.site.liveUrl || "not provided"}`,
    `- Repo: ${plan.site.repoUrl || plan.site.localPath || "not provided"}`,
    `- Ready MCP: ${plan.counts.ready}/${plan.counts.total}`,
    `- Missing MCP: ${plan.counts.missing}`,
    `- Task/MCP gaps: ${plan.counts.taskGaps}`,
    "",
    "## Readiness Matrix",
    markdownTable(
      ["MCP", "Requested", "State", "Level", "Evidence"],
      plan.readinessMatrix.map((item) => [
        item.label,
        item.requestedStatus,
        item.state,
        item.level,
        item.evidence.length ? item.evidence.join("; ") : "none",
      ]),
    ),
    ...(plan.probes ? [
      "",
      "## Read-Only Probes",
      "",
      `- Probe status: ${plan.probes.status}`,
      `- Mode: ${plan.probes.mode}`,
      `- External calls: ${plan.probes.externalCalls ? "yes" : "no"}`,
      "",
      markdownTable(
        ["Probe", "MCP", "Level", "Result", "Evidence", "Next Action"],
        plan.probes.items.map((item) => [
          item.label,
          item.key,
          item.level,
          item.passed ? "pass" : "needs attention",
          item.evidence.length ? item.evidence.join("; ") : "none",
          item.actions.length ? item.actions.join(" ") : "none",
        ]),
      ),
    ] : []),
    "",
    "## Blocking Items",
    markdownList(plan.blockingItems, "No blocking readiness issues."),
    "",
    "## Warnings",
    markdownList(plan.warnings, "No optional readiness or task/MCP warnings."),
    "",
    "## Task/MCP Alignment",
    markdownTable(
      ["Task", "Priority / impact", "Recommended MCP", "Readiness state"],
      plan.taskAlignment.map((item) => [
        item.task,
        item.priorityImpact,
        item.recommendedMcp,
        item.readinessState,
      ]),
    ),
    "",
    "## Execution Sequence",
    ...plan.executionSequence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Commands",
    ...Object.values(plan.commands).map((command) => `- \`${command}\``),
    "",
    "## Boundaries",
    ...plan.boundaries.map((boundary) => `- ${boundary}`),
  ].join("\n");
}
