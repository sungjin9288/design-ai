import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { validateBrowserVerification } from "../../cli/lib/browser-verification-contract.mjs";
import { validateDesignQualityReport } from "../../cli/lib/design-quality-contract.mjs";
import { PACKAGE_ROOT } from "../../cli/lib/paths.mjs";
import { buildReviewWorkflow } from "../../cli/lib/review-workflow.mjs";
import { buildReviewHandoff } from "../../cli/lib/review-handoff.mjs";
import { validateReviewHandoff } from "../../cli/lib/review-handoff-contract.mjs";
import { verifyReviewHandoff } from "../../cli/lib/review-handoff-receipt.mjs";
import { validateReviewHandoffReceipt } from "../../cli/lib/review-handoff-receipt-contract.mjs";
import { validateTargetRepoIntake } from "../../cli/lib/target-repo-intake-contract.mjs";

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

function canonicalBrowserReport() {
  const checks = [
    "responsive", "keyboard", "accessibility", "reduced-motion", "loading", "error", "repeated-action",
  ];
  const probes = checks.map((check) => ({
    id: `${check}:mobile`,
    check,
    status: "pass",
    viewport: "mobile",
    observedAt: "2026-07-14T00:00:30.000Z",
    observation: `${check} passed at mobile`,
    artifacts: [{
      kind: check === "responsive" ? "screenshot" : check === "accessibility" ? "accessibility" : "trace",
      path: `${check}-mobile.${check === "responsive" ? "png" : check === "accessibility" ? "json" : "txt"}`,
    }],
    findingIds: [],
  }));
  return {
    kind: "design-ai-browser-verification",
    schemaVersion: 1,
    sourceReport: { path: "quality-report.json", sha256: "a".repeat(64), postRunDigestMatch: true },
    approval: { status: "approved", reference: "operator approval" },
    run: {
      id: "run-1",
      url: "http://127.0.0.1:4173",
      startedAt: "2026-07-14T00:00:00.000Z",
      completedAt: "2026-07-14T00:01:00.000Z",
      tool: { name: "adapter", version: "1" },
    },
    boundary: {
      mode: "local-evidence-write",
      targetRoot: "/tmp/site",
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
      localEvidencePath: ".design-ai/evidence/run-1",
      notes: [],
    },
    viewports: [{ name: "mobile", width: 390, height: 844 }],
    probes,
    findings: [],
    summary: { status: "pass", passed: 7, failed: 0, unverified: 0, nextAction: "Review the evidence." },
  };
}

function failedBrowserReport() {
  const report = canonicalBrowserReport();
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
    "normalizeQualityReport",
    "normalizeReviewWorkflow",
    "normalizeReviewHandoff",
    "normalizeReviewHandoffReceipt",
    "normalizeTargetRepoIntake",
    "targetRepoIntakeMatchesReceipt",
    "normalizeBrowserVerification",
    "buildImportedArtifactJson",
    "sha256Text",
    "utf8ByteLength",
  ]);
});

