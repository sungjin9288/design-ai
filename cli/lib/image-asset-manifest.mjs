// Atomic local-only generated-image persistence and non-secret provenance manifests.

import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { assertProvenance, assertResponseVersion } from "./image-prompt-contract.mjs";
import { assertImageMediaBytes } from "./image-provider.mjs";

const EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const SENSITIVE_KEY = /api.?key|authorization|token|secret|raw.*response/i;
const SAFE_ID = /^[a-zA-Z0-9_-]+$/;
const REQUIRED_KEYS = ["assetId", "jobId", "taskType", "sourceAssetIds", "promptId", "selectedTemplateId", "selectedTemplateVersion", "catalogVersion", "acceptedResponseVersion", "compiledPromptHash", "provider", "model", "providerParameters", "provenance", "createdAt", "createdBy", "reviewStatus", "rightsStatus"];
const STORED_KEYS = ["mediaType", "byteSize", "sha256"];

export function defaultImageAssetRoot() { return path.join(homedir(), ".design-ai", "image-assets"); }
export function hashImagePrompt(prompt) { return `sha256:${createHash("sha256").update(prompt).digest("hex")}`; }

function hasSensitiveValue(value) {
  if (Array.isArray(value)) return value.some(hasSensitiveValue);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, item]) => SENSITIVE_KEY.test(key) || hasSensitiveValue(item));
}

export function assertGeneratedAssetManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw new TypeError("generated asset manifest must be an object");
  if (Object.keys(manifest).some((key) => !REQUIRED_KEYS.includes(key) && !STORED_KEYS.includes(key))) throw new TypeError("generated asset manifest contains an unsupported field");
  for (const key of REQUIRED_KEYS) if (manifest[key] === undefined || manifest[key] === null || manifest[key] === "") throw new TypeError(`generated asset manifest.${key} is required`);
  if (typeof manifest.assetId !== "string" || typeof manifest.jobId !== "string" || !SAFE_ID.test(manifest.assetId) || !SAFE_ID.test(manifest.jobId)) throw new TypeError("generated asset manifest assetId and jobId must be safe identifiers");
  for (const key of ["promptId", "selectedTemplateId", "selectedTemplateVersion", "catalogVersion", "provider", "model", "createdBy"]) {
    if (typeof manifest[key] !== "string" || !manifest[key].trim()) throw new TypeError(`generated asset manifest.${key} must be a non-empty string`);
  }
  if (typeof manifest.createdAt !== "string" || Number.isNaN(Date.parse(manifest.createdAt)) || new Date(manifest.createdAt).toISOString() !== manifest.createdAt) throw new TypeError("generated asset manifest.createdAt must be a canonical UTC timestamp");
  if (manifest.taskType !== "generation" && manifest.taskType !== "editing") throw new TypeError("generated asset manifest.taskType is invalid");
  if (manifest.reviewStatus !== "draft" || manifest.rightsStatus !== "original-generated") throw new TypeError("generated asset manifest must preserve draft review and original-generated rights status");
  if (!Array.isArray(manifest.sourceAssetIds) || !manifest.sourceAssetIds.every((item) => typeof item === "string" && SAFE_ID.test(item))) throw new TypeError("generated asset manifest.sourceAssetIds must be safe identifiers");
  if (manifest.taskType === "generation" && manifest.sourceAssetIds.length !== 0) throw new TypeError("generation manifests must not claim source assets");
  if (manifest.taskType === "editing" && manifest.sourceAssetIds.length === 0) throw new TypeError("editing manifests require source assets");
  if (!/^sha256:[a-f0-9]{64}$/.test(manifest.compiledPromptHash)) throw new TypeError("generated asset manifest.compiledPromptHash must be sha256-prefixed");
  if (!manifest.providerParameters || typeof manifest.providerParameters !== "object" || Array.isArray(manifest.providerParameters)) throw new TypeError("generated asset manifest.providerParameters must be an object");
  if (Object.keys(manifest.providerParameters).some((key) => !["size", "quality"].includes(key))) throw new TypeError("generated asset manifest.providerParameters contains an unsupported field");
  if (["size", "quality"].some((key) => typeof manifest.providerParameters[key] !== "string" || !manifest.providerParameters[key])) throw new TypeError("generated asset manifest.providerParameters requires non-empty size and quality strings");
  const storedCount = STORED_KEYS.filter((key) => manifest[key] !== undefined).length;
  if (storedCount !== 0 && storedCount !== STORED_KEYS.length) throw new TypeError("generated asset manifest stored media fields must be complete");
  if (storedCount === STORED_KEYS.length && (!EXTENSIONS[manifest.mediaType] || !Number.isInteger(manifest.byteSize) || manifest.byteSize < 1 || !/^sha256:[a-f0-9]{64}$/.test(manifest.sha256))) throw new TypeError("generated asset manifest stored media fields are invalid");
  if (hasSensitiveValue(manifest)) throw new TypeError("generated asset manifest must not contain secrets or raw provider responses");
  assertResponseVersion(manifest.acceptedResponseVersion, "generated asset manifest.acceptedResponseVersion");
  const provenance = assertProvenance(manifest.provenance, "generated asset manifest.provenance");
  if (provenance.catalogVersion !== manifest.catalogVersion) throw new TypeError("generated asset manifest provenance catalog version must match");
  return { ...manifest, provenance };
}

