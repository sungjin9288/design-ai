// design-ai Agent SDK — Phase A (read-only). See docs/AGENT-SDK.md and docs/SDK.md.
//
// A curated, semver-stable adapter over the same cli/lib functions the CLI and
// MCP server call. Each verb validates its inputs, resolves the package root
// the same way the CLI does, and returns a plain JSON-serializable object —
// the same shape the CLI's --json mode emits. No network calls, no runtime
// dependencies. Phase A performs no file writes: no learning-usage sidecar
// writes, even from prompt/pack's withLearning option.
//
// Import path: `@design-ai/cli/sdk` (see the "exports" map in package.json).
// `cli/lib/*` stays internal and unstable; this barrel is the only supported
// public surface. Do not import `cli/lib/*.mjs` directly from outside this
// package — only the 8 named exports below are covered by the semver
// stability contract described in docs/SDK.md.

export { check } from "./check-adapter.mjs";
export { pack } from "./pack-adapter.mjs";
export { prompt } from "./prompt-adapter.mjs";
export { recall } from "./recall-adapter.mjs";
export { route, routes } from "./route-adapter.mjs";
export { search } from "./search-adapter.mjs";
export { version } from "./version-adapter.mjs";
