import assert from "node:assert/strict";
import { test } from "node:test";

import { parseStartArgs, renderStartMarkdown } from "./start.mjs";

test("parseStartArgs keeps typed context and repeated values explicit", () => {
  assert.deepEqual(
    parseStartArgs([
      "Improve",
      "settings",
      "--route",
      "flow-design",
      "--local-path",
      "/tmp/app",
      "--screenshot",
      "before.png",
      "--screenshot",
      "after.png",
      "--viewport",
      "mobile",
      "--locale",
      "ko-KR",
      "--json",
    ]),
    {
      briefParts: ["Improve", "settings"],
      fromFile: "",
      stdin: false,
      routeId: "flow-design",
      siteName: "",
      repoUrl: "",
      localPath: "/tmp/app",
      url: "",
      screenshots: ["before.png", "after.png"],
      locale: "ko-KR",
      viewports: ["mobile"],
      json: true,
      help: false,
    },
  );
});

test("renderStartMarkdown exposes uncertainty and the execution boundary", () => {
  const markdown = renderStartMarkdown({
    brief: "Review settings",
    context: { locale: "ko-KR", viewports: ["mobile"] },
    route: { id: "flow-design", label: "Feature flow design" },
    pathway: {
      id: "implementation-plan",
      status: "playbook-ready",
      reason: "Ready after review.",
      command: "design-ai artifact implementation-plan",
      missingInputs: [],
    },
    review: { status: "playbook-ready-not-run" },
    effects: {
      performed: { localWrites: [], targetRepoMutations: [], externalActions: [] },
      intended: { reads: [], localWrites: [] },
    },
    designContract: { markdown: "# Contract" },
  });

  assert.match(markdown, /Declared repositories, URLs, and screenshots were not inspected/);
  assert.match(markdown, /Performed target-repo mutations: 0/);
  assert.match(markdown, /No design artifact, repository, page, screenshot, or runtime behavior was reviewed/);
  assert.match(markdown, /# Contract/);
});
