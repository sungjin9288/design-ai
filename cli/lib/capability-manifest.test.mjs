import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import * as sdk from "../sdk/index.mjs";
import { MCP_TOOLS } from "./mcp-server.mjs";
import {
  CAPABILITY_MANIFEST_PATH,
  readCapabilityManifest,
  validateCapabilityManifest,
} from "./capability-manifest.mjs";
import { readPluginManifest } from "./plugin-manifest.mjs";
import { PACKAGE_ROOT, PLUGIN_MANIFEST } from "./paths.mjs";
import { ROUTES } from "./route-catalog.mjs";

const manifest = readCapabilityManifest();

test("canonical capability manifest matches every public identity surface", () => {
  const plugin = readPluginManifest(PLUGIN_MANIFEST);

  assert.deepEqual(ROUTES.map((route) => route.id), manifest.routes);
  assert.deepEqual(plugin.skills.map((entry) => entry.name), manifest.install.skills);
  assert.deepEqual(plugin.commands.map((entry) => entry.name), manifest.install.commands);
  assert.deepEqual(plugin.agents.map((entry) => entry.name), manifest.install.agents);
  assert.deepEqual(MCP_TOOLS.map((tool) => tool.name), manifest.mcp.tools);
  assert.deepEqual(Object.keys(sdk), manifest.sdk.exports);
  assert.deepEqual(Object.keys(sdk.learn), manifest.sdk.learnMethods);
});

test("canonical capability manifest keeps the frozen public counts", () => {
  assert.equal(manifest.routes.length, 24);
  assert.equal(manifest.install.skills.length, 21);
  assert.equal(manifest.install.commands.length, 16);
  assert.equal(manifest.install.agents.length, 4);
  assert.equal(manifest.mcp.tools.length, 24);
  assert.equal(manifest.mcp.learningProfileWriteTools.length, 3);
  assert.equal(manifest.sdk.exports.length, 16);
  assert.equal(manifest.sdk.learnMethods.length, 3);
});

test("canonical capability manifest rejects duplicate and unlisted write tools", () => {
  const duplicateRoute = structuredClone(manifest);
  duplicateRoute.routes.push(duplicateRoute.routes[0]);
  assert.throws(() => validateCapabilityManifest(duplicateRoute), /routes must not contain duplicates/);

  const unknownWriteTool = structuredClone(manifest);
  unknownWriteTool.mcp.learningProfileWriteTools[
    unknownWriteTool.mcp.learningProfileWriteTools.length - 1
  ] = "design_ai_unknown_write";
  assert.throws(() => validateCapabilityManifest(unknownWriteTool), /write tool is not in mcp.tools/);

  const whitespaceRoute = structuredClone(manifest);
  whitespaceRoute.routes[0] = "   ";
  assert.throws(() => validateCapabilityManifest(whitespaceRoute), /non-empty strings/);

  const missingCommand = structuredClone(manifest);
  missingCommand.install.commands.pop();
  assert.throws(() => validateCapabilityManifest(missingCommand), /must contain 16 entries/);
});

test("canonical capability manifest treats object key order as non-semantic", () => {
  const reordered = {
    sdk: manifest.sdk,
    install: manifest.install,
    schemaVersion: manifest.schemaVersion,
    routes: manifest.routes,
    mcp: manifest.mcp,
  };
  assert.strictEqual(validateCapabilityManifest(reordered), reordered);
});

test("canonical capability manifest ships inside the package tree", () => {
  assert.equal(path.relative(PACKAGE_ROOT, CAPABILITY_MANIFEST_PATH).startsWith(".."), false);
  assert.equal(manifest.schemaVersion, 1);
});
