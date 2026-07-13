// CLI argument parsing for `design-ai site`.

import { parseOutputFlags } from "./output.mjs";
import { unknownOptionMessage } from "./suggest.mjs";
import { SITE_PROMPT_TEMPLATE_IDS } from "./site-content.mjs";
import {
  CMS_OPTIONS,
  DATABASE_OPTIONS,
  DEPLOY_OPTIONS,
  SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS,
  VIEWPORT_OPTIONS,
} from "./site-options.mjs";

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
  if (
    out.init
    && !out.initProfile.liveUrl.trim()
    && !out.initProfile.repoUrl.trim()
    && !out.initProfile.localPath.trim()
  ) {
    throw new Error("--init requires --live-url, --repo-url, or --local-path");
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
