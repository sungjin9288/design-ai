import {
  readRouteManifestVersion,
  routeBrief,
  routeCatalog,
} from "./route.mjs";

export function buildRoutePayload({ brief, sourceRoot, limit = 3, explain = false }) {
  const normalizedBrief = String(brief || "").trim();
  if (!normalizedBrief) {
    throw new Error("Brief is empty");
  }

  return {
    brief: normalizedBrief,
    version: readRouteManifestVersion(sourceRoot),
    routes: routeBrief({
      brief: normalizedBrief,
      sourceRoot,
      limit,
      explain,
    }),
  };
}

export function buildRouteCatalogPayload({ sourceRoot }) {
  return {
    version: readRouteManifestVersion(sourceRoot),
    routes: routeCatalog({ sourceRoot }),
  };
}
