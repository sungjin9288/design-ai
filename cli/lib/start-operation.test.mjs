import assert from "node:assert/strict";
import { test } from "node:test";

import { DESIGN_AI_HOME, SYMLINK_PREFIX } from "./paths.mjs";
import { buildStartPayload } from "./start-operation.mjs";

const BRIEF = "Improve the Korean fintech account settings flow";

function build(overrides = {}) {
  return buildStartPayload({
    brief: BRIEF,
    sourceRoot: DESIGN_AI_HOME,
    prefix: SYMLINK_PREFIX,
    routeId: "flow-design",
    context: {},
    ...overrides,
  });
}

test("start payload composes the selected route and existing design contract", () => {
  const payload = build({
    context: {
      localPath: "/tmp/account-app",
      url: "https://example.com/settings",
      screenshots: ["/tmp/settings.png"],
      locale: "ko-KR",
      viewports: ["mobile", "desktop", "mobile"],
    },
  });

  assert.deepEqual(Object.keys(payload), [
    "kind",
    "schemaVersion",
    "brief",
    "context",
    "route",
    "designContract",
    "review",
    "pathway",
    "effects",
  ]);
  assert.equal(payload.kind, "design-ai-start");
  assert.equal(payload.route.id, "flow-design");
  assert.equal(payload.designContract.mode, "design-contract");
  assert.equal(payload.designContract.route.id, payload.route.id);
  assert.deepEqual(payload.context.viewports, ["mobile", "desktop"]);
  assert.ok(payload.effects.performed.reads.length > 0);
  assert.deepEqual(payload.effects.performed.localWrites, []);
  assert.deepEqual(payload.effects.performed.targetRepoMutations, []);
  assert.deepEqual(payload.effects.performed.externalActions, []);
  assert.equal(payload.effects.intended.reads.length, 3);
  assert.equal(payload.review.executed, false);
});

test("website pathway reuses site init only after the site name is known", () => {
  const blocked = build({ routeId: "website-improvement", context: { locale: "ko-KR" } });
  assert.equal(blocked.pathway.status, "needs-input");
  assert.deepEqual(blocked.pathway.missingInputs, ["siteName"]);
  assert.deepEqual(blocked.pathway.commandArgs, ["site", "--intake-template", "--language", "ko", "--json"]);

  const ready = build({
    routeId: "website-improvement",
    context: {
      siteName: "Design AI",
      repoUrl: "https://github.com/example/site",
      url: "https://example.com",
      viewports: ["mobile", "desktop"],
    },
  });
  assert.equal(ready.pathway.status, "ready");
  assert.match(ready.pathway.command, /design-ai site --init --name 'Design AI'/);
  assert.deepEqual(ready.effects.intended.localWrites, [
    { reference: "website-workspace.json", status: "not-performed" },
  ]);
});

test("design review pathway is explicitly ready but not executed", () => {
  const payload = build({ routeId: "design-engineering-review" });
  assert.equal(payload.pathway.id, "design-review");
  assert.equal(payload.pathway.status, "playbook-ready");
  assert.equal(payload.review.status, "playbook-ready-not-run");
  assert.equal(payload.review.executed, false);
  assert.ok(payload.review.sourceFiles.includes("skills/design-engineering-review/SKILL.md"));
});

test("start payload rejects ambiguous paths and malformed context lists", () => {
  assert.throws(
    () => build({ context: { localPath: "relative/repo" } }),
    /localPath must be an absolute path/,
  );
  assert.throws(
    () => build({ context: { screenshots: "screen.png" } }),
    /screenshots must be an array/,
  );
});
