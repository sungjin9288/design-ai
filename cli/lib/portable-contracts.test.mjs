import assert from "node:assert/strict";
import { test } from "node:test";

import { buildArtifact } from "./artifact.mjs";
import { validateDesignArtifact } from "./artifact-contract.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import { validateStartPayload } from "./start-contract.mjs";
import { buildStartPayload } from "./start-operation.mjs";

const BRIEF = "Design a Korean approval workspace";

test("design artifact validator pins workflow, approval, and verification contracts", () => {
  const artifact = buildArtifact({
    mode: "design-contract",
    brief: BRIEF,
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
    routeId: "design-from-brief",
  });
  assert.equal(validateDesignArtifact(artifact), artifact);

  const missingWorkflow = structuredClone(artifact);
  missingWorkflow.workflow = [];
  assert.throws(() => validateDesignArtifact(missingWorkflow), /workflow must be a non-empty array/);

  const unknownMode = structuredClone(artifact);
  unknownMode.mode = "invented-mode";
  assert.throws(() => validateDesignArtifact(unknownMode), /mode must be one of/);

  for (const requirement of artifact.approval.requiresApproval) {
    const missingApproval = structuredClone(artifact);
    missingApproval.approval.requiresApproval = missingApproval.approval.requiresApproval.filter((item) => item !== requirement);
    assert.throws(() => validateDesignArtifact(missingApproval), /preserve all four permission gates/);
  }

  const invalidRoute = structuredClone(artifact);
  invalidRoute.route.score = "high";
  assert.throws(() => validateDesignArtifact(invalidRoute), /route.score must be a finite number/);

  const falseForcedProvenance = structuredClone(artifact);
  falseForcedProvenance.route.confidence = "high";
  assert.throws(() => validateDesignArtifact(falseForcedProvenance), /confidence and forced provenance must agree/);
});

test("design artifact validator accepts automatic, fallback, and forced routes", () => {
  const automatic = buildArtifact({
    mode: "implementation-plan",
    brief: "spec a Button component",
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
  });
  const fallback = buildArtifact({
    mode: "implementation-plan",
    brief: "zzzxxyy unmatched",
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
  });
  const forced = buildArtifact({
    mode: "implementation-plan",
    brief: BRIEF,
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
    routeId: "design-from-brief",
  });

  assert.equal(validateDesignArtifact(automatic), automatic);
  assert.equal(Object.hasOwn(automatic.route, "forced"), false);
  assert.equal(validateDesignArtifact(fallback), fallback);
  assert.equal(fallback.route.fallback, true);
  const falseFallbackProvenance = structuredClone(fallback);
  falseFallbackProvenance.route.confidence = "medium";
  assert.throws(() => validateDesignArtifact(falseFallbackProvenance), /fallback provenance must identify/);
  assert.equal(validateDesignArtifact(forced), forced);
  assert.equal(forced.route.forced, true);
});

test("start validator delegates its artifact contract and rejects performed writes", () => {
  const payload = buildStartPayload({ brief: BRIEF, sourceRoot: PACKAGE_ROOT, prefix: "design-", routeId: "design-from-brief" });
  assert.equal(validateStartPayload(payload), payload);

  const changedArtifact = structuredClone(payload);
  delete changedArtifact.designContract.verification;
  assert.throws(() => validateStartPayload(changedArtifact), /design artifact keys must be exactly/);

  const performedWrite = structuredClone(payload);
  performedWrite.effects.performed.localWrites.push({ reference: "unexpected" });
  assert.throws(() => validateStartPayload(performedWrite), /performed localWrites/);

  const invalidScreenshot = structuredClone(payload);
  invalidScreenshot.context.screenshots.push(42);
  assert.throws(() => validateStartPayload(invalidScreenshot), /screenshots\[0\] must be a non-empty string/);

  const invalidKeyword = structuredClone(payload);
  invalidKeyword.route.matchedKeywords.push(42);
  assert.throws(() => validateStartPayload(invalidKeyword), /matchedKeywords\[0\] must be a non-empty string/);

  const invalidEffect = structuredClone(payload);
  invalidEffect.effects.performed.reads[0] = { kind: "design-ai-corpus", reference: 42 };
  assert.throws(() => validateStartPayload(invalidEffect), /reference must be a non-empty string/);

  const inventedWrite = structuredClone(payload);
  inventedWrite.effects.intended.localWrites.push({ reference: "arbitrary-local-output.txt", status: "not-performed" });
  assert.throws(() => validateStartPayload(inventedWrite), /localWrites must match the selected pathway/);

  const websitePayload = buildStartPayload({
    brief: "Improve the existing website",
    sourceRoot: PACKAGE_ROOT,
    prefix: "design-",
    routeId: "website-improvement",
    context: { siteName: "Acme", url: "https://example.com" },
  });
  assert.equal(validateStartPayload(websitePayload), websitePayload);
  assert.deepEqual(websitePayload.effects.intended.localWrites, [
    { reference: "website-workspace.json", status: "not-performed" },
  ]);
});
