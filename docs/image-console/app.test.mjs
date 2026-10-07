import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

const flush = () => new Promise((resolve) => setImmediate(resolve));

function element(id = "") {
  const handlers = new Map();
  return {
    value: "", checked: false, disabled: false, hidden: false, textContent: "", children: [],
    dataset: { mode: id === "editing-panel" ? "editing" : "generation" },
    addEventListener(type, handler) { handlers.set(type, handler); },
    dispatch(type, extra = {}) { return handlers.get(type)?.({ preventDefault() {}, currentTarget: this, ...extra }); },
    reportValidity() { return true; },
    setAttribute() {}, focus() {},
    replaceChildren() { this.children = []; this.value = ""; },
    append(...nodes) { this.children.push(...nodes); },
  };
}

async function consoleHarness() {
  const elements = new Map();
  const pending = [];
  const assets = [{ assetId: "source-1" }, { assetId: "source-2" }];
  let assetError = null;
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  const context = {
    window: {},
    document: { getElementById: get, createElement: () => element() },
    FormData: class { entries() { return Object.entries({ intent: "test", domain: "test", outputType: "test", language: "ko" }); } },
    fetch(url, options) {
      if (url === "/api/image/assets") return Promise.resolve({ ok: !assetError, json: async () => assetError || ({ assets }) });
      return new Promise((resolve) => pending.push({ url, body: JSON.parse(options.body), resolve }));
    },
  };
  vm.createContext(context);
  for (const file of ["contract.js", "app.js"]) vm.runInContext(readFileSync(new URL(file, import.meta.url), "utf8"), context);
  await flush();
  function respond(url, payload, ok = true) {
    const index = pending.findIndex((request) => request.url === url);
    assert.notEqual(index, -1, `expected pending request: ${url}`);
    const [request] = pending.splice(index, 1);
    request.resolve({ ok, json: async () => payload });
    return request.body;
  }
  async function compose(id) {
    get("generation-panel").dispatch("submit");
    respond("/api/image/compose", {
      draftId: id, compiled: { compiledPrompt: `prompt-${id}`, responseVersion: "v1" },
      recommendation: { selectedTemplateId: "test", selectedTemplateVersion: "1", catalogVersion: "mock-v1", reason: "test" },
      output: { size: "1:1", quality: "standard" }, validation: { valid: true },
    });
    await flush();
  }
  function execute() {
    get("draft-approval").checked = true;
    get("draft-approval").dispatch("change");
    return get("execute-draft").dispatch("click");
  }
  return { get, pending, assets, respond, compose, execute, failAssets: () => { assetError = { error: { message: "Local asset listing failed" } }; } };
}

test("execution consumes the visible approval immediately and ignores repeated clicks", async () => {
  const ui = await consoleHarness();
  await ui.compose("first");
  const execution = ui.execute();
  assert.equal(ui.get("draft-approval").disabled, true);
  assert.equal(ui.get("draft-approval").checked, false);
  ui.get("execute-draft").dispatch("click");
  assert.equal(ui.pending.filter((request) => request.url === "/api/image/jobs").length, 1);
  assert.deepEqual(ui.respond("/api/image/jobs", { assetId: "result-1" }), { draftId: "first", approved: true });
  await execution;
  assert.equal(ui.get("execute-draft").disabled, true);
  assert.match(ui.get("status").textContent, /result-1/);
});

for (const succeeds of [true, false]) {
  test(`old execution ${succeeds ? "success" : "failure"} cannot overwrite a newer draft`, async () => {
    const ui = await consoleHarness();
    await ui.compose("first");
    const execution = ui.execute();
    ui.get("generation-panel").dispatch("input");
    await ui.compose("second");
    const status = ui.get("status").textContent;
    ui.respond("/api/image/jobs", succeeds ? { assetId: "old-result" } : { error: { message: "old failure" } }, succeeds);
    await execution;
    await flush();
    assert.equal(ui.get("compiled-prompt").value, "prompt-second");
    assert.equal(ui.get("draft-approval").disabled, false);
    assert.equal(ui.get("status").textContent, status);
    assert.equal(ui.get("error").hidden, true);
    const newerExecution = ui.execute();
    assert.equal(ui.respond("/api/image/jobs", { assetId: "new-result" }).draftId, "second");
    await newerExecution;
  });
}

