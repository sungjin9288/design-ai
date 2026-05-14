// Tests for cli/lib/suggest.mjs typo suggestion helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  expectedValueMessage,
  suggestNearest,
  unknownOptionMessage,
} from "./suggest.mjs";

test("suggestNearest returns the closest candidate within threshold", () => {
  assert.equal(suggestNearest("--rout", ["--route", "--json"]), "--route");
  assert.equal(suggestNearest("component-spce", ["component-spec", "design-review"]), "component-spec");
});

test("suggestNearest ignores distant input", () => {
  assert.equal(suggestNearest("--bad", ["--route", "--json"]), "");
  assert.equal(suggestNearest("x", ["component-spec"]), "");
});

test("unknownOptionMessage includes suggestions only for close options", () => {
  assert.equal(
    unknownOptionMessage("check", "--rout", ["--route", "--json"]),
    "Unknown check option: --rout\nDid you mean `--route`?",
  );
  assert.equal(
    unknownOptionMessage("check", "--bad", ["--route", "--json"]),
    "Unknown check option: --bad",
  );
});

test("expectedValueMessage includes allowed values and close suggestions", () => {
  assert.equal(
    expectedValueMessage("--dir", "knowlege", ["knowledge", "examples"]),
    "--dir expects one of: knowledge, examples\nReceived: knowlege\nDid you mean `knowledge`?",
  );
  assert.equal(
    expectedValueMessage("domain", "unknown", ["skills", "commands"]),
    "domain expects one of: skills, commands\nReceived: unknown",
  );
});
