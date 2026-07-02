// Apply-plan command contract construction for skill proposals.

import {
  APPLY_PLAN_BASE_COMMAND,
  APPLY_PLAN_FOLLOW_UP_COMMAND_DESCRIPTIONS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_DISPLAY_LABELS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACTS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_ACTIONS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_IDS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_LABELS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_DISPOSITIONS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MANUAL_APPLY_CANDIDATES,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MEDIA_TYPES,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_CLEAN_WORKSPACE_BEFORE_APPLY,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_MANUAL_REVIEW,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REVIEW_INSTRUCTIONS,
  APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_TYPES,
  APPLY_PLAN_FOLLOW_UP_COMMAND_POLICIES,
  APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS,
  APPLY_PLAN_FORBIDDEN_FLAGS,
  argsEndWith,
  argsStartWith,
  commandArgCheck,
} from "./skill-proposals-apply-commands.mjs";

function applyPreconditionsForCommandKey(commandKey) {
  const ids = APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_IDS[commandKey] || [];
  const labels = APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_LABELS[commandKey] || [];
  return ids.map((id, index) => ({
    id,
    label: labels[index] || id,
    required: true,
  }));
}

function applyPreconditionIsSatisfied(precondition) {
  return precondition?.satisfied === true;
}

function manualApplyBlockedReason({ manualApplyCandidate, requiredPendingApplyPreconditionCount }) {
  if (!manualApplyCandidate) {
    return {
      code: "not-manual-apply-candidate",
      message: "This output artifact is review-only and cannot be applied.",
    };
  }
  if (requiredPendingApplyPreconditionCount > 0) {
    return {
      code: "required-preconditions-pending",
      message: "Complete required apply preconditions before applying this patch preview.",
    };
  }
  return { code: "", message: "" };
}

function manualApplyStatus({ manualApplyCandidate, manualApplyReady }) {
  if (manualApplyReady) return "ready";
  if (manualApplyCandidate) return "blocked";
  return "not-applicable";
}

function manualApplyStatusLabel(status) {
  if (status === "ready") return "Ready to apply";
  if (status === "blocked") return "Blocked";
  return "Review only";
}

function manualApplyStatusTone(status) {
  if (status === "ready") return "success";
  if (status === "blocked") return "warning";
  return "neutral";
}

