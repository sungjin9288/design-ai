// Prompt generation for `design-ai prompt`.

import path from "node:path";
import { existsSync } from "node:fs";

import { parseBriefSourceFlag } from "./brief.mjs";
import { listExamples } from "./examples.mjs";
import { buildLearningContext, normalizeCategory, parseLearningLimit } from "./learn.mjs";
import { buildRecallContext, DEFAULT_RECALL_LIMIT, parseRecallLimit } from "./recall.mjs";
import { SYMLINK_PREFIX } from "./paths.mjs";
import { parseOutputFlags } from "./output.mjs";
import { readRouteManifestVersion, routeBrief, routeById } from "./route.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const PROMPT_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--route",
  "--eval-template",
  "--eval",
  "--strict",
  "--from-file",
  "--stdin",
  "--out",
  "--force",
  "--with-learning",
  "--learning-category",
  "--learning-limit",
  "--with-recall",
  "--recall-limit",
];
const PROMPT_EVAL_VERSION = 1;
const PROMPT_EVAL_DEFAULT_LIMIT = 12;

export function parsePromptArgs(args) {
  const out = {
    briefParts: [],
    fromFile: "",
    stdin: false,
    routeId: "",
    json: false,
    outPath: "",
    force: false,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
    evalTemplate: false,
    eval: false,
    strict: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    out.index = i;
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--with-learning") {
      out.withLearning = true;
    } else if (arg === "--with-recall") {
      out.withRecall = true;
    } else if (arg === "--recall-limit") {
      const limit = args[i + 1];
      if (!limit || limit.startsWith("--")) throw new Error("--recall-limit expects an integer from 1 to 20");
      try {
        out.recallLimit = parseRecallLimit(limit);
      } catch {
        throw new Error("--recall-limit expects an integer from 1 to 20");
      }
      i += 1;
    } else if (arg === "--eval-template") {
      out.evalTemplate = true;
    } else if (arg === "--eval") {
      out.eval = true;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (arg === "--learning-category") {
      const category = args[i + 1];
      if (!category || category.startsWith("--")) throw new Error("--learning-category expects a category");
      out.learningCategory = normalizeCategory(category);
      i += 1;
    } else if (arg === "--learning-limit") {
      const limit = args[i + 1];
      if (!limit || limit.startsWith("--")) throw new Error("--learning-limit expects an integer from 1 to 100");
      try {
        out.learningLimit = parseLearningLimit(limit);
      } catch {
        throw new Error("--learning-limit expects an integer from 1 to 100");
      }
      i += 1;
    } else if (arg === "--route") {
      const routeId = args[i + 1];
      if (!routeId || routeId.startsWith("--")) throw new Error("--route expects a route id");
      out.routeId = routeId;
      i += 1;
    } else if (parseBriefSourceFlag(args, out)) {
      i = out.index;
    } else if (parseOutputFlags(args, out)) {
      i = out.index;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("prompt", arg, PROMPT_OPTIONS));
    } else {
      out.briefParts.push(arg);
    }
  }

  if ((out.learningCategory || out.learningLimit) && !out.withLearning) {
    throw new Error("--learning-category and --learning-limit require --with-learning");
  }
  if (out.recallLimit && !out.withRecall) {
    throw new Error("--recall-limit requires --with-recall");
  }
  if (out.eval && out.evalTemplate) {
    throw new Error("Choose either --eval-template or --eval, not both");
  }
  if (out.strict && !out.eval) {
    throw new Error("--strict can only be used with --eval");
  }
  if (out.evalTemplate && (out.briefParts.length > 0 || out.fromFile || out.stdin || out.routeId || out.withLearning || out.withRecall)) {
    throw new Error("--eval-template cannot be combined with a brief, --from-file, --stdin, --route, --with-learning, or --with-recall");
  }
  if (out.eval && (!out.fromFile && !out.stdin)) {
    throw new Error("--eval requires --from-file or --stdin");
  }
  if (out.eval && (out.briefParts.length > 0 || out.routeId || out.withLearning || out.withRecall)) {
    throw new Error("--eval cannot be combined with an inline brief, --route, --with-learning, or --with-recall");
  }

  return {
    ...out,
    index: undefined,
    brief: out.briefParts.join(" ").trim(),
  };
}

