import { test } from "node:test";
import assert from "node:assert/strict";

import { PACKAGE_ROOT } from "./paths.mjs";
import {
  buildRouteCatalogPayload,
  buildRoutePayload,
} from "./route-operation.mjs";

test("route operation builds the shared CLI, SDK, and MCP payload", () => {
  const payload = buildRoutePayload({
    brief: "  Spec a Button component API  ",
    sourceRoot: PACKAGE_ROOT,
    limit: 1,
    explain: true,
  });

  assert.deepEqual(Object.keys(payload), ["brief", "version", "routes"]);
  assert.equal(payload.brief, "Spec a Button component API");
  assert.equal(payload.routes.length, 1);
  assert.equal(payload.routes[0].id, "component-spec");
  assert.ok(payload.routes[0].explanation);
});

test("route operation catalog preserves the canonical route order", () => {
  const payload = buildRouteCatalogPayload({ sourceRoot: PACKAGE_ROOT });

  assert.deepEqual(Object.keys(payload), ["version", "routes"]);
  assert.equal(payload.routes.length, 23);
  assert.equal(payload.routes[0].id, "design-review");
  assert.equal(payload.routes.at(-1).id, "marketing-page");
});

test("route operation rejects an empty brief", () => {
  assert.throws(
    () => buildRoutePayload({ brief: "   ", sourceRoot: PACKAGE_ROOT }),
    /Brief is empty/,
  );
});
