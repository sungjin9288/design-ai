import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { validateDesignArtifact } from "./artifact-contract.mjs";
import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import { inspectHtml } from "./design-quality-inspector.mjs";
import { PACKAGE_ROOT, SYMLINK_PREFIX } from "./paths.mjs";
import { validateStartPayload } from "./start-contract.mjs";
import { buildStartPayload } from "./start-operation.mjs";
import {
  loadSpecializationBenchmarkSuite,
  packagedBenchmarkEvidence,
  validateBenchmarkCaseStudy,
} from "./specialization-benchmark-suite.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const OPTIONS = ["-h", "--help", "--json", "--list", "--strict"];
const SUITE_PATH = "examples/benchmarks/product-specialization/suite.json";

export { loadSpecializationBenchmarkSuite } from "./specialization-benchmark-suite.mjs";

export function parseSpecializationBenchmarkArgs(args) {
  const parsed = { id: "", json: false, list: false, strict: false, help: false };
  for (const arg of args) {
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--list") parsed.list = true;
    else if (arg === "--strict") parsed.strict = true;
    else if (arg.startsWith("-")) throw new Error(unknownOptionMessage("benchmark", arg, OPTIONS));
    else if (!parsed.id) parsed.id = arg;
    else throw new Error(`benchmark accepts one case id; received unexpected argument: ${arg}`);
  }
  if (parsed.list && parsed.id) throw new Error("benchmark --list cannot be combined with a case id");
  if (parsed.list && parsed.strict) throw new Error("benchmark --list cannot be combined with --strict");
  return parsed;
}

function payloadDigest(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function contractCheck(name, payload, validate) {
  try {
    validate(payload);
    return {
      name,
      kind: payload.kind,
      schemaVersion: payload.schemaVersion,
      sha256: payloadDigest(payload),
      valid: true,
      error: null,
    };
  } catch (error) {
    return {
      name,
      kind: payload?.kind || null,
      schemaVersion: payload?.schemaVersion || null,
      sha256: payload ? payloadDigest(payload) : null,
      valid: false,
      error: error.message,
    };
  }
}

function confirmedIds(report) {
  return report.findings.filter((finding) => finding.status === "confirmed").map((finding) => finding.id).sort();
}

function unverifiedIds(report) {
  return report.findings.filter((finding) => finding.status === "unverified").map((finding) => finding.id).sort();
}

function difference(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => !rightSet.has(item));
}

function findingSet(report, expectedConfirmed, requiredUnverified) {
  const expected = [...expectedConfirmed].sort();
  const required = [...requiredUnverified].sort();
  const observedConfirmed = confirmedIds(report);
  const observedUnverified = unverifiedIds(report);
  return {
    confirmed: {
      expected,
      observed: observedConfirmed,
      falseNegatives: difference(expected, observedConfirmed),
      falsePositives: difference(observedConfirmed, expected),
    },
    unverified: {
      required,
      observed: observedUnverified,
      missingRequired: difference(required, observedUnverified),
      unexpected: difference(observedUnverified, required),
    },
  };
}

function findingSetPassed(result) {
  return result.confirmed.falseNegatives.length === 0
    && result.confirmed.falsePositives.length === 0
    && result.unverified.missingRequired.length === 0
    && result.unverified.unexpected.length === 0;
}

function compareSingleReport(report, expectation) {
  const candidate = findingSet(report, expectation.candidateConfirmed, expectation.requiredUnverified);
  return {
    unit: "finding-id",
    status: findingSetPassed(candidate) ? "pass" : "fail",
    candidate,
    falsePositiveNotes: [...expectation.falsePositiveNotes],
  };
}

function compareBeforeAfter(before, after, expectation) {
  const beforeResult = findingSet(before, expectation.beforeConfirmed, expectation.persistentUnverified);
  const afterResult = findingSet(after, expectation.afterConfirmed, expectation.persistentUnverified);
  const status = findingSetPassed(beforeResult) && findingSetPassed(afterResult) ? "pass" : "fail";
  return {
    unit: "finding-id",
    status,
    before: beforeResult,
    after: afterResult,
    fixed: difference(beforeResult.confirmed.observed, afterResult.confirmed.observed),
    falsePositiveNotes: [...expectation.falsePositiveNotes],
  };
}

function readFixture(root, relativePath) {
  const evidence = packagedBenchmarkEvidence(root, relativePath, "benchmark fixture");
  return { evidence, source: readFileSync(evidence.absolutePath, "utf8") };
}

