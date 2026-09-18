import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPromptGuideConfig,
  PromptGuideAuthenticationError,
  PromptGuideClient,
  PromptGuideContractError,
  PromptGuideRateLimitError,
  PromptGuideTimeoutError,
  PromptGuideUnavailableError,
  PromptGuideValidationError,
} from "./prompt-guide-client.mjs";
import { PROMPT_GUIDE_RESPONSE_VERSION, PROMPT_GUIDE_SOURCE_REPOSITORY, PROMPT_GUIDE_UPSTREAM_COMMIT } from "./image-prompt-contract.mjs";

const provenance = { sourceRepository: PROMPT_GUIDE_SOURCE_REPOSITORY, upstreamCommit: PROMPT_GUIDE_UPSTREAM_COMMIT, catalogVersion: "2026.08", overlayVersions: {} };
const request = { taskType: "generation", domain: "manufacturing", outputType: "architecture", intent: "diagram", language: "ko", exactTexts: [], styles: [], scenes: [], constraints: [], negativeConstraints: [], preserve: [], modify: [], remove: [], add: [], mustNotChange: [], referenceAssetIds: [], metadata: {} };
const recommendation = { taskType: "generation", language: "ko", selectedTemplateId: "architecture", selectedTemplateVersion: "1", catalogVersion: "2026.08", reason: "matches", provenance };
const compiled = { promptId: "prompt-1", taskType: "generation", selectedTemplateId: "architecture", selectedTemplateVersion: "1", catalogVersion: "2026.08", language: "ko", compiledPrompt: "draw a diagram", promptBlocks: [], negativeConstraints: [], evaluationCriteria: [], provenance, createdAt: "2026-08-27T00:00:00.000Z" };
function response(body, status = 200, headers = {}) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-response-version": PROMPT_GUIDE_RESPONSE_VERSION, ...headers } }); }
function rawResponse(body, headers = {}, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } }); }
function client(fetchImpl, extra = {}) { return new PromptGuideClient({ config: { baseUrl: "http://127.0.0.1:8000", apiKey: "server-secret", timeoutMs: 100, mode: "live", expectedResponseVersion: "v1" }, fetchImpl, ...extra }); }

