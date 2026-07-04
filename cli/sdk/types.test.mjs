// Guard: the hand-written index.d.ts stays in sync with the runtime exports.
// Zero-dependency — no TypeScript toolchain. It parses the declaration file for
// `export function <name>` and asserts that set is exactly the runtime SDK
// surface, so adding/removing/renaming a verb without updating the types (or
// vice versa) fails here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import * as sdk from "./index.mjs";

const dtsPath = fileURLToPath(new URL("./index.d.ts", import.meta.url));
const dts = readFileSync(dtsPath, "utf8");

function declaredFunctionNames(source) {
  const names = new Set();
  const re = /export function (\w+)\s*\(/g;
  let match;
  while ((match = re.exec(source)) !== null) names.add(match[1]);
  return names;
}

test("index.d.ts declares exactly the runtime SDK verbs", () => {
  const runtime = Object.keys(sdk)
    .filter((name) => typeof sdk[name] === "function")
    .sort();
  const declared = [...declaredFunctionNames(dts)].sort();
  assert.deepEqual(declared, runtime);
});

test("every runtime verb has at least one function declaration", () => {
  const declared = declaredFunctionNames(dts);
  for (const name of Object.keys(sdk)) {
    if (typeof sdk[name] !== "function") continue;
    assert.ok(declared.has(name), `index.d.ts is missing a declaration for ${name}()`);
  }
});
