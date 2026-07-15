import { once } from "node:events";
import { spawn } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MCP_TOOLS,
  buildCliInvocation,
  callMcpTool,
  handleMcpRequest,
} from "./mcp-server.mjs";
import { readCapabilityManifest } from "./capability-manifest.mjs";

const CAPABILITY_MANIFEST = readCapabilityManifest();

function startMcpSubprocess() {
  const child = spawn(process.execPath, ["cli/bin/design-ai-mcp.mjs"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
  });
  const responses = [];
  let stdoutBuffer = "";

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split("\n");
    stdoutBuffer = lines.pop() || "";
    for (const line of lines) {
      if (line.trim()) responses.push(JSON.parse(line));
    }
  });

  return { child, responses };
}

async function waitForMcpResponse(child, responses, predicate, timeoutMessage) {
  const started = Date.now();
  while (!responses.some(predicate)) {
    if (Date.now() - started > 5000) {
      child.kill();
      throw new Error(timeoutMessage);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function stopMcpSubprocess(child) {
  child.kill();
  await once(child, "close");
}

test("MCP tool list exposes design-ai read-only workflow tools", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  });

  assert.equal(response.jsonrpc, "2.0");
  assert.equal(response.id, 1);
  assert.deepEqual(
    response.result.tools.map((tool) => tool.name),
    MCP_TOOLS.map((tool) => tool.name),
  );
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_route"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_start"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_inspect_html"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_review_html"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_review_handoff"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_review_pack"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_artifact"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_site_mcp_check"));
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_site_linked_preview"));
});

test("MCP tool list has the exact ordered public inventory and three write tools", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  });

  const toolNames = response.result.tools.map((tool) => tool.name);
  assert.deepEqual(toolNames, CAPABILITY_MANIFEST.mcp.tools);
  assert.equal(new Set(toolNames).size, toolNames.length);
  assert.deepEqual(
    toolNames.filter((name) => name.startsWith("design_ai_learn_")),
    CAPABILITY_MANIFEST.mcp.learningProfileWriteTools,
  );
});

test("MCP tool input schemas are closed objects", () => {
  for (const tool of MCP_TOOLS) {
    const schema = tool.inputSchema;
    assert.equal(schema.type, "object", `${tool.name} should accept an object`);
    assert.equal(schema.additionalProperties, false, `${tool.name} should reject unknown arguments`);
    assert.ok(schema.properties && typeof schema.properties === "object");
    for (const required of schema.required || []) {
      assert.ok(Object.hasOwn(schema.properties, required), `${tool.name}.${required} should be declared`);
    }
  }
});

test("MCP write tool descriptions carry the local-learning-profile write-boundary marker", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  });

  const writeToolNames = CAPABILITY_MANIFEST.mcp.learningProfileWriteTools;
  for (const name of writeToolNames) {
    const tool = response.result.tools.find((item) => item.name === name);
    assert.ok(tool, `expected ${name} to be listed`);
    assert.match(tool.description, /Writes ONLY the local learning profile/);
  }
});

test("MCP initialize advertises tool capability and server instructions", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "init",
    method: "initialize",
    params: { protocolVersion: "2025-11-25" },
  });

  assert.equal(response.id, "init");
  assert.equal(response.result.protocolVersion, "2025-11-25");
  assert.deepEqual(response.result.capabilities, { tools: { listChanged: false } });
  assert.equal(response.result.serverInfo.name, "design-ai");
  assert.match(response.result.instructions, /route briefs/);
});

test("MCP initialize falls back to the supported protocol version", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "init",
    method: "initialize",
    params: { protocolVersion: "2099-01-01" },
  });

  assert.equal(response.result.protocolVersion, "2025-11-25");
});

test("MCP initialize validates request params", async () => {
  const nullParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "init-null",
    method: "initialize",
    params: null,
  });

  assert.equal(nullParams.error.code, -32602);
  assert.equal(nullParams.error.message, "initialize params must be an object");

  const arrayParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "init-array",
    method: "initialize",
    params: [],
  });

  assert.equal(arrayParams.error.code, -32602);
  assert.equal(arrayParams.error.message, "initialize params must be an object");

  const numericProtocolVersion = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "init-numeric-version",
    method: "initialize",
    params: { protocolVersion: 20251125 },
  });

  assert.equal(numericProtocolVersion.error.code, -32602);
  assert.equal(numericProtocolVersion.error.message, "initialize params.protocolVersion must be a string");

  const blankProtocolVersion = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "init-blank-version",
    method: "initialize",
    params: { protocolVersion: "   " },
  });

  assert.equal(blankProtocolVersion.error.code, -32602);
  assert.equal(blankProtocolVersion.error.message, "initialize params.protocolVersion must be a non-empty string");
});

