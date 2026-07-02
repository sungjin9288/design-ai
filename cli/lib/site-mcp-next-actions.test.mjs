// Tests for site MCP readiness checks, next actions, and action plans.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSiteWorkspace,
  buildSiteMcpActionPlan,
  buildSiteMcpActionPlanData,
  buildSiteMcpCheckReport,
  buildSiteMcpProbeReport,
  buildSiteNextActionsReport,
  createSampleSiteWorkspace,
  formatSiteMcpActionPlanJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
} from "./site.mjs";

test("buildSiteMcpCheckReport summarizes evidence and task/MCP gaps", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const report = buildSiteMcpCheckReport(workspace, summary);
  const json = JSON.parse(formatSiteMcpCheckJson(report));
  const human = formatSiteMcpCheckHuman(report);

  assert.equal(report.status, "pass");
  assert.equal(report.counts.required, 3);
  assert.equal(report.counts.ready, 9);
  assert.equal(report.counts.missing, 0);
  assert.equal(report.items[0].key, "github");
  assert.equal(report.items[0].state, "ready");
  assert.deepEqual(report.taskGaps, []);
  assert.deepEqual(Object.keys(json), [
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "items",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
  ]);
  assert.match(human, /Website Improvement MCP readiness/);
  assert.match(human, /GitHub \(required\) -> ready/);
  assert.match(human, /Task MCP gaps:\n- none/);
  assert.doesNotMatch(human, /Probe commands:/);

  const gapWorkspace = {
    ...workspace,
    mcpReadiness: {
      ...workspace.mcpReadiness,
      figma: "unused",
    },
  };
  const gapReport = buildSiteMcpCheckReport(gapWorkspace, analyzeSiteWorkspace(gapWorkspace, { filePath: "gap.json" }).summary);
  assert.equal(gapReport.status, "warn");
  assert.equal(gapReport.counts.taskGaps, 1);
  assert.match(gapReport.taskGaps[0].message, /recommends figma/);

  const missingRequiredWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "",
      localPath: "",
    },
  };
  const missingReport = buildSiteMcpCheckReport(
    missingRequiredWorkspace,
    analyzeSiteWorkspace(missingRequiredWorkspace, { filePath: "missing.json" }).summary,
  );
  assert.equal(missingReport.status, "fail");
  assert.equal(missingReport.items[0].level, "fail");
  assert.match(missingReport.nextActions.join("\n"), /siteProfile\.repoUrl/);
});

