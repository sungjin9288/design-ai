// Pure measurements behind the P17E visual evaluators. Each function either
// returns a measurement or throws a reason that the caller records as
// `unverified`; none of them decides pass or fail.
const MAX_LISTED = 20;
const COLOR_PROPERTIES = new Set([
  "color", "background-color", "border-color", "border-top-color", "border-right-color", "border-bottom-color",
  "border-left-color", "outline-color", "text-decoration-color", "fill", "stroke", "caret-color",
]);
const NON_COLORS = new Set(["transparent", "currentcolor", "inherit", "initial", "unset", "none"]);

export function pixelDiff(expected, actual, channelTolerance) {
  if (expected.width !== actual.width || expected.height !== actual.height) {
    return {
      dimensionsMatch: false,
      expected: { width: expected.width, height: expected.height },
      actual: { width: actual.width, height: actual.height },
      changedPixels: null, changedRatio: null, maxChannelDelta: null, changedBounds: null,
    };
  }
  let changed = 0;
  let maxDelta = 0;
  const bounds = { left: Infinity, top: Infinity, right: -1, bottom: -1 };
  for (let pixel = 0; pixel < actual.width * actual.height; pixel += 1) {
    let delta = 0;
    for (let channel = 0; channel < 4; channel += 1) {
      delta = Math.max(delta, Math.abs(expected.rgba[pixel * 4 + channel] - actual.rgba[pixel * 4 + channel]));
    }
    maxDelta = Math.max(maxDelta, delta);
    if (delta <= channelTolerance) continue;
    changed += 1;
    const x = pixel % actual.width;
    const y = Math.floor(pixel / actual.width);
    Object.assign(bounds, { left: Math.min(bounds.left, x), top: Math.min(bounds.top, y),
      right: Math.max(bounds.right, x), bottom: Math.max(bounds.bottom, y) });
  }
  const total = actual.width * actual.height;
  return {
    dimensionsMatch: true,
    expected: { width: expected.width, height: expected.height },
    actual: { width: actual.width, height: actual.height },
    changedPixels: changed,
    changedRatio: changed / total,
    maxChannelDelta: maxDelta,
    changedBounds: changed ? { x: bounds.left, y: bounds.top, width: bounds.right - bounds.left + 1,
      height: bounds.bottom - bounds.top + 1 } : null,
  };
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${field} must be a finite number`);
  return value;
}

export function overflow(layout, viewport, tolerancePx) {
  if (!layout || typeof layout !== "object" || !layout.viewport || !layout.document || !Array.isArray(layout.elements)) {
    throw new Error("layout must have viewport, document, and elements");
  }
  if (layout.viewport.width !== viewport.width || layout.viewport.height !== viewport.height) {
    throw new Error(`layout was measured at ${layout.viewport.width}x${layout.viewport.height}, not ${viewport.width}x${viewport.height}`);
  }
  const clientWidth = finiteNumber(layout.document.clientWidth, "layout.document.clientWidth");
  const scrollWidth = finiteNumber(layout.document.scrollWidth, "layout.document.scrollWidth");
  const offenders = layout.elements.filter((element, index) => {
    if (typeof element?.selector !== "string" || !element.selector.trim()) {
      throw new Error(`layout.elements[${index}].selector must be a non-empty string`);
    }
    const left = finiteNumber(element.left, `layout.elements[${index}].left`);
    const right = finiteNumber(element.right, `layout.elements[${index}].right`);
    return right > clientWidth + tolerancePx || left < -tolerancePx;
  });
  return {
    documentOverflowPx: Math.max(0, scrollWidth - clientWidth),
    elementsChecked: layout.elements.length,
    offenderCount: offenders.length,
    offenders: offenders.slice(0, MAX_LISTED).map(({ selector, left, right }) => ({ selector, left, right })),
  };
}

const CSS_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?%?$/i;

function cssNumber(value, field) {
  if (!CSS_NUMBER.test(value)) throw new Error(`${field} is not a CSS number`);
  return value.endsWith("%") ? { number: Number(value.slice(0, -1)), percent: true } : { number: Number(value), percent: false };
}

function channel(value, field) {
  const { number, percent } = cssNumber(value, field);
  const scaled = percent ? (number / 100) * 255 : number;
  if (!Number.isFinite(scaled) || scaled < 0 || scaled > 255) throw new Error(`${field} is out of range`);
  return scaled;
}

function alphaValue(value) {
  const { number, percent } = cssNumber(value, "alpha");
  const alpha = percent ? number / 100 : number;
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error("alpha is out of range");
  return alpha;
}

// Legacy comma syntax takes an optional fourth alpha; modern space syntax takes `/ alpha`.
function functionalParts(body, raw) {
  if (body.includes(",")) {
    if (body.includes("/")) throw new Error(`unsupported color ${raw}`);
    return body.split(",").map((part) => part.trim());
  }
  const [rgbPart, alphaPart, extra] = body.split("/");
  if (extra !== undefined) throw new Error(`unsupported color ${raw}`);
  const parts = rgbPart.trim().split(/\s+/);
  if (alphaPart !== undefined) {
    if (parts.length !== 3) throw new Error(`unsupported color ${raw}`);
    parts.push(alphaPart.trim());
  }
  return parts;
}

// Returns [r, g, b, alpha] or null for non-color keywords; throws on unparsable values.
export function parseColor(raw) {
  const value = String(raw).trim().toLowerCase();
  if (NON_COLORS.has(value)) return null;
  const hex = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((d) => d + d).join("") : hex[1];
    const bytes = digits.match(/../g).map((pair) => parseInt(pair, 16));
    return [bytes[0], bytes[1], bytes[2], bytes.length === 4 ? bytes[3] / 255 : 1];
  }
  const functional = value.match(/^rgba?\(([^)]*)\)$/);
  if (!functional) throw new Error(`unsupported color ${raw}`);
  const parts = functionalParts(functional[1].trim(), raw);
  if (parts.length < 3 || parts.length > 4 || parts.some((part) => !part)) throw new Error(`unsupported color ${raw}`);
  const alpha = parts.length === 4 ? alphaValue(parts[3]) : 1;
  return [channel(parts[0], "red"), channel(parts[1], "green"), channel(parts[2], "blue"), alpha];
}

function toLab([red, green, blue]) {
  const linear = [red, green, blue].map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const xyz = [
    (0.4124 * linear[0] + 0.3576 * linear[1] + 0.1805 * linear[2]) / 0.95047,
    0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2],
    (0.0193 * linear[0] + 0.1192 * linear[1] + 0.9505 * linear[2]) / 1.08883,
  ].map((v) => (v > 216 / 24389 ? Math.cbrt(v) : (24389 / 27 * v + 16) / 116));
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
}

export function deltaE(first, second) {
  const [a, b] = [toLab(first), toLab(second)];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function tokenPalette(tokens) {
  if (!tokens || typeof tokens.colors !== "object" || Array.isArray(tokens.colors)) {
    throw new Error("tokens must have a colors object");
  }
  const palette = Object.entries(tokens.colors).map(([name, value]) => {
    const color = parseColor(value);
    if (!color) throw new Error(`token ${name} is not a concrete color`);
    return { name, color };
  });
  if (!palette.length) throw new Error("tokens.colors is empty");
  return palette;
}

export function brandDrift(styles, tokens, maxDeltaE) {
  if (!styles || !Array.isArray(styles.declarations)) throw new Error("styles must have a declarations array");
  const palette = tokenPalette(tokens);
  const offPalette = [];
  let checked = 0;
  let unevaluated = 0;
  for (const declaration of styles.declarations) {
    if (!COLOR_PROPERTIES.has(String(declaration?.property).toLowerCase())) continue;
    let color;
    try {
      color = parseColor(declaration.value);
    } catch {
      unevaluated += 1;
      continue;
    }
    // Keywords and fully transparent colors paint nothing, so they are skipped.
    if (!color || color[3] === 0) continue;
    // A translucent color's rendered value depends on what is behind it, which is unknown here.
    if (color[3] < 1) {
      unevaluated += 1;
      continue;
    }
    checked += 1;
    const nearest = palette.map((token) => ({ token: token.name, distance: deltaE(color, token.color) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearest.distance > maxDeltaE) {
      offPalette.push({ selector: String(declaration.selector), property: declaration.property,
        value: declaration.value, nearestToken: nearest.token, deltaE: Number(nearest.distance.toFixed(2)) });
    }
  }
  if (!checked) throw new Error("no color declarations could be evaluated");
  return { colorsChecked: checked, unevaluatedValues: unevaluated, paletteSize: palette.length,
    offPaletteCount: offPalette.length, offPalette: offPalette.slice(0, MAX_LISTED) };
}
