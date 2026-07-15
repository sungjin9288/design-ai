import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import vm from "node:vm";

import { buildImplementationEvidence } from "./implementation-evidence.mjs";
import { callMcpTool } from "./mcp-server.mjs";
import { approveImplementationScope, proposeImplementationScope } from "./implementation-scope.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";
import { buildPilotEvidence, parsePilotEvidenceArgs, summarizePilotEvidence } from "./pilot-evidence.mjs";
import { validatePilotEvidence } from "./pilot-evidence-contract.mjs";
import { validatePilotRecord } from "./pilot-record-contract.mjs";
import { buildReviewHandoff } from "./review-handoff.mjs";
import { verifyReviewHandoff } from "./review-handoff-receipt.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { buildTargetRepoIntake } from "./target-repo-intake.mjs";
import { recordPilotEvidence } from "../sdk/pilot-evidence-adapter.mjs";

const REPOSITORY_URL = "https://github.com/acme/real-product.git";

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function targetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-pilot-target-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }, null, 2));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.name", "Design AI Test"]);
  git(root, ["config", "user.email", "design-ai@example.com"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "test: initialize pilot target"]);
  git(root, ["remote", "add", "origin", REPOSITORY_URL]);
  return root;
}

function buildApproval(root) {
  const workflow = buildReviewWorkflow(
    "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>",
    {
      sourceRef: "settings.html",
      brief: "설정 저장 흐름을 검토한다",
      siteName: "Real product settings",
      repoUrl: REPOSITORY_URL,
      localPath: root,
      locale: "ko-KR",
      viewports: ["mobile", "desktop"],
      generatedAt: "2026-07-15T00:00:00.000Z",
      sourceRoot: PACKAGE_ROOT,
      prefix: SYMLINK_PREFIX,
    },
  );
  const handoff = buildReviewHandoff(JSON.stringify(workflow), {
    workflowRef: "review-workflow.json",
    recipient: "codex",
  });
  const receipt = verifyReviewHandoff(JSON.stringify(handoff), {
    handoffRef: "review-handoff.json",
    consumer: "codex",
  });
  const intake = buildTargetRepoIntake(JSON.stringify(receipt), {
    receiptRef: "review-handoff-receipt.json",
    targetRoot: root,
    consumer: "codex",
  });
  const request = {
    kind: "design-ai-implementation-scope-request",
    schemaVersion: 1,
    objective: "Improve the approved settings flow and retain evidence.",
    intendedBehavior: ["The settings flow stays accessible and responsive."],
    files: {
      inspect: ["src/settings/**"],
      change: ["src/settings/**"],
      generated: ["evidence/**"],
    },
    dependencies: [],
    migrations: [],
    externalWrites: [],
    verificationCommands: ["npm test"],
    risks: ["Runtime behavior requires browser evidence."],
    preExistingChanges: [],
    release: { commit: true, push: true, deployment: false },
  };
  const proposal = proposeImplementationScope(JSON.stringify(intake), JSON.stringify(request), {
    intakeRef: "target-repo-intake.json",
    requestRef: "implementation-scope-request.json",
    consumer: "codex",
  });
  const approval = approveImplementationScope(JSON.stringify(proposal), {
    proposalRef: "implementation-scope-proposal.json",
    approver: "project owner",
    approvalRef: "pilot consent record",
    approvedAt: "2026-07-15T00:02:00.000Z",
    confirmed: true,
  });
  return { approval, workflow };
}

function writeImplementation(root) {
  mkdirSync(path.join(root, "src", "settings"), { recursive: true });
  mkdirSync(path.join(root, "evidence"), { recursive: true });
  writeFileSync(path.join(root, "src", "settings", "view.tsx"), "export const Settings = () => <button>저장</button>;\n");
  writeFileSync(path.join(root, "evidence", "test.log"), "tests passed\n");
  writeFileSync(path.join(root, "evidence", "browser.json"), "{\"consoleErrors\":0}\n");
}