test("quality and browser contracts reject unknown shapes and preserve imported JSON bytes", () => {
  const qualityPath = path.join(
    CONSOLE_ROOT,
    "..",
    "..",
    "examples",
    "benchmarks",
    "korean-fintech-settings",
    "quality-report.json",
  );
  const rawQuality = readFileSync(qualityPath, "utf8");
  const quality = JSON.parse(rawQuality);
  const normalizedQuality = api.normalizeQualityReport(quality);

  assert.notEqual(normalizedQuality, quality);
  assert.equal(JSON.stringify(normalizedQuality), JSON.stringify(quality));
  assert.equal(api.buildImportedArtifactJson(normalizedQuality, rawQuality), rawQuality);
  assert.equal(api.normalizeQualityReport({ ...quality, kind: "unknown" }), null);
  assert.equal(api.normalizeQualityReport({ ...quality, extra: true }), null);

  const localEvidenceQuality = structuredClone(quality);
  localEvidenceQuality.boundary = {
    ...localEvidenceQuality.boundary,
    mode: "local-evidence-write",
    localEvidenceWrites: true,
    localEvidencePath: ".design-ai/evidence/quality-report.json",
  };
  assert.strictEqual(validateDesignQualityReport(localEvidenceQuality), localEvidenceQuality);
  assert.notEqual(api.normalizeQualityReport(localEvidenceQuality), null);

  const browser = canonicalBrowserReport();
  assert.strictEqual(validateBrowserVerification(browser), browser);
  const normalizedBrowser = api.normalizeBrowserVerification(browser);
  assert.equal(JSON.stringify(normalizedBrowser), JSON.stringify(browser));
  assert.notEqual(normalizedBrowser, browser);
  assert.equal(api.normalizeBrowserVerification({ ...browser, schemaVersion: 2 }), null);

  const forgedReports = [
    { ...browser, approval: { ...browser.approval, status: "pending" } },
    { ...browser, probes: [], summary: { ...browser.summary, passed: 0 } },
    {
      ...browser,
      boundary: {
        ...browser.boundary,
        requestedNetworkPolicy: { ...browser.boundary.requestedNetworkPolicy, blockCrossOrigin: false },
      },
    },
    { ...browser, summary: { ...browser.summary, passed: 6 } },
  ];
  for (const unsafePath of ["\\root\\artifact.png", "\\\\server\\share\\artifact.png"]) {
    const forged = structuredClone(browser);
    forged.probes[0].artifacts[0].path = unsafePath;
    forgedReports.push(forged);
  }
  for (const forged of forgedReports) {
    assert.throws(() => validateBrowserVerification(forged));
    assert.equal(api.normalizeBrowserVerification(forged), null);
  }
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

test("review workflow normalization preserves the exact linked read-only session", () => {
  const source = "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>";
  const workflow = buildReviewWorkflow(source, {
    brief: "한국어 계정 설정 화면을 검토한다",
    sourceRef: "settings.html",
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
    locale: "ko-KR",
    viewports: ["mobile", "desktop"],
    generatedAt: "2026-07-15T00:00:00.000Z",
    reviewPack: "korean-fintech",
  });
  const rawWorkflow = JSON.stringify(workflow, null, 2);
  const normalized = api.normalizeReviewWorkflow(workflow);

  assert.notEqual(normalized, workflow);
  assert.equal(JSON.stringify(normalized), JSON.stringify(workflow));
  assert.equal(api.buildImportedArtifactJson(normalized, rawWorkflow), rawWorkflow);

  const invalidLinkage = structuredClone(workflow);
  invalidLinkage.linkage.reportSha256 = "0".repeat(64);
  assert.equal(api.normalizeReviewWorkflow(invalidLinkage), null);

  const invalidBoundary = structuredClone(workflow);
  invalidBoundary.boundary.externalWrites = true;
  assert.equal(api.normalizeReviewWorkflow(invalidBoundary), null);

  const invalidStages = structuredClone(workflow);
  invalidStages.stages[2].status = "pass";
  assert.equal(api.normalizeReviewWorkflow(invalidStages), null);

  assert.equal(api.normalizeReviewWorkflow({ ...workflow, extra: true }), null);
});

test("review handoff normalization revalidates embedded sources and pending delivery", () => {
  const source = "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>";
  const workflow = buildReviewWorkflow(source, {
    brief: "한국어 계정 설정 화면을 검토한다",
    sourceRef: "settings.html",
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
    locale: "ko-KR",
    viewports: ["mobile"],
    generatedAt: "2026-07-15T00:00:00.000Z",
  });
  const workflowSource = JSON.stringify(workflow, null, 2);
  const qualityReportSource = JSON.stringify(workflow.report, null, 2);
  const browser = canonicalBrowserReport();
  browser.sourceReport.sha256 = createHash("sha256").update(qualityReportSource).digest("hex");
  const handoff = buildReviewHandoff(workflowSource, {
    workflowRef: "review-workflow.json",
    recipient: "codex",
    qualityReportSource,
    qualityReportRef: "quality-report.json",
    browserVerificationSource: JSON.stringify(browser, null, 2),
    browserVerificationRef: "browser-verification.json",
  });
  const rawHandoff = JSON.stringify(handoff, null, 2);
  const normalized = api.normalizeReviewHandoff(handoff);

  assert.strictEqual(validateReviewHandoff(handoff), handoff);
  assert.notEqual(normalized, handoff);
  assert.equal(JSON.stringify(normalized), JSON.stringify(handoff));
  assert.equal(api.buildImportedArtifactJson(normalized, rawHandoff), rawHandoff);
  assert.equal(normalized.recipient.delivery, "not-delivered");
  assert.equal(normalized.recipient.consumerValidation, "pending");

  const failedBrowser = failedBrowserReport();
  failedBrowser.sourceReport.sha256 = createHash("sha256").update(qualityReportSource).digest("hex");
  const failedHandoff = buildReviewHandoff(workflowSource, {
    workflowRef: "review-workflow.json",
    recipient: "codex",
    qualityReportSource,
    qualityReportRef: "quality-report.json",
    browserVerificationSource: JSON.stringify(failedBrowser, null, 2),
    browserVerificationRef: "browser-verification.json",
  });
  const normalizedFailure = api.normalizeReviewHandoff(failedHandoff);
  assert.notEqual(normalizedFailure, null);
  assert.ok(normalizedFailure.nextAction.approvalRequiredBefore.some((item) => item.includes("browser")));

  const changedSource = structuredClone(handoff);
  changedSource.artifacts.reviewWorkflow.source += "\n";
  assert.equal(api.normalizeReviewHandoff(changedSource), null);

  const changedDelivery = structuredClone(handoff);
  changedDelivery.recipient.delivery = "delivered";
  assert.equal(api.normalizeReviewHandoff(changedDelivery), null);

  const changedViewport = structuredClone(handoff);
  changedViewport.artifacts.browserVerification.value.viewports[0].name = "desktop";
  assert.equal(api.normalizeReviewHandoff(changedViewport), null);
});

test("review handoff receipt normalization preserves exact nested handoff proof", () => {
  const workflow = buildReviewWorkflow(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      brief: "한국어 계정 설정 화면을 검토한다",
      sourceRef: "settings.html",
      sourceRoot: PACKAGE_ROOT,
      prefix: "design-",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
  );
  const handoff = buildReviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });
  const handoffSource = `${JSON.stringify(handoff, null, 2)}\n`;
  const receipt = verifyReviewHandoff(handoffSource, {
    handoffRef: "review-handoff.json",
    consumer: "codex",
  });
  const rawReceipt = JSON.stringify(receipt, null, 2);
  const normalized = api.normalizeReviewHandoffReceipt(receipt);

  assert.strictEqual(validateReviewHandoffReceipt(receipt), receipt);
  assert.notEqual(normalized, receipt);
  assert.equal(JSON.stringify(normalized), JSON.stringify(receipt));
  assert.equal(api.buildImportedArtifactJson(normalized, rawReceipt), rawReceipt);
  assert.equal(normalized.handoff.source, handoffSource);
  assert.equal(normalized.consumer.identity, "self-declared");
  assert.equal(normalized.consumer.acceptance, "not-claimed");

  const wrongConsumer = structuredClone(receipt);
  wrongConsumer.consumer.name = "claude";
  assert.equal(api.normalizeReviewHandoffReceipt(wrongConsumer), null);

  const changedHandoff = structuredClone(receipt);
  changedHandoff.handoff.source += "\n";
  assert.equal(api.normalizeReviewHandoffReceipt(changedHandoff), null);

  const implementationClaim = structuredClone(receipt);
  implementationClaim.nextAction.implementationAuthorized = true;
  assert.equal(api.normalizeReviewHandoffReceipt(implementationClaim), null);
});