test("buildSiteMcpCheckReport can include read-only MCP probes without changing default JSON shape", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const defaultReport = buildSiteMcpCheckReport(workspace, summary);
  const probeReport = buildSiteMcpCheckReport(workspace, summary, { probes: true });
  const probeJson = JSON.parse(formatSiteMcpCheckJson(probeReport));
  const standaloneProbeReport = buildSiteMcpProbeReport(workspace);
  const human = formatSiteMcpCheckHuman(probeReport);

  assert.equal(Object.hasOwn(defaultReport, "probes"), false);
  assert.equal(Object.hasOwn(defaultReport, "commands"), false);
  assert.equal(probeReport.status, "pass");
  assert.equal(probeReport.probes.status, "pass");
  assert.equal(probeReport.probes.externalCalls, false);
  assert.equal(probeReport.probes.mode, "read-only-local");
  assert.equal(probeReport.probes.count, 4);
  assert.equal(probeReport.probes.pass, 4);
  assert.deepEqual(probeReport.probes.items.map((item) => item.id), [
    "github-repo-reference",
    "figma-url-reference",
    "browser-smoke-target",
    "deploy-provider-reference",
  ]);
  assert.deepEqual(Object.keys(probeJson), [
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "items",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
    "probes",
    "commands",
  ]);
  assert.equal(
    probeJson.commands.mcpCheckProbesHumanOut,
    "design-ai site sample.json --mcp-check --probes --out mcp-check-probes.txt",
  );
  assert.equal(
    probeJson.commands.mcpCheckProbesJsonOut,
    "design-ai site sample.json --mcp-check --probes --json --out mcp-check-probes.json",
  );
  assert.equal(
    probeJson.commands.mcpPlanProbesJson,
    "design-ai site sample.json --mcp-plan --probes --json",
  );
  assert.equal(
    probeJson.commands.mcpPlanProbesJsonOut,
    "design-ai site sample.json --mcp-plan --probes --json --out mcp-action-plan-probes.json",
  );
  assert.equal(standaloneProbeReport.status, "pass");
  assert.match(human, /Read-only probes:/);
  assert.match(human, /GitHub repo reference/);
  assert.match(human, /Probe commands:/);
  assert.match(human, /Save readiness probe report: `design-ai site sample\.json --mcp-check --probes --out mcp-check-probes\.txt`/);
  assert.match(human, /Save readiness probe JSON: `design-ai site sample\.json --mcp-check --probes --json --out mcp-check-probes\.json`/);
  assert.match(human, /Generate probe action plan JSON: `design-ai site sample\.json --mcp-plan --probes --json`/);
  assert.match(human, /Save probe action plan JSON: `design-ai site sample\.json --mcp-plan --probes --json --out mcp-action-plan-probes\.json`/);

  const missingProbeWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "https://example.com/not-github",
      localPath: "/definitely/not/a/repo",
      figmaUrl: "not-a-figma-url",
      liveUrl: "",
      deployProvider: "none",
    },
  };
  const missingProbeReport = buildSiteMcpCheckReport(
    missingProbeWorkspace,
    analyzeSiteWorkspace(missingProbeWorkspace, { filePath: "missing-probes.json" }).summary,
    { probes: true },
  );
  assert.equal(missingProbeReport.status, "fail");
  assert.equal(missingProbeReport.probes.fail, 3);
  assert.equal(missingProbeReport.probes.warn, 1);
  assert.match(missingProbeReport.nextActions.join("\n"), /Probe github-repo-reference/);
});

