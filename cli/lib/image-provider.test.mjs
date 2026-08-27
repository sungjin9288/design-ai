import assert from "node:assert/strict";
import { test } from "node:test";
import { assertProviderInput, executeImageProvider, ImageProviderConfigurationError, ImageProviderError, providerFromEnvironment } from "./image-provider.mjs";

const input = { prompt: "prompt", negativeConstraints: ["no text"], size: "16:9", quality: "standard", referenceAssets: [], providerOptions: {} };
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
test("provider adapter receives exactly the separated provider input object", async () => {
  let received; const result = await executeImageProvider({ provider: { command: "/fake", args: [], provider: "test", timeoutMs: 100 }, input, spawnRunner: async (value) => { received = JSON.parse(value.input); return { status: 0, stdout: JSON.stringify({ mediaType: "image/png", dataBase64: pngBase64, model: "test-model", parameters: { raw: "ignored" } }) }; } });
  assert.deepEqual(received, input); assert.equal(result.provider, "test");
  assert.equal(Object.prototype.hasOwnProperty.call(result, "parameters"), false);
});
test("provider environment strips every PROMPT_GUIDE variable but preserves provider credentials", async () => {
  let childEnv; await executeImageProvider({ provider: { command: "/fake", args: [], provider: "test", timeoutMs: 100 }, input, environment: { PROMPT_GUIDE_API_KEY: "never", PROMPT_GUIDE_MODE: "live", UNRELATED_SECRET: "never", IMAGE_PROVIDER_TOKEN: "provider-only", PATH: "/bin" }, spawnRunner: async (value) => { childEnv = value.env; return { status: 0, stdout: JSON.stringify({ mediaType: "image/png", dataBase64: pngBase64, model: "test-model" }) }; } });
  assert.equal(Object.keys(childEnv).some((key) => key.startsWith("PROMPT_GUIDE_")), false); assert.equal(childEnv.IMAGE_PROVIDER_TOKEN, "provider-only");
  assert.equal(childEnv.UNRELATED_SECRET, undefined);
});
test("provider rejects malformed input and invalid timeout configuration", () => {
  assert.throws(() => assertProviderInput({ ...input, apiKey: "no" }), ImageProviderError);
  assert.throws(() => assertProviderInput({ ...input, referenceAssets: [{ assetId: "a", mediaType: "image/png", byteSize: 1, sha256: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", storagePayload: "never" }] }), ImageProviderError);
  assert.throws(() => providerFromEnvironment({ IMAGE_PROVIDER_COMMAND: "fake", IMAGE_PROVIDER_TIMEOUT_MS: "1" }), ImageProviderConfigurationError);
  assert.throws(() => providerFromEnvironment({ IMAGE_PROVIDER_COMMAND: "relative-adapter", IMAGE_PROVIDER_TIMEOUT_MS: "100" }), /absolute executable path/);
});
test("provider accepts one exact in-root reference descriptor and rejects out-of-root paths", () => {
  const descriptor = { assetId: "source-1", assetPath: "/tmp/assets/source-1/asset.png", mediaType: "image/png", byteSize: 1, sha256: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
  assert.doesNotThrow(() => assertProviderInput({ ...input, referenceAssets: [descriptor] }, { assetRoot: "/tmp/assets" }));
  assert.throws(() => assertProviderInput({ ...input, referenceAssets: [{ ...descriptor, assetPath: "/tmp/other/asset.png" }] }, { assetRoot: "/tmp/assets" }), ImageProviderError);
});
test("provider rejects media bytes that do not match the declared image type", async () => {
  await assert.rejects(() => executeImageProvider({ provider: { command: "/fake", args: [], timeoutMs: 100 }, input, spawnRunner: async () => ({ status: 0, stdout: JSON.stringify({ mediaType: "image/png", dataBase64: Buffer.from("not-an-image").toString("base64"), model: "test-model" }) }) }), /do not match/);
});
test("provider boundary names independent stdout and stderr caps and keeps shell disabled", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("./image-provider.mjs", import.meta.url), "utf8"));
  assert.match(source, /stdout exceeds the size limit/); assert.match(source, /stderr exceeds the size limit/); assert.match(source, /shell: false/);
});
