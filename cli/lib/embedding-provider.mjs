// Local embedding provider protocol for Phase B (docs/AI-LEARNING-PHASE2.md).
//
// Protocol: design-ai spawns the user-configured provider command as a local child
// process (spawnSync, no shell — args are passed as an argv array, never interpolated
// into a shell string). design-ai writes JSON Lines to the provider's stdin: one line
// per input document, `{"id": string, "text": string}`, in sorted-id order. design-ai
// reads JSON Lines from the provider's stdout: one line per input, `{"id": string,
// "vector": number[]}`, in ANY order — outputs are matched back to inputs by id, not
// position. The provider is expected to emit exactly one output line per input id.
//
// Failure handling: a non-zero exit code, unparseable stdout, a missing id, or vectors
// with an empty or inconsistent dimension across the batch all collapse to a single
// descriptive failure — `embedDocuments` never throws to its caller; it always returns
// `{ ok: false, error }` so callers (index build, ranked search) can fall back to the
// deterministic lexical path. No network access is made by this module; the provider
// is a local executable chosen by the user, invoked exactly as configured.

import { spawnSync } from "node:child_process";

function toJsonLines(documents) {
  return documents
    .map((doc) => `${JSON.stringify({ id: doc.id, text: doc.text })}\n`)
    .join("");
}

function parseOutputLines(stdout) {
  const vectors = new Map();
  const lines = stdout.split("\n").filter((line) => line.trim() !== "");
  for (const line of lines) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      return { error: `provider emitted unparseable output line: ${error.message}` };
    }
    if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string") {
      return { error: "provider output line is missing a string id" };
    }
    if (!Array.isArray(parsed.vector) || !parsed.vector.every((n) => typeof n === "number" && Number.isFinite(n))) {
      return { error: `provider output for id "${parsed.id}" is missing a numeric vector` };
    }
    vectors.set(parsed.id, parsed.vector);
  }
  return { vectors };
}

// Default runner: spawns the provider as a local process only (no shell). Injectable
// for tests, matching the mcp-server.mjs pattern of a default-parameter runner swap.
function defaultSpawnRunner({ command, args, input }) {
  const result = spawnSync(command, args, {
    input,
    encoding: "utf8",
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error || null,
  };
}

// documents: [{ id, text }]. provider: { command, args }.
// Returns { ok: true, vectorsById: Map<id, number[]>, dimensions } or { ok: false, error }.
export function embedDocuments({ provider, documents, spawnRunner = defaultSpawnRunner }) {
  if (!provider || typeof provider.command !== "string" || provider.command.trim() === "") {
    return { ok: false, error: "no embedding provider command configured" };
  }
  const args = Array.isArray(provider.args) ? provider.args : [];
  const sortedDocs = [...documents].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  if (sortedDocs.length === 0) {
    return { ok: true, vectorsById: new Map(), dimensions: 0 };
  }

  let result;
  try {
    result = spawnRunner({ command: provider.command, args, input: toJsonLines(sortedDocs) });
  } catch (error) {
    return { ok: false, error: `failed to spawn embedding provider "${provider.command}": ${error.message}` };
  }

  if (result.error) {
    return { ok: false, error: `failed to spawn embedding provider "${provider.command}": ${result.error.message}` };
  }
  if (result.status !== 0) {
    const detail = (result.stderr || "").trim();
    return {
      ok: false,
      error: `embedding provider "${provider.command}" exited with code ${result.status}${detail ? `: ${detail}` : ""}`,
    };
  }

  const parsed = parseOutputLines(result.stdout);
  if (parsed.error) return { ok: false, error: parsed.error };

  const missing = sortedDocs.filter((doc) => !parsed.vectors.has(doc.id)).map((doc) => doc.id);
  if (missing.length > 0) {
    return { ok: false, error: `embedding provider did not return vectors for id(s): ${missing.slice(0, 5).join(", ")}` };
  }

  let dimensions = 0;
  for (const doc of sortedDocs) {
    const vector = parsed.vectors.get(doc.id);
    if (vector.length === 0) {
      return { ok: false, error: `embedding provider returned an empty vector for id "${doc.id}"` };
    }
    if (dimensions === 0) {
      dimensions = vector.length;
    } else if (vector.length !== dimensions) {
      return {
        ok: false,
        error: `embedding provider returned inconsistent vector dimensions (expected ${dimensions}, got ${vector.length} for id "${doc.id}")`,
      };
    }
  }

  const vectorsById = new Map(sortedDocs.map((doc) => [doc.id, parsed.vectors.get(doc.id)]));
  return { ok: true, vectorsById, dimensions };
}
