// Website Improvement Console workspace helpers for `design-ai site`.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";

import { parseOutputFlags } from "./output.mjs";
import { unknownOptionMessage } from "./suggest.mjs";
import { buildSiteMcpProbeReport } from "./site-mcp-probes.mjs";
import {
  buildSiteMcpActionPlan,
  buildSiteMcpActionPlanData,
  buildSiteMcpCheckReport,
  combineStatuses,
  formatSiteMcpActionPlanJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  normalizeMcpKey,
} from "./site-mcp-report.mjs";
import {
  buildSiteInitNextActionsReport,
  buildSiteIntakeNextActionsReport,
  buildSiteNextActionsReport,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
} from "./site-next-actions.mjs";
import {
  buildSiteHandoffReport,
  buildSitePrompt,
  buildSitePromptBundle,
  mcpBlock,
  orderedRefactorTasks,
  profileBlock,
  resolveSitePromptTask,
} from "./site-prompts.mjs";
import { markdownList, markdownTable, normalizeStringArray } from "./site-strings.mjs";
import { AUDIT_CATEGORIES, MCP_ITEMS, PRIORITY_OPTIONS, categoryById } from "./site-options.mjs";
import {
  DEFAULT_IMPLEMENTATION_RISKS,
  IMPLEMENTATION_EVIDENCE_KEYS,
  countImplementationEvidence,
  normalizeImplementationEvidence,
} from "./site-evidence.mjs";
import {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
  SITE_INTAKE_TEMPLATE_MARKDOWN,
  SITE_INTAKE_TEMPLATE_MARKDOWN_KO,
  SITE_INTAKE_TEMPLATE_SECTIONS,
  SITE_PROMPT_TEMPLATE_IDS,
  SITE_PROMPT_TEMPLATES,
} from "./site-content.mjs";
import {
  buildBundleCheckCommand,
  buildBundleCheckCommandArgs,
  buildBundleHandoffCommand,
  buildBundleHandoffCommandArgs,
  buildBundleSourceCommandSafety,
  buildBundleTaskHandoffCommand,
  buildBundleTaskHandoffCommandArgs,
  buildBundleTaskHandoffCommandSafety,
  taskHandoffOutFile,
} from "./site-bundle-commands.mjs";
import {
  buildBundleRepairGuidance,
  formatBundleRepairGuidanceLines,
  summarizeBundleRepairCheck,
} from "./site-bundle-repair.mjs";
import {
  buildBundleFileChanges,
  buildBundleMetadataChanges,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
  summarizeBundleForCompare,
} from "./site-bundle-compare.mjs";
import {
  addBundleMarkdownIssue,
  arraysEqual,
  buildBundleChecksums,
  buildBundleDigest,
  parseBundleJson,
  readBundleTextIfPresent,
  sha256Hex,
  shortDigest,
} from "./site-bundle-files.mjs";

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
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
} from "./site-bundle-compare.mjs";

export {
  AUDIT_CATEGORIES,
  MCP_ITEMS,
} from "./site-options.mjs";

export {
  buildSiteHandoffReport,
  buildSitePrompt,
  buildSitePromptBundle,
  resolveSitePromptTask,
} from "./site-prompts.mjs";

export {
  SITE_BUNDLE_CHECKSUM_FILES,
  SITE_BUNDLE_FILES,
  SITE_PROMPT_TEMPLATE_IDS,
  SITE_PROMPT_TEMPLATES,
} from "./site-content.mjs";

export const SITE_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--stdin",
  "--init",
  "--name",
  "--live-url",
  "--repo-url",
  "--local-path",
  "--figma-url",
  "--brand-notes",
  "--deploy",
  "--sentry",
  "--cms",
  "--database",
  "--page",
  "--flow",
  "--viewport",
  "--from-intake",
  "--language",
  "--intake-template",
  "--sample",
  "--tasks",
  "--bundle",
  "--bundle-check",
  "--bundle-compare",
  "--bundle-handoff",
  "--bundle-repair",
  "--next-actions",
  "--prompt-list",
  "--mcp-check",
  "--mcp-plan",
  "--graph",
  "--probes",
  "--prompt",
  "--task",
  "--strict",
  "--report",
  "--prompts",
  "--out",
  "--output",
  "--force",
  "--yes",
];

const DEPLOY_OPTIONS = ["vercel", "netlify", "cloudflare", "other", "none"];
const CMS_OPTIONS = ["sanity", "contentful", "wordpress", "shopify", "none", "other"];
const DATABASE_OPTIONS = ["supabase", "neon", "postgres", "none", "other"];
const VIEWPORT_OPTIONS = ["desktop", "tablet", "mobile"];
const SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS = ["en", "ko"];
const CHECKLIST_STATUS_OPTIONS = ["todo", "in-progress", "done", "blocked"];
const MCP_STATUS_OPTIONS = ["required", "optional", "unused", "unavailable"];
const IMPACT_OPTIONS = ["high", "medium", "low"];
const EFFORT_OPTIONS = ["high", "medium", "low"];
const SITE_TARGET_REPO_EXECUTION_CHECKLIST = [
  {
    id: "confirm-target-repo",
    label: "Confirm target repo working directory",
    required: true,
    evidence: "State the target repo path and confirm it is not the design-ai repo before editing.",
  },
  {
    id: "inspect-architecture",
    label: "Inspect existing architecture and design system",
    required: true,
    evidence: "Name the routing, component, styling, token, and test/build surfaces inspected before implementation.",
  },
  {
    id: "apply-focused-task",
    label: "Apply one focused Website Improvement task",
    required: true,
    evidence: "Identify the completed task id/title, changed files, and why the scope stayed limited.",
  },
  {
    id: "verify-quality-gates",
    label: "Run target repo quality gates",
    required: true,
    evidence: "Record lint/typecheck/build/test results plus browser, viewport, accessibility, and deployment checks that were available.",
  },
  {
    id: "record-handoff-evidence",
    label: "Record implementation evidence and remaining risks",
    required: true,
    evidence: "Return executed work, verification results, remaining risks, next actions, and the bundle digest used.",
  },
];

function readOptionValue(args, index, flag) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

export function parseSiteArgs(args) {
  const out = {
    target: "",
    stdin: false,
    init: false,
    initProfile: {
      name: "",
      liveUrl: "",
      repoUrl: "",
      localPath: "",
      figmaUrl: "",
      brandNotes: "",
      deployProvider: "none",
      sentryProject: "",
      cms: "none",
      database: "none",
      pages: [],
      userFlows: [],
      viewports: [],
    },
    fromIntake: false,
    fromIntakePath: "",
    intakeTemplate: false,
    language: "en",
    languageProvided: false,
    sample: false,
    tasks: false,
    bundle: false,
    bundleCheck: false,
    bundleCompareTarget: "",
    bundleHandoff: false,
    bundleRepair: false,
    nextActions: false,
    promptList: false,
    mcpCheck: false,
    mcpPlan: false,
    graph: false,
    probes: false,
    promptTemplate: "",
    taskSelector: "",
    json: false,
    strict: false,
    report: false,
    prompts: false,
    outPath: "",
    force: false,
    yes: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    out.index = i;

    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--stdin") {
      out.stdin = true;
    } else if (arg === "--init") {
      out.init = true;
    } else if (arg === "--name") {
      out.initProfile.name = readOptionValue(args, i, "--name");
      i += 1;
    } else if (arg === "--live-url") {
      out.initProfile.liveUrl = readOptionValue(args, i, "--live-url");
      i += 1;
    } else if (arg === "--repo-url") {
      out.initProfile.repoUrl = readOptionValue(args, i, "--repo-url");
      i += 1;
    } else if (arg === "--local-path") {
      out.initProfile.localPath = readOptionValue(args, i, "--local-path");
      i += 1;
    } else if (arg === "--figma-url") {
      out.initProfile.figmaUrl = readOptionValue(args, i, "--figma-url");
      i += 1;
    } else if (arg === "--brand-notes") {
      out.initProfile.brandNotes = readOptionValue(args, i, "--brand-notes");
      i += 1;
    } else if (arg === "--deploy") {
      const value = readOptionValue(args, i, "--deploy");
      if (!DEPLOY_OPTIONS.includes(value)) {
        throw new Error(`--deploy must be one of: ${DEPLOY_OPTIONS.join(", ")}`);
      }
      out.initProfile.deployProvider = value;
      i += 1;
    } else if (arg === "--sentry") {
      out.initProfile.sentryProject = readOptionValue(args, i, "--sentry");
      i += 1;
    } else if (arg === "--cms") {
      const value = readOptionValue(args, i, "--cms");
      if (!CMS_OPTIONS.includes(value)) {
        throw new Error(`--cms must be one of: ${CMS_OPTIONS.join(", ")}`);
      }
      out.initProfile.cms = value;
      i += 1;
    } else if (arg === "--database") {
      const value = readOptionValue(args, i, "--database");
      if (!DATABASE_OPTIONS.includes(value)) {
        throw new Error(`--database must be one of: ${DATABASE_OPTIONS.join(", ")}`);
      }
      out.initProfile.database = value;
      i += 1;
    } else if (arg === "--page") {
      out.initProfile.pages.push(readOptionValue(args, i, "--page"));
      i += 1;
    } else if (arg === "--flow") {
      out.initProfile.userFlows.push(readOptionValue(args, i, "--flow"));
      i += 1;
    } else if (arg === "--viewport") {
      const value = readOptionValue(args, i, "--viewport");
      if (!VIEWPORT_OPTIONS.includes(value)) {
        throw new Error(`--viewport must be one of: ${VIEWPORT_OPTIONS.join(", ")}`);
      }
      out.initProfile.viewports.push(value);
      i += 1;
    } else if (arg === "--from-intake") {
      out.fromIntake = true;
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        out.fromIntakePath = value;
        i += 1;
      }
    } else if (arg === "--language") {
      const value = readOptionValue(args, i, "--language");
      if (!SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.includes(value)) {
        throw new Error(`--language must be one of: ${SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.join(", ")}`);
      }
      out.language = value;
      out.languageProvided = true;
      i += 1;
    } else if (arg === "--intake-template") {
      out.intakeTemplate = true;
    } else if (arg === "--sample") {
      out.sample = true;
    } else if (arg === "--tasks") {
      out.tasks = true;
    } else if (arg === "--bundle") {
      out.bundle = true;
    } else if (arg === "--bundle-check") {
      out.bundleCheck = true;
    } else if (arg === "--bundle-compare") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--bundle-compare requires a second handoff bundle directory path");
      }
      out.bundleCompareTarget = value;
      i += 1;
    } else if (arg === "--bundle-handoff") {
      out.bundleHandoff = true;
    } else if (arg === "--bundle-repair") {
      out.bundleRepair = true;
    } else if (arg === "--next-actions") {
      out.nextActions = true;
    } else if (arg === "--prompt-list") {
      out.promptList = true;
    } else if (arg === "--mcp-check") {
      out.mcpCheck = true;
    } else if (arg === "--mcp-plan") {
      out.mcpPlan = true;
    } else if (arg === "--graph") {
      out.graph = true;
    } else if (arg === "--probes") {
      out.probes = true;
    } else if (arg === "--prompt") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--prompt requires a template id");
      }
      if (!SITE_PROMPT_TEMPLATE_IDS.includes(value)) {
        throw new Error(`--prompt must be one of: ${SITE_PROMPT_TEMPLATE_IDS.join(", ")}`);
      }
      out.promptTemplate = value;
      i += 1;
    } else if (arg === "--task") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--task requires a refactor task id or 1-based task number");
      }
      out.taskSelector = value;
      i += 1;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (arg === "--report") {
      out.report = true;
    } else if (arg === "--prompts") {
      out.prompts = true;
    } else if (arg === "--yes") {
      out.yes = true;
    } else if (parseOutputFlags(args, out)) {
      i = out.index;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("site", arg, SITE_OPTIONS));
    } else if (!out.target) {
      out.target = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  const sources = [out.target ? "file path" : "", out.stdin ? "--stdin" : ""].filter(Boolean);
  if (sources.length > 1) {
    throw new Error("Use either a workspace JSON file path or --stdin, not both");
  }
  const hasInitProfileFields = Boolean(
    out.initProfile.name
      || out.initProfile.liveUrl
      || out.initProfile.repoUrl
      || out.initProfile.localPath
      || out.initProfile.figmaUrl
      || out.initProfile.brandNotes
      || out.initProfile.sentryProject
      || out.initProfile.deployProvider !== "none"
      || out.initProfile.cms !== "none"
      || out.initProfile.database !== "none"
      || out.initProfile.pages.length > 0
      || out.initProfile.userFlows.length > 0
      || out.initProfile.viewports.length > 0,
  );
  if (hasInitProfileFields && !out.init) {
    throw new Error("Use --name, --live-url, --repo-url, --local-path, --figma-url, --brand-notes, --deploy, --sentry, --cms, --database, --page, --flow, or --viewport only with --init");
  }
  if (out.init && sources.length > 0) {
    throw new Error("Use --init without a workspace JSON file path or --stdin");
  }
  if (out.fromIntake && out.target) {
    throw new Error("Use --from-intake without a workspace JSON file path");
  }
  if (out.fromIntake && out.stdin && out.fromIntakePath) {
    throw new Error("Use --from-intake with either a file path or --stdin, not both");
  }
  if (out.fromIntake && !out.fromIntakePath && !out.stdin) {
    throw new Error("--from-intake requires a file path or --stdin");
  }
  if (out.fromIntake && (out.init || hasInitProfileFields)) {
    throw new Error("Use --from-intake without --init or init profile fields");
  }
  if (out.intakeTemplate && (sources.length > 0 || out.init || hasInitProfileFields)) {
    throw new Error("Use --intake-template without a workspace JSON file path, --stdin, --init, or init profile fields");
  }
  if (out.languageProvided && !out.intakeTemplate) {
    throw new Error("Use --language only with --intake-template");
  }
  if (out.intakeTemplate && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.promptList || out.mcpCheck || out.mcpPlan || out.graph || out.probes || out.report || out.prompts || out.promptTemplate || out.strict || out.yes)) {
    throw new Error("Use --intake-template only with --language, --json, --out, or --force");
  }
  if (out.init && !out.initProfile.name.trim()) {
    throw new Error("--init requires --name");
  }
  if (out.init && !out.initProfile.liveUrl.trim()) {
    throw new Error("--init requires --live-url");
  }
  if (out.init && (out.sample || out.tasks || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.promptList || out.mcpCheck || out.mcpPlan || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --init without --sample, --tasks, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --prompt-list, --mcp-check, --mcp-plan, --graph, --report, --prompts, or --prompt");
  }
  if (out.init && out.strict && !(out.nextActions || out.bundle)) {
    throw new Error("Use --init --strict only with --next-actions or --bundle");
  }
  if (out.fromIntake && (out.intakeTemplate || out.sample || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.promptList || out.mcpCheck || out.mcpPlan || out.graph || out.report || out.prompts || out.promptTemplate || out.yes)) {
    throw new Error("Use --from-intake only with --json, --next-actions, --tasks, --bundle, --out, --strict, or --force");
  }
  if (out.fromIntake && out.strict && !(out.nextActions || out.tasks || out.bundle)) {
    throw new Error("Use --from-intake --strict only with --next-actions, --tasks, or --bundle");
  }
  if (out.sample && sources.length > 0) {
    throw new Error("Use --sample without a workspace JSON file path or --stdin");
  }
  if (out.promptList && sources.length > 0) {
    throw new Error("Use --prompt-list without a workspace JSON file path or --stdin");
  }
  if (out.sample && (out.report || out.prompts || out.promptTemplate || out.nextActions || out.graph)) {
    throw new Error("Use --sample without --report, --prompts, --prompt, --next-actions, or --graph");
  }
  if (out.promptList && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.mcpCheck || out.mcpPlan || out.graph || out.report || out.prompts || out.promptTemplate || out.strict)) {
    throw new Error("Use --prompt-list without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --mcp-check, --mcp-plan, --graph, --report, --prompts, --prompt, or --strict");
  }
  if (out.mcpCheck && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --mcp-check without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, or --prompt");
  }
  if (out.mcpPlan && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --mcp-plan without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, or --prompt");
  }
  if (out.probes && !(out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --probes only with --mcp-check or --mcp-plan");
  }
  if (out.bundle && (out.sample || (out.tasks && !out.fromIntake) || out.graph || out.report || out.prompts || out.promptTemplate)) {
    throw new Error("Use --bundle without --sample, --tasks, --graph, --report, --prompts, or --prompt");
  }
  if (out.bundleCheck && out.stdin) {
    throw new Error("Use --bundle-check with a handoff bundle directory path, not --stdin");
  }
  if (out.bundleCheck && (out.sample || out.tasks || out.bundle || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-check without --sample, --tasks, --bundle, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.bundleCompareTarget && out.stdin) {
    throw new Error("Use --bundle-compare with handoff bundle directory paths, not --stdin");
  }
  if (out.bundleCompareTarget && !out.target) {
    throw new Error("--bundle-compare requires a primary handoff bundle directory path");
  }
  if (out.bundleCompareTarget && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleHandoff || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-compare without --sample, --tasks, --bundle, --bundle-check, --bundle-handoff, --bundle-repair, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.bundleHandoff && out.stdin) {
    throw new Error("Use --bundle-handoff with a handoff bundle directory path, not --stdin");
  }
  if (out.bundleHandoff && !out.target) {
    throw new Error("--bundle-handoff requires a handoff bundle directory path");
  }
  if (out.bundleHandoff && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleRepair || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-handoff without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-repair, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.bundleRepair && out.stdin) {
    throw new Error("Use --bundle-repair with a handoff bundle directory path, not --stdin");
  }
  if (out.bundleRepair && !out.target) {
    throw new Error("--bundle-repair requires a handoff bundle directory path");
  }
  if (out.bundleRepair && (out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.nextActions || out.graph || out.report || out.prompts || out.promptTemplate || out.promptList || out.mcpCheck || out.mcpPlan)) {
    throw new Error("Use --bundle-repair without --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --next-actions, --graph, --report, --prompts, --prompt, --prompt-list, --mcp-check, or --mcp-plan");
  }
  if (out.yes && !out.bundleRepair) {
    throw new Error("Use --yes only with --bundle-repair");
  }
  const initBundleMode = out.init && out.bundle;
  const fromIntakeBundleMode = out.fromIntake && out.bundle;
  const fromIntakeTasksMode = out.fromIntake && out.tasks;
  if (!initBundleMode && !fromIntakeBundleMode && !fromIntakeTasksMode && [out.init, out.fromIntake, out.intakeTemplate, out.sample, out.tasks, out.bundle].filter(Boolean).length > 1) {
    throw new Error("Use only one generated workspace mode: --init, --from-intake, --intake-template, --sample, --tasks, or --bundle");
  }
  if (out.sample && out.strict) {
    throw new Error("Use --sample without --strict; validate the generated file in a separate command");
  }
  if (out.taskSelector && !out.promptTemplate && !out.bundleHandoff) {
    throw new Error("Use --task only with --prompt or --bundle-handoff");
  }
  if (out.taskSelector && out.promptTemplate && out.promptTemplate !== "codex-implementation") {
    throw new Error("Use --task only with --prompt codex-implementation");
  }
  if (out.tasks && (out.json || out.nextActions || out.graph || out.report || out.prompts)) {
    throw new Error("Use --tasks without --json, --next-actions, --graph, --report, or --prompts; validate the generated file in a separate command");
  }
  if (out.tasks && out.promptTemplate) {
    throw new Error("Use --tasks without --prompt; generate tasks in a separate command first");
  }
  if (out.bundle && out.json) {
    throw new Error("--json is not supported with --bundle; use --bundle --out dir for bundle artifacts");
  }
  if (out.bundle && !out.outPath) {
    throw new Error("--bundle requires --out directory");
  }
  const outputModes = [out.report ? "--report" : "", out.prompts ? "--prompts" : "", out.promptTemplate ? "--prompt" : "", out.nextActions ? "--next-actions" : "", out.mcpCheck ? "--mcp-check" : "", out.mcpPlan ? "--mcp-plan" : "", out.graph ? "--graph" : "", out.bundle ? "--bundle" : "", out.bundleCheck ? "--bundle-check" : "", out.bundleCompareTarget ? "--bundle-compare" : "", out.bundleHandoff ? "--bundle-handoff" : "", out.bundleRepair ? "--bundle-repair" : ""].filter(Boolean);
  if (outputModes.length > 1) {
    throw new Error("Use only one output mode: --report, --prompts, --prompt, --next-actions, --mcp-check, --mcp-plan, --graph, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, or --bundle-repair");
  }
  if (out.json && (out.report || out.prompts || out.promptTemplate)) {
    throw new Error("--json is only supported for the site summary, --next-actions, --mcp-check, --mcp-plan, --graph, --bundle-check, --bundle-compare, --bundle-handoff, or --bundle-repair; use --out with --report, --prompts, or --prompt for Markdown artifacts");
  }
  if (out.outPath && !(out.json || out.report || out.prompts || out.promptTemplate || out.init || out.fromIntake || out.intakeTemplate || out.sample || out.tasks || out.bundle || out.bundleCheck || out.bundleCompareTarget || out.bundleHandoff || out.bundleRepair || out.nextActions || out.promptList || out.mcpCheck || out.mcpPlan || out.graph)) {
    throw new Error("--out requires --json, --report, --prompts, --prompt, --init, --from-intake, --intake-template, --sample, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --next-actions, --prompt-list, --mcp-check, --mcp-plan, or --graph");
  }

  const { index, languageProvided, ...parsed } = out;
  return parsed;
}

export function buildSiteIntakeTemplateMarkdown({ language = "en" } = {}) {
  if (!SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.includes(language)) {
    throw new Error(`language must be one of: ${SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.join(", ")}`);
  }
  return language === "ko" ? SITE_INTAKE_TEMPLATE_MARKDOWN_KO : SITE_INTAKE_TEMPLATE_MARKDOWN;
}

export function formatSiteIntakeTemplateJson({ language = "en" } = {}) {
  const content = buildSiteIntakeTemplateMarkdown({ language });
  return JSON.stringify({
    kind: "website-improvement-intake-template",
    version: 1,
    format: "markdown",
    language,
    recommendedFileName: language === "ko" ? "company-website-intake.ko.md" : "company-website-intake.md",
    sections: SITE_INTAKE_TEMPLATE_SECTIONS,
    privacy: {
      storesCredentials: false,
      storesProductionSecrets: false,
      storesCustomerData: false,
    },
    commands: {
      nextActions: "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --next-actions --out website-next-actions.md --force",
      bundle: "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --bundle --out website-handoff-bundle --strict --force",
      bundleCheck: "design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force",
      bundleHandoff: "design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force",
    },
    content,
  }, null, 2);
}

function recommendedMcpForCategory(categoryId) {
  const map = {
    "visual-design": ["browser", "figma"],
    "ux-flow": ["browser", "github"],
    responsive: ["browser", "chromeDevtools"],
    accessibility: ["browser", "chromeDevtools"],
    performance: ["chromeDevtools", "deploy"],
    seo: ["browser", "deploy"],
    "technical-quality": ["github"],
    "runtime-issues": ["browser", "chromeDevtools", "sentry"],
    "content-quality": ["figma", "research", "cms"],
  };
  return map[categoryId] || ["github"];
}

function buildCodexTaskPrompt(workspace, categoryId, finding) {
  const profile = workspace.siteProfile;
  return [
    "You are working in the target website repo, not in design-ai.",
    `Site: ${profile.name}`,
    `Live URL: ${profile.liveUrl}`,
    `Category: ${categoryById(categoryId).label}`,
    `Problem: ${finding}`,
    "",
    "Inspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.",
    "",
    "Implement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
  ].join("\n");
}

function taskFromCategory(workspace, category, finding) {
  const priority = category.id === "accessibility" || category.id === "runtime-issues" ? "p0" : "p1";
  const impact = priority === "p0" ? "high" : "medium";
  return {
    id: `task-${category.id}`,
    title: `Resolve ${category.label} finding`,
    category: category.id,
    problem: finding,
    evidence: "Audit finding captured in the Website Improvement Console.",
    impact,
    effort: "medium",
    priority,
    pages: workspace.siteProfile.pages.slice(0, 3),
    recommendedMcp: recommendedMcpForCategory(category.id),
    codexPrompt: buildCodexTaskPrompt(workspace, category.id, finding),
    verification: [
      ...category.defaultVerification,
      "Run target repo lint/typecheck/build when available",
    ],
    risks: [
      "Target repo architecture may constrain the fix",
      "Manual stakeholder review may be needed before changing copy or brand language",
    ],
  };
}

export function generateSiteRefactorTasks(workspaceInput) {
  const workspace = normalizeSiteWorkspace(workspaceInput);
  const existingIds = new Set(workspace.refactorTasks.map((task) => task.id));
  const existingCategories = new Set(workspace.refactorTasks.map((task) => task.category));
  const created = [];

  for (const category of AUDIT_CATEGORIES) {
    if (existingCategories.has(category.id)) continue;
    const row = workspace.auditChecklist[category.id];
    const findings = row.findings;
    if (findings.length === 0) continue;

    const task = taskFromCategory(workspace, category, findings[0]);
    if (existingIds.has(task.id)) continue;
    created.push(task);
    existingIds.add(task.id);
    existingCategories.add(category.id);
  }

  return {
    workspace: {
      ...workspace,
      updatedAt: workspace.updatedAt,
      refactorTasks: workspace.refactorTasks.concat(created),
    },
    created,
    skippedCount: AUDIT_CATEGORIES.filter((category) => existingCategories.has(category.id)).length - created.length,
  };
}

export function createSampleSiteWorkspace() {
  return {
    version: 1,
    updatedAt: "2026-05-30T00:00:00.000Z",
    siteProfile: {
      id: "sample-korean-saas",
      name: "Korean SaaS marketing site",
      liveUrl: "https://example.com",
      repoUrl: "https://github.com/acme/korean-saas-site",
      localPath: "/Users/you/dev/korean-saas-site",
      figmaUrl: "https://figma.com/file/example",
      brandNotes: "Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.",
      deployProvider: "vercel",
      sentryProject: "acme/korean-saas-web",
      cms: "sanity",
      database: "none",
      pages: ["/", "/pricing", "/signup", "/docs"],
      userFlows: [
        "Visitor compares pricing and starts signup",
        "Existing customer finds feature proof before contacting sales",
      ],
      viewports: ["desktop", "tablet", "mobile"],
    },
    auditChecklist: {
      "visual-design": {
        status: "in-progress",
        notes: "Hero hierarchy and CTA contrast need review before company pilot.",
        findings: ["Primary CTA competes with secondary link on the homepage"],
      },
      "ux-flow": {
        status: "todo",
        notes: "Map visitor path from landing page to pricing and signup.",
        findings: [],
      },
      responsive: {
        status: "todo",
        notes: "Check 1440, 1024, 390, and 360 width layouts.",
        findings: [],
      },
      accessibility: {
        status: "todo",
        notes: "Keyboard and focus audit required for nav, pricing toggle, and forms.",
        findings: ["Focus state is not yet documented for the mobile menu"],
      },
      performance: {
        status: "todo",
        notes: "Run Lighthouse after visual pass.",
        findings: [],
      },
      seo: {
        status: "todo",
        notes: "Inspect title, description, heading order, canonical, OG.",
        findings: [],
      },
      "technical-quality": {
        status: "todo",
        notes: "Confirm component reuse before editing target repo.",
        findings: [],
      },
      "runtime-issues": {
        status: "todo",
        notes: "Open console/network once preview deploy is available.",
        findings: [],
      },
      "content-quality": {
        status: "in-progress",
        notes: "Copy should lead with proof and reduce generic SaaS phrasing.",
        findings: ["Pricing page does not explain plan fit in the first viewport"],
      },
    },
    mcpReadiness: {
      github: "required",
      figma: "optional",
      browser: "required",
      chromeDevtools: "optional",
      deploy: "required",
      sentry: "optional",
      database: "unused",
      cms: "optional",
      collaboration: "optional",
      research: "optional",
    },
    refactorTasks: [
      {
        id: "task-homepage-cta",
        title: "Clarify homepage CTA hierarchy",
        category: "visual-design",
        problem: "Primary and secondary actions compete in the hero, which weakens the visitor's first decision.",
        evidence: "Sample finding: Primary CTA competes with secondary link on the homepage.",
        impact: "high",
        effort: "medium",
        priority: "p1",
        pages: ["/"],
        recommendedMcp: ["browser", "figma"],
        codexPrompt: "Inspect the target homepage implementation, preserve existing design system patterns, and revise the hero CTA hierarchy so the primary signup action is visually dominant while the secondary action remains available.",
        verification: [
          "Run target repo lint/build",
          "Verify desktop/tablet/mobile hero layout",
          "Confirm focus indicators and text contrast",
        ],
        risks: ["Could change conversion copy without stakeholder approval"],
      },
    ],
    implementationEvidence: {
      executedWork: [],
      verificationResults: [],
      remainingRisks: [...DEFAULT_IMPLEMENTATION_RISKS],
      nextActions: [],
    },
    reportNotes: "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
  };
}

function uniqueNormalizedStrings(items, fallback = []) {
  const seen = new Set();
  const result = [];
  const normalized = normalizeStringArray(items);
  const source = normalized.length > 0 ? normalized : normalizeStringArray(fallback);
  for (const item of source) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function slugifySiteId(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "website-project";
}

function buildInitAuditChecklist(profile) {
  const pageList = profile.pages.slice(0, 4).join(", ");
  const flowList = profile.userFlows.slice(0, 3).join("; ");
  return Object.fromEntries(
    AUDIT_CATEGORIES.map((category) => {
      const notes = {
        "visual-design": `Review layout, typography, color, spacing, hierarchy, and CTA treatment across ${pageList}.`,
        "ux-flow": `Map and test the primary flow(s): ${flowList}.`,
        responsive: `Verify configured viewports: ${profile.viewports.join(", ")}.`,
        accessibility: "Check keyboard navigation, focus indicators, semantic structure, ARIA usage, and contrast before implementation handoff.",
        performance: "Run target-repo or deployment performance checks after the first visual/UX pass.",
        seo: "Inspect title, description, canonical, OG metadata, sitemap exposure, and heading order for priority pages.",
        "technical-quality": "Inspect target repo architecture before editing; preserve existing components, tokens, styling conventions, and verification commands.",
        "runtime-issues": "Use Browser/Chrome DevTools or deployment logs to check console errors, network failures, hydration issues, and broken assets.",
        "content-quality": "Review copy clarity, information architecture, proof points, trust signals, Korean/English tone, and CTA wording.",
      }[category.id];
      return [
        category.id,
        {
          status: "todo",
          notes,
          findings: [],
        },
      ];
    }),
  );
}

function buildInitMcpReadiness(profile) {
  const hasRepoReference = Boolean(profile.repoUrl || profile.localPath);
  return {
    github: hasRepoReference ? "required" : "optional",
    figma: profile.figmaUrl ? "optional" : "unused",
    browser: "required",
    chromeDevtools: "optional",
    deploy: profile.deployProvider && profile.deployProvider !== "none" ? "required" : "optional",
    sentry: profile.sentryProject ? "optional" : "unused",
    database: profile.database && profile.database !== "none" ? "optional" : "unused",
    cms: profile.cms && profile.cms !== "none" ? "optional" : "unused",
    collaboration: "optional",
    research: "optional",
  };
}

export function createSiteWorkspaceFromInitOptions(options = {}) {
  const name = String(options.name || "").trim();
  const liveUrl = String(options.liveUrl || "").trim();
  if (!name) {
    throw new Error("--init requires --name");
  }
  if (!liveUrl) {
    throw new Error("--init requires --live-url");
  }

  const profile = {
    id: slugifySiteId(name),
    name,
    liveUrl,
    repoUrl: String(options.repoUrl || "").trim(),
    localPath: String(options.localPath || "").trim(),
    figmaUrl: String(options.figmaUrl || "").trim(),
    brandNotes: String(options.brandNotes || "").trim(),
    deployProvider: normalizeEnum(options.deployProvider, DEPLOY_OPTIONS, "none"),
    sentryProject: String(options.sentryProject || "").trim(),
    cms: normalizeEnum(options.cms, CMS_OPTIONS, "none"),
    database: normalizeEnum(options.database, DATABASE_OPTIONS, "none"),
    pages: uniqueNormalizedStrings(options.pages, ["/"]),
    userFlows: uniqueNormalizedStrings(options.userFlows, [
      "Visitor reviews the site and completes the primary conversion flow",
    ]),
    viewports: uniqueNormalizedStrings(options.viewports, ["desktop", "tablet", "mobile"])
      .filter((viewport) => VIEWPORT_OPTIONS.includes(viewport)),
  };
  if (profile.viewports.length === 0) {
    profile.viewports = ["desktop", "tablet", "mobile"];
  }

  return normalizeSiteWorkspace({
    version: 1,
    updatedAt: new Date().toISOString(),
    siteProfile: profile,
    auditChecklist: buildInitAuditChecklist(profile),
    mcpReadiness: buildInitMcpReadiness(profile),
    refactorTasks: [],
    implementationEvidence: {
      executedWork: [],
      verificationResults: [],
      remainingRisks: [...DEFAULT_IMPLEMENTATION_RISKS],
      nextActions: [
        "Run `design-ai site <workspace.json> --mcp-check --probes --json` before target-repo implementation.",
        "Add audit findings in the Website Console, then run `design-ai site <workspace.json> --tasks --out website-workspace.tasks.json`.",
      ],
    },
    reportNotes: "Generated by `design-ai site --init` for real-project Website Improvement intake. Actual target repo code changes happen outside this design-ai repository.",
  });
}

function normalizeIntakeLookupKey(value) {
  return String(value || "")
    .replace(/`/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanIntakeCell(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\\\|/g, "|")
    .replace(/^`|`$/g, "")
    .trim();
}

function isBlankIntakeCell(value) {
  const text = cleanIntakeCell(value);
  if (!text) return true;
  if (/^<[^>]+>$/.test(text)) return true;
  if (text.includes(" / ") && (text.match(/`/g) || []).length >= 4) return true;
  return false;
}