test("MCP optional object params reject malformed containers", async () => {
  const pingWithObjectParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "ping-object",
    method: "ping",
    params: {},
  });
  assert.deepEqual(pingWithObjectParams.result, {});

  const listWithObjectParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "list-object",
    method: "tools/list",
    params: {},
  });
  assert.ok(listWithObjectParams.result.tools.some((tool) => tool.name === "design_ai_route"));

  const pingWithArrayParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "ping-array",
    method: "ping",
    params: [],
  });
  assert.equal(pingWithArrayParams.error.code, -32602);
  assert.equal(pingWithArrayParams.error.message, "ping params must be an object when provided");

  const listWithStringParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "list-string",
    method: "tools/list",
    params: "all",
  });
  assert.equal(listWithStringParams.error.code, -32602);
  assert.equal(listWithStringParams.error.message, "tools/list params must be an object when provided");

  const resourcesWithNullParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "resources-null",
    method: "resources/list",
    params: null,
  });
  assert.equal(resourcesWithNullParams.error.code, -32602);
  assert.equal(resourcesWithNullParams.error.message, "resources/list params must be an object when provided");

  const promptsWithBooleanParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: "prompts-boolean",
    method: "prompts/list",
    params: false,
  });
  assert.equal(promptsWithBooleanParams.error.code, -32602);
  assert.equal(promptsWithBooleanParams.error.message, "prompts/list params must be an object when provided");
});

test("buildCliInvocation maps subprocess-backed MCP tool args to existing CLI commands", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_artifact", {
      brief: "Plan a settings refactor",
      mode: "implementation-plan",
      routeId: "flow-design",
      json: true,
    }),
    {
      args: ["artifact", "implementation-plan", "Plan a settings refactor", "--route", "flow-design", "--json"],
      stdin: "",
    },
  );
  assert.deepEqual(
    buildCliInvocation("design_ai_check", { artifact: "# Spec\n\nKeyboard reachable.", routeId: "component-spec" }),
    {
      args: ["check", "--stdin", "--route", "component-spec", "--json"],
      stdin: "# Spec\n\nKeyboard reachable.",
    },
  );
  assert.throws(
    () => buildCliInvocation("design_ai_route", { brief: "Spec a Button" }),
    /Unknown MCP tool/,
  );
});

test("design_ai_artifact exposes a closed mode enum", () => {
  const tool = MCP_TOOLS.find((item) => item.name === "design_ai_artifact");
  assert.deepEqual(tool.inputSchema.properties.mode.enum, [
    "implementation-plan",
    "critique-loop",
    "design-contract",
  ]);
  assert.deepEqual(tool.inputSchema.required, ["brief", "mode"]);
});

test("design_ai_route uses the shared route operation without spawning the CLI", async () => {
  let runCliCalled = false;
  const result = await callMcpTool(
    "design_ai_route",
    { brief: "  Spec a Button component API  ", limit: 1, explain: true },
    async () => {
      runCliCalled = true;
      return { code: 0, stdout: "unexpected", stderr: "" };
    },
  );

  const payload = JSON.parse(result.content[0].text);
  assert.equal(runCliCalled, false);
  assert.equal(result.isError, false);
  assert.equal(payload.brief, "Spec a Button component API");
  assert.equal(payload.routes[0].id, "component-spec");
  assert.ok(payload.routes[0].explanation);
});

test("design_ai_start uses the shared start operation without spawning the CLI", async () => {
  let runCliCalled = false;
  const result = await callMcpTool(
    "design_ai_start",
    {
      brief: "Review a Korean settings flow",
      routeId: "design-engineering-review",
      url: "https://example.com/settings",
      locale: "ko-KR",
      viewports: ["mobile"],
    },
    async () => {
      runCliCalled = true;
      return { code: 0, stdout: "unexpected", stderr: "" };
    },
  );

  const payload = JSON.parse(result.content[0].text);
  assert.equal(runCliCalled, false);
  assert.equal(result.isError, false);
  assert.equal(payload.kind, "design-ai-start");
  assert.equal(payload.route.id, "design-engineering-review");
  assert.equal(payload.designContract.route.id, payload.route.id);
  assert.deepEqual(payload.effects.performed.externalActions, []);
});

