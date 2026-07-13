import assert from "node:assert/strict";
import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildSiteLinkedPreviewReport,
  formatSiteLinkedPreviewHuman,
  formatSiteLinkedPreviewJson,
} from "./site.mjs";
import { withTempDir } from "./site-test-support.mjs";

function workspace(localPath, liveUrl = "http://localhost:3000") {
  return {
    siteProfile: {
      id: "site-linked-preview",
      name: "Linked preview site",
      localPath,
      liveUrl,
    },
  };
}

test("linked preview reports a package project without running it", async () => {
  await withTempDir((dir) => {
    writeFileSync(path.join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({
      scripts: { dev: "next dev", build: "next build", test: "node --test" },
      dependencies: { next: "15.0.0" },
    }), "utf8");

    const report = buildSiteLinkedPreviewReport(workspace(dir), { filePath: "workspace.json" });

    assert.equal(report.kind, "website-improvement-linked-preview");
    assert.equal(report.status, "pass");
    assert.equal(report.linkedCode.packageManager, "pnpm");
    assert.equal(report.linkedCode.framework, "Next.js");
    assert.equal(report.linkedCode.startCommand, "pnpm run dev");
    assert.equal(report.preview.processStatus, "not-started");
    assert.equal(report.preview.probeStatus, "not-run");
    assert.deepEqual(report.boundaries, {
      readOnly: true,
      externalCalls: false,
      targetRepoMutation: false,
      startsPreviewProcess: false,
      readsSourceFiles: false,
      metadataFiles: ["package.json", "supported root lockfile", "index.html existence"],
      approvalRequiredBeforeTargetRepoMutation: true,
    });
    assert.match(formatSiteLinkedPreviewHuman(report), /Does not start a process/);
    assert.deepEqual(JSON.parse(formatSiteLinkedPreviewJson(report)), report);
  });
});

test("linked preview supports a static root without inventing a package dependency", async () => {
  await withTempDir((dir) => {
    writeFileSync(path.join(dir, "index.html"), "<!doctype html><title>Static</title>\n", "utf8");
    const report = buildSiteLinkedPreviewReport(workspace(dir, ""), { filePath: "workspace.json" });

    assert.equal(report.status, "pass");
    assert.equal(report.linkedCode.framework, "Static HTML");
    assert.equal(report.linkedCode.packageManager, "");
    assert.equal(report.linkedCode.startCommand, "python3 -m http.server 4173");
    assert.equal(report.preview.configured, false);
  });
});

test("linked preview blocks missing, relative, and symbolic-link paths", async () => {
  await withTempDir((dir) => {
    const target = path.join(dir, "target");
    const link = path.join(dir, "target-link");
    mkdirSync(target);
    symlinkSync(target, link);

    const missing = buildSiteLinkedPreviewReport(workspace(""));
    const relative = buildSiteLinkedPreviewReport(workspace("relative/site"));
    const symbolic = buildSiteLinkedPreviewReport(workspace(link));

    assert.equal(missing.status, "fail");
    assert.equal(missing.issues[0].id, "linked-path-missing");
    assert.equal(relative.status, "fail");
    assert.equal(relative.issues[0].id, "linked-path-not-absolute");
    assert.equal(symbolic.status, "fail");
    assert.equal(symbolic.issues[0].id, "linked-path-symlink");
  });
});

test("linked preview warns when a valid directory has no preview entry", async () => {
  await withTempDir((dir) => {
    const report = buildSiteLinkedPreviewReport(workspace(dir));

    assert.equal(report.status, "warn");
    assert.equal(report.linkedCode.startCommand, "");
    assert.deepEqual(report.issues.map((issue) => issue.id), [
      "linked-project-entry-missing",
      "preview-command-missing",
    ]);
    assert.equal(report.stages.find((stage) => stage.id === "start-preview").status, "blocked");
  });
});

test("linked preview does not follow a symbolic-link package manifest", async () => {
  await withTempDir((dir) => {
    const manifestTarget = path.join(dir, "manifest-target.json");
    writeFileSync(manifestTarget, JSON.stringify({ scripts: { dev: "vite" } }), "utf8");
    symlinkSync(manifestTarget, path.join(dir, "package.json"));

    const report = buildSiteLinkedPreviewReport(workspace(dir));

    assert.equal(report.status, "fail");
    assert.equal(report.linkedCode.startCommand, "");
    assert.equal(report.issues[0].id, "package-manifest-symlink");
  });
});