function implementationEvidence(root, approval, overrides = {}) {
  const statusEntries = git(root, ["status", "--short", "--untracked-files=all"])
    .split("\n")
    .filter(Boolean);
  const request = {
    kind: "design-ai-implementation-evidence-request",
    schemaVersion: 1,
    consumer: "codex",
    implementationStartedAt: "2026-07-15T00:03:00.000Z",
    implementationCompletedAt: "2026-07-15T00:10:00.000Z",
    executedWork: statusEntries.map((statusEntry) => ({
      statusEntry,
      path: statusEntry.slice(3),
      summary: "Completed approved pilot work.",
    })),
    verificationResults: [{
      command: "npm test",
      status: "pass",
      startedAt: "2026-07-15T00:08:00.000Z",
      completedAt: "2026-07-15T00:09:00.000Z",
      exitCode: 0,
      summary: "Tests passed.",
      artifacts: ["evidence/test.log"],
    }],
    observations: [
      { id: "a11y", category: "accessibility", status: "confirmed", summary: "Keyboard and naming checks passed.", artifacts: ["evidence/browser.json"] },
      { id: "responsive", category: "responsive", status: "confirmed", summary: "Mobile and desktop layouts fit.", artifacts: ["evidence/browser.json"] },
      { id: "browser", category: "browser", status: "confirmed", summary: "The browser console stayed clean.", artifacts: ["evidence/browser.json"] },
    ],
    remainingRisks: [],
    ...overrides,
  };
  return buildImplementationEvidence(JSON.stringify(approval), JSON.stringify(request), {
    approvalRef: "implementation-scope-approval.json",
    requestRef: "implementation-evidence-request.json",
    targetRoot: root,
    consumer: "codex",
  });
}

function pilotRecord(approval, workflow, overrides = {}) {
  const findingIds = workflow.report.findings.map((finding) => finding.id);
  return {
    kind: "design-ai-pilot-record",
    schemaVersion: 1,
    project: {
      name: "Acme real product",
      repositoryUrl: REPOSITORY_URL,
      pilotClass: "external-pilot",
    },
    consent: {
      status: "approved",
      approver: "project owner",
      identity: "self-declared",
      reference: "pilot consent record",
      approvedAt: "2026-07-15T00:01:00.000Z",
      evidenceCollection: true,
      targetMutation: true,
    },
    timeline: {
      pilotStartedAt: "2026-07-15T00:00:00.000Z",
      firstUsefulArtifactAt: "2026-07-15T00:00:30.000Z",
      implementationCompletedAt: "2026-07-15T00:10:00.000Z",
    },
    findingDecisions: findingIds.map((findingId) => ({
      findingId,
      decision: "accepted",
      summary: "The owner accepted the finding for this pilot.",
      reference: "pilot finding review",
    })),
    approvalEvents: approval.approvalGates.map((gate) => ({
      gateId: gate.id,
      status: gate.status,
      occurredAt: gate.status === "approved" ? "2026-07-15T00:02:00.000Z" : "",
      reference: gate.status === "approved" ? "implementation scope approval" : "implementation scope gate record",
    })),
    outcome: {
      implementationStatus: "complete",
      productionStatus: "not-deployed",
      feedback: {
        status: "not-collected",
        summary: "No publishable user feedback was collected in this technical pilot.",
        reference: "",
      },
    },
    claims: [
      { class: "real", statement: "The chain ran against a real project checkout.", reference: "implementation-evidence.json" },
      { class: "synthetic", statement: "Synthetic benchmark results are separate from this pilot.", reference: "benchmark-suite" },
      { class: "inferred", statement: "The completed internal workflow suggests the contract is operable.", reference: "pilot metrics" },
      { class: "unverified", statement: "Customer adoption and production outcomes are not established.", reference: "pilot boundary" },
    ],
    ...overrides,
  };
}

function completePilot() {
  const root = targetRepo();
  const { approval, workflow } = buildApproval(root);
  writeImplementation(root);
  const evidence = implementationEvidence(root, approval);
  return { root, approval, workflow, evidence, record: pilotRecord(approval, workflow) };
}

function loadConsolePilotApi() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ["source-bundle.js", "implementation-scope.js", "implementation-evidence.js", "pilot-evidence.js"]) {
    vm.runInContext(
      readFileSync(path.join(PACKAGE_ROOT, "docs", "website-console", file), "utf8"),
      sandbox,
    );
  }
  return sandbox.DesignAiWebsiteConsolePilotEvidence;
}

