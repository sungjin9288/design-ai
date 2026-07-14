import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { inspectHtml } from "./design-quality-inspector.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import {
  listProductReviewPacks,
  loadProductReviewPack,
  validateProductReviewPack,
} from "./product-review-pack.mjs";

const PACK_IDS = [
  "korean-fintech",
  "korean-commerce",
  "korean-saas",
  "korean-content",
  "korean-game",
];
const GENERATED_AT = "2026-07-14T00:00:00.000Z";

test("product review pack registry exposes five validated Korean domains", () => {
  const summaries = listProductReviewPacks();
  assert.deepEqual(summaries.map((pack) => pack.id), PACK_IDS);
  assert.deepEqual(summaries.map((pack) => pack.domain), ["fintech", "commerce", "saas", "content", "game"]);
  assert.equal(summaries.every((pack) => pack.locale === "ko-KR" && pack.criteriaCount >= 4), true);

  for (const id of PACK_IDS) {
    const pack = loadProductReviewPack(id);
    assert.strictEqual(validateProductReviewPack(pack), pack);
    assert.deepEqual(pack.viewports.map((viewport) => viewport.name), ["mobile", "desktop"]);
    assert.equal(pack.revision, 1);
    assert.equal(pack.criteria.every((criterion) => criterion.falsePositiveNotes.length > 0), true);
    assert.equal(pack.benchmark.falsePositiveNotes.length > 0, true);
  }
});

test("each product review benchmark produces its declared evidence chain", () => {
  for (const id of PACK_IDS) {
    const pack = loadProductReviewPack(id);
    const source = readFileSync(path.join(PACKAGE_ROOT, pack.benchmark.source), "utf8");
    const report = inspectHtml(source, {
      sourceRef: pack.benchmark.source,
      brief: `Review ${pack.name}`,
      locale: pack.locale,
      viewports: pack.viewports.map((viewport) => viewport.name),
      generatedAt: GENERATED_AT,
      reviewPack: pack.id,
    });
    const productFindings = report.findings.filter((finding) => finding.id.startsWith(`product-pack:${id}:`));

    assert.deepEqual(productFindings.map((finding) => finding.id), pack.benchmark.expectedFindingIds);
    for (const finding of productFindings) {
      const criterion = pack.criteria.find((item) => finding.id.endsWith(`:${item.id}`));
      assert.equal(finding.status, criterion.mode === "static-html" ? "confirmed" : "unverified");
    }
    assert.equal(report.sources.some((sourceItem) => (
      sourceItem.reference === `product-packs/${id}.json#revision-${pack.revision}`
    )), true);
    assert.equal(report.boundary.targetRepoMutation, false);
    assert.equal(report.boundary.externalWrites, false);
  }
});

test("correct native semantics avoid static product-pack findings", () => {
  const source = `<!doctype html><html lang="ko-KR"><head><meta name="viewport" content="width=device-width"></head><body>
    <label for="phone">휴대폰 번호</label><input id="phone" type="tel" autocomplete="tel">
    <label for="password">비밀번호</label><input id="password" type="password" autocomplete="current-password">
    <label><input type="checkbox"> 마케팅 수신 동의</label><button>저장</button>
  </body></html>`;

  for (const id of PACK_IDS) {
    const report = inspectHtml(source, {
      sourceRef: "correct.html",
      brief: "Check false positives",
      locale: "ko-KR",
      generatedAt: GENERATED_AT,
      reviewPack: id,
    });
    assert.equal(report.findings.some((finding) => (
      finding.id.startsWith(`product-pack:${id}:`) && finding.status === "confirmed"
    )), false);
  }
});

test("static product rules honor their declared false-positive boundaries", () => {
  const source = `<!doctype html><html lang="ko-KR"><head><meta name="viewport" content="width=device-width"></head><body>
    <label for="otp">인증번호 6자리</label><input id="otp" inputmode="numeric" autocomplete="one-time-code">
    <label for="transaction-pin">거래 PIN</label><input id="transaction-pin" type="password" autocomplete="one-time-code">
    <span id="marketing-label">마케팅 수신 동의</span><input type="checkbox" checked disabled aria-labelledby="marketing-label">
    <button>확인</button>
  </body></html>`;
  const report = inspectHtml(source, {
    sourceRef: "false-positive-boundaries.html",
    brief: "Check explicit exclusions",
    locale: "ko-KR",
    generatedAt: GENERATED_AT,
    reviewPack: "korean-fintech",
  });

  assert.equal(report.findings.some((finding) => (
    finding.id === "product-pack:korean-fintech:korean-phone-input-semantics"
    || finding.id === "product-pack:korean-fintech:korean-auth-autocomplete"
    || finding.id === "product-pack:korean-fintech:korean-marketing-consent-default"
  )), false);
});

test("marketing consent detection resolves aria-labelledby text", () => {
  const source = `<!doctype html><html lang="ko-KR"><head><meta name="viewport" content="width=device-width"></head><body>
    <span id="marketing-label">마케팅 수신 동의</span><input type="checkbox" checked aria-labelledby="marketing-label">
  </body></html>`;
  const report = inspectHtml(source, {
    sourceRef: "aria-labelledby-consent.html",
    brief: "Check referenced consent label",
    locale: "ko-KR",
    generatedAt: GENERATED_AT,
    reviewPack: "korean-fintech",
  });

  assert.equal(report.findings.some((finding) => (
    finding.id === "product-pack:korean-fintech:korean-marketing-consent-default"
    && finding.status === "confirmed"
  )), true);
});

test("product review pack validation rejects unsafe or unknown definitions", () => {
  const pack = loadProductReviewPack("korean-fintech");
  assert.throws(() => loadProductReviewPack("unknown"), /Unknown product review pack/);
  assert.throws(
    () => validateProductReviewPack({ ...pack, boundary: { ...pack.boundary, targetRepoMutation: true } }),
    /must not mutate/,
  );
  assert.throws(
    () => validateProductReviewPack({ ...pack, revision: 0 }),
    /revision must be a positive integer/,
  );
  assert.throws(
    () => validateProductReviewPack({
      ...pack,
      criteria: pack.criteria.map((criterion, index) => (
        index === 0 ? { ...criterion, mode: "static-html", id: "unknown-static-rule" } : criterion
      )),
    }),
    /has no deterministic static rule/,
  );
});
