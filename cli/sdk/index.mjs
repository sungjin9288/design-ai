// design-ai Agent SDK — Phase A (read-only) + Phase B (local writes). See
// docs/AGENT-SDK.md and docs/SDK.md.
//
// A curated, semver-stable adapter over the same cli/lib functions the CLI and
// MCP server call. Each verb validates its inputs, resolves the package root
// the same way the CLI does, and returns a plain JSON-serializable object —
// the same shape the CLI's --json mode emits. No network calls, no runtime
// dependencies. The read-only verbs below perform no file writes: no
// learning-usage sidecar writes, even from prompt/pack's withLearning option.
//
// Phase B adds a single `learn` namespace grouping the three explicit,
// opt-in LOCAL-WRITE verbs (`learn.remember`, `learn.feedback`,
// `learn.captureFromCheck`). This keeps the write boundary explicit: the 8
// Phase A verbs stay read-only and unchanged; `learn` is the only place the
// SDK writes files, and it only ever writes the local learning profile.
//
// Import path: `@design-ai/cli/sdk` (see the "exports" map in package.json).
// `cli/lib/*` stays internal and unstable; this barrel is the only supported
// public surface. Do not import `cli/lib/*.mjs` directly from outside this
// package — only the named function exports plus the `learn` namespace
// below are covered by the semver stability contract described in docs/SDK.md.

export { artifact } from "./artifact-adapter.mjs";
export { check } from "./check-adapter.mjs";
export { inspectHtml } from "./inspect-adapter.mjs";
export { reviewHtml } from "./review-adapter.mjs";
export { reviewHandoff } from "./review-handoff-adapter.mjs";
export { reviewPack } from "./review-pack-adapter.mjs";
export { learn } from "./learn-adapter.mjs";
export { pack } from "./pack-adapter.mjs";
export { prompt } from "./prompt-adapter.mjs";
export { recall } from "./recall-adapter.mjs";
export { route, routes } from "./route-adapter.mjs";
export { search } from "./search-adapter.mjs";
export { start } from "./start-adapter.mjs";
export { version } from "./version-adapter.mjs";
