import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { buildImplementationEvidence } from "./implementation-evidence.mjs";
import { approveImplementationScope, proposeImplementationScope } from "./implementation-scope.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";
import { buildPilotEvidence } from "./pilot-evidence.mjs";
import { validateProjectSnapshot } from "./project-snapshot-contract.mjs";
import { buildProjectSnapshot, inspectProjectSnapshotChain, verifyProjectSnapshot } from "./project-snapshot.mjs";
import { compareReviewReports } from "./review-comparison.mjs";
import { buildReviewHandoff } from "./review-handoff.mjs";
import { verifyReviewHandoff } from "./review-handoff-receipt.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { buildTargetRepoIntake } from "./target-repo-intake.mjs";

const REPOSITORY_URL = "https://github.com/acme/snapshot-product.git";
const HTML = "<!doctype html><html lang=\"ko\"><body><button>저장</button></body></html>";
const OWNER = { name: "project owner", identity: "self-declared", reference: "owner review note" };
const ACCEPTED = { status: "accepted", owner: OWNER, decidedAt: "2026-07-16T00:00:00.000Z", rationale: "Scope delivered." };
const PENDING = { status: "pending", owner: OWNER, decidedAt: null, rationale: "" };

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function targetRepo() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-snapshot-target-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }, null, 2));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.name", "Design AI Test"]);
  git(root, ["config", "user.email", "design-ai@example.com"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "test: initialize snapshot target"]);
  git(root, ["remote", "add", "origin", REPOSITORY_URL]);
  return root;
}

function workflowFor(root, html) {
  return buildReviewWorkflow(html, {
    sourceRef: "settings.html", brief: "설정 저장 흐름을 검토한다", siteName: "Snapshot product", repoUrl: REPOSITORY_URL,
    localPath: root, locale: "ko-KR", viewports: ["mobile", "desktop"], generatedAt: "2026-07-15T00:00:00.000Z",
    sourceRoot: PACKAGE_ROOT, prefix: SYMLINK_PREFIX,
  });
}

function approvalFor(root, workflowSource) {
  const handoff = buildReviewHandoff(workflowSource, { workflowRef: "review-workflow.json", recipient: "codex" });
  const receipt = verifyReviewHandoff(JSON.stringify(handoff), { handoffRef: "review-handoff.json", consumer: "codex" });
  const intake = buildTargetRepoIntake(JSON.stringify(receipt), { receiptRef: "review-handoff-receipt.json", targetRoot: root, consumer: "codex" });
  const request = {
    kind: "design-ai-implementation-scope-request", schemaVersion: 1,
    objective: "Improve the approved settings flow and retain evidence.",
    intendedBehavior: ["The settings flow stays accessible and responsive."],
    files: { inspect: ["src/settings/**"], change: ["src/settings/**"], generated: ["evidence/**"] },
    dependencies: [], migrations: [], externalWrites: [], verificationCommands: ["npm test"],
    risks: ["Runtime behavior requires browser evidence."], preExistingChanges: [],
    release: { commit: true, push: true, deployment: false },
  };
  const proposal = proposeImplementationScope(JSON.stringify(intake), JSON.stringify(request), {
    intakeRef: "target-repo-intake.json", requestRef: "implementation-scope-request.json", consumer: "codex",
  });
  return approveImplementationScope(JSON.stringify(proposal), {
    proposalRef: "implementation-scope-proposal.json", approver: "project owner", approvalRef: "pilot consent record",
    approvedAt: "2026-07-15T00:02:00.000Z", confirmed: true,
  });
}