export function buildApplyPlanCommandContract(followUpCommands, reviewFile) {
  const requiredKeys = Object.keys(APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS);
  const commandArgs = Object.fromEntries(Object.entries(followUpCommands).map(([key, value]) => [
    key,
    Array.isArray(value?.commandArgs) ? value.commandArgs : [],
  ]));
  const missingCommandKeys = requiredKeys.filter((key) => !Array.isArray(commandArgs[key]) || commandArgs[key].length === 0);
  const unexpectedCommandKeys = Object.keys(commandArgs).filter((key) => !requiredKeys.includes(key));
  const checks = [
    commandArgCheck({
      id: "required-command-keys-present",
      passed: missingCommandKeys.length === 0,
      message: missingCommandKeys.length === 0
        ? "All required apply-plan follow-up commands are present."
        : "Some required apply-plan follow-up commands are missing.",
      evidence: { requiredKeys, missingCommandKeys },
    }),
    commandArgCheck({
      id: "no-unexpected-command-keys",
      passed: unexpectedCommandKeys.length === 0,
      message: unexpectedCommandKeys.length === 0
        ? "No unexpected apply-plan follow-up commands are present."
        : "Unexpected apply-plan follow-up command keys were found.",
      evidence: { unexpectedCommandKeys },
    }),
  ];

  for (const key of requiredKeys) {
    const args = commandArgs[key] || [];
    const reviewFileIndex = args.indexOf("--review-file");
    checks.push(commandArgCheck({
      id: `${key}-base-command`,
      passed: argsStartWith(args, APPLY_PLAN_BASE_COMMAND),
      message: `${key} starts with design-ai learn --propose-skills.`,
      evidence: { commandArgs: args.slice(0, APPLY_PLAN_BASE_COMMAND.length) },
    }));
    checks.push(commandArgCheck({
      id: `${key}-review-file-context`,
      passed: Boolean(reviewFile) && reviewFileIndex >= 0 && args[reviewFileIndex + 1] === reviewFile,
      message: `${key} preserves the configured review file.`,
      evidence: { reviewFile, commandReviewFile: reviewFileIndex >= 0 ? args[reviewFileIndex + 1] || "" : "" },
    }));
    checks.push(commandArgCheck({
      id: `${key}-expected-suffix`,
      passed: argsEndWith(args, APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS[key]),
      message: `${key} ends with the expected action flags.`,
      evidence: { expectedSuffix: APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS[key], actualSuffix: args.slice(-APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS[key].length) },
    }));
    checks.push(commandArgCheck({
      id: `${key}-read-only-flags`,
      passed: APPLY_PLAN_FORBIDDEN_FLAGS.every((flag) => !args.includes(flag)),
      message: `${key} does not include write/apply confirmation flags.`,
      evidence: { forbiddenFlags: APPLY_PLAN_FORBIDDEN_FLAGS },
    }));
  }

  const failures = checks.filter((check) => check.level === "fail").length;
  const warnings = checks.filter((check) => check.level === "warn").length;
  const passes = checks.filter((check) => check.level === "pass").length;
  const checkCount = checks.length;
  const failedChecks = checks
    .filter((check) => check.level === "fail")
    .map((check) => ({
      id: check.id,
      message: check.message,
      evidence: check.evidence || {},
    }));
  const nextCommandKey = failures > 0 ? "" : "reviewCheckJson";
  const nextCommand = nextCommandKey ? followUpCommands[nextCommandKey]?.command || "" : "";
  const nextCommandArgs = nextCommandKey ? commandArgs[nextCommandKey] || [] : [];
  const nextCommandRunPolicy = nextCommandKey ? "preview-only" : "";
  const nextCommandSafety = nextCommandKey
    ? {
      level: "read-only",
      writesLocalFiles: false,
      mutatesLocalState: false,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      reason: "The next apply-plan follow-up command only checks proposal review readiness and does not mutate local state.",
    }
    : {};
  const commandSequence = failures > 0
    ? []
    : requiredKeys.map((key, index) => {
      const writesOutputArtifact = key === "reviewCheckReport" || key === "proposalPatchPreview";
      return {
        step: index + 1,
        key,
        command: followUpCommands[key]?.command || "",
        commandArgs: commandArgs[key] || [],
        runPolicy: APPLY_PLAN_FOLLOW_UP_COMMAND_POLICIES[key] || "preview-only",
        safety: {
          level: writesOutputArtifact ? "local-output" : "read-only",
          writesLocalFiles: writesOutputArtifact,
          writesOutputArtifact,
          mutatesLocalState: writesOutputArtifact,
          mutatesProfile: false,
          mutatesReviewFile: false,
          mutatesSkillFiles: false,
          callsExternalAiApis: false,
          requiresCleanWorkspace: false,
          reason: writesOutputArtifact
            ? "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files."
            : "This follow-up command validates readiness without writing local files or mutating local state.",
        },
      };
    });
  const commandSequenceSummary = {
    executable: failures === 0,
    blocked: failures > 0,
    stepCount: commandSequence.length,
    readOnlyStepCount: commandSequence.filter((item) => item.safety?.level === "read-only").length,
    localOutputStepCount: commandSequence.filter((item) => item.safety?.level === "local-output").length,
    writesLocalFiles: commandSequence.some((item) => Boolean(item.safety?.writesLocalFiles)),
    writesOutputArtifacts: commandSequence.some((item) => Boolean(item.safety?.writesOutputArtifact)),
    mutatesProfile: commandSequence.some((item) => Boolean(item.safety?.mutatesProfile)),
    mutatesReviewFile: commandSequence.some((item) => Boolean(item.safety?.mutatesReviewFile)),
    mutatesSkillFiles: commandSequence.some((item) => Boolean(item.safety?.mutatesSkillFiles)),
    callsExternalAiApis: commandSequence.some((item) => Boolean(item.safety?.callsExternalAiApis)),
    requiresCleanWorkspace: commandSequence.some((item) => Boolean(item.safety?.requiresCleanWorkspace)),
    runPolicy: failures > 0 ? "blocked" : "mixed-preview-local-output",
    reason: failures > 0
      ? "Command contract failures must be fixed before running follow-up commands."
      : "The sequence combines read-only readiness checks with local output artifact previews; it does not mutate learning, review, or skill files.",
  };
  const commandSequenceKeys = commandSequence.map((item) => item.key);
  const commandSequenceByKey = Object.fromEntries(commandSequence.map((item) => [item.key, item]));
  const operatorRunbookStages = failures > 0
    ? []
    : [
      {
        step: 1,
        key: "previewArtifacts",
        label: "Generate optional review artifacts",
        kind: "local-output-preview",
        required: false,
        commandKeys: ["reviewCheckReport", "proposalPatchPreview"],
        commands: ["reviewCheckReport", "proposalPatchPreview"].map((key) => commandSequenceByKey[key]),
        reason: "Optional Markdown review and patch preview artifacts can be generated before manual skill edits.",
      },
      {
        step: 2,
        key: "manualSkillEdit",
        label: "Apply accepted skill deltas manually",
        kind: "manual-review",
        required: true,
        commandKeys: [],
        commands: [],
        reason: "No apply-plan command mutates skill files; the operator must manually edit accepted skill deltas after review.",
      },
      {
        step: 3,
        key: "reviewReadiness",
        label: "Run review readiness check",
        kind: "read-only-check",
        required: true,
        commandKeys: ["reviewCheckJson"],
        commands: [commandSequenceByKey.reviewCheckJson],
        reason: "Run the read-only review check after manual skill edits to verify proposal review state.",
      },
      {
        step: 4,
        key: "strictGate",
        label: "Run strict readiness gate",
        kind: "read-only-gate",
        required: true,
        commandKeys: ["strictGate"],
        commands: [commandSequenceByKey.strictGate],
        reason: "Run the strict gate before marking accepted proposals applied.",
      },
    ];
  const operatorRunbookStageKeys = operatorRunbookStages.map((stage) => stage.key);
  const operatorRunbookStageByKey = Object.fromEntries(operatorRunbookStages.map((stage) => [stage.key, stage]));
  const summarizeOperatorRunbookStage = (stage) => {
    if (!stage) return {};
    const commandSafetyItems = stage.commands
      .map((command) => command?.safety)
      .filter((safety) => safety && typeof safety === "object");
    const writesLocalFiles = commandSafetyItems.some((safety) => Boolean(safety.writesLocalFiles));
    const writesOutputArtifacts = commandSafetyItems.some((safety) => Boolean(safety.writesOutputArtifact));
    const mutatesLocalState = commandSafetyItems.some((safety) => Boolean(safety.mutatesLocalState));
    const mutatesProfile = commandSafetyItems.some((safety) => Boolean(safety.mutatesProfile));
    const mutatesReviewFile = commandSafetyItems.some((safety) => Boolean(safety.mutatesReviewFile));
    const mutatesSkillFiles = commandSafetyItems.some((safety) => Boolean(safety.mutatesSkillFiles));
    const callsExternalAiApis = commandSafetyItems.some((safety) => Boolean(safety.callsExternalAiApis));
    const requiresCleanWorkspace = commandSafetyItems.some((safety) => Boolean(safety.requiresCleanWorkspace));
    return {
      key: stage.key,
      step: stage.step,
      label: stage.label,
      kind: stage.kind,
      required: stage.required,
      hasCommands: stage.commandKeys.length > 0,
      commandCount: stage.commandKeys.length,
      commandKeys: stage.commandKeys,
      writesLocalFiles,
      writesOutputArtifacts,
      mutatesLocalState,
      mutatesProfile,
      mutatesReviewFile,
      mutatesSkillFiles,
      callsExternalAiApis,
      requiresCleanWorkspace,
      reason: stage.reason,
    };
  };
  const nextStage = failures > 0
    ? null
    : operatorRunbookStageByKey.previewArtifacts || null;
  const nextRequiredStage = failures > 0
    ? null
    : operatorRunbookStages.find((stage) => stage.required) || null;
  const nextRequiredCommandStage = failures > 0
    ? null
    : operatorRunbookStages.find((stage) => stage.required && stage.commandKeys.length > 0) || null;
  const nextStageSummary = summarizeOperatorRunbookStage(nextStage);
  const nextRequiredStageSummary = summarizeOperatorRunbookStage(nextRequiredStage);
  const nextRequiredCommandStageSummary = summarizeOperatorRunbookStage(nextRequiredCommandStage);
  const summarizeDecisionCommand = (command) => command
    ? {
      step: command.step,
      key: command.key,
      command: command.command,
      commandArgs: command.commandArgs,
      runPolicy: command.runPolicy,
      safetyLevel: command.safety?.level || "",
      safety: {
        level: command.safety?.level || "",
        writesLocalFiles: Boolean(command.safety?.writesLocalFiles),
        writesOutputArtifact: Boolean(command.safety?.writesOutputArtifact),
        mutatesLocalState: Boolean(command.safety?.mutatesLocalState),
        mutatesProfile: Boolean(command.safety?.mutatesProfile),
        mutatesReviewFile: Boolean(command.safety?.mutatesReviewFile),
        mutatesSkillFiles: Boolean(command.safety?.mutatesSkillFiles),
        callsExternalAiApis: Boolean(command.safety?.callsExternalAiApis),
        requiresCleanWorkspace: Boolean(command.safety?.requiresCleanWorkspace),
        reason: command.safety?.reason || "",
      },
      writesLocalFiles: Boolean(command.safety?.writesLocalFiles),
      writesOutputArtifact: Boolean(command.safety?.writesOutputArtifact),
      mutatesLocalState: Boolean(command.safety?.mutatesLocalState),
      mutatesProfile: Boolean(command.safety?.mutatesProfile),
      mutatesReviewFile: Boolean(command.safety?.mutatesReviewFile),
      mutatesSkillFiles: Boolean(command.safety?.mutatesSkillFiles),
      callsExternalAiApis: Boolean(command.safety?.callsExternalAiApis),
      requiresCleanWorkspace: Boolean(command.safety?.requiresCleanWorkspace),
    }
    : {};
  const decisionCommands = failures > 0
    ? []
    : (nextStage?.commands || []).map((command) => summarizeDecisionCommand(command));
  const decisionCommandByKey = Object.fromEntries(decisionCommands.map((command) => [command.key, command]));
  const decisionCommandStepByKey = Object.fromEntries(decisionCommands.map((command) => [command.key, command.step]));
  const decisionCommandRunPolicyByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.runPolicy]),
  );
  const decisionCommandSafetyLevelByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.safetyLevel]),
  );
  const decisionCommandArgsByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.commandArgs]),
  );
  const decisionCommandStringByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.command]),
  );
  const decisionCommandDisplayLabelByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_DISPLAY_LABELS[command.key] || command.key,
    ]),
  );
  const decisionCommandDescriptionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_DESCRIPTIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACTS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactTypeByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_TYPES[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactActionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_ACTIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactMediaTypeByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MEDIA_TYPES[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactDispositionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_DISPOSITIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactManualApplyCandidateByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MANUAL_APPLY_CANDIDATES[command.key] || false,
    ]),
  );
  const decisionCommandOutputArtifactRequiresManualReviewByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_MANUAL_REVIEW[command.key] || false,
    ]),
  );
  const decisionCommandOutputArtifactReviewInstructionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REVIEW_INSTRUCTIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_CLEAN_WORKSPACE_BEFORE_APPLY[command.key] || false,
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionIdsByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      [...(APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_IDS[command.key] || [])],
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionLabelsByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      [...(APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_LABELS[command.key] || [])],
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionsByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      applyPreconditionsForCommandKey(command.key),
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      decisionCommandOutputArtifactApplyPreconditionsByKey[command.key]?.length || 0,
    ]),
  );
  const decisionCommandOutputArtifactRequiredApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => precondition.required).length,
    ]),
  );
  const decisionCommandOutputArtifactSatisfiedApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => applyPreconditionIsSatisfied(precondition)).length,
    ]),
  );
  const decisionCommandOutputArtifactPendingApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => !applyPreconditionIsSatisfied(precondition)).length,
    ]),
  );
  const decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => precondition.required && !applyPreconditionIsSatisfied(precondition)).length,
    ]),
  );
  const decisionCommandOutputArtifactManualApplyReadyByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key])
        && (decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[command.key] || 0) === 0,
    ]),
  );
  const decisionCommandOutputArtifactManualApplyStatusByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyStatus({
        manualApplyCandidate: Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key]),
        manualApplyReady: Boolean(decisionCommandOutputArtifactManualApplyReadyByKey[command.key]),
      }),
    ]),
  );
  const decisionCommandOutputArtifactManualApplyStatusLabelByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyStatusLabel(decisionCommandOutputArtifactManualApplyStatusByKey[command.key]),
    ]),
  );
  const decisionCommandOutputArtifactManualApplyStatusToneByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyStatusTone(decisionCommandOutputArtifactManualApplyStatusByKey[command.key]),
    ]),
  );
  const decisionCommandOutputArtifactManualApplyBlockedReasonByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyBlockedReason({
        manualApplyCandidate: Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key]),
        requiredPendingApplyPreconditionCount: decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[command.key] || 0,
      }).message,
    ]),
  );
  const decisionCommandOutputArtifactManualApplyBlockedReasonCodeByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyBlockedReason({
        manualApplyCandidate: Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key]),
        requiredPendingApplyPreconditionCount: decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[command.key] || 0,
      }).code,
    ]),
  );
  const decisionNextCommand = decisionCommands[0] || {};
  const decisionNextCommandDisplayLabel = decisionNextCommand.key
    ? decisionCommandDisplayLabelByKey[decisionNextCommand.key] || decisionNextCommand.key
    : "";
  const decisionNextCommandDescription = decisionNextCommand.key
    ? decisionCommandDescriptionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifact = decisionNextCommand.key
    ? decisionCommandOutputArtifactByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactType = decisionNextCommand.key
    ? decisionCommandOutputArtifactTypeByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactAction = decisionNextCommand.key
    ? decisionCommandOutputArtifactActionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactMediaType = decisionNextCommand.key
    ? decisionCommandOutputArtifactMediaTypeByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactDisposition = decisionNextCommand.key
    ? decisionCommandOutputArtifactDispositionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactManualApplyCandidate = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyCandidateByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactRequiresManualReview = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiresManualReviewByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactReviewInstruction = decisionNextCommand.key
    ? decisionCommandOutputArtifactReviewInstructionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactApplyPreconditionIds = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionIdsByKey[decisionNextCommand.key] || []
    : [];
  const decisionNextCommandOutputArtifactApplyPreconditionLabels = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionLabelsByKey[decisionNextCommand.key] || []
    : [];
  const decisionNextCommandOutputArtifactApplyPreconditions = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionsByKey[decisionNextCommand.key] || []
    : [];
  const decisionNextCommandOutputArtifactApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactRequiredApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiredApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactSatisfiedApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactSatisfiedApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactPendingApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactPendingApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactRequiredPendingApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactManualApplyReady = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyReadyByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactManualApplyStatus = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyStatusByKey[decisionNextCommand.key] || "not-applicable"
    : "not-applicable";
  const decisionNextCommandOutputArtifactManualApplyStatusLabel = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyStatusLabelByKey[decisionNextCommand.key] || "Review only"
    : "Review only";
  const decisionNextCommandOutputArtifactManualApplyStatusTone = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyStatusToneByKey[decisionNextCommand.key] || "neutral"
    : "neutral";
  const decisionNextCommandOutputArtifactManualApplyBlockedReason = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyBlockedReasonByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactManualApplyBlockedReasonCode = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyBlockedReasonCodeByKey[decisionNextCommand.key] || ""
    : "";
  const operatorRunbookStageSelection = failures > 0
    ? {}
    : {
      strategy: "optional-preview-before-required-manual-edit",
      decision: {
        action: "offer-optional-preview",
        stageKey: "previewArtifacts",
        stageKind: "local-output-preview",
        required: false,
        hasCommands: true,
        commandCount: decisionCommands.length,
        commandKeys: ["reviewCheckReport", "proposalPatchPreview"],
        commands: decisionCommands,
        commandByKey: decisionCommandByKey,
        commandStepByKey: decisionCommandStepByKey,
        commandRunPolicyByKey: decisionCommandRunPolicyByKey,
        commandSafetyLevelByKey: decisionCommandSafetyLevelByKey,
        commandArgsByKey: decisionCommandArgsByKey,
        commandStringByKey: decisionCommandStringByKey,
        commandDisplayLabelByKey: decisionCommandDisplayLabelByKey,
        commandDescriptionByKey: decisionCommandDescriptionByKey,
        commandOutputArtifactByKey: decisionCommandOutputArtifactByKey,
        commandOutputArtifactTypeByKey: decisionCommandOutputArtifactTypeByKey,
        commandOutputArtifactActionByKey: decisionCommandOutputArtifactActionByKey,
        commandOutputArtifactMediaTypeByKey: decisionCommandOutputArtifactMediaTypeByKey,
        commandOutputArtifactDispositionByKey: decisionCommandOutputArtifactDispositionByKey,
        commandOutputArtifactManualApplyCandidateByKey: decisionCommandOutputArtifactManualApplyCandidateByKey,
        commandOutputArtifactRequiresManualReviewByKey: decisionCommandOutputArtifactRequiresManualReviewByKey,
        commandOutputArtifactReviewInstructionByKey: decisionCommandOutputArtifactReviewInstructionByKey,
        commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey: decisionCommandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey,
        commandOutputArtifactApplyPreconditionIdsByKey: decisionCommandOutputArtifactApplyPreconditionIdsByKey,
        commandOutputArtifactApplyPreconditionLabelsByKey: decisionCommandOutputArtifactApplyPreconditionLabelsByKey,
        commandOutputArtifactApplyPreconditionsByKey: decisionCommandOutputArtifactApplyPreconditionsByKey,
        commandOutputArtifactApplyPreconditionCountByKey: decisionCommandOutputArtifactApplyPreconditionCountByKey,
        commandOutputArtifactRequiredApplyPreconditionCountByKey: decisionCommandOutputArtifactRequiredApplyPreconditionCountByKey,
        commandOutputArtifactSatisfiedApplyPreconditionCountByKey: decisionCommandOutputArtifactSatisfiedApplyPreconditionCountByKey,
        commandOutputArtifactPendingApplyPreconditionCountByKey: decisionCommandOutputArtifactPendingApplyPreconditionCountByKey,
        commandOutputArtifactRequiredPendingApplyPreconditionCountByKey: decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey,
        commandOutputArtifactManualApplyReadyByKey: decisionCommandOutputArtifactManualApplyReadyByKey,
        commandOutputArtifactManualApplyStatusByKey: decisionCommandOutputArtifactManualApplyStatusByKey,
        commandOutputArtifactManualApplyStatusLabelByKey: decisionCommandOutputArtifactManualApplyStatusLabelByKey,
        commandOutputArtifactManualApplyStatusToneByKey: decisionCommandOutputArtifactManualApplyStatusToneByKey,
        commandOutputArtifactManualApplyBlockedReasonByKey: decisionCommandOutputArtifactManualApplyBlockedReasonByKey,
        commandOutputArtifactManualApplyBlockedReasonCodeByKey: decisionCommandOutputArtifactManualApplyBlockedReasonCodeByKey,
        nextCommandEntry: decisionNextCommand,
        nextCommandKey: decisionNextCommand.key || "",
        nextCommandDisplayLabel: decisionNextCommandDisplayLabel,
        nextCommandDescription: decisionNextCommandDescription,
        nextCommandOutputArtifact: decisionNextCommandOutputArtifact,
        nextCommandOutputArtifactType: decisionNextCommandOutputArtifactType,
        nextCommandOutputArtifactAction: decisionNextCommandOutputArtifactAction,
        nextCommandOutputArtifactMediaType: decisionNextCommandOutputArtifactMediaType,
        nextCommandOutputArtifactDisposition: decisionNextCommandOutputArtifactDisposition,
        nextCommandOutputArtifactManualApplyCandidate: decisionNextCommandOutputArtifactManualApplyCandidate,
        nextCommandOutputArtifactRequiresManualReview: decisionNextCommandOutputArtifactRequiresManualReview,
        nextCommandOutputArtifactReviewInstruction: decisionNextCommandOutputArtifactReviewInstruction,
        nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply: decisionNextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply,
        nextCommandOutputArtifactApplyPreconditionIds: decisionNextCommandOutputArtifactApplyPreconditionIds,
        nextCommandOutputArtifactApplyPreconditionLabels: decisionNextCommandOutputArtifactApplyPreconditionLabels,
        nextCommandOutputArtifactApplyPreconditions: decisionNextCommandOutputArtifactApplyPreconditions,
        nextCommandOutputArtifactApplyPreconditionCount: decisionNextCommandOutputArtifactApplyPreconditionCount,
        nextCommandOutputArtifactRequiredApplyPreconditionCount: decisionNextCommandOutputArtifactRequiredApplyPreconditionCount,
        nextCommandOutputArtifactSatisfiedApplyPreconditionCount: decisionNextCommandOutputArtifactSatisfiedApplyPreconditionCount,
        nextCommandOutputArtifactPendingApplyPreconditionCount: decisionNextCommandOutputArtifactPendingApplyPreconditionCount,
        nextCommandOutputArtifactRequiredPendingApplyPreconditionCount: decisionNextCommandOutputArtifactRequiredPendingApplyPreconditionCount,
        nextCommandOutputArtifactManualApplyReady: decisionNextCommandOutputArtifactManualApplyReady,
        nextCommandOutputArtifactManualApplyStatus: decisionNextCommandOutputArtifactManualApplyStatus,
        nextCommandOutputArtifactManualApplyStatusLabel: decisionNextCommandOutputArtifactManualApplyStatusLabel,
        nextCommandOutputArtifactManualApplyStatusTone: decisionNextCommandOutputArtifactManualApplyStatusTone,
        nextCommandOutputArtifactManualApplyBlockedReason: decisionNextCommandOutputArtifactManualApplyBlockedReason,
        nextCommandOutputArtifactManualApplyBlockedReasonCode: decisionNextCommandOutputArtifactManualApplyBlockedReasonCode,
        nextCommandStep: decisionNextCommand.step || 0,
        nextCommand: decisionNextCommand.command || "",
        nextCommandArgs: decisionNextCommand.commandArgs || [],
        nextCommandRunPolicy: decisionNextCommand.runPolicy || "",
        nextCommandSafetyLevel: decisionNextCommand.safetyLevel || "",
        nextCommandSafety: decisionNextCommand.safety || {},
        runPolicy: "optional-local-output-preview",
        safety: {
          level: nextStageSummary.writesLocalFiles ? "local-output" : "read-only",
          writesLocalFiles: nextStageSummary.writesLocalFiles,
          writesOutputArtifacts: nextStageSummary.writesOutputArtifacts,
          mutatesLocalState: nextStageSummary.mutatesLocalState,
          mutatesProfile: nextStageSummary.mutatesProfile,
          mutatesReviewFile: nextStageSummary.mutatesReviewFile,
          mutatesSkillFiles: nextStageSummary.mutatesSkillFiles,
          callsExternalAiApis: nextStageSummary.callsExternalAiApis,
          requiresCleanWorkspace: nextStageSummary.requiresCleanWorkspace,
          reason: "The selected decision only writes optional local preview artifacts and does not mutate learning, review, or skill files.",
        },
        nextRequiredStageKey: nextRequiredStage?.key || "",
        nextRequiredCommandStageKey: nextRequiredCommandStage?.key || "",
        requiresOperatorActionBeforeRequiredCommands: true,
        reason: "Offer optional local preview artifacts first; the required path still starts with manual skill edits before read-only command gates.",
      },
      stageOrder: operatorRunbookStageKeys,
      nextStageKey: "previewArtifacts",
      nextStageCommandKeys: ["reviewCheckReport", "proposalPatchPreview"],
      nextStage: nextStageSummary,
      nextRequiredStageKey: nextRequiredStage?.key || "",
      nextRequiredStageCommandKeys: nextRequiredStage?.commandKeys || [],
      nextRequiredStage: nextRequiredStageSummary,
      nextRequiredCommandStageKey: nextRequiredCommandStage?.key || "",
      nextRequiredCommandStageCommandKeys: nextRequiredCommandStage?.commandKeys || [],
      nextRequiredCommandStage: nextRequiredCommandStageSummary,
      reason: "Offer optional local preview artifacts first, then require the manual skill edit before read-only review and strict gates.",
    };
  const operatorRunbook = {
    version: 1,
    executable: failures === 0,
    blocked: failures > 0,
    stageCount: operatorRunbookStages.length,
    requiredStageCount: operatorRunbookStages.filter((stage) => stage.required).length,
    commandStageCount: operatorRunbookStages.filter((stage) => stage.commandKeys.length > 0).length,
    nextStageKey: failures > 0 ? "" : "previewArtifacts",
    nextStageCommandKeys: failures > 0 ? [] : ["reviewCheckReport", "proposalPatchPreview"],
    nextRequiredStageKey: nextRequiredStage?.key || "",
    nextRequiredStageCommandKeys: nextRequiredStage?.commandKeys || [],
    nextRequiredCommandStageKey: nextRequiredCommandStage?.key || "",
    nextRequiredCommandStageCommandKeys: nextRequiredCommandStage?.commandKeys || [],
    stageSelection: operatorRunbookStageSelection,
    stageKeys: operatorRunbookStageKeys,
    stageByKey: operatorRunbookStageByKey,
    stages: operatorRunbookStages,
    reason: failures > 0
      ? "Command contract failures must be fixed before running the operator runbook."
      : "Generate optional local review artifacts, apply accepted skill deltas manually, then run read-only review and strict readiness gates.",
  };
  return {
    version: 1,
    valid: failures === 0,
    status: failures > 0 ? "fail" : "pass",
    commandCount: Object.keys(commandArgs).length,
    requiredKeys,
    missingCommandKeys,
    unexpectedCommandKeys,
    baseCommand: [...APPLY_PLAN_BASE_COMMAND],
    reviewFileRequired: true,
    reviewFile,
    forbiddenFlags: [...APPLY_PLAN_FORBIDDEN_FLAGS],
    checkCount,
    passCount: passes,
    warningCount: warnings,
    failureCount: failures,
    failedCheckIds: failedChecks.map((check) => check.id),
    failedChecks,
    nextCommandKey,
    nextCommand,
    nextCommandArgs,
    nextCommandRunPolicy,
    nextCommandSafety,
    commandSequenceCount: commandSequence.length,
    commandSequence,
    commandSequenceSummary,
    commandSequenceKeys,
    commandSequenceByKey,
    operatorRunbook,
    nextAction: failures > 0
      ? "Fix command contract failures before running follow-up commands."
      : "Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
    checks,
    summary: {
      failures,
      warnings,
      passes,
      total: checkCount,
    },
  };
}
