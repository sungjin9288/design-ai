// Aggregate workspace readiness report and next actions for `design-ai workspace`.

import { existsSync } from "node:fs";
import path from "node:path";

import {
  defaultLearningFile,
  learningEvalReport,
  learningStats,
  learningUsageStats,
  listLearningRestoreBackups,
} from "./learn.mjs";
import { DESIGN_AI_HOME } from "./paths.mjs";
import { collectGitReport, runGitCommand } from "./workspace-git.mjs";
import {
  action,
  assessLearningEvalFreshness,
  assessLearningRestoreBackupReadiness,
  assessLearningUsageReadiness,
  collectLearningEvalReport,
  collectLearningReport,
  collectLearningRestoreBackupsReport,
  collectLearningUsageReport,
  collectRetrievalIndexReport,
  defaultLearningCurationReportPath,
  defaultLearningEvalPath,
  defaultLearningUsagePath,
  learningCurationCommand,
  learningCurationReportCommand,
  learningRestoreBackupPruneCommand,
  learningRestoreBackupsCommand,
  pushUniqueAction,
  quoteShellArg,
} from "./workspace-learning.mjs";
import {
  collectReleaseScriptReport,
  collectRepositoryReport,
} from "./workspace-repo.mjs";

export function buildWorkspaceNextActions({
  git,
  repository,
  learning,
  learningUsage,
  learningEval,
  learningRestoreBackups,
  retrievalIndex = null,
  release,
}) {
  const actions = [];

  if (retrievalIndex && !retrievalIndex.fresh) {
    actions.push(action(
      "warn",
      "Retrieval index is stale or unreadable for the current corpus/learning sources. Rebuild it before relying on ranked retrieval.",
      retrievalIndex.buildCommand || "design-ai index --build",
    ));
  }

  if (!git.isRepo) {
    actions.push(action("warn", "Open design-ai from a git workspace before preparing shared changes."));
  } else {
    if (!git.clean) {
      actions.push(action("warn", "Review local changes before committing or pushing.", "git status --short"));
    } else if (git.hasIgnoredLocalArtifacts) {
      actions.push(action("info", "Ignored local portfolio/evidence artifacts are present and excluded from workspace readiness.", "git status --short"));
    } else if (!git.upstream && git.branch) {
      actions.push(action("warn", "Set an upstream branch before sharing dogfood work.", `git push -u origin ${git.branch}`));
    } else if (git.behind > 0) {
      actions.push(action("warn", "Rebase or merge remote changes before continuing release work.", "git pull --rebase"));
    } else if (git.ahead > 0) {
      actions.push(action("info", "Push committed local work when the current phase is ready.", "git push"));
    } else {
      actions.push(action("pass", "Git workspace is clean and synced."));
    }
  }

  if (repository && !repository.metadataAligned) {
    actions.push(action("fail", "Fix package/plugin repository metadata before preparing shared dogfood builds.", "npm run release:metadata"));
  } else if (repository?.remoteAligned === false) {
    actions.push(action("warn", "Verify git remote points at the canonical design-ai repository before pushing.", "git remote -v"));
  }

  if (release.missing.length > 0) {
    actions.push(action("fail", `Restore required release script(s): ${release.missing.join(", ")}`));
  }

  if (learning.error) {
    actions.push(action("fail", "Repair the local learning profile before relying on personalized prompt context.", "design-ai learn --audit"));
  } else if (learning.auditSummary.status !== "pass") {
    pushUniqueAction(actions, action(
      "warn",
      "Preview archive-first learning curation before dogfooding prompts.",
      learningCurationCommand(learning, learningUsage),
    ));
    pushUniqueAction(actions, action(
      "info",
      "Save a Markdown learning curation report before applying archive actions.",
      learningCurationReportCommand(learning, learningUsage),
    ));
  } else if (learning.count === 0) {
    actions.push(action("info", "Capture reviewed feedback after checks to make dogfood runs improve over time.", "design-ai check artifact.md --learn --yes"));
  } else if (!learningEval) {
    actions.push(action(
      "info",
      "Generate a local learning eval checkpoint before relying on personalized prompt context.",
      `design-ai learn --eval-template --file ${quoteShellArg(learning.file)} --out ${quoteShellArg(defaultLearningEvalPath(learning.file))}`,
    ));
  }

  if (learningUsage) {
    const usageCommand = `design-ai learn --usage --file ${quoteShellArg(learningUsage.file)} --usage-file ${quoteShellArg(learningUsage.usageFile)}`;
    if (learningUsage.error) {
      actions.push(action("fail", "Repair the local learning usage sidecar before trusting prompt/pack usage analytics.", usageCommand));
    } else if (learningUsage.readiness?.status === "warn") {
      pushUniqueAction(actions, action(
        "warn",
        "Preview usage-aware learning curation before curating learning entries.",
        learningCurationCommand(learning, learningUsage),
      ));
      pushUniqueAction(actions, action(
        "info",
        "Save a Markdown usage-aware learning curation report before applying archive actions.",
        learningCurationReportCommand(learning, learningUsage),
      ));
    } else if (learningUsage.readiness?.status === "pass") {
      actions.push(action("pass", "Learning usage sidecar is aligned with the active profile.", usageCommand));
    } else {
      actions.push(action("info", "Record prompt/pack --with-learning usage before judging which learning entries are useful.", usageCommand));
    }
  } else if (!learning.error && learning.auditSummary.status === "pass" && learning.count > 0) {
    actions.push(action(
      "info",
      "Run prompt or pack with --with-learning to create a local learning usage sidecar.",
      "design-ai prompt \"your brief\" --with-learning",
    ));
  }

  if (learningEval) {
    const evalCommand = `design-ai learn --eval --from-file ${quoteShellArg(learningEval.source)} --file ${quoteShellArg(learningEval.file)} --strict`;
    const regenerateCommand = `design-ai learn --eval-template --file ${quoteShellArg(learningEval.file)} --out ${quoteShellArg(learningEval.source)} --force`;
    if (learningEval.error) {
      actions.push(action("fail", "Fix the local learning eval checkpoint before using workspace readiness as a gate.", evalCommand));
    } else if (learningEval.status === "fail") {
      actions.push(action("fail", "Review failed local learning eval checkpoint cases before trusting prompt/pack selection.", evalCommand));
    } else if (learningEval.status === "warn") {
      actions.push(action("warn", "Review local learning eval checkpoint warnings before relying on personalized prompt context.", evalCommand));
    } else if (learningEval.freshness?.status === "warn") {
      actions.push(action("warn", "Regenerate the local learning eval checkpoint because the learning profile changed after it was created.", regenerateCommand));
    } else {
      actions.push(action("pass", "Learning eval checkpoints pass.", evalCommand));
    }
  }

  if (learningRestoreBackups) {
    const readiness = learningRestoreBackups.readiness || {};
    if (learningRestoreBackups.error) {
      actions.push(action("fail", "Repair the learning restore rollback backup inventory before relying on restore readiness.", learningRestoreBackupsCommand(learning)));
    } else if (readiness.pruneCandidateCount > 0) {
      actions.push(action(
        "info",
        "Preview pruning older learning restore rollback backups after keeping the newest recovery points.",
        learningRestoreBackupPruneCommand(learning, readiness.keep || DEFAULT_RESTORE_BACKUP_KEEP),
      ));
    } else if (learningRestoreBackups.totalCount > 0) {
      actions.push(action("pass", "Learning restore rollback backups are available for rollback review.", learningRestoreBackupsCommand(learning)));
    }
  }

  if (release.available.includes("test")) {
    actions.push(action("info", "Run CLI unit tests before handing this phase off.", "npm test"));
  }
  if (release.available.includes("audit:strict")) {
    actions.push(action("info", "Run the strict repository audit before repo cleanup or team distribution.", "npm run audit:strict"));
  }
  if (release.available.includes("package:smoke")) {
    actions.push(action("info", "Use package smoke before publishing or testing the packed install path.", "npm run package:smoke"));
  }

  return actions;
}