function intakeSection(markdown, headingNames) {
  const wanted = new Set(headingNames.map(normalizeIntakeLookupKey));
  const lines = String(markdown || "").split(/\r?\n/);
  const collected = [];
  let active = false;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const key = normalizeIntakeLookupKey(heading[1]);
      active = wanted.has(key);
      continue;
    }
    if (active) {
      collected.push(line);
    }
  }

  return collected.join("\n");
}

function intakeTableRows(section) {
  return String(section || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/.test(line))
    .map((line) => line.slice(1, -1).split("|").map(cleanIntakeCell));
}

function firstValidIntakeEnum(value, allowed, fallback = "none") {
  const text = cleanIntakeCell(value).replace(/`/g, "").trim().toLowerCase();
  if (!text || text.includes(" / ")) return fallback;
  return allowed.find((item) => text === item || text.includes(item)) || fallback;
}

function nonPlaceholderIntakeValue(value) {
  if (isBlankIntakeCell(value)) return "";
  const text = cleanIntakeCell(value);
  if (/^(field|value|항목|값|priority|우선순위|path or url|path 또는 url|flow|status|상태|finding|evidence|page|category)$/i.test(text)) {
    return "";
  }
  return text;
}

const INTAKE_PROFILE_FIELD_MAP = new Map([
  ["site name", "name"],
  ["사이트 이름", "name"],
  ["live url", "liveUrl"],
  ["target repo url", "repoUrl"],
  ["대상 repo url", "repoUrl"],
  ["target repo local path", "localPath"],
  ["대상 repo local path", "localPath"],
  ["figma url", "figmaUrl"],
  ["deploy provider", "deployProvider"],
  ["deploy platform", "deployProvider"],
  ["배포 플랫폼", "deployProvider"],
  ["sentry project", "sentryProject"],
  ["sentry 프로젝트", "sentryProject"],
  ["cms", "cms"],
  ["database", "database"],
]);

const INTAKE_MCP_FIELD_MAP = new Map([
  ["github", "github"],
  ["figma", "figma"],
  ["browser playwright", "browser"],
  ["chrome devtools", "chromeDevtools"],
  ["deploy provider", "deploy"],
  ["배포 플랫폼", "deploy"],
  ["sentry", "sentry"],
  ["database", "database"],
  ["cms", "cms"],
  ["collaboration tool", "collaboration"],
  ["협업 도구", "collaboration"],
  ["research tool", "research"],
  ["리서치 도구", "research"],
]);

const INTAKE_AUDIT_CATEGORY_MAP = new Map([
  ["visual design", "visual-design"],
  ["ux flow", "ux-flow"],
  ["responsive", "responsive"],
  ["accessibility", "accessibility"],
  ["performance", "performance"],
  ["seo", "seo"],
  ["technical quality", "technical-quality"],
  ["runtime issues", "runtime-issues"],
  ["content quality", "content-quality"],
]);

function parseSiteProfileFromIntake(markdown) {
  const profile = {
    name: "",
    liveUrl: "",
    repoUrl: "",
    localPath: "",
    figmaUrl: "",
    brandNotes: "",
    deployProvider: "none",
    sentryProject: "",
    cms: "none",
    database: "none",
    pages: [],
    userFlows: [],
    viewports: ["desktop", "tablet", "mobile"],
  };

  for (const row of intakeTableRows(intakeSection(markdown, ["Site Profile"]))) {
    const field = INTAKE_PROFILE_FIELD_MAP.get(normalizeIntakeLookupKey(row[0]));
    if (!field) continue;
    if (field === "deployProvider") {
      profile.deployProvider = firstValidIntakeEnum(row[1], DEPLOY_OPTIONS, "none");
    } else if (field === "cms") {
      profile.cms = firstValidIntakeEnum(row[1], CMS_OPTIONS, "none");
    } else if (field === "database") {
      profile.database = firstValidIntakeEnum(row[1], DATABASE_OPTIONS, "none");
    } else {
      profile[field] = nonPlaceholderIntakeValue(row[1]);
    }
  }

  const brandNotes = [];
  for (const row of intakeTableRows(intakeSection(markdown, ["Brand And Content Notes"]))) {
    const area = nonPlaceholderIntakeValue(row[0]);
    const note = nonPlaceholderIntakeValue(row[1]);
    if (area && note) {
      brandNotes.push(`${area}: ${note}`);
    }
  }
  if (brandNotes.length > 0) {
    profile.brandNotes = brandNotes.join("\n");
  }

  for (const row of intakeTableRows(intakeSection(markdown, ["Priority Pages", "우선순위 페이지"]))) {
    const page = nonPlaceholderIntakeValue(row[1]);
    if (page && !/^path\b/i.test(page)) {
      profile.pages.push(page);
    }
  }

  for (const row of intakeTableRows(intakeSection(markdown, ["Primary User Flows", "주요 사용자 흐름"]))) {
    const flow = nonPlaceholderIntakeValue(row[1]);
    if (flow && normalizeIntakeLookupKey(flow) !== "flow") {
      profile.userFlows.push(flow);
    }
  }

  return profile;
}

function applyMcpReadinessFromIntake(workspace, markdown) {
  const mcpReadiness = { ...workspace.mcpReadiness };
  for (const row of intakeTableRows(intakeSection(markdown, ["MCP Readiness Notes"]))) {
    const key = INTAKE_MCP_FIELD_MAP.get(normalizeIntakeLookupKey(row[0]));
    if (!key) continue;
    const status = firstValidIntakeEnum(row[1], MCP_STATUS_OPTIONS, "");
    if (status) {
      mcpReadiness[key] = status;
    }
  }
  return mcpReadiness;
}

function applyAuditFindingsFromIntake(workspace, markdown) {
  const auditChecklist = structuredClone(workspace.auditChecklist);
  const pages = new Set(workspace.siteProfile.pages);
  for (const row of intakeTableRows(intakeSection(markdown, ["Initial Audit Findings", "초기 Audit Findings"]))) {
    const categoryId = INTAKE_AUDIT_CATEGORY_MAP.get(normalizeIntakeLookupKey(row[0]));
    const finding = nonPlaceholderIntakeValue(row[1]);
    if (!categoryId || !finding) continue;

    const evidence = nonPlaceholderIntakeValue(row[2]);
    const page = nonPlaceholderIntakeValue(row[3]);
    const findingText = [
      finding,
      evidence ? `Evidence: ${evidence}` : "",
      page ? `Page: ${page}` : "",
    ].filter(Boolean).join(" | ");

    const current = auditChecklist[categoryId] || { status: "todo", notes: "", findings: [] };
    auditChecklist[categoryId] = {
      ...current,
      status: current.status === "done" || current.status === "blocked" ? current.status : "in-progress",
      findings: uniqueNormalizedStrings([...current.findings, findingText]),
    };
    if (page) {
      pages.add(page);
    }
  }
  return { auditChecklist, pages: Array.from(pages) };
}

export function createSiteWorkspaceFromIntakeMarkdown(markdown, { filePath = "company-website-intake.md" } = {}) {
  const profile = parseSiteProfileFromIntake(markdown);
  if (!profile.name) {
    throw new Error(`Intake template ${filePath} requires Site name`);
  }
  if (!profile.liveUrl) {
    throw new Error(`Intake template ${filePath} requires Live URL`);
  }

  const baseWorkspace = createSiteWorkspaceFromInitOptions(profile);
  const { auditChecklist, pages } = applyAuditFindingsFromIntake(baseWorkspace, markdown);
  const workspace = {
    ...baseWorkspace,
    siteProfile: {
      ...baseWorkspace.siteProfile,
      pages: uniqueNormalizedStrings(pages, ["/"]),
    },
    auditChecklist,
    mcpReadiness: applyMcpReadinessFromIntake(baseWorkspace, markdown),
    reportNotes: `Generated by \`design-ai site --from-intake ${filePath}\` from a local company website intake Markdown file. Actual target repo code changes happen outside this design-ai repository.`,
  };

  return normalizeSiteWorkspace(workspace);
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function defaultChecklist() {
  return Object.fromEntries(
    AUDIT_CATEGORIES.map((category) => [
      category.id,
      {
        status: "todo",
        notes: "",
        findings: [],
      },
    ]),
  );
}

function normalizeChecklist(value) {
  const source = normalizeObject(value);
  const fallback = defaultChecklist();
  return Object.fromEntries(
    AUDIT_CATEGORIES.map((category) => {
      const row = normalizeObject(source[category.id]);
      return [
        category.id,
        {
          status: normalizeEnum(row.status, CHECKLIST_STATUS_OPTIONS, fallback[category.id].status),
          notes: String(row.notes || ""),
          findings: normalizeStringArray(row.findings),
        },
      ];
    }),
  );
}

function normalizeMcpReadiness(value) {
  const source = normalizeObject(value);
  return Object.fromEntries(
    MCP_ITEMS.map(([key]) => [
      key,
      normalizeEnum(source[key], MCP_STATUS_OPTIONS, "unused"),
    ]),
  );
}

function normalizeTasks(value) {
  if (!Array.isArray(value)) return [];
  const categoryIds = AUDIT_CATEGORIES.map((category) => category.id);
  return value.map((task, index) => {
    const item = normalizeObject(task);
    return {
      id: String(item.id || `task-${index + 1}`),
      title: String(item.title || "Untitled website improvement task"),
      category: normalizeEnum(item.category, categoryIds, "ux-flow"),
      problem: String(item.problem || ""),
      evidence: String(item.evidence || ""),
      impact: normalizeEnum(item.impact, IMPACT_OPTIONS, "medium"),
      effort: normalizeEnum(item.effort, EFFORT_OPTIONS, "medium"),
      priority: normalizeEnum(item.priority, PRIORITY_OPTIONS, "p2"),
      pages: normalizeStringArray(item.pages),
      recommendedMcp: normalizeStringArray(item.recommendedMcp),
      codexPrompt: String(item.codexPrompt || ""),
      verification: normalizeStringArray(item.verification),
      risks: normalizeStringArray(item.risks),
    };
  });
}

export function normalizeSiteWorkspace(raw) {
  const fallback = createSampleSiteWorkspace();
  const source = normalizeObject(raw);
  const profile = normalizeObject(source.siteProfile);
  const viewports = normalizeStringArray(profile.viewports, fallback.siteProfile.viewports)
    .filter((viewport) => VIEWPORT_OPTIONS.includes(viewport));

  return {
    version: 1,
    updatedAt: String(source.updatedAt || fallback.updatedAt),
    siteProfile: {
      id: String(profile.id || fallback.siteProfile.id),
      name: String(profile.name || fallback.siteProfile.name),
      liveUrl: String(profile.liveUrl || ""),
      repoUrl: String(profile.repoUrl || ""),
      localPath: String(profile.localPath || ""),
      figmaUrl: String(profile.figmaUrl || ""),
      brandNotes: String(profile.brandNotes || ""),
      deployProvider: normalizeEnum(profile.deployProvider, DEPLOY_OPTIONS, "none"),
      sentryProject: String(profile.sentryProject || ""),
      cms: normalizeEnum(profile.cms, CMS_OPTIONS, "none"),
      database: normalizeEnum(profile.database, DATABASE_OPTIONS, "none"),
      pages: normalizeStringArray(profile.pages, fallback.siteProfile.pages),
      userFlows: normalizeStringArray(profile.userFlows, fallback.siteProfile.userFlows),
      viewports: viewports.length ? viewports : ["desktop"],
    },
    auditChecklist: normalizeChecklist(source.auditChecklist || fallback.auditChecklist),
    mcpReadiness: normalizeMcpReadiness(source.mcpReadiness || fallback.mcpReadiness),
    refactorTasks: normalizeTasks(source.refactorTasks || fallback.refactorTasks),
    implementationEvidence: normalizeImplementationEvidence(source.implementationEvidence || fallback.implementationEvidence),
    reportNotes: String(source.reportNotes || ""),
  };
}

function addIssue(issues, level, id, message) {
  issues.push({ level, id, message });
}

function assertEnumIssue(issues, value, allowed, id, label) {
  if (!allowed.includes(value)) {
    addIssue(issues, "fail", id, `${label} must be one of: ${allowed.join(", ")}`);
  }
}

function validateRawWorkspace(raw) {
  const issues = [];
  const root = normalizeObject(raw);
  const profile = normalizeObject(root.siteProfile);
  const checklist = normalizeObject(root.auditChecklist);
  const mcpReadiness = normalizeObject(root.mcpReadiness);

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    addIssue(issues, "fail", "workspace-object", "Workspace JSON must be an object");
    return issues;
  }
  if (root.version !== 1) {
    addIssue(issues, "fail", "workspace-version", "Workspace version must be 1");
  }
  if (!root.siteProfile || typeof root.siteProfile !== "object" || Array.isArray(root.siteProfile)) {
    addIssue(issues, "fail", "site-profile", "siteProfile object is required");
  }
  if (!root.auditChecklist || typeof root.auditChecklist !== "object" || Array.isArray(root.auditChecklist)) {
    addIssue(issues, "fail", "audit-checklist", "auditChecklist object is required");
  }
  if (!root.mcpReadiness || typeof root.mcpReadiness !== "object" || Array.isArray(root.mcpReadiness)) {
    addIssue(issues, "fail", "mcp-readiness", "mcpReadiness object is required");
  }
  if (!Array.isArray(root.refactorTasks)) {
    addIssue(issues, "fail", "refactor-tasks", "refactorTasks array is required");
  }
  if (root.implementationEvidence !== undefined) {
    const evidence = normalizeObject(root.implementationEvidence);
    if (root.implementationEvidence === null || typeof root.implementationEvidence !== "object" || Array.isArray(root.implementationEvidence)) {
      addIssue(issues, "fail", "implementation-evidence", "implementationEvidence must be an object when provided");
    } else {
      for (const key of IMPLEMENTATION_EVIDENCE_KEYS) {
        if (evidence[key] !== undefined && !Array.isArray(evidence[key])) {
          addIssue(issues, "fail", `implementation-evidence-${key}`, `implementationEvidence.${key} must be an array`);
        }
      }
    }
  }

  if (!String(profile.name || "").trim()) {
    addIssue(issues, "fail", "site-name", "siteProfile.name is required");
  }
  if (!String(profile.liveUrl || "").trim()) {
    addIssue(issues, "fail", "site-live-url", "siteProfile.liveUrl is required");
  }
  if (!Array.isArray(profile.pages) || normalizeStringArray(profile.pages).length === 0) {
    addIssue(issues, "warn", "site-pages", "siteProfile.pages should include at least one priority page");
  }
  if (!Array.isArray(profile.userFlows) || normalizeStringArray(profile.userFlows).length === 0) {
    addIssue(issues, "warn", "site-user-flows", "siteProfile.userFlows should include at least one primary user flow");
  }
  if (!Array.isArray(profile.viewports) || normalizeStringArray(profile.viewports).length === 0) {
    addIssue(issues, "warn", "site-viewports", "siteProfile.viewports should include desktop, tablet, or mobile");
  } else {
    for (const viewport of normalizeStringArray(profile.viewports)) {
      assertEnumIssue(issues, viewport, VIEWPORT_OPTIONS, "site-viewport-value", `Viewport '${viewport}'`);
    }
  }
  if (!String(profile.repoUrl || "").trim() && !String(profile.localPath || "").trim()) {
    addIssue(issues, "warn", "site-repo-location", "Provide siteProfile.repoUrl or siteProfile.localPath before Codex implementation handoff");
  }
  if (profile.deployProvider !== undefined) {
    assertEnumIssue(issues, profile.deployProvider, DEPLOY_OPTIONS, "deploy-provider", "siteProfile.deployProvider");
  }
  if (profile.cms !== undefined) {
    assertEnumIssue(issues, profile.cms, CMS_OPTIONS, "cms", "siteProfile.cms");
  }
  if (profile.database !== undefined) {
    assertEnumIssue(issues, profile.database, DATABASE_OPTIONS, "database", "siteProfile.database");
  }

  for (const category of AUDIT_CATEGORIES) {
    const row = normalizeObject(checklist[category.id]);
    if (!checklist[category.id]) {
      addIssue(issues, "warn", `audit-${category.id}`, `${category.label} audit row is missing`);
      continue;
    }
    assertEnumIssue(issues, row.status, CHECKLIST_STATUS_OPTIONS, `audit-${category.id}-status`, `${category.label} status`);
    if (row.findings !== undefined && !Array.isArray(row.findings)) {
      addIssue(issues, "fail", `audit-${category.id}-findings`, `${category.label} findings must be an array`);
    }
  }

  for (const [key, label] of MCP_ITEMS) {
    if (mcpReadiness[key] === undefined) {
      addIssue(issues, "warn", `mcp-${key}`, `${label} MCP readiness status is missing`);
      continue;
    }
    assertEnumIssue(issues, mcpReadiness[key], MCP_STATUS_OPTIONS, `mcp-${key}-status`, `${label} MCP status`);
  }

  if (Array.isArray(root.refactorTasks)) {
    for (const [index, task] of root.refactorTasks.entries()) {
      const item = normalizeObject(task);
      const label = item.title ? `Task '${item.title}'` : `Task ${index + 1}`;
      if (!String(item.title || "").trim()) {
        addIssue(issues, "warn", `task-${index + 1}-title`, `${label} should include a title`);
      }
      if (!String(item.problem || "").trim()) {
        addIssue(issues, "warn", `task-${index + 1}-problem`, `${label} should describe the problem`);
      }
      assertEnumIssue(
        issues,
        item.category,
        AUDIT_CATEGORIES.map((category) => category.id),
        `task-${index + 1}-category`,
        `${label} category`,
      );
      assertEnumIssue(issues, item.impact, IMPACT_OPTIONS, `task-${index + 1}-impact`, `${label} impact`);
      assertEnumIssue(issues, item.effort, EFFORT_OPTIONS, `task-${index + 1}-effort`, `${label} effort`);
      assertEnumIssue(issues, item.priority, PRIORITY_OPTIONS, `task-${index + 1}-priority`, `${label} priority`);
      if (!String(item.codexPrompt || "").trim()) {
        addIssue(issues, "warn", `task-${index + 1}-codex-prompt`, `${label} should include a Codex implementation prompt`);
      }
      if (!Array.isArray(item.verification) || normalizeStringArray(item.verification).length === 0) {
        addIssue(issues, "warn", `task-${index + 1}-verification`, `${label} should include verification steps`);
      }
    }
  }

  return issues;
}

function countBy(items, keyFn, allowed = []) {
  const counts = Object.fromEntries(allowed.map((item) => [item, 0]));
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function statusFromIssues(issues) {
  if (issues.some((issue) => issue.level === "fail")) return "fail";
  if (issues.some((issue) => issue.level === "warn")) return "warn";
  return "pass";
}

function summarizeWorkspace(workspace, issues, filePath) {
  const auditRows = AUDIT_CATEGORIES.map((category) => ({
    category,
    row: workspace.auditChecklist[category.id],
  }));
  const mcpRows = MCP_ITEMS.map(([key, label]) => ({
    key,
    label,
    status: workspace.mcpReadiness[key],
  }));
  const totalFindings = auditRows.reduce((sum, item) => sum + item.row.findings.length, 0);
  const requiredMcp = mcpRows.filter((item) => item.status === "required").map((item) => item.key);
  const evidence = normalizeImplementationEvidence(workspace.implementationEvidence);
  const topTasks = workspace.refactorTasks
    .slice()
    .sort((a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority))
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      category: task.category,
      impact: task.impact,
      effort: task.effort,
      pages: task.pages,
    }));

  return {
    filePath,
    valid: statusFromIssues(issues) !== "fail",
    status: statusFromIssues(issues),
    site: {
      id: workspace.siteProfile.id,
      name: workspace.siteProfile.name,
      liveUrl: workspace.siteProfile.liveUrl,
      repoUrl: workspace.siteProfile.repoUrl,
      localPath: workspace.siteProfile.localPath,
      deployProvider: workspace.siteProfile.deployProvider,
      cms: workspace.siteProfile.cms,
      database: workspace.siteProfile.database,
      pages: workspace.siteProfile.pages,
      userFlows: workspace.siteProfile.userFlows,
      viewports: workspace.siteProfile.viewports,
    },
    counts: {
      pages: workspace.siteProfile.pages.length,
      userFlows: workspace.siteProfile.userFlows.length,
      viewports: workspace.siteProfile.viewports.length,
      auditCategories: AUDIT_CATEGORIES.length,
      auditFindings: totalFindings,
      refactorTasks: workspace.refactorTasks.length,
      executedWork: evidence.executedWork.length,
      verificationResults: evidence.verificationResults.length,
      remainingRisks: evidence.remainingRisks.length,
      nextActions: evidence.nextActions.length,
      requiredMcp: requiredMcp.length,
      optionalMcp: mcpRows.filter((item) => item.status === "optional").length,
      unavailableMcp: mcpRows.filter((item) => item.status === "unavailable").length,
    },
    auditStatusCounts: countBy(auditRows, (item) => item.row.status, CHECKLIST_STATUS_OPTIONS),
    mcpStatusCounts: countBy(mcpRows, (item) => item.status, MCP_STATUS_OPTIONS),
    taskPriorityCounts: countBy(workspace.refactorTasks, (task) => task.priority, PRIORITY_OPTIONS),
    requiredMcp,
    topTasks,
    issues,
  };
}

