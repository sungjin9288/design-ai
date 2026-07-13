import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const CONSOLE_ROOT = path.dirname(fileURLToPath(import.meta.url));

function loadApi() {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    readFileSync(path.join(CONSOLE_ROOT, "source-bundle.js"), "utf8"),
    sandbox,
  );
  return sandbox.DesignAiWebsiteConsoleSourceBundle;
}

const api = loadApi();

test("source-bundle classic script exposes the focused frozen API", () => {
  assert.equal(Object.isFrozen(api), true);
  assert.deepEqual(Object.keys(api), [
    "normalizeRunbookSourceBundle",
    "extractSourceBundleProvenancePayload",
    "extractSourceBundleRevalidationGatePayload",
    "sourceBundleNeedsRevalidation",
    "buildSourceBundleRevalidationGate",
    "buildSourceBundleJson",
    "buildSourceBundleRevalidationGateJson",
  ]);
});

test("source-bundle normalization preserves the provenance contract", () => {
  const normalized = api.normalizeRunbookSourceBundle({
    directory: "/tmp/bundle",
    valid: true,
    failureCount: "2",
    strictCheckCommand: "design-ai site bundle --bundle-check --strict",
  });

  assert.equal(normalized.directory, "/tmp/bundle");
  assert.equal(normalized.valid, true);
  assert.equal(normalized.failureCount, 2);
  assert.equal(normalized.status, "unknown");
  assert.equal(api.normalizeRunbookSourceBundle(null), null);
});

test("source-bundle payload extractors accept only their owned shapes", () => {
  const provenance = { type: "website-improvement-source-bundle-provenance", sourceBundle: { directory: "/tmp/a" } };
  assert.deepEqual(api.extractSourceBundleProvenancePayload(provenance), provenance.sourceBundle);
  assert.equal(api.extractSourceBundleProvenancePayload({ siteProfile: {}, sourceBundle: {} }), null);

  const gate = api.extractSourceBundleRevalidationGatePayload({
    type: "website-improvement-source-bundle-revalidation-gate",
    sourceBundle: { directory: "/tmp/a", valid: false },
    revalidationGate: { status: "fail", failureCount: 1, strictCheckCommand: "check" },
  });
  assert.equal(gate.directory, "/tmp/a");
  assert.equal(gate.valid, false);
  assert.equal(gate.failureCount, 1);
  assert.equal(gate.strictCheckCommand, "check");

  const forgedPass = api.extractSourceBundleRevalidationGatePayload({
    type: "website-improvement-source-bundle-revalidation-gate",
    sourceBundle: { status: "fail", valid: false },
    revalidationGate: { status: "pass/valid", valid: true, failureCount: 0 },
  });
  assert.equal(forgedPass.valid, false);
  assert.equal(api.sourceBundleNeedsRevalidation(forgedPass), true);
});

test("source-bundle revalidation matrix preserves safety decisions", () => {
  assert.equal(api.sourceBundleNeedsRevalidation(null), false);
  assert.equal(api.sourceBundleNeedsRevalidation({ valid: true, failureCount: 0 }), false);
  assert.equal(api.sourceBundleNeedsRevalidation({ valid: false, failureCount: 0 }), true);
  assert.equal(api.sourceBundleNeedsRevalidation({ valid: true, failureCount: 1 }), true);

  const missing = api.buildSourceBundleRevalidationGate(null);
  assert.equal(missing.required, false);
  assert.equal(missing.reason, "source-bundle-not-provided");

  const blocked = api.buildSourceBundleRevalidationGate({ valid: false, failureCount: 1 });
  assert.equal(blocked.required, true);
  assert.equal(blocked.reason, "revalidation-required-command-missing");

  const actionable = api.buildSourceBundleRevalidationGate({
    valid: false,
    failureCount: 1,
    strictCheckCommand: "design-ai site bundle --bundle-check --strict",
  });
  assert.equal(actionable.reason, "revalidation-required");
  assert.equal(actionable.strictCheckCommandAvailable, true);
});

test("source-bundle JSON exports keep shape and do not mutate input", () => {
  const sourceBundle = {
    directory: "/tmp/bundle",
    siteName: "Example",
    status: "pass",
    valid: true,
    failureCount: 0,
  };
  const before = structuredClone(sourceBundle);
  const provenance = JSON.parse(api.buildSourceBundleJson(sourceBundle));
  const gate = JSON.parse(api.buildSourceBundleRevalidationGateJson(sourceBundle));

  assert.deepEqual(sourceBundle, before);
  assert.deepEqual(Object.keys(provenance), ["type", "version", "source", "sourceBundle", "revalidationGate"]);
  assert.equal(provenance.type, "website-improvement-source-bundle-provenance");
  assert.equal(gate.type, "website-improvement-source-bundle-revalidation-gate");
  assert.equal(gate.sourceBundle.siteName, "Example");
});

test("Website Console loads classic deferred scripts in dependency order", () => {
  const indexPath = path.join(CONSOLE_ROOT, "index.html");
  const html = readFileSync(indexPath, "utf8");
  const contractIndex = html.indexOf('<script src="./source-bundle.js" defer></script>');
  const appIndex = html.indexOf('<script src="./app.js" defer></script>');

  assert.equal(existsSync(path.join(CONSOLE_ROOT, "source-bundle.js")), true);
  assert.equal(existsSync(path.join(CONSOLE_ROOT, "app.js")), true);
  assert.ok(contractIndex >= 0 && contractIndex < appIndex);
});

test("Website Console renders a visible failure for missing or partial contracts", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  for (const sourceBundleApi of [undefined, { normalizeRunbookSourceBundle: function () {} }]) {
    const appRoot = {
      attributes: {},
      innerHTML: "",
      setAttribute: function (name, value) {
        this.attributes[name] = value;
      },
    };
    const sandbox = {
      window: { DesignAiWebsiteConsoleSourceBundle: sourceBundleApi },
      document: {
        getElementById: function () {
          return appRoot;
        },
      },
    };

    vm.createContext(sandbox);
    assert.throws(
      () => vm.runInContext(appSource, sandbox),
      /failed to load all required functions/,
    );
    assert.equal(appRoot.attributes["data-status"], "error");
    assert.match(appRoot.innerHTML, /Website Console unavailable/);
  }
});

test("Website Console uses deterministic fallback task ids", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /id: String\(item\.id \|\| "task-" \+ \(index \+ 1\)\)/);
  assert.doesNotMatch(appSource, /task-" \+ Date\.now\(\) \+ "-" \+ index/);
});
