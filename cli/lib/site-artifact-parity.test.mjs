import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { ARTIFACT_MODES } from "./artifact.mjs";
import { SITE_PROMPT_TEMPLATES } from "./site-content.mjs";
import { buildSitePrompt } from "./site-prompts.mjs";
import { createSampleSiteWorkspace } from "./site-starter.mjs";

test("Website Console exposes every shared artifact mode", () => {
  const siteModes = SITE_PROMPT_TEMPLATES
    .map((template) => template.id)
    .filter((id) => ARTIFACT_MODES.includes(id));
  assert.deepEqual(siteModes, ARTIFACT_MODES);
});

test("Website Console server artifacts preserve the shared contract", () => {
  const workspace = createSampleSiteWorkspace();
  for (const mode of ARTIFACT_MODES) {
    const markdown = buildSitePrompt(workspace, mode);
    assert.match(markdown, /## Artifact contract/);
    assert.ok(markdown.includes(`- Mode: \`${mode}\``));
    assert.match(markdown, /- Route: `website-improvement`/);
    assert.match(markdown, /## Approval boundary/);
    assert.match(markdown, /## Verification/);
  }
});

test("standalone Website Console keeps the same modes and contract headings", () => {
  const source = readFileSync(new URL("../../docs/website-console/app.js", import.meta.url), "utf8");
  for (const mode of ARTIFACT_MODES) {
    assert.ok(source.includes(`[\"${mode}\",`));
  }
  for (const heading of ["Artifact contract", "Source of truth", "Workflow", "Approval boundary", "Verification"]) {
    assert.match(source, new RegExp(`## ${heading}`));
  }
});
