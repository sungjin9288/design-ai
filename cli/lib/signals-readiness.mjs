// Learning signal readiness checks and readiness report rendering helpers.

import { readinessCountByStatus, statusRank, yesNo } from "./signals-shared.mjs";

export function optionalGapDetail(check = {}) {
  if (check.id === "check-capture") {
    return {
      id: check.id,
      label: check.label || "Check learning capture",
      status: check.status || "info",
      summary: check.summary || "",
      reason: "No real warn/fail check result has been intentionally captured into the local learning profile yet.",
      nextCondition: "Run `design-ai check <artifact.md> --learn --yes` only after reviewing an actual warning or failure that should improve future outputs.",
      automationPolicy: "Do not emit placeholder mutation commands for this advisory gap; wait for real check evidence.",
    };
  }

  return {
    id: check.id || "unknown",
    label: check.label || "Optional readiness check",
    status: check.status || "info",
    summary: check.summary || "",
    reason: "Optional evidence is incomplete.",
    nextCondition: "Collect real local evidence before treating this optional signal as complete.",
    automationPolicy: "Keep this advisory unless a future required gate explicitly depends on it.",
  };
}

export function renderOptionalGapDetails(lines, readiness = {}) {
  const details = Array.isArray(readiness.optionalGapDetails) ? readiness.optionalGapDetails : [];
  if (details.length === 0) return;
  lines.push("", "Optional gap details:");
  for (const detail of details) {
    lines.push(`- ${detail.id || "unknown"}: ${detail.reason || detail.summary || ""}`);
    if (detail.nextCondition) lines.push(`  Next condition: ${detail.nextCondition}`);
    if (detail.automationPolicy) lines.push(`  Automation policy: ${detail.automationPolicy}`);
  }
}

export function renderReadinessCheckIndex(lines, readiness = {}) {
  const requiredIds = Array.isArray(readiness.requiredCheckIds) ? readiness.requiredCheckIds : [];
  const optionalIds = Array.isArray(readiness.optionalCheckIds) ? readiness.optionalCheckIds : [];
  const statusById = readiness.checkStatusById && typeof readiness.checkStatusById === "object"
    ? readiness.checkStatusById
    : {};
  const requiredById = readiness.checkRequiredById && typeof readiness.checkRequiredById === "object"
    ? readiness.checkRequiredById
    : {};
  const checks = Array.isArray(readiness.checks) ? readiness.checks : [];
  const indexIds = [...new Set([
    ...checks.map((item) => item?.id).filter(Boolean),
    ...requiredIds,
    ...optionalIds,
    ...Object.keys(statusById),
    ...Object.keys(requiredById),
  ])];
  if (indexIds.length === 0) return;

  lines.push("", "Readiness check index:");
  lines.push(`- Required ids: ${requiredIds.length > 0 ? requiredIds.join(", ") : "none"}`);
  lines.push(`- Optional ids: ${optionalIds.length > 0 ? optionalIds.join(", ") : "none"}`);
  lines.push(`- Status index: ${indexIds.map((id) => `${id}=${statusById[id] || "unknown"}`).join(", ")}`);
  lines.push(`- Required index: ${indexIds.map((id) => `${id}=${yesNo(Boolean(requiredById[id]))}`).join(", ")}`);
  if (readiness.checkCountByStatus && typeof readiness.checkCountByStatus === "object") {
    const formatCounts = (counts = {}) => ["pass", "info", "warn", "fail", "missing", "template", "unknown"]
      .map((key) => `${key}=${counts[key] ?? 0}`)
      .join(", ");
    lines.push(`- Status counts: ${formatCounts(readiness.checkCountByStatus)}`);
    lines.push(`- Required status counts: ${formatCounts(readiness.requiredCheckCountByStatus)}`);
    lines.push(`- Optional status counts: ${formatCounts(readiness.optionalCheckCountByStatus)}`);
  }
}
export function signalCheck({
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

export function buildLearningSignalReadiness({
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
  const checkStatusById = Object.fromEntries(checks.map((item) => [item.id, item.status]));
  const checkRequiredById = Object.fromEntries(checks.map((item) => [item.id, Boolean(item.required)]));
  const checkCountByStatus = readinessCountByStatus(checks);
  const requiredCheckCountByStatus = readinessCountByStatus(requiredChecks);
  const optionalCheckCountByStatus = readinessCountByStatus(optionalChecks);
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
    optionalGapDetails: optionalGaps.map(optionalGapDetail),
    requiredCheckIds: requiredChecks.map((item) => item.id),
    optionalCheckIds: optionalChecks.map((item) => item.id),
    checkStatusById,
    checkRequiredById,
    checkCountByStatus,
    requiredCheckCountByStatus,
    optionalCheckCountByStatus,
    checks,
  };
}
