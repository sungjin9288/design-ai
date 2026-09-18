import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createImageConsoleServer, isJsonRequestContentType, isSafeImageConsoleRequest } from "./image-console-server.mjs";
import { parseImageArgs } from "../commands/image.mjs";
import { createImageWorkflow } from "./image-workflow.mjs";
import { createImageAssetStore } from "./image-asset-manifest.mjs";
import { createPromptGuideConfig, PromptGuideClient, PromptGuideConfigurationError, PromptGuideUnavailableError } from "./prompt-guide-client.mjs";

async function startOrSkip(t, gateway) {
  try { return await gateway.start(); }
  catch (error) {
    if (error?.code === "EPERM") { t.skip("loopback binding is unavailable in this sandbox; run the HTTP smoke where loopback sockets are permitted"); return null; }
    throw error;
  }
}
function requestStatus(url, headers) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(url, { headers }, (response) => { response.resume(); response.on("end", () => resolve(response.statusCode)); });
    request.on("error", reject); request.end();
  });
}

test("loopback request gate rejects DNS rebinding, cross-origin, wrong-port, and simple POST content types", () => {
  assert.equal(isSafeImageConsoleRequest({ host: "127.0.0.1:4318" }, 4318), true);
  assert.equal(isSafeImageConsoleRequest({ host: "localhost:4318", origin: "http://localhost:4318" }, 4318), true);
  assert.equal(isSafeImageConsoleRequest({ host: "evil.example:4318" }, 4318), false);
  assert.equal(isSafeImageConsoleRequest({ host: "127.0.0.1:4318", origin: "https://evil.example" }, 4318), false);
  assert.equal(isSafeImageConsoleRequest({ host: "127.0.0.1:9999" }, 4318), false);
  assert.equal(isJsonRequestContentType("application/json; charset=utf-8"), true);
  assert.equal(isJsonRequestContentType("text/plain"), false);
});
test("image serve parser rejects unknown, extra, duplicate, missing, and invalid options", () => {
  assert.deepEqual(parseImageArgs(["serve", "--host", "::1", "--port", "4319"]), { help: false, host: "::1", port: 4319 });
  assert.deepEqual(parseImageArgs(["serve", "--help"]), { help: true });
  assert.throws(() => parseImageArgs(["serve", "--prot", "4319"]), /Unknown/);
  assert.throws(() => parseImageArgs(["serve", "extra"]), /Unknown/);
  assert.throws(() => parseImageArgs(["serve", "--port", "4318", "--port", "4319"]), /only once/);
  assert.throws(() => parseImageArgs(["serve", "--host"]), /requires a value/);
  assert.throws(() => parseImageArgs(["serve", "--port", "0"]), /integer between/);
});

