// Server-only Prompt Guide client. Browser files never import this module.

import { randomUUID } from "node:crypto";
import {
  PROMPT_GUIDE_RESPONSE_VERSION,
  PROMPT_GUIDE_SOURCE_REPOSITORY,
  PROMPT_GUIDE_UPSTREAM_COMMIT,
  assertCatalogSummary,
  assertCompiledPrompt,
  assertPromptRequest,
  assertRecommendation,
  assertValidateRequest,
  assertValidationResult,
  sha256,
} from "./image-prompt-contract.mjs";

export class PromptGuideConfigurationError extends Error { constructor(message) { super(message); this.name = "PromptGuideConfigurationError"; } }
export class PromptGuideAuthenticationError extends Error { constructor(message) { super(message); this.name = "PromptGuideAuthenticationError"; } }
export class PromptGuideValidationError extends Error { constructor(message, details = []) { super(message); this.name = "PromptGuideValidationError"; this.details = details; } }
export class PromptGuideRateLimitError extends Error { constructor(message, retryAfter = null) { super(message); this.name = "PromptGuideRateLimitError"; this.retryAfter = retryAfter; } }
export class PromptGuideUnavailableError extends Error { constructor(message) { super(message); this.name = "PromptGuideUnavailableError"; } }
export class PromptGuideTimeoutError extends Error { constructor(message) { super(message); this.name = "PromptGuideTimeoutError"; } }
export class PromptGuideContractError extends Error { constructor(message) { super(message); this.name = "PromptGuideContractError"; } }

const ENDPOINTS = Object.freeze({
  catalog: "/api/v1/image-prompts/catalog",
  recommend: "/api/v1/image-prompts/recommend",
  compose: "/api/v1/image-prompts/compose",
  validate: "/api/v1/image-prompts/validate",
});

function parseTimeout(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 100 || parsed > 120000) {
    throw new PromptGuideConfigurationError("PROMPT_GUIDE_TIMEOUT_MS must be an integer between 100 and 120000");
  }
  return parsed;
}

function isLoopbackHostname(hostname) {
  return ["127.0.0.1", "::1", "localhost"].includes(hostname.replace(/^\[|\]$/g, "").toLowerCase());
}

export function createPromptGuideConfig(env = process.env) {
  const mode = env.PROMPT_GUIDE_MODE || "live";
  if (mode !== "live" && mode !== "mock") throw new PromptGuideConfigurationError("PROMPT_GUIDE_MODE must be live or explicit mock");
  if (mode === "mock" && env.NODE_ENV === "production") throw new PromptGuideConfigurationError("Prompt Guide mock mode is blocked in production");
  let baseUrl;
  try { baseUrl = new URL(env.PROMPT_GUIDE_BASE_URL || "http://127.0.0.1:8000"); } catch { throw new PromptGuideConfigurationError("PROMPT_GUIDE_BASE_URL must be an absolute HTTP URL"); }
  if (!/^https?:$/.test(baseUrl.protocol)) throw new PromptGuideConfigurationError("PROMPT_GUIDE_BASE_URL must use HTTP or HTTPS");
  if (baseUrl.protocol === "http:" && !isLoopbackHostname(baseUrl.hostname)) throw new PromptGuideConfigurationError("PROMPT_GUIDE_BASE_URL must use HTTPS outside loopback development");
  const expectedResponseVersion = env.PROMPT_GUIDE_EXPECTED_RESPONSE_VERSION || PROMPT_GUIDE_RESPONSE_VERSION;
  if (expectedResponseVersion !== PROMPT_GUIDE_RESPONSE_VERSION) throw new PromptGuideConfigurationError("PROMPT_GUIDE_EXPECTED_RESPONSE_VERSION must be v1");
  const apiKey = env.PROMPT_GUIDE_API_KEY || "";
  if (mode === "live" && !apiKey) throw new PromptGuideConfigurationError("PROMPT_GUIDE_API_KEY is required in live mode");
  return { baseUrl: baseUrl.toString().replace(/\/$/, ""), apiKey, timeoutMs: parseTimeout(env.PROMPT_GUIDE_TIMEOUT_MS || 15000), mode, expectedResponseVersion };
}

