// Local, user-authored configuration for optional Phase B features
// (docs/AI-LEARNING-PHASE2.md, "Phase A implementation review", decision 5 / FU-4).
//
// design-ai never writes this file. It is durable, per-machine, user-authored
// configuration — the CLI only reads it. Presence of a configured provider is
// NOT enough to enable embeddings: every consumer still requires the explicit
// per-invocation --embeddings flag (config supplies the provider, the flag arms it).

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export function defaultConfigFile() {
  return process.env.DESIGN_AI_CONFIG_FILE || path.join(homedir(), ".design-ai", "config.json");
}

const TOP_LEVEL_KEYS = new Set(["version", "embeddings"]);
const EMBEDDINGS_KEYS = new Set(["provider", "modelLabel"]);
const PROVIDER_KEYS = new Set(["command", "args"]);

function fail(message) {
  return { present: true, config: null, error: message };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateProvider(provider) {
  if (!isPlainObject(provider)) return "embeddings.provider must be an object";

  const unknown = Object.keys(provider).filter((key) => !PROVIDER_KEYS.has(key));
  if (unknown.length > 0) return `embeddings.provider has unknown key(s): ${unknown.join(", ")}`;

  if (typeof provider.command !== "string" || provider.command.trim() === "") {
    return "embeddings.provider.command is required and must be a non-empty string";
  }

  if (provider.args !== undefined) {
    if (!Array.isArray(provider.args) || !provider.args.every((arg) => typeof arg === "string")) {
      return "embeddings.provider.args must be an array of strings";
    }
  }

  return "";
}

function validateEmbeddings(embeddings) {
  if (!isPlainObject(embeddings)) return "embeddings must be an object";

  const unknown = Object.keys(embeddings).filter((key) => !EMBEDDINGS_KEYS.has(key));
  if (unknown.length > 0) return `embeddings has unknown key(s): ${unknown.join(", ")}`;

  if (embeddings.provider === undefined) return "embeddings.provider is required";
  const providerError = validateProvider(embeddings.provider);
  if (providerError) return providerError;

  if (embeddings.modelLabel !== undefined && typeof embeddings.modelLabel !== "string") {
    return "embeddings.modelLabel must be a string";
  }

  return "";
}

function validateConfig(config) {
  if (!isPlainObject(config)) return "config must be a JSON object";

  const unknown = Object.keys(config).filter((key) => !TOP_LEVEL_KEYS.has(key));
  if (unknown.length > 0) return `config has unknown top-level key(s): ${unknown.join(", ")}`;

  if (config.version !== 1) return "config.version must be 1";

  if (config.embeddings !== undefined) {
    const embeddingsError = validateEmbeddings(config.embeddings);
    if (embeddingsError) return embeddingsError;
  }

  return "";
}

// Never writes; design-ai only reads this user-authored file.
export function loadLocalConfig(filePath = defaultConfigFile()) {
  if (!existsSync(filePath)) return { present: false, config: null, error: "" };

  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    return fail(`unreadable config file: ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return fail(`config file is not valid JSON: ${error.message}`);
  }

  const error = validateConfig(parsed);
  if (error) return fail(error);

  return { present: true, config: parsed, error: "" };
}

// Convenience accessor: the configured embedding provider, or null when absent
// or the config is malformed/missing. Callers still must gate on --embeddings.
export function configuredEmbeddingProvider(filePath = defaultConfigFile()) {
  const { config } = loadLocalConfig(filePath);
  return config?.embeddings?.provider || null;
}
