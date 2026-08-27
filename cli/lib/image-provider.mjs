// Provider-neutral subprocess boundary. Prompt Guide configuration is never inherited.

import { spawn } from "node:child_process";
import path from "node:path";

const MAX_OUTPUT_BYTES = 12 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(["image/png", "image/jpeg", "image/webp"]);
const MEDIA_EXTENSIONS = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };
const INPUT_KEYS = ["prompt", "negativeConstraints", "size", "quality", "referenceAssets", "providerOptions"];
const REFERENCE_KEYS = ["assetId", "assetPath", "byteSize", "mediaType", "sha256"];
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");

export class ImageProviderConfigurationError extends Error { constructor(message) { super(message); this.name = "ImageProviderConfigurationError"; } }
export class ImageProviderError extends Error { constructor(message) { super(message); this.name = "ImageProviderError"; } }

function timeout(value, label = "IMAGE_PROVIDER_TIMEOUT_MS") {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 100 || parsed > 120000) throw new ImageProviderConfigurationError(`${label} must be an integer between 100 and 120000`);
  return parsed;
}

export function providerEnvironment(env = process.env) {
  const runtimeKeys = new Set(["HOME", "LANG", "LC_ALL", "LC_CTYPE", "PATH", "SystemRoot", "TEMP", "TMP", "TMPDIR"]);
  return Object.fromEntries(Object.entries(env).filter(([key]) => runtimeKeys.has(key) || key.startsWith("IMAGE_PROVIDER_")));
}

export function providerFromEnvironment(env = process.env) {
  const command = env.IMAGE_PROVIDER_COMMAND || "";
  if (!command) throw new ImageProviderConfigurationError("IMAGE_PROVIDER_COMMAND must name a local provider adapter");
  if (!path.isAbsolute(command)) throw new ImageProviderConfigurationError("IMAGE_PROVIDER_COMMAND must be an absolute executable path");
  let args = [];
  if (env.IMAGE_PROVIDER_ARGS) {
    try { args = JSON.parse(env.IMAGE_PROVIDER_ARGS); } catch { throw new ImageProviderConfigurationError("IMAGE_PROVIDER_ARGS must be a JSON array"); }
    if (!Array.isArray(args) || !args.every((item) => typeof item === "string")) throw new ImageProviderConfigurationError("IMAGE_PROVIDER_ARGS must be a JSON string array");
  }
  return { command, args, provider: env.IMAGE_PROVIDER_NAME || "local-subprocess", timeoutMs: timeout(env.IMAGE_PROVIDER_TIMEOUT_MS || 60000) };
}

export function assertProviderReferenceDescriptor(asset, { assetRoot } = {}) {
  if (!asset || typeof asset !== "object" || Array.isArray(asset)) throw new ImageProviderError("provider reference asset must be an object");
  const actualKeys = Object.keys(asset).sort();
  const expectedKeys = [...REFERENCE_KEYS].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) throw new ImageProviderError("provider reference asset must contain only the documented fields");
  if (!ALLOWED_MEDIA.has(asset.mediaType)) throw new ImageProviderError("provider reference asset.mediaType is unsupported");
  if (typeof asset.assetId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(asset.assetId)) throw new ImageProviderError("provider reference asset.assetId must be a safe identifier");
  if (typeof asset.assetPath !== "string" || !path.isAbsolute(asset.assetPath) || path.extname(asset.assetPath).toLowerCase() !== MEDIA_EXTENSIONS[asset.mediaType]) throw new ImageProviderError("provider reference asset.assetPath must be an absolute image path");
  if (!Number.isInteger(asset.byteSize) || asset.byteSize < 1) throw new ImageProviderError("provider reference asset.byteSize must be a positive integer");
  if (typeof asset.sha256 !== "string" || !/^sha256:[a-f0-9]{64}$/.test(asset.sha256)) throw new ImageProviderError("provider reference asset.sha256 must be sha256-prefixed");
  if (assetRoot !== undefined) {
    if (typeof assetRoot !== "string" || !path.isAbsolute(assetRoot)) throw new ImageProviderError("provider asset root must be an absolute path");
    const relative = path.relative(path.resolve(assetRoot), path.resolve(asset.assetPath));
    if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new ImageProviderError("provider reference asset path must stay inside the configured asset root");
  }
  return asset;
}