test("target repo intake normalization preserves bounded receipt and repository evidence", () => {
  const workflow = buildReviewWorkflow(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      brief: "한국어 계정 설정 화면을 검토한다",
      sourceRef: "settings.html",
      sourceRoot: PACKAGE_ROOT,
      prefix: "design-",
      siteName: "Acme settings",
      repoUrl: "https://github.com/acme/site",
      localPath: "/tmp/acme-site",
      locale: "ko-KR",
      viewports: ["mobile"],
      generatedAt: "2026-07-15T00:00:00.000Z",
    },
  );
  const handoff = buildReviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });
  const receipt = verifyReviewHandoff(JSON.stringify(handoff, null, 2), {
    handoffRef: "review-handoff.json",
    consumer: "codex",
  });
  const receiptSource = `${JSON.stringify(receipt, null, 2)}\n`;
  const intake = {
    kind: "design-ai-target-repo-intake",
    schemaVersion: 1,
    status: "ready-for-scope-review",
    consumer: { name: "codex", receiptConsumerMatch: true, identity: "self-declared" },
    receipt: {
      reference: "review-handoff-receipt.json",
      sha256: createHash("sha256").update(receiptSource).digest("hex"),
      bytes: Buffer.byteLength(receiptSource, "utf8"),
      kind: receipt.kind,
      schemaVersion: receipt.schemaVersion,
      status: receipt.status,
      consumer: receipt.consumer.name,
      handoffSha256: receipt.handoff.sha256,
      reviewWorkflowSha256: receipt.handoff.value.artifacts.reviewWorkflow.sha256,
      remainingApprovals: [...receipt.remainingApprovals],
    },
    target: {
      declaredPath: "/tmp/acme-site",
      resolvedPath: "/tmp/acme-site",
      pathMatch: true,
      declaredRepositoryUrl: "https://github.com/acme/site",
      observedRepositoryUrl: "git@github.com:acme/site.git",
      repositoryUrlMatch: true,
    },
    project: {
      metadataStatus: "pass",
      manifest: "package.json",
      staticEntry: "",
      packageManager: "pnpm",
      framework: "Vite",
      scripts: [{ name: "dev", run: "pnpm run dev" }],
      startCommand: "pnpm run dev",
    },
    git: {
      status: "pass",
      repository: true,
      root: "/tmp/acme-site",
      targetWithinRepository: true,
      branch: "main",
      clean: true,
      upstream: "origin/main",
      ahead: 0,
      behind: 0,
      remote: "git@github.com:acme/site.git",
      remoteMatch: true,
      head: { hash: "abc123", subject: "feat: initial site" },
      changes: { total: 0, entries: [], truncated: false },
    },
    inspection: {
      scope: "root-metadata-and-git-state",
      metadataFilesRead: ["package.json"],
      metadataEntriesInspected: ["supported root lockfile", "index.html existence"],
      applicationSourceFilesRead: [],
      gitCommands: ["git rev-parse --is-inside-work-tree"],
    },
    issues: [
      { level: "pass", id: "linked-project-ready", message: "Project metadata is ready." },
      { level: "pass", id: "target-git-ready", message: "Git metadata is ready." },
    ],
    remainingApprovals: [...receipt.remainingApprovals],
    nextAction: {
      id: "implementation-scope-approval-required",
      status: "pending",
      summary: "Review scope before implementation.",
      approvalRequiredBefore: [...new Set([...receipt.remainingApprovals, "implementation scope"])],
      implementationAuthorized: false,
    },
    boundary: {
      mode: "read-only",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
      networkCalls: false,
      previewStarted: false,
      applicationSourceRead: false,
      consumerIdentityVerified: false,
      implementationStarted: false,
    },
  };

  assert.strictEqual(validateTargetRepoIntake(intake), intake);
  const normalized = api.normalizeTargetRepoIntake(intake);
  assert.notEqual(normalized, intake);
  assert.equal(JSON.stringify(normalized), JSON.stringify(intake));
  assert.equal(api.targetRepoIntakeMatchesReceipt(intake, receiptSource), true);
  assert.equal(api.targetRepoIntakeMatchesReceipt(intake, `${receiptSource}\n`), false);

  const otherHandoff = buildReviewHandoff(JSON.stringify(workflow, null, 2), {
    workflowRef: "review-workflow.json",
    recipient: "claude",
  });
  const otherReceipt = verifyReviewHandoff(JSON.stringify(otherHandoff, null, 2), {
    handoffRef: "review-handoff.json",
    consumer: "claude",
  });
  assert.equal(
    api.targetRepoIntakeMatchesReceipt(intake, `${JSON.stringify(otherReceipt, null, 2)}\n`),
    false,
  );

  const remoteDrift = structuredClone(intake);
  remoteDrift.target.observedRepositoryUrl = "https://github.com/acme/other";
  assert.equal(api.normalizeTargetRepoIntake(remoteDrift), null);

  const sourceClaim = structuredClone(intake);
  sourceClaim.inspection.applicationSourceFilesRead = ["src/App.tsx"];
  assert.equal(api.normalizeTargetRepoIntake(sourceClaim), null);

  const relativeTarget = structuredClone(intake);
  relativeTarget.target.declaredPath = "acme-site";
  assert.equal(api.normalizeTargetRepoIntake(relativeTarget), null);

  const forgedAggregateStatus = structuredClone(intake);
  forgedAggregateStatus.git.repository = false;
  forgedAggregateStatus.git.status = "fail";
  assert.equal(api.normalizeTargetRepoIntake(forgedAggregateStatus), null);
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
  const scopeIndex = html.indexOf('<script src="./implementation-scope.js" defer></script>');
  const evidenceIndex = html.indexOf('<script src="./implementation-evidence.js" defer></script>');
  const pilotIndex = html.indexOf('<script src="./pilot-evidence.js" defer></script>');
  const appIndex = html.indexOf('<script src="./app.js" defer></script>');

  assert.equal(existsSync(path.join(CONSOLE_ROOT, "source-bundle.js")), true);
  assert.equal(existsSync(path.join(CONSOLE_ROOT, "implementation-scope.js")), true);
  assert.equal(existsSync(path.join(CONSOLE_ROOT, "implementation-evidence.js")), true);
  assert.equal(existsSync(path.join(CONSOLE_ROOT, "pilot-evidence.js")), true);
  assert.equal(existsSync(path.join(CONSOLE_ROOT, "app.js")), true);
  assert.ok(contractIndex >= 0 && contractIndex < scopeIndex && scopeIndex < evidenceIndex && evidenceIndex < pilotIndex && pilotIndex < appIndex);
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
  assert.match(appSource, /Import pilot evidence, implementation evidence, scope approval, scope proposal, target intake, review receipt, handoff, workflow, quality, browser, start, workspace, runbook, or preview JSON/);
  assert.match(appSource, /No process started by design-ai/);
  assert.match(appSource, /A configured URL is not browser verification/);
  assert.match(appSource, /Linked preview readiness JSON imported\. Report tab opened\./);
  assert.match(appSource, /no process start, external call, source scan, or target-repo mutation/);
});

