// Agent backlog command safety classification, effect review, and execution queue.

import { commandSpec } from "./signals-shared.mjs";

export function classifyAgentBacklogCommand(command = "") {
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

export function extractAgentBacklogFlagTargets(command = "", flag = "") {
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

export function extractAgentBacklogEnvTargets(command = "", name = "") {
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

export function summarizeAgentBacklogCommandSafety(steps = []) {
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

export function agentBacklogRunPolicyForSafetyLevel(safetyLevel = "unknown") {
  if (safetyLevel === "read-only") return "preview-only";
  if (safetyLevel === "writes-local-file") return "review-before-file-write";
  if (safetyLevel === "mutates-local-state") return "review-before-mutation";
  return "manual-review";
}

export function buildAgentBacklogCommandEffects(commandSafety = {}) {
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

export function summarizeAgentBacklogCommandEffects(effects = {}) {
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

export function uniqueAgentBacklogTargets(targets = []) {
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

export function uniqueAgentBacklogFlags(flags = []) {
  return [...new Set(flags.filter(Boolean).map((flag) => String(flag)))];
}

export function summarizeAgentBacklogCommandEffectManifest(commandManifest = []) {
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

export function buildAgentBacklogCommandEffectReview(summary = {}, {
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

export function summarizeAgentBacklogGateCommands(gateCommands = []) {
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

export function groupAgentBacklogGateCommands(gateCommands = []) {
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

export function buildAgentBacklogOperatorRunbook({
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

export function buildAgentBacklogNextCommandAlignment({
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

export function buildAgentBacklogOperatorHandoff({
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

export function buildAgentBacklogExecutionQueue(steps = [], {
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
