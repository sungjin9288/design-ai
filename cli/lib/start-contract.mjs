import { isDeepStrictEqual } from "node:util";

import { validateDesignArtifact } from "./artifact-contract.mjs";

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, field) {
  const actual = Object.keys(object(value, field)).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
  }
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
}

function string(value, field) {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
}

function array(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value;
}

function stringList(value, field) {
  array(value, field).forEach((item, index) => text(item, `${field}[${index}]`));
  return value;
}

function declaredReferences(context) {
  const references = [];
  if (context.repoUrl) references.push({ kind: "repository-url", reference: context.repoUrl, status: "declared-not-read" });
  if (context.localPath) references.push({ kind: "local-path", reference: context.localPath, status: "declared-not-read" });
  if (context.url) references.push({ kind: "page-url", reference: context.url, status: "declared-not-read" });
  for (const screenshot of context.screenshots) {
    references.push({ kind: "screenshot", reference: screenshot, status: "declared-not-read" });
  }
  return references;
}

function validatePerformedRead(value, field) {
  exactKeys(value, ["kind", "reference"], field);
  if (value.kind !== "design-ai-corpus") throw new Error(`${field}.kind must be design-ai-corpus`);
  text(value.reference, `${field}.reference`);
}

function validateDeclaredReference(value, field) {
  exactKeys(value, ["kind", "reference", "status"], field);
  if (!["repository-url", "local-path", "page-url", "screenshot"].includes(value.kind)) {
    throw new Error(`${field}.kind is unsupported`);
  }
  text(value.reference, `${field}.reference`);
  if (value.status !== "declared-not-read") throw new Error(`${field}.status must be declared-not-read`);
}

function validateIntendedWrite(value, field) {
  exactKeys(value, ["reference", "status"], field);
  text(value.reference, `${field}.reference`);
  if (value.status !== "not-performed") throw new Error(`${field}.status must be not-performed`);
}

function validateExternalAction(value, field) {
  exactKeys(value, ["action", "reference", "status"], field);
  if (value.action !== "inspect-reference") throw new Error(`${field}.action must be inspect-reference`);
  text(value.reference, `${field}.reference`);
  if (value.status !== "not-performed") throw new Error(`${field}.status must be not-performed`);
}

