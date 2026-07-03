// Tests for the `design-ai route` command runner, focused on the advisory
// related-knowledge enrichment surfaced only under --explain. Runs against the
// real shipped corpus (DESIGN_AI_HOME) so recall is exercised end to end and
// deterministically.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runRoute } from "../commands/route.mjs";
import { captureStdout } from "./learn-test-support.mjs";

const BRIEF = "Spec a Button component API with keyboard accessibility";

test("runRoute --explain human output includes a related knowledge line", async () => {
  const output = await captureStdout(() => runRoute([BRIEF, "--limit", "1", "--explain"]));

  assert.match(output, /id:\s+component-spec/);
  assert.match(output, /related:/);
  // The related line points at a knowledge/ file with a score annotation.
  assert.match(output, /related:\s+knowledge\/[^\s]+\.md .*score/);
});

test("runRoute --explain --json includes relatedKnowledge; default --json omits it", async () => {
  const explainJson = await captureStdout(() => runRoute([BRIEF, "--limit", "1", "--explain", "--json"]));
  const explained = JSON.parse(explainJson);
  const explainedRoute = explained.routes[0];

  assert.equal(explainedRoute.id, "component-spec");
  assert.ok(Array.isArray(explainedRoute.relatedKnowledge));
  assert.ok(explainedRoute.relatedKnowledge.length > 0 && explainedRoute.relatedKnowledge.length <= 3);
  for (const item of explainedRoute.relatedKnowledge) {
    assert.ok(item.id.startsWith("knowledge/"));
    assert.equal(typeof item.score, "number");
    assert.ok(Array.isArray(item.matchedTokens));
  }
  // relatedKnowledge excludes the route's curated knowledge (incl. PRINCIPLES.md).
  const curated = explainedRoute.knowledge.map((entry) => entry.path);
  for (const item of explainedRoute.relatedKnowledge) {
    assert.ok(!curated.includes(item.id));
  }

  const plainJson = await captureStdout(() => runRoute([BRIEF, "--limit", "1", "--json"]));
  const plain = JSON.parse(plainJson);
  const plainRoute = plain.routes[0];

  assert.equal(Object.hasOwn(plainRoute, "relatedKnowledge"), false);

  // Routing decision (id, score, confidence, matched keywords) is unchanged by
  // the enrichment.
  assert.equal(plainRoute.id, explainedRoute.id);
  assert.equal(plainRoute.score, explainedRoute.score);
  assert.equal(plainRoute.confidence, explainedRoute.confidence);
  assert.deepEqual(plainRoute.matchedKeywords, explainedRoute.matchedKeywords);
});