function slashCommandFor(commandPath, prefix = SYMLINK_PREFIX) {
  if (!commandPath) return null;
  const name = path.basename(commandPath, ".md");
  return `/${prefix}${name}`;
}

function existingPaths(entries) {
  return entries.filter((entry) => entry.exists).map((entry) => entry.path);
}

function companionPlaybooks(sourceRoot, skillPaths) {
  return skillPaths
    .filter((skillPath) => skillPath.endsWith("/SKILL.md"))
    .map((skillPath) => skillPath.replace(/\/SKILL\.md$/, "/PLAYBOOK.md"))
    .filter((playbookPath) => existsSync(path.join(sourceRoot, playbookPath)));
}

function unique(items) {
  return Array.from(new Set(items));
}

function qualityCommandForRoute(routeId, artifactPath = "output.md") {
  return `design-ai check ${artifactPath} --route ${routeId} --strict`;
}

const BASE_CHECKLIST = [
  "Confirm the selected route, command, and files read before producing the artifact.",
  "Cite checked knowledge files for material design decisions.",
  "State assumptions and unresolved inputs explicitly.",
  "Include accessibility notes for contrast, keyboard/focus, touch targets, and screen-reader behavior where relevant.",
  "Include responsive behavior for mobile and desktop where relevant.",
  "Run the route playbook verification checklist before final output.",
];

const ROUTE_CHECKLIST = {
  "design-review": [
    "Lead with the highest-impact issue before secondary observations.",
    "Separate UX, visual design, and accessibility findings.",
    "Provide concrete fixes rather than broad design advice.",
  ],
  "website-improvement": [
    "Include Site Profile, Audit Checklist, MCP Readiness Matrix, Refactor Plan, Prompt Generator, and Handoff Report sections.",
    "State that implementation happens in the target website repo, not in design-ai.",
    "Cover accessibility, responsive QA, SEO/performance, runtime issues, and verification evidence.",
  ],
  "agentic-design-development": [
    "Separate reference-mining findings from product feature or skill changes; extract categories, constraints, and do-not-copy boundaries before implementation.",
    "Map every adopted pattern to an internal skill/playbook, CLI/SDK/MCP surface, verification command, rollout boundary, and reviewer-facing evidence.",
    "Add a human approval gate for any external write, publish, deployment, target-repo mutation, or generated task creation.",
    "Keep the implementation additive and testable: prefer route, prompt, skill proposal, SDK, or MCP slices with focused regression coverage.",
    "Include accessibility, keyboard, responsive, reduced-motion, provenance, and ownership/license notes when UI previews or animated components are involved.",
  ],
  "design-from-brief": [
    "Produce foundations, tokens, component baseline, and handoff guidance.",
    "Include light/dark behavior when color tokens are introduced.",
    "Name the first 5-8 starter components for the product category.",
  ],
  "component-spec": [
    "Cover anatomy, variants, states, API, tokens, ARIA, keyboard behavior, and edge cases.",
    "Cite Ant Design, MUI, and shadcn-ui references when available.",
    "Include at least one implementation-oriented example.",
  ],
  "palette-from-brand": [
    "Provide semantic token names, not only hex values.",
    "State contrast ratios for foreground/background pairs.",
    "Separate primitive palette from semantic role tokens.",
  ],
  "motion-design": [
    "Specify duration, easing, choreography, trigger, and reduced-motion behavior.",
    "Keep motion tiers aligned to micro/component/hero duration rules.",
  ],
  "document-from-brief": [
    "Name the Diataxis document type and keep structure consistent with it.",
    "Lead with the answer and keep instructions active-voice.",
  ],
  "slide-deck": [
    "Make every slide title a message, not a topic label.",
    "Separate speaker-led, pitch, and reading-deck assumptions.",
  ],
};