function evidenceFor(root, approvalSource) {
  mkdirSync(path.join(root, "src", "settings"), { recursive: true });
  mkdirSync(path.join(root, "evidence"), { recursive: true });
  writeFileSync(path.join(root, "src", "settings", "view.tsx"), "export const Settings = () => <button>저장</button>;\n");
  writeFileSync(path.join(root, "evidence", "test.log"), "tests passed\n");
  writeFileSync(path.join(root, "evidence", "browser.json"), "{\"consoleErrors\":0}\n");
  const statusEntries = git(root, ["status", "--short", "--untracked-files=all"]).split("\n").filter(Boolean);
  const request = {
    kind: "design-ai-implementation-evidence-request", schemaVersion: 1, consumer: "codex",
    implementationStartedAt: "2026-07-15T00:03:00.000Z", implementationCompletedAt: "2026-07-15T00:10:00.000Z",
    executedWork: statusEntries.map((statusEntry) => ({ statusEntry, path: statusEntry.slice(3), summary: "Completed approved work." })),
    verificationResults: [{ command: "npm test", status: "pass", startedAt: "2026-07-15T00:08:00.000Z",
      completedAt: "2026-07-15T00:09:00.000Z", exitCode: 0, summary: "Tests passed.", artifacts: ["evidence/test.log"] }],
    observations: ["accessibility", "responsive", "browser"].map((category) => ({ id: category, category,
      status: "confirmed", summary: `${category} checks passed.`, artifacts: ["evidence/browser.json"] })),
    remainingRisks: [],
  };
  return buildImplementationEvidence(approvalSource, JSON.stringify(request), {
    approvalRef: "implementation-scope-approval.json", requestRef: "implementation-evidence-request.json",
    targetRoot: root, consumer: "codex",
  });
}

function pilotRecordFor(approval, workflow) {
  return {
    kind: "design-ai-pilot-record", schemaVersion: 1,
    project: { name: "Acme snapshot product", repositoryUrl: REPOSITORY_URL, pilotClass: "external-pilot" },
    consent: { status: "approved", approver: "project owner", identity: "self-declared", reference: "pilot consent record",
      approvedAt: "2026-07-15T00:01:00.000Z", evidenceCollection: true, targetMutation: true },
    timeline: { pilotStartedAt: "2026-07-15T00:00:00.000Z", firstUsefulArtifactAt: "2026-07-15T00:00:30.000Z",
      implementationCompletedAt: "2026-07-15T00:10:00.000Z" },
    findingDecisions: workflow.report.findings.map((finding) => ({ findingId: finding.id, decision: "accepted",
      summary: "The owner accepted the finding.", reference: "pilot finding review" })),
    approvalEvents: approval.approvalGates.map((gate) => ({ gateId: gate.id, status: gate.status,
      occurredAt: gate.status === "approved" ? "2026-07-15T00:02:00.000Z" : "",
      reference: gate.status === "approved" ? "implementation scope approval" : "implementation scope gate record" })),
    outcome: { implementationStatus: "complete", productionStatus: "not-deployed",
      feedback: { status: "not-collected", summary: "No user feedback was collected.", reference: "" } },
    claims: [
      { class: "real", statement: "The chain ran against a real checkout.", reference: "implementation-evidence.json" },
      { class: "synthetic", statement: "Synthetic benchmarks are separate from this pilot.", reference: "benchmark-suite" },
      { class: "inferred", statement: "The completed workflow suggests the contract is operable.", reference: "pilot metrics" },
      { class: "unverified", statement: "Adoption is not established.", reference: "pilot boundary" },
    ],
  };
}

