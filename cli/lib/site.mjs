// Public Website Improvement Console helper surface for `design-ai site`.

export {
  buildSiteInitNextActionsReport,
  buildSiteIntakeNextActionsReport,
  buildSiteNextActionsReport,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
} from "./site-next-actions.mjs";

export {
  buildSiteMcpActionPlan,
  buildSiteMcpActionPlanData,
  buildSiteMcpCheckReport,
  formatSiteMcpActionPlanJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
} from "./site-mcp-report.mjs";

export {
  buildSiteMcpProbeReport,
} from "./site-mcp-probes.mjs";

export {
  buildSiteLinkedPreviewReport,
  formatSiteLinkedPreviewHuman,
  formatSiteLinkedPreviewJson,
} from "./site-linked-preview.mjs";

export {
  buildSiteBundleCompareReport,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
} from "./site-bundle-compare.mjs";

export {
  buildSiteBundleHandoffReport,
  formatSiteBundleHandoffHuman,
  formatSiteBundleHandoffJson,
} from "./site-bundle-handoff.mjs";

export {
  buildSiteBundleCheckReport,
  formatSiteBundleCheckHuman,
  formatSiteBundleCheckJson,
} from "./site-bundle-check.mjs";

export {
  buildSiteBundleRepairAppliedReport,
  buildSiteBundleRepairBundle,
  buildSiteBundleRepairPreview,
  formatSiteBundleRepairHuman,
  formatSiteBundleRepairJson,
} from "./site-bundle-repair-report.mjs";

export {
  AUDIT_CATEGORIES,
  MCP_ITEMS,
} from "./site-options.mjs";

export {
  parseSiteArgs,
  SITE_OPTIONS,
} from "./site-args.mjs";

export {
  buildSiteBundleImplementationPrompt,
  buildSiteHandoffReport,
  buildSitePrompt,
  buildSitePromptBundle,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
  resolveSitePromptTask,
} from "./site-prompts.mjs";

export {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
  SITE_PROMPT_TEMPLATE_IDS,
  SITE_PROMPT_TEMPLATES,
} from "./site-content.mjs";

export {
  buildSiteIntakeTemplateMarkdown,
  createSampleSiteWorkspace,
  formatSiteIntakeTemplateJson,
} from "./site-starter.mjs";

export {
  createSiteWorkspaceFromInitOptions,
  createSiteWorkspaceFromIntakeMarkdown,
  normalizeSiteWorkspace,
} from "./site-workspace.mjs";

export {
  analyzeSiteWorkspace,
  buildSiteReport,
  formatSiteJson,
  loadSiteWorkspaceInput,
} from "./site-analysis.mjs";

export {
  generateSiteRefactorTasks,
} from "./site-tasks.mjs";

export {
  buildSiteWorkflowGraph,
  formatSiteWorkflowGraphJson,
  formatSiteWorkflowGraphMarkdown,
} from "./site-workflow-graph.mjs";

export {
  buildSiteHandoffBundle,
} from "./site-bundle-build.mjs";
