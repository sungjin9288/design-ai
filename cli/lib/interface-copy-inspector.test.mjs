import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import { inspectHtml } from "./design-quality-inspector.mjs";
import { koreanRegister } from "./interface-copy-inspector.mjs";
import { compareReviewReports } from "./review-comparison.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";

const OPTIONS = { sourceRef: "screen.html", brief: "Review the screen copy", generatedAt: "2026-09-28T00:00:00.000Z" };
const page = (lang, body) => `<!doctype html><html lang="${lang}"><head><meta name="viewport" content="width=device-width"></head><body>${body}</body></html>`;
const copyLens = (report) => report.lenses.find((lens) => lens.id === "interface-copy");
const copyFindings = (report) => report.findings.filter((finding) => finding.lens === "interface-copy");

test("new reports are schemaVersion 2 with the interface-copy lens last", () => {
  const report = inspectHtml(page("en", "<button>Save draft</button>"), OPTIONS);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.lenses.length, 9);
  assert.equal(report.lenses.at(-1).id, "interface-copy");
  assert.equal(copyLens(report).status, "unverified", "clean static copy never becomes a pass");
  assert.equal(copyFindings(report).length, 0);
});

test("generic control labels and dropped visible labels are confirmed findings", () => {
  const report = inspectHtml(page("en", `<button>OK</button><input type="submit" value="Submit">
    <button aria-label="Close dialog">Save draft</button><a href="/next">Next</a><a href="/doc">Click here</a>`), OPTIONS);
  const ids = copyFindings(report).map((finding) => finding.id.replace(/-\d+-\d+$/, ""));
  assert.deepEqual(ids, ["interface-copy-generic-label", "interface-copy-generic-label", "interface-copy-label-not-in-name",
    "interface-copy-generic-label"]);
  assert.equal(copyLens(report).status, "fail", "a p1 label-in-name defect fails the lens");
  assert.equal(report.summary.status, "fail");
  assert.ok(!copyFindings(report).some((finding) => finding.before.includes('"Next"')), "pagination links are not generic");
});

test("only p2 copy findings make the lens a warning", () => {
  const report = inspectHtml(page("en", "<button>Yes</button>"), OPTIONS);
  assert.equal(copyLens(report).status, "warning");
  assert.equal(report.summary.status, "warning");
});

test("Korean copy that mixes registers is confirmed, but UI nouns are not sentences", () => {
  const mixed = inspectHtml(page("ko", "<h1>받은 편지함</h1><p>저장했어요.</p><p>변경 사항이 반영되었습니다.</p><button>저장</button>"), OPTIONS);
  const register = copyFindings(mixed).find((finding) => finding.id.startsWith("interface-copy-mixed-korean-register"));
  assert.ok(register, "haeyo and hapsyo sentences on one screen are flagged");
  assert.match(register.before, /해요체, 합쇼체/);
  const nouns = inspectHtml(page("ko", "<h1>승인 작업함</h1><p>검토할 변경을 한곳에서 확인합니다.</p><button>첫 승인 요청 열기</button>"), OPTIONS);
  assert.equal(copyFindings(nouns).length, 0, "작업함 is a noun, not 음슴체");
  const english = inspectHtml(page("en", "<p>저장했어요.</p><p>반영되었습니다.</p>"), OPTIONS);
  assert.equal(copyFindings(english).length, 0, "register checks apply only to Korean documents");
});

test("the Korean register classifier matches the fixture validator", () => {
  const cases = {
    "계속 유지": null, "이해": null, "바다": null, "해지 불필요": null, "Error 502": null, "승인 작업함": null,
    "받은 편지함": null, "다음 모임": null,
    "저장했어요.": "haeyo", "괜찮죠?": "haeyo", "저장했어요 😊": "haeyo", "들어가요(영업일 기준)": "haeyo",
    "입금됩니다.": "hapsyo", "해지하시겠습니까?": "hapsyo", "입력하시오": "hapsyo", "합시다.": "hapsyo",
    "업로드 중입니다…": "hapsyo", "잘못된 입력입니다 (E12)": "hapsyo",
    "저장했다.": "banmal", "사진을 올렸다": "banmal", "사진을 올렸어.": "banmal", "완료됐어!": "banmal",
    "사용할 수 있음": "eumseum", "저장 완료됨": "eumseum",
  };
  const selftest = readFileSync(path.join(PACKAGE_ROOT, "tools", "audit", "interface_copy_selftest.py"), "utf8");
  for (const [sentence, expected] of Object.entries(cases)) {
    assert.equal(koreanRegister(sentence), expected, sentence);
    assert.ok(selftest.includes(JSON.stringify(sentence)), `the Python self-test also covers ${sentence}`);
  }
});

test("comparisons refuse reports from different schema versions instead of crashing", () => {
  const fixturePath = path.join(PACKAGE_ROOT, "examples", "benchmarks", "korean-fintech-settings", "quality-report.json");
  const v1 = readFileSync(fixturePath, "utf8");
  const parsed = JSON.parse(v1);
  const v2 = JSON.stringify({ ...parsed, schemaVersion: 2, lenses: [...parsed.lenses, { id: "interface-copy",
    status: "unverified", summary: "Copy was not reviewed.", evidence: [{ kind: "code", reference: "source.html", observation: "Static copy checks ran." }] }] });
  assert.throws(() => compareReviewReports(v1, v2), /must share a schemaVersion \(baseline 1, candidate 2\)/);
  assert.equal(compareReviewReports(v2, v2).lensTransitions.length, 9);
  assert.equal(compareReviewReports(v1, v1).lensTransitions.length, 8);
});

test("label-in-name accepts conformant names and resolves aria-labelledby", () => {
  const conformant = inspectHtml(page("ko", `<button aria-label="장바구니에 담기">담기</button>
    <button aria-label="Close">×</button><a href="/p" aria-label="Read more about pricing">Read more…</a>
    <button aria-label="Log-in">Log in</button><button aria-label="Save changes">Save&nbsp;changes</button>`), OPTIONS);
  assert.deepEqual(copyFindings(conformant), [], "containment after normalizing, and symbol labels, conform");
  const labelled = inspectHtml(page("en", `<span id="draft">Save draft</span>
    <button aria-labelledby="draft" aria-label="OK">OK</button><div role="button">Yes</div>`), OPTIONS);
  const ids = copyFindings(labelled).map((finding) => finding.id.replace(/-\d+-\d+$/, "")).sort();
  assert.deepEqual(ids, ["interface-copy-generic-label", "interface-copy-generic-label", "interface-copy-label-not-in-name"]);
  assert.match(copyFindings(labelled).find((f) => f.id.startsWith("interface-copy-label-not-in-name")).before, /"Save draft"/,
    "aria-labelledby wins over aria-label");
});

test("register sampling ignores status cells, headlines, quotes, and fine print", () => {
  const report = inspectHtml(page("ko", `<h1>우리는 더 빠르게 일한다</h1><p>주문을 확인해 주세요.</p>
    <table><tr><td>재고 있음</td><td>배송 완료됨</td></tr></table><blockquote><p>정말 편했다.</p></blockquote>
    <footer><p>모든 권리를 보유합니다.</p></footer>`), OPTIONS);
  assert.deepEqual(copyFindings(report), []);
});

test("schema versions must be the numbers 1 or 2", () => {
  const report = inspectHtml(page("en", "<button>Save draft</button>"), OPTIONS);
  for (const version of ["2", ["2"], "toString", 3]) {
    assert.throws(() => validateDesignQualityReport({ ...report, schemaVersion: version }), /schemaVersion must be 1 or 2/);
  }
});
