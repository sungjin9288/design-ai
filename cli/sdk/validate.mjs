// Input validation helpers shared by the SDK adapters (cli/sdk/*.mjs).
// Fail fast with a clear Error on bad input, per docs/AGENT-SDK.md Phase A.

export function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

export function optionalString(value, label, fallback = "") {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
  return value;
}

export function optionalBoolean(value, label, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

// `zeroMeansUnset: true` is for options where the underlying cli/lib function
// treats 0 itself as "not set, use the library default" (e.g. learningLimit,
// recallLimit in prompt.mjs/pack.mjs use `learningLimit || 12`). In that case
// an explicit 0 is accepted and passed through unchecked against min/max,
// exactly like omitting the option.
export function optionalInteger(value, label, { fallback = 0, min = -Infinity, max = Infinity, zeroMeansUnset = false } = {}) {
  if (value === undefined || value === null) return fallback;
  if (zeroMeansUnset && value === 0) return 0;
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(`${label} must be an integer from ${min} to ${max}`);
  }
  return num;
}

export function requireOptions(opts, label) {
  if (opts === undefined || opts === null) return {};
  if (typeof opts !== "object" || Array.isArray(opts)) {
    throw new Error(`${label} options must be a plain object`);
  }
  return opts;
}
