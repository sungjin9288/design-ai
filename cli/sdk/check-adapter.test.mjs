// Tests for cli/sdk/check-adapter.mjs — option defaults, determinism, input
// validation, and parity with `design-ai check --stdin --json`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { check } from "./check-adapter.mjs";
import { PACKAGE_ROOT } from "../lib/paths.mjs";

const ARTIFACT = [
  "# Button component spec",
  "",
  "## Anatomy",
  "The button has a label slot and an icon slot.",
  "",
  "## Variants and states",
  "Primary, secondary, disabled, and hover states are defined.",
  "",
  "## API",
  "Props: variant, size, disabled. See knowledge/components/INDEX.md for tokens.",
  "",
  "Contrast ratio is 4.5:1 for text on background.",
  "Keyboard focus and tab order are preserved; screen reader aria-label is set.",
  "Responsive on mobile and desktop with a minimum touch target.",
  "Don't use the disabled state as the only affordance for a loading action.",
].join("\n");

test("check rejects non-string or empty artifacts", () => {
  assert.throws(() => check(42), /artifact must be a non-empty string/);
  assert.throws(() => check(""), /artifact must be a non-empty string/);
});

test("check rejects a non-object opts bag", () => {
  assert.throws(() => check(ARTIFACT, 5), /check options must be a plain object/);
});

test("check validates routeId against the known route catalog", () => {
  assert.throws(() => check(ARTIFACT, { routeId: "not-a-real-route" }), /Unknown route id/);
});

test("check validates strict is a boolean but never affects the returned report", () => {
  assert.throws(() => check(ARTIFACT, { strict: "yes" }), /strict must be a boolean/);
  assert.deepEqual(check(ARTIFACT, { strict: true }), check(ARTIFACT, { strict: false }));
});

test("check defaults routeId to unset (no route-specific checks)", () => {
  const withDefaults = check(ARTIFACT);
  const explicit = check(ARTIFACT, { routeId: "" });
  assert.deepEqual(withDefaults, explicit);
  assert.equal(Object.hasOwn(withDefaults, "routeId"), false);
});

test("check with a routeId adds route-specific requirement results", () => {
  const result = check(ARTIFACT, { routeId: "component-spec" });
  assert.equal(result.routeId, "component-spec");
  assert.ok(result.results.some((item) => item.id.startsWith("route-component-spec-")));
});

test("check is deterministic: same input produces the same output", () => {
  const first = check(ARTIFACT, { routeId: "component-spec" });
  const second = check(ARTIFACT, { routeId: "component-spec" });
  assert.deepEqual(first, second);
});

test("check matches the CLI --stdin --json output for a fixed artifact", () => {
  const cliPath = path.join(PACKAGE_ROOT, "cli/bin/design-ai.mjs");
  const result = spawnSync(
    process.execPath,
    [cliPath, "check", "--stdin", "--route", "component-spec", "--json"],
    {
      input: ARTIFACT,
      encoding: "utf8",
      env: { ...process.env },
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const cliPayload = JSON.parse(result.stdout);
  const sdkResult = check(ARTIFACT, { routeId: "component-spec" });
  // filePath differs by construction ("stdin" for the CLI vs "sdk" here); compare
  // everything else, which is the actual check-report contract.
  assert.deepEqual({ ...sdkResult, filePath: undefined }, { ...cliPayload, filePath: undefined });
});