test("design_ai_inspect_html uses the shared read-only inspector without spawning the CLI", async () => {
  let runCliCalled = false;
  const result = await callMcpTool(
    "design_ai_inspect_html",
    {
      source: `<html lang="ko"><head><meta name="viewport" content="width=device-width"></head><body><input name="phone"></body></html>`,
      sourceRef: "settings.html",
      brief: "Review a Korean settings flow",
      locale: "ko-KR",
      viewports: ["mobile", "desktop"],
    },
    async () => {
      runCliCalled = true;
      return { code: 0, stdout: "unexpected", stderr: "" };
    },
  );

  const payload = JSON.parse(result.content[0].text);
  assert.equal(runCliCalled, false);
  assert.equal(result.isError, false);
  assert.equal(payload.kind, "design-ai-quality-report");
  assert.equal(payload.summary.confirmedFindings, 1);
  assert.equal(payload.summary.unverifiedFindings, 1);
  assert.equal(payload.boundary.targetRepoMutation, false);
});

test("design_ai_review_html composes the shared workflow without spawning the CLI", async () => {
  let runCliCalled = false;
  const result = await callMcpTool(
    "design_ai_review_html",
    {
      source: "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile", "desktop"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
    async () => {
      runCliCalled = true;
      return { code: 0, stdout: "unexpected", stderr: "" };
    },
  );

  const payload = JSON.parse(result.content[0].text);
  assert.equal(runCliCalled, false);
  assert.equal(result.isError, false);
  assert.equal(payload.kind, "design-ai-review-workflow");
  assert.equal(payload.linkage.status, "pass");
  assert.equal(payload.boundary.localWrites, false);
});

test("design_ai_review_handoff prepares an undelivered transfer without spawning the CLI", async () => {
  const reviewResult = await callMcpTool(
    "design_ai_review_html",
    {
      source: "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
    async () => ({ code: 0, stdout: "unexpected", stderr: "" }),
  );
  let runCliCalled = false;
  const result = await callMcpTool(
    "design_ai_review_handoff",
    {
      workflowSource: reviewResult.content[0].text,
      workflowRef: "review-workflow.json",
      recipient: "codex",
    },
    async () => {
      runCliCalled = true;
      return { code: 0, stdout: "unexpected", stderr: "" };
    },
  );

  const payload = JSON.parse(result.content[0].text);
  assert.equal(runCliCalled, false);
  assert.equal(result.isError, false);
  assert.equal(payload.kind, "design-ai-review-handoff");
  assert.equal(payload.recipient.delivery, "not-delivered");
  assert.equal(payload.boundary.targetRepoMutation, false);
});

test("design_ai_verify_review_handoff emits a bounded receipt without spawning the CLI", async () => {
  const reviewResult = await callMcpTool(
    "design_ai_review_html",
    {
      source: "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
    async () => ({ code: 0, stdout: "unexpected", stderr: "" }),
  );
  const handoffResult = await callMcpTool(
    "design_ai_review_handoff",
    {
      workflowSource: reviewResult.content[0].text,
      workflowRef: "review-workflow.json",
      recipient: "codex",
    },
    async () => ({ code: 0, stdout: "unexpected", stderr: "" }),
  );
  let runCliCalled = false;
  const receiptResult = await callMcpTool(
    "design_ai_verify_review_handoff",
    {
      handoffSource: handoffResult.content[0].text,
      handoffRef: "review-handoff.json",
      consumer: "codex",
    },
    async () => {
      runCliCalled = true;
      return { code: 0, stdout: "unexpected", stderr: "" };
    },
  );
  const receipt = JSON.parse(receiptResult.content[0].text);

  assert.equal(runCliCalled, false);
  assert.equal(receipt.kind, "design-ai-review-handoff-receipt");
  assert.equal(receipt.consumer.contractValidation, "pass");
  assert.equal(receipt.boundary.consumerIdentityVerified, false);
});

test("design_ai_review_pack lists and reads shipped contracts without spawning the CLI", async () => {
  let runCliCalled = false;
  const listResult = await callMcpTool("design_ai_review_pack", {}, async () => {
    runCliCalled = true;
    return { code: 0, stdout: "unexpected", stderr: "" };
  });
  const packResult = await callMcpTool("design_ai_review_pack", { id: "korean-saas" }, async () => {
    runCliCalled = true;
    return { code: 0, stdout: "unexpected", stderr: "" };
  });
  const list = JSON.parse(listResult.content[0].text);
  const pack = JSON.parse(packResult.content[0].text);

  assert.equal(runCliCalled, false);
  assert.equal(list.packs.length, 5);
  assert.equal(pack.id, "korean-saas");
  assert.equal(pack.boundary.targetRepoMutation, false);
});

test("design_ai_inspect_html returns valid structured JSON when its report exceeds the MCP limit", async () => {
  const controls = Array.from({ length: 225 }, () => "<input>").join("");
  const result = await callMcpTool("design_ai_inspect_html", {
    source: `<html lang="en"><head><meta name="viewport" content="width=device-width"></head><body>${controls}</body></html>`,
    sourceRef: "large-form.html",
    brief: "Review a large form",
    generatedAt: "2026-07-14T00:00:00.000Z",
  });
  const payload = JSON.parse(result.content[0].text);

  assert.equal(result.isError, true);
  assert.equal(payload.kind, "design-ai-mcp-error");
  assert.equal(payload.code, "OUTPUT_TOO_LARGE");
  assert.ok(payload.actualBytes > payload.limitBytes);
});

test("buildCliInvocation maps design_ai_search ranked to the --ranked CLI flag", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_search", { query: "Pretendard", ranked: true }),
    { args: ["search", "Pretendard", "--json", "--ranked"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_search", { query: "Pretendard", ranked: false }),
    { args: ["search", "Pretendard", "--json"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_search", { query: "Pretendard" }),
    { args: ["search", "Pretendard", "--json"], stdin: "" },
  );
});

test("buildCliInvocation maps approval-gated Website Improvement bundle handoff", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_site_bundle_handoff", {
      bundleDir: "/tmp/website-handoff-bundle",
      taskSelector: "task-homepage-cta",
    }),
    {
      args: [
        "site",
        "/tmp/website-handoff-bundle",
        "--bundle-handoff",
        "--task",
        "task-homepage-cta",
        "--strict",
        "--json",
      ],
      stdin: "",
    },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_site_bundle_handoff", {
      bundleDir: "/tmp/website-handoff-bundle",
      strict: false,
    }),
    {
      args: ["site", "/tmp/website-handoff-bundle", "--bundle-handoff", "--strict", "--json"],
      stdin: "",
    },
  );

  const handoffTool = MCP_TOOLS.find((tool) => tool.name === "design_ai_site_bundle_handoff");
  assert.equal(Object.hasOwn(handoffTool.inputSchema.properties, "strict"), false);
});

