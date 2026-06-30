// Implementation evidence helpers for Website Improvement workspaces.

export const IMPLEMENTATION_EVIDENCE_KEYS = ["executedWork", "verificationResults", "remainingRisks", "nextActions"];

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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
