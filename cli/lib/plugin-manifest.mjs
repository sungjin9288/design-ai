import { readFileSync } from "node:fs";

export const PLUGIN_CAPABILITY_KINDS = Object.freeze(["skills", "commands", "agents"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateEntry(entry, kind, index) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Plugin manifest ${kind}[${index}] must be an object`);
  }
  for (const field of ["name", "path", "description"]) {
    if (!isNonEmptyString(entry[field])) {
      throw new Error(`Plugin manifest ${kind}[${index}].${field} must be a non-empty string`);
    }
  }
}

export function validatePluginManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Plugin manifest must be a JSON object");
  }
  if (!isNonEmptyString(manifest.name) || !isNonEmptyString(manifest.version)) {
    throw new Error("Plugin manifest name and version must be non-empty strings");
  }

  const paths = new Set();
  for (const kind of PLUGIN_CAPABILITY_KINDS) {
    const entries = manifest[kind];
    if (!Array.isArray(entries)) {
      throw new Error(`Plugin manifest ${kind} must be an array`);
    }
    const names = new Set();
    entries.forEach((entry, index) => {
      validateEntry(entry, kind, index);
      if (names.has(entry.name)) {
        throw new Error(`Plugin manifest contains duplicate ${kind} name: ${entry.name}`);
      }
      if (paths.has(entry.path)) {
        throw new Error(`Plugin manifest contains duplicate path: ${entry.path}`);
      }
      names.add(entry.name);
      paths.add(entry.path);
    });
  }
  return manifest;
}

export function readPluginManifest(manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read plugin manifest at ${manifestPath}: ${error.message}`);
  }
  return validatePluginManifest(manifest);
}

export function pluginInventoryCounts(manifest) {
  return Object.fromEntries(
    PLUGIN_CAPABILITY_KINDS.map((kind) => [kind, Array.isArray(manifest?.[kind]) ? manifest[kind].length : 0]),
  );
}