test("Website Console keeps quality and browser contracts separate and preserves raw exports", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /Canonical quality-report JSON imported\. Original bytes preserved\./);
  assert.match(appSource, /Canonical browser-verification JSON imported as a separate sidecar\./);
  assert.match(appSource, /Export original quality JSON/);
  assert.match(appSource, /Export original browser JSON/);
  assert.match(appSource, /window\.crypto\.subtle\.digest\("SHA-256"/);
  assert.match(appSource, /The sidecar does not resolve purpose-frequency or spatial-continuity by itself/);
  assert.match(appSource, /if \(!isWorkspacePayload\(parsed\)\)/);
});

test("Website Console imports the review workflow before direct artifacts and preserves its envelope", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /design-ai\.website-console\.review-workflow/);
  assert.match(appSource, /var importedReviewWorkflow = normalizeReviewWorkflow\(parsed\);/);
  assert.ok(appSource.indexOf("var importedReviewWorkflow = normalizeReviewWorkflow(parsed);") < appSource.indexOf("var importedQualityReport = normalizeQualityReport(parsed);"));
  assert.match(appSource, /Envelope bytes preserved; nested Start and Quality contracts render by value\./);
  assert.match(appSource, /Original review-workflow envelope bytes are preserved/);
  assert.match(appSource, /Export original review JSON/);
  assert.match(appSource, /Clear review workflow/);
  assert.match(appSource, /Browser verification/);
  assert.match(appSource, /Human review/);
});

