// Implementation evidence helpers for Website Improvement workspaces.

import { normalizeStringArray } from "./site-strings.mjs";

export const IMPLEMENTATION_EVIDENCE_KEYS = ["executedWork", "verificationResults", "remainingRisks", "nextActions"];

export const DEFAULT_IMPLEMENTATION_RISKS = [
  "MCP readiness gaps may limit verification depth.",
  "Copy or brand changes may require stakeholder review.",
  "Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
];

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeImplementationEvidence(value) {
  const source = normalizeObject(value);
  return {
    executedWork: normalizeStringArray(source.executedWork),
    verificationResults: normalizeStringArray(source.verificationResults),
    remainingRisks: normalizeStringArray(source.remainingRisks, DEFAULT_IMPLEMENTATION_RISKS),
    nextActions: normalizeStringArray(source.nextActions),
  };
}

export function countImplementationEvidence(value = {}) {
  const source = normalizeObject(value);
  return Object.fromEntries(IMPLEMENTATION_EVIDENCE_KEYS.map((key) => {
    const items = source[key];
    if (Array.isArray(items)) return [key, items.length];
    if (Number.isInteger(items) && items >= 0) return [key, items];
    return [key, 0];
  }));
}