function retryAfter(header) {
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function acceptedResponseVersion(response, body, expected) {
  const claims = [];
  for (const [label, value] of [["x-response-version", response.headers.get("x-response-version")], ["x-api-version", response.headers.get("x-api-version")]]) {
    if (typeof value === "string" && value.trim() !== "") claims.push([label, value.trim()]);
  }
  if (body && typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "responseVersion")) {
    const value = body.responseVersion;
    if (typeof value === "string" && value.trim() !== "") claims.push(["responseVersion", value.trim()]);
    else if (typeof value !== "string" && value !== undefined && value !== null) throw new PromptGuideContractError("Prompt Guide responseVersion must be a non-empty string");
  }
  if (claims.length === 0) throw new PromptGuideContractError("Prompt Guide response is missing a response version");
  const versions = new Set(claims.map(([, value]) => value));
  if (versions.size > 1) throw new PromptGuideContractError("Prompt Guide response version claims conflict");
  if (claims.some(([, value]) => value !== expected)) throw new PromptGuideContractError(`Prompt Guide response version must be ${expected}`);
  return expected;
}

function redactedLog(logger, event) {
  if (typeof logger !== "function") return;
  const safe = {};
  for (const key of ["event", "method", "path", "requestId", "correlationId", "jobId", "status"]) {
    if (event[key] !== undefined && event[key] !== null) safe[key] = event[key];
  }
  try { logger(safe); } catch { /* Logging must not change the gateway contract. */ }
}

function validationDetails(body) {
  if (!Array.isArray(body?.errors)) return [];
  return body.errors.slice(0, 100).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const code = typeof item.code === "string" ? item.code.trim().slice(0, 64) : "";
    const message = typeof item.message === "string" ? item.message.trim().slice(0, 512) : "";
    if (!code || !message) return [];
    const field = typeof item.field === "string" ? item.field.trim().slice(0, 128) : "";
    return [{ code, message, ...(field ? { field } : {}) }];
  });
}

function mapHttpError(response, body) {
  if (response.status === 401 || response.status === 403) return new PromptGuideAuthenticationError("Prompt Guide authentication was rejected");
  if (response.status === 422) return new PromptGuideValidationError("Prompt Guide rejected the image prompt", validationDetails(body));
  if (response.status === 429) return new PromptGuideRateLimitError("Prompt Guide rate limit reached", retryAfter(response.headers.get("retry-after")));
  if (response.status >= 500) return new PromptGuideUnavailableError(`Prompt Guide is unavailable (${response.status})`);
  return new PromptGuideContractError(`Prompt Guide returned unexpected HTTP ${response.status}`);
}

function mockProvenance() {
  return { sourceRepository: PROMPT_GUIDE_SOURCE_REPOSITORY, upstreamCommit: PROMPT_GUIDE_UPSTREAM_COMMIT, catalogVersion: "mock-v1", overlayVersions: { mode: "synthetic" } };
}