test("buildCliInvocation maps read-only Website Improvement linked preview", () => {
  const workspaceJson = JSON.stringify({ siteProfile: { localPath: "/tmp/site" } });
  assert.deepEqual(
    buildCliInvocation("design_ai_site_linked_preview", {
      workspaceJson,
      strict: true,
    }),
    {
      args: ["site", "--stdin", "--linked-preview", "--strict", "--json"],
      stdin: workspaceJson,
    },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_site_linked_preview", {
      workspaceJson,
      json: false,
    }),
    {
      args: ["site", "--stdin", "--linked-preview"],
      stdin: workspaceJson,
    },
  );
});

test("buildCliInvocation maps design_ai_prompt withRecall and recallLimit to CLI flags", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_prompt", { brief: "Spec a Button", withRecall: true, recallLimit: 3 }),
    { args: ["prompt", "Spec a Button", "--with-recall", "--recall-limit", "3"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_prompt", { brief: "Spec a Button", withRecall: true }),
    { args: ["prompt", "Spec a Button", "--with-recall"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_prompt", { brief: "Spec a Button", withRecall: false }),
    { args: ["prompt", "Spec a Button"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_prompt", { brief: "Spec a Button" }),
    { args: ["prompt", "Spec a Button"], stdin: "" },
  );
});

test("buildCliInvocation maps design_ai_pack withRecall and recallLimit to CLI flags", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_pack", { brief: "Spec a Button", withRecall: true, recallLimit: 7 }),
    { args: ["pack", "Spec a Button", "--with-recall", "--recall-limit", "7"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_pack", { brief: "Spec a Button", withRecall: true }),
    { args: ["pack", "Spec a Button", "--with-recall"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_pack", { brief: "Spec a Button", withRecall: false }),
    { args: ["pack", "Spec a Button"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_pack", { brief: "Spec a Button" }),
    { args: ["pack", "Spec a Button"], stdin: "" },
  );
});

test("buildCliInvocation maps design_ai_recall to learn --recall", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_recall", { query: "접근성 버튼", limit: 3, category: "accessibility" }),
    { args: ["learn", "--recall", "접근성 버튼", "--json", "--limit", "3", "--category", "accessibility"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_recall", { query: "접근성 버튼", limit: 3 }),
    { args: ["learn", "--recall", "접근성 버튼", "--json", "--limit", "3"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_recall", { query: "접근성 버튼", category: "accessibility" }),
    { args: ["learn", "--recall", "접근성 버튼", "--json", "--category", "accessibility"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_recall", { query: "접근성 버튼" }),
    { args: ["learn", "--recall", "접근성 버튼", "--json"], stdin: "" },
  );
});

test("buildCliInvocation maps design_ai_learn_remember to learn --remember", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_learn_remember", { text: "Use 44px touch targets", category: "accessibility" }),
    { args: ["learn", "--remember", "Use 44px touch targets", "--json", "--category", "accessibility"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_learn_remember", { text: "Use 44px touch targets" }),
    { args: ["learn", "--remember", "Use 44px touch targets", "--json"], stdin: "" },
  );
});

test("buildCliInvocation maps design_ai_learn_feedback to learn --feedback", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_learn_feedback", { text: "Loved the contrast callouts", outcome: "keep", category: "workflow" }),
    { args: ["learn", "--feedback", "Loved the contrast callouts", "--json", "--outcome", "keep", "--category", "workflow"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_learn_feedback", { text: "Loved the contrast callouts", outcome: "keep" }),
    { args: ["learn", "--feedback", "Loved the contrast callouts", "--json", "--outcome", "keep"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_learn_feedback", { text: "Loved the contrast callouts", category: "workflow" }),
    { args: ["learn", "--feedback", "Loved the contrast callouts", "--json", "--category", "workflow"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_learn_feedback", { text: "Loved the contrast callouts" }),
    { args: ["learn", "--feedback", "Loved the contrast callouts", "--json"], stdin: "" },
  );
});

test("buildCliInvocation maps design_ai_learn_capture to check --stdin --learn --yes", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_learn_capture", { content: "# Spec\n\nA button.", route: "component-spec" }),
    { args: ["check", "--stdin", "--learn", "--yes", "--json", "--route", "component-spec"], stdin: "# Spec\n\nA button." },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_learn_capture", { content: "# Spec\n\nA button." }),
    { args: ["check", "--stdin", "--learn", "--yes", "--json"], stdin: "# Spec\n\nA button." },
  );
});

test("tools/call returns recall-augmented prompt output from injected runner when withRecall is true", async () => {
  const calls = [];
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "design_ai_prompt",
      arguments: { brief: "Spec a Button", withRecall: true, recallLimit: 2 },
    },
  }, {
    runCli: async (args, opts) => {
      calls.push({ args, opts });
      return { code: 0, stdout: "# Prompt\n\nRecall augmented.\n", stderr: "" };
    },
  });

  assert.deepEqual(calls, [{
    args: ["prompt", "Spec a Button", "--with-recall", "--recall-limit", "2"],
    opts: { stdin: "" },
  }]);
  assert.equal(response.result.isError, false);
  assert.equal(response.result.content[0].type, "text");
  assert.equal(response.result.content[0].text, "# Prompt\n\nRecall augmented.");
});

test("tools/call returns CLI output from injected runner", async () => {
  const calls = [];
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "design_ai_search",
      arguments: { query: "Pretendard", dir: "knowledge", limit: 1 },
    },
  }, {
    runCli: async (args, opts) => {
      calls.push({ args, opts });
      return { code: 0, stdout: "{\"hits\":[]}\n", stderr: "" };
    },
  });

  assert.deepEqual(calls, [{
    args: ["search", "Pretendard", "--json", "--dir", "knowledge", "--limit", "1"],
    opts: { stdin: "" },
  }]);
  assert.equal(response.result.isError, false);
  assert.equal(response.result.content[0].type, "text");
  assert.equal(response.result.content[0].text, "{\"hits\":[]}");
});

test("tools/call returns ranked CLI output from injected runner when ranked is true", async () => {
  const calls = [];
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "design_ai_search",
      arguments: { query: "Pretendard", dir: "knowledge", limit: 1, ranked: true },
    },
  }, {
    runCli: async (args, opts) => {
      calls.push({ args, opts });
      return { code: 0, stdout: "{\"query\":\"Pretendard\",\"ranked\":true,\"hits\":[]}\n", stderr: "" };
    },
  });

  assert.deepEqual(calls, [{
    args: ["search", "Pretendard", "--json", "--dir", "knowledge", "--limit", "1", "--ranked"],
    opts: { stdin: "" },
  }]);
  assert.equal(response.result.isError, false);
  assert.equal(response.result.content[0].type, "text");
  assert.equal(response.result.content[0].text, "{\"query\":\"Pretendard\",\"ranked\":true,\"hits\":[]}");
});

test("tools/call returns recall output from injected runner for design_ai_recall", async () => {
  const calls = [];
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "design_ai_recall",
      arguments: { query: "접근성 버튼", limit: 3, category: "accessibility" },
    },
  }, {
    runCli: async (args, opts) => {
      calls.push({ args, opts });
      return { code: 0, stdout: "{\"query\":\"접근성 버튼\",\"corpus\":{},\"learning\":{}}\n", stderr: "" };
    },
  });

  assert.deepEqual(calls, [{
    args: ["learn", "--recall", "접근성 버튼", "--json", "--limit", "3", "--category", "accessibility"],
    opts: { stdin: "" },
  }]);
  assert.equal(response.result.isError, false);
  assert.equal(response.result.content[0].type, "text");
  assert.equal(response.result.content[0].text, "{\"query\":\"접근성 버튼\",\"corpus\":{},\"learning\":{}}");
});

test("tools/call reports CLI failures without failing JSON-RPC", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "design_ai_search",
      arguments: { query: "Pretendard" },
    },
  }, {
    runCli: async () => ({ code: 2, stdout: "", stderr: "search failed\n" }),
  });

  assert.equal(response.error, undefined);
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /\[stderr\]\nsearch failed/);
});