test("buildSiteNextActionsReport ranks local operator actions", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const report = buildSiteNextActionsReport(workspace, summary);
  const json = JSON.parse(formatSiteNextActionsJson(report));
  const human = formatSiteNextActionsHuman(report);

  assert.equal(report.kind, "website-improvement-next-actions");
  assert.equal(report.version, 1);
  assert.equal(report.status, "pass");
  assert.equal(report.workspaceStatus, "pass");
  assert.equal(report.mcpStatus, "pass");
  assert.equal(report.mcpProbeStatus, "pass");
  assert.deepEqual(report.mcpProbeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.equal(report.externalCalls, false);
  assert.equal(report.targetRepoMutation, false);
  assert.equal(report.counts.blocking, 0);
  assert.equal(report.counts.tasks, 1);
  assert.equal(report.counts.probeGaps, 0);
  assert.deepEqual(report.actions.map((action) => action.rank), [1, 2, 3]);
  assert.deepEqual(report.commands, {
    summary: "design-ai site sample.json --json",
    mcpCheck: "design-ai site sample.json --mcp-check --strict --json",
    mcpPlan: "design-ai site sample.json --mcp-plan --out mcp-action-plan.md",
    mcpCheckProbes: "design-ai site sample.json --mcp-check --probes --json --out mcp-check-probes.json",
    mcpPlanProbes: "design-ai site sample.json --mcp-plan --probes --json --out mcp-action-plan-probes.json",
    tasks: "design-ai site sample.json --tasks --out website-workspace.tasks.json",
    implementationPrompt: "design-ai site sample.json --prompt codex-implementation --task 1 --out codex-implementation.md",
    handoffReport: "design-ai site sample.json --report --out website-handoff.md",
    handoffBundle: "design-ai site sample.json --bundle --out website-handoff-bundle",
  });
  assert.deepEqual(json.commands, report.commands);

  const stdinSummary = analyzeSiteWorkspace(workspace, { filePath: "stdin" }).summary;
  const stdinReport = buildSiteNextActionsReport(workspace, stdinSummary);
  const stdinJson = JSON.parse(formatSiteNextActionsJson(stdinReport));
  assert.equal(stdinReport.filePath, "stdin");
  assert.deepEqual(stdinReport.commands, {
    summary: "design-ai site <workspace.json> --json",
    mcpCheck: "design-ai site <workspace.json> --mcp-check --strict --json",
    mcpPlan: "design-ai site <workspace.json> --mcp-plan --out mcp-action-plan.md",
    mcpCheckProbes: "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json",
    mcpPlanProbes: "design-ai site <workspace.json> --mcp-plan --probes --json --out mcp-action-plan-probes.json",
    tasks: "design-ai site <workspace.json> --tasks --out website-workspace.tasks.json",
    implementationPrompt: "design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md",
    handoffReport: "design-ai site <workspace.json> --report --out website-handoff.md",
    handoffBundle: "design-ai site <workspace.json> --bundle --out website-handoff-bundle",
  });
  assert.deepEqual(stdinJson.commands, stdinReport.commands);

  const baseTask = workspace.refactorTasks[0];
  const priorityWorkspace = {
    ...workspace,
    refactorTasks: [
      baseTask,
      {
        ...baseTask,
        id: "task-secondary-content",
        title: "Tune secondary content proof",
        category: "content-quality",
        priority: "p2",
        recommendedMcp: ["research"],
      },
      {
        ...baseTask,
        id: "task-critical-accessibility",
        title: "Fix critical navigation accessibility",
        category: "accessibility",
        priority: "p0",
        recommendedMcp: ["browser"],
      },
      {
        ...baseTask,
        id: "task-later-polish",
        title: "Polish lower-priority page details",
        category: "visual-design",
        priority: "p3",
        recommendedMcp: ["browser"],
      },
    ],
  };
  const prioritySummary = analyzeSiteWorkspace(priorityWorkspace, { filePath: "priority.json" }).summary;
  const priorityReport = buildSiteNextActionsReport(priorityWorkspace, prioritySummary);
  assert.equal(priorityReport.counts.tasks, 4);
  assert.equal(priorityReport.topTasks.length, 3);
  assert.deepEqual(priorityReport.topTasks.map((task) => task.id), [
    "task-critical-accessibility",
    "task-homepage-cta",
    "task-secondary-content",
  ]);
  assert.equal(priorityReport.topTasks.some((task) => task.id === "task-later-polish"), false);
  assert.deepEqual(priorityReport.topTasks.map((task) => task.priority), ["p0", "p1", "p2"]);
  assert.equal(priorityReport.actions[0].severity, "implementation");
  assert.equal(priorityReport.actions[0].title, "Prepare Codex implementation prompt for task-critical-accessibility");
  assert.match(priorityReport.actions[0].reason, /highest-priority available refactor task/);

  assert.equal(report.actions[0].severity, "implementation");
  assert.equal(report.actions[0].command, "design-ai site sample.json --prompt codex-implementation --task 1 --out codex-implementation.md");
  const evidenceAction = report.actions.find((action) => action.title === "Create implementation evidence trail");
  assert.equal(evidenceAction?.severity, "handoff");
  assert.equal(evidenceAction?.command, "design-ai site sample.json --report --out website-handoff.md");
  assert.equal(report.actions.at(-1).command, "design-ai site sample.json --bundle --out website-handoff-bundle");
  assert.deepEqual(Object.keys(json), [
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
  ]);
  assert.match(human, /Website Improvement next actions: Korean SaaS marketing site/);
  assert.match(human, /MCP probe status: pass/);
  assert.match(human, /MCP probes: 4\/4 passing, 0 warning, 0 failing/);
  assert.match(human, /1\. \[implementation\] Prepare Codex implementation prompt/);
  assert.match(human, /Command: `design-ai site sample\.json --prompt codex-implementation --task 1 --out codex-implementation\.md`/);
  assert.match(human, /Create implementation evidence trail/);
  assert.match(human, /Command: `design-ai site sample\.json --report --out website-handoff\.md`/);
  assert.match(human, /does not call external MCPs, mutate the target website repo/);

  const evidenceReadyWorkspace = {
    ...workspace,
    implementationEvidence: {
      executedWork: ["Implemented homepage CTA hierarchy"],
      verificationResults: ["npm run build passed"],
      remainingRisks: [],
      nextActions: [],
    },
  };
  const evidenceReadySummary = analyzeSiteWorkspace(evidenceReadyWorkspace, { filePath: "evidence-ready.json" }).summary;
  const evidenceReadyReport = buildSiteNextActionsReport(evidenceReadyWorkspace, evidenceReadySummary);
  assert.equal(evidenceReadyReport.status, "pass");
  assert.equal(evidenceReadyReport.actions.some((action) => action.title === "Create implementation evidence trail"), false);
  assert.equal(evidenceReadyReport.actions[0].severity, "implementation");
  assert.equal(evidenceReadyReport.actions.at(-1).command, "design-ai site evidence-ready.json --bundle --out website-handoff-bundle");

  const optionalMissingWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      sentryProject: "",
    },
  };
  const optionalMissingSummary = analyzeSiteWorkspace(optionalMissingWorkspace, { filePath: "optional-missing.json" }).summary;
  const optionalMissingReport = buildSiteNextActionsReport(optionalMissingWorkspace, optionalMissingSummary);
  const optionalMissingHuman = formatSiteNextActionsHuman(optionalMissingReport);
  assert.equal(optionalMissingReport.status, "warn");
  assert.deepEqual(optionalMissingReport.actions.map((action) => action.rank), [1, 2, 3, 4]);
  assert.equal(optionalMissingReport.actions[0].severity, "warning");
  assert.equal(optionalMissingReport.actions[0].title, "Clarify optional MCP readiness: Sentry");
  assert.equal(optionalMissingReport.actions[0].command, "design-ai site optional-missing.json --mcp-plan --out mcp-action-plan.md");
  assert.match(optionalMissingReport.actions[0].reason, /siteProfile\.sentryProject/);
  assert.match(optionalMissingHuman, /1\. \[warning\] Clarify optional MCP readiness: Sentry/);
  assert.match(optionalMissingHuman, /Command: `design-ai site optional-missing\.json --mcp-plan --out mcp-action-plan\.md`/);

  const taskGapWorkspace = {
    ...workspace,
    mcpReadiness: {
      ...workspace.mcpReadiness,
      figma: "unused",
    },
  };
  const taskGapSummary = analyzeSiteWorkspace(taskGapWorkspace, { filePath: "task-gap.json" }).summary;
  const taskGapReport = buildSiteNextActionsReport(taskGapWorkspace, taskGapSummary);
  assert.equal(taskGapReport.status, "warn");
  assert.equal(taskGapReport.counts.taskGaps, 1);
  assert.equal(taskGapReport.actions[0].severity, "warning");
  assert.equal(taskGapReport.actions[0].title, "Align MCP status for task-homepage-cta");
  assert.equal(taskGapReport.actions[0].command, "design-ai site task-gap.json --mcp-plan --out mcp-action-plan.md");
  assert.deepEqual(taskGapReport.actions[0].references, ["task-homepage-cta", "figma"]);
  assert.match(taskGapReport.actions[0].reason, /recommends figma/);

  const probeGapWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "https://example.com/not-github",
      localPath: "/definitely/not/a/repo",
      figmaUrl: "not-a-figma-url",
    },
  };
  const probeGapSummary = analyzeSiteWorkspace(probeGapWorkspace, { filePath: "probe-gap.json" }).summary;
  const probeGapReport = buildSiteNextActionsReport(probeGapWorkspace, probeGapSummary);
  const probeGapHuman = formatSiteNextActionsHuman(probeGapReport);
  assert.equal(probeGapReport.status, "fail");
  assert.equal(probeGapReport.mcpStatus, "pass");
  assert.equal(probeGapReport.mcpProbeStatus, "fail");
  assert.deepEqual(probeGapReport.mcpProbeCounts, {
    count: 4,
    pass: 2,
    warn: 1,
    fail: 1,
  });
  assert.equal(probeGapReport.counts.probeGaps, 2);
  assert.deepEqual(probeGapReport.actions.map((action) => action.rank), [1, 2, 3, 4, 5]);
  assert.equal(probeGapReport.actions[0].severity, "blocking");
  assert.equal(probeGapReport.actions[0].title, "Resolve MCP probe readiness: GitHub repo reference");
  assert.equal(probeGapReport.actions[0].command, "design-ai site probe-gap.json --mcp-check --probes --json --out mcp-check-probes.json");
  assert.deepEqual(probeGapReport.actions[0].references, ["github-repo-reference", "github"]);
  assert.equal(probeGapReport.actions[1].severity, "warning");
  assert.equal(probeGapReport.actions[1].title, "Resolve MCP probe readiness: Figma file reference");
  assert.equal(probeGapReport.actions[1].command, "design-ai site probe-gap.json --mcp-plan --probes --json --out mcp-action-plan-probes.json");
  assert.deepEqual(probeGapReport.actions[1].references, ["figma-url-reference", "figma"]);
  assert.match(probeGapHuman, /MCP probe status: fail/);
  assert.match(probeGapHuman, /MCP probes: 2\/4 passing, 1 warning, 1 failing/);
  assert.match(probeGapHuman, /Resolve MCP probe readiness: GitHub repo reference/);
  assert.match(probeGapHuman, /Command: `design-ai site probe-gap\.json --mcp-check --probes --json --out mcp-check-probes\.json`/);

  const setupWorkspace = {
    ...workspace,
    refactorTasks: [],
  };
  const setupSummary = analyzeSiteWorkspace(setupWorkspace, { filePath: "setup.json" }).summary;
  const setupReport = buildSiteNextActionsReport(setupWorkspace, setupSummary);
  const setupHuman = formatSiteNextActionsHuman(setupReport);
  assert.equal(setupReport.status, "pass");
  assert.equal(setupReport.counts.tasks, 0);
  assert.deepEqual(setupReport.topTasks, []);
  assert.equal(setupReport.actions[0].severity, "setup");
  assert.equal(setupReport.actions[0].title, "Generate starter refactor tasks");
  assert.equal(setupReport.actions[0].command, "design-ai site setup.json --tasks --out website-workspace.tasks.json");
  assert.match(setupHuman, /1\. \[setup\] Generate starter refactor tasks/);
  assert.match(setupHuman, /Command: `design-ai site setup\.json --tasks --out website-workspace\.tasks\.json`/);

  const blockedWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "",
      localPath: "",
    },
  };
  const blockedSummary = analyzeSiteWorkspace(blockedWorkspace, { filePath: "blocked.json" }).summary;
  const blockedReport = buildSiteNextActionsReport(blockedWorkspace, blockedSummary);
  const blockedJson = JSON.parse(formatSiteNextActionsJson(blockedReport));
  const blockedHuman = formatSiteNextActionsHuman(blockedReport);
  assert.equal(blockedReport.status, "fail");
  assert.equal(blockedReport.counts.blocking, 2);
  assert.deepEqual(blockedReport.actions.map((action) => action.rank), blockedReport.actions.map((_, index) => index + 1));
  assert.equal(blockedReport.actions[0].rank, 1);
  assert.equal(blockedReport.actions[0].title, "Add required MCP readiness: GitHub");
  assert.match(blockedReport.actions[0].reason, /siteProfile\.repoUrl/);
  assert.equal(blockedJson.counts.requiredMcpMissing, 1);
  assert.equal(blockedJson.actions[0].severity, "blocking");
  assert.equal(blockedJson.actions[0].command, "design-ai site blocked.json --mcp-check --strict --json");
  assert.equal(blockedJson.actions[1].title, "Resolve MCP probe readiness: GitHub repo reference");
  assert.equal(blockedJson.actions[1].command, "design-ai site blocked.json --mcp-check --probes --json --out mcp-check-probes.json");
  assert.match(blockedHuman, /1\. \[blocking\] Add required MCP readiness: GitHub/);
  assert.match(blockedHuman, /Command: `design-ai site blocked\.json --mcp-check --strict --json`/);
  assert.match(blockedHuman, /2\. \[blocking\] Resolve MCP probe readiness: GitHub repo reference/);
});

