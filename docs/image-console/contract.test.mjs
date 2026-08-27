import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";

const here = path.dirname(new URL(import.meta.url).pathname);
const context = { window: {} };
vm.runInNewContext(readFileSync(new URL("./contract.js", import.meta.url), "utf8"), context);
const contract = context.window.DesignAiImageConsoleContract;
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

test("generation and editing console forms keep distinct request contracts", () => {
  const generation = contract.buildGenerationRequest({ intent: "draw", domain: "manufacturing", outputType: "architecture", language: "ko", exactTexts: "A\nB" });
  const editing = contract.buildEditingRequest({ intent: "edit", domain: "architecture", outputType: "architecture_edit", language: "ko", referenceAssetId: "asset-1", preserve: "ratio", modify: "agent", remove: "person", add: "label", mustNotChange: "hierarchy" });
  assert.equal(generation.taskType, "generation"); assert.equal(editing.taskType, "editing"); assert.deepEqual(Array.from(editing.referenceAssetIds), ["asset-1"]); assert.deepEqual(Array.from(editing.mustNotChange), ["hierarchy"]);
});
test("2. Every shipped browser asset contains no Prompt Guide secret or Authorization path", () => {
  const browserAssets = [...walk(here), path.resolve(here, "../website-console/styles.css")].filter((file) => /\.(?:html|css|js)$/.test(file));
  const combined = browserAssets.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.equal(/PROMPT_GUIDE_(?:API_KEY|BASE_URL|MODE|TIMEOUT_MS)/.test(combined), false); assert.equal(/Authorization/.test(combined), false);
});
test("ARIA tabs use roving tabindex and the full keyboard pattern", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8"); const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(html, /role="tablist"/); assert.match(html, /role="tab" tabindex="0"/); assert.match(html, /role="tab" tabindex="-1"/);
  for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) assert.match(app, new RegExp(key));
});
test("console supplies live status/errors, visible shared focus, 44px targets, and responsive separation", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8"); const app = readFileSync(new URL("./app.js", import.meta.url), "utf8"); const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8"); const sharedCss = readFileSync(new URL("../website-console/styles.css", import.meta.url), "utf8");
  assert.match(html, /role="status" aria-live="polite"/); assert.match(html, /role="alert" aria-live="assertive"/); assert.match(html, /readonly aria-readonly="true"/); assert.match(html, /name="referenceAssetId"/);
  assert.match(css, /min-height: 44px/); assert.match(css, /grid-template-columns: 112px minmax\(0, 1fr\)/); assert.match(css, /max-width: 840px/); assert.match(css, /grid-template-columns: 1fr/); assert.match(css, /var\(--accent\)/); assert.match(sharedCss, /:focus-visible[\s\S]*outline: 3px/);
  assert.match(app, /function invalidateDraft/); assert.match(app, /state\.revision \+= 1/); assert.match(app, /revision !== state\.revision/); assert.match(app, /addEventListener\("input", invalidateDraft\)/); assert.match(app, /Compose a new draft before trying again/);
  assert.match(app, /No local source asset is available\. Generate and save an image before starting an edit\./); assert.match(html, /rel="icon" href="data:,"/);
  assert.doesNotMatch(readFileSync(new URL("./app.js", import.meta.url), "utf8"), /asset\.outputType/);
});
test("fixtures retain the exact requested generation and editing payloads", () => {
  const generation = JSON.parse(readFileSync(path.resolve(here, "../../examples/image-prompts/generation.json"), "utf8"));
  const editing = JSON.parse(readFileSync(path.resolve(here, "../../examples/image-prompts/editing.json"), "utf8"));
  assert.deepEqual(generation, { taskType: "generation", domain: "manufacturing", outputType: "multi_agent_architecture", intent: "중소제조용 Multi AI Agent 플랫폼 Architecture", audience: "공공기관 및 제조기업 의사결정자", language: "ko", aspectRatio: "16:9", exactTexts: ["지능형 통합관제 Orchestrator", "Digital Twin", "품질 Simulator", "Execution Gateway"], constraints: ["Orchestrator를 가장 크게 표현", "Integration & Data Fabric은 작고 단순하게 표현", "흰색 배경"], negativeConstraints: ["관리자와 운영자 도형 금지", "현실적인 공장 사진 금지", "긴 문단 금지"] });
  assert.deepEqual(editing, { taskType: "editing", domain: "architecture", outputType: "architecture_edit", intent: "기존 Architecture 구조를 유지하면서 핵심 Agent 영역 확대", language: "ko", aspectRatio: "16:9", preserve: ["전체 비율", "기존 Label", "Platform Core 연결 관계"], modify: ["상단 Agent 영역 확대", "Orchestrator 강조", "Integration Layer 축소"], remove: ["관리자 도형", "운영자 도형"], mustNotChange: ["Digital Twin과 품질 Simulator의 계층 관계"] });
  const runtimeRequest = contract.buildEditingRequest({ ...editing, referenceAssetId: "stored-source-1" });
  assert.deepEqual(Array.from(runtimeRequest.referenceAssetIds), ["stored-source-1"]);
});
test("19. Package-bound paths and contents add no upstream catalog, template, case, image, source, API, or Supabase material", () => {
  const roots = [path.resolve(here, "../../cli"), path.resolve(here), path.resolve(here, "../../examples/image-prompts")];
  const files = roots.flatMap(walk); const pathsAndContents = files.map((file) => `${file}\n${readFileSync(file, "utf8")}`).join("\n");
  assert.equal(/awesome-gpt-image-2\/(?:cases|images|catalog|templates|src|api|supabase)/i.test(pathsAndContents), false);
});