export function analyzeSiteWorkspace(raw, { filePath = "workspace.json" } = {}) {
  const issues = validateRawWorkspace(raw);
  const workspace = normalizeSiteWorkspace(raw);
  const summary = summarizeWorkspace(workspace, issues, filePath);

  if (summary.status === "pass") {
    addIssue(summary.issues, "pass", "workspace-ready", "Workspace is ready for report and prompt generation");
  }

  return {
    workspace,
    summary: {
      ...summary,
      status: statusFromIssues(summary.issues),
      valid: statusFromIssues(summary.issues) !== "fail",
    },
  };
}

export function loadSiteWorkspaceInput({
  target = "",
  stdin = false,
  cwd = process.cwd(),
  readStdin = () => readFileSync(0, "utf8"),
} = {}) {
  const filePath = stdin ? "stdin" : path.resolve(cwd, target);
  const rawText = stdin ? String(readStdin()) : readFileSync(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error(`Invalid Website Improvement workspace JSON in ${filePath}: ${error.message}`);
  }
  return {
    filePath,
    rawText,
    raw: parsed,
  };
}

export function buildSiteReport({
  target = "",
  stdin = false,
  cwd = process.cwd(),
  readStdin,
} = {}) {
  const input = loadSiteWorkspaceInput({ target, stdin, cwd, readStdin });
  return analyzeSiteWorkspace(input.raw, { filePath: input.filePath });
}

export function formatSiteJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSitePromptTemplatesJson() {
  return JSON.stringify({
    count: SITE_PROMPT_TEMPLATES.length,
    templates: SITE_PROMPT_TEMPLATES,
  }, null, 2);
}

export function formatSitePromptTemplatesHuman() {
  return [
    "Website Improvement prompt templates",
    "",
    ...SITE_PROMPT_TEMPLATES.flatMap((template, index) => [
      `${index + 1}. ${template.id}`,
      `   Label: ${template.label}`,
      `   Agent: ${template.agent}`,
      `   Output: ${template.output}`,
      `   Task selectable: ${template.taskSelectable ? "yes" : "no"}`,
      `   ${template.description}`,
    ]),
    "",
    "Use:",
    "  design-ai site <workspace.json> --prompt <template-id>",
    "  design-ai site <workspace.json> --prompt codex-implementation --task <id-or-number>",
  ].join("\n");
}

function workflowNode(id, type, label, status, data = {}) {
  return {
    id,
    type,
    label,
    status,
    data,
  };
}

function workflowEdge(from, to, type, label) {
  return {
    id: `${from}->${to}:${type}`,
    from,
    to,
    type,
    label,
  };
}

function siteProfileNodeId(profile) {
  return `profile:${profile.id || "site"}`;
}

function workflowGraphMcpNodes(mcpReport) {
  return mcpReport.items.map((item) => workflowNode(
    `mcp:${item.key}`,
    "mcp-readiness",
    item.label,
    item.level,
    {
      key: item.key,
      requestedStatus: item.requestedStatus,
      state: item.state,
      evidence: item.evidence,
      actions: item.actions,
    },
  ));
}

function workflowGraphTaskNode(task) {
  return workflowNode(
    `task:${task.id}`,
    "refactor-task",
    task.title,
    "planned",
    {
      id: task.id,
      category: task.category,
      problem: task.problem,
      evidence: task.evidence,
      impact: task.impact,
      effort: task.effort,
      priority: task.priority,
      pages: task.pages,
      recommendedMcp: task.recommendedMcp,
      codexPrompt: task.codexPrompt,
      verification: task.verification,
      risks: task.risks,
    },
  );
}

export function buildSiteWorkflowGraph(workspaceInput, summary = {}) {
  const taskResult = generateSiteRefactorTasks(workspaceInput);
  const workspace = taskResult.workspace;
  const filePath = summary.filePath || "workspace.json";
  const { summary: taskSummary } = analyzeSiteWorkspace(workspace, { filePath });
  const mcpReport = buildSiteMcpCheckReport(workspace, taskSummary);
  const profile = workspace.siteProfile;
  const profileNodeId = siteProfileNodeId(profile);
  const orderedTasks = orderedRefactorTasks(workspace);
  const nodes = [];
  const edges = [];

  nodes.push(workflowNode(
    "workspace:intake",
    "workspace",
    "Workspace intake",
    taskSummary.status,
    {
      version: workspace.version,
      updatedAt: workspace.updatedAt,
      source: filePath,
      workspaceStatus: taskSummary.status,
      mcpStatus: mcpReport.status,
    },
  ));
  nodes.push(workflowNode(
    profileNodeId,
    "site-profile",
    profile.name,
    taskSummary.status,
    {
      id: profile.id,
      liveUrl: profile.liveUrl,
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      figmaUrl: profile.figmaUrl,
      deployProvider: profile.deployProvider,
      cms: profile.cms,
      database: profile.database,
      pages: profile.pages,
      userFlows: profile.userFlows,
      viewports: profile.viewports,
      brandNotes: profile.brandNotes,
    },
  ));
  edges.push(workflowEdge("workspace:intake", profileNodeId, "profile", "Workspace defines the target site profile"));

  for (const category of AUDIT_CATEGORIES) {
    const row = workspace.auditChecklist[category.id];
    const nodeId = `audit:${category.id}`;
    nodes.push(workflowNode(
      nodeId,
      "audit-category",
      category.label,
      row.status,
      {
        category: category.id,
        notes: row.notes,
        findings: row.findings,
        findingCount: row.findings.length,
        defaultVerification: category.defaultVerification,
      },
    ));
    edges.push(workflowEdge(profileNodeId, nodeId, "audit-input", "Site context drives this audit category"));
  }

  const mcpNodes = workflowGraphMcpNodes(mcpReport);
  nodes.push(...mcpNodes);
  for (const node of mcpNodes) {
    edges.push(workflowEdge(profileNodeId, node.id, "readiness-input", "Site profile provides MCP readiness evidence"));
  }

  for (const task of orderedTasks) {
    const taskNode = workflowGraphTaskNode(task);
    nodes.push(taskNode);
    edges.push(workflowEdge(`audit:${task.category}`, taskNode.id, "finding-to-task", "Audit finding informs this refactor task"));
    edges.push(workflowEdge(profileNodeId, taskNode.id, "site-context", "Site profile scopes this refactor task"));
    for (const rawMcp of task.recommendedMcp) {
      const key = normalizeMcpKey(rawMcp);
      if (workspace.mcpReadiness[key]) {
        edges.push(workflowEdge(`mcp:${key}`, taskNode.id, "mcp-support", "MCP readiness supports task execution"));
      }
    }
  }

  for (const template of SITE_PROMPT_TEMPLATES) {
    const promptNodeId = `prompt:${template.id}`;
    nodes.push(workflowNode(
      promptNodeId,
      "prompt-template",
      template.label,
      "ready",
      {
        id: template.id,
        agent: template.agent,
        output: template.output,
        description: template.description,
        taskSelectable: template.taskSelectable,
      },
    ));
    edges.push(workflowEdge(profileNodeId, promptNodeId, "profile-context", "Prompt template receives site profile context"));
  }

  for (const task of orderedTasks) {
    edges.push(workflowEdge(`task:${task.id}`, "prompt:codex-implementation", "implementation-prompt", "Task can be exported as a Codex implementation prompt"));
  }

  nodes.push(workflowNode(
    "handoff:report",
    "handoff-report",
    "Handoff report",
    "ready",
    {
      output: "website-handoff.md",
      purpose: "Summarize site state, audit findings, priority improvements, verification, and remaining risk",
    },
  ));
  nodes.push(workflowNode(
    "handoff:bundle",
    "handoff-bundle",
    "Local handoff bundle",
    "ready",
    {
      output: "website-handoff-bundle",
      purpose: "Package the local Website Improvement plan without mutating the target repo",
    },
  ));
  nodes.push(workflowNode(
    "handoff:target-repo",
    "target-repo",
    "Target website repo",
    "external",
    {
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      boundary: "Implementation happens outside the design-ai repository",
    },
  ));
  edges.push(workflowEdge(profileNodeId, "handoff:report", "handoff-input", "Site profile anchors the handoff report"));
  for (const task of orderedTasks) {
    edges.push(workflowEdge(`task:${task.id}`, "handoff:report", "handoff-input", "Refactor task is summarized in the handoff report"));
  }
  for (const item of mcpReport.items.filter((item) => item.requestedStatus !== "unused")) {
    edges.push(workflowEdge(`mcp:${item.key}`, "handoff:report", "readiness-input", "MCP readiness is summarized in the handoff report"));
  }
  for (const template of SITE_PROMPT_TEMPLATES) {
    edges.push(workflowEdge(`prompt:${template.id}`, "handoff:target-repo", "agent-prompt", "Prompt can be used in the target website workflow"));
  }
  edges.push(workflowEdge("handoff:report", "handoff:bundle", "bundle-input", "Handoff report can be packaged into a local bundle"));
  edges.push(workflowEdge("handoff:bundle", "handoff:target-repo", "handoff", "Verified bundle can become target-repo implementation context"));

  const status = combineStatuses(taskSummary.status, mcpReport.status);
  return {
    version: 1,
    kind: "website-improvement-workflow-graph",
    generatedAt: workspace.updatedAt,
    filePath,
    status,
    workspaceStatus: taskSummary.status,
    mcpStatus: mcpReport.status,
    externalCalls: false,
    site: {
      id: profile.id,
      name: profile.name,
      liveUrl: profile.liveUrl,
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
    },
    summary: {
      status,
      workspaceStatus: taskSummary.status,
      mcpStatus: mcpReport.status,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      auditCategoryCount: AUDIT_CATEGORIES.length,
      taskCount: orderedTasks.length,
      generatedTaskCount: taskResult.created.length,
      requiredMcpCount: mcpReport.counts.required,
      promptTemplateCount: SITE_PROMPT_TEMPLATES.length,
    },
    nodes,
    edges,
    boundaries: [
      "deterministic-local",
      "no-external-mcp-calls",
      "no-target-repo-mutation",
      "no-new-dependencies",
    ],
  };
}

export function formatSiteWorkflowGraphJson(graph) {
  return JSON.stringify(graph, null, 2);
}

export function formatSiteWorkflowGraphMarkdown(graph) {
  return [
    `# Website improvement workflow graph: ${graph.site.name}`,
    "",
    "## Summary",
    `- Source: ${graph.filePath}`,
    `- Status: ${graph.status}`,
    `- Workspace status: ${graph.workspaceStatus}`,
    `- MCP status: ${graph.mcpStatus}`,
    `- Nodes: ${graph.summary.nodeCount}`,
    `- Edges: ${graph.summary.edgeCount}`,
    `- Tasks: ${graph.summary.taskCount}`,
    `- Prompt templates: ${graph.summary.promptTemplateCount}`,
    `- External calls: ${graph.externalCalls ? "yes" : "no"}`,
    "",
    "## Nodes",
    markdownTable(
      ["ID", "Type", "Status", "Label"],
      graph.nodes.map((node) => [node.id, node.type, node.status, node.label]),
    ),
    "",
    "## Edges",
    markdownTable(
      ["From", "To", "Type", "Label"],
      graph.edges.map((edge) => [edge.from, edge.to, edge.type, edge.label]),
    ),
    "",
    "## Boundaries",
    "- This graph is deterministic and local.",
    "- No external MCP calls are made.",
    "- It does not mutate the target website repo, run Lighthouse/axe, crawl pages, add dependencies, or write to external systems.",
  ].join("\n");
}

function buildSiteBundleHandoffGuidance(bundleStatus) {
  const strictCommand = "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md";
  const draftCommand = "design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff.md";
  const verifyCommand = "design-ai site <bundle-dir> --bundle-check --strict --json";
  const strictReady = bundleStatus === "pass";
  return {
    strictReady,
    readiness: strictReady ? "ready-for-strict-handoff" : "review-warnings-before-strict-handoff",
    recommendedCommand: strictReady ? strictCommand : draftCommand,
    strictCommand,
    draftCommand,
    verifyCommand,
    note: strictReady
      ? "Use the strict handoff command before target-repo implementation."
      : "Use the draft handoff command only for planning while readiness warnings remain; use the strict handoff command before treating the bundle as implementation authority.",
    executionChecklist: SITE_TARGET_REPO_EXECUTION_CHECKLIST,
  };
}

function buildSiteBundleReadme(workspace, bundleSummary, mcpReport, mcpProbeReport, filePaths) {
  const commandTarget = bundleSummary.source === "stdin" ? "<workspace.json>" : bundleSummary.source;
  const handoff = bundleSummary.handoff;
  return [
    `# Website improvement handoff bundle: ${workspace.siteProfile.name}`,
    "",
    "> Generated by `design-ai site --bundle` from a Website Improvement Console workspace export.",
    "",
    "## Contents",
    markdownTable(
      ["File", "Purpose"],
      filePaths.map((filePath) => {
        const purpose = {
          "summary.json": "Machine-readable bundle manifest and readiness summary",
          "website-workspace.tasks.json": "Workspace JSON with deterministic starter refactor tasks added",
          "mcp-check.json": "Machine-readable MCP readiness gate output",
          "mcp-probes.json": "Machine-readable read-only MCP probe readiness output",
          "mcp-action-plan.md": "Operator-facing MCP readiness action plan",
          "website-handoff.md": "Markdown handoff report for implementation planning",
          "website-prompts.md": "Full Codex and Claude prompt bundle",
          "codex-implementation.md": "Top-priority Codex implementation prompt",
        }[filePath] || "Bundle artifact";
        return [filePath, purpose];
      }),
    ),
    "",
    "## Status",
    `- Bundle status: ${mcpReport.status}`,
    `- Workspace status: ${bundleSummary.workspaceStatus}`,
    `- Source: ${bundleSummary.source}`,
    `- Site: ${workspace.siteProfile.name}`,
    `- Live URL: ${workspace.siteProfile.liveUrl || "not provided"}`,
    `- Repo: ${workspace.siteProfile.repoUrl || workspace.siteProfile.localPath || "not provided"}`,
    `- Tasks: ${bundleSummary.taskGeneration.totalTasks}`,
    `- Evidence entries: ${bundleSummary.implementationEvidence.executedWork + bundleSummary.implementationEvidence.verificationResults}`,
    `- MCP ready: ${mcpReport.counts.ready}/${mcpReport.counts.total}`,
    `- MCP probes: ${mcpProbeReport.pass}/${mcpProbeReport.count} passing`,
    "",
    "## Handoff Readiness",
    `- Strict-ready: ${handoff.strictReady ? "yes" : "no"}`,
    `- Readiness: ${handoff.readiness}`,
    `- Recommended command: \`${handoff.recommendedCommand}\``,
    `- Strict command: \`${handoff.strictCommand}\``,
    `- Draft command: \`${handoff.draftCommand}\``,
    `- Verify command: \`${handoff.verifyCommand}\``,
    `- Note: ${handoff.note}`,
    "",
    "## Target Repo Execution Checklist",
    ...handoff.executionChecklist.map((item) => `- [ ] ${item.label}: ${item.evidence}`),
    "",
    "## Suggested Sequence",
    "1. Read `summary.json`, `mcp-check.json`, `mcp-probes.json`, and `mcp-action-plan.md` first.",
    "2. Run `design-ai site <bundle-dir> --bundle-check --strict --json`; if it exits non-zero, review the warnings or failures before implementation.",
    "3. Run the recommended handoff command above. Use the draft command only for planning while readiness warnings remain.",
    "4. Use `codex-implementation.md` in the target website repo for the top-priority task when you need the raw task prompt.",
    "5. Use `website-prompts.md` for deeper Codex/Claude review, visual QA, deployment verification, competitor research, and final handoff.",
    "6. Record target-repo executed work, verification results, remaining risks, and next actions in `website-handoff.md` after implementation.",
    "",
    "## Regenerate",
    `- \`design-ai site ${commandTarget} --bundle --out website-handoff-bundle --force\``,
    `- \`design-ai site ${commandTarget} --mcp-check --strict --json\``,
    `- \`design-ai site website-handoff-bundle --bundle-check --strict --json\``,
    `- \`design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md\``,
    "",
    "## Checksum Verification",
    "- `summary.json` records SHA-256 checksums for every generated bundle file except `summary.json` itself.",
    "- `summary.json.checksums.bundleDigest` records a deterministic fingerprint of the checksum manifest for quick bundle identity comparison.",
    "- `design-ai site <bundle-dir> --bundle-check --strict --json` recomputes those checksums so transferred or manually edited bundles fail before target-repo handoff.",
    "",
    "## Boundaries",
    "- This bundle is deterministic and local.",
    "- It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.",
  ].join("\n");
}

export function buildSiteHandoffBundle(workspace, summary = {}) {
  const taskResult = generateSiteRefactorTasks(workspace);
  const taskWorkspace = taskResult.workspace;
  const source = summary.filePath || "workspace.json";
  const { summary: taskSummary } = analyzeSiteWorkspace(taskWorkspace, { filePath: source });
  const mcpReport = buildSiteMcpCheckReport(taskWorkspace, taskSummary);
  const mcpProbeReport = buildSiteMcpProbeReport(taskWorkspace);
  const filePaths = SITE_BUNDLE_FILES;
  const bundleStatus = combineStatuses(mcpReport.status, mcpProbeReport.status);
  const handoffGuidance = buildSiteBundleHandoffGuidance(bundleStatus);
  const bundleSummary = {
    version: 1,
    generatedAt: taskWorkspace.updatedAt,
    source,
    status: bundleStatus,
    workspaceStatus: taskSummary.status,
    site: taskSummary.site,
    counts: taskSummary.counts,
    taskGeneration: {
      createdCount: taskResult.created.length,
      skippedCount: taskResult.skippedCount,
      totalTasks: taskWorkspace.refactorTasks.length,
      created: taskResult.created.map((task) => ({
        id: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
      })),
    },
    implementationEvidence: countImplementationEvidence(taskWorkspace.implementationEvidence),
    mcp: {
      status: mcpReport.status,
      counts: mcpReport.counts,
      taskGaps: mcpReport.taskGaps.length,
      probeStatus: mcpProbeReport.status,
      probeCounts: {
        count: mcpProbeReport.count,
        pass: mcpProbeReport.pass,
        warn: mcpProbeReport.warn,
        fail: mcpProbeReport.fail,
      },
    },
    files: filePaths,
    handoff: handoffGuidance,
    boundaries: [
      "deterministic-local",
      "no-external-mcp-calls",
      "no-target-repo-mutation",
      "no-lighthouse-axe-visual-diff",
    ],
  };

  const contentFiles = [
    {
      path: "README.md",
      content: `${buildSiteBundleReadme(taskWorkspace, bundleSummary, mcpReport, mcpProbeReport, filePaths)}\n`,
    },
    {
      path: "website-workspace.tasks.json",
      content: `${JSON.stringify(taskWorkspace, null, 2)}\n`,
    },
    {
      path: "mcp-check.json",
      content: `${formatSiteMcpCheckJson(mcpReport)}\n`,
    },
    {
      path: "mcp-probes.json",
      content: `${JSON.stringify(mcpProbeReport, null, 2)}\n`,
    },
    {
      path: "mcp-action-plan.md",
      content: `${buildSiteMcpActionPlan(taskWorkspace, taskSummary)}\n`,
    },
    {
      path: "website-handoff.md",
      content: `${buildSiteHandoffReport(taskWorkspace)}\n`,
    },
    {
      path: "website-prompts.md",
      content: `${buildSitePromptBundle(taskWorkspace)}\n`,
    },
    {
      path: "codex-implementation.md",
      content: `${buildSiteBundleImplementationPrompt(taskWorkspace)}\n`,
    },
  ];
  bundleSummary.checksums = buildBundleChecksums(contentFiles);

  return {
    status: bundleStatus,
    summary: bundleSummary,
    files: [
      contentFiles.find((file) => file.path === "README.md"),
      {
        path: "summary.json",
        content: `${JSON.stringify(bundleSummary, null, 2)}\n`,
      },
      ...contentFiles.filter((file) => file.path !== "README.md"),
    ],
  };
}

function buildSiteBundleImplementationPrompt(workspace) {
  const tasks = orderedRefactorTasks(workspace);
  if (tasks.length > 0) {
    return buildSitePrompt(workspace, "codex-implementation", { taskSelector: "1" });
  }

  return [
    "# Codex implementation prompt",
    profileBlock(workspace),
    "",
    mcpBlock(workspace),
    "",
    "Task ID: no-refactor-task-yet",
    "Goal: inspect the target website repository, confirm the website improvement workspace facts, and produce concrete audit findings before implementation starts.",
    "",
    "Rules:",
    "- Work in the target website repository, not in this design-ai repository.",
    "- Do not modify production code until you identify specific audit findings and implementation tasks.",
    "- Inspect existing architecture, components, state, styling, and design tokens before proposing edits.",
    "- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.",
    "- Verify desktop, tablet, and mobile layouts before recommending implementation scope.",
    "",
    "Next step:",
    "- Add audit findings to the Website Improvement workspace, then run `design-ai site website-workspace.json --tasks --out website-workspace.tasks.json` and regenerate this implementation prompt with `design-ai site website-workspace.tasks.json --prompt codex-implementation --task 1 --out codex-implementation.md`.",
  ].join("\n");
}

function emptyBundleGeneratedContract(source = "") {
  return {
    available: false,
    source: source || "",
    expectedFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
    verifiedFiles: 0,
    driftFiles: [],
    files: [],
  };
}

function buildBundleGeneratedContract(directory, workspace, source) {
  const contractSource = source || "website-workspace.tasks.json";
  const expectedBundle = buildSiteHandoffBundle(workspace, { filePath: contractSource });
  const expectedFiles = new Map(expectedBundle.files.map((file) => [file.path, file.content]));
  const files = SITE_BUNDLE_CHECKSUM_FILES.map((filePath) => {
    const expectedContent = expectedFiles.get(filePath);
    const expectedDigest = typeof expectedContent === "string" ? sha256Hex(expectedContent) : "";
    const targetPath = path.join(directory, filePath);
    const present = existsSync(targetPath) && statSync(targetPath).isFile();
    const actualDigest = present ? sha256Hex(readFileSync(targetPath, "utf8")) : "";
    return {
      path: filePath,
      present,
      matches: Boolean(present && expectedDigest && actualDigest === expectedDigest),
      expectedDigest,
      actualDigest,
    };
  });
  return {
    available: true,
    source: contractSource,
    expectedFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
    verifiedFiles: files.filter((file) => file.matches).length,
    driftFiles: files.filter((file) => file.present && !file.matches).map((file) => file.path),
    files,
  };
}

function addBundleGeneratedContractIssues(generatedContract, issues) {
  if (!generatedContract.available) return;
  for (const file of generatedContract.files) {
    if (!file.present || file.matches) continue;
    addIssue(
      issues,
      "fail",
      `bundle-generated-${file.path}`,
      `${file.path} does not match the current CLI-generated bundle contract (expected ${shortDigest(file.expectedDigest)}, actual ${shortDigest(file.actualDigest)})`,
    );
  }
}

function formatGeneratedContractDriftLines(generatedContract) {
  const driftFiles = generatedContract.files.filter((file) => file.present && !file.matches);
  if (driftFiles.length === 0) return ["- none"];
  return driftFiles.map((file) => `- ${file.path}: expected ${shortDigest(file.expectedDigest)}, actual ${shortDigest(file.actualDigest)}`);
}

function formatGeneratedContractDriftSummary(generatedContract) {
  if (!generatedContract.driftFiles.length) return "none";
  return generatedContract.driftFiles.join(", ");
}

function buildSiteBundleRepairReportFromChecks({
  beforeReport,
  afterReport = null,
  written = null,
  applied = false,
} = {}) {
  const issues = [];
  const repairGuidance = beforeReport.repairGuidance;

  if (!repairGuidance.available) {
    addIssue(issues, "fail", "bundle-repair-unavailable", repairGuidance.reason);
  } else if (!applied) {
    addIssue(issues, "pass", "bundle-repair-preview-ready", "Bundle repair preview is ready; run again with --yes to rewrite the handoff bundle directory");
  } else if (!afterReport || afterReport.status !== "pass") {
    addIssue(issues, "fail", "bundle-repair-verify-fail", "Bundle repair applied, but the repaired bundle did not pass bundle-check verification");
  } else {
    addIssue(issues, "pass", "bundle-repair-applied", "Bundle repair applied and the regenerated bundle passed local bundle-check verification");
  }

  const status = statusFromIssues(issues);
  return {
    directory: beforeReport.directory,
    workspaceFile: path.join(beforeReport.directory, "website-workspace.tasks.json"),
    dryRun: !applied,
    applied,
    valid: status !== "fail",
    status,
    repairGuidance,
    before: summarizeBundleRepairCheck(beforeReport),
    after: afterReport ? summarizeBundleRepairCheck(afterReport) : null,
    written: written ? {
      directory: written.directory,
      files: written.files,
      count: written.files.length,
    } : null,
    issues,
  };
}

export function buildSiteBundleRepairPreview({
  target,
  cwd = process.cwd(),
} = {}) {
  const beforeReport = buildSiteBundleCheckReport({ target, cwd });
  return buildSiteBundleRepairReportFromChecks({ beforeReport });
}

export function buildSiteBundleRepairBundle({
  target,
  cwd = process.cwd(),
} = {}) {
  const beforeReport = buildSiteBundleCheckReport({ target, cwd });
  const preview = buildSiteBundleRepairReportFromChecks({ beforeReport });
  if (!preview.repairGuidance.available) {
    return {
      preview,
      beforeReport,
      bundle: null,
    };
  }

  const input = loadSiteWorkspaceInput({
    target: preview.workspaceFile,
    cwd,
  });
  const analyzed = analyzeSiteWorkspace(input.raw, { filePath: input.filePath });
  const bundle = buildSiteHandoffBundle(analyzed.workspace, analyzed.summary);
  return {
    preview,
    beforeReport,
    bundle,
  };
}

