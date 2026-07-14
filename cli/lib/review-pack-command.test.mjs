import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildReviewPackResult,
  parseReviewPackArgs,
  renderReviewPackMarkdown,
} from "./review-pack.mjs";

test("review-pack lists five packs or reads one exact pack", () => {
  const list = buildReviewPackResult(parseReviewPackArgs(["--json"]));
  assert.equal(list.kind, "design-ai-product-review-pack-list");
  assert.equal(list.packs.length, 5);

  const pack = buildReviewPackResult(parseReviewPackArgs(["korean-fintech"]));
  assert.equal(pack.kind, "design-ai-product-review-pack");
  assert.equal(pack.id, "korean-fintech");
  assert.equal(pack.revision, 1);
  assert.match(renderReviewPackMarkdown(pack), /Revision: 1/);
  assert.match(renderReviewPackMarkdown(pack), /no target repository mutation or external write/);
});

test("review-pack rejects unknown options, ids, and extra arguments", () => {
  assert.throws(() => parseReviewPackArgs(["--unknown"]), /Unknown review-pack option/);
  assert.throws(() => parseReviewPackArgs(["korean-fintech", "extra"]), /accepts one pack id/);
  assert.throws(
    () => buildReviewPackResult(parseReviewPackArgs(["unknown"])),
    /Unknown product review pack/,
  );
});
