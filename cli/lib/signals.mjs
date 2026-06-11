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

function yesNo(value) {
  return value ? "yes" : "no";
}

function listItem(label, value) {
  return `- ${label}: ${value}`;
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

function classifyAgentBacklogCommand(command = "") {
  const text = String(command || "");
  const detectedFlags = [];
  if (/\s--out(?:\s|=|$)/.test(text)) detectedFlags.push("--out");
  if (/\s--yes(?:\s|$)/.test(text)) detectedFlags.push("--yes");
  if (/\s--fix(?:\s|$)/.test(text)) detectedFlags.push("--fix");
  if (/\s--force(?:\s|$)/.test(text)) detectedFlags.push("--force");
  const outputTargets = extractAgentBacklogFlagTargets(text, "--out");
  const profileTargets = [
    ...extractAgentBacklogFlagTargets(text, "--file"),
    ...extractAgentBacklogFlagTargets(text, "--learning-file"),
  ];
  const usageTargets = extractAgentBacklogFlagTargets(text, "--usage-file");
  const mutationFlags = detectedFlags.filter((flag) => flag === "--yes" || flag === "--fix" || flag === "--force");
  const writesLocalFiles = detectedFlags.includes("--out");
  const mutatesLocalState = detectedFlags.some((flag) => flag === "--yes" || flag === "--fix");
  const level = mutatesLocalState ? "mutates-local-state" : writesLocalFiles ? "writes-local-file" : "read-only";
  const reason = mutatesLocalState
    ? "Command includes an apply/fix flag that can mutate local state."
    : writesLocalFiles
      ? "Command writes an explicit local output file."
      : "Command is preview/report oriented and has no detected mutation flags.";
  return {
    level,
    writesLocalFiles,
    mutatesLocalState,
    requiresCleanWorkspace: writesLocalFiles || mutatesLocalState,
    detectedFlags,
    outputTargets,
    profileTargets,
    usageTargets,
    mutationFlags,
    reason,
  };
}

function extractAgentBacklogFlagTargets(command = "", flag = "") {
  if (!flag) return [];
  const escaped = flag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|\\s)${escaped}(?:=|\\s+)(?:"([^"]+)"|'([^']+)'|(\\S+))`, "g");
  const targets = [];
  let match = pattern.exec(command);
  while (match) {
    const value = match[1] || match[2] || match[3] || "";
    if (value) targets.push({ flag, value });
    match = pattern.exec(command);
  }
  return targets;
}

function summarizeAgentBacklogCommandSafety(steps = []) {
  const summary = {
    total: steps.length,
    readOnly: 0,
    writesLocalFile: 0,
    mutatesLocalState: 0,
    requiresCleanWorkspace: 0,
    requiresReviewBeforeMutation: 0,
  };
  for (const step of steps) {
    const safety = step.commandSafety && typeof step.commandSafety === "object" ? step.commandSafety : {};
    if (safety.level === "read-only") summary.readOnly += 1;
    if (safety.level === "writes-local-file") summary.writesLocalFile += 1;
    if (safety.level === "mutates-local-state") summary.mutatesLocalState += 1;
    if (safety.requiresCleanWorkspace) summary.requiresCleanWorkspace += 1;
    if (step.requiresReviewBeforeMutation) summary.requiresReviewBeforeMutation += 1;
  }
  return summary;
}

function agentBacklogRunPolicyForSafetyLevel(safetyLevel = "unknown") {
  if (safetyLevel === "read-only") return "preview-only";
  if (safetyLevel === "writes-local-file") return "review-before-file-write";
  if (safetyLevel === "mutates-local-state") return "review-before-mutation";
  return "manual-review";
}

function buildAgentBacklogCommandEffects(commandSafety = {}) {
  const outputTargets = Array.isArray(commandSafety.outputTargets) ? commandSafety.outputTargets : [];
  const profileTargets = Array.isArray(commandSafety.profileTargets) ? commandSafety.profileTargets : [];
  const usageTargets = Array.isArray(commandSafety.usageTargets) ? commandSafety.usageTargets : [];
  const mutationFlags = Array.isArray(commandSafety.mutationFlags) ? commandSafety.mutationFlags : [];
  const detectedFlags = Array.isArray(commandSafety.detectedFlags) ? commandSafety.detectedFlags : [];
  return {
    writesLocalFiles: Boolean(commandSafety.writesLocalFiles),
    mutatesLocalState: Boolean(commandSafety.mutatesLocalState),
    requiresCleanWorkspace: Boolean(commandSafety.requiresCleanWorkspace),
    detectedFlags,
    mutationFlags,
    outputTargets,
    profileTargets,
    usageTargets,
    reviewReason: commandSafety.reason || "",
  };
}