test("Website Console imports review handoff first and keeps delivery pending", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /design-ai\.website-console\.review-handoff/);
  assert.match(appSource, /var importedReviewHandoff = normalizeReviewHandoff\(parsed\);/);
  assert.ok(appSource.indexOf("var importedReviewHandoff = normalizeReviewHandoff(parsed);") < appSource.indexOf("var importedReviewWorkflow = normalizeReviewWorkflow(parsed);"));
  assert.match(appSource, /Canonical review-handoff JSON imported\. Source bytes and pending delivery boundary preserved\./);
  assert.match(appSource, /Prepared Handoff/);
  assert.match(appSource, /No transport performed/);
  assert.match(appSource, /Recipient must revalidate/);
  assert.match(appSource, /Export original handoff JSON/);
  assert.match(appSource, /Original review-handoff JSON exported without reformatting\./);
  assert.match(appSource, /Clear review handoff/);
});

test("Website Console imports consumer receipt first and preserves exact receipt bytes", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /design-ai\.website-console\.review-handoff-receipt/);
  assert.match(appSource, /var importedReviewReceipt = normalizeReviewHandoffReceipt\(parsed\);/);
  assert.ok(appSource.indexOf("var importedReviewReceipt = normalizeReviewHandoffReceipt(parsed);") < appSource.indexOf("var importedReviewHandoff = normalizeReviewHandoff(parsed);"));
  assert.match(appSource, /Canonical review-handoff receipt imported\. Exact receipt and nested handoff bytes preserved\./);
  assert.match(appSource, /Consumer Validation Receipt/);
  assert.match(appSource, /Identity, transport, acceptance, and implementation remain unverified/);
  assert.match(appSource, /Export original receipt JSON/);
  assert.match(appSource, /Original review-handoff receipt JSON exported without reformatting\./);
  assert.match(appSource, /Clear validation receipt/);
  assert.match(appSource, /Validation receipt cleared\. Original review handoff restored\./);
});

