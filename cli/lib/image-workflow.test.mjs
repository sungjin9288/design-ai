import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { PROMPT_GUIDE_SOURCE_REPOSITORY, PROMPT_GUIDE_UPSTREAM_COMMIT } from "./image-prompt-contract.mjs";
import { createImageAssetStore, hashImagePrompt } from "./image-asset-manifest.mjs";
import { createImageWorkflow, ImageDraftError } from "./image-workflow.mjs";

const provenance = { sourceRepository: PROMPT_GUIDE_SOURCE_REPOSITORY, upstreamCommit: PROMPT_GUIDE_UPSTREAM_COMMIT, catalogVersion: "2026.08", overlayVersions: {} };
const base = { taskType: "generation", domain: "manufacturing", outputType: "architecture", intent: "diagram", language: "ko", exactTexts: [], styles: [], scenes: [], constraints: [], negativeConstraints: ["no people"], preserve: [], modify: [], remove: [], add: [], mustNotChange: [], referenceAssetIds: [], metadata: {} };
const pngBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const sourceManifest = { assetId: "source-1", jobId: "source-job", taskType: "generation", sourceAssetIds: [], promptId: "source-prompt", selectedTemplateId: "architecture", selectedTemplateVersion: "1", catalogVersion: "2026.08", acceptedResponseVersion: "v1", compiledPromptHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", provider: "test", model: "test", providerParameters: { size: "1:1", quality: "standard" }, provenance, createdAt: "2026-08-27T00:00:00.000Z", createdBy: "test", reviewStatus: "draft", rightsStatus: "original-generated" };
const editingFixture = JSON.parse(await readFile(new URL("../../examples/image-prompts/editing.json", import.meta.url), "utf8"));
function fakeClient({ fail = false, drift = false } = {}) {
  return {
    recommend: async (request) => { if (fail) throw new Error("Prompt Guide failed"); return { taskType: drift ? "editing" : request.taskType, language: request.language, selectedTemplateId: "architecture", selectedTemplateVersion: "1", catalogVersion: "2026.08", reason: "match", provenance, responseVersion: "v1" }; },
    compose: async (request) => ({ promptId: "prompt", taskType: request.taskType, selectedTemplateId: "architecture", selectedTemplateVersion: "1", catalogVersion: "2026.08", language: request.language, compiledPrompt: "approved prompt", promptBlocks: [], negativeConstraints: [], evaluationCriteria: [], provenance, responseVersion: "v1", createdAt: "2026-08-27T00:00:00.000Z" }),
    validate: async () => ({ valid: true, errors: [], warnings: [], responseVersion: "v1" }),
  };
}
function providerStub(counter) { return async () => { counter.calls += 1; return { provider: "test", model: "test-model", mediaType: "image/png", bytes: pngBytes }; }; }
async function seededStore() {
  const root = await mkdtemp(path.join(tmpdir(), "image-workflow-")); const store = createImageAssetStore({ root });
  await store.persist({ manifest: sourceManifest, mediaType: "image/png", bytes: pngBytes });
  return store;
}
async function workflow(options = {}) {
  const counter = { calls: 0 }; const assetStore = await seededStore();
  return { counter, flow: createImageWorkflow({ client: fakeClient(options), provider: { command: "fake", args: [], provider: "test" }, executeProvider: providerStub(counter), assetStore, idFactory: (() => { let id = 0; return () => `asset-${++id}`; })() }) };
}
test("12. Generation calls provider only after valid draft and explicit approval", async () => {
  const { flow, counter } = await workflow(); const draft = await flow.composeDraft(base); assert.equal(Object.prototype.hasOwnProperty.call(draft.compiled, "promptBlocks"), false); assert.equal(Object.prototype.hasOwnProperty.call(draft.compiled, "evaluationCriteria"), false); assert.deepEqual(draft.output, { size: "1:1", quality: "standard" }); await assert.rejects(() => flow.executeDraft(draft.draftId), ImageDraftError); assert.equal(counter.calls, 0); const job = await flow.executeDraft(draft.draftId, { approved: true }); assert.equal(job.status, "succeeded"); assert.equal(counter.calls, 1);
});
test("13. Prompt Guide failure creates zero provider calls", async () => {
  const { flow, counter } = await workflow({ fail: true }); await assert.rejects(() => flow.composeDraft(base)); assert.equal(counter.calls, 0);
});
test("generation rejects editing instructions and false source lineage before Prompt Guide calls", async () => {
  const { flow, counter } = await workflow();
  await assert.rejects(() => flow.composeDraft({ ...base, referenceAssetIds: ["source-1"] }), /generation requests/);
  assert.equal(counter.calls, 0);
});
test("14. Editing resolves stored assets and forwards only reference descriptors", async () => {
  const { flow, counter } = await workflow(); const draft = await flow.composeDraft({ ...base, taskType: "editing", referenceAssetIds: ["source-1"], preserve: ["ratio"], modify: ["agent"], remove: ["person"], add: ["label"], mustNotChange: ["hierarchy"] }); const job = await flow.executeDraft(draft.draftId, { approved: true }); assert.deepEqual(job.manifest.sourceAssetIds, ["source-1"]); assert.equal(counter.calls, 1);
});
test("15. Manifest saves template/catalog version and sha256-prefixed prompt hash", async () => {
  const { flow } = await workflow(); const draft = await flow.composeDraft(base); const job = await flow.executeDraft(draft.draftId, { approved: true }); assert.equal(job.manifest.selectedTemplateVersion, "1"); assert.equal(job.manifest.catalogVersion, "2026.08"); assert.match(job.manifest.compiledPromptHash, /^sha256:[a-f0-9]{64}$/);
});
test("16. Manifest retains only pinned upstream provenance and accepted v1", async () => {
  const { flow } = await workflow(); const draft = await flow.composeDraft(base); const job = await flow.executeDraft(draft.draftId, { approved: true }); assert.equal(job.manifest.provenance.upstreamCommit, PROMPT_GUIDE_UPSTREAM_COMMIT); assert.equal(job.manifest.acceptedResponseVersion, "v1");
});
test("17. Manifest excludes secrets and raw provider responses", async () => {
  const { flow } = await workflow(); const draft = await flow.composeDraft(base); const job = await flow.executeDraft(draft.draftId, { approved: true }); const serialized = JSON.stringify(job.manifest); assert.equal(serialized.includes("secret"), false); assert.equal(serialized.includes("rawProviderResponse"), false);
});
test("lineage drift and missing editing assets fail before draft, job, or provider mutation", async () => {
  const { flow, counter } = await workflow({ drift: true }); await assert.rejects(() => flow.composeDraft(base), /lineage drift/); assert.equal(counter.calls, 0);
  let recommendCalls = 0; const missing = createImageWorkflow({ client: { ...fakeClient(), recommend: async () => { recommendCalls += 1; } }, provider: { command: "fake", args: [] }, assetStore: { getReferenceDescriptor: async () => null, list: async () => [], get: async () => null } });
  await assert.rejects(() => missing.composeDraft({ ...base, taskType: "editing", referenceAssetIds: ["unknown"] }), ImageDraftError); assert.equal(recommendCalls, 0);
});
test("recommendation and compiled provenance overlay drift fails before draft creation", async () => {
  const source = fakeClient(); const client = { ...source, compose: async (request) => ({ ...(await source.compose(request)), provenance: { ...provenance, overlayVersions: { compiled: "different" } } }) };
  const assetStore = await seededStore(); const flow = createImageWorkflow({ client, provider: { command: "fake", args: [] }, assetStore });
  await assert.rejects(() => flow.composeDraft(base), /provenance overlay versions/);
});
test("draft flow carries one correlation ID through recommend, compose, and validate", async () => {
  const calls = []; const source = fakeClient();
  const client = {
    recommend: async (...args) => { calls.push({ operation: "recommend", options: args[1] }); return source.recommend(...args); },
    compose: async (...args) => { calls.push({ operation: "compose", options: args[1] }); return source.compose(...args); },
    validate: async (...args) => { calls.push({ operation: "validate", options: args[1] }); return source.validate(...args); },
  };
  const assetStore = await seededStore(); const flow = createImageWorkflow({ client, provider: { command: "fake", args: [] }, assetStore });
  await flow.composeDraft(base, { requestId: "request-1", correlationId: "correlation-1" });
  assert.deepEqual(calls.map(({ operation, options }) => [operation, options.requestId, options.correlationId]), [["recommend", "request-1", "correlation-1"], ["compose", "request-1", "correlation-1"], ["validate", "request-1", "correlation-1"]]);
});
test("editing references are revalidated immediately before provider execution", async () => {
  let lookups = 0; const store = { root: "/tmp", getReferenceDescriptor: async () => (++lookups === 1 ? { assetId: "source", assetPath: "/tmp/source.png", mediaType: "image/png", byteSize: 1, sha256: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" } : null), list: async () => [], get: async () => null };
  let providerCalls = 0; const flow = createImageWorkflow({ client: fakeClient(), provider: { command: "fake", args: [] }, assetStore: store, executeProvider: async () => { providerCalls += 1; } });
  const draft = await flow.composeDraft({ ...base, taskType: "editing", referenceAssetIds: ["source"] }); await assert.rejects(() => flow.executeDraft(draft.draftId, { approved: true }), ImageDraftError); assert.equal(providerCalls, 0);
});
test("editing approval rejects coherently replaced source bytes before consuming a draft or creating a job", async () => {
  const store = await seededStore(); const counter = { calls: 0 }; let ids = 0;
  const flow = createImageWorkflow({ client: fakeClient(), assetStore: store, executeProvider: providerStub(counter), idFactory: () => `replacement-${++ids}` });
  const draft = await flow.composeDraft({ ...base, taskType: "editing", referenceAssetIds: ["source-1"] });
  const descriptor = await store.getReferenceDescriptor("source-1");
  const manifestPath = path.join(store.root, "source-1", "manifest.json");
  const originalManifest = await readFile(manifestPath, "utf8");
  const replacementBytes = Buffer.concat([pngBytes, Buffer.from("replacement")]);
  await writeFile(descriptor.assetPath, replacementBytes);
  await writeFile(manifestPath, JSON.stringify({ ...JSON.parse(originalManifest), byteSize: replacementBytes.length, sha256: hashImagePrompt(replacementBytes) }));
  assert.ok(await store.getReferenceDescriptor("source-1"));
  await assert.rejects(() => flow.executeDraft(draft.draftId, { approved: true }), /source assets changed since draft composition/);
  assert.equal(counter.calls, 0); assert.equal(ids, 1); assert.equal(flow.getDraft(draft.draftId).executable, true);
  await writeFile(descriptor.assetPath, pngBytes); await writeFile(manifestPath, originalManifest);
  assert.equal((await flow.executeDraft(draft.draftId, { approved: true })).status, "succeeded");
  assert.equal(counter.calls, 1);
});
test("editing draft retains its descriptor snapshot when an asset store reuses a mutable object", async () => {
  const descriptor = { assetId: "source", assetPath: "/tmp/source.png", mediaType: "image/png", byteSize: 1, sha256: `sha256:${"a".repeat(64)}` };
  const counter = { calls: 0 };
  const flow = createImageWorkflow({ client: fakeClient(), assetStore: { root: "/tmp", getReferenceDescriptor: async () => descriptor }, executeProvider: providerStub(counter) });
  const draft = await flow.composeDraft({ ...base, taskType: "editing", referenceAssetIds: ["source"] });
  descriptor.sha256 = `sha256:${"b".repeat(64)}`;
  await assert.rejects(() => flow.executeDraft(draft.draftId, { approved: true }), /source assets changed since draft composition/);
  assert.equal(counter.calls, 0); assert.equal(flow.getDraft(draft.draftId).executable, true);
});
test("editing fixture injects the stored source only at runtime", async () => {
  const { flow, counter } = await workflow();
  const request = { ...editingFixture, referenceAssetIds: ["source-1"] };
  const draft = await flow.composeDraft(request);
  const job = await flow.executeDraft(draft.draftId, { approved: true });
  assert.equal(job.manifest.sourceAssetIds[0], "source-1");
  assert.equal(counter.calls, 1);
});
test("editing descriptors reject changed image bytes and manifest metadata", async () => {
  const store = await seededStore();
  const descriptor = await store.getReferenceDescriptor("source-1");
  assert.ok(descriptor);
  const originalBytes = await readFile(descriptor.assetPath);
  await writeFile(descriptor.assetPath, Buffer.concat([originalBytes, Buffer.from("changed")]));
  assert.equal(await store.getReferenceDescriptor("source-1"), null);
  await writeFile(descriptor.assetPath, originalBytes);
  const manifestPath = path.join(store.root, "source-1", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await writeFile(manifestPath, `${JSON.stringify({ ...manifest, byteSize: manifest.byteSize + 1 })}\n`);
  assert.equal(await store.getReferenceDescriptor("source-1"), null);
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
  assert.ok(await store.getReferenceDescriptor("source-1"));
});
test("asset persistence rejects unsafe IDs and extra payloads, and reads revalidate manifests", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "image-manifest-")); const store = createImageAssetStore({ root });
  await assert.rejects(() => store.persist({ manifest: { ...sourceManifest, assetId: "../../escape" }, mediaType: "image/png", bytes: pngBytes }), /safe identifiers/);
  await assert.rejects(() => store.persist({ manifest: { ...sourceManifest, assetId: "extra", providerResponse: { raw: true } }, mediaType: "image/png", bytes: pngBytes }), /unsupported field/);
  await assert.rejects(() => store.persist({ manifest: { ...sourceManifest, assetId: "false-lineage", sourceAssetIds: ["source-1"] }, mediaType: "image/png", bytes: pngBytes }), /must not claim/);
  await store.persist({ manifest: sourceManifest, mediaType: "image/png", bytes: pngBytes });
  await store.persist({ manifest: { ...sourceManifest, assetId: "source-2", jobId: "source-job-2" }, mediaType: "image/png", bytes: pngBytes });
  const manifestPath = path.join(root, "source-1", "manifest.json"); const stored = JSON.parse(await readFile(manifestPath, "utf8"));
  await writeFile(manifestPath, `${JSON.stringify({ ...stored, createdAt: 123, providerResponse: { raw: true } })}\n`);
  assert.equal(await store.get("source-1"), null); assert.equal(await store.get(123), null); assert.equal(await store.getReferenceDescriptor("source-1"), null);
  assert.deepEqual((await store.list()).map((item) => item.assetId), ["source-2"]);
});
