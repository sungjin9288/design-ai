import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { PACKAGE_ROOT } from "./paths.mjs";
import {
  buildReviewReport,
  parseReviewArgs,
  renderReviewMarkdown,
} from "./review.mjs";

test("review parser keeps source, context, and repeated evidence explicit", () => {
  assert.deepEqual(parseReviewArgs([
    "page.html",
    "--brief", "Review settings",
    "--locale", "ko-KR",
    "--viewport", "mobile",
    "--viewport", "desktop",
    "--review-pack", "korean-fintech",
    "--local-path", "/tmp/app",
    "--screenshot", "before.png",
    "--json",
  ]), {
    sourcePath: "page.html",
    brief: "Review settings",
    name: "",
    locale: "ko-KR",
    viewports: ["mobile", "desktop"],
    reviewPack: "korean-fintech",
    siteName: "",
    repoUrl: "",
    localPath: "/tmp/app",
    url: "",
    screenshots: ["before.png"],
    json: true,
    help: false,
  });
});

test("review report composes planning and inspection without changing the source", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "design-ai-review-"));
  const sourcePath = path.join(directory, "page.html");
  const source = "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>";
  writeFileSync(sourcePath, source);

  const workflow = buildReviewReport(
    parseReviewArgs([sourcePath, "--brief", "Review settings", "--locale", "ko-KR"]),
    {
      cwd: directory,
      sourceRoot: PACKAGE_ROOT,
      prefix: "design-",
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
  );

  assert.equal(workflow.kind, "design-ai-review-workflow");
  assert.equal(workflow.source.reference, realpathSync(sourcePath));
  assert.equal(workflow.plan.context.locale, "ko-KR");
  assert.equal(workflow.report.context.locale, "ko-KR");
  assert.equal(readFileSync(sourcePath, "utf8"), source);
  assert.match(renderReviewMarkdown(workflow), /human-review-required/);
  assert.match(renderReviewMarkdown(workflow), /no local write, target-repository mutation, or external write/);
});