export class PromptGuideClient {
  constructor({ config = createPromptGuideConfig(), fetchImpl = globalThis.fetch, logger = null, requestIdFactory = randomUUID, sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)) } = {}) {
    if (config.mode !== "mock" && typeof fetchImpl !== "function") throw new PromptGuideConfigurationError("fetch is unavailable");
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.logger = logger;
    this.requestIdFactory = requestIdFactory;
    this.sleep = sleep;
  }

  async getCatalogSummary(options = {}) { return this.#request("catalog", "GET", null, options, (body, version) => assertCatalogSummary({ ...body, responseVersion: version }), true); }
  async recommend(request, options = {}) { return this.#request("recommend", "POST", assertPromptRequest(request), options, (body, version) => assertRecommendation({ ...body, responseVersion: version }), false); }
  async compose(request, options = {}) { return this.#request("compose", "POST", assertPromptRequest(request), options, (body, version) => assertCompiledPrompt({ ...body, responseVersion: version }), false); }
  async validate(request, options = {}) { return this.#request("validate", "POST", assertValidateRequest(request), options, (body, version) => assertValidationResult({ ...body, responseVersion: version }), false); }

  async #request(operation, method, payload, options, parser, retryable) {
    const requestId = options.requestId || this.requestIdFactory();
    const correlationId = options.correlationId || requestId;
    if (this.config.mode === "mock") return this.#mock(operation, payload, requestId, correlationId);
    const url = `${this.config.baseUrl}${ENDPOINTS[operation]}`;
    const attempts = retryable ? 2 : 1;
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
      try {
        const headers = { accept: "application/json", "x-request-id": requestId, "x-correlation-id": correlationId };
        if (payload !== null) headers["content-type"] = "application/json";
        headers.authorization = `Bearer ${this.config.apiKey}`;
        const response = await this.fetchImpl(url, { method, headers, body: payload === null ? undefined : JSON.stringify(payload), signal: controller.signal });
        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.toLowerCase().includes("application/json");
        let body;
        if (isJson) {
          try { body = await response.json(); }
          catch {
            if (response.ok) throw new PromptGuideContractError("Prompt Guide returned invalid JSON");
          }
        }
        redactedLog(this.logger, { event: "prompt-guide-response", method, path: ENDPOINTS[operation], requestId, correlationId, status: response.status });
        if (!response.ok) throw mapHttpError(response, body);
        if (!isJson) throw new PromptGuideContractError("Prompt Guide response must use application/json");
        const responseVersion = acceptedResponseVersion(response, body, this.config.expectedResponseVersion);
        let parsed;
        try { parsed = parser(body, responseVersion); }
        catch (parseError) { throw new PromptGuideContractError(parseError.message); }
        return { ...parsed, requestId, correlationId };
      } catch (error) {
        const mapped = error?.name === "AbortError" ? new PromptGuideTimeoutError("Prompt Guide request timed out")
          : error instanceof PromptGuideConfigurationError || error instanceof PromptGuideAuthenticationError || error instanceof PromptGuideValidationError || error instanceof PromptGuideRateLimitError || error instanceof PromptGuideUnavailableError || error instanceof PromptGuideTimeoutError || error instanceof PromptGuideContractError ? error
            : new PromptGuideUnavailableError("Prompt Guide request could not be reached");
        lastError = mapped;
        redactedLog(this.logger, { event: "prompt-guide-error", method, path: ENDPOINTS[operation], requestId, correlationId, status: 0 });
        const mayRetry = retryable && attempt + 1 < attempts && (mapped instanceof PromptGuideUnavailableError || mapped instanceof PromptGuideTimeoutError || mapped instanceof PromptGuideRateLimitError);
        if (!mayRetry) throw mapped;
        await this.sleep(mapped instanceof PromptGuideRateLimitError && mapped.retryAfter !== null ? mapped.retryAfter * 1000 : 100);
      } finally { clearTimeout(timeout); }
    }
    throw lastError;
  }

  #mock(operation, payload, requestId, correlationId) {
    const provenance = mockProvenance();
    const common = { provenance, responseVersion: this.config.expectedResponseVersion, requestId, correlationId };
    if (operation === "catalog") return { ...provenance, templateCount: 2, responseVersion: common.responseVersion, requestId, correlationId };
    if (operation === "recommend") return { taskType: payload.taskType, language: payload.language, selectedTemplateId: `synthetic-${payload.taskType}`, selectedTemplateVersion: "1", catalogVersion: provenance.catalogVersion, reason: "Deterministic local mock recommendation", ...common };
    if (operation === "compose") {
      const promptId = `mock-${sha256(JSON.stringify(payload)).slice(0, 16)}`;
      return { promptId, taskType: payload.taskType, language: payload.language, selectedTemplateId: `synthetic-${payload.taskType}`, selectedTemplateVersion: "1", catalogVersion: provenance.catalogVersion, compiledPrompt: `Create ${payload.outputType}: ${payload.intent}`, promptBlocks: [{ kind: "synthetic", value: payload.intent }], negativeConstraints: payload.negativeConstraints, evaluationCriteria: [], createdAt: "2026-08-27T00:00:00.000Z", ...common };
    }
    if (operation === "validate") return { valid: true, errors: [], warnings: [], responseVersion: common.responseVersion, requestId, correlationId };
    throw new PromptGuideContractError("unsupported Prompt Guide operation");
  }
}
