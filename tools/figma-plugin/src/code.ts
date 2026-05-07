/**
 * design-ai token importer — Figma plugin code (sandbox)
 *
 * Imports a Style Dictionary / W3C DTCG JSON token set into the current
 * Figma file as Variables. Reads tokens from the plugin UI, creates
 * matching Variables grouped into a Collection per token category.
 *
 * Companion to: tools/preview/render-tokens.py (HTML preview) and
 * docs/FIGMA-INTEGRATION.md.
 *
 * This is a SCAFFOLD — battle-test before production use.
 */

figma.showUI(__html__, { width: 480, height: 600 });

// Listen for the user pasting tokens in the UI
figma.ui.onmessage = async (msg: { type: string; payload?: unknown }) => {
  if (msg.type === "import-tokens") {
    const tokens = msg.payload as Record<string, unknown>;
    await importTokens(tokens);
    figma.ui.postMessage({ type: "import-complete" });
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

/**
 * Imports tokens from a structured object into Figma Variables.
 *
 * Token shape (W3C DTCG):
 *   {
 *     color: {
 *       primary: {
 *         "600": { $value: "#7C3AED", $type: "color" }
 *       }
 *     },
 *     spacing: {
 *       md: { $value: "12px", $type: "dimension" }
 *     }
 *   }
 *
 * Each top-level key (color / spacing / typography) becomes a Collection.
 * Nested keys flatten to dot-separated variable names.
 */
async function importTokens(tokens: Record<string, unknown>): Promise<void> {
  for (const [collectionName, group] of Object.entries(tokens)) {
    if (typeof group !== "object" || group === null) continue;

    let collection = figma.variables
      .getLocalVariableCollections()
      .find((c) => c.name === collectionName);

    if (!collection) {
      collection = figma.variables.createVariableCollection(collectionName);
    }

    const modeId = collection.modes[0].modeId;

    flatten(group as Record<string, unknown>, "", (path, value, type) => {
      const variableName = path;
      const existing = figma.variables
        .getLocalVariables()
        .find((v) => v.name === variableName && v.variableCollectionId === collection!.id);

      const variable =
        existing ??
        figma.variables.createVariable(
          variableName,
          collection!.id,
          mapTypeToVariableType(type),
        );

      variable.setValueForMode(modeId, parseValue(value, type));
    });
  }

  figma.notify(`Imported tokens into ${Object.keys(tokens).length} collection(s).`);
}

function flatten(
  obj: Record<string, unknown>,
  prefix: string,
  visit: (path: string, value: string, type: string) => void,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      typeof value === "object" &&
      value !== null &&
      !("$value" in value)
    ) {
      flatten(value as Record<string, unknown>, path, visit);
    } else if (
      typeof value === "object" &&
      value !== null &&
      "$value" in value
    ) {
      const v = value as { $value: string; $type?: string };
      visit(path, v.$value, v.$type ?? "color");
    }
  }
}

function mapTypeToVariableType(
  type: string,
): "COLOR" | "FLOAT" | "STRING" | "BOOLEAN" {
  switch (type) {
    case "color":
      return "COLOR";
    case "dimension":
    case "number":
      return "FLOAT";
    case "boolean":
      return "BOOLEAN";
    default:
      return "STRING";
  }
}

function parseValue(value: string, type: string): RGB | RGBA | number | string | boolean {
  if (type === "color") {
    return parseColor(value);
  }
  if (type === "dimension" || type === "number") {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  if (type === "boolean") {
    return value === "true";
  }
  return value;
}

function parseColor(hex: string): RGB | RGBA {
  // Accept #rgb, #rrggbb, #rrggbbaa
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if (h.length === 8) {
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }
  return { r, g, b };
}