test("1. Prompt Guide Client constructs /api/v1 URLs and correlation headers", async () => {
  let seen; const value = await client(async (url, options) => { seen = { url, options }; return response({ ...provenance, templateCount: 1 }); }).getCatalogSummary({ requestId: "req-1", correlationId: "corr-1" });
  assert.equal(seen.url, "http://127.0.0.1:8000/api/v1/image-prompts/catalog"); assert.equal(seen.options.headers.authorization, "Bearer server-secret"); assert.equal(value.responseVersion, "v1"); assert.equal(value.requestId, "req-1"); assert.equal(value.correlationId, "corr-1");
});
test("catalog summary drops opaque template definitions at the server boundary", async () => {
  const value = await client(async () => response({ ...provenance, templateCount: 1, templates: [{ id: "architecture", internalTemplate: "never" }] })).getCatalogSummary();
  assert.equal(Object.prototype.hasOwnProperty.call(value, "templates"), false);
});
test("live configuration requires HTTPS except for literal loopback development", () => {
  assert.throws(() => createPromptGuideConfig({ PROMPT_GUIDE_MODE: "live", PROMPT_GUIDE_BASE_URL: "http://prompt-guide.example", PROMPT_GUIDE_API_KEY: "secret", PROMPT_GUIDE_TIMEOUT_MS: "100" }), /HTTPS outside loopback/);
  assert.equal(createPromptGuideConfig({ PROMPT_GUIDE_MODE: "live", PROMPT_GUIDE_BASE_URL: "http://localhost:8000", PROMPT_GUIDE_API_KEY: "secret", PROMPT_GUIDE_TIMEOUT_MS: "100" }).baseUrl, "http://localhost:8000");
  assert.equal(createPromptGuideConfig({ PROMPT_GUIDE_MODE: "live", PROMPT_GUIDE_BASE_URL: "https://prompt-guide.example", PROMPT_GUIDE_API_KEY: "secret", PROMPT_GUIDE_TIMEOUT_MS: "100" }).baseUrl, "https://prompt-guide.example");
});
test("3. Recommendation responses preserve response v1 and pinned provenance", async () => {
  const value = await client(async () => response(recommendation)).recommend(request); assert.equal(value.selectedTemplateId, "architecture"); assert.equal(value.responseVersion, "v1");
});
test("4. Composition responses parse only valid compiled drafts", async () => {
  const value = await client(async () => response(compiled)).compose(request); assert.equal(value.compiledPrompt, "draw a diagram"); assert.equal(value.responseVersion, "v1");
  await assert.rejects(
    () => client(async () => response({ ...compiled, negativeConstraints: [{ authorization: "Bearer leaked" }] })).compose(request),
    PromptGuideContractError,
  );
});
test("5. Validation responses preserve actionable result fields", async () => {
  const value = await client(async () => response({ valid: true, errors: [], warnings: [] })).validate({ ...request, compiled: { ...compiled, responseVersion: "v1" } }); assert.equal(value.valid, true);
});
test("6. Prompt Guide 401 maps without requiring a success-version claim", async () => { await assert.rejects(() => client(async () => rawResponse({}, {}, 401)).recommend(request), PromptGuideAuthenticationError); });
test("7. Prompt Guide 422 allowlists validation details without requiring a success-version claim", async () => {
  await assert.rejects(() => client(async () => rawResponse({ errors: [{ code: "bad", message: "Fix intent", field: "intent", internal: "never" }] }, {}, 422)).recommend(request), (error) => {
    assert.equal(error instanceof PromptGuideValidationError, true);
    assert.deepEqual(error.details, [{ code: "bad", message: "Fix intent", field: "intent" }]);
    return true;
  });
});
test("8. Only catalog GET retries transient rate limits", async () => {
  let calls = 0; const delays = []; const value = await client(async () => { calls += 1; return calls === 1 ? rawResponse({}, { "retry-after": "2" }, 429) : response({ ...provenance, templateCount: 1 }); }, { sleep: async (delay) => delays.push(delay) }).getCatalogSummary();
  assert.equal(value.templateCount, 1); assert.equal(calls, 2); assert.deepEqual(delays, [2000]);
});
test("catalog GET honors Retry-After with the production delay implementation", async () => {
  let calls = 0; const started = Date.now();
  await client(async () => { calls += 1; return calls === 1 ? rawResponse({}, { "retry-after": "0.02" }, 429) : response({ ...provenance, templateCount: 1 }); }).getCatalogSummary();
  assert.equal(calls, 2); assert.equal(Date.now() - started >= 10, true);
});
test("9. Aborted requests map to PromptGuideTimeoutError", async () => {
  await assert.rejects(() => client(async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))))).recommend(request), PromptGuideTimeoutError);
});
test("10. Prompt Guide 5xx maps without requiring a success-version claim", async () => { await assert.rejects(() => client(async () => rawResponse({}, {}, 503)).recommend(request), PromptGuideUnavailableError); });
test("11. Missing and mismatched response versions fail without retrying compose", async () => {
  let missingCalls = 0; await assert.rejects(() => client(async () => { missingCalls += 1; return new Response(JSON.stringify(compiled), { status: 200, headers: { "content-type": "application/json" } }); }).compose(request), PromptGuideContractError); assert.equal(missingCalls, 1);
  await assert.rejects(() => client(async () => response(compiled, 200, { "x-response-version": "v2" })).compose(request), PromptGuideContractError);
});
test("Response-version consensus rejects conflicting claims and accepts equal headers/body", async () => {
  const matching = await client(async () => rawResponse({ ...compiled, responseVersion: "v1" }, { "x-response-version": "v1", "x-api-version": "v1" })).compose(request);
  assert.equal(matching.responseVersion, "v1");
  const blankBodyClaim = await client(async () => rawResponse({ ...compiled, responseVersion: "  " }, { "x-response-version": "v1" })).compose(request);
  assert.equal(blankBodyClaim.responseVersion, "v1");
  await assert.rejects(() => client(async () => rawResponse({ ...compiled, responseVersion: "v2" }, { "x-response-version": "v1" })).compose(request), PromptGuideContractError);
  await assert.rejects(() => client(async () => rawResponse(compiled, { "x-response-version": "v1", "x-api-version": "v2" })).compose(request), PromptGuideContractError);
  await assert.rejects(() => client(async () => rawResponse({ ...compiled, responseVersion: "v2" }, { "x-response-version": "v2" })).compose(request), PromptGuideContractError);
});
test("18. Mock mode is deterministic, production-blocked, and performs zero external fetches", async () => {
  assert.throws(() => createPromptGuideConfig({ PROMPT_GUIDE_MODE: "mock", NODE_ENV: "production" }), /blocked in production/);
  let fetches = 0; const config = createPromptGuideConfig({ PROMPT_GUIDE_MODE: "mock", PROMPT_GUIDE_TIMEOUT_MS: "100" });
  const mock = new PromptGuideClient({ config, fetchImpl: async () => { fetches += 1; throw new Error("external fetch must not happen"); } });
  const first = await mock.compose(request); const second = await mock.compose(request);
  assert.equal(first.promptId, second.promptId); assert.equal(first.responseVersion, "v1"); assert.equal(fetches, 0);
});
test("Prompt Guide logs never include configured credentials", async () => {
  const logs = []; await assert.rejects(() => client(async () => response({ ...recommendation, provenance: { ...provenance, upstreamCommit: "wrong" } }), { logger: (event) => logs.push(JSON.stringify(event)) }).recommend(request), PromptGuideContractError);
  assert.equal(logs.join(" ").includes("server-secret"), false);
  assert.equal(logs.every((entry) => Object.keys(JSON.parse(entry)).every((key) => ["event", "method", "path", "requestId", "correlationId", "jobId", "status"].includes(key))), true);
});