function summarizeAgentBacklogCommandEffects(effects = {}) {
  const parts = [];
  const outputTargets = Array.isArray(effects.outputTargets) ? effects.outputTargets : [];
  const profileTargets = Array.isArray(effects.profileTargets) ? effects.profileTargets : [];
  const usageTargets = Array.isArray(effects.usageTargets) ? effects.usageTargets : [];
  const mutationFlags = Array.isArray(effects.mutationFlags) ? effects.mutationFlags : [];
  if (outputTargets.length > 0) parts.push(`out ${outputTargets.map((item) => item.value).join(", ")}`);
  if (profileTargets.length > 0) parts.push(`profile ${profileTargets.map((item) => item.value).join(", ")}`);
  if (usageTargets.length > 0) parts.push(`usage ${usageTargets.map((item) => item.value).join(", ")}`);
  if (mutationFlags.length > 0) parts.push(`flags ${mutationFlags.join(", ")}`);
  if (parts.length > 0) return parts.join("; ");
  if (effects.mutatesLocalState) return "implicit local mutation target";
  if (effects.writesLocalFiles) return "local file write target";
  return "read-only";
}

function uniqueAgentBacklogTargets(targets = []) {
  const seen = new Set();
  const unique = [];
  for (const target of targets) {
    if (!target || typeof target !== "object") continue;
    const flag = String(target.flag || "");
    const value = String(target.value || "");
    if (!flag || !value) continue;
    const key = `${flag}\n${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ flag, value });
  }
  return unique;
}

function uniqueAgentBacklogFlags(flags = []) {
  return [...new Set(flags.filter(Boolean).map((flag) => String(flag)))];
}

function summarizeAgentBacklogCommandEffectManifest(commandManifest = []) {
  const effects = commandManifest
    .map((item) => (item && typeof item.commandEffects === "object" ? item.commandEffects : {}));
  const outputTargets = uniqueAgentBacklogTargets(effects.flatMap((item) => (
    Array.isArray(item.outputTargets) ? item.outputTargets : []
  )));
  const profileTargets = uniqueAgentBacklogTargets(effects.flatMap((item) => (
    Array.isArray(item.profileTargets) ? item.profileTargets : []
  )));
  const usageTargets = uniqueAgentBacklogTargets(effects.flatMap((item) => (
    Array.isArray(item.usageTargets) ? item.usageTargets : []
  )));
  const mutationFlags = uniqueAgentBacklogFlags(effects.flatMap((item) => (
    Array.isArray(item.mutationFlags) ? item.mutationFlags : []
  )));
  return {
    totalCommands: commandManifest.length,
    writesLocalFileCount: effects.filter((item) => item.writesLocalFiles).length,
    mutatesLocalStateCount: effects.filter((item) => item.mutatesLocalState).length,
    requiresCleanWorkspaceCount: effects.filter((item) => item.requiresCleanWorkspace).length,
    outputTargetCount: outputTargets.length,
    profileTargetCount: profileTargets.length,
    usageTargetCount: usageTargets.length,
    mutationFlagCount: mutationFlags.length,
    outputTargets,
    profileTargets,
    usageTargets,
    mutationFlags,
  };
}

function buildAgentBacklogCommandEffectReview(summary = {}) {
  const hasMutation = Number(summary.mutatesLocalStateCount || 0) > 0 || Number(summary.mutationFlagCount || 0) > 0;
  const hasFileWrite = Number(summary.writesLocalFileCount || 0) > 0 || Number(summary.outputTargetCount || 0) > 0;
  const hasProfileOrUsage = Number(summary.profileTargetCount || 0) > 0 || Number(summary.usageTargetCount || 0) > 0;
  const checklist = [];
  if (hasMutation) {
    checklist.push("Review mutation flags and run in a clean workspace before applying.");
  }
  if (hasFileWrite) {
    checklist.push("Inspect explicit output targets before committing generated files.");
  }
  if (hasProfileOrUsage) {
    checklist.push("Confirm learning profile and usage sidecar targets are intentional.");
  }
  if (checklist.length === 0) {
    checklist.push("No command target or mutation flag exposure detected.");
  }
  const level = hasMutation
    ? "mutation-review"
    : hasFileWrite || hasProfileOrUsage
      ? "target-review"
      : "clear";
  const headline = level === "mutation-review"
    ? "Mutation-capable commands require operator review before execution."
    : level === "target-review"
      ? "Command targets are explicit and should be reviewed before file changes."
      : "No command target or mutation flag exposure detected.";
  return {
    level,
    requiresOperatorReview: level !== "clear",
    headline,
    checklist,
  };
}

function buildAgentBacklogExecutionQueue(steps = []) {
  const toQueueItem = (step) => {
    const commandSafety = step.commandSafety && typeof step.commandSafety === "object" ? step.commandSafety : {};
    const safetyLevel = commandSafety.level || "unknown";
    const commandEffects = buildAgentBacklogCommandEffects(commandSafety);
    return {
      rank: step.rank,
      actionId: step.actionId || "",
      priority: step.priority || "p3",
      category: step.category || "other",
      title: step.title || "",
      command: step.command || "",
      safetyLevel,
      runPolicy: agentBacklogRunPolicyForSafetyLevel(safetyLevel),
      commandEffects,
      requiresReviewBeforeMutation: Boolean(step.requiresReviewBeforeMutation),
    };
  };
  const preview = steps.filter((step) => step.commandSafety?.level === "read-only").map(toQueueItem);
  const fileWriteReview = steps.filter((step) => step.commandSafety?.level === "writes-local-file").map(toQueueItem);
  const mutationReview = steps.filter((step) => step.commandSafety?.level === "mutates-local-state").map(toQueueItem);
  const ordered = [...preview, ...fileWriteReview, ...mutationReview];
  const commandManifest = ordered
    .filter((item) => item.command)
    .map((item) => ({
      rank: item.rank,
      actionId: item.actionId,
      command: item.command,
      safetyLevel: item.safetyLevel,
      runPolicy: item.runPolicy,
      commandEffects: item.commandEffects,
      requiresReviewBeforeMutation: item.requiresReviewBeforeMutation,
    }));
  const commandEffectSummary = summarizeAgentBacklogCommandEffectManifest(commandManifest);
  const commandEffectReview = buildAgentBacklogCommandEffectReview(commandEffectSummary);
  return {
    orderedCount: ordered.length,
    commandManifestCount: commandManifest.length,
    previewCount: preview.length,
    fileWriteReviewCount: fileWriteReview.length,
    mutationReviewCount: mutationReview.length,
    nextActionId: ordered[0]?.actionId || "",
    nextCommand: ordered.find((item) => item.command)?.command || "",
    nextCommandRunPolicy: commandManifest[0]?.runPolicy || "",
    commandEffectSummary,
    commandEffectReview,
    ordered,
    commandManifest,
    preview,
    fileWriteReview,
    mutationReview,
  };
}

function buildAgentBacklogActionPlan({ actions = [], commands = {}, privacy = {} } = {}) {
  const steps = actions.map((action, index) => {
    const command = String(action.command || "");
    const commandSafety = classifyAgentBacklogCommand(command);
    return {
      rank: action.rank ?? index + 1,
      actionId: action.id || "",
      priority: action.priority || "p3",
      category: action.category || "other",
      title: action.title || "",
      command,
      expectedOutcome: action.rationale || "",
      verification: command
        ? commandSafety.requiresCleanWorkspace
          ? [
            "Run the command in a clean working tree or disposable workspace, then inspect generated or changed files before committing.",
            "Re-run `design-ai learn --agent-backlog --strict --json` after the step to confirm the backlog status improved.",
          ]
          : [
            "Run the command and inspect the preview/report output before applying any follow-up changes.",
            "Re-run `design-ai learn --agent-backlog --strict --json` after the step to confirm the backlog status improved.",
          ]
        : [
          "Review the action manually, then refresh the agent backlog report.",
        ],
      requiresReviewBeforeMutation: commandSafety.requiresCleanWorkspace,
      commandSafety,
    };
  });
  const safetySummary = summarizeAgentBacklogCommandSafety(steps);
  const executionQueue = buildAgentBacklogExecutionQueue(steps);
  const verification = [
    commands.signalsJson
      ? {
        label: "Refresh signal registry JSON",
        command: commands.signalsJson,
      }
      : null,
    commands.signalsReport
      ? {
        label: "Save signal registry Markdown handoff",
        command: commands.signalsReport,
      }
      : null,
    {
      label: "Gate focused agent backlog",
      command: "design-ai learn --agent-backlog --strict --json",
    },
  ].filter(Boolean);

  return {
    version: 1,
    stepCount: steps.length,
    nextStep: steps[0] || null,
    steps,
    safetySummary,
    executionQueue,
    verification,
    boundaries: {
      reportMutatesProfile: Boolean(privacy.mutatesProfile),
      reportMutatesSkillFiles: Boolean(privacy.mutatesSkillFiles),
      reportCallsExternalAiApis: Boolean(privacy.callsExternalAiApis),
      generatedFromLocalSignals: true,
    },
  };
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
  const commands = {
    signalsJson: `design-ai learn --signals --from-file ${shellQuote(registry.signalSource || ".")} --file ${shellQuote(registry.file || filePath)} --usage-file ${shellQuote(registry.usage?.usageFile || usageFile || defaultLearningUsageFile(path.resolve(filePath)))} --json`,
    signalsReport: `design-ai learn --signals --from-file ${shellQuote(registry.signalSource || ".")} --file ${shellQuote(registry.file || filePath)} --usage-file ${shellQuote(registry.usage?.usageFile || usageFile || defaultLearningUsageFile(path.resolve(filePath)))} --report --out learning-signals.md`,
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
    commands,
    recommendations: registry.recommendations || [],
    privacy,
  };
}

export function renderAgentBacklogReport(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const counts = payload.counts || {};
  const actions = Array.isArray(payload.actions) ? payload.actions : [];
  const lines = [
    "# Agent Development Backlog Report",
    "",
    listItem("Generated", generatedAtText),
    listItem("Status", payload.status || "unknown"),
    listItem("Signal status", payload.signalStatus || "unknown"),
    listItem("Learning file", payload.file || ""),
    listItem("Usage file", payload.usageFile || ""),
    listItem("Signal source", payload.signalSource || ""),
    "",
    "## Summary",
    "",
    listItem("Actions", counts.actions ?? actions.length),
    listItem("P0", counts.p0 ?? 0),
    listItem("P1", counts.p1 ?? 0),
    listItem("P2", counts.p2 ?? 0),
    listItem("P3", counts.p3 ?? 0),
    listItem("Learning entries", counts.learningEntries ?? 0),
    listItem("Usage events", counts.usageEvents ?? 0),
    listItem("Eval signals", counts.evalSignals ?? 0),
    listItem("Check captures", counts.checkCaptures ?? 0),
    listItem("Workspace next actions", counts.workspaceNextActions ?? 0),
    "",
    "## Backlog Actions",
    "",
  ];

  if (actions.length === 0) {
    lines.push("No agent development backlog actions emitted.");
  } else {
    for (const action of actions) {
      lines.push(`### ${action.rank}. ${action.title}`);
      lines.push("");
      lines.push(listItem("Id", action.id));
      lines.push(listItem("Priority", action.priority));
      lines.push(listItem("Category", action.category));
      lines.push(listItem("Rationale", action.rationale));
      if (action.command) {
        lines.push("");
        lines.push("Command:");
        lines.push("");
        lines.push("```bash");
        lines.push(action.command);
        lines.push("```");
      }
      const evidence = action.evidence && typeof action.evidence === "object" ? action.evidence : {};
      const evidenceItems = Object.entries(evidence);
      if (evidenceItems.length > 0) {
        lines.push("");
        lines.push("Evidence:");
        for (const [key, value] of evidenceItems) {
          const rendered = typeof value === "object" ? JSON.stringify(value) : String(value);
          lines.push(`- ${key}: ${rendered}`);
        }
      }
      lines.push("");
    }
  }

  const actionPlan = payload.actionPlan || {};
  const planSteps = Array.isArray(actionPlan.steps) ? actionPlan.steps : [];
  lines.push("## Action Plan", "");
  const safetySummary = actionPlan.safetySummary && typeof actionPlan.safetySummary === "object" ? actionPlan.safetySummary : null;
  if (safetySummary) {
    lines.push("Safety summary:");
    lines.push(`- Read-only: ${safetySummary.readOnly ?? 0}`);
    lines.push(`- Writes local file: ${safetySummary.writesLocalFile ?? 0}`);
    lines.push(`- Mutates local state: ${safetySummary.mutatesLocalState ?? 0}`);
    lines.push(`- Requires clean workspace: ${safetySummary.requiresCleanWorkspace ?? 0}`);
    lines.push(`- Requires mutation review: ${safetySummary.requiresReviewBeforeMutation ?? 0}`);
    lines.push("");
  }
  const executionQueue = actionPlan.executionQueue && typeof actionPlan.executionQueue === "object" ? actionPlan.executionQueue : null;
  if (executionQueue) {
    lines.push("Execution queue:");
    lines.push(`- Preview/read-only commands: ${executionQueue.previewCount ?? 0}`);
    lines.push(`- Local file-write review commands: ${executionQueue.fileWriteReviewCount ?? 0}`);
    lines.push(`- Local mutation review commands: ${executionQueue.mutationReviewCount ?? 0}`);
    lines.push(`- Ordered commands: ${executionQueue.orderedCount ?? 0}`);
    lines.push(`- Command manifest entries: ${executionQueue.commandManifestCount ?? 0}`);
    const commandEffectSummary = executionQueue.commandEffectSummary && typeof executionQueue.commandEffectSummary === "object"
      ? executionQueue.commandEffectSummary
      : null;
    if (commandEffectSummary) {
      lines.push(`- Command effect targets: output ${commandEffectSummary.outputTargetCount ?? 0}, profile ${commandEffectSummary.profileTargetCount ?? 0}, usage ${commandEffectSummary.usageTargetCount ?? 0}, mutation flags ${commandEffectSummary.mutationFlagCount ?? 0}`);
    }
    const commandEffectReview = executionQueue.commandEffectReview && typeof executionQueue.commandEffectReview === "object"
      ? executionQueue.commandEffectReview
      : null;
    if (commandEffectReview?.headline) {
      lines.push(`- Command effect review: ${commandEffectReview.headline}`);
      const reviewChecklist = Array.isArray(commandEffectReview.checklist) ? commandEffectReview.checklist : [];
      for (const item of reviewChecklist) {
        lines.push(`  - ${item}`);
      }
    }
    if (executionQueue.nextActionId) lines.push(`- Recommended next action: ${executionQueue.nextActionId}`);
    if (executionQueue.nextCommandRunPolicy) lines.push(`- Recommended next command policy: ${executionQueue.nextCommandRunPolicy}`);
    if (executionQueue.nextCommand) {
      lines.push("");
      lines.push("Recommended next command:");
      lines.push("");
      lines.push("```bash");
      lines.push(executionQueue.nextCommand);
      lines.push("```");
    }
    const orderedItems = Array.isArray(executionQueue.ordered) ? executionQueue.ordered : [];
    if (orderedItems.length > 0) {
      lines.push("");
      lines.push("Queue order:");
      for (const item of orderedItems) {
        lines.push(`${item.rank}. ${item.actionId || "unknown-action"} (${item.safetyLevel || "unknown"}, ${item.runPolicy || "manual-review"})`);
      }
    }
    const commandManifest = Array.isArray(executionQueue.commandManifest) ? executionQueue.commandManifest : [];
    if (commandManifest.length > 0) {
      lines.push("");
      lines.push("Command manifest:");
      for (const item of commandManifest) {
        lines.push(`${item.rank}. ${item.actionId || "unknown-action"} - ${item.runPolicy || "manual-review"} (${summarizeAgentBacklogCommandEffects(item.commandEffects)})`);
      }
    }
    lines.push("");
  }
  if (planSteps.length === 0) {
    lines.push("No execution steps emitted.");
  } else {
    for (const step of planSteps) {
      lines.push(`### Step ${step.rank}. ${step.title}`);
      lines.push("");
      lines.push(listItem("Action id", step.actionId));
      lines.push(listItem("Priority", step.priority));
      lines.push(listItem("Category", step.category));
      const commandSafety = step.commandSafety && typeof step.commandSafety === "object" ? step.commandSafety : {};
      lines.push(listItem("Command safety", commandSafety.level || "unknown"));
      lines.push(listItem("Writes local files", yesNo(Boolean(commandSafety.writesLocalFiles))));
      lines.push(listItem("Mutates local state", yesNo(Boolean(commandSafety.mutatesLocalState))));
      lines.push(listItem("Requires mutation review", yesNo(Boolean(step.requiresReviewBeforeMutation))));
      if (commandSafety.reason) lines.push(listItem("Safety reason", commandSafety.reason));
      if (step.expectedOutcome) lines.push(listItem("Expected outcome", step.expectedOutcome));
      if (step.command) {
        lines.push("");
        lines.push("Command:");
        lines.push("");
        lines.push("```bash");
        lines.push(step.command);
        lines.push("```");
      }
      const verification = Array.isArray(step.verification) ? step.verification : [];
      if (verification.length > 0) {
        lines.push("");
        lines.push("Verification:");
        for (const item of verification) {
          lines.push(`- ${item}`);
        }
      }
      lines.push("");
    }
  }

  const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];
  lines.push("## Recommendations", "");
  if (recommendations.length === 0) {
    lines.push("No recommendations emitted.");
  } else {
    for (const recommendation of recommendations) {
      lines.push(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  const commands = payload.commands || {};
  lines.push("", "## Follow-Up Commands", "");
  if (commands.signalsJson) {
    lines.push("Signal registry JSON:");
    lines.push("");
    lines.push("```bash");
    lines.push(commands.signalsJson);
    lines.push("```");
    lines.push("");
  }
  if (commands.signalsReport) {
    lines.push("Signal registry Markdown:");
    lines.push("");
    lines.push("```bash");
    lines.push(commands.signalsReport);
    lines.push("```");
    lines.push("");
  }

  const privacy = payload.privacy || {};
  lines.push("## Privacy And Boundaries", "");
  lines.push(listItem("Mutates learning profile", yesNo(Boolean(privacy.mutatesProfile))));
  lines.push(listItem("Mutates skill files", yesNo(Boolean(privacy.mutatesSkillFiles))));
  lines.push(listItem("Calls external AI APIs", yesNo(Boolean(privacy.callsExternalAiApis))));
  lines.push(listItem("Stores raw brief text", yesNo(Boolean(privacy.storesRawBriefText))));
  lines.push(listItem("Reads signal files only", yesNo(Boolean(privacy.readsSignalFilesOnly))));
  lines.push("", "This report is read-only evidence; it does not mutate learning profiles, usage sidecars, eval files, skill files, or target repositories.");

  return `${lines.join("\n")}\n`;
}

export function renderLearningSignalReport(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const learning = payload.learning || {};
  const usage = payload.usage || {};
  const evals = payload.evals || {};
  const workspace = payload.workspace || {};
  const agentDevelopment = payload.agentDevelopment || {};
  const lines = [
    "# Learning Signal Registry Report",
    "",
    listItem("Generated", generatedAtText),
    listItem("Status", payload.status || "unknown"),
    listItem("Learning file", payload.file || ""),
    listItem("Signal source", payload.signalSource || ""),
    "",
    "## Learning Profile",
    "",
    listItem("Exists", yesNo(Boolean(learning.exists))),
    listItem("Version", learning.version ?? ""),
    listItem("Updated at", learning.updatedAt || ""),
    listItem("Entries", learning.count ?? 0),
    listItem("Audit status", learning.auditSummary?.status || "unknown"),
    listItem("Audit failures", learning.auditSummary?.failures ?? 0),
    listItem("Audit warnings", learning.auditSummary?.warnings ?? 0),
    "",
    "## Usage Signals",
    "",
    listItem("Usage file", usage.usageFile || ""),
    listItem("Exists", yesNo(Boolean(usage.exists))),
    listItem("Events", usage.eventCount ?? 0),
    listItem("Used entries", usage.usedEntryCount ?? 0),
    listItem("Unused entries", usage.unusedEntryCount ?? 0),
    listItem("Stale selected ids", usage.staleSelectedEntryCount ?? 0),
    listItem("Stores raw brief text", yesNo(Boolean(usage.privacy?.storesRawBriefText))),
    "",
    "## Eval Signals",
    "",
    listItem("Source", evals.source || ""),
    listItem("Files", evals.count ?? 0),
    listItem("Reports", evals.reports ?? 0),
    listItem("Templates", evals.templates ?? 0),
    listItem("Passed", evals.passed ?? 0),
    listItem("Warned", evals.warned ?? 0),
    listItem("Failed", evals.failed ?? 0),
  ];

  const evalFiles = Array.isArray(evals.files) ? evals.files : [];
  if (evalFiles.length > 0) {
    lines.push("", "Eval files:");
    for (const item of evalFiles) {
      const counts = item.shape === "report"
        ? ` pass ${item.passed} / warn ${item.warned} / fail ${item.failed}`
        : `${item.caseCount} case(s)`;
      lines.push(`- \`${item.file}\`: ${item.kind} ${item.shape} ${item.status} (${counts})`);
      if (item.error) lines.push(`  - ${item.error}`);
    }
  }

  const latestCaptures = Array.isArray(payload.checkCapture?.latestEntries)
    ? payload.checkCapture.latestEntries
    : [];
  lines.push("", "## Check Capture", "");
  lines.push(listItem("Entries", payload.checkCapture?.count ?? 0));
  if (latestCaptures.length > 0) {
    lines.push("", "Recent captures:");
    for (const entry of latestCaptures) {
      lines.push(`- \`${entry.id}\` [${entry.category}] ${entry.source}`);
      if (entry.textPreview) lines.push(`  - ${entry.textPreview}`);
    }
  }

  lines.push("", "## Workspace Readiness", "");
  lines.push(listItem("Root", workspace.root || ""));
  lines.push(listItem("Branch", workspace.git?.branch || "unknown"));
  lines.push(listItem("Clean", yesNo(Boolean(workspace.git?.clean))));
  lines.push(listItem("Repository status", workspace.repository?.status || "unknown"));
  lines.push(listItem("Learning status", workspace.learning?.status || "unknown"));
  lines.push(listItem("Usage status", workspace.learningUsage?.status || "unknown"));
  lines.push(listItem("Eval status", workspace.learningEval?.status || "not checked"));
  lines.push(listItem("Next actions", workspace.nextActionCount ?? 0));

  const actions = Array.isArray(agentDevelopment.actions) ? agentDevelopment.actions : [];
  lines.push("", "## Agent Development Backlog", "");
  lines.push(listItem("Status", agentDevelopment.status || "unknown"));
  lines.push(listItem("Actions", agentDevelopment.actionCount ?? actions.length));
  lines.push(listItem("P0", agentDevelopment.p0Count ?? 0));
  lines.push(listItem("P1", agentDevelopment.p1Count ?? 0));
  lines.push(listItem("P2", agentDevelopment.p2Count ?? 0));
  lines.push(listItem("P3", agentDevelopment.p3Count ?? 0));
  if (actions.length > 0) {
    lines.push("");
    for (const action of actions) {
      lines.push(`### ${action.rank}. ${action.title}`);
      lines.push("");
      lines.push(listItem("Id", action.id));
      lines.push(listItem("Priority", action.priority));
      lines.push(listItem("Category", action.category));
      lines.push(listItem("Rationale", action.rationale));
      if (action.command) {
        lines.push("");
        lines.push("Command:");
        lines.push("");
        lines.push("```bash");
        lines.push(action.command);
        lines.push("```");
      }
      lines.push("");
    }
  }

  const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];
  lines.push("## Recommendations", "");
  if (recommendations.length === 0) {
    lines.push("No recommendations emitted.");
  } else {
    for (const recommendation of recommendations) {
      lines.push(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  const privacy = payload.privacy || {};
  lines.push("", "## Privacy And Boundaries", "");
  lines.push(listItem("Mutates learning profile", yesNo(Boolean(privacy.mutatesProfile))));
  lines.push(listItem("Stores raw brief text", yesNo(Boolean(privacy.storesRawBriefText))));
  lines.push(listItem("Reads signal files only", yesNo(Boolean(privacy.readsSignalFilesOnly))));
  lines.push(listItem("External AI APIs", "no"));
  lines.push("", "This report is read-only evidence; it does not mutate learning profiles, usage sidecars, eval files, skill files, or target repositories.");

  return `${lines.join("\n")}\n`;
}