test("loopback gateway serves same-origin assets and rejects public binds", async (t) => {
  assert.throws(() => createImageConsoleServer({ host: "0.0.0.0" }), PromptGuideConfigurationError);
  const client = { getCatalogSummary: async () => ({ catalogVersion: "v1" }), recommend: async () => ({}), validate: async () => ({}) };
  const workflow = { listAssets: async () => [], getAsset: async () => null, getJob: () => null };
  const gateway = createImageConsoleServer({ client, workflow, host: "127.0.0.1" }); const address = await startOrSkip(t, gateway); if (!address) return;
  try {
    const base = `http://127.0.0.1:${address.port}`; const healthResponse = await fetch(`${base}/health`); const health = await healthResponse.json(); const app = await fetch(`${base}/app.js`).then((response) => response.text()); assert.equal(health.bind, "loopback"); assert.equal(app.includes("Authorization"), false);
    assert.equal(healthResponse.headers.get("x-frame-options"), "DENY"); assert.match(healthResponse.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    assert.equal(await requestStatus(`${base}/health`, { host: `evil.example:${address.port}` }), 403);
    assert.equal((await fetch(`${base}/api/image/compose`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: "{}" })).status, 403);
    assert.equal((await fetch(`${base}/api/image/compose`, { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" })).status, 415);
  }
  finally { await gateway.stop(); }
});
test("server rejects mock production before listening", () => { assert.throws(() => createImageConsoleServer({ client: {}, workflow: {}, env: { PROMPT_GUIDE_MODE: "mock", NODE_ENV: "production" } }), PromptGuideConfigurationError); });
test("draft-only mock startup defers provider configuration until approved execution", async () => {
  const gateway = createImageConsoleServer({ env: { PROMPT_GUIDE_MODE: "mock", PROMPT_GUIDE_TIMEOUT_MS: "100" } });
  const draft = await gateway.workflow.composeDraft({ taskType: "generation", domain: "manufacturing", outputType: "architecture", intent: "diagram", language: "ko" });
  assert.equal(draft.executable, true);
  await assert.rejects(() => gateway.workflow.executeDraft(draft.draftId, { approved: true }), /IMAGE_PROVIDER_COMMAND/);
});
test("missing provider configuration returns an actionable non-secret gateway error", async (t) => {
  const gateway = createImageConsoleServer({ env: { PROMPT_GUIDE_MODE: "mock", PROMPT_GUIDE_TIMEOUT_MS: "100" } }); const address = await startOrSkip(t, gateway); if (!address) return;
  try {
    const base = `http://127.0.0.1:${address.port}`; const headers = { "content-type": "application/json" };
    const draft = await fetch(`${base}/api/image/compose`, { method: "POST", headers, body: JSON.stringify({ taskType: "generation", domain: "manufacturing", outputType: "architecture", intent: "diagram", language: "ko" }) }).then((response) => response.json());
    const response = await fetch(`${base}/api/image/jobs`, { method: "POST", headers, body: JSON.stringify({ draftId: draft.draftId, approved: true }) }); const payload = await response.json();
    assert.equal(response.status, 503); assert.deepEqual(payload.error, { type: "ImageProviderConfigurationError", message: "Image provider execution is not configured" });
  } finally { await gateway.stop(); }
});
test("local mock gateway smoke makes zero external Prompt Guide requests", async (t) => {
  let external = 0; const config = createPromptGuideConfig({ PROMPT_GUIDE_MODE: "mock", PROMPT_GUIDE_TIMEOUT_MS: "100" }); const client = new PromptGuideClient({ config, fetchImpl: async () => { external += 1; throw new Error("external"); } });
  const workflow = createImageWorkflow({ client, provider: { command: "fake", args: [] }, assetStore: createImageAssetStore({ root: await mkdtemp(path.join(tmpdir(), "console-mock-")) }) }); const gateway = createImageConsoleServer({ client, workflow }); const address = await startOrSkip(t, gateway); if (!address) return;
  try { const result = await fetch(`http://127.0.0.1:${address.port}/api/image/compose`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ taskType: "generation", domain: "manufacturing", outputType: "architecture", intent: "diagram", language: "ko" }) }); assert.equal(result.status, 201); assert.equal(external, 0); }
  finally { await gateway.stop(); }
});
test("Prompt Guide failure at compose starts zero provider jobs", async (t) => {
  let executeCalls = 0; const workflow = { composeDraft: async () => { throw new PromptGuideUnavailableError("Prompt Guide unavailable"); }, executeDraft: async () => { executeCalls += 1; }, listAssets: async () => [], getAsset: async () => null, getJob: () => null };
  const gateway = createImageConsoleServer({ client: { getCatalogSummary: async () => ({}) }, workflow, host: "127.0.0.1" }); const address = await startOrSkip(t, gateway); if (!address) return;
  try { const response = await fetch(`http://127.0.0.1:${address.port}/api/image/compose`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); assert.equal(response.status, 503); assert.equal(executeCalls, 0); }
  finally { await gateway.stop(); }
});
