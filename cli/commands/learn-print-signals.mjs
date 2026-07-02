// Human-readable output for learn signals/agent-backlog/skill-proposal results.

import path from "node:path";

import { dim, header, info } from "../lib/log.mjs";

export function printSignals(payload) {
  header("design-ai learn", "Learning signal registry");
  info(`File: ${payload.file}`);
  info(`Status: ${payload.status}`);
  info(`Signal source: ${payload.signalSource}`);
  info(`Learning entries: ${payload.learning.count}`);
  info(`Learning audit: ${payload.learning.auditSummary.status} (${payload.learning.auditSummary.failures} failure(s), ${payload.learning.auditSummary.warnings} warning(s))`);
  info(`Usage events: ${payload.usage.eventCount}`);
  info(`Eval signals: ${payload.evals.count} (${payload.evals.reports} report(s), ${payload.evals.templates} template(s))`);
  info(`Check capture entries: ${payload.checkCapture.count}`);
  info(`Workspace next actions: ${payload.workspace.nextActionCount}`);
  console.log();

  if (payload.evals.files.length > 0) {
    console.log("Eval signals:");
    for (const item of payload.evals.files) {
      const label = path.basename(item.file);
      const counts = item.shape === "report"
        ? ` · pass ${item.passed} / warn ${item.warned} / fail ${item.failed}`
        : "";
      console.log(`- ${label}: ${item.kind} ${item.shape} ${item.status} (${item.caseCount} case(s))${counts}`);
      if (item.error) console.log(`  ${dim(item.error)}`);
    }
    console.log();
  }

  if (payload.checkCapture.latestEntries.length > 0) {
    console.log("Recent check captures:");
    for (const entry of payload.checkCapture.latestEntries) {
      console.log(`- ${entry.id}: [${entry.category}] ${entry.source}`);
      if (entry.textPreview) console.log(`  ${dim(entry.textPreview)}`);
    }
    console.log();
  }

  console.log("Workspace readiness:");
  console.log(`- branch: ${payload.workspace.git.branch || "unknown"} (${payload.workspace.git.clean ? "clean" : "dirty"})`);
  console.log(`- repository: ${payload.workspace.repository.status || "unknown"}`);
  console.log(`- learning usage: ${payload.workspace.learningUsage?.status || "not checked"}`);
  console.log(`- learning eval: ${payload.workspace.learningEval?.status || "not checked"}`);
  console.log();

  if (payload.agentDevelopment?.actions?.length > 0) {
    console.log("Agent development backlog:");
    for (const action of payload.agentDevelopment.actions.slice(0, 6)) {
      console.log(`- ${action.rank}. ${action.priority} ${action.category}: ${action.title}`);
      if (action.command) console.log(`  ${dim(action.command)}`);
    }
    console.log();
  }

  if (payload.recommendations.length > 0) {
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
    console.log();
  }

  console.log("Privacy: signal registry is read-only and does not mutate learning.json.");
}