export function validateStartPayload(payload) {
  exactKeys(payload, [
    "kind",
    "schemaVersion",
    "brief",
    "context",
    "route",
    "designContract",
    "review",
    "pathway",
    "effects",
  ], "start payload");
  if (payload.kind !== "design-ai-start" || payload.schemaVersion !== 1) {
    throw new Error("start payload kind and schemaVersion must be design-ai-start v1");
  }
  text(payload.brief, "start payload.brief");
  exactKeys(payload.context, ["siteName", "repoUrl", "localPath", "url", "screenshots", "locale", "viewports"], "start payload.context");
  for (const field of ["siteName", "repoUrl", "localPath", "url", "locale"]) {
    string(payload.context[field], `start payload.context.${field}`);
  }
  stringList(payload.context.screenshots, "start payload.context.screenshots");
  stringList(payload.context.viewports, "start payload.context.viewports");
  exactKeys(payload.route, ["id", "label", "confidence", "matchedKeywords"], "start payload.route");
  text(payload.route.id, "start payload.route.id");
  text(payload.route.label, "start payload.route.label");
  if (!["high", "medium", "low", "catalog", "forced"].includes(payload.route.confidence)) {
    throw new Error("start payload.route.confidence is unsupported");
  }
  stringList(payload.route.matchedKeywords, "start payload.route.matchedKeywords");
  validateDesignArtifact(payload.designContract);
  const contractRoute = payload.designContract.route;
  const expectedRoute = {
    id: contractRoute.id,
    label: contractRoute.label,
    confidence: contractRoute.confidence,
    matchedKeywords: contractRoute.matchedKeywords,
  };
  if (!isDeepStrictEqual(payload.route, expectedRoute)) {
    throw new Error("start payload route must match the embedded design contract route summary");
  }
  exactKeys(payload.review, ["status", "routeId", "executed", "sourceFiles"], "start payload.review");
  if (payload.review.status !== "playbook-ready-not-run" || payload.review.executed !== false) {
    throw new Error("start payload must not claim an executed review");
  }
  if (payload.review.routeId !== payload.route.id) throw new Error("start payload review route changed");
  stringList(payload.review.sourceFiles, "start payload.review.sourceFiles");
  if (payload.review.sourceFiles.some((source) => !payload.designContract.sourceFiles.includes(source))) {
    throw new Error("start payload review sources must come from the embedded design contract");
  }
  exactKeys(payload.pathway, ["id", "status", "reason", "missingInputs", "commandArgs", "command"], "start payload.pathway");
  for (const field of ["id", "status", "reason", "command"]) text(payload.pathway[field], `start payload.pathway.${field}`);
  if (!["website-improvement", "design-review", "implementation-plan"].includes(payload.pathway.id)) {
    throw new Error("start payload.pathway.id is unsupported");
  }
  if (!["needs-input", "ready", "playbook-ready"].includes(payload.pathway.status)) {
    throw new Error("start payload.pathway.status is unsupported");
  }
  stringList(payload.pathway.missingInputs, "start payload.pathway.missingInputs");
  stringList(payload.pathway.commandArgs, "start payload.pathway.commandArgs");
  exactKeys(payload.effects, ["performed", "intended", "approvalRequiredBefore"], "start payload.effects");
  const effectKeys = ["reads", "localWrites", "targetRepoMutations", "externalActions"];
  exactKeys(payload.effects.performed, effectKeys, "start payload.effects.performed");
  exactKeys(payload.effects.intended, effectKeys, "start payload.effects.intended");
  array(payload.effects.performed.reads, "start payload.effects.performed.reads").forEach((item, index) => {
    validatePerformedRead(item, `start payload.effects.performed.reads[${index}]`);
  });
  for (const field of ["localWrites", "targetRepoMutations", "externalActions"]) {
    array(payload.effects.performed[field], `start payload.effects.performed.${field}`);
    if (payload.effects.performed[field].length !== 0) throw new Error(`start payload performed ${field}`);
  }
  const expectedReads = payload.designContract.sourceFiles.map((reference) => ({ kind: "design-ai-corpus", reference }));
  if (!isDeepStrictEqual(payload.effects.performed.reads, expectedReads)) {
    throw new Error("start payload performed reads must match the embedded design contract sources");
  }
  array(payload.effects.intended.reads, "start payload.effects.intended.reads").forEach((item, index) => {
    validateDeclaredReference(item, `start payload.effects.intended.reads[${index}]`);
  });
  if (!isDeepStrictEqual(payload.effects.intended.reads, declaredReferences(payload.context))) {
    throw new Error("start payload intended reads must match declared context references");
  }
  array(payload.effects.intended.localWrites, "start payload.effects.intended.localWrites").forEach((item, index) => {
    validateIntendedWrite(item, `start payload.effects.intended.localWrites[${index}]`);
  });
  const expectedLocalWrites = payload.pathway.id === "website-improvement" && payload.pathway.status === "ready"
    ? [{ reference: "website-workspace.json", status: "not-performed" }]
    : [];
  if (!isDeepStrictEqual(payload.effects.intended.localWrites, expectedLocalWrites)) {
    throw new Error("start payload intended localWrites must match the selected pathway");
  }
  array(payload.effects.intended.targetRepoMutations, "start payload.effects.intended.targetRepoMutations");
  if (payload.effects.intended.targetRepoMutations.length !== 0) {
    throw new Error("start payload intended targetRepoMutations must remain empty");
  }
  array(payload.effects.intended.externalActions, "start payload.effects.intended.externalActions").forEach((item, index) => {
    validateExternalAction(item, `start payload.effects.intended.externalActions[${index}]`);
  });
  const expectedExternalActions = payload.effects.intended.reads
    .filter((item) => /^https?:\/\//i.test(item.reference))
    .map((item) => ({ action: "inspect-reference", reference: item.reference, status: "not-performed" }));
  if (!isDeepStrictEqual(payload.effects.intended.externalActions, expectedExternalActions)) {
    throw new Error("start payload intended externalActions must match declared URL references");
  }
  stringList(payload.effects.approvalRequiredBefore, "start payload.effects.approvalRequiredBefore");
  if (!isDeepStrictEqual(payload.effects.approvalRequiredBefore, payload.designContract.approval.requiresApproval)) {
    throw new Error("start payload approval list must match the embedded design contract");
  }
  return payload;
}