export function buildSiteBundleRepairAppliedReport({
  beforeReport,
  written,
  cwd = process.cwd(),
} = {}) {
  const afterReport = buildSiteBundleCheckReport({
    target: beforeReport.directory,
    cwd,
  });
  return buildSiteBundleRepairReportFromChecks({
    beforeReport,
    afterReport,
    written,
    applied: true,
  });
}

export function formatSiteBundleRepairJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteBundleRepairHuman(report) {
  const afterLines = report.after ? [
    `After status: ${report.after.status}`,
    `After generated drift files: ${report.after.generatedDriftFiles.length ? report.after.generatedDriftFiles.join(", ") : "none"}`,
    `After bundle digest: ${report.after.checksumBundleDigest || "not recorded"}`,
  ] : [
    "After status: not applied",
  ];
  return [
    `Website Improvement handoff bundle repair: ${report.directory}`,
    "",
    `Status: ${report.status}`,
    `Dry run: ${report.dryRun ? "yes" : "no"}`,
    `Applied: ${report.applied ? "yes" : "no"}`,
    `Workspace: ${report.workspaceFile}`,
    `Before status: ${report.before.status}`,
    `Before generated drift files: ${report.before.generatedDriftFiles.length ? report.before.generatedDriftFiles.join(", ") : "none"}`,
    `Before bundle digest: ${report.before.checksumBundleDigest || "not recorded"}`,
    ...afterLines,
    ...(report.written ? [
      `Written directory: ${report.written.directory}`,
      `Written files: ${report.written.count}`,
    ] : []),
    "",
    "Repair guidance:",
    ...formatBundleRepairGuidanceLines(report.repairGuidance),
    "",
    "Issues:",
    ...report.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
  ].join("\n");
}

function summarizeBundlePayload(summaryPayload) {
  const taskGeneration = normalizeObject(summaryPayload?.taskGeneration);
  const site = normalizeObject(summaryPayload?.site);
  const mcp = normalizeObject(summaryPayload?.mcp);
  const probeCounts = normalizeObject(mcp.probeCounts);
  const checksums = normalizeObject(summaryPayload?.checksums);
  const handoff = normalizeObject(summaryPayload?.handoff);
  return {
    source: String(summaryPayload?.source || ""),
    status: String(summaryPayload?.status || "unknown"),
    workspaceStatus: String(summaryPayload?.workspaceStatus || "unknown"),
    siteName: String(site.name || ""),
    totalTasks: Number.isFinite(taskGeneration.totalTasks) ? taskGeneration.totalTasks : 0,
    implementationEvidence: countImplementationEvidence(summaryPayload?.implementationEvidence),
    mcpStatus: String(mcp.status || "unknown"),
    mcpProbeStatus: String(mcp.probeStatus || "unknown"),
    mcpProbeCounts: {
      count: Number.isInteger(probeCounts.count) && probeCounts.count >= 0 ? probeCounts.count : 0,
      pass: Number.isInteger(probeCounts.pass) && probeCounts.pass >= 0 ? probeCounts.pass : 0,
      warn: Number.isInteger(probeCounts.warn) && probeCounts.warn >= 0 ? probeCounts.warn : 0,
      fail: Number.isInteger(probeCounts.fail) && probeCounts.fail >= 0 ? probeCounts.fail : 0,
    },
    files: Array.isArray(summaryPayload?.files) ? summaryPayload.files.map(String) : [],
    checksumAlgorithm: String(checksums.algorithm || ""),
    checksumBundleDigest: String(checksums.bundleDigest || ""),
    checksumFiles: normalizeObject(checksums.files),
    handoffExecutionChecklist: Array.isArray(handoff.executionChecklist)
      ? handoff.executionChecklist.map((item) => normalizeObject(item))
      : [],
  };
}

function validateBundleHandoffExecutionChecklist(summary, issues) {
  const expectedIds = SITE_TARGET_REPO_EXECUTION_CHECKLIST.map((item) => item.id);
  const actual = Array.isArray(summary.handoffExecutionChecklist) ? summary.handoffExecutionChecklist : [];
  const actualIds = actual.map((item) => String(item.id || ""));
  if (!arraysEqual(actualIds, expectedIds)) {
    addIssue(issues, "fail", "bundle-handoff-execution-checklist", "summary.json handoff.executionChecklist must match the target-repo execution checklist contract");
    return;
  }
  for (const [index, expected] of SITE_TARGET_REPO_EXECUTION_CHECKLIST.entries()) {
    const actualItem = actual[index] || {};
    if (actualItem.label !== expected.label) {
      addIssue(issues, "fail", `bundle-handoff-execution-checklist-${expected.id}-label`, `summary.json handoff.executionChecklist.${expected.id}.label changed`);
    }
    if (actualItem.required !== expected.required) {
      addIssue(issues, "fail", `bundle-handoff-execution-checklist-${expected.id}-required`, `summary.json handoff.executionChecklist.${expected.id}.required changed`);
    }
    if (actualItem.evidence !== expected.evidence) {
      addIssue(issues, "fail", `bundle-handoff-execution-checklist-${expected.id}-evidence`, `summary.json handoff.executionChecklist.${expected.id}.evidence changed`);
    }
  }
}

function summarizeBundleBoundaries(summaryPayload) {
  const boundaries = Array.isArray(summaryPayload?.boundaries)
    ? summaryPayload.boundaries.map(String)
    : [];
  return {
    boundaries,
    externalCalls: false,
    targetRepoMutation: false,
  };
}

export function buildSiteBundleCheckReport({
  target,
  cwd = process.cwd(),
} = {}) {
  const directory = path.resolve(cwd, String(target || ""));
  const issues = [];

  if (!target) {
    addIssue(issues, "fail", "bundle-directory-required", "A handoff bundle directory path is required");
  } else if (!existsSync(directory)) {
    addIssue(issues, "fail", "bundle-directory-missing", `Bundle directory does not exist: ${directory}`);
  } else if (!statSync(directory).isDirectory()) {
    addIssue(issues, "fail", "bundle-directory-type", `Bundle path must be a directory: ${directory}`);
  }

  const canReadDirectory = issues.every((issue) => !issue.id.startsWith("bundle-directory"));
  const expected = new Set(SITE_BUNDLE_FILES);
  const directEntries = canReadDirectory ? readdirSync(directory) : [];
  const directFiles = directEntries.filter((entry) => {
    const targetPath = path.join(directory, entry);
    return existsSync(targetPath) && statSync(targetPath).isFile();
  });
  const unexpectedFiles = directFiles.filter((entry) => !expected.has(entry)).sort();
  const files = SITE_BUNDLE_FILES.map((relativePath) => {
    const targetPath = path.join(directory, relativePath);
    const present = canReadDirectory && existsSync(targetPath) && statSync(targetPath).isFile();
    return {
      path: relativePath,
      present,
    };
  });

  if (canReadDirectory) {
    for (const file of SITE_BUNDLE_FILES) {
      const targetPath = path.join(directory, file);
      if (!existsSync(targetPath)) {
        addIssue(issues, "fail", `bundle-missing-${file}`, `Bundle file is missing: ${file}`);
      } else if (!statSync(targetPath).isFile()) {
        addIssue(issues, "fail", `bundle-file-${file}`, `Bundle path must be a file: ${file}`);
      }
    }
  }

  const summaryPayload = canReadDirectory ? parseBundleJson(directory, "summary.json", issues) : null;
  const workspacePayload = canReadDirectory ? parseBundleJson(directory, "website-workspace.tasks.json", issues) : null;
  const mcpPayload = canReadDirectory ? parseBundleJson(directory, "mcp-check.json", issues) : null;
  const mcpProbePayload = canReadDirectory ? parseBundleJson(directory, "mcp-probes.json", issues) : null;
  const summary = summarizeBundlePayload(summaryPayload);
  const boundarySummary = summarizeBundleBoundaries(summaryPayload);

  let workspaceSummary = null;
  let recomputedMcp = null;
  let recomputedMcpProbes = null;
  let generatedContract = emptyBundleGeneratedContract(summary.source);

  if (summaryPayload) {
    if (summaryPayload.version !== 1) {
      addIssue(issues, "fail", "bundle-summary-version", "summary.json version must be 1");
    }
    if (!["pass", "warn", "fail"].includes(summary.status)) {
      addIssue(issues, "fail", "bundle-summary-status", "summary.json status must be pass, warn, or fail");
    } else if (summary.status === "fail") {
      addIssue(issues, "fail", "bundle-readiness-fail", "summary.json reports a failing handoff bundle");
    } else if (summary.status === "warn") {
      addIssue(issues, "warn", "bundle-readiness-warn", "summary.json reports readiness warnings");
    }
    if (!arraysEqual(summary.files, SITE_BUNDLE_FILES)) {
      addIssue(issues, "fail", "bundle-summary-files", "summary.json files must match the expected handoff bundle manifest");
    }
    validateBundleHandoffExecutionChecklist(summary, issues);
    if (summaryPayload.implementationEvidence !== undefined) {
      const evidenceCounts = normalizeObject(summaryPayload.implementationEvidence);
      if (summaryPayload.implementationEvidence === null || typeof summaryPayload.implementationEvidence !== "object" || Array.isArray(summaryPayload.implementationEvidence)) {
        addIssue(issues, "fail", "bundle-summary-implementation-evidence", "summary.json implementationEvidence must be an object when provided");
      } else {
        for (const key of IMPLEMENTATION_EVIDENCE_KEYS) {
          if (!Number.isInteger(evidenceCounts[key]) || evidenceCounts[key] < 0) {
            addIssue(issues, "fail", `bundle-summary-implementation-evidence-${key}`, `summary.json implementationEvidence.${key} must be a non-negative integer`);
          }
        }
      }
    }
    const boundaries = Array.isArray(summaryPayload.boundaries) ? summaryPayload.boundaries : [];
    for (const boundary of ["deterministic-local", "no-external-mcp-calls", "no-target-repo-mutation"]) {
      if (!boundaries.includes(boundary)) {
        addIssue(issues, "warn", `bundle-boundary-${boundary}`, `summary.json boundaries should include ${boundary}`);
      }
    }

    if (!summaryPayload.checksums) {
      addIssue(issues, "warn", "bundle-checksums-missing", "summary.json should include SHA-256 checksums; regenerate the bundle with the current CLI");
    } else if (summary.checksumAlgorithm !== "sha256") {
      addIssue(issues, "fail", "bundle-checksum-algorithm", "summary.json checksums.algorithm must be sha256");
    } else {
      const checksumFiles = summary.checksumFiles;
      const checksumKeys = Object.keys(checksumFiles).sort();
      const expectedChecksumKeys = SITE_BUNDLE_CHECKSUM_FILES;
      if (!summary.checksumBundleDigest) {
        addIssue(issues, "warn", "bundle-checksum-bundle-digest-missing", "summary.json should include checksums.bundleDigest; regenerate the bundle with the current CLI");
      } else if (!/^[a-f0-9]{64}$/.test(summary.checksumBundleDigest)) {
        addIssue(issues, "fail", "bundle-checksum-bundle-digest-format", "summary.json checksums.bundleDigest must be a SHA-256 hex digest");
      } else {
        const manifestBundleDigest = buildBundleDigest(checksumFiles);
        if (manifestBundleDigest !== summary.checksumBundleDigest) {
          addIssue(issues, "fail", "bundle-checksum-bundle-digest-manifest", "summary.json checksums.bundleDigest does not match the checksum file manifest");
        }
      }
      for (const expectedPath of expectedChecksumKeys) {
        const expectedDigest = checksumFiles[expectedPath];
        if (!expectedDigest) {
          addIssue(issues, "fail", `bundle-checksum-missing-${expectedPath}`, `summary.json is missing a checksum for ${expectedPath}`);
          continue;
        }
        if (!/^[a-f0-9]{64}$/.test(String(expectedDigest))) {
          addIssue(issues, "fail", `bundle-checksum-format-${expectedPath}`, `summary.json checksum for ${expectedPath} must be a SHA-256 hex digest`);
        }
      }
      for (const checksumPath of checksumKeys) {
        if (!expectedChecksumKeys.includes(checksumPath)) {
          addIssue(issues, "fail", `bundle-checksum-unexpected-${checksumPath}`, `summary.json includes an unexpected checksum entry: ${checksumPath}`);
        }
      }
      if (canReadDirectory) {
        for (const expectedPath of expectedChecksumKeys) {
          const targetPath = path.join(directory, expectedPath);
          if (!existsSync(targetPath) || !statSync(targetPath).isFile()) continue;
          const expectedDigest = checksumFiles[expectedPath];
          if (!expectedDigest || !/^[a-f0-9]{64}$/.test(String(expectedDigest))) continue;
          const actualDigest = sha256Hex(readFileSync(targetPath, "utf8"));
          if (actualDigest !== expectedDigest) {
            addIssue(issues, "fail", `bundle-checksum-${expectedPath}`, `${expectedPath} checksum does not match summary.json`);
          }
        }
        if (summary.checksumBundleDigest && /^[a-f0-9]{64}$/.test(summary.checksumBundleDigest)) {
          const actualChecksumFiles = Object.fromEntries(
            expectedChecksumKeys
              .filter((filePath) => {
                const targetPath = path.join(directory, filePath);
                return existsSync(targetPath) && statSync(targetPath).isFile();
              })
              .map((filePath) => [filePath, sha256Hex(readFileSync(path.join(directory, filePath), "utf8"))]),
          );
          if (
            expectedChecksumKeys.every((filePath) => actualChecksumFiles[filePath])
            && buildBundleDigest(actualChecksumFiles) !== summary.checksumBundleDigest
          ) {
            addIssue(issues, "fail", "bundle-checksum-bundle-digest", "Current bundle files do not match summary.json checksums.bundleDigest");
          }
        }
      }
    }
  }

  if (workspacePayload) {
    const analyzed = analyzeSiteWorkspace(workspacePayload, {
      filePath: path.join(directory, "website-workspace.tasks.json"),
    });
    workspaceSummary = analyzed.summary;
    for (const issue of workspaceSummary.issues.filter((item) => item.level !== "pass")) {
      addIssue(issues, issue.level, `workspace-${issue.id}`, issue.message);
    }
    if (summaryPayload && summary.siteName && summary.siteName !== analyzed.workspace.siteProfile.name) {
      addIssue(issues, "fail", "bundle-site-name", "summary.json site name does not match website-workspace.tasks.json");
    }
    if (summaryPayload && summary.totalTasks !== analyzed.workspace.refactorTasks.length) {
      addIssue(issues, "fail", "bundle-task-count", "summary.json taskGeneration.totalTasks does not match website-workspace.tasks.json");
    }
    const workspaceEvidenceCounts = countImplementationEvidence(analyzed.workspace.implementationEvidence);
    if (summaryPayload && summaryPayload.implementationEvidence !== undefined) {
      for (const key of IMPLEMENTATION_EVIDENCE_KEYS) {
        if (summary.implementationEvidence[key] !== workspaceEvidenceCounts[key]) {
          addIssue(issues, "fail", `bundle-implementation-evidence-${key}`, `summary.json implementationEvidence.${key} does not match website-workspace.tasks.json`);
        }
      }
    } else {
      summary.implementationEvidence = workspaceEvidenceCounts;
    }
    if (canReadDirectory && workspaceSummary.status !== "fail") {
      generatedContract = buildBundleGeneratedContract(directory, analyzed.workspace, summary.source);
      addBundleGeneratedContractIssues(generatedContract, issues);
    }
    recomputedMcp = buildSiteMcpCheckReport(analyzed.workspace, analyzed.summary);
    recomputedMcpProbes = buildSiteMcpProbeReport(analyzed.workspace);
  }

  if (mcpPayload && recomputedMcp) {
    if (mcpPayload.status !== recomputedMcp.status) {
      addIssue(issues, "fail", "bundle-mcp-status", "mcp-check.json status does not match recomputed MCP readiness");
    }
    if (!arraysEqual((mcpPayload.items || []).map((item) => item.key), recomputedMcp.items.map((item) => item.key))) {
      addIssue(issues, "fail", "bundle-mcp-items", "mcp-check.json item order does not match the current MCP readiness contract");
    }
    if (JSON.stringify(mcpPayload.counts || {}) !== JSON.stringify(recomputedMcp.counts)) {
      addIssue(issues, "fail", "bundle-mcp-counts", "mcp-check.json counts do not match recomputed MCP readiness");
    }
    if (summaryPayload && summary.mcpStatus !== String(mcpPayload.status || "")) {
      addIssue(issues, "fail", "bundle-summary-mcp-status", "summary.json mcp.status does not match mcp-check.json");
    }
  }

  if (mcpProbePayload && recomputedMcpProbes) {
    if (mcpProbePayload.status !== recomputedMcpProbes.status) {
      addIssue(issues, "fail", "bundle-mcp-probe-status", "mcp-probes.json status does not match recomputed MCP probe readiness");
    }
    if (!arraysEqual((mcpProbePayload.items || []).map((item) => item.id), recomputedMcpProbes.items.map((item) => item.id))) {
      addIssue(issues, "fail", "bundle-mcp-probe-items", "mcp-probes.json item order does not match the current MCP probe contract");
    }
    for (const key of ["count", "pass", "warn", "fail"]) {
      if (mcpProbePayload[key] !== recomputedMcpProbes[key]) {
        addIssue(issues, "fail", `bundle-mcp-probe-${key}`, `mcp-probes.json ${key} does not match recomputed MCP probe readiness`);
      }
    }
    if (summaryPayload && summary.mcpProbeStatus !== String(mcpProbePayload.status || "")) {
      addIssue(issues, "fail", "bundle-summary-mcp-probe-status", "summary.json mcp.probeStatus does not match mcp-probes.json");
    }
    if (summaryPayload) {
      for (const key of ["count", "pass", "warn", "fail"]) {
        if (summary.mcpProbeCounts[key] !== mcpProbePayload[key]) {
          addIssue(issues, "fail", `bundle-summary-mcp-probe-counts-${key}`, `summary.json mcp.probeCounts.${key} does not match mcp-probes.json`);
        }
      }
    }
  }

  if (canReadDirectory) {
    addBundleMarkdownIssue(directory, "README.md", [
      "Website improvement handoff bundle",
      "does not call external MCPs",
      "Target Repo Execution Checklist",
      "Confirm target repo working directory",
    ], issues);
    addBundleMarkdownIssue(directory, "mcp-action-plan.md", [
      "# Website improvement MCP action plan",
    ], issues);
    addBundleMarkdownIssue(directory, "mcp-probes.json", [
      "\"mode\": \"read-only-local\"",
      "\"externalCalls\": false",
    ], issues);
    addBundleMarkdownIssue(directory, "website-handoff.md", [
      "# Website improvement handoff",
    ], issues);
    addBundleMarkdownIssue(directory, "website-prompts.md", [
      "# Website improvement prompt bundle",
    ], issues);
    addBundleMarkdownIssue(directory, "codex-implementation.md", [
      "# Codex implementation prompt",
      "Task ID:",
      "Work in the target website repository, not in this design-ai repository.",
    ], issues);
  }

  if (issues.length === 0) {
    addIssue(issues, "pass", "bundle-ready", "Handoff bundle is complete and internally consistent");
  }

  const status = statusFromIssues(issues);
  const repairGuidance = buildBundleRepairGuidance(directory, generatedContract);
  return {
    directory,
    valid: status !== "fail",
    status,
    counts: {
      expectedFiles: SITE_BUNDLE_FILES.length,
      presentFiles: files.filter((file) => file.present).length,
      missingFiles: files.filter((file) => !file.present).length,
      unexpectedFiles: unexpectedFiles.length,
      expectedChecksumFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
      verifiedChecksumFiles: SITE_BUNDLE_CHECKSUM_FILES.filter((filePath) => {
        const expectedDigest = summary.checksumFiles[filePath];
        const targetPath = path.join(directory, filePath);
        if (!expectedDigest || !/^[a-f0-9]{64}$/.test(String(expectedDigest))) return false;
        if (!canReadDirectory || !existsSync(targetPath) || !statSync(targetPath).isFile()) return false;
        return sha256Hex(readFileSync(targetPath, "utf8")) === expectedDigest;
      }).length,
      checksumFailures: issues.filter((issue) => issue.level === "fail" && issue.id.startsWith("bundle-checksum-")).length,
      expectedGeneratedFiles: generatedContract.expectedFiles,
      verifiedGeneratedFiles: generatedContract.verifiedFiles,
      generatedFailures: issues.filter((issue) => issue.level === "fail" && issue.id.startsWith("bundle-generated-")).length,
      issues: issues.length,
      warnings: issues.filter((issue) => issue.level === "warn").length,
      failures: issues.filter((issue) => issue.level === "fail").length,
    },
    summary,
    workspaceStatus: workspaceSummary?.status || "unknown",
    mcpStatus: mcpPayload?.status || "unknown",
    mcpProbeStatus: mcpProbePayload?.status || "unknown",
    mcpProbeCounts: {
      count: Number.isInteger(mcpProbePayload?.count) && mcpProbePayload.count >= 0 ? mcpProbePayload.count : summary.mcpProbeCounts.count,
      pass: Number.isInteger(mcpProbePayload?.pass) && mcpProbePayload.pass >= 0 ? mcpProbePayload.pass : summary.mcpProbeCounts.pass,
      warn: Number.isInteger(mcpProbePayload?.warn) && mcpProbePayload.warn >= 0 ? mcpProbePayload.warn : summary.mcpProbeCounts.warn,
      fail: Number.isInteger(mcpProbePayload?.fail) && mcpProbePayload.fail >= 0 ? mcpProbePayload.fail : summary.mcpProbeCounts.fail,
    },
    boundaries: boundarySummary.boundaries,
    externalCalls: boundarySummary.externalCalls,
    targetRepoMutation: boundarySummary.targetRepoMutation,
    files,
    unexpectedFiles,
    generatedContract,
    repairGuidance,
    issues,
  };
}

export function formatSiteBundleCheckJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteBundleCheckHuman(report) {
  return [
    `Website Improvement handoff bundle check: ${report.directory}`,
    "",
    `Status: ${report.status}`,
    `Files: ${report.counts.presentFiles}/${report.counts.expectedFiles}`,
    `Checksums: ${report.counts.verifiedChecksumFiles}/${report.counts.expectedChecksumFiles} verified`,
    `Generated contract: ${report.counts.verifiedGeneratedFiles}/${report.counts.expectedGeneratedFiles} verified`,
    `Bundle digest: ${report.summary.checksumBundleDigest || "not recorded"}`,
    `Unexpected files: ${report.unexpectedFiles.length ? report.unexpectedFiles.join(", ") : "none"}`,
    `Generated drift files: ${formatGeneratedContractDriftSummary(report.generatedContract)}`,
    `Source: ${report.summary.source || "unknown"}`,
    `Site: ${report.summary.siteName || "unknown"}`,
    `Tasks: ${report.summary.totalTasks}`,
    `Evidence: executed work ${report.summary.implementationEvidence.executedWork}, verification ${report.summary.implementationEvidence.verificationResults}, risks ${report.summary.implementationEvidence.remainingRisks}, next actions ${report.summary.implementationEvidence.nextActions}`,
    `MCP status: ${report.mcpStatus}`,
    `MCP probe status: ${report.mcpProbeStatus}`,
    `MCP probes: ${report.mcpProbeCounts.pass}/${report.mcpProbeCounts.count} passing, ${report.mcpProbeCounts.warn} warning, ${report.mcpProbeCounts.fail} failing`,
    `Boundary flags: external calls ${report.externalCalls ? "yes" : "no"}; target repo mutation ${report.targetRepoMutation ? "yes" : "no"}`,
    "",
    "Files:",
    ...report.files.map((file) => `- [${file.present ? "pass" : "fail"}] ${file.path}`),
    "",
    "Generated contract drift:",
    ...formatGeneratedContractDriftLines(report.generatedContract),
    "",
    "Repair guidance:",
    ...formatBundleRepairGuidanceLines(report.repairGuidance),
    "",
    "Bundle boundaries:",
    ...(report.boundaries.length ? report.boundaries.map((boundary) => `- ${boundary}`) : ["- none recorded"]),
    "",
    "Issues:",
    ...report.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
  ].join("\n");
}

export function buildSiteBundleCompareReport({ target, compareTarget }) {
  const left = buildSiteBundleCheckReport({ target });
  const right = buildSiteBundleCheckReport({ target: compareTarget });
  const issues = [];

  if (left.status === "fail") {
    addIssue(issues, "fail", "bundle-compare-left-invalid", "Primary bundle must pass bundle-check before comparison can be trusted");
  } else if (left.status === "warn") {
    addIssue(issues, "warn", "bundle-compare-left-warn", "Primary bundle has bundle-check warnings; review them before target-repo handoff");
  }
  if (right.status === "fail") {
    addIssue(issues, "fail", "bundle-compare-right-invalid", "Comparison bundle must pass bundle-check before comparison can be trusted");
  } else if (right.status === "warn") {
    addIssue(issues, "warn", "bundle-compare-right-warn", "Comparison bundle has bundle-check warnings; review them before target-repo handoff");
  }

  const leftDigest = left.summary.checksumBundleDigest || "";
  const rightDigest = right.summary.checksumBundleDigest || "";
  const digestMatch = Boolean(leftDigest && rightDigest && leftDigest === rightDigest);
  const changedFiles = buildBundleFileChanges(left, right);
  const metadataChanges = buildBundleMetadataChanges(left, right);
  const hasDifferences = !digestMatch || changedFiles.length > 0 || metadataChanges.length > 0;
  const hasFailures = issues.some((issue) => issue.level === "fail");

  if (issues.length === 0 && !hasDifferences) {
    addIssue(issues, "pass", "bundle-compare-identical", "Handoff bundles have the same bundle digest and checksum manifest");
  } else if (!hasFailures && hasDifferences) {
    addIssue(issues, "warn", "bundle-compare-different", "Handoff bundles differ; review changed files before target-repo handoff");
  }

  const status = statusFromIssues(issues);
  return {
    status,
    valid: left.valid && right.valid,
    sameBundle: !hasDifferences,
    digestMatch,
    left: summarizeBundleForCompare(left),
    right: summarizeBundleForCompare(right),
    counts: {
      changedFiles: changedFiles.length,
      metadataChanges: metadataChanges.length,
      leftIssues: left.issues.length,
      rightIssues: right.issues.length,
      issues: issues.length,
      warnings: issues.filter((issue) => issue.level === "warn").length,
      failures: issues.filter((issue) => issue.level === "fail").length,
    },
    changedFiles,
    metadataChanges,
    issues,
  };
}