test("tools/call rejects unknown tools before running the CLI", async () => {
  let cliWasCalled = false;
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 30,
    method: "tools/call",
    params: {
      name: "design_ai_missing",
      arguments: {},
    },
  }, {
    runCli: async () => {
      cliWasCalled = true;
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(cliWasCalled, false);
  assert.equal(response.error.code, -32602);
  assert.equal(response.error.message, "Unknown tool: design_ai_missing");
});

test("MCP response methods require request ids", async () => {
  for (const method of ["initialize", "ping", "tools/list", "resources/list", "prompts/list"]) {
    const response = await handleMcpRequest({
      jsonrpc: "2.0",
      method,
    });

    assert.equal(response.id, null);
    assert.equal(response.error.code, -32600);
    assert.equal(response.error.message, `Invalid MCP request: ${method} must include id`);
  }

  let cliWasCalled = false;
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "design_ai_version",
      arguments: {},
    },
  }, {
    runCli: async () => {
      cliWasCalled = true;
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(cliWasCalled, false);
  assert.equal(response.id, null);
  assert.equal(response.error.code, -32600);
  assert.equal(response.error.message, "Invalid MCP request: tools/call must include id");
});

test("tools/call rejects invalid MCP arguments before running the CLI", async () => {
  let cliWasCalled = false;
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "design_ai_route",
      arguments: { brief: "Spec a Button", unexpected: true },
    },
  }, {
    runCli: async () => {
      cliWasCalled = true;
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(cliWasCalled, false);
  assert.equal(response.error.code, -32602);
  assert.equal(response.error.message, "Unknown argument for design_ai_route: unexpected");
});

test("tools/call validates MCP argument types before running the CLI", async () => {
  let cliWasCalled = false;
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "design_ai_search",
      arguments: { query: "Pretendard", limit: "10" },
    },
  }, {
    runCli: async () => {
      cliWasCalled = true;
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(cliWasCalled, false);
  assert.equal(response.error.code, -32602);
  assert.equal(response.error.message, "design_ai_search.limit must be an integer");
});

test("tools/call rejects blank required string arguments before running the CLI", async () => {
  let cliWasCalled = false;
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "design_ai_route",
      arguments: { brief: "   " },
    },
  }, {
    runCli: async () => {
      cliWasCalled = true;
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(cliWasCalled, false);
  assert.equal(response.error.code, -32602);
  assert.equal(response.error.message, "design_ai_route.brief must be a non-empty string");
});

test("malformed MCP requests return protocol errors", async () => {
  const missingJsonrpc = await handleMcpRequest({
    id: 3103,
    method: "tools/list",
  });
  assert.equal(missingJsonrpc.error.code, -32600);
  assert.equal(missingJsonrpc.error.message, 'Invalid MCP request: jsonrpc must be "2.0"');

  const wrongJsonrpc = await handleMcpRequest({
    jsonrpc: "1.0",
    id: 3104,
    method: "tools/list",
  });
  assert.equal(wrongJsonrpc.error.code, -32600);
  assert.equal(wrongJsonrpc.error.message, 'Invalid MCP request: jsonrpc must be "2.0"');

  const objectId = await handleMcpRequest({
    jsonrpc: "2.0",
    id: { request: 3105 },
    method: "tools/list",
  });
  assert.equal(objectId.id, null);
  assert.equal(objectId.error.code, -32600);
  assert.equal(objectId.error.message, "Invalid MCP request: id must be a string, number, or null");

  const arrayId = await handleMcpRequest({
    jsonrpc: "2.0",
    id: [3106],
    method: "tools/list",
  });
  assert.equal(arrayId.id, null);
  assert.equal(arrayId.error.code, -32600);
  assert.equal(arrayId.error.message, "Invalid MCP request: id must be a string, number, or null");

  const booleanId = await handleMcpRequest({
    jsonrpc: "2.0",
    id: true,
    method: "tools/list",
  });
  assert.equal(booleanId.id, null);
  assert.equal(booleanId.error.code, -32600);
  assert.equal(booleanId.error.message, "Invalid MCP request: id must be a string, number, or null");

  const nullId = await handleMcpRequest({
    jsonrpc: "2.0",
    id: null,
    method: "tools/list",
  });
  assert.equal(nullId.id, null);
  assert.ok(nullId.result.tools.some((tool) => tool.name === "design_ai_route"));

  const missingMethod = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 31,
  });
  assert.equal(missingMethod.error.code, -32600);
  assert.match(missingMethod.error.message, /missing method/);

  const numericMethod = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 3101,
    method: 42,
  });
  assert.equal(numericMethod.error.code, -32600);
  assert.equal(numericMethod.error.message, "Invalid MCP request: method must be a non-empty string");

  const emptyMethod = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 3102,
    method: "",
  });
  assert.equal(emptyMethod.error.code, -32600);
  assert.equal(emptyMethod.error.message, "Invalid MCP request: method must be a non-empty string");

  const initializedWithId = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 3107,
    method: "notifications/initialized",
  });
  assert.equal(initializedWithId.id, 3107);
  assert.equal(initializedWithId.error.code, -32600);
  assert.equal(initializedWithId.error.message, "Invalid MCP request: notifications/initialized must not include id");

  const initializedNotification = await handleMcpRequest({
    jsonrpc: "2.0",
    method: "notifications/initialized",
  });
  assert.equal(initializedNotification, null);

  const progressWithId = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 3108,
    method: "notifications/progress",
    params: { progressToken: "route", progress: 0.5 },
  });
  assert.equal(progressWithId.id, 3108);
  assert.equal(progressWithId.error.code, -32600);
  assert.equal(progressWithId.error.message, "Invalid MCP request: notifications/progress must not include id");

  const progressNotification = await handleMcpRequest({
    jsonrpc: "2.0",
    method: "notifications/progress",
    params: { progressToken: "route", progress: 0.5 },
  });
  assert.equal(progressNotification, null);

  const unknownMethod = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 32,
    method: "resources/read",
  });
  assert.equal(unknownMethod.error.code, -32601);
  assert.equal(unknownMethod.error.message, "Method not found: resources/read");
});

