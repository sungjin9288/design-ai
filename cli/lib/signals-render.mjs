// Markdown renderers for the learning signal registry and agent backlog reports.

import { summarizeAgentBacklogCommandEffects } from "./signals-backlog-commands.mjs";
import {
  renderOptionalGapDetails,
  renderReadinessCheckIndex,
} from "./signals-readiness.mjs";
import { listItem, yesNo } from "./signals-shared.mjs";

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
  ];

  const readiness = payload.readiness && typeof payload.readiness === "object" ? payload.readiness : null;
  if (readiness) {
    lines.push(
      "",
      "## Signal Readiness",
      "",
      listItem("Status", readiness.status || payload.signalStatus || "unknown"),
      listItem("Summary", readiness.summary || ""),
      listItem("Required ready", yesNo(Boolean(readiness.requiredReady))),
      listItem("Required checks", `${readiness.requiredPassCount ?? 0}/${readiness.requiredCount ?? 0}`),
      listItem("Blocking checks", readiness.blockingCount ?? 0),
      listItem("Optional gaps", readiness.optionalGapCount ?? 0),
    );
    const checks = Array.isArray(readiness.checks) ? readiness.checks : [];
    renderReadinessCheckIndex(lines, readiness);
    if (checks.length > 0) {
      lines.push("", "Readiness checks:");
      for (const check of checks) {
        const required = check.required ? "required" : "optional";
        lines.push(`- ${check.id || "unknown"} [${required}] ${check.status || "unknown"}: ${check.summary || ""}`);
      }
    }
    renderOptionalGapDetails(lines, readiness);
  }

  lines.push("", "## Backlog Actions", "");

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
  renderReadinessCheckIndex(lines, readiness);
  if (readinessChecks.length > 0) {
    lines.push("", "Readiness checks:");
    for (const check of readinessChecks) {
      const required = check.required ? "required" : "optional";
      lines.push(`- ${check.id || "unknown"} [${required}] ${check.status || "unknown"}: ${check.summary || ""}`);
    }
  }
  renderOptionalGapDetails(lines, readiness);

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