function checklistForRoute(route) {
  return unique([
    ...BASE_CHECKLIST,
    ...(ROUTE_CHECKLIST[route.id] || []),
  ]);
}

export function buildPromptPlan({
  brief,
  sourceRoot,
  prefix = SYMLINK_PREFIX,
  routeId = "",
  withLearning = false,
  learningFilePath = "",
  learningCategory = "",
  learningLimit = 0,
  withRecall = false,
  recallLimit = 0,
}) {
  const route = routeId
    ? routeById({ routeId, sourceRoot })
    : routeBrief({ brief, sourceRoot, limit: 1 })[0] || null;
  if (!route) return null;

  const slashCommand = route.command ? slashCommandFor(route.command.path, prefix) : null;
  const skillPaths = existingPaths(route.skills);
  const referenceExamples = listExamples({
    designAiPath: sourceRoot,
    query: brief,
    routeId: route.id,
    limit: 2,
  }).examples;
  const filesToRead = unique([
    "AGENTS.md",
    ...(route.command?.exists ? [route.command.path] : []),
    ...skillPaths,
    ...companionPlaybooks(sourceRoot, skillPaths),
    ...existingPaths(route.agents),
    ...existingPaths(route.knowledge),
    ...referenceExamples.map((example) => example.relPath),
  ]);

  const checklist = checklistForRoute(route);
  const qualityCommand = qualityCommandForRoute(route.id);
  const learningContext = withLearning
    ? buildLearningContext({
      filePath: learningFilePath || undefined,
      category: learningCategory,
      limit: learningLimit || 12,
      query: brief,
    })
    : null;
  const recallContext = withRecall
    ? buildRecallContext({
      brief,
      recallLimit: recallLimit || DEFAULT_RECALL_LIMIT,
      designAiPath: sourceRoot,
    })
    : null;

  return {
    brief,
    version: readRouteManifestVersion(sourceRoot),
    route,
    slashCommand,
    referenceExamples,
    filesToRead,
    checklist,
    qualityCommand,
    ...(learningContext ? { learningContext } : {}),
    ...(recallContext ? { recall: recallContext } : {}),
    prompt: renderPrompt({
      brief,
      route,
      slashCommand,
      referenceExamples,
      filesToRead,
      checklist,
      qualityCommand,
      learningContext,
      recallContext,
    }),
  };
}

export function formatPromptJson(plan) {
  return JSON.stringify(plan, null, 2);
}

function isoTimestamp(now = new Date()) {
  return (now instanceof Date ? now : new Date(now)).toISOString();
}