test("tools/call validates request params before tool lookup", async () => {
  const missingParams = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 33,
    method: "tools/call",
    params: null,
  });

  assert.equal(missingParams.error.code, -32602);
  assert.equal(missingParams.error.message, "tools/call params must be an object");

  const missingName = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 34,
    method: "tools/call",
    params: { arguments: {} },
  });

  assert.equal(missingName.error.code, -32602);
  assert.equal(missingName.error.message, "tools/call params.name must be a non-empty string");

  const nullArguments = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 35,
    method: "tools/call",
    params: { name: "design_ai_version", arguments: null },
  });

  assert.equal(nullArguments.error.code, -32602);
  assert.equal(nullArguments.error.message, "tools/call params.arguments must be an object when provided");

  const arrayArguments = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 36,
    method: "tools/call",
    params: { name: "design_ai_version", arguments: [] },
  });

  assert.equal(arrayArguments.error.code, -32602);
  assert.equal(arrayArguments.error.message, "tools/call params.arguments must be an object when provided");
});

test("MCP tool output is truncated before returning to clients", async () => {
  const result = await callMcpTool("design_ai_version", {}, async () => ({
    code: 0,
    stdout: `${"x".repeat(230_000)}\n`,
    stderr: "",
  }));

  assert.equal(result.isError, false);
  assert.ok(Buffer.byteLength(result.content[0].text, "utf8") < 221_000);
  assert.match(result.content[0].text, /output truncated at 220000 bytes from 230000 bytes/);
});

