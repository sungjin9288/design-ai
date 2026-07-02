// Generic status/command/formatting helpers shared by the signals-* modules.

export function countBy(items, keyFn) {
  const counts = {};
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function readinessCountByStatus(items = []) {
  const counts = {
    pass: 0,
    info: 0,
    warn: 0,
    fail: 0,
    missing: 0,
    template: 0,
    unknown: 0,
  };
  for (const item of items || []) {
    const status = String(item?.status || "unknown").trim() || "unknown";
    if (Object.hasOwn(counts, status)) {
      counts[status] += 1;
    } else {
      counts.unknown += 1;
    }
  }
  return counts;
}

export function previewText(text, maxLength = 120) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

export function statusRank(status) {
  if (status === "fail") return 3;
  if (status === "warn" || status === "missing") return 2;
  if (status === "template" || status === "unknown") return 1;
  return 0;
}

export function worstStatus(statuses, fallback = "pass") {
  return [...statuses].sort((a, b) => statusRank(b) - statusRank(a))[0] || fallback;
}

export function shellQuote(value) {
  const text = String(value || "");
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}

export function commandFromArgs(args = []) {
  return args.map(shellQuote).join(" ");
}

export function commandSpec(args = []) {
  const commandArgs = args.map((item) => String(item));
  return {
    commandArgs,
    command: commandFromArgs(commandArgs),
  };
}

export function yesNo(value) {
  return value ? "yes" : "no";
}

export function listItem(label, value) {
  return `- ${label}: ${value}`;
}
