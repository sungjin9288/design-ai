// Static checks for the interface-copy lens (P17D). They confirm only what the
// supplied HTML proves: a control label that names no result, an accessible name
// that drops the visible label, and Korean copy that mixes registers. Whether the
// copy serves the user's goal stays a reviewer judgment, so a clean pass leaves
// the lens unverified. The criteria are defined in
// knowledge/patterns/interface-copy.md.
const GENERIC_WORDS = new Set([
  "확인", "예", "네", "다음", "진행", "계속", "제출", "ok", "okay", "yes", "next", "submit", "continue", "proceed",
  "confirm", "click", "here", "여기를", "클릭",
]);
// Links such as "다음" or "더보기" are conventional in pagination and lists, so only
// link text that names nothing at all counts (WCAG 2.4.4 Link Purpose).
const GENERIC_LINK_WORDS = new Set(["click", "here", "여기를", "클릭", "여기"]);
// Register sampling stays conservative: headings are often stylistic fragments, and
// quotes, footers, and fine print legitimately use another register.
const TEXT_BLOCKS = new Set(["p", "li", "label", "button", "a", "td", "th", "dt", "dd", "caption", "figcaption", "legend", "summary"]);
const PUNCTUATION_REQUIRED = new Set(["li", "td", "th", "dt", "dd"]);
const EXCLUDED_ANCESTORS = new Set(["blockquote", "q", "footer", "small", "cite"]);
const NAMED_ENTITIES = Object.freeze({ nbsp: " ", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", hellip: "…", times: "×" });
const HANGUL = /[가-힣]/;
const HAPSYO_ENDINGS = ["니다", "니까", "시오", "시다"];
const NOUNS_ENDING_IN_YO = ["필요", "중요", "주요", "수요", "개요", "요요"];
const BANMAL_ENDINGS = ["했다", "었다", "았다", "한다", "는다", "된다", "있다", "없다", "했어", "었어", "았어",
  "렸어", "났어", "됐어", "졌어", "왔어", "갔어", "봤어", "겠어", "할게", "볼게", "줄게", "해 봐", "해 줘", "거야",
  "할래", "하자", "했니", "이야"];
// Only forms that cannot end a noun: 작업함, 보관함, and 모임 are common UI nouns.
const EUMSEUM_ENDINGS = ["있음", "없음", "했음", "였음", "었음", "았음", "됐음", "됨"];
const REGISTER_NAMES = Object.freeze({ haeyo: "해요체", hapsyo: "합쇼체", banmal: "반말", eumseum: "음슴체" });
const TERMINAL = /[.?!。]$/;

function safeCodePoint(fallback, codePoint) {
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&#x([0-9a-f]+);?/gi, (match, hex) => safeCodePoint(match, Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (match, dec) => safeCodePoint(match, Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function normalize(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

// Letters and digits only, for comparing a visible label with an accessible name.
function comparable(text) {
  return normalize(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function words(label) {
  return label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter(Boolean);
}

function endsWithAny(text, endings) {
  return endings.some((ending) => text.endsWith(ending));
}

// Classify one Korean sentence or clause; null for register-neutral fragments such
// as nouns and button labels. Mirrors tools/audit/interface-copy-contract.py.
export function koreanRegister(sentence) {
  const core = String(sentence).replace(/\([^)]*\)/g, "").trim();
  const ending = core.replace(/[^\p{L}\p{N}]+$/u, "");
  if (!HANGUL.test(ending.slice(-2))) return null;
  const fullSentence = ending.includes(" ") || /[.?!]$/.test(core);
  if (endsWithAny(ending, HAPSYO_ENDINGS)) return "hapsyo";
  if ((ending.endsWith("요") && !endsWithAny(ending, NOUNS_ENDING_IN_YO)) || ending.endsWith("죠")) return "haeyo";
  if (endsWithAny(ending, BANMAL_ENDINGS) || (fullSentence && ending.endsWith("다"))) return "banmal";
  if (fullSentence && endsWithAny(ending, EUMSEUM_ENDINGS)) return "eumseum";
  return null;
}

function visibleLabel(element) {
  if (element.name !== "input") return normalize(element.accessibleText);
  if (Object.hasOwn(element.attributes, "value")) return normalize(element.attributes.value);
  // Browsers render a default label for submit and reset buttons without a value.
  const type = String(element.attributes.type || "").toLowerCase();
  return type === "submit" ? "Submit" : type === "reset" ? "Reset" : "";
}

// The name ARIA gives the control: aria-labelledby wins over aria-label.
function ariaName(element, elementsById) {
  const references = String(element.attributes["aria-labelledby"] || "").split(/\s+/).filter(Boolean);
  if (references.length) return normalize(references.map((id) => elementsById?.get(id)?.referenceText || "").join(" "));
  return normalize(element.attributes["aria-label"]);
}

function finding(sourceRef, element, id, fields, index = 0) {
  const location = `${sourceRef}:${element.line}`;
  const { observation, ...rest } = fields;
  return {
    id: `${id}-${element.line}-${index + 1}`,
    lens: "interface-copy",
    status: "confirmed",
    location,
    evidence: [{ kind: "code", reference: location, observation }],
    ...rest,
  };
}

function genericLabelFinding(sourceRef, element, label, index) {
  return finding(sourceRef, element, "interface-copy-generic-label", {
    severity: "p2",
    title: "Name the result instead of a generic acknowledgement",
    before: `The control is labelled "${label}", which does not say what happens.`,
    after: "Use a label that names the result, such as the action and its object.",
    why: "Users, including screen-reader users who hear the control on its own, cannot predict what the control does.",
    observation: `Static inspection found a control whose visible label is "${label}".`,
    verification: ["Re-read the label without its surroundings and confirm it names the result."],
  }, index);
}

function labelInNameFinding(sourceRef, element, label, name, index) {
  return finding(sourceRef, element, "interface-copy-label-not-in-name", {
    severity: "p1",
    title: "Include the visible label in the accessible name",
    before: `The visible label is "${label}", but the accessible name is "${name}".`,
    after: `Put "${label}" in the accessible name, ideally at its start, or remove the ARIA name so the visible text names the control.`,
    why: "Voice-control users speak the visible label; a name that omits it breaks WCAG 2.5.3 Label in Name.",
    observation: `Static inspection found the accessible name "${name}" on a control labelled "${label}".`,
    verification: ["Confirm the accessibility tree name contains the visible label."],
  }, index);
}

function registerFinding(sourceRef, samples) {
  const [first, second] = samples;
  const names = samples.map((sample) => REGISTER_NAMES[sample.register]).join(", ");
  return finding(sourceRef, first.element, "interface-copy-mixed-korean-register", {
    severity: "p2",
    title: "Hold one Korean register across the screen",
    before: `The copy mixes ${names}, for example "${first.text}" and "${second.text}".`,
    after: "Rewrite every sentence in the product's register: 해요체 for consumer products or 합쇼체 for formal ones.",
    why: "Switching register inside one flow reads as inconsistent and can sound abrupt or overly stiff.",
    observation: `Static inspection found Korean sentences in ${samples.length} registers (lines ${samples.map((s) => s.element.line).join(", ")}).`,
    verification: ["Re-read every sentence on the screen and confirm each ends in the chosen register."],
  });
}

function controlFindings(sourceRef, controls, elementsById) {
  const found = [];
  for (const [index, control] of controls.entries()) {
    const label = visibleLabel(control);
    if (!comparable(label)) continue;
    const generic = control.name === "a" ? GENERIC_LINK_WORDS : GENERIC_WORDS;
    const labelWords = words(label);
    if (labelWords.length && labelWords.every((word) => generic.has(word))) {
      found.push(genericLabelFinding(sourceRef, control, label, index));
    }
    const name = ariaName(control, elementsById);
    if (name && !comparable(name).includes(comparable(label))) {
      found.push(labelInNameFinding(sourceRef, control, label, name, index));
    }
  }
  return found;
}

function sampled(element, sentence, register) {
  if (register === "eumseum" && !TERMINAL.test(sentence)) return false;
  return !PUNCTUATION_REQUIRED.has(element.name) || TERMINAL.test(sentence);
}

function registerSamples(elements) {
  const firstByRegister = new Map();
  for (const element of elements) {
    if (element.inactive || !TEXT_BLOCKS.has(element.name)) continue;
    if ((element.ancestorNames || []).some((name) => EXCLUDED_ANCESTORS.has(name))) continue;
    for (const sentence of normalize(element.accessibleText).split(/(?<=[.?!])\s+|,\s+/)) {
      const register = koreanRegister(sentence);
      if (register && !firstByRegister.has(register) && sampled(element, sentence, register)) {
        firstByRegister.set(register, { register, text: sentence, element });
      }
    }
  }
  return [...firstByRegister.values()].sort((a, b) => a.element.line - b.element.line);
}

function isControl(element) {
  if (element.inactive) return false;
  if (["button", "a"].includes(element.name) || String(element.attributes.role || "").toLowerCase() === "button") return true;
  return element.name === "input" && ["submit", "button", "reset"].includes(String(element.attributes.type || "").toLowerCase());
}

// Returns the confirmed interface-copy findings for one parsed document.
export function inspectInterfaceCopy({ sourceRef, elements, elementsById, locale, documentLanguage }) {
  const controls = elements.filter(isControl);
  const found = controlFindings(sourceRef, controls, elementsById);
  const korean = /^ko\b/i.test(String(documentLanguage || locale || ""));
  const samples = korean ? registerSamples(elements) : [];
  if (samples.length >= 2) found.push(registerFinding(sourceRef, samples));
  return { findings: found, controlsChecked: controls.length, koreanChecked: korean };
}
