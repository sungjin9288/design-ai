// Minimal stdio MCP server for exposing design-ai CLI workflows to Claude/Codex.

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import path from "node:path";

import { DESIGN_AI_HOME, PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";
import { LEARNING_CATEGORIES, LEARNING_FEEDBACK_OUTCOMES } from "./learn-args.mjs";
import { formatRouteJson } from "./route.mjs";
import { buildRoutePayload } from "./route-operation.mjs";
import { buildStartPayload } from "./start-operation.mjs";
import { formatStartJson } from "./start.mjs";
import { inspectHtml } from "./design-quality-inspector.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { listProductReviewPacks, loadProductReviewPack } from "./product-review-pack.mjs";

const PROTOCOL_VERSION = "2025-11-25";
const SERVER_INSTRUCTIONS = [
  "Use design-ai MCP tools for local, deterministic design expertise.",
  "Use design_ai_review_html to compose one canonical plan and static review without running a browser or writing files.",
  "Use design_ai_start for a read-only route and design-contract plan; declared repositories, pages, and screenshots are not inspected and its next command is not executed.",
  "Use design_ai_inspect_html for a lower-level supplied-HTML quality report; unobserved runtime behavior remains unverified.",
  "Product review packs are explicit and never inferred from locale.",
  "Other read-only tools route briefs, generate prompts and artifacts, search the corpus, recall context, check Markdown, validate Website Improvement readiness, and prepare approval-gated handoffs.",
  "Prefer read-only tools unless the user explicitly asks to record local learning usage.",
  "Only design_ai_learn_remember, design_ai_learn_feedback, and design_ai_learn_capture write the local learning profile, and only when explicitly called.",
].join(" ");
const LEARNING_WRITE_BOUNDARY = "Writes ONLY the local learning profile (DESIGN_AI_LEARNING_FILE or its default), and only when explicitly called.";
const MAX_TOOL_OUTPUT_BYTES = 220_000;
const DESIGN_AI_BIN = path.join(PACKAGE_ROOT, "cli", "bin", "design-ai.mjs");
const MCP_RESPONSE_METHODS = new Set([
  "initialize",
  "ping",
  "tools/list",
  "tools/call",
  "resources/list",
  "prompts/list",
]);

function optionalString(description = "") {
  return { type: "string", description };
}

function optionalEnumString(values, description = "") {
  return { type: "string", enum: values, description };
}

function optionalBoolean(description = "") {
  return { type: "boolean", description };
}

function optionalInteger({ description = "", minimum = 1, maximum = 100 } = {}) {
  return { type: "integer", minimum, maximum, description };
}

export const MCP_TOOLS = [
  {
    name: "design_ai_route",
    title: "Route a design task",
    description: "Recommend the best design-ai route, command, skills, and knowledge files for a task brief. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", minLength: 1, description: "Task brief to route." },
        limit: optionalInteger({ description: "Maximum route recommendations, 1-10.", minimum: 1, maximum: 10 }),
        explain: optionalBoolean("Include route scoring and reference coverage details."),
      },
      required: ["brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_start",
    title: "Start a design task",
    description: "Build one read-only route, DESIGN.md contract, review playbook, and next-step plan. Declared repositories, URLs, and screenshots are not inspected or fetched.",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", minLength: 1, description: "Task brief." },
        routeId: optionalString("Optional forced route id."),
        siteName: optionalString("Optional site name for Website Improvement workspace planning."),
        repoUrl: optionalString("Declared repository URL. It is not fetched."),
        localPath: optionalString("Declared absolute local repository path. It is not read."),
        url: optionalString("Declared page URL. It is not opened."),
        screenshots: { type: "array", items: { type: "string", minLength: 1 }, description: "Declared screenshot paths or URLs. They are not opened." },
        locale: optionalString("Optional locale such as ko-KR."),
        viewports: { type: "array", items: { type: "string", minLength: 1 }, description: "Optional viewport names." },
      },
      required: ["brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_inspect_html",
    title: "Inspect supplied HTML",
    description: "Build a canonical design quality report from supplied HTML. Read-only: does not read paths, run scripts, open a browser, write files, or mutate a repository.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", minLength: 1, description: "HTML source content to inspect." },
        sourceRef: { type: "string", minLength: 1, description: "Human-readable source reference used in evidence locations." },
        brief: { type: "string", minLength: 1, description: "Review brief." },
        name: optionalString("Optional subject name."),
        locale: optionalString("Optional review locale. Default: en."),
        viewports: { type: "array", items: { type: "string", minLength: 1 }, description: "Declared viewport names. Defaults to mobile and desktop." },
        generatedAt: optionalString("Optional normalized UTC timestamp for byte-stable output."),
        reviewPack: optionalString("Optional shipped Korean product review pack id."),
      },
      required: ["source", "sourceRef", "brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_review_html",
    title: "Review supplied HTML",
    description: [
      "Compose one canonical read-only plan and static design quality report from supplied HTML.",
      "Does not read paths, run a browser, write files, mutate a repository, or call an external service.",
    ].join(" "),
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", minLength: 1, description: "HTML source content to review." },
        sourceRef: { type: "string", minLength: 1, description: "Human-readable source reference used in evidence." },
        brief: { type: "string", minLength: 1, description: "Review brief." },
        name: optionalString("Optional subject name."),
        locale: optionalString("Optional review locale. Default: en."),
        viewports: { type: "array", items: { type: "string", minLength: 1 }, description: "Declared viewport names." },
        generatedAt: optionalString("Optional normalized UTC timestamp for byte-stable output."),
        reviewPack: optionalString("Optional shipped Korean product review pack id."),
        siteName: optionalString("Declared site name. No workspace is created."),
        repoUrl: optionalString("Declared repository URL. It is not fetched."),
        localPath: optionalString("Declared absolute repository path. It is not read."),
        url: optionalString("Declared page URL. It is not opened."),
        screenshots: {
          type: "array",
          items: { type: "string", minLength: 1 },
          description: "Declared screenshot references. They are not opened.",
        },
      },
      required: ["source", "sourceRef", "brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_review_pack",
    title: "Read a Korean product review pack",
    description: "List or read the versioned Korean fintech, commerce, SaaS, content, and game review packs. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        id: optionalString("Optional pack id. Omit to list available packs."),
      },
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_prompt",
    title: "Generate an agent prompt",
    description: "Generate a ready-to-use design-ai agent prompt from a brief. Read-only unless withLearning is true, which records local usage metadata. Supports opt-in recall augmentation via withRecall, which enriches the output with brief-relevant shipped corpus knowledge.",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", minLength: 1, description: "Task brief." },
        routeId: optionalString("Optional forced route id, such as component-spec or website-improvement."),
        withLearning: optionalBoolean("Include local learning preferences and record local usage metadata."),
        learningCategory: optionalString("Optional learning category when withLearning is true."),
        learningLimit: optionalInteger({ description: "Maximum learning entries, 1-100.", minimum: 1, maximum: 100 }),
        withRecall: optionalBoolean("Opt-in recall augmentation: enriches the output with brief-relevant shipped corpus knowledge ranked by the deterministic lexical scorer. Requires no index and makes no network call."),
        recallLimit: optionalInteger({ description: "Maximum recall passages, 1-20.", minimum: 1, maximum: 20 }),
        json: optionalBoolean("Return machine-readable prompt plan JSON instead of Markdown."),
      },
      required: ["brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_artifact",
    title: "Build a design artifact plan",
    description: "Build a portable implementation plan, critique loop, or agent-readable DESIGN.md contract. Read-only: it does not write files, mutate a repository, or contact an external service.",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", minLength: 1, description: "Task brief." },
        mode: {
          type: "string",
          enum: ["implementation-plan", "critique-loop", "design-contract"],
          description: "Artifact operation to plan.",
        },
        routeId: optionalString("Optional forced route id."),
        json: optionalBoolean("Return the machine-readable artifact contract instead of Markdown."),
      },
      required: ["brief", "mode"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_pack",
    title: "Generate prompt plus bounded context",
    description: "Generate a prompt pack with relevant design-ai context files. Read-only unless withLearning is true, which records local usage metadata. Supports opt-in recall augmentation via withRecall, which enriches the output with brief-relevant shipped corpus knowledge.",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", minLength: 1, description: "Task brief." },
        routeId: optionalString("Optional forced route id."),
        maxBytes: optionalInteger({ description: "Maximum context bytes to include.", minimum: 1000, maximum: 1_000_000 }),
        withLearning: optionalBoolean("Include local learning preferences and record local usage metadata."),
        learningCategory: optionalString("Optional learning category when withLearning is true."),
        learningLimit: optionalInteger({ description: "Maximum learning entries, 1-100.", minimum: 1, maximum: 100 }),
        withRecall: optionalBoolean("Opt-in recall augmentation: enriches the output with brief-relevant shipped corpus knowledge ranked by the deterministic lexical scorer. Requires no index and makes no network call."),
        recallLimit: optionalInteger({ description: "Maximum recall passages, 1-20.", minimum: 1, maximum: 20 }),
        json: optionalBoolean("Return machine-readable pack JSON instead of Markdown."),
      },
      required: ["brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_search",
    title: "Search design-ai corpus",
    description: "Search knowledge, examples, skills, docs, agents, or commands. Read-only. Supports an opt-in ranked mode for deterministic BM25-style results.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, description: "Search query." },
        dir: optionalString("Optional corpus directory: knowledge, examples, skills, docs, agents, commands."),
        limit: optionalInteger({ description: "Maximum hits, 1-500.", minimum: 1, maximum: 500 }),
        ranked: optionalBoolean("Opt-in deterministic BM25-style ranked results. Requires no index and never builds one; falls back to a live corpus scan when no index is present."),
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_show",
    title: "Show corpus file",
    description: "Read a design-ai corpus file or line range. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", minLength: 1, description: "Path or path:line target, such as knowledge/PRINCIPLES.md:1." },
        lines: optionalString("Optional line range N:M."),
        context: optionalInteger({ description: "Context lines around target.", minimum: 0, maximum: 100 }),
      },
      required: ["target"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_examples",
    title: "Find worked examples",
    description: "Find worked design-ai examples by query or route id. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        query: optionalString("Optional example search query."),
        routeId: optionalString("Optional route id, such as component-spec."),
        limit: optionalInteger({ description: "Maximum examples.", minimum: 1, maximum: 50 }),
      },
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_recall",
    title: "Recall corpus and learning context",
    description: "Recall brief-relevant shipped corpus knowledge plus local learning-profile entries for a query, ranked by the deterministic lexical scorer. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, description: "Recall query text." },
        limit: optionalInteger({ description: "Maximum results per list (corpus and learning), 1-20.", minimum: 1, maximum: 20 }),
        category: optionalEnumString(LEARNING_CATEGORIES, "Optional learning category filter, scopes only the learning list."),
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_check",
    title: "Check Markdown artifact quality",
    description: "Check generated Markdown for grounding, accessibility, responsive notes, unresolved markers, and route-specific requirements. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        artifact: { type: "string", minLength: 1, description: "Markdown artifact content to check." },
        routeId: optionalString("Optional route-specific checks."),
        strict: optionalBoolean("Treat warnings as failures."),
        issuesOnly: optionalBoolean("Show only warnings/failures in human output."),
        json: optionalBoolean("Return machine-readable JSON. Defaults to true."),
      },
      required: ["artifact"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_site_mcp_check",
    title: "Check Website Improvement MCP readiness",
    description: "Validate Website Improvement workspace MCP readiness without external MCP calls or target-repo mutation.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceJson: { type: "string", minLength: 2, description: "Website Improvement workspace JSON." },
        probes: optionalBoolean("Include read-only local probes."),
        strict: optionalBoolean("Exit non-zero on warning/failure readiness."),
        json: optionalBoolean("Return machine-readable JSON. Defaults to true."),
      },
      required: ["workspaceJson"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_site_mcp_plan",
    title: "Generate Website Improvement MCP action plan",
    description: "Generate a Website Improvement MCP action plan without external MCP calls or target-repo mutation.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceJson: { type: "string", minLength: 2, description: "Website Improvement workspace JSON." },
        probes: optionalBoolean("Include read-only local probes."),
        strict: optionalBoolean("Exit non-zero on warning/failure readiness."),
        json: optionalBoolean("Return machine-readable JSON instead of Markdown."),
      },
      required: ["workspaceJson"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_site_linked_preview",
    title: "Inspect Website Improvement linked preview readiness",
    description: "Read root metadata from a linked local website folder and return an operator-controlled preview loop. Read-only: does not start a process, call an external service, scan source files, or mutate the target repository.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceJson: { type: "string", minLength: 2, description: "Website Improvement workspace JSON with an absolute siteProfile.localPath." },
        strict: optionalBoolean("Exit non-zero on warning/failure readiness."),
        json: optionalBoolean("Return machine-readable JSON instead of Markdown. Defaults to true."),
      },
      required: ["workspaceJson"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_site_bundle_handoff",
    title: "Prepare a verified Website Improvement target-repo handoff",
    description: "Validate a local Website Improvement handoff bundle and return a task-scoped Codex/Claude implementation prompt with a required human approval gate. Read-only: no external calls or target-repo mutation.",
    inputSchema: {
      type: "object",
      properties: {
        bundleDir: { type: "string", minLength: 1, description: "Local Website Improvement handoff bundle directory." },
        taskSelector: optionalString("Optional refactor task id or 1-based task number."),
      },
      required: ["bundleDir"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_learn_remember",
    title: "Remember a learning preference",
    description: `Record a local learning-profile preference for prompt personalization. ${LEARNING_WRITE_BOUNDARY}`,
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", minLength: 1, description: "Preference text to remember." },
        category: optionalEnumString(LEARNING_CATEGORIES, "Optional learning category. Defaults to preference."),
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_learn_feedback",
    title: "Record learning feedback",
    description: `Record keep/improve/avoid feedback as a local learning-profile entry. ${LEARNING_WRITE_BOUNDARY}`,
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", minLength: 1, description: "Feedback text." },
        outcome: optionalEnumString(LEARNING_FEEDBACK_OUTCOMES, "Optional feedback outcome: keep, improve, or avoid. Defaults to improve."),
        category: optionalEnumString(LEARNING_CATEGORIES, "Optional learning category. Defaults to workflow."),
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_learn_capture",
    title: "Check artifact and capture learning",
    description: `Check a Markdown artifact, then capture its non-pass results as local learning-profile entries. The only compound read+write tool. ${LEARNING_WRITE_BOUNDARY}`,
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", minLength: 1, description: "Markdown artifact content to check via stdin, then capture." },
        route: optionalString("Optional route id, such as component-spec."),
      },
      required: ["content"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_version",
    title: "Show design-ai version",
    description: "Return design-ai CLI and corpus version metadata. Read-only.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

function readPackageVersion() {
  try {
    return JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8")).version || "unknown";
  } catch {
    return "unknown";
  }
}

function assertString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
}

function assertMcpInputValue(name, value, schema) {
  if (schema.type === "string") {
    if (typeof value !== "string") throw new Error(`${name} must be a string`);
    if (schema.minLength && value.trim() === "") {
      throw new Error(`${name} must be a non-empty string`);
    }
    if (schema.minLength && value.length < schema.minLength) {
      throw new Error(`${name} must be at least ${schema.minLength} characters`);
    }
    if (schema.enum && !schema.enum.includes(value)) {
      throw new Error(`${name} must be one of: ${schema.enum.join(", ")}`);
    }
    return;
  }

  if (schema.type === "boolean") {
    if (typeof value !== "boolean") throw new Error(`${name} must be a boolean`);
    return;
  }

  if (schema.type === "integer") {
    if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
    if (schema.minimum !== undefined && value < schema.minimum) {
      throw new Error(`${name} must be at least ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      throw new Error(`${name} must be at most ${schema.maximum}`);
    }
  }
}

function assertMcpToolInput(tool, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${tool.name} arguments must be an object`);
  }

  const properties = tool.inputSchema.properties || {};
  for (const name of tool.inputSchema.required || []) {
    if (!Object.hasOwn(input, name)) throw new Error(`${tool.name}.${name} is required`);
  }

  for (const [name, value] of Object.entries(input)) {
    const schema = properties[name];
    if (!schema) throw new Error(`Unknown argument for ${tool.name}: ${name}`);
    assertMcpInputValue(`${tool.name}.${name}`, value, schema);
  }
}

function maybePush(args, flag, value) {
  if (value !== undefined && value !== null && value !== "") args.push(flag, String(value));
}

function maybeBool(args, flag, value) {
  if (value === true) args.push(flag);
}

function truncateText(text) {
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= MAX_TOOL_OUTPUT_BYTES) return text;
  const truncated = Buffer.from(text, "utf8").subarray(0, MAX_TOOL_OUTPUT_BYTES).toString("utf8");
  return `${truncated}\n\n[design-ai MCP output truncated at ${MAX_TOOL_OUTPUT_BYTES} bytes from ${bytes} bytes]`;
}

function jsonToolResult(payload) {
  const text = JSON.stringify(payload, null, 2);
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= MAX_TOOL_OUTPUT_BYTES) {
    return { content: [{ type: "text", text }], isError: false };
  }

  const error = {
    kind: "design-ai-mcp-error",
    code: "OUTPUT_TOO_LARGE",
    message: "The inspection report exceeds the MCP output limit. Narrow the supplied HTML and inspect smaller sections.",
    limitBytes: MAX_TOOL_OUTPUT_BYTES,
    actualBytes: bytes,
  };
  return { content: [{ type: "text", text: JSON.stringify(error, null, 2) }], isError: true };
}

export function buildCliInvocation(toolName, input = {}) {
  const args = [];
  let stdin = "";

  if (toolName === "design_ai_prompt") {
    args.push("prompt", assertString(input.brief, "brief"));
    maybePush(args, "--route", input.routeId);
    maybeBool(args, "--with-learning", input.withLearning);
    maybePush(args, "--learning-category", input.learningCategory);
    maybePush(args, "--learning-limit", input.learningLimit);
    maybeBool(args, "--with-recall", input.withRecall);
    maybePush(args, "--recall-limit", input.recallLimit);
    maybeBool(args, "--json", input.json);
    return { args, stdin };
  }

  if (toolName === "design_ai_artifact") {
    args.push("artifact", assertString(input.mode, "mode"), assertString(input.brief, "brief"));
    maybePush(args, "--route", input.routeId);
    maybeBool(args, "--json", input.json);
    return { args, stdin };
  }

  if (toolName === "design_ai_pack") {
    args.push("pack", assertString(input.brief, "brief"));
    maybePush(args, "--route", input.routeId);
    maybePush(args, "--max-bytes", input.maxBytes);
    maybeBool(args, "--with-learning", input.withLearning);
    maybePush(args, "--learning-category", input.learningCategory);
    maybePush(args, "--learning-limit", input.learningLimit);
    maybeBool(args, "--with-recall", input.withRecall);
    maybePush(args, "--recall-limit", input.recallLimit);
    maybeBool(args, "--json", input.json);
    return { args, stdin };
  }

  if (toolName === "design_ai_search") {
    args.push("search", assertString(input.query, "query"), "--json");
    maybePush(args, "--dir", input.dir);
    maybePush(args, "--limit", input.limit);
    maybeBool(args, "--ranked", input.ranked);
    return { args, stdin };
  }

  if (toolName === "design_ai_show") {
    args.push("show", assertString(input.target, "target"), "--json");
    maybePush(args, "--lines", input.lines);
    maybePush(args, "--context", input.context);
    return { args, stdin };
  }

  if (toolName === "design_ai_examples") {
    args.push("examples", "--json");
    if (input.query) args.splice(1, 0, String(input.query));
    maybePush(args, "--route", input.routeId);
    maybePush(args, "--limit", input.limit);
    return { args, stdin };
  }

  if (toolName === "design_ai_recall") {
    args.push("learn", "--recall", assertString(input.query, "query"), "--json");
    maybePush(args, "--limit", input.limit);
    maybePush(args, "--category", input.category);
    return { args, stdin };
  }

  if (toolName === "design_ai_check") {
    args.push("check", "--stdin");
    stdin = assertString(input.artifact, "artifact");
    maybePush(args, "--route", input.routeId);
    maybeBool(args, "--strict", input.strict);
    maybeBool(args, "--issues-only", input.issuesOnly);
    if (input.json !== false) args.push("--json");
    return { args, stdin };
  }

  if (toolName === "design_ai_site_mcp_check") {
    args.push("site", "--stdin", "--mcp-check");
    stdin = assertString(input.workspaceJson, "workspaceJson");
    maybeBool(args, "--probes", input.probes);
    maybeBool(args, "--strict", input.strict);
    if (input.json !== false) args.push("--json");
    return { args, stdin };
  }

  if (toolName === "design_ai_site_mcp_plan") {
    args.push("site", "--stdin", "--mcp-plan");
    stdin = assertString(input.workspaceJson, "workspaceJson");
    maybeBool(args, "--probes", input.probes);
    maybeBool(args, "--strict", input.strict);
    maybeBool(args, "--json", input.json);
    return { args, stdin };
  }

  if (toolName === "design_ai_site_linked_preview") {
    args.push("site", "--stdin", "--linked-preview");
    stdin = assertString(input.workspaceJson, "workspaceJson");
    maybeBool(args, "--strict", input.strict);
    if (input.json !== false) args.push("--json");
    return { args, stdin };
  }

  if (toolName === "design_ai_site_bundle_handoff") {
    args.push("site", assertString(input.bundleDir, "bundleDir"), "--bundle-handoff");
    maybePush(args, "--task", input.taskSelector);
    args.push("--strict", "--json");
    return { args, stdin };
  }

  if (toolName === "design_ai_learn_remember") {
    args.push("learn", "--remember", assertString(input.text, "text"), "--json");
    maybePush(args, "--category", input.category);
    return { args, stdin };
  }

  if (toolName === "design_ai_learn_feedback") {
    args.push("learn", "--feedback", assertString(input.text, "text"), "--json");
    maybePush(args, "--outcome", input.outcome);
    maybePush(args, "--category", input.category);
    return { args, stdin };
  }

  if (toolName === "design_ai_learn_capture") {
    args.push("check", "--stdin", "--learn", "--yes", "--json");
    stdin = assertString(input.content, "content");
    maybePush(args, "--route", input.route);
    return { args, stdin };
  }

  if (toolName === "design_ai_version") {
    args.push("version", "--json");
    return { args, stdin };
  }

  throw new Error(`Unknown MCP tool: ${toolName}`);
}

export function runDesignAiCli(args, { stdin = "" } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [DESIGN_AI_BIN, ...args], {
      cwd: DESIGN_AI_HOME,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({ code: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
    child.stdin.end(stdin);
  });
}

export async function callMcpTool(name, input = {}, runCli = runDesignAiCli) {
  const tool = MCP_TOOLS.find((item) => item.name === name);
  if (tool) assertMcpToolInput(tool, input || {});

  if (name === "design_ai_route") {
    const payload = buildRoutePayload({
      brief: input.brief,
      sourceRoot: DESIGN_AI_HOME,
      limit: input.limit,
      explain: input.explain,
    });
    return {
      content: [{ type: "text", text: truncateText(formatRouteJson(payload)) }],
      isError: false,
    };
  }

  if (name === "design_ai_start") {
    const payload = buildStartPayload({
      brief: input.brief,
      sourceRoot: DESIGN_AI_HOME,
      prefix: SYMLINK_PREFIX,
      routeId: input.routeId,
      context: {
        siteName: input.siteName,
        repoUrl: input.repoUrl,
        localPath: input.localPath,
        url: input.url,
        screenshots: input.screenshots,
        locale: input.locale,
        viewports: input.viewports,
      },
    });
    return {
      content: [{ type: "text", text: truncateText(formatStartJson(payload)) }],
      isError: false,
    };
  }

  if (name === "design_ai_inspect_html") {
    const payload = inspectHtml(input.source, {
      sourceRef: input.sourceRef,
      brief: input.brief,
      name: input.name,
      locale: input.locale,
      viewports: input.viewports,
      generatedAt: input.generatedAt,
      reviewPack: input.reviewPack,
    });
    return jsonToolResult(payload);
  }

  if (name === "design_ai_review_html") {
    const payload = buildReviewWorkflow(input.source, {
      sourceRef: input.sourceRef,
      brief: input.brief,
      name: input.name,
      locale: input.locale,
      viewports: input.viewports,
      generatedAt: input.generatedAt,
      reviewPack: input.reviewPack,
      siteName: input.siteName,
      repoUrl: input.repoUrl,
      localPath: input.localPath,
      url: input.url,
      screenshots: input.screenshots,
      sourceRoot: DESIGN_AI_HOME,
      prefix: SYMLINK_PREFIX,
    });
    return jsonToolResult(payload);
  }

  if (name === "design_ai_review_pack") {
    const payload = input.id
      ? loadProductReviewPack(input.id)
      : { kind: "design-ai-product-review-pack-list", schemaVersion: 1, packs: listProductReviewPacks() };
    return jsonToolResult(payload);
  }

  const invocation = buildCliInvocation(name, input || {});
  const result = await runCli(invocation.args, { stdin: invocation.stdin });
  const text = [
    result.stdout.trimEnd(),
    result.stderr.trim() ? `\n[stderr]\n${result.stderr.trimEnd()}` : "",
  ].filter(Boolean).join("\n");

  return {
    content: [{ type: "text", text: truncateText(text || "(no output)") }],
    isError: result.code !== 0,
  };
}

function successResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function chooseProtocolVersion(requestedVersion) {
  return requestedVersion === PROTOCOL_VERSION ? requestedVersion : PROTOCOL_VERSION;
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateMcpRequestEnvelope(message) {
  if (!isObjectRecord(message)) {
    return "Invalid MCP request: request must be an object";
  }
  if (message.jsonrpc !== "2.0") {
    return 'Invalid MCP request: jsonrpc must be "2.0"';
  }
  if (hasRequestId(message) && !isValidMcpRequestId(message.id)) {
    return "Invalid MCP request: id must be a string, number, or null";
  }
  return "";
}

function validateMcpRequestMethod(message) {
  if (!Object.hasOwn(message, "method")) {
    return "Invalid MCP request: missing method";
  }
  if (typeof message.method !== "string" || message.method.trim() === "") {
    return "Invalid MCP request: method must be a non-empty string";
  }
  return "";
}

function isMcpNotificationMethod(method) {
  return typeof method === "string" && method.startsWith("notifications/");
}

function validateMcpNotificationRequest(message) {
  if (isMcpNotificationMethod(message.method) && hasRequestId(message)) {
    return `Invalid MCP request: ${message.method} must not include id`;
  }
  return "";
}

function validateMcpRequestIdRequirement(message) {
  if (MCP_RESPONSE_METHODS.has(message.method) && !hasRequestId(message)) {
    return `Invalid MCP request: ${message.method} must include id`;
  }
  return "";
}

function validateOptionalObjectParams(method, params) {
  if (params === undefined || isObjectRecord(params)) return "";
  return `${method} params must be an object when provided`;
}

function validateToolCallParams(params) {
  if (!isObjectRecord(params)) {
    return "tools/call params must be an object";
  }
  if (typeof params.name !== "string" || params.name.trim() === "") {
    return "tools/call params.name must be a non-empty string";
  }
  if (Object.hasOwn(params, "arguments") && params.arguments !== undefined && !isObjectRecord(params.arguments)) {
    return "tools/call params.arguments must be an object when provided";
  }
  return "";
}

function validateInitializeParams(params) {
  if (!isObjectRecord(params)) {
    return "initialize params must be an object";
  }
  if (Object.hasOwn(params, "protocolVersion") && typeof params.protocolVersion !== "string") {
    return "initialize params.protocolVersion must be a string";
  }
  if (typeof params.protocolVersion === "string" && params.protocolVersion.trim() === "") {
    return "initialize params.protocolVersion must be a non-empty string";
  }
  return "";
}

function hasRequestId(message) {
  return isObjectRecord(message) && Object.hasOwn(message, "id");
}

function isValidMcpRequestId(id) {
  return id === null || typeof id === "string" || (typeof id === "number" && Number.isFinite(id));
}

function responseIdForMessage(message) {
  if (!hasRequestId(message)) return undefined;
  return isValidMcpRequestId(message.id) ? message.id : undefined;
}

function isInvalidRequestResponse(response) {
  return response?.error?.code === -32600;
}

function shouldWriteMcpResponse(message, response) {
  if (!response) return false;
  return hasRequestId(message) || isInvalidRequestResponse(response);
}

export async function handleMcpRequest(message, { runCli = runDesignAiCli } = {}) {
  const id = responseIdForMessage(message);
  const envelopeError = validateMcpRequestEnvelope(message);
  if (envelopeError) return errorResponse(id, -32600, envelopeError);

  const methodError = validateMcpRequestMethod(message);
  if (methodError) return errorResponse(id, -32600, methodError);

  const notificationError = validateMcpNotificationRequest(message);
  if (notificationError) return errorResponse(id, -32600, notificationError);

  const requestIdError = validateMcpRequestIdRequirement(message);
  if (requestIdError) return errorResponse(id, -32600, requestIdError);

  const { method, params } = message;

  if (method === "initialize") {
    const initializeParams = params === undefined ? {} : params;
    const paramsError = validateInitializeParams(initializeParams);
    if (paramsError) return errorResponse(id, -32602, paramsError);

    return successResponse(id, {
      protocolVersion: chooseProtocolVersion(initializeParams.protocolVersion),
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: "design-ai",
        version: readPackageVersion(),
      },
      instructions: SERVER_INSTRUCTIONS,
    });
  }

  if (isMcpNotificationMethod(method)) return null;
  if (method === "ping") {
    const paramsError = validateOptionalObjectParams(method, params);
    if (paramsError) return errorResponse(id, -32602, paramsError);
    return successResponse(id, {});
  }

  if (method === "tools/list") {
    const paramsError = validateOptionalObjectParams(method, params);
    if (paramsError) return errorResponse(id, -32602, paramsError);
    return successResponse(id, { tools: MCP_TOOLS });
  }

  if (method === "tools/call") {
    const paramsError = validateToolCallParams(params);
    if (paramsError) return errorResponse(id, -32602, paramsError);

    const name = params.name;
    const tool = MCP_TOOLS.find((item) => item.name === name);
    if (!tool) return errorResponse(id, -32602, `Unknown tool: ${name}`);

    const toolArguments = params.arguments === undefined ? {} : params.arguments;
    try {
      assertMcpToolInput(tool, toolArguments);
    } catch (validationError) {
      return errorResponse(id, -32602, validationError.message || String(validationError));
    }

    try {
      const result = await callMcpTool(name, toolArguments, runCli);
      return successResponse(id, result);
    } catch (error) {
      return successResponse(id, {
        content: [{ type: "text", text: error.message || String(error) }],
        isError: true,
      });
    }
  }

  if (method === "resources/list") {
    const paramsError = validateOptionalObjectParams(method, params);
    if (paramsError) return errorResponse(id, -32602, paramsError);
    return successResponse(id, { resources: [] });
  }
  if (method === "prompts/list") {
    const paramsError = validateOptionalObjectParams(method, params);
    if (paramsError) return errorResponse(id, -32602, paramsError);
    return successResponse(id, { prompts: [] });
  }

  return errorResponse(id, -32601, `Method not found: ${method}`);
}

export function startMcpStdioServer({ input = process.stdin, output = process.stdout, error = process.stderr } = {}) {
  const rl = createInterface({ input, crlfDelay: Infinity });

  rl.on("line", async (line) => {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch (parseError) {
      output.write(`${JSON.stringify(errorResponse(null, -32700, `Parse error: ${parseError.message}`))}\n`);
      return;
    }

    try {
      const response = await handleMcpRequest(message);
      if (shouldWriteMcpResponse(message, response)) {
        output.write(`${JSON.stringify(response)}\n`);
      }
    } catch (requestError) {
      const id = responseIdForMessage(message) ?? null;
      output.write(`${JSON.stringify(errorResponse(id, -32603, requestError.message || String(requestError)))}\n`);
    }
  });

  rl.on("error", (streamError) => {
    error.write(`design-ai MCP stdin error: ${streamError.message}\n`);
  });
}
