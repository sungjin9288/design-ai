// Public route and package boundary contracts.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { PACKAGE_ROOT } from "./paths.mjs";
import { ROUTES } from "./route-catalog.mjs";

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(PACKAGE_ROOT, relativePath), "utf8"));
}

function exportPaths(value) {
  if (typeof value === "string") return [value];
  return Object.values(value).flatMap(exportPaths);
}

test("route ids are unique and all route references exist", () => {
  const routeIds = ROUTES.map((route) => route.id);
  assert.equal(new Set(routeIds).size, routeIds.length);

  for (const route of ROUTES) {
    for (const relativePath of [route.command, ...(route.skills || []), ...(route.agents || []), ...(route.knowledge || [])]) {
      if (relativePath) {
        assert.equal(existsSync(path.join(PACKAGE_ROOT, relativePath)), true, `${route.id} references ${relativePath}`);
      }
    }
  }
});

test("package bins, exports, manifest paths, and source-only boundaries are closed", () => {
  const packageJson = readJson("package.json");
  const pluginManifest = readJson(".claude-plugin/plugin.json");

  assert.deepEqual(packageJson.bin, {
    "design-ai": "cli/bin/design-ai.mjs",
    "design-ai-mcp": "cli/bin/design-ai-mcp.mjs",
  });
  assert.deepEqual(Object.keys(packageJson.exports), ["./sdk", "./package.json"]);

  for (const relativePath of Object.values(packageJson.bin)) {
    assert.equal(existsSync(path.join(PACKAGE_ROOT, relativePath)), true, `bin target missing: ${relativePath}`);
  }
  for (const relativePath of exportPaths(packageJson.exports)) {
    assert.equal(existsSync(path.join(PACKAGE_ROOT, relativePath)), true, `export target missing: ${relativePath}`);
  }
  for (const section of ["skills", "commands", "agents"]) {
    for (const entry of pluginManifest[section]) {
      assert.equal(existsSync(path.join(PACKAGE_ROOT, entry.path)), true, `manifest target missing: ${entry.path}`);
    }
  }

  assert.equal(pluginManifest.commands.some((entry) => entry.name === "extract-tokens"), false);
  assert.equal(packageJson.files.includes("refs/"), false);
  assert.equal(packageJson.files.includes("tools/extractors/"), false);
});