function qualityReport(definition, fixture) {
  return inspectHtml(fixture.source, {
    sourceRef: fixture.evidence.path,
    brief: definition.brief,
    locale: definition.input.locale,
    viewports: definition.input.viewports,
    reviewPack: definition.input.reviewPack || undefined,
    generatedAt: "2026-07-15T00:00:00.000Z",
  });
}

function publicEvidence(evidence) {
  return { path: evidence.path, sha256: evidence.sha256, size: evidence.size };
}

function baseResult(definition, root, inputs) {
  return {
    id: definition.id,
    name: definition.name,
    journey: definition.journey,
    operation: definition.operation,
    evidenceClass: "synthetic-fixture",
    adoptionClaim: "none",
    inputs: inputs.map(publicEvidence),
    caseStudy: validateBenchmarkCaseStudy(root, definition.caseStudy),
    boundary: { ...definition.boundary },
  };
}

function runNewDesignCase(definition, root) {
  const fixture = readFixture(root, definition.input.source);
  const start = buildStartPayload({
    brief: definition.brief,
    sourceRoot: root,
    prefix: SYMLINK_PREFIX,
    routeId: definition.input.routeId,
    context: { locale: definition.input.locale, viewports: definition.input.viewports },
  });
  const report = qualityReport(definition, fixture);
  const contracts = [
    contractCheck("start payload", start, validateStartPayload),
    contractCheck("embedded design artifact", start.designContract, validateDesignArtifact),
    contractCheck("fixture candidate quality report", report, validateDesignQualityReport),
  ];
  const findingComparison = compareSingleReport(report, definition.expectation);
  const expectedContract = start.route.id === definition.expectation.routeId
    && start.designContract.mode === definition.expectation.artifactMode
    && start.designContract.outputFile === definition.expectation.outputFile;
  return {
    ...baseResult(definition, root, [fixture.evidence]),
    status: contracts.every((check) => check.valid) && expectedContract && findingComparison.status === "pass" ? "pass" : "fail",
    contracts,
    findingComparison,
    handoff: null,
    observation: {
      routeId: start.route.id,
      artifactMode: start.designContract.mode,
      outputFile: start.designContract.outputFile,
      candidateAuthorship: "fixture-authored",
      reviewExecuted: start.review.executed,
    },
  };
}

function runQualityComparisonCase(definition, root) {
  const beforeFixture = readFixture(root, definition.input.before);
  const afterFixture = readFixture(root, definition.input.after);
  const before = qualityReport(definition, beforeFixture);
  const after = qualityReport(definition, afterFixture);
  const contracts = [
    contractCheck("before quality report", before, validateDesignQualityReport),
    contractCheck("after quality report", after, validateDesignQualityReport),
  ];
  const findingComparison = compareBeforeAfter(before, after, definition.expectation);
  return {
    ...baseResult(definition, root, [beforeFixture.evidence, afterFixture.evidence]),
    status: contracts.every((check) => check.valid) && findingComparison.status === "pass" ? "pass" : "fail",
    contracts,
    findingComparison,
    handoff: null,
    observation: { before: definition.input.before, after: definition.input.after },
  };
}

function handoffEnvelope(payload, sender, recipient, validate) {
  const serialized = JSON.stringify(payload);
  const received = JSON.parse(serialized);
  const sentSha256 = createHash("sha256").update(serialized).digest("hex");
  const receivedSha256 = payloadDigest(received);
  let consumerValidation = "pass";
  try {
    validate(received);
  } catch {
    consumerValidation = "fail";
  }
  return {
    sender,
    recipient,
    artifact: { kind: payload.kind, schemaVersion: payload.schemaVersion, sha256: sentSha256 },
    received: { sha256: receivedSha256, consumerValidation },
    valid: sentSha256 === receivedSha256 && consumerValidation === "pass",
  };
}

