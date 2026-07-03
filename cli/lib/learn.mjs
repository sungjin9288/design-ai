// Public learning surface for `design-ai learn` — re-exports the learn-* modules.

export {
  LEARNING_CATEGORIES,
  LEARNING_FEEDBACK_OUTCOMES,
  LEARN_SUBCOMMANDS,
  normalizeCategory,
  normalizeFeedbackOutcome,
  parseLearnArgs,
  parseLearningKeep,
  parseLearningLimit,
  parseLearningMinEvidence,
} from "./learn-args.mjs";

export {
  buildLearningBackup,
  buildRedactedLearningBackup,
  diffLearningProfiles,
  importLearningProfile,
  listLearningRestoreBackups,
  pruneLearningRestoreBackups,
  restoreLearningProfile,
  verifyLearningImportPayload,
} from "./learn-backup.mjs";

export {
  applyLearningCurationPlan,
  buildLearningCurationPlan,
  clearLearning,
  defaultLearningArchiveFile,
  emptyLearningArchive,
  loadLearningArchive,
  renderLearningCurationReport,
} from "./learn-curation.mjs";

export {
  buildLearningEvalTemplate,
  learningEvalReport,
} from "./learn-eval.mjs";

export {
  LEARNING_INIT_ENTRIES,
  LEARNING_INIT_SOURCE,
  applyLearningAuditFixes,
  auditLearningProfile,
  captureLearningEntries,
  emptyLearningProfile,
  forgetLearning,
  initializeLearningProfile,
  loadLearningProfile,
  normalizeLearningProfile,
  recordLearningFeedback,
  rememberLearning,
} from "./learn-profile.mjs";

export {
  buildLearningContext,
  recentLearningEntries,
  renderLearningMarkdown,
  selectLearningEntries,
  selectLearningEntrySet,
} from "./learn-select.mjs";

export {
  buildLearnRecall,
} from "./recall.mjs";

export {
  defaultLearningFile,
  defaultLearningRestoreBackupFile,
  defaultLearningUsageFile,
  formatLearningJson,
} from "./learn-shared.mjs";

export {
  buildLearningUsageEvent,
  emptyLearningUsageLog,
  learningStats,
  learningUsageStats,
  loadLearningUsageLog,
  normalizeLearningUsageLog,
  recordLearningUsage,
} from "./learn-usage.mjs";
