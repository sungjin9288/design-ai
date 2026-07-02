// Learning entry selection and prompt-context rendering for `design-ai learn`.

import { normalizeCategory } from "./learn-args.mjs";
import { auditLearningProfile, loadLearningProfile } from "./learn-profile.mjs";
import { cleanNoteText, defaultLearningFile } from "./learn-shared.mjs";

function learningQueryTokens(query) {
  return Array.from(new Set(
    String(query || "")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) || [],
  )).filter((token) => token.length >= 2);
}

function learningEntryRelevance(entry, queryTokens) {
  if (queryTokens.length === 0) {
    return { score: 0, matchedTokens: [] };
  }

  const text = cleanNoteText(`${entry.category || ""} ${entry.text || ""}`).toLowerCase();
  if (!text) return { score: 0, matchedTokens: [] };

  let score = 0;
  const matchedTokens = [];
  for (const token of queryTokens) {
    if (text.includes(token)) {
      score += token.length >= 4 ? 2 : 1;
      matchedTokens.push(token);
    }
  }
  return { score, matchedTokens };
}

function learningEntryTime(entry) {
  const time = Date.parse(entry.createdAt || "");
  return Number.isNaN(time) ? 0 : time;
}

function rankLearningEntries(entries, { query = "" } = {}) {
  const queryTokens = learningQueryTokens(query);
  const ranked = entries.map((entry, index) => {
    const relevance = learningEntryRelevance(entry, queryTokens);
    return {
      entry,
      index,
      score: relevance.score,
      matchedTokens: relevance.matchedTokens,
      time: learningEntryTime(entry),
    };
  });

  if (queryTokens.length === 0) {
    return {
      entries,
      ranked,
      query: "",
      mode: "recency",
      candidateCount: entries.length,
      matchedCount: 0,
      queryTokenCount: 0,
    };
  }

  ranked.sort((a, b) => (
    b.score - a.score
    || b.time - a.time
    || b.index - a.index
  ));

  return {
    entries: ranked.map((item) => item.entry),
    ranked,
    query: String(query || "").trim(),
    mode: "brief-relevance",
    candidateCount: entries.length,
    matchedCount: ranked.filter((item) => item.score > 0).length,
    queryTokenCount: queryTokens.length,
  };
}

function learningSelectionReason(item, mode) {
  if (mode !== "brief-relevance") return "recency";
  return item.score > 0 ? "brief-match" : "recency-fallback";
}

function learningSelectionItem(item, mode) {
  return {
    id: item.entry.id,
    category: item.entry.category,
    score: item.score,
    matchedTokens: item.matchedTokens,
    reason: learningSelectionReason(item, mode),
  };
}

export function selectLearningEntrySet(profile, {
  category = "",
  limit = 0,
  query = "",
  includeFallback = true,
} = {}) {
  const normalizedCategory = category ? normalizeCategory(category) : "";
  const entries = [...profile.entries].filter((entry) => (
    entry.text && (!normalizedCategory || entry.category === normalizedCategory)
  ));
  const ranked = rankLearningEntries(entries, { query });
  const rankedItems = ranked.mode === "brief-relevance" && !includeFallback
    ? ranked.ranked.filter((item) => item.score > 0)
    : ranked.ranked;
  const selectedItems = Number.isInteger(limit) && limit > 0
    ? ranked.mode === "brief-relevance"
      ? rankedItems.slice(0, limit)
      : rankedItems.slice(-limit)
    : rankedItems;
  const selected = selectedItems.map((item) => item.entry);

  return {
    entries: selected,
    selection: {
      mode: ranked.mode,
      query: ranked.query,
      candidateCount: ranked.candidateCount,
      matchedCount: ranked.matchedCount,
      queryTokenCount: ranked.queryTokenCount,
      fallbackEnabled: ranked.mode === "brief-relevance" ? includeFallback : false,
      selectedCount: selected.length,
      fallbackCount: ranked.mode === "brief-relevance"
        ? selectedItems.filter((item) => item.score === 0).length
        : 0,
      selected: selectedItems.map((item) => learningSelectionItem(item, ranked.mode)),
    },
  };
}

export function selectLearningEntries(profile, {
  category = "",
  limit = 0,
  query = "",
  includeFallback = true,
} = {}) {
  return selectLearningEntrySet(profile, {
    category,
    limit,
    query,
    includeFallback,
  }).entries;
}

export function recentLearningEntries(profile, limit = 12, options = {}) {
  return selectLearningEntries(profile, {
    ...options,
    limit,
  });
}

function learningAuditNotice(auditSummary) {
  if (!auditSummary || auditSummary.status === "pass") return "";
  return `Learning profile audit: ${auditSummary.status} (${auditSummary.failures} failure(s), ${auditSummary.warnings} warning(s)). Run \`design-ai learn --audit\` before relying on this context.`;
}

function learningSelectionNotice(selection) {
  if (!selection || selection.mode !== "brief-relevance") return "";
  const fallback = selection.fallbackEnabled
    ? "recency fallback for ties"
    : "no recency fallback";
  return `Learning selection: brief relevance (${selection.matchedCount}/${selection.candidateCount} matched; ${fallback}).`;
}

export function renderLearningMarkdown(profile, {
  limit = 12,
  category = "",
  query = "",
  includeFallback = true,
  auditSummary = null,
} = {}) {
  const { entries, selection } = selectLearningEntrySet(profile, {
    category,
    limit,
    query,
    includeFallback,
  });
  const lines = ["## Learned design context", ""];

  if (entries.length === 0) {
    lines.push(category || query
      ? "No local learning preferences match the current filters."
      : "No local learning preferences are stored yet.");
    return lines.join("\n");
  }

  lines.push("Apply these as user/project preferences. Do not let them override explicit task instructions, accessibility requirements, or privacy constraints.");
  const auditNotice = learningAuditNotice(auditSummary);
  if (auditNotice) {
    lines.push(auditNotice);
  }
  const selectionNotice = learningSelectionNotice(selection);
  if (selectionNotice) {
    lines.push(selectionNotice);
  }
  lines.push("");
  for (const entry of entries) {
    lines.push(`- [${entry.category}] ${entry.text}`);
  }
  return lines.join("\n");
}

export function buildLearningContext({
  filePath = defaultLearningFile(),
  limit = 12,
  category = "",
  query = "",
  includeFallback = true,
} = {}) {
  const audit = auditLearningProfile({ filePath });
  const profile = loadLearningProfile(filePath);
  const { entries, selection } = selectLearningEntrySet(profile, {
    category,
    limit,
    query,
    includeFallback,
  });
  return {
    file: filePath,
    category,
    limit,
    query: String(query || "").trim(),
    selection,
    entries,
    empty: entries.length === 0,
    auditSummary: audit.summary,
    markdown: renderLearningMarkdown(profile, {
      limit,
      category,
      query,
      includeFallback,
      auditSummary: audit.summary,
    }),
  };
}