function loadSiteBundleWorkspace(directory) {
  const relativePath = "website-workspace.tasks.json";
  const targetPath = path.join(directory, relativePath);
  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
    throw new Error(`Cannot select a handoff task because ${relativePath} is missing from the bundle`);
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(targetPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot select a handoff task because ${relativePath} is invalid JSON: ${error.message}`);
  }

  return analyzeSiteWorkspace(raw, { filePath: targetPath }).workspace;
}

function summarizeBundleTaskItem(task, index, directory) {
  return {
    number: index + 1,
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    impact: task.impact,
    effort: task.effort,
    pages: normalizeStringArray(task.pages),
    recommendedMcp: normalizeStringArray(task.recommendedMcp),
    handoffTaskArg: task.id,
    handoffOutFile: taskHandoffOutFile(task),
    handoffCommand: buildBundleTaskHandoffCommand(directory, task),
    handoffCommandArgs: buildBundleTaskHandoffCommandArgs(directory, task),
    handoffCommandRunPolicy: "writes-local-file",
    handoffCommandSafety: buildBundleTaskHandoffCommandSafety(task),
    strictHandoffCommand: buildBundleTaskHandoffCommand(directory, task, { strict: true }),
    strictHandoffCommandArgs: buildBundleTaskHandoffCommandArgs(directory, task, { strict: true }),
    strictHandoffCommandRunPolicy: "writes-local-file",
    strictHandoffCommandSafety: buildBundleTaskHandoffCommandSafety(task, { strict: true }),
  };
}

function summarizeBundleTaskCatalog(workspace, directory, selectedTask = null) {
  const items = orderedRefactorTasks(workspace).map((task, index) => summarizeBundleTaskItem(task, index, directory));
  const selectedTaskId = selectedTask?.id || "";
  return {
    source: "website-workspace.tasks.json",
    count: items.length,
    defaultTaskId: items[0]?.id || "",
    selectedTaskId,
    selectionMode: selectedTaskId ? "explicit" : "bundled-default",
    items,
  };
}

function emptyBundleTaskCatalog(error = "") {
  return {
    source: "website-workspace.tasks.json",
    count: 0,
    defaultTaskId: "",
    selectedTaskId: "",
    selectionMode: "unavailable",
    items: [],
    error,
  };
}

function summarizeSelectedTask(task, taskSelector, source, directory = "") {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    impact: task.impact,
    effort: task.effort,
    selector: String(taskSelector || "").trim(),
    source,
    handoffTaskArg: task.id,
    handoffOutFile: taskHandoffOutFile(task),
    handoffCommand: directory ? buildBundleTaskHandoffCommand(directory, task) : "",
    handoffCommandArgs: directory ? buildBundleTaskHandoffCommandArgs(directory, task) : [],
    handoffCommandRunPolicy: directory ? "writes-local-file" : "",
    handoffCommandSafety: directory ? buildBundleTaskHandoffCommandSafety(task) : null,
    strictHandoffCommand: directory ? buildBundleTaskHandoffCommand(directory, task, { strict: true }) : "",
    strictHandoffCommandArgs: directory ? buildBundleTaskHandoffCommandArgs(directory, task, { strict: true }) : [],
    strictHandoffCommandRunPolicy: directory ? "writes-local-file" : "",
    strictHandoffCommandSafety: directory ? buildBundleTaskHandoffCommandSafety(task, { strict: true }) : null,
  };
}

function formatBundleHandoffTaskCatalogLines(taskCatalog) {
  if (!taskCatalog || !Array.isArray(taskCatalog.items) || taskCatalog.items.length === 0) {
    const reason = taskCatalog?.error ? ` ${taskCatalog.error}` : "";
    return [`- No bundle task catalog is available.${reason}`];
  }
  return taskCatalog.items.map((task) => {
    const pages = task.pages.length ? task.pages.join(", ") : "all pages";
    const mcps = task.recommendedMcp.length ? task.recommendedMcp.join(", ") : "none";
    const command = task.strictHandoffCommand || task.handoffCommand || `design-ai site <bundle-dir> --bundle-handoff --task ${task.handoffTaskArg}`;
    return `- ${task.number}. [${task.priority}/${task.impact}/${task.effort}] ${task.id}: ${task.title} (pages: ${pages}; MCP: ${mcps}; command: \`${command}\`)`;
  });
}

function formatBundleHandoffIssueLines(issues) {
  const actionable = issues.filter((issue) => issue.level !== "pass");
  if (actionable.length === 0) return "- No blocking bundle-check issues were found.";
  return actionable.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`).join("\n");
}

function buildSiteBundleHandoffPrompt(checkReport, bundleTexts) {
  const bundleDigest = checkReport.summary.checksumBundleDigest || "not recorded";
  const checksumStatus = `${checkReport.counts.verifiedChecksumFiles}/${checkReport.counts.expectedChecksumFiles} verified`;
  const handoffBoundaries = buildSiteBundleHandoffBoundaries(checkReport);
  const taskSelectionLine = bundleTexts.selectedTask
    ? `${bundleTexts.selectedTask.id} (${bundleTexts.selectedTask.title}; ${bundleTexts.selectedTask.source})`
    : "bundled codex-implementation.md default";
  const bundleReadinessLine = checkReport.status === "pass"
    ? "The bundle passed local bundle-check validation. Proceed in the target website repo after confirming the repo path."
    : "The bundle did not fully pass local bundle-check validation. Resolve the listed bundle issues before treating this as implementation authority.";
  return [
    "# Website improvement target-repo handoff prompt",
    "",
    "You are Codex working in the target website repository, not in the design-ai repository.",
    "Use this verified Website Improvement handoff bundle as read-only planning evidence. Do not modify the design-ai repo while executing this prompt.",
    "",
    "## Verified Bundle",
    `- Bundle directory: ${checkReport.directory}`,
    `- Source bundle provenance: ${checkReport.status}/${checkReport.valid ? "valid" : "invalid"} from ${checkReport.directory}`,
    `- Source bundle strict check command: \`${buildBundleCheckCommand(checkReport.directory, { strict: true })}\``,
    `- Site: ${checkReport.summary.siteName || "unknown"}`,
    `- Source workspace: ${checkReport.summary.source || "unknown"}`,
    `- Bundle status: ${checkReport.status}`,
    `- Workspace status: ${checkReport.workspaceStatus}`,
    `- MCP status: ${checkReport.mcpStatus}`,
    `- MCP probe status: ${checkReport.mcpProbeStatus}`,
    `- MCP probes: ${checkReport.mcpProbeCounts.pass}/${checkReport.mcpProbeCounts.count} passing, ${checkReport.mcpProbeCounts.warn} warning, ${checkReport.mcpProbeCounts.fail} failing`,
    `- Tasks: ${checkReport.summary.totalTasks}`,
    `- Primary task selection: ${taskSelectionLine}`,
    `- Evidence counts: executed work ${checkReport.summary.implementationEvidence.executedWork}, verification ${checkReport.summary.implementationEvidence.verificationResults}, risks ${checkReport.summary.implementationEvidence.remainingRisks}, next actions ${checkReport.summary.implementationEvidence.nextActions}`,
    `- Generated files: ${checkReport.counts.verifiedGeneratedFiles}/${checkReport.counts.expectedGeneratedFiles} match the current CLI bundle contract`,
    `- Generated drift files: ${formatGeneratedContractDriftSummary(checkReport.generatedContract)}`,
    `- SHA-256 bundle digest: ${bundleDigest}`,
    `- Checksums: ${checksumStatus}`,
    `- Handoff generation boundary flags: external calls no; target repo mutation no`,
    `- Handoff boundaries: ${handoffBoundaries.join(", ")}`,
    "",
    "## Available Bundle Tasks",
    `Task catalog source: ${bundleTexts.taskCatalog?.source || "unknown"}`,
    `Default task: ${bundleTexts.taskCatalog?.defaultTaskId || "none"}`,
    ...(bundleTexts.defaultTask?.strictHandoffCommand
      ? [`Default task strict command: \`${bundleTexts.defaultTask.strictHandoffCommand}\``]
      : []),
    `Selected task: ${bundleTexts.taskCatalog?.selectedTaskId || "none"}`,
    ...(bundleTexts.selectedTask?.strictHandoffCommand
      ? [`Selected task strict command: \`${bundleTexts.selectedTask.strictHandoffCommand}\``]
      : []),
    `Effective task: ${bundleTexts.effectiveTask?.id || "none"}`,
    ...(bundleTexts.effectiveTask?.strictHandoffCommand
      ? [`Effective task strict command: \`${bundleTexts.effectiveTask.strictHandoffCommand}\``]
      : []),
    "To choose a specific task, re-run this handoff with `--task <number-or-id>`.",
    ...formatBundleHandoffTaskCatalogLines(bundleTexts.taskCatalog),
    "",
    "## Operator Runbook",
    `Runbook stages: ${bundleTexts.operatorRunbook?.stageCount || 0} (${bundleTexts.operatorRunbook?.requiredStageCount || 0} required, ${bundleTexts.operatorRunbook?.optionalStageCount || 0} optional)`,
    `Next command key: ${bundleTexts.operatorRunbook?.nextCommandKey || "none"}`,
    ...formatBundleHandoffOperatorRunbookLines(bundleTexts.operatorRunbook),
    "",
    "## Bundle Gate",
    bundleReadinessLine,
    formatBundleHandoffIssueLines(checkReport.issues),
    "",
    "Repair guidance:",
    ...formatBundleRepairGuidanceLines(checkReport.repairGuidance),
    "",
    "## Operating Rules",
    "1. Confirm the current working directory is the target website repo before editing files.",
    "2. Inspect the target repo architecture, existing components, design tokens, routing, styling, and test scripts before implementation.",
    "3. Reuse existing UI/system patterns and keep the change scoped to the selected improvement task.",
    "4. Do not add production dependencies unless the target repo clearly requires them and the tradeoff is documented.",
    "5. Preserve WCAG 2.1 AA expectations: visible focus, keyboard reachability, semantic structure, and text contrast.",
    "6. Verify desktop, tablet, and mobile behavior plus target repo lint/typecheck/build commands when available.",
    "7. Keep the handoff bundle files read-only; record implementation evidence in the target repo final response or report.",
    "",
    "## Target Repo Execution Checklist",
    ...SITE_TARGET_REPO_EXECUTION_CHECKLIST.map((item) => `- [ ] ${item.label}: ${item.evidence}`),
    "",
    "## Primary Codex Implementation Prompt",
    bundleTexts.codexImplementation || "_codex-implementation.md was not readable from the bundle._",
    "",
    "## Additional Bundle Context",
    "Use these files only as supporting evidence:",
    "- `website-handoff.md`: audit summary, priority recommendations, and remaining risk context.",
    "- `mcp-probes.json`: read-only MCP probe evidence for repo, Figma, Browser, and deployment references.",
    "- `mcp-action-plan.md`: MCP readiness gaps and operator sequence.",
    "- `website-prompts.md`: alternate Codex/Claude review, QA, deployment, research, and copy prompts.",
    "- `summary.json`: bundle manifest, source workspace, task count, and checksum digest.",
    "",
    "### Handoff Report Snapshot",
    bundleTexts.websiteHandoff || "_website-handoff.md was not readable from the bundle._",
    "",
    "## Required Final Response",
    "Return a concise implementation report with:",
    "- Files changed in the target repo",
    "- The specific website improvement task completed",
    "- Verification commands and browser/viewport checks performed",
    "- Remaining risks or follow-up work",
    `- Bundle digest used for handoff: ${bundleDigest}`,
  ].join("\n");
}

function buildSiteBundleHandoffBoundaries(checkReport) {
  return Array.from(new Set([
    ...normalizeStringArray(checkReport?.boundaries),
    "target-repo-work-after-handoff",
  ]));
}

function summarizeSiteBundleHandoffSource(checkReport) {
  return {
    directory: checkReport.directory,
    sourceWorkspace: checkReport.summary.source || "",
    siteName: checkReport.summary.siteName || "",
    status: checkReport.status,
    valid: checkReport.valid,
    workspaceStatus: checkReport.workspaceStatus || "unknown",
    mcpStatus: checkReport.mcpStatus || "unknown",
    mcpProbeStatus: checkReport.mcpProbeStatus || "unknown",
    checksumAlgorithm: checkReport.summary.checksumAlgorithm || "",
    checksumBundleDigest: checkReport.summary.checksumBundleDigest || "",
    verifiedChecksumFiles: checkReport.counts.verifiedChecksumFiles,
    expectedChecksumFiles: checkReport.counts.expectedChecksumFiles,
    verifiedGeneratedFiles: checkReport.counts.verifiedGeneratedFiles,
    expectedGeneratedFiles: checkReport.counts.expectedGeneratedFiles,
    issueCount: checkReport.issues.length,
    warningCount: checkReport.counts.warnings,
    failureCount: checkReport.counts.failures,
    checkCommand: buildBundleCheckCommand(checkReport.directory),
    checkCommandArgs: buildBundleCheckCommandArgs(checkReport.directory),
    checkCommandRunPolicy: "read-only",
    checkCommandSafety: buildBundleSourceCommandSafety(),
    strictCheckCommand: buildBundleCheckCommand(checkReport.directory, { strict: true }),
    strictCheckCommandArgs: buildBundleCheckCommandArgs(checkReport.directory, { strict: true }),
    strictCheckCommandRunPolicy: "read-only",
    strictCheckCommandSafety: buildBundleSourceCommandSafety({ strict: true }),
    handoffCommand: buildBundleHandoffCommand(checkReport.directory),
    handoffCommandArgs: buildBundleHandoffCommandArgs(checkReport.directory),
    handoffCommandRunPolicy: "read-only",
    handoffCommandSafety: buildBundleSourceCommandSafety(),
    strictHandoffCommand: buildBundleHandoffCommand(checkReport.directory, { strict: true }),
    strictHandoffCommandArgs: buildBundleHandoffCommandArgs(checkReport.directory, { strict: true }),
    strictHandoffCommandRunPolicy: "read-only",
    strictHandoffCommandSafety: buildBundleSourceCommandSafety({ strict: true }),
  };
}

function buildBundleHandoffCommandManifest({
  sourceBundle,
  taskCatalog,
  defaultTask = null,
  selectedTask = null,
  effectiveTask = null,
} = {}) {
  const commands = [];
  const pushCommand = (entry) => {
    if (!entry || !entry.command || !Array.isArray(entry.commandArgs) || entry.commandArgs.length === 0) return;
    commands.push(entry);
  };
  const pushSourceCommand = (key, label, commandKey, argsKey, policyKey, safetyKey) => {
    pushCommand({
      key,
      scope: "source-bundle",
      label,
      command: sourceBundle?.[commandKey] || "",
      commandArgs: sourceBundle?.[argsKey] || [],
      runPolicy: sourceBundle?.[policyKey] || "",
      safety: sourceBundle?.[safetyKey] || null,
      strict: Boolean(sourceBundle?.[safetyKey]?.strict),
      taskId: "",
      outputFile: "",
      defaultTask: false,
      selectedTask: false,
      effectiveTask: false,
    });
  };
  const pushTaskCommand = (task, { strict = false } = {}) => {
    if (!task?.id) return;
    const commandKey = strict ? "strictHandoffCommand" : "handoffCommand";
    const argsKey = strict ? "strictHandoffCommandArgs" : "handoffCommandArgs";
    const policyKey = strict ? "strictHandoffCommandRunPolicy" : "handoffCommandRunPolicy";
    const safetyKey = strict ? "strictHandoffCommandSafety" : "handoffCommandSafety";
    pushCommand({
      key: `task.${task.id}.handoff.${strict ? "strict" : "default"}`,
      scope: "task-handoff",
      label: `${strict ? "Strict " : ""}Task handoff: ${task.id}`,
      command: task[commandKey] || "",
      commandArgs: task[argsKey] || [],
      runPolicy: task[policyKey] || "",
      safety: task[safetyKey] || null,
      strict,
      taskId: task.id,
      taskNumber: Number.isInteger(task.number) ? task.number : null,
      outputFile: task.handoffOutFile || task[safetyKey]?.outputFile || "",
      defaultTask: task.id === defaultTask?.id,
      selectedTask: task.id === selectedTask?.id,
      effectiveTask: task.id === effectiveTask?.id,
    });
  };

  pushSourceCommand("source.bundleCheck", "Bundle check JSON", "checkCommand", "checkCommandArgs", "checkCommandRunPolicy", "checkCommandSafety");
  pushSourceCommand("source.bundleCheck.strict", "Strict bundle check JSON", "strictCheckCommand", "strictCheckCommandArgs", "strictCheckCommandRunPolicy", "strictCheckCommandSafety");
  pushSourceCommand("source.bundleHandoff", "Bundle handoff JSON", "handoffCommand", "handoffCommandArgs", "handoffCommandRunPolicy", "handoffCommandSafety");
  pushSourceCommand("source.bundleHandoff.strict", "Strict bundle handoff JSON", "strictHandoffCommand", "strictHandoffCommandArgs", "strictHandoffCommandRunPolicy", "strictHandoffCommandSafety");
  for (const task of taskCatalog?.items || []) {
    pushTaskCommand(task);
    pushTaskCommand(task, { strict: true });
  }

  const countBy = (predicate) => commands.filter(predicate).length;
  const effectiveTaskId = effectiveTask?.id || "";
  const selectedTaskId = selectedTask?.id || "";
  const defaultTaskId = defaultTask?.id || "";
  return {
    version: 1,
    source: "bundle-handoff",
    commandCount: commands.length,
    sourceCommandCount: countBy((command) => command.scope === "source-bundle"),
    taskCommandCount: countBy((command) => command.scope === "task-handoff"),
    readOnlyCount: countBy((command) => command.runPolicy === "read-only"),
    localOutputFileCount: countBy((command) => command.runPolicy === "writes-local-file"),
    externalCallCount: countBy((command) => command.safety?.externalCalls === true),
    targetRepoMutationCount: countBy((command) => command.safety?.targetRepoMutation === true),
    requiresCleanWorkspaceCount: countBy((command) => command.safety?.requiresCleanWorkspace === true),
    requiresReviewBeforeMutationCount: countBy((command) => command.safety?.requiresReviewBeforeMutation === true),
    defaultTaskId,
    selectedTaskId,
    effectiveTaskId,
    defaultStrictTaskCommandKey: defaultTaskId ? `task.${defaultTaskId}.handoff.strict` : "",
    selectedStrictTaskCommandKey: selectedTaskId ? `task.${selectedTaskId}.handoff.strict` : "",
    effectiveStrictTaskCommandKey: effectiveTaskId ? `task.${effectiveTaskId}.handoff.strict` : "",
    commands,
  };
}

