// Prompt generation for `design-ai prompt`.

import path from "node:path";
import { existsSync } from "node:fs";

import { parseBriefSourceFlag } from "./brief.mjs";
import { listExamples } from "./examples.mjs";
import { buildLearningContext, normalizeCategory, parseLearningLimit } from "./learn.mjs";
import { SYMLINK_PREFIX } from "./paths.mjs";
import { parseOutputFlags } from "./output.mjs";
import { readRouteManifestVersion, routeBrief, routeById } from "./route.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const PROMPT_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--route",
  "--from-file",
  "--stdin",
  "--out",
  "--force",
  "--with-learning",
  "--learning-category",
  "--learning-limit",
];

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
    prompt: renderPrompt({
      brief,
      route,
      slashCommand,
      referenceExamples,
      filesToRead,
      checklist,
      qualityCommand,
      learningContext,
    }),
  };
}

export function formatPromptJson(plan) {
  return JSON.stringify(plan, null, 2);
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
