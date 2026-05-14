// Small typo-tolerant suggestion helpers shared by CLI entry points.

export function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

export function suggestNearest(name, candidates, { minLength = 2, maxDistance } = {}) {
  const input = String(name || "").trim().toLowerCase();
  if (input.length < minLength) return "";

  const ranked = candidates
    .map((candidate) => String(candidate || "").trim())
    .filter(Boolean)
    .map((candidate) => ({
      candidate,
      distance: levenshteinDistance(input, candidate.toLowerCase()),
    }))
    .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate));

  const best = ranked[0];
  if (!best) return "";

  const threshold = Number.isInteger(maxDistance)
    ? maxDistance
    : input.length <= 4 ? 1 : 2;
  return best.distance <= threshold ? best.candidate : "";
}