export function printAgentBacklog(payload) {
  header("design-ai learn", "Agent development backlog");
  info(`File: ${payload.file}`);
  info(`Status: ${payload.status}`);
  info(`Signal status: ${payload.signalStatus}`);
  info(`Signal source: ${payload.signalSource}`);
  info(`Actions: ${payload.counts.actions}`);
  info(`Priority: P0 ${payload.counts.p0}, P1 ${payload.counts.p1}, P2 ${payload.counts.p2}, P3 ${payload.counts.p3}`);
  info(`Learning entries: ${payload.counts.learningEntries}`);
  info(`Usage events: ${payload.counts.usageEvents}`);
  info(`Eval signals: ${payload.counts.evalSignals}`);
  info(`Check captures: ${payload.counts.checkCaptures}`);
  console.log();

  if (payload.actions.length === 0) {
    console.log("No agent development backlog actions emitted.");
  } else {
    console.log("Backlog actions:");
    for (const action of payload.actions) {
      console.log(`- ${action.rank}. ${action.priority} ${action.category}: ${action.title}`);
      console.log(`  ${dim(action.rationale)}`);
      if (action.command) console.log(`  ${dim(action.command)}`);
    }
  }

  const planSteps = Array.isArray(payload.actionPlan?.steps) ? payload.actionPlan.steps : [];
  if (planSteps.length > 0) {
    console.log();
    console.log("Action plan:");
    const safety = payload.actionPlan?.safetySummary;
    if (safety) {
      console.log(`  ${dim(`safety summary: ${safety.readOnly || 0} read-only, ${safety.writesLocalFile || 0} writes-local-file, ${safety.mutatesLocalState || 0} mutates-local-state`)}`);
    }
    const queue = payload.actionPlan?.executionQueue;
    if (queue) {
      console.log(`  ${dim(`execution queue: ${queue.previewCount || 0} preview, ${queue.fileWriteReviewCount || 0} file-write review, ${queue.mutationReviewCount || 0} mutation review`)}`);
      const effectSummary = queue.commandEffectSummary && typeof queue.commandEffectSummary === "object" ? queue.commandEffectSummary : null;
      if (effectSummary) {
        console.log(`  ${dim(`command effects: ${effectSummary.outputTargetCount || 0} output, ${effectSummary.profileTargetCount || 0} profile, ${effectSummary.usageTargetCount || 0} usage, ${effectSummary.mutationFlagCount || 0} mutation flags`)}`);
      }
      const effectReview = queue.commandEffectReview && typeof queue.commandEffectReview === "object" ? queue.commandEffectReview : null;
      if (effectReview?.headline) {
        console.log(`  ${dim(`command effect review: ${effectReview.headline}`)}`);
        const gatePhaseSummary = effectReview.gatePhaseSummary && typeof effectReview.gatePhaseSummary === "object" ? effectReview.gatePhaseSummary : null;
        if (gatePhaseSummary) {
          const phases = Array.isArray(gatePhaseSummary.phases) && gatePhaseSummary.phases.length > 0
            ? gatePhaseSummary.phases.join(", ")
            : "none";
          console.log(`  ${dim(`command effect gate phases: ${phases} (${gatePhaseSummary.requiredCount || 0}/${gatePhaseSummary.count || 0} required)`)}`);
        }
        const gateRunbook = effectReview.gateRunbook && typeof effectReview.gateRunbook === "object" ? effectReview.gateRunbook : null;
        if (gateRunbook) {
          const countFor = (phase) => Array.isArray(gateRunbook[phase]) ? gateRunbook[phase].length : 0;
          console.log(`  ${dim(`command effect gate runbook: before ${countFor("before")}, after ${countFor("after")}, refresh ${countFor("refresh")}`)}`);
        }
        const gateCommands = Array.isArray(effectReview.gateCommands) ? effectReview.gateCommands : [];
        if (gateCommands.length > 0) {
          const gateSummary = gateCommands
            .map((item) => `${item.phase || "gate"}: ${item.command || ""}`.trim())
            .filter((item) => item !== "")
            .slice(0, 3)
            .join(" -> ");
          console.log(`  ${dim(`command effect gates: ${gateSummary}`)}`);
        }
      }
      const operatorRunbook = queue.operatorRunbook && typeof queue.operatorRunbook === "object" ? queue.operatorRunbook : null;
      if (operatorRunbook) {
        console.log(`  ${dim(`operator runbook: ${operatorRunbook.stageCount || 0} stages, ${operatorRunbook.commandCount || 0} commands, ${operatorRunbook.requiredCommandCount || 0} required`)}`);
        if (operatorRunbook.nextCommand) {
          console.log(`  ${dim(`operator next command: ${operatorRunbook.nextStage || "unknown"}: ${operatorRunbook.nextCommand}`)}`);
        }
      }
      if (queue.nextActionId) console.log(`  ${dim(`next action: ${queue.nextActionId}`)}`);
      if (queue.nextCommand) console.log(`  ${dim(`next command: ${queue.nextCommand}`)}`);
      if (queue.nextCommandRunPolicy) console.log(`  ${dim(`next command policy: ${queue.nextCommandRunPolicy}`)}`);
      const ordered = Array.isArray(queue.ordered) ? queue.ordered : [];
      if (ordered.length > 0) {
        console.log(`  ${dim(`queue order: ${ordered.slice(0, 3).map((item) => item.actionId).join(" -> ")}`)}`);
      }
      const commandManifest = Array.isArray(queue.commandManifest) ? queue.commandManifest : [];
      if (commandManifest.length > 0) {
        console.log(`  ${dim(`command manifest: ${commandManifest.slice(0, 3).map((item) => {
          const effects = item.commandEffects && typeof item.commandEffects === "object" ? item.commandEffects : {};
          const targets = Array.isArray(effects.outputTargets) && effects.outputTargets.length > 0
            ? `:${effects.outputTargets.map((target) => target.value).join(",")}`
            : "";
          return `${item.actionId}:${item.runPolicy}${targets}`;
        }).join(" -> ")}`)}`);
      }
    }
    for (const step of planSteps.slice(0, 3)) {
      console.log(`- ${step.rank}. ${step.priority} ${step.category}: ${step.title}`);
      if (step.command) console.log(`  ${dim(step.command)}`);
      if (step.commandSafety?.level) console.log(`  ${dim(`safety: ${step.commandSafety.level}`)}`);
      console.log(`  ${dim(`requires mutation review: ${step.requiresReviewBeforeMutation ? "yes" : "no"}`)}`);
    }
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("Privacy: agent backlog is read-only, local, and does not mutate learning.json or skill files.");
}

export function printSkillProposals(payload) {
  header("design-ai learn", "Skill evolution proposals");
  info(`File: ${payload.file}`);
  info(`Status: ${payload.status}`);
  info(`Signal source: ${payload.signalSource}`);
  info(`Signal status: ${payload.signalStatus}`);
  info(`Min evidence: ${payload.minEvidenceCount}`);
  info(`Check capture entries: ${payload.checkCaptureCount}`);
  info(`Candidates: ${payload.candidateCount}`);
  info(`Proposals: ${payload.proposalCount}`);
  info(`Pending review: ${payload.pendingReviewCount ?? payload.proposalCount}`);
  info(`Reviewed: ${payload.reviewedCount ?? 0}`);
  info(`Skipped: ${payload.skippedCount}`);
  if (payload.review?.file) {
    info(`Review file: ${payload.review.file}`);
    info(`Review status: ${payload.review.status} (${payload.review.matchedCount} matched, ${payload.review.staleCount} stale)`);
  }
  console.log();

  if (payload.proposals.length === 0) {
    console.log("No repeated check-capture groups crossed the proposal threshold.");
  } else {
    console.log("Proposed skill deltas:");
    for (const proposal of payload.proposals) {
      const routes = proposal.routeIds.length > 0 ? proposal.routeIds.join(", ") : "artifact";
      console.log(`- ${proposal.id}: ${proposal.candidateSkillPath}`);
      console.log(`  ${dim(`${proposal.sourceIssueCount} issue(s) · ${proposal.category} · routes ${routes} · risk ${proposal.riskLevel} · review ${proposal.reviewStatus || "pending"}`)}`);
      if (proposal.reviewDecision?.note) console.log(`  Review note: ${proposal.reviewDecision.note}`);
      console.log(`  Delta: ${proposal.proposedInstructionDelta}`);
      console.log(`  Verify: ${proposal.verificationCommand}`);
      for (const evidence of proposal.evidenceSources.slice(0, 3)) {
        console.log(`  Evidence: ${evidence.entryId} [${evidence.category}] ${evidence.source}`);
        if (evidence.textPreview) console.log(`    ${dim(evidence.textPreview)}`);
      }
    }
  }

  if (payload.skipped.length > 0) {
    console.log();
    console.log("Skipped groups:");
    for (const item of payload.skipped) {
      console.log(`- ${item.candidateSkillPath} [${item.category}]: ${item.reason}`);
    }
  }

  if (payload.review?.warnings?.length > 0) {
    console.log();
    console.log("Review file warnings:");
    for (const warning of payload.review.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("No changes made. This command is preview-only and does not edit skill files or learning.json.");
}

export function printSkillProposalReviewCheck(payload) {
  header("design-ai learn", "Skill proposal review check");
  info(`File: ${payload.file}`);
  info(`Status: ${payload.status}`);
  info(`Proposal status: ${payload.proposalStatus}`);
  info(`Signal status: ${payload.signalStatus}`);
  info(`Review file: ${payload.reviewFile || "not configured"}`);
  info(`Proposals: ${payload.proposalCount}`);
  info(`Pending review: ${payload.pendingReviewCount}`);
  info(`Reviewed: ${payload.reviewedCount}`);
  console.log();

  console.log("Checks:");
  for (const check of payload.checks || []) {
    console.log(`- ${check.level}: ${check.id} - ${check.message}`);
  }

  if (payload.review?.warnings?.length > 0) {
    console.log();
    console.log("Review file warnings:");
    for (const warning of payload.review.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("Privacy: review check is read-only and does not mutate learning.json or skill files.");
}

export function printSkillProposalApplyPlan(payload) {
  header("design-ai learn", "Skill proposal apply plan");
  info(`File: ${payload.file}`);
  info(`Status: ${payload.status}`);
  info(`Proposal status: ${payload.proposalStatus}`);
  info(`Signal status: ${payload.signalStatus}`);
  info(`Review file: ${payload.reviewFile || "not configured"}`);
  info(`Accepted proposals: ${payload.acceptedCount}`);
  info(`Pending review: ${payload.pendingReviewCount}`);
  info(`Reviewed: ${payload.reviewedCount}`);
  console.log();

  if (!payload.tasks || payload.tasks.length === 0) {
    console.log("No accepted skill proposals are ready for manual apply.");
  } else {
    console.log("Manual apply tasks:");
    for (const task of payload.tasks) {
      const routes = Array.isArray(task.routeIds) && task.routeIds.length > 0 ? task.routeIds.join(", ") : "artifact";
      console.log(`- ${task.proposalId}: ${task.candidateSkillPath}`);
      console.log(`  ${dim(`${task.sourceIssueCount} issue(s) · ${task.category} · routes ${routes} · risk ${task.riskLevel}`)}`);
      if (task.reviewDecision?.note) console.log(`  Review note: ${task.reviewDecision.note}`);
      console.log(`  Delta: ${task.proposedInstructionDelta}`);
      console.log(`  Verify: ${task.verificationCommand}`);
      for (const step of task.manualSteps || []) {
        console.log(`  Step: ${step}`);
      }
    }
  }

  if (payload.commands) {
    console.log();
    console.log("Follow-up commands:");
    for (const [label, command] of Object.entries(payload.commands)) {
      console.log(`- ${label}: ${command}`);
    }
  }

  if (payload.commandContract) {
    const contract = payload.commandContract;
    console.log();
    console.log("Command contract:");
    console.log(`- valid: ${contract.valid ? "yes" : "no"}`);
    console.log(`- status: ${contract.status || "unknown"}`);
    console.log(`- required keys: ${(contract.requiredKeys || []).join(", ") || "none"}`);
    console.log(`- command count: ${contract.commandCount || 0}`);
    console.log(`- check count: ${contract.checkCount || 0}`);
    console.log(`- pass count: ${contract.passCount || 0}`);
    console.log(`- warning count: ${contract.warningCount || 0}`);
    console.log(`- review file required: ${contract.reviewFileRequired ? "yes" : "no"}`);
    console.log(`- forbidden flags: ${(contract.forbiddenFlags || []).join(", ") || "none"}`);
    console.log(`- failure count: ${contract.failureCount || 0}`);
    console.log(`- failed checks: ${(contract.failedCheckIds || []).join(", ") || "none"}`);
    console.log(`- next command key: ${contract.nextCommandKey || "none"}`);
    console.log(`- next command policy: ${contract.nextCommandRunPolicy || "none"}`);
    if (contract.nextCommandSafety?.level) {
      console.log(`- next command safety: ${contract.nextCommandSafety.level}`);
    }
    if (contract.nextCommand) {
      console.log(`- next command: ${contract.nextCommand}`);
    }
    console.log(`- command sequence count: ${contract.commandSequenceCount || 0}`);
    console.log(`- command sequence keys: ${(contract.commandSequenceKeys || []).join(", ") || "none"}`);
    const sequenceSummary = contract.commandSequenceSummary || {};
    console.log(`- command sequence policy: ${sequenceSummary.runPolicy || "none"}`);
    console.log(`- command sequence executable: ${sequenceSummary.executable ? "yes" : "no"}`);
    console.log(`- command sequence local outputs: ${sequenceSummary.localOutputStepCount || 0}`);
    console.log(`- command sequence mutates profile: ${sequenceSummary.mutatesProfile ? "yes" : "no"}`);
    console.log(`- command sequence mutates review file: ${sequenceSummary.mutatesReviewFile ? "yes" : "no"}`);
    console.log(`- command sequence mutates skill files: ${sequenceSummary.mutatesSkillFiles ? "yes" : "no"}`);
    console.log(`- command sequence calls external AI APIs: ${sequenceSummary.callsExternalAiApis ? "yes" : "no"}`);
    const operatorRunbook = contract.operatorRunbook || {};
    console.log(`- operator runbook stages: ${operatorRunbook.stageCount || 0}`);
    console.log(`- operator runbook keys: ${(operatorRunbook.stageKeys || []).join(", ") || "none"}`);
    console.log(`- operator runbook required stages: ${operatorRunbook.requiredStageCount || 0}`);
    console.log(`- operator runbook next stage: ${operatorRunbook.nextStageKey || "none"}`);
    console.log(`- operator runbook next required stage: ${operatorRunbook.nextRequiredStageKey || "none"}`);
    console.log(`- operator runbook next required command stage: ${operatorRunbook.nextRequiredCommandStageKey || "none"}`);
    if (operatorRunbook.stageSelection?.strategy) {
      console.log(`- operator runbook stage selection: ${operatorRunbook.stageSelection.strategy}`);
      if (operatorRunbook.stageSelection.decision?.action) {
        console.log(`- operator runbook decision: ${operatorRunbook.stageSelection.decision.action}`);
        if (operatorRunbook.stageSelection.decision.safety?.level) {
          console.log(`- operator runbook decision safety: ${operatorRunbook.stageSelection.decision.safety.level}`);
        }
        if (Array.isArray(operatorRunbook.stageSelection.decision.commands)) {
          console.log(`- operator runbook decision commands: ${operatorRunbook.stageSelection.decision.commands.map((command) => command.key).join(", ") || "none"}`);
        }
        if (operatorRunbook.stageSelection.decision.nextCommandKey) {
          console.log(`- operator runbook decision next command: ${operatorRunbook.stageSelection.decision.nextCommandKey}`);
        }
      }
      if (operatorRunbook.stageSelection.nextStage?.key) {
        const nextStageLabel = operatorRunbook.stageSelection.nextStage.required ? "required" : "optional";
        console.log(`- operator runbook selected stage: ${operatorRunbook.stageSelection.nextStage.key} (${nextStageLabel}, ${operatorRunbook.stageSelection.nextStage.kind})`);
      }
    }
    if (Array.isArray(contract.commandSequence) && contract.commandSequence.length > 0) {
      console.log("Command sequence:");
      for (const item of contract.commandSequence) {
        const safetyLevel = item.safety?.level || "unknown";
        console.log(`- ${item.step}. ${item.key}: ${item.runPolicy || "unknown"} / ${safetyLevel}`);
      }
    }
    if (Array.isArray(operatorRunbook.stages) && operatorRunbook.stages.length > 0) {
      console.log("Operator runbook:");
      for (const stage of operatorRunbook.stages) {
        const required = stage.required ? "required" : "optional";
        const commandKeys = Array.isArray(stage.commandKeys) && stage.commandKeys.length > 0
          ? stage.commandKeys.join(", ")
          : "manual";
        console.log(`- ${stage.step}. ${stage.key}: ${required} / ${stage.kind || "unknown"} / ${commandKeys}`);
      }
    }
    if (contract.nextAction) {
      console.log(`- next action: ${contract.nextAction}`);
    }
    if (Array.isArray(contract.missingCommandKeys) && contract.missingCommandKeys.length > 0) {
      console.log(`- missing command keys: ${contract.missingCommandKeys.join(", ")}`);
    }
    if (Array.isArray(contract.unexpectedCommandKeys) && contract.unexpectedCommandKeys.length > 0) {
      console.log(`- unexpected command keys: ${contract.unexpectedCommandKeys.join(", ")}`);
    }
    if (Array.isArray(contract.failedChecks) && contract.failedChecks.length > 0) {
      console.log("Failed command checks:");
      for (const check of contract.failedChecks) {
        console.log(`- ${check.id}: ${check.message}`);
      }
    }
  }

  if (payload.recommendations.length > 0) {
    console.log();
    console.log("Recommendations:");
    for (const recommendation of payload.recommendations) {
      console.log(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  console.log();
  console.log("Privacy: apply plan is read-only and does not mutate learning.json, review files, or skill files.");
}
