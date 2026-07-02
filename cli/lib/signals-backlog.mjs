// Agent development backlog actions and action plan derived from local learning signals.

import {
  buildAgentBacklogExecutionQueue,
  classifyAgentBacklogCommand,
  summarizeAgentBacklogCommandSafety,
} from "./signals-backlog-commands.mjs";
import {
  defaultLearningEvalReportPath,
  evalReportPathForTemplate,
} from "./signals-eval.mjs";
import { commandFromArgs, commandSpec } from "./signals-shared.mjs";
import { defaultLearningEvalPath } from "./workspace.mjs";

export function agentAction({
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

export function agentDevelopmentStatus(actions) {
  if ((actions || []).some((item) => item.priority === "p0")) return "fail";
  if ((actions || []).some((item) => item.priority === "p1")) return "warn";
  return "pass";
}

export function buildAgentBacklogActionPlan({ actions = [], commands = {}, privacy = {} } = {}) {
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

export function buildAgentDevelopmentBacklog({
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