test("Website Console imports target intake first and keeps implementation unauthorized", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  assert.match(appSource, /design-ai\.website-console\.target-repo-intake/);
  assert.match(appSource, /var importedTargetRepoIntake = normalizeTargetRepoIntake\(parsed\);/);
  assert.match(appSource, /targetRepoIntakeMatchesReceipt\(importedTargetRepoIntake, appState\.reviewReceipt\.rawJson\)/);
  assert.match(appSource, /Target repository intake does not match the imported receipt source/);
  assert.ok(appSource.indexOf("var importedTargetRepoIntake = normalizeTargetRepoIntake(parsed);") < appSource.indexOf("var importedReviewReceipt = normalizeReviewHandoffReceipt(parsed);"));
  assert.match(appSource, /Target Repository Intake/);
  assert.match(appSource, /Application source, preview, network, and implementation remain untouched/);
  assert.match(appSource, /Export original intake JSON/);
  assert.match(appSource, /Original target-repository intake JSON exported without reformatting/);
  assert.match(appSource, /Implementation unauthorized/);
  assert.match(appSource, /Target repository intake cleared\. Earlier review evidence remains available\./);
});

test("Website Console imports scope approval before proposal and restores the prior stage", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");

  const approvalImport = "var importedScopeApproval = normalizeImplementationScopeApproval(parsed);";
  const proposalImport = "var importedScopeProposal = normalizeImplementationScopeProposal(parsed);";
  const intakeImport = "var importedTargetRepoIntake = normalizeTargetRepoIntake(parsed);";
  assert.ok(appSource.indexOf(approvalImport) < appSource.indexOf(proposalImport));
  assert.ok(appSource.indexOf(proposalImport) < appSource.indexOf(intakeImport));
  assert.match(appSource, /Implementation Scope Approval/);
  assert.match(appSource, /Implementation Scope Proposal/);
  assert.match(appSource, /Original implementation-scope approval JSON exported without reformatting/);
  assert.match(appSource, /Original implementation-scope proposal JSON exported without reformatting/);
  assert.match(appSource, /Scope approval cleared\. Original implementation-scope proposal restored\./);
  assert.match(appSource, /Scope proposal cleared\. Original target-repository intake restored\./);
  assert.match(appSource, /No mutation performed/);
  assert.match(appSource, /Commit pending/);
  assert.match(appSource, /Push pending/);
  assert.match(appSource, /Deployment pending/);
});