// One complete chain, with every artifact kept as the exact text a file would hold.
function chain() {
  const root = targetRepo();
  try {
    return chainIn(root);
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

function chainIn(root) {
  const workflow = workflowFor(root, HTML);
  const sources = { reviewWorkflow: { reference: "review-workflow.json", source: JSON.stringify(workflow) } };
  const approval = approvalFor(root, sources.reviewWorkflow.source);
  sources.scopeApproval = { reference: "implementation-scope-approval.json", source: JSON.stringify(approval) };
  const evidence = evidenceFor(root, sources.scopeApproval.source);
  sources.implementationEvidence = { reference: "implementation-evidence.json", source: JSON.stringify(evidence) };
  const pilot = buildPilotEvidence(sources.implementationEvidence.source, sources.reviewWorkflow.source,
    JSON.stringify(pilotRecordFor(approval, workflow)), { implementationEvidenceRef: "implementation-evidence.json",
      reviewWorkflowRef: "review-workflow.json", recordRef: "pilot-record.json" });
  sources.pilotEvidence = { reference: "pilot-evidence.json", source: JSON.stringify(pilot) };
  const comparison = compareReviewReports(JSON.stringify(workflow.report), JSON.stringify(workflow.report));
  sources.comparison = { reference: "review-comparison.json", source: JSON.stringify(comparison) };
  return { root, workflow, sources };
}

const pick = (sources, names) => Object.fromEntries(names.map((name) => [name, sources[name]]));
const snapshotAt = (sources, recordedAt, extra = {}) => buildProjectSnapshot({
  project: { id: "settings-flow" }, recordedAt, sources, decision: ACCEPTED, ...extra,
});
const asInput = (snapshot, reference) => ({ reference, source: JSON.stringify(snapshot) });

test("a snapshot indexes the exact artifact bytes and derives its stage from what is present", () => {
  const { root, workflow, sources } = chain();
  try {
    const stages = [
      [["reviewWorkflow"], "reviewed"],
      [["reviewWorkflow", "scopeApproval"], "scoped"],
      [["reviewWorkflow", "scopeApproval", "implementationEvidence"], "implemented"],
      [["reviewWorkflow", "scopeApproval", "implementationEvidence", "pilotEvidence", "comparison"], "piloted"],
    ];
    for (const [names, stage] of stages) {
      assert.equal(snapshotAt(pick(sources, names), "2026-07-16T00:00:00.000Z").stage, stage);
    }
    const full = snapshotAt(sources, "2026-07-16T00:00:00.000Z");
    assert.equal(full.identity.sourceSha256, workflow.source.sha256);
    assert.equal(full.identity.designContractSha256, workflow.linkage.designContractSha256);
    assert.equal(full.identity.baseline.repositoryUrl, REPOSITORY_URL);
    assert.deepEqual(full.links.map((link) => `${link.from}->${link.to}:${link.status}`), [
      "scopeApproval->reviewWorkflow:verified",
      "implementationEvidence->scopeApproval:verified",
      "comparison->reviewWorkflow:verified",
      "comparison->implementationEvidence:unverified",
      "pilotEvidence->implementationEvidence:verified",
    ]);
    assert.ok(!JSON.stringify(full).includes("\"value\""), "artifact bodies are never embedded");
    assert.ok(JSON.stringify(full).length < 5000, "a snapshot stays a small index");
    assert.deepEqual(full.boundary, { historyDatabase: false, embeddedArtifacts: false, restore: "read-only",
      automaticLearning: false, targetWrites: false });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a snapshot accepts review comparisons from either schema version", () => {
  const { root, sources } = chain();
  try {
    assert.equal(snapshotAt(sources, "2026-07-16T00:00:00.000Z").artifacts.comparison.schemaVersion, 2);
    const stored = { ...JSON.parse(sources.comparison.source), schemaVersion: 1 };
    const v1 = snapshotAt({ ...sources, comparison: { reference: "review-comparison.json", source: JSON.stringify(stored) } },
      "2026-07-16T00:00:00.000Z");
    assert.equal(v1.artifacts.comparison.schemaVersion, 1);
    const forged = structuredClone(v1);
    forged.artifacts.comparison.schemaVersion = 3;
    assert.throws(() => validateProjectSnapshot(forged), /comparison\.schemaVersion must be 1 or 2/);
    forged.artifacts.comparison.schemaVersion = 1;
    forged.artifacts.reviewWorkflow.schemaVersion = 2;
    assert.throws(() => validateProjectSnapshot(forged), /reviewWorkflow\.schemaVersion must be 1$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("artifacts from different work cannot be joined into one snapshot", () => {
  const { root, sources } = chain();
  const otherRoot = targetRepo();
  try {
    const other = workflowFor(otherRoot, HTML.replace("저장", "변경 사항 저장"));
    const otherSource = JSON.stringify(other);
    assert.throws(() => snapshotAt({ ...pick(sources, ["scopeApproval"]), reviewWorkflow: { reference: "w.json", source: otherSource } },
      "2026-07-16T00:00:00.000Z"), /different review workflow/);
    assert.throws(() => snapshotAt(pick(sources, ["reviewWorkflow", "implementationEvidence"]), "2026-07-16T00:00:00.000Z"),
      /requires the scope approval/);
    const foreign = compareReviewReports(JSON.stringify(other.report), JSON.stringify(other.report));
    assert.throws(() => snapshotAt({ ...pick(sources, ["reviewWorkflow"]), comparison: { reference: "c.json", source: JSON.stringify(foreign) } },
      "2026-07-16T00:00:00.000Z"), /comparison baseline is not the reviewed quality report/);
    const reformatted = { reference: "i.json", source: JSON.stringify(JSON.parse(sources.scopeApproval.source), null, 2) };
    assert.throws(() => snapshotAt({ ...pick(sources, ["reviewWorkflow", "implementationEvidence", "pilotEvidence"]),
      scopeApproval: reformatted }, "2026-07-16T00:00:00.000Z"), /embeds a different scope approval/,
    "links bind exact bytes, so a reformatted file is a different artifact");
    assert.throws(() => snapshotAt({ ...sources, reviewWorkflow: { reference: "x.json", source: sources.scopeApproval.source } },
      "2026-07-16T00:00:00.000Z"), /must be a design-ai-review-workflow artifact/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(otherRoot, { recursive: true, force: true });
  }
});

test("owner decisions and successors follow the recorded rules", () => {
  const { root, sources } = chain();
  try {
    const base = pick(sources, ["reviewWorkflow"]);
    assert.throws(() => snapshotAt(base, "2026-07-16T00:00:00.000Z", { decision: { ...PENDING, decidedAt: "2026-07-16T00:00:00.000Z" } }),
      /null while the decision is pending/);
    assert.throws(() => snapshotAt(base, "2026-07-16T00:00:00.000Z", { decision: { ...ACCEPTED, rationale: "" } }), /rationale/);
    assert.throws(() => snapshotAt(base, "2026-07-16T00:00:00.000Z", { decision: { ...ACCEPTED, owner: { ...OWNER, identity: "verified" } } }),
      /self-declared/);
    const first = snapshotAt(base, "2026-07-16T00:00:00.000Z");
    const pendingFirst = snapshotAt(base, "2026-07-16T00:00:00.000Z", { decision: PENDING });
    const next = snapshotAt(sources, "2026-07-17T00:00:00.000Z", { predecessor: asInput(first, "snapshot-1.json") });
    assert.equal(next.predecessor.reference, "snapshot-1.json");
    assert.throws(() => snapshotAt(sources, "2026-07-17T00:00:00.000Z", { predecessor: asInput(pendingFirst, "p.json") }),
      /owner decision is recorded/);
    assert.throws(() => snapshotAt(sources, "2026-07-15T23:00:00.000Z", { predecessor: asInput(first, "s.json"), decision: PENDING }),
      /after its predecessor/);
    assert.throws(() => snapshotAt(base, "2026-07-15T00:00:00.000Z"), /decidedAt cannot be later than/);
    assert.throws(() => buildProjectSnapshot({ project: { id: "other-flow" }, recordedAt: "2026-07-17T00:00:00.000Z", sources,
      decision: ACCEPTED, predecessor: asInput(first, "s.json") }), /different project/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("verification detects artifact drift and snapshots edited after the fact", () => {
  const { root, sources } = chain();
  try {
    const snapshot = snapshotAt(sources, "2026-07-16T00:00:00.000Z");
    const input = asInput(snapshot, "snapshot.json");
    assert.deepEqual(verifyProjectSnapshot(input, sources).drift, []);
    const edited = { ...sources, comparison: { ...sources.comparison, source: `${sources.comparison.source}\n` } };
    assert.match(verifyProjectSnapshot(input, edited).drift[0], /comparison bytes changed/);
    const missing = { ...sources, pilotEvidence: undefined };
    assert.match(verifyProjectSnapshot(input, missing).drift[0], /pilotEvidence is missing/);
    const forged = structuredClone(snapshot);
    forged.identity.sourceSha256 = "0".repeat(64);
    const report = verifyProjectSnapshot(asInput(forged, "forged.json"), sources);
    assert.equal(report.status, "drift");
    assert.match(report.drift[0], /does not match a rebuild/);
    const restaged = structuredClone(snapshot);
    restaged.stage = "reviewed";
    assert.throws(() => validateProjectSnapshot(restaged), /stage must be piloted/);
    const embedded = structuredClone(snapshot);
    embedded.boundary.historyDatabase = true;
    assert.throws(() => validateProjectSnapshot(embedded), /fixed read-only boundary/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a chain yields its order, successors, and a read-only restore plan", () => {
  const { root, sources } = chain();
  try {
    const one = snapshotAt(pick(sources, ["reviewWorkflow"]), "2026-07-16T00:00:00.000Z");
    const two = snapshotAt(pick(sources, ["reviewWorkflow", "scopeApproval"]), "2026-07-17T00:00:00.000Z",
      { predecessor: asInput(one, "snapshot-1.json") });
    const three = snapshotAt(sources, "2026-07-18T00:00:00.000Z", { predecessor: asInput(two, "snapshot-2.json"), decision: PENDING });
    const inputs = [asInput(three, "snapshot-3.json"), asInput(one, "snapshot-1.json"), asInput(two, "snapshot-2.json")];
    const chainReport = inspectProjectSnapshotChain(inputs);
    assert.equal(chainReport.status, "linear");
    assert.deepEqual(chainReport.order.map((item) => [item.reference, item.stage, item.decision]), [
      ["snapshot-1.json", "reviewed", "accepted"], ["snapshot-2.json", "scoped", "accepted"], ["snapshot-3.json", "piloted", "pending"],
    ]);
    assert.equal(chainReport.restore.writes, false);
    assert.equal(chainReport.restore.head.reference, "snapshot-3.json");
    assert.deepEqual(chainReport.restore.artifacts.map((artifact) => artifact.reference).sort(),
      Object.values(sources).map((source) => source.reference).sort());

    const fork = snapshotAt(pick(sources, ["reviewWorkflow", "comparison"]), "2026-07-17T12:00:00.000Z",
      { predecessor: asInput(one, "snapshot-1.json") });
    const forked = inspectProjectSnapshotChain([...inputs, asInput(fork, "snapshot-2b.json")]);
    assert.equal(forked.status, "needs-review");
    assert.equal(forked.restore.head, null);
    assert.match(forked.issues.join("\n"), /forked into 2 successors/);
    const orphan = inspectProjectSnapshotChain([asInput(three, "snapshot-3.json")]);
    assert.match(orphan.issues.join("\n"), /predecessor .* is not among the supplied snapshots/);
    assert.throws(() => inspectProjectSnapshotChain([inputs[1], inputs[1]]), /supplied more than once/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("contract rejects forged links, identity types, and accepted blocked evidence", () => {
  const { root, sources } = chain();
  try {
    const snapshot = snapshotAt(sources, "2026-07-16T00:00:00.000Z");
    const forge = (edit) => {
      const copy = structuredClone(snapshot);
      edit(copy);
      return () => validateProjectSnapshot(copy);
    };
    assert.throws(forge((s) => { s.links = []; }), /exactly the links its artifacts require/);
    assert.throws(forge((s) => { s.links[3].status = "verified"; }), /exactly the links/);
    assert.throws(forge((s) => { s.links.push({ from: "pilotEvidence", to: "nowhere", check: "x", status: "verified" }); }), /exactly the links/);
    assert.throws(forge((s) => { s.identity.comparisonStatus = 42; }), /comparisonStatus must be one of/);
    assert.throws(forge((s) => { s.identity.baseline.repositoryUrl = 1; }), /repositoryUrl must be a non-empty string/);
    assert.throws(forge((s) => { s.identity.implementationStatus = "blocked"; }), /blocked evidence cannot be accepted/);
    const onlyComparison = snapshotAt(pick(sources, ["reviewWorkflow", "comparison"]), "2026-07-16T00:00:00.000Z");
    assert.deepEqual(onlyComparison.links.map((link) => link.to), ["reviewWorkflow"], "no link names an absent artifact");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pilot evidence for another repository is refused as different work", () => {
  const root = targetRepo();
  try {
    const { sources } = chainIn(root);
    const workflow = JSON.parse(sources.reviewWorkflow.source);
    const approval = JSON.parse(sources.scopeApproval.source);
    const foreignRecord = pilotRecordFor(approval, workflow);
    foreignRecord.project.repositoryUrl = "https://github.com/acme/unrelated.git";
    const pilot = buildPilotEvidence(sources.implementationEvidence.source, sources.reviewWorkflow.source,
      JSON.stringify(foreignRecord), { implementationEvidenceRef: "i.json", reviewWorkflowRef: "w.json", recordRef: "r.json" });
    assert.equal(pilot.status, "blocked");
    assert.throws(() => snapshotAt({ ...sources, pilotEvidence: { reference: "p.json", source: JSON.stringify(pilot) } },
      "2026-07-16T00:00:00.000Z", { decision: PENDING }), /pilot record describes different work/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("verification reports drift instead of throwing and names what it cannot prove", () => {
  const { root, sources } = chain();
  try {
    const first = snapshotAt(pick(sources, ["reviewWorkflow"]), "2026-07-16T00:00:00.000Z");
    const second = snapshotAt(pick(sources, ["reviewWorkflow"]), "2026-07-17T00:00:00.000Z", { predecessor: asInput(first, "s1.json") });
    const input = asInput(second, "s2.json");
    const base = pick(sources, ["reviewWorkflow"]);
    const ok = verifyProjectSnapshot(input, base, { predecessor: asInput(first, "s1.json") });
    assert.equal(ok.status, "verified");
    assert.deepEqual(ok.notProvenByArtifacts, ["project.id", "recordedAt", "decision"]);
    assert.match(verifyProjectSnapshot(input, base).drift[0], /recorded predecessor was not supplied/);
    assert.match(verifyProjectSnapshot(input, { reviewWorkflow: { reference: "w.json" } }, { predecessor: asInput(first, "s1.json") }).drift[0],
      /supplied without its file text/);
    assert.match(verifyProjectSnapshot(input, { ...base, extra: base.reviewWorkflow }, { predecessor: asInput(first, "s1.json") }).drift[0],
      /extra is not a snapshot artifact/);
    const renamed = { reviewWorkflow: { ...base.reviewWorkflow, reference: "moved/review-workflow.json" } };
    assert.match(verifyProjectSnapshot(input, renamed, { predecessor: asInput(first, "s1.json") }).drift[0], /reference changed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a chain re-checks every successor rule, even for hand-edited snapshots", () => {
  const { root, sources } = chain();
  try {
    const base = pick(sources, ["reviewWorkflow", "scopeApproval"]);
    const pendingFirst = snapshotAt(base, "2026-07-16T00:00:00.000Z", { decision: PENDING });
    const pendingInput = asInput(pendingFirst, "s1.json");
    const accepted = snapshotAt(base, "2026-07-16T00:00:00.000Z");
    const handEdited = structuredClone(snapshotAt(base, "2026-07-17T00:00:00.000Z", { predecessor: asInput(accepted, "a.json") }));
    handEdited.predecessor = { reference: "s1.json", sha256: createHash("sha256").update(pendingInput.source).digest("hex"),
      bytes: Buffer.byteLength(pendingInput.source) };
    Object.assign(handEdited, { recordedAt: "2026-07-15T00:00:00.000Z", decision: PENDING });
    handEdited.identity.baseline.repositoryUrl = "https://github.com/acme/elsewhere.git";
    const report = inspectProjectSnapshotChain([pendingInput, asInput(handEdited, "s2.json")]);
    assert.equal(report.status, "needs-review");
    assert.equal(report.restore.head, null);
    for (const rule of [/owner decision is recorded/, /recorded after its predecessor/, /repository changed/]) {
      assert.match(report.issues.join("\n"), rule);
    }
    assert.equal(report.order.length, 2, "the order is still reported for review");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