test("completed job refresh preserves a source selected for a newer edit", async () => {
  const ui = await consoleHarness();
  await ui.compose("first");
  const execution = ui.execute();
  ui.get("editing-tab").dispatch("click");
  ui.get("reference-asset-id").value = "source-2";
  ui.assets.push({ assetId: "new-result" });
  ui.respond("/api/image/jobs", { assetId: "new-result" });
  await execution;
  await flush();
  assert.equal(ui.get("reference-asset-id").value, "source-2");
  assert.equal(ui.get("reference-asset-id").children.length, 4);
  assert.equal(ui.get("status").textContent, "Complete a form to create a draft.");
});

test("current execution failure requires composing and approving a fresh draft", async () => {
  const ui = await consoleHarness();
  await ui.compose("first");
  const execution = ui.execute();
  ui.respond("/api/image/jobs", { error: { message: "provider failed" } }, false);
  await execution;
  assert.equal(ui.get("draft-approval").disabled, true);
  assert.equal(ui.get("execute-draft").disabled, true);
  assert.match(ui.get("status").textContent, /Compose a new draft/);
  assert.equal(ui.get("error").hidden, false);
});

test("asset refresh failure invalidates an active edit and keeps its actionable error visible", async () => {
  const ui = await consoleHarness();
  await ui.compose("first");
  const execution = ui.execute();
  ui.get("editing-tab").dispatch("click");
  await ui.compose("newer");
  ui.failAssets();
  ui.respond("/api/image/jobs", { assetId: "old-result" });
  await execution;
  await flush();
  assert.equal(ui.get("reference-asset-id").disabled, true);
  assert.equal(ui.get("draft-approval").disabled, true);
  assert.equal(ui.get("error").hidden, false);
  assert.equal(ui.get("error").textContent, "Local asset listing failed");
});

test("missing required fields keep a named, persistent error and mark only the empty fields", async () => {
  const ui = await consoleHarness();
  const attributes = new Map();
  const field = (name, caption, valid) => ({
    name, disabled: false, checkValidity: () => valid,
    closest: () => ({ querySelector: () => ({ textContent: `  ${caption}  ` }) }),
    setAttribute: (key, value) => attributes.set(`${name}:${key}`, value),
  });
  const form = ui.get("generation-panel");
  form.querySelectorAll = () => [field("intent", "Purpose", false), field("domain", "Domain", true), field("outputType", "Output type", false)];
  let nativeReport = 0;
  form.reportValidity = () => { nativeReport += 1; return false; };
  form.dispatch("submit");
  await flush();
  assert.equal(nativeReport, 1, "the native bubble and focus move still run");
  assert.equal(ui.pending.filter((request) => request.url === "/api/image/compose").length, 0, "no draft request is sent");
  assert.equal(ui.get("error").hidden, false);
  assert.equal(ui.get("error").textContent, "Fill in Purpose, Output type to compose the draft.");
  assert.deepEqual([...attributes.keys()].sort(), ["intent:aria-invalid", "outputType:aria-invalid"]);

  let removed = null;
  form.dispatch("input", { target: { removeAttribute: (key) => { removed = key; } } });
  assert.equal(removed, "aria-invalid", "typing into a flagged field clears its invalid state");
});

test("a completed job names the saved asset and the next step", async () => {
  const ui = await consoleHarness();
  await ui.compose("first");
  const execution = ui.execute();
  ui.respond("/api/image/jobs", { assetId: "result-1" });
  await execution;
  assert.equal(ui.get("status").textContent, "Image generated and saved as draft asset result-1. Select it under Edit an asset to refine it.");
});
