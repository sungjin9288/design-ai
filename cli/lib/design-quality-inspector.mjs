import { validateDesignQualityReport } from "./design-quality-contract.mjs";
import { inspectProductReviewPack } from "./product-review-inspector.mjs";
import { loadProductReviewPack } from "./product-review-pack.mjs";

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);
const RAW_TEXT_ELEMENTS = new Set([
  "iframe", "listing", "noembed", "noframes", "script", "style", "textarea", "title", "xmp",
]);
const STATIC_INERT_ELEMENTS = new Set(["noscript", "template"]);
const SVG_HTML_INTEGRATION_POINTS = new Set(["desc", "foreignobject", "title"]);
const INVISIBLE_CHARACTER_REFERENCE_NAMES = new Set([
  "ApplyFunction", "InvisibleComma", "InvisibleTimes", "MediumSpace",
  "NegativeMediumSpace", "NegativeThickSpace", "NegativeThinSpace", "NegativeVeryThinSpace",
  "NewLine", "NoBreak", "NonBreakingSpace", "Tab",
  "ThickSpace", "ThinSpace", "VeryThinSpace", "ZeroWidthSpace",
  "emsp", "emsp13", "emsp14", "ensp", "hairsp", "ic", "it", "lrm",
  "af", "nbsp", "numsp", "puncsp", "rlm", "shy", "thinsp", "zwj", "zwnj",
]);

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requiredSource(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("source must be a non-empty string");
  }
  return value;
}