export function assertProviderInput(input, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ImageProviderError("provider input must be an object");
  const actualKeys = Object.keys(input).sort();
  if (actualKeys.length !== INPUT_KEYS.length || actualKeys.some((key, index) => key !== [...INPUT_KEYS].sort()[index])) {
    throw new ImageProviderError("provider input must contain only the documented separated fields");
  }
  if (typeof input.prompt !== "string" || !input.prompt.trim()) throw new ImageProviderError("provider input.prompt must be non-empty");
  if (!Array.isArray(input.negativeConstraints) || !input.negativeConstraints.every((item) => typeof item === "string")) throw new ImageProviderError("provider input.negativeConstraints must be strings");
  if (typeof input.size !== "string" || !input.size) throw new ImageProviderError("provider input.size must be a string");
  if (typeof input.quality !== "string" || !input.quality) throw new ImageProviderError("provider input.quality must be a string");
  if (!Array.isArray(input.referenceAssets) || input.referenceAssets.length > 100) {
    throw new ImageProviderError("provider input.referenceAssets must be bounded asset descriptors");
  }
  input.referenceAssets.forEach((asset) => assertProviderReferenceDescriptor(asset, options));
  if (!input.providerOptions || typeof input.providerOptions !== "object" || Array.isArray(input.providerOptions)) throw new ImageProviderError("provider input.providerOptions must be an object");
  return input;
}

function defaultSpawnRunner({ command, args, input, timeoutMs, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const fail = (message) => { child.kill(); settle(reject, new ImageProviderError(message)); };
    const timer = setTimeout(() => fail("provider adapter timed out"), timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_OUTPUT_BYTES) return fail("provider adapter stdout exceeds the size limit");
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_OUTPUT_BYTES) return fail("provider adapter stderr exceeds the size limit");
      stderr += chunk;
    });
    child.on("error", (error) => settle(reject, new ImageProviderError(`provider adapter failed to start: ${error.message}`)));
    child.on("close", (status) => settle(resolve, { status, stdout, stderr }));
    child.stdin.end(input);
  });
}

export function parseProviderResult(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new ImageProviderError("provider adapter returned invalid JSON"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ImageProviderError("provider adapter result must be an object");
  if (!ALLOWED_MEDIA.has(parsed.mediaType)) throw new ImageProviderError("provider adapter returned an unsupported media type");
  if (typeof parsed.dataBase64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(parsed.dataBase64)) throw new ImageProviderError("provider adapter returned invalid base64 media");
  const bytes = Buffer.from(parsed.dataBase64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_OUTPUT_BYTES) throw new ImageProviderError("provider adapter returned media outside the allowed size");
  assertImageMediaBytes(bytes, parsed.mediaType);
  if (typeof parsed.model !== "string" || !parsed.model) throw new ImageProviderError("provider adapter result is missing model");
  return { mediaType: parsed.mediaType, bytes, model: parsed.model };
}

export function assertImageMediaBytes(bytes, mediaType) {
  if (!Buffer.isBuffer(bytes) || !ALLOWED_MEDIA.has(mediaType)) throw new ImageProviderError("provider adapter returned invalid image media");
  const matchesMediaType = mediaType === "image/png"
    ? bytes.length >= PNG_SIGNATURE.length && bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
    : mediaType === "image/jpeg"
      ? bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9
      : bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!matchesMediaType) throw new ImageProviderError("provider adapter media bytes do not match the declared media type");
  return bytes;
}

export async function executeImageProvider({ provider, input, assetRoot, spawnRunner = defaultSpawnRunner, environment = process.env }) {
  assertProviderInput(input, { assetRoot });
  if (!provider || typeof provider.command !== "string" || !path.isAbsolute(provider.command) || !Array.isArray(provider.args)) {
    throw new ImageProviderConfigurationError("a provider-neutral local subprocess adapter is required");
  }
  const result = await spawnRunner({ command: provider.command, args: provider.args, input: JSON.stringify(input), timeoutMs: timeout(provider.timeoutMs || 60000, "provider.timeoutMs"), env: providerEnvironment(environment) });
  if (!result || result.status !== 0) throw new ImageProviderError(`provider adapter exited unsuccessfully${result?.status === null || result?.status === undefined ? "" : ` (${result.status})`}`);
  return { ...parseProviderResult(result.stdout || ""), provider: provider.provider || "local-subprocess" };
}
