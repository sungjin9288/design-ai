import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CAPABILITY_MANIFEST_PATH = fileURLToPath(
  new URL("./capability-manifest.json", import.meta.url),
);
const EXPECTED_COUNTS = {
  routes: 23,
  "install.skills": 20,
  "install.commands": 16,
  "install.agents": 4,
  "mcp.tools": 15,
  "mcp.learningProfileWriteTools": 3,
  "sdk.exports": 9,
  "sdk.learnMethods": 3,
};

function assertStringArray(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`Capability manifest ${field} must be an array of non-empty strings`);
  }
  if (new Set(value).size !== value.length) {
    throw new Error(`Capability manifest ${field} must not contain duplicates`);
  }
  if (value.length !== EXPECTED_COUNTS[field]) {
    throw new Error(
      `Capability manifest ${field} must contain ${EXPECTED_COUNTS[field]} entries, got ${value.length}`,
    );
  }
}

function assertExactKeys(value, expectedKeys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Capability manifest ${field} must be an object`);
  }
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`Capability manifest ${field} keys must be: ${expectedKeys.join(", ")}`);
  }
}

export function validateCapabilityManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Capability manifest must be a JSON object");
  }
  if (manifest.schemaVersion !== 1) {
    throw new Error("Capability manifest schemaVersion must be 1");
  }

  assertExactKeys(manifest, ["schemaVersion", "routes", "install", "mcp", "sdk"], "root");
  assertExactKeys(manifest.install, ["skills", "commands", "agents"], "install");
  assertExactKeys(manifest.mcp, ["tools", "learningProfileWriteTools"], "mcp");
  assertExactKeys(manifest.sdk, ["exports", "learnMethods"], "sdk");

  assertStringArray(manifest.routes, "routes");
  for (const kind of ["skills", "commands", "agents"]) {
    assertStringArray(manifest.install?.[kind], `install.${kind}`);
  }
  assertStringArray(manifest.mcp?.tools, "mcp.tools");
  assertStringArray(manifest.mcp?.learningProfileWriteTools, "mcp.learningProfileWriteTools");
  assertStringArray(manifest.sdk?.exports, "sdk.exports");
  assertStringArray(manifest.sdk?.learnMethods, "sdk.learnMethods");

  const mcpTools = new Set(manifest.mcp.tools);
  for (const toolName of manifest.mcp.learningProfileWriteTools) {
    if (!mcpTools.has(toolName)) {
      throw new Error(`Capability manifest write tool is not in mcp.tools: ${toolName}`);
    }
  }
  return manifest;
}

export function readCapabilityManifest(manifestPath = CAPABILITY_MANIFEST_PATH) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read capability manifest at ${manifestPath}: ${error.message}`);
  }
  return validateCapabilityManifest(manifest);
}
