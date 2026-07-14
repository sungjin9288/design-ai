import assert from "node:assert/strict";
import { test } from "node:test";

import { reviewPack } from "./review-pack-adapter.mjs";

test("SDK reviewPack lists and reads immutable product review contracts", () => {
  const list = reviewPack();
  assert.equal(list.kind, "design-ai-product-review-pack-list");
  assert.equal(list.packs.length, 5);

  const pack = reviewPack("korean-game");
  assert.equal(pack.kind, "design-ai-product-review-pack");
  assert.equal(pack.id, "korean-game");
  assert.equal(pack.revision, 1);
  assert.equal(pack.boundary.targetRepoMutation, false);
  assert.equal(pack.criteria.some((criterion) => criterion.id === "korean-probability-disclosure"), true);
});

test("SDK reviewPack validates ids and options", () => {
  assert.throws(() => reviewPack("unknown"), /Unknown product review pack/);
  assert.throws(() => reviewPack("korean-fintech", "invalid"), /reviewPack options must be a plain object/);
});