test("buildSiteMcpActionPlan turns MCP readiness into Markdown execution guidance", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const data = buildSiteMcpActionPlanData(workspace, summary);
  const json = JSON.parse(formatSiteMcpActionPlanJson(data));
  const plan = buildSiteMcpActionPlan(workspace, summary);

  assert.equal(data.kind, "website-improvement-mcp-action-plan");
  assert.equal(data.version, 1);
  assert.equal(data.status, "pass");
  assert.equal(data.filePath, "sample.json");
  assert.equal(data.externalCalls, false);
  assert.equal(data.targetRepoMutation, false);
  assert.equal(data.readinessMatrix[0].key, "github");
  assert.equal(data.taskAlignment[0].task, "task-homepage-cta");
  assert.match(data.commands.mcpCheck, /design-ai site sample\.json --mcp-check --strict --json/);
  assert.equal(
    data.commands.mcpCheckProbesHumanOut,
    "design-ai site sample.json --mcp-check --probes --out mcp-check-probes.txt",
  );
  assert.equal(
    data.commands.mcpCheckProbesJsonOut,
    "design-ai site sample.json --mcp-check --probes --json --out mcp-check-probes.json",
  );
  assert.equal(
    data.commands.mcpPlanProbesJsonOut,
    "design-ai site sample.json --mcp-plan --probes --json --out mcp-action-plan-probes.json",
  );
  assert.deepEqual(Object.keys(json), [
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
  ]);
  assert.match(plan, /# Website improvement MCP action plan: Korean SaaS marketing site/);
  assert.match(plan, /## Readiness Matrix/);
  assert.match(plan, /\| GitHub \| required \| ready \| pass \|/);
  assert.match(plan, /## Blocking Items\n- No blocking readiness issues\./);
  assert.match(plan, /## Task\/MCP Alignment/);
  assert.match(plan, /task-homepage-cta/);
  assert.match(plan, /design-ai site sample\.json --mcp-check --strict --json/);
  assert.match(plan, /design-ai site sample\.json --mcp-check --probes --out mcp-check-probes\.txt/);
  assert.match(plan, /design-ai site sample\.json --mcp-check --probes --json --out mcp-check-probes\.json/);
  assert.match(plan, /design-ai site sample\.json --mcp-plan --probes --json --out mcp-action-plan-probes\.json/);
  assert.match(plan, /does not call external MCPs, mutate the target website repo/);

  const probePlan = buildSiteMcpActionPlan(workspace, summary, { probes: true });
  const probeJson = JSON.parse(formatSiteMcpActionPlanJson(buildSiteMcpActionPlanData(workspace, summary, { probes: true })));
  assert.equal(probeJson.probes.status, "pass");
  assert.equal(probeJson.probes.externalCalls, false);
  assert.equal(probeJson.probes.items[0].id, "github-repo-reference");
  assert.match(probePlan, /## Read-Only Probes/);
  assert.match(probePlan, /External calls: no/);
  assert.match(probePlan, /\| GitHub repo reference \| github \| pass \| pass \|/);

  const missingRequiredWorkspace = {
    ...workspace,
    siteProfile: {
      ...workspace.siteProfile,
      repoUrl: "",
      localPath: "",
    },
  };
  const missingPlan = buildSiteMcpActionPlan(
    missingRequiredWorkspace,
    analyzeSiteWorkspace(missingRequiredWorkspace, { filePath: "missing.json" }).summary,
  );
  assert.match(missingPlan, /Status: fail/);
  assert.match(missingPlan, /GitHub: Add siteProfile\.repoUrl or siteProfile\.localPath/);
});
