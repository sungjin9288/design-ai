// Read-only learning signal registry and agent backlog report payload builders.

import path from "node:path";

import {
  auditLearningProfile,
  defaultLearningFile,
  defaultLearningUsageFile,
  learningStats,
  learningUsageStats,
  loadLearningProfile,
} from "./learn.mjs";
import {
  buildAgentBacklogActionPlan,
  buildAgentDevelopmentBacklog,
} from "./signals-backlog.mjs";
import {
  defaultLearningEvalReportPath,
  resolveSignalFiles,
  summarizeEvalSignals,
  summarizeSignalEvalFile,
} from "./signals-eval.mjs";
import { buildLearningSignalReadiness } from "./signals-readiness.mjs";
import {
  commandFromArgs,
  countBy,
  previewText,
  worstStatus,
} from "./signals-shared.mjs";
import { collectWorkspaceReport, defaultLearningEvalPath } from "./workspace.mjs";

export function summarizeCheckCapture(profile) {
  const entries = (profile.entries || []).filter((entry) => String(entry.source || "").startsWith("check:"));
  const sorted = [...entries].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return {
    count: entries.length,
    categoryCounts: countBy(entries, (entry) => entry.category || "other"),
    sourceCounts: countBy(entries, (entry) => entry.source || "check:artifact"),
    latestEntries: sorted.slice(0, 5).map((entry) => ({
      id: entry.id,
      category: entry.category,
      source: entry.source,
      createdAt: entry.createdAt || "",
      textPreview: previewText(entry.text),
    })),
  };
}

export function summarizeWorkspace(report) {
  const nextActions = Array.isArray(report?.nextActions) ? report.nextActions : [];
  const actionCounts = countBy(nextActions, (item) => item.level || "info");
  return {
    root: report?.context?.root || "",
    version: report?.context?.version || "",
    git: {
      isRepo: Boolean(report?.git?.isRepo),
      branch: report?.git?.branch || "",
      clean: Boolean(report?.git?.clean),
      ahead: Number.isInteger(report?.git?.ahead) ? report.git.ahead : 0,
      behind: Number.isInteger(report?.git?.behind) ? report.git.behind : 0,
    },
    repository: {
      status: report?.repository?.status || "",
      canonical: Boolean(report?.repository?.canonical),
    },
    learning: {
      status: report?.learning?.readiness?.status || report?.learning?.auditSummary?.status || "",
      reason: report?.learning?.readiness?.reason || "",
    },
    learningUsage: report?.learningUsage?.readiness || null,
    learningEval: report?.learningEval?.freshness || report?.learningEval?.readiness || null,
    nextActionCounts: actionCounts,
    nextActionCount: nextActions.length,
  };
}

export function buildRecommendations({ audit, usage, evals, checkCapture, workspace }) {
  const recommendations = [];
  if (!audit.exists) {
    recommendations.push({
      level: "info",
      text: "Initialize or import a local learning profile before treating signal registry output as complete.",
    });
  } else if (audit.summary.failures > 0) {
    recommendations.push({
      level: "fail",
      text: "Fix learning profile audit failures before using local learning signals as release evidence.",
    });
  } else if (audit.summary.warnings > 0) {
    recommendations.push({
      level: "warn",
      text: "Review learning profile audit warnings before promoting learned preferences.",
    });
  }

  if (!usage.exists || usage.eventCount === 0) {
    recommendations.push({
      level: "info",
      text: "Run prompt or pack with --with-learning to create usage signals for selected learning entries.",
    });
  }
  if (usage.staleSelectedEntryCount > 0) {
    recommendations.push({
      level: "warn",
      text: "Usage sidecar references learning entry ids that are no longer active.",
    });
  }
  if (evals.files.length === 0) {
    recommendations.push({
      level: "warn",
      text: "No route/prompt/pack/learning eval signal files were found; generate eval reports before relying on this registry as a gate.",
    });
  }
  if (evals.failed > 0) {
    recommendations.push({
      level: "fail",
      text: "At least one eval signal report failed; inspect the failing checkpoint before continuing agent development.",
    });
  }
  if (evals.templates > 0) {
    recommendations.push({
      level: "warn",
      text: "Some eval signals are templates rather than executed reports; replay them with --eval --strict for stronger evidence.",
    });
  }
  if (checkCapture.count === 0) {
    recommendations.push({
      level: "info",
      text: "No check learning capture entries are present yet; run check --learn --yes on real warnings/failures when appropriate.",
    });
  }
  if (workspace.nextActionCounts.fail > 0 || workspace.nextActionCounts.warn > 0) {
    recommendations.push({
      level: workspace.nextActionCounts.fail > 0 ? "fail" : "warn",
      text: "Workspace readiness has unresolved next actions; review workspace output before using signals as release evidence.",
    });
  }
  return recommendations;
}