test("design-ai MCP stdio subprocess reports JSON parse errors", async () => {
  const { child, responses } = startMcpSubprocess();

  child.stdin.write("{bad json\n");

  await waitForMcpResponse(
    child,
    responses,
    () => true,
    "Timed out waiting for MCP parse error response",
  );
  await stopMcpSubprocess(child);

  assert.equal(responses[0].error.code, -32700);
  assert.match(responses[0].error.message, /Parse error/);
});

test("design-ai MCP stdio subprocess reports invalid requests and preserves valid notifications", async () => {
  const { child, responses } = startMcpSubprocess();

  child.stdin.write("{}\n");
  child.stdin.write("[]\n");
  child.stdin.write("null\n");
  child.stdin.write(`${JSON.stringify({ method: "tools/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "1.0", method: "tools/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: { request: 1 }, method: "tools/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: [1], method: "tools/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: true, method: "tools/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: 42 })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "initialize", params: {} })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "ping" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "tools/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "tools/call", params: { name: "design_ai_version", arguments: {} } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "resources/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "prompts/list" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 99, method: "notifications/initialized" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 100, method: "notifications/progress" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/progress" })}\n`);

  await waitForMcpResponse(
    child,
    responses,
    () => responses.length === 18,
    `Timed out waiting for invalid request responses. Responses: ${JSON.stringify(responses)}`,
  );
  await stopMcpSubprocess(child);

  assert.deepEqual(
    responses.map((response) => response.error.code),
    [-32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600, -32600],
  );
  assert.deepEqual(
    responses.map((response) => response.id),
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 99, 100],
  );
});

test("design-ai MCP stdio subprocess handles initialize, list, and route call", async () => {
  const { child, responses } = startMcpSubprocess();

  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25" } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" })}\n`);
  child.stdin.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "design_ai_route",
      arguments: { brief: "Spec a Button component API", limit: 1 },
    },
  })}\n`);

  await waitForMcpResponse(
    child,
    responses,
    (response) => response.id === 3,
    `Timed out waiting for MCP route response. Responses: ${JSON.stringify(responses)}`,
  );
  await stopMcpSubprocess(child);

  const init = responses.find((response) => response.id === 1);
  const list = responses.find((response) => response.id === 2);
  const route = responses.find((response) => response.id === 3);

  assert.equal(init.result.serverInfo.name, "design-ai");
  assert.ok(list.result.tools.some((tool) => tool.name === "design_ai_route"));
  assert.equal(route.result.isError, false);
  assert.match(route.result.content[0].text, /"id": "component-spec"/);
});