export function createImageAssetStore({ root = defaultImageAssetRoot() } = {}) {
  const assetRoot = path.resolve(root);

  function withinAssetRoot(candidate) {
    const relative = path.relative(assetRoot, path.resolve(candidate));
    return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  }

  async function regularFile(candidate) {
    try {
      const stats = await lstat(candidate);
      return stats.isFile() && !stats.isSymbolicLink();
    } catch {
      return false;
    }
  }

  async function regularDirectory(candidate) {
    try {
      const stats = await lstat(candidate);
      return stats.isDirectory() && !stats.isSymbolicLink();
    } catch {
      return false;
    }
  }

  async function persist({ manifest, mediaType, bytes }) {
    const normalizedManifest = assertGeneratedAssetManifest(manifest);
    if (STORED_KEYS.some((key) => normalizedManifest[key] !== undefined)) throw new TypeError("persist input must not predeclare stored media fields");
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new TypeError("asset bytes are required");
    const extension = EXTENSIONS[mediaType];
    if (!extension) throw new TypeError("unsupported image media type");
    assertImageMediaBytes(bytes, mediaType);
    const directory = path.join(assetRoot, normalizedManifest.assetId);
    const staging = path.join(assetRoot, `.${normalizedManifest.assetId}.${randomUUID()}.staging`);
    if (!withinAssetRoot(directory) || !withinAssetRoot(staging)) throw new TypeError("asset paths must stay inside the configured asset root");
    await mkdir(assetRoot, { recursive: true });
    if (!(await regularDirectory(assetRoot))) throw new TypeError("asset root must be a regular directory");
    await mkdir(staging, { recursive: true });
    const assetPath = path.join(directory, `asset.${extension}`);
    const manifestPath = path.join(directory, "manifest.json");
    await writeFile(path.join(staging, `asset.${extension}`), bytes);
    await writeFile(path.join(staging, "manifest.json"), `${JSON.stringify({ ...normalizedManifest, mediaType, byteSize: bytes.length, sha256: hashImagePrompt(bytes) }, null, 2)}\n`);
    await rename(staging, directory);
    return { assetId: normalizedManifest.assetId, assetPath, manifestPath };
  }
  async function get(assetId) {
    if (typeof assetId !== "string" || !SAFE_ID.test(assetId)) return null;
    const directory = path.join(assetRoot, assetId);
    const manifestPath = path.join(directory, "manifest.json");
    if (!withinAssetRoot(directory) || !(await regularDirectory(assetRoot)) || !(await regularDirectory(directory)) || !(await regularFile(manifestPath))) return null;
    try {
      const manifest = assertGeneratedAssetManifest(JSON.parse(await readFile(manifestPath, "utf8")));
      return manifest.assetId === assetId && STORED_KEYS.every((key) => manifest[key] !== undefined) ? manifest : null;
    } catch { return null; }
  }
  async function getReferenceDescriptor(assetId) {
    if (typeof assetId !== "string" || !SAFE_ID.test(assetId)) return null;
    const directory = path.join(assetRoot, assetId);
    if (!withinAssetRoot(directory) || !(await regularDirectory(assetRoot)) || !(await regularDirectory(directory))) return null;
    const manifestPath = path.join(directory, "manifest.json");
    if (!(await regularFile(manifestPath))) return null;
    let manifest;
    try { manifest = assertGeneratedAssetManifest(JSON.parse(await readFile(manifestPath, "utf8"))); } catch { return null; }
    if (manifest.assetId !== assetId || !EXTENSIONS[manifest.mediaType] || !Number.isInteger(manifest.byteSize) || manifest.byteSize < 1 || !/^sha256:[a-f0-9]{64}$/.test(manifest.sha256)) return null;
    const assetPath = path.join(directory, `asset.${EXTENSIONS[manifest.mediaType]}`);
    if (!withinAssetRoot(assetPath) || !(await regularFile(assetPath))) return null;
    let bytes;
    try { bytes = await readFile(assetPath); } catch { return null; }
    if (bytes.length !== manifest.byteSize || hashImagePrompt(bytes) !== manifest.sha256) return null;
    try { assertImageMediaBytes(bytes, manifest.mediaType); } catch { return null; }
    return { assetId, assetPath: path.resolve(assetPath), mediaType: manifest.mediaType, byteSize: bytes.length, sha256: manifest.sha256 };
  }
  async function list() {
    try {
      if (!(await regularDirectory(assetRoot))) return [];
      const names = await readdir(assetRoot);
      const manifests = await Promise.all(names.map((name) => get(name)));
      return manifests.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch { return []; }
  }
  return { root: assetRoot, persist, get, getReferenceDescriptor, list };
}
