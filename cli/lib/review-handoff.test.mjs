import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { BROWSER_CHECKS } from "./browser-verification-contract.mjs";
import {
  buildReviewHandoff,
  buildReviewHandoffFromFiles,
  parseReviewHandoffArgs,
} from "./review-handoff.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";

const generatedAt = "2026-07-15T00:00:00.000Z";

function workflowFixture() {
  return buildReviewWorkflow(
    "<html lang=\"ko\"><body><input name=\"phone\"></body></html>",
    {
      sourceRef: "settings.html",
      brief: "Review Korean settings",
      locale: "ko-KR",
      viewports: ["mobile"],
      sourceRoot: PACKAGE_ROOT,
      prefix: SYMLINK_PREFIX,
      generatedAt,
    },
  );
}

function browserFixture(qualityReportSource, { viewports = ["mobile"] } = {}) {
  const startedAt = "2026-07-15T00:01:00.000Z";
  const completedAt = "2026-07-15T00:02:00.000Z";
  const viewportRows = viewports.map((name) => ({
    name,
    width: name === "mobile" ? 390 : 1440,
    height: name === "mobile" ? 844 : 900,
  }));
  const probes = viewportRows.flatMap((viewport) => BROWSER_CHECKS.map((check) => ({
    id: `${check}:${viewport.name}`,
    check,
    status: "pass",
    viewport: viewport.name,
    observedAt: completedAt,
    observation: `${check} passed at ${viewport.name}`,
    artifacts: [{
      kind: check === "responsive" ? "screenshot" : check === "accessibility" ? "accessibility" : "result",
      path: `${check}-${viewport.name}.${check === "responsive" ? "png" : "json"}`,
    }],
    findingIds: [],
  })));
  return {
    kind: "design-ai-browser-verification",
    schemaVersion: 1,
    sourceReport: {
      path: "quality-report.json",
      sha256: createHash("sha256").update(qualityReportSource).digest("hex"),
      postRunDigestMatch: true,
    },
    approval: { status: "approved", reference: "review-handoff-test" },
    run: {
      id: "run-review-handoff-test",
      url: "http://127.0.0.1:4173/settings",
      startedAt,
      completedAt,
      tool: { name: "fixture-adapter", version: "1.0.0" },
    },
    boundary: {
      mode: "local-evidence-write",
      targetRoot: "/tmp/review-handoff-target",
      requestedNetworkPolicy: {
        allowedOrigin: "http://127.0.0.1:4173",
        allowedMethods: ["GET", "HEAD"],
        blockCrossOrigin: true,
        blockWebSockets: true,
        blockDownloads: true,
      },
      adapterAttestation: {
        networkPolicy: "attested",
        targetRepoMutation: "unverified",
        externalWrites: "unverified",
      },
      sourceReportDigestMatchedAfterRun: true,
      localEvidenceWrites: true,
      localEvidencePath: "/tmp/design-ai/evidence/browser/run-review-handoff-test",
      notes: ["Synthetic browser evidence fixture."],
    },
    viewports: viewportRows,
    probes,
    findings: [],
    summary: {
      status: "pass",
      passed: probes.length,
      failed: 0,
      unverified: 0,
      nextAction: "Preserve this run with the implementation handoff evidence.",
    },
  };
}

function failedBrowserFixture(qualityReportSource) {
  const report = browserFixture(qualityReportSource);
  const probe = report.probes[0];
  const findingId = `finding:${probe.id}`;
  probe.status = "fail";
  probe.findingIds = [findingId];
  report.findings = [{
    id: findingId,
    probeId: probe.id,
    sourceFindingIds: [],
    status: "confirmed",
    title: "Responsive verification failed",
    observation: probe.observation,
    artifacts: probe.artifacts,
  }];
  report.summary = {
    status: "fail",
    passed: report.probes.length - 1,
    failed: 1,
    unverified: 0,
    nextAction: "Fix the confirmed failure, then rerun browser verification.",
  };
  return report;
}

test("review handoff prepares a self-validating static transfer without delivering it", () => {
  const workflowSource = JSON.stringify(workflowFixture(), null, 2);
  const handoff = buildReviewHandoff(workflowSource, {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });

  assert.equal(handoff.kind, "design-ai-review-handoff");
  assert.equal(handoff.status, "static-evidence-prepared");
  assert.equal(handoff.artifacts.reviewWorkflow.source, workflowSource);
  assert.equal(handoff.artifacts.qualityReport, null);
  assert.equal(handoff.stages[2].status, "not-run");
  assert.equal(handoff.stages[3].status, "prepared");
  assert.deepEqual(handoff.recipient, {
    name: "codex",
    delivery: "not-delivered",
    consumerValidation: "pending",
  });
  assert.deepEqual(handoff.boundary, {
    mode: "read-only",
    localWrites: false,
    targetRepoMutation: false,
    externalWrites: false,
    deliveryPerformed: false,
  });
});

