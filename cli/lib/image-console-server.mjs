// Loopback-only same-origin gateway for the separately served Image Console.

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPromptGuideConfig,
  PromptGuideClient,
  PromptGuideConfigurationError,
  PromptGuideAuthenticationError,
  PromptGuideValidationError,
  PromptGuideRateLimitError,
  PromptGuideUnavailableError,
  PromptGuideTimeoutError,
  PromptGuideContractError,
} from "./prompt-guide-client.mjs";
import { executeImageProvider, ImageProviderConfigurationError, ImageProviderError, providerFromEnvironment } from "./image-provider.mjs";
import { createImageWorkflow, ImageDraftError } from "./image-workflow.mjs";

const CONSOLE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "image-console");
const MAX_BODY_BYTES = 1024 * 1024;
const SECURITY_HEADERS = Object.freeze({
  "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
});
const STATIC_FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/contract.js", ["contract.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/website-console/styles.css", ["../website-console/styles.css", "text/css; charset=utf-8"]],
]);

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
class ImageConsoleRequestError extends Error { constructor(message) { super(message); this.name = "ImageConsoleRequestError"; } }

function normalizedHostname(host) { return host.replace(/^\[|\]$/g, "").toLowerCase(); }
function isLoopback(host) { return ["127.0.0.1", "::1", "localhost"].includes(normalizedHostname(host)); }
export function isSafeImageConsoleRequest(headers, expectedPort) {
  if (!headers || typeof headers.host !== "string") return false;
  let authority;
  try { authority = new URL(`http://${headers.host}`); } catch { return false; }
  if (!isLoopback(authority.hostname) || Number(authority.port || 80) !== expectedPort) return false;
  if (headers.origin === undefined) return true;
  if (typeof headers.origin !== "string") return false;
  let origin;
  try { origin = new URL(headers.origin); } catch { return false; }
  return origin.protocol === "http:" && isLoopback(origin.hostname) && origin.host === authority.host;
}
export function isJsonRequestContentType(value) {
  return typeof value === "string" && value.split(";", 1)[0].trim().toLowerCase() === "application/json";
}
function safeRequestId(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && SAFE_ID.test(candidate) ? candidate : randomUUID();
}
function safeLog(logger, event) {
  if (typeof logger !== "function") return;
  const safe = {};
  for (const key of ["event", "method", "path", "requestId", "correlationId", "jobId", "status"]) {
    if (event[key] !== undefined && event[key] !== null) safe[key] = event[key];
  }
  try { logger(safe); } catch { /* Logging must not change the gateway contract. */ }
}
export function defaultImageConsoleLogger(event) { console.info(JSON.stringify(event)); }
function json(response, status, body, { requestId, correlationId } = {}) {
  const headers = { ...SECURITY_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
  if (requestId) headers["x-request-id"] = requestId;
  if (correlationId) headers["x-correlation-id"] = correlationId;
  response.writeHead(status, headers);
  response.end(`${JSON.stringify(body)}\n`);
}
function errorStatus(error) {
  if (error instanceof PromptGuideConfigurationError) return 503;
  if (error instanceof PromptGuideAuthenticationError || error instanceof PromptGuideContractError) return 502;
  if (error instanceof PromptGuideValidationError) return 422;
  if (error instanceof PromptGuideRateLimitError) return 429;
  if (error instanceof PromptGuideTimeoutError) return 504;
  if (error instanceof PromptGuideUnavailableError) return 503;
  if (error instanceof ImageDraftError) return 409;
  if (error instanceof ImageProviderConfigurationError) return 503;
  if (error instanceof ImageProviderError) return 502;
  if (error instanceof ImageConsoleRequestError || error instanceof TypeError) return 400;
  return 500;
}
function publicError(error) {
  if (error instanceof ImageProviderConfigurationError) return { error: { type: error.name, message: "Image provider execution is not configured" } };
  if (error instanceof ImageProviderError) return { error: { type: error.name, message: "Image provider could not complete the request" } };
  const known = error instanceof PromptGuideConfigurationError || error instanceof PromptGuideAuthenticationError || error instanceof PromptGuideValidationError || error instanceof PromptGuideRateLimitError || error instanceof PromptGuideUnavailableError || error instanceof PromptGuideTimeoutError || error instanceof PromptGuideContractError || error instanceof ImageDraftError || error instanceof ImageConsoleRequestError || error instanceof TypeError;
  const result = { error: { type: known ? error.name : "ImageConsoleError", message: known ? error.message : "Image Console request failed" } };
  if (error instanceof PromptGuideValidationError) result.error.details = error.details;
  if (error instanceof PromptGuideRateLimitError) result.error.retryAfter = error.retryAfter;
  return result;
}
function readJson(request) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    let body = "";
    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) { reject(new ImageConsoleRequestError("request body is too large")); request.destroy(); return; }
      body += chunk;
    });
    request.on("end", () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new ImageConsoleRequestError("request body must be valid JSON")); } });
    request.on("error", reject);
  });
}

