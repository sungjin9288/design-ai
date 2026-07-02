// Learning usage sidecar log and stats for `design-ai learn`.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { auditLearningProfile, loadLearningProfile } from "./learn-profile.mjs";
import {
  countBy,
  defaultLearningFile,
  defaultLearningUsageFile,
  previewText,
  shortHash,
  statsEntry,
} from "./learn-shared.mjs";

const DEFAULT_LEARNING_USAGE_EVENT_LIMIT = 500;
export function emptyLearningUsageLog({ profileFile = "" } = {}) {
  return {
    version: 1,
    updatedAt: "",
    profileFile,
    events: [],
  };
}

function normalizeLearningUsageEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const createdAt = String(event.createdAt || "").trim();
  const command = String(event.command || "").trim();
  const selectedEntryIds = Array.isArray(event.selectedEntryIds)
    ? event.selectedEntryIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];

  if (!createdAt || !command) return null;

  return {
    id: String(event.id || `learn-use-${shortHash(`${createdAt}\n${command}`)}`).trim(),
    command,
    routeId: String(event.routeId || "").trim(),
    profileFile: String(event.profileFile || "").trim(),
    briefHash: String(event.briefHash || "").trim(),
    category: String(event.category || "").trim(),
    limit: Number.isInteger(event.limit) ? event.limit : null,
    selectedEntryIds,
    selectedCount: Number.isInteger(event.selectedCount) ? event.selectedCount : selectedEntryIds.length,
    candidateCount: Number.isInteger(event.candidateCount) ? event.candidateCount : 0,
    matchedCount: Number.isInteger(event.matchedCount) ? event.matchedCount : 0,
    fallbackCount: Number.isInteger(event.fallbackCount) ? event.fallbackCount : 0,
    queryTokenCount: Number.isInteger(event.queryTokenCount) ? event.queryTokenCount : 0,
    auditStatus: String(event.auditStatus || "").trim(),
    createdAt,
  };
}

export function normalizeLearningUsageLog(rawLog, { profileFile = "" } = {}) {
  const log = rawLog && typeof rawLog === "object" ? rawLog : {};
  const events = Array.isArray(log.events)
    ? log.events.map(normalizeLearningUsageEvent).filter(Boolean)
    : [];

  return {
    version: Number.isInteger(log.version) ? log.version : 1,
    updatedAt: String(log.updatedAt || "").trim(),
    profileFile: String(log.profileFile || profileFile || "").trim(),
    events,
  };
}

export function loadLearningUsageLog(filePath = defaultLearningUsageFile(), { profileFile = "" } = {}) {
  if (!existsSync(filePath)) {
    return emptyLearningUsageLog({ profileFile });
  }

  const raw = readFileSync(filePath, "utf8");
  try {
    return normalizeLearningUsageLog(JSON.parse(raw), { profileFile });
  } catch {
    throw new Error(`Learning usage log is not valid JSON: ${filePath}`);
  }
}

