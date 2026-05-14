// `design-ai list [domain]` — list skills / commands / agents from the plugin manifest.

import { readFileSync } from "node:fs";
import { header, info, dim } from "../lib/log.mjs";
import { PLUGIN_MANIFEST, pathExists } from "../lib/paths.mjs";
import { expectedValueMessage } from "../lib/suggest.mjs";

export const LIST_KINDS = ["skills", "commands", "agents"];

function loadManifest() {
  if (!pathExists(PLUGIN_MANIFEST)) {
    throw new Error(`Plugin manifest not found at ${PLUGIN_MANIFEST}`);
  }
  return JSON.parse(readFileSync(PLUGIN_MANIFEST, "utf8"));
}

function printList(kind, items) {
  console.log(`\n${kind} (${items.length})`);
  console.log("─".repeat(40));
  for (const item of items) {
    console.log(`  ${item.name}`);
    if (item.description) {
      // Truncate to fit terminal nicely
      const desc = item.description.length > 90
        ? item.description.slice(0, 87) + "..."
        : item.description;
      console.log(`    ${dim(desc)}`);
    }
  }
}

export async function runList(args) {
  const filter = args[0]?.toLowerCase();
  const target = filter && LIST_KINDS.find(k => k.startsWith(filter));

  if (filter && !target) {
    throw new Error(
      `Unknown domain: ${filter}\n` +
        expectedValueMessage("domain", filter, LIST_KINDS),
    );
  }

  header("design-ai catalog");
  const manifest = loadManifest();
  info(`Plugin: ${manifest.name} v${manifest.version}`);
  console.log();

  if (target) {
    printList(target, manifest[target] || []);
  } else {
    for (const k of LIST_KINDS) {
      printList(k, manifest[k] || []);
    }
  }
}
