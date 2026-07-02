// `design-ai learn` command dispatch.

import path from "node:path";

import { resolveBriefInput } from "../lib/brief.mjs";
import {
  applyLearningAuditFixes,
  applyLearningCurationPlan,
  auditLearningProfile,
  buildLearningBackup,
  buildLearningContext,
  buildLearningEvalTemplate,
  buildRedactedLearningBackup,
  clearLearning,
  diffLearningProfiles,
  forgetLearning,
  formatLearningJson,
  importLearningProfile,
  initializeLearningProfile,
  learningEvalReport,
  learningStats,
  learningUsageStats,
  listLearningRestoreBackups,
  parseLearnArgs,
  pruneLearningRestoreBackups,
  recordLearningFeedback,
  rememberLearning,
  renderLearningCurationReport,
  restoreLearningProfile,
  verifyLearningImportPayload,
} from "../lib/learn.mjs";
import { header, info, success } from "../lib/log.mjs";
import { writeOutputFile } from "../lib/output.mjs";
import {
  agentBacklogReport,
  learningSignalRegistry,
  renderAgentBacklogReport,
  renderLearningSignalReport,
} from "../lib/signals.mjs";
import {
  buildSkillEvolutionProposals,
  buildSkillProposalApplyPlan,
  buildSkillProposalReviewCheck,
  renderSkillEvolutionProposalPatch,
  renderSkillEvolutionProposalReport,
  renderSkillProposalApplyPlanReport,
  renderSkillProposalReviewCheckReport,
  renderSkillProposalReviewTemplate,
} from "../lib/skill-proposals.mjs";
import { printHelp } from "./learn-help.mjs";
import {
  learningFilter,
  listPayload,
  printAudit,
  printAuditFix,
  printCuration,
  printLearningImportVerification,
  printList,
  printStats,
  printUsage,
} from "./learn-print-profile.mjs";
import {
  applyAgentBacklogStrictExit,
  applyEvalStrictExit,
  applySignalsStrictExit,
  applySkillProposalsStrictExit,
  printDiff,
  printEval,
  printEvalTemplate,
  printInit,
  printRestore,
  printRestoreBackups,
  printRestoreBackupPrune,
} from "./learn-print-restore.mjs";
import {
  printAgentBacklog,
  printSignals,
  printSkillProposalApplyPlan,
  printSkillProposalReviewCheck,
  printSkillProposals,
} from "./learn-print-signals.mjs";

function readLearningInput(parsed) {
  return resolveBriefInput(parsed);
}

function assertConfirmed(parsed, action) {
  if (!parsed.yes) {
    throw new Error(`Refusing to ${action} learning entries without --yes`);
  }
}

function printOrWriteContent(parsed, content) {
  if (parsed.outPath) {
    const written = writeOutputFile({
      outPath: parsed.outPath,
      content,
      force: parsed.force,
    });
    success(`Wrote ${written}`);
    return;
  }

  console.log(content.trimEnd());
}

function printOrWriteJson(parsed, payload) {
  printOrWriteContent(parsed, `${formatLearningJson(payload)}\n`);
}