test("Website Console imports implementation evidence before approval and restores the approved stage", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");
  const evidenceImport = "var importedImplementationEvidence = normalizeImplementationEvidenceArtifact(parsed);";
  const approvalImport = "var importedScopeApproval = normalizeImplementationScopeApproval(parsed);";

  assert.ok(appSource.indexOf(evidenceImport) < appSource.indexOf(approvalImport));
  assert.match(appSource, /Implementation Evidence/);
  assert.match(appSource, /Original implementation-evidence JSON exported without reformatting/);
  assert.match(appSource, /Implementation evidence cleared\. Original implementation-scope approval restored\./);
  assert.match(appSource, /Read-only evidence/);
  assert.match(appSource, /No command execution/);
  assert.match(appSource, /Commit pending/);
  assert.match(appSource, /Push pending/);
  assert.match(appSource, /Deployment pending/);
});

test("Website Console imports pilot evidence before P11 and restores exact implementation evidence", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");
  const pilotImport = "var importedPilotEvidence = normalizePilotEvidenceArtifact(parsed);";
  const evidenceImport = "var importedImplementationEvidence = normalizeImplementationEvidenceArtifact(parsed);";

  assert.ok(appSource.indexOf(pilotImport) < appSource.indexOf(evidenceImport));
  assert.match(appSource, /Real Pilot Evidence/);
  assert.match(appSource, /Exact P6 and P11 sources, consent, metrics, and claim boundaries preserved/);
  assert.match(appSource, /Original pilot-evidence JSON exported without reformatting/);
  assert.match(appSource, /Pilot evidence cleared\. Original implementation evidence restored\./);
  assert.match(appSource, /No identity proof/);
  assert.match(appSource, /No adoption claim/);
  assert.match(appSource, /No production-quality claim/);
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

test("Website Console keeps mobile section navigation compact and keyboard-stable", () => {
  const appSource = readFileSync(path.join(CONSOLE_ROOT, "app.js"), "utf8");
  const styles = readFileSync(path.join(CONSOLE_ROOT, "styles.css"), "utf8");
  const responsive = styles.slice(styles.indexOf("@media (max-width: 980px)"));

  assert.match(responsive, /\.nav-list \{[\s\S]*display: flex;/);
  assert.match(responsive, /\.nav-list \{[\s\S]*overflow-x: auto;/);
  assert.match(responsive, /\.nav-list li \{[\s\S]*flex: 0 0 auto;/);
  assert.match(responsive, /\.nav-button \{[\s\S]*min-height: 44px;/);
  assert.match(responsive, /\.nav-button \{[\s\S]*white-space: nowrap;/);
  assert.match(styles, /outline: 3px solid var\(--accent\);/);
  assert.match(appSource, /activeButton\.focus\(\{ preventScroll: true \}\)/);
  assert.match(appSource, /activeButton\.scrollIntoView\(\{ block: "nearest", inline: "nearest" \}\)/);
});