export function buildPromptEvalTemplate({ sourceRoot, generatedAt = new Date() } = {}) {
  return {
    version: PROMPT_EVAL_VERSION,
    generatedAt: isoTimestamp(generatedAt),
    sourcePromptVersion: sourceRoot ? readRouteManifestVersion(sourceRoot) : "unknown",
    description: "Deterministic prompt-plan checkpoints for design-ai agent workflows.",
    cases: [
      {
        id: "component-spec-prompt-plan",
        brief: "Spec a Button component API with variants, states, props, and keyboard accessibility",
        expectedRouteId: "component-spec",
        requiredFiles: [
          "AGENTS.md",
          "commands/component-spec.md",
          "skills/component-spec-writer/SKILL.md",
          "skills/component-spec-writer/PLAYBOOK.md",
          "knowledge/PRINCIPLES.md",
          "knowledge/a11y/keyboard-and-focus.md",
        ],
        requiredChecklist: [
          "Cover anatomy, variants, states, API, tokens, ARIA, keyboard behavior, and edge cases.",
          "Include at least one implementation-oriented example.",
        ],
      },
      {
        id: "website-improvement-prompt-plan",
        brief: "Improve a SaaS homepage with website audit, SEO, performance, MCP readiness, refactor plan, and handoff report",
        expectedRouteId: "website-improvement",
        requiredFiles: [
          "AGENTS.md",
          "commands/website-improvement.md",
          "skills/website-improvement/SKILL.md",
          "skills/website-improvement/PLAYBOOK.md",
          "docs/WEBSITE-IMPROVEMENT.md",
        ],
        requiredChecklist: [
          "Include Site Profile, Audit Checklist, MCP Readiness Matrix, Refactor Plan, Prompt Generator, and Handoff Report sections.",
          "State that implementation happens in the target website repo, not in design-ai.",
        ],
      },
      {
        id: "agentic-development-prompt-plan",
        brief: "Use OpenTag, Open Design, WWIT, and React Bits references to develop internal design-ai skills, SDK workflows, MCP feature surfaces, and approval-gated previews",
        expectedRouteId: "agentic-design-development",
        requiredFiles: [
          "AGENTS.md",
          "skills/website-improvement/SKILL.md",
          "skills/website-improvement/PLAYBOOK.md",
          "skills/design-system-builder/SKILL.md",
          "skills/handoff-spec/SKILL.md",
          "knowledge/patterns/agentic-design-workflows.md",
          "docs/AGENT-DEVELOPMENT.md",
          "docs/SDK.md",
        ],
        requiredChecklist: [
          "Separate reference-mining findings from product feature or skill changes; extract categories, constraints, and do-not-copy boundaries before implementation.",
          "Map every adopted pattern to an internal skill/playbook, CLI/SDK/MCP surface, verification command, rollout boundary, and reviewer-facing evidence.",
          "Keep the implementation additive and testable: prefer route, prompt, skill proposal, SDK, or MCP slices with focused regression coverage.",
        ],
      },
    ],
  };
}

function promptEvalStatus(counts) {
  if (counts.fail > 0) return "fail";
  if (counts.warn > 0) return "warn";
  return "pass";
}

