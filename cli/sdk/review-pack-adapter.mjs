import {
  listProductReviewPacks,
  loadProductReviewPack,
} from "../lib/product-review-pack.mjs";
import { optionalString, requireOptions } from "./validate.mjs";

/**
 * Read one Korean product review pack or list the available packs.
 *
 * @param {string} id
 * @param {object} opts
 * @returns {object}
 */
export function reviewPack(id = "", opts = {}) {
  requireOptions(opts, "reviewPack");
  const packId = optionalString(id, "id");
  if (packId) return loadProductReviewPack(packId);
  return {
    kind: "design-ai-product-review-pack-list",
    schemaVersion: 1,
    packs: listProductReviewPacks(),
  };
}
