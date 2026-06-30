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
  assert.ok(response.result.tools.some((tool) => tool.name === "design_ai_site_mcp_check"));
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

test("buildCliInvocation maps MCP tool args to existing CLI commands", () => {
  assert.deepEqual(
    buildCliInvocation("design_ai_route", { brief: "Spec a Button", limit: 1, explain: true }),
    { args: ["route", "Spec a Button", "--json", "--limit", "1", "--explain"], stdin: "" },
  );

  assert.deepEqual(
    buildCliInvocation("design_ai_check", { artifact: "# Spec\n\nKeyboard reachable.", routeId: "component-spec" }),
    {
      args: ["check", "--stdin", "--route", "component-spec", "--json"],
      stdin: "# Spec\n\nKeyboard reachable.",
    },
  );
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

test("design-ai MCP stdio subprocess handles initialize, list, and route call", async () => {
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

  const started = Date.now();
  while (!responses.some((response) => response.id === 3)) {
    if (Date.now() - started > 5000) {
      child.kill();
      throw new Error(`Timed out waiting for MCP route response. Responses: ${JSON.stringify(responses)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  child.kill();
  await once(child, "close");

  const init = responses.find((response) => response.id === 1);
  const list = responses.find((response) => response.id === 2);
  const route = responses.find((response) => response.id === 3);

  assert.equal(init.result.serverInfo.name, "design-ai");
  assert.ok(list.result.tools.some((tool) => tool.name === "design_ai_route"));
  assert.equal(route.result.isError, false);
  assert.match(route.result.content[0].text, /"id": "component-spec"/);
});