function buildBundleHandoffOperatorRunbook(commandManifest) {
  const commands = Array.isArray(commandManifest?.commands) ? commandManifest.commands : [];
  const commandByKey = new Map(commands.map((command) => [command.key, command]));
  const buildStage = ({
    step,
    key,
    label,
    kind,
    required,
    commandKeys = [],
    reason,
    manual = false,
  }) => {
    const stageCommands = commandKeys
      .map((commandKey) => commandByKey.get(commandKey))
      .filter(Boolean);
    return {
      step,
      key,
      label,
      kind,
      required,
      commandKeys,
      commands: stageCommands,
      commandCount: stageCommands.length,
      runPolicy: manual ? "manual-target-repo" : (stageCommands[0]?.runPolicy || ""),
      safetyLevel: manual ? "operator-controlled-target-repo" : (stageCommands[0]?.safety?.safetyLevel || ""),
      writesLocalFile: stageCommands.some((command) => command.safety?.writesLocalFile === true),
      outputFiles: stageCommands.map((command) => command.outputFile).filter(Boolean),
      externalCalls: stageCommands.some((command) => command.safety?.externalCalls === true),
      targetRepoMutation: stageCommands.some((command) => command.safety?.targetRepoMutation === true),
      reason,
    };
  };
  const effectiveStrictTaskCommandKey = commandManifest?.effectiveStrictTaskCommandKey || "";
  const stages = [
    buildStage({
      step: 1,
      key: "verifySourceBundle",
      label: "Verify source bundle integrity",
      kind: "read-only-gate",
      required: true,
      commandKeys: ["source.bundleCheck.strict"],
      reason: "Confirm the bundle still matches its checksum and generated-file contract before handoff execution.",
    }),
    buildStage({
      step: 2,
      key: "refreshHandoffSnapshot",
      label: "Refresh strict handoff JSON snapshot",
      kind: "read-only-preview",
      required: false,
      commandKeys: ["source.bundleHandoff.strict"],
      reason: "Regenerate the machine-readable handoff snapshot when a wrapper or GUI needs the latest JSON contract.",
    }),
    buildStage({
      step: 3,
      key: "writeEffectiveTaskPrompt",
      label: "Write effective task handoff prompt",
      kind: "local-output",
      required: true,
      commandKeys: effectiveStrictTaskCommandKey ? [effectiveStrictTaskCommandKey] : [],
      reason: "Create the selected task prompt as a local file before moving into the target website repository.",
    }),
    buildStage({
      step: 4,
      key: "executeInTargetRepo",
      label: "Execute the task in the target website repo",
      kind: "manual-target-repo",
      required: true,
      manual: true,
      reason: "Open the generated task prompt in the target repo, inspect architecture first, then implement and verify there.",
    }),
    buildStage({
      step: 5,
      key: "recordEvidence",
      label: "Record implementation evidence",
      kind: "manual-reporting",
      required: true,
      manual: true,
      reason: "Return changed files, verification commands, browser/viewport checks, remaining risks, and the bundle digest.",
    }),
  ];
  const commandStages = stages.filter((stage) => stage.commandCount > 0);
  const getStageActionType = (stage) => {
    if (stage.commandCount > 0 && stage.writesLocalFile) return "write-local-output";
    if (stage.commandCount > 0 && stage.required) return "run-local-gate";
    if (stage.commandCount > 0) return "refresh-local-preview";
    if (stage.kind === "manual-target-repo") return "manual-target-repo";
    if (stage.kind === "manual-reporting") return "manual-evidence";
    return "review-stage";
  };
  const getStageActionLabel = (stage) => ({
    verifySourceBundle: "Run strict bundle check",
    refreshHandoffSnapshot: "Refresh strict handoff JSON",
    writeEffectiveTaskPrompt: "Write selected task prompt",
    executeInTargetRepo: "Implement in target repo",
    recordEvidence: "Record verification evidence",
  }[stage.key] || stage.label);
  const getStageActionInstruction = (stage) => ({
    verifySourceBundle: "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff.",
    refreshHandoffSnapshot: "Optional: regenerate the strict handoff JSON snapshot when a wrapper or GUI needs the latest contract.",
    writeEffectiveTaskPrompt: "Write the selected task prompt to a local Markdown file before switching into the target website repo.",
    executeInTargetRepo: "Manual: open the generated prompt in the target website repo, inspect architecture, implement the scoped task, and run target-repo verification.",
    recordEvidence: "Manual: record changed files, verification commands, viewport checks, accessibility checks, remaining risks, and the bundle digest.",
  }[stage.key] || stage.reason);
  const getStageActionButtonLabel = (stage) => ({
    verifySourceBundle: "Run Check",
    refreshHandoffSnapshot: "Refresh JSON",
    writeEffectiveTaskPrompt: "Write Prompt",
    executeInTargetRepo: "Open Target Repo",
    recordEvidence: "Record Evidence",
  }[stage.key] || getStageActionLabel(stage));
  const getStageActionAffordance = (stage) => {
    if (stage.commandCount > 0 && stage.writesLocalFile) return "local-output-button";
    if (stage.commandCount > 0 && stage.required) return "primary-command-button";
    if (stage.commandCount > 0) return "secondary-command-button";
    if (stage.kind === "manual-target-repo") return "manual-target-repo-step";
    if (stage.kind === "manual-reporting") return "manual-evidence-step";
    return "review-step";
  };
  const getStageActionEnabled = (stage) => stage.commandCount > 0;
  const getStageActionStatus = (stage) => {
    if (stage.commandCount > 0 && stage.required) return "ready";
    if (stage.commandCount > 0) return "optional";
    if (stage.kind === "manual-target-repo" || stage.kind === "manual-reporting") return "manual";
    return "blocked";
  };
  const getStageActionStatusLabel = (stage) => ({
    ready: "Ready",
    optional: "Optional",
    manual: "Manual",
    blocked: "Blocked",
  }[getStageActionStatus(stage)]);
  const getStageActionStatusTone = (stage) => ({
    ready: "success",
    optional: "neutral",
    manual: "info",
    blocked: "danger",
  }[getStageActionStatus(stage)]);
  const getStageActionDisabledReasonCode = (stage) => {
    if (getStageActionEnabled(stage)) return "";
    if (stage.kind === "manual-target-repo") return "manual-target-repo-step";
    if (stage.kind === "manual-reporting") return "manual-evidence-step";
    return "missing-local-command";
  };
  const getStageActionDisabledReason = (stage) => ({
    "manual-target-repo-step": "No local design-ai command is available for this stage; execute the generated prompt inside the target website repo.",
    "manual-evidence-step": "No local design-ai command is available for this stage; record evidence after target-repo implementation and verification.",
    "missing-local-command": "No local command is available for this stage.",
  }[getStageActionDisabledReasonCode(stage)] || "");
  const getStageActionPrerequisiteKeys = (stage) => ({
    verifySourceBundle: [],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["verifySourceBundle"],
    executeInTargetRepo: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
    recordEvidence: ["executeInTargetRepo"],
  }[stage.key] || []);
  const getStageLabel = (stageKey) => stages.find((stage) => stage.key === stageKey)?.label || stageKey;
  const getStageActionPrerequisiteLabels = (stage) => getStageActionPrerequisiteKeys(stage).map(getStageLabel);
  const getStageActionBlockedStageKeys = (stage) => stages
    .filter((candidate) => getStageActionPrerequisiteKeys(candidate).includes(stage.key))
    .map((candidate) => candidate.key);
  const getStageActionDependencyReasonCode = (stage) => (
    getStageActionPrerequisiteKeys(stage).length > 0 ? "requires-prerequisite-actions" : ""
  );
  const getStageActionDependencyReason = (stage) => ({
    writeEffectiveTaskPrompt: "Complete Verify source bundle integrity before writing the selected task prompt.",
    executeInTargetRepo: "Complete Verify source bundle integrity and Write effective task handoff prompt before implementing in the target website repo.",
    recordEvidence: "Complete Execute the task in the target website repo before recording implementation evidence.",
  }[stage.key] || "");
  const getStageActionCompletionCriteria = (stage) => ({
    verifySourceBundle: [
      "Strict bundle check status is pass.",
      "Checksum and generated-file drift counts are zero.",
    ],
    refreshHandoffSnapshot: [
      "Strict handoff JSON can be regenerated without target-repo mutation.",
    ],
    writeEffectiveTaskPrompt: [
      "Selected task handoff prompt is written to the expected local Markdown output file.",
      "Output command remains local-output-file only.",
    ],
    executeInTargetRepo: [
      "Target website repo has scoped implementation changes for the selected task.",
      "Target repo lint/typecheck/build or equivalent verification has been run.",
    ],
    recordEvidence: [
      "Changed files, verification commands, viewport checks, accessibility checks, remaining risks, and bundle digest are recorded.",
    ],
  }[stage.key] || []);
  const getStageActionEvidenceRequirements = (stage) => ({
    verifySourceBundle: [
      "Strict bundle-check command output or JSON status.",
      "Bundle digest and zero drift counts.",
    ],
    refreshHandoffSnapshot: [
      "Refreshed strict handoff JSON snapshot when a wrapper consumes the latest contract.",
    ],
    writeEffectiveTaskPrompt: [
      "Generated prompt output file path.",
      "Selected task id and output filename.",
    ],
    executeInTargetRepo: [
      "Target repo changed file list.",
      "Target repo verification command results.",
      "Viewport and accessibility check notes for affected pages.",
    ],
    recordEvidence: [
      "Final evidence record includes changed files, verification, viewport/accessibility checks, risks, and bundle digest.",
    ],
  }[stage.key] || []);
  const getStageActionEvidenceTarget = (stage) => ({
    verifySourceBundle: "local-command-output",
    refreshHandoffSnapshot: "local-command-output",
    writeEffectiveTaskPrompt: "local-output-file",
    executeInTargetRepo: "target-repo-working-tree",
    recordEvidence: "handoff-evidence-record",
  }[stage.key] || "not-applicable");
  const getStageActionEvidenceTargetLabel = (stage) => ({
    "local-command-output": "Local command output",
    "local-output-file": "Local output file",
    "target-repo-working-tree": "Target repo working tree",
    "handoff-evidence-record": "Handoff evidence record",
    "not-applicable": "Not applicable",
  }[getStageActionEvidenceTarget(stage)]);
  const getEvidenceCaptureFieldValueShape = (field) => ({
    textarea: "long-text",
    text: "short-text",
    "file-path": "file-path",
    list: "string-list",
  }[field.inputType] || "text");
  const getEvidenceCaptureFieldEmptyValue = (field) => (
    field.inputType === "list" ? [] : ""
  );
  const getEvidenceCaptureFieldRequirementLabel = (field) => (
    field.required ? "Required" : "Optional"
  );
  const getEvidenceCaptureFieldAriaLabel = (field) => (
    `${field.label} evidence (${field.required ? "required" : "optional"})`
  );
  const getEvidenceCaptureFieldHelpText = (field) => (
    field.validationHint || field.placeholder || ""
  );
  const getEvidenceCaptureFieldSectionKey = (field) => ({
    strictBundleCheckOutput: "source-bundle-verification",
    bundleDigest: "source-bundle-verification",
    handoffJsonSnapshot: "handoff-snapshot",
    promptOutputFile: "handoff-prompt-output",
    selectedTaskId: "handoff-prompt-output",
    targetRepoChangedFiles: "target-repo-changes",
    targetRepoVerificationResults: "target-repo-verification",
    viewportAccessibilityNotes: "viewport-accessibility-qa",
    finalEvidenceRecord: "final-handoff-evidence",
    remainingRisks: "risk-record",
  }[field.key] || "general-evidence");
  const getEvidenceCaptureFieldSectionLabel = (field) => ({
    "source-bundle-verification": "Source bundle verification",
    "handoff-snapshot": "Handoff snapshot",
    "handoff-prompt-output": "Handoff prompt output",
    "target-repo-changes": "Target repo changes",
    "target-repo-verification": "Target repo verification",
    "viewport-accessibility-qa": "Viewport and accessibility QA",
    "final-handoff-evidence": "Final handoff evidence",
    "risk-record": "Risk record",
    "general-evidence": "General evidence",
  }[getEvidenceCaptureFieldSectionKey(field)]);
  const getEvidenceCaptureFieldPayloadNamespace = (field) => ({
    strictBundleCheckOutput: "sourceBundle",
    bundleDigest: "sourceBundle",
    handoffJsonSnapshot: "handoffSnapshot",
    promptOutputFile: "handoffPrompt",
    selectedTaskId: "handoffPrompt",
    targetRepoChangedFiles: "targetRepo",
    targetRepoVerificationResults: "targetRepo",
    viewportAccessibilityNotes: "targetRepo",
    finalEvidenceRecord: "handoffEvidence",
    remainingRisks: "handoffEvidence",
  }[field.key] || "evidence");
  const getEvidenceCaptureFieldPayloadPath = (field) => ({
    strictBundleCheckOutput: "sourceBundle.verification.strictBundleCheckOutput",
    bundleDigest: "sourceBundle.verification.bundleDigest",
    handoffJsonSnapshot: "handoffSnapshot.strictJson",
    promptOutputFile: "handoffPrompt.outputFile",
    selectedTaskId: "handoffPrompt.selectedTaskId",
    targetRepoChangedFiles: "targetRepo.changedFiles",
    targetRepoVerificationResults: "targetRepo.verificationResults",
    viewportAccessibilityNotes: "targetRepo.viewportAccessibilityNotes",
    finalEvidenceRecord: "handoffEvidence.finalRecord",
    remainingRisks: "handoffEvidence.remainingRisks",
  }[field.key] || `evidence.${field.key || "unknown"}`);
  const uniqueValues = (values) => Array.from(new Set(values));
  const cloneEvidenceCaptureValue = (value) => (
    Array.isArray(value) ? [...value] : value
  );
  const setPayloadTemplateValue = (target, payloadPath, value) => {
    const pathParts = String(payloadPath || "").split(".").filter(Boolean);
    if (pathParts.length === 0) {
      return target;
    }
    let cursor = target;
    pathParts.slice(0, -1).forEach((part) => {
      if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
        cursor[part] = {};
      }
      cursor = cursor[part];
    });
    cursor[pathParts[pathParts.length - 1]] = cloneEvidenceCaptureValue(value);
    return target;
  };
  const buildEvidenceCapturePayloadTemplate = (fields) => fields.reduce(
    (template, field) => setPayloadTemplateValue(template, field.payloadPath, field.emptyValue),
    {},
  );
  const buildEvidenceCapturePayloadFlatTemplate = (fields) => Object.fromEntries(
    fields.map((field) => [field.payloadPath, cloneEvidenceCaptureValue(field.emptyValue)]),
  );
  const buildEvidenceCapturePayloadBindings = (fields) => fields.map((field) => ({
    key: field.key,
    label: field.label,
    payloadNamespace: field.payloadNamespace,
    payloadPath: field.payloadPath,
    inputType: field.inputType,
    valueShape: field.valueShape,
    acceptsMultiple: field.acceptsMultiple,
    required: field.required,
    requirementLabel: field.requirementLabel,
    emptyValue: cloneEvidenceCaptureValue(field.emptyValue),
    validationRule: field.validationRule,
    minLength: field.minLength,
    sectionKey: field.sectionKey,
    sectionLabel: field.sectionLabel,
    ariaLabel: field.ariaLabel,
  }));
  const getEvidenceCaptureValidationFailureMessage = (field) => (
    field.required
      ? `Provide ${field.label.toLowerCase()} before marking this action complete.`
      : `Optional: provide ${field.label.toLowerCase()} when available.`
  );
  const buildEvidenceCaptureValidationSpecs = (fields) => fields.map((field) => ({
    key: field.key,
    label: field.label,
    rule: field.validationRule,
    severity: field.required ? "error" : "info",
    required: field.required,
    allowsEmpty: !field.required,
    minLength: field.minLength,
    valueShape: field.valueShape,
    acceptsMultiple: field.acceptsMultiple,
    emptyValue: cloneEvidenceCaptureValue(field.emptyValue),
    message: field.validationHint,
    failureMessage: getEvidenceCaptureValidationFailureMessage(field),
  }));
  const getEvidenceCaptureInitialValidationDisplay = (status) => ({
    "missing-required": {
      statusLabel: "Missing required",
      statusTone: "danger",
      iconName: "alert-circle",
      actionLabel: "Provide evidence",
      helperText: "Required before completion",
    },
    "optional-empty": {
      statusLabel: "Optional empty",
      statusTone: "info",
      iconName: "info",
      actionLabel: "Add optional evidence",
      helperText: "Can remain empty",
    },
  }[status] || {
    statusLabel: "Unknown",
    statusTone: "neutral",
    iconName: "circle",
    actionLabel: "Review",
    helperText: "Review this field",
  });
  const buildEvidenceCaptureInitialValidationStates = (fields) => fields.map((field) => {
    const status = field.required ? "missing-required" : "optional-empty";
    const display = getEvidenceCaptureInitialValidationDisplay(status);
    return {
      key: field.key,
      label: field.label,
      rule: field.validationRule,
      status,
      statusLabel: display.statusLabel,
      statusTone: display.statusTone,
      iconName: display.iconName,
      actionLabel: display.actionLabel,
      helperText: display.helperText,
      valid: !field.required,
      blocking: field.required,
      severity: field.required ? "error" : "info",
      required: field.required,
      allowsEmpty: !field.required,
      touched: false,
      dirty: false,
      valuePresent: false,
      valueLength: 0,
      minLength: field.minLength,
      valueShape: field.valueShape,
      acceptsMultiple: field.acceptsMultiple,
      emptyValue: cloneEvidenceCaptureValue(field.emptyValue),
      payloadPath: field.payloadPath,
      message: field.required
        ? getEvidenceCaptureValidationFailureMessage(field)
        : field.validationHint,
    };
  });
  const buildEvidenceCaptureInitialValidationDisplayMetadata = (fields) => (
    buildEvidenceCaptureInitialValidationStates(fields).map((state) => ({
      key: state.key,
      label: state.label,
      status: state.status,
      statusLabel: state.statusLabel,
      statusTone: state.statusTone,
      iconName: state.iconName,
      actionLabel: state.actionLabel,
      helperText: state.helperText,
      blocking: state.blocking,
      required: state.required,
      message: state.message,
    }))
  );
  const buildEvidenceCaptureInitialValidationChecklist = (fields) => (
    buildEvidenceCaptureInitialValidationStates(fields).map((state) => ({
      key: state.key,
      label: state.label,
      status: state.status,
      statusLabel: state.statusLabel,
      statusTone: state.statusTone,
      iconName: state.iconName,
      actionLabel: state.actionLabel,
      helperText: state.helperText,
      required: state.required,
      blocking: state.blocking,
      completionBlocking: state.blocking,
      checkedInitially: state.valid,
      disabled: false,
      message: state.message,
      payloadPath: state.payloadPath,
    }))
  );
  const buildEvidenceCaptureInitialValidationChecklistSummary = (fields) => {
    const checklist = buildEvidenceCaptureInitialValidationChecklist(fields);
    const checkedItems = checklist.filter((item) => item.checkedInitially);
    const uncheckedItems = checklist.filter((item) => !item.checkedInitially);
    const blockingItems = checklist.filter((item) => item.completionBlocking);
    const blockingUncheckedItems = checklist.filter((item) => item.completionBlocking && !item.checkedInitially);
    const firstUncheckedItem = uncheckedItems[0];
    const status = blockingUncheckedItems.length > 0 ? "blocked" : "ready";
    const completionPercent = checklist.length > 0
      ? Math.round((checkedItems.length / checklist.length) * 100)
      : 100;
    return {
      status,
      statusLabel: status === "blocked" ? "Checklist blocked" : "Checklist ready",
      statusTone: status === "blocked" ? "danger" : "success",
      iconName: status === "blocked" ? "list-x" : "list-checks",
      actionLabel: status === "blocked" ? "Complete required evidence" : "Continue",
      helperText: status === "blocked"
        ? `${blockingUncheckedItems.length} required checklist item(s) need evidence before completion.`
        : "No required checklist items are unchecked on first render.",
      itemCount: checklist.length,
      checkedCount: checkedItems.length,
      uncheckedCount: uncheckedItems.length,
      requiredCount: checklist.filter((item) => item.required).length,
      optionalCount: checklist.filter((item) => !item.required).length,
      blockingCount: blockingItems.length,
      blockingUncheckedCount: blockingUncheckedItems.length,
      nonBlockingCount: checklist.filter((item) => !item.completionBlocking).length,
      completionPercent,
      progressLabel: `${checkedItems.length}/${checklist.length} complete`,
      allCheckedInitially: uncheckedItems.length === 0,
      hasUncheckedItems: uncheckedItems.length > 0,
      hasBlockingUncheckedItems: blockingUncheckedItems.length > 0,
      canCompleteInitially: blockingUncheckedItems.length === 0,
      firstUncheckedItemKey: firstUncheckedItem?.key || "",
      firstUncheckedItemLabel: firstUncheckedItem?.label || "",
      firstUncheckedItemMessage: firstUncheckedItem?.message || "",
    };
  };
  const buildEvidenceCaptureInitialValidationSummary = (fields) => {
    const states = buildEvidenceCaptureInitialValidationStates(fields);
    const blockingStates = states.filter((state) => state.blocking);
    const firstBlockingState = blockingStates[0];
    const status = blockingStates.length > 0 ? "blocked" : "ready";
    return {
      status,
      statusLabel: status === "blocked" ? "Blocked by required evidence" : "Ready for completion",
      statusTone: status === "blocked" ? "danger" : "success",
      iconName: status === "blocked" ? "alert-circle" : "check-circle",
      actionLabel: status === "blocked" ? "Provide required evidence" : "Continue",
      helperText: status === "blocked"
        ? `${blockingStates.length} required evidence field(s) need input before completion.`
        : "No required evidence is missing on first render.",
      fieldCount: states.length,
      requiredCount: states.filter((state) => state.required).length,
      optionalCount: states.filter((state) => !state.required).length,
      validCount: states.filter((state) => state.valid).length,
      invalidCount: states.filter((state) => !state.valid).length,
      blockingCount: blockingStates.length,
      nonBlockingCount: states.filter((state) => !state.blocking).length,
      missingRequiredCount: states.filter((state) => state.status === "missing-required").length,
      optionalEmptyCount: states.filter((state) => state.status === "optional-empty").length,
      dangerDisplayCount: states.filter((state) => state.statusTone === "danger").length,
      infoDisplayCount: states.filter((state) => state.statusTone === "info").length,
      allFieldsPristine: states.every((state) => !state.dirty && !state.touched),
      canCompleteInitially: blockingStates.length === 0,
      firstBlockingFieldKey: firstBlockingState?.key || "",
      firstBlockingFieldLabel: firstBlockingState?.label || "",
      firstBlockingMessage: firstBlockingState?.message || "",
    };
  };
  const getStageActionEvidenceCaptureFields = (stage) => ({
    verifySourceBundle: [
      {
        key: "strictBundleCheckOutput",
        label: "Strict bundle-check output",
        inputType: "textarea",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "Paste the strict bundle-check pass output or JSON status.",
        validationRule: "non-empty-text",
        minLength: 20,
        example: "Status: pass; checksumFailures: 0; generatedFailures: 0",
        validationHint: "Required: paste a passing strict bundle-check result.",
      },
      {
        key: "bundleDigest",
        label: "Bundle digest",
        inputType: "text",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "Record the bundle digest or checksum summary.",
        validationRule: "checksum-or-digest-text",
        minLength: 8,
        example: "7685113af4744990fadf301b220b4739066e5f6ec2c40857825211e1167241aa",
        validationHint: "Required: record a digest, checksum, or equivalent bundle integrity summary.",
      },
    ],
    refreshHandoffSnapshot: [
      {
        key: "handoffJsonSnapshot",
        label: "Strict handoff JSON snapshot",
        inputType: "textarea",
        required: false,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "Paste or link the refreshed strict handoff JSON snapshot when used.",
        validationRule: "optional-json-snapshot",
        minLength: 0,
        example: "{ \"status\": \"pass\", \"operatorRunbook\": { ... } }",
        validationHint: "Optional: paste the refreshed strict handoff JSON snapshot when available.",
      },
    ],
    writeEffectiveTaskPrompt: [
      {
        key: "promptOutputFile",
        label: "Prompt output file",
        inputType: "file-path",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "target-repo-task-...-handoff.md",
        validationRule: "local-markdown-file-path",
        minLength: 12,
        example: "target-repo-task-accessibility-handoff.md",
        validationHint: "Required: record the local Markdown prompt file path generated for the selected task.",
      },
      {
        key: "selectedTaskId",
        label: "Selected task id",
        inputType: "text",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "task-...",
        validationRule: "task-id",
        minLength: 5,
        example: "task-accessibility",
        validationHint: "Required: record the bundle task id used for the target-repo handoff prompt.",
      },
    ],
    executeInTargetRepo: [
      {
        key: "targetRepoChangedFiles",
        label: "Target repo changed files",
        inputType: "list",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "List changed files from the target website repo.",
        validationRule: "non-empty-file-list",
        minLength: 1,
        example: "src/components/Header.tsx",
        validationHint: "Required: list at least one changed target-repo file or a no-change justification.",
      },
      {
        key: "targetRepoVerificationResults",
        label: "Target repo verification results",
        inputType: "textarea",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "Record lint, typecheck, build, test, or equivalent command results.",
        validationRule: "verification-results",
        minLength: 20,
        example: "npm test: pass; npm run build: pass",
        validationHint: "Required: record target-repo verification commands and results.",
      },
      {
        key: "viewportAccessibilityNotes",
        label: "Viewport and accessibility notes",
        inputType: "textarea",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "Record desktop/tablet/mobile checks, keyboard focus, contrast, and screen-reader notes.",
        validationRule: "viewport-accessibility-notes",
        minLength: 20,
        example: "desktop/tablet/mobile checked; focus visible; contrast AA",
        validationHint: "Required: document viewport coverage plus keyboard, contrast, and screen-reader notes.",
      },
    ],
    recordEvidence: [
      {
        key: "finalEvidenceRecord",
        label: "Final evidence record",
        inputType: "textarea",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "Summarize changed files, verification, viewport/accessibility checks, risks, and digest.",
        validationRule: "final-evidence-record",
        minLength: 30,
        example: "Changed files recorded; verification passed; digest captured",
        validationHint: "Required: summarize changes, verification, viewport/accessibility checks, risks, and digest.",
      },
      {
        key: "remainingRisks",
        label: "Remaining risks",
        inputType: "textarea",
        required: true,
        evidenceTarget: getStageActionEvidenceTarget(stage),
        placeholder: "List unresolved risks, skipped checks, or follow-up tasks.",
        validationRule: "risk-notes",
        minLength: 10,
        example: "Stakeholder copy review still pending",
        validationHint: "Required: record unresolved risks, skipped checks, or confirm none remain.",
      },
    ],
  }[stage.key] || []).map((field) => ({
    ...field,
    valueShape: getEvidenceCaptureFieldValueShape(field),
    acceptsMultiple: field.inputType === "list",
    defaultValue: getEvidenceCaptureFieldEmptyValue(field),
    emptyValue: getEvidenceCaptureFieldEmptyValue(field),
    requirementLabel: getEvidenceCaptureFieldRequirementLabel(field),
    ariaLabel: getEvidenceCaptureFieldAriaLabel(field),
    helpText: getEvidenceCaptureFieldHelpText(field),
    sectionKey: getEvidenceCaptureFieldSectionKey(field),
    sectionLabel: getEvidenceCaptureFieldSectionLabel(field),
    payloadNamespace: getEvidenceCaptureFieldPayloadNamespace(field),
    payloadPath: getEvidenceCaptureFieldPayloadPath(field),
  }));
  const stageActionRows = stages.map((stage) => ({
    step: stage.step,
    key: stage.key,
    label: stage.label,
    actionType: getStageActionType(stage),
    actionLabel: getStageActionLabel(stage),
    actionInstruction: getStageActionInstruction(stage),
    actionButtonLabel: getStageActionButtonLabel(stage),
    actionAffordance: getStageActionAffordance(stage),
    actionEnabled: getStageActionEnabled(stage),
    actionStatus: getStageActionStatus(stage),
    actionStatusLabel: getStageActionStatusLabel(stage),
    actionStatusTone: getStageActionStatusTone(stage),
    actionDisabledReasonCode: getStageActionDisabledReasonCode(stage),
    actionDisabledReason: getStageActionDisabledReason(stage),
    actionPrerequisiteKeys: getStageActionPrerequisiteKeys(stage),
    actionPrerequisiteLabels: getStageActionPrerequisiteLabels(stage),
    actionPrerequisiteCount: getStageActionPrerequisiteKeys(stage).length,
    actionHasPrerequisites: getStageActionPrerequisiteKeys(stage).length > 0,
    actionDependencyReasonCode: getStageActionDependencyReasonCode(stage),
    actionDependencyReason: getStageActionDependencyReason(stage),
    actionBlockedStageKeys: getStageActionBlockedStageKeys(stage),
    actionBlockedStageLabels: getStageActionBlockedStageKeys(stage).map(getStageLabel),
    actionBlockedStageCount: getStageActionBlockedStageKeys(stage).length,
    actionBlocksStages: getStageActionBlockedStageKeys(stage).length > 0,
    actionCompletionCriteria: getStageActionCompletionCriteria(stage),
    actionCompletionCriteriaCount: getStageActionCompletionCriteria(stage).length,
    actionHasCompletionCriteria: getStageActionCompletionCriteria(stage).length > 0,
    actionEvidenceRequirements: getStageActionEvidenceRequirements(stage),
    actionEvidenceRequirementCount: getStageActionEvidenceRequirements(stage).length,
    actionRequiresEvidence: getStageActionEvidenceRequirements(stage).length > 0,
    actionEvidenceTarget: getStageActionEvidenceTarget(stage),
    actionEvidenceTargetLabel: getStageActionEvidenceTargetLabel(stage),
    actionEvidenceCaptureFields: getStageActionEvidenceCaptureFields(stage),
    actionEvidenceCaptureFieldKeys: getStageActionEvidenceCaptureFields(stage).map((field) => field.key),
    actionEvidenceCaptureFieldLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.label),
    actionEvidenceCaptureFieldPlaceholders: getStageActionEvidenceCaptureFields(stage).map((field) => field.placeholder),
    actionEvidenceCaptureFieldRequirementLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.requirementLabel),
    actionEvidenceCaptureFieldAriaLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.ariaLabel),
    actionEvidenceCaptureFieldHelpTexts: getStageActionEvidenceCaptureFields(stage).map((field) => field.helpText),
    actionEvidenceCaptureFieldSectionKeys: getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionKey),
    actionEvidenceCaptureFieldSectionLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionLabel),
    actionEvidenceCaptureSectionKeys: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionKey)),
    actionEvidenceCaptureSectionLabels: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionLabel)),
    actionEvidenceCaptureSectionCount: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionKey)).length,
    actionEvidenceCaptureFieldPayloadNamespaces: getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadNamespace),
    actionEvidenceCaptureFieldPayloadPaths: getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadPath),
    actionEvidenceCapturePayloadNamespaces: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadNamespace)),
    actionEvidenceCapturePayloadNamespaceCount: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadNamespace)).length,
    actionEvidenceCapturePayloadTemplate: buildEvidenceCapturePayloadTemplate(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCapturePayloadFlatTemplate: buildEvidenceCapturePayloadFlatTemplate(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCapturePayloadBindings: buildEvidenceCapturePayloadBindings(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureValidationSpecs: buildEvidenceCaptureValidationSpecs(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationStates: buildEvidenceCaptureInitialValidationStates(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationDisplayMetadata: buildEvidenceCaptureInitialValidationDisplayMetadata(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationChecklist: buildEvidenceCaptureInitialValidationChecklist(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationChecklistSummary: buildEvidenceCaptureInitialValidationChecklistSummary(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationSummary: buildEvidenceCaptureInitialValidationSummary(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureFieldInputTypes: getStageActionEvidenceCaptureFields(stage).map((field) => field.inputType),
    actionEvidenceCaptureFieldValueShapes: getStageActionEvidenceCaptureFields(stage).map((field) => field.valueShape),
    actionEvidenceCaptureFieldAcceptsMultiple: getStageActionEvidenceCaptureFields(stage).map((field) => field.acceptsMultiple),
    actionEvidenceCaptureFieldDefaultValues: getStageActionEvidenceCaptureFields(stage).map((field) => field.defaultValue),
    actionEvidenceCaptureFieldEmptyValues: getStageActionEvidenceCaptureFields(stage).map((field) => field.emptyValue),
    actionEvidenceCaptureFieldValidationRules: getStageActionEvidenceCaptureFields(stage).map((field) => field.validationRule),
    actionEvidenceCaptureFieldMinLengths: getStageActionEvidenceCaptureFields(stage).map((field) => field.minLength),
    actionEvidenceCaptureFieldExamples: getStageActionEvidenceCaptureFields(stage).map((field) => field.example),
    actionEvidenceCaptureFieldValidationHints: getStageActionEvidenceCaptureFields(stage).map((field) => field.validationHint),
    actionRequiredEvidenceCaptureFieldKeys: getStageActionEvidenceCaptureFields(stage).filter((field) => field.required).map((field) => field.key),
    actionOptionalEvidenceCaptureFieldKeys: getStageActionEvidenceCaptureFields(stage).filter((field) => !field.required).map((field) => field.key),
    actionEvidenceCaptureFieldCount: getStageActionEvidenceCaptureFields(stage).length,
    actionRequiredEvidenceCaptureFieldCount: getStageActionEvidenceCaptureFields(stage).filter((field) => field.required).length,
    actionOptionalEvidenceCaptureFieldCount: getStageActionEvidenceCaptureFields(stage).filter((field) => !field.required).length,
    actionHasEvidenceCaptureFields: getStageActionEvidenceCaptureFields(stage).length > 0,
    required: stage.required,
    runPolicy: stage.runPolicy,
    safetyLevel: stage.safetyLevel,
    commandKeys: stage.commandKeys,
    commandCount: stage.commandCount,
    outputFiles: stage.outputFiles,
    manual: stage.commandCount === 0,
    writesLocalFile: stage.writesLocalFile,
    externalCalls: stage.externalCalls,
    targetRepoMutation: stage.targetRepoMutation,
  }));
  const stageKeys = stages.map((stage) => stage.key);
  const stageByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage]));
  const stageLabelByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.label]));
  const stageSummaryByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.reason]));
  const stageActionTypeByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionType]));
  const stageActionLabelByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionLabel]));
  const stageActionInstructionsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionInstruction]));
  const stageActionButtonLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionButtonLabel]));
  const stageActionAffordanceByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionAffordance]));
  const stageActionEnabledByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEnabled]));
  const stageActionStatusByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionStatus]));
  const stageActionStatusLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionStatusLabel]));
  const stageActionStatusToneByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionStatusTone]));
  const stageActionDisabledReasonCodeByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDisabledReasonCode]));
  const stageActionDisabledReasonByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDisabledReason]));
  const stageActionPrerequisiteKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionPrerequisiteKeys]));
  const stageActionPrerequisiteLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionPrerequisiteLabels]));
  const stageActionPrerequisiteCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionPrerequisiteCount]));
  const stageActionHasPrerequisitesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionHasPrerequisites]));
  const stageActionDependencyReasonCodeByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDependencyReasonCode]));
  const stageActionDependencyReasonByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDependencyReason]));
  const stageActionBlockedStageKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlockedStageKeys]));
  const stageActionBlockedStageLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlockedStageLabels]));
  const stageActionBlockedStageCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlockedStageCount]));
  const stageActionBlocksStagesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlocksStages]));
  const stageActionCompletionCriteriaByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionCompletionCriteria]));
  const stageActionCompletionCriteriaCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionCompletionCriteriaCount]));
  const stageActionHasCompletionCriteriaByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionHasCompletionCriteria]));
  const stageActionEvidenceRequirementsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceRequirements]));
  const stageActionEvidenceRequirementCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceRequirementCount]));
  const stageActionRequiresEvidenceByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionRequiresEvidence]));
  const stageActionEvidenceTargetByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceTarget]));
  const stageActionEvidenceTargetLabelByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceTargetLabel]));
  const stageActionEvidenceCaptureFieldsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFields]));
  const stageActionEvidenceCaptureFieldKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldKeys]));
  const stageActionEvidenceCaptureFieldLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldLabels]));
  const stageActionEvidenceCaptureFieldPlaceholdersByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldPlaceholders]));
  const stageActionEvidenceCaptureFieldRequirementLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldRequirementLabels]));
  const stageActionEvidenceCaptureFieldAriaLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldAriaLabels]));
  const stageActionEvidenceCaptureFieldHelpTextsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldHelpTexts]));
  const stageActionEvidenceCaptureFieldSectionKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldSectionKeys]));
  const stageActionEvidenceCaptureFieldSectionLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldSectionLabels]));
  const stageActionEvidenceCaptureSectionKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureSectionKeys]));
  const stageActionEvidenceCaptureSectionLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureSectionLabels]));
  const stageActionEvidenceCaptureSectionCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureSectionCount]));
  const stageActionEvidenceCaptureFieldPayloadNamespacesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldPayloadNamespaces]));
  const stageActionEvidenceCaptureFieldPayloadPathsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldPayloadPaths]));
  const stageActionEvidenceCapturePayloadNamespacesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadNamespaces]));
  const stageActionEvidenceCapturePayloadNamespaceCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadNamespaceCount]));
  const stageActionEvidenceCapturePayloadTemplateByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadTemplate]));
  const stageActionEvidenceCapturePayloadFlatTemplateByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadFlatTemplate]));
  const stageActionEvidenceCapturePayloadBindingsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadBindings]));
  const stageActionEvidenceCaptureValidationSpecsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureValidationSpecs]));
  const stageActionEvidenceCaptureInitialValidationStatesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationStates]));
  const stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationDisplayMetadata]));
  const stageActionEvidenceCaptureInitialValidationChecklistByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationChecklist]));
  const stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationChecklistSummary]));
  const stageActionEvidenceCaptureInitialValidationSummaryByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationSummary]));
  const stageHumanLines = stages.map((stage) => formatBundleHandoffOperatorRunbookStageLine(
    stage,
    stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey[stage.key],
  ));
  const stageHumanLineByKey = Object.fromEntries(stages.map((stage, index) => [stage.key, stageHumanLines[index]]));
  const stageHumanLineDisplayRows = stages.map((stage, index) => {
    const actionRow = stageActionRows[index];
    const evidenceProgress = actionRow.actionEvidenceCaptureInitialValidationChecklistSummary;
    return {
      step: stage.step,
      key: stage.key,
      label: stage.label,
      line: stageHumanLines[index],
      required: stage.required,
      manual: stage.commandCount === 0,
      commandCount: stage.commandCount,
      actionType: actionRow.actionType,
      actionLabel: actionRow.actionLabel,
      actionStatus: actionRow.actionStatus,
      actionStatusLabel: actionRow.actionStatusLabel,
      actionStatusTone: actionRow.actionStatusTone,
      hasEvidenceProgress: evidenceProgress.itemCount > 0,
      evidenceProgressStatus: evidenceProgress.status || "",
      evidenceProgressStatusLabel: evidenceProgress.statusLabel || "",
      evidenceProgressStatusTone: evidenceProgress.statusTone || "",
      evidenceProgressIconName: evidenceProgress.iconName || "",
      evidenceProgressLabel: evidenceProgress.progressLabel || "",
      evidenceCompletionPercent: evidenceProgress.completionPercent ?? 0,
      firstUncheckedEvidenceItemLabel: evidenceProgress.firstUncheckedItemLabel || "",
    };
  });
  const stageHumanLineDisplayRowByKey = Object.fromEntries(stageHumanLineDisplayRows.map((row) => [row.key, row]));
  const stageHumanLineDisplayRowKeysByActionStatus = {
    ready: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "ready").map((row) => row.key),
    optional: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "optional").map((row) => row.key),
    manual: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "manual").map((row) => row.key),
    blocked: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "blocked").map((row) => row.key),
  };
  const stageHumanLineDisplayRowKeysByEvidenceProgressStatus = {
    blocked: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "blocked").map((row) => row.key),
    ready: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "ready").map((row) => row.key),
  };
  const stageHumanLineDisplayRowSummary = {
    count: stageHumanLineDisplayRows.length,
    byKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    requiredCount: stageHumanLineDisplayRows.filter((row) => row.required).length,
    optionalCount: stageHumanLineDisplayRows.filter((row) => !row.required).length,
    commandCount: stageHumanLineDisplayRows.filter((row) => row.commandCount > 0).length,
    manualCount: stageHumanLineDisplayRows.filter((row) => row.manual).length,
    readyActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "ready").length,
    optionalActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "optional").length,
    manualActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "manual").length,
    blockedActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "blocked").length,
    evidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.hasEvidenceProgress).length,
    blockedEvidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "blocked").length,
    readyEvidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "ready").length,
    firstRowKey: stageHumanLineDisplayRows[0]?.key || "",
    firstReadyActionRowKey: stageHumanLineDisplayRows.find((row) => row.actionStatus === "ready")?.key || "",
    firstOptionalActionRowKey: stageHumanLineDisplayRows.find((row) => row.actionStatus === "optional")?.key || "",
    firstManualActionRowKey: stageHumanLineDisplayRows.find((row) => row.actionStatus === "manual")?.key || "",
    firstBlockedEvidenceProgressRowKey: stageHumanLineDisplayRows.find((row) => row.evidenceProgressStatus === "blocked")?.key || "",
    firstReadyEvidenceProgressRowKey: stageHumanLineDisplayRows.find((row) => row.evidenceProgressStatus === "ready")?.key || "",
  };
  const stageHumanLineSummary = {
    count: stageHumanLines.length,
    byKeyCount: Object.keys(stageHumanLineByKey).length,
    requiredCount: stages.filter((stage) => stage.required).length,
    optionalCount: stages.filter((stage) => !stage.required).length,
    commandCount: stages.filter((stage) => stage.commandCount > 0).length,
    manualCount: stages.filter((stage) => stage.commandCount === 0).length,
    evidenceProgressCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0).length,
    blockedEvidenceProgressCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked").length,
    readyEvidenceProgressCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "ready").length,
    firstStageKey: stages[0]?.key || "",
    firstLine: stageHumanLines[0] || "",
    firstEvidenceProgressStageKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0)?.key || "",
    firstBlockedEvidenceProgressStageKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked")?.key || "",
  };
  const stageActionEvidenceCaptureFieldInputTypesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldInputTypes]));
  const stageActionEvidenceCaptureFieldValueShapesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldValueShapes]));
  const stageActionEvidenceCaptureFieldAcceptsMultipleByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldAcceptsMultiple]));
  const stageActionEvidenceCaptureFieldDefaultValuesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldDefaultValues]));
  const stageActionEvidenceCaptureFieldEmptyValuesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldEmptyValues]));
  const stageActionEvidenceCaptureFieldValidationRulesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldValidationRules]));
  const stageActionEvidenceCaptureFieldMinLengthsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldMinLengths]));
  const stageActionEvidenceCaptureFieldExamplesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldExamples]));
  const stageActionEvidenceCaptureFieldValidationHintsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldValidationHints]));
  const stageActionRequiredEvidenceCaptureFieldKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionRequiredEvidenceCaptureFieldKeys]));
  const stageActionOptionalEvidenceCaptureFieldKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionOptionalEvidenceCaptureFieldKeys]));
  const stageActionEvidenceCaptureFieldCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldCount]));
  const stageActionRequiredEvidenceCaptureFieldCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionRequiredEvidenceCaptureFieldCount]));
  const stageActionOptionalEvidenceCaptureFieldCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionOptionalEvidenceCaptureFieldCount]));
  const stageActionHasEvidenceCaptureFieldsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionHasEvidenceCaptureFields]));
  const stageKindByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.kind]));
  const stageRequiredByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.required]));
  const stageRunPolicyByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.runPolicy]));
  const stageSafetyLevelByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.safetyLevel]));
  const stageCommandCountByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandCount]));
  const stageCommandKeysByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandKeys]));
  const stageCommandLabelsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.label)]));
  const stageCommandStringsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.command)]));
  const stageCommandArgsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.commandArgs)]));
  const stageCommandRunPoliciesByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.runPolicy)]));
  const stageCommandSafetyLevelsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.safety?.safetyLevel || "")]));
  const stageOutputFilesByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.outputFiles]));
  const stageHasCommandsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandCount > 0]));
  const stageManualByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandCount === 0]));
  const stageWritesLocalFileByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.writesLocalFile]));
  const stageExternalCallsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.externalCalls]));
  const stageTargetRepoMutationByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.targetRepoMutation]));
  const commandStageKeys = commandStages.map((stage) => stage.key);
  const manualStageKeys = stages.filter((stage) => stage.commandCount === 0).map((stage) => stage.key);
  const nextStageKey = "verifySourceBundle";
  const nextCommandKey = "source.bundleCheck.strict";
  const nextStage = stageByKey[nextStageKey] || null;
  const nextStageActionRow = stageActionRows.find((stage) => stage.key === nextStageKey) || null;
  const nextCommandEntry = commandByKey.get(nextCommandKey) || null;
  const countBy = (predicate) => stages.filter(predicate).length;
  const firstStageKey = (predicate) => stages.find(predicate)?.key || "";
  const actionSummary = {
    totalActionCount: stages.length,
    commandActionCount: commandStages.length,
    manualActionCount: countBy((stage) => stage.commandCount === 0),
    enabledActionCount: stageActionRows.filter((stage) => stage.actionEnabled).length,
    disabledActionCount: stageActionRows.filter((stage) => !stage.actionEnabled).length,
    manualDisabledActionCount: stageActionRows.filter((stage) => !stage.actionEnabled && stage.manual).length,
    actionWithPrerequisiteCount: stageActionRows.filter((stage) => stage.actionHasPrerequisites).length,
    maxActionPrerequisiteCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionPrerequisiteCount)),
    actionWithDependencyReasonCount: stageActionRows.filter((stage) => stage.actionDependencyReasonCode).length,
    actionBlockingOtherActionCount: stageActionRows.filter((stage) => stage.actionBlocksStages).length,
    maxActionBlockedStageCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionBlockedStageCount)),
    actionWithCompletionCriteriaCount: stageActionRows.filter((stage) => stage.actionHasCompletionCriteria).length,
    totalActionCompletionCriteriaCount: stageActionRows.reduce((sum, stage) => sum + stage.actionCompletionCriteriaCount, 0),
    maxActionCompletionCriteriaCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionCompletionCriteriaCount)),
    actionRequiringEvidenceCount: stageActionRows.filter((stage) => stage.actionRequiresEvidence).length,
    totalActionEvidenceRequirementCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceRequirementCount, 0),
    maxActionEvidenceRequirementCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceRequirementCount)),
    localCommandEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "local-command-output").length,
    localOutputEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "local-output-file").length,
    targetRepoEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "target-repo-working-tree").length,
    handoffRecordEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "handoff-evidence-record").length,
    actionWithEvidenceCaptureFieldCount: stageActionRows.filter((stage) => stage.actionHasEvidenceCaptureFields).length,
    actionWithRequiredEvidenceCaptureFieldCount: stageActionRows.filter((stage) => stage.actionRequiredEvidenceCaptureFieldCount > 0).length,
    actionWithOptionalEvidenceCaptureFieldCount: stageActionRows.filter((stage) => stage.actionOptionalEvidenceCaptureFieldCount > 0).length,
    totalActionEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFieldCount, 0),
    totalRequiredActionEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionRequiredEvidenceCaptureFieldCount, 0),
    totalOptionalActionEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionOptionalEvidenceCaptureFieldCount, 0),
    maxActionEvidenceCaptureFieldCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceCaptureFieldCount)),
    textareaEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "textarea").length, 0),
    textEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "text").length, 0),
    filePathEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "file-path").length, 0),
    listEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "list").length, 0),
    longTextEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "long-text").length, 0),
    shortTextEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "short-text").length, 0),
    filePathValueEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "file-path").length, 0),
    stringListEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "string-list").length, 0),
    multiValueEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.acceptsMultiple).length, 0),
    singleValueEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => !field.acceptsMultiple).length, 0),
    emptyStringEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.emptyValue === "").length, 0),
    emptyListEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => Array.isArray(field.emptyValue)).length, 0),
    placeholderEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.placeholder).length, 0),
    ariaLabelEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.ariaLabel).length, 0),
    helpTextEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.helpText).length, 0),
    sectionedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.sectionKey).length, 0),
    uniqueEvidenceCaptureSectionCount: uniqueValues(stageActionRows.flatMap((stage) => stage.actionEvidenceCaptureSectionKeys)).length,
    actionWithMultipleEvidenceCaptureSectionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureSectionCount > 1).length,
    maxActionEvidenceCaptureSectionCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceCaptureSectionCount)),
    payloadMappedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.payloadPath).length, 0),
    uniqueEvidenceCapturePayloadNamespaceCount: uniqueValues(stageActionRows.flatMap((stage) => stage.actionEvidenceCapturePayloadNamespaces)).length,
    actionWithMultipleEvidenceCapturePayloadNamespaceCount: stageActionRows.filter((stage) => stage.actionEvidenceCapturePayloadNamespaceCount > 1).length,
    maxActionEvidenceCapturePayloadNamespaceCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceCapturePayloadNamespaceCount)),
    actionWithEvidenceCapturePayloadTemplateCount: stageActionRows.filter((stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length > 0).length,
    evidenceCapturePayloadTemplatePathCount: stageActionRows.reduce((sum, stage) => sum + Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length, 0),
    maxActionEvidenceCapturePayloadTemplatePathCount: Math.max(0, ...stageActionRows.map((stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length)),
    actionWithEvidenceCapturePayloadBindingCount: stageActionRows.filter((stage) => stage.actionEvidenceCapturePayloadBindings.length > 0).length,
    evidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.length, 0),
    requiredEvidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.filter((binding) => binding.required).length, 0),
    optionalEvidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.filter((binding) => !binding.required).length, 0),
    multiValueEvidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.filter((binding) => binding.acceptsMultiple).length, 0),
    actionWithEvidenceCaptureValidationSpecCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureValidationSpecs.length > 0).length,
    evidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.length, 0),
    requiredEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.required).length, 0),
    optionalEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => !spec.required).length, 0),
    errorEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.severity === "error").length, 0),
    infoEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.severity === "info").length, 0),
    multiValueEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.acceptsMultiple).length, 0),
    actionWithEvidenceCaptureInitialValidationStateCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationStates.length > 0).length,
    evidenceCaptureInitialValidationStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.length, 0),
    validInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.valid).length, 0),
    invalidInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => !state.valid).length, 0),
    blockingInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.blocking).length, 0),
    optionalEmptyInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.status === "optional-empty").length, 0),
    missingRequiredInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.status === "missing-required").length, 0),
    pristineInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => !state.dirty && !state.touched).length, 0),
    actionWithEvidenceCaptureInitialValidationDisplayMetadataCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationDisplayMetadata.length > 0).length,
    evidenceCaptureInitialValidationDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.length, 0),
    dangerInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => display.statusTone === "danger").length, 0),
    infoInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => display.statusTone === "info").length, 0),
    blockingInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => display.blocking).length, 0),
    nonBlockingInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => !display.blocking).length, 0),
    actionWithEvidenceCaptureInitialValidationSummaryCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.fieldCount > 0).length,
    blockedInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.status === "blocked").length,
    readyInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.status === "ready").length,
    completableInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.canCompleteInitially).length,
    nonCompletableInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => !stage.actionEvidenceCaptureInitialValidationSummary.canCompleteInitially).length,
    initialEvidenceCaptureSummaryBlockingFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationSummary.blockingCount, 0),
    initialEvidenceCaptureSummaryMissingRequiredFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationSummary.missingRequiredCount, 0),
    initialEvidenceCaptureSummaryOptionalEmptyFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationSummary.optionalEmptyCount, 0),
    actionWithEvidenceCaptureInitialValidationChecklistCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklist.length > 0).length,
    evidenceCaptureInitialValidationChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.length, 0),
    checkedInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => item.checkedInitially).length, 0),
    uncheckedInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => !item.checkedInitially).length, 0),
    blockingInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => item.completionBlocking).length, 0),
    nonBlockingInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => !item.completionBlocking).length, 0),
    requiredInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => item.required).length, 0),
    optionalInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => !item.required).length, 0),
    actionWithEvidenceCaptureInitialValidationChecklistSummaryCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0).length,
    blockedInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked").length,
    readyInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "ready").length,
    completeInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.allCheckedInitially).length,
    incompleteInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => !stage.actionEvidenceCaptureInitialValidationChecklistSummary.allCheckedInitially).length,
    initialEvidenceCaptureChecklistSummaryCheckedItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklistSummary.checkedCount, 0),
    initialEvidenceCaptureChecklistSummaryUncheckedItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklistSummary.uncheckedCount, 0),
    initialEvidenceCaptureChecklistSummaryBlockingUncheckedItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklistSummary.blockingUncheckedCount, 0),
    humanLineCount: stageHumanLineSummary.count,
    humanLineByKeyCount: stageHumanLineSummary.byKeyCount,
    humanLineWithEvidenceProgressCount: stageHumanLineSummary.evidenceProgressCount,
    humanLineWithBlockedEvidenceProgressCount: stageHumanLineSummary.blockedEvidenceProgressCount,
    humanLineWithReadyEvidenceProgressCount: stageHumanLineSummary.readyEvidenceProgressCount,
    humanLineDisplayRowCount: stageHumanLineDisplayRows.length,
    humanLineDisplayRowByKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    humanLineDisplayRowWithEvidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.hasEvidenceProgress).length,
    humanLineDisplayRowWithBlockedEvidenceProgressCount: stageHumanLineDisplayRowSummary.blockedEvidenceProgressCount,
    humanLineDisplayRowWithReadyEvidenceProgressCount: stageHumanLineDisplayRowSummary.readyEvidenceProgressCount,
    humanLineDisplayRowReadyActionCount: stageHumanLineDisplayRowSummary.readyActionStatusCount,
    humanLineDisplayRowManualActionCount: stageHumanLineDisplayRowSummary.manualActionStatusCount,
    validatedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.validationRule).length, 0),
    requiredValidatedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.required && field.validationRule).length, 0),
    optionalValidatedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => !field.required && field.validationRule).length, 0),
    minEvidenceCaptureFieldLengthTotal: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.reduce((fieldSum, field) => fieldSum + field.minLength, 0), 0),
    maxEvidenceCaptureFieldMinLength: Math.max(0, ...stageActionRows.flatMap((stage) => stage.actionEvidenceCaptureFields.map((field) => field.minLength))),
    requiredActionCount: countBy((stage) => stage.required),
    optionalActionCount: countBy((stage) => !stage.required),
    readOnlyActionCount: countBy((stage) => stage.runPolicy === "read-only"),
    localOutputActionCount: countBy((stage) => stage.runPolicy === "writes-local-file"),
    outputFileActionCount: countBy((stage) => stage.outputFiles.length > 0),
    externalCallActionCount: countBy((stage) => stage.externalCalls),
    targetRepoMutationActionCount: countBy((stage) => stage.targetRepoMutation),
    nextActionKey: nextStageKey,
    nextActionType: nextStageActionRow?.actionType || "",
    nextActionLabel: nextStageActionRow?.actionLabel || "",
    nextActionEnabled: nextStageActionRow?.actionEnabled === true,
    nextActionStatus: nextStageActionRow?.actionStatus || "",
    nextActionStatusLabel: nextStageActionRow?.actionStatusLabel || "",
    nextActionStatusTone: nextStageActionRow?.actionStatusTone || "",
    nextActionDisabledReasonCode: nextStageActionRow?.actionDisabledReasonCode || "",
    nextActionPrerequisiteKeys: nextStageActionRow?.actionPrerequisiteKeys || [],
    nextActionPrerequisiteLabels: nextStageActionRow?.actionPrerequisiteLabels || [],
    nextActionPrerequisiteCount: nextStageActionRow?.actionPrerequisiteCount || 0,
    nextActionHasPrerequisites: nextStageActionRow?.actionHasPrerequisites === true,
    nextActionDependencyReasonCode: nextStageActionRow?.actionDependencyReasonCode || "",
    nextActionDependencyReason: nextStageActionRow?.actionDependencyReason || "",
    nextActionBlockedStageKeys: nextStageActionRow?.actionBlockedStageKeys || [],
    nextActionBlockedStageLabels: nextStageActionRow?.actionBlockedStageLabels || [],
    nextActionBlockedStageCount: nextStageActionRow?.actionBlockedStageCount || 0,
    nextActionBlocksStages: nextStageActionRow?.actionBlocksStages === true,
    nextActionCompletionCriteria: nextStageActionRow?.actionCompletionCriteria || [],
    nextActionCompletionCriteriaCount: nextStageActionRow?.actionCompletionCriteriaCount || 0,
    nextActionHasCompletionCriteria: nextStageActionRow?.actionHasCompletionCriteria === true,
    nextActionEvidenceRequirements: nextStageActionRow?.actionEvidenceRequirements || [],
    nextActionEvidenceRequirementCount: nextStageActionRow?.actionEvidenceRequirementCount || 0,
    nextActionRequiresEvidence: nextStageActionRow?.actionRequiresEvidence === true,
    nextActionEvidenceTarget: nextStageActionRow?.actionEvidenceTarget || "",
    nextActionEvidenceTargetLabel: nextStageActionRow?.actionEvidenceTargetLabel || "",
    nextActionEvidenceCaptureFields: nextStageActionRow?.actionEvidenceCaptureFields || [],
    nextActionEvidenceCaptureFieldKeys: nextStageActionRow?.actionEvidenceCaptureFieldKeys || [],
    nextActionEvidenceCaptureFieldLabels: nextStageActionRow?.actionEvidenceCaptureFieldLabels || [],
    nextActionEvidenceCaptureFieldPlaceholders: nextStageActionRow?.actionEvidenceCaptureFieldPlaceholders || [],
    nextActionEvidenceCaptureFieldRequirementLabels: nextStageActionRow?.actionEvidenceCaptureFieldRequirementLabels || [],
    nextActionEvidenceCaptureFieldAriaLabels: nextStageActionRow?.actionEvidenceCaptureFieldAriaLabels || [],
    nextActionEvidenceCaptureFieldHelpTexts: nextStageActionRow?.actionEvidenceCaptureFieldHelpTexts || [],
    nextActionEvidenceCaptureFieldSectionKeys: nextStageActionRow?.actionEvidenceCaptureFieldSectionKeys || [],
    nextActionEvidenceCaptureFieldSectionLabels: nextStageActionRow?.actionEvidenceCaptureFieldSectionLabels || [],
    nextActionEvidenceCaptureSectionKeys: nextStageActionRow?.actionEvidenceCaptureSectionKeys || [],
    nextActionEvidenceCaptureSectionLabels: nextStageActionRow?.actionEvidenceCaptureSectionLabels || [],
    nextActionEvidenceCaptureSectionCount: nextStageActionRow?.actionEvidenceCaptureSectionCount || 0,
    nextActionEvidenceCaptureFieldPayloadNamespaces: nextStageActionRow?.actionEvidenceCaptureFieldPayloadNamespaces || [],
    nextActionEvidenceCaptureFieldPayloadPaths: nextStageActionRow?.actionEvidenceCaptureFieldPayloadPaths || [],
    nextActionEvidenceCapturePayloadNamespaces: nextStageActionRow?.actionEvidenceCapturePayloadNamespaces || [],
    nextActionEvidenceCapturePayloadNamespaceCount: nextStageActionRow?.actionEvidenceCapturePayloadNamespaceCount || 0,
    nextActionEvidenceCapturePayloadTemplate: nextStageActionRow?.actionEvidenceCapturePayloadTemplate || {},
    nextActionEvidenceCapturePayloadFlatTemplate: nextStageActionRow?.actionEvidenceCapturePayloadFlatTemplate || {},
    nextActionEvidenceCapturePayloadBindings: nextStageActionRow?.actionEvidenceCapturePayloadBindings || [],
    nextActionEvidenceCaptureValidationSpecs: nextStageActionRow?.actionEvidenceCaptureValidationSpecs || [],
    nextActionEvidenceCaptureInitialValidationStates: nextStageActionRow?.actionEvidenceCaptureInitialValidationStates || [],
    nextActionEvidenceCaptureInitialValidationDisplayMetadata: nextStageActionRow?.actionEvidenceCaptureInitialValidationDisplayMetadata || [],
    nextActionEvidenceCaptureInitialValidationChecklist: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklist || [],
    nextActionEvidenceCaptureInitialValidationChecklistSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary || {},
    nextActionEvidenceCaptureInitialValidationSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationSummary || {},
    nextActionEvidenceCaptureFieldInputTypes: nextStageActionRow?.actionEvidenceCaptureFieldInputTypes || [],
    nextActionEvidenceCaptureFieldValueShapes: nextStageActionRow?.actionEvidenceCaptureFieldValueShapes || [],
    nextActionEvidenceCaptureFieldAcceptsMultiple: nextStageActionRow?.actionEvidenceCaptureFieldAcceptsMultiple || [],
    nextActionEvidenceCaptureFieldDefaultValues: nextStageActionRow?.actionEvidenceCaptureFieldDefaultValues || [],
    nextActionEvidenceCaptureFieldEmptyValues: nextStageActionRow?.actionEvidenceCaptureFieldEmptyValues || [],
    nextActionEvidenceCaptureFieldValidationRules: nextStageActionRow?.actionEvidenceCaptureFieldValidationRules || [],
    nextActionEvidenceCaptureFieldMinLengths: nextStageActionRow?.actionEvidenceCaptureFieldMinLengths || [],
    nextActionEvidenceCaptureFieldExamples: nextStageActionRow?.actionEvidenceCaptureFieldExamples || [],
    nextActionEvidenceCaptureFieldValidationHints: nextStageActionRow?.actionEvidenceCaptureFieldValidationHints || [],
    nextActionRequiredEvidenceCaptureFieldKeys: nextStageActionRow?.actionRequiredEvidenceCaptureFieldKeys || [],
    nextActionOptionalEvidenceCaptureFieldKeys: nextStageActionRow?.actionOptionalEvidenceCaptureFieldKeys || [],
    nextActionEvidenceCaptureFieldCount: nextStageActionRow?.actionEvidenceCaptureFieldCount || 0,
    nextActionRequiredEvidenceCaptureFieldCount: nextStageActionRow?.actionRequiredEvidenceCaptureFieldCount || 0,
    nextActionOptionalEvidenceCaptureFieldCount: nextStageActionRow?.actionOptionalEvidenceCaptureFieldCount || 0,
    nextActionHasEvidenceCaptureFields: nextStageActionRow?.actionHasEvidenceCaptureFields === true,
    nextActionRunPolicy: nextStage?.runPolicy || "",
    nextActionSafetyLevel: nextStage?.safetyLevel || "",
    firstRequiredCommandStageKey: firstStageKey((stage) => stage.required && stage.commandCount > 0),
    firstLocalOutputStageKey: firstStageKey((stage) => stage.writesLocalFile),
    firstManualStageKey: firstStageKey((stage) => stage.commandCount === 0),
    firstRequiredManualStageKey: firstStageKey((stage) => stage.required && stage.commandCount === 0),
    firstEvidenceStageKey: firstStageKey((stage) => stage.kind === "manual-reporting"),
    firstActionWithPrerequisiteKey: stageActionRows.find((stage) => stage.actionHasPrerequisites)?.key || "",
    firstManualActionWithPrerequisiteKey: stageActionRows.find((stage) => stage.manual && stage.actionHasPrerequisites)?.key || "",
    firstEvidenceActionWithPrerequisiteKey: stageActionRows.find((stage) => stage.actionType === "manual-evidence" && stage.actionHasPrerequisites)?.key || "",
    firstActionWithDependencyReasonKey: stageActionRows.find((stage) => stage.actionDependencyReasonCode)?.key || "",
    firstActionBlockingOtherActionKey: stageActionRows.find((stage) => stage.actionBlocksStages)?.key || "",
    firstActionWithCompletionCriteriaKey: stageActionRows.find((stage) => stage.actionHasCompletionCriteria)?.key || "",
    firstManualActionWithCompletionCriteriaKey: stageActionRows.find((stage) => stage.manual && stage.actionHasCompletionCriteria)?.key || "",
    firstActionRequiringEvidenceKey: stageActionRows.find((stage) => stage.actionRequiresEvidence)?.key || "",
    firstManualActionRequiringEvidenceKey: stageActionRows.find((stage) => stage.manual && stage.actionRequiresEvidence)?.key || "",
    firstEvidenceRecordingActionKey: stageActionRows.find((stage) => stage.actionType === "manual-evidence" && stage.actionRequiresEvidence)?.key || "",
    firstTargetRepoEvidenceActionKey: stageActionRows.find((stage) => stage.actionEvidenceTarget === "target-repo-working-tree")?.key || "",
    firstLocalOutputEvidenceActionKey: stageActionRows.find((stage) => stage.actionEvidenceTarget === "local-output-file")?.key || "",
    firstActionWithEvidenceCaptureFieldKey: stageActionRows.find((stage) => stage.actionHasEvidenceCaptureFields)?.key || "",
    firstActionWithOptionalEvidenceCaptureFieldKey: stageActionRows.find((stage) => stage.actionOptionalEvidenceCaptureFieldCount > 0)?.key || "",
    firstManualActionWithEvidenceCaptureFieldKey: stageActionRows.find((stage) => stage.manual && stage.actionHasEvidenceCaptureFields)?.key || "",
    firstTextareaEvidenceCaptureActionKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureFields.some((field) => field.inputType === "textarea"))?.key || "",
    firstMultiValueEvidenceCaptureActionKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureFields.some((field) => field.acceptsMultiple))?.key || "",
    firstValidationRuleEvidenceCaptureActionKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureFields.some((field) => field.validationRule))?.key || "",
    requiresTargetRepoWork: stages.some((stage) => stage.kind === "manual-target-repo"),
    requiresEvidenceReturn: stages.some((stage) => stage.kind === "manual-reporting"),
    externalCalls: stages.some((stage) => stage.externalCalls),
    targetRepoMutation: stages.some((stage) => stage.targetRepoMutation),
  };
  return {
    version: 1,
    source: "bundle-handoff",
    stageCount: stages.length,
    commandStageCount: commandStages.length,
    manualStageCount: countBy((stage) => stage.commandCount === 0),
    requiredStageCount: countBy((stage) => stage.required),
    optionalStageCount: countBy((stage) => !stage.required),
    readOnlyCommandStageCount: countBy((stage) => stage.runPolicy === "read-only"),
    localOutputCommandStageCount: countBy((stage) => stage.runPolicy === "writes-local-file"),
    externalCallCommandStageCount: countBy((stage) => stage.externalCalls),
    targetRepoMutationCommandStageCount: countBy((stage) => stage.targetRepoMutation),
    effectiveTaskId: commandManifest?.effectiveTaskId || "",
    effectiveStrictTaskCommandKey,
    stageKeys,
    stageByKey,
    stageLabelByKey,
    stageSummaryByKey,
    stageHumanLines,
    stageHumanLineByKey,
    stageHumanLineDisplayRows,
    stageHumanLineDisplayRowByKey,
    stageHumanLineDisplayRowKeysByActionStatus,
    stageHumanLineDisplayRowKeysByEvidenceProgressStatus,
    stageHumanLineDisplayRowSummary,
    stageHumanLineSummary,
    stageActionRows,
    stageActionTypeByKey,
    stageActionLabelByKey,
    stageActionInstructionsByKey,
    stageActionButtonLabelsByKey,
    stageActionAffordanceByKey,
    stageActionEnabledByKey,
    stageActionStatusByKey,
    stageActionStatusLabelsByKey,
    stageActionStatusToneByKey,
    stageActionDisabledReasonCodeByKey,
    stageActionDisabledReasonByKey,
    stageActionPrerequisiteKeysByKey,
    stageActionPrerequisiteLabelsByKey,
    stageActionPrerequisiteCountByKey,
    stageActionHasPrerequisitesByKey,
    stageActionDependencyReasonCodeByKey,
    stageActionDependencyReasonByKey,
    stageActionBlockedStageKeysByKey,
    stageActionBlockedStageLabelsByKey,
    stageActionBlockedStageCountByKey,
    stageActionBlocksStagesByKey,
    stageActionCompletionCriteriaByKey,
    stageActionCompletionCriteriaCountByKey,
    stageActionHasCompletionCriteriaByKey,
    stageActionEvidenceRequirementsByKey,
    stageActionEvidenceRequirementCountByKey,
    stageActionRequiresEvidenceByKey,
    stageActionEvidenceTargetByKey,
    stageActionEvidenceTargetLabelByKey,
    stageActionEvidenceCaptureFieldsByKey,
    stageActionEvidenceCaptureFieldKeysByKey,
    stageActionEvidenceCaptureFieldLabelsByKey,
    stageActionEvidenceCaptureFieldPlaceholdersByKey,
    stageActionEvidenceCaptureFieldRequirementLabelsByKey,
    stageActionEvidenceCaptureFieldAriaLabelsByKey,
    stageActionEvidenceCaptureFieldHelpTextsByKey,
    stageActionEvidenceCaptureFieldSectionKeysByKey,
    stageActionEvidenceCaptureFieldSectionLabelsByKey,
    stageActionEvidenceCaptureSectionKeysByKey,
    stageActionEvidenceCaptureSectionLabelsByKey,
    stageActionEvidenceCaptureSectionCountByKey,
    stageActionEvidenceCaptureFieldPayloadNamespacesByKey,
    stageActionEvidenceCaptureFieldPayloadPathsByKey,
    stageActionEvidenceCapturePayloadNamespacesByKey,
    stageActionEvidenceCapturePayloadNamespaceCountByKey,
    stageActionEvidenceCapturePayloadTemplateByKey,
    stageActionEvidenceCapturePayloadFlatTemplateByKey,
    stageActionEvidenceCapturePayloadBindingsByKey,
    stageActionEvidenceCaptureValidationSpecsByKey,
    stageActionEvidenceCaptureInitialValidationStatesByKey,
    stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey,
    stageActionEvidenceCaptureInitialValidationChecklistByKey,
    stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey,
    stageActionEvidenceCaptureInitialValidationSummaryByKey,
    stageActionEvidenceCaptureFieldInputTypesByKey,
    stageActionEvidenceCaptureFieldValueShapesByKey,
    stageActionEvidenceCaptureFieldAcceptsMultipleByKey,
    stageActionEvidenceCaptureFieldDefaultValuesByKey,
    stageActionEvidenceCaptureFieldEmptyValuesByKey,
    stageActionEvidenceCaptureFieldValidationRulesByKey,
    stageActionEvidenceCaptureFieldMinLengthsByKey,
    stageActionEvidenceCaptureFieldExamplesByKey,
    stageActionEvidenceCaptureFieldValidationHintsByKey,
    stageActionRequiredEvidenceCaptureFieldKeysByKey,
    stageActionOptionalEvidenceCaptureFieldKeysByKey,
    stageActionEvidenceCaptureFieldCountByKey,
    stageActionRequiredEvidenceCaptureFieldCountByKey,
    stageActionOptionalEvidenceCaptureFieldCountByKey,
    stageActionHasEvidenceCaptureFieldsByKey,
    actionSummary,
    stageKindByKey,
    stageRequiredByKey,
    stageRunPolicyByKey,
    stageSafetyLevelByKey,
    stageCommandCountByKey,
    stageCommandKeysByKey,
    stageCommandLabelsByKey,
    stageCommandStringsByKey,
    stageCommandArgsByKey,
    stageCommandRunPoliciesByKey,
    stageCommandSafetyLevelsByKey,
    stageOutputFilesByKey,
    stageHasCommandsByKey,
    stageManualByKey,
    stageWritesLocalFileByKey,
    stageExternalCallsByKey,
    stageTargetRepoMutationByKey,
    commandStageKeys,
    manualStageKeys,
    nextStageKey,
    nextStage,
    nextStageLabel: nextStage?.label || "",
    nextStageSummary: nextStage?.reason || "",
    nextStageHumanLine: nextStage ? stageHumanLineByKey[nextStage.key] || "" : "",
    nextStageHumanLineDisplayRow: nextStage ? stageHumanLineDisplayRowByKey[nextStage.key] || {} : {},
    nextStageHumanLineSummary: nextStage ? {
      stageKey: nextStage.key,
      line: stageHumanLineByKey[nextStage.key] || "",
      hasEvidenceProgress: (nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.itemCount || 0) > 0,
      evidenceProgressStatus: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.status || "",
      evidenceProgressLabel: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.progressLabel || "",
      firstUncheckedEvidenceItemLabel: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.firstUncheckedItemLabel || "",
    } : {},
    nextStageActionType: nextStageActionRow?.actionType || "",
    nextStageActionLabel: nextStageActionRow?.actionLabel || "",
    nextStageActionInstruction: nextStageActionRow?.actionInstruction || "",
    nextStageActionButtonLabel: nextStageActionRow?.actionButtonLabel || "",
    nextStageActionAffordance: nextStageActionRow?.actionAffordance || "",
    nextStageActionEnabled: nextStageActionRow?.actionEnabled === true,
    nextStageActionStatus: nextStageActionRow?.actionStatus || "",
    nextStageActionStatusLabel: nextStageActionRow?.actionStatusLabel || "",
    nextStageActionStatusTone: nextStageActionRow?.actionStatusTone || "",
    nextStageActionDisabledReasonCode: nextStageActionRow?.actionDisabledReasonCode || "",
    nextStageActionDisabledReason: nextStageActionRow?.actionDisabledReason || "",
    nextStageActionPrerequisiteKeys: nextStageActionRow?.actionPrerequisiteKeys || [],
    nextStageActionPrerequisiteLabels: nextStageActionRow?.actionPrerequisiteLabels || [],
    nextStageActionPrerequisiteCount: nextStageActionRow?.actionPrerequisiteCount || 0,
    nextStageActionHasPrerequisites: nextStageActionRow?.actionHasPrerequisites === true,
    nextStageActionDependencyReasonCode: nextStageActionRow?.actionDependencyReasonCode || "",
    nextStageActionDependencyReason: nextStageActionRow?.actionDependencyReason || "",
    nextStageActionBlockedStageKeys: nextStageActionRow?.actionBlockedStageKeys || [],
    nextStageActionBlockedStageLabels: nextStageActionRow?.actionBlockedStageLabels || [],
    nextStageActionBlockedStageCount: nextStageActionRow?.actionBlockedStageCount || 0,
    nextStageActionBlocksStages: nextStageActionRow?.actionBlocksStages === true,
    nextStageActionCompletionCriteria: nextStageActionRow?.actionCompletionCriteria || [],
    nextStageActionCompletionCriteriaCount: nextStageActionRow?.actionCompletionCriteriaCount || 0,
    nextStageActionHasCompletionCriteria: nextStageActionRow?.actionHasCompletionCriteria === true,
    nextStageActionEvidenceRequirements: nextStageActionRow?.actionEvidenceRequirements || [],
    nextStageActionEvidenceRequirementCount: nextStageActionRow?.actionEvidenceRequirementCount || 0,
    nextStageActionRequiresEvidence: nextStageActionRow?.actionRequiresEvidence === true,
    nextStageActionEvidenceTarget: nextStageActionRow?.actionEvidenceTarget || "",
    nextStageActionEvidenceTargetLabel: nextStageActionRow?.actionEvidenceTargetLabel || "",
    nextStageActionEvidenceCaptureFields: nextStageActionRow?.actionEvidenceCaptureFields || [],
    nextStageActionEvidenceCaptureFieldKeys: nextStageActionRow?.actionEvidenceCaptureFieldKeys || [],
    nextStageActionEvidenceCaptureFieldLabels: nextStageActionRow?.actionEvidenceCaptureFieldLabels || [],
    nextStageActionEvidenceCaptureFieldPlaceholders: nextStageActionRow?.actionEvidenceCaptureFieldPlaceholders || [],
    nextStageActionEvidenceCaptureFieldRequirementLabels: nextStageActionRow?.actionEvidenceCaptureFieldRequirementLabels || [],
    nextStageActionEvidenceCaptureFieldAriaLabels: nextStageActionRow?.actionEvidenceCaptureFieldAriaLabels || [],
    nextStageActionEvidenceCaptureFieldHelpTexts: nextStageActionRow?.actionEvidenceCaptureFieldHelpTexts || [],
    nextStageActionEvidenceCaptureFieldSectionKeys: nextStageActionRow?.actionEvidenceCaptureFieldSectionKeys || [],
    nextStageActionEvidenceCaptureFieldSectionLabels: nextStageActionRow?.actionEvidenceCaptureFieldSectionLabels || [],
    nextStageActionEvidenceCaptureSectionKeys: nextStageActionRow?.actionEvidenceCaptureSectionKeys || [],
    nextStageActionEvidenceCaptureSectionLabels: nextStageActionRow?.actionEvidenceCaptureSectionLabels || [],
    nextStageActionEvidenceCaptureSectionCount: nextStageActionRow?.actionEvidenceCaptureSectionCount || 0,
    nextStageActionEvidenceCaptureFieldPayloadNamespaces: nextStageActionRow?.actionEvidenceCaptureFieldPayloadNamespaces || [],
    nextStageActionEvidenceCaptureFieldPayloadPaths: nextStageActionRow?.actionEvidenceCaptureFieldPayloadPaths || [],
    nextStageActionEvidenceCapturePayloadNamespaces: nextStageActionRow?.actionEvidenceCapturePayloadNamespaces || [],
    nextStageActionEvidenceCapturePayloadNamespaceCount: nextStageActionRow?.actionEvidenceCapturePayloadNamespaceCount || 0,
    nextStageActionEvidenceCapturePayloadTemplate: nextStageActionRow?.actionEvidenceCapturePayloadTemplate || {},
    nextStageActionEvidenceCapturePayloadFlatTemplate: nextStageActionRow?.actionEvidenceCapturePayloadFlatTemplate || {},
    nextStageActionEvidenceCapturePayloadBindings: nextStageActionRow?.actionEvidenceCapturePayloadBindings || [],
    nextStageActionEvidenceCaptureValidationSpecs: nextStageActionRow?.actionEvidenceCaptureValidationSpecs || [],
    nextStageActionEvidenceCaptureInitialValidationStates: nextStageActionRow?.actionEvidenceCaptureInitialValidationStates || [],
    nextStageActionEvidenceCaptureInitialValidationDisplayMetadata: nextStageActionRow?.actionEvidenceCaptureInitialValidationDisplayMetadata || [],
    nextStageActionEvidenceCaptureInitialValidationChecklist: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklist || [],
    nextStageActionEvidenceCaptureInitialValidationChecklistSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary || {},
    nextStageActionEvidenceCaptureInitialValidationSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationSummary || {},
    nextStageActionEvidenceCaptureFieldInputTypes: nextStageActionRow?.actionEvidenceCaptureFieldInputTypes || [],
    nextStageActionEvidenceCaptureFieldValueShapes: nextStageActionRow?.actionEvidenceCaptureFieldValueShapes || [],
    nextStageActionEvidenceCaptureFieldAcceptsMultiple: nextStageActionRow?.actionEvidenceCaptureFieldAcceptsMultiple || [],
    nextStageActionEvidenceCaptureFieldDefaultValues: nextStageActionRow?.actionEvidenceCaptureFieldDefaultValues || [],
    nextStageActionEvidenceCaptureFieldEmptyValues: nextStageActionRow?.actionEvidenceCaptureFieldEmptyValues || [],
    nextStageActionEvidenceCaptureFieldValidationRules: nextStageActionRow?.actionEvidenceCaptureFieldValidationRules || [],
    nextStageActionEvidenceCaptureFieldMinLengths: nextStageActionRow?.actionEvidenceCaptureFieldMinLengths || [],
    nextStageActionEvidenceCaptureFieldExamples: nextStageActionRow?.actionEvidenceCaptureFieldExamples || [],
    nextStageActionEvidenceCaptureFieldValidationHints: nextStageActionRow?.actionEvidenceCaptureFieldValidationHints || [],
    nextStageActionRequiredEvidenceCaptureFieldKeys: nextStageActionRow?.actionRequiredEvidenceCaptureFieldKeys || [],
    nextStageActionOptionalEvidenceCaptureFieldKeys: nextStageActionRow?.actionOptionalEvidenceCaptureFieldKeys || [],
    nextStageActionEvidenceCaptureFieldCount: nextStageActionRow?.actionEvidenceCaptureFieldCount || 0,
    nextStageActionRequiredEvidenceCaptureFieldCount: nextStageActionRow?.actionRequiredEvidenceCaptureFieldCount || 0,
    nextStageActionOptionalEvidenceCaptureFieldCount: nextStageActionRow?.actionOptionalEvidenceCaptureFieldCount || 0,
    nextStageActionHasEvidenceCaptureFields: nextStageActionRow?.actionHasEvidenceCaptureFields === true,
    nextStageKind: nextStage?.kind || "",
    nextStageRequired: nextStage?.required === true,
    nextStageRunPolicy: nextStage?.runPolicy || "",
    nextStageSafetyLevel: nextStage?.safetyLevel || "",
    nextStageCommandCount: nextStage?.commandCount || 0,
    nextStageCommandLabels: nextStage?.commands?.map((command) => command.label) || [],
    nextStageCommands: nextStage?.commands?.map((command) => command.command) || [],
    nextStageCommandArgsList: nextStage?.commands?.map((command) => command.commandArgs) || [],
    nextStageCommandRunPolicies: nextStage?.commands?.map((command) => command.runPolicy) || [],
    nextStageCommandSafetyLevels: nextStage?.commands?.map((command) => command.safety?.safetyLevel || "") || [],
    nextStageOutputFiles: nextStage?.outputFiles || [],
    nextStageHasCommands: (nextStage?.commandCount || 0) > 0,
    nextStageManual: (nextStage?.commandCount || 0) === 0,
    nextStageWritesLocalFile: nextStage?.writesLocalFile === true,
    nextStageExternalCalls: nextStage?.externalCalls === true,
    nextStageTargetRepoMutation: nextStage?.targetRepoMutation === true,
    nextStageCommandKeys: nextStage?.commandKeys || [],
    nextCommandKey,
    nextCommand: nextCommandEntry?.command || "",
    nextCommandArgs: nextCommandEntry?.commandArgs || [],
    nextCommandRunPolicy: nextCommandEntry?.runPolicy || "",
    nextCommandSafetyLevel: nextCommandEntry?.safety?.safetyLevel || "",
    nextCommandSafety: nextCommandEntry?.safety || null,
    nextCommandEntry,
    stages,
  };
}

