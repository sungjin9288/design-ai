import { test } from "node:test";
import assert from "node:assert/strict";

import * as catalog from "./route-catalog.mjs";
import * as route from "./route.mjs";

test("route catalog owns the ordered, unique route identities", () => {
  const ids = catalog.routeIds();
  assert.equal(ids.length, 24);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], "design-review");
  assert.equal(ids.at(-1), "marketing-page");
});

test("route catalog owns suggestions and unknown-id validation", () => {
  assert.equal(catalog.suggestRouteId("component-spce"), "component-spec");
  assert.match(catalog.unknownRouteIdMessage("component-spce"), /Did you mean `component-spec`/);
  assert.doesNotThrow(() => catalog.assertKnownRouteId("component-spec"));
  assert.throws(
    () => catalog.assertKnownRouteId("component-spce"),
    /Unknown route id: component-spce/,
  );
});

test("route module preserves the catalog compatibility exports", () => {
  for (const name of [
    "ROUTES",
    "routeIds",
    "suggestRouteId",
    "unknownRouteIdMessage",
    "assertKnownRouteId",
  ]) {
    assert.strictEqual(route[name], catalog[name]);
  }
});