export async function runLearn(args) {
  const parsed = parseLearnArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.action === "remember") {
    const text = readLearningInput(parsed);
    const result = rememberLearning({
      text,
      category: parsed.category,
      filePath: parsed.filePath,
    });

    const payload = {
      file: result.file,
      entry: result.entry,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    success(`Remembered ${result.entry.id}`);
    info(`File: ${result.file}`);
    info(`Category: ${result.entry.category}`);
    return;
  }

  if (parsed.action === "feedback") {
    const text = readLearningInput(parsed);
    const result = recordLearningFeedback({
      text,
      outcome: parsed.feedbackOutcome,
      category: parsed.category,
      filePath: parsed.filePath,
    });

    const payload = {
      file: result.file,
      feedback: {
        outcome: parsed.feedbackOutcome,
        category: result.entry.category,
        instruction: result.entry.text,
      },
      entry: result.entry,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    success(`Recorded feedback ${result.entry.id}`);
    info(`File: ${result.file}`);
    info(`Outcome: ${parsed.feedbackOutcome}`);
    info(`Category: ${result.entry.category}`);
    return;
  }

  if (parsed.action === "init") {
    const payload = initializeLearningProfile({
      filePath: parsed.filePath,
      dryRun: parsed.dryRun || !parsed.yes,
    });

    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printInit(payload);
    return;
  }

  if (parsed.action === "export") {
    const filter = learningFilter(parsed);
    const context = buildLearningContext({
      filePath: parsed.filePath,
      category: filter.category,
      query: filter.query,
      limit: filter.limit || 12,
      includeFallback: false,
    });
    printOrWriteContent(
      parsed,
      parsed.json ? `${formatLearningJson(context)}\n` : `${context.markdown}\n`,
    );
    return;
  }

  if (parsed.action === "import") {
    if (!parsed.dryRun) assertConfirmed(parsed, "import");
    const result = importLearningProfile({
      importText: readLearningInput(parsed),
      filePath: parsed.filePath,
      dryRun: parsed.dryRun,
    });
    const payload = {
      file: result.file,
      dryRun: result.dryRun,
      applied: result.applied,
      importedCount: result.importedCount,
      addedCount: result.addedCount,
      skippedCount: result.skippedCount,
      added: result.added,
      skipped: result.skipped,
      count: result.count,
    };

    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    header("design-ai learn", result.dryRun ? "Learning import dry run" : "Learning import applied");
    info(`File: ${result.file}`);
    info(`Imported: ${result.importedCount}`);
    info(`Added: ${result.addedCount}`);
    info(`Skipped: ${result.skippedCount}`);
    info(`Entries: ${result.count}`);
    if (result.dryRun) {
      console.log();
      console.log("No changes made. Re-run with `--yes` instead of `--dry-run` to import new entries.");
    }
    return;
  }

  if (parsed.action === "backup") {
    const payload = buildLearningBackup({ filePath: parsed.filePath });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    header("design-ai learn", "Learning profile backup");
    info(`File: ${payload.file}`);
    info(`Entries: ${payload.count}`);
    info(`Audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);
    info(`Exported: ${payload.exportedAt}`);
    console.log();
    console.log("Run `design-ai learn --backup --json --out learning-backup.json` to save a full portable JSON backup.");
    return;
  }

  if (parsed.action === "redact") {
    const hasInputSource = parsed.fromFile || parsed.stdin;
    const payload = hasInputSource
      ? buildRedactedLearningBackup({
        importText: readLearningInput(parsed),
        source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
      })
      : buildRedactedLearningBackup({ filePath: parsed.filePath });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    header("design-ai learn", "Redacted learning profile backup");
    info(`File: ${payload.file}`);
    info(`Entries: ${payload.count}`);
    info(`Redacted entries: ${payload.redactedCount}`);
    info(`Source audit: ${payload.sourceAuditSummary.status} (${payload.sourceAuditSummary.failures} failure(s), ${payload.sourceAuditSummary.warnings} warning(s))`);
    info(`Redacted audit: ${payload.auditSummary.status} (${payload.auditSummary.failures} failure(s), ${payload.auditSummary.warnings} warning(s))`);
    info(`Exported: ${payload.exportedAt}`);
    console.log();
    if (payload.redactions.length === 0) {
      console.log("No sensitive-looking learning text was redacted. No changes made.");
    } else {
      console.log("Redacted:");
      for (const redaction of payload.redactions) {
        console.log(`- ${redaction.entryId}: ${redaction.codes.join(", ")}`);
      }
      console.log();
      console.log("No changes made. Run `design-ai learn --redact --json --out learning-redacted.json` to save the redacted portable JSON.");
    }
    return;
  }

  if (parsed.action === "verify") {
    const payload = verifyLearningImportPayload({
      importText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printLearningImportVerification(payload);
    return;
  }

  if (parsed.action === "diff") {
    const payload = diffLearningProfiles({
      filePath: parsed.filePath,
      compareText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printDiff(payload);
    return;
  }

  if (parsed.action === "restore") {
    const payload = restoreLearningProfile({
      filePath: parsed.filePath,
      backupFilePath: parsed.backupFilePath,
      forceBackup: parsed.force,
      restoreText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
      dryRun: parsed.dryRun || !parsed.yes,
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    printRestore(payload);
    return;
  }

  if (parsed.action === "restore-backups") {
    const payload = parsed.prune
      ? pruneLearningRestoreBackups({
        filePath: parsed.filePath,
        keep: parsed.keep || 5,
        limit: parsed.limit || 10,
        dryRun: parsed.dryRun || !parsed.yes,
      })
      : listLearningRestoreBackups({
        filePath: parsed.filePath,
        limit: parsed.limit || 10,
      });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    if (parsed.prune) {
      printRestoreBackupPrune(payload);
    } else {
      printRestoreBackups(payload);
    }
    return;
  }

  if (parsed.action === "list") {
    const payload = listPayload(parsed.filePath, parsed);
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printList(payload);
    return;
  }

  if (parsed.action === "audit") {
    if (parsed.fix) {
      if (!parsed.dryRun) assertConfirmed(parsed, "apply audit cleanup fixes to");
      const payload = applyLearningAuditFixes({
        filePath: parsed.filePath,
        dryRun: parsed.dryRun,
      });
      if (parsed.json) {
        printOrWriteJson(parsed, payload);
        return;
      }
      printAuditFix(payload);
      return;
    }

    const payload = auditLearningProfile({ filePath: parsed.filePath });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printAudit(payload);
    return;
  }

  if (parsed.action === "curate") {
    const dryRun = parsed.dryRun || !parsed.yes;
    if (!dryRun) assertConfirmed(parsed, "apply learning curation to");
    const payload = applyLearningCurationPlan({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      dryRun,
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    if (parsed.report) {
      printOrWriteContent(parsed, renderLearningCurationReport(payload));
      return;
    }
    printCuration(payload);
    return;
  }

  if (parsed.action === "stats") {
    const payload = learningStats({ filePath: parsed.filePath });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printStats(payload);
    return;
  }

  if (parsed.action === "usage") {
    const payload = learningUsageStats({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      limit: parsed.limit || 10,
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printUsage(payload);
    return;
  }

  if (parsed.action === "signals") {
    const payload = learningSignalRegistry({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      signalSource: parsed.fromFile,
      root: process.cwd(),
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      applySignalsStrictExit(parsed, payload);
      return;
    }
    if (parsed.report) {
      printOrWriteContent(parsed, renderLearningSignalReport(payload));
      applySignalsStrictExit(parsed, payload);
      return;
    }
    printSignals(payload);
    applySignalsStrictExit(parsed, payload);
    return;
  }

  if (parsed.action === "agent-backlog") {
    const payload = agentBacklogReport({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      signalSource: parsed.fromFile,
      root: process.cwd(),
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      applyAgentBacklogStrictExit(parsed, payload);
      return;
    }
    if (parsed.report) {
      printOrWriteContent(parsed, renderAgentBacklogReport(payload));
      applyAgentBacklogStrictExit(parsed, payload);
      return;
    }
    printAgentBacklog(payload);
    applyAgentBacklogStrictExit(parsed, payload);
    return;
  }

  if (parsed.action === "propose-skills") {
    const payload = buildSkillEvolutionProposals({
      filePath: parsed.filePath,
      usageFile: parsed.usageFilePath,
      reviewFile: parsed.reviewFilePath,
      signalSource: parsed.fromFile,
      root: process.cwd(),
      minEvidenceCount: parsed.minEvidenceCount || undefined,
    });
    if (parsed.reviewCheck) {
      const reviewCheck = buildSkillProposalReviewCheck(payload);
      if (parsed.json) {
        printOrWriteJson(parsed, reviewCheck);
        applySkillProposalsStrictExit(parsed, reviewCheck);
        return;
      }
      if (parsed.report) {
        printOrWriteContent(parsed, renderSkillProposalReviewCheckReport(reviewCheck));
        applySkillProposalsStrictExit(parsed, reviewCheck);
        return;
      }
      printSkillProposalReviewCheck(reviewCheck);
      applySkillProposalsStrictExit(parsed, reviewCheck);
      return;
    }
    if (parsed.applyPlan) {
      const applyPlan = buildSkillProposalApplyPlan(payload);
      if (parsed.json) {
        printOrWriteJson(parsed, applyPlan);
        applySkillProposalsStrictExit(parsed, applyPlan);
        return;
      }
      if (parsed.report) {
        printOrWriteContent(parsed, renderSkillProposalApplyPlanReport(applyPlan));
        applySkillProposalsStrictExit(parsed, applyPlan);
        return;
      }
      printSkillProposalApplyPlan(applyPlan);
      applySkillProposalsStrictExit(parsed, applyPlan);
      return;
    }
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    if (parsed.report) {
      printOrWriteContent(parsed, renderSkillEvolutionProposalReport(payload));
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    if (parsed.reviewTemplate) {
      printOrWriteContent(parsed, renderSkillProposalReviewTemplate(payload));
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    if (parsed.patch) {
      printOrWriteContent(parsed, renderSkillEvolutionProposalPatch(payload));
      applySkillProposalsStrictExit(parsed, payload);
      return;
    }
    printSkillProposals(payload);
    applySkillProposalsStrictExit(parsed, payload);
    return;
  }

  if (parsed.action === "eval-template") {
    const payload = buildLearningEvalTemplate({
      filePath: parsed.filePath,
      query: parsed.query,
      category: parsed.categorySpecified ? parsed.category : "",
      limit: parsed.limit || 6,
    });
    if (parsed.json || parsed.outPath) {
      printOrWriteJson(parsed, payload);
      return;
    }
    printEvalTemplate(payload);
    return;
  }

  if (parsed.action === "eval") {
    const payload = learningEvalReport({
      filePath: parsed.filePath,
      evalText: readLearningInput(parsed),
      source: parsed.fromFile ? path.resolve(parsed.fromFile) : "stdin",
      limit: parsed.limit || 12,
      category: parsed.categorySpecified ? parsed.category : "",
    });
    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      applyEvalStrictExit(parsed, payload);
      return;
    }
    printEval(payload);
    applyEvalStrictExit(parsed, payload);
    return;
  }

  if (parsed.action === "forget") {
    assertConfirmed(parsed, "forget");
    const result = forgetLearning({
      target: parsed.forgetTarget,
      filePath: parsed.filePath,
    });
    const payload = {
      file: result.file,
      removed: result.removed,
      count: result.count,
    };

    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    success(`Forgot ${result.removed.id}`);
    info(`File: ${result.file}`);
    info(`Entries: ${result.count}`);
    return;
  }

  if (parsed.action === "clear") {
    assertConfirmed(parsed, "clear");
    const result = clearLearning({ filePath: parsed.filePath });
    const payload = {
      file: result.file,
      removedCount: result.removedCount,
      count: result.profile.entries.length,
    };

    if (parsed.json) {
      printOrWriteJson(parsed, payload);
      return;
    }

    success(`Cleared ${result.removedCount} learning entr${result.removedCount === 1 ? "y" : "ies"}`);
    info(`File: ${result.file}`);
    return;
  }

  throw new Error(`Unsupported learn action: ${parsed.action}`);
}