function formatBundleHandoffOperatorRunbookLines(operatorRunbook) {
  if (!operatorRunbook || !Array.isArray(operatorRunbook.stages) || operatorRunbook.stages.length === 0) {
    return ["- No operator runbook is available."];
  }
  if (Array.isArray(operatorRunbook.stageHumanLines) && operatorRunbook.stageHumanLines.length === operatorRunbook.stages.length) {
    return operatorRunbook.stageHumanLines;
  }
  return operatorRunbook.stages.map((stage) => {
    const checklistSummary = stage.actionEvidenceCaptureInitialValidationChecklistSummary
      || operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey?.[stage.key];
    return formatBundleHandoffOperatorRunbookStageLine(stage, checklistSummary);
  });
}

function formatBundleHandoffOperatorRunbookStageLine(stage, checklistSummary = null) {
  const commands = Array.isArray(stage.commands) ? stage.commands : [];
  const outputFiles = Array.isArray(stage.outputFiles) ? stage.outputFiles : [];
  const required = stage.required ? "required" : "optional";
  const commandText = commands.length
    ? ` command: \`${commands[0].command}\``
    : " command: manual";
  const outputText = outputFiles.length ? ` output: ${outputFiles.join(", ")}` : "";
  const evidenceText = checklistSummary?.itemCount > 0
    ? ` evidence: ${checklistSummary.progressLabel}, ${checklistSummary.statusLabel}${
      checklistSummary.firstUncheckedItemLabel ? `; next: ${checklistSummary.firstUncheckedItemLabel}` : ""
    }`
    : "";
  return `- ${stage.step}. ${stage.key} (${required}, ${stage.runPolicy || stage.kind}): ${stage.label}.${commandText}${outputText}${evidenceText}`;
}