function runHandoffCase(definition, root) {
  const fixture = readFixture(root, definition.input.source);
  const start = buildStartPayload({
    brief: definition.brief,
    sourceRoot: root,
    prefix: SYMLINK_PREFIX,
    routeId: definition.input.routeId,
    context: { locale: definition.input.locale, viewports: definition.input.viewports },
  });
  const report = qualityReport(definition, fixture);
  const handoff = [
    handoffEnvelope(start, definition.input.producer, definition.input.consumer, validateStartPayload),
    handoffEnvelope(report, definition.input.producer, definition.input.consumer, validateDesignQualityReport),
  ];
  const contracts = [
    contractCheck("producer start payload", start, validateStartPayload),
    contractCheck("producer design artifact", start.designContract, validateDesignArtifact),
    contractCheck("reviewer quality report", report, validateDesignQualityReport),
  ];
  const findingComparison = compareBeforeAfter(report, JSON.parse(JSON.stringify(report)), definition.expectation);
  return {
    ...baseResult(definition, root, [fixture.evidence]),
    status: contracts.every((check) => check.valid)
      && handoff.every((envelope) => envelope.valid)
      && findingComparison.status === "pass" ? "pass" : "fail",
    contracts,
    findingComparison,
    handoff,
    observation: {
      producer: definition.input.producer,
      consumer: definition.input.consumer,
      approvalGatePreserved: start.effects.approvalRequiredBefore.includes("editing a target repository"),
    },
  };
}

function runCase(definition, root) {
  if (definition.operation === "new-design-contract") return runNewDesignCase(definition, root);
  if (definition.operation === "quality-comparison") return runQualityComparisonCase(definition, root);
  return runHandoffCase(definition, root);
}

export function listSpecializationBenchmarks(root = PACKAGE_ROOT) {
  const suite = loadSpecializationBenchmarkSuite(root);
  const evidence = packagedBenchmarkEvidence(root, SUITE_PATH, "benchmark suite");
  return {
    kind: "design-ai-specialization-benchmark-list",
    schemaVersion: 1,
    suite: { revision: suite.revision, path: evidence.path, sha256: evidence.sha256 },
    cases: suite.cases.map(({ id, name, journey, operation, caseStudy }) => ({ id, name, journey, operation, caseStudy })),
  };
}

export function runSpecializationBenchmarks({ id = "", root = PACKAGE_ROOT } = {}) {
  const suite = loadSpecializationBenchmarkSuite(root);
  const suiteEvidence = packagedBenchmarkEvidence(root, SUITE_PATH, "benchmark suite");
  const definitions = id ? suite.cases.filter((definition) => definition.id === id) : suite.cases;
  if (definitions.length === 0) throw new Error(`Unknown benchmark case: ${id}`);
  const cases = definitions.map((definition) => runCase(definition, root));
  const failedCases = cases.filter((result) => result.status === "fail").length;
  const contractFailures = cases.flatMap((result) => result.contracts).filter((check) => !check.valid).length;
  const findingRegressions = cases.filter((result) => result.findingComparison.status === "fail").length;
  return {
    kind: "design-ai-specialization-benchmark-report",
    schemaVersion: 1,
    suite: { revision: suite.revision, path: suiteEvidence.path, sha256: suiteEvidence.sha256 },
    status: failedCases === 0 ? "pass" : "fail",
    summary: {
      cases: cases.length,
      passedCases: cases.length - failedCases,
      failedCases,
      contractFailures,
      findingRegressions,
    },
    boundary: {
      mode: "read-only",
      targetRepoMutation: false,
      externalWrites: false,
      localWrites: false,
    },
    cases,
  };
}

export function renderSpecializationBenchmarkMarkdown(result) {
  if (result.kind === "design-ai-specialization-benchmark-list") {
    return [
      "# Product specialization benchmarks",
      "",
      ...result.cases.map((item) => `- **${item.id}** — ${item.name} (${item.journey}; ${item.caseStudy})`),
    ].join("\n");
  }

  return [
    "# Product specialization benchmark report",
    "",
    `- Status: **${result.status}**`,
    `- Cases: ${result.summary.passedCases}/${result.summary.cases} passed`,
    `- Contract failures: ${result.summary.contractFailures}`,
    `- Finding regressions: ${result.summary.findingRegressions}`,
    "- Aggregate quality score: not used",
    "- Boundary: read-only; no local writes, target-repository mutation, or external writes",
    "",
    ...result.cases.flatMap((item) => [
      `## ${item.name}`,
      "",
      `- Journey: ${item.journey}`,
      `- Status: **${item.status}**`,
      `- Contracts: ${item.contracts.filter((check) => check.valid).length}/${item.contracts.length} valid`,
      `- Finding comparison: ${item.findingComparison.status} (${item.findingComparison.unit})`,
      `- Case study: ${item.caseStudy.path}`,
      "",
    ]),
  ].join("\n").trimEnd();
}