function writeLearningUsageLog(filePath, log) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(log, null, 2)}\n`, "utf8");
}

export function buildLearningUsageEvent({
  command,
  routeId = "",
  learningContext,
  now = new Date(),
} = {}) {
  if (!learningContext) return null;

  const createdAt = now.toISOString();
  const selection = learningContext.selection || {};
  const selectedEntryIds = Array.isArray(selection.selected) && selection.selected.length > 0
    ? selection.selected.map((item) => item?.id).filter(Boolean)
    : (learningContext.entries || []).map((entry) => entry.id).filter(Boolean);
  const normalizedCommand = String(command || "").trim();

  return {
    id: `learn-use-${shortHash([
      createdAt,
      normalizedCommand,
      routeId,
      selectedEntryIds.join(","),
      learningContext.query || "",
    ].join("\n"))}`,
    command: normalizedCommand,
    routeId: String(routeId || "").trim(),
    profileFile: String(learningContext.file || "").trim(),
    briefHash: shortHash(learningContext.query || ""),
    category: String(learningContext.category || "").trim(),
    limit: Number.isInteger(learningContext.limit) ? learningContext.limit : null,
    selectedEntryIds,
    selectedCount: Number.isInteger(selection.selectedCount) ? selection.selectedCount : selectedEntryIds.length,
    candidateCount: Number.isInteger(selection.candidateCount) ? selection.candidateCount : 0,
    matchedCount: Number.isInteger(selection.matchedCount) ? selection.matchedCount : 0,
    fallbackCount: Number.isInteger(selection.fallbackCount) ? selection.fallbackCount : 0,
    queryTokenCount: Number.isInteger(selection.queryTokenCount) ? selection.queryTokenCount : 0,
    auditStatus: String(learningContext.auditSummary?.status || "").trim(),
    createdAt,
  };
}

export function recordLearningUsage({
  command,
  routeId = "",
  learningContext,
  usageFile = defaultLearningUsageFile(learningContext?.file || defaultLearningFile()),
  now = new Date(),
  eventLimit = DEFAULT_LEARNING_USAGE_EVENT_LIMIT,
} = {}) {
  const event = buildLearningUsageEvent({
    command,
    routeId,
    learningContext,
    now,
  });
  const resolvedUsageFile = path.resolve(usageFile);

  if (!event) {
    return {
      file: resolvedUsageFile,
      recorded: false,
      reason: "missing-learning-context",
      count: 0,
      event: null,
    };
  }

  const log = loadLearningUsageLog(resolvedUsageFile, { profileFile: event.profileFile });
  const updatedAt = event.createdAt;
  const maxEvents = Number.isInteger(eventLimit) && eventLimit > 0
    ? eventLimit
    : DEFAULT_LEARNING_USAGE_EVENT_LIMIT;
  const events = [...log.events, event].slice(-maxEvents);
  const nextLog = {
    version: 1,
    updatedAt,
    profileFile: event.profileFile || log.profileFile,
    events,
  };

  writeLearningUsageLog(resolvedUsageFile, nextLog);

  return {
    file: resolvedUsageFile,
    recorded: true,
    event,
    count: nextLog.events.length,
    eventLimit: maxEvents,
  };
}

function usageEventTime(event) {
  const time = Date.parse(event.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

function usageEventSummary(event) {
  return {
    id: event.id,
    command: event.command,
    routeId: event.routeId,
    category: event.category,
    limit: event.limit,
    selectedEntryIds: event.selectedEntryIds,
    selectedCount: event.selectedCount,
    candidateCount: event.candidateCount,
    matchedCount: event.matchedCount,
    fallbackCount: event.fallbackCount,
    queryTokenCount: event.queryTokenCount,
    auditStatus: event.auditStatus,
    briefHash: event.briefHash,
    createdAt: event.createdAt,
  };
}

function incrementUsageEntry(entryUsage, entryId, event) {
  if (!entryId) return;
  const existing = entryUsage.get(entryId) || {
    id: entryId,
    count: 0,
    commands: {},
    routes: {},
    latestUsedAt: "",
  };
  existing.count += 1;
  if (event.command) existing.commands[event.command] = (existing.commands[event.command] || 0) + 1;
  if (event.routeId) existing.routes[event.routeId] = (existing.routes[event.routeId] || 0) + 1;
  if (!existing.latestUsedAt || usageEventTime(event) >= Date.parse(existing.latestUsedAt || "1970-01-01T00:00:00.000Z")) {
    existing.latestUsedAt = event.createdAt;
  }
  entryUsage.set(entryId, existing);
}

function usageEntrySummary(entry, usage) {
  return {
    id: entry.id,
    category: entry.category,
    source: entry.source,
    textPreview: previewText(entry.text),
    usageCount: usage?.count || 0,
    latestUsedAt: usage?.latestUsedAt || "",
    commands: usage?.commands || {},
    routes: usage?.routes || {},
  };
}

export function learningStats({ filePath = defaultLearningFile() } = {}) {
  const audit = auditLearningProfile({ filePath });
  const payload = {
    file: filePath,
    exists: audit.exists,
    version: audit.version,
    updatedAt: audit.updatedAt,
    count: audit.count,
    categoryCounts: audit.categoryCounts,
    sourceCounts: {},
    oldestEntry: null,
    latestEntry: null,
    auditSummary: audit.summary,
  };

  if (!audit.exists || audit.summary.failures > 0) return payload;

  const profile = loadLearningProfile(filePath);
  const entries = profile.entries.filter((entry) => entry.text);
  payload.sourceCounts = countBy(entries, (entry) => entry.source || "cli");

  const datedEntries = entries
    .map((entry) => ({ entry, time: Date.parse(entry.createdAt) }))
    .filter(({ time }) => !Number.isNaN(time))
    .sort((a, b) => a.time - b.time);

  if (datedEntries.length > 0) {
    payload.oldestEntry = statsEntry(datedEntries[0].entry);
    payload.latestEntry = statsEntry(datedEntries[datedEntries.length - 1].entry);
  }

  return payload;
}

export function learningUsageStats({
  filePath = defaultLearningFile(),
  usageFile = defaultLearningUsageFile(filePath),
  limit = 10,
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedUsageFile = path.resolve(usageFile);
  const profileExists = existsSync(resolvedFile);
  const usageExists = existsSync(resolvedUsageFile);
  const profile = loadLearningProfile(resolvedFile);
  const usageLog = loadLearningUsageLog(resolvedUsageFile, { profileFile: resolvedFile });
  const events = usageLog.events;
  const maxRecentEvents = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const sortedEvents = [...events].sort((a, b) => usageEventTime(a) - usageEventTime(b));
  const recentEvents = [...sortedEvents].reverse().slice(0, maxRecentEvents).map(usageEventSummary);
  const entryUsage = new Map();

  for (const event of events) {
    for (const entryId of event.selectedEntryIds) {
      incrementUsageEntry(entryUsage, entryId, event);
    }
  }

  const profileEntryIds = new Set(profile.entries.map((entry) => entry.id));
  const selectedEntryIds = [...entryUsage.keys()].sort();
  const usedEntryIds = selectedEntryIds.filter((entryId) => profileEntryIds.has(entryId));
  const staleSelectedEntryIds = selectedEntryIds.filter((entryId) => !profileEntryIds.has(entryId));
  const unusedEntryIds = profile.entries
    .filter((entry) => !entryUsage.has(entry.id))
    .map((entry) => entry.id);
  const topSelectedEntries = profile.entries
    .map((entry) => usageEntrySummary(entry, entryUsage.get(entry.id)))
    .filter((entry) => entry.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount || String(b.latestUsedAt).localeCompare(String(a.latestUsedAt)))
    .slice(0, maxRecentEvents);
  const recommendations = [];

  if (!usageExists) {
    recommendations.push({
      level: "info",
      text: "No learning usage sidecar exists yet. Run prompt or pack with --with-learning to record local usage metadata.",
    });
  } else if (events.length === 0) {
    recommendations.push({
      level: "info",
      text: "Learning usage sidecar exists but has no events yet.",
    });
  }
  if (profile.entries.length > 0 && unusedEntryIds.length > 0) {
    recommendations.push({
      level: "info",
      text: "Review unused learning entries before curating; unused does not mean obsolete until enough prompt/pack usage has accumulated.",
    });
  }
  if (staleSelectedEntryIds.length > 0) {
    recommendations.push({
      level: "warning",
      text: "Usage sidecar references entry ids that are no longer present in the active learning profile.",
    });
  }

  return {
    file: resolvedFile,
    usageFile: resolvedUsageFile,
    exists: usageExists,
    profileExists,
    profileFile: usageLog.profileFile || resolvedFile,
    version: usageLog.version,
    updatedAt: usageLog.updatedAt,
    eventCount: events.length,
    profileEntryCount: profile.entries.length,
    usedEntryCount: usedEntryIds.length,
    unusedEntryCount: unusedEntryIds.length,
    staleSelectedEntryCount: staleSelectedEntryIds.length,
    commandCounts: countBy(events, (event) => event.command),
    routeCounts: countBy(events, (event) => event.routeId || "unrouted"),
    categoryCounts: countBy(events, (event) => event.category || "all"),
    auditStatusCounts: countBy(events, (event) => event.auditStatus || "unknown"),
    selectedEntryCounts: Object.fromEntries(
      selectedEntryIds.map((entryId) => [entryId, entryUsage.get(entryId).count]),
    ),
    topSelectedEntries,
    unusedEntryIds,
    staleSelectedEntryIds,
    oldestEvent: sortedEvents.length > 0 ? usageEventSummary(sortedEvents[0]) : null,
    latestEvent: sortedEvents.length > 0 ? usageEventSummary(sortedEvents[sortedEvents.length - 1]) : null,
    recentEvents,
    recommendations,
    privacy: {
      storesRawBriefText: false,
      storesBriefHash: true,
      storesSelectedEntryIds: true,
    },
  };
}