test("review handoff proves the exact quality bytes used by browser verification", () => {
  const workflow = workflowFixture();
  const workflowSource = JSON.stringify(workflow, null, 2);
  const qualityReportSource = JSON.stringify(workflow.report, null, 2);
  const browserVerificationSource = JSON.stringify(browserFixture(qualityReportSource), null, 2);
  const handoff = buildReviewHandoff(workflowSource, {
    workflowRef: "review-workflow.json",
    recipient: "claude",
    qualityReportSource,
    qualityReportRef: "quality-report.json",
    browserVerificationSource,
    browserVerificationRef: "browser-verification.json",
  });

  assert.equal(handoff.status, "browser-evidence-prepared");
  assert.equal(handoff.linkage.qualityReportArtifactMatch, true);
  assert.equal(handoff.linkage.browserSourceReportMatch, true);
  assert.equal(handoff.linkage.viewportCoverage, "pass");
  assert.equal(handoff.stages[2].status, "complete");
  assert.ok(handoff.nextAction.approvalRequiredBefore.every((item) => !item.includes("browser")));
});

test("failed browser evidence remains transferable without clearing its approval gate", () => {
  const workflow = workflowFixture();
  const workflowSource = JSON.stringify(workflow, null, 2);
  const qualityReportSource = JSON.stringify(workflow.report, null, 2);
  const browserVerificationSource = JSON.stringify(
    failedBrowserFixture(qualityReportSource),
    null,
    2,
  );
  const handoff = buildReviewHandoff(workflowSource, {
    workflowRef: "review-workflow.json",
    recipient: "codex",
    qualityReportSource,
    qualityReportRef: "quality-report.json",
    browserVerificationSource,
    browserVerificationRef: "browser-verification.json",
  });

  assert.equal(handoff.status, "browser-evidence-prepared");
  assert.ok(handoff.nextAction.approvalRequiredBefore.some((item) => item.includes("browser")));
});

test("review handoff rejects partial, mismatched, and incomplete browser evidence", () => {
  const workflow = workflowFixture();
  const workflowSource = JSON.stringify(workflow);
  const qualityReportSource = JSON.stringify(workflow.report);
  const browser = browserFixture(qualityReportSource);

  assert.throws(
    () => buildReviewHandoff(workflowSource, {
      workflowRef: "review-workflow.json",
      recipient: "codex",
      qualityReportSource,
      qualityReportRef: "quality-report.json",
    }),
    /must be supplied together/,
  );

  const changedQuality = JSON.stringify({ ...workflow.report, generatedAt: "2026-07-15T01:00:00.000Z" });
  assert.throws(
    () => buildReviewHandoff(workflowSource, {
      workflowRef: "review-workflow.json",
      recipient: "codex",
      qualityReportSource: changedQuality,
      qualityReportRef: "quality-report.json",
      browserVerificationSource: JSON.stringify(browserFixture(changedQuality)),
      browserVerificationRef: "browser-verification.json",
    }),
    /does not match the review workflow/,
  );

  browser.sourceReport.sha256 = "0".repeat(64);
  assert.throws(
    () => buildReviewHandoff(workflowSource, {
      workflowRef: "review-workflow.json",
      recipient: "codex",
      qualityReportSource,
      qualityReportRef: "quality-report.json",
      browserVerificationSource: JSON.stringify(browser),
      browserVerificationRef: "browser-verification.json",
    }),
    /source report digest does not match/,
  );

  const desktopBrowser = browserFixture(qualityReportSource, { viewports: ["desktop"] });
  assert.throws(
    () => buildReviewHandoff(workflowSource, {
      workflowRef: "review-workflow.json",
      recipient: "codex",
      qualityReportSource,
      qualityReportRef: "quality-report.json",
      browserVerificationSource: JSON.stringify(desktopBrowser),
      browserVerificationRef: "browser-verification.json",
    }),
    /viewports do not cover/,
  );
});

test("review handoff CLI parser and file operation preserve every input", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "design-ai-review-handoff-"));
  const workflowPath = path.join(directory, "review-workflow.json");
  const workflowSource = JSON.stringify(workflowFixture(), null, 2);
  writeFileSync(workflowPath, workflowSource);

  const parsed = parseReviewHandoffArgs([
    workflowPath,
    "--recipient", "codex",
    "--json",
  ]);
  const handoff = buildReviewHandoffFromFiles(parsed);

  assert.equal(handoff.recipient.name, "codex");
  assert.equal(handoff.artifacts.reviewWorkflow.reference, realpathSync(workflowPath));
  assert.equal(readFileSync(workflowPath, "utf8"), workflowSource);
});