function uniqueTextList(value, field, fallback) {
  if (value === undefined) return [...fallback];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array`);
  }
  return [...new Set(value.map((item, index) => requiredText(item, `${field}[${index}]`)))];
}

function lineStarts(source) {
  const starts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function lineAt(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (starts[middle] <= offset) low = middle + 1;
    else high = middle - 1;
  }
  return high + 1;
}

function findTagEnd(source, start) {
  let quote = "";
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return index;
    }
  }
  return -1;
}

function parseAttributes(source) {
  const attributes = {};
  let index = 0;

  while (index < source.length) {
    while (/\s/.test(source[index] || "")) index += 1;
    if (index >= source.length || source[index] === "/") break;

    const nameStart = index;
    while (index < source.length && !/[\s=/>]/.test(source[index])) index += 1;
    const name = source.slice(nameStart, index).toLowerCase();
    if (!name) break;

    while (/\s/.test(source[index] || "")) index += 1;
    let value = "";
    if (source[index] === "=") {
      index += 1;
      while (/\s/.test(source[index] || "")) index += 1;
      const quote = source[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < source.length && source[index] !== quote) index += 1;
        value = source.slice(valueStart, index);
        if (source[index] === quote) index += 1;
      } else {
        const valueStart = index;
        while (index < source.length && !/[\s>]/.test(source[index])) index += 1;
        value = source.slice(valueStart, index);
      }
    }
    attributes[name] = value;
  }

  return attributes;
}

function parseTag(raw) {
  const text = raw.trim();
  if (!text || text.startsWith("!") || text.startsWith("?")) return null;

  const closing = text.startsWith("/");
  const body = closing ? text.slice(1).trimStart() : text;
  const match = body.match(/^([^\s/>]+)/);
  if (!match) return null;

  const name = match[1].toLowerCase();
  return {
    name,
    closing,
    selfClosing: !closing && (text.endsWith("/") || VOID_ELEMENTS.has(name)),
    attributes: closing ? {} : parseAttributes(body.slice(match[0].length)),
  };
}

function parseHtmlElements(source) {
  const lowerSource = source.toLowerCase();
  const starts = lineStarts(source);
  const elements = [];
  const stack = [];
  let cursor = 0;

  function addText(text) {
    const hidden = stack.some((element) => element.hidesDescendantText);
    for (const element of stack) {
      element.referenceText += text;
      if (!hidden) element.accessibleText += text;
    }
  }

  function closeFrom(index) {
    for (let stackIndex = stack.length - 1; stackIndex >= index; stackIndex -= 1) {
      elements.push(stack.pop());
    }
  }

  while (cursor < source.length) {
    const currentElement = stack.at(-1);
    const rawTextParent = currentElement?.name;
    if (rawTextParent === "plaintext") break;
    const htmlRawText = RAW_TEXT_ELEMENTS.has(rawTextParent)
      && !(rawTextParent === "title" && currentElement.inForeignContent);
    if (htmlRawText) {
      const closingStart = lowerSource.indexOf(`</${rawTextParent}`, cursor);
      if (closingStart === -1) {
        break;
      }
      cursor = closingStart;
    }

    const tagStart = source.indexOf("<", cursor);
    if (tagStart === -1) {
      addText(source.slice(cursor));
      break;
    }
    addText(source.slice(cursor, tagStart));

    if (source.startsWith("<!--", tagStart)) {
      const commentEnd = source.indexOf("-->", tagStart + 4);
      cursor = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }

    const tagEnd = findTagEnd(source, tagStart + 1);
    if (tagEnd === -1) {
      addText(source.slice(tagStart));
      break;
    }

    const tag = parseTag(source.slice(tagStart + 1, tagEnd));
    cursor = tagEnd + 1;
    if (!tag) continue;

    if (tag.closing) {
      const matchIndex = stack.findLastIndex((element) => element.name === tag.name);
      if (matchIndex !== -1) closeFrom(matchIndex);
      continue;
    }

    const parentElement = stack.at(-1);
    const parentUsesHtmlChildren = parentElement?.inForeignContent
      && SVG_HTML_INTEGRATION_POINTS.has(parentElement.name);
    const element = {
      name: tag.name,
      attributes: tag.attributes,
      line: lineAt(starts, tagStart),
      referenceText: "",
      accessibleText: "",
      labelAncestor: stack.findLast((ancestor) => ancestor.name === "label") || null,
      inForeignContent: tag.name === "math"
        || tag.name === "svg"
        || Boolean(parentElement?.inForeignContent && !parentUsesHtmlChildren),
      inert: stack.some((ancestor) => ancestor.inert) || STATIC_INERT_ELEMENTS.has(tag.name),
      inactive: stack.some((ancestor) => ancestor.inactive)
        || STATIC_INERT_ELEMENTS.has(tag.name)
        || Object.hasOwn(tag.attributes, "inert")
        || Object.hasOwn(tag.attributes, "hidden")
        || String(tag.attributes["aria-hidden"] || "").trim().toLowerCase() === "true",
      hidesDescendantText: String(tag.attributes["aria-hidden"] || "").trim().toLowerCase() === "true"
        || Object.hasOwn(tag.attributes, "inert")
        || Object.hasOwn(tag.attributes, "hidden"),
    };
    if (tag.selfClosing) {
      if (element.name === "img" && hasText(element.attributes.alt) && !element.hidesDescendantText) {
        addText(element.attributes.alt);
      }
      elements.push(element);
    }
    else stack.push(element);
  }

  closeFrom(0);
  return elements;
}

function hasText(value) {
  if (typeof value !== "string") return false;
  const decoded = value
    .replace(/&#x([0-9a-f]+);?/gi, (match, digits) => decodeCodePoint(match, Number.parseInt(digits, 16)))
    .replace(/&#([0-9]+);?/g, (match, digits) => decodeCodePoint(match, Number.parseInt(digits, 10)))
    .replace(/&([a-z][a-z0-9]+);/gi, (match, name) => (
      INVISIBLE_CHARACTER_REFERENCE_NAMES.has(name) ? " " : match
    ));
  return /[\p{L}\p{N}\p{P}\p{S}]/u.test(decoded);
}

function decodeCodePoint(fallback, codePoint) {
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}

function hasReferencedLabel(element, elementsById) {
  const references = String(element.attributes["aria-labelledby"] || "")
    .split(/\s+/)
    .filter(Boolean);
  return references.some((id) => hasText(elementsById.get(id)?.referenceText));
}

function hasAccessibleName(element, labelsByTarget, elementsById) {
  const attributes = element.attributes;
  if (hasText(attributes["aria-label"]) || hasText(attributes.title)) return true;
  if (hasReferencedLabel(element, elementsById)) return true;
  if (hasText(element.labelAncestor?.accessibleText)) return true;
  if (attributes.id && hasText(labelsByTarget.get(attributes.id))) return true;
  if (element.name === "button" && hasText(element.accessibleText)) return true;

  const type = String(attributes.type || "").toLowerCase();
  if (element.name === "input" && ["reset", "submit"].includes(type)) return true;
  if (element.name === "input" && type === "button") {
    return hasText(attributes.value);
  }
  if (element.name === "input" && type === "image") return hasText(attributes.alt);
  return false;
}

function evidence(reference, observation) {
  return { kind: "code", reference, observation };
}

function elementReference(sourceRef, element) {
  return `${sourceRef}:${element.line}`;
}

function accessibleNameFinding(sourceRef, element, index) {
  const location = elementReference(sourceRef, element);
  const field = element.name === "button" ? "button" : `${element.name} control`;
  return {
    id: `missing-accessible-name-${element.name}-${element.line}-${index + 1}`,
    lens: "accessibility",
    severity: "p1",
    status: "confirmed",
    title: `Give the ${field} a programmatic name`,
    location,
    before: `The ${field} has no associated label or supported accessible-name attribute.`,
    after: "Associate a visible label, or provide an accurate aria-label or aria-labelledby reference.",
    why: "Screen-reader and voice-control users need a stable programmatic name for every interactive control.",
    evidence: [evidence(location, `Static inspection found an unnamed <${element.name}> element.`)],
    verification: [
      "Inspect the accessibility tree and confirm the control exposes the intended name.",
      "Reach the control by keyboard and confirm its visible focus indicator remains present.",
    ],
  };
}

function imageAltFinding(sourceRef, element, index) {
  const location = elementReference(sourceRef, element);
  return {
    id: `missing-image-alt-${element.line}-${index + 1}`,
    lens: "accessibility",
    severity: "p1",
    status: "confirmed",
    title: "Declare image alternative text",
    location,
    before: "The image has no alt attribute, so its purpose is ambiguous to assistive technology.",
    after: "Add meaningful alt text, or alt=\"\" when the image is purely decorative.",
    why: "An explicit alt value distinguishes informative images from decoration.",
    evidence: [evidence(location, "Static inspection found an <img> element without an alt attribute.")],
    verification: [
      "Inspect the accessibility tree and confirm informative images expose the intended text alternative.",
      "Confirm decorative images are omitted from the accessibility tree.",
    ],
  };
}

function documentLanguageFinding(sourceRef, htmlElement) {
  const line = htmlElement?.line || 1;
  const location = `${sourceRef}:${line}`;
  return {
    id: "missing-document-language",
    lens: "accessibility",
    severity: "p2",
    status: "confirmed",
    title: "Declare the document language",
    location,
    before: "The root html element has no non-empty lang attribute.",
    after: "Set lang to the page's primary BCP 47 language tag, such as ko or ko-KR.",
    why: "Assistive technology uses the document language to choose pronunciation and reading rules.",
    evidence: [evidence(location, "Static inspection did not find a non-empty lang attribute on <html>.")],
    verification: ["Inspect the rendered document and confirm document.documentElement.lang matches the primary language."],
  };
}

function viewportFinding(sourceRef, viewport) {
  const location = viewport ? elementReference(sourceRef, viewport) : `${sourceRef}:head`;
  return {
    id: "missing-viewport-declaration",
    lens: "responsive-resilience",
    severity: "p2",
    status: "confirmed",
    title: "Declare the mobile viewport",
    location,
    before: "The document has no effective mobile viewport declaration.",
    after: "Add a viewport meta tag with width=device-width and an appropriate initial scale.",
    why: "Mobile browsers otherwise lay out the page against a wider virtual viewport, hiding real responsive behavior.",
    evidence: [evidence(location, viewport
      ? "Static inspection found a viewport meta tag without width=device-width."
      : "Static inspection did not find <meta name=\"viewport\">.")],
    verification: ["Open the page at a 390px viewport and confirm there is no unintended horizontal overflow."],
  };
}

function runtimeFinding(sourceRef) {
  return {
    id: "runtime-evidence-not-collected",
    lens: "response",
    severity: "p2",
    status: "unverified",
    title: "Collect interaction and runtime evidence",
    location: `runtime:${sourceRef}`,
    before: "The source was inspected without running the page, so interaction behavior is unknown.",
    after: "Exercise keyboard, repeated-action, loading, error, reduced-motion, and responsive scenarios in an approved browser run.",
    why: "Static markup cannot prove response timing, interruption safety, motion behavior, performance, or viewport resilience.",
    evidence: [{
      kind: "manual",
      reference: "quality-report.json#boundary",
      observation: "This inspection is read-only and does not start a browser or execute page scripts.",
    }],
    verification: [
      "Run the approved browser verification profile at every declared viewport.",
      "Attach runtime, accessibility, and screenshot evidence to the resulting findings.",
    ],
  };
}

function lens(id, status, summary, sourceRef, observation) {
  return { id, status, summary, evidence: [evidence(sourceRef, observation)] };
}

export function inspectHtml(source, options = {}) {
  const html = requiredSource(source);
  const sourceRef = requiredText(options.sourceRef, "sourceRef");
  const brief = requiredText(options.brief, "brief");
  const name = options.name === undefined ? sourceRef.split(/[\\/]/).at(-1) : requiredText(options.name, "name");
  const locale = options.locale === undefined ? "en" : requiredText(options.locale, "locale");
  const viewports = uniqueTextList(options.viewports, "viewports", ["mobile", "desktop"]);
  const generatedAt = options.generatedAt === undefined ? new Date().toISOString() : requiredText(options.generatedAt, "generatedAt");
  const reviewPack = options.reviewPack === undefined
    ? null
    : loadProductReviewPack(requiredText(options.reviewPack, "reviewPack"));
  const elements = parseHtmlElements(html);

  const elementsById = new Map(
    elements
      .filter((element) => !element.inert && hasText(element.attributes.id))
      .map((element) => [element.attributes.id, element]),
  );
  const labelsByTarget = new Map();
  for (const label of elements.filter((element) => !element.inactive && element.name === "label")) {
    const target = label.attributes.for;
    if (!hasText(target)) continue;
    labelsByTarget.set(target, `${labelsByTarget.get(target) || ""} ${label.accessibleText}`);
  }

  const findings = [];
  const htmlElement = elements.find((element) => element.name === "html" && !element.inert);
  const fullDocument = Boolean(htmlElement);
  if (fullDocument && !hasText(htmlElement.attributes.lang)) findings.push(documentLanguageFinding(sourceRef, htmlElement));

  const controls = elements.filter((element) => {
    if (!["button", "input", "select", "textarea"].includes(element.name)) return false;
    if (element.inactive) return false;
    return !(element.name === "input" && String(element.attributes.type || "").toLowerCase() === "hidden");
  });
  for (const [index, control] of controls.entries()) {
    if (!hasAccessibleName(control, labelsByTarget, elementsById)) {
      findings.push(accessibleNameFinding(sourceRef, control, index));
    }
  }

  for (const [index, image] of elements.filter((element) => element.name === "img" && !element.inactive).entries()) {
    if (!Object.hasOwn(image.attributes, "alt")) findings.push(imageAltFinding(sourceRef, image, index));
  }

  const viewport = elements.find((element) => (
    !element.inert
    && element.name === "meta"
    && String(element.attributes.name || "").toLowerCase() === "viewport"
  ));
  const hasViewport = Boolean(viewport && /(^|,)\s*width\s*=\s*device-width\s*(,|$)/i.test(viewport.attributes.content || ""));
  const mobileDeclared = viewports.some((viewport) => /mobile|phone|(^|\D)(320|360|375|390|412|414|430)(\D|$)/i.test(viewport));
  if (fullDocument && mobileDeclared && !hasViewport) findings.push(viewportFinding(sourceRef, viewport));
  if (reviewPack) {
    findings.push(...inspectProductReviewPack(reviewPack, {
      sourceRef,
      elements,
      labelsByTarget,
      elementsById,
    }));
  }
  findings.push(runtimeFinding(sourceRef));

  const accessibilityFindings = findings.filter((finding) => finding.lens === "accessibility" && finding.status === "confirmed");
  const responsiveFindings = findings.filter((finding) => finding.lens === "responsive-resilience" && finding.status === "confirmed");
  const confirmedFindings = findings.filter((finding) => finding.status === "confirmed").length;
  const unverifiedFindings = findings.filter((finding) => finding.status === "unverified").length;

  const report = {
    kind: "design-ai-quality-report",
    schemaVersion: 1,
    generatedAt,
    subject: { name, type: "page", source: sourceRef },
    context: { brief, routeId: "design-engineering-review", locale, viewports },
    boundary: {
      mode: "read-only",
      targetRepoMutation: false,
      externalWrites: false,
      localEvidenceWrites: false,
      localEvidencePath: null,
      notes: [
        "Only the supplied HTML source was inspected.",
        "No browser, script, stylesheet, linked resource, network request, or target file was executed or changed.",
      ],
    },
    sources: [
      evidence(sourceRef, `Inspected ${html.length} characters of supplied HTML with deterministic static rules.`),
      ...(reviewPack ? [{
        kind: "design-contract",
        reference: `product-packs/${reviewPack.id}.json#revision-${reviewPack.revision}`,
        observation: `Applied ${reviewPack.id} revision ${reviewPack.revision}. Static HTML criteria may be confirmed; browser and scenario criteria remain unverified.`,
      }] : []),
    ],
    lenses: [
      lens("purpose-frequency", "unverified", "Task purpose and real usage frequency require product or runtime evidence.", sourceRef, "Static HTML does not establish user intent or frequency."),
      lens("response", "unverified", "Activation feedback and state transitions were not executed.", sourceRef, "The inspector does not run event handlers or network requests."),
      lens("spatial-continuity", "unverified", "Rendered movement, overlays, and focus continuity were not observed.", sourceRef, "Static source does not prove rendered spatial continuity."),
      lens("interruptibility", "unverified", "Repeated action, cancellation, and in-flight behavior were not exercised.", sourceRef, "The inspector does not execute interactive scenarios."),
      lens("timing-cohesion", "unverified", "Motion timing and reduced-motion behavior require runtime evidence.", sourceRef, "Linked stylesheets and rendered animation are outside this static pass."),
      lens("performance", "unverified", "Runtime responsiveness and loading cost were not measured.", sourceRef, "No browser performance trace was collected."),
      lens(
        "accessibility",
        accessibilityFindings.length > 0 ? "fail" : "unverified",
        accessibilityFindings.length > 0
          ? `${accessibilityFindings.length} supported static accessibility defect(s) were confirmed.`
          : "Supported static naming checks found no defect, but keyboard and accessibility-tree behavior remain unverified.",
        sourceRef,
        `Checked document language, ${controls.length} interactive control(s), and image alt declarations.`,
      ),
      lens(
        "responsive-resilience",
        responsiveFindings.length > 0 ? "warning" : "unverified",
        responsiveFindings.length > 0
          ? "The document is missing a mobile viewport declaration."
          : "A viewport declaration exists, but layout, wrapping, and overflow remain unverified.",
        sourceRef,
        hasViewport
          ? "A viewport meta declaration is present."
          : fullDocument && mobileDeclared
            ? "No viewport meta declaration was found for declared mobile coverage."
            : "No mobile viewport contract was inferred from this source and context.",
      ),
    ],
    findings,
    summary: {
      status: accessibilityFindings.length > 0 ? "fail" : responsiveFindings.length > 0 ? "warning" : "unverified",
      confirmedFindings,
      unverifiedFindings,
      blockingFindings: 0,
      nextAction: confirmedFindings > 0
        ? "Fix the confirmed static findings, then collect the missing runtime evidence."
        : "Collect browser, accessibility-tree, keyboard, responsive, and performance evidence before implementation approval.",
    },
    approval: {
      status: "pending",
      requiredBefore: [
        "editing the target repository",
        "starting browser or accessibility verification",
        "publishing or deploying an implementation",
      ],
    },
  };

  return validateDesignQualityReport(report);
}