export function createImageConsoleServer({ workflow, client, provider, env = process.env, host = "127.0.0.1", port = 0, consoleRoot = CONSOLE_ROOT, logger = defaultImageConsoleLogger } = {}) {
  if (!isLoopback(host)) throw new PromptGuideConfigurationError("Image Console gateway may bind only to a loopback host");
  if (env.PROMPT_GUIDE_MODE === "mock" && env.NODE_ENV === "production") throw new PromptGuideConfigurationError("Prompt Guide mock mode is blocked in production");
  const configuredClient = client || new PromptGuideClient({ config: createPromptGuideConfig(env), logger: (event) => safeLog(logger, event) });
  const configuredWorkflow = workflow || createImageWorkflow({
    client: configuredClient,
    provider,
    executeProvider: (request) => executeImageProvider({ ...request, provider: request.provider || providerFromEnvironment(env) }),
  });
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    const requestId = safeRequestId(request.headers["x-request-id"]);
    const correlationId = safeRequestId(request.headers["x-correlation-id"]);
    const context = { method: request.method || "UNKNOWN", path: url.pathname, requestId, correlationId };
    const send = (status, body) => {
      safeLog(logger, { event: "image-console-response", ...context, status });
      return json(response, status, body, context);
    };
    try {
      const address = server.address();
      const expectedPort = typeof address === "object" && address ? address.port : port;
      if (!isSafeImageConsoleRequest(request.headers, expectedPort)) return send(403, { error: { type: "Forbidden", message: "request authority must match the loopback Image Console origin" } });
      if (request.method === "POST" && !isJsonRequestContentType(request.headers["content-type"])) return send(415, { error: { type: "UnsupportedMediaType", message: "POST requests must use application/json" } });
      const staticFile = request.method === "GET" ? STATIC_FILES.get(url.pathname) : null;
      if (staticFile) {
        const [relativePath, contentType] = staticFile;
        const content = await readFile(path.join(consoleRoot, relativePath));
        safeLog(logger, { event: "image-console-response", ...context, status: 200 });
        response.writeHead(200, { ...SECURITY_HEADERS, "content-type": contentType, "cache-control": "no-store", "x-request-id": requestId, "x-correlation-id": correlationId });
        response.end(content);
        return;
      }
      if (request.method === "GET" && url.pathname === "/health") return send(200, { ok: true, bind: "loopback" });
      if (request.method === "GET" && url.pathname === "/api/image/catalog") return send(200, await configuredClient.getCatalogSummary({ requestId, correlationId }));
      if (request.method === "GET" && url.pathname === "/api/image/assets") return send(200, { assets: await configuredWorkflow.listAssets() });
      if (request.method === "GET" && url.pathname.startsWith("/api/image/assets/")) {
        const asset = await configuredWorkflow.getAsset(decodeURIComponent(url.pathname.slice("/api/image/assets/".length)));
        return asset ? send(200, asset) : send(404, { error: { type: "NotFound", message: "asset was not found" } });
      }
      if (request.method === "GET" && url.pathname.startsWith("/api/image/jobs/")) {
        const job = configuredWorkflow.getJob(decodeURIComponent(url.pathname.slice("/api/image/jobs/".length)));
        return job ? send(200, job) : send(404, { error: { type: "NotFound", message: "job was not found" } });
      }
      if (request.method === "POST" && url.pathname === "/api/image/recommend") return send(200, await configuredClient.recommend(await readJson(request), { requestId, correlationId }));
      if (request.method === "POST" && url.pathname === "/api/image/validate") return send(200, await configuredClient.validate(await readJson(request), { requestId, correlationId }));
      if (request.method === "POST" && url.pathname === "/api/image/compose") return send(201, await configuredWorkflow.composeDraft(await readJson(request), { requestId, correlationId }));
      if (request.method === "POST" && url.pathname === "/api/image/jobs") {
        const body = await readJson(request);
        const job = await configuredWorkflow.executeDraft(body.draftId, { approved: body.approved === true, createdBy: "local-operator" });
        safeLog(logger, { event: "image-job", ...context, jobId: job.jobId, status: job.status });
        return send(201, job);
      }
      return send(404, { error: { type: "NotFound", message: "route was not found" } });
    } catch (error) {
      const status = errorStatus(error);
      safeLog(logger, { event: "image-console-error", ...context, status });
      return send(status, publicError(error));
    }
  });
  return {
    server,
    workflow: configuredWorkflow,
    client: configuredClient,
    start: () => new Promise((resolve, reject) => { server.once("error", reject); server.listen({ host, port }, () => { server.off("error", reject); resolve(server.address()); }); }),
    stop: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}
