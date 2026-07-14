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
    "normalizeStartPlan",
    "extractStartPlanPayload",
    "buildStartPlanJson",
    "normalizeRunbookSourceBundle",
    "extractSourceBundleProvenancePayload",
    "extractSourceBundleRevalidationGatePayload",
    "sourceBundleNeedsRevalidation",
    "buildSourceBundleRevalidationGate",
    "buildSourceBundleJson",
    "buildSourceBundleRevalidationGateJson",
  ]);
});

test("start plan contract accepts read-only payloads and rejects forged execution", () => {
  const plan = {
    kind: "design-ai-start",
    schemaVersion: 1,
    brief: "Improve account settings",
    route: { id: "flow-design", label: "Feature flow design" },
    designContract: {
      kind: "design-ai-artifact",
      schemaVersion: 1,
      mode: "design-contract",
      route: { id: "flow-design" },
      markdown: "# Contract",
    },
    review: { status: "playbook-ready-not-run", executed: false },
    pathway: { status: "playbook-ready", command: "design-ai artifact implementation-plan" },
    effects: {
      performed: { reads: [], localWrites: [], targetRepoMutations: [], externalActions: [] },
      intended: { reads: [], localWrites: [], targetRepoMutations: [], externalActions: [] },
      approvalRequiredBefore: [],
    },
  };

  assert.deepEqual(api.extractStartPlanPayload(plan), plan);
  assert.notEqual(api.normalizeStartPlan(plan), plan);
  assert.deepEqual(JSON.parse(api.buildStartPlanJson(plan)), plan);
  assert.equal(api.extractStartPlanPayload({ ...plan, review: { executed: true } }), null);
  assert.equal(api.extractStartPlanPayload({ ...plan, pathway: { command: "" } }), null);
  assert.equal(api.extractStartPlanPayload({
    ...plan,
    effects: { ...plan.effects, intended: { reads: [] } },
  }), null);
  assert.equal(api.extractStartPlanPayload({
    ...plan,
    effects: {
      ...plan.effects,
      performed: {
        ...plan.effects.performed,
        reads: [{ kind: "target-repository", reference: "/tmp/app" }],
      },
    },
  }), null);
  assert.equal(api.extractStartPlanPayload({
    ...plan,
    effects: {
      ...plan.effects,
      performed: { ...plan.effects.performed, targetRepoMutations: ["unexpected"] },
    },
  }), null);
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

test("Website Console imports and labels linked preview readiness without claiming runtime verification", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /website-improvement-linked-preview/);
  assert.match(appSource, /Import start, workspace, runbook, or preview JSON/);
  assert.match(appSource, /No process started by design-ai/);
  assert.match(appSource, /A configured URL is not browser verification/);
  assert.match(appSource, /Linked preview readiness JSON imported\. Report tab opened\./);
  assert.match(appSource, /no process start, external call, source scan, or target-repo mutation/);
});

test("Website Console imports start JSON without claiming reference inspection or execution", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /Read-only start JSON imported\. Start tab opened\./);
  assert.match(appSource, /0 inspected by start/);
  assert.match(appSource, /No repository scan/);
  assert.match(appSource, /No browser request/);
  assert.match(appSource, /No target mutation/);
  assert.doesNotMatch(appSource, /data-action="execute-start/);
});