export function learningSignalRegistry({
  filePath = defaultLearningFile(),
  usageFile = "",
  signalSource = "",
  root = process.cwd(),
  now = new Date(),
  workspaceReportProvider = collectWorkspaceReport,
  learningStatsProvider = learningStats,
  learningUsageStatsProvider = learningUsageStats,
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedUsageFile = path.resolve(usageFile || defaultLearningUsageFile(resolvedFile));
  const profile = loadLearningProfile(resolvedFile);
  const audit = auditLearningProfile({ filePath: resolvedFile });
  const stats = learningStatsProvider({ filePath: resolvedFile });
  const usage = learningUsageStatsProvider({
    filePath: resolvedFile,
    usageFile: resolvedUsageFile,
  });
  const signalFiles = resolveSignalFiles({
    signalSource,
    root,
    extraFiles: [defaultLearningEvalPath(resolvedFile), defaultLearningEvalReportPath(resolvedFile)],
  });
  const evalFiles = signalFiles.map((file) => summarizeSignalEvalFile(file));
  const evalSignalSummary = summarizeEvalSignals(evalFiles);
  const evalSummary = {
    source: signalSource ? path.resolve(signalSource) : path.resolve(root),
    count: evalFiles.length,
    reports: evalSignalSummary.reports,
    templates: evalSignalSummary.templates,
    rawTemplates: evalSignalSummary.rawTemplates,
    templateFiles: evalSignalSummary.templateFiles,
    failed: evalSignalSummary.failed,
    warned: evalSignalSummary.warned,
    passed: evalSignalSummary.passed,
    files: evalFiles,
  };
  const workspaceReport = workspaceReportProvider({
    root,
    learningFilePath: resolvedFile,
    learningUsagePath: resolvedUsageFile,
  });
  const workspace = summarizeWorkspace(workspaceReport);
  const checkCapture = summarizeCheckCapture(profile);
  const recommendations = buildRecommendations({
    audit,
    usage,
    evals: evalSummary,
    checkCapture,
    workspace,
  });
  const agentDevelopment = buildAgentDevelopmentBacklog({
    audit,
    usage,
    evals: evalSummary,
    checkCapture,
    workspace,
    filePath: resolvedFile,
    usageFile: resolvedUsageFile,
    signalSource: evalSummary.source,
  });
  const status = worstStatus([
    audit.summary.failures > 0 ? "fail" : "",
    audit.summary.warnings > 0 ? "warn" : "",
    usage.staleSelectedEntryCount > 0 ? "warn" : "",
    evalSummary.failed > 0 ? "fail" : "",
    evalSummary.warned > 0 || evalSummary.templates > 0 || evalSummary.count === 0 ? "warn" : "",
    workspace.nextActionCounts.fail > 0 ? "fail" : "",
    workspace.nextActionCounts.warn > 0 ? "warn" : "",
    "pass",
  ]);
  const readiness = buildLearningSignalReadiness({
    audit,
    usage,
    evals: evalSummary,
    checkCapture,
    workspace,
    agentDevelopment,
    status,
  });

  return {
    version: 1,
    generatedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
    status,
    file: resolvedFile,
    signalSource: evalSummary.source,
    learning: {
      exists: audit.exists,
      version: audit.version,
      updatedAt: audit.updatedAt,
      count: audit.count,
      categoryCounts: audit.categoryCounts,
      sourceCounts: stats.sourceCounts || {},
      auditSummary: audit.summary,
    },
    usage: {
      usageFile: usage.usageFile,
      exists: usage.exists,
      eventCount: usage.eventCount,
      usedEntryCount: usage.usedEntryCount,
      unusedEntryCount: usage.unusedEntryCount,
      staleSelectedEntryCount: usage.staleSelectedEntryCount,
      commandCounts: usage.commandCounts,
      routeCounts: usage.routeCounts,
      latestEvent: usage.latestEvent || null,
      privacy: usage.privacy,
    },
    evals: evalSummary,
    checkCapture,
    workspace,
    agentDevelopment,
    readiness,
    recommendations,
    privacy: {
      mutatesProfile: false,
      storesRawBriefText: false,
      exposesEntryTextPreview: true,
      readsSignalFilesOnly: true,
    },
  };
}

export function agentBacklogReport({
  filePath = defaultLearningFile(),
  usageFile = "",
  signalSource = "",
  root = process.cwd(),
  now = new Date(),
  signalRegistryProvider = learningSignalRegistry,
} = {}) {
  const registry = signalRegistryProvider({
    filePath,
    usageFile,
    signalSource,
    root,
    now,
  });
  const agentDevelopment = registry.agentDevelopment || {
    status: "unknown",
    actionCount: 0,
    p0Count: 0,
    p1Count: 0,
    p2Count: 0,
    p3Count: 0,
    actions: [],
    privacy: {
      mutatesProfile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      storesRawBriefText: false,
    },
  };
  const actions = Array.isArray(agentDevelopment.actions) ? agentDevelopment.actions : [];
  const signalsJsonArgs = [
    "design-ai",
    "learn",
    "--signals",
    "--from-file",
    registry.signalSource || ".",
    "--file",
    registry.file || filePath,
    "--usage-file",
    registry.usage?.usageFile || usageFile || defaultLearningUsageFile(path.resolve(filePath)),
    "--json",
  ];
  const signalsReportArgs = [
    "design-ai",
    "learn",
    "--signals",
    "--from-file",
    registry.signalSource || ".",
    "--file",
    registry.file || filePath,
    "--usage-file",
    registry.usage?.usageFile || usageFile || defaultLearningUsageFile(path.resolve(filePath)),
    "--report",
    "--out",
    "learning-signals.md",
  ];
  const agentBacklogJsonArgs = [
    "design-ai",
    "learn",
    "--agent-backlog",
    "--from-file",
    registry.signalSource || ".",
    "--file",
    registry.file || filePath,
    "--usage-file",
    registry.usage?.usageFile || usageFile || defaultLearningUsageFile(path.resolve(filePath)),
    "--strict",
    "--json",
  ];
  const commands = {
    signalsJson: commandFromArgs(signalsJsonArgs),
    signalsJsonArgs,
    signalsReport: commandFromArgs(signalsReportArgs),
    signalsReportArgs,
    agentBacklogJson: commandFromArgs(agentBacklogJsonArgs),
    agentBacklogJsonArgs,
  };
  const privacy = {
    mutatesProfile: false,
    mutatesSkillFiles: false,
    callsExternalAiApis: false,
    storesRawBriefText: false,
    readsSignalFilesOnly: true,
  };
  return {
    version: 1,
    generatedAt: registry.generatedAt || (now instanceof Date ? now : new Date(now)).toISOString(),
    status: agentDevelopment.status || "unknown",
    signalStatus: registry.status || "unknown",
    file: registry.file || path.resolve(filePath),
    usageFile: registry.usage?.usageFile || path.resolve(usageFile || defaultLearningUsageFile(path.resolve(filePath))),
    signalSource: registry.signalSource || (signalSource ? path.resolve(signalSource) : path.resolve(root)),
    counts: {
      actions: agentDevelopment.actionCount ?? actions.length,
      p0: agentDevelopment.p0Count ?? 0,
      p1: agentDevelopment.p1Count ?? 0,
      p2: agentDevelopment.p2Count ?? 0,
      p3: agentDevelopment.p3Count ?? 0,
      learningEntries: registry.learning?.count ?? 0,
      usageEvents: registry.usage?.eventCount ?? 0,
      evalSignals: registry.evals?.count ?? 0,
      checkCaptures: registry.checkCapture?.count ?? 0,
      workspaceNextActions: registry.workspace?.nextActionCount ?? 0,
    },
    actions,
    actionPlan: buildAgentBacklogActionPlan({ actions, commands, privacy }),
    readiness: registry.readiness || null,
    commands,
    recommendations: registry.recommendations || [],
    privacy,
  };
}
