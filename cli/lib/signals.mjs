// Read-only learning signal registry for local AI/agent development loops.

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  auditLearningProfile,
  defaultLearningFile,
  defaultLearningUsageFile,
  learningStats,
  learningUsageStats,
  loadLearningProfile,
} from "./learn.mjs";
import { collectWorkspaceReport } from "./workspace.mjs";

export const DEFAULT_SIGNAL_EVAL_FILES = [
  "route-eval.json",
  "route-eval-report.json",
  "prompt-eval.json",
  "prompt-eval-report.json",
  "pack-eval.json",
  "pack-eval-report.json",
  "learning-eval.json",
  "learning-eval-report.json",
];

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function previewText(text, maxLength = 120) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

function statusRank(status) {
  if (status === "fail") return 3;
  if (status === "warn" || status === "missing") return 2;
  if (status === "template" || status === "unknown") return 1;
  return 0;
}

function worstStatus(statuses, fallback = "pass") {
  return [...statuses].sort((a, b) => statusRank(b) - statusRank(a))[0] || fallback;
}

function shellQuote(value) {
  const text = String(value || "");
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function inferSignalKind(payload, filePath = "") {
  const sourceName = path.basename(filePath).toLowerCase();
  const cases = Array.isArray(payload?.cases) ? payload.cases : [];

  if (sourceName.includes("route")) return "route-eval";
  if (sourceName.includes("prompt")) return "prompt-eval";
  if (sourceName.includes("pack")) return "pack-eval";
  if (sourceName.includes("learning")) return "learning-eval";

  if (payload?.sourceRouteVersion) return "route-eval";
  if (payload?.sourcePromptVersion) return "prompt-eval";
  if (payload?.sourcePackVersion) return "pack-eval";
  if (payload?.sourceProfile) return "learning-eval";
  if (cases.some((item) => item && typeof item === "object" && "topRouteId" in item)) return "route-eval";
  if (cases.some((item) => item && typeof item === "object" && "missingPromptFragments" in item)) return "prompt-eval";
  if (cases.some((item) => item && typeof item === "object" && ("contextStatus" in item || "pack" in item))) return "pack-eval";
  if (cases.some((item) => item && typeof item === "object" && ("selectedEntryIds" in item || "expectedSelectedIds" in item))) return "learning-eval";

  return "unknown-eval";
}

function summarizeCaseCounts(payload) {
  const summary = payload?.summary && typeof payload.summary === "object" ? payload.summary : null;
  const cases = Array.isArray(payload?.cases) ? payload.cases : [];
  if (summary) {
    return {
      caseCount: Number.isInteger(summary.total) ? summary.total : cases.length,
      passed: Number.isInteger(summary.pass) ? summary.pass : 0,
      warned: Number.isInteger(summary.warn) ? summary.warn : 0,
      failed: Number.isInteger(summary.fail) ? summary.fail : 0,
    };
  }

  return {
    caseCount: cases.length,
    passed: cases.filter((item) => item?.status === "pass").length,
    warned: cases.filter((item) => item?.status === "warn").length,
    failed: cases.filter((item) => item?.status === "fail").length,
  };
}

export function summarizeSignalEvalFile(filePath) {
  const resolvedFile = path.resolve(filePath);
  if (!existsSync(resolvedFile)) {
    return {
      file: resolvedFile,
      exists: false,
      kind: inferSignalKind(null, resolvedFile),
      shape: "missing",
      status: "missing",
      caseCount: 0,
      passed: 0,
      warned: 0,
      failed: 0,
      generatedAt: "",
      error: "",
    };
  }

  let payload = null;
  try {
    payload = JSON.parse(readFileSync(resolvedFile, "utf8"));
  } catch {
    return {
      file: resolvedFile,
      exists: true,
      kind: inferSignalKind(null, resolvedFile),
      shape: "invalid-json",
      status: "fail",
      caseCount: 0,
      passed: 0,
      warned: 0,
      failed: 0,
      generatedAt: "",
      error: "Signal eval file is not valid JSON.",
    };
  }

  const hasCases = Array.isArray(payload?.cases);
  const isReport = typeof payload?.status === "string" || Boolean(payload?.summary);
  const counts = summarizeCaseCounts(payload);
  const status = isReport
    ? String(payload.status || worstStatus([
      counts.failed > 0 ? "fail" : "",
      counts.warned > 0 ? "warn" : "",
      "pass",
    ])).trim()
    : "template";

  return {
    file: resolvedFile,
    exists: true,
    kind: inferSignalKind(payload, resolvedFile),
    shape: isReport ? "report" : "template",
    status: hasCases ? status : "fail",
    caseCount: counts.caseCount,
    passed: counts.passed,
    warned: counts.warned,
    failed: counts.failed,
    generatedAt: String(payload?.generatedAt || ""),
    error: hasCases ? "" : "Signal eval file must include a cases array.",
  };
}

function resolveSignalFiles({ signalSource = "", root = process.cwd() } = {}) {
  const resolvedSource = signalSource ? path.resolve(signalSource) : path.resolve(root);
  if (existsSync(resolvedSource) && statSync(resolvedSource).isDirectory()) {
    return DEFAULT_SIGNAL_EVAL_FILES
      .map((fileName) => path.join(resolvedSource, fileName))
      .filter((filePath) => existsSync(filePath));
  }
  if (signalSource) return [resolvedSource];
  return [];
}

function summarizeCheckCapture(profile) {
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

function summarizeWorkspace(report) {
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

function buildRecommendations({ audit, usage, evals, checkCapture, workspace }) {
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

function agentAction({
  id,
  priority,
  category,
  title,
  rationale,
  command = "",
  evidence = {},
}) {
  return {
    id,
    priority,
    category,
    title,
    rationale,
    command,
    evidence,
  };
}

function agentDevelopmentStatus(actions) {
  if ((actions || []).some((item) => item.priority === "p0")) return "fail";
  if ((actions || []).some((item) => item.priority === "p1")) return "warn";
  return "pass";
}

function buildAgentDevelopmentBacklog({
  audit,
  usage,
  evals,
  checkCapture,
  workspace,
  filePath,
  usageFile,
  signalSource,
}) {
  const actions = [];
  const fileArg = shellQuote(filePath);
  const usageArg = shellQuote(usageFile);
  const signalArg = shellQuote(signalSource || ".");

  if (!audit.exists) {
    actions.push(agentAction({
      id: "agent-learning-profile-init",
      priority: "p1",
      category: "learning-profile",
      title: "Initialize the local learning profile before agent development review.",
      rationale: "Signal registry output is incomplete until a profile exists.",
      command: `design-ai learn --init --file ${fileArg}`,
      evidence: {
        profileExists: false,
      },
    }));
  } else if (audit.summary.failures > 0) {
    actions.push(agentAction({
      id: "agent-learning-profile-audit-fix",
      priority: "p0",
      category: "learning-profile",
      title: "Fix learning profile audit failures before using signals as a development gate.",
      rationale: "Audit failures can make learned context selection and downstream signal summaries unreliable.",
      command: `design-ai learn --audit --file ${fileArg}`,
      evidence: {
        failures: audit.summary.failures,
        warnings: audit.summary.warnings,
      },
    }));
  } else if (audit.summary.warnings > 0) {
    actions.push(agentAction({
      id: "agent-learning-profile-audit-review",
      priority: "p1",
      category: "learning-profile",
      title: "Review learning profile audit warnings before promoting agent behavior.",
      rationale: "Warnings are not blockers, but they should be resolved before treating local learning as release evidence.",
      command: `design-ai learn --audit --file ${fileArg}`,
      evidence: {
        warnings: audit.summary.warnings,
      },
    }));
  }

  if (!usage.exists || usage.eventCount === 0) {
    actions.push(agentAction({
      id: "agent-learning-usage-record",
      priority: "p2",
      category: "usage-signals",
      title: "Record prompt or pack usage with learning enabled.",
      rationale: "Usage sidecar events show which learned entries actually affect agent prompts without storing raw brief text.",
      command: "design-ai prompt \"audit a design artifact\" --with-learning --json",
      evidence: {
        usageExists: Boolean(usage.exists),
        eventCount: usage.eventCount || 0,
      },
    }));
  }
  if (usage.staleSelectedEntryCount > 0) {
    actions.push(agentAction({
      id: "agent-learning-usage-stale-review",
      priority: "p1",
      category: "usage-signals",
      title: "Review stale selected learning ids in the usage sidecar.",
      rationale: "Stale ids indicate usage evidence is no longer aligned with the active profile.",
      command: `design-ai learn --usage --file ${fileArg} --usage-file ${usageArg}`,
      evidence: {
        staleSelectedEntryCount: usage.staleSelectedEntryCount,
      },
    }));
  }

  if (evals.files.length === 0) {
    actions.push(agentAction({
      id: "agent-eval-checkpoint-generate",
      priority: "p1",
      category: "eval-harness",
      title: "Generate and run route, prompt, pack, or learning eval checkpoints.",
      rationale: "Agent development needs replayable checkpoints before signal registry output can act as a gate.",
      command: `design-ai learn --eval-template --file ${fileArg} --json --out learning-eval.json`,
      evidence: {
        evalSignalCount: 0,
      },
    }));
  }
  if (evals.failed > 0) {
    actions.push(agentAction({
      id: "agent-eval-failure-review",
      priority: "p0",
      category: "eval-harness",
      title: "Fix failing eval signal reports before continuing agent development.",
      rationale: "Failed checkpoints are the strongest deterministic signal that route, prompt, pack, or learning behavior drifted.",
      command: `design-ai learn --signals --from-file ${signalArg} --file ${fileArg} --usage-file ${usageArg} --json`,
      evidence: {
        failed: evals.failed,
        warned: evals.warned,
      },
    }));
  } else if (evals.templates > 0) {
    actions.push(agentAction({
      id: "agent-eval-template-replay",
      priority: "p1",
      category: "eval-harness",
      title: "Replay template-only eval signal files as executed reports.",
      rationale: "Templates are useful setup artifacts, but executed reports provide stronger evidence for agent behavior.",
      command: `design-ai learn --signals --from-file ${signalArg} --file ${fileArg} --usage-file ${usageArg} --json`,
      evidence: {
        templates: evals.templates,
      },
    }));
  }

  if (checkCapture.count > 0) {
    actions.push(agentAction({
      id: "agent-skill-proposal-preview",
      priority: "p2",
      category: "skill-evolution",
      title: "Preview skill instruction deltas from repeated check-capture signals.",
      rationale: "Captured warn/fail check results can become deterministic skill improvements without mutating skill files automatically.",
      command: `design-ai learn --propose-skills --from-file ${signalArg} --file ${fileArg} --usage-file ${usageArg} --json`,
      evidence: {
        checkCaptureCount: checkCapture.count,
        categoryCounts: checkCapture.categoryCounts,
      },
    }));
  } else {
    actions.push(agentAction({
      id: "agent-check-capture-seed",
      priority: "p3",
      category: "skill-evolution",
      title: "Seed check-capture learning from real warn/fail artifacts when appropriate.",
      rationale: "Skill evolution proposals need explicit local check captures before they can suggest durable instruction deltas.",
      command: "design-ai check artifact.md --learn --yes",
      evidence: {
        checkCaptureCount: 0,
      },
    }));
  }

  if (workspace.nextActionCounts.fail > 0 || workspace.nextActionCounts.warn > 0) {
    actions.push(agentAction({
      id: "agent-workspace-readiness-review",
      priority: workspace.nextActionCounts.fail > 0 ? "p0" : "p1",
      category: "workspace-readiness",
      title: "Resolve workspace readiness actions before treating agent development evidence as complete.",
      rationale: "Workspace readiness joins git, repository metadata, learning, usage, and eval freshness into the operator handoff gate.",
      command: `design-ai workspace --learning-file ${fileArg} --learning-usage ${usageArg} --strict --json`,
      evidence: {
        fail: workspace.nextActionCounts.fail || 0,
        warn: workspace.nextActionCounts.warn || 0,
        nextActionCount: workspace.nextActionCount || 0,
      },
    }));
  }

  const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
  const sortedActions = actions
    .sort((a, b) => (
      priorityOrder[a.priority] - priorityOrder[b.priority]
      || a.category.localeCompare(b.category)
      || a.id.localeCompare(b.id)
    ))
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  return {
    status: agentDevelopmentStatus(sortedActions),
    actionCount: sortedActions.length,
    p0Count: sortedActions.filter((item) => item.priority === "p0").length,
    p1Count: sortedActions.filter((item) => item.priority === "p1").length,
    p2Count: sortedActions.filter((item) => item.priority === "p2").length,
    p3Count: sortedActions.filter((item) => item.priority === "p3").length,
    actions: sortedActions,
    privacy: {
      mutatesProfile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      storesRawBriefText: false,
    },
  };
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
  const signalFiles = resolveSignalFiles({ signalSource, root });
  const evalFiles = signalFiles.map((file) => summarizeSignalEvalFile(file));
  const evalSummary = {
    source: signalSource ? path.resolve(signalSource) : path.resolve(root),
    count: evalFiles.length,
    reports: evalFiles.filter((item) => item.shape === "report").length,
    templates: evalFiles.filter((item) => item.shape === "template").length,
    failed: evalFiles.filter((item) => item.status === "fail").length,
    warned: evalFiles.filter((item) => item.status === "warn").length,
    passed: evalFiles.filter((item) => item.status === "pass").length,
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
    recommendations,
    privacy: {
      mutatesProfile: false,
      storesRawBriefText: false,
      exposesEntryTextPreview: true,
      readsSignalFilesOnly: true,
    },
  };
}
