import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateSync } from "node:zlib";
import { decodePng, encodePng } from "./png-rgba.mjs";
import { deltaE, parseColor } from "./visual-evaluator-measures.mjs";
import {
  VISUAL_EVALUATION_SCHEMA,
  VISUAL_EVALUATORS,
  validateVisualEvaluation,
} from "./visual-evaluation-contract.mjs";
import { evaluateVisualRequest, validateVisualRequest } from "./visual-evaluators.mjs";

const SOURCE = "a".repeat(64);
const MOBILE = { name: "mobile", width: 4, height: 3 };

function solid(width, height, rgba) {
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) pixels.set(rgba, i * 4);
  return pixels;
}

function withBlock(pixels, width, [x, y], rgba) {
  const copy = Uint8Array.from(pixels);
  copy.set(rgba, (y * width + x) * 4);
  return copy;
}

function evidence(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-visual-"));
  for (const [name, contents] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), typeof contents === "string" ? contents : contents);
  }
  return dir;
}

function request(evaluations) {
  return {
    kind: "design-ai-visual-evaluation-request",
    schemaVersion: 1,
    source: { kind: "browser-verification", sha256: SOURCE },
    tool: { name: "playwright-chromium", version: "1.58.0" },
    evaluations,
  };
}

const regression = (inputs, threshold = { maxChangedRatio: 0, channelTolerance: 0 }) => ({
  id: "home-mobile", evaluator: "screenshot-regression", viewport: MOBILE, threshold, inputs,
});

function pngChunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, "latin1");
  body.copy(out, 8);
  out.writeUInt32BE(crc(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

function paethPredictor(left, up, upLeft) {
  const p = left + up - upLeft;
  if (Math.abs(p - left) <= Math.abs(p - up) && Math.abs(p - left) <= Math.abs(p - upLeft)) return left;
  return Math.abs(p - up) <= Math.abs(p - upLeft) ? up : upLeft;
}

// Encodes 8-bit RGB with row filters 0-4 in turn, so the decoder's unfilter paths are all exercised.
function rgbPngWithFilters(width, height, rgb) {
  const stride = width * 3;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const type = y % 5;
    const row = Buffer.alloc(stride + 1);
    row[0] = type;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 3 ? rgb[y * stride + x - 3] : 0;
      const up = y ? rgb[(y - 1) * stride + x] : 0;
      const upLeft = x >= 3 && y ? rgb[(y - 1) * stride + x - 3] : 0;
      const predictor = [0, left, up, (left + up) >> 1, paethPredictor(left, up, upLeft)][type];
      row[x + 1] = (rgb[y * stride + x] - predictor) & 0xff;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const signature = encodePng(1, 1, new Uint8Array(4)).subarray(0, 8);
  return Buffer.concat([signature, pngChunk("IHDR", ihdr), pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0))]);
}

function crc(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return (value ^ 0xffffffff) >>> 0;
}

test("PNG codec round-trips RGBA and decodes RGB rows under every filter type", () => {
  const rgba = Uint8Array.from({ length: 5 * 4 * 4 }, (_, i) => (i * 37) % 256);
  assert.deepEqual(decodePng(encodePng(5, 4, rgba)).rgba, rgba);
  const rgb = Uint8Array.from({ length: 6 * 5 * 3 }, (_, i) => (i * 53 + 7) % 256);
  const decoded = decodePng(rgbPngWithFilters(6, 5, rgb));
  assert.equal(decoded.width, 6);
  for (let i = 0; i < 30; i += 1) {
    assert.deepEqual([...decoded.rgba.subarray(i * 4, i * 4 + 4)], [...rgb.subarray(i * 3, i * 3 + 3), 255]);
  }
});

test("PNG decoder rejects corrupt, truncated, and unsupported images", () => {
  const png = encodePng(2, 2, solid(2, 2, [1, 2, 3, 255]));
  const badCrc = Buffer.from(png);
  badCrc[30] ^= 0xff;
  assert.throws(() => decodePng(badCrc), /invalid CRC/);
  assert.throws(() => decodePng(png.subarray(0, 40)), /truncated|no IEND/);
  assert.throws(() => decodePng(Buffer.from("not a png")), /not a PNG/);
  const sixteenBit = Buffer.from(png);
  sixteenBit[24] = 16;
  sixteenBit.writeUInt32BE(crc(sixteenBit.subarray(12, 29)), 29);
  assert.throws(() => decodePng(sixteenBit), /8-bit RGB or RGBA/);
});

