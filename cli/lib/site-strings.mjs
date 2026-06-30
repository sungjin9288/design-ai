// Shared string helpers for Website Improvement workspace reports.

export function normalizeStringArray(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

export function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

export function markdownList(items, fallback) {
  const normalized = normalizeStringArray(items);
  if (normalized.length === 0) return `- ${fallback}`;
  return normalized.map((item) => `- ${item}`).join("\n");
}
