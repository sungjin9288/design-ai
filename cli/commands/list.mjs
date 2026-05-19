// `design-ai list [domain]` — list skills / commands / agents from the plugin manifest.

import { readFileSync } from "node:fs";
import { hasHelpFlag } from "../lib/help-flags.mjs";
import { header, info, dim } from "../lib/log.mjs";
import { PLUGIN_MANIFEST, pathExists } from "../lib/paths.mjs";
import { expectedValueMessage, unknownOptionMessage } from "../lib/suggest.mjs";

export const LIST_KINDS = ["skills", "commands", "agents"];
const LIST_OPTIONS = ["-h", "--help", "--json"];

function loadManifest() {
  if (!pathExists(PLUGIN_MANIFEST)) {
    throw new Error(`Plugin manifest not found at ${PLUGIN_MANIFEST}`);
  }
  return JSON.parse(readFileSync(PLUGIN_MANIFEST, "utf8"));
}

export function parseListArgs(args) {
  const flags = {
    help: false,
    json: false,
    kind: "",
  };

  const domains = [];
  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      flags.help = true;
      continue;
    }
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(
        `${unknownOptionMessage("list", arg, LIST_OPTIONS)}\n` +
          "Usage: design-ai list [skills|commands|agents] [--json]",
      );
    }
    domains.push(arg);
  }

  if (domains.length > 1) {
    throw new Error("Usage: design-ai list [skills|commands|agents] [--json]");
  }

  const filter = domains[0]?.toLowerCase() || "";
  const target = filter && LIST_KINDS.find(k => k.startsWith(filter));

  if (filter && !target) {
    throw new Error(
      `Unknown domain: ${filter}\n` +
        expectedValueMessage("domain", filter, LIST_KINDS),
    );
  }

  flags.kind = target || "";
  return flags;
}

function catalogItem(item) {
  return {
    name: item.name,
    path: item.path,
    description: item.description,
  };
}

export function buildListCatalog(manifest, kind = "") {
  const kinds = kind ? [kind] : LIST_KINDS;
  return {
    name: manifest.name,
    version: manifest.version,
    kind: kind || null,
    sections: kinds.map((sectionKind) => {
      const items = (manifest[sectionKind] || []).map(catalogItem);
      return {
        kind: sectionKind,
        count: items.length,
        items,
      };
    }),
  };
}

export function formatListJson(catalog) {
  return JSON.stringify(catalog, null, 2);
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

function printHelp() {
  console.log("Usage:  design-ai list [skills|commands|agents] [--json]\n");
  console.log("Lists catalog entries from the plugin manifest.");
  console.log("Omit the kind to print all catalog sections.\n");
  console.log("Arguments:");
  console.log("  skills     List installed skill playbooks");
  console.log("  commands   List slash command templates");
  console.log("  agents     List bundled agent personas");
  console.log("\nOptions:");
  console.log("  --json     Emit machine-readable catalog entries");
}

export async function runList(args) {
  if (hasHelpFlag(args)) {
    printHelp();
    return;
  }

  const parsed = parseListArgs(args);
  const manifest = loadManifest();
  if (parsed.json) {
    console.log(formatListJson(buildListCatalog(manifest, parsed.kind)));
    return;
  }

  header("design-ai catalog");
  info(`Plugin: ${manifest.name} v${manifest.version}`);
  console.log();

  if (parsed.kind) {
    printList(parsed.kind, manifest[parsed.kind] || []);
  } else {
    for (const k of LIST_KINDS) {
      printList(k, manifest[k] || []);
    }
  }
}