function normalizePromptEvalPayload(evalText, source = "prompt-eval.json") {
  let payload;
  try {
    payload = JSON.parse(evalText);
  } catch (err) {
    throw new Error(`Could not parse prompt eval JSON from ${source}: ${err.message}`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Prompt eval payload must be a JSON object");
  }
  if (payload.version !== PROMPT_EVAL_VERSION) {
    throw new Error(`Prompt eval payload version must be ${PROMPT_EVAL_VERSION}`);
  }
  if (!Array.isArray(payload.cases)) {
    throw new Error("Prompt eval payload must include a cases array");
  }

  return payload;
}

function normalizeStringList(rawValue, label, id) {
  if (rawValue === undefined || rawValue === null) return [];
  if (!Array.isArray(rawValue)) {
    throw new Error(`Prompt eval case ${id} ${label} must be an array`);
  }
  return rawValue.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizePromptEvalCase(rawCase, index) {
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    throw new Error(`Prompt eval case ${index + 1} must be a JSON object`);
  }

  const id = String(rawCase.id || `case-${index + 1}`).trim();
  const brief = String(rawCase.brief || "").trim();
  const expectedRouteId = String(rawCase.expectedRouteId || rawCase.expected || "").trim();
  const routeId = String(rawCase.routeId || "").trim();
  const learningCategory = String(rawCase.learningCategory || "").trim();
  const learningLimit = rawCase.learningLimit === undefined || rawCase.learningLimit === null
    ? 0
    : Number(rawCase.learningLimit);

  if (!id) throw new Error(`Prompt eval case ${index + 1} is missing id`);
  if (!brief) throw new Error(`Prompt eval case ${id} is missing brief`);
  if (!expectedRouteId) throw new Error(`Prompt eval case ${id} is missing expectedRouteId`);
  if (learningLimit && (!Number.isInteger(learningLimit) || learningLimit < 1 || learningLimit > 100)) {
    throw new Error(`Prompt eval case ${id} learningLimit must be an integer from 1 to 100`);
  }

  return {
    id,
    brief,
    expectedRouteId,
    routeId,
    requiredFiles: normalizeStringList(rawCase.requiredFiles, "requiredFiles", id),
    requiredChecklist: normalizeStringList(rawCase.requiredChecklist, "requiredChecklist", id),
    requiredPromptFragments: normalizeStringList(rawCase.requiredPromptFragments, "requiredPromptFragments", id),
    withLearning: Boolean(rawCase.withLearning),
    requireLearningContext: Boolean(rawCase.requireLearningContext),
    learningCategory,
    learningLimit,
  };
}

function includesEveryText(haystackItems, requiredItems) {
  return requiredItems.filter((required) => !haystackItems.some((item) => item.includes(required)));
}

function evaluatePromptPlanCase(testCase, {
  sourceRoot,
  prefix = SYMLINK_PREFIX,
  learningFilePath = "",
}) {
  const plan = buildPromptPlan({
    brief: testCase.brief,
    sourceRoot,
    prefix,
    routeId: testCase.routeId,
    withLearning: testCase.withLearning || testCase.requireLearningContext,
    learningFilePath,
    learningCategory: testCase.learningCategory,
    learningLimit: testCase.learningLimit,
  });

  const issues = [];
  const warnings = [];
  const routeId = plan?.route?.id || "";
  if (!plan) {
    issues.push("No prompt plan was produced.");
  } else if (routeId !== testCase.expectedRouteId) {
    issues.push(`Expected route ${testCase.expectedRouteId}, but prompt plan selected ${routeId}.`);
  }

  const missingRequiredFiles = plan
    ? testCase.requiredFiles.filter((file) => !plan.filesToRead.includes(file))
    : testCase.requiredFiles;
  if (missingRequiredFiles.length > 0) {
    issues.push(`Missing required files: ${missingRequiredFiles.join(", ")}`);
  }

  const missingChecklist = plan
    ? includesEveryText(plan.checklist, testCase.requiredChecklist)
    : testCase.requiredChecklist;
  if (missingChecklist.length > 0) {
    issues.push(`Missing checklist items: ${missingChecklist.join(" | ")}`);
  }

  const missingPromptFragments = plan
    ? testCase.requiredPromptFragments.filter((fragment) => !plan.prompt.includes(fragment))
    : testCase.requiredPromptFragments;
  if (missingPromptFragments.length > 0) {
    issues.push(`Missing prompt fragments: ${missingPromptFragments.join(" | ")}`);
  }

  const learningContext = plan?.learningContext || null;
  if (testCase.requireLearningContext && !learningContext) {
    issues.push("Expected learning context, but none was included.");
  } else if (testCase.withLearning && learningContext && learningContext.entries.length === 0) {
    warnings.push("Learning context was requested but selected no entries.");
  }

  const status = issues.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass";

  return {
    id: testCase.id,
    status,
    message: issues[0] || warnings[0] || "Prompt plan matched expectations.",
    expectedRouteId: testCase.expectedRouteId,
    routeId,
    forcedRouteId: testCase.routeId,
    filesToReadCount: plan?.filesToRead?.length || 0,
    requiredFiles: testCase.requiredFiles,
    missingRequiredFiles,
    requiredChecklist: testCase.requiredChecklist,
    missingChecklist,
    requiredPromptFragments: testCase.requiredPromptFragments,
    missingPromptFragments,
    learningContext: learningContext
      ? {
        category: learningContext.category,
        limit: learningContext.limit,
        count: learningContext.entries.length,
        selectedCount: learningContext.selection?.selectedCount || 0,
      }
      : null,
    issues,
    warnings,
    brief: testCase.brief,
    plan,
  };
}

export function promptEvalReport({
  evalText,
  source = "prompt-eval.json",
  sourceRoot,
  prefix = SYMLINK_PREFIX,
  learningFilePath = "",
  generatedAt = new Date(),
}) {
  const payload = normalizePromptEvalPayload(evalText, source);
  const normalizedCases = payload.cases.map((testCase, index) => normalizePromptEvalCase(testCase, index));
  const cases = normalizedCases.map((testCase) => evaluatePromptPlanCase(testCase, {
    sourceRoot,
    prefix,
    learningFilePath,
  }));
  const counts = cases.reduce(
    (acc, testCase) => ({
      ...acc,
      [testCase.status]: acc[testCase.status] + 1,
    }),
    { pass: 0, warn: 0, fail: 0 },
  );

  return {
    version: readRouteManifestVersion(sourceRoot),
    evalVersion: payload.version,
    source,
    generatedAt: isoTimestamp(generatedAt),
    status: promptEvalStatus(counts),
    summary: {
      total: cases.length,
      pass: counts.pass,
      warn: counts.warn,
      fail: counts.fail,
    },
    cases,
  };
}

export function renderPrompt({
  brief,
  route,
  slashCommand,
  referenceExamples = [],
  filesToRead,
  checklist = checklistForRoute(route),
  qualityCommand = qualityCommandForRoute(route.id),
  learningContext = null,
  recallContext = null,
}) {
  const lines = [];
  lines.push("# design-ai task prompt");
  lines.push("");
  lines.push(`Task: ${brief}`);
  lines.push("");
  const routeDetail = route.forced ? "forced" : `${route.confidence} confidence`;
  lines.push(`${route.forced ? "Selected route" : "Recommended route"}: ${route.label} (${routeDetail})`);
  lines.push(`Route id: ${route.id}`);
  if (route.explanation?.summary) {
    lines.push(`Routing reason: ${route.explanation.summary}`);
  }
  if (route.matchedKeywords.length > 0) {
    lines.push(`Matched keywords: ${route.matchedKeywords.join(", ")}`);
  } else if (route.forced) {
    lines.push("Matched keywords: route selected via --route");
  } else if (route.fallback) {
    lines.push("Matched keywords: fallback route");
  }
  lines.push("");

  if (slashCommand) {
    lines.push("Preferred command:");
    lines.push("");
    lines.push("```text");
    lines.push(`${slashCommand} ${brief}`);
    lines.push("```");
    lines.push("");
  }

  if (referenceExamples.length > 0) {
    lines.push("Reference examples:");
    for (const example of referenceExamples) {
      lines.push(`- ${example.relPath} — ${example.title}`);
    }
    lines.push("");
  }

  if (learningContext) {
    lines.push("Learned design context:");
    lines.push("");
    lines.push(learningContext.markdown);
    lines.push("");
  }

  if (recallContext) {
    lines.push("Recalled corpus knowledge:");
    lines.push("");
    lines.push(recallContext.markdown);
    lines.push("");
  }

  lines.push("Before producing the artifact, read these files in order:");
  for (const file of filesToRead) {
    lines.push(`- ${file}`);
  }
  lines.push("");

  lines.push("Execution rules:");
  lines.push("- Follow AGENTS.md and knowledge/PRINCIPLES.md first.");
  lines.push("- Use the listed command or skill playbook as the workflow source of truth.");
  lines.push("- Cite checked knowledge files when making design recommendations.");
  lines.push("- Include accessibility notes: contrast, keyboard/focus, touch target, and screen-reader behavior where relevant.");
  lines.push("- Save the final Markdown artifact as output.md when practical, then run the suggested artifact QA command.");
  lines.push("- Run the playbook verification checklist before final output.");
  lines.push("- If required inputs are missing, ask one concise clarifying question; otherwise proceed.");
  lines.push("");

  lines.push("Suggested artifact QA command:");
  lines.push("");
  lines.push("```bash");
  lines.push(qualityCommand);
  lines.push("```");
  lines.push("");

  lines.push("Verification checklist:");
  for (const item of checklist) {
    lines.push(`- [ ] ${item}`);
  }

  return lines.join("\n");
}
