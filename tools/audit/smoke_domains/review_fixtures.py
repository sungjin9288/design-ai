"""P6–P10 fixture writers shared by package and registry smoke tests."""
from __future__ import annotations

import json
from pathlib import Path


def write_implementation_scope_request(file_path: Path) -> None:
    file_path.write_text(
        json.dumps(
            {
                "kind": "design-ai-implementation-scope-request",
                "schemaVersion": 1,
                "objective": "Clarify the settings save action without changing the architecture.",
                "intendedBehavior": ["Keep the primary action clear and keyboard accessible."],
                "files": {
                    "inspect": ["src/settings/**/*.tsx", "src/settings/**/*.test.tsx"],
                    "change": ["src/settings/**/*.tsx"],
                    "generated": [],
                },
                "dependencies": [],
                "migrations": [],
                "externalWrites": [
                    {"system": "GitHub", "action": "push branch", "destination": "acme/site"}
                ],
                "verificationCommands": ["npm test", "npm run build"],
                "risks": ["The current label may be referenced by an existing test."],
                "preExistingChanges": [],
                "release": {"commit": True, "push": True, "deployment": False},
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )


def write_inspect_fixture(file_path: Path) -> None:
    file_path.write_text(
        """<!doctype html>
<html lang="ko">
  <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body><span>휴대폰 번호</span><input name="phone"><button>저장</button></body>
</html>
""",
        encoding="utf-8",
    )


def write_browser_adapter(file_path: Path) -> None:
    file_path.write_text(
        r'''#!/usr/bin/env node
let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
const { writeFileSync } = await import("node:fs");
const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
  "base64",
);
const probes = [];
for (const viewport of request.viewports) {
  for (const check of request.checks) {
    const kind = check === "responsive" ? "screenshot" : check === "accessibility" ? "accessibility" : "trace";
    const file = `${check}-${viewport.name}.${kind === "screenshot" ? "png" : kind === "accessibility" ? "json" : "txt"}`;
    const contents = kind === "screenshot"
      ? pixel
      : kind === "accessibility"
        ? JSON.stringify({ role: "document", viewport: viewport.name })
        : `${check} passed at ${viewport.name}\n`;
    writeFileSync(file, contents);
    probes.push({
      check,
      viewport: viewport.name,
      status: "pass",
      observedAt: new Date().toISOString(),
      observation: `${check} passed at ${viewport.name}`,
      artifacts: [{ kind, path: file }],
    });
  }
}
process.stdout.write(JSON.stringify({
  kind: "design-ai-browser-probe-result",
  schemaVersion: 1,
  tool: { name: "package-smoke-adapter", version: "1.0.0" },
  policy: {
    allowedOrigin: request.networkPolicy.allowedOrigin,
    allowedMethods: request.networkPolicy.allowedMethods,
    crossOrigin: "blocked",
    webSockets: "blocked",
    downloads: "blocked",
  },
  probes,
}));
''',
        encoding="utf-8",
    )
    file_path.chmod(0o755)
