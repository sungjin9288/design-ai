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
import { collectWorkspaceReport, defaultLearningEvalPath } from "./workspace.mjs";

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

function commandFromArgs(args = []) {
  return args.map(shellQuote).join(" ");
}

function commandSpec(args = []) {
  const commandArgs = args.map((item) => String(item));
  return {
    commandArgs,
    command: commandFromArgs(commandArgs),
  };
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

function resolveSignalFiles({ signalSource = "", root = process.cwd(), extraFiles = [] } = {}) {
  const resolvedSource = signalSource ? path.resolve(signalSource) : path.resolve(root);
  const resolvedExtraFiles = (Array.isArray(extraFiles) ? extraFiles : [])
    .filter(Boolean)
    .map((filePath) => path.resolve(filePath))
    .filter((filePath) => existsSync(filePath));
  const uniqueFiles = (files = []) => [...new Set([...files, ...resolvedExtraFiles])];
  if (existsSync(resolvedSource) && statSync(resolvedSource).isDirectory()) {
    return uniqueFiles(DEFAULT_SIGNAL_EVAL_FILES
      .map((fileName) => path.join(resolvedSource, fileName))
      .filter((filePath) => existsSync(filePath)));
  }
  if (signalSource) return uniqueFiles([resolvedSource]);
  return uniqueFiles([]);
}

function evalReportPathForTemplate(filePath = "") {
  const resolvedFile = path.resolve(filePath);
  const dir = path.dirname(resolvedFile);
  const ext = path.extname(resolvedFile);
  const base = path.basename(resolvedFile, ext);
  if (base.endsWith("-report")) return resolvedFile;
  if (base.endsWith("-eval")) return path.join(dir, `${base}-report${ext || ".json"}`);
  return path.join(dir, `${base}-report${ext || ".json"}`);
}

function defaultLearningEvalReportPath(filePath = defaultLearningFile()) {
  return evalReportPathForTemplate(defaultLearningEvalPath(filePath));
}

function evalSignalEvidenceKey(file = {}) {
  return `${file.kind || "unknown-eval"}\n${path.dirname(file.file || "")}`;
}

function summarizeEvalSignals(evalFiles = []) {
  const reportKeys = new Set(
    evalFiles
      .filter((item) => item.shape === "report")
      .map((item) => evalSignalEvidenceKey(item)),
  );
  const unresolvedTemplates = evalFiles.filter((item) => (
    item.shape === "template" && !reportKeys.has(evalSignalEvidenceKey(item))
  ));
  return {
    reports: evalFiles.filter((item) => item.shape === "report").length,
    templates: unresolvedTemplates.length,
    rawTemplates: evalFiles.filter((item) => item.shape === "template").length,
    templateFiles: unresolvedTemplates,
    failed: evalFiles.filter((item) => item.status === "fail").length,
    warned: evalFiles.filter((item) => item.status === "warn").length,
    passed: evalFiles.filter((item) => item.status === "pass").length,
  };
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

function signalCheck({
  id,
  label,
  status,
  required,
  summary,
  evidence = {},
}) {
  return {
    id,
    label,
    status,
    required: Boolean(required),
    summary,
    evidence,
  };
}

function buildLearningSignalReadiness({
  audit,
  usage,
  evals,
  checkCapture,
  workspace,
  agentDevelopment,
  status,
}) {
  const profileStatus = !audit.exists
    ? "missing"
    : audit.summary.failures > 0
      ? "fail"
      : audit.summary.warnings > 0
        ? "warn"
        : "pass";
  const usageStatus = usage.staleSelectedEntryCount > 0
    ? "warn"
    : usage.exists && usage.eventCount > 0
      ? "pass"
      : "info";
  const evalStatus = evals.failed > 0
    ? "fail"
    : evals.warned > 0 || evals.templates > 0 || evals.count === 0
      ? "warn"
      : "pass";
  const checkCaptureStatus = checkCapture.count > 0 ? "pass" : "info";
  const workspaceStatus = workspace.nextActionCounts.fail > 0
    ? "fail"
    : workspace.nextActionCounts.warn > 0
      ? "warn"
      : "pass";
  const agentStatus = agentDevelopment.status || "unknown";
  const checks = [
    signalCheck({
      id: "learning-profile",
      label: "Learning profile",
      status: profileStatus,
      required: true,
      summary: audit.exists
        ? `Profile has ${audit.count} entries with ${audit.summary.failures} audit failure(s) and ${audit.summary.warnings} warning(s).`
        : "Learning profile is missing.",
      evidence: {
        exists: Boolean(audit.exists),
        entries: audit.count,
        failures: audit.summary.failures,
        warnings: audit.summary.warnings,
      },
    }),
    signalCheck({
      id: "usage-sidecar",
      label: "Usage sidecar",
      status: usageStatus,
      required: false,
      summary: usage.exists && usage.eventCount > 0
        ? `Usage sidecar has ${usage.eventCount} event(s) and ${usage.staleSelectedEntryCount} stale selected id(s).`
        : "Usage sidecar has no prompt/pack usage events yet.",
      evidence: {
        exists: Boolean(usage.exists),
        events: usage.eventCount,
        staleSelectedEntryCount: usage.staleSelectedEntryCount,
      },
    }),
    signalCheck({
      id: "eval-signals",
      label: "Eval signals",
      status: evalStatus,
      required: true,
      summary: evals.count > 0
        ? `Eval signals include ${evals.reports} report(s), ${evals.templates} unresolved template(s), ${evals.failed} failed report(s), and ${evals.warned} warned report(s).`
        : "No route, prompt, pack, or learning eval signal files were found.",
      evidence: {
        files: evals.count,
        reports: evals.reports,
        templates: evals.templates,
        failed: evals.failed,
        warned: evals.warned,
      },
    }),
    signalCheck({
      id: "check-capture",
      label: "Check learning capture",
      status: checkCaptureStatus,
      required: false,
      summary: checkCapture.count > 0
        ? `Profile includes ${checkCapture.count} check-capture learning entr${checkCapture.count === 1 ? "y" : "ies"}.`
        : "No check-capture entries are present; this is advisory until real warn/fail checks are captured.",
      evidence: {
        entries: checkCapture.count,
        categoryCounts: checkCapture.categoryCounts,
      },
    }),
    signalCheck({
      id: "workspace-readiness",
      label: "Workspace readiness",
      status: workspaceStatus,
      required: true,
      summary: `Workspace has ${workspace.nextActionCounts.fail || 0} fail action(s), ${workspace.nextActionCounts.warn || 0} warn action(s), and ${workspace.nextActionCount || 0} total next action(s).`,
      evidence: {
        fail: workspace.nextActionCounts.fail || 0,
        warn: workspace.nextActionCounts.warn || 0,
        nextActionCount: workspace.nextActionCount || 0,
      },
    }),
    signalCheck({
      id: "agent-development",
      label: "Agent development backlog",
      status: agentStatus,
      required: true,
      summary: `Agent backlog has ${agentDevelopment.actionCount || 0} action(s): ${agentDevelopment.p0Count || 0} P0, ${agentDevelopment.p1Count || 0} P1, ${agentDevelopment.p2Count || 0} P2, ${agentDevelopment.p3Count || 0} P3.`,
      evidence: {
        actions: agentDevelopment.actionCount || 0,
        p0: agentDevelopment.p0Count || 0,
        p1: agentDevelopment.p1Count || 0,
        p2: agentDevelopment.p2Count || 0,
        p3: agentDevelopment.p3Count || 0,
      },
    }),
  ];
  const requiredChecks = checks.filter((item) => item.required);
  const optionalChecks = checks.filter((item) => !item.required);
  const blockingChecks = requiredChecks.filter((item) => statusRank(item.status) >= statusRank("warn"));
  const optionalGaps = optionalChecks.filter((item) => item.status !== "pass");
  const requiredPassCount = requiredChecks.filter((item) => item.status === "pass").length;
  const summary = blockingChecks.length === 0
    ? optionalGaps.length === 0
      ? "Required and optional local learning signal surfaces are complete."
      : "Required local learning signal surfaces are ready; optional evidence gaps remain."
    : "Required local learning signal surfaces need review before this can be used as a gate.";

  return {
    version: 1,
    status,
    summary,
    requiredPassCount,
    requiredCount: requiredChecks.length,
    requiredReady: blockingChecks.length === 0,
    blockingCount: blockingChecks.length,
    optionalGapCount: optionalGaps.length,
    blockingChecks: blockingChecks.map((item) => item.id),
    optionalGaps: optionalGaps.map((item) => item.id),
    checks,
  };
}

function agentAction({
  id,
  priority,
  category,
  title,
  rationale,
  command = "",
  commandArgs = [],
  applyCommand = "",
  applyCommandArgs = [],
  evidence = {},
}) {
  const normalizedCommandArgs = Array.isArray(commandArgs) ? commandArgs.map((item) => String(item)) : [];
  const normalizedApplyCommandArgs = Array.isArray(applyCommandArgs) ? applyCommandArgs.map((item) => String(item)) : [];
  return {
    id,
    priority,
    category,
    title,
    rationale,
    command: command || (normalizedCommandArgs.length > 0 ? commandFromArgs(normalizedCommandArgs) : ""),
    commandArgs: normalizedCommandArgs,
    applyCommand: applyCommand || (normalizedApplyCommandArgs.length > 0 ? commandFromArgs(normalizedApplyCommandArgs) : ""),
    applyCommandArgs: normalizedApplyCommandArgs,
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
  if (/\s--with-learning(?:\s|$)/.test(text)) detectedFlags.push("--with-learning");
  const outputTargets = extractAgentBacklogFlagTargets(text, "--out");
  const profileTargets = [
    ...extractAgentBacklogFlagTargets(text, "--file"),
    ...extractAgentBacklogFlagTargets(text, "--learning-file"),
    ...extractAgentBacklogEnvTargets(text, "DESIGN_AI_LEARNING_FILE"),
  ];
  const usageTargets = [
    ...extractAgentBacklogFlagTargets(text, "--usage-file"),
    ...extractAgentBacklogFlagTargets(text, "--learning-usage"),
    ...extractAgentBacklogEnvTargets(text, "DESIGN_AI_LEARNING_USAGE_FILE"),
  ];
  const mutationFlags = detectedFlags.filter((flag) => flag === "--yes" || flag === "--fix" || flag === "--force" || flag === "--with-learning");
  const writesLocalFiles = detectedFlags.includes("--out");
  const mutatesLocalState = detectedFlags.some((flag) => flag === "--yes" || flag === "--fix" || flag === "--with-learning");
  const level = mutatesLocalState ? "mutates-local-state" : writesLocalFiles ? "writes-local-file" : "read-only";
  const reason = mutatesLocalState
    ? detectedFlags.includes("--with-learning")
      ? "Command records local learning usage sidecar metadata."
      : "Command includes an apply/fix flag that can mutate local state."
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

function extractAgentBacklogEnvTargets(command = "", name = "") {
  if (!name) return [];
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|\\s)${escaped}=(?:"([^"]+)"|'([^']+)'|(\\S+))`, "g");
  const targets = [];
  let match = pattern.exec(command);
  while (match) {
    const value = match[1] || match[2] || match[3] || "";
    if (value) targets.push({ flag: name, value });
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

function buildAgentBacklogCommandEffectReview(summary = {}, {
  refreshCommandArgs = ["design-ai", "learn", "--agent-backlog", "--strict", "--json"],
} = {}) {
  const hasMutation = Number(summary.mutatesLocalStateCount || 0) > 0 || Number(summary.mutationFlagCount || 0) > 0;
  const hasFileWrite = Number(summary.writesLocalFileCount || 0) > 0 || Number(summary.outputTargetCount || 0) > 0;
  const hasProfileOrUsage = Number(summary.profileTargetCount || 0) > 0 || Number(summary.usageTargetCount || 0) > 0;
  const hasCommand = Number(summary.totalCommands || 0) > 0;
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
  const gateCommands = [];
  if (level !== "clear") {
    gateCommands.push({
      phase: "before",
      label: "Confirm clean workspace before execution",
      ...commandSpec(["git", "status", "--short"]),
      required: true,
    });
  }
  if (hasMutation || hasFileWrite) {
    gateCommands.push({
      phase: "after",
      label: "Inspect local file changes after execution",
      ...commandSpec(["git", "diff", "--stat"]),
      required: true,
    });
  }
  gateCommands.push({
    phase: "refresh",
    label: "Refresh focused agent backlog after review",
    ...commandSpec(refreshCommandArgs),
    required: hasCommand,
  });
  const gatePhaseSummary = summarizeAgentBacklogGateCommands(gateCommands);
  const gateRunbook = groupAgentBacklogGateCommands(gateCommands);
  return {
    level,
    requiresOperatorReview: level !== "clear",
    headline,
    checklist,
    gatePhaseSummary,
    gateRunbook,
    gateCommands,
  };
}

function summarizeAgentBacklogGateCommands(gateCommands = []) {
  const validCommands = Array.isArray(gateCommands)
    ? gateCommands.filter((item) => item && typeof item === "object")
    : [];
  const phases = [...new Set(validCommands.map((item) => String(item.phase || "")).filter(Boolean))];
  const requiredCount = validCommands.filter((item) => item.required === true).length;
  return {
    count: validCommands.length,
    requiredCount,
    optionalCount: validCommands.length - requiredCount,
    phases,
    hasBefore: phases.includes("before"),
    hasAfter: phases.includes("after"),
    hasRefresh: phases.includes("refresh"),
  };
}

function groupAgentBacklogGateCommands(gateCommands = []) {
  const groups = {
    before: [],
    after: [],
    refresh: [],
    other: [],
  };
  const validCommands = Array.isArray(gateCommands)
    ? gateCommands.filter((item) => item && typeof item === "object")
    : [];
  for (const item of validCommands) {
    const phase = String(item.phase || "");
    if (phase === "before" || phase === "after" || phase === "refresh") {
      groups[phase].push(item);
    } else {
      groups.other.push(item);
    }
  }
  return groups;
}

function buildAgentBacklogOperatorRunbook({
  commandManifest = [],
  commandEffectReview = {},
} = {}) {
  const gateRunbook = commandEffectReview?.gateRunbook && typeof commandEffectReview.gateRunbook === "object"
    ? commandEffectReview.gateRunbook
    : {};
  const gateCommandsFor = (phase) => (
    Array.isArray(gateRunbook[phase]) ? gateRunbook[phase] : []
  );
  const executeCommands = Array.isArray(commandManifest)
    ? commandManifest
      .filter((item) => item && typeof item === "object" && item.command)
      .map((item) => ({
        phase: "execute",
        rank: item.rank,
        actionId: item.actionId || "",
        label: item.actionId ? `Run ${item.actionId}` : "Run backlog command",
        command: item.command,
        commandArgs: Array.isArray(item.commandArgs) ? item.commandArgs : [],
        required: true,
        safetyLevel: item.safetyLevel || "unknown",
        runPolicy: item.runPolicy || "manual-review",
        requiresReviewBeforeMutation: Boolean(item.requiresReviewBeforeMutation),
      }))
    : [];
  const stages = [
    {
      phase: "before",
      label: "Run before executing backlog commands",
      commands: gateCommandsFor("before"),
    },
    {
      phase: "execute",
      label: "Execute reviewed backlog commands",
      commands: executeCommands,
    },
    {
      phase: "after",
      label: "Run after executing backlog commands",
      commands: gateCommandsFor("after"),
    },
    {
      phase: "refresh",
      label: "Refresh backlog status after execution",
      commands: gateCommandsFor("refresh"),
    },
  ].map((stage) => {
    const commands = Array.isArray(stage.commands) ? stage.commands : [];
    return {
      ...stage,
      commandCount: commands.length,
      requiredCount: commands.filter((item) => item && item.required === true).length,
      commands,
    };
  });
  const allCommands = stages.flatMap((stage) => stage.commands);
  const nextStage = stages.find((stage) => stage.commands.length > 0) || null;
  const nextCommand = nextStage?.commands?.[0] || null;
  const stageOrder = ["before", "execute", "after", "refresh"];
  const nonRefreshCommandCount = stages
    .filter((stage) => stage.phase !== "refresh")
    .reduce((count, stage) => count + stage.commands.length, 0);
  const optionalRefreshOnlyNextCommand = Boolean(
    nextCommand
      && nextStage?.phase === "refresh"
      && nextCommand.required !== true
      && nonRefreshCommandCount === 0,
  );
  const nextCommandSelection = {
    strategy: "first-command-in-operator-runbook-stage-order",
    stageOrder,
    stage: nextStage?.phase || "",
    label: nextCommand?.label || "",
    command: nextCommand?.command || "",
    commandArgs: Array.isArray(nextCommand?.commandArgs) ? nextCommand.commandArgs : [],
    actionId: nextCommand?.actionId || "",
    rank: nextCommand?.rank ?? null,
    required: Boolean(nextCommand?.required),
    runPolicy: nextCommand?.runPolicy || "",
    reason: optionalRefreshOnlyNextCommand
      ? "Optional refresh command is available as status metadata; no executable backlog handoff command is selected."
      : nextCommand
        ? `Selected the first command in the ${nextStage?.phase || "unknown"} stage using operator runbook stage order.`
      : "No operator runbook command is available.",
  };
  return {
    version: 1,
    stageCount: stages.length,
    commandCount: allCommands.length,
    requiredCommandCount: allCommands.filter((item) => item && item.required === true).length,
    reviewLevel: commandEffectReview?.level || "unknown",
    requiresOperatorReview: Boolean(commandEffectReview?.requiresOperatorReview),
    phases: stages.map((stage) => stage.phase),
    nextStage: nextStage?.phase || "",
    nextCommandLabel: nextCommand?.label || "",
    nextCommand: nextCommand?.command || "",
    nextCommandArgs: Array.isArray(nextCommand?.commandArgs) ? nextCommand.commandArgs : [],
    nextCommandRequired: Boolean(nextCommand?.required),
    nextCommandRunPolicy: nextCommand?.runPolicy || "",
    nextCommandSelection,
    stages,
  };
}

function buildAgentBacklogNextCommandAlignment({
  operatorRunbook = {},
  nextCommandItem = null,
  rankedNextStep = null,
} = {}) {
  const operatorSelection = operatorRunbook?.nextCommandSelection && typeof operatorRunbook.nextCommandSelection === "object"
    ? operatorRunbook.nextCommandSelection
    : {};
  const operatorCommand = operatorRunbook?.nextCommand || operatorSelection.command || "";
  const operatorActionId = operatorSelection.actionId || "";
  const operatorStage = operatorRunbook?.nextStage || operatorSelection.stage || "";
  const queueCommand = nextCommandItem?.command || "";
  const queueActionId = nextCommandItem?.actionId || "";
  const rankedActionId = rankedNextStep?.actionId || "";
  const matchesQueueNextCommand = Boolean(operatorCommand && queueCommand && operatorCommand === queueCommand);
  const matchesQueueNextAction = Boolean(operatorActionId && queueActionId && operatorActionId === queueActionId);
  const operatorRunsBeforeQueueCommand = Boolean(operatorCommand && queueCommand && !matchesQueueNextCommand && operatorStage === "before");
  const queueMatchesRankedNextAction = Boolean(queueActionId && rankedActionId && queueActionId === rankedActionId);
  let reason = "No operator runbook command or queue command is available.";
  if (matchesQueueNextCommand) {
    reason = "Operator runbook starts with the same command as the safety-ordered execution queue.";
  } else if (operatorRunsBeforeQueueCommand) {
    reason = "Operator runbook starts with a before-stage gate before the safety-ordered queue command.";
  } else if (operatorCommand && queueCommand) {
    reason = "Operator runbook and safety-ordered queue selected different first commands.";
  } else if (operatorCommand) {
    reason = operatorStage === "refresh"
      ? "Operator runbook exposes an optional refresh command while the safety-ordered execution queue is empty."
      : "Operator runbook exposes a command while the safety-ordered execution queue is empty.";
  } else if (queueCommand) {
    reason = "Safety-ordered execution queue exposes a command while the operator runbook has no command.";
  }
  return {
    strategy: "compare-operator-runbook-next-command-to-execution-queue-next-command",
    operatorStage,
    operatorActionId,
    operatorCommand,
    operatorCommandArgs: Array.isArray(operatorRunbook?.nextCommandArgs) ? operatorRunbook.nextCommandArgs : [],
    queueActionId,
    queueCommand,
    queueCommandArgs: Array.isArray(nextCommandItem?.commandArgs) ? nextCommandItem.commandArgs : [],
    rankedNextActionId: rankedActionId,
    matchesQueueNextCommand,
    matchesQueueNextAction,
    operatorRunsBeforeQueueCommand,
    queueMatchesRankedNextAction,
    reason,
  };
}

function buildAgentBacklogOperatorHandoff({
  operatorRunbook = {},
  nextCommandItem = null,
  nextCommandAlignment = {},
} = {}) {
  const operatorSelection = operatorRunbook?.nextCommandSelection && typeof operatorRunbook.nextCommandSelection === "object"
    ? operatorRunbook.nextCommandSelection
    : {};
  const hasOperatorCommand = Boolean(operatorRunbook?.nextCommand);
  const hasQueueCommand = Boolean(nextCommandItem?.command);
  const refreshStage = Array.isArray(operatorRunbook?.stages)
    ? operatorRunbook.stages.find((stage) => stage && stage.phase === "refresh")
    : null;
  const refreshCommandItem = Array.isArray(refreshStage?.commands)
    ? refreshStage.commands.find((item) => item && item.command) || null
    : null;
  const operatorPhase = hasOperatorCommand ? operatorRunbook.nextStage || "" : "";
  const operatorCommandIsGate = Boolean(hasOperatorCommand && operatorPhase && operatorPhase !== "execute");
  const nextQueueCommandRequiresGate = Boolean(nextCommandItem?.requiresReviewBeforeMutation);
  const operatorGateAppliesToNextQueueAction = Boolean(operatorCommandIsGate && hasQueueCommand && nextQueueCommandRequiresGate);
  const shouldUseOperatorCommand = Boolean(hasOperatorCommand && (!operatorCommandIsGate || operatorGateAppliesToNextQueueAction));
  const source = shouldUseOperatorCommand ? "operator-runbook" : hasQueueCommand ? "execution-queue" : "";
  const phase = shouldUseOperatorCommand ? operatorRunbook.nextStage || "" : hasQueueCommand ? "execute" : "";
  const command = shouldUseOperatorCommand ? operatorRunbook.nextCommand || "" : nextCommandItem?.command || "";
  const commandArgs = shouldUseOperatorCommand
    ? Array.isArray(operatorRunbook?.nextCommandArgs) ? operatorRunbook.nextCommandArgs : []
    : Array.isArray(nextCommandItem?.commandArgs) ? nextCommandItem.commandArgs : [];
  const isGate = Boolean(shouldUseOperatorCommand && phase && phase !== "execute");
  const nextQueueActionBlockedByGate = Boolean(isGate && hasQueueCommand);
  const requiresOperatorReviewForHandoff = shouldUseOperatorCommand
    ? Boolean(operatorRunbook?.requiresOperatorReview)
    : Boolean(nextCommandItem?.requiresReviewBeforeMutation);
  const reviewLevelForHandoff = shouldUseOperatorCommand
    ? operatorRunbook?.reviewLevel || "unknown"
    : requiresOperatorReviewForHandoff ? operatorRunbook?.reviewLevel || "unknown" : "clear";
  let decision = "none";
  let reason = refreshCommandItem?.command
    ? "No handoff command is required; optional refresh command remains available as status metadata."
    : "No operator or queue command is available for handoff.";
  if (nextQueueActionBlockedByGate) {
    decision = "run-operator-gate";
    reason = "Run the operator gate before executing the safety-ordered queue command.";
  } else if (nextCommandAlignment?.matchesQueueNextCommand) {
    decision = "run-shared-command";
    reason = "Run the shared operator and queue command next.";
  } else if (shouldUseOperatorCommand) {
    decision = isGate ? "run-operator-gate" : "run-operator-command";
    reason = "Run the operator runbook command next.";
  } else if (hasQueueCommand) {
    decision = "run-queue-command";
    reason = "Run the safety-ordered queue command next.";
  }
  let stateStatus = "no-command";
  let stateSummary = "No operator or queue command is available for handoff.";
  if (command) {
    if (nextQueueActionBlockedByGate) {
      stateStatus = "gate-required";
      stateSummary = "Run the required operator gate before the safety-ordered queue command.";
    } else if (requiresOperatorReviewForHandoff) {
      stateStatus = "review-required";
      stateSummary = "Review command targets and mutation exposure before running the handoff command.";
    } else {
      stateStatus = "ready";
      stateSummary = "The handoff command can be presented or run, then refreshed with the focused backlog check.";
    }
  } else {
    stateSummary = "Focused agent backlog is clear; no handoff command is required.";
  }
  const hasHandoffCommand = Boolean(command);
  const state = {
    version: 1,
    status: stateStatus,
    ready: hasHandoffCommand || stateStatus === "no-command",
    hasCommand: hasHandoffCommand,
    complete: !hasHandoffCommand,
    canRunWithoutReview: Boolean(hasHandoffCommand && !nextQueueActionBlockedByGate && !requiresOperatorReviewForHandoff),
    requiresGate: nextQueueActionBlockedByGate,
    requiresRefresh: Boolean(hasHandoffCommand && refreshCommandItem?.required),
    summary: stateSummary,
  };
  return {
    version: 1,
    decision,
    state,
    source,
    phase,
    label: shouldUseOperatorCommand ? operatorRunbook.nextCommandLabel || "" : nextCommandItem?.actionId || "",
    command,
    commandArgs,
    actionId: shouldUseOperatorCommand ? operatorSelection.actionId || "" : nextCommandItem?.actionId || "",
    rank: shouldUseOperatorCommand ? operatorSelection.rank ?? null : nextCommandItem?.rank ?? null,
    runPolicy: shouldUseOperatorCommand ? operatorRunbook.nextCommandRunPolicy || "" : nextCommandItem?.runPolicy || "",
    required: shouldUseOperatorCommand ? Boolean(operatorRunbook.nextCommandRequired) : Boolean(hasQueueCommand),
    isGate,
    nextQueueActionId: nextCommandItem?.actionId || "",
    nextQueueCommand: nextCommandItem?.command || "",
    nextQueueCommandArgs: Array.isArray(nextCommandItem?.commandArgs) ? nextCommandItem.commandArgs : [],
    nextQueueCommandRequiresGate,
    operatorGateAppliesToNextQueueAction,
    nextQueueActionBlockedByGate,
    refreshCommand: refreshCommandItem?.command || "",
    refreshCommandArgs: Array.isArray(refreshCommandItem?.commandArgs) ? refreshCommandItem.commandArgs : [],
    refreshCommandLabel: refreshCommandItem?.label || "",
    refreshCommandRequired: Boolean(hasHandoffCommand && refreshCommandItem?.required),
    reviewLevel: reviewLevelForHandoff,
    requiresOperatorReview: requiresOperatorReviewForHandoff,
    reason,
  };
}

function buildAgentBacklogExecutionQueue(steps = [], {
  refreshCommandArgs = ["design-ai", "learn", "--agent-backlog", "--strict", "--json"],
} = {}) {
  const toQueueItem = (step) => {
    const commandSafety = step.commandSafety && typeof step.commandSafety === "object" ? step.commandSafety : {};
    const safetyLevel = commandSafety.level || "unknown";
    const commandEffects = buildAgentBacklogCommandEffects(commandSafety);
    const applyCommandSafety = step.applyCommandSafety && typeof step.applyCommandSafety === "object"
      ? {
        level: step.applyCommandSafety.level || "unknown",
        ...buildAgentBacklogCommandEffects(step.applyCommandSafety),
      }
      : null;
    return {
      rank: step.rank,
      actionId: step.actionId || "",
      priority: step.priority || "p3",
      category: step.category || "other",
      title: step.title || "",
      command: step.command || "",
      commandArgs: Array.isArray(step.commandArgs) ? step.commandArgs : [],
      applyCommand: step.applyCommand || "",
      applyCommandArgs: Array.isArray(step.applyCommandArgs) ? step.applyCommandArgs : [],
      applyCommandSafety,
      applyRequiresReviewBeforeMutation: Boolean(step.applyRequiresReviewBeforeMutation),
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
      commandArgs: item.commandArgs,
      applyCommand: item.applyCommand,
      applyCommandArgs: item.applyCommandArgs,
      applyCommandSafety: item.applyCommandSafety,
      applyRequiresReviewBeforeMutation: item.applyRequiresReviewBeforeMutation,
      safetyLevel: item.safetyLevel,
      runPolicy: item.runPolicy,
      commandEffects: item.commandEffects,
      requiresReviewBeforeMutation: item.requiresReviewBeforeMutation,
    }));
  const nextCommandItem = ordered.find((item) => item.command) || null;
  const rankedNextStep = steps[0] || null;
  const commandEffectSummary = summarizeAgentBacklogCommandEffectManifest(commandManifest);
  const commandEffectReview = buildAgentBacklogCommandEffectReview(commandEffectSummary, {
    refreshCommandArgs,
  });
  const operatorRunbook = buildAgentBacklogOperatorRunbook({
    commandManifest,
    commandEffectReview,
  });
  const nextCommandMatchesRankedStep = Boolean(
    nextCommandItem?.actionId
    && rankedNextStep?.actionId
    && nextCommandItem.actionId === rankedNextStep.actionId,
  );
  const nextCommandSelection = {
    strategy: "first-command-in-safety-ordered-queue",
    safetyOrder: ["read-only", "writes-local-file", "mutates-local-state"],
    actionId: nextCommandItem?.actionId || "",
    rank: nextCommandItem?.rank ?? null,
    safetyLevel: nextCommandItem?.safetyLevel || "",
    runPolicy: nextCommandItem?.runPolicy || "",
    planNextActionId: rankedNextStep?.actionId || "",
    planNextActionRank: rankedNextStep?.rank ?? null,
    matchesPlanNextAction: nextCommandMatchesRankedStep,
    reason: nextCommandItem
      ? nextCommandMatchesRankedStep
        ? "Selected the ranked next action because it is first in the safety-ordered queue."
        : "Selected the first command in the safety-ordered queue before higher-risk ranked actions."
      : "No command-bearing backlog action is available.",
  };
  const nextCommandAlignment = buildAgentBacklogNextCommandAlignment({
    operatorRunbook,
    nextCommandItem,
    rankedNextStep,
  });
  const operatorHandoff = buildAgentBacklogOperatorHandoff({
    operatorRunbook,
    nextCommandItem,
    nextCommandAlignment,
  });
  return {
    orderedCount: ordered.length,
    commandManifestCount: commandManifest.length,
    previewCount: preview.length,
    fileWriteReviewCount: fileWriteReview.length,
    mutationReviewCount: mutationReview.length,
    nextActionId: ordered[0]?.actionId || "",
    nextCommand: nextCommandItem?.command || "",
    nextCommandArgs: Array.isArray(nextCommandItem?.commandArgs) ? nextCommandItem.commandArgs : [],
    nextCommandRunPolicy: nextCommandItem?.runPolicy || "",
    nextCommandSelection,
    nextCommandAlignment,
    operatorHandoff,
    commandEffectSummary,
    commandEffectReview,
    operatorRunbook,
    ordered,
    commandManifest,
    preview,
    fileWriteReview,
    mutationReview,
  };
}

function buildAgentBacklogActionPlan({ actions = [], commands = {}, privacy = {} } = {}) {
  const agentBacklogJsonArgs = Array.isArray(commands.agentBacklogJsonArgs) && commands.agentBacklogJsonArgs.length > 0
    ? commands.agentBacklogJsonArgs
    : ["design-ai", "learn", "--agent-backlog", "--strict", "--json"];
  const steps = actions.map((action, index) => {
    const commandArgs = Array.isArray(action.commandArgs) ? action.commandArgs.map((item) => String(item)) : [];
    const command = String(action.command || (commandArgs.length > 0 ? commandFromArgs(commandArgs) : ""));
    const applyCommandArgs = Array.isArray(action.applyCommandArgs) ? action.applyCommandArgs.map((item) => String(item)) : [];
    const applyCommand = String(action.applyCommand || (applyCommandArgs.length > 0 ? commandFromArgs(applyCommandArgs) : ""));
    const commandSafety = classifyAgentBacklogCommand(command);
    const applyCommandSafety = applyCommand ? classifyAgentBacklogCommand(applyCommand) : null;
    return {
      rank: action.rank ?? index + 1,
      actionId: action.id || "",
      priority: action.priority || "p3",
      category: action.category || "other",
      title: action.title || "",
      command,
      commandArgs,
      applyCommand,
      applyCommandArgs,
      applyCommandSafety,
      applyRequiresReviewBeforeMutation: Boolean(applyCommandSafety?.requiresCleanWorkspace),
      expectedOutcome: action.rationale || "",
      verification: command
        ? applyCommand
          ? [
            "Run the preview command first and inspect the proposed local learning profile changes.",
            "Run the apply command only after operator review confirms the target profile path and mutation scope.",
            "Re-run `design-ai learn --agent-backlog --strict --json` after the apply step to confirm the backlog status improved.",
          ]
          : commandSafety.requiresCleanWorkspace
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
  const executionQueue = buildAgentBacklogExecutionQueue(steps, {
    refreshCommandArgs: agentBacklogJsonArgs,
  });
  const verification = [
    commands.signalsJson
      ? {
        label: "Refresh signal registry JSON",
        command: commands.signalsJson,
        commandArgs: Array.isArray(commands.signalsJsonArgs) ? commands.signalsJsonArgs : [],
      }
      : null,
    commands.signalsReport
      ? {
        label: "Save signal registry Markdown handoff",
        command: commands.signalsReport,
        commandArgs: Array.isArray(commands.signalsReportArgs) ? commands.signalsReportArgs : [],
      }
      : null,
    {
      label: "Gate focused agent backlog",
      ...commandSpec(agentBacklogJsonArgs),
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

  if (!audit.exists) {
    const previewCommand = commandSpec(["design-ai", "learn", "--init", "--dry-run", "--file", filePath]);
    const applyCommand = commandSpec(["design-ai", "learn", "--init", "--yes", "--file", filePath]);
    actions.push(agentAction({
      id: "agent-learning-profile-init",
      priority: "p1",
      category: "learning-profile",
      title: "Initialize the local learning profile before agent development review.",
      rationale: "Signal registry output is incomplete until a profile exists.",
      ...previewCommand,
      applyCommand: applyCommand.command,
      applyCommandArgs: applyCommand.commandArgs,
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
      ...commandSpec(["design-ai", "learn", "--audit", "--file", filePath]),
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
      ...commandSpec(["design-ai", "learn", "--audit", "--file", filePath]),
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
      ...commandSpec([
        "env",
        `DESIGN_AI_LEARNING_FILE=${filePath}`,
        `DESIGN_AI_LEARNING_USAGE_FILE=${usageFile}`,
        "design-ai",
        "prompt",
        "audit a design artifact",
        "--with-learning",
        "--json",
      ]),
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
      ...commandSpec(["design-ai", "learn", "--usage", "--file", filePath, "--usage-file", usageFile]),
      evidence: {
        staleSelectedEntryCount: usage.staleSelectedEntryCount,
      },
    }));
  }

  if (evals.files.length === 0) {
    const evalOutputFile = defaultLearningEvalPath(filePath);
    actions.push(agentAction({
      id: "agent-eval-checkpoint-generate",
      priority: "p1",
      category: "eval-harness",
      title: "Generate and run route, prompt, pack, or learning eval checkpoints.",
      rationale: "Agent development needs replayable checkpoints before signal registry output can act as a gate.",
      ...commandSpec(["design-ai", "learn", "--eval-template", "--file", filePath, "--json", "--out", evalOutputFile]),
      evidence: {
        evalSignalCount: 0,
        evalOutputFile,
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
      ...commandSpec(["design-ai", "learn", "--signals", "--from-file", signalSource || ".", "--file", filePath, "--usage-file", usageFile, "--json"]),
      evidence: {
        failed: evals.failed,
        warned: evals.warned,
      },
    }));
  } else if (evals.templates > 0) {
    const templateFile = Array.isArray(evals.templateFiles) && evals.templateFiles.length > 0
      ? evals.templateFiles[0].file
      : "";
    const evalReportFile = templateFile ? evalReportPathForTemplate(templateFile) : defaultLearningEvalReportPath(filePath);
    actions.push(agentAction({
      id: "agent-eval-template-replay",
      priority: "p1",
      category: "eval-harness",
      title: "Replay template-only eval signal files as executed reports.",
      rationale: "Templates are useful setup artifacts, but executed reports provide stronger evidence for agent behavior.",
      ...commandSpec([
        "design-ai",
        "learn",
        "--eval",
        "--from-file",
        templateFile || defaultLearningEvalPath(filePath),
        "--file",
        filePath,
        "--strict",
        "--json",
        "--out",
        evalReportFile,
      ]),
      evidence: {
        templates: evals.templates,
        templateFile: templateFile || defaultLearningEvalPath(filePath),
        evalReportFile,
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
      ...commandSpec(["design-ai", "learn", "--propose-skills", "--from-file", signalSource || ".", "--file", filePath, "--usage-file", usageFile, "--json"]),
      evidence: {
        checkCaptureCount: checkCapture.count,
        categoryCounts: checkCapture.categoryCounts,
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
      ...commandSpec(["design-ai", "workspace", "--learning-file", filePath, "--learning-usage", usageFile, "--strict", "--json"]),
      evidence: {
        fail: workspace.nextActionCounts.fail || 0,
        warn: workspace.nextActionCounts.warn || 0,
        nextActionCount: workspace.nextActionCount || 0,
      },
    }));
  }

  const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
  const actionOrder = {
    "agent-learning-profile-audit-fix": 0,
    "agent-learning-profile-init": 1,
    "agent-learning-profile-audit-review": 2,
    "agent-learning-usage-stale-review": 3,
    "agent-workspace-readiness-review": 4,
    "agent-eval-failure-review": 5,
    "agent-eval-checkpoint-generate": 6,
    "agent-eval-template-replay": 7,
    "agent-learning-usage-record": 8,
    "agent-skill-proposal-preview": 9,
  };
  const sortedActions = actions
    .sort((a, b) => (
      priorityOrder[a.priority] - priorityOrder[b.priority]
      || (actionOrder[a.id] ?? 100) - (actionOrder[b.id] ?? 100)
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
      const gatePhaseSummary = commandEffectReview.gatePhaseSummary && typeof commandEffectReview.gatePhaseSummary === "object"
        ? commandEffectReview.gatePhaseSummary
        : null;
      if (gatePhaseSummary) {
        const phases = Array.isArray(gatePhaseSummary.phases) && gatePhaseSummary.phases.length > 0
          ? gatePhaseSummary.phases.join(", ")
          : "none";
        lines.push(`- Command effect gate phases: ${phases} (${gatePhaseSummary.requiredCount ?? 0}/${gatePhaseSummary.count ?? 0} required)`);
      }
      const gateRunbook = commandEffectReview.gateRunbook && typeof commandEffectReview.gateRunbook === "object"
        ? commandEffectReview.gateRunbook
        : null;
      if (gateRunbook) {
        lines.push(`- Command effect gate runbook: before ${Array.isArray(gateRunbook.before) ? gateRunbook.before.length : 0}, after ${Array.isArray(gateRunbook.after) ? gateRunbook.after.length : 0}, refresh ${Array.isArray(gateRunbook.refresh) ? gateRunbook.refresh.length : 0}`);
      }
      const gateCommands = Array.isArray(commandEffectReview.gateCommands) ? commandEffectReview.gateCommands : [];
      if (gateCommands.length > 0) {
        lines.push("- Command effect gates:");
        for (const item of gateCommands) {
          const phase = item.phase ? `${item.phase}: ` : "";
          lines.push(`  - ${phase}${item.label || "Review gate"}: \`${item.command || ""}\``);
        }
      }
    }
    const operatorRunbook = executionQueue.operatorRunbook && typeof executionQueue.operatorRunbook === "object"
      ? executionQueue.operatorRunbook
      : null;
    if (operatorRunbook) {
      lines.push(`- Operator runbook: ${operatorRunbook.stageCount ?? 0} stage(s), ${operatorRunbook.commandCount ?? 0} command(s), ${operatorRunbook.requiredCommandCount ?? 0} required`);
      if (operatorRunbook.nextCommand) {
        lines.push(`- Operator next command: ${operatorRunbook.nextStage || "unknown"}: \`${operatorRunbook.nextCommand}\``);
      }
      const operatorSelection = operatorRunbook.nextCommandSelection && typeof operatorRunbook.nextCommandSelection === "object"
        ? operatorRunbook.nextCommandSelection
        : null;
      if (operatorSelection) {
        lines.push(`- Operator next command selection: ${operatorSelection.strategy || "unknown"} (${operatorSelection.reason || "no reason provided"})`);
      }
    }
    if (executionQueue.nextActionId) lines.push(`- Recommended next action: ${executionQueue.nextActionId}`);
    if (executionQueue.nextCommandRunPolicy) lines.push(`- Recommended next command policy: ${executionQueue.nextCommandRunPolicy}`);
    const nextCommandSelection = executionQueue.nextCommandSelection && typeof executionQueue.nextCommandSelection === "object"
      ? executionQueue.nextCommandSelection
      : null;
    if (nextCommandSelection) {
      lines.push(`- Recommended next command selection: ${nextCommandSelection.strategy || "unknown"} (${nextCommandSelection.reason || "no reason provided"})`);
      if (nextCommandSelection.planNextActionId) {
        lines.push(`- Ranked next action: ${nextCommandSelection.planNextActionId}; matches recommended command: ${nextCommandSelection.matchesPlanNextAction ? "yes" : "no"}`);
      }
    }
    const nextCommandAlignment = executionQueue.nextCommandAlignment && typeof executionQueue.nextCommandAlignment === "object"
      ? executionQueue.nextCommandAlignment
      : null;
    if (nextCommandAlignment) {
      lines.push(`- Operator/queue next command alignment: ${nextCommandAlignment.matchesQueueNextCommand ? "same" : "different"} (${nextCommandAlignment.reason || "no reason provided"})`);
    }
    const operatorHandoff = executionQueue.operatorHandoff && typeof executionQueue.operatorHandoff === "object"
      ? executionQueue.operatorHandoff
      : null;
    if (operatorHandoff) {
      const phase = operatorHandoff.phase ? `${operatorHandoff.phase} ` : "";
      const decision = operatorHandoff.decision ? `${operatorHandoff.decision}; ` : "";
      lines.push(`- Operator handoff: ${phase}${operatorHandoff.source || "unknown"} (${decision}${operatorHandoff.reason || "no reason provided"})`);
      const handoffState = operatorHandoff.state && typeof operatorHandoff.state === "object" ? operatorHandoff.state : null;
      if (handoffState) {
        lines.push(`- Operator handoff state: ${handoffState.status || "unknown"}; ready ${handoffState.ready ? "yes" : "no"}; can run without review ${handoffState.canRunWithoutReview ? "yes" : "no"}; refresh ${handoffState.requiresRefresh ? "required" : "optional"}`);
        if (handoffState.summary) {
          lines.push(`- Operator handoff summary: ${handoffState.summary}`);
        }
      }
      if (operatorHandoff.refreshCommand) {
        lines.push(`- Operator handoff refresh: ${operatorHandoff.refreshCommand}`);
      }
    }
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
      if (step.applyCommand) {
        const applySafety = step.applyCommandSafety && typeof step.applyCommandSafety === "object" ? step.applyCommandSafety : {};
        lines.push("");
        lines.push("Apply command after review:");
        lines.push("");
        lines.push("```bash");
        lines.push(step.applyCommand);
        lines.push("```");
        lines.push(listItem("Apply command safety", applySafety.level || "unknown"));
        lines.push(listItem("Apply requires mutation review", yesNo(Boolean(step.applyRequiresReviewBeforeMutation))));
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
  const readiness = payload.readiness || {};
  const lines = [
    "# Learning Signal Registry Report",
    "",
    listItem("Generated", generatedAtText),
    listItem("Status", payload.status || "unknown"),
    listItem("Learning file", payload.file || ""),
    listItem("Signal source", payload.signalSource || ""),
    "",
    "## Readiness Summary",
    "",
    listItem("Status", readiness.status || payload.status || "unknown"),
    listItem("Summary", readiness.summary || ""),
    listItem("Required ready", yesNo(Boolean(readiness.requiredReady))),
    listItem("Required checks", `${readiness.requiredPassCount ?? 0}/${readiness.requiredCount ?? 0}`),
    listItem("Blocking checks", readiness.blockingCount ?? 0),
    listItem("Optional gaps", readiness.optionalGapCount ?? 0),
  ];

  const readinessChecks = Array.isArray(readiness.checks) ? readiness.checks : [];
  if (readinessChecks.length > 0) {
    lines.push("", "Readiness checks:");
    for (const check of readinessChecks) {
      const required = check.required ? "required" : "optional";
      lines.push(`- ${check.id || "unknown"} [${required}] ${check.status || "unknown"}: ${check.summary || ""}`);
    }
  }

  lines.push(
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
  );

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