test("screenshot regression passes identical captures and fails a changed region with bounds", () => {
  const base = solid(4, 3, [255, 255, 255, 255]);
  const dir = evidence({
    "baseline.png": encodePng(4, 3, base),
    "same.png": encodePng(4, 3, base),
    "changed.png": encodePng(4, 3, withBlock(withBlock(base, 4, [1, 1], [0, 0, 0, 255]), 4, [2, 2], [0, 0, 0, 255])),
    "faint.png": encodePng(4, 3, withBlock(base, 4, [0, 0], [250, 250, 250, 255])),
  });
  try {
    const report = evaluateVisualRequest(request([
      regression({ baseline: "baseline.png", candidate: "same.png" }),
      { ...regression({ baseline: "baseline.png", candidate: "changed.png" }), id: "changed" },
      { ...regression({ baseline: "baseline.png", candidate: "faint.png" }, { maxChangedRatio: 0, channelTolerance: 8 }), id: "faint" },
    ]), { evidenceDir: dir });
    const [same, changed, faint] = report.evaluations;
    assert.equal(same.status, "pass");
    assert.equal(changed.status, "fail");
    assert.equal(changed.measurement.changedPixels, 2);
    assert.deepEqual(changed.measurement.changedBounds, { x: 1, y: 1, width: 2, height: 2 });
    assert.equal(faint.status, "pass", "a delta within channelTolerance is not a change");
    assert.deepEqual(report.summary, { pass: 2, fail: 1, unverified: 0, status: "fail" });
    assert.equal(same.artifacts.length, 2);
    assert.match(same.artifacts[0].sha256, /^[a-f0-9]{64}$/);
    assert.ok(same.uncertainty.length >= 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("dimension changes fail a regression but leave a visual diff unverified", () => {
  const dir = evidence({
    "a.png": encodePng(4, 3, solid(4, 3, [9, 9, 9, 255])),
    "b.png": encodePng(4, 4, solid(4, 4, [9, 9, 9, 255])),
    "narrow.png": encodePng(3, 3, solid(3, 3, [9, 9, 9, 255])),
  });
  try {
    const report = evaluateVisualRequest(request([
      regression({ baseline: "a.png", candidate: "b.png" }),
      { id: "mock", evaluator: "visual-diff", viewport: MOBILE, threshold: { maxChangedRatio: 0.1, channelTolerance: 0 },
        inputs: { reference: "a.png", candidate: "b.png" } },
      { ...regression({ baseline: "a.png", candidate: "narrow.png" }), id: "narrow" },
    ]), { evidenceDir: dir });
    const [grown, mock, narrow] = report.evaluations;
    assert.equal(grown.status, "fail");
    assert.equal(grown.measurement.dimensionsMatch, false);
    assert.equal(mock.status, "unverified");
    assert.match(mock.reasons[0], /dimensions differ/);
    assert.equal(narrow.status, "unverified");
    assert.match(narrow.reasons[0], /not a multiple of the 4px viewport/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("missing, escaping, symlinked, and corrupt artifacts stay unverified without a measurement", () => {
  const outside = evidence({ "real.png": encodePng(4, 3, solid(4, 3, [1, 1, 1, 255])) });
  const dir = evidence({ "a.png": encodePng(4, 3, solid(4, 3, [1, 1, 1, 255])), "corrupt.png": "not a png" });
  symlinkSync(path.join(outside, "real.png"), path.join(dir, "link.png"));
  symlinkSync(path.join(dir, "a.png"), path.join(dir, "inner-link.png"));
  try {
    const before = readdirSync(dir).sort();
    const report = evaluateVisualRequest(request([
      regression({ baseline: "a.png", candidate: "missing.png" }),
      { ...regression({ baseline: "a.png", candidate: "../real.png" }), id: "escape" },
      { ...regression({ baseline: "a.png", candidate: "link.png" }), id: "link" },
      { ...regression({ baseline: "a.png", candidate: "corrupt.png" }), id: "corrupt" },
      { ...regression({ baseline: "a.png", candidate: "inner-link.png" }), id: "inner-link" },
    ]), { evidenceDir: dir });
    for (const evaluation of report.evaluations) {
      assert.equal(evaluation.status, "unverified", evaluation.id);
      assert.equal(evaluation.measurement, null);
      assert.ok(evaluation.reasons.length);
    }
    assert.deepEqual(report.evaluations[0].artifacts.map((a) => a.role), ["baseline"]);
    assert.deepEqual(report.summary, { pass: 0, fail: 0, unverified: 5, status: "unverified" });
    assert.match(report.evaluations[4].reasons[0], /regular file/, "a symlink is refused even inside the directory");
    assert.deepEqual(readdirSync(dir).sort(), before, "evaluators never write into the evidence directory");
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("responsive overflow reads adapter layout at the declared viewport", () => {
  const layout = (scrollWidth, elements, width = 390) => JSON.stringify({
    viewport: { width, height: 844 }, document: { scrollWidth, clientWidth: 390 }, elements,
  });
  const dir = evidence({
    "ok.json": layout(390, [{ selector: ".hero", left: 0, right: 390 }]),
    "wide.json": layout(412, [{ selector: ".table", left: 0, right: 412 }, { selector: ".nav", left: -1, right: 389 },
      { selector: ".drawer", left: -30, right: 200 }]),
    "desktop.json": layout(1440, [], 1440),
  });
  const viewport = { name: "mobile", width: 390, height: 844 };
  const item = (id, file) => ({ id, evaluator: "responsive-overflow", viewport, threshold: { tolerancePx: 1 }, inputs: { layout: file } });
  try {
    const [ok, wide, desktop] = evaluateVisualRequest(request([item("ok", "ok.json"), item("wide", "wide.json"),
      item("desktop", "desktop.json")]), { evidenceDir: dir }).evaluations;
    assert.equal(ok.status, "pass");
    assert.equal(wide.status, "fail");
    assert.equal(wide.measurement.documentOverflowPx, 22);
    assert.deepEqual(wide.measurement.offenders.map((o) => o.selector), [".table", ".drawer"],
      "left and right overflow count; within tolerance does not");
    assert.equal(desktop.status, "unverified");
    assert.match(desktop.reasons[0], /measured at 1440x844/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("brand-token drift names the nearest token for off-palette colors", () => {
  const tokens = JSON.stringify({ colors: { "--brand-primary": "#1a56db", "--surface": "#ffffff" } });
  const styles = (declarations) => JSON.stringify({ declarations });
  const dir = evidence({
    "tokens.json": tokens,
    "on.json": styles([{ selector: "button", property: "background-color", value: "rgb(26, 86, 219)" },
      { selector: "body", property: "color", value: "#fff" }, { selector: "a", property: "margin", value: "4px" }]),
    "off.json": styles([{ selector: ".cta", property: "background-color", value: "#2563eb" },
      { selector: "p", property: "color", value: "oklch(0.7 0.1 200)" }]),
    "none.json": styles([{ selector: "div", property: "color", value: "transparent" }]),
    "murky.json": styles([{ selector: "b", property: "color", value: "#1a56db" },
      { selector: "i", property: "color", value: "rgba(37, 99, 235, 0.05)" }, { selector: "u", property: "color", value: "hsl(0 100% 50%)" }]),
  });
  const item = (id, file) => ({ id, evaluator: "brand-token-drift", viewport: MOBILE,
    threshold: { maxDeltaE: 2.3, maxOffPalette: 0, maxUnevaluated: 1 }, inputs: { styles: file, tokens: "tokens.json" } });
  try {
    const [on, off, none, murky] = evaluateVisualRequest(request([item("on", "on.json"), item("off", "off.json"),
      item("none", "none.json"), item("murky", "murky.json")]), { evidenceDir: dir }).evaluations;
    assert.equal(on.status, "pass");
    assert.equal(on.measurement.colorsChecked, 2);
    assert.equal(off.status, "fail");
    assert.equal(off.measurement.offPalette[0].nearestToken, "--brand-primary");
    assert.ok(off.uncertainty.some((line) => line.includes("1 color value(s) were translucent or unparsable")));
    assert.equal(none.status, "unverified");
    assert.equal(murky.status, "unverified", "a translucent and an unparsable value exceed maxUnevaluated 1");
    assert.match(murky.reasons[0], /2 color value\(s\) could not be evaluated/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("color parsing and distance handle hex, functional, and alpha forms", () => {
  assert.deepEqual(parseColor("#1A56DB"), [26, 86, 219, 1]);
  assert.deepEqual(parseColor("#fff8"), [255, 255, 255, 0x88 / 255]);
  assert.deepEqual(parseColor("rgba(1, 2, 3, 0.5)"), [1, 2, 3, 0.5]);
  assert.deepEqual(parseColor("rgb(1 2 3 / 50%)"), [1, 2, 3, 0.5]);
  assert.equal(parseColor("transparent"), null);
  for (const invalid of ["rgb(1 2 3 4 / 1)", "rgb(1 2 3 /)", "rgb(% % %)", "rgb(0x10,0,0)", "rgb(1,2 3)", "rgb(1,2,3,)",
    "rgb(1, 2, 3 / 0.5)"]) {
    assert.throws(() => parseColor(invalid), /unsupported|not a CSS number/, invalid);
  }
  assert.deepEqual(parseColor("RGB( 10%, 0, 0 )"), [25.5, 0, 0, 1]);
  assert.equal(deltaE([10, 20, 30], [10, 20, 30]), 0);
  assert.ok(deltaE([0, 0, 0], [255, 255, 255]) > 99);
});

test("request validation refuses malformed requests and score fields", () => {
  const good = request([regression({ baseline: "a.png", candidate: "b.png" })]);
  assert.doesNotThrow(() => validateVisualRequest(good));
  const cases = [
    [{ ...good, evaluations: [{ ...good.evaluations[0], evaluator: "vibe-check" }] }, /evaluator is unknown/],
    [{ ...good, evaluations: [{ ...good.evaluations[0], inputs: { baseline: "a.png" } }] }, /inputs keys/],
    [{ ...good, evaluations: [{ ...good.evaluations[0], threshold: { maxChangedRatio: 2, channelTolerance: 0 } }] }, /at most 1/],
    [{ ...good, evaluations: [good.evaluations[0], good.evaluations[0]] }, /duplicated/],
    [{ ...good, source: { kind: "x", sha256: "abc" } }, /SHA-256/],
    [{ ...good, qualityScore: 90 }, /keys must be|no aggregate score/],
    [{ ...good, evaluations: [{ ...good.evaluations[0], id: {} }] }, /id must be a non-empty string/],
    [{ ...good, tool: { name: 42, version: "1" } }, /tool.name must be a non-empty string/],
    [{ ...good, evaluations: [{ ...good.evaluations[0], threshold: { maxChangedRatio: 0, channelTolerance: 255 } }] }, /at most 254/],
    [{ ...good, evaluations: [{ ...good.evaluations[0], threshold: { maxChangedRatio: 0, channelTolerance: 1.5 } }] }, /integer/],
  ];
  for (const [value, pattern] of cases) assert.throws(() => validateVisualRequest(value), pattern);
});

test("report contract rejects asserted passes, hidden gaps, and scores", () => {
  const base = solid(4, 3, [0, 0, 0, 255]);
  const dir = evidence({ "a.png": encodePng(4, 3, base), "b.png": encodePng(4, 3, withBlock(base, 4, [0, 0], [255, 0, 0, 255])) });
  try {
    const report = evaluateVisualRequest(request([regression({ baseline: "a.png", candidate: "b.png" })]), { evidenceDir: dir });
    const again = evaluateVisualRequest(request([regression({ baseline: "a.png", candidate: "b.png" })]), { evidenceDir: dir });
    assert.deepEqual(again, report, "identical inputs produce an identical report");
    const mutate = (edit) => {
      const copy = structuredClone(report);
      edit(copy);
      return () => validateVisualEvaluation(copy);
    };
    assert.throws(mutate((r) => { r.evaluations[0].status = "pass"; r.summary = { pass: 1, fail: 0, unverified: 0, status: "pass" }; }),
      /contradicts its measurement/);
    assert.throws(mutate((r) => { r.evaluations[0].artifacts.pop(); }), /needs artifacts for candidate/);
    assert.throws(mutate((r) => { r.evaluations[0].status = "unverified"; r.summary = { pass: 0, fail: 0, unverified: 1, status: "unverified" }; }),
      /no measurement/);
    assert.throws(mutate((r) => { r.evaluations[0].uncertainty = []; }), /uncertainty must be a non-empty/);
    assert.throws(mutate((r) => { r.summary.status = "pass"; }), /summary must be derived/);
    assert.throws(mutate((r) => { r.evaluations[0].measurement.fidelityScore = 97; }), /no aggregate score/);
    assert.throws(mutate((r) => { r.evaluations[0].measurement.changedRatio = null; }), /must equal changedPixels/);
    assert.throws(mutate((r) => { r.evaluations[0].measurement.changedPixels = "1"; }), /integer/);
    assert.throws(mutate((r) => { Object.assign(r.evaluations[0].measurement, { changedPixels: 0, changedRatio: 0 }); }),
      /changedBounds must be null exactly/);
    assert.throws(mutate((r) => { r.evaluations[0].measurement.dimensionsMatch = "yes"; }), /must be a boolean/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("schema enums match the evaluator registry", () => {
  const evaluation = VISUAL_EVALUATION_SCHEMA.$defs.evaluation.properties;
  assert.deepEqual(evaluation.evaluator.enum.sort(), Object.keys(VISUAL_EVALUATORS).sort());
  const roles = [...new Set(Object.values(VISUAL_EVALUATORS).flatMap((entry) => entry.roles))].sort();
  assert.deepEqual([...VISUAL_EVALUATION_SCHEMA.$defs.artifact.properties.role.enum].sort(), roles);
});

test("a single changed pixel on a 2x 1080p capture fails a zero threshold", () => {
  const width = 3840;
  const height = 2160;
  const base = solid(width, height, [240, 240, 240, 255]);
  const dir = evidence({ "a.png": encodePng(width, height, base),
    "b.png": encodePng(width, height, withBlock(base, width, [100, 100], [0, 0, 0, 255])) });
  try {
    const [result] = evaluateVisualRequest(request([{ id: "hd", evaluator: "screenshot-regression",
      viewport: { name: "desktop", width: 1920, height: 1080 }, threshold: { maxChangedRatio: 0, channelTolerance: 0 },
      inputs: { baseline: "a.png", candidate: "b.png" } }]), { evidenceDir: dir }).evaluations;
    assert.equal(result.status, "fail");
    assert.equal(result.measurement.changedPixels, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("PNG decoder refuses decompression bombs and critical chunks it cannot interpret", () => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const signature = encodePng(1, 1, new Uint8Array(4)).subarray(0, 8);
  const bomb = Buffer.concat([signature, pngChunk("IHDR", ihdr), pngChunk("IDAT", deflateSync(Buffer.alloc(20_000_000))),
    pngChunk("IEND", Buffer.alloc(0))]);
  assert.throws(() => decodePng(bomb), /does not inflate/);
  const palette = Buffer.concat([signature, pngChunk("IHDR", ihdr), pngChunk("PLTE", Buffer.alloc(3)),
    pngChunk("IDAT", deflateSync(Buffer.alloc(5))), pngChunk("IEND", Buffer.alloc(0))]);
  assert.throws(() => decodePng(palette), /critical chunk PLTE/);
  const ancillary = Buffer.concat([signature, pngChunk("IHDR", ihdr), pngChunk("tEXt", Buffer.from("k\0v")),
    pngChunk("IDAT", deflateSync(Buffer.from([0, 1, 2, 3, 4]))), pngChunk("IEND", Buffer.alloc(0))]);
  assert.deepEqual([...decodePng(ancillary).rgba], [1, 2, 3, 4], "ancillary chunks are ignored");
});

test("report contract rejects inconsistent overflow and drift measurements", () => {
  const dir = evidence({
    "wide.json": JSON.stringify({ viewport: { width: 4, height: 3 }, document: { scrollWidth: 9, clientWidth: 4 },
      elements: [{ selector: ".x", left: 0, right: 9 }] }),
    "tokens.json": JSON.stringify({ colors: { "--ink": "#000000" } }),
    "styles.json": JSON.stringify({ declarations: [{ selector: "p", property: "color", value: "#ff0000" }] }),
  });
  try {
    const report = evaluateVisualRequest(request([
      { id: "o", evaluator: "responsive-overflow", viewport: MOBILE, threshold: { tolerancePx: 0 }, inputs: { layout: "wide.json" } },
      { id: "b", evaluator: "brand-token-drift", viewport: MOBILE, threshold: { maxDeltaE: 2.3, maxOffPalette: 0, maxUnevaluated: 0 },
        inputs: { styles: "styles.json", tokens: "tokens.json" } },
    ]), { evidenceDir: dir });
    const mutate = (edit) => {
      const copy = structuredClone(report);
      edit(copy);
      return () => validateVisualEvaluation(copy);
    };
    const passing = { pass: 1, fail: 1, unverified: 0, status: "fail" };
    assert.throws(mutate((r) => { r.evaluations[0].measurement.offenderCount = 0; r.evaluations[0].status = "pass"; r.summary = passing; }),
      /must list the first 0 of 0/);
    assert.throws(mutate((r) => { r.evaluations[0].measurement.documentOverflowPx = -50; }), /non-negative/);
    assert.throws(mutate((r) => { r.evaluations[1].measurement.offPaletteCount = 0; r.evaluations[1].status = "pass"; r.summary = passing; }),
      /must list the first 0 of 0/);
    assert.throws(mutate((r) => { r.evaluations[1].measurement.unevaluatedValues = 3; }), /unverified/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