export function buildSiteBundleHandoffReport({
  target,
  cwd = process.cwd(),
  taskSelector = "",
} = {}) {
  const checkReport = buildSiteBundleCheckReport({ target, cwd });
  const includedFilePaths = [
    "summary.json",
    "mcp-probes.json",
    "mcp-action-plan.md",
    "website-handoff.md",
    "website-prompts.md",
    "codex-implementation.md",
  ];
  let bundleWorkspace = null;
  let taskCatalogError = "";
  let selectedTask = null;
  let codexImplementation = readBundleTextIfPresent(checkReport.directory, "codex-implementation.md");
  try {
    bundleWorkspace = loadSiteBundleWorkspace(checkReport.directory);
  } catch (error) {
    taskCatalogError = error.message;
  }
  if (String(taskSelector || "").trim()) {
    if (!bundleWorkspace) {
      throw new Error(taskCatalogError || "Cannot select a handoff task because the bundle workspace is unavailable");
    }
    const task = resolveSitePromptTask(bundleWorkspace, taskSelector);
    selectedTask = summarizeSelectedTask(task, taskSelector, "bundle-workspace", checkReport.directory);
    codexImplementation = buildSitePrompt(bundleWorkspace, "codex-implementation", { taskSelector });
  }
  const taskCatalog = bundleWorkspace
    ? summarizeBundleTaskCatalog(bundleWorkspace, checkReport.directory, selectedTask)
    : emptyBundleTaskCatalog(taskCatalogError);
  const defaultTask = taskCatalog.items[0] || null;
  const effectiveTask = selectedTask || defaultTask;

  const bundleTexts = {
    taskCatalog,
    defaultTask,
    effectiveTask,
    selectedTask,
    codexImplementation,
    websiteHandoff: readBundleTextIfPresent(checkReport.directory, "website-handoff.md"),
  };
  const boundaries = buildSiteBundleHandoffBoundaries(checkReport);
  const sourceBundle = summarizeSiteBundleHandoffSource(checkReport);
  const commandManifest = buildBundleHandoffCommandManifest({
    sourceBundle,
    taskCatalog,
    defaultTask,
    selectedTask,
    effectiveTask,
  });
  const operatorRunbook = buildBundleHandoffOperatorRunbook(commandManifest);
  const runbookPrompt = buildSiteBundleHandoffPrompt(checkReport, {
    ...bundleTexts,
    operatorRunbook,
  });
  return {
    status: checkReport.status,
    valid: checkReport.valid,
    directory: checkReport.directory,
    sourceBundle,
    commandManifest,
    operatorRunbook,
    boundaries,
    externalCalls: false,
    targetRepoMutation: false,
    bundle: {
      directory: checkReport.directory,
      siteName: checkReport.summary.siteName || "",
      source: checkReport.summary.source || "",
      sourceBundle,
      workspaceStatus: checkReport.workspaceStatus || "unknown",
      mcpStatus: checkReport.mcpStatus || "unknown",
      mcpProbeStatus: checkReport.mcpProbeStatus || "unknown",
      mcpProbeCounts: { ...checkReport.mcpProbeCounts },
      totalTasks: checkReport.summary.totalTasks || 0,
      implementationEvidence: { ...checkReport.summary.implementationEvidence },
      checksumAlgorithm: checkReport.summary.checksumAlgorithm || "",
      checksumBundleDigest: checkReport.summary.checksumBundleDigest || "",
      expectedChecksumFiles: checkReport.counts.expectedChecksumFiles,
      verifiedChecksumFiles: checkReport.counts.verifiedChecksumFiles,
      checksumFailures: checkReport.counts.checksumFailures,
      expectedGeneratedFiles: checkReport.counts.expectedGeneratedFiles,
      verifiedGeneratedFiles: checkReport.counts.verifiedGeneratedFiles,
      generatedFailures: checkReport.counts.generatedFailures,
      generatedDriftFiles: [...checkReport.generatedContract.driftFiles],
      taskCatalog,
      defaultTask,
      effectiveTask,
      selectedTask,
      commandManifest,
      operatorRunbook,
      boundaries,
      externalCalls: false,
      targetRepoMutation: false,
      repairGuidance: { ...checkReport.repairGuidance },
      executionChecklist: SITE_TARGET_REPO_EXECUTION_CHECKLIST,
    },
    prompt: runbookPrompt,
    files: checkReport.files.map((file) => ({
      ...file,
      included: includedFilePaths.includes(file.path),
    })),
    issues: checkReport.issues,
  };
}

export function formatSiteBundleHandoffJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteBundleHandoffHuman(report) {
  return report.prompt;
}