test("pilot evidence derives bounded real-project metrics from the exact P11 chain", () => {
  const fixture = completePilot();
  try {
    const evidence = buildPilotEvidence(JSON.stringify(fixture.evidence), JSON.stringify(fixture.workflow), JSON.stringify(fixture.record), {
      implementationEvidenceRef: "implementation-evidence.json",
      reviewWorkflowRef: "review-workflow.json",
      recordRef: "pilot-record.json",
    });
    assert.equal(evidence.status, "evidence-complete", JSON.stringify(evidence.issues, null, 2));
    assert.equal(evidence.metrics.timeToFirstUsefulArtifact.milliseconds, 30_000);
    assert.equal(evidence.metrics.findingPrecision.precision, 1);
    assert.equal(evidence.metrics.approvalFriction.pending, 2);
    assert.equal(evidence.metrics.implementation.status, "complete");
    assert.equal(evidence.claims.unverified[0].statement.includes("not established"), true);
    assert.equal(evidence.boundary.adoptionEstablished, false);
    assert.equal(evidence.boundary.productionQualityEstablished, false);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("SDK and MCP preserve the same read-only pilot evidence contract", async () => {
  const fixture = completePilot();
  try {
    const sources = {
      implementationEvidenceSource: JSON.stringify(fixture.evidence),
      reviewWorkflowSource: JSON.stringify(fixture.workflow),
      recordSource: JSON.stringify(fixture.record),
    };
    const refs = {
      implementationEvidenceRef: "implementation-evidence.json",
      reviewWorkflowRef: "review-workflow.json",
      recordRef: "pilot-record.json",
    };
    const sdkEvidence = recordPilotEvidence(
      sources.implementationEvidenceSource,
      sources.reviewWorkflowSource,
      sources.recordSource,
      refs,
    );
    let runCliCalled = false;
    const mcpResult = await callMcpTool("design_ai_review_pilot", { ...sources, ...refs }, async () => {
      runCliCalled = true;
      return { code: 0, stdout: "unexpected", stderr: "" };
    });
    const mcpEvidence = JSON.parse(mcpResult.content[0].text);
    assert.equal(runCliCalled, false);
    assert.deepEqual(mcpEvidence, sdkEvidence);
    assert.equal(mcpEvidence.boundary.targetRepoMutation, false);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("MCP compact pilot evidence preserves identity and fits the transport boundary", async () => {
  const fixture = completePilot();
  try {
    const implementationEvidenceSource = `${JSON.stringify(fixture.evidence)}${" ".repeat(140_000)}`;
    const sources = {
      implementationEvidenceSource,
      reviewWorkflowSource: JSON.stringify(fixture.workflow),
      recordSource: JSON.stringify(fixture.record),
    };
    const refs = {
      implementationEvidenceRef: "implementation-evidence.json",
      reviewWorkflowRef: "review-workflow.json",
      recordRef: "pilot-record.json",
    };
    const fullEvidence = buildPilotEvidence(
      sources.implementationEvidenceSource,
      sources.reviewWorkflowSource,
      sources.recordSource,
      refs,
    );
    const fullResult = await callMcpTool("design_ai_review_pilot", { ...sources, ...refs });
    const compactResult = await callMcpTool("design_ai_review_pilot", { ...sources, ...refs, compact: true });
    const fullError = JSON.parse(fullResult.content[0].text);
    const compact = JSON.parse(compactResult.content[0].text);

    assert.equal(fullResult.isError, true);
    assert.equal(fullError.code, "OUTPUT_TOO_LARGE");
    assert.equal(compactResult.isError, false);
    assert.equal(compact.kind, "design-ai-pilot-evidence-summary");
    assert.equal(compact.status, fullEvidence.status);
    assert.deepEqual(compact.metrics, fullEvidence.metrics);
    assert.deepEqual(compact.claims, fullEvidence.claims);
    assert.equal(compact.sources.implementationEvidence.sha256, createHash("sha256").update(implementationEvidenceSource).digest("hex"));
    assert.equal(compact.sources.implementationEvidence.bytes, Buffer.byteLength(implementationEvidenceSource));
    assert.equal(compact.representation.mode, "compact");
    assert.equal(compactResult.content[0].text.includes('"source":'), false);
    assert.ok(Buffer.byteLength(compactResult.content[0].text) < 220_000);

    const directSummary = summarizePilotEvidence(fullEvidence);
    assert.deepEqual(compact, directSummary);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("Website Console preserves exact pilot evidence and rejects derived-field drift", () => {
  const fixture = completePilot();
  try {
    const value = buildPilotEvidence(
      JSON.stringify(fixture.evidence),
      JSON.stringify(fixture.workflow),
      JSON.stringify(fixture.record),
    );
    const api = loadConsolePilotApi();
    assert.ok(Object.isFrozen(api));
    assert.equal(JSON.stringify(api.normalizePilotEvidence(value)), JSON.stringify(value));
    const drifted = structuredClone(value);
    drifted.metrics.timeToFirstUsefulArtifact.milliseconds += 1;
    assert.equal(api.normalizePilotEvidence(drifted), null);
    const issueDrift = structuredClone(value);
    issueDrift.issues.push({ level: "warn", id: "invented", message: "Invented issue" });
    issueDrift.status = "attention-required";
    assert.equal(api.normalizePilotEvidence(issueDrift), null);
    const nextActionDrift = structuredClone(value);
    nextActionDrift.nextAction.summary = "Invented next action";
    assert.equal(api.normalizePilotEvidence(nextActionDrift), null);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("pilot evidence validator rejects derived metric, claim, issue, and next-action drift", () => {
  const fixture = completePilot();
  try {
    const value = buildPilotEvidence(
      JSON.stringify(fixture.evidence),
      JSON.stringify(fixture.workflow),
      JSON.stringify(fixture.record),
    );
    const cases = [
      ["metrics", (copy) => { copy.metrics.timeToFirstUsefulArtifact.milliseconds += 1; }],
      ["claims", (copy) => { copy.claims.real[0].statement = "Overstated claim"; }],
      ["issues", (copy) => { copy.issues.push({ level: "warn", id: "invented", message: "Invented issue" }); copy.status = "attention-required"; }],
      ["nextAction", (copy) => { copy.nextAction.summary = "Invented next action"; }],
    ];
    for (const [field, change] of cases) {
      const copy = structuredClone(value);
      change(copy);
      assert.throws(() => validatePilotEvidence(copy), new RegExp(`pilot evidence ${field}`));
    }
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("pilot records require explicit consent and one claim in every evidence class", () => {
  const fixture = completePilot();
  try {
    const noConsent = structuredClone(fixture.record);
    noConsent.consent.evidenceCollection = false;
    assert.throws(() => validatePilotRecord(noConsent), /must approve evidence collection/);

    const missingClass = structuredClone(fixture.record);
    missingClass.claims.pop();
    assert.throws(() => validatePilotRecord(missingClass), /one real, synthetic, inferred, and unverified claim/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("repository, finding, approval, and implementation drift block pilot evidence", () => {
  const fixture = completePilot();
  try {
    const record = structuredClone(fixture.record);
    record.project.repositoryUrl = "https://github.com/acme/other.git";
    record.findingDecisions[0].findingId = "other-finding";
    record.approvalEvents[0].status = "pending";
    record.approvalEvents[0].occurredAt = "";
    record.outcome.implementationStatus = "partial";
    const evidence = buildPilotEvidence(JSON.stringify(fixture.evidence), JSON.stringify(fixture.workflow), JSON.stringify(record));
    assert.equal(evidence.status, "blocked");
    assert.deepEqual(
      evidence.issues.filter((issue) => issue.level === "fail").map((issue) => issue.id),
      [
        "pilot-project-repository-drift",
        "pilot-finding-review-incomplete",
        "pilot-approval-history-drift",
        "pilot-implementation-status-drift",
      ],
    );
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("incomplete P11 proof stays visible as attention-required pilot evidence", () => {
  const root = targetRepo();
  try {
    const { approval, workflow } = buildApproval(root);
    writeImplementation(root);
    const incomplete = implementationEvidence(root, approval, {
      remainingRisks: [{ severity: "p2", summary: "A real-device check remains." }],
    });
    const record = pilotRecord(approval, workflow, {
      outcome: {
        implementationStatus: "partial",
        productionStatus: "not-deployed",
        feedback: { status: "not-collected", summary: "No feedback was collected.", reference: "" },
      },
    });
    const evidence = buildPilotEvidence(JSON.stringify(incomplete), JSON.stringify(workflow), JSON.stringify(record));
    assert.equal(evidence.status, "attention-required");
    assert.equal(evidence.metrics.unresolvedRisk.count, 1);
    assert.ok(evidence.issues.some((issue) => issue.id === "pilot-implementation-evidence-incomplete"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("review-pilot arguments stay small and reject unknown options", () => {
  assert.deepEqual(parsePilotEvidenceArgs(["implementation.json", "--workflow", "workflow.json", "--record", "pilot.json", "--json"]), {
    implementationEvidencePath: "implementation.json",
    reviewWorkflowPath: "workflow.json",
    recordPath: "pilot.json",
    json: true,
    help: false,
  });
  assert.throws(() => parsePilotEvidenceArgs(["--records"]), /Unknown review-pilot option/);
});
