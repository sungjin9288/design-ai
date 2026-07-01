// Minimal stdio MCP server for exposing design-ai CLI workflows to Claude/Codex.

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import path from "node:path";

import { DESIGN_AI_HOME, PACKAGE_ROOT } from "./paths.mjs";

const PROTOCOL_VERSION = "2025-11-25";
const MAX_TOOL_OUTPUT_BYTES = 220_000;
const DESIGN_AI_BIN = path.join(PACKAGE_ROOT, "cli", "bin", "design-ai.mjs");

function optionalString(description = "") {
  return { type: "string", description };
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
    name: "design_ai_prompt",
    title: "Generate an agent prompt",
    description: "Generate a ready-to-use design-ai agent prompt from a brief. Read-only unless withLearning is true, which records local usage metadata.",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", minLength: 1, description: "Task brief." },
        routeId: optionalString("Optional forced route id, such as component-spec or website-improvement."),
        withLearning: optionalBoolean("Include local learning preferences and record local usage metadata."),
        learningCategory: optionalString("Optional learning category when withLearning is true."),
        learningLimit: optionalInteger({ description: "Maximum learning entries, 1-100.", minimum: 1, maximum: 100 }),
        json: optionalBoolean("Return machine-readable prompt plan JSON instead of Markdown."),
      },
      required: ["brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_pack",
    title: "Generate prompt plus bounded context",
    description: "Generate a prompt pack with relevant design-ai context files. Read-only unless withLearning is true, which records local usage metadata.",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", minLength: 1, description: "Task brief." },
        routeId: optionalString("Optional forced route id."),
        maxBytes: optionalInteger({ description: "Maximum context bytes to include.", minimum: 1000, maximum: 1_000_000 }),
        withLearning: optionalBoolean("Include local learning preferences and record local usage metadata."),
        learningCategory: optionalString("Optional learning category when withLearning is true."),
        learningLimit: optionalInteger({ description: "Maximum learning entries, 1-100.", minimum: 1, maximum: 100 }),
        json: optionalBoolean("Return machine-readable pack JSON instead of Markdown."),
      },
      required: ["brief"],
      additionalProperties: false,
    },
  },
  {
    name: "design_ai_search",
    title: "Search design-ai corpus",
    description: "Search knowledge, examples, skills, docs, agents, or commands. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, description: "Search query." },
        dir: optionalString("Optional corpus directory: knowledge, examples, skills, docs, agents, commands."),
        limit: optionalInteger({ description: "Maximum hits, 1-500.", minimum: 1, maximum: 500 }),
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
    if (schema.minLength && value.length < schema.minLength) {
      throw new Error(`${name} must be at least ${schema.minLength} characters`);
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

export function buildCliInvocation(toolName, input = {}) {
  const args = [];
  let stdin = "";

  if (toolName === "design_ai_route") {
    args.push("route", assertString(input.brief, "brief"), "--json");
    maybePush(args, "--limit", input.limit);
    maybeBool(args, "--explain", input.explain);
    return { args, stdin };
  }

  if (toolName === "design_ai_prompt") {
    args.push("prompt", assertString(input.brief, "brief"));
    maybePush(args, "--route", input.routeId);
    maybeBool(args, "--with-learning", input.withLearning);
    maybePush(args, "--learning-category", input.learningCategory);
    maybePush(args, "--learning-limit", input.learningLimit);
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
    maybeBool(args, "--json", input.json);
    return { args, stdin };
  }

  if (toolName === "design_ai_search") {
    args.push("search", assertString(input.query, "query"), "--json");
    maybePush(args, "--dir", input.dir);
    maybePush(args, "--limit", input.limit);
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

  const { method, params } = message;

  if (method === "initialize") {
    const initializeParams = params === undefined ? {} : params;
    if (!isObjectRecord(initializeParams)) {
      return errorResponse(id, -32602, "initialize params must be an object");
    }

    return successResponse(id, {
      protocolVersion: chooseProtocolVersion(initializeParams.protocolVersion),
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: "design-ai",
        version: readPackageVersion(),
      },
      instructions: "Use design-ai MCP tools for local, deterministic design expertise: route briefs, generate prompts/packs, search/show the design corpus, check Markdown artifacts, and validate Website Improvement MCP readiness. Prefer read-only tools unless the user explicitly asks to record local learning usage.",
    });
  }

  if (method === "notifications/initialized") return null;
  if (method === "ping") return successResponse(id, {});

  if (method === "tools/list") {
    return successResponse(id, { tools: MCP_TOOLS });
  }

  if (method === "tools/call") {
    const paramsError = validateToolCallParams(params);
    if (paramsError) return errorResponse(id, -32602, paramsError);

    const name = params.name;
    const tool = MCP_TOOLS.find((item) => item.name === name);
    if (!tool) return errorResponse(id, -32602, `Unknown tool: ${name}`);
    try {
      const result = await callMcpTool(name, params.arguments === undefined ? {} : params.arguments, runCli);
      return successResponse(id, result);
    } catch (error) {
      return successResponse(id, {
        content: [{ type: "text", text: error.message || String(error) }],
        isError: true,
      });
    }
  }

  if (method === "resources/list") return successResponse(id, { resources: [] });
  if (method === "prompts/list") return successResponse(id, { prompts: [] });

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