export function hasWorkspaceStrictIssues(report) {
  return (report?.nextActions || []).some((item) => item.level === "fail" || item.level === "warn");
}

export function collectWorkspaceReport({
  root = process.cwd(),
  sourceRoot = DESIGN_AI_HOME,
  learningFilePath = defaultLearningFile(),
  learningUsagePath = "",
  learningEvalPath = "",
  gitRunner = runGitCommand,
  learningStatsProvider = learningStats,
  learningUsageStatsProvider = learningUsageStats,
  learningEvalReportProvider = learningEvalReport,
  learningRestoreBackupsProvider = listLearningRestoreBackups,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const resolvedSourceRoot = path.resolve(sourceRoot);
  const resolvedLearningFile = path.resolve(learningFilePath);
  const resolvedLearningUsagePath = learningUsagePath || (
    existsSync(defaultLearningUsagePath(resolvedLearningFile)) ? defaultLearningUsagePath(resolvedLearningFile) : ""
  );
  const resolvedLearningEvalPath = learningEvalPath || (
    existsSync(defaultLearningEvalPath(resolvedLearningFile)) ? defaultLearningEvalPath(resolvedLearningFile) : ""
  );
  const git = collectGitReport({ root: resolvedRoot, gitRunner });
  const learning = collectLearningReport({
    filePath: resolvedLearningFile,
    learningStatsProvider,
  });
  const learningUsage = collectLearningUsageReport({
    learningFilePath: resolvedLearningFile,
    learningUsagePath: resolvedLearningUsagePath,
    learningUsageStatsProvider,
  });
  const learningEval = collectLearningEvalReport({
    learningFilePath: resolvedLearningFile,
    learningEvalPath: resolvedLearningEvalPath,
    learningEvalReportProvider,
  });
  const learningRestoreBackups = collectLearningRestoreBackupsReport({
    learningFilePath: resolvedLearningFile,
    learningRestoreBackupsProvider,
  });
  const learningEvalWithFreshness = learningEval
    ? {
        ...learningEval,
        freshness: assessLearningEvalFreshness({ learning, learningEval }),
      }
    : null;
  const retrievalIndex = collectRetrievalIndexReport({
    sourceRoot: resolvedSourceRoot,
    learningFilePath: resolvedLearningFile,
  });
  const release = collectReleaseScriptReport({ sourceRoot: resolvedSourceRoot });
  const repository = collectRepositoryReport({ sourceRoot: resolvedSourceRoot, git });
  const nextActions = buildWorkspaceNextActions({
    git,
    repository,
    learning,
    learningUsage,
    learningEval: learningEvalWithFreshness,
    learningRestoreBackups,
    retrievalIndex,
    release,
  });

  return {
    context: {
      cwd: process.cwd(),
      root: resolvedRoot,
      sourceRoot: resolvedSourceRoot,
      packageName: release.packageName,
      version: release.version,
    },
    git,
    repository,
    learning,
    learningUsage,
    learningEval: learningEvalWithFreshness,
    learningRestoreBackups,
    retrievalIndex,
    release,
    nextActions,
  };
}

export function formatWorkspaceJson(report) {
  return JSON.stringify({
    context: report.context,
    git: report.git,
    repository: report.repository,
    learning: report.learning,
    learningUsage: report.learningUsage || null,
    learningEval: report.learningEval || null,
    learningRestoreBackups: report.learningRestoreBackups || null,
    retrievalIndex: report.retrievalIndex || null,
    release: report.release,
    nextActions: report.nextActions,
  }, null, 2);
}
